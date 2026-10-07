import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commissionFixture as commissions, galleryFixture as gallery } from './fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const translations = JSON.parse(fs.readFileSync(path.join(root, 'content', 'translations.json'), 'utf8'));

function fixture(hash = '#home', options = {}) {
  const listeners = target => {
    target.events = {};
    target.addEventListener = (type, callback) => (target.events[type] ??= []).push(callback);
    target.emit = (type, event = {}) => target.events[type]?.forEach(callback => callback(event));
    return target;
  };
  const document = listeners({ hidden: false, title: '', activeElement: null });
  function node(dataset = {}) {
    const classes = new Set();
    return listeners({ dataset, hidden: false, textContent: '', attributes: {}, children: [], isConnected: true,
      classList: { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key), toggle(key, on) { if (on) classes.add(key); else classes.delete(key); } },
      setAttribute(key, value) { this.attributes[key] = value; }, getAttribute(key) { return this.attributes[key]; }, removeAttribute(key) { delete this.attributes[key]; },
      replaceChildren(...children) { this.children = children; }, focus() { document.activeElement = this; },
      getBoundingClientRect() { return { left: 100, top: 100, right: 600, bottom: 600, width: 500, height: 500 }; }
    });
  }
  const nodes = Object.fromEntries(['home-view','gallery-view','commissions-view','terms-view','main','year','artwork-dialog','lightbox-image','lightbox-title','lightbox-position','lightbox-original','lightbox-previous','lightbox-next','lightbox-close','gallery-count','gallery-empty','gallery-filters','rates-note','commission-contacts','accepted-subjects','declined-subjects','language-switch','language-window','language-status'].map(id => [id, node()]));
  const dialog = nodes['artwork-dialog'];
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; nodes['lightbox-close'].focus(); };
  dialog.close = () => { dialog.open = false; dialog.emit('close'); };
  const links = ['home','gallery','commissions','terms'].map(view => node({ view }));
  const filters = ['all','illustrations','portraits'].map(filter => node({ filter }));
  const cards = gallery.map(work => node({ category: work.category.toLowerCase() }));
  const artLinks = gallery.map(work => { const anchor = node({ artwork: work.src }); anchor.closest = () => nodes['gallery-view']; return anchor; });
  const example = node({ artwork: gallery[0].src });
  example.closest = () => null;
  artLinks.push(example);
  const rates = Object.entries(commissions.rates).flatMap(([group, values]) => Object.keys(values).map(key => node({ rate: `${group}.${key}` })));
  const languages = ['en', 'es'].map(language => node({ language }));
  // Use the real source annotations so every view's translation participates.
  const textTargets = [...html.matchAll(/\bdata-i18n="([^"]+)"/g)].map(match => node({ i18n: match[1] }));
  const richTargets = [...html.matchAll(/\bdata-i18n-rich="([^"]+)"/g)].map(match => node({ i18nRich: match[1] }));
  const attrTargets = {};
  for (const attribute of ['aria-label', 'alt', 'content']) attrTargets[attribute] = [...html.matchAll(new RegExp(`\\bdata-i18n-${attribute}="([^"]+)"`, 'g'))].map(match => {
    const target = node(); target.setAttribute(`data-i18n-${attribute}`, match[1]); return target;
  });
  const artTargets = {};
  for (const field of ['title', 'file', 'category', 'sample', 'alt']) artTargets[field] = gallery.map(work => {
    const target = node(); target.setAttribute(`data-artwork-${field}`, work.src); return target;
  });
  const stage = node();
  stage.props = {};
  stage.style = { setProperty(key, value) { stage.props[key] = value; } };
  const reduceQuery = listeners({ matches: !!options.reduced });
  const fineQuery = listeners({ matches: options.fine !== false });
  const frames = new Map();
  let frameId = 0;
  document.body = node();
  document.documentElement = { lang: 'en' };
  document.getElementById = id => { assert.ok(nodes[id], `Missing fixture ID ${id}`); return nodes[id]; };
  document.querySelector = selector => selector === '.art-stage' ? stage : null;
  document.querySelectorAll = selector => {
    const translatedAttribute = selector.match(/^\[data-i18n-(aria-label|alt|content)\]$/)?.[1];
    const artField = selector.match(/^\[data-artwork-(title|file|category|sample|alt)\]$/)?.[1];
    return attrTargets[translatedAttribute] || artTargets[artField] || ({ '[data-view]': links, '[data-filter]': filters, '.artwork-card': cards, '[data-artwork]': artLinks, '[data-rate]': rates, '[data-language]': languages, '[data-i18n]': textTargets, '[data-i18n-rich]': richTargets })[selector] || [];
  };
  document.createElement = tag => Object.assign(node(), { tagName: tag });
  document.createTextNode = text => Object.assign(node(), { tagName: '#text', textContent: text });
  const storage = options.storage || new Map(options.savedLanguage ? [['angie-rouge-language', options.savedLanguage]] : []);
  const window = listeners({ location: { hash }, ANGIE_CONTENT: { gallery, commissions: options.commission || commissions, translations }, scrollTo() {},
    localStorage: {
      getItem(key) { if (options.blockedStorage) throw Error('Storage blocked'); return storage.get(key); },
      setItem(key, value) { if (options.blockedStorage) throw Error('Storage blocked'); storage.set(key, value); }
    },
    matchMedia: query => query.includes('reduced-motion') ? reduceQuery : fineQuery,
    requestAnimationFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; }, cancelAnimationFrame: id => frames.delete(id)
  });
  vm.runInNewContext(js, { document, window, Date, Object, Math, Intl });
  return { nodes, links, filters, cards, artLinks, rates, languages, textTargets, richTargets, attrTargets, artTargets, storage, document, window, dialog, stage, reduceQuery, fineQuery, frames,
    go(hash) { window.location.hash = hash; window.emit('hashchange'); },
    click(target, extra = {}) { let prevented = false; target.emit('click', { button: 0, preventDefault() { prevented = true; }, ...extra }); return prevented; },
    key(key) { dialog.emit('keydown', { key, preventDefault() {} }); },
    flush() { for (const [id, callback] of frames) { frames.delete(id); callback(); } }
  };
}

test('routes replace content, support direct links/history, and update active navigation', () => {
  const f = fixture();
  for (const route of ['gallery','commissions','terms','home']) {
    f.go(`#${route}`);
    assert.deepEqual(['home','gallery','commissions','terms'].filter(view => !f.nodes[`${view}-view`].hidden), [route]);
    assert.equal(f.links.filter(link => link.attributes['aria-current'] === 'page').length, 1);
    assert.equal(f.links.find(link => link.dataset.view === route).attributes['aria-current'], 'page');
    assert.equal(f.document.activeElement, f.nodes.main);
  }
  for (const hash of ['#unknown','#__proto__','#constructor','#<img src=x>']) {
    const invalid = fixture(hash);
    assert.equal(invalid.nodes['home-view'].hidden, false);
    assert.equal(invalid.document.title, 'Angie Rouge — Illustrator');
  }
  assert.equal(fixture('#terms').nodes['terms-view'].hidden, false);
});

test('the language switch translates every view, rich Terms, metadata, and the open gallery without resetting state', () => {
  const f = fixture('#gallery');
  f.click(f.filters[2]);
  f.click(f.artLinks[0]);
  f.key('ArrowRight');
  const currentSource = f.nodes['lightbox-image'].src;
  f.nodes['language-switch'].focus();
  f.click(f.nodes['language-switch']);
  assert.equal(f.document.documentElement.lang, 'es');
  assert.equal(f.window.location.hash, '#gallery');
  assert.equal(f.nodes['gallery-view'].hidden, false);
  assert.equal(f.filters[2].attributes['aria-pressed'], 'true');
  assert.equal(f.nodes['gallery-count'].textContent, '2 obras');
  assert.equal(f.nodes['language-switch'].attributes['aria-checked'], 'true');
  assert.equal(f.languages[1].attributes['aria-pressed'], 'true');
  assert.equal(f.document.activeElement, f.nodes['language-switch']);
  assert.equal(f.dialog.open, true);
  assert.equal(f.nodes['lightbox-image'].src, currentSource);
  assert.equal(f.nodes['lightbox-title'].textContent, gallery[2].titleEs);
  assert.equal(f.nodes['lightbox-image'].alt, gallery[2].altEs);
  assert.equal(f.artLinks[0].attributes['aria-label'], 'Ampliar Retrato uno');
  assert.equal(f.artTargets.category[0].textContent, 'Retratos');
  assert.equal(f.artTargets.sample[0].textContent, 'Retratos · muestra del portafolio');
  assert.equal(f.artTargets.alt[0].attributes.alt, 'Primer retrato');
  assert.ok(f.rates.every(cell => cell.textContent === 'Por confirmar'));
  for (const target of f.textTargets) assert.equal(target.textContent, translations.es[target.dataset.i18n]);
  for (const [attribute, targets] of Object.entries(f.attrTargets)) for (const target of targets) assert.equal(target.attributes[attribute], translations.es[target.attributes[`data-i18n-${attribute}`]]);
  for (const target of f.richTargets) {
    const chunks = translations.es[target.dataset.i18nRich];
    assert.equal(target.children.map(child => child.textContent).join(''), chunks.map(chunk => typeof chunk === 'string' ? chunk : chunk.strong).join(''));
    assert.equal(target.children.filter(child => child.tagName === 'strong').length, chunks.filter(chunk => typeof chunk !== 'string').length);
  }
  assert.equal(f.nodes['language-status'].textContent, 'Idioma: español');
  f.click(f.languages[0]);
  assert.equal(f.nodes['gallery-count'].textContent, '2 works');
  assert.equal(f.nodes['lightbox-title'].textContent, gallery[2].title);
  assert.equal(f.nodes['language-switch'].attributes['aria-checked'], 'false');
});

test('language preference survives a reload, invalid preferences fall back, and blocked storage stays usable', () => {
  const f = fixture();
  f.click(f.languages[1]);
  const reloaded = fixture('#terms', { storage: f.storage });
  assert.equal(reloaded.document.documentElement.lang, 'es');
  assert.equal(reloaded.document.title, 'Términos del servicio — Angie Rouge');
  assert.equal(reloaded.nodes['language-status'].textContent, '', 'Initial loading does not announce a user action');
  assert.equal(reloaded.nodes['language-window'].hidden, false);
  reloaded.go('#commissions');
  assert.equal(reloaded.document.title, 'Información de comisiones — Angie Rouge');
  assert.equal(fixture('#home', { savedLanguage: '__proto__' }).document.documentElement.lang, 'en');
  const blocked = fixture('#home', { blockedStorage: true });
  assert.doesNotThrow(() => blocked.click(blocked.nodes['language-switch']));
  assert.equal(blocked.document.documentElement.lang, 'es');
  blocked.click(blocked.nodes['language-switch']);
  assert.equal(blocked.document.documentElement.lang, 'en');
});

test('bilingual commission data changes labels and price formatting without changing currency or interpreting HTML', () => {
  const data = structuredClone(commissions);
  data.currency = 'EUR';
  data.rates.headshot.simple = 25;
  data.rates.headshot.full = { en: 'Custom quote', es: 'Cotización personalizada' };
  data.contacts = [{ label: { en: 'Email', es: 'Correo' }, url: 'mailto:artist@example.invalid' }];
  data.acceptedSubjects = [{ en: 'Original characters', es: 'Personajes originales' }];
  data.declinedSubjects = [{ en: '<script>plain text</script>', es: '<img src=x>solo texto' }];
  const f = fixture('#commissions', { commission: data });
  f.click(f.languages[1]);
  assert.equal(f.rates[0].textContent, new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'EUR' }).format(25));
  assert.equal(f.rates[1].textContent, 'Cotización personalizada');
  assert.equal(f.nodes['commission-contacts'].children[0].textContent, 'Correo ↗');
  assert.equal(f.nodes['accepted-subjects'].children[0].textContent, 'Personajes originales');
  assert.equal(f.nodes['declined-subjects'].children[0].textContent, '<img src=x>solo texto');
  f.click(f.languages[0]);
  assert.equal(f.nodes['accepted-subjects'].children[0].textContent, 'Original characters');
});

test('gallery filters and lightbox use the visible collection with keyboard navigation and focus restoration', () => {
  const f = fixture('#gallery');
  f.click(f.filters[2]);
  const portraits = gallery.filter(work => work.category === 'Portraits');
  assert.equal(f.cards.filter(card => !card.hidden).length, portraits.length);
  assert.equal(f.nodes['gallery-count'].textContent, `${portraits.length} works`);
  assert.equal(f.filters[2].attributes['aria-pressed'], 'true');
  const anchor = f.artLinks[gallery.findIndex(work => work.src === portraits[0].src)];
  assert.equal(f.click(anchor), true);
  assert.equal(f.dialog.open, true);
  assert.equal(f.nodes['lightbox-image'].src, portraits[0].src);
  assert.equal(f.nodes['lightbox-position'].textContent, `1 / ${portraits.length}`);
  f.key('ArrowLeft');
  assert.equal(f.nodes['lightbox-image'].src, portraits.at(-1).src);
  f.key('ArrowRight');
  assert.equal(f.nodes['lightbox-image'].src, portraits[0].src);
  f.key('Escape');
  assert.equal(f.dialog.open, false);
  assert.equal(f.document.body.classList.contains('has-lightbox'), false);
  assert.equal(f.document.activeElement, anchor);
  assert.equal(f.click(anchor, { ctrlKey: true }), false, 'Modified clicks retain ordinary original-image links');
  f.click(anchor);
  f.go('#commissions');
  assert.equal(f.dialog.open, false);
  assert.equal(f.document.activeElement, f.nodes.main, 'Changing views must not restore focus into a hidden gallery');
  f.click(f.artLinks.at(-1));
  assert.equal(f.nodes['lightbox-position'].textContent, `1 / ${gallery.length}`, 'Commission examples open the complete archive');
});

test('commission rates, contacts, and boundaries remain honest placeholders or render configured data safely', () => {
  const empty = fixture('#commissions');
  assert.ok(empty.rates.every(cell => cell.textContent === 'To confirm'));
  assert.equal(empty.nodes['rates-note'].hidden, false);
  assert.equal(empty.nodes['commission-contacts'].children.length, 0);
  const data = structuredClone(commissions);
  data.currency = 'EUR';
  for (const values of Object.values(data.rates)) for (const key of Object.keys(values)) values[key] = 25;
  data.contacts = [{ label: 'Email', url: 'mailto:artist@example.invalid' }];
  data.acceptedSubjects = ['Original characters'];
  data.declinedSubjects = ['<script>plain text</script>'];
  const filled = fixture('#commissions', { commission: data });
  assert.equal(filled.nodes['rates-note'].hidden, true);
  assert.ok(filled.rates.every(cell => cell.textContent === '€25.00'));
  assert.equal(filled.nodes['commission-contacts'].children[0].href, data.contacts[0].url);
  assert.equal(filled.nodes['declined-subjects'].children[0].textContent, data.declinedSubjects[0]);
});

test('Home depth stays bounded, excludes touch, and respects reduced motion and background tabs', () => {
  const f = fixture();
  f.stage.emit('pointermove', { clientX: 900, clientY: -200 });
  f.stage.emit('pointermove', { clientX: 1000, clientY: -300 });
  assert.equal(f.frames.size, 1);
  f.flush();
  assert.equal(f.stage.props['--art-shift-x'], '4.00px');
  assert.equal(f.stage.props['--art-shift-y'], '-4.00px');
  f.stage.emit('pointermove', { clientX: 300, clientY: 300 });
  f.reduceQuery.matches = true;
  f.reduceQuery.emit('change');
  assert.equal(f.frames.size, 0);
  assert.equal(f.stage.props['--art-shift-x'], '0px');
  const dragging = fixture();
  dragging.document.body.classList.add('is-window-dragging');
  dragging.stage.emit('pointermove', { clientX: 300, clientY: 300 });
  assert.equal(dragging.frames.size, 0, 'Artwork depth cannot compete with a window grab');
  const touch = fixture('#home', { fine: false });
  touch.stage.emit('pointermove', { clientX: 300, clientY: 300 });
  assert.equal(touch.frames.size, 0);
  const background = fixture();
  background.stage.emit('pointermove', { clientX: 300, clientY: 300 });
  background.document.hidden = true;
  background.document.emit('visibilitychange');
  assert.equal(background.frames.size, 0);
  assert.equal(background.document.body.classList.contains('is-paused'), true);
});
