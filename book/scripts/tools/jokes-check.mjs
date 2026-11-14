#!/usr/bin/env node
// @ts-check
/**
 * jokes-check.mjs — holds the callbacks (pie-jokes.mjs) to .spw/surfaces/jokes.spw and to the registry (npm run jokes:check).
 *
 * Each callback's rule is a line of Spw that reads whole in the real parser and in the game's small reader with no word
 * left over, and is written in jokes.spw as it runs. Its cost is a signed edge the workbench itself reads (readBias):
 * who pays, for what, boon or bane. Its carrier is one the lanes have and never the figure; its margin is one a reader
 * can hear; its setup is a moment the lanes raise. It crosses a trope it is grounded in (the kind of its setup is that
 * trope's in the lanes, or its margin sits in one of that trope's chambers), and the trope lists it. Every beat names
 * where its words already are, and they are there: a row of pie-reactions.mjs, or sentences of a released paragraph with
 * no slot, in narration. It lands once a carry at its count, for the carrier and reader it is armed for and nobody else,
 * and a payoff the lanes already say is not spent before it. Negative controls show each guard can fail. Nothing here
 * was played: npm run smoke walks a carry.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOKES, READ, FAMILIES, readJoke, meet, saving, wordsOf, quoteOf, rowOf, jokeDeed, QUOTED } from '../home/pie-jokes.mjs';
import { REACTIONS, MOODS, WHO, deedProblems, reactionFor } from '../home/pie-reactions.mjs';
import { CARRIERS, KNOCKS } from '../home/pie-world.mjs';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';
// @ts-ignore: the vendored parser carries its own declaration; parse and readBias are used here.
import { parse, readBias } from '../vendor/spw-seed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
/** @type {string[]} */
const notes = [];
const readJSON = (/** @type {string} */ rel) => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));
/** @type {Array<{ id: string, faces?: any, jokes?: Array<{ id: string, deed: string }> }>} */
const tropes = readJSON('book/content/world/tropes.json').tropes;
/** @type {Array<{ id: string, chambers?: number[], track?: { lanes?: string } }>} */
const references = readJSON('book/content/world/references.json').entries;
const canon = readFileSync(resolve(ROOT, '.spw/surfaces/jokes.spw'), 'utf8');
const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
/** @type {Record<number, any>} */
const chapters = Object.fromEntries(QUOTED.filter((n) => n >= 1 && n <= TOTAL_CHAPTERS).map((n) => [n, readJSON(`book/content/chapters/${pad(n)}.json`)]));
const reactions = /** @type {Record<string, ReadonlyArray<{ who: string, mood: string, deed: string }>>} */ (/** @type {unknown} */ (REACTIONS));
const SPOKEN = /["“”«»]|\b(I|me|my|mine|we|us|our)\b/;
const carriers = new Set(CARRIERS.map((c) => c.id));
const raised = new Set([...Object.keys(KNOCKS).map((k) => `knock:${k}`), ...Object.keys(REACTIONS).filter((k) => k.includes(':'))]);

const whole = (/** @type {string} */ src) => { const c = parse(src, { lexProfile: 'prose' })?.completeness; return Boolean(c?.complete && !c.proseFallback); };
/** The signed edges the workbench reads in a line. @param {string} src */
function edgesOf(src) {
  /** @type {Array<{ anchor: string, target: string, valence: string[] }>} */
  const out = [];
  const seen = new WeakSet();
  const walk = (/** @type {any} */ node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (node.type === 'Operation' && node.operator?.value === '=') {
      const bias = /** @type {any} */ (readBias(node));
      if (bias?.anchor?.value) out.push({ anchor: bias.anchor.value, target: bias.targets?.[0]?.value || '', valence: bias.valence || [] });
    }
    Object.values(node).forEach((v) => (Array.isArray(v) ? v.forEach(walk) : v && typeof v === 'object' ? walk(v) : null));
  };
  walk(parse(src, { lexProfile: 'prose' })?.ast);
  return out;
}
/** Whether a rule may cross a trope: its setup's kind is the trope's in the lanes, or its margin sits in a chamber of it.
 * @param {ReturnType<typeof readJoke>} rule @param {{ faces?: any }} trope */
function grounded(rule, trope) {
  const kind = rule.setup.split(':')[1] || '';
  if (kind && (trope.faces?.lanes?.kinds || []).includes(kind)) return true;
  const margin = references.find((r) => r.id === rule.heard);
  return Boolean(margin && (margin.chambers || []).some((n) => (trope.faces?.story?.chambers || []).includes(n)));
}

/** What is wrong with a beat: a chapter not out, a mood or a face the lanes lack, words not where it says, or words
 * that are not narration. @param {NonNullable<(typeof JOKES)[number]['beats'][number]>} beat @returns {string[]} */
function beatProblems(beat) {
  /** @type {string[]} */
  const problems = [];
  if ('chapter' in beat) {
    if (beat.chapter > TOTAL_CHAPTERS) return [`Chapter ${beat.chapter} is not out`];
    if (!MOODS.includes(/** @type {any} */ (beat.mood))) problems.push(`${beat.mood} is not a mood`);
    if (beat.who !== 'carrier' && !WHO.includes(beat.who)) problems.push(`${beat.who} cannot answer in the lanes`);
  } else if (!rowOf(reactions, beat)) problems.push(`pie-reactions.mjs has no ${beat.row} row for ${beat.who}`);
  const said = wordsOf(beat, { reactions, chapters });
  if (!said) return [...problems, 'its words are not where it says (a moved paragraph, a slot, or no such row)'];
  deedProblems(said.words).forEach((p) => problems.push(`“${said.words}” ${p}`));
  if (SPOKEN.test(said.words)) problems.push(`“${said.words}” is somebody speaking`);
  return problems;
}

const read = parse(canon, { lexProfile: 'prose' })?.completeness;
if (!read?.complete || read.proseFallback) fail('.spw/surfaces/jokes.spw does not read whole as Spw');
const ids = new Set(JOKES.map((j) => j.id));
if (ids.size !== JOKES.length) fail('two callbacks share a name');

for (const { joke, rule } of READ) {
  const name = `callback ${joke.id}`;
  if (rule.errors.length) fail(`${name}: ${rule.errors.join('; ')}`);
  if (rule.id !== joke.id) fail(`${name}: its rule names ${rule.id}`);
  if (!whole(joke.rule)) fail(`${name}: its rule does not read whole as Spw`);
  if (!canon.includes(joke.rule)) fail(`${name}: its rule is not written in .spw/surfaces/jokes.spw as it runs`);

  // The cost: one signed edge, read by the workbench as the small reader reads it.
  const edges = edgesOf(joke.rule);
  if (edges.length !== 1 || !rule.cost) fail(`${name}: it needs exactly one signed edge for who pays (=bane@who{ @what })`);
  else if (edges[0].anchor !== rule.cost.who || edges[0].target !== rule.cost.what || !edges[0].valence.includes(rule.cost.sign)) fail(`${name}: the workbench reads its cost as ${JSON.stringify(edges[0])}, not ${JSON.stringify(rule.cost)}`);
  if (rule.cost && !carriers.has(rule.cost.who) && !WHO.includes(rule.cost.who)) fail(`${name}: ${rule.cost.who} pays, and the lanes have nobody by that name`);

  // Who, what is heard, what is met.
  if (rule.carrier && (!carriers.has(rule.carrier) || rule.carrier === 'figure')) fail(`${name}: ${rule.carrier} is not a carrier a callback can ride`);
  const margin = rule.heard ? references.find((r) => r.id === rule.heard) : null;
  if (rule.heard && !margin?.track?.lanes) fail(`${name}: ${rule.heard} is not a margin a reader hears (references.json, with a track)`);
  const family = rule.setup.split(':')[0];
  if (!FAMILIES.includes(family)) fail(`${name}: ${family} is not a family of moments the lanes raise`);
  if (rule.setup.includes(':') && !raised.has(rule.setup)) fail(`${name}: the lanes never raise ${rule.setup}`);

  // Its count and its beats: one for every meeting, the last one there, every one resolved to words already written.
  if (joke.beats.length !== rule.count) fail(`${name}: %count[${rule.count}] but ${joke.beats.length} beats`);
  const last = joke.beats[joke.beats.length - 1];
  if (!last) fail(`${name}: its payoff beat says nothing`);
  else if (rule.payoff === 'lanes' && !('row' in last)) fail(`${name}: ^payoff[lanes] lands a row the lanes already say`);
  else if (rule.payoff.startsWith('chapter_') && !('chapter' in last && `chapter_${last.chapter}` === rule.payoff)) fail(`${name}: ^payoff[${rule.payoff}] lands that chapter's own words`);
  joke.beats.forEach((beat, i) => { if (beat) beatProblems(beat).forEach((p) => fail(`${name} beat ${i + 1}: ${p}`)); });

  // The trope it crosses: there, grounded, and listing it by name and deed.
  const trope = tropes.find((t) => t.id === rule.crosses);
  if (!trope) fail(`${name}: it crosses ${rule.crosses}, which tropes.json does not have`);
  else {
    if (!grounded(rule, trope)) fail(`${name}: it crosses ${rule.crosses}, and neither its setup's kind nor its margin's chapter is that trope's`);
    const listed = (trope.jokes || []).find((j) => j.id === joke.id);
    if (!listed || listed.deed !== jokeDeed(joke)) fail(`${name}: ${rule.crosses} does not list it as { id: ${joke.id}, deed: ${jokeDeed(joke)} }`);
  }

  // It lands once a carry, at its count, for whom it is armed: the right carrier, the margin heard, never the figure.
  /** @type {Record<string, unknown>} */
  const heard = rule.heard ? { [rule.heard]: '2026-11-13' } : {};
  const tally = () => /** @type {Record<string, number>} */ ({});
  const carrier = rule.carrier || 'porter';
  const moment = rule.setup.includes(':') ? rule.setup : `${rule.setup}:post`;
  /** @type {Record<string, number>} */
  const counts = {};
  const got = Array.from({ length: rule.count + 1 }, () => meet(moment, { carrier, heard, counts }));
  joke.beats.forEach((beat, i) => {
    const m = got[i];
    if (beat && (!m || m.joke.id !== joke.id || m.index !== i)) fail(`${name}: meeting ${i + 1} did not give beat ${i + 1}`);
    if (!beat && m?.joke.id === joke.id) fail(`${name}: meeting ${i + 1} gave a beat it does not have`);
  });
  if (!got[rule.count - 1]?.last) fail(`${name}: it did not land at its count`);
  if (got[rule.count]?.joke.id === joke.id) fail(`${name}: it landed twice in one carry`);
  const others = [...carriers].filter((c) => c !== carrier);
  if (rule.carrier && others.some((c) => { const n = tally(); return [1, 2, 3, 4].some(() => meet(moment, { carrier: c, heard, counts: n })?.joke.id === joke.id); })) fail(`${name}: it plays for a carrier it does not name`);
  if (rule.heard && [1, 2, 3, 4].some(() => meet(moment, { carrier, heard: {}, counts: tally() })?.joke.id === joke.id)) fail(`${name}: it plays for a reader who never heard ${rule.heard}`);
  if (meet(moment, { carrier: 'figure', heard, counts: tally() })?.joke.id === joke.id) fail(`${name}: it plays while the figure carries`);

  // A payoff the lanes already say is saved for it: held from the reactions until it lands, and freed after.
  // A family's payoff is tried at every moment of the family: the thing's own row when it has one, held all the same.
  if (rule.payoff === 'lanes' && last && 'row' in last) {
    const held = saving({ carrier, heard, counts: tally() }, reactions);
    const at = rule.setup.includes(':') ? [rule.setup] : [...raised].filter((m) => m.startsWith(`${rule.setup}:`));
    /** @type {Set<string>} */
    const landed = new Set();
    for (const m of at) {
      const payoff = rowOf(reactions, last, m)?.deed || '';
      landed.add(payoff);
      if (!held.includes(payoff)) fail(`${name}: at ${m} its payoff row is not held back before it lands`);
      const early = [0, 1].flatMap((times) => [0, 1, 2, 3, 4].map(() => reactionFor(m, { carrier, times, lifetime: times, hold: held })?.deed));
      if (early.includes(payoff)) fail(`${name}: at ${m} the reactions said its payoff before the count`);
    }
    if (saving({ carrier, heard, counts }, reactions).length) fail(`${name}: its payoff row is still held after it landed`);
    notes.push(`${joke.id}: lands ${landed.size} rows of its own across ${at.length} moments; ${held.length} held until then`);
  }

  const beatsSaid = joke.beats.map((b) => (b ? `“${wordsOf(b, { reactions, chapters, moment })?.words}”` : '(the lanes as they are)')).join(' → ');
  notes.push(`${joke.id}: ${rule.setup}${rule.setup.includes(':') ? '' : ' (thing by thing)'} ×${rule.count}${rule.carrier ? ` as ${rule.carrier}` : ''}${rule.heard ? `, once ${rule.heard} is heard` : ''}; crosses ${rule.crosses}; ${rule.cost?.sign} on ${rule.cost?.who} for ${rule.cost?.what}: ${beatsSaid}`);
}

// Every callback a trope lists is one that runs.
tropes.forEach((t) => (t.jokes || []).forEach((j) => { if (!ids.has(j.id)) fail(`tropes ${t.id}: lists a callback ${j.id} that pie-jokes.mjs does not have`); }));

// Negative controls: each guard above can fail.
const control = (/** @type {string} */ what, /** @type {boolean} */ caught) => { if (!caught) fail(`negative control did not fail: ${what}`); };
control('an unknown word', readJoke('?joke[x]{ ~setup[knock:pane] %count[3] ^payoff[lanes] #crosses[records] =bane@porter{ @x } !shout[loud] }').errors.length > 0);
control('a callback with no cost', readJoke('?joke[x]{ ~setup[knock:pane] %count[3] ^payoff[lanes] #crosses[records] }').errors.length > 0);
control('a callback the figure carries', readJoke('?joke[x]{ @carrier[figure] ~setup[knock:pane] %count[3] ^payoff[lanes] =bane@porter{ @x } }').errors.length > 0);
control('a line the workbench does not read whole', !whole('?joke[x]{ ~setup[knock:pane] %count[3'));
control('a cost the workbench reads as someone else', edgesOf('?joke[x]{ =bane@kiln{ @pane } }')[0]?.anchor !== 'porter');
const fifteen = chapters[15] || readJSON('book/content/chapters/15.json');
control('a quote whose opening moved', !quoteOf(fifteen, { chapter: 15, section: 3, para: 4, sentences: [4, 5], starts: 'Most clerks', who: 'porter', mood: 'calm' }));
control('a quote from a paragraph with a slot', !quoteOf(fifteen, { chapter: 15, section: 1, para: 3, starts: 'Boof', who: 'porter', mood: 'calm' }));
control('a quote past the paragraph', !quoteOf(fifteen, { chapter: 15, section: 3, para: 5, sentences: [0, 3], starts: 'He wrote', who: 'porter', mood: 'calm' }));
control('a callback crossing a trope it is not grounded in', !grounded(readJoke('?joke[x]{ ~setup[knock:clerk] %count[3] ^payoff[lanes] #crosses[glimpse] =bane@porter{ @x } }'), tropes.find((t) => t.id === 'glimpse') || {}));
control('a quote from a chapter not out', beatProblems({ chapter: TOTAL_CHAPTERS + 1, section: 1, para: 1, starts: '', who: 'porter', mood: 'calm' }).length > 0);
control('a row the reactions do not have', beatProblems({ row: 'knock:clerk', who: 'bonewap' }).length > 0);
control('a beat in a voice', beatProblems({ chapter: 15, section: 3, para: 6, starts: 'Then', who: 'porter', mood: 'calm' }).some((p) => /speaking|somebody speaks/.test(p)));

console.log(`[jokes] ${JOKES.length} callbacks checked against .spw/surfaces/jokes.spw and the registry.`);
notes.forEach((n) => console.log(`  ${n}`));
if (fails.length) {
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[jokes] ok. Every beat is words already written; nothing here was played. npm run smoke walks a carry.');
