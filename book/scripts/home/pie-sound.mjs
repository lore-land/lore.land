/**
 * pie-sound.mjs — the lanes, heard: Web Audio orchestration over pure musical/acoustic plans.
 *
 * Pure plans live in sibling modules under `./pie/audio/` and are re-exported here so callers
 * and `npm run sound:check` keep one stable entry point:
 *   - `./pie/audio/harmony.mjs`      chapter keys, room sigil colours, LEVEL_CELLS, chapterArcPlan, foreshadowPlan, harmonicBridgePlan
 *   - `./pie/audio/jazz.mjs`         JAZZ_STYLES, JAZZ_LEANS, inflectGesture, compVoicingPlan, walkingBassPlan, densityDuckFactor, jazzPhrasePlan, beatPocketPlan
 *   - `./pie/audio/story-plans.mjs`  TEXTURES, boardStepPlan, trickPlan, powerStoryPlan, obstacleStoryPlan, wonderSyntaxPlan, easterEggPlan, themeFlourishPlan, composePhraseVariation
 *   - `./pie/audio/scored-plans.mjs` roomPlan, shelfColorParams, stingPlan, admitSting, motifPlan, cadencePlan, ambiencePlan, placePlan, materialPlan
 *   - `./pie/audio/synth-kit.mjs`    Web Audio impulse generator, shared noise/pluck bank, voice kit, and ambience beds
 */

import { acousticEffectPlan, acousticPositionPlan, motifMemoryPlan } from '../modules/audio-model.mjs';
import { soften, takeSense } from './pie/tune/personality.mjs';
import {
  ROOTS, PULSES, MAJOR, MINOR, JAZZ_MAJOR, DORIAN, OPEN, COLOURS, JAZZ, FALLS, RAISES,
  colourPlan, LEVEL_CELLS, debtPc, offDebt, foreshadowDegree, foreshadowPlan, chapterArcPlan, harmonicBridgePlan
} from './pie/audio/harmony.mjs';
import {
  JAZZ_STYLES, JAZZ_LEANS, registerJazzStyle, registerJazzLean, jazzStyleFor,
  inflectGesture, compVoicingPlan, walkingBassPlan, densityDuckFactor, jazzPhrasePlan, beatPocketPlan
} from './pie/audio/jazz.mjs';
import {
  TEXTURES, boardStepPlan, trickPlan, powerStoryPlan, obstacleStoryPlan,
  wonderSyntaxPlan, easterEggPlan, themeFlourishPlan, composePhraseVariation,
  registerWonderSyntax, registerThemeFlourish
} from './pie/audio/story-plans.mjs';
import {
  roomPlan, SCORED_SHELVES, NEUTRAL_SHELF, shelfColorParams, STINGS, stingPlan, STING_GAP, admitSting,
  TROPE_STAGES, tropeShape, motifPlan, cadencePlan, ambiencePlan, placePlan, materialPlan,
  registerMaterialSound, registerAmbience
} from './pie/audio/scored-plans.mjs';
import {
  holdAt, createRoomImpulse, createBufferBank, createSynthKit, startAmbienceBed, stopAmbienceBed
} from './pie/audio/synth-kit.mjs';

export {
  acousticEffectPlan, acousticPositionPlan, motifMemoryPlan,
  colourPlan, LEVEL_CELLS, chapterArcPlan, foreshadowDegree, foreshadowPlan, harmonicBridgePlan,
  JAZZ_STYLES, JAZZ_LEANS, registerJazzStyle, registerJazzLean, jazzStyleFor,
  inflectGesture, compVoicingPlan, walkingBassPlan, densityDuckFactor, jazzPhrasePlan, beatPocketPlan,
  TEXTURES, boardStepPlan, trickPlan, powerStoryPlan, obstacleStoryPlan,
  wonderSyntaxPlan, easterEggPlan, themeFlourishPlan, composePhraseVariation,
  registerWonderSyntax, registerThemeFlourish,
  roomPlan, SCORED_SHELVES, shelfColorParams, stingPlan, STING_GAP, admitSting,
  TROPE_STAGES, tropeShape, motifPlan, cadencePlan, ambiencePlan, placePlan, materialPlan,
  registerMaterialSound, registerAmbience
};

let audio = null;
let bus = null;
const sound = { root: 293.66, minor: false, open: false, ground: 'field', muffled: false, thin: false, pulse: 96, swing: 0.5, written: 0.5, jazz: false, motif: null, development: null, carrier: '', rest: 0, harmonicTension: 0, styleInterval: 0, lane: 2, row: 0, prevLane: 2, prevRow: 0, chapter: 1, room: null, dry: 0, padTone: 1 };
const musical = { swing: 'chapter', voicing: 'folk', motifCues: 'room', songSpace: 'natural', mix: 'balanced', ear: 'open', patternMode: 'chapter', styleVoicing: '', jazzLean: 1 };

const swingTarget = () => {
  if (musical.swing === 'straight') return 0.5;
  if (musical.swing === 'lilt') return 0.58;
  if (musical.swing === 'deep') return 0.67;
  return sound.jazz ? Math.max(sound.written, 0.66) : sound.written;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const spread = (amount) => 1 + (Math.random() * 2 - 1) * amount;
const jitter = (amount) => (Math.random() * 2 - 1) * amount;
const hz = (semi) => sound.root * 2 ** (semi / 12);
const scaleNow = () => (sound.minor ? (sound.jazz ? DORIAN : MINOR) : sound.open ? OPEN : sound.jazz ? JAZZ_MAJOR : MAJOR);

/* ─── Harmony & melodic line state ───────────────────────────────────── */

const harmony = { sigil: '.', bass: 0, pcs: [0, 4, 7], sung: [0, 4, 7] };

function setHarmony(sigil) {
  const plan = colourPlan(sigil, { jazz: sound.jazz, minor: sound.minor, open: sound.open });
  Object.assign(harmony, { sigil: plan.sigil, bass: plan.bass, pcs: plan.pcs, sung: plan.sung });
  retunePad();
}

const sungTone = (i) => {
  const n = harmony.sung.length;
  return harmony.sung[((i % n) + n) % n] + 12 * Math.floor(i / n);
};
const bassLow = () => harmony.bass - (harmony.bass > 6 ? 24 : 12);

const line = { at: 7, dir: 1, last: -9, motifAt: 0, leaning: false };
const scaleRun = () => {
  const scale = scaleNow();
  const out = [];
  for (let o = -1; o <= 3; o += 1) scale.forEach((s) => out.push(s + 12 * o));
  return out;
};
const isSung = (semi) => harmony.sung.includes(((semi % 12) + 12) % 12);
const nearestIndex = (run, semi) => run.reduce((best, s, i) => (Math.abs(s - semi) < Math.abs(run[best] - semi) ? i : best), 0);
const sungNear = (semi) => {
  const run = scaleRun().filter(isSung);
  return run[nearestIndex(run, semi)];
};
const sungFrom = (semi, dir = 1) => {
  const run = scaleRun().filter(isSung);
  return (dir > 0 ? run.find((s) => s > semi) : [...run].reverse().find((s) => s < semi)) ?? semi + 12 * dir;
};
const fallen = (semi) => {
  if (!sound.minor && !sound.open) return semi;
  const pc = ((semi % 12) + 12) % 12;
  return semi - pc + ((sound.minor ? FALLS[pc] : RAISES[pc]) ?? pc);
};

function nextNote(now, steps = 1) {
  if (sound.motif?.length) {
    if (now - line.last > 3.5) line.motifAt = 0;
    const len = sound.motif.length;
    const round = Math.floor((line.motifAt || 0) / len);
    const i = (line.motifAt || 0) % len;
    const semi = sound.motif[round % 3 === 2 ? len - 1 - i : i];
    line.motifAt = (line.motifAt || 0) + steps;
    line.at = fallen(semi) + (semi < 0 ? 12 : 0);
    line.last = now;
    return line.at;
  }
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

/* ─── Pulse & fine audio clock ───────────────────────────────────────── */

const sixteenth = () => 60 / sound.pulse / 4;
const lean = () => (sound.swing - 0.5) * 2 * sixteenth();
const lead = { by: null, at: 0 };

function audioNow() {
  const coarse = audio.currentTime;
  if (typeof performance === 'undefined') return coarse;
  const page = performance.now() / 1000;
  const shown = coarse - page;
  if (lead.by === null || lead.by - shown > 0.05 || shown > lead.by) lead.by = shown;
  else lead.by -= (page - lead.at) * 0.0002;
  lead.at = page;
  return Math.max(coarse, page + lead.by);
}

let beatAnchor = 0;
export function markBeat(late = 0) { if (audio) beatAnchor = audioNow() - clamp(Number(late) || 0, 0, 0.25); }

const pulseFrom = (t, after = 0.045) => {
  const s = sixteenth();
  const first = Math.ceil((t + after - beatAnchor) / s);
  return (n = 0) => (first + n) * s + (Math.abs(first + n) % 2 ? lean() : 0) + beatAnchor - t;
};
const toPulse = (t, after = 0.045) => pulseFrom(t, after)(0);
const toBeat = (t, after = 0.03) => {
  const b = sixteenth() * 4;
  return Math.ceil((t + after - beatAnchor) / b) * b + beatAnchor - t;
};

/* ─── Context, samples, bus & rooms ──────────────────────────────────── */

let unlockWired = false;
function unlockAudio(ctx) {
  if (!ctx) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.audioSession && navigator.audioSession.type !== 'playback') {
      navigator.audioSession.type = 'playback';
    }
  } catch { /* ignore */ }
  if (ctx.state !== 'running') {
    ctx.resume().catch(() => {});
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch { /* ignore */ }
  }
  if (!unlockWired && typeof document !== 'undefined') {
    unlockWired = true;
    const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
    const onGesture = () => {
      if (!audio) return;
      unlockAudio(audio);
      if (audio.state === 'running') {
        events.forEach((ev) => document.removeEventListener(ev, onGesture, true));
        unlockWired = false;
      }
    };
    events.forEach((ev) => document.addEventListener(ev, onGesture, { capture: true, passive: true }));
  }
}

function context() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audio) {
    audio = new AudioCtx();
    audio.addEventListener?.('statechange', () => {
      if (audio && audio.state !== 'running') unlockAudio(audio);
    });
  }
  if (audio.state !== 'running') unlockAudio(audio);
  ensureBus();
  ensureSamples();
  return audio;
}

export function primeAudio() {
  try { context(); } catch { /* silent, then */ }
}

let sampleGroups = null;
let samplesAsked = false;
const lastSample = new Map();

function ensureSamples() {
  if (samplesAsked || !audio) return;
  samplesAsked = true;
  fetch('/book/content/sounds.json')
    .then((res) => (res.ok ? res.json() : null))
    .then(async (doc) => {
      if (!doc?.sounds?.length || !audio) return;
      const groups = new Map();
      await Promise.all(doc.sounds.map(async (s) => {
        try {
          const res = await fetch(s.file);
          if (!res.ok) return;
          const buf = await audio.decodeAudioData(await res.arrayBuffer());
          const list = groups.get(s.event) || [];
          list.push({ buf, gain: Number(s.gain) || 1, shape: s.hear?.type ? s.hear : null });
          groups.set(s.event, list);
        } catch { /* synthesized fallback remains */ }
      }));
      sampleGroups = groups;
    })
    .catch(() => {});
}

function pickSample(event) {
  const list = sampleGroups?.get(event);
  if (!list?.length) return null;
  const sense = takeSense(musical.ear);
  if (sense === 'soft') return list.reduce((a, b) => (a.gain <= b.gain ? a : b));
  if (sense === 'bright') return list.reduce((a, b) => (a.gain >= b.gain ? a : b));
  if (sense === 'body' && list.length > 2) {
    const ordered = [...list].sort((a, b) => a.gain - b.gain);
    return ordered[Math.floor(ordered.length / 2)];
  }
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastSample.get(event)) i = (i + 1) % list.length;
  lastSample.set(event, i);
  return list[i];
}

const roomKey = () => (sound.room ? JSON.stringify(sound.room) : sound.ground);
const ROOM_CROSS = 0.45;

function songTime() {
  return clamp(sixteenth() * (sound.swing > 0.53 ? 4 : 3), 0.2, 1.4);
}
function retimeSong() {
  if (!bus?.songA || !audio) return;
  const now = audio.currentTime;
  [bus.songA, bus.songB].forEach((d) => d.delayTime.setTargetAtTime(songTime(), now, 0.05));
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
  const soft = audio.createBiquadFilter();
  soft.type = 'highshelf';
  soft.frequency.value = 4800;
  soft.gain.value = -6;
  const comp = audio.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  const master = audio.createGain();
  master.gain.value = 0.85;
  const echo = audio.createDelay(0.6);
  echo.delayTime.value = 0.14;
  const dark = audio.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 3000;
  const feedback = audio.createGain();
  feedback.gain.value = 0.22;
  const wet = audio.createGain();
  wet.gain.value = 0.1;
  const air = audio.createGain();
  const room = audio.createConvolver();
  room.buffer = createRoomImpulse(audio, sound.ground, sound.room);
  const roomOut = audio.createGain();
  roomOut.gain.value = 0.5;
  input.connect(muffle).connect(thin).connect(soft).connect(comp).connect(master).connect(audio.destination);
  air.connect(room).connect(roomOut).connect(muffle);
  soft.connect(echo);
  echo.connect(dark).connect(feedback).connect(echo);
  dark.connect(wet).connect(comp);
  const song = audio.createGain();
  const songLow = audio.createBiquadFilter();
  songLow.type = 'highpass';
  songLow.frequency.value = 320;
  const songA = audio.createDelay(1.5);
  const songB = audio.createDelay(1.5);
  songA.delayTime.value = songB.delayTime.value = songTime();
  const darkA = audio.createBiquadFilter();
  darkA.type = 'lowpass';
  darkA.frequency.value = 2600;
  const darkB = audio.createBiquadFilter();
  darkB.type = 'lowpass';
  darkB.frequency.value = 2000;
  const across = audio.createGain();
  across.gain.value = 0.55;
  const again = audio.createGain();
  again.gain.value = 0.3;
  const songOut = audio.createGain();
  songOut.gain.value = 0.5;
  const sideOf = (pan) => {
    if (!audio.createStereoPanner) return songOut;
    const p = audio.createStereoPanner();
    p.pan.value = pan;
    p.connect(songOut);
    return p;
  };
  song.connect(songLow).connect(songA).connect(darkA);
  darkA.connect(sideOf(-0.55));
  darkA.connect(across).connect(songB).connect(darkB);
  darkB.connect(sideOf(0.55));
  darkB.connect(again).connect(songA);
  songOut.connect(muffle);
  bus = { input, muffle, thin, air, room, roomOut, song, songA, songB, soft, feedback, wet, ground: roomKey(), door: null };
  return bus;
}

function crossRooms(room) {
  const now = audio.currentTime;
  const was = { door: bus.door, room: bus.room };
  if (sound.room) {
    const door = audio.createGain();
    door.gain.setValueAtTime(0, now);
    door.gain.setTargetAtTime(1, now, ROOM_CROSS);
    bus.air.connect(door).connect(room).connect(bus.roomOut);
    bus.door = door;
  } else {
    bus.air.connect(room).connect(bus.roomOut);
    bus.door = null;
  }
  if (!was.door) { bus.air.disconnect(was.room); return; }
  was.door.gain.setTargetAtTime(0, now, ROOM_CROSS);
  setTimeout(() => { try { bus.air.disconnect(was.door); was.room.disconnect(); } catch { /* already gone */ } }, (ROOM_CROSS * 6 + 2.4) * 1000);
}

function regroundRoom() {
  if (!bus || bus.ground === roomKey()) return;
  const room = audio.createConvolver();
  room.buffer = createRoomImpulse(audio, sound.ground, sound.room);
  if (!sound.room && !bus.door) {
    bus.air.connect(room).connect(bus.roomOut);
    bus.air.disconnect(bus.room);
  } else crossRooms(room);
  bus.room = room;
  bus.ground = roomKey();
}

let placeAfter = 0;
/**
 * @param {{ chapter?: number, held?: boolean, level?: any, after?: number, lean?: string, scene?: any }} [place]
 */
export function setSoundPlace({ chapter = 1, held = false, level = null, after = 0, lean: leaning = '', scene = null } = {}) {
  sound.chapter = Math.max(1, Math.floor(Number(chapter) || 1));
  sound.root = level?.root || ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.pulse = level?.tempo || PULSES[(chapter - 1) % PULSES.length] || 96;
  sound.written = clamp((Number(level?.swing) || 50) / 100, 0.5, 0.67);
  sound.swing = swingTarget();
  sound.motif = Array.isArray(level?.motif) && level.motif.length ? level.motif : null;
  sound.development = Array.isArray(level?.development) && level.development.length ? level.development : null;
  line.motifAt = 0;
  sound.minor = held;
  sound.open = !sound.minor && leaning === 'bone';
  const place = placePlan({ chapter, scene });
  sound.ground = place.ground;
  sound.room = place.room;
  line.last = -9;
  lastCompVoicing = null;
  placeAfter = clamp(Number(after) || 0, 0, 4);
  setHarmony('.');
  placeAfter = 0;
  try { regroundRoom(); retimeSong(); } catch { /* old room stands */ }
}

export function setSoundRoom(sigil, { announce = false } = {}) {
  if (!COLOURS[sigil] || sigil === harmony.sigil) return;
  setHarmony(sigil);
  if (announce) sayRoom();
}

export function setSoundMood({ muffled = false, thin = false } = {}) {
  if (!audio || !bus) return;
  const t = audio.currentTime;
  if (muffled !== sound.muffled) bus.muffle.frequency.setTargetAtTime(muffled ? 1300 : 16000, t, 0.12);
  if (thin !== sound.thin) bus.thin.frequency.setTargetAtTime(thin ? 420 : 30, t, 0.2);
  sound.muffled = muffled;
  sound.thin = thin;
}

/* ─── Ear fatigue, spatial outlets & synth kit ───────────────────────── */

const HALF_LIFE = 1.2;
const TIRES = Object.freeze({ step: 1.3, land: 1, flour: 1, throw: 0.9, hop: 0.7, knock: 0.7, catch: 0.6, deft: 0.6, glass: 0.5, post: 0.5, ramp: 0.5, wap: 0.45, 'land-pulse': 0.35, 'near:berry': 1.6, 'near:boneberry': 1.6, trick: 0.45, power_story: 0.5, story_pass: 1.2, furrow: 0.65, splash: 0.7, easter_egg: 0.3, theme_flourish: 0.4 });
const heard = new Map();

function hear(kind, now) {
  const was = heard.get(kind);
  if (was && now - was.last < 0.03) return null;
  const heat = was ? was.heat * 0.5 ** ((now - was.last) / HALF_LIFE) : 0;
  heard.set(kind, { heat: heat + 1, last: now });
  return heat * (TIRES[kind] ?? 0.6);
}

const AIR = Object.freeze({
  step: 0.03, land: 0.05, flour: 0.14, throw: 0.08, hop: 0.12, knock: 0.1, squash: 0.06, wap: 0.16,
  catch: 0.28, deft: 0.25, glass: 0.4, post: 0.32, ramp: 0.2, berry: 0.35, sweet: 0.42, share: 0.28,
  wonder: 0.45, bone: 0.18, foretell: 0.5, fulfil: 0.3, beaver: 0.25, foil: 0.25, egg: 0.6, spill: 0.3,
  haggle: 0.22, coin: 0.35, pocket: 0.14, poise: 0.32, pantry: 0.38, recipe: 0.4,
  rose: 0.45, gift: 0.4, anthill: 0.08, brush: 0.15,
  trick: 0.28, power_story: 0.36, story_pass: 0.24, furrow: 0.22, splash: 0.14,
  easter_egg: 0.52, theme_flourish: 0.38
});
const SONG = Object.freeze({ catch: 0.2, deft: 0.14, glass: 0.3, post: 0.2, berry: 0.26, sweet: 0.28, share: 0.2, wonder: 0.34, poise: 0.22, pantry: 0.28, recipe: 0.26, trick: 0.22, power_story: 0.28, story_pass: 0.16, furrow: 0.14, easter_egg: 0.32, theme_flourish: 0.22 });

const outletAcoustics = new WeakMap();
const buffers = createBufferBank(() => audio);

function outlet(heat, { depth = 0, air = 0, song = 0, role = 'fx' } = {}) {
  const b = ensureBus();
  const level = audio.createGain();
  const plan = acousticEffectPlan({ heat, depth, air, song, role, space: musical.songSpace, mix: musical.mix, voicing: musical.voicing, dry: sound.dry });
  const spatial = plan.distance > 1.001 && typeof audio.createPanner === 'function';
  level.gain.value = (spatial ? plan.spatialGain : plan.directGain) * spread(0.12);
  outletAcoustics.set(level, { ...plan, spatial });
  const edge = audio.createBiquadFilter();
  edge.type = 'lowpass';
  edge.Q.value = 0;
  edge.frequency.value = plan.cutoffHz;
  level.connect(edge).connect(b.input);
  const send = audio.createGain();
  send.gain.value = plan.roomSend;
  edge.connect(send).connect(b.air);
  if (plan.echoSend > 0 && b.song) {
    const sung = audio.createGain();
    sung.gain.value = plan.echoSend;
    edge.connect(sung).connect(b.song);
  }
  return level;
}

const kit = (out, t, pan = 0) => createSynthKit({
  audio, out, t, pan, outletAcoustics, noise: buffers.noise, pluckBuffer: buffers.pluckBuffer, pickSample
});

/* ─── The land's chord pad & tilt drone ──────────────────────────────── */

const pad = { voices: null, bass: null, out: null, tone: null, momentum: 0, at: 0, timer: 0, shown: 0, semis: null, root: 0 };
const PAD_VOICES = 4;
const WORTH = Object.freeze({ catch: 1, deft: 1, glass: 0.8, post: 0.8, ramp: 0.8, berry: 1, sweet: 1.2, share: 1.2, wonder: 1.5, bone: 0.8, wap: 1.4, pantry: 1.4, recipe: 1.6, pocket: 0.4, trick: 0.85, power_story: 1.0, furrow: 0.4 });
const padTones = () => Array.from({ length: PAD_VOICES }, (_, i) => harmony.pcs[i % harmony.pcs.length] + 12 * Math.floor(i / harmony.pcs.length) - 12);
const pcOf = (semi) => ((Math.round(semi) % 12) + 12) % 12;
const padNow = () => pad.semis || padTones();

function leadVoices(from, pcs) {
  const options = [];
  for (let o = -24; o <= 12; o += 12) pcs.forEach((pc) => { const semi = pc + o; if (semi >= -19 && semi <= 5) options.push(semi); });
  if (!options.length) return padTones();
  const taken = new Set();
  const to = from.map((f) => {
    const free = options.filter((o) => !taken.has(o));
    const pool = free.length ? free : options;
    const best = pool.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
    taken.add(best);
    return best;
  });
  pcs.forEach((pc) => {
    if (to.some((semi) => pcOf(semi) === pc)) return;
    let who = -1;
    let where = 0;
    let cost = Infinity;
    to.forEach((semi, i) => {
      if (to.filter((x) => pcOf(x) === pcOf(semi)).length < 2) return;
      options.filter((o) => pcOf(o) === pc && !to.includes(o)).forEach((o) => {
        const c = Math.abs(o - from[i]);
        if (c < cost) { cost = c; who = i; where = o; }
      });
    });
    if (who >= 0) to[who] = where;
  });
  return to;
}

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
  pad.semis = padTones();
  pad.root = sound.root;
  pad.voices = pad.semis.map((semi, i) => [-1, 1].map((side) => {
    const osc = audio.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz(semi);
    osc.detune.value = side * 7;
    const g = audio.createGain();
    g.gain.value = 0.02 / (PAD_VOICES * 2);
    let node = osc.connect(g);
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner();
      p.pan.value = side * (0.35 + 0.12 * i);
      node = node.connect(p);
    }
    node.connect(tone);
    osc.start();
    return { osc, gain: g };
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
  const when = now + (placeAfter || clamp(toBeat(now), 0, 1.2));
  const moved = 12 * Math.log2((pad.root || sound.root) / sound.root);
  pad.semis = leadVoices(padNow().map((semi) => semi + moved), harmony.pcs);
  pad.root = sound.root;
  pad.semis.forEach((semi, i) => pad.voices[i].forEach(({ osc }) => osc.frequency.setTargetAtTime(hz(semi), when, 0.07)));
  pad.bass.frequency.setTargetAtTime(hz(bassLow()), when, 0.07);
  tunePadVoices(when, landQuality().stage);
}

function breathePad(t) {
  if (!pad.voices) return;
  const base = (600 + 2000 * landQuality().lift) * (sound.padTone || 1);
  pad.tone.frequency.setTargetAtTime(base * 1.45, t, 0.05);
  pad.tone.frequency.setTargetAtTime(base, t + 0.16, 0.45);
}

const bed = { on: false, level: 0.007 };
const floorOf = () => (bed.on ? bed.level : 0.0001);

export function landQuality() {
  if (!pad.at) return { stage: 0, lift: 0, bed: bed.on };
  const now = audio ? audio.currentTime : pad.at;
  const m = pad.momentum * 0.5 ** ((now - pad.at) / 2.5);
  const stage = m >= 8 ? 3 : m >= 5 ? 2 : m >= 2.5 ? 1 : 0;
  return { stage, lift: clamp((m - 2) / 8, 0, 1), bed: bed.on && stage === 0 };
}

function admit(semi, stage) {
  if (bed.on) return 1;
  if (stage <= 0) return 0.02;
  const pc = ((semi % 12) + 12) % 12;
  const bassPc = ((harmony.bass % 12) + 12) % 12;
  if (pc === 0 || pc === 7 || pc === bassPc || pc === (bassPc + 7) % 12) return 1;
  if (stage === 1) return 0.02;
  if (pc === (sound.minor ? 3 : sound.open ? 5 : 4)) return 1;
  return stage >= 3 ? 1 : 0.05;
}

function tunePadVoices(now, stage) {
  if (!pad.voices) return;
  padNow().forEach((semi, i) => {
    const open = admit(semi, stage) / (PAD_VOICES * 2);
    pad.voices[i].forEach(({ gain }) => gain.gain.setTargetAtTime(open, now, 0.28));
  });
}

function bloomStage(now, stage) {
  if (stage <= pad.shown) return;
  const prev = pad.shown;
  pad.shown = stage;
  try {
    const fresh = padNow().filter((semi) => admit(semi, stage) > 0.5 && admit(semi, prev) <= 0.5);
    const k = kit(outlet(0, { air: 0.4 }), now, 0);
    if (!fresh.length) k.tone('sine', hz(bassLow()), 0, 0.35, 0.028, 0, { attack: 0.03, cents: 0 });
    else fresh.forEach((semi, i) => k.celesta(hz(semi + 12), 0.42, 0.02, i * sixteenth()));
  } catch { /* pad still rises */ }
}

export function setMusicBed(on) {
  bed.on = Boolean(on);
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  if (bed.on) {
    ensurePad();
    tunePadVoices(now, landQuality().stage);
    holdAt(pad.out.gain, now);
    pad.out.gain.setTargetAtTime(Math.max(bed.level, pad.out.gain.value), now, 0.8);
  } else if (pad.voices) {
    tunePadVoices(now, landQuality().stage);
    holdAt(pad.out.gain, now);
    pad.out.gain.setTargetAtTime(0.0001, now, 0.6);
    clearTimeout(pad.timer);
    pad.timer = setTimeout(stopPad, 9000);
  }
}

function swellPad(now, worth) {
  pad.momentum = pad.momentum * 0.5 ** ((now - pad.at) / 2.5) + worth;
  pad.at = now;
  if (pad.momentum < 2.5 && !pad.voices && !bed.on) return;
  ensurePad();
  const { stage, lift } = landQuality();
  tunePadVoices(now, stage);
  bloomStage(now, stage);
  holdAt(pad.out.gain, now);
  pad.out.gain.setTargetAtTime(Math.max(floorOf(), 0.0001 + 0.028 * lift), now, 0.5);
  pad.out.gain.setTargetAtTime(floorOf(), now + 1.5, 1.4);
  pad.tone.frequency.setTargetAtTime((600 + 2000 * lift + (sound.row || 0) * 70) * (sound.padTone || 1), now, 0.4);
  clearTimeout(pad.timer);
  pad.timer = setTimeout(stopPad, 9000);
}

function hushPad(now) {
  pad.momentum *= 0.3;
  pad.at = now;
  const stage = landQuality().stage;
  pad.shown = stage;
  if (!pad.voices) return;
  tunePadVoices(now, stage);
  holdAt(pad.out.gain, now);
  pad.out.gain.setTargetAtTime(floorOf(), now, 0.15);
}

function stopPad() {
  if (!pad.voices || bed.on) return;
  if (audio.currentTime - pad.at < 8) { pad.timer = setTimeout(stopPad, 3000); return; }
  pad.voices.flat().forEach(({ osc }) => osc.stop());
  pad.bass.stop();
  pad.out.disconnect();
  pad.voices = null;
  pad.semis = null;
  pad.shown = 0;
}

const roomTones = () => {
  const bassPc = ((harmony.bass % 12) + 12) % 12;
  const up = harmony.pcs.map((pc) => (pc < bassPc ? pc + 12 : pc)).sort((a, b) => a - b);
  return up.length < 3 ? [...up, up[0] + 12] : up;
};
let incipitAt = -9;

function sayRoom() {
  try {
    if (!audio || audio.state !== 'running') return;
    const now = audio.currentTime;
    if (now > incipitAt - 0.6 && now < incipitAt + 2.4) return;
    const wait = clamp(toBeat(now), 0, 1.2);
    const heat = hear('room', now + wait);
    if (heat === null || heat > 1.6) return;
    const k = kit(outlet(heat, { depth: 0.3, air: 0.5, song: 0.22 }), now + wait, 0);
    const tones = harmony.sigil === '.' ? roomTones().reverse() : roomTones();
    const gap = sixteenth() / 2;
    const strumAt = (i) => (sound.jazz ? i * gap * (i % 2 ? 1.18 : 0.92) : i * gap);
    tones.forEach((semi, i) => k.pluck(hz(semi), 0.036 * (i === tones.length - 1 ? 1.15 : 1), strumAt(i)));
    if (harmony.sigil !== '?') k.tone('sine', hz(bassLow()), 0, 0.5, 0.034, harmony.sigil === '.' ? strumAt(tones.length - 1) : 0, { attack: 0.02, cents: 0 });
  } catch { /* room opens all the same */ }
}

const tilt = { a: null, b: null, out: null, pan: null, level: 0, said: 0, timer: 0 };
const TILT_FROM = 0.62;

function stopTilt() {
  if (!tilt.out) return;
  if (tilt.level > 0 && audio.currentTime - tilt.said < 3) { tilt.timer = setTimeout(stopTilt, 3000); return; }
  tilt.level = 0;
  [tilt.a, tilt.b].forEach((osc) => { try { osc.stop(); } catch { /* already still */ } });
  tilt.out.disconnect();
  tilt.out = null;
}

export function setSoundTilt(wobble = 0, dir = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const w = clamp((wobble - TILT_FROM) / (1 - TILT_FROM), 0, 1);
    if (!w && !tilt.level) return;
    const now = audio.currentTime;
    if (Math.abs(w - tilt.level) < 0.04 && w > 0 && now - tilt.said < 0.2) return;
    tilt.said = now;
    if (!tilt.out) {
      const b = ensureBus();
      tilt.out = audio.createGain();
      tilt.out.gain.value = 0.0001;
      tilt.a = audio.createOscillator();
      tilt.b = audio.createOscillator();
      const half = audio.createGain();
      half.gain.value = 0.5;
      tilt.a.connect(half);
      tilt.b.connect(half);
      let node = half.connect(tilt.out);
      if (audio.createStereoPanner) {
        tilt.pan = audio.createStereoPanner();
        node = node.connect(tilt.pan);
      }
      node.connect(b.input);
      const send = audio.createGain();
      send.gain.value = 0.3;
      node.connect(send).connect(b.air);
      tilt.a.start();
      tilt.b.start();
    }
    const f = hz(-5) * 2 ** ((70 * w) / 1200);
    tilt.a.frequency.setTargetAtTime(f, now, 0.12);
    tilt.b.frequency.setTargetAtTime(f + 1.5 + 5.5 * w, now, 0.12);
    holdAt(tilt.out.gain, now);
    tilt.out.gain.setTargetAtTime(w ? 0.004 + 0.022 * w ** 1.5 : 0.0001, now, w > tilt.level ? 0.08 : 0.25);
    tilt.out.gain.setTargetAtTime(0.0001, now + 0.6, 0.2);
    tilt.pan?.pan.setTargetAtTime(clamp(dir, -1, 1) * 0.3, now, 0.15);
    tilt.level = w;
    clearTimeout(tilt.timer);
    tilt.timer = setTimeout(stopTilt, 4000);
  } catch { /* pie tilts all the same */ }
}

/* ─── Rhythm pocket & landPulse ──────────────────────────────────────── */

function rhythmVoice(k, voice, strong, vol, delay = 0, { step = 0, interlock = 'primary' } = {}) {
  const { tone, hiss, celesta, marimba, vibes, kalimba, musicBox, honk, tock } = k;
  const s = ((Number(step) || 0) % 16 + 16) % 16;
  const beatIdx = Math.floor(s / 4);
  const offSixteenth = s % 2 === 1;
  const offEighth = s % 4 === 2;
  const harmShift = interlock === 'complement' ? 2 : interlock === 'answer' ? 1 : 0;
  const stepDeg = (strong ? [0, 2, 1, 3][beatIdx] : offEighth ? 3 : offSixteenth ? 4 : 2) + harmShift;
  const durMul = offSixteenth ? 0.72 : offEighth ? 0.88 : 1;
  switch (voice) {
    case 'kalimba': kalimba(hz(sungTone(stepDeg)), 0.25 * durMul, 0.034 * vol, delay); break;
    case 'shaker': hiss(offSixteenth ? 7200 : 6200, offSixteenth ? 5400 : 4600, 0.045 * durMul, 0.026 * vol, 2.2, delay, 'bandpass', strong ? 0.22 : 0.14); break;
    case 'marimba': marimba(hz(sungTone(strong ? (beatIdx % 2 === 0 ? 0 : 2) + harmShift : stepDeg)), 0.25 * durMul, 0.042 * vol, delay); break;
    case 'glass': celesta(hz(sungTone(stepDeg + 2) + 12), 0.3 * durMul, 0.022 * vol, delay); break;
    case 'vibes': vibes(hz(sungTone(stepDeg + 1)), 0.35 * durMul, 0.03 * vol, delay); break;
    case 'drip': tone('sine', strong ? 1500 : offEighth ? 1360 : 1220, strong ? 720 : 610, 0.06 * durMul, 0.03 * vol, delay, { attack: 0.002 }); break;
    case 'honk': honk(hz(sungTone(stepDeg)), 0.08 * durMul, 0.034 * vol, delay); break;
    case 'bass': tone('sine', hz(bassLow() + (strong ? 0 : beatIdx === 3 ? 7 : 5)), 0, 0.3 * durMul, 0.075 * vol, delay, { attack: 0.01, cents: 0 }); break;
    case 'musicbox': musicBox(hz(sungTone(stepDeg + 2) + 12), 0.3 * durMul, 0.026 * vol, delay); break;
    default: tock(strong ? 620 : offEighth ? 690 : 760, strong ? 440 : 530, 0.06 * vol, delay); break;
  }
}

const placeInBar = (step, { swing = sound.swing || 0.5, jazz = sound.jazz } = {}) => {
  const s = ((Number(step) || 0) % 16 + 16) % 16;
  const swung = jazz || swing > 0.53;
  if (s === 0) return 1.04;
  if (s === 8) return 0.98;
  if (s === 4 || s === 12) return swung ? 1.02 : 0.94;
  if (s % 2 === 0) return swung ? 0.91 : 0.86;
  return swung && (s === 7 || s === 15) ? 0.84 : 0.74;
};

export function rhythmHit({ voice = 'tock', strong = false, level = 1, whisper = false, pan = 0, step = 0, interlock = 'primary', in: wait = 0 } = {}) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audioNow() + 0.005 + clamp(Number(wait) || 0, 0, 0.5);
    if (!whisper && t < sound.rest) return;
    const heat = hear(`${whisper ? 'whisper' : 'groove'}:${voice}:${interlock}`, t);
    if (heat === null) return;
    const lift = whisper ? 0.55 : clamp(0.54 + pad.momentum / 12, 0.54, 1.05);
    const stepPan = pan + (interlock === 'answer' ? 0.22 : interlock === 'complement' ? -0.18 : 0) + ((step % 4) - 1.5) * 0.04;
    const k = kit(outlet(heat * 0.28, { depth: whisper ? 0.55 : 0.14, air: whisper ? 0.55 : 0.22 }), t, clamp(stepPan + jitter(0.05), -0.85, 0.85));
    rhythmVoice(k, voice, strong, level * lift * (strong ? 1 : 0.74) * placeInBar(step), 0, { step, interlock });
  } catch { /* kept silently */ }
}

export function rhythmFound(rhythm) {
  try {
    if (!audio || audio.state !== 'running' || !rhythm) return;
    const t = audio.currentTime + 0.02;
    const s = sixteenth() * 0.8;
    const k = kit(outlet(0, { air: 0.35 }), t, 0);
    rhythm.hits.forEach((h) => rhythmVoice(k, rhythm.voice, rhythm.steps[h] === 'X', 1.3, h * s, { step: h }));
    const after = 16 * s + 0.05;
    (sound.motif || [0, 4, 7, 12]).forEach((semi, i, all) => k.musicBox(hz(fallen(semi) + 12), i === all.length - 1 ? 0.8 : 0.35, 0.04, after + i * s * 2, (i - 1.5) * 0.12));
  } catch { /* found, if unheard */ }
}

const jazzLean = () => (sound.jazz ? musical.jazzLean : 0);
let pulseSeen = -9;
let pendingCadence = null;
let lastCompVoicing = null;

function downbeatBass(semi, { jz = null, arc = null, step = 0 } = {}) {
  let out = semi;
  if (jz?.parked != null && (step === 0 || step === 8)) out = offDebt(out, jz.parked);
  if (jz?.landing != null && step === 0 && arc?.movement === 'turnaround' && arc?.inPhrase === 3) {
    const want = debtPc(jz.landing);
    const pc = ((out % 12) + 12) % 12;
    let up = (want - pc + 12) % 12;
    if (up > 6) up -= 12;
    out += up;
  }
  return out;
}

function playJazzComp(k, jz, arc, duck, { dur = 0.2, gain = 1, roll = 0.008 } = {}) {
  if (!jz || !k) return;
  const voiced = compVoicingPlan({
    bassOffset: arc.bassOffset, compSemis: jz.compSemis,
    minor: sound.minor, open: sound.open, prevVoicing: lastCompVoicing, parked: jz.parked
  });
  lastCompVoicing = voiced;
  const tones = voiced.slice(0, Math.min(voiced.length, Math.max(2, duck.maxVoices)));
  const center = (tones.length - 1) / 2;
  tones.forEach((semi, idx) => {
    const taper = idx < 2 ? 1 : idx === 2 ? 0.86 : 0.72;
    k.vibes(hz(semi + 12), dur, 0.014 * gain * duck.compGain * taper, jz.layback + idx * roll, (idx - center) * 0.14);
  });
}

export function landPulse({ step = 0, bar = 0, in: wait = 0, progress = 0, wobble = 0, combo = 0, richness = 0.5, presence = '', tropeStage = '', wonderKind = '', wonderChain = 0, chapter = 0, motivation = '', pace = null, foreshadow = '', foreshadowChapters = [] } = {}) {
  try {
    if (![0, 2, 4, 6, 7, 8, 10, 12, 14, 15].includes(step)) return;
    if (!audio || audio.state !== 'running') return;
    pulseSeen = audio.currentTime;
    const t = audioNow() + 0.005 + clamp(Number(wait) || 0, 0, 0.5);
    if (t < sound.rest) return;
    const { stage } = landQuality();
    const ch = Math.floor(Number(chapter) || sound.chapter || 0);
    const arc = chapterArcPlan({ progress, bar, step, stage, chapter: ch });
    const pocket = beatPocketPlan({ step, bar, progress, stage, swing: sound.swing, jazz: sound.jazz, ground: sound.ground, combo, bedOn: bed.on, chapter: ch });
    const jz = sound.jazz ? jazzPhrasePlan({ progress, wobble, combo, richness, presence, step, bar, tropeStage, wonderKind, wonderChain, chapter: ch, motivation, pace, foreshadow, foreshadowChapters, motif: sound.motif, development: sound.development }) : null;
    const owed = foreshadow ? foreshadowPlan(foreshadow, { chapter: ch || 1, appearances: foreshadowChapters, movement: arc.movement }) : null;
    const steer = jz || { parked: owed && !owed.mayLand ? owed.degree : null, landing: owed?.mayLand ? owed.degree : null };
    const recentHeat = (heard.get('catch')?.heat || 0) * 0.5 + (heard.get('wap')?.heat || 0) * 0.6;
    const duck = densityDuckFactor({ combo, stage, pace, recentHeat });
    const walk = jz ? walkingBassPlan({ progress, bar, chapter: ch, jazz: true, minor: sound.minor, tritoneSub: jz.tritoneSub, backdoor: jz.backdoor, feeds: jz.feeds, passOffset: jz.passOffset }) : null;
    if (step === 0 && pendingCadence && arc.inPhrase === 3) {
      const armed = pendingCadence;
      pendingCadence = null;
      playPlan(stingPlan(armed.shelf, { complete: true }).filter((n) => n.part === 'cadence'), { vol: armed.vol, air: armed.air });
    }
    if (pocket.spare && step !== 0) return;

    if (step === 0) {
      breathePad(t);
      if (!pocket.walkingBass && stage < 1 && !bed.on) return;
      const heat = hear('land-pulse', t);
      if (heat === null) return;
      const k = kit(outlet(heat * 0.22, { air: 0.25 }), t, 0);
      const bassNote = downbeatBass(bassLow() + fallen(walk ? walk.notes[0] : arc.bassOffset), { jz: steer, arc, step });
      const volScale = stage === 3 ? 1.25 : stage === 2 ? 1.05 : stage === 1 ? 0.85 : 0.68;
      if (sound.jazz) k.uprightBass(hz(bassNote), stage < 2 ? 0.3 : 0.24, 0.03 * volScale * arc.volMul, 0);
      else k.tone('sine', hz(bassNote), 0, stage < 2 ? 0.28 : 0.2, 0.028 * volScale * arc.volMul, 0, { attack: 0.014, cents: 0 });
      if (arc.complement && (stage >= 1 || bed.on)) k.tone('sine', hz(bassLow() + fallen(arc.bassOffset + 7)), 0, 0.16, 0.011 * volScale, 0.03, { attack: 0.02, cents: 0 });
      if (pocket.ridePing && sound.jazz) k.ride(0.011 * volScale * duck.rideGain, 0, { accent: true, skip: false, side: 0.16 });
      if (jz && jz.charleston && (stage >= 1 || combo >= 1)) playJazzComp(k, jz, arc, duck, { dur: 0.17, gain: 0.88, roll: 0.006 });
      if (stage >= 2 && arc.movement !== 'opening' && !arc.anticipate) k.vibes(hz(fallen(arc.guideToneOffset) + 12), 0.24, 0.011 * duck.compGain, jz ? jz.layback : 0.006, -0.1);
      if (stage === 3) k.celesta(hz(harmony.pcs[harmony.pcs.length - 1] + 12 + (arc.movement === 'turnaround' ? 2 : 0)), 0.22, 0.012 * duck.compGain, jz ? jz.layback : 0, 0.1);
      return;
    }

    if (step === 4 || step === 12) {
      if (!pocket.backbeat && !pocket.walkingBass) return;
      if (hear(`land-backbeat:${step}`, t) === null) return;
      const k = kit(outlet(0.18, { air: 0.2, role: 'music' }), t, step === 4 ? -0.08 : 0.08);
      const gain = (stage >= 2 ? 1 : 0.76) * (pocket.backbeatStrong ? 1.12 : 0.95);
      if (pocket.walkingBass && (stage >= 1 || bed.on)) {
        if (sound.jazz && walk) k.uprightBass(hz(bassLow() + (step === 4 ? fallen(walk.notes[1]) : walk.notes[3])), 0.21, 0.022 * gain, jz ? jz.layback * 0.5 : 0);
        else k.marimba(hz(bassLow() + fallen(step === 12 && jz ? jz.passOffset : pocket.bassSemi)), 0.18, 0.018 * gain, jz ? jz.layback * 0.5 : 0);
      }
      if (sound.jazz && pocket.ridePing) {
        k.ride(0.01 * gain * duck.rideGain, jz ? jz.layback * 0.5 : 0, { accent: step === 12, skip: false, side: 0.15 });
        k.hihatChick(0.012 * gain * duck.rideGain, jz ? jz.layback : 0);
      }
      if (pocket.percussionVoice === 'wood') k.tock(pocket.backbeatStrong ? 590 : 660, pocket.backbeatStrong ? 420 : 480, 0.016 * gain * (sound.jazz ? duck.rideGain : 1), jz ? jz.layback : 0);
      else k.hiss(5800, 3900, 0.045, 0.013 * gain * (sound.jazz ? duck.rideGain : 1), 1.9, jz ? jz.layback : 0, 'bandpass', 0.14);
      if (step === 12 && arc.motifDeg != null && stage >= 2) k.celesta(hz(sungTone(arc.motifDeg) + 12), 0.24, 0.014 * duck.compGain, jz ? jz.layback : 0, 0.15);
      return;
    }

    if (step === 2 || step === 6) {
      if (step === 6 && jz && jz.charleston && (stage >= 1 || combo >= 2) && !duck.skipOffComp) {
        if (hear('land-comp', t) === null) return;
        playJazzComp(kit(outlet(0.2, { air: 0.3, song: 0.18, role: 'music' }), t, 0), jz, arc, duck, { dur: 0.22, gain: 1, roll: 0.008 });
        return;
      }
      if (pocket.ridePing && (stage >= 2 || combo >= 3)) {
        if (hear(`land-sub:${step}`, t) === null) return;
        kit(outlet(0.25, { air: 0.16, role: 'music' }), t, step === 2 ? -0.14 : 0.14).hiss(6800, 5100, 0.032, 0.008 * duck.rideGain, 2.4, 0, 'bandpass', 0.1);
      }
      return;
    }

    if (step === 7 || step === 15) {
      if (!pocket.ridePing && !pocket.pickupFill) return;
      if (hear(`land-skip:${step}`, t) === null) return;
      const k = kit(outlet(0.2, { air: 0.2, role: 'music' }), t, step === 7 ? 0.16 : -0.16);
      if (sound.jazz) k.ride(0.009 * (stage >= 2 ? 1.15 : 0.85) * duck.rideGain, jz ? jz.layback * 0.6 : 0, { accent: false, skip: true, side: step === 7 ? 0.16 : -0.16 });
      else k.hiss(7800, 5600, 0.036, 0.01 * (stage >= 2 ? 1.15 : 0.85), 2.5, jz ? jz.layback * 0.6 : 0, 'bandpass', 0.18);
      if (step === 15 && arc.anticipate && stage >= 2 && arc.movement !== 'opening') k.vibes(hz(fallen(arc.guideToneOffset) + 12), 0.2, 0.01 * duck.compGain, 0, 0.12);
      if (step === 15 && pocket.pickupFill && (stage >= 1 || bed.on)) k.kalimba(hz(sungTone(1)), 0.14, 0.013 * duck.compGain, 0, 0.1);
      return;
    }

    if (step === 8) {
      if (!pocket.walkingBass && stage < 1) return;
      if (hear('land-motif', t) === null) return;
      const k = kit(outlet(0.2, { air: 0.3, song: 0.18, role: 'music' }), t, arc.movement === 'bridge' ? -0.18 : 0.12);
      const halfBass = downbeatBass(bassLow() + fallen(walk ? walk.notes[2] : (arc.bassOffset + (arc.movement === 'opening' ? 0 : 7))), { jz: steer, arc, step });
      if (sound.jazz) {
        k.uprightBass(hz(halfBass), 0.22, 0.023 * (stage >= 2 ? 1 : 0.78) * arc.volMul, 0);
        if (pocket.ridePing) k.ride(0.01 * duck.rideGain, 0, { accent: false, skip: false, side: 0.15 });
      } else k.tone('sine', hz(halfBass), 0, 0.2, 0.02 * (stage >= 2 ? 1 : 0.75) * arc.volMul, 0, { attack: 0.014, cents: 0 });
      if (stage >= 2 && (arc.motifDeg != null || jz?.motif)) {
        const phrase = jz?.motif?.events || [{ semi: sound.motif?.[arc.motifDeg % (sound.motif?.length || 1)] ?? sungTone(arc.motifDeg), at: 0, dur: 0.9, accent: 1 }];
        phrase.forEach((event, idx) => {
          const degSemi = fallen(event.semi) + 12;
          const at = (jz?.layback || 0) + event.at * sixteenth();
          const vol = (0.012 + event.accent * 0.005) * duck.compGain;
          if (jz?.enclosure && idx === phrase.length - 1) k.vibes(hz(degSemi + 1), 0.07, vol * 0.7, Math.max(0, at - sixteenth() * 0.5), -0.1);
          k.kalimba(hz(degSemi), Math.max(0.08, event.dur * sixteenth()), vol, at, (idx - 1) * 0.1);
        });
      }
      return;
    }

    if (step === 10) {
      if (!jz || (stage < 1 && combo < 2)) return;
      if (jz.charleston && !duck.skipOffComp && hear('land-comp:10', t) !== null) {
        playJazzComp(kit(outlet(0.2, { air: 0.28, song: 0.16, role: 'music' }), t, 0), jz, arc, duck, { dur: 0.19, gain: 0.92, roll: 0.007 });
      }
      if (!jz.walkingPass || hear('land-walk', t) === null) return;
      kit(outlet(0.15, { air: 0.22 }), t, 0).uprightBass(hz(bassLow() + jz.passOffset), 0.16, 0.017, jz.layback);
      return;
    }

    if ((arc.inPhrase !== 3 && arc.movement !== 'turnaround') || (stage < 1 && !bed.on)) return;
    if (hear('land-turn', t) === null) return;
    const k = kit(outlet(0, { air: 0.25 }), t, 0);
    const turnSemi = bassLow() + (jz ? jz.passOffset : arc.turnOffset);
    if (sound.jazz) k.uprightBass(hz(turnSemi), 0.18, 0.022, jz ? jz.layback * 0.5 : 0);
    else k.tone('sine', hz(turnSemi), 0, 0.2, 0.022, 0, { attack: 0.012, cents: 0 });
  } catch { /* bar still turns */ }
}

/* ─── Approach cues, warnings, themes & chapter cadences ─────────────── */

const APPROACH = Object.freeze({
  stone: 'stone', pane: 'glass', frost: 'glass',
  chair: 'wood', table: 'wood', spool: 'wood', beaver: 'wood', dividers: 'wood',
  throne: 'gilt', post: 'gilt',
  hole: 'hollow', ditch: 'hollow', snail: 'hollow', puddle: 'hollow',
  wasps: 'swarm', pigeon: 'odd',
  banner: 'cloth', sack: 'cloth', mimewall: 'cloth',
  berry: 'warm', boneberry: 'warm', wonder: 'warm', egg: 'warm', place: 'warm', switch: 'warm',
  dolphin: 'water', donut: 'dough', boonrose: 'warm', banerose: 'wood'
});

export function approachCue(kind, pan = 0, depth = 0) {
  try {
    const mat = APPROACH[kind];
    if (!mat || !audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear(`near:${kind}`, t);
    if (heat === null || heat > 2.4) return;
    const k = kit(outlet(heat, { depth, air: 0.32 }), t, pan);
    const f = hz(bassLow() + 12);
    if (mat === 'stone') [1, 1.59, 2.14].forEach((p, i) => k.tone('sine', f * p, f * p * 0.82, 0.07, 0.022 / (i + 1), i * 0.006, { attack: 0.002, cents: 16 }));
    else if (mat === 'glass') { k.tone('sine', f * 2.756, 0, 0.2, 0.016, 0, { attack: 0.004, cents: 3 }); k.tone('sine', f * 5.4, 0, 0.07, 0.006, 0.012, { attack: 0.002 }); }
    else if (mat === 'wood') { k.tone('sine', f, 0, 0.09, 0.024, 0, { attack: 0.003 }); k.tone('sine', f * 3, 0, 0.05, 0.01, 0, { attack: 0.002 }); }
    else if (mat === 'gilt') { k.tone('sine', f, 0, 0.12, 0.022, 0, { attack: 0.003 }); k.tone('sine', f * 1.5, 0, 0.16, 0.014, 0.02, { attack: 0.004, cents: 2 }); }
    else if (mat === 'hollow') k.tone('sine', Math.max(40, f * 0.5), Math.max(32, f * 0.32), 0.26, 0.026, 0, { attack: 0.02, cents: 5 });
    else if (mat === 'swarm') { k.tone('sawtooth', 196, 196, 0.14, 0.016, 0, { attack: 0.012, cut: 1400 }); k.tone('sawtooth', 203, 203, 0.14, 0.012, 0, { attack: 0.012, cut: 1400 }); }
    else if (mat === 'odd') { const p = hz(sungTone(4) + 12); k.tone('sine', p, 0, 0.08, 0.018, 0, { attack: 0.004 }); k.tone('sine', p * 3, 0, 0.04, 0.007, 0, { attack: 0.002 }); k.tone('sine', p * 5, 0, 0.02, 0.004, 0, { attack: 0.002 }); }
    else if (mat === 'warm') { const p = hz(sungTone(2) + 12); k.tone('sine', p, 0, 0.12, 0.016, 0, { attack: 0.01 }); k.tone('sine', p * 1.26, 0, 0.16, 0.014, 0.07, { attack: 0.01 }); }
    else if (mat === 'water') { k.tone('sine', f * 1.5, f * 2.6, 0.09, 0.018, 0, { attack: 0.004 }); k.tone('sine', f * 2, f * 3.4, 0.08, 0.014, 0.09, { attack: 0.004 }); }
    else if (mat === 'dough') { k.tone('sine', Math.max(60, f * 0.75), Math.max(50, f * 0.6), 0.1, 0.024, 0, { attack: 0.006 }); k.hiss(700, 300, 0.06, 0.008, 1, 0, 'lowpass', 0.5); }
    else k.hiss(900, 480, 0.12, 0.016, 1.2, 0, 'bandpass', 0.35);
  } catch { /* still arrives */ }
}

export function powerEnding() {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear('power-ending', t);
    if (heat === null || heat > 1.5) return;
    const k = kit(outlet(heat, { air: 0.3 }), t, 0);
    const p = hz(sungTone(4) + 12);
    k.tone('sine', p, 0, 0.16, 0.016, 0, { attack: 0.006 });
    k.tone('sine', p / 1.19, 0, 0.24, 0.014, 0.13, { attack: 0.006 });
  } catch { /* still runs out */ }
}

export function laneWarning(pan = 0, near = 0.5, shape = 'one') {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear('lane-warn', t);
    if (heat === null || heat > 3) return;
    const k = kit(outlet(heat, { air: 0.08, role: 'cue' }), t, clamp(pan, -1, 1) * 0.3);
    const f = hz(bassLow() + 7);
    const level = 0.03 + 0.02 * clamp(near, 0, 1);
    if (shape === 'low') {
      k.tone('triangle', f, f * 1.12, 0.06, level, 0, { attack: 0.002 });
      k.tone('triangle', f * 4 / 3, f * 4 / 3 * 1.12, 0.06, level * 0.9, 0.09, { attack: 0.002 });
    } else if (shape === 'tall') {
      k.tone('triangle', f * 4 / 3, f * 4 / 3 * 0.94, 0.07, level, 0, { attack: 0.002 });
      k.tone('triangle', f, f * 0.94, 0.08, level * 0.9, 0.1, { attack: 0.002 });
    } else {
      k.tone('triangle', f, f * 0.94, 0.06, level, 0, { attack: 0.002 });
      k.tone('triangle', f, f * 0.94, 0.06, level * 0.85, 0.09, { attack: 0.002 });
    }
  } catch { /* lane still says it */ }
}

export function characterMotif(who, pan = 0, { settled = false } = {}) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.01;
    const heat = hear(`who:${who}`, t);
    if (heat === null || heat > 2.5) return;
    const k = kit(outlet(heat, { air: 0.28 }), t, pan);
    const s = sixteenth();
    const honkAt = (i, delay, vol = 0.04) => k.honk(hz(sungTone(i)), 0.09, vol, delay, pan * 0.2);
    if (who === 'boon') [1, 2, 4].forEach((i, n) => honkAt(i, toPulse(t, 0.02) + n * s, 0.038));
    else if (who === 'bane') [4, 2, 1].forEach((i, n) => honkAt(i, n * s, 0.034));
    else if (who === 'clown') { honkAt(1, 0, 0.032); honkAt(4, s, 0.028); }
    else if (who === 'clerk') {
      k.tock(520, 400, 0.045);
      if (settled) k.marimba(hz(4), 0.2, 0.036, s * 2);
      else k.tone('sine', hz(0) * 2 ** (1 / 12), 0, 0.12, 0.026, s * 2, { attack: 0.004, cents: 4 });
    }
  } catch { /* still arrive */ }
}

let MOTIFS = {};
let meterTurn = 0;
export function setThemes(motifs = {}) { MOTIFS = motifs || {}; }
export function setSoundCarrier(id = '') { sound.carrier = id; }

const degree = (d) => {
  const scale = scaleNow();
  const n = scale.length;
  return scale[((d % n) + n) % n] + 12 * Math.floor(d / n);
};
const themeNotes = (who) => {
  const m = MOTIFS[who];
  if (!m) return null;
  if (!m.of) return m.notes || null;
  const source = MOTIFS[m.of]?.notes;
  if (!source) return null;
  if (m.form === 'inversion') return source.map((n) => 2 * source[0] - n);
  if (m.form === 'retrograde') return [...source].reverse();
  return source;
};
const voiceFor = (k, timbre) => ({ reed: k.honk, wood: k.marimba, marimba_bar: k.marimba, glass: k.celesta, odd: k.vibes }[timbre] || k.kalimba);

function playTheme(k, who, at, { vol = 1, settled = false, side = 0 } = {}) {
  const s = sixteenth();
  const m = MOTIFS[who];
  if (!m) return 0;
  if (who === 'genie') {
    const f = hz(0);
    [1, 1.5, 1.125, 1.6875].forEach((ratio, i) => k.vibes(f * ratio, 0.4, 0.018 * vol, at + i * s * 2, side));
    k.vibes(f * 2, 0.9, 0.013 * vol, at + s * 8, side - 0.1);
    k.vibes(f * 2 * (531441 / 524288), 0.9, 0.013 * vol, at + s * 8, side + 0.1);
    return s * 8 + 0.9;
  }
  if (who === 'clerk') {
    [0, 1, 2, 3].forEach((i) => k.tock(520, 400, 0.034 * vol, at + i * s * 0.8));
    k.tock(760, 300, 0.044 * vol, at + s * 3.6);
    if (settled) k.marimba(hz(4), 0.2, 0.036 * vol, at + s * 5);
    else k.tone('sine', hz(0) * 2 ** (1 / 12), 0, 0.12, 0.026 * vol, at + s * 5, { attack: 0.004, cents: 4 });
    return s * 5 + 0.2;
  }
  if (who === 'ants') {
    [0, 4, 7, 9, 5].forEach((semi, i) => k.marimba(hz(fallen(semi) + 12), 0.2, 0.024 * vol, at + i * s, side + (i - 2) * 0.1));
    return s * 5;
  }
  if (who === 'figure') {
    k.tone('sine', hz(0), 0, 0.22, 0.03 * vol, at, { attack: 0.006, cents: 2 });
    return 0.25;
  }
  const notes = themeNotes(who);
  if (!notes) return 0;
  if (who === 'clown') {
    const from = hz(degree(notes[0]));
    const to = hz(settled ? sungNear(degree(notes[1])) : degree(notes[1]));
    k.tone('sawtooth', from, to, s * 3, 0.03 * vol, at, { attack: 0.012, cut: 1700, vibrato: 14, side });
    return s * 3;
  }
  const play = voiceFor(k, m.timbre);
  let gap = 2;
  if (m.meters?.length) { meterTurn += 1; gap = m.meters[meterTurn % m.meters.length]; }
  notes.forEach((d, i) => play(hz(degree(d)), m.timbre === 'reed' ? 0.1 : 0.26, (m.timbre === 'reed' ? 0.036 : 0.026) * vol, at + i * s * gap, side));
  return s * gap * notes.length;
}

export function characterTheme(who, pan = 0, { settled = false, answer = '' } = {}) {
  try {
    if (!audio || audio.state !== 'running' || !MOTIFS[who]) return false;
    const t = audio.currentTime + 0.01;
    const heat = hear(`who:${who}`, t);
    if (heat === null || heat > 2.5) return false;
    const k = kit(outlet(heat, { air: 0.28 }), t, pan);
    const at = toPulse(t, 0.02);
    playTheme(k, who, at, { settled });
    if (answer && MOTIFS[answer]) {
      playTheme(kit(outlet(heat, { depth: 0.7, air: 0.55 }), t, -pan), answer, at + sixteenth() * 16, { vol: 0.62 });
    }
    return true;
  } catch { return false; }
}

export function mimeRest() {
  try {
    if (!audio || audio.state !== 'running') return;
    sound.rest = Math.max(sound.rest, audioNow() + sixteenth() * 16);
  } catch { /* groove goes on */ }
}

export function curtainCall(cast = [], wait = 1.4) {
  try {
    if (!audio || audio.state !== 'running' || !cast.length) return;
    const t = audio.currentTime + 0.01;
    const k = kit(outlet(0, { air: 0.42 }), t, 0);
    const s = sixteenth() * 1.5;
    let at = clamp(wait, 0, 4);
    cast.slice(0, 5).forEach((who, i) => {
      const side = cast.length > 1 ? (i / (cast.length - 1) - 0.5) * 0.7 : 0;
      const notes = themeNotes(who) || [0];
      const play = voiceFor(k, MOTIFS[who]?.timbre);
      notes.slice(0, 2).forEach((d, n) => play(hz(degree(d)), 0.3, 0.03, at + n * s, side));
      at += s * 3;
    });
    k.musicBox(hz(12), 1, 0.026, at + s);
  } catch { /* curtain falls quietly */ }
}

export function dimensionFanfare(id) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.04;
    const k = kit(outlet(0, { air: 0.48 }), t, 0);
    const s = sixteenth();
    if (id === 'height') {
      [0, 2, 4].forEach((i, n) => k.pluck(hz(sungTone(i)), 0.05, n * s));
      k.celesta(hz(sungTone(4) + 12), 0.4, 0.028, 3 * s);
    } else if (id === 'games') {
      k.honk(hz(sungTone(2)), 0.14, 0.05, 0, -0.12);
      k.honk(hz(sungTone(4)), 0.18, 0.042, s * 2, 0.12);
    } else if (id === 'depth') {
      k.tone('sine', hz(bassLow()), 0, 0.8, 0.045, 0, { attack: 0.06, cents: 0 });
      k.tone('sine', hz(7), 0, 0.9, 0.028, 0.12, { attack: 0.08, cents: 0 });
      k.celesta(hz(sungTone(5) + 24), 0.5, 0.012, 0.4);
    }
  } catch { /* lanes gain it */ }
}

export function chapterCadence(outcome = 'carried') {
  try {
    if (!audio || audio.state !== 'running') return 0;
    const t = audio.currentTime + 0.01;
    const at = pulseFrom(t, 0.06);
    const k = kit(outlet(0, { air: 0.4, song: 0.18 }), t, 0);
    (sound.minor || sound.open ? [7, 10] : [7, 9]).forEach((semi, i) => k.marimba(hz(semi), 0.24, 0.042, at(i * 2), (i - 0.5) * 0.2));
    k.tone('sine', hz(-17), 0, 0.34, 0.045, at(0), { attack: 0.012, cents: 0 });
    const home = at(4);
    if (sound.jazz) {
      k.uprightBass(hz(-10), 0.26, 0.044, at(0));
      [5, 9, 12].forEach((semi, i) => k.vibes(hz(fallen(semi)), 0.24, 0.02, at(0) + i * 0.012, (i - 1) * 0.14));
      k.uprightBass(hz(-17), 0.28, 0.046, at(2));
      [5, 8, 11].forEach((semi, i) => k.vibes(hz(semi), 0.26, 0.022, at(2) + i * 0.012, (i - 1) * 0.14));
      if (outcome === 'won') {
        k.uprightBass(hz(-16), 0.72, 0.048, home);
        [12, 15, 19].forEach((semi, i) => k.vibes(hz(semi), 0.8, 0.024, home + i * 0.018, (i - 1) * 0.15));
      } else if (outcome === 'back') {
        k.uprightBass(hz(-12), 0.75, 0.05, home);
        [11, 14, 16, 19].forEach((semi, i) => k.celesta(hz(semi), i === 3 ? 0.95 : 0.55, 0.026, home + i * sixteenth() * 0.45, (i - 1.5) * 0.16));
      } else if (outcome === 'held' || sound.minor) {
        k.uprightBass(hz(-12), 0.7, 0.048, home);
        [9, 14, 15].forEach((semi, i) => k.vibes(hz(semi), 0.72, 0.024, home + i * 0.018, (i - 1) * 0.14));
      } else {
        k.uprightBass(hz(-12), 0.75, 0.05, home);
        [11, 14, 16].forEach((semi, i) => k.vibes(hz(semi), 0.82, 0.026, home + i * 0.018, (i - 1) * 0.14));
      }
      return home + sixteenth() * 4;
    }
    const bass = (semi) => k.tone('sine', hz(semi), 0, 0.7, 0.05, home, { attack: 0.015, cents: 0 });
    if (outcome === 'won') { bass(-15); k.vibes(hz(12), 0.8, 0.036, home); }
    else if (outcome === 'back') { bass(-12); [12, 16, 19].forEach((semi, i) => k.celesta(hz(semi), i === 2 ? 0.9 : 0.5, 0.036, home + i * sixteenth() * 0.5, (i - 1) * 0.18)); }
    else if (outcome === 'held') { bass(-12); k.marimba(hz(12), 0.5, 0.04, home, -0.1); k.marimba(hz(15), 0.5, 0.03, home, 0.1); }
    else { bass(-12); k.celesta(hz(12), 0.7, 0.04, home, -0.12); k.celesta(hz(sound.minor ? 15 : sound.open ? 17 : 16), 0.7, 0.03, home, 0.12); }
    return home + sixteenth() * 4;
  } catch { return 0; }
}

export function chapterIncipit(wait = 0) {
  try {
    if (!audio || audio.state !== 'running' || !sound.motif?.length) return;
    const t = audio.currentTime + 0.05 + clamp(Number(wait) || 0, 0, 4);
    incipitAt = t;
    const s = sixteenth();
    const k = kit(outlet(0, { air: 0.45, depth: 0.25, song: 0.2 }), t, 0);
    sound.motif.forEach((semi, i, all) => k.musicBox(hz(fallen(semi) + 12), i === all.length - 1 ? 0.9 : 0.4, 0.028, i * s * 2, (i - (all.length - 1) / 2) * 0.08));
  } catch { /* chapter begins all the same */ }
}

const LEITMOTIFS = Object.freeze({ boof: { voice: 'marimba', notes: [0, 7, 4], gap: 2 } });
export function leitmotif(who, pan = 0) {
  try {
    const m = LEITMOTIFS[who];
    if (!m || !audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.01;
    const heat = hear(`motif:${who}`, t);
    if (heat === null || heat > 2) return;
    const k = kit(outlet(heat, { air: 0.3 }), t, pan);
    const start = toPulse(t, 0.02);
    m.notes.forEach((semi, i) => k.marimba(hz(fallen(semi) - 12), 0.28, 0.05, start + i * sixteenth() * m.gap, pan * 0.3));
  } catch { /* Boof crosses quietly */ }
}

/* ─── Musical configuration, board cues & audition ───────────────────── */

const textures = { wap: 'splat', steps: 'ground' };

export function setSoundFeel(feel = 'written') {
  const jazz = feel === 'jazz';
  if (jazz === sound.jazz) return;
  sound.jazz = jazz;
  sound.swing = swingTarget();
  try { setHarmony(harmony.sigil); } catch { /* room keeps chord */ }
}

export function setSoundConfig({ swing, voicing, motifCues, songSpace, mix, ear, styleVoicing, styleInterval, patternMode, jazzLean: leaning } = {}) {
  if (['chapter', 'straight', 'lilt', 'deep'].includes(swing)) musical.swing = swing;
  if (['folk', 'warm', 'bright', 'velvet'].includes(voicing)) musical.voicing = voicing;
  if (['off', 'room', 'board'].includes(motifCues)) musical.motifCues = motifCues;
  if (['natural', 'close', 'hall'].includes(songSpace)) musical.songSpace = songSpace;
  if (['balanced', 'music', 'ear'].includes(mix)) musical.mix = mix;
  if (['open', 'bright', 'warm', 'near', 'hush'].includes(ear)) musical.ear = ear;
  if (['folk', 'warm', 'bright', 'velvet', ''].includes(styleVoicing)) musical.styleVoicing = styleVoicing;
  if (typeof patternMode === 'string' && patternMode) musical.patternMode = patternMode;
  if (Number.isFinite(Number(styleInterval))) sound.styleInterval = clamp(Number(styleInterval), 0, 14);
  if (leaning != null && Number.isFinite(Number(leaning))) musical.jazzLean = clamp(Number(leaning), 0, 2);
  sound.swing = swingTarget();
  try { retimeSong(); } catch { /* retimed on next context */ }
}

export function setSoundTextures({ wap, steps } = {}) {
  if (TEXTURES.wap.includes(wap)) textures.wap = wap;
  if (TEXTURES.steps.includes(steps)) textures.steps = steps;
}

export function setBoardPosition({ lane = 2, row = 0 } = {}) {
  sound.prevLane = sound.lane;
  sound.prevRow = sound.row;
  sound.lane = clamp(Number(lane) || 0, 0, 4);
  sound.row = clamp(Number(row) || 0, 0, 4);
  if (pad.tone && audio && audio.state === 'running') {
    try { pad.tone.frequency.setTargetAtTime((600 + sound.row * 85) * (sound.padTone || 1), audio.currentTime, 0.2); } catch { /* settles next tick */ }
  }
}

export function setBoardHarmonicState({ tension = '', tensionLevel = 0 } = {}) {
  sound.harmonicTension = tension ? clamp(Number(tensionLevel) || 0.5, 0, 1) : 0;
  if (!pad.voices || !audio || audio.state !== 'running') return;
  try {
    const now = audio.currentTime;
    const norm = tension === '#11' ? 'sharp11' : tension;
    const stretch = norm === 'b9' ? 1 : norm === 'sharp11' ? 6 : norm === 'sus4' ? 5 : 0;
    const topVoice = pad.voices[PAD_VOICES - 1];
    const topSemi = padNow()[PAD_VOICES - 1];
    if (topVoice && Number.isFinite(topSemi)) {
      const targetSemi = stretch ? topSemi - (topSemi % 12) + stretch : topSemi;
      topVoice.forEach(({ osc }) => osc.frequency.setTargetAtTime(hz(targetSemi), now, 0.12));
    }
  } catch { /* pad stays steady */ }
}

export function playBoardMotifCue({ action = 'steer', pan = 0, depth = 0.2, kind = 'clear', tension = '#11', stepIndex = 0, degOffset = null, lane = sound.lane, row = sound.row, prevLane = sound.prevLane, prevRow = sound.prevRow, towardSafe = false, diagonal = false, dir = 1 } = {}) {
  try {
    if (!audio || audio.state !== 'running' || musical.motifCues === 'off') return;
    if (action === 'steer' && musical.motifCues !== 'board') return;
    const t = audio.currentTime + 0.008;
    const heat = hear(`motif-cue:${action}:${kind}`, t);
    if (heat === null || heat > 2.6) return;
    const s = sixteenth();
    const m = sound.motif?.length ? sound.motif : [0, 2, 4, 7, 4];
    const activeVoicing = musical.styleVoicing || musical.voicing;
    const base = fallen(degOffset != null ? degOffset : (m[stepIndex % m.length] ?? 0)) + 12;
    const k = kit(outlet(heat * 0.4, { depth, air: 0.34, song: 0.22, role: action === 'maneuver' ? 'music' : 'cue' }), t, clamp(pan, -1, 1) * 0.45);
    const voice = activeVoicing === 'warm' ? k.vibes : activeVoicing === 'bright' ? k.celesta : activeVoicing === 'velvet' ? k.musicBox : k.kalimba;
    if (action === 'tension') {
      const interval = tension === 'b9' ? 1 : (tension === '#11' || tension === 'sharp11') ? 6 : 5;
      voice(hz(base), 0.16, 0.024, 0, -0.1);
      voice(hz(base + interval), 0.28, 0.028, s * 0.85, 0.12);
      return;
    }
    if (action === 'resolve') {
      const target = sound.jazz ? 14 : 12;
      voice(hz(base + (sound.jazz ? 1 : 0)), 0.14, 0.028, 0, -0.1);
      voice(hz(sungTone(3) + target), 0.36, 0.036, s, 0.12);
      k.marimba(hz(bassLow() + 12), 0.22, 0.03, s);
      return;
    }
    if (action === 'pantry') {
      voice(hz(sungTone(2) + 12), 0.2, 0.024, 0, pan * 0.3);
      voice(hz(sungTone(4) + 12), 0.28, 0.02, s * 1.5, pan * 0.3);
      return;
    }
    if (action === 'story') {
      const degreeIdx = kind === 'room_cast' ? 4 : kind === 'word_ask' ? 5 : kind === 'word_feed' ? 3 : 2;
      voice(hz(sungTone(degreeIdx) + 12), 0.24, 0.024, 0, pan * 0.3);
      if (kind === 'room_cast' || kind === 'parallel') k.vibes(hz(sungTone(degreeIdx + 2) + 12), 0.38, 0.02, s * 1.4, -pan * 0.25);
      return;
    }
    if (action === 'maneuver') {
      boardStepPlan({ lane, row, prevLane, prevRow, kind, towardSafe, diagonal, dir }).notes.forEach((n, idx) => {
        (idx === 2 || (towardSafe && idx > 0) ? k.vibes : voice)(hz(fallen(n.semiOffset)), n.dur, n.vol, n.at, pan * 0.4);
      });
      return;
    }
    const next = fallen(m[(stepIndex + 1) % m.length] ?? (base + 4)) + 12;
    const second = kind === 'low' ? Math.max(base + 5, next) : kind === 'tall' ? base - 3 : next;
    voice(hz(base), 0.14, 0.022, 0, pan * 0.35);
    voice(hz(second), 0.2, 0.026, s * (sound.swing > 0.56 ? 1.3 : 1), pan * 0.35);
  } catch { /* silent cue still informs visually */ }
}

export function feelSample(feel = 'written') {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.05;
    const k = kit(outlet(0, { air: 0.35, song: 0.1 }), t, 0);
    const jazz = feel === 'jazz';
    const chords = jazz ? [[2, 5, 9, 12], [-1, 2, 5, 8], [0, 4, 7, 11]] : [[2, 5, 9], [-1, 2, 7], [0, 4, 7]];
    const roots = [2, 7, 0];
    const beat = 60 / (sound.pulse || 96);
    const swung = jazz ? 2 / 3 : 0.5;
    chords.forEach((chord, c) => {
      const at = c * beat * 1.5;
      k.marimba(hz(roots[c] - 24), 0.5, 0.05, at);
      chord.forEach((semi, i) => k.vibes(hz(semi + 12), c === 2 ? 0.9 : 0.42, 0.024, at + (i % 2 ? swung : 0) * beat * 0.5 + Math.floor(i / 2) * beat * 0.5, (i - 1.5) * 0.12));
    });
  } catch { /* chosen, if unheard */ }
}

export function auditionChapterProgression(feel = sound.jazz ? 'jazz' : 'written') {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.04;
    const k = kit(outlet(0, { air: 0.38, song: 0.16, role: 'music' }), t, 0);
    const jazz = feel === 'jazz';
    const beat = 60 / (sound.pulse || 96);
    const swung = jazz ? 2 / 3 : 0.5;
    const stages = [0.1, 0.4, 0.68, 0.92];
    const m = sound.motif?.length ? sound.motif : [0, 2, 4, 7];
    stages.forEach((p, idx) => {
      const arc = chapterArcPlan({ progress: p, bar: idx, step: 8, stage: 3, chapter: sound.chapter });
      const at = idx * beat * 1.35;
      if (jazz) k.uprightBass(hz(bassLow() + fallen(arc.bassOffset)), 0.42, 0.045, at);
      else k.marimba(hz(bassLow() + fallen(arc.bassOffset)), 0.42, 0.045, at);
      const leadNote = fallen(m[idx % m.length] ?? sungTone(idx + 1)) + 12;
      if (jazz) {
        const jz = jazzPhrasePlan({ progress: p, wobble: idx === 2 ? 0.42 : 0.1, combo: idx, richness: 0.7, step: 6, bar: idx, chapter: sound.chapter });
        compVoicingPlan({ bassOffset: arc.bassOffset, compSemis: jz.compSemis, minor: sound.minor, open: sound.open })
          .slice(0, 4).forEach((s, ci) => k.vibes(hz(s + 12), 0.34, 0.016, at + ci * 0.02, (ci - 1.5) * 0.14));
        if (jz.enclosure) {
          k.celesta(hz(leadNote + 1), 0.1, 0.02, at + beat * 0.35, -0.1);
          k.celesta(hz(leadNote - 1), 0.1, 0.02, at + beat * 0.52, 0.08);
        }
      }
      k.celesta(hz(leadNote), idx === 3 ? 0.65 : 0.36, 0.024, at + beat * swung, (idx - 1.5) * 0.12);
    });
  } catch { /* silent preview fallback */ }
}

/* ─── WAP & playTone tactile cues ────────────────────────────────────── */

export function wapSound(combo = 1, pan = 0, depth = 0, { recipe = '', perfect = false, satisfied = false } = {}) {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.005;
    const heat = hear('wap', t);
    if (heat === null) return;
    const { tone, hiss, honk, celesta, marimba, vibes, sample } = kit(outlet(heat, { depth, air: AIR.wap, role: 'fx' }), t, pan + jitter(0.04));
    const texture = textures.wap;
    if (texture === 'pillow') {
      hiss(700, 120, 0.36, 0.3, 0.6, 0, 'lowpass');
      tone('sine', 140, 52, 0.3, 0.32, 0, { attack: 0.01, cents: 0 });
    } else if (texture === 'cream') {
      tone('sine', 420, 70, 0.26, 0.34, 0, { attack: 0.004, cents: 60 });
      hiss(2400, 300, 0.24, 0.24, 1.6, 0, 'bandpass', 0.3);
      tone('sine', hz(sungTone(0)), hz(sungTone(4)), 0.34, 0.05, 0.12, { attack: 0.03, cents: 0 });
    } else if (texture === 'bell') {
      hiss(1500, 300, 0.12, 0.2, 1.1, 0, 'bandpass', 0.35);
      celesta(hz(sungTone(4) + 12), 0.6, 0.06, 0.04);
      celesta(hz(sungTone(2) + 12), 0.5, 0.03, 0.04);
    } else {
      sample('wap');
      tone('triangle', 380, 58, 0.22, 0.42, 0, { attack: 0.004, cents: 40 });
      tone('sine', 240, 88, 0.14, 0.22, 0.004, { attack: 0.002, cents: 20 });
      hiss(2900, 1250, 0.075, 0.16, 1.7, 0.002, 'bandpass', 0.28);
      hiss(1700, 200, 0.3, 0.36, 1.1, 0, 'bandpass', 0.35);
      hiss(480, 110, 0.34, 0.18, 0.7, 0.02, 'lowpass');
    }
    tone('sine', hz(bassLow()), hz(bassLow()) * 0.98, 0.32, 0.095, 0, { attack: 0.006, cents: 0 });
    tone('sine', hz(bassLow() - 12), 0, 0.28, 0.05, 0, { attack: 0.008, cents: 0 });
    const step = clamp(combo - 1, 0, 4);
    const pulse = pulseFrom(t, 0.15);
    const first = pulse(0);
    const delight = texture === 'pillow' ? (f, d, v, at, p) => marimba(f, d * 2, v * 0.6, at, p) : honk;
    delight(hz(sungTone(2 + step)), 0.1, 0.09, first, -0.08);
    delight(hz(sungTone(3 + step)), 0.12, 0.1, pulse(1), 0.08);
    if (step >= 1) tone('sine', hz(sound.minor ? 3 : sound.open ? 5 : 4), 0, 0.18, 0.03, first, { attack: 0.012, cents: 0 });
    if (step >= 3) celesta(hz(harmony.pcs[harmony.pcs.length - 1] + 12), 0.26, 0.016, pulse(1));
    if (recipe === 'set_jam' || recipe === 'royal') vibes(hz(sungTone(4) + 12), 0.36, 0.022, first, 0.15);
    else if (recipe === 'tempered') celesta(hz(sungTone(5) + 12), 0.28, 0.02, first, -0.15);
    else if (recipe === 'savoury') marimba(hz(sungTone(1)), 0.24, 0.028, first);
    if (designOn() && (perfect || satisfied)) {
      const { vibes: ring, celesta: ting } = kit(outlet(heat, { depth, air: 0.4 }), t, pan);
      const after = pulseFrom(t, 0.15);
      if (perfect) ting(hz(sungTone(6) + 12), 0.5, 0.03, after(2));
      if (satisfied) [2, 4, 7].forEach((i, n) => ring(hz(sungTone(i)), 0.7 - n * 0.1, 0.022, after(2) + n * sixteenth(), (n - 1) * 0.15));
    }
    swellPad(t, WORTH.wap);
  } catch { /* silent WAP is still a WAP */ }
}

/**
 * @param {string} kind
 * @param {any} [param]
 * @param {number} [pan]
 * @param {number} [depth]
 */
export function playTone(kind, param = 1, pan = 0, depth = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear(kind, t);
    if (heat === null) return;
    const role = ['step', 'climb', 'bump', 'slide'].includes(kind)
      ? 'step'
      : ['catch', 'deft', 'berry', 'sweet', 'pantry', 'recipe', 'poise', 'aim', 'story_word', 'story_mark', 'story_feed', 'story_ask', 'room_cast', 'trick', 'power_story', 'story_pass', 'furrow', 'easter_egg', 'theme_flourish'].includes(kind)
        ? 'music'
        : 'fx';
    const kitMap = kit(outlet(heat, { depth, air: AIR[kind] ?? 0.2, song: SONG[kind] || 0, role }), t, pan + jitter(0.04));
    const { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, tock, sample } = kitMap;
    const activeVoicing = musical.styleVoicing || musical.voicing;
    const voiceLead = activeVoicing === 'warm' ? vibes : activeVoicing === 'bright' ? musicBox : activeVoicing === 'velvet' ? kalimba : celesta;
    const renderNotes = (list, delay = 0, leanName = '') => inflectGesture(list, { lean: leanName, amount: jazzLean() }).forEach((n) => {
      const fn = kitMap[n.voice] || voiceLead;
      const pitch = hz((n.bass != null ? bassLow() + n.bass : sungTone(n.deg || 0) + (n.octave || 0)) + (n.semi || 0));
      fn(pitch, n.dur, n.vol, delay + n.at, n.side || 0);
    });
    const answer = toPulse(t);
    const s32 = sixteenth() / 2;
    switch (kind) {
      case 'step': {
        const dir = typeof param === 'object' && param ? (Number(param.dir) || 1) : (Number(param) || 1);
        const lane = typeof param === 'object' && param && param.lane != null ? clamp(Number(param.lane), 0, 4) : sound.lane;
        const row = typeof param === 'object' && param && param.row != null ? clamp(Number(param.row), 0, 4) : sound.row;
        if (textures.steps === 'tiptoe') pluck(hz(sungTone(dir > 0 ? 2 : 1)), 0.036);
        else if (textures.steps === 'felt') { tone('sine', dir > 0 ? 96 : 88, 60, 0.06, 0.032, 0, { attack: 0.006, cents: 0 }); hiss(500, 300, 0.05, 0.012, 0.7, 0, 'lowpass'); }
        else if (textures.steps === 'wood') tock(dir > 0 ? 760 : 680, dir > 0 ? 560 : 500, 0.042);
        else if (sound.ground === 'field') {
          if (!sample('step-field')) { hiss(1400 + (dir > 0 ? 220 : 0), 650, 0.06, 0.045, 1.1); tone('sine', 118, 70, 0.05, 0.035, 0, { cents: 40 }); }
        } else if (!sample('step-city')) {
          tone('triangle', 150 + (dir > 0 ? 14 : 0), 72, 0.04, 0.05, 0, { attack: 0.003, cents: 40 }); hiss(2800, 2000, 0.022, 0.024, 2.5);
        }
        if (musical.motifCues !== 'off') kalimba(hz(fallen(([0, 2, 4, 5, 7][lane] ?? 2) + row * 2)), 0.13, 0.014, s32 * 0.5);
        break;
      }
      case 'climb': {
        const dir = typeof param === 'object' && param ? (Number(param.dir) || 1) : (Number(param) || 1);
        const row = typeof param === 'object' && param && param.row != null ? clamp(Number(param.row), 0, 4) : sound.row;
        const baseSemi = fallen(row * 2);
        const targetSemi = dir > 0 ? baseSemi + 5 : Math.max(-5, baseSemi - 2);
        if (sound.ground === 'field') hiss(1200 + (dir > 0 ? 400 : 0), 500, 0.055, 0.03, 1.2);
        else tock(dir > 0 ? 640 + row * 40 : 520, 440, 0.028);
        voiceLead(hz(baseSemi + 12), 0.11, 0.016, 0);
        voiceLead(hz(targetSemi + 12), 0.16, 0.019, s32 * 0.85);
        break;
      }
      case 'slide':
        hiss(3400, 5600, 0.16, 0.028, 3.2, 0, 'bandpass', 0.25);
        tone('sine', hz(sungTone(4) + 12), hz(sungTone(6) + 12), 0.14, 0.024, 0, { cents: 15 });
        break;
      case 'bump':
        tock(240, 170, 0.045);
        tone('triangle', 120, 74, 0.07, 0.035, 0, { attack: 0.002 });
        break;
      case 'aim': {
        const info = typeof param === 'object' && param ? param : { angle: Number(param) || 0 };
        const idx = clamp(Math.round((info.angle + 0.65) * 4), 0, 6);
        tock(880 + idx * 55, 620 + idx * 35, 0.014);
        voiceLead(hz(sungTone(idx) + 12), info.locked ? 0.22 : 0.09, info.locked ? 0.024 : 0.011, 0);
        if (info.locked) celesta(hz(sungTone(idx + 2) + 12), 0.26, 0.018, s32);
        break;
      }
      case 'story_word':
        renderNotes([{ voice: 'kalimba', deg: typeof param === 'object' && param?.deg != null ? Number(param.deg) : (sound.lane % 5), octave: 0, at: 0, dur: 0.12, vol: 0.012 }], 0, 'story_word');
        break;
      case 'story_mark':
        renderNotes([{ voice: 'celesta', deg: 3, octave: 12, at: 0, dur: 0.2, vol: 0.024 }, { voice: 'celesta', deg: 5, octave: 12, at: answer, dur: 0.24, vol: 0.02 }], 0, 'story_mark');
        break;
      case 'story_feed':
        renderNotes([{ voice: 'vibes', deg: 2, octave: 12, at: 0, dur: 0.28, vol: 0.026 }, { voice: 'vibes', deg: 4, octave: 12, at: s32, dur: 0.34, vol: 0.022 }], 0, 'story_feed');
        break;
      case 'story_ask':
        renderNotes([{ voice: 'musicBox', deg: 4, octave: 12, at: 0, dur: 0.26, vol: 0.024 }, { voice: 'musicBox', deg: 6, octave: 12, at: s32 * 1.4, dur: 0.34, vol: 0.022 }], 0, 'story_ask');
        break;
      case 'room_cast':
        renderNotes([
          { voice: 'marimba', bass: 0, at: 0, dur: 0.4, vol: 0.042 },
          ...[0, 2, 4, 7].map((semi, idx) => ({ voice: 'vibes', deg: idx + 1, octave: 12, semi: fallen(semi) - sungTone(idx + 1), at: idx * s32, dur: 0.36 + idx * 0.08, vol: 0.024, side: (idx - 1.5) * 0.14 }))
        ], 0, 'room_cast');
        break;
      case 'catch': {
        const a = nextNote(t);
        const sing = { porter: marimba, clerk: kalimba, genie: vibes }[sound.carrier] || voiceLead;
        const steep = Number(param) || 0;
        marimba(hz(a - 12), 0.18, 0.028);
        if (sound.jazz && (line.leaning = !line.leaning)) {
          sing(hz(a + 1), 0.07, 0.032);
          sing(hz(a), 0.22, 0.048, s32);
          if (steep > 0.45) vibes(hz(sungFrom(a) + 12), 0.3, 0.022, s32 * 2, -0.15);
        } else sing(hz(a), 0.2, 0.046);
        sing(hz(sungFrom(a)), 0.28, 0.038, answer, 0.12);
        break;
      }
      case 'pocket': {
        const info = typeof param === 'object' && param ? param : { chain: Number(param) || 1 };
        const chain = Number(info.chain ?? param) || 1;
        hiss(6800, 5200, 0.05, 0.028, 3, 0, 'highpass', 0.22);
        marimba(hz(bassLow() + (chain > 1 ? 7 : 0)), 0.14, 0.046);
        if (sound.jazz) {
          const jz = jazzPhrasePlan({ wobble: info.wobble || 0, combo: info.combo || chain, richness: info.richness ?? 0.6, presence: info.presence || '', progress: info.progress || 0, chapter: sound.chapter });
          jz.compSemis.slice(0, chain >= 3 ? 3 : 2).forEach((semi, idx) => vibes(hz(semi + 12), 0.22, 0.016, jz.layback + idx * s32 * 0.6, (idx - 0.5) * 0.16));
        } else if (chain >= 3) voiceLead(hz(sungTone(3) + 12), 0.2, 0.018, s32);
        break;
      }
      case 'poise':
        voiceLead(hz(sungTone(2) + 12), 0.34, 0.024, 0, -0.1);
        voiceLead(hz(sungTone(3) + 12), 0.42, 0.02, s32 * 1.5, 0.1);
        break;
      case 'pantry':
        roomTones().slice(0, 4).forEach((semi, idx) => vibes(hz(semi), 0.42, 0.024, idx * s32, (idx - 1.5) * 0.14));
        marimba(hz(bassLow()), 0.28, 0.05);
        break;
      case 'recipe': {
        const chord = param === 'set_jam' ? [0, 4, 7, 11] : param === 'tempered' ? [0, 2, 7, 14] : param === 'savoury' ? [0, 5, 7, 9] : param === 'blistered' ? [0, 4, 9, 14] : [0, 4, 7, 11, 14];
        marimba(hz(bassLow()), 0.42, 0.075);
        chord.forEach((semi, idx) => (idx % 2 ? celesta : vibes)(hz(semi + 12), 0.45 + idx * 0.06, 0.028, idx * s32, (idx - 1.5) * 0.14));
        break;
      }
      case 'hop': {
        const chain = clamp(Number(param) || 0, 0, 3);
        const target = sungTone(chain) - 12;
        if (sound.jazz && chain >= 1) tone('triangle', hz(target - 1), hz(target), 0.08, 0.042, 0, { attack: 0.004 });
        else pluck(hz(target), 0.06);
        hiss(900, 2300, 0.09, 0.02, 1.4);
        if (chain >= 2) [3, 4, 5].forEach((i, k) => celesta(hz(sungTone(i) + 12), 0.22, 0.014, answer + k * s32, (k - 1) * 0.2));
        break;
      }
      case 'land':
        if (!sample('land')) tone('sine', 150, 68, 0.07, 0.04, 0, { attack: 0.004, cents: 40 });
        if (sound.ground === 'field') hiss(800, 300, 0.08, 0.025, 0.7, 0, 'lowpass', 0.2);
        break;
      case 'deft': {
        const a = nextNote(t, 2);
        const top = sungFrom(sungFrom(a));
        marimba(hz(a), 0.3, 0.05);
        if (sound.jazz) {
          vibes(hz(top - 1), 0.08, 0.026, Math.max(0, answer - s32), -0.08);
          vibes(hz(top + 12), 0.28, 0.02, answer + s32, -0.14);
        }
        marimba(hz(top), 0.36, 0.045, answer, 0.12);
        break;
      }
      case 'throw': hiss(820, 2100, 0.09, 0.09, 2, 0, 'bandpass', 0.1); tone('sine', 280, 420, 0.07, 0.04, 0, { cents: 30 }); break;
      case 'glass': { const f = hz(nextNote(t) + 12); celesta(f, 0.5, 0.06); tone('sine', f * 1.5, 0, 0.3, 0.028, 0.025, { attack: 0.004, side: 0.2 }); break; }
      case 'post': {
        const f = hz(nextNote(t));
        tone('sine', f, 0, 0.4, 0.065, 0, { attack: 0.003 });
        tone('sine', f * 2.76, 0, 0.16, 0.03, 0, { attack: 0.002, side: -0.15 });
        tone('sine', f * 5.4, 0, 0.06, 0.012, 0, { attack: 0.002, side: 0.15 });
        break;
      }
      case 'ramp': { const a = nextNote(t, 2); tone('sine', hz(a - 5), hz(a), 0.13, 0.07); celesta(hz(a + 12), 0.2, 0.02, answer); break; }
      case 'berry': {
        const i = 2 + (Number(param) || 0) % 6;
        vibes(hz(sungTone(i)), 0.42, 0.05);
        vibes(hz(sungTone(i + 1)), 0.52, 0.045, answer, 0.12);
        celesta(hz(sungTone(i + 2) + 12), 0.3, 0.016, answer + s32, -0.14);
        hiss(5200, 7800, 0.18, 0.018, 4, answer, 'bandpass', 0.3);
        line.at = sungTone(i + 1);
        line.last = t;
        break;
      }
      case 'sweet': [0, 1, 2, 3].forEach((k) => vibes(hz(sungTone(k + 3)), 0.55, 0.042, k * s32, (k - 1.5) * 0.15)); celesta(hz(sungTone(5) + 12), 0.65, 0.022, s32 * 4); break;
      case 'rose':
        swell('sine', hz(sungTone(5) + 12), 0.7, 0.032);
        celesta(hz(sungTone(4) + 12), 0.45, 0.034, s32 * 2, 0.1);
        celesta(hz(sungTone(6) + 12), 0.5, 0.026, s32 * 4, -0.1);
        break;
      case 'gift': {
        const n = Math.abs(Number(param) || 1);
        const rival = Number(param) < 0;
        const mag = clamp(Math.floor(Math.log10(Math.max(1, n))) + 1, 1, 4);
        for (let i = 0; i < mag; i += 1) (rival ? marimba : celesta)(hz(sungTone(rival ? 3 - i : 2 + i) + (rival ? -12 : 12)), 0.3 + 0.1 * i, 0.03, i * s32 * 2, (i - (mag - 1) / 2) * 0.2);
        if (mag >= 3) swell('sine', hz(bassLow()), 0.9, 0.035);
        break;
      }
      case 'anthill': [0, 1, 2, 3].forEach((i) => tock(1500 + i * 140, 1100 + i * 90, 0.011, i * 0.028)); break;
      case 'brush':
        if (!designOn()) break;
        hiss(900, 400, 0.12, 0.02, 0.8, 0, 'lowpass');
        marimba(hz(fallen(0) - 12), 0.3, 0.035, s32);
        break;
      case 'haggle': {
        const round = clamp(Number(param) || 0, 0, 2);
        tock(560 - round * 70, 420 - round * 60, 0.05);
        vibes(hz(sound.jazz ? 7 - round : sungTone(4 - round * 2)), 0.32, 0.03, s32 * 2);
        break;
      }
      case 'coin':
        celesta(hz(sound.jazz ? 26 : sungTone(5) + 12), 0.2, 0.04);
        celesta(hz(sound.jazz ? 21 : sungTone(4) + 12), 0.32, 0.035, s32 * 1.5);
        hiss(6200, 5200, 0.05, 0.012, 4, s32 * 1.5);
        break;
      case 'bone':
        marimba(hz(bassLow()), 0.3, 0.13);
        marimba(hz(sungTone(1) - 12), 0.22, 0.06, answer);
        hiss(2600, 1800, 0.02, 0.04, 3);
        break;
      case 'squash': tone('sine', 150, 55, 0.09, 0.12, 0, { cents: 40 }); hiss(380, 120, 0.09, 0.05, 0.8, 0, 'lowpass'); break;
      case 'foretell': swell('triangle', hz(bassLow()), 0.9, 0.05); swell('triangle', hz(bassLow() + 1), 0.9, 0.04, 0.05); hiss(900, 700, 0.7, 0.022, 6, 0, 'bandpass', 0.4); break;
      case 'fulfil': tone('sawtooth', hz(bassLow() + 1), hz(bassLow() - 1), 0.32, 0.07, 0, { cut: 900 }); tone('sine', 90, 55, 0.25, 0.09); hushPad(t); break;
      case 'beaver':
        if (!sample('beaver')) { tock(520, 380, 0.12); tock(470, 340, 0.1, 0.32); }
        else sample('beaver', 0.9, 0.38);
        break;
      case 'share': { const a = nextNote(t); kalimba(hz(a), 0.3, 0.05, 0, -0.25); kalimba(hz(sungFrom(a, -1)), 0.3, 0.045, 0.012, 0.25); break; }
      case 'flour':
        if (!sample('flour')) hiss(640, 170, 0.2, 0.085, 0.8, 0, 'bandpass', 0.28);
        marimba(hz(bassLow() + 7), 0.22, 0.024, s32);
        break;
      case 'wonder': { const plan = wonderSyntaxPlan(param); renderNotes(plan.notes, 0, plan.lean); break; }
      case 'knock': {
        const k = designOn() ? clamp((Number(param) || 0.4) - 0.4, -0.3, 0.4) : 0;
        const f = 2 ** (-k * 1.2);
        const dur = 1 + k;
        const vol = 1 + k * 0.6;
        tone('sine', 108 * f, 50 * f, 0.24 * dur, 0.16 * vol, 0, { attack: 0.003, cents: 12 });
        tone('sine', 114.5 * f, 53 * f, 0.2 * dur, 0.12 * vol, 0.012, { attack: 0.004, cents: 8 });
        hiss(460 * f, 120, 0.16 * dur, 0.07 * vol, 1);
        hushPad(t);
        break;
      }
      case 'foil': {
        tone('square', 520, 180, 0.2, 0.07, 0, { cut: 1200 });
        if (designOn()) {
          tone('triangle', hz(bassLow()), hz(bassLow()) * 0.98, 0.4, 0.13, 0, { attack: 0.006, cents: 0 });
          vibes(hz(sungTone(2) + 12), 0.5, 0.035, answer, -0.15);
          vibes(hz(sungTone(4) + 12), 0.55, 0.03, answer, 0.15);
        }
        const a = nextNote(t);
        celesta(hz(a), 0.2, 0.05, answer);
        celesta(hz(sungFrom(a)), 0.3, 0.045, pulseFrom(t)(1), 0.1);
        break;
      }
      case 'egg': tone('sine', 130.8, 131.2, 0.5, 0.1, 0, { attack: 0.08, cents: 0, side: -0.15 }); tone('sine', 196, 196.5, 0.5, 0.07, 0.03, { attack: 0.08, cents: 0, side: 0.15 }); break;
      case 'spill': {
        tone('triangle', 460, 46, 0.5, 0.22);
        hiss(1400, 150, 0.4, 0.12, 1, 0, 'bandpass', 0.2);
        sample('spill', 1, 0.14);
        hushPad(t);
        const home = toPulse(t, 0.5);
        (sound.minor ? [7, 3, 0] : sound.open ? [7, 5, 0] : [7, 4, 0]).forEach((semi, k) => celesta(hz(semi), k === 2 ? 1.1 : 0.5, 0.04, home + k * sixteenth() * 2, (1 - k) * 0.15));
        break;
      }
      case 'trick': {
        const info = typeof param === 'object' && param ? param : { kind: String(param || 'hop_clear') };
        const plan = trickPlan(info.kind, info);
        if (info.kind === 'mime_glass') hiss(4800, 7400, 0.16, 0.016, 4, 0, 'highpass', 0.35);
        else if (info.kind === 'frill_catch') hiss(1200, 480, 0.09, 0.024, 1.4);
        renderNotes(plan.notes, info.inTime ? answer : 0, JAZZ_LEANS[sound.carrier] ? sound.carrier : info.kind);
        if (sound.carrier && (info.chain >= 3 || info.clears >= 2)) {
          const flourish = themeFlourishPlan(sound.carrier, info.kind);
          if (flourish?.notes?.length) renderNotes(flourish.notes, answer + sixteenth() * 2, JAZZ_LEANS[sound.carrier] || 'poised_69');
        }
        break;
      }
      case 'power_story': {
        const plan = powerStoryPlan(param && typeof param === 'object' ? param : null);
        if (plan.notes.length) renderNotes(plan.notes, answer, plan.role);
        break;
      }
      case 'story_pass': {
        const info = typeof param === 'object' && param ? param : { kind: String(param || '') };
        const plan = obstacleStoryPlan(info.kind);
        if (plan?.notes?.length) renderNotes(plan.notes, 0, plan.lean);
        break;
      }
      case 'furrow': {
        const tilting = Boolean(typeof param === 'object' && param?.tilting);
        marimba(hz(bassLow() + 12), 0.24, 0.045);
        vibes(hz(sungTone(tilting ? 4 : 2) + 12), tilting ? 0.36 : 0.24, 0.024, s32);
        if (tilting) celesta(hz(sungTone(6) + 12), 0.3, 0.018, s32 * 2);
        break;
      }
      case 'splash':
        hiss(1600, 380, 0.14, 0.036, 1.8, 0, 'bandpass', 0.2);
        tone('sine', 210, 82, 0.12, 0.045, 0, { cents: 20 });
        break;
      case 'easter_egg': {
        const info = typeof param === 'object' && param ? param : { kind: String(param || 'pi') };
        const plan = soften(easterEggPlan(info.kind, info), musical.ear);
        if (plan?.notes?.length) renderNotes(plan.notes, plan.delay || 0, plan.lean || sound.carrier || 'poised_69');
        if (info.kind === 'egg_warmth' && musical.ear !== 'hush' && musical.ear !== 'near') {
          tone('sine', 130.81, 131.2, 0.7, 0.08, 0, { attack: 0.09, cents: 0, side: -0.2 });
          tone('sine', 196.0, 196.5, 0.7, 0.06, 0.04, { attack: 0.09, cents: 0, side: 0.2 });
          tone('sine', 317.0, 318.0, 0.6, 0.035, 0.08, { attack: 0.12, cents: 2, side: 0 });
        }
        break;
      }
      case 'theme_flourish': {
        const who = typeof param === 'string' ? param : (param?.who || sound.carrier || 'boof');
        const plan = soften(themeFlourishPlan(who, param?.event || 'trick'), musical.ear);
        if (plan?.notes?.length) renderNotes(plan.notes, answer, JAZZ_LEANS[who] || 'poised_69');
        break;
      }
      case 'voice': {
        const plan = typeof param === 'object' ? param : null;
        const heardPlan = soften(plan, musical.ear);
        if (heardPlan?.notes?.length) renderNotes(heardPlan.notes, 0, heardPlan.lean || 'poised_69');
        break;
      }
      default: break;
    }
    if (WORTH[kind]) swellPad(t, WORTH[kind]);
  } catch { /* silent play still counts */ }
}

/* ─── Scored hooks & place/ambience/material runtime ─────────────────── */

let designOverride = null;
export function setSoundDesign(on) { designOverride = on == null ? null : Boolean(on); }
const designCache = { at: -1e9, on: false };

function designOn() {
  if (designOverride !== null) return designOverride;
  const now = Date.now();
  if (now - designCache.at < 2000) return designCache.on;
  let on = false;
  try {
    const store = globalThis.localStorage;
    const sw = JSON.parse(store?.getItem('lore.switches.v1') || 'null');
    const rec = JSON.parse(store?.getItem('lore.pie.v1') || 'null');
    on = sw?.resolved?.['sound-design'] === 'on' && rec?.sound !== false;
  } catch { on = false; }
  Object.assign(designCache, { at: now, on });
  return on;
}
const scoredLive = () => Boolean(audio && audio.state === 'running' && designOn());

export function shelfColor(v) {
  try {
    const p = designOn() ? shelfColorParams(v) : { ...NEUTRAL_SHELF };
    sound.dry = p.dry;
    sound.padTone = p.padTone;
    if (!audio || audio.state !== 'running' || !bus) return p;
    const t = audio.currentTime;
    bus.soft?.gain.setTargetAtTime(p.bright, t, 1.4);
    bus.roomOut.gain.setTargetAtTime(p.room, t, 1.4);
    bus.feedback?.gain.setTargetAtTime(p.echo, t, 1.4);
    bus.wet?.gain.setTargetAtTime(p.wet, t, 1.4);
    return p;
  } catch { return null; }
}

let stingState = null;

function playPlan(notes, { vol = 1, air = 0.3, pan = 0, voice: forced = '' } = {}) {
  const t = audio.currentTime + 0.01;
  const near = kit(outlet(0, { air, song: 0.2 }), t, pan);
  const far = kit(outlet(0, { depth: 0.65, air: air + 0.2, song: 0.35 }), t, -pan * 0.5);
  const at0 = toPulse(t, 0.02);
  const s = sixteenth();
  let end = 0;
  notes.forEach((n) => {
    const k = n.far ? far : near;
    const semi = (n.bass != null ? bassLow() + n.bass : n.tone != null ? sungTone(n.tone) : n.deg != null ? degree(n.deg) : 0) + (n.semi || 0);
    const f = hz(semi);
    const at = at0 + n.at * s;
    const dur = n.dur || 0.2;
    const level = (n.vol || 0.02) * vol;
    const v = n.voice || forced || 'kalimba';
    if (v === 'tock') k.tock(520, 400, level, at);
    else if (v === 'swell') k.swell('triangle', f, dur, level, at);
    else if (v === 'tone') k.tone('sine', f, 0, dur, level, at, { attack: 0.02, cents: 0 });
    else if (v === 'honk') k.honk(f, dur, level, at);
    else (k[v] || k.kalimba)(f, dur, level, at);
    if (n.glimpse) k.hiss(5200, 7800, 0.16, level * 0.5, 4, at, 'bandpass', 0.3);
    end = Math.max(end, at + dur);
  });
  return end;
}

export function chainSting(shelf, { complete = false } = {}) {
  try {
    if (!scoredLive() || !STINGS[shelf]) return false;
    const gate = admitSting(stingState, shelf, audio.currentTime);
    stingState = gate.state;
    if (!gate.play) return false;
    const air = shelf === 'bonk' ? 0.08 : shelf === 'honk' ? 0.4 : 0.28;
    playPlan(stingPlan(shelf), { vol: gate.vol, air });
    if (complete) {
      const cadence = { shelf, vol: gate.vol, air };
      if (audio.currentTime - pulseSeen < 1.2) pendingCadence = cadence;
      else playPlan(stingPlan(shelf, { complete: true }).filter((n) => n.part === 'cadence'), { vol: gate.vol, air });
    }
    return true;
  } catch { return false; }
}

const foreshadowAt = new Map();
export function foreshadowHear(id, { chapter = 1, appearances = [] } = {}) {
  try {
    if (!scoredLive() || !id) return false;
    const plan = foreshadowPlan(id, { chapter, appearances, movement: 'opening' });
    if (plan.mayLand) return false;
    const now = audio.currentTime;
    if (now - (foreshadowAt.get(id) ?? -99) < 6) return false;
    foreshadowAt.set(id, now);
    playPlan([{ deg: plan.degree, at: 0, dur: 0.5, vol: 0.016, far: true }], { voice: 'celesta', air: 0.42 });
    return true;
  } catch { return false; }
}

export const TROPE_GAP = 6;
const tropeAt = new Map();
export function tropeMotif(tropeId, stageIndex, { refrain = null, again = false } = {}) {
  try {
    if (!scoredLive() || !tropeId) return false;
    const now = audio.currentTime;
    if (!again && now - (tropeAt.get(tropeId) ?? -99) < TROPE_GAP) return false;
    tropeAt.set(tropeId, now);
    const plan = motifPlan(tropeId, stageIndex, { refrain });
    const notesToPlay = sound.jazz ? inflectGesture(plan.notes, { lean: plan.stage, amount: Math.max(1.35, jazzLean()) }) : plan.notes;
    const wait = stingState && now - stingState.last < 0.6 ? 0.6 : 0;
    const go = () => { try { if (scoredLive()) playPlan(notesToPlay, { voice: plan.voice, vol: 1, air: 0.36 }); } catch { /* turns quietly */ } };
    if (wait) setTimeout(go, wait * 1000);
    else go();
    return true;
  } catch { return false; }
}

const voiceAt = new Map();
let voiceBusy = 0;
export function cadenceVoice(who, pattern, { at = 0, lean: leanName = '' } = {}) {
  try {
    if (!scoredLive()) return false;
    const plan = cadencePlan(who, pattern);
    if (plan.rest) { mimeRest(); return true; }
    if (!plan.voiced) return false;
    const now = audio.currentTime;
    if (now < voiceBusy || now - (voiceAt.get(who) ?? -99) < 8) return false;
    voiceAt.set(who, now);
    const t = now + 0.01;
    const k = kit(outlet(0, { depth: 0.35, air: 0.32 }), t, jitter(0.3));
    const beat = 60 / sound.pulse;
    const start = toBeat(t, 0.03) + clamp(Number(at) || 0, 0, 2);
    const play = k[plan.voice] || k.kalimba;
    const notes = leanName && sound.jazz && jazzLean() > 1 ? inflectGesture(plan.notes, { lean: leanName, amount: Math.max(1.35, jazzLean()) }) : plan.notes;
    let end = start;
    notes.filter((n) => n.at < plan.length + 0.2).forEach((n) => {
      const when = start + n.at * beat;
      const grace = n.semi && n.dur <= 0.07;
      const dur = grace ? n.dur : clamp(n.dur * beat * 0.85, 0.06, 0.6);
      if (n.bass) k.tone('sine', hz(bassLow()), 0, dur, n.vol * 1.4, when, { attack: 0.01, cents: 0 });
      else if (n.deg != null) {
        const f = hz(degree(n.deg) + (n.semi || 0) + (who === 'ants' ? 12 : 0));
        if (plan.voice === 'honk') k.honk(f, Math.min(dur, 0.14), n.vol, when);
        else play(f, dur, n.vol, when);
        if (n.chord) k.kalimba(hz(degree(n.deg + 2)), dur, n.vol * 0.6, when);
      }
      end = Math.max(end, when + dur);
    });
    voiceBusy = t + end + 0.5;
    return true;
  } catch { return false; }
}

const ambience = { name: null, bed: null, timer: 0 };

function rainDrop() {
  ambience.timer = 0;
  const drops = ambience.bed?.plan.drops;
  if (!drops || !audio) return;
  ambience.timer = setTimeout(rainDrop, drops.everySec * (0.5 + Math.random()) * 1000);
  try {
    if (audio.state !== 'running') return;
    const t = audioNow() + 0.02;
    const wait = Math.max(0, beatAnchor ? pulseFrom(t, 0.03)(Math.floor(Math.random() * 4)) + jitter(0.012) : Math.random() * 0.2);
    if (t + wait < sound.rest) return;
    const heat = hear('drop', t + wait);
    if (heat === null) return;
    const k = kit(outlet(heat, { depth: 0.2 + Math.random() * 0.6, air: 0.3 }), t, jitter(0.8));
    const f = 4200 * 2 ** jitter(0.4);
    k.hiss(f, f * 0.6, 0.016, drops.level, 1.2, wait);
  } catch { /* rains all the same */ }
}

export function setSoundScene(scene) {
  if (!scene?.acoustic) return false;
  const place = placePlan({ scene });
  sound.ground = place.ground;
  sound.room = place.room;
  try { regroundRoom(); } catch { /* old room will do */ }
  if (ambience.name) setAmbience(place.ambience);
  return true;
}

/** @param {string | null} [name] */
export function setAmbience(name = null) {
  try {
    const plan = ambiencePlan(name);
    const want = plan ? name : null;
    if (!audio) { ambience.name = null; return false; }
    if (want === ambience.name) return Boolean(want);
    const was = ambience.bed;
    clearTimeout(ambience.timer);
    Object.assign(ambience, { name: null, bed: null, timer: 0 });
    if (was) stopAmbienceBed(audio, was);
    if (!want) return false;
    ambience.bed = startAmbienceBed(audio, ensureBus(), buffers.noise, plan);
    ambience.name = want;
    if (plan.drops) ambience.timer = setTimeout(rainDrop, plan.drops.everySec * 1000);
    return true;
  } catch { return false; }
}

export function sceneMaterial(material, pan = 0, { after = 0 } = {}) {
  try {
    const plan = materialPlan(material);
    if (!plan.length || !audio || audio.state !== 'running') return false;
    const wait = clamp(Number(after) || 0, 0, 4);
    const t = audio.currentTime + 0.05 + wait;
    const heat = hear(`material:${material}`, t);
    if (heat === null || heat > 2) return false;
    const k = kit(outlet(heat, { depth: 0.25, air: 0.45, song: 0.15 }), t, clamp(Number(pan) || 0, -0.9, 0.9));
    const first = wait ? 0 : toPulse(t, 0.02);
    const s = sixteenth();
    plan.forEach((n) => {
      const at = first + n.at * s;
      if (n.voice === 'hiss') { k.hiss(n.band[0], n.band[1], n.dur, n.vol, n.q, at, 'bandpass', 0.25); return; }
      const f = hz(n.bass != null ? bassLow() + n.bass : sungTone(n.tone));
      if (n.voice === 'swell') k.swell(n.wave || 'triangle', f, n.dur, n.vol, at);
      else if (n.voice === 'bar') [[1, 1, 1, 0], [2.76, 0.4, 0.46, -0.15], [5.4, 0.15, 0.18, 0.15]].forEach(([part, len, share, side]) => k.tone('sine', f * part, 0, n.dur * len, n.vol * share, at, { attack: 0.003, side }));
      else (k[n.voice] || k.kalimba)(f, n.dur, n.vol, at);
    });
    return true;
  } catch { return false; }
}
