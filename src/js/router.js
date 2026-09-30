// Hash routing:  #concepts | #reservations | #questions | #flashcards  (tabs)
//                #dim-42 (open a dimension)  |  #res-3 (open a reservation)
import { TABS } from './config.js';

export function parseHash(hash = location.hash) {
  const h = decodeURIComponent(hash.replace(/^#/, ''));
  if (!h) return { type: 'none' };
  const dim = h.match(/^dim-(\d{1,4})$/);
  if (dim) return { type: 'item', id: Number(dim[1]) };
  const res = h.match(/^res-(\d{1,3})$/);
  if (res) return { type: 'reservation', id: Number(res[1]) };
  const tab = h.replace(/^tab-/, '');
  if (TABS.includes(tab)) return { type: 'tab', tab };
  if (h === 'journal') return { type: 'tab', tab: 'questions' };
  return { type: 'none' };
}

/** Replace the hash without adding a history entry or triggering hashchange. */
export function replaceHash(hash) {
  const url = `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`;
  history.replaceState(history.state, '', url);
}

export function initRouter(handlers) {
  const route = (initial) => {
    const r = parseHash();
    handlers.onRoute(r, { initial });
  };
  window.addEventListener('hashchange', () => route(false));
  route(true);
}
