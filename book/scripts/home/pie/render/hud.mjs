/**
 * pie/render/hud.mjs — scene framing, bands, place lights, aim preview, corvids,
 * HUD pills & chapter track, foretelling banners, land quality, carrier tunes,
 * hop gauge, minigame overlays, and long-view perspective warp for Exactly One Pie.
 */

const SHELF_INK = Object.freeze({ boon: '#e0a23a', bane: '#7a3f9a', bone: '#a8564a', bonk: '#4f9a98', honk: '#c86d2c' });

/**
 * Initialize HUD, backdrop framing, aim preview, and overlay renderers.
 * @param {object} deps
 */
export function initHudRenderer({
  getCtx, getCanvas, getRun, getState, getColors, getBoard,
  record, reduced,
  W, H, LANES, LANE_W, ROWS, PRESENCE_Y, TOTAL_CHAPTERS, AIM_MAX,
  SCENES, CHAPTER_SCENE, PLACES, PLACE_COLORS, MINIS, FORETOLD,
  SHELVES, CHAINS, CARRIER_TUNES, RECIPES,
  getChosenStartChapter, getTune, domainTune, setting,
  laneX, rowY, clamp, mix, channels, fillFrame,
  scene, skyFor, drawGroundFor, placesOn, shelvesOn, voiceOn,
  conductor, throwFrom, sighted, traceTrajectory, poised,
  cobbles, progress, recipeIdNow, mawAhead, fmtPts,
  jumpLift, inHang, longK, viewScale, landQuality
}) {
  let skyTop = 'rgb(243, 237, 225)';
  let warpCanvas = null;

  const rgba = (c, a) => {
    const [r, g, b] = channels(c);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };
  const hexRgb = (hex) => {
    const n = parseInt(String(hex).slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };

  const drawCorvids = () => {
    const ctx = getCtx();
    const run = getRun();
    const board = getBoard();
    if (!run?.corvids?.length) return;
    run.corvids.forEach((c) => {
      const k = run.t - c.at;
      if (k > 3) return;
      const onVerge = board.x0 < -18;
      const x = c.edge < 0 ? (onVerge ? -14 : 8) : (onVerge ? W + 14 : W - 8);
      const up = k > 1.2 ? (k - 1.2) * 60 : 0;
      const y = c.y - up;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 2.2) / 0.8);
      ctx.fillStyle = c.raven ? '#151519' : '#24242b';
      ctx.beginPath(); ctx.ellipse(x, y, c.raven ? 8 : 6.5, c.raven ? 5 : 4.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + c.edge * -6, y - 4, c.raven ? 3.4 : 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a4a2a';
      ctx.beginPath(); ctx.moveTo(x + c.edge * -9, y - 4); ctx.lineTo(x + c.edge * -13, y - 3); ctx.lineTo(x + c.edge * -9, y - 2.4); ctx.fill();
      if (up) {
        ctx.strokeStyle = c.raven ? '#151519' : '#24242b';
        ctx.lineWidth = 1.6;
        const flap = Math.sin(k * 18) * 4;
        ctx.beginPath(); ctx.moveTo(x - 9, y - flap); ctx.lineTo(x, y - 2); ctx.lineTo(x + 9, y - flap); ctx.stroke();
      }
      ctx.restore();
    });
  };

  const drawBands = () => {
    const ctx = getCtx();
    const board = getBoard();
    const colors = getColors();
    if (!board.filled) return;
    const above = -board.y0;
    if (above > 4) {
      const edge = Math.min(10, above);
      const haze = ctx.createLinearGradient(0, board.y0, 0, 0);
      haze.addColorStop(0, rgba(mix(skyTop, colors.paper, 0.45), 1));
      haze.addColorStop(Math.max(0, 1 - edge / above), rgba(skyTop, 1));
      haze.addColorStop(1, rgba(skyTop, 0));
      ctx.fillStyle = haze;
      ctx.fillRect(board.x0, board.y0, board.w, above);
      ctx.save();
      ctx.strokeStyle = rgba(colors.muted, 0.22);
      ctx.setLineDash([6, 10]);
      for (let lane = 1; lane < LANES; lane += 1) {
        ctx.beginPath(); ctx.moveTo(lane * LANE_W, board.y0); ctx.lineTo(lane * LANE_W, -edge); ctx.stroke();
      }
      ctx.restore();
      if (record.view.labels) {
        ctx.fillStyle = rgba(colors.muted, 0.55);
        ctx.font = '700 15px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', W / 2, Math.max(board.y0 + 18, -8));
      }
    }
    const below = board.y0 + board.h - H;
    if (below > -40) {
      const from = H - 40;
      const ground = ctx.createLinearGradient(0, from, 0, board.y0 + board.h);
      ground.addColorStop(0, rgba(colors.deep, 0));
      ground.addColorStop(1, rgba(colors.deep, 0.5));
      ctx.fillStyle = ground;
      ctx.fillRect(board.x0, from, board.w, board.y0 + board.h - from);
      if (record.view.labels) {
        ctx.fillStyle = rgba(colors.muted, 0.55);
        ctx.font = '700 15px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('.', W / 2, H + Math.min(below, 60) / 2);
      }
    }
  };

  const drawPlaceLights = (sceneId, alpha) => {
    const ctx = getCtx();
    const place = PLACES[sceneId];
    if (!place || alpha <= 0) return;
    ctx.save();
    place.discs.forEach((disc) => {
      const cx = disc.x * W;
      const cy = 26 + disc.y * 190;
      const r = disc.r * W * 0.62;
      const fill = hexRgb(PLACE_COLORS[disc.fill] || '#e6dfd0');
      if (disc.glow) {
        const glow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.2);
        glow.addColorStop(0, rgba(fill, 0.16 * alpha));
        glow.addColorStop(1, rgba(fill, 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(fill, 0.17 * alpha);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(hexRgb(PLACE_COLORS[disc.rim] || '#8fc8c4'), 0.24 * alpha);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.restore();
  };

  const drawScene = () => {
    const ctx = getCtx();
    const run = getRun();
    const state = getState();
    const colors = getColors();
    const board = getBoard();
    const defaultSceneId = CHAPTER_SCENE[getChosenStartChapter()] || 'lanes';
    const s = run ? scene() : (SCENES.find((entry) => entry.id === defaultSceneId) || SCENES[2]);
    let [top, bottom] = skyFor(s);
    const sceneTune = domainTune('scenes');
    const warmth = Number(sceneTune.sky_warmth);
    if (warmth && warmth !== 1) {
      const k = clamp((warmth - 1) * 0.25, -0.22, 0.3);
      if (k > 0) top = mix(top, colors.deep, k);
      else bottom = mix(bottom, colors.paper, -k);
    }
    if (run && run.prevScene != null && run.sceneT < 1) {
      const [fromTop, fromBottom] = skyFor(SCENES.find((entry) => entry.id === run.prevScene) || s);
      top = mix(fromTop, top, run.sceneT);
      bottom = mix(fromBottom, bottom, run.sceneT);
    }
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);
    skyTop = top;
    ctx.fillStyle = sky;
    fillFrame();
    if (placesOn()) {
      const turning = run && run.prevScene != null && run.prevScene !== s.id && run.sceneT < 1;
      if (turning) drawPlaceLights(run.prevScene, 1 - run.sceneT);
      drawPlaceLights(s.id, turning ? run.sceneT : 1);
    }
    if (board.x0 < -1) {
      ctx.fillStyle = mix(colors.deep, colors.paper, 0.86);
      ctx.fillRect(board.x0, board.y0, -board.x0, board.h);
      ctx.fillRect(W, board.y0, board.x0 + board.w - W, board.h);
      ctx.strokeStyle = mix(colors.muted, colors.paper, 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, board.y0); ctx.lineTo(0, board.y0 + board.h);
      ctx.moveTo(W, board.y0); ctx.lineTo(W, board.y0 + board.h);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    const scroll = run?.scroll || 0;
    if (run && run.prevScene && run.prevScene !== s.id && run.sceneT < 1) {
      drawGroundFor(run.prevScene, scroll, 1 - run.sceneT);
      drawGroundFor(s.id, scroll, run.sceneT);
    } else {
      drawGroundFor(s.id, scroll, 1);
    }
    const beatSnap = (!reduced?.matches && !record.view.zen && state === 'running') ? conductor.beatState?.() : null;
    const beatPulse = beatSnap ? Math.exp(-beatSnap.phase * 4.5) : 0;
    ctx.strokeStyle = mix(colors.muted, colors.paper, clamp(0.6 - beatPulse * 0.14, 0.4, 0.65));
    ctx.setLineDash([6 + beatPulse * 1.5, 10 - beatPulse * 1.5]);
    for (let lane = 1; lane < LANES; lane += 1) {
      ctx.beginPath();
      ctx.moveTo(lane * LANE_W, board.y0);
      ctx.lineTo(lane * LANE_W, board.y0 + board.h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (run && state !== 'title') {
      const laneAlpha = (0.26 + beatPulse * 0.08).toFixed(2);
      const glow = ctx.createLinearGradient(0, 0, 0, H);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glow.addColorStop(1, mix(colors.paper, 'rgb(255, 255, 255)', 0.5).replace('rgb(', 'rgba(').replace(')', `, ${laneAlpha})`));
      ctx.fillStyle = glow;
      ctx.fillRect(run.x - LANE_W / 2, 0, LANE_W, H);
      for (let row = 0; row < ROWS; row += 1) {
        const ty = rowY(row) - 18;
        const isBeatRow = beatSnap && ((3 - beatSnap.beatIndex) === row);
        const wMark = row === run.row ? 9 + beatPulse * 2.5 : isBeatRow ? 7 : 5;
        ctx.fillStyle = row === run.row ? colors.gold : isBeatRow ? mix(colors.gold, colors.paper, 0.48) : mix(colors.ink, colors.paper, 0.72);
        ctx.fillRect(0, ty - 1.5, wMark, 3);
        ctx.fillRect(W - wMark, ty - 1.5, wMark, 3);
      }
    }
    if (run?.glimpse > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.glimpse) * 0.85;
      const ways = run.ways.filter((way) => way.y <= run.y).sort((a, b) => b.y - a.y);
      ctx.strokeStyle = 'rgba(77, 159, 151, 0.55)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(run.x, run.y - 30);
      ways.forEach((way) => ctx.lineTo(laneX(way.lane), way.y));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244, 178, 92, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 7]);
      ctx.stroke();
      ctx.restore();
    }
    if (run?.lit > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.lit);
      run.ways.forEach((way) => {
        if (way.y > run.y) return;
        const x = laneX(way.lane);
        const flicker = reduced?.matches ? 0 : Math.sin(run.t * 11 + way.y) * 1.2;
        const g = ctx.createRadialGradient(x, way.y, 1, x, way.y, 14);
        g.addColorStop(0, 'rgba(255, 196, 92, 0.75)');
        g.addColorStop(1, 'rgba(255, 196, 92, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, way.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f6b24a';
        ctx.beginPath(); ctx.ellipse(x, way.y - 2, 2.2, 3.6 + flicker, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    }
  };

  const drawAim = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    if (!run || getState() !== 'running') return;
    const from = throwFrom();
    const pointerActive = Boolean(run.pointer?.active && run.pointer.y < from.y - 10);
    const a = pointerActive ? clamp(Math.atan2(run.pointer.x - from.x, from.y - run.pointer.y), -AIM_MAX * 1.4, AIM_MAX * 1.4) : run.aim.a;
    const hit = sighted(a);
    const trace = traceTrajectory(a);
    const trick = trace.bounces > 0 || trace.curved || trace.ramped;
    const off = trace.off != null ? trace.off : hit?.off;
    const held = poised();
    const trueLine = off != null && off < (held ? 10 : 7);
    const closeLine = off != null && !trueLine && off < (held ? 16 : 12);
    const gold = Boolean(trueLine || trick || trace.label === 'SHARE SLICE');
    const near = closeLine && !gold;
    const ready = run.sliceReady >= 1;
    const word = trueLine && trace.leftHang ? 'HUNG TRUE'
      : trueLine && held ? 'HELD TRUE'
      : trueLine ? 'TRUE'
      : closeLine ? 'NEAR'
      : (trace.label || 'THROW');
    ctx.save();
    ctx.strokeStyle = gold ? '#f2c14e' : near ? colors.accent : mix(colors.ink, colors.paper, ready ? 0.35 : 0.7);
    ctx.lineWidth = gold ? 2.4 : 1.5;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    if (pointerActive || trick || trace.hit) {
      trace.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x + Math.sin(a) * 14, pt.y - Math.cos(a) * 14);
        else ctx.lineTo(pt.x, pt.y);
      });
    } else {
      ctx.moveTo(from.x + Math.sin(a) * 14, from.y - Math.cos(a) * 14);
      const len = hit ? Math.min(hit.along, 150) : 110;
      ctx.lineTo(from.x + Math.sin(a) * len, from.y - Math.cos(a) * len);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if (pointerActive || trick) {
      trace.points.forEach((pt) => {
        if (!pt.bank && !pt.curve && !pt.ramp) return;
        ctx.strokeStyle = pt.curve ? '#f0c97a' : pt.ramp ? '#e0a95a' : '#96cdd2';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2); ctx.stroke();
      });
    }
    const targetThing = trace.hit || hit?.thing;
    if (targetThing) {
      ctx.strokeStyle = gold ? '#f2c14e' : near ? colors.accent : mix(colors.ink, colors.paper, 0.45);
      ctx.lineWidth = gold ? 3 : near ? 2 : 1.5;
      if (!gold && !near) ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(targetThing.x, targetThing.y - 6, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (trueLine) {
        ctx.strokeStyle = '#f2c14e';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(targetThing.x, targetThing.y - 6, 8, 0, Math.PI * 2); ctx.stroke();
      }
      if (gold || near || trick) {
        ctx.fillStyle = gold ? '#f2c14e' : colors.accent;
        ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ready ? word : '…', targetThing.x, targetThing.y - 34);
      }
    }
    ctx.restore();
  };

  const drawDust = () => {
    const ctx = getCtx();
    const run = getRun();
    if (!run || run.dust < 0.02) return;
    ctx.save();
    ctx.fillStyle = `rgba(250, 246, 236, ${run.dust * 0.2})`;
    fillFrame();
    ctx.fillStyle = `rgba(255, 253, 246, ${0.35 + run.dust * 0.5})`;
    const drift = reduced?.matches ? 0 : run.t;
    for (let i = 0; i < Math.round(run.dust * 36); i += 1) {
      const mx = (i * 97 + Math.sin(drift * 0.7 + i) * 24 + drift * 9) % W;
      const my = (i * 61 + drift * (14 + (i % 5) * 4)) % H;
      ctx.beginPath(); ctx.arc((mx + W) % W, my, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    if (run.boon || run.bane) {
      const g = ctx.createRadialGradient(W / 2, PRESENCE_Y, 10, W / 2, PRESENCE_Y, 70);
      g.addColorStop(0, `rgba(255, 244, 214, ${run.dust * 0.32})`);
      g.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(W / 2, PRESENCE_Y, 70, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const drawRules = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    if (!run?.rules.length) return;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = colors.gold;
    ctx.fillStyle = colors.gold;
    ctx.lineWidth = 1.5;
    ctx.font = '700 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    run.rules.forEach((rule) => {
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(8, rule.y); ctx.lineTo(W / 2 - 14, rule.y);
      ctx.moveTo(W / 2 + 14, rule.y); ctx.lineTo(W - 8, rule.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('§', W / 2, rule.y + 1);
    });
    ctx.restore();
  };

  const drawRain = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    if (!run?.drops.length) return;
    ctx.strokeStyle = mix(colors.accent, colors.paper, 0.4);
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.beginPath();
    run.drops.forEach((drop) => {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + 12);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const pill = (text, x, y, align, color) => {
    const ctx = getCtx();
    const colors = getColors();
    const ink = color ?? colors.ink;
    ctx.font = '700 12px "JetBrainsMono", ui-monospace, monospace';
    const w = ctx.measureText(text).width + 14;
    const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    ctx.fillStyle = mix(colors.paper, 'rgb(255, 255, 255)', 0.3).replace('rgb(', 'rgba(').replace(')', ', 0.86)');
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.75);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, y - 12, w, 19, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + 7, y - 2);
    ctx.textBaseline = 'alphabetic';
  };

  const drawShelves = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    if (!run?.shelfV || !shelvesOn()) return;
    const cx = W - 26;
    const cy = 58;
    ctx.save();
    SHELVES.forEach((shelf, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / SHELVES.length;
      const len = 5 + (run.shelfV[shelf] || 0) * 26;
      const done = (run.chains?.at?.[shelf] || 0) / Math.max(1, CHAINS[shelf]?.length || 1);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(len / 2, 0, len / 2, 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = SHELF_INK[shelf];
      ctx.globalAlpha = run.chains?.complete?.includes(shelf) ? 0.95 : 0.35 + done * 0.4;
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 0.8 + done * 1.6;
      ctx.strokeStyle = SHELF_INK[shelf];
      ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = colors.paper;
    ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  const drawHud = () => {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const TUNE = getTune();
    if (!run) return;
    drawShelves();
    pill(`${cobbles()} cobbles`, 8, 20, 'left');
    pill(`best ${Math.max(record.best, 0)}`, W - 8, 20, 'right', colors.muted);
    if (run.waps) pill(`WAP ×${run.waps}`, W / 2, 20, 'center', '#c0392b');
    const n = TOTAL_CHAPTERS;
    const span = 236;
    const x0 = W / 2 - span / 2;
    const y = 42;
    const at = run.chapter - 1;
    const step = span / (n - 1);
    ctx.save();
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + span, y); ctx.stroke();
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + step * Math.min(n - 1, at + progress()), y); ctx.stroke();
    for (let i = 0; i < n; i += 1) {
      ctx.fillStyle = i < at ? colors.gold : i === at ? colors.ink : mix(colors.ink, colors.paper, 0.6);
      ctx.beginPath(); ctx.arc(x0 + step * i, y, i === at ? 4.5 : 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.ink;
    ctx.fillText(`${run.chapter}${run.lap ? ` · lap ${run.lap + 1}` : ''}`, x0 + step * at, y + 15);
    ctx.restore();
    const activeRecipe = recipeIdNow();
    const gifts = [
      poised() && 'poised',
      activeRecipe !== 'warm' && activeRecipe !== 'thin' && RECIPES[activeRecipe]?.short?.toLowerCase(),
      run.jazzPocketT > 0 && 'pocket',
      run.roomPantryT > 0 && 'pantry',
      run.lit > 0 && `lit ${Math.ceil(run.lit)}`,
      run.echoes > 0 && `echoes ${Math.ceil(run.echoes)}`,
      run.lag > 0 && `slow ${Math.ceil(run.lag)}`,
      run.unkept > 0 && `unkept ${Math.ceil(run.unkept)}`,
      run.trueAim > 0 && `true aim ${Math.ceil(run.trueAim)}`,
      run.glimpse > 0 && 'a glimpse',
      run.row > 0 && TUNE.ahead_bonus > 0 && `ahead ×${(1 + run.row * TUNE.ahead_bonus).toFixed(2)}`,
      run.fed > 0 && `fed ${Math.ceil(run.fed)}`,
      run.frill > 0 && `soft ×${run.frill}`,
      run.tin > 0 && `half again ×${run.tin}`,
      run.dust > 0.25 && 'flour in the air',
      (run.warm > 0 || run.shield) && 'warm'
    ].filter(Boolean);
    if (gifts.length) pill(gifts.join(' · '), W / 2, 76, 'center', colors.accent);
    if (run.tally?.mawSeen) pill(`pie ${fmtPts(run.tally.wap)} · mimes ${fmtPts(run.tally.maw)}${run.tally.held ? ' · theirs' : ''}`, 8, 62, 'left', mawAhead() ? '#7a3f9a' : colors.accent);
    ctx.save();
    ctx.strokeStyle = run.sliceReady >= 1 ? colors.gold : mix(colors.ink, colors.paper, 0.6);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(run.x + 30, run.y - 18, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * run.sliceReady); ctx.stroke();
    const tilt = clamp(run.wobble, 0, 1);
    if (tilt > 0.04) {
      ctx.strokeStyle = mix('rgb(226, 170, 60)', 'rgb(200, 50, 36)', tilt);
      ctx.lineWidth = tilt > 0.75 ? 3.5 : 2.5;
      ctx.beginPath(); ctx.arc(run.x - 30, run.y - 18, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tilt); ctx.stroke();
    }
    ctx.restore();
  };

  const drawForetold = () => {
    const ctx = getCtx();
    const run = getRun();
    if (!run?.prophecies.length) return;
    ctx.save();
    run.prophecies.forEach((p) => {
      const x = laneX(p.lane);
      const k = clamp(p.t / p.dur, 0, 1);
      const ink = p.kindly ? 'rgba(214, 150, 52, 0.95)' : 'rgba(96, 48, 128, 0.95)';
      ctx.globalAlpha = 0.25 + (1 - k) * 0.25;
      ctx.fillStyle = p.kindly ? 'rgba(244, 178, 92, 0.18)' : 'rgba(96, 48, 128, 0.16)';
      ctx.fillRect(x - LANE_W / 2 + 3, 0, LANE_W - 6, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.kindly ? 'rgba(255, 246, 228, 0.95)' : 'rgba(34, 20, 44, 0.92)';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x - LANE_W / 2 + 4, 26, LANE_W - 8, 30, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.kindly ? '#6a4416' : '#e9dcf2';
      ctx.font = '700 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      const words = FORETOLD[p.what].split(' ');
      const half = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0, half).join(' '), x, 38);
      ctx.fillText(words.slice(half).join(' '), x, 48);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, 64, 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
    });
    ctx.restore();
  };

  function drawDepthGuide() {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const k = longK();
    if (!k || !run) return;
    ctx.save();
    ctx.globalAlpha = 0.22 * k;
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.35);
    ctx.lineWidth = 1;
    const vx = W / 2;
    const vy = 30;
    for (let lane = 0; lane <= LANES; lane += 1) {
      ctx.beginPath(); ctx.moveTo(lane * LANE_W, H - 8); ctx.lineTo(vx + (lane * LANE_W - vx) * 0.18, vy); ctx.stroke();
    }
    ctx.restore();
  }

  function drawDimensionFlash() {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const d = run?.dimFlash;
    if (!d || getState() !== 'running') return;
    const fade = clamp(1 - d.t / 2.4, 0, 1);
    const emerge = clamp(d.t / 0.2, 0, 1);
    const rise = reduced?.matches ? 0 : d.t * 28;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade * emerge);
    ctx.lineCap = 'round';
    ctx.textAlign = 'center';
    ctx.font = '800 11px "JetBrainsMono", ui-monospace, monospace';
    if (d.id === 'height') {
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        const x = run.x - 18 + i * 12;
        const y0 = run.y - 24 - rise;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 - (18 + i * 10)); ctx.stroke();
      }
      ctx.fillStyle = '#2c8b86';
      ctx.fillText('HEIGHT', run.x, run.y - 96 - rise);
    } else if (d.id === 'games') {
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 3; i += 1) {
        ctx.globalAlpha = Math.max(0, fade * emerge) * (1 - i * 0.12);
        ctx.beginPath(); ctx.arc(W / 2, 148, 10 + i * 14 + (reduced?.matches ? 0 : d.t * 16), -0.7, 0.7); ctx.stroke();
      }
      ctx.globalAlpha = Math.max(0, fade * emerge);
      ctx.fillStyle = '#a8782a';
      ctx.fillText('GAMES', W / 2, 118);
    } else {
      ctx.strokeStyle = mix(colors.ink, colors.paper, 0.25);
      ctx.lineWidth = 1.2;
      const vx = W / 2;
      const vy = 34;
      for (let lane = 0; lane <= LANES; lane += 1) {
        ctx.beginPath(); ctx.moveTo(lane * LANE_W, run.y); ctx.lineTo(vx + (lane * LANE_W - vx) * 0.12, vy); ctx.stroke();
      }
      ctx.fillStyle = colors.ink;
      ctx.fillText('DEPTH', W / 2, 26);
    }
    ctx.restore();
  }

  function drawLandQuality() {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    if (!run || getState() !== 'running' || record.view.zen) return;
    const motifMode = setting('motifCues');
    const q = record.sound ? landQuality() : { stage: 0, bed: false };
    const stage = q.stage || (q.bed ? 1 : 0);
    const m = run.motifState;
    const activeTension = motifMode !== 'off' && m?.tension;
    const pocketLive = (run.jazzPocketT || 0) > 0 || (m?.resolvedT || 0) > 0;
    const pantryLive = (run.roomPantryT || 0) > 0;
    if (!stage && !activeTension && !pocketLive && !pantryLive) return;
    const lift = run.jumpT > 0 ? jumpLift() : 0;
    const x = Math.max(8, run.x - 50);
    const y = run.y - 24 - lift;
    const baseLabel = stage ? (q.bed ? 'ROOM' : stage === 1 ? 'FIFTH' : stage === 2 ? 'THIRD' : 'COLOUR') : '';
    const tensionCue = activeTension
      ? (m.tension === 'b9' ? 'b9 HOP' : m.tension === '#11' ? '#11 STEP' : 'sus4 CATCH')
      : '';
    const suffix = pocketLive ? 'POCKET' : pantryLive ? 'PANTRY' : tensionCue;
    const label = baseLabel && suffix ? `${baseLabel} · ${suffix}` : baseLabel || suffix;
    const highlight = stage === 3 || pocketLive;
    ctx.save();
    ctx.globalAlpha = q.bed && !activeTension && !pocketLive ? 0.8 : 0.95;
    ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < 3; i += 1) {
      const open = q.bed ? i < 2 : stage === 1 ? i < 2 : stage >= 2 || pocketLive;
      const colour = (stage === 3 || pocketLive) && i === 2;
      ctx.fillStyle = colour ? '#f2c14e' : activeTension && i === 2 ? '#c46a40' : open ? colors.accent : mix(colors.ink, colors.paper, 0.72);
      ctx.fillRect(x, y - i * 5, i === 2 ? 12 : i === 1 ? 8 : 10, open ? 2.4 : 1.1);
    }
    if (stage === 3 || pocketLive) {
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x + 6, y - 16, 3.4, 0, Math.PI * 2); ctx.stroke();
    }
    const tw = ctx.measureText(label).width;
    const right = x + Math.max(12, tw + 8);
    ctx.fillStyle = highlight ? 'rgba(242, 193, 78, 0.96)' : activeTension ? 'rgba(252, 240, 230, 0.96)' : 'rgba(255, 252, 245, 0.94)';
    ctx.beginPath(); ctx.roundRect(right - tw - 8, y + 5, tw + 8, 13, 3); ctx.fill();
    ctx.fillStyle = highlight ? '#6a4a16' : activeTension ? '#8a391e' : colors.accent;
    ctx.textAlign = 'right';
    ctx.fillText(label, right - 4, y + 15);
    ctx.restore();
  }

  function drawCarrierTune() {
    const ctx = getCtx();
    const run = getRun();
    if (!voiceOn() || !run?.carrier) return;
    const tune = CARRIER_TUNES[run.carrier.id] || CARRIER_TUNES.figure;
    if (!reduced?.matches) {
      ctx.save();
      ctx.globalAlpha = 0.16 + Math.sin(run.t * 2) * 0.05;
      ctx.fillStyle = tune.color;
      ctx.beginPath(); ctx.ellipse(run.x, run.y + 14, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (const mark of run.marks || []) {
      const k = reduced?.matches ? 0.7 : Math.max(0, 1 - mark.t / mark.life);
      if (k <= 0) continue;
      ctx.save();
      ctx.globalAlpha = k * 0.9;
      ctx.lineWidth = 1.4;
      if (mark.kind === 'warmth') {
        ctx.strokeStyle = '#f0ad58';
        for (let i = 0; i < (mark.rings || 1); i += 1) {
          const grow = (1 - k) * (16 + i * 9);
          ctx.beginPath(); ctx.ellipse(mark.x, mark.y, 8 + grow, 11 + grow * 0.75, 0, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (mark.kind === 'digits') {
        ctx.strokeStyle = '#f4e2b0';
        ctx.beginPath();
        for (let i = 0; i < 12; i += 1) {
          const a = i * 0.9 + mark.t * 2;
          const r = 6 + (i % 4) * 6 * k;
          const px = mark.x + Math.cos(a) * r;
          const py = mark.y + Math.sin(a) * r * 0.55;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      } else if (mark.kind === 'spiral') {
        ctx.strokeStyle = '#e7c56a';
        ctx.beginPath();
        for (let i = 0; i < 16; i += 1) {
          const a = i * 2.399 + mark.t;
          const r = 3 + i * 1.5 * (0.4 + k);
          const px = mark.x + Math.cos(a) * r;
          const py = mark.y + Math.sin(a) * r * 0.62;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      } else if (mark.kind === 'voice') {
        ctx.fillStyle = mark.color || tune.color;
        for (let i = 0; i < 3; i += 1) {
          ctx.globalAlpha = k * (0.85 - i * 0.2);
          ctx.beginPath(); ctx.arc(mark.x + (i - 1) * 7, mark.y - 26 - (1 - k) * (8 + i * 7), 2.2, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function warpLongView() {
    const k = longK();
    if (!k) return;
    const canvas = getCanvas();
    const ctx = getCtx();
    const colors = getColors();
    const board = getBoard();
    const cw = canvas.width;
    const ch = canvas.height;
    warpCanvas = warpCanvas || document.createElement('canvas');
    if (warpCanvas.width !== cw || warpCanvas.height !== ch) { warpCanvas.width = cw; warpCanvas.height = ch; }
    const off = warpCanvas.getContext('2d');
    off.clearRect(0, 0, cw, ch);
    off.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, cw, ch);
    const strip = Math.max(2, Math.round(ch / 140));
    for (let y = 0; y < ch; y += strip) {
      const s = viewScale(board.y0 + (y / ch) * board.h);
      const dw = cw * s;
      ctx.drawImage(warpCanvas, 0, y, cw, strip, (cw - dw) / 2, y, dw, strip);
    }
    const haze = ctx.createLinearGradient(0, 0, 0, ch * 0.35);
    haze.addColorStop(0, `rgba(255, 246, 228, ${0.45 * k})`);
    haze.addColorStop(1, 'rgba(255, 246, 228, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, cw, ch * 0.35);
    ctx.restore();
  }

  function drawMiniBanner() {
    const ctx = getCtx();
    const run = getRun();
    const m = run?.mini;
    if (!m) return;
    const left = Math.max(0, 1 - m.t / m.dur);
    ctx.save();
    ctx.fillStyle = 'rgba(20, 18, 24, 0.82)';
    ctx.beginPath(); ctx.roundRect(W / 2 - 92, 96, 184, 30, 8); ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.font = '800 11px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${MINIS[m.id].title.toUpperCase()} · ${m.score}`, W / 2, 110);
    ctx.fillStyle = 'rgba(255, 227, 107, 0.25)';
    ctx.fillRect(W / 2 - 80, 116, 160, 4);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(W / 2 - 80, 116, 160 * left, 4);
    ctx.restore();
  }

  function drawHopGauge() {
    const ctx = getCtx();
    const run = getRun();
    const colors = getColors();
    const TUNE = getTune();
    if (!run || getState() !== 'running') return;
    const windowFull = TUNE.hop_window * (run.carrier.id === 'clerk' ? 1.4 : 1);
    const windowLeft = run.jumpT <= 0 && run.lastHopGood ? Math.max(0, windowFull - (run.t - (run.lastLand ?? -9))) : 0;
    if (!(run.jumpT > 0 || windowLeft > 0 || run.hopWant)) return;
    const lift = jumpLift();
    const max = TUNE.hop_lift * (1 + 2 * TUNE.hop_chain);
    const x = run.x + 26;
    const base = run.y + 14;
    const h = 44;
    const at = (v) => base - (v / max) * h;
    const hanging = inHang();
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.stroke();
    ctx.fillStyle = hanging || run.highHop ? '#f2c14e' : colors.accent;
    ctx.fillRect(x - 2, at(lift), 4, Math.max(0, base - at(lift)));
    ctx.font = '700 7px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    [[9, 'LOW ⤒'], [TUNE.hop_lift * (1 + 2 * TUNE.hop_chain) * 0.92, 'HIGH ⤒⤒']].forEach(([v, label]) => {
      ctx.fillStyle = lift >= v ? '#2c8b86' : mix(colors.ink, colors.paper, 0.4);
      ctx.fillRect(x - 4, at(v), 8, 1);
      ctx.fillText(label, x + 6, at(v) + 2.5);
    });
    if (hanging) {
      ctx.fillStyle = '#a8782a';
      ctx.fillText('HANG', x + 6, at(lift) - 4);
    } else if (run.hopWant) {
      ctx.fillStyle = colors.accent;
      ctx.fillText('AGAIN', x + 6, base - 4);
    }
    if (windowLeft > 0 && run.jumpT <= 0) {
      ctx.fillStyle = colors.accent;
      ctx.fillRect(x - 2, base + 4, 18 * (windowLeft / windowFull), 2);
    }
    const chain = run.hopChain || 0;
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < chain ? (chain >= 2 ? '#f2c14e' : colors.accent) : mix(colors.ink, colors.paper, 0.75);
      ctx.beginPath(); ctx.arc(x + i * 6, base + 12, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  const drawWhimsy = () => {
    const ctx = getCtx();
    const run = getRun();
    if (!run) return;
    run.bits.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - b.t / 1.1);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      if (b.kind === 'stars') {
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) { const r = i % 2 ? 2 : 5; const a = (i / 10) * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
      } else if (b.kind === 'feathers') {
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (b.kind === 'glass') {
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 3); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill();
      } else if (b.kind === 'juice' || b.kind === 'flour') {
        ctx.beginPath(); ctx.arc(0, 0, b.kind === 'flour' ? 4 + b.t * 6 : 3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-3, -2, 6, 4);
      }
      ctx.restore();
    });
    run.pops.forEach((p) => {
      const settle = Math.exp(-p.t * 9) * Math.cos(p.t * 26);
      const s = p.size * (1 + 0.55 * settle);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (1.1 - p.t) * 2.2));
      ctx.translate(p.x, p.y - p.t * 26);
      ctx.rotate(p.spin * (1 - Math.min(1, p.t * 3)));
      ctx.scale(s, s);
      ctx.font = '900 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1d1d22';
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.hurt ? '#e8553f' : '#ffe36b';
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
  };

  return {
    drawCorvids,
    drawBands,
    drawPlaceLights,
    drawScene,
    drawAim,
    drawDust,
    drawRules,
    drawRain,
    pill,
    drawShelves,
    drawHud,
    drawForetold,
    drawDepthGuide,
    drawDimensionFlash,
    drawLandQuality,
    drawCarrierTune,
    warpLongView,
    drawMiniBanner,
    drawHopGauge,
    drawWhimsy
  };
}
