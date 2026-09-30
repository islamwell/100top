// Shared app state and a tiny event bus for cross-module updates.
import { STORAGE_KEYS } from './config.js';
import { loadJSON, saveJSON, removeKey } from './storage.js';
import { migrateMastered, isValidCardState } from './srs.js';

const isIntArray = (v) => Array.isArray(v) && v.every(Number.isInteger);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const app = {
  data: null,
  itemsById: new Map(),
  categoryById: new Map(),
  bookmarks: new Set(),
  journal: {},
  srs: {},
  activeTab: 'concepts',
};

const bus = new EventTarget();

export function on(type, handler) {
  bus.addEventListener(type, (e) => handler(e.detail));
}

export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

export function setData(data) {
  app.data = data;
  app.itemsById = new Map(data.items.map((item) => [item.id, item]));
  app.categoryById = new Map(data.categories.map((cat) => [cat.id, cat]));
}

/** Load persisted user data, keeping only entries that refer to real items. */
export function loadUserState() {
  const ids = app.itemsById;
  const questionIds = new Set(app.data.questions.map((q) => q.id));

  app.bookmarks = new Set(loadJSON(STORAGE_KEYS.bookmarks, [], isIntArray).filter((id) => ids.has(id)));

  const journal = loadJSON(STORAGE_KEYS.journal, {}, isPlainObject);
  app.journal = Object.fromEntries(Object.entries(journal).filter(([qid, note]) => questionIds.has(qid) && typeof note === 'string'));

  const srs = loadJSON(STORAGE_KEYS.srs, null, isPlainObject);
  if (srs) {
    app.srs = Object.fromEntries(Object.entries(srs).filter(([id, card]) => ids.has(Number(id)) && isValidCardState(card)));
  } else {
    // One-time migration from the v1.0.x "mastered" list.
    const legacy = loadJSON(STORAGE_KEYS.legacyMastered, [], isIntArray).filter((id) => ids.has(id));
    app.srs = migrateMastered(legacy);
    if (legacy.length) {
      saveJSON(STORAGE_KEYS.srs, app.srs);
      removeKey(STORAGE_KEYS.legacyMastered);
    }
  }
}

export function saveBookmarks() {
  saveJSON(STORAGE_KEYS.bookmarks, [...app.bookmarks]);
}

export function saveJournal() {
  saveJSON(STORAGE_KEYS.journal, app.journal);
}

export function saveSrs() {
  saveJSON(STORAGE_KEYS.srs, app.srs);
}

export function toggleBookmark(id) {
  if (app.bookmarks.has(id)) app.bookmarks.delete(id);
  else app.bookmarks.add(id);
  saveBookmarks();
  emit('bookmarks-changed', { id, bookmarked: app.bookmarks.has(id) });
  return app.bookmarks.has(id);
}
