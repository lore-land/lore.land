#!/usr/bin/env node
// @ts-check
/**
 * texture-finds-build.mjs — the maker's scanned folios and panels, as texture.website pieces lore.land can point at
 * (npm run texture:finds:build → book/content/packs/texture.website/@spwashi/folios.json).
 *
 * The pieces live at spwashi.com, where they were made. This reads the archive's own sidecars as
 * published (spwashi.com's origin/main, never its working tree) and keeps a piece only if
 *   a. its picture files are tracked on that branch, so the URLs below answer;
 *   b. a spwashi.com page already shows it, so nothing is surfaced here first;
 *   c. nothing in its title, alt, tags, handles or question names the figure under the hat or lines
 *      about schooling (the rule texture:mine and the worktable keep).
 * For each kept piece it works out what it answers in lore.land, from lore.land's own data: the rooms
 * (chapter JSON, read through planRooms), the tropes (tropes.json), the motifs mined from the archive
 * (texture.website findings), the worktable's hand placements, and the places where a folio is glassed
 * in the story (.spw/surfaces/folios.spw). Nothing is copied: every picture URL is spwashi.com's.
 *
 * The archive is found at SPWASHI_COM, or beside the home folder as texture:mine finds it. When it is not
 * there this exits 1 and the committed JSON stands. Output is deterministic: the same branch gives the
 * same file, so a diff means the archive changed.
 *
 *   --check-live  HEAD three of the URLs (public pictures; nothing but the request line is sent)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRooms } from '../modules/chapter-render.mjs';
import { HELD_TERMS as HELD } from '../modules/texture-finds.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SPWASHI = process.env.SPWASHI_COM || resolve(homedir(), 'air/spwashi.com');
const SITE = 'https://spwashi.com';
const BRANCH = 'origin/main';
const OUT = resolve(ROOT, 'book/content/packs/texture.website/@spwashi/folios.json');
const DIRS = Object.freeze({ folio: 'public/images/assets/folios', panel: 'public/images/assets/panels' });

/** @param {string[]} args */
const git = (...args) => execFileSync('git', ['-C', SPWASHI, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

if (!existsSync(resolve(SPWASHI, '.git'))) {
  console.error(`[texture:finds] spwashi.com is not at ${SPWASHI} (set SPWASHI_COM); the committed pieces stand.`);
  process.exit(1);
}
let head = '';
try { head = git('rev-parse', '--short', BRANCH).trim(); } catch {
  console.error(`[texture:finds] spwashi.com has no ${BRANCH} to read; the committed pieces stand.`);
  process.exit(1);
}

/* ─── What is published: every path and blob on the branch ─────────────── */
/** @type {Map<string, string>} path → blob sha */
const tree = new Map();
for (const line of git('ls-tree', '-r', BRANCH).split('\n')) {
  const m = /^\d+ blob ([0-9a-f]+)\t(.+)$/.exec(line);
  if (m) tree.set(m[2], m[1]);
}

/** Read many blobs at once. @param {string[]} paths @returns {Map<string, string>} */
function readBlobs(paths) {
  const shas = paths.map((p) => tree.get(p)).filter(Boolean);
  const out = execFileSync('git', ['-C', SPWASHI, 'cat-file', '--batch'], { input: `${shas.join('\n')}\n`, maxBuffer: 1 << 30 });
  /** @type {Map<string, string>} */
  const bySha = new Map();
  let at = 0;
  while (at < out.length) {
    const nl = out.indexOf(10, at);
    if (nl < 0) break;
    const [sha, , size] = out.subarray(at, nl).toString('utf8').split(' ');
    const n = Number(size);
    bySha.set(sha, out.subarray(nl + 1, nl + 1 + n).toString('utf8'));
    at = nl + 1 + n + 1;
  }
  /** @type {Map<string, string>} */
  const byPath = new Map();
  for (const p of paths) { const sha = tree.get(p); if (sha && bySha.has(sha)) byPath.set(p, /** @type {string} */ (bySha.get(sha))); }
  return byPath;
}

const htmlPaths = [...tree.keys()].filter((p) => p.endsWith('.html') && !p.startsWith('dist') && !p.includes('node_modules')).sort();
const pages = readBlobs(htmlPaths);
/** '/design/folios/index.html' → '/design/folios/'. @param {string} p */
const pageUrl = (p) => `/${p.replace(/(^|\/)index\.html$/, '$1')}`;

const daysPath = 'public/data/folio-days.json';
const days = JSON.parse(readBlobs([daysPath]).get(daysPath) || '{"pieces":[]}');
/** @type {Map<string, { href: string, opens: string | null }>} */
const dayOf = new Map(days.pieces.map((/** @type {any} */ p) => [p.id, { href: String(p.href || ''), opens: p.opens || null }]));

/* ─── The sidecars ─────────────────────────────────────────────────────── */
/** @param {string} text @param {RegExp} re */
const pick = (text, re) => (re.exec(text) || [])[1] || '';
/** @param {string} text @param {string} key */
const list = (text, key) => (new RegExp(`${key}: \\[([^\\]]*)\\]`).exec(text)?.[1] || '').match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) || [];

/**
 * @typedef {{ kind: string, id: string, label: string, href?: string, why?: string[] }} Resonance
 * @typedef {{ id: string, slug: string, kind: 'folio' | 'panel', title: string, alt: string, asks: string | null, tags: string[],
 *   handles: string[], sigils: string[], scan: { width: number, height: number, orientation: string }, set: string,
 *   tiers: Record<string, { width: number, height: number, avif?: string, webp?: string }>, shown_at: string,
 *   resonance: Resonance[] }} Piece
 */
/** @type {Piece[]} */
const pieces = [];
/** @type {{ id: string, why: string }[]} */
const excluded = [];
const sidecars = [...tree.keys()].filter((p) => (p.startsWith(`${DIRS.folio}/`) || p.startsWith(`${DIRS.panel}/`)) && p.endsWith('.spw')).sort();
const sidecarText = readBlobs(sidecars);

for (const path of sidecars) {
  const text = sidecarText.get(path) || '';
  const kind = path.startsWith(DIRS.panel) ? 'panel' : 'folio';
  const dir = kind === 'panel' ? DIRS.panel : DIRS.folio;
  const slug = pick(text, /whimsy_name: "([^"]+)"/) || path.split('/').pop()?.replace(/\.spw$/, '') || '';
  const id = pick(text, /\bid: "([^"]+)"/);
  const title = pick(text, /title: "([^"]+)"/);
  const alt = pick(text, /alt_text: "([^"]+)"/);
  const tags = list(text, 'tags');
  const handles = list(text, 'handles');
  const day = dayOf.get(id);
  const opens = pick(text, /opens: `\?([^`]*)`/) || (day?.opens ? String(day.opens).replace(/^\?/, '') : '');
  const said = [slug, title, alt, pick(text, /description: "([^"]+)"/), tags.join(' '), handles.join(' '), opens].join(' ');
  if (!id || !title) { excluded.push({ id: slug, why: 'sidecar has no id or title' }); continue; }
  if (!alt) { excluded.push({ id, why: 'no alt text to show it by' }); continue; }
  const held = HELD.exec(said);
  if (held) { excluded.push({ id, why: `kept on the maker's side (${held[0].toLowerCase().includes('school') || /college|classroom|teacher|grade/i.test(held[0]) ? 'schooling' : 'the figure under the hat'})` }); continue; }

  // a. the pictures are published
  const formats = list(text, 'formats_available');
  /** @type {Piece['tiers']} */
  const tiers = {};
  for (const tier of ['thumb', 'display', 'hero']) {
    const m = new RegExp(`${tier}: \\{ width: (\\d+), height: (\\d+)`).exec(text);
    if (!m) continue;
    /** @type {{ width: number, height: number, avif?: string, webp?: string }} */
    const t = { width: Number(m[1]), height: Number(m[2]) };
    for (const fmt of ['avif', 'webp']) {
      const file = `${dir}/${slug}-${tier}.${fmt}`;
      if ((!formats.length || formats.includes(fmt)) && tree.has(file)) t[/** @type {'avif' | 'webp'} */ (fmt)] = `${SITE}/${file}`;
    }
    if (t.webp || t.avif) tiers[tier] = t;
  }
  if (!tiers.thumb?.webp || !tiers.display?.webp) { excluded.push({ id, why: 'its thumb or display picture is not published' }); continue; }

  // b. a spwashi.com page already shows it: the archive's own page first, then any page that names it
  const own = day?.href ? day.href.split('#')[0] : '';
  const ownPath = own ? `${own.replace(/^\//, '')}${own.endsWith('/') ? 'index.html' : ''}` : '';
  let shown = ownPath && pages.get(ownPath)?.includes(slug) ? `${SITE}${day?.href}` : '';
  if (!shown) {
    const found = htmlPaths.filter((p) => pages.get(p)?.includes(`${slug}-`)).sort((x, y) => Number(!x.startsWith('design/folios')) - Number(!y.startsWith('design/folios')) || x.localeCompare(y))[0];
    if (found) shown = `${SITE}${pageUrl(found)}`;
  }
  if (!shown) { excluded.push({ id, why: 'no spwashi.com page shows it yet' }); continue; }

  const scanM = /scan: \{ width: (\d+), height: (\d+)[^}]*orientation: "(\w+)"/.exec(text);
  pieces.push({
    id, slug, kind, title, alt,
    asks: opens ? `${opens.replace(/\?+$/, '')}?` : null,
    tags: tags.filter((t) => !/^(folio|panel|release-)/.test(t)),
    handles,
    sigils: [...new Set(handles.map((h) => h[0]).filter((c) => '~&!?^#.=*%$@'.includes(c)))].sort(),
    scan: { width: Number(scanM?.[1] || 0), height: Number(scanM?.[2] || 0), orientation: scanM?.[3] || (Number(scanM?.[1]) > Number(scanM?.[2]) ? 'landscape' : 'portrait') },
    set: pick(text, /part_of: "([^"]+)"/) || pick(text, /record: ~"[^"]*\/([^"/]+)\.spw"/),
    tiers,
    shown_at: shown,
    resonance: []
  });
}

/* ─── lore.land's side: rooms, tropes, motifs, hand placements, glassing places ─── */
const STOP = new Set(`a an the and or of in on at to from into onto over under with without beside between through across about above below
  behind before after its it is are was be been this that these those his her their there here then than as by for not no yes one two three four
  five six seven eight nine ten each every some any all more most less very just only also out up down off again still once
  page pages paper folio folios panel panels laminated laminate scan scanned paint painted painting ink inked wash washed lettered letter letters
  lettering read reads reading card cards tile tiles strip strips cutout cutouts hand drawn draw drawing sketch sketches pencil pen marker canvas
  graph ruled grid sheet glyph glyphs mark marks label labels labeled labelled shape shapes line lines word words text note notes taped tape
  white black blue green red yellow gold golden pink teal mauve plum violet lilac lavender magenta rust orange grey gray brown ochre olive sage
  cream pale dark light bright deep soft faint dense thick thin small large big little tiny long short wide narrow full half
  front back left right top bottom side middle centre center corner edge around near far
  something someone nobody everyone thing things way ways kind make made makes like look looks set sets field ground figure figures face
  what which who whom whose why how where when would could should shall will can does did doe have has had get got goes going go say says
  you your yours i me my mine we our us they them he him she hers want wants show shows turn turns new old next first last`.split(/\s+/).filter(Boolean));
/** @param {string} w */
const singular = (w) => (w.length > 4 && w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 4 && /(?:sh|ch|x|ss)es$/.test(w) ? w.slice(0, -2) : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
/** @param {string} text @returns {string[]} */
const words = (text) => String(text || '').toLowerCase().replace(/’/g, "'").replace(/'s\b/g, '').split(/[^a-z]+/).map(singular).filter((w) => w.length >= 3 && !STOP.has(w));

const chapterFiles = readdirSync(resolve(ROOT, 'book/content/chapters')).filter((f) => /^\d\d\.json$/.test(f)).sort();
/** @type {{ key: string, chapter: number, label: string, place: string, op: string, href: string, title: string, weights: Map<string, number> }[]} */
const rooms = [];
for (const file of chapterFiles) {
  const data = JSON.parse(readFileSync(resolve(ROOT, 'book/content/chapters', file), 'utf8'));
  planRooms(data).forEach((/** @type {any} */ room) => {
    if (!room?.reading || room.drafting) return;
    const nn = String(data.chapterNumber).padStart(2, '0');
    /** @type {Map<string, number>} */
    const weights = new Map();
    const add = (/** @type {string} */ text, /** @type {number} */ w) => words(text).forEach((t) => weights.set(t, Math.max(weights.get(t) || 0, w)));
    add(room.air, 1);
    add(room.title, 2);
    add(room.reading.place, 3);
    rooms.push({ key: `${nn}:${room.reading.label}`, chapter: Number(data.chapterNumber), label: room.reading.label, place: room.reading.place, op: room.reading.op, href: `/book/chapter/${nn}/#${room.id}`, title: room.title, weights });
  });
}

const tropeData = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/tropes.json'), 'utf8')).tropes;
/** The figure's own trope is never computed toward: a folio is not evidence about the figure. */
const UNMATCHED_TROPES = new Set(['plain-lines']);
const tropes = tropeData.filter((/** @type {any} */ t) => !UNMATCHED_TROPES.has(t.id)).map((/** @type {any} */ t) => {
  /** @type {Map<string, number>} */
  const weights = new Map();
  const add = (/** @type {string} */ text, /** @type {number} */ w) => words(text).forEach((x) => weights.set(x, Math.max(weights.get(x) || 0, w)));
  add((t.bends || []).join(' '), 1);
  add([t.name, ...(t.aliases || []), t.id.replace(/-/g, ' ')].join(' '), 2);
  add(t.prop, 3);
  return { id: t.id, name: t.name, sigil: t.sigil, weights };
});
/** chapter → the tropes whose faces stand in it (for a room that knows only its chapter). */
/** @type {Record<string, string[]>} */
const tropesByChapter = {};
for (const t of tropeData) {
  for (const face of Object.values(t.faces || {})) {
    for (const ch of /** @type {any} */ (face).chambers || []) (tropesByChapter[ch] ||= []).includes(t.id) || tropesByChapter[ch].push(t.id);
  }
}
Object.values(tropesByChapter).forEach((ids) => ids.sort());

const findings = JSON.parse(readFileSync(resolve(ROOT, 'book/content/packs/texture.website/@spwashi/findings.json'), 'utf8'));
/** @type {Map<string, { handle: string, words: string, kind: string }[]>} piece id → motifs */
const motifsOf = new Map();
for (const m of findings.motifs) for (const p of m.pieces) (motifsOf.get(p.id) || motifsOf.set(p.id, []).get(p.id))?.push({ handle: m.handle, words: m.words, kind: m.kind });

const worktable = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/worktable.json'), 'utf8'));
/** @type {Map<string, { href: string, label: string }>} */
const nearOf = new Map(worktable.pieces.filter((/** @type {any} */ p) => p.near).map((/** @type {any} */ p) => [p.id, p.near]));

const foliosSpw = readFileSync(resolve(ROOT, '.spw/surfaces/folios.spw'), 'utf8');
const glassChapters = [...new Set([...foliosSpw.matchAll(/chapters\/(\d\d)\.json/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);

/* ─── Resonance ────────────────────────────────────────────────────────── */
/** A word most rooms share says little about any one of them. */
/** @type {Map<string, number>} */
const roomsWith = new Map();
rooms.forEach((room) => room.weights.forEach((_, w) => roomsWith.set(w, (roomsWith.get(w) || 0) + 1)));
/** @param {string} w */
const rarity = (w) => { const n = roomsWith.get(w) || 0; return n <= 2 ? 1.2 : n <= 6 ? 1 : 0.5; };
const ROOM_FLOOR = 3;
const TROPE_FLOOR = 3;
for (const piece of pieces) {
  const own = new Set(words([piece.title, piece.alt, piece.tags.join(' '), piece.handles.join(' ').replace(/[~&!?^#.=*%$@_]/g, ' '), piece.asks || ''].join(' ')));
  /** @type {Resonance[]} */
  const res = [];
  const near = nearOf.get(piece.id);
  if (near) res.push({ kind: 'near', id: near.href, label: near.label, href: near.href });
  const roomHits = rooms.map((room) => {
    const why = [...own].filter((w) => room.weights.has(w));
    const score = why.reduce((s, w) => s + (room.weights.get(w) || 0) * rarity(w), 0) + (why.length && piece.sigils.includes(room.op) ? 0.5 : 0);
    return { room, why, score };
  }).filter((h) => h.score >= ROOM_FLOOR).sort((a, b) => b.score - a.score || a.room.key.localeCompare(b.room.key)).slice(0, 3);
  roomHits.forEach(({ room, why }) => res.push({ kind: 'room', id: room.key, label: `the ${room.place}, Chapter ${room.chapter}`, href: room.href, why: why.sort() }));
  const tropeHits = tropes.map((/** @type {any} */ t) => {
    const why = [...own].filter((w) => t.weights.has(w));
    return { t, why, score: why.reduce((s, w) => s + (t.weights.get(w) || 0), 0) };
  }).filter((/** @type {any} */ h) => h.score >= TROPE_FLOOR).sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score || a.t.id.localeCompare(b.t.id)).slice(0, 2);
  tropeHits.forEach((/** @type {any} */ { t, why }) => res.push({ kind: 'trope', id: t.id, label: t.name, why: why.sort() }));
  (motifsOf.get(piece.id) || []).slice(0, 4).forEach((m) => res.push({ kind: 'motif', id: m.handle, label: m.words }));
  piece.sigils.forEach((s) => res.push({ kind: 'sigil', id: s, label: s }));
  if (!res.some((r) => r.kind === 'room' || (r.kind === 'near' && String(r.href).startsWith('/book/chapter/')))) {
    glassChapters.forEach((ch) => res.push({ kind: 'glass', id: String(ch), label: `where a page is glassed, Chapter ${ch}`, href: `/book/chapter/${String(ch).padStart(2, '0')}/` }));
  }
  piece.resonance = res;
}

pieces.sort((a, b) => a.id.localeCompare(b.id));
excluded.sort((a, b) => a.id.localeCompare(b.id));
const counts = {
  folios: pieces.filter((p) => p.kind === 'folio').length,
  panels: pieces.filter((p) => p.kind === 'panel').length,
  excluded: excluded.length,
  with_room: pieces.filter((p) => p.resonance.some((r) => r.kind === 'room' || r.kind === 'near')).length,
  with_trope: pieces.filter((p) => p.resonance.some((r) => r.kind === 'trope')).length
};
const doc = {
  note: 'Pieces of texture.website: the maker\'s scanned folios and panels as lore.land finds them (book/scripts/tools/texture-finds-build.mjs; npm run texture:finds:build). Every picture lives at spwashi.com, where it was made and is already shown; lore.land points at it and never copies it. A piece is kept only if its pictures are published, a spwashi.com page shows it, and nothing in it names the figure under the hat or schooling. resonance says what each answers in lore.land, worked out from lore.land\'s own rooms, tropes, mined motifs and the worktable\'s hand placements; it is a hint toward wonder, never a reading of the piece.',
  source: { archive: `${SITE}/design/folios/`, branch: BRANCH, commit: head },
  counts,
  chapters: Object.fromEntries(Object.entries(tropesByChapter).sort(([a], [b]) => Number(a) - Number(b))),
  glass: glassChapters,
  pieces,
  // Only how many, and why in plain words: an id beside a held reason would point at what is held.
  excluded: Object.entries(excluded.reduce((/** @type {Record<string, number>} */ acc, e) => { const why = /maker's side/.test(e.why) ? "kept on the maker's side" : e.why; acc[why] = (acc[why] || 0) + 1; return acc; }, {})).map(([why, count]) => ({ why, count }))
};
writeFileSync(OUT, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`[texture:finds] ${counts.folios} folios and ${counts.panels} panels from spwashi.com ${BRANCH} ${head}; ${counts.excluded} left on the maker's side · ${counts.with_room} answer a room, ${counts.with_trope} a trope → ${OUT.replace(`${ROOT}/`, '')}`);
const whyCounts = excluded.reduce((/** @type {Record<string, number>} */ acc, e) => { acc[e.why] = (acc[e.why] || 0) + 1; return acc; }, {});
Object.entries(whyCounts).forEach(([why, n]) => console.log(`  ${n} × ${why}`));

if (process.argv.includes('--check-live')) {
  const sample = [pieces[0], pieces[Math.floor(pieces.length / 2)], pieces[pieces.length - 1]].filter(Boolean).map((p) => p.tiers.thumb.webp || '');
  for (const url of sample) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      console.log(`  ${r.status} ${r.headers.get('content-type') || ''} ${url}`);
    } catch (error) {
      console.log(`  unreachable ${url}: ${/** @type {Error} */ (error).message}`);
    }
  }
}
