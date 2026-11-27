// @ts-check
/**
 * lands.mjs — boon.land, bane.land and bone.land, read through lore.land's ?/ door.
 *
 *   lore.land/?/bane.land                      the land: its sign, its weather, its bylaws, its rooms
 *   lore.land/?/bane.land/*the-receipt-office  one room, first
 *
 * The lands live in book/content/world/lands.json (canon and guards: .spw/surfaces/three-lands.spw). Each room
 * keeps one plain rule, and a room twinned with a chapter is the room that chapter leans toward; the chapter
 * carries a door back in its relatedRoutes (kicker Twinned), so the book and the lands point at each other.
 * Portable: the page and the checks (book:check) share it. No DOM at import.
 */

export const LANDS_SRC = '/book/content/world/lands.json';
export const TWIN_KICKER = 'Twinned';

/** @typedef {{ id: string, room: string, rule: string, residents: string, want: string, twinned: number[], from?: string }} LandRoom */
/** @typedef {{ id: string, lean: string, question: string, danger: string, welcome: string, distance: string, weather: string, bylaws: string[], berries: string, rooms: LandRoom[] }} Land */

/** The lands, or none if the file will not load (never fatal). @returns {Promise<Land[]>} */
export async function loadLands({ get = (/** @type {string} */ url) => fetch(url).then((r) => (r.ok ? r.json() : null)) } = {}) {
  const doc = await get(LANDS_SRC).catch(() => null);
  return Array.isArray(doc?.lands) ? doc.lands : [];
}

/** The address of a land, or of one room in it. @param {string} land @param {string} [room] */
export const landRoute = (land, room) => `?/${land}${room ? `/*${room}` : ''}`;

/** The room a chapter is twinned with, if any. @param {Land[]} lands @param {number} chapter */
export function twinOf(lands, chapter) {
  for (const land of lands) {
    const room = land.rooms.find((r) => (r.twinned || []).includes(chapter));
    if (room) return { land, room };
  }
  return null;
}

/* What no room may hold (three-lands.spw guards): a line someone says, a child, or what the book keeps unexplained. */
const SPOKEN = /["“”]/;
const HELD = /\b(child|children|kid|kids|egg|hat|figure)\b/i;

/**
 * What is wrong with the lands, in words (book:check). `routesOf(n)` gives chapter n's relatedRoutes.
 * @param {any} doc @param {{ chapters: number, routesOf: (n: number) => { label?: string, href?: string, kicker?: string }[] }} book
 */
export function landProblems(doc, { chapters, routesOf }) {
  /** @type {string[]} */
  const problems = [];
  const lands = Array.isArray(doc?.lands) ? doc.lands : [];
  if (lands.length !== 3) problems.push(`lands: three lands, not ${lands.length}`);
  /** @type {Map<number, string>} */
  const twinOfChapter = new Map();
  for (const land of lands) {
    const at = `land ${land.id || '?'}`;
    if (!/^[a-z]+\.land$/.test(land.id || '')) problems.push(`${at}: an id like boon.land`);
    ['question', 'danger', 'welcome', 'distance', 'weather', 'berries'].forEach((key) => { if (!land[key]) problems.push(`${at}: says its ${key}`); });
    if (!Array.isArray(land.bylaws) || !land.bylaws.length) problems.push(`${at}: keeps a bylaw or two`);
    const ids = new Set();
    for (const room of land.rooms || []) {
      const here = `${at} · ${room.id || '?'}`;
      if (!/^[a-z0-9-]+$/.test(room.id || '')) problems.push(`${here}: an id of lowercase words`);
      if (ids.has(room.id)) problems.push(`${here}: twice`);
      ids.add(room.id);
      ['room', 'rule', 'residents', 'want'].forEach((key) => { if (!room[key]) problems.push(`${here}: says its ${key}`); });
      const words = `${room.rule} ${room.residents} ${room.want}`;
      if (SPOKEN.test(words)) problems.push(`${here}: nobody speaks in a room; describe what they do`);
      if (HELD.test(words)) problems.push(`${here}: names something the lands keep out (a child, the figure, the hat or the Egg)`);
      for (const n of room.twinned || []) {
        if (!Number.isInteger(n) || n < 1 || n > chapters) { problems.push(`${here}: twinned with chapter ${n}, which is not set`); continue; }
        if (twinOfChapter.has(n)) problems.push(`chapter ${n}: twinned twice (${twinOfChapter.get(n)} and ${land.id}/${room.id})`);
        twinOfChapter.set(n, `${land.id}/${room.id}`);
        const door = `/${landRoute(land.id, room.id)}`;
        if (!routesOf(n).some((r) => r.kicker === TWIN_KICKER && r.href === door)) problems.push(`chapter ${n}: twinned with ${land.id}/${room.id}, but carries no door to ${door}`);
      }
    }
  }
  for (let n = 1; n <= chapters; n += 1) {
    const doors = routesOf(n).filter((r) => r.kicker === TWIN_KICKER);
    if (!twinOfChapter.has(n)) problems.push(`chapter ${n}: twinned with no room in the lands`);
    if (doors.length > 1) problems.push(`chapter ${n}: more than one Twinned door`);
    doors.forEach((d) => { if (twinOfChapter.get(n) && d.href !== `/?/${twinOfChapter.get(n)?.replace('/', '/*')}`) problems.push(`chapter ${n}: its Twinned door goes to ${d.href}, not to its twin`); });
  }
  return problems;
}
