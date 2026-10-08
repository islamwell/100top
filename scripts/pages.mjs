// Static HTML pages for search engines, link previews and no-JS readers.
import { escapeHtml as e, pad3, verseKey } from '../src/js/util.js';
import { splitRoot } from '../src/js/templates.js';

function layout({ title, description, path, body, ctx, jsonLd }) {
  const url = `${ctx.siteUrl}/${path}`;
  return `<!doctype html>
<html lang="en" data-theme="emerald" data-arabic-scale="md">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${e(url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="100Top Islam &amp; Quran">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${e(url)}">
  <meta property="og:image" content="${e(ctx.siteUrl)}/assets/icons/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#050f0d">
  <link rel="icon" href="../../assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="../../assets/icons/apple-touch-icon.png">
  <script src="../../js/boot.js?v=${ctx.cssHref.split('?v=')[1]}"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../${ctx.cssHref}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body class="static-page">
  <div class="app-container">
    <header class="navbar"><div class="nav-content">
      <a href="../../" class="brand-logo"><span class="brand-name"><span><span class="gradient-text-gold">100Top</span><span class="brand-word">Islam</span></span><span class="brand-tagline">The Living Matrix</span></span></a>
    </div></header>
    <main class="main-content static-main" id="main-content">
${body}
    </main>
    <footer class="master-footer"><div class="footer-content"><div class="footer-bottom">
      <p>© 2026 100Top Islam &amp; Quran · v${e(ctx.version)} (updated ${e(ctx.buildDate)}) · English translation: ${e(ctx.data.translation || '')}</p>
      <ul class="footer-links"><li><a href="../../">Home</a></li><li><a href="../../sitemap.xml">Sitemap</a></li></ul>
    </div></div></footer>
  </div>
</body>
</html>
`;
}

function verseHtml(verse) {
  return `<figure class="card-verse-box detail-verse">
        <figcaption class="card-verse-ref">Surah ${e(verse.surahName)} (${e(verseKey(verse))})</figcaption>
        <blockquote class="modal-verse-arabic font-arabic" lang="ar" dir="rtl">${e(verse.textArabic)}</blockquote>
        <p class="card-verse-english">“${e(verse.textEnglish)}”</p>
      </figure>`;
}

export function renderItemPage(item, ctx) {
  const { items } = ctx.data;
  const pos = items.findIndex((i) => i.id === item.id);
  const prev = items[(pos - 1 + items.length) % items.length];
  const next = items[(pos + 1) % items.length];
  const root = splitRoot(item.root);
  const body = `      <article class="static-article">
        <p class="detail-badges"><span class="card-id-badge">Dimension #${pad3(item.id)}</span> <span class="card-category-tag">${e(item.category)}</span></p>
        <p class="modal-arabic-title font-arabic" lang="ar" dir="rtl">${e(item.arabic)}</p>
        <h1 class="modal-title">${e(item.title)}</h1>
        <p class="card-root-box detail-root"><strong>Linguistic Root:</strong> <span lang="ar" dir="rtl" class="root-letters">${e(root.arabic)}</span>${root.gloss ? ` <span class="root-gloss">(${e(root.gloss)})</span>` : ''}</p>
        <section class="detail-panel"><h2 class="detail-kicker">Core Conceptual Overview</h2><p>${e(item.summary)}</p></section>
        ${verseHtml(item.verse)}
        <section class="detail-section"><h2 class="detail-heading">Deep Dive &amp; Significance</h2><p class="detail-body">${e(item.deepDive)}</p></section>
        <section class="detail-gem"><h2 class="detail-kicker">Linguistic &amp; Thematic Gem</h2><p class="detail-gem-text">“${e(item.quote)}”</p></section>
        <section class="detail-practice"><h2 class="detail-kicker">Daily Practical Application</h2><p>${e(item.practicalTakeaway)}</p></section>
        <ul class="detail-tags">${item.tags.map((t) => `<li>#${e(t)}</li>`).join('')}</ul>
        <p class="static-cta"><a class="hero-cta" href="../../#dim-${item.id}">Open in the interactive encyclopedia (with recitation)</a></p>
        <nav class="detail-nav" aria-label="Browse dimensions">
          <a class="btn-filter-toggle" href="../${prev.id}/">← ${e(prev.title)}</a>
          <a class="btn-filter-toggle" href="../${next.id}/">${e(next.title)} →</a>
        </nav>
      </article>`;
  return layout({
    title: `${item.title} (${item.arabic}) · 100Top Islam & Quran`,
    description: item.summary,
    path: `d/${item.id}/`,
    body,
    ctx,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: item.title,
      alternativeHeadline: item.arabic,
      description: item.summary,
      articleSection: item.category,
      keywords: item.tags.join(', '),
      inLanguage: 'en',
      url: `${ctx.siteUrl}/d/${item.id}/`,
      isPartOf: { '@type': 'WebSite', name: '100Top Islam & Quran', url: `${ctx.siteUrl}/` },
    },
  });
}

export function renderReservationPage(res, ctx) {
  const body = `      <article class="static-article">
        <p class="detail-badges"><span class="card-id-badge">Reservation ${res.id} of ${ctx.data.reservations.length}</span> <span class="card-category-tag">${e(res.category)}</span></p>
        <h1 class="modal-title">${e(res.title)}</h1>
        <div class="reservation-objection-box"><strong>The common reservation:</strong><p>“${e(res.reservation)}”</p></div>
        <div class="reservation-counter-text">${e(res.counterArgument)}</div>
        ${verseHtml(res.verse)}
        <div class="reservation-takeaway-banner"><p><strong>Key rational insight:</strong> ${e(res.keyTakeaway)}</p></div>
        <p class="static-cta"><a class="hero-cta" href="../../#res-${res.id}">Open in the interactive encyclopedia</a></p>
      </article>`;
  return layout({
    title: `${res.title} · Top ${ctx.data.reservations.length} Reservations · 100Top Islam`,
    description: res.summary || res.reservation,
    path: `r/${res.id}/`,
    body,
    ctx,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      mainEntity: {
        '@type': 'Question',
        name: res.title,
        text: res.reservation,
        answerCount: 1,
        acceptedAnswer: { '@type': 'Answer', text: res.counterArgument },
      },
    },
  });
}

export function renderSitemap(ctx, lastmod) {
  const urls = [
    `${ctx.siteUrl}/`,
    ...ctx.data.items.map((i) => `${ctx.siteUrl}/d/${i.id}/`),
    ...ctx.data.reservations.map((r) => `${ctx.siteUrl}/r/${r.id}/`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${e(u)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}
