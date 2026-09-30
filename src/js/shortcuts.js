// Global keyboard shortcuts. Every shortcut listed in the help dialog is implemented here.
import { isDialogOpen } from './ui.js';

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function isActivatable(el) {
  return el && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button');
}

/**
 * @param {object} a actions: activeTab(), switchTab(tab), flip(), nextCard(), prevCard(), grade(g), isFlipped(),
 *   nextQuote(), prevQuote(), togglePlay(), hasTrack(), focusSearch(), clearSearch(), random(), cycleTheme(),
 *   toggleMute(), openHelp()
 */
export function initShortcuts(a) {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (isDialogOpen()) return; // dialogs handle their own keys (Escape, Tab)

    const target = e.target;
    if (isTyping(target)) {
      if (e.key === 'Escape' && target.id === 'search-input') {
        a.clearSearch();
        target.blur();
      }
      return;
    }

    const onFlashcards = a.activeTab() === 'flashcards';
    const key = e.key;

    if (key === ' ' || key === 'Spacebar') {
      if (isActivatable(target)) return; // let the focused button handle Space natively
      e.preventDefault();
      if (onFlashcards) a.flip();
      else a.togglePlay();
      return;
    }

    switch (key) {
      case 'ArrowRight':
        if (onFlashcards) a.nextCard();
        else a.nextQuote();
        break;
      case 'ArrowLeft':
        if (onFlashcards) a.prevCard();
        else a.prevQuote();
        break;
      case '/':
        e.preventDefault();
        a.focusSearch();
        break;
      case 'r':
      case 'R':
        a.random();
        break;
      case 't':
      case 'T':
        a.cycleTheme();
        break;
      case 'm':
      case 'M':
        a.toggleMute();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        a.switchTab(['concepts', 'reservations', 'questions', 'flashcards'][Number(key) - 1]);
        break;
      case '?':
        a.openHelp();
        break;
      case 'Escape':
        a.clearSearch();
        break;
      case 'a':
      case 'A':
      case 'g':
      case 'G':
      case 'e':
      case 'E':
        if (onFlashcards && a.isFlipped()) a.grade({ a: 'again', g: 'good', e: 'easy' }[key.toLowerCase()]);
        break;
      default:
        return;
    }
  });
}
