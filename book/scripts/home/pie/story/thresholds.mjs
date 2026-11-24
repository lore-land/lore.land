// @ts-check
/**
 * pie/story/thresholds.mjs — a shelf that crosses the line opens two ways.
 *
 * Toward is what the world does (the chain already acts this out).
 * Aside is what the character thinks they are doing: the myopia, one step
 * off the motive. Said once a shelf a carry, so a warm shelf does not
 * lecture every room. The play loop asks; this file only answers.
 */

/** @typedef {'boon' | 'bane' | 'bone' | 'bonk' | 'honk'} Shelf */

/** @type {Readonly<Record<Shelf, { who: string, toward: string, aside: string }>>} */
export const ASIDES = Object.freeze({
  boon: {
    who: 'boon',
    toward: 'The court gathers. The shelf stayed warm.',
    aside: 'Mr. BoonWAP hears the flock and takes it for an audience. They came because someone laughed first. A crowd is a mirror that claps.'
  },
  bane: {
    who: 'bane',
    toward: 'A scheme finds a stamp. The shelf stayed sharp.',
    aside: 'Mr. BaneWAP stamps the feeling and calls it a policy. The stamp is how a mood learns to look like a plan.'
  },
  bone: {
    who: 'bonewap',
    toward: 'The road is measured. The shelf stayed load-bearing.',
    aside: 'BoneWAP counts the steps and misses the song. A receipt is myopia with good handwriting.'
  },
  bonk: {
    who: 'clown',
    toward: 'Glass is ahead. The shelf stayed clumsy on purpose.',
    aside: 'The clown studies the crack and is proud of the pattern. The pattern is the mistake, framed and hung up like a post.'
  },
  honk: {
    who: 'boof',
    toward: 'An echo gets loose, a beat late. The shelf stayed listening.',
    aside: 'Boof follows a note that has already left the room. She will cross a grove for a punchline and call the detour a direction.'
  }
});

const ORDER = /** @type {ReadonlyArray<Shelf>} */ (['boon', 'bane', 'bone', 'bonk', 'honk']);

/**
 * Shelves at or over the line, strongest first. The vector is the normalized one
 * the lanes already keep (a share of the mix, even at one fifth).
 * @param {Partial<Record<string, number>>} [v]
 * @param {number} [threshold]
 * @returns {Shelf[]}
 */
export function shelvesOpen(v = {}, threshold = 0.3) {
  return ORDER.filter((shelf) => (Number(v[shelf]) || 0) >= threshold)
    .sort((a, b) => (Number(v[b]) || 0) - (Number(v[a]) || 0));
}

/**
 * The next threshold branch, or null when every open shelf has been said.
 * @param {Partial<Record<string, number>>} [v]
 * @param {readonly string[]} [said]
 * @param {number} [threshold]
 * @returns {{ shelf: Shelf, who: string, toward: string, aside: string } | null}
 */
export function thresholdBranch(v = {}, said = [], threshold = 0.3) {
  const shelf = shelvesOpen(v, threshold).find((id) => !said.includes(id));
  if (!shelf) return null;
  const line = ASIDES[shelf];
  return { shelf, who: line.who, toward: line.toward, aside: line.aside };
}
