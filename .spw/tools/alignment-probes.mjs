#!/usr/bin/env node
/**
 * Alignment probe kit — atelier phase 03.
 *
 * Runs the scriptable half of the five ledger probes
 * (.spw/state/alignment-ledger.spw#probes) as static checks and precipitates
 * a dated .spw audit for review:
 *
 *   canonical_mirror     — chapter .spw titles vs prose SoT JSON        (c001, lore-c003)
 *   share_parity         — OG/Twitter meta presence + title match      (c007, lore-c006)
 *   plate_weight         — og:image weight vs plate threshold          (AL-001)
 *   precache_existence   — sw.js precache list vs files on disk        (AL-002, lore-c005)
 *   reduced_motion_gates — motion CSS carries its calm cut             (c012, lore-c007)
 *   theme_parity         — ember/cosmos custom-property key symmetry   (theme-flash probe)
 *
 * Visual probes (baseline overlay, live theme-switch flash, print fold) stay
 * manual; this kit records that honestly rather than simulating them.
 *
 * Usage: node .spw/tools/alignment-probes.mjs [--strict]
 *   --strict  exit 1 when any defect-class finding is present
 */

import fs from 'node:fs';
import path from 'node:path';
import { stateForFile } from './plates-manifest.mjs';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const now = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const OUTPUT = path.join(ROOT, '.spw', 'audits', `alignment-probes-${TODAY}.spw`);

const PLATE_MIN_BYTES = 100 * 1024; // atelier phase 02 verify threshold

const DOOR_PAGES = [
  'index.html',
  'topics/index.html',
  'scriptorium/index.html',
  'characters/boof.html',
  'world/civic-magic.html',
  'world/boonberry-commons.html',
  'zine/index.html'
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function listChapters() {
  return fs.readdirSync(path.join(ROOT, 'book', 'content', 'chapters'))
    .filter((name) => /^\d{2}\.json$/.test(name))
    .map((name) => name.slice(0, 2))
    .sort();
}

function meta(html, property) {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const reversed = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
    'i'
  );
  return (html.match(pattern) || html.match(reversed) || [])[1] || '';
}

const findings = [];
function file(probe, axis, cls, surface, evidence) {
  findings.push({ probe, axis, class: cls, surface, evidence });
}

/* ── canonical_mirror ───────────────────────────────────────────────────── */
function probeCanonicalMirror() {
  let checked = 0;
  for (const nn of listChapters()) {
    const jsonTitle = JSON.parse(read(`book/content/chapters/${nn}.json`)).title || '';
    const mirrorPath = `.spw/chapters/${nn}.spw`;
    checked += 1;
    if (!exists(mirrorPath)) {
      file('canonical_mirror', 'canonical', 'defect', mirrorPath, 'mirror file missing — run npm run spw:export');
      continue;
    }
    if (!read(mirrorPath).includes(jsonTitle)) {
      file('canonical_mirror', 'canonical', 'defect', mirrorPath,
        `mirror lags prose SoT — JSON title "${jsonTitle}" absent`);
    }
  }
  return { checked };
}

/* ── share_parity + plate_weight ────────────────────────────────────────── */
function probeShareParity() {
  const pages = [
    ...DOOR_PAGES,
    ...listChapters().map((nn) => `book/chapter/${nn}/index.html`)
  ].filter(exists);

  for (const page of pages) {
    const html = read(page);
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
    const ogTitle = meta(html, 'og:title');
    const ogDescription = meta(html, 'og:description');
    const ogImage = meta(html, 'og:image');
    const twitterCard = meta(html, 'twitter:card');

    for (const [label, value] of [
      ['og:title', ogTitle],
      ['og:description', ogDescription],
      ['og:image', ogImage],
      ['twitter:card', twitterCard]
    ]) {
      if (!value) {
        file('share_parity', 'material', 'defect', page, `${label} missing`);
      }
    }

    const titleStem = title.split('|')[0].trim();
    if (ogTitle && titleStem && !ogTitle.includes(titleStem)) {
      file('share_parity', 'linguistic', 'defect', page,
        `og:title "${ogTitle}" does not carry page title stem "${titleStem}"`);
    }

    if (ogImage) {
      const local = ogImage.replace(/^https?:\/\/[^/]+/, '').replace(/^\//, '');
      if (exists(local)) {
        const bytes = fs.statSync(path.join(ROOT, local)).size;
        if (bytes < PLATE_MIN_BYTES) {
          const state = stateForFile(local);
          const cls = state === 'public' ? 'defect' : 'review';
          file('plate_weight', 'material', cls, local,
            `${(bytes / 1024).toFixed(1)}KB plate behind "${titleStem}" — under ${PLATE_MIN_BYTES / 1024}KB threshold ` +
            `(atelier phase 02; plates-manifest state: ${state || 'unmanifested'})`);
        }
      } else if (!/^https?:/.test(ogImage) || ogImage.includes('lore.land')) {
        file('plate_weight', 'material', 'defect', page, `og:image points at missing file ${local}`);
      }
    }
  }
  return { checked: pages.length };
}

/* ── precache_existence ─────────────────────────────────────────────────── */
function probePrecacheExistence() {
  const sw = read('sw.js');
  const block = (sw.match(/cache\.addAll\(\[([\s\S]*?)\]\)/) || [])[1] || '';
  const entries = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const entry of entries) {
    const local = entry.split('?')[0].replace(/^\//, '');
    if (local && !exists(local)) {
      file('precache_existence', 'linguistic', 'defect', 'sw.js',
        `precache lists missing asset ${entry} — install will reject (lore-c005)`);
    }
  }
  const swVersion = (sw.match(/CACHE_VERSION\s*=\s*'[^']*v([\w.]+)'/) || [])[1] || '';
  const releaseToken = (read('book/scripts/modules/cache-context.mjs')
    .match(/DEFAULT_CACHE_RELEASE\s*=\s*'([^']+)'/) || [])[1] || '';
  if (swVersion && releaseToken && swVersion !== releaseToken) {
    file('precache_existence', 'canonical', 'defect', 'sw.js',
      `CACHE_VERSION ${swVersion} lags release token ${releaseToken} (workspace c006)`);
  }
  return { checked: entries.length + 1 };
}

/* ── reduced_motion_gates ───────────────────────────────────────────────── */
function probeReducedMotionGates() {
  const cssRoot = path.join(ROOT, 'book', 'styles');
  const cssFiles = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.css')) cssFiles.push(full);
    }
  })(cssRoot);

  let motionFiles = 0;
  for (const full of cssFiles) {
    // strip comments so prose mentioning @keyframes doesn't read as motion
    const css = fs.readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const usesMotion = /animation-timeline\s*:|@keyframes\s/.test(css);
    if (!usesMotion) continue;
    motionFiles += 1;
    if (!/prefers-reduced-motion/.test(css)) {
      file('reduced_motion_gates', 'temporal', 'defect', path.relative(ROOT, full),
        'declares animation without a prefers-reduced-motion gate in the same file — calm cut unverifiable (lore-c007)');
    }
  }
  return { checked: motionFiles };
}

/* ── theme_parity ───────────────────────────────────────────────────────── */
function probeThemeParity() {
  const css = read('book/styles/core/tokens.css');
  const block = (theme) => {
    const match = css.match(new RegExp(`html\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\}`));
    return new Set([...(match ? match[1] : '').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  };
  const ember = block('ember');
  const cosmos = block('cosmos');
  const onlyEmber = [...ember].filter((key) => !cosmos.has(key));
  const onlyCosmos = [...cosmos].filter((key) => !ember.has(key));
  for (const [theme, keys] of [['ember', onlyEmber], ['cosmos', onlyCosmos]]) {
    if (keys.length) {
      file('theme_parity', 'material', 'review', 'book/styles/core/tokens.css',
        `${theme}-only custom properties (${keys.join(', ')}) — other theme inherits base values; confirm intentional or a switch-flash seam`);
    }
  }
  return { checked: ember.size + cosmos.size };
}

/* ── attribute_parity ───────────────────────────────────────────────────── */
/* data-* attributes selected in CSS must have a setter somewhere — JS
 * (dataset.* / setAttribute / el() dataset blocks) or static HTML. An
 * unset-but-styled attribute is dead styling or a broken promise. */
const ATTRIBUTE_PARITY_ALLOW = new Set([
  // authoring vocabulary for prose annotation (motifs.css) — no content uses it
  // yet; declared intentional in ledger AL-010 rather than silently orphaned
  'data-motif',
  'data-trope',
  'data-foreshadow'
]);

function probeAttributeParity() {
  const cssAttrs = new Set();
  (function walkCss(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkCss(full);
      else if (entry.name.endsWith('.css')) {
        const css = fs.readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        for (const match of css.matchAll(/\[(data-[a-z0-9-]+)/g)) {
          cssAttrs.add(match[1]);
        }
      }
    }
  })(path.join(ROOT, 'book', 'styles'));

  const setters = new Set();
  const camelToKebab = (name) => `data-${name.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`)}`;
  (function walkJs(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkJs(full);
      else if (entry.name.endsWith('.mjs')) {
        const src = fs.readFileSync(full, 'utf8');
        for (const match of src.matchAll(/dataset\.([a-zA-Z]\w*)/g)) setters.add(camelToKebab(match[1]));
        for (const match of src.matchAll(/setAttribute\(\s*['"](data-[\w-]+)/g)) setters.add(match[1]);
        for (const block of src.matchAll(/dataset:\s*\{([^}]*)\}/g)) {
          for (const key of block[1].matchAll(/([a-zA-Z]\w*)\s*:/g)) setters.add(camelToKebab(key[1]));
        }
      }
    }
  })(path.join(ROOT, 'book', 'scripts'));

  const htmlPages = [
    ...DOOR_PAGES, 'book/templates/chapter.html', 'book/pwa/offline.html',
    ...listChapters().map((nn) => `book/chapter/${nn}/index.html`)
  ].filter(exists);
  for (const page of htmlPages) {
    for (const match of read(page).matchAll(/\s(data-[\w-]+)=/g)) setters.add(match[1]);
  }

  let orphanCount = 0;
  for (const attr of [...cssAttrs].sort()) {
    if (setters.has(attr) || ATTRIBUTE_PARITY_ALLOW.has(attr)) continue;
    // prefix match covers CSS selecting a name JS builds dynamically
    if ([...setters].some((s) => s.startsWith(attr) || attr.startsWith(s))) continue;
    orphanCount += 1;
    file('attribute_parity', 'canonical', 'defect', 'book/styles/**',
      `CSS selects [${attr}] but no JS or page sets it — dead styling or unwired behavior`);
  }
  return { checked: cssAttrs.size, orphans: orphanCount };
}

/* ── run + precipitate ──────────────────────────────────────────────────── */
const stats = {
  canonical_mirror: probeCanonicalMirror(),
  share_parity: probeShareParity(),
  precache_existence: probePrecacheExistence(),
  reduced_motion_gates: probeReducedMotionGates(),
  theme_parity: probeThemeParity(),
  attribute_parity: probeAttributeParity()
};

const defects = findings.filter((f) => f.class === 'defect');
const reviews = findings.filter((f) => f.class === 'review');

const byProbe = {};
for (const finding of findings) {
  (byProbe[finding.probe] = byProbe[finding.probe] || []).push(finding);
}

const lines = [];
lines.push('# Lore.Land Alignment Probe Run');
lines.push('# Generated by .spw/tools/alignment-probes.mjs — atelier phase 03 probe kit.');
lines.push('# Findings are ledger-ready: carry each surviving one into');
lines.push('# .spw/state/alignment-ledger.spw as defect (schedule) or intentional (record why).');
lines.push(`#>lore_land_alignment_probes_${TODAY.replace(/-/g, '_')}`);
lines.push('#:audit #!probe_run');
lines.push('#:layer #!pragmatics');
lines.push('');
lines.push('^meta{');
lines.push(`  ran: "${new Date().toISOString()}"`);
lines.push('  kit: ".spw/tools/alignment-probes.mjs (npm run spw:probes)"');
lines.push('  ledger: ".spw/state/alignment-ledger.spw"');
lines.push('  scope: "static half of the five ledger probes — visual probes remain manual"');
lines.push('  manual_probes_not_run: [');
lines.push('    "baseline overlay at 320 / 768 / 1120 / 1440"');
lines.push('    "live theme-switch flash (cosmos <-> ember intermediate frame)"');
lines.push('    "print fold parity (zine + chapter print CSS)"');
lines.push('  ]');
lines.push('}');
lines.push('');
lines.push('^summary{');
lines.push(`  defects: ${defects.length}`);
lines.push(`  reviews: ${reviews.length}`);
for (const [probe, stat] of Object.entries(stats)) {
  const count = (byProbe[probe] || []).length;
  lines.push(`  ${probe}: { checked: ${stat.checked}, findings: ${count} }`);
}
lines.push('}');
lines.push('');

for (const [probe, group] of Object.entries(byProbe)) {
  lines.push(`^probe["${probe}"]{`);
  group.forEach((finding, index) => {
    lines.push(`  ^finding[${String(index + 1).padStart(2, '0')}]{`);
    lines.push(`    axis: ${finding.axis}`);
    lines.push(`    class: ${finding.class}`);
    lines.push(`    surface: "${finding.surface}"`);
    lines.push(`    evidence: "${finding.evidence.replace(/"/g, "'")}"`);
    lines.push('  }');
  });
  lines.push('}');
  lines.push('');
}

if (!findings.length) {
  lines.push('.note: "all scriptable probes clean — only the manual visual probes remain"');
  lines.push('');
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, lines.join('\n'));

console.log(`[spw:probes] ${defects.length} defect, ${reviews.length} review finding(s) → ${path.relative(ROOT, OUTPUT)}`);
for (const finding of findings) {
  console.log(`  [${finding.class}] ${finding.probe} :: ${finding.surface} — ${finding.evidence}`);
}

if (STRICT && defects.length) {
  process.exit(1);
}
