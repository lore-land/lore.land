/**
 * drawn-places.mjs — a chapter's place, painted at its end (a trial: reading-switches.mjs, `drawn-places`).
 *
 * Which place comes from the game's own map of chapters to places, so the book and the lanes agree. The panel links to a
 * carry starting there. It is added after the chapter's words and changes none of them.
 */
import { readSwitches } from './reading-switches.mjs?v=2026_11_11.A';
import { placeSVG, PLACES } from './panel-art.mjs?v=2026_11_11.A';
import { CHAPTER_SCENE } from '../home/pie-world.mjs?v=2026_11_11.A';

export function initDrawnPlaces({ chapterData } = {}) {
  const n = Number(chapterData?.chapterNumber);
  const main = document.querySelector('main.chapter');
  let on = false;
  try { on = readSwitches().values['drawn-places'] === 'on'; } catch { /* the page reads as written */ }
  const place = PLACES[CHAPTER_SCENE[n]];
  if (!on || !n || !main || !place) return () => {};
  const link = document.createElement('a');
  link.className = 'drawn-place';
  link.href = `/pie/?chapter=${n}`;
  link.innerHTML = `<span class="lore-panel">${placeSVG(CHAPTER_SCENE[n], { w: 640, h: 200 })}</span><span class="drawn-place-words"><b>${place.name}</b> ${place.says} Carry it through here.</span>`;
  const turn = main.querySelector('.chapter-turn');
  if (turn) turn.before(link); else main.append(link);
  return () => link.remove();
}
