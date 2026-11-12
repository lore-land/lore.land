// @ts-check
/**
 * wish-kitchen.mjs — what a wished-for dish turns into, and what a busy kitchen makes of a mimed order.
 *
 * Imagining a boonberry dish wishes it into a form: the boonberry concentration crossed with the dish wanted. How the
 * two are crossed depends on who is wishing, because a wish goes through a character the way light goes through glass:
 *   Boof        a dot product: only the part of the wish that points where she already is comes out (a bone)
 *   BoneWAP     a dot product with the frame declared: only the axes the wish says aloud, nothing it does not show
 *   BoonWAP     a scaled sum: the dish itself, bigger, and never smaller than what was asked
 *   BaneWAP     a cross product: what comes out is perpendicular to what was asked; it comes true the bad way
 *   the Genie   a projection with a price: what boonberries can do, less what the wish costs
 *   a clown     everything bigger, and a crust on it
 *   a mime      an order nobody can read: it goes to the kitchen, and comes back as the kitchen read it
 * Each result lands on the nearest dish the land already has (pies, a jam, a pickle, the regional savoury, the uneven
 * slice, seed-cake, a bone). Nobody says anything: the result is said in plain words, as the land would describe it.
 * Pure: no DOM. Proposed canon (.spw/surfaces/gossip-and-kitchens.spw).
 */

/** The axes a dish lives on: five tastes and textures, and two of form. */
export const AXES = Object.freeze(['sweet', 'sour', 'bitter', 'savoury', 'warm', 'crisp', 'soft', 'round', 'spread']);

/** @typedef {Partial<Record<string, number>>} Taste */
/** @typedef {{ id: string, name: string, v: Taste, ground: string }} Dish */

/** The land's dishes, each grounded where the book or its canon has it. @type {ReadonlyArray<Dish>} */
export const DISHES = Object.freeze([
  { id: 'pie', name: 'a warm boonberry pie', v: { sweet: 0.7, warm: 0.8, crisp: 0.5, soft: 0.4, round: 1 }, ground: 'the pie in the lanes, never smaller (characters.mjs, BoonWAP)' },
  { id: 'uneven_slice', name: 'an uneven slice', v: { sweet: 0.5, warm: 0.4, crisp: 0.6, soft: 0.3, round: 0.2 }, ground: 'Chapter 15: the Feast of the Uneven Slice' },
  { id: 'jam', name: 'a boonberry jam', v: { sweet: 0.9, sour: 0.3, soft: 0.5, spread: 1 }, ground: 'berries.json kitchen: a pinch of baneberry sets a jam' },
  { id: 'pickle', name: 'a baneberry pickle', v: { sour: 0.9, bitter: 0.5, crisp: 0.6, savoury: 0.3 }, ground: 'berries.json kitchen: a pinch keeps a pickle' },
  { id: 'regional', name: 'the regional savoury', v: { savoury: 1, warm: 0.6, soft: 0.4, bitter: 0.1 }, ground: 'the boneberry feeds, and tastes of where it grew (pie-game boneFlavour)' },
  { id: 'bane_dish', name: 'the regional dish with baneberries', v: { bitter: 0.6, savoury: 0.6, sour: 0.3, warm: 0.5 }, ground: 'the mimes order it to hear gossip; which dish it is, nobody has said' },
  { id: 'seed_cake', name: 'a seed-cake', v: { sweet: 0.4, crisp: 0.5, soft: 0.5, warm: 0.3 }, ground: 'Chapter 5: seed-cake crumbs' },
  { id: 'bone', name: 'a bone', v: { savoury: 0.6, crisp: 0.9 }, ground: 'Boof: a dog keeps mornings, not weeks' }
]);

/** What a boonberry can do on its own, as a direction: sweet, a little sour, soft, spreading. */
export const BOONBERRY = Object.freeze({ sweet: 0.8, sour: 0.3, soft: 0.4, spread: 0.3 });
/** Where Boof already is. */
const BOOF = Object.freeze({ savoury: 0.6, crisp: 0.9 });
/** The axes a wish says aloud: the ones BoneWAP will make. */
const DECLARED = Object.freeze(['savoury', 'warm', 'crisp']);
const TASTES3 = /** @type {const} */ (['sweet', 'sour', 'bitter']);

const vec = (/** @type {Taste} */ t) => AXES.map((a) => Number(t[a]) || 0);
const toTaste = (/** @type {number[]} */ v) => /** @type {Taste} */ (Object.fromEntries(AXES.map((a, i) => [a, Math.round(v[i] * 1000) / 1000])));
const dot = (/** @type {number[]} */ a, /** @type {number[]} */ b) => a.reduce((n, x, i) => n + x * b[i], 0);
const norm = (/** @type {number[]} */ a) => Math.sqrt(dot(a, a));
const scale = (/** @type {number[]} */ a, /** @type {number} */ k) => a.map((x) => x * k);

/** How alike two tastes are: the cosine of the angle between them (0 when either is nothing). @param {Taste} a @param {Taste} b */
export function likeness(a, b) {
  const x = vec(a);
  const y = vec(b);
  const n = norm(x) * norm(y);
  return n ? dot(x, y) / n : 0;
}

/** The dish a taste is nearest. A taste that is almost nothing is a crumb. @param {Taste} t */
export function nearestDish(t) {
  if (norm(vec(t)) < 0.08) return { id: 'crumb', name: 'a crumb', v: {}, ground: 'what the ants carry' };
  return DISHES.map((d) => ({ d, s: likeness(t, d.v) })).sort((a, b) => b.s - a.s)[0].d;
}

/** A dish by id, or a taste given directly. @param {string | Taste} want */
const tasteOf = (want) => (typeof want === 'string' ? DISHES.find((d) => d.id === want)?.v || {} : want);

/**
 * The cross product, in the three tastes (sweet, sour, bitter): perpendicular to both the wish and the boonberry.
 * @param {number[]} w @param {number[]} b
 */
function cross3(w, b) {
  const [i, j, k] = TASTES3.map((a) => AXES.indexOf(a));
  const out = new Array(AXES.length).fill(0);
  out[i] = w[j] * b[k] - w[k] * b[j];
  out[j] = w[k] * b[i] - w[i] * b[k];
  out[k] = w[i] * b[j] - w[j] * b[i];
  return out.map(Math.abs);
}

/**
 * A mimed order, as the kitchen reads it. The busier the kitchen, the further the reading wanders; the special chef
 * reads it exactly. rand: a seedable source (deterministic in checks).
 * @param {string | Taste} order
 * @param {{ busyness?: number, chef?: boolean, rand?: () => number }} [opts]
 */
export function orderAsRead(order, { busyness = 0.5, chef = false, rand = Math.random } = {}) {
  const asked = vec(tasteOf(order));
  const read = chef ? asked : asked.map((x) => Math.max(0, x + (rand() * 2 - 1) * Math.max(0, Math.min(1, busyness)) * 0.9));
  const wanted = nearestDish(toTaste(asked));
  const dish = nearestDish(toTaste(read));
  return { read: toTaste(read), dish, wanted, misread: dish.id !== wanted.id };
}

/**
 * A wished-for dish, through a character. concentration: how much boonberry there is to wish with, 0 to 1.
 * @param {string | Taste} want
 * @param {{ who?: string, concentration?: number, rand?: () => number }} [opts]
 * @returns {{ who: string, product: string, taste: Taste, dish: Dish, wanted: Dish, says: string } | null}
 */
export function wishDish(want, { who = 'boof', concentration = 0.6, rand = Math.random } = {}) {
  if (who === 'figure') return null;   // nobody has said
  const c = Math.max(0, Math.min(1, Number(concentration) || 0));
  const w = vec(tasteOf(want));
  const wanted = nearestDish(toTaste(w));
  const b = vec(BOONBERRY);
  let out;
  let product;
  let says;
  if (who === 'boof') {
    const unit = vec(BOOF);
    const u = scale(unit, 1 / norm(unit));
    out = scale(u, Math.max(0, dot(w, u)) * c);
    product = 'dot';
    says = 'only the part of the wish that pointed where she already was came out';
  } else if (who === 'bonewap') {
    out = AXES.map((a, i) => (DECLARED.includes(a) ? w[i] * c : 0));
    product = 'dot, framed';
    says = 'only what the wish said aloud was made, and nothing it did not show';
  } else if (who === 'boon') {
    out = scale(w, 1 + c);
    product = 'scaled sum';
    says = 'the dish itself came out, bigger, and no smaller than asked';
  } else if (who === 'bane') {
    // Perpendicular in taste, and the taste is what is tasted: the form of the wish keeps only a little of itself.
    let perp = cross3(w, b);
    if (norm(perp) < 1e-6) perp = AXES.map((a) => (a === 'bitter' ? 1 : 0));   // a wish already all boonberry: bitter
    const size = norm(perp);
    out = AXES.map((a, i) => (TASTES3.includes(/** @type {any} */ (a)) ? (perp[i] / size) * (c + 0.4) : w[i] * c * 0.25));
    product = 'cross';
    says = 'what came out was perpendicular to what was asked: it came true the bad way';
  } else if (who === 'genie') {
    const unit = scale(b, 1 / norm(b));
    const along = scale(unit, Math.max(0, dot(w, unit)) * c);
    const price = (1 - c) * 0.3;
    out = along.map((x, i) => (AXES[i] === 'warm' ? Math.max(0, x - price) : x));
    product = 'projection, priced';
    says = 'what boonberries could do was made, less what the wish cost';
  } else if (who === 'clown') {
    out = scale(w, 1 + 2 * c).map((x, i) => (AXES[i] === 'crisp' ? x + 0.6 : x));
    product = 'everything bigger';
    says = 'everything came out bigger, with a crust on it';
  } else if (who === 'mime') {
    const read = orderAsRead(want, { busyness: 0.8, rand });
    out = vec(read.read);
    product = 'an order as read';
    says = read.misread ? 'the order went to a busy kitchen, and came back as the kitchen read it' : 'the order was read right, which is rare';
  } else {
    out = scale(w, c);
    product = 'plain';
    says = 'the wish came out as wished, as much as there was boonberry for';
  }
  const taste = toTaste(out);
  const dish = nearestDish(taste);
  return { who, product, taste, dish, wanted, says: `${dish.name}: ${says}.` };
}
