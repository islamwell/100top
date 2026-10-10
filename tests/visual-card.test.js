import { describe, expect, it } from 'vitest';
import { CARD_THEMES, wrapText } from '../src/js/visual-card.js';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../src/data/data.json', import.meta.url), 'utf8'));

describe('CARD_THEMES', () => {
  it('defines emerald, midnight, and onyx themes with required palette keys', () => {
    expect(CARD_THEMES.emerald).toBeDefined();
    expect(CARD_THEMES.midnight).toBeDefined();
    expect(CARD_THEMES.onyx).toBeDefined();

    for (const theme of Object.values(CARD_THEMES)) {
      expect(theme.name).toBeTruthy();
      expect(theme.bgRadial).toHaveLength(3);
      expect(theme.arabicTitle).toBeTruthy();
      expect(theme.englishTitle).toBeTruthy();
      expect(theme.quoteBoxBg).toBeTruthy();
      expect(theme.verseBoxBg).toBeTruthy();
      expect(theme.brandTitle).toBeTruthy();
    }
  });
});

describe('wrapText', () => {
  const fakeCtx = {
    measureText: (text) => ({ width: text.length * 10 }),
  };

  it('splits text into lines when width exceeds limit', () => {
    const lines = wrapText(fakeCtx, 'One two three four five six', 120);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('One two three four five six');
  });

  it('handles empty and short inputs', () => {
    expect(wrapText(fakeCtx, '', 100)).toEqual([]);
    expect(wrapText(fakeCtx, 'Hello', 100)).toEqual(['Hello']);
  });

  it('wraps all 200 dimension quotes and verses without error', () => {
    for (const item of data.items) {
      const qLines = wrapText(fakeCtx, item.quote, 500);
      const arLines = wrapText(fakeCtx, item.verse.textArabic, 500);
      const enLines = wrapText(fakeCtx, item.verse.textEnglish, 500);

      expect(qLines.length).toBeGreaterThan(0);
      expect(arLines.length).toBeGreaterThan(0);
      expect(enLines.length).toBeGreaterThan(0);
    }
  });
});
