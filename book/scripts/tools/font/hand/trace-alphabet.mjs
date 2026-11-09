#!/usr/bin/env node
/**
 * trace-alphabet.mjs — trace spwashi's lettered alphabet into outlines (npm run font:trace).
 *
 * Source: the alphabet blocks (prime-2026-10-22-00, spwashi.com's October drop): one white sheet of ruled boxes
 * lettered Aa to Zz along a snaking path, scanned at 300 dpi. The scan stays where it lives (SPWASHI_COM, by
 * default ~/air/spwashi.com; never copied here); what this writes is the trace: book/fonts/spwashi/letters.json,
 * each letter's outlines in two faces (outline: the pen line as lettered; hand: the strokes filled), on a
 * 700-unit cap height, with the cell it came from. The font build (font:hand) reads only the trace.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contours, orient, simplify, smooth, area } from '../../../modules/spwashi-hand.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const SPWASHI = process.env.SPWASHI_COM || resolve(homedir(), 'air/spwashi.com');
const SOURCE = {
  id: 'prime-2026-10-22-00',
  title: 'Alphabet blocks, framed board',
  scan: 'public/images/renders/_raw/folio-scans-2026-10-22/prime-2026-10-22-00-scan.png',
  sidecar: 'public/images/assets/primes/prime-alphabet-blocks-framed-board.spw',
  page: 'https://spwashi.com/design/folios/october-2026/#prime-1022-00'
};
// The snaking path, read row by row as the boxes lie: A–I down columns, J–R across, then U T S, V W X, Z Y.
const ROWS = ['ADG', 'BEH', 'CFI', 'JKL', 'MNO', 'PQR', 'UTS', 'VWX', 'ZY'];
const INK = 150;          // grey below this is ink
const CAP = 700;          // font units for a capital's height
const OUT = resolve(ROOT, 'book/fonts/spwashi/letters.json');

const scanPath = resolve(SPWASHI, SOURCE.scan);
if (!existsSync(scanPath)) {
  console.error(`[font:trace] the scan is not here: ${scanPath}\n  set SPWASHI_COM to the spwashi.com checkout; the committed trace (letters.json) still builds the font.`);
  process.exit(1);
}
const [W, H] = execFileSync('magick', ['identify', '-format', '%w %h', scanPath]).toString().split(' ').map(Number);
const grey = execFileSync('magick', [scanPath, '-colorspace', 'Gray', '-depth', '8', 'gray:-'], { maxBuffer: W * H + 1024 });

/* ─── Regions: flood fill on a predicate ─── */
function regions(test, x0 = 0, y0 = 0, w = W, h = H, minSize = 1) {
  const label = new Int32Array(w * h).fill(-1);
  const found = [];
  const stack = [];
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const at = j * w + i;
      if (label[at] !== -1 || !test(x0 + i, y0 + j)) continue;
      const id = found.length;
      const r = { id, n: 0, minX: i, maxX: i, minY: j, maxY: j, pixels: [] };
      label[at] = id; stack.push(at);
      while (stack.length) {
        const p = stack.pop();
        const px = p % w; const py = (p - px) / w;
        r.n += 1; r.pixels.push(p);
        if (px < r.minX) r.minX = px; if (px > r.maxX) r.maxX = px; if (py < r.minY) r.minY = py; if (py > r.maxY) r.maxY = py;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = px + dx; const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (label[q] === -1 && test(x0 + nx, y0 + ny)) { label[q] = id; stack.push(q); }
        }
      }
      found.push(r);
    }
  }
  return { label, regions: found.filter((r) => r.n >= minSize) };
}

const g = (x, y) => grey[y * W + x];
const isInk = (x, y) => g(x, y) < INK;

/* ─── The cells: white regions enclosed by the ruled boxes, about a box in size ───
 * Found as drawn first; a box whose ruled line skips (it leaks into the page) is found again with the ink
 * thickened by GAP, and kept where no box was found already. */
const GAP = Number(process.env.GAP || 2);
function thickened(gap) {
  const across = new Uint8Array(W * H);
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y += 1) {
    let last = -Infinity;
    for (let x = 0; x < W; x += 1) { if (isInk(x, y)) last = x; if (x - last <= gap) across[y * W + x] = 1; }
    last = Infinity;
    for (let x = W - 1; x >= 0; x -= 1) { if (isInk(x, y)) last = x; if (last - x <= gap) across[y * W + x] = 1; }
  }
  for (let x = 0; x < W; x += 1) {
    let last = -Infinity;
    for (let y = 0; y < H; y += 1) { if (across[y * W + x]) last = y; if (y - last <= gap) out[y * W + x] = 1; }
    last = Infinity;
    for (let y = H - 1; y >= 0; y -= 1) { if (across[y * W + x]) last = y; if (last - y <= gap) out[y * W + x] = 1; }
  }
  return out;
}
const boxesAt = (gap) => {
  const ink = gap ? thickened(gap) : null;
  return regions((x, y) => (ink ? !ink[y * W + x] : !isInk(x, y)), 0, 0, W, H, 4000).regions
    .map((r) => ({ ...r, pixels: undefined, gap, w: r.maxX - r.minX + 1, h: r.maxY - r.minY + 1 }))
    .filter((r) => r.w > 110 && r.w < 380 && r.h > 110 && r.h < 380 && r.n / (r.w * r.h) > 0.4);
};
const paper = boxesAt(0);
if (paper.length < 26) {
  const within = (b, x, y) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
  boxesAt(GAP).forEach((b) => {
    if (!paper.some((p) => within(p, b.minX + b.w / 2, b.minY + b.h / 2) || within(b, p.minX + p.w / 2, p.minY + p.h / 2))) paper.push(b);
  });
}
if (paper.length !== 26) {
  console.error(`[font:trace] found ${paper.length} boxes, not 26: ${paper.map((r) => `${r.minX},${r.minY} ${r.w}×${r.h}`).join(' · ')}`);
  process.exit(1);
}
// Rows by y (a box's centre within half a box of the row's), then across by x.
const sorted = [...paper].sort((a, b) => (a.minY + a.h / 2) - (b.minY + b.h / 2));
const rows = [];
sorted.forEach((cell) => {
  const cy = cell.minY + cell.h / 2;
  const row = rows.find((r) => Math.abs(r.cy - cy) < cell.h * 0.45);
  if (row) row.cells.push(cell); else rows.push({ cy, cells: [cell] });
});
if (rows.length !== ROWS.length) { console.error(`[font:trace] ${rows.length} rows of boxes, expected ${ROWS.length}`); process.exit(1); }

/* ─── A field for one glyph: the scan's grey, inside its cell, ink positive ─── */
function fieldOf(cell, parts, face, ch = '') {
  const pad = 6;
  const minX = Math.min(...parts.map((p) => p.minX)) - pad;
  const maxX = Math.max(...parts.map((p) => p.maxX)) + pad;
  const minY = Math.min(...parts.map((p) => p.minY)) - pad;
  const maxY = Math.max(...parts.map((p) => p.maxY)) + pad;
  const w = maxX - minX + 1; const h = maxY - minY + 1;
  // Only this glyph's own ink: pixels of its parts, with the grey around them for a soft edge.
  const own = new Uint8Array(w * h);
  parts.forEach((p) => p.pixels.forEach(([ax, ay]) => {
    const x = ax - minX; const y = ay - minY;
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      const xx = x + dx; const yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) own[yy * w + xx] = 1;
    }
  }));
  let ink = new Float32Array(w * h);
  for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
    ink[j * w + i] = own[j * w + i] ? (255 - g(minX + i, minY + j)) / 255 : 0;
  }
  if (face === 'hand') {
    // Fill the bodies of the strokes. Close the pen line's skips first (a pixel or two), then fill enclosed
    // paper that is long and thin — the inside of a stroke — and leave what is round: a counter, however small.
    let solid = Uint8Array.from(ink, (v) => (v > (255 - INK) / 255 ? 1 : 0));
    const grow = (m, keep) => {
      const out = new Uint8Array(w * h);
      for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
        let any = keep ? 1 : 0;
        for (let dy = -1; dy <= 1 && (keep ? any : !any); dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
          const x = i + dx; const y = j + dy;
          const v = x < 0 || y < 0 || x >= w || y >= h ? 0 : m[y * w + x];
          if (keep && !v) { any = 0; break; }
          if (!keep && v) { any = 1; break; }
        }
        out[j * w + i] = any;
      }
      return out;
    };
    // Most of the pen line skips a pixel or two; a few letters' lines open wider (CLOSE_WIDER).
    const radius = CLOSE_WIDER[ch] || CLOSE;
    let closed = solid;
    for (let k = 0; k < radius; k += 1) closed = grow(closed, false);
    for (let k = 0; k < radius; k += 1) closed = grow(closed, true);
    const lab = new Int32Array(w * h).fill(-1);
    let id = 0;
    for (let s0 = 0; s0 < w * h; s0 += 1) {
      if (closed[s0] || lab[s0] !== -1) continue;
      const stack = [s0]; lab[s0] = id; const px = []; let edge = false;
      while (stack.length) {
        const p = stack.pop(); px.push(p);
        const x = p % w; const y = (p - x) / w;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (!closed[q] && lab[q] === -1) { lab[q] = id; stack.push(q); }
        }
      }
      id += 1;
      if (edge) continue;
      // How thick: erode until it is gone (each pass peels a pixel from every side).
      let left = new Set(px); let passes = 0;
      while (left.size && passes < 40) {
        const next = new Set();
        left.forEach((p) => { const x = p % w; if (x > 0 && x < w - 1 && left.has(p - 1) && left.has(p + 1) && left.has(p - w) && left.has(p + w)) next.add(p); });
        left = next; passes += 1;
      }
      const elongated = px.length / (passes * passes) > ELONGATED;
      // A pinhole is filled whatever its shape; the scanner's grain, not the hand's.
      if ((passes <= THIN && elongated) || px.length < 30) px.forEach((p) => { solid[p] = 1; });
    }
    // What the closing bridged joins the ink: a skip in the pen line, sealed.
    for (let k = 0; k < w * h; k += 1) if (closed[k]) solid[k] = 1;
    ink = Float32Array.from(solid, (v, k) => Math.max(v, ink[k]));
    solid = null;
  }
  // Soften the scanner's grain a little, then contour at the ink's edge.
  const blur = new Float32Array(w * h);
  for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) {
    let s = 0; let n = 0;
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      const x = i + dx; const y = j + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const k = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
      s += ink[y * w + x] * k; n += k;
    }
    blur[j * w + i] = s / n - (255 - INK) / 255;
  }
  ink = null;
  return { field: blur, w, h, minX, minY };
}
const THIN = Number(process.env.THIN || 10);
const ELONGATED = Number(process.env.ELONGATED || 7);
const CLOSE = Number(process.env.CLOSE || 2);
// Corrections by hand: these letters' pen lines open wider than a skip, so their strokes close over more.
const CLOSE_WIDER = { C: 7, Q: 5, U: 5, S: 4, g: 4, u: 4, x: 4, z: 4 };

function trace(cell, parts, face, frame, ch) {
  const { field, w, h, minX, minY } = fieldOf(cell, parts, face, ch);
  const loops = orient(contours(field, w, h).filter((l) => Math.abs(area(l)) > 6).map((l) => simplify(l, 0.45)));
  // Scan pixels → font units: the capital's baseline at 0, its height at CAP; y up.
  const map = ([x, y]) => [(x + minX - frame.left) * frame.scale, (frame.baseline - (y + minY)) * frame.scale];
  return loops.map(smooth).map((c) => c.map((seg) => {
    const out = [];
    for (let k = 0; k < seg.length; k += 2) out.push(...map([seg[k], seg[k + 1]]).map((v) => Math.round(v)));
    return out;
  }));
}

/* Where a capital and its small letter touch, cut the joined shape at a column (a fraction across it). */
const SPLITS = {};
function splitTouching(L, parts) {
  if (!(L in SPLITS)) return parts;
  const big = parts.reduce((a, b) => (b.pixels.length > a.pixels.length ? b : a));
  const at = big.minX + (big.maxX - big.minX) * SPLITS[L];
  const left = big.pixels.filter(([x]) => x < at);
  const right = big.pixels.filter(([x]) => x >= at);
  const box = (px) => ({ pixels: px, minX: Math.min(...px.map((p) => p[0])), maxX: Math.max(...px.map((p) => p[0])), minY: Math.min(...px.map((p) => p[1])), maxY: Math.max(...px.map((p) => p[1])) });
  return [...parts.filter((p) => p !== big), box(left), box(right)];
}

/* Corrections by hand, each said. The k and r boxes are ruled twice down their right side, and the small
 * letter touches the inner line: from the top down, rows as thin as one ruled line (a pen line, not a
 * letter's stroke, which this hand draws as two) are the line, until the letter begins. */
const TRIM_HAIR = new Set(['k', 'r']);
function trimmed(ch, group) {
  if (!TRIM_HAIR.has(ch)) return group;
  const all = group.flatMap((p) => p.pixels);
  const rows = new Map();
  all.forEach(([, y]) => rows.set(y, (rows.get(y) || 0) + 1));
  const ys = [...rows.keys()].sort((a, b) => a - b);
  let begins = ys[0];
  // The letter begins where the ink stays wider than one line for a while (the line's own end can blot).
  for (let i = 0; i < ys.length; i += 1) {
    if (ys.slice(i, i + 5).every((y) => rows.get(y) > 7)) { begins = ys[i]; break; }
  }
  return group.map((p) => {
    const pixels = p.pixels.filter(([, y]) => y >= begins);
    if (!pixels.length) return null;
    return { pixels, minX: Math.min(...pixels.map((q) => q[0])), maxX: Math.max(...pixels.map((q) => q[0])), minY: Math.min(...pixels.map((q) => q[1])), maxY: Math.max(...pixels.map((q) => q[1])) };
  }).filter(Boolean);
}

const letters = {};
const report = [];
rows.forEach((row, r) => {
  row.cells.sort((a, b) => a.minX - b.minX);
  if (row.cells.length !== ROWS[r].length) { console.error(`[font:trace] row ${r + 1}: ${row.cells.length} boxes, expected ${ROWS[r].length}`); process.exit(1); }
  row.cells.forEach((box, c) => {
    const L = ROWS[r][c];
    // The box to the inner edge of its ruled line (the white was found with the ink thickened by GAP). What
    // ink lies there is the letters, a letter that touched the line cut where it met it, and slivers where
    // the hand-ruled line wanders in: thin, along an edge.
    // Out past the inner edge to take in the ruled line itself: a letter that leans on its line can cross it.
    const MARGIN = 6;
    const out = box.gap + MARGIN;
    const cell = { x0: box.minX - out, y0: box.minY - out, w: box.w + out * 2, h: box.h + out * 2 };
    // Ruled: it touches the box's edge and most of its ink keeps to the border (a letter touching the line
    // has most of its ink well inside).
    const ruled = (p) => {
      const pw = p.maxX - p.minX + 1; const ph = p.maxY - p.minY + 1;
      // A hair of line, anywhere: the pen's own strokes are wider than this.
      if (Math.min(pw, ph) <= 5 && Math.max(pw, ph) >= 16) return true;
      // A speck by the border: what the erasing left of the line.
      const rim = Math.min(p.minX, p.minY, cell.w - 1 - p.maxX, cell.h - 1 - p.maxY);
      if (p.pixels.length < 90 && rim < 12 + MARGIN) return true;
      // A small dash of line, anywhere in the box: thin, a little long, not a dot.
      if (p.pixels.length < 200 && Math.max(pw, ph) >= 12 && p.pixels.length / Math.max(pw, ph) <= 7) return true;
      // A ruled line on its own near the edge, straight or leaning: long, and one pen line thick on average.
      if (rim < 30 + MARGIN && Math.max(pw, ph) >= 30 && p.pixels.length / Math.max(pw, ph) <= 6) return true;
      const touches = p.minX <= 1 || p.minY <= 1 || p.maxX >= cell.w - 2 || p.maxY >= cell.h - 2;
      if (!touches) return false;
      const near = p.pixels.filter((at) => {
        const x = at % cell.w; const y = Math.floor(at / cell.w);
        return Math.min(x, y, cell.w - 1 - x, cell.h - 1 - y) < 14 + MARGIN;
      }).length;
      return near / p.pixels.length > 0.6;
    };
    // The ruled lines, found as lines: along each edge, a straight line (leaning a little, as a hand rules)
    // that carries ink for nearly the whole box is the ruling — once or twice over, some boxes are ruled twice.
    // No letter runs that long straight. Each is erased by its own thickness only: in a row where a letter
    // leans on the line, what lies inward of it stays the letter's.
    const mask = new Uint8Array(cell.w * cell.h);
    for (let y = 0; y < cell.h; y += 1) for (let x = 0; x < cell.w; x += 1) mask[y * cell.w + x] = isInk(cell.x0 + x, cell.y0 + y) ? 1 : 0;
    const BAND = MARGIN + 26; const LINE = 9; const SUPPORT = 0.88;
    const rulings = (lines, depth, at) => {
      const mid = lines / 2;
      const span = lines - MARGIN * 2;
      const found = [];
      for (let off = 0; off < Math.min(BAND, depth); off += 1) {
        for (let lean = -0.08; lean <= 0.0801; lean += 0.01) {
          let hits = 0;
          for (let line = MARGIN; line < lines - MARGIN; line += 1) {
            const k = Math.round(off + lean * (line - mid));
            if (k >= 0 && k < depth && (mask[at(line, k)] || (k + 1 < depth && mask[at(line, k + 1)]))) hits += 1;
          }
          if (hits >= span * SUPPORT) found.push({ off, lean, hits });
        }
      }
      // One per line: the best of each cluster of offsets.
      found.sort((a, b) => b.hits - a.hits);
      const kept = [];
      found.forEach((f) => { if (!kept.some((k) => Math.abs(k.off - f.off) < 5)) kept.push(f); });
      return kept.map((f) => (line) => f.off + f.lean * (line - mid));
    };
    const runAt = (line, c, depth, at) => {
      if (c < 0 || c >= depth) return null;
      let k = c;
      if (!mask[at(line, k)]) { const n = [c + 1, c - 1, c + 2, c - 2].find((q) => q >= 0 && q < depth && mask[at(line, q)]); if (n === undefined) return null; k = n; }
      let a = k; let b = k;
      while (a - 1 >= 0 && mask[at(line, a - 1)]) a -= 1;
      while (b + 1 < depth && mask[at(line, b + 1)]) b += 1;
      return [a, b];
    };
    const eraseRuling = (lines, depth, at) => {
      rulings(lines, depth, at).forEach((along) => {
        // Follow the line as drawn: where it runs alone (a thin run near the fit) its centre is read; where a
        // letter leans on it, its centre is carried over from the rows either side.
        const centre = new Array(lines).fill(null);
        const runs = new Array(lines).fill(null);
        const widths = [];
        for (let line = 0; line < lines; line += 1) {
          const run = runAt(line, Math.round(along(line)), depth, at);
          runs[line] = run;
          if (run && run[1] - run[0] + 1 <= LINE) { centre[line] = (run[0] + run[1]) / 2; widths.push(run[1] - run[0] + 1); }
        }
        widths.sort((p, q) => p - q);
        const half = (widths[Math.floor(widths.length / 2)] || 5) / 2;
        for (let line = 0; line < lines; line += 1) {
          const run = runs[line];
          if (!run) continue;
          if (centre[line] !== null) { for (let k = run[0]; k <= run[1]; k += 1) mask[at(line, k)] = 2; continue; }
          let up = line - 1; while (up >= 0 && centre[up] === null) up -= 1;
          let dn = line + 1; while (dn < lines && centre[dn] === null) dn += 1;
          const c = up >= 0 && dn < lines ? centre[up] + ((centre[dn] - centre[up]) * (line - up)) / (dn - up) : up >= 0 ? centre[up] : dn < lines ? centre[dn] : along(line);
          // Exactly the line's own width comes away; inward of it is the letter's edge.
          for (let k = Math.round(c - half); k <= Math.round(c + half); k += 1) if (k >= run[0] && k <= run[1]) mask[at(line, k)] = 2;
        }
      });
    };
    eraseRuling(cell.h, cell.w, (y, k) => y * cell.w + k);
    eraseRuling(cell.h, cell.w, (y, k) => y * cell.w + (cell.w - 1 - k));
    eraseRuling(cell.w, cell.h, (x, k) => k * cell.w + x);
    eraseRuling(cell.w, cell.h, (x, k) => (cell.h - 1 - k) * cell.w + x);
    const inkHere = (x, y) => mask[(y - cell.y0) * cell.w + (x - cell.x0)] === 1;
    const parts = regions(inkHere, cell.x0, cell.y0, cell.w, cell.h, 12).regions
      .filter((p) => !ruled(p))
      .map((p) => ({
        minX: p.minX + cell.x0, maxX: p.maxX + cell.x0, minY: p.minY + cell.y0, maxY: p.maxY + cell.y0,
        pixels: p.pixels.map((at) => [cell.x0 + (at % cell.w), cell.y0 + Math.floor(at / cell.w)])
      }));
    // Capital and small letter: the capital is the biggest shape, the small letter lies to its right (a dot
    // goes with the stem below it). A box where they touch is split where its ink runs thinnest (SPLITS).
    if (process.env.DEBUG) console.log(L, cell, regions(inkHere, cell.x0, cell.y0, cell.w, cell.h, 12).regions.map((p) => `${p.minX},${p.minY} ${p.maxX - p.minX + 1}×${p.maxY - p.minY + 1}${ruled(p) ? ' ruled' : ''}`).join(' | '));
    if (!parts.length) { report.push(`${L}: nothing but the ruled line in its box`); return; }
    const pieces = splitTouching(L, parts);
    const core = pieces.reduce((a, b) => (b.pixels.length > a.pixels.length ? b : a));
    const mid = (p) => (p.minX + p.maxX) / 2;
    const upper = pieces.filter((p) => p === core || mid(p) <= mid(core));
    const lower = pieces.filter((p) => !upper.includes(p));
    if (!lower.length) { report.push(`${L}: one shape in the box — capital and small letter touch`); }
    const top = Math.min(...upper.map((p) => p.minY));
    const bottom = Math.max(...upper.map((p) => p.maxY));
    // Q's tail falls below its line: its baseline is its bowl's foot, which the small letter's x-line suggests.
    const frame = { left: Math.min(...upper.map((p) => p.minX)), baseline: bottom, scale: CAP / (bottom - top) };
    if (L === 'Q') frame.scale = CAP / ((bottom - top) * 0.9);
    if (L === 'Q') frame.baseline = top + (bottom - top) * 0.9;
    for (const [ch, rawGroup] of [[L, upper], [L.toLowerCase(), lower]]) {
      if (!rawGroup.length) continue;
      const group = trimmed(ch, rawGroup);
      const f = ch === L ? frame : { ...frame, left: Math.min(...group.map((p) => p.minX)) };
      letters[ch] = {
        from: { piece: SOURCE.id, box: [box.minX, box.minY, box.w, box.h], row: r + 1, place: c + 1 },
        outline: trace(cell, group, 'outline', f, ch),
        hand: trace(cell, group, 'hand', f, ch)
      };
    }
  });
});

// The pen, measured: how wide the line is and how wide a stroke's body, from the straight capitals.
const penOf = (ch) => {
  const g2 = letters[ch];
  return g2 ? g2.outline.length : 0;
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({
  note: 'spwashi\'s lettered alphabet, traced (book/scripts/tools/font/hand/trace-alphabet.mjs). Outlines are quadratic: each contour is [x, y] then [cx, cy, x, y]…, in font units on a 700 cap height, y up, the capital\'s left edge at 0. outline = the pen line as lettered; hand = the strokes filled. The scan stays in spwashi.com; this is the trace.',
  source: { ...SOURCE, scan: `spwashi.com/${SOURCE.scan}` },
  cap: CAP,
  letters
})}\n`);
console.log(`[font:trace] ${Object.keys(letters).length} letters from ${SOURCE.id} → ${OUT.replace(`${ROOT}/`, '')}`);
report.forEach((line) => console.log(`[font:trace] note  ${line}`));
void penOf;
