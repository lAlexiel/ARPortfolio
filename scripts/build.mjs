import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildGallery, renderGalleryCard, renderCommissionExample, renderSocialButtons, validateCommissions, validateTranslations, termsTranslations, renderRichText } from './content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out')) throw Error('Usage: node scripts/build.mjs [--out directory]');
const output = args.length ? path.resolve(root, args[1]) : root;
const relative = path.relative(root, output);
if (relative.startsWith('..') || path.isAbsolute(relative) || relative.startsWith('assets') || relative.startsWith('content') || relative.startsWith('scripts') || relative.startsWith('.git')) throw Error('Build output must be the project root or a separate directory inside it');
const metadata = JSON.parse(await readFile(path.join(root, 'content', 'gallery-meta.json'), 'utf8'));
const commissions = validateCommissions(JSON.parse(await readFile(path.join(root, 'content', 'commissions.json'), 'utf8')));
const translations = JSON.parse(await readFile(path.join(root, 'content', 'translations.json'), 'utf8'));
const terms = termsTranslations(JSON.parse(await readFile(path.join(root, 'content', 'terms.json'), 'utf8')));
for (const language of ['en', 'es']) Object.assign(translations[language], terms[language]);
validateTranslations(translations);
const gallery = await buildGallery(root, metadata);
let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace(/(<em data-i18n-rich="(terms\.[^"]+)">)[\s\S]*?(<\/em>)/g, (_, open, key, close) => open + renderRichText(translations.en[key]) + close);
html = html.replace(/(<em data-i18n="(terms\.[^"]+)">)[\s\S]*?(<\/em>)/g, (_, open, key, close) => open + renderRichText([translations.en[key]]) + close);
html = html.replace(/(<td data-rate="([\w.]+)"[^>]*>)[\s\S]*?(<\/td>)/g, (_, open, rate, close) => {
  const [group, key] = rate.split('.');
  const value = commissions.rates[group][key];
  const label = value === null || value === '' ? translations.en['commissions.unconfirmed']
    : typeof value === 'number' ? `${key === 'background' || group === 'extras' ? '+' : ''}${new Intl.NumberFormat('en-US', { style: 'currency', currency: commissions.currency }).format(value)}`
    : typeof value === 'string' ? value : value.en;
  return open + renderRichText([label]) + close;
});
const socialMarker = /<!-- SOCIAL:START -->[\s\S]*?<!-- SOCIAL:END -->/g;
if ([...html.matchAll(socialMarker)].length !== 2) throw Error('Home and Commission Info social button markers are missing');
html = html.replace(socialMarker, () => `<!-- SOCIAL:START -->\n${renderSocialButtons(commissions.socialLinks)}\n              <!-- SOCIAL:END -->`);
const marker = /<!-- GALLERY:START -->[\s\S]*?<!-- GALLERY:END -->/;
if (!marker.test(html)) throw Error('Gallery generation markers are missing');
const cards = gallery.map(renderGalleryCard).join('\n');
html = html.replace(marker, () => `<!-- GALLERY:START -->\n${cards}\n            <!-- GALLERY:END -->`);
const exampleMarker = /<!-- EXAMPLES:START -->[\s\S]*?<!-- EXAMPLES:END -->/;
if (!exampleMarker.test(html)) throw Error('Commission example generation markers are missing');
let samples = commissions.examples.map(filename => gallery.find(work => work.src === `assets/gallery/${encodeURIComponent(filename)}`)).filter(Boolean);
if (!samples.length) samples = gallery.slice(0, 3);
html = html.replace(exampleMarker, () => `<!-- EXAMPLES:START -->\n${samples.map(renderCommissionExample).join('\n')}\n          <!-- EXAMPLES:END -->`);
html = html.replace(/(<span id="gallery-count"[^>]*>)[\s\S]*?(<\/span>)/, `$1${gallery.length} ${gallery.length === 1 ? 'work' : 'works'}$2`);
const generated = JSON.stringify({ gallery, commissions, translations }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
const bundles = ['styles.css', 'views.css', 'themes.css', 'theme.js', 'paint.css', 'paint.js', 'app.js', 'windows.js', 'dream.css', 'dream.js'];
const versions = Object.fromEntries(await Promise.all(bundles.map(async filename => [filename, hash(await readFile(path.join(root, filename)))])));
versions['content-data.js'] = hash(generated);
html = html.replace(/(src|href)="(styles\.css|views\.css|themes\.css|theme\.js|paint\.css|paint\.js|app\.js|windows\.js|dream\.css|dream\.js|content-data\.js)(?:\?[^\"]*)?"/g, (match, attribute, filename) => `${attribute}="${filename}?v=${versions[filename]}"`);
// Replacing Home artwork at the same filename must also refresh cached images.
for (const filename of ['assets/floral-portrait.jpg', 'assets/strawberry-portrait.jpg']) {
  const version = hash(await readFile(path.join(root, filename)));
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`src="${escaped}(?:\\?[^\"]*)?"`, 'g'), `src="${filename}?v=${version}"`);
}
await mkdir(output, { recursive: true });
if (output !== root) {
  for (const filename of bundles) await cp(path.join(root, filename), path.join(output, filename));
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
}
await writeFile(path.join(output, 'index.html'), html, 'utf8');
await writeFile(path.join(output, 'content-data.js'), `// Generated by scripts/build.mjs; edit content files or numbered artwork instead.\nwindow.ANGIE_CONTENT = ${generated};\n`, 'utf8');
await writeFile(path.join(output, '.nojekyll'), '', 'utf8');
console.log(`Built ${gallery.length} naturally ordered artworks and all four views in ${output}`);
