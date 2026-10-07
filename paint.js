(() => {
  'use strict';
  const canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const tools = [...document.querySelectorAll('[data-paint-tool]')];
  const color = document.getElementById('paint-color');
  const undo = document.getElementById('paint-undo');
  const clear = document.getElementById('paint-clear');
  const paper = document.getElementById('paint-paper');
  const workspace = canvas.parentElement;
  let tool = 'pointer';
  let active = null;
  let strokes = [];

  function draw(stroke, from, to) {
    context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.tool === 'pencil' ? 3 : stroke.tool === 'brush' ? 12 : 36;
    context.lineCap = context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x + (from.x === to.x && from.y === to.y ? 0.01 : 0), to.y);
    context.stroke();
  }

  function replay() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      stroke.points.forEach((point, index) => draw(stroke, stroke.points[Math.max(0, index - 1)], point));
    }
    undo.disabled = clear.disabled = strokes.length === 0;
  }

  function finish(cancelled = false) {
    if (!active) return;
    const pointerId = active.pointerId;
    active = null;
    if (cancelled) { strokes.pop(); replay(); }
    document.body.classList.remove('is-painting');
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  }

  function setTool(value) {
    finish();
    tool = value;
    canvas.dataset.tool = tool;
    tools.forEach(button => {
      const selected = button.dataset.paintTool === tool;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('selected-tool', selected);
    });
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * canvas.width / rect.width)),
      y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * canvas.height / rect.height))
    };
  }

  function extend(event) {
    const last = active.points.at(-1);
    const next = point(event);
    draw(active, last, next);
    active.points.push(next);
  }

  tools.forEach(button => button.addEventListener('click', () => setTool(button.dataset.paintTool)));
  canvas.addEventListener('pointerdown', event => {
    if (tool === 'pointer' || active || event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    active = { tool, color: color.value, pointerId: event.pointerId, points: [point(event)] };
    strokes.push(active);
    canvas.setPointerCapture(event.pointerId);
    document.body.classList.add('is-painting');
    draw(active, active.points[0], active.points[0]);
    undo.disabled = clear.disabled = false;
  });
  canvas.addEventListener('pointermove', event => {
    if (active?.pointerId !== event.pointerId) return;
    const samples = event.getCoalescedEvents?.();
    for (const sample of samples?.length ? samples : [event]) extend(sample);
  });
  canvas.addEventListener('pointerup', event => {
    if (active?.pointerId !== event.pointerId) return;
    extend(event);
    finish();
  });
  canvas.addEventListener('pointercancel', event => { if (active?.pointerId === event.pointerId) finish(true); });
  canvas.addEventListener('lostpointercapture', event => { if (active?.pointerId === event.pointerId) finish(true); });
  undo.addEventListener('click', () => { finish(); strokes.pop(); replay(); });
  clear.addEventListener('click', () => { finish(); strokes = []; replay(); });
  paper.addEventListener('click', () => {
    finish();
    const blank = !workspace.classList.contains('paint-blank');
    workspace.classList.toggle('paint-blank', blank);
    paper.setAttribute('aria-pressed', String(blank));
  });
  document.getElementById('retry-windows').addEventListener('click', () => {
    finish(); strokes = []; replay(); setTool('pointer');
    color.value = '#302038';
    workspace.classList.remove('paint-blank');
    paper.setAttribute('aria-pressed', 'false');
  });
  window.addEventListener('blur', () => finish());
  window.addEventListener('hashchange', () => finish());
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  setTool('pointer');
  replay();
})();
