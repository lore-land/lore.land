// @ts-check
/**
 * pie/audio/scored-plans.mjs — pure plans for the scored hooks (shelfColor, chainSting,
 * tropeMotif, cadenceVoice) and acoustic places (rooms, ambiences, materials).
 *
 * Speaker-free: sound-check.mjs verifies every range, silence guard, and negative control
 * directly against these plans. Creative extensions can add new materials or ambience beds
 * via `registerMaterialSound()` and `registerAmbience()`.
 */

import { nameHash } from './harmony.mjs';

const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.min(hi, Math.max(lo, v));

/* ─── Rooms ─── */

export const ROOMS = Object.freeze({
  field: Object.freeze({ secs: 1.8, early: [[0.006, 0.45]], damp: 0.8, bright: 0.5, darken: 0.42, decay: 3.8, onset: 0.025, weighed: false }),
  city: Object.freeze({ secs: 1.2, early: [[0.009, 0.5], [0.017, 0.38], [0.026, 0.3], [0.041, 0.22], [0.057, 0.15]], damp: 0.2, bright: 0.68, darken: 0.5, decay: 5.4, onset: 0.01, weighed: false })
});

const EARLY_SHARE = 0.5;

/**
 * A room, unplayed: bounded tail length, reflection energy, brightness, and decay.
 * @param {unknown} acoustic
 * @returns {{ secs: number, early: number[][], damp: number, bright: number, darken: number, decay: number, onset: number, weighed: boolean }}
 */
export function roomPlan(acoustic) {
  const named = /** @type {any} */ (typeof acoustic === 'string' ? { ground: acoustic } : acoustic || {});
  const base = ROOMS[named.ground === 'field' ? 'field' : 'city'];
  const room = named.room;
  if (!room || typeof room !== 'object') return { ...base, early: base.early.map((e) => [...e]) };
  const secs = clamp(Number.isFinite(room.secs) ? room.secs : base.secs, 0.4, 2.4);
  const damp = clamp(Number.isFinite(room.damp) ? room.damp : base.damp, 0, 1);
  let early = (Array.isArray(room.early) ? room.early : [])
    .filter((/** @type {any} */ e) => Array.isArray(e) && Number.isFinite(e[0]) && Number.isFinite(e[1]) && e[1] > 0)
    .map((/** @type {[number, number]} */ [at, g]) => [clamp(at, 0.001, Math.min(0.25, secs / 2)), clamp(g, 0, 0.6)])
    .sort((/** @type {number[]} */ a, /** @type {number[]} */ b) => a[0] - b[0])
    .slice(0, 8);
  const share = early.reduce((/** @type {number} */ sum, /** @type {number[]} */ [, g]) => sum + g * g, 0);
  if (share > EARLY_SHARE) early = early.map((/** @type {number[]} */ [at, g]) => [at, g * Math.sqrt(EARLY_SHARE / share)]);
  const u = (damp - ROOMS.city.damp) / (ROOMS.field.damp - ROOMS.city.damp);
  const along = (/** @type {number} */ city, /** @type {number} */ field) => city + (field - city) * u;
  const fall = along(ROOMS.city.decay * ROOMS.city.secs, ROOMS.field.decay * ROOMS.field.secs);
  return {
    secs, early, damp,
    bright: along(ROOMS.city.bright, ROOMS.field.bright),
    darken: along(ROOMS.city.darken, ROOMS.field.darken),
    decay: fall / secs,
    onset: early.length ? clamp(early[0][0], 0.005, 0.04) : along(ROOMS.city.onset, ROOMS.field.onset),
    weighed: true
  };
}

/* ─── Scored shelves ─── */

export const SCORED_SHELVES = Object.freeze(['boon', 'bane', 'bone', 'bonk', 'honk']);
export const NEUTRAL_SHELF = Object.freeze({ bright: -6, room: 0.5, echo: 0.22, wet: 0.1, padTone: 1, dry: 0, mode: 'unchanged' });

/**
 * The bed's colour for a five-shelf vector, unplayed. Never selects a key or mode.
 * @param {Record<string, number>} [v]
 */
export function shelfColorParams(v = {}) {
  const raw = SCORED_SHELVES.map((k) => Math.max(0, Number(v?.[k]) || 0));
  const sum = raw.reduce((a, b) => a + b, 0);
  if (!sum) return { ...NEUTRAL_SHELF };
  const [boon, bane, bone, bonk, honk] = raw.map((x) => x / sum - 0.2);
  return {
    bright: clamp(-6 + 5 * boon - 3 * bone + 1.5 * bane, -9, -3),
    room: clamp(0.5 + 0.4 * boon - 0.5 * bonk - 0.25 * bane + 0.15 * bone, 0.3, 0.75),
    echo: clamp(0.22 + 0.32 * honk - 0.15 * bonk, 0.12, 0.38),
    wet: clamp(0.1 + 0.12 * honk - 0.06 * bonk, 0.06, 0.16),
    padTone: clamp(1 + 0.6 * boon - 0.4 * bone, 0.7, 1.4),
    dry: clamp(1.2 * bonk, 0, 0.6),
    mode: 'unchanged'
  };
}

/* ─── Chain stings ─── */

/** @typedef {{ voice?: string, tone?: number, bass?: number, deg?: number, at?: number, dur?: number, vol?: number, far?: boolean, glimpse?: boolean, semi?: number, part?: string }} StingNote */

/** @type {Readonly<Record<string, { set: StingNote[], done: StingNote[] }>>} */
export const STINGS = Object.freeze({
  boon: {
    set: [{ voice: 'vibes', tone: 2, at: 0, dur: 0.35, vol: 0.03 }, { voice: 'vibes', tone: 4, at: 2, dur: 0.45, vol: 0.026, glimpse: true }],
    done: [{ voice: 'vibes', tone: 5, at: 4, dur: 0.4, vol: 0.024 }, { voice: 'musicBox', tone: 6, at: 6, dur: 0.9, vol: 0.022 }]
  },
  bane: {
    set: [{ voice: 'swell', bass: 0, at: 0, dur: 0.55, vol: 0.026 }, { voice: 'swell', bass: 1, at: 0, dur: 0.55, vol: 0.018 }],
    done: [{ voice: 'swell', bass: 1, at: 4, dur: 0.4, vol: 0.02 }, { voice: 'tone', bass: 0, at: 6, dur: 0.7, vol: 0.03 }]
  },
  bone: {
    set: [{ voice: 'marimba', bass: 0, at: 0, dur: 0.25, vol: 0.045 }, { voice: 'marimba', bass: 5, at: 2, dur: 0.3, vol: 0.036 }],
    done: [{ voice: 'marimba', bass: 7, at: 4, dur: 0.3, vol: 0.032 }, { voice: 'marimba', bass: 0, at: 6, dur: 0.5, vol: 0.036 }]
  },
  bonk: {
    set: [{ voice: 'tock', at: 0, vol: 0.045 }, { voice: 'celesta', tone: 4, at: 1, dur: 0.2, vol: 0.02 }, { voice: 'swell', bass: 1, at: 3, dur: 0.35, vol: 0.016 }],
    done: [{ voice: 'tock', at: 3, vol: 0.04 }, { voice: 'tock', at: 6, vol: 0.035 }, { voice: 'celesta', tone: 3, at: 8, dur: 0.6, vol: 0.022 }]
  },
  honk: {
    set: [{ voice: 'honk', tone: 1, at: 0, dur: 0.1, vol: 0.028 }, { voice: 'honk', tone: 2, at: 4, dur: 0.1, vol: 0.012, far: true }],
    done: [{ voice: 'honk', tone: 2, at: 6, dur: 0.1, vol: 0.026 }, { voice: 'honk', tone: 4, at: 7, dur: 0.16, vol: 0.026 }, { voice: 'honk', tone: 4, at: 11, dur: 0.16, vol: 0.011, far: true }]
  }
});

/**
 * A shelf's sting, unplayed: notes in sixteenths, plus cadence when complete.
 * @param {string} shelf
 * @param {{ complete?: boolean }} [opts]
 * @returns {StingNote[]}
 */
export function stingPlan(shelf, { complete = false } = {}) {
  const s = STINGS[shelf];
  if (!s) return [];
  const set = s.set.map((n) => ({ ...n, part: 'set' }));
  if (!complete) return set;
  return [...set, ...s.done.map((n) => ({ ...n, part: 'cadence' }))];
}

export const STING_GAP = 0.9;

/**
 * Rate-limit and soften repeated shelf stings.
 * @param {{ last: number, heat: Record<string, { heat: number, at: number }> } | null} state
 * @param {string} shelf
 * @param {number} now
 */
export function admitSting(state, shelf, now) {
  const s = state || { last: -9, heat: {} };
  if (now - s.last < STING_GAP) return { play: false, vol: 0, state: s };
  const was = s.heat[shelf] || { heat: 0, at: now };
  const heat = was.heat * 0.5 ** ((now - was.at) / 6);
  if (heat > 3) return { play: false, vol: 0, state: s };
  return { play: true, vol: 1 / (1 + 0.6 * heat), state: { last: now, heat: { ...s.heat, [shelf]: { heat: heat + 1, at: now } } } };
}

/* ─── Trope motifs ─── */

/** A trope's deterministic four-note motif in scale degrees. @param {string} id */
export function tropeShape(id) {
  const h = nameHash(id);
  const notes = [h % 3];
  [2, 5, 8].forEach((bit) => {
    const m = ((h >>> bit) % 5) - 2;
    notes.push(clamp(notes[notes.length - 1] + (m || 1), -2, 7));
  });
  return notes;
}

export const TROPE_STAGES = Object.freeze(['seed', 'hint', 'named', 'turned', 'paid']);
const TROPE_VOICES = Object.freeze(['celesta', 'vibes', 'marimba', 'kalimba', 'musicBox']);

/** @param {any} r */
const refrainCount = (r) => clamp(Math.round(Number(typeof r === 'number' ? r : r?.count ?? r?.instances?.length ?? (r ? 2 : 0)) || 0), 0, 3);

/**
 * A trope's motif at a stage (0..4), unplayed.
 * @param {string} id
 * @param {number} stageIndex
 * @param {{ refrain?: unknown }} [opts]
 */
export function motifPlan(id, stageIndex, { refrain = null } = {}) {
  const stage = clamp(Math.round(Number(stageIndex) || 0), 0, 4);
  const shape = tropeShape(id);
  const voice = TROPE_VOICES[nameHash(`${id}:voice`) % TROPE_VOICES.length];
  /** @type {{ deg?: number, bass?: number, at: number, dur: number, vol: number, far?: boolean, voice?: string }[]} */
  let notes = [];
  if (stage === 0) notes = [{ deg: shape[0], at: 0, dur: 0.5, vol: 0.016, far: true }];
  else if (stage === 1) notes = [{ deg: shape[0], at: 0, dur: 0.4, vol: 0.02 }, { deg: shape[1], at: 2, dur: 0.55, vol: 0.02 }];
  else if (stage === 2) notes = shape.map((d, i) => ({ deg: d, at: i * 2, dur: 0.32, vol: 0.024 }));
  else if (stage === 3) notes = [...shape.map((d, i) => ({ deg: 2 * shape[0] - d, at: i * 2, dur: 0.32, vol: 0.024 })), { bass: 9, at: 0, dur: 1.4, vol: 0.018, voice: 'tone' }];
  else notes = [...shape.map((d, i) => ({ deg: d, at: i * 2, dur: 0.3, vol: 0.024 })), { deg: 3, at: 8, dur: 0.3, vol: 0.022 }, { deg: 5, at: 10, dur: 0.9, vol: 0.026 }, { bass: 0, at: 8, dur: 1.4, vol: 0.02, voice: 'tone' }];
  const times = stage >= 2 ? refrainCount(refrain) : 0;
  const melody = notes.filter((n) => n.deg != null);
  const tail = melody.slice(-2);
  const after = Math.max(...notes.map((n) => n.at)) + 4;
  for (let k = 0; k < times; k += 1) tail.forEach((n, i) => notes.push({ deg: n.deg, at: after + k * 6 + i * 2, dur: n.dur, vol: n.vol * 0.6 ** (k + 1), far: true }));
  return { voice, notes, stage: TROPE_STAGES[stage] };
}

/* ─── Character cadence ─── */

/** @type {Readonly<Record<string, string>>} */
const OWN_VOICE = Object.freeze({ boof: 'marimba', ants: 'marimba', genie: 'vibes', boon: 'honk', bane: 'honk', bonewap: 'marimba', porter: 'marimba', clerk: 'kalimba', clown: 'honk' });

/**
 * A character's own time as notes, unplayed. The figure is unvoiced; the mime is the rest.
 * @param {string} who
 * @param {{ steps?: { at: number, dur: number, accent: number, pitch: number, voice: string, rest: boolean, chord?: boolean }[], length?: number }} pattern
 */
export function cadencePlan(who, pattern) {
  if (who === 'figure') return { voiced: false, rest: false, notes: [], why: 'unvoiced: nobody has said' };
  if (who === 'mime') return { voiced: false, rest: true, notes: [], why: 'the mime is the rest' };
  const steps = (pattern?.steps || []).filter((s) => !s.rest).slice(0, 16);
  return {
    voiced: steps.length > 0,
    rest: false,
    voice: OWN_VOICE[who] || 'kalimba',
    length: Math.min(8, Number(pattern?.length) || 8),
    notes: steps.map((s) => ({ deg: s.voice === 'bass' ? null : s.pitch, bass: s.voice === 'bass', at: s.at, dur: s.dur, vol: s.accent >= 2 ? 0.02 : s.accent ? 0.016 : 0.011, chord: Boolean(s.chord) }))
  };
}

/* ─── Places, ambiences, and materials ─── */

/** @typedef {{ level: number, colour: string, band: number[], flutter: { rate: number, depth: number }, drops?: { everySec: number, level: number } }} AmbienceSpec */

/** @type {Readonly<Record<string, AmbienceSpec>>} */
export const AMBIENCES = Object.freeze({
  wind: { level: 0.012, colour: 'pink', band: [120, 900], flutter: { rate: 0.13, depth: 0.55 } },
  rain: { level: 0.005, colour: 'white', band: [1800, 7500], flutter: { rate: 0.31, depth: 0.2 }, drops: { everySec: 0.6, level: 0.011 } },
  lane: { level: 0.01, colour: 'brown', band: [260, 1100], flutter: { rate: 0.19, depth: 0.3 } },
  square: { level: 0.009, colour: 'pink', band: [200, 2400], flutter: { rate: 0.09, depth: 0.35 } },
  court: { level: 0.005, colour: 'white', band: [700, 4200], flutter: { rate: 0.07, depth: 0.15 } },
  hall: { level: 0.012, colour: 'brown', band: [90, 420], flutter: { rate: 0.11, depth: 0.2 } }
});

/** @type {Readonly<Record<string, number>>} */
export const COLOUR_FALL = Object.freeze({ white: 0, pink: -3, brown: -6 });

/** @type {Map<string, AmbienceSpec>} */
const customAmbiences = new Map();

/**
 * Register a new quiet ambient bed for a Book Two scene (bounded to <= 0.012 ceiling).
 * @param {string} name
 * @param {AmbienceSpec} spec
 */
export function registerAmbience(name, spec) {
  const key = String(name || '').trim();
  if (!key || !Array.isArray(spec?.band) || spec.band.length !== 2) return false;
  customAmbiences.set(key, {
    level: clamp(Number(spec.level) || 0.008, 0, 0.012),
    colour: ['white', 'pink', 'brown'].includes(spec.colour) ? spec.colour : 'pink',
    band: [clamp(spec.band[0], 40, 11900), clamp(spec.band[1], 50, 12000)],
    flutter: { rate: clamp(Number(spec.flutter?.rate) || 0.12, 0.01, 0.5), depth: clamp(Number(spec.flutter?.depth) || 0.25, 0, 0.7) },
    ...(spec.drops ? { drops: { everySec: Math.max(0.3, Number(spec.drops.everySec) || 0.6), level: clamp(Number(spec.drops.level) || 0.01, 0, 0.012) } } : {})
  });
  return true;
}

/**
 * A place's bed, unplayed, or null for an unknown name.
 * @param {unknown} name
 * @returns {AmbienceSpec | null}
 */
export function ambiencePlan(name) {
  const a = typeof name === 'string'
    ? (customAmbiences.get(name) || (Object.prototype.hasOwnProperty.call(AMBIENCES, name) ? AMBIENCES[name] : null))
    : null;
  if (!a) return null;
  return { level: a.level, colour: a.colour, band: [...a.band], flutter: { ...a.flutter }, ...(a.drops ? { drops: { ...a.drops } } : {}) };
}

/**
 * Where a place is heard, unplayed: ground, room, and ambience.
 * @param {{ chapter?: number, scene?: any }} [place]
 * @returns {{ ground: string, room: ReturnType<typeof roomPlan> | null, ambience: string | null }}
 */
export function placePlan({ chapter = 1, scene = null } = {}) {
  const acoustic = scene?.acoustic;
  if (!acoustic) return { ground: chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city', room: null, ambience: null };
  return {
    ground: acoustic.ground === 'field' ? 'field' : 'city',
    room: acoustic.room ? roomPlan(acoustic) : null,
    ambience: ambiencePlan(acoustic.ambience) ? acoustic.ambience : null
  };
}

/** @typedef {{ voice: string, at: number, dur: number, vol: number, tone?: number, bass?: number, band?: number[], q?: number, wave?: string }} MaterialNote */

/** @type {Readonly<Record<string, MaterialNote[]>>} */
export const MATERIALS = Object.freeze({
  glass: [{ voice: 'swell', wave: 'sine', tone: 5, at: 0, dur: 0.7, vol: 0.014 }, { voice: 'swell', wave: 'sine', tone: 6, at: 0.2, dur: 0.7, vol: 0.012 }, { voice: 'swell', wave: 'sine', tone: 7, at: 0.4, dur: 0.7, vol: 0.01 }, { voice: 'hiss', band: [6500, 7800], at: 0, dur: 0.5, vol: 0.008, q: 5 }],
  flour: [0.024, 0.018, 0.012].map((vol, i) => ({ voice: 'hiss', band: [900, 300], at: i, dur: 0.16, vol, q: 0.7 })),
  berry: [{ voice: 'vibes', tone: 2, at: 0, dur: 0.3, vol: 0.022 }, { voice: 'vibes', tone: 3, at: 1, dur: 0.3, vol: 0.022 }, { voice: 'vibes', tone: 4, at: 2, dur: 0.45, vol: 0.022 }],
  frost: [0, 0.3, 0.55, 1, 1.35, 1.9, 2.7].map((at, i) => ({ voice: 'hiss', band: [5200, 4400], at, dur: 0.012, vol: 0.018 - 0.0015 * i, q: 3 })),
  ink: [{ voice: 'swell', bass: 0, at: 0, dur: 0.8, vol: 0.022 }],
  brass: [{ voice: 'bar', bass: 12, at: 0, dur: 0.6, vol: 0.026 }],
  steam: [{ voice: 'hiss', band: [400, 2400], at: 0, dur: 0.7, vol: 0.024, q: 1.5 }],
  oak: [{ voice: 'marimba', bass: 12, at: 0, dur: 0.3, vol: 0.03 }, { voice: 'hiss', band: [2500, 2300], at: 0, dur: 0.03, vol: 0.012, q: 3 }]
});

/** @type {Map<string, MaterialNote[]>} */
const customMaterials = new Map();

/**
 * Register a new material's sonic gesture (clamped under the quiet voice ceiling 0.03).
 * @param {string} material
 * @param {MaterialNote[]} notes
 */
export function registerMaterialSound(material, notes) {
  const key = String(material || '').trim();
  if (!key || !Array.isArray(notes) || !notes.length) return false;
  customMaterials.set(key, notes.map((n) => ({
    ...n,
    vol: clamp(Number(n.vol) || 0.015, 0.001, 0.03),
    dur: clamp(Number(n.dur) || 0.25, 0.01, 0.9),
    at: clamp(Number(n.at) || 0, 0, 4),
    ...(n.band ? { band: [...n.band] } : {})
  })));
  return true;
}

/**
 * A material's gesture, unplayed.
 * @param {unknown} material
 * @returns {MaterialNote[]}
 */
export function materialPlan(material) {
  const list = typeof material === 'string'
    ? (customMaterials.get(material) || (Object.prototype.hasOwnProperty.call(MATERIALS, material) ? MATERIALS[material] : []))
    : [];
  return list.map((n) => ({ ...n, ...(n.band ? { band: [...n.band] } : {}) }));
}
