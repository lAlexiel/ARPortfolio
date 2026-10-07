(() => {
  'use strict';
  const titles = { home: 'nav.home', gallery: 'nav.gallery', commissions: 'nav.commissions', terms: 'nav.terms' };
  const views = Object.fromEntries(Object.keys(titles).map(view => [view, document.getElementById(`${view}-view`)]));
  const main = document.getElementById('main');
  const links = document.querySelectorAll('[data-view]');
  const content = window.ANGIE_CONTENT || {};
  const translations = content.translations || {};
  const languageSwitch = document.getElementById('language-switch');
  const languageOptions = document.querySelectorAll('[data-language]');
  const languageStorageKey = 'angie-rouge-language';
  let language = 'en';
  try {
    const saved = window.localStorage.getItem(languageStorageKey);
    if (saved === 'en' || saved === 'es') language = saved;
  } catch { /* A blocked browser storage must not disable the switch. */ }

  function t(key, values = {}) {
    const message = translations[language]?.[key] ?? translations.en?.[key] ?? key;
    return typeof message === 'string' ? message.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match) : '';
  }

  function localized(value) {
    return typeof value === 'string' ? value : value?.[language] ?? value?.en ?? '';
  }

  const workTitle = work => language === 'es' ? work.titleEs || work.title : work.title;
  const workAlt = work => language === 'es' ? work.altEs || work.alt : work.alt;
  const workCategory = work => t(`gallery.${work.category.toLowerCase()}`);
  const gallery = Array.isArray(content.gallery) ? content.gallery : [];
  const dialog = document.getElementById('artwork-dialog');
  const preview = document.getElementById('lightbox-image');
  const previewTitle = document.getElementById('lightbox-title');
  const previewPosition = document.getElementById('lightbox-position');
  const originalLink = document.getElementById('lightbox-original');
  const previous = document.getElementById('lightbox-previous');
  const next = document.getElementById('lightbox-next');
  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('.artwork-card');
  let filter = 'all';
  let previewWorks = [];
  let previewIndex = 0;
  let previewTrigger = null;
  let previewView = null;
  let restorePreviewFocus = true;
  let active = null;

  function closePreview(restoreFocus = true) {
    restorePreviewFocus = restoreFocus;
    if (dialog.open) dialog.close();
  }

  function showView() {
    const requested = window.location.hash.slice(1).toLowerCase();
    const view = Object.hasOwn(titles, requested) ? requested : 'home';
    if (active !== null && active !== view) closePreview(false);
    Object.entries(views).forEach(([key, section]) => { section.hidden = key !== view; });
    document.title = view === 'home' ? t('site.title') : `${t(titles[view])} — Angie Rouge`;
    links.forEach(link => {
      if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (active !== null && active !== view) {
      main.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    active = view;
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  window.addEventListener('hashchange', showView);
  showView();

  function filteredWorks() {
    return gallery.filter(work => filter === 'all' || work.category.toLowerCase() === filter);
  }

  function applyFilter() {
    cards.forEach(card => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    const count = filteredWorks().length;
    document.getElementById('gallery-count').textContent = `${count} ${t(count === 1 ? 'gallery.work' : 'gallery.works')}`;
    document.getElementById('gallery-empty').hidden = count !== 0;
  }

  if (Array.isArray(content.gallery)) {
    document.getElementById('gallery-filters').hidden = false;
    filters.forEach(button => button.addEventListener('click', () => {
      filter = button.dataset.filter;
      applyFilter();
    }));
    applyFilter();
  }

  function renderPreview() {
    const work = previewWorks[previewIndex];
    preview.src = work.src;
    preview.alt = workAlt(work);
    previewTitle.textContent = workTitle(work);
    previewPosition.textContent = `${previewIndex + 1} / ${previewWorks.length}`;
    originalLink.href = work.src;
    previous.disabled = next.disabled = previewWorks.length < 2;
  }

  function stepPreview(amount) {
    if (!dialog.open || previewWorks.length < 2) return;
    previewIndex = (previewIndex + amount + previewWorks.length) % previewWorks.length;
    renderPreview();
  }

  document.querySelectorAll('[data-artwork]').forEach(anchor => anchor.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0 || typeof dialog.showModal !== 'function') return;
    const work = gallery.find(item => item.src === anchor.dataset.artwork);
    if (!work) return;
    event.preventDefault();
    previewWorks = anchor.closest('.gallery-grid') ? filteredWorks() : gallery;
    previewIndex = previewWorks.indexOf(work);
    if (previewIndex < 0) return;
    previewTrigger = anchor;
    previewView = active;
    restorePreviewFocus = true;
    renderPreview();
    document.body.classList.add('has-lightbox');
    dialog.showModal();
  }));
  document.getElementById('lightbox-close').addEventListener('click', () => closePreview());
  previous.addEventListener('click', () => stepPreview(-1));
  next.addEventListener('click', () => stepPreview(1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepPreview(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closePreview();
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePreview();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('has-lightbox');
    if (restorePreviewFocus && active === previewView && previewTrigger?.isConnected) previewTrigger.focus({ preventScroll: true });
  });

  const commission = content.commissions;
  function renderCommissions() {
    if (!commission) return;
    let incompleteRates = false;
    document.querySelectorAll('[data-rate]').forEach(cell => {
      const [group, key] = cell.dataset.rate.split('.');
      const value = commission.rates?.[group]?.[key];
      const missing = value === null || value === undefined || value === '';
      incompleteRates ||= missing;
      cell.textContent = missing ? t('commissions.unconfirmed') : typeof value === 'number'
        ? new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', { style: 'currency', currency: commission.currency }).format(value)
        : localized(value);
      cell.classList.toggle('is-unconfirmed', missing);
    });
    document.getElementById('rates-note').hidden = !incompleteRates;
    const contacts = document.getElementById('commission-contacts');
    if (commission.contacts?.length) {
      const anchors = commission.contacts.map(contact => {
        const anchor = document.createElement('a');
        anchor.className = 'contact-link';
        anchor.href = contact.url;
        anchor.textContent = `${localized(contact.label)} ↗`;
        if (contact.url.startsWith('https:')) {
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
        }
        return anchor;
      });
      contacts.replaceChildren(...anchors);
    }
    contacts.hidden = !commission.contacts?.length && Object.values(commission.socialLinks || {}).some(Boolean);
    for (const [id, subjects] of [['accepted-subjects', commission.acceptedSubjects], ['declined-subjects', commission.declinedSubjects]]) {
      if (!subjects?.length) continue;
      document.getElementById(id).replaceChildren(...subjects.map(subject => {
        const item = document.createElement('li');
        item.textContent = localized(subject);
        return item;
      }));
    }
  }

  function applyLanguage(announce = false) {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n);
    });
    for (const attribute of ['aria-label', 'alt', 'content']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    }
    // Terms retain emphasis without interpreting translation text as HTML.
    document.querySelectorAll('[data-i18n-rich]').forEach(element => {
      const key = element.dataset.i18nRich;
      const chunks = translations[language]?.[key] ?? translations.en?.[key];
      if (!Array.isArray(chunks)) return;
      element.replaceChildren(...chunks.map(chunk => {
        if (typeof chunk === 'string') return document.createTextNode(chunk);
        const strong = document.createElement('strong');
        strong.textContent = chunk.strong;
        return strong;
      }));
    });
    const worksBySource = new Map(gallery.map(work => [work.src, work]));
    for (const field of ['title', 'file', 'category', 'sample', 'alt']) {
      document.querySelectorAll(`[data-artwork-${field}]`).forEach(element => {
        const work = worksBySource.get(element.getAttribute(`data-artwork-${field}`));
        if (!work) return;
        if (field === 'alt') element.setAttribute('alt', workAlt(work));
        else element.textContent = field === 'title' ? workTitle(work)
          : field === 'file' ? `${work.number} / ${workTitle(work)}`
          : field === 'category' ? workCategory(work)
          : t('commissions.sample', { category: workCategory(work) });
      });
    }
    document.querySelectorAll('[data-artwork]').forEach(anchor => {
      const work = worksBySource.get(anchor.dataset.artwork);
      if (work) anchor.setAttribute('aria-label', t('gallery.enlarge', { title: workTitle(work) }));
    });
    languageSwitch.setAttribute('aria-checked', String(language === 'es'));
    languageOptions.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.getElementById('language-window').hidden = false;
    if (announce) document.getElementById('language-status').textContent = t('language.status');
    applyFilter();
    renderCommissions();
    if (dialog.open) renderPreview();
    showView();
  }

  function setLanguage(value) {
    if (!['en', 'es'].includes(value) || value === language) return;
    language = value;
    applyLanguage(true);
    try { window.localStorage.setItem(languageStorageKey, language); } catch { /* Keep this visit usable without storage. */ }
  }
  languageSwitch.addEventListener('click', () => setLanguage(language === 'en' ? 'es' : 'en'));
  languageOptions.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  applyLanguage();

  // Decorations respond only to a mouse/trackpad; touch never needs hover.
  const stage = document.querySelector('.art-stage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let pointerX = 0, pointerY = 0;

  function resetDepth() {
    window.cancelAnimationFrame(frame);
    frame = 0;
    stage.style.setProperty('--art-shift-x', '0px');
    stage.style.setProperty('--art-shift-y', '0px');
  }

  stage.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || document.hidden || document.body.classList.contains('is-window-dragging')) return;
    const rect = stage.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)) * 4;
    pointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)) * 4;
    if (!frame) {
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        stage.style.setProperty('--art-shift-x', `${pointerX.toFixed(2)}px`);
        stage.style.setProperty('--art-shift-y', `${pointerY.toFixed(2)}px`);
      });
    }
  }, { passive: true });
  stage.addEventListener('pointerleave', resetDepth);
  window.addEventListener('hashchange', resetDepth);
  reducedMotion.addEventListener('change', resetDepth);
  finePointer.addEventListener('change', resetDepth);
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('is-paused', document.hidden);
    if (document.hidden) resetDepth();
  });
})();
