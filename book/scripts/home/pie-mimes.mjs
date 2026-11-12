// @ts-check
/**
 * pie-mimes.mjs — the mimes have lives before the gloves (a trial: the mimes-remember switch).
 *
 * Every mime in the lanes was someone first. A few had real windows broken in a former trade, and a mime who once
 * swept up real glass is the likeliest to march with Mimes Against WAP. A good many did well for years, quite
 * steadily, and then put on the gloves; nobody in the land finds that strange. Mimes who will not march often work
 * at bakeries: they feel bad about their peers, and it shows in the flour.
 *
 * Breaking a mime's imaginary pane costs nothing then. The slice goes through, the lane opens, and the mime only
 * looks. It is remembered. Over later chapters and carries, panes broken add up to a grudge: Mr. BaneWAP finds the
 * march easier to call, and more of the solid things in a room turn out to be mimes. Kindness has no counter here,
 * and none is needed: a mime who bakes stays out of it.
 *
 * Pure: the game draws, places and remembers; this holds the table and the arithmetic. Nobody here says anything.
 */

/** @typedef {{ id: string, was: string, panes: boolean, bakes: boolean, prospered: boolean, weight: number }} FormerLife */

/** @type {ReadonlyArray<FormerLife>} */
export const FORMER_LIVES = Object.freeze([
  { id: 'glazier', was: 'a glazier, until the hailstorm', panes: true, bakes: false, prospered: false, weight: 2 },
  { id: 'greenhouse', was: 'kept a greenhouse on the corner where the carts turn', panes: true, bakes: false, prospered: false, weight: 2 },
  { id: 'window_dresser', was: 'dressed a shop window twice a week, for nine years', panes: true, bakes: false, prospered: false, weight: 1.5 },
  { id: 'lamp_glass', was: 'made lamp glass for the torch-ants, who are particular', panes: true, bakes: false, prospered: false, weight: 1 },
  { id: 'merchant', was: 'a merchant who did well, steadily, for twenty years', panes: false, bakes: false, prospered: true, weight: 3 },
  { id: 'clerk', was: 'a clerk who never once filed late', panes: false, bakes: false, prospered: true, weight: 2.5 },
  { id: 'landlord', was: 'let rooms near the plaza, every one of them full', panes: false, bakes: false, prospered: true, weight: 2 },
  { id: 'surveyor', was: 'surveyed straight lines in a city that has none, profitably', panes: false, bakes: false, prospered: true, weight: 1.5 },
  { id: 'baker', was: 'bakes, still, before anyone else is up', panes: false, bakes: true, prospered: false, weight: 3 },
  { id: 'bakery_hand', was: 'kneads at the bakery by the parcel gate', panes: false, bakes: true, prospered: false, weight: 2 },
  { id: 'porter', was: 'carried sacks of flour, one shoulder, then the other', panes: false, bakes: false, prospered: false, weight: 1.5 },
  { id: 'crier', was: 'cried the news in Bonk City, loudly, for a while', panes: false, bakes: false, prospered: false, weight: 1 }
]);

const SUM = FORMER_LIVES.reduce((n, l) => n + l.weight, 0);

/**
 * A mime's former life. rand: a number in [0, 1). The weights hold the land's proportions: about two in five did well
 * for years first, about a quarter swept up real glass once, about a fifth bake.
 * @param {number} rand
 * @returns {FormerLife}
 */
export function formerLife(rand) {
  let at = Math.max(0, Math.min(0.999999, rand)) * SUM;
  for (const life of FORMER_LIVES) { at -= life.weight; if (at < 0) return life; }
  return FORMER_LIVES[FORMER_LIVES.length - 1];
}

/**
 * The grudge the land holds, from panes broken over every carry so far: 0 (none) to 1 (as much as it gets). It grows
 * quickly at first and then slowly, so a single bad afternoon is not the whole story.
 * @param {number} shattered
 */
export const grudgeOf = (shattered) => 1 - Math.exp(-Math.max(0, Number(shattered) || 0) / 6);

/**
 * How many extra chances the march gets when Mr. BaneWAP picks a scheme: one more for a mild grudge, up to three.
 * Mimes who once swept up real glass, seen this carry, add one more.
 * @param {{ grudge: number, glassSeen?: number }} at
 */
export const marchWeight = ({ grudge, glassSeen = 0 }) => Math.min(4, Math.round(grudge * 3) + (glassSeen >= 2 ? 1 : 0));

/**
 * Whether a solid thing in a room that already keeps mimes turns out to be a mime instead. Never more than half again.
 * @param {number} grudge @param {number} rand
 */
export const mimeInstead = (grudge, rand) => rand < grudge * 0.35;

/** A mime's label in the lanes (Ask, Labels): who they were, in a few words. @param {FormerLife | null | undefined} life */
export const formerWords = (life) => (life ? (life.bakes ? `a mime who ${life.was}` : `once ${life.was}`) : '');

/** What a bakery mime leaves as the carrier passes: a little flour, once. */
export const BAKERY_FLOUR = 0.06;
