/**
 * texture-materials.mjs — what a thing is made on: texture, typography, physics.
 *
 * texture.website's materials ($ in an address: ?/texture.website/@spwashi/$honey). A material has three
 * registers, read together:
 *   texture     the surface: a ground drawn from a texture held on spwashi's folios (credited by its ~ handle)
 *   typography  how the hand is set on it: the tuning grammar's own dials (spwashi-hand.mjs readTuning)
 *   physics     how the letters move on it, in factshift.center's own words (its app reads these from its address:
 *               alpha, alphaTarget, alphaDecay, velocityDecay, charge, centerStrength, linkStrength) plus fall, so
 *               a material grounds in factshift.center as an address and plays in lore.land's letter blocks as bodies
 *
 * Portable: no DOM. The letter blocks, the middleware (quest-middleware.mjs) and spw.quest can share it.
 */

/* factshift.center's defaults (app.factshift.com src/ts/simulation/force-config.ts, links.strength in init.ts). */
export const FACTSHIFT_DEFAULTS = Object.freeze({ alpha: 0.35, alphaTarget: 0, alphaDecay: 0.05, velocityDecay: 0.52, charge: -30, centerStrength: 0.05, linkStrength: 0.1 });

/* Each physical field in words, and the range an address may set it in (align clamps to these). */
export const PHYSICS = Object.freeze({
  alpha: { says: 'how much it is stirred at the start', min: 0, max: 1 },
  alphaTarget: { says: 'heat that never leaves: how restless it stays', min: 0, max: 0.6 },
  alphaDecay: { says: 'how fast it settles', min: 0.001, max: 0.2 },
  velocityDecay: { says: 'drag: how thick the air is', min: 0.05, max: 0.95 },
  charge: { says: 'how much each thing keeps the others off (below zero, apart)', min: -120, max: 20 },
  centerStrength: { says: 'pull home', min: 0, max: 0.4 },
  linkStrength: { says: 'how tightly neighbours hold', min: 0, max: 1 },
  fall: { says: 'which way down is, and how much (lore.land only)', min: -0.6, max: 0.6 }
});

export const MATERIALS = Object.freeze({
  paper: {
    says: 'the sheet it was lettered on: still, ruled, kept',
    texture: { ground: 'paper', motif: null },
    typography: 'hand',
    physics: { alpha: 0.2, alphaTarget: 0, alphaDecay: 0.06, velocityDecay: 0.6, charge: -20, centerStrength: 0.12, linkStrength: 0.2, fall: 0 }
  },
  wash: {
    says: 'thinned paint over the page: the letters float and drift back',
    texture: { ground: 'wash', motif: 'blue.grey.wash' },
    typography: 'outline ~1.5 $1',
    physics: { alpha: 0.5, alphaTarget: 0.08, alphaDecay: 0.02, velocityDecay: 0.18, charge: -14, centerStrength: 0.02, linkStrength: 0.05, fall: -0.04 }
  },
  drip: {
    says: 'paint that ran: the letters sag and bead, and hang on',
    texture: { ground: 'drip', motif: 'drip.glyph' },
    typography: 'hand %1.4 .1',
    physics: { alpha: 0.4, alphaTarget: 0.02, alphaDecay: 0.03, velocityDecay: 0.42, charge: -10, centerStrength: 0.05, linkStrength: 0.3, fall: 0.35 }
  },
  hatch: {
    says: 'lines laid over lines: stiff, close, every letter keeping its own',
    texture: { ground: 'hatch', motif: 'crosshatch' },
    typography: 'outline &',
    physics: { alpha: 0.3, alphaTarget: 0, alphaDecay: 0.08, velocityDecay: 0.55, charge: -70, centerStrength: 0.22, linkStrength: 0.6, fall: 0 }
  },
  honey: {
    says: 'slow: whatever moves it, it gives back late',
    texture: { ground: 'honey', motif: null },
    typography: 'hand %1.2 ~0.5',
    physics: { alpha: 0.25, alphaTarget: 0, alphaDecay: 0.012, velocityDecay: 0.9, charge: -8, centerStrength: 0.03, linkStrength: 0.4, fall: 0.06 }
  },
  glass: {
    says: 'Bonk City\'s glass, made of old impacts: hard, bright, quick to spring back',
    texture: { ground: 'glass', motif: null },
    typography: 'outline @0',
    physics: { alpha: 0.6, alphaTarget: 0, alphaDecay: 0.09, velocityDecay: 0.3, charge: -40, centerStrength: 0.32, linkStrength: 0.8, fall: 0 }
  },
  storm: {
    says: 'the night at the parcel gate: nothing holds still',
    texture: { ground: 'storm', motif: null },
    typography: 'hand ~2.5 ?1',
    physics: { alpha: 0.9, alphaTarget: 0.35, alphaDecay: 0.02, velocityDecay: 0.22, charge: -45, centerStrength: 0.04, linkStrength: 0.05, fall: 0.12 }
  }
});

export const clampPhysics = (physics) => Object.fromEntries(Object.entries(physics).map(([k, v]) => {
  const f = PHYSICS[k];
  return [k, f ? Math.min(f.max, Math.max(f.min, Number(v))) : v];
}));

/** A material's physics in factshift.center's address: what its app reads (fall stays home: it has no down). */
export function factshiftAddress(name, line = '') {
  const m = MATERIALS[name];
  if (!m) return null;
  const params = new URLSearchParams();
  Object.entries(m.physics).forEach(([k, v]) => { if (k !== 'fall') params.set(k, String(v)); });
  if (line) params.set('spw', line.slice(0, 400));
  return `https://factshift.center/?${params}`;
}

/** How a material's physics differs from factshift.center's own, in words: what grounding it changes. */
export function physicsDelta(name) {
  const m = MATERIALS[name];
  if (!m) return [];
  return Object.entries(m.physics).filter(([k, v]) => k !== 'fall' && v !== FACTSHIFT_DEFAULTS[k]).map(([k, v]) => ({ field: k, from: FACTSHIFT_DEFAULTS[k], to: v, says: PHYSICS[k].says }));
}
