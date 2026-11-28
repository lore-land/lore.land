// @ts-check
/**
 * pie-tuning.mjs — extensible Spw tuning for music & aesthetics across six domains:
 *   1. characters  carriers, guests, and obstacles (timbre, pattern, ink, stroke, whimsy)
 *   2. scenes      places along the road (space, material, haze, contrast, grain)
 *   3. storylines  boon/bane/bone leans & room sigils (harmony tint, caption pace, pulse)
 *   4. arcs        challenge escalation (scheme pressure, march weight, tension ceiling)
 *   5. minis       alley, parade, long_view (tempo scale, duration, warp, mode motif)
 *   6. unlocks     customizable unlock expressions (aura glow, groove mix, sympathetic voice)
 *
 * Also reads `.spw/runtime/audio-tropes.spw` (`!patterns`, `!timbres`, `!bindings`) so drafted
 * algorithmic patterns (Euclidean, golden ratio, missing-note, Shepard, Cantor, silence)
 * drive board cues cleanly without breaking existing `readMotifs()` contracts.
 */

/** @typedef {{ label: string, sigil: string, min: number, max: number, step: number, unit?: string, says: string }} DialSpec */
/** @typedef {{ id: string, title: string, spell: string, says: string, dials: Record<string, number>, choices?: Record<string, string[]>, values: Record<string, number | string> }} DomainConfig */

export const TROPES_URL = '/.spw/runtime/audio-tropes.spw';

/** Bounded numeric & symbolic tuning domains. */
export const TUNING_DOMAINS = Object.freeze({
  characters: {
    id: 'characters',
    title: 'Characters & obstacles',
    says: 'Timbre weight, stroke character, and impact expressiveness for cast and things in the road.',
    dials: {
      voice_presence: { label: 'Voice presence', sigil: '%', min: 0.3, max: 1.8, step: 0.05, says: 'How forward character phrases and obstacle cues sit in the mix.' },
      stroke_weight: { label: 'Line weight', sigil: '%', min: 0.7, max: 1.8, step: 0.05, says: 'Outline crispness on silhouettes across the canvas.' },
      obstacle_contrast: { label: 'Hazard contrast', sigil: '%', min: 0.7, max: 1.5, step: 0.05, says: 'Visual emphasis between low hoppables, tall stops, and helpers.' },
      bounce_scale: { label: 'Kinetic squash', sigil: '%', min: 0.2, max: 1.8, step: 0.05, says: 'Motion squash, bobbing, and impact reaction scale.' },
      jazz_lean: { label: 'Jazz lean', sigil: '%', min: 0, max: 2, step: 0.05, says: 'In jazz feel, how far spells, dodged obstacles, tricks and the carrier lean into their own style: 1 as jazz plays them, past it each approaches its landing note from its side and sits back.' }
    },
    choices: {
      pattern_mode: ['chapter', 'euclid', 'golden', 'missing', 'anticipate']
    },
    defaults: { voice_presence: 1, stroke_weight: 1, obstacle_contrast: 1, bounce_scale: 1, jazz_lean: 1, pattern_mode: 'chapter' }
  },
  scenes: {
    id: 'scenes',
    title: 'Scenes & places',
    says: 'Atmosphere, sky warmth, haze horizon, and acoustic resonance across the six places.',
    dials: {
      sky_warmth: { label: 'Sky warmth', sigil: '%', min: 0.4, max: 1.6, step: 0.05, says: 'Amber-to-night warmth mix over the far end of the lanes.' },
      haze_veil: { label: 'Horizon haze', sigil: '%', min: 0.3, max: 1.6, step: 0.05, says: 'Softness of the upper veil hiding oncoming rows.' },
      room_air: { label: 'Acoustic air', sigil: '%', min: 0.4, max: 1.8, step: 0.05, says: 'Room tail and material gesture resonance on doors and landings.' },
      ground_grain: { label: 'Ground texture', sigil: '%', min: 0.3, max: 1.6, step: 0.05, says: 'Cobble, grass, rail, and puddle detail under the carrier.' }
    },
    choices: {
      acoustic_bias: ['place', 'close', 'parlour', 'hall']
    },
    defaults: { sky_warmth: 1, haze_veil: 1, room_air: 1, ground_grain: 1, acoustic_bias: 'place' }
  },
  storylines: {
    id: 'storylines',
    title: 'Storylines & leans',
    says: 'How boon, bane, bone, and passing rooms colour harmony and text cadence.',
    dials: {
      chord_bloom: { label: 'Room bloom', sigil: '%', min: 0.3, max: 1.7, step: 0.05, says: 'How warmly passing Spw room chords bloom into the bed.' },
      passage_pulse: { label: 'Passage pulse', sigil: '%', min: 0.5, max: 1.6, step: 0.05, says: 'Rhythmic lift when stepping over glowing words in the road.' },
      value_echo: { label: 'Value shimmer', sigil: '%', min: 0.2, max: 1.8, step: 0.05, says: 'Visibility of emergent value rings and parallel-experience whispers.' }
    },
    choices: {
      colour_tilt: ['balanced', 'fairy_tale', 'absurd_reality', 'low_magic']
    },
    defaults: { chord_bloom: 1, passage_pulse: 1, value_echo: 1, colour_tilt: 'balanced' }
  },
  arcs: {
    id: 'arcs',
    title: 'Challenge arcs',
    says: 'Pacing of hazards, Mr. BaneWAP’s schemes, mime pressure, and harmonic tension.',
    dials: {
      tension_depth: { label: 'Harmonic tension', sigil: '%', min: 0.2, max: 1.6, step: 0.05, says: 'Depth of b9 and #11 harmonic stretch when lanes crowd.' },
      scheme_tempo: { label: 'Scheme pressure', sigil: '%', min: 0.6, max: 1.5, step: 0.05, says: 'Cadence at which BaneWAP and mimes press the middle stretch.' },
      recovery_grace: { label: 'Recovery grace', sigil: '%', min: 0.6, max: 1.6, step: 0.05, says: 'Plate steadying speed when stepping under the tilt or resting.' }
    },
    choices: {
      warning_style: ['chapter', 'sparse', 'urgent']
    },
    defaults: { tension_depth: 1, scheme_tempo: 1, recovery_grace: 1, warning_style: 'chapter' }
  },
  minis: {
    id: 'minis',
    title: 'Minigames',
    says: 'Alley, Parade, and Long View duration, perspective warp, and celebratory motifs.',
    dials: {
      mini_tempo: { label: 'Mode energy', sigil: '%', min: 0.7, max: 1.5, step: 0.05, says: 'Rhythmic lift and call density during horns, parades, and alleys.' },
      perspective_warp: { label: 'Long view depth', sigil: '%', min: 0.3, max: 1.5, step: 0.05, says: 'Vanishing-point squeeze during Long View.' },
      banner_flourish: { label: 'Curtain flourish', sigil: '%', min: 0.3, max: 1.8, step: 0.05, says: 'Arpeggio and ring fanfare entering and closing a minigame.' }
    },
    choices: {
      fanfare_scale: ['chapter', 'pentatonic', 'chromatic']
    },
    defaults: { mini_tempo: 1, perspective_warp: 1, banner_flourish: 1, fanfare_scale: 'chapter' }
  },
  unlocks: {
    id: 'unlocks',
    title: 'Customizable unlocks',
    says: 'Fine-tune how earned mechanics sound and appear across chapters and lanes.',
    dials: {
      groove_level: { label: 'Groove underlay', sigil: '%', min: 0.3, max: 1.6, step: 0.05, says: 'Presence of found chapter rhythms playing under a carry.' },
      pocket_sparkle: { label: 'Pocket glint', sigil: '%', min: 0.3, max: 1.8, step: 0.05, says: 'Harmonic shimmer and visual halo when stepping in the pocket.' },
      sympathetic_gain: { label: 'Sympathetic strings', sigil: '%', min: 0.2, max: 1.6, step: 0.05, says: 'Softness of key-locked answers on words, wonders, and cards.' }
    },
    choices: {
      parallel_whisper: ['gentle', 'frequent', 'quiet']
    },
    defaults: { groove_level: 1, pocket_sparkle: 1, sympathetic_gain: 1, parallel_whisper: 'gentle' }
  }
});

export const DOMAIN_ORDER = Object.freeze(['characters', 'scenes', 'storylines', 'arcs', 'minis', 'unlocks']);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = (v) => Math.round(v * 100) / 100;

/**
 * Euclidean rhythm generator (Bjorklund approximation for crisp interactive step pulses).
 * @param {number} k pulses
 * @param {number} n total steps
 * @returns {number[]} 0/1 array of length n
 */
export function euclidean(k, n) {
  const steps = Math.max(1, Math.min(32, Math.round(n) || 8));
  const pulses = clamp(Math.round(k) || 1, 0, steps);
  if (pulses === 0) return new Array(steps).fill(0);
  const pattern = [];
  let bucket = 0;
  for (let i = 0; i < steps; i += 1) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      pattern.push(1);
    } else {
      pattern.push(0);
    }
  }
  return pattern;
}

/**
 * Evaluate a drafted pattern from `.spw/runtime/audio-tropes.spw` (`!patterns`) into an
 * offset / velocity hint for step index `idx`, strictly bounded in scale degrees.
 * @param {string} kind
 * @param {number} idx
 * @param {{ length?: number, scale?: number[] }} [opts]
 * @returns {{ active: boolean, degOffset: number, velMul: number, rest?: boolean }}
 */
export function patternStep(kind, idx = 0, { length = 8, scale = [0, 2, 4, 7, 9] } = {}) {
  const step = Math.abs(Math.floor(idx));
  const sc = scale.length ? scale : [0, 2, 4, 7, 9];
  switch (kind) {
    case 'euclid': {
      const e = euclidean(3, 8);
      const active = e[step % e.length] === 1;
      return { active, degOffset: sc[step % sc.length], velMul: active ? 1 : 0.45 };
    }
    case 'golden': {
      const phi = 0.61803398875;
      const frac = ((step * phi) % 1 + 1) % 1;
      const i = Math.floor(frac * sc.length);
      return { active: true, degOffset: sc[i], velMul: 0.75 + frac * 0.3 };
    }
    case 'missing': {
      const omit = step % 4 === 2;
      return { active: !omit, degOffset: sc[(step + (omit ? 1 : 0)) % sc.length], velMul: omit ? 0 : 0.95 };
    }
    case 'cantor': {
      // Drop the middle third of every 3-step or 9-step phrase.
      const sub = step % 9;
      const hole = sub >= 3 && sub < 6 || (step % 3 === 1);
      return { active: !hole, degOffset: sc[step % sc.length], velMul: hole ? 0 : 0.85 };
    }
    case 'anticipate': {
      return { active: true, degOffset: sc[(step + 1) % sc.length], velMul: step % 2 === 1 ? 1.05 : 0.7 };
    }
    case 'shepard': {
      const pos = (step % length) / Math.max(1, length);
      const idxNote = step % sc.length;
      return { active: true, degOffset: sc[idxNote] + (pos > 0.5 ? -12 : 0), velMul: 0.6 + Math.sin(pos * Math.PI) * 0.4 };
    }
    case 'silence': {
      const mute = step % 4 === 3;
      return { active: !mute, degOffset: sc[0], velMul: mute ? 0 : 0.8, rest: mute };
    }
    case 'augment': {
      const onBeat = step % 2 === 0;
      return { active: onBeat, degOffset: sc[Math.floor(step / 2) % sc.length], velMul: onBeat ? 0.95 : 0 };
    }
    default:
      return { active: true, degOffset: sc[step % sc.length], velMul: 0.85 };
  }
}

/**
 * Parse `!patterns`, `!timbres`, and `!bindings` blocks from `.spw/runtime/audio-tropes.spw`
 * safely alongside existing `readMotifs` without changing motif parsing semantics.
 * @param {string} text
 */
export function parseAudioTropes(text = '') {
  /** @type {Record<string, { id: string, says: string, form?: string }>} */
  const patterns = {};
  /** @type {Record<string, { id: string, says: string, voice?: string }>} */
  const timbres = {};
  /** @type {Record<string, Record<string, string[]>>} */
  const bindings = {};

  const sectionBody = (name) => {
    const start = new RegExp(`!${name}\\{`).exec(text);
    if (!start) return '';
    let depth = 1;
    let i = start.index + start[0].length;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') depth -= 1;
      i += 1;
    }
    return depth === 0 ? text.slice(start.index + start[0].length, i - 1) : '';
  };

  const pBody = sectionBody('patterns');
  for (const m of pBody.matchAll(/\*([a-z_]+)\{([^}]*)\}/g)) {
    const [, id, body] = m;
    const says = (/#says\["([^"]*)"\]/.exec(body) || [])[1] || '';
    const form = (/~pattern\[([^\]]*)\]/.exec(body) || [])[1] || id;
    patterns[id] = { id, says, form };
  }

  const tBody = sectionBody('timbres');
  for (const m of tBody.matchAll(/\$([a-z_]+)\{([^}]*)\}/g)) {
    const [, id, body] = m;
    const says = (/#says\["([^"]*)"\]/.exec(body) || [])[1] || '';
    const voice = (/\$voice\[([^\]]*)\]/.exec(body) || [])[1] || id;
    timbres[id] = { id, says, voice };
  }

  const bBody = sectionBody('bindings');
  for (const m of bBody.matchAll(/\*([a-z_]+)\{([^}]*)\}/g)) {
    const [, id, body] = m;
    const at = [...body.matchAll(/@([a-z_]+)\[([^\]]*)\]/g)];
    bindings[id] = {};
    at.forEach(([, target, expr]) => {
      bindings[id][target] = expr.trim().split(/\s+/).filter(Boolean);
    });
  }

  return { patterns, timbres, bindings };
}

let cachedTropes = null;
/** Load optional extended audio-tropes spec (patterns, timbres, bindings) safely. */
export async function loadAudioTropes() {
  if (cachedTropes) return cachedTropes;
  try {
    const res = await fetch(TROPES_URL);
    if (!res.ok) return { patterns: {}, timbres: {}, bindings: {} };
    cachedTropes = parseAudioTropes(await res.text());
    return cachedTropes;
  } catch {
    return { patterns: {}, timbres: {}, bindings: {} };
  }
}

/**
 * Parse a `!tune_domains{ *characters{ ... } *scenes{ ... } ... }` block into clamped overrides.
 * @param {string} source
 * @returns {Record<string, Record<string, number | string>>}
 */
export function parseTuningDomains(source = '') {
  /** @type {Record<string, Record<string, number | string>>} */
  const out = {};
  const blockMatch = /!tune_domains\{([\s\S]*)\}/.exec(String(source || ''));
  const scope = blockMatch ? blockMatch[1] : String(source || '');
  for (const domain of DOMAIN_ORDER) {
    const spec = TUNING_DOMAINS[domain];
    const m = new RegExp(`\\*${domain}\\{([^}]*)\\}`).exec(scope);
    if (!m) continue;
    const body = m[1];
    out[domain] = {};
    Object.entries(spec.dials).forEach(([key, d]) => {
      const dm = new RegExp(`%${key}\\[(-?\\d+(?:\\.\\d+)?)\\]`).exec(body);
      if (dm) out[domain][key] = round2(clamp(Number(dm[1]), d.min, d.max));
    });
    Object.entries(spec.choices || {}).forEach(([key, valid]) => {
      const cm = new RegExp(`=${key}\\[([a-z_]+)\\]`).exec(body);
      if (cm && valid.includes(cm[1])) out[domain][key] = cm[1];
    });
  }
  return out;
}

/**
 * Serialize current domain values into a valid Spw expression for copy/paste or Tuning Desk scrubbing.
 * @param {Record<string, Record<string, number | string>>} state
 * @param {string[]} [domains]
 * @returns {string}
 */
export function writeTuningDomains(state = {}, domains = DOMAIN_ORDER) {
  const parts = domains.map((domain) => {
    const spec = TUNING_DOMAINS[domain];
    if (!spec) return '';
    const merged = { ...spec.defaults, ...(state[domain] || {}) };
    const atoms = [
      ...Object.keys(spec.dials).map((k) => `%${k}[${round2(clamp(Number(merged[k] ?? spec.defaults[k]), spec.dials[k].min, spec.dials[k].max))}]`),
      ...Object.keys(spec.choices || {}).map((k) => `=${k}[${spec.choices[k].includes(String(merged[k])) ? merged[k] : spec.defaults[k]}]`)
    ];
    return `*${domain}{ ${atoms.join(' ')} }`;
  }).filter(Boolean);
  return `!tune_domains{ ${parts.join(' ')} }`;
}

/** Merge defaults + visit tuning safely for one domain. */
export function effectiveDomain(domain, state = {}) {
  const spec = TUNING_DOMAINS[domain];
  if (!spec) return {};
  const custom = state[domain] || {};
  /** @type {Record<string, number | string>} */
  const out = { ...spec.defaults };
  Object.entries(spec.dials).forEach(([k, d]) => {
    if (custom[k] != null && Number.isFinite(Number(custom[k]))) {
      out[k] = round2(clamp(Number(custom[k]), d.min, d.max));
    }
  });
  Object.entries(spec.choices || {}).forEach(([k, valid]) => {
    if (typeof custom[k] === 'string' && valid.includes(custom[k])) out[k] = custom[k];
  });
  return out;
}
