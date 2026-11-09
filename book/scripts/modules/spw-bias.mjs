/**
 * spw-bias.mjs — Spw spells that lean how the land answers (the bias layer, .spw/surfaces/layers.spw).
 *
 * A reader casts a meme register as a bias edge, after the workbench's bias product
 * (.spw/_workbench/.spw/registries/bias-product.spw: = + body is { anchor, axis, targets, sign }):
 *
 *   =meme[pov]{ }                                one house register, every slot it has words for
 *   =meme[core_memory]{ pop.perfect toast %often[0.8] }   targeted: these slots, this often
 *   =meme@boof[pov]{ toast }                     anchored: the lines are about Boof ({who})
 *   =bane[pov]{ pop }                            signed: every slot it has words for but pops
 *   =meme[pov]{ toast } =meme[plot_twist]{ spill }   a combination; the later one is asked first
 *
 * The frame is the register (the edge's axis), the body ranks the response slots it leans on,
 * %often is the chance a line replaces the plain answer (0.5 when unsaid). In a link,
 * ?bias=pov or ?bias=pov+plot_twist is shorthand, and ?bias=off lets the visit's bias go.
 *
 * Biased lines are for responses only (game pops, captions, toasts, tags, receipts), never for
 * story prose: biased() refuses any slot outside RESPONSE_FAMILIES. Lines are plain text; render
 * them with textContent. With no bias active, biased() returns its fallback at once.
 *
 * One house register for a visit is free (the language is free). A combination of several, a
 * register of your own, keeping or syncing them and sharing them with a table is the premium
 * plan, open to everyone as a trial for now: nothing here checks for payment or locks anything.
 *
 * State: the visit's bias lives in sessionStorage (lore.bias.visit), never saved as the reader's
 * own. The registers are read once from /.spw/runtime/bias.spw by a small line reader; the
 * vendored spw-seed parser, when something has loaded it (warmBiasParser), reads spells too.
 */

export const BIAS_EVENT = 'lore:bias';
export const RESPONSE_FAMILIES = Object.freeze(['pop', 'toast', 'tag', 'spill', 'reveal', 'points', 'settle']);

const VISIT_KEY = 'lore.bias.visit';
const SWITCHES_KEY = 'lore.switches.v1';
const REGISTERS_URL = '/.spw/runtime/bias.spw';
const DEFAULT_OFTEN = 0.5;
const MAX_LAYERS = 8;
const MAX_TEXT = 600;
const VALENCE = new Set(['boon', 'bane', 'bone', 'bonk', 'honk']);
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const ID = /^[a-z][a-z0-9_]*$/;
const SLOT = /^[a-z]+(?:\.[a-z]+)?$/;

let registers = null;   // { id: { title, line, cast, palette, material, sigil, slots: { slot: [lines] } } }
let anchors = null;     // { id: name }
let loading = null;
let seed = null;        // the vendored parser module, once warmBiasParser() has it
let active;             // undefined: not read yet · null: none · { expr, layers, combination, from }

/* ─── Storage (all optional: private mode keeps the bias for this page) ─── */

const session = () => {
  try { return typeof sessionStorage === 'undefined' ? null : sessionStorage; } catch { return null; }
};
const readVisit = () => {
  try { return JSON.parse(session()?.getItem(VISIT_KEY) || 'null'); } catch { return null; }
};
const writeVisit = (value) => {
  try { session()?.setItem(VISIT_KEY, JSON.stringify(value)); } catch { /* the page keeps it */ }
};
const switchStoredOn = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(SWITCHES_KEY) || 'null');
    return (stored?.choices?.bias || stored?.resolved?.bias) === 'on';
  } catch {
    return false;
  }
};

function dispatch(from) {
  if (typeof window === 'undefined' || typeof CustomEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(BIAS_EVENT, { detail: { bias: active || null, from } }));
}

/* ─── The registers: a small line reader for bias.spw ─────────────────── */

const STRINGS = /"((?:[^"\\]|\\.)*)"/g;
const unescape = (s) => s.replace(/\\(.)/g, '$1');

/** Read bias.spw's text into registers and anchors. Pure; exported for checks. */
export function readRegisters(text) {
  const out = {};
  const names = {};
  let block = '';
  let current = null;
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line || line.startsWith('# ') || line === '#') return;
    const open = /^([*^#~!&]?)([a-z_]+)\{$/.exec(line);
    if (!block && open) { block = open[2]; return; }
    if (block === 'registers') {
      const reg = /^\*([a-z][a-z0-9_]*)\{$/.exec(line);
      if (reg) { current = out[reg[1]] = { id: reg[1], title: reg[1], line: '', cast: '', palette: '', material: '', sigil: '', slots: {} }; return; }
      if (line === '}') { if (current) current = null; else block = ''; return; }
      if (!current) return;
      for (const atom of line.matchAll(/#([a-z]+(?:\.[a-z]+)?)\[((?:\s*"(?:[^"\\]|\\.)*"\s*,?)*)\]/g)) {
        const lines = [...atom[2].matchAll(STRINGS)].map((m) => unescape(m[1])).filter(Boolean);
        if (['title', 'line', 'cast'].includes(atom[1])) current[atom[1]] = lines[0] || current[atom[1]];
        else if (RESPONSE_FAMILIES.includes(atom[1].split('.')[0])) current.slots[atom[1]] = lines;
      }
      const bare = line.replace(STRINGS, '""');
      current.palette = /=palette\[([a-z0-9-]+)\]/.exec(bare)?.[1] || current.palette;
      current.material = /\$([a-z]+)\b/.exec(bare)?.[1] || current.material;
      current.sigil = /\.sigil\["(.)"\]/.exec(line)?.[1] || current.sigil;
      return;
    }
    if (line === '}') { block = ''; return; }
    if (block === 'anchors') {
      const pair = /^([a-z][a-z0-9_]*):\s*"([^"]*)"$/.exec(line);
      if (pair) names[pair[1]] = pair[2];
    }
  });
  return { registers: out, anchors: names };
}

/** Fetch and read /.spw/runtime/bias.spw once. Resolves { registers, anchors }. */
export function loadRegisters() {
  if (registers) return Promise.resolve({ registers, anchors });
  if (!loading) {
    const get = typeof fetch === 'function' ? fetch(REGISTERS_URL).then((res) => (res.ok ? res.text() : '')) : Promise.resolve('');
    loading = get.catch(() => '').then((text) => {
      const read = readRegisters(text);
      if (Object.keys(read.registers).length) {
        registers = read.registers;
        anchors = read.anchors;
        // A bias read before the registers came is read again, now that names can be checked.
        if (active) {
          const again = readBias(active.source || active.expr);
          active = again.ok ? { expr: again.expr, source: active.source, layers: again.layers, combination: again.combination, from: active.from } : null;
          dispatch(active?.from || 'registers');
        }
      } else {
        loading = null;   // nothing read: the next call tries again
      }
      return { registers: registers || {}, anchors: anchors || {} };
    });
  }
  return loading;
}

/** Let readBias use the real parser too (lazily; shares the instance pie-spw.mjs loads). */
export function warmBiasParser() {
  return import('../vendor/spw-seed.mjs').then((mod) => { seed = mod; return true; }).catch(() => false);
}

/* ─── Reading spells ──────────────────────────────────────────────────── */

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/** ?bias=pov+plot_twist (or pov:0.8) → =meme[pov]{ } =meme[plot_twist]{ }. */
function expand(text) {
  const raw = String(text ?? '').trim().slice(0, MAX_TEXT);
  if (!raw || /[={]/.test(raw)) return raw;
  return raw.toLowerCase().split(/[\s,+]+/).filter(Boolean).map((part) => {
    const [id, often] = part.split(':');
    const n = Number(often);
    return ID.test(id) ? `=meme[${id}]{ ${often != null && Number.isFinite(n) ? `%often[${n}] ` : ''}}` : `=meme[${part.replace(/[^a-z0-9_]/gi, '')}]{ }`;
  }).join(' ');
}

/** The small reader: the bias edges in a text, in the same shape the parser's readBias gives. */
function edgesBySmall(expr, notes) {
  const edges = [];
  const SPELL = /=([a-z][a-z0-9_]*)?(@[a-z][a-z0-9_]*)?(?:\s+(boon|bane|bone))?(?:\[\s*([a-z][a-z0-9_]*)\s*\])?(@[a-z][a-z0-9_]*)?\s*\{([^{}]*)\}/g;
  for (const m of expr.matchAll(SPELL)) {
    let [, label, anchor, val, axis, late, body] = m;
    const valence = [];
    if (val) valence.push(val);
    if (label && VALENCE.has(label)) { valence.push(label); label = undefined; }
    if (late) { notes.push('Write the @anchor before the frame (=meme@boof[pov]{ … }); after it, the body no longer belongs to the spell.'); continue; }
    const targets = [];
    let often = null;
    let literal = false;
    body.replace(/%often\[\s*(-?\d*\.?\d+)\s*\]/g, (_, n) => { often = Number(n); return ''; })
      .replace(/"(?:[^"\\]|\\.)*"/g, () => { literal = true; return ''; })
      .split(/[\s,]+/).filter(Boolean).forEach((word) => {
        if (/^@?[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/.test(word)) targets.push(word.replace(/^@/, ''));
      });
    edges.push({ label, anchor: anchor?.slice(1), axis, targets, valence, often, literal });
  }
  return edges;
}

/** The real parser, when it has been loaded: parse(), then the workbench's own readBias() per edge. */
function edgesBySeed(expr, notes) {
  let parsed;
  try { parsed = seed.parse(expr, { lexProfile: 'prose' }); } catch { return null; }
  if (!parsed?.completeness?.complete) return null;
  const edges = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === 'Operation' && node.operator?.value === '=') {
      if (!node.body) {
        if (/\]\s*@/.test(expr)) notes.push('Write the @anchor before the frame (=meme@boof[pov]{ … }); after it, the body no longer belongs to the spell.');
      } else {
        const edge = seed.readBias(node);
        if (edge) {
          let often = null;
          (node.body.sequence?.expressions || []).forEach((e) => (e.terms || []).forEach((term) => {
            if (term.type === 'Operation' && term.operator?.value === '%' && term.operatorLabel?.value === 'often') {
              const value = term.frame?.content?.[0]?.value?.token?.value;
              if (value != null) often = Number(value);
            }
          }));
          edges.push({
            label: node.operatorLabel?.value,
            anchor: edge.anchor?.value,
            axis: edge.axis,
            targets: edge.targets.filter((t) => t.kind === 'name' || t.kind === 'ref').map((t) => t.value),
            valence: edge.valence || [],
            often,
            literal: edge.targets.some((t) => t.kind === 'literal')
          });
        }
        return;   // a bias edge's body is read as its targets, not walked for more edges
      }
    }
    Object.keys(node).forEach((key) => { if (key !== 'parent' && key !== 'span') walk(node[key]); });
  };
  walk(parsed.ast);
  return edges;
}

/** An edge read by either reader → a layer, or null with a note saying why. */
function toLayer(edge, notes) {
  const named = edge.label && edge.label !== 'meme';
  if (named && (edge.axis || !registers?.[edge.label])) {
    // =tune{ … }, =palette[pool]{ … }: a lean for another reader (the verb lives in its consumer).
    notes.push(`=${edge.label} leans for another reader, not a meme register; it is left for that reader.`);
    return null;
  }
  const register = edge.axis || (named ? edge.label : '');
  if (!register || !ID.test(register)) { notes.push('A meme spell names its register in the frame: =meme[pov]{ }.'); return null; }
  if (registers && !registers[register]) {
    notes.push(`No house register is called ${register}. Registers of your own are the premium plan, not open yet.`);
    return null;
  }
  if (edge.literal) notes.push('Lines written into a spell are the premium plan (registers of your own), not open yet; the house lines answer instead.');
  const targets = [];
  edge.targets.forEach((target) => {
    const family = target.split('.')[0];
    if (SLOT.test(target) && RESPONSE_FAMILIES.includes(family)) {
      if (!targets.includes(target)) targets.push(target);
    } else {
      notes.push(`${target} is not an answer a register can give; story prose is never biased.`);
    }
  });
  if (edge.targets.length && !targets.length) return null;   // it leaned only on what it may not touch
  let anchor = edge.anchor && ID.test(edge.anchor) ? edge.anchor : undefined;
  if (anchor && anchors && !anchors[anchor]) {
    notes.push(`${anchor} is not someone a register may be about; the lines keep their own who.`);
    anchor = undefined;
  }
  const often = Number.isFinite(edge.often) ? clamp01(edge.often) : DEFAULT_OFTEN;
  const layer = { register, targets, often, sign: edge.valence.includes('bane') ? 'inverse' : 'forward' };
  if (anchor) layer.anchor = anchor;
  return layer;
}

/** Layers written back out as a spell. */
export function writeBias(layers = []) {
  return layers.map((layer) => {
    const head = `=${layer.sign === 'inverse' ? 'bane' : 'meme'}${layer.anchor ? `@${layer.anchor}` : ''}[${layer.register}]`;
    const body = [...layer.targets, layer.often !== DEFAULT_OFTEN ? `%often[${Number(layer.often.toFixed(2))}]` : ''].filter(Boolean).join(' ');
    return `${head}{ ${body}${body ? ' ' : ''}}`;
  }).join(' ');
}

/**
 * Read one or more bias spells.
 * → { ok, layers: [{ register, targets, often, sign, anchor? }], combination, notes, expr, reader }
 */
export function readBias(text) {
  const notes = [];
  const source = expand(text);
  if (!source) return { ok: false, layers: [], combination: false, notes: ['No spell to read.'], expr: '', reader: 'none' };
  let reader = 'small';
  let edges = null;
  if (seed) {
    edges = edgesBySeed(source, notes);
    if (edges) reader = 'spw-seed';
    else notes.push('The parser did not read this whole; the small reader read what it could.');
  }
  if (!edges) edges = edgesBySmall(source, notes);
  let layers = edges.map((edge) => toLayer(edge, notes)).filter(Boolean);
  if (layers.length > MAX_LAYERS) {
    notes.push(`Only ${NUMBER_WORDS[MAX_LAYERS]} registers can lean at once; the last ${NUMBER_WORDS[MAX_LAYERS]} are kept.`);
    layers = layers.slice(-MAX_LAYERS);
  }
  if (!edges.length) notes.push('No bias spell here. A register is cast like =meme[pov]{ }.');
  return { ok: layers.length > 0, layers, combination: layers.length > 1, notes: [...new Set(notes)], expr: writeBias(layers), source, reader };
}

/* ─── The visit's bias ───────────────────────────────────────────────── */

/** The visit's bias: { expr, layers, combination } or null. */
export function activeBias() {
  if (active === undefined) {
    const stored = readVisit();
    active = null;
    if (stored?.expr) {
      const read = readBias(stored.source || stored.expr);
      if (read.ok) active = { expr: read.expr, source: stored.source || stored.expr, layers: read.layers, combination: read.combination, from: stored.from || 'visit' };
    }
    if (active && !registers) loadRegisters();
  }
  return active ? { expr: active.expr, layers: active.layers, combination: active.combination, from: active.from } : null;
}

/** Make a spell the visit's bias (null, '' or "off" lets it go). Returns the readBias result. */
export function setBias(text, { from = 'reader' } = {}) {
  activeBias();
  if (text == null || /^\s*(off|none|plain|mine)?\s*$/i.test(String(text))) {
    const had = Boolean(active);
    active = null;
    writeVisit({ expr: '', from });   // an explicit let-go: the switch's register stays away for the visit
    if (had) dispatch(from);
    return { ok: true, layers: [], combination: false, notes: ['Every answer is plain again for this visit.'], expr: '', reader: 'none' };
  }
  const result = readBias(text);
  if (!result.ok) return result;   // a spell that leans on nothing leaves the visit's bias as it was
  const changed = result.expr !== active?.expr;
  active = { expr: result.expr, source: result.source, layers: result.layers, combination: result.combination, from };
  writeVisit({ expr: result.expr, source: result.source, from });
  if (!registers) loadRegisters();
  if (changed) dispatch(from);
  return result;
}

const hash = (text) => {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
};

/** The house register of the day: the same for everyone, from the order of bias.spw. */
export function houseRegisterOfTheDay(regs = registers || {}, date = new Date()) {
  const ids = Object.keys(regs);
  if (!ids.length) return '';
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return ids[hash(`bias:${day}`) % ids.length];
}

/**
 * Cast the house register of the day (what the trial switch turns on). With from 'switch' it
 * steps aside for anything the visit already has, a let-go included; a reader's own turn casts.
 */
export async function castHouseRegister({ from = 'switch' } = {}) {
  const { registers: regs } = await loadRegisters();
  const id = houseRegisterOfTheDay(regs);
  if (!id) return null;
  if (from === 'switch' && readVisit()) return null;
  return setBias(`=meme[${id}]{ }`, { from });
}

/**
 * ?bias=<spell or ids> sets the visit's bias; ?bias=off lets it go. With no link and nothing
 * for this visit yet, a reader whose trial switch is on gets the house register of the day.
 */
export function initBiasFromURL(href = typeof location !== 'undefined' ? location.href : '') {
  let raw = null;
  try {
    const url = new URL(href);
    if (url.searchParams.has('bias')) raw = url.searchParams.get('bias');
  } catch { /* no address, no link */ }
  if (raw != null) return setBias(raw, { from: 'link' });
  const current = activeBias();
  if (!current && !readVisit() && switchStoredOn()) castHouseRegister({ from: 'switch' });
  return current ? { ok: true, ...current, notes: [], reader: 'visit' } : null;
}

/** A link that casts this bias for whoever opens it (plain registers travel as ?bias=pov+plot_twist). */
export function biasLink(text, href = typeof location !== 'undefined' ? location.href : 'https://lore.land/pie/') {
  const read = typeof text === 'string' ? readBias(text) : { ok: Boolean(text?.layers?.length), layers: text?.layers || [] };
  const url = new URL(href);
  if (!read.ok) { url.searchParams.delete('bias'); return url.toString(); }
  const plain = read.layers.every((l) => !l.targets.length && l.often === DEFAULT_OFTEN && l.sign === 'forward' && !l.anchor);
  url.searchParams.set('bias', plain ? read.layers.map((l) => l.register).join(' ') : writeBias(read.layers));
  return url.toString();
}

/* ─── Answering ──────────────────────────────────────────────────────── */

const leans = (layer, slot) => {
  if (!layer.targets.length) return true;
  const hit = layer.targets.some((target) => slot === target || slot.startsWith(`${target}.`));
  return layer.sign === 'inverse' ? !hit : hit;
};

const fillable = (line, fill) => [...line.matchAll(/\{(who|what|where)\}/g)].every((m) => fill[m[1]]);

/**
 * A line for this response slot from the visit's bias, or the fallback. Later layers are asked
 * first; each answers with its %often chance. ctx: { who, what, where, seed } (seed: a number
 * for a deterministic answer). Only response slots (RESPONSE_FAMILIES) are ever biased.
 */
export function biased(slot, fallback, ctx = {}) {
  if (!active && active !== undefined) return fallback;
  const bias = active === undefined ? activeBias() : active;
  if (!bias || !registers || typeof slot !== 'string' || !RESPONSE_FAMILIES.includes(slot.split('.')[0])) return fallback;
  const family = slot.split('.')[0];
  for (let i = bias.layers.length - 1; i >= 0; i -= 1) {
    const layer = bias.layers[i];
    const register = registers[layer.register];
    if (!register || !leans(layer, slot)) continue;
    const lines = register.slots[slot] || register.slots[family] || [];
    const fill = { who: (layer.anchor && anchors?.[layer.anchor]) || ctx.who, what: ctx.what, where: ctx.where };
    const usable = lines.filter((line) => fillable(line, fill));
    if (!usable.length) continue;
    const seeded = Number.isFinite(ctx.seed);
    const roll = seeded ? (hash(`${ctx.seed}:${slot}:${i}`) % 10000) / 10000 : Math.random();
    if (roll >= layer.often) continue;
    const pick = usable[seeded ? hash(`${ctx.seed}:${slot}:${layer.register}`) % usable.length : Math.floor(Math.random() * usable.length)];
    let out = pick.replace(/\{(who|what|where)\}/g, (_, key) => String(fill[key]));
    if (family === 'pop' || family === 'tag') out = out.toUpperCase();
    else if (pick.startsWith('{')) out = out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }
  return fallback;
}

/** The layer a bias sits in, in one plain sentence. */
export function biasLayerNote(result) {
  const n = result?.layers?.length || 0;
  if (!n) return 'No register is cast: every answer is plain.';
  if (n === 1) return 'One house register, for this visit: free.';
  return `A combination of ${NUMBER_WORDS[n] || n} registers: the premium plan, open as a trial for now.`;
}
