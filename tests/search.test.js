import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  buildSearchIndex,
  filterItems,
  hasArabic,
  matchesQuery,
  matchesText,
  normalizeArabic,
  parseRootQuery,
  rootLetters,
  transliterateRoot,
} from '../src/js/search.js';

const data = JSON.parse(readFileSync(new URL('../src/data/data.json', import.meta.url), 'utf8'));
const index = new Map(data.items.map((i) => [i.id, buildSearchIndex(i)]));
const search = (query, opts = {}) => filterItems(data.items, index, { query, ...opts });

describe('normalizeArabic', () => {
  it('strips harakat, tatweel and Quranic marks', () => {
    expect(normalizeArabic('بِسْمِ ٱللَّهِ')).toBe('بسم الله');
    expect(normalizeArabic('ٱلرَّحْمَـٰنِ')).toBe('الرحمن');
    expect(normalizeArabic('صَبْرٌ ۚ')).toBe('صبر');
  });
  it('unifies letter variants', () => {
    expect(normalizeArabic('إيمان')).toBe(normalizeArabic('ايمان'));
    expect(normalizeArabic('رحمة')).toBe('رحمه');
    expect(normalizeArabic('هدى')).toBe('هدي');
  });
  it('handles empty input', () => {
    expect(normalizeArabic('')).toBe('');
    expect(normalizeArabic(null)).toBe('');
  });
});

describe('roots', () => {
  it('extracts root letters', () => {
    expect(rootLetters('ن-ح-و (To aim, direct)')).toEqual(['ن', 'ح', 'و']);
    expect(transliterateRoot(['س', 'ل', 'م'])).toBe('s-l-m');
  });
  it('parses root-style queries only', () => {
    expect(parseRootQuery('S-L-M')).toEqual(['s', 'l', 'm']);
    expect(parseRootQuery('k t b')).toEqual(['k', 't', 'b']);
    expect(parseRootQuery('prayer')).toBeNull();
    expect(parseRootQuery('the heart of it')).toBeNull();
  });
});

describe('matchesQuery / filterItems', () => {
  it('finds the Nahw item by transliterated root', () => {
    expect(search('n-h-w').has(1)).toBe(true);
  });
  it('finds S-L-M, the example advertised in the search placeholder', () => {
    expect(search('S-L-M').size).toBeGreaterThan(0);
  });
  it('matches Arabic without diacritics', () => {
    expect(search('النحو').has(1)).toBe(true);
  });
  it('matches by id', () => {
    expect([...search('#42')]).toEqual([42]);
  });
  it('uses AND semantics across words', () => {
    const both = search('arabic syntax');
    expect(both.has(1)).toBe(true);
    expect(both.size).toBeLessThan(search('arabic').size);
  });
  it('matches any ayah inside a multi-verse citation', () => {
    const item = data.items.find((i) => i.verse.ayahEnd);
    expect(search(`${item.verse.surah}:${item.verse.ayahEnd}`).has(item.id)).toBe(true);
  });
  it('matches surah names and verse refs', () => {
    expect(search('12:2').has(1)).toBe(true);
    expect(search('yusuf').has(1)).toBe(true);
  });
  it('returns everything for an empty query', () => {
    expect(search('').size).toBe(data.items.length);
    expect(matchesQuery(index.get(1), '   ')).toBe(true);
  });
  it('filters by category and bookmarks', () => {
    const cat = data.categories[2].id;
    expect(search('', { category: cat }).size).toBe(data.items.filter((i) => i.category === cat).length);
    expect([...search('', { bookmarksOnly: true, bookmarks: new Set([3, 7]) })]).toEqual([3, 7]);
  });
  it('ignores diacritics in Latin queries', () => {
    expect(search('ṣabr').size).toBe(search('sabr').size);
  });
});

describe('helpers', () => {
  it('detects Arabic', () => {
    expect(hasArabic('abc')).toBe(false);
    expect(hasArabic('abc سلام')).toBe(true);
  });
  it('matchesText', () => {
    expect(matchesText(['Problem of Evil and Suffering'], 'suffering evil')).toBe(true);
    expect(matchesText(['Problem of Evil'], 'science')).toBe(false);
  });
});
