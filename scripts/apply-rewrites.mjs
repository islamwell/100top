#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cat1 } from './rewrites/cat1.mjs';
import { cat2 } from './rewrites/cat2.mjs';
import { cat3 } from './rewrites/cat3.mjs';
import { cat4 } from './rewrites/cat4.mjs';
import { cat5 } from './rewrites/cat5.mjs';
import { cat6 } from './rewrites/cat6.mjs';
import { cat7 } from './rewrites/cat7.mjs';
import { cat8 } from './rewrites/cat8.mjs';
import { cat9 } from './rewrites/cat9.mjs';
import { cat10 } from './rewrites/cat10.mjs';
import { validateData } from './validate-data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'src/data/data.json');

const allUpdates = [...cat1, ...cat2, ...cat3, ...cat4, ...cat5, ...cat6, ...cat7, ...cat8, ...cat9, ...cat10];

async function main() {
  console.log(`Loaded ${allUpdates.length} item updates.`);
  if (allUpdates.length !== 200) {
    throw new Error(`Expected 200 item updates, got ${allUpdates.length}`);
  }

  const updateMap = new Map();
  for (const u of allUpdates) {
    if (updateMap.has(u.id)) {
      throw new Error(`Duplicate update id: ${u.id}`);
    }
    updateMap.set(u.id, u);
  }

  for (let id = 1; id <= 200; id++) {
    if (!updateMap.has(id)) {
      throw new Error(`Missing update for item id ${id}`);
    }
  }

  const raw = await readFile(dataPath, 'utf8');
  const data = JSON.parse(raw);

  let updatedCount = 0;
  for (const item of data.items) {
    const update = updateMap.get(item.id);
    if (update) {
      item.summary = update.summary;
      item.deepDive = update.deepDive;
      item.quote = update.quote;
      item.practicalTakeaway = update.practicalTakeaway;
      updatedCount++;
    }
  }
  console.log(`Successfully updated ${updatedCount} items in data.json.`);

  // Update quotes array in data.json to match plain-English style
  data.quotes = [
    {
      id: 1,
      theme: 'Linguistic Gems of Quranic Rhetoric',
      quote: "The Qur'an does not use word order and grammar randomly. Every choice can help communicate the meaning.",
      source: 'Reflections on Classical Arabic Eloquence',
    },
    {
      id: 2,
      theme: 'The Psychology of Sincerity',
      quote:
        'Sincerity is not the absence of wandering thoughts; it is the constant, courageous decision to pull your heart back to God every time the world distracts you.',
      source: 'Gems of Spiritual Purification',
    },
    {
      id: 3,
      theme: 'Rhetoric of Divine Mercy',
      quote:
        "Intensive names like Al-Ghaffar remind us that no matter how often we slip, God's forgiveness is ready every time we turn back to Him.",
      source: 'Linguistic Insights on Divine Names',
    },
    {
      id: 4,
      theme: 'Historical Depth of Revelation',
      quote:
        "The Qur'an was revealed into real human struggles and everyday questions, proving that divine guidance works in the real world.",
      source: 'Historical Analysis of Revelation',
    },
    {
      id: 5,
      theme: 'The Architecture of Patience',
      quote:
        'Patience is not suffering in bitter silence; it is keeping your dignity and doing what is right while trusting God through hard times.',
      source: 'Thematic Quranic Reflections',
    },
    {
      id: 6,
      theme: 'Acoustic Imagery of Revelation',
      quote:
        "The sound and rhythm of the Qur'an naturally echo its meaning, bringing a feeling of awe during warnings and tranquil calm during verses of mercy.",
      source: 'Phonetic Analysis of Sacred Text',
    },
    {
      id: 7,
      theme: 'The Living Dialogue of Al-Fatihah',
      quote:
        'In Surah Al-Fatihah, shifting from talking about God to speaking directly to Him turns prayer into a direct, personal conversation with your Creator.',
      source: 'Syntactic Gems of the Opening Surah',
    },
    {
      id: 8,
      theme: 'The Paradox of True Freedom',
      quote: 'True freedom comes from bowing to the Creator rather than being controlled by selfish impulses and worldly pressure.',
      source: 'Philosophical Inquiries on Monotheism',
    },
  ];

  const problems = validateData(data);
  if (problems.length > 0) {
    console.error('Validation errors found:');
    for (const p of problems) console.error(' - ' + p);
    process.exit(1);
  }

  await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Successfully wrote updated data to src/data/data.json.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
