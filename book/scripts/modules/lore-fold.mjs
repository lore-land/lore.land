/**
 * lore-fold.mjs — the map that will not lie flat (topics page, #fold).
 *
 * The map-house keeps one round map for things that will not lie flat: every
 * thread, mark, voice, lean, wonder and material in the book, folded onto a
 * disk the way frill-lichen folds onto a stone — more edge than room. It is a
 * Poincaré disk: whatever you look at opens out at the middle, everything else
 * folds toward the rim and never falls off it. Touch a place and the map turns
 * it to the middle (a Möbius turn of the disk).
 *
 * Ask it in Spw. An expression is the source; the map, the chapters and the
 * page's own cards take its gradient:
 *
 *   #egg      a mark (motif · trope · foreshadow)      # annotation, extrinsic
 *   @boof     a voice                                  @ perspective
 *   ~wonder   a thread                                 ~ potential, a current
 *   =bane     a lean of the three lands                = config, the bias
 *   *torch-ants  a wonder from the almanac             * value, the concrete
 *   $glass    a material                               $ substrate
 *   .14       a chapter                                . ground
 *   egg       a bare word: anything named so
 *   a b       superposed: both, summed
 *   &[a, b]   confluence: only where both run together
 *   ^a        integration: lift it to the chapters, turn to the strongest
 *   %a        measure: show the numbers
 *   !a        action: offer the way to its strongest place
 *
 * The gradient runs outward: what matches is lit, the chapters it runs through
 * warm by how much, and everything sharing those chapters warms a little after
 * them. It writes tokens as it goes — --fold-w on each lit topic card on the
 * page, --fold-boon / --fold-bane / --fold-bone / --fold-heat on the map — so
 * the page's own components lean with the question (components/fold.css).
 * ?fold= in the address asks it on arrival, so an expression can be shared.
 */

import { semanticIndex } from './constellation.mjs?v=2026_11_08.J';

const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
const pad = (n) => String(n).padStart(2, '0');
const SVG = 'http://www.w3.org/2000/svg';
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const FAMILIES = Object.freeze([
  { id: 'chapter', sigil: '.', label: 'chapters' },
  { id: 'thread', sigil: '~', label: 'threads' },
  { id: 'motif', sigil: '#', label: 'motifs' },
  { id: 'trope', sigil: '#', label: 'tropes' },
  { id: 'foreshadow', sigil: '#', label: 'foreshadowings' },
  { id: 'voice', sigil: '@', label: 'voices' },
  { id: 'lean', sigil: '=', label: 'the three lands' },
  { id: 'material', sigil: '$', label: 'materials' },
  { id: 'wonder', sigil: '*', label: 'wonders' }
]);
const SIGIL_FAMILIES = Object.freeze({ '#': ['motif', 'trope', 'foreshadow'], '@': ['voice'], '~': ['thread'], '=': ['lean'], '*': ['wonder'], '.': ['chapter'], '$': ['material'] });
const EXAMPLES = Object.freeze(['#egg @boof', '$glass', '&[#hat, =bane]', '^*torch-ants', '~wonder =boon', '%#feast', '!.14']);

/* ─── Complex numbers on the disk ─── */
const cx = (re, im = 0) => ({ re, im });
const add = (a, b) => cx(a.re + b.re, a.im + b.im);
const sub = (a, b) => cx(a.re - b.re, a.im - b.im);
const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conj = (a) => cx(a.re, -a.im);
const div = (a, b) => { const d = b.re * b.re + b.im * b.im || 1e-12; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const abs2 = (a) => a.re * a.re + a.im * a.im;
/** The Möbius turn that brings a to the middle. */
const mobius = (z, a) => div(sub(z, a), sub(cx(1), mul(conj(a), z)));
const polar = (r, t) => cx(r * Math.cos(t), r * Math.sin(t));

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([key, value]) => { if (value != null) node.setAttribute(key, String(value)); });
  return node;
}
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

/* ─── The space: every key of the semantic index, with the places it runs through ─── */
function buildSpace(index) {
  const nodes = [];
  const byId = new Map();
  const addNode = (node) => { nodes.push(node); byId.set(node.id, node); return node; };
  const places = (list) => (list || []).map((p) => ({ c: Number(p.c), id: p.id, label: p.label }));
  const root = addNode({ id: 'book', family: 'root', label: 'the book', places: [] });
  const keys = { chapter: [], thread: [], motif: [], trope: [], foreshadow: [], voice: [], lean: [], material: [], wonder: [] };
  (index.chapters || []).forEach((c) => keys.chapter.push({ key: String(c.n), label: `${c.n} · ${c.title}`, places: [{ c: c.n, id: '', label: c.title }] }));
  Object.entries(index.threads || {}).forEach(([key, t]) => keys.thread.push({ key, label: t.label || key, places: Object.entries(t.chapters || {}).flatMap(([c, list]) => list.map((p) => ({ c: Number(c), id: p.id, label: p.label, n: p.n }))) }));
  ['motif', 'trope', 'foreshadow'].forEach((kind) => Object.entries(index.marks?.[kind] || {}).forEach(([key, list]) => keys[kind].push({ key, label: key.replace(/-/g, ' '), places: places(list) })));
  Object.entries(index.voices || {}).forEach(([key, list]) => keys.voice.push({ key, label: key, places: places(list) }));
  Object.entries(index.leans || {}).forEach(([key, list]) => keys.lean.push({ key, label: { boon: 'boon · fairy tale', bane: 'bane · absurd reality', bone: 'bone · low magic' }[key] || key, places: places(list) }));
  Object.entries(index.materials || {}).forEach(([key, m]) => keys.material.push({ key, label: m.label, sigil: m.sigil, places: Object.entries(m.chapters || {}).map(([c, p]) => ({ c: Number(c), id: p.id, label: p.label, n: p.n })) }));
  Object.entries(index.wonders || {}).forEach(([key, list]) => keys.wonder.push({ key, label: key.replace(/-/g, ' '), places: places(list) }));

  // A hyperbolic tree: the book at the middle, families a step out, their keys a step beyond.
  const live = FAMILIES.filter((f) => keys[f.id].length);
  const weights = live.map((f) => Math.sqrt(keys[f.id].length) + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let angle = -Math.PI / 2;
  live.forEach((family, i) => {
    const wedge = (weights[i] / total) * Math.PI * 2;
    const mid = angle + wedge / 2;
    const hub = addNode({ id: `family:${family.id}`, family: 'hub', of: family.id, label: family.label, sigil: family.sigil, base: polar(Math.tanh(1.5 / 2), mid), places: [] });
    hub.parent = root;
    const list = keys[family.id];
    list.forEach((k, j) => {
      const t = angle + wedge * ((j + 0.5) / list.length);
      const depth = 3.2 + (list.length > 30 ? (j % 3) * 0.55 : 0);   // a crowded family folds in a few rows
      const node = addNode({ id: `${family.id}:${k.key}`, family: family.id, key: k.key, label: k.label, sigil: k.sigil || family.sigil, places: k.places, base: polar(Math.tanh(depth / 2), t) });
      node.parent = hub;
      node.chapters = new Set(k.places.map((p) => p.c));
    });
    angle += wedge;
  });
  root.base = cx(0);
  return { nodes, byId, root };
}

/* ─── Spw, read as a question for the map ─── */
function splitItems(source) {
  const items = [];
  let depth = 0;
  let current = '';
  for (const ch of source.trim()) {
    if (ch === '[') depth += 1;
    if (ch === ']') depth -= 1;
    if (/\s/.test(ch) && depth === 0) {
      if (current) items.push(current);
      current = '';
    } else current += ch;
  }
  if (current) items.push(current);
  return items;
}

/** Keys an item names, with how strongly (exact 1, partial 0.7). */
function resolveTerm(space, sigil, word) {
  const families = SIGIL_FAMILIES[sigil] || FAMILIES.map((f) => f.id);
  const w = word.toLowerCase().replace(/_/g, '-');
  const out = new Map();
  space.nodes.forEach((node) => {
    if (!families.includes(node.family)) return;
    const key = String(node.key || '').toLowerCase();
    const label = String(node.label || '').toLowerCase();
    if (key === w) out.set(node.id, 1);
    else if (w.length >= 3 && (key.includes(w) || label.includes(w.replace(/-/g, ' ')))) out.set(node.id, Math.max(out.get(node.id) || 0, 0.7));
  });
  return out;
}

function evaluate(space, source) {
  const flags = { integrate: false, measure: false, act: false };
  const parseItem = (raw) => {
    let item = raw.trim();
    while (/^[\^%!?]/.test(item)) {
      const p = item[0];
      if (p === '^') flags.integrate = true;
      if (p === '%') flags.measure = true;
      if (p === '!') flags.act = true;
      item = item.slice(1);
    }
    const confluence = /^&\[(.*)\]$/.exec(item);
    if (confluence) {
      const parts = confluence[1].split(',').map((part) => part.trim()).filter(Boolean).map(parseItem);
      return { confluence: parts };
    }
    const m = /^([#@~=*.$]?)(.+)$/.exec(item);
    return m ? { sigil: m[1], word: m[2] } : null;
  };
  const items = splitItems(source).map(parseItem).filter(Boolean);
  const seeds = new Map();
  const unknown = [];
  const chapterOf = (map) => {
    const ch = new Map();
    map.forEach((w, id) => {
      const node = space.byId.get(id);
      node?.places.forEach((p) => ch.set(p.c, Math.max(ch.get(p.c) || 0, w)));
    });
    return ch;
  };
  let confluenceChapters = null;
  items.forEach((item) => {
    if (item.confluence) {
      // Confluence: only the chapters every part runs through, at the weakest part's strength.
      const maps = item.confluence.map((part) => (part?.confluence ? new Map() : resolveTerm(space, part?.sigil, part?.word || '')));
      maps.forEach((map) => map.forEach((w, id) => seeds.set(id, Math.max(seeds.get(id) || 0, w * 0.8))));
      const chapterMaps = maps.map(chapterOf);
      const meet = new Map();
      for (let c = 1; c <= 15; c += 1) {
        const v = Math.min(...chapterMaps.map((m) => m.get(c) || 0));
        if (v > 0) meet.set(c, v);
      }
      confluenceChapters = confluenceChapters || new Map();
      meet.forEach((v, c) => confluenceChapters.set(c, Math.max(confluenceChapters.get(c) || 0, v)));
      if (!maps.some((m) => m.size)) unknown.push(item.confluence.map((p) => p?.word).join(', '));
      return;
    }
    const found = resolveTerm(space, item.sigil, item.word);
    if (!found.size) unknown.push(`${item.sigil}${item.word}`);
    found.forEach((w, id) => seeds.set(id, Math.max(seeds.get(id) || 0, w)));
  });

  // The gradient: seeds → the chapters they run through → everything that shares them.
  const chapterW = new Map();
  if (confluenceChapters) confluenceChapters.forEach((v, c) => chapterW.set(c, v));
  else {
    seeds.forEach((w, id) => {
      const node = space.byId.get(id);
      if (!node) return;
      if (node.family === 'chapter') { chapterW.set(Number(node.key), Math.max(chapterW.get(Number(node.key)) || 0, w)); return; }
      const counts = new Map();
      node.places.forEach((p) => counts.set(p.c, (counts.get(p.c) || 0) + (p.n || 1)));
      const max = Math.max(1, ...counts.values());
      counts.forEach((n, c) => chapterW.set(c, (chapterW.get(c) || 0) + w * (0.35 + 0.65 * (n / max))));
    });
  }
  const chMax = Math.max(0, ...chapterW.values());
  if (chMax > 0) chapterW.forEach((v, c) => chapterW.set(c, v / chMax));
  const weights = new Map(seeds);
  // Contrast: something warms only as far as it gathers in the question's strong chapters more than the book does overall.
  const meanW = Array.from({ length: 15 }, (_, i) => chapterW.get(i + 1) || 0).reduce((a, b) => a + b, 0) / 15;
  space.nodes.forEach((node) => {
    if (node.family === 'chapter') {
      const v = chapterW.get(Number(node.key)) || 0;
      if (v) weights.set(node.id, Math.max(weights.get(node.id) || 0, v));
      return;
    }
    if (!node.chapters || weights.has(node.id)) return;
    let sum = 0;
    node.chapters.forEach((c) => { sum += chapterW.get(c) || 0; });
    const avg = node.chapters.size ? sum / node.chapters.size : 0;
    const v = Math.max(0, avg - meanW) * 0.9;
    if (v > 0.06) weights.set(node.id, v);
  });
  // The strongest places: each lit key's anchors, ranked by its weight and its chapter's.
  const placesRanked = [];
  weights.forEach((w, id) => {
    const node = space.byId.get(id);
    if (!node || node.family === 'chapter' || w < 0.5) return;
    node.places.forEach((p) => { if (p.id) placesRanked.push({ node, place: p, score: w * (0.5 + (chapterW.get(p.c) || 0)) }); });
  });
  placesRanked.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const top = placesRanked.filter(({ place }) => { const k = `${place.c}#${place.id}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
  return { items, seeds, weights, chapterW, top, unknown, flags };
}

/* ─── The map ─── */
export async function initLoreFold(mount = document.querySelector('[data-lore-fold]')) {
  if (!mount) return () => {};
  const index = await semanticIndex().catch(() => null);
  if (!index) {
    mount.hidden = true;
    return () => {};
  }
  const space = buildSpace(index);
  const disk = svg('svg', { viewBox: '-1.08 -1.08 2.16 2.16', class: 'fold-disk', 'aria-hidden': 'true' });
  const rim = svg('circle', { cx: 0, cy: 0, r: 1, class: 'fold-rim' });
  const edges = svg('g', { class: 'fold-edges' });
  const links = svg('g', { class: 'fold-links' });
  const dots = svg('g', { class: 'fold-dots' });
  disk.append(rim, edges, links, dots);

  const form = el('form', { className: 'fold-ask', role: 'search' },
    el('label', { for: 'fold-expr', className: 'fold-ask-label' }, 'Ask the map, in Spw'),
    el('span', { className: 'fold-ask-row' },
      el('input', { id: 'fold-expr', name: 'fold', type: 'text', className: 'fold-input', spellcheck: 'false', autocomplete: 'off', placeholder: '#egg @boof' }),
      el('button', { type: 'submit', className: 'fold-go' }, 'Fold')));
  const examples = el('p', { className: 'fold-examples' }, 'Try ', ...EXAMPLES.flatMap((ex, i) => [i ? ' ' : '', el('button', { type: 'button', className: 'fold-example', 'data-expr': ex }, ex)]));
  const strip = el('ol', { className: 'fold-chapters', 'aria-label': 'Where it runs, chapter by chapter' });
  const said = el('p', { className: 'fold-said', 'aria-live': 'polite' });
  const top = el('ol', { className: 'fold-places' });
  const focusOut = el('p', { className: 'fold-focus' });
  mount.querySelector('[data-lore-fold-body]')?.replaceChildren(
    el('div', { className: 'fold-stage' }, disk, focusOut),
    el('div', { className: 'fold-panel' }, form, examples, said, strip, top));

  const input = form.querySelector('input');
  const nodeEls = new Map();
  space.nodes.forEach((node) => {
    const g = svg('g', { class: `fold-node is-${node.family}` });
    const dot = svg('circle', { r: 0.01 });
    const text = svg('text', { 'text-anchor': 'middle' });
    text.textContent = node.family === 'hub' ? `${node.sigil} ${node.label}` : node.family === 'root' ? 'the book' : node.label;
    g.append(dot, text);
    g.addEventListener('click', () => turnTo(node));
    dots.append(g);
    nodeEls.set(node.id, { g, dot, text });
  });

  let focus = cx(0);
  let target = cx(0);
  let focused = space.root;
  let result = null;
  let raf = 0;

  // A geodesic between two points of the disk: an arc of the circle meeting the rim square-on.
  const geodesic = (p, q) => {
    const cross = p.re * q.im - p.im * q.re;
    if (Math.abs(cross) < 1e-4) return `M${p.re.toFixed(4)},${p.im.toFixed(4)}L${q.re.toFixed(4)},${q.im.toFixed(4)}`;
    const a1 = (abs2(p) + 1) / 2;
    const a2 = (abs2(q) + 1) / 2;
    const det = p.re * q.im - p.im * q.re;
    const c = cx((a1 * q.im - a2 * p.im) / det, (p.re * a2 - q.re * a1) / det);
    const r = Math.sqrt(Math.max(1e-9, abs2(c) - 1));
    const sweep = cross > 0 ? 0 : 1;
    return `M${p.re.toFixed(4)},${p.im.toFixed(4)}A${r.toFixed(4)},${r.toFixed(4)} 0 0 ${sweep} ${q.re.toFixed(4)},${q.im.toFixed(4)}`;
  };

  function render() {
    const at = new Map();
    space.nodes.forEach((node) => at.set(node.id, mobius(node.base, focus)));
    edges.replaceChildren();
    links.replaceChildren();
    space.nodes.forEach((node) => {
      const z = at.get(node.id);
      const scale = 1 - abs2(z);   // the conformal factor: room runs out toward the rim
      const w = result?.weights.get(node.id) || 0;
      const { g, dot, text } = nodeEls.get(node.id);
      const base = node.family === 'root' ? 0.05 : node.family === 'hub' ? 0.04 : node.family === 'chapter' ? 0.032 : 0.024;
      dot.setAttribute('cx', z.re.toFixed(4));
      dot.setAttribute('cy', z.im.toFixed(4));
      dot.setAttribute('r', Math.max(0.002, base * scale * (1 + w * 0.8)).toFixed(4));
      g.style.setProperty('--fold-w', w.toFixed(3));
      g.classList.toggle('is-lit', w > 0.04);
      g.classList.toggle('is-seed', Boolean(result?.seeds.has(node.id)));
      g.classList.toggle('is-focus', node === focused);
      const size = 0.075 * scale;
      const show = size > 0.022 || (w > 0.5 && size > 0.012);
      text.setAttribute('x', z.re.toFixed(4));
      text.setAttribute('y', (z.im - base * scale - 0.012).toFixed(4));
      text.setAttribute('font-size', Math.max(0.018, Math.min(0.06, size)).toFixed(4));
      text.style.display = show ? '' : 'none';
      if (node.parent) {
        const path = svg('path', { d: geodesic(at.get(node.parent.id), z), class: node.family === 'hub' ? 'is-trunk' : '' });
        if (w > 0.04) path.classList.add('is-lit');
        edges.append(path);
      }
    });
    // The focused place's own threads: geodesics to every chapter it runs through.
    if (focused && focused.chapters) {
      focused.chapters.forEach((c) => {
        const ch = space.byId.get(`chapter:${c}`);
        if (ch) links.append(svg('path', { d: geodesic(at.get(focused.id), at.get(ch.id)) }));
      });
    }
  }

  function animate() {
    cancelAnimationFrame(raf);
    const step = () => {
      const d = sub(target, focus);
      if (abs2(d) < 1e-6 || reduced?.matches) {
        focus = target;
        render();
        return;
      }
      focus = add(focus, cx(d.re * 0.18, d.im * 0.18));
      render();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function describeFocus() {
    if (!focused || focused === space.root) {
      focusOut.textContent = 'The book at the middle. Touch anything to turn it there.';
      return;
    }
    const where = [...(focused.chapters || [])].sort((a, b) => a - b);
    const first = focused.places.find((p) => p.id) || focused.places[0];
    focusOut.replaceChildren(
      el('strong', {}, `${focused.sigil || ''}${focused.family === 'chapter' ? '' : focused.key || ''} `),
      `${focused.label}${where.length ? ` · runs through ${where.length === 1 ? 'Chapter' : 'Chapters'} ${where.join(', ')}` : ''}. `,
      first ? el('a', { href: `/book/chapter/${pad(first.c)}/${first.id ? `#${first.id}` : ''}` }, 'Read it there →') : null,
      ' ',
      focused.family !== 'hub' && focused.family !== 'root' ? el('button', { type: 'button', className: 'fold-example', 'data-expr': `${focused.sigil === '.' ? '.' : focused.sigil || ''}${focused.key}` }, 'Ask the map about it') : null);
  }

  function turnTo(node) {
    focused = node;
    target = node.base;
    describeFocus();
    animate();
  }

  function ask(source, { keep = true } = {}) {
    const expr = String(source || '').trim();
    input.value = expr;
    if (keep) {
      try {
        const url = new URL(location.href);
        if (expr) url.searchParams.set('fold', expr); else url.searchParams.delete('fold');
        history.replaceState(null, '', `${url.pathname}${url.search}#fold`);
      } catch { /* the address stays as it was */ }
    }
    if (!expr) {
      result = null;
      paintResult();
      render();
      return;
    }
    result = evaluate(space, expr);
    paintResult();
    // Integration and action turn the map to the strongest chapter or place; otherwise to the first thing named.
    const strongestChapter = [...result.chapterW.entries()].sort((a, b) => b[1] - a[1])[0];
    const seed = [...result.seeds.entries()].sort((a, b) => b[1] - a[1])[0];
    if ((result.flags.integrate || !seed) && strongestChapter) turnTo(space.byId.get(`chapter:${strongestChapter[0]}`));
    else if (seed) turnTo(space.byId.get(seed[0]));
    else render();
  }

  function paintResult() {
    const tokens = mount.style;
    const lean = (key) => (result?.weights.get(`lean:${key}`) || 0).toFixed(3);
    tokens.setProperty('--fold-boon', lean('boon'));
    tokens.setProperty('--fold-bane', lean('bane'));
    tokens.setProperty('--fold-bone', lean('bone'));
    tokens.setProperty('--fold-heat', result ? Math.max(0, ...result.chapterW.values()).toFixed(3) : '0');
    // The page's own topic cards lean with the question: each thread's card takes its weight.
    document.querySelectorAll('.topic-card[id]').forEach((card) => {
      const w = result?.weights.get(`thread:${card.id}`) || 0;
      card.style.setProperty('--fold-w', w.toFixed(3));
      card.classList.toggle('is-folded-in', w > 0.04);
    });
    if (!result) {
      said.textContent = 'Write a Spw expression, or try one below. What it names lights up; the chapters it runs through warm; what shares those chapters warms a little after them.';
      strip.replaceChildren();
      top.replaceChildren();
      return;
    }
    const lit = [...result.seeds.keys()].map((id) => space.byId.get(id)).filter(Boolean);
    const names = lit.slice(0, 4).map((n) => `${n.sigil || ''}${n.family === 'chapter' ? '' : ''}${n.label}`).join(', ');
    said.textContent = lit.length
      ? `${names}${lit.length > 4 ? `, and ${lit.length - 4} more` : ''}. ${result.unknown.length ? `Nothing on the map is called ${result.unknown.join(' or ')}.` : ''}`
      : `Nothing on the map answers to ${result.unknown.join(' or ') || 'that'} yet.`;
    strip.replaceChildren(...Array.from({ length: 15 }, (_, i) => {
      const c = i + 1;
      const w = result.chapterW.get(c) || 0;
      const best = result.top.find((t) => t.place.c === c);
      const href = `/book/chapter/${pad(c)}/${best?.place.id ? `#${best.place.id}` : ''}`;
      const cell = el('li', { className: `fold-chapter${w > 0 ? ' is-warm' : ''}` },
        el('a', { href, 'aria-label': `Chapter ${WORDS[c]}: ${Math.round(w * 100)} percent` }, String(c), result.flags.measure ? el('small', {}, `${Math.round(w * 100)}`) : null));
      cell.style.setProperty('--fold-w', w.toFixed(3));
      return cell;
    }));
    top.replaceChildren(...result.top.map(({ node, place }, i) => el('li', { className: i === 0 && result.flags.act ? 'is-first' : '' },
      el('a', { href: `/book/chapter/${pad(place.c)}/#${place.id}` }, `${place.label}`),
      el('span', { className: 'fold-place-why' }, ` · Chapter ${WORDS[place.c]} · ${node.sigil || ''}${node.label}`))));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value);
  });
  mount.addEventListener('click', (event) => {
    const ex = event.target.closest('[data-expr]');
    if (ex) ask(ex.dataset.expr);
  });

  describeFocus();
  render();
  let start = '';
  try { start = new URLSearchParams(location.search).get('fold') || ''; } catch { start = ''; }
  if (start) ask(start, { keep: false });
  else paintResult();
  mount.hidden = false;
  return () => cancelAnimationFrame(raf);
}

if (typeof document !== 'undefined') {
  const boot = () => initLoreFold();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
