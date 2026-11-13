/**
 * spw-formulas.mjs — Spw formulas that compute, read and say: the theory made castable.
 *
 * A formula is a Spw expression whose shape is its meaning. Some count (a hand of cards is a combination, and the
 * operators of its body say which: =ordered, =repeats, %from), some measure (a slice is a fraction of the pie),
 * some lean (a =lean body of %weights is a share of three genres), some are edges (=boon@a{ @b } leans forward,
 * =bane@a{ @b } leans back), and some are lines the site already keeps (^board, ^way) or compose two of them in
 * a confluence (&[ … ]). readFormula() reads one; sayFormula() says it in plain words and computes what computes.
 * The catalogue (FORMULAS) is .spw/surfaces/formulas.spw in code: every example there is cast here by the check.
 *
 * Reading: with the real parser (spw-seed's parse) a formula must read whole, and its edges are read by the
 * workbench's own readBias; the shape is then interpreted by the small reader below, which also reads alone when
 * the parser is not to be had. Nothing here touches the page or storage: the desk does that.
 */
import { hands, combinatoricsFor, SIGIL_CARDS, QUARTERS, BAND_QUARTERS } from './competency.mjs?v=2026_11_11.A';
import { readBoardLine, HOLDS } from '../home/pie-frame.mjs?v=2026_11_13.B';

/** @typedef {{ sigil: string, name: string, anchor: string, frame: Array<string | Term> | null, body: Term[] | null, capsule: boolean }} Term */
/** @typedef {(text: string, options?: any) => any} Parse */
/** @typedef {{ ok: boolean, reader: string, terms: Term[], whole: boolean | null, edges: any[], src: string }} Read */
/** @typedef {{ kind: string, says: string[], value?: number | string, list?: string[] }} Said */

const SIGILS = '!?~@&*^#.=%$';
/** Each sigil's role in a word, from the operator table (spw-interactions.mjs OPERATOR_ROLES). */
export const ROLE = Object.freeze({ '!': 'action', '?': 'probe', '~': 'potential', '@': 'perspective', '&': 'confluence', '*': 'value', '^': 'integration', '#': 'annotation', '.': 'ground', '=': 'config', '%': 'measure', '$': 'substrate' });
/** The valence pentad and the way each leans an edge (the workbench registry, read through readBias). */
export const EDGE_SIGN = Object.freeze({ boon: 'forward', bane: 'inverse', bone: 'forward', bonk: 'forward', honk: 'forward' });

/* ─── The small reader: terms, frames, bodies and capsules, nested ──────────── */

/**
 * Read an expression by hand into terms. Grammar it takes: [sigil] [name] [@anchor] [ [frame] ] [ {body} ], a bare
 * <name>{ } capsule, and frames whose items are words, numbers, fractions or terms. Returns null when brackets do
 * not close.
 * @param {string} src
 * @returns {Term[] | null}
 */
export function smallTerms(src) {
  const s = String(src || '');
  let i = 0;
  const ws = () => { while (i < s.length && /\s|,/.test(s[i])) i += 1; };
  const word = () => {
    const m = /^(?:"[^"]*"|[A-Za-z_][\w-]*|-?\d+(?:\.\d+)?(?:\/\d+)?)/.exec(s.slice(i));
    if (!m) return '';
    i += m[0].length;
    return m[0];
  };
  /** @param {string} close @returns {Term[] | null} */
  const seq = (close) => {
    /** @type {Term[]} */
    const out = [];
    for (;;) {
      ws();
      if (i >= s.length) return close ? null : out;
      if (close && s[i] === close) { i += 1; return out; }
      const t = term();
      if (!t) return null;
      out.push(t);
    }
  };
  /** @returns {Array<string | Term> | null} */
  const frame = () => {
    /** @type {Array<string | Term>} */
    const out = [];
    for (;;) {
      ws();
      if (i >= s.length) return null;
      if (s[i] === ']') { i += 1; return out; }
      if (SIGILS.includes(s[i]) || s[i] === '[' || s[i] === '{' || s[i] === '<') { const t = term(); if (!t) return null; out.push(t); continue; }
      const w = word();
      if (!w) return null;
      out.push(w.replace(/^"|"$/g, ''));
    }
  };
  /** @returns {Term | null} */
  const term = () => {
    /** @type {Term} */
    const t = { sigil: '', name: '', anchor: '', frame: null, body: null, capsule: false };
    if (SIGILS.includes(s[i])) { t.sigil = s[i]; i += 1; }
    if (s[i] === '<') {
      const end = s.indexOf('>', i);
      if (end < 0) return null;
      t.name = s.slice(i + 1, end).trim();
      t.capsule = true;
      i = end + 1;
    } else t.name = word();
    if (s[i] === '@' && /[A-Za-z_]/.test(s[i + 1] || '')) { i += 1; t.anchor = word(); }
    ws();
    if (s[i] === '[') { i += 1; const f = frame(); if (!f) return null; t.frame = f; ws(); }
    if (s[i] === '{') { i += 1; const b = seq('}'); if (!b) return null; t.body = b; }
    if (!t.sigil && !t.name && !t.frame && !t.body && !t.capsule) return null;
    return t;
  };
  return seq('');
}

/**
 * Read a formula: { ok, reader, terms, whole, edges }. whole is what the real parser made of it (null without one).
 * @param {string} src
 * @param {{ parse?: Parse | null, readBias?: ((node: any) => any) | null }} [opts]
 * @returns {Read}
 */
export function readFormula(src, { parse = null, readBias = null } = {}) {
  const text = String(src || '').trim();
  const terms = smallTerms(text) || [];
  let whole = null;
  /** @type {any[]} */
  const edges = [];
  if (parse) {
    try {
      const r = parse(text, { lexProfile: 'prose' });
      whole = Boolean(r?.completeness?.complete && !r.completeness.proseFallback);
      if (whole && readBias) {
        const top = (r.ast?.expression?.expressions || r.ast?.expressions || []).flatMap((/** @type {any} */ e) => e.terms || []);
        top.filter((/** @type {any} */ n) => n.type === 'Operation' && n.operator?.value === '=').forEach((/** @type {any} */ n) => {
          try { const e = readBias(n); if (e?.sign) edges.push(e); } catch { /* not an edge */ }
        });
      }
    } catch { whole = false; }
  }
  return { ok: terms.length > 0, reader: whole ? 'spw-seed' : 'small', terms, whole, edges, src: text };
}

/* ─── Saying and computing ─────────────────────────────────────────────── */

const yes = (/** @type {unknown} */ v) => /^(yes|true|on)$/i.test(String(v ?? ''));
/** @param {Term[] | null} body @param {string} sigil @param {string} name */
const find = (body, sigil, name) => (body || []).find((t) => t.sigil === sigil && t.name === name);
/** @param {Term | undefined} t */
const firstArg = (t) => (t?.frame?.[0] ?? '');
/** @param {Term} t @returns {string} */
export const termText = (t) => `${t.sigil}${t.capsule ? `<${t.name}>` : t.name}${t.anchor ? `@${t.anchor}` : ''}${t.frame ? `[${t.frame.map((a) => (typeof a === 'string' ? a : termText(a))).join(', ')}]` : ''}${t.body ? `{ ${t.body.map(termText).join(' ')} }` : ''}`;
/** n choose k lists, small: every hand from items. @param {string[]} items @param {number} k @param {boolean} ordered @param {boolean} repeats */
function listHands(items, k, ordered, repeats) {
  /** @type {string[][]} */
  const out = [];
  /** @param {string[]} hand @param {number} start */
  const go = (hand, start) => {
    if (out.length > 64) return;
    if (hand.length === k) { out.push(hand); return; }
    items.forEach((item, j) => {
      if (!ordered && j < start) return;
      if (!repeats && hand.includes(item)) return;
      go([...hand, item], repeats ? j : j + 1);
    });
  };
  go([], 0);
  return out.map((h) => h.join(' '));
}
/** @param {string} v @returns {number | null} */
const numberOf = (v) => {
  const m = /^(-?\d+(?:\.\d+)?)(?:\/(\d+))?$/.exec(String(v || '').trim());
  if (!m) return null;
  return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
};

/**
 * Say a formula and compute what computes. Returns { kind, says: [lines], value?, list? }.
 * @param {Read} read
 * @returns {Said}
 */
export function sayFormula(read) {
  const [t, ...rest] = read.terms;
  if (!t) return { kind: 'none', says: ['Nothing in it reads as Spw.'] };
  // A hand of cards: *hand[k]{ %from[n | a, b, c] =ordered[yes|no|either] =repeats[yes|no] }
  if (t.sigil === '*' && t.name === 'hand') {
    const k = Math.max(1, Math.min(12, Number(firstArg(t)) || 1));
    const from = find(t.body, '%', 'from');
    const named = (from?.frame || []).filter((a) => typeof a === 'string' && !/^\d+$/.test(a)).map(String);
    const n = named.length || Math.max(1, Math.min(24, Number(firstArg(from)) || SIGIL_CARDS.length));
    const orderedArg = String(firstArg(find(t.body, '=', 'ordered')) || 'no');
    const ordered = orderedArg === 'either' ? 'either' : yes(orderedArg);
    const repeats = yes(firstArg(find(t.body, '=', 'repeats')));
    const count = hands(n, { hand: k, ordered, repeats });
    const items = named.length ? named : SIGIL_CARDS.slice(0, n).map(String);
    const list = count <= 64 && ordered !== 'either' ? listHands(items, k, Boolean(ordered), repeats) : [];
    const rule = ordered === 'either' ? 'sets and sequences both' : `${ordered ? 'order matters' : 'order does not matter'}, ${repeats ? 'a card may come again' : 'no card twice'}`;
    return { kind: 'count', value: count, list, says: [`A hand of ${k} from ${n}: ${rule}.`, `${count} hand${count === 1 ? '' : 's'}${list.length ? `: ${list.join(' · ')}` : '.'}`] };
  }
  // A measure of the pie: %[slice]{ 1/8 } or %slice[1/8]
  if (t.sigil === '%' && (t.name === 'slice' || firstArg(t) === 'slice')) {
    const raw = t.name === 'slice' ? String(firstArg(t)) : String(t.body?.[0]?.name || '');
    const v = numberOf(raw);
    if (v == null || v <= 0) return { kind: 'measure', says: ['A slice of what? Give it as a fraction: %[slice]{ 1/8 }.'] };
    const pies = v > 1 ? ` That is more than one pie; the pie, as the book says, is never smaller for it.` : '';
    return { kind: 'measure', value: v, says: [`${raw} of the pie: ${Math.round(v * 1000) / 10}% of it, ${Math.round(v * 3600) / 10} degrees of the round.`, `${Math.round(1 / v * 100) / 100} such slices make the whole.${pies}`] };
  }
  // A lean: =lean{ %boon[2] %bane[1] %bone[1] }, or pie-rules' =lean{ &fairy_tale{ %event[w] … } … }
  if (t.sigil === '=' && t.name === 'lean' && t.body) {
    const LANDS = { fairy_tale: 'boon', absurd_reality: 'bane', low_magic: 'bone' };
    /** @type {Record<string, number>} */
    const w = { boon: 0, bane: 0, bone: 0 };
    t.body.forEach((x) => {
      if (x.sigil === '%' && x.name in w) w[x.name] += Math.max(0, Number(firstArg(x)) || 0);
      if (x.sigil === '&' && x.name in LANDS) (x.body || []).forEach((y) => { if (y.sigil === '%') w[/** @type {Record<string, string>} */ (LANDS)[x.name]] += Math.max(0, Number(firstArg(y)) || 0); });
    });
    const total = w.boon + w.bane + w.bone;
    if (!total) return { kind: 'lean', says: ['A lean with no weight in it leans nowhere.'] };
    const shares = Object.entries(w).map(([k, v]) => [k, Math.round((v / total) * 100)]);
    const top = shares.slice().sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return { kind: 'lean', value: String(top[0]), says: [`It leans ${shares.map(([k, v]) => `${k} ${v}%`).join(', ')}.`, `Most of all ${top[0]}: ${({ boon: 'fairy tale, kindness given and wonder kept', bane: 'absurd reality, knocks taken and foretellings let come true', bone: 'low magic, what is done exactly and honestly' })[String(top[0])]}.`] };
  }
  // An edge: =boon@a{ @b } leans forward, =bane@a{ @b } leans back (the workbench's readBias when it was read whole).
  if (t.sigil === '=' && t.anchor && t.name in EDGE_SIGN) {
    const edge = read.edges[0];
    const sign = edge?.sign || EDGE_SIGN[/** @type {keyof typeof EDGE_SIGN} */ (t.name)];
    const targets = (edge?.targets || (t.body || []).map((x) => ({ value: x.name }))).map((/** @type {any} */ x) => x.value).filter(Boolean);
    return { kind: 'edge', value: sign, says: [`An edge from ${t.anchor} toward ${targets.join(' and ') || 'nothing yet'}, leaning ${t.name}: ${sign === 'inverse' ? 'it pulls back, the way a debt does; read as a ledger it is the price' : 'it carries forward, the way a gift does; read as a ledger it is the gain'}.`] };
  }
  // The board: ^board{ … } (pie-frame.mjs)
  if (t.sigil === '^' && t.name === 'board') {
    const { view, unknown } = readBoardLine(termText(t));
    const keys = Object.keys(view);
    return { kind: 'board', value: keys.length, says: [keys.length ? `A board: ${keys.map((k) => `${k} ${String(view[k])}`).join(', ')}.${view.hold && HOLDS[String(view.hold)] ? ` ${HOLDS[String(view.hold)].says}` : ''}` : 'A board with no choices in it: the lanes as they come.', ...(unknown.length ? [`Not a choice: ${unknown.join('; ')}.`] : [])] };
  }
  // A way through: ^way{ !aside[…] =apart[…] } (way-through.mjs reads it the same way)
  if (t.sigil === '^' && t.name === 'way') {
    const aside = (find(t.body, '!', 'aside')?.frame || []).map(Number).filter((n) => n > 0);
    const apart = (find(t.body, '=', 'apart')?.frame || []).map(String);
    return { kind: 'way', value: aside.length, says: [`A way through: ${aside.length ? `chapters ${aside.join(', ')} set aside` : 'every chapter'}${apart.length ? `, and ${apart.join(', ')} kept apart` : ''}.`] };
  }
  // Two lines in one confluence: &[ ^board{ … } ^way{ … } ]
  if (t.sigil === '&' && !t.name && t.frame) {
    const parts = t.frame.filter((a) => typeof a !== 'string').map((a) => sayFormula({ ...read, terms: [/** @type {Term} */ (a)] }));
    const kinds = parts.map((p) => p.kind);
    const joined = kinds.includes('board') && kinds.includes('way') ? 'Hands and route together: how this screen is held, and which way through the book. Neither changes the other; a link can carry both.' : `${parts.length} lines meet; each keeps its own meaning, and the meeting is the pair.`;
    return { kind: 'compose', value: parts.length, says: [joined, ...parts.flatMap((p) => p.says)] };
  }
  // The daily layering: ^cadence[ %day{ … } %week{ … } %month{ … } %quarter{ … } ]
  if (t.sigil === '^' && t.name === 'cadence') {
    const layers = (t.frame || []).filter((a) => typeof a !== 'string').map((a) => /** @type {Term} */ (a).name);
    const days = Math.round(QUARTERS * 365.25 / 4);
    return { kind: 'cadence', value: days, says: [`Layers, each inside the next: ${layers.join(' in ')}.`, `A week holds 7 days of one trope; a quarter holds 3 months, one turn of boon, bane and bone; ${QUARTERS} quarters make the arc, about ${days} days, each with its own reading.`] };
  }
  // The cone: @pupil{ %band[5] } or @cone[5]
  if (t.sigil === '@' && (t.name === 'pupil' || t.name === 'cone')) {
    const band = Number(firstArg(find(t.body, '%', 'band'))) || Number(firstArg(t)) || 1;
    const quarter = Number(firstArg(find(t.body, '%', 'quarter')));
    const c = combinatoricsFor(quarter ? { quarter } : { band });
    return { kind: 'cone', value: c.cone, says: [`Band ${c.band}, ${c.name}: it holds ${c.holds.join(', ')}.`, `The cone is ${c.cone} wide: ${c.clusters.join(', ')} in view, facing ${c.focus}. A hand is ${c.hand} card${c.hand === 1 ? '' : 's'}, ${c.ordered === 'either' ? 'set or sequence' : c.ordered ? 'in order' : 'in any order'}, ${c.repeats ? 'repeats allowed' : 'no repeats'}: ${c.sigilHands} hands of the twelve sigils. (${BAND_QUARTERS} quarters a band.)`] };
  }
  // Frame and body, charge and discharge, probe then ground: describable, not computed.
  if (!t.sigil && t.frame && t.body) return { kind: 'frame', says: [`A frame [${t.frame.join(' ')}] around a body { ${t.body.map(termText).join(' ')} }: the frame selects what is seen, the body is what is there. The board is one: a screen of any shape around a world of one size.`] };
  if (!t.sigil && !t.name && t.body && !t.body.length) return { kind: 'charge', says: ['An opened and closed body: the brace that opens gathers, the brace that closes spends. Held, a throw winds up; let go, it goes.'] };
  if (t.sigil === '?' && rest[0]?.sigil === '.') return { kind: 'probe-ground', says: ['A probe, then a ground: first the look, then what holds. The board draws it: haze over the far end of the road, ground under the carrier.'] };
  return { kind: 'unread', says: [`Read as ${read.terms.map(termText).join(' ')}: ${t.sigil ? `${t.sigil} is ${ROLE[/** @type {keyof typeof ROLE} */ (t.sigil)]}` : 'no sigil'}${t.name ? `, named ${t.name}` : ''}. No formula computes it yet.`] };
}

/**
 * Cast: read and say in one call. A mind's map, a land in a container and a name on the ladder are said by their own
 * readers (readMind, resolveLand, ladderOf); everything else by sayFormula.
 * @param {string} src @param {{ parse?: Parse | null, readBias?: ((node: any) => any) | null, as?: string }} [opts]
 * @returns {{ read: Read, said: Said }}
 */
export function castFormula(src, opts = {}) {
  const read = readFormula(src, opts);
  const mind = readMind(read.src, opts);
  if (mind) return { read, said: { kind: 'mind', value: mind.agrees === true ? `{${mind.place}}` : '', says: mind.says } };
  if (/\.land(@[a-z]\w*)?\s*$/i.test(read.src) && /[<{[(]/.test(read.src)) {
    const land = resolveLand(read.src, { as: opts.as || '' });
    if (land.kind !== 'unread') return { read, said: { kind: 'land', value: land.resolved || (land.open ? 'open' : ''), says: land.says } };
  }
  const step = ladderOf(read.src);
  if (step) return { read, said: { kind: 'ladder', value: (step.moved || step.rung).name, says: step.says } };
  return { read, said: sayFormula(read) };
}

/** Desk handles a ladder move must not shadow (^[slip] is a desk spell). */
const DESK_WORDS = new Set(['slip', 'stacks', 'card', 'resume', 'next', 'new', 'shelf', 'find', 'keep', 'again', 'lens', 'genre', 'light', 'binding', 'desk']);

/** Is this line a formula the desk should cast (not a desk spell, not plain words)? @param {string} src */
export function isFormula(src) {
  const text = String(src || '').trim();
  if (/^(\*hand\s*\[|%\s*\[\s*slice\s*\]|%slice\s*\[|=lean\s*\{|=(boon|bane|bone|bonk|honk)@|\^board\s*\{|\^way\s*\{|&\s*\[|\^cadence\s*\[|@(pupil|cone)\b|\[[^\]]*\]\s*\{|\{\s*\}|\?\s*\{[^}]*\}\s*\.)/.test(text)) return true;
  if (/^@[a-z]\w*\s*\{\s*</i.test(text) || /^@[a-z]\w*\s*[<{[(]/i.test(text) || /^\[[^\]]*\]\.land/i.test(text)) return true;
  const step = ladderOf(text);
  return Boolean(step && !(text.startsWith('^') && DESK_WORDS.has(step.name)));
}

/* ─── The container ladder: one name, four steps of abstraction ─────────────
 * {boon} the literal space (a body: the place, materialized) → [boon] a frame (one chosen among several, an instance
 * in view) → (boon) a scope (a grouping that gathers whatever is like it) → <boon> a capsule (the concept: a channel a
 * mind implements in its own literal space). The spec's container table gives no order; its spirit sequence
 * ?~<#.>@(#.)&[#.]*{#.}^ (LAYERS.md) runs < ( [ { from the unspent (~) to the concrete (*), which is this ladder read
 * from the top. Moving a name: ^ binds it one step up (more abstract), . grounds it one step down (more concrete). */
/** @typedef {{ open: string, close: string, name: string, step: number, is: string }} Rung */
/** @type {ReadonlyArray<Rung>} */
export const LADDER = Object.freeze([
  { open: '{', close: '}', name: 'body', step: 1, is: 'the literal space: the thing itself, materialized' },
  { open: '[', close: ']', name: 'frame', step: 2, is: 'a frame: one chosen among several, an instance in view' },
  { open: '(', close: ')', name: 'scope', step: 3, is: 'a grouping: a pattern that gathers whatever is like it' },
  { open: '<', close: '>', name: 'capsule', step: 4, is: 'the concept: a channel a mind implements in its own literal space' }
]);
const LADDER_FORM = /^([\^.]?)\s*([{[(<])\s*([a-z][a-z0-9_]*)\s*([}\])>])(\.land)?(?:@([a-z][a-z0-9_]*))?\s*$/i;
/** @param {string} name @param {Rung} rung */
const onRung = (name, rung) => `${rung.open}${name}${rung.close}`;
/**
 * A name in one container: its step on the ladder, and the steps either side. With ^ or . in front, the move.
 * @param {string} src
 * @returns {null | { name: string, rung: Rung, up: Rung | null, down: Rung | null, moved: Rung | null, land: boolean, mind: string, says: string[] }}
 */
export function ladderOf(src) {
  const m = LADDER_FORM.exec(String(src || '').trim());
  if (!m) return null;
  const rung = LADDER.find((r) => r.open === m[2] && r.close === m[4]);
  if (!rung) return null;
  const name = m[3].toLowerCase();
  const up = LADDER[rung.step] || null;
  const down = LADDER[rung.step - 2] || null;
  const moved = m[1] === '^' ? up : m[1] === '.' ? down : null;
  const says = m[1]
    ? [moved ? `${m[1]}${onRung(name, rung)} moves ${name} one step ${m[1] === '^' ? 'up, toward the concept' : 'down, toward the thing'}: ${onRung(name, moved)}, ${moved.is}.` : `${onRung(name, rung)} is already the ${m[1] === '^' ? 'top' : 'foot'} of the ladder: ${rung.is}.`]
    : [`${onRung(name, rung)} is step ${rung.step} of 4: ${rung.is}.`, `One step up, ${up ? `${onRung(name, up)}, ${up.is}` : 'nothing: a concept is as far as a name goes'}. One step down, ${down ? `${onRung(name, down)}, ${down.is}` : 'nothing: the thing itself is where a name lands'}.`];
  return { name, rung, up, down, moved, land: Boolean(m[5]), mind: (m[6] || '').toLowerCase(), says };
}

/* ─── Minds: where a concept is consistently implemented ────────────────────
 * Concept spaces are written in < >, literal spaces in { }. A mind is where a concept is implemented, and it is the
 * same every time: Boof holds the concept <boon> as the literal space {bone}. That is her table, not a rule for
 * anyone else, and {boon} (the place itself) is boon.land for everyone, Boof included. Every other row is the
 * maker's to write; an unwritten row is said to be open, never guessed. Grounds are canon, quoted. */
/** @typedef {{ maps: Record<string, string>, grounds: string[] }} Mind */
/** @type {Readonly<Record<string, Mind>>} */
export const MINDS = Object.freeze({
  boof: {
    maps: { boon: 'bone' },
    grounds: [
      'The boneberry promises nothing and feeds you honestly (berries.json); a boonberry shows the way something will go well, a moment before it does.',
      'A dog keeps mornings, not weeks (Chapter Fourteen).',
      'She cannot read, and will not be told what a smell means (characters.mjs).',
      'A working dog: what is foreseen reaches her as a meal now.'
    ]
  }
});
export const LANDS = Object.freeze(['boon', 'bane', 'bone']);
const named = (/** @type {string} */ mind) => mind.charAt(0).toUpperCase() + mind.slice(1);

/**
 * Resolve a land written in a container, for a mind. { } is the place itself, for everyone. < > is the concept:
 * through a mind with a row for it, the literal space that mind holds it as; through a mind without one, open.
 * [ ] chooses among lands; ( ) groups (its reading for a land is open).
 * @param {string} src  e.g. "{boon}.land", "<boon>.land@boof", "@boof<boon>.land", "[boon, bane, bone].land"
 * @param {{ as?: string }} [opts]
 * @returns {{ kind: string, land: string, mind: string, resolved: string | null, open: boolean, says: string[] }}
 */
export function resolveLand(src, { as = '' } = {}) {
  let text = String(src || '').trim();
  let mind = String(as || '').toLowerCase();
  const prefix = /^@([a-z][a-z0-9_]*)\s*(?=[<{[(])/i.exec(text);
  if (prefix) { mind = mind || prefix[1].toLowerCase(); text = text.slice(prefix[0].length); }
  const choice = /^\[\s*([a-z_,\s]+)\]\.land$/i.exec(text);
  if (choice) {
    const lands = choice[1].split(/[,\s]+/).filter(Boolean).map((w) => w.toLowerCase());
    const unknown = lands.filter((l) => !LANDS.includes(l));
    return { kind: 'frame', land: lands.join(', '), mind, resolved: null, open: false, says: [`A frame of lands: ${lands.map((l) => `${l}.land`).join(', ')}, side by side, one to be chosen.${unknown.length ? ` ${unknown.join(', ')} ${unknown.length === 1 ? 'is' : 'are'} not a land in the canon (the three are boon, bane and bone).` : ''}`] };
  }
  const step = ladderOf(text);
  if (!step) return { kind: 'unread', land: '', mind, resolved: null, open: false, says: ['Not a land in a container: write {boon}.land, <boon>.land@boof, or [boon, bane, bone].land.'] };
  mind = mind || step.mind;
  const land = step.name;
  const known = LANDS.includes(land);
  const notLand = known ? '' : ` ${land} is ${['bonk', 'honk'].includes(land) ? 'in the valence pentad, but' : ''} not one of the three lands (boon, bane, bone).`.replace('  ', ' ');
  if (step.rung.name === 'body') return { kind: 'literal', land, mind, resolved: `{${land}}.land`, open: false, says: [`{${land}}.land is the place itself: ${land}.land, the same for everyone${mind ? `, ${mind} included` : ''}.${notLand}`] };
  if (step.rung.name === 'frame') return { kind: 'frame', land, mind, resolved: null, open: false, says: [`[${land}].land is ${land}.land chosen from among the lands: an instance in view, not yet the place.${notLand}`] };
  if (step.rung.name === 'scope') return { kind: 'scope', land, mind, resolved: null, open: true, says: [`(${land}).land would gather whatever is ${land}-like; what that means for a land is open, for the maker.${notLand}`] };
  // A capsule: the concept, implemented by a mind.
  if (!mind) return { kind: 'concept', land, mind, resolved: null, open: false, says: [`<${land}>.land is the concept of ${land}, not yet a place: a mind decides where it lands. Say whose: <${land}>.land@boof.${notLand}`] };
  const row = MINDS[mind];
  const place = row?.maps?.[land];
  if (!place) return { kind: 'concept', land, mind, resolved: null, open: true, says: [`${row ? `${named(mind)}'s table has no row for <${land}>` : `There is no table yet for ${named(mind)}`}: where the concept of ${land} lands in that mind is open, for the maker. Nothing is guessed.`] };
  return { kind: 'implemented', land, mind, resolved: `{${place}}.land`, open: false, says: [`<${land}>.land@${mind} is {${place}}.land: in ${named(mind)}'s mind the concept of ${land} is always implemented as the literal space of ${place}. That is ${named(mind)}'s table, not a rule for anyone else; {${land}}.land is still ${land}.land.`, ...row.grounds] };
}

/**
 * Read a mind's map stated as Spw: @boof{ <boon>{bone} }. With the parser, the tree is walked (@word{ … } reads as a
 * Reference whose body hangs on the Expression; a valence word in a container is an empty expression carrying a
 * modifier); without it, by hand. Returns null if it is not a map.
 * @param {string} src @param {{ parse?: Parse | null }} [opts]
 * @returns {null | { mind: string, concept: string, place: string, reader: string, agrees: boolean | null, says: string[] }}
 */
export function readMind(src, { parse = null } = {}) {
  const text = String(src || '').trim();
  let found = null;
  let reader = 'small';
  if (parse) {
    try {
      const r = parse(text, { lexProfile: 'prose' });
      const expr = (r.ast?.expression?.expressions || [])[0];
      const ref = expr?.terms?.[0];
      const inner = (expr?.body?.sequence?.expressions || [])[0];
      const cap = inner?.terms?.[0];
      /** @param {any} seq */
      const word = (seq) => {
        const e = (seq?.expressions || [])[0];
        return e?.modifiers?.modifiers?.[0]?.value || (e?.terms || []).find((/** @type {any} */ t) => t.type === 'Identifier')?.token?.value || '';
      };
      if (r.completeness?.complete && !r.completeness.proseFallback && ref?.type === 'Reference' && cap?.type === 'Capsule') {
        const concept = word(cap.interior);
        const place = word(inner?.body?.sequence);
        if (concept && place) { found = { mind: String(ref.raw || '').toLowerCase(), concept, place }; reader = 'spw-seed'; }
      }
    } catch { /* read by hand */ }
  }
  if (!found) {
    const m = /^@([a-z][a-z0-9_]*)\s*\{\s*<\s*([a-z_]+)\s*>\s*\{\s*([a-z_]+)\s*\}\s*\}$/i.exec(text);
    if (m) found = { mind: m[1].toLowerCase(), concept: m[2].toLowerCase(), place: m[3].toLowerCase() };
  }
  if (!found) return null;
  const kept = MINDS[found.mind]?.maps?.[found.concept];
  const agrees = kept ? kept === found.place : null;
  const says = agrees === true
    ? [`In ${named(found.mind)}'s mind the concept <${found.concept}> is implemented as the literal space {${found.place}}, every time. That is the table the canon gives.`, ...(MINDS[found.mind]?.grounds || [])]
    : agrees === false
      ? [`That is not how ${named(found.mind)} holds it: in that mind <${found.concept}> lands in {${kept}}. A mind's table is its own, and this one is kept as the canon gives it.`]
      : [`${named(found.mind)} holding <${found.concept}> as {${found.place}} is not in the canon. Where a concept lands in a mind is the maker's to say; this is read, not kept.`];
  return { ...found, reader, agrees, says };
}

/**
 * A board line kept into the pie game's record: view keys only, merged, nothing else touched. The hold's own choices
 * go first and the line's terms after, as the game itself applies a line (pie-game.mjs applyBoardView); "The story
 * folded away" is kept as the game keeps it (story off). Returns the new record.
 * @param {any} record  the parsed lore.pie.v1 record (or null)
 * @param {Record<string, import('../home/pie-frame.mjs').Choice>} view  from readBoardLine
 */
export function mergeBoard(record, view) {
  const out = record && typeof record === 'object' ? { ...record } : {};
  const next = { ...(out.view && typeof out.view === 'object' ? out.view : {}) };
  /** @param {string} key @param {import('../home/pie-frame.mjs').Choice} value */
  const put = (key, value) => {
    if (key === 'storyAt') { next.story = value !== 'off'; if (value !== 'off') next.storyAt = value; return; }
    next[key] = value;
  };
  const hold = view.hold && HOLDS[String(view.hold)];
  if (hold) Object.entries(hold.view).forEach(([k, v]) => put(k, v));
  Object.entries(view).forEach(([k, v]) => put(k, v));
  out.view = next;
  return out;
}

/* ─── The catalogue: every formula the land knows, grouped (.spw/surfaces/formulas.spw) ─── */
/** @typedef {{ group: string, form: string, says: string, theory: string, plays: string, castable: boolean, expect?: string | number }} Formula */
/** @type {ReadonlyArray<Formula>} */
export const FORMULAS = Object.freeze([
  { group: 'frames and bodies', form: '[lanes]{ world }', says: 'a frame around a body: what is seen, around what is there', theory: 'container roles: [] frame selects, {} body holds', plays: 'pie-frame.mjs: the board on any screen', castable: true },
  { group: 'frames and bodies', form: '^board{ @hold[two_thumbs] =frame[fill] %lanes[0.9] }', says: 'how a screen holds the lanes, one term per choice', theory: '@ whose hands, % how much, = what it is tuned to', plays: 'Setup › Layouts at /pie/; the desk keeps it for the game', castable: true, expect: 3 },
  { group: 'frames and bodies', form: '?{ haze } .{ ground }', says: 'a look, then what holds', theory: 'probe before ground', plays: 'the haze and ground of a filled screen', castable: true },
  { group: 'frames and bodies', form: '<pocket>{ }', says: 'a capsule with no inside: a passage, not a store', theory: '<> capsule as channel', plays: 'proposed: the slice that comes back to the plate (liminal-physics.spw)', castable: false },
  { group: 'leans and weights', form: '=lean{ %boon[2] %bane[1] %bone[1] }', says: 'a share of three genres', theory: '= config over % measures; valence', plays: 'pie-rules.spw =lean; the genre dial', castable: true, expect: 'boon' },
  { group: 'leans and weights', form: '=lean{ &fairy_tale{ %satisfied[1] %shared[1] } &absurd_reality{ %knocked[1] } &low_magic{ %perfect[1] } }', says: 'what a carry did, weighed into the three ways a chapter develops', theory: '& confluence of weighted events', plays: '.spw/runtime/pie-rules.spw', castable: true, expect: 'boon' },
  { group: 'leans and weights', form: '=[genre]{ boon:2 bone:1 }', says: 'read the book two parts fairy tale to one part low magic', theory: 'a lean as a blend', plays: 'the desk spell, live', castable: true },
  { group: 'edges and receipts', form: '=boon@porter{ @stranger }', says: 'a gain from the porter toward a stranger', theory: 'signed bias edge, forward', plays: 'grants.spw boon edges; readBias', castable: true, expect: 'forward' },
  { group: 'edges and receipts', form: '=bane@pie{ @mime }', says: 'a pull from the pie back toward the mimes', theory: 'signed bias edge, inverse: the price', plays: 'grants.spw bane edges; the lanes', castable: true, expect: 'inverse' },
  { group: 'edges and receipts', form: '~#answer(2026-11-10): "…"', says: 'a question closed on a day, kept rather than deleted', theory: 'a dated mark (P12)', plays: '.spw/state/grants.spw; spw:plans', castable: false },
  { group: 'counts and combinations', form: '*hand[3]{ %from[5] =ordered[no] =repeats[no] }', says: 'how many hands of three from five cards', theory: 'combinations: C(5, 3)', plays: 'competency.mjs hands(); the cards', castable: true, expect: 10 },
  { group: 'counts and combinations', form: '*hand[2]{ %from[boon, bane, bone] =ordered[yes] =repeats[no] }', says: 'every ordered pair of two different berries', theory: 'arrangements: 3!/(3-2)!', plays: 'the berries as cards', castable: true, expect: 6 },
  { group: 'counts and combinations', form: '*hand[2]{ %from[3] =ordered[no] =repeats[yes] }', says: 'pairs that may repeat, in any order', theory: 'multisets: C(3+2-1, 2)', plays: 'two berries from a full bush', castable: true, expect: 6 },
  { group: 'counts and combinations', form: '%[slice]{ 1/8 }', says: 'one eighth of the pie', theory: 'part and whole; a fraction as a measure', plays: 'the pie, cut', castable: true, expect: 0.125 },
  { group: 'counts and combinations', form: '@pupil{ %band[5] }', says: 'what a hand of cards can hold at band five, and how wide the cone of attention is', theory: 'the competency ladder (competency.spw)', plays: 'competency.mjs; the daily reading (daily.mjs)', castable: true, expect: 3 },
  { group: 'time and cadence', form: '^cadence[ %day{ #room } %week{ &trope } %month{ =lens } %quarter{ @cone } ]', says: 'a room a day, a trope a week, a lens a month, a cone a quarter', theory: 'nested measures; integration upward', plays: 'the daily reading (daily.mjs), read through an event route', castable: true },
  { group: 'time and cadence', form: '^way{ !aside[7, 9] =apart[two_pies] }', says: 'a way through the book: chapters set aside, a pair kept apart', theory: '! an event on the route, = a constraint', plays: 'way-through.mjs at the desk', castable: true, expect: 2 },
  { group: 'time and cadence', form: '{ }', says: 'gather, then spend', theory: 'left brace accumulates, right brace discharges', plays: 'proposed: a throw that winds up (liminal-physics.spw)', castable: true },
  { group: 'perspective', form: '&[ ^board{ @hold[two_thumbs] } ^way{ !aside[7] } ]', says: 'hands and route together', theory: '& confluence of two lines', plays: 'proposed: one link that carries both', castable: true, expect: 2 },
  { group: 'perspective', form: '?/texture.website/*folio-ampersand-hair-cube', says: 'a route: one piece of texture.website, a thing itself on the surface', theory: 'the ?/ door: a surface, @ whose, * a thing itself (texture-routes.mjs ROUTE_OPS)', plays: 'the desk opens it at /texture/', castable: true },
  { group: 'containers and perspective', form: '{boon}.land', says: 'the place itself: boon.land, the same for everyone', theory: 'a body is the literal space', plays: 'resolveLand; the desk', castable: true, expect: '{boon}.land' },
  { group: 'containers and perspective', form: '<boon>.land', says: 'the concept of boon, not yet a place', theory: 'a capsule is the concept; a mind decides where it lands', plays: 'resolveLand; the desk', castable: true },
  { group: 'containers and perspective', form: '<boon>.land@boof', says: 'the concept of boon, as Boof holds it: {bone}.land', theory: 'concept spaces in < >, literal spaces in { }; a mind is where a concept is consistently implemented', plays: 'resolveLand; the desk', castable: true, expect: '{bone}.land' },
  { group: 'containers and perspective', form: '@boof<boon>.land', says: 'the same, with the mind said first', theory: 'perspective before the capsule', plays: 'resolveLand; the desk', castable: true, expect: '{bone}.land' },
  { group: 'containers and perspective', form: '<bane>.land@boof', says: 'the concept of bane in Boof\u2019s mind: open, for the maker', theory: 'an unwritten row is open, never guessed', plays: 'resolveLand; the desk', castable: true, expect: 'open' },
  { group: 'containers and perspective', form: '[boon, bane, bone].land', says: 'the three lands side by side, one to be chosen', theory: 'a frame selects among instances', plays: 'resolveLand; the desk', castable: true },
  { group: 'containers and perspective', form: '(boon).land', says: 'whatever is boon-like, gathered: open for a land', theory: 'a scope groups', plays: 'resolveLand; the desk', castable: true, expect: 'open' },
  { group: 'containers and perspective', form: '@boof{ <boon>{bone} }', says: 'the map itself: in Boof\u2019s mind, the concept <boon> lands in the literal space {bone}', theory: 'a mind as a table from concept to place', plays: 'readMind; the desk', castable: true, expect: '{bone}' },
  { group: 'containers and perspective', form: '{boon}', says: 'step 1 of 4: the literal space', theory: 'the container ladder (body)', plays: 'ladderOf; the desk', castable: true, expect: 'body' },
  { group: 'containers and perspective', form: '[boon]', says: 'step 2 of 4: one chosen among several', theory: 'the container ladder (frame)', plays: 'ladderOf; the desk', castable: true, expect: 'frame' },
  { group: 'containers and perspective', form: '(boon)', says: 'step 3 of 4: a grouping', theory: 'the container ladder (scope)', plays: 'ladderOf; the desk', castable: true, expect: 'scope' },
  { group: 'containers and perspective', form: '<boon>', says: 'step 4 of 4: the concept', theory: 'the container ladder (capsule)', plays: 'ladderOf; the desk', castable: true, expect: 'capsule' },
  { group: 'containers and perspective', form: '^{boon}', says: 'boon bound one step up: [boon]', theory: '^ integration moves a name toward the concept', plays: 'ladderOf; the desk', castable: true, expect: 'frame' },
  { group: 'containers and perspective', form: '.(boon)', says: 'boon grounded one step down: [boon]', theory: '. ground moves a name toward the thing', plays: 'ladderOf; the desk', castable: true, expect: 'frame' },
  { group: 'containers and perspective', form: '.<boon>', says: 'meant: the concept grounded one step down, (boon); the parser drops the . before a capsule', theory: 'a finding: ground is tokenized only before [ and (', plays: 'ladderOf reads it by hand; spw-stress.spw', castable: true, expect: 'scope' },
  { group: 'perspective', form: '%{window}@genie', says: 'the reader’s window, as the Genie measures it', theory: 'a page as a room (P13)', plays: 'proposed: the Genie’s estimate (genie-practice.spw)', castable: false }
]);
