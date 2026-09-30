// Reflective inquiries with a private, locally stored journal; plus backup/restore.
import { STORAGE_KEYS, VERSION } from './config.js';
import { app, emit, saveBookmarks, saveJournal, saveSrs } from './state.js';
import { createBackup, downloadFile, sanitizeBackup, MAX_BACKUP_BYTES } from './backup.js';
import { debounce, escapeHtml as e, wordCount } from './util.js';
import { verseBox } from './templates.js';
import { $, $$, toast } from './ui.js';
import { loadString } from './storage.js';
import { updateButtons } from './audio.js';
import { migrateMastered } from './srs.js';

let dom = {};
const savers = new Map();

function questionHtml(q, index) {
  return `<article class="question-card" data-qid="${e(q.id)}">
    <div>
      <p class="question-kicker">Inquiry #${index + 1} • ${e(q.category)}</p>
      <h3 class="question-title" id="q-title-${e(q.id)}">${e(q.title)}</h3>
      <p class="question-text">“${e(q.question)}”</p>
      <p class="question-context">${e(q.context)}</p>
      <p class="question-prompts-label">Guided self-introspection:</p>
      <ul class="question-prompts-list">${q.reflectionPrompts.map((p) => `<li>${e(p)}</li>`).join('')}</ul>
      ${verseBox(`q:${q.id}`, q.verse, { english: false, arabicClass: 'card-verse-arabic q-verse-arabic' })}
    </div>
    <div>
      <label class="sr-only" for="journal-${e(q.id)}">Your reflection on: ${e(q.title)}</label>
      <textarea class="journal-textarea" id="journal-${e(q.id)}" data-qid="${e(q.id)}" placeholder="Write your private reflections here (saved automatically on this device)…" maxlength="50000"></textarea>
      <div class="journal-footer-row">
        <span class="journal-save-status" data-status="${e(q.id)}" role="status" aria-live="polite"></span>
        <span class="journal-counter-text" data-counter="${e(q.id)}"></span>
      </div>
    </div>
  </article>`;
}

function updateCounter(qid) {
  const text = app.journal[qid] || '';
  const counter = $(`[data-counter="${qid}"]`, dom.container);
  if (counter) counter.textContent = `${wordCount(text)} words • ${text.length} chars`;
}

function fillTextareas() {
  // Values are assigned as properties, never as markup, so restored notes can't inject HTML.
  $$('.journal-textarea', dom.container).forEach((ta) => {
    ta.value = app.journal[ta.dataset.qid] || '';
    updateCounter(ta.dataset.qid);
  });
}

function saveNote(qid, text) {
  if (text) app.journal[qid] = text;
  else delete app.journal[qid];
  saveJournal();
  const status = $(`[data-status="${qid}"]`, dom.container);
  if (status) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    status.textContent = `Saved ${time}`;
  }
}

function saverFor(qid) {
  if (!savers.has(qid))
    savers.set(
      qid,
      debounce((text) => saveNote(qid, text), 500),
    );
  return savers.get(qid);
}

function exportJournal() {
  const lines = [`# My Reflection Journal · 100Top Islam & Quran`, '', `Exported ${new Date().toLocaleString()}`, ''];
  app.data.questions.forEach((q, i) => {
    lines.push(`## ${i + 1}. ${q.title}`, '', `**Question:** ${q.question}`, '', '**My reflections:**', '');
    lines.push(app.journal[q.id] || '_No notes written yet._', '', '---', '');
  });
  downloadFile(`reflection-journal-${new Date().toISOString().slice(0, 10)}.md`, lines.join('\n'), 'text/markdown');
  toast('Journal exported');
}

function backup() {
  const data = createBackup({
    version: VERSION,
    bookmarks: app.bookmarks,
    journalNotes: app.journal,
    srs: app.srs,
    theme: loadString(STORAGE_KEYS.theme, 'emerald'),
    reciter: loadString(STORAGE_KEYS.reciter, ''),
  });
  downloadFile(`100top-islam-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('Backup downloaded');
}

async function restore(file) {
  if (file.size > MAX_BACKUP_BYTES) {
    toast('That file is too large to be a 100Top backup.', { type: 'error' });
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const clean = sanitizeBackup(parsed, {
      itemIds: new Set(app.itemsById.keys()),
      questionIds: new Set(app.data.questions.map((q) => q.id)),
    });
    const srs = { ...migrateMastered(clean.masteredLegacy), ...clean.srs };
    const summary = `${clean.bookmarks.length} bookmarks, ${Object.keys(clean.journalNotes).length} notes, ${Object.keys(srs).length} flashcard records`;
    if (!window.confirm(`Restore ${summary}? This replaces your current bookmarks, journal and flashcard progress.`)) return;

    app.bookmarks = new Set(clean.bookmarks);
    app.journal = clean.journalNotes;
    app.srs = srs;
    saveBookmarks();
    saveJournal();
    saveSrs();
    fillTextareas();
    emit('data-restored');
    toast(`Restored ${summary}${clean.dropped ? ` (${clean.dropped} invalid entries skipped)` : ''}`);
  } catch (err) {
    toast(`Could not restore: ${err instanceof SyntaxError ? 'the file is not valid JSON.' : err.message}`, {
      type: 'error',
      duration: 5000,
    });
  }
}

export function initJournal() {
  dom = {
    container: $('#questions-container'),
    exportBtn: $('#export-journal-btn'),
    backupBtn: $('#btn-backup-data'),
    restoreBtn: $('#btn-restore-data-trigger'),
    restoreInput: $('#restore-file-input'),
  };
  dom.container.innerHTML = app.data.questions.map(questionHtml).join('');
  fillTextareas();
  updateButtons(dom.container);

  dom.container.addEventListener('input', (ev) => {
    const ta = ev.target.closest('.journal-textarea');
    if (!ta) return;
    const qid = ta.dataset.qid;
    app.journal[qid] = ta.value; // keep in memory immediately; persist debounced
    updateCounter(qid);
    saverFor(qid)(ta.value);
  });
  dom.container.addEventListener(
    'blur',
    (ev) => {
      const ta = ev.target.closest?.('.journal-textarea');
      if (ta) saverFor(ta.dataset.qid).flush(ta.value);
    },
    true,
  );
  // In-memory notes are always current; make sure pending debounced writes reach storage.
  window.addEventListener('pagehide', saveJournal);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveJournal();
  });

  dom.exportBtn.addEventListener('click', exportJournal);
  dom.backupBtn.addEventListener('click', backup);
  dom.restoreBtn.addEventListener('click', () => dom.restoreInput.click());
  dom.restoreInput.addEventListener('change', () => {
    const file = dom.restoreInput.files?.[0];
    if (file) restore(file);
    dom.restoreInput.value = '';
  });
}
