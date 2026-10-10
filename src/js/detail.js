// Deep-dive dialog for a single dimension.
import { app } from './state.js';
import { escapeHtml as e, icon, pad3, verseKey } from './util.js';
import { rootBox, verseBox } from './templates.js';
import { bookmarkButton } from './catalog.js';
import { updateButtons } from './audio.js';
import { $, closeDialog, copyText, openDialog, toast } from './ui.js';

let dom = {};
let currentId = null;
let onClosed = () => {};

export function itemPageUrl(id) {
  return new URL(`d/${id}/`, document.baseURI).href;
}

function detailHtml(item) {
  const cat = app.categoryById.get(item.category);
  const ids = app.data.items.map((i) => i.id);
  const pos = ids.indexOf(item.id);
  const prevId = ids[(pos - 1 + ids.length) % ids.length];
  const nextId = ids[(pos + 1) % ids.length];
  return `
    <div class="detail-top">
      <div class="detail-badges">
        <span class="card-id-badge">Dimension #${pad3(item.id)}</span>
        <span class="card-category-tag" style="--domain-color:${e(cat?.color || '')}">${e(item.category)}</span>
      </div>
      <div class="detail-actions">
        <button type="button" class="btn-icon" data-card="${item.id}" title="Generate Visual Share Card" aria-label="Generate visual share card">${icon('image')}</button>
        <button type="button" class="btn-icon" data-share="${item.id}" aria-label="Share this dimension">${icon('share-nodes')}</button>
        ${bookmarkButton(item, 'btn-bookmark-lg')}
      </div>
    </div>

    <p class="modal-arabic-title font-arabic" lang="ar" dir="rtl">${e(item.arabic)}</p>
    <h2 class="modal-title" id="modal-title">${e(item.title)}</h2>
    ${rootBox(item.root, 'card-root-box detail-root', { label: true })}

    <section class="detail-panel">
      <h3 class="detail-kicker">Core Conceptual Overview</h3>
      <p>${e(item.summary)}</p>
    </section>

    ${verseBox(`item:${item.id}`, item.verse, { label: 'Play Recitation', arabicClass: 'modal-verse-arabic' }).replace('card-verse-box', 'card-verse-box detail-verse')}

    <section class="detail-section">
      <h3 class="detail-heading">${icon('feather', 'text-gold')} Deep Dive &amp; Significance</h3>
      <p class="detail-body">${e(item.deepDive)}</p>
    </section>

    <section class="detail-gem">
      <h3 class="detail-kicker">Linguistic &amp; Thematic Gem</h3>
      <p class="detail-gem-text">“${e(item.quote)}”</p>
      <div class="detail-gem-actions">
        <button type="button" class="btn-copy-quote" data-copy-quote="${item.id}">${icon('copy')} Copy</button>
        <button type="button" class="btn-copy-quote btn-card-gem" data-card="${item.id}">${icon('image')} Visual Card</button>
      </div>
    </section>

    <section class="detail-practice">
      <h3 class="detail-kicker">Daily Practical Application</h3>
      <p>${e(item.practicalTakeaway)}</p>
    </section>

    <ul class="detail-tags" aria-label="Tags">
      ${item.tags.map((tag) => `<li>#${e(tag)}</li>`).join('')}
    </ul>

    <nav class="detail-nav" aria-label="Browse dimensions">
      <a class="btn-filter-toggle" href="#dim-${prevId}">${icon('arrow-left')} Previous</a>
      <a class="btn-filter-toggle" href="#dim-${nextId}">Next ${icon('arrow-right')}</a>
    </nav>`;
}

async function share(item) {
  const url = itemPageUrl(item.id);
  const text = `${item.title} (${item.arabic})\n\n“${item.verse.textEnglish}” (Quran ${verseKey(item.verse)})\n\n${item.summary}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `${item.title} · 100Top Islam`, text, url });
    } catch {
      /* user cancelled */
    }
    return;
  }
  const ok = await copyText(`${text}\n\n${url}`);
  toast(ok ? 'Link and summary copied to clipboard' : 'Could not copy to clipboard', { type: ok ? 'info' : 'error' });
}

export function openItemDialog(id) {
  const item = app.itemsById.get(id);
  if (!item) return false;
  const wasOpen = currentId !== null;
  currentId = id;
  dom.content.innerHTML = detailHtml(item);
  updateButtons(dom.content);
  dom.card.scrollTop = 0;
  if (!wasOpen) {
    openDialog(dom.overlay, {
      onClose: () => {
        currentId = null;
        onClosed();
      },
    });
  } else {
    dom.card.focus();
  }
  document.title = `${item.title} · 100Top Islam & Quran`;
  return true;
}

export function closeItemDialog(options) {
  if (currentId !== null) closeDialog(dom.overlay, options);
}

export function openItemId() {
  return currentId;
}

export function initDetail({ onClose }) {
  onClosed = onClose;
  dom = {
    overlay: $('#modal-overlay'),
    card: $('#modal-overlay [role="dialog"]'),
    content: $('#modal-content'),
    closeBtn: $('#modal-close-btn'),
  };
  dom.closeBtn.addEventListener('click', () => closeItemDialog());
  dom.content.addEventListener('click', async (ev) => {
    // Prev/next inside the dialog replace the history entry so closing returns to the catalog.
    const navLink = ev.target.closest('a[href^="#dim-"]');
    if (navLink) {
      ev.preventDefault();
      const id = Number(navLink.getAttribute('href').slice(5));
      history.replaceState(history.state, '', `#dim-${id}`);
      openItemDialog(id);
      return;
    }
    const shareBtn = ev.target.closest('[data-share]');
    if (shareBtn) {
      share(app.itemsById.get(Number(shareBtn.dataset.share)));
      return;
    }
    const copyBtn = ev.target.closest('[data-copy-quote]');
    if (copyBtn) {
      const item = app.itemsById.get(Number(copyBtn.dataset.copyQuote));
      const ok = await copyText(`“${item.quote}” (${item.title}, 100Top Islam & Quran)`);
      toast(ok ? 'Wisdom gem copied to clipboard' : 'Could not copy to clipboard', { type: ok ? 'info' : 'error' });
    }
  });
}
