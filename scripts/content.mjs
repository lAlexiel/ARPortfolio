import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function compareNumberedFiles(a, b) {
  const aa = BigInt(a.match(/^\d+/)[0]);
  const bb = BigInt(b.match(/^\d+/)[0]);
  return aa < bb ? -1 : aa > bb ? 1 : a.localeCompare(b, 'en');
}

function dimensions(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length > 4 && buffer.readUInt16BE(0) === 0xffd8) {
    let p = 2;
    while (p + 4 <= buffer.length) {
      if (buffer[p++] !== 0xff) continue;
      while (buffer[p] === 0xff) p++;
      const marker = buffer[p++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd8) continue;
      if (p + 2 > buffer.length) break;
      const length = buffer.readUInt16BE(p);
      if (length < 2 || p + length > buffer.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 7) {
        return { width: buffer.readUInt16BE(p + 5), height: buffer.readUInt16BE(p + 3) };
      }
      p += length;
    }
  }
  return {};
}

export async function buildGallery(root, metadata = {}) {
  const directory = path.join(root, 'assets', 'gallery');
  const entries = await readdir(directory, { withFileTypes: true });
  const filenames = entries.filter(entry => entry.isFile() && /^\d+(?=[._ -])/.test(entry.name) && /\.(png|jpe?g|gif|webp|avif)$/i.test(entry.name)).map(entry => entry.name).sort(compareNumberedFiles);
  return Promise.all(filenames.map(async filename => {
    const custom = Object.hasOwn(metadata, filename) ? metadata[filename] : {};
    if (!custom || typeof custom !== 'object' || Array.isArray(custom)) throw Error(`Invalid gallery metadata for ${filename}`);
    for (const field of ['title', 'alt', 'titleEs', 'altEs', 'category']) if (custom[field] !== undefined && typeof custom[field] !== 'string') throw Error(`Invalid ${field} for ${filename}`);
    const number = filename.match(/^\d+/)[0];
    const title = custom.title || `Artwork ${number}`;
    const category = ['Portraits', 'Illustrations'].includes(custom.category) ? custom.category : 'Illustrations';
    const titleEs = custom.titleEs || custom.title || `Obra ${number}`;
    return { src: `assets/gallery/${encodeURIComponent(filename)}`, title, titleEs, alt: custom.alt || `${title} by Angie Rouge`, altEs: custom.altEs || custom.alt || `${titleEs}, de Angie Rouge`, category, number, ...dimensions(await readFile(path.join(directory, filename))) };
  }));
}

function localizedText(value) {
  return typeof value === 'string' && !!value.trim() || !!value && typeof value === 'object' && !Array.isArray(value)
    && typeof value.en === 'string' && !!value.en.trim() && typeof value.es === 'string' && !!value.es.trim();
}

export function validateTranslations(translations) {
  if (!translations || !translations.en || !translations.es) throw Error('English and Spanish translations are required');
  const keys = Object.keys(translations.en).sort();
  if (JSON.stringify(keys) !== JSON.stringify(Object.keys(translations.es).sort())) throw Error('English and Spanish translation keys must match');
  for (const language of ['en', 'es']) for (const key of keys) {
    const message = translations[language][key];
    const valid = typeof message === 'string' && !!message.trim() || Array.isArray(message) && message.length > 0
      && message.every(chunk => typeof chunk === 'string' || chunk && typeof chunk.strong === 'string' && Object.keys(chunk).length === 1);
    if (!valid) throw Error(`Invalid translation: ${language}.${key}`);
    const other = translations[language === 'en' ? 'es' : 'en'][key];
    if (Array.isArray(message) !== Array.isArray(other)) throw Error(`Translation types must match: ${key}`);
    if (typeof message === 'string' && JSON.stringify([...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()) !== JSON.stringify([...other.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort())) throw Error(`Translation placeholders must match: ${key}`);
  }
  return translations;
}

export function validateCommissions(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Commission content must be an object');
  if (typeof data.currency !== 'string' || data.currency && !/^[A-Z]{3}$/.test(data.currency)) throw Error('Use an empty currency or a three-letter currency code');
  if (data.currency) new Intl.NumberFormat('en', { style: 'currency', currency: data.currency });
  if (!Array.isArray(data.contacts)) throw Error('Contacts must be an array');
  if (!Array.isArray(data.examples) || data.examples.some(value => typeof value !== 'string' || path.basename(value) !== value || /[\\/]/.test(value))) throw Error('Examples must be artwork filenames from assets/gallery');
  for (const contact of data.contacts) {
    if (!contact || !localizedText(contact.label) || typeof contact.url !== 'string') throw Error('Each contact needs a label and URL');
    const url = new URL(contact.url);
    if (!['https:', 'mailto:'].includes(url.protocol)) throw Error('Contact URLs must use https or mailto');
    if (url.username || url.password || /[\r\n]/.test(contact.url)) throw Error('Contact URLs cannot contain credentials or line breaks');
  }
  if (data.socialLinks !== undefined) {
    if (!data.socialLinks || typeof data.socialLinks !== 'object' || Array.isArray(data.socialLinks)) throw Error('Social links must be an object');
    for (const [platform, value] of Object.entries(data.socialLinks)) {
      if (!['instagram', 'x', 'paypal'].includes(platform)) throw Error(`Unknown social platform: ${platform}`);
      if (value === null || value === '') continue;
      if (typeof value !== 'string') throw Error('Social URLs must be strings or null');
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || /[\r\n]/.test(value)) throw Error('Social URLs must use https without credentials or line breaks');
    }
  }
  for (const field of ['acceptedSubjects', 'declinedSubjects']) {
    if (!Array.isArray(data[field]) || data[field].some(value => !localizedText(value))) throw Error(`${field} must be an array of nonempty strings or bilingual text objects`);
  }
  for (const [group, keys] of Object.entries({ headshot: ['simple','full','background'], halfBody: ['simple','full','background'], fullBody: ['simple','full','background'], background: ['simple','full'], extras: ['additionalCharacter','detailedBackground'] })) {
    for (const key of keys) {
      const value = data.rates?.[group]?.[key];
      if (value !== null && !localizedText(value) && !(typeof value === 'number' && Number.isFinite(value) && value >= 0 && data.currency)) throw Error(`Invalid rate: ${group}.${key}; use null, descriptive text, or a nonnegative number with a currency`);
    }
  }
  return data;
}

export function renderSocialButtons(links = {}) {
  return [['instagram', 'Instagram'], ['x', 'X'], ['paypal', 'PayPal']].map(([platform, label]) => {
    const icon = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-${platform}"/></svg><span>${label}</span>`;
    const classes = `social-button social-${platform}`;
    if (!links[platform]) return `<button class="${classes}" type="button" disabled aria-label="${label} link coming soon" data-i18n-aria-label="social.${platform}Pending">${icon}</button>`;
    return `<a class="${classes}" href="${escapeHtml(links[platform])}" target="_blank" rel="noopener noreferrer" aria-label="Open ${label} in a new tab" data-i18n-aria-label="social.${platform}Label">${icon}</a>`;
  }).join('\n');
}

export function renderGalleryCard(work) {
  const src = escapeHtml(work.src);
  const size = work.width && work.height ? ` width="${work.width}" height="${work.height}"` : '';
  return `            <figure class="artwork-card" data-category="${work.category.toLowerCase()}">
              <a class="artwork-link" href="${src}" data-artwork="${src}" aria-label="Enlarge ${escapeHtml(work.title)}">
                <span class="artwork-file"><span data-artwork-file="${src}">${escapeHtml(work.number)} / ${escapeHtml(work.title)}</span><span aria-hidden="true">↗</span></span>
                <span class="artwork-thumbnail"><img src="${src}" data-artwork-alt="${src}" alt="${escapeHtml(work.alt)}"${size} loading="lazy" decoding="async"></span>
              </a>
              <figcaption><h2 data-artwork-title="${src}">${escapeHtml(work.title)}</h2><span data-artwork-category="${src}">${escapeHtml(work.category)}</span></figcaption>
            </figure>`;
}

export function renderCommissionExample(work) {
  const src = escapeHtml(work.src);
  const size = work.width && work.height ? ` width="${work.width}" height="${work.height}"` : '';
  return `          <figure><a href="${src}" data-artwork="${src}" aria-label="Enlarge ${escapeHtml(work.title)}"><img src="${src}" data-artwork-alt="${src}" alt="${escapeHtml(work.alt)}"${size} loading="lazy"><span aria-hidden="true">↗</span></a><figcaption><strong data-artwork-title="${src}">${escapeHtml(work.title)}</strong> <span data-artwork-sample="${src}">${escapeHtml(work.category)} · portfolio sample</span></figcaption></figure>`;
}
