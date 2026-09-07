/**
 * Shared story lexicon for immersive-yet-readable integration.
 * Keeps custom element syntax, valence language, and lifecycle mapping in one place.
 */

export const VALENCE_PENTAD = Object.freeze([
  'boon',
  'bane',
  'bone',
  'bonk',
  'honk'
]);

export const PIPELINE_STAGES = Object.freeze([
  'select',
  'transform',
  'validate',
  'emit'
]);

export const SUBSTRATE_EVENT_KINDS = Object.freeze([
  'write',
  'couple',
  'phase-advance',
  'mark'
]);

export const RESONANCE_TYPES = Object.freeze([
  'value-echo',
  'phase-sync',
  'frequency-lock',
  'implicit-couple'
]);

export const LIFECYCLE_STAGE_ALIASES = Object.freeze({
  boon: 'select',
  bone: 'transform',
  bonk: 'validate',
  honk: 'emit',
  bane: 'fallback'
});

export const RUNTIME_PRECIPITATES = Object.freeze([
  Object.freeze({ id: 'desugar', input: 'string', output: 'string', delta: 'rewrite sugar' }),
  Object.freeze({ id: 'parse', input: 'string', output: 'AST', delta: 'token to tree' }),
  Object.freeze({ id: 'normalize', input: 'AST', output: 'ONF', delta: 'tree to canonical sigils' }),
  Object.freeze({ id: 'interpret', input: 'ONF', output: 'Value', delta: 'register writes and result' })
]);

// Backward-compatible alias for integrations that still reference legacy terminology.
export const RUNTIME_PRECIPITANTS = RUNTIME_PRECIPITATES;

export const LIFECYCLE_BRIDGE = Object.freeze({
  boon: Object.freeze({ role: 'prime assets and preloader', mapsTo: Object.freeze(['desugar']) }),
  bane: Object.freeze({
    role: 'fallback and spinner path',
    mapsTo: Object.freeze(['parse', 'normalize', 'interpret'])
  }),
  bone: Object.freeze({ role: 'skeleton and shape certainty', mapsTo: Object.freeze(['parse', 'normalize']) }),
  bonk: Object.freeze({ role: 'spacing and acoustics checks', mapsTo: Object.freeze(['normalize', 'interpret']) }),
  honk: Object.freeze({ role: 'resolved harmony', mapsTo: Object.freeze(['interpret']) })
});

export const LIFECYCLE_SUBSTRATE_BRIDGE = Object.freeze({
  boon: Object.freeze(['write']),
  bane: Object.freeze(['write', 'phase-advance']),
  bone: Object.freeze(['phase-advance', 'mark']),
  bonk: Object.freeze(['couple', 'mark']),
  honk: Object.freeze(['couple'])
});

export const LIFECYCLE_RESONANCE_BRIDGE = Object.freeze({
  boon: Object.freeze([]),
  bane: Object.freeze(['value-echo']),
  bone: Object.freeze(['phase-sync']),
  bonk: Object.freeze(['frequency-lock']),
  honk: Object.freeze(['implicit-couple'])
});

/**
 * Story voices: custom elements that mark who is speaking or which
 * instrument the chamber is using. Block = a readable chamber;
 * phrase = a charged word inside a sentence. Kickers match the
 * registers in .spw/tools/export-chapters.mjs.
 */
export const STORY_VOICES = Object.freeze({
  'custom-boof': Object.freeze({
    id: 'boof', kicker: 'Boof', grammar: 'narrator', voice: 'boof', style: 'boon'
  }),
  'custom-boonberry': Object.freeze({
    id: 'boonberry', kicker: 'Boonberry', grammar: 'modifier', voice: 'environment', style: 'boon'
  }),
  'custom-fool': Object.freeze({
    id: 'fool', kicker: 'The Fool', grammar: 'interlocutor', voice: 'fool', style: 'paradox'
  }),
  'custom-bonk': Object.freeze({
    id: 'bonk', kicker: 'Bonk', grammar: 'bonk', voice: 'environment', style: 'puzzle'
  }),
  'custom-puzzle': Object.freeze({
    id: 'puzzle', kicker: 'Shard', grammar: 'puzzle', voice: 'environment', style: 'puzzle'
  }),
  'custom-echo': Object.freeze({
    id: 'echo', kicker: 'Echo', grammar: 'echo', voice: 'environment', style: 'boon'
  }),
  'custom-paradox': Object.freeze({
    id: 'paradox', kicker: 'Paradox', grammar: 'paradox', voice: 'fool', style: 'paradox'
  }),
  'custom-mirror': Object.freeze({
    id: 'mirror', kicker: 'Mirror', grammar: 'mirror', voice: 'fool', style: 'paradox'
  }),
  'custom-song': Object.freeze({
    id: 'song', kicker: 'Song', grammar: 'melody', voice: 'environment', style: 'boon'
  }),
  'custom-labyrinth': Object.freeze({
    id: 'labyrinth', kicker: 'Labyrinth', grammar: 'labyrinth', voice: 'environment', style: 'game'
  }),
  'custom-shadow': Object.freeze({
    id: 'shadow', kicker: 'Shadow', grammar: 'shadow', voice: 'fool', style: 'paradox'
  }),
  'custom-game': Object.freeze({
    id: 'game', kicker: 'Fold', grammar: 'game', voice: 'environment', style: 'game'
  }),
  'custom-awakening': Object.freeze({
    id: 'awakening', kicker: 'Bloom', grammar: 'awakening', voice: 'boof', style: 'boon'
  }),
  'custom-path': Object.freeze({
    id: 'path', kicker: 'Path', grammar: 'path', voice: 'boof', style: 'boon'
  }),
  'custom-reflection': Object.freeze({
    id: 'reflection', kicker: 'Record', grammar: 'reflection', voice: 'boof', style: 'default'
  })
});

export const CUSTOM_ELEMENT_TYPES = Object.freeze(Object.keys(STORY_VOICES));

export const CUSTOM_ELEMENTS_SELECTOR = CUSTOM_ELEMENT_TYPES.join(', ');

export const CHAPTER_FLOW_SELECTOR = ['section', ...CUSTOM_ELEMENT_TYPES]
  .map((selector) => `.chapter > ${selector}`)
  .join(', ');

export const STORY_VOICE_READ_BEHAVIOR = 'load-reactive,selection-reactive';

/**
 * Trickster masks the Fool may wear. Known faces get a stable label;
 * any other slug still prints (title-cased) so a later chamber can
 * extend the trope without a code change.
 */
export const TRICKSTER_MASKS = Object.freeze({
  echo: 'Echo',
  riddle: 'Riddle',
  councilor: 'Councilor',
  song: 'Song',
  labyrinth: 'Labyrinth',
  shadow: 'Shadow',
  game: 'Game',
  shard: 'Shard',
  bonk: 'Bonk',
  bloom: 'Bloom',
  beginning: 'Beginning',
  path: 'Path',
  keep: 'Keep'
});

export function tricksterMaskLabel(mask) {
  const key = String(mask || '').trim().toLowerCase();
  if (!key) {
    return '';
  }
  if (TRICKSTER_MASKS[key]) {
    return TRICKSTER_MASKS[key];
  }
  return key
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function voiceKickerWithMask(baseKicker, mask) {
  const maskLabel = tricksterMaskLabel(mask);
  const base = String(baseKicker || '').trim() || 'The Fool';
  return maskLabel ? `${base} · ${maskLabel}` : base;
}

export function storyVoiceFor(type) {
  return STORY_VOICES[String(type || '').toLowerCase()] || null;
}

export function applyStoryVoiceAttributes(element, type, shape) {
  if (!(element instanceof HTMLElement)) {
    return element;
  }

  const normalizedType = String(type || '').toLowerCase();
  const meta = storyVoiceFor(normalizedType);
  const resolvedShape = shape === 'phrase' ? 'phrase' : 'block';

  element.dataset.spwComponent = normalizedType;
  element.dataset.voiceShape = resolvedShape;
  element.setAttribute('data-spw-behavior', STORY_VOICE_READ_BEHAVIOR);

  if (meta) {
    element.dataset.voiceKicker = meta.kicker;
    element.dataset.spwGrammar = meta.grammar;
    element.dataset.spwVoice = meta.voice;
  }

  if (resolvedShape === 'phrase') {
    element.dataset.spwActionable = 'true';
    if (meta?.kicker && !element.getAttribute('title')) {
      element.setAttribute('title', meta.kicker);
    }
  } else {
    delete element.dataset.spwActionable;
    element.removeAttribute('tabindex');
  }

  return element;
}

const LOAD_STAGE_TO_LIFECYCLE_STATE = Object.freeze({
  boon: 'pending',
  bane: 'loading',
  bone: 'loading',
  bonk: 'ready',
  honk: 'ready'
});

export function mapLoadStageToLifecycleState(stage) {
  return LOAD_STAGE_TO_LIFECYCLE_STATE[stage] || 'loading';
}

export function pipelineStageForLoadStage(stage) {
  return LIFECYCLE_STAGE_ALIASES[stage] || '';
}

export function precipitatesForLoadStage(stage) {
  const bridge = LIFECYCLE_BRIDGE[stage];
  return bridge?.mapsTo ? [...bridge.mapsTo] : [];
}

// Backward-compatible alias for integrations that still reference legacy terminology.
export function precipitantsForLoadStage(stage) {
  return precipitatesForLoadStage(stage);
}

export function lifecycleRoleForLoadStage(stage) {
  const bridge = LIFECYCLE_BRIDGE[stage];
  return bridge?.role || '';
}

export function substrateEventsForLoadStage(stage) {
  const events = LIFECYCLE_SUBSTRATE_BRIDGE[stage];
  return events ? [...events] : [];
}

export function resonancesForLoadStage(stage) {
  const resonances = LIFECYCLE_RESONANCE_BRIDGE[stage];
  return resonances ? [...resonances] : [];
}

export function describeLoadStage(stage) {
  const normalized = String(stage || '').toLowerCase().trim();
  return {
    stage: normalized,
    lifecycleState: mapLoadStageToLifecycleState(normalized),
    pipelineStage: pipelineStageForLoadStage(normalized),
    precipitates: precipitatesForLoadStage(normalized),
    precipitants: precipitatesForLoadStage(normalized),
    substrateEvents: substrateEventsForLoadStage(normalized),
    resonances: resonancesForLoadStage(normalized),
    role: lifecycleRoleForLoadStage(normalized)
  };
}

export function isCustomElementType(type) {
  return CUSTOM_ELEMENT_TYPES.includes(type);
}
