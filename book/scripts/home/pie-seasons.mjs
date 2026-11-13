// @ts-check
/**
 * pie-seasons.mjs — what a season sets by the road, and what it leaves (a trial: the seasons switch). Pure: the game
 * places and draws; this decides.
 *
 * A season is a few days when the land sets something in the lanes that it does not set the rest of the year. The
 * first is a Thursday that is kept, and the days after it: the city sets a place by the road early, the cloth, the
 * cup and the plate of Chapter 15, and passing it settles the pie. (The Feast of the Uneven Slice itself is at the
 * Turning of the Year, as Chapter 14 has it; this is not the feast.) A season carries its days with it, so nobody
 * takes it for a lasting thing.
 *
 * What a season leaves is a line. A reader who met the season in play is remembered as having been there (a day,
 * counted in play and never set from an address or a paste) and is handed one line of Spw, sealed: its body opens
 * with a label and closes with the label mirrored, so a line cut short in passing does not close. After the season
 * the place is still set, more faintly, for a reader who was there and still holds a sealed line. The line may be
 * given away. To someone who was not there it is a line about a Thursday, and the lanes say so.
 *
 * A game, not a lock: both halves live in the reader's own browser, in the open, and can be written by hand.
 * Nobody here says anything: the words below are narration. (.spw/surfaces/seasons.spw)
 */

// @ts-ignore: a page loads it with its version token, which the type checker cannot resolve; the shapes are route-events.mjs's.
import { eventState, localDay } from '../modules/route-events.mjs?v=2026_11_11.A';

/** What a season puts in the lanes. */
export const SEASON_KINDS = Object.freeze(new Set(['place', 'dolphin', 'donut']));

/**
 * What a season sets besides its own kind, each with its spell: the Ring Tide's donuts, rings of dough on the road.
 * A donut is a boost and never the season's key; only the season's own kind hands over a line.
 */
export const SEASON_EXTRAS = Object.freeze({
  donut: '*donut{ %filling[0.15] *tin[2] ~warm[4] #says["A ring of dough on the road, still warm from the tide. The filling is fed, the pie settles faster, and the next two slices fill half again as much appetite."] }'
});

/**
 * @typedef {{ id: string, name: string, from: string, event: string, opens: string, closes: string, kind: string, power: string, residue: string }} Season
 * @typedef {{ was?: string, takes?: number, line?: string }} SeasonMark
 * @typedef {Record<string, SeasonMark>} SeasonRecord
 * @typedef {{ id: string, label: string, sealed: boolean, day: string, chapter: number, carrier: string, power: string }} KeptLine
 */

/**
 * The seasons, each with its days (the reader's local calendar days, both ends counted), the event route that says
 * the same days to someone outside the game, the spell it plays while open, and what is left of that spell after.
 * Every word a spell uses is one the lanes already know (pie-powers.mjs), so its numbers are held to their ranges.
 * @type {ReadonlyArray<Season>}
 */
export const SEASONS = Object.freeze([
  Object.freeze({
    id: 'thursday',
    name: 'The Thursday that was kept',
    from: 'the Thursday that was kept',
    event: 'thursday.lore.land',
    opens: '2026-11-26',
    closes: '2026-11-29',
    kind: 'place',
    power: '*kept_place{ ~warm[8] !ready &with[berry] #says["The city has set a place by the road, early: a cloth, a cup and a plate, for the one who is coming. The pie settles as if it had been expected, and a slice is ready."] }',
    residue: '*kept_place{ ~warm[4] #says["The place is still set. The pie settles a little, as it did that Thursday."] }'
  }),
  Object.freeze({
    id: 'ringtide',
    name: 'The Ring Tide',
    from: 'the Ring Tide',
    event: 'ringtide.lore.land',
    opens: '2026-11-12',
    closes: '2026-11-14',
    kind: 'dolphin',
    extras: ['donut'],
    power: '*ring_tide{ ~unkept[6] ~lag[3] !level &without[puddle] #says["The salt under the crust comes up as a tide, and a dolphin comes up with it and carries the pie a while. The pie levels, the puddles ahead go down to the sea, the land runs slow, and nothing in the lanes can hold you."] }',
    residue: '*ring_tide{ ~unkept[2] #says["A dolphin still comes up for whoever met the tide. For a moment nothing in the lanes can hold you."] }'
  })
]);

/** How the game says each moment of a season. Narration, not anyone's line. */
export const SEASON_SAYS = Object.freeze({
  ringtide: Object.freeze({
    tag: 'CARRIED BY A DOLPHIN',
    stillTag: 'A DOLPHIN, STILL',
    meet: 'The Ring Tide',
    kept: 'A line to keep',
    keptLine: 'The Ring Tide leaves you one line of Spw, sealed at both ends. It is with your carries, under Provenance. Keep it: after these days a dolphin still comes up for whoever was here and still holds the line.',
    still: 'A dolphin, after the tide',
    ended: 'You kept a line from the Ring Tide. It is with your carries.',
    tease: 'A line from the Ring Tide. It answers to whoever was there.',
    cracked: 'That line does not close: a kept line opens with a label and ends with the same label mirrored. This one was cut short on the way.',
    held: 'A sealed line from the Ring Tide, and you were there. It is kept with your carries.',
    carried: 'A sealed line from the Ring Tide, carried in an address. An address keeps nothing: paste the line here and it is kept.',
    gone: 'Let go. The land still knows you were there; a sealed line from the Ring Tide brings a dolphin up again.'
  }),
  thursday: Object.freeze({
    tag: 'A PLACE, SET EARLY',
    stillTag: 'STILL SET',
    meet: 'A place is set',
    kept: 'A line to keep',
    keptLine: 'The Thursday leaves you one line of Spw, sealed at both ends. It is with your carries, under Provenance. Keep it: after these days the place stays set for whoever was here and still holds the line.',
    still: 'The place is still set',
    ended: 'You kept a line from the Thursday. It is with your carries.',
    tease: 'A line from a Thursday that was kept. It answers to whoever was there.',
    cracked: 'That line does not close: a kept line opens with a label and ends with the same label mirrored. This one was cut short on the way.',
    held: 'A sealed line from the Thursday, and you were there. It is kept with your carries.',
    carried: 'A sealed line from the Thursday, carried in an address. An address keeps nothing: paste the line here and it is kept.',
    gone: 'Let go. The land still knows you were there; a sealed line from that Thursday sets the place again.'
  })
});

/** @param {string} id @returns {Season | null} */
export const seasonById = (id) => SEASONS.find((s) => s.id === id) || null;

/**
 * Where a season stands on a day: before, open or after. One notion of a day and of a window, the events' own.
 * @param {Season} season @param {Date} now @returns {'before' | 'open' | 'after'}
 */
export const seasonState = (season, now) =>
  /** @type {'before' | 'open' | 'after'} */ (eventState({ surface: season.event, kind: 'promo', view: 'promo', title: season.name, opens: season.opens, closes: season.closes }, { now }).state);

/** The season open on a day, if any. @param {Date} now @returns {Season | null} */
export const openSeason = (now) => SEASONS.find((s) => seasonState(s, now) === 'open') || null;

/** A label mirrored, as a sealed line closes: feast, tsaef. @param {string} label */
export const mirrored = (label) => [...String(label)].reverse().join('');

/**
 * The line a season leaves: the day the reader was there, where and as whom, and what is left of the season's spell,
 * between a label and its mirror.
 * @param {Season} season @param {{ day: string, chapter: number, carrier: string }} at
 */
export function keptLine(season, { day, chapter, carrier }) {
  const who = String(carrier || 'figure').replace(/[^a-z0-9_-]/gi, '') || 'figure';
  const power = season.residue.replace(/\s*#says\["[^"]*"\]/, '').replace(/\s+/g, ' ').trim();
  return `^kept[${season.id}]{_${season.id} .day["${day}"] .chapter[${Math.max(1, Math.round(Number(chapter)) || 1)}] .carrier[${who}] ${power} ${mirrored(season.id)}_}`;
}

const HEAD = /^\^kept\[([a-z][a-z0-9_-]*)\]\s*\{/i;

/**
 * A kept line, read: its season, its label, whether its seal closes, and what it holds. null for anything else.
 * The small reader; the game also reads the line whole with the real parser when that has arrived (keptProblems).
 * @param {string} text @returns {KeptLine | null}
 */
export function readKept(text) {
  const src = String(text || '').replace(/#from\["[^"]*"\]/g, '').trim();
  const head = HEAD.exec(src);
  if (!head) return null;
  const closes = src.endsWith('}');
  const inner = src.slice(head[0].length, closes ? -1 : undefined).trim();
  const label = (/^_([a-z][a-z0-9_-]*)(?=\s|$)/i.exec(inner) || [])[1] || '';
  const tail = (/(?:^|\s)([a-z0-9][a-z0-9_-]*)_$/i.exec(inner) || [])[1] || '';
  const id = head[1].toLowerCase();
  return {
    id,
    label,
    sealed: closes && Boolean(label) && label.toLowerCase() === id && tail === mirrored(label),
    day: (/\.day\["(\d{4}-\d{2}-\d{2})"\]/.exec(inner) || [])[1] || '',
    chapter: Number((/\.chapter\[(\d+)\]/.exec(inner) || [])[1]) || 0,
    carrier: (/\.carrier\[([a-z][a-z0-9_-]*)\]/i.exec(inner) || [])[1] || '',
    power: (/\*[a-z][a-z0-9_-]*\s*\{[^{}]*\}/i.exec(inner) || [])[0] || ''
  };
}

/**
 * What is wrong with a kept line, in words, as the real parser reads it: it has to read whole, with nothing left
 * as prose. @param {string} text @param {(src: string, opts?: object) => any} parse @returns {string[]}
 */
export function keptProblems(text, parse) {
  const kept = readKept(text);
  if (!kept) return ['it is not a kept line'];
  /** @type {string[]} */
  const problems = [];
  if (!seasonById(kept.id)) problems.push(`the lanes know no season called ${kept.id}`);
  if (!kept.sealed) problems.push('its seal does not close');
  if (!kept.power) problems.push('it holds no spell');
  let read = null;
  try { read = parse(String(text).replace(/#from\["[^"]*"\]/g, '').trim(), { lexProfile: 'prose' }); } catch { read = null; }
  if (!read?.completeness?.complete || read.completeness.proseFallback) problems.push('it does not read whole as Spw');
  return problems;
}

/** Was this reader there: a day inside the season's own days. @param {Season} season @param {SeasonRecord | null | undefined} record */
export const wasThere = (season, record) => {
  const was = record?.[season.id]?.was;
  return typeof was === 'string' && was >= season.opens && was <= season.closes;
};

/** Does this reader hold a sealed line for the season. @param {Season} season @param {SeasonRecord | null | undefined} record */
export const holdsLine = (season, record) => {
  const kept = readKept(record?.[season.id]?.line || '');
  return Boolean(kept && kept.id === season.id && kept.sealed && kept.power);
};

/**
 * Where a reader stands with a season on a day.
 *   before  it has not come            open   it is on, for everyone
 *   kept    over; they were there and hold a sealed line: the place stays set
 *   was     over; they were there and hold no line
 *   line    over; they hold a line and were not there
 *   after   over, and nothing of it is here
 * @param {Season} season @param {SeasonRecord | null | undefined} record @param {Date} now
 * @returns {'before' | 'open' | 'kept' | 'was' | 'line' | 'after'}
 */
export function standing(season, record, now) {
  const state = seasonState(season, now);
  if (state !== 'after') return state;
  const there = wasThere(season, record);
  const holds = holdsLine(season, record);
  if (there && holds) return 'kept';
  if (there) return 'was';
  return holds ? 'line' : 'after';
}

/**
 * The season's place, met in play on a day. Only an open season writes: the day (once), the count, and a line the
 * first time. Returns the record after it, whether this was the first meeting, and the line if one was just written.
 * @param {SeasonRecord | null | undefined} record @param {Season} season @param {{ now: Date, chapter: number, carrier: string }} at
 * @returns {{ record: SeasonRecord, first: boolean, line: string }}
 */
export function take(record, season, { now, chapter, carrier }) {
  const all = { ...(record || {}) };
  if (seasonState(season, now) !== 'open') return { record: all, first: false, line: '' };
  const had = all[season.id] || {};
  const first = !wasThere(season, all);
  const was = first ? localDay(now) : /** @type {string} */ (had.was);
  const line = had.line && holdsLine(season, all) ? had.line : keptLine(season, { day: was, chapter, carrier });
  all[season.id] = { was, takes: (Number(had.takes) || 0) + 1, line };
  return { record: all, first, line: line === had.line ? '' : line };
}

/**
 * A line handed over. It is kept only by someone who was there; it never says that anyone was.
 *   held     sealed, and they were there: kept          tease   sealed, and they were not: shown, not kept
 *   cracked  its seal does not close                    unread  not a kept line, or no season the lanes know
 * @param {SeasonRecord | null | undefined} record @param {string} text
 * @returns {{ record: SeasonRecord, state: 'held' | 'tease' | 'cracked' | 'unread', season: Season | null }}
 */
export function receive(record, text) {
  const all = { ...(record || {}) };
  const kept = readKept(text);
  const season = kept ? seasonById(kept.id) : null;
  if (!kept || !season) return { record: all, state: 'unread', season: null };
  if (!kept.sealed || !kept.power) return { record: all, state: 'cracked', season };
  if (!wasThere(season, all)) return { record: all, state: 'tease', season };
  all[season.id] = { ...all[season.id], line: String(text).replace(/#from\["[^"]*"\]/g, '').trim() };
  return { record: all, state: 'held', season };
}

/** A kept line let go. The day stays: the land knows who was there. @param {SeasonRecord | null | undefined} record @param {string} id */
export function letGo(record, id) {
  const all = { ...(record || {}) };
  if (all[id]) { const { line: _gone, ...rest } = all[id]; all[id] = rest; }
  return all;
}
