/**
 * xray-reading.mjs — Structure mode (the switch's internal id is still
 * `xray`, so nobody's saved choice is lost): hover, tap, hold and brush words,
 * sentences, paragraphs, and the story's structure shows through.
 *
 * Off by default (a reading switch). When on, the prose is wrapped in
 * units the reader can touch:
 *
 *   word       each word; words that belong to one of the chapter's lexicon
 *              groups (reward / wonder / guide / motif / memory …) carry the
 *              group, so hovering one lights its siblings in the paragraph
 *   sentence   each sentence, with its lean (boon / bane / bone) and a count
 *              of the groups it touches
 *   paragraph  each paragraph, with its lean and the section's Spw sign
 *
 * Three gestures, each with a visible answer so the reader always knows the
 * page heard them:
 *
 *   tap     the unit speaks — a small note: its thread or lean, where it
 *           recurs — and leaves a gold trace that fades when it is let go
 *   hold    (press and stay) pins the unit; pins outlast taps, collect in
 *           the rail, and when two or more are held the rail says what they
 *           share — a thread, a lean — and where else in the book those
 *           threads meet
 *   brush   (press and sweep, with a mouse or pen; with a finger once
 *           "Brush with a finger" is on) lights every word the pointer
 *           crosses, thread by thread, and on release leaves a brush note:
 *           how many words and sentences, which threads and how often, the
 *           lean of the sweep, and the chambers where those threads meet
 *           again
 *
 * The wrapping is undone when the switch goes off, so nothing changes for
 * readers who never turn it on. The words themselves are never altered.
 */

import { leanFor } from './valence-lens.mjs?v=2026_09_27.A';
import { OPERATOR_RESONANCE } from './spw-resonance.mjs?v=2026_09_26.C';
import { semanticIndex } from './constellation.mjs?v=2026_09_27.I';
import { settle } from './settled.mjs?v=2026_09_27.I';

const SWITCH_ATTRIBUTE = 'data-switch-xray';
const NOOK_KEY = 'lore.nook.v1';
const MODES = Object.freeze(['word', 'sentence', 'paragraph']);
const PROSE = 'main.chapter [data-ebook-section] > p:not(.section-marks), main.chapter .voice-pull';
const SENTENCE_END = /(?<=[.!?…]["”’)]*)\s+(?=["“‘A-Z(])/;
const WORD = /([\p{L}\p{N}][\p{L}\p{N}'’\-]*)/u;
const SIGIL_FOR = Object.freeze({ boof: '@', fool: '!', environment: '.', narrator: '@' });

function readMode() {
  try {
    const mode = JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}').xray;
    return MODES.includes(mode) ? mode : 'word';
  } catch {
    return 'word';
  }
}

function writeMode(mode) {
  try {
    const nook = JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}');
    nook.xray = mode;
    window.localStorage.setItem(NOOK_KEY, JSON.stringify(nook));
  } catch {
    // Private mode: the choice holds for this visit.
  }
}

/* ─── The chapter's lexicon: term → group ───────────────────────────── */

function loadLexicon() {
  try {
    const data = JSON.parse(document.getElementById('chapter-data')?.textContent || '{}');
    const groups = (data.lexicon || []).map((group, index) => ({
      id: group.id, label: group.label, href: group.href, index,
      terms: (group.terms || []).map((term) => String(term).toLowerCase())
    }));
    const byTerm = new Map();
    groups.forEach((group) => group.terms.forEach((term) => {
      if (!byTerm.has(term)) {
        byTerm.set(term, group);
      }
    }));
    return { groups, byTerm };
  } catch {
    return { groups: [], byTerm: new Map() };
  }
}

function groupFor(word, lexicon) {
  const plain = word.toLowerCase().replace(/[’']s$/, '');
  return lexicon.byTerm.get(plain) || lexicon.byTerm.get(plain.replace(/s$/, '')) || lexicon.byTerm.get(`${plain}s`) || null;
}

/* ─── Wrapping ──────────────────────────────────────────────────────── */

function wrapWords(textNode, lexicon, stats) {
  const parts = textNode.data.split(WORD);
  if (parts.length < 3) {
    return;
  }
  const frag = document.createDocumentFragment();
  parts.forEach((part, index) => {
    if (index % 2 === 0) {
      if (part) frag.append(part);
      return;
    }
    const span = document.createElement('span');
    span.className = 'xr-word';
    span.textContent = part;
    const group = groupFor(part, lexicon);
    if (group) {
      span.dataset.group = group.id;
      span.dataset.groupIndex = String(group.index);
      span.title = group.label;
      stats.add(group.id);
    }
    frag.append(span);
  });
  textNode.replaceWith(frag);
}

function wrapSentences(p) {
  // Split each direct text node at sentence boundaries; inline voices stay whole.
  [...p.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      return;
    }
    const pieces = node.data.split(SENTENCE_END);
    if (pieces.length < 2 && !node.data.trim()) {
      return;
    }
    const frag = document.createDocumentFragment();
    pieces.forEach((piece, index) => {
      const span = document.createElement('span');
      span.className = 'xr-sentence';
      span.textContent = index < pieces.length - 1 ? `${piece} ` : piece;
      span.dataset.lean = leanFor(piece) || 'none';
      frag.append(span);
    });
    node.replaceWith(frag);
  });
}

function wrapParagraph(p, lexicon) {
  p.classList.add('xr-paragraph');
  const lean = p.dataset.lean || leanFor(p.textContent) || 'none';
  p.dataset.xrLean = lean;
  const host = p.closest('[data-ebook-section]');
  const voice = host?.dataset.spwVoice || host?.dataset.spwGrammar;
  p.dataset.xrSigil = host?.tagName === 'SECTION' ? '{' : (SIGIL_FOR[voice] || '@');
  wrapSentences(p);
  const stats = new Set();
  p.querySelectorAll('.xr-sentence').forEach((sentence) => {
    [...sentence.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) wrapWords(node, lexicon, stats);
    });
    const groups = new Set([...sentence.querySelectorAll('.xr-word[data-group]')].map((w) => w.dataset.group));
    sentence.dataset.groups = String(groups.size);
  });
  // Text directly inside inline voices (custom-* phrases) still gets words.
  p.querySelectorAll(':scope > [data-voice-shape="phrase"]').forEach((phrase) => {
    [...phrase.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) wrapWords(node, lexicon, stats);
    });
  });
  p.dataset.xrGroups = [...stats].join(' ');
}

function unwrap(main) {
  main.querySelectorAll('.xr-word, .xr-sentence').forEach((span) => span.replaceWith(...span.childNodes));
  main.querySelectorAll('.xr-paragraph').forEach((p) => {
    p.classList.remove('xr-paragraph', 'is-held', 'is-pinned', 'is-traced', 'is-brushed');
    delete p.dataset.xrLean;
    delete p.dataset.xrSigil;
    delete p.dataset.xrGroups;
    p.normalize();
  });
  main.querySelectorAll('.xr-note, .xr-brush-note').forEach((note) => note.remove());
  main.classList.remove('is-brushable', 'is-brushing');
}

/* ─── Notes: what a held unit says ──────────────────────────────────── */

const LEAN_WORDS = Object.freeze({ boon: 'leans boon — what could this become?', bane: 'leans bane — what will this cost?', bone: 'leans bone — what will remain?', none: 'leans nowhere in particular.' });

function noteFor(unit, lexicon) {
  const note = document.createElement('span');
  note.className = 'xr-note';
  note.setAttribute('role', 'note');
  if (unit.classList.contains('xr-word')) {
    const group = lexicon.groups.find((entry) => entry.id === unit.dataset.group);
    if (!group) {
      note.textContent = `“${unit.textContent}” — not in this chapter's lexicon. Plain word, doing plain work.`;
    } else {
      const siblings = unit.closest('.xr-paragraph')?.querySelectorAll(`.xr-word[data-group="${group.id}"]`).length || 1;
      note.append(`“${unit.textContent}” belongs to `, Object.assign(document.createElement('strong'), { textContent: group.label }),
        ` — ${siblings} word${siblings === 1 ? '' : 's'} of that thread in this paragraph. `);
      const where = document.createElement('button');
      where.type = 'button';
      where.className = 'xr-note-constellation';
      where.dataset.constellation = `thread:${group.id}`;
      where.textContent = 'Where else it runs';
      note.append(where);
      if (group.href) {
        note.append(' ');
        const link = document.createElement('a');
        link.href = group.href;
        link.textContent = 'All of it →';
        note.append(link);
      }
    }
  } else if (unit.classList.contains('xr-sentence')) {
    const n = Number(unit.dataset.groups || 0);
    note.textContent = `This sentence ${LEAN_WORDS[unit.dataset.lean] || LEAN_WORDS.none} It touches ${n} thread${n === 1 ? '' : 's'}.`;
  } else {
    const sigil = unit.dataset.xrSigil || '@';
    const reading = OPERATOR_RESONANCE[sigil];
    const groups = (unit.dataset.xrGroups || '').split(' ').filter(Boolean)
      .map((id) => lexicon.groups.find((entry) => entry.id === id)?.label).filter(Boolean);
    note.append(`This paragraph ${LEAN_WORDS[unit.dataset.xrLean] || LEAN_WORDS.none} `);
    if (reading) {
      note.append(Object.assign(document.createElement('code'), { textContent: sigil }), ` ${reading.name} — ${reading.reading} `);
    }
    if (groups.length) {
      note.append(`Threads: ${groups.join(', ')}.`);
    }
  }
  return note;
}

/* ─── Brush and pins: what a sweep or a set of held units says ───────── */

const LEAN_ASK = Object.freeze({ boon: 'what could this become?', bane: 'what will this cost?', bone: 'what will remain?' });

function chapterHere() {
  return Number(document.body.dataset.chapter) || 0;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function tally(units, key) {
  const counts = new Map();
  units.forEach((unit) => {
    const value = unit.dataset[key];
    if (value && value !== 'none') counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Chambers where every one of these threads runs (from semantic.json). */
async function meetingChambers(groupIds) {
  const index = await semanticIndex().catch(() => null);
  if (!index || !groupIds.length) return null;
  const sets = groupIds.map((id) => new Set(Object.keys(index.threads?.[id]?.chapters || {}).map(Number)));
  if (sets.some((set) => !set.size)) return { chambers: [], index };
  const chambers = [...sets[0]].filter((c) => sets.every((set) => set.has(c))).sort((a, b) => a - b);
  return { chambers, index };
}

function chamberLinks(chambers, index) {
  const here = chapterHere();
  const frag = document.createDocumentFragment();
  chambers.forEach((c, i) => {
    const chapter = index.chapters?.find((entry) => entry.n === c);
    const link = document.createElement(c === here ? 'strong' : 'a');
    if (c !== here) link.href = chapter?.href || `/book/chapter/${pad(c)}/`;
    link.className = 'xr-chamber';
    link.textContent = pad(c);
    link.title = chapter?.title || '';
    frag.append(link);
    if (i < chambers.length - 1) frag.append(' ');
  });
  return frag;
}

function threadChip(group, count) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'xr-thread';
  chip.dataset.groupIndex = String(group.index);
  chip.dataset.constellation = `thread:${group.id}`;
  chip.title = 'Where else it runs';
  chip.append(group.label);
  if (count > 1) {
    const n = document.createElement('span');
    n.className = 'xr-thread-count';
    n.textContent = `×${count}`;
    chip.append(' ', n);
  }
  return chip;
}

function brushNoteFor(words, lexicon) {
  const note = document.createElement('div');
  note.className = 'xr-brush-note';
  note.setAttribute('role', 'note');
  const sentences = new Set(words.map((w) => w.closest('.xr-sentence')).filter(Boolean));
  const paragraphs = new Set(words.map((w) => w.closest('.xr-paragraph')).filter(Boolean));
  const groupCounts = tally(words, 'group');
  const leanCounts = tally([...sentences], 'lean');
  const head = document.createElement('div');
  head.className = 'xr-brush-head';
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  head.textContent = `Brushed ${plural(words.length, 'word')} across ${plural(sentences.size, 'sentence')}${paragraphs.size > 1 ? `, ${plural(paragraphs.size, 'paragraph')}` : ''}.`;
  note.append(head);

  const threads = document.createElement('div');
  threads.className = 'xr-brush-threads';
  if (groupCounts.length) {
    threads.append('Threads: ');
    groupCounts.forEach(([id, count]) => {
      const group = lexicon.groups.find((entry) => entry.id === id);
      if (group) threads.append(threadChip(group, count), ' ');
    });
  } else {
    threads.textContent = 'No lexicon thread under the brush — plain words doing plain work. Sweep across a name or a berry.';
  }
  note.append(threads);

  if (leanCounts.length) {
    const lean = document.createElement('div');
    lean.className = 'xr-brush-lean';
    const [top] = leanCounts;
    lean.append('Lean of the sweep: ');
    leanCounts.forEach(([id, count], i) => {
      const mark = document.createElement('span');
      mark.className = 'xr-lean';
      mark.dataset.lean = id;
      mark.textContent = `${id} ${count}`;
      lean.append(mark, i < leanCounts.length - 1 ? ' · ' : '');
    });
    lean.append(` — ${LEAN_ASK[top[0]] || ''}`);
    note.append(lean);
  }

  if (groupCounts.length) {
    const meet = document.createElement('div');
    meet.className = 'xr-brush-meet';
    meet.textContent = groupCounts.length > 1 ? 'Looking for where these threads meet again…' : 'Looking for where this thread runs…';
    note.append(meet);
    meetingChambers(groupCounts.map(([id]) => id)).then((found) => {
      if (!found) { meet.remove(); return; }
      const others = found.chambers.filter((c) => c !== chapterHere());
      meet.replaceChildren();
      if (groupCounts.length > 1) {
        meet.append(others.length
          ? `These ${groupCounts.length} threads also meet in chamber${others.length === 1 ? '' : 's'} `
          : 'These threads meet only here, so far. ');
      } else {
        meet.append(others.length ? 'This thread also runs through ' : 'This thread runs only here, so far. ');
      }
      if (others.length) {
        meet.append(chamberLinks(found.chambers, found.index), '.');
      }
    });
  }

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'xr-brush-close';
  dismiss.setAttribute('aria-label', 'Let the brush go');
  dismiss.textContent = '×';
  note.append(dismiss);
  return note;
}

function excerpt(unit) {
  const text = unit.textContent.replace(/\s+/g, ' ').trim();
  return text.length > 52 ? `${text.slice(0, 50).replace(/\s\S*$/, '')}…` : text;
}

function kindOf(unit) {
  return unit.classList.contains('xr-word') ? 'word' : unit.classList.contains('xr-sentence') ? 'sentence' : 'paragraph';
}

/* ─── Rail panel ────────────────────────────────────────────────────── */

function buildPanel({ mode, onMode, lexicon, onBrushable }) {
  const panel = document.createElement('section');
  panel.className = 'xray-panel';
  panel.setAttribute('aria-label', 'Structure mode');
  const heading = document.createElement('h2');
  heading.textContent = 'Structure mode';
  const lede = document.createElement('p');
  lede.className = 'xray-lede';
  lede.textContent = 'Tap: it speaks. Hold: it stays. Brush across words: they light, and say where they meet.';
  const modes = document.createElement('div');
  modes.className = 'xray-modes';
  modes.setAttribute('role', 'group');
  modes.setAttribute('aria-label', 'Structure unit');
  MODES.forEach((id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'xray-mode';
    button.dataset.mode = id;
    button.textContent = id[0].toUpperCase() + id.slice(1);
    button.setAttribute('aria-pressed', String(id === mode));
    button.addEventListener('click', () => onMode(id, button));
    modes.append(button);
  });
  const brushable = document.createElement('button');
  brushable.type = 'button';
  brushable.className = 'xray-brushable';
  brushable.setAttribute('aria-pressed', 'false');
  brushable.textContent = 'Brush with a finger';
  brushable.title = 'On a touch screen, a sweep brushes the words instead of scrolling. Off again to scroll.';
  brushable.addEventListener('click', () => onBrushable(brushable));
  const legend = document.createElement('ul');
  legend.className = 'xray-legend';
  lexicon.groups.forEach((group) => {
    const item = document.createElement('li');
    item.dataset.groupIndex = String(group.index);
    item.textContent = group.label;
    legend.append(item);
  });
  const pins = document.createElement('div');
  pins.className = 'xray-pins';
  pins.hidden = true;
  panel.append(heading, lede, modes, brushable, legend, pins);
  return panel;
}

function renderPins(box, pins, lexicon, { onUnpin, onClear }) {
  box.replaceChildren();
  box.hidden = pins.length === 0;
  if (!pins.length) return;
  const heading = document.createElement('h3');
  heading.textContent = pins.length === 1 ? 'One pin held' : `${pins.length} pins held`;
  const list = document.createElement('ul');
  list.className = 'xray-pin-list';
  pins.forEach((unit) => {
    const item = document.createElement('li');
    const kind = kindOf(unit);
    const group = unit.dataset.group ? lexicon.groups.find((entry) => entry.id === unit.dataset.group) : null;
    const lean = unit.dataset.lean || unit.dataset.xrLean;
    const text = document.createElement('button');
    text.type = 'button';
    text.className = 'xray-pin-text';
    text.title = 'Scroll to it';
    text.textContent = kind === 'word' ? `“${unit.textContent}”` : excerpt(unit);
    text.addEventListener('click', () => unit.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    const meta = document.createElement('span');
    meta.className = 'xray-pin-meta';
    meta.textContent = group ? group.label : lean && lean !== 'none' ? `leans ${lean}` : kind;
    if (group) meta.dataset.groupIndex = String(group.index);
    const drop = document.createElement('button');
    drop.type = 'button';
    drop.className = 'xray-pin-drop';
    drop.setAttribute('aria-label', 'Unpin');
    drop.textContent = '×';
    drop.addEventListener('click', () => onUnpin(unit));
    item.append(text, meta, drop);
    list.append(item);
  });
  box.append(heading, list);
  if (pins.length > 1) {
    const share = document.createElement('p');
    share.className = 'xray-pin-share';
    const words = pins.flatMap((unit) => unit.classList.contains('xr-word') ? [unit] : [...unit.querySelectorAll('.xr-word[data-group]')]);
    const groupCounts = tally(words, 'group').filter(([id]) => {
      // A thread the pins share must appear in more than one pinned unit.
      const owners = new Set(words.filter((w) => w.dataset.group === id).map((w) => pins.find((p) => p === w || p.contains(w))));
      return owners.size > 1;
    });
    const leanCounts = tally(pins.map((unit) => ({ dataset: { lean: unit.dataset.lean || unit.dataset.xrLean || '' } })), 'lean');
    if (groupCounts.length) {
      share.append('Your pins share: ');
      groupCounts.forEach(([id, count]) => {
        const group = lexicon.groups.find((entry) => entry.id === id);
        if (group) share.append(threadChip(group, count), ' ');
      });
    } else if (leanCounts.length && leanCounts[0][1] > 1) {
      share.append(`Your pins lean the same way — ${leanCounts[0][0]}: ${LEAN_ASK[leanCounts[0][0]] || ''}`);
    } else {
      share.textContent = 'Your pins share no thread yet. Hold one more and see what changes.';
    }
    box.append(share);
  }
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'xray-pins-clear';
  clear.textContent = 'Let them all go';
  clear.addEventListener('click', onClear);
  box.append(clear);
}

/* ─── Init ──────────────────────────────────────────────────────────── */

const HOLD_MS = 480;
const BRUSH_SLOP = 7;
const TRACE_MS = 2600;
const MAX_PINS = 9;

export function initXrayReading({ announce } = {}) {
  const main = document.querySelector('main.chapter');
  const aside = document.querySelector('aside');
  if (!main) {
    return () => {};
  }
  const root = document.documentElement;
  const lexicon = loadLexicon();
  let mode = readMode();
  let wrapped = false;
  let held = null;
  let panel = null;
  let pins = [];
  let brushed = [];
  let brushNote = null;
  let traceTimer = 0;
  let brushFade = 0;
  // One pointer at a time: where it began, whether it became a hold or a brush.
  let press = null;

  const pinsBox = () => panel?.querySelector('.xray-pins');
  const modeButton = (id) => panel?.querySelector(`.xray-mode[data-mode="${id}"]`);

  const MODE_WORDS = Object.freeze({
    word: 'Tap a word and it says which thread it belongs to.',
    sentence: 'Tap a sentence and it says how it leans.',
    paragraph: 'Tap a paragraph for its lean and the sign it enacts.'
  });

  const setMode = (next, at) => {
    mode = MODES.includes(next) ? next : 'word';
    main.dataset.xray = mode;
    panel?.querySelectorAll('.xray-mode').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    writeMode(mode);
    release();
    announce?.(`Structure by ${mode}.`);
    if (at) {
      settle({ sigil: '?', title: `Structure by ${mode}`, detail: MODE_WORDS[mode], at, region: main });
    }
  };

  const unitAt = (target) => {
    const selector = { word: '.xr-word', sentence: '.xr-sentence', paragraph: '.xr-paragraph' }[mode];
    return target.closest?.(selector) || null;
  };

  const trace = (unit) => {
    unit.classList.remove('is-traced');
    void unit.offsetWidth;
    unit.classList.add('is-traced');
    clearTimeout(traceTimer);
    traceTimer = setTimeout(() => main.querySelectorAll('.is-traced').forEach((node) => node.classList.remove('is-traced')), TRACE_MS);
  };

  const release = () => {
    if (held) {
      const was = held;
      held.classList.remove('is-held');
      held.querySelector(':scope > .xr-note')?.remove();
      main.querySelectorAll('.is-kin').forEach((node) => node.classList.remove('is-kin'));
      held = null;
      trace(was);
    }
  };

  const hold = (unit) => {
    if (held === unit) {
      release();
      return;
    }
    release();
    held = unit;
    unit.classList.add('is-held');
    if (unit.dataset.group) {
      unit.closest('.xr-paragraph')?.querySelectorAll(`.xr-word[data-group="${unit.dataset.group}"]`).forEach((kin) => kin.classList.add('is-kin'));
    }
    unit.append(noteFor(unit, lexicon));
  };

  const refreshPins = () => {
    const box = pinsBox();
    if (box) renderPins(box, pins, lexicon, { onUnpin: unpin, onClear: clearPins });
  };

  const unpin = (unit) => {
    unit.classList.remove('is-pinned');
    pins = pins.filter((entry) => entry !== unit);
    refreshPins();
  };

  const clearPins = () => {
    pins.forEach((unit) => unit.classList.remove('is-pinned'));
    pins = [];
    refreshPins();
    settle({ sigil: '~', title: 'Pins let go', detail: 'The rail is clear. Hold a word to start again.', region: main });
  };

  const pin = (unit) => {
    if (pins.includes(unit)) {
      unpin(unit);
      settle({ sigil: '~', title: 'Unpinned', detail: `${pins.length ? `${pins.length} still held.` : 'Nothing held.'}`, at: unit, region: unit });
      return;
    }
    if (pins.length >= MAX_PINS) {
      const oldest = pins.shift();
      oldest.classList.remove('is-pinned');
    }
    pins.push(unit);
    unit.classList.add('is-pinned');
    trace(unit);
    refreshPins();
    const kind = kindOf(unit);
    const group = unit.dataset.group ? lexicon.groups.find((entry) => entry.id === unit.dataset.group) : null;
    const what = kind === 'word' ? `“${unit.textContent}”` : `A ${kind}`;
    const detail = pins.length === 1
      ? `${group ? `${group.label}. ` : ''}Hold another and the rail says what they share.`
      : `${pins.length} pins held — the rail says what they share.`;
    settle({ sigil: '&', title: `${what} pinned`, detail, at: unit, region: unit });
    announce?.(`Pinned. ${pins.length} held.`);
  };

  /* Brush: every word the pointer crosses lights, in order. */
  const clearBrush = () => {
    clearTimeout(brushFade);
    brushed.forEach((word) => { word.classList.remove('is-brushed', 'is-fading'); word.style.removeProperty('--brush-i'); });
    main.querySelectorAll('.xr-sentence.is-brushed, .xr-paragraph.is-brushed').forEach((node) => node.classList.remove('is-brushed'));
    brushed = [];
    brushNote?.remove();
    brushNote = null;
    main.classList.remove('is-brushing');
  };

  const brushAt = (x, y) => {
    const word = document.elementFromPoint(x, y)?.closest?.('.xr-word');
    if (!word || !main.contains(word) || brushed.includes(word)) return;
    word.style.setProperty('--brush-i', String(brushed.length));
    word.classList.add('is-brushed');
    word.closest('.xr-sentence')?.classList.add('is-brushed');
    word.closest('.xr-paragraph')?.classList.add('is-brushed');
    brushed.push(word);
  };

  const finishBrush = () => {
    main.classList.remove('is-brushing');
    if (brushed.length < 2) {
      clearBrush();
      return;
    }
    const last = brushed[brushed.length - 1];
    const host = last.closest('.xr-paragraph, .voice-pull') || last.parentElement;
    brushNote = brushNoteFor(brushed, lexicon);
    brushNote.querySelector('.xr-brush-close')?.addEventListener('click', clearBrush);
    // After the paragraph, not inside it: a div in a p would inherit its drop cap.
    host.insertAdjacentElement('afterend', brushNote);
    const groups = new Set(brushed.map((w) => w.dataset.group).filter(Boolean));
    announce?.(`Brushed ${brushed.length} words, ${groups.size} threads.`);
    // The lit words fade on their own; the note stays until let go.
    brushFade = setTimeout(() => brushed.forEach((word) => word.classList.add('is-fading')), 4000);
  };

  const onPointerDown = (event) => {
    if (!wrapped || event.button > 0 || event.target.closest('a, button, .xr-note, .xr-brush-note')) return;
    const unit = unitAt(event.target);
    const canBrush = event.pointerType !== 'touch' || main.classList.contains('is-brushable');
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, unit, brushing: false, pinned: false, canBrush, timer: 0 };
    if (unit) {
      unit.classList.add('is-pressing');
      press.timer = setTimeout(() => {
        if (!press || press.brushing) return;
        press.pinned = true;
        unit.classList.remove('is-pressing');
        pin(unit);
      }, HOLD_MS);
    }
  };

  const onPointerMove = (event) => {
    if (!press || event.pointerId !== press.id) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (!press.brushing) {
      if (Math.hypot(dx, dy) < BRUSH_SLOP) return;
      clearTimeout(press.timer);
      press.unit?.classList.remove('is-pressing');
      if (!press.canBrush || press.pinned) { press = null; return; }
      press.brushing = true;
      release();
      clearBrush();
      main.classList.add('is-brushing');
      brushAt(press.x, press.y);
    }
    brushAt(event.clientX, event.clientY);
  };

  const onPointerUp = (event) => {
    if (!press || event.pointerId !== press.id) return;
    clearTimeout(press.timer);
    press.unit?.classList.remove('is-pressing');
    const { unit, brushing, pinned } = press;
    press = null;
    if (brushing) {
      finishBrush();
      return;
    }
    if (pinned) return;
    if (!unit) {
      release();
      if (brushNote && !event.target.closest('.xr-brush-note')) clearBrush();
      return;
    }
    hold(unit);
    trace(unit);
  };

  const onPointerCancel = () => {
    if (!press) return;
    clearTimeout(press.timer);
    press.unit?.classList.remove('is-pressing');
    if (press.brushing) finishBrush();
    press = null;
  };

  // Links inside the prose still navigate; a tap elsewhere is handled on pointerup.
  const onClick = (event) => {
    if (!wrapped) return;
    if (event.target.closest('a, button')) return;
    if (unitAt(event.target)) event.preventDefault();
  };

  const onKey = (event) => {
    if (event.key === 'Escape') {
      release();
      clearBrush();
    }
  };

  // A held finger is a pin, not a request for the context menu.
  const onContextMenu = (event) => {
    if (press?.unit) event.preventDefault();
  };

  const setBrushable = (button) => {
    const on = main.classList.toggle('is-brushable');
    button.setAttribute('aria-pressed', String(on));
    settle({
      sigil: on ? '!' : '~',
      title: on ? 'Brush with a finger' : 'Scroll with a finger',
      detail: on ? 'Sweep across the words and they light. Scrolling waits until this is off.' : 'The page scrolls again. A mouse or pen can still brush.',
      at: button,
      region: main
    });
  };

  const apply = () => {
    const on = root.getAttribute(SWITCH_ATTRIBUTE) === 'on';
    if (on && !wrapped) {
      main.querySelectorAll(PROSE).forEach((p) => wrapParagraph(p, lexicon));
      main.dataset.xray = mode;
      wrapped = true;
      if (aside && !panel) {
        panel = buildPanel({ mode, onMode: setMode, lexicon, onBrushable: setBrushable });
        const after = aside.querySelector('.reading-switches') || aside.querySelector('.reading-nook');
        after ? after.insertAdjacentElement('afterend', panel) : aside.append(panel);
      }
    } else if (!on && wrapped) {
      release();
      clearBrush();
      pins = [];
      unwrap(main);
      delete main.dataset.xray;
      wrapped = false;
      panel?.remove();
      panel = null;
    }
  };

  main.addEventListener('pointerdown', onPointerDown);
  main.addEventListener('pointermove', onPointerMove);
  main.addEventListener('pointerup', onPointerUp);
  main.addEventListener('pointercancel', onPointerCancel);
  main.addEventListener('click', onClick);
  main.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('keydown', onKey);
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(root, { attributes: true, attributeFilter: [SWITCH_ATTRIBUTE] });

  return () => {
    observer.disconnect();
    main.removeEventListener('pointerdown', onPointerDown);
    main.removeEventListener('pointermove', onPointerMove);
    main.removeEventListener('pointerup', onPointerUp);
    main.removeEventListener('pointercancel', onPointerCancel);
    main.removeEventListener('click', onClick);
    main.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('keydown', onKey);
    clearTimeout(traceTimer);
    release();
    clearBrush();
    if (wrapped) unwrap(main);
    panel?.remove();
  };
}
