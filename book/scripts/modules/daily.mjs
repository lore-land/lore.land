/**
 * daily.mjs — a reading for every day, layered: a passage for the day, a trope for the week, a
 * twist for the month, a band and a teaching metaphor for the quarter. PROPOSED
 * (.spw/surfaces/cadence.spw). Every word it shows is already in the canon: a room of a released
 * chapter (its title, its signature, the first lines of its own text), a trope's own statement, a
 * lens's own question. Nothing here writes prose, and it does not replace the stones: new chapters
 * are still set on the 13th and 26th.
 *
 * The layers nest so a reader meets things again:
 *   week     one trope; each day of the week is a room in a chapter that trope is in
 *   day      one room of that trope's chapters, a different one each day while the chapters last
 *   month    one land of the triangle (boon, bane, bone), the same all month: the passage is linked
 *            to read in that lens. A quarter turns the triangle once, one land a month. Calendar
 *            months, not moons, so three of them make a quarter exactly. Each week, at least one day
 *            is a room that already leans the month's way, when the trope's chapters have one.
 *   quarter  the land's own quarter of the long arc (competency.mjs): which teaching metaphor faces
 *            the pupil, and how wide the cone is. A reader's own reach is passed in, never guessed.
 *
 * Dates are the reader's local calendar day (a day starts at their midnight). today() is pure:
 * pass the date and the prepared data; prepareDaily() builds that data from the site's own JSON
 * (likeness.json rooms, search.json passages, tropes.json, book-extent.mjs).
 */
import { readRoom } from './room-signature.mjs?v=2026_11_08.W';
import { LENSES } from './valence-lens.mjs?v=2026_09_27.A';
import { combinatoricsFor, focusOfQuarter, bandOfQuarter, coneRadius, clustersInView, CLUSTERS, QUARTERS } from './competency.mjs?v=2026_11_11.A';

/** The quarter the serial began in (Chapter One's file is from July 2026): quarter 1 of the arc. */
export const ARC_START = Object.freeze({ year: 2026, quarter: 3 });
/** One land a month; a quarter turns the triangle once. */
export const LENS_TURN = Object.freeze(['boon', 'bane', 'bone']);
const EXCERPT_CHARS = 280;
const DAY_MS = 86400000;

const pad2 = (n) => String(n).padStart(2, '0');

/* ─── Calendar: local days, Monday weeks, calendar months and quarters ─── */

/** The reader's calendar day as a whole number (days since 1970-01-01 on their own calendar). */
export function dayNumber(date) {
  const d = date instanceof Date ? date : new Date(date);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}
/** A day number back to its calendar parts. */
const partsOf = (day) => {
  const d = new Date(day * DAY_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
/** Weeks start on a Monday (1970-01-01 was a Thursday). */
const weekOf = (day) => Math.floor((day + 3) / 7);
const weekdayOf = (day) => (((day + 3) % 7) + 7) % 7;
const lensOfMonth = (m) => LENS_TURN[m % 3];

/** The arc's quarter (1–104) for a calendar month, from ARC_START; the arc begins again after 104. */
export function arcQuarter(year, month) {
  const raw = (year - ARC_START.year) * 4 + Math.floor(month / 3) - (ARC_START.quarter - 1) + 1;
  return ((((raw - 1) % QUARTERS) + QUARTERS) % QUARTERS) + 1;
}

/* ─── Determinism: a small seeded shuffle ─── */

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function shuffled(items, seed) {
  let s = hash(seed) || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ─── Data: built once from the site's own JSON ─── */

/** The first lines of a passage, cut at a sentence end where one falls in reach, else at a word. */
export function excerptOf(text, max = EXCERPT_CHARS) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '), cut.lastIndexOf('.” '), cut.lastIndexOf('?” '));
  if (end > max * 0.45) return cut.slice(0, end + (cut[end + 1] === '”' ? 2 : 1));
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * The data today() reads. likeness: book/content/world/likeness.json; search: book/content/search.json;
 * tropes: book/content/world/tropes.json; extent: { total: TOTAL_CHAPTERS, next: NEXT_STONE }.
 * Rooms past the last released chapter, and tropes with no released room, are left out.
 */
export function prepareDaily({ likeness, search, tropes, extent }) {
  const total = Number(extent?.total) || 0;
  const passages = new Map((search?.entries || []).map((e) => [`/book/chapter/${pad2(e.c)}/#${e.id}`, e]));
  const rooms = Object.values(likeness?.items || {})
    .filter((item) => item.kind === 'room' && item.chapter >= 1 && item.chapter <= total && passages.has(item.href))
    .map((item) => ({
      id: item.id,
      title: item.title,
      href: item.href,
      chapter: item.chapter,
      valence: item.valence || null,
      container: item.container,
      spw: item.spw,
      characters: item.characters || [],
      excerpt: excerptOf(passages.get(item.href).text)
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const chapters = new Set(rooms.map((r) => r.chapter));
  const tropeList = (tropes?.tropes || [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      sigil: t.sigil,
      statement: t.statement,
      chambers: (t.faces?.story?.chambers || []).filter((c) => chapters.has(c))
    }))
    .filter((t) => t.chambers.length)
    .sort((a, b) => a.id.localeCompare(b.id));
  return { rooms, tropes: tropeList, total, next: extent?.next || null };
}

/* ─── The layers ─── */

/** The week's trope: every trope once a cycle, in a shuffled order, never the same two weeks running. */
function tropeOfWeek(week, data) {
  const n = data.tropes.length;
  const cycle = Math.floor(week / n);
  const order = (c) => {
    const o = shuffled(data.tropes, `tropes:${c}`);
    if (c > 0) {
      const before = shuffled(data.tropes, `tropes:${c - 1}`);
      if (o[0].id === before[n - 1].id && n > 1) [o[0], o[1]] = [o[1], o[0]];
    }
    return o;
  };
  return order(cycle)[((week % n) + n) % n];
}

/**
 * The week's seven rooms, Monday first: the trope's rooms in a shuffled order, none twice until
 * all have been read. Then, if no day's room already leans the way its month reads, one day that
 * can be is given a room that does (the month's twist touches the week).
 */
function roomsOfWeek(week, trope, data) {
  const pool = shuffled(data.rooms.filter((r) => trope.chambers.includes(r.chapter)), `week:${week}:${trope.id}`);
  const firstDay = week * 7 - 3;
  const days = Array.from({ length: 7 }, (_, k) => ({ day: firstDay + k, lens: lensOfMonth(partsOf(firstDay + k).m), room: pool[k % pool.length] }));
  // A week can straddle two months, so each month's part of it is touched on its own.
  [...new Set(days.map((d) => d.lens))].forEach((lens) => {
    const part = days.map((d, k) => ({ ...d, k })).filter((d) => d.lens === lens);
    if (part.some((d) => d.room.valence === lens)) return;
    const room = pool.find((r) => r.valence === lens && !days.some((x) => x.room === r)) || pool.find((r) => r.valence === lens);
    if (!room) return;   // the trope's chapters have no room leaning this way
    const at = part[hash(`grain:${week}:${lens}`) % part.length].k;
    days[at] = { ...days[at], room };
  });
  return days;
}

/**
 * Today's layered reading.
 * @param {Date | string | number} date the reader's moment; its local calendar day is used
 * @param {{ data: ReturnType<typeof prepareDaily>, reach?: number | null }} options reach: a band (1–13) the reader chose, if any
 */
export function today(date, { data, reach = null } = /** @type {any} */ ({})) {
  if (!data?.rooms?.length || !data.tropes?.length) return null;
  const day = dayNumber(date);
  const { y, m, d } = partsOf(day);
  const week = weekOf(day);
  const weekday = weekdayOf(day);
  const trope = tropeOfWeek(week, data);
  const days = roomsOfWeek(week, trope, data);
  const room = days[weekday].room;
  const lens = lensOfMonth(m);
  const lensWords = LENSES.find((l) => l.id === lens) || { id: lens, label: lens, question: '', gloss: '' };
  const [path, anchor] = room.href.split('#');
  const q = arcQuarter(y, m);
  const landBand = bandOfQuarter(q);
  const focus = focusOfQuarter(q);
  const chosen = Number.isInteger(reach) && reach >= 1 && reach <= 13 ? reach : null;
  const next = data.next && data.next.date ? { chapter: data.next.chapter, date: data.next.date, days: Math.round((Date.parse(`${data.next.date}T00:00:00Z`) / DAY_MS) - day) } : null;
  return {
    date: `${y}-${pad2(m + 1)}-${pad2(d)}`,
    day: {
      ...room,
      reading: readRoom(room.spw),
      lensHref: `${path}?lens=${lens}#${anchor}`,
      withGrain: room.valence === lens
    },
    week: {
      index: week,
      weekday,
      trope,
      rooms: days.map((x) => ({ title: x.room.title, chapter: x.room.chapter, href: x.room.href, today: x.day === day }))
    },
    month: { lens, label: lensWords.label, question: lensWords.question, gloss: lensWords.gloss, turn: (m % 3) + 1 },
    quarter: {
      q,
      of: QUARTERS,
      year: Math.ceil(q / 4),
      band: landBand,
      focus: focus.id,
      cluster: CLUSTERS.find((c) => c.id === focus.id),
      cone: coneRadius(landBand),
      clusters: clustersInView(focus.id, coneRadius(landBand)).map((c) => c.id),
      land: combinatoricsFor({ quarter: q }),
      reach: chosen ? combinatoricsFor({ band: chosen, focus: focus.id }) : null
    },
    next
  };
}
