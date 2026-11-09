#!/usr/bin/env node
/**
 * build-hand.mjs — the spwashi font set (npm run font:hand): spwashi@<lore.land>.{
 *
 * Reads the trace (book/fonts/spwashi/letters.json, made by font:trace from the alphabet blocks) and writes two
 * faces of one hand:
 *   Spwashi Outline   the pen line as lettered (each stroke a closed line around its body)
 *   Spwashi Hand      the strokes filled
 * and book/fonts/spwashi/hand.json, the set's own record: every glyph lettered (traced from a box on the sheet)
 * or penned (drawn by a pen measured from the hand, waiting for a lettered one), the pen's measure, and the
 * outlines the letters page tunes live.
 *
 * Text wants letters to keep to a line more than a page of boxes does: the small letters' heights are drawn
 * halfway to their kind's middle (x-height, ascender), each still its own size; the trace keeps them as lettered.
 */
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKELETONS, inkSkeleton } from '../../../modules/spwashi-hand.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const DIR = resolve(ROOT, 'book/fonts/spwashi');
const trace = JSON.parse(readFileSync(resolve(DIR, 'letters.json'), 'utf8'));
const CAP = trace.cap;
const SIDE = { upper: 46, lower: 36, mark: 40 };

/* ─── Geometry on the trace's quadratic contours ─── */
const points = (contour, steps = 4) => {
  const out = [contour[0]];
  let [px, py] = contour[0];
  contour.slice(1).forEach(([cx, cy, x, y]) => {
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      out.push([(1 - t) ** 2 * px + 2 * (1 - t) * t * cx + t * t * x, (1 - t) ** 2 * py + 2 * (1 - t) * t * cy + t * t * y]);
    }
    [px, py] = [x, y];
  });
  return out;
};
const bounds = (contours) => {
  const all = contours.flatMap((c) => points(c, 2));
  return { minX: Math.min(...all.map((p) => p[0])), maxX: Math.max(...all.map((p) => p[0])), minY: Math.min(...all.map((p) => p[1])), maxY: Math.max(...all.map((p) => p[1])) };
};
const crossings = (contours, y) => contours.flatMap((c) => {
  const pts = points(c, 6);
  const xs = [];
  pts.forEach(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
  });
  return xs;
}).sort((a, b) => a - b);
const mapContours = (contours, f) => contours.map((c) => c.map((seg) => {
  const out = [];
  for (let k = 0; k < seg.length; k += 2) out.push(...f(seg[k], seg[k + 1]));
  return out.map((v) => Math.round(v));
}));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/* ─── The pen, measured: a stem's outline crossed at half height gives four edges — two pen lines ─── */
const stems = [['I', 0.5], ['H', 0.3], ['L', 0.5], ['T', 0.45], ['E', 0.25], ['F', 0.3], ['l', 0.5], ['P', 0.3]];
const samples = stems.map(([ch, at]) => {
  const g = trace.letters[ch];
  if (!g) return null;
  const b = bounds(g.outline);
  const xs = crossings(g.outline, b.minY + (b.maxY - b.minY) * at);
  return xs.length >= 4 ? { pen: ((xs[1] - xs[0]) + (xs[3] - xs[2])) / 2, body: xs[3] - xs[0] } : null;
}).filter(Boolean);
const PEN = { pen: Math.round(median(samples.map((s) => s.pen))), body: Math.round(median(samples.map((s) => s.body))) };

/* ─── The small letters, drawn halfway to their kind's middle ─── */
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const tops = Object.fromEntries([...LOWER].filter((c) => trace.letters[c]).map((c) => [c, bounds(trace.letters[c].hand).maxY]));
const xKind = [...'acemnorsuvwxz'].filter((c) => tops[c]);
const XH = median(xKind.map((c) => tops[c]));
const ascKind = [...LOWER].filter((c) => tops[c] && tops[c] > XH * 1.3 && !'ij'.includes(c));
const ASC = median(ascKind.map((c) => tops[c]));
const evenOf = (ch) => {
  if (!LOWER.includes(ch) || 'ij'.includes(ch)) return 1;
  const goal = ascKind.includes(ch) ? ASC : XH;
  return Math.sqrt(goal / tops[ch]);
};

/* ─── Glyphs ─── */
const glyphs = [];
const record = {};
const add = (ch, faces, kind, from) => {
  const side = kind === 'penned' ? SIDE.mark : ch === ch.toUpperCase() && /[A-Z]/.test(ch) ? SIDE.upper : SIDE.lower;
  const b = bounds([...faces.outline, ...faces.hand]);
  const shift = side - b.minX;
  const placed = { outline: mapContours(faces.outline, (x, y) => [x + shift, y]), hand: mapContours(faces.hand, (x, y) => [x + shift, y]) };
  const advance = Math.round(b.maxX - b.minX + side * 2);
  glyphs.push({ ch, advance, ...placed });
  record[ch] = { kind, from, advance, outline: placed.outline, hand: placed.hand };
};
for (const [ch, g] of Object.entries(trace.letters)) {
  const s = evenOf(ch);
  const even = (c) => mapContours(c, (x, y) => [x * s, y * s]);
  add(ch, { outline: even(g.outline), hand: even(g.hand) }, 'lettered', { piece: trace.source.id, box: g.from.box, row: g.from.row, place: g.from.place, evened: +s.toFixed(3) });
}
const penOptions = { body: PEN.body, pen: PEN.pen, wobble: 0.6, scale: 0.2 };
for (const [ch, skeleton] of Object.entries(SKELETONS)) {
  if (record[ch]) continue;
  const seed = ch.codePointAt(0);
  add(ch, {
    outline: inkSkeleton(skeleton, { ...penOptions, face: 'outline', seed }).curves,
    hand: inkSkeleton(skeleton, { ...penOptions, face: 'hand', seed }).curves
  }, 'penned', { skeleton: ch, seed });
}

/* ─── Fonts ─── */
const space = { ch: ' ', advance: Math.round(XH * 0.62), outline: [], hand: [] };
const allY = glyphs.flatMap((g) => g.hand.flatMap((c) => points(c, 1).map((p) => p[1])));
const ASCENDER = Math.max(900, Math.ceil(Math.max(...allY) / 10) * 10 + 40);
const DESCENDER = Math.min(-250, Math.floor(Math.min(...allY) / 10) * 10 - 40);
const toPath = (contours) => {
  const path = new opentype.Path();
  contours.forEach((c) => {
    path.moveTo(c[0][0], c[0][1]);
    c.slice(1).forEach(([cx, cy, x, y]) => path.quadraticCurveTo(cx, cy, x, y));
    path.close();
  });
  return path;
};
const nameOf = (ch) => (ch === ' ' ? 'space' : /[A-Za-z0-9]/.test(ch) ? ch : `uni${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
for (const [face, family] of [['outline', 'Spwashi Outline'], ['hand', 'Spwashi Hand']]) {
  const notdef = new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: new opentype.Path() });
  const font = new opentype.Font({
    familyName: family,
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: ASCENDER,
    descender: DESCENDER,
    designer: 'spwashi (lettered by hand: the alphabet blocks, 2026-10-22)',
    description: 'spwashi@<lore.land>.{ — a hand lettered on paper, traced, with a pen measured from it for what the page did not hold.',
    glyphs: [notdef, ...[space, ...glyphs].map((g) => new opentype.Glyph({ name: nameOf(g.ch), unicode: g.ch.codePointAt(0), advanceWidth: g.advance, path: toPath(g[face]) }))]
  });
  const file = resolve(DIR, `${family.replace(/\s+/g, '')}.otf`);
  writeFileSync(file, Buffer.from(font.toArrayBuffer()));
  console.log(`[font:hand] ${file.replace(`${ROOT}/`, '')} · ${glyphs.length + 1} glyphs`);
}

/* ─── The set's record ─── */
const lettered = Object.values(record).filter((r) => r.kind === 'lettered').length;
writeFileSync(resolve(DIR, 'hand.json'), `${JSON.stringify({
  note: 'The spwashi font set (book/scripts/tools/font/hand/build-hand.mjs): spwashi@<lore.land>.{ — the hand, depicted through lore.land, the set left open. lettered = traced from a box on the alphabet blocks; penned = drawn by the pen measured from the hand, until a lettered one comes. Outlines are quadratic, in font units (cap 700, baseline 0, y up), placed in their advance.',
  scheme: 'spwashi@<lore.land>.{',
  source: trace.source,
  metrics: { cap: CAP, xHeight: Math.round(XH), ascender: Math.round(ASC), lineAscender: ASCENDER, lineDescender: DESCENDER, space: space.advance },
  pen: { ...PEN, says: 'pen = the line the hand draws with; body = a stroke\'s width, line to line (font units)' },
  counts: { lettered, penned: Object.keys(record).length - lettered },
  glyphs: record
})}\n`);
console.log(`[font:hand] book/fonts/spwashi/hand.json · ${lettered} lettered, ${Object.keys(record).length - lettered} penned · pen ${PEN.pen}, body ${PEN.body} · x-height ${Math.round(XH)}`);
