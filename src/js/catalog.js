// The 200-dimension catalog: cards are rendered once, then filtered by toggling `hidden`.
import { app, on, toggleBookmark } from './state.js';
import { buildSearchIndex, filterItems } from './search.js';
import { debounce, escapeHtml as e, icon, pad3 } from './util.js';
import { rootBox, verseBox } from './templates.js';
import { $, $$, toast, scrollToElement } from './ui.js';
import { updateButtons } from './audio.js';

const filters = { category: 'all', bookmarksOnly: false, query: '' };
let indexById = new Map();
let cardById = new Map();
let dom = {};
let openItem = () => {};

function cardHtml(item) {
  const cat = app.categoryById.get(item.category);
  return `<article class="concept-card" data-id="${item.id}" style="--domain-color: ${e(cat?.color || '#c9a227')}" aria-labelledby="card-title-${item.id}">
    <div class="card-header-top">
      <span class="card-id-badge">#${pad3(item.id)}</span>
      <span class="card-category-tag">${e(cat?.short || item.category)}</span>
    </div>
    <div class="card-arabic-heading font-arabic" lang="ar" dir="rtl">${e(item.arabic)}</div>
    <h3 class="card-english-title" id="card-title-${item.id}"><a class="card-title-link" href="#dim-${item.id}">${e(item.title)}</a></h3>
    ${rootBox(item.root)}
    <p class="card-summary">${e(item.summary)}</p>
    ${verseBox(`item:${item.id}`, item.verse)}
    <div class="card-footer">
      <a class="btn-card-details" href="#dim-${item.id}" aria-label="Deep reflection: ${e(item.title)}">
        <span>Deep Reflection</span>${icon('arrow-right')}
      </a>
      <div class="card-footer-actions">
        <button type="button" class="btn-card-icon" data-card="${item.id}" title="Share visual card" aria-label="Generate visual card for ${e(item.title)}">${icon('image')}</button>
        ${bookmarkButton(item)}
      </div>
    </div>
  </article>`;
}

export function bookmarkButton(item, className = '') {
  const active = app.bookmarks.has(item.id);
  return `<button type="button" class="btn-bookmark${active ? ' bookmarked' : ''}${className ? ' ' + className : ''}" data-bookmark="${item.id}" aria-pressed="${active}" aria-label="Bookmark ${e(item.title)}">${active ? icon('bookmark') : icon('bookmark-regular')}</button>`;
}

/** Update every bookmark button for an item (card + open modal). */
function syncBookmarkButtons(id) {
  const active = app.bookmarks.has(id);
  $$(`[data-bookmark="${id}"]`).forEach((btn) => {
    btn.classList.toggle('bookmarked', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.innerHTML = active ? icon('bookmark') : icon('bookmark-regular');
  });
}

function renderCategories() {
  const counts = new Map();
  app.data.items.forEach((item) => counts.set(item.category, (counts.get(item.category) || 0) + 1));
  const chip = (id, name, count) =>
    `<button type="button" class="category-chip${filters.category === id ? ' active' : ''}" data-cat="${e(id)}" aria-pressed="${filters.category === id}"><span>${e(name)}</span><span class="chip-count">${count}</span></button>`;
  dom.categories.innerHTML = [
    chip('all', `All ${app.data.items.length}`, app.data.items.length),
    ...app.data.categories.map((c) => chip(c.id, c.name, counts.get(c.id) || 0)),
  ].join('');
}

export function applyFilters() {
  const visible = filterItems(app.data.items, indexById, { ...filters, bookmarks: app.bookmarks });
  for (const [id, card] of cardById) card.hidden = !visible.has(id);

  const total = app.data.items.length;
  const n = visible.size;
  dom.count.textContent = filters.bookmarksOnly
    ? `${n} bookmarked ${n === 1 ? 'dimension' : 'dimensions'}`
    : `Showing ${n} of ${total} dimensions`;
  dom.cards.hidden = n === 0;
  dom.empty.hidden = n !== 0;
  $('#empty-state-title').textContent = filters.bookmarksOnly && !app.bookmarks.size ? 'No bookmarks yet' : 'No matching dimensions found';
}

export function setCategory(categoryId, { scroll = true } = {}) {
  filters.category = app.categoryById.has(categoryId) ? categoryId : 'all';
  filters.bookmarksOnly = false;
  syncBookmarkFilterButton();
  $$('.category-chip', dom.categories).forEach((c) => {
    const active = c.dataset.cat === filters.category;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', String(active));
  });
  applyFilters();
  if (scroll) scrollToElement($('.search-filter-section'));
}

export function resetFilters() {
  filters.query = '';
  dom.search.value = '';
  dom.searchClear.hidden = true;
  setCategory('all', { scroll: false });
}

function syncBookmarkFilterButton() {
  dom.bookmarksBtn.classList.toggle('active', filters.bookmarksOnly);
  dom.bookmarksBtn.setAttribute('aria-pressed', String(filters.bookmarksOnly));
}

function setView(mode) {
  const list = mode === 'list';
  dom.cards.classList.toggle('cards-list', list);
  dom.cards.classList.toggle('cards-grid', !list);
  dom.gridBtn.classList.toggle('active', !list);
  dom.listBtn.classList.toggle('active', list);
  dom.gridBtn.setAttribute('aria-pressed', String(!list));
  dom.listBtn.setAttribute('aria-pressed', String(list));
}

export function clearSearch() {
  if (!filters.query) return false;
  filters.query = '';
  dom.search.value = '';
  dom.searchClear.hidden = true;
  applyFilters();
  return true;
}

export function focusSearch() {
  dom.search.focus();
  dom.search.select();
}

export function highlightCard(id) {
  const card = cardById.get(id);
  if (!card) return;
  scrollToElement(card);
  card.classList.add('card-highlight-target');
  setTimeout(() => card.classList.remove('card-highlight-target'), 2000);
}

export function initCatalog({ onOpenItem }) {
  openItem = onOpenItem;
  dom = {
    cards: $('#cards-container'),
    empty: $('#empty-state'),
    count: $('#results-count'),
    categories: $('#categories-container'),
    search: $('#search-input'),
    searchClear: $('#search-clear-btn'),
    bookmarksBtn: $('#filter-bookmarks-btn'),
    gridBtn: $('#view-grid-btn'),
    listBtn: $('#view-list-btn'),
  };

  indexById = new Map(app.data.items.map((item) => [item.id, buildSearchIndex(item)]));
  dom.cards.innerHTML = app.data.items.map(cardHtml).join('');
  cardById = new Map($$('.concept-card', dom.cards).map((el) => [Number(el.dataset.id), el]));
  updateButtons(dom.cards);
  renderCategories();
  applyFilters();

  const runSearch = debounce(() => applyFilters(), 120);
  dom.search.addEventListener('input', () => {
    filters.query = dom.search.value;
    dom.searchClear.hidden = !filters.query;
    runSearch();
  });
  dom.search.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') runSearch.flush();
  });
  dom.searchClear.addEventListener('click', () => {
    clearSearch();
    dom.search.focus();
  });

  dom.categories.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.category-chip');
    if (chip) setCategory(chip.dataset.cat);
  });

  dom.bookmarksBtn.addEventListener('click', () => {
    filters.bookmarksOnly = !filters.bookmarksOnly;
    syncBookmarkFilterButton();
    applyFilters();
  });
  dom.gridBtn.addEventListener('click', () => setView('grid'));
  dom.listBtn.addEventListener('click', () => setView('list'));

  // Clicking anywhere on a card (outside its controls) opens the deep dive.
  dom.cards.addEventListener('click', (ev) => {
    if (ev.target.closest('a, button')) return;
    const card = ev.target.closest('.concept-card');
    if (card && !window.getSelection()?.toString()) openItem(Number(card.dataset.id));
  });

  // Bookmark buttons live in cards and in the modal.
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-bookmark]');
    if (!btn) return;
    const id = Number(btn.dataset.bookmark);
    const item = app.itemsById.get(id);
    const nowOn = toggleBookmark(id);
    toast(nowOn ? `Bookmarked “${item.title}”` : `Removed bookmark for “${item.title}”`);
  });

  on('bookmarks-changed', ({ id }) => {
    syncBookmarkButtons(id);
    if (filters.bookmarksOnly) applyFilters();
  });
  on('data-restored', () => {
    for (const id of app.itemsById.keys()) syncBookmarkButtons(id);
    applyFilters();
  });
}
