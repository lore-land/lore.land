/**
 * Pure musical and acoustic plans for pie-sound. These functions know no AudioContext: the browser renderer may use
 * HRTF panning when it is available and the same bounded gain plan when it is not.
 */

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const mod = (value, by) => ((value % by) + by) % by;

export const MOTIF_FORMS = Object.freeze(['prime', 'fragment', 'sequence', 'retrograde', 'inversion', 'augment', 'answer', 'resolve']);
const DEFAULT_DEVELOPMENT = Object.freeze(['prime', 'answer', 'inversion', 'resolve']);
const DEBT_PCS = Object.freeze([2, 4, 5, 7, 9]);
const debtPc = (degree) => DEBT_PCS[mod(Math.round(finite(degree, 1)) - 1, DEBT_PCS.length)];
const offDebt = (semi, degree) => degree != null && mod(semi, 12) === debtPc(degree) ? semi + 2 : semi;

/**
 * A deterministic motif memory. One cell stays recognizable through an authored sequence of forms; after the
 * sequence, the next overlapping cell is drawn from the full chapter motif. Event offsets and durations are in
 * sixteenths, so the renderer can preserve the chapter tempo.
 * @param {{ motif?: number[], development?: string[] | null, bar?: number, guideTone?: number, parked?: number | null, landing?: number | null }} [opts]
 */
export function motifMemoryPlan({ motif = [0, 2, 4, 7], development = null, bar = 0, guideTone = 0, parked = null, landing = null } = {}) {
  const clean = Array.isArray(motif) ? motif.map(Number).filter(Number.isFinite).slice(0, 16) : [];
  const material = clean.length >= 2 ? [...clean] : [0, 2, 4];
  while (material.length < 3) material.push(material[material.length - 1] + 2);
  const authored = Array.isArray(development)
    ? development.map((form) => String(form).toLowerCase()).filter((form) => MOTIF_FORMS.includes(form)).slice(0, 16)
    : [];
  const forms = authored.length ? authored : [...DEFAULT_DEVELOPMENT];
  const wholeBar = Math.floor(finite(bar));
  const phraseBar = mod(wholeBar, forms.length);
  const phrase = Math.floor(wholeBar / forms.length);
  const cellAt = mod(phrase * 2, material.length);
  const source = Array.from({ length: 3 }, (_, i) => material[(cellAt + i) % material.length]);
  const form = forms[phraseBar];
  const axis = source[0];
  const target = landing != null && Number.isFinite(Number(landing)) ? Number(landing) : Number.isFinite(Number(guideTone)) ? Number(guideTone) : axis;
  let notes;
  if (form === 'fragment') notes = source.slice(0, 2);
  else if (form === 'sequence') notes = source.map((note) => note + 5);
  else if (form === 'retrograde') notes = [...source].reverse();
  else if (form === 'inversion') notes = source.map((note) => axis - (note - axis));
  else if (form === 'answer') notes = source.map((note) => note + 2);
  else if (form === 'resolve') notes = [source[2], source[1], target];
  else notes = [...source];
  notes = notes.map((note) => offDebt(note, parked));

  const attacks = form === 'fragment' ? [0, 1.2]
    : form === 'augment' ? [0, 1.5, 3.5]
      : form === 'retrograde' ? [0, 0.8, 1.8]
        : form === 'resolve' ? [0, 0.9, 2.2]
          : [0, 0.72, 1.44];
  const events = notes.map((semi, i) => ({
    semi,
    at: attacks[i] ?? i * 0.72,
    dur: form === 'augment' ? 1.15 : i === notes.length - 1 ? 0.9 : 0.55,
    accent: i === notes.length - 1 ? 1 : 0.72
  }));
  return { form, phraseBar, phrase, phraseLength: forms.length, development: [...forms], motif: [...material], source, notes, events };
}

export const EFFECT_SPACES = Object.freeze({
  close: Object.freeze({ room: 0.42, echo: 0.5, distance: 0.82, tone: 1.08 }),
  natural: Object.freeze({ room: 1, echo: 1, distance: 1, tone: 1 }),
  hall: Object.freeze({ room: 1.55, echo: 1.35, distance: 1.18, tone: 0.88 })
});

/**
 * Turn semantic controls into one bounded effects plan. `spatialGain` precedes a PannerNode; `directGain` is the
 * equivalent fallback when 3D panning is unavailable. Room gain compensates either attenuation path.
 * @param {{ heat?: number, depth?: number, air?: number, song?: number, role?: string, space?: string, mix?: string, voicing?: string, dry?: number }} [opts]
 */
export function acousticEffectPlan({ heat = 0, depth = 0, air = 0, song = 0, role = 'fx', space = 'natural', mix = 'balanced', voicing = 'folk', dry = 0 } = {}) {
  const h = Math.max(0, finite(heat));
  const d = clamp(finite(depth), 0, 1);
  const room = clamp(finite(air), 0, 1);
  const echo = clamp(finite(song), 0, 1);
  const dryness = clamp(finite(dry), 0, 1);
  const profileName = Object.prototype.hasOwnProperty.call(EFFECT_SPACES, space) ? space : 'natural';
  const profile = EFFECT_SPACES[profileName];
  const safeRole = ['music', 'cue', 'step', 'fx'].includes(role) ? role : 'fx';
  const mixGain = mix === 'music' ? (safeRole === 'music' ? 1.18 : 0.84)
    : mix === 'ear' ? (safeRole === 'cue' || safeRole === 'step' ? 1.24 : safeRole === 'music' ? 0.78 : 1)
      : 1;
  const voiceBright = voicing === 'bright' ? 1.22 : voicing === 'velvet' ? 0.65 : voicing === 'warm' ? 0.85 : 1;
  const spatialGain = Math.max(0.45, 1 / (1 + 0.13 * h)) * mixGain;
  const distance = 1 + d * 3 * profile.distance;
  const rolloffFactor = 0.72;
  const distanceGain = 1 / (1 + rolloffFactor * (distance - 1));
  const directGain = spatialGain * distanceGain;
  const cutoffHz = Math.max(1400, (15000 / (1 + 0.3 * h)) * (1 - 0.6 * d) * voiceBright * profile.tone);
  const driedRoom = room * profile.room * (1 - dryness * (room < 0.15 ? 1 : 0.4));
  const roomSend = clamp((driedRoom + 0.1 * d) / Math.max(0.2, distanceGain), 0, 1);
  return {
    role: safeRole,
    space: profileName,
    spatialGain,
    directGain,
    cutoffHz,
    roomSend,
    echoSend: clamp(echo * profile.echo, 0, 0.6),
    distance,
    panningModel: 'HRTF',
    distanceModel: 'inverse',
    refDistance: 1,
    maxDistance: 12,
    rolloffFactor
  };
}

/** Map a lane pan and an acoustic distance to bounded PannerNode coordinates. */
export function acousticPositionPlan(effect = {}, pan = 0) {
  const distance = clamp(finite(effect.distance, 1), 1, 12);
  const side = clamp(finite(pan), -0.9, 0.9);
  return { x: side * Math.min(1.8, distance * 0.45), y: 0, z: -distance };
}