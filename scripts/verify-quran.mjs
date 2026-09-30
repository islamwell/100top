#!/usr/bin/env node
// Checks every verse cited in data.json against the Quran.com API (Uthmani / Imla'i text and the
// Saheeh International translation). Usage:
//   npm run verify:quran            report only (exit 1 on problems)
//   npm run verify:quran -- --fix   record the real range (ayahEnd) for multi-verse passages
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeArabic } from '../src/js/search.js';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/data/data.json');
const API = 'https://api.quran.com/api/v4/verses/by_key';
const TRANSLATION_ID = 20; // Saheeh International
const FIX = process.argv.includes('--fix');

const stripEnglish = (t) =>
  String(t || '')
    .replace(/<sup[^>]*>.*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function wordOverlap(a, b) {
  const wa = new Set(stripEnglish(a).split(' ').filter(Boolean));
  const wb = new Set(stripEnglish(b).split(' ').filter(Boolean));
  if (!wa.size) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / wa.size;
}

// Uthmani and imla'i spellings differ (e.g. alif khanjariyya); compare with long vowels removed too.
const skeleton = (t) =>
  normalizeArabic(t)
    .replace(/[اويى]/g, '')
    .replace(/\s+/g, '');

async function fetchVerse(key, attempt = 1) {
  const url = `${API}/${key}?fields=text_uthmani,text_imlaei&translations=${TRANSLATION_ID}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { verse } = await res.json();
    return { uthmani: verse.text_uthmani, imlaei: verse.text_imlaei, english: verse.translations?.[0]?.text || '' };
  } catch (err) {
    if (attempt < 3) return fetchVerse(key, attempt + 1);
    throw err;
  }
}

async function main() {
  const data = JSON.parse(await readFile(DATA, 'utf8'));
  const refs = [
    ...data.items.map((i) => ({ where: `item #${i.id} ${i.title}`, verse: i.verse })),
    ...data.reservations.map((r) => ({ where: `reservation #${r.id}`, verse: r.verse })),
    ...data.questions.map((q) => ({ where: `question ${q.id}`, verse: q.verse })),
  ];
  // Prefetch every cited verse range in parallel.
  const keys = new Set();
  for (const r of refs) {
    for (let a = r.verse.ayah; a <= (r.verse.ayahEnd || r.verse.ayah); a++) keys.add(`${r.verse.surah}:${a}`);
  }
  const source = new Map();
  const queue = [...keys];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const key = queue.shift();
        source.set(key, await fetchVerse(key));
      }
    }),
  );

  const getVerse = async (key) => {
    if (!source.has(key)) source.set(key, await fetchVerse(key));
    return source.get(key);
  };
  // Concatenated source text for surah:from..to
  const passage = async (surah, from, to) => {
    const parts = [];
    for (let a = from; a <= to; a++) parts.push(await getVerse(`${surah}:${a}`));
    return {
      imlaei: parts.map((p) => p.imlaei).join(' '),
      uthmani: parts.map((p) => p.uthmani).join(' '),
      english: parts.map((p) => p.english).join(' '),
    };
  };
  // Our text may elide words with "..." and separate verses with "۝".
  const matches = (ours, src) => {
    const pieces = ours
      .replace(/۝/g, ' ')
      .split(/\.\.\.|…/)
      .map(skeleton)
      .filter(Boolean);
    for (const full of [skeleton(src.imlaei), skeleton(src.uthmani)]) {
      let pos = 0;
      const ok = pieces.every((piece) => {
        const at = full.indexOf(piece, pos);
        if (at === -1) return false;
        pos = at + piece.length;
        return true;
      });
      if (ok) return pieces.join('') === full ? 'full' : 'excerpt';
    }
    return null;
  };

  const report = { exact: 0, excerpt: 0, ranges: [], arabicMismatch: [], englishLow: [], fixed: 0 };
  for (const ref of refs) {
    const { surah, ayah } = ref.verse;
    const key = `${surah}:${ref.verse.ayah}${ref.verse.ayahEnd ? `-${ref.verse.ayahEnd}` : ''}`;
    let end = ref.verse.ayahEnd || ayah;
    let src = await passage(surah, ayah, end);
    let result = matches(ref.verse.textArabic, src);

    // A multi-verse passage cited by its first verse only: find the real end of the range.
    if (!result && !ref.verse.ayahEnd) {
      for (let extra = 1; extra <= 4 && !result; extra++) {
        try {
          const candidate = await passage(surah, ayah, ayah + extra);
          const r = matches(ref.verse.textArabic, candidate);
          if (r) {
            result = r;
            end = ayah + extra;
            src = candidate;
            report.ranges.push({ where: ref.where, from: key, to: `${surah}:${ayah}-${end}` });
            if (FIX) {
              ref.verse.ayahEnd = end;
              report.fixed++;
            }
          }
        } catch {
          break; // ran past the end of the surah
        }
      }
    }

    if (result === 'full') report.exact++;
    else if (result === 'excerpt') report.excerpt++;
    else report.arabicMismatch.push({ where: ref.where, key, ours: ref.verse.textArabic, source: src.imlaei });

    const overlap = wordOverlap(ref.verse.textEnglish, src.english);
    if (overlap < (process.env.EN_THRESHOLD ? Number(process.env.EN_THRESHOLD) : 0.6)) {
      report.englishLow.push({
        where: ref.where,
        key,
        overlap: overlap.toFixed(2),
        ours: ref.verse.textEnglish,
        saheeh: stripEnglish(src.english),
      });
    }
  }

  console.log(`Checked ${refs.length} citations`);
  console.log(
    `  Arabic: ${report.exact} full, ${report.excerpt} excerpt, ${report.ranges.length} multi-verse passages cited as one verse, ${report.arabicMismatch.length} mismatched`,
  );
  for (const r of report.ranges) console.log(`\n[RANGE] ${r.where}: ${r.from} → ${r.to}${FIX ? ' (fixed)' : ''}`);
  console.log(`  English: ${refs.length - report.englishLow.length} close to Saheeh International, ${report.englishLow.length} differ`);
  for (const m of report.arabicMismatch) console.log(`\n[ARABIC] ${m.where} (${m.key})\n  ours:   ${m.ours}\n  source: ${m.source}`);
  for (const m of report.englishLow)
    console.log(`\n[ENGLISH ${m.overlap}] ${m.where} (${m.key})\n  ours:   ${m.ours}\n  saheeh: ${m.saheeh}`);

  if (FIX && report.fixed) {
    await writeFile(DATA, JSON.stringify(data, null, 2) + '\n');
    console.log(`\nAdded ayahEnd to ${report.fixed} citations in data.json`);
  }
  process.exitCode = report.arabicMismatch.length || (report.ranges.length && !FIX) ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
