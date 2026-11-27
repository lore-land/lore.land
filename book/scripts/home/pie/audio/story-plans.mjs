// @ts-check
/**
 * pie/audio/story-plans.mjs — pure tactile, narrative, wonder-syntax, easter-egg, and character
 * flourish note plans, plus composable phrase variation transforms.
 *
 * Speaker-free: every planner returns deterministic note arrays that pie-sound.mjs renders into
 * the chapter's key and active ear setting. Creative extensions can register new wonder kinds
 * or character flourishes via `registerWonderSyntax()` and `registerThemeFlourish()`, or derive
 * thematic variations via `composePhraseVariation()`.
 */

const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) => Math.min(hi, Math.max(lo, v));

/** @typedef {{ voice: string, deg?: number, bass?: number, octave?: number, semi?: number, at: number, dur: number, vol: number, side?: number }} StoryNote */
/** @typedef {{ sigil: string, container: string, lean: string, shape: readonly number[], voice: string }} WonderSyntaxMeta */

export const TEXTURES = Object.freeze({
  wap: Object.freeze(['splat', 'pillow', 'cream', 'bell']),
  steps: Object.freeze(['ground', 'tiptoe', 'felt', 'wood'])
});

const LANE_DEGS = Object.freeze([0, 2, 4, 7, 9]);
const STORY_BANE_KINDS = new Set(['banerose', 'clerk', 'dividers', 'throne', 'march', 'pane', 'baneberry', 'mime', 'mimewall']);
const STORY_BONE_KINDS = new Set(['stone', 'post', 'hole', 'ditch', 'snail', 'puddle', 'frost', 'beaver', 'boneberry']);

/**
 * Pure directional board-movement phrase plan for stepping across lanes and rows.
 * @param {{ lane?: number, row?: number, prevLane?: number, prevRow?: number, kind?: string, towardSafe?: boolean, diagonal?: boolean, dir?: number }} [opts]
 * @returns {{ notes: { semiOffset: number, dur: number, vol: number, at: number, panMul?: number }[] }}
 */
export function boardStepPlan({ lane = 2, row = 0, prevLane = lane, prevRow = row, kind = 'step', towardSafe = false, diagonal = false, dir = 1 } = {}) {
  const curL = clamp(Number(lane) || 0, 0, 4);
  const oldL = clamp(Number(prevLane) ?? curL, 0, 4);
  const curR = clamp(Number(row) || 0, 0, 4);
  const oldR = clamp(Number(prevRow) ?? curR, 0, 4);
  if (kind === 'bump') {
    return { notes: [{ semiOffset: -5, dur: 0.09, vol: 0.02, at: 0 }, { semiOffset: -12, dur: 0.14, vol: 0.016, at: 0.04 }] };
  }
  const start = LANE_DEGS[oldL] + oldR * 2;
  const dest = LANE_DEGS[curL] + curR * 2;
  if (kind === 'slide') {
    return { notes: [{ semiOffset: start + 12, dur: 0.12, vol: 0.018, at: 0 }, { semiOffset: dest + 19, dur: 0.2, vol: 0.02, at: 0.06 }] };
  }
  if (kind === 'climb' || curR !== oldR) {
    const up = curR > oldR || dir > 0;
    const notes = [
      { semiOffset: start + 12, dur: 0.11, vol: 0.016, at: 0 },
      { semiOffset: dest + (up ? 17 : 10), dur: 0.18, vol: 0.02, at: 0.055 }
    ];
    if (diagonal) notes.push({ semiOffset: dest + 24, dur: 0.18, vol: 0.014, at: 0.11 });
    return { notes };
  }
  const notes = [{ semiOffset: dest + 12, dur: 0.15, vol: 0.018, at: 0 }];
  if (diagonal) notes.unshift({ semiOffset: start + 12, dur: 0.1, vol: 0.014, at: 0 });
  if (towardSafe) notes.push({ semiOffset: dest + 19, dur: 0.2, vol: 0.017, at: 0.065 });
  return { notes };
}

/**
 * Pure maneuvering-trick note plan (hop clears, apex hangs, imaginary glass, shield warmth, bank shots).
 * @param {string} kind
 * @param {{ clears?: number, high?: boolean, inTime?: boolean, count?: number }} [opts]
 * @returns {{ notes: StoryNote[] }}
 */
export function trickPlan(kind, { clears = 1, high = false, inTime = false, count = 1 } = {}) {
  const n = Math.max(1, Math.min(4, Number(clears) || 1));
  const chain = Math.max(1, Math.min(4, Number(count) || 1));
  switch (kind) {
    case 'hop_clear': {
      if (high || n >= 2) {
        return {
          notes: [
            { voice: 'celesta', deg: 2, octave: 12, at: 0, dur: 0.18, vol: 0.026, side: -0.15 },
            { voice: 'vibes', deg: 4, octave: 12, at: 0.05, dur: 0.24, vol: 0.028, side: 0 },
            { voice: 'celesta', deg: 5 + Math.min(2, n - 1), octave: 12, at: 0.1, dur: 0.34, vol: 0.026, side: 0.18 }
          ]
        };
      }
      return {
        notes: [
          { voice: 'kalimba', deg: 2 + (inTime ? chain : 0), octave: 12, at: 0, dur: 0.16, vol: 0.026 },
          { voice: inTime ? 'celesta' : 'kalimba', deg: 4 + (inTime ? chain : 0), octave: 12, at: 0.06, dur: 0.24, vol: 0.024, side: 0.12 }
        ]
      };
    }
    case 'apex':
      return { notes: [{ voice: 'celesta', deg: 3 + Math.min(2, chain - 1), octave: 12, at: 0, dur: 0.22, vol: 0.02 }] };
    case 'mime_glass':
      return {
        notes: [
          { voice: 'celesta', deg: 4, octave: 24, at: 0, dur: 0.28, vol: 0.024, side: -0.2 },
          { voice: 'celesta', deg: 5, octave: 24, at: 0.045, dur: 0.34, vol: 0.02, side: 0.2 }
        ]
      };
    case 'pierce':
      return {
        notes: [
          { voice: 'vibes', deg: 3, octave: 12, at: 0, dur: 0.2, vol: 0.03 },
          { voice: 'celesta', deg: 5, octave: 12, at: 0.04, dur: 0.26, vol: 0.024 }
        ]
      };
    case 'shield_hold':
      return {
        notes: [
          { voice: 'marimba', bass: 0, at: 0, dur: 0.36, vol: 0.04 },
          { voice: 'vibes', deg: 2, octave: 12, at: 0.02, dur: 0.42, vol: 0.028, side: -0.12 },
          { voice: 'vibes', deg: 4, octave: 12, at: 0.09, dur: 0.48, vol: 0.024, side: 0.12 }
        ]
      };
    case 'frill_catch':
      return {
        notes: [
          { voice: 'marimba', bass: 0, at: 0, dur: 0.2, vol: 0.032 },
          { voice: 'kalimba', deg: 2, octave: 12, at: 0.03, dur: 0.18, vol: 0.022 }
        ]
      };
    case 'unkept_pass':
      return {
        notes: [
          { voice: 'musicBox', deg: 1, octave: 12, at: 0, dur: 0.22, vol: 0.02, side: -0.16 },
          { voice: 'musicBox', deg: 3, octave: 12, at: 0.055, dur: 0.28, vol: 0.02, side: 0.16 }
        ]
      };
    case 'bank_score':
      return {
        notes: [
          { voice: 'celesta', deg: 4, octave: 12, at: 0, dur: 0.24, vol: 0.028, side: -0.15 },
          { voice: 'celesta', deg: 6, octave: 12, at: 0.06, dur: 0.36, vol: 0.028, side: 0.15 }
        ]
      };
    default:
      return { notes: [{ voice: 'celesta', deg: 4, octave: 12, at: 0, dur: 0.2, vol: 0.02 }] };
  }
}

/**
 * Story gesture for a power-up spell: translates what the spell does in the book into a 2-4 note pulse motif.
 * @param {{ id?: string, timed?: Record<string, number>, acts?: string[], charges?: Record<string, number> } | null | undefined} power
 * @returns {{ role: string, notes: StoryNote[] }}
 */
export function powerStoryPlan(power) {
  const timed = power?.timed || {};
  const acts = power?.acts || [];
  const charges = power?.charges || {};
  if (timed.lag) {
    return {
      role: 'lag',
      notes: [
        { voice: 'marimba', bass: 12, at: 0, dur: 0.26, vol: 0.032 },
        { voice: 'vibes', deg: 2, octave: 12, at: 0.26, dur: 0.34, vol: 0.026, side: 0.14 }
      ]
    };
  }
  if (timed.lit) {
    return {
      role: 'lit',
      notes: [
        { voice: 'vibes', deg: 0, octave: 12, at: 0, dur: 0.26, vol: 0.024 },
        { voice: 'vibes', deg: 2, octave: 12, at: 0.07, dur: 0.3, vol: 0.024 },
        { voice: 'celesta', deg: 5, octave: 12, at: 0.14, dur: 0.42, vol: 0.022 }
      ]
    };
  }
  if (timed.unkept) {
    return {
      role: 'unkept',
      notes: [
        { voice: 'musicBox', deg: 0, octave: 12, at: 0, dur: 0.24, vol: 0.024, side: -0.15 },
        { voice: 'musicBox', deg: 3, octave: 12, at: 0.08, dur: 0.3, vol: 0.022, side: 0.15 },
        { voice: 'celesta', deg: 4, octave: 12, at: 0.16, dur: 0.38, vol: 0.02 }
      ]
    };
  }
  if (charges.echoes) {
    return {
      role: 'echoes',
      notes: [
        { voice: 'celesta', deg: 4, octave: 12, at: 0, dur: 0.22, vol: 0.03, side: -0.2 },
        { voice: 'celesta', deg: 4, octave: 12, at: 0.18, dur: 0.32, vol: 0.016, side: 0.2 }
      ]
    };
  }
  if (acts.includes('honk')) {
    return {
      role: 'honk',
      notes: [
        { voice: 'kalimba', deg: 2, octave: 12, at: 0, dur: 0.14, vol: 0.028, side: -0.2 },
        { voice: 'kalimba', deg: 4, octave: 12, at: 0.08, dur: 0.16, vol: 0.026, side: 0.2 },
        { voice: 'vibes', deg: 5, octave: 12, at: 0.18, dur: 0.28, vol: 0.024 }
      ]
    };
  }
  if (timed.true_aim) {
    return {
      role: 'true_aim',
      notes: [
        { voice: 'celesta', deg: 3, octave: 12, at: 0, dur: 0.14, vol: 0.024 },
        { voice: 'celesta', deg: 4, octave: 12, at: 0.06, dur: 0.14, vol: 0.022 },
        { voice: 'celesta', deg: 5, octave: 12, at: 0.12, dur: 0.3, vol: 0.024 }
      ]
    };
  }
  if (acts.includes('level') || acts.includes('forgive')) {
    return {
      role: 'settle',
      notes: [
        { voice: 'vibes', deg: 4, octave: 12, at: 0, dur: 0.22, vol: 0.024 },
        { voice: 'marimba', bass: 12, at: 0.09, dur: 0.34, vol: 0.03 }
      ]
    };
  }
  return {
    role: timed.glimpse ? 'glimpse' : 'story',
    notes: [
      { voice: 'vibes', deg: 2, octave: 12, at: 0, dur: 0.22, vol: 0.024 },
      { voice: 'celesta', deg: 4, octave: 12, at: 0.09, dur: 0.3, vol: 0.02 }
    ]
  };
}

/**
 * Quiet close-pass resolution cue connecting a dodged or handled obstacle to its story leaning.
 * @param {string} kind
 * @returns {{ lean: 'bane' | 'bone' | 'boon', notes: StoryNote[] } | null}
 */
export function obstacleStoryPlan(kind) {
  if (!kind) return null;
  if (STORY_BANE_KINDS.has(kind)) {
    return {
      lean: 'bane',
      notes: [
        { voice: 'vibes', deg: 4, octave: 12, at: 0, dur: 0.14, vol: 0.018 },
        { voice: 'vibes', deg: 3, octave: 12, at: 0.07, dur: 0.22, vol: 0.016 }
      ]
    };
  }
  if (STORY_BONE_KINDS.has(kind)) {
    return {
      lean: 'bone',
      notes: [
        { voice: 'kalimba', deg: 3, octave: 0, at: 0, dur: 0.14, vol: 0.02 },
        { voice: 'marimba', bass: 12, at: 0.06, dur: 0.22, vol: 0.018 }
      ]
    };
  }
  return {
    lean: 'boon',
    notes: [
      { voice: 'celesta', deg: 2, octave: 12, at: 0, dur: 0.14, vol: 0.018 },
      { voice: 'celesta', deg: 5, octave: 12, at: 0.07, dur: 0.24, vol: 0.016 }
    ]
  };
}

/** @type {Readonly<Record<string, Readonly<WonderSyntaxMeta>>>} */
const WONDER_SYNTAX_META = Object.freeze({
  creature: Object.freeze({ sigil: '@', container: '{}', lean: 'creature', shape: [0, 1, 3, 2], voice: 'musicBox' }),
  antique: Object.freeze({ sigil: '.', container: '{}', lean: 'antique', shape: [0, 0, 2, 1], voice: 'musicBox' }),
  artifact: Object.freeze({ sigil: '*', container: '[]', lean: 'artifact', shape: [2, 0, 3, 1], voice: 'musicBox' }),
  contrivance: Object.freeze({ sigil: '$', container: '()', lean: 'contrivance', shape: [0, 1, 2, 3], voice: 'musicBox' }),
  bracework: Object.freeze({ sigil: '&', container: '{}', lean: 'bracework', shape: [0, 2, 1, 3], voice: 'musicBox' }),
  saying: Object.freeze({ sigil: '#', container: '<>', lean: 'saying', shape: [3, 2, 1, 0], voice: 'musicBox' })
});

/** @type {Map<string, Readonly<WonderSyntaxMeta>>} */
const customWonderSyntax = new Map();

/**
 * Register a new collectible wonder kind's Spw syntax + arpeggio contour (PLAN.E ecology extension).
 * @param {string} kind
 * @param {WonderSyntaxMeta} meta
 */
export function registerWonderSyntax(kind, meta) {
  const key = String(kind || '').trim();
  if (!key || !Array.isArray(meta?.shape) || !meta.shape.length) return false;
  customWonderSyntax.set(key, Object.freeze({
    sigil: String(meta.sigil || '*'),
    container: String(meta.container || '{}'),
    lean: String(meta.lean || key),
    shape: Object.freeze(meta.shape.map(Number).filter(Number.isFinite)),
    voice: String(meta.voice || 'musicBox')
  }));
  return true;
}

/**
 * Collectible syntax wonder note plan: translates `?kind{ … }` unfound probes vs. answered
 * sigil + container + movement into a pure note sequence.
 * @param {string | { kind?: string, id?: string, spw?: string, found?: boolean, movement?: string } | null | undefined} kindOrWonder
 * @param {{ found?: boolean, movement?: string }} [opts]
 * @returns {{ kind: string, sigil: string, container: string, lean: string, spw: string, notes: StoryNote[] }}
 */
export function wonderSyntaxPlan(kindOrWonder, { found = true, movement = 'opening' } = {}) {
  const isObj = typeof kindOrWonder === 'object' && kindOrWonder !== null;
  const rawKind = isObj ? String(kindOrWonder.kind || 'creature') : String(kindOrWonder || 'creature');
  const isFound = isObj && kindOrWonder.found !== undefined ? Boolean(kindOrWonder.found) : Boolean(found);
  const mov = isObj && kindOrWonder.movement ? String(kindOrWonder.movement) : String(movement || 'opening');
  const id = isObj && kindOrWonder.id ? String(kindOrWonder.id).replace(/-/g, '_') : rawKind;
  const customSpw = isObj && kindOrWonder.spw ? String(kindOrWonder.spw) : '';
  const meta = customWonderSyntax.get(rawKind) || WONDER_SYNTAX_META[rawKind] || WONDER_SYNTAX_META.creature;
  if (!isFound) {
    return {
      kind: rawKind,
      sigil: '?',
      container: meta.container,
      lean: 'hint',
      spw: `?${rawKind}${meta.container[0]} … ${meta.container[1]}`,
      notes: [
        { voice: 'musicBox', deg: 0, octave: 12, at: 0, dur: 0.28, vol: 0.022, side: -0.1 },
        { voice: 'musicBox', deg: 3, octave: 12, at: 0.09, dur: 0.42, vol: 0.024, side: 0.1 }
      ]
    };
  }
  const movLift = mov === 'turnaround' ? 2 : mov === 'bridge' ? 1 : 0;
  const stepGap = 0.04;
  /** @type {StoryNote[]} */
  const notes = meta.shape.map((degIdx, k) => ({
    voice: meta.voice,
    deg: degIdx + 3 + (k === meta.shape.length - 1 ? movLift : 0),
    octave: 0,
    at: k * stepGap,
    dur: k === meta.shape.length - 1 ? 0.68 : 0.34,
    vol: 0.036,
    side: (k - 1.5) * 0.12
  }));
  if (meta.container === '{}') {
    notes.unshift({ voice: 'marimba', bass: 12, at: 0, dur: 0.3, vol: 0.024, side: 0 });
  }
  return {
    kind: rawKind,
    sigil: meta.sigil,
    container: meta.container,
    lean: meta.lean,
    spw: customSpw || `${meta.sigil}${id}${meta.container[0]} #${rawKind} ${meta.container[1]}`,
    notes
  };
}

/**
 * Pure musical plan for audio easter eggs: pi, golden spiral, sliver tin Shepard tone, egg warmth,
 * boof_perk, and genie_wish.
 * @param {string} [kind]
 * @param {{ combo?: number, inTime?: boolean, chapter?: number }} [_opts]
 * @returns {{ kind: string, role: string, lean: string, notes: StoryNote[] }}
 */
export function easterEggPlan(kind = 'pi', _opts = {}) {
  const PI_DIGITS = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
  switch (kind) {
    case 'pi': {
      const notes = PI_DIGITS.map((d, i) => {
        const deg = d % 5;
        const octave = d >= 5 ? 12 : 0;
        const swing = i % 2 === 1 ? 0.024 : 0;
        return {
          voice: i % 2 === 0 ? 'musicBox' : 'celesta',
          deg,
          octave: octave + 12,
          at: i * 0.09 + swing,
          dur: 0.14,
          vol: 0.022,
          side: Number((((i % 4) - 1.5) * 0.12).toFixed(2))
        };
      });
      return { kind: 'pi', role: 'easter_egg', lean: 'poised_69', notes };
    }
    case 'golden': {
      const phi = 0.61803398875;
      const notes = Array.from({ length: 8 }, (_, i) => {
        const pos = (i * phi) % 1;
        const deg = Math.floor(pos * 5);
        const pan = (pos - 0.5) * 1.5;
        return {
          voice: i % 3 === 0 ? 'celesta' : 'vibes',
          deg,
          octave: 12 + (pos > 0.5 ? 7 : 0),
          at: i * 0.085,
          dur: 0.22,
          vol: 0.024,
          side: Number(pan.toFixed(2))
        };
      });
      return { kind: 'golden', role: 'easter_egg', lean: 'lydian_court', notes };
    }
    case 'shepard': {
      const partials = [-12, 0, 12, 24, 36, 48];
      const bell = [0.15, 0.45, 0.9, 0.85, 0.4, 0.1];
      const notes = partials.map((semi, i) => ({
        voice: 'vibes',
        deg: 0,
        octave: 12,
        semi,
        at: i * 0.02,
        dur: 0.65,
        vol: Number((0.025 * bell[i]).toFixed(4)),
        side: (i % 2 === 0 ? -1 : 1) * 0.1
      }));
      return { kind: 'shepard', role: 'easter_egg', lean: 'open_quartal', notes };
    }
    case 'egg_warmth':
      return {
        kind: 'egg_warmth', role: 'easter_egg', lean: 'lydian_court',
        notes: [
          { voice: 'marimba', deg: 0, octave: 0, at: 0, dur: 0.45, vol: 0.032, side: -0.15 },
          { voice: 'vibes', deg: 2, octave: 12, at: 0.06, dur: 0.52, vol: 0.026, side: 0.15 },
          { voice: 'celesta', deg: 4, octave: 12, at: 0.12, dur: 0.58, vol: 0.024, side: 0 },
          { voice: 'musicBox', deg: 6, octave: 24, at: 0.18, dur: 0.62, vol: 0.02, side: 0.18 }
        ]
      };
    case 'boof_perk':
      return {
        kind: 'boof_perk', role: 'easter_egg', lean: 'poised_69',
        notes: [
          { voice: 'marimba', deg: 0, octave: 12, at: 0, dur: 0.18, vol: 0.03, side: -0.1 },
          { voice: 'marimba', deg: 3, octave: 12, at: 0.08, dur: 0.22, vol: 0.032, side: 0 },
          { voice: 'marimba', deg: 2, octave: 12, at: 0.16, dur: 0.26, vol: 0.03, side: 0.1 },
          { voice: 'celesta', deg: 4, octave: 24, at: 0.26, dur: 0.35, vol: 0.022, side: 0.2 }
        ]
      };
    case 'genie_wish':
      return {
        kind: 'genie_wish', role: 'easter_egg', lean: 'lydian_court',
        notes: [
          { voice: 'vibes', deg: 0, octave: 12, at: 0, dur: 0.38, vol: 0.026, side: -0.2 },
          { voice: 'vibes', deg: 4, octave: 12, at: 0.09, dur: 0.42, vol: 0.024, side: -0.05 },
          { voice: 'celesta', deg: 1, octave: 24, at: 0.18, dur: 0.48, vol: 0.022, side: 0.1 },
          { voice: 'celesta', deg: 5, octave: 24, at: 0.28, dur: 0.55, vol: 0.02, side: 0.25 }
        ]
      };
    default:
      return {
        kind: 'pi', role: 'easter_egg', lean: 'poised_69',
        notes: [{ voice: 'celesta', deg: 3, octave: 12, at: 0, dur: 0.2, vol: 0.025 }]
      };
  }
}

/** @type {Map<string, { lean: string, notes: StoryNote[] }>} */
const customFlourishes = new Map();

/**
 * Register a custom thematic flourish for a new character or Book Two guest.
 * @param {string} who
 * @param {{ lean?: string, notes: StoryNote[] }} spec
 */
export function registerThemeFlourish(who, spec) {
  const key = String(who || '').trim().toLowerCase();
  if (!key || !Array.isArray(spec?.notes) || !spec.notes.length) return false;
  customFlourishes.set(key, { lean: String(spec.lean || 'poised_69'), notes: spec.notes.map((n) => ({ ...n })) });
  return true;
}

/**
 * Thematic flourish for a character during gameplay (combos, high vaults, milestones).
 * @param {string} [who]
 * @param {string} [event]
 * @returns {{ who: string, event: string, lean: string, notes: StoryNote[] }}
 */
export function themeFlourishPlan(who = 'boof', event = 'trick') {
  const norm = String(who || 'figure').toLowerCase();
  const custom = customFlourishes.get(norm);
  if (custom) return { who: norm, event, lean: custom.lean, notes: custom.notes.map((n) => ({ ...n })) };
  switch (norm) {
    case 'boof':
      return {
        who: 'boof', event, lean: 'poised_69',
        notes: [
          { voice: 'marimba', deg: 0, octave: 12, at: 0, dur: 0.15, vol: 0.028, side: -0.1 },
          { voice: 'marimba', deg: 3, octave: 12, at: 0.07, dur: 0.18, vol: 0.03, side: 0 },
          { voice: 'kalimba', deg: 4, octave: 12, at: 0.14, dur: 0.24, vol: 0.024, side: 0.15 }
        ]
      };
    case 'boon':
    case 'boonwap':
      return {
        who: 'boon', event, lean: 'lydian_court',
        notes: [
          { voice: 'honk', deg: 0, octave: 12, at: 0, dur: 0.12, vol: 0.032, side: -0.1 },
          { voice: 'honk', deg: 2, octave: 12, at: 0.06, dur: 0.14, vol: 0.034, side: 0 },
          { voice: 'celesta', deg: 4, octave: 24, at: 0.12, dur: 0.28, vol: 0.025, side: 0.18 }
        ]
      };
    case 'bane':
    case 'banewap':
      return {
        who: 'bane', event, lean: 'bebop_bite',
        notes: [
          { voice: 'honk', deg: 4, octave: 12, at: 0, dur: 0.12, vol: 0.03, side: 0.1 },
          { voice: 'honk', deg: 2, octave: 12, at: 0.06, dur: 0.14, vol: 0.032, side: 0 },
          { voice: 'tock', bass: 1, at: 0.12, dur: 0.08, vol: 0.036, side: -0.15 }
        ]
      };
    case 'bonewap':
      return {
        who: 'bonewap', event, lean: 'open_quartal',
        notes: [
          { voice: 'marimba', deg: 3, octave: 0, at: 0, dur: 0.2, vol: 0.035, side: -0.12 },
          { voice: 'marimba', deg: 0, octave: 12, at: 0.08, dur: 0.24, vol: 0.035, side: 0.12 }
        ]
      };
    case 'genie':
      return {
        who: 'genie', event, lean: 'lydian_court',
        notes: [
          { voice: 'vibes', deg: 0, octave: 12, at: 0, dur: 0.32, vol: 0.025, side: -0.15 },
          { voice: 'celesta', deg: 4, octave: 24, at: 0.09, dur: 0.38, vol: 0.022, side: 0.15 }
        ]
      };
    case 'porter':
      return {
        who: 'porter', event, lean: 'backdoor_cadence',
        notes: [
          { voice: 'tock', at: 0, dur: 0.05, vol: 0.035 },
          { voice: 'marimba', deg: 2, octave: 12, at: 0.07, dur: 0.18, vol: 0.028 },
          { voice: 'tock', at: 0.15, dur: 0.05, vol: 0.035 }
        ]
      };
    case 'clerk':
      return {
        who: 'clerk', event, lean: 'bebop_bite',
        notes: [
          { voice: 'tock', at: 0, dur: 0.04, vol: 0.032 },
          { voice: 'tock', at: 0.06, dur: 0.04, vol: 0.034 },
          { voice: 'marimba', deg: 4, octave: 12, at: 0.13, dur: 0.22, vol: 0.03, side: 0.12 }
        ]
      };
    case 'ants':
      return {
        who: 'ants', event, lean: 'open_quartal',
        notes: [
          { voice: 'marimba', deg: 0, octave: 12, at: 0, dur: 0.14, vol: 0.025, side: -0.15 },
          { voice: 'marimba', deg: 2, octave: 12, at: 0.05, dur: 0.16, vol: 0.025, side: 0 },
          { voice: 'marimba', deg: 4, octave: 12, at: 0.1, dur: 0.2, vol: 0.025, side: 0.15 }
        ]
      };
    default:
      return {
        who: 'figure', event, lean: 'poised_69',
        notes: [
          { voice: 'kalimba', deg: 2, octave: 12, at: 0, dur: 0.18, vol: 0.024 },
          { voice: 'celesta', deg: 4, octave: 12, at: 0.08, dur: 0.22, vol: 0.022 }
        ]
      };
  }
}

/**
 * Creative compositional combinator: derive a musical variation from any pure note array
 * (`prime | retrograde | invert | augment | diminish | transpose | echo`).
 * @param {readonly StoryNote[]} notes
 * @param {'prime' | 'retrograde' | 'invert' | 'augment' | 'diminish' | 'transpose' | 'echo'} form
 * @param {{ steps?: number, delay?: number, decay?: number }} [opts]
 * @returns {StoryNote[]}
 */
export function composePhraseVariation(notes, form = 'prime', { steps = 2, delay = 0.16, decay = 0.55 } = {}) {
  if (!Array.isArray(notes) || !notes.length) return [];
  const list = notes.map((n) => ({ ...n }));
  if (form === 'prime') return list;
  if (form === 'retrograde') {
    const times = list.map((n) => n.at);
    return [...list].reverse().map((n, i) => ({ ...n, at: times[i] }));
  }
  if (form === 'invert') {
    const axis = list.find((n) => n.deg != null)?.deg ?? 0;
    return list.map((n) => (n.deg == null ? n : { ...n, deg: 2 * axis - n.deg }));
  }
  if (form === 'augment') return list.map((n) => ({ ...n, at: Number((n.at * 1.5).toFixed(4)), dur: Number((n.dur * 1.35).toFixed(4)) }));
  if (form === 'diminish') return list.map((n) => ({ ...n, at: Number((n.at * 0.68).toFixed(4)), dur: Number(Math.max(0.05, n.dur * 0.72).toFixed(4)) }));
  if (form === 'transpose') return list.map((n) => (n.deg == null ? n : { ...n, deg: n.deg + steps }));
  if (form === 'echo') {
    const tail = list.map((n) => ({
      ...n,
      at: Number((n.at + delay).toFixed(4)),
      vol: Number((n.vol * clamp(decay, 0.15, 0.85)).toFixed(4)),
      side: Number((-(n.side || 0.12)).toFixed(2))
    }));
    return [...list, ...tail].sort((a, b) => a.at - b.at);
  }
  return list;
}
