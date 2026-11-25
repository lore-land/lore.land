// @ts-check
/**
 * pie/story/eggs.mjs — what an egg does to the picture, and what a hidden tap may say.
 *
 * The egg is not explained. A count and a spiral may be heard; the words do not
 * name the formula. The picture keeps a mark for as long as the sound does.
 */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} times how many times it has been passed, still not taken
 */
export function warmthMark(x, y, times) {
  return { kind: 'warmth', x, y, t: 0, life: 1.6, rings: times >= 3 ? 3 : 1 };
}

/**
 * @param {'pi' | 'golden'} kind
 * @param {number} x
 * @param {number} y
 */
export function hushMark(kind, x, y) {
  if (kind === 'pi') return { kind: 'digits', x, y, t: 0, life: 1.7 };
  if (kind === 'golden') return { kind: 'spiral', x, y, t: 0, life: 1.9 };
  return null;
}

/** A toast that does not teach the trick. */
export function hushToast(kind) {
  if (kind === 'pi') return { title: 'A count that does not end', body: 'It stays in the key you are already in.' };
  if (kind === 'golden') return { title: 'Something circles the light', body: 'It does not come down.' };
  return null;
}

/**
 * Three rising specks in the carrier's colour, one for each step of the tune.
 * @param {string} color
 * @param {number} x
 * @param {number} y
 */
export function voiceMark(color, x, y) {
  return { kind: 'voice', color, x, y, t: 0, life: 0.7 };
}
