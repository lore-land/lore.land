// @ts-check
/**
 * pie-ants.mjs — what the ants carry (a trial: the anthills switch). Pure: the game places and draws; this chooses.
 *
 * The torch-ants carry crumbs, and with the crumbs, now and then, a scrap of the book: a few words from further on in
 * the chapter, carried as a gift to the crows and ravens at the edge of the road. Run into an anthill and the ants put
 * their crumbs down, lift weights, and gossip, and what they gossip is such a scrap. A scrap is the book's own words,
 * a few of them, with an ellipsis either side: never new words, never quotation marks, and never from a paragraph
 * that holds anything the land keeps back (the figure, the hat, the Egg).
 */

/** Paragraphs that hold something kept back are never gossiped from. */
export const HELD_GOSSIP = /\b(figures?|hats?|bowler|eggs?|dregg|shell|wap\s*-?\s*boy|wabo\w*|plain\s+lines)\b/i;

/** What the ants are, in the lanes: an anthill, and a line of ants carrying a gift to the edge. */
export const ANT_KINDS = Object.freeze(new Set(['anthill', 'antgift']));

/**
 * A few of the book's own words from a paragraph, with an ellipsis either side.
 * @param {string} text
 * @param {() => number} [rand]
 */
export function fragmentOf(text, rand = Math.random) {
  const words = String(text).replace(/[“”"«»]/g, '').split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const n = Math.min(words.length, 4 + Math.floor(rand() * 3));
  const start = Math.max(0, Math.min(words.length - n, Math.floor(rand() * (words.length - n + 1))));
  return `…${words.slice(start, start + n).join(' ').replace(/[,;:.!?—-]+$/, '')}…`;
}

/**
 * Gossip: a scrap from further on in the chapter being carried (at least two paragraphs past where the carry is),
 * from a paragraph long enough to have something in it and clear of anything held. null when there is none.
 * @param {ReadonlyArray<{ text?: string, title?: string } | null | undefined>} paras
 * @param {{ from?: number, rand?: () => number }} [opts]
 * @returns {{ text: string, index: number, title: string } | null}
 */
export function gossipFrom(paras, { from = 0, rand = Math.random } = {}) {
  const ahead = [];
  for (let i = Math.max(0, from + 2); i < paras.length; i += 1) {
    const p = paras[i];
    if (!p || typeof p.text !== 'string') continue;
    if (p.text.split(/\s+/).length < 8 || HELD_GOSSIP.test(p.text)) continue;
    ahead.push({ p, i });
  }
  if (!ahead.length) return null;
  const { p, i } = ahead[Math.floor(rand() * ahead.length) % ahead.length];
  const text = fragmentOf(/** @type {string} */ (p.text), rand);
  return text ? { text, index: i, title: p.title || '' } : null;
}

/** How the game says each moment. Narration, not anyone's line. */
export const ANT_SAYS = Object.freeze({
  bump: 'The ants put down their crumbs, lift weights, and gossip',
  gift: 'A line of ants carries a crumb and a scrap of the book to the edge of the road, a gift for the crows',
  taken: 'A crow takes the gift and goes',
  rolled: 'The ants are rolling a boonberry home'
});
