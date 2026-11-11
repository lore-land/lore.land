/**
 * pie-show.mjs — the show: what just happened in the lanes, in a window of its own.
 *
 * Three ways to watch (record.view.show in pie-game.mjs):
 *   off     the lanes as drawn.
 *   inset   a small window docked beside the caption under the screen, never over the lanes: the
 *           last interaction as a still, captioned with what it was worth; between interactions,
 *           the whole board in small, every thing a dot of what it does.
 *   board   the alternate view, the views swapped: the screen becomes a plain board (every thing a
 *           token by what it does, its height as its edge, a mark where a hop clears it) and the
 *           lanes as drawn shrink into the window.
 * In either mode the reel beside the screen keeps the last few stills, each with its points.
 *
 * The game owns what happened (its feed of interactions and their points); this module only shows it.
 */

const TOKEN = Object.freeze({
  clown: { ink: '#c98a1e', glyph: '◉', says: 'wants pie' },
  mime: { ink: '#7a3f9a', glyph: 'M', says: 'a mime' },
  mimewall: { ink: '#7a3f9a', glyph: '▯', says: 'the wall it mimes' },
  march: { ink: '#7a3f9a', glyph: 'M', says: 'Mimes Against WAP' },
  wonder: { ink: '#1f8a83', glyph: '★', says: 'keep it' },
  egg: { ink: '#d0892e', glyph: '◯', says: 'the warm thing' },
  berry: { ink: '#1f8a83', glyph: '•', says: 'boonberries' },
  baneberry: { ink: '#7a3f9a', glyph: '•', says: 'a baneberry' },
  boneberry: { ink: '#8a6a4a', glyph: '•', says: 'a boneberry' },
  arrow: { ink: '#3d7a3a', glyph: '↑', says: 'points the needle' },
  vane: { ink: '#3d7a3a', glyph: '⚑', says: 'turns the needle' },
  horn: { ink: '#b0602a', glyph: '♪', says: 'starts a game' },
  furrow: { ink: '#c98a3a', glyph: '≈', says: 'warm' },
  pile: { ink: '#b39a63', glyph: '∴', says: 'flour' },
  beaver: { ink: '#7a5a44', glyph: 'B', says: 'slow' },
  switch: { ink: '#2b5aa6', glyph: '⇄', says: 'a switch' },
  puddle: { ink: '#4f86a8', glyph: '~', says: 'slips' },
  frost: { ink: '#4f86a8', glyph: '~', says: 'slips' },
  sack: { ink: '#4f86a8', glyph: '~', says: 'slips' }
});
const HAZARD = { ink: '#c0392b', says: 'knocks' };

/** What a thing looks like on the board: its ink, its glyph, what it does. */
export function tokenOf(kind, knocks = {}) {
  if (TOKEN[kind]) return TOKEN[kind];
  return { ...HAZARD, glyph: String(kind || '?').charAt(0).toUpperCase(), says: knocks[kind] ? 'knocks' : 'in the way' };
}

/** The board's legend, as plain parts, for the panel beside the screen. */
export const LEGEND = Object.freeze([
  ['◉', '#c98a1e', 'wants pie'],
  ['■', '#c0392b', 'knocks'],
  ['⤒', '#3d7a3a', 'a hop clears it'],
  ['⤒⤒', '#3d7a3a', 'a high hop clears it'],
  ['~', '#4f86a8', 'slips'],
  ['M', '#7a3f9a', 'mimes'],
  ['★', '#1f8a83', 'keep it'],
  ['↑', '#3d7a3a', 'points the needle'],
  ['- -', '#888888', 'underfoot'],
  ['◌', '#888888', 'in the air']
]);

const STILL_W = 184;
const STILL_H = 138;
const REEL = 12;   // the reel shows the first six; the carry sheet can look further back

export function createShow({ canvas, insetFigure, reelList, env }) {
  const { W, H, LANES, LANE_W, PLAYER_Y, ROWS, ROW_H, PRESENCE_Y, Z, LOW, HIGH_CLEARS, KNOCKS, reduced } = env;
  const inset = insetFigure?.querySelector('canvas') || null;
  const insetCap = insetFigure?.querySelector('figcaption') || null;
  const ictx = inset?.getContext('2d') || null;
  let mode = 'off';
  let pending = [];
  let stills = [];
  let showing = null;   // { still, until }

  const sizeInset = () => {
    if (!inset) return;
    const box = inset.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(60, Math.round((box.width || 96) * ratio));
    const h = Math.round(w * (H / W));
    if (inset.width !== w || inset.height !== h) { inset.width = w; inset.height = h; }
  };

  const setMode = (next) => {
    mode = ['off', 'inset', 'board'].includes(next) ? next : 'off';
    if (insetFigure) {
      insetFigure.hidden = mode === 'off';
      insetFigure.dataset.mode = mode;
    }
    if (mode !== 'off') requestAnimationFrame(sizeInset);
    return mode;
  };

  /* A still is taken a breath after the interaction, so its pop and its bits are in the picture. */
  const take = (entry, caption) => { if (mode !== 'off') pending.push({ entry, caption, at: performance.now() + 140 }); };

  const capture = ({ entry, caption: captionFor }) => {
    const caption = typeof captionFor === 'function' ? captionFor(entry) : captionFor;
    const still = document.createElement('canvas');
    const ratio = 2;
    still.width = STILL_W * ratio;
    still.height = STILL_H * ratio;
    const c = still.getContext('2d');
    // Through the board's frame (pie-frame.mjs): a filled screen shows more than the world, the world inside it.
    const f = env.frame?.() || { x0: 0, y0: 0, w: W, h: H };
    const sx = canvas.width / f.w;
    const sy = canvas.height / f.h;
    const x0 = Math.max(0, Math.min(W - STILL_W, entry.x - STILL_W / 2));
    const y0 = Math.max(0, Math.min(H - STILL_H, entry.y - STILL_H * 0.62));
    try {
      c.drawImage(canvas, (x0 - f.x0) * sx, (y0 - f.y0) * sy, STILL_W * sx, STILL_H * sy, 0, 0, still.width, still.height);
    } catch { return; }
    const item = { still, caption, entry };
    stills.unshift(item);
    stills = stills.slice(0, REEL);
    showing = { item, until: performance.now() + 2600 };
    paintReel();
  };

  function paintReel() {
    if (!reelList) return;
    reelList.replaceChildren(...stills.slice(0, 6).map(({ still, caption }) => {
      const li = document.createElement('li');
      li.className = 'pie-show-still';
      const frame = document.createElement('canvas');
      frame.width = still.width;
      frame.height = still.height;
      frame.getContext('2d').drawImage(still, 0, 0);
      frame.setAttribute('aria-hidden', 'true');
      const cap = document.createElement('p');
      cap.className = 'pie-show-cap';
      const words = document.createElement('span');
      words.className = 'pie-show-words';
      words.textContent = caption.words;
      cap.append(words);
      caption.chips.forEach((chip) => {
        const b = document.createElement('b');
        b.className = `pie-show-chip is-${chip.cat}`;
        b.textContent = chip.text;
        cap.append(' ', b);
      });
      li.append(frame, cap);
      // Said in a register too, when one is cast (bias × show): under the plain words, never instead.
      if (caption.register) li.append(Object.assign(document.createElement('p'), { className: 'pie-show-register', textContent: caption.register }));
      return li;
    }));
  }

  /* ─── The board: the lanes as a plain board, every thing a token by what it does ─── */
  const roundRect = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function drawBoard(c, run, colors, { mini = false } = {}) {
    if (!run) return;
    const paper = colors.paper;
    const ink = colors.ink;
    c.save();
    c.fillStyle = paper;
    c.fillRect(0, 0, W, H);
    // The lanes, and the rows ahead the carrier may step to.
    c.strokeStyle = mixInk(ink, paper, 0.84);
    c.lineWidth = mini ? 2 : 1;
    for (let i = 1; i < LANES; i += 1) {
      c.beginPath(); c.moveTo(i * LANE_W, 0); c.lineTo(i * LANE_W, H); c.stroke();
    }
    if (!mini) {
      c.setLineDash([2, 6]);
      for (let r = 0; r <= ROWS; r += 1) {
        const y = PLAYER_Y - r * ROW_H;
        c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      }
      c.setLineDash([]);
      c.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
      c.fillStyle = mixInk(ink, paper, 0.55);
      c.textAlign = 'left';
      c.fillText('AHEAD', 4, PLAYER_Y - ROWS * ROW_H - 6);
    }
    // A foretelling holds its lane.
    (run.prophecies || []).forEach((p) => {
      c.fillStyle = p.kindly ? 'rgba(214, 150, 52, 0.14)' : 'rgba(122, 63, 154, 0.14)';
      c.fillRect(p.lane * LANE_W + 2, 0, LANE_W - 4, H);
    });
    // Who holds court overhead.
    if (!mini && (run.boon || run.bane)) {
      const who = run.boon ? 'MR. BOONWAP' : 'MR. BANEWAP';
      c.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
      c.textAlign = 'center';
      c.fillStyle = run.boon ? '#b07a1a' : '#7a3f9a';
      c.fillText(`${who} · OVERHEAD`, W / 2, PRESENCE_Y - 20);
    }
    // Things, ground first, then low, then bodies, then the air.
    const things = [...(run.things || [])].filter((t) => !t.gone).sort((a, b) => (Z[a.kind] ?? 2) - (Z[b.kind] ?? 2));
    things.forEach((t) => drawToken(c, t, colors, mini));
    // Boof, when she passes.
    if (run.boof && Number.isFinite(run.boof.x)) {
      c.fillStyle = '#8a5a2e';
      c.beginPath(); c.arc(run.boof.x, run.boof.y, mini ? 9 : 11, 0, Math.PI * 2); c.fill();
      if (!mini) {
        c.fillStyle = '#fff';
        c.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('BOOF', run.boof.x, run.boof.y);
        c.textBaseline = 'alphabetic';
      }
    }
    // The carrier: the pie, level or not, with the tilt as a ring.
    const air = run.jumpT > 0;
    if (air) {
      c.fillStyle = 'rgba(0, 0, 0, 0.12)';
      c.beginPath(); c.ellipse(run.x, run.y + 12, 14, 5, 0, 0, Math.PI * 2); c.fill();
    }
    const cy = run.y - (air ? 14 : 0);
    c.fillStyle = ink;
    c.beginPath(); c.arc(run.x, cy, mini ? 12 : 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = colors.gold;
    c.beginPath(); c.ellipse(run.x, cy, mini ? 8 : 9, mini ? 5 : 6, 0, 0, Math.PI * 2); c.fill();
    const tilt = Math.max(0, Math.min(1, run.wobble || 0));
    if (tilt > 0.04) {
      c.strokeStyle = tilt > 0.75 ? '#c0392b' : '#d9a23a';
      c.lineWidth = mini ? 4 : 2.5;
      c.beginPath(); c.arc(run.x, cy, mini ? 17 : 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tilt); c.stroke();
    }
    c.restore();
  }

  function drawToken(c, t, colors, mini) {
    const tok = tokenOf(t.kind, KNOCKS);
    const z = Z[t.kind] ?? 2;
    const wide = t.w > LANE_W * 1.5;
    const w = mini ? Math.min(t.w || 24, wide ? W : 30) : Math.min(Math.max(t.w || 24, 22), wide ? W : LANE_W - 8);
    const h = mini ? 18 : Math.min(Math.max(t.h || 24, 18), 34);
    c.save();
    c.globalAlpha = t.wapped ? 0.32 : 1;
    if (z >= 3) {
      c.fillStyle = 'rgba(0, 0, 0, 0.1)';
      c.beginPath(); c.ellipse(t.x, t.y + h * 0.7, w * 0.4, 4, 0, 0, Math.PI * 2); c.fill();
    }
    const y = t.y - (z >= 3 ? 8 : 0);
    if (mini) {
      c.fillStyle = tok.ink;
      if (wide) c.fillRect(t.x - w / 2, y - 5, w, 10);
      else { c.beginPath(); c.arc(t.x, y, 9, 0, Math.PI * 2); c.fill(); }
      c.restore();
      return;
    }
    c.fillStyle = mixInk(tok.ink, colors.paper, 0.82);
    c.strokeStyle = tok.ink;
    c.lineWidth = z === 0 ? 1.5 : z === 1 ? 1.8 : z === 2 ? 2.6 : 1.6;
    if (z === 0) c.setLineDash([4, 3]);
    const round = tok.glyph === '◉' || tok.glyph === '★' || tok.glyph === '•' || tok.glyph === '◯';
    if (round && !wide) { c.beginPath(); c.arc(t.x, y, Math.min(w, h) / 2 + 2, 0, Math.PI * 2); }
    else roundRect(c, t.x - w / 2, y - h / 2, w, h, 5);
    c.fill();
    c.stroke();
    c.setLineDash([]);
    if (t.kind === 'march' && Number.isFinite(t.gap)) {
      c.fillStyle = colors.paper;
      c.fillRect(t.gap * LANE_W + 3, y - h / 2 - 2, LANE_W - 6, h + 4);
      c.fillStyle = '#3d7a3a';
      c.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
      c.textAlign = 'center';
      c.fillText('GAP', t.gap * LANE_W + LANE_W / 2, y + 3);
    }
    if (z === 4) {
      c.strokeStyle = tok.ink;
      c.lineWidth = 1;
      c.beginPath(); c.arc(t.x, y, Math.min(w, h) / 2 + 6, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = tok.ink;
    c.font = `700 ${wide ? 11 : 12}px "JetBrainsMono", ui-monospace, monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(wide && t.kind !== 'march' ? `${tok.glyph} ${String(t.kind).toUpperCase()} ${tok.glyph}` : tok.glyph, t.x, y + 0.5);
    // What a hop does to it: ⤒ a hop clears it, ⤒⤒ only a high hop.
    const hop = LOW.has(t.kind) ? '⤒' : HIGH_CLEARS.has(t.kind) ? '⤒⤒' : '';
    if (hop && !t.wapped) {
      c.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
      c.fillStyle = '#3d7a3a';
      c.fillText(hop, t.x + Math.min(w, LANE_W - 8) / 2 - 2, y - h / 2 - 3);
    }
    // And what it is, in a word, under it: the board is for reading.
    if (!t.wapped && !wide) {
      const name = String(env.nameOf ? env.nameOf(t) : t.kind).toLowerCase().slice(0, 14);
      c.font = '600 7.5px "JetBrainsMono", ui-monospace, monospace';
      c.fillStyle = mixInk(tok.ink, colors.ink, 0.45);
      c.textBaseline = 'top';
      c.fillText(name, t.x, y + h / 2 + 3);
    }
    c.textBaseline = 'alphabetic';
    c.restore();
  }

  /* Each frame, after the lanes are drawn: take any stills that are due, and paint the window. */
  function frame(run, colors) {
    if (mode === 'off') return;
    const now = performance.now();
    if (pending.length) {
      const due = pending.filter((p) => p.at <= now);
      pending = pending.filter((p) => p.at > now).slice(-4);
      due.slice(-2).forEach(capture);
    }
    if (!ictx || !inset) return;
    if (!inset.width) sizeInset();
    ictx.setTransform(1, 0, 0, 1, 0, 0);
    ictx.clearRect(0, 0, inset.width, inset.height);
    if (mode === 'board') {
      // The views swapped: the lanes as drawn, in small.
      const f = env.frame?.() || { x0: 0, y0: 0, w: W, h: H };
      const sx = canvas.width / f.w;
      const sy = canvas.height / f.h;
      try { ictx.drawImage(canvas, -f.x0 * sx, -f.y0 * sy, W * sx, H * sy, 0, 0, inset.width, inset.height); } catch { /* not yet drawn */ }
      if (insetCap) insetCap.textContent = 'the lanes, as drawn';
      return;
    }
    if (showing && now < showing.until) {
      const { still } = showing.item;
      // A still fills the window's width; the window is the screen's own shape, so it sits in the middle.
      const h = inset.width * (STILL_H / STILL_W);
      ictx.fillStyle = colors.paper;
      ictx.fillRect(0, 0, inset.width, inset.height);
      ictx.drawImage(still, 0, (inset.height - h) / 2, inset.width, h);
      if (insetCap) insetCap.textContent = showing.item.caption.register ? `${showing.item.caption.register} · ${showing.item.caption.chips.map((c) => c.text).join(' · ')}` : showing.item.caption.line;
      return;
    }
    ictx.setTransform(inset.width / W, 0, 0, inset.height / H, 0, 0);
    drawBoard(ictx, run, colors, { mini: true });
    ictx.setTransform(1, 0, 0, 1, 0, 0);
    if (insetCap) insetCap.textContent = run ? 'the board' : '';
  }

  const reset = () => { pending = []; stills = []; showing = null; paintReel(); };

  window.addEventListener('resize', () => { if (mode !== 'off') sizeInset(); });
  return {
    get mode() { return mode; },
    setMode,
    take,
    frame,
    drawBoard,
    reset,
    /** The stills kept this carry whose captions pass a test: { still, caption, entry }, newest first. */
    stills: (test = () => true) => stills.filter((item) => test(item.caption || {})),
    calm: () => Boolean(reduced?.matches)
  };
}

function mixInk(a, b, t) {
  const ch = (s) => {
    if (s.startsWith('#')) {
      const n = s.length === 4 ? s.slice(1).split('').map((d) => parseInt(d + d, 16)) : [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
      return n;
    }
    return (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  };
  const x = ch(a);
  const y = ch(b);
  return `rgb(${x.map((n, i) => Math.round(n + (y[i] - n) * t)).join(', ')})`;
}
