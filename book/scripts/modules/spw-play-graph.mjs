// @ts-check
/**
 * spw-play-graph.mjs — a Spw parse, read literally as the plan of a game. PROPOSED (.spw/surfaces/ast-play.spw).
 *
 * The parser (book/scripts/vendor/spw-seed.mjs, lexProfile prose) gives a tree. Every node of it is read as a part of
 * a playable structure, by the role its sigil or container already has (spw-interactions.mjs OPERATOR_ROLES and
 * CONTAINER_ROLES; the roles pie-rules.spw keeps; liminal-physics.spw):
 *
 *   Operation   a place, whose rule is its sigil's role: ! an event that fires on arrival, ? a probe that reveals,
 *               ~ something left open (a door, with a path), @ whose view it is seen from, & a junction where paths
 *               merge, * a thing to collect, ^ a key that binds upward (carried out, it opens the area above),
 *               # a sign posted, . solid ground (a checkpoint), = a lean on the place, % a gauge, $ what it is made of
 *   [ ] Frame   an arena: a choice among its items (selection: ordered, indexable)
 *   { } Body    an area: it gathers charge as it is entered and discharges on the way out
 *   ( ) Scope   a turn: its items taken together, as one combo
 *   < > Capsule a passage to elsewhere, named by its tag
 *   ~"path"     a door to another surface
 *   @word       a view: whose eyes the next place is seen through
 *   key: value  a sign: a fact posted in the place
 *   Literal, Identifier   an item lying there
 *   Particle (#>, #:, #!) a mark on the map
 *   Sequence    a path, in order: each Expression a step along it; the steps of one sequence are siblings
 *
 * playGraph() builds { nodes, edges, keys, rules, depth, branching, charge } with ids in depth-first order, so the
 * same text always gives the same graph. A text that does not read whole is reported and mapped to nothing: a
 * level built from half a parse would be a level of the parser's guesses. Node types not in the table are reported
 * as unmapped, never dropped silently.
 *
 * The projections read one graph as several kinds of game (no engine; structures and their counts): the lane
 * runner this site already plays, a deck builder, a metroidvania, a rhythm track, a roguelike floor, a garden.
 * Host-neutral: no DOM, no storage, no clock.
 */

/** @typedef {{ id: string, kind: string, sigil?: string, label?: string, rule?: string, depth: number, parent: string | null, text: string, target?: string, charge?: number }} PlayNode */
/** @typedef {{ from: string, to: string, kind: string }} PlayEdge */
/** @typedef {{ ok: boolean, why: string, hash: string, nodes: PlayNode[], edges: PlayEdge[], keys: Array<{ id: string, label: string, opens: string | null }>, rules: Array<{ at: string, sigil: string, rule: string }>, depth: number, branching: { maxChoice: number, maxSiblings: number, meanSiblings: number }, charge: { total: number, byArea: Record<string, number> }, unmapped: Record<string, number>, steps: string[] }} PlayGraph */

/** The twelve sigils, in their roles (mirrors spw-interactions.mjs OPERATOR_ROLES; play-graph-check holds the two equal). */
export const SIGIL_ROLES = Object.freeze({
  '!': { role: 'action', phase: 0, place: 'an event that fires when you arrive' },
  '?': { role: 'probe', phase: 1, place: 'a probe: something hidden shows when you look' },
  '~': { role: 'potential', phase: 2, place: 'something left open: deferred, or a door with a path' },
  '@': { role: 'perspective', phase: 3, place: 'a point of view: the place is seen through these eyes' },
  '&': { role: 'confluence', phase: 4, place: 'a junction: paths and hands merge here' },
  '*': { role: 'value', phase: 5, place: 'a thing to collect, made concrete' },
  '^': { role: 'integration', phase: 6, place: 'a key: carried out, it binds upward and opens the area above' },
  '#': { role: 'annotation', phase: null, place: 'a sign posted for whoever passes' },
  '.': { role: 'ground', phase: null, place: 'solid ground: a checkpoint, intrinsic to the place' },
  '=': { role: 'config', phase: null, place: 'a lean on the place: it is tuned this way' },
  '%': { role: 'measure', phase: null, place: 'a gauge: how much' },
  '$': { role: 'substrate', phase: null, place: 'what the place is made of' }
});
/** The four containers (mirrors CONTAINER_ROLES). */
export const CONTAINER_PLAY = Object.freeze({
  Frame: { open: '[', kind: 'arena', role: 'selection', says: 'a choice among its items' },
  Body: { open: '{', kind: 'area', role: 'scope', says: 'gathers charge as it is entered, discharges on the way out' },
  Scope: { open: '(', kind: 'turn', role: 'grouping', says: 'its items taken together, as one combo' },
  Capsule: { open: '<', kind: 'passage', role: 'channel', says: 'a passage to elsewhere, named by its tag' }
});
const LEAF = Object.freeze({ Literal: 'item', Identifier: 'item', Particle: 'mark', PathRef: 'door', Reference: 'view', Binding: 'sign' });
/** Every node type the table reads (anything else met in a term's place is reported as unmapped). */
export const MAPPED_TYPES = Object.freeze(['Seed', 'Sequence', 'Expression', 'Operation', 'Parameter', ...Object.keys(CONTAINER_PLAY), ...Object.keys(LEAF)]);

/** @param {string} text */
const fnv = (text) => {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.codePointAt(0) || 0; h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
};
/** @param {any} v @returns {string} */
const unquote = (v) => String(v ?? '').replace(/^"([\s\S]*)"$/, '$1');
/** A valence word (boon, bane, bone, bonk, honk) standing alone comes back as a modifier on an empty expression. @param {any} n @returns {string} */
const valenceOf = (n) => (n?.modifiers?.modifiers || []).map((/** @type {any} */ m) => m?.value).filter(Boolean).join(' ');
/** @param {any} n @returns {string} */
const textOf = (n) => {
  if (!n) return '';
  if (n.token?.value != null) return unquote(n.token.value);
  if (n.type === 'Reference') return n.raw || '';
  if (n.type === 'PathRef') return unquote(n.path?.token?.value);
  if (n.type === 'Expression') return (n.terms || []).map(textOf).filter(Boolean).join(' ') || valenceOf(n);
  if (n.type === 'Parameter') return textOf(n.value);
  return '';
};

/**
 * The graph of a parse.
 * @param {any} parsed  what parse() returned (or its ast, with { complete } given)
 * @param {{ source?: string, complete?: boolean }} [opts]
 * @returns {PlayGraph}
 */
export function playGraph(parsed, { source = '', complete } = {}) {
  const ast = parsed?.ast || parsed;
  const whole = complete ?? Boolean(parsed?.completeness?.complete && !parsed?.completeness?.proseFallback);
  /** @type {PlayGraph} */
  const g = { ok: false, why: '', hash: fnv(source), nodes: [], edges: [], keys: [], rules: [], depth: 0, branching: { maxChoice: 0, maxSiblings: 0, meanSiblings: 0 }, charge: { total: 0, byArea: {} }, unmapped: {}, steps: [] };
  if (!ast || ast.type !== 'Seed') { g.why = 'no parse to read'; return g; }
  if (!whole) { g.why = 'it did not read whole, so nothing was mapped: a level built from half a parse would be built from guesses'; return g; }
  let counter = 0;
  /** @type {Map<string, PlayNode>} */
  const byId = new Map();
  /** @type {number[]} */
  const siblingCounts = [];
  /** @param {string} kind @param {string | null} parent @param {number} depth @param {any} src @param {Partial<PlayNode>} [extra] */
  const add = (kind, parent, depth, src, extra = {}) => {
    const id = `p${counter++}`;
    const node = /** @type {PlayNode} */ ({ id, kind, depth, parent, text: textOf(src).slice(0, 48), ...extra });
    g.nodes.push(node);
    byId.set(id, node);
    if (parent) g.edges.push({ from: parent, to: id, kind: 'contains' });
    g.depth = Math.max(g.depth, depth);
    return id;
  };
  /** @param {any} n */
  const unmapped = (n) => { const t = n?.type || typeof n; g.unmapped[t] = (g.unmapped[t] || 0) + 1; };

  /** A sequence: a path in order; returns the head node id of each step. @param {any} seq @param {string} parent @param {number} depth */
  const path = (seq, parent, depth) => {
    const heads = [];
    for (const expr of seq?.expressions || []) {
      const head = step(expr, parent, depth);
      if (head) heads.push(head);
    }
    for (let i = 1; i < heads.length; i += 1) g.edges.push({ from: heads[i - 1], to: heads[i], kind: 'next' });
    if (heads.length) siblingCounts.push(heads.length);
    return heads;
  };
  /** One step: its terms in order; a frame, body, scope or capsule hung on the expression joins its last term. @param {any} expr @param {string} parent @param {number} depth */
  const step = (expr, parent, depth) => {
    if (!expr) return null;
    if (expr.type !== 'Expression') return term(expr, parent, depth);
    /** @type {string | null} */
    let head = null;
    /** @type {string | null} */
    let last = null;
    for (const t of expr.terms || []) {
      const id = term(t, parent, depth);
      if (id) { head = head || id; last = id; }
    }
    // A valence word alone (boon, bane, bone…) is an item, named by the word.
    if (!head && valenceOf(expr)) { head = add('item', parent, depth, expr, { label: valenceOf(expr), rule: 'a valence word: which land it leans toward' }); last = head; }
    const anchor = last || parent;
    ['frame', 'body', 'scope', 'capsule'].forEach((k) => { if (expr[k]) { const id = container(expr[k], anchor, depth + 1); head = head || id; } });
    return head;
  };
  /** @param {any} n @param {string} parent @param {number} depth @returns {string | null} */
  const container = (n, parent, depth) => {
    const play = CONTAINER_PLAY[/** @type {keyof typeof CONTAINER_PLAY} */ (n?.type)];
    if (!play) { unmapped(n); return null; }
    const tag = n.type === 'Capsule' ? (textOf(n.channel) || textOf(n.tag) || (n.interior?.expressions || []).map(textOf).filter(Boolean).join(' ')) : '';
    const id = add(play.kind, parent, depth, n, { rule: play.says, ...(tag ? { label: tag } : {}) });
    if (n.type === 'Frame') {
      let choices = 0;
      for (const p of n.content || []) {
        if (p?.type === 'COMMA') continue;
        const value = p?.type === 'Parameter' ? p.value : p;
        const c = step(value, id, depth + 1);
        if (c) { g.edges.push({ from: id, to: c, kind: 'choice' }); choices += 1; }
      }
      g.branching.maxChoice = Math.max(g.branching.maxChoice, choices);
    } else if (n.type === 'Capsule') {
      // A capsule can couple a left to a right: @mind <concept>{ literal space }. The left is the mind that
      // implements the concept; the right is the space it is implemented in.
      if (n.left) { const c = n.left.type === 'Expression' ? step(n.left, id, depth + 1) : term(n.left, id, depth + 1); if (c) g.edges.push({ from: c, to: id, kind: 'mind' }); }
      ['frame', 'body', 'right'].forEach((k) => {
        const part = n[k];
        if (!part?.type) return;
        const c = CONTAINER_PLAY[/** @type {keyof typeof CONTAINER_PLAY} */ (part.type)] ? container(part, id, depth + 1) : part.type === 'Expression' ? step(part, id, depth + 1) : term(part, id, depth + 1);
        if (c) g.edges.push({ from: id, to: c, kind: 'passage' });
      });
    } else {
      path(n.sequence, id, depth + 1);
    }
    return id;
  };
  /** @param {any} t @param {string} parent @param {number} depth @returns {string | null} */
  const term = (t, parent, depth) => {
    if (!t?.type) return null;
    if (t.type === 'Operation') {
      const sigil = t.operator?.value || '';
      const role = SIGIL_ROLES[/** @type {keyof typeof SIGIL_ROLES} */ (sigil)];
      const subj = t.subject;
      const label = t.operatorLabel?.value || (subj && subj.type !== 'Capsule' ? textOf(subj) : '') || '';
      const id = add('place', parent, depth, t, { sigil, label, rule: role?.place || 'a place with no role the table knows' });
      g.rules.push({ at: id, sigil, rule: role?.place || '' });
      if (subj?.type === 'Capsule') container(subj, id, depth + 1);
      if (t.frame) container(t.frame, id, depth + 1);
      if (t.body) container(t.body, id, depth + 1);
      if (t.linePayload) step(t.linePayload, id, depth + 1);
      if (sigil === '^') {
        // A key binds upward: it opens the nearest area above the place that holds it.
        let up = byId.get(parent);
        while (up && up.kind !== 'area') up = up.parent ? byId.get(up.parent) : undefined;
        g.keys.push({ id, label, opens: up ? up.id : null });
        if (up) g.edges.push({ from: id, to: up.id, kind: 'opens' });
      }
      return id;
    }
    if (CONTAINER_PLAY[/** @type {keyof typeof CONTAINER_PLAY} */ (t.type)]) return container(t, parent, depth + 1);
    const leaf = LEAF[/** @type {keyof typeof LEAF} */ (t.type)];
    if (!leaf) { unmapped(t); return null; }
    if (leaf === 'door') {
      const target = textOf(t);
      const id = add('door', parent, depth, t, { sigil: '~', target, rule: 'a door to another surface' });
      g.edges.push({ from: id, to: `surface:${target}`, kind: 'door' });
      return id;
    }
    if (leaf === 'view') return add('view', parent, depth, t, { sigil: '@', label: t.raw || textOf(t), rule: 'whose view the next place is seen from' });
    if (leaf === 'sign') {
      const id = add('sign', parent, depth, t, { label: textOf(t.key), rule: 'a fact posted in the place' });
      if (t.value) step(t.value, id, depth + 1);
      return id;
    }
    return add(leaf, parent, depth, t, leaf === 'mark' ? { rule: 'a mark on the map' } : {});
  };

  const root = add('world', null, 0, ast, { rule: 'the whole text, entered from the top' });
  g.steps = path(ast.expression, root, 1);
  // Charge: each area gathers one for every place, item and sign inside it (at any depth), and discharges on exit.
  /** @type {Map<string, string[]>} */
  const kids = new Map();
  g.edges.filter((e) => e.kind === 'contains').forEach((e) => { const list = kids.get(e.from) || []; list.push(e.to); kids.set(e.from, list); });
  /** @param {string} id @returns {number} */
  const weigh = (id) => (kids.get(id) || []).reduce((/** @type {number} */ sum, /** @type {string} */ k) => { const n = byId.get(k); return sum + (n && ['place', 'item', 'sign', 'door', 'view'].includes(n.kind) ? 1 : 0) + weigh(k); }, 0);
  g.nodes.filter((n) => n.kind === 'area').forEach((n) => { n.charge = weigh(n.id); g.charge.byArea[n.id] = n.charge; g.charge.total += n.charge; });
  g.branching.maxSiblings = siblingCounts.length ? Math.max(...siblingCounts) : 0;
  g.branching.meanSiblings = siblingCounts.length ? Math.round((siblingCounts.reduce((a, b) => a + b, 0) / siblingCounts.length) * 100) / 100 : 0;
  g.ok = true;
  g.why = 'read whole';
  return g;
}

/** Count nodes by kind. @param {PlayGraph} g */
export const kindsOf = (g) => g.nodes.reduce((acc, n) => { acc[n.kind] = (acc[n.kind] || 0) + 1; return acc; }, /** @type {Record<string, number>} */ ({}));
/** @param {PlayGraph} g @param {string} id */
const childrenOf = (g, id) => g.edges.filter((e) => e.from === id && e.kind === 'contains').map((e) => /** @type {PlayNode} */ (g.nodes.find((n) => n.id === e.to)));
/** @param {PlayGraph} g @param {string} id @returns {PlayNode[]} */
const descendants = (g, id) => childrenOf(g, id).flatMap((c) => [c, ...descendants(g, c.id)]);

/* ─── Projections: one graph, read as several kinds of game ───────────────── */

/**
 * The lane runner (the pie game's own shape): the top-level path is the road, each step a room passing, named by its
 * sigil the way a chapter's rooms are; whatever stands inside a step comes down the five lanes while it passes.
 * @param {PlayGraph} g
 */
export function laneRunner(g) {
  const rooms = g.steps.map((id, i) => {
    const n = /** @type {PlayNode} */ (g.nodes.find((x) => x.id === id));
    const things = descendants(g, id).filter((d) => ['place', 'item', 'sign', 'door', 'view'].includes(d.kind)).length;
    return { at: i + 1, id, sigil: n.sigil || '', label: n.label || n.text, things };
  });
  return { trope: 'lane runner', says: 'The road is the top-level path. Each step is a room passing, named by its sigil, and what stands inside it comes down the lanes while it passes.', rooms, count: rooms.length, things: rooms.reduce((s, r) => s + r.things, 0) };
}

/**
 * A deck builder: every place is a card, its sigil its suit, its depth its cost, and what its frame and body hold its power.
 * @param {PlayGraph} g
 */
export function deckBuilder(g) {
  const cards = g.nodes.filter((n) => n.kind === 'place').map((n) => ({ id: n.id, suit: n.sigil || '', name: n.label || n.text || n.sigil || '', cost: Math.max(0, n.depth - 1), power: descendants(g, n.id).filter((d) => d.kind !== 'area' && d.kind !== 'arena').length }));
  /** @type {Record<string, number>} */
  const suits = {};
  cards.forEach((c) => { suits[c.suit] = (suits[c.suit] || 0) + 1; });
  return { trope: 'deck builder', says: 'Every place is a card: its sigil the suit, how deep it sits the cost, what it holds the power. A text is a deck; a deep text is an expensive one.', cards, suits, count: cards.length };
}

/**
 * A metroidvania: every area (a body) is a region, gated by the sigil of the place that owns it, and that sigil must
 * be found somewhere else first: a place never opens itself. Sigils are held by reaching places; a region opens once
 * its gate is held from another place. Explored in rounds from the top. A region whose sigil is found nowhere else in
 * the text stays sealed: a secret that needs a key from another surface (a door).
 * @param {PlayGraph} g
 */
export function metroidvania(g) {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const areas = g.nodes.filter((n) => n.kind === 'area');
  /** The place that owns a node (its nearest place above). @param {PlayNode} n */
  const ownerOf = (n) => { let up = n.parent ? byId.get(n.parent) : undefined; while (up && up.kind !== 'place') up = up.parent ? byId.get(up.parent) : undefined; return up; };
  /** The region a node stands in: its nearest area above, or the world. @param {PlayNode} n */
  const regionOf = (n) => { let up = n.parent ? byId.get(n.parent) : undefined; while (up && up.kind !== 'area' && up.kind !== 'world') up = up.parent ? byId.get(up.parent) : undefined; return up ? (up.kind === 'world' ? 'world' : up.id) : 'world'; };
  /** @type {Map<string, Set<string>>} sigil -> the places it was found at */
  const held = new Map();
  const open = new Set(['world']);
  /** @type {Array<{ id: string, gate: string, label: string, round: number, keyFrom: string }>} */
  const opened = [];
  let round = 0;
  for (;;) {
    g.nodes.filter((n) => n.kind === 'place' && n.sigil && open.has(regionOf(n))).forEach((n) => {
      const at = held.get(/** @type {string} */ (n.sigil)) || new Set();
      at.add(n.id);
      held.set(/** @type {string} */ (n.sigil), at);
    });
    const next = areas.filter((a) => {
      if (open.has(a.id) || !open.has(regionOf(a))) return false;
      const owner = ownerOf(a);
      if (!owner?.sigil) return true;   // a body no place owns has no gate
      const finds = held.get(owner?.sigil || '') || new Set();
      return [...finds].some((id) => id !== owner?.id);
    });
    if (!next.length) break;
    round += 1;
    next.forEach((a) => {
      open.add(a.id);
      const owner = ownerOf(a);
      const keyFrom = [...(held.get(owner?.sigil || '') || [])].find((id) => id !== owner?.id) || '';
      opened.push({ id: a.id, gate: owner?.sigil || '', label: owner?.label || owner?.text || '', round, keyFrom });
    });
  }
  const sealed = areas.filter((a) => !open.has(a.id)).map((a) => ({ id: a.id, gate: ownerOf(a)?.sigil || '', label: ownerOf(a)?.label || '' }));
  return { trope: 'metroidvania', says: 'Every body is a region behind a gate: the sigil of the place that owns it, found first somewhere else. Reach a place and you hold its sigil; a region opens when its gate is held from another place. What stays sealed needs a key from another surface.', opened, sealed, rounds: round, held: [...held.keys()].sort(), count: areas.length };
}

/**
 * A rhythm track: each step of the top-level path is a beat, accented by its sigil's phase in the spirit sequence
 * (! on the downbeat, ^ last); each frame is a bar as long as its choices.
 * @param {PlayGraph} g
 */
export function rhythmTrack(g) {
  const beats = g.steps.map((id, i) => {
    const n = /** @type {PlayNode} */ (g.nodes.find((x) => x.id === id));
    const phase = SIGIL_ROLES[/** @type {keyof typeof SIGIL_ROLES} */ (n.sigil || '')]?.phase;
    return { at: i + 1, sigil: n.sigil || '', accent: phase === 0 ? 'down' : phase == null ? 'ghost' : phase >= 5 ? 'lift' : 'on' };
  });
  const bars = g.nodes.filter((n) => n.kind === 'arena').map((n) => ({ id: n.id, length: g.edges.filter((e) => e.from === n.id && e.kind === 'choice').length }));
  return { trope: 'rhythm track', says: 'Each step of the path is a beat; ! falls on the downbeat, ^ and * lift, the sigils with no phase are ghost notes. Each frame is a bar as long as its choices.', beats, bars, count: beats.length };
}

/**
 * A roguelike floor: every frame chooses one of its choices by the seed, and the rooms are the areas reached through
 * what was chosen. The same seed gives the same floor.
 * @param {PlayGraph} g @param {number} [seed]
 */
export function roguelikeFloor(g, seed = 1) {
  const arenas = g.nodes.filter((n) => n.kind === 'arena');
  const picks = arenas.map((a) => {
    const options = g.edges.filter((e) => e.from === a.id && e.kind === 'choice').map((e) => e.to);
    if (!options.length) return { arena: a.id, chose: null, of: 0 };
    const h = parseInt(fnv(`${seed}:${a.id}:${g.hash}`), 16);
    return { arena: a.id, chose: options[h % options.length], of: options.length };
  });
  const rooms = g.nodes.filter((n) => n.kind === 'area').length;
  const floors = picks.reduce((prod, p) => prod * Math.max(1, p.of), 1);
  return { trope: 'roguelike floor', says: 'Every frame is a fork chosen by the seed; the same seed walks the same floor. How many floors a text can make is the product of its frames.', seed, picks, rooms, floors, count: picks.length };
}

/**
 * A garden: every body is a bed. Each thing inside grows it by one as the path passes through, and leaving the body
 * harvests it (the right brace discharges). Nested beds feed the bed around them.
 * @param {PlayGraph} g
 */
export function garden(g) {
  const beds = g.nodes.filter((n) => n.kind === 'area').map((n) => ({ id: n.id, grows: n.charge || 0, harvest: n.charge || 0, depth: n.depth }));
  return { trope: 'garden', says: 'Every body is a bed: what stands inside grows it, and the closing brace harvests it. A text that nests deep feeds the beds around it twice.', beds, count: beds.length, harvest: beds.reduce((s, b) => s + b.harvest, 0) };
}

/** The abstraction ladder, stepped by container (spw-gradients.mjs ABSTRACTION): the spirit sequence read backward. */
export const LADDER = Object.freeze({ area: 0, arena: 1, turn: 2, passage: 3 });
const TIER_WORDS = Object.freeze(['a literal room { }', 'a chosen arena [ ]', 'a pattern zone ( )', 'a concept gate < >']);

/**
 * The ladder as a map: areas go from literal rooms { } up through chosen arenas [ ] and pattern zones ( ) to concept
 * gates < >. Going in is a step on the ladder, up or down. A concept gate has no room of its own until someone
 * enters: the nearest mind before it (an @ view, or an @ place) decides how it is implemented, in the gate's own
 * body or frame if it has one, else in the literal space of the region it stands in.
 * @param {PlayGraph} g
 */
export function abstractionLadder(g) {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const num = (/** @type {string} */ id) => Number(id.slice(1));
  /** @type {Record<string, number>} */
  const tiers = { literal: 0, instance: 0, pattern: 0, concept: 0 };
  const names = ['literal', 'instance', 'pattern', 'concept'];
  g.nodes.forEach((n) => { const t = LADDER[/** @type {keyof typeof LADDER} */ (n.kind)]; if (t != null) tiers[names[t]] += 1; });
  // Along every nesting path, outer to inner: how many steps up the ladder, and down.
  let maxUp = 0;
  let maxDown = 0;
  let deepest = /** @type {string[]} */ ([]);
  g.nodes.forEach((leaf) => {
    const chain = [];
    let at = /** @type {PlayNode | undefined} */ (leaf);
    while (at) { const t = LADDER[/** @type {keyof typeof LADDER} */ (at.kind)]; if (t != null) chain.unshift(t); at = at.parent ? byId.get(at.parent) : undefined; }
    let up = 0;
    let down = 0;
    for (let i = 1; i < chain.length; i += 1) { if (chain[i] > chain[i - 1]) up += 1; else if (chain[i] < chain[i - 1]) down += 1; }
    maxUp = Math.max(maxUp, up);
    maxDown = Math.max(maxDown, down);
    if (chain.length > deepest.length) deepest = chain.map((t) => names[t]);
  });
  const regionOf = (/** @type {PlayNode} */ n) => { let up = n.parent ? byId.get(n.parent) : undefined; while (up && up.kind !== 'area' && up.kind !== 'world') up = up.parent ? byId.get(up.parent) : undefined; return up?.id || ''; };
  const gates = g.nodes.filter((n) => n.kind === 'passage').map((gate) => {
    const region = regionOf(gate);
    // The mind: one coupled to the gate itself (@mind <concept>{ … }), else the nearest @ before it in its region.
    const coupled = g.edges.find((e) => e.kind === 'mind' && e.to === gate.id);
    const mind = (coupled ? byId.get(coupled.from) : undefined)
      || g.nodes.filter((n) => num(n.id) < num(gate.id) && regionOf(n) === region && (n.kind === 'view' || (n.kind === 'place' && n.sigil === '@'))).pop();
    const owner = gate.parent ? byId.get(gate.parent) : undefined;
    // Its own room: a container inside the gate, or (for ~<name>{ … }) the body of the place the gate names.
    const own = g.nodes.find((n) => n.parent === gate.id && LADDER[/** @type {keyof typeof LADDER} */ (n.kind)] != null)
      || (owner?.kind === 'place' ? g.nodes.find((n) => n.parent === owner.id && n.id !== gate.id && LADDER[/** @type {keyof typeof LADDER} */ (n.kind)] != null) : undefined);
    return {
      id: gate.id,
      concept: gate.label || owner?.label || '',
      mind: mind ? (mind.label || mind.text) : 'whoever enters',
      implementedAs: own ? TIER_WORDS[LADDER[/** @type {keyof typeof LADDER} */ (own.kind)]] : 'the literal space of the region it stands in'
    };
  });
  return { trope: 'abstraction ladder', says: 'Areas climb from literal rooms to chosen arenas to pattern zones to concept gates. A concept gate becomes a place only when a mind enters it, and the nearest mind before it decides what kind of place.', tiers, maxUp, maxDown, deepest, gates, count: Object.values(tiers).reduce((a, b) => a + b, 0) };
}

export const PROJECTIONS = Object.freeze({ laneRunner, deckBuilder, metroidvania, rhythmTrack, roguelikeFloor, garden, abstractionLadder });

/**
 * Parse and map in one call (parse is the vendored parser's).
 * @param {string} source @param {(text: string, options?: any) => any} parse
 */
export function graphOf(source, parse) {
  return playGraph(parse(source, { lexProfile: 'prose' }), { source });
}
