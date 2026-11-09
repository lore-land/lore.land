/**
 * quest-middleware.mjs — spw.quest as middleware: a line passes through, and comes out with a receipt.
 *
 * spw.quest keeps state in the address and reads a line so it can be compared (spwashi.com's canon). As
 * middleware it stands between a surface (texture.website's materials and hands) and what plays or uses them
 * (lore.land's letter blocks, factshift.center's canvas). In an address, a ? part is a pass through it:
 *
 *   ?/texture.website/@spwashi/!Boof/=~9/?align        → ~9 is more than a hand wanders: ~3, and it says so
 *   ?/texture.website/@spwashi/$honey/&factshift.center/?ground   → honey, in factshift.center's own address
 *
 * Seven verbs. Four change the line and leave it in the address without themselves (edit, enhance, align,
 * mutate); three read it and stay, so the reading can be passed along (clarify, ground, resonate). Every verb
 * returns a receipt: what it did, in words. Portable: imports nothing a page needs; the context is passed in.
 */

export const VERBS = Object.freeze({
  edit: { changes: true, says: 'change what the address asks to change (.field:value parts)' },
  enhance: { changes: true, says: 'fill in what is missing, from what the maker already has' },
  clarify: { changes: false, says: 'say what the line means, part by part, in words' },
  align: { changes: true, says: 'put it in order and in range, so one state is one address' },
  mutate: { changes: true, says: 'a variation: one or two dials turned, the seed moved, perhaps a new material' },
  ground: { changes: false, says: 'say it in a target\'s own terms (&factshift.center: its physics address)' },
  resonate: { changes: false, says: 'find what echoes it: motifs on the folios, letters lettered and penned' }
});

/* The tuning dials' ranges (spwashi-hand.mjs DIALS), and their order in a line. */
const DIAL_ORDER = ['~', '%', '@', '.', '^', '!', '?', '*', '#', '&', '=', '$'];
const RANGES = { '~': [0, 3], '%': [0.5, 3], '@': [-16, 16], '.': [0, 3], '^': [0, 3], '!': [0, 3], '?': [0, 3], '*': [0, 1], '#': [0, 1], '&': [0, 1], '=': [1, 999], '$': [0, 2] };

/** A tuning body as dials and words: '~2 @40 outline }' → { dials: {'~': 2, '@': 40}, words: ['outline'], closed }. */
export function readDials(config = '') {
  const dials = {};
  const words = [];
  const closed = /\}\s*$/.test(config);
  config.replace(/\}\s*$/, '').trim().split(/\s+/).filter(Boolean).forEach((token) => {
    const m = token.match(/^([~%@.^!?*#&=$])(-?\d+(?:\.\d+)?)?$/);
    if (m) dials[m[1]] = m[2] !== undefined ? Number(m[2]) : null;
    else words.push(token);
  });
  return { dials, words, closed };
}
export function writeDials({ dials, words, closed }) {
  const parts = [...words, ...DIAL_ORDER.filter((op) => op in dials).map((op) => `${op}${dials[op] === null ? '' : +Number(dials[op]).toFixed(2)}`)];
  return `${parts.join(' ')}${closed ? ' }' : ''}`.trim();
}

const rand = (seed) => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; };

/**
 * Pass a route through the verbs it asks for (route.asked), in order. ctx: { materials, findings, glyphs,
 * groundIn(target, route) }. Returns { route, receipts: [{ verb, lines: [...], out? }] }.
 */
export function passThrough(route, ctx = {}) {
  let r = { ...route };
  const receipts = [];
  for (const verb of route.asked || []) {
    const v = VERBS[verb];
    if (!v) { receipts.push({ verb, lines: [`spw.quest has no ?${verb}: the seven are ${Object.keys(VERBS).map((k) => `?${k}`).join(', ')}.`] }); continue; }
    const done = DO[verb](r, ctx);
    r = done.route || r;
    receipts.push({ verb, lines: done.lines, out: done.out });
  }
  // What changed the line leaves the address; what read it stays, so the reading travels with it.
  r.asked = (route.asked || []).filter((verb) => VERBS[verb] && !VERBS[verb].changes);
  return { route: r, receipts };
}

const DO = {
  edit(r) {
    const lines = [];
    const next = { ...r, grounds: [] };
    (r.grounds || []).forEach((g) => {
      const [field, ...rest] = g.split(':');
      const value = rest.join(':');
      if (field === 'word' || field === 'words') { next.action = value || null; lines.push(`the words are now “${value}”`); return; }
      if (field === 'material') { next.substrate = value || null; lines.push(`made on ${value}`); return; }
      if (field === 'letter') { next.value = value || null; lines.push(`the letter is ${value}`); return; }
      const op = { wobble: '~', weight: '%', slant: '@', settle: '.', bounce: '^', pressure: '!', tilt: '?', measure: '#', layered: '&', seed: '=', paper: '$' }[field];
      if (op) {
        const d = readDials(next.config || '');
        d.dials[op] = value === '' ? null : Number(value);
        next.config = writeDials(d);
        lines.push(`${field} set to ${value || 'on'} (${op})`);
        return;
      }
      lines.push(`.${g} is not something the line can change`);
    });
    if (!lines.length) lines.push('nothing to change: an edit is written as .field:value (.word:moon, .wobble:2, .material:honey)');
    return { route: next, lines };
  },

  enhance(r, ctx) {
    const lines = [];
    const next = { ...r };
    if (!next.action && !next.value) { next.action = ctx.sample || 'Boof'; lines.push(`no words: wrote “${next.action}”`); }
    if (!next.substrate) { next.substrate = 'paper'; lines.push('no material: made on paper, the sheet it was lettered on'); }
    const d = readDials(next.config || '');
    if (!('~' in d.dials)) { d.dials['~'] = 1; lines.push('no wander: ~1, the hand as it moves'); }
    if (!('#' in d.dials) && (ctx.literacy !== false)) { d.dials['#'] = null; lines.push('the measure shown (#), so it says where each letter came from'); }
    next.config = writeDials(d);
    if (!lines.length) lines.push('nothing missing');
    return { route: next, lines };
  },

  clarify(r, ctx) {
    const lines = r.parts.filter((p) => p.op !== '?').map((p) => `${p.op === '/' ? '' : p.op}${p.name} — ${p.reads}`);
    const m = r.substrate && ctx.materials?.[r.substrate];
    if (m) lines.push(`$${r.substrate}: ${m.says}; texture ${m.texture.ground}${m.texture.motif ? ` (~${m.texture.motif}, from the folios)` : ''}; typography ${m.typography}; physics: drag ${m.physics.velocityDecay}, pull home ${m.physics.centerStrength}, apart ${m.physics.charge}${m.physics.fall ? `, fall ${m.physics.fall}` : ''}`);
    const d = readDials(r.config || '');
    Object.entries(d.dials).forEach(([op, v]) => { const says = ctx.dials?.[op]?.says; if (says) lines.push(`${op}${v ?? ''} — ${says}`); });
    return { lines };
  },

  align(r, ctx) {
    const lines = [];
    const next = { ...r };
    const d = readDials(next.config || '');
    Object.entries(d.dials).forEach(([op, v]) => {
      if (v === null || !RANGES[op]) return;
      const [lo, hi] = RANGES[op];
      const c = Math.min(hi, Math.max(lo, v));
      if (c !== v) { d.dials[op] = c; lines.push(`${op}${v} is past what the hand does: ${op}${c}`); }
    });
    const known = d.words.filter((w) => ['hand', 'outline', '}'].includes(w));
    const dropped = d.words.filter((w) => !known.includes(w));
    if (dropped.length) lines.push(`set aside, as not a dial or a face: ${dropped.join(' ')}`);
    d.words = [...new Set(known)];
    next.config = writeDials(d) || null;
    if (next.substrate && ctx.materials && !ctx.materials[next.substrate]) { lines.push(`$${next.substrate} is not a material yet: made on paper`); next.substrate = 'paper'; }
    if (next.action && next.action.length > 48) { next.action = next.action.slice(0, 48); lines.push('the words trimmed to 48 letters'); }
    lines.push('in order: surface, @whose, ~motif, $material, *letter, !words, =tuning, &with — one state, one address');
    return { route: next, lines };
  },

  mutate(r, ctx) {
    const seed = ctx.seed ?? Math.floor(Math.random() * 9973) + 1;
    const next01 = rand(seed);
    const lines = [];
    const next = { ...r };
    const d = readDials(next.config || '');
    const pool = ['~', '@', '^', '?', '.', '!'];
    for (let i = 0; i < 2; i += 1) {
      const op = pool[Math.floor(next01() * pool.length)];
      const [lo, hi] = RANGES[op];
      const was = d.dials[op] ?? 0;
      let now = +(Math.min(hi, Math.max(lo, was + (next01() - 0.35) * (hi - lo) * 0.6))).toFixed(1);
      // A variation always varies: a dial that would land where it was is turned a step the other way.
      if (now === was) now = +(Math.min(hi, Math.max(lo, was + (was >= hi ? -1 : 1) * (hi - lo) * 0.2))).toFixed(1);
      d.dials[op] = now;
      lines.push(`${op} ${was} → ${now}`);
    }
    d.dials['='] = seed;
    lines.push(`seed =${seed}`);
    const names = Object.keys(ctx.materials || {});
    if (names.length && next01() < 0.45) {
      const was = next.substrate || 'paper';
      next.substrate = names[Math.floor(next01() * names.length)];
      if (next.substrate !== was) lines.push(`made on ${next.substrate}, not ${was}`);
    }
    next.config = writeDials(d);
    return { route: next, lines };
  },

  ground(r, ctx) {
    const target = r.with || 'lore.land';
    const out = ctx.groundIn ? ctx.groundIn(target, r) : null;
    if (!out) return { lines: [`no way yet to say this in ${target}'s terms`] };
    return { lines: out.lines, out };
  },

  resonate(r, ctx) {
    const lines = [];
    const out = { motifs: [], letters: { lettered: [], penned: [] } };
    const words = `${r.action || ''} ${r.value || ''}`.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
    const m = r.substrate && ctx.materials?.[r.substrate];
    (ctx.findings?.motifs || []).forEach((motif) => {
      const hit = words.some((w) => motif.words.includes(w)) || (m?.texture.motif && motif.handle === `~${m.texture.motif}`);
      if (hit && out.motifs.length < 8) out.motifs.push(motif);
    });
    [...new Set(`${r.action || ''}${r.value || ''}`)].forEach((ch) => {
      const g = ctx.glyphs?.[ch];
      if (g) out.letters[g.kind === 'lettered' ? 'lettered' : 'penned'].push(ch);
    });
    if (out.motifs.length) lines.push(`on the folios: ${out.motifs.map((x) => x.handle).join(', ')}`);
    else lines.push('nothing on the folios echoes these words yet');
    if (out.letters.lettered.length) lines.push(`lettered by hand here: ${out.letters.lettered.join(' ')}`);
    if (out.letters.penned.length) lines.push(`penned in the hand's manner: ${out.letters.penned.join(' ')} (waiting for a lettered one, T06)`);
    return { lines, out };
  }
};
