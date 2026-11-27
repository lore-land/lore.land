/**
 * pie/audio/synth-kit.mjs — Web Audio synthesis primitives: impulse generator, shared noise,
 * Karplus-Strong plucked strings, the voice kit (celesta, marimba, vibes, kalimba, musicBox,
 * honk, tock, uprightBass, ride, hihatChick, sample), and ambient noise beds.
 *
 * Extracted from pie-sound.mjs so instrument recipes and spatial node wiring stay clean and reusable.
 */

import { acousticPositionPlan } from '../../../modules/audio-model.mjs';
import { ROOMS, COLOUR_FALL } from './scored-plans.mjs';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const spread = (amount) => 1 + (Math.random() * 2 - 1) * amount;
const jitter = (amount) => (Math.random() * 2 - 1) * amount;

export const holdAt = (param, now) => {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
};

/** Generate a stereo room impulse buffer from a ground name or bounded roomPlan. */
export function createRoomImpulse(audio, ground, plan = null) {
  const sr = audio.sampleRate;
  const p = plan || ROOMS[ground === 'field' ? 'field' : 'city'];
  const secs = p.secs;
  const n = Math.floor(sr * secs);
  const ir = audio.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c += 1) {
    const d = ir.getChannelData(c);
    let lp = 0;
    let power = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / sr;
      const darken = Math.min(1, t / secs);
      lp += (p.bright - p.darken * darken) * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t * p.decay) * Math.min(1, t / p.onset);
      power += d[i] * d[i];
    }
    const weight = p.weighed ? Math.sqrt(power) : 1;
    p.early.forEach(([at, g], k) => {
      const i = Math.floor((at + (k % 2 === c ? 0 : 0.0011)) * sr);
      if (i < n) d[i] += g * weight * (k % 2 === c ? 1 : 0.55);
    });
  }
  return ir;
}

/** Create shared noise + Karplus-Strong pluck caches bound to an AudioContext getter. */
export function createBufferBank(getAudio) {
  let noiseBuffer = null;
  const plucks = new Map();

  function noise() {
    const audio = getAudio();
    if (noiseBuffer?.sampleRate === audio.sampleRate) return noiseBuffer;
    const n = audio.sampleRate * 2;
    noiseBuffer = audio.createBuffer(1, n, audio.sampleRate);
    const ch = noiseBuffer.getChannelData(0);
    for (let i = 0; i < n; i += 1) ch[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }

  function pluckBuffer(f) {
    const audio = getAudio();
    const key = `${audio.sampleRate}:${f.toFixed(1)}`;
    if (plucks.has(key)) return plucks.get(key);
    const sr = audio.sampleRate;
    const n = Math.floor(sr * 0.6);
    const p = Math.max(2, Math.round(sr / f));
    const ring = new Float32Array(p);
    for (let i = 0; i < p; i += 1) ring[i] = Math.random() * 2 - 1;
    for (let pass = 0; pass < 3; pass += 1) {
      for (let i = 0; i < p; i += 1) ring[i] = (ring[i] + ring[(i + 1) % p]) * 0.5;
    }
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
    plucks.set(key, buf);
    return buf;
  }

  return { noise, pluckBuffer };
}

/**
 * Build the voice kit for one sound starting at `t`, placed at `pan`, routed through `out`.
 * Uses HRTF PannerNode when the outlet plan requests spatial distance, else StereoPanner.
 */
export function createSynthKit({ audio, out, t, pan = 0, outletAcoustics, noise, pluckBuffer, pickSample }) {
  const places = new Map();
  const place = (side = 0) => {
    const p = clamp(pan + side, -0.9, 0.9);
    const key = p.toFixed(2);
    if (!places.has(key)) {
      const acoustic = outletAcoustics.get(out);
      if (acoustic?.spatial) {
        const node = audio.createPanner();
        node.panningModel = acoustic.panningModel;
        node.distanceModel = acoustic.distanceModel;
        node.refDistance = acoustic.refDistance;
        node.maxDistance = acoustic.maxDistance;
        node.rolloffFactor = acoustic.rolloffFactor;
        const position = acousticPositionPlan(acoustic, p);
        if (node.positionX && node.positionY && node.positionZ) {
          node.positionX.value = position.x;
          node.positionY.value = position.y;
          node.positionZ.value = position.z;
        } else node.setPosition(position.x, position.y, position.z);
        node.connect(out);
        places.set(key, node);
        return node;
      }
      if (!audio.createStereoPanner) return out;
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

  const celesta = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.005, cents: 4, side });
    tone('sine', f * 2.003, 0, dur * 0.45, vol * 0.22, delay, { attack: 0.004, cents: 4, side: side + 0.12 });
    tone('sine', f * 3.01, 0, dur * 0.22, vol * 0.07, delay, { attack: 0.003, cents: 4, side: side - 0.12 });
  };

  const marimba = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.003, cents: 4, side });
    tone('sine', f * 3.93, 0, Math.min(0.08, dur * 0.3), vol * 0.28, delay, { attack: 0.002, cents: 6, side: side + 0.1 });
    tone('sine', f * 9.2, 0, 0.025, vol * 0.05, delay, { attack: 0.001, side: side - 0.1 });
  };

  const vibes = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.004, cents: 3, tremolo: 5.2, side });
    tone('sine', f * 4, 0, dur * 0.25, vol * 0.12, delay, { attack: 0.002, cents: 3, side: side + 0.15 });
  };

  const kalimba = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.003, cents: 4, side });
    tone('sine', f * 5.4, 0, 0.05, vol * 0.15, delay, { attack: 0.001, side });
  };

  const musicBox = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.002, cents: 3, side });
    tone('sine', f * 4, 0, 0.1, vol * 0.25, delay, { attack: 0.001, side: side + 0.1 });
  };

  const honk = (f, dur, vol, delay = 0, side = 0) => tone('sawtooth', f * 0.97, f * 1.02, dur, vol, delay, { attack: 0.012, cut: 1700, vibrato: 14, side });

  const tock = (f0, f1, vol, delay = 0) => {
    tone('sine', f0, f1, 0.07, vol, delay, { attack: 0.002, cents: 25 });
    tone('sine', f0 * 2.25, 0, 0.03, vol * 0.3, delay, { attack: 0.002, cents: 25 });
    hiss(2500, 2300, 0.014, vol * 0.3, 3, delay);
  };

  const uprightBass = (f, dur, vol, delay = 0, side = 0) => {
    tone('triangle', f * 0.992, f, dur, vol, delay, { attack: 0.008, cents: 3, side });
    tone('sine', f, 0, dur * 1.12, vol * 0.65, delay, { attack: 0.012, cents: 2, side });
    hiss(1100, 420, 0.022, vol * 0.16, 1.4, delay, 'bandpass', 0.06);
  };

  const ride = (vol, delay = 0, { accent = false, skip = false, side = 0.14 } = {}) => {
    const dur = skip ? 0.042 : accent ? 0.085 : 0.062;
    hiss(accent ? 8200 : 7600, skip ? 5600 : 5100, dur, vol, skip ? 2.8 : 2.2, delay, 'bandpass', 0.18);
    tone('sine', accent ? 3180 : 3020, 0, dur * 0.7, vol * (skip ? 0.14 : 0.22), delay, { attack: 0.002, cents: 14, side });
    tone('sine', accent ? 4680 : 4440, 0, dur * 0.45, vol * (skip ? 0.08 : 0.12), delay, { attack: 0.002, cents: 18, side: -side });
  };

  const hihatChick = (vol, delay = 0) => {
    hiss(7400, 6200, 0.028, vol, 2.6, delay, 'highpass', 0.12);
  };

  const sample = (event, gain = 1, delay = 0, shape = null) => {
    const picked = pickSample(event);
    if (!picked) return false;
    const heard = shape || picked.shape;
    const src = audio.createBufferSource();
    src.buffer = picked.buf;
    src.playbackRate.value = 2 ** (jitter(20) / 1200);
    const g = audio.createGain();
    g.gain.value = picked.gain * gain * spread(0.05);
    src.connect(g);
    if (heard) {
      const flt = audio.createBiquadFilter();
      flt.type = heard.type;
      flt.frequency.value = heard.freq;
      flt.Q.value = heard.q ?? 0.7;
      g.connect(flt).connect(place(0));
    } else g.connect(place(0));
    src.start(t + delay);
    return true;
  };

  return { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, honk, tock, uprightBass, ride, hihatChick, sample };
}

const BED_AIR = 0.35;
const BED_IN = 0.6;
const BED_OUT = 0.3;
const BAND_SWAY = 900;

/** Start a gentle filtered stereo ambience bed wired into the shared bus. */
export function startAmbienceBed(audio, bus, noise, plan) {
  const now = audio.currentTime;
  const [lo, hi] = plan.band;
  const mid = Math.sqrt(lo * hi);
  const { rate, depth } = plan.flutter;
  const fade = audio.createGain();
  fade.gain.setValueAtTime(0, now);
  fade.gain.setTargetAtTime(1, now, BED_IN);
  const sway = audio.createGain();
  sway.gain.value = plan.level * (1 - depth / 2);
  sway.connect(fade);
  fade.connect(bus.input);
  const send = audio.createGain();
  send.gain.value = BED_AIR;
  fade.connect(send).connect(bus.air);
  const buf = noise();
  const fall = Math.max(-18, (COLOUR_FALL[plan.colour] || 0) * Math.log2(hi / lo));
  const bands = [];
  const running = [];
  [-1, 1].forEach((side, i) => {
    const src = audio.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.playbackRate.value = i ? 0.871 : 1;
    let node = src;
    if (fall) {
      const shelf = audio.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = mid;
      shelf.gain.value = fall;
      node = node.connect(shelf);
    }
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = mid;
    band.Q.value = mid / (hi - lo);
    node = node.connect(band);
    const half = audio.createGain();
    half.gain.value = audio.createStereoPanner ? Math.SQRT1_2 : 0.5;
    node = node.connect(half);
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner();
      p.pan.value = side * 0.6;
      node = node.connect(p);
    }
    node.connect(sway);
    src.start(now, Math.random() * (buf.duration - 0.1));
    bands.push(band);
    running.push(src);
  });
  [[1, 0.6], [1.618, 0.4]].forEach(([times, share]) => {
    const lfo = audio.createOscillator();
    lfo.frequency.value = rate * times;
    const toLevel = audio.createGain();
    toLevel.gain.value = share * plan.level * depth / 2;
    lfo.connect(toLevel).connect(sway.gain);
    const toBand = audio.createGain();
    toBand.gain.value = share * depth * BAND_SWAY;
    lfo.connect(toBand);
    bands.forEach((band) => { if (band.detune) toBand.connect(band.detune); });
    lfo.start(now);
    running.push(lfo);
  });
  return { plan, fade, running };
}

/** Fade out and release an active ambience bed. */
export function stopAmbienceBed(audio, bed) {
  const now = audio.currentTime;
  holdAt(bed.fade.gain, now);
  bed.fade.gain.setTargetAtTime(0, now, BED_OUT);
  setTimeout(() => {
    bed.running.forEach((node) => { try { node.stop(); } catch { /* already still */ } });
    try { bed.fade.disconnect(); } catch { /* already gone */ }
  }, BED_OUT * 8 * 1000);
}
