/**
 * pie/render/cast.mjs — carrier rig, pie, hat, spill, Boof, Mr. BoonWAP, Mr. BaneWAP,
 * escorts, flight projectiles, and comic WAP! bursts for Exactly One Pie.
 *
 * Uses `vector-parts.mjs` (`computeCarrierPose`, `drawVectorPart`, `VECTOR_PARTS`)
 * for beat-coupled articulated 2D secondary motion while strictly preserving
 * canon for the Figure in plain lines ("one circle, one rectangle, four lines,
 * two dots. Always ink.").
 */

import { computeCarrierPose, drawVectorPart } from './vector-parts.mjs';
import { recipeVisualFor } from '../sim/recipes.mjs';

const CUSTOM_CARRIER_RENDERERS = new Map();

/**
 * Register a custom costumed carrier renderer for `drawBody`.
 * Receives `(ctx, { x, y, stride, pose, run, colors, legs, head })`.
 * @param {string} id
 * @param {(ctx: CanvasRenderingContext2D, args: any) => void} drawFn
 */
export function registerCarrierRenderer(id, drawFn) {
  if (!id || id === 'figure' || typeof drawFn !== 'function') {
    throw new Error('registerCarrierRenderer(id, fn) requires a non-figure id and function');
  }
  CUSTOM_CARRIER_RENDERERS.set(String(id), drawFn);
}

/** @param {string} id */
export function unregisterCarrierRenderer(id) {
  CUSTOM_CARRIER_RENDERERS.delete(String(id));
}

/**
 * Initialize carrier, presence, escort, and flight renderers.
 * @param {object} deps
 */
export function initCastRenderer({
  getCtx, getRun, getState, getColors, reduced,
  W, LANES, LANE_W, PLAYER_Y, PRESENCE_Y, SLICE_COST,
  laneX, clamp, mix,
  jumpLift, hopPhase, hopCurve,
  getCreatorStyle, domainTune,
  drawFace, moodOf, drawWedge,
  poised, richness, recipeIdNow, throwFrom,
  getBeatPulse, isShortArm
}) {
  function drawBody(who, x, y, stride, pose) {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    ctx.save();
    ctx.translate(x, y + (pose?.bobY || 0));
    if (pose?.torsoLean) ctx.rotate(pose.torsoLean);
    ctx.translate(-x, -y);
    const legs = (color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 5 - (pose?.strideLeft ?? stride), y + 16);
      ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 5 + (pose?.strideRight ?? stride), y + 16);
      ctx.stroke();
    };
    const head = (skin) => {
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(x, y - 44, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath(); ctx.arc(x - 3, y - 45, 1.2, 0, Math.PI * 2); ctx.arc(x + 3, y - 45, 1.2, 0, Math.PI * 2); ctx.fill();
    };

    const custom = CUSTOM_CARRIER_RENDERERS.get(who);
    if (custom) {
      custom(ctx, { x, y, stride, pose, run, colors, legs, head });
    } else if (who === 'porter') {
      legs('#4a3426');
      ctx.fillStyle = '#5d6a73';
      ctx.beginPath(); ctx.roundRect(x - 13, y - 35, 26, 30, 7); ctx.fill();
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = '#b9773a';
      ctx.lineWidth = 2.6;
      drawVectorPart(ctx, 'porterStrap', {
        stroke: true,
        fallback: (c) => { c.beginPath(); c.moveTo(-11, -33); c.lineTo(10, -8); c.stroke(); }
      });
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(-2, -22, 4, 4);
      ctx.restore();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      [[-6, -28], [5, -22], [-2, -14], [7, -31]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2); ctx.fill(); });
      head('#d9a679');
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#22262a';
      drawVectorPart(ctx, 'porterVisor', {
        fill: true,
        fallback: (c) => { c.fillRect(-9, -52, 18, 2.5); }
      });
      ctx.restore();
    } else if (who === 'clerk') {
      legs('#1d2a3a');
      ctx.fillStyle = colors.night;
      ctx.beginPath(); ctx.roundRect(x - 8, y - 34, 16, 28, 5); ctx.fill();
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.1;
      drawVectorPart(ctx, 'clerkCollar', {
        stroke: true,
        fallback: (c) => { c.beginPath(); c.moveTo(-4, -34); c.lineTo(0, -27); c.lineTo(4, -34); c.stroke(); }
      });
      ctx.restore();
      ctx.fillStyle = '#f7f1e2';
      ctx.fillRect(x + 2, y - 30, 5.5, 8.5);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x + 2, y - 30, 5.5, 2);
      head('#e8c4a0');
      ctx.strokeStyle = '#22262a';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(x - 3, y - 45, 2.2, 0, Math.PI * 2); ctx.arc(x + 3, y - 45, 2.2, 0, Math.PI * 2); ctx.stroke();
    } else if (who === 'genie') {
      const drag = pose?.hemSwing ?? Math.sin((run?.t || 0) * 3) * 4;
      ctx.fillStyle = '#7fb4c0';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 34);
      ctx.lineTo(x + 10, y - 34);
      ctx.quadraticCurveTo(x + 9, y, x + 2 + drag, y + 14);
      ctx.quadraticCurveTo(x - 6, y, x - 10, y - 34);
      ctx.fill();
      ctx.fillStyle = '#2b5aa6';
      ctx.beginPath(); ctx.roundRect(x - 10, y - 34, 20, 14, 4); ctx.fill();
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#ffffff';
      drawVectorPart(ctx, 'genieCollar', {
        fill: true,
        fallback: (c) => { c.beginPath(); c.moveTo(-5, -34); c.lineTo(5, -34); c.lineTo(0, -27); c.fill(); }
      });
      ctx.restore();
      ctx.fillStyle = '#c4922e';
      ctx.beginPath(); ctx.arc(x + 9, y - 22, 2.2, 0, Math.PI * 2); ctx.fill();
      head('#b9d4e8');
    } else if (who === 'clown') {
      legs('#3a6ab0');
      const sl = pose?.strideLeft ?? stride;
      const sr = pose?.strideRight ?? stride;
      ctx.fillStyle = '#2a2026';
      ctx.beginPath(); ctx.ellipse(x - 6 - sl, y + 16, 4.5, 2, 0, 0, Math.PI * 2); ctx.ellipse(x + 6 + sr, y + 16, 4.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8c34a';
      ctx.beginPath(); ctx.roundRect(x - 11, y - 34, 22, 28, 8); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.arc(x + i * 3.8, y - 34, 2.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#d6473e';
      [[-5, -26], [5, -20], [0, -13]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#e0582e';
      ctx.beginPath(); ctx.arc(x - 9, y - 47, 5, 0, Math.PI * 2); ctx.arc(x + 9, y - 47, 5, 0, Math.PI * 2); ctx.fill();
      head('#fbf6ee');
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(x, y - 43, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  const drawPie = (x, y, tilt, alpha = 1) => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const strength = run ? Math.min(run.aura, run.filling) : 0;
    if (run && !run.spill && alpha === 1 && strength > 0.02) {
      ctx.save();
      const glow = ctx.createRadialGradient(x, y, 6, x, y, 34);
      glow.addColorStop(0, `rgba(255, 214, 120, ${0.15 + strength * 0.45})`);
      glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
      if (poised()) {
        ctx.strokeStyle = 'rgba(226, 178, 74, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 8, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const rec = recipeIdNow();
    const vis = recipeVisualFor(rec);
    const swell = run && !run.spill ? 0.85 + richness() * 0.4 : 1;
    ctx.scale(swell, swell);
    ctx.fillStyle = 'rgba(39, 23, 31, 0.46)';
    ctx.beginPath(); ctx.ellipse(0, 5, 21, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = vis.plateFill;
    ctx.beginPath(); ctx.ellipse(0, 3, 21, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (vis.plateRim) {
      ctx.strokeStyle = vis.plateRim;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    const side = ctx.createLinearGradient(0, -1, 0, 6);
    side.addColorStop(0, vis.crustTop);
    side.addColorStop(1, vis.crustBottom);
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(-vis.rx, -1);
    ctx.bezierCurveTo(-vis.rx + 2, 8, vis.rx - 2, 8, vis.rx, -1);
    ctx.closePath();
    ctx.fill();
    const crust = ctx.createLinearGradient(0, -8, 0, 4);
    crust.addColorStop(0, vis.crustTop);
    crust.addColorStop(1, vis.crustBottom);
    ctx.fillStyle = crust;
    ctx.beginPath(); ctx.ellipse(0, -1, vis.rx, vis.ry, 0, 0, Math.PI * 2); ctx.fill();
    if (!run || run.aura >= SLICE_COST) {
      ctx.fillStyle = vis.fluteFill;
      const count = vis.fluteCount;
      for (let i = -count; i <= count; i += 1) {
        const a = (i / count) * Math.PI * 0.85;
        ctx.beginPath();
        ctx.arc(Math.sin(a) * 15.5, -1 + Math.cos(a) * 4.5, vis.fluteRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (vis.ventStyle === 'lattice') {
      ctx.strokeStyle = '#6c1f4a';
      ctx.lineWidth = 1.1;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 4.5 - 3, -5); ctx.lineTo(i * 4.5 + 3, 2);
        ctx.moveTo(i * 4.5 + 3, -5); ctx.lineTo(i * 4.5 - 3, 2);
        ctx.stroke();
      }
      if (vis.latticeDot) {
        ctx.fillStyle = vis.latticeDot;
        [[-6, -2], [0, -3], [6, -1]].forEach(([fx, fy]) => {
          ctx.beginPath(); ctx.arc(fx, fy, 1.15, 0, Math.PI * 2); ctx.fill();
        });
      }
    } else {
      ctx.strokeStyle = run && run.filling >= SLICE_COST ? colors.berry : 'rgba(90, 40, 10, 0.5)';
      ctx.lineWidth = 0.95;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 5 - 2, -5); ctx.lineTo(i * 5 + 2, 2);
        ctx.stroke();
      }
    }
    if (vis.sheen) {
      ctx.strokeStyle = 'rgba(255, 250, 236, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(-2, -3.2, 10.5, 2.2, -0.1, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();
    }
    if (vis.blisters) {
      ctx.fillStyle = 'rgba(84, 28, 12, 0.65)';
      [[-7, -2], [3, -4], [8, 0], [-2, 1]].forEach(([bx, by]) => {
        ctx.beginPath(); ctx.arc(bx, by, 1.4, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (vis.herbs) {
      ctx.fillStyle = '#4e6f40';
      [[-5, -2.5], [1, -3.5], [5, -1.5]].forEach(([hx, hy]) => {
        ctx.beginPath(); ctx.ellipse(hx, hy, 1.6, 0.9, 0.4, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (!reduced?.matches && run && !run.spill && (richness() >= 0.72 || run.warm > 0)) {
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.55)';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i += 2) {
        const wisp = Math.sin(run.t * 3.2 + i) * 2.5;
        ctx.beginPath();
        ctx.moveTo(i * 5, -7);
        ctx.quadraticCurveTo(i * 5 + wisp, -13, i * 5 - wisp * 0.5, -18);
        ctx.stroke();
      }
    }
    if (run && Math.abs(run.tiltDir) > 0.25 && run.wobble > 0.2 && !run.spill) {
      ctx.fillStyle = run.wobble > 0.65 ? colors.berry : '#e2b24a';
      ctx.beginPath(); ctx.ellipse(Math.sign(run.tiltDir) * 16, 1, 2.8, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (run && run.wobble > 0.7 && !run.spill) {
      ctx.fillStyle = colors.berry;
      ctx.beginPath(); ctx.ellipse(Math.sign(tilt || 1) * 16, 1, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const drawHat = (hatFloatY = 0) => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const hat = run ? run.hat : { x: laneX(2), y: PLAYER_Y - 64 };
    ctx.save();
    ctx.translate(hat.x, hat.y + hatFloatY);
    ctx.fillStyle = colors.ink;
    drawVectorPart(ctx, 'hatBrim', {
      fill: true,
      fallback: (c) => { c.beginPath(); c.ellipse(0, 6, 13, 3, 0, 0, Math.PI * 2); c.fill(); }
    });
    drawVectorPart(ctx, 'hatCrown', {
      fill: true,
      fallback: (c) => { c.beginPath(); c.ellipse(0, 0, 8, 7, 0, Math.PI, 0); c.rect(-8, 0, 16, 6); c.fill(); }
    });
    ctx.restore();
  };

  const drawFigure = () => {
    const ctx = getCtx();
    const run = getRun();
    const state = getState();
    const colors = getColors();
    const x = run ? run.x : laneX(2);
    const lift = run ? jumpLift() : 0;
    const y = (run ? run.y : PLAYER_Y) - lift;
    if (lift > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(20, 16, 10, 0.2)';
      ctx.beginPath(); ctx.ellipse(x, y + lift + 16, 14 - lift * 0.2, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (run?.apexGlow > 0 && !reduced?.matches) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.apexGlow / 0.22) * 0.9;
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y - 8, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    const ink = colors.ink;
    const who = run?.carrier?.id || 'figure';
    const pose = computeCarrierPose({
      t: run?.t || 0,
      running: state === 'running',
      reduced: Boolean(reduced?.matches),
      carrierId: who,
      wobble: run?.wobble || 0,
      tiltDir: run?.tiltDir || 0,
      lift,
      beatPulse: getBeatPulse ? getBeatPulse() : 0,
      moveProgress: run?.moveT ?? 1,
      moveDir: run ? Math.sign(x - run.from) : 0
    });
    const stride = pose.strideLeft;
    let sx = 1;
    let sy = 1;
    if (run && !reduced?.matches) {
      if (run.jumpT > 0) {
        const p = hopPhase();
        sy = p < 0.12 ? 0.88 : 1 + hopCurve(p) * 0.09 * (run.hopPower || 1);
        sx = 2 - sy;
      } else if (run.landT > 0) {
        const k = run.landT / 0.2;
        sy = 1 - 0.2 * k;
        sx = 1 + 0.18 * k;
      }
    }
    ctx.save();
    if (sx !== 1 || sy !== 1) {
      ctx.translate(x, y + 16);
      ctx.scale(sx, sy);
      ctx.translate(-x, -(y + 16));
    }
    const activeStyle = run?.style || getCreatorStyle();
    const styleInk = activeStyle?.id && activeStyle.id !== 'house' && activeStyle.accent
      ? mix(colors.ink, activeStyle.accent, 0.35)
      : colors.ink;
    const strokeMul = Number(domainTune('characters').stroke_weight) || 1;
    ctx.strokeStyle = styleInk;
    ctx.fillStyle = styleInk;
    ctx.lineWidth = (activeStyle?.stroke === 'woodcut' ? 2.75 : activeStyle?.stroke === 'chalk' ? 2.45 : activeStyle?.stroke === 'hand' ? 2.25 : 1.9) * strokeMul;
    ctx.lineCap = 'round';
    if (activeStyle?.accent && activeStyle.id !== 'house' && !reduced?.matches) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = activeStyle.accent;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(x, y - 16, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (run && run.moveT < 1) {
      ctx.globalAlpha = 0.35 * (1 - run.moveT);
      const s = Math.sign(x - run.from) || 1;
      ctx.beginPath();
      ctx.moveTo(run.from, y + 6); ctx.lineTo(run.from, y + 10); ctx.lineTo(x, y + 10);
      ctx.moveTo(run.from + s * 4, y + 6); ctx.lineTo(run.from + s * 4, y + 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (run && run.moveYT < 1) {
      ctx.globalAlpha = 0.35 * (1 - run.moveYT);
      ctx.beginPath();
      ctx.moveTo(x - 10, run.fromY + 10); ctx.lineTo(x - 14, run.fromY + 10); ctx.lineTo(x - 14, y + 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (run && (run.warm > 0 || run.shield)) {
      const g = ctx.createRadialGradient(x, y - 22, 6, x, y - 22, 46);
      g.addColorStop(0, `rgba(255, 186, 96, ${run.warm > 0 ? 0.32 : 0.16})`);
      g.addColorStop(1, 'rgba(255, 186, 96, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y - 22, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ink;
    }
    if (run?.unkept > 0) ctx.globalAlpha = 0.45 + Math.sin(run.t * 14) * 0.1;
    else if (run?.hurtT > 0) ctx.globalAlpha = Math.sin(run.t * 30) > 0 ? 1 : 0.35;
    // Canon: the figure in plain lines is always one circle, one rectangle, four lines, two dots.
    const plainLines = (alpha) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.beginPath(); ctx.arc(x, y - 44, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(x - 8, y - 33, 16, 26);
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 6 - stride, y + 16);
      ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 6 + stride, y + 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - 3, y - 45, 1.3, 0, Math.PI * 2);
      ctx.arc(x + 3, y - 45, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const bodyOf = (id, alpha) => {
      if (id === 'figure') plainLines(alpha);
      else {
        ctx.save();
        ctx.globalAlpha *= alpha;
        drawBody(id, x, y, stride, pose);
        ctx.restore();
      }
    };
    const swapping = run?.prevCarrier && run.swapT < 1;
    if (swapping) bodyOf(run.prevCarrier.id, 1 - run.swapT);
    bodyOf(who, swapping ? run.swapT : 1);
    drawFace(x, y + pose.bobY, moodOf(), who, swapping ? run.swapT : 1);
    if (who !== 'figure') {
      ctx.strokeStyle = who === 'clown' ? '#d6473e' : '#3a2a20';
      ctx.fillStyle = ctx.strokeStyle;
    }
    const spilled = run?.spill;
    const tilt = run && !spilled ? Math.sin(run.phase) * run.wobble * 0.38 + (run.dir || 0) * run.wobble * 0.12 : 0;
    const px = x + pose.plateCounter;
    const py = y - 18 + pose.bobY;
    const isShort = isShortArm(who);
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 30 + pose.bobY); ctx.lineTo(px - 18, py + 2);
    ctx.moveTo(x + 8, y - 30 + pose.bobY); ctx.lineTo(isShort ? px + 15 : px + 18, isShort ? py - 1 : py + 2);
    ctx.stroke();
    if (isShort && !spilled) {
      ctx.save();
      ctx.fillStyle = '#f2a950';
      ctx.beginPath(); ctx.arc(px + 15, py - 1, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    if (!spilled) drawPie(px, py, tilt);
    if (run?.floured > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, run.floured * 0.4);
      ctx.fillStyle = '#fbf8f0';
      ctx.beginPath(); ctx.ellipse(x, y - 24, 16, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawHat(pose.hatFloatY);
  };

  const drawSpill = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const s = run?.spill;
    if (!s) return;
    const t = Math.min(1, s.t / 0.9);
    if (s.selfWap) {
      const k = Math.min(1, t * 2.4);
      drawPie(s.x, s.y - 26 * k, 0, 1 - Math.max(0, t - 0.5) * 2);
      return;
    }
    const x = s.x + s.dir * t * 38;
    const y = s.y + t * t * 60;
    drawPie(x, y, s.dir * t * 2.6, 1 - Math.max(0, t - 0.85) * 4);
    if (t > 0.7) {
      ctx.fillStyle = colors.berry;
      ctx.globalAlpha = Math.min(1, (t - 0.7) * 4);
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 16, y + 12 + Math.sin(a) * 5, 5, 2.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  const drawBoof = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const b = run?.boof;
    if (!b) return;
    const facing = b.vx > 0 ? 1 : -1;
    const trot = reduced?.matches ? 0 : Math.sin(run.t * 12) * 2;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(facing, 1);
    ctx.fillStyle = '#c98a4a';
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(16, -8, 8, 7, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a5e2c';
    ctx.beginPath(); ctx.ellipse(14, -14, 3, 6, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9b48a';
    ctx.beginPath(); ctx.ellipse(21, -7, 4.5, 3.2, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c86d2c';
    ctx.lineWidth = 2.4;
    drawVectorPart(ctx, 'boofCollar', {
      stroke: true,
      fallback: (c) => { c.beginPath(); c.moveTo(9, -12); c.quadraticCurveTo(11, -3, 8, 3); c.stroke(); }
    });
    ctx.fillStyle = '#9a5e2c';
    ctx.fillRect(-14, 6, 3.5, 8 + trot);
    ctx.fillRect(-8, 6, 3.5, 8 - trot * 0.7);
    ctx.fillRect(6, 6, 3.5, 8 + trot * 0.7);
    ctx.fillRect(11, 6, 3.5, 8 - trot);
    ctx.beginPath();
    ctx.moveTo(-17, -3);
    ctx.quadraticCurveTo(-28, -14 + trot, -24, -18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c98a4a';
    ctx.stroke();
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.arc(24, -8, 1.8, 0, Math.PI * 2);
    ctx.arc(17, -10, 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (!reduced?.matches) {
      ctx.strokeStyle = 'rgba(42, 26, 16, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(27, -9); ctx.quadraticCurveTo(30, -12, 33, -9); ctx.stroke();
    }
    ctx.restore();
    if (b.touched && run.steadied > 0) {
      ctx.fillStyle = colors.ink;
      ctx.globalAlpha = Math.min(1, run.steadied);
      ctx.font = 'italic 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('steadied', run.x, run.y - 100);
      ctx.globalAlpha = 1;
    }
  };

  const drawBoonWAP = () => {
    const ctx = getCtx();
    const run = getRun();
    const b = run?.boon;
    if (!b) return;
    const enter = Math.min(1, b.t / 0.5, (b.dur - b.t) / 0.5);
    const x = W / 2;
    const y = PRESENCE_Y + (reduced?.matches ? 0 : Math.sin(run.t * 2) * 3) - (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = Math.max(0, enter);
    const halo = ctx.createRadialGradient(x, y, 10, x, y, 64);
    halo.addColorStop(0, 'rgba(255, 210, 120, 0.55)');
    halo.addColorStop(1, 'rgba(255, 210, 120, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, 64, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9e2d4';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
    const crust = ctx.createLinearGradient(0, y - 22, 0, y + 14);
    crust.addColorStop(0, '#f1bd6a');
    crust.addColorStop(1, '#b06a2a');
    ctx.fillStyle = crust;
    ctx.beginPath(); ctx.ellipse(x, y, 34, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ecc074';
    for (let i = -5; i <= 5; i += 1) {
      ctx.beginPath(); ctx.arc(x + i * 6, y - 13 + Math.abs(i) * 0.7, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#4d9f97';
    ctx.lineWidth = 2.4;
    drawVectorPart(ctx, 'boonRibbon', {
      stroke: true,
      fallback: (c) => { c.beginPath(); c.moveTo(-28, 6); c.quadraticCurveTo(0, 12, 28, 6); c.stroke(); }
    });
    ctx.restore();
    ctx.strokeStyle = 'rgba(110, 50, 14, 0.55)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i += 1) { ctx.beginPath(); ctx.moveTo(x + i * 8 - 3, y - 12); ctx.lineTo(x + i * 8 + 3, y + 8); ctx.stroke(); }
    ctx.fillStyle = '#2a160a';
    ctx.beginPath(); ctx.arc(x - 10, y - 4, 2.6, 0, Math.PI * 2); ctx.arc(x + 10, y - 4, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a160a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 1, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (!reduced?.matches) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 12, y - 20);
        ctx.quadraticCurveTo(x + i * 12 + Math.sin(run.t * 3 + i) * 5, y - 32, x + i * 12, y - 42);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const drawBaneWAP = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const b = run?.bane;
    if (!b) return;
    const enter = Math.min(1, b.t / 0.5, (b.dur - b.t) / 0.5);
    const x = W / 2 + (reduced?.matches ? 0 : Math.sin(run.t * 7) * 2);
    const y = PRESENCE_Y - (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = Math.max(0, enter);
    ctx.fillStyle = 'rgba(80, 20, 30, 0.28)';
    ctx.beginPath(); ctx.arc(x, y, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9d2c4';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 38, 7, 0, 0, Math.PI * 2); ctx.fill();
    const full = 1 + Math.min(0.25, ((b.fed || 0) + (run.baneStore || 0)) * 0.05);
    ctx.translate(x, y);
    ctx.scale(full, full);
    ctx.fillStyle = '#6e5038';
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a1a48';
    [[-17, 1], [-14, 7], [22, 4], [18, 9], [-24, 6], [26, -2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#2e1e12';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(-12, 2); ctx.lineTo(-16, 9); ctx.stroke();
    ctx.fillStyle = '#b8b2a0';
    drawVectorPart(ctx, 'baneCrown', {
      fill: true,
      fallback: (c) => {
        c.beginPath();
        c.moveTo(-16, -14); c.lineTo(-16, -28); c.lineTo(-8, -20); c.lineTo(0, -32);
        c.lineTo(8, -20); c.lineTo(16, -28); c.lineTo(16, -14);
        c.closePath(); c.fill();
      }
    });
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.arc(-9, -4, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e2c46a';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(9, -4, 4.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.arc(9, -4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1d22';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(-10, 10, -16, 2); ctx.moveTo(0, 4); ctx.quadraticCurveTo(10, 10, 16, 2); ctx.stroke();
    ctx.fillStyle = '#1f1426';
    drawVectorPart(ctx, 'baneSwitchBody', {
      fill: true,
      fallback: (c) => { c.fillRect(25, -16, 9, 6); }
    });
    ctx.strokeStyle = '#d6473e';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(29, -13); ctx.lineTo(33, -19); ctx.stroke();
    ctx.fillStyle = '#d6473e';
    ctx.beginPath(); ctx.arc(33, -19, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const soon = b.id !== 'tax' && b.nextBeat < 0.7;
    if (b.id === 'wind' || b.id === 'relet') {
      ctx.save();
      ctx.lineCap = 'round';
      if (b.id === 'wind') {
        ctx.strokeStyle = mix(colors.ink, colors.paper, 0.28);
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 5; i += 1) {
          const len = 26 + (i % 3) * 16;
          const wy = run.y - 78 - i * 14;
          const drift = (reduced?.matches ? 0 : Math.sin(run.t * 3 + i) * 8) + b.dir * 6;
          const x0 = W / 2 - b.dir * 24 + drift - b.dir * len * 0.5;
          ctx.globalAlpha = (soon ? 0.9 : 0.38) * (0.5 + (i % 3) * 0.18);
          ctx.beginPath();
          ctx.moveTo(x0, wy); ctx.lineTo(x0 + b.dir * len, wy);
          ctx.moveTo(x0 + b.dir * len, wy); ctx.lineTo(x0 + b.dir * (len - 7), wy - 3.5);
          ctx.moveTo(x0 + b.dir * len, wy); ctx.lineTo(x0 + b.dir * (len - 7), wy + 3.5);
          ctx.stroke();
        }
        ctx.globalAlpha = soon ? 0.95 : 0.5;
        ctx.fillStyle = mix(colors.ink, colors.paper, 0.15);
        ctx.font = '700 10px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RENTED WIND', W / 2, run.y - 156);
      } else {
        ctx.strokeStyle = '#d6473e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        for (let lane = 0; lane <= LANES; lane += 1) {
          const lx = lane * LANE_W + b.dir * (soon ? 10 : 4);
          ctx.globalAlpha = soon ? 0.85 : 0.32;
          ctx.beginPath(); ctx.moveTo(lx, 118); ctx.lineTo(lx, run.y - 24); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = soon ? 0.95 : 0.55;
        ctx.fillStyle = '#d6473e';
        ctx.font = '700 10px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LANES RE-LET', W / 2, 108);
      }
      ctx.restore();
    }
  };

  const drawBursts = () => {
    const ctx = getCtx();
    const run = getRun();
    run?.bursts.forEach((burst) => {
      const t = burst.t / 0.9;
      const grow = reduced?.matches ? 1 : 0.7 + Math.min(1, t * 4) * 0.5;
      const r = 26 * burst.size * grow;
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, t - 0.6) * 2.5;
      ctx.translate(burst.x, burst.y - (reduced?.matches ? 0 : t * 18));
      ctx.rotate(-0.12);
      ctx.fillStyle = '#ffe36b';
      ctx.strokeStyle = '#1d1d22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 20; i += 1) {
        const a = (i / 20) * Math.PI * 2;
        const rr = i % 2 ? r * 0.62 : r;
        ctx.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d6473e';
      ctx.font = `900 ${Math.round(15 * burst.size * grow)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WAP!', 0, 1);
      ctx.restore();
    });
  };

  const drawFlight = () => {
    const ctx = getCtx();
    const run = getRun();
    if (!run) return;
    run.rings.forEach((ring) => {
      const k = clamp(ring.t / ring.dur, 0, 1);
      ctx.save();
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.lineWidth = Math.max(1, 2.4 * (1 - k));
      if (ring.dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    run.trails.forEach((dot) => {
      const k = clamp(1 - dot.t * 2.5, 0, 1);
      ctx.save();
      ctx.fillStyle = dot.gold ? '#f2c14e' : dot.loft ? '#fbf8f0' : 'rgba(224, 169, 90, 0.75)';
      ctx.globalAlpha = k * 0.65;
      ctx.beginPath(); ctx.arc(dot.x, dot.y, 1.4 + k * 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    run.slices.forEach((slice) => {
      const t = Math.min(1, slice.t);
      const tx = slice.target.x;
      const ty = slice.target.y - 10;
      const x = slice.x0 + (tx - slice.x0) * t;
      const y = slice.y0 + (ty - slice.y0) * t - Math.sin(t * Math.PI) * 50;
      drawWedge(x, y, t * 8);
    });
    run.throws.forEach((shot) => {
      const lofted = shot.loft > 0;
      if (lofted) {
        ctx.fillStyle = 'rgba(20, 16, 10, 0.2)';
        ctx.beginPath(); ctx.ellipse(shot.x, shot.y + 14, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      if (lofted) {
        ctx.translate(shot.x, shot.y);
        ctx.scale(1.35, 1.35);
        ctx.translate(-shot.x, -shot.y);
      }
      if (shot.echo) ctx.globalAlpha = 0.6;
      const isGold = shot.bounces > 0 || shot.ramped.size > 0 || shot.curved || shot.poised;
      drawWedge(shot.x, shot.y - (lofted ? 6 : 0), Math.atan2(shot.vx, -shot.vy) + shot.t * 10, isGold, shot.missing, shot.size || 1);
      ctx.restore();
    });
    run.puffs.forEach((puff) => {
      ctx.fillStyle = `rgba(250, 246, 236, ${Math.max(0, 0.85 - puff.t * 0.8)})`;
      ctx.beginPath(); ctx.arc(puff.x, puff.y, 4 + puff.t * 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.font = '800 11px "JetBrainsMono", ui-monospace, monospace';
    const placed = [];
    run.tags.forEach((tag) => {
      const half = ctx.measureText(tag.text).width / 2 + 3;
      let y = tag.y - (reduced?.matches || tag.trope ? 0 : tag.t * 20);
      for (let tries = 0; tries < 6; tries += 1) {
        const hit = placed.find((p) => Math.abs(p.y - y) < 12 && p.x - p.half < tag.x + half && tag.x - half < p.x + p.half);
        if (!hit) break;
        y = hit.y - 13;
      }
      placed.push({ x: tag.x, y, half });
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - tag.t);
      ctx.fillStyle = tag.text === 'TAX' || tag.hurt ? '#c0392b' : '#b8860b';
      ctx.font = '800 11px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      if (tag.trope) {
        const width = Math.min(W - 16, half * 2 + 14);
        ctx.fillStyle = '#262034';
        ctx.strokeStyle = '#e4b96c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tag.x - width / 2, y - 13, width, 19, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff0d0';
        ctx.fillText(tag.text, tag.x, y, width - 12);
      } else {
        ctx.fillText(tag.text, tag.x, y);
      }
      ctx.restore();
    });
  };

  const drawEscorts = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    if (!run || getState() !== 'running') return;
    const t = run.t;
    const still = reduced?.matches;
    ctx.save();
    for (let i = 0; i < (run.echoes || 0); i += 1) {
      const wx = run.x - 14 + i * 9;
      const wy = run.y - 44 + (still ? 0 : Math.sin(t * 6 + i) * 1.2);
      ctx.fillStyle = '#7a5a3c';
      ctx.beginPath(); ctx.ellipse(wx, wy, 3.4, 2.4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(wx + 2.5, wy - 1); ctx.lineTo(wx + 5.5, wy - 3.5); ctx.lineTo(wx + 3, wy + 0.5); ctx.fill();
    }
    if (run.lag > 0) {
      ctx.fillStyle = mix(colors.ink, colors.paper, 0.55);
      ctx.globalAlpha = Math.min(1, run.lag) * 0.5;
      for (let i = 0; i < 4; i += 1) {
        const py = ((t * 26 + i * 44) % 180) + run.y - 120;
        const px = run.x + (i % 2 ? 22 : 30);
        ctx.beginPath(); ctx.ellipse(px - 2, py, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.ellipse(px + 2, py, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (run.unkept > 0) {
      const bx = run.x - 30;
      const by = run.y - 6 + (still ? 0 : Math.abs(Math.sin(t * 9)) * -4);
      ctx.globalAlpha = Math.min(1, run.unkept) * 0.8;
      ctx.fillStyle = '#efe6d2';
      ctx.strokeStyle = mix(colors.ink, colors.paper, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(bx, by, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 6, by - 2); ctx.lineTo(bx + 11, by - 7); ctx.lineTo(bx + 12, by - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (run.trueAim > 0) {
      const from = throwFrom();
      const tipX = from.x + Math.sin(run.aim.a) * 46;
      const tipY = from.y - Math.cos(run.aim.a) * 46;
      ctx.fillStyle = 'rgba(232, 222, 196, 0.9)';
      for (let i = 0; i < 3; i += 1) {
        const a = (still ? 0 : t * (2.1 + i * 0.37)) + i * 2.1;
        const r = 7 + i * 2;
        ctx.beginPath(); ctx.ellipse(tipX + Math.cos(a) * r, tipY + Math.sin(a) * r * 0.6, 2.4, 1.4, a, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (run.frill > 0) {
      ctx.strokeStyle = 'rgba(122, 146, 112, 0.85)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < run.frill; i += 1) {
        ctx.beginPath();
        for (let k = 0; k <= 12; k += 1) {
          const a = Math.PI + (k / 12) * Math.PI;
          const r = 14 + i * 4 + Math.sin(k * 2.2) * 1.6;
          const px = run.x + Math.cos(a) * r;
          const py = run.y + 6 - Math.sin(a) * r * 0.25;
          if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
    }
    if (run.fed > 0) {
      const g = ctx.createRadialGradient(run.x, run.y + 4, 2, run.x, run.y + 4, 22);
      g.addColorStop(0, `rgba(201, 169, 154, ${Math.min(1, run.fed) * 0.35})`);
      g.addColorStop(1, 'rgba(201, 169, 154, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(run.x, run.y + 4, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  return {
    drawFigure,
    drawBody,
    drawPie,
    drawHat,
    drawSpill,
    drawBoof,
    drawBoonWAP,
    drawBaneWAP,
    drawEscorts,
    drawFlight,
    drawBursts,
    listCarrierRenderers: () => ['figure', 'porter', 'clerk', 'genie', 'clown', ...CUSTOM_CARRIER_RENDERERS.keys()]
  };
}
