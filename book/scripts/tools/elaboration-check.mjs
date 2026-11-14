#!/usr/bin/env node
// @ts-check
/**
 * elaboration-check.mjs — tropes reveal as far as a reader has come, and no further (npm run elaboration:check).
 *
 * Holds trope-reveal.mjs and rhymes.json to elaboration.spw: every trope has words and a Spw expression at every stage
 * (each expression read whole by the vendored parser), stages climb with what a reader has done and never fall back,
 * nothing shows from a chapter not yet released, held words never appear, and every refrain maps to a trope that
 * exists in released chapters. Negative controls show each guard can fail.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, LANES_MOMENTS, revealStage, stageWords, stageSpw, chambersOf, noteCrossing, tropeSignals, setRhymes, refrainsFor } from '../modules/trope-reveal.mjs';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
const HELD = /wap\s*-?\s*boy|wabo/i;
const tropes = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/tropes.json'), 'utf8')).tropes;
const rhymes = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/rhymes.json'), 'utf8'));
const seed = await import('../vendor/spw-seed.mjs');
const reads = (/** @type {string} */ src) => { const r = seed.parse(src, { lexProfile: 'prose' }); return Boolean(r.completeness?.complete && !r.completeness?.proseFallback); };

// Every trope, every stage: words and a whole expression.
let expressions = 0;
for (const t of tropes) {
  const words = stageWords(t);
  const spw = stageSpw(t);
  for (const stage of STAGES) {
    const w = /** @type {Record<string, string>} */ (words)[stage];
    const s = /** @type {Record<string, string>} */ (spw)[stage];
    if (!w || w.length < 3) fail(`${t.id} ${stage}: no words`);
    if (HELD.test(`${w} ${s}`)) fail(`${t.id} ${stage}: names something held`);
    if (!reads(s)) fail(`${t.id} ${stage}: ${s} does not read whole`);
    expressions += 1;
  }
}

// Every trope can be met by play: a thing of its kinds passed, or a moment of the carry the game meets it at
// (faces.lanes.moments, held to LANES_MOMENTS, each one called in pie-game.mjs). A trope with neither could turn only at
// the desk.
const game = readFileSync(resolve(ROOT, 'book/scripts/home/pie-game.mjs'), 'utf8');
const metIn = (/** @type {string} */ moment) => new RegExp(`metAt\\('${moment}'\\)`).test(game);
LANES_MOMENTS.forEach((moment) => { if (!metIn(moment)) fail(`pie-game.mjs never meets the moment ${moment} (metAt('${moment}'))`); });
for (const t of tropes) {
  const kinds = t.faces?.lanes?.kinds || [];
  const moments = t.faces?.lanes?.moments || [];
  if (!kinds.length && !moments.length) fail(`${t.id}: no kind and no moment, so play can never meet it`);
  moments.forEach((/** @type {string} */ m) => { if (!LANES_MOMENTS.includes(m)) fail(`${t.id}: ${m} is not a moment the lanes meet (LANES_MOMENTS)`); });
}
const byPlay = tropes.filter((/** @type {any} */ t) => (t.faces?.lanes?.kinds || []).length || (t.faces?.lanes?.moments || []).length).length;

// Stages climb with signals and never fall back; the turn needs two strands, the payoff its last chamber read.
/** @type {Array<Record<string, number | boolean>>} */
const LADDER = [{}, { seen: 1 }, { read: 1 }, { read: 1, lanes: 1, seen: 3 }, { read: 2, lanes: 2, desk: 1, seen: 4, lastRead: true }, { read: 3, lanes: 4, desk: 2, seen: 8, lastRead: true, refrains: 3, shelf: 1 }];
const reached = Object.fromEntries(STAGES.map((s) => [s, 0]));
for (const t of tropes) {
  let last = -1;
  for (const signals of LADDER) {
    const r = revealStage(t, signals);
    if (r.index < last) fail(`${t.id}: fell back from ${STAGES[last]} to ${r.stage}`);
    last = Math.max(last, r.index);
  }
  reached[STAGES[last]] += 1;
  if (revealStage(t, { read: 9, seen: 9 }).index > 2) fail(`${t.id}: turned with one strand only`);
  if (revealStage(t, { read: 3, lanes: 3, seen: 6, lastRead: false }).index > 3) fail(`${t.id}: paid without its paying chamber read`);
}

// Nothing from a chapter not yet released: with the book cut at 13, a trope told only in 14 and 15 never turns or pays.
let held = 0;
for (const t of tropes) {
  const { all } = chambersOf(t, 13);
  const top = revealStage(t, LADDER[LADDER.length - 1], { released: 13 });
  if (all.length && all.every((/** @type {number} */ n) => n > 13) && top.index > 2) fail(`${t.id}: shown past its name from unreleased chapters`);
  if (all.some((/** @type {number} */ n) => n > 13) && top.index === 4) fail(`${t.id}: paid off before every chamber was out`);
  if (all.some((/** @type {number} */ n) => n > 13)) held += 1;
}

// Crossings kept and read back: a stand-in storage, in order.
/** @type {Record<string, string>} */
const store = {};
/** @type {any} */ (globalThis).localStorage = { getItem: (/** @type {string} */ k) => store[k] ?? null, setItem: (/** @type {string} */ k, /** @type {string} */ v) => { store[k] = v; }, removeItem: (/** @type {string} */ k) => { delete store[k]; } };
const t0 = tropes.find((/** @type {any} */ t) => chambersOf(t).released.length >= 2) || tropes[0];
store['lore.chapter.progress.v1'] = JSON.stringify({ visited: chambersOf(t0).released });
const before = revealStage(t0, tropeSignals(t0.id, { trope: t0 })).index;
noteCrossing(t0.id, 'lanes');
noteCrossing(t0.id, 'lanes');
noteCrossing(t0.id, 'desk');
noteCrossing(t0.id, /** @type {any} */ ('nonsense'));
const after = revealStage(t0, tropeSignals(t0.id, { trope: t0 })).index;
const kept = JSON.parse(store['lore.tropes.v1'] || '{}')[t0.id];
if (!kept || kept.crossed.lanes !== 2 || kept.crossed.desk !== 1 || kept.seen !== 3) fail(`crossings were not kept as given: ${JSON.stringify(kept)}`);
if (after < before) fail('a crossing moved a trope back');
if (after < 3) fail(`${t0.id}: read in its chambers and met twice in the lanes, it should have turned (stage ${STAGES[after]})`);

// Refrains: every one maps to a trope that exists, spans released chapters only, and holds nothing back.
const ids = new Set(tropes.map((/** @type {any} */ t) => t.id));
const RHYME_HELD = /wap\s*-?\s*boy|wabo|bowler|\bhat\b|figure (?:in|under|with)|\begg\b|dregg/i;
for (const r of rhymes.rhymes || []) {
  (r.tropes || []).forEach((/** @type {string} */ id) => { if (!ids.has(id)) fail(`${r.id}: serves ${id}, which is not a trope`); });
  if ((r.chapters || []).some((/** @type {number} */ n) => n > TOTAL_CHAPTERS)) fail(`${r.id}: spans a chapter not yet released`);
  if (RHYME_HELD.test(`${r.template} ${(r.holes || []).flatMap((/** @type {any} */ h) => h.fillers).join(' ')}`)) fail(`${r.id}: names something held`);
}
setRhymes(rhymes);
const served = tropes.filter((/** @type {any} */ t) => refrainsFor(t.id).length).length;

// Negative controls: each guard above can fail.
const control = (/** @type {string} */ what, /** @type {boolean} */ caught) => { if (!caught) fail(`negative control did not fail: ${what}`); };
control('an expression that does not read', !reads('^[broken{ @lanes'));
control('a held word in a stage', HELD.test('the wapboy stage'));
control('a refrain naming a trope that does not exist', !ids.has('not-a-trope'));
control('a payoff from an unreleased chapter', revealStage({ id: 'x', name: 'X', prop: 'it', faces: { story: { says: 'later', chambers: [40] } } }, LADDER[LADDER.length - 1]).index <= 2);
control('a moment the game never meets', !metIn('nobody_meets_this'));
control('a moment outside the list', !LANES_MOMENTS.includes('nobody_meets_this'));

const counts = rhymes.counts || {};
console.log(`[elaboration] ${tropes.length} tropes × ${STAGES.length} stages: ${expressions} expressions read whole; fully signalled, ${STAGES.map((s) => `${reached[s]} ${s}`).join(', ')}; ${held} tropes wait on an unreleased chamber when the book is cut at 13.`);
console.log(`  refrains: ${counts.kept ?? 0} kept (${counts.rhymes ?? 0} rhymes, ${counts.refrains ?? 0} refrains), ${counts.serving_a_trope ?? 0} serving a trope; ${served} of ${tropes.length} tropes have one; ${counts.held_out ?? 0} held out at build.`);
console.log(`  crossings: ${t0.id} went from ${STAGES[before]} to ${STAGES[after]} after two crossings in the lanes and one at the desk.`);
console.log(`  play: ${byPlay} of ${tropes.length} tropes can be met in the lanes, by a thing passed or at ${LANES_MOMENTS.join(', ')}.`);
if (fails.length) { console.error(`[elaboration] ${fails.length} problem(s):`); fails.slice(0, 40).forEach((f) => console.error(`  ✕ ${f}`)); process.exit(1); }
console.log('[elaboration] ok. Thresholds are a first tuning; nothing here was seen in a browser.');
