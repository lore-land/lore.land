/**
 * pie-heights.mjs — the lane, seen from the side: how high everything stands, and what a hop does.
 *
 * The lanes are drawn from above, so height (the implicit z) is the one thing a player can't see.
 * This panel turns the carrier's own lane on its side: time runs left to right (the carrier at the
 * left edge, what is coming over the next couple of seconds to the right), and height runs up:
 *
 *   air        pigeons, wasps: over the hat; no hop helps, step aside
 *   body       posts, panes, people: too tall; the lighter ones (⤒⤒) only a high hop clears
 *   low        stones, snails, spools, a fallen banner: a hop clears them (⤒)
 *   underfoot  holes, ditches, puddles, frost, flour: a hop passes over them too
 *
 * Over it, the arc of a hop taken now (higher if it would chain), so whatever falls under the arc
 * is marked ✓, and the next thing worth hopping says when: "hop in 0.3 s". The arc hangs flat at
 * the top; a clear there is in time. The chain is pips: land a clean hop and hop again inside the
 * window, and the third is a high hop.
 *
 * The game owns the rules; it hands this module a snapshot each frame (peek()), so the panel only
 * ever shows what the game will actually do.
 */

import { hopCurve, HOP_HANG } from './pie-world.mjs?v=2026_11_13.B';

let HORIZON = 1.8;        // seconds of lane shown ahead (configurable)
const GUTTER = 64;        // the band labels
const GROUND = 100;       // the ground line, in panel units (the panel is 360 × 116)
const PW = 300;
const PH = 112;
const INK = Object.freeze({ hop: '#2f8a4f', high: '#c98a1e', none: '#c0392b', air: '#7a4f8e', friend: '#2c6f69' });

/** What a hop does about a thing: 'hop' (any hop clears it), 'high' (only a high hop), 'none', 'air', or 'friend'. */
export function clearance(kind, { Z, LOW, HIGH_CLEARS, harmful }) {
  if (!harmful) return 'friend';
  const z = Z[kind] ?? 2;
  if (z >= 3) return 'air';
  if (LOW.has(kind)) return 'hop';
  if (HIGH_CLEARS.has(kind)) return 'high';
  return 'none';
}

/* What the panel shows: each part can be turned off, and how far ahead it looks (1.2, 1.8 or 2.4 s). */
export const HEIGHTS_DEFAULTS = Object.freeze({ marks: true, arc: true, words: true, bands: true, chain: true, meanwhile: true, horizon: 1.8 });

export function createHeights({ panel, config = () => HEIGHTS_DEFAULTS }) {
  const canvas = panel?.querySelector('canvas');
  const out = panel?.querySelector('[data-pie-heights-say]');
  const ctx = canvas?.getContext('2d');
  let lastSaid = '';
  let sayAt = 0;

  const fit = () => {
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round((canvas.getBoundingClientRect().width || PW) * ratio);
    const h = Math.round(w * (PH / PW));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };
  window.addEventListener('resize', fit);

  const xAt = (t) => GUTTER + (Math.max(0, t) / HORIZON) * (PW - GUTTER - 10);

  /* Feet height (panel units) for a lift in game px: a plain hop peaks over the low band, a high hop
   * over the lighter tall things, never over the heavy ones, which is the rule drawn to scale. */
  const feetY = (lift, high) => GROUND - lift * (high ? 1.13 : 1);

  function draw(snap, colors) {
    if (!ctx || !panel || panel.hidden) return;
    const cfg = { ...HEIGHTS_DEFAULTS, ...(config() || {}) };
    HORIZON = cfg.horizon || 1.8;
    if (!canvas.width) fit();
    ctx.setTransform(canvas.width / PW, 0, 0, canvas.height / PH, 0, 0);
    ctx.clearRect(0, 0, PW, PH);
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, PW, PH);
    const muted = colors.muted;
    ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    // The bands, each labelled with what a hop does about it.
    (cfg.bands ? [
      ['air', 'step aside', 27, INK.air],
      ['body', '⤒⤒ high hop', 60, INK.high],
      ['low', '⤒ hop', 88, INK.hop],
      ['underfoot', '⤒ hop', GROUND + 8, INK.hop]
    ] : []).forEach(([label, note, y, ink]) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.ink;
      ctx.fillText(label.toUpperCase(), 4, y - 4);
      ctx.fillStyle = ink;
      ctx.font = '600 8px "JetBrainsMono", ui-monospace, monospace';
      ctx.fillText(note, 4, y + 5);
      ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
    });
    ctx.strokeStyle = muted;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([2, 4]);
    [42, 74].forEach((y) => { ctx.beginPath(); ctx.moveTo(GUTTER - 4, y); ctx.lineTo(PW - 6, y); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(GUTTER - 4, GROUND); ctx.lineTo(PW - 6, GROUND); ctx.stroke();
    // Seconds along the ground.
    ctx.fillStyle = muted;
    ctx.textAlign = 'center';
    ctx.font = '600 8px "JetBrainsMono", ui-monospace, monospace';
    [0.5, 1, 1.5].forEach((s) => { ctx.fillText(`${s}s`, xAt(s), GROUND + 9); ctx.fillRect(xAt(s), GROUND - 2, 1, 4); });

    if (!snap) {
      say('Play, and the lane you stand in is drawn here from the side: how high each thing stands, and what a hop does about it.');
      return;
    }
    const { things, lift, highHop, jumpT, jumpDur, hopLift, hopChainStep, chain, windowLeft, windowFull, canHop, nextChain } = snap;

    // Things in the lane, by when they arrive and how high they stand.
    const ahead = things.filter((t) => t.eta > -0.15 && t.eta < HORIZON).sort((a, b) => a.eta - b.eta);
    // The arc of a hop taken now (or the one in the air), and what falls under it.
    const nextPower = 1 + nextChain * hopChainStep;
    const nextHigh = nextChain >= 2;
    const airFrom = 0.08 * jumpDur;
    const airTo = 0.92 * jumpDur;
    const sweetFrom = HOP_HANG[0] * jumpDur;   // in time: cleared in the hang, the flat top
    const sweetTo = HOP_HANG[1] * jumpDur;
    const remaining = jumpT > 0 ? jumpT : 0;
    const inAirNow = jumpT > 0;
    ahead.forEach((t) => {
      if (t.cls === 'hop' || t.cls === 'high') {
        if (inAirNow) {
          const elapsed = jumpDur - remaining;
          const at = elapsed + t.eta;   // where in this hop it arrives
          t.under = at >= airFrom && at <= airTo && (t.cls === 'hop' || highHop);
          t.inTime = t.under && at >= sweetFrom && at <= sweetTo;
        } else {
          t.under = canHop && t.eta >= airFrom && t.eta <= airTo && (t.cls === 'hop' || nextHigh);
          t.inTime = t.under && t.eta >= sweetFrom && t.eta <= sweetTo;
        }
      }
    });
    // The arc.
    ctx.save();
    if (!cfg.arc) ctx.globalAlpha = 0;
    ctx.strokeStyle = inAirNow ? colors.accent : colors.gold;
    ctx.lineWidth = inAirNow ? 2 : 1.5;
    if (!inAirNow) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 24; i += 1) {
      const tau = (i / 24) * jumpDur;
      const p = tau / jumpDur;
      const h = hopCurve(p) * hopLift * (inAirNow ? snap.power : nextPower);
      const x = xAt(inAirNow ? tau - (jumpDur - remaining) : tau);
      const y = feetY(h, inAirNow ? highHop : nextHigh);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // The hang: the flat top of the hop. Clear something there and it is in time.
    ctx.strokeStyle = '#d9a23a';
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    const hangSteps = 8;
    for (let i = 0; i <= hangSteps; i += 1) {
      const p = HOP_HANG[0] + (HOP_HANG[1] - HOP_HANG[0]) * (i / hangSteps);
      const tau = p * jumpDur;
      const h = hopCurve(p) * hopLift * (inAirNow ? snap.power : nextPower);
      const x = xAt(inAirNow ? tau - (jumpDur - remaining) : tau);
      const y = feetY(h, inAirNow ? highHop : nextHigh);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    const phase = inAirNow ? 1 - remaining / jumpDur : 0;
    const hanging = phase >= HOP_HANG[0] && phase <= HOP_HANG[1];
    ctx.fillStyle = hanging ? '#d9a23a' : inAirNow ? colors.accent : colors.gold;
    ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    const label = inAirNow ? (hanging ? (highHop ? 'HIGH HOP, IN THE HANG' : 'IN THE HANG') : (highHop ? 'HIGH HOP, IN THE AIR' : 'IN THE AIR')) : !canHop ? 'LANDING…' : nextHigh ? 'IF YOU HOP NOW: A HIGH HOP' : nextChain ? 'IF YOU HOP NOW: HIGHER' : 'IF YOU HOP NOW';
    ctx.fillText(label, xAt(0) + 4, feetY(hopLift * nextPower, nextHigh) - 7);
    ctx.restore();

    // The things themselves.
    let firstHint = null;
    ahead.forEach((t) => {
      const x = xAt(t.eta);
      const ink = INK[t.cls] || muted;
      let top = 76;
      let bottom = GROUND;
      if (t.cls === 'air') { top = 18; bottom = 36; }
      else if (t.z === 0) { top = GROUND - 3; bottom = GROUND + 3; }
      else if (t.cls === 'high') { top = 60; }
      else if (t.cls === 'none') { top = 44; }
      else if (t.cls === 'friend') { top = t.z >= 2 ? 56 : 80; }
      const w = t.wide ? 22 : 13;
      ctx.globalAlpha = t.cls === 'friend' ? 0.45 : 1;
      ctx.fillStyle = `${ink}2e`;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.4;
      if (t.z === 0 && t.cls !== 'friend') ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.roundRect(x - w / 2, top, w, Math.max(4, bottom - top), 3); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.font = '600 8px "JetBrainsMono", ui-monospace, monospace';
      ctx.fillText(t.name.slice(0, 11), x, top - 5);
      if (t.under && cfg.arc) {
        ctx.font = '700 11px "JetBrainsMono", ui-monospace, monospace';
        ctx.fillStyle = t.inTime ? '#d9a23a' : INK.hop;
        ctx.fillText(t.inTime ? '✓♪' : '✓', x, top - 15);
      }
      ctx.globalAlpha = 1;
      if (!firstHint && (t.cls === 'hop' || t.cls === 'high' || t.cls === 'none' || t.cls === 'air') && t.eta > 0) firstHint = t;
    });

    // The carrier, at the left edge, at their height.
    const cx = xAt(0);
    const fy = feetY(lift, highHop);
    ctx.save();
    if (lift > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath(); ctx.ellipse(cx, GROUND, 8, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = colors.ink;
    ctx.fillStyle = colors.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, fy - 30, 4.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(cx - 4, fy - 25, 8, 13);
    ctx.beginPath(); ctx.moveTo(cx - 2, fy - 12); ctx.lineTo(cx - 3, fy); ctx.moveTo(cx + 2, fy - 12); ctx.lineTo(cx + 3, fy); ctx.stroke();
    ctx.fillStyle = colors.gold;
    ctx.beginPath(); ctx.ellipse(cx, fy - 18, 8, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.ink;
    ctx.fillRect(cx - 5, fy - 38, 10, 3);   // the hat
    ctx.restore();

    // The chain: three pips, and the window to keep it.
    const px = GUTTER + 30;
    if (cfg.chain) {   // top-left: the far corner belongs to the meanwhile panel
    ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.ink;
    ctx.fillText('CHAIN', px - 30, 9);
    for (let i = 0; i < 3; i += 1) {
      const lit = i < chain + (inAirNow ? 1 : 0);
      ctx.globalAlpha = lit ? 1 : 0.3;
      ctx.fillStyle = lit ? (i === 2 ? INK.high : INK.hop) : muted;
      ctx.beginPath(); ctx.arc(px + i * 11, 9, 3.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK.high;
    ctx.fillText('⤒⤒', px + 28, 9);
    if (windowLeft > 0 && windowFull > 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = muted;
      ctx.fillRect(px - 4, 15, 38, 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = INK.hop;
      ctx.fillRect(px - 4, 15, 38 * Math.min(1, windowLeft / windowFull), 2);
    }
    }

    // In words, a few times a second: what is next, and what to do about it.
    const now = performance.now();
    if (now - sayAt > 280) {
      sayAt = now;
      say(cfg.words ? sentence(firstHint, { inAirNow, highHop, canHop, nextHigh, windowLeft, chain, airFrom, airTo, jumpDur }) : 'The lane from the side.');
    }
  }

  function sentence(t, s) {
    const chainWords = s.windowLeft > 0 ? ` Hop again now to chain${s.chain >= 1 ? ': the next is a high hop' : ''}.` : '';
    if (!t) return `Nothing in your lane for the next ${HORIZON} s.${chainWords}`;
    const when = `${Math.max(0, t.eta).toFixed(1)} s`;
    if (t.cls === 'air') return `Next: ${t.name}, in the air, in ${when}. No hop helps: step aside.`;
    if (t.cls === 'none') return `Next: ${t.name} in ${when}, too tall to hop. Step aside.`;
    if (t.cls === 'high' && !(s.inAirNow ? s.highHop : s.nextHigh)) return `Next: ${t.name} in ${when}: only a high hop clears it (three clean hops in a row). Otherwise step aside.${chainWords}`;
    if (t.under) return `Next: ${t.name} in ${when}: ${s.inAirNow ? 'you are over it' : 'hop now and you clear it'}${t.inTime ? ', in time' : ''}.`;
    const hopIn = t.eta - s.jumpDur / 2;
    if (hopIn > 0.05) return `Next: ${t.name} in ${when}: a hop clears it. Hop in ${hopIn.toFixed(1)} s.${chainWords}`;
    return `Next: ${t.name} in ${when}: hop now!`;
  }

  function say(text) {
    if (!out || text === lastSaid) return;
    lastSaid = text;
    out.textContent = text;
  }

  return { draw, fit, defaults: HEIGHTS_DEFAULTS };
}
