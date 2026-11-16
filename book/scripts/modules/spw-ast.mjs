// @ts-check
/**
 * spw-ast.mjs — shared, zero-dependency AST and grammar helpers over spw-seed trees.
 *
 * Host-neutral (Node tools and browser modules alike) so every consumer shares one definition
 * of a whole parse (refusing silent prose fallbacks), depth-first walking, frame extraction,
 * uniform Reference/Operation/Binding reading, and template discovery.
 */

/** @typedef {Record<string, any>} SpwNode */

/**
 * Strip one pair of surrounding matching double quotes from a token value.
 * @param {unknown} raw
 * @returns {string}
 */
export const unquoteText = (raw) => {
  const s = String(raw ?? '');
  return s.length >= 2 && s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;
};

/**
 * Canonical completeness predicate for `spw-seed.parse(..., { lexProfile: 'prose' })`.
 * Refuses parses that report `success: true` after silently falling back to prose.
 * @param {any} result
 * @returns {boolean}
 */
export const isWholeSpw = (result) => Boolean(
  result?.success && result.completeness?.complete && !result.completeness?.proseFallback
);

/**
 * Parse Spw text safely with `lexProfile: 'prose'`. Never throws.
 * @param {string} text
 * @param {Function | null | undefined} parse
 * @returns {{ result: any, ast: SpwNode | null, whole: boolean, errors: any[] }}
 */
export function parseProseSpw(text, parse) {
  if (typeof parse !== 'function') return { result: null, ast: null, whole: false, errors: [] };
  try {
    const result = parse(String(text ?? ''), { lexProfile: 'prose' });
    const whole = isWholeSpw(result);
    return {
      result,
      ast: whole ? (result?.ast || null) : (result?.ast || null),
      whole,
      errors: Array.isArray(result?.errors) ? result.errors : []
    };
  } catch {
    return { result: null, ast: null, whole: false, errors: [] };
  }
}

/**
 * Walk every AST node depth-first, skipping parser `span` source-location metadata.
 * @param {unknown} node
 * @param {(n: SpwNode) => void} visit
 */
export function walkAst(node, visit) {
  if (Array.isArray(node)) {
    for (const child of node) walkAst(child, visit);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const typed = /** @type {SpwNode} */ (node);
  visit(typed);
  for (const [k, v] of Object.entries(typed)) {
    if (k !== 'span') walkAst(v, visit);
  }
}

/**
 * Extract top-level expressions from a parsed Seed AST.
 * @param {SpwNode | null | undefined} ast
 * @returns {SpwNode[]}
 */
export const topExpressions = (ast) => ast?.expression?.expressions || ast?.expressions || [];

/**
 * Extract expressions inside a node body (`{ ... }`) or sequence.
 * @param {SpwNode | null | undefined} node
 * @returns {SpwNode[]}
 */
export const bodyExpressions = (node) => node?.body?.sequence?.expressions || node?.sequence?.expressions || [];

/**
 * Read a `Reference` (`@name` / `@path/part`) cleanly without JSON-stringifying.
 * @param {SpwNode | null | undefined} ref
 * @returns {string}
 */
export function referenceName(ref) {
  if (!ref || typeof ref !== 'object') return '';
  if (typeof ref.raw === 'string' && ref.raw) return ref.raw;
  if (Array.isArray(ref.path) && ref.path.length) {
    return ref.path
      .map((/** @type {any} */ p) => p?.value ?? p?.token?.value ?? '')
      .filter(Boolean)
      .join('.');
  }
  return '';
}

/**
 * Flatten a leaf or expression AST node into clean display text.
 * Handles Literals, Identifiers, PathRefs (`~"..."`), References (`@x`), ModifierChains (valence words), and Frames.
 * @param {SpwNode | null | undefined} node
 * @returns {string}
 */
export function nodeText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'Literal') return unquoteText(node.token?.value);
  if (node.type === 'Identifier') return String(node.token?.value ?? '');
  if (node.type === 'PathRef') return unquoteText(node.path?.token?.value ?? node.token?.value);
  if (node.type === 'Reference') return referenceName(node);
  if (node.type === 'Parameter') return nodeText(node.value);
  if (node.type === 'Expression') {
    const parts = [
      ...(node.terms || []).map(nodeText),
      ...(node.modifiers?.modifiers || []).map((/** @type {any} */ m) => String(m?.value ?? ''))
    ].filter(Boolean);
    return parts.join(' ');
  }
  if (node.token?.value != null) return unquoteText(node.token.value);
  return '';
}

/**
 * Extract all textual items from a `Frame` (`[a, b]`) or an Operation/Expression carrying `.frame`.
 * @param {SpwNode | null | undefined} target
 * @returns {string[]}
 */
export function frameItems(target) {
  const frame = target?.type === 'Frame' ? target : target?.frame;
  const content = frame?.content || [];
  /** @type {string[]} */
  const out = [];
  for (const part of content) {
    const value = nodeText(part?.type === 'Parameter' ? part.value : part).trim();
    if (value) out.push(value);
  }
  return out;
}

/**
 * Summarize an `Operation` node (`!label[frame]{ body }` / `^slot{ ... }` / `=bias@who[...]`).
 * @param {SpwNode | null | undefined} node
 * @returns {{ sigil: string, label: string, modifiers: string[], frame: string[], bodyExpressions: SpwNode[] } | null}
 */
export function opInfo(node) {
  if (!node || node.type !== 'Operation') return null;
  const modifiers = (node.modifiers?.modifiers || []).map((/** @type {any} */ m) => String(m?.value ?? '')).filter(Boolean);
  return {
    sigil: String(node.operator?.value ?? ''),
    label: String(node.operatorLabel?.value ?? modifiers[0] ?? ''),
    modifiers,
    frame: node.frame ? frameItems(node.frame) : [],
    bodyExpressions: bodyExpressions(node)
  };
}

/**
 * Summarize a `Binding` node (`key: value`), whether bare (`slots:`), sigil-led (`!source:`, `&ref:`), or annotated (`~#answer:`).
 * @param {SpwNode | null | undefined} node
 * @returns {{ sigil: string, label: string, name: string, value: SpwNode | null, text: string, frame: string[] } | null}
 */
export function bindingInfo(node) {
  if (!node || node.type !== 'Binding') return null;
  const key = node.key;
  const sigil = key?.type === 'Operation' ? String(key.operator?.value ?? '') : '';
  const label = key?.type === 'Operation'
    ? String(key.operatorLabel?.value ?? key.modifiers?.modifiers?.[0]?.value ?? '')
    : String(key?.token?.value ?? '');
  const firstTerm = node.value?.terms?.[0] ?? null;
  const frame = firstTerm?.type === 'Frame'
    ? frameItems(firstTerm)
    : firstTerm?.frame
      ? frameItems(firstTerm.frame)
      : [];
  return {
    sigil,
    label,
    name: `${sigil}${label}`,
    value: node.value ?? null,
    text: nodeText(node.value),
    frame
  };
}

/**
 * Extract template definitions from a parsed `.spw/surfaces/projection.spw` AST:
 *   - `slots`: declared placeholder names inside `slots: [ ... ]`
 *   - `sources`: `{ templateName, raw, frame }` entries for `!source: "..."` bindings inside `*name{ ... }`
 * @param {SpwNode | null | undefined} ast
 * @returns {{ slots: string[], sources: Array<{ name: string, source: string }> }}
 */
export function readProjectionTemplates(ast) {
  /** @type {string[]} */
  let slots = [];
  /** @type {Array<{ name: string, source: string }>} */
  const sources = [];
  walkAst(ast, (node) => {
    if (node.type === 'Binding') {
      const info = bindingInfo(node);
      if (info?.name === 'slots' && info.frame.length) slots = info.frame;
      return;
    }
    if (node.type === 'Operation' && node.operator?.value === '*') {
      const name = String(node.operatorLabel?.value ?? '');
      for (const expr of bodyExpressions(node)) {
        for (const term of expr.terms || []) {
          const b = bindingInfo(term);
          if (b?.name === '!source' && b.text) sources.push({ name, source: b.text });
        }
      }
    }
  });
  return { slots, sources };
}

/** Canonical 13-element Ring progression (`~ # . ? ! * & @ <> () [] {} ^`): opening lens and closing hand-off per chapter. */
export const RING_SEQUENCE = Object.freeze([
  { ring: 1, symbol: '~', name: 'potential', kind: 'operator', openingSense: 'unspent latency without a receipt', closingTurn: 'invites an external mark (#)', represents: 'What waits before being named' },
  { ring: 2, symbol: '#', name: 'annotation', kind: 'operator', openingSense: 'competing marks, rumours, or records beside the thing', closingTurn: 'hits bedrock physical facts (.)', represents: 'How observers classify and frame the same event' },
  { ring: 3, symbol: '.', name: 'ground', kind: 'operator', openingSense: 'physical footing, soil, or invariant furniture', closingTurn: 'raises an open question (?)', represents: 'What holds regardless of opinion' },
  { ring: 4, symbol: '?', name: 'probe', kind: 'operator', openingSense: 'council, riddle, or ambiguity held without forcing', closingTurn: 'provokes a decisive act (!)', represents: 'Inquiry before commitment' },
  { ring: 5, symbol: '!', name: 'action', kind: 'operator', openingSense: 'rupture, spark, or irreversible turn', closingTurn: 'settles into a durable value (*)', represents: 'State transition and consequence' },
  { ring: 6, symbol: '*', name: 'value', kind: 'operator', openingSense: 'concrete artifact, keepsake, or lantern in hand', closingTurn: 'invites meeting and exchange (&)', represents: 'Reified objects and portable tokens' },
  { ring: 7, symbol: '&', name: 'confluence', kind: 'operator', openingSense: 'two strands braided without erasing either', closingTurn: 'reveals how each side sees the other (@)', represents: 'Oaths, merges, and non-destructive composition' },
  { ring: 8, symbol: '@', name: 'perspective', kind: 'operator', openingSense: 'observer shift—through a beast, mirror, well, or hat', closingTurn: 'opens a directional crossing (<>)', represents: 'Standpoint and observer-relative truth' },
  { ring: 9, symbol: '<>', name: 'capsule', kind: 'container', openingSense: 'threshold conduit built only to cross through', closingTurn: 'empties into a shared gathering (())', represents: 'Channels, boundaries, and interfaces' },
  { ring: 10, symbol: '()', name: 'scope', kind: 'container', openingSense: 'ephemeral gathering where voices convene at once', closingTurn: 'narrows into a framed selection ([])', represents: 'Harmonic councils and scoped ensembles' },
  { ring: 11, symbol: '[]', name: 'frame', kind: 'container', openingSense: 'selective window contrasting paradoxical rules', closingTurn: 'accumulates charge inside a body ({})', represents: 'Indexing, filtering, and borderline paradox' },
  { ring: 12, symbol: '{}', name: 'body', kind: 'container', openingSense: 'enclosed chamber gathering full semantic mass', closingTurn: 'discharges upward into integration (^)', represents: 'Containment, state accumulation, and release' },
  { ring: 13, symbol: '^', name: 'integration', kind: 'integration', openingSense: 'capstone bind gathering the twelve preceding steps', closingTurn: 'hinges into the next ring (~)', represents: 'Summary, emission, and octave recursion' }
]);

/** Horizontal tuning modulators orthogonal to the 13-step ring: lean (=), count (%), material ($). */
export const MODULATOR_SIGILS = Object.freeze(['=', '%', '$']);

/**
 * Resolve a 1-based chapter number onto its Ring of Thirteen slot (`1..13`), octave book (`1..`), and next construct.
 * @param {number} chapterNumber
 */
export function ringSlotFor(chapterNumber) {
  const n = Math.max(1, Math.floor(Number(chapterNumber) || 1));
  const index = (n - 1) % RING_SEQUENCE.length;
  const current = RING_SEQUENCE[index];
  const next = RING_SEQUENCE[(index + 1) % RING_SEQUENCE.length];
  return {
    chapter: n,
    book: Math.floor((n - 1) / RING_SEQUENCE.length) + 1,
    ...current,
    nextSymbol: next.symbol,
    nextName: next.name
  };
}

/** The 9 operator symbols of the Ring in canonical progression order (`~ # . ? ! * & @ ^`). */
export const RING_OPERATOR_ORDER = Object.freeze(
  RING_SEQUENCE.filter((entry) => entry.kind !== 'container').map((entry) => entry.symbol)
);

/**
 * Read a single-line Spw expression's fragments, bonds, and one-nuance pivots along the 9-operator ring.
 * @param {string} line
 * @param {any} seed
 */
export function describeLinePivots(line, seed) {
  const src = String(line ?? '').trim();
  if (!src || src.includes('\n') || typeof seed?.readFragments !== 'function' || typeof seed?.pivotsOf !== 'function') {
    return { fragments: [], bonds: [], pivots: [], readPivots: [], nextPivot: null };
  }
  try {
    const { fragments = [], bonds = [] } = seed.readFragments(src);
    const pivots = seed.pivotsOf(src, { order: RING_OPERATOR_ORDER });
    const readPivots = pivots.filter((/** @type {any} */ p) => p.status === 'read');
    const nextPivot = readPivots.find((/** @type {any} */ p) => p.read?.line && p.read?.parser && p.read?.spoken) || readPivots[0] || null;
    return { fragments, bonds, pivots, readPivots, nextPivot };
  } catch {
    return { fragments: [], bonds: [], pivots: [], readPivots: [], nextPivot: null };
  }
}
