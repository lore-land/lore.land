/**
 * spw-projection-disk.mjs — the book's Spw, projected on a Poincaré disk (/scriptorium/#projection).
 *
 * Everything the book writes in Spw points somewhere else: a chapter holds its rooms, a wonder is
 * first met in one room and returns in others, a line the pies let slip is about a room, a room is
 * kept by someone, rooms with the same motion recur from chapter to chapter, and every thing has a
 * likeness that rhymes with others. Laid out flat, that web branches too fast to see: the number of
 * things n steps away grows like b^n. The hyperbolic plane grows the same way (a circle's
 * circumference grows like e^r), so the web fits it, and the Poincaré disk shows all of that plane
 * inside one circle: the thing in focus large at the centre, its neighbours on a ring, theirs further
 * out and smaller, crowding toward a rim they never reach, so there is always more beyond.
 *
 * Geometry (points are complex numbers z = x + iy with |z| < 1):
 *   a ring        depth d sits at hyperbolic distance d·STEP from the centre, so at |z| = tanh(d·STEP/2)
 *   size          a thing of fixed hyperbolic size is drawn at (1 − |z|²) of its size at the centre
 *   an edge       a geodesic: the arc of the circle through p and q that meets the rim at right angles
 *                 (its centre c solves c·p = (|p|² + 1)/2 and c·q = (|q|² + 1)/2, radius √(|c|² − 1)),
 *                 or a diameter when p, q and the centre are in line
 *   re-centring   the Möbius map T_a(z) = (z − a)/(1 − ā z) carries a to 0 and keeps the disk;
 *                 the walk to w follows the geodesic, a(t) = tanh(t·atanh|w|)·w/|w|, over ~450 ms
 *                 (at once under reduced motion), then the new rings settle in, turned so the place
 *                 just left stays where the walk put it
 *
 * Loops are the reason to mosey: the short cycles (three to six steps) through the thing in focus are
 * offered as walks. Taking one moves the focus round it, lighting each arc; arriving back where it
 * began completes it, kept in localStorage lore.disk.loops.v1 and shown as a ring on everything on it.
 * A loop closed by hand (tapping round and arriving back) counts the same.
 *
 * Progressive, along the three layers of a language:
 *   syntax       always: every thing shows its Spw (a room's signature, a wonder's spell, an identity
 *                spell, a chapter's rooms), drawn by spw-spell.mjs
 *   semantics    once a thing has been stood on: what it means in plain words (a room's air and its
 *                roomSentence, a wonder's note, what its sigil does). The Egg stays a probe: no meaning.
 *   pragmatics   once a loop through it is walked: what it is for (where to read it, what it does in
 *                the lanes, who says it)
 * A wonder, a person, a palette or a study is named only as far as this reader has found it
 * (likeness.mjs discoveryOf and shownTitle); until then its spell is a veil, a probe that says where
 * to look. Canon only: nothing is read from other readers, nothing is sent anywhere.
 *
 * A derived file (a sound, a share card, an app icon) keeps a sidecar beside it. The disk stands
 * on the three indexes and on each file: the spell on the card is the sidecar, so =@anchor{ @target }
 * reads as one tuning. A share card is tied to its chapter. The jpg, png and m4a paths stay put.
 *
 * Canon: .spw/surfaces/spw-architecture.spw (why linked Spw is hyperbolic, and which loops it has).
 */
import { renderSpell, SIGIL_ROLES } from './spw-spell.mjs?v=2026_11_12.A';
import { readRoom, roomSentence, roomKeeper, ROOM_RESERVED_WORDS } from './room-signature.mjs?v=2026_11_08.W';
import {
  loadLikeness, likenessMark, likenessScore, whyWords, discoveryOf, shownTitle, refreshDiscovery,
  SIGILS, DIMENSIONS, SET_VALENCE, chapterName
} from './likeness.mjs?v=2026_11_11.A';
import { CHARACTERS, identitySpell } from './characters.mjs?v=2026_11_11.A';
import { KIND_SIGIL, loadAlmanac } from './almanac.mjs?v=2026_11_11.A';

export const STORE_KEY = 'lore.disk.loops.v1';
export const STEP = 1.2;        // hyperbolic distance between rings
const CAP = 60;                 // things drawn at once; the deepest rings are pruned first
const RING_ONE = 18;            // neighbours on the first ring, at most
const DEPTH = 3;
const MOVE_MS = 450;
const VIEW = 1.17;              // the viewBox half-width: the unit disk, its rim of sigils, a margin
const HUB = 14;                 // a thing with more neighbours than this is a crowd, not a turn in a loop

const LORE_URL = '/book/content/world/pie-lore.json';
const CATALOG_URL = '/book/content/catalog.json';
const PALETTES_URL = '/book/content/world/palettes.json';
const CHAPTER_URL = (nn) => `/book/content/chapters/${nn}.json`;
const PIE_HREF = '/pie/';

const pad2 = (n) => String(n).padStart(2, '0');
const capital = (text) => String(text).charAt(0).toUpperCase() + String(text).slice(1);

/** A label the Spw lexer reads as a name (mirrors chapter-spell.mjs spwLabel, without its weight). */
function spwLabel(text) {
  const label = String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unnamed';
  const safe = /^[a-z]/.test(label) ? label : `n_${label}`;
  return ROOM_RESERVED_WORDS.includes(safe) ? `the_${safe}` : safe;
}

/* ─── The plane: complex numbers, the Möbius map, geodesics ───────────── */

const cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cDiv = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1] || 1e-12;
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const cAbs = (a) => Math.hypot(a[0], a[1]);
const cArg = (a) => Math.atan2(a[1], a[0]);
const cTurn = (a, phi) => cMul(a, [Math.cos(phi), Math.sin(phi)]);
const cLerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** T_a(z) = (z − a) / (1 − ā z): the disk's own motion, carrying a to the centre. */
export function mobius(z, a) {
  return cDiv(cSub(z, a), cSub([1, 0], cMul([a[0], -a[1]], z)));
}

/** The point at fraction t of the geodesic from the centre to w (constant hyperbolic speed). */
export function alongGeodesic(w, t) {
  const r = Math.min(cAbs(w), 0.999999);
  if (r < 1e-9) return [0, 0];
  const s = Math.tanh(t * Math.atanh(r)) / r;
  return [w[0] * s, w[1] * s];
}

/** Hyperbolic distance from the centre: 2·atanh|z|. */
export const fromCentre = (z) => 2 * Math.atanh(Math.min(cAbs(z), 0.999999));

/** An SVG path for the geodesic from p to q: an arc orthogonal to the rim, or a diameter. */
export function geodesic(p, q) {
  const f = (n) => n.toFixed(4);
  const [x1, y1] = p;
  const [x2, y2] = q;
  const line = `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
  const det = x1 * y2 - x2 * y1;
  if (Math.abs(det) < 1e-5) return line;
  const k1 = (x1 * x1 + y1 * y1 + 1) / 2;
  const k2 = (x2 * x2 + y2 * y2 + 1) / 2;
  const cx = (k1 * y2 - k2 * y1) / det;
  const cy = (x1 * k2 - x2 * k1) / det;
  const r = Math.sqrt(Math.max(cx * cx + cy * cy - 1, 0));
  if (!Number.isFinite(r) || r > 400) return line;
  const sweep = (x1 - cx) * (y2 - cy) - (y1 - cy) * (x2 - cx) > 0 ? 1 : 0;
  return `M${f(x1)} ${f(y1)}A${f(r)} ${f(r)} 0 0 ${sweep} ${f(x2)} ${f(y2)}`;
}

/* ─── The graph, from the canon ───────────────────────────────────────── */

/* Edge kinds, strongest first: one edge per pair, the first kind that joins them. */
export const EDGE_KINDS = Object.freeze(['contains', 'card', 'holds', 'beside', 'first', 'palette', 'planted', 'grounded', 'said', 'kept', 'egg', 'returns', 'sigil', 'like']);
const EDGE_RANK = Object.freeze(Object.fromEntries(EDGE_KINDS.map((kind, i) => [kind, i])));
const KIND_ORDER = Object.freeze(['chapter', 'room', 'wonder', 'egg', 'lore', 'character', 'palette', 'seed', 'card', 'sound', 'icon', 'index']);
const KEEPER_IDS = Object.freeze({ boof: 'boof', genie: 'genie', boonwap: 'boon', banewap: 'bane', bonewap: 'bonewap', the_porter: 'porter' });
const SPEAKER_LABEL = Object.freeze({ boon: 'boonwap', bane: 'banewap' });

/**
 * The web, from the canon's own files (already loaded): likeness.json items and near, the almanac's
 * wonders with where each is marked (semantic.json), the pies' lines, the catalog and the palettes.
 * Host-neutral: the build or a script can call it with the same JSON.
 * @returns {{ nodes: Map<string, object>, adj: Map<string, {to: string, edge: object}[]>, edges: object[] }}
 */
export function buildGraph({ items = {}, near = {}, wonders = [], places = () => [], lines = [], speakers = {}, chapters = [], palettes = [], derived = null } = {}) {
  const nodes = new Map();
  const adj = new Map();
  const edges = [];
  const pairs = new Set();
  const add = (node) => { nodes.set(node.id, node); adj.set(node.id, []); return node; };
  const link = (a, b, kind, extra = {}) => {
    if (!a || !b || a === b || !nodes.has(a) || !nodes.has(b)) return null;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (pairs.has(key)) return null;
    pairs.add(key);
    const edge = { key, a, b, kind, ...extra };
    edges.push(edge);
    adj.get(a).push({ to: b, edge });
    adj.get(b).push({ to: a, edge });
    return edge;
  };
  const all = Object.values(items);
  const ofKind = (kind) => all.filter((item) => item.kind === kind);
  const chapterId = (n) => `chapter:${pad2(n)}`;

  // Chapters: the catalog's (its "in which"), or the chapters the rooms stand in.
  const known = new Map(chapters.map((c) => [Number(c.number ?? c.n), c]));
  ofKind('room').forEach((room) => { if (room.chapter && !known.has(room.chapter)) known.set(room.chapter, { number: room.chapter }); });
  [...known.keys()].sort((a, b) => a - b).forEach((n) => {
    const c = known.get(n);
    add({ id: chapterId(n), kind: 'chapter', chapter: n, sigil: '^', title: c.title || chapterName(n), inWhich: c.inWhich || '', href: c.href || `/book/chapter/${pad2(n)}/`, likeness: { id: chapterId(n), kind: 'chapter', chapter: n, sigil: '^', container: 'room' } });
  });

  // Rooms: each section of a chapter, by its signature.
  const roomByAnchor = new Map();
  ofKind('room').forEach((item) => {
    const reading = readRoom(item.spw);
    const n = Number(String(item.id).split('.')[1]) || null;
    const anchor = String(item.href || '').split('#')[1] || '';
    add({ id: item.id, kind: 'room', chapter: item.chapter, n, sigil: reading?.op || item.sigil, title: item.title, spell: item.spw, reading, href: item.href, anchor, likeness: item.id });
    roomByAnchor.set(`${item.chapter}#${anchor}`, item.id);
  });
  nodes.forEach((node) => {
    if (node.kind !== 'chapter') return;
    const rooms = [...nodes.values()].filter((r) => r.kind === 'room' && r.chapter === node.chapter).sort((a, b) => a.n - b.n);
    node.rooms = rooms.map((r) => r.id);
    const palette = ofKind('palette').find((p) => p.chapter === node.chapter);
    node.spell = `^chapter[${node.chapter}]{ .rooms[${rooms.map((r) => r.reading?.label || spwLabel(r.title)).join(' ')}]${palette ? ` =palette[${spwLabel(String(palette.id).split(':')[1])}]` : ''} }`;
  });
  const roomAt = (c, anchor) => roomByAnchor.get(`${c}#${anchor}`) || null;

  // Wonders: the almanac's, with the room each is first met in and the rooms it returns to.
  const almanacById = new Map(wonders.map((w) => [w.id, w]));
  ofKind('wonder').forEach((item) => {
    const key = String(item.id).split(':')[1];
    const w = almanacById.get(key) || {};
    const sigil = KIND_SIGIL[w.kind] || item.sigil || '*';
    const braced = w.kind === 'bracework' ? (w.terms || []).find((t) => /^[?~@&*^!#.=%$]?[[{(<]/.test(t)) : null;
    add({
      id: item.id, kind: 'wonder', key, chapter: item.chapter || w.home || null, sigil,
      title: item.title || String(w.name || key).split(':')[0], wonderKind: w.kind || 'creature', region: w.region || '',
      note: w.note || '', hint: w.hint || item.hint || '', spell: braced || `${sigil}${spwLabel(key)}{ .at[${spwLabel(w.region || 'the_land')}] }`,
      href: item.href, characters: item.characters || [], likeness: item.id
    });
  });

  // People: the cast, by who they are as a spell.
  ofKind('character').forEach((item) => {
    const key = String(item.id).split(':')[1];
    const c = CHARACTERS[key] || {};
    add({ id: item.id, kind: 'character', key, chapter: c.first ?? item.chapter ?? null, sigil: '@', title: c.name || item.title, line: c.line || '', spell: identitySpell(key) || `@${spwLabel(key)}`, href: c.href || item.href, likeness: item.id });
  });

  // Palettes: one a chapter, finished into it a layer at a time.
  const paletteGloss = new Map(palettes.map((p) => [p.id, p]));
  ofKind('palette').forEach((item) => {
    const key = String(item.id).split(':')[1];
    add({ id: item.id, kind: 'palette', key, chapter: item.chapter || null, sigil: '=', title: item.title, gloss: paletteGloss.get(key)?.gloss || '', spell: `=palette[${spwLabel(key)}]`, href: item.href || '/almanac/#keepsakes', likeness: item.id });
  });

  // Studies in the seed atlas.
  ofKind('seed').forEach((item) => {
    const dimension = DIMENSIONS[item.dimension] || {};
    add({ id: item.id, kind: 'seed', chapter: item.chapter || null, home: item.home || null, sigil: item.sigil, title: item.title, set: item.set, dimension: item.dimension, gloss: dimension.gloss || '', valence: SET_VALENCE[item.set] || item.valence || '', spell: `${item.sigil}${spwLabel(item.dimension)}[set_${spwLabel(item.set)}]`, href: item.href, likeness: item.id });
  });

  // The Egg: it may stand here, and ask. Nothing here answers it.
  const eggCard = items['card:egg'];
  add({ id: 'egg', kind: 'egg', chapter: eggCard?.chapter || 1, sigil: '?', title: 'The Egg', spell: '?egg', href: eggCard?.chapter ? `/book/chapter/${pad2(eggCard.chapter)}/` : null });

  // The pies' lines, each grounded in a chapter and often a room.
  lines.forEach((l) => {
    const who = speakers[l.speaker]?.name || (l.speaker === 'boon' ? 'Mr. BoonWAP' : 'Mr. BaneWAP');
    const ground = l.ground || null;
    const path = ground?.chapter ? `book/chapter/${pad2(ground.chapter)}/${ground.anchor ? `#${ground.anchor}` : ''}` : '';
    add({
      id: `lore:${l.id}`, kind: 'lore', key: l.id, speaker: l.speaker, who, when: speakers[l.speaker]?.when || '', chapter: ground?.chapter || null,
      sigil: '#', title: ground?.label ? `${who}, on ${ground.label}` : `${who}, letting slip`, line: l.line, hint: l.hint || '',
      spell: `#line[${spwLabel(l.id)}]@${SPEAKER_LABEL[l.speaker] || spwLabel(l.speaker)}${path ? `{ ~"${path}" }` : ''}`,
      href: path ? `/${path}` : PIE_HREF, ground
    });
  });

  /* The edges, strongest kinds first. */
  nodes.forEach((node) => { if (node.kind === 'room') link(chapterId(node.chapter), node.id, 'contains'); });
  nodes.forEach((node) => {
    if (node.kind === 'wonder') {
      const marked = places(node.key) || [];
      const home = marked.find((p) => p.c === node.chapter) || marked[0];
      link(node.id, home ? roomAt(home.c, home.id) || chapterId(home.c) : chapterId(node.chapter), 'first');
    } else if (node.kind === 'character' && node.chapter) {
      link(node.id, chapterId(node.chapter), 'first');
    } else if (node.kind === 'egg') {
      link(node.id, chapterId(node.chapter), 'first');
    }
  });
  nodes.forEach((node) => { if (node.kind === 'palette' && node.chapter) link(chapterId(node.chapter), node.id, 'palette'); });
  nodes.forEach((node) => { if (node.kind === 'seed' && (node.chapter || node.home)) link(node.id, chapterId(node.chapter || node.home), 'planted', { home: !node.chapter }); });
  nodes.forEach((node) => {
    if (node.kind !== 'lore' || !node.ground?.chapter) return;
    link(node.id, (node.ground.anchor && roomAt(node.ground.chapter, node.ground.anchor)) || chapterId(node.ground.chapter), 'grounded');
  });
  nodes.forEach((node) => { if (node.kind === 'lore') link(node.id, `character:${node.speaker}`, 'said'); });
  nodes.forEach((node) => {
    const keeper = node.kind === 'room' ? KEEPER_IDS[node.reading?.who] : null;
    if (keeper) link(node.id, `character:${keeper}`, 'kept');
  });
  nodes.forEach((node) => {
    if (node.kind === 'room' && /\begg\b/i.test(node.title)) link('egg', node.id, 'egg');
    if (node.kind === 'lore' && /\begg\b/i.test(node.line)) link('egg', node.id, 'egg');
  });
  nodes.forEach((node) => {
    if (node.kind !== 'wonder') return;
    (places(node.key) || []).forEach((p) => link(node.id, roomAt(p.c, p.id), 'returns'));
  });
  // The same motion again: each room to the first room with its sigil in the next chapter that has one.
  const rooms = [...nodes.values()].filter((r) => r.kind === 'room').sort((a, b) => a.chapter - b.chapter || a.n - b.n);
  rooms.forEach((room) => {
    const next = rooms.find((other) => other.chapter > room.chapter && other.sigil === room.sigil);
    if (next) link(room.id, next.id, 'sigil');
  });
  // Likeness: the three nearest that are drawn here (card:egg is the Egg).
  Object.entries(near).forEach(([id, list]) => {
    if (!nodes.has(id === 'card:egg' ? 'egg' : id)) return;
    (list || []).map((other) => (other === 'card:egg' ? 'egg' : other)).filter((other) => nodes.has(other)).slice(0, 3)
      .forEach((other) => link(id === 'card:egg' ? 'egg' : id, other, 'like'));
  });
  // Derived files: one index each for sounds, share cards and icons, and a node for each file.
  // A share card is tied to its chapter, and the three indexes stand beside one another.
  if (derived) {
    const indexes = [];
    for (const group of [derived.sounds, derived.cards, derived.icons]) {
      if (!group?.id) continue;
      add({ id: group.id, kind: 'index', sigil: '&', title: group.title, says: group.says || '', spell: group.spell || `&${spwLabel(group.title)}`, href: group.href || null });
      indexes.push(group.id);
      for (const member of group.members || []) {
        if (!member?.id) continue;
        add({
          id: member.id, kind: member.kind, sigil: member.sigil || '=', title: member.title, says: member.says || '',
          spell: member.spell || '', href: member.href || null, chapter: member.chapter || null
        });
        link(group.id, member.id, 'holds');
        if (member.kind === 'card' && member.chapter) link(chapterId(member.chapter), member.id, 'card');
      }
    }
    if (indexes.length >= 2) {
      for (let i = 0; i < indexes.length; i += 1) link(indexes[i], indexes[(i + 1) % indexes.length], 'beside');
    }
  }
  // Neighbours in a stable order: the strongest ties first, then by kind, then by name.
  adj.forEach((list) => list.sort((x, y) => EDGE_RANK[x.edge.kind] - EDGE_RANK[y.edge.kind]
    || KIND_ORDER.indexOf(nodes.get(x.to).kind) - KIND_ORDER.indexOf(nodes.get(y.to).kind) || x.to.localeCompare(y.to)));
  return { nodes, adj, edges };
}

/* ─── Loops ───────────────────────────────────────────────────────────── */

/** One key for a cycle, whichever way round and wherever it starts. */
export function loopKey(ids) {
  const n = ids.length;
  let best = null;
  for (let i = 0; i < n; i += 1) {
    for (const dir of [1, -1]) {
      const seq = Array.from({ length: n }, (_, k) => ids[(i + dir * k + n * 2) % n]).join('|');
      if (best === null || seq < best) best = seq;
    }
  }
  return best;
}

/* How good a walk a loop makes, step for step: it crosses kinds of thing, chapters and kinds of tie;
 * likeness alone is thin, a crowd is a shortcut, and four or five steps is a stroll. */
function loopScore(graph, ids, edges) {
  const n = ids.length;
  const kinds = new Set(ids.map((id) => graph.nodes.get(id).kind)).size;
  const chapters = new Set(ids.map((id) => graph.nodes.get(id).chapter).filter(Boolean)).size;
  const ties = new Set(edges.map((e) => e.kind)).size;
  const likes = edges.filter((e) => e.kind === 'like').length;
  const crowds = ids.slice(1).filter((id) => graph.adj.get(id).length > HUB).length;
  return ((kinds + ties + Math.min(chapters, 3)) / n) * 4 + (n === 4 || n === 5 ? 1 : n === 3 ? -1.2 : 0) - likes * 0.8 - crowds * 1.5;
}

/**
 * Every simple cycle of three to six steps through `start`, as { ids, edges, key, score }, best first.
 * A crowd (a thing with more than `hub` neighbours: Boof, the two pies) may be the start, or one turn
 * in the middle, never two: a loop through two crowds is any two things at all.
 */
export function loopsThrough(graph, start, { min = 3, max = 6, hub = HUB, budget = 80000 } = {}) {
  if (!graph.adj.has(start)) return [];
  const found = new Map();
  const path = [start];
  const ties = [];
  const on = new Set([start]);
  let steps = 0;
  let crowds = 0;
  const walk = (id) => {
    for (const { to, edge } of graph.adj.get(id)) {
      if (steps > budget) return;
      steps += 1;
      if (to === start) {
        if (path.length >= min && edge !== ties[0]) {
          const ids = [...path];
          const key = loopKey(ids);
          if (!found.has(key)) found.set(key, { ids, edges: [...ties, edge], key });
        }
        continue;
      }
      if (on.has(to) || path.length >= max) continue;
      const crowd = graph.adj.get(to).length > hub;
      if (crowd && crowds) continue;
      if (crowd) crowds += 1;
      path.push(to);
      on.add(to);
      ties.push(edge);
      walk(to);
      path.pop();
      on.delete(to);
      ties.pop();
      if (crowd) crowds -= 1;
    }
  };
  walk(start);
  return [...found.values()].map((loop) => ({ ...loop, score: loopScore(graph, loop.ids, loop.edges) })).sort((a, b) => b.score - a.score || a.ids.length - b.ids.length || a.key.localeCompare(b.key));
}

/** A few loops worth walking from here, unlike each other. */
export function loopsToOffer(graph, start, { limit = 4 } = {}) {
  const picked = [];
  for (const loop of loopsThrough(graph, start)) {
    if (picked.length >= limit) break;
    const overlaps = picked.some((p) => loop.ids.filter((id) => id !== start && p.ids.includes(id)).length > Math.floor((loop.ids.length - 1) / 2));
    if (!overlaps) picked.push(loop);
  }
  return picked;
}

/* ─── Layout: rings round the focus, in the hyperbolic plane ──────────── */

/**
 * The focus at the centre, its neighbours on the first ring, theirs beyond, each ring at hyperbolic
 * distance STEP further out; each thing gets a wedge of its parent's, by how much hangs from it.
 * `align` = { id, angle } turns the whole so that id sits at that angle.
 * @returns {{ focus: string, at: Map<string, { id, z, depth, parent, wedge, cap }>, edges: object[] }}
 */
export function layoutFrom(graph, focus, { cap = CAP, ringOne = RING_ONE, depth = DEPTH, step = STEP, align = null } = {}) {
  const tree = new Map([[focus, { id: focus, depth: 0, parent: null, children: [] }]]);
  let frontier = [focus];
  for (let d = 1; d <= depth && tree.size < cap && frontier.length; d += 1) {
    // The first ring holds up to ringOne; the second leaves a third of what is left for the rim's crowd.
    const left = cap - tree.size;
    const room = d === 1 ? Math.min(left, ringOne) : d < depth ? Math.min(left, Math.max(frontier.length * 2, Math.ceil(left * 0.62))) : left;
    const queues = frontier.map((id) => graph.adj.get(id).filter((n) => !tree.has(n.to)).map((n) => ({ parent: id, to: n.to })));
    const next = [];
    let added = 0;
    for (let round = 0; added < room && queues.some((q) => q.length); round += 1) {
      for (const q of queues) {
        if (added >= room) break;
        while (q.length && tree.has(q[0].to)) q.shift();
        const pick = q.shift();
        if (!pick) continue;
        const node = { id: pick.to, depth: d, parent: pick.parent, children: [] };
        tree.set(pick.to, node);
        tree.get(pick.parent).children.push(node);
        next.push(pick.to);
        added += 1;
      }
    }
    frontier = next;
  }
  // Weights: a thing with more hanging from it gets a wider wedge.
  const weigh = (node) => { node.weight = 1 + node.children.reduce((sum, child) => sum + weigh(child), 0) * 0.55; return node.weight; };
  const root = tree.get(focus);
  weigh(root);
  const kindRank = (id) => KIND_ORDER.indexOf(graph.nodes.get(id)?.kind);
  const at = new Map();
  const place = (node, from, to) => {
    const angle = (from + to) / 2;
    const r = node.depth ? Math.tanh((node.depth * step) / 2) : 0;
    const wedge = to - from;
    at.set(node.id, { id: node.id, z: [r * Math.cos(angle), r * Math.sin(angle)], depth: node.depth, parent: node.parent, wedge, angle, cap: node.depth ? 0.46 * wedge * r : 1 });
    const kids = [...node.children].sort((a, b) => kindRank(a.id) - kindRank(b.id) || a.id.localeCompare(b.id));
    const total = kids.reduce((sum, k) => sum + k.weight, 0) || 1;
    let cursor = node.depth ? from : -Math.PI / 2 - (Math.PI * (kids[0]?.weight || 1)) / total;
    // Each thing's wedge is a share of the one it hangs from; a deep ring may borrow a little room either side.
    const span = node.depth ? Math.min(wedge * 1.15, Math.PI) : Math.PI * 2;
    if (node.depth) cursor = angle - span / 2;
    kids.forEach((kid) => {
      const share = (span * kid.weight) / total;
      place(kid, cursor, cursor + share);
      cursor += share;
    });
  };
  place(root, 0, Math.PI * 2);
  if (align && at.has(align.id) && at.get(align.id).depth) {
    const turn = align.angle - cArg(at.get(align.id).z);
    at.forEach((p) => { p.z = cTurn(p.z, turn); p.angle += turn; });
  }
  const drawn = graph.edges.filter((e) => at.has(e.a) && at.has(e.b));
  return { focus, at, edges: drawn };
}

/* ─── Words ───────────────────────────────────────────────────────────── */

const KIND_WORDS = Object.freeze({
  chapter: 'a chapter', room: 'a room', wonder: 'a wonder', character: 'someone in the book', palette: 'a palette',
  lore: 'a line the pies let slip', seed: 'a study in the seed atlas', egg: 'a question',
  card: 'a share card', sound: 'a sound', icon: 'an app icon', index: 'an index of what the tools made'
});

/** "a passage in Chapter Four", "a wonder of the dawnward field". */
export function kindLine(node) {
  if (!node) return '';
  switch (node.kind) {
    case 'chapter': return `${chapterName(node.chapter)}${node.inWhich ? `, in which ${node.inWhich}` : ''}`;
    case 'room': return `${node.reading ? `a ${node.reading.kind}` : 'a room'} in ${chapterName(node.chapter)}`;
    case 'wonder': return `a ${node.wonderKind}${node.chapter ? ` · ${chapterName(node.chapter)}` : ''}`;
    case 'character': return node.chapter ? `someone first met in ${chapterName(node.chapter)}` : 'someone met in the lanes';
    case 'palette': return node.chapter ? `the palette of ${chapterName(node.chapter)}` : 'a palette of the lanes';
    case 'seed': return 'a study in the seed atlas';
    case 'lore': return `a line ${node.who} lets slip`;
    case 'egg': return 'a question';
    case 'card': return node.chapter ? `the share card for ${chapterName(node.chapter)}` : 'a share card';
    case 'sound': return 'a sound the lanes may play';
    case 'icon': return 'an app icon drawn from the bud';
    case 'index': return 'an index of what the tools made';
    default: return KIND_WORDS[node.kind] || 'a thing';
  }
}

/** What the neighbour `to` is, seen from `from`, by the edge between them. */
export function tieWords(graph, edge, from, to) {
  const there = graph.nodes.get(to);
  const here = graph.nodes.get(from);
  const outward = edge.a === from;
  switch (edge.kind) {
    case 'contains': return outward ? 'a room of this chapter' : 'the chapter it stands in';
    case 'first':
      if (here.kind === 'egg' || there.kind === 'egg') return outward ? 'where it is first carried' : 'something warm is first carried here';
      return outward ? (here.kind === 'character' ? 'where they are first met' : 'where it is first met') : 'first met here';
    case 'returns': return outward ? 'where it comes back' : 'comes back here';
    case 'grounded': return outward ? 'the place it is about' : 'a line about this place';
    case 'said': return outward ? 'who lets it slip' : 'a line they let slip';
    case 'kept': return outward ? 'who keeps it' : 'a room they keep';
    case 'palette': return outward ? 'its palette' : 'the chapter it colours';
    case 'planted': return outward ? (edge.home ? 'the chapter it is most at home in' : 'the chapter it is planted in') : 'a study planted here';
    case 'egg':
      if (outward) return there.kind === 'lore' ? 'a line that asks after it' : 'where it is carried';
      return here.kind === 'lore' ? 'it asks after something warm' : 'something warm is carried here';
    case 'sigil': {
      const later = there.chapter > here.chapter;
      return `the same ${here.sigil} ${later ? 'again' : 'before'}, in ${chapterName(there.chapter)}`;
    }
    case 'like': {
      const a = here.likeness;
      const b = there.likeness;
      return a && b ? `alike: ${whyWords(likenessScore(likeOf(a), likeOf(b)).shared)}` : 'alike';
    }
    case 'card': return outward ? 'its share card' : 'the chapter this card covers';
    case 'holds': return outward ? 'one it lists' : 'the index that lists it';
    case 'beside': return 'another index of what the tools made';
    default: return '';
  }
}

let likenessItems = {};

/** A keeper as the book writes them: Boof, the Genie, the Fool. */
export const keeperWords = (who) => roomKeeper(who).replace(/^the (fool|genie|mirror|archivist|crier|porter|stranger)\b/, (m, w) => (w === 'fool' || w === 'genie' ? `the ${capital(w)}` : m));
const likeOf = (ref) => (typeof ref === 'string' ? likenessItems[ref] || { id: ref } : ref);

/* ─── This reader's own marks: what was stood on, what was walked ─────── */

function readMarks() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || 'null');
    if (value && typeof value === 'object') {
      return { focused: value.focused || {}, walked: value.walked || {}, loops: value.loops || {}, loopEdges: value.loopEdges || {}, at: value.at || '' };
    }
  } catch { /* a blocked shelf keeps this visit's walks only */ }
  return { focused: {}, walked: {}, loops: {}, loopEdges: {}, at: '' };
}

function writeMarks(marks) {
  try { globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(marks)); } catch { /* kept for this visit */ }
}

function heardLines() {
  try {
    const record = JSON.parse(globalThis.localStorage?.getItem('lore.pie.v1') || '{}');
    return new Set(Array.isArray(record.lore) ? record.lore : []);
  } catch { return new Set(); }
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/* ─── The page ────────────────────────────────────────────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const roleOf = (sigil) => SIGIL_ROLES[sigil]?.role || 'plain';
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const short = (text, n = 22) => (String(text).length > n ? `${String(text).slice(0, n - 1).trimEnd()}…` : String(text));

/** Normalise ?focus=chapter:4 → chapter:04. */
export function focusFromAddress(search = globalThis.location?.search || '') {
  const raw = new URLSearchParams(search).get('focus');
  if (!raw) return '';
  const chapter = /^chapter:(\d{1,2})$/.exec(raw);
  return chapter ? `chapter:${pad2(Number(chapter[1]))}` : raw;
}

/** Entries of a flat index: *name{ #key["value"] ~"path" }. */
export function readIndexEntries(text) {
  const entries = [];
  const re = /\*([a-z0-9_]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(String(text)))) {
    const body = m[2];
    const fields = {};
    for (const field of body.matchAll(/#([a-z_]+)\["((?:[^"\\]|\\.)*)"\]/g)) fields[field[1]] = field[2];
    const path = (body.match(/~"([^"]+)"/) || [])[1] || '';
    entries.push({ name: m[1], fields, path });
  }
  return entries;
}

/** The spell of a sidecar: from its first action block, comments above left off. */
export function spellOfSidecar(text) {
  const start = String(text).search(/^!/m);
  return start >= 0 ? String(text).slice(start).trim() : '';
}

/** A path in an index, and the sidecar that sits beside that file. */
function derivedPaths(path) {
  const clean = String(path || '').replace(/^\//, '');
  if (!clean) return { href: '', sidecar: '' };
  if (/\.spw$/i.test(clean)) return { href: `/${clean}`, sidecar: `/${clean}` };
  if (/\.[a-z0-9]+$/i.test(clean)) return { href: `/${clean}`, sidecar: `/${clean.replace(/\.[a-z0-9]+$/i, '.spw')}` };
  return { href: `/${clean}/index.spw`, sidecar: `/${clean}/index.spw` };
}

const niceName = (name) => capital(String(name).replace(/_/g, ' '));

async function loadDerived() {
  const text = async (url) => {
    try {
      const res = await fetch(url);
      return res.ok ? await res.text() : '';
    } catch { return ''; }
  };
  const group = async (indexUrl, id, title, kind, sigil) => {
    const indexText = await text(indexUrl);
    const entries = readIndexEntries(indexText);
    const members = await Promise.all(entries.map(async (entry) => {
      const paths = derivedPaths(entry.path);
      const sidecar = paths.sidecar ? await text(paths.sidecar) : '';
      const chapter = kind === 'card' ? Number((/^chapter_(\d+)$/.exec(entry.name) || [])[1]) || null : null;
      return {
        id: `derived:${kind}:${kind === 'card' && chapter ? pad2(chapter) : entry.name}`,
        kind, sigil, title: entry.fields.title || niceName(entry.name),
        says: entry.fields.says || '',
        spell: spellOfSidecar(sidecar),
        href: paths.href || null,
        chapter
      };
    }));
    return {
      id, title, says: (indexText.split('\n').find((line) => line.startsWith('# ')) || '').slice(2).trim(),
      spell: spellOfSidecar(indexText), href: indexUrl, members: members.filter((member) => member.spell)
    };
  };
  const [sounds, cards, icons] = await Promise.all([
    group('/book/audio/index.spw', 'derived:sounds', 'The sounds', 'sound', '!'),
    group('/book/images/og/index.spw', 'derived:cards', 'The share cards', 'card', '='),
    group('/book/pwa/icons/index.spw', 'derived:icons', 'The app icons', 'icon', '*')
  ]);
  return { sounds, cards, icons };
}

async function loadSources() {
  const json = (url) => fetch(url).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  const [likeness, almanac, lore, catalog, palettes, derived] = await Promise.all([
    loadLikeness(), loadAlmanac(), json(LORE_URL), json(CATALOG_URL), json(PALETTES_URL), loadDerived()
  ]);
  return {
    items: likeness?.items || {},
    near: likeness?.near || {},
    wonders: almanac?.wonders || [],
    places: almanac?.places || (() => []),
    lines: lore?.lines || [],
    speakers: lore?.speakers || {},
    chapters: catalog?.chapters || [],
    palettes: palettes?.palettes || [],
    derived
  };
}

/* A room's air lives in its chapter's JSON: fetched once a room there is stood on. */
const chapterFiles = new Map();
function roomAir(node) {
  if (node?.kind !== 'room') return Promise.resolve('');
  const nn = pad2(node.chapter);
  if (!chapterFiles.has(nn)) chapterFiles.set(nn, fetch(CHAPTER_URL(nn)).then((res) => (res.ok ? res.json() : null)).catch(() => null));
  return chapterFiles.get(nn).then((chapter) => {
    const rooms = (chapter?.sections || []).filter((s) => s.room);
    const room = rooms[node.n - 1];
    return room && room.room.spw === node.spell ? room.room.air || '' : '';
  });
}

export function initProjectionDisk(mount) {
  if (!mount || mount.dataset.diskReady) return;
  mount.dataset.diskReady = 'true';
  const reduce = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  let graph = null;
  let view = null;           // the layout on the page
  let pos = new Map();       // where each thing is drawn now: id → { z, alpha, cap }
  let active = -1;           // the neighbour lit by the arrow keys
  let animating = null;
  let walking = null;
  let trail = [];
  const marks = readMarks();
  const loopCache = new Map();
  const ui = buildShell(mount);
  const nodeEls = new Map();
  const edgeEls = new Map();
  let k = 0.01;              // viewBox units per CSS pixel

  const measure = () => {
    const width = ui.svg.getBoundingClientRect().width || 320;
    k = (VIEW * 2) / width;
    ui.svg.style.setProperty('--k', String(k));
  };
  measure();
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { measure(); if (!animating) paint(); }).observe(ui.svg);

  const titleOf = (node) => {
    if (!node) return '';
    if (['wonder', 'character', 'palette', 'seed'].includes(node.kind)) {
      const item = likenessItems[node.id];
      return item ? shownTitle(item, discoveryOf(item)).replace(/\.$/, '') : node.title;
    }
    return node.title;
  };
  const isFound = (node) => !['wonder', 'character', 'palette', 'seed'].includes(node.kind) || !likenessItems[node.id] || discoveryOf(likenessItems[node.id]) === 'found';
  /* What a thing shows as its Spw: its spell once found, else a veil, a probe that says where to look. */
  const spellOf = (node) => {
    if (isFound(node)) return node.spell;
    if (node.kind === 'wonder') {
      const first = graph.adj.get(node.id).find((n) => n.edge.kind === 'first');
      const room = first && graph.nodes.get(first.to);
      return room?.kind === 'room' ? `?room_${room.n}{ .chapter[${room.chapter}] }` : `?chapter_${node.chapter || 'unknown'}`;
    }
    if (node.kind === 'seed') return '?the_atlas';
    return node.chapter ? `?chapter_${node.chapter}` : '?the_lanes';
  };
  const stood = (id) => Boolean(marks.focused[id]);
  const walked = (id) => Boolean(marks.walked[id]);
  /* A spell too long for a label keeps its head: @bane{ … } → @bane{…}. */
  const spellHead = (text) => (text.length > 24 && /^[^{]{2,}\{/.test(text) ? `${text.slice(0, text.indexOf('{')).trimEnd()}{…}` : text);
  const labelOf = (node) => (stood(node.id) ? titleOf(node) : spellHead(spellOf(node)));

  /* ─── Drawing ─── */

  const nodeEl = (id) => {
    if (nodeEls.has(id)) return nodeEls.get(id);
    const node = graph.nodes.get(id);
    const g = svg('g', { class: `spw-disk-node kind-${node.kind} op-${roleOf(node.sigil)}` });
    const halo = svg('circle', { class: 'spw-disk-halo', r: 0 });
    const dot = svg('circle', { class: 'spw-disk-dot', r: 0 });
    let seal = null;
    if (node.likeness) {
      seal = likenessMark(typeof node.likeness === 'string' ? likenessItems[node.likeness] || node.likeness : node.likeness, { size: 64, decorative: true });
      if (seal) seal.classList.add('spw-disk-seal');
    }
    const glyph = svg('text', { class: 'spw-disk-glyph', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    glyph.textContent = node.kind === 'egg' ? '?' : node.sigil || '·';
    const ring = svg('circle', { class: 'spw-disk-loopmark', r: 0 });
    const label = svg('text', { class: 'spw-disk-label' });
    g.append(halo, dot);
    if (seal) g.append(seal);
    g.append(glyph, ring, label);
    g.addEventListener('click', () => { if (id !== view?.focus) step(id); });
    g.addEventListener('pointerenter', () => light(id, true));
    g.addEventListener('pointerleave', () => light(id, false));
    ui.nodes.append(g);
    const entry = { g, halo, dot, seal, glyph, ring, label, shown: '' };
    nodeEls.set(id, entry);
    return entry;
  };

  const edgeEl = (edge) => {
    if (edgeEls.has(edge.key)) return edgeEls.get(edge.key);
    const path = svg('path', { class: `spw-disk-edge tie-${edge.kind}${edge.kind === 'sigil' ? ` op-${roleOf(graph.nodes.get(edge.a).sigil)}` : ''}` });
    ui.edges.append(path);
    edgeEls.set(edge.key, path);
    return path;
  };

  /* A thing of one hyperbolic size, drawn at (1 − |z|²) of its size at the centre; the centre a little
   * larger still, and a crowded ring held to its wedge so neighbours never overlap. */
  const radiusOf = (p) => {
    const base = Math.min(30, Math.max(20, 0.085 / k)) * k;   // ~20–30px at the centre
    const near = Math.max(0, 1 - cAbs(p.z) / 0.3);
    const r = base * (1 + 0.3 * near) * (1 - Math.min(cAbs(p.z), 0.999) ** 2);
    return near > 0.92 ? r : Math.min(r, Math.max(p.cap ?? r, base * 0.25));
  };

  /** Draw every thing at its place now. Called once a frame while moving, once otherwise. */
  function paint(edgeSet = view?.edges || []) {
    if (!view) return;
    const ringOne = [...pos.values()].filter((p) => p.depth === 1 && p.alpha > 0.5).length;
    const roomy = ringOne ? (2 * Math.PI * Math.tanh(STEP / 2)) / ringOne / k > 74 : true;
    const focusId = view.focus;
    const activeId = view.ring[active]?.id;
    nodeEls.forEach((entry, id) => { if (!pos.has(id)) { entry.g.remove(); nodeEls.delete(id); } });
    pos.forEach((p, id) => {
      const node = graph.nodes.get(id);
      const entry = nodeEl(id);
      const isFocus = id === focusId;
      const r = radiusOf(p);
      const px = r / k;
      const [x, y] = p.z;
      entry.g.style.opacity = String(p.alpha);
      entry.g.classList.toggle('is-focus', isFocus);
      entry.g.classList.toggle('is-active', id === activeId || id === p.hover);
      entry.g.classList.toggle('is-walked', walked(id));
      entry.g.classList.toggle('is-stood', stood(id));
      entry.g.classList.toggle('is-far', px < 3);
      entry.g.classList.toggle('is-on-loop', Boolean(walking?.loop.ids.includes(id)));
      entry.g.style.display = px < 0.9 ? 'none' : '';
      entry.halo.setAttribute('cx', x.toFixed(4)); entry.halo.setAttribute('cy', y.toFixed(4)); entry.halo.setAttribute('r', (r + 5 * k).toFixed(4));
      entry.dot.setAttribute('cx', x.toFixed(4)); entry.dot.setAttribute('cy', y.toFixed(4)); entry.dot.setAttribute('r', r.toFixed(4));
      entry.ring.setAttribute('cx', x.toFixed(4)); entry.ring.setAttribute('cy', y.toFixed(4)); entry.ring.setAttribute('r', (r + 3.2 * k).toFixed(4));
      const sealed = entry.seal && px >= 8;
      if (entry.seal) {
        entry.seal.style.display = sealed ? '' : 'none';
        if (sealed) {
          const s = r * 1.84;
          entry.seal.setAttribute('x', (x - s / 2).toFixed(4)); entry.seal.setAttribute('y', (y - s / 2).toFixed(4));
          entry.seal.setAttribute('width', s.toFixed(4)); entry.seal.setAttribute('height', s.toFixed(4));
        }
      }
      entry.glyph.style.display = !sealed && px >= 5 ? '' : 'none';
      entry.glyph.setAttribute('x', x.toFixed(4)); entry.glyph.setAttribute('y', y.toFixed(4));
      entry.glyph.setAttribute('font-size', (Math.max(9, px * 1.05) * k).toFixed(4));
      // Labels: the focus always; the first ring when there is room, or when lit.
      const labelled = isFocus || (p.depth === 1 && (roomy || id === activeId || id === p.hover) && p.alpha > 0.3) || id === activeId || id === p.hover;
      entry.label.style.display = labelled ? '' : 'none';
      if (labelled) {
        const text = isFocus ? short(titleOf(node), 30) : short(labelOf(node), 22);
        if (entry.shown !== text) { entry.label.textContent = text; entry.shown = text; }
        entry.label.classList.toggle('is-syntax', !isFocus && !stood(id));
        const fs = (isFocus ? 14 : 11.5) * k;
        entry.label.setAttribute('font-size', fs.toFixed(4));
        if (isFocus || cAbs(p.z) < 0.08) {
          entry.label.setAttribute('x', x.toFixed(4)); entry.label.setAttribute('y', (y + r + fs * 1.15).toFixed(4));
          entry.label.setAttribute('text-anchor', 'middle');
        } else {
          const ang = cArg(p.z);
          const gap = r + 4 * k;
          const anchor = Math.cos(ang) > 0.3 ? 'start' : Math.cos(ang) < -0.3 ? 'end' : 'middle';
          // Kept inside the stage: the text's width is guessed from its letters (mono is wider).
          const width = text.length * fs * (entry.label.classList.contains('is-syntax') ? 0.66 : 0.52);
          const reach = { start: [0, width], end: [-width, 0], middle: [-width / 2, width / 2] }[anchor];
          let lx = x + Math.cos(ang) * gap;
          lx += Math.max(0, -VIEW + 0.01 - (lx + reach[0])) - Math.max(0, lx + reach[1] - (VIEW - 0.01));
          const ly = y + Math.sin(ang) * gap + fs * 0.35;
          entry.label.setAttribute('x', lx.toFixed(4)); entry.label.setAttribute('y', ly.toFixed(4));
          entry.label.setAttribute('text-anchor', anchor);
        }
      }
    });
    const keep = new Set();
    edgeSet.forEach((edge) => {
      const p = pos.get(edge.a);
      const q = pos.get(edge.b);
      if (!p || !q) return;
      keep.add(edge.key);
      const path = edgeEl(edge);
      path.setAttribute('d', geodesic(p.z, q.z));
      const depth = Math.max(p.depth ?? 3, q.depth ?? 3);
      const lit = Boolean(walking?.lit.has(edge.key)) || Boolean(activeId && (edge.a === activeId || edge.b === activeId) && (edge.a === focusId || edge.b === focusId));
      path.style.opacity = String(Math.min(p.alpha, q.alpha) * (lit || depth <= 1 ? 1 : depth === 2 ? 0.62 : 0.34));
      path.classList.toggle('is-focus-tie', edge.a === focusId || edge.b === focusId);
      path.classList.toggle('is-lit', lit);
      path.classList.toggle('is-walked', walked(edge.a) && walked(edge.b) && Boolean(marks.loopEdges?.[edge.key]));
    });
    edgeEls.forEach((path, key) => { if (!keep.has(key)) { path.remove(); edgeEls.delete(key); } });
    ui.rim.querySelectorAll('.spw-disk-rim-sigil').forEach((t) => t.classList.toggle('is-lit', t.textContent === graph.nodes.get(focusId)?.sigil));
  }

  const light = (id, on) => {
    const p = pos.get(id);
    if (!p) return;
    p.hover = on ? id : null;
    if (!animating) paint();
  };

  /* ─── Moving: the geodesic glide, then the new rings settle ─── */

  function settle(next) {
    view = next;
    pos = new Map([...next.at].map(([id, p]) => [id, { z: p.z, depth: p.depth, cap: p.cap, alpha: 1 }]));
  }

  /** A move the reader asked for: it stops a walk, and the address remembers where they stand. */
  function step(id) {
    stopWalk();
    return go(id, { address: true });
  }

  function go(id, { quiet = false, address = false } = {}) {
    if (!graph.nodes.has(id)) return Promise.resolve();
    if (animating) { cancelAnimationFrame(animating.raf); animating.done(); }
    const old = view;
    const w = pos.get(id)?.z;
    // Keep the place just left where the walk puts it: T_w(old focus) = −w.
    let align = null;
    if (old && w) {
      const anchor = old.focus;
      const angle = cArg(mobius(pos.get(anchor)?.z || [0, 0], w));
      align = { id: anchor, angle };
    }
    const next = layoutFrom(graph, id, { align: align && graph.adj.get(id).some((n) => n.to === align.id) ? align : null });
    if (align && !next.at.get(align.id)) {
      // Not a neighbour: turn by the first step back toward where we were.
      const step = [...next.at.values()].find((p) => p.depth === 1 && pos.has(p.id));
      if (step) {
        const turn = cArg(mobius(pos.get(step.id).z, w)) - cArg(step.z);
        next.at.forEach((p) => { p.z = cTurn(p.z, turn); });
      }
    }
    next.ring = ringOf(next);
    const finish = () => {
      settle(next);
      active = -1;
      arrive(id, { quiet, address });
      paint();
    };
    if (!old || !w || reduce.matches || cAbs(w) < 1e-6) {
      finish();
      return Promise.resolve();
    }
    const from = new Map([...pos].map(([key, p]) => [key, { ...p }]));
    const edgeSet = [...new Map([...old.edges, ...next.edges].map((e) => [e.key, e])).values()];
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - start) / MOVE_MS);
        const a = alongGeodesic(w, ease(t));
        const blend = smooth(0.55, 1, t);
        const now_ = new Map();
        from.forEach((p, key) => {
          const moved = mobius(p.z, a);
          const target = next.at.get(key);
          now_.set(key, target
            ? { z: cLerp(moved, target.z, blend), depth: target.depth, cap: p.cap + (target.cap - p.cap) * blend, alpha: 1 }
            : { z: moved, depth: p.depth, cap: p.cap, alpha: 1 - blend });
        });
        next.at.forEach((target, key) => {
          if (from.has(key)) return;
          const parent = from.get(target.parent);
          const origin = parent ? mobius(parent.z, a) : cTurn([0.985, 0], cArg(target.z));
          now_.set(key, { z: cLerp(origin, target.z, blend), depth: target.depth, cap: target.cap, alpha: blend });
        });
        pos = now_;
        view = { ...next, focus: t < 0.5 ? old.focus : id };
        paint(edgeSet);
        if (t < 1) animating.raf = requestAnimationFrame(frame);
        else { animating = null; finish(); resolve(); }
      };
      animating = { raf: requestAnimationFrame(frame), done: () => { animating = null; finish(); resolve(); } };
    });
  }

  const ringOf = (layout) => [...layout.at.values()].filter((p) => p.depth === 1)
    .sort((a, b) => ((a.angle + Math.PI * 2.5) % (Math.PI * 2)) - ((b.angle + Math.PI * 2.5) % (Math.PI * 2)))
    .map((p) => ({ id: p.id }));

  /* ─── Arriving: marks, the card, the ways on, the loops ─── */

  function arrive(id, { quiet, address }) {
    const firstTime = !marks.focused[id];
    marks.focused[id] = 1;
    marks.at = id;
    if (!walking) closeByHand(id);
    trail = [...trail.filter((t) => t !== id), id].slice(-7);
    writeMarks(marks);
    paintCard(id, firstTime);
    paintWays(id);
    paintLoops(id);
    paintTrail();
    if (!quiet) say(`${titleOf(graph.nodes.get(id))}: ${kindLine(graph.nodes.get(id))}.`);
    if (address && history.replaceState) {
      try { history.replaceState(history.state, '', `${location.pathname}?focus=${encodeURIComponent(id).replace(/%3A/g, ':')}#projection`); } catch { /* the address stays */ }
    }
  }

  /* A loop closed by hand: back at a place stood on three to six steps ago, each step a tie. */
  function closeByHand(id) {
    const i = trail.lastIndexOf(id);
    if (i < 0) return;
    const ids = trail.slice(i);
    if (ids.length < 3 || ids.length > 6 || new Set(ids).size !== ids.length) return;
    const ties = ids.map((a, j) => graph.adj.get(a).find((n) => n.to === ids[(j + 1) % ids.length])?.edge);
    if (ties.some((t) => !t)) return;
    complete({ ids, edges: ties, key: loopKey(ids) }, { byHand: true });
  }

  function complete(loop, { byHand = false } = {}) {
    const fresh = !marks.loops[loop.key];
    marks.loops[loop.key] = today();
    loop.ids.forEach((x) => { marks.walked[x] = 1; });
    marks.loopEdges = marks.loopEdges || {};
    loop.edges.forEach((e) => { marks.loopEdges[e.key] = 1; });
    writeMarks(marks);
    say(fresh
      ? `Back where you began. A loop of ${loop.ids.length}${byHand ? ', walked by hand' : ''}: everything on it now says what it is for.`
      : `Back where you began, round a loop you have walked before.`);
    ui.mount.classList.remove('is-closing');
    void ui.mount.offsetWidth;
    ui.mount.classList.add('is-closing');
  }

  const say = (text) => { ui.live.textContent = text; };

  function paintCard(id, firstTime) {
    const node = graph.nodes.get(id);
    const card = ui.card;
    card.replaceChildren();
    card.className = `spw-disk-card kind-${node.kind} op-${roleOf(node.sigil)}`;
    const head = el('header', 'spw-disk-card-head');
    if (node.likeness) {
      const seal = likenessMark(typeof node.likeness === 'string' ? likenessItems[node.likeness] || node.likeness : node.likeness, { size: 44, decorative: true });
      if (seal) head.append(seal);
    } else {
      head.append(el('span', 'spw-disk-card-glyph', node.kind === 'egg' ? '?' : node.sigil));
    }
    const words = el('div', 'spw-disk-card-words');
    words.append(el('p', 'spw-disk-card-kind', kindLine(node)), el('h3', 'spw-disk-card-title', titleOf(node)));
    head.append(words);
    card.append(head);

    // Syntax: what it says, always.
    const syntax = layer('syntax', 'What it says', 'syntax');
    const spell = renderSpell(spellOf(node), {
      cast: false,
      layout: 'line',
      label: `${titleOf(node)}, in Spw`,
      link: walked(id) ? (path) => `/${path.replace(/^\//, '')}` : null,
      explain: (atom, sigil) => (node.kind === 'egg' ? '? asks.' : `${sigil} ${SIGIL_ROLES[sigil]?.role || ''}: ${SIGIL_ROLES[sigil]?.says || ''}`)
    });
    spell.classList.add('is-compact');
    syntax.append(spell);
    card.append(syntax);

    // Semantics: what it means, once stood on (it is being stood on now).
    const semantics = layer('semantics', 'What it means', 'semantics');
    if (node.kind === 'egg') {
      // The Egg stays a probe: no meaning line, only the question.
      semantics.classList.add('is-probe');
      const probe = el('p', 'spw-disk-probe', '?');
      probe.setAttribute('aria-label', 'A question, left open.');
      semantics.append(probe);
    } else {
      meaningOf(node).forEach((line, i) => semantics.append(el('p', i === 0 && node.kind === 'room' ? 'spw-disk-air' : '', line)));
      if (node.kind === 'room') {
        const air = semantics.querySelector('.spw-disk-air');
        roomAir(node).then((text) => { if (text && air?.isConnected && view?.focus === id) air.textContent = text; else if (air && !text) air.remove(); });
      }
    }
    if (firstTime) semantics.classList.add('is-new');
    card.append(semantics);

    // Pragmatics: what it is for, once a loop through it is walked.
    const pragmatics = layer('pragmatics', 'What it is for', 'pragmatics');
    if (walked(id)) {
      const list = el('ul', 'spw-disk-uses');
      useOf(node).forEach(({ text, href, link }) => {
        const li = el('li', '');
        if (text) li.append(document.createTextNode(text));
        if (href) {
          const a = el('a', '', link);
          a.href = href;
          if (text) li.append(' ');
          li.append(a);
        }
        list.append(li);
      });
      pragmatics.append(list);
    } else {
      pragmatics.classList.add('is-locked');
      pragmatics.append(el('p', 'spw-disk-locked', 'Walk a loop through here, and it will say what it is for.'));
    }
    card.append(pragmatics);
  }

  const layer = (cls, name, register) => {
    const box = el('section', `spw-disk-layer is-${cls}`);
    const h = el('h4', 'spw-disk-layer-name');
    h.append(el('span', 'spw-disk-layer-register', register), ' ', name);
    box.append(h);
    return box;
  };

  function meaningOf(node) {
    const sigilSays = (s) => (SIGIL_ROLES[s] ? `Its sigil, ${s}, is ${SIGIL_ROLES[s].role}: it ${SIGIL_ROLES[s].says}.` : '');
    switch (node.kind) {
      case 'room': return ['', roomSentence(node.reading)];
      case 'chapter': {
        const keepers = [...new Set((node.rooms || []).map((r) => graph.nodes.get(r)?.reading?.who).filter(Boolean).map(keeperWords))];
        return [
          `${chapterName(node.chapter)}: ${node.title}${node.inWhich ? `, in which ${node.inWhich}` : ''}.`,
          `Its rooms are kept by ${keepers.length > 1 ? `${keepers.slice(0, -1).join(', ')} and ${keepers[keepers.length - 1]}` : keepers[0] || 'the book'}. The ^ binds them upward into one chapter.`
        ];
      }
      case 'wonder':
        return isFound(node)
          ? [`${node.note}`, `A ${node.wonderKind} of ${node.region}. ${sigilSays(node.sigil)}`]
          : [`Not kept yet. ${node.hint}`, sigilSays(node.sigil)];
      case 'character': {
        const c = CHARACTERS[node.key];
        return isFound(node)
          ? [node.line, 'An @ is a way of looking: who it is, and whose eyes a room is seen through.']
          : [c?.first ? `Not met yet: first in ${chapterName(c.first)}.` : 'Not met yet: met in the lanes.', 'An @ is a way of looking.'];
      }
      case 'palette':
        return isFound(node)
          ? [node.gloss || `${node.title}.`, 'An = is a lean, a way chosen: the colours a chapter is finished into.']
          : ['A palette not yet begun: read its chapter to its end, and its first colour is yours.', 'An = is a lean, a way chosen.'];
      case 'seed':
        return [`${capital(node.dimension.replace(/-/g, ' '))}: ${node.gloss || 'a study'}.`, `${sigilSays(node.sigil)}${node.valence ? ` It leans ${node.valence}.` : ''}`];
      case 'lore': {
        const heard = heardLines().has(node.key);
        return heard
          ? [`“${node.line}”`, 'A # is something said, or marked: it stays.']
          : [`The pies have not let this one slip to you yet.${node.hint ? ` ${node.hint}` : ''}`, 'A # is something said, or marked: it stays.'];
      }
      case 'card':
        return [node.says, node.chapter ? `A share card for ${chapterName(node.chapter)}. Each =@ is one mutation of the plate, in the order it was applied.` : 'A share card. Each =@ is one mutation of the plate, in the order it was applied.'].filter(Boolean);
      case 'sound':
        return [node.says, 'A sound the lanes may play. =@heard names the filter the ear applies.'].filter(Boolean);
      case 'icon':
        return [node.says, 'An icon drawn from the bud. Each =@ is one mutation of that sigil.'].filter(Boolean);
      case 'index':
        return [node.says || 'An index of files the tools made.', 'The & gathers them. Stand on one to read its sidecar.'];
      default: return [];
    }
  }

  function useOf(node) {
    const out = [];
    const read = (href, words) => href && out.push({ text: '', href, link: words });
    switch (node.kind) {
      case 'room':
        read(node.href, `Read it: ${chapterName(node.chapter)}, room ${node.n} →`);
        out.push({ text: 'In Exactly One Pie a room can be cast.', href: PIE_HREF, link: 'To the lanes →' });
        out.push({ text: `${capital(keeperWords(node.reading?.who || 'the_book'))} keeps it: the @ after its name is whose eyes it is seen through.` });
        break;
      case 'chapter':
        read(node.href, `Read ${chapterName(node.chapter)} →`);
        out.push({ text: 'Carry it through the lanes, and the pies will tell you what they know of it.', href: PIE_HREF, link: 'To the lanes →' });
        break;
      case 'wonder': {
        const first = graph.adj.get(node.id).find((n) => n.edge.kind === 'first');
        const room = first && graph.nodes.get(first.to);
        read(room?.href, `Where it is first met: ${room?.title || chapterName(node.chapter)} →`);
        read(node.href, 'Its page in the almanac →');
        out.push({ text: 'Kept, it gives a gift in Exactly One Pie.', href: PIE_HREF, link: 'To the lanes →' });
        if (node.characters?.length) out.push({ text: `With ${node.characters.map((c) => CHARACTERS[c]?.name || c).join(', ')}.` });
        break;
      }
      case 'character':
        read(node.href, isFound(node) ? `Meet ${titleOf(node)} →` : 'Where to meet them →');
        out.push({ text: 'Their card turns in Exactly One Pie.', href: PIE_HREF, link: 'To the lanes →' });
        break;
      case 'palette':
        read('/almanac/#keepsakes', 'On the almanac’s shelf →');
        if (node.chapter) read(`/book/chapter/${pad2(node.chapter)}/`, `Read ${chapterName(node.chapter)} to its end →`);
        break;
      case 'seed':
        read(node.href, 'See the study in the atlas →');
        break;
      case 'lore':
        if (node.ground?.chapter) read(node.href, `Read where it is about: ${chapterName(node.ground.chapter)} →`);
        out.push({ text: `${node.who} lets it slip ${node.when}, in Exactly One Pie.`, href: PIE_HREF, link: 'To the lanes →' });
        break;
      case 'egg':
        read(node.href, `Where it is first carried: ${chapterName(node.chapter)} →`);
        out.push({ text: 'What it is for is not said here.' });
        break;
      case 'card':
        read(node.href, 'The card itself →');
        if (node.chapter) read(`/book/chapter/${pad2(node.chapter)}/`, `Read ${chapterName(node.chapter)} →`);
        break;
      case 'sound':
        read(node.href, 'Its sidecar →');
        out.push({ text: 'Heard in Exactly One Pie, when the moment comes.', href: PIE_HREF, link: 'To the lanes →' });
        break;
      case 'icon':
        read(node.href, 'The icon →');
        break;
      case 'index':
        read(node.href, 'The index, as Spw →');
        break;
      default: break;
    }
    return out;
  }

  function paintWays(id) {
    const list = ui.ways;
    list.replaceChildren();
    view.ring.forEach(({ id: other }, i) => {
      const node = graph.nodes.get(other);
      const tie = graph.adj.get(id).find((n) => n.to === other)?.edge;
      const li = el('li', '');
      const button = el('button', `spw-disk-way kind-${node.kind} op-${roleOf(node.sigil)}${stood(other) ? ' is-stood' : ''}${walked(other) ? ' is-walked' : ''}`);
      button.type = 'button';
      button.tabIndex = i === 0 ? 0 : -1;
      button.dataset.diskId = other;
      const name = el('span', `spw-disk-way-name${stood(other) ? '' : ' is-syntax'}`, short(labelOf(node), 40));
      const kind = el('span', 'spw-disk-way-kind', `${KIND_WORDS[node.kind]}${tie ? ` · ${tieWords(graph, tie, id, other)}` : ''}`);
      button.append(name, kind);
      button.setAttribute('aria-label', `${titleOf(node)}, ${KIND_WORDS[node.kind]}${tie ? `: ${tieWords(graph, tie, id, other)}` : ''}${walked(other) ? ', a loop walked through it' : ''}`);
      button.addEventListener('click', () => step(other));
      button.addEventListener('focus', () => { active = i; rove(); paint(); });
      button.addEventListener('pointerenter', () => light(other, true));
      button.addEventListener('pointerleave', () => light(other, false));
      li.append(button);
      list.append(li);
    });
    ui.waysTitle.textContent = view.ring.length ? 'On the first ring' : 'Nothing is tied to this yet.';
  }

  const rove = () => ui.ways.querySelectorAll('.spw-disk-way').forEach((b, i) => { b.tabIndex = i === Math.max(active, 0) ? 0 : -1; });

  function paintLoops(id) {
    if (!loopCache.has(id)) loopCache.set(id, loopsToOffer(graph, id));
    const loops = loopCache.get(id);
    const list = ui.loops;
    list.replaceChildren();
    if (!loops.length) {
      list.append(el('li', 'spw-disk-noloop', 'No short loop comes back here. Step out a ring and look again.'));
      return;
    }
    loops.forEach((loop) => {
      const li = el('li', `spw-disk-loop${marks.loops[loop.key] ? ' is-walked' : ''}`);
      const button = el('button', 'spw-disk-loop-take');
      button.type = 'button';
      const names = loop.ids.slice(1).map((x) => short(titleOf(graph.nodes.get(x)), 28));
      button.append(
        el('span', 'spw-disk-loop-lede', `A loop of ${loop.ids.length} from here${marks.loops[loop.key] ? ', walked' : ''}:`),
        el('span', 'spw-disk-loop-steps', `${names.join(' → ')} → back`)
      );
      button.addEventListener('click', () => walkLoop(loop));
      const shape = renderSpell(`~loop<${loop.ids.map((x) => spellLabel(graph.nodes.get(x))).join(' ')}>`, { cast: false, layout: 'line', label: 'The loop, in Spw' });
      shape.classList.add('is-compact', 'spw-disk-loop-spell');
      li.append(button, shape);
      list.append(li);
    });
  }

  /* A loop, written as Spw: a passage through the names of the things on it. */
  const spellLabel = (node) => {
    if (!isFound(node)) return `?${node.kind}`;
    if (node.kind === 'room') return node.reading?.label || spwLabel(node.title);
    if (node.kind === 'chapter') return `chapter_${node.chapter}`;
    if (node.kind === 'egg') return '?egg';
    return spwLabel(node.key || node.title);
  };

  function paintTrail() {
    ui.trail.replaceChildren();
    trail.slice(0, -1).forEach((x) => {
      const li = el('li', '');
      const b = el('button', 'spw-disk-trail-step', short(titleOf(graph.nodes.get(x)), 24));
      b.type = 'button';
      b.addEventListener('click', () => step(x));
      li.append(b);
      ui.trail.append(li);
    });
    ui.trailBox.hidden = trail.length < 2;
  }

  async function walkLoop(loop) {
    stopWalk();
    const run = { loop, lit: new Set(), stopped: false };
    walking = run;
    ui.mount.classList.add('is-walking');
    ui.stop.hidden = false;
    say(`Walking a loop of ${loop.ids.length}. Escape stops.`);
    if (view.focus !== loop.ids[0]) await go(loop.ids[0], { quiet: true });
    for (let i = 1; i <= loop.ids.length; i += 1) {
      if (run.stopped) break;
      run.lit.add(loop.edges[i - 1].key);
      paint();
      await wait(reduce.matches ? 520 : 260);
      if (run.stopped) break;
      await go(loop.ids[i % loop.ids.length], { quiet: true });
      if (i < loop.ids.length) say(`${titleOf(graph.nodes.get(loop.ids[i]))}.`);
      await wait(reduce.matches ? 700 : 420);
    }
    if (!run.stopped) {
      walking = null;
      ui.stop.hidden = true;
      complete(loop);
      ui.mount.classList.remove('is-walking');
      paintCard(view.focus, false);
      paintWays(view.focus);
      paintLoops(view.focus);
      paint();
    }
  }

  function stopWalk() {
    if (!walking) return;
    walking.stopped = true;
    walking = null;
    ui.stop.hidden = true;
    ui.mount.classList.remove('is-walking');
    paintLoops(view.focus);
    paint();
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  ui.stop.addEventListener('click', () => { stopWalk(); say('Stopped. The loop waits.'); });

  /* ─── Keys: arrows cycle the first ring, Enter walks there, L lists the loops ─── */

  ui.mount.addEventListener('keydown', (event) => {
    if (!view || event.target.closest('.spell, input, textarea, select')) return;
    const ring = view.ring;
    if (event.key === 'Escape' && walking) { stopWalk(); say('Stopped. The loop waits.'); return; }
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key) && ring.length) {
      if (!event.target.closest('.spw-disk-stage, .spw-disk-ways')) return;
      event.preventDefault();
      const dir = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      active = (active + dir + ring.length) % ring.length;
      if (active < 0) active = 0;
      rove();
      paint();
      const node = graph.nodes.get(ring[active].id);
      const tie = graph.adj.get(view.focus).find((n) => n.to === node.id)?.edge;
      if (event.target.closest('.spw-disk-ways')) ui.ways.querySelectorAll('.spw-disk-way')[active]?.focus();
      else say(`${titleOf(node)}, ${KIND_WORDS[node.kind]}${tie ? `: ${tieWords(graph, tie, view.focus, node.id)}` : ''}. Enter walks there.`);
      return;
    }
    if (event.key === 'Enter' && event.target.closest('.spw-disk-stage') && ring[active]) {
      event.preventDefault();
      step(ring[active].id);
      return;
    }
    if ((event.key === 'l' || event.key === 'L') && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      const first = ui.loops.querySelector('button');
      if (first) { first.focus(); say(`${ui.loops.querySelectorAll('.spw-disk-loop').length > 1 ? 'Loops' : 'A loop'} from here. Enter walks one.`); } else say('No short loop comes back here.');
    }
  });

  /* ─── Begin ─── */

  (async () => {
    const sources = await loadSources();
    likenessItems = sources.items;
    refreshDiscovery();
    graph = buildGraph(sources);
    if (!graph.nodes.size) {
      ui.mount.querySelector('.spw-disk-wait').textContent = 'The projection could not be read just now.';
      return;
    }
    ui.mount.classList.add('is-ready');
    ui.mount.querySelector('.spw-disk-wait')?.remove();
    const asked = focusFromAddress();
    const start = [asked, marks.at, 'chapter:01'].find((x) => x && graph.nodes.has(x)) || graph.nodes.keys().next().value;
    measure();
    go(start, { quiet: true });
    if (asked && location.hash === '#projection') ui.mount.closest('section')?.scrollIntoView({ block: 'start' });
  })();
}

/* The disk's frame: the stage (nesting, rim of sigils), the card, the ways on, the loops, the trail. */
function buildShell(mount) {
  mount.replaceChildren();
  mount.classList.add('spw-disk');
  const stage = el('div', 'spw-disk-stage');
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'The projection. Arrow keys move among the neighbours on the first ring, Enter walks there, L lists the loops from here.');
  const nest = el('div', 'spw-disk-nest');
  nest.setAttribute('aria-hidden', 'true');
  ['body', 'frame', 'group', 'capsule'].forEach((kind) => nest.append(el('span', `spw-disk-nest-${kind}`)));
  const root = svg('svg', { class: 'spw-disk-svg', viewBox: `${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`, 'aria-hidden': 'true', focusable: 'false' });
  const defs = svg('defs');
  const floor = svg('radialGradient', { id: 'spw-disk-floor', cx: '0', cy: '0', r: '1', gradientUnits: 'userSpaceOnUse' });
  [['0', 'spw-disk-floor-mid'], ['0.72', 'spw-disk-floor-ring'], ['1', 'spw-disk-floor-rim']].forEach(([offset, cls]) => floor.append(svg('stop', { offset, class: cls })));
  defs.append(floor);
  const disk = svg('circle', { class: 'spw-disk-floor', cx: 0, cy: 0, r: 1, fill: 'url(#spw-disk-floor)' });
  const rings = svg('g', { class: 'spw-disk-horizons' });
  [1, 2, 3].forEach((d) => rings.append(svg('circle', { cx: 0, cy: 0, r: Math.tanh((d * STEP) / 2).toFixed(4) })));
  const rim = svg('g', { class: 'spw-disk-rim' });
  rim.append(svg('circle', { class: 'spw-disk-rim-line', cx: 0, cy: 0, r: 1 }));
  SIGILS.forEach((sigil, i) => {
    const mid = (-90 + i * 30) * (Math.PI / 180);
    const half = 13 * (Math.PI / 180);
    const p = [Math.cos(mid - half), Math.sin(mid - half)];
    const q = [Math.cos(mid + half), Math.sin(mid + half)];
    rim.append(svg('path', { class: `spw-disk-rim-arc op-${roleOf(sigil)}`, d: `M${p[0].toFixed(4)} ${p[1].toFixed(4)}A1 1 0 0 1 ${q[0].toFixed(4)} ${q[1].toFixed(4)}` }));
    const t = svg('text', { class: `spw-disk-rim-sigil op-${roleOf(sigil)}`, x: (Math.cos(mid) * 1.085).toFixed(4), y: (Math.sin(mid) * 1.085).toFixed(4), 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    t.textContent = sigil;
    rim.append(t);
  });
  const edges = svg('g', { class: 'spw-disk-edges' });
  const nodes = svg('g', { class: 'spw-disk-nodes' });
  root.append(defs, disk, rings, edges, nodes, rim);
  stage.append(nest, root);
  const wait = el('p', 'spw-disk-wait', 'Reading the canon…');
  stage.append(wait);

  const side = el('div', 'spw-disk-side');
  const card = el('article', 'spw-disk-card');
  card.setAttribute('aria-live', 'off');
  const waysBox = el('nav', 'spw-disk-ways-box');
  waysBox.setAttribute('aria-label', 'Neighbours on the first ring');
  const waysTitle = el('h3', 'spw-disk-ways-title', 'On the first ring');
  const ways = el('ol', 'spw-disk-ways');
  waysBox.append(waysTitle, ways);
  const loopsBox = el('section', 'spw-disk-loops-box');
  const loopsTitle = el('h3', 'spw-disk-loops-title', 'Loops from here');
  const stop = el('button', 'spw-disk-stop', 'Stop walking');
  stop.type = 'button';
  stop.hidden = true;
  const loops = el('ol', 'spw-disk-loops');
  loopsBox.append(loopsTitle, stop, loops);
  const trailBox = el('nav', 'spw-disk-trail-box');
  trailBox.setAttribute('aria-label', 'Where you have walked');
  trailBox.hidden = true;
  const trailTitle = el('h3', 'spw-disk-trail-title', 'Your trail');
  const trailList = el('ol', 'spw-disk-trail');
  trailBox.append(trailTitle, trailList);
  side.append(card, waysBox, loopsBox, trailBox);
  const live = el('p', 'spw-disk-live');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('role', 'status');
  const viewBox = el('div', 'spw-disk-view');
  viewBox.append(stage, live);
  mount.append(viewBox, side);
  return { mount, stage, svg: root, edges, nodes, rim, card, ways, waysTitle, loops, stop, trail: trailList, trailBox, live };
}

// On a page with a disk (the scriptorium), project it when it first comes near the view, or at once
// when the address asks for it (?focus=… or #projection).
if (typeof document !== 'undefined') {
  const mount = document.querySelector('[data-spw-disk]');
  if (mount) {
    const now = focusFromAddress() || location.hash === '#projection';
    if (now || typeof IntersectionObserver !== 'function') initProjectionDisk(mount);
    else {
      const seen = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        seen.disconnect();
        initProjectionDisk(mount);
      }, { rootMargin: '320px 0px' });
      seen.observe(mount);
    }
  }
}
