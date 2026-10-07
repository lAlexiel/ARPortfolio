import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { termsTranslations, renderRichText } from '../scripts/content.mjs';

test('themes persist, reject unknown choices, and Retry restores the original palette without requiring storage', () => {
  function fixture(saved, blocked = false) {
    const store = new Map([['angie-rouge-theme', saved]]);
    const element = dataset => ({ dataset, attributes: {}, events: {}, setAttribute(key, value) { this.attributes[key] = value; }, addEventListener(type, callback) { this.events[type] = callback; } });
    const buttons = ['lavender', 'aqua', 'pink', 'silver'].map(theme => element({ themeChoice: theme }));
    const retry = element({});
    const document = { documentElement: { dataset: {} }, querySelectorAll: () => buttons, getElementById: () => retry };
    const window = { localStorage: { getItem(key) { if (blocked) throw Error(); return store.get(key); }, setItem(key, value) { if (blocked) throw Error(); store.set(key, value); } } };
    vm.runInNewContext(fs.readFileSync(new URL('../theme.js', import.meta.url), 'utf8'), { document, window });
    return { document, buttons, retry, store };
  }
  const page = fixture('pink');
  assert.equal(page.document.documentElement.dataset.theme, 'pink');
  page.buttons[1].events.click();
  assert.equal(page.store.get('angie-rouge-theme'), 'aqua');
  assert.equal(page.buttons[1].attributes['aria-pressed'], 'true');
  assert.equal(page.buttons[2].attributes['aria-pressed'], 'false');
  page.retry.events.click();
  assert.equal(page.document.documentElement.dataset.theme, 'lavender');
  assert.equal(page.store.get('angie-rouge-theme'), 'lavender');
  assert.equal(fixture('__proto__').document.documentElement.dataset.theme, 'lavender');
  const blocked = fixture('pink', true);
  blocked.buttons[3].events.click();
  assert.equal(blocked.document.documentElement.dataset.theme, 'silver');
});

test('editable Terms accept plain text and emphasis, preserve both languages, and escape markup', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../content/terms.json', import.meta.url), 'utf8'));
  data.en.wait = 'An edited wait-time policy <script>alert(1)</script>';
  data.es.wait = 'Una política editada';
  const merged = termsTranslations(data);
  assert.deepEqual(merged.en['terms.wait'], [data.en.wait]);
  assert.deepEqual(merged.es['terms.wait'], [data.es.wait]);
  assert.ok(renderRichText(merged.en['terms.wait']).includes('&lt;script&gt;'));
  assert.equal(renderRichText(['Pay ', { strong: '50%' }]), 'Pay <strong>50%</strong>');
  data.en.payment = [{ html: '<img src=x>' }];
  assert.throws(() => termsTranslations(data), /Invalid Terms paragraph/);
  delete data.es.title;
  assert.throws(() => termsTranslations(data), /Invalid Terms/);
});

test('editing only terms.json updates the published HTML and bilingual runtime data on rebuild', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'angie-terms-build-'));
  try {
    for (const name of ['scripts', 'content', 'assets', 'index.html', 'styles.css', 'views.css', 'themes.css', 'theme.js', 'paint.css', 'paint.js', 'app.js', 'windows.js', 'dream.css', 'dream.js']) {
      fs.cpSync(new URL('../' + name, import.meta.url), path.join(temporary, name), { recursive: true });
    }
    const filename = path.join(temporary, 'content', 'terms.json');
    const terms = JSON.parse(fs.readFileSync(filename, 'utf8'));
    terms.en.wait = 'Updated English policy <b>as plain text</b>';
    terms.es.wait = 'Política actualizada en español';
    fs.writeFileSync(filename, JSON.stringify(terms));
    const build = spawnSync(process.execPath, [path.join(temporary, 'scripts', 'build.mjs'), '--out', '_site'], { encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr);
    const html = fs.readFileSync(path.join(temporary, '_site', 'index.html'), 'utf8');
    assert.ok(html.includes('Updated English policy &lt;b&gt;as plain text&lt;/b&gt;'));
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(temporary, '_site', 'content-data.js'), 'utf8'), context);
    assert.equal(context.window.ANGIE_CONTENT.translations.en['terms.wait'][0], terms.en.wait);
    assert.equal(context.window.ANGIE_CONTENT.translations.es['terms.wait'][0], terms.es.wait);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
