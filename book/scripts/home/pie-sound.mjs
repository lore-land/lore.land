/**
 * pie-sound.mjs — the lanes, heard: WAP and the tactile notes of the carry, synthesized; no files.
 *
 * One bus for every sound: a soft top, a compressor, and a short echo the size of a lane that
 * darkens as it returns. Every sound is panned to where it happened. Things the land gives play
 * in the chapter's own key, a pentatonic that climbs as they come (a minor one while the mimes
 * hold the chapter); knocks are out of key, on purpose. While the land runs at a beaver's pace
 * the bus is muffled, as if heard through slow time; while the mimes lead, it thins, the way it
 * is harder to wonder about pie. Footsteps know the ground: grass in the field, cobbles in the city.
 *
 * Made to be heard the hundredth time, since a carry is hundreds of steps, catches and knocks:
 *   never twice the same   each sound is nudged a little in pitch, level, colour and place, and
 *                          its noise is read from a different part of one shared buffer
 *   an ear that tires      a sound repeated quickly comes back quieter and softer-edged, the way
 *                          an ear stops minding what it keeps hearing, and recovers in a breath
 *   once in an instant     the same sound twice at the same moment plays once
 *   tunes, not blips       what answers the carry walks the key as it repeats (catches, bank
 *                          shots, deft landings, hops in a chain, WAPs in a combo) and starts
 *                          over after a rest
 *   soft edges             no bare square or saw: each goes through a filter, as a reed or a
 *                          kazoo; struck things are a few partials, the higher dying the sooner;
 *                          a hop is a plucked string, softened at the start (a thumb, not a pick)
 */

let audio = null;
let bus = null;
let noiseBuffer = null;
const sound = { root: 293.66, minor: false, ground: 'field', muffled: false, thin: false };
const ROOTS = [293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23];
const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const spread = (amount) => 1 + (Math.random() * 2 - 1) * amount;
const jitter = (amount) => (Math.random() * 2 - 1) * amount;

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
  wet.gain.value = 0.13;
  input.connect(muffle).connect(thin).connect(soft).connect(comp).connect(master).connect(audio.destination);
  soft.connect(echo);
  echo.connect(dark).connect(feedback).connect(echo);
  dark.connect(wet).connect(comp);
  bus = { input, muffle, thin };
  return bus;
}

/** Where the carry is: the chapter's key and ground, and whether the mimes hold it. */
export function setSoundPlace({ chapter = 1, held = false } = {}) {
  sound.root = ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.minor = held;
  sound.ground = chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city';
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

/** A degree of the chapter's pentatonic, in octaves from its root. */
const note = (degree, octave = 0) => {
  const scale = sound.minor ? MINOR : MAJOR;
  const d = Math.max(0, Math.round(degree));
  return sound.root * 2 ** (octave + Math.floor(d / 5) + scale[d % 5] / 12);
};

/* ─── The ear ─────────────────────────────────────────────────────── */

/* How tired the ear is of each sound: one more each time it plays, halving every HALF_LIFE seconds.
 * The carry's own sounds tire it most (they come constantly); what the land gives, least. */
const HALF_LIFE = 1.2;
const TIRES = Object.freeze({ step: 1.3, land: 1, flour: 1, throw: 0.9, hop: 0.7, knock: 0.7, catch: 0.6, deft: 0.6, glass: 0.5, post: 0.5, ramp: 0.5, wap: 0.45 });
const heard = new Map();

/** Hear a sound: how tired the ear already is of it, and how far into a phrase of repeats it is. */
function hear(kind, now) {
  const was = heard.get(kind);
  if (was && now - was.last < 0.03) return null;
  const heat = was ? was.heat * 0.5 ** ((now - was.last) / HALF_LIFE) : 0;
  const phrase = was && heat > 0.4 ? was.phrase + 1 : 0;
  heard.set(kind, { heat: heat + 1, last: now, phrase });
  return { heat: heat * (TIRES[kind] ?? 0.6), phrase };
}

/** Where one sound goes: a level and an edge that soften as the ear tires, then its place. */
function outlet(pan, heat) {
  const level = audio.createGain();
  level.gain.value = Math.max(0.45, 1 / (1 + 0.13 * heat)) * spread(0.12);
  const edge = audio.createBiquadFilter();
  edge.type = 'lowpass';
  edge.Q.value = 0;
  edge.frequency.value = Math.max(2400, 15000 / (1 + 0.3 * heat));
  let node = level.connect(edge);
  if (audio.createStereoPanner) {
    const panner = audio.createStereoPanner();
    panner.pan.value = clamp(pan + jitter(0.04), -0.8, 0.8);
    node = node.connect(panner);
  }
  node.connect(ensureBus().input);
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

/** The instruments, for one sound starting at t and going out through out. */
function kit(out, t) {
  const envelope = (at, attack, vol, dur) => {
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + Math.min(attack, dur * 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    return g;
  };
  // A voice. A square or a saw always goes through a filter: a reed, never a buzz.
  const tone = (type, f0, f1, dur, vol, delay = 0, { attack = 0.012, cents = 6, cut = 0, vibrato = 0 } = {}) => {
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
    node.connect(envelope(at, attack, vol, dur)).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  };
  // Struck and tuned: the note, its octave and its twelfth, the higher dying the sooner.
  const chime = (f, dur, vol, delay = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.005, cents: 5 });
    tone('sine', f * 2.003, 0, dur * 0.45, vol * 0.22, delay, { attack: 0.004, cents: 5 });
    tone('sine', f * 3.01, 0, dur * 0.22, vol * 0.07, delay, { attack: 0.003, cents: 5 });
  };
  // A slow swell, for things that are said rather than struck.
  const swell = (type, f, dur, vol, delay = 0) => tone(type, f, 0, dur, vol, delay, { attack: dur * 0.4, cents: 3 });
  const hiss = (f0, f1, dur, vol, q = 1.8, delay = 0, type = 'bandpass') => {
    const at = t + delay;
    const buf = noise();
    const src = audio.createBufferSource();
    src.buffer = buf;
    const flt = audio.createBiquadFilter();
    flt.type = type;
    flt.Q.value = type === 'lowpass' ? 0 : q;
    const k = spread(0.08);
    flt.frequency.setValueAtTime(f0 * k, at);
    flt.frequency.exponentialRampToValueAtTime(Math.max(60, f1 * k), at + dur);
    src.connect(flt).connect(envelope(at, 0.008, vol, dur)).connect(out);
    src.start(at, Math.random() * (buf.duration - dur - 0.1), dur + 0.05);
  };
  const pluck = (f, vol, delay = 0) => {
    const at = t + delay;
    const src = audio.createBufferSource();
    src.buffer = pluckBuffer(f);
    src.playbackRate.value = 2 ** (jitter(5) / 1200);
    const g = audio.createGain();
    g.gain.value = vol;
    src.connect(g).connect(out);
    src.start(at);
  };
  // The clown's honk: a kazoo, a reed through a nasal filter, scooping up into the note.
  const honk = (f, dur, vol, delay = 0) => tone('sawtooth', f * 0.97, f * 1.02, dur, vol, delay, { attack: 0.012, cut: 1700, vibrato: 14 });
  // Wood: a tock, its knock, and the click of the strike.
  const tock = (f0, f1, vol, delay = 0) => {
    tone('sine', f0, f1, 0.07, vol, delay, { attack: 0.002, cents: 25 });
    tone('sine', f0 * 2.25, 0, 0.03, vol * 0.3, delay, { attack: 0.002, cents: 25 });
    hiss(2500, 2300, 0.014, vol * 0.3, 3, delay);
  };
  return { tone, chime, swell, hiss, pluck, honk, tock };
}

/* ─── The sounds ──────────────────────────────────────────────────── */

export function wapSound(combo = 1, pan = 0) {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.005;
    const ear = hear('wap', t);
    if (!ear) return;
    const { tone, hiss, honk } = kit(outlet(pan, ear.heat), t);
    // The W: a short drop in pitch, like a cheek meeting crust.
    tone('triangle', 320, 70, 0.16, 0.42, 0, { attack: 0.006, cents: 60 });
    // The AP: filling, everywhere — noise through a closing filter, and a softer body under it.
    hiss(1800, 260, 0.22, 0.32, 1.4);
    hiss(600, 150, 0.26, 0.12, 0.8, 0.02, 'lowpass');
    // And the clown's delight: two honks in the chapter's key, a step higher for each WAP in a combo.
    const step = clamp(combo - 1, 0, 5);
    honk(note(3 + step), 0.1, 0.09, 0.2);
    honk(note(5 + step), 0.12, 0.1, 0.33);
  } catch { /* a silent WAP is still a WAP */ }
}

/** Tactile micro-sounds: steps, hops, bank shots, the berries' voices, knocks, and the Egg's hum. */
export function playTone(kind, param = 1, pan = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const ear = hear(kind, t);
    if (!ear) return;
    const { tone, chime, swell, hiss, pluck, tock } = kit(outlet(pan, ear.heat), t);
    const { phrase } = ear;
    switch (kind) {
      // Footsteps know the ground: a brush of grass in the field, a tick of cobble in the city; left and right differ.
      case 'step':
        if (sound.ground === 'field') { hiss(1400 + (param > 0 ? 220 : 0), 650, 0.06, 0.045, 1.1); tone('sine', 118, 70, 0.05, 0.035, 0, { cents: 40 }); }
        else { tone('triangle', 150 + (param > 0 ? 14 : 0), 72, 0.04, 0.05, 0, { attack: 0.003, cents: 40 }); hiss(2800, 2000, 0.022, 0.024, 2.5); }
        break;
      // A catch: two notes up, starting a step further along the key each time in a phrase.
      case 'catch': {
        const d = [2, 3, 4, 3, 5, 4, 6, 5][phrase % 8];
        chime(note(d), 0.18, 0.045);
        chime(note(d + 2), 0.26, 0.035, 0.045);
        break;
      }
      // A hop is a plucked string; a chain climbs it, root, third, fifth, and the high hop sparkles.
      case 'hop': {
        const chain = clamp(Number(param) || 0, 0, 3);
        pluck(note([0, 2, 4, 5][chain], -1), 0.06);
        hiss(900, 2300, 0.09, 0.02, 1.4);
        if (chain >= 2) [4, 5, 7].forEach((d, i) => chime(note(d, 1), 0.22, 0.014, 0.04 + i * 0.04));
        break;
      }
      // A landing: felt, and in the field a little flour.
      case 'land': tone('sine', 150, 68, 0.07, 0.04, 0, { attack: 0.004, cents: 40 }); if (sound.ground === 'field') hiss(800, 300, 0.08, 0.025, 0.7, 0, 'lowpass'); break;
      case 'deft': { const d = 4 + (phrase % 3); chime(note(d), 0.2, 0.05); chime(note(d + 2), 0.3, 0.045, 0.05); break; }
      case 'throw': hiss(820, 2100, 0.09, 0.09, 2); tone('sine', 280, 420, 0.07, 0.04, 0, { cents: 30 }); break;
      // Bank shots are in key now, and walk it: a pane of glass rings a fifth, a bronze post a bar's odd partials.
      case 'glass': { const f = note([5, 6, 7, 8][phrase % 4], 1); chime(f, 0.5, 0.06); tone('sine', f * 1.5, 0, 0.3, 0.028, 0.025, { attack: 0.004 }); break; }
      case 'post': {
        const f = note([2, 3, 4][phrase % 3]);
        tone('sine', f, 0, 0.4, 0.065, 0, { attack: 0.003 });
        tone('sine', f * 2.76, 0, 0.16, 0.03, 0, { attack: 0.002 });
        tone('sine', f * 5.4, 0, 0.06, 0.012, 0, { attack: 0.002 });
        break;
      }
      case 'ramp': tone('sine', note(0), note(3), 0.13, 0.07); chime(note(3, 1), 0.2, 0.02, 0.12); break;
      // A boonberry: two notes that climb the key as they come, and an airy glimpse after.
      case 'berry': {
        const d = 2 + (Number(param) || 0) % 6;
        chime(note(d), 0.22, 0.05);
        chime(note(d + 2), 0.3, 0.045, 0.06);
        hiss(5200, 7800, 0.18, 0.018, 4, 0.08);
        break;
      }
      case 'sweet': [0, 2, 4, 5].forEach((d, i) => chime(note(d, 1), 0.3, 0.04, i * 0.05)); break;
      // A boneberry: low and woody, like a mallet on a bowl, savoury rather than sweet.
      case 'bone':
        tone('sine', note(0, -1), note(0, -1) * 0.97, 0.26, 0.14, 0, { attack: 0.004 });
        tone('sine', note(0, -1) * 4, 0, 0.05, 0.025, 0, { attack: 0.002 });
        tone('sine', note(3, -1), note(3, -1) * 0.98, 0.2, 0.07, 0.07, { attack: 0.004 });
        hiss(2600, 1800, 0.02, 0.04, 3);
        break;
      // A baneberry squashed: a wet pop, and nothing said.
      case 'squash': tone('sine', 150, 55, 0.09, 0.12, 0, { cents: 40 }); hiss(380, 120, 0.09, 0.05, 0.8, 0, 'lowpass'); break;
      // A baneberry foretelling: two notes a semitone apart, swelling, and a whisper under them.
      case 'foretell': swell('triangle', note(0, -1), 0.9, 0.05); swell('triangle', note(0, -1) * 1.0595, 0.9, 0.04, 0.05); hiss(900, 700, 0.7, 0.022, 6); break;
      // ... and as it comes: a fall, low, out of key.
      case 'fulfil': tone('sawtooth', note(2, -1) * 1.0595, note(0, -1) * 0.94, 0.32, 0.07, 0, { cut: 900 }); tone('sine', 90, 55, 0.25, 0.09); break;
      // A slow beaver: two wooden tocks, unhurried.
      case 'beaver': tock(520, 380, 0.12); tock(470, 340, 0.1, 0.32); break;
      case 'share': chime(note(3), 0.22, 0.05); chime(note(5), 0.28, 0.05, 0.05); break;
      case 'flour': hiss(640, 170, 0.18, 0.1, 0.8); break;
      // A wonder: an arpeggio in the chapter's key, its shape by kind.
      case 'wonder': {
        const shape = param === 'contrivance' ? [0, 2, 4, 5] : param === 'bracework' ? [0, 3, 5, 8] : param === 'saying' ? [4, 2, 0, 5] : [0, 2, 3, 5];
        shape.forEach((d, i) => chime(note(d, 1), i === shape.length - 1 ? 0.5 : 0.28, 0.042, i * 0.05));
        break;
      }
      // A knock: a thud with a little grit in it, out of key on purpose, never twice at the same pitch.
      case 'knock':
        tone('sine', 95, 48, 0.2, 0.1, 0, { attack: 0.003, cents: 80 });
        hiss(420, 140, 0.12, 0.09, 1.2);
        tone('sawtooth', 185, 70, 0.1, 0.07, 0, { attack: 0.003, cents: 80, cut: 700 });
        break;
      // A scheme foiled: Mr. BaneWAP's plans going down, then the key coming back up.
      case 'foil': tone('square', 520, 180, 0.2, 0.07, 0, { cut: 1200 }); chime(note(4), 0.2, 0.05, 0.08); chime(note(6), 0.3, 0.045, 0.14); break;
      // The Egg: a hum belonging to no chapter's key.
      case 'egg': tone('sine', 130.8, 131.2, 0.5, 0.1, 0, { attack: 0.08, cents: 0 }); tone('sine', 196, 196.5, 0.5, 0.07, 0.03, { attack: 0.08, cents: 0 }); break;
      case 'spill': tone('triangle', 280, 65, 0.34, 0.17); hiss(1100, 160, 0.3, 0.15, 1.2); tone('sine', 70, 40, 0.3, 0.1); break;
      default: break;
    }
  } catch { /* silent play still counts */ }
}
