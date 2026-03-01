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

export const LIFECYCLE_STAGE_ALIASES = Object.freeze({
  boon: 'select',
  bone: 'transform',
  bonk: 'validate',
  honk: 'emit',
  bane: 'fallback'
});

export const RUNTIME_PRECIPITANTS = Object.freeze([
  Object.freeze({ id: 'desugar', input: 'string', output: 'string', delta: 'rewrite sugar' }),
  Object.freeze({ id: 'parse', input: 'string', output: 'AST', delta: 'token to tree' }),
  Object.freeze({ id: 'normalize', input: 'AST', output: 'ONF', delta: 'tree to canonical sigils' }),
  Object.freeze({ id: 'interpret', input: 'ONF', output: 'Value', delta: 'register writes and result' })
]);

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

export function precipitantsForLoadStage(stage) {
  const bridge = LIFECYCLE_BRIDGE[stage];
  return bridge?.mapsTo ? [...bridge.mapsTo] : [];
}

export function lifecycleRoleForLoadStage(stage) {
  const bridge = LIFECYCLE_BRIDGE[stage];
  return bridge?.role || '';
}

export function describeLoadStage(stage) {
  const normalized = String(stage || '').toLowerCase().trim();
  return {
    stage: normalized,
    lifecycleState: mapLoadStageToLifecycleState(normalized),
    pipelineStage: pipelineStageForLoadStage(normalized),
    precipitants: precipitantsForLoadStage(normalized),
    role: lifecycleRoleForLoadStage(normalized)
  };
}

export function isCustomElementType(type) {
  return CUSTOM_ELEMENT_TYPES.includes(type);
}
