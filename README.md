# 100Top Islam & Quran: The Living Matrix

An interactive, offline-capable encyclopedia of **200 dimensions of Islam and the Quran** across 10 domains, with Arabic roots, verse
recitation, responses to 20 common reservations, a private reflection journal and spaced-repetition flashcards.

![Version](https://img.shields.io/badge/version-1.1.1-gold.svg) ![License](https://img.shields.io/badge/license-MIT-emerald.svg)

## Features

- **200 dimensions in 10 domains**: Arabic linguistics, Quranic sciences, theology, worship, tazkiyah, seerah, fiqh, civilization,
  daily life and cosmology. Each has the Arabic term, root, overview, deep dive, cited verse and a practical takeaway.
- **Search** across titles, tags, verses and surah names. Arabic works with or without diacritics, roots can be typed as
  `S-L-M` / `k t b`, and `#42` jumps to an item.
- **Recitation** of every cited verse from five reciters via EveryAyah. Multi-verse passages play through in order, with loop and
  continuous modes, speed and volume controls, and lock-screen controls through the Media Session API.
- **Top 20 reservations**, each with a response, a supporting verse and a permanent link (`/r/<id>/`).
- **Reflection journal** with 15 prompts. Notes autosave locally and never leave the device. Export as Markdown, or back up and
  restore bookmarks, notes and flashcard progress as JSON.
- **Flashcards** with Leitner spaced repetition (Again / Good / Easy), due/new/mastered stats, per-domain decks and a reverse mode.
- **Deep links** (`#dim-42`, `#res-3`, `#flashcards`), keyboard shortcuts (press `?`), three themes, and four Arabic text sizes.
- **PWA**: installable, and works offline after the first visit.
- **Crawlable**: a static HTML page for every dimension and reservation, plus `sitemap.xml` and Open Graph tags.

## Sources

- English translations: Saheeh International. Arabic text and translations are checked with `npm run verify:quran` against
  the [Quran.com API](https://api-docs.quran.com). Passages that span several verses record `ayahEnd`.
- Audio: [EveryAyah.com](https://everyayah.com). Uthmani font: King Fahd Complex, served by [Quran Foundation](https://quran.foundation).
- Icons: [Font Awesome Free](https://fontawesome.com/license/free) (CC BY 4.0), bundled at build time as an inline SVG sprite.

This is an educational overview, not a religious ruling. Consult qualified scholars on personal matters.

## Development

Requires Node 20+.

```bash
npm install
npm run preview        # build to dist/ and serve at http://localhost:8080
npm run check          # lint + unit tests + build
npm run verify:quran   # check every cited verse against Quran.com (network)
npm run icons          # regenerate PNG icons in src/assets/icons
```

| Path                 | Purpose                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/index.html`     | App shell (`{{icon:name}}` placeholders become SVG at build time)                                                             |
| `src/js/`            | ES modules: `main` (boot, tabs, routing), `catalog`, `detail`, `audio`, `flashcards`, `srs`, `journal`, `backup`, `search`, … |
| `src/data/data.json` | All content, checked by `scripts/validate-data.mjs` on every build                                                            |
| `src/sw.js`          | Service worker (precached app shell, cached fonts, network-first pages)                                                       |
| `scripts/build.mjs`  | Build `src/` into `dist/`: version stamping, cache-busting `?v=` hashes, icon sprite, static pages, sitemap                   |
| `tests/`             | Vitest unit tests                                                                                                             |

To add or edit content, change `src/data/data.json`, then run `npm run check` and `npm run verify:quran`.

## Deployment (Cloudflare Pages)

Set **Build command** to `npm run build` and **Build output directory** to `dist`, or deploy manually:

```bash
SITE_URL=https://your-domain.example npm run build
npx wrangler pages deploy dist --project-name 100top-islam-quran
```

`SITE_URL` sets the canonical, Open Graph and sitemap URLs (default: `https://100top-islam-quran.pages.dev`). Security headers,
including a strict Content-Security-Policy, and cache rules are in `src/_headers`.

## License

MIT. Educational, open-source project.
