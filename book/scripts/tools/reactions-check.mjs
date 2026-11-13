#!/usr/bin/env node
// @ts-check
/**
 * reactions-check.mjs — holds the lanes' reactions to what .spw/surfaces/reactions-in-the-lanes.spw says of them
 * (the reactions trial).
 *
 * Every knock the road can give, every timed power and every word a power can use has someone to answer it, whoever
 * carries. A deed is narration: no quotation marks, no first person, nothing the land keeps back, and short enough
 * to read between dodges. The figure answers with a mood and no deed. Someone standing in the lanes answers before
 * the carrier does, and a second telling is not the first one said again. Nothing here was played or seen.
 */
import { REACTIONS, MOMENTS, MOODS, WHO, GUARDS, deedProblems, ended, powerMoments, reactionFor } from '../home/pie-reactions.mjs';
import { KNOCKS, CARRIERS } from '../home/pie-world.mjs';
import { POWER_SPELLS, readSpells } from '../home/pie-powers.mjs';
import { CAPTION } from '../home/pie-pacing.mjs';

/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
const seeded = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const carriers = CARRIERS.map((/** @type {{ id: string }} */ c) => c.id);

/* ─── Every row is whole, and every deed is narration ─── */
let rows = 0;
for (const [moment, list] of Object.entries(REACTIONS)) {
  for (const r of list) {
    rows += 1;
    if (!['carrier', 'any', ...WHO].includes(r.who)) fail(`${moment}: nobody called ${r.who} can answer`);
    if (!MOODS.includes(r.mood)) fail(`${moment}: ${r.mood} is not a mood a portrait has`);
    if (!r.deed) fail(`${moment}: a row with no deed`);
    deedProblems(r.deed).forEach((why) => fail(`${moment}: "${r.deed}": ${why}`));
    if (r.who === 'figure') fail(`${moment}: the figure is given a row; it answers with a mood and nothing written for it`);
    if (r.when && !['first', 'again', 'often'].includes(r.when)) fail(`${moment}: when ${r.when}`);
  }
}
if (GUARDS.longest > CAPTION.chars) fail('a deed may run longer than a caption line');

/* ─── Everything the road and the spells can do has an answer, for every carrier ─── */
for (const kind of Object.keys(KNOCKS)) if (!REACTIONS[`knock:${kind}`]) fail(`a knock by ${kind} has nobody to answer it`);
const words = new Set();
for (const text of Object.values(POWER_SPELLS)) {
  const power = Object.values(readSpells(String(text)).powers)[0];
  if (!power) { fail(`a book spell did not read: ${text}`); continue; }
  [...Object.keys(power.timed), ...Object.keys(power.charges), ...power.acts, ...Object.keys(power.amounts)].forEach((w) => words.add(w));
  if (!powerMoments(power).length) fail(`*${power.id} is taken and nobody answers`);
  Object.keys(power.timed).forEach((w) => { if (!REACTIONS[`end:${w}`]) fail(`~${w} runs out and nobody notices`); });
}
for (const w of words) if (!REACTIONS[`take:${w}`]) fail(`a power that gives ${w} has nobody to answer it`);
for (const moment of MOMENTS) for (const carrier of carriers) {
  const first = reactionFor(moment, { carrier, rand: seeded() });
  if (!first) { fail(`${moment}: nobody answers when ${carrier} carries`); continue; }
  if (!WHO.includes(first.who)) fail(`${moment}: the answer comes from ${first.who}, who has no portrait`);
  if (first.who === 'figure' && first.deed) fail(`${moment}: the figure was given a deed`);
  if (first.who !== 'figure' && !first.deed) fail(`${moment}: ${first.who} answers with nothing said`);
}

/* ─── Who answers, and when ─── */
const same = (/** @type {object | null} */ a, /** @type {object | null} */ b) => JSON.stringify(a) === JSON.stringify(b);
if (!same(reactionFor('knock:pane', { carrier: 'genie', rand: seeded(3) }), reactionFor('knock:pane', { carrier: 'genie', rand: seeded(3) }))) fail('the same moment with the same chances answered two ways');
if (reactionFor('knock:post', { carrier: 'porter', rand: seeded() })?.deed === reactionFor('knock:post', { carrier: 'clerk', rand: seeded() })?.deed) fail('the porter and the clerk take a post the same way');
if (reactionFor('knock:stone', { carrier: 'clown', rand: seeded() })?.mood !== 'glad') fail('the clown is not glad of a knock');
const wall = reactionFor('knock:mimewall', { carrier: 'porter', present: ['mime'], rand: seeded() });
if (wall?.who !== 'mime' || wall.mood !== 'calm') fail('a mime standing by its struck wall does not answer, calmly');
if (reactionFor('knock:mimewall', { carrier: 'porter', rand: seeded() })?.who !== 'porter') fail('with no mime standing by, the carrier does not answer');
if (reactionFor('knock:clerk', { carrier: 'porter', present: ['clerk'], rand: seeded() })?.who !== 'porter') fail('a clerk standing by answered with the line written for a clerk who carries');
const once = reactionFor('knock:hole', { carrier: 'genie', times: 0, rand: seeded() });
const twice = reactionFor('knock:hole', { carrier: 'genie', times: 1, rand: seeded() });
const often = reactionFor('knock:hole', { carrier: 'genie', times: 1, lifetime: 9, rand: seeded() });
if (!once || !twice || !often || once.deed === twice.deed || twice.deed === often.deed) fail('a second telling, or a tenth, says what the first said');
if (reactionFor('knock:nothing', { carrier: 'genie' }) !== null) fail('negative control: a moment with no rows was answered');

/* ─── The small readers ─── */
if (ended({ lit: 0.02, lag: 3, trueAim: 0.01 }, { lit: 0, lag: 2.9, trueAim: 0 }).join() !== 'end:lit,end:true_aim') fail('timers that ran out were not found');
if (ended({ lit: 0 }, { lit: 0 }).length || ended(null, { lit: 0 }).length) fail('a timer that was not running was said to have run out');
if (powerMoments({ timed: { lit: 7 }, acts: ['ready'], amounts: { crust: 0.1 }, charges: {} }).join() !== 'take:lit,take:ready,take:crust') fail('a power does not give its moments, the lasting one first');
// Negative controls: the guards refuse a spoken line and a held name.
if (!deedProblems('The clerk says "mind it" and files a slip.').length) fail('negative control: a spoken line passed');
if (!deedProblems('Somebody lifts a hat.').length) fail('negative control: a held word passed');

console.log(`[reactions] ${MOMENTS.length} moments, ${rows} rows; every knock, timed power and spell word answered for ${carriers.length} carriers; deeds are narration of at most ${GUARDS.longest} characters.`);
if (fails.length) {
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[reactions] ok. Nothing here was played: a face and a caption are walked by npm run smoke.');
