// @ts-check
/**
 * valence-shelves.mjs — the five Spw modifiers as tunable genre shelves, and the formula that moves the story with
 * them (.spw/surfaces/shelves.spw, proposed). Pure: no DOM, no storage; the game and the pages feed it and read it.
 *
 *   v = normalize( shelf^a · (1 + deeds)^b · (1 + attention)^c ),   a = 1, b = 0.5, c = 0.35
 *
 * shelf is what a reader tuned (even if untouched), deeds what they did in the lanes (the game's own =lean events,
 * plus two new ways: bonk and honk), attention what they dwelt on. Out of v come four things:
 *   branchOdds    which branch grows dominant (softmax by firmness, with a floor of one in twenty)
 *   chainStep     which motivation fires next (a shelf held at 0.3 for three rooms runs its chain one link)
 *   teaseRung     how far a story point has been teased (whisper, glimpse, card, passage, reveal)
 *   nextDimension which dimension of the land opens next, and the resident that teases it a room early
 * No shelf is a moral ranking; every depth has a path from every shelf; held plot has no ladder.
 */
import { TOTAL_CHAPTERS } from './book-extent.mjs';
// @ts-ignore: a page loads it with its version token, which the type checker cannot resolve; forks.mjs is checked on its own.
import { readForkSmall, signaturesOf, choseLine } from './forks.mjs?v=2026_11_13.B';

/** @typedef {'boon' | 'bane' | 'bone' | 'bonk' | 'honk'} Shelf */
/** @typedef {Record<Shelf, number>} Vector */

/** @type {ReadonlyArray<Shelf>} */
export const SHELVES = Object.freeze(['boon', 'bane', 'bone', 'bonk', 'honk']);

/** @type {Readonly<Record<Shelf, string>>} */
export const SHELF_WORDS = Object.freeze({
  boon: 'fairy tale and foresight: gifts, wonder, the boonberry that foresees kindly',
  bane: 'absurd reality and announcement: schemes, bills, the baneberry that foretells itself true',
  bone: 'low magic and what holds: frames, receipts, the boneberry that feeds honestly',
  bonk: 'material comedy and impact: Bonk City glass, knocks, splats, a pie in the face done right',
  honk: 'echo and announcement: the Fool, the grove that answers a beat late, rhythms found'
});

/** @param {Partial<Record<string, number>>} [from] @param {number} [fill] @returns {Vector} */
const vec = (from = {}, fill = 0) => /** @type {Vector} */ (Object.fromEntries(SHELVES.map((s) => [s, Number.isFinite(from[s]) ? Math.max(0, /** @type {number} */ (from[s])) : fill])));
/** @param {Vector} v @returns {Vector} */
const normalize = (v) => {
  const sum = SHELVES.reduce((n, s) => n + v[s], 0);
  return sum > 0 ? /** @type {Vector} */ (Object.fromEntries(SHELVES.map((s) => [s, v[s] / sum]))) : vec({}, 1 / SHELVES.length);
};

/* ─── The lanes' own deeds ───────────────────────────────────────────────
 * The game's =lean events, with the weights pie-game.mjs uses until pie-rules.spw is read (LEAN_DEFAULTS there):
 * each leans boon, bane or bone. Two more ways read the same events and a few counts the game already keeps:
 *   bonk  knocked and boxed (lean events), slices wasted (splat: run.wasted), WAPs (run.waps, half each), mimes
 *         knocked (the maw tally's mime_knock), and imaginary panes shattered (record.mimes.shattered)
 *   honk  hops in time and moves in the pocket (lean events), rhythms found (foundRhythm), and echoes thrown
 *         (shots with shot.echo, from the echo-wrens)
 * A knock is both absurd reality and material comedy, so it counts on both shelves: that is the point of shelves. */
/** @type {Readonly<Record<string, [Shelf, number]>>} */
export const LEAN_DEFAULTS = Object.freeze({
  satisfied: ['boon', 1], shared: ['boon', 1], kept: ['boon', 1], egg: ['boon', 1], sweetened: ['boon', 0.6],
  boonberry: ['boon', 0.4], furrow: ['boon', 0.3], sighting: ['boon', 0.6], boonwap: ['boon', 0.3], boof: ['boon', 0.5],
  knocked: ['bane', 1], boxed: ['bane', 0.8], bane_fed: ['bane', 0.6], scheme_ran: ['bane', 1], foretold: ['bane', 0.8],
  flinched: ['bane', 0.6], let_past: ['bane', 0.3],
  perfect: ['bone', 1], over_mimes: ['bone', 1], ramp: ['bone', 0.6], hop_clear: ['bone', 0.5], deft: ['bone', 0.6],
  caught: ['bone', 0.5], boneberry: ['bone', 0.6], foiled: ['bone', 1], squashed: ['bone', 0.4], ahead: ['bone', 0.3],
  aimed: ['bone', 0.3], alley: ['bone', 0.6], parade: ['boon', 0.6], long_view: ['bone', 0.6], in_time: ['bone', 0.5],
  pocket: ['bone', 0.3], read: ['boon', 0.2], cast: ['bone', 0.5]
});
/** Lean events that also count as bonk, and as honk, with their weights. */
export const BONK_EVENTS = Object.freeze({ knocked: 1, boxed: 1 });
export const HONK_EVENTS = Object.freeze({ in_time: 1, pocket: 0.6 });

/**
 * The five shelves' deeds, from a carry's lean counts (run.leanWhy: event → how many) and the counts the game keeps.
 * rules: the =lean table as read from pie-rules.spw (event → [shelf, weight]); the defaults otherwise.
 * @param {Record<string, number>} [leanWhy]
 * @param {{ rules?: Record<string, [string, number]>, waps?: number, wasted?: number, shattered?: number, mimeKnocks?: number, rhythms?: number, echoes?: number }} [counts]
 * @returns {Vector}
 */
export function deedsFrom(leanWhy = {}, { rules = LEAN_DEFAULTS, waps = 0, wasted = 0, shattered = 0, mimeKnocks = 0, rhythms = 0, echoes = 0 } = {}) {
  const d = vec();
  Object.entries(leanWhy).forEach(([event, n]) => {
    const count = Math.max(0, Number(n) || 0);
    const rule = rules[event] || LEAN_DEFAULTS[event];
    if (rule && SHELVES.includes(/** @type {Shelf} */ (rule[0]))) d[/** @type {Shelf} */ (rule[0])] += rule[1] * count;
    if (event in BONK_EVENTS) d.bonk += /** @type {Record<string, number>} */ (BONK_EVENTS)[event] * count;
    if (event in HONK_EVENTS) d.honk += /** @type {Record<string, number>} */ (HONK_EVENTS)[event] * count;
  });
  d.bonk += Math.max(0, wasted) + Math.max(0, waps) * 0.5 + Math.max(0, mimeKnocks) + Math.max(0, shattered);
  d.honk += Math.max(0, rhythms) * 2 + Math.max(0, echoes) * 0.5;
  return d;
}

/**
 * The reader's five-part vector.
 * @param {{ shelf?: Partial<Record<string, number>>, deeds?: Partial<Record<string, number>>, attention?: Partial<Record<string, number>>, a?: number, b?: number, c?: number }} [input]
 * @returns {Vector}
 */
export function vectorOf({ shelf = {}, deeds = {}, attention = {}, a = 1, b = 0.5, c = 0.35 } = {}) {
  const s = vec(shelf, 1);
  const d = vec(deeds);
  const t = vec(attention);
  return normalize(/** @type {Vector} */ (Object.fromEntries(SHELVES.map((k) => [k, s[k] ** a * (1 + d[k]) ** b * (1 + t[k]) ** c]))));
}

/** How well two five-part leanings agree, 0 to 1 (cosine). @param {Partial<Record<string, number>>} x @param {Partial<Record<string, number>>} y */
export function alignment(x, y) {
  const a = vec(x);
  const b = vec(y);
  const dot = SHELVES.reduce((n, s) => n + a[s] * b[s], 0);
  const len = (/** @type {Vector} */ v) => Math.sqrt(SHELVES.reduce((n, s) => n + v[s] * v[s], 0));
  return len(a) && len(b) ? dot / (len(a) * len(b)) : 0;
}

/* ─── Branches ───────────────────────────────────────────────────────── */

/**
 * Which branch grows dominant: P(branch) ∝ exp(firmness · 4 · alignment(signature, v)), then every branch is held to
 * a floor (one in twenty, or less when there are very many) so a turned shelf can always bring one back.
 * firmness: 1 (loose) to 4 (firm). Returns the branches in their own order, each with p.
 * @template {{ id: string, signature: Partial<Record<string, number>> }} B
 * @param {B[]} branches
 * @param {Vector} v
 * @param {{ firmness?: number, floor?: number }} [opts]
 * @returns {(B & { p: number })[]}
 */
export function branchOdds(branches, v, { firmness = 1, floor = 0.05 } = {}) {
  if (!branches.length) return [];
  const k = Math.min(4, Math.max(1, firmness)) * 4;
  const raw = branches.map((br) => Math.exp(k * alignment(br.signature, v)));
  const sum = raw.reduce((n, x) => n + x, 0);
  let p = raw.map((x) => x / sum);
  const f = Math.min(floor, 0.5 / branches.length);
  // Lift any branch under the floor to it, and take the difference from the others in proportion.
  for (let pass = 0; pass < 4; pass += 1) {
    const low = p.map((x) => x < f);
    if (!low.some(Boolean)) break;
    const need = p.reduce((n, x, i) => n + (low[i] ? f - x : 0), 0);
    const spare = p.reduce((n, x, i) => n + (low[i] ? 0 : x), 0);
    p = p.map((x, i) => (low[i] ? f : x - (spare ? (x / spare) * need : 0)));
  }
  return branches.map((br, i) => ({ ...br, p: p[i] }));
}

/** Mr. BaneWAP's schemes (pie-world.mjs SCHEMES) as the first branches with signatures, read from what each scheme
 * does: a rented wind tilts the pie (absurd, and a knock waiting to happen), a tax on every step keeps a ledger, a
 * re-let is pure announcement, a march is the mimes (and every pane they remember).
 *
 * The fork is the source: one line (forks.mjs) says what forks (his scheme), on what (the shelves), and every place it
 * can go with the shelves it leans on, named once for each weight. Change the line and the odds change with it; the
 * signatures below are read from it. shelves:check holds the line whole with the real parser. */
export const SCHEME_FORK = '?scheme[shelves]{ =bane@banewap{ @wind[bane, bonk] @tax[bane, bone] @relet[bane, bane] @march[bane, bonk, bonk] } }';
/** @type {Readonly<Record<string, Partial<Record<Shelf, number>>>>} */
const schemeFork = readForkSmall(SCHEME_FORK);
export const SCHEME_SIGNATURES = Object.freeze(signaturesOf(schemeFork));
/**
 * The line that chose his scheme, for the lanes to show once a carry: the fork's side with its places ranked by what
 * each weighed this time (first strongest), the place drawn as its own edge, and the odds in words.
 * @param {{ id: string, p: number }[]} odds
 * @param {string} drew
 * @returns {{ ranked: string, drawn: string, words: string } | null} null when the line does not read as a fork: the lanes then say nothing of it
 */
export const schemeChose = (odds, drew) => (schemeFork ? choseLine(schemeFork, odds, drew) : null);

/* ─── Chains: a shelf held long enough sets a character's motivation going ─── */

/** Each shelf's chain, as signed bias edges: =boon leans forward, =bane inverse (spw-seed readBias). @type {Readonly<Record<Shelf, ReadonlyArray<{ line: string, invokes: string, says: string }>>>} */
export const CHAINS = Object.freeze({
  boon: [
    { line: '=boon@boonwap{ @court }', invokes: 'court', says: 'Mr. BoonWAP holds court' },
    { line: '=boon@court{ @clowns }', invokes: 'clowns', says: 'clowns flock to the court' },
    { line: '=boon@clowns{ @wap }', invokes: 'wap', says: 'the WAPs come in runs' }
  ],
  bane: [
    { line: '=bane@banewap{ @scheme }', invokes: 'scheme', says: 'Mr. BaneWAP has a scheme' },
    { line: '=bane@scheme{ @march }', invokes: 'march', says: 'the scheme calls a march' },
    { line: '=bane@march{ @mimes }', invokes: 'mimes', says: 'the mimes remember' }
  ],
  bone: [
    { line: '=boon@bonewap{ @receipt }', invokes: 'receipt', says: 'BoneWAP posts a receipt' },
    { line: '=boon@receipt{ @frame }', invokes: 'frame', says: 'the frame is tested' },
    { line: '=boon@frame{ @dividers }', invokes: 'dividers', says: 'the road is measured' }
  ],
  bonk: [
    { line: '=bane@pane{ @mimewall }', invokes: 'mimewall', says: 'glass broken, then imaginary glass' },
    { line: '=bane@mimewall{ @grudge }', invokes: 'grudge', says: 'a grudge that feeds the march' }
  ],
  honk: [
    { line: '=boon@fool{ @echo }', invokes: 'echo', says: 'a honk, and an echo a beat late' },
    { line: '=boon@echo{ @rhythm }', invokes: 'rhythm', says: 'a rhythm a reader can keep' }
  ]
});

/** @typedef {{ streak: Vector, at: Vector, complete: Shelf[] }} ChainState */
/** A fresh chain state. @returns {ChainState} */
export const chainStart = () => ({ streak: vec(), at: vec(), complete: [] });

/**
 * One room passes. A shelf at or above the threshold adds to its streak (any other resets it); a streak of `rooms`
 * fires that shelf's next link. Crossings: a bonk link feeds the bane streak one room (the mimes), a honk link feeds
 * boon (the grove), and a bone link checks both, taking a room from the bane and bonk streaks. A chain run to its
 * end is complete and unlocks a depth (the game decides which).
 * @param {ChainState} state
 * @param {Vector} v
 * @param {{ rooms?: number, threshold?: number }} [opts]
 * @returns {{ state: ChainState, fired: { shelf: Shelf, line: string, invokes: string, says: string, complete: boolean }[] }}
 */
export function chainStep(state, v, { rooms = 3, threshold = 0.3 } = {}) {
  const next = { streak: { ...state.streak }, at: { ...state.at }, complete: [...state.complete] };
  /** @type {{ shelf: Shelf, line: string, invokes: string, says: string, complete: boolean }[]} */
  const fired = [];
  SHELVES.forEach((s) => { next.streak[s] = v[s] >= threshold ? next.streak[s] + 1 : 0; });
  SHELVES.forEach((s) => {
    const chain = CHAINS[s];
    if (next.streak[s] < rooms || next.at[s] >= chain.length) return;
    const link = chain[next.at[s]];
    next.at[s] += 1;
    next.streak[s] = 0;
    const complete = next.at[s] >= chain.length;
    if (complete && !next.complete.includes(s)) next.complete.push(s);
    fired.push({ shelf: s, ...link, complete });
    if (s === 'bonk') next.streak.bane += 1;
    if (s === 'honk') next.streak.boon += 1;
    if (s === 'bone') { next.streak.bane = Math.max(0, next.streak.bane - 1); next.streak.bonk = Math.max(0, next.streak.bonk - 1); }
  });
  return { state: next, fired };
}

/* ─── Teasing a story point ──────────────────────────────────────────── */

export const RUNGS = Object.freeze(['whisper', 'glimpse', 'card', 'passage', 'reveal']);
export const RUNG_AT = Object.freeze([0.1, 0.25, 0.45, 0.65, 0.85]);

/**
 * How far a story point has been teased. score = 0.4 attention + 0.3 deeds + 0.2 alignment(signature, v) + 0.1
 * progress (each 0 to 1). A whisper and a glimpse may come before the point's chapter (a margin rumour, a sighting);
 * a card, a passage or a reveal never comes before its chapter is released. Held plot has no ladder.
 * @param {{ id: string, chapter: number, signature?: Partial<Record<string, number>>, held?: boolean }} point
 * @param {{ attention?: number, deeds?: number, v?: Vector, progress?: number, released?: number }} [signals]
 * @returns {{ rung: string | null, index: number, score: number, capped: boolean, held: boolean }}
 */
export function teaseRung(point, { attention = 0, deeds = 0, v = vec({}, 0.2), progress = 0, released = TOTAL_CHAPTERS } = {}) {
  if (point.held) return { rung: null, index: -1, score: 0, capped: false, held: true };
  const unit = (/** @type {number} */ x) => Math.min(1, Math.max(0, Number(x) || 0));
  const score = 0.4 * unit(attention) + 0.3 * unit(deeds) + 0.2 * (point.signature ? alignment(point.signature, v) : 0) + 0.1 * unit(progress);
  let index = -1;
  RUNG_AT.forEach((at, i) => { if (score >= at) index = i; });
  const ceiling = point.chapter > released ? 1 : RUNGS.length - 1;
  const capped = index > ceiling;
  if (capped) index = ceiling;
  return { rung: index >= 0 ? RUNGS[index] : null, index, score, capped, held: false };
}

/* ─── The ecology: dimensions, opened one at a time ──────────────────── */

/** In the order they open, each with the shelf it leans and the resident that teases it one room early. */
export const DIMENSIONS = Object.freeze([
  { id: 'across', shelf: 'bane', resident: 'post', words: 'the road, lane by lane, narrowed when a scheme runs' },
  { id: 'ahead', shelf: 'boon', resident: 'berry', words: 'up the lanes: a boonberry glimpse shows the clear way a breath early' },
  { id: 'height', shelf: 'bone', resident: 'snail', words: 'what holds you up: low things to hop, a snail flat to the glass first' },
  { id: 'timing', shelf: 'honk', resident: 'beaver', words: 'when: a beaver keeps its own time and lends it, and the rooms keep rhythms' },
  { id: 'depth', shelf: 'boon', resident: 'furrow', words: 'what is under: a field kept warm from underneath' },
  { id: 'games', shelf: 'bonk', resident: 'dividers', words: 'the games in the road: brass dividers round a paper pie, for luck' },
  { id: 'sound', shelf: 'honk', resident: 'horn', words: 'what is heard: a horn left on a stand by someone who meant to start something' }
]);

/**
 * Which dimension opens next. The last opened must be lived in (used `livedIn` times) before the next opens; the
 * resident that teases it is named so a room can send it one room early. Returns null when all are open.
 * @param {{ open?: string[], uses?: Record<string, number> }} state
 * @param {{ livedIn?: number }} [opts]
 * @returns {{ next: string, shelf: string, resident: string, words: string, ready: boolean, lived: number } | null}
 */
export function nextDimension({ open = ['across'], uses = {} } = {}, { livedIn = 3 } = {}) {
  const at = DIMENSIONS.findIndex((d) => !open.includes(d.id));
  if (at < 0) return null;
  const last = at > 0 ? DIMENSIONS[at - 1].id : null;
  const lived = last ? Math.min(1, (Number(uses[last]) || 0) / livedIn) : 1;
  const d = DIMENSIONS[at];
  return { next: d.id, shelf: d.shelf, resident: d.resident, words: d.words, ready: lived >= 1, lived };
}
