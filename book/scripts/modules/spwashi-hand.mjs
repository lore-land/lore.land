/**
 * spwashi-hand.mjs — spwashi's hand, as lore.land depicts it: spwashi@<lore.land>.{
 *
 * The letters were lettered by hand (the alphabet blocks, prime-2026-10-22-00 in spwashi.com's October drop) and
 * traced once, at authoring time, into outlines (book/fonts/spwashi/letters.json). What the scan does not hold
 * (digits, marks, the twelve sigils) a pen measured from the hand draws: a skeleton, inked as the hand inks —
 * a closed pen line around the body of each stroke. Every glyph says which it is: lettered, or penned, the way a
 * plate is painted or still a study; the set stays open ({), and a lettered glyph replaces a penned one when a
 * scan brings it.
 *
 * Portable (no DOM, no Node): the font build and the letters page share it. Fields are sampled on a grid in the
 * hand's own pixels (the scan's 300 dpi), contoured by marching squares, and smoothed into quadratic outlines.
 */

/* ─── Fields and contours ─────────────────────────────────────────── */

/** Contours of a scalar field at level 0 (positive = ink), as closed polygons in grid units. */
export function contours(field, w, h) {
  // Pad with a ring of outside so every contour closes.
  const W = w + 2;
  const H = h + 2;
  const at = (x, y) => (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1 ? -1 : field[(y - 1) * w + (x - 1)]);
  const edges = new Map();
  const link = (a, b) => {
    (edges.get(a.k) || edges.set(a.k, { p: a, n: [] }).get(a.k)).n.push(b.k);
    (edges.get(b.k) || edges.set(b.k, { p: b, n: [] }).get(b.k)).n.push(a.k);
  };
  const cross = (x0, y0, x1, y1, v0, v1, key) => {
    const t = v0 / (v0 - v1);
    return { k: key, x: x0 + (x1 - x0) * t - 1, y: y0 + (y1 - y0) * t - 1 };
  };
  for (let y = 0; y < H - 1; y += 1) {
    for (let x = 0; x < W - 1; x += 1) {
      const a = at(x, y); const b = at(x + 1, y); const c = at(x + 1, y + 1); const d = at(x, y + 1);
      const idx = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const top = () => cross(x, y, x + 1, y, a, b, `h${x},${y}`);
      const right = () => cross(x + 1, y, x + 1, y + 1, b, c, `v${x + 1},${y}`);
      const bottom = () => cross(x, y + 1, x + 1, y + 1, d, c, `h${x},${y + 1}`);
      const left = () => cross(x, y, x, y + 1, a, d, `v${x},${y}`);
      const centre = (a + b + c + d) / 4;
      switch (idx) {
        case 1: case 14: link(left(), bottom()); break;
        case 2: case 13: link(bottom(), right()); break;
        case 3: case 12: link(left(), right()); break;
        case 4: case 11: link(top(), right()); break;
        case 6: case 9: link(top(), bottom()); break;
        case 7: case 8: link(left(), top()); break;
        case 5: if (centre > 0) { link(left(), top()); link(bottom(), right()); } else { link(left(), bottom()); link(top(), right()); } break;
        case 10: if (centre > 0) { link(top(), right()); link(left(), bottom()); } else { link(left(), top()); link(bottom(), right()); } break;
        default: break;
      }
    }
  }
  const loops = [];
  const seen = new Set();
  for (const [key, node] of edges) {
    if (seen.has(key)) continue;
    const loop = [];
    let prev = null;
    let cur = key;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const n = edges.get(cur);
      loop.push([n.p.x, n.p.y]);
      const next = n.n.find((k) => k !== prev && !seen.has(k)) ?? null;
      prev = cur;
      cur = next;
    }
    if (loop.length > 3) loops.push(loop);
    void node;
  }
  return loops;
}

export const area = (poly) => poly.reduce((s, [x, y], i) => { const [x2, y2] = poly[(i + 1) % poly.length]; return s + x * y2 - x2 * y; }, 0) / 2;

function inside([px, py], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Ramer–Douglas–Peucker on a closed polygon. */
export function simplify(poly, eps) {
  if (poly.length < 8) return poly;
  const rdp = (pts) => {
    if (pts.length < 3) return pts;
    const [ax, ay] = pts[0]; const [bx, by] = pts[pts.length - 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let best = -1; let at = 0;
    for (let i = 1; i < pts.length - 1; i += 1) {
      const d = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
      if (d > best) { best = d; at = i; }
    }
    if (best <= eps) return [pts[0], pts[pts.length - 1]];
    return [...rdp(pts.slice(0, at + 1)).slice(0, -1), ...rdp(pts.slice(at))];
  };
  // Split at the point farthest from the first, so the closed loop simplifies as two open runs.
  let far = 0; let fd = 0;
  poly.forEach(([x, y], i) => { const d = Math.hypot(x - poly[0][0], y - poly[0][1]); if (d > fd) { fd = d; far = i; } });
  const a = rdp(poly.slice(0, far + 1));
  const b = rdp([...poly.slice(far), poly[0]]);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

/** Orient loops for a nonzero fill: outer loops one way, holes the other, by how deeply each is nested. */
export function orient(loops) {
  return loops.map((loop) => {
    const depth = loops.filter((other) => other !== loop && Math.abs(area(other)) > Math.abs(area(loop)) && inside(loop[0], other)).length;
    const ccw = area(loop) > 0;
    const want = depth % 2 === 0;
    return ccw === want ? loop : [...loop].reverse();
  });
}

/** A closed polygon as smooth quadratic segments through its midpoints: [[x,y] start, ...[cx,cy,x,y]]. */
export function smooth(poly) {
  const n = poly.length;
  const mid = (i) => { const [x1, y1] = poly[i % n]; const [x2, y2] = poly[(i + 1) % n]; return [(x1 + x2) / 2, (y1 + y2) / 2]; };
  const out = [mid(0)];
  for (let i = 1; i <= n; i += 1) out.push([...poly[i % n], ...mid(i)]);
  return out;
}

/** Contours as SVG path data, mapped through (x, y) → [X, Y]. */
export function pathData(curves, map = (x, y) => [x, y], digits = 1) {
  const f = (v) => +v.toFixed(digits);
  return curves.map((c) => {
    const [sx, sy] = map(...c[0]);
    return `M${f(sx)} ${f(sy)}${c.slice(1).map(([cx, cy, x, y]) => { const [a, b] = map(cx, cy); const [d, e] = map(x, y); return `Q${f(a)} ${f(b)} ${f(d)} ${f(e)}`; }).join('')}Z`;
  }).join('');
}

/* ─── The pen: a skeleton inked as the hand inks ─────────────────────
 * The hand letters each stroke as a closed pen line around a body: `body` is the stroke's width, `pen` the
 * line's. Measured from the alphabet blocks (letters.json `pen`); a skeleton is in font units on the hand's
 * cap height (700), strokes as polylines, `{ dot: [x, y] }` for a dot. */

/** Seeded noise: smooth, repeatable, one stream per seed. */
export function noise(seed = 1) {
  let s = (seed * 2654435761) >>> 0;
  const rand = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  const table = Array.from({ length: 256 }, rand);
  return (t) => {
    const i = Math.floor(t); const f = t - i; const u = f * f * (3 - 2 * f);
    return (table[i & 255] * (1 - u) + table[(i + 1) & 255] * u) * 2 - 1;
  };
}

/** Points along a stroke, every `step`, so a wobble can move them. */
function resample(stroke, step) {
  const out = [stroke[0]];
  for (let i = 1; i < stroke.length; i += 1) {
    const [x0, y0] = stroke[i - 1]; const [x1, y1] = stroke[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k += 1) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

/** Arcs and curves for skeletons: an arc as a polyline (degrees, counter-clockwise from three o'clock). */
export function arc(cx, cy, rx, ry, from, to, n = 18) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
}

/**
 * Ink a skeleton with the pen. Returns { curves (font units, y up), width } for a face: 'hand' fills the body,
 * 'outline' draws the pen line around it, as lettered. `wobble` (0..) is how much the hand wanders, `seed` which way.
 */
export function inkSkeleton(skeleton, { body = 64, pen = 18, face = 'outline', wobble = 1, seed = 7, scale = 0.15 } = {}) {
  const wander = noise(seed);
  const strokes = [];
  const dots = [];
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  skeleton.forEach((part, si) => {
    if (part.dot) { dots.push(part.dot); return; }
    const pts = resample(part, 24).map(([x, y], i) => [x + wander(si * 37 + i * 0.35) * 9 * wobble, y + wander(si * 37 + i * 0.35 + 91) * 9 * wobble]);
    strokes.push(pts);
  });
  const half = body / 2;
  [...strokes.flat(), ...dots].forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
  const pad = half + 16;
  // A grid in the hand's own pixels (scale: px per font unit), y down.
  const x0 = minX - pad; const y1 = maxY + pad;
  const w = Math.ceil((maxX - minX + pad * 2) * scale);
  const h = Math.ceil((maxY - minY + pad * 2) * scale);
  const field = new Float32Array(w * h);
  const segs = strokes.flatMap((pts) => pts.slice(1).map((p, i) => [pts[i], p]));
  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const fx = x0 + i / scale; const fy = y1 - j / scale;
      let d = Infinity;
      for (const [[ax, ay], [bx, by]] of segs) {
        const vx = bx - ax; const vy = by - ay;
        const t = Math.max(0, Math.min(1, ((fx - ax) * vx + (fy - ay) * vy) / (vx * vx + vy * vy || 1)));
        d = Math.min(d, Math.hypot(fx - ax - vx * t, fy - ay - vy * t));
      }
      for (const [dx, dy] of dots) d = Math.min(d, Math.hypot(fx - dx, fy - dy) - half * 0.25);
      // Positive is ink: inside the body for the hand; on the pen line around it for the outline.
      field[j * w + i] = face === 'hand' ? half - d : pen / 2 - Math.abs(d - (half - pen / 2));
    }
  }
  const loops = orient(contours(field, w, h).map((l) => simplify(l, 0.3)));
  const curves = loops.map(smooth).map((c) => c.map((seg) => seg.map((v, k) => (k % 2 === 0 ? x0 + v / scale : y1 - v / scale))));
  return { curves, minX: minX - half, maxX: maxX + half };
}

/* ─── Tuning: a Spw expression sets how the hand is projected ─────────
 * spwashi@<lore.land>.{ ~wobble %weight … } — each operator a dial, read as the language reads it:
 *   ~ potential  how much the hand wanders (whimsy)        % measure  how heavy the line (weight)
 *   @ vantage    how far it leans (slant)                  . ground   how the letters settle on the line
 *   ^ integrate  how they rise and bounce                  ! action   pressure: the line swells
 *   ? probe      each letter tilts, asking                 * value    as scanned: nothing moves
 *   # annotate   the measure shows: boxes, lines, kinds     & confluence  the outline over the hand
 *   = config     the seed (which way it all wanders)       $ substrate   the paper shows through
 * A dial is the operator with a number (~1.5, @-8, %0.8) or bare (~ alone is ~1). The scheme's own words are
 * kept as written: spwashi@ who, <lore.land> through what, .{ grounded, open. */
export const DIALS = Object.freeze({
  '~': { key: 'wobble', bare: 1, says: 'how much the hand wanders' },
  '%': { key: 'weight', bare: 1, says: 'how heavy the line' },
  '@': { key: 'slant', bare: 8, says: 'how far it leans' },
  '.': { key: 'settle', bare: 1, says: 'how the letters sit on the line' },
  '^': { key: 'bounce', bare: 1, says: 'how they rise and fall' },
  '!': { key: 'pressure', bare: 1, says: 'where the line swells' },
  '?': { key: 'tilt', bare: 1, says: 'how each letter tilts, asking' },
  '*': { key: 'asScanned', bare: 1, says: 'as scanned: nothing moves' },
  '#': { key: 'measure', bare: 1, says: 'the measure shows' },
  '&': { key: 'layered', bare: 1, says: 'the outline over the hand' },
  '=': { key: 'seed', bare: 7, says: 'which way it all wanders' },
  '$': { key: 'paper', bare: 1, says: 'the paper shows through' }
});

export const DEFAULT_TUNING = Object.freeze({ wobble: 0, weight: 1, slant: 0, settle: 0, bounce: 0, pressure: 0, tilt: 0, asScanned: 0, measure: 0, layered: 0, seed: 7, paper: 0, face: 'outline', boxed: true });

/** Read a tuning expression. Unknown words are kept (as `words`) and do nothing; nothing in it can break the page. */
export function readTuning(expression = '') {
  const tuning = { ...DEFAULT_TUNING, words: [] };
  const text = String(expression);
  // The scheme: a body left open lays the letters in blocks; closed, they run free.
  const opens = (text.match(/\{/g) || []).length;
  const closes = (text.match(/\}/g) || []).length;
  tuning.boxed = !text.includes('{') || opens > closes;
  if (/\bhand\b/.test(text)) tuning.face = 'hand';
  if (/\boutline\b/.test(text)) tuning.face = 'outline';
  // Operators with a number (or bare) in the body; the scheme's own @ and . before the body are words.
  const body = text.includes('{') ? text.slice(text.indexOf('{') + 1) : text;
  for (const m of body.matchAll(/([~%@.^!?*#&=$])(-?\d+(?:\.\d+)?)?([a-z][\w-]*)?/gi)) {
    const dial = DIALS[m[1]];
    if (!dial) continue;
    const value = m[2] !== undefined ? Number(m[2]) : dial.bare;
    if (Number.isFinite(value)) tuning[dial.key] = Math.max(-40, Math.min(40, value));
    if (m[3]) tuning.words.push(`${m[1]}${m[3]}`);
  }
  if (tuning.asScanned) Object.assign(tuning, { wobble: 0, slant: 0, settle: 0, bounce: 0, pressure: 0, tilt: 0 });
  return tuning;
}

/* ─── What the pen draws: skeletons for what the scan does not hold ─────────
 * Font units on the hand's 700 cap height, y up. A stroke is a polyline; `{ dot }` is a dot. Each mark is
 * drawn as this hand would draw it (the alphabet's own proportions: round, upright, a little loose), and is
 * replaced when a lettered one comes in from a scan. */
const flipX = (strokes, axis) => strokes.map((s) => (s.dot ? { dot: [axis * 2 - s.dot[0], s.dot[1]] } : s.map(([x, y]) => [axis * 2 - x, y])));
const sGlyph = [[...arc(300, 520, 170, 160, 30, 270, 14), ...arc(300, 190, 180, 170, 90, -150, 16)]];
const brace = [[[380, 770], [300, 740], [280, 560], [280, 420], [190, 340], [280, 260], [280, 100], [300, -60], [380, -90]]];
const paren = [arc(470, 330, 280, 560, 135, 225, 16)];
const bracket = [[[330, 760], [180, 760], [180, -80], [330, -80]]];
const angle = [[[440, 600], [150, 340], [440, 80]]];
const slash = [[[460, 760], [140, -60]]];
export const SKELETONS = Object.freeze({
  0: [arc(300, 340, 190, 340, 90, 450, 40)],
  1: [[[200, 560], [320, 690], [320, 0]]],
  2: [[...arc(300, 500, 180, 180, 165, -30, 16), [140, 0], [480, 0]]],
  3: [[...arc(290, 520, 160, 170, 150, -90, 16), ...arc(290, 180, 190, 180, 90, -150, 18)]],
  4: [[[410, 0], [410, 690], [100, 230], [520, 230]]],
  5: [[[470, 690], [180, 690], [160, 420], ...arc(300, 230, 190, 220, 140, -160, 18)]],
  6: [[...arc(320, 450, 190, 250, 70, 180, 8), ...arc(300, 210, 190, 210, 180, 540, 24)]],
  7: [[[110, 690], [490, 690], [230, 0]]],
  8: [arc(300, 520, 150, 170, 0, 360, 24), arc(300, 180, 185, 180, 0, 360, 24)],
  9: [[...arc(300, 480, 180, 210, -20, 340, 24), [420, 0]]],
  '.': [{ dot: [100, 45] }],
  ',': [[[110, 70], [80, -110]]],
  ':': [{ dot: [100, 45] }, { dot: [100, 380] }],
  ';': [{ dot: [100, 380] }, [[110, 70], [80, -110]]],
  '!': [[[130, 690], [130, 230]], { dot: [130, 45] }],
  '?': [[...arc(290, 520, 170, 170, 160, -40, 14), [300, 330], [300, 230]], { dot: [300, 45] }],
  "'": [[[110, 700], [110, 540]]],
  '"': [[[100, 700], [100, 540]], [[220, 700], [220, 540]]],
  '’': [[[130, 700], [130, 610], [90, 520]]],
  '‘': [[[90, 520], [90, 610], [130, 700]]],
  '“': [[[90, 520], [90, 610], [130, 700]], [[210, 520], [210, 610], [250, 700]]],
  '”': [[[130, 700], [130, 610], [90, 520]], [[250, 700], [250, 610], [210, 520]]],
  '-': [[[100, 300], [340, 300]]],
  '–': [[[90, 300], [430, 300]]],
  '—': [[[80, 300], [700, 300]]],
  '/': slash,
  '\\': flipX(slash, 300),
  '(': paren,
  ')': flipX(paren, 300),
  '[': bracket,
  ']': flipX(bracket, 255),
  '{': brace,
  '}': flipX(brace, 285),
  '<': angle,
  '>': flipX(angle, 295),
  '~': [Array.from({ length: 13 }, (_, i) => [80 + i * 37, 330 + Math.sin((i / 12) * Math.PI * 2) * 60])],
  '@': [arc(320, 330, 110, 130, 0, 360, 20), [[430, 450], [430, 230], [500, 200], [570, 260], ...arc(330, 330, 250, 300, 10, 330, 30)]],
  '&': [[[540, 30], [300, 330], [180, 470], [190, 620], [280, 690], [360, 630], [350, 520], [150, 330], [110, 160], [200, 30], [330, 20], [460, 140], [520, 260]]],
  '*': [[[300, 670], [300, 370]], [[170, 595], [430, 445]], [[170, 445], [430, 595]]],
  '^': [[[120, 430], [300, 700], [480, 430]]],
  '#': [[[230, 640], [200, 60]], [[400, 640], [370, 60]], [[100, 450], [520, 450]], [[90, 250], [510, 250]]],
  '=': [[[110, 420], [490, 420]], [[110, 240], [490, 240]]],
  '%': [arc(160, 560, 80, 100, 0, 360, 16), arc(440, 140, 80, 100, 0, 360, 16), [[470, 700], [130, 0]]],
  '$': [...sGlyph, [[300, 780], [300, -80]]],
  '+': [[[300, 520], [300, 140]], [[120, 330], [480, 330]]],
  '_': [[[60, -80], [540, -80]]],
  '|': [[[130, 760], [130, -80]]],
  '…': [{ dot: [100, 45] }, { dot: [260, 45] }, { dot: [420, 45] }],
  '·': [{ dot: [100, 330] }]
});
