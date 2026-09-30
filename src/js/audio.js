// Quran recitation player. Every play button carries a data-play key ("item:12", "res:3", "q:q1");
// next/previous move within the list the verse came from.
import { AUDIO_BASE, RECITERS, STORAGE_KEYS } from './config.js';
import { app, emit } from './state.js';
import { loadString, saveString } from './storage.js';
import { formatTime, icon, pad3, verseAyahs, verseKey } from './util.js';
import { $, $$, toast } from './ui.js';

const REPEAT_MODES = ['all', 'one', 'off'];
const REPEAT_LABELS = {
  all: 'Repeat mode: continuous (plays the next verse)',
  one: 'Repeat mode: loop this verse (memorization)',
  off: 'Repeat mode: stop after this verse',
};
const PLAY_ICON = icon('play');
const PAUSE_ICON = icon('pause');
const VOLUME_ICONS = { high: icon('volume-high'), low: icon('volume-low'), mute: icon('volume-xmark') };

const player = {
  audio: new Audio(),
  key: null,
  part: 0, // index of the ayah being played within a multi-verse citation
  isPlaying: false,
  repeatMode: loadString(STORAGE_KEYS.repeatMode, 'all', REPEAT_MODES),
  reciter: loadString(
    STORAGE_KEYS.reciter,
    RECITERS[0].id,
    RECITERS.map((r) => r.id),
  ),
  volume: clamp(parseFloat(loadString(STORAGE_KEYS.volume, '1')), 0, 1, 1),
  rate: clamp(parseFloat(loadString(STORAGE_KEYS.playbackRate, '1')), 0.5, 2, 1),
  muted: false,
};
player.audio.preload = 'none';

let dom = {};

function clamp(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

// ─── Verse lookup ──────────────────────────────────────────────────────────
function listFor(type) {
  const { items, reservations, questions } = app.data;
  if (type === 'res') return reservations.map((r) => `res:${r.id}`);
  if (type === 'q') return questions.map((q) => `q:${q.id}`);
  return items.map((i) => `item:${i.id}`);
}

export function verseForKey(key) {
  const [type, rawId] = String(key).split(':');
  const { reservations, questions } = app.data;
  if (type === 'item') return app.itemsById.get(Number(rawId))?.verse || null;
  if (type === 'res') return reservations.find((r) => r.id === Number(rawId))?.verse || null;
  if (type === 'q') return questions.find((q) => q.id === rawId)?.verse || null;
  return null;
}

/** URL for the ayah currently playing within the citation (passages play verse by verse). */
function audioUrl(verse) {
  const ayah = verseAyahs(verse)[player.part] ?? verse.ayah;
  return `${AUDIO_BASE}/${player.reciter}/${pad3(verse.surah)}${pad3(ayah)}.mp3`;
}

function reciterName() {
  return RECITERS.find((r) => r.id === player.reciter)?.name || '';
}

// ─── Playback ──────────────────────────────────────────────────────────────
function loadPart(verse, part) {
  player.part = part;
  player.audio.src = audioUrl(verse);
  player.audio.playbackRate = player.rate;
  applyVolume();
  renderTrackInfo(verse);
  const promise = player.audio.play();
  if (promise) promise.catch((err) => handlePlayError(err));
}

export function playKey(key) {
  const verse = verseForKey(key);
  if (!verse) return;
  player.key = key;
  showBar(true);
  loadPart(verse, 0);
  updateButtons();
}

/** Advance within a multi-verse passage; returns false when the passage is finished. */
function playNextPart() {
  const verse = verseForKey(player.key);
  if (!verse || player.part >= verseAyahs(verse).length - 1) return false;
  loadPart(verse, player.part + 1);
  return true;
}

/** Toggle a specific verse: pause if it's the one playing, otherwise play it. */
export function toggleKey(key) {
  if (player.key === key && player.isPlaying) player.audio.pause();
  else if (player.key === key && player.audio.src) resume();
  else playKey(key);
}

export function togglePlayPause() {
  if (!player.key) {
    playKey(listFor('item')[0]);
    return;
  }
  if (player.isPlaying) player.audio.pause();
  else resume();
}

export function hasTrack() {
  return Boolean(player.key);
}

function resume() {
  showBar(true);
  player.audio.play().catch((err) => handlePlayError(err));
}

function step(delta) {
  const type = player.key ? player.key.split(':')[0] : 'item';
  const list = listFor(type);
  const index = player.key ? list.indexOf(player.key) : -1;
  const next = (index + delta + list.length) % list.length;
  playKey(list[next]);
}

export const next = () => step(1);
export const prev = () => step(-1);

function handlePlayError(err) {
  if (err && err.name === 'AbortError') return; // superseded by another play() call
  if (err && err.name === 'NotAllowedError') {
    toast('Tap play to start the recitation.');
    return;
  }
  console.warn('Audio playback error', err);
}

export function toggleMute() {
  player.muted = !player.muted;
  applyVolume();
  toast(player.muted ? 'Audio muted' : 'Audio unmuted');
}

function applyVolume() {
  player.audio.volume = player.muted ? 0 : player.volume;
  if (dom.volumeBtn) {
    const level = player.muted || player.volume === 0 ? 'mute' : player.volume < 0.5 ? 'low' : 'high';
    dom.volumeBtn.innerHTML = VOLUME_ICONS[level];
    dom.volumeBtn.setAttribute('aria-label', player.muted ? 'Unmute' : 'Mute');
    dom.volumeBtn.setAttribute('aria-pressed', String(player.muted));
  }
}

function cycleRepeat() {
  player.repeatMode = REPEAT_MODES[(REPEAT_MODES.indexOf(player.repeatMode) + 1) % REPEAT_MODES.length];
  saveString(STORAGE_KEYS.repeatMode, player.repeatMode);
  renderRepeat();
  toast(REPEAT_LABELS[player.repeatMode]);
}

function renderRepeat() {
  if (!dom.repeatBtn) return;
  dom.repeatBtn.classList.toggle('repeat-one', player.repeatMode === 'one');
  dom.repeatBtn.classList.toggle('repeat-all', player.repeatMode === 'all');
  dom.repeatBtn.setAttribute('aria-label', REPEAT_LABELS[player.repeatMode]);
  dom.repeatBtn.title = REPEAT_LABELS[player.repeatMode];
}

// ─── UI ────────────────────────────────────────────────────────────────────
function showBar(visible) {
  if (!dom.bar) return;
  dom.bar.classList.toggle('minimized', !visible);
  dom.bar.inert = !visible;
  document.body.classList.toggle('player-open', visible);
}

function renderTrackInfo(verse) {
  dom.surah.textContent = `Surah ${verse.surahName}`;
  const ayahs = verseAyahs(verse);
  const current = `${verse.surah}:${ayahs[player.part] ?? verse.ayah}`;
  const passage = ayahs.length > 1 ? ` (passage ${verseKey(verse)})` : '';
  dom.ref.textContent = `Verse ${current}${passage} • ${reciterName()}`;
  dom.arabic.textContent = verse.textArabic;
  if ('mediaSession' in navigator && typeof MediaMetadata === 'function') {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Surah ${verse.surahName} ${current}`,
      artist: reciterName(),
      album: '100Top Islam & Quran',
    });
  }
}

/** Sync every play button on the page with the current track. */
export function updateButtons(root = document) {
  $$('[data-play]', root).forEach((btn) => {
    const active = btn.dataset.play === player.key && player.isPlaying;
    if (btn.classList.contains('playing') === active && btn.dataset.synced) return;
    btn.dataset.synced = '1';
    btn.classList.toggle('playing', active);
    btn.setAttribute('aria-pressed', String(active));
    const svg = btn.querySelector('svg');
    if (svg) svg.outerHTML = active ? PAUSE_ICON : PLAY_ICON;
    const lbl = btn.querySelector('.lbl');
    if (lbl) lbl.textContent = active ? 'Pause' : btn.dataset.label || 'Recite';
  });
}

function updateTransport() {
  if (dom.playBtn) {
    dom.playBtn.innerHTML = player.isPlaying ? PAUSE_ICON : PLAY_ICON;
    dom.playBtn.setAttribute('aria-label', player.isPlaying ? 'Pause recitation' : 'Play recitation');
  }
  dom.eq.hidden = !player.isPlaying;
  dom.badgeIcon.hidden = player.isPlaying;
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = player.isPlaying ? 'playing' : 'paused';
}

function onStateChange() {
  updateTransport();
  updateButtons();
  emit('audio-state', { key: player.key, isPlaying: player.isPlaying });
}

// ─── Init ──────────────────────────────────────────────────────────────────
export function initAudio() {
  dom = {
    bar: $('#audio-player-bar'),
    surah: $('#audio-surah-name'),
    ref: $('#audio-verse-ref'),
    arabic: $('#audio-arabic-snippet'),
    playBtn: $('#audio-play-btn'),
    prevBtn: $('#audio-prev-btn'),
    nextBtn: $('#audio-next-btn'),
    seek: $('#audio-seek-bar'),
    current: $('#audio-current-time'),
    duration: $('#audio-duration'),
    speed: $('#audio-speed-select'),
    reciter: $('#audio-reciter-select'),
    repeatBtn: $('#audio-repeat-btn'),
    volumeBtn: $('#audio-volume-btn'),
    volume: $('#audio-volume-slider'),
    closeBtn: $('#audio-close-btn'),
    eq: $('#audio-eq-bars'),
    badgeIcon: $('#audio-badge-icon'),
  };

  dom.reciter.innerHTML = RECITERS.map((r) => `<option value="${r.id}">${r.name}</option>`).join('');
  dom.reciter.value = player.reciter;
  dom.volume.value = String(player.volume);
  dom.speed.value = String(player.rate);
  if (dom.speed.value !== String(player.rate)) dom.speed.value = '1';
  renderRepeat();
  applyVolume();
  showBar(false);

  const a = player.audio;
  a.addEventListener('play', () => {
    player.isPlaying = true;
    onStateChange();
  });
  a.addEventListener('pause', () => {
    player.isPlaying = false;
    onStateChange();
  });
  a.addEventListener('ended', () => {
    if (playNextPart()) return; // continue a multi-verse passage
    if (player.repeatMode === 'one') {
      // Loop the whole citation (restart at its first ayah).
      if (player.part > 0) loadPart(verseForKey(player.key), 0);
      else {
        a.currentTime = 0;
        a.play().catch(handlePlayError);
      }
    } else if (player.repeatMode === 'all') {
      next();
    } else {
      player.isPlaying = false;
      onStateChange();
    }
  });
  a.addEventListener('error', () => {
    if (!a.src) return;
    player.isPlaying = false;
    onStateChange();
    toast('Could not load this recitation. Check your connection or try another reciter.', { type: 'error' });
  });
  a.addEventListener('timeupdate', () => {
    if (!Number.isFinite(a.duration) || !a.duration) return;
    const pct = (a.currentTime / a.duration) * 100;
    dom.seek.value = String(pct);
    dom.seek.style.setProperty('--seek-percent', `${pct}%`);
    dom.seek.setAttribute('aria-valuetext', `${formatTime(a.currentTime)} of ${formatTime(a.duration)}`);
    dom.current.textContent = formatTime(a.currentTime);
    dom.duration.textContent = formatTime(a.duration);
  });

  dom.playBtn.addEventListener('click', togglePlayPause);
  dom.nextBtn.addEventListener('click', next);
  dom.prevBtn.addEventListener('click', prev);
  dom.repeatBtn.addEventListener('click', cycleRepeat);
  dom.volumeBtn.addEventListener('click', toggleMute);
  dom.closeBtn.addEventListener('click', () => {
    a.pause();
    showBar(false);
  });
  dom.seek.addEventListener('input', () => {
    if (Number.isFinite(a.duration)) a.currentTime = (Number(dom.seek.value) / 100) * a.duration;
  });
  dom.speed.addEventListener('change', () => {
    player.rate = clamp(parseFloat(dom.speed.value), 0.5, 2, 1);
    a.playbackRate = player.rate;
    saveString(STORAGE_KEYS.playbackRate, player.rate);
  });
  dom.volume.addEventListener('input', () => {
    player.volume = clamp(parseFloat(dom.volume.value), 0, 1, 1);
    player.muted = player.volume === 0;
    saveString(STORAGE_KEYS.volume, player.volume);
    applyVolume();
  });
  dom.reciter.addEventListener('change', () => {
    player.reciter = dom.reciter.value;
    saveString(STORAGE_KEYS.reciter, player.reciter);
    toast(`Reciter: ${reciterName()}`);
    if (player.key) {
      const wasPlaying = player.isPlaying;
      const verse = verseForKey(player.key);
      a.src = audioUrl(verse);
      renderTrackInfo(verse);
      if (wasPlaying) a.play().catch(handlePlayError);
    }
  });

  // One delegated handler for every play button in the app.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleKey(btn.dataset.play);
  });

  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => resume());
    ms.setActionHandler('pause', () => a.pause());
    ms.setActionHandler('nexttrack', next);
    ms.setActionHandler('previoustrack', prev);
  }
}
