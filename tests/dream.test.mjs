import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../dream.js', import.meta.url), 'utf8');
function fixture({ reduced = false, supported = true, language = 'en' } = {}) {
  const target = object => {
    object.events = {};
    object.addEventListener = (type, handler) => (object.events[type] ??= []).push(handler);
    object.emit = (type, event = {}) => object.events[type]?.forEach(handler => handler(event));
    return object;
  };
  const records = [];
  class Element {
    constructor(className = '') {
      target(this);
      this.className = className;
      this.attributes = new Map();
      this.children = [];
      this.style = { setProperty() {} };
      this.classList = {
        contains: name => this.className.split(' ').includes(name),
        add: name => { if (!this.classList.contains(name)) this.className += ' ' + name; },
        remove: name => { this.className = this.className.split(' ').filter(value => value !== name).join(' '); }
      };
      if (supported) this.animate = (frames, options) => {
        const record = { element: this, frames, options, cancelled: false, cancel() { this.cancelled = true; } };
        records.push(record);
        return record;
      };
    }
    setAttribute(key, value) { this.attributes.set(key, value); }
    getAttribute(key) { return this.attributes.get(key); }
    append(...children) { this.children.push(...children); for (const child of children) child.parent = this; }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  }
  const body = new Element();
  const button = new Element();
  const retry = new Element();
  const home = new Element();
  const status = new Element();
  const original = new Element('mini-window');
  original.style.transform = 'rotate(-4deg)';
  original.style.left = '130px';
  body.append(original);
  const document = target({ body, hidden: false, documentElement: { lang: language },
    getElementById: id => ({ 'dream-button': button, 'retry-windows': retry, 'home-view': home, 'dream-status': status }[id]),
    createElement: () => new Element(), querySelector: () => null,
    querySelectorAll: selector => selector === '[data-draggable-window]' ? [original] : []
  });
  const motion = target({ matches: reduced });
  let nextTimer = 0;
  const timers = new Map();
  const window = target({ innerWidth: 1440, innerHeight: 900,
    matchMedia: () => motion,
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    ANGIE_CONTENT: { translations: { en: { 'dream.started': 'Dream started', 'dream.finished': 'Dream finished' }, es: { 'dream.started': 'Sueño iniciado', 'dream.finished': 'Sueño terminado' } } }
  });
  vm.runInNewContext(code, { window, document, getComputedStyle: () => ({ transform: 'matrix(1,0,0,1,0,0)', filter: 'none', display: 'block' }) });
  return { button, retry, document, window, motion, body, original, status, records, timers,
    start: () => button.emit('click'),
    active: () => body.classList.contains('is-dreaming')
  };
}

test('Dream has a fixed sub-six-second deadline, ignores repeat clicks, and leaves real window styles intact', () => {
  const page = fixture();
  const style = { ...page.original.style };
  const parent = page.original.parent;
  assert.equal(page.button.disabled, false);
  page.start();
  assert.equal(page.active(), true);
  assert.equal(page.button.getAttribute('aria-pressed'), 'true');
  const timer = [...page.timers.values()][0];
  assert.ok(timer.delay <= 6000);
  const count = page.records.length;
  page.start();
  assert.equal(page.records.length, count);
  assert.equal([...page.timers.values()][0], timer);
  assert.ok(page.records.every(record => record.options.duration <= 6000));
  timer.callback();
  assert.equal(page.active(), false);
  assert.equal(page.button.getAttribute('aria-pressed'), 'false');
  assert.equal(page.timers.size, 0);
  assert.ok(page.records.every(record => record.cancelled));
  assert.deepEqual(page.original.style, style);
  assert.equal(page.original.parent, parent);
  assert.deepEqual(page.body.children, [page.original]);
});

test('Retry, Escape, navigation, resize, hiding the tab, and starting a grab or drawing all cancel Dream', () => {
  const stops = [p => p.retry.emit('click'), p => p.document.emit('keydown', { key: 'Escape' }),
    p => p.window.emit('hashchange'), p => p.window.emit('resize'), p => p.window.emit('pagehide'),
    p => { p.document.hidden = true; p.document.emit('visibilitychange'); },
    p => p.document.emit('pointerdown', { target: { closest: () => true } }), p => p.motion.emit('change')];
  for (const stop of stops) {
    const page = fixture();
    page.start(); stop(page);
    assert.equal(page.active(), false);
    assert.equal(page.timers.size, 0);
    assert.deepEqual(page.body.children, [page.original]);
    assert.ok(page.records.every(record => record.cancelled));
  }
});

test('reduced motion and animation fallback avoid moving real windows and still finish cleanly', () => {
  for (const options of [{ reduced: true }, { supported: false }]) {
    const page = fixture(options);
    page.start();
    assert.equal(page.active(), true);
    assert.ok(page.records.every(record => record.element !== page.original));
    assert.equal(page.body.children[1].classList.contains('dream-calm'), true);
    [...page.timers.values()][0].callback();
    assert.equal(page.active(), false);
  }
});

test('Dream announces the chosen language and does not interrupt a drag, painting gesture, or another view', () => {
  const page = fixture({ language: 'es' });
  for (const state of ['is-window-dragging', 'is-painting']) {
    page.body.classList.add(state); page.start();
    assert.equal(page.active(), false);
    page.body.classList.remove(state);
  }
  page.document.getElementById('home-view').hidden = true;
  page.start(); assert.equal(page.active(), false);
  page.document.getElementById('home-view').hidden = false;
  page.start(); assert.equal(page.status.textContent, 'Sueño iniciado');
  page.retry.emit('click'); assert.equal(page.status.textContent, 'Sueño terminado');
});
