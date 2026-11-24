// @ts-check
/**
 * pie/menu/teach.mjs — what Setup says about a choice.
 *
 * The drawer in pie-game.mjs paints this. The sentences live with the handles
 * (pie/tune/scene.mjs) so a shelf lean and its lesson cannot drift apart.
 * The play loop does not grow a second table.
 */
import { HANDLES, SHELVES, SHELF_GENRE, handleOf, sceneVector } from '../tune/scene.mjs';

/** @param {string} key @param {unknown} value @returns {string} */
export function teachLine(key, value) {
  return handleOf(key, value)?.teach || '';
}

/** @param {string} key @param {unknown} value @returns {string} */
export function nudgeLine(key, value) {
  return handleOf(key, value)?.nudge || '';
}

/**
 * The hands, as the touch rows currently have them.
 * @param {Record<string, unknown>} [view]
 * @returns {string}
 */
export function handsLine(view = {}) {
  return ['tap', 'doubleTap', 'swipeUp'].map((key) => handleOf(key, view[key])?.teach).filter(Boolean).join(' ');
}

/**
 * Where the explicit handles sit on the genre matrix.
 * Ties stay even: an untouched board does not pretend to have leaned.
 * @param {Record<string, unknown>} [view]
 * @param {Record<string, unknown>} [genre]
 * @returns {string}
 */
export function leanSentence(view = {}, genre = {}) {
  const v = sceneVector(view, genre);
  const best = Math.max(...SHELVES.map((shelf) => v[shelf]));
  const tops = SHELVES.filter((shelf) => v[shelf] === best);
  if (tops.length !== 1) {
    return 'The handles sit even on the five shelves, beside the genre dial. A carry is what tips a room.';
  }
  const shelf = tops[0];
  return `These handles lean ${shelf}, ${SHELF_GENRE[shelf]}, on the same shelves as the genre dial. A shelf that stays warm sets someone moving, and they will misread why.`;
}

/** The joke a choice unlocks, if it has one. @param {string} key @param {unknown} value */
export function jokeOf(key, value) {
  const handle = handleOf(key, value);
  if (!handle?.joke) return null;
  return { id: handle.joke, shelf: handle.shelf, teach: handle.teach, nudge: handle.nudge || '' };
}

export { HANDLES };
