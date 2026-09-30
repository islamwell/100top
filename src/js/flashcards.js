// Active-recall flashcards with Leitner spaced repetition.
import { app, on, saveSrs } from './state.js';
import { buildQueue, deckStats, formatInterval, intervalFor, isMastered, nextDueAt, review } from './srs.js';
import { escapeHtml as e, icon, pad3 } from './util.js';
import { rootBox, verseBox, verseRef, playButton } from './templates.js';
import { $, $$, toast } from './ui.js';
import { updateButtons } from './audio.js';

const session = {
  category: 'all',
  mode: 'due', // 'due' | 'all' | 'shuffle'
  reverse: false,
  queue: [],
  index: 0,
  flipped: false,
};
let dom = {};

function deckIds() {
  return app.data.items.filter((i) => session.category === 'all' || i.category === session.category).map((i) => i.id);
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rebuildQueue() {
  const ids = deckIds();
  if (session.mode === 'shuffle') session.queue = shuffle(ids);
  else session.queue = buildQueue(ids, app.srs, session.mode);
  session.index = 0;
}

function currentItem() {
  return app.itemsById.get(session.queue[session.index]);
}

// ─── Rendering ─────────────────────────────────────────────────────────────
function categoryTag(item) {
  const cat = app.categoryById.get(item.category);
  return `<span class="card-category-tag">${e(cat?.short || item.category)}</span>`;
}

function statusBadge(item) {
  const card = app.srs[item.id];
  if (!card || !card.reviews) return '<span class="fc-badge fc-badge-new">New</span>';
  if (isMastered(card)) return `<span class="fc-badge fc-badge-mastered">${icon('check')} Mastered</span>`;
  return `<span class="fc-badge">Box ${card.box}</span>`;
}

function termSide(item, { isAnswer }) {
  return `
    <div class="fc-top">
      <span class="card-id-badge">${isAnswer ? `${icon('check')} Term` : `Card #${pad3(item.id)}`}</span>
      ${categoryTag(item)} ${isAnswer ? '' : statusBadge(item)}
    </div>
    <div class="fc-center">
      ${isAnswer ? '' : '<p class="fc-prompt">What is the meaning and Quranic significance of:</p>'}
      <p class="flash-arabic font-arabic" lang="ar" dir="rtl">${e(item.arabic)}</p>
      ${rootBox(item.root, 'card-root-box fc-root', { label: true })}
      ${isAnswer ? `<p class="fc-ref">${verseRef(item.verse)}</p>` : ''}
    </div>
    <div class="fc-bottom">
      ${playButton(`item:${item.id}`, item.verse, { label: 'Recite Ayah' })}
      <span class="fc-hint">${icon('hand-pointer', 'text-gold')} Click the card or press Space to flip</span>
    </div>`;
}

function meaningSide(item, { isAnswer }) {
  if (!isAnswer) {
    return `
      <div class="fc-top">
        <span class="card-id-badge">Card #${pad3(item.id)}</span>
        ${categoryTag(item)} ${statusBadge(item)}
      </div>
      <div class="fc-center">
        <p class="fc-prompt">Recall the Arabic term and root for:</p>
        <h3 class="fc-title">${e(item.title)}</h3>
        <p class="fc-summary">${e(item.summary)}</p>
      </div>
      <div class="fc-bottom">
        <span class="fc-hint-strong">${icon('brain')} Active recall</span>
        <span class="fc-hint">${icon('hand-pointer', 'text-gold')} Click the card or press Space to reveal</span>
      </div>`;
  }
  return `
    <div class="fc-top">
      <span class="card-id-badge fc-answer-badge">${icon('lightbulb')} Answer</span>
      ${categoryTag(item)}
    </div>
    <div class="fc-center fc-center-left">
      <div class="fc-title-row">
        <h3 class="fc-title">${e(item.title)}</h3>
        <span class="flash-arabic-sm font-arabic" lang="ar" dir="rtl">${e(item.arabic)}</span>
      </div>
      <p class="fc-summary">${e(item.summary)}</p>
      ${verseBox(`item:${item.id}`, item.verse, { arabicClass: 'card-verse-arabic' })}
      <p class="fc-action"><strong>Practice:</strong> ${e(item.practicalTakeaway)}</p>
    </div>`;
}

function renderCaughtUp() {
  const ids = deckIds();
  const nextDue = nextDueAt(ids, app.srs);
  dom.front.innerHTML = `
    <div class="fc-center fc-done">
      <p class="fc-done-icon">${icon('circle-check')}</p>
      <h3 class="fc-title">All caught up</h3>
      <p class="fc-summary">No cards in this deck are due right now.${nextDue ? ` Next review ${new Date(nextDue).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.` : ''}</p>
      <button type="button" class="btn-flash-action" data-study-all>${icon('layer-group')} Study all cards anyway</button>
    </div>`;
  dom.back.innerHTML = '';
  dom.wrapper.classList.add('fc-empty');
  dom.current.textContent = '0';
  dom.total.textContent = '0';
  dom.progress.style.width = '100%';
  setFlipped(false);
  dom.gradeGroup.hidden = true;
  dom.flipBtn.disabled = true;
}

function renderStats() {
  const s = deckStats(deckIds(), app.srs);
  dom.stats.innerHTML = `<span><strong>${s.due}</strong> due</span><span><strong>${s.fresh}</strong> new</span><span><strong>${s.learning}</strong> learning</span><span class="text-emerald"><strong>${s.mastered}</strong> mastered</span>`;
}

function renderGradeHints(item) {
  const box = app.srs[item.id]?.box ?? 0;
  $$('[data-grade]', dom.gradeGroup).forEach((btn) => {
    const hint = btn.querySelector('.grade-hint');
    if (hint) hint.textContent = formatInterval(intervalFor(box, btn.dataset.grade));
  });
}

function render() {
  renderStats();
  const item = currentItem();
  if (!item) {
    renderCaughtUp();
    announce('No cards due in this deck.');
    return;
  }
  dom.wrapper.classList.remove('fc-empty');
  dom.flipBtn.disabled = false;
  const front = session.reverse ? meaningSide : termSide;
  const back = session.reverse ? termSide : meaningSide;
  dom.front.innerHTML = front(item, { isAnswer: false });
  dom.back.innerHTML = back(item, { isAnswer: true });
  setFlipped(false);
  renderGradeHints(item);
  updateButtons(dom.wrapper);

  const total = session.queue.length;
  dom.current.textContent = String(session.index + 1);
  dom.total.textContent = String(total);
  dom.progress.style.width = `${((session.index + 1) / total) * 100}%`;
  announce(`Card ${session.index + 1} of ${total}: ${session.reverse ? item.title : 'Arabic term shown'}`);
}

function announce(text) {
  dom.live.textContent = text;
}

function setFlipped(flipped) {
  session.flipped = flipped;
  dom.wrapper.classList.toggle('flipped', flipped);
  dom.front.inert = flipped;
  dom.back.inert = !flipped;
  dom.front.setAttribute('aria-hidden', String(flipped));
  dom.back.setAttribute('aria-hidden', String(!flipped));
  dom.gradeGroup.hidden = !flipped || !currentItem();
  dom.flipBtn.setAttribute('aria-pressed', String(flipped));
  if (flipped) announce('Answer revealed. Grade yourself: Again, Good or Easy.');
}

// ─── Actions ───────────────────────────────────────────────────────────────
export function flip() {
  if (!currentItem()) return;
  setFlipped(!session.flipped);
}

export function nextCard() {
  if (!session.queue.length) return;
  if (session.index < session.queue.length - 1) session.index++;
  else if (session.mode === 'due') {
    rebuildQueue();
    if (!session.queue.length) toast('Deck complete. Nothing else is due right now.');
  } else {
    session.index = 0;
    toast('End of deck. Starting again from the first card.');
  }
  render();
}

export function prevCard() {
  if (!session.queue.length) return;
  session.index = (session.index - 1 + session.queue.length) % session.queue.length;
  render();
}

export function grade(g) {
  const item = currentItem();
  if (!item || !session.flipped) return;
  app.srs[item.id] = review(app.srs[item.id], g);
  saveSrs();
  if (g === 'again' && session.mode === 'due') session.queue.push(item.id);
  if (isMastered(app.srs[item.id]) && g !== 'again') announce(`${item.title} is now mastered.`);
  nextCard();
}

export function isFlipped() {
  return session.flipped;
}

function fillCategorySelect() {
  const counts = new Map();
  app.data.items.forEach((i) => counts.set(i.category, (counts.get(i.category) || 0) + 1));
  dom.category.innerHTML = [
    `<option value="all">All ${app.data.items.length} dimensions</option>`,
    ...app.data.categories.map((c) => `<option value="${e(c.id)}">${e(c.short)} (${counts.get(c.id) || 0})</option>`),
  ].join('');
}

export function refresh() {
  rebuildQueue();
  render();
}

export function initFlashcards() {
  dom = {
    wrapper: $('#flashcard-wrapper'),
    front: $('#flashcard-front'),
    back: $('#flashcard-back'),
    current: $('#flashcard-current-num'),
    total: $('#flashcard-total-num'),
    stats: $('#flashcard-stats'),
    progress: $('#flashcard-progress-bar'),
    category: $('#flash-category-select'),
    mode: $('#flash-mode-select'),
    direction: $('#btn-flash-mode-toggle'),
    directionLabel: $('#flash-mode-label'),
    prevBtn: $('#flash-prev-btn'),
    nextBtn: $('#flash-next-btn'),
    flipBtn: $('#flash-flip-btn'),
    gradeGroup: $('#flash-grade-group'),
    live: $('#flashcard-live'),
  };
  fillCategorySelect();
  refresh();

  dom.wrapper.addEventListener('click', (ev) => {
    if (ev.target.closest('button, a')) {
      if (ev.target.closest('[data-study-all]')) {
        session.mode = 'all';
        dom.mode.value = 'all';
        refresh();
      }
      return;
    }
    flip();
  });
  dom.flipBtn.addEventListener('click', flip);
  dom.nextBtn.addEventListener('click', nextCard);
  dom.prevBtn.addEventListener('click', prevCard);
  dom.gradeGroup.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-grade]');
    if (btn) grade(btn.dataset.grade);
  });
  dom.category.addEventListener('change', () => {
    session.category = dom.category.value;
    refresh();
  });
  dom.mode.addEventListener('change', () => {
    session.mode = dom.mode.value;
    refresh();
  });
  dom.direction.addEventListener('click', () => {
    session.reverse = !session.reverse;
    dom.directionLabel.textContent = session.reverse ? 'Meaning → Term' : 'Term → Meaning';
    dom.direction.setAttribute('aria-pressed', String(session.reverse));
    render();
  });

  // Swipe left/right on touch screens.
  let startX = 0;
  dom.wrapper.addEventListener('touchstart', (ev) => (startX = ev.changedTouches[0].screenX), { passive: true });
  dom.wrapper.addEventListener(
    'touchend',
    (ev) => {
      const dx = ev.changedTouches[0].screenX - startX;
      if (dx < -50) nextCard();
      else if (dx > 50) prevCard();
    },
    { passive: true },
  );

  on('data-restored', refresh);
}
