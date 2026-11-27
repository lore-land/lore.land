// @ts-check
/**
 * pie/audio/harmony.mjs — chapter keys, room sigil colours, level cells, four-movement arcs,
 * foreshadow degrees, and cross-host harmonic number-theory bridges.
 *
 * Pure and speaker-free: sound-check.mjs, pie-sound.mjs, and cross-host tools share one
 * harmonic truth without needing an AudioContext.
 */

const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.min(hi, Math.max(lo, v));

export const ROOTS = Object.freeze([293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23]);
export const PULSES = Object.freeze([96, 92, 104, 88, 100, 108, 96, 92, 112, 84, 100, 104, 96, 90, 108]);
export const MAJOR = Object.freeze([0, 2, 4, 7, 9]);
export const MINOR = Object.freeze([0, 3, 5, 7, 10]);
export const JAZZ_MAJOR = Object.freeze([0, 2, 4, 5, 7, 9, 11]);
export const DORIAN = Object.freeze([0, 2, 3, 5, 7, 9, 10]);
export const OPEN = Object.freeze([0, 2, 5, 7, 10]);

/** @typedef {{ bass: number, pcs: readonly number[], minor?: { bass: number, pcs: readonly number[] } }} ColourSpec */

/** @type {Readonly<Record<string, ColourSpec>>} */
export const COLOURS = Object.freeze({
  '.': { bass: 0, pcs: [0, 4, 7] },
  '!': { bass: 0, pcs: [0, 7] },
  '?': { bass: 0, pcs: [0, 2, 7] },
  '~': { bass: 5, pcs: [0, 4, 5, 9] },
  '@': { bass: 9, pcs: [0, 4, 9] },
  '&': { bass: 0, pcs: [0, 2, 4, 7] },
  '*': { bass: 0, pcs: [0, 4, 7, 9], minor: { bass: 0, pcs: [0, 3, 7, 10] } },
  '^': { bass: 7, pcs: [0, 2, 7] },
  '#': { bass: 4, pcs: [4, 7, 11] },
  '=': { bass: 2, pcs: [2, 9], minor: { bass: 7, pcs: [2, 7] } },
  '%': { bass: 2, pcs: [2, 5, 9], minor: { bass: 10, pcs: [2, 5, 10] } },
  '$': { bass: 5, pcs: [0, 5, 9] }
});

/** @type {Readonly<Record<string, ColourSpec>>} */
export const JAZZ = Object.freeze({
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

/** @type {Readonly<Record<number, number>>} */
export const FALLS = Object.freeze({ 4: 3, 9: 8, 11: 10 });
/** @type {Readonly<Record<number, number>>} */
export const RAISES = Object.freeze({ 4: 5, 9: 10, 11: 10 });

/**
 * A room's chord as a plan, with no audio: its bass, its tones, the scale the line walks, and the tones it sings.
 * @param {string} sigil
 * @param {{ jazz?: boolean, minor?: boolean, open?: boolean }} [opts]
 */
export function colourPlan(sigil, { jazz = false, minor = false, open = false } = {}) {
  const table = jazz ? JAZZ : COLOURS;
  const base = table[sigil] || table['.'];
  const own = minor && base.minor ? base.minor : null;
  const colour = own || base;
  const fall = (/** @type {number} */ pc) => (minor && !own ? (FALLS[pc] ?? pc) : open ? (RAISES[pc] ?? pc) : pc);
  const scale = minor ? (jazz ? DORIAN : MINOR) : open ? OPEN : jazz ? JAZZ_MAJOR : MAJOR;
  const pcs = [...new Set(colour.pcs.map(fall))].sort((a, b) => a - b);
  let sung = pcs.filter((pc) => scale.includes(pc));
  if (sung.length < 2) sung = [...new Set([...sung, 0, 7])].sort((a, b) => a - b);
  return { sigil: table[sigil] ? sigil : '.', bass: fall(colour.bass), pcs, sung, scale: [...scale] };
}

/** @typedef {{ id: string, bridge?: string, comp?: string, harmony?: string, turnaround?: string, rising?: string, guide?: string }} LevelCell */

/** One cell of the shared form, per chapter, taken from `.spw/runtime/pie-levels.spw`. @type {Readonly<Record<number, Readonly<LevelCell>>>} */
export const LEVEL_CELLS = Object.freeze({
  2: Object.freeze({ id: 'late_echo', bridge: 'backdoor' }),
  6: Object.freeze({ id: 'threes', comp: 'charleston' }),
  7: Object.freeze({ id: 'uneven_oath', harmony: 'swing_only' }),
  9: Object.freeze({ id: 'missing_ninth', turnaround: 'withhold' }),
  10: Object.freeze({ id: 'three_in_four', rising: 'pedal' }),
  11: Object.freeze({ id: 'early_bloom', guide: 'anticipate' }),
  12: Object.freeze({ id: 'two_currents', rising: 'complement' }),
  14: Object.freeze({ id: 'one_beat', turnaround: 'single' }),
  15: Object.freeze({ id: 'three_knocks', turnaround: 'tries' })
});

/** A foreshadow's parked scale degrees (never the root). */
export const DEBT_PCS = Object.freeze([2, 4, 5, 7, 9]);

/** @param {number} degree */
export const debtPc = (degree) => DEBT_PCS[(Math.round(Number(degree) || 1) - 1 + DEBT_PCS.length) % DEBT_PCS.length];

/** Step a downbeat off a parked degree. @param {number} semi @param {number | null | undefined} degree */
export const offDebt = (semi, degree) => {
  if (degree == null) return semi;
  const pc = ((semi % 12) + 12) % 12;
  if (pc !== debtPc(degree)) return semi;
  return semi + 2;
};

/** Deterministic FNV-1a 32-bit hash for trope/foreshadow IDs. @param {unknown} text */
export function nameHash(text) {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.codePointAt(0) || 0; h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** A foreshadow's parked scale degree, 1 through 5, never the root. @param {string} id */
export function foreshadowDegree(id) {
  return (nameHash(String(id || 'mark')) % DEBT_PCS.length) + 1;
}

/**
 * Where a foreshadow stands across its chapter appearances.
 * @param {string} id
 * @param {{ chapter?: number, appearances?: number[], movement?: string }} [opts]
 */
export function foreshadowPlan(id, { chapter = 1, appearances = [], movement = '' } = {}) {
  const degree = foreshadowDegree(id);
  const chs = [...new Set((appearances || []).map((n) => Math.floor(Number(n))).filter((n) => n > 0))].sort((a, b) => a - b);
  const chapterN = Math.max(1, Math.floor(Number(chapter) || 1));
  if (!chs.length) return { id: String(id || ''), degree, stage: 'whisper', mayLand: false, turned: false, first: null, last: null, appearances: /** @type {number[]} */ ([]) };
  const first = chs[0];
  const last = chs[chs.length - 1];
  const idx = chs.indexOf(chapterN);
  const onlyHere = chs.length === 1;
  const mayLand = chapterN === last && (!onlyHere || movement === 'turnaround');
  let stage = 'glimpse';
  if (idx < 0 || chapterN < first) stage = 'whisper';
  else if (idx === 0 && !onlyHere) stage = 'whisper';
  else if (mayLand) stage = 'reveal';
  else if (chapterN === last || idx === chs.length - 2) stage = 'passage';
  return { id: String(id || ''), degree, stage, mayLand, turned: stage === 'passage', first, last, appearances: chs };
}

/**
 * Four-movement harmonic progression through a chapter (`0..1` progress):
 * opening -> rising -> bridge -> turnaround, modulated by LEVEL_CELLS.
 * @param {{ progress?: number, bar?: number, step?: number, stage?: number, chapter?: number }} [opts]
 */
export function chapterArcPlan({ progress = 0, bar = 0, step = 0, stage = 1, chapter = 0 } = {}) {
  const p = clamp(Number(progress) || 0, 0, 1);
  const inPhrase = ((Math.floor(Number(bar) || 0) % 4) + 4) % 4;
  const movement = p < 0.25 ? 'opening' : p < 0.55 ? 'rising' : p < 0.82 ? 'bridge' : 'turnaround';
  const cell = LEVEL_CELLS[Math.floor(Number(chapter) || 0)] || null;
  let bassCycle = movement === 'opening'
    ? [0, 0, 0, 5]
    : movement === 'rising'
      ? [0, 5, 2, 7]
      : movement === 'bridge'
        ? [-3, 5, 4, 7]
        : [2, 7, 0, 7];
  let guideCycle = movement === 'opening'
    ? [4, 4, 3, 2]
    : movement === 'rising'
      ? [4, 5, 2, 11]
      : movement === 'bridge'
        ? [3, 9, 8, 11]
        : [5, 11, 4, 9];
  const pedalHolds = Boolean(cell?.rising === 'pedal' && movement === 'rising');
  const withhold = Boolean(cell?.turnaround === 'withhold' && movement === 'turnaround');
  const single = Boolean(cell?.turnaround === 'single' && movement === 'turnaround');
  const tries = Boolean(cell?.turnaround === 'tries' && movement === 'turnaround');
  const complement = Boolean(cell?.rising === 'complement' && (movement === 'rising' || movement === 'bridge'));
  const anticipate = Boolean(cell?.guide === 'anticipate');
  if (cell?.bridge === 'backdoor' && movement === 'bridge') bassCycle = [0, 10, 5, 0];
  if (pedalHolds) bassCycle = [0, 0, 0, 5];
  if (withhold) bassCycle = [2, 7, 7, 2];
  if (single) { bassCycle = [0, 0, 0, 0]; guideCycle = [4, 4, 4, 4]; }
  if (tries) bassCycle = [2, 7, 5, 0];
  const bassOffset = bassCycle[inPhrase];
  const guideToneOffset = guideCycle[inPhrase];
  const turnOffset = step === 12 ? (movement === 'turnaround' ? 2 : 7) : (movement === 'bridge' ? 4 : -5);
  const motifForm = movement === 'opening' ? 'prime' : movement === 'rising' ? 'answer' : movement === 'bridge' ? 'inversion' : 'resolve';
  const harmonyRole = movement === 'opening' ? 'tonic_pedal' : movement === 'rising' ? 'subdominant_walk' : movement === 'bridge' ? 'mediant_bridge' : 'cadential_ii_V_I';
  /** @type {number | null} */
  let motifDeg = (step === 8 && stage >= 2 && movement !== 'opening')
    ? (movement === 'rising' ? (inPhrase % 2 ? 2 : 1) : movement === 'bridge' ? 3 + (inPhrase % 2) : 4)
    : (step === 12 && stage >= 2 && movement === 'turnaround')
      ? 5
      : null;
  if (withhold || single) motifDeg = null;
  return {
    movement,
    inPhrase,
    bassOffset,
    guideToneOffset,
    turnOffset,
    motifForm,
    harmonyRole,
    motifDeg,
    cell: cell?.id || '',
    pedalHolds,
    withhold,
    single,
    tries,
    complement,
    anticipate,
    volMul: movement === 'turnaround' ? 1.15 : movement === 'bridge' ? 1.08 : 1
  };
}

/**
 * Cross-host harmonic number-theory bridge (audio-jazz-rhythm/PLAN.md):
 * computes the chapter's mod-13 ring seat (Book One <-> Book Two octave twin),
 * continued-fraction Pythagorean comma convergents (1/2, 3/5, 7/12 vs 2^(7/12)),
 * and bounded earcon ratios for cross-host ^ear{} export.
 * @param {number} [chapter]
 */
export function harmonicBridgePlan(chapter = 1) {
  const ch = Math.max(1, Math.floor(Number(chapter) || 1));
  const ringSeat = ((ch - 1) % 13) + 1;
  const book = Math.floor((ch - 1) / 13) + 1;
  const rootHz = ROOTS[(ch - 1) % ROOTS.length] || 293.66;
  const pulseBpm = PULSES[(ch - 1) % PULSES.length] || 96;
  const commaRatio = 531441 / 524288;
  return {
    chapter: ch,
    book,
    ringSeat,
    octaveTwin: book === 1 ? ch + 13 : ringSeat,
    rootHz,
    pulseBpm,
    commaCents: Number((1200 * Math.log2(commaRatio)).toFixed(2)),
    convergents: Object.freeze([
      { label: '1/2', ratio: 2 ** (1 / 2), cents: 600 },
      { label: '3/5', ratio: 2 ** (3 / 5), cents: 720 },
      { label: '7/12', ratio: 2 ** (7 / 12), cents: 700 },
      { label: '3/2', ratio: 1.5, cents: Number((1200 * Math.log2(1.5)).toFixed(2)) }
    ]),
    earSpell: `^ear{ .chapter[${ch}] .ring[${ringSeat}] %tempo[${pulseBpm}] %root[${Math.round(rootHz)}] }`
  };
}
