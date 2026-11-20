/**
 * spw-sound.mjs — any Spw spell, played.
 *
 * The shape of a spell is a score. Sigils are voices; containers are time; labels are pitches;
 * numbers are lengths and counts; materials are textures. Nothing is sampled: every sound is
 * synthesized, quietly, and only when someone asks (a ▶ on a spell, spw-spell.mjs).
 *
 *   voices   ? asks (a rising fourth, left open)   ~ swells (a slow pad)    @ plucks, placed by name
 *            & two at once (a third)               * a bell                 ^ climbs (three notes up)
 *            ! strikes (a knock and a thump)       # a glass ping           . a low ground note
 *            = turns the filter (tuning the room)  % counts (ticks, n of them)
 *            $ a texture, by material: glass, flour, berry, frost, ink, brass, steam, oak
 *   time     [ ] one after another   { } held: a ground under everything inside
 *            ( ) all at once (a chord)   < > a passage: each note glides into the next
 *   pitch    a label's letters choose a degree of the spell's own pentatonic key; the whole
 *            spell's text chooses the key, so every spell has one
 *   words    a quoted string is breathed, a syllable at a time, under the music
 *
 * scoreOf(text) gives the events (and is pure, so it can be tested and drawn); playSpell(text,
 * { onAtom }) plays them and calls onAtom(i) as the i-th sigil sounds, so a spell can light as it sings.
 */
import { tokenize } from './spw-spell.mjs?v=2026_11_16.B';

const MATERIAL_WORDS = Object.freeze(['glass', 'flour', 'berry', 'frost', 'ink', 'brass', 'steam', 'oak']);
const PENTA = [0, 2, 4, 7, 9];
const BOOK2_ROOTS = Object.freeze([261.63, 293.66, 329.63, 349.23, 392, 220, 246.94, 261.63, 311.13, 329.63, 293.66]);
const CHAPTER_ROOTS = Object.freeze([293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23]);
const CHAPTER_TEMPOS = Object.freeze([96, 92, 104, 88, 100, 108, 96, 92, 112, 84, 100, 104, 96, 90, 108]);
const SIGIL_COLOURS = Object.freeze({
  '.': { bass: 0, pcs: [0, 4, 7] },
  '!': { bass: 0, pcs: [0, 7] },
  '?': { bass: 0, pcs: [0, 2, 7] },
  '~': { bass: 5, pcs: [0, 4, 5, 9] },
  '@': { bass: 9, pcs: [0, 4, 9] },
  '&': { bass: 0, pcs: [0, 2, 4, 7] },
  '*': { bass: 0, pcs: [0, 4, 7, 9] },
  '^': { bass: 7, pcs: [0, 2, 7] },
  '#': { bass: 4, pcs: [4, 7, 11] },
  '=': { bass: 2, pcs: [2, 9] },
  '%': { bass: 2, pcs: [2, 5, 9] },
  '$': { bass: 5, pcs: [0, 5, 9] }
});
const JAZZ_COLOURS = Object.freeze({
  '.': { bass: 0, pcs: [0, 4, 7, 11] },
  '!': { bass: 0, pcs: [0, 5, 10] },
  '?': { bass: 0, pcs: [0, 2, 7, 9] },
  '~': { bass: 5, pcs: [0, 4, 5, 7, 9] },
  '@': { bass: 9, pcs: [0, 4, 7, 9] },
  '&': { bass: 0, pcs: [0, 2, 4, 7, 11] },
  '*': { bass: 0, pcs: [0, 2, 4, 7, 9] },
  '^': { bass: 7, pcs: [2, 5, 7, 8, 11] },
  '#': { bass: 4, pcs: [2, 4, 7, 11] },
  '=': { bass: 2, pcs: [0, 2, 5, 9] },
  '%': { bass: 2, pcs: [0, 2, 4, 5, 9] },
  '$': { bass: 5, pcs: [0, 4, 5, 9, 11] }
});
const SCALE_PRESETS = Object.freeze({
  penta: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
  open: [0, 2, 5, 7, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10]
});
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Chapter tonic frequency (Hz) and tempo matching `.spw/runtime/pie-levels.spw` and `pie-sound.mjs`.
 * @param {number | null | undefined} chapter
 */
export function chapterKey(chapter) {
  const n = Math.floor(Number(chapter));
  if (!Number.isFinite(n) || n < 1) return null;
  if (n <= CHAPTER_ROOTS.length) return { chapter: n, root: CHAPTER_ROOTS[n - 1], tempo: CHAPTER_TEMPOS[n - 1] };
  return { chapter: n, root: BOOK2_ROOTS[(n - CHAPTER_ROOTS.length - 1) % BOOK2_ROOTS.length], tempo: 96 };
}

/* ─── The score ────────────────────────────────────────────────────── */

/** Tokens into a small tree: atoms (sigil, label, args, body), groups by container, strings. */
function treeOf(text) {
  const tokens = tokenize(text).filter((t) => t.type !== 'space');
  let atomIndex = 0;
  let i = 0;
  const readArgs = () => {
    const args = [];
    let depth = 1;
    while (i < tokens.length && depth > 0) {
      const t = tokens[i];
      i += 1;
      if (t.type === 'open') depth += 1;
      else if (t.type === 'close') { depth -= 1; if (!depth) break; }
      else if (t.type === 'number') args.push(Number(t.text));
      else if (t.type === 'word' || t.type === 'label') args.push(t.text);
      else if (t.type === 'string') args.push(t.text.replace(/^"|"$/g, ''));
    }
    return args;
  };
  const readSeq = (closer) => {
    const nodes = [];
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === 'close') { if (closer) i += 1; return nodes; }
      i += 1;
      if (t.type === 'sigil') {
        const atom = { type: 'atom', sigil: t.text, label: '', args: [], index: atomIndex };
        atomIndex += 1;
        // A mutation's label is @anchor (tokenize keeps the @ on the = atom, so this is one tuning).
        if (tokens[i]?.type === 'label') { atom.label = tokens[i].text; i += 1; }
        if (tokens[i]?.type === 'path') { atom.path = tokens[i].text; i += 1; }
        if (tokens[i]?.type === 'open' && tokens[i].text === '[') { i += 1; atom.args = readArgs(); }
        // A body right after an atom belongs to it: *torch_ants{ … }
        if (tokens[i]?.type === 'open' && tokens[i].text !== '[') { const open = tokens[i].text; i += 1; atom.body = { type: 'group', open, children: readSeq(true) }; }
        nodes.push(atom);
      } else if (t.type === 'open') {
        nodes.push({ type: 'group', open: t.text, children: readSeq(true) });
      } else if (t.type === 'string' || t.type === 'path') {
        nodes.push({ type: 'words', text: t.text.replace(/^"|"$/g, '') });
      }
    }
    return nodes;
  };
  return readSeq(false);
}

const LENGTH = Object.freeze({ '?': 1.5, '~': 2, '@': 1, '&': 1, '*': 1.5, '^': 1.5, '!': 0.75, '#': 0.75, '.': 2, '=': 1, '%': 1, '$': 2 });

/** The events of a spell, in beats: { t, len, sigil, label, degree, args, index, glide, material }. */
export function scoreOf(text) {
  const events = [];
  const holds = [];
  const place = (node, t, glide) => {
    if (node.type === 'words') {
      const syllables = Math.max(1, Math.min(12, (node.text.match(/[aeiouy]+/gi) || []).length));
      events.push({ t, len: syllables * 0.25, sigil: '"', syllables, label: node.text });
      return t + Math.min(3, syllables * 0.25);
    }
    if (node.type === 'group') {
      const kids = node.children;
      if (node.open === '(') {
        let end = t;
        kids.forEach((k) => { end = Math.max(end, place(k, t, false)); });
        return end + 0.25;
      }
      let cursor = t;
      kids.forEach((k) => { cursor = place(k, cursor, node.open === '<'); });
      if (node.open === '{' && cursor > t) holds.push({ t, len: cursor - t });
      return cursor;
    }
    // An atom: its own note, then its body.
    const n = node.args.find((a) => typeof a === 'number');
    const word = node.args.find((a) => typeof a === 'string');
    const material = node.sigil === '$' ? (MATERIAL_WORDS.find((m) => m === node.label || m === word) || 'ink') : null;
    let len = LENGTH[node.sigil] || 1;
    if (node.sigil === '%' && Number.isFinite(n)) len = Math.max(0.5, Math.min(4, Math.round(n > 1 ? n : n * 8) * 0.25));
    if (node.sigil === '~' && Number.isFinite(n)) len = Math.max(1, Math.min(4, n / 2));
    const degree = (hash(node.label || node.path || node.sigil) % 7) + (Number.isFinite(n) && node.sigil !== '%' && node.sigil !== '~' ? Math.round(n * 2) % 5 : 0);
    events.push({ t, len, sigil: node.sigil, label: node.label, degree, args: node.args, index: node.index, glide, material, count: node.sigil === '%' ? Math.max(1, Math.min(8, Math.round(Number.isFinite(n) ? (n > 1 ? n : n * 8) : 2))) : 0 });
    let end = t + len * 0.75;
    if (node.body) end = place(node.body, end, false);
    return end;
  };
  let cursor = 0;
  treeOf(text).forEach((node) => { cursor = place(node, cursor, false); });
  holds.forEach((h) => events.push({ t: h.t, len: h.len, sigil: '{', degree: 0, hold: true }));
  events.sort((a, b) => a.t - b.t);
  return { events, beats: cursor, key: hash(text) % 12 };
}

/* ─── The instrument ───────────────────────────────────────────────── */

let ctx = null;
let bus = null;
function unlockAudio(c) {
  if (!c) return;
  try {
    const nav = /** @type {Navigator & { audioSession?: { type: string } }} */ (
      typeof navigator === 'undefined' ? {} : navigator
    );
    if (nav.audioSession && nav.audioSession.type !== 'playback') nav.audioSession.type = 'playback';
  } catch { /* ignore */ }
  if (c.state !== 'running') {
    c.resume().catch(() => {});
    try {
      const buf = c.createBuffer(1, 1, 22050);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
    } catch { /* ignore */ }
  }
}

function ensureAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = ctx || new AudioCtx();
  if (ctx.state !== 'running') unlockAudio(ctx);
  if (!bus) {
    const input = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 9000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    const master = ctx.createGain();
    master.gain.value = 0.55;
    const echo = ctx.createDelay(0.8);
    echo.delayTime.value = 0.27;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    input.connect(filter).connect(comp).connect(master).connect(ctx.destination);
    filter.connect(echo);
    echo.connect(feedback).connect(echo);
    echo.connect(wet).connect(comp);
    bus = { input, filter };
  }
  return ctx;
}

const resolveScale = (scale) => {
  if (Array.isArray(scale) && scale.length) return scale;
  if (typeof scale === 'string' && SCALE_PRESETS[scale]) return SCALE_PRESETS[scale];
  return PENTA;
};

/**
 * Pure jazz swing timing offset for a beat position `t`: keeps downbeats (`0, 1, 2...`) anchored
 * and leans off-beat eighth/sixteenth subdivisions late by `swing` (`0.5` straight .. `0.67` triplet).
 * @param {number} t
 * @param {number} [swing]
 */
export function swingBeat(t, swing = 0.62) {
  const s = Math.max(0.5, Math.min(0.67, Number(swing) || 0.5));
  if (s <= 0.501) return t;
  const whole = Math.floor(t);
  const frac = t - whole;
  if (frac < 1e-6) return t;
  const shift = (s - 0.5) * 2;
  if (Math.abs(frac - 0.5) < 0.08) return whole + 0.5 + shift * 0.5 * 0.5;
  if (Math.abs(frac - 0.25) < 0.08) return whole + 0.25 + shift * 0.25 * 0.5;
  if (Math.abs(frac - 0.75) < 0.08) return whole + 0.75 + shift * 0.25 * 0.5;
  return t;
}

const freqOf = (root, degree, octave = 0, scale = PENTA) => {
  const sc = resolveScale(scale);
  const d = Math.max(0, degree);
  return root * 2 ** (octave + Math.floor(d / sc.length) + sc[d % sc.length] / 12);
};

/**
 * Pure chapter musical-development plan across sections/rooms (`opening -> rising -> bridge -> turnaround`).
 * @param {{ chapter?: number | null, sectionIndex?: number, totalSections?: number, sigil?: string, jazz?: boolean }} [opts]
 */
export function chapterDevelopmentPlan({ chapter = 1, sectionIndex = 1, totalSections = 4, sigil = '.', jazz = false } = {}) {
  const k = chapterKey(chapter || 1) || { chapter: 1, root: CHAPTER_ROOTS[0], tempo: 96 };
  const total = Math.max(1, Number(totalSections) || 4);
  const idx = Math.max(1, Math.min(total, Number(sectionIndex) || 1));
  const progress = total <= 1 ? 0 : (idx - 1) / (total - 1);
  const movement = progress < 0.25 ? 'opening' : progress < 0.55 ? 'rising' : progress < 0.82 ? 'bridge' : 'turnaround';
  const table = jazz ? JAZZ_COLOURS : SIGIL_COLOURS;
  const chord = table[sigil] || table['.'];
  const scaleName = movement === 'bridge'
    ? (jazz ? 'dorian' : 'minor')
    : movement === 'rising' && jazz
      ? 'lydian'
      : movement === 'turnaround' && jazz
        ? 'mixolydian'
        : 'penta';
  const guidePc = movement === 'opening'
    ? chord.pcs[0] ?? 0
    : movement === 'rising'
      ? (chord.pcs[1] ?? 4)
      : movement === 'bridge'
        ? (jazz ? 10 : 9)
        : (jazz ? 11 : 7);
  const cadenceOffset = movement === 'turnaround' ? (jazz ? 1 : 7) : movement === 'bridge' ? (jazz ? 10 : 9) : movement === 'rising' ? 5 : 0;
  return {
    chapter: k.chapter,
    root: k.root,
    tempo: k.tempo,
    progress,
    movement,
    scaleName,
    scale: SCALE_PRESETS[scaleName] || PENTA,
    bassPc: chord.bass,
    pcs: [...chord.pcs],
    guidePc,
    cadenceOffset
  };
}

/**
 * Pure voice-leading transition plan between two rooms (`sigil`) or chapters (no AudioContext needed).
 * @param {{ fromSigil?: string, toSigil?: string, fromChapter?: number | null, toChapter?: number | null, direction?: number, volume?: number, sectionIndex?: number, totalSections?: number, jazz?: boolean }} [opts]
 */
export function transitionPlan({ fromSigil = '.', toSigil = '.', fromChapter = null, toChapter = null, direction = 1, volume = 0.38, sectionIndex = 1, totalSections = 4, jazz = false } = {}) {
  const gain = Math.max(0.05, Math.min(1.4, Number.isFinite(volume) ? volume : 0.38));
  const dir = direction < 0 ? -1 : 1;
  const fromK = fromChapter != null ? chapterKey(fromChapter) : null;
  const toK = toChapter != null ? chapterKey(toChapter) : null;
  const root = toK?.root || fromK?.root || CHAPTER_ROOTS[0];
  const clampNote = (f, vol, at, len, type = 'sine', attack = 0.015) => ({
    f0: Math.max(80, Math.min(2400, f)),
    vol: Math.min(0.055, Math.max(0.004, vol)),
    at,
    len,
    type,
    attack
  });
  // Chapter-to-chapter harmonic door: voice-lead from outgoing tonic fifth/ninth into the next chapter's tonic.
  if (fromK && toK && fromK.chapter !== toK.chapter) {
    const semiShift = 12 * Math.log2(toK.root / fromK.root);
    const wrappedLead = fromK.root * 2 ** (((Math.round(semiShift) + (dir > 0 ? 7 : 2)) % 12 - 12 * (semiShift > 4 ? 1 : 0)) / 12);
    const topInterval = jazz ? 11 : 7;
    return {
      root: toK.root,
      movement: 'turnaround',
      notes: [
        clampNote(wrappedLead > 480 ? wrappedLead / 2 : wrappedLead, 0.028 * gain, 0, 0.24, 'triangle', 0.02),
        clampNote(toK.root, 0.042 * gain, 0.09, 0.38, 'sine', 0.018),
        clampNote(toK.root * 2 ** (topInterval / 12), 0.022 * gain, 0.16, 0.32, 'sine', 0.025)
      ]
    };
  }
  const dev = chapterDevelopmentPlan({ chapter: toChapter ?? fromChapter ?? 1, sectionIndex, totalSections, sigil: toSigil, jazz });
  const table = jazz ? JAZZ_COLOURS : SIGIL_COLOURS;
  const fromC = table[fromSigil] || table['.'];
  const toC = table[toSigil] || table['.'];
  const shared = toC.pcs.find((pc) => fromC.pcs.includes(pc));
  const leadPc = shared != null ? shared : fromC.bass;
  const targetPc = toC.bass;
  const rawDiff = targetPc - leadPc;
  const nearestPc = rawDiff > 6 ? targetPc - 12 : rawDiff < -6 ? targetPc + 12 : targetPc;
  const colourPc = dev.movement === 'bridge' || dev.movement === 'turnaround'
    ? dev.guidePc
    : (toC.pcs.find((pc) => pc !== toC.bass && pc !== 0) ?? toC.pcs[toC.pcs.length - 1] ?? 7);
  const notes = [
    clampNote(root * 2 ** (leadPc / 12), 0.028 * gain, 0, 0.22, 'triangle', 0.018),
    clampNote(root * 2 ** (nearestPc / 12), 0.042 * gain, 0.08, 0.34, 'sine', 0.015)
  ];
  if (dir > 0 || ['^', '*', '#', '?', '~'].includes(toSigil) || jazz) {
    const guideShift = jazz && dir < 0 ? 0 : (dir > 0 ? 12 : 0);
    notes.push(clampNote(root * 2 ** ((colourPc + guideShift) / 12), 0.022 * gain, jazz ? 0.16 : 0.15, jazz ? 0.36 : 0.32, 'sine', 0.022));
  }
  return { root, movement: dev.movement, notes };
}

function voice(at, { type = 'sine', f0, f1, len, vol = 0.12, attack = 0.01, pan = 0, out = bus.input }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, at);
  if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + len);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + Math.min(attack, len * 0.5));
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  let node = osc.connect(g);
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-0.9, Math.min(0.9, pan));
    node = node.connect(p);
  }
  node.connect(out);
  osc.start(at);
  osc.stop(at + len + 0.05);
}

function noise(at, { len, f0, f1, q = 1.2, vol = 0.08, type = 'bandpass', clicks = 0, out = bus.input }) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * len));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  if (clicks) {
    for (let k = 0; k < clicks; k += 1) {
      const start = Math.floor(Math.random() * (n - 200));
      for (let j = 0; j < 120; j += 1) ch[start + j] = (Math.random() * 2 - 1) * (1 - j / 120);
    }
  } else {
    let brown = 0;
    for (let k = 0; k < n; k += 1) {
      brown = (brown + (Math.random() * 2 - 1) * 0.08) * 0.98;
      ch[k] = type === 'lowpass' ? brown * 3 : Math.random() * 2 - 1;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const flt = ctx.createBiquadFilter();
  flt.type = type;
  flt.Q.value = q;
  flt.frequency.setValueAtTime(f0, at);
  if (f1) flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), at + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + Math.min(0.08, len * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  src.connect(flt).connect(g).connect(out);
  src.start(at);
}

/* Each material, as a texture (and the same vocabulary as materials.mjs). */
const TEXTURES = Object.freeze({
  glass: (at, len, root, out, scale) => { [3, 4.02, 5.01].forEach((m, k) => voice(at + k * 0.03, { f0: root * m * 2, len, vol: 0.035, attack: 0.3, out })); noise(at, { len, f0: 7000, q: 6, vol: 0.02, type: 'highpass', out }); },
  flour: (at, len, _root, out) => { for (let k = 0; k < 4; k += 1) noise(at + k * (len / 4), { len: len / 3, f0: 900, f1: 300, q: 0.7, vol: 0.05, out }); },
  berry: (at, _len, root, out, scale) => { [0, 2, 4].forEach((d, k) => voice(at + k * 0.12, { type: 'triangle', f0: freqOf(root, d, 1, scale), len: 0.3, vol: 0.08, out })); },
  frost: (at, len, _root, out) => noise(at, { len, f0: 5000, q: 2, vol: 0.12, clicks: Math.round(len * 14), out }),
  ink: (at, len, root, out) => voice(at, { type: 'triangle', f0: root / 2, f1: root / 2 * 1.01, len, vol: 0.06, attack: 0.4, out }),
  brass: (at, len, root, out) => { [1, 2.76, 5.4].forEach((m, k) => voice(at, { f0: root * m, len: len * (1 - k * 0.2), vol: 0.06 / (k + 1), out })); },
  steam: (at, len, _root, out) => noise(at, { len, f0: 400, f1: 2400, q: 1.5, vol: 0.06, out }),
  oak: (at, _len, root, out) => { voice(at, { f0: root * 0.75, f1: root * 0.6, len: 0.25, vol: 0.14, out }); noise(at, { len: 0.04, f0: 2500, q: 3, vol: 0.06, out }); }
});

function sound(e, at, beat, root, out = bus.input, scale = PENTA, jazz = false) {
  const f = freqOf(root, e.degree || 0, 0, scale);
  const len = Math.max(0.12, e.len * beat);
  const pan = ((hash(e.label || '') % 9) - 4) / 5;
  switch (e.sigil) {
    case '?': voice(at, { f0: f, len: len * 0.5, vol: 0.09, out }); voice(at + len * 0.45, { f0: f * 1.335, len: len * 0.6, vol: 0.08, out }); break;
    case '~':
      voice(at, { f0: f, len, vol: 0.06, attack: len * 0.4, out });
      voice(at, { type: 'triangle', f0: f * 1.5, len, vol: 0.03, attack: len * 0.5, out });
      if (jazz) voice(at + len * 0.08, { f0: freqOf(root, (e.degree || 0) + 1, 1, scale), len: len * 0.9, vol: 0.018, attack: len * 0.35, out });
      break;
    case '@': voice(at, { type: 'triangle', f0: f, len: len * 0.8, vol: 0.1, pan, out }); break;
    case '&':
      voice(at, { f0: f, len, vol: 0.07, out });
      if (jazz) {
        voice(at, { f0: freqOf(root, (e.degree || 0) + 2, 0, scale), len, vol: 0.05, out });
        voice(at + 0.015, { f0: freqOf(root, (e.degree || 0) + 6, 0, scale), len: len * 0.9, vol: 0.03, out });
      } else {
        voice(at, { f0: f * 1.26, len, vol: 0.06, out });
      }
      break;
    case '*': [1, 2.01, 3.03].forEach((m, k) => voice(at, { f0: f * m, len: len * (1 - k * 0.25), vol: 0.07 / (k + 1), out })); break;
    case '^': [0, 2, 4].forEach((d, k) => voice(at + k * len * 0.28, { f0: freqOf(root, (e.degree || 0) + d, 0, scale), len: len * 0.4, vol: 0.08, out })); break;
    case '!': noise(at, { len: 0.08, f0: 1800, q: 1, vol: 0.14, out }); voice(at, { f0: 110, f1: 55, len: 0.2, vol: 0.16, out }); break;
    case '#': voice(at, { f0: f * 4, f1: f * 4.01, len: len * 1.4, vol: 0.05, out }); break;
    case '.': voice(at, { type: 'triangle', f0: root / 2, len, vol: 0.09, attack: 0.05, out }); break;
    case '=': if (bus) { bus.filter.frequency.setTargetAtTime(1600, at, 0.08); bus.filter.frequency.setTargetAtTime(9000, at + len, 0.3); } voice(at, { type: 'square', f0: f / 2, len: len * 0.5, vol: 0.025, out }); break;
    case '%': for (let k = 0; k < (e.count || 2); k += 1) voice(at + k * beat * 0.25, { f0: 1760, len: 0.03, vol: 0.05, out }); break;
    case '$': (TEXTURES[e.material] || TEXTURES.ink)(at, len, root, out, scale); break;
    case '"': for (let k = 0; k < (e.syllables || 1); k += 1) noise(at + k * beat * 0.25, { len: beat * 0.2, f0: 600 + (k % 3) * 300, q: 4, vol: 0.025, out }); break;
    case '{':
      voice(at, { type: 'sine', f0: root / 4, len, vol: 0.05, attack: 0.3, out });
      if (jazz) voice(at, { type: 'sine', f0: root * 1.5 / 4, len, vol: 0.022, attack: 0.35, out });
      break;
    default: break;
  }
  if (e.glide && e.sigil !== '!' && e.sigil !== '%') voice(at, { f0: f * 0.94, f1: f, len: Math.min(len, 0.3), vol: 0.03, out });
}

function storedJazzFeel() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem('lore.pie.v1') || 'null')?.view?.feel === 'jazz';
  } catch {
    return false;
  }
}

/**
 * Play a spell. onAtom(i) is called as the i-th sigil sounds; onEnd() when it is done.
 * Optional `chapter`, `root`, `scale`, `sectionIndex`, `totalSections`, `jazz`, and `volume` anchor spells to the room/chapter key.
 * Returns stop(). Sound starts only from a gesture.
 * @param {string} text
 * @param {{ onAtom?: ((i: number) => void) | null, onEnd?: (() => void) | null, tempo?: number | null, volume?: number, root?: number | null, scale?: number[] | string | null, chapter?: number | null, sectionIndex?: number, totalSections?: number, jazz?: boolean }} [opts]
 */
export function playSpell(text, { onAtom = null, onEnd = null, tempo = null, volume = 1, root = null, scale = null, chapter = null, sectionIndex = 1, totalSections = 4, jazz = undefined } = {}) {
  if (!ensureAudio()) { onEnd?.(); return () => {}; }
  const { events, beats, key } = scoreOf(text);
  const useJazz = jazz !== undefined ? Boolean(jazz) : storedJazzFeel();
  const ch = chapter != null ? chapterKey(chapter) : null;
  const dev = ch ? chapterDevelopmentPlan({ chapter: ch.chapter, sectionIndex, totalSections, sigil: events[0]?.sigil || '.', jazz: useJazz }) : null;
  const resolvedTempo = Number.isFinite(tempo) && tempo > 0 ? tempo : (ch?.tempo || 112);
  const beat = 60 / resolvedTempo;
  const resolvedRoot = Number.isFinite(root) && root > 20 ? root : (ch?.root || 196 * 2 ** (PENTA[key % 5] / 12));
  const resolvedScale = scale ? resolveScale(scale) : (dev?.scale || PENTA);
  const gainScale = Math.max(0.05, Math.min(1.4, Number.isFinite(volume) ? volume : 1));
  const callGain = ctx.createGain();
  callGain.gain.value = gainScale;
  callGain.connect(bus.input);
  const start = ctx.currentTime + 0.08;
  const timers = [];
  events.forEach((e) => {
    const beatAt = useJazz ? swingBeat(e.t, 0.62) : e.t;
    sound(e, start + beatAt * beat, beat, resolvedRoot, callGain, resolvedScale, useJazz);
    if (onAtom && e.index != null) timers.push(setTimeout(() => onAtom(e.index), (beatAt * beat + 0.08) * 1000));
  });
  timers.push(setTimeout(() => onEnd?.(), (beats * beat + 0.6) * 1000));
  return () => { timers.forEach(clearTimeout); callGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02); onEnd?.(); };
}

/**
 * Play a soft voice-led interval when the reader intentionally navigates between rooms or chapters.
 * Silent when Web Audio is unavailable.
 * @param {{ fromSigil?: string, toSigil?: string, fromChapter?: number | null, toChapter?: number | null, direction?: number, volume?: number, sectionIndex?: number, totalSections?: number, jazz?: boolean }} [opts]
 */
export function playNavigationTransition(opts = {}) {
  if (typeof window === 'undefined' || !ensureAudio()) return false;
  const useJazz = opts.jazz !== undefined ? Boolean(opts.jazz) : storedJazzFeel();
  const plan = transitionPlan({ ...opts, jazz: useJazz });
  const start = ctx.currentTime + 0.02;
  plan.notes.forEach((n) => voice(start + n.at, n));
  return true;
}
