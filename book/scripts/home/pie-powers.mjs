/**
 * pie-powers.mjs — every power-up in Exactly One Pie, written as a Spw spell.
 *
 * A power-up is the land doing in the lanes what it does in the book: torch-ants
 * keep lit streets along the roots, so they light your lane and warm the furrows
 * ahead; pane-snails graze a pane forgiven clear, so the pie forgets it was
 * tipped. Each one is a short spell, read by a small reader here, so the rules
 * of the game are text anyone can read, change and pass along:
 *
 *   *torch_ants{ ~lit[7] &with[furrow] &without[frost] #says["…"] }
 *
 *   ~effect[s]     potential: something that lasts, for so many seconds
 *                  lit · lag · unkept · warm · fed · glimpse · true_aim
 *   %amount[n]     measure: how much of the aura it feeds   crust · filling
 *   *charge[n]     value: charges spent one at a time      echoes · frill · tin
 *   !act           action: done at once                    level · honk · ready · forgive
 *   &with[kind]    confluence: the ecology answers — kinds come up the lanes while it lasts
 *                  furrow · berry · boneberry · pile
 *   &without[kind] confluence: kinds ahead go quiet        frost · puddle · pane · baneberry
 *   #says["…"]     annotation: what is said under the screen
 *
 * Unknown words are reported, never guessed; every number is held to a range, so a
 * replaced spell can change the game but never break it. A visit can carry other
 * spells (?powers= in a link, or the bench on the page; sessionStorage
 * lore.pie.powers.visit), never saved as the reader's own. The carry itself is
 * written back as Spw too: carryProvenance() is a card of how this pie came to be
 * where it spilled, which spells it ran on, and whose they were.
 */

export const POWER_SPELLS = Object.freeze({
  // The land's own wonders, kept on the way (almanac.json): each gift is its job in the book.
  torch_ants: '*torch_ants{ ~lit[7] &with[furrow] &without[frost] #says["Torch-ants keep lit streets along the berry roots all winter. Tonight one runs up your lane, and the furrows ahead come up warm."] }',
  salt_whales: '*salt_whales{ ~lit[7] &without[puddle] #says["Their old roads glow under the crust. The way through glows with them, and the puddles drain down into their roof."] }',
  echo_wrens: '*echo_wrens{ *echoes[3] #says["The grove says everything again, a beat late. So will your next three throws."] }',
  lag_stag: '*lag_stag{ ~lag[5] #says["Its hoofprints land a beat after it has passed. For a while the whole land lands a beat late, and you do not."] }',
  jazz_geese: '*jazz_geese{ !honk #says["Nine geese, honking in uneven time. What was ahead of you swings out of the way."] }',
  hob_deer: '*hob_deer{ ~unkept[4.5] #says["A deer no taller than a boot, from a day nobody kept. For a moment nothing in the lanes can keep you either."] }',
  page_fox: '*page_fox{ ~unkept[4.5] !ready #says["A fox the colour of an unturned page, late for something. You are unkept for a moment, and a slice is ready, as if a page had turned."] }',
  pane_snails: '*pane_snails{ !level &without[pane] #says["They graze the city glass clear by night. The panes ahead are forgiven, and the pie forgets it was ever tipped."] }',
  remainder_moths: '*remainder_moths{ ~true_aim[6] #says["They go round a flame and never land twice in the same place. For a while they lead your needle to the nearest face, as if it were a lamp."] }',
  frill_lichen: '*frill_lichen{ *frill[2] #says["More edge than room. Your next two knocks land on the ruffle, and only half of each reaches the pie."] }',
  sliver_tin: '*sliver_tin{ *tin[3] #says["Always filling, never full. Your next three slices fill half again as much appetite."] }',
  // A wonder without a gift of its own gives by its kind.
  creature: '*creature{ %crust[0.12] %filling[0.12] #says["A creature of the land, kept. The aura is fed a little, crust and filling."] }',
  contrivance: '*contrivance{ %crust[0.24] #says["Something made with care, kept. The crust is fed."] }',
  antique: '*antique{ !level %crust[0.12] #says["Something old the land kept, kept again. The pie steadies, the way old things do, and the crust is fed."] }',
  artifact: '*artifact{ !ready %filling[0.12] #says["Something a scene left behind, picked up. A slice is ready, and the filling is fed."] }',
  bracework: '*bracework{ %filling[0.18] !ready #says["Written before it was built, kept. A slice is ready, and the filling is fed."] }',
  saying: '*saying{ !level #says["A saying the makers keep. The pie steadies, the way a rule does."] }',
  // The field: the three berries, each a kind of foretelling (berries.json), and a slow beaver.
  boonberry: '*boonberry{ %filling[0.3] ~glimpse[3.5] #says["A little borrowed summer, and a glimpse: the clear way up the lanes, a breath before you need it."] }',
  boneberry: '*boneberry{ %crust[0.12] %filling[0.12] ~fed[6] #says["A whole meal in a berry, grown, not raised. Your steps tilt less for a while, and the pie settles sooner."] }',
  beaver: '*beaver{ ~lag[4.5] &with[berry] #says["A slow beaver keeps its own time and lends it. The land goes at its pace; the berries it planted come up behind it."] }'
});

/* What each word may be, and how far: a replaced spell can change the game, never break it. */
const TIMED = Object.freeze({ lit: 12, lag: 8, unkept: 6, warm: 10, fed: 10, glimpse: 8, true_aim: 10 });
const AMOUNTS = Object.freeze({ crust: 0.5, filling: 0.5 });
const CHARGES = Object.freeze({ echoes: 6, frill: 4, tin: 5 });
const ACTS = Object.freeze(['level', 'honk', 'ready', 'forgive']);
const WITH = Object.freeze(['furrow', 'berry', 'boneberry', 'pile']);
const WITHOUT = Object.freeze(['frost', 'puddle', 'pane', 'baneberry']);

export const WORDS = Object.freeze({
  lit: 'the way through is lit', lag: 'the land runs slow, you do not', unkept: 'nothing in the lanes can hold you',
  warm: 'the pie settles faster', fed: 'steps tilt less', glimpse: 'the clear way shows ahead', true_aim: 'the needle finds the nearest face',
  crust: 'crust', filling: 'filling', echoes: 'throws echo', frill: 'knocks land soft', tin: 'slices fill half again',
  level: 'the pie levels', honk: 'what is ahead swings clear', ready: 'a slice is ready', forgive: 'the next knock is forgiven'
});

const clampTo = (n, max) => Math.max(0, Math.min(max, Number(n) || 0));
/* References a power dispatches when it is applied: its card, its sound, whose voice says it, where the book has it. */
const SOUNDS = Object.freeze(['berry', 'bone', 'beaver', 'wonder', 'sweet', 'egg', 'catch', 'deft']);
const VOICES = Object.freeze(['boon', 'bane', 'wonder', 'flour', 'egg']);

/**
 * A power from its atoms, whichever reader found them: { sigil, word, args: [string|number], path? }.
 * The one place ranges and vocabulary are held, so the small reader here and the real Spw parser
 * (pie-spw.mjs) build the same thing from the same spell, and any difference is the readers'.
 */
export function buildPower(rawId, atoms, { says = '' } = {}) {
  const id = String(rawId).toLowerCase().replace(/-/g, '_');
  const power = { id, timed: {}, amounts: {}, charges: {}, acts: [], with: [], without: [], says: String(says).trim().slice(0, 240), refs: {} };
  const errors = [];
  atoms.forEach(({ sigil, word, args = [], path, whole }) => {
    const key = String(word || '').toLowerCase();
    const arg = args[0];
    const name = whole || `${sigil}${key}${args.length ? `[${args.join(', ')}]` : ''}`;
    if (path != null) power.refs.path = String(path);
    else if (sigil === '#' && key === 'says') power.says = String(arg ?? '').trim().slice(0, 240);
    else if (sigil === '~' && key in TIMED) power.timed[key] = clampTo(arg, TIMED[key]);
    else if (sigil === '%' && key in AMOUNTS) power.amounts[key] = clampTo(arg, AMOUNTS[key]);
    else if (sigil === '*' && key in CHARGES) power.charges[key] = Math.round(clampTo(arg, CHARGES[key]));
    else if (sigil === '!' && ACTS.includes(key)) power.acts.push(key);
    else if (sigil === '!' && key === 'sound' && SOUNDS.includes(String(arg))) power.refs.sound = String(arg);
    else if (sigil === '@' && key === 'voice' && VOICES.includes(String(arg))) power.refs.voice = String(arg);
    else if (sigil === '^' && key === 'card' && /^[a-z][a-z-]*$/.test(String(arg))) power.refs.card = String(arg);
    else if (sigil === '&' && key === 'with' && WITH.includes(String(arg).trim())) power.with.push(String(arg).trim());
    else if (sigil === '&' && key === 'without' && WITHOUT.includes(String(arg).trim())) power.without.push(String(arg).trim());
    else errors.push(`*${id}: ${name} is not a word the lanes know.`);
  });
  return { power, errors };
}

/** One spell (or several), read by the small reader. Returns { powers: { id: power }, errors: [] }. */
export function readSpells(text) {
  const powers = {};
  const errors = [];
  const src = String(text || '');
  const blocks = [...src.matchAll(/\*([a-z][a-z0-9_-]*)\s*\{([^{}]*)\}/gi)];
  if (!blocks.length && src.trim()) errors.push('No power found: a power is *name{ … }.');
  blocks.forEach(([, rawId, body]) => {
    const says = /#says\[\s*"([^"]*)"\s*\]/i.exec(body);
    let rest = body.replace(/#says\[\s*"[^"]*"\s*\]/gi, ' ');
    const atoms = [];
    rest = rest.replace(/~"([^"]*)"/g, (_, path) => { atoms.push({ sigil: '~', path }); return ' '; });
    const ATOM = /([~%*!&#^@])([a-z][a-z_]*)(?:\[([^\]]*)\])?/gi;
    [...rest.matchAll(ATOM)].forEach(([whole, sigil, word, arg]) => {
      atoms.push({ sigil, word, whole, args: arg == null ? [] : arg.split(',').map((a) => a.trim()) });
    });
    const built = buildPower(rawId, atoms, { says: says ? says[1] : '' });
    powers[built.power.id] = built.power;
    errors.push(...built.errors);
    const leftover = rest.replace(ATOM, '').trim();
    if (leftover) errors.push(`*${built.power.id}: “${leftover.slice(0, 40)}” was not read.`);
  });
  return { powers, errors };
}

/** A power in plain words: what it will do. */
export function describePower(power) {
  if (!power) return '';
  const parts = [
    ...Object.entries(power.timed).map(([k, s]) => `${WORDS[k]} for ${s} s`),
    ...Object.entries(power.amounts).map(([k, n]) => `+${Math.round(n * 100)}% ${WORDS[k]}`),
    ...Object.entries(power.charges).map(([k, n]) => `${WORDS[k]} ×${n}`),
    ...power.acts.map((k) => WORDS[k]),
    ...power.with.map((k) => `${k} comes up the lanes`),
    ...power.without.map((k) => `${k} ahead goes quiet`)
  ];
  return parts.join(' · ') || 'nothing';
}

/* ─── This visit's spells: the book's own, unless a link or the bench brought others ─── */
const VISIT_KEY = 'lore.pie.powers.visit';
const session = () => { try { return window.sessionStorage; } catch { return null; } };

export function visitSpells() {
  return session()?.getItem(VISIT_KEY) || '';
}

export function setVisitSpells(text) {
  try {
    if (text && text.trim()) session()?.setItem(VISIT_KEY, text.trim());
    else session()?.removeItem(VISIT_KEY);
  } catch { /* this page only */ }
}

/** ?powers= on arrival becomes this visit's spells (never saved as the reader's own). */
export function takePowersFromAddress() {
  try {
    const url = new URL(location.href);
    const given = url.searchParams.get('powers') || url.searchParams.get('rules');
    if (!given) return;
    setVisitSpells(given);
    url.searchParams.delete('powers');
    url.searchParams.delete('rules');
    history.replaceState(history.state, '', url.toString());
  } catch { /* no address to read */ }
}

/** The powers in play: the book's own, with this visit's replacing any of the same name. */
export function powersInPlay() {
  const own = readSpells(Object.values(POWER_SPELLS).join('\n')).powers;
  const visit = readSpells(visitSpells());
  const replaced = Object.keys(visit.powers).filter((id) => id in own);
  return { powers: { ...own, ...visit.powers }, replaced, errors: visit.errors };
}

/** A link that carries these spells, for someone else's visit. */
export function powersLink(text, href = location.href) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('powers', text.trim());
  return url.toString();
}

/* ─── The carry, written back as Spw ─── */

/**
 * A provenance card: how this pie came to be where it spilled. Perspective (@carry),
 * ground (.chapter, .carrier), measures counted (%), what was kept and foretold (~),
 * which spells it ran on and whose (*powers), and what ended it (^spilled).
 */
export function carryProvenance(c) {
  const list = (xs) => (xs.length ? xs.join(', ') : 'none');
  const lines = [
    `@carry[${c.date}]{`,
    `  .chapter[${c.chapter}]  .carrier[${c.carrier}]  .mode[${c.mode}]`,
    `  %carried{ cobbles: ${c.cobbles} waps: ${c.waps} perfect: ${c.perfects} satisfied: ${c.satisfied} }`,
    `  %pie{ tilt: ${c.tilt} crust: ${c.crust} filling: ${c.filling} }`,
    `  ~kept[${list(c.kept)}]`,
    `  ~foretold{ said: ${c.foretold.said} came: ${c.foretold.came} unsaid: ${c.foretold.unsaid} kind: ${c.foretold.kind} }`,
    `  %berries{ boon: ${c.berries.boon} bane_squashed: ${c.berries.squashed} bone: ${c.berries.bone} }`,
    `  *powers{ ${c.powers.length ? c.powers.map((p) => `${p.id}: ${p.whose}`).join(' ') : 'none used'} }`,
    `  ^spilled[${c.cause}]`
  ];
  // How the rules were read, and any tuning the visit carried.
  if (c.reader) lines.push(`  %rules{ reader: ${c.reader}${c.parseMs != null ? ` parse_ms: ${c.parseMs}` : ''} }`);
  if (c.tune && Object.keys(c.tune).length) lines.push(`  =tune{ ${Object.entries(c.tune).map(([k, v]) => `=${k}[${v}]`).join(' ')} }`);
  // The visit's own spells, when it carried with any: nested as written, so the card can be carried with again.
  if (c.spells) lines.push('  &spells{', ...c.spells.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => `    ${line}`), '  }');
  lines.push('}');
  return lines.join('\n');
}
