#!/usr/bin/env node
// @ts-check
/**
 * daily-check.mjs — hold the daily reading (book/scripts/modules/daily.mjs) to its promises.
 *
 * Runs today() across 366 consecutive days from a start date (default today), and across two year
 * boundaries (one into a leap year), and fails on: an empty layer, a chapter past the last released
 * one, a passage whose anchor is not on the prerendered chapter page, a week whose days disagree on
 * the trope, a day whose room is not in a chapter the week's trope is in, or a reading that changes
 * when computed twice. It reports how often the month's lens touches the weeks it overlaps, how many
 * rooms and tropes a year reaches, and parses the two proposed surfaces with the vendored parser.
 *
 *   node book/scripts/tools/daily-check.mjs [--from=YYYY-MM-DD]
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @param {string} rel */
const json = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));

const { prepareDaily, today } = await import('../modules/daily.mjs');
const { TOTAL_CHAPTERS, NEXT_STONE } = await import('../modules/book-extent.mjs');
const { combinatoricsFor, BANDS, hands } = await import('../modules/competency.mjs');

const data = prepareDaily({
  likeness: json('book/content/world/likeness.json'),
  search: json('book/content/search.json'),
  tropes: json('book/content/world/tropes.json'),
  extent: { total: TOTAL_CHAPTERS, next: NEXT_STONE }
});

/** @type {string[]} */
const problems = [];
const fromArg = process.argv.find((a) => a.startsWith('--from='))?.slice(7);
/** @param {string} iso */
const localDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};
const now = new Date();
const start = fromArg ? localDate(fromArg) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

/** @type {Map<string, boolean>} */
const anchorCache = new Map();
/** @param {string} href */
function anchorOnPage(href) {
  if (anchorCache.has(href)) return /** @type {boolean} */ (anchorCache.get(href));
  const [path, id] = href.split('#');
  const file = resolve(ROOT, `.${path}index.html`);
  const ok = existsSync(file) && readFileSync(file, 'utf8').includes(`id="${id}"`);
  anchorCache.set(href, ok);
  return ok;
}

/**
 * @param {Date} from
 * @param {number} count
 * @param {string} label
 */
function run(from, count, label) {
  /** @type {any[]} */
  const readings = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i, 12);
    const r = today(date, { data });
    if (!r) { problems.push(`${label}: no reading for day ${i}`); continue; }
    const again = today(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 5), { data });
    if (JSON.stringify(again) !== JSON.stringify(r)) problems.push(`${r.date}: the reading changes within the day`);
    if (!r.day?.title || !r.day.excerpt || !r.day.spw) problems.push(`${r.date}: empty day layer`);
    if (!r.week?.trope?.id || !r.week.trope.statement) problems.push(`${r.date}: empty week layer`);
    if (!r.month?.lens || !r.month.question) problems.push(`${r.date}: empty month layer`);
    if (!r.quarter?.q || !r.quarter.cluster || !r.quarter.land?.name) problems.push(`${r.date}: empty quarter layer`);
    if (r.day.chapter > TOTAL_CHAPTERS || r.day.chapter < 1) problems.push(`${r.date}: chapter ${r.day.chapter} is not released`);
    if (!r.week.trope.chambers.includes(r.day.chapter)) problems.push(`${r.date}: room in chapter ${r.day.chapter} is outside ${r.week.trope.id}`);
    if (!anchorOnPage(r.day.href)) problems.push(`${r.date}: ${r.day.href} is not an anchor on its prerendered page`);
    if (!r.day.reading) problems.push(`${r.date}: ${r.day.spw} does not read as a room`);
    readings.push(r);
  }
  return readings;
}

const year = run(start, 366, 'year');
const leap = run(new Date(2027, 11, 20, 12), 75, 'into 2028');
const all = [...year, ...leap];

// Weeks: every day of a week shares its trope.
/** @type {Map<number, any[]>} */
const weeks = new Map();
year.forEach((r) => weeks.set(r.week.index, [...(weeks.get(r.week.index) || []), r]));
const fullWeeks = [...weeks.values()].filter((w) => w.length === 7);
const sharedTrope = fullWeeks.filter((w) => new Set(w.map((r) => r.week.trope.id)).size === 1).length;
if (sharedTrope !== fullWeeks.length) problems.push(`${fullWeeks.length - sharedTrope} weeks change trope mid-week`);
const distinctPerWeek = fullWeeks.reduce((s, w) => s + new Set(w.map((r) => r.day.id)).size, 0) / Math.max(1, fullWeeks.length);
const backToBack = year.filter((r, i) => i > 0 && year[i - 1].week.trope.id === r.week.trope.id && year[i - 1].week.index !== r.week.index).length;
if (backToBack) problems.push(`${backToBack} week boundaries repeat a trope`);

// Months: the lens touches the weeks it overlaps when a day in that month leans the month's way.
/** @type {Map<string, Map<number, any[]>>} */
const monthWeeks = new Map();
// Only weeks wholly inside the run: a week cut off at either end may have its leaning day outside it.
const whole = new Set(fullWeeks.map((w) => w[0].week.index));
year.filter((r) => whole.has(r.week.index)).forEach((r) => {
  const key = r.date.slice(0, 7);
  const m = monthWeeks.get(key) || new Map();
  m.set(r.week.index, [...(m.get(r.week.index) || []), r]);
  monthWeeks.set(key, m);
});
let pairs = 0;
let touched = 0;
let touchable = 0;
let missedTouchable = 0;
monthWeeks.forEach((ws) => ws.forEach((days) => {
  pairs += 1;
  const hit = days.some((r) => r.day.withGrain);
  if (hit) touched += 1;
  const trope = days[0].week.trope;
  const can = data.rooms.some((room) => trope.chambers.includes(room.chapter) && room.valence === days[0].month.lens);
  if (can) touchable += 1;
  if (can && !hit) missedTouchable += 1;
}));
if (missedTouchable) problems.push(`${missedTouchable} month-week overlaps could lean the month's way and do not`);
const monthsTouchingAll = [...monthWeeks.values()].filter((ws) => [...ws.values()].every((days) => days.some((r) => r.day.withGrain))).length;
const withGrainDays = year.filter((r) => r.day.withGrain).length;

const roomsReached = new Set(year.map((r) => r.day.id)).size;
const tropesReached = new Set(year.map((r) => r.week.trope.id)).size;
const lenses = new Set(year.map((r) => r.month.lens)).size;
const quarters = new Set(all.map((r) => r.quarter.q));

// Competency: 13 bands cover 1–104 without a gap; hands are counted.
let expect = 1;
BANDS.forEach((b) => {
  if (b.quarters[0] !== expect) problems.push(`band ${b.band} starts at ${b.quarters[0]}, expected ${expect}`);
  expect = b.quarters[1] + 1;
});
if (expect !== 105) problems.push(`the bands end at ${expect - 1}, not 104`);
if (combinatoricsFor(1).clusters.length !== 1 || combinatoricsFor(104).clusters.length !== 7) problems.push('the cone does not widen from 1 to 7');
if (hands(12, { hand: 2, ordered: false, repeats: false }) !== 66) problems.push('C(12,2) is not 66');

// The two proposed surfaces parse whole.
const { parse } = await import('../vendor/spw-seed.mjs');
/** @type {Record<string, string>} */
const parsed = {};
for (const file of ['.spw/surfaces/competency.spw', '.spw/surfaces/cadence.spw']) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) { problems.push(`${file} is missing`); continue; }
  const result = /** @type {any} */ (parse(readFileSync(path, 'utf8'), { lexProfile: 'prose' }));
  const c = result?.completeness || {};
  parsed[file] = `complete ${c.complete}, prose fallback ${c.proseFallback}`;
  if (c.complete !== true || c.proseFallback === true) problems.push(`${file} does not parse whole (${parsed[file]})`);
}

const pct = (/** @type {number} */ a, /** @type {number} */ b) => `${Math.round((a / Math.max(1, b)) * 100)}%`;
console.log(`daily: ${year.length} days from ${year[0]?.date} to ${year.at(-1)?.date}, plus ${leap.length} days ${leap[0]?.date} to ${leap.at(-1)?.date}`);
console.log(`  rooms: ${data.rooms.length} in ${TOTAL_CHAPTERS} chapters; ${roomsReached} reached in the year. Tropes: ${data.tropes.length}; ${tropesReached} reached. Lenses: ${lenses}. Quarters seen: ${[...quarters].join(', ')}`);
console.log(`  weeks: ${sharedTrope} of ${fullWeeks.length} full weeks keep one trope all week; ${distinctPerWeek.toFixed(1)} different rooms a week on average; ${backToBack} trope repeats across a week boundary`);
console.log(`  months: the lens touches ${touched} of ${pairs} month-week overlaps (${pct(touched, pairs)}), and ${touched} of the ${touchable} where the week's trope has a room leaning that way; every overlapping week in ${monthsTouchingAll} of ${monthWeeks.size} months; ${withGrainDays} of ${year.length} days lean the month's way (${pct(withGrainDays, year.length)})`);
console.log(`  anchors: ${anchorCache.size} distinct passages checked on their prerendered pages`);
Object.entries(parsed).forEach(([f, s]) => console.log(`  ${f}: ${s}`));
if (problems.length) {
  console.error(`daily-check: ${problems.length} problem(s)`);
  problems.slice(0, 30).forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log('daily-check: ok');
