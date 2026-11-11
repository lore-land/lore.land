/**
 * competency.mjs — the long arc: mathematics a pupil grows into a quarter at a time over 26 years,
 * and the cone of attention that brings teaching metaphors to bear on them. PROPOSED
 * (.spw/surfaces/competency.spw); nothing here asks a reader's age or stores anything.
 *
 * 104 quarters make thirteen bands of eight (two years each). Thirteen is the ring: a book of the
 * serial is thirteen chambers (book-extent.mjs CHAMBERS_PER_RING). Each band names the combinatorics
 * it can hold, and says how the Spw cards may combine at that reach:
 *
 *   hand      how many cards combine into one spell
 *   ordered   true: a sequence (order matters); false: a set; 'either': the reader may play both ways
 *   repeats   whether one card may be played more than once in a hand
 *
 * The cone: seven clusters of teaching metaphor stand in a ring around a pupil. A quarter turns one of
 * them to face the pupil (the focus); the cone's radius is how many are in view at once, narrow at
 * the tip of the arc and the whole ring by its end. Each cluster wears one of the twelve sigils in its
 * own role (spw-interactions.mjs OPERATOR_ROLES).
 *
 * Pure and host-neutral: no DOM, no storage, no clock. daily.mjs reads the land's quarter from the
 * calendar; a reader's own reach is a choice they make, kept on their device if at all.
 *
 * The game hook (not wired; pie-cards.mjs and pie-powers.mjs are unchanged): a power-up is a spell of
 * atoms (~effect, %amount, *charge, !act, &with, #says). combinatoricsFor(reach).hand would cap how
 * many atoms or cards a reader may combine into one spell on the bench; ordered would decide whether
 * readSpells() keeps the atoms' order as meaning (a !level before a ~lit is a different spell from one
 * after) or sorts them; repeats would decide whether the same card may be played twice. hands(12, …)
 * counts the spells a reach can make from the twelve sigils, so the bench can say how large the
 * reader's space is.
 */

export const QUARTERS = 104;
export const BAND_QUARTERS = 8;
export const BANDS_IN_ARC = QUARTERS / BAND_QUARTERS;   // 13
export const SIGIL_CARDS = Object.freeze(['!', '?', '~', '@', '&', '*', '^', '#', '.', '=', '%', '$']);

/** The seven clusters of teaching metaphor, in their ring order (neighbours share the most). */
export const CLUSTERS = Object.freeze([
  Object.freeze({ id: 'kitchen', name: 'Kitchen and pie', sigil: '%', role: 'measure',
    holds: 'part and whole, fair shares, measuring out', canon: 'one pie, cut: the Feast of the Uneven Slice' }),
  Object.freeze({ id: 'music', name: 'Music and rhythm', sigil: '~', role: 'potential',
    holds: 'counting in time, intervals as ratios, pattern and repeat', canon: 'the lanes run on beats; a note stair in Chapter Five' }),
  Object.freeze({ id: 'craft', name: 'Building and craft', sigil: '^', role: 'integration',
    holds: 'shape, arrays, structure, proof by making', canon: 'the beavers build before a quote; BoneWAP asks what the frame will bear' }),
  Object.freeze({ id: 'market', name: 'Market and trade', sigil: '$', role: 'value',
    holds: 'price, budget, trade-off, the estimate', canon: 'the Genie: name one, hear the price, pay or fold' }),
  Object.freeze({ id: 'garden', name: 'Garden and ecology', sigil: '&', role: 'confluence',
    holds: 'growth, rates, cycles, many lives at once', canon: 'torch-ants on the berry roots; berries planted behind a slow beaver' }),
  Object.freeze({ id: 'theatre', name: 'Theatre and performance', sigil: '@', role: 'perspective',
    holds: 'roles, point of view, order of events, rehearsal', canon: 'the mimes take the words away; a clown wants what is about to happen' }),
  Object.freeze({ id: 'journey', name: 'Map and journey', sigil: '.', role: 'ground',
    holds: 'position, distance, the way from here to there, graphs', canon: 'dawnward and hearthward, never the compass; the lanes are a road' })
]);

/**
 * The thirteen bands. quarters: [first, last] of the 104. hand, ordered, repeats: how the cards
 * combine at this reach. operations: what a hand can do. canon: where the book already holds it.
 */
export const BANDS = Object.freeze([
  { band: 1, name: 'Same and different', holds: ['more and fewer', 'same and different', 'pairing one thing with one thing'],
    hand: 1, ordered: false, repeats: false, operations: ['match'], canon: 'Boof reads the field: everything where it belongs' },
  { band: 2, name: 'Counting', holds: ['one-to-one correspondence', 'the last number said is how many', 'counting on'],
    hand: 2, ordered: false, repeats: false, operations: ['match', 'count'], canon: 'the prophecy is clear about the number: exactly one' },
  { band: 3, name: 'Part and whole', holds: ['halves and quarters of one pie', 'fair shares', 'a whole cut is still one pie'],
    hand: 2, ordered: false, repeats: true, operations: ['share', 'compare'], canon: 'the Feast of the Uneven Slice' },
  { band: 4, name: 'Place value', holds: ['tens and ones', 'adding and taking away', 'the number line'],
    hand: 3, ordered: false, repeats: false, operations: ['add', 'take away', 'group in tens'], canon: 'the clerk: a word at the top, a line for the cause' },
  { band: 5, name: 'Equal groups', holds: ['arrays', 'multiplication as equal groups', 'skip counting in rhythm', 'division as fair sharing'],
    hand: 3, ordered: false, repeats: true, operations: ['multiply', 'divide'], canon: 'rows of the lanes arrive on the beat' },
  { band: 6, name: 'Fractions as numbers', holds: ['fractions on the line', 'equivalent slices', 'ratio and rate', 'measurement'],
    hand: 3, ordered: true, repeats: false, operations: ['ratio', 'scale'], canon: 'Mr. BoonWAP serves himself in slices and is never smaller' },
  { band: 7, name: 'Chance', holds: ['probability', 'tallies and data', 'averages', 'fair and unfair'],
    hand: 4, ordered: false, repeats: true, operations: ['tally', 'average', 'weigh a chance'], canon: 'the wish-scale balances coincidences, not weights' },
  { band: 8, name: 'Order, or not', holds: ['the counting principle', 'permutations and combinations', 'choosing k of n'],
    hand: 4, ordered: 'either', repeats: false, operations: ['arrange', 'choose'], canon: 'three correct records of one thing' },
  { band: 9, name: 'Rules for patterns', holds: ['variables', 'functions', 'equations as balances', 'graphs of a rule'],
    hand: 4, ordered: true, repeats: true, operations: ['substitute', 'solve', 'graph'], canon: 'the Genie wants the books even' },
  { band: 10, name: 'Proof and the circle', holds: ['geometry', 'logic and proof', 'pi: the way round a pie over the way across'],
    hand: 5, ordered: false, repeats: false, operations: ['prove', 'construct'], canon: 'Wonder About Pi(e)' },
  { band: 11, name: 'Recursion and growth', holds: ['sequences', 'induction', 'growth and decay', 'a thing defined by its own echo'],
    hand: 5, ordered: true, repeats: true, operations: ['recurse', 'iterate'], canon: 'the Genie becomes an echo you can visit' },
  { band: 12, name: 'Structure and change', holds: ['vectors and matrices', 'systems of equations', 'rates of change', 'accumulation'],
    hand: 5, ordered: true, repeats: false, operations: ['transform', 'differentiate', 'integrate'], canon: 'the heights panel: a lane seen from the side' },
  { band: 13, name: 'Trade-offs', holds: ['models', 'optimization', 'games and strategy', 'marginal cost and benefit', 'deciding under uncertainty'],
    hand: 6, ordered: 'either', repeats: true, operations: ['model', 'optimize', 'price'], canon: 'ask for a little turn, pay a little; ask the world to swing around you, and somebody else catches the weight' }
].map((b) => Object.freeze({ ...b, quarters: Object.freeze([(b.band - 1) * BAND_QUARTERS + 1, b.band * BAND_QUARTERS]), holds: Object.freeze(b.holds), operations: Object.freeze(b.operations) })));

const clampInt = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n) || lo)));
/** The band a quarter (1–104) falls in. */
export const bandOfQuarter = (quarter) => Math.ceil(clampInt(quarter, 1, QUARTERS) / BAND_QUARTERS);
/** The cone's radius at a band: how many clusters are in view, 1 at the tip, all 7 by band 13. */
export const coneRadius = (band) => Math.min(CLUSTERS.length, Math.ceil(clampInt(band, 1, BANDS_IN_ARC) / 2));
/** The cluster a quarter turns to face the pupil. */
export const focusOfQuarter = (quarter) => CLUSTERS[(clampInt(quarter, 1, QUARTERS) - 1) % CLUSTERS.length];

/** The clusters in view: the focus, then its neighbours on the ring, alternating sides, out to the radius. */
export function clustersInView(focusId, radius) {
  const at = Math.max(0, CLUSTERS.findIndex((c) => c.id === focusId));
  const n = CLUSTERS.length;
  const out = [CLUSTERS[at]];
  for (let step = 1; out.length < Math.min(radius, n); step += 1) {
    out.push(CLUSTERS[(at + step) % n]);
    if (out.length < radius) out.push(CLUSTERS[(at - step + n * 2) % n]);
  }
  return out.slice(0, radius);
}

const choose = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const arrange = (n, k) => (k > n ? 0 : Array.from({ length: k }, (_, i) => n - i).reduce((a, b) => a * b, 1));

/**
 * How many distinct hands of `hand` cards can be made from `n`, by the band's rules.
 * ordered + repeats: n^k · ordered: n!/(n-k)! · repeats: C(n+k-1, k) · neither: C(n, k).
 * 'either' counts both the sets and the sequences (they are different spells).
 * @param {number} n
 * @param {{ hand: number, ordered: boolean | 'either', repeats: boolean }} rule
 */
export function hands(n, { hand, ordered, repeats }) {
  const one = (isOrdered) => (isOrdered ? (repeats ? n ** hand : arrange(n, hand)) : (repeats ? choose(n + hand - 1, hand) : choose(n, hand)));
  if (ordered === 'either') return one(false) + (hand > 1 ? one(true) : 0);
  return one(Boolean(ordered));
}

/**
 * What the cards can do at a reach. Pass a quarter (a number, or { quarter }) or a band ({ band });
 * focus: a cluster id to face (default: the quarter's own, or the band's first quarter's).
 * @param {number | { quarter?: number, band?: number, focus?: string }} at
 */
export function combinatoricsFor(at) {
  const spec = typeof at === 'number' ? { quarter: at } : (at || {});
  const band = spec.band != null ? clampInt(spec.band, 1, BANDS_IN_ARC) : bandOfQuarter(spec.quarter ?? 1);
  const row = BANDS[band - 1];
  const quarter = spec.quarter != null ? clampInt(spec.quarter, 1, QUARTERS) : row.quarters[0];
  const focus = CLUSTERS.find((c) => c.id === spec.focus) || focusOfQuarter(quarter);
  const cone = coneRadius(band);
  return {
    band,
    name: row.name,
    holds: row.holds,
    hand: row.hand,
    ordered: row.ordered,
    repeats: row.repeats,
    operations: row.operations,
    canon: row.canon,
    focus: focus.id,
    cone,
    clusters: clustersInView(focus.id, cone).map((c) => c.id),
    sigilHands: hands(SIGIL_CARDS.length, row)
  };
}
