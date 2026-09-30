// Leitner-style spaced repetition. Pure functions; state is a plain object keyed by card id.
//   card state: { box: 0..6, due: epoch ms, reviews: n, lapses: n, last: epoch ms }

export const DAY = 24 * 60 * 60 * 1000;
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];
export const MAX_BOX = INTERVAL_DAYS.length - 1;
export const MASTERED_BOX = 4; // 14+ day interval
export const GRADES = ['again', 'good', 'easy'];

export function nextBox(box, grade) {
  const current = Number.isInteger(box) ? box : 0;
  if (grade === 'again') return 0;
  if (grade === 'easy') return Math.min(MAX_BOX, current + 2);
  return Math.min(MAX_BOX, current + 1);
}

/** Interval (ms) that would follow a grade. "again" re-shows the card after one minute. */
export function intervalFor(box, grade) {
  if (grade === 'again') return 60 * 1000;
  return INTERVAL_DAYS[nextBox(box, grade)] * DAY;
}

export function review(card, grade, now = Date.now()) {
  if (!GRADES.includes(grade)) throw new Error(`Unknown grade: ${grade}`);
  const prev = card || { box: 0, due: now, reviews: 0, lapses: 0 };
  const box = nextBox(prev.box, grade);
  return {
    box,
    due: now + intervalFor(prev.box, grade),
    reviews: (prev.reviews || 0) + 1,
    lapses: (prev.lapses || 0) + (grade === 'again' && prev.reviews ? 1 : 0),
    last: now,
  };
}

export function isNew(card) {
  return !card || !card.reviews;
}

export function isDue(card, now = Date.now()) {
  return !card || card.due <= now;
}

export function isMastered(card) {
  return Boolean(card) && card.box >= MASTERED_BOX;
}

/** Human label for an interval, e.g. "1m", "3d". */
export function formatInterval(ms) {
  if (ms < 60 * 60 * 1000) return `${Math.max(1, Math.round(ms / 60000))}m`;
  if (ms < DAY) return `${Math.round(ms / 3600000)}h`;
  const days = Math.round(ms / DAY);
  return days >= 30 ? `${Math.round(days / 30)}mo` : `${days}d`;
}

/**
 * Build the study queue.
 *  - "due": reviews that are due (oldest first), then unseen cards in original order
 *  - "all": every card in original order
 */
export function buildQueue(ids, srs, mode = 'due', now = Date.now()) {
  if (mode === 'all') return [...ids];
  const due = [];
  const fresh = [];
  for (const id of ids) {
    const card = srs[id];
    if (isNew(card)) fresh.push(id);
    else if (isDue(card, now)) due.push(id);
  }
  due.sort((a, b) => srs[a].due - srs[b].due);
  return [...due, ...fresh];
}

export function deckStats(ids, srs, now = Date.now()) {
  const stats = { total: ids.length, fresh: 0, due: 0, learning: 0, mastered: 0 };
  for (const id of ids) {
    const card = srs[id];
    if (isNew(card)) stats.fresh++;
    else {
      if (isDue(card, now)) stats.due++;
      if (isMastered(card)) stats.mastered++;
      else stats.learning++;
    }
  }
  return stats;
}

/** Earliest future due time among reviewed cards, or null. */
export function nextDueAt(ids, srs, now = Date.now()) {
  let next = null;
  for (const id of ids) {
    const card = srs[id];
    if (card && card.reviews && card.due > now && (next === null || card.due < next)) next = card.due;
  }
  return next;
}

/** Convert the legacy "mastered" id list into SRS state. */
export function migrateMastered(masteredIds, now = Date.now()) {
  const srs = {};
  for (const id of masteredIds) {
    srs[id] = { box: MASTERED_BOX, due: now + INTERVAL_DAYS[MASTERED_BOX] * DAY, reviews: 1, lapses: 0, last: now };
  }
  return srs;
}

export function isValidCardState(card) {
  return (
    card !== null &&
    typeof card === 'object' &&
    Number.isInteger(card.box) &&
    card.box >= 0 &&
    card.box <= MAX_BOX &&
    Number.isFinite(card.due) &&
    Number.isInteger(card.reviews) &&
    card.reviews >= 0
  );
}
