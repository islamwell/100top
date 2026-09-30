// Shared HTML fragments. All data is escaped before interpolation.
import { escapeHtml as e, icon, verseKey } from './util.js';

/** Split "ن-ح-و (To aim, direct)" into its Arabic root and English gloss. */
export function splitRoot(root) {
  const match = String(root || '').match(/^([^(]*)\((.*)\)\s*$/);
  if (!match) return { arabic: String(root || '').trim(), gloss: '' };
  return { arabic: match[1].trim(), gloss: match[2].trim() };
}

export function rootBox(root, className = 'card-root-box', { label = false } = {}) {
  const { arabic, gloss } = splitRoot(root);
  return `<div class="${className}">${label ? '<strong>Linguistic Root:</strong> ' : ''}<span lang="ar" dir="rtl" class="root-letters">${e(arabic)}</span>${gloss ? ` <span class="root-gloss">(${e(gloss)})</span>` : ''}</div>`;
}

export function verseRef(verse) {
  return `Surah ${e(verse.surahName)} (${e(verseKey(verse))})`;
}

/**
 * Play/pause toggle for a verse. `key` identifies the verse source, e.g. "item:12", "res:3", "q:q1".
 */
export function playButton(key, verse, { label = 'Recite', className = '' } = {}) {
  const aria = `Play recitation of Surah ${verse.surahName}, ${verse.ayahEnd ? 'verses' : 'verse'} ${verseKey(verse)}`;
  return `<button type="button" class="btn-play-verse${className ? ' ' + className : ''}" data-play="${e(key)}" data-label="${e(label)}" aria-label="${e(aria)}" aria-pressed="false">${icon('play')}<span class="lbl">${e(label)}</span></button>`;
}

export function verseBox(key, verse, { refPrefix = '', label = 'Recite', english = true, arabicClass = 'card-verse-arabic' } = {}) {
  return `<div class="card-verse-box">
    <div class="card-verse-header">
      <span class="card-verse-ref">${refPrefix}${verseRef(verse)}</span>
      ${playButton(key, verse, { label })}
    </div>
    <blockquote class="${arabicClass} font-arabic" lang="ar" dir="rtl">${e(verse.textArabic)}</blockquote>
    ${english ? `<p class="card-verse-english">“${e(verse.textEnglish)}”</p>` : ''}
  </div>`;
}
