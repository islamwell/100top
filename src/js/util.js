// Small, dependency-free helpers shared by the browser app, the build script and tests.

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a value for safe interpolation into HTML text or attribute values. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Inline SVG icon referencing the build-generated sprite.
 * Names map to Font Awesome Free files; a "-regular" suffix selects the outline style.
 * Always call with a string literal so the build can find every icon in use.
 */
export function icon(name, className = '') {
  return `<svg class="icon${className ? ' ' + className : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

export function pad3(n) {
  return String(n).padStart(3, '0');
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function debounce(fn, wait = 150) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return debounced;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** "2:255", or "112:1–4" for a multi-verse passage (ayahEnd). */
export function verseKey(verse) {
  return verse.ayahEnd && verse.ayahEnd > verse.ayah ? `${verse.surah}:${verse.ayah}–${verse.ayahEnd}` : `${verse.surah}:${verse.ayah}`;
}

/** Every ayah number in the citation, in order. */
export function verseAyahs(verse) {
  const end = verse.ayahEnd && verse.ayahEnd > verse.ayah ? verse.ayahEnd : verse.ayah;
  return Array.from({ length: end - verse.ayah + 1 }, (_, i) => verse.ayah + i);
}

export function wordCount(text) {
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
