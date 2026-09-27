/**
 * xray-reading.mjs — X-ray reading: hover and click on words, sentences,
 * paragraphs, and the story's structure shows through.
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
 * Hover previews; click holds (and a second click releases). A held unit
 * shows a small note: the group or lean, and where it recurs. The wrapping
 * is undone when the switch goes off, so nothing changes for readers who
 * never turn it on. The words themselves are never altered.
 */

import { leanFor } from './valence-lens.mjs?v=2026_09_27.A';
import { OPERATOR_RESONANCE } from './spw-resonance.mjs?v=2026_09_26.C';

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
    p.classList.remove('xr-paragraph', 'is-held');
    delete p.dataset.xrLean;
    delete p.dataset.xrSigil;
    delete p.dataset.xrGroups;
    p.normalize();
  });
  main.querySelectorAll('.xr-note').forEach((note) => note.remove());
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

/* ─── Rail panel ────────────────────────────────────────────────────── */

function buildPanel({ mode, onMode, lexicon }) {
  const panel = document.createElement('section');
  panel.className = 'xray-panel';
  panel.setAttribute('aria-label', 'X-ray reading');
  const heading = document.createElement('h2');
  heading.textContent = 'X-ray reading';
  const lede = document.createElement('p');
  lede.className = 'xray-lede';
  lede.textContent = 'Hover to see the structure; click to hold it.';
  const modes = document.createElement('div');
  modes.className = 'xray-modes';
  modes.setAttribute('role', 'group');
  modes.setAttribute('aria-label', 'X-ray unit');
  MODES.forEach((id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'xray-mode';
    button.dataset.mode = id;
    button.textContent = id[0].toUpperCase() + id.slice(1);
    button.setAttribute('aria-pressed', String(id === mode));
    button.addEventListener('click', () => onMode(id));
    modes.append(button);
  });
  const legend = document.createElement('ul');
  legend.className = 'xray-legend';
  lexicon.groups.forEach((group) => {
    const item = document.createElement('li');
    item.dataset.groupIndex = String(group.index);
    item.textContent = group.label;
    legend.append(item);
  });
  panel.append(heading, lede, modes, legend);
  return panel;
}

/* ─── Init ──────────────────────────────────────────────────────────── */

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

  const setMode = (next) => {
    mode = MODES.includes(next) ? next : 'word';
    main.dataset.xray = mode;
    panel?.querySelectorAll('.xray-mode').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    writeMode(mode);
    release();
    announce?.(`X-ray: ${mode}.`);
  };

  const unitAt = (target) => {
    const selector = { word: '.xr-word', sentence: '.xr-sentence', paragraph: '.xr-paragraph' }[mode];
    return target.closest?.(selector) || null;
  };

  const release = () => {
    if (held) {
      held.classList.remove('is-held');
      held.querySelector(':scope > .xr-note')?.remove();
      main.querySelectorAll('.is-kin').forEach((node) => node.classList.remove('is-kin'));
      held = null;
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

  const onClick = (event) => {
    if (!wrapped) return;
    const unit = unitAt(event.target);
    if (!unit) {
      release();
      return;
    }
    if (event.target.closest('a')) return;
    event.preventDefault();
    hold(unit);
  };

  const onKey = (event) => {
    if (event.key === 'Escape') release();
  };

  const apply = () => {
    const on = root.getAttribute(SWITCH_ATTRIBUTE) === 'on';
    if (on && !wrapped) {
      main.querySelectorAll(PROSE).forEach((p) => wrapParagraph(p, lexicon));
      main.dataset.xray = mode;
      wrapped = true;
      if (aside && !panel) {
        panel = buildPanel({ mode, onMode: setMode, lexicon });
        const after = aside.querySelector('.reading-switches') || aside.querySelector('.reading-nook');
        after ? after.insertAdjacentElement('afterend', panel) : aside.append(panel);
      }
    } else if (!on && wrapped) {
      release();
      unwrap(main);
      delete main.dataset.xray;
      wrapped = false;
      panel?.remove();
      panel = null;
    }
  };

  main.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(root, { attributes: true, attributeFilter: [SWITCH_ATTRIBUTE] });

  return () => {
    observer.disconnect();
    main.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    release();
    if (wrapped) unwrap(main);
    panel?.remove();
  };
}
