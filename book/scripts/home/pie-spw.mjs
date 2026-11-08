/**
 * pie-spw.mjs — the game's rules read by the real Spw parser, and the game as a stress test of Spw.
 *
 * The rules of the lanes live in .spw/runtime/pie-rules.spw: =tune{} (the values the game is tuned
 * by), !knocks{} (what each knock costs and says), *powers{} (every gift, with the references it
 * dispatches: ^card, !sound, @voice, and a quoted path to where the book has it). They are read
 * by the vendored spw-seed parser (the same grammar the canon is written in), lazily and off the
 * first paint; if it cannot be had, the game's own defaults and the small reader in pie-powers.mjs
 * carry on, and the read says which.
 *
 * Every read is measured, and the game keeps what it learns about the language:
 *   - the parse itself: success, completeness, prose fallback, warnings, gaps, time
 *   - the two readers compared: the real parser and the small reader build each power through the
 *     same buildPower(), so any difference between them is a difference in reading
 *   - round trips: each power written back out as Spw and read again must come back the same
 *   - fuzzing (on the bench): small mutations of the rules (a dropped brace, a swapped sigil, an
 *     unclosed string) and how the parser answers each one
 * stressReport() writes it all as a Spw block a workbench can take upstream.
 */
import { buildPower, readSpells, POWER_SPELLS } from './pie-powers.mjs?v=2026_11_08.J';

const RULES_URL = '/.spw/runtime/pie-rules.spw';
let parserPromise = null;
export const loadParser = () => {
  parserPromise = parserPromise || import('../vendor/spw-seed.mjs').catch(() => null);
  return parserPromise;
};

/* ─── Reading the tree ─────────────────────────────────────────────── */

const unquote = (s) => String(s ?? '').replace(/^"([\s\S]*)"$/, '$1');
function valueOf(param) {
  const v = param?.value;
  if (!v) return null;
  if (v.type === 'Literal') {
    const t = v.token;
    if (t?.type === 'NUMBER') return Number(t.value);
    if (t?.type === 'STRING') return unquote(t.value);
    return t?.value ?? null;
  }
  if (v.type === 'Expression') {
    const id = (v.terms || []).find((t) => t.type === 'Identifier');
    if (id) return id.token?.value ?? null;
    // A valence word (boon, bane, bone, bonk, honk) comes back as a modifier on an empty expression.
    const mod = v.modifiers?.modifiers?.[0]?.value;
    if (mod) { valueOf.valence = true; return mod; }
  }
  return null;
}
const argsOf = (frame) => (frame?.content || []).map(valueOf).filter((a) => a != null);

/**
 * The atoms of a body: one per term, whatever shape the parser gave it. Shapes it did not expect
 * are noted (quirks), so a change in the grammar shows up here before it shows up in play.
 */
function atomsOf(sequence, quirks, source) {
  const atoms = [];
  (sequence?.expressions || []).forEach((expr) => {
    (expr.terms || []).forEach((term) => {
      if (term.type === 'Operation') {
        // !honk: a valence word in label place is kept as a modifier, not a label.
        const mod = !term.operatorLabel && term.modifiers?.modifiers?.[0]?.value;
        if (mod) quirks.add(`a valence word in label place (${term.operator?.value}${mod}) is kept as a modifier, not a label`);
        valueOf.valence = false;
        const args = argsOf(term.frame);
        if (valueOf.valence) quirks.add('a valence word in a frame ([boon], [bone]) is an empty expression carrying a modifier');
        atoms.push({ sigil: term.operator?.value, word: term.operatorLabel?.value || mod || '', args, body: term.body?.sequence || null, span: term.span });
      } else if (term.type === 'PathRef') {
        atoms.push({ sigil: term.operator?.value || '~', path: unquote(term.path?.token?.value), span: term.span });
      } else if (term.type === 'Reference') {
        // @word[…]: the parser keeps the word as a Reference and hangs the frame on the expression.
        const word = term.raw || term.path?.map((p) => p.value).join('.') || '';
        valueOf.valence = false;
        const args = argsOf(expr.frame || term.frame);
        if (valueOf.valence) quirks.add('a valence word in a frame ([boon], [bone]) is an empty expression carrying a modifier');
        atoms.push({ sigil: '@', word, args, span: term.span });
        quirks.add('@word[…] reads as a Reference: the sigil is not kept on the node, and the frame hangs on the Expression, not the term');
      } else if (term.type === 'Prose' || term.type === 'ProseChunk') {
        quirks.add(`prose inside a body: “${String(source || '').slice(term.span?.start?.offset ?? 0, (term.span?.start?.offset ?? 0) + 30)}…”`);
      } else {
        const at = term.span?.start?.offset ?? 0;
        quirks.add(`an unread term shape: ${term.type} at “${String(source || '').slice(at, at + 24).replace(/\s+/g, ' ')}”`);
      }
    });
  });
  return atoms;
}

const topOperations = (ast) => (ast?.expression?.expressions || ast?.expressions || []).flatMap((e) => e.terms || []).filter((t) => t.type === 'Operation');
const sliceOf = (source, span) => (span?.start && span?.end ? source.slice(span.start.offset, span.end.offset) : '');

/** Rules from a parse: tune, knocks, powers (each with its own source text), and what was odd. */
function rulesFromTree(ast, source) {
  const quirks = new Set();
  const rules = { tune: {}, knocks: {}, powers: {}, spells: {}, knockSpells: {}, lean: {}, whimsy: {}, scenes: {}, errors: [] };
  topOperations(ast).forEach((op) => {
    const label = op.operatorLabel?.value;
    const read = ['tune', 'knocks', 'powers', 'lean', 'whimsy', 'scenes'].includes(label);
    const children = read ? atomsOf(op.body?.sequence, quirks, source) : [];
    if (op.operator?.value === '=' && label === 'tune') {
      children.forEach((a) => { if (a.sigil === '=' && Number.isFinite(Number(a.args[0]))) rules.tune[a.word] = Number(a.args[0]); });
    } else if (op.operator?.value === '=' && label === 'lean') {
      // The three ways a chapter develops, named for their genres (the valence words are reserved):
      // &fairy_tale{ %satisfied[1] … } &absurd_reality{ … } &low_magic{ … }
      const WAYS = { fairy_tale: 'boon', absurd_reality: 'bane', low_magic: 'bone' };
      children.filter((a) => a.sigil === '&' && WAYS[a.word] && a.body).forEach((way) => {
        atomsOf(way.body, quirks, source).forEach((a) => {
          if (a.sigil === '%' && a.word && Number.isFinite(Number(a.args[0]))) rules.lean[a.word] = [WAYS[way.word], Math.max(0, Math.min(3, Number(a.args[0])))];
          else rules.errors.push(`=lean &${way.word}: ${a.sigil}${a.word || ''} is not a weight (use %event[n]).`);
        });
      });
    } else if (label === 'whimsy') {
      // How an impact looks and sounds, by sprite: *kind{ #pop["BONK!", …] *bits[crumbs] !sound[knock] %drama[1] }
      const BITS = ['juice', 'crumbs', 'feathers', 'glass', 'confetti', 'stars', 'flour', 'none'];
      children.filter((a) => a.sigil === '*' && a.body).forEach((k) => {
        const w = {};
        atomsOf(k.body, quirks, source).forEach((a) => {
          if (a.sigil === '#' && a.word === 'pop') w.pops = a.args.map((x) => String(x).slice(0, 18)).filter(Boolean).slice(0, 8);
          else if (a.sigil === '*' && a.word === 'bits' && BITS.includes(String(a.args[0]))) w.bits = String(a.args[0]);
          else if (a.sigil === '!' && a.word === 'sound') w.sound = String(a.args[0] || '');
          else if (a.sigil === '%' && a.word === 'drama' && Number.isFinite(Number(a.args[0]))) w.drama = Math.max(0, Math.min(3, Number(a.args[0])));
          else rules.errors.push(`!whimsy *${k.word}: ${a.sigil}${a.word || ''} is not a whimsy the lanes know.`);
        });
        rules.whimsy[k.word] = w;
      });
    } else if (label === 'scenes') {
      // Each place's own drama and texture: *field{ $frost %drama[0.9] }
      const MATERIALS = ['glass', 'flour', 'berry', 'frost', 'ink', 'brass', 'steam', 'oak'];
      children.filter((a) => a.sigil === '*' && a.body).forEach((k) => {
        const w = {};
        atomsOf(k.body, quirks, source).forEach((a) => {
          if (a.sigil === '$' && MATERIALS.includes(a.word)) w.material = a.word;
          else if (a.sigil === '%' && a.word === 'drama' && Number.isFinite(Number(a.args[0]))) w.drama = Math.max(0, Math.min(3, Number(a.args[0])));
          else rules.errors.push(`!scenes *${k.word}: ${a.sigil}${a.word || ''} is not a scene word the lanes know.`);
        });
        rules.scenes[k.word] = w;
      });
    } else if (label === 'knocks') {
      children.filter((a) => a.sigil === '*' && a.body).forEach((k) => {
        const knock = {};
        atomsOf(k.body, quirks, source).forEach((a) => {
          if (a.sigil === '%' && ['tilt', 'crust', 'filling'].includes(a.word)) knock[a.word] = Math.max(0, Math.min(1.2, Number(a.args[0]) || 0));
          else if (a.sigil === '!' && ['drop', 'tax', 'shove'].includes(a.word)) knock[a.word] = true;
          else if (a.sigil === '#' && a.word === 'says') knock.label = String(a.args[0] || '').toUpperCase().slice(0, 32);
          else rules.errors.push(`!knocks *${k.word}: ${a.sigil}${a.word || ''} is not a word the lanes know.`);
        });
        rules.knocks[k.word] = knock;
        rules.knockSpells[k.word] = sliceOf(source, k.span).trim();
      });
    } else if (label === 'powers') {
      children.filter((a) => a.sigil === '*' && a.body).forEach((p) => {
        const built = buildPower(p.word, atomsOf(p.body, quirks, source));
        rules.powers[built.power.id] = built.power;
        rules.spells[built.power.id] = sliceOf(source, p.span).trim();
        rules.errors.push(...built.errors);
      });
    } else if (op.operator?.value === '*' && op.body) {
      // A bare power at the top (a visit's spell): *name{ … }.
      const built = buildPower(label, atomsOf(op.body.sequence, quirks, source));
      rules.powers[built.power.id] = built.power;
      rules.spells[built.power.id] = sliceOf(source, op.span).trim();
      rules.errors.push(...built.errors);
    }
  });
  rules.quirks = [...quirks];
  return rules;
}

/* ─── A read, measured ─────────────────────────────────────────────── */

/** Read Spw rules with the real parser. Falls back to the small reader (powers only) if it cannot. */
export async function readRules(source) {
  const text = String(source || '');
  const parser = await loadParser();
  if (!parser?.parse) {
    const small = readSpells(text);
    return { reader: 'small', tune: {}, knocks: {}, powers: small.powers, spells: {}, errors: small.errors, quirks: [], stats: null };
  }
  const t0 = performance.now();
  const result = parser.parse(text, { lexProfile: 'prose' });
  const ms = performance.now() - t0;
  const stats = {
    success: Boolean(result.success),
    complete: Boolean(result.completeness?.complete),
    proseFallback: Boolean(result.completeness?.proseFallback),
    errors: (result.errors || []).length,
    warnings: (result.warnings || []).length,
    gaps: (result.gaps || []).length,
    ms: Math.round(ms * 10) / 10,
    bytes: text.length
  };
  if (!stats.complete || stats.proseFallback) {
    const small = readSpells(text);
    return { reader: 'small', tune: {}, knocks: {}, powers: small.powers, spells: {}, errors: [`The parser did not read it whole (${stats.proseFallback ? 'it fell back to prose' : 'incomplete'}); the small reader read what it could.`, ...small.errors], quirks: [], stats };
  }
  const rules = rulesFromTree(result.ast, text);
  return { reader: 'spw-seed', ...rules, stats };
}

/* ─── The stress test ──────────────────────────────────────────────── */

const sorted = (o) => Object.fromEntries(Object.entries(o || {}).sort(([a], [b]) => a.localeCompare(b)));
const powerKey = (p) => JSON.stringify({ t: sorted(p.timed), a: sorted(p.amounts), c: sorted(p.charges), x: [...p.acts].sort(), w: [...p.with].sort(), o: [...p.without].sort(), s: p.says, r: sorted(p.refs) });

/** A power written back out as Spw (for round trips, and for the bench). */
export function writePower(p) {
  const parts = [
    ...Object.entries(p.timed).map(([k, v]) => `~${k}[${v}]`),
    ...Object.entries(p.amounts).map(([k, v]) => `%${k}[${v}]`),
    ...Object.entries(p.charges).map(([k, v]) => `*${k}[${v}]`),
    ...p.acts.map((k) => `!${k}`),
    ...p.with.map((k) => `&with[${k}]`),
    ...p.without.map((k) => `&without[${k}]`),
    p.refs.card && `^card[${p.refs.card}]`,
    p.refs.sound && `!sound[${p.refs.sound}]`,
    p.refs.voice && `@voice[${p.refs.voice}]`,
    p.refs.path && `~"${p.refs.path}"`,
    p.says && `#says["${p.says.replace(/"/g, "'")}"]`
  ].filter(Boolean);
  return `*${p.id}{ ${parts.join(' ')} }`;
}

/** Compare the two readers and round-trip every power. Returns findings, each one line. */
export async function crossRead(rules) {
  const findings = [];
  for (const [id, spell] of Object.entries(rules.spells || {})) {
    const small = readSpells(spell).powers[id];
    const real = rules.powers[id];
    if (!small) findings.push(`*${id}: the small reader found nothing the parser read`);
    else if (powerKey(small) !== powerKey(real)) findings.push(`*${id}: the two readers disagree`);
    const again = await readRules(writePower(real));
    if (!again.powers[id] || powerKey(again.powers[id]) !== powerKey(real)) findings.push(`*${id}: did not survive a round trip through Spw`);
  }
  return findings;
}

const MUTATIONS = [
  ['drop a closing brace', (s, i) => { const at = s.indexOf('}', i); return at < 0 ? s : s.slice(0, at) + s.slice(at + 1); }],
  ['drop an opening bracket', (s, i) => { const at = s.indexOf('[', i); return at < 0 ? s : s.slice(0, at) + s.slice(at + 1); }],
  ['unclose a string', (s, i) => { const at = s.indexOf('"]', i); return at < 0 ? s : s.slice(0, at) + s.slice(at + 1); }],
  ['swap a sigil for another', (s, i) => { const at = s.slice(i).search(/[~%!&^]/); if (at < 0) return s; const k = i + at; return s.slice(0, k) + '?' + s.slice(k + 1); }],
  ['double an operator', (s, i) => { const at = s.slice(i).search(/[~%!]/); if (at < 0) return s; const k = i + at; return s.slice(0, k) + s[k] + s.slice(k); }],
  ['a number with two points', (s, i) => { const m = /\d\.\d+/.exec(s.slice(i)); if (!m) return s; const k = i + m.index + m[0].length; return s.slice(0, k) + '.5' + s.slice(k); }],
  ['an emoji in a label', (s, i) => { const m = /\*[a-z_]+\{/.exec(s.slice(i)); if (!m) return s; const k = i + m.index + 2; return s.slice(0, k) + '🥧' + s.slice(k); }],
  ['a stray apostrophe in prose', (s, i) => { const at = s.indexOf('#says["', i); return at < 0 ? s : s.slice(0, at + 7) + "it's " + s.slice(at + 7); }]
];

/** Mutate a spell a few ways and note how the parser answers each. */
export async function fuzz(source, rounds = 8) {
  const parser = await loadParser();
  if (!parser?.parse) return [];
  const out = [];
  for (let n = 0; n < rounds; n += 1) {
    const [name, mutate] = MUTATIONS[n % MUTATIONS.length];
    const from = Math.floor(Math.random() * Math.max(1, source.length * 0.8));
    const text = mutate(source, from);
    if (text === source) continue;
    await new Promise((resolve) => setTimeout(resolve, 0));   // let the page breathe between reads
    const t0 = performance.now();
    const r = parser.parse(text, { lexProfile: 'prose' });
    out.push({
      name,
      ms: Math.round((performance.now() - t0) * 10) / 10,
      success: Boolean(r.success),
      complete: Boolean(r.completeness?.complete),
      proseFallback: Boolean(r.completeness?.proseFallback),
      errors: (r.errors || []).length,
      warnings: (r.warnings || []).length,
      // The parser says success while it gave up on structure: a consumer must check completeness.
      quiet: Boolean(r.success) && !(r.errors || []).length && (!r.completeness?.complete || r.completeness?.proseFallback)
    });
  }
  return out;
}

/** Everything learned, as a Spw block for a workbench. */
export function stressReport({ read, crossFindings = [], fuzzed = [] }) {
  const s = read?.stats;
  const lines = ['?stress[exactly_one_pie]{', `  .reader[${read?.reader || 'none'}]`];
  if (s) lines.push(`  %parse{ ms: ${s.ms} bytes: ${s.bytes} success: ${s.success} complete: ${s.complete} prose_fallback: ${s.proseFallback} errors: ${s.errors} warnings: ${s.warnings} gaps: ${s.gaps} }`);
  (read?.quirks || []).forEach((q) => lines.push(`  #quirk["${q.replace(/"/g, "'")}"]`));
  crossFindings.forEach((f) => lines.push(`  #cross["${f.replace(/"/g, "'")}"]`));
  fuzzed.forEach((f) => lines.push(`  ~fuzz[${f.name.replace(/[^a-z ]/gi, '').replace(/ /g, '_')}]{ ms: ${f.ms} success: ${f.success} complete: ${f.complete} prose_fallback: ${f.proseFallback} errors: ${f.errors} warnings: ${f.warnings}${f.quiet ? ' !quiet' : ''} }`));
  lines.push('}');
  return lines.join('\n');
}

/** The book's own rules, fetched and read; the built-in spells if the file cannot be had. */
export async function loadRules() {
  try {
    const res = await fetch(RULES_URL);
    if (!res.ok) throw new Error(String(res.status));
    const source = await res.text();
    const read = await readRules(source);
    return { ...read, source };
  } catch {
    const small = readSpells(Object.values(POWER_SPELLS).join('\n'));
    return { reader: 'built-in', tune: {}, knocks: {}, powers: small.powers, spells: { ...POWER_SPELLS }, errors: [], quirks: [], stats: null, source: '' };
  }
}
