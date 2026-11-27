// @ts-check
/**
 * spw-disk/geometry.mjs — Poincaré disk complex arithmetic, Möbius re-centring,
 * orthogonal geodesic arcs, and radial hyperbolic ring layout.
 *
 * Host-neutral, zero DOM: shared by spw-projection-disk.mjs and any tool or
 * study that lays out linked Spw on the hyperbolic plane.
 */

export const STEP = 1.2;        // hyperbolic distance between rings
export const DEFAULT_CAP = 60;
export const DEFAULT_RING_ONE = 18;
export const DEFAULT_DEPTH = 3;

const DEFAULT_KIND_ORDER = Object.freeze([
  'chapter', 'room', 'wonder', 'egg', 'lore', 'character',
  'palette', 'seed', 'card', 'sound', 'icon', 'index'
]);

/** @typedef {[number, number]} Complex */

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export const cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

/** @param {Complex} a @param {Complex} b @returns {Complex} */
export const cDiv = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1] || 1e-12;
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};

/** @param {Complex} a @returns {number} */
export const cAbs = (a) => Math.hypot(a[0], a[1]);

/** @param {Complex} a @returns {number} */
export const cArg = (a) => Math.atan2(a[1], a[0]);

/** @param {Complex} a @param {number} phi @returns {Complex} */
export const cTurn = (a, phi) => cMul(a, [Math.cos(phi), Math.sin(phi)]);

/** @param {Complex} a @param {Complex} b @param {number} t @returns {Complex} */
export const cLerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/**
 * T_a(z) = (z − a) / (1 − ā z): the disk's own motion, carrying a to the centre.
 * @param {Complex} z
 * @param {Complex} a
 * @returns {Complex}
 */
export function mobius(z, a) {
  return cDiv(cSub(z, a), cSub([1, 0], cMul([a[0], -a[1]], z)));
}

/**
 * The point at fraction t of the geodesic from the centre to w (constant hyperbolic speed).
 * @param {Complex} w
 * @param {number} t
 * @returns {Complex}
 */
export function alongGeodesic(w, t) {
  const r = Math.min(cAbs(w), 0.999999);
  if (r < 1e-9) return [0, 0];
  const s = Math.tanh(t * Math.atanh(r)) / r;
  return [w[0] * s, w[1] * s];
}

/**
 * Hyperbolic distance from the centre: 2·atanh|z|.
 * @param {Complex} z
 * @returns {number}
 */
export const fromCentre = (z) => 2 * Math.atanh(Math.min(cAbs(z), 0.999999));

/**
 * An SVG path for the geodesic from p to q: an arc orthogonal to the rim, or a diameter.
 * @param {Complex} p
 * @param {Complex} q
 * @returns {string}
 */
export function geodesic(p, q) {
  /** @param {number} n */
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

/**
 * The focus at the centre, its neighbours on the first ring, theirs beyond, each ring at hyperbolic
 * distance STEP further out; each thing gets a wedge of its parent's, by how much hangs from it.
 * `align` = { id, angle } turns the whole so that id sits at that angle.
 * @param {{ nodes: Map<string, any>, adj: Map<string, { to: string, edge: any }[]>, edges: any[] }} graph
 * @param {string} focus
 * @param {{ cap?: number, ringOne?: number, depth?: number, step?: number, align?: { id: string, angle: number } | null, kindOrder?: readonly string[] }} [options]
 * @returns {{ focus: string, at: Map<string, { id: string, z: Complex, depth: number, parent: string | null, wedge: number, angle: number, cap: number }>, edges: any[] }}
 */
export function layoutFrom(graph, focus, {
  cap = DEFAULT_CAP,
  ringOne = DEFAULT_RING_ONE,
  depth = DEFAULT_DEPTH,
  step = STEP,
  align = null,
  kindOrder = DEFAULT_KIND_ORDER
} = {}) {
  /** @typedef {{ id: string, depth: number, parent: string | null, children: TreeNode[], weight?: number }} TreeNode */
  /** @type {Map<string, TreeNode>} */
  const tree = new Map([[focus, { id: focus, depth: 0, parent: null, children: [] }]]);
  let frontier = [focus];
  for (let d = 1; d <= depth && tree.size < cap && frontier.length; d += 1) {
    // The first ring holds up to ringOne; the second leaves a third of what is left for the rim's crowd.
    const left = cap - tree.size;
    const room = d === 1 ? Math.min(left, ringOne) : d < depth ? Math.min(left, Math.max(frontier.length * 2, Math.ceil(left * 0.62))) : left;
    const queues = frontier.map((id) => (graph.adj.get(id) || []).filter((n) => !tree.has(n.to)).map((n) => ({ parent: id, to: n.to })));
    /** @type {string[]} */
    const next = [];
    let added = 0;
    for (let round = 0; added < room && queues.some((q) => q.length); round += 1) {
      for (const q of queues) {
        if (added >= room) break;
        while (q.length && tree.has(q[0].to)) q.shift();
        const pick = q.shift();
        if (!pick) continue;
        /** @type {TreeNode} */
        const node = { id: pick.to, depth: d, parent: pick.parent, children: [] };
        tree.set(pick.to, node);
        tree.get(pick.parent)?.children.push(node);
        next.push(pick.to);
        added += 1;
      }
    }
    frontier = next;
  }
  // Weights: a thing with more hanging from it gets a wider wedge.
  /** @param {TreeNode} node @returns {number} */
  const weigh = (node) => {
    node.weight = 1 + node.children.reduce((sum, child) => sum + weigh(child), 0) * 0.55;
    return node.weight;
  };
  const root = tree.get(focus);
  if (!root) return { focus, at: new Map(), edges: [] };
  weigh(root);
  /** @param {string} id */
  const kindRank = (id) => kindOrder.indexOf(graph.nodes.get(id)?.kind);
  /** @type {Map<string, { id: string, z: Complex, depth: number, parent: string | null, wedge: number, angle: number, cap: number }>} */
  const at = new Map();
  /** @param {TreeNode} node @param {number} from @param {number} to */
  const place = (node, from, to) => {
    const angle = (from + to) / 2;
    const r = node.depth ? Math.tanh((node.depth * step) / 2) : 0;
    const wedge = to - from;
    at.set(node.id, {
      id: node.id,
      z: [r * Math.cos(angle), r * Math.sin(angle)],
      depth: node.depth,
      parent: node.parent,
      wedge,
      angle,
      cap: node.depth ? 0.46 * wedge * r : 1
    });
    const kids = [...node.children].sort((a, b) => kindRank(a.id) - kindRank(b.id) || a.id.localeCompare(b.id));
    const total = kids.reduce((sum, k) => sum + (k.weight || 1), 0) || 1;
    let cursor = node.depth ? from : -Math.PI / 2 - (Math.PI * (kids[0]?.weight || 1)) / total;
    // Each thing's wedge is a share of the one it hangs from; a deep ring may borrow a little room either side.
    const span = node.depth ? Math.min(wedge * 1.15, Math.PI) : Math.PI * 2;
    if (node.depth) cursor = angle - span / 2;
    kids.forEach((kid) => {
      const share = (span * (kid.weight || 1)) / total;
      place(kid, cursor, cursor + share);
      cursor += share;
    });
  };
  place(root, 0, Math.PI * 2);
  const aligned = align ? at.get(align.id) : null;
  if (align && aligned && aligned.depth) {
    const turn = align.angle - cArg(aligned.z);
    at.forEach((p) => { p.z = cTurn(p.z, turn); p.angle += turn; });
  }
  const drawn = graph.edges.filter((e) => at.has(e.a) && at.has(e.b));
  return { focus, at, edges: drawn };
}
