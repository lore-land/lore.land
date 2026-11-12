#!/usr/bin/env node
// @ts-check
/**
 * play-graph-check.mjs — the Spw-to-play mapping and the gradients, held to account (npm run play-graph:check).
 *
 * Reads real texts from this tree with the vendored parser and checks that:
 *   - the mapping is deterministic (the same text gives the same graph, twice over),
 *   - every node type the parser produced is in the table or reported as unmapped, never dropped silently,
 *   - every projection's counts agree with the graph it was read from,
 *   - reasonFor answers for every sigil at every point of every gradient, and placeOf for every container,
 *   - the sigil roles and the container ladder agree with spw-interactions.mjs (read as text),
 *   - a text that does not read whole is reported and mapped to nothing (negative controls).
 * It prints what each text became, for .spw/surfaces/ast-play.spw.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playGraph, graphOf, kindsOf, MAPPED_TYPES, SIGIL_ROLES, laneRunner, deckBuilder, metroidvania, rhythmTrack, roguelikeFloor, garden, abstractionLadder } from '../modules/spw-play-graph.mjs';
import { reasonFor, placeOf, collectionReason, SCALES, SPANS, ABSTRACTION, SIGILS, ROLE, spanOfQuarter, QUARTERS, BAND_QUARTERS } from '../modules/spw-gradients.mjs';
import * as competency from '../modules/competency.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const seed = await import('../vendor/spw-seed.mjs');
const parse = seed.parse;
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
const read = (/** @type {string} */ p) => readFileSync(resolve(ROOT, p), 'utf8');

/** @type {Array<[string, string]>} */
const TEXTS = [
  ['.spw/runtime/pie-rules.spw', read('.spw/runtime/pie-rules.spw')],
  ['.spw/chapters/01.spw', read('.spw/chapters/01.spw')],
  ['.spw/chapters/14.spw', read('.spw/chapters/14.spw')],
  ['.spw/surfaces/liminal-physics.spw', read('.spw/surfaces/liminal-physics.spw')],
  ['a board line', '^board{ @hold[one_thumb] =frame[fill] %lanes[0.9] }'],
  ['a way line', '^way{ !aside[7, 9] =apart[two_pies] }'],
  ['a board and a way, together', '^board{ @hold[one_thumb] =frame[fill] %lanes[0.9] }\n^way{ !aside[7, 9] =apart[two_pies] }'],
  ['a mind and a concept', '@boof <boon>{ {bone} }\n{boon}']
];
const STRUCTURAL = new Set(['ModifierChain']);   // read where it carries a valence word alone; otherwise a modifier, not a part

/** Every node type in a tree. @param {any} n @param {Set<string>} out */
const typesIn = (n, out) => {
  if (!n || typeof n !== 'object') return out;
  if (Array.isArray(n)) { n.forEach((x) => typesIn(x, out)); return out; }
  if (typeof n.type === 'string' && /^[A-Z][a-z]/.test(n.type)) out.add(n.type);
  Object.entries(n).forEach(([k, v]) => { if (k !== 'span' && v && typeof v === 'object') typesIn(v, out); });
  return out;
};

/** @type {string[]} */
const rows = [];
for (const [name, src] of TEXTS) {
  const parsed = parse(src, { lexProfile: 'prose' });
  const g = playGraph(parsed, { source: src });
  const again = graphOf(src, parse);
  if (!g.ok) { fail(`${name}: did not map (${g.why})`); continue; }
  if (JSON.stringify(g) !== JSON.stringify(again)) fail(`${name}: the same text gave two different graphs`);
  const seen = typesIn(parsed.ast, new Set());
  [...seen].filter((t) => !MAPPED_TYPES.includes(t) && !STRUCTURAL.has(t) && !(t in g.unmapped)).forEach((t) => fail(`${name}: the parser produced ${t}, which is neither mapped nor reported`));
  const k = kindsOf(g);
  const runner = laneRunner(g);
  const deck = deckBuilder(g);
  const mv = metroidvania(g);
  const rhythm = rhythmTrack(g);
  const floor = roguelikeFloor(g, 7);
  const bed = garden(g);
  const ladder = abstractionLadder(g);
  if (runner.count !== g.steps.length) fail(`${name}: runner rooms ${runner.count} ≠ steps ${g.steps.length}`);
  if (deck.count !== (k.place || 0)) fail(`${name}: deck ${deck.count} ≠ places ${k.place || 0}`);
  if (mv.count !== (k.area || 0) || mv.opened.length + mv.sealed.length !== mv.count) fail(`${name}: metroidvania regions do not add up`);
  if (rhythm.bars.length !== (k.arena || 0) || rhythm.count !== g.steps.length) fail(`${name}: rhythm bars or beats do not match the graph`);
  if (floor.count !== (k.arena || 0)) fail(`${name}: floor forks ${floor.count} ≠ arenas ${k.arena || 0}`);
  if (bed.count !== (k.area || 0) || bed.harvest !== g.charge.total) fail(`${name}: garden beds or harvest do not match the graph's charge`);
  if (ladder.count !== (k.area || 0) + (k.arena || 0) + (k.turn || 0) + (k.passage || 0) || ladder.gates.length !== (k.passage || 0)) fail(`${name}: the ladder does not count the containers`);
  if (deck.cards.some((c) => !(c.suit in SIGIL_ROLES))) fail(`${name}: a card has a suit with no role`);
  const floors = floor.floors > 1e6 ? `about 10^${Math.round(Math.log10(floor.floors))}` : String(floor.floors);
  rows.push(`${name}: ${g.nodes.length} nodes (${Object.entries(k).map(([kind, n]) => `${n} ${kind}`).join(', ')}); depth ${g.depth}; widest choice ${g.branching.maxChoice}; charge ${g.charge.total}; keys ${g.keys.length}; unmapped ${Object.keys(g.unmapped).length}`);
  rows.push(`    runner ${runner.count} rooms, ${runner.things} things · deck ${deck.count} cards in ${Object.keys(deck.suits).length} suits · metroidvania ${mv.opened.length} of ${mv.count} regions open in ${mv.rounds} rounds, ${mv.sealed.length} sealed · rhythm ${rhythm.count} beats, ${rhythm.bars.length} bars · floors ${floors} · garden ${bed.count} beds, harvest ${bed.harvest} · ladder ${ladder.tiers.literal}/${ladder.tiers.instance}/${ladder.tiers.pattern}/${ladder.tiers.concept} (literal/instance/pattern/concept), up ${ladder.maxUp} down ${ladder.maxDown}, ${ladder.gates.length} gates`);
  if (name === 'a board and a way, together' && mv.sealed.length) fail('a board and a way, read together, should open each other');
  if (name === 'a board line' && mv.sealed.length !== 1) fail('a board line alone should be sealed: its key is in another surface');
  if (name === 'a mind and a concept') {
    const gate = ladder.gates[0];
    if (!gate || gate.concept !== 'boon' || gate.mind !== 'boof' || !/literal/.test(gate.implementedAs)) fail(`a mind and a concept: the gate read ${JSON.stringify(gate)}`);
  }
}

// Negative controls: half a parse maps to nothing, and says so.
// (Since workbench 9ef3d22 a capsule-led body may hold an apostrophe, so the control uses a plain body, which may not.)
for (const bad of ['^board{ =tap[go }', "^block{ the maker's line }"]) {
  const parsed = parse(bad, { lexProfile: 'prose' });
  const g = playGraph(parsed, { source: bad });
  if (g.ok || g.nodes.length || !/did not read whole/.test(g.why)) fail(`negative control mapped: ${bad} → ${JSON.stringify({ ok: g.ok, nodes: g.nodes.length, why: g.why })}`);
}
if (playGraph(null).ok) fail('negative control: no parse at all was mapped');

// The gradients: every sigil, every point.
let reasons = 0;
for (const sigil of SIGILS) {
  for (const scale of SCALES) for (const span of SPANS) {
    for (const container of ['', ...ABSTRACTION.map((a) => a.container)]) {
      const r = reasonFor(sigil, { scale: scale.id, span: span.id, container });
      reasons += 1;
      if (!r || !r.words.scale || !r.words.span || (container && !r.words.abstraction) || !(r.weight >= 0 && r.weight <= 1)) fail(`reasonFor(${sigil}, ${scale.id}, ${span.id}, ${container || 'no container'}) is empty or out of range`);
    }
  }
  for (const a of ABSTRACTION) if (!placeOf(sigil, a.container)) fail(`placeOf(${sigil}, ${a.container}) is empty`);
}
if (reasonFor('?', { scale: 'nowhere' }) !== null || reasonFor('x') !== null) fail('reasonFor answered for a point or sigil that does not exist');
const bang = placeOf('!', '{ }')?.says || '';
const join = placeOf('&', '< >')?.says || '';
if (!/local/.test(bang) || !/literal/.test(bang)) fail(`a ! in { } should read as a local, literal event: ${bang}`);
if (!/global/.test(join) || !/concept/.test(join)) fail(`a & in < > should read as a global concept of confluence: ${join}`);
const local = collectionReason(['!', '*', '%', '@']);
const wide = collectionReason(['&', '#', '~', '^']);
if (!(local.scale.at < wide.scale.at)) fail(`a thumb's collection should sit more local than a commons collection (${local.scale.at} vs ${wide.scale.at})`);
if (collectionReason([]).size !== 0) fail('an empty collection was given a size');
if (spanOfQuarter(1) !== 'first_evening' || spanOfQuarter(104) !== 'return') fail('the span does not follow the competency arc');
if (QUARTERS !== competency.QUARTERS || BAND_QUARTERS !== competency.BAND_QUARTERS) fail('the gradients restate the long arc differently from competency.mjs');
for (let q = 1; q <= QUARTERS; q += 1) if (Math.ceil(q / BAND_QUARTERS) !== competency.bandOfQuarter(q)) { fail(`quarter ${q}: bands disagree with competency.mjs`); break; }
const labels = /\b(child|children|kid|parent|grandparent|adult|teen|elder|senior|caregiver|toddler|age \d)/i;
SPANS.forEach((s) => { if (labels.test(`${s.behaves} ${s.mood}`)) fail(`span ${s.id} describes who someone is, not what they do: ${s.behaves}`); });

// Parity with spw-interactions.mjs (read as text: it is a browser module with browser imports).
const interactions = read('book/scripts/modules/spw-interactions.mjs');
const roles = Object.fromEntries([...interactions.matchAll(/'(.)':\s*\{\s*role:\s*'([a-z]+)'/g)].map((m) => [m[1], m[2]]));
Object.entries(SIGIL_ROLES).forEach(([sigil, r]) => { if (roles[sigil] !== r.role) fail(`sigil ${sigil}: play graph says ${r.role}, spw-interactions says ${roles[sigil]}`); });
Object.entries(ROLE).forEach(([sigil, r]) => { if (roles[sigil] !== r) fail(`sigil ${sigil}: gradients say ${r}, spw-interactions says ${roles[sigil]}`); });
const spirit = /spirit roles:\s*<#\.> capsule, \(#\.\) scope, \[#\.\] frame, \{#\.\} body/.test(interactions);
const ladder = ABSTRACTION.map((a) => a.container).join(' ');
if (!spirit) fail('spw-interactions no longer lists the spirit roles as capsule, scope, frame, body: check the ladder');
if (ladder !== '{ } [ ] ( ) < >') fail(`the abstraction ladder is ${ladder}, not the spirit sequence read backward`);

console.log(`[play-graph] ${TEXTS.length} texts mapped and projected seven ways; ${reasons} reasons across ${SIGILS.length} sigils, ${SCALES.length} scales, ${SPANS.length} spans and ${ABSTRACTION.length} abstraction steps; 3 negative controls.`);
rows.forEach((r) => console.log(`  ${r}`));
console.log(`  ! in { }: ${bang}`);
console.log(`  & in < >: ${join}`);
console.log(`  a thumb's collection (! * % @): ${local.words}`);
console.log(`  a commons collection (& # ~ ^): ${wide.words}`);
if (fails.length) {
  console.error(`[play-graph] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[play-graph] ok. Structures and counts only: nothing here has been played.');
