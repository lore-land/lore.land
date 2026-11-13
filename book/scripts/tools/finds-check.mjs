#!/usr/bin/env node
// @ts-check
/**
 * finds-check.mjs — holds the finds (pie-finds.mjs) to what .spw/surfaces/finds.spw says of them.
 *
 * Each find's rule is a line of Spw that reads whole in the real parser and in the game's small reader with no word
 * left over. Its steps use verbs the game says, its moment is one the game draws, and the trope it crosses is in
 * tropes.json. It rests on a want or a limit the character already has (characters.mjs REASONS); its words are
 * narration. It opens on a skilled sequence and stays shut on what gifts alone bring: a carry with every gift taken
 * and nothing done by hand. Its sealed line reads back and does not close when cut. It leans the land one named way.
 * What it hands the book is there to be handed: an artifact made in the lanes by its deed (almanac.json) and a margin
 * rumour turned by the same deed (references.json), in narration, or else it says it is held. Nothing here was
 * played: the moment, the deed kept and the room's deepening are walked by npm run smoke.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINDS, LEANS, MOMENTS, VERBS, deedOf, foundLine, mirrored, opens, readFind, take } from '../home/pie-finds.mjs';
import { REASONS } from '../modules/characters.mjs';
// @ts-ignore: the vendored parser carries its own declaration; only parse is used here.
import { parse } from '../vendor/spw-seed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
/** @type {string[]} */
const notes = [];
const HELD = /wap\s*-?\s*boy|wabo|\bhat\b|\bfigure\b|\begg\b|dregg/i;
const SPOKEN = /["“”«»]|\b(I|me|my|we|us|our)\b/;
const tropes = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/tropes.json'), 'utf8')).tropes.map((/** @type {{ id: string }} */ t) => t.id);
const canon = readFileSync(resolve(ROOT, '.spw/surfaces/finds.spw'), 'utf8');
const marks = readFileSync(resolve(ROOT, 'book/scripts/modules/begin-again.mjs'), 'utf8');
/** @type {Array<{ id: string, kind: string, home: number, made_in?: string, made_by?: { deed: string, at_least: number, says: string }, note: string }>} */
const wonders = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/almanac.json'), 'utf8')).wonders;
/** @type {Array<{ id: string, chambers: number[], track?: { lanes?: string, after?: { count?: string, says?: string } } }>} */
const references = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/references.json'), 'utf8')).entries;

if (!marks.includes("'lore.pie.finds.v1'")) fail('lore.pie.finds.v1 is not in READING_MARKS: a fresh copy of the book would keep the finds');
const read = parse(canon, { lexProfile: 'prose' }).completeness;
if (!read?.complete || read.proseFallback) fail('.spw/surfaces/finds.spw does not read whole as Spw');

/** Everything gifts alone bring, with no hand on the carry: dolphins, donuts, roses, a rival's thorns met, no hop or foil. */
const giftsOnly = [['meet', 'boonrose'], ['eat', 'donut'], ['eat', 'donut'], ['meet', 'boonrose'], ['eat', 'donut'], ['eat', 'donut'], ['eat', 'donut']].map(([verb, kind], i) => ({ verb, kind, t: i * 0.2, lane: 2 }));

for (const find of FINDS) {
  const name = `find ${find.id}`;
  const rule = readFind(find.rule);
  if (rule.errors.length) fail(`${name}: ${rule.errors.join('; ')}`);
  if (rule.id !== find.id) fail(`${name}: its rule names ${rule.id}`);
  const whole = parse(find.rule, { lexProfile: 'prose' }).completeness;
  if (!whole?.complete || whole.proseFallback) fail(`${name}: its rule does not read whole as Spw`);
  rule.steps.forEach((s) => { if (!VERBS.includes(s.verb)) fail(`${name}: ${s.verb} is not a verb the game says`); });
  if (!MOMENTS.includes(rule.moment)) fail(`${name}: ${rule.moment} is not a moment the game draws`);
  if (rule.crosses && !tropes.includes(rule.crosses)) fail(`${name}: it crosses ${rule.crosses}, which tropes.json does not have`);
  if (!canon.includes(find.rule)) fail(`${name}: its rule is not written in .spw/surfaces/finds.spw as it runs`);
  if (!LEANS.includes(rule.lean)) fail(`${name}: it needs =lean[boon|bane|bone], the way it leans the land`);

  // What it hands the book, turned by its own deed and nothing else.
  const deed = deedOf(find);
  if (find.made) {
    const made = wonders.find((w) => w.id === find.made);
    if (!made) fail(`${name}: its artifact ${find.made} is not in almanac.json`);
    else if (made.kind !== 'artifact' || made.made_in !== 'lanes' || made.made_by?.deed !== deed || made.made_by.at_least !== 1) fail(`${name}: ${find.made} is not an artifact made in the lanes by ${deed}, at least once`);
    else if (SPOKEN.test(made.note) || HELD.test(made.note) || SPOKEN.test(made.made_by.says)) fail(`${name}: ${find.made} is not told in plain narration`);
  }
  if (find.margin) {
    const margin = references.find((r) => r.id === find.margin);
    if (!margin) fail(`${name}: its margin ${find.margin} is not in references.json`);
    else if (margin.track?.after?.count !== deed || !margin.track.lanes || !/\{\{n\}\}/.test(margin.track.after.says || '')) fail(`${name}: ${find.margin} is not a rumour turned by ${deed}`);
    else if ([margin.track.lanes, margin.track.after.says].some((w) => SPOKEN.test(w || '') || HELD.test(w || ''))) fail(`${name}: ${find.margin} is not told in plain narration`);
  }
  if ((!find.made || !find.margin) && !new RegExp(`${find.id}[^\n]*held`, 'i').test(canon)) fail(`${name}: it hands the book nothing, and .spw/surfaces/finds.spw does not say it is held`);
  if (wonders.some((w) => w.made_by?.deed === deed && w.id !== find.made)) fail(`${name}: another artifact is made by ${deed}`);

  // Grounded in what the character already wants or cannot help; no new plot.
  const reasons = /** @type {Record<string, { want?: string, limit?: string }>} */ (REASONS)[find.who];
  if (!reasons?.[find.grounds]) fail(`${name}: ${find.who} has no ${find.grounds} in characters.mjs to rest on`);
  for (const words of [find.says, find.live, find.riddle]) if (!words || SPOKEN.test(words) || HELD.test(words)) fail(`${name}: its words are not plain narration`);

  // Skill, not ingredients: gifts alone never open it; the skilled sequence does, once, inside its window and no later.
  const carrier = rule.carrier || 'porter';
  if (opens(rule, giftsOnly, { carrier })) fail(`${name}: gifts alone open it`);
  const seq = rule.steps.flatMap((s) => Array(s.count).fill(s)).map((s, i, all) => ({ verb: s.verb, kind: s.kind, t: (i * rule.within) / Math.max(1, all.length), lane: i % 5 }));
  if (!opens(rule, seq, { carrier })) fail(`${name}: its own sequence does not open it`);
  const slow = seq.map((d, i) => ({ ...d, t: i * (rule.within + 0.5) }));
  if (seq.length > 1 && opens(rule, slow, { carrier })) fail(`${name}: it opens when its steps are slower than ~within`);
  if (rule.carrier && opens(rule, seq, { carrier: rule.carrier === 'porter' ? 'clerk' : 'porter' })) fail(`${name}: it opens for a carrier it does not name`);
  if (rule.steps.some((s) => s.lanes > 1) && opens(rule, seq.map((d) => ({ ...d, lane: 2 })), { carrier })) fail(`${name}: it opens from one lane, standing still`);
  if (seq.length > 1 && opens(rule, [...seq].reverse().map((d, i) => ({ ...d, t: i * 0.1 })), { carrier })) {
    if (new Set(seq.map((d) => `${d.verb}${d.kind}`)).size > 1) fail(`${name}: its steps open in the wrong order`);
  }

  // The line: whole, sealed by the name and its mirror, written once by play.
  const at = { day: '2026-11-12', chapter: 5, carrier };
  const line = foundLine(find, at);
  if (!line.includes(`{_${find.id} `) || !line.endsWith(` ${mirrored(find.id)}_}`)) fail(`${name}: its line is not sealed by the name and its mirror`);
  const lineRead = parse(line, { lexProfile: 'prose' }).completeness;
  if (!lineRead?.complete || lineRead.proseFallback) fail(`${name}: its line does not read whole as Spw`);
  const once = take({}, find, at);
  const twice = take(once.record, find, { ...at, day: '2026-11-13' });
  if (!once.first || !once.line || twice.first || twice.line || twice.record[find.id].was !== '2026-11-12' || twice.record[find.id].takes !== 2) fail(`${name}: finding it again changed the day or wrote a second line`);

  notes.push(`${find.id}: ${rule.steps.map((s) => `${s.verb} ${s.kind}${s.count > 1 ? ` ×${s.count}` : ''}${s.lanes > 1 ? ` from ${s.lanes} lanes` : ''}`).join(', then ')} within ${rule.within} s${rule.carrier ? ` as ${rule.carrier}` : ''}; ${rule.moment}; crosses ${rule.crosses}; leans ${rule.lean}; rests on ${find.who}'s ${find.grounds}; hands the book ${find.made && find.margin ? `${find.made} and ${find.margin}` : 'nothing (held)'}`);
}

console.log('[finds] rules, grounds, gates and sealed lines checked against .spw/surfaces/finds.spw.');
notes.forEach((n) => console.log(`  ${n}`));
if (fails.length) {
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[finds] ok. Gifts alone open nothing; nothing here was played. The moments are walked by npm run smoke.');
