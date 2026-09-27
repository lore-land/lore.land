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

import { chapterPath } from './chapter-links.mjs?v=2026_02_28.I';

const SWITCHES_KEY = 'lore.switches.v1';
const SEEN_RELEASE_KEY = 'lore.release.seen';
const PROGRESS_KEY = 'lore.chapter.progress.v1';
const CHANGES_URL = '/book/content/changes.json';
const ENGAGED_AFTER = 3;

export const SWITCHES = Object.freeze([
  {
    id: 'return-notes', attribute: 'data-switch-return-notes', stage: 'stable', label: 'Notes on what changed',
    hint: 'When you come back after a new release, a short card says what is new.',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'full-rail', attribute: 'data-switch-full-rail', stage: 'stable', label: 'Every instrument in the rail',
    hint: 'The rail as it was: every Spw panel beside the story, desk or no desk.',
    defaults: { returning: 'on', new: 'off' }
  },
  {
    id: 'logline', attribute: 'data-switch-logline', stage: 'stable', label: 'Summary above the title',
    hint: 'The one-line summary at the top of each chapter.',
    defaults: { returning: 'on', new: 'off' }
  },
  {
    id: 'stacks', attribute: 'data-switch-stacks', stage: 'stable', label: 'Wander the stacks',
    hint: 'At each chapter\u2019s end: its shelf-mates in any library, by call number.',
    defaults: { returning: 'on', new: 'on' }
  },
  {
    id: 'offline-shelf', attribute: 'data-switch-offline-shelf', stage: 'stable', label: 'Keep every chapter offline',
    hint: 'All thirteen chapters stay readable with no network: on a train, in a nook, anywhere.',
    defaults: { returning: 'off', new: 'off', installed: 'on' }
  },
  {
    id: 'scenes-open', attribute: 'data-switch-scenes-open', stage: 'stable', label: 'Open every scene',
    hint: 'Scene sketches start unfolded: where to stand, the light, the smell.',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'focus-line', attribute: 'data-switch-focus-line', stage: 'trial', label: 'Reading line',
    hint: 'Paragraphs you are not reading dim a little.',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'paragraph-numbers', attribute: 'data-switch-paragraph-numbers', stage: 'trial', label: 'Numbered paragraphs',
    hint: 'Numbers in the margin, for citing a passage in a note or a workshop.',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'reading-time', attribute: 'data-switch-reading-time', stage: 'trial', label: 'Minutes per section',
    hint: 'How long each chamber takes, at an unhurried pace.',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'resonance', attribute: 'data-switch-resonance', stage: 'trial', label: 'The grammar, faintly',
    hint: 'Each part of a chapter shows the Spw sigil it enacts. Tap one for its reading in the story, the stacks, and the machine.',
    defaults: { returning: 'off', new: 'off' }
  },
  {
    id: 'prompts', attribute: 'data-switch-prompts', stage: 'trial', label: 'Plate prompts',
    hint: 'At the chapter’s end: image prompts composed from its scenes, ready to copy.',
    defaults: { returning: 'off', new: 'off' }
  }
]);

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
    return Object.keys(window.localStorage).some((key) => key.startsWith('lore.') && !/^lore\.(nook|switches|release)/.test(key))
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

const TOTAL_CHAPTERS = 13;
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
  try {
    seen = window.localStorage.getItem(SEEN_RELEASE_KEY) || '';
    window.localStorage.setItem(SEEN_RELEASE_KEY, current);
  } catch {
    return null;
  }
  // New readers have nothing to compare against; the card is for people who were here.
  if (map['return-notes'] !== 'on' || state.cohort !== 'returning' || !current || seen === current) {
    return null;
  }
  const changes = await fetch(CHANGES_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  const releases = (changes?.releases || []).filter((entry) => !seen || entry.release > seen);
  if (!releases.length) {
    return null;
  }
  // Not an <aside>: a dozen modules find the rail with querySelector('aside'),
  // and this card sits earlier in the document than the rail does.
  const card = document.createElement('div');
  card.className = 'return-notes';
  card.setAttribute('role', 'note');
  card.setAttribute('aria-label', 'What changed since your last visit');
  const kicker = document.createElement('p');
  kicker.className = 'return-notes-kicker';
  kicker.textContent = 'Since you were last here';
  const list = document.createElement('ul');
  releases.slice(0, 2).forEach((entry) => (entry.notes || []).forEach((note) => {
    const item = document.createElement('li');
    item.textContent = note;
    list.append(item);
  }));
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'return-notes-close';
  close.textContent = 'Thanks';
  close.addEventListener('click', () => card.remove());
  card.append(kicker, list, close);
  document.querySelector('main.chapter .chapter-head')?.append(card);
  return card;
}

/* ─── Panel ─────────────────────────────────────────────────────────── */

export function initReadingSwitches({ announce } = {}) {
  const state = resolveState();
  let map = resolvedMap(state);
  applySwitches(map);
  persist(state);

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
        map = resolvedMap(state);
        applySwitches(map);
        persist(state);
        react();
        announce?.(`${entry.label}: ${input.checked ? 'on' : 'off'}.`);
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

  panel.append(group('For every reader', SWITCHES.filter((entry) => entry.stage === 'stable')));
  shelfStatus = document.createElement('p');
  shelfStatus.className = 'reading-switches-note reading-shelf-status';
  shelfStatus.setAttribute('aria-live', 'polite');
  panel.append(shelfStatus);
  if (engaged) {
    panel.append(group('Trials', SWITCHES.filter((entry) => entry.stage === 'trial'), 'New things we are trying with readers who keep coming back. They may change or leave.'));
  } else {
    const teaser = document.createElement('p');
    teaser.className = 'reading-switches-teaser';
    const remaining = ENGAGED_AFTER - chaptersVisited();
    teaser.textContent = `More switches open as you read: ${remaining} more chapter${remaining === 1 ? '' : 's'} to go.`;
    panel.append(teaser);
  }

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
