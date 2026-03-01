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

export const CUSTOM_ELEMENT_TYPES = Object.freeze([
  'custom-boof',
  'custom-boonberry',
  'custom-fool',
  'custom-bonk',
  'custom-puzzle',
  'custom-echo',
  'custom-paradox',
  'custom-mirror',
  'custom-song',
  'custom-labyrinth',
  'custom-shadow',
  'custom-game',
  'custom-awakening',
  'custom-path',
  'custom-reflection'
]);

export const CUSTOM_ELEMENTS_SELECTOR = CUSTOM_ELEMENT_TYPES.join(', ');

export const CHAPTER_FLOW_SELECTOR = ['section', ...CUSTOM_ELEMENT_TYPES]
  .map((selector) => `.chapter > ${selector}`)
  .join(', ');

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
