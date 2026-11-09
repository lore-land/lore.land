/**
 * texture-page.mjs — /texture/: texture.website, played through lore.land. Answers every ?/ address
 * (texture-routes.mjs): shows how the address reads, part by part, then what lives there.
 *
 *   ?/texture.website                       the surface: the packs on it, and the folios' motifs (~ one of them)
 *   ?/texture.website/@spwashi              spwashi's hand (book/content/packs/texture.website/@spwashi/)
 *     …/!Boof+and+the+pie                   written in the hand, in letter blocks, its sounds spelled out
 *     …/=~2+@8                              tuned (spwashi-hand.mjs readTuning: ~ wanders, % weighs, @ leans,
 *                                           . settles, ^ bounces, ! swells, ? tilts, * as scanned, # measure,
 *                                           & layered, = seed, $ paper)
 *     …/*g                                  one letter, and where it came from
 *
 * What you write, tune or tap goes back into the address (replaceState), so a state is an address you can read
 * and pass along. The address bar shows the route as lore.land/?/…, the way it was given.
 */
import { loadPacks, schemeParts, PLAN_STATES } from '../modules/packs.mjs?v=2026_11_09.H';
import { readRoute, writeRoute, resolveRoute, TRY } from '../modules/texture-routes.mjs?v=2026_11_09.L';
import { MATERIALS, PHYSICS, factshiftAddress, physicsDelta } from '../modules/texture-materials.mjs?v=2026_11_09.H';
import { VERBS, passThrough } from '../modules/quest-middleware.mjs?v=2026_11_09.H';
import { readTuning, DIALS, DEFAULT_TUNING, noise } from '../modules/spwashi-hand.mjs?v=2026_11_09.H';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => { if (v == null || v === false) return; if (k === 'className') node.className = v; else node.setAttribute(k, v === true ? '' : String(v)); });
  children.flat().forEach((c) => { if (c != null && c !== false) node.append(c); });
  return node;
};
const SVG = 'http://www.w3.org/2000/svg';

/* ─── Phonics: a word in the chunks it is said in (longest first), each with a word to hear it in ─── */
const SOUNDS = [
  ['tch', 'match'], ['igh', 'night'], ['dge', 'bridge'], ['air', 'chair'], ['ear', 'near'], ['ure', 'pure'],
  ['sh', 'ship'], ['ch', 'chip'], ['th', 'thin'], ['wh', 'when'], ['ph', 'phone'], ['ck', 'duck'], ['ng', 'ring'],
  ['qu', 'queen'], ['kn', 'knee'], ['wr', 'write'], ['ee', 'tree'], ['ea', 'sea'], ['oa', 'boat'], ['ai', 'rain'],
  ['ay', 'day'], ['oo', 'Boof'], ['ou', 'out'], ['ow', 'cow'], ['oi', 'coin'], ['oy', 'boy'], ['ar', 'car'],
  ['or', 'fork'], ['er', 'her'], ['ir', 'bird'], ['ur', 'fur'], ['aw', 'saw'], ['au', 'haul'], ['ew', 'new'],
  ['ie', 'pie'], ['ue', 'blue'],
  ['a', 'apple'], ['b', 'Boof'], ['c', 'cat'], ['d', 'dog'], ['e', 'egg'], ['f', 'fox'], ['g', 'goat'], ['h', 'honk'],
  ['i', 'ink'], ['j', 'jam'], ['k', 'kite'], ['l', 'lore'], ['m', 'moon'], ['n', 'nest'], ['o', 'otter'],
  ['p', 'pie'], ['q', 'queen'], ['r', 'rain'], ['s', 'sun'], ['t', 'tree'], ['u', 'up'], ['v', 'van'], ['w', 'wind'],
  ['x', 'box'], ['y', 'yes'], ['z', 'zebra']
];
function chunks(word) {
  const out = [];
  const w = word.toLowerCase();
  for (let i = 0; i < w.length;) {
    const hit = SOUNDS.find(([g]) => w.startsWith(g, i));
    if (!hit) { i += 1; continue; }
    out.push({ letters: word.slice(i, i + hit[0].length), as: hit[1] });
    i += hit[0].length;
  }
  return out;
}

/* ─── Letter blocks: the word drawn from the outlines, tuned ─── */
let hand = null;
const glyphOf = (ch) => hand.glyphs[ch] || null;

function pathFor(contours, map) {
  return contours.map((c) => {
    const [x0, y0] = map(c[0][0], c[0][1]);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)}${c.slice(1).map(([cx, cy, x, y]) => { const [a, b] = map(cx, cy); const [d, e] = map(x, y); return `Q${a.toFixed(1)} ${b.toFixed(1)} ${d.toFixed(1)} ${e.toFixed(1)}`; }).join('')}Z`;
  }).join('');
}

/** A ruled box as a hand rules one: four lines that do not quite meet, wandering a little. */
function ruledBox(x, y, w, h, wander, seed) {
  const n = noise(seed);
  const jit = (i) => n(i) * 6 * (0.6 + wander);
  const line = (x1, y1, x2, y2, i) => `M${(x1 + jit(i)).toFixed(1)} ${(y1 + jit(i + 1)).toFixed(1)}L${(x2 + jit(i + 2)).toFixed(1)} ${(y2 + jit(i + 3)).toFixed(1)}`;
  return line(x - 4, y, x + w + 6, y + 2, 1) + line(x + w, y - 5, x + w + 2, y + h + 4, 9) + line(x + w + 5, y + h, x - 3, y + h + 3, 17) + line(x, y + h + 6, x - 2, y - 3, 25);
}

function render(text, tuning) {
  const m = hand.metrics;
  const n = noise(tuning.seed);
  const top = m.lineAscender;
  const height = m.lineAscender - m.lineDescender;
  const boxPad = 40;
  const gap = tuning.boxed ? 34 : 0;
  const svg = document.createElementNS(SVG, 'svg');
  const defs = [];
  const groups = [];
  let x = boxPad;
  let lettered = 0; let penned = 0; let missing = 0;
  const chars = [...text];
  const slant = Math.tan((tuning.slant * Math.PI) / 180);
  chars.forEach((ch, i) => {
    if (ch === ' ') { x += m.space + gap; return; }
    const g = glyphOf(ch) || glyphOf(ch.toLowerCase()) || glyphOf(ch.toUpperCase());
    if (!g) { missing += 1; x += m.space; return; }
    if (g.kind === 'lettered') lettered += 1; else penned += 1;
    const t = chars.length > 1 ? i / (chars.length - 1) : 0.5;
    const raise = n(i * 3.1 + 5) * 36 * tuning.settle + Math.sin(i * 0.9) * 60 * tuning.bounce;
    const tilt = n(i * 5.7 + 40) * 8 * tuning.tilt;
    const swell = 1 + 0.14 * tuning.pressure * Math.sin(Math.PI * t);
    const unEven = tuning.asScanned && g.from?.evened ? 1 / g.from.evened : 1;
    const s = swell * unEven;
    const adv = g.advance * s;
    const cx = adv / 2;
    // Font units → this box: y up to y down, the letter's own swell, lean and wander.
    const map = (px, py) => {
      let gx = px * s; let gy = py * s;
      if (tuning.wobble) { gx += n(px * 0.011 + py * 0.007 + i * 17) * 16 * tuning.wobble; gy += n(py * 0.011 - px * 0.005 + i * 29 + 300) * 16 * tuning.wobble; }
      gx += gy * slant;
      const rad = (tilt * Math.PI) / 180;
      const rx = cx + (gx - cx) * Math.cos(rad) - (gy - 300) * Math.sin(rad);
      const ry = 300 + (gx - cx) * Math.sin(rad) + (gy - 300) * Math.cos(rad);
      return [x + rx, boxPad + top - ry - raise];
    };
    const g2 = document.createElementNS(SVG, 'g');
    g2.setAttribute('class', `texture-letter is-${g.kind}`);
    if (tuning.boxed) {
      const box = document.createElementNS(SVG, 'path');
      box.setAttribute('d', ruledBox(x - gap / 2 + 4, boxPad - 10, adv + gap - 8, height + 20, tuning.wobble, tuning.seed * 31 + i));
      box.setAttribute('class', 'texture-box');
      g2.append(box);
    }
    const faces = tuning.layered ? ['hand', 'outline'] : [tuning.face];
    faces.forEach((face, k) => {
      const p = document.createElementNS(SVG, 'path');
      p.setAttribute('d', pathFor(g[face], map));
      p.setAttribute('class', `texture-ink is-${face}${faces.length > 1 && k === 0 ? ' is-under' : ''}`);
      if (tuning.weight > 1) p.setAttribute('stroke-width', String(Math.min(60, (tuning.weight - 1) * 24)));
      g2.append(p);
    });
    if (tuning.measure) {
      const label = document.createElementNS(SVG, 'text');
      label.setAttribute('x', String(x + adv / 2));
      label.setAttribute('y', String(boxPad + height + 70));
      label.setAttribute('class', 'texture-label');
      label.textContent = g.kind === 'lettered' ? `row ${g.from.row} · ${g.from.place}` : 'penned';
      g2.append(label);
    }
    groups.push(g2);
    x += adv + gap;
  });
  const width = Math.max(x + boxPad, 400);
  const tall = height + boxPad * 2 + (tuning.measure ? 90 : 0);
  svg.setAttribute('viewBox', `0 0 ${width.toFixed(0)} ${tall}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${text}, written in spwashi's hand`);
  if (tuning.paper) {
    defs.push(`<filter id="texture-paper"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${tuning.seed}"/><feColorMatrix values="0 0 0 0 0.93  0 0 0 0 0.89  0 0 0 0 0.8  0 0 0 ${(0.35 * tuning.paper).toFixed(2)} 0"/></filter>`);
  }
  svg.innerHTML = `<defs>${defs.join('')}</defs>${tuning.paper ? `<rect width="100%" height="100%" class="texture-paper"/><rect width="100%" height="100%" filter="url(#texture-paper)"/>` : ''}`;
  if (tuning.measure) {
    const guides = document.createElementNS(SVG, 'g');
    guides.setAttribute('class', 'texture-guides');
    [[0, 'baseline'], [m.xHeight, 'x-height'], [m.cap, 'cap']].forEach(([y, name]) => {
      const line = document.createElementNS(SVG, 'line');
      line.setAttribute('x1', '0'); line.setAttribute('x2', String(width));
      line.setAttribute('y1', String(boxPad + top - y)); line.setAttribute('y2', String(boxPad + top - y));
      line.setAttribute('data-guide', name);
      guides.append(line);
    });
    svg.append(guides);
  }
  svg.append(...groups);
  return { svg, lettered, penned, missing };
}

/* ─── The writer ─── */
function paintWriter() {
  paintWriterOnly();
  keepInAddress();
}

function paintWriterOnly() {
  const text = $('[data-text]').value || ' ';
  // The material sets the hand first (its typography); what the reader tuned is read after it, and wins.
  const material = MATERIALS[route?.substrate] || null;
  const tune = $('[data-tune]').value;
  const open = tune.indexOf('{');
  const tuning = readTuning(material ? `${open >= 0 ? tune.slice(0, open + 1) : 'spwashi@<lore.land>.{'} ${material.typography} ${open >= 0 ? tune.slice(open + 1) : tune}` : tune);
  const { svg, lettered, penned, missing } = render(text, tuning);
  // Room for the material to move in: as far as it falls (or floats), and a little for the heat.
  if (material) {
    const p = material.physics;
    const settle = (p.fall * 30) / Math.max(0.01, p.centerStrength);
    const [x0, y0, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    const below = Math.max(0, settle) + 80 + p.alphaTarget * 300;
    const above = Math.max(0, -settle) + 40 + p.alphaTarget * 300;
    svg.setAttribute('viewBox', `${x0} ${y0 - above} ${w} ${h + above + below}`);
  }
  $('[data-stage]').replaceChildren(svg);
  $('[data-stage]').classList.toggle('is-paper', Boolean(tuning.paper));
  $('[data-stage]').dataset.ground = material ? material.texture.ground : '';
  startPhysics(svg, material ? material.physics : null);
  const said = [];
  if (lettered) said.push(`${lettered} lettered by hand`);
  if (penned) said.push(`${penned} penned in the hand's manner`);
  if (missing) said.push(`${missing} the hand has no letter for yet`);
  const changes = Object.entries(DIALS).filter(([, d]) => !['seed', 'asScanned'].includes(d.key) && tuning[d.key] !== DEFAULT_TUNING[d.key]).map(([op, d]) => `${op} ${d.says}`);
  const made = material ? ` Made on ${route.substrate}: ${material.says}.` : '';
  $('[data-who]').textContent = `${said.join(' · ')}.${tuning.asScanned ? ' Shown as scanned: nothing moved.' : changes.length ? ` Changed on purpose: ${changes.join('; ')}.` : ' Shown as traced.'}${made}`;
  const words = text.split(/[^A-Za-z]+/).filter(Boolean);
  $('[data-phonics]').replaceChildren(...words.map((word) => el('p', { className: 'texture-word' },
    el('span', { className: 'texture-word-name' }, word),
    ...chunks(word).map((c) => el('span', { className: 'texture-chunk' }, el('b', {}, c.letters), el('small', {}, `as in ${c.as}`))))));
}

function paintDials() {
  const box = $('[data-dials]');
  box.replaceChildren(...Object.entries(DIALS).map(([op, d]) => {
    const b = el('button', { type: 'button', className: 'texture-dial', title: d.says, 'data-op': op }, el('code', {}, op), el('span', {}, d.key === 'asScanned' ? 'as scanned' : d.key));
    b.addEventListener('click', () => {
      const input = $('[data-tune]');
      const v = input.value;
      const open = v.lastIndexOf('{');
      const head = open >= 0 ? v.slice(0, open + 1) : 'spwashi@<lore.land>.{';
      // A body left open stays open (letters in their blocks); one closed stays closed (letters running free).
      const closed = open >= 0 && /\}\s*$/.test(v);
      let body = open >= 0 ? v.slice(open + 1).replace(/\}\s*$/, '') : v;
      const re = new RegExp(`\\${op}(-?\\d+(?:\\.\\d+)?)?(?=\\s|$|\\})`);
      const found = body.match(re);
      if (found) {
        const now = found[1] !== undefined ? Number(found[1]) : d.bare;
        const next = d.key === 'seed' ? now + 1 : d.key === 'slant' ? (now >= 16 ? 0 : now + 8) : now >= 3 ? 0 : +(now + 1).toFixed(1);
        body = next === 0 ? body.replace(re, '').replace(/\s{2,}/g, ' ') : body.replace(re, `${op}${next}`);
      } else {
        body = `${body.trim()} ${op}${d.key === 'slant' ? 8 : d.key === 'seed' ? 8 : 1}`;
      }
      input.value = `${head} ${body.trim()}${closed ? ' }' : ''}`.replace(/\{\s+\}/, '{ }').trimEnd();
      paintWriter();
    });
    return b;
  }));
}

/* ─── The address: what is on the page, written back into the route ─── */
let route = null;
const DEFAULT_TEXT = 'Boof and the pie';
const DEFAULT_TUNE = 'spwashi@<lore.land>.{ ~1';
const tuneBody = (tune) => (tune.includes('{') ? tune.slice(tune.indexOf('{') + 1) : tune).trim();
function keepInAddress() {
  if (!route?.perspective) return;
  const text = $('[data-text]').value;
  const tune = $('[data-tune]').value;
  route = readRoute(writeRoute({
    ...route,
    action: text && text !== DEFAULT_TEXT ? text : null,
    config: tune && tune !== DEFAULT_TUNE ? tuneBody(tune) : null
  }));
  history.replaceState(null, '', `/${route.raw}${location.hash}`);
  paintRoute();
}

/** How the address reads: each part, its operator, and what it says. */
function paintRoute() {
  $('[data-route-input]').value = route?.raw || '';
  $('[data-route-parts]').replaceChildren(...(route?.parts || []).map((p) => el('li', { className: `texture-part is-${p.role}` },
    el('code', {}, `${p.op === '/' ? '/' : p.op}${p.name}`),
    el('span', {}, p.reads))));
}

/* ─── The alphabet, with where each glyph came from ─── */
function paintGlyphs(face = 'hand') {
  const order = Object.keys(hand.glyphs).sort((a, b) => {
    const rank = (c) => (/[A-Z]/.test(c) ? 0 : /[a-z]/.test(c) ? 1 : /[0-9]/.test(c) ? 2 : 3);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  $('[data-glyphs]').replaceChildren(...order.map((ch) => {
    const g = hand.glyphs[ch];
    const where = g.kind === 'lettered' ? `lettered · row ${g.from.row}, box ${g.from.place}` : 'penned';
    const here = route?.value === ch;
    const li = el('li', { className: `texture-glyph is-${g.kind}${here ? ' is-here' : ''}`, title: `${ch} — ${where}` },
      el('a', { href: `/${writeRoute({ ...route, value: ch, action: null, config: null })}`, className: 'texture-glyph-link' },
        el('span', { className: `texture-glyph-ink is-${face}`, 'aria-hidden': 'true' }, ch),
        el('span', { className: 'texture-glyph-where' }, el('span', { className: 'sr-only' }, `${ch}: `), where)));
    return li;
  }));
  // A letter in the address (*g) is written in the blocks and found in the alphabet.
  const here = $('.texture-glyph.is-here');
  if (here) requestAnimationFrame(() => here.scrollIntoView({ block: 'center', behavior: 'smooth' }));
}

/* The literacy ladder in plain words (packs.mjs RUNGS). */
const RUNG_WORDS = { read: 'read it', notice: 'notice', explore: 'try it', operate: 'play with it', inspect: 'look closely', author: 'make your own' };

/* ─── The pack: scheme, curriculum, findings, sources ─── */
function paintPack(pack, findings) {
  $('[data-scheme]').textContent = pack.scheme;
  $('[data-reads]').replaceChildren(...schemeParts(pack).flatMap(({ part, says }) => [el('dt', {}, el('code', {}, part)), el('dd', {}, says)]));
  $('[data-plans]').replaceChildren(...(pack.curriculum || []).map((plan) => el('li', { className: `texture-plan is-${plan.state}` },
    el('p', { className: 'texture-plan-head', title: plan.id }, plan.title,
      el('span', { className: 'texture-plan-state' }, `${PLAN_STATES[plan.state]} · ${RUNG_WORDS[plan.rung] || plan.rung}`)),
    el('p', { className: 'texture-plan-make' }, plan.make),
    el('p', { className: 'texture-plan-ask' }, el('span', {}, 'Ask · '), plan.ask),
    el('p', { className: 'texture-plan-ages' }, el('span', {}, 'For · '), plan.ages))));
  const font = (pack.contributes?.fonts || []).map((f) => el('a', { href: f.src, download: '' }, f.family));
  $('[data-download]').replaceChildren('The faces, to set your own words in: ', ...font.flatMap((a, i) => (i ? [' · ', a] : [a])), '. Lettered by spwashi; ask before you use them beyond reading.');
  $('[data-sources]').replaceChildren(...(pack.sources || []).map((s) => el('li', {},
    s.thumb ? el('img', { src: s.thumb, alt: '', loading: 'lazy', width: '100', height: '128' }) : null,
    el('div', {}, el('a', { href: s.href, rel: 'noopener' }, s.title), el('p', {}, s.use)))));
  if (findings) {
    const shelf = (kind, title, count = 12) => {
      const list = findings.motifs.filter((m) => m.kind === kind).slice(0, count);
      return el('div', { className: 'texture-finding-shelf' },
        el('h3', {}, `${title} `, el('span', {}, `${findings.counts[`${kind}s`]}`)),
        el('ul', {}, ...list.map((m) => el('li', {},
          el('a', { href: `/${writeRoute({ surface: 'texture.website', motif: m.handle.slice(1) })}`, className: 'texture-motif-link' }, el('code', {}, m.handle)), ' ', m.words, ' ',
          ...m.pieces.slice(0, 3).map((p, i) => el('a', { href: p.href, rel: 'noopener', title: p.title }, i ? `, ${i + 1}` : ' on 1')),
          m.pieces.length > 3 ? ` +${m.pieces.length - 3}` : ''))));
    };
    $('[data-findings]').replaceChildren(shelf('texture', 'Textures'), shelf('figure', 'Figures'), shelf('saying', 'Sayings'),
      el('p', { className: 'texture-findings-note' }, `${findings.counts.motifs} motifs from ${findings.source.pieces} pieces, read ${findings.mined}.`));
  }
}

/* ─── Physics: on a material, the letters are bodies (texture-materials.mjs, in factshift.center's terms) ───
 * Each letter is pulled home (centerStrength), held by its neighbours (linkStrength), kept off the others
 * (charge), stirred (alpha, settling by alphaDecay toward alphaTarget), slowed by the air (velocityDecay), and
 * falls (fall). Drag one and let go. Nothing moves under reduced motion. */
let sim = null;
function stopPhysics() { if (sim?.raf) cancelAnimationFrame(sim.raf); sim = null; }
function startPhysics(svg, physics) {
  stopPhysics();
  if (!physics || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bodies = [...svg.querySelectorAll('.texture-letter')].map((g) => {
    const b = g.getBBox();
    return { g, cx: b.x + b.width / 2, cy: b.y + b.height / 2, x: 0, y: 0, vx: 0, vy: 0, held: null };
  });
  const state = { raf: 0, alpha: physics.alpha };
  sim = state;
  const step = () => {
    state.raf = 0;
    if (sim !== state) return;
    state.alpha += (physics.alphaTarget - state.alpha) * physics.alphaDecay;
    bodies.forEach((b, i) => {
      if (b.held) return;
      let fx = -b.x * physics.centerStrength;
      let fy = -b.y * physics.centerStrength + physics.fall * 30;
      fx += (Math.random() - 0.5) * state.alpha * 40;
      fy += (Math.random() - 0.5) * state.alpha * 40;
      [bodies[i - 1], bodies[i + 1]].filter(Boolean).forEach((n) => { fx += (n.x - b.x) * physics.linkStrength * 0.2; fy += (n.y - b.y) * physics.linkStrength * 0.2; });
      bodies.forEach((o) => {
        if (o === b) return;
        const dx = (b.cx + b.x) - (o.cx + o.x); const dy = (b.cy + b.y) - (o.cy + o.y);
        const d2 = dx * dx + dy * dy + 900; const d = Math.sqrt(d2);
        if (d < 520) { const f = (-physics.charge * 600) / d2; fx += (dx / d) * f; fy += (dy / d) * f; }
      });
      b.vx = (b.vx + fx) * (1 - physics.velocityDecay);
      b.vy = (b.vy + fy) * (1 - physics.velocityDecay);
      b.x += b.vx; b.y += b.vy;
    });
    bodies.forEach((b) => b.g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${Math.max(-24, Math.min(24, b.vx * 0.5)).toFixed(1)} ${b.cx.toFixed(0)} ${b.cy.toFixed(0)})`));
    const moving = bodies.some((b) => b.held || Math.abs(b.vx) + Math.abs(b.vy) > 0.04) || state.alpha > 0.004 || physics.alphaTarget > 0;
    if (moving) state.raf = requestAnimationFrame(step);
  };
  const wake = () => { if (!state.raf && sim === state) state.raf = requestAnimationFrame(step); };
  const at = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  bodies.forEach((b) => {
    b.g.addEventListener('pointerdown', (e) => {
      const p = at(e);
      b.held = { px: p.x, py: p.y, x: b.x, y: b.y, t: performance.now() };
      b.g.setPointerCapture(e.pointerId);
      b.g.classList.add('is-held');
      e.preventDefault();
      wake();
    });
    b.g.addEventListener('pointermove', (e) => {
      if (!b.held) return;
      const p = at(e);
      const nx = b.held.x + p.x - b.held.px; const ny = b.held.y + p.y - b.held.py;
      b.vx = nx - b.x; b.vy = ny - b.y;
      b.x = nx; b.y = ny;
      state.alpha = Math.max(state.alpha, physics.alpha * 0.5);
      wake();
    });
    const drop = () => { if (!b.held) return; b.held = null; b.g.classList.remove('is-held'); state.alpha = Math.max(state.alpha, physics.alpha); wake(); };
    b.g.addEventListener('pointerup', drop);
    b.g.addEventListener('pointercancel', drop);
  });
  wake();
}

/* ─── Materials: what it is made on ($), each with its texture, typography and physics ─── */
function materialCard(name) {
  const m = MATERIALS[name];
  if (!m) return el('p', {}, el('code', {}, `$${name}`), ' is not a material yet.');
  const line = route?.action ? `$${name}{ !${route.action} }` : `$${name}`;
  return el('div', {},
    el('p', { className: 'texture-material-says' }, el('code', {}, `$${name}`), ` ${m.says}`),
    el('dl', { className: 'texture-registers' },
      el('dt', {}, 'texture'), el('dd', {}, m.texture.ground, m.texture.motif ? [' · from the folios: ', el('a', { href: `/${writeRoute({ surface: 'texture.website', motif: m.texture.motif })}` }, el('code', {}, `~${m.texture.motif}`))] : ''),
      el('dt', {}, 'typography'), el('dd', {}, el('code', {}, m.typography)),
      el('dt', {}, 'physics'), el('dd', {}, ...Object.entries(m.physics).map(([k, v]) => el('span', { className: 'texture-phys', title: PHYSICS[k]?.says || '' }, `${k} ${v}`)))),
    el('p', { className: 'texture-material-ground' },
      el('a', { href: factshiftAddress(name, line), rel: 'noopener', target: '_blank' }, 'Feel it on factshift.center ↗'),
      ' · ',
      el('a', { href: `/${writeRoute({ ...route, substrate: name, with: 'factshift.center', asked: ['ground'] })}` }, 'say it in factshift.center\'s terms')));
}
function paintMaterials() {
  const here = route?.substrate || null;
  $('[data-materials]').replaceChildren(el('span', { className: 'texture-materials-label' }, 'Made on'),
    ...Object.keys(MATERIALS).map((name) => el('a', { className: `texture-material-chip${name === here ? ' is-here' : ''}`, href: `/${writeRoute({ ...route, substrate: name === here ? null : name, asked: [] })}`, 'aria-pressed': String(name === here) }, el('code', {}, '$'), name)));
  $('[data-material]').replaceChildren(here ? materialCard(here) : el('p', { className: 'texture-material-none' }, 'Made on nothing yet: the hand as traced, still. Choose a material and the letters become bodies — drag one.'));
}

/* ─── spw.quest, as middleware: the seven verbs, and their receipts ─── */
function groundIn(target, r) {
  const name = r.substrate || 'paper';
  const m = MATERIALS[name];
  if (!m) return null;
  if (target === 'factshift.center') {
    const url = factshiftAddress(name, r.action ? `$${name}{ !${r.action} }` : `$${name}`);
    return { url, lines: [`$${name} in factshift.center's own address:`, ...physicsDelta(name).map((d) => `${d.field} ${d.from} → ${d.to} — ${d.says}`), 'fall stays in lore.land: the canvas has no down'] };
  }
  if (target === 'lore.land') return { lines: [`$${name} in the letter blocks here: drag ${m.physics.velocityDecay}, pull home ${m.physics.centerStrength}, held by neighbours ${m.physics.linkStrength}, kept apart ${m.physics.charge}, fall ${m.physics.fall}`] };
  return null;
}
function paintVerbs() {
  $('[data-verbs]').replaceChildren(el('span', { className: 'texture-verbs-label' }, 'Through spw.quest'),
    ...Object.entries(VERBS).map(([verb, v]) => {
      const b = el('button', { type: 'button', className: 'texture-verb', title: v.says }, el('code', {}, '?'), verb);
      b.addEventListener('click', () => {
        const asked = [...(route.asked || []).filter((x) => x !== verb), verb];
        const extra = verb === 'ground' && !route.with ? { with: 'factshift.center' } : {};
        go(writeRoute({ ...route, ...extra, asked }));
      });
      return b;
    }));
}
function paintReceipts(receipts) {
  const box = $('[data-receipts]');
  box.hidden = !receipts.length;
  box.replaceChildren(...receipts.map(({ verb, lines, out }) => el('div', { className: `texture-receipt is-${verb}` },
    el('p', { className: 'texture-receipt-head' }, el('code', {}, `?${verb}`), ` ${VERBS[verb]?.says || ''}`),
    el('ul', {}, ...lines.map((line) => el('li', {}, line))),
    out?.url ? el('p', {}, el('a', { href: out.url, rel: 'noopener', target: '_blank', className: 'texture-receipt-url' }, out.url)) : null,
    out?.motifs?.length ? el('p', {}, ...out.motifs.map((m, i) => [i ? ' · ' : '', el('a', { href: `/${writeRoute({ surface: 'texture.website', motif: m.handle.slice(1) })}` }, el('code', {}, m.handle))]).flat()) : null)));
}

/* ─── The surface: what lives on it, and one motif when the address names it (~drip) ─── */
function paintSurface(packs, findings) {
  $('[data-surface-packs]').replaceChildren(...packs.map((p) => el('li', {},
    el('a', { href: `/?${p.route}` }, el('code', {}, `?${p.route}`)), ' ', el('span', {}, p.title), el('p', {}, p.contributes?.pages?.[0]?.says || ''))));
  $('[data-surface-materials]').replaceChildren(...Object.entries(MATERIALS).map(([name, m]) => el('li', {},
    el('a', { href: `/${writeRoute({ surface: 'texture.website', substrate: name })}` }, el('code', {}, `$${name}`)), ` ${m.says}`)));
  const matBox = $('[data-surface-material]');
  matBox.hidden = !route?.substrate;
  if (route?.substrate) matBox.replaceChildren(materialCard(route.substrate));
  const motif = route?.motif;
  const box = $('[data-motif]');
  if (!motif || !findings) { box.hidden = true; return; }
  const found = findings.motifs.find((m) => m.handle === `~${motif}` || m.words === motif.replace(/[._-]+/g, ' '));
  box.hidden = false;
  box.replaceChildren(found
    ? el('div', {}, el('h2', {}, el('code', {}, found.handle), ` ${found.words}`),
      el('p', {}, `A ${found.kind}, held on ${found.pieces.length} piece${found.pieces.length === 1 ? '' : 's'} in spwashi's folios:`),
      el('ul', { className: 'texture-motif-pieces' }, ...found.pieces.map((p) => el('li', {},
        p.thumb ? el('img', { src: p.thumb, alt: '', loading: 'lazy', width: '80', height: '102' }) : null,
        el('a', { href: p.href, rel: 'noopener' }, p.title || p.id)))))
    : el('p', {}, el('code', {}, `~${motif}`), ' is not a motif on the folios yet.'));
}

const DIALS_BY_OP = DIALS;
let packsCache = [];
let findingsCache = null;

/* ─── autonomous.feedback, played through: lore.land's client file, a door in every subject ───
 * The doors open the post itself (autonomous.feedback/lore.land[/kind]?at=page); nothing a reader writes rides in
 * an address here. A host other than lore.land is pointed to its own post: the book reads only its own file. */
let clientCache = null;
async function paintPost({ host, subject }) {
  const list = $('[data-post-subjects]');
  if (host !== 'lore.land') {
    list.replaceChildren(el('li', {}, 'lore.land reads only its own client file here. ',
      el('a', { href: `https://autonomous.feedback/${encodeURIComponent(host)}` }, `autonomous.feedback/${host}`), ' is that site\u2019s own post.'));
    return;
  }
  clientCache = clientCache || await fetch('/.well-known/autonomous-feedback.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!clientCache) { list.replaceChildren(el('li', {}, 'The book\u2019s client file did not load; the post is at ', el('a', { href: 'https://autonomous.feedback/lore.land' }, 'autonomous.feedback/lore.land'), '.')); return; }
  const every = `/${writeRoute({ surface: 'autonomous.feedback', perspective: 'lore.land' })}`;
  const subjects = (clientCache.subjects || []).filter((s) => !subject || s.id === subject);
  if (!subjects.length) { list.replaceChildren(el('li', {}, `No subject here is called ${subject}. `, el('a', { href: every }, 'Every subject'))); return; }
  const labels = clientCache.labels || {};
  const door = (path, kind) => `https://autonomous.feedback/lore.land${kind ? `/${kind}` : ''}?at=${path}`;
  list.replaceChildren(...subjects.map((s) => {
    const path = s.paths?.[0] === '/' ? '/' : `${s.paths?.[0] || ''}/`;
    const here = `/${writeRoute({ surface: 'autonomous.feedback', perspective: 'lore.land', value: s.id })}`;
    const answered = (s.threads || []).filter((t) => t.stance);
    return el('li', { className: 'texture-post-subject' },
      el('h2', {}, subject ? s.name : el('a', { href: here }, s.name), ' ', el('code', {}, `*${s.id}`)),
      el('p', {}, s.prompt || clientCache.intro || ''),
      s.example ? el('p', { className: 'texture-post-example' }, `For example: \u201c${s.example}\u201d`) : null,
      answered.length ? el('dl', { className: 'texture-post-answered' }, ...answered.map((t) => [el('dt', {}, t.name), el('dd', {}, t.stance, t.link ? [' ', el('a', { href: t.link }, 'See it')] : [])])) : null,
      el('p', { className: 'texture-post-doors' },
        el('a', { className: 'texture-post-door', href: door(path), referrerpolicy: 'no-referrer-when-downgrade' }, 'Write a card'),
        ...(s.kinds || []).map((k) => [' ', el('a', { href: door(path, k), referrerpolicy: 'no-referrer-when-downgrade' }, labels[k]?.title || k)]).flat()));
  }), ...(subject ? [el('li', { className: 'texture-post-every' }, el('a', { href: every }, 'Every subject the post knows for lore.land'))] : []));
}

/** Read the address and show what answers it. */
function paint() {
  // A ? part passes the address through spw.quest first: what changes the line leaves the address changed.
  let receipts = [];
  if (route?.asked?.length) {
    const passed = passThrough(route, { materials: MATERIALS, findings: findingsCache, glyphs: hand?.glyphs, dials: DIALS_BY_OP, groundIn, sample: 'Boof' });
    receipts = passed.receipts;
    route = readRoute(writeRoute(passed.route));
    history.replaceState(null, '', `/${route.raw}${location.hash}`);
  }
  paintReceipts(receipts);
  paintRoute();
  const answer = resolveRoute(route, packsCache);
  $('[data-maker-view]').hidden = answer.kind !== 'pack';
  $('[data-maker-hero]').hidden = answer.kind !== 'pack';
  $('[data-surface-view]').hidden = answer.kind !== 'surface';
  $('[data-unknown-view]').hidden = answer.kind !== 'unknown' && answer.kind !== 'none';
  $('[data-post-view]').hidden = answer.kind !== 'post';
  document.title = answer.kind === 'pack' ? `${answer.pack.title} · Lore.Land` : answer.kind === 'post' ? `autonomous.feedback · Lore.Land` : `${route?.raw || '?/'} · Lore.Land`;
  if (answer.kind === 'post') { paintPost(answer); return; }
  if (answer.kind === 'surface') paintSurface(answer.packs, findingsCache);
  if (answer.kind !== 'pack') return;
  // The words and the tuning come from the address (or a letter named in it); otherwise the page's own.
  $('[data-text]').value = route.action || route.value || DEFAULT_TEXT;
  $('[data-tune]').value = route.config ? `spwashi@<lore.land>.{ ${route.config}` : DEFAULT_TUNE;
  paintPack(answer.pack, findingsCache);
  paintMaterials();
  // Drawn as the address says; the address changes only when you do something.
  paintWriterOnly();
  paintGlyphs($('[data-face][aria-pressed="true"]')?.dataset.face || 'hand');
}

function go(raw) {
  const next = readRoute(raw.trim().startsWith('?') ? raw.trim() : `?${raw.trim()}`);
  if (!next) return;
  route = next;
  history.pushState(null, '', `/${route.raw}`);
  paint();
  window.scrollTo({ top: 0 });
}

async function start() {
  // This page answers lore.land/?/…; reached at /texture/?/… (the root hands routes here), it shows the address
  // as given. A visit to /texture/ alone is the surface.
  route = readRoute(location.search) || readRoute('?/texture.website');
  history.replaceState(null, '', `/${route.raw}${location.hash}`);
  paintRoute();
  $('[data-route-try]').replaceChildren(...TRY.map(([r, says]) => el('li', {}, el('a', { href: `/${r}` }, el('code', {}, r)), ` ${says}`)));
  const [packs, handData] = await Promise.all([
    loadPacks(),
    fetch('/book/fonts/spwashi/hand.json').then((r) => { if (!r.ok) throw new Error(`hand.json ${r.status}`); return r.json(); })
  ]);
  hand = handData;
  packsCache = packs;
  const findingsSrc = packs.flatMap((p) => p.contributes?.data || []).find((d) => /findings/.test(d.src))?.src;
  findingsCache = findingsSrc ? await fetch(findingsSrc).then((r) => r.json()).catch(() => null) : null;
  paintDials();
  paintVerbs();
  let typing = 0;
  const onType = () => { clearTimeout(typing); paintWriterOnly(); typing = setTimeout(keepInAddress, 350); };
  $('[data-text]').addEventListener('input', onType);
  $('[data-tune]').addEventListener('input', onType);
  $('[data-writer]').addEventListener('submit', (e) => e.preventDefault());
  $('[data-route-bar]').addEventListener('submit', (e) => { e.preventDefault(); go($('[data-route-input]').value); });
  document.querySelectorAll('[data-face]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-face]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    paintGlyphs(b.dataset.face);
  }));
  // Addresses within the page move without a reload; the back button walks them.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/?/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    go(a.getAttribute('href').slice(1));
  });
  window.addEventListener('popstate', () => { route = readRoute(location.search) || readRoute('?/texture.website'); paint(); });
  paint();
}

start().catch((err) => {
  // Said where it can be seen: the views that need the hand stay folded, and the page says why.
  ['[data-maker-view]', '[data-maker-hero]', '[data-surface-view]'].forEach((sel) => { const node = $(sel); if (node) node.hidden = true; });
  const unknown = $('[data-unknown-view]');
  if (unknown) {
    unknown.hidden = false;
    unknown.replaceChildren(el('h1', { className: 'texture-title' }, 'The hand did not load'),
      el('p', { className: 'hub-lede' }, navigator.onLine === false ? 'You are offline, and this page has not been kept yet. Open it once while online and it will be here next time.' : 'Something went wrong while fetching it. Reloading the page usually helps.'));
  }
  console.error(err);
});
