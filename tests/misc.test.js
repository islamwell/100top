import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { escapeHtml, formatTime, slugify, verseAyahs, verseKey, wordCount } from '../src/js/util.js';
import { splitRoot } from '../src/js/templates.js';
import { parseHash } from '../src/js/router.js';
import { validateData, AYAH_COUNTS } from '../scripts/validate-data.mjs';

const data = JSON.parse(readFileSync(new URL('../src/data/data.json', import.meta.url), 'utf8'));

describe('util', () => {
  it('escapes HTML', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
  it('formats time', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(NaN)).toBe('0:00');
  });
  it('slugifies and counts words', () => {
    expect(slugify("Arabic Syntax (Nahw) – I'rāb")).toBe('arabic-syntax-nahw-i-rab');
    expect(wordCount('  one two\nthree ')).toBe(3);
    expect(wordCount('')).toBe(0);
  });
  it('formats verse ranges', () => {
    expect(verseKey({ surah: 2, ayah: 255 })).toBe('2:255');
    expect(verseKey({ surah: 112, ayah: 1, ayahEnd: 4 })).toBe('112:1–4');
    expect(verseAyahs({ surah: 112, ayah: 1, ayahEnd: 4 })).toEqual([1, 2, 3, 4]);
    expect(verseAyahs({ surah: 2, ayah: 255 })).toEqual([255]);
  });
  it('splits roots', () => {
    expect(splitRoot('ن-ح-و (To aim, direct)')).toEqual({ arabic: 'ن-ح-و', gloss: 'To aim, direct' });
    expect(splitRoot('س-ل-م')).toEqual({ arabic: 'س-ل-م', gloss: '' });
  });
});

describe('router', () => {
  it('parses hashes', () => {
    expect(parseHash('#dim-42')).toEqual({ type: 'item', id: 42 });
    expect(parseHash('#res-3')).toEqual({ type: 'reservation', id: 3 });
    expect(parseHash('#flashcards')).toEqual({ type: 'tab', tab: 'flashcards' });
    expect(parseHash('#tab-questions')).toEqual({ type: 'tab', tab: 'questions' });
    expect(parseHash('#journal')).toEqual({ type: 'tab', tab: 'questions' });
    expect(parseHash('#nope')).toEqual({ type: 'none' });
    expect(parseHash('')).toEqual({ type: 'none' });
  });
});

describe('data.json', () => {
  it('passes structural validation', () => {
    expect(validateData(data)).toEqual([]);
  });
  it('ayah table covers the whole Quran', () => {
    expect(AYAH_COUNTS).toHaveLength(114);
    expect(AYAH_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236);
  });
  it('catches bad verse references', () => {
    const broken = structuredClone(data);
    broken.items[0].verse.ayah = 999;
    broken.items[1].category = 'Nope';
    broken.items[2].verse.ayahEnd = broken.items[2].verse.ayah; // range must extend past the start
    const problems = validateData(broken);
    expect(problems.some((p) => p.includes('invalid ayah'))).toBe(true);
    expect(problems.some((p) => p.includes('invalid ayahEnd'))).toBe(true);
    expect(problems.some((p) => p.includes('unknown category'))).toBe(true);
  });
  it('has no raw HTML in content', () => {
    expect(JSON.stringify(data)).not.toMatch(/<[a-z/]/i);
  });
});
