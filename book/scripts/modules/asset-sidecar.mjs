/**
 * asset-sidecar.mjs — how a derived file is annotated.
 *
 * A sidecar sits beside a file the tools made from something else: a sound
 * take, a chapter share card, an app icon. #says is the description. Each
 * =@anchor{ @target } is one mutation, in the order it was applied. The
 * lanes' cast is not a derived file (pie-world.mjs); pie-rules.spw may
 * replace those numbers once it has been read.
 *
 * readSidecar reports the mutations. It does not apply them.
 */

/** The mutations every sound take records, before the register it is heard in. */
export const SOUND_MUTATIONS = Object.freeze([
  ['channels', 'mono'],
  ['window', 'loudest'],
  ['edges', 'fade'],
  ['peak', 'minus3'],
  ['codec', 'aac'],
]);

/** The mutations every chapter share card records. */
export const CARD_MUTATIONS = Object.freeze([
  ['fit', 'cover'],
  ['grade', 'softer'],
  ['veil', 'leaf_dark'],
  ['type', 'georgia'],
  ['sigil', 'bud'],
  ['codec', 'jpeg'],
]);

/** The mutations every rebuilt icon records. `scale` is named per icon. */
export const ICON_MUTATIONS = Object.freeze([
  ['sigil', 'bud'],
  ['field', 'cover'],
]);

const NAME = /^[a-z][a-z0-9_]*$/;

/** One anchored mutation, the spelling a sidecar uses. */
export function mutationEdge(anchor, target) {
  if (!NAME.test(anchor) || !NAME.test(target)) throw new Error(`bad mutation ${anchor} → ${target}`);
  return `=@${anchor}{ @${target} }`;
}

/** A Spw string that must stay one physical line. */
export function spwQuote(value) {
  const text = String(value);
  if (/["\\\n\r]/.test(text)) throw new Error('a sidecar string must be one line and hold no quote');
  return `"${text}"`;
}

export function mutationEdges(pairs) {
  return pairs.map(([anchor, target]) => mutationEdge(anchor, target));
}

/**
 * Read a sidecar. `parse` and `readBias` come from the vendored interpreter,
 * so a caller that already loaded it does not load it twice.
 */
export function readSidecar(text, parse, readBias) {
  if (typeof parse !== 'function' || typeof readBias !== 'function') return { ok: false, error: 'no parser' };
  const result = parse(text, { lexProfile: 'prose' });
  if (!result?.completeness?.complete || result.completeness.proseFallback) {
    return { ok: false, error: 'does not read whole' };
  }
  const mutations = [];
  const seen = new WeakSet();
  const walk = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (node.type === 'Operation' && node.operator?.value === '=') {
      const bias = readBias(node);
      const anchor = bias?.anchor?.value;
      const target = bias?.targets?.[0]?.value;
      if (anchor && target) mutations.push({ anchor, target });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  };
  walk(result.ast);
  const says = [...text.matchAll(/#says\["([^"]*)"\]/g)].map((match) => match[1]);
  return { ok: true, says, mutations };
}

/** Names in `pairs` that the read mutations do not list, in order. */
export function missingMutations(mutations, pairs) {
  const got = mutations.map((mutation) => `${mutation.anchor} ${mutation.target}`);
  const missing = [];
  let at = 0;
  for (const [anchor, target] of pairs) {
    const want = `${anchor} ${target}`;
    const found = got.indexOf(want, at);
    if (found < 0) missing.push([anchor, target]);
    else at = found + 1;
  }
  return missing;
}
