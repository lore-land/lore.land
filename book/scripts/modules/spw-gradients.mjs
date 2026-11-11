// @ts-check
/**
 * spw-gradients.mjs — why a sigil is written or kept, by where it is written and over how long. PROPOSED
 * (.spw/surfaces/gradients.spw).
 *
 * Two gradients, each a row of points:
 *   scale  local to global: one reader in one room of one carry, a chapter, the book, the land, and the commons of
 *          everyone who reads. ! is worth most under a thumb; & is worth most among everyone.
 *   span   a long reading life, said as behaviour and mood, never as who someone is: a first evening, a season of
 *          habit, years of study, a return after a long while, and two readers at different points sharing a page.
 *          ~ matters more the longer the span: a door left open is worth most to someone who comes back through it.
 *
 *   abstraction  stepped by container: { } the place itself, literal space; [ ] one chosen among several, an instance
 *          in view; ( ) a grouping, the pattern that gathers instances; < > a concept, a channel any mind implements
 *          in its own literal space. This is the spirit sequence ?~<#.>@(#.)&[#.]*{#.}^ read backward: the spec
 *          runs from the channel down to the materialized body; abstraction climbs from the body up to the channel.
 *          A ! in { } is a local, literal event; a & in < > is a global concept of confluence.
 *
 * reasonFor(sigil, { scale, span, container }) gives the words for each point and a weight (how much reason there is
 * to write that sigil there, 0 to 1, the product over the gradients asked). collectionReason(sigils) reads a reader's kept sigils as a position on both gradients:
 * where the collection leans, in words, and which sigil would widen it. The span's points line up with the
 * competency arc (competency.mjs): a reach a reader chooses, never an age asked.
 * Host-neutral and pure.
 */
/* The long arc's shape, from competency.mjs (104 quarters in bands of eight), restated so this module stands alone;
 * play-graph-check holds the two equal. */
export const QUARTERS = 104;
export const BAND_QUARTERS = 8;
/** @param {number} quarter */
const bandOfQuarter = (quarter) => Math.ceil(Math.min(QUARTERS, Math.max(1, Math.round(quarter))) / BAND_QUARTERS);

/** @typedef {'!' | '?' | '~' | '@' | '&' | '*' | '^' | '#' | '.' | '=' | '%' | '$'} Sigil */
/** @typedef {{ id: string, says: string }} ScalePoint */
/** @typedef {{ id: string, behaves: string, mood: string, bands: [number, number] | null }} SpanPoint */

/** @type {ReadonlyArray<ScalePoint>} */
export const SCALES = Object.freeze([
  { id: 'carry', says: 'one reader, one room, one carry' },
  { id: 'chapter', says: 'a chapter, read through' },
  { id: 'book', says: 'the book, across its stones' },
  { id: 'land', says: 'the land, across its books' },
  { id: 'commons', says: 'everyone who reads, together' }
]);
/** @type {ReadonlyArray<SpanPoint>} */
export const SPANS = Object.freeze([
  { id: 'first_evening', behaves: 'points at everything, presses to see what happens, turns the sound up', mood: 'curious, quick', bands: [1, 1] },
  { id: 'habit', behaves: 'comes back on their own, keeps a shelf, plays one carry before bed', mood: 'settled, collecting', bands: [2, 4] },
  { id: 'study', behaves: 'reads closely, writes their own lines, tunes on purpose', mood: 'patient, precise', bands: [5, 9] },
  { id: 'return', behaves: 'comes back after a long while and notices what changed', mood: 'wistful, glad', bands: [10, 13] },
  { id: 'together', behaves: 'two at different points on one page: one reads aloud, one holds the controls', mood: 'patient and delighted', bands: null }
]);
/** @typedef {{ id: string, container: string, says: string, spec: string }} AbstractionStep */
/** Abstraction, stepped by container, from the literal up (the spirit sequence, read backward). @type {ReadonlyArray<AbstractionStep>} */
export const ABSTRACTION = Object.freeze([
  { id: 'literal', container: '{ }', says: 'the place itself: literal space, where things are', spec: '{#.} materialize properties' },
  { id: 'instance', container: '[ ]', says: 'one chosen among several: an instance in view', spec: '[#.] merge categorized truths' },
  { id: 'pattern', container: '( )', says: 'a grouping: the pattern that gathers instances', spec: '(#.) observe ground truth' },
  { id: 'concept', container: '< >', says: 'a channel: a concept any mind implements in its own literal space', spec: '<#.> name the coupling' }
]);
/** @type {Readonly<Record<string, string>>} */
const CONTAINER_STEP = Object.freeze({ '{': 'literal', '}': 'literal', '{ }': 'literal', '[': 'instance', ']': 'instance', '[ ]': 'instance', '(': 'pattern', ')': 'pattern', '( )': 'pattern', '<': 'concept', '>': 'concept', '< >': 'concept', Body: 'literal', Frame: 'instance', Scope: 'pattern', Capsule: 'concept', area: 'literal', arena: 'instance', turn: 'pattern', passage: 'concept' });
/** The abstraction step a container stands for (a brace, a pair, a parser node type or a play-graph kind). @param {string} container */
export const stepOf = (container) => CONTAINER_STEP[String(container || '').trim()] || '';
export const SIGILS = /** @type {ReadonlyArray<Sigil>} */ (Object.freeze(['!', '?', '~', '@', '&', '*', '^', '#', '.', '=', '%', '$']));
/** @type {Readonly<Record<Sigil, string>>} */
export const ROLE = Object.freeze({ '!': 'action', '?': 'probe', '~': 'potential', '@': 'perspective', '&': 'confluence', '*': 'value', '^': 'integration', '#': 'annotation', '.': 'ground', '=': 'config', '%': 'measure', '$': 'substrate' });

/* [words, weight] for each sigil at each point, in the order of SCALES and of SPANS. */
/** @type {Readonly<Record<Sigil, { scale: Array<[string, number]>, span: Array<[string, number]>, abstraction: Array<[string, number]> }>>} */
const TABLE = Object.freeze({
  '!': {
    scale: [['something happens now, under your thumb', 0.95], ['a turn the chapter takes', 0.7], ['the events the book is remembered by', 0.45], ['what the land does without asking', 0.3], ['a moment everyone points back to', 0.2]],
    span: [['pressing to see what happens', 0.95], ['a move made without looking', 0.7], ['asking what made it happen', 0.45], ['remembering what you used to do here', 0.4], ['one presses, the other gasps', 0.75]],
    abstraction: [['an event in a place', 0.95], ['this one, now', 0.75], ['whenever this happens', 0.5], ['the idea of acting', 0.3]]
  },
  '?': {
    scale: [['what is that, coming down the lane', 0.7], ['a question a room leaves you holding', 0.75], ['the mystery the book keeps open', 0.8], ['what nobody has mapped yet', 0.6], ['a question readers trade', 0.55]],
    span: [['pointing at everything', 0.85], ['checking the same corner each visit', 0.55], ['asking well', 0.9], ['noticing what changed', 0.7], ['one asks, the other finds out', 0.85]],
    abstraction: [['look here', 0.6], ['which one', 0.9], ['what these share', 0.8], ['what a question is', 0.55]]
  },
  '~': {
    scale: [['a glimpse, gone in a breath', 0.4], ['an echo the chapter sets up', 0.6], ['a thread that pays off later', 0.8], ['a door left open between places', 0.75], ['a reference anyone can follow', 0.7]],
    span: [['a promise not yet known as one', 0.3], ['waiting for the next stone', 0.6], ['tracing a thread back', 0.75], ['a door left open long ago, still open', 1], ['a story told again, to someone new to it', 0.85]],
    abstraction: [['a door in the wall', 0.5], ['one of the threads', 0.6], ['an echo that recurs', 0.75], ['potential itself: a channel waiting', 0.9]]
  },
  '@': {
    scale: [['whose hands are on it', 0.9], ['whose eyes the chapter lends you', 0.75], ['who tells it', 0.6], ['where you stand in the land', 0.55], ['where each reader stands', 0.6]],
    span: [['being someone else for a carry', 0.8], ['a favourite pair of eyes', 0.6], ['reading from another side on purpose', 0.75], ['seeing it as you did then', 0.7], ['handing over the controls', 0.95]],
    abstraction: [['standing here', 0.8], ['this point of view', 0.8], ['a way of seeing', 0.7], ['a mind that implements the concept in its own place', 0.95]]
  },
  '&': {
    scale: [['an escort beside the pie', 0.35], ['two threads meeting in a room', 0.6], ['every thread meeting at the end', 0.75], ['where the roads join', 0.8], ['what readers make together', 0.95]],
    span: [['joining in', 0.5], ['a habit shared', 0.65], ['seeing how the parts fit', 0.75], ['finding old threads joined', 0.7], ['the whole point of it', 1]],
    abstraction: [['two things side by side', 0.5], ['this pair', 0.6], ['how things join', 0.8], ['the concept of joining, anywhere', 0.95]]
  },
  '*': {
    scale: [['a thing caught in the lanes', 0.9], ['a wonder kept from the chapter', 0.8], ['a collection that tells your way through', 0.65], ['the creatures and contrivances of the land', 0.55], ['what everyone has found, counted', 0.4]],
    span: [['grabbing the shiny one', 0.85], ['filling the shelf', 0.95], ['knowing what each one is', 0.6], ['the shelf you kept, still there', 0.75], ['showing someone the shelf', 0.7]],
    abstraction: [['a thing in your hand', 0.95], ['this one, collected', 0.85], ['a kind of thing', 0.6], ['value', 0.4]]
  },
  '^': {
    scale: [['the carry ending, written down', 0.45], ['a chapter closing into the book', 0.8], ['the book binding its chambers', 0.9], ['a land holding its books', 0.7], ['what all the reading adds up to', 0.6]],
    span: [['finishing something', 0.5], ['chapters adding up', 0.7], ['seeing the shape of the whole', 0.85], ['what it all came to', 0.8], ['a thing finished together', 0.75]],
    abstraction: [['lifting it out of the room', 0.55], ['binding this one', 0.7], ['what the group adds up to', 0.85], ['integration', 0.8]]
  },
  '#': {
    scale: [['a word said in passing', 0.4], ['a mark in the margin', 0.65], ['the notes a book keeps on itself', 0.6], ['the signs posted at the crossroads', 0.65], ['what readers say about it', 0.9]],
    span: [['reading the signs aloud', 0.55], ['leaving a mark of your own', 0.7], ['annotating', 0.85], ['finding your old notes', 0.8], ['pointing and saying look', 0.8]],
    abstraction: [['a sign on the wall', 0.6], ['a label on this one', 0.8], ['a tag many share', 0.85], ['what anything can be called', 0.6]]
  },
  '.': {
    scale: [['where your feet are', 0.65], ['what the room is made of, inside', 0.6], ['the rules that hold', 0.75], ['the ground every story stands on', 0.9], ['what nobody needs to argue about', 0.6]],
    span: [['finding your footing', 0.75], ['a place known by heart', 0.8], ['what it rests on', 0.75], ['the ground still there', 0.85], ['steadying the other one', 0.8]],
    abstraction: [['the floor itself', 0.95], ['what this one is made of inside', 0.8], ['the rule beneath them', 0.65], ['ground: what any concept needs to stand on', 0.5]]
  },
  '=': {
    scale: [['how the board is tuned for your hands', 0.8], ['how a chapter leans', 0.7], ['the genre dial', 0.6], ['which way a land leans', 0.55], ['the defaults everyone starts from', 0.5]],
    span: [['turning a knob to see', 0.6], ['settings kept', 0.75], ['tuning on purpose', 0.85], ['finding your settings kept', 0.65], ['setting it up for the other one', 0.85]],
    abstraction: [['this room, tuned', 0.7], ['this one leans', 0.75], ['a habit of leaning', 0.8], ['bias', 0.65]]
  },
  '%': {
    scale: [['how much is left in the pie', 0.9], ['how far through', 0.7], ['how much there is', 0.5], ['the scale of the land', 0.45], ['counts everyone shares', 0.55]],
    span: [['more, or less', 0.5], ['keeping score', 0.75], ['measuring well', 0.95], ['how much has changed', 0.7], ['fair shares', 0.85]],
    abstraction: [['how much is here', 0.9], ['how much of this one', 0.85], ['a proportion', 0.8], ['measure itself', 0.55]]
  },
  '$': {
    scale: [['what the lane is made of under you', 0.35], ['the material of a room', 0.6], ['flour, oak, glass, ink', 0.65], ['what the land is made of', 0.85], ['the shared stuff a site is built from', 0.7]],
    span: [['touching everything', 0.45], ['favourite materials', 0.55], ['how it is made', 0.85], ['the grain worn smooth', 0.8], ['making something from it together', 0.75]],
    abstraction: [['flour, oak, glass', 0.95], ['the material of this one', 0.75], ['a substance shared', 0.6], ['substrate', 0.5]]
  }
});

/** The span point a quarter of the long arc falls in (competency.mjs; a reach chosen, never an age). @param {number} quarter */
export function spanOfQuarter(quarter) {
  const band = bandOfQuarter(Math.min(QUARTERS, Math.max(1, Math.round(quarter))));
  return SPANS.find((s) => s.bands && band >= s.bands[0] && band <= s.bands[1])?.id || 'study';
}

/**
 * Why write or keep this sigil here, over this long.
 * @param {string} sigil
 * @param {{ scale?: string, span?: string, container?: string }} [at]  container: a brace pair, a parser node type or a play-graph kind
 * @returns {{ sigil: string, role: string, scale: string, span: string, abstraction: string, words: { scale: string, span: string, abstraction: string, both: string }, weight: number } | null}
 */
export function reasonFor(sigil, { scale = 'carry', span = 'first_evening', container = '' } = {}) {
  const row = TABLE[/** @type {Sigil} */ (sigil)];
  const si = SCALES.findIndex((s) => s.id === scale);
  const pi = SPANS.findIndex((s) => s.id === span);
  const step = container ? stepOf(container) : '';
  const ai = step ? ABSTRACTION.findIndex((a) => a.id === step) : -1;
  if (!row || si < 0 || pi < 0 || (container && ai < 0)) return null;
  const [sw, sk] = row.scale[si];
  const [pw, pk] = row.span[pi];
  const [aw, ak] = ai >= 0 ? row.abstraction[ai] : ['', 1];
  const role = ROLE[/** @type {Sigil} */ (sigil)];
  return {
    sigil, role, scale, span, abstraction: step,
    words: { scale: sw, span: pw, abstraction: aw, both: `${sigil} as ${role}: ${sw}; over time, ${pw}${aw ? `; in ${ABSTRACTION[ai].container}, ${aw}` : ''}` },
    weight: Math.round(sk * pk * ak * 100) / 100
  };
}

/**
 * Where a sigil in a container stands on all three gradients, said in one line: the scale and span it has most
 * reason for, and the abstraction its container gives it. A ! in { } is a local, literal event; a & in < > is a
 * global concept of confluence.
 * @param {string} sigil @param {string} container
 */
export function placeOf(sigil, container) {
  const row = TABLE[/** @type {Sigil} */ (sigil)];
  const step = stepOf(container);
  if (!row || !step) return null;
  const argmax = (/** @type {Array<[string, number]>} */ list) => list.reduce((best, [, w], i) => (w > list[best][1] ? i : best), 0);
  const si = argmax(row.scale);
  const pi = argmax(row.span);
  const ai = ABSTRACTION.findIndex((a) => a.id === step);
  const near = si <= 1 ? 'local' : si >= 3 ? 'global' : 'book-wide';
  const kind = { literal: 'literal', instance: 'chosen', pattern: 'patterned', concept: 'conceptual' }[step];
  return { sigil, container: ABSTRACTION[ai].container, scale: SCALES[si].id, span: SPANS[pi].id, abstraction: step, says: `a ${near}, ${kind} ${NOUN[/** @type {Sigil} */ (sigil)]}: ${row.abstraction[ai][0]}` };
}

/** @param {number[]} w @returns {number} */
const centroid = (w) => { const total = w.reduce((a, b) => a + b, 0); return total ? w.reduce((a, b, i) => a + b * i, 0) / total : 0; };
/** How far above its own average a row stands at each point (so a sigil counts where it has more reason than usual, not everywhere). @param {Array<[string, number]>} row */
const lift = (row) => { const mean = row.reduce((a, [, w]) => a + w, 0) / row.length; return row.map(([, w]) => Math.max(0, w - mean)); };
/** @type {Readonly<Record<Sigil, string>>} */
const NOUN = Object.freeze({ '!': 'event', '?': 'probe', '~': 'potential', '@': 'point of view', '&': 'confluence', '*': 'thing', '^': 'binding', '#': 'mark', '.': 'ground', '=': 'lean', '%': 'measure', '$': 'material' });

/**
 * A collection of kept sigils, read as a position on both gradients.
 * Items may be sigils ('&') or { sigil, container } pairs; pairs also place the collection on the abstraction ladder.
 * @param {Array<string | { sigil: string, container?: string }>} items
 * @returns {{ size: number, scale: { at: number, nearest: string, says: string }, span: { at: number, nearest: string, behaves: string, mood: string }, abstraction: { at: number, nearest: string, says: string } | null, leans: string[], widen: string | null, words: string }}
 */
export function collectionReason(items) {
  const pairs = (items || []).map((it) => (typeof it === 'string' ? { sigil: it, container: '' } : { sigil: it?.sigil || '', container: it?.container || '' })).filter((p) => TABLE[/** @type {Sigil} */ (p.sigil)]);
  const kept = pairs.map((p) => p.sigil);
  const placed = pairs.filter((p) => stepOf(p.container));
  // Abstraction is set by the container itself; the sigil's own weight there says how much reason it has to be there.
  const absW = ABSTRACTION.map((a, i) => placed.reduce((sum, p) => sum + (stepOf(p.container) === a.id ? TABLE[/** @type {Sigil} */ (p.sigil)].abstraction[i][1] : 0), 0));
  const abs = placed.length ? Math.round(centroid(absW) * 100) / 100 : null;
  const scaleW = SCALES.map((_, i) => kept.reduce((sum, s) => sum + lift(TABLE[/** @type {Sigil} */ (s)].scale)[i], 0));
  // The shared page (together) is not on the line from a first evening to a return; it is weighed apart.
  const spanW = SPANS.slice(0, 4).map((_, i) => kept.reduce((sum, s) => sum + lift(TABLE[/** @type {Sigil} */ (s)].span.slice(0, 4))[i], 0));
  const together = kept.reduce((sum, s) => sum + TABLE[/** @type {Sigil} */ (s)].span[4][1], 0) / Math.max(1, kept.length);
  const at = Math.round(centroid(scaleW) * 100) / 100;
  const sp = Math.round(centroid(spanW) * 100) / 100;
  const nearScale = SCALES[Math.round(at)];
  const nearSpan = SPANS[Math.round(sp)];
  /** @type {Record<string, number>} */
  const counts = {};
  kept.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
  const leans = Object.entries(counts).sort((a, b) => b[1] - a[1] || SIGILS.indexOf(/** @type {Sigil} */ (a[0])) - SIGILS.indexOf(/** @type {Sigil} */ (b[0]))).slice(0, 3).map(([s]) => s);
  // What would widen it: the missing sigil with the most reason at the far end of where it leans.
  const far = at < 2 ? SCALES.length - 1 : 0;
  const missing = SIGILS.filter((s) => !counts[s]);
  const widen = missing.length ? missing.slice().sort((a, b) => TABLE[b].scale[far][1] - TABLE[a].scale[far][1])[0] : null;
  const words = kept.length
    ? `Kept like this, the sigils lean toward ${nearScale.says}, and toward the times someone ${nearSpan.behaves} (${nearSpan.mood}).${together >= 0.85 ? ' They are a collection made for sharing a page.' : ''}${widen ? ` ${widen} would reach toward ${SCALES[far].says}: ${TABLE[widen].scale[far][0]}.` : ''}`
    : 'Nothing kept yet: every sigil is still a reason waiting.';
  const nearAbs = abs == null ? null : ABSTRACTION[Math.round(abs)];
  const absWords = nearAbs ? ` Their containers keep them near ${nearAbs.container}, ${nearAbs.says}.` : '';
  return { size: kept.length, scale: { at, nearest: nearScale.id, says: nearScale.says }, span: { at: sp, nearest: nearSpan.id, behaves: nearSpan.behaves, mood: nearSpan.mood }, abstraction: nearAbs && abs != null ? { at: abs, nearest: nearAbs.id, says: nearAbs.says } : null, leans, widen, words: words + absWords };
}
