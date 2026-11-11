#!/usr/bin/env node
// @ts-check
/**
 * texture-finds-check.mjs — hold the texture.website pieces (book/content/packs/texture.website/@spwashi/folios.json) to their promises (npm run texture:finds:check).
 *
 * It reads and prints; it writes nothing, and it needs no copy of spwashi.com.
 *   hard  a picture or page URL that is not spwashi.com's; a piece with no title or alt; a piece that names
 *         what the archive keeps on its own side; a resonance that points at a room, trope, motif, sigil,
 *         placement or chapter lore.land does not have; a room link whose anchor is not the room's.
 *   says  for every room in the book, how many pieces it answers and whether a reader passing it would find
 *         one (offer's floor), so a room that never finds anything is named, not discovered later.
 * Exits 1 on any hard finding. --file <path> checks another copy, so a control can be run against it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRooms } from '../modules/chapter-render.mjs';
import { ROOM_MOTIONS } from '../modules/room-signature.mjs';
import { HELD_TERMS, foliosFor, offer } from '../modules/texture-finds.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SITE = 'https://spwashi.com/';
/** @param {string} rel */
const json = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));
const fileAt = process.argv.indexOf('--file');
/** --file <path> checks another copy (a control); the default is the committed pieces. */
const doc = fileAt > 0 ? JSON.parse(readFileSync(resolve(process.cwd(), process.argv[fileAt + 1]), 'utf8')) : json('book/content/packs/texture.website/@spwashi/folios.json');
/** @type {string[]} */
const hard = [];

/* What lore.land has. */
/** @type {Map<string, { key: string, chapter: number, op: string, href: string }>} */
const rooms = new Map();
const chapters = new Set();
for (const file of readdirSync(resolve(ROOT, 'book/content/chapters')).filter((f) => /^\d\d\.json$/.test(f)).sort()) {
  const data = json(`book/content/chapters/${file}`);
  chapters.add(Number(data.chapterNumber));
  const nn = String(data.chapterNumber).padStart(2, '0');
  planRooms(data).forEach((/** @type {any} */ room) => {
    if (!room?.reading || room.drafting) return;
    const key = `${nn}:${room.reading.label}`;
    rooms.set(key, { key, chapter: Number(data.chapterNumber), op: room.reading.op, href: `/book/chapter/${nn}/#${room.id}` });
  });
}
const tropeIds = new Set(json('book/content/world/tropes.json').tropes.map((/** @type {any} */ t) => t.id));
const motifHandles = new Set(json('book/content/packs/texture.website/@spwashi/findings.json').motifs.map((/** @type {any} */ m) => m.handle));
const nearHrefs = new Set(json('book/content/world/worktable.json').pieces.map((/** @type {any} */ p) => p.near?.href).filter(Boolean));

/* Each piece. */
const ids = new Set();
for (const p of doc.pieces) {
  const at = `${p.id}`;
  if (ids.has(p.id)) hard.push(`${at}: listed twice`);
  ids.add(p.id);
  if (!p.title) hard.push(`${at}: no title`);
  if (!p.alt) hard.push(`${at}: no alt`);
  const said = [p.title, p.alt, (p.tags || []).join(' '), (p.handles || []).join(' '), p.asks || ''].join(' ');
  const heldWord = HELD_TERMS.exec(said);
  if (heldWord) hard.push(`${at}: names what the archive keeps on its side (${heldWord[0]})`);
  if (!String(p.shown_at || '').startsWith(SITE)) hard.push(`${at}: shown_at is not a spwashi.com page (${p.shown_at})`);
  for (const [tier, t] of Object.entries(p.tiers || {})) {
    for (const fmt of ['avif', 'webp']) {
      const url = /** @type {any} */ (t)[fmt];
      if (url && !String(url).startsWith(`${SITE}public/images/assets/`)) hard.push(`${at}: ${tier} ${fmt} is not spwashi.com's (${url})`);
    }
    if (!(/** @type {any} */ (t).width > 0 && /** @type {any} */ (t).height > 0)) hard.push(`${at}: ${tier} has no size`);
  }
  if (!p.tiers?.display?.webp || !p.tiers?.thumb?.webp) hard.push(`${at}: needs a thumb and a display picture`);
  for (const r of p.resonance || []) {
    if (r.kind === 'room') {
      const room = rooms.get(r.id);
      if (!room) hard.push(`${at}: answers room ${r.id}, which the book does not have`);
      else if (r.href !== room.href) hard.push(`${at}: room ${r.id} links ${r.href}, the room is at ${room.href}`);
    } else if (r.kind === 'trope') {
      if (!tropeIds.has(r.id)) hard.push(`${at}: answers trope ${r.id}, which tropes.json does not have`);
      if (r.id === 'plain-lines') hard.push(`${at}: is computed toward the figure's own trope`);
    } else if (r.kind === 'motif') {
      if (!motifHandles.has(r.id)) hard.push(`${at}: motif ${r.id} is not among the mined motifs`);
    } else if (r.kind === 'sigil') {
      if (!(r.id in ROOM_MOTIONS)) hard.push(`${at}: ${r.id} is not one of the twelve sigils`);
    } else if (r.kind === 'near') {
      if (!nearHrefs.has(r.href)) hard.push(`${at}: placed near ${r.href}, which the worktable does not say`);
    } else if (r.kind === 'glass') {
      if (!chapters.has(Number(r.id))) hard.push(`${at}: glassed in chapter ${r.id}, which the book does not have`);
    } else {
      hard.push(`${at}: unknown resonance kind ${r.kind}`);
    }
  }
}
for (const [ch, list] of Object.entries(doc.chapters || {})) {
  for (const id of list) if (!tropeIds.has(id)) hard.push(`chapters.${ch}: trope ${id} is not in tropes.json`);
}

/* Every room, as a reader passing it would meet it. */
let answered = 0;
let finds = 0;
/** @type {string[]} */
const silent = [];
/** @type {Map<string, number>} */
const firstFinds = new Map();
for (const room of rooms.values()) {
  const moment = { room: room.key, chapter: room.chapter, sigils: [room.op] };
  const all = foliosFor(doc, moment);
  if (all.length) answered += 1;
  const found = offer(doc, moment, {});
  if (found) {
    finds += 1;
    firstFinds.set(found.piece.id, (firstFinds.get(found.piece.id) || 0) + 1);
  } else silent.push(room.key);
}
const reachable = new Set();
for (const room of rooms.values()) {
  foliosFor(doc, { room: room.key, chapter: room.chapter, sigils: [room.op] }).filter((r) => r.score >= 3).forEach((r) => reachable.add(r.piece.id));
}
const byRooms = reachable.size;
/* A carry that ends in a chapter names the tropes standing in it. */
for (const ch of chapters) {
  foliosFor(doc, { chapter: ch, tropes: doc.chapters?.[ch] || [] }).filter((r) => r.score >= 3).forEach((r) => reachable.add(r.piece.id));
}
/* The game is a moment of its own: a carry ends on /pie/. */
foliosFor(doc, { page: '/pie/' }).filter((r) => r.score >= 3).forEach((r) => reachable.add(r.piece.id));
const unreachable = doc.pieces.filter((/** @type {any} */ p) => !reachable.has(p.id));

console.log(`[texture:finds] ${doc.pieces.length} pieces (${doc.counts.folios} folios, ${doc.counts.panels} panels) from ${doc.source.archive} at ${doc.source.commit}; ${doc.excluded.length} kept on the maker's side`);
console.log(`  rooms: ${rooms.size}; ${answered} answer at least one piece; passing ${finds} of them finds one; ${silent.length} find nothing`);
console.log(`  pieces a room can find: ${byRooms} of ${doc.pieces.length}; with carries that end in each chapter, and on /pie/: ${reachable.size}; never findable: ${unreachable.length}`);
if (unreachable.length) unreachable.forEach((/** @type {any} */ p) => hard.push(`${p.id}: no room, carry or glassing place finds it`));
const crowded = [...firstFinds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
if (crowded.length) console.log(`  most offered first: ${crowded.map(([id, n]) => `${id} (${n} rooms)`).join(', ')}`);
if (silent.length) console.log(`  rooms that find nothing: ${silent.join(' ')}`);
if (hard.length) {
  console.log(`  ${hard.length} hard:`);
  hard.forEach((h) => console.log(`    ${h}`));
  process.exit(1);
}
console.log('  0 hard');
