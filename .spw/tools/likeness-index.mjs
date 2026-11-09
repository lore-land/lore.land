#!/usr/bin/env node
/**
 * likeness-index.mjs — every story thing's likeness, and what each is near
 * (book/scripts/modules/likeness.mjs; canon .spw/surfaces/likeness.spw).
 *
 * Reads the canon only — chapter JSON (rooms and their signatures, prose for
 * material and lean), palettes.json, almanac.json + semantic.json (wonders and
 * where they live), characters.mjs, pie-cards.mjs and the seed atlas
 * (home/seeds.mjs) — and writes book/content/world/likeness.json:
 *
 *   { note, dimensions, palettes, items: { id: item }, near: { id: [ids] } }
 *
 * `near` (eight per item, across kinds) is precomputed with the same scoring
 * the page uses (likeness.mjs nearest), so pages stay light and the build and
 * the page always agree. Nothing here reads any reader's behaviour.
 *
 *   npm run spw:likeness              write likeness.json
 *   npm run spw:likeness -- --verify  exit 1 if likeness.json or the palette mirror is stale
 *   npm run spw:likeness -- --thumbs  also (re)make the atlas thumbnails (needs ImageMagick)
 */
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERIFY = process.argv.includes('--verify');
const THUMBS = process.argv.includes('--thumbs');
const OUT = resolve(ROOT, 'book/content/world/likeness.json');
const mod = (path) => import(pathToFileURL(resolve(ROOT, path)).href);

const {
  DIMENSIONS, SET_VALENCE, PALETTE_COLORS_MIRROR, nearest, likenessOf, ATLAS_HREF
} = await mod('book/scripts/modules/likeness.mjs');
const { planRooms, resolveSlots, padChapterNumber } = await mod('book/scripts/modules/chapter-render.mjs');
const { materialScores, MATERIALS } = await mod('book/scripts/modules/materials.mjs');
const { leanFor } = await mod('book/scripts/modules/valence-lens.mjs');
const { CHARACTERS } = await mod('book/scripts/modules/characters.mjs');
const { CARDS } = await mod('book/scripts/home/pie-cards.mjs');
const { KIND_SIGIL } = await mod('book/scripts/modules/almanac.mjs');
const { seedManifest, chapterSeedMap } = await mod('book/scripts/home/seeds.mjs');

const json = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const pad = padChapterNumber;
const tally = (values) => values.filter(Boolean).reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {});
const top = (counts, order = []) => Object.keys(counts)
  .sort((a, b) => counts[b] - counts[a] || (order.indexOf(a) - order.indexOf(b)) || a.localeCompare(b))[0] || null;
const MATERIAL_ORDER = MATERIALS.map((m) => m.id);
const strongest = (scores) => {
  const best = top(Object.fromEntries(Object.entries(scores).filter(([, n]) => n > 0)), MATERIAL_ORDER);
  return best || null;
};

/* Room keepers who are people in the cast (characters.mjs). */
const KEEPER_CHARACTER = Object.freeze({ boof: 'boof', genie: 'genie', boonwap: 'boon', banewap: 'bane', bonewap: 'bonewap', the_porter: 'porter' });
/* Who a wonder or a card names, by the words the book uses for them. */
const MENTIONS = Object.freeze([
  ['boof', /\bBoof\b/],
  ['ants', /\btorch-ants?\b/i],
  ['genie', /\bGenie\b/],
  ['bane', /\bBaneWAP\b/],
  ['boon', /\bBoonWAP\b/],
  ['bonewap', /\bBoneWAP\b/],
  ['porter', /\bporter\b/i],
  ['clerk', /\bfeast clerk\b/i],
  ['figure', /\bplain lines\b/i],
  ['clown', /\bclowns?\b/i],
  ['mime', /\bmimes?\b/i]
]);
const mentions = (text) => MENTIONS.filter(([, pattern]) => pattern.test(text)).map(([id]) => id);

/* ─── Chapters and rooms ─────────────────────────────────────────────── */

const chapterFiles = (await readdir(resolve(ROOT, 'book/content/chapters'))).filter((f) => /^\d{2}\.json$/.test(f)).sort();
const chapters = await Promise.all(chapterFiles.map((f) => json(`book/content/chapters/${f}`)));
const palettesJson = (await json('book/content/world/palettes.json')).palettes;
const paletteOf = (chapter) => palettesJson.find((p) => p.chapter === chapter)?.id || null;

const paragraphsOf = (block) => {
  const out = [];
  const walk = (node) => (Array.isArray(node.content) ? node.content : []).forEach((item) => {
    if (item.type === 'paragraph') out.push({ text: `${resolveSlots(item)}${(item.children || []).map((k) => k.text || k.content || '').join('')}`, lean: item.lean });
    else if (Array.isArray(item.content)) walk(item);
  });
  walk(block);
  return out;
};

const items = {};
const add = (item) => {
  const clean = Object.fromEntries(Object.entries(item).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length && v !== item.characters)));
  items[item.id] = clean;
};
const roomsByAnchor = new Map();
const chapterStats = new Map();

for (const chapter of chapters) {
  const c = chapter.chapterNumber;
  const plan = planRooms(chapter);
  const stats = { materials: {}, leans: {}, kinds: {}, keepers: [] };
  chapter.sections.forEach((section, index) => {
    const room = plan[index];
    if (!room || !room.reading || room.drafting) return;
    const paragraphs = paragraphsOf(section);
    const prose = paragraphs.map((p) => p.text).join(' ');
    const scores = materialScores(prose);
    Object.entries(scores).forEach(([m, n]) => { stats.materials[m] = (stats.materials[m] || 0) + n; });
    const leans = tally(paragraphs.map((p) => leanFor(p.text, p.lean)));
    Object.entries(leans).forEach(([l, n]) => { stats.leans[l] = (stats.leans[l] || 0) + n; });
    stats.kinds[room.reading.kind] = (stats.kinds[room.reading.kind] || 0) + 1;
    const keeper = KEEPER_CHARACTER[room.reading.who] || null;
    if (keeper) stats.keepers.push(keeper);
    const title = room.title || `The ${room.reading.place}`;
    const item = {
      id: `room:${pad(c)}.${room.n}`,
      kind: 'room',
      title,
      href: `/book/chapter/${pad(c)}/#${room.id}`,
      chapter: c,
      sigil: room.reading.op,
      container: room.reading.kind,
      material: strongest(scores),
      palette: paletteOf(c),
      valence: top(leans, ['boon', 'bane', 'bone']),
      characters: keeper ? [keeper] : [],
      spw: room.reading.spw
    };
    add(item);
    roomsByAnchor.set(`${c}#${room.id}`, item);
  });
  chapterStats.set(c, {
    material: strongest(stats.materials),
    valence: top(stats.leans, ['boon', 'bane', 'bone']),
    container: top(stats.kinds, ['room', 'window', 'gathering', 'passage']),
    keepers: stats.keepers
  });
}
const rooms = Object.values(items).filter((i) => i.kind === 'room');

/* ─── Wonders ────────────────────────────────────────────────────────── */

const almanac = (await json('book/content/world/almanac.json')).wonders;
const semantic = await json('book/content/semantic.json');
for (const wonder of almanac) {
  const places = semantic.wonders?.[wonder.id] || [];
  const lives = [...new Set([wonder.home, ...(wonder.echoes || []), ...places.map((p) => p.c)].filter(Boolean))].sort((a, b) => a - b);
  const homePlace = places.find((p) => p.c === wonder.home) || places[0];
  const room = homePlace ? roomsByAnchor.get(`${homePlace.c}#${homePlace.id}`) : null;
  const chapter = wonder.home || homePlace?.c || null;
  const text = [wonder.name, wonder.note, (wonder.terms || []).join(' '), wonder.prompt?.hint].filter(Boolean).join(' ');
  add({
    id: `wonder:${wonder.id}`,
    kind: 'wonder',
    title: wonder.name,
    href: `/almanac/#wonder-${wonder.id}`,
    chapter,
    sigil: KIND_SIGIL[wonder.kind] || '#',
    container: room?.container || chapterStats.get(chapter)?.container || null,
    material: strongest(materialScores(text)) || room?.material || chapterStats.get(chapter)?.material || null,
    palette: paletteOf(chapter),
    valence: room?.valence || leanFor(text) || chapterStats.get(chapter)?.valence || null,
    characters: mentions(`${wonder.name} ${wonder.note}`),
    hint: wonder.hint,
    lives
  });
}

/* ─── The cast ───────────────────────────────────────────────────────── */

const VALENCE_OF = Object.freeze({ boon: 'boon', bane: 'bane', bonewap: 'bone' });
const PALETTE_OF = Object.freeze({ clown: 'clown-downtown', mime: 'mime-wash' });
for (const [id, person] of Object.entries(CHARACTERS)) {
  const kept = rooms.filter((r) => r.characters.includes(id));
  const first = person.first || null;
  add({
    id: `character:${id}`,
    kind: 'character',
    title: person.name,
    href: person.href,
    chapter: first,
    sigil: top(tally(kept.map((r) => r.sigil))) || '@',
    container: top(tally(kept.map((r) => r.container))) || (first ? chapterStats.get(first)?.container : 'gathering'),
    material: person.material,
    palette: PALETTE_OF[id] || paletteOf(first),
    valence: VALENCE_OF[id] || top(tally(kept.map((r) => r.valence))) || (first ? chapterStats.get(first)?.valence : null),
    characters: [id],
    card: person.card
  });
}

/* ─── Palettes ───────────────────────────────────────────────────────── */

for (const p of palettesJson) {
  const stats = p.chapter ? chapterStats.get(p.chapter) : null;
  add({
    id: `palette:${p.id}`,
    kind: 'palette',
    title: p.name,
    href: `/almanac/#palette-${p.id}`,
    chapter: p.chapter || null,
    sigil: '=',
    container: stats?.container || 'gathering',
    material: stats?.material || 'glass',
    palette: p.id,
    valence: stats?.valence || (p.id === 'mime-wash' ? 'bane' : null),
    characters: p.id === 'mime-wash' ? ['mime'] : []
  });
}

/* ─── Cards from the lanes (the cast's own cards are the cast) ───────── */

const CAST_CARDS = new Set([...Object.values(CHARACTERS).map((c) => c.card), 'wonder']);
const TYPE_SIGIL = Object.freeze({ character: '@', knock: '!', slip: '.', friend: '&', power: '^' });
const CARD_VALENCE = Object.freeze({ berry: 'boon', baneberry: 'bane', boneberry: 'bone', switch: 'bane', beaver: 'boon' });
for (const [kind, card] of Object.entries(CARDS)) {
  if (CAST_CARDS.has(kind)) continue;
  const text = `${card.name} ${card.story}`;
  const chapter = card.chapter || null;
  add({
    id: `card:${kind}`,
    kind: 'card',
    title: card.name,
    href: `/pie/#pie-deck`,
    chapter,
    sigil: TYPE_SIGIL[card.type] || '!',
    // The lanes are a passage: you go through, never stay.
    container: 'passage',
    material: strongest(materialScores(text)) || null,
    palette: paletteOf(chapter),
    valence: CARD_VALENCE[kind] || leanFor(text) || null,
    characters: mentions(text)
  });
}

/* ─── The seed atlas ─────────────────────────────────────────────────── */

/* Where a sigil is most at home: the chapter with the most rooms of that motion. */
const sigilHome = (sigil) => {
  const counts = tally(rooms.filter((r) => r.sigil === sigil).map((r) => String(r.chapter)));
  const best = top(counts, Object.keys(counts).sort((a, b) => a - b));
  return best ? Number(best) : null;
};
/* The spirit sequence ?~<#.>@(#.)&[#.]*{#.}^ opens a container after four motions; ^ binds the body upward. */
const SPIRIT_CONTAINER = Object.freeze({ '~': 'passage', '@': 'gathering', '&': 'window', '*': 'room', '^': 'room' });
const sigilContainer = (sigil) => SPIRIT_CONTAINER[sigil]
  || top(tally(rooms.filter((r) => r.sigil === sigil).map((r) => r.container)), ['room', 'window', 'gathering', 'passage'])
  || 'room';

const planted = new Map();
for (const [chapter, seed] of chapterSeedMap(chapters.length, '01')) {
  planted.set(seed.id, [...(planted.get(seed.id) || []), chapter]);
}
const thumbs = [];
for (const seed of seedManifest) {
  const dim = DIMENSIONS[seed.dimension];
  if (!dim) throw new Error(`likeness: seed dimension "${seed.dimension}" has no sigil in DIMENSIONS`);
  const plantedIn = planted.get(seed.id) || [];
  const chapter = plantedIn[0] || null;
  const home = chapter || sigilHome(dim.sigil);
  const thumbFile = resolve(ROOT, seed.thumb.replace(/^\//, ''));
  thumbs.push({ src: resolve(ROOT, seed.src.replace(/^\//, '')), out: thumbFile });
  add({
    id: seed.likeness,
    kind: 'seed',
    title: `${seed.label === 'Story Motif' ? 'The motif' : seed.label}, ${seed.setId === 'motif' ? 'a page study' : `set ${seed.setId}`}`,
    href: `${ATLAS_HREF}#${seed.anchor}`,
    chapter,
    chapters: plantedIn.length > 1 ? plantedIn : null,
    home: chapter ? null : home,
    sigil: dim.sigil,
    echo: dim.echo || null,
    container: sigilContainer(dim.sigil),
    material: dim.material,
    palette: paletteOf(home),
    valence: SET_VALENCE[seed.setId] || null,
    characters: [],
    img: seed.src,
    thumb: THUMBS || existsSync(thumbFile) ? seed.thumb : null,
    set: seed.setId,
    dimension: seed.dimension,
    adopt: seed.id
  });
}

/* ─── Near ───────────────────────────────────────────────────────────── */

const all = Object.values(items);
const near = Object.fromEntries(all.map((item) => [item.id, nearest(item, all, { n: 8 }).map((hit) => hit.item.id)]));

/* ─── Palette mirror ─────────────────────────────────────────────────── */

const palettes = Object.fromEntries(palettesJson.map((p) => [p.id, { name: p.name, chapter: p.chapter || null, colors: p.colors }]));
const drift = Object.entries(palettes).filter(([id, p]) => JSON.stringify(PALETTE_COLORS_MIRROR[id]) !== JSON.stringify(p)).map(([id]) => id);
Object.keys(PALETTE_COLORS_MIRROR).forEach((id) => { if (!palettes[id]) drift.push(`${id} (gone)`); });

/* ─── Write ──────────────────────────────────────────────────────────── */

const line = (value) => JSON.stringify(value);
const block = (obj) => `{\n${Object.entries(obj).map(([k, v]) => `    ${line(k)}: ${line(v)}`).join(',\n')}\n  }`;
const output = `{
  "note": ${line('Generated by .spw/tools/likeness-index.mjs (npm run spw:likeness) from the canon only: chapter rooms, palettes, the almanac, the cast, the lanes\' cards and the seed atlas. Each item\'s likeness is drawn by book/scripts/modules/likeness.mjs; near is the eight nearest by the same scoring, across kinds. Never read from readers. Canon: .spw/surfaces/likeness.spw. Do not edit by hand.')},
  "dimensions": ${block(DIMENSIONS)},
  "palettes": ${block(palettes)},
  "items": ${block(items)},
  "near": ${block(near)}
}
`;

const counts = tally(all.map((i) => i.kind));
if (VERIFY) {
  const current = existsSync(OUT) ? await readFile(OUT, 'utf8') : '';
  const problems = [];
  if (current !== output) problems.push('book/content/world/likeness.json is stale: run npm run spw:likeness');
  if (drift.length) problems.push(`likeness.mjs PALETTE_MIRROR drifts from palettes.json: ${drift.join(', ')}`);
  if (problems.length) {
    problems.forEach((p) => console.error(`[spw:likeness] ${p}`));
    process.exit(1);
  }
  console.log(`[spw:likeness] likeness.json is current (${all.length} items)`);
  process.exit(0);
}

if (drift.length) {
  console.error(`[spw:likeness] likeness.mjs PALETTE_MIRROR drifts from palettes.json: ${drift.join(', ')} — update the mirror`);
  process.exitCode = 1;
}

if (THUMBS) {
  await mkdir(dirname(thumbs[0].out), { recursive: true });
  let made = 0;
  for (const { src, out } of thumbs) {
    execFileSync('magick', [src, '-resize', '480x480', '-strip', '-quality', '70', out]);
    made += 1;
  }
  const sizes = await Promise.all(thumbs.map(({ out }) => stat(out).then((s) => s.size)));
  console.log(`[spw:likeness] ${made} atlas thumbnails, ${Math.round(sizes.reduce((a, b) => a + b, 0) / 1024)}KB in all`);
}

await writeFile(OUT, output);
const sample = likenessOf(all[0]);
console.log(`[spw:likeness] ${all.length} likenesses (${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(', ')}) → book/content/world/likeness.json; first: ${sample.id} ${sample.sigil}${sample.container}`);
