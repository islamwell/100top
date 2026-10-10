// Aesthetic 1080×1080 Visual Share Card Generator for Dimensions.
import { app } from './state.js';
import { pad3, slugify, verseKey } from './util.js';
import { $, $$, closeDialog, copyText, openDialog, toast } from './ui.js';

export const CARD_THEMES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Gold',
    bgRadial: ['#0d2e26', '#071c17', '#030d0b'],
    glowColor: 'rgba(47, 211, 160, 0.14)',
    outerBorder: 'rgba(212, 175, 55, 0.42)',
    innerBorder: 'rgba(212, 175, 55, 0.75)',
    cornerColor: '#f5c542',
    watermarkColor: 'rgba(47, 211, 160, 0.035)',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(47, 211, 160, 0.45)',
    badgeText: '#34d399',
    arabicTitle: '#fde68a',
    englishTitle: '#ffffff',
    starColor: '#f5c542',
    rootBg: 'rgba(255, 255, 255, 0.04)',
    rootBorder: 'rgba(212, 175, 55, 0.25)',
    rootLetters: '#f5c542',
    rootMeaning: '#b8c8cc',
    quoteBoxBg: 'rgba(10, 35, 30, 0.72)',
    quoteBoxBorder: 'rgba(47, 211, 160, 0.28)',
    quoteKicker: '#f5c542',
    quoteText: '#f1f5f9',
    verseBoxBg: 'rgba(6, 22, 19, 0.84)',
    verseBoxBorder: 'rgba(212, 175, 55, 0.35)',
    verseRef: '#6ee7b7',
    verseArabic: '#fef08a',
    verseEnglish: '#cbd5e1',
    footerRule: 'rgba(212, 175, 55, 0.35)',
    brandTitle: '#f5c542',
    brandSub: '#94a3b8',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Sapphire',
    bgRadial: ['#0f2a52', '#07162d', '#020914'],
    glowColor: 'rgba(56, 189, 248, 0.16)',
    outerBorder: 'rgba(56, 189, 248, 0.42)',
    innerBorder: 'rgba(245, 197, 66, 0.72)',
    cornerColor: '#38bdf8',
    watermarkColor: 'rgba(56, 189, 248, 0.035)',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeBorder: 'rgba(56, 189, 248, 0.45)',
    badgeText: '#7dd3fc',
    arabicTitle: '#fde68a',
    englishTitle: '#ffffff',
    starColor: '#38bdf8',
    rootBg: 'rgba(255, 255, 255, 0.04)',
    rootBorder: 'rgba(56, 189, 248, 0.25)',
    rootLetters: '#38bdf8',
    rootMeaning: '#b8c8cc',
    quoteBoxBg: 'rgba(11, 29, 56, 0.74)',
    quoteBoxBorder: 'rgba(56, 189, 248, 0.3)',
    quoteKicker: '#38bdf8',
    quoteText: '#f1f5f9',
    verseBoxBg: 'rgba(5, 17, 36, 0.86)',
    verseBoxBorder: 'rgba(245, 197, 66, 0.35)',
    verseRef: '#7dd3fc',
    verseArabic: '#fef08a',
    verseEnglish: '#cbd5e1',
    footerRule: 'rgba(56, 189, 248, 0.35)',
    brandTitle: '#f5c542',
    brandSub: '#94a3b8',
  },
  onyx: {
    id: 'onyx',
    name: 'Royal Onyx',
    bgRadial: ['#24211b', '#131210', '#060606'],
    glowColor: 'rgba(245, 197, 66, 0.15)',
    outerBorder: 'rgba(212, 175, 55, 0.48)',
    innerBorder: 'rgba(255, 215, 0, 0.8)',
    cornerColor: '#ffd700',
    watermarkColor: 'rgba(212, 175, 55, 0.035)',
    badgeBg: 'rgba(212, 175, 55, 0.18)',
    badgeBorder: 'rgba(245, 197, 66, 0.45)',
    badgeText: '#f5c542',
    arabicTitle: '#ffd700',
    englishTitle: '#ffffff',
    starColor: '#ffd700',
    rootBg: 'rgba(255, 255, 255, 0.04)',
    rootBorder: 'rgba(212, 175, 55, 0.3)',
    rootLetters: '#ffd700',
    rootMeaning: '#d4d4d8',
    quoteBoxBg: 'rgba(26, 24, 20, 0.8)',
    quoteBoxBorder: 'rgba(212, 175, 55, 0.35)',
    quoteKicker: '#ffd700',
    quoteText: '#fafafa',
    verseBoxBg: 'rgba(16, 15, 13, 0.9)',
    verseBoxBorder: 'rgba(245, 197, 66, 0.4)',
    verseRef: '#fde68a',
    verseArabic: '#ffd700',
    verseEnglish: '#d4d4d8',
    footerRule: 'rgba(212, 175, 55, 0.4)',
    brandTitle: '#ffd700',
    brandSub: '#a1a1aa',
  },
};

let dom = {};
let currentThemeId = 'emerald';
let currentItem = null;
let currentBlob = null;
let renderVersion = 0;

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawRubElHizb(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(cx, cy);
  const half = size / 2;
  ctx.beginPath();
  ctx.rect(-half, -half, size, size);
  ctx.fill();
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.rect(-half, -half, size, size);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();
  ctx.restore();
}

function drawCornerAccents(ctx, x, y, w, h, size, color) {
  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  ctx.save();
  ctx.fillStyle = color;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGeometricWatermark(ctx, cx, cy, radius, strokeColor) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * (radius * 0.35), cy + Math.sin(angle) * (radius * 0.35), radius * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Generate 1080×1080 canvas for the given item and theme.
 */
export async function generateCardCanvas(item, themeName = 'emerald') {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 600))]);
    } catch {
      /* continue */
    }
  }

  const theme = CARD_THEMES[themeName] || CARD_THEMES.emerald;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // 1. Background radial gradient
  const bgGrad = ctx.createRadialGradient(540, 280, 0, 540, 540, 760);
  bgGrad.addColorStop(0, theme.bgRadial[0]);
  bgGrad.addColorStop(0.48, theme.bgRadial[1]);
  bgGrad.addColorStop(1, theme.bgRadial[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // 2. Ambient top spotlight
  const glowGrad = ctx.createRadialGradient(540, 160, 0, 540, 220, 420);
  glowGrad.addColorStop(0, theme.glowColor);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 1080, 600);

  // 3. Faint geometric watermark
  drawGeometricWatermark(ctx, 540, 540, 360, theme.watermarkColor);

  // 4. Frames & Corner Diamonds
  ctx.lineWidth = 2;
  ctx.strokeStyle = theme.outerBorder;
  drawRoundedRect(ctx, 40, 40, 1000, 1000, 28);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.innerBorder;
  drawRoundedRect(ctx, 56, 56, 968, 968, 20);
  ctx.stroke();

  drawCornerAccents(ctx, 56, 56, 968, 968, 7, theme.cornerColor);

  // 5. Pre-calculate layout & text blocks
  ctx.font = 'bold 44px Amiri, serif';
  const arTitleLines = wrapText(ctx, item.arabic, 860);

  ctx.font = '800 32px Outfit, sans-serif';
  const enTitleLines = wrapText(ctx, item.title, 840);

  ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
  const quoteLines = wrapText(ctx, `“${item.quote}”`, 820);

  ctx.font = 'bold 28px Amiri, serif';
  const arVerseLines = wrapText(ctx, item.verse.textArabic, 820);

  ctx.font = 'italic 17px "Plus Jakarta Sans", sans-serif';
  const enVerseLines = wrapText(ctx, `“${item.verse.textEnglish}”`, 820);

  // Measure block heights
  const headerHeight =
    32 + // badge
    10 + // gap
    18 + // star
    10 + // gap
    arTitleLines.length * 46 + // arabic title
    6 + // gap
    enTitleLines.length * 34 + // english title
    (item.root ? 8 + 26 : 0); // root badge

  const quoteBoxInnerH = 22 + 8 + quoteLines.length * 27;
  const quoteBoxHeight = Math.max(90, quoteBoxInnerH + 30);

  const verseBoxInnerH = 20 + 12 + arVerseLines.length * 42 + 10 + enVerseLines.length * 24;
  const verseBoxHeight = Math.max(160, verseBoxInnerH + 36);

  const footerHeight = 46;

  // Distribute remaining vertical space cleanly
  const totalContentH = headerHeight + quoteBoxHeight + verseBoxHeight + footerHeight;
  const availableH = 920; // 80 to 1000
  const remaining = Math.max(0, availableH - totalContentH);
  const gap = Math.max(16, Math.min(34, Math.floor(remaining / 3)));
  let curY = Math.max(76, Math.floor(76 + (remaining - gap * 3) / 2));

  // ─── Header: Dimension Badge ─────────────────────────────────────────────
  const badgeText = `DIMENSION #${pad3(item.id)} · ${item.category.toUpperCase()}`;
  ctx.font = '800 13px Outfit, sans-serif';
  const badgeWidth = Math.min(600, ctx.measureText(badgeText).width + 36);
  const badgeX = 540 - badgeWidth / 2;
  const badgeY = curY;

  ctx.fillStyle = theme.badgeBg;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 32, 16);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.badgeBorder;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 32, 16);
  ctx.stroke();

  ctx.fillStyle = theme.badgeText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 540, badgeY + 16);

  curY += 32 + 10;

  // ─── Header: 8-point star ────────────────────────────────────────────────
  drawRubElHizb(ctx, 540, curY + 9, 18, theme.starColor);
  curY += 18 + 10;

  // ─── Header: Arabic Title ────────────────────────────────────────────────
  ctx.font = 'bold 44px Amiri, serif';
  ctx.fillStyle = theme.arabicTitle;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const line of arTitleLines) {
    ctx.fillText(line, 540, curY + 36);
    curY += 46;
  }
  curY += 4;

  // ─── Header: English Title ───────────────────────────────────────────────
  ctx.font = '800 32px Outfit, sans-serif';
  ctx.fillStyle = theme.englishTitle;
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const line of enTitleLines) {
    ctx.fillText(line, 540, curY + 26);
    curY += 34;
  }

  // ─── Header: Root Badge ──────────────────────────────────────────────────
  if (item.root) {
    curY += 6;
    const rootLine = `[ ROOT: ${item.root.letters.join(' · ')} ]  —  ${item.root.meaning}`;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    const rootW = Math.min(840, ctx.measureText(rootLine).width + 32);
    const rootX = 540 - rootW / 2;

    ctx.fillStyle = theme.rootBg;
    drawRoundedRect(ctx, rootX, curY, rootW, 26, 13);
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.rootBorder;
    drawRoundedRect(ctx, rootX, curY, rootW, 26, 13);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.rootLetters;
    ctx.fillText(rootLine, 540, curY + 13);
    curY += 26;
  }

  curY += gap;

  // ─── Box 1: Thematic Gem ─────────────────────────────────────────────────
  const boxX = 68;
  const boxW = 944;

  ctx.fillStyle = theme.quoteBoxBg;
  drawRoundedRect(ctx, boxX, curY, boxW, quoteBoxHeight, 18);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.quoteBoxBorder;
  drawRoundedRect(ctx, boxX, curY, boxW, quoteBoxHeight, 18);
  ctx.stroke();

  let qY = curY + 16;
  ctx.font = '800 12px Outfit, sans-serif';
  ctx.fillStyle = theme.quoteKicker;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('✦ THEMATIC GEM & CORE INSIGHT', 540, qY);
  qY += 22;

  ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = theme.quoteText;
  ctx.textBaseline = 'top';
  for (const line of quoteLines) {
    ctx.fillText(line, 540, qY);
    qY += 27;
  }

  curY += quoteBoxHeight + gap;

  // ─── Box 2: Quranic Verse ────────────────────────────────────────────────
  ctx.fillStyle = theme.verseBoxBg;
  drawRoundedRect(ctx, boxX, curY, boxW, verseBoxHeight, 18);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.verseBoxBorder;
  drawRoundedRect(ctx, boxX, curY, boxW, verseBoxHeight, 18);
  ctx.stroke();

  let vY = curY + 16;
  const verseRefText = `SURAH ${item.verse.surahName.toUpperCase()} · ${verseKey(item.verse)}`;
  ctx.font = '800 13px Outfit, sans-serif';
  ctx.fillStyle = theme.verseRef;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(verseRefText, 540, vY);
  vY += 26;

  ctx.font = 'bold 28px Amiri, serif';
  ctx.fillStyle = theme.verseArabic;
  ctx.direction = 'rtl';
  ctx.textBaseline = 'top';
  for (const line of arVerseLines) {
    ctx.fillText(line, 540, vY);
    vY += 42;
  }
  vY += 6;

  ctx.font = 'italic 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = theme.verseEnglish;
  ctx.direction = 'ltr';
  ctx.textBaseline = 'top';
  for (const line of enVerseLines) {
    ctx.fillText(line, 540, vY);
    vY += 24;
  }

  // ─── Footer: Branding & Divider ──────────────────────────────────────────
  const footerY = 1014;

  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.footerRule;
  ctx.beginPath();
  ctx.moveTo(220, footerY - 26);
  ctx.lineTo(516, footerY - 26);
  ctx.moveTo(564, footerY - 26);
  ctx.lineTo(860, footerY - 26);
  ctx.stroke();

  // Diamond in center of divider
  ctx.fillStyle = theme.cornerColor;
  ctx.beginPath();
  ctx.moveTo(540, footerY - 32);
  ctx.lineTo(546, footerY - 26);
  ctx.lineTo(540, footerY - 20);
  ctx.lineTo(534, footerY - 26);
  ctx.closePath();
  ctx.fill();

  ctx.font = '800 16px Outfit, sans-serif';
  ctx.fillStyle = theme.brandTitle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('100TOP ISLAM & QURAN', 540, footerY - 4);

  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = theme.brandSub;
  ctx.fillText('The Living Matrix  ·  100top-islam-quran.pages.dev', 540, footerY + 16);

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function cardFileName(item) {
  return `100top-dimension-${pad3(item.id)}-${slugify(item.title)}.png`;
}

async function renderCurrentCard() {
  if (!currentItem) return;
  const version = ++renderVersion;
  dom.loader.hidden = false;

  try {
    const canvas = await generateCardCanvas(currentItem, currentThemeId);
    if (version !== renderVersion) return; // Superceded by faster click

    const blob = await canvasToBlob(canvas);
    currentBlob = blob;
    const url = URL.createObjectURL(blob);

    if (dom.previewImg.src && dom.previewImg.src.startsWith('blob:')) {
      URL.revokeObjectURL(dom.previewImg.src);
    }
    dom.previewImg.src = url;
  } catch (err) {
    console.error('Failed to generate visual card', err);
    toast('Could not render visual card preview', { type: 'error' });
  } finally {
    if (version === renderVersion) {
      dom.loader.hidden = true;
    }
  }
}

export function openVisualCardDialog(idOrItem) {
  const item = typeof idOrItem === 'object' && idOrItem ? idOrItem : app.itemsById.get(Number(idOrItem));
  if (!item) return false;

  currentItem = item;
  dom.indicator.textContent = `Dimension #${pad3(item.id)}`;

  openDialog(dom.overlay, {
    onClose: () => {
      if (dom.previewImg.src && dom.previewImg.src.startsWith('blob:')) {
        URL.revokeObjectURL(dom.previewImg.src);
        dom.previewImg.src = '';
      }
      currentBlob = null;
    },
  });

  renderCurrentCard();
  return true;
}

export function closeVisualCardDialog() {
  closeDialog(dom.overlay);
}

async function handleDownload() {
  if (!currentItem || !currentBlob) {
    toast('Card is still rendering…', { type: 'info' });
    return;
  }
  const filename = cardFileName(currentItem);
  const url = URL.createObjectURL(currentBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Visual card downloaded (${filename})`, { type: 'info' });
}

async function handleCopy() {
  if (!currentItem || !currentBlob) {
    toast('Card is still rendering…', { type: 'info' });
    return;
  }
  if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': currentBlob })]);
      toast('Visual card copied to clipboard! Ready to paste.', { type: 'info' });
      return;
    } catch {
      /* fall back below */
    }
  }

  // Fallback to text copy
  const shareText = `Dimension #${pad3(currentItem.id)}: ${currentItem.title} (${currentItem.arabic})\n“${currentItem.quote}”\nhttps://100top-islam-quran.pages.dev/#dim-${currentItem.id}`;
  const ok = await copyText(shareText);
  toast(ok ? 'Direct image copy blocked; dimension text copied to clipboard' : 'Could not copy to clipboard', {
    type: ok ? 'info' : 'error',
  });
}

async function handleShare() {
  if (!currentItem || !currentBlob) {
    toast('Card is still rendering…', { type: 'info' });
    return;
  }
  const filename = cardFileName(currentItem);
  const file = new File([currentBlob], filename, { type: 'image/png' });
  const shareData = {
    title: `${currentItem.title} · 100Top Islam & Quran`,
    text: `Dimension #${pad3(currentItem.id)}: ${currentItem.title} (${currentItem.arabic})\n“${currentItem.quote}”`,
    url: `https://100top-islam-quran.pages.dev/#dim-${currentItem.id}`,
  };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ ...shareData, files: [file] });
      return;
    } catch {
      /* User cancelled or share failed */
      return;
    }
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      return;
    }
  }

  // If sharing not supported, copy image
  await handleCopy();
}

function handleNavigate(delta) {
  if (!currentItem) return;
  const ids = app.data.items.map((i) => i.id);
  const idx = ids.indexOf(currentItem.id);
  const nextIdx = (idx + delta + ids.length) % ids.length;
  const nextItem = app.itemsById.get(ids[nextIdx]);
  if (nextItem) {
    currentItem = nextItem;
    dom.indicator.textContent = `Dimension #${pad3(nextItem.id)}`;
    renderCurrentCard();
  }
}

export function initVisualCard() {
  dom = {
    overlay: $('#card-generator-modal'),
    previewImg: $('#card-preview-img'),
    loader: $('#card-preview-loader'),
    closeBtn: $('#card-modal-close-btn'),
    indicator: $('#card-dimension-indicator'),
    prevBtn: $('#btn-card-prev'),
    nextBtn: $('#btn-card-next'),
    downloadBtn: $('#btn-card-download'),
    copyBtn: $('#btn-card-copy'),
    shareBtn: $('#btn-card-share'),
    themeButtons: $$('.btn-card-theme'),
  };

  if (!dom.overlay) return;

  dom.closeBtn?.addEventListener('click', () => closeVisualCardDialog());
  dom.downloadBtn?.addEventListener('click', handleDownload);
  dom.copyBtn?.addEventListener('click', handleCopy);
  dom.shareBtn?.addEventListener('click', handleShare);
  dom.prevBtn?.addEventListener('click', () => handleNavigate(-1));
  dom.nextBtn?.addEventListener('click', () => handleNavigate(1));

  dom.themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme;
      if (!CARD_THEMES[themeId] || themeId === currentThemeId) return;
      currentThemeId = themeId;
      dom.themeButtons.forEach((b) => {
        const active = b.dataset.theme === themeId;
        b.classList.toggle('active', active);
        b.setAttribute('aria-checked', String(active));
      });
      renderCurrentCard();
    });
  });

  // Global listener: any button with [data-card="id"] opens this generator
  document.addEventListener('click', (ev) => {
    const trigger = ev.target.closest('[data-card]');
    if (!trigger) return;
    ev.preventDefault();
    ev.stopPropagation();
    const id = Number(trigger.dataset.card);
    openVisualCardDialog(id);
  });
}
