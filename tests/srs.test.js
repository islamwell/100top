import { describe, expect, it } from 'vitest';
import {
  DAY,
  MASTERED_BOX,
  buildQueue,
  deckStats,
  formatInterval,
  intervalFor,
  isDue,
  isMastered,
  isValidCardState,
  migrateMastered,
  nextDueAt,
  review,
} from '../src/js/srs.js';

const NOW = Date.UTC(2026, 8, 29, 12);

describe('review', () => {
  it('moves a new card to box 1 on "good"', () => {
    const c = review(undefined, 'good', NOW);
    expect(c).toMatchObject({ box: 1, reviews: 1, lapses: 0, due: NOW + DAY });
  });
  it('skips a box on "easy"', () => {
    expect(review(undefined, 'easy', NOW).box).toBe(2);
  });
  it('resets to box 0 and counts a lapse on "again"', () => {
    const c = review({ box: 4, due: NOW, reviews: 5, lapses: 0 }, 'again', NOW);
    expect(c.box).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.due - NOW).toBe(60 * 1000);
  });
  it('caps at the highest box', () => {
    let c;
    for (let i = 0; i < 10; i++) c = review(c, 'easy', NOW);
    expect(c.box).toBe(6);
  });
  it('rejects unknown grades', () => {
    expect(() => review(undefined, 'hard', NOW)).toThrow();
  });
});

describe('queue & stats', () => {
  const srs = {
    1: { box: 2, due: NOW - 1000, reviews: 2, lapses: 0 },
    2: { box: 5, due: NOW + 10 * DAY, reviews: 6, lapses: 0 },
    3: { box: 1, due: NOW - 5000, reviews: 1, lapses: 0 },
  };
  const ids = [1, 2, 3, 4, 5];

  it('puts overdue reviews first (oldest first), then new cards, and skips future cards', () => {
    expect(buildQueue(ids, srs, 'due', NOW)).toEqual([3, 1, 4, 5]);
  });
  it('returns all cards in order for "all"', () => {
    expect(buildQueue(ids, srs, 'all', NOW)).toEqual(ids);
  });
  it('computes deck stats', () => {
    expect(deckStats(ids, srs, NOW)).toEqual({ total: 5, fresh: 2, due: 2, learning: 2, mastered: 1 });
  });
  it('finds the next due time', () => {
    expect(nextDueAt(ids, srs, NOW)).toBe(NOW + 10 * DAY);
  });
  it('isDue / isMastered', () => {
    expect(isDue(undefined, NOW)).toBe(true);
    expect(isDue(srs[2], NOW)).toBe(false);
    expect(isMastered(srs[2])).toBe(true);
    expect(isMastered(srs[1])).toBe(false);
  });
});

describe('migration & validation', () => {
  it('migrates legacy mastered ids into the mastered box', () => {
    const srs = migrateMastered([4, 9], NOW);
    expect(Object.keys(srs)).toEqual(['4', '9']);
    expect(srs[4].box).toBe(MASTERED_BOX);
    expect(isValidCardState(srs[4])).toBe(true);
  });
  it('rejects malformed card state', () => {
    expect(isValidCardState({ box: 9, due: 1, reviews: 1 })).toBe(false);
    expect(isValidCardState({ box: 1, due: 'x', reviews: 1 })).toBe(false);
    expect(isValidCardState(null)).toBe(false);
  });
  it('formats intervals', () => {
    expect(formatInterval(intervalFor(0, 'again'))).toBe('1m');
    expect(formatInterval(intervalFor(0, 'good'))).toBe('1d');
    expect(formatInterval(intervalFor(4, 'easy'))).toBe('2mo');
  });
});
