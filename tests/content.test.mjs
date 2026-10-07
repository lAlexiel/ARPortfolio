import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildGallery, renderGalleryCard, renderCommissionExample, validateCommissions, validateTranslations } from '../scripts/content.mjs';
import { commissionFixture } from './fixtures.mjs';

test('numbered uploads are discovered, naturally ordered, and safely encoded', async () => {
  const tempBase = path.resolve(os.tmpdir());
  const root = await mkdtemp(path.join(tempBase, 'angie-gallery-test-'));
  try {
    const dir = path.join(root, 'assets', 'gallery');
    await mkdir(dir, { recursive: true });
    for (const name of ['10.jpg', '2.png', '1-first.jpeg', '08 odd#.webp', 'unnumbered.jpg', 'README.md']) await writeFile(path.join(dir, name), 'fixture');
    await mkdir(path.join(dir, '03-folder.png'));
    const works = await buildGallery(root, { '2.png': { title: '<script>unsafe</script>', titleEs: 'Retrato personalizado', category: 'Portraits', alt: 'A "quoted" drawing', altEs: 'Un retrato' } });
    assert.deepEqual(works.map(work => work.number), ['1','2','08','10']);
    assert.equal(works[2].src, 'assets/gallery/08%20odd%23.webp');
    assert.equal(works[3].title, 'Artwork 10');
    assert.equal(works[3].titleEs, 'Obra 10');
    assert.equal(works[3].altEs, 'Obra 10, de Angie Rouge');
    assert.equal(works[1].titleEs, 'Retrato personalizado');
    assert.equal(works[3].category, 'Illustrations');
    assert.equal(works[1].category, 'Portraits');
    const card = renderGalleryCard(works[1]);
    assert.ok(!card.includes('<script>'));
    assert.ok(card.includes('&lt;script&gt;'));
    assert.ok(card.includes('&quot;quoted&quot;'));
    assert.ok(!renderCommissionExample(works[1]).includes('<script>'));
    await rm(path.join(dir, '10.jpg'));
    assert.equal((await buildGallery(root)).length, 3, 'Removed files disappear on the next build');
  } finally {
    if (path.dirname(root) !== tempBase || !path.basename(root).startsWith('angie-gallery-test-')) throw Error('Unexpected test cleanup path');
    await rm(root, { recursive: true, force: true });
  }
});

test('commission configuration accepts real data while rejecting unusable rates and links', async () => {
  const initial = structuredClone(commissionFixture);
  assert.equal(validateCommissions(initial).contacts.length, 0);
  const numeric = structuredClone(initial);
  numeric.rates.headshot.simple = 25;
  assert.throws(() => validateCommissions(numeric), /Invalid rate/);
  numeric.currency = 'EUR';
  assert.equal(validateCommissions(numeric).rates.headshot.simple, 25);
  numeric.rates.headshot.simple = -1;
  assert.throws(() => validateCommissions(numeric), /Invalid rate/);
  const bad = structuredClone(initial);
  bad.contacts = [{ label: 'Contact', url: 'javascript:alert(1)' }];
  assert.throws(() => validateCommissions(bad), /https or mailto/);
  bad.contacts = [{ label: 'Email', url: 'mailto:artist@example.invalid' }];
  assert.equal(validateCommissions(bad).contacts.length, 1);
  bad.acceptedSubjects = [''];
  assert.throws(() => validateCommissions(bad), /nonempty/);
  const bilingual = structuredClone(initial);
  bilingual.acceptedSubjects = [{ en: 'Original characters', es: 'Personajes originales' }];
  bilingual.rates.headshot.simple = { en: 'Custom quote', es: 'Cotización personalizada' };
  assert.equal(validateCommissions(bilingual).acceptedSubjects.length, 1);
  bilingual.acceptedSubjects[0].es = '';
  assert.throws(() => validateCommissions(bilingual), /nonempty/);
  const social = structuredClone(initial);
  social.socialLinks = { instagram: 'https://www.instagram.com/r.ougx/', x: 'https://x.com/AngieReygadas', paypal: null };
  assert.equal(validateCommissions(social).socialLinks.paypal, null);
  social.socialLinks.instagram = 'javascript:alert(1)';
  assert.throws(() => validateCommissions(social), /Social URLs must use https/);
  social.socialLinks.instagram = 'https://user:password@example.invalid/profile';
  assert.throws(() => validateCommissions(social), /without credentials/);
});

test('both languages cover all source annotations, preserve English Terms, and reject incomplete messages', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const translations = JSON.parse(await readFile(new URL('../content/translations.json', import.meta.url), 'utf8'));
  validateTranslations(translations);
  for (const [, key] of html.matchAll(/\bdata-i18n(?:-rich|-aria-label|-alt|-content)?="([^"]+)"/g)) {
    assert.ok(Object.hasOwn(translations.en, key), `Missing English: ${key}`);
    assert.ok(Object.hasOwn(translations.es, key), `Missing Spanish: ${key}`);
  }
  for (const [, key, body] of html.matchAll(/<em data-i18n-rich="([^"]+)">([\s\S]*?)<\/em>/g)) {
    assert.equal(translations.en[key].map(chunk => typeof chunk === 'string' ? chunk : chunk.strong).join(''), body.replace(/<[^>]*>/g, ''), `English Terms changed at ${key}`);
  }
  for (const work of Object.values(JSON.parse(await readFile(new URL('../content/gallery-meta.json', import.meta.url), 'utf8')))) {
    assert.ok(work.titleEs && work.altEs, 'Initial drawings have Spanish titles and accessible descriptions');
  }
  const missing = structuredClone(translations);
  delete missing.es['nav.home'];
  assert.throws(() => validateTranslations(missing), /keys must match/);
  const placeholder = structuredClone(translations);
  placeholder.es['gallery.enlarge'] = 'Ampliar {wrong}';
  assert.throws(() => validateTranslations(placeholder), /placeholders must match/);
  const markup = structuredClone(translations);
  markup.es['terms.wait'] = [{ html: '<img src=x>' }];
  assert.throws(() => validateTranslations(markup), /Invalid translation/);
  assert.ok(html.includes('role="switch"'));
  assert.ok(html.includes('assets/flag-us.svg') && html.includes('assets/flag-mx.svg'));
});

test('all supplied Terms paragraphs are preserved verbatim', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const actual = [...html.matchAll(/<p class="terms-copy">([\s\S]*?)<\/p>/g)].map(match => match[1].replace(/<[^>]*>/g, ''));
  assert.deepEqual(actual, [
    'It may take 1 day to process your order, but the wait time after is from 3-4 days. With extra revisions, the time may increase.Usually the commission finish time is a month, but can increase with negotiations (please tell beforehand if there is a deadline)',
    '・50/50 transaction. 50% after confirmation that the illustration is gonna be made, and 50% after I have finished it.・For the sake of not getting scammed, I will send a very censored sample to show the art is ready, and I will not send the uncensored picture until you have sent the remaining 50%.・This system makes sure that both the artist and patron are not getting cheated.・Revisions after a completed piece will be priced.The payment will be through PayPal.',
    '・All commissioned art will hold my signature.・My signature shall not be removed.・The art cannot be resold, printed or any profit being made off of it unless I state it is okay ( the price will change then).・The commissions may be on my portfolio'
  ]);
  assert.ok(!html.includes('<form'), 'No commission submission or checkout form was requested');
});
