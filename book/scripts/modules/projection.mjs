/**
 * projection.mjs — the reader's projection, as a Spw spell (PLAN.E L27, L28).
 *
 * Every page of a reader's copy is projected from the same canon through the
 * reader's own choices, what a link gave this visit, and what their carries
 * did. This module says that projection as one Spw expression, and takes one
 * back as the source:
 *
 *   @reader{
 *     =lens[bone]                     the reading lens   (or =genre{ boon: 50 bane: 30 bone: 20 })
 *     =audience[pg]                   what this copy shows (pg13 only through the late table and a household key)
 *     =room[lamp]  =binding[glass]    the room's light, the cover
 *     =edition[winter]                one telling of every turning phrase
 *     =with[living]  =without[wonders]   switches
 *     ~carries{ c6: bane held · c14: boon }   what the carries did (pie-carries.mjs)
 *     %carries{ carried: 2 held: 1 won_back: 0 }   recorded measures: counted, never chosen
 *     !plain[carries]                 read without the carries' lean
 *     =palette[pool]{ colour type }   the palette the chapter wears, a layer for each way it was finished (collection.mjs)
 *     %kept{ cards: 12 palettes: 3 layers: 5 }   what has been kept across the site: counted, never chosen
 *     .chapter[15]                    where it is being read
 *     ^projects[chapter, game, folio_value]
 *   }
 *
 *   @ perspective: whose reading · = config, the bias · % measure, what was counted
 *   (a measure is recorded, never set by a spell from a link) · ~ potential, what the
 *   carries leave leaning · ! action, an override · . ground, the page itself ·
 *   ^ integration: what the projection binds upward into.
 *
 * Read it on a chapter ("Read this way because…"): each line says where it
 * came from — yours, this visit's, your carries', or the book's own. Edit it
 * and read the chapter again, or pass it along as ?spell=. A spell from a link
 * becomes this visit's story directions (story-directions.mjs: never saved as
 * the reader's own unless they keep it) and can only ever lower the audience.
 */

import { readStory, storyLink } from './story-directions.mjs?v=2026_11_09.L';
import { readCarries, leanOf, projectionOn } from './pie-carries.mjs?v=2026_11_08.J';
import { renderSpell } from './spw-spell.mjs?v=2026_11_12.A';
import { readWay, waySpell } from './way-through.mjs?v=2026_11_12.A';

const NOOK_KEY = 'lore.nook.v1';
const AUDIENCE_KEY = 'lore.audience.v1';
const PLAIN_VISIT_KEY = 'lore.pie.projection.visit';
const PALETTE_VISIT_KEY = 'lore.palettes.visit';
const LENSES = ['boon', 'bane', 'bone', 'balanced'];
const ROOMS = ['day', 'dusk', 'lamp'];
const BINDINGS = ['rag', 'glass', 'salt', 'ember', 'slate', 'starfield'];
export const AUDIENCES = Object.freeze(['pg', 'pg13']);

const readJSON = (store, key) => {
  try { return JSON.parse(store?.getItem(key) || '{}') || {}; } catch { return {}; }
};
const local = () => { try { return window.localStorage; } catch { return null; } };
const session = () => { try { return window.sessionStorage; } catch { return null; } };

/** What this copy may show, and what it shows: pg unless the late table and the household both allow more. */
export function readAudience() {
  const stored = readJSON(local(), AUDIENCE_KEY);
  const allowed = stored.lateTable && stored.household !== 'pg' ? 'pg13' : 'pg';
  const visit = readJSON(session(), AUDIENCE_KEY).level;
  const wanted = AUDIENCES.includes(visit) ? visit : AUDIENCES.includes(stored.level) ? stored.level : 'pg';
  // Never above what the household allows.
  const level = AUDIENCES.indexOf(wanted) <= AUDIENCES.indexOf(allowed) ? wanted : allowed;
  return { level, allowed, lateTable: Boolean(stored.lateTable), household: stored.household || null };
}

/** The reader's projection now, clause by clause, with where each clause came from. */
export function readProjection({ chapter = 0, palette = null } = {}) {
  const nook = readJSON(local(), NOOK_KEY);
  const story = readStory();
  const clauses = [];
  const from = (visitHas) => (visitHas ? 'visit' : 'yours');
  if (story.lens || story.genre) {
    if (story.lens) clauses.push({ key: 'lens', value: story.lens, source: 'visit' });
    else clauses.push({ key: 'genre', value: story.genre, source: 'visit' });
  } else if (nook.genre) {
    clauses.push({ key: 'genre', value: nook.genre, source: 'yours' });
  } else if (LENSES.includes(nook.lens)) {
    clauses.push({ key: 'lens', value: nook.lens, source: 'yours' });
  } else {
    clauses.push({ key: 'lens', value: 'balanced', source: 'book' });
  }
  const audience = readAudience();
  clauses.push({ key: 'audience', value: audience.level, source: audience.level === 'pg' && !audience.lateTable ? 'book' : 'yours' });
  if (story.room || nook.room) clauses.push({ key: 'room', value: story.room || (typeof nook.room === 'string' ? nook.room : null), source: from(story.room) });
  const binding = story.binding || nook.binding;
  if (binding) clauses.push({ key: 'binding', value: binding, source: from(story.binding) });
  if (story.edition) clauses.push({ key: 'edition', value: story.edition, source: 'visit' });
  if (story.with?.length) clauses.push({ key: 'with', value: story.with, source: 'visit' });
  if (story.without?.length) clauses.push({ key: 'without', value: story.without, source: 'visit' });
  const carries = Object.entries(readCarries()).sort((a, b) => Number(a[0]) - Number(b[0]));
  if (carries.length) {
    clauses.push({
      key: 'carries',
      value: carries.map(([n, entry]) => ({ n: Number(n), lean: leanOf(entry.lean) || 'even', held: entry.maw === 'won', back: entry.maw === 'back' })),
      source: 'carries'
    });
    clauses.push({
      key: 'measures',
      value: { carried: carries.length, held: carries.filter(([, e]) => e.maw === 'won').length, won_back: carries.reduce((sum, [, e]) => sum + (e.wonBack || 0), 0) },
      source: 'carries'
    });
    if (!projectionOn()) clauses.push({ key: 'plain', value: 'carries', source: session()?.getItem(PLAIN_VISIT_KEY) === 'off' ? 'visit' : 'yours' });
  }
  const way = readWay();
  if (way.aside.length || way.apart.length) clauses.push({ key: 'way', value: way, source: way.source === 'visit' ? 'visit' : 'yours' });
  if (palette?.wearing) clauses.push({ key: 'palette', value: { id: palette.id, layers: palette.layers }, source: 'kept' });
  else if (palette?.layers?.length) clauses.push({ key: 'plain', value: 'palette', source: session()?.getItem(PALETTE_VISIT_KEY) === 'off' ? 'visit' : 'yours' });
  if (palette?.kept && (palette.kept.cards || palette.kept.palettes)) clauses.push({ key: 'kept', value: palette.kept, source: 'kept' });
  if (chapter) clauses.push({ key: 'chapter', value: chapter, source: 'page' });
  clauses.push({ key: 'projects', value: ['chapter', 'game', 'folio_value'], source: 'book' });
  return clauses.filter((c) => c.value != null && c.value !== '');
}

const weightsText = (genre) => {
  const total = (genre.boon || 0) + (genre.bane || 0) + (genre.bone || 0) || 1;
  return ['boon', 'bane', 'bone'].map((id) => `${id}: ${Math.round(((genre[id] || 0) / total) * 100)}`).join(' ');
};

/** One clause as Spw. */
export function clauseText(clause) {
  const v = clause.value;
  switch (clause.key) {
    case 'lens': return `=lens[${v}]`;
    case 'genre': return `=genre{ ${weightsText(v)} }`;
    case 'audience': return `=audience[${v}]`;
    case 'way': return waySpell(v);
    case 'room': return `=room[${v}]`;
    case 'binding': return `=binding[${v}]`;
    case 'edition': return `=edition[${v}]`;
    case 'with': return `=with[${v.join(', ')}]`;
    case 'without': return `=without[${v.join(', ')}]`;
    case 'carries': return `~carries{ ${v.map((c) => `c${c.n}: ${c.lean}${c.held ? ' held' : c.back ? ' won-back' : ''}`).join(' · ')} }`;
    case 'measures': return `%carries{ ${Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' ')} }`;
    case 'plain': return `!plain[${v}]`;
    case 'palette': return `=palette[${v.id}]{ ${v.layers.join(' ')} }`;
    case 'kept': return `%kept{ ${Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' ')} }`;
    case 'chapter': return `.chapter[${v}]`;
    case 'projects': return `^projects[${v.join(', ')}]`;
    default: return '';
  }
}

/** What a clause does, in plain words. */
export function clauseGloss(clause) {
  const v = clause.value;
  const who = { yours: 'your own setting', visit: 'from a link, for this visit', carries: 'what your carries did', kept: 'what you have kept', book: 'the book’s own', page: 'this page' }[clause.source] || '';
  const said = {
    lens: v === 'balanced' ? 'every paragraph at full presence' : `paragraphs that lean ${v} come forward`,
    genre: 'paragraphs weighted by the three lands',
    audience: v === 'pg' ? 'what every copy shows until the late table is answered' : 'the late themes are open in this copy',
    way: 'chapters stepped over and people kept apart; a chapter it changes says so and marks the words',
    room: `the room’s light: ${v}`,
    binding: `the cover: ${v}`,
    edition: `every turning phrase in its ${v} telling`,
    with: `switched on: ${Array.isArray(v) ? v.join(', ') : v}`,
    without: `switched off: ${Array.isArray(v) ? v.join(', ') : v}`,
    carries: 'each carried chapter leans its reading a little; where the mimes hold one, its pie words go quiet',
    measures: 'recorded measures: what was counted, not chosen; a spell from a link cannot change them',
    plain: v === 'palette' ? 'read in the binding’s own colours, without the palette you earned' : 'read without the carries’ lean',
    palette: `the chapter wears the palette it was finished into, in ${Array.isArray(v?.layers) ? v.layers.join(', ') : ''}; earned, never chosen, so a link cannot lend it`,
    kept: 'recorded measures: cards turned, palettes begun and their layers, across the whole site',
    chapter: 'where it is being read',
    projects: 'what this projection is bound into: the chapters, the game, a folio’s value'
  }[clause.key] || '';
  return `${said}${who ? ` (${who})` : ''}`;
}

export function projectionSpell(clauses) {
  return ['@reader{', ...clauses.map((c) => `  ${clauseText(c)}`), '}'].join('\n');
}

/** A spell, read back: the parts a link may carry. Unknown lines are ignored, not guessed. */
export function parseSpell(text) {
  const src = String(text || '');
  const one = (key, allowed) => {
    const m = new RegExp(`=${key}\\[([a-z0-9-]+)\\]`, 'i').exec(src);
    const v = m?.[1]?.toLowerCase();
    return v && (!allowed || allowed.includes(v)) ? v : null;
  };
  const many = (key) => {
    const m = new RegExp(`=${key}\\[([^\\]]*)\\]`, 'i').exec(src);
    return m ? m[1].split(',').map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z][a-z-]*$/.test(s)) : null;
  };
  const story = {};
  const lens = one('lens', LENSES);
  const g = /=genre\{([^}]*)\}/i.exec(src);
  if (lens) story.lens = lens;
  else if (g) {
    const genre = {};
    g[1].replace(/(boon|bane|bone)\s*:\s*(\d*\.?\d+)/gi, (_, id, n) => { genre[id.toLowerCase()] = Number(n); return ''; });
    if (Object.values(genre).some((n) => n > 0)) story.genre = genre;
  }
  const room = one('room', ROOMS);
  if (room) story.room = room;
  const binding = one('binding', BINDINGS);
  if (binding) story.binding = binding;
  const edition = one('edition');
  if (edition) story.edition = edition;
  const withs = many('with');
  if (withs?.length) story.with = withs;
  const withouts = many('without');
  if (withouts?.length) story.without = withouts;
  return {
    story,
    audience: one('audience', AUDIENCES),
    plain: /!plain\[carries\]/i.test(src),
    plainPalette: /!plain\[palette\]/i.test(src)
  };
}

/** Read this page through a spell: a link of story directions (never saved), the audience only lowered. */
export function spellHref(text, href = location.href) {
  const { story, audience, plain, plainPalette } = parseSpell(text);
  const url = new URL(storyLink({ story, href }));
  url.searchParams.delete('spell');
  if (audience === 'pg') url.searchParams.set('audience', 'pg');
  const plains = [plain && 'carries', plainPalette && 'palette'].filter(Boolean);
  if (plains.length) url.searchParams.set('plain', plains.join(','));
  return url.toString();
}

/** On arrival: ?spell= becomes story directions; ?audience=pg and ?plain=carries hold for the visit. */
export function takeSpellFromAddress() {
  let url;
  try { url = new URL(location.href); } catch { return false; }
  const spell = url.searchParams.get('spell');
  if (spell) {
    location.replace(spellHref(spell));
    return true;
  }
  if (url.searchParams.get('audience') === 'pg') {
    try { session()?.setItem(AUDIENCE_KEY, JSON.stringify({ level: 'pg' })); } catch { /* this page only */ }
  }
  const plains = (url.searchParams.get('plain') || '').split(',');
  if (plains.includes('carries')) {
    try { session()?.setItem(PLAIN_VISIT_KEY, 'off'); } catch { /* this page only */ }
  }
  if (plains.includes('palette')) {
    try { session()?.setItem(PALETTE_VISIT_KEY, 'off'); } catch { /* this page only */ }
  }
  return false;
}

/* ─── On a chapter: "Read this way because…" ─── */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

export function initProjectionSpell({ chapterData } = {}) {
  if (takeSpellFromAddress()) return () => {};
  const main = document.getElementById('chapter-content') || document.querySelector('main.chapter');
  const first = main?.querySelector(':scope > [data-ebook-section]');
  if (!main || !first) return () => {};
  const n = Number(chapterData?.chapterNumber || document.body.dataset.chapter || 0);
  let clauses = readProjection({ chapter: n });
  const area = el('textarea', { className: 'projection-spell-edit', rows: String(clauses.length + 2), spellcheck: 'false', 'aria-label': 'A spell to read this chapter through' });
  area.value = projectionSpell(clauses);
  const status = el('p', { className: 'projection-spell-status', role: 'status' });
  const read = el('button', { type: 'button', className: 'projection-spell-go' }, 'Read it this way');
  read.addEventListener('click', () => { location.href = spellHref(area.value); });
  const copy = el('button', { type: 'button', className: 'projection-spell-copy' }, 'Copy a link that reads this way');
  copy.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('spell', area.value);
    try {
      await navigator.clipboard.writeText(url.toString());
      status.textContent = 'Copied. Whoever opens it reads this chapter through your spell, for their visit only; their own settings stay theirs.';
    } catch {
      status.textContent = url.toString();
    }
  });
  const peekText = () => clauses.filter((c) => c.source !== 'book' && c.key !== 'chapter').map(clauseText).join(' ') || '@reader{ the book’s own }';
  // Each line lit as a spell: its sigils in their roles, and what it does said as it is touched.
  const lineItems = () => clauses.map((c) => {
    const spell = renderSpell(clauseText(c), { cast: false, explain: () => clauseGloss(c) });
    spell.classList.add('is-compact');
    return el('li', { className: `is-${c.source}` }, spell, el('span', {}, ` — ${clauseGloss(c)}`));
  });
  const peek = el('code', { className: 'projection-spell-peek' }, peekText());
  const lines = el('ol', { className: 'projection-spell-lines' }, ...lineItems());
  const details = el('details', { className: 'projection-spell' },
    el('summary', {},
      el('span', { className: 'projection-spell-sigil', 'aria-hidden': 'true' }, '@'),
      ' Read this way because… ',
      peek),
    el('div', { className: 'projection-spell-body' },
      el('p', {}, 'This chapter is projected from the book through one Spw spell: what you set, what a link gave this visit, what your carries did, and what you have kept. Each line says where it came from. Change a line and read it again; pass it along and someone else reads it your way, for their visit only.'),
      lines,
      area,
      el('p', { className: 'projection-spell-actions' }, read, ' ', copy),
      status));
  main.insertBefore(details, first);
  // The palette arrives after the page (collection.mjs): the spell says so when it does.
  const onPalette = (event) => {
    const edited = area.value !== projectionSpell(clauses);
    clauses = readProjection({ chapter: n, palette: event.detail });
    peek.textContent = peekText();
    lines.replaceChildren(...lineItems());
    if (!edited) {
      area.value = projectionSpell(clauses);
      area.rows = clauses.length + 2;
    }
  };
  document.addEventListener('lore:palette', onPalette);
  return () => {
    document.removeEventListener('lore:palette', onPalette);
    details.remove();
  };
}
