#!/usr/bin/env node
/**
 * mine-folios.mjs — read spwashi's folios for tropes and textures (npm run texture:mine).
 *
 * The folio archive (spwashi.com, SPWASHI_COM or ~/air/spwashi.com) tags each piece's held motifs with a ~ handle
 * (its sidecars' expression key: ~ held motif). This reads them across the archive and the primes, sorts each into
 * a texture (what a surface is made of: wash, scumble, drip, hatching), a figure (what is drawn: moon, cloud,
 * spiral, eye) or a saying (a lettered idea: movies are emotions, mostly it's vibes), and writes them as
 * candidates — each with the pieces it is found on, linked where they live on spwashi.com, never copied.
 * A candidate becomes a trope (tropes.json) or a texture by hand; this only finds them.
 *
 * Kept out, as the archive keeps them out of its own titles: anything naming WAPboy, and lines about schooling.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const SPWASHI = process.env.SPWASHI_COM || resolve(homedir(), 'air/spwashi.com');
const SITE = 'https://spwashi.com';
const OUT = resolve(ROOT, 'book/content/packs/texture.website/@spwashi/findings.json');
if (!existsSync(resolve(SPWASHI, 'public/data/folio-days.json'))) {
  console.error(`[texture:mine] spwashi.com is not at ${SPWASHI} (set SPWASHI_COM); the committed findings stand.`);
  process.exit(1);
}

const TEXTURE = /wash|scumble|weather|drip|splat|hatch|marbl|stripe|tile|contour|ledge|stain|swirl|grain|smear|blot|scribbl|crackle|glaze|laminat|lid|tape|wavy|block|ruled/;
const SAYING_MIN_WORDS = 3;
const OUT_OF_BOUNDS = /wapboy|school|college|classroom|teacher|grade/i;

const pieces = [];
const days = JSON.parse(readFileSync(resolve(SPWASHI, 'public/data/folio-days.json'), 'utf8'));
for (const p of days.pieces) pieces.push({ id: p.id, title: p.title, href: `${SITE}${p.href}`, thumb: p.thumb ? `${SITE}${p.thumb}` : null, handles: p.handles || [], alt: p.alt || '' });
// The primes: arrangements of lettered cutouts, each with its own sidecar.
const primesDir = resolve(SPWASHI, 'public/images/assets/primes');
if (existsSync(primesDir)) {
  for (const f of readdirSync(primesDir).filter((n) => n.endsWith('.spw'))) {
    const text = readFileSync(resolve(primesDir, f), 'utf8');
    const id = (text.match(/id: "([^"]+)"/) || [])[1];
    const title = (text.match(/title: "([^"]+)"/) || [])[1];
    const handles = ((text.match(/handles: \[([^\]]*)\]/) || [])[1] || '').match(/"([^"]+)"/g)?.map((h) => h.slice(1, -1)) || [];
    const slug = f.replace(/\.spw$/, '');
    // The October page anchors a prime by month-day and place: prime-2026-10-22-00 → #prime-1022-00.
    const anchor = id ? id.replace(/^prime-\d{4}-(\d{2})-(\d{2})-(\d+)$/, 'prime-$1$2-$3') : '';
    if (id && !pieces.some((p) => p.id === id)) pieces.push({ id, title, href: `${SITE}/design/folios/october-2026/#${anchor}`, thumb: `${SITE}/public/images/assets/primes/${slug}-thumb.webp`, handles, alt: '' });
  }
}

const motifs = new Map();
for (const piece of pieces) {
  if (OUT_OF_BOUNDS.test(`${piece.title} ${piece.alt}`)) continue;
  for (const handle of piece.handles) {
    if (!handle.startsWith('~') || OUT_OF_BOUNDS.test(handle)) continue;
    const name = handle.slice(1);
    const words = name.split(/[._-]+/).filter(Boolean);
    const kind = TEXTURE.test(name) ? 'texture' : words.length >= SAYING_MIN_WORDS ? 'saying' : 'figure';
    if (!motifs.has(name)) motifs.set(name, { handle, words: words.join(' '), kind, pieces: [] });
    if (!motifs.get(name).pieces.some((p) => p.id === piece.id)) motifs.get(name).pieces.push({ id: piece.id, title: piece.title, href: piece.href, thumb: piece.thumb });
  }
}
const list = [...motifs.values()].sort((a, b) => b.pieces.length - a.pieces.length || a.words.localeCompare(b.words));
const byKind = (k) => list.filter((m) => m.kind === k).length;
writeFileSync(OUT, `${JSON.stringify({
  note: 'Tropes and textures found in spwashi\'s folios (book/scripts/tools/texture/mine-folios.mjs): every ~ handle (a held motif) across the archive and the primes, sorted into textures, figures and sayings, each with the pieces it is on, linked where they live. Candidates: one becomes a trope (book/content/world/tropes.json) or a texture by hand, and says which piece it came from.',
  mined: new Date().toISOString().slice(0, 10),
  source: { archive: `${SITE}/design/folios/`, pieces: pieces.length },
  counts: { motifs: list.length, textures: byKind('texture'), figures: byKind('figure'), sayings: byKind('saying') },
  motifs: list.map((m) => ({ ...m, state: 'candidate' }))
}, null, 1)}\n`);
console.log(`[texture:mine] ${list.length} motifs from ${pieces.length} pieces · ${byKind('texture')} textures, ${byKind('figure')} figures, ${byKind('saying')} sayings → ${OUT.replace(`${ROOT}/`, '')}`);
