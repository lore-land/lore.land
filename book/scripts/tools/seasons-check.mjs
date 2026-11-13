#!/usr/bin/env node
// @ts-check
/**
 * seasons-check.mjs — holds a season to what .spw/surfaces/seasons.spw says of it (the seasons trial).
 *
 * A season has its days, and the event route says the same days. Its spell and what is left of it use only words the
 * lanes know, and what is left is less. What it leaves a reader is a line that reads whole as Spw and is sealed: cut
 * anywhere, it does not close. Being there is written by play inside the days and by nothing else; a line handed
 * over is kept only by someone who was there. Nothing here was played or seen: npm run smoke walks the four states
 * in a browser.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEASONS, SEASON_KINDS, SEASON_SAYS, keptLine, keptProblems, letGo, mirrored, openSeason, readKept, receive, seasonState, standing, take, wasThere } from '../home/pie-seasons.mjs';
import { readSpells } from '../home/pie-powers.mjs';
import { reasonFor } from '../home/pie-reasons.mjs';
import { eventProblems } from '../modules/route-events.mjs';
import { CARRIERS } from '../home/pie-world.mjs';
// @ts-ignore: the vendored parser carries its own declaration; only parse is used here.
import { parse } from '../vendor/spw-seed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
/** @type {string[]} */
const notes = [];
const at = (/** @type {string} */ day) => new Date(`${day}T12:00:00`);
const dayAfter = (/** @type {string} */ day, n = 1) => { const d = at(day); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const HELD = /wap\s*-?\s*boy|wabo|\bhat\b|\bfigure\b|\begg\b|dregg/i;
const SPOKEN = /["“”«»]|\b(I|me|my|we|us|our)\b/;

const events = JSON.parse(readFileSync(resolve(ROOT, 'book/content/events.json'), 'utf8')).events;
const switches = readFileSync(resolve(ROOT, 'book/scripts/modules/reading-switches.mjs'), 'utf8');
const carriers = CARRIERS.map((/** @type {{ id: string }} */ c) => c.id);

if (!/id: 'seasons', attribute: 'data-switch-seasons', stage: 'trial'[\s\S]{0,900}?defaults: \{ returning: 'off', new: 'off' \}/.test(switches)) fail('the seasons switch is not a trial that starts off for everyone');

for (const season of SEASONS) {
  const name = `season ${season.id}`;

  /* ─── Its days, said the same way twice ─── */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(season.opens) || !/^\d{4}-\d{2}-\d{2}$/.test(season.closes) || season.closes < season.opens) fail(`${name}: its days are not a window`);
  const event = events.find((/** @type {{ surface: string }} */ e) => e.surface === season.event);
  if (!event) fail(`${name}: no event ${season.event} says its days outside the game`);
  else {
    if (event.opens !== season.opens || event.closes !== season.closes) fail(`${name}: the event says ${event.opens} to ${event.closes}, the season ${season.opens} to ${season.closes}`);
    eventProblems(event).forEach(fail);
  }
  if (seasonState(season, at(dayAfter(season.opens, -1))) !== 'before' || seasonState(season, at(season.opens)) !== 'open' || seasonState(season, at(season.closes)) !== 'open' || seasonState(season, at(dayAfter(season.closes))) !== 'after') fail(`${name}: it does not open and close on its own days`);
  if (openSeason(at(season.opens))?.id !== season.id || openSeason(at(dayAfter(season.closes))) !== null && openSeason(at(dayAfter(season.closes)))?.id === season.id) fail(`${name}: the open season is not found on its days`);

  /* ─── Its spell, and what is left of it ─── */
  const full = readSpells(season.power);
  const left = readSpells(season.residue);
  const power = Object.values(full.powers)[0];
  const residue = Object.values(left.powers)[0];
  if (!power || !residue || full.errors.length || left.errors.length) fail(`${name}: a spell uses a word the lanes do not know (${[...full.errors, ...left.errors].join(' ')})`);
  else {
    if (power.id !== residue.id) fail(`${name}: what is left is not the same spell`);
    for (const [word, n] of Object.entries(residue.timed)) if (!(n < (power.timed[word] || 0))) fail(`${name}: what is left of ~${word} is not less`);
    if (residue.acts.length || residue.with.length || residue.without.length || Object.keys(residue.amounts).length || Object.keys(residue.charges).length) fail(`${name}: what is left does more than settle`);
    for (const says of [power.says, residue.says]) if (!says || SPOKEN.test(says) || HELD.test(says)) fail(`${name}: a spell's words are not plain narration`);
  }
  for (const text of [season.power, season.residue]) {
    const read = parse(text, { lexProfile: 'prose' });
    if (!read.completeness?.complete || read.completeness.proseFallback) fail(`${name}: a spell does not read whole as Spw`);
  }
  if (!SEASON_KINDS.has(season.kind)) fail(`${name}: ${season.kind} is not something a season sets`);
  if (!reasonFor(season.kind)) fail(`${name}: ${season.kind} is in the road with no reason`);

  /* ─── The line it leaves: whole, sealed, and closed by nothing shorter ─── */
  if (!/^[a-z]+$/.test(season.id)) fail(`${name}: its label has to be letters, so its mirror is one word`);
  let lines = 0;
  for (const carrier of carriers) for (const chapter of [1, 6, 15]) for (const day of [season.opens, season.closes]) {
    const line = keptLine(season, { day, chapter, carrier });
    const kept = readKept(line);
    lines += 1;
    if (!kept || !kept.sealed || kept.id !== season.id || kept.day !== day || kept.chapter !== chapter || kept.carrier !== carrier || !kept.power) { fail(`${name}: a line does not read back as written (${line})`); continue; }
    const problems = keptProblems(line, parse);
    if (problems.length) fail(`${name}: a line has problems: ${problems.join('; ')}`);
    if (!line.includes(`{_${season.id} `) || !line.endsWith(` ${mirrored(season.id)}_}`)) fail(`${name}: a line is not sealed by its label and the label mirrored`);
    for (let cut = 1; cut < line.length; cut += 1) if (readKept(line.slice(0, cut))?.sealed) { fail(`${name}: a line cut at ${cut} still closes`); break; }
    if (readKept(`${line}\n#from["lore.land/pie#kept:${season.id}"]`)?.sealed !== true) fail(`${name}: a line copied with where it is from no longer closes`);
  }
  const sample = keptLine(season, { day: season.opens, chapter: 15, carrier: carriers[0] });
  if (readKept(sample.replace(`${mirrored(season.id)}_}`, `${season.id}_}`))?.sealed) fail(`${name}: negative control: a label that is not mirrored closed the line`);
  if (keptProblems(sample.replace('{_', '{ _x_ {'), parse).length === 0) fail(`${name}: negative control: a broken line had no problems`);

  /* ─── The four states: before, during, after with both, after with the line only ─── */
  const before = at(dayAfter(season.opens, -3));
  const during = at(dayAfter(season.opens, 1));
  const after = at(dayAfter(season.closes, 5));
  const tooSoon = take({}, season, { now: before, chapter: 1, carrier: carriers[0] });
  if (Object.keys(tooSoon.record).length || tooSoon.first || tooSoon.line) fail(`${name}: something was written before the season`);
  if (standing(season, {}, before) !== 'before') fail(`${name}: before its days it does not stand as before`);
  const met = take({}, season, { now: during, chapter: 15, carrier: carriers[1] });
  if (!met.first || !met.line || !wasThere(season, met.record) || standing(season, met.record, during) !== 'open') fail(`${name}: meeting it in its days did not write the day and a line`);
  const again = take(met.record, season, { now: at(season.closes), chapter: 6, carrier: carriers[2] });
  if (again.first || again.line || again.record[season.id].was !== met.record[season.id].was || again.record[season.id].takes !== 2) fail(`${name}: meeting it again changed the day or wrote a second line`);
  if (standing(season, met.record, after) !== 'kept') fail(`${name}: after it, there and holding the line, the place is not kept`);
  const lineOnly = { [season.id]: { line: met.line } };
  if (standing(season, lineOnly, after) !== 'line') fail(`${name}: a line alone stands as more than a line`);
  const handed = receive({}, met.line);
  if (handed.state !== 'tease' || Object.keys(handed.record).length) fail(`${name}: a line handed to someone who was not there was kept, or said they were`);
  const lost = letGo(met.record, season.id);
  if (standing(season, lost, after) !== 'was' || !wasThere(season, lost)) fail(`${name}: letting the line go forgot the day`);
  const back = receive(lost, met.line);
  if (back.state !== 'held' || standing(season, back.record, after) !== 'kept') fail(`${name}: a line handed back to someone who was there did not set the place again`);
  if (receive(met.record, met.line.slice(0, -6)).state !== 'cracked') fail(`${name}: a line cut short was not refused`);
  if (receive(met.record, '@carry["x"]{ }').state !== 'unread') fail(`${name}: something that is not a kept line was read as one`);
  if (standing(season, {}, after) !== 'after') fail(`${name}: with nothing of it, after its days it is not simply over`);
  // Negative controls: a day outside the window is not being there, and a late take writes nothing.
  if (wasThere(season, { [season.id]: { was: dayAfter(season.closes, 1), line: met.line } })) fail(`${name}: negative control: a day after the season counted as being there`);
  if (Object.keys(take({}, season, { now: after, chapter: 1, carrier: carriers[0] }).record).length) fail(`${name}: negative control: something was written after the season`);

  /* ─── The words ─── */
  const says = /** @type {Record<string, Record<string, string>>} */ (/** @type {unknown} */ (SEASON_SAYS))[season.id];
  if (!says) fail(`${name}: nothing says its moments`);
  else for (const [moment, words] of Object.entries(says)) if (SPOKEN.test(words) || HELD.test(words)) fail(`${name}: ${moment} is not plain narration`);

  notes.push(`${season.id}: ${season.opens} to ${season.closes}, as ${season.event} says; ${lines} lines read whole and sealed, and none closes when cut; before, open, kept, line, was and after all reached`);
}

console.log('[seasons] days, spells, sealed lines and the four states checked against .spw/surfaces/seasons.spw.');
notes.forEach((n) => console.log(`  ${n}`));
if (fails.length) {
  fails.forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[seasons] ok. Nothing here was played: the lanes, the paste and the end card are walked by npm run smoke.');
