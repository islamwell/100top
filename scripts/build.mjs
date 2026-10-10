#!/usr/bin/env node
// Build: src/ → dist/
//  - stamps version/build id and cache-busting ?v= query strings
//  - inlines an SVG sprite containing only the Font Awesome icons in use
//  - validates data.json
//  - generates static, crawlable pages for every dimension and reservation + sitemap.xml/robots.txt
//  - injects the precache list into the service worker
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateData } from './validate-data.mjs';
import { renderItemPage, renderReservationPage, renderSitemap } from './pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');
const DIST = join(root, 'dist');
const ICONS_DIR = join(root, 'node_modules/@fortawesome/fontawesome-free/svgs');
const SITE_URL = (process.env.SITE_URL || 'https://100top-islam-quran.pages.dev').replace(/\/+$/, '');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name !== '.DS_Store') out.push(full);
  }
  return out;
}

const posix = (p) => p.split('\\').join('/');

async function main() {
  const started = Date.now();
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const srcFiles = await walk(SRC);

  // Build id = hash of every source file, so any change busts every cache.
  const hash = createHash('sha256');
  for (const file of srcFiles.sort()) {
    hash.update(posix(relative(SRC, file)));
    hash.update(await readFile(file));
  }
  hash.update(pkg.version);
  const BUILD_ID = hash.digest('hex').slice(0, 10);
  const pad2 = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const BUILD_DATE = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  const data = JSON.parse(await readFile(join(SRC, 'data/data.json'), 'utf8'));
  const problems = validateData(data);
  if (problems.length) {
    console.error(`data.json has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }

  await rm(DIST, { recursive: true, force: true });
  await cp(SRC, DIST, { recursive: true, filter: (p) => !p.endsWith('.DS_Store') });

  // ─── Icons ──────────────────────────────────────────────────────────────
  const iconNames = new Set();
  const htmlIconRe = /\{\{icon:([a-z0-9-]+)(?: ([a-z0-9 -]+))?\}\}/g;
  for (const file of srcFiles) {
    if (!/\.(js|html|mjs)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    for (const m of text.matchAll(/\bicon\(\s*'([a-z0-9-]+)'/g)) iconNames.add(m[1]);
    for (const m of text.matchAll(htmlIconRe)) iconNames.add(m[1]);
  }
  const symbols = [];
  for (const name of [...iconNames].sort()) {
    const regular = name.endsWith('-regular');
    const file = join(ICONS_DIR, regular ? 'regular' : 'solid', `${regular ? name.slice(0, -8) : name}.svg`);
    let svg;
    try {
      svg = await readFile(file, 'utf8');
    } catch {
      console.error(`Unknown icon "${name}" (expected ${relative(root, file)})`);
      process.exit(1);
    }
    const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
    const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join('');
    symbols.push(`<symbol id="i-${name}" viewBox="${viewBox}">${paths}</symbol>`);
  }
  const sprite = `<!-- Icons: Font Awesome Free (CC BY 4.0) https://fontawesome.com/license/free -->\n<svg xmlns="http://www.w3.org/2000/svg" class="icon-sprite" aria-hidden="true" focusable="false">${symbols.join('')}</svg>`;
  const iconHtml = (name, cls) =>
    `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

  // ─── Token replacement ──────────────────────────────────────────────────
  const tokens = (text) =>
    text
      .replaceAll('__VERSION__', pkg.version)
      .replaceAll('__BUILD_ID__', BUILD_ID)
      .replaceAll('__BUILD_DATE__', BUILD_DATE)
      .replaceAll('__SITE_URL__', SITE_URL);

  const distFiles = await walk(DIST);
  const jsFiles = distFiles.filter((f) => f.endsWith('.js'));
  for (const file of jsFiles) {
    let text = tokens(await readFile(file, 'utf8'));
    // Version relative ES module imports so immutable caching is safe.
    text = text.replace(/(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)'(\.\.?\/[^'?]+\.js)'/g, `$1'$2?v=${BUILD_ID}'`);
    await writeFile(file, text);
  }

  const indexPath = join(DIST, 'index.html');
  let index = tokens(await readFile(indexPath, 'utf8'));
  index = index.replace(htmlIconRe, (_, name, cls) => iconHtml(name, cls)).replace('<!-- ICON_SPRITE -->', sprite);
  await writeFile(indexPath, index);

  await writeFile(join(DIST, 'manifest.json'), tokens(await readFile(join(DIST, 'manifest.json'), 'utf8')));

  // ─── Static pages ───────────────────────────────────────────────────────
  const cssHref = `css/style.css?v=${BUILD_ID}`;
  const ctx = { data, siteUrl: SITE_URL, cssHref, version: pkg.version, buildDate: BUILD_DATE };
  for (const item of data.items) {
    const dir = join(DIST, 'd', String(item.id));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), renderItemPage(item, ctx));
  }
  for (const res of data.reservations) {
    const dir = join(DIST, 'r', String(res.id));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), renderReservationPage(res, ctx));
  }
  await writeFile(join(DIST, 'sitemap.xml'), renderSitemap(ctx, BUILD_DATE));
  await writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  // ─── Service worker precache ────────────────────────────────────────────
  const shell = [
    './',
    `css/style.css?v=${BUILD_ID}`,
    `data/data.json?v=${BUILD_ID}`,
    `manifest.json?v=${BUILD_ID}`,
    ...jsFiles.filter((f) => !f.endsWith('sw.js')).map((f) => `${posix(relative(DIST, f))}?v=${BUILD_ID}`),
    'assets/icons/favicon.svg',
    'assets/icons/icon-192.png',
    'assets/icons/icon-512.png',
  ];
  const swPath = join(DIST, 'sw.js');
  const sw = tokens(await readFile(swPath, 'utf8'));
  await writeFile(swPath, `self.__PRECACHE__ = ${JSON.stringify(shell.sort())};\n${sw}`);

  // Sanity: nothing unreplaced shipped.
  for (const file of await walk(DIST)) {
    if (!/\.(js|html|json|xml|txt)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    const leftover = text.match(/__(VERSION|BUILD_ID|BUILD_DATE|SITE_URL)__|\{\{icon:/);
    if (leftover) {
      console.error(`Unreplaced token ${leftover[0]} in ${relative(root, file)}`);
      process.exit(1);
    }
  }

  const size = (await stat(join(DIST, 'data/data.json'))).size;
  console.log(
    `Built v${pkg.version} (${BUILD_ID}) → dist/ in ${Date.now() - started} ms: ${iconNames.size} icons, ` +
      `${data.items.length + data.reservations.length} static pages, data ${(size / 1024).toFixed(0)} KB, site ${SITE_URL}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
