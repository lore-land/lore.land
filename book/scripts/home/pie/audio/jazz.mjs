// @ts-check
/**
 * pie/audio/jazz.mjs — shared jazz vocabulary, voice-led comping, target-driven walking bass,
 * density ducking, multi-dimensional phrase planning, and 16-step beat pockets.
 *
 * Pure and speaker-free. Creative extensions can register custom jazz styles or lean mappings
 * at runtime via `registerJazzStyle()` and `registerJazzLean()` without mutating frozen defaults.
 */

import { motifMemoryPlan } from '../../../modules/audio-model.mjs';
import { FALLS, RAISES, LEVEL_CELLS, chapterArcPlan, foreshadowPlan, debtPc } from './harmony.mjs';

const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.min(hi, Math.max(lo, v));

/** @typedef {{ voicing: readonly number[], enclosure: boolean, layback: number, pass: number | null, approach: number }} JazzStyleSpec */

/** @type {Readonly<Record<string, Readonly<JazzStyleSpec>>>} */
export const JAZZ_STYLES = Object.freeze({
  poised_69: Object.freeze({ voicing: [4, 7, 9, 14], enclosure: false, layback: 0.014, pass: null, approach: -1 }),
  enclosure: Object.freeze({ voicing: [3, 7, 10, 14], enclosure: true, layback: 0.004, pass: 6, approach: 1 }),
  altered_dominant: Object.freeze({ voicing: [4, 8, 10, 13], enclosure: true, layback: 0.004, pass: 1, approach: 1 }),
  lydian_court: Object.freeze({ voicing: [4, 6, 9, 14], enclosure: false, layback: 0.014, pass: null, approach: -1 }),
  bebop_bite: Object.freeze({ voicing: [1, 6, 10, 13], enclosure: true, layback: 0.004, pass: 1, approach: 1 }),
  open_quartal: Object.freeze({ voicing: [5, 10, 14, 19], enclosure: false, layback: 0.009, pass: 7, approach: -2 }),
  backdoor_cadence: Object.freeze({ voicing: [3, 7, 10, 14], enclosure: false, layback: 0.012, pass: 10, approach: -2 }),
  upper_structure: Object.freeze({ voicing: [6, 9, 11, 16], enclosure: true, layback: 0.008, pass: 6, approach: 2 })
});

/** @type {Readonly<Record<string, string>>} */
export const JAZZ_LEANS = Object.freeze({
  boon: 'lydian_court', bane: 'bebop_bite', bone: 'open_quartal',
  lag: 'poised_69', lit: 'lydian_court', unkept: 'enclosure', echoes: 'poised_69', honk: 'bebop_bite', true_aim: 'enclosure', settle: 'open_quartal', glimpse: 'lydian_court',
  hop_clear: 'enclosure', apex: 'poised_69', mime_glass: 'altered_dominant', pierce: 'bebop_bite', shield_hold: 'open_quartal', frill_catch: 'poised_69', unkept_pass: 'enclosure', bank_score: 'altered_dominant',
  genie: 'lydian_court', clerk: 'bebop_bite', bonewap: 'open_quartal', boof: 'poised_69',
  seed: 'poised_69', hint: 'enclosure', named: 'lydian_court', turned: 'backdoor_cadence', paid: 'upper_structure',
  creature: 'lydian_court', antique: 'backdoor_cadence', artifact: 'open_quartal', contrivance: 'bebop_bite', bracework: 'upper_structure', saying: 'poised_69',
  story_word: 'poised_69', story_mark: 'enclosure', story_feed: 'lydian_court', story_ask: 'backdoor_cadence', room_cast: 'upper_structure',
  court: 'lydian_court', clowns: 'lydian_court', wap: 'upper_structure',
  scheme: 'bebop_bite', march: 'bebop_bite', mimes: 'bebop_bite',
  receipt: 'open_quartal', frame: 'open_quartal', dividers: 'open_quartal',
  mimewall: 'altered_dominant', grudge: 'altered_dominant',
  echo: 'backdoor_cadence', rhythm: 'lydian_court',
  easter_egg: 'poised_69', theme_flourish: 'lydian_court', egg_warmth: 'lydian_court',
  pi: 'poised_69', golden: 'lydian_court', shepard: 'open_quartal', boof_perk: 'poised_69', genie_wish: 'lydian_court'
});

/** @type {Map<string, Readonly<JazzStyleSpec>>} */
const customStyles = new Map();
/** @type {Map<string, string>} */
const customLeans = new Map();

/**
 * Register a custom jazz voicing/inflection style for creator @style packs or Book Two extensions.
 * @param {string} id
 * @param {JazzStyleSpec} spec
 */
export function registerJazzStyle(id, spec) {
  const key = String(id || '').trim();
  if (!key || !Array.isArray(spec?.voicing) || !spec.voicing.length) return false;
  customStyles.set(key, Object.freeze({
    voicing: Object.freeze(spec.voicing.map(Number).filter(Number.isFinite)),
    enclosure: Boolean(spec.enclosure),
    layback: clamp(Number(spec.layback) || 0, 0, 0.04),
    pass: spec.pass == null ? null : Number(spec.pass),
    approach: clamp(Number(spec.approach) || -1, -3, 3)
  }));
  return true;
}

/**
 * Map a custom lean/event/character key to a built-in or registered jazz style.
 * @param {string} key
 * @param {string} styleId
 */
export function registerJazzLean(key, styleId) {
  const cleanKey = String(key || '').trim();
  const cleanStyle = String(styleId || '').trim();
  if (!cleanKey || (!JAZZ_STYLES[cleanStyle] && !customStyles.has(cleanStyle))) return false;
  customLeans.set(cleanKey, cleanStyle);
  return true;
}

/** @param {string} styleId @returns {Readonly<JazzStyleSpec>} */
const styleSpec = (styleId) => customStyles.get(styleId) || JAZZ_STYLES[styleId] || JAZZ_STYLES.poised_69;

/** @type {Readonly<Record<string, string>>} */
const MOTIVATION_FEEDS = Object.freeze({
  mimewall: 'bane', grudge: 'bane', echo: 'boon', rhythm: 'boon', receipt: 'clear', frame: 'clear', dividers: 'clear'
});
const SCHEMES_END = 12;

/** @param {string} lean */
export function jazzStyleFor(lean) {
  if (customStyles.has(lean) || JAZZ_STYLES[lean]) return lean;
  return customLeans.get(lean) || JAZZ_LEANS[lean] || 'poised_69';
}

/**
 * Inflect a gesture's notes in its lean's jazz style (layback + grace approach / enclosure).
 * @template {{ deg?: number, bass?: number, octave?: number, semi?: number, at: number, dur: number, vol: number, voice?: string, side?: number }} N
 * @param {N[]} notes
 * @param {{ lean?: string, amount?: number }} [opts]
 * @returns {(N & { semi?: number })[]}
 */
export function inflectGesture(notes, { lean = '', amount = 0 } = {}) {
  const extra = clamp((Number(amount) || 0) - 1, 0, 1);
  if (!extra || !notes?.length) return notes;
  const spec = styleSpec(jazzStyleFor(lean));
  const sit = spec.layback * 2 * extra;
  let land = -1;
  notes.forEach((n, i) => { if (n.deg != null && (land < 0 || n.at >= notes[land].at)) land = i; });
  const grace = 0.045 * extra;
  /** @type {(N & { semi?: number })[]} */
  const out = notes.map((n, i) => ({ ...n, at: n.at + sit + (i === land ? grace : 0) }));
  if (land >= 0) {
    const to = notes[land];
    out.push({ ...to, semi: (to.semi || 0) + spec.approach, at: to.at + sit, dur: 0.06, vol: to.vol * 0.55 });
    if (spec.enclosure && extra >= 0.5) out.push({ ...to, semi: (to.semi || 0) - spec.approach, at: to.at + sit + grace * 0.5, dur: 0.05, vol: to.vol * 0.45 });
  }
  return out.sort((a, b) => a.at - b.at);
}

/**
 * Pure rootless voice-led jazz comping plan (Bill Evans A/B rootless register `[0, 16]`).
 * @param {{ bassOffset?: number, compSemis?: readonly number[], minor?: boolean, open?: boolean, prevVoicing?: number[] | null, parked?: number | null }} [opts]
 * @returns {number[]}
 */
export function compVoicingPlan({ bassOffset = 0, compSemis = [4, 7, 9, 14], minor = false, open = false, prevVoicing = null, parked = null } = {}) {
  const bass = Number(bassOffset) || 0;
  const modal = (/** @type {number} */ pc) => (minor ? (FALLS[pc] ?? pc) : open ? (RAISES[pc] ?? pc) : pc);
  const rawPcs = [...new Set((compSemis || [4, 7, 9]).map((s) => modal(((bass + s) % 12 + 12) % 12)))];
  const foldIn = (/** @type {number} */ pc, /** @type {number | null} */ anchor) => {
    const candidates = [pc, pc + 12, pc - 12].filter((x) => x >= 0 && x <= 16);
    if (!candidates.length) return clamp(pc, 0, 16);
    if (anchor == null) return candidates[0];
    return candidates.reduce((best, c) => (Math.abs(c - anchor) < Math.abs(best - anchor) ? c : best), candidates[0]);
  };
  /** @type {number[]} */
  let voiced;
  if (Array.isArray(prevVoicing) && prevVoicing.length) {
    const used = new Set();
    voiced = rawPcs.map((pc, idx) => {
      const anchor = prevVoicing[Math.min(idx, prevVoicing.length - 1)];
      let note = foldIn(pc, anchor);
      if (used.has(note)) {
        const alt = [pc, pc + 12].find((x) => x >= 0 && x <= 16 && !used.has(x));
        if (alt != null) note = alt;
      }
      used.add(note);
      return note;
    }).sort((a, b) => a - b);
  } else {
    voiced = rawPcs.map((pc, idx) => {
      const base = idx === 0 && pc > 9 ? pc - 12 : pc;
      return clamp(base < 0 ? base + 12 : base, 0, 16);
    }).sort((a, b) => a - b);
  }
  if (parked != null && voiced.length) {
    const parkedPc = debtPc(parked);
    const topIdx = voiced.length - 1;
    if (((voiced[topIdx] % 12) + 12) % 12 === parkedPc) {
      voiced[topIdx] = clamp(voiced[topIdx] + 2, 0, 16);
      voiced.sort((a, b) => a - b);
    }
  }
  return voiced;
}

/**
 * Pure 4-beat target-driven jazz walking bass plan connecting this bar's chord root to the next bar's root.
 * @param {{ progress?: number, bar?: number, chapter?: number, jazz?: boolean, minor?: boolean, tritoneSub?: boolean, backdoor?: boolean, feeds?: string, passOffset?: number | null }} [opts]
 * @returns {{ notes: number[], target: number, approach: 'chromatic_up' | 'chromatic_down' | 'tritone' | 'backdoor' | 'dominant' | 'pedal' | 'withhold' | 'single' }}
 */
export function walkingBassPlan({ progress = 0, bar = 0, chapter = 0, jazz = true, minor = false, tritoneSub = false, backdoor = false, feeds = '', passOffset = null } = {}) {
  const arc = chapterArcPlan({ progress, bar, step: 0, stage: 2, chapter });
  const nextArc = chapterArcPlan({ progress, bar: (Number(bar) || 0) + 1, step: 0, stage: 2, chapter });
  const root = arc.bassOffset;
  const target = nextArc.bassOffset;
  if (arc.single) return { notes: [0, 0, 0, 0], target, approach: 'single' };
  if (arc.pedalHolds) return { notes: [root, root, root, root], target, approach: 'pedal' };
  if (arc.withhold) return { notes: [root, root + (minor ? 3 : 4), root + 7, 7], target, approach: 'withhold' };
  const third = minor ? 3 : 4;
  const diff = target - root;
  const beat2 = diff > 2 ? root + 2 : diff < -2 ? root - 2 : root + third;
  const beat3 = diff === 0 ? root + 7 : Math.abs(target - (root + 7)) <= 5 ? root + 7 : target + (diff > 0 ? -2 : 2);
  let beat4;
  /** @type {'chromatic_up' | 'chromatic_down' | 'tritone' | 'backdoor' | 'dominant' | 'pedal' | 'withhold' | 'single'} */
  let approach = 'chromatic_up';
  if (tritoneSub || feeds === 'bane') {
    beat4 = target + 1;
    approach = 'tritone';
  } else if (backdoor) {
    beat4 = 10;
    approach = 'backdoor';
  } else if (feeds === 'clear') {
    beat4 = target + 7 > 11 ? target - 5 : target + 7;
    approach = 'dominant';
  } else if (!jazz) {
    beat4 = arc.turnOffset;
    approach = 'dominant';
  } else if (passOffset != null && (arc.inPhrase === 3 || arc.movement === 'turnaround')) {
    beat4 = passOffset === -1 ? target - 1 : passOffset === 1 ? target + 1 : target - 1;
    approach = beat4 > target ? 'chromatic_down' : 'chromatic_up';
  } else if (diff < 0) {
    beat4 = target + 1;
    approach = 'chromatic_down';
  } else {
    beat4 = target - 1;
    approach = 'chromatic_up';
  }
  return { notes: [root, beat2, beat3, beat4], target, approach };
}

/**
 * Pure rhythm-section density ducking under high-combo or dense activity runs.
 * @param {{ combo?: number, stage?: number, pace?: number | null, recentHeat?: number }} [opts]
 * @returns {{ compGain: number, rideGain: number, maxVoices: number, skipOffComp: boolean }}
 */
export function densityDuckFactor({ combo = 0, stage = 1, pace = null, recentHeat = 0 } = {}) {
  const c = Math.max(0, Number(combo) || 0);
  const h = Math.max(0, Number(recentHeat) || 0);
  const taut = pace == null ? 0.5 : clamp(Number(pace) > 1 ? Number(pace) / 9 : Number(pace), 0, 1);
  const pressure = clamp((Math.max(0, c - 2) * 0.065) + (h * 0.08) + (stage >= 3 ? 0.06 : 0) + (taut > 0.75 ? 0.05 : 0), 0, 0.45);
  const compGain = clamp(1 - pressure, 0.55, 1);
  const rideGain = clamp(1 - pressure * 0.85, 0.58, 1);
  const maxVoices = pressure >= 0.34 ? 2 : pressure >= 0.18 ? 3 : 4;
  return { compGain, rideGain, maxVoices, skipOffComp: pressure >= 0.38 };
}

/**
 * Multi-dimensional jazz phrasing plan reflecting balance, streak, pie fullness, court, trope stage,
 * wonder chain, motivation links, and chapter progress.
 * @param {{ progress?: number, wobble?: number, combo?: number, richness?: number, presence?: string, step?: number, bar?: number, tropeStage?: string, wonderKind?: string, wonderChain?: number, chapter?: number, motivation?: string, pace?: number | null, foreshadow?: string, foreshadowChapters?: number[], motif?: number[] | null, development?: string[] | null }} [opts]
 */
export function jazzPhrasePlan({ progress = 0, wobble = 0, combo = 0, richness = 0.5, presence = '', step = 0, bar = 0, tropeStage = '', wonderKind = '', wonderChain = 0, chapter = 0, motivation = '', pace = null, foreshadow = '', foreshadowChapters = [], motif = [0, 2, 4, 7], development = null } = {}) {
  const w = clamp(Number(wobble) || 0, 0, 1);
  const c = Math.max(0, Math.floor(Number(combo) || 0));
  const wc = Math.max(0, Math.floor(Number(wonderChain) || 0));
  const r = clamp(Number(richness) ?? 0.5, 0, 1);
  const p = clamp(Number(progress) || 0, 0, 1);
  const ch = Math.floor(Number(chapter) || 0);
  const inPhrase = ((Math.floor(Number(bar) || 0) % 4) + 4) % 4;
  const arc = chapterArcPlan({ progress: p, bar, step, stage: 2, chapter: ch });
  const cell = ch ? LEVEL_CELLS[ch] : null;
  const owed = foreshadow ? foreshadowPlan(foreshadow, { chapter: ch || 1, appearances: foreshadowChapters, movement: arc.movement }) : null;
  const motivated = Boolean(motivation && (JAZZ_LEANS[motivation] || customLeans.has(motivation)));
  const clock = !ch;
  const debtBite = Boolean(owed?.turned || presence === 'bane' || (motivated && (jazzStyleFor(motivation) === 'bebop_bite' || jazzStyleFor(motivation) === 'altered_dominant')));
  let style = motivated
    ? jazzStyleFor(motivation)
    : (presence === 'boon' || presence === 'bane' || presence === 'bone')
      ? jazzStyleFor(presence)
      : tropeStage && (JAZZ_LEANS[tropeStage] || customLeans.has(tropeStage))
        ? jazzStyleFor(tropeStage)
        : wc >= 3 && !ch
          ? 'upper_structure'
          : wonderKind && (JAZZ_LEANS[wonderKind] || customLeans.has(wonderKind))
            ? jazzStyleFor(wonderKind)
            : cell?.harmony === 'swing_only'
              ? 'poised_69'
              : w >= 0.58 && (clock || debtBite)
                ? 'altered_dominant'
                : w >= 0.22
                  ? 'enclosure'
                  : clock && p >= 0.82 && inPhrase === 3
                    ? 'upper_structure'
                    : (clock || cell?.bridge === 'backdoor' || owed?.turned) && p >= 0.55 && p < 0.82 && inPhrase === 1
                      ? 'backdoor_cadence'
                      : owed?.turned && p >= 0.82 && inPhrase === 3
                        ? 'upper_structure'
                        : 'poised_69';
  const earnedBite = debtBite || motivated;
  if (ch >= SCHEMES_END && !earnedBite && (style === 'bebop_bite' || style === 'altered_dominant')) style = 'poised_69';
  const spec = styleSpec(style);
  const taut = pace == null ? null : clamp(Number(pace) > 1 ? Number(pace) / 9 : Number(pace), 0, 1);
  let voiceCount = r >= 0.72 || c >= 3 || wc >= 2 ? 4 : r >= 0.42 || c >= 1 ? 3 : 2;
  if (taut != null && taut >= 0.75) voiceCount = Math.min(4, voiceCount + 1);
  if (taut != null && taut <= 0.25) voiceCount = Math.max(2, voiceCount - 1);
  const feeds = MOTIVATION_FEEDS[motivation] || '';
  if (feeds === 'clear') voiceCount = Math.max(2, voiceCount - 1);
  const compSemis = spec.voicing.slice(0, voiceCount);
  if (wc >= 2 && !compSemis.includes(14)) compSemis.push(14);
  if (wc >= 4 && !compSemis.includes(21)) compSemis.push(21);
  const charleston = cell?.comp === 'charleston'
    ? (step === 0 || step === 6 || step === 10)
    : step === 0 || (step === 6 && (c >= 1 || wc >= 2 || r >= 0.5 || p >= 0.5 || inPhrase === 2));
  const walkingPass = step === 10 || step === 14;
  const tritoneSub = Boolean((clock && p >= 0.82 && inPhrase === 3) || (!clock && debtBite && p >= 0.82 && inPhrase === 3));
  const backdoor = Boolean((clock && p >= 0.55 && p < 0.82 && inPhrase === 1) || (cell?.bridge === 'backdoor' && arc.movement === 'bridge' && inPhrase === 1) || (owed?.turned && arc.movement === 'bridge' && inPhrase === 1));
  let passOffset = tritoneSub ? 1 : backdoor ? 10 : (spec.pass ?? (inPhrase === 3 ? -1 : 7));
  if (feeds === 'bane') passOffset = 1;
  if (feeds === 'clear' && (passOffset === 1 || passOffset === -1)) passOffset = 7;
  if (arc.withhold) passOffset = 7;
  const parked = owed && !owed.mayLand ? owed.degree : null;
  const landing = owed?.mayLand ? owed.degree : null;
  const walkLine = walkingBassPlan({ progress: p, bar, chapter: ch, jazz: true, tritoneSub, backdoor, feeds, passOffset });
  const compVoicing = compVoicingPlan({ bassOffset: arc.bassOffset, compSemis, parked });
  const motifPlan = motifMemoryPlan({ motif: motif || [0, 2, 4, 7], development, bar, guideTone: arc.guideToneOffset, parked, landing: landing == null ? null : debtPc(landing) });
  const duck = densityDuckFactor({ combo: c, stage: r >= 0.72 ? 3 : r >= 0.42 ? 2 : 1, pace: taut });
  return {
    style,
    compSemis,
    compVoicing,
    walkLine,
    duck,
    enclosure: spec.enclosure,
    layback: spec.layback,
    charleston,
    walkingPass,
    passOffset,
    tritoneSub,
    backdoor,
    guideTone: arc.guideToneOffset,
    motifForm: motifPlan.form,
    motif: motifPlan,
    developmentForm: arc.motifForm,
    blueSlide: c >= 2 || p >= 0.55,
    cell: arc.cell,
    feeds,
    parked,
    landing
  };
}

/**
 * Pure 16-step beat-pocket plan for a bar: downbeat/half-bar bass pulse, walking bass,
 * backbeat (beats 2 & 4), swung ride/shaker subdivisions, and bar-4 phrase pickup fills.
 * @param {{ step?: number, bar?: number, progress?: number, stage?: number, swing?: number, jazz?: boolean, ground?: string, combo?: number, bedOn?: boolean, chapter?: number }} [opts]
 */
export function beatPocketPlan({ step = 0, bar = 0, progress = 0, stage = 1, swing = 0.5, jazz = false, ground = 'city', combo = 0, bedOn = false, chapter = 0 } = {}) {
  const s = ((Math.floor(Number(step) || 0) % 16) + 16) % 16;
  const arc = chapterArcPlan({ progress, bar, step: s, stage, chapter });
  const swung = Boolean(jazz || (Number(swing) || 0.5) > 0.53);
  const active = Boolean(bedOn || stage >= 1 || combo >= 1);
  let walkingBass = Boolean(active && (s === 0 || s === 8 || ((s === 4 || s === 12) && (jazz || arc.movement === 'rising' || arc.movement === 'bridge' || arc.movement === 'turnaround'))));
  const walkStepOffsets = [arc.bassOffset, arc.bassOffset + 4, arc.bassOffset + 7, arc.turnOffset];
  const bassSemi = walkStepOffsets[Math.floor(s / 4)] ?? arc.bassOffset;
  let backbeat = Boolean(active && (s === 4 || s === 12));
  let ridePing = Boolean((stage >= 1 || bedOn || combo >= 2) && (
    swung
      ? (s === 0 || s === 4 || s === 7 || s === 8 || s === 12 || s === 15)
      : (s === 2 || s === 6 || s === 10 || s === 14)
  ));
  let pickupFill = Boolean(active && arc.inPhrase === 3 && (s === 14 || s === 15));
  if (arc.pedalHolds) walkingBass = s === 0 || s === 8;
  const spare = Boolean(arc.single);
  if (spare) {
    walkingBass = s === 0;
    backbeat = false;
    ridePing = false;
    pickupFill = false;
  }
  return {
    step: s,
    beatIndex: Math.floor(s / 4),
    inPhrase: arc.inPhrase,
    movement: arc.movement,
    swung,
    walkingBass,
    bassSemi,
    backbeat,
    backbeatStrong: s === 12,
    ridePing,
    rideOffbeat: s === 7 || s === 15 || s % 4 === 2,
    pickupFill,
    spare,
    cell: arc.cell,
    percussionVoice: ground === 'field' ? 'wood' : 'brush'
  };
}
