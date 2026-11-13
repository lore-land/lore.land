/**
 * pie-draw.mjs — canvas scene ground, carrier face & mechanics overlays, gift art, and find moments.
 * Extracted from pie-game.mjs so rendering primitives stay readable and separate from physics and state.
 */
import { GIFT_ART } from './pie-live.mjs?v=2026_11_13.A';
import { HAGGLE_BEATS } from './pie-finds.mjs?v=2026_11_13.B';

/**
 * Initialize canvas drawing helpers for Exactly One Pie.
 * @param {object} deps
 */
export function initPieDraw({
  getCtx, W, LANES, LANE_W, getBoard, record, reduced, getColors, mix, clamp,
  getRun, getState, jumpLift, poiseNeed, poised
}) {
  /* A place's light: the paper, tinted. Between places, one crosses into the next. */
  const skyFor = (s) => {
    const colors = getColors();
    const tint = { night: colors.night, bronze: colors.gold, ember: colors.hearth, gold: colors.gold, berry: colors.berry, frost: mix(colors.accent, 'rgb(236, 244, 248)', 0.55) }[s.tint];
    return [mix(colors.paper, tint, s.tint === 'night' ? 0.32 : 0.16), mix(colors.deep, tint, s.tint === 'night' ? 0.22 : 0.08)];
  };

  /* The road's texture, row by row, from one row above the frame's top (above the world, in a filled screen's haze)
   * to its foot; with the world exactly in view this is the old -step + off. */
  const roadFrom = (step, off) => off - step * (1 + Math.ceil(Math.max(0, -getBoard().y0) / step));

  const drawGroundFor = (sceneId, scroll, alpha = 1) => {
    if (alpha <= 0.01) return;
    const ctx = getCtx();
    const board = getBoard();
    const colors = getColors();
    ctx.save();
    ctx.globalAlpha = alpha;
    const stroke = mix(colors.muted, colors.paper, 0.84);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    if (sceneId === 'field') {
      // Turned earth ridges and frost-flecked furrow lines.
      const off = scroll % 36;
      for (let y = roadFrom(36, off); y < board.y0 + board.h + 18; y += 36) {
        const rowIdx = Math.floor((y - off) / 36);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let lx = 0; lx <= W; lx += 36) {
          const wave = Math.sin(lx * 0.05 + rowIdx) * 2.5;
          ctx.lineTo(lx, y + wave);
        }
        ctx.stroke();
        ctx.fillStyle = mix(colors.accent, colors.paper, 0.85);
        for (let lane = 0; lane < LANES; lane += 1) {
          const fx = lane * LANE_W + 22 + ((rowIdx + lane) % 3) * 10;
          ctx.beginPath(); ctx.arc(fx, y - 10, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (sceneId === 'gate') {
      // Squared parcel-gate flagstones with bronze threshold rivets.
      const off = scroll % 38;
      for (let y = roadFrom(38, off); y < board.y0 + board.h; y += 38) {
        const shift = (Math.floor((y - off) / 38) % 2) * (LANE_W * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        for (let x = shift; x < W; x += LANE_W) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 38);
        }
        ctx.stroke();
        ctx.fillStyle = mix(colors.gold, colors.paper, 0.78);
        for (let x = shift + 6; x < W; x += LANE_W) {
          ctx.beginPath(); ctx.arc(x, y + 5, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (sceneId === 'plaza') {
      // Fan-paved festival courses and radial joints.
      const off = scroll % 40;
      for (let y = roadFrom(40, off); y < board.y0 + board.h + 40; y += 40) {
        ctx.beginPath();
        ctx.ellipse(W / 2, y + 60, W * 0.68, 38, 0, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
        for (let lane = 0; lane < LANES; lane += 1) {
          const lx = lane * LANE_W + LANE_W / 2;
          ctx.beginPath();
          ctx.arc(lx, y, 10, 0, Math.PI);
          ctx.stroke();
        }
      }
    } else if (sceneId === 'court') {
      // Chequered palace flagstones and a worn runner down the middle lane.
      const off = scroll % 36;
      const midX = 2 * LANE_W + LANE_W / 2;
      ctx.fillStyle = mix(colors.hearth, colors.paper, 0.9);
      ctx.fillRect(midX - LANE_W * 0.44, board.y0, LANE_W * 0.88, board.h);
      ctx.strokeStyle = mix(colors.gold, colors.paper, 0.74);
      ctx.beginPath();
      ctx.moveTo(midX - LANE_W * 0.4, board.y0); ctx.lineTo(midX - LANE_W * 0.4, board.y0 + board.h);
      ctx.moveTo(midX + LANE_W * 0.4, board.y0); ctx.lineTo(midX + LANE_W * 0.4, board.y0 + board.h);
      ctx.stroke();
      ctx.strokeStyle = stroke;
      for (let y = roadFrom(36, off); y < board.y0 + board.h; y += 36) {
        const rowIdx = Math.floor((y - off) / 36);
        for (let lane = 0; lane < LANES; lane += 1) {
          if ((rowIdx + lane) % 2 === 0 && lane !== 2) {
            ctx.fillStyle = mix(colors.muted, colors.paper, 0.93);
            ctx.fillRect(lane * LANE_W + 3, y + 3, LANE_W - 6, 30);
          }
          ctx.strokeRect(lane * LANE_W + 2, y + 2, LANE_W - 4, 32);
        }
      }
    } else if (sceneId === 'table') {
      // Wide banqueting-hall floorboards and brass dowel pins.
      const off = scroll % 44;
      for (let lane = 0; lane < LANES; lane += 1) {
        const lx = lane * LANE_W;
        ctx.beginPath();
        ctx.moveTo(lx + LANE_W * 0.5, board.y0);
        ctx.lineTo(lx + LANE_W * 0.5, board.y0 + board.h);
        ctx.stroke();
      }
      for (let y = roadFrom(44, off); y < board.y0 + board.h; y += 44) {
        const rowIdx = Math.floor((y - off) / 44);
        for (let lane = 0; lane < LANES; lane += 1) {
          const jy = y + ((lane * 17 + rowIdx * 9) % 22);
          ctx.beginPath();
          ctx.moveTo(lane * LANE_W + 2, jy);
          ctx.lineTo((lane + 1) * LANE_W - 2, jy);
          ctx.stroke();
          ctx.fillStyle = mix(colors.gold, colors.paper, 0.76);
          ctx.beginPath();
          ctx.arc(lane * LANE_W + 10, jy + 4, 1.1, 0, Math.PI * 2);
          ctx.arc((lane + 1) * LANE_W - 10, jy + 4, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Cobbles, scrolling with the scene.
      const off = scroll % 32;
      for (let y = roadFrom(32, off); y < board.y0 + board.h; y += 32) {
        for (let lane = 0; lane < LANES; lane += 1) {
          const shift = (Math.floor((y - off) / 32) % 2) * 12;
          ctx.beginPath();
          ctx.ellipse(lane * LANE_W + 18 + shift, y, 14, 9, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };

  /* ─── The carrier's face: how the carry is going, in the one under the hat ───
   * calm (a small smile), focused (the needle just turned: brows level, mouth set), glad (a clown
   * satisfied, or a combo running), worried (the pie past two-thirds tilted; a bead of sweat near the
   * top), ouch (a knock, or the spill). Every carrier's head sits in the same place, so one face fits all. */
  function moodOf() {
    const run = getRun();
    if (!run || getState() === 'title') return 'calm';
    if (run.spill || run.hurtT > 0) return 'ouch';
    if (run.wobble > 0.62) return 'worried';
    if (run.gladT > 0 || (run.combo >= 2 && run.comboT > 0)) return 'glad';
    if (run.aimFocusT > 0) return 'focused';
    return 'calm';
  }

  function drawFace(x, y, mood, who, alpha = 1) {
    const run = getRun();
    const ctx = getCtx();
    const colors = getColors();
    const hy = y - 44;
    const my = hy + (who === 'clown' ? 6 : 4.6);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = who === 'figure' ? colors.ink : who === 'clown' ? '#c0392b' : '#3a2a20';
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mood === 'glad') {
      ctx.arc(x, my - 2, 3.4, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.moveTo(x - 5, hy - 4.6); ctx.quadraticCurveTo(x - 3.2, hy - 6.4, x - 1.4, hy - 4.6);
      ctx.moveTo(x + 1.4, hy - 4.6); ctx.quadraticCurveTo(x + 3.2, hy - 6.4, x + 5, hy - 4.6);
    } else if (mood === 'worried') {
      ctx.moveTo(x - 3.2, my); ctx.quadraticCurveTo(x - 1.6, my - 1.6, x, my); ctx.quadraticCurveTo(x + 1.6, my + 1.6, x + 3.2, my);
      ctx.moveTo(x - 5.2, hy - 4.4); ctx.lineTo(x - 1.6, hy - 6.2);
      ctx.moveTo(x + 5.2, hy - 4.4); ctx.lineTo(x + 1.6, hy - 6.2);
    } else if (mood === 'ouch') {
      ctx.arc(x, my, 1.7, 0, Math.PI * 2);
      ctx.moveTo(x - 5.2, hy - 6.2); ctx.lineTo(x - 1.6, hy - 4.6);
      ctx.moveTo(x + 5.2, hy - 6.2); ctx.lineTo(x + 1.6, hy - 4.6);
    } else if (mood === 'focused') {
      ctx.moveTo(x - 2.2, my); ctx.lineTo(x + 2.2, my);
      ctx.moveTo(x - 5, hy - 4.4); ctx.lineTo(x - 1.6, hy - 4.4);
      ctx.moveTo(x + 1.6, hy - 4.4); ctx.lineTo(x + 5, hy - 4.4);
    } else {
      ctx.arc(x, my - 2.4, 2.6, 0.25 * Math.PI, 0.75 * Math.PI);
    }
    ctx.stroke();
    if (mood === 'worried' && run?.wobble > 0.8) {
      ctx.fillStyle = '#7fb4c0';
      ctx.beginPath();
      ctx.moveTo(x + 9.5, hy - 6); ctx.quadraticCurveTo(x + 12, hy - 1.5, x + 9.5, hy - 0.8); ctx.quadraticCurveTo(x + 7, hy - 1.5, x + 9.5, hy - 6);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ─── The mechanics, drawn where they act ─── */
  const GIFT_BADGES = Object.freeze([
    ['lit', '☀', '#d9a23a', 'lit'], ['echoes', '◎', '#2c8b86', 'echoes'], ['lag', '≈', '#4f86a8', 'slow'], ['unkept', '◌', '#8a8a8a', 'unkept'],
    ['trueAim', '➶', '#3d7a3a', 'true aim'], ['aimLock', '↑', '#3d7a3a', 'arrow'], ['fed', '♨', '#8a6a4a', 'fed'], ['warm', '✹', '#d0892e', 'warm'], ['glimpse', '◐', '#7a4f8e', 'glimpse']
  ]);

  function drawPowerRing() {
    const run = getRun();
    if (!run || getState() !== 'running' || record.view.zen) return;
    const ctx = getCtx();
    const cx = run.x;
    const cy = run.y - 24 - (run.jumpT > 0 ? jumpLift() : 0);
    let r = 34;
    ctx.save();
    ctx.lineCap = 'round';
    const start = -Math.PI / 2;
    GIFT_BADGES.forEach(([key, , colour]) => {
      const most = { lit: 12, lag: 8, unkept: 6, trueAim: 10, fed: 10, warm: 10, glimpse: 8 }[key];
      const left = most ? run[key] || 0 : 0;
      if (left <= 0) return;
      const end = start + Math.min(1, left / most) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(20, 16, 10, 0.4)';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();
      r += 7;
    });
    if (run.shield) {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(255, 214, 102, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  /* A gift from a live stream, drawn as itself (pie-live.mjs GIFT_ART): it pops up from the carrier, large and plain,
   * and fades as it rises. A boxing glove punches up the lanes; a paper crane flies up them. */
  function drawGiftArt() {
    const run = getRun();
    if (!run?.giftArt?.length) return;
    const ctx = getCtx();
    const LIFE = 2.6;
    run.giftArt = run.giftArt.filter((g) => run.t - g.t0 < LIFE);
    run.giftArt.forEach((g, i) => {
      const age = run.t - g.t0;
      const k = age / LIFE;
      const pop = reduced?.matches ? 1.2 : k < 0.12 ? 0.6 + (k / 0.12) * 0.8 : 1.4 - Math.min(0.2, (k - 0.12) * 0.6);
      let x = g.x + (i % 2 ? 14 : -14) * Math.min(1, i);
      let y = run.y - 70 - k * 70;
      if (g.art === 'glove') y = run.y - 70 - k * 320;
      if (g.art === 'crane') { y = run.y - 80 - k * 260; x = g.x + Math.sin(k * 6) * 28; }
      ctx.save();
      ctx.globalAlpha = k > 0.72 ? Math.max(0, 1 - (k - 0.72) / 0.28) : 1;
      ctx.translate(clamp(x, 24, W - 24), y);
      ctx.scale(pop, pop);
      (GIFT_ART[g.art] || GIFT_ART.box)(ctx, age);
      ctx.restore();
    });
  }

  /* A find's moment (pie-finds.mjs), a classic beat drawn where it happens, not said. */
  function drawMoments() {
    const run = getRun();
    if (!run?.moments?.length) return;
    const ctx = getCtx();
    // The haggle is told in three rounds (the rule of three), so it stays up longer than the other beats.
    const lifeOf = (m) => (m.kind === 'haggle' ? 4 : 2.8);
    run.moments = run.moments.filter((m) => run.t - m.t0 < lifeOf(m));
    run.moments.forEach((m) => {
      const age = run.t - m.t0;
      const LIFE = lifeOf(m);
      ctx.save();
      ctx.globalAlpha = age > LIFE - 0.5 ? Math.max(0, (LIFE - age) / 0.5) : 1;
      if (m.kind === 'haggle') {
        // Nobody is selling, and the Genie prices them anyway. A 3. Nobody argues (a pause, an empty bubble), so it is
        // struck and a 2 goes up; nobody argues, so a 1; nobody argues, so he strikes that too and hands a coin back.
        // He has lost a haggle to silence. Drawn, never said: each strike kicks the tag on its string.
        const x = run.x;
        const y = run.y - 92;
        const STRIKES = HAGGLE_BEATS.strikes;
        const kicked = [0, ...STRIKES].filter((t) => t <= age).pop() || 0;
        const since = age - kicked;
        const swing = reduced?.matches ? 0 : Math.sin(since * 6) * 0.26 * Math.max(0, 1 - since);
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y - 14); ctx.stroke();
        ctx.translate(x, y - 14);
        ctx.rotate(swing);
        ctx.fillStyle = '#fff3d6';
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.roundRect(-31, 0, 62, 28, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 5, 2.2, 0, Math.PI * 2); ctx.stroke();
        ctx.font = '800 16px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ['3', '2', '1'].forEach((digit, i) => {
          const shown = i === 0 ? 0 : STRIKES[i - 1] + 0.2;
          if (age < shown) return;
          const dx = -19 + i * 19;
          ctx.fillStyle = i === 0 ? '#3a2a1a' : '#c0392b';
          ctx.fillText(digit, dx, 17);
          const strike = Math.min(1, Math.max(0, (age - STRIKES[i]) / 0.18));
          if (strike > 0) {
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(dx - 7, 24); ctx.lineTo(dx - 7 + 14 * strike, 24 - 13 * strike); ctx.stroke();
          }
        });
        ctx.rotate(-swing);
        // The other side of the haggle: nobody, saying nothing, before each strike.
        STRIKES.forEach((t) => {
          const k = (age - (t - 0.42)) / 0.4;
          if (k < 0 || k > 1) return;
          ctx.save();
          ctx.globalAlpha *= Math.sin(k * Math.PI);
          if (x + 68 > W) ctx.scale(-1, 1);   // no room on the right in the last lane: nobody stands on the left
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.strokeStyle = 'rgba(58, 42, 26, 0.55)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(38, -6, 26, 16, 7); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(42, 9); ctx.lineTo(37, 15); ctx.lineTo(47, 10); ctx.fill();
          ctx.fillStyle = 'rgba(58, 42, 26, 0.8)';
          [45, 51, 57].forEach((dotX) => { ctx.beginPath(); ctx.arc(dotX, 2, 1.4, 0, Math.PI * 2); ctx.fill(); });
          ctx.restore();
        });
        // Past one there is nowhere to go but paying: a coin, handed back down to whoever is carrying.
        if (age > HAGGLE_BEATS.coin) {
          const k = Math.min(1, (age - HAGGLE_BEATS.coin) / 0.55);
          const cx = 18 - 18 * k;
          const cy = 30 + 70 * k - 34 * Math.sin(k * Math.PI);
          ctx.fillStyle = '#e8b931';
          ctx.strokeStyle = '#8a6410';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, 4.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (m.kind === 'sniff') {
        const rise = Math.min(1, age / 0.7);
        ctx.translate(m.x, m.y - 10 - rise * 16);
        ctx.scale(1.3, 1.3);
        GIFT_ART.rose(ctx, age);
        ctx.strokeStyle = 'rgba(126, 87, 194, 0.85)';
        ctx.lineWidth = 1.3;
        for (let i = 0; i < 3; i += 1) {
          const show = Math.min(1, Math.max(0, (age - 0.4 - i * 0.18) / 0.25));
          if (!show) continue;
          ctx.beginPath(); ctx.arc(14 + i * 5, -10 - i * 3, 4 + i * 1.5, Math.PI * 0.9, Math.PI * (0.9 + 0.8 * show)); ctx.stroke();
        }
        if (age > 1.1) {
          const pop = Math.min(1, (age - 1.1) / 0.2);
          ctx.translate(-14, -22 - (age - 1.1) * 12);
          ctx.scale(pop, pop);
          GIFT_ART.heart(ctx, age);
        }
      } else if (m.kind === 'unwritten') {
        const rise = Math.min(1, age / 0.6);
        const x = run.x;
        const y = run.y - 78 - rise * 14;
        ctx.strokeStyle = '#ffd666';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(x, y, 16, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(29, 29, 34, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x, y - 16, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffd666';
        [[-18, -8], [18, -12]].forEach(([dx, dy], i) => {
          const drift = age * (14 + i * 4);
          ctx.beginPath(); ctx.arc(x + dx, y + dy - drift, 2, 0, Math.PI * 2); ctx.fill();
        });
      }
      ctx.restore();
    });
  }

  function drawMechanics() {
    const run = getRun();
    if (!run || getState() !== 'running' || record.view.zen) return;
    const ctx = getCtx();
    const colors = getColors();
    const calm = reduced?.matches;
    const x = run.x;
    const y = run.y - (run.jumpT > 0 ? jumpLift() : 0);
    ctx.save();
    ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Gifts over the hat.
    run.giftMax = run.giftMax || {};
    const live = GIFT_BADGES.filter(([key]) => run[key] > 0);
    GIFT_BADGES.forEach(([key]) => { if (!(run[key] > 0)) delete run.giftMax[key]; });
    live.forEach(([key, glyph, ink], i) => {
      const v = run[key];
      const max = (run.giftMax[key] = Math.max(run.giftMax[key] || 0, v));
      const a = -Math.PI / 2 + (i - (live.length - 1) / 2) * 0.42;
      const bx = x + Math.cos(a) * 34;
      const by = y - 70 + Math.sin(a) * 18;
      ctx.fillStyle = 'rgba(255, 252, 244, 0.92)';
      ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = mix(colors.ink, colors.paper, 0.75);
      ctx.lineWidth = 1;
      ctx.stroke();
      if (key !== 'echoes') {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(v / max, 0, 1)); ctx.stroke();
      }
      ctx.fillStyle = ink;
      ctx.fillText(key === 'echoes' ? String(Math.ceil(v)) : glyph, bx, by + 0.5);
    });
    // The catch: step toward the lean.
    if (run.wobble >= 0.24 && Math.abs(run.tiltDir || 0) >= 0.3 && !run.spill) {
      const side = Math.sign(run.tiltDir);
      const pulse = calm ? 1 : 0.65 + Math.sin(run.t * 9) * 0.35;
      const cx = x + side * 50;
      const cy = y - 18;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#2c8b86';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - side * 3, cy - 6); ctx.lineTo(cx + side * 3, cy); ctx.lineTo(cx - side * 3, cy + 6);
      ctx.moveTo(cx - side * 9, cy - 6); ctx.lineTo(cx - side * 3, cy); ctx.lineTo(cx - side * 9, cy + 6);
      ctx.stroke();
      ctx.font = '700 7px "JetBrainsMono", ui-monospace, monospace';
      ctx.fillStyle = '#2c8b86';
      ctx.fillText('CATCH', cx - side * 3, cy + 13);
      ctx.globalAlpha = 1;
    }
    // A combo: its pips, and the time left to keep it going.
    if (run.combo >= 1 && run.comboT > 0) {
      const n = Math.min(run.combo, 6);
      const by = y - (live.length ? 98 : 80);   // over the hat (and its gifts): clear of the aura at the foot
      for (let i = 0; i < n; i += 1) {
        ctx.fillStyle = i >= 2 ? '#d6473e' : '#f2c14e';
        ctx.beginPath(); ctx.arc(x - (n - 1) * 4.5 + i * 9, by, 3, 0, Math.PI * 2); ctx.fill();
      }
      const w = 44 * clamp(run.comboT / 2.6, 0, 1);
      ctx.fillStyle = mix(colors.ink, colors.paper, 0.8);
      ctx.fillRect(x - 22, by + 6, 44, 2);
      ctx.fillStyle = '#d9a23a';
      ctx.fillRect(x - 22, by + 6, w, 2);
      if (run.combo >= 2) {
        ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
        ctx.fillStyle = colors.ink;
        ctx.fillText(`×${run.combo}`, x + (n - 1) * 4.5 + 14, by + 0.5);
      }
    }
    // Poise: stillness filling a ring under the feet.
    const need = poiseNeed();
    if (run.jumpT <= 0 && run.stillT > 0.08) {
      ctx.lineWidth = 1.6;
      if (poised()) {
        ctx.strokeStyle = 'rgba(242, 193, 78, 0.85)';
        ctx.beginPath(); ctx.ellipse(x, run.y + 17, 17, 5, 0, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeStyle = mix(colors.ink, colors.paper, 0.55);
        ctx.beginPath(); ctx.ellipse(x, run.y + 17, 17, 5, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(run.stillT / need, 0, 1)); ctx.stroke();
      }
    }
    ctx.restore();
  }

  return {
    skyFor,
    roadFrom,
    drawGroundFor,
    moodOf,
    drawFace,
    GIFT_BADGES,
    drawPowerRing,
    drawGiftArt,
    drawMoments,
    drawMechanics
  };
}
