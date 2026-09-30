// Toasts, accessible dialogs and small DOM helpers.
import { icon, prefersReducedMotion } from './util.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ─── Toasts ────────────────────────────────────────────────────────────────
export function toast(message, { type = 'info', duration = 3000, action } = {}) {
  const container = $('#toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = type === 'error' ? icon('circle-exclamation') : icon('circle-check');
  const text = document.createElement('span');
  text.textContent = message; // never innerHTML: messages may include user/restore data
  el.append(text);
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      el.remove();
    });
    el.append(btn);
  }
  container.append(el);
  if (duration > 0) {
    setTimeout(() => {
      el.classList.add('toast-leaving');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }
}

// ─── Dialogs ───────────────────────────────────────────────────────────────
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const stack = [];

export function isDialogOpen() {
  return stack.length > 0;
}

/**
 * Open a modal overlay: traps focus, closes on Escape/backdrop click, restores focus on close.
 * @param {HTMLElement} overlay element with class "modal-overlay" wrapping a [role=dialog]
 */
export function openDialog(overlay, { onClose, initialFocus } = {}) {
  if (stack.some((entry) => entry.overlay === overlay)) return;
  const entry = { overlay, onClose, returnFocus: document.activeElement };

  entry.onKeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeDialog(overlay);
    } else if (e.key === 'Tab') {
      const nodes = $$(FOCUSABLE, overlay).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  entry.onBackdrop = (e) => {
    if (e.target === overlay) closeDialog(overlay);
  };

  overlay.addEventListener('keydown', entry.onKeydown);
  overlay.addEventListener('click', entry.onBackdrop);
  overlay.classList.add('active');
  overlay.removeAttribute('hidden');
  document.body.classList.add('no-scroll');
  stack.push(entry);

  const target = (initialFocus && $(initialFocus, overlay)) || $('[role="dialog"]', overlay);
  requestAnimationFrame(() => target && target.focus());
}

export function closeDialog(overlay, { restoreFocus = true } = {}) {
  const index = stack.findIndex((entry) => entry.overlay === overlay);
  if (index === -1) return;
  const [entry] = stack.splice(index, 1);
  overlay.removeEventListener('keydown', entry.onKeydown);
  overlay.removeEventListener('click', entry.onBackdrop);
  overlay.classList.remove('active');
  overlay.setAttribute('hidden', '');
  if (!stack.length) document.body.classList.remove('no-scroll');
  if (restoreFocus && entry.returnFocus && document.contains(entry.returnFocus)) entry.returnFocus.focus();
  if (entry.onClose) entry.onClose();
}

export function closeTopDialog() {
  const top = stack[stack.length - 1];
  if (top) closeDialog(top.overlay);
}

// ─── Clipboard ─────────────────────────────────────────────────────────────
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    let ok;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function scrollToElement(el) {
  if (!el) return;
  // Account for every sticky header currently pinned at the top.
  let offset = 15;
  for (const bar of $$('.navbar, .search-filter-section')) {
    if (el === bar || bar.hidden || getComputedStyle(bar).position !== 'sticky') continue;
    offset += bar.offsetHeight;
  }
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior() });
}

export function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}
