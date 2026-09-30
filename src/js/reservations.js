// Top 20 reservations accordion.
import { app } from './state.js';
import { matchesText } from './search.js';
import { debounce, escapeHtml as e, icon } from './util.js';
import { verseBox } from './templates.js';
import { $, $$, scrollToElement } from './ui.js';
import { updateButtons } from './audio.js';

let dom = {};

function reservationHtml(res) {
  return `<article class="reservation-card" id="res-${res.id}" data-id="${res.id}">
    <h3 class="reservation-heading">
      <button type="button" class="reservation-header" id="res-head-${res.id}" aria-expanded="false" aria-controls="res-body-${res.id}">
        <span class="reservation-title-group">
          <span class="reservation-num" aria-hidden="true">${res.id}</span>
          <span>
            <span class="reservation-cat">${e(res.category)}</span>
            <span class="reservation-question">${e(res.title)}</span>
          </span>
        </span>
        <span class="reservation-toggle-icon">${icon('chevron-down')}</span>
      </button>
    </h3>
    <div class="reservation-body" id="res-body-${res.id}" role="region" aria-labelledby="res-head-${res.id}" hidden>
      <div class="reservation-objection-box">
        <strong>The common reservation:</strong>
        <p>“${e(res.reservation)}”</p>
      </div>
      <div class="reservation-counter-text">${e(res.counterArgument)}</div>
      ${verseBox(`res:${res.id}`, res.verse, { refPrefix: 'Quranic evidence: ', label: 'Recite Ayah' })}
      <div class="reservation-takeaway-banner">
        ${icon('shield-halved', 'text-gold')}
        <p><strong>Key rational insight:</strong> ${e(res.keyTakeaway)}</p>
      </div>
      <p class="reservation-link"><a href="r/${res.id}/">Permanent link to this answer</a></p>
    </div>
  </article>`;
}

function setOpen(card, open) {
  card.classList.toggle('open', open);
  const btn = $('.reservation-header', card);
  btn.setAttribute('aria-expanded', String(open));
  $('.reservation-body', card).hidden = !open;
}

function syncToggleAll() {
  const visible = $$('.reservation-card:not([hidden])', dom.container);
  const allOpen = visible.length > 0 && visible.every((c) => c.classList.contains('open'));
  dom.toggleText.textContent = allOpen ? 'Collapse All' : 'Expand All';
  dom.toggleAll.setAttribute('aria-pressed', String(allOpen));
}

function applySearch() {
  const q = dom.search.value;
  let shown = 0;
  $$('.reservation-card', dom.container).forEach((card) => {
    const res = app.data.reservations.find((r) => r.id === Number(card.dataset.id));
    const match = matchesText([res.title, res.reservation, res.counterArgument, res.category, res.keyTakeaway], q);
    card.hidden = !match;
    if (match) shown++;
  });
  dom.empty.hidden = shown !== 0;
  dom.count.textContent = q.trim() ? `${shown} of ${app.data.reservations.length} reservations match` : '';
  syncToggleAll();
}

export function openReservation(id) {
  const card = $(`#res-${id}`);
  if (!card) return false;
  card.hidden = false;
  setOpen(card, true);
  syncToggleAll();
  requestAnimationFrame(() => scrollToElement(card));
  return true;
}

export function initReservations() {
  dom = {
    container: $('#reservations-container'),
    search: $('#reservation-search'),
    toggleAll: $('#btn-toggle-all-reservations'),
    toggleText: $('#toggle-all-res-text'),
    empty: $('#reservations-empty'),
    count: $('#reservations-count'),
  };
  dom.container.innerHTML = app.data.reservations.map(reservationHtml).join('');
  updateButtons(dom.container);

  dom.container.addEventListener('click', (ev) => {
    const header = ev.target.closest('.reservation-header');
    if (!header) return;
    const card = header.closest('.reservation-card');
    setOpen(card, !card.classList.contains('open'));
    syncToggleAll();
  });

  dom.toggleAll.addEventListener('click', () => {
    const visible = $$('.reservation-card:not([hidden])', dom.container);
    const openAll = !visible.every((c) => c.classList.contains('open'));
    visible.forEach((c) => setOpen(c, openAll));
    syncToggleAll();
  });

  dom.search.addEventListener('input', debounce(applySearch, 120));
}
