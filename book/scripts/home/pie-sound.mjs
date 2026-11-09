/**
 * pie-sound.mjs — the lanes, heard: WAP and the tactile notes of the carry, synthesized; no files.
 *
 * One bus for every sound: a soft top, a compressor, a short echo the size of a lane that darkens
 * as it returns, and a room around it all (open air in the field, walls close by in the city).
 * Every sound is placed where it happened: across by its lane, and back by how far up the lanes
 * it is (farther is quieter, softer, and more of the room). While the land runs at a beaver's pace
 * the bus is muffled, as if heard through slow time; while the mimes lead, it thins, the way it is
 * harder to wonder about pie. Footsteps know the ground: grass in the field, cobbles in the city.
 *
 * The music of it:
 *   a key        each chapter has its own, a pentatonic (a minor one while the mimes hold it), and
 *                its own pulse; knocks are out of key, on purpose, and the Egg's hum is in no key
 *   a chord      each room colours the key by its sigil (. home, ? left open, ~ drifting, @ the
 *                same notes seen from elsewhere, ^ lifting, = tuned in fifths …), and what the
 *                land gives sings the room's chord
 *   a line       every tuned thing (catches, bank shots, deft landings, shares) continues one
 *                melody, a step on through the key, landing on the chord and turning at the top
 *                and bottom; after a rest it starts again
 *   a pulse      answers come on the chapter's pulse: the second note of a catch, the honks after a
 *                WAP, the strum of an arpeggio; what the carrier does sounds at once
 *   the land     a streak of good things brings the room's chord up under them, wide and low,
 *   joins in     brighter the longer it runs; a knock breaks it; the spill resolves home
 *   instruments  catches a celesta, deft landings a marimba, berries a vibraphone, shares two
 *                kalimbas (one each side), wonders a music box, glass rings a fifth, a bronze post
 *                its bar's odd partials, a hop a plucked string climbing the chord, the clowns'
 *                honks kazoos a chord tone higher for each WAP in a combo, over the room's bass
 *
 * Made to be heard the hundredth time, since a carry is hundreds of steps, catches and knocks:
 *   never twice the same   each sound is nudged a little in pitch, level, colour and place, and
 *                          its noise is read from a different part of one shared buffer
 *   an ear that tires      a sound repeated quickly comes back quieter and softer-edged, the way
 *                          an ear stops minding what it keeps hearing, and recovers in a breath
 *   once in an instant     the same sound twice at the same moment plays once
 *   soft edges             no bare square or saw: each goes through a filter, as a reed or a
 *                          kazoo; struck things are a few partials, the higher dying the sooner
 */

let audio = null;
let bus = null;
let noiseBuffer = null;
const sound = { root: 293.66, minor: false, ground: 'field', muffled: false, thin: false, pulse: 96 };
const ROOTS = [293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23];
const PULSES = [96, 92, 104, 88, 100, 108, 96, 92, 112, 84, 100, 104, 96, 90, 108];
const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const spread = (amount) => 1 + (Math.random() * 2 - 1) * amount;
const jitter = (amount) => (Math.random() * 2 - 1) * amount;
/** A pitch, in semitones from the chapter's root. */
const hz = (semi) => sound.root * 2 ** (semi / 12);

/* ─── Harmony: each room's sigil, a colour of the chapter's key ───────── */

/* Pitch classes above the key's root, and the one the bass takes. In a minor (the mimes) the
 * thirds, sixths and sevenths fall, except where that would sour a colour, which then has a minor of
 * its own. What the land gives sings only the chord's tones that are in the pentatonic (two at
 * least: the root and fifth stand in); the pad and the bass take the whole chord. */
const COLOURS = Object.freeze({
  '.': { bass: 0, pcs: [0, 4, 7] },        // ground: home
  '!': { bass: 0, pcs: [0, 7] },           // struck: a bare fifth
  '?': { bass: 0, pcs: [0, 2, 7] },        // asks: a sus2, left open
  '~': { bass: 5, pcs: [0, 4, 5, 9] },     // might be: the fourth's chord with its seventh, drifting
  '@': { bass: 9, pcs: [0, 4, 9] },        // seen from somewhere: the same notes, from the relative minor
  '&': { bass: 0, pcs: [0, 2, 4, 7] },     // joined: the third with a ninth beside it
  '*': { bass: 0, pcs: [0, 4, 7, 9], minor: { bass: 0, pcs: [0, 3, 7, 10] } },  // kept: a sixth, bright and dear
  '^': { bass: 7, pcs: [0, 2, 7] },        // lifted: the fifth's, suspended, rising
  '#': { bass: 4, pcs: [4, 7, 11] },       // marked: the third's, plain as a sign
  '=': { bass: 2, pcs: [2, 9], minor: { bass: 7, pcs: [2, 7] } },              // tuned: a fifth on the second, like strings tuning
  '%': { bass: 2, pcs: [2, 5, 9], minor: { bass: 10, pcs: [2, 5, 10] } },       // measured: the second's, considered
  '$': { bass: 5, pcs: [0, 5, 9] }         // made: the fourth's, earthy
});
const FALLS = Object.freeze({ 4: 3, 9: 8, 11: 10 });
const harmony = { sigil: '.', bass: 0, pcs: [0, 4, 7], sung: [0, 4, 7] };

function setHarmony(sigil) {
  const base = COLOURS[sigil] || COLOURS['.'];
  const own = sound.minor && base.minor;
  const colour = own || base;
  const fall = (pc) => (sound.minor && !own ? (FALLS[pc] ?? pc) : pc);
  const scale = sound.minor ? MINOR : MAJOR;
  const pcs = [...new Set(colour.pcs.map(fall))].sort((a, b) => a - b);
  let sung = pcs.filter((pc) => scale.includes(pc));
  if (sung.length < 2) sung = [...new Set([...sung, 0, 7])].sort((a, b) => a - b);
  Object.assign(harmony, { sigil: COLOURS[sigil] ? sigil : '.', bass: fall(colour.bass), pcs, sung });
  retunePad();
}
/** The i-th tone the chord sings, climbing by octaves. */
const sungTone = (i) => {
  const n = harmony.sung.length;
  return harmony.sung[((i % n) + n) % n] + 12 * Math.floor(i / n);
};
/** The room's bass, an octave or two under the key's root. */
const bassLow = () => harmony.bass - (harmony.bass > 6 ? 24 : 12);

/* ─── The line: one melody through every tuned thing ──────────────────── */

const line = { at: 7, dir: 1, last: -9 };
const scaleRun = () => {
  const scale = sound.minor ? MINOR : MAJOR;
  const out = [];
  for (let o = -1; o <= 3; o += 1) scale.forEach((s) => out.push(s + 12 * o));
  return out;
};
const isSung = (semi) => harmony.sung.includes(((semi % 12) + 12) % 12);
const nearestIndex = (run, semi) => run.reduce((best, s, i) => (Math.abs(s - semi) < Math.abs(run[best] - semi) ? i : best), 0);
/** The nearest tone the chord sings to a pitch. */
const sungNear = (semi) => {
  const run = scaleRun().filter(isSung);
  return run[nearestIndex(run, semi)];
};
/** The next tone the chord sings above (or below) a pitch. */
const sungFrom = (semi, dir = 1) => {
  const run = scaleRun().filter(isSung);
  return (dir > 0 ? run.find((s) => s > semi) : [...run].reverse().find((s) => s < semi)) ?? semi + 12 * dir;
};
/** The line's next note: `steps` on through the key the way it is heading, landing on the chord;
 *  at the top or bottom of its range it turns; after a rest it starts again near the middle. */
function nextNote(now, steps = 1) {
  if (now - line.last > 3.5) {
    line.at = sungNear(7 + [-3, 0, 2, 5][Math.floor(Math.random() * 4)]);
    line.dir = 1;
    line.last = now;
    return line.at;
  }
  const run = scaleRun();
  const i = nearestIndex(run, line.at);
  let j = i + steps * line.dir;
  if (!run[j] && run[j] !== 0) j = i - steps * line.dir;
  if (run[j] > 24 || run[j] < 0) { line.dir = -line.dir; j = i + steps * line.dir; }
  for (let guard = 0; guard < 3 && j > 0 && j < run.length - 1 && !isSung(run[j]); guard += 1) j += line.dir;
  line.at = run[clamp(j, 0, run.length - 1)];
  line.last = now;
  return line.at;
}

/* ─── The pulse: answers land on it ───────────────────────────────────── */

const sixteenth = () => 60 / sound.pulse / 4;
/** Seconds from t to the chapter pulse's next sixteenth at least `after` away. */
const toPulse = (t, after = 0.045) => Math.ceil((t + after) / sixteenth()) * sixteenth() - t;

/* ─── The bus, and the room around it ─────────────────────────────────── */

function context() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audio = audio || new AudioCtx();
  if (audio.state !== 'running') audio.resume().catch(() => {});
  ensureBus();
  return audio;
}

/** Browsers let sound start only from a gesture: the click or key that starts a carry. */
export function primeAudio() {
  try { context(); } catch { /* silent, then */ }
}

/* A room's answer, as a stereo impulse: in the field, a soft bounce off the ground and open air
 * that darkens as it fades; in the city, walls close on either side, then the street's tail. */
function roomImpulse(ground) {
  const sr = audio.sampleRate;
  const field = ground === 'field';
  const secs = field ? 1.8 : 1.2;
  const n = Math.floor(sr * secs);
  const ir = audio.createBuffer(2, n, sr);
  const early = field ? [[0.006, 0.45]] : [[0.009, 0.5], [0.017, 0.38], [0.026, 0.3], [0.041, 0.22], [0.057, 0.15]];
  for (let c = 0; c < 2; c += 1) {
    const d = ir.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / sr;
      const darken = Math.min(1, t / secs);
      lp += (field ? 0.5 - 0.42 * darken : 0.68 - 0.5 * darken) * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t * (field ? 3.8 : 5.4)) * Math.min(1, t / (field ? 0.025 : 0.01));
    }
    early.forEach(([at, g], k) => {
      const i = Math.floor((at + (k % 2 === c ? 0 : 0.0011)) * sr);
      if (i < n) d[i] += g * (k % 2 === c ? 1 : 0.55);
    });
  }
  return ir;
}

function ensureBus() {
  if (!audio || bus) return bus;
  const input = audio.createGain();
  const muffle = audio.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 16000;
  const thin = audio.createBiquadFilter();
  thin.type = 'highpass';
  thin.frequency.value = 30;
  // A soft top: the sizzle above the voices is what tires an ear first.
  const soft = audio.createBiquadFilter();
  soft.type = 'highshelf';
  soft.frequency.value = 4800;
  soft.gain.value = -6;
  const comp = audio.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  const master = audio.createGain();
  master.gain.value = 0.85;
  // The echo the size of a lane, darker on each return, so it lingers without ringing.
  const echo = audio.createDelay(0.6);
  echo.delayTime.value = 0.14;
  const dark = audio.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 3000;
  const feedback = audio.createGain();
  feedback.gain.value = 0.22;
  const wet = audio.createGain();
  wet.gain.value = 0.1;
  // The room: each sound sends some of itself, the far and the said more than the near and the struck.
  const air = audio.createGain();
  const room = audio.createConvolver();
  room.buffer = roomImpulse(sound.ground);
  const roomOut = audio.createGain();
  roomOut.gain.value = 0.5;
  input.connect(muffle).connect(thin).connect(soft).connect(comp).connect(master).connect(audio.destination);
  air.connect(room).connect(roomOut).connect(muffle);
  soft.connect(echo);
  echo.connect(dark).connect(feedback).connect(echo);
  dark.connect(wet).connect(comp);
  bus = { input, muffle, thin, air, room, roomOut, ground: sound.ground };
  return bus;
}

/** A new room when the ground changes: the field's air, or the city's walls. */
function regroundRoom() {
  if (!bus || bus.ground === sound.ground) return;
  const room = audio.createConvolver();
  room.buffer = roomImpulse(sound.ground);
  bus.air.connect(room).connect(bus.roomOut);
  bus.air.disconnect(bus.room);
  bus.room = room;
  bus.ground = sound.ground;
}

/** Where the carry is: the chapter's key, pulse and ground, and whether the mimes hold it. */
export function setSoundPlace({ chapter = 1, held = false } = {}) {
  sound.root = ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.pulse = PULSES[(chapter - 1) % PULSES.length] || 96;
  sound.minor = held;
  sound.ground = chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city';
  line.last = -9;
  setHarmony('.');
  try { regroundRoom(); } catch { /* the old room will do */ }
}

/** The room passing now, by its sigil: the chord the land sings while it passes. */
export function setSoundRoom(sigil) {
  if (!COLOURS[sigil] || sigil === harmony.sigil) return;
  setHarmony(sigil);
}

/** The land's pace and the mimes' hold, heard: muffled in slow time, thinner while they lead. */
export function setSoundMood({ muffled = false, thin = false } = {}) {
  if (!audio || !bus) return;
  const t = audio.currentTime;
  if (muffled !== sound.muffled) bus.muffle.frequency.setTargetAtTime(muffled ? 1300 : 16000, t, 0.12);
  if (thin !== sound.thin) bus.thin.frequency.setTargetAtTime(thin ? 420 : 30, t, 0.2);
  sound.muffled = muffled;
  sound.thin = thin;
}

/* ─── The ear ─────────────────────────────────────────────────────── */

/* How tired the ear is of each sound: one more each time it plays, halving every HALF_LIFE seconds.
 * The carry's own sounds tire it most (they come constantly); what the land gives, least. */
const HALF_LIFE = 1.2;
const TIRES = Object.freeze({ step: 1.3, land: 1, flour: 1, throw: 0.9, hop: 0.7, knock: 0.7, catch: 0.6, deft: 0.6, glass: 0.5, post: 0.5, ramp: 0.5, wap: 0.45 });
const heard = new Map();

/** Hear a sound: how tired the ear already is of it (null: it was just heard, this instant). */
function hear(kind, now) {
  const was = heard.get(kind);
  if (was && now - was.last < 0.03) return null;
  const heat = was ? was.heat * 0.5 ** ((now - was.last) / HALF_LIFE) : 0;
  heard.set(kind, { heat: heat + 1, last: now });
  return heat * (TIRES[kind] ?? 0.6);
}

/* How much of the room each sound takes: the struck and the near little, the said and the rung more. */
const AIR = Object.freeze({
  step: 0.03, land: 0.05, flour: 0.12, throw: 0.08, hop: 0.12, knock: 0.1, squash: 0.06, wap: 0.16,
  catch: 0.28, deft: 0.25, glass: 0.4, post: 0.32, ramp: 0.2, berry: 0.35, sweet: 0.4, share: 0.28,
  wonder: 0.45, bone: 0.18, foretell: 0.5, fulfil: 0.3, beaver: 0.25, foil: 0.25, egg: 0.6, spill: 0.3
});

/** Where one sound goes: a level and an edge that soften as the ear tires and with distance, then
 *  into the bus, and some of it into the room. Far off, less of a sound reaches you directly while
 *  the room stays about as loud, so the far is quieter, darker, and more room than sound. */
function outlet(heat, { depth = 0, air = 0 } = {}) {
  const b = ensureBus();
  const level = audio.createGain();
  level.gain.value = Math.max(0.45, 1 / (1 + 0.13 * heat)) * spread(0.12) * (1 - 0.6 * depth);
  const edge = audio.createBiquadFilter();
  edge.type = 'lowpass';
  edge.Q.value = 0;
  edge.frequency.value = Math.max(1800, (15000 / (1 + 0.3 * heat)) * (1 - 0.6 * depth));
  level.connect(edge).connect(b.input);
  const send = audio.createGain();
  send.gain.value = Math.min(1, (air + 0.1 * depth) / (1 - 0.6 * depth));
  edge.connect(send).connect(b.air);
  return level;
}

function noise() {
  if (noiseBuffer?.sampleRate === audio.sampleRate) return noiseBuffer;
  const n = audio.sampleRate * 2;
  noiseBuffer = audio.createBuffer(1, n, audio.sampleRate);
  const ch = noiseBuffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) ch[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/* A plucked string (Karplus–Strong), softened at the start, one buffer per pitch. */
const PLUCKS = new Map();
function pluckBuffer(f) {
  const key = `${audio.sampleRate}:${f.toFixed(1)}`;
  if (PLUCKS.has(key)) return PLUCKS.get(key);
  const sr = audio.sampleRate;
  const n = Math.floor(sr * 0.6);
  const p = Math.max(2, Math.round(sr / f));
  const ring = new Float32Array(p);
  for (let i = 0; i < p; i += 1) ring[i] = Math.random() * 2 - 1;
  for (let pass = 0; pass < 3; pass += 1) for (let i = 0; i < p; i += 1) ring[i] = (ring[i] + ring[(i + 1) % p]) * 0.5;
  const buf = audio.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  let idx = 0;
  let peak = 0;
  for (let i = 0; i < n; i += 1) {
    const next = (idx + 1) % p;
    const v = ring[idx];
    d[i] = v;
    peak = Math.max(peak, Math.abs(v));
    ring[idx] = 0.985 * 0.5 * (v + ring[next]);
    idx = next;
  }
  const fade = Math.floor(n * 0.2);
  for (let i = 0; i < n; i += 1) d[i] = (d[i] / (peak || 1)) * (i > n - fade ? (n - i) / fade : 1);
  PLUCKS.set(key, buf);
  return buf;
}

/** The instruments, for one sound starting at t, placed at pan and going out through out. Each
 *  voice can lean a little to one side of it (`side`), so a struck thing has width. */
function kit(out, t, pan = 0) {
  const places = new Map();
  const place = (side = 0) => {
    if (!audio.createStereoPanner) return out;
    const p = clamp(pan + side, -0.9, 0.9);
    const key = p.toFixed(2);
    if (!places.has(key)) {
      const node = audio.createStereoPanner();
      node.pan.value = p;
      node.connect(out);
      places.set(key, node);
    }
    return places.get(key);
  };
  const envelope = (at, attack, vol, dur) => {
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + Math.min(attack, dur * 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    return g;
  };
  // A voice. A square or a saw always goes through a filter: a reed, never a buzz.
  const tone = (type, f0, f1, dur, vol, delay = 0, { attack = 0.012, cents = 6, cut = 0, vibrato = 0, tremolo = 0, side = 0 } = {}) => {
    const at = t + delay;
    const osc = audio.createOscillator();
    osc.type = type;
    osc.detune.value = jitter(cents);
    osc.frequency.setValueAtTime(f0, at);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur);
    let node = osc;
    if (type === 'square' || type === 'sawtooth') {
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cut || Math.min(2400, f0 * 4);
      filter.Q.value = 3;
      node = node.connect(filter);
    }
    if (vibrato) {
      const lfo = audio.createOscillator();
      const depth = audio.createGain();
      lfo.frequency.value = 6.2;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(osc.detune);
      lfo.start(at);
      lfo.stop(at + dur + 0.05);
    }
    if (tremolo) {
      const swing = audio.createGain();
      swing.gain.value = 0.8;
      const lfo = audio.createOscillator();
      const depth = audio.createGain();
      lfo.frequency.value = tremolo;
      depth.gain.value = 0.2;
      lfo.connect(depth).connect(swing.gain);
      lfo.start(at);
      lfo.stop(at + dur + 0.05);
      node = node.connect(swing);
    }
    node.connect(envelope(at, attack, vol, dur)).connect(place(side));
    osc.start(at);
    osc.stop(at + dur + 0.05);
  };
  // Noise through a filter; with width, two noises a little apart, one either side.
  const hiss = (f0, f1, dur, vol, q = 1.8, delay = 0, type = 'bandpass', width = 0) => {
    const at = t + delay;
    const buf = noise();
    const sides = width ? [-width, width] : [0];
    sides.forEach((side) => {
      const src = audio.createBufferSource();
      src.buffer = buf;
      const flt = audio.createBiquadFilter();
      flt.type = type;
      flt.Q.value = type === 'lowpass' ? 0 : q;
      const k = spread(0.08);
      flt.frequency.setValueAtTime(f0 * k, at);
      flt.frequency.exponentialRampToValueAtTime(Math.max(60, f1 * k), at + dur);
      src.connect(flt).connect(envelope(at, 0.008, vol / Math.sqrt(sides.length), dur)).connect(place(side));
      src.start(at, Math.random() * (buf.duration - dur - 0.1), dur + 0.05);
    });
  };
  const pluck = (f, vol, delay = 0) => {
    const src = audio.createBufferSource();
    src.buffer = pluckBuffer(f);
    src.playbackRate.value = 2 ** (jitter(5) / 1200);
    const g = audio.createGain();
    g.gain.value = vol;
    src.connect(g).connect(place(0));
    src.start(t + delay);
  };
  const swell = (type, f, dur, vol, delay = 0) => tone(type, f, 0, dur, vol, delay, { attack: dur * 0.4, cents: 3 });
  // Celesta: a hammer on a steel bar over a box: the note, its octave and its twelfth, the higher dying the sooner.
  const celesta = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.005, cents: 4, side });
    tone('sine', f * 2.003, 0, dur * 0.45, vol * 0.22, delay, { attack: 0.004, cents: 4, side: side + 0.12 });
    tone('sine', f * 3.01, 0, dur * 0.22, vol * 0.07, delay, { attack: 0.003, cents: 4, side: side - 0.12 });
  };
  // Marimba: wood over a tube: the note, a bright partial two octaves up that dies at once, and the mallet.
  const marimba = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.003, cents: 4, side });
    tone('sine', f * 3.93, 0, Math.min(0.08, dur * 0.3), vol * 0.28, delay, { attack: 0.002, cents: 6, side: side + 0.1 });
    tone('sine', f * 9.2, 0, 0.025, vol * 0.05, delay, { attack: 0.001, side: side - 0.1 });
  };
  // Vibraphone: metal bars, a slow tremolo, ringing longer.
  const vibes = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.004, cents: 3, tremolo: 5.2, side });
    tone('sine', f * 4, 0, dur * 0.25, vol * 0.12, delay, { attack: 0.002, cents: 3, side: side + 0.15 });
  };
  // Kalimba: a tine under a thumb.
  const kalimba = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.003, cents: 4, side });
    tone('sine', f * 5.4, 0, 0.05, vol * 0.15, delay, { attack: 0.001, side });
  };
  // Music box: a comb's tooth, bright for an instant, then only the note.
  const musicBox = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.002, cents: 3, side });
    tone('sine', f * 4, 0, 0.1, vol * 0.25, delay, { attack: 0.001, side: side + 0.1 });
  };
  // The clown's honk: a kazoo, a reed through a nasal filter, scooping up into the note.
  const honk = (f, dur, vol, delay = 0, side = 0) => tone('sawtooth', f * 0.97, f * 1.02, dur, vol, delay, { attack: 0.012, cut: 1700, vibrato: 14, side });
  // Wood: a tock, its knock, and the click of the strike.
  const tock = (f0, f1, vol, delay = 0) => {
    tone('sine', f0, f1, 0.07, vol, delay, { attack: 0.002, cents: 25 });
    tone('sine', f0 * 2.25, 0, 0.03, vol * 0.3, delay, { attack: 0.002, cents: 25 });
    hiss(2500, 2300, 0.014, vol * 0.3, 3, delay);
  };
  return { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, honk, tock };
}

/* ─── The land joins in: a streak of good things brings the room's chord up under them ─── */

const pad = { voices: null, bass: null, out: null, tone: null, momentum: 0, at: 0, timer: 0 };
const PAD_VOICES = 4;
const WORTH = Object.freeze({ catch: 1, deft: 1, glass: 0.8, post: 0.8, ramp: 0.8, berry: 1, sweet: 1.2, share: 1.2, wonder: 1.5, bone: 0.8, wap: 1.4 });
/** The room's chord, close and low (under the key's root), in four voices. */
const padTones = () => Array.from({ length: PAD_VOICES }, (_, i) => harmony.pcs[i % harmony.pcs.length] + 12 * Math.floor(i / harmony.pcs.length) - 12);

function ensurePad() {
  if (pad.voices) return;
  const b = ensureBus();
  const out = audio.createGain();
  out.gain.value = 0.0001;
  const tone = audio.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = 0;
  tone.frequency.value = 700;
  tone.connect(out);
  out.connect(b.input);
  const send = audio.createGain();
  send.gain.value = 0.7;
  out.connect(send).connect(b.air);
  // Each voice twice, a few cents apart, one either side and wider as they go up.
  pad.voices = padTones().map((semi, i) => [-1, 1].map((side) => {
    const osc = audio.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz(semi);
    osc.detune.value = side * 7;
    const g = audio.createGain();
    g.gain.value = 1 / (PAD_VOICES * 2);
    let node = osc.connect(g);
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner();
      p.pan.value = side * (0.35 + 0.12 * i);
      node = node.connect(p);
    }
    node.connect(tone);
    osc.start();
    return osc;
  }));
  pad.bass = audio.createOscillator();
  pad.bass.frequency.value = hz(bassLow());
  const bassLevel = audio.createGain();
  bassLevel.gain.value = 0.3;
  pad.bass.connect(bassLevel).connect(out);
  pad.bass.start();
  pad.out = out;
  pad.tone = tone;
}

function retunePad() {
  if (!pad.voices || !audio) return;
  const now = audio.currentTime;
  padTones().forEach((semi, i) => pad.voices[i].forEach((osc) => osc.frequency.setTargetAtTime(hz(semi), now, 0.3)));
  pad.bass.frequency.setTargetAtTime(hz(bassLow()), now, 0.3);
}

const holdAt = (param, now) => {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
};

function swellPad(now, worth) {
  pad.momentum = pad.momentum * 0.5 ** ((now - pad.at) / 2.5) + worth;
  pad.at = now;
  if (pad.momentum < 2.5 && !pad.voices) return;
  ensurePad();
  const lift = clamp((pad.momentum - 2) / 8, 0, 1);
  holdAt(pad.out.gain, now);
  pad.out.gain.setTargetAtTime(0.0001 + 0.028 * lift, now, 0.5);
  pad.out.gain.setTargetAtTime(0.0001, now + 1.5, 1.4);
  pad.tone.frequency.setTargetAtTime(600 + 2000 * lift, now, 0.4);
  clearTimeout(pad.timer);
  pad.timer = setTimeout(stopPad, 9000);
}

/** A knock, or the spill, breaks the spell. */
function hushPad(now) {
  pad.momentum *= 0.3;
  pad.at = now;
  if (!pad.voices) return;
  holdAt(pad.out.gain, now);
  pad.out.gain.setTargetAtTime(0.0001, now, 0.15);
}

function stopPad() {
  if (!pad.voices) return;
  if (audio.currentTime - pad.at < 8) { pad.timer = setTimeout(stopPad, 3000); return; }
  pad.voices.flat().forEach((osc) => osc.stop());
  pad.bass.stop();
  pad.out.disconnect();
  pad.voices = null;
}

/* ─── The sounds ──────────────────────────────────────────────────── */

export function wapSound(combo = 1, pan = 0, depth = 0) {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.005;
    const heat = hear('wap', t);
    if (heat === null) return;
    const { tone, hiss, honk } = kit(outlet(heat, { depth, air: AIR.wap }), t, pan + jitter(0.04));
    // The W: a short drop in pitch, like a cheek meeting crust; under it, the room's bass.
    tone('triangle', 320, 70, 0.16, 0.4, 0, { attack: 0.006, cents: 60 });
    tone('sine', hz(bassLow()), hz(bassLow()) * 0.98, 0.32, 0.09, 0, { attack: 0.006, cents: 0 });
    tone('sine', hz(bassLow() - 12), 0, 0.28, 0.05, 0, { attack: 0.008, cents: 0 });
    // The AP: filling, everywhere — noise through a closing filter, wide, and a softer body under it.
    hiss(1800, 260, 0.22, 0.32, 1.4, 0, 'bandpass', 0.3);
    hiss(600, 150, 0.26, 0.12, 0.8, 0.02, 'lowpass');
    // And the clown's delight: two honks on the pulse, chord tones a step higher for each WAP in a combo.
    const step = clamp(combo - 1, 0, 4);
    const first = toPulse(t, 0.15);
    honk(hz(sungTone(2 + step)), 0.1, 0.09, first, -0.08);
    honk(hz(sungTone(3 + step)), 0.12, 0.1, first + sixteenth(), 0.08);
    swellPad(t, WORTH.wap);
  } catch { /* a silent WAP is still a WAP */ }
}

/** Tactile micro-sounds: steps, hops, bank shots, the berries' voices, knocks, and the Egg's hum. */
export function playTone(kind, param = 1, pan = 0, depth = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear(kind, t);
    if (heat === null) return;
    const { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, tock } = kit(outlet(heat, { depth, air: AIR[kind] ?? 0.2 }), t, pan + jitter(0.04));
    const answer = toPulse(t);
    const s32 = sixteenth() / 2;
    switch (kind) {
      // Footsteps know the ground: a brush of grass in the field, a tick of cobble in the city; left and right differ.
      case 'step':
        if (sound.ground === 'field') { hiss(1400 + (param > 0 ? 220 : 0), 650, 0.06, 0.045, 1.1); tone('sine', 118, 70, 0.05, 0.035, 0, { cents: 40 }); }
        else { tone('triangle', 150 + (param > 0 ? 14 : 0), 72, 0.04, 0.05, 0, { attack: 0.003, cents: 40 }); hiss(2800, 2000, 0.022, 0.024, 2.5); }
        break;
      // A catch: the line's next note on a celesta, answered on the pulse by the chord's next tone up.
      case 'catch': {
        const a = nextNote(t);
        celesta(hz(a), 0.18, 0.045);
        celesta(hz(sungFrom(a)), 0.26, 0.035, answer, 0.1);
        break;
      }
      // A hop is a plucked string; a chain climbs the room's chord, and the high hop sparkles.
      case 'hop': {
        const chain = clamp(Number(param) || 0, 0, 3);
        pluck(hz(sungTone(chain) - 12), 0.06);
        hiss(900, 2300, 0.09, 0.02, 1.4);
        if (chain >= 2) [3, 4, 5].forEach((i, k) => celesta(hz(sungTone(i) + 12), 0.22, 0.014, answer + k * s32, (k - 1) * 0.2));
        break;
      }
      // A landing: felt, and in the field a little flour.
      case 'land': tone('sine', 150, 68, 0.07, 0.04, 0, { attack: 0.004, cents: 40 }); if (sound.ground === 'field') hiss(800, 300, 0.08, 0.025, 0.7, 0, 'lowpass', 0.2); break;
      // A deft landing: the line leaps, on a marimba, and is answered a chord tone higher.
      case 'deft': { const a = nextNote(t, 2); marimba(hz(a), 0.3, 0.05); marimba(hz(sungFrom(sungFrom(a))), 0.36, 0.045, answer, 0.12); break; }
      case 'throw': hiss(820, 2100, 0.09, 0.09, 2, 0, 'bandpass', 0.1); tone('sine', 280, 420, 0.07, 0.04, 0, { cents: 30 }); break;
      // Bank shots: a pane of glass rings the line's note high, with a fifth; a bronze post its bar's odd partials.
      case 'glass': { const f = hz(nextNote(t) + 12); celesta(f, 0.5, 0.06); tone('sine', f * 1.5, 0, 0.3, 0.028, 0.025, { attack: 0.004, side: 0.2 }); break; }
      case 'post': {
        const f = hz(nextNote(t));
        tone('sine', f, 0, 0.4, 0.065, 0, { attack: 0.003 });
        tone('sine', f * 2.76, 0, 0.16, 0.03, 0, { attack: 0.002, side: -0.15 });
        tone('sine', f * 5.4, 0, 0.06, 0.012, 0, { attack: 0.002, side: 0.15 });
        break;
      }
      case 'ramp': { const a = nextNote(t, 2); tone('sine', hz(a - 5), hz(a), 0.13, 0.07); celesta(hz(a + 12), 0.2, 0.02, answer); break; }
      // A boonberry: the room's chord climbed as they come, on a vibraphone, and an airy glimpse after.
      case 'berry': {
        const i = 2 + (Number(param) || 0) % 6;
        vibes(hz(sungTone(i)), 0.4, 0.05);
        vibes(hz(sungTone(i + 1)), 0.5, 0.045, answer, 0.12);
        hiss(5200, 7800, 0.18, 0.018, 4, answer, 'bandpass', 0.3);
        line.at = sungTone(i + 1);
        line.last = t;
        break;
      }
      case 'sweet': [0, 1, 2, 3].forEach((k) => vibes(hz(sungTone(k + 3)), 0.5, 0.04, k * s32, (k - 1.5) * 0.15)); break;
      // A boneberry: low and woody, like a mallet on a bowl, savoury rather than sweet.
      case 'bone':
        marimba(hz(bassLow()), 0.3, 0.13);
        marimba(hz(sungTone(1) - 12), 0.22, 0.06, answer);
        hiss(2600, 1800, 0.02, 0.04, 3);
        break;
      // A baneberry squashed: a wet pop, and nothing said.
      case 'squash': tone('sine', 150, 55, 0.09, 0.12, 0, { cents: 40 }); hiss(380, 120, 0.09, 0.05, 0.8, 0, 'lowpass'); break;
      // A baneberry foretelling: the room's bass and a semitone over it, swelling, and a whisper under them.
      case 'foretell': swell('triangle', hz(bassLow()), 0.9, 0.05); swell('triangle', hz(bassLow() + 1), 0.9, 0.04, 0.05); hiss(900, 700, 0.7, 0.022, 6, 0, 'bandpass', 0.4); break;
      // ... and as it comes: a fall, low, out of key.
      case 'fulfil': tone('sawtooth', hz(bassLow() + 1), hz(bassLow() - 1), 0.32, 0.07, 0, { cut: 900 }); tone('sine', 90, 55, 0.25, 0.09); hushPad(t); break;
      // A slow beaver: two wooden tocks, unhurried.
      case 'beaver': tock(520, 380, 0.12); tock(470, 340, 0.1, 0.32); break;
      // A share: two kalimbas, one either side, a chord's tones apart, together.
      case 'share': { const a = nextNote(t); kalimba(hz(a), 0.3, 0.05, 0, -0.25); kalimba(hz(sungFrom(a, -1)), 0.3, 0.045, 0.012, 0.25); break; }
      case 'flour': hiss(640, 170, 0.18, 0.085, 0.8, 0, 'bandpass', 0.25); break;
      // A wonder: a music box playing the room's chord, its shape by kind.
      case 'wonder': {
        const shape = param === 'contrivance' ? [0, 1, 2, 3] : param === 'bracework' ? [0, 2, 1, 3] : param === 'saying' ? [3, 2, 1, 0] : [0, 1, 3, 2];
        shape.forEach((i, k) => musicBox(hz(sungTone(i + 3)), k === shape.length - 1 ? 0.7 : 0.35, 0.042, k * s32, (k - 1.5) * 0.12));
        break;
      }
      // A knock: a thud with a little grit in it, out of key on purpose, never twice at the same pitch; it breaks the spell.
      case 'knock':
        tone('sine', 95, 48, 0.2, 0.1, 0, { attack: 0.003, cents: 80 });
        hiss(420, 140, 0.12, 0.09, 1.2);
        tone('sawtooth', 185, 70, 0.1, 0.07, 0, { attack: 0.003, cents: 80, cut: 700 });
        hushPad(t);
        break;
      // A scheme foiled: Mr. BaneWAP's plans going down, then the line coming back up on the pulse.
      case 'foil': { tone('square', 520, 180, 0.2, 0.07, 0, { cut: 1200 }); const a = nextNote(t); celesta(hz(a), 0.2, 0.05, answer); celesta(hz(sungFrom(a)), 0.3, 0.045, answer + sixteenth(), 0.1); break; }
      // The Egg: a hum belonging to no chapter's key.
      case 'egg': tone('sine', 130.8, 131.2, 0.5, 0.1, 0, { attack: 0.08, cents: 0, side: -0.15 }); tone('sine', 196, 196.5, 0.5, 0.07, 0.03, { attack: 0.08, cents: 0, side: 0.15 }); break;
      // The spill: the fall, then home — five, three, one, softly, on the pulse. Exactly one; the prophecy holds.
      case 'spill': {
        tone('triangle', 280, 65, 0.34, 0.17);
        hiss(1100, 160, 0.3, 0.15, 1.2, 0, 'bandpass', 0.3);
        tone('sine', 70, 40, 0.3, 0.1);
        hushPad(t);
        const home = toPulse(t, 0.4);
        (sound.minor ? [7, 3, 0] : [7, 4, 0]).forEach((semi, k) => celesta(hz(semi), k === 2 ? 1.1 : 0.5, 0.04, home + k * sixteenth() * 2, (1 - k) * 0.15));
        break;
      }
      default: break;
    }
    if (WORTH[kind]) swellPad(t, WORTH[kind]);
  } catch { /* silent play still counts */ }
}
