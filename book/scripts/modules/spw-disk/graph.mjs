/**
 * spw-disk/graph.mjs — Canon graph builder, cycle finder, tie descriptions,
 * sidecar/index readers, and reusable hyperbolic graph queries + portable Spw walks.
 *
 * Host-neutral: scripts, tests, and the Scriptorium Poincaré disk all call the same functions.
 */
import { readRoom, roomKeeper, ROOM_RESERVED_WORDS } from '../room-signature.mjs?v=2026_11_08.W';
import { likenessScore, whyWords, DIMENSIONS, SET_VALENCE, chapterName } from '../likeness.mjs?v=2026_11_16.B';
import { CHARACTERS, identitySpell } from '../characters.mjs?v=2026_11_16.B';
import { KIND_SIGIL } from '../almanac.mjs?v=2026_11_16.B';
import { buildPortableDoorUrl, encodeSpwFragment, projectCrossHostSlot } from '../spw-portable.mjs';

export const HUB = 14;          // a thing with more neighbours than this is a crowd, not a turn in a loop
const PIE_HREF = '/pie/';

export const pad2 = (n) => String(n).padStart(2, '0');
export const capital = (text) => String(text).charAt(0).toUpperCase() + String(text).slice(1);

/** A label the Spw lexer reads as a name (mirrors chapter-spell.mjs spwLabel, without its weight). */
export function spwLabel(text) {
  const label = String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unnamed';
  const safe = /^[a-z]/.test(label) ? label : `n_${label}`;
  return ROOM_RESERVED_WORDS.includes(safe) ? `the_${safe}` : safe;
}

/* Edge kinds, strongest first: one edge per pair, the first kind that joins them. */
export const EDGE_KINDS = Object.freeze(['contains', 'card', 'holds', 'beside', 'first', 'palette', 'planted', 'grounded', 'said', 'kept', 'egg', 'returns', 'sigil', 'like']);
const EDGE_RANK = Object.freeze(Object.fromEntries(EDGE_KINDS.map((kind, i) => [kind, i])));
export const KIND_ORDER = Object.freeze(['chapter', 'room', 'wonder', 'egg', 'lore', 'character', 'palette', 'seed', 'card', 'sound', 'icon', 'index']);
const KEEPER_IDS = Object.freeze({ boof: 'boof', genie: 'genie', boonwap: 'boon', banewap: 'bane', bonewap: 'bonewap', the_porter: 'porter' });
const SPEAKER_LABEL = Object.freeze({ boon: 'boonwap', bane: 'banewap' });

export const KIND_WORDS = Object.freeze({
  chapter: 'a chapter', room: 'a room', wonder: 'a wonder', character: 'someone in the book', palette: 'a palette',
  lore: 'a line the pies let slip', seed: 'a study in the seed atlas', egg: 'a question',
  card: 'a share card', sound: 'a sound', icon: 'an app icon', index: 'an index of what the tools made'
});

const graphItems = new WeakMap();
let fallbackLikenessItems = {};
export function setLikenessItems(items) {
  fallbackLikenessItems = items || {};
}

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
  const graph = { nodes, adj, edges };
  graphItems.set(graph, items);
  return graph;
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

/* ─── Graph Queries & Portable Spw Walks (creative tooling API) ────────── */

/**
 * Extract the local neighbourhood up to `maxDepth` hops from `startId`.
 * Useful for study decks, thematic constellations, and focused agent inspection.
 */
export function subgraphAround(graph, startId, { maxDepth = 2, maxNodes = 60, edgeKinds = null } = {}) {
  if (!graph?.nodes?.has(startId)) return { start: startId, nodeIds: [], nodes: [], edges: [] };
  const allow = edgeKinds ? new Set(edgeKinds) : null;
  const seen = new Map([[startId, 0]]);
  const queue = [startId];
  while (queue.length && seen.size < maxNodes) {
    const id = queue.shift();
    const d = seen.get(id);
    if (d >= maxDepth) continue;
    for (const { to, edge } of graph.adj.get(id) || []) {
      if (allow && !allow.has(edge.kind)) continue;
      if (seen.has(to) || seen.size >= maxNodes) continue;
      seen.set(to, d + 1);
      queue.push(to);
    }
  }
  const nodeIds = [...seen.keys()];
  const edges = graph.edges.filter((e) => seen.has(e.a) && seen.has(e.b) && (!allow || allow.has(e.kind)));
  return { start: startId, nodeIds, nodes: nodeIds.map((id) => graph.nodes.get(id)), edges };
}

/**
 * Find the shortest tie chain between two canon nodes via BFS.
 * Optionally skips high-degree hub nodes in the interior to find tighter thematic bridges.
 */
export function shortestPath(graph, fromId, toId, { maxDepth = 8, avoidHubs = false, hub = HUB } = {}) {
  if (!graph?.adj?.has(fromId) || !graph?.adj?.has(toId)) return null;
  if (fromId === toId) return { ids: [fromId], edges: [] };
  const parent = new Map([[fromId, null]]);
  const queue = [{ id: fromId, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift();
    if (depth >= maxDepth) continue;
    for (const { to, edge } of graph.adj.get(id) || []) {
      if (parent.has(to)) continue;
      if (avoidHubs && to !== toId && (graph.adj.get(to)?.length || 0) > hub) continue;
      parent.set(to, { prev: id, edge });
      if (to === toId) {
        const ids = [toId];
        const edges = [];
        let cur = toId;
        while (parent.get(cur)) {
          const step = parent.get(cur);
          edges.push(step.edge);
          ids.push(step.prev);
          cur = step.prev;
        }
        return { ids: ids.reverse(), edges: edges.reverse() };
      }
      queue.push({ id: to, depth: depth + 1 });
    }
  }
  return null;
}

/**
 * Export any walk or loop of node IDs as a canonical Spw expression, plus optional
 * cross-host slot & client-side `#spw64=` portable URL (PLAN.F#f15 / #f42).
 */
export function exportWalkAsSpw(graph, ids, { title = '', portable = false, baseUrl = '/scriptorium/' } = {}) {
  const list = (Array.isArray(ids) ? ids : []).filter((id) => graph?.nodes?.has(id));
  const stepTokens = list.map((id) => {
    const node = graph.nodes.get(id);
    if (node.kind === 'room') return node.reading?.label || spwLabel(node.title);
    if (node.kind === 'chapter') return `chapter_${node.chapter}`;
    if (node.kind === 'egg') return '?egg';
    return spwLabel(node.key || node.title || id);
  });
  const head = title ? `~walk[${spwLabel(title)}]` : '~walk';
  const spw = `${head}<${stepTokens.join(' ')}>`;
  if (!portable) return spw;
  const firstNode = list.length ? graph.nodes.get(list[0]) : null;
  const slot = projectCrossHostSlot({
    sigil: '~',
    word: title || 'walk',
    mode: 'projection_disk',
    body: stepTokens,
    scene: firstNode?.chapter ? `chapter_${pad2(firstNode.chapter)}` : 'scriptorium',
    concept: list.length >= 3 && list[0] === list[list.length - 1] ? 'loop' : 'path',
    source: 'lore.land/scriptorium/#projection'
  });
  const fragment = encodeSpwFragment(spw);
  const url = buildPortableDoorUrl(baseUrl, spw);
  return { spw, slot, fragment, url };
}

/* ─── Words & sidecar/index readers ───────────────────────────────────── */

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

/** A keeper as the book writes them: Boof, the Genie, the Fool. */
export const keeperWords = (who) => roomKeeper(who).replace(/^the (fool|genie|mirror|archivist|crier|porter|stranger)\b/, (m, w) => (w === 'fool' || w === 'genie' ? `the ${capital(w)}` : m));

/** What the neighbour `to` is, seen from `from`, by the edge between them. */
export function tieWords(graph, edge, from, to, items) {
  const there = graph.nodes.get(to);
  const here = graph.nodes.get(from);
  const outward = edge.a === from;
  const itemLookup = items || graphItems.get(graph) || fallbackLikenessItems;
  const likeOf = (ref) => (typeof ref === 'string' ? itemLookup[ref] || { id: ref } : ref);
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
export function derivedPaths(path) {
  const clean = String(path || '').replace(/^\//, '');
  if (!clean) return { href: '', sidecar: '' };
  if (/\.spw$/i.test(clean)) return { href: `/${clean}`, sidecar: `/${clean}` };
  if (/\.[a-z0-9]+$/i.test(clean)) return { href: `/${clean}`, sidecar: `/${clean.replace(/\.[a-z0-9]+$/i, '.spw')}` };
  return { href: `/${clean}/index.spw`, sidecar: `/${clean}/index.spw` };
}
