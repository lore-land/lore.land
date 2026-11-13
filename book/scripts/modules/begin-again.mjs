/**
 * begin-again.mjs — start the book over (PLAN.E L23).
 *
 * Two ways to begin again, offered wherever a reader might reach for one:
 * beside "Continue reading" on the home page, under the contents in the
 * rail, at the end of the newest chapter, and at the desk (![again]).
 *
 *   From the top   Every mark kept — chapters read, wonders, sightings,
 *                  tellings heard — but the book opens at Chapter One, §01,
 *                  and no chapter offers to pick up where you left off.
 *   A fresh copy   The book as if opened for the first time: no chapter
 *                  read, nothing collected. Settings stay: switches, the
 *                  nook, text size, the binding. What is cleared is set
 *                  aside first, so "Put back" can restore it — joined with
 *                  whatever was marked since, nothing lost either way.
 *
 * The page that opens after a restart says so (a settle card), because a
 * change should leave a visible mark.
 */
import { settle } from './settled.mjs?v=2026_11_09.L';

const KEPT_KEY = 'lore.again.kept.v1';
const JUST_KEY = 'lore.again.just';
const RESUME_KEY = 'lore.reading.resume-chapter';
const NAV_KEY = 'lore.ebook.navigation.v1';
const PROGRESS_KEY = 'lore.chapter.progress.v1';

/** Reading marks and collections: what a fresh copy clears (and sets aside). Settings are not here. */
export const READING_MARKS = Object.freeze([
  PROGRESS_KEY,
  RESUME_KEY,
  NAV_KEY,
  'lore.sightings.v1',
  'lore.almanac.v1',
  'lore.almanac.combines.v1',
  'lore.tellings.v1',
  'lore.pie.v1',
  'lore.pie.chapters.v1',
  'lore.pie.rhythms.v1',
  'lore.pie.finds.v1',
  'lore.texture.finds.v1',
  'lore.desk.spells.v1',
  'lore.home.curiosities.v1',
  'lore.chamber.receipts.v1',
  'lore.chamber.key-file.v1',
  'lore.experience.max-glyph-tier',
  'lore.experience.seed-adopted',
  'lore.reader.gesture-hint.v1',
  'lore.rooms.v1',
  'lore.cards.v1',
  'lore.palettes.v1',
  'lore.likeness.seen.v1',
  'lore.wonders.asked.v1'
]);

const store = () => {
  try { return window.localStorage; } catch { return null; }
};
const readJSON = (key, fallback) => {
  try { return JSON.parse(store()?.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
};
const count = (value) => (Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 0);

/** What a reader has, in plain numbers, for the sheet's wording. */
export function readingMarks() {
  const progress = readJSON(PROGRESS_KEY, {});
  const tellings = readJSON('lore.tellings.v1', {});
  return {
    chapters: count(progress.visited),
    wonders: count(readJSON('lore.almanac.v1', {})),
    sightings: count(readJSON('lore.sightings.v1', {})?.seen ?? readJSON('lore.sightings.v1', {})),
    tellings: Object.values(tellings).reduce((sum, list) => sum + count(list), 0)
  };
}

export function keptMarks() {
  const kept = readJSON(KEPT_KEY, null);
  return kept && kept.marks && typeof kept.marks === 'object' ? kept : null;
}

/** From the top: positions forgotten, marks kept. */
export function fromTheTop() {
  const ls = store();
  if (!ls) return;
  ls.setItem(RESUME_KEY, '1');
  const nav = readJSON(NAV_KEY, {});
  Object.values(nav).forEach((entry) => {
    if (entry && typeof entry === 'object') {
      delete entry.sectionIndex;
      delete entry.sectionId;
      delete entry.progress;
    }
  });
  ls.setItem(NAV_KEY, JSON.stringify(nav));
}

/** A fresh copy: every reading mark set aside, then cleared. */
export function freshCopy() {
  const ls = store();
  if (!ls) return;
  const marks = {};
  READING_MARKS.forEach((key) => {
    const value = ls.getItem(key);
    if (value != null) marks[key] = value;
  });
  if (Object.keys(marks).length) ls.setItem(KEPT_KEY, JSON.stringify({ at: new Date().toISOString(), marks }));
  READING_MARKS.forEach((key) => ls.removeItem(key));
}

/* Marks made since the fresh copy are not lost: lists join, records merge, and the kept value wins a tie. */
const merge = (now, then) => {
  if (Array.isArray(now) && Array.isArray(then)) return [...new Set([...then, ...now])];
  if (now && then && typeof now === 'object' && typeof then === 'object') {
    const out = { ...now };
    Object.entries(then).forEach(([key, value]) => { out[key] = key in now ? merge(now[key], value) : value; });
    return out;
  }
  return then;
};

/** Put my marks back: the set-aside marks return, joined with any made since. */
export function putMarksBack() {
  const ls = store();
  const kept = keptMarks();
  if (!ls || !kept) return false;
  Object.entries(kept.marks).forEach(([key, value]) => {
    let next = value;
    try {
      const now = JSON.parse(ls.getItem(key) || 'null');
      const then = JSON.parse(value);
      if (now && then && typeof now === 'object' && typeof then === 'object') next = JSON.stringify(merge(now, then));
    } catch { /* not JSON: the kept value returns as it was */ }
    ls.setItem(key, next);
  });
  ls.removeItem(KEPT_KEY);
  return true;
}

const say = (marks) => {
  const parts = [
    marks.chapters ? `${marks.chapters} chapter${marks.chapters === 1 ? '' : 's'} read` : null,
    marks.wonders ? `${marks.wonders} wonder${marks.wonders === 1 ? '' : 's'} kept` : null,
    marks.tellings ? `${marks.tellings} telling${marks.tellings === 1 ? '' : 's'} heard` : null
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'nothing marked yet';
};

const keptDate = (kept) => {
  try { return new Date(kept.at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }); } catch { return 'earlier'; }
};

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

const START = '/book/chapter/01/';
let sheet = null;

function closeSheet() {
  if (!sheet) return;
  if (sheet.hasAttribute('popover') && sheet.matches(':popover-open')) {
    try { sheet.hidePopover(); } catch { /* already closed */ }
  }
  sheet.remove();
  sheet = null;
  document.removeEventListener('keydown', onSheetKey);
}
const onSheetKey = (event) => { if (event.key === 'Escape') closeSheet(); };

const go = (mode) => {
  try { window.sessionStorage.setItem(JUST_KEY, mode); } catch { /* the page still opens */ }
  window.location.assign(START);
};

/** The sheet: two ways to begin again, and the marks set aside, if any. */
export function openBeginAgain(at = null) {
  closeSheet();
  const marks = readingMarks();
  const kept = keptMarks();
  const top = el('button', { type: 'button', className: 'again-choice', 'data-mode': 'top' },
    el('span', { className: 'again-choice-name' }, '↺ From the top'),
    el('span', { className: 'again-choice-says' }, `Chapter One, first page. You keep everything: ${say(marks)}.`));
  const fresh = el('button', { type: 'button', className: 'again-choice', 'data-mode': 'fresh' },
    el('span', { className: 'again-choice-name' }, '❦ A fresh copy'),
    el('span', { className: 'again-choice-says' }, `As if you had never opened it. ${say(marks) === 'nothing marked yet' ? 'Nothing to clear yet' : `${say(marks).charAt(0).toUpperCase()}${say(marks).slice(1)} — set aside, not lost`}. Your switches, nook and binding stay.`));
  const back = kept ? el('button', { type: 'button', className: 'again-restore' }, `Put back the marks set aside on ${keptDate(kept)}`) : null;
  const cancel = el('button', { type: 'button', className: 'again-cancel' }, 'Not now');

  top.addEventListener('click', () => { fromTheTop(); go('top'); });
  fresh.addEventListener('click', () => { freshCopy(); go('fresh'); });
  back?.addEventListener('click', () => {
    putMarksBack();
    closeSheet();
    settle({ sigil: '❦', title: 'Your marks are back', detail: 'Chapters read, wonders, sightings and tellings, as they were.', at, region: 'main' });
    window.dispatchEvent(new CustomEvent('lore:marks-restored'));
  });
  cancel.addEventListener('click', closeSheet);

  sheet = el('div', { className: 'again-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'again-title' },
    el('h2', { id: 'again-title' }, 'Begin again'),
    el('p', { className: 'again-lede' }, 'The book can start over two ways.'),
    el('div', { className: 'again-choices' }, top, fresh),
    back,
    cancel);
  if ('showPopover' in HTMLElement.prototype) {
    sheet.setAttribute('popover', 'manual');
    document.body.append(sheet);
    sheet.showPopover();
  } else {
    document.documentElement.append(sheet);
  }
  document.addEventListener('keydown', onSheetKey);
  top.focus({ preventScroll: true });
  return sheet;
}

/** A small "Begin again" button for any surface. */
export function beginAgainButton(label = '↺ Begin again') {
  const button = el('button', { type: 'button', className: 'begin-again' }, label);
  button.addEventListener('click', () => openBeginAgain(button));
  return button;
}

/** Chapter pages: the rail's contents, the newest chapter's end, and the mark a restart leaves. */
export function initBeginAgain({ chapterData, latest } = {}) {
  const added = [];
  const nav = document.querySelector('aside .ebook-nav-panel');
  if (nav) {
    const button = beginAgainButton();
    button.classList.add('begin-again--rail');
    nav.append(button);
    added.push(button);
  }
  const n = Number(chapterData?.chapterNumber || 0);
  if (latest && n === latest) {
    const end = document.querySelector('main.chapter .chapter-turn') || document.querySelector('main.chapter .chapter-end-mark');
    if (end) {
      const coda = el('p', { className: 'begin-again-coda' },
        'That is the newest page. ',
        beginAgainButton('Begin the book again'));
      end.insertAdjacentElement('afterend', coda);
      added.push(coda);
    }
  }
  let just = null;
  try {
    just = window.sessionStorage.getItem(JUST_KEY);
    window.sessionStorage.removeItem(JUST_KEY);
  } catch { /* no mark to leave */ }
  if (just) {
    setTimeout(() => settle(just === 'fresh'
      ? { sigil: '❦', title: 'A fresh copy', detail: 'Nothing read, nothing kept. Your marks are set aside: Begin again → Put back, whenever you want them.', region: 'main.chapter', lifetime: 6400 }
      : { sigil: '↺', title: 'From the top', detail: 'Chapter One, first page. Everything you found is still yours.', region: 'main.chapter', lifetime: 5200 }), 700);
  }
  return () => {
    added.forEach((node) => node.remove());
    closeSheet();
  };
}
