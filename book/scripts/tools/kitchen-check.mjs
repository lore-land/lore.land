#!/usr/bin/env node
// @ts-check
/**
 * kitchen-check.mjs — the wish-kitchen and the ants' gossip, held to what they promise (npm run kitchen:check).
 *
 * The wish-kitchen (wish-kitchen.mjs): each character's product does what .spw/surfaces/gossip-and-kitchens.spw says it
 * does, every result lands on a dish the land has, and a mimed order is read exactly only by the special chef. The
 * gossip (pie-ants.mjs): every scrap is a few of the book's own words from a released chapter, from a paragraph that
 * holds nothing kept back, with no quotation marks. Negative controls make sure the checks can fail.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wishDish, orderAsRead, nearestDish, likeness, DISHES } from '../modules/wish-kitchen.mjs';
import { gossipFrom, fragmentOf, HELD_GOSSIP } from '../home/pie-ants.mjs';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
let seed = 11;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ids = new Set(DISHES.map((d) => d.id));
const tasteOf = (/** @type {string} */ id) => DISHES.find((d) => d.id === id)?.v || {};

/* ─── The wish-kitchen ─── */
const WANTS = ['pie', 'jam', 'seed_cake', 'uneven_slice', 'regional'];
const WHO = ['boof', 'bonewap', 'boon', 'bane', 'genie', 'clown', 'mime', 'porter'];
/** @type {Record<string, string[]>} */
const table = {};
for (const want of WANTS) {
  for (const who of WHO) {
    const r = wishDish(want, { who, concentration: 0.6, rand });
    if (!r) { fail(`${who} on ${want}: no result`); continue; }
    if (!ids.has(r.dish.id) && r.dish.id !== 'crumb') fail(`${who} on ${want}: landed on ${r.dish.id}, not a dish the land has`);
    if (/["“”]/.test(r.says)) fail(`${who} on ${want}: a result is said, not quoted`);
    (table[who] = table[who] || []).push(r.dish.id);
    const like = likeness(r.taste, tasteOf(want));
    if (who === 'boon' && r.dish.id !== want) fail(`BoonWAP on ${want} made ${r.dish.id}: a scaled sum is the dish itself`);
    if (who === 'boon' && like < 0.99) fail(`BoonWAP on ${want}: not the same dish, bigger`);
    if (who === 'bane' && like > 0.35) fail(`BaneWAP on ${want}: too close to what was asked (${like.toFixed(2)}); a cross product turns it`);
    if (who === 'bane' && !['bane_dish', 'pickle'].includes(r.dish.id)) fail(`BaneWAP on ${want} made ${r.dish.id}: it should come true the bad way`);
    if (who === 'boof' && !['bone', 'crumb'].includes(r.dish.id)) fail(`Boof on ${want} made ${r.dish.id}: only the part pointing where she is comes out`);
    if (who === 'clown' && r.dish.id !== want) fail(`the clown on ${want} made ${r.dish.id}: everything bigger is still the dish`);
  }
}
if (wishDish('pie', { who: 'figure' }) !== null) fail('the figure wished: nobody has said');
if (wishDish('pie', { who: 'boof', concentration: 0 })?.dish.id !== 'crumb') fail('no boonberry at all should make a crumb');
const bigger = wishDish('pie', { who: 'boon', concentration: 1 });
const asked = wishDish('pie', { who: 'porter', concentration: 1 });
const total = (/** @type {Record<string, number | undefined>} */ t) => Object.values(t).reduce((/** @type {number} */ n, x) => n + (x || 0), 0);
if (bigger && asked && total(bigger.taste) < total(asked.taste)) fail('BoonWAP made it smaller');

// A mimed order: the special chef reads it exactly; a busy kitchen misreads it often, a quiet one less.
let busy = 0;
let quiet = 0;
for (let i = 0; i < 200; i += 1) {
  if (orderAsRead('bane_dish', { busyness: 0.95, rand }).misread) busy += 1;
  if (orderAsRead('bane_dish', { busyness: 0.1, rand }).misread) quiet += 1;
  if (orderAsRead('bane_dish', { chef: true, rand }).misread) fail('the special chef misread an order');
}
if (busy <= quiet) fail(`a busy kitchen misread ${busy} of 200 and a quiet one ${quiet}: busier should be worse`);
if (busy < 30) fail(`a busy kitchen misread only ${busy} of 200`);
if (nearestDish({}).id !== 'crumb') fail('nothing at all is a crumb');

/* ─── The gossip ─── */
let scraps = 0;
let chaptersWith = 0;
for (let n = 1; n <= TOTAL_CHAPTERS; n += 1) {
  /** @type {any} */
  const ch = JSON.parse(readFileSync(resolve(ROOT, `book/content/chapters/${String(n).padStart(2, '0')}.json`), 'utf8'));
  /** @type {{ text: string, title?: string }[]} */
  const paras = [];
  (ch.sections || []).forEach((/** @type {any} */ s) => (s.blocks || s.content || []).forEach((/** @type {any} */ b) => { if (typeof b?.text === 'string') paras.push({ text: b.text, title: s.title }); }));
  if (!paras.length) continue;
  let found = 0;
  for (let k = 0; k < 20; k += 1) {
    const g = gossipFrom(paras, { from: Math.floor(rand() * paras.length / 2), rand });
    if (!g) continue;
    found += 1;
    scraps += 1;
    const inner = g.text.replace(/^…|…$/g, '');
    if (!paras[g.index].text.replace(/[“”"«»]/g, '').includes(inner)) fail(`Chapter ${n}: a scrap that is not the book's own words: ${g.text}`);
    if (HELD_GOSSIP.test(paras[g.index].text)) fail(`Chapter ${n}: gossip from a paragraph that holds something kept back`);
    if (/["“”]/.test(g.text)) fail(`Chapter ${n}: a scrap with quotation marks`);
    const words = inner.split(/\s+/).length;
    if (words < 4 || words > 6) fail(`Chapter ${n}: a scrap of ${words} words`);
  }
  if (found) chaptersWith += 1;
}
if (!scraps) fail('no gossip was found in any released chapter');
// Negative controls: a held paragraph is never gossiped; a paragraph past the end is nothing.
if (gossipFrom([{ text: 'zero' }, { text: 'one' }, { text: 'The figure under the hat looked back across the plaza for a long while, saying nothing.' }], { from: 0 })) fail('a held paragraph was gossiped from');
if (gossipFrom([{ text: 'a b c d e f g h i j' }], { from: 0 })) fail('gossip came from behind the carry, not further on');
if (!/^….+…$/.test(fragmentOf('one two three four five six seven eight', rand))) fail('a scrap without its ellipses');

console.log(`[kitchen] ${WANTS.length} dishes wished by ${WHO.length} characters; a busy kitchen misread ${busy} of 200 mimed orders, a quiet one ${quiet}, the special chef none. Gossip: ${scraps} scraps from ${chaptersWith} of ${TOTAL_CHAPTERS} chapters.`);
Object.entries(table).forEach(([who, dishes]) => console.log(`  ${who.padEnd(8)} ${dishes.join(', ')}`));
if (fails.length) {
  console.error(`[kitchen] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.slice(0, 30).forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[kitchen] ok. Nothing here was seen in a browser.');
