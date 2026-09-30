// Wisdom quotes carousel.
import { app } from './state.js';
import { escapeHtml as e } from './util.js';
import { $ } from './ui.js';

let index = 0;
let box;

function render() {
  const q = app.data.quotes[index];
  if (!q) return;
  box.innerHTML = `
    <p class="quote-theme">${e(q.theme)}</p>
    <blockquote class="quote-body">“${e(q.quote)}”</blockquote>
    <p class="quote-source">${e(q.source)}</p>
    <p class="sr-only">Quote ${index + 1} of ${app.data.quotes.length}</p>`;
}

export function nextQuote() {
  index = (index + 1) % app.data.quotes.length;
  render();
}

export function prevQuote() {
  index = (index - 1 + app.data.quotes.length) % app.data.quotes.length;
  render();
}

export function initQuotes() {
  box = $('#quote-carousel-box');
  render();
  $('#quote-next-btn').addEventListener('click', nextQuote);
  $('#quote-prev-btn').addEventListener('click', prevQuote);

  let startX = 0;
  box.addEventListener('touchstart', (ev) => (startX = ev.changedTouches[0].screenX), { passive: true });
  box.addEventListener(
    'touchend',
    (ev) => {
      const dx = ev.changedTouches[0].screenX - startX;
      if (dx < -40) nextQuote();
      else if (dx > 40) prevQuote();
    },
    { passive: true },
  );
}
