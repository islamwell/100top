// Application entry point.
import { BUILD_ID, DATA_URL, TABS } from './config.js';
import { app, setData, loadUserState } from './state.js';
import { $, $$, closeDialog, openDialog, scrollToElement, scrollBehavior, toast } from './ui.js';
import { initPrefs, cycleTheme } from './prefs.js';
import { initAudio, togglePlayPause, toggleMute } from './audio.js';
import { initCatalog, setCategory, resetFilters, clearSearch, focusSearch, highlightCard } from './catalog.js';
import { initDetail, openItemDialog, closeItemDialog, openItemId } from './detail.js';
import { initReservations, openReservation } from './reservations.js';
import { initJournal } from './journal.js';
import * as flashcards from './flashcards.js';
import { initQuotes, nextQuote, prevQuote } from './quotes.js';
import { initBackground } from './background.js';
import { initRouter, parseHash, replaceHash } from './router.js';
import { initShortcuts } from './shortcuts.js';
import { initVisualCard } from './visual-card.js';
import { prefersReducedMotion, verseAyahs } from './util.js';

const APP_TITLE = document.title;
let ignoreNextRoute = false;
let itemOpenedByNavigation = false;

// ─── Tabs ──────────────────────────────────────────────────────────────────
function switchTab(tab, { scroll = true, updateHash = true } = {}) {
  if (!TABS.includes(tab)) return;
  app.activeTab = tab;
  $$('[role="tab"]').forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  $$('.tab-pane').forEach((pane) => {
    const active = pane.id === `tab-${tab}`;
    pane.classList.toggle('active', active);
    pane.hidden = !active;
  });
  if (tab === 'flashcards') flashcards.refresh();
  if (updateHash && !openItemId()) replaceHash(tab === 'concepts' ? '' : tab);
  if (scroll) {
    requestAnimationFrame(() => scrollToElement(tab === 'concepts' ? $('.search-filter-section') : $(`#tab-${tab}`)));
  }
}

function initTabs() {
  const tabs = $$('[role="tab"]');
  tabs.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  $('[role="tablist"]').addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    e.stopPropagation();
    next.focus();
    switchTab(next.dataset.tab, { scroll: false });
  });
}

// ─── Routing ───────────────────────────────────────────────────────────────
function openItem(id) {
  location.hash = `dim-${id}`;
}

function onRoute(route, { initial }) {
  if (ignoreNextRoute) {
    ignoreNextRoute = false;
    return;
  }
  if (route.type !== 'item' && openItemId() !== null) {
    closeItemDialog({ restoreFocus: true });
  }
  if (route.type === 'item') {
    if (app.activeTab !== 'concepts') switchTab('concepts', { scroll: false, updateHash: false });
    if (openItemDialog(route.id)) itemOpenedByNavigation = itemOpenedByNavigation || !initial;
    else replaceHash('');
  } else if (route.type === 'reservation') {
    switchTab('reservations', { scroll: false, updateHash: false });
    openReservation(route.id);
  } else if (route.type === 'tab') {
    switchTab(route.tab, { scroll: true, updateHash: false });
  }
}

function onItemDialogClosed() {
  document.title = APP_TITLE;
  const route = parseHash();
  if (route.type === 'item') {
    if (itemOpenedByNavigation) {
      ignoreNextRoute = true;
      history.back();
    } else {
      replaceHash(app.activeTab === 'concepts' ? '' : app.activeTab);
    }
  }
  itemOpenedByNavigation = false;
}

// ─── Misc UI ───────────────────────────────────────────────────────────────
function randomDimension() {
  const items = app.data.items;
  const item = items[Math.floor(Math.random() * items.length)];
  resetFilters();
  switchTab('concepts', { scroll: false });
  highlightCard(item.id);
  setTimeout(() => openItem(item.id), prefersReducedMotion() ? 0 : 700);
}

function initHero() {
  const d = app.data;
  const verses = new Set(
    [...d.items, ...d.reservations, ...d.questions].flatMap((x) => verseAyahs(x.verse).map((a) => `${x.verse.surah}:${a}`)),
  );
  const stats = {
    items: d.items.length,
    categories: d.categories.length,
    reservations: d.reservations.length,
    verses: verses.size,
  };
  $$('[data-stat]').forEach((el) => {
    const target = stats[el.dataset.stat];
    if (prefersReducedMotion()) {
      el.textContent = target.toLocaleString();
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1200, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  $$('[data-count]').forEach((el) => {
    el.textContent = String(stats[el.dataset.count]);
  });
  if (d.translation) $$('[data-translation]').forEach((el) => (el.textContent = d.translation));

  $$('.stat-chip[data-target-tab]').forEach((chip) =>
    chip.addEventListener('click', () => {
      if (chip.dataset.targetTab === 'audio') togglePlayPause();
      else switchTab(chip.dataset.targetTab);
    }),
  );
  $('#hero-cta').addEventListener('click', () => switchTab('concepts'));
  $('.brand-logo').addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('concepts', { scroll: false });
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  });
}

function initExhibits() {
  const btn = $('#exhibits-dropdown-btn');
  const menu = $('#exhibits-dropdown-menu');
  const items = () => $$('[role="menuitem"]', menu);
  const setOpen = (open, { focusFirst = false } = {}) => {
    menu.classList.toggle('open', open);
    menu.hidden = !open;
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open && focusFirst) items()[0]?.focus();
  };
  setOpen(false);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(menu.hidden, { focusFirst: e.detail === 0 });
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true, { focusFirst: true });
    }
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target)) setOpen(false);
  });
  menu.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      btn.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length].focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  });
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[role="menuitem"]');
    if (!item) return;
    setOpen(false);
    if (item.dataset.tab) switchTab(item.dataset.tab);
    else {
      switchTab('concepts', { scroll: false });
      setCategory(item.dataset.category);
    }
  });
}

function initHelpDialog() {
  const overlay = $('#shortcuts-modal');
  const open = () => openDialog(overlay);
  $('#keyboard-shortcuts-btn').addEventListener('click', open);
  $$('[data-close-shortcuts]').forEach((b) => b.addEventListener('click', () => closeDialog(overlay)));
  return open;
}

function initScrollUi() {
  const backToTop = $('#back-to-top-btn');
  const navbar = $('.navbar');
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        backToTop.classList.toggle('visible', y > 400);
        backToTop.tabIndex = y > 400 ? 0 : -1;
        navbar.classList.toggle('scrolled', y > 10);
        ticking = false;
      });
    },
    { passive: true },
  );
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    $('.brand-logo').focus({ preventScroll: true });
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (location.protocol !== 'https:' && !local) return;
  if (BUILD_ID.startsWith('__')) return; // unbuilt source tree
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker registration failed', err));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // first install, nothing to refresh
    toast('A new version is available.', {
      duration: 0,
      action: { label: 'Refresh', onClick: () => location.reload() },
    });
  });
}

// ─── Boot ──────────────────────────────────────────────────────────────────
async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  initBackground($('#canvas-bg'));
  initPrefs();

  let data;
  try {
    data = await loadData();
  } catch (err) {
    console.error(err);
    const status = $('#app-status');
    status.hidden = false;
    status.textContent = 'The content could not be loaded. Please check your connection and reload the page.';
    return;
  }
  setData(data);
  loadUserState();

  initAudio();
  initCatalog({ onOpenItem: openItem });
  initDetail({ onClose: onItemDialogClosed });
  initVisualCard();
  initReservations();
  initJournal();
  flashcards.initFlashcards();
  initQuotes();
  initTabs();
  initHero();
  initExhibits();
  const openHelp = initHelpDialog();
  initScrollUi();
  document.documentElement.classList.add('app-ready');
  $('#app-status').hidden = true;

  initShortcuts({
    activeTab: () => app.activeTab,
    switchTab: (t) => switchTab(t),
    flip: flashcards.flip,
    nextCard: flashcards.nextCard,
    prevCard: flashcards.prevCard,
    grade: flashcards.grade,
    isFlipped: flashcards.isFlipped,
    nextQuote,
    prevQuote,
    togglePlay: togglePlayPause,
    focusSearch: () => {
      switchTab('concepts', { scroll: false });
      focusSearch();
    },
    clearSearch,
    random: randomDimension,
    cycleTheme,
    toggleMute,
    openHelp,
  });
  $('#btn-random-dimension').addEventListener('click', randomDimension);

  switchTab('concepts', { scroll: false, updateHash: false });
  initRouter({ onRoute });
  registerServiceWorker();
}

main();
