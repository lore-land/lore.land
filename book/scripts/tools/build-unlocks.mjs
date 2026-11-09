#!/usr/bin/env node
/**
 * build-unlocks.mjs — a landing page for each of the game's mechanics (npm run unlocks:build; chapters:build runs it).
 *
 * Reads .spw/runtime/mechanics.spw with the game's own reader (unlocks.mjs) and writes pie/unlocks/index.html and
 * pie/unlocks/<page>/index.html: what the mechanic does in one sentence, how it unlocks (its weights in words and
 * as Spw), what nobody loses, a link that tries it for a visit, and where the reader stands (unlocks-page.mjs fills
 * that in from what this browser keeps). Like the chapters, the pages are generated and carry the release's token.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMechanics, unlockWords, mechanicSpell } from '../modules/unlocks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const RELEASE = readFileSync(resolve(ROOT, 'book/scripts/modules/cache-context.mjs'), 'utf8').match(/DEFAULT_CACHE_RELEASE = '([^']+)'/)[1];
const OUT = resolve(ROOT, 'pie/unlocks');
const OG = 'https://lore.land/book/images/covers/lore-land-cover-v2-og.jpg';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const v = (path) => `${path}?v=${RELEASE}`;

function page({ title, description, canonical, main }) {
  return `<!DOCTYPE html>
<html lang="en" data-wonder="rich" data-lighting="raking" data-cache-release="${RELEASE}" data-cache-context="unlocks" data-theme="paper">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)} · Lore.Land</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#f3ede1">
  <link rel="canonical" href="${canonical}">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/book/pwa/icons/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/book/pwa/icons/icon-192.png" sizes="192x192">
  <link rel="apple-touch-icon" href="/book/pwa/icons/apple-touch-icon.png">
  <link rel="author" href="https://spwashi.com/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)} · Exactly One Pie">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${OG}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta property="og:image:alt" content="LORE . LAND in gold capitals over a dark teal lake at night; a bare sapling stands on a small island beneath a gold seed-bud sigil.">
  <meta property="og:site_name" content="Lore.Land">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)} · Exactly One Pie">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${OG}">
  <link rel="preload" href="/book/fonts/jetbrains-mono/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${v('/book/styles/core/fonts.css')}&ctx=canon:fonts">
  <link rel="stylesheet" href="${v('/book/styles/core/layers.css')}&ctx=canon:baseline">
  <link rel="stylesheet" href="${v('/book/styles/core/tokens.css')}&ctx=canon:baseline">
  <link rel="stylesheet" href="${v('/book/styles/core/themes.css')}&ctx=canon:baseline">
  <link rel="stylesheet" href="${v('/book/styles/core/reset.css')}&ctx=canon:baseline">
  <link rel="stylesheet" href="${v('/book/styles/core/typography.css')}&ctx=home:scene">
  <link rel="stylesheet" href="${v('/book/styles/home/hub.css')}&ctx=home:hub">
  <link rel="stylesheet" href="${v('/book/styles/components/interactive.css')}&ctx=canon:baseline">
  <link rel="stylesheet" href="${v('/book/styles/home/unlocks.css')}&ctx=unlocks:page">
  <script defer type="module" src="${v('/book/scripts/home/app.mjs')}"></script>
  <script defer type="module" src="${v('/book/scripts/home/unlocks-page.mjs')}"></script>
</head>
<body data-surface="monument" data-presence="threshold" data-current-scene="unlocks">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="hub-shell">
    <header class="hub-topbar">
      <a class="hub-mark" href="/">Lore.Land</a>
      <nav class="hub-nav" aria-label="Primary">
        <a href="/book/chapter/01/">Read</a>
        <a href="/#chambers">Chapters</a>
        <a href="/pie/">Play</a>
        <a href="/almanac/">Almanac</a>
        <a href="/scriptorium/">Scriptorium</a>
        <a href="/folios/">Folios</a>
        <a href="/zine/">Broadside</a>
        <a href="/world/civic-magic.html">The world</a>
      </nav>
    </header>

    <main id="main-content" class="hub-main unlocks-main">
${main}
    </main>

    <footer class="hub-footer">
      <p>Raised by <a href="https://spwashi.com/?from=lore.land" rel="noopener noreferrer">Spwashi</a> · the mechanics live in <a href="/.spw/runtime/mechanics.spw"><code>mechanics.spw</code></a></p>
      <p class="hub-footer-note">Story first · process in the grain · marks stay marked</p>
    </footer>
  </div>
</body>
</html>
`;
}

const { measures, mechanics } = readMechanics(readFileSync(resolve(ROOT, '.spw/runtime/mechanics.spw'), 'utf8'));
const list = Object.values(mechanics);
if (!list.length) { console.error('[unlocks:build] no mechanics read from .spw/runtime/mechanics.spw'); process.exit(1); }

const standingBlock = (m) => `        <div class="unlock-standing" data-unlock="${m.id}">
          <p class="unlock-standing-words" data-unlock-words>Where you stand shows here, from what this browser keeps.</p>
          <ul class="unlock-measures" data-unlock-measures>
${Object.entries(m.weigh).map(([k, w]) => `            <li data-measure="${k}"><span>${esc(measures[k]?.says || k)}</span> <b data-count>·</b> <span class="unlock-weight">× ${w}</span></li>`).join('\n')}
          </ul>
          <p class="unlock-meter" aria-hidden="true"><span data-unlock-meter></span></p>
        </div>`;

const others = (m) => list.filter((o) => o !== m).map((o) => `<li><a href="/pie/unlocks/${o.page}/">${esc(o.name)}</a> · ${esc(o.says)}</li>`).join('\n          ');

// The landing pages are written fresh each time: a mechanic taken out of the registry takes its page with it.
if (existsSync(OUT)) readdirSync(OUT, { withFileTypes: true }).filter((d) => d.isDirectory()).forEach((d) => { if (!list.some((m) => m.page === d.name)) rmSync(resolve(OUT, d.name), { recursive: true }); });
mkdirSync(OUT, { recursive: true });

list.forEach((m) => {
  const main = `      <section class="hub-hero unlock-hero" aria-labelledby="unlock-title">
        <p class="hub-eyebrow">Exactly One Pie · an unlock</p>
        <h1 id="unlock-title">${esc(m.name)}</h1>
        <p class="hub-lede">${esc(m.says)}</p>
        <p class="unlock-actions"><a class="unlock-try" href="/pie/?try=${m.page}">Try it for a visit</a> <a href="${esc(m.where || '/pie/')}">Where it lives in the game</a></p>
      </section>

      <section class="unlock-section" aria-labelledby="how-title">
        <h2 id="how-title">How it unlocks</h2>
        <p>${esc(unlockWords(m, measures))}. It all counts toward it, whatever order it comes in, and an unlock is kept once it is reached.</p>
        <pre class="unlock-spell"><code>${esc(mechanicSpell(m))}</code></pre>
${standingBlock(m)}
      </section>

      <section class="unlock-section" aria-labelledby="floor-title">
        <h2 id="floor-title">What nobody loses</h2>
        <p>${esc(m.floor)}</p>
        <p>A link that tries it opens it for that visit, for anyone. ${m.before === 'open' ? 'It was open to everyone before it was an unlock, so whoever had carried a pie by then keeps it.' : 'It is new: nobody had it before.'} No payment exists anywhere in the book.</p>
      </section>

      <section class="unlock-section" aria-labelledby="more-title">
        <h2 id="more-title">The other unlocks</h2>
        <ul class="unlock-others">
          ${others(m)}
        </ul>
        <p><a href="/pie/unlocks/">Every unlock</a> · <a href="/pie/">Play Exactly One Pie</a></p>
      </section>`;
  mkdirSync(resolve(OUT, m.page), { recursive: true });
  writeFileSync(resolve(OUT, m.page, 'index.html'), page({ title: m.name, description: `${m.says} ${unlockWords(m, measures)}.`, canonical: `https://lore.land/pie/unlocks/${m.page}/`, main }));
});

const index = `      <section class="hub-hero unlock-hero" aria-labelledby="unlock-title">
        <p class="hub-eyebrow">Exactly One Pie · unlocks</p>
        <h1 id="unlock-title">What the game unlocks</h1>
        <p class="hub-lede">A few mechanics, each one sentence long. They unlock by weight: rooms read, wonders kept, cards turned, rhythms found and carries finished each count toward them, reading most of all. Any of them can be tried for a visit from its page, and nothing anyone has is ever taken away.</p>
      </section>

      <section class="unlock-section" aria-labelledby="list-title">
        <h2 id="list-title" class="sr-only">The unlocks</h2>
        <ul class="unlock-cards">
${list.map((m) => `          <li class="unlock-card" data-unlock="${m.id}">
            <h3><a href="/pie/unlocks/${m.page}/">${esc(m.name)}</a></h3>
            <p>${esc(m.says)}</p>
            <p class="unlock-how">${esc(unlockWords(m, measures))}.</p>
            <p class="unlock-standing-words" data-unlock-words></p>
            <p class="unlock-meter" aria-hidden="true"><span data-unlock-meter></span></p>
          </li>`).join('\n')}
        </ul>
        <p><a href="/pie/">Play Exactly One Pie</a> · the mechanics are written in <a href="/.spw/runtime/mechanics.spw"><code>mechanics.spw</code></a></p>
      </section>`;
writeFileSync(resolve(OUT, 'index.html'), page({ title: 'Unlocks', description: 'The mechanics Exactly One Pie unlocks by weight: each one sentence, each with a page, each tried for a visit from a link.', canonical: 'https://lore.land/pie/unlocks/', main: index }));

// The sitemap's unlocks block, between its markers.
const SITEMAP = resolve(ROOT, 'sitemap.xml');
const map = readFileSync(SITEMAP, 'utf8');
const block = ['/pie/unlocks/', ...list.map((m) => `/pie/unlocks/${m.page}/`)]
  .map((path) => `  <url>\n    <loc>https://lore.land${path}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.4</priority>\n  </url>`).join('\n');
const nextMap = map.replace(/(  <!-- unlocks: written by build-unlocks\.mjs -->\n)[\s\S]*?(  <!-- \/unlocks -->)/, `$1${block}\n$2`);
if (nextMap !== map) writeFileSync(SITEMAP, nextMap);

// The game page's list, between its markers.
const PIE = resolve(ROOT, 'pie/index.html');
const pie = readFileSync(PIE, 'utf8');
const items = list.map((m) => `        <li><a href="/pie/unlocks/${m.page}/">${esc(m.name)}</a> · ${esc(m.says)}</li>`).join('\n');
const nextPie = pie.replace(/(        <!-- unlocks: written by build-unlocks\.mjs -->\n)[\s\S]*?(        <!-- \/unlocks -->)/, `$1${items}\n$2`);
if (nextPie !== pie) writeFileSync(PIE, nextPie);

console.log(`[unlocks:build] ${list.length} mechanics → pie/unlocks/ (${list.map((m) => m.page).join(', ')}) · release ${RELEASE}`);
