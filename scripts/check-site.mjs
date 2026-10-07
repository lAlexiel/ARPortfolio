import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { validateTranslations } from './content.mjs';

const root = path.resolve(process.argv[2] || '.');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw Error('Duplicate HTML/SVG IDs');
for (const [, id] of html.matchAll(/<use href="#([^"]+)"/g)) if (!ids.includes(id)) throw Error(`Missing SVG symbol: ${id}`);
for (const [, id] of html.matchAll(/url\(#([\w-]+)\)/g)) if (!ids.includes(id)) throw Error(`Missing SVG mask/filter: ${id}`);
const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]);
for (const filename of ['styles.css', 'views.css']) {
  const css = await readFile(path.join(root, filename), 'utf8');
  references.push(...[...css.matchAll(/url\("([^"]+)"\)/g)].map(match => match[1]));
}
async function checkAsset(reference) {
  if (/^(https?:|data:|mailto:|#)/i.test(reference)) return;
  const filename = decodeURIComponent(reference.split(/[?#]/)[0]);
  const absolute = path.resolve(root, filename);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error(`Asset outside publication folder: ${reference}`);
  await access(absolute).catch(() => { throw Error(`Missing asset: ${reference}`); });
}
await Promise.all(references.map(checkAsset));
const generated = await readFile(path.join(root, 'content-data.js'), 'utf8');
const json = generated.match(/window\.ANGIE_CONTENT = ([\s\S]*);\s*$/);
if (!json) throw Error('Generated content is missing');
const content = JSON.parse(json[1]);
validateTranslations(content.translations);
for (const [, key] of html.matchAll(/\bdata-i18n(?:-rich|-aria-label|-alt|-content)?="([^"]+)"/g)) {
  if (!Object.hasOwn(content.translations.en, key) || !Object.hasOwn(content.translations.es, key)) throw Error(`Missing translation: ${key}`);
}
await Promise.all(content.gallery.flatMap(work => [checkAsset(work.src), checkAsset(work.thumbnail || work.src)]));
if ([...html.matchAll(/class="artwork-card"/g)].length !== content.gallery.length) throw Error('Gallery cards and generated data differ');
const stack = [];
const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
  if (!match[1]) continue;
  const tag = match[1].toLowerCase();
  if (match[0].startsWith('</')) {
    const previous = stack.pop();
    if (previous !== tag) throw Error(`Unbalanced markup: ${previous} / ${tag}`);
  } else if (!voids.has(tag) && !match[0].endsWith('/>')) stack.push(tag);
}
if (stack.length) throw Error(`Unclosed markup: ${stack.join(', ')}`);
console.log(`PASS: ${content.gallery.length} artwork entries, both languages, generated data, local assets, HTML/SVG nesting, IDs, and masks in ${root}`);
