// @ts-check
/**
 * pie/sim/recipes.mjs — extensible declarative recipe registry for Exactly One Pie.
 *
 * Keeps culinary mechanics, ingredient rooms, and canvas crust/glaze visual traits
 * together in one place so new recipes can be registered dynamically via
 * `registerRecipe(id, spec)` without editing `pie-game.mjs` or `cast.mjs`.
 */

/**
 * @typedef {object} RecipeVisual
 * @property {string} plateFill
 * @property {string | null} [plateRim]
 * @property {string} crustTop
 * @property {string} crustBottom
 * @property {number} rx
 * @property {number} ry
 * @property {string} fluteFill
 * @property {number} fluteCount
 * @property {number} fluteRadius
 * @property {'slits' | 'lattice'} ventStyle
 * @property {string | null} [latticeDot]
 * @property {boolean} [sheen]
 * @property {boolean} [blisters]
 * @property {boolean} [herbs]
 */

/**
 * @typedef {object} RecipeSpec
 * @property {string} id
 * @property {string} name
 * @property {string} short
 * @property {string} formula
 * @property {string} summary
 * @property {RecipeVisual} visual
 */

/** @type {RecipeVisual} */
const DEFAULT_VISUAL = Object.freeze({
  plateFill: '#e9e2d4',
  plateRim: null,
  crustTop: '#e0a95a',
  crustBottom: '#a8652a',
  rx: 17,
  ry: 6.5,
  fluteFill: '#ecc074',
  fluteCount: 5,
  fluteRadius: 1.5,
  ventStyle: 'slits',
  latticeDot: null,
  sheen: false,
  blisters: false,
  herbs: false
});

/** @type {Readonly<Record<string, RecipeSpec>>} */
export const BUILTIN_RECIPES = Object.freeze({
  warm: {
    id: 'warm',
    name: 'Warm Boonberry Pie',
    short: 'Warm pie',
    formula: 'crust + berries',
    summary: 'Balanced crust and sweet boonberry filling.',
    visual: { ...DEFAULT_VISUAL }
  },
  thin: {
    id: 'thin',
    name: 'Thin Crumble',
    short: 'Thin',
    formula: 'low crust or filling',
    summary: 'Short on an ingredient: lighter slices, tips sooner.',
    visual: {
      ...DEFAULT_VISUAL,
      crustTop: '#d8b784',
      crustBottom: '#987246',
      rx: 15.5,
      fluteCount: 3
    }
  },
  tempered: {
    id: 'tempered',
    name: 'Tempered Whipped Glaze',
    short: 'Tempered',
    formula: 'catch steep tilt (>=34%) while whole',
    summary: '+20% slice speed, +1 wall bounce reach, throws ease tilt.',
    visual: {
      ...DEFAULT_VISUAL,
      sheen: true
    }
  },
  set_jam: {
    id: 'set_jam',
    name: 'Bane-Set Boon Jam',
    short: 'Set jam',
    formula: 'pinch of baneberry into rich filling (>=58%)',
    summary: '+0.75 satisfaction, pierces one obstacle, -25% ingredient cost.',
    visual: {
      ...DEFAULT_VISUAL,
      ventStyle: 'lattice',
      latticeDot: '#d86aa0'
    }
  },
  savoury: {
    id: 'savoury',
    name: 'Hearth Boneberry Pie',
    short: 'Savoury',
    formula: 'boneberry at steady poise (<28% tilt)',
    summary: '-25% knock tilt, heavier crust knockback, refunds +8% crust.',
    visual: {
      ...DEFAULT_VISUAL,
      crustTop: '#c88d4e',
      crustBottom: '#78441e',
      ry: 7.2,
      fluteFill: '#d49b5c',
      herbs: true
    }
  },
  blistered: {
    id: 'blistered',
    name: 'Furrow-Caramel Tart',
    short: 'Caramel',
    formula: 'warm furrow while tilting (>=26%)',
    summary: 'Turns steep tilt into crust & filling, +22% catch reach.',
    visual: {
      ...DEFAULT_VISUAL,
      crustTop: '#f0ba5a',
      crustBottom: '#924118',
      blisters: true
    }
  },
  royal: {
    id: 'royal',
    name: 'Sovereign Quinary',
    short: 'Quinary',
    formula: 'combine crafted recipes while rich (>=78%)',
    summary: 'Full harmonic glaze: fast, wide, piercing & lightly magnetic.',
    visual: {
      ...DEFAULT_VISUAL,
      plateFill: '#f7f0df',
      plateRim: 'rgba(226, 178, 74, 0.8)',
      fluteFill: '#f6d17a',
      fluteRadius: 1.75,
      ventStyle: 'lattice',
      latticeDot: '#ffe082',
      sheen: true
    }
  }
});

/**
 * Live mutable recipe catalog seeded from `BUILTIN_RECIPES`.
 * Callers can read `RECIPES[id]` directly or extend via `registerRecipe`.
 * @type {Record<string, RecipeSpec>}
 */
export const RECIPES = { ...BUILTIN_RECIPES };

/**
 * Register a custom recipe (e.g. from a creator pack, mod, or seasonal trial).
 * Merges visual defaults cleanly so partial visual overrides always render safely.
 * @param {string} id
 * @param {Omit<Partial<RecipeSpec>, 'visual'> & { name: string, visual?: Partial<RecipeVisual> }} spec
 * @returns {RecipeSpec}
 */
export function registerRecipe(id, spec) {
  const key = String(id || '').trim();
  if (!key) throw new Error('registerRecipe requires a non-empty id');
  /** @type {RecipeSpec} */
  const full = {
    id: key,
    name: spec.name,
    short: spec.short || spec.name,
    formula: spec.formula || 'custom craft',
    summary: spec.summary || spec.name,
    visual: { ...DEFAULT_VISUAL, ...(spec.visual || {}) }
  };
  RECIPES[key] = full;
  return full;
}

/**
 * Remove a custom recipe (restores built-in if it shadowed one).
 * @param {string} id
 */
export function unregisterRecipe(id) {
  if (id in BUILTIN_RECIPES) RECIPES[id] = BUILTIN_RECIPES[id];
  else delete RECIPES[id];
}

/** @returns {string[]} */
export function listRecipes() {
  return Object.keys(RECIPES);
}

/**
 * Retrieve visual crust/glaze specification for a recipe id.
 * @param {string} id
 * @returns {RecipeVisual}
 */
export function recipeVisualFor(id) {
  return RECIPES[id]?.visual || BUILTIN_RECIPES.warm.visual;
}

/** Room sigils that act as ingredient pantries. */
export const INGREDIENT_ROOMS = new Set(['~', '*', '$', '?']);

/**
 * Determine which recipe id and charge count result from baking `id` on top
 * of the currently active recipe (`prevId`) at a given `richness` (`0..1`).
 * @param {{ id: string, prevId: string, richness: number, charges?: number }} input
 * @returns {{ id: string, charges: number, royal: boolean } | null}
 */
export function resolveRecipeBake({ id, prevId, richness, charges = 3 }) {
  if (!RECIPES[id]) return null;
  const royal = prevId !== 'warm' && prevId !== 'thin' && prevId !== id && richness >= 0.78;
  return {
    id: royal ? 'royal' : id,
    charges: royal ? 5 : charges,
    royal
  };
}
