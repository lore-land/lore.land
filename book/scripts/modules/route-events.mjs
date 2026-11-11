// @ts-check
/**
 * route-events.mjs — routes that are events: surfaces read through lore.land's ?/ door that open, run and close.
 *
 * The door already reads lore.land/?/<surface>/<parts> (texture-routes.mjs). A surface is named like a domain, so an
 * event is named like a subdomain of what it belongs to: day.lore.land (a standing event, always open), stone.lore.land
 * (the next chapter's release, dated by the serial), and any promotional event a line in book/content/events.json adds,
 * with a window and words for before, during and after. Nothing here is a page of its own: every event is an address,
 * and an address can be passed along, printed, or said aloud.
 *
 *   ?/day.lore.land                 today's reading          ?/day.lore.land/*2026-11-13   that day's
 *   ?/stone.lore.land               the next stone           ?/<name>.lore.land            a promotional event
 *
 * An entry: { surface, kind: standing | release | promo, view: day | stone | promo, title, says,
 *   opens?, closes? (YYYY-MM-DD, the reader's local day), before?, during?, after? (words), lands? (a ?/ route or a
 *   site path) }. Portable: no DOM.
 */

export const EVENTS_URL = '/book/content/events.json';
export const EVENT_KINDS = Object.freeze(['standing', 'release', 'promo']);
export const EVENT_VIEWS = Object.freeze(['day', 'stone', 'promo']);
const SURFACE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** @typedef {{ surface: string, kind: string, view: string, title: string, says?: string, opens?: string, closes?: string, before?: string, during?: string, after?: string, lands?: string }} RouteEvent */

/** The reader's local calendar day, as YYYY-MM-DD. @param {Date} date */
export const localDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
/** Whole days from one calendar day to another. @param {string} from @param {string} to */
export const daysBetween = (from, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);

/** The events, from their file. A file that will not load is no events, never fatal. @returns {Promise<RouteEvent[]>} */
export async function loadEvents(get = (/** @type {string} */ url) => fetch(url).then((r) => (r.ok ? r.json() : null))) {
  const file = await get(EVENTS_URL).catch(() => null);
  return Array.isArray(file?.events) ? file.events : [];
}

/**
 * Where an event stands on a day: { ...event, state: open | before | after, opens, closes, days (to opening, or
 * since closing) }. A release opens on the serial's next stone; a standing event is always open.
 * @param {RouteEvent} event
 * @param {{ now?: Date, nextStone?: { chapter: number, date: string } | null, released?: number }} [at]
 */
export function eventState(event, { now = new Date(), nextStone = null, released = 0 } = {}) {
  const day = localDay(now);
  let opens = event.opens || null;
  const closes = event.closes || null;
  if (event.kind === 'release' && nextStone) opens = nextStone.date;
  if (event.kind === 'standing') return { ...event, state: 'open', opens, closes, days: 0 };
  if (event.kind === 'release' && nextStone && released >= nextStone.chapter) return { ...event, state: 'open', opens, closes, days: 0 };
  if (opens && day < opens) return { ...event, state: 'before', opens, closes, days: daysBetween(day, opens) };
  if (closes && day > closes) return { ...event, state: 'after', opens, closes, days: daysBetween(closes, day) };
  return { ...event, state: 'open', opens, closes, days: 0 };
}

/** The event a route names, if any. @param {{ surface?: string | null } | null} route @param {RouteEvent[]} events */
export const eventFor = (route, events) => (route?.surface ? events.find((e) => e.surface === route.surface) || null : null);

/** What is wrong with an entry, in words (for a check). @param {RouteEvent} e */
export function eventProblems(e) {
  const at = `event ${e?.surface || '?'}`;
  /** @type {string[]} */
  const problems = [];
  if (!e?.surface || !SURFACE.test(e.surface)) problems.push(`${at}: the surface must be named like a domain (name.lore.land)`);
  if (!EVENT_KINDS.includes(e?.kind)) problems.push(`${at}: kind must be one of ${EVENT_KINDS.join(', ')}`);
  if (!EVENT_VIEWS.includes(e?.view)) problems.push(`${at}: view must be one of ${EVENT_VIEWS.join(', ')}`);
  if (!e?.title) problems.push(`${at}: it needs a title`);
  ['opens', 'closes'].forEach((k) => { const v = /** @type {any} */ (e)?.[k]; if (v != null && !DAY.test(v)) problems.push(`${at}: ${k} must be YYYY-MM-DD`); });
  if (e?.opens && e?.closes && e.closes < e.opens) problems.push(`${at}: it closes before it opens`);
  if (e?.kind === 'promo' && !e.opens) problems.push(`${at}: a promotional event needs the day it opens`);
  if (e?.kind === 'promo' && !(e.before && e.during)) problems.push(`${at}: a promotional event says something before it opens and while it runs`);
  if (e?.lands && !/^(\?\/|\/)/.test(e.lands)) problems.push(`${at}: lands must be a ?/ route or a site path`);
  return problems;
}
