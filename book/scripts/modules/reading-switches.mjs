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
 */

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

function valueFor(state, entry) {
  return state.choices[entry.id] || entry.defaults[state.cohort] || 'off';
}

function resolvedMap(state) {
  return Object.fromEntries(SWITCHES.map((entry) => [entry.id, valueFor(state, entry)]));
}

/* Literal attribute names (not built from the id) so the wiring stays
   greppable and spw:probes' attribute_parity can trace CSS to its setter. */
function applySwitches(map) {
  const root = document.documentElement;
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
  const react = () => {
    scenesOpen(map['scenes-open'] === 'on');
    focusLine.set(map['focus-line'] === 'on');
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

  panel.append(group('For every reader', SWITCHES.filter((entry) => entry.stage === 'stable')));
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
    unbindCopy();
    notes?.remove();
    panel.remove();
  };
}
