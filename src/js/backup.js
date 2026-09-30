// Backup/restore format and validation. Restored files are untrusted input.
import { isValidCardState } from './srs.js';

export const BACKUP_FORMAT = 2;
export const MAX_NOTE_LENGTH = 50000;
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export function createBackup({ version, bookmarks, journalNotes, srs, theme, reciter }) {
  return {
    app: '100Top Islam & Quran',
    format: BACKUP_FORMAT,
    version,
    exportedAt: new Date().toISOString(),
    bookmarks: [...bookmarks],
    journalNotes: { ...journalNotes },
    srs: { ...srs },
    theme,
    reciter,
  };
}

/**
 * Validate and sanitize a parsed backup object.
 * Unknown ids and malformed entries are dropped rather than trusted.
 * @returns {{ bookmarks: number[], journalNotes: Record<string,string>, srs: object, masteredLegacy: number[], dropped: number }}
 */
export function sanitizeBackup(data, { itemIds, questionIds }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Backup file is not a JSON object.');
  }
  let dropped = 0;

  const bookmarks = [];
  if (data.bookmarks !== undefined) {
    if (!Array.isArray(data.bookmarks)) throw new Error('"bookmarks" must be a list.');
    for (const id of data.bookmarks) {
      if (Number.isInteger(id) && itemIds.has(id) && !bookmarks.includes(id)) bookmarks.push(id);
      else dropped++;
    }
  }

  const journalNotes = {};
  if (data.journalNotes !== undefined) {
    if (!data.journalNotes || typeof data.journalNotes !== 'object' || Array.isArray(data.journalNotes)) {
      throw new Error('"journalNotes" must be an object.');
    }
    for (const [qid, note] of Object.entries(data.journalNotes)) {
      if (questionIds.has(qid) && typeof note === 'string') journalNotes[qid] = note.slice(0, MAX_NOTE_LENGTH);
      else dropped++;
    }
  }

  const srs = {};
  if (data.srs !== undefined) {
    if (!data.srs || typeof data.srs !== 'object' || Array.isArray(data.srs)) throw new Error('"srs" must be an object.');
    for (const [key, card] of Object.entries(data.srs)) {
      const id = Number(key);
      if (itemIds.has(id) && isValidCardState(card)) {
        srs[id] = {
          box: card.box,
          due: card.due,
          reviews: card.reviews,
          lapses: Number.isInteger(card.lapses) ? card.lapses : 0,
          last: Number.isFinite(card.last) ? card.last : card.due,
        };
      } else dropped++;
    }
  }

  // v1.0.x backups stored a flat list of mastered card ids.
  const masteredLegacy = [];
  if (Array.isArray(data.masteredCards)) {
    for (const id of data.masteredCards) {
      if (Number.isInteger(id) && itemIds.has(id)) masteredLegacy.push(id);
      else dropped++;
    }
  }

  return { bookmarks, journalNotes, srs, masteredLegacy, dropped };
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
