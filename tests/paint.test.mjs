import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup() {
  const calls = [];
  const element = dataset => {
    const classes = new Set();
    const events = {};
    return { dataset, events, disabled: false, attributes: {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle(name, value) { if (value) classes.add(name); else classes.delete(name); } },
      addEventListener(type, callback) { events[type] = callback; }, setAttribute(key, value) { this.attributes[key] = value; }, fire(type, event = {}) { events[type]?.(event); } };
  };
  const context = { clearRect: () => calls.push('clear'), beginPath() {}, moveTo() {}, lineTo() {}, stroke() { calls.push({ color: this.strokeStyle, mode: this.globalCompositeOperation }); } };
  const canvas = Object.assign(element({}), { width: 1280, height: 1280, parentElement: element({}), getContext: () => context, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 640 }), setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; }, releasePointerCapture() { this.capture = null; } });
  const nodes = { 'paint-canvas': canvas, 'paint-color': { value: '#302038' } };
  for (const id of ['paint-undo', 'paint-clear', 'paint-paper', 'retry-windows']) nodes[id] = element({});
  const tools = ['pointer', 'pencil', 'brush', 'eraser'].map(paintTool => element({ paintTool }));
  const document = Object.assign(element({}), { hidden: false, body: element({}), getElementById: id => nodes[id], querySelectorAll: () => tools });
  const window = element({});
  vm.runInNewContext(fs.readFileSync(new URL('../paint.js', import.meta.url), 'utf8'), { document, window });
  const pointer = (type, extra = {}) => canvas.fire(type, { pointerId: 1, button: 0, clientX: 80, clientY: 80, preventDefault() {}, ...extra });
  return { calls, canvas, tools, nodes, pointer, document };
}

test('Paint ignores pointer mode and right clicks, owns one pointer, handles empty coalesced events, and rolls back cancelled strokes', () => {
  const f = setup();
  f.pointer('pointerdown');
  assert.equal(f.nodes['paint-undo'].disabled, true);
  f.tools[1].fire('click');
  f.pointer('pointerdown', { button: 2 });
  assert.equal(f.nodes['paint-undo'].disabled, true);
  f.pointer('pointerdown');
  assert.equal(f.canvas.capture, 1);
  const count = f.calls.length;
  f.pointer('pointermove', { pointerId: 2 });
  assert.equal(f.calls.length, count);
  f.pointer('pointermove', { clientX: 180, getCoalescedEvents: () => [] });
  assert.equal(f.calls.length, count + 1);
  f.pointer('pointercancel');
  assert.equal(f.calls.at(-1), 'clear');
  assert.equal(f.nodes['paint-undo'].disabled, true);
  assert.equal(f.document.body.classList.contains('is-painting'), false);
});

test('eraser only affects the drawing layer, undo restores strokes, and Retry resets tools, color, and paper', () => {
  const f = setup();
  f.tools[2].fire('click'); f.pointer('pointerdown'); f.pointer('pointerup');
  assert.equal(f.calls.at(-1).mode, 'source-over');
  f.tools[3].fire('click'); f.pointer('pointerdown'); f.pointer('pointerup');
  assert.equal(f.calls.at(-1).mode, 'destination-out');
  f.nodes['paint-undo'].fire('click');
  assert.equal(f.calls.at(-1).mode, 'source-over');
  f.nodes['paint-paper'].fire('click');
  f.nodes['paint-color'].value = '#ff0000';
  f.nodes['retry-windows'].fire('click');
  assert.equal(f.canvas.dataset.tool, 'pointer');
  assert.equal(f.nodes['paint-color'].value, '#302038');
  assert.equal(f.nodes['paint-paper'].attributes['aria-pressed'], 'false');
  assert.equal(f.nodes['paint-undo'].disabled, true);
  assert.equal(f.calls.at(-1), 'clear');
});
