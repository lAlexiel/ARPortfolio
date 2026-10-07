(() => {
  'use strict';
  const windows = [...document.querySelectorAll('[data-draggable-window]')];
  const resetButton = document.getElementById('retry-windows');
  if (!windows.length || !resetButton) return;
  const desktop = document.createElement('div');
  desktop.className = 'home-desktop';
  document.body.append(desktop);
  const floating = new Map();
  let gesture = null;
  let frame = 0;
  let front = 0;

  const homeVisible = () => !document.getElementById('home-view').hidden;
  const viewport = () => ({ width: document.documentElement.clientWidth, height: window.innerHeight });

  function position(state, x, y) {
    const size = state.element.getBoundingClientRect();
    const offsetX = size.left - (parseFloat(state.element.style.left) || 0);
    const offsetY = size.top - (parseFloat(state.element.style.top) || 0);
    const titleHeight = state.handle.getBoundingClientRect().height;
    const space = viewport();
    const padding = 8;
    state.x = Math.max(padding, Math.min(x, Math.max(padding, space.width - size.width - padding)));
    state.y = Math.max(padding, Math.min(y, Math.max(padding, space.height - titleHeight - padding)));
    state.element.style.left = `${state.x - offsetX}px`;
    state.element.style.top = `${state.y - offsetY}px`;
  }

  function raise(state) {
    state.element.style.zIndex = String(++front);
  }

  function lift(element) {
    const existing = floating.get(element);
    if (existing) { raise(existing); return existing; }
    const rect = element.getBoundingClientRect();
    const transform = window.getComputedStyle(element).transform;
    const components = transform.match(/^matrix(?:3d)?\(([^)]+)\)$/)?.[1].split(',').map(Number);
    const angle = components && Number.isFinite(components[0]) && Number.isFinite(components[1])
      ? Math.atan2(components[1], components[0]) : 0;
    const width = element.offsetWidth || rect.width;
    const height = element.offsetHeight || rect.height;
    const placeholder = element.cloneNode(false);
    placeholder.removeAttribute('data-draggable-window');
    placeholder.removeAttribute('id');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.visibility = 'hidden';
    placeholder.style.pointerEvents = 'none';
    placeholder.style.width = `${width}px`;
    placeholder.style.height = `${height}px`;
    const state = { element, handle: element.querySelector('.window-title'), placeholder, originalStyle: element.getAttribute('style'), x: rect.left, y: rect.top };
    element.before(placeholder);
    desktop.append(element);
    element.classList.add('is-detached');
    element.style.setProperty('--window-angle', `${angle}rad`);
    element.style.left = '0px';
    element.style.top = '0px';
    element.style.width = `${Math.min(width, Math.max(1, viewport().width - 16))}px`;
    // Rotation enlarges the visual bounds, so fit those rather than just the CSS width.
    const available = Math.max(1, viewport().width - 16);
    for (let attempt = 0; attempt < 3; attempt++) {
      const bounds = element.getBoundingClientRect();
      if (bounds.width <= available) break;
      element.style.width = `${parseFloat(element.style.width) * available / bounds.width}px`;
    }
    floating.set(element, state);
    position(state, rect.left, rect.top);
    raise(state);
    return state;
  }

  function restore(state) {
    const focused = state.element.contains(document.activeElement) ? document.activeElement : null;
    state.placeholder.replaceWith(state.element);
    state.element.classList.remove('is-detached');
    if (state.originalStyle === null) state.element.removeAttribute('style');
    else state.element.setAttribute('style', state.originalStyle);
    floating.delete(state.element);
    if (focused && homeVisible() && !document.hidden) focused.focus({ preventScroll: true });
  }

  function finish(cancel = false) {
    if (!gesture) return;
    const current = gesture;
    gesture = null;
    window.cancelAnimationFrame(frame);
    frame = 0;
    if (cancel) {
      if (current.wasFloating) position(current.state, current.startX, current.startY);
      else restore(current.state);
    } else position(current.state, current.x, current.y);
    current.state.element.classList.remove('is-dragging');
    document.body.classList.remove('is-window-dragging');
    if (current.handle.hasPointerCapture?.(current.pointerId)) current.handle.releasePointerCapture(current.pointerId);
  }

  function reset() {
    finish(true);
    for (const state of [...floating.values()]) restore(state);
    front = 0;
  }

  for (const element of windows) {
    const handle = element.querySelector('.window-title');
    if (!handle) continue;
    handle.classList.add('window-drag-handle');
    handle.tabIndex = 0;
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-describedby', 'window-move-help');
    handle.querySelector('.window-controls')?.setAttribute('aria-hidden', 'true');

    handle.addEventListener('pointerdown', event => {
      if (!homeVisible() || gesture || event.isPrimary === false || event.button !== 0) return;
      if (event.target.closest('button, a, input, select, textarea')) return;
      event.preventDefault();
      const wasFloating = floating.has(element);
      const state = lift(element);
      handle.focus({ preventScroll: true });
      gesture = { state, handle, pointerId: event.pointerId, wasFloating, startX: state.x, startY: state.y,
        pointerX: event.clientX, pointerY: event.clientY, x: state.x, y: state.y };
      state.element.classList.add('is-dragging');
      document.body.classList.add('is-window-dragging');
      // Capture after moving the element into the desktop layer.
      handle.setPointerCapture?.(event.pointerId);
    });

    handle.addEventListener('keydown', event => {
      if (!homeVisible()) return;
      if (event.key === 'Escape') {
        if (gesture?.state.element === element) finish(true);
        else if (floating.has(element)) restore(floating.get(element));
        else return;
        event.preventDefault();
        handle.focus({ preventScroll: true });
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key) || gesture) return;
      event.preventDefault();
      const state = lift(element);
      handle.focus({ preventScroll: true });
      const step = event.shiftKey ? 30 : 10;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      position(state, state.x + dx, state.y + dy);
    });
    handle.addEventListener('lostpointercapture', event => {
      if (gesture?.pointerId === event.pointerId) finish(true);
    });
  }

  window.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.x = gesture.startX + event.clientX - gesture.pointerX;
    gesture.y = gesture.startY + event.clientY - gesture.pointerY;
    if (!frame) frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (gesture) position(gesture.state, gesture.x, gesture.y);
    });
  }, { passive: true });
  window.addEventListener('pointerup', event => {
    if (gesture?.pointerId !== event.pointerId) return;
    gesture.x = gesture.startX + event.clientX - gesture.pointerX;
    gesture.y = gesture.startY + event.clientY - gesture.pointerY;
    finish();
  });
  window.addEventListener('pointercancel', event => {
    if (gesture?.pointerId === event.pointerId) finish(true);
  });
  window.addEventListener('blur', () => finish(true));
  window.addEventListener('hashchange', () => {
    finish(true);
    desktop.hidden = !homeVisible();
  });
  // The stylesheet changes window sizes/visibility at its phone and desktop breakpoints.
  window.addEventListener('resize', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(true); });
  resetButton.addEventListener('click', reset);
  resetButton.disabled = false;
  desktop.hidden = !homeVisible();
})();
