/**
 * land-answers.mjs — the land answers: write something specific in Spw, and the land knows it.
 *
 * A reader writes an expression (*beaver{ ~lag }, @boof{ ?scent }, &ants{ !torch }, ^[porter]{ .storm_weight }, a
 * room's name, a wonder's, a trope's, a kind, an invention, a folio) and the land acknowledges it: what that sigil
 * does to that thing, said in the canon's own words, and where the book has it. The breadth is the delight: every
 * known name under every sigil with a role for it has an answer, a name met inside another's body is a meeting the
 * book can count, and a few dozen pairings are answered more specifically still.
 *
 * Nothing here is new prose. Each answer is composed from a registry field: characters.mjs (line, temperament,
 * traits, knack, want, limit, escape, weight), kinds.mjs, almanac.json, tropes.json, likeness.json (rooms, who is in
 * them, what is near), the texture.website pack's folios, berries.json, pie-powers.mjs (what a gift does), inventions.spw and
 * liminal-physics.spw, read through the sigil's literary register (spw-resonance.mjs). The maker's reasons
 * (REASONS.reason) are never quoted: they are the maker's register, and stay folded where they are. Held words
 * (the figure, the hat, the Egg, and anything naming who is under the hat) are acknowledged as nothing at all.
 * An expression the land does not know is answered honestly: what was read, and the nearest thing it knows.
 */
import { readFormula, castFormula, isFormula, termText, ROLE } from './spw-formulas.mjs?v=2026_11_13.B';

/** @typedef {import('./spw-formulas.mjs').Term} Term */
/** @typedef {{ text: string, from: string }} Said */
/** @typedef {{ key: string, type: string, title: string, href: string, fields: Partial<Record<string, Said>>, texts: string[] }} Noun */
/** @typedef {{ acknowledged: boolean, held?: boolean, special?: boolean, sigil: string, noun?: string, says: string[], href?: string, nearest?: string[] }} Answer */

const SIGILS = ['!', '?', '~', '@', '&', '*', '^', '#', '.', '=', '%', '$'];
/** Never acknowledged as anything, and never offered as a nearest thing. */
export const HELD = /wap\s*-?\s*boy|wabo|\bhats?\b|bowler|\bfigures?\b|plain[\s_-]*lines|\beggs?\b|dregg|\bshell\b/i;
/** A canon field that would speak about what is held is skipped for another. */
const SPEAKS_HELD = /wap\s*-?\s*boy|wabo|\bhat\b|bowler|\bfigure\b|\begg\b|\bshell\b/i;
const norm = (/** @type {unknown} */ s) => String(s ?? '').toLowerCase().trim().replace(/['’]/g, '').replace(/[\s-]+/g, '_').replace(/^(the|a|an)_/, '');
const said = (/** @type {unknown} */ text, /** @type {string} */ from) => (typeof text === 'string' && text.trim() && !SPEAKS_HELD.test(text) ? { text: text.trim(), from } : null);
/** @param {Record<string, any>} map @param {string} key */
const at = (map, key) => (map && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined);

/** Read a .spw surface's quoted key: "value" pairs, block by block: { block: { key: text } }. @param {string} src */
export function surfacePairs(src) {
  /** @type {Record<string, Record<string, string>>} */
  const out = {};
  for (const m of String(src || '').matchAll(/\^"([a-z_]+)"\s*\{([\s\S]*?)\n\}/g)) {
    out[m[1]] = {};
    for (const p of m[2].matchAll(/^\s*([a-z_]+):\s*"([^"\n]*)"\s*$/gm)) out[m[1]][p[1]] = p[2];
  }
  return out;
}

/**
 * Build the land: every name it knows, and what each sigil finds in it.
 * @param {any} d  { characters, models, reasons, weight, kinds, powers, resonance, almanac, tropes, likeness, folios, berries, inventions, physics }
 */
export function buildLand(d) {
  /** @type {Map<string, Noun>} */
  const nouns = new Map();
  /** @param {string[]} keys @param {Omit<Noun, 'key'>} noun */
  const add = (keys, noun) => {
    const all = [...new Set(keys.map(norm).filter(Boolean))].filter((k) => !HELD.test(k.replace(/_/g, ' ')));
    if (!all.length) return;
    const entry = { key: all[0], ...noun };
    all.forEach((k) => { if (!nouns.has(k)) nouns.set(k, entry); });
  };
  const rooms = Object.values(d.likeness?.items || {}).filter((/** @type {any} */ i) => i.kind === 'room');
  const near = d.likeness?.near || {};
  const titleOf = (/** @type {string} */ id) => d.likeness?.items?.[id]?.title || '';

  // The cast (never the figure in plain lines).
  Object.entries(d.characters || {}).forEach(([id, c]) => {
    if (id === 'figure') return;
    const m = at(d.models, id) || {};
    const r = at(d.reasons, id) || {};
    const w = at(d.weight, id) || {};
    const inRooms = rooms.filter((/** @type {any} */ x) => (x.characters || []).includes(id));
    /** @type {Partial<Record<string, Said | null>>} */
    const f = {
      '@': said(m.temperament || c.line, 'their temperament'),
      '?': said(r.want && `Wants: ${r.want}`, 'what they want'),
      '~': said(r.escape, 'who you get to be beside them'),
      '!': said(m.knack || c.line, m.knack ? 'their knack under the hat' : 'the cast'),
      '&': said(w.hands_on, 'how they hand it on'),
      '*': said(w.carries, 'what they carry'),
      '^': said(c.first ? `First in Chapter ${c.first}.` : 'Met in the lanes.', 'where the book has them first'),
      '#': said((m.traits || []).join(', '), 'their traits'),
      '.': said(r.limit && `Cannot: ${r.limit}`, 'their limit'),
      '=': said(w.eased, 'what eases them'),
      '%': said(inRooms.length ? `In ${inRooms.length} room${inRooms.length === 1 ? '' : 's'} of the book, from ${inRooms[0].title}.` : 'In no room of the book: met in the lanes.', 'counted from the rooms'),
      '$': said(c.material && `Made of ${c.material}, in their own palette.`, 'their material')
    };
    add([id, c.name, c.card], { type: 'character', title: c.name, href: c.href || '', fields: clean(f), texts: [c.line, m.temperament, r.want, r.limit, r.escape, w.carries, w.hands_on, w.eased].filter(Boolean) });
  });

  // The almanac: every wonder.
  (d.almanac?.wonders || []).forEach((/** @type {any} */ w) => {
    const power = at(d.powers, norm(w.id)) || at(d.powers, w.kind) || '';
    const says = /#says\["([^"]+)"\]/.exec(power)?.[1];
    const nears = (near[`wonder:${w.id}`] || []).map(titleOf).filter(Boolean).slice(0, 3);
    const f = {
      '@': said(w.region && `Where: ${w.region}.`, 'where it lives'),
      '?': said(w.hint, 'what to look for'),
      '~': said((w.echoes || []).length ? `It comes back in Chapter ${w.echoes.join(', ')}.` : '', 'where it echoes'),
      '!': said(at(d.kinds, w.kind)?.lanes && `In the lanes it ${String(w.motion || at(d.kinds, w.kind).lanes).replace(/^moves /, 'moves ')}.`, 'what it does in the lanes'),
      '&': said(nears.length ? `Near ${nears.join(', ')}.` : '', 'what the book keeps near it'),
      '*': said(says, 'what it gives, kept'),
      '^': said(w.home ? `At home in Chapter ${w.home}.` : '', 'its chapter'),
      '#': said(w.note, 'its almanac note'),
      '.': said(w.prompt?.scent && `It smells of ${w.prompt.scent}.`, 'its scene sketch'),
      '=': said(w.misread, 'who misreads it'),
      '%': said(`Called ${(w.terms || [w.name]).length} way${(w.terms || [w.name]).length === 1 ? '' : 's'} in the book: ${(w.terms || [w.name]).join(', ')}.`, 'its names'),
      '$': said(at(d.kinds, w.kind)?.shelf && `Shelved in ${at(d.kinds, w.kind).shelf}.`, 'its shelf')
    };
    add([w.id, w.name, ...(w.terms || [])], { type: 'wonder', title: w.name, href: `/almanac/#${w.id}`, fields: clean(f), texts: [w.note, w.hint, w.misread].filter(Boolean) });
  });

  // The tropes.
  (d.tropes?.tropes || []).forEach((/** @type {any} */ t) => {
    const crossings = Object.values(t.crossings || {});
    const f = {
      '?': said(t.statement, 'the trope'),
      '@': said(t.faces?.story?.says, 'its face in the story'),
      '!': said(t.faces?.lanes?.says, 'its face in the lanes'),
      '&': said(crossings[0] && /** @type {any} */ (crossings[0]).says, 'where it crosses'),
      '*': said(t.prop && `Its prop: ${t.prop}.`, 'its prop'),
      '#': said([t.name, ...(t.aliases || [])].join(', '), 'its names'),
      '=': said((t.bends || []).length ? `It bends ${t.bends.join(' and ')}.` : '', 'what it bends'),
      '~': said((t.rhymes || []).length ? `It rhymes with ${t.rhymes.join(', ')}.` : '', 'its rhymes'),
      '.': said(t.faces?.visual?.says, 'how it looks'),
      '%': said(`${crossings.length} crossing${crossings.length === 1 ? '' : 's'} between story and lanes.`, 'counted'),
      '^': said(t.faces?.story?.chambers?.length ? `In Chapter ${t.faces.story.chambers.join(', ')}.` : '', 'its chambers'),
      '$': said(t.sigil && `Its sigil is ${t.sigil}.`, 'its sigil')
    };
    add([t.id, t.name, ...(t.aliases || [])], { type: 'trope', title: t.name, href: '/book/content/world/tropes.json', fields: clean(f), texts: [t.statement].filter(Boolean) });
  });

  // The rooms of the book.
  rooms.forEach((/** @type {any} */ r) => {
    const label = /[[{(<]([a-z][a-z0-9_]*)[\]})>]/.exec(r.spw || '')?.[1] || '';
    const who = (r.characters || []).filter((/** @type {string} */ c) => c !== 'figure').map((/** @type {string} */ c) => d.characters?.[c]?.name || c);
    const nears = (near[r.id] || []).map(titleOf).filter(Boolean).slice(0, 3);
    const f = {
      '@': said(who.length ? `Whose: ${who.join(', ')}.` : 'Nobody named is in it.', 'who is in it'),
      '?': said(r.spw && `Its signature is ${r.spw}.`, 'its Spw signature'),
      '^': said(`Chapter ${r.chapter}.`, 'its chapter'),
      '.': said(r.material && `Made of ${r.material}.`, 'its material'),
      '=': said(r.valence && `It leans ${r.valence}.`, 'its lean'),
      '#': said(r.title, 'its title'),
      '&': said(nears.length ? `Near ${nears.join(', ')}.` : '', 'what the book keeps near it'),
      '*': said(r.container && `A ${r.container}.`, 'its container'),
      '~': said(at(d.resonance, r.sigil)?.name && `A room of ${r.sigil}, ${at(d.resonance, r.sigil).name}.`, 'its sigil'),
      '%': said(`Room ${String(r.id).split('.').pop()} of Chapter ${r.chapter}.`, 'its place in the chapter'),
      '$': said(r.palette && `In the palette ${titleOf(`palette:${r.palette}`) || r.palette}.`, 'its palette'),
      '!': said(`Open it: ${r.href}.`, 'the room')
    };
    add([label, r.title], { type: 'room', title: r.title, href: r.href, fields: clean(f), texts: [r.title] });
  });

  // The kinds of wonder.
  Object.entries(d.kinds || {}).forEach(([id, k]) => {
    const says = /#says\["([^"]+)"\]/.exec(at(d.powers, id) || '')?.[1];
    add([id, k.word, k.words], { type: 'kind', title: k.words || id, href: `/almanac/#${k.anchor || id}`, fields: clean({ '?': said(k.found, 'how one is found'), '!': said(k.lanes && `In the lanes it ${k.lanes}.`, 'in the lanes'), '*': said(says, 'what one gives, kept'), '#': said(k.shelf && `Shelved in ${k.shelf}.`, 'its shelf'), '$': said(k.sigil && `Its sigil is ${k.sigil}.`, 'its sigil') }), texts: [k.found].filter(Boolean) });
  });

  // The gifts the lanes know (pie-powers.mjs), where nothing above has the name.
  Object.entries(d.powers || {}).forEach(([id, spell]) => {
    const says = /#says\["([^"]+)"\]/.exec(String(spell))?.[1];
    const lasts = [...String(spell).matchAll(/~([a-z_]+)\[([\d.]+)\]/g)].map((m) => `${m[1].replace(/_/g, ' ')} for ${m[2]} seconds`);
    const withs = [...String(spell).matchAll(/&(with|without)\[([a-z_]+)\]/g)].map((m) => `${m[1]} ${m[2]}`);
    add([id], { type: 'gift', title: id.replace(/_/g, ' '), href: '/pie/#pie-powers', fields: clean({ '*': said(says, 'what it gives'), '~': said(lasts.length ? `It lasts: ${lasts.join(', ')}.` : '', 'how long'), '&': said(withs.length ? `It comes ${withs.join(', ')}.` : '', 'what it comes with'), '#': said(says, 'what it gives') }), texts: [says].filter(Boolean) });
  });

  // The berries and the lands they name.
  Object.entries(d.berries?.berries || {}).forEach(([id, b]) => {
    add([`${id}berry`, `${id}berries`, b.name], { type: 'berry', title: b.name, href: '/world/boonberry-commons.html', fields: clean({ '?': said(b.prophecy, 'what it foretells'), '.': said(b.look, 'how it looks'), '!': said(b.in_the_lanes, 'in the lanes'), '~': said(b.ambiguity || b.self_fulfilling, 'what the book leaves open') }), texts: [b.prophecy, b.look].filter(Boolean) });
  });

  // Folios: pieces of texture.website, seen from the maker (?/texture.website/*id); the scans live at spwashi.com.
  (d.folios?.pieces || []).forEach((/** @type {any} */ p) => {
    const res = (p.resonance || []).map((/** @type {any} */ x) => x.label).filter(Boolean);
    add([p.slug, p.title], { type: 'folio', title: p.title, href: `/?/texture.website/*${encodeURIComponent(p.slug || p.id)}`, fields: clean({ '@': said(p.alt, 'what it shows'), '#': said(p.title, 'its title'), '&': said(res.length ? `It answers ${res.slice(0, 2).join(' and ')}.` : '', 'what it answers'), '.': said((p.tags || []).length ? `Its marks: ${p.tags.join(', ')}.` : '', 'its tags'), '~': said(p.shown_at && `It lives at spwashi.com: ${p.shown_at}`, 'where it lives'), '*': said(`A ${p.kind}, scanned.`, 'what it is') }), texts: [p.alt].filter(Boolean) });
  });

  // Inventions and the physics of the page (proposals say so).
  /** @param {Record<string, Record<string, string>>} pairs @param {string} surface @param {string} href */
  const fromSurface = (pairs, surface, href) => Object.entries(pairs).forEach(([block, entries]) => {
    if (!['kept', 'proposed', 'built'].includes(block)) return;
    Object.entries(entries).forEach(([id, text]) => {
      const t = block === 'proposed' ? `Proposed, not in the book yet: ${text}.` : `${text}.`;
      const f = Object.fromEntries(['*', '!', '&', '^', '.', '#', '?', '~'].map((s) => [s, said(t, `${surface}, ${block}`)]));
      add([id], { type: block === 'proposed' ? 'proposal' : surface === 'inventions' ? 'invention' : 'physics', title: id.replace(/_/g, ' '), href, fields: clean(f), texts: [text] });
    });
  });
  fromSurface(d.inventions || {}, 'inventions', '/.spw/surfaces/inventions.spw');
  fromSurface(d.physics || {}, 'liminal physics', '/.spw/surfaces/liminal-physics.spw');

  return { nouns, resonance: d.resonance || {}, data: d };
}

/** @param {Partial<Record<string, Said | null>>} f @returns {Partial<Record<string, Said>>} */
function clean(f) {
  /** @type {Partial<Record<string, Said>>} */
  const out = {};
  Object.entries(f).forEach(([k, v]) => { if (v) out[k] = v; });
  return out;
}

/* ─── Answering ─────────────────────────────────────────────────────────── */

/** Distance between two words (for the nearest known thing). @param {string} a @param {string} b */
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/**
 * The hand-picked pairings, each answered from named registry fields (paths into the land's data), never new words.
 * A path is 'characters.boof.line', 'weight.porter.hands_on', 'inventions.kept.storm_weight', 'powers.beaver',
 * 'berries.berries.boon.prophecy', 'physics.built.haze', 'tropes.exactly-one.statement', 'formula' (cast it too).
 * @type {ReadonlyArray<[string, string[]]>}
 */
export const SPECIAL = Object.freeze([
  ['*beaver{ ~lag }', ['powers.beaver', 'powers.lag_stag']],
  ['@boof{ ?scent }', ['characters.boof.line', 'models.boof.temperament']],
  ['&ants{ !torch }', ['weight.ants.hands_on', 'inventions.kept.torch_lines']],
  ['=bane@pie{ @mime }', ['formula', 'characters.mime.line']],
  ['^[porter]{ .storm_weight }', ['inventions.kept.storm_weight', 'weight.porter.hands_on']],
  ['%[slice]{ 1/8 }', ['formula', 'characters.boon.line']],
  ['<pocket>{ }', ['physics.proposed.pocket']],
  ['@genie{ %price }', ['weight.genie.carries', 'reasons.genie.limit']],
  ['?[thursday]', ['weight.genie.hands_on', 'weight.genie.eased']],
  ['~boof{ .furrow }', ['weight.boof.eased']],
  ['=boon@boon{ @bane }', ['formula', 'weight.bane.eased', 'weight.boon.hands_on']],
  ['!clown{ *pie }', ['reasons.clown.want', 'weight.clown.hands_on']],
  ['.bonewap{ ^frame }', ['weight.bonewap.carries', 'weight.bonewap.hands_on']],
  ['%clerk{ #slip }', ['inventions.kept.damage_slip', 'weight.clerk.carries']],
  ['*boonberry', ['powers.boonberry', 'berries.berries.boon.prophecy']],
  ['*boneberry', ['powers.boneberry', 'berries.berries.bone.prophecy']],
  ['*baneberry', ['berries.berries.bane.prophecy', 'characters.mime.line']],
  ['?{ haze } .{ ground }', ['physics.built.haze', 'physics.built.ground']],
  ['[lanes]{ world }', ['physics.built.frame']],
  ['{ }', ['physics.proposed.wind_up']],
  ['&[hands]', ['inventions.proposed.many_handled_tray']],
  ['~{warm_stone}', ['inventions.proposed.warm_stone']],
  ['#[bell]', ['inventions.proposed.thank_bell']],
  ['!honk', ['powers.jazz_geese']],
  ['*lag_stag{ ~lag }', ['powers.lag_stag']],
  ['@porter{ &stranger }', ['weight.porter.eased', 'reasons.porter.escape']],
  ['%[pie]{ 1 }', ['tropes.exactly-one.statement', 'tropes.exactly-one.faces.lanes.says']],
  ['!spill', ['tropes.exactly-one.faces.lanes.says']],
  ['@hob_deer{ ~lag }', ['almanac.hob-deer.note', 'powers.hob_deer']],
  ['&ants{ .furrow }', ['powers.torch_ants', 'almanac.torch-ants.hint']],
  ['=boon@boof{ @boneberry }', ['formula', 'berries.berries.bone.prophecy', 'models.boof.temperament']],
  ['<boon>.land@boof', ['formula']],
  ['{boon}.land', ['formula']],
  ['@boof{ <boon>{bone} }', ['formula']],
  ['^genie{ ~echo }', ['weight.genie.eased']],
  ['.ants{ ~light }', ['weight.ants.carries', 'weight.ants.eased']],
  ['#clerk{ !damage }', ['characters.clerk.line', 'models.clerk.knack']],
  ['*mime{ ?words }', ['weight.mime.carries', 'reasons.mime.want']]
]);
const squash = (/** @type {string} */ s) => String(s || '').replace(/\s+/g, '').toLowerCase();

/** Follow a path into the land's data. @param {any} data @param {string} path */
function canonAt(data, path) {
  const [head, ...rest] = path.split('.');
  let v;
  if (head === 'almanac') { v = (data.almanac?.wonders || []).find((/** @type {any} */ w) => w.id === rest[0]); rest.shift(); }
  else if (head === 'tropes') { v = (data.tropes?.tropes || []).find((/** @type {any} */ t) => t.id === rest[0]); rest.shift(); }
  else v = data[head];
  for (const k of rest) v = v?.[k];
  if (head === 'powers' && typeof v === 'string') v = /#says\["([^"]+)"\]/.exec(v)?.[1] || '';
  return typeof v === 'string' && v.trim() && !SPEAKS_HELD.test(v) ? v.trim() : '';
}

/**
 * Answer an expression. Order: held → a special pairing → a name the land knows (under its sigil, with whatever its
 * body names) → a formula that computes → an honest unknown.
 * @param {ReturnType<typeof buildLand>} land
 * @param {string} src
 * @param {{ parse?: ((text: string, options?: any) => any) | null, readBias?: ((node: any) => any) | null }} [opts]
 * @returns {Answer}
 */
export function answer(land, src, opts = {}) {
  const text = String(src || '').trim();
  if (HELD.test(text.replace(/[_-]/g, ' '))) return { acknowledged: false, held: true, sigil: '', says: ['The land keeps no answer for that.'] };
  const special = SPECIAL.find(([form]) => squash(form) === squash(text));
  if (special) {
    const lines = special[1].flatMap((path) => (path === 'formula' ? castFormula(text, opts).said.says : [canonAt(land.data, path)])).filter(Boolean);
    if (lines.length) return { acknowledged: true, special: true, sigil: text[0], says: lines };
  }
  const read = readFormula(text, opts);
  const [t] = read.terms;
  const sigil = t?.sigil || '';
  // The name: the term's own, or its frame's first word (^[porter]), or its body's single word (~{warm_stone}).
  const nameOf = (/** @type {Term | undefined} */ x) => (x ? (x.name || (typeof x.frame?.[0] === 'string' ? String(x.frame[0]) : '') || (x.body?.length === 1 && !x.body[0].sigil ? x.body[0].name : '')) : '');
  const name = norm(nameOf(t));
  const noun = name ? land.nouns.get(name) : undefined;
  if (noun && t) {
    const role = land.resonance?.[sigil];
    const field = noun.fields[sigil] || (!sigil ? Object.values(noun.fields)[0] : null);
    const lines = [];
    if (field) lines.push(`${sigil ? `${sigil} ${role?.name || ROLE[/** @type {keyof typeof ROLE} */ (sigil)] || ''}, ` : ''}${noun.title}: ${field.text}`);
    else lines.push(`${noun.title}: ${Object.values(noun.fields)[0]?.text || noun.texts[0] || 'known to the land'}${sigil ? ` (${sigil} finds nothing more in it)` : ''}`);
    // Its body: a word the canon uses of it is quoted where it says it; another name is a meeting.
    (t.body || []).forEach((inner) => {
      const w = norm(nameOf(inner));
      if (!w) return;
      const other = land.nouns.get(w);
      if (other && other !== noun) {
        const together = Object.values(land.data.likeness?.items || {}).filter((/** @type {any} */ i) => i.kind === 'room' && [noun.key, other.key].every((k) => (i.characters || []).includes(k)));
        const otherField = other.fields[inner.sigil] || Object.values(other.fields)[0];
        lines.push(together.length ? `${noun.title} and ${other.title} share ${together.length} room${together.length === 1 ? '' : 's'}: ${together[0].title}.` : `${noun.title} meets ${other.title}${otherField ? `: ${otherField.text}` : '.'}`);
        return;
      }
      const hit = noun.texts.map((s) => s.split(/(?<=[.;:])\s+/).find((part) => new RegExp(`\\b${w.replace(/_/g, '[ _-]')}`, 'i').test(part))).find(Boolean);
      if (hit && !SPEAKS_HELD.test(hit)) lines.push(`${inner.sigil || ''}${w}: “${hit.replace(/\.$/, '')}.”`);
    });
    return { acknowledged: true, sigil, noun: noun.key, says: lines, href: noun.href };
  }
  if (isFormula(text)) {
    const cast = castFormula(text, opts);
    if (cast.said.kind !== 'unread' && cast.said.kind !== 'none') return { acknowledged: true, sigil, says: cast.said.says };
  }
  // Honest: what was read, and the nearest things the land knows.
  const container = t?.capsule ? '< > a capsule' : t?.body ? '{ } a body' : t?.frame ? '[ ] a frame' : 'no container';
  const keys = [...land.nouns.keys()];
  const nearest = name ? keys.map((k) => [k, distance(name, k) - (k.startsWith(name.slice(0, 3)) ? 1 : 0)]).filter(([, dist]) => Number(dist) <= Math.max(2, Math.floor(name.length / 3))).sort((a, b) => Number(a[1]) - Number(b[1])).slice(0, 3).map(([k]) => String(k)) : [];
  return {
    acknowledged: false,
    sigil,
    nearest,
    says: [read.ok ? `Read: ${sigil ? `${sigil} (${ROLE[/** @type {keyof typeof ROLE} */ (sigil)]})` : 'no sigil'}, ${container}${name ? `, named ${name}` : ''}${read.whole === false ? '; it did not read whole as Spw, so it was read by hand' : ''}.` : 'Nothing in it reads as Spw yet.',
      name ? `The land does not know ${name} yet.${nearest.length ? ` Nearest: ${nearest.map((k) => land.nouns.get(k)?.title || k).join(', ')}.` : ''}` : 'Name something in it, and the land will look.']
  };
}

/**
 * How much the land answers: names × sigils with a field, the special pairings, and how many expressions a reader
 * could write that get an answer (each name under each answered sigil in four shapes, bare, @[x], @x{ }, @{x}, plus
 * every name meeting every other in a body).
 * @param {ReturnType<typeof buildLand>} land
 */
export function coverage(land) {
  const unique = [...new Set(land.nouns.values())];
  const pairs = unique.reduce((sum, n) => sum + SIGILS.filter((s) => n.fields[s]).length, 0);
  const names = land.nouns.size;
  const byType = unique.reduce((/** @type {Record<string, number>} */ acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});
  const meetings = unique.length * (unique.length - 1) * SIGILS.length * SIGILS.length;
  return { nouns: unique.length, names, byType, pairs, special: SPECIAL.length, single: pairs * 4 * Math.round(names / unique.length), meetings, total: pairs * 4 + meetings + SPECIAL.length };
}

/** Load the land in a browser: the registries, fetched once. */
let landPromise = null;
let landWeighted = false;
/** The land, loaded once per page. The characters' weight (characters.mjs WEIGHT) is the maker's register: it joins
 * the answers only when asked for (the desk asks when Reasons is on in the switches). @param {{ withWeight?: boolean }} [opts] */
export function loadLand({ withWeight = false } = {}) {
  if (landPromise && landWeighted === withWeight) return landPromise;
  landWeighted = withWeight;
  const json = (/** @type {string} */ url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const text = (/** @type {string} */ url) => fetch(url).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  landPromise = Promise.all([
    import('./characters.mjs?v=2026_11_11.A'),
    import('./kinds.mjs?v=2026_11_09.G'),
    import('../home/pie-powers.mjs?v=2026_11_09.F'),
    import('./spw-resonance.mjs?v=2026_09_26.C'),
    json('/book/content/world/almanac.json'),
    json('/book/content/world/tropes.json'),
    json('/book/content/world/likeness.json'),
    json('/book/content/packs/texture.website/@spwashi/folios.json'),
    json('/book/content/world/berries.json'),
    text('/.spw/surfaces/inventions.spw'),
    text('/.spw/surfaces/liminal-physics.spw')
  ]).then(([chars, kinds, powers, res, almanac, tropes, likeness, folios, berries, inventions, physics]) => buildLand({
    characters: chars.CHARACTERS, models: chars.MODELS, reasons: chars.REASONS, weight: withWeight ? chars.WEIGHT : {},
    kinds: kinds.KINDS, powers: powers.POWER_SPELLS, resonance: res.OPERATOR_RESONANCE,
    almanac, tropes, likeness, folios, berries,
    inventions: surfacePairs(inventions), physics: surfacePairs(physics)
  }));
  return landPromise;
}

export { termText };
