(() => {
  'use strict';
  const button = document.getElementById('dream-button');
  const home = document.getElementById('home-view');
  if (!button || !home) return;
  const duration = 5600;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.getElementById('dream-status');
  let active = false;
  let layer = null;
  let timer = null;
  let animations = [];

  const message = key => {
    const translations = window.ANGIE_CONTENT?.translations;
    return translations?.[document.documentElement.lang]?.[key] || translations?.en?.[key] || '';
  };
  const node = (className, text = '', key = '') => {
    const element = document.createElement('div');
    element.className = className;
    element.textContent = key ? message(key) : text;
    if (key) element.setAttribute('data-i18n', key);
    return element;
  };
  const animate = (element, frames, options = {}) => {
    if (!element?.animate) return null;
    const animation = element.animate(frames, { duration, easing: 'linear', ...options });
    animations.push(animation);
    return animation;
  };
  const echo = (source, className = '') => {
    if (!source) return null;
    const copy = source.cloneNode(true);
    // These are visual echoes, never another set of working controls or IDs.
    for (const element of [copy, ...copy.querySelectorAll('*')]) {
      for (const attribute of [...element.attributes]) {
        if (/^(id|style|tabindex|data-.*|aria-.*)$/.test(attribute.name)) element.removeAttribute(attribute.name);
      }
      element.classList.remove('is-detached', 'is-dragging');
    }
    copy.classList.add('dream-ghost');
    if (className) copy.classList.add(className);
    copy.inert = true;
    return copy;
  };
  const stop = () => {
    if (!active) return;
    active = false;
    window.clearTimeout(timer);
    timer = null;
    for (const animation of animations) animation.cancel();
    animations = [];
    layer?.remove();
    layer = null;
    document.body.classList.remove('is-dreaming');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-disabled', 'false');
    if (status) status.textContent = message('dream.finished');
  };

  const buildDream = reduced => {
    layer = node('dream-layer' + (reduced ? ' dream-calm' : ''));
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    document.body.append(layer);
    const halo = node('dream-halo');
    layer.append(halo);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * .46;
    const radiusX = Math.min(window.innerWidth * .34, 430);
    const radiusY = Math.min(window.innerHeight * .29, 235);

    for (let index = 0; index < 3; index++) {
      const orbit = node('dream-orbit');
      orbit.style.setProperty('--orbit-index', index);
      layer.append(orbit);
      if (!reduced) animate(orbit, [
        { transform: `rotate(${index * 55}deg) scale(.5)`, opacity: 0 },
        { transform: `rotate(${index * 55 + 110}deg) scale(1)`, opacity: .7, offset: .25 },
        { transform: `rotate(${index * 55 + 260}deg) scale(1.25)`, opacity: .4, offset: .75 },
        { transform: `rotate(${index * 55 + 330}deg) scale(1.5)`, opacity: 0 }
      ]);
    }
    const disc = echo(document.querySelector('.art-composition > .disc'), 'dream-disc');
    if (disc) {
      layer.append(disc);
      if (!reduced) animate(disc, [
        { transform: 'translate(-50%, -50%) scale(.15) rotate(-40deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1) rotate(180deg)', opacity: .95, offset: .24 },
        { transform: 'translate(-50%, -50%) scale(1.35) rotate(630deg)', opacity: .75, offset: .74 },
        { transform: 'translate(-50%, -50%) scale(.1) rotate(1080deg)', opacity: 0 }
      ], { easing: 'cubic-bezier(.2,.6,.4,1)' });
    }

    const sources = ['.mini-welcome', '.error-back', '.mini-heart', '.mini-palette', '.portrait-window'];
    for (let index = 0; index < (reduced ? 2 : sources.length); index++) {
      const ghost = echo(document.querySelector(sources[index]));
      if (!ghost) continue;
      layer.append(ghost);
      const phase = (index / sources.length) * Math.PI * 2 - Math.PI / 2;
      const frames = Array.from({ length: 7 }, (_, step) => {
        const angle = phase + step * Math.PI / 4;
        const swell = step === 0 || step === 6 ? .3 : 1;
        const x = cx + Math.cos(angle) * radiusX * swell;
        const y = cy + Math.sin(angle) * radiusY * swell;
        return {
          transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${Math.sin(angle) * 15}deg) scale(${swell})`,
          opacity: step === 0 || step === 6 ? 0 : .9,
          offset: step / 6
        };
      });
      if (!reduced) animate(ghost, frames, { easing: 'ease-in-out' });
      else ghost.style.transform = `translate(${cx + (index ? 1 : -1) * radiusX * .7}px, ${cy + 90}px) translate(-50%, -50%) rotate(${index ? 5 : -5}deg)`;
    }
    for (let index = 0; index < (reduced ? 8 : 20); index++) {
      const particle = node('dream-particle', ['✦', '♡', '✧', '+'][index % 4]);
      particle.style.setProperty('--particle-index', index % 3);
      layer.append(particle);
      const angle = index * 2.39996;
      const x = cx + Math.cos(angle) * radiusX * 1.35;
      const y = cy + Math.sin(angle) * radiusY * 1.45;
      if (!reduced) animate(particle, [
        { transform: `translate(${cx}px, ${cy}px) scale(0)`, opacity: 0 },
        { transform: `translate(${x}px, ${y}px) rotate(${index * 25}deg) scale(1)`, opacity: .9, offset: .3 },
        { transform: `translate(${x + Math.sin(angle) * 65}px, ${y - 35}px) rotate(${index * 25 + 130}deg) scale(.8)`, opacity: .75, offset: .78 },
        { transform: `translate(${cx}px, ${cy}px) rotate(220deg) scale(0)`, opacity: 0 }
      ]);
      else particle.style.transform = `translate(${x}px, ${y}px)`;
    }
    const console = node('dream-console');
    console.append(node('dream-console-title', '✦ dream.exe'), node('dream-console-message', '', 'dream.message'), node('dream-progress'));
    layer.append(console);
    if (!reduced) animate(halo, [
      { transform: 'translate(-50%, -50%) rotate(0deg) scale(.6)' },
      { transform: 'translate(-50%, -50%) rotate(230deg) scale(1.2)' },
      { transform: 'translate(-50%, -50%) rotate(460deg) scale(.8)' }
    ]);
    const fade = animate(layer, [{ opacity: 0 }, { opacity: 1, offset: .13 }, { opacity: 1, offset: .8 }, { opacity: 0 }]);
    if (fade) fade.onfinish = stop;
  };

  const start = () => {
    if (active || home.hidden || document.hidden || document.body.classList.contains('is-window-dragging') || document.body.classList.contains('is-painting')) return;
    active = true;
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-disabled', 'true');
    try {
      const reduced = motion.matches || typeof button.animate !== 'function';
      buildDream(reduced);
      document.body.classList.add('is-dreaming');
      if (!reduced) {
        for (const [index, element] of [...document.querySelectorAll('[data-draggable-window]')].entries()) {
          if (getComputedStyle(element).display === 'none') continue;
          const base = getComputedStyle(element).transform;
          const transform = base === 'none' ? '' : base;
          const distance = element.classList.contains('error-front') ? 5 : 16 + index % 3 * 8;
          animate(element, [
            { transform: base },
            { transform: `${transform} translate(${distance}px, -${distance}px) rotate(5deg) scale(1.025)`, offset: .25 },
            { transform: `${transform} translate(-${distance}px, ${distance / 2}px) rotate(-5deg) scale(.985)`, offset: .65 },
            { transform: base }
          ], { easing: 'ease-in-out' });
        }
        for (const element of document.querySelectorAll('#artist-name, .art-composition > .disc, .name-globe, .stage-star, .ambient-mark, .identity-stickers')) {
          const base = getComputedStyle(element).filter;
          const filter = base === 'none' ? '' : base;
          animate(element, [{ filter: base }, { filter: `${filter} hue-rotate(170deg) saturate(1.5)`, offset: .45 }, { filter: `${filter} hue-rotate(320deg) saturate(1.2)`, offset: .8 }, { filter: base }]);
        }
      }
      if (status) status.textContent = message('dream.started');
      // A fixed deadline: repeated clicks never stack or extend the dream.
      timer = window.setTimeout(stop, duration + 100);
    } catch {
      stop();
    }
  };
  button.addEventListener('click', start);
  document.getElementById('retry-windows')?.addEventListener('click', stop, true);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') stop(); }, true);
  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.('.window-drag-handle, #paint-canvas, .tool-rail')) stop();
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  for (const type of ['hashchange', 'resize', 'pagehide']) window.addEventListener(type, stop);
  motion.addEventListener('change', stop);
  button.disabled = false;
})();
