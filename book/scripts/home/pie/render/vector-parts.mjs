// @ts-check
/**
 * pie/render/vector-parts.mjs — shared Path2D character part grammar, palette-aware
 * offscreen stamp cache, and beat-coupled articulated 2D rig kinematics
 * (.spw/plans/characters-canvas-rig/PLAN.md, PLAN.F#f38).
 *
 * Canon constraints:
 * - The Figure in plain lines ("one circle, one rectangle, four lines, two dots.
 *   Always ink.") never receives costume fills or shaded vector stamps.
 * - Under `reduced: true` (`prefers-reduced-motion: reduce`), all secondary motion
 *   (bob, lean, hem drag, hat float) collapses cleanly to zero.
 */

/**
 * Reusable vector part outlines in local carrier/presence coordinates (origin at
 * carrier body center `(x, y)` or part anchor `(0, 0)`), written as SVG path `d`
 * strings so Canvas `Path2D` and SVG portraits share one portable shape grammar.
 * @type {Readonly<Record<string, { d: string, origin: readonly [number, number], notes: string }>>}
 */
export const VECTOR_PARTS = Object.freeze({
  hatCrown: {
    d: 'M -8 0 A 8 7 0 0 1 8 0 L 8 6 L -8 6 Z',
    origin: [0, 0],
    notes: 'Floating hat crown in local hat space (0, 0).'
  },
  hatBrim: {
    d: 'M -13 6 A 13 3 0 1 0 13 6 A 13 3 0 1 0 -13 6 Z',
    origin: [0, 0],
    notes: 'Floating hat brim ellipse in local hat space (0, 0).'
  },
  porterStrap: {
    d: 'M -11 -33 L 10 -8',
    origin: [0, 0],
    notes: 'Diagonal parcel strap across the porter torso.'
  },
  porterVisor: {
    d: 'M -9 -52 L 9 -52 L 9 -49.5 L -9 -49.5 Z',
    origin: [0, 0],
    notes: 'Peaked porter cap visor sitting beneath the floating hat.'
  },
  clerkCollar: {
    d: 'M -4 -34 L 0 -27 L 4 -34',
    origin: [0, 0],
    notes: 'Crimson waistcoat collar V-line for the feast clerk.'
  },
  genieCollar: {
    d: 'M -5 -34 L 5 -34 L 0 -27 Z',
    origin: [0, 0],
    notes: 'Crisp off-season clerk collar worn by the Genie.'
  },
  baneCrown: {
    d: 'M -16 -14 L -16 -28 L -8 -20 L 0 -32 L 8 -20 L 16 -28 L 16 -14 Z',
    origin: [0, 0],
    notes: 'Mr. BaneWAP hollow paper crown in local presence coordinates.'
  },
  baneSwitchBody: {
    d: 'M 25 -16 L 34 -16 L 34 -10 L 25 -10 Z',
    origin: [0, 0],
    notes: 'Signature off-switch housing on Mr. BaneWAP flank.'
  },
  boonRibbon: {
    d: 'M -28 6 Q 0 12 28 6',
    origin: [0, 0],
    notes: 'Teal boonberry glaze ribbon across Mr. BoonWAP crust.'
  },
  boofTail: {
    d: 'M -17 -3 Q -28 -14 -24 -18',
    origin: [0, 0],
    notes: 'Boof working-dog tail curve.'
  },
  boofCollar: {
    d: 'M 9 -12 Q 11 -3 8 3',
    origin: [0, 0],
    notes: 'Boof amber working collar.'
  }
});

/** @type {Map<string, Path2D>} */
const PATH_CACHE = new Map();

/**
 * Compile and cache a `Path2D` from a named `VECTOR_PARTS` id or raw SVG path `d`.
 * Returns `null` safely in non-browser environments (Node tests without `Path2D`).
 * @param {string} idOrPath
 * @returns {Path2D | null}
 */
export function path2dOf(idOrPath) {
  if (typeof Path2D !== 'function') return null;
  const spec = VECTOR_PARTS[idOrPath];
  const key = spec ? `part:${idOrPath}` : `raw:${idOrPath}`;
  const cached = PATH_CACHE.get(key);
  if (cached) return cached;
  const d = spec ? spec.d : idOrPath;
  if (!d) return null;
  const path = new Path2D(d);
  PATH_CACHE.set(key, path);
  return path;
}

/**
 * Draw a named `VECTOR_PARTS` path onto `ctx` using `Path2D` when available,
 * falling back cleanly to `fallbackFn(ctx)` if `Path2D` is unavailable.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} partId
 * @param {{ fill?: boolean, stroke?: boolean, fallback?: (ctx: CanvasRenderingContext2D) => void }} [opts]
 */
export function drawVectorPart(ctx, partId, { fill = false, stroke = false, fallback } = {}) {
  const path = path2dOf(partId);
  if (path) {
    if (fill) ctx.fill(path);
    if (stroke) ctx.stroke(path);
    return true;
  }
  if (typeof fallback === 'function') {
    fallback(ctx);
    return true;
  }
  return false;
}

/**
 * @typedef {object} CarrierPose
 * @property {number} torsoLean      Radiants of subtle body lean into movement/tilt
 * @property {number} bobY           Vertical breathing / beat-coupled torso offset (px)
 * @property {number} hemSwing       Secondary trailing sway for genie mist / coat / ruff (px)
 * @property {number} hatFloatY      Subtle beat-coupled hover offset for the floating hat (px)
 * @property {number} strideLeft     Left leg forward swing (px)
 * @property {number} strideRight    Right leg forward swing (px)
 * @property {number} plateCounter   Counterbalance horizontal offset for pie plate (px)
 */

/**
 * Compute articulated 2D rig pose for a carrier on the current frame.
 * Couples subtle torso lean, stride asymmetry, hem drag, and hat float to the
 * rhythmic pulse (`beatPulse`) and pie wobble while staying completely still
 * when `reduced` is true or when `state !== 'running'`.
 *
 * @param {{
 *   t?: number,
 *   running?: boolean,
 *   reduced?: boolean,
 *   carrierId?: string,
 *   wobble?: number,
 *   tiltDir?: number,
 *   lift?: number,
 *   beatPulse?: number,
 *   moveProgress?: number,
 *   moveDir?: number
 * }} [input]
 * @returns {CarrierPose}
 */
export function computeCarrierPose({
  t = 0,
  running = false,
  reduced = false,
  carrierId = 'figure',
  wobble = 0,
  tiltDir = 0,
  lift = 0,
  beatPulse = 0,
  moveProgress = 1,
  moveDir = 0
} = {}) {
  if (reduced || !running) {
    return {
      torsoLean: 0,
      bobY: 0,
      hemSwing: 0,
      hatFloatY: 0,
      strideLeft: 0,
      strideRight: 0,
      plateCounter: 0
    };
  }
  const time = Number(t) || 0;
  const pulse = Math.max(0, Math.min(1, Number(beatPulse) || 0));
  const wob = Math.max(0, Math.min(1, Number(wobble) || 0));
  const dir = Math.max(-1, Math.min(1, Number(tiltDir) || 0));
  const stepImpulse = moveProgress < 1 ? Math.sin(moveProgress * Math.PI) * (Number(moveDir) || 0) : 0;

  // Keep the Figure's iconic geometric crispness: stride + minimal beat breath only.
  const isFigure = carrierId === 'figure';
  const baseStride = Math.sin(time * 10) * 5;
  const beatBoost = 1 + pulse * (isFigure ? 0.08 : 0.16);
  const strideLeft = baseStride * beatBoost;
  const strideRight = baseStride * beatBoost;

  const torsoLean = isFigure
    ? 0
    : Math.max(-0.14, Math.min(0.14, stepImpulse * 0.07 + dir * wob * 0.06));

  const bobFreq = carrierId === 'clown' ? 12 : carrierId === 'genie' ? 3.2 : 10;
  const bobAmp = isFigure ? 0 : carrierId === 'genie' ? 1.8 : carrierId === 'clown' ? 1.4 : 0.9;
  const bobY = lift > 0 ? 0 : Math.sin(time * bobFreq) * bobAmp - pulse * (isFigure ? 0 : 1.1);

  const hemSwing = carrierId === 'genie'
    ? Math.sin(time * 3.4) * 4.2 - stepImpulse * 2.5
    : Math.sin(time * 6.5) * 1.4 - stepImpulse * 1.6;

  const hatFloatY = -pulse * (isFigure ? 0.6 : 1.4) + Math.sin(time * 3.6) * (isFigure ? 0.35 : 0.7);
  const plateCounter = isFigure ? 0 : -torsoLean * 12;

  return {
    torsoLean: Number(torsoLean.toFixed(4)),
    bobY: Number(bobY.toFixed(3)),
    hemSwing: Number(hemSwing.toFixed(3)),
    hatFloatY: Number(hatFloatY.toFixed(3)),
    strideLeft: Number(strideLeft.toFixed(3)),
    strideRight: Number(strideRight.toFixed(3)),
    plateCounter: Number(plateCounter.toFixed(3))
  };
}

/**
 * Palette-aware offscreen stamp cache (`OffscreenCanvas` with HTMLCanvasElement
 * fallback and LRU eviction) so complex static stamps (medallions, backdrops,
 * crests) can be rendered once per `(key, paletteKey, dpr)` and blitted fast.
 *
 * @param {{ maxEntries?: number }} [opts]
 */
export function createStampCache({ maxEntries = 64 } = {}) {
  /** @type {Map<string, any>} */
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const makeSurface = (w, h) => {
    if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(w, h);
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const el = document.createElement('canvas');
      el.width = w;
      el.height = h;
      return el;
    }
    return null;
  };

  /**
   * @param {string} key
   * @param {number} width
   * @param {number} height
   * @param {(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void} renderFn
   * @param {number} [dpr]
   */
  function getOrRender(key, width, height, renderFn, dpr = 1) {
    const scale = Math.max(1, Math.min(2, Number(dpr) || 1));
    const fullKey = `${key}@${width}x${height}x${scale}`;
    const existing = cache.get(fullKey);
    if (existing) {
      hits += 1;
      // Refresh insertion order for simple LRU behavior.
      cache.delete(fullKey);
      cache.set(fullKey, existing);
      return existing;
    }
    misses += 1;
    const surface = makeSurface(Math.ceil(width * scale), Math.ceil(height * scale));
    if (!surface) return null;
    const c = surface.getContext('2d');
    if (!c) return null;
    c.save();
    c.scale(scale, scale);
    renderFn(c);
    c.restore();
    cache.set(fullKey, surface);
    if (cache.size > maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    return surface;
  }

  return {
    getOrRender,
    clear() { cache.clear(); },
    stats() { return { size: cache.size, hits, misses, maxEntries }; }
  };
}
