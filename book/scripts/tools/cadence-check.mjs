#!/usr/bin/env node
// @ts-check
/**
 * cadence-check.mjs — a line of Spw as a loop, held to its promises without a browser (npm run cadence:check).
 *
 * The same line twice is the same loop. Every sign and container changes the loop it is in. Every character plays a
 * sample of lines, and no two play them alike. The mime keeps the most silence of anyone voiced; BoneWAP swings least;
 * the figure is unvoiced. Every ring's ids are its own. And lines that should not read whole are said not to.
 */
import { cadenceOf, loopOf, shapeOf, cadenceRingSVG, signatureRing, PLAYERS, SIGIL_BEATS, CONTAINER_BEATS, playerFor } from '../modules/spw-cadence.mjs';

/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
const seed = await import('../vendor/spw-seed.mjs').catch(() => null);
const parse = seed?.parse || null;
if (!parse) fail('the vendored parser could not be loaded');

const SAMPLES = [
  '@boof{ ?scent !dig ~ &berry ^up .ground }',
  '^board{ @hold[one_thumb] =frame[fill] %lanes[0.9] }',
  '=bane@pie{ @mime }',
  '*hand[3]{ %from[5] =ordered[no] }',
  '<boon>.land@boof',
  '!honk (pie pie pie) {clown} #slip $glass ~'
];

// Deterministic: the same line, the same loop.
SAMPLES.forEach((line) => PLAYERS.forEach((who) => {
  if (JSON.stringify(cadenceOf(line, who, { parse })) !== JSON.stringify(cadenceOf(line, who, { parse }))) fail(`${who} plays ${line} differently twice`);
}));

// Every sign and container changes the loop it is put in (each is heard).
const plain = JSON.stringify(loopOf('dig berry up').steps);
Object.keys(SIGIL_BEATS).forEach((sigil) => {
  const lines = [`${sigil}dig berry up`, `dig ${sigil} berry up`, `dig ${sigil}berry up`];
  if (lines.every((line) => JSON.stringify(loopOf(line).steps) === plain)) fail(`${sigil} changes nothing in the loop`);
});
Object.keys(CONTAINER_BEATS).forEach((open) => {
  const close = { '[': ']', '{': '}', '(': ')', '<': '>' }[open];
  if (JSON.stringify(loopOf(`dig ${open}berry up${close}`).steps) === plain) fail(`${open}${close} changes nothing in the loop`);
});

// Every character plays every sample, and no two characters play a sample alike.
/** @type {Record<string, { rests: number, swing: number, hits: number }>} */
const totals = {};
SAMPLES.forEach((line) => {
  const seen = new Map();
  PLAYERS.forEach((who) => {
    const c = cadenceOf(line, who, { parse });
    if (!c.steps.length) fail(`${who} has no loop for ${line}`);
    if (!c.says) fail(`${who} plays ${line} without saying what they did`);
    if (/["“”]/.test(c.says)) fail(`${who}: a reading is a description, not a line`);
    const key = JSON.stringify(c.steps.map((s) => [s.at, s.dur, s.accent, s.pitch, s.rest, Boolean(s.chord)]));
    if (seen.has(key) && who !== 'figure') fail(`${who} plays ${line} exactly as ${seen.get(key)} does`);
    seen.set(key, who);
    const shape = shapeOf(c);
    const t = (totals[who] = totals[who] || { rests: 0, swing: 0, hits: 0 });
    t.rests += shape.rests / Math.max(1, c.steps.length);
    t.swing += shape.swing;
    t.hits += shape.hits;
  });
});
const voiced = PLAYERS.filter((p) => p !== 'figure');
const mostRests = voiced.reduce((a, b) => (totals[b].rests > totals[a].rests ? b : a));
if (mostRests !== 'mime') fail(`the most silence belongs to ${mostRests}, not the mime`);
const leastSwing = Math.min(...voiced.map((p) => totals[p].swing));
if (totals.bonewap.swing > leastSwing + 1e-9) fail(`BoneWAP swings ${totals.bonewap.swing}, more than the least (${leastSwing})`);
if (totals.bonewap.swing !== 0) fail('BoneWAP swings at all');
if (totals.figure.hits !== 0) fail('the figure is voiced');
if (cadenceOf(SAMPLES[0], 'figure').says !== 'Nobody has said.') fail('the figure says something about itself');

// Every ring's ids are its own, across characters and across a second drawing of the same one.
const svgs = [...PLAYERS.map((who) => cadenceRingSVG(cadenceOf(SAMPLES[0], who))), ...PLAYERS.filter((p) => p !== 'figure').map((who) => signatureRing(who)), signatureRing('boof')];
const ids = svgs.flatMap((svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const dup = ids.find((id, i) => ids.indexOf(id) !== i);
if (dup) fail(`two drawings share the id ${dup}`);
svgs.forEach((svg, i) => { if (!/^<svg[\s\S]*<\/svg>$/.test(svg)) fail(`ring ${i} is not one whole drawing`); });

// Who a line names.
[['boonwap', 'boon'], ['banewap', 'bane'], ['torch-ants', 'ants'], ['nobody', '']].forEach(([word, want]) => { if (playerFor(word) !== want) fail(`@${word} plays as "${playerFor(word)}", not "${want}"`); });

// Negative controls: lines that do not read whole say so, and are still heard as far as they read.
if (parse) {
  ['=tap[go', "^board{ =tap[go] the maker's }", '@boof{ ?scent'].forEach((line) => {
    const c = cadenceOf(line, 'boof', { parse });
    if (c.whole !== false || !/did not read it whole/.test(c.reader)) fail(`${line} is not said to read short (${c.reader})`);
    if (!c.steps.some((s) => !s.rest)) fail(`${line} is not heard at all`);
  });
  const whole = cadenceOf(SAMPLES[0], 'boof', { parse });
  if (!whole.whole || whole.reader !== 'spw-seed') fail(`a whole line is not said to read whole (${whole.reader})`);
}
if (cadenceOf('', 'boof').steps.some((s) => !s.rest)) fail('an empty line makes notes');

console.log(`[cadence] ${PLAYERS.length} players × ${SAMPLES.length} lines, ${Object.keys(SIGIL_BEATS).length} signs and ${Object.keys(CONTAINER_BEATS).length} containers heard, ${ids.length} ring ids.`);
voiced.forEach((p) => console.log(`  ${p.padEnd(8)} rests ${(totals[p].rests / SAMPLES.length).toFixed(2)} of each loop · swing ${(totals[p].swing / SAMPLES.length).toFixed(3)}`));
if (fails.length) {
  console.error(`[cadence] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[cadence] ok. Nothing here was heard: the loops are counted, not listened to.');
