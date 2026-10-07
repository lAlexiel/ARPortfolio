(() => {
  'use strict';
  const buttons = [...document.querySelectorAll('[data-theme-choice]')];
  const choices = new Set(['lavender', 'aqua', 'pink', 'silver']);
  const storageKey = 'angie-rouge-theme';
  function applyTheme(choice) {
    const theme = choices.has(choice) ? choice : 'lavender';
    document.documentElement.dataset.theme = theme;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
    try { window.localStorage.setItem(storageKey, theme); } catch { /* Themes work even without browser storage. */ }
  }
  let saved;
  try { saved = window.localStorage.getItem(storageKey); } catch { /* Use the original palette. */ }
  applyTheme(saved);
  buttons.forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.themeChoice)));
  document.getElementById('retry-windows')?.addEventListener('click', () => applyTheme('lavender'));
})();
