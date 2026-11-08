// Boof's map: the land's harmonies as she keeps them. Not roads, but what keeps
// what, read from the middle, because that is where her nose is.
//
// Data: book/content/world/harmonies.json (canon: .spw/surfaces/berries.spw).
// The section reads on its own without scripts (a few harmonies, in words);
// this draws the map over it. Tapping a thing shows what she knows of it and
// which chapters tell it. A harmony the reader has read past glows, from
// lore.chapter.progress.v1 = { visited: [n...] }. The map has no top: on a
// tall page it turns a quarter turn, the way a map in Boon.land is allowed to.

const DATA_URL = '/book/content/world/harmonies.json?v=2026_11_08.H';
const PROGRESS_KEY = 'lore.chapter.progress.v1';
const SVG = 'http://www.w3.org/2000/svg';
const FRAME = { x: 1, y: 0.72 };
const KINDS = { creature: 'a creature', ground: 'the ground', berry: 'a berry', place: 'a place', made: 'made by hand', pie: 'a pie', mystery: 'not explained' };
const PAW = '<svg class="boof-map-paw" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><ellipse cx="16" cy="21.5" rx="7.2" ry="6.2"/><ellipse cx="7.4" cy="13.2" rx="2.9" ry="3.7" transform="rotate(-18 7.4 13.2)"/><ellipse cx="12.6" cy="7.6" rx="2.9" ry="3.8" transform="rotate(-6 12.6 7.6)"/><ellipse cx="19.4" cy="7.6" rx="2.9" ry="3.8" transform="rotate(6 19.4 7.6)"/><ellipse cx="24.6" cy="13.2" rx="2.9" ry="3.7" transform="rotate(18 24.6 13.2)"/></svg>';

const root = document.querySelector('.boof-map');
const pad = (n) => String(n).padStart(2, '0');
const f = (n) => n.toFixed(1);

function visitedChapters() {
  try {
    const progress = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
    return new Set((progress?.visited || []).map(Number).filter(Boolean));
  } catch {
    return new Set();
  }
}

/* A small seeded wobble, so every line is drawn the same way each visit. */
function wobble(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), h | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function closedCurve(points) {
  const n = points.length;
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const [p0, p1, p2, p3] = [points[(i - 1 + n) % n], points[i], points[(i + 1) % n], points[(i + 2) % n]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

function ringPath(cx, cy, rx, ry, seed) {
  const r = wobble(seed);
  const points = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 0.035;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  return closedCurve(points);
}

function threadPath(a, b, seed, inset, drift = 0) {
  const r = wobble(seed);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / len, dy / len];
  const s = [a[0] + ux * inset[0] + drift, a[1] + uy * inset[0] - drift];
  const e = [b[0] - ux * inset[1] - drift, b[1] - uy * inset[1] + drift];
  const bend = (r() - 0.5) * 0.32 * len + (r() < 0.5 ? -1 : 1) * 0.05 * len;
  const c = [(s[0] + e[0]) / 2 - uy * bend + drift * 2, (s[1] + e[1]) / 2 + ux * bend + drift];
  return `M${f(s[0])} ${f(s[1])}Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function chapterLinks(chapters, visited) {
  const span = el('span', 'boof-map-told');
  chapters.forEach((n, i) => {
    if (i) span.append(' · ');
    const a = el('a', visited.has(n) ? 'is-read' : '', pad(n));
    a.href = `/book/chapter/${pad(n)}/`;
    a.setAttribute('aria-label', `Chapter ${n}${visited.has(n) ? ', read' : ''}`);
    span.append(a);
  });
  return span;
}

function mount(data) {
  const field = root.querySelector('.boof-map-field');
  const note = root.querySelector('.boof-map-note');
  const status = root.querySelector('.boof-map-status');
  if (!field || !note) return;

  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  const harmonies = data.harmonies.filter((h) => nodes.has(h.from) && nodes.has(h.to));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visited = visitedChapters();
  let selected = data.center;
  let tall = null;

  const isRead = (item) => item.chapters.some((n) => visited.has(n));
  const touching = (id) => harmonies.filter((h) => h.from === id || h.to === id);

  /* The drawing: rings and threads in one svg, the things she knows as buttons over it. */
  field.textContent = '';
  field.classList.add('is-drawn');
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'boof-map-ink');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const ringLayer = document.createElementNS(SVG, 'g');
  const threadLayer = document.createElementNS(SVG, 'g');
  svg.append(ringLayer, threadLayer);
  field.append(svg);

  const rings = data.rings.map((ring, i) => {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('class', 'boof-map-ring');
    const word = document.createElementNS(SVG, 'text');
    word.setAttribute('class', 'boof-map-ring-word');
    word.setAttribute('text-anchor', 'middle');
    word.textContent = ring.label;
    ringLayer.append(path, word);
    return { ring, path, word, seed: `ring-${i}` };
  });

  const threads = harmonies.map((h, i) => {
    const ghost = document.createElementNS(SVG, 'path');
    ghost.setAttribute('class', 'boof-map-thread-ghost');
    const line = document.createElementNS(SVG, 'path');
    line.setAttribute('class', 'boof-map-thread');
    line.style.setProperty('--i', i);
    threadLayer.append(ghost, line);
    return { h, line, ghost };
  });

  const buttons = data.nodes.map((node) => {
    const button = el('button', `boof-map-node is-node-${node.id} is-kind-${node.kind}${node.tint ? ` is-tint-${node.tint}` : ''}${node.id === data.center ? ' is-center' : ''}`);
    button.type = 'button';
    button.setAttribute('aria-label', node.id === data.center ? `${node.name}: where her nose is` : `${node.name}: what Boof knows`);
    if (node.id === data.center) {
      button.insertAdjacentHTML('beforeend', PAW);
      button.append(el('span', 'boof-map-word', node.word), el('span', 'boof-map-nose', 'where her nose is'));
    } else {
      button.append(el('span', 'boof-map-dot'), el('span', 'boof-map-word', node.word));
    }
    button.addEventListener('click', () => select(node.id, { focus: false }));
    field.append(button);
    return { node, button };
  });

  function place(at, box) {
    const [x, y] = at;
    const u = tall ? -y : x;
    const v = tall ? x : y;
    return [box.cx + (u / (tall ? FRAME.y : FRAME.x)) * box.hw, box.cy + (v / (tall ? FRAME.x : FRAME.y)) * box.hh];
  }

  /* Words never sit on one another: whatever overlaps is nudged apart, a few
   * passes, with her nose fixed at the middle. Ring words move along with the
   * rest. The threads are drawn to wherever things settle. */
  function settle(at, W, H) {
    const items = buttons.map(({ node, button }) => {
      const [x, y] = at.get(node.id);
      const outer = button.getBoundingClientRect();
      const mark = button.firstElementChild?.getBoundingClientRect();
      const h = outer.height || button.offsetHeight;
      const ay = mark?.height ? mark.top - outer.top + mark.height / 2 : h / 2;
      return { id: node.id, fixed: node.id === data.center, x, y, w: outer.width || button.offsetWidth, h, ay };
    });
    rings.forEach((ring) => {
      const b = ring.word.getBBox();
      const x = Number(ring.word.getAttribute('x'));
      const y = Number(ring.word.getAttribute('y'));
      items.push({ ring, fixed: false, x, y, w: b.width + 6, h: b.height, ay: y - b.y });
    });
    const rect = (it) => ({ l: it.x - it.w / 2, r: it.x + it.w / 2, t: it.y - it.ay, b: it.y - it.ay + it.h });
    for (let pass = 0; pass < 60; pass += 1) {
      let moved = false;
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const [a, b] = [items[i], items[j]];
          if (a.fixed && b.fixed) continue;
          const [ra, rb] = [rect(a), rect(b)];
          const ox = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l) + 3;
          const oy = Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t) + 3;
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          const shareA = a.fixed ? 0 : b.fixed ? 1 : 0.5;
          const shareB = 1 - shareA;
          if (ox < oy) {
            const sign = Math.sign((ra.l + ra.r) - (rb.l + rb.r)) || 1;
            a.x += sign * ox * shareA;
            b.x -= sign * ox * shareB;
          } else {
            const sign = Math.sign((ra.t + ra.b) - (rb.t + rb.b)) || 1;
            a.y += sign * oy * shareA;
            b.y -= sign * oy * shareB;
          }
        }
      }
      items.forEach((it) => {
        if (it.fixed) return;
        it.x = Math.min(W - it.w / 2 - 2, Math.max(it.w / 2 + 2, it.x));
        it.y = Math.min(H - (it.h - it.ay) - 2, Math.max(it.ay + 2, it.y));
      });
      if (!moved) break;
    }
    items.forEach((it) => {
      if (it.ring) {
        it.ring.word.setAttribute('x', f(it.x));
        it.ring.word.setAttribute('y', f(it.y));
      } else {
        at.set(it.id, [it.x, it.y]);
      }
    });
  }

  function draw() {
    const W = field.clientWidth;
    const H = field.clientHeight;
    if (!W || !H) return;
    tall = H > W * 1.05;
    field.classList.toggle('is-tall', tall);
    const box = { cx: W / 2, cy: H / 2, hw: W / 2 - Math.min(52, W * 0.13), hh: H / 2 - Math.min(30, H * 0.07) };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    rings.forEach(({ ring, path, word, seed }) => {
      const rx = ring.r * box.hw;
      const ry = ring.r * box.hh;
      path.setAttribute('d', ringPath(box.cx, box.cy, rx, ry, seed));
      const a = (((tall ? ring.tallAngle : null) ?? ring.angle ?? 235) * Math.PI) / 180;
      const [wx, wy] = place([Math.cos(a) * ring.r * FRAME.x, Math.sin(a) * ring.r * FRAME.y], box);
      word.setAttribute('x', f(wx));
      word.setAttribute('y', f(wy - 5));
    });

    const at = new Map(buttons.map(({ node }) => [node.id, place(node.at, box)]));
    settle(at, W, H);
    buttons.forEach(({ node, button }) => {
      const [x, y] = at.get(node.id);
      button.style.left = `${((x / W) * 100).toFixed(3)}%`;
      button.style.top = `${((y / H) * 100).toFixed(3)}%`;
    });

    threads.forEach(({ h, line, ghost }) => {
      const inset = [h.from === data.center ? 26 : 9, h.to === data.center ? 26 : 9];
      line.setAttribute('d', threadPath(at.get(h.from), at.get(h.to), h.id, inset));
      ghost.setAttribute('d', threadPath(at.get(h.from), at.get(h.to), h.id, inset, 1.6));
    });
  }

  function paint() {
    const near = new Set([selected]);
    touching(selected).forEach((h) => { near.add(h.from); near.add(h.to); });
    const focused = selected !== data.center;
    buttons.forEach(({ node, button }) => {
      const on = node.id === selected;
      button.classList.toggle('is-read', node.id === data.center || isRead(node));
      button.classList.toggle('is-selected', on);
      button.classList.toggle('is-near', focused && near.has(node.id) && !on);
      button.classList.toggle('is-far', focused && !near.has(node.id));
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    threads.forEach(({ h, line, ghost }) => {
      const touches = h.from === selected || h.to === selected;
      [line, ghost].forEach((path) => {
        path.classList.toggle('is-read', isRead(h));
        path.classList.toggle('is-near', touches);
        path.classList.toggle('is-far', focused && !touches);
      });
    });
    const lit = harmonies.filter(isRead).length;
    if (status) {
      status.textContent = !lit
        ? `Nothing on her map glows yet. Read a chapter and come back: every harmony you read past lights up. (${harmonies.length} to find.)`
        : lit === harmonies.length
          ? `All ${lit} harmonies on her map are lit. The hat is still at the edge of it.`
          : `${lit} of ${harmonies.length} harmonies lit: the ones you have read past. The rest are still pencil.`;
    }
  }

  function walkTo(id, label) {
    const button = el('button', 'boof-map-walk', `→ ${label}`);
    button.type = 'button';
    button.addEventListener('click', () => select(id, { focus: true }));
    return button;
  }

  function tell() {
    const node = nodes.get(selected);
    note.textContent = '';
    note.append(
      el('p', 'boof-map-note-kicker', node.id === data.center ? 'Boof · where her nose is' : `${node.ring} · ${KINDS[node.kind] || node.kind}`),
      el('h3', 'boof-map-note-name', node.name),
      el('p', 'boof-map-note-scent', node.scent),
      el('p', 'boof-map-note-knows', node.knows)
    );
    const told = el('p', 'boof-map-note-told', node.id === data.center ? 'In every chapter: ' : 'Told in ');
    told.append(chapterLinks(node.chapters, visited));
    note.append(told);

    const list = el('ul', 'boof-map-threads');
    touching(selected).forEach((h) => {
      const other = nodes.get(h.from === selected ? h.to : h.from);
      const read = isRead(h);
      const item = el('li', `boof-map-harmony${read ? ' is-read' : ''}`);
      item.append(el('span', 'boof-map-says', h.says));
      if (read) {
        item.append(el('span', 'boof-map-gloss', h.gloss));
      } else {
        const door = el('span', 'boof-map-gloss is-pencil', `How she knows is in Chapter ${pad(h.chapters[0])}. `);
        const a = el('a', '', 'Read it →');
        a.href = `/book/chapter/${pad(h.chapters[0])}/`;
        door.append(a);
        item.append(door);
      }
      const foot = el('span', 'boof-map-harmony-foot');
      foot.append(chapterLinks(h.chapters, visited), walkTo(other.id, other.word));
      item.append(foot);
      list.append(item);
    });
    if (list.children.length) {
      note.append(el('p', 'boof-map-note-kicker', node.id === data.center ? 'What comes to her' : 'What it keeps, and what keeps it'), list);
    }
  }

  function select(id, { focus }) {
    if (!nodes.has(id)) return;
    selected = id;
    paint();
    tell();
    if (focus) buttons.find(({ node }) => node.id === id)?.button.focus({ preventScroll: true });
  }

  field.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && selected !== data.center) select(data.center, { focus: true });
  });

  const refresh = () => {
    visited = visitedChapters();
    paint();
    tell();
  };
  window.addEventListener('storage', (event) => { if (event.key === PROGRESS_KEY) refresh(); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) refresh(); });

  if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(field);
  else window.addEventListener('resize', draw);
  draw();
  paint();
  tell();
  if (!reduced) root.classList.add('is-kindling');
}

async function start() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) return;
    mount(await response.json());
  } catch {
    // The words in the section still say what the map would have drawn.
  }
}

if (root) {
  if ('IntersectionObserver' in window) {
    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      start();
    }, { rootMargin: '600px 0px' });
    watch.observe(root);
  } else {
    start();
  }
}
