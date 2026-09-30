// Structural checks for src/data/data.json. Returns a list of problems (empty = valid).

// Number of verses in each surah (Hafs), index 0 = Al-Fatihah.
export const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18,
  12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

function checkVerse(verse, where, problems) {
  if (!verse || typeof verse !== 'object') {
    problems.push(`${where}: missing verse`);
    return;
  }
  const { surah, ayah } = verse;
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) problems.push(`${where}: invalid surah ${surah}`);
  else if (!Number.isInteger(ayah) || ayah < 1 || ayah > AYAH_COUNTS[surah - 1]) problems.push(`${where}: invalid ayah ${surah}:${ayah}`);
  else if (verse.ayahEnd !== undefined) {
    const end = verse.ayahEnd;
    if (!Number.isInteger(end) || end <= ayah || end > AYAH_COUNTS[surah - 1] || end - ayah > 10) {
      problems.push(`${where}: invalid ayahEnd ${surah}:${ayah}-${end}`);
    }
  }
  for (const field of ['surahName', 'textArabic', 'textEnglish']) {
    if (!isNonEmptyString(verse[field])) problems.push(`${where}: verse.${field} is empty`);
  }
}

export function validateData(data) {
  const problems = [];
  if (AYAH_COUNTS.length !== 114 || AYAH_COUNTS.reduce((a, b) => a + b, 0) !== 6236) {
    problems.push('internal: AYAH_COUNTS table is wrong');
  }
  for (const key of ['categories', 'items', 'reservations', 'questions', 'quotes']) {
    if (!Array.isArray(data[key]) || !data[key].length) problems.push(`"${key}" must be a non-empty array`);
  }
  if (problems.length) return problems;

  const categoryIds = new Set(data.categories.map((c) => c.id));
  const seen = new Set();
  for (const item of data.items) {
    const where = `item #${item.id}`;
    if (!Number.isInteger(item.id)) problems.push(`${where}: id must be an integer`);
    if (seen.has(item.id)) problems.push(`${where}: duplicate id`);
    seen.add(item.id);
    for (const field of ['title', 'arabic', 'category', 'root', 'summary', 'deepDive', 'practicalTakeaway', 'quote']) {
      if (!isNonEmptyString(item[field])) problems.push(`${where}: "${field}" is empty`);
    }
    if (!categoryIds.has(item.category)) problems.push(`${where}: unknown category "${item.category}"`);
    if (!Array.isArray(item.tags)) problems.push(`${where}: tags must be an array`);
    checkVerse(item.verse, where, problems);
  }

  const resIds = new Set();
  for (const res of data.reservations) {
    const where = `reservation #${res.id}`;
    if (!Number.isInteger(res.id) || resIds.has(res.id)) problems.push(`${where}: missing or duplicate id`);
    resIds.add(res.id);
    for (const field of ['title', 'reservation', 'category', 'counterArgument', 'keyTakeaway']) {
      if (!isNonEmptyString(res[field])) problems.push(`${where}: "${field}" is empty`);
    }
    checkVerse(res.verse, where, problems);
  }

  const qIds = new Set();
  for (const q of data.questions) {
    const where = `question ${q.id}`;
    if (!isNonEmptyString(q.id) || qIds.has(q.id)) problems.push(`${where}: missing or duplicate id`);
    qIds.add(q.id);
    if (!Array.isArray(q.reflectionPrompts)) problems.push(`${where}: reflectionPrompts must be an array`);
    checkVerse(q.verse, where, problems);
  }
  return problems;
}
