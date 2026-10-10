import { describe, expect, it } from 'vitest';
import { MAX_NOTE_LENGTH, createBackup, sanitizeBackup } from '../src/js/backup.js';

const ctx = { itemIds: new Set([1, 2, 3]), questionIds: new Set(['q1', 'q2']) };

describe('sanitizeBackup', () => {
  it('accepts a valid v2 backup', () => {
    const backup = createBackup({
      version: '1.1.4',
      bookmarks: new Set([1, 3]),
      journalNotes: { q1: 'note' },
      srs: { 2: { box: 1, due: 1, reviews: 1, lapses: 0, last: 1 } },
      theme: 'light',
      reciter: 'x',
    });
    const clean = sanitizeBackup(JSON.parse(JSON.stringify(backup)), ctx);
    expect(clean.bookmarks).toEqual([1, 3]);
    expect(clean.journalNotes).toEqual({ q1: 'note' });
    expect(clean.srs[2].box).toBe(1);
    expect(clean.dropped).toBe(0);
  });

  it('drops unknown ids, wrong types and duplicates', () => {
    const clean = sanitizeBackup(
      {
        bookmarks: [1, 1, 99, '2', 2],
        journalNotes: { q1: 'ok', q9: 'unknown', q2: { html: '<b>' } },
        srs: { 1: { box: 99, due: 1, reviews: 1 }, 3: { box: 2, due: 5, reviews: 2 } },
      },
      ctx,
    );
    expect(clean.bookmarks).toEqual([1, 2]);
    expect(clean.journalNotes).toEqual({ q1: 'ok' });
    expect(Object.keys(clean.srs)).toEqual(['3']);
    expect(clean.dropped).toBe(6);
  });

  it('keeps markup in notes as plain text (rendering uses textarea.value, never innerHTML)', () => {
    const payload = '</textarea><img src=x onerror=alert(1)>';
    const clean = sanitizeBackup({ journalNotes: { q1: payload } }, ctx);
    expect(clean.journalNotes.q1).toBe(payload);
  });

  it('truncates very long notes', () => {
    const clean = sanitizeBackup({ journalNotes: { q1: 'a'.repeat(MAX_NOTE_LENGTH + 10) } }, ctx);
    expect(clean.journalNotes.q1.length).toBe(MAX_NOTE_LENGTH);
  });

  it('migrates v1 masteredCards', () => {
    expect(sanitizeBackup({ masteredCards: [2, 50] }, ctx).masteredLegacy).toEqual([2]);
  });

  it('rejects non-object input and wrong top-level types', () => {
    expect(() => sanitizeBackup(null, ctx)).toThrow();
    expect(() => sanitizeBackup([], ctx)).toThrow();
    expect(() => sanitizeBackup({ bookmarks: 'x' }, ctx)).toThrow();
    expect(() => sanitizeBackup({ journalNotes: [] }, ctx)).toThrow();
  });
});
