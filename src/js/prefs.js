// Theme and Arabic text size preferences.
import { ARABIC_SCALES, STORAGE_KEYS, THEMES } from './config.js';
import { loadString, saveString } from './storage.js';
import { icon } from './util.js';
import { $, $$, toast } from './ui.js';

const THEME_ICONS = { gem: icon('gem'), moon: icon('moon'), sun: icon('sun') };
const THEME_COLORS = { emerald: '#050f0d', midnight: '#010504', light: '#faf7f0' };

let theme = loadString(
  STORAGE_KEYS.theme,
  'emerald',
  THEMES.map((t) => t.id),
);
let scale = loadString(
  STORAGE_KEYS.arabicScale,
  'md',
  ARABIC_SCALES.map((s) => s.id),
);

export function applyTheme(id) {
  theme = id;
  document.documentElement.dataset.theme = id;
  saveString(STORAGE_KEYS.theme, id);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[id];
  const btn = $('#theme-toggle-btn');
  const t = THEMES.find((x) => x.id === id);
  const nextT = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
  if (btn) {
    btn.innerHTML = THEME_ICONS[t.icon];
    btn.setAttribute('aria-label', `Theme: ${t.label}. Switch to ${nextT.label}`);
    btn.title = `Theme: ${t.label} (T)`;
  }
}

export function cycleTheme() {
  const i = THEMES.findIndex((t) => t.id === theme);
  const nextTheme = THEMES[(i + 1) % THEMES.length];
  applyTheme(nextTheme.id);
  toast(`${nextTheme.label} theme`);
}

const SCALE_LABELS = {
  sm: 'Text: Small',
  md: 'Text: Normal',
  lg: 'Text: Large',
  xl: 'Text: XL',
};
const SCALE_ORDER = ['md', 'lg', 'xl', 'sm'];

export function cycleArabicScale() {
  const i = SCALE_ORDER.indexOf(scale);
  const nextScale = SCALE_ORDER[(i + 1) % SCALE_ORDER.length];
  applyArabicScale(nextScale);
  const label = SCALE_LABELS[nextScale].replace('Text: ', '');
  toast(`Arabic text: ${label}`);
}

export function applyArabicScale(id) {
  scale = id;
  document.documentElement.dataset.arabicScale = id;
  saveString(STORAGE_KEYS.arabicScale, id);
  const labelEl = $('#arabic-scale-label');
  if (labelEl) labelEl.textContent = SCALE_LABELS[id] || 'Text: Normal';
  const toggleBtn = $('#btn-arabic-scale-toggle');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', id !== 'md');
    toggleBtn.setAttribute('aria-pressed', String(id !== 'md'));
  }
  $$('[data-scale]').forEach((btn) => {
    const active = btn.dataset.scale === id;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

export function initPrefs() {
  applyTheme(theme);
  applyArabicScale(scale);
  $('#theme-toggle-btn')?.addEventListener('click', cycleTheme);
  $('#btn-arabic-scale-toggle')?.addEventListener('click', cycleArabicScale);
  $('#arabic-scale-group')?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-scale]');
    if (btn) applyArabicScale(btn.dataset.scale);
  });
}
