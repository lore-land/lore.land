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

export function isCustomElementType(type) {
  return CUSTOM_ELEMENT_TYPES.includes(type);
}
