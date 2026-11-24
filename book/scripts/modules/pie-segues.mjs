/**
 * pie-segues.mjs — the doors between the story and Exactly One Pie (PLAN.E L28).
 *
 * Every level of the game is a place the story has already been. Where a
 * chapter reaches that place, a door at the end of the section offers to
 * carry the pie from there; the game opens on that level and remembers the
 * page and the section it was found in. When the carry ends, the game points
 * back into the chapter where its level happens, and offers the way home —
 * to the very section the reader left — where a small note says how the
 * carry went.
 *
 * A scene may have more than one door. The chapter in `from` wins when that
 * chapter has the scene; otherwise the scene opens on its home chapter:
 *
 *   field   the warm furrow                          Chapter One
 *   lanes   the lanes, which curve for everyone      Chapter Six
 *   plaza   the plaza, where the pie holds court     Chapter Six
 *   court   the rented court, arriving in pieces     Chapter Eleven
 *   table   the long table, a second place set       Chapter Fifteen
 *   gate    the parcel gate, in a storm              Chapter Fifteen
 *
 * A section without an id is found by a phrase it holds, and linked to by a
 * text fragment (#:~:text=). The same table drives the doors (chapter pages)
 * and the way out (pie-game.mjs).
 */
import { settle } from './settled.mjs?v=2026_11_16.B';
import { carryFor, describeLean, mimesHold } from './pie-carries.mjs?v=2026_11_08.J';

const BACK_KEY = 'lore.pie.back';
const pad = (n) => String(n).padStart(2, '0');
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];

export const SEGUES = Object.freeze([
  { scene: 'field', chapter: 1, anchor: 'the-warm-furrow', door: 'Carry the pie along the warm furrow', place: 'the warm furrow', trope: 'a furrow kept warm' },
  { scene: 'field', chapter: 3, anchor: 'the-seam-in-the-sand', door: 'Carry the pie across the sand seam', place: 'the seam in the sand', trope: 'signals in the sand' },
  { scene: 'court', chapter: 4, anchor: 'no-key-covers-the-egg', door: 'Carry the pie past Council Hill', place: 'Council Hill', trope: 'an unassigned council' },
  { scene: 'lanes', chapter: 6, find: 'Fool’s Labyrinth', door: 'Carry the pie through the lanes', place: 'the lanes of Bonk City', trope: 'lanes that curve for everyone' },
  { scene: 'plaza', chapter: 6, anchor: 'the-pie-at-the-table', door: 'Carry a pie past the court', place: 'the plaza, where the pie holds court', trope: 'a pie holding court' },
  { scene: 'plaza', chapter: 7, anchor: 'the-shadow-price', door: 'Carry the pie past the cooling stone', place: 'the cooling stone', trope: 'an oath’s shadow at dusk' },
  { scene: 'field', chapter: 8, anchor: 'the-unpriceable-want', door: 'Carry the pie to the well’s rim', place: 'the unpriceable want', trope: 'a want the well will not price' },
  { scene: 'court', chapter: 10, anchor: 'what-the-frame-would-bear', door: 'Carry the pie along the timber frame', place: 'Bone.land’s timber frame', trope: 'a frame that bears the weight' },
  { scene: 'court', chapter: 11, anchor: 'the-wish-that-would-not-finish', door: 'Carry the pie through the rented court', place: 'the rented court', trope: 'an empire arriving in pieces' },
  { scene: 'field', chapter: 12, anchor: 'both-receipts-posted', door: 'Carry the pie to the confluence', place: 'the confluence', trope: 'two springs at once' },
  { scene: 'table', chapter: 13, anchor: 'the-blank-last-line', door: 'Carry the pie to the shell-shaped door', place: 'the shell-shaped door', trope: 'a door waiting for a question' },
  { scene: 'field', chapter: 14, anchor: 'the-hat-above-the-furrow', door: 'Carry the pie through the missing Thursday', place: 'the furrow on Thursday', trope: 'the Thursday nobody kept' },
  { scene: 'gate', chapter: 15, anchor: 'the-parcel-gate', door: 'Carry the pie through the storm', place: 'the parcel gate', trope: 'a gate held open in a storm' },
  { scene: 'table', chapter: 15, find: 'a second place', door: 'Carry the pie to the second place', place: 'the long table', trope: 'a second place, set' }
]);

/** The chapter a bare ?scene= opens on, when `from` names no chapter of that scene. */
const SCENE_HOME = Object.freeze({ field: 1, lanes: 6, plaza: 6, court: 11, table: 15, gate: 15 });

const chapterIn = (from) => {
  const found = /\/book\/chapter\/(\d{2})\//.exec(String(from || ''));
  return found ? Number(found[1]) : 0;
};

/** The door for a scene. A from-path that names a chapter of that scene wins; otherwise the scene's home chapter. */
export const segueFor = (scene, from) => {
  const matches = SEGUES.filter((segue) => segue.scene === scene);
  if (!matches.length) return null;
  const n = chapterIn(from);
  return matches.find((segue) => segue.chapter === n)
    || matches.find((segue) => segue.chapter === SCENE_HOME[scene])
    || matches[0];
};
export const chapterWords = (n) => `Chapter ${WORDS[n] || n}`;

/** Where in the story a level happens: the section by id, or by its phrase. */
export function storyHref(segue) {
  const base = `/book/chapter/${pad(segue.chapter)}/`;
  return segue.anchor ? `${base}#${segue.anchor}` : `${base}#:~:text=${encodeURIComponent(segue.find)}`;
}

/** The game, opened on a level, remembering where the reader was. */
export function gameHref(segue, from) {
  const params = new URLSearchParams({ scene: segue.scene });
  if (from) params.set('from', from);
  return `/pie/?${params}`;
}

/** A same-site path the game may send a reader back to, or null. */
export function safeReturn(raw) {
  const value = String(raw || '');
  return value.startsWith('/') && !value.startsWith('//') && !/[\s<>"]/.test(value) ? value : null;
}

/** "Chapter Six, the plaza…" — what a return path is, in words. */
export function describeReturn(path) {
  const chapter = /\/book\/chapter\/(\d{2})\//.exec(path || '');
  if (chapter) {
    const n = Number(chapter[1]);
    const segue = SEGUES.find((entry) => entry.chapter === n && (path.includes(entry.anchor || '\u0000') || path.includes(encodeURIComponent(entry.find || '\u0000'))));
    return segue ? `${chapterWords(n)}, ${segue.place}` : chapterWords(n);
  }
  if (/^\/folios\//.test(path)) return 'the folio wall';
  if (/^\/almanac\//.test(path)) return 'your almanac';
  if (/^\/scriptorium\//.test(path)) return 'your desk';
  if (/^\/zine\//.test(path)) return 'the Broadside';
  if (/^\/(#.*)?$/.test(path)) return 'the entrance';
  return 'where you were';
}

/** The game leaves a note for the page it returns to (read below, on arrival). */
export function leaveBackNote(note) {
  try { window.sessionStorage.setItem(BACK_KEY, JSON.stringify(note)); } catch { /* the way home still works */ }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

const plain = (text) => String(text || '').replace(/[’']/g, "'").toLowerCase();

/** Chapter pages: a door at the end of each section where a level happens; a note on the way back. */
export function initPieSegues({ chapterData } = {}) {
  const main = document.getElementById('chapter-content');
  if (!main) return () => {};
  const n = Number(chapterData?.chapterNumber || document.body.dataset.chapter || 0);
  const sections = [...main.querySelectorAll('[data-ebook-section]')];
  const added = [];
  const held = mimesHold(n);
  SEGUES.filter((segue) => segue.chapter === n).forEach((segue) => {
    const section = segue.anchor
      ? document.getElementById(segue.anchor)
      : sections.find((candidate) => plain(candidate.textContent).includes(plain(segue.find)));
    if (!section) return;
    const here = segue.anchor ? `${location.pathname}#${segue.anchor}` : `${location.pathname}#:~:text=${encodeURIComponent(segue.find)}`;
    const door = el('a', {
      className: `pie-door${held ? ' is-held' : ''}`,
      href: gameHref(segue, here),
      title: `Exactly One Pie, from ${segue.place}${held ? ' · held by Mimes Against WAP' : ''}`
    },
      el('span', { className: 'pie-door-sigil', 'aria-hidden': 'true' }, '◎'),
      ` ▶ Play: ${segue.door.charAt(0).toLowerCase()}${segue.door.slice(1)}${held ? ' · held by the mimes — win it back' : ''}`);
    const row = el('p', { className: 'pie-door-row' }, door);
    section.append(row);
    added.push(row);
  });

  // Back from a carry: say how it went, once.
  let note = null;
  try {
    note = JSON.parse(window.sessionStorage.getItem(BACK_KEY) || 'null');
    window.sessionStorage.removeItem(BACK_KEY);
  } catch { note = null; }
  if (note && note.path && location.pathname === note.path.split('#')[0]) {
    const waps = note.waps ? ` ${note.waps} clown${note.waps === 1 ? '' : 's'} got WAP.` : '';
    const wonders = note.wonders ? ` ${note.wonders} wonder${note.wonders === 1 ? '' : 's'} kept in your almanac.` : '';
    const eggs = note.eggs ? ' Something warm passed close.' : '';
    const carry = carryFor(n);
    const mark = carry
      ? (carry.maw === 'won'
        ? ' Mimes Against WAP hold this chapter now.'
        : carry.maw === 'back'
          ? ' Won back from the mimes.'
          : ` This chapter’s reading now ${describeLean(carry.lean)}.`)
      : '';
    setTimeout(() => settle({
      sigil: '◎',
      title: `Back from ${note.place || 'the lanes'}`,
      detail: note.cobbles != null
        ? `${note.carrier ? `${note.carrier.charAt(0).toUpperCase()}${note.carrier.slice(1)}` : 'Someone'} carried it ${note.cobbles} cobbles.${waps}${wonders}${eggs}${mark} Exactly one pie, as promised.`
        : `The pie is still level. The page is where you left it.${wonders}${eggs}`,
      region: 'main.chapter',
      lifetime: 5600
    }), 900);
  }

  return () => added.forEach((node) => node.remove());
}
