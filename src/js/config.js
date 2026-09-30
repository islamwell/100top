// Build-time constants. The build script replaces the __TOKENS__ in dist/.
export const VERSION = '__VERSION__';
export const BUILD_DATE = '__BUILD_DATE__';
export const BUILD_ID = '__BUILD_ID__';

export const DATA_URL = `data/data.json?v=${BUILD_ID}`;

export const STORAGE_KEYS = {
  bookmarks: '100top_bookmarks',
  journal: '100top_journal',
  srs: '100top_srs',
  legacyMastered: '100top_mastered_cards',
  theme: '100top_theme',
  arabicScale: '100top_arabic_scale',
  reciter: '100top_reciter',
  volume: '100top_volume',
  repeatMode: '100top_repeat_mode',
  playbackRate: '100top_playback_rate',
};

export const THEMES = [
  { id: 'emerald', label: 'Emerald', icon: 'gem' },
  { id: 'midnight', label: 'Midnight OLED', icon: 'moon' },
  { id: 'light', label: 'Light Sand', icon: 'sun' },
];

export const ARABIC_SCALES = [
  { id: 'sm', label: 'A−', name: 'Small Arabic text' },
  { id: 'md', label: 'A', name: 'Medium Arabic text' },
  { id: 'lg', label: 'A+', name: 'Large Arabic text' },
  { id: 'xl', label: 'A++', name: 'Extra large Arabic text' },
];

export const AUDIO_BASE = 'https://everyayah.com/data';

export const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'Mishary Alafasy' },
  { id: 'Husary_128kbps', name: 'Mahmoud Al-Husary' },
  { id: 'AbdulSamad_64kbps_QuranExplorer.Com', name: 'AbdulBaset AbdulSamad' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Al-Shatri' },
  { id: 'Ghamadi_40kbps', name: 'Saad Al-Ghamdi' },
];

export const TABS = ['concepts', 'reservations', 'questions', 'flashcards'];

/** Name of the English translation used for verse texts in data.json. */
export const TRANSLATION_NAME = 'Saheeh International';
