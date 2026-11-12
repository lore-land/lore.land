// @ts-check
/**
 * spw-cadence.mjs — a line of Spw read as a loop, and each character's way of playing it.
 *
 * The line is the score. Every sigil keeps its role (spw-interactions.mjs OPERATOR_ROLES, pie-rules.spw,
 * liminal-physics.spw), heard as time:
 *   ! action      an accent on the beat          ? probe        a rest that asks, then a pickup
 *   ~ potential   a tie: the last note sustains  & confluence   a chord: two voices at once
 *   * value       a repeat, or a named sample    ^ integration  the line rises
 *   . ground      the ground note, in the bass   = config       swing: a lean on the off-beat
 *   % measure     a bar line                     # annotation   a mark: a written accent, struck
 *   $ substrate   the material: the timbre       and the at sign, perspective: a solo voice
 * and every container its shape:
 *   [ ] a frame: its items fill one bar, the first chosen (accented)
 *   { } a body: a loop, played twice           ( ) a grouping: a tuplet, inside one beat
 *   < > a capsule: call, and a softer response a step down
 * A word sets syllables: each vowel group is a hit inside the word's beat, and its vowel sets the note (a e i o u y).
 *
 * Then a character plays it in their own time (characters.mjs: temperament, traits, the weight), never with a word:
 * Boof steady, her questions on the downbeat; the torch-ants in small steps passed along; the Genie swung, each
 * accent paid for with a rest; Mr. BaneWAP's accents a beat early, announced; Mr. BoonWAP in wide chords, nothing
 * cut short; BoneWAP exact, every beat said; the porter broad; the clerk quick and on the line; the clown loud; the
 * mime mostly silence, the few notes minor (the minor is the mimes' cue: pie-sound.mjs keeps no bane mode); and the
 * figure in plain lines unvoiced, since nobody has said.
 *
 * Pure until playCadence() is pressed (WebAudio, a gentle master gain, nothing autoplays). The real parser, when
 * given, says whether the line read whole; the loop is read token by token either way, and says which.
 */
// @ts-ignore: a page loads it with its version token, which the type checker cannot resolve; the shapes are characters.mjs's.
import { CHARACTERS, identitySpell, portraitSVG } from './characters.mjs?v=2026_11_11.A';

/** @typedef {{ at: number, dur: number, accent: number, pitch: number, voice: string, rest: boolean, chord?: boolean, ask?: boolean, timbre?: string }} Step */
/** @typedef {{ steps: Step[], meter: number, length: number, bars: number, mode: string, who: string, says: string, whole: boolean | null, reader: string, line: string }} Cadence */
/** @typedef {{ kind: 'atom', sigil: string, word: string } | { kind: 'group', open: string, items: Node[] }} Node */

export const SIGIL_BEATS = Object.freeze({
  '!': 'an accent on the beat', '?': 'a rest that asks, then a pickup', '~': 'a tie: the last note sustains', '&': 'a chord: two voices at once',
  '*': 'a repeat, or a named sample', '^': 'the line rises', '.': 'the ground note, in the bass', '=': 'swing: a lean on the off-beat',
  '%': 'a bar line', '#': 'a mark, struck', '@': 'a solo voice', '$': 'the material: the timbre'
});
export const CONTAINER_BEATS = Object.freeze({
  '[': 'a frame: its items fill one bar, the first chosen', '{': 'a body: a loop, played twice', '(': 'a grouping: a tuplet inside one beat', '<': 'a capsule: call, and a softer response'
});
/** @type {Readonly<Record<string, string>>} */
const CLOSE = Object.freeze({ '[': ']', '{': '}', '(': ')', '<': '>' });
const VOWEL_DEGREE = Object.freeze({ a: 0, e: 1, i: 2, y: 3, o: 4, u: 5 });
export const TIMBRES = Object.freeze({ glass: 'sine', frost: 'sine', flour: 'triangle', berry: 'triangle', oak: 'triangle', ink: 'sine', brass: 'square', steam: 'triangle' });

/* ─── Reading ─────────────────────────────────────────────────────────── */

/** The line, token by token: sigils (with their word), containers, words, numbers, quoted text. @param {string} line */
export function tokens(line) {
  const out = [];
  const re = /([!?~@&*^#.=%$])([A-Za-z_][\w-]*)?|([[\]{}()<>])|"([^"]*)"|(\d+(?:\.\d+)?)|([A-Za-z_][\w-]*)/g;
  let m;
  while ((m = re.exec(String(line || '')))) {
    if (m[1]) out.push({ t: 'sigil', sigil: m[1], word: m[2] || '' });
    else if (m[3]) out.push({ t: 'box', ch: m[3] });
    else if (m[4] != null) out.push({ t: 'word', word: m[4] });
    else if (m[5]) out.push({ t: 'word', word: m[5] });
    else if (m[6]) out.push({ t: 'word', word: m[6] });
  }
  return out;
}

/**
 * Tokens into a tree of atoms and containers; a container left open closes at the end (read as far as it reads).
 * @param {Array<{ t: string, sigil?: string, word?: string, ch?: string }>} list
 */
function tree(list) {
  /** @type {{ kind: 'group', open: string, items: Node[] }} */
  const root = { kind: 'group', open: '', items: [] };
  const stack = [root];
  list.forEach((tk) => {
    const top = stack[stack.length - 1];
    if (tk.t === 'box') {
      const ch = tk.ch || '';
      /** @type {{ kind: 'group', open: string, items: Node[] }} */
      const g = { kind: 'group', open: ch, items: [] };
      if (CLOSE[ch]) { top.items.push(g); stack.push(g); }
      else if (stack.length > 1 && CLOSE[top.open] === ch) stack.pop();
      return;
    }
    if (tk.t === 'sigil') top.items.push({ kind: 'atom', sigil: tk.sigil || '', word: tk.word || '' });
    else top.items.push({ kind: 'atom', sigil: '', word: tk.word || '' });
  });
  return root;
}

/** Syllables of a word: vowel groups, one to four, each with the note its vowel sets. @param {string} word */
export function syllables(word) {
  const groups = String(word || '').toLowerCase().match(/[aeiouy]+/g) || [];
  const notes = groups.slice(0, 4).map((g) => VOWEL_DEGREE[/** @type {keyof typeof VOWEL_DEGREE} */ (g[0])] ?? 0);
  return notes.length ? notes : (/\d/.test(word) ? [Number(String(word)[0]) % 7] : [0]);
}

/* ─── The loop the line makes, before anyone plays it ─────────────────── */

/**
 * @param {Node} node
 * @param {{ pitch: number, swing: number, timbre: string, meter: number, chordNext: boolean }} st
 * @returns {{ steps: Step[], length: number }}
 */
function render(node, st) {
  if (node.kind === 'group') {
    let at = 0;
    /** @type {Step[]} */
    let steps = [];
    node.items.forEach((item, i) => {
      const r = render(item, st);
      if (node.open === '[' && i === 0) r.steps.forEach((s) => { if (!s.rest) s.accent = Math.max(s.accent, 1); });
      if (item.kind === 'atom' && item.sigil === '~' && !item.word && steps.length) {
        // A tie: the last sounding note holds a beat longer.
        const last = [...steps].reverse().find((s) => !s.rest);
        if (last) last.dur += 1;
        at += 1;
        return;
      }
      if (item.kind === 'atom' && item.sigil === '*' && !item.word && steps.length) {
        // A repeat: the last beat again.
        const from = Math.max(0, at - 1);
        const again = steps.filter((s) => s.at >= from && s.at < at).map((s) => ({ ...s, at: s.at - from + at }));
        steps = steps.concat(again);
        at += 1;
        return;
      }
      if (item.kind === 'atom' && item.sigil === '%' && !item.word) {
        // A bar line: rest to the end of the bar.
        const to = Math.ceil(at / st.meter) * st.meter || st.meter;
        if (to > at) steps.push({ at, dur: to - at, accent: 0, pitch: st.pitch, voice: 'lead', rest: true });
        at = to;
        return;
      }
      steps = steps.concat(r.steps.map((s) => ({ ...s, at: s.at + at })));
      at += r.length;
    });
    if (node.open === '(' && at > 0) { steps = steps.map((s) => ({ ...s, at: s.at / at, dur: s.dur / at })); at = 1; }
    if (node.open === '[' && at > 0 && node.items.length > 1) { const k = st.meter / at; steps = steps.map((s) => ({ ...s, at: s.at * k, dur: s.dur * k })); at = st.meter; }
    if (node.open === '{') { steps = steps.concat(steps.map((s) => ({ ...s, at: s.at + at }))); at *= 2; }
    if (node.open === '<') { steps = steps.concat(steps.map((s) => ({ ...s, at: s.at + at, pitch: s.pitch - 1, accent: 0, voice: s.rest ? s.voice : 'response' }))); at *= 2; }
    return { steps, length: at };
  }
  const { sigil, word } = node;
  const notes = word ? syllables(word) : [];
  const base = st.pitch;
  /** @type {Step[]} */
  let steps = notes.map((d, i) => ({ at: i / notes.length, dur: 1 / notes.length, accent: 0, pitch: base + d, voice: 'lead', rest: false, timbre: st.timbre }));
  let length = word ? 1 : 0;
  const alone = (/** @type {Partial<Step>} */ s) => { steps = [{ at: 0, dur: 1, accent: 0, pitch: base, voice: 'lead', rest: false, timbre: st.timbre, ...s }]; length = 1; };
  if (st.chordNext && steps.length) { steps.forEach((s) => { s.chord = true; }); st.chordNext = false; }
  switch (sigil) {
    case '!': if (word) steps.forEach((s) => { s.accent = 1; }); else alone({ accent: 1 }); break;
    case '?':
      steps = [{ at: 0, dur: 0.5, accent: 0, pitch: base, voice: 'lead', rest: true, ask: true }, ...(word ? steps.map((s) => ({ ...s, at: 0.5 + s.at / 2, dur: s.dur / 2, ask: true })) : [{ at: 0.5, dur: 0.5, accent: 0, pitch: base + 1, voice: 'lead', rest: false, ask: true, timbre: st.timbre }])];
      length = 1;
      break;
    case '~': if (word) steps.forEach((s) => { s.dur *= 2; }); length = word ? 2 : 0; break;
    case '&': if (word) steps.forEach((s) => { s.chord = true; }); else st.chordNext = true; break;
    case '*': if (word) { steps = steps.concat(steps.map((s) => ({ ...s, at: s.at + 1 }))).map((s) => ({ ...s, voice: 'sample' })); length = 2; } break;
    case '^': st.pitch += 2; if (word) steps.forEach((s) => { s.pitch += 2; }); break;
    case '.': if (word) steps.forEach((s) => { s.voice = 'bass'; s.pitch = 0; }); else alone({ voice: 'bass', pitch: 0 }); st.pitch = 0; break;
    case '=': st.swing = 1 / 6; break;
    case '%': if (word && /^\d+$/.test(word)) { st.meter = Math.max(2, Math.min(7, Number(word))); steps = []; length = 0; } break;
    case '#': if (word) { if (steps[0]) { steps[0].voice = 'mark'; steps[0].accent = 1; } } else alone({ voice: 'mark', accent: 1 }); break;
    case '@': steps.forEach((s) => { s.voice = 'solo'; s.pitch += 7; }); break;
    case '$': if (word && TIMBRES[/** @type {keyof typeof TIMBRES} */ (word.toLowerCase())]) { st.timbre = word.toLowerCase(); steps.forEach((s) => { s.timbre = st.timbre; }); } break;
    default: break;
  }
  if (st.swing) steps.forEach((s) => { const off = (s.at * 2) % 2; if (Math.abs(off - 1) < 1e-6) s.at += st.swing; });
  return { steps, length };
}

/**
 * The loop a line makes, unplayed: { steps, meter, length, whole, reader }. With parse (the real parser), whole says
 * whether the line read whole; it is read token by token either way, so a line that does not read is still heard as
 * far as it reads.
 * @param {string} line
 * @param {{ parse?: ((text: string, options?: any) => any) | null, bars?: number }} [opts]
 */
export function loopOf(line, { parse = null, bars = 2 } = {}) {
  /** @type {boolean | null} */
  let whole = null;
  if (parse) { try { const r = parse(String(line || ''), { lexProfile: 'prose' }); whole = Boolean(r?.completeness?.complete && !r.completeness.proseFallback); } catch { whole = false; } }
  const st = { pitch: 0, swing: 0, timbre: 'flour', meter: 4, chordNext: false };
  const { steps, length } = render(tree(tokens(line)), st);
  const meter = st.meter;
  const target = Math.max(1, bars) * meter;
  let out = steps.filter((s) => s.dur > 0);
  let len = Math.max(length, 1);
  // Too long for the bars: played faster, never below eighth notes; past that, the rest waits for another loop.
  if (len > target) {
    const k = Math.max(0.5, target / len);
    out = out.map((s) => ({ ...s, at: s.at * k, dur: s.dur * k })).filter((s) => s.at < target);
    len = target;
  }
  // Short: the loop goes round until the bars are full.
  if (len < target && out.length) {
    const once = out;
    out = [];
    for (let at = 0; at < target - 1e-6; at += len) out = out.concat(once.map((s) => ({ ...s, at: s.at + at })).filter((s) => s.at < target));
  }
  if (!out.length) out = [{ at: 0, dur: target, accent: 0, pitch: 0, voice: 'lead', rest: true }];
  out.sort((a, b) => a.at - b.at);
  return { steps: out.map((s) => ({ ...s, dur: Math.min(s.dur, target - s.at) })), meter, length: target, whole, reader: parse ? (whole ? 'spw-seed' : 'token by token, after the parser did not read it whole') : 'token by token' };
}

/* ─── Each character's time ───────────────────────────────────────────── */

/** @param {number} x @param {number} unit */
const q = (x, unit) => Math.round(x / unit) * unit;
/** @type {Readonly<Record<string, (steps: Step[], m: { meter: number, length: number }) => { steps: Step[], says: string, mode?: string }>>} */
const PLAYS = Object.freeze({
  boof: (steps, { meter }) => {
    // Steady, nose first: everything on the half beat, and a question lands on the downbeat as a sniff.
    const out = steps.map((s) => (s.ask && !s.rest ? { ...s, at: Math.floor(s.at / meter) * meter, accent: 1, voice: 'lead' } : { ...s, at: q(s.at, 0.5) }));
    return { steps: out, says: 'Boof kept it steady on the half beat, and put each question on the downbeat, nose first.' };
  },
  ants: (steps) => {
    // Many small steps, passed along: each note split in two, the second a step up, a torch handed on.
    const out = steps.flatMap((s) => (s.rest ? [s] : [{ ...s, dur: s.dur / 2 }, { ...s, at: s.at + s.dur / 2, dur: s.dur / 2, pitch: s.pitch + 1, voice: 'pass' }]));
    return { steps: out, says: 'The torch-ants split every note in two and passed the second one up the line.' };
  },
  genie: (steps) => {
    // Swung, and priced: notes go in long-short pairs, every accent is paid for with the next plain note, and where
    // nothing is accented the practice still takes its fee, one note in four.
    let owed = 0;
    let n = 0;
    const accented = steps.some((s) => s.accent && !s.rest);
    const out = steps.map((s) => {
      if (s.rest) return { ...s };
      n += 1;
      const swung = n % 2 === 0 ? { ...s, at: s.at + 1 / 6 } : { ...s };
      if (s.accent) { owed += 1; return swung; }
      if (owed > 0 || (!accented && n % 4 === 0)) { owed = Math.max(0, owed - 1); return { ...swung, rest: true, voice: 'price' }; }
      return swung;
    });
    return { steps: out, says: 'The Genie swung it in pairs, and paid for every accent with the plain note after it; where nothing was accented, one note in four went as his fee.' };
  },
  bane: (steps, { length, meter }) => {
    // Announced: an accent arrives a beat before it should, and so it does. With none written, he announces the bar.
    const accented = steps.some((s) => s.accent && !s.rest);
    const out = steps.map((s) => ((accented ? s.accent : Math.abs(s.at % meter) < 1e-6) && !s.rest ? { ...s, at: (s.at - 1 + length) % length, accent: 2 } : s));
    return { steps: out, says: 'Mr. BaneWAP played every accent a beat early, announced, and so it came.' };
  },
  boon: (steps) => {
    // Wide chords, never smaller: every note a chord, and each held to the next; no rest cuts anything short.
    const hits = steps.filter((s) => !s.rest).sort((a, b) => a.at - b.at);
    const out = hits.map((s, i) => ({ ...s, chord: true, dur: Math.max(s.dur, (hits[i + 1]?.at ?? s.at + s.dur) - s.at) }));
    return { steps: out, says: 'Mr. BoonWAP made every note a chord and held each until the next; nothing was cut short.' };
  },
  bonewap: (steps, { length }) => {
    // Exact and declared: no swing, every beat said, softly where the line had nothing.
    /** @type {Step[]} */
    const straight = steps.map((s) => ({ ...s, at: q(s.at, 0.5), chord: false, accent: Number.isInteger(q(s.at, 0.5)) ? 1 : 0 }));
    /** @type {Step[]} */
    const said = [];
    for (let b = 0; b < length; b += 1) if (!straight.some((s) => !s.rest && Math.abs(s.at - b) < 1e-6)) said.push({ at: b, dur: 0.5, accent: 0, pitch: 0, voice: 'bass', rest: false });
    return { steps: straight.filter((s) => !s.rest).concat(said), says: 'BoneWAP played it exactly, one voice at a time, with no swing, and said every beat, softly where the line had nothing.' };
  },
  porter: (steps, { meter }) => {
    // Broad: one note a beat at most, held, with the weight on the first and the middle of the bar.
    const seen = new Set();
    const out = steps.filter((s) => !s.rest).map((s) => ({ ...s, at: Math.floor(s.at) })).filter((s) => (seen.has(s.at) ? false : seen.add(s.at)))
      .map((s) => ({ ...s, dur: 1, accent: s.at % meter === 0 || s.at % meter === Math.floor(meter / 2) ? 1 : 0 }));
    return { steps: out, says: 'The porter played one broad note a beat at most, the weight on the first of the bar and its middle.' };
  },
  clerk: (steps, { meter, length }) => {
    // Quick and on the line: short notes on the sixteenth, and a tally struck at the end of every bar.
    const out = steps.map((s) => ({ ...s, at: q(s.at, 0.25), dur: Math.min(s.dur, 0.2) }));
    for (let b = meter; b <= length; b += meter) out.push({ at: b - 0.25, dur: 0.2, accent: 1, pitch: 4, voice: 'mark', rest: false });
    return { steps: out, says: 'The clerk played it quick and short, on the sixteenth, with a tally struck at the end of each bar.' };
  },
  clown: (steps) => {
    // Big: every downbeat note as loud as it gets, and everything slides up into place.
    const out = steps.map((s) => (s.rest ? s : { ...s, accent: Math.abs(s.at - Math.round(s.at)) < 1e-6 ? 2 : 1, voice: 'slide' }));
    return { steps: out, says: 'The clown played every note big, the downbeats biggest, each one sliding up into place.' };
  },
  mime: (steps, { meter }) => {
    // Mostly silence: one note a bar, if that, in the minor; the rest is rests, and the rests are the content.
    const kept = new Set();
    const out = steps.map((s) => {
      const bar = Math.floor(s.at / meter);
      if (!s.rest && !kept.has(bar) && (s.accent || s.at % meter === 0)) { kept.add(bar); return { ...s, voice: 'lead' }; }
      return { ...s, rest: true, voice: 'silence' };
    });
    return { steps: out, says: 'The mime kept one note a bar at most, in the minor, and made the rest of it silence.', mode: 'minor' };
  },
  figure: (steps) => ({ steps: steps.map((s) => ({ ...s, rest: true, voice: 'unvoiced' })), says: 'Nobody has said.' })
});
export const PLAYERS = Object.freeze(Object.keys(PLAYS));
/** The cast's own name for someone the line names (@boonwap is Mr. BoonWAP), or '' if nobody plays by it. @param {string} word */
export function playerFor(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z_-]/g, '');
  const alias = /** @type {Record<string, string>} */ ({ boonwap: 'boon', banewap: 'bane', bonewap: 'bonewap', torch_ants: 'ants', 'torch-ants': 'ants', ant: 'ants' })[w];
  const id = alias || w;
  return PLAYS[id] ? id : '';
}
/** A character's name and palette, for a page that shows a ring. @param {string} who */
export const castOf = (who) => ({ name: CHARACTERS[who]?.name || who, palette: CHARACTERS[who]?.palette || {} });

/**
 * A line as a character plays it: { steps, meter, length, bars, mode, who, says, whole, reader, line }.
 * @param {string} line
 * @param {string} [who]
 * @param {{ bars?: number, parse?: ((text: string, options?: any) => any) | null }} [opts]
 * @returns {Cadence}
 */
export function cadenceOf(line, who = 'boof', { bars = 2, parse = null } = {}) {
  const base = loopOf(line, { parse, bars });
  const play = PLAYS[who] || PLAYS.boof;
  const played = play(base.steps.map((s) => ({ ...s })), base);
  const steps = played.steps.filter((s) => s.at >= 0 && s.at < base.length).sort((a, b) => a.at - b.at || Number(a.rest) - Number(b.rest));
  return { steps, meter: base.meter, length: base.length, bars: base.length / base.meter, mode: played.mode || 'major', who: PLAYS[who] ? who : 'boof', says: played.says, whole: base.whole, reader: base.reader, line: String(line || '') };
}

/** Counts a reader (or a check) can compare: hits, rests, accents, chords, and swing (mean distance off the half beat). @param {Cadence} c */
export function shapeOf(c) {
  const hits = c.steps.filter((s) => !s.rest);
  const swing = hits.length ? hits.reduce((n, s) => n + Math.abs(s.at - q(s.at, 0.5)), 0) / hits.length : 0;
  return { hits: hits.length, rests: c.steps.filter((s) => s.rest).length, accents: hits.filter((s) => s.accent).length, chords: hits.filter((s) => s.chord).length, swing: Math.round(swing * 1000) / 1000 };
}

/* ─── The ring: the loop drawn round, in the cast's medallion style ───── */

let ringCount = 0;
/** @param {number} x */
const n1 = (x) => Math.round(x * 10) / 10;
/**
 * The loop as a ring of beats: filled for a note, open for a rest, larger for an accent, an inner ring for chords and the
 * bass, ticks at the bar lines, and a hand that can sweep it while it plays. Ids are the drawing's own.
 * @param {Cadence} c
 * @param {{ size?: number, palette?: { ground?: string, a?: string, c?: string, accent?: string }, inner?: string, label?: string }} [opts]
 */
export function cadenceRingSVG(c, { size = 132, palette = {}, inner = '', label = '' } = {}) {
  const id = `cadence-ring-${(ringCount += 1).toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  const ground = palette.ground || '#f4ecdc';
  const ink = palette.c || '#2a2a30';
  const accent = palette.accent || '#c4922e';
  const lead = palette.a || ink;
  /** @param {number} t @param {number} r */
  const at = (t, r) => { const a = (t / c.length) * Math.PI * 2 - Math.PI / 2; return [n1(50 + Math.cos(a) * r), n1(50 + Math.sin(a) * r)]; };
  const ticks = [];
  for (let b = 0; b < c.length; b += c.meter) { const [x1, y1] = at(b, 44); const [x2, y2] = at(b, 48); ticks.push(`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${ink}" stroke-width="1.4"/>`); }
  const slots = [];
  for (let t = 0; t < c.length; t += 0.5) { const [x, y] = at(t, 40); slots.push(`<circle cx="${x}" cy="${y}" r="0.9" fill="${ink}" opacity="0.25"/>`); }
  const marks = c.steps.map((s) => {
    const r = s.voice === 'bass' ? 30 : 40;
    const [x, y] = at(s.at, r);
    const big = s.accent >= 2 ? 4.4 : s.accent ? 3.5 : 2.4;
    if (s.rest) return `<circle cx="${x}" cy="${y}" r="2.2" fill="none" stroke="${ink}" stroke-width="0.9" opacity="0.7"/>`;
    const chord = s.chord ? (() => { const [cx, cy] = at(s.at, 34); return `<circle cx="${cx}" cy="${cy}" r="1.9" fill="${accent}"/>`; })() : '';
    return `<circle cx="${x}" cy="${y}" r="${big}" fill="${s.accent ? accent : lead}" stroke="${ink}" stroke-width="0.5"/>${chord}`;
  }).join('');
  const [hx, hy] = at(0, 46);
  const name = label || `${CHARACTERS[c.who]?.name || c.who}: ${c.says}`;
  return `<svg class="cadence-ring" data-cadence-who="${c.who}" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${name.replace(/"/g, '&quot;')}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}-face"><circle cx="50" cy="50" r="27"/></clipPath></defs><circle cx="50" cy="50" r="49" fill="${ground}"/><circle cx="50" cy="50" r="40" fill="none" stroke="${ink}" stroke-width="0.6" opacity="0.35"/>${ticks.join('')}${slots.join('')}${marks}${inner ? `<g clip-path="url(#${id}-face)"><svg x="23" y="23" width="54" height="54" viewBox="0 0 100 100">${inner}</svg></g>` : ''}<path id="${id}-hand" class="cadence-hand" d="M50 50 L${hx} ${hy}" stroke="${accent}" stroke-width="1.2" stroke-linecap="round" opacity="0"/><circle cx="50" cy="50" r="48" fill="none" stroke="${accent}" stroke-width="2"/></svg>`;
}

/** A character's own signature line (characters.mjs identitySpell) as a ring around their portrait. @param {string} id @param {{ size?: number }} [opts] */
export function signatureRing(id, { size = 132 } = {}) {
  const c = CHARACTERS[id];
  if (!c) return '';
  const cad = cadenceOf(identitySpell(id), id, { bars: 2 });
  // The portrait as the cast draws it in a page: its own clip id, its colours carried on its own root.
  const face = portraitSVG(id, { size: 100 });
  return cadenceRingSVG(cad, { size, palette: c.palette, inner: face, label: `${c.name}, as a loop of their own line` });
}

/* ─── Hearing it: a small scheduler, pressed, never played on its own ─── */

const SCALES = Object.freeze({ major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] });
/** @param {number} degree @param {string} mode */
const hzOf = (degree, mode) => {
  const scale = SCALES[/** @type {keyof typeof SCALES} */ (mode)] || SCALES.major;
  const oct = Math.floor(degree / 7);
  const semi = oct * 12 + scale[((degree % 7) + 7) % 7];
  return 261.63 * 2 ** (semi / 12);
};
/** @type {AudioContext | null} */
let audio = null;
/**
 * Play a cadence: soft blips, accents louder, chords two voices, at a gentle level, at most twice round.
 * Returns { stop, seconds } or null where there is no audio. Call only from a press.
 * @param {Cadence} c
 * @param {{ bpm?: number, loops?: number, gain?: number }} [opts]
 */
export function playCadence(c, { bpm = 96, loops = 1, gain = 0.07 } = {}) {
  const AC = /** @type {any} */ (globalThis).AudioContext || /** @type {any} */ (globalThis).webkitAudioContext;
  if (!AC) return null;
  audio = audio || new AC();
  if (!audio) return null;
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  const ctx = audio;
  const master = ctx.createGain();
  master.gain.value = Math.min(0.12, Math.max(0, gain));
  master.connect(ctx.destination);
  const beat = 60 / bpm;
  const t0 = ctx.currentTime + 0.06;
  const rounds = Math.max(1, Math.min(2, loops));
  /** @param {number} hz @param {number} at @param {number} dur @param {number} level @param {OscillatorType} type */
  const blip = (hz, at, dur, level, type) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = hz;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, at + Math.max(0.06, dur));
    osc.connect(env);
    env.connect(master);
    osc.start(at);
    osc.stop(at + Math.max(0.08, dur) + 0.05);
  };
  for (let r = 0; r < rounds; r += 1) {
    c.steps.forEach((s) => {
      if (s.rest) return;
      const at = t0 + (r * c.length + s.at) * beat;
      const dur = Math.min(1.6, s.dur * beat * 0.9);
      const level = (s.accent >= 2 ? 0.9 : s.accent ? 0.7 : 0.45) * (s.voice === 'response' ? 0.55 : 1);
      const type = s.voice === 'mark' ? 'triangle' : s.voice === 'bass' ? 'sine' : (TIMBRES[/** @type {keyof typeof TIMBRES} */ (s.timbre || 'flour')] === 'square' ? 'triangle' : TIMBRES[/** @type {keyof typeof TIMBRES} */ (s.timbre || 'flour')] || 'triangle');
      const hz = s.voice === 'bass' ? hzOf(s.pitch, c.mode) / 2 : s.voice === 'mark' ? hzOf(s.pitch + 14, c.mode) : hzOf(s.pitch, c.mode);
      blip(hz, at, s.voice === 'mark' ? 0.08 : dur, level, /** @type {OscillatorType} */ (type));
      if (s.chord) blip(hzOf(s.pitch + 2, c.mode), at, dur, level * 0.7, 'sine');
    });
  }
  const seconds = rounds * c.length * beat + 0.3;
  return { seconds, stop: () => { try { master.disconnect(); } catch { /* already quiet */ } } };
}
