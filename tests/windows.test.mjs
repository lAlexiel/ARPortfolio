import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../windows.js', import.meta.url), 'utf8');

function fixture({ width = 900, height = 650, angles = [], matrix3d = false } = {}) {
  const eventTarget = target => {
    target.events = {};
    target.addEventListener = (type, callback) => (target.events[type] ??= []).push(callback);
    target.emit = (type, event = {}) => target.events[type]?.forEach(callback => callback(event));
    return target;
  };
  const document = eventTarget({ hidden: false, activeElement: null, documentElement: { clientWidth: width } });
  const createStyle = () => Object.defineProperty({}, 'setProperty', {
    value(name, value) { this[name] = value; }
  });
  class Element {
    constructor(className = '', rect = { left: 90, top: 120, width: 160, height: 90 }) {
      eventTarget(this);
      this.className = className;
      this.style = createStyle();
      this.attributes = new Map();
      this.children = [];
      this.rect = rect;
      this.captured = new Set();
      this.hidden = false;
      this.angle = 0;
      this.classList = {
        contains: value => this.className.split(' ').includes(value),
        add: value => { if (!this.classList.contains(value)) this.className += ` ${value}`; },
        remove: value => { this.className = this.className.split(' ').filter(item => item !== value).join(' '); }
      };
    }
    get offsetWidth() { return this.rect.width; }
    get offsetHeight() { return this.rect.height; }
    setAttribute(key, value) { this.attributes.set(key, value); if (key === 'style') this.style = createStyle(); }
    getAttribute(key) { return this.attributes.get(key) ?? null; }
    removeAttribute(key) { this.attributes.delete(key); if (key === 'style') this.style = createStyle(); }
    detach() {
      if (!this.parent) return;
      this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.parent = null;
    }
    append(child) { child.detach(); this.children.push(child); child.parent = this; }
    before(child) {
      const parent = this.parent;
      child.detach();
      parent.children.splice(parent.children.indexOf(this), 0, child);
      child.parent = parent;
    }
    replaceWith(child) {
      const parent = this.parent;
      child.detach();
      parent.children.splice(parent.children.indexOf(this), 1, child);
      child.parent = parent;
      this.parent = null;
    }
    cloneNode() {
      const clone = new Element(this.className, { ...this.rect });
      clone.attributes = new Map(this.attributes);
      Object.assign(clone.style, this.style);
      clone.angle = this.angle;
      return clone;
    }
    contains(child) { return child === this || this.children.some(item => item.contains(child)); }
    querySelector(selector) {
      return this.children.find(item => item.classList.contains(selector.slice(1))) || null;
    }
    closest(selector) {
      if (selector.includes('button') && this.isButton) return this;
      return null;
    }
    focus() { document.activeElement = this; }
    setPointerCapture(id) { this.captured.add(id); }
    hasPointerCapture(id) { return this.captured.has(id); }
    releasePointerCapture(id) { this.captured.delete(id); this.emit('lostpointercapture', { pointerId: id }); }
    getBoundingClientRect() {
      if (this.classList.contains('window-title') && this.parent) {
        const parent = this.parent.getBoundingClientRect();
        return { ...parent, height: 28, bottom: parent.top + 28 };
      }
      const cssLeft = parseFloat(this.style.left);
      const cssTop = parseFloat(this.style.top);
      const x = Number.isFinite(cssLeft) ? cssLeft : this.rect.left;
      const y = Number.isFinite(cssTop) ? cssTop : this.rect.top;
      const width = parseFloat(this.style.width) || this.rect.width;
      const angle = this.classList.contains('is-detached') ? parseFloat(this.style['--window-angle']) : this.angle;
      const visualWidth = width * Math.abs(Math.cos(angle)) + this.rect.height * Math.abs(Math.sin(angle));
      const visualHeight = width * Math.abs(Math.sin(angle)) + this.rect.height * Math.abs(Math.cos(angle));
      const left = x + (width - visualWidth) / 2;
      const top = y + (this.rect.height - visualHeight) / 2;
      return { left, top, width: visualWidth, height: visualHeight, right: left + visualWidth, bottom: top + visualHeight };
    }
  }
  document.body = new Element();
  const home = new Element();
  const originalParent = new Element();
  home.append(originalParent);
  const resetButton = new Element();
  resetButton.isButton = true;
  resetButton.disabled = true;
  const windows = Array.from({ length: 3 }, (_, index) => {
    const element = new Element(index === 0 ? 'art-window' : 'mini-window', { left: 90 + index * 150, top: 120, width: 160, height: 90 });
    element.angle = (angles[index] ?? 0) * Math.PI / 180;
    element.setAttribute('data-draggable-window', '');
    const handle = new Element('window-title');
    const controls = new Element('window-controls');
    handle.append(controls);
    element.append(handle);
    originalParent.append(element);
    return { element, handle, controls };
  });
  windows[2].element.append(resetButton);
  document.body.append(home);
  document.querySelectorAll = selector => selector === '[data-draggable-window]' ? windows.map(item => item.element) : [];
  document.getElementById = id => ({ 'home-view': home, 'retry-windows': resetButton })[id];
  document.createElement = () => new Element();
  const frames = new Map();
  let frameId = 0;
  const window = eventTarget({ innerHeight: height,
    getComputedStyle(element) {
      const cos = Math.cos(element.angle), sin = Math.sin(element.angle);
      return { transform: matrix3d
        ? `matrix3d(${cos}, ${sin}, 0, 0, ${-sin}, ${cos}, 0, 0, 0, 0, 1, 0, 3, -2, 0, 1)`
        : `matrix(${cos}, ${sin}, ${-sin}, ${cos}, 3, -2)` };
    },
    requestAnimationFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  vm.runInNewContext(code, { window, document, Math, String, Map });
  const desktop = document.body.children.at(-1);
  return { document, window, home, windows, originalParent, desktop, resetButton, frames,
    start(index = 0, extra = {}) {
      const item = windows[index];
      const rect = item.handle.getBoundingClientRect();
      const event = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0, clientX: rect.left + 30, clientY: rect.top + 10, target: item.handle, preventDefault() { this.prevented = true; }, ...extra };
      item.handle.emit('pointerdown', event);
      return event;
    },
    move(x, y, pointerId = 1) { window.emit('pointermove', { clientX: x, clientY: y, pointerId }); },
    drop(x, y, pointerId = 1) { window.emit('pointerup', { clientX: x, clientY: y, pointerId }); },
    key(index, key, shiftKey = false) { const event = { key, shiftKey, preventDefault() { this.prevented = true; } }; windows[index].handle.emit('keydown', event); return event; },
    flush() { for (const [id, callback] of frames) { frames.delete(id); callback(); } },
    goHome(visible) { home.hidden = !visible; window.emit('hashchange'); }
  };
}

test('title-bar dragging raises a window, reserves its layout, captures the pointer, and commits the last position', () => {
  const f = fixture();
  const { element, handle } = f.windows[0];
  const start = f.start();
  assert.equal(start.prevented, true);
  assert.equal(handle.hasPointerCapture(1), true);
  assert.equal(element.parent, f.desktop);
  assert.equal(f.originalParent.children.length, 3, 'A placeholder reserves the original slot');
  assert.equal(f.originalParent.children[0].getAttribute('data-draggable-window'), null);
  assert.equal(f.originalParent.children[0].style.visibility, 'hidden');
  assert.equal(f.document.activeElement, handle);
  f.move(start.clientX + 40, start.clientY + 20);
  f.move(start.clientX + 70, start.clientY + 50);
  assert.equal(f.frames.size, 1, 'Moves are coalesced into one animation frame');
  f.flush();
  assert.equal(element.style.left, '160px');
  assert.equal(element.style.top, '170px');
  f.move(start.clientX + 80, start.clientY + 60);
  f.drop(start.clientX + 100, start.clientY + 75);
  assert.equal(element.style.left, '190px');
  assert.equal(element.style.top, '195px');
  assert.equal(f.frames.size, 0);
  assert.equal(handle.hasPointerCapture(1), false);
  assert.equal(f.document.body.classList.contains('is-window-dragging'), false);
  assert.equal(element.classList.contains('is-dragging'), false);
  f.start(1);
  assert.ok(Number(f.windows[1].element.style.zIndex) > Number(element.style.zIndex));
});

test('touch and keyboard moves keep title bars reachable, while unrelated pointers and right clicks are ignored', () => {
  const f = fixture({ width: 320, height: 500 });
  assert.equal(f.start(0, { button: 2 }).prevented, undefined);
  assert.equal(f.start(0, { isPrimary: false }).prevented, undefined);
  assert.equal(f.desktop.children.length, 0);
  const start = f.start(0, { pointerType: 'touch' });
  f.move(9999, 9999, 2);
  assert.equal(f.frames.size, 0);
  f.move(-9999, -9999);
  f.flush();
  assert.equal(f.windows[0].element.style.left, '8px');
  assert.equal(f.windows[0].element.style.top, '8px');
  f.move(9999, 9999);
  f.flush();
  assert.equal(f.windows[0].element.style.left, '152px');
  assert.equal(f.windows[0].element.style.top, '464px', 'Even a window below the viewport retains its title bar');
  f.drop(start.clientX, start.clientY);
  assert.equal(f.key(0, 'ArrowRight').prevented, true);
  assert.equal(f.windows[0].element.style.left, '100px');
  f.key(0, 'ArrowDown', true);
  assert.equal(f.windows[0].element.style.top, '150px');
  assert.equal(f.windows[0].handle.getAttribute('role'), 'button');
  assert.equal(f.windows[0].handle.getAttribute('aria-describedby'), 'window-move-help');
  assert.equal(f.windows[0].controls.getAttribute('aria-hidden'), 'true');
  const narrow = fixture({ width: 320, height: 500 });
  narrow.windows[0].element.rect.width = 600;
  narrow.start();
  assert.equal(narrow.windows[0].element.style.width, '304px', 'Large artwork is fitted to a narrow viewport before dragging');
  assert.equal(narrow.windows[0].element.style.left, '8px');
});

test('cancelled pointers, lost capture, and Escape restore their prior state without leaving queued movement', () => {
  const f = fixture();
  f.start();
  f.move(300, 300);
  f.window.emit('pointercancel', { pointerId: 1 });
  assert.equal(f.windows[0].element.parent, f.originalParent);
  assert.equal(f.frames.size, 0);
  assert.equal(f.resetButton.disabled, false);
  f.key(0, 'ArrowRight');
  const previous = f.windows[0].element.style.left;
  f.start();
  f.move(500, 300);
  f.flush();
  f.windows[0].handle.captured.clear();
  f.windows[0].handle.emit('lostpointercapture', { pointerId: 1 });
  assert.equal(f.windows[0].element.style.left, previous, 'An interrupted repeat drag returns to its previous position');
  assert.equal(f.windows[0].element.parent, f.desktop);
  f.key(0, 'Escape');
  assert.equal(f.windows[0].element.parent, f.originalParent);
  assert.equal(f.document.activeElement, f.windows[0].handle);
});

test('view changes hide moved Home windows, and reset or resizing restores the exact original markup and styles', () => {
  const f = fixture();
  f.windows[1].element.setAttribute('style', 'opacity: .9;');
  f.key(0, 'ArrowRight');
  f.key(1, 'ArrowDown');
  f.goHome(false);
  assert.equal(f.desktop.hidden, true);
  assert.equal(f.start(2).prevented, undefined);
  f.goHome(true);
  assert.equal(f.desktop.hidden, false);
  assert.equal(f.desktop.children.length, 2, 'Moving between views retains the Home arrangement');
  f.resetButton.emit('click');
  assert.equal(f.desktop.children.length, 0);
  assert.equal(f.originalParent.children.length, 3);
  assert.deepEqual(f.originalParent.children, f.windows.map(item => item.element));
  assert.equal(f.windows[0].element.getAttribute('style'), null);
  assert.equal(f.windows[1].element.getAttribute('style'), 'opacity: .9;');
  assert.equal(f.resetButton.disabled, false);
  f.start(2);
  f.move(100, 100);
  f.window.emit('resize');
  assert.equal(f.desktop.children.length, 0);
  assert.equal(f.frames.size, 0);
  assert.ok(f.windows.every(item => item.element.parent === f.originalParent));
});

test('backgrounding or leaving the browser cancels a grab and releases capture', () => {
  const f = fixture();
  f.start();
  f.document.hidden = true;
  f.document.emit('visibilitychange');
  assert.equal(f.windows[0].element.parent, f.originalParent);
  assert.equal(f.windows[0].handle.hasPointerCapture(1), false);
  f.document.hidden = false;
  f.start();
  f.window.emit('blur');
  assert.equal(f.windows[0].element.parent, f.originalParent);
  assert.equal(f.document.body.classList.contains('is-window-dragging'), false);
});

test('dragging preserves positive and negative window angles without a jump on grab or release', () => {
  for (const matrix3d of [false, true]) {
    const f = fixture({ angles: [0, 5, -3], matrix3d });
    for (const index of [1, 2]) {
      const element = f.windows[index].element;
      const original = element.getBoundingClientRect();
      const start = f.start(index);
      const angle = parseFloat(element.style['--window-angle']);
      assert.ok(Math.abs(angle - element.angle) < 1e-10);
      assert.ok(Math.abs(element.getBoundingClientRect().left - original.left) < 1e-10);
      assert.ok(Math.abs(element.getBoundingClientRect().top - original.top) < 1e-10);
      f.move(start.clientX + 40, start.clientY + 25);
      f.flush();
      f.drop(start.clientX + 40, start.clientY + 25);
      const moved = element.getBoundingClientRect();
      assert.ok(Math.abs(moved.left - original.left - 40) < 1e-10);
      assert.ok(Math.abs(moved.top - original.top - 25) < 1e-10);
      assert.equal(parseFloat(element.style['--window-angle']), angle);
      const again = f.start(index);
      f.drop(again.clientX + 20, again.clientY + 10);
      assert.equal(parseFloat(element.style['--window-angle']), angle, 'A repeat drag keeps the same captured tilt');
      f.key(index, 'Escape');
      assert.equal(element.style['--window-angle'], undefined);
      assert.deepEqual(element.getBoundingClientRect(), original);
    }
  }
});

test('Retry restores all windows including its own pop-up and preserves button focus', () => {
  const f = fixture({ angles: [0, 5, -3] });
  assert.equal(f.resetButton.disabled, false);
  f.resetButton.emit('click');
  for (let index = 0; index < 3; index++) f.key(index, 'ArrowRight');
  assert.equal(f.resetButton.parent.parent, f.desktop);
  f.resetButton.focus();
  f.resetButton.emit('click');
  assert.equal(f.desktop.children.length, 0);
  assert.deepEqual(f.originalParent.children, f.windows.map(item => item.element));
  assert.equal(f.document.activeElement, f.resetButton);
  assert.equal(f.resetButton.disabled, false);
  assert.ok(f.windows.every(item => !item.element.classList.contains('is-detached') && item.element.getAttribute('style') === null));
});
