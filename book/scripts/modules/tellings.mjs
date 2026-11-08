/**
 * tellings.mjs — other tellings (PLAN.E L24).
 *
 * Some phrases in every chapter are told more than one way: the living slots
 * (`.living-slot[data-variants]`, chapter-render.mjs). Variant zero is the
 * book's own words. This module lets a reader turn them by hand:
 *
 *   tap a phrase        it rolls to its next telling; a tag says "2 of 5"
 *   hold it (or ⋯ key)  the hand: every telling as a card, the ones not yet
 *                       heard face down, the length of their words; turn a
 *                       card over to hear it, and the phrase takes it
 *   Turn the hour       a dial in the rail runs the page's clock through the
 *                       day: every phrase rolls to that hour's telling and the
 *                       light walks with it (scene-light.mjs cues); past
 *                       midnight it is the next day
 *   Back to now · The book's own words
 *
 * A telling is heard once it has been on screen. Heard tellings are kept
 * (lore.tellings.v1: {"14:kitchen-smell": [0, 2]}); the rail and the home
 * page count them against the book's total (semantic.json `tellings`).
 *
 * Copy this telling: a link that opens the chapter with these words —
 * every phrase turned away from the book's own (or from the edition's) is
 * pinned with ?tell=, with the edition, lens and binding being read in.
 *
 * living.mjs does the turning; this module asks by event (lore:telling,
 * lore:stage-clock) and listens for lore:told. Switch: `tellings` (stable, on).
 * Reduced motion: no roll, no flip; every telling is still a tap away.
 */
import { settle } from './settled.mjs?v=2026_11_05.B';
import { readStory, storyLink, editionIndex, describeStory } from './story-directions.mjs?v=2026_11_06.F';

const HEARD_KEY = 'lore.tellings.v1';
const SEMANTIC_URL = '/book/content/semantic.json';
const HOLD_MS = 480;
const STEP_MIN = 15;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLOCK_WORDS = { minute: 'turns by the minute', hour: 'turns by the hour', day: 'turns by the day' };
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

/** The light cue for an hour of the day (knobs.json cues). */
export function cueForHour(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

const HOUR_WORDS = ['midnight', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'noon'];
/** "seven in the evening", "a quarter past noon". */
export function sayTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const twelve = h % 12;
  const name = h === 0 ? 'midnight' : h === 12 ? 'noon' : HOUR_WORDS[twelve];
  const part = h === 0 || h === 12 ? '' : h < 12 ? ' in the morning' : h < 17 ? ' in the afternoon' : h < 21 ? ' in the evening' : ' at night';
  const lead = m === 15 ? 'a quarter past ' : m === 30 ? 'half past ' : m === 45 ? 'a quarter to ' : '';
  if (m === 45) {
    const next = (h + 1) % 24;
    const nextName = next === 0 ? 'midnight' : next === 12 ? 'noon' : HOUR_WORDS[next % 12];
    const nextPart = next === 0 || next === 12 ? '' : next < 12 ? ' in the morning' : next < 17 ? ' in the afternoon' : next < 21 ? ' in the evening' : ' at night';
    return `${lead}${nextName}${nextPart}`;
  }
  return `${lead}${name}${part}`;
}

export function readHeard() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HEARD_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeHeard(heard) {
  try { window.localStorage.setItem(HEARD_KEY, JSON.stringify(heard)); } catch { /* private mode: this visit only */ }
}

/** How many tellings a reader has heard across the book. */
export function heardCount(heard = readHeard()) {
  return Object.values(heard).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
}

let semanticPromise = null;
export const loadTellingTotals = () => {
  semanticPromise = semanticPromise || fetch(SEMANTIC_URL).then((res) => (res.ok ? res.json() : null)).then((data) => data?.tellings || null).catch(() => null);
  return semanticPromise;
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

const SVG = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

const canPopover = () => 'showPopover' in HTMLElement.prototype;
function show(node) {
  if (canPopover()) {
    node.setAttribute('popover', 'manual');
    document.body.append(node);
    node.showPopover();
  } else {
    document.documentElement.append(node);
  }
}
function hide(node) {
  if (!node) return;
  if (node.hasAttribute('popover') && node.matches(':popover-open')) {
    try { node.hidePopover(); } catch { /* already hidden */ }
  }
  node.remove();
}

const plain = (name) => String(name || '').replace(/-/g, ' ');

export function initTellings({ chapterData, announce } = {}) {
  const root = document.documentElement;
  const main = document.getElementById('chapter-content');
  if (!main) return () => {};
  const chapter = String(chapterData?.chapterNumber || document.body.dataset.chapter || '').replace(/^0+/, '');
  const slots = [...main.querySelectorAll('.living-slot[data-variants]')].map((node) => {
    let variants = [];
    try { variants = JSON.parse(node.dataset.variants); } catch { variants = []; }
    return { node, name: node.dataset.slot, clock: node.dataset.clock || 'hour', variants, key: `${chapter}:${node.dataset.slot}` };
  }).filter((slot) => slot.variants.length > 1);
  if (!slots.length) return () => {};

  const enabled = () => root.getAttribute('data-switch-tellings') === 'on' || !root.hasAttribute('data-switches-ready');
  const heard = readHeard();
  const slotFor = (node) => slots.find((slot) => slot.node === node);
  const indexOf = (slot) => Math.max(0, slot.variants.indexOf(slot.node.textContent));
  const heardOf = (slot) => new Set(heard[slot.key] || []);
  let fan = null;
  let fanSlot = null;
  let flipped = -1;   // the card just turned face up, so it can finish its flip
  let panel = null;
  let dialAt = null; // the dial's Date, or null when the page keeps its own time

  /* ─── Marks on the phrases ─── */
  const hint = el('span', { id: 'telling-hint', hidden: true },
    'Told more than one way. Enter turns it; hold it, or press the period key, for every telling.');
  document.body.append(hint);

  const paint = (slot) => {
    const known = heardOf(slot);
    slot.node.dataset.told = `${indexOf(slot) + 1} of ${slot.variants.length}`;
    slot.node.dataset.heard = String(known.size);
    slot.node.toggleAttribute('data-heard-all', known.size >= slot.variants.length);
  };

  const hear = (slot, index = indexOf(slot)) => {
    const known = heardOf(slot);
    if (known.has(index)) return false;
    known.add(index);
    heard[slot.key] = [...known].sort((a, b) => a - b);
    writeHeard(heard);
    paint(slot);
    paintPanel();
    if (known.size === slot.variants.length) {
      settle({
        sigil: '✦', title: `Every telling of “${plain(slot.name)}”`,
        detail: `All ${slot.variants.length} ways this chapter tells it. The phrase is underlined twice now.`,
        at: slot.node
      });
    }
    return true;
  };

  const visible = new Set();
  const seen = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const slot = slotFor(entry.target);
      if (!slot) return;
      if (entry.isIntersecting) {
        visible.add(slot);
        if (enabled()) hear(slot);
      } else {
        visible.delete(slot);
      }
    });
  }, { threshold: 1 }) : null;

  /* With the switch off, the phrases are plain words again: not focusable, not buttons. */
  const sync = () => {
    const on = enabled();
    slots.forEach((slot) => {
      if (on) {
        slot.node.setAttribute('tabindex', '0');
        slot.node.setAttribute('role', 'button');
        slot.node.setAttribute('aria-describedby', 'telling-hint');
      } else {
        ['tabindex', 'role', 'aria-describedby'].forEach((name) => slot.node.removeAttribute(name));
      }
    });
    if (!on) closeFan();
  };

  slots.forEach((slot) => {
    slot.node.classList.add('is-telling');
    paint(slot);
    seen?.observe(slot.node);
  });

  const flashTag = (slot) => {
    slot.node.classList.add('is-told');
    clearTimeout(slot.tagTimer);
    slot.tagTimer = setTimeout(() => slot.node.classList.remove('is-told'), 1800);
  };

  const tell = (slot, index) => {
    window.dispatchEvent(new CustomEvent('lore:telling', { detail: { node: slot.node, index } }));
  };

  const onTold = (event) => {
    const slot = slotFor(event.detail?.node);
    if (!slot) return;
    paint(slot);
    if (event.detail.by === 'reader' || visible.has(slot)) hear(slot);
    if (event.detail.by === 'reader') flashTag(slot);
    if (fanSlot === slot) paintFan();
  };

  /* Tap turns; holding (or the period key, or a right click) opens the hand. */
  let holdTimer = 0;
  let held = false;
  const onPointerDown = (event) => {
    const node = event.target.closest?.('.living-slot.is-telling');
    if (!node || !enabled() || event.button > 0) return;
    held = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      held = true;
      openFan(slotFor(node));
    }, HOLD_MS);
  };
  const cancelHold = () => clearTimeout(holdTimer);
  const onClick = (event) => {
    const node = event.target.closest?.('.living-slot.is-telling');
    if (!node || !enabled()) return;
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(holdTimer);
    if (held) { held = false; return; }
    const slot = slotFor(node);
    tell(slot, (indexOf(slot) + 1) % slot.variants.length);
  };
  const onContext = (event) => {
    const node = event.target.closest?.('.living-slot.is-telling');
    if (!node || !enabled()) return;
    event.preventDefault();
    clearTimeout(holdTimer);
    openFan(slotFor(node));
  };
  const onDocKey = (event) => {
    if (event.key === 'Escape' && fan) closeFan(true);
  };
  const onKey = (event) => {
    const node = event.target.closest?.('.living-slot.is-telling');
    if (!node || !enabled()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const slot = slotFor(node);
      tell(slot, (indexOf(slot) + 1) % slot.variants.length);
    } else if (event.key === '.' || event.key === 'ContextMenu') {
      event.preventDefault();
      openFan(slotFor(node));
    }
  };

  // Story-voice custom elements swallow bubbling clicks: bind on each phrase.
  slots.forEach((slot) => {
    slot.node.addEventListener('pointerdown', onPointerDown);
    slot.node.addEventListener('pointerup', cancelHold);
    slot.node.addEventListener('pointerleave', cancelHold);
    slot.node.addEventListener('click', onClick);
    slot.node.addEventListener('contextmenu', onContext);
    slot.node.addEventListener('keydown', onKey);
  });

  /* ─── The hand: every telling as a card ─── */
  const paintFan = () => {
    if (!fan || !fanSlot) return;
    const slot = fanSlot;
    const known = heardOf(slot);
    const current = indexOf(slot);
    const n = slot.variants.length;
    const hand = fan.querySelector('.telling-hand');
    hand.replaceChildren(...slot.variants.map((text, i) => {
      const faceUp = known.has(i);
      const card = el('button', {
        type: 'button',
        className: `telling-card${faceUp ? ' is-face-up' : ' is-face-down'}${i === current ? ' is-current' : ''}${i === 0 ? ' is-canon' : ''}`,
        style: `--spread: ${i - (n - 1) / 2}; --lift: ${Math.abs(i - (n - 1) / 2)}; --len: ${Math.min(1, text.length / 60)}`,
        'aria-pressed': i === current ? 'true' : 'false',
        'aria-label': faceUp ? `${text}${i === 0 ? ' (the book’s own words)' : ''}` : 'A telling not yet heard: turn it over'
      },
      faceUp
        ? [el('span', { className: 'telling-card-text' }, text), i === 0 ? el('span', { className: 'telling-card-note' }, 'the book’s own') : null]
        : el('span', { className: 'telling-card-back', 'aria-hidden': 'true' }, el('span', { className: 'telling-card-blank' })));
      if (i === flipped) card.classList.add('is-unflipping');
      card.addEventListener('click', () => {
        const flip = !faceUp && !reduced?.matches;
        if (flip) card.classList.add('is-flipping');
        setTimeout(() => {
          flipped = flip ? i : -1;
          tell(slot, i);
          hear(slot, i);
          paintFan();
          flipped = -1;
          fan?.querySelectorAll('.telling-card')[i]?.focus({ preventScroll: true });
        }, flip ? 170 : 0);
      });
      return card;
    }));
    fan.querySelector('.telling-fan-foot').textContent = known.size >= n
      ? `All ${n} heard · tap one to tell it`
      : `${known.size} of ${n} heard · turn a card over to hear it`;
  };

  const placeFan = () => {
    if (!fan || !fanSlot) return;
    const box = fanSlot.node.getBoundingClientRect();
    const card = fan.getBoundingClientRect();
    const below = box.bottom + 12 + card.height < window.innerHeight;
    const top = below ? box.bottom + 12 : Math.max(8, box.top - card.height - 12);
    const left = Math.min(Math.max(8, box.left + box.width / 2 - card.width / 2), window.innerWidth - card.width - 8);
    fan.style.top = `${Math.round(top)}px`;
    fan.style.left = `${Math.round(left)}px`;
  };

  const openFan = (slot) => {
    if (!slot) return;
    closeFan();
    fanSlot = slot;
    fan = el('div', { className: 'telling-fan', role: 'dialog', 'aria-label': `Tellings of “${plain(slot.name)}”` },
      el('p', { className: 'telling-fan-head' },
        el('strong', {}, plain(slot.name)),
        ` · told ${slot.variants.length} ways · ${CLOCK_WORDS[slot.clock] || CLOCK_WORDS.hour}`),
      el('div', { className: 'telling-hand' }),
      el('p', { className: 'telling-fan-foot' }));
    show(fan);
    paintFan();
    placeFan();
    fan.querySelector('.telling-card.is-current, .telling-card')?.focus({ preventScroll: true });
    fan.classList.add('is-open');
  };

  const closeFan = (refocus = false) => {
    const slot = fanSlot;
    hide(fan);
    fan = null;
    fanSlot = null;
    if (refocus) slot?.node.focus({ preventScroll: true });
  };

  const onOutside = (event) => {
    if (fan && !fan.contains(event.target) && !event.target.closest?.('.living-slot.is-telling')) closeFan();
  };
  const onScroll = () => { if (fan) placeFan(); };

  /* ─── The rail: the hour dial and the phrases told here ─── */
  const R = 64;
  const C = 80;
  const point = (angle, radius) => [C + radius * Math.sin(angle), C - radius * Math.cos(angle)];
  // Noon at the top, midnight at the foot, like a sun's day.
  const angleFor = (minutes) => ((minutes - 720) / 1440) * Math.PI * 2;
  const minutesFor = (x, y) => {
    const angle = Math.atan2(x - C, C - y);
    return ((Math.round(((angle / (Math.PI * 2)) * 1440 + 720) / STEP_MIN) * STEP_MIN) % 1440 + 1440) % 1440;
  };

  const dialFace = () => {
    const face = svg('svg', { viewBox: '0 0 160 160', class: 'tellings-dial-face', 'aria-hidden': 'true' });
    face.append(svg('circle', { cx: C, cy: C, r: R + 8, class: 'dial-sky' }));
    face.append(svg('circle', { cx: C, cy: C, r: R, class: 'dial-ring' }));
    for (let h = 0; h < 24; h += 1) {
      const a = angleFor(h * 60);
      const long = h % 6 === 0;
      const [x1, y1] = point(a, R - (long ? 9 : 4));
      const [x2, y2] = point(a, R);
      face.append(svg('line', { x1, y1, x2, y2, class: long ? 'dial-tick is-long' : 'dial-tick' }));
    }
    [['☼', 12 * 60], ['☾', 0], ['dawn', 6 * 60], ['dusk', 18 * 60]].forEach(([word, minutes]) => {
      const [x, y] = point(angleFor(minutes), R + 15);
      const label = svg('text', { x, y: y + 3, class: `dial-word${word.length === 1 ? ' is-glyph' : ''}` });
      label.textContent = word;
      face.append(label);
    });
    face.append(svg('line', { x1: C, y1: C, x2: C, y2: C - R, class: 'dial-hand' }));
    face.append(svg('circle', { cx: C, cy: C - R, r: 7, class: 'dial-sun' }));
    face.append(svg('circle', { cx: C, cy: C, r: 2.5, class: 'dial-pin' }));
    return face;
  };

  const now = () => new Date();
  const dialTime = () => dialAt || now();

  const paintDial = () => {
    if (!panel) return;
    const at = dialTime();
    const minutes = at.getHours() * 60 + at.getMinutes();
    const [x, y] = point(angleFor(minutes), R);
    panel.querySelector('.dial-hand')?.setAttribute('x2', x);
    panel.querySelector('.dial-hand')?.setAttribute('y2', y);
    panel.querySelector('.dial-sun')?.setAttribute('cx', x);
    panel.querySelector('.dial-sun')?.setAttribute('cy', y);
    const dial = panel.querySelector('.tellings-dial');
    dial.dataset.cue = cueForHour(at.getHours());
    dial.toggleAttribute('data-dialed', Boolean(dialAt));
    dial.setAttribute('aria-valuenow', String(minutes));
    dial.setAttribute('aria-valuetext', `${DAYS[at.getDay()]}, ${sayTime(at)}`);
    panel.querySelector('.tellings-dial-time').textContent = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
    panel.querySelector('.tellings-dial-day').textContent = dialAt ? DAYS[at.getDay()] : 'now';
    panel.querySelector('.tellings-now').disabled = !dialAt;
  };

  let totals = null;
  const paintPanel = () => {
    if (!panel) return;
    const here = slots.reduce((sum, slot) => sum + slot.variants.length, 0);
    const heardHere = slots.reduce((sum, slot) => sum + heardOf(slot).size, 0);
    panel.querySelector('.tellings-count').textContent =
      `${slots.length} phrases here are told more than one way. You have heard ${heardHere} of their ${here} tellings`
      + (totals?.total ? `, and ${heardCount(heard)} of the book’s ${totals.total}.` : '.');
    panel.querySelectorAll('.tellings-phrase').forEach((chip) => {
      const slot = slots.find((s) => s.key === chip.dataset.key);
      if (!slot) return;
      const known = heardOf(slot).size;
      chip.querySelector('.tellings-phrase-pips').replaceChildren(...slot.variants.map((_, i) =>
        el('span', { className: `pip${heardOf(slot).has(i) ? ' is-heard' : ''}${i === indexOf(slot) ? ' is-current' : ''}` })));
      chip.toggleAttribute('data-heard-all', known >= slot.variants.length);
    });
  };

  const setDial = (date, { quiet = false } = {}) => {
    dialAt = date;
    paintDial();
    window.dispatchEvent(new CustomEvent('lore:stage-clock', { detail: { at: date } }));
    if (!quiet && date) announce?.(`The page at ${sayTime(date)}, ${DAYS[date.getDay()]}.`);
  };

  const buildPanel = () => {
    const aside = document.querySelector('aside');
    if (!aside) return;
    const dial = el('div', {
      className: 'tellings-dial', role: 'slider', tabindex: '0',
      'aria-label': 'Turn the hour', 'aria-valuemin': '0', 'aria-valuemax': '1439'
    },
    dialFace(),
    el('span', { className: 'tellings-dial-readout', 'aria-hidden': 'true' },
      el('span', { className: 'tellings-dial-time' }),
      el('span', { className: 'tellings-dial-day' })));

    const list = el('ol', { className: 'tellings-phrases' }, slots.map((slot) => {
      const chip = el('button', { type: 'button', className: 'tellings-phrase', 'data-key': slot.key },
        el('span', { className: 'tellings-phrase-name' }, plain(slot.name)),
        el('span', { className: 'tellings-phrase-pips', 'aria-hidden': 'true' }));
      chip.addEventListener('click', () => {
        slot.node.scrollIntoView({ block: 'center', behavior: reduced?.matches ? 'auto' : 'smooth' });
        setTimeout(() => openFan(slot), reduced?.matches ? 0 : 420);
      });
      return el('li', {}, chip);
    }));

    const copy = el('button', { type: 'button', className: 'tellings-copy' }, 'Copy this telling');
    copy.addEventListener('click', async () => {
      const story = readStory();
      ['room', 'cozy', 'texture', 'with', 'without'].forEach((key) => delete story[key]);
      // The look being read in travels with the words: the lens, the binding.
      const root = document.documentElement;
      if (!story.genre && root.hasAttribute('data-genre-tuned')) {
        story.genre = Object.fromEntries(['boon', 'bane', 'bone'].map((id) => [id, Number(root.style.getPropertyValue(`--w-${id}`)) || 0]));
        if (root.dataset.lens) story.lens = root.dataset.lens;
      }
      if (!story.binding && root.dataset.binding) story.binding = root.dataset.binding;
      const tells = {};
      slots.forEach((slot) => {
        const index = indexOf(slot);
        const base = story.edition ? editionIndex(story.edition, chapter, slot.name, slot.variants.length) : 0;
        if (index !== base) tells[slot.name] = index;
      });
      const link = storyLink({ story, tells });
      try {
        await navigator.clipboard.writeText(link);
        copy.textContent = 'Telling copied';
        setTimeout(() => { copy.textContent = 'Copy this telling'; }, 2400);
      } catch {
        window.prompt?.call(window, 'This telling', link);
      }
      const pinned = Object.keys(tells).length;
      const what = [pinned ? `${pinned} phrase${pinned === 1 ? '' : 's'} pinned` : 'every phrase as the book has it', ...describeStory(story)];
      settle({ sigil: '✦', title: 'This telling, as a link', detail: `Anyone who opens it reads these words: ${what.join(', ')}.`, at: copy });
    });
    const back = el('button', { type: 'button', className: 'tellings-now' }, 'Back to now');
    const canon = el('button', { type: 'button', className: 'tellings-canon' }, 'The book’s own words');
    back.addEventListener('click', () => {
      setDial(null);
      settle({ sigil: '◷', title: 'Back to now', detail: 'The phrases keep the page’s own time again.', at: back, region: 'main.chapter' });
    });
    canon.addEventListener('click', () => {
      dialAt = null;
      paintDial();
      window.dispatchEvent(new CustomEvent('lore:stage-clock', { detail: { at: 'canon' } }));
      settle({ sigil: '✦', title: 'The book’s own words', detail: 'Every phrase as it was first written. Turn any of them again whenever you like.', at: canon, region: 'main.chapter' });
    });

    panel = el('section', { className: 'tellings-panel', 'aria-label': 'Other tellings' },
      el('h2', {}, 'Other tellings'),
      el('p', { className: 'tellings-count' }),
      dial,
      el('p', { className: 'tellings-dial-note' }, 'Turn the hour: the phrases and the light follow it. Past midnight it is the next day.'),
      el('div', { className: 'tellings-actions' }, back, canon, copy),
      list);
    const nav = aside.querySelector('.ebook-nav-panel');
    if (nav) nav.insertAdjacentElement('afterend', panel);
    else aside.prepend(panel);

    // Drag the sun round; crossing midnight turns the day.
    let dragging = false;
    let lastMinutes = null;
    let pending = null;
    let frame = 0;
    const fromEvent = (event) => {
      const box = dial.querySelector('svg').getBoundingClientRect();
      return minutesFor(((event.clientX - box.left) / box.width) * 160, ((event.clientY - box.top) / box.height) * 160);
    };
    const moveTo = (minutes) => {
      const base = new Date(dialTime());
      const before = lastMinutes ?? (base.getHours() * 60 + base.getMinutes());
      if (before > 1080 && minutes < 360) base.setDate(base.getDate() + 1);
      else if (before < 360 && minutes > 1080) base.setDate(base.getDate() - 1);
      lastMinutes = minutes;
      base.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (dialAt && base.getTime() === dialAt.getTime()) return;
      pending = base;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (pending) setDial(pending, { quiet: true });
          pending = null;
        });
      }
    };
    dial.addEventListener('pointerdown', (event) => {
      if (event.button > 0) return;
      dragging = true;
      lastMinutes = null;
      dial.setPointerCapture?.(event.pointerId);
      dial.classList.add('is-dragging');
      moveTo(fromEvent(event));
    });
    dial.addEventListener('pointermove', (event) => { if (dragging) moveTo(fromEvent(event)); });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      dial.classList.remove('is-dragging');
      if (dialAt) {
        announce?.(`The page at ${sayTime(dialAt)}, ${DAYS[dialAt.getDay()]}.`);
        settle({
          sigil: '◷', title: `The page at ${sayTime(dialAt)}`,
          detail: `${DAYS[dialAt.getDay()]}. The phrases rolled to that hour’s tellings and the light went to ${cueForHour(dialAt.getHours())}.`,
          at: dial, region: 'main.chapter'
        });
      }
    };
    dial.addEventListener('pointerup', release);
    dial.addEventListener('pointercancel', release);
    dial.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 60, ArrowUp: 60, ArrowLeft: -60, ArrowDown: -60, PageUp: 1440, PageDown: -1440 }[event.key];
      if (event.key === 'Home') {
        event.preventDefault();
        setDial(null);
        return;
      }
      if (!step) return;
      event.preventDefault();
      const next = new Date(dialTime().getTime() + (event.shiftKey ? step / 4 : step) * 60_000);
      next.setSeconds(0, 0);
      setDial(next);
    });

    paintDial();
    paintPanel();
    loadTellingTotals().then((data) => { totals = data; paintPanel(); });
  };
  buildPanel();
  sync();
  const watcher = new MutationObserver(sync);
  watcher.observe(root, { attributes: true, attributeFilter: ['data-switch-tellings', 'data-switches-ready'] });
  const clockTimer = setInterval(() => { if (!dialAt) paintDial(); }, 30_000);

  document.addEventListener('pointerdown', onOutside);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('lore:told', onTold);
  document.addEventListener('keydown', onDocKey);

  return () => {
    clearInterval(clockTimer);
    watcher.disconnect();
    seen?.disconnect();
    closeFan();
    panel?.remove();
    hint.remove();
    slots.forEach((slot) => {
      slot.node.removeEventListener('pointerdown', onPointerDown);
      slot.node.removeEventListener('pointerup', cancelHold);
      slot.node.removeEventListener('pointerleave', cancelHold);
      slot.node.removeEventListener('click', onClick);
      slot.node.removeEventListener('contextmenu', onContext);
      slot.node.removeEventListener('keydown', onKey);
      slot.node.classList.remove('is-telling');
      ['tabindex', 'role', 'aria-describedby'].forEach((name) => slot.node.removeAttribute(name));
    });
    document.removeEventListener('pointerdown', onOutside);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('lore:told', onTold);
    document.removeEventListener('keydown', onDocKey);
  };
}
