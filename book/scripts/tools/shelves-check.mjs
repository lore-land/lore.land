#!/usr/bin/env node
// @ts-check
/**
 * shelves-check.mjs — the shelves formula held to what .spw/surfaces/shelves.spw says (npm run shelves:check).
 *
 * Vectors normalize and answer every input; branch odds favour the matching signature and keep their floor; each chain
 * fires after three rooms and not before, and the crossings feed; tease rungs climb with their signals and stop at
 * unreleased chapters; dimensions open in order, only when the last is lived in; every obstacle and creature in the
 * road has a reason with a ground. Every chain link reads whole with the real parser, and leans the way its sign says.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHELVES, vectorOf, deedsFrom, branchOdds, alignment, CHAINS, chainStart, chainStep, teaseRung, RUNGS, nextDimension, DIMENSIONS, SCHEME_SIGNATURES } from '../modules/valence-shelves.mjs';
import { SCHEMES } from '../home/pie-world.mjs';
import { REASONS_IN_THE_ROAD, reasonFor, NOBODY } from '../home/pie-reasons.mjs';
import { SCENES } from '../home/pie-world.mjs';
import { CARDS } from '../home/pie-cards.mjs';
import { ANT_KINDS } from '../home/pie-ants.mjs';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
/** @type {string[]} */
const notes = [];
const fail = (/** @type {string} */ why) => fails.push(why);
const near = (/** @type {number} */ a, /** @type {number} */ b, e = 1e-9) => Math.abs(a - b) < e;
const sum = (/** @type {Record<string, number>} */ v) => Object.values(v).reduce((n, x) => n + x, 0);

/* ─── Vectors ─── */
{
  const even = vectorOf();
  if (!near(sum(even), 1) || !SHELVES.every((s) => near(even[s], 0.2))) fail(`an untuned vector is not even: ${JSON.stringify(even)}`);
  SHELVES.forEach((s) => {
    for (const [what, input] of /** @type {Array<[string, any]>} */ ([['shelf', { shelf: { [s]: 3 } }], ['deeds', { deeds: { [s]: 8 } }], ['attention', { attention: { [s]: 8 } }]])) {
      const v = vectorOf(input);
      if (!near(sum(v), 1)) fail(`${what} on ${s}: the vector does not sum to one`);
      if (!SHELVES.every((o) => o === s || v[s] > v[o])) fail(`${what} on ${s} does not lean the vector toward ${s}: ${JSON.stringify(v)}`);
    }
  });
  const zero = vectorOf({ shelf: { boon: 0, bane: 0, bone: 0, bonk: 0, honk: 0 } });
  if (!near(sum(zero), 1)) fail('a shelf of all zeros does not fall back to even');
  const bad = vectorOf({ shelf: { boon: -4, nonsense: 9 }, deeds: { bane: Number.NaN } });
  if (!near(sum(bad), 1) || bad.boon !== 0) fail(`negative and nonsense input are not refused: ${JSON.stringify(bad)}`);
  // Deeds come from the game's own events.
  const d = deedsFrom({ knocked: 2, satisfied: 3, perfect: 1, in_time: 2, pocket: 1, nonsense: 9 }, { waps: 4, wasted: 1, shattered: 2, rhythms: 1, echoes: 2 });
  if (!(d.bane === 2 && d.boon === 3 && near(d.bone, 1 + 1 + 0.3) && near(d.bonk, 2 + 1 + 2 + 2) && near(d.honk, 2 + 0.6 + 2 + 1))) fail(`deeds from the lanes came out ${JSON.stringify(d)}`);
  notes.push(`deeds: two knocks and two broken panes give bonk ${d.bonk}, bane ${d.bane}; two hops in time and a rhythm give honk ${d.honk.toFixed(1)}`);
}

/* ─── Branch odds: Mr. BaneWAP's schemes as the first branches with signatures ─── */
{
  const schemes = Object.entries(SCHEME_SIGNATURES).map(([id, signature]) => ({ id, signature }));
  if (Object.keys(SCHEMES).sort().join() !== Object.keys(SCHEME_SIGNATURES).sort().join()) fail('every scheme of his needs a signature, and only his schemes have one');
  const even = branchOdds(schemes, vectorOf(), { firmness: 1 });
  const bane = branchOdds(schemes, vectorOf({ shelf: { bane: 2 }, deeds: { bonk: 12 } }), { firmness: 3 });
  const bone = branchOdds(schemes, vectorOf({ shelf: { bone: 4 } }), { firmness: 3 });
  const p = (/** @type {{ id: string, p: number }[]} */ list, /** @type {string} */ id) => list.find((b) => b.id === id)?.p ?? 0;
  [even, bane, bone].forEach((list) => { if (!near(sum(Object.fromEntries(list.map((b) => [b.id, b.p]))), 1, 1e-6)) fail('branch odds do not sum to one'); });
  if (!(p(bane, 'march') > p(even, 'march') && p(bane, 'march') === Math.max(...bane.map((b) => b.p)))) fail('a bane shelf with a run of knocks does not make the march the likeliest scheme');
  if (!(p(bone, 'tax') > p(even, 'tax') && p(bone, 'tax') === Math.max(...bone.map((b) => b.p)))) fail('a bone-tuned shelf does not make the tax (a ledger) the likeliest scheme');
  if (Math.min(...bane.map((b) => b.p)) < 0.05 - 1e-9) fail('a branch fell under the floor of one in twenty');
  const firm = branchOdds(schemes, vectorOf({ shelf: { bane: 4 } }), { firmness: 4 });
  const loose = branchOdds(schemes, vectorOf({ shelf: { bane: 4 } }), { firmness: 1 });
  const top = loose.reduce((a, b) => (b.p > a.p ? b : a)).id;
  if (!(p(firm, top) > p(loose, top))) fail('firmer shelves do not make the leaning branch more dominant');
  const many = branchOdds(Array.from({ length: 40 }, (_, i) => ({ id: `b${i}`, signature: { boon: i } })), vectorOf({ shelf: { boon: 4 } }), { firmness: 4 });
  if (!near(sum(Object.fromEntries(many.map((b) => [b.id, b.p]))), 1, 1e-6)) fail('many branches: odds do not sum to one');
  if (branchOdds([], vectorOf()).length !== 0) fail('no branches should give no odds');
  notes.push(`schemes: the march goes from ${(p(even, 'march') * 100).toFixed(0)}% on even shelves to ${(p(bane, 'march') * 100).toFixed(0)}% with a bane shelf and a run of knocks (firmness 3); a bone shelf takes the tax from ${(p(even, 'tax') * 100).toFixed(0)}% to ${(p(bone, 'tax') * 100).toFixed(0)}%; the least likely keeps ${(Math.min(...bane.map((b) => b.p)) * 100).toFixed(0)}%`);
}

/* ─── Chains ─── */
{
  const bane = vectorOf({ shelf: { bane: 6 } });
  let state = chainStart();
  /** @type {any[]} */
  let fired = [];
  for (let room = 1; room <= 2; room += 1) ({ state, fired } = chainStep(state, bane));
  if (fired.length) fail('a chain fired before three rooms');
  ({ state, fired } = chainStep(state, bane));
  if (!(fired.length === 1 && fired[0].shelf === 'bane' && fired[0].invokes === 'scheme')) fail(`three bane rooms should fire the scheme: ${JSON.stringify(fired)}`);
  const off = vectorOf();
  ({ state } = chainStep(state, bane));
  ({ state } = chainStep(state, off));
  if (state.streak.bane !== 0) fail('a room under the threshold does not reset the streak');
  // Crossings: bonk feeds bane; honk feeds boon; bone checks bane and bonk.
  let cross = chainStart();
  const bonk = vectorOf({ shelf: { bonk: 6 } });
  for (let i = 0; i < 3; i += 1) ({ state: cross } = chainStep(cross, bonk));
  if (cross.at.bonk !== 1 || cross.streak.bane !== 1) fail(`a bonk link does not feed the bane streak: ${JSON.stringify(cross)}`);
  let honkState = chainStart();
  const honk = vectorOf({ shelf: { honk: 6 } });
  for (let i = 0; i < 3; i += 1) ({ state: honkState } = chainStep(honkState, honk));
  if (honkState.streak.boon !== 1) fail('a honk link does not feed the boon streak');
  let bone = chainStart();
  bone.streak.bane = 2; bone.streak.bonk = 2;
  const boneV = vectorOf({ shelf: { bone: 8 } });
  bone.streak.bone = 2;
  ({ state: bone } = chainStep(bone, boneV));
  if (!(bone.at.bone === 1 && bone.streak.bane === 0 && bone.streak.bonk === 0)) fail(`a bone link does not check bane and bonk: ${JSON.stringify(bone)}`);
  // Run every chain to its end.
  SHELVES.forEach((s) => {
    let st = chainStart();
    const v = vectorOf({ shelf: { [s]: 8 } });
    let rooms = 0;
    while (!st.complete.includes(s) && rooms < 40) { ({ state: st } = chainStep(st, v)); rooms += 1; }
    if (!st.complete.includes(s)) fail(`the ${s} chain never completes`);
    else notes.push(`chain ${s}: ${CHAINS[s].length} links, complete after ${rooms} rooms held`);
  });
}

/* ─── Every chain link reads whole, and leans the way its sign says ─── */
{
  const seed = await import('../vendor/spw-seed.mjs').catch(() => null);
  if (!seed) fail('the vendored parser did not load');
  else {
    let read = 0;
    SHELVES.forEach((s) => CHAINS[s].forEach((link) => {
      const r = seed.parse(link.line, { lexProfile: 'prose' });
      if (!r.completeness?.complete || r.completeness.proseFallback) { fail(`${link.line} does not read whole`); return; }
      const ast = /** @type {any} */ (r.ast);
      const op = (ast?.expression?.expressions || ast?.expressions || []).flatMap((/** @type {any} */ e) => e.terms || []).find((/** @type {any} */ t) => t.type === 'Operation');
      const bias = /** @type {any} */ (seed).readBias(op);
      const want = link.line.startsWith('=boon') ? 'forward' : 'inverse';
      if (bias?.sign !== want) fail(`${link.line} reads ${bias?.sign}, not ${want}`);
      read += 1;
    }));
    // Negative controls: a link broken open does not read whole; a bane sign is never forward.
    const broken = seed.parse('=bane@scheme{ @march ', { lexProfile: 'prose' });
    if (broken.completeness?.complete && !broken.completeness.proseFallback) fail('negative control: an unclosed link read whole');
    notes.push(`chains: ${read} links read whole by the parser, each leaning forward (boon) or inverse (bane) as written`);
  }
}

/* ─── Teasing ─── */
{
  const point = { id: 'second-place', chapter: 15, signature: { boon: 2, bone: 1 } };
  const steps = [0, 0.3, 0.6, 0.8, 1].map((x) => teaseRung(point, { attention: x, deeds: x, progress: x, v: vectorOf({ shelf: { boon: 3 } }) }).index);
  if (!steps.every((n, i) => i === 0 || n >= steps[i - 1])) fail(`tease rungs do not climb with the signals: ${steps}`);
  if (steps[steps.length - 1] !== RUNGS.length - 1) fail('full attention, deeds and progress do not reach the reveal');
  const unreleased = teaseRung({ id: 'ahead', chapter: TOTAL_CHAPTERS + 1, signature: { boon: 1 } }, { attention: 1, deeds: 1, progress: 1, v: vectorOf({ shelf: { boon: 3 } }) });
  if (!(unreleased.rung === 'glimpse' && unreleased.capped)) fail(`a point in an unreleased chapter went past a glimpse: ${JSON.stringify(unreleased)}`);
  const held = teaseRung({ id: 'held', chapter: 1, held: true }, { attention: 1, deeds: 1, progress: 1 });
  if (held.rung !== null || !held.held) fail('held plot was given a rung');
  const aligned = teaseRung(point, { attention: 0.3, deeds: 0.3, v: vectorOf({ shelf: { boon: 6 } }) }).score;
  const against = teaseRung(point, { attention: 0.3, deeds: 0.3, v: vectorOf({ shelf: { bane: 6 } }) }).score;
  if (!(aligned > against)) fail('a shelf that matches the point does not tease it further');
  notes.push(`tease: rungs ${steps.map((i) => (i >= 0 ? RUNGS[i] : '—')).join(' → ')} as signals rise; an unreleased chapter stops at a glimpse`);
}

/* ─── Dimensions ─── */
{
  const first = nextDimension({ open: ['across'], uses: {} });
  if (!first || first.next !== 'ahead' || first.ready) fail(`the second dimension opened before the first was lived in: ${JSON.stringify(first)}`);
  const lived = nextDimension({ open: ['across'], uses: { across: 3 } });
  if (!lived?.ready) fail('a lived-in dimension does not ready the next');
  const order = [];
  /** @type {string[]} */
  let open = ['across'];
  for (let i = 0; i < DIMENSIONS.length; i += 1) {
    const n = nextDimension({ open, uses: Object.fromEntries(open.map((d) => [d, 3])) });
    if (!n) break;
    order.push(`${n.next} (teased by ${n.resident})`);
    open = [...open, n.next];
  }
  if (open.length !== DIMENSIONS.length || nextDimension({ open }) !== null) fail('the dimensions do not all open, in order');
  // In the road: every scene's kinds, every card, and what the ants bring (pie-ants.mjs), with the crows who take their gifts.
  const kinds = new Set([...SCENES.flatMap((sc) => sc.kinds), ...Object.keys(CARDS), ...ANT_KINDS, 'corvid']);
  DIMENSIONS.forEach((d) => { if (d.resident !== 'berry' && !kinds.has(d.resident)) fail(`dimension ${d.id}: its resident ${d.resident} is not in the road`); });
  notes.push(`dimensions: across, then ${order.join(', ')}`);
}

/* ─── Reasons in the road ─── */
{
  const kinds = new Set([...SCENES.flatMap((sc) => sc.kinds), ...Object.keys(CARDS).filter((k) => !k.startsWith('carrier-')), ...ANT_KINDS, 'corvid']);
  const rules = readFileSync(resolve(ROOT, '.spw/runtime/pie-rules.spw'), 'utf8');
  const knocks = /!knocks\{([\s\S]*?)\n\}/.exec(rules)?.[1] || '';
  [...knocks.matchAll(/\*([a-z_]+)\{/g)].forEach((m) => kinds.add(m[1]));
  let nobody = 0;
  kinds.forEach((kind) => {
    const r = reasonFor(kind);
    if (!r) { fail(`${kind} is in the road with no reason`); return; }
    if (!r.why || !r.ground || !SHELVES.includes(r.shelf) || !DIMENSIONS.some((d) => d.id === r.dimension)) fail(`${kind}: its reason is not whole`);
    if (r.whose === NOBODY) nobody += 1;
    if (/["“”]/.test(`${r.whose} ${r.why}`)) fail(`${kind}: a reason is a description, not a line`);
    if (/wap\s*boy|wabo|figure in plain|under the hat/i.test(`${r.whose} ${r.why} ${r.ground}`)) fail(`${kind}: names something held`);
  });
  Object.keys(REASONS_IN_THE_ROAD).forEach((kind) => { if (!kinds.has(kind)) fail(`a reason for ${kind}, which is not in the road`); });
  if (reasonFor('carrier-figure') !== null || reasonFor('nonsense') !== null) fail('negative control: a reason for something not in the road');
  notes.push(`reasons: ${kinds.size} kinds in the road, every one with a reason and a ground; ${nobody} say whose is ${NOBODY}`);
}

console.log('[shelves] five shelves; vectors, odds, chains, tease rungs, dimensions and reasons checked against .spw/surfaces/shelves.spw.');
notes.forEach((n) => console.log(`  ${n}`));
if (fails.length) {
  console.error(`[shelves] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[shelves] ok. Weights are a first tuning, not a measurement; nothing here was played.');
void alignment;
