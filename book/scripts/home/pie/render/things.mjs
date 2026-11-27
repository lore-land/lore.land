/**
 * pie/render/things.mjs — lane entities, medallions, clowns, mimes, and slice wedges
 * for Exactly One Pie.
 *
 * Replaces the monolithic switch in `pie-game.mjs` with a declarative
 * `THING_RENDERERS` table and `registerThingRenderer(kind, drawFn)` so new
 * creatures, props, or seasonal wonders can be plugged in without modifying core
 * rendering loops.
 */

export const HAZARD_SCALE = 1.2;
export const SEAL_SIZE = Object.freeze({ creature: 25, antique: 19, artifact: 18, contrivance: 21, bracework: 21 });
export const BREATHES = new Set(['beaver', 'dolphin', 'snail', 'pigeon', 'clerk', 'clown', 'subject']);
export const FLOATS = new Set(['wasps', 'wonder', 'egg']);
export const SWAYS = new Set(['boonrose', 'banerose', 'banner']);

const CUSTOM_THING_RENDERERS = new Map();

/**
 * Register a custom canvas renderer for a lane thing `kind`.
 * The callback receives `(ctx, thing, helpers)`.
 * @param {string} kind
 * @param {(ctx: CanvasRenderingContext2D, thing: any, helpers: any) => void} drawFn
 */
export function registerThingRenderer(kind, drawFn) {
  if (!kind || typeof drawFn !== 'function') throw new Error('registerThingRenderer(kind, fn) requires a kind and function');
  CUSTOM_THING_RENDERERS.set(String(kind), drawFn);
}

/** @param {string} kind */
export function unregisterThingRenderer(kind) {
  CUSTOM_THING_RENDERERS.delete(String(kind));
}

/**
 * Trace a wonder medallion frame onto `ctx`.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} kind
 * @param {number} x
 * @param {number} y
 */
export function medallionPath(ctx, kind, x, y) {
  ctx.beginPath();
  switch (kind) {
    case 'antique': ctx.roundRect(x - 15, y - 11, 30, 22, 3); break;
    case 'artifact': ctx.moveTo(x - 14, y - 10); ctx.lineTo(x + 8, y - 10); ctx.lineTo(x + 16, y); ctx.lineTo(x + 8, y + 10); ctx.lineTo(x - 14, y + 10); ctx.closePath(); break;
    case 'contrivance':
      for (let i = 0; i < 20; i += 1) {
        const a = (i / 20) * Math.PI * 2;
        const r = i % 2 ? 11.5 : 15;
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      break;
    case 'bracework': ctx.roundRect(x - 12, y - 14, 24, 28, 7); break;
    case 'saying': ctx.moveTo(x - 17, y - 8); ctx.lineTo(x + 17, y - 8); ctx.lineTo(x + 13, y); ctx.lineTo(x + 17, y + 8); ctx.lineTo(x - 17, y + 8); ctx.lineTo(x - 13, y); ctx.closePath(); break;
    default: ctx.arc(x, y, 13, 0, Math.PI * 2);
  }
}

/**
 * Initialize thing/entity canvas renderers bound to the live game state getters.
 * @param {object} deps
 */
export function initThingsRenderer({
  getCtx, getRun, getState, getColors, record, reduced,
  W, LANES, LANE_W, laneX, clamp, mix,
  WIDE, SLIPS, KIND_SIGIL, GIFT_ART,
  domainTune, getTuningDomains, cadenceLift, mawAhead, heightMark
}) {
  const seals = { mod: null, images: new Map() };
  const setLikenessMod = (mod) => { seals.mod = mod; };
  const sealImage = (wonder) => {
    if (!seals.mod || !wonder?.id || !SEAL_SIZE[wonder.kind]) return null;
    let img = seals.images.get(wonder.id);
    if (img === undefined) {
      const item = seals.mod.likenessItem(`wonder:${wonder.id}`);
      img = item ? new Image() : null;
      if (img) img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(seals.mod.likenessMarkup(item, { size: 64, decorative: true }))}`;
      seals.images.set(wonder.id, img);
    }
    return img?.complete && img.naturalWidth ? img : null;
  };

  let thingLookOf = { src: null, val: { contrast: 1, bounce: 1 } };
  const thingLook = () => {
    const src = getTuningDomains();
    if (thingLookOf.src !== src) {
      const tune = domainTune('characters');
      thingLookOf = {
        src,
        val: {
          contrast: clamp(Number(tune.obstacle_contrast) || 1, 0.7, 1.5),
          bounce: clamp(Number(tune.bounce_scale ?? 1), 0, 1.8)
        }
      };
    }
    return thingLookOf.val;
  };

  const lifeOf = (thing) => {
    const run = getRun();
    const b = thingLook().bounce;
    if (!b || reduced?.matches || getState() !== 'running' || !run || thing.knocked || thing.cleared || thing.wapped) return null;
    const ph = run.t * 2.4 + thing.x * 0.071 + (Number(thing.born) || 0) * 1.3;
    if (BREATHES.has(thing.kind)) { const s = Math.sin(ph * 1.6) * 0.04 * b; return { sx: 1 - s * 0.6, sy: 1 + s, lift: 0, rot: 0 }; }
    if (FLOATS.has(thing.kind)) return { sx: 1, sy: 1, lift: (1 + Math.sin(ph)) * 2.2 * b, rot: 0 };
    if (SWAYS.has(thing.kind)) return { sx: 1, sy: 1, lift: 0, rot: Math.sin(ph * 0.8) * 0.06 * b };
    return null;
  };

  function drawMime(x, y, facing, t, marching = false) {
    const ctx = getCtx();
    ctx.save();
    ctx.translate(x, y);
    const sway = reduced?.matches ? 0 : Math.sin(t * 2.4) * 1.2;
    ctx.fillStyle = '#1d1d22';
    ctx.fillRect(-6, 8, 4, 10);
    ctx.fillRect(2, 8, 4, 10);
    ctx.fillStyle = '#fbfaf6';
    ctx.beginPath(); ctx.roundRect(-9, -6, 18, 16, 4); ctx.fill();
    ctx.fillStyle = '#1d1d22';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(-9, -4 + i * 4, 18, 1.8);
    ctx.fillStyle = '#fbfaf6';
    ctx.strokeStyle = 'rgba(40, 40, 46, 0.6)';
    ctx.lineWidth = 1;
    if (marching) {
      ctx.beginPath(); ctx.arc(-2, -10, 2.6, 0, Math.PI * 2); ctx.arc(3, -12, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(facing * 13 + sway, -8, 3, 4, 0, 0, Math.PI * 2); ctx.ellipse(facing * 13 + sway, 2, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#fbfaf6';
    ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.ellipse(1, -21, 7.5, 3, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-3.6, -16, 1.4, 3); ctx.fillRect(2.2, -16, 1.4, 3);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.ellipse(0, -10.5, 2, 1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawClown(x, y, pied, bounce = 0, missing = null) {
    const ctx = getCtx();
    const colors = getColors();
    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.fillStyle = '#e8c34a';
    ctx.beginPath(); ctx.roundRect(-10, 2, 20, 16, 6); ctx.fill();
    ctx.fillStyle = '#d6473e';
    [[-5, 7], [4, 12], [-2, 15]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.arc(i * 4, 1, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e0582e';
    ctx.fillRect(-11, -24, 3.2, 10);
    ctx.beginPath(); ctx.arc(-9.4, -11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(8, -24, 3.2, 10);
    ctx.beginPath(); ctx.arc(9.6, -11, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbf6ee';
    ctx.beginPath(); ctx.arc(0, -9, 8, 0, Math.PI * 2); ctx.fill();
    if (pied) {
      ctx.fillStyle = '#e0a95a';
      if (missing !== 'crust' && missing !== 'everything') { ctx.beginPath(); ctx.arc(0, -9, 9, 0, Math.PI * 2); ctx.fill(); }
      if (missing === 'everything') [[-4, -12], [3, -7], [5, -13], [-2, -5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 1.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = colors.berry;
      for (let i = 0; i < (missing === 'filling' || missing === 'everything' ? 0 : 6); i += 1) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 9, -9 + Math.sin(a) * 9, 3, 1.6, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#7a3a1a';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, -7, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(0, -8, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath(); ctx.arc(-3, -12, 1.1, 0, Math.PI * 2); ctx.arc(3, -12, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d6473e';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -6, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWedge(x, y, spin, gold = false, missing = null, size = 1) {
    const ctx = getCtx();
    const colors = getColors();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.scale(size, size);
    ctx.fillStyle = missing === 'crust' || missing === 'everything' ? 'rgba(224, 169, 90, 0.25)' : '#e0a95a';
    ctx.strokeStyle = gold ? '#f2c14e' : '#8a4a1a';
    ctx.lineWidth = gold ? 2 : 1;
    if (missing) ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    if (missing !== 'filling' && missing !== 'everything') {
      ctx.fillStyle = colors.berry;
      ctx.fillRect(-6, 3, 12, 2.5);
    }
    ctx.restore();
  }

  /** Declarative per-kind render table (extended dynamically via `registerThingRenderer`). */
  const BUILTIN_THING_RENDERERS = {
    stone(ctx, thing) {
      const { x, y } = thing;
      const rock = [[-15, 9], [-16, 0], [-10, -9], [-3, -14], [5, -12], [12, -7], [16, 2], [13, 10]];
      ctx.fillStyle = '#5f5a52';
      ctx.strokeStyle = '#2f2b26';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      rock.forEach(([dx, dy], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a847a';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 9); ctx.lineTo(x - 3, y - 14); ctx.lineTo(x + 5, y - 12); ctx.lineTo(x + 1, y - 3); ctx.lineTo(x - 8, y - 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2f2b26';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x + 1, y - 3); ctx.lineTo(x + 4, y + 4); ctx.lineTo(x + 2, y + 9);
      ctx.moveTo(x + 1, y - 3); ctx.lineTo(x + 10, y - 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(236, 246, 252, 0.9)';
      [[-6, -10], [-1, -12], [3, -11], [-9, -5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.2, 0, Math.PI * 2); ctx.fill(); });
    },
    pane(ctx, thing, { run }) {
      const { x, y } = thing;
      const glassGrad = ctx.createLinearGradient(x - 15, y - 15, x + 15, y + 14);
      glassGrad.addColorStop(0, 'rgba(190, 238, 242, 0.58)');
      glassGrad.addColorStop(0.5, 'rgba(130, 198, 206, 0.36)');
      glassGrad.addColorStop(1, 'rgba(170, 224, 230, 0.52)');
      ctx.fillStyle = glassGrad;
      ctx.strokeStyle = 'rgba(58, 108, 118, 0.92)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 15, y + 12); ctx.lineTo(x - 12, y - 15); ctx.lineTo(x + 15, y - 12); ctx.lineTo(x + 13, y + 14); ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a5a62';
      [[-12, -15], [15, -12], [13, 14], [-15, 12]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.arc(x + cx * 0.88, y + cy * 0.88, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 2); ctx.lineTo(x - 9, y - 10);
      ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 8, y - 6);
      ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 2, y + 10);
      ctx.moveTo(x - 10, y + 6); ctx.lineTo(x + 6, y - 10);
      ctx.stroke();
      if (run && run.sliceReady >= 1 && !thing.knocked && !thing.wapped) {
        ctx.strokeStyle = 'rgba(242, 193, 78, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x + 9, y - 9, 2.2, 0, Math.PI * 2); ctx.stroke();
      }
    },
    baneberry(ctx, thing) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.6) * 3);
      ctx.strokeStyle = thing.sweetened ? 'rgba(242, 193, 78, 0.85)' : 'rgba(120, 60, 150, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash(thing.sweetened ? [] : [2, 3]);
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      [[-4, 2], [4, 2], [0, -4], [-1, 6], [5, -3]].forEach(([dx, dy]) => {
        const g = ctx.createRadialGradient(x + dx - 1.5, y + dy - 1.5, 0.5, x + dx, y + dy, 5);
        if (thing.sweetened) {
          g.addColorStop(0, '#ffe38a');
          g.addColorStop(0.45, '#d4843a');
          g.addColorStop(1, '#5a2548');
        } else {
          g.addColorStop(0, '#9c7bd0');
          g.addColorStop(0.35, '#4a2560');
          g.addColorStop(1, '#1c0d24');
        }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = thing.sweetened ? 'rgba(255, 250, 220, 0.8)' : 'rgba(220, 195, 255, 0.55)';
        ctx.beginPath(); ctx.arc(x + dx - 1.4, y + dy - 1.6, 1.1, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = thing.sweetened ? '#557038' : '#3a4a2a';
      ctx.beginPath(); ctx.ellipse(x + 4, y - 10, 4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a4a2a';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x - 4, y - 14); ctx.lineTo(x - 2, y - 11); ctx.stroke();
    },
    beaver(ctx, thing, { colors }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.6) * 3);
      const dir = thing.vx < 0 ? -1 : 1;
      ctx.fillStyle = '#5a3a22';
      ctx.beginPath(); ctx.ellipse(x - dir * 15, y + 3, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(30, 18, 10, 0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - dir * 20, y + 3); ctx.lineTo(x - dir * 10, y + 3); ctx.stroke();
      if (!thing.wapped && !reduced?.matches) {
        ctx.strokeStyle = 'rgba(90, 58, 34, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i += 1) {
          ctx.beginPath();
          ctx.ellipse(x - dir * (20 + i * 6), y + 6, 2.5 + i, 1.1, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#8a5a34';
      ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + dir * 11, y - 3, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbf6ea';
      ctx.fillRect(x + dir * 15 - 1.5, y, 3, 3.5);
      ctx.fillStyle = '#1d1209';
      ctx.beginPath(); ctx.arc(x + dir * 13, y - 5, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = colors.accent;
      ctx.font = '700 7px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      if (!thing.wapped) ctx.fillText('SLOW', x, y - 14);
    },
    mime(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
      drawMime(x, y - cadenceLift('mime', run.t + thing.born) * 2, thing.facing || 1, run.t + thing.born);
      if (thing.former?.bakes) {
        ctx.fillStyle = 'rgba(255, 252, 244, 0.95)';
        ctx.strokeStyle = 'rgba(40, 40, 46, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.roundRect(x - 6, y - 2, 12, 14, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(236, 226, 204, 0.9)';
        [[-3, 3], [2, 6], [-1, 9], [4, 1]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 0.9, 0, Math.PI * 2); ctx.fill(); });
      }
      if (thing.eating) {
        const lift = reduced?.matches ? 0 : Math.abs(Math.sin(run.t * 2.2 + thing.born)) * 3;
        ctx.fillStyle = '#fbf6ea';
        ctx.strokeStyle = '#2a2a30';
        ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.ellipse(x + 10, y + 6, 6, 2.6, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a2c5a';
        [[-2, 5], [0, 4.5], [2, 5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + 10 + dx, y + dy, 1.3, 0, Math.PI * 2); ctx.fill(); });
        ctx.beginPath(); ctx.moveTo(x + 14, y + 3); ctx.lineTo(x + 17, y - 3 - lift); ctx.stroke();
      } else if (thing.waiting) {
        ctx.fillStyle = '#2a2a30';
        [0, 3, 6].forEach((dx) => { ctx.beginPath(); ctx.arc(x + 9 + dx, y - 20, 0.9, 0, Math.PI * 2); ctx.fill(); });
      }
      if (thing.aghast != null && run.t - thing.aghast < 2.4) {
        ctx.strokeStyle = '#2a2a30';
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x + 9, y - 22); ctx.lineTo(x + 13, y - 27); ctx.moveTo(x + 11, y - 18); ctx.lineTo(x + 16, y - 20); ctx.stroke();
      }
    },
    mimewall(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.shattered) {
        const k = Math.min(1, (thing.wapT || 0) / 1.1);
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.strokeStyle = 'rgba(150, 175, 200, 0.9)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        [[-14, -12, 1], [6, -16, -1], [-4, 2, 1], [12, 6, -1], [-12, 10, -1]].forEach(([dx, dy, s], i) => {
          const fall = k * (16 + i * 5);
          ctx.beginPath();
          ctx.moveTo(x + dx, y + dy + fall);
          ctx.lineTo(x + dx + 8 * s, y + dy + 3 + fall);
          ctx.lineTo(x + dx + 3 * s, y + dy + 9 + fall);
          ctx.closePath();
          ctx.stroke();
        });
        ctx.setLineDash([]);
        return;
      }
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
      const shimmer = reduced?.matches ? 0.5 : 0.5 + Math.sin(run.t * 3 + thing.born) * 0.5;
      ctx.fillStyle = `rgba(214, 228, 240, ${0.18 + shimmer * 0.1})`;
      ctx.strokeStyle = `rgba(150, 175, 200, ${0.55 + shimmer * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.rect(x - 20, y - 22, 40, 40); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      [[-8, -6], [8, 2]].forEach(([dx, dy]) => {
        ctx.fillStyle = '#fbfaf6';
        ctx.strokeStyle = 'rgba(40, 40, 46, 0.6)';
        ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        for (let f = -1.5; f <= 1.5; f += 1) { ctx.beginPath(); ctx.ellipse(x + dx + f * 2.4, y + dy - 6.5, 1.1, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      });
    },
    march(ctx, thing, { run }) {
      const { y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
      for (let lane = 0; lane < LANES; lane += 1) {
        if (lane === thing.gap) continue;
        const mx = laneX(lane);
        drawMime(mx, y + 4, lane < thing.gap ? 1 : -1, run.t + lane, true);
        ctx.fillStyle = '#fbfaf6';
        ctx.strokeStyle = '#2a2a30';
        ctx.lineWidth = 1.2;
        ctx.fillRect(mx - 13, y - 40, 26, 16);
        ctx.strokeRect(mx - 13, y - 40, 26, 16);
        ctx.beginPath(); ctx.moveTo(mx, y - 24); ctx.lineTo(mx, y - 12); ctx.stroke();
        if (lane === (thing.gap + 2) % LANES) {
          ctx.fillStyle = '#2a2a30';
          ctx.font = '800 8px "JetBrainsMono", ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MAW', mx, y - 29);
        } else if (lane % 2) {
          ctx.fillStyle = '#e0a95a';
          ctx.beginPath(); ctx.ellipse(mx, y - 32, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#c0392b';
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(mx - 7, y - 37); ctx.lineTo(mx + 7, y - 27); ctx.stroke();
        }
      }
    },
    hole(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = '#7a5a3a';
      ctx.beginPath(); ctx.ellipse(x, y + 1, 19, 10, 0, 0, Math.PI * 2); ctx.fill();
      const mouth = ctx.createRadialGradient(x, y + 2, 1, x, y + 2, 15);
      mouth.addColorStop(0, '#0d0906');
      mouth.addColorStop(1, '#3a2716');
      ctx.fillStyle = mouth;
      ctx.beginPath(); ctx.ellipse(x, y + 2, 15, 7.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4a2c';
      [[-20, -6], [17, -7], [22, 4], [-23, 5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); });
    },
    ditch(ctx, thing) {
      const { y } = thing;
      const top = y - thing.h / 2;
      ctx.fillStyle = '#6a4a2c';
      ctx.fillRect(0, top - 3, W, thing.h + 6);
      const pit = ctx.createLinearGradient(0, top, 0, top + thing.h);
      pit.addColorStop(0, '#120c08');
      pit.addColorStop(1, '#3a2716');
      ctx.fillStyle = pit;
      ctx.fillRect(0, top + 2, W, thing.h - 4);
      if (!thing.cleared && !thing.knocked) {
        ctx.fillStyle = 'rgba(242, 193, 78, 0.9)';
        ctx.font = '800 10px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let lane = 0; lane < LANES; lane += 2) ctx.fillText('HOP ⤒', laneX(lane), y);
        ctx.textBaseline = 'alphabetic';
      }
    },
    frost(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = 'rgba(226, 240, 248, 0.85)';
      ctx.beginPath(); ctx.ellipse(x, y, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(120, 165, 190, 0.8)';
      ctx.lineWidth = 1;
      [[-12, 0], [0, -2], [11, 1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        for (let i = 0; i < 3; i += 1) {
          const a = (i / 3) * Math.PI;
          ctx.moveTo(x + dx - Math.cos(a) * 4, y + dy - Math.sin(a) * 2.5);
          ctx.lineTo(x + dx + Math.cos(a) * 4, y + dy + Math.sin(a) * 2.5);
        }
        ctx.stroke();
      });
    },
    furrow(ctx, thing, { run }) {
      const { x, y } = thing;
      ctx.fillStyle = thing.warmed ? 'rgba(130, 82, 46, 0.55)' : 'rgba(220, 128, 42, 0.22)';
      ctx.beginPath(); ctx.roundRect(x - 28, y - 7, 56, 14, 7); ctx.fill();
      ctx.fillStyle = '#5a3f2a';
      ctx.strokeStyle = '#3c2616';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x - 26, y - 5, 52, 10, 5); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 5; i += 1) {
        const tx = x - 20 + i * 10;
        const flick = thing.warmed ? 0.35 : 0.8 + Math.sin(run.t * 9 + i) * 0.2;
        ctx.fillStyle = `rgba(255, 190, 90, ${flick})`;
        ctx.beginPath(); ctx.arc(tx, y, 2, 0, Math.PI * 2); ctx.fill();
        if (!thing.warmed) {
          ctx.fillStyle = 'rgba(255, 240, 195, 0.75)';
          ctx.beginPath(); ctx.arc(tx, y - 0.5, 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    egg(ctx, thing, { run }) {
      const { x, y } = thing;
      const pulse = reduced?.matches ? 0 : Math.sin(run.t * 2.2) * 0.12;
      const glow = ctx.createRadialGradient(x, y - 4, 2, x, y - 4, 30);
      glow.addColorStop(0, `rgba(255, 186, 96, ${0.45 + pulse})`);
      glow.addColorStop(1, 'rgba(255, 186, 96, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y - 4, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a07a3c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = -2; i <= 2; i += 1) { ctx.moveTo(x - 14, y + 8 + i); ctx.lineTo(x + 14, y + 6 - i); }
      ctx.stroke();
      const shell = ctx.createLinearGradient(x - 9, y - 18, x + 9, y + 8);
      shell.addColorStop(0, '#fbf1dc');
      shell.addColorStop(1, '#d9b98a');
      ctx.fillStyle = shell;
      ctx.beginPath(); ctx.ellipse(x, y - 5, 9.5, 12.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(160, 110, 50, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - 4, y - 12); ctx.lineTo(x - 1, y - 9); ctx.lineTo(x - 3, y - 6); ctx.stroke();
    },
    wonder(ctx, thing, { run, colors }) {
      const { x, y } = thing;
      if (mawAhead() && !thing.wapped && Math.hypot(thing.x - run.x, thing.y - run.y) > 120) {
        ctx.strokeStyle = 'rgba(150, 175, 200, 0.7)';
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(150, 175, 200, 0.8)';
        ctx.font = '700 12px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y + 1);
        ctx.textBaseline = 'alphabetic';
        return;
      }
      if (thing.wapped) {
        const t = Math.min(1, (thing.wapT - 0.5) / 0.6);
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.translate(x, y);
        ctx.scale(1 + t * 0.8, 1 + t * 0.8);
        ctx.translate(-x, -y);
      }
      const wk = thing.wonder?.kind;
      const motion = thing.wonder?.motion;
      const lift = motion === 'flies' ? -14 : 0;
      const bob = lift + ((reduced?.matches || wk === 'antique' || wk === 'artifact') ? 0 : Math.sin(run.t * 3 + thing.born) * 2);
      if (lift) {
        ctx.save();
        ctx.globalAlpha *= 0.25;
        ctx.fillStyle = colors.ink;
        ctx.beginPath(); ctx.ellipse(x, y + 10, 11, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = mix(colors.paper, 'rgb(255, 255, 255)', 0.4);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 2.5;
      medallionPath(ctx, wk, x, y + bob);
      ctx.fill();
      ctx.stroke();
      const seal = sealImage(thing.wonder);
      if (seal) {
        const d = SEAL_SIZE[wk];
        ctx.drawImage(seal, x - d / 2, y + bob - d / 2, d, d);
      }
      if (motion === 'burrows') {
        ctx.fillStyle = mix(colors.paper, colors.ink, 0.25);
        ctx.fillRect(x - 16, y + bob + 3, 32, 12);
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (seal && KIND_SIGIL[wk] === '.') {
        ctx.fillStyle = '#fffaf0';
        ctx.strokeStyle = 'rgba(24, 18, 28, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y + bob, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (seal) {
        ctx.font = '800 12px "JetBrainsMono", ui-monospace, monospace';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(24, 18, 28, 0.6)';
        ctx.strokeText(KIND_SIGIL[wk] || '@', x, y + bob + 1);
        ctx.fillStyle = '#fffaf0';
      } else {
        ctx.fillStyle = colors.accent;
        ctx.font = '800 14px "JetBrainsMono", ui-monospace, monospace';
      }
      if (!seal || KIND_SIGIL[wk] !== '.') ctx.fillText(KIND_SIGIL[wk] || '@', x, y + bob + 1);
      ctx.textBaseline = 'alphabetic';
      if (thing.wonder?.name && !thing.wapped && !thing.leaving) {
        ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
        ctx.fillStyle = colors.ink;
        ctx.fillText(thing.wonder.name.toUpperCase(), clamp(x, 36, W - 36), y + bob - 19);
      }
    },
    throne(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = '#c9a23a';
      ctx.strokeStyle = '#6a4e14';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 14, y - 18, 28, 14, 4);
      ctx.rect(x - 15, y - 4, 30, 9);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8a5a34';
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x - 8, y - 16); ctx.lineTo(x - 3, y - 6); ctx.lineTo(x + 1, y + 1); ctx.stroke();
      ctx.fillStyle = '#8a3a3a';
      ctx.fillRect(x - 11, y - 3, 22, 5);
      ctx.fillStyle = '#3a2a14';
      ctx.fillRect(x - 8, y + 5, 16, 3);
      ctx.fillStyle = '#b8935a';
      ctx.fillRect(x - 13, y + 8, 4, 8);
      ctx.fillRect(x + 9, y + 8, 4, 8);
      ctx.fillStyle = '#6a4e14';
      ctx.font = '600 6px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('RENTED', x, y - 9);
    },
    subject(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.25) * 1.4);
      else {
        const step = reduced?.matches ? 0 : Math.sin((run?.t || 0) * 6 + (thing.born || 0)) * 3;
        ctx.strokeStyle = '#2a241c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 10); ctx.lineTo(x - 6 - step, y + 18);
        ctx.moveTo(x + 3, y + 10); ctx.lineTo(x + 6 + step, y + 18);
        ctx.stroke();
      }
      ctx.fillStyle = '#3e4a38';
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 8); ctx.lineTo(x - 12, y + 11); ctx.lineTo(x + 11, y + 11); ctx.lineTo(x + 8, y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4e5c46';
      ctx.beginPath(); ctx.ellipse(x - 1, y - 4, 10, 4.5, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#c4922e';
      ctx.beginPath(); ctx.arc(x - 1, y - 5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c3828';
      ctx.fillRect(x - 12, y + 7, 23, 4);
      ctx.fillStyle = '#e2b48c';
      ctx.beginPath(); ctx.arc(x - 1, y - 13, 6.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c3828';
      ctx.beginPath(); ctx.arc(x - 1, y - 15, 6.4, Math.PI, 0); ctx.fill();
      if (thing.loaf || thing.shared) {
        ctx.fillStyle = thing.shared ? '#f2c14e' : '#c98a3e';
        ctx.beginPath(); ctx.ellipse(x + 11, y + 1, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a4a1c';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 13, y + 2); ctx.stroke();
      } else {
        ctx.fillStyle = '#c9b08a';
        ctx.fillRect(x + 8, y - 2, 10, 8);
        ctx.strokeStyle = '#6a4e2c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 13, y - 2); ctx.lineTo(x + 13, y + 6);
        ctx.moveTo(x + 8, y + 2); ctx.lineTo(x + 18, y + 2);
        ctx.stroke();
      }
    },
    pile(ctx, thing) {
      const { x, y } = thing;
      const flat = thing.trodden ? 0.6 : 1;
      ctx.fillStyle = '#f2ead8';
      ctx.strokeStyle = 'rgba(150, 130, 95, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - thing.w / 2, y + 6);
      ctx.quadraticCurveTo(x - 6, y - 12 * flat, x + 4, y - 9 * flat);
      ctx.quadraticCurveTo(x + 14, y - 6 * flat, x + thing.w / 2, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(150, 130, 95, 0.75)';
      ctx.font = '700 7px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⌃', x, y + 3);
    },
    berry(ctx, thing) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.7) * 3);
      [[-5, 2], [5, 2], [0, -5], [-2, 6], [4, -2]].forEach(([dx, dy]) => {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0.5, x + dx, y + dy, 5.5);
        g.addColorStop(0, '#f4b25c');
        g.addColorStop(0.35, '#c86d2c');
        g.addColorStop(0.55, '#4d9f97');
        g.addColorStop(1, '#235f5b');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 252, 238, 0.6)';
        ctx.beginPath(); ctx.arc(x + dx - 1.5, y + dy - 1.7, 1.15, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#487a42';
      ctx.beginPath(); ctx.ellipse(x - 5, y - 10, 4.5, 2.2, 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3d6a3a';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 3, y - 14, x + 7, y - 15); ctx.stroke();
      if (thing.rolled) {
        const dir = Math.sign((thing.rollTo ?? x) - x) || 1;
        ctx.fillStyle = '#3a2a20';
        for (let i = 1; i <= 4; i += 1) { ctx.beginPath(); ctx.arc(x - dir * (8 + i * 4.5), y + 7 + (i % 2), 1.5, 0, Math.PI * 2); ctx.fill(); }
      }
    },
    anthill(ctx, thing, { run }) {
      const { x, y } = thing;
      ctx.fillStyle = '#9a6a3c';
      ctx.beginPath(); ctx.ellipse(x, y + 4, 18, 9, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2a1a10';
      ctx.beginPath(); ctx.ellipse(x, y + 1, 3.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6b24a';
      ctx.beginPath(); ctx.arc(x + 9, y - 2, 1.4, 0, Math.PI * 2); ctx.fill();
      const lifting = thing.liftAt != null && run.t - thing.liftAt < 3.2;
      ctx.fillStyle = '#3a2a20';
      ctx.strokeStyle = '#3a2a20';
      ctx.lineWidth = 0.9;
      [[-12, 6], [-4, 8], [6, 7], [13, 5]].forEach(([dx, dy], i) => {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.5, 0, Math.PI * 2); ctx.fill();
        if (lifting && i < 3) {
          const up = reduced?.matches ? 0 : Math.abs(Math.sin((run.t - thing.liftAt) * 6 + i)) * 2.5;
          ctx.beginPath(); ctx.moveTo(x + dx - 3, y + dy - 3 - up); ctx.lineTo(x + dx + 3, y + dy - 3 - up); ctx.stroke();
          ctx.fillRect(x + dx - 3.6, y + dy - 4.4 - up, 1.2, 2.8);
          ctx.fillRect(x + dx + 2.4, y + dy - 4.4 - up, 1.2, 2.8);
        }
      });
    },
    place(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.faint) ctx.globalAlpha *= 0.62;
      ctx.fillStyle = '#f3ead6';
      ctx.strokeStyle = 'rgba(122, 79, 46, 0.55)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.roundRect(x - 17, y - 3, 34, 13, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fffdf6';
      ctx.strokeStyle = 'rgba(60, 50, 44, 0.6)';
      ctx.beginPath(); ctx.ellipse(x - 4, y + 3, 8, 4.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x - 4, y + 3, 4.6, 2.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#c4922e';
      ctx.fillRect(x + 7, y - 1, 5, 6);
      ctx.strokeRect(x + 7, y - 1, 5, 6);
      if (!thing.faint && !reduced?.matches) {
        const drift = Math.sin(run.t * 2.2 + x) * 1.6;
        ctx.strokeStyle = 'rgba(255, 253, 246, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 9.5, y - 3); ctx.quadraticCurveTo(x + 9.5 + drift, y - 8, x + 9.5 - drift, y - 12); ctx.stroke();
      }
      if (thing.met) {
        ctx.fillStyle = 'rgba(196, 146, 46, 0.3)';
        ctx.beginPath(); ctx.ellipse(x, y + 3, 21, 9.5, 0, 0, Math.PI * 2); ctx.fill();
      }
    },
    dolphin(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.faint) ctx.globalAlpha *= 0.6;
      const leap = reduced?.matches ? 0 : Math.max(0, Math.sin(run.t * 3.2 + thing.born * 2)) * (thing.ride > 0 ? 7 : 4);
      const face = thing.ride != null && thing.ride <= 0 ? (x < W / 2 ? -1 : 1) : 1;
      ctx.strokeStyle = 'rgba(120, 200, 214, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y + 9, Math.max(6, 16 - leap), 3.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.translate(x, y - leap);
      ctx.scale(face, 1);
      ctx.fillStyle = '#6f8fa6';
      ctx.strokeStyle = '#3d566a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-15, 2);
      ctx.quadraticCurveTo(-4, -10, 13, -2);
      ctx.lineTo(18, -1);
      ctx.quadraticCurveTo(4, 6, -15, 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-7, -12); ctx.lineTo(3, -6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, 2); ctx.lineTo(-21, -3); ctx.lineTo(-18, 2); ctx.lineTo(-21, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#dbe8ee';
      ctx.beginPath(); ctx.ellipse(4, 1.6, 7, 1.5, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c2a33';
      ctx.beginPath(); ctx.arc(10.5, -2.6, 1, 0, Math.PI * 2); ctx.fill();
      if (thing.gift && !thing.met) {
        ctx.strokeStyle = 'rgba(255, 214, 102, 0.7)';
        ctx.beginPath(); ctx.ellipse(0, 0, 23, 13, 0, 0, Math.PI * 2); ctx.stroke();
      }
    },
    boonrose(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
      ctx.translate(x, y - 4);
      ctx.scale(1.1, 1.1);
      GIFT_ART.rose(ctx, run.t);
    },
    banerose(ctx, thing) {
      const { x, y } = thing;
      if (thing.wilted) {
        ctx.globalAlpha *= 0.7;
        ctx.translate(x, y + 12);
        ctx.rotate(0.55);
        ctx.translate(-x, -(y + 12));
      }
      ctx.strokeStyle = '#2f4a26';
      ctx.lineWidth = 2.2;
      [[-1, -6], [1, 6]].forEach(([side, lean]) => {
        ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.quadraticCurveTo(x + lean * 1.6, y + 6, x + side * 1.5, y - 2); ctx.stroke();
      });
      ctx.fillStyle = '#3f6a32';
      [[-6, 6, -0.7], [6, 4, 0.7]].forEach(([dx, dy, a]) => { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 4.5, 2, a, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#1f2a1a';
      [[-3, 9, -1], [3, 7, 1], [-2, 3, -1], [2.5, 1, 1]].forEach(([dx, dy, side]) => {
        ctx.beginPath(); ctx.moveTo(x + dx, y + dy - 1.5); ctx.lineTo(x + dx, y + dy + 1.5); ctx.lineTo(x + dx + side * 4, y + dy - 1); ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = thing.wilted ? '#8a7a84' : '#5b1a4a';
      [[0, -6, 7], [-4.5, -3.5, 5], [4.5, -3.5, 5], [0, -1, 5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = '#c9a8ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y - 5, 3.2, 0.3, 5.2); ctx.stroke();
    },
    donut(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
      const cy = y + (reduced?.matches ? 0 : Math.sin(run.t * 2.4 + thing.born) * 1.2);
      ctx.lineWidth = 6.5;
      ctx.strokeStyle = '#c98a4b';
      ctx.beginPath(); ctx.arc(x, cy, 7.5, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = '#e98fb0';
      ctx.beginPath(); ctx.arc(x, cy - 0.7, 7.3, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.1;
      ['#fff3b0', '#8fd3e8', '#ffffff', '#b3e29a', '#fff3b0', '#8fd3e8'].forEach((c, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        ctx.strokeStyle = c;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 6.2, cy - 0.7 + Math.sin(a) * 6.2); ctx.lineTo(x + Math.cos(a + 0.2) * 8.2, cy - 0.7 + Math.sin(a + 0.2) * 8.2); ctx.stroke();
      });
    },
    antgift(ctx, thing) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.4);
      const dir = Math.sign(thing.vx || 1);
      ctx.fillStyle = '#3a2a20';
      for (let i = 0; i < 6; i += 1) { ctx.beginPath(); ctx.arc(x - dir * i * 4.5, y + (i % 2) * 1.2, 1.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#e9d8b4';
      ctx.beginPath(); ctx.arc(x + dir * 4, y - 2, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbf6ea';
      ctx.strokeStyle = 'rgba(40, 40, 46, 0.5)';
      ctx.lineWidth = 0.6;
      ctx.fillRect(x - dir * 10 - 4, y - 6, 8, 5);
      ctx.strokeRect(x - dir * 10 - 4, y - 6, 8, 5);
    },
    arrow(ctx, thing) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, thing.wapT * 2);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(thing.angle);
      ctx.fillStyle = 'rgba(242, 193, 78, 0.85)';
      ctx.strokeStyle = 'rgba(120, 80, 20, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -11); ctx.lineTo(8, -1); ctx.lineTo(3, -1); ctx.lineTo(3, 8); ctx.lineTo(-3, 8); ctx.lineTo(-3, -1); ctx.lineTo(-8, -1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
    vane(ctx, thing, { run, colors }) {
      const { x, y } = thing;
      ctx.strokeStyle = mix(colors.ink, colors.paper, 0.25);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y - 14); ctx.stroke();
      ctx.save();
      ctx.translate(x, y - 16);
      ctx.rotate(thing.angle + (reduced?.matches ? 0 : Math.sin((run?.t || 0) * 2 + x) * 0.06));
      ctx.fillStyle = '#5d4a2c';
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, -2); ctx.lineTo(-5, -2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, 10); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-4, 4, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
    horn(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, thing.wapT * 2);
      ctx.strokeStyle = '#7a5a20';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x, y); ctx.stroke();
      const g = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
      g.addColorStop(0, '#f2c14e'); g.addColorStop(1, '#a8782a');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - 10, y - 4); ctx.lineTo(x + 6, y - 9); ctx.lineTo(x + 6, y + 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 8, y - 3, 3.5, 8, 0, 0, Math.PI * 2); ctx.fill();
      if (!reduced?.matches) {
        ctx.strokeStyle = 'rgba(242, 193, 78, 0.6)';
        ctx.lineWidth = 1;
        const r = 12 + ((run?.t || 0) * 18) % 10;
        ctx.beginPath(); ctx.arc(x + 9, y - 3, r, -0.6, 0.6); ctx.stroke();
      }
    },
    boneberry(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.7) * 3);
      [[-5, 3], [5, 3], [0, -4]].forEach(([dx, dy]) => {
        const g = ctx.createRadialGradient(x + dx - 2, y + dy - 2, 0.5, x + dx, y + dy, 6.5);
        g.addColorStop(0, '#fbf6ee');
        g.addColorStop(0.55, '#ead9cc');
        g.addColorStop(1, '#a8564a');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 5.5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(80, 40, 34, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 252, 0.78)';
        ctx.beginPath(); ctx.arc(x + dx - 1.6, y + dy - 2.1, 1.2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#5c493b';
      ctx.beginPath(); ctx.ellipse(x, y - 10, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(160, 150, 140, 0.55)';
      ctx.lineWidth = 1.1;
      const drift = reduced?.matches ? 0 : Math.sin((run?.t || 0) * 3 + x) * 1.5;
      ctx.beginPath(); ctx.moveTo(x + 1, y - 11); ctx.bezierCurveTo(x + 4 + drift, y - 15, x - 3 + drift, y - 18, x + 1, y - 22); ctx.stroke();
    },
    switch(ctx, thing) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.5);
      ctx.fillStyle = '#2b2b30';
      ctx.beginPath(); ctx.roundRect(x - 13, y - 6, 26, 18, 4); ctx.fill();
      ctx.strokeStyle = '#d6473e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + (thing.wapped ? -9 : 9), y - 14); ctx.stroke();
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(x + (thing.wapped ? -9 : 9), y - 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f3ead6';
      ctx.font = '700 6px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(thing.wapped ? 'OFF' : 'ON', x, y + 7);
    },
    post(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = '#4a3010';
      ctx.beginPath(); ctx.ellipse(x, y + 18, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4418';
      ctx.fillRect(x - 4, y + 5, 8, 13);
      ctx.fillStyle = '#b88636';
      ctx.fillRect(x - 5.5, y + 4, 11, 2.5);
      const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 13);
      g.addColorStop(0, '#f8dc94');
      g.addColorStop(0.55, '#d49a3a');
      g.addColorStop(1, '#7a4d16');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#52320c';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y - 1, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 244, 200, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y - 1, 13.5, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 220, 140, 0.28)';
      ctx.beginPath(); ctx.arc(x, y - 16, 7, 0, Math.PI * 2); ctx.fill();
    },
    sack(ctx, thing) {
      const { x, y } = thing;
      if (thing.floured) ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#e8dcc0';
      ctx.strokeStyle = '#a89870';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x - 22, y - 16, 44, 32, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(138, 122, 88, 0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2.5, 2]);
      ctx.beginPath(); ctx.roundRect(x - 19, y - 13, 38, 26, 6); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#a89870';
      [[-22, -16], [22, -16]].forEach(([ex, ey]) => {
        ctx.beginPath(); ctx.arc(x + ex * 0.88, y + ey * 0.92, 2.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = 'rgba(255, 252, 245, 0.82)';
      [[-11, -7], [13, 7], [-14, 6]].forEach(([fx, fy]) => {
        ctx.beginPath(); ctx.arc(x + fx, y + fy, 1.3, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#8a7a58';
      ctx.font = '600 8px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLOUR', x, y + 3);
    },
    puddle(ctx, thing, { run }) {
      const { x, y } = thing;
      const water = ctx.createLinearGradient(x, y - 9, x, y + 9);
      water.addColorStop(0, '#6fa3c0');
      water.addColorStop(1, '#2f6688');
      ctx.fillStyle = water;
      ctx.strokeStyle = '#1f4a66';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - 26, y);
      ctx.bezierCurveTo(x - 24, y - 10, x + 8, y - 11, x + 26, y - 2);
      ctx.bezierCurveTo(x + 24, y + 9, x - 10, y + 11, x - 26, y);
      ctx.fill();
      ctx.stroke();
      const ripple = reduced?.matches ? 0.5 : (run.t * 0.8 + thing.born) % 1;
      ctx.strokeStyle = `rgba(230, 244, 252, ${0.85 - ripple * 0.6})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(x - 4, y, 4 + ripple * 12, 1.5 + ripple * 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath(); ctx.ellipse(x + 10, y - 4, 5, 1.4, -0.2, 0, Math.PI * 2); ctx.fill();
    },
    snail(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = '#c9d6d2';
      ctx.beginPath(); ctx.ellipse(x - 2, y + 4, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9fb8b2';
      ctx.beginPath(); ctx.arc(x - 4, y - 1, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x - 4, y - 1, 3.5, 0, Math.PI * 1.5); ctx.stroke();
      ctx.fillStyle = 'rgba(150, 205, 210, 0.5)';
      ctx.strokeStyle = 'rgba(70, 120, 130, 0.95)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 6); ctx.lineTo(x + 6, y - 12); ctx.lineTo(x + 15, y - 9); ctx.lineTo(x + 11, y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath(); ctx.moveTo(x + 8, y - 1); ctx.lineTo(x + 6, y - 8); ctx.stroke();
    },
    spool(ctx, thing, { run, colors }) {
      const { x, y } = thing;
      const way = Math.sign(thing.vx || 1);
      ctx.strokeStyle = colors.berry;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - way * 14, y + 8, x - way * 24, y + 1);
      ctx.stroke();
      ctx.translate(x, y);
      ctx.rotate(run.t * (thing.vx > 0 ? 6 : -6));
      ctx.fillStyle = colors.berry;
      ctx.fillRect(-8, -5.5, 16, 11);
      ctx.strokeStyle = 'rgba(255, 220, 230, 0.45)';
      ctx.lineWidth = 0.8;
      for (let i = -5; i <= 5; i += 2.5) {
        ctx.beginPath(); ctx.moveTo(i, -5.5); ctx.lineTo(i, 5.5); ctx.stroke();
      }
      ctx.fillStyle = '#c8a46a';
      ctx.strokeStyle = '#6a4a24';
      ctx.lineWidth = 1;
      ctx.fillRect(-9.5, -8.5, 3.5, 17);
      ctx.strokeRect(-9.5, -8.5, 3.5, 17);
      ctx.fillRect(6, -8.5, 3.5, 17);
      ctx.strokeRect(6, -8.5, 3.5, 17);
    },
    pigeon(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = '#8f98a6';
      ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
      const flap = Math.sin(thing.flap) * 6;
      ctx.beginPath();
      ctx.moveTo(x - 2, y); ctx.lineTo(x - 13, y - flap); ctx.lineTo(x - 4, y + 2);
      ctx.moveTo(x + 2, y); ctx.lineTo(x + 13, y - flap); ctx.lineTo(x + 4, y + 2);
      ctx.fill();
      ctx.fillStyle = '#5c6570';
      ctx.beginPath(); ctx.moveTo(x + 8, y - 1); ctx.lineTo(x + 14, y + 1); ctx.lineTo(x + 8, y + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d08a3a';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x + 1, y - 1, 3.2, 0.15, Math.PI * 1.15); ctx.stroke();
      ctx.strokeStyle = '#6a5344';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 2, y + 5); ctx.lineTo(x - 4, y + 9); ctx.moveTo(x + 3, y + 5); ctx.lineTo(x + 5, y + 9); ctx.stroke();
    },
    clerk(ctx, thing, { colors }) {
      const { x, y } = thing;
      if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - Math.max(0, (thing.wapT - 0.25) * 1.4));
      ctx.fillStyle = colors.night;
      ctx.beginPath(); ctx.roundRect(x - 11, y - 10, 22, 24, 6); ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(x - 4, y - 10); ctx.lineTo(x, y - 5); ctx.lineTo(x + 4, y - 10); ctx.stroke();
      ctx.fillStyle = '#e8c4a0';
      ctx.beginPath(); ctx.arc(x, y - 13, 5.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1d1d22';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(x - 2, y - 13, 1.6, 0, Math.PI * 2); ctx.arc(x + 2, y - 13, 1.6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors.night;
      ctx.fillRect(x - 9, y - 21, 18, 4);
      ctx.beginPath(); ctx.ellipse(x, y - 17, 10, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x + 6, y - 18); ctx.lineTo(x + 12, y - 24); ctx.stroke();
      ctx.fillStyle = '#f7f1e2';
      ctx.fillRect(x - 7, y - 6, 14, 14);
      ctx.fillStyle = '#3a2a20';
      ctx.fillRect(x - 3, y - 7, 6, 2);
      ctx.strokeStyle = 'rgba(90, 70, 40, 0.45)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 2); ctx.lineTo(x + 5, y - 2);
      ctx.moveTo(x - 5, y + 2); ctx.lineTo(x + 5, y + 2);
      ctx.stroke();
      ctx.fillStyle = thing.shared ? '#2e6f5e' : colors.hearth;
      ctx.font = '700 4.5px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(thing.shared ? 'SETTLED' : 'DAMAGE', x, y - 3);
      ctx.strokeStyle = '#e8c4a0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 10, y - 2); ctx.lineTo(x + 17, y + 4); ctx.stroke();
      ctx.fillStyle = thing.shared ? '#2e6f5e' : '#c0392b';
      ctx.fillRect(x + 15, y + 3, 5, 4);
    },
    wasps(ctx, thing, { run }) {
      const { x, y } = thing;
      ctx.fillStyle = '#b8b2a0';
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 8); ctx.lineTo(x - 12, y - 4); ctx.lineTo(x - 6, y - 10); ctx.lineTo(x, y - 4);
      ctx.lineTo(x + 6, y - 10); ctx.lineTo(x + 12, y - 4); ctx.lineTo(x + 12, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(90, 70, 30, 0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let i = 0; i < 3; i += 1) {
        const wx = x - 10 + i * 10 + (reduced?.matches ? 0 : Math.sin(run.t * 9 + i) * 3);
        const wy = y - 16 + (reduced?.matches ? 0 : Math.cos(run.t * 7 + i) * 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(wx - 3.2, wy, 3.4, 1.3, -0.5, 0, Math.PI * 2);
        ctx.ellipse(wx + 3.2, wy, 3.4, 1.3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i === 1 ? '#2a261c' : '#e6d36a';
        ctx.beginPath(); ctx.ellipse(wx, wy, 1.5, 3.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a261c';
        ctx.fillRect(wx - 1.15, wy - 1.3, 2.3, 1);
        ctx.fillRect(wx - 1.15, wy + 1.1, 2.3, 1);
      }
    },
    clown(ctx, thing, { run }) {
      const { x, y } = thing;
      if (thing.wapped) {
        ctx.translate(x, y);
        if (!reduced?.matches) ctx.rotate(thing.spin * thing.wapT * 5);
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, thing.wapT - 0.6) * 2);
        drawClown(0, 0, true, 0, thing.missing);
      } else {
        const lift = cadenceLift('clown', run.t + thing.honk);
        drawClown(x, y - lift * 3, Boolean(thing.pied), lift ? lift * 2 - 1 : Math.sin((run.t + thing.honk) * 6), thing.missing);
        const want = thing.want || 1;
        for (let i = 0; i < want; i += 1) {
          const px = x - (want - 1) * 6 + i * 12;
          const py = y - 30;
          const fill = clamp((thing.fed || 0) - i, 0, 1);
          ctx.fillStyle = 'rgba(255, 252, 240, 0.95)';
          ctx.strokeStyle = '#b8860b';
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (fill > 0) {
            ctx.fillStyle = '#e0a95a';
            ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fill); ctx.closePath(); ctx.fill();
          }
        }
      }
    },
    chair(ctx, thing) {
      const { x, y } = thing;
      ctx.fillStyle = '#7a4c2a';
      ctx.fillRect(x - 11, y - 17, 3, 16);
      ctx.fillRect(x + 8, y - 17, 3, 16);
      ctx.beginPath(); ctx.arc(x - 9.5, y - 18, 2.2, 0, Math.PI * 2); ctx.arc(x + 9.5, y - 18, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#96623a';
      ctx.fillRect(x - 8, y - 13, 16, 2.4);
      ctx.fillRect(x - 8, y - 7.5, 16, 2.4);
      ctx.fillStyle = '#a8564a';
      ctx.beginPath(); ctx.roundRect(x - 12, y - 3, 24, 4.5, 2); ctx.fill();
      ctx.fillStyle = '#6a4024';
      ctx.fillRect(x - 12, y + 1, 24, 3);
      ctx.strokeStyle = '#5a341c';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(x - 10, y + 3); ctx.lineTo(x - 13, y + 14);
      ctx.moveTo(x + 10, y + 3); ctx.lineTo(x + 13, y + 14);
      ctx.moveTo(x - 4, y + 3); ctx.lineTo(x - 2, y + 14);
      ctx.moveTo(x + 4, y + 3); ctx.lineTo(x + 2, y + 14);
      ctx.stroke();
    },
    dividers(ctx, thing, { colors }) {
      const { y } = thing;
      const [a, b] = thing.lanes.map(laneX);
      const midX = (a + b) / 2;
      ctx.strokeStyle = 'rgba(196, 154, 58, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.arc(midX, y - 14, Math.abs(b - a) * 0.28, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#c49a3a';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(a + 8, y + 2); ctx.lineTo(midX, y - 14); ctx.lineTo(b - 8, y + 2); ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      ctx.strokeStyle = '#6a4e14';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(midX, y - 14, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      [a, b].forEach((cx) => {
        ctx.fillStyle = '#243044';
        ctx.beginPath(); ctx.roundRect(cx - 6, y - 2, 12, 12, 3); ctx.fill();
        ctx.fillStyle = '#f2d2b0';
        ctx.beginPath(); ctx.arc(cx, y - 8, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colors.berry;
        ctx.fillRect(cx - 5, y + 1, 10, 2);
      });
    },
    banner(ctx, thing, helpers) { drawWideSurface(ctx, thing, helpers); },
    table(ctx, thing, helpers) { drawWideSurface(ctx, thing, helpers); }
  };

  function drawWideSurface(ctx, thing, { colors }) {
    const { y } = thing;
    const top = y - thing.h / 2;
    for (let lane = 0; lane < LANES; lane += 1) {
      if (lane === thing.gap) continue;
      const lx = lane * LANE_W;
      if (thing.kind === 'banner') {
        ctx.fillStyle = [colors.berry, colors.gold, colors.accent, colors.hearth][lane % 4];
        ctx.fillRect(lx, top, LANE_W, thing.h);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(lx, top + thing.h - 4, LANE_W, 4);
        ctx.strokeStyle = '#f2c14e';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(lx, top + 1.5); ctx.lineTo(lx + LANE_W, top + 1.5); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 250, 232, 0.65)';
        ctx.beginPath(); ctx.arc(lx + LANE_W / 2, top + thing.h / 2, 2.6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#6a4022';
        ctx.fillRect(lx, top, LANE_W, thing.h);
        ctx.fillStyle = '#f6efe2';
        ctx.fillRect(lx + 2, top + 2, LANE_W - 4, thing.h - 9);
        ctx.strokeStyle = 'rgba(184, 134, 11, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx + 4, top + 4, LANE_W - 8, thing.h - 13);
        ctx.fillStyle = colors.gold;
        ctx.beginPath(); ctx.arc(lx + LANE_W / 2, top + 12, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fffaf0';
        ctx.beginPath(); ctx.arc(lx + LANE_W / 2, top + 12, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (thing.kind === 'table') {
      const gx = laneX(thing.gap);
      ctx.strokeStyle = colors.gold;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(gx - LANE_W / 2 + 4, top + 2, LANE_W - 8, thing.h - 4);
      ctx.setLineDash([]);
    }
  }

  const drawThing = (thing) => {
    const ctx = getCtx();
    const run = getRun();
    const state = getState();
    const colors = getColors();
    const { x, y } = thing;
    const { contrast } = thingLook();
    const life = lifeOf(thing);
    ctx.save();
    if (!WIDE.has(thing.kind) && !['puddle', 'frost', 'furrow', 'hole'].includes(thing.kind) && !thing.wapped) {
      const lift = life?.lift || 0;
      const rx = thing.w * 0.58 * (1 - lift * 0.03);
      const ry = 4 + Math.min(3, thing.h * 0.05);
      const a = 0.26 * (1 - lift * 0.05);
      ctx.save();
      ctx.translate(x, y + thing.h * 0.55);
      ctx.scale(1, ry / rx);
      const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      shade.addColorStop(0, `rgba(20, 16, 10, ${a})`);
      shade.addColorStop(0.6, `rgba(20, 16, 10, ${a * 0.5})`);
      shade.addColorStop(1, 'rgba(20, 16, 10, 0)');
      ctx.fillStyle = shade;
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (!thing.wapped && !thing.knocked && !thing.cleared && (thing.fatal || SLIPS.has(thing.kind))) {
      const hurt = thing.fatal;
      const coming = run && state === 'running' && thing.y < run.y && run.y - thing.y < (run.mini?.id === 'long_view' ? 440 : 260)
        && (WIDE.has(thing.kind) ? thing.gap !== run.lane : Math.abs(thing.x - run.x) < (thing.w + 20) / 2);
      const pulse = coming && !reduced?.matches ? 0.5 + Math.sin(run.t * 12) * 0.5 : coming ? 1 : 0;
      const rgb = hurt ? '200, 56, 40' : '40, 110, 170';
      ctx.fillStyle = `rgba(${rgb}, ${((hurt ? 0.2 : 0.16) + pulse * 0.14) * contrast})`;
      ctx.strokeStyle = `rgba(${rgb}, ${Math.min(1, (0.75 + pulse * 0.25) * (0.6 + 0.4 * contrast))})`;
      ctx.lineWidth = ((hurt ? 2.2 : 1.8) + pulse * 1.2) * contrast;
      if (!hurt) ctx.setLineDash([4, 3]);
      if (WIDE.has(thing.kind)) {
        const top = y - thing.h / 2 - 3;
        for (let lane = 0; lane < LANES; lane += 1) {
          if (lane === thing.gap) continue;
          ctx.fillRect(lane * LANE_W + 2, top, LANE_W - 4, thing.h + 6);
          ctx.beginPath(); ctx.moveTo(lane * LANE_W + 4, top + thing.h + 8); ctx.lineTo((lane + 1) * LANE_W - 4, top + thing.h + 8); ctx.stroke();
        }
      } else {
        const rx = thing.w * 0.62 + 3;
        const footY = SLIPS.has(thing.kind) && thing.kind !== 'sack' ? y : y + thing.h * 0.5;
        ctx.beginPath();
        ctx.ellipse(x, footY, rx, thing.kind === 'puddle' || thing.kind === 'frost' ? 12 : 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const mark = record.view.heightsCfg?.marks === false ? '' : heightMark(thing);
        if (mark) {
          ctx.setLineDash([]);
          const lit = mark === '⤒⤒' ? run?.highHop : mark === '⤒';
          ctx.font = '800 9px "JetBrainsMono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(255, 252, 244, 0.85)';
          ctx.strokeText(mark, x + rx - 2, footY + 3);
          ctx.fillStyle = lit ? '#2c8b86' : 'rgba(40, 32, 28, 0.7)';
          ctx.fillText(mark, x + rx - 2, footY + 3);
        }
      }
      ctx.setLineDash([]);
    }
    if (thing.knocked || thing.cleared) ctx.globalAlpha = 0.4;
    if (contrast > 1.02 && thing.fatal && !WIDE.has(thing.kind) && !thing.knocked && !thing.cleared && !thing.wapped) {
      ctx.fillStyle = `rgba(255, 252, 244, ${Math.min(0.5, (contrast - 1) * 0.9)})`;
      ctx.beginPath(); ctx.ellipse(x, y, thing.w * 0.62 * HAZARD_SCALE + 3, thing.h * 0.58 * HAZARD_SCALE + 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (thing.fatal && !WIDE.has(thing.kind)) {
      ctx.translate(x, y);
      ctx.scale(HAZARD_SCALE, HAZARD_SCALE);
      ctx.translate(-x, -y);
    }
    if (life) {
      const foot = y + thing.h * 0.5;
      ctx.translate(x, foot - life.lift);
      if (life.rot) ctx.rotate(life.rot);
      ctx.scale(life.sx, life.sy);
      ctx.translate(-x, -foot);
    }
    if (thing.rival && !thing.wapped) {
      ctx.save();
      ctx.strokeStyle = 'rgba(126, 87, 194, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.ellipse(x, y, thing.w * 0.72, thing.h * 0.75 + 6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if ((['clown', 'switch', 'berry', 'boneberry', 'wonder', 'egg', 'beaver', 'donut', 'boonrose'].includes(thing.kind) || (thing.kind === 'dolphin' && !thing.met) || (thing.kind === 'baneberry' && thing.sweetened)) && !thing.wapped) {
      const halo = ctx.createRadialGradient(x, y - 4, 4, x, y - 4, 30);
      halo.addColorStop(0, `rgba(255, 214, 102, ${0.45 * Math.max(0.7, contrast)})`);
      halo.addColorStop(1, 'rgba(255, 214, 102, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y - 4, 30, 0, Math.PI * 2); ctx.fill();
    }
    const render = CUSTOM_THING_RENDERERS.get(thing.kind) || BUILTIN_THING_RENDERERS[thing.kind];
    if (render) render(ctx, thing, { run, colors, state, reduced, mix, clamp, laneX, W, LANES, LANE_W });
    ctx.restore();
    if (thing.isNew && !thing.wapped && !thing.knocked && !thing.cleared && run && thing.y < run.y - 20) {
      const tx = WIDE.has(thing.kind) ? W / 2 : thing.x;
      const ty = thing.y - thing.h / 2 - (WIDE.has(thing.kind) ? 18 : 14);
      ctx.save();
      ctx.font = '800 8px "JetBrainsMono", ui-monospace, monospace';
      const tw = ctx.measureText('NEW').width + 8;
      ctx.fillStyle = colors.gold;
      ctx.beginPath(); ctx.roundRect(tx - tw / 2, ty - 7, tw, 12, 6); ctx.fill();
      ctx.fillStyle = colors.paper;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NEW', tx, ty - 0.5);
      ctx.restore();
    }
  };

  return {
    drawThing,
    drawMime,
    drawClown,
    drawWedge,
    lifeOf,
    sealImage,
    setLikenessMod,
    listThingRenderers: () => [...new Set([...Object.keys(BUILTIN_THING_RENDERERS), ...CUSTOM_THING_RENDERERS.keys()])]
  };
}
