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
import { tokenize } from './spw-spell.mjs?v=2026_11_09.I';

const MATERIAL_WORDS = Object.freeze(['glass', 'flour', 'berry', 'frost', 'ink', 'brass', 'steam', 'oak']);
const PENTA = [0, 2, 4, 7, 9];
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

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
function ensureAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = ctx || new AudioCtx();
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
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

const freqOf = (root, degree, octave = 0) => {
  const d = Math.max(0, degree);
  return root * 2 ** (octave + Math.floor(d / 5) + PENTA[d % 5] / 12);
};

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

function noise(at, { len, f0, f1, q = 1.2, vol = 0.08, type = 'bandpass', clicks = 0 }) {
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
  src.connect(flt).connect(g).connect(bus.input);
  src.start(at);
}

/* Each material, as a texture (and the same vocabulary as materials.mjs). */
const TEXTURES = Object.freeze({
  glass: (at, len, root) => { [3, 4.02, 5.01].forEach((m, k) => voice(at + k * 0.03, { f0: root * m * 2, len, vol: 0.035, attack: 0.3 })); noise(at, { len, f0: 7000, q: 6, vol: 0.02, type: 'highpass' }); },
  flour: (at, len) => { for (let k = 0; k < 4; k += 1) noise(at + k * (len / 4), { len: len / 3, f0: 900, f1: 300, q: 0.7, vol: 0.05 }); },
  berry: (at, _len, root) => { [0, 2, 4].forEach((d, k) => voice(at + k * 0.12, { type: 'triangle', f0: freqOf(root, d, 1), len: 0.3, vol: 0.08 })); },
  frost: (at, len) => noise(at, { len, f0: 5000, q: 2, vol: 0.12, clicks: Math.round(len * 14) }),
  ink: (at, len, root) => voice(at, { type: 'triangle', f0: root / 2, f1: root / 2 * 1.01, len, vol: 0.06, attack: 0.4 }),
  brass: (at, len, root) => { [1, 2.76, 5.4].forEach((m, k) => voice(at, { f0: root * m, len: len * (1 - k * 0.2), vol: 0.06 / (k + 1) })); },
  steam: (at, len) => noise(at, { len, f0: 400, f1: 2400, q: 1.5, vol: 0.06 }),
  oak: (at, _len, root) => { voice(at, { f0: root * 0.75, f1: root * 0.6, len: 0.25, vol: 0.14 }); noise(at, { len: 0.04, f0: 2500, q: 3, vol: 0.06 }); }
});

function sound(e, at, beat, root) {
  const f = freqOf(root, e.degree || 0);
  const len = Math.max(0.12, e.len * beat);
  const pan = ((hash(e.label || '') % 9) - 4) / 5;
  switch (e.sigil) {
    case '?': voice(at, { f0: f, len: len * 0.5, vol: 0.09 }); voice(at + len * 0.45, { f0: f * 1.335, len: len * 0.6, vol: 0.08 }); break;
    case '~': voice(at, { f0: f, len, vol: 0.06, attack: len * 0.4 }); voice(at, { type: 'triangle', f0: f * 1.5, len, vol: 0.03, attack: len * 0.5 }); break;
    case '@': voice(at, { type: 'triangle', f0: f, len: len * 0.8, vol: 0.1, pan }); break;
    case '&': voice(at, { f0: f, len, vol: 0.07 }); voice(at, { f0: f * 1.26, len, vol: 0.06 }); break;
    case '*': [1, 2.01, 3.03].forEach((m, k) => voice(at, { f0: f * m, len: len * (1 - k * 0.25), vol: 0.07 / (k + 1) })); break;
    case '^': [0, 2, 4].forEach((d, k) => voice(at + k * len * 0.28, { f0: freqOf(root, (e.degree || 0) + d), len: len * 0.4, vol: 0.08 })); break;
    case '!': noise(at, { len: 0.08, f0: 1800, q: 1, vol: 0.14 }); voice(at, { f0: 110, f1: 55, len: 0.2, vol: 0.16 }); break;
    case '#': voice(at, { f0: f * 4, f1: f * 4.01, len: len * 1.4, vol: 0.05 }); break;
    case '.': voice(at, { type: 'triangle', f0: root / 2, len, vol: 0.09, attack: 0.05 }); break;
    case '=': if (bus) { bus.filter.frequency.setTargetAtTime(1600, at, 0.08); bus.filter.frequency.setTargetAtTime(9000, at + len, 0.3); } voice(at, { type: 'square', f0: f / 2, len: len * 0.5, vol: 0.025 }); break;
    case '%': for (let k = 0; k < (e.count || 2); k += 1) voice(at + k * beat * 0.25, { f0: 1760, len: 0.03, vol: 0.05 }); break;
    case '$': (TEXTURES[e.material] || TEXTURES.ink)(at, len, root); break;
    case '"': for (let k = 0; k < (e.syllables || 1); k += 1) noise(at + k * beat * 0.25, { len: beat * 0.2, f0: 600 + (k % 3) * 300, q: 4, vol: 0.025 }); break;
    case '{': voice(at, { type: 'sine', f0: root / 4, len, vol: 0.05, attack: 0.3 }); break;
    default: break;
  }
  if (e.glide && e.sigil !== '!' && e.sigil !== '%') voice(at, { f0: f * 0.94, f1: f, len: Math.min(len, 0.3), vol: 0.03 });
}

/**
 * Play a spell. onAtom(i) is called as the i-th sigil sounds; onEnd() when it is done.
 * Returns stop(). Sound starts only from a gesture (the ▶ the reader pressed).
 */
export function playSpell(text, { onAtom = null, onEnd = null, tempo = 112 } = {}) {
  if (!ensureAudio()) { onEnd?.(); return () => {}; }
  const { events, beats, key } = scoreOf(text);
  const beat = 60 / tempo;
  const root = 196 * 2 ** (PENTA[key % 5] / 12);
  const start = ctx.currentTime + 0.08;
  const timers = [];
  events.forEach((e) => {
    sound(e, start + e.t * beat, beat, root);
    if (onAtom && e.index != null) timers.push(setTimeout(() => onAtom(e.index), (e.t * beat + 0.08) * 1000));
  });
  timers.push(setTimeout(() => onEnd?.(), (beats * beat + 0.6) * 1000));
  return () => { timers.forEach(clearTimeout); onEnd?.(); };
}
