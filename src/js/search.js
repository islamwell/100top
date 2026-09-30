// Pure search helpers: Arabic normalization, root transliteration and item filtering.

const ARABIC_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabic(text) {
  return ARABIC_CHAR.test(String(text || ''));
}

/** Strip tashkeel, Quranic annotation marks and tatweel; unify letter variants. */
export function normalizeArabic(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g, '') // harakat & Quranic marks
    .replace(/\u0640/g, '') // tatweel
    .replace(/[إأآٱٲٳ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[\u060C\u061B\u061F\u06D4«»"'().,:;!?\-_[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lowercase Latin text and drop diacritics (ḥ → h, ā → a) and typographic apostrophes. */
export function normalizeLatin(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[ʿʾ‘’`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Accepted Latin spellings for each Arabic root letter.
const ROOT_LATIN = {
  ا: ['a', 'aa', "'"],
  أ: ["'", 'a', '2'],
  إ: ["'", 'i', '2'],
  آ: ['a', "'"],
  ء: ["'", 'a', '2'],
  ب: ['b'],
  ت: ['t'],
  ث: ['th', 't', 's'],
  ج: ['j', 'g'],
  ح: ['h', '7'],
  خ: ['kh', 'x', '5'],
  د: ['d'],
  ذ: ['dh', 'th', 'z', 'd'],
  ر: ['r'],
  ز: ['z'],
  س: ['s'],
  ش: ['sh'],
  ص: ['s', '9'],
  ض: ['d', 'dh'],
  ط: ['t', '6'],
  ظ: ['z', 'dh', 'th'],
  ع: ["'", 'a', 'e', '3', ''],
  غ: ['gh', 'g'],
  ف: ['f'],
  ق: ['q', 'k'],
  ك: ['k'],
  ل: ['l'],
  م: ['m'],
  ن: ['n'],
  ه: ['h'],
  و: ['w', 'u', 'o', 'v'],
  ي: ['y', 'i', 'ee'],
  ى: ['a', 'y'],
  ة: ['h', 't', 'a'],
};

/** Extract the Arabic root letters from a string like "س-ل-م (Peace, submission)". */
export function rootLetters(root) {
  const arabicPart = String(root || '').split('(')[0];
  return arabicPart
    .split(/[-–—\s]+/)
    .map((part) => part.replace(/[\u064B-\u065F\u0670]/g, '').trim())
    .filter((part) => part.length === 1 && hasArabic(part));
}

/** Default transliteration of a root, e.g. ["س","ل","م"] → "s-l-m". */
export function transliterateRoot(letters) {
  return letters.map((l) => (ROOT_LATIN[l] ? ROOT_LATIN[l][0] : l)).join('-');
}

/** Parse a query like "S-L-M", "s l m" or "k.t.b" into root parts; returns null otherwise. */
export function parseRootQuery(query) {
  const q = normalizeLatin(query);
  if (!/^[a-z'0-9]{1,3}([-\s.][a-z'0-9]{1,3}){1,3}$/.test(q)) return null;
  return q.split(/[-\s.]/);
}

export function matchesRoot(parts, letters) {
  if (!parts || parts.length !== letters.length) return false;
  return parts.every((part, i) => (ROOT_LATIN[letters[i]] || []).includes(part));
}

/** Precompute normalized search text for an item (done once per item). */
export function buildSearchIndex(item) {
  const letters = rootLetters(item.root);
  const latin = [
    item.title,
    item.summary,
    item.deepDive,
    item.category,
    item.root,
    transliterateRoot(letters),
    ...(item.tags || []),
    item.verse?.textEnglish,
    item.verse?.surahName,
    // Every cited ayah is searchable, e.g. "112:3" finds a 112:1–4 citation.
    ...(item.verse
      ? Array.from(
          { length: (item.verse.ayahEnd || item.verse.ayah) - item.verse.ayah + 1 },
          (_, i) => `${item.verse.surah}:${item.verse.ayah + i}`,
        )
      : []),
  ].join(' \n ');
  const arabic = [item.arabic, item.verse?.textArabic, letters.join('')].join(' ');
  return {
    id: item.id,
    latin: normalizeLatin(latin),
    arabic: normalizeArabic(arabic),
    rootLetters: letters,
  };
}

/** True if every query token appears in the item (AND semantics). */
export function matchesQuery(index, rawQuery) {
  const query = String(rawQuery || '').trim();
  if (!query) return true;

  const idMatch = query.match(/^#?(\d{1,3})$/);
  if (idMatch && Number(idMatch[1]) === index.id) return true;

  if (hasArabic(query)) {
    const tokens = normalizeArabic(query).split(' ').filter(Boolean);
    const compact = index.arabic.replace(/ /g, '');
    return tokens.every((t) => index.arabic.includes(t) || compact.includes(t));
  }

  const rootParts = parseRootQuery(query);
  if (rootParts && matchesRoot(rootParts, index.rootLetters)) return true;

  const tokens = normalizeLatin(query)
    .split(/[\s,]+/)
    .map((t) => t.replace(/^['"]+|['"]+$/g, ''))
    .filter(Boolean);
  return tokens.length > 0 && tokens.every((t) => index.latin.includes(t));
}

/**
 * Filter items by category, bookmarks and query.
 * @returns {Set<number>} ids of visible items
 */
export function filterItems(items, indexById, { category = 'all', bookmarksOnly = false, bookmarks = new Set(), query = '' } = {}) {
  const visible = new Set();
  for (const item of items) {
    if (category !== 'all' && item.category !== category) continue;
    if (bookmarksOnly && !bookmarks.has(item.id)) continue;
    if (!matchesQuery(indexById.get(item.id), query)) continue;
    visible.add(item.id);
  }
  return visible;
}

/** Simple text filter for reservations. */
export function matchesText(fields, rawQuery) {
  const tokens = normalizeLatin(rawQuery).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const hay = normalizeLatin(fields.join(' '));
  return tokens.every((t) => hay.includes(t));
}
