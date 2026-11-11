/**
 * reading-switches.mjs — features that default to off, and a promise.
 *
 * The promise: nobody loses what they had. A visitor who was reading
 * before a release keeps that release's defaults (cohort "returning");
 * a new visitor gets the new ones. Every switch has a default per cohort.
 *
 * Stable switches are for everyone. Trials are features still being
 * tested: they show in the drawer once a visitor has read a few chapters
 * (they've earned the workshop), or when they arrive with a link like
 * /book/chapter/01/?try=focus-line,prompts — which is how a trial gets
 * handed to engaged readers. Choices persist in lore.switches.v1.
 *
 * The template's head script applies the stored switches before first
 * paint (html[data-switch-<id>="on"]); keep its cohort rule in sync with
 * cohortFromStorage() here.
 *
 * Installed readers (display-mode: standalone) get one default of their own:
 * the offline shelf starts on, because installing is consent to keep the book.
 */

import { settle } from './settled.mjs?v=2026_11_09.L';
import { visitSwitches, dropSwitch, readStory } from './story-directions.mjs?v=2026_11_09.L';
import { chapterPath } from './chapter-links.mjs?v=2026_11_10.A';
import { TOTAL_CHAPTERS } from './book-extent.mjs';
import { activeBias, setBias, castHouseRegister, initBiasFromURL } from './spw-bias.mjs?v=2026_11_09.L';

const SWITCHES_KEY = 'lore.switches.v1';
const SEEN_RELEASE_KEY = 'lore.release.seen';
const PROGRESS_KEY = 'lore.chapter.progress.v1';
const CHANGES_URL = '/book/content/changes.json';
const ENGAGED_AFTER = 3;

export const SWITCHES = Object.freeze([
  {
    id: 'return-notes', attribute: 'data-switch-return-notes', stage: 'stable', layer: 'reader', label: 'Notes on what changed',
    hint: 'When you come back after a new release, a short card says what is new.',
    effect: { on: 'Next release, a card says what changed.', off: 'No card next release; the notes still live on your desk (Scriptorium, What changed).' },
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'full-rail', attribute: 'data-switch-full-rail', stage: 'stable', layer: 'reader', label: 'Every instrument in the rail',
    hint: 'The rail as it was: every Spw panel beside the story, desk or no desk.',
    effect: { on: 'Every Spw panel is back beside the story.', off: 'The rail keeps only what a reader uses; the panels live at the desk.' }, region: 'aside',
    defaults: { returning: 'on', new: 'off' }
  },
  {
    id: 'logline', attribute: 'data-switch-logline', stage: 'stable', layer: 'reader', label: 'Summary above the title',
    hint: 'The one-line summary at the top of each chapter.',
    effect: { on: 'The one-line summary sits above each title.', off: 'Titles stand alone again.' }, region: '.chapter-logline, main.chapter .chapter-head',
    defaults: { returning: 'on', new: 'off' }
  },
  {
    id: 'xray', attribute: 'data-switch-xray', stage: 'stable', layer: 'reader', label: 'Structure mode',
    hint: 'Tap, hold or brush words, sentences and paragraphs: the threads they belong to, the way they lean, the sign they sit under.',
    effect: { on: 'Tap a word, hold it, or brush across a line — the structure shows through.', off: 'The prose is plain prose again.' }, region: 'main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'stacks', attribute: 'data-switch-stacks', stage: 'stable', layer: 'reader', label: 'Wander the stacks',
    hint: 'At each chapter\u2019s end: its shelf-mates in any library, by call number.',
    effect: { on: 'Each chapter ends with its shelf-mates, by call number.', off: 'Chapters end without the shelf.' }, region: '.chapter-stacks',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'scene-light', attribute: 'data-switch-scene-light', stage: 'stable', layer: 'reader', label: 'Hold the light',
    hint: 'At the end of each section: hold the scene\u2019s light (drag the sun, turn its warmth, glow, ink, grain and edge, or carry it with you) and frame a passage for a screenshot.',
    effect: { on: 'Each section ends with the light table and a frame.', off: 'The scenes light themselves; no tools at the section\u2019s end.' }, region: 'main.chapter',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'table', attribute: 'data-switch-table', stage: 'stable', layer: 'reader', label: 'At the table',
    hint: 'At each chapter\u2019s end, a closed page for playing in it: the place, its people, hooks, a d6, things worth carrying out, a bracework move, and the page\u2019s own dice.',
    effect: { on: 'Each chapter ends with a page for playing in it.', off: 'Chapters end without the table.' }, region: '.chapter-table',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'offline-shelf', attribute: 'data-switch-offline-shelf', stage: 'stable', layer: 'reader', label: 'Keep every chapter offline',
    hint: 'Every chapter stays readable with no network: on a train, in a nook, anywhere.',
    effect: { on: 'Keeping every chapter for reading with no network.', off: 'Only the chapters you have opened stay kept.' },
    defaults: { returning: 'off', new: 'off', installed: 'on' }
  },
  {
    id: 'scenes-open', attribute: 'data-switch-scenes-open', stage: 'stable', layer: 'reader', label: 'Open every scene',
    hint: 'Scene sketches start unfolded: where to stand, the light, the smell.',
    effect: { on: 'Every scene sketch starts unfolded.', off: 'Scene sketches start folded.' }, region: 'main.chapter details.scene-sketch',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'wonders', attribute: 'data-switch-wonders', stage: 'stable', layer: 'reader', label: 'Wonders in the prose',
    hint: 'Creatures, antiques, artifacts, contrivances and bracework are marked where a chapter first names them. Tap one to keep it in your almanac and see where else it lives.',
    effect: { on: 'Wonders are marked; tap one to keep it.', off: 'The prose is unmarked; your almanac keeps what you found.' }, region: 'main.chapter',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'sightings', attribute: 'data-switch-sightings', stage: 'stable', layer: 'reader', label: 'Sightings',
    hint: 'When you notice the figure under the hat, a small card says so, and his drawing gains a line.',
    effect: { on: 'Each sighting gets a card and a line in the drawing.', off: 'Sightings are kept quietly, without a card.' },
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'tellings', attribute: 'data-switch-tellings', stage: 'stable', layer: 'reader', label: 'Other tellings',
    hint: 'Some phrases are told more than one way; a faint wavy line marks them. Tap one to hear its next telling, hold it to see them all, or turn the hour in the rail and watch the page change with the day.',
    effect: { on: 'Phrases with other tellings are marked; tap to turn, hold for all.', off: 'Every phrase reads as plain words; what you heard is kept.' }, region: 'main.chapter',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'reasons', attribute: 'data-switch-reasons', stage: 'trial', layer: 'trial', label: 'Why each chapter is here',
    hint: 'At each chapter\u2019s end, a closed fold: why the book has this chapter, and one line a single edit away from it to guess about.',
    effect: { on: 'Each chapter ends with a fold saying why it is here.', off: 'Chapters end without the fold.' }, region: '.way-why',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'drawn-places', attribute: 'data-switch-drawn-places', stage: 'trial', layer: 'trial', label: 'Drawn places',
    hint: 'Each chapter ends with a painting of the place the game carries you through there, and a way to go.',
    effect: { on: 'Each chapter ends with its place, painted.', off: 'Chapters end with their own words.' },
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'way-through', attribute: 'data-switch-way-through', stage: 'trial', layer: 'trial', label: 'Your way through',
    hint: 'Set chapters aside and keep some people out of the same room, said as one line of Spw at your desk. A chapter after one you stepped over says what it held.',
    effect: { on: 'Your way through applies. Choose it at your desk.', off: 'The whole book, in order, everyone in their rooms.' },
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'living', attribute: 'data-switch-living', stage: 'trial', layer: 'trial', label: 'Phrases turn with the clock',
    hint: 'A few phrases in every chapter turn by the minute, the hour or the day (never the one you are reading), and the marked words catch the light now and then. Off, every word is the book\u2019s own. For one visit: ?phrases=turn, or ?at=19:00 to see the words of that hour.',
    effect: { on: 'Phrases turn with the clock, away from where you are reading.', off: 'Every phrase is the book\u2019s own again.' }, region: 'main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'room-by-room', attribute: 'data-switch-room-by-room', stage: 'trial', layer: 'trial', label: 'Room by room',
    hint: 'A chapter opens one room at a time: the room you are in stands whole, rooms you have read fold to their signature, and the rest are doors until you reach them. Each room’s end has a door to the next.',
    effect: { on: 'One room at a time; a door at the end of each opens the next.', off: 'The whole chapter is open again; the rooms keep their signatures.' }, region: 'main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'focus-line', attribute: 'data-switch-focus-line', stage: 'trial', layer: 'trial', label: 'Reading line',
    hint: 'Paragraphs you are not reading dim a little.',
    effect: { on: 'Paragraphs you are not reading dim a little.', off: 'Every paragraph at full strength.' }, region: 'main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'paragraph-numbers', attribute: 'data-switch-paragraph-numbers', stage: 'trial', layer: 'trial', label: 'Numbered paragraphs',
    hint: 'Numbers in the margin, for citing a passage in a note or a workshop.',
    effect: { on: 'Numbers in the margin of every paragraph.', off: 'The margin is clear.' }, region: 'main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'reading-time', attribute: 'data-switch-reading-time', stage: 'trial', layer: 'trial', label: 'Minutes per section',
    hint: 'How long each chamber takes, at an unhurried pace.',
    effect: { on: 'Each chamber says how long it takes.', off: 'No minutes shown.' }, region: 'main.chapter .section-meta',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'resonance', attribute: 'data-switch-resonance', stage: 'trial', layer: 'trial', label: 'The grammar, faintly',
    hint: 'Each part of a chapter shows the Spw sigil it enacts. Tap one for its reading in the story, the stacks, and the machine.',
    effect: { on: 'Each part shows the sigil it enacts; tap one for its readings.', off: 'The grammar steps back out of sight.' }, region: 'main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'prompts', attribute: 'data-switch-prompts', stage: 'trial', layer: 'trial', label: 'Plate prompts',
    hint: 'At the chapter’s end: image prompts composed from its scenes, ready to copy.',
    effect: { on: "Image prompts wait at the chapter's end.", off: 'No prompts at the end.' }, region: '.chapter-prompts, main.chapter',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'bias', attribute: 'data-switch-bias', stage: 'trial', layer: 'trial', label: 'Answers in a register',
    hint: 'The small answers (a pop in the lanes, a notice, the receipt that says what changed) now and then come back in a meme register, cast as a spell: POV, plot twist, core memory unlocked. On, it casts the house register of the day; a link with ?bias=pov casts another for the visit. One register at a time is always free; layering several is a trial for now. The story keeps every word of its own.',
    effect: { on: 'Now and then the land answers in a register; the story keeps its own words.', off: 'Every answer is plain again; nothing you kept has changed.' },
    defaults: { returning: 'off', new: 'off' }
  }
]);

/* The layers the drawer is grouped by (.spw/surfaces/layers.spw): reader switches for every
   reader, trials for readers who have earned the workshop. */
const LAYER_GROUPS = Object.freeze([
  { layer: 'reader', title: 'For every reader' },
  { layer: 'trial', title: 'Trials', note: 'New things we are trying with readers who keep coming back. They may change or leave.', engaged: true }
]);

/* The bias trial (spw-bias.mjs): on, the house register of the day answers unless the visit has
   one; off, the visit's register is let go. A ?bias= link turns it on for the visit only. */
function reactBias(on) {
  if (on) {
    if (!activeBias()) castHouseRegister({ from: 'reader' });
  } else {
    setBias(null, { from: 'reader' });
  }
}
const withVisitBias = (map) => {
  // A link's ?without=bias wins for the visit: the register it would have answered in is let go.
  if (readStory().without?.includes('bias')) {
    if (activeBias()) setBias(null, { from: 'link' });
    return map;
  }
  return activeBias() && map.bias !== 'on' ? { ...map, bias: 'on' } : map;
};

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode: switches still work for this visit.
  }
}

/** Had this browser read lore.land before switches existed? */
export function cohortFromStorage() {
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith('lore.') && !/^lore\.(nook|switches|release|way)/.test(key))
      ? 'returning'
      : 'new';
  } catch {
    return 'new';
  }
}

function chaptersVisited() {
  const progress = readJSON(PROGRESS_KEY, {});
  return Array.isArray(progress?.visited) ? progress.visited.length : 0;
}

function tryListFromUrl() {
  try {
    const raw = new URL(window.location.href).searchParams.get('try') || '';
    return raw.split(',').map((id) => id.trim()).filter((id) => SWITCHES.some((entry) => entry.id === id));
  } catch {
    return [];
  }
}

/** For other rooms (the Scriptorium desk): the reader's switches as they stand. */
export function readSwitches() {
  const state = resolveState();
  return { cohort: state.cohort, engaged: chaptersVisited() >= ENGAGED_AFTER || state.tried.length > 0, values: resolvedMap(state) };
}

/** For other rooms: flip one switch the same way the drawer does. */
export function setSwitch(id, on) {
  const state = resolveState();
  state.choices[id] = on ? 'on' : 'off';
  applySwitches(resolvedMap(state));
  persist(state);
  if (id === 'bias') reactBias(on);
  return resolvedMap(state);
}

function resolveState() {
  const stored = readJSON(SWITCHES_KEY, null);
  const state = {
    cohort: stored?.cohort || cohortFromStorage(),
    choices: { ...(stored?.choices || {}) },
    tried: Array.isArray(stored?.tried) ? stored.tried : []
  };
  // A ?try= link is an explicit choice: switch it on and remember it was offered.
  tryListFromUrl().forEach((id) => {
    state.choices[id] = 'on';
    if (!state.tried.includes(id)) {
      state.tried.push(id);
    }
  });
  return state;
}

function isInstalled() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

function valueFor(state, entry) {
  if (state.choices[entry.id]) {
    return state.choices[entry.id];
  }
  if (isInstalled() && entry.defaults.installed) {
    return entry.defaults.installed;
  }
  return entry.defaults[state.cohort] || 'off';
}

function resolvedMap(state) {
  return Object.fromEntries(SWITCHES.map((entry) => [entry.id, valueFor(state, entry)]));
}

/* Literal attribute names (not built from the id) so the wiring stays
   greppable and spw:probes' attribute_parity can trace CSS to its setter. */
function applySwitches(map) {
  const root = document.documentElement;
  // Until this is set, default-on features show (no-JS, first paint); after
  // it, CSS may hide what a reader switched off.
  root.setAttribute('data-switches-ready', 'true');
  SWITCHES.forEach((entry) => {
    if (map[entry.id] === 'on') {
      root.setAttribute(entry.attribute, 'on');
    } else {
      root.removeAttribute(entry.attribute);
    }
  });
}

function persist(state) {
  writeJSON(SWITCHES_KEY, { cohort: state.cohort, choices: state.choices, tried: state.tried, resolved: resolvedMap(state) });
}

/* ─── Behaviors that need script (the rest is CSS on data-switch-*) ──── */

function scenesOpen(on) {
  document.querySelectorAll('main.chapter details.scene-sketch').forEach((details) => {
    details.open = on;
  });
}

function createFocusLine() {
  let observer = null;
  let current = null;
  const start = () => {
    if (observer || !('IntersectionObserver' in window)) {
      return;
    }
    observer = new IntersectionObserver((entries) => {
      const hit = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)[0];
      if (!hit || hit === current) {
        return;
      }
      current?.classList.remove('is-reading-line');
      current = hit;
      current.classList.add('is-reading-line');
    }, { rootMargin: '-38% 0px -58% 0px', threshold: 0 });
    document.querySelectorAll('main.chapter [data-ebook-section] > p').forEach((p) => observer.observe(p));
  };
  const stop = () => {
    observer?.disconnect();
    observer = null;
    current?.classList.remove('is-reading-line');
    current = null;
  };
  return { set: (on) => (on ? start() : stop()), stop };
}

const SHELF_KEY = 'lore.shelf.release';

/** Ask the service worker to keep every chapter (and the desk); report the count it kept. */
export function keepChapters(onKept) {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) {
    queueMicrotask(() => onKept?.(null));
    return () => {};
  }
  const onMessage = (event) => {
    if (event.data?.type === 'CHAPTERS_KEPT') {
      onKept?.(event.data);
    }
  };
  navigator.serviceWorker.addEventListener('message', onMessage);
  const urls = Array.from({ length: TOTAL_CHAPTERS }, (_, index) => new URL(chapterPath(index + 1), window.location.origin).href);
  // Everything this page loaded to dress itself (modules, styles, fonts, the
  // sigil) is shared by every chapter; hand it over so kept pages stay dressed.
  const assets = performance.getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => name.startsWith(window.location.origin) && /\.(css|mjs|js|json|woff2?|otf|svg)(\?|$)/.test(name));
  urls.push(new URL('/scriptorium/', window.location.origin).href);
  // The game and the atlas travel with the book: kept too, so an installed copy can play and look offline.
  urls.push(new URL('/pie/', window.location.origin).href, new URL('/seeds/2026-02-28/', window.location.origin).href);
  controller.postMessage({ type: 'KEEP_CHAPTERS', urls, assets });
  return () => navigator.serviceWorker.removeEventListener('message', onMessage);
}

/* Install: never a banner. The browser's offer is held and shown as one
   quiet button, only to readers who came back or kept reading. */
let deferredInstall = null;
const installListeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event;
    installListeners.forEach((listener) => listener());
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    installListeners.forEach((listener) => listener());
  });
}

function bindPromptCopy(announce) {
  const onClick = async (event) => {
    const button = event.target.closest?.('[data-copy-prompt]');
    if (!button) {
      return;
    }
    const text = button.parentElement?.querySelector('.plate-prompt-text')?.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
      announce?.('Prompt copied.');
      setTimeout(() => { button.textContent = 'Copy'; }, 1400);
    } catch {
      // Clipboard refused: the prompt is selectable text either way.
    }
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

/* ─── Return notes: a reason to come back is knowing something moved ─── */

async function showReturnNotes(state, map) {
  const current = document.documentElement.dataset.cacheRelease || '';
  let seen = '';
  const markSeen = () => { try { window.localStorage.setItem(SEEN_RELEASE_KEY, current); } catch { /* fine */ } };
  try {
    seen = window.localStorage.getItem(SEEN_RELEASE_KEY) || '';
  } catch {
    return null;
  }
  if (!current || seen === current) return null;
  // A first visit, or notes switched off: there is nothing to tell, so this release is simply seen.
  if (!seen || map['return-notes'] !== 'on') { markSeen(); return null; }
  // Anyone who was here before has a release on record; the card is for them, whatever their cohort. The
  // release counts as seen only once its notes are shown: a failed or stale fetch leaves it for next time.
  const changes = await fetch(CHANGES_URL, { cache: 'no-cache' }).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  if (!changes?.releases?.some((entry) => entry.release === current)) return null;
  const releases = changes.releases.filter((entry) => entry.release > seen && entry.release <= current);
  if (!releases.length) { markSeen(); return null; }
  markSeen();
  // Not an <aside>: a dozen modules find the rail with querySelector('aside'). It floats over the page's
  // corner rather than joining the head, so the chapter never moves under the reader when it arrives.
  const card = document.createElement('div');
  card.className = 'return-notes';
  card.setAttribute('role', 'note');
  card.setAttribute('aria-label', 'What changed since your last visit');
  const kicker = document.createElement('p');
  kicker.className = 'return-notes-kicker';
  kicker.textContent = releases.length > 1 ? `Since you were last here · ${releases.length} releases` : 'Since you were last here';
  const listOf = (entries) => {
    const list = document.createElement('ul');
    entries.forEach((entry) => (entry.notes || []).forEach((note) => {
      const item = document.createElement('li');
      item.append(...linkedText(note));
      list.append(item);
    }));
    return list;
  };
  card.append(kicker, listOf(releases.slice(0, 2)));
  if (releases.length > 2) {
    const more = document.createElement('details');
    more.className = 'return-notes-more';
    const summary = document.createElement('summary');
    summary.textContent = `and ${releases.length - 2} earlier release${releases.length - 2 === 1 ? '' : 's'}`;
    more.append(summary, listOf(releases.slice(2)));
    card.append(more);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'return-notes-close';
  close.textContent = 'Thanks';
  close.addEventListener('click', () => card.remove());
  card.append(close);
  // The body carries perspective (reset.css), so a card that floats belongs in the top layer.
  if ('showPopover' in HTMLElement.prototype) {
    card.setAttribute('popover', 'manual');
    document.body.append(card);
    card.showPopover();
  } else {
    document.documentElement.append(card);
  }
  return card;
}

/* A note's addresses become doors: lore.land/?/… and site paths (/almanac/, /pie/) are linked, the rest is text. */
function linkedText(note) {
  const out = [];
  const pattern = /(?:lore\.land)?(\/\?\/[^\s,;)]+|\/(?:almanac|pie|folios|scriptorium|zine|texture|topics|seeds)\/[^\s,;)]*)/g;
  let last = 0;
  for (const m of note.matchAll(pattern)) {
    const href = m[1].replace(/[.:]+$/, '');
    if (m.index > last) out.push(note.slice(last, m.index));
    const a = document.createElement('a');
    a.href = href;
    a.textContent = m[0].replace(/[.:]+$/, '');
    out.push(a);
    last = m.index + m[0].replace(/[.:]+$/, '').length;
  }
  if (last < note.length) out.push(note.slice(last));
  return out;
}

/* ─── Panel ─────────────────────────────────────────────────────────── */

export function initReadingSwitches({ announce } = {}) {
  const state = resolveState();
  // A link's ?with= / ?without= (story-directions.mjs) hold for the visit; only the reader's own are saved.
  // A ?bias= link likewise turns the bias trial on for the visit (spw-bias.mjs, lore.bias.visit).
  initBiasFromURL();
  let map = withVisitBias(visitSwitches(resolvedMap(state)));
  applySwitches(map);
  persist(state);
  // On by the reader's choice, a ?try= or a ?with=, and nothing cast yet: the house register of the day.
  if (map.bias === 'on' && !activeBias()) castHouseRegister({ from: 'switch' });

  const focusLine = createFocusLine();
  let shelfStatus = null;
  let releaseShelf = () => {};
  let shelfAsked = false;
  const react = () => {
    scenesOpen(map['scenes-open'] === 'on');
    focusLine.set(map['focus-line'] === 'on');
    // Re-shelve once per release: that is when chapter pages and their
    // versioned assets change. Otherwise the shelf is already full.
    const release = document.documentElement.dataset.cacheRelease || '';
    const shelvedFor = (() => {
      try { return window.localStorage.getItem(SHELF_KEY) || ''; } catch { return ''; }
    })();
    if (map['offline-shelf'] === 'on' && !shelfAsked && shelvedFor !== release) {
      shelfAsked = true;
      releaseShelf = keepChapters((result) => {
        if (result?.kept) {
          try { window.localStorage.setItem(SHELF_KEY, release); } catch { /* next visit retries */ }
        }
        if (!shelfStatus) {
          return;
        }
        shelfStatus.textContent = result
          ? `${result.kept} of ${result.total} chapters are on your shelf.`
          : 'Your shelf fills the next time the page loads with the offline helper running.';
      });
    } else if (map['offline-shelf'] === 'on' && shelvedFor === release) {
      queueMicrotask(() => {
        if (shelfStatus) {
          shelfStatus.textContent = 'Every chapter is on your shelf for offline reading.';
        }
      });
    }
  };
  react();
  const unbindCopy = bindPromptCopy(announce);
  let notes = null;
  showReturnNotes(state, map).then((card) => { notes = card; });

  const engaged = chaptersVisited() >= ENGAGED_AFTER || state.tried.length > 0;
  const panel = document.createElement('details');
  panel.className = 'reading-switches';
  const summary = document.createElement('summary');
  summary.textContent = 'Switches';
  panel.append(summary);

  const group = (title, entries, note) => {
    const box = document.createElement('fieldset');
    box.className = 'reading-switches-group';
    const legend = document.createElement('legend');
    legend.textContent = title;
    box.append(legend);
    if (note) {
      const p = document.createElement('p');
      p.className = 'reading-switches-note';
      p.textContent = note;
      box.append(p);
    }
    entries.forEach((entry) => {
      const label = document.createElement('label');
      label.className = 'reading-switch';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = map[entry.id] === 'on';
      input.addEventListener('change', () => {
        state.choices[entry.id] = input.checked ? 'on' : 'off';
        dropSwitch(entry.id);
        if (entry.id === 'bias') reactBias(input.checked);
        map = withVisitBias(visitSwitches(resolvedMap(state)));
        applySwitches(map);
        persist(state);
        react();
        announce?.(`${entry.label}: ${input.checked ? 'on' : 'off'}.`);
        settle({
          sigil: input.checked ? '!' : '~',
          title: `${entry.label}: ${input.checked ? 'on' : 'off'}`,
          detail: input.checked ? entry.effect?.on || entry.hint : entry.effect?.off || 'Back as it was.',
          at: input,
          region: input.checked ? entry.region || 'main.chapter' : null
        });
      });
      const text = document.createElement('span');
      text.className = 'reading-switch-text';
      const name = document.createElement('span');
      name.className = 'reading-switch-name';
      name.textContent = entry.label;
      const hint = document.createElement('span');
      hint.className = 'reading-switch-hint';
      hint.textContent = entry.hint;
      text.append(name, hint);
      label.append(input, text);
      box.append(label);
    });
    return box;
  };

  const invited = state.cohort === 'returning' || engaged || isInstalled();
  const install = document.createElement('button');
  install.type = 'button';
  install.className = 'reading-install';
  install.textContent = 'Put Lore.Land on your shelf';
  install.hidden = true;
  const syncInstall = () => {
    install.hidden = !(deferredInstall && invited);
  };
  install.addEventListener('click', async () => {
    const offer = deferredInstall;
    if (!offer) {
      return;
    }
    deferredInstall = null;
    offer.prompt();
    const choice = await offer.userChoice.catch(() => null);
    announce?.(choice?.outcome === 'accepted' ? 'Lore.Land is on your shelf.' : 'Maybe later.');
    syncInstall();
  });
  installListeners.add(syncInstall);
  syncInstall();
  panel.append(install);

  LAYER_GROUPS.forEach(({ layer, title, note, engaged: needsEngaged }) => {
    if (needsEngaged && !engaged) {
      const teaser = document.createElement('p');
      teaser.className = 'reading-switches-teaser';
      const remaining = ENGAGED_AFTER - chaptersVisited();
      teaser.textContent = `More switches open as you read: ${remaining} more chapter${remaining === 1 ? '' : 's'} to go.`;
      panel.append(teaser);
      return;
    }
    panel.append(group(title, SWITCHES.filter((entry) => entry.layer === layer), note));
    if (layer === 'reader') {
      shelfStatus = document.createElement('p');
      shelfStatus.className = 'reading-switches-note reading-shelf-status';
      shelfStatus.setAttribute('aria-live', 'polite');
      panel.append(shelfStatus);
    }
  });

  const aside = document.querySelector('aside');
  if (aside) {
    const after = aside.querySelector('.reading-nook') || aside.querySelector('.reader-scale-controls');
    if (after) {
      after.insertAdjacentElement('afterend', panel);
    } else {
      aside.append(panel);
    }
  }

  return () => {
    focusLine.stop();
    releaseShelf();
    installListeners.delete(syncInstall);
    unbindCopy();
    notes?.remove();
    panel.remove();
  };
}
