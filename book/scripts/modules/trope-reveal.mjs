// @ts-check
/**
 * trope-reveal.mjs — a trope shows only as far as a reader has come with it (.spw/surfaces/elaboration.spw).
 *
 * Five stages, each said in words the book already has (book/content/world/tropes.json) and in one Spw expression:
 *   seed     its prop, nothing more: the pie, the drawing, the hat-shaped absence         ~[trope]
 *   hint     how it looks in play or on the page (faces.visual / faces.lanes)               ?[trope]{ @lanes }
 *   named    its name and statement                                                        #[trope]{ !prop }
 *   turned   how it crosses from one strand to the other (crossings), and what it bends    &[trope]{ @story @lanes }
 *   paid     what the story does with it (faces.story), once its last chamber is released ^[trope]{ =boon@story{ @chapter_N } }
 * A stage climbs with what a reader has done with the trope: chambers read, crossings met in the lanes, words cast at
 * the desk, refrains the parser finds recurring (rhymes.json), and (with the shelves trial) how the reader's shelves
 * lean with it. A trope turns only once it has been met in two strands, and pays only once its paying chamber has
 * been read; nothing shows from a chapter not yet released.
 *
 * Host-neutral at import: no storage is touched until a function asks.
 */
import { TOTAL_CHAPTERS } from './book-extent.mjs';

export const STAGES = Object.freeze(['seed', 'hint', 'named', 'turned', 'paid']);
/** Moments of a carry a trope can be met at in the lanes, when no thing passed is its kind (tropes.json
 * faces.lanes.moments): the spill every carry ends in, Friday arriving in Fourteen's leg, and the plates the end card
 * counts. pie-game.mjs meets each at most once a carry (metAt); elaboration-check holds the list to the game. */
export const LANES_MOMENTS = Object.freeze(['spill', 'friday', 'plates']);
export const STORE_KEY = 'lore.tropes.v1';
export const RHYMES_URL = '/book/content/world/rhymes.json';

/** @typedef {{ id: string, name: string, statement?: string, prop?: string, bends?: string[], sigil?: string, faces?: any, crossings?: any }} Trope */
/** @typedef {{ read: number, lastRead: boolean, lanes: number, desk: number, seen: number, refrains: number, shelf: number }} Signals */
/** @typedef {{ stage: string, index: number, words: string, spw: string, deepen: string }} Reveal */

const snake = (/** @type {string} */ s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'it';
const cap = (/** @type {string} */ s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const end = (/** @type {string} */ s) => (s && !/[.!?…]$/.test(s.trim()) ? `${s.trim()}.` : String(s || '').trim());

/** The chambers a trope is told in, and the last of them released. @param {Trope} trope */
export function chambersOf(trope, released = TOTAL_CHAPTERS) {
  /** @type {number[]} */
  const all = (trope?.faces?.story?.chambers || []).map(Number).filter(Number.isFinite);
  return { all, released: all.filter((/** @type {number} */ n) => n <= released), payoff: all.length ? Math.max(...all) : null };
}

/** Each stage's words for a trope, from tropes.json only. @param {Trope} trope */
export function stageWords(trope) {
  const faces = trope?.faces || {};
  const turned = [trope?.crossings?.into_lanes?.says, (trope?.bends || []).length ? `It bends ${(trope.bends || []).join(' and ')}.` : ''].filter(Boolean).map(end).join(' ');
  return {
    seed: end(cap(trope?.prop || trope?.name || '')),
    hint: end(faces.visual?.says || faces.lanes?.says || trope?.statement || ''),
    named: end(`${trope?.name}: ${trope?.statement || ''}`),
    turned: turned || end(trope?.crossings?.into_story?.says || trope?.statement || ''),
    paid: end(faces.story?.says || trope?.crossings?.into_story?.says || '')
  };
}

/** Each stage's Spw expression for a trope (every one reads whole: elaboration-check holds them to it). @param {Trope} trope */
export function stageSpw(trope, released = TOTAL_CHAPTERS) {
  const id = snake(trope?.id);
  const prop = snake(trope?.prop || 'it');
  const { payoff } = chambersOf(trope, released);
  return {
    seed: `~[${id}]`,
    hint: `?[${id}]{ @lanes }`,
    named: `#[${id}]{ !${prop} }`,
    turned: `&[${id}]{ @story @lanes }`,
    paid: `^[${id}]{ =boon@story{ @chapter_${payoff ?? 0} } }`
  };
}

/* What would deepen a trope from each stage: an action, never a label on a reader. */
const DEEPEN = Object.freeze({
  seed: 'Read on, or carry the pie: it is in the next room you will meet it in.',
  hint: 'Read a chapter it is told in, or meet it in the lanes, and it has a name.',
  named: 'Meet it in the other strand (the book if you met it carrying, the lanes if you met it reading), and it turns.',
  turned: 'Read the chapter where it pays off.',
  paid: 'It has said all it has to say, for now.'
});

/**
 * The stage a reader has reached with a trope. Never a stage whose chapter is unreleased.
 * @param {Trope} trope
 * @param {Partial<Signals>} [signals]
 * @param {{ released?: number }} [opts]
 * @returns {Reveal}
 */
export function revealStage(trope, signals = {}, { released = TOTAL_CHAPTERS } = {}) {
  const s = { read: 0, lastRead: false, lanes: 0, desk: 0, seen: 0, refrains: 0, shelf: 0, ...signals };
  const score = s.read * 1 + s.lanes * 0.6 + s.desk * 0.8 + s.seen * 0.2 + Math.min(4, s.refrains) * 0.15 + Math.max(0, Math.min(1, s.shelf)) * 0.5;
  const strands = (s.read > 0 ? 1 : 0) + (s.lanes > 0 || s.desk > 0 ? 1 : 0);
  const { all, payoff } = chambersOf(trope, released);
  const allReleased = all.length > 0 && all.every((/** @type {number} */ n) => n <= released);
  let index = 0;
  if (score >= 0.2) index = 1;
  if (score >= 1) index = 2;
  if (score >= 2.2 && strands >= 2) index = 3;
  if (score >= 3.5 && strands >= 2 && s.lastRead && allReleased) index = 4;
  // A stage that would speak from an unreleased chapter waits: the hint and the name are already public canon, the
  // turn needs a released chamber to have been met in, and the payoff needs every chamber out.
  if (index >= 3 && !all.some((/** @type {number} */ n) => n <= released)) index = 2;
  if (index === 4 && (!allReleased || payoff == null)) index = 3;
  const stage = STAGES[index];
  return { stage, index, words: stageWords(trope)[/** @type {keyof ReturnType<typeof stageWords>} */ (stage)], spw: stageSpw(trope, released)[/** @type {keyof ReturnType<typeof stageSpw>} */ (stage)], deepen: DEEPEN[/** @type {keyof typeof DEEPEN} */ (stage)] };
}

/* ─── The stores ─────────────────────────────────────────────────────── */

const readJSON = (/** @type {string} */ key, /** @type {any} */ fallback) => {
  try { return JSON.parse(globalThis.localStorage?.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
};

/**
 * A reader met a trope: in the lanes (a crossing), reading (its passage reached) or at the desk (written). Kept in
 * lore.tropes.v1 as { [id]: { crossed: { lanes, read, desk }, seen, at } }.
 * @param {string} tropeId
 * @param {'lanes' | 'read' | 'desk'} how
 */
export function noteCrossing(tropeId, how) {
  if (!tropeId || !['lanes', 'read', 'desk'].includes(how)) return;
  try {
    const store = readJSON(STORE_KEY, {}) || {};
    const entry = store[tropeId] && typeof store[tropeId] === 'object' ? store[tropeId] : { crossed: {}, seen: 0, at: '' };
    entry.crossed = { lanes: 0, read: 0, desk: 0, ...(entry.crossed || {}) };
    entry.crossed[how] = (Number(entry.crossed[how]) || 0) + 1;
    entry.seen = (Number(entry.seen) || 0) + 1;
    entry.at = new Date().toISOString().slice(0, 10);
    store[tropeId] = entry;
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(store));
    globalThis.dispatchEvent?.(new CustomEvent('lore:trope', { detail: { id: tropeId, how } }));
  } catch { /* a crossing not kept: the reveal stays where it was */ }
}

/* Refrains (rhymes.json, built by book/scripts/tools/rhymes-build.mjs): loaded once, held here. */
/** @type {any} */
let rhymes = null;
/** @type {Promise<any> | null} */
let rhymesPromise = null;
/** Hand the refrains in directly (a page that has them, or a node check). @param {any} doc */
export const setRhymes = (doc) => { rhymes = doc && typeof doc === 'object' ? doc : null; };
/** Load the refrains (in a browser). Resolves to the document, or null. */
export function loadRhymes(url = RHYMES_URL) {
  if (rhymes) return Promise.resolve(rhymes);
  if (!rhymesPromise) {
    rhymesPromise = (typeof fetch === 'function' ? fetch(url).then((r) => (r.ok ? r.json() : null)) : Promise.resolve(null))
      .then((doc) => { setRhymes(doc); return rhymes; })
      .catch(() => null);
  }
  return rhymesPromise;
}
/** The refrains and templates that serve a trope, [] if none or not loaded. @param {string} tropeId */
export function refrainsFor(tropeId) {
  return (rhymes?.rhymes || []).filter((/** @type {any} */ r) => (r.tropes || []).includes(tropeId));
}

/**
 * What revealStage reads, from where it is kept: the chapters opened (lore.chapter.progress.v1 visited), the trope's
 * own crossings (lore.tropes.v1), its refrains, and, with the shelves trial on, how the reader's genre dial leans
 * toward the lean the trope's own words carry (lean: boon/bane/bone counts the valence lens reads, passed in).
 * @param {string} tropeId
 * @param {{ trope?: Trope, lean?: { boon?: number, bane?: number, bone?: number } | null, released?: number }} [opts]
 * @returns {Signals}
 */
export function tropeSignals(tropeId, { trope, lean = null, released = TOTAL_CHAPTERS } = {}) {
  const progress = readJSON('lore.chapter.progress.v1', {}) || {};
  const visited = new Set((Array.isArray(progress.visited) ? progress.visited : []).map(Number));
  const { released: told, payoff } = trope ? chambersOf(trope, released) : { released: [], payoff: null };
  const entry = (readJSON(STORE_KEY, {}) || {})[tropeId] || {};
  const crossed = entry.crossed || {};
  let shelf = 0;
  const switches = readJSON('lore.switches.v1', null);
  if (lean && switches?.resolved?.shelves === 'on') {
    const dial = readJSON('lore.nook.v1', {})?.genre || {};
    const want = { boon: Number(dial.boon) || 1, bane: Number(dial.bane) || 1, bone: Number(dial.bone) || 1 };
    const total = (lean.boon || 0) + (lean.bane || 0) + (lean.bone || 0);
    const dialTotal = want.boon + want.bane + want.bone;
    if (total > 0) shelf = (['boon', 'bane', 'bone']).reduce((n, k) => n + ((lean[/** @type {'boon'} */ (k)] || 0) / total) * (want[/** @type {'boon'} */ (k)] / dialTotal), 0) * 3 - 1;
  }
  return {
    read: told.filter((/** @type {number} */ n) => visited.has(n)).length + (Number(crossed.read) || 0) * 0.25,
    lastRead: payoff != null && visited.has(payoff),
    lanes: Number(crossed.lanes) || 0,
    desk: Number(crossed.desk) || 0,
    seen: Number(entry.seen) || 0,
    refrains: refrainsFor(tropeId).length,
    shelf: Math.max(0, shelf)
  };
}
