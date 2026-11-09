/**
 * unlocks.mjs — the game's mechanics, unlocked by weight (.spw/runtime/mechanics.spw).
 *
 * Each mechanic is one sentence with a page of its own (pie/unlocks/<page>/, written by npm run unlocks:build).
 * It unlocks by weight: the measures a reader already keeps (rooms read, wonders kept, cards turned, rhythms
 * found, carries finished), each weighted for that mechanic, add up toward its %unlock. A measure may be capped
 * (carries count to twelve), so reading always counts for more than repeating.
 *
 *   open(id)        whether the mechanic is open now: kept, earned, tried for this visit, or not yet loaded
 *   standing(id)    { open, why, have, need, parts } for a page or a sheet to say where the reader stands
 *   earn()          keeps any mechanic whose weight is reached; returns the ones newly kept (and says so)
 *
 * What was open before unlocks existed stays open for a reader who was here then: the first time this runs in a
 * browser, a reader who had finished a carry keeps every mechanic marked &before[open]. ?try=page (or several,
 * comma-separated) opens a mechanic for the visit (sessionStorage), as a link's settings always have. A slow or
 * failed fetch never closes anything: until the registry has loaded, every mechanic reads as open.
 *
 * Kept in lore.unlocks.v1 = { since, kept: { id: { at, by: 'weight' | 'before' } } }; begin-again leaves it be.
 */

export const MECHANICS_URL = '/.spw/runtime/mechanics.spw';
export const UNLOCK_EVENT = 'lore:unlock';
const STORE = 'lore.unlocks.v1';
const VISIT = 'lore.unlocks.visit';

/* ─── Reading the registry: a small reader for a plain, regular file ─── */

const blockOf = (text, name) => {
  const at = text.indexOf(`!${name}{`);
  if (at < 0) return '';
  const open = text.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') { depth -= 1; if (depth === 0) return text.slice(open + 1, i); }
  }
  return '';
};
const entriesOf = (block) => [...block.matchAll(/\*([a-z0-9_]+)\{([^\n]*)\}\s*$/gim)].map((m) => [m[1], m[2]]);
const field = (body, op, label) => {
  const m = body.match(new RegExp(`\\${op}${label}\\[("([^"]*)"|[^\\]]*)\\]`));
  return m ? (m[2] !== undefined ? m[2] : m[1].trim()) : null;
};
const weighOf = (body) => {
  const inner = (body.match(/%weigh\{([^}]*)\}/) || [])[1] || '';
  return Object.fromEntries([...inner.matchAll(/%([a-z_]+)\[([0-9.]+)\]/g)].map((m) => [m[1], Number(m[2])]));
};

/** The registry's text → { measures: { id: { says, cap, key } }, mechanics: { id: { … } } }. Never throws. */
export function readMechanics(text = '') {
  const measures = {};
  const mechanics = {};
  try {
    entriesOf(blockOf(text, 'measures')).forEach(([id, body]) => {
      measures[id] = { says: field(body, '#', 'says') || id, cap: Number(field(body, '%', 'cap')) || null, key: (body.match(/~"([^"]+)"/) || [])[1] || null };
    });
    entriesOf(blockOf(text, 'mechanics')).forEach(([id, body]) => {
      mechanics[id] = {
        id,
        name: field(body, '#', 'name') || id,
        says: field(body, '#', 'says') || '',
        unlock: Number(field(body, '%', 'unlock')) || 0,
        weigh: weighOf(body),
        before: field(body, '&', 'before') || 'locked',
        page: field(body, '.', 'page') || id.replace(/_/g, '-'),
        floor: field(body, '#', 'floor') || '',
        where: (body.match(/~"([^"]+)"\s*$/) || [])[1] || null
      };
    });
  } catch { /* a registry that will not read closes nothing */ }
  return { measures, mechanics };
}

let registry = null;
let loading = null;
/** Fetch and read the registry once; resolves to the same object every time. */
export function loadMechanics() {
  if (registry) return Promise.resolve(registry);
  if (!loading) {
    loading = fetch(MECHANICS_URL).then((r) => (r.ok ? r.text() : '')).catch(() => '').then((text) => {
      registry = readMechanics(text);
      firstLook();
      readTry();
      return registry;
    });
  }
  return loading;
}
export const mechanics = () => registry?.mechanics || {};

/* ─── What the reader keeps (counted, never chosen) ─── */

const local = () => { try { return window.localStorage; } catch { return null; } };
const session = () => { try { return window.sessionStorage; } catch { return null; } };
const readJSON = (store, key, fallback) => { try { return JSON.parse(store?.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const count = (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0);

export function measuresNow() {
  const ls = local();
  const rooms = Object.values(readJSON(ls, 'lore.rooms.v1', {}) || {}).reduce((sum, list) => sum + count(list), 0);
  const pie = readJSON(ls, 'lore.pie.v1', {}) || {};
  const cards = new Set([...Object.keys(readJSON(ls, 'lore.cards.v1', {}) || {}), ...(Array.isArray(pie.cards) ? pie.cards : [])]);
  return {
    rooms,
    wonders: count(readJSON(ls, 'lore.almanac.v1', {})),
    cards: cards.size,
    rhythms: count(readJSON(ls, 'lore.pie.rhythms.v1', {})),
    carries: Number(pie.runs) || 0
  };
}

/** How far a reader stands toward one mechanic: each measure counted (to its cap), times its weight. */
export function weightOf(mech, measures = measuresNow()) {
  const caps = registry?.measures || {};
  const parts = Object.entries(mech?.weigh || {}).map(([measure, weight]) => {
    const raw = Number(measures[measure]) || 0;
    const cap = caps[measure]?.cap;
    const counted = cap ? Math.min(raw, cap) : raw;
    return { measure, count: raw, counted, cap: cap || null, weight, adds: counted * weight, says: caps[measure]?.says || measure };
  });
  const have = parts.reduce((sum, p) => sum + p.adds, 0);
  return { have: Math.round(have * 100) / 100, need: mech?.unlock || 0, parts };
}

/* ─── Kept, tried, open ─── */

const readKept = () => readJSON(local(), STORE, null);
const writeKept = (value) => { try { local()?.setItem(STORE, JSON.stringify(value)); } catch { /* the visit keeps it */ } };
const today = () => new Date().toISOString().slice(0, 10);

/** The first look in a browser: a reader who had carried before keeps what was open before. Once. */
function firstLook() {
  if (readKept()) return;
  const carried = (Number(readJSON(local(), 'lore.pie.v1', {})?.runs) || 0) > 0;
  const kept = {};
  if (carried) Object.values(mechanics()).forEach((m) => { if (m.before === 'open') kept[m.id] = { at: today(), by: 'before' }; });
  writeKept({ since: today(), kept });
}

const idFrom = (word) => {
  const w = String(word || '').trim().toLowerCase();
  return Object.values(mechanics()).find((m) => m.page === w || m.id === w.replace(/-/g, '_'))?.id || null;
};
function readTry() {
  try {
    const asked = (new URL(window.location.href).searchParams.get('try') || '').split(',').map(idFrom).filter(Boolean);
    if (!asked.length) return;
    const visit = new Set(readJSON(session(), VISIT, []));
    asked.forEach((id) => visit.add(id));
    session()?.setItem(VISIT, JSON.stringify([...visit]));
  } catch { /* not in a browser */ }
}
export const tried = (id) => readJSON(session(), VISIT, []).includes(id);

export function standing(id) {
  const mech = mechanics()[id];
  if (!mech) return { open: true, why: registry ? 'unknown' : 'loading', have: 0, need: 0, parts: [] };
  const weight = weightOf(mech);
  const kept = readKept()?.kept?.[id];
  if (kept) return { open: true, why: kept.by === 'before' ? 'before' : 'kept', ...weight };
  if (weight.have >= weight.need) return { open: true, why: 'weight', ...weight };
  if (tried(id)) return { open: true, why: 'visit', ...weight };
  return { open: false, why: 'locked', ...weight };
}
export const open = (id) => standing(id).open;

/** Keep every mechanic whose weight is reached. Returns the ones newly kept, and tells the page. */
export function earn() {
  if (!registry) return [];
  const store = readKept() || { since: today(), kept: {} };
  const fresh = Object.values(mechanics()).filter((m) => !store.kept[m.id] && weightOf(m).have >= m.unlock);
  if (!fresh.length) return [];
  fresh.forEach((m) => { store.kept[m.id] = { at: today(), by: 'weight' }; });
  writeKept(store);
  try { window.dispatchEvent(new CustomEvent(UNLOCK_EVENT, { detail: { mechanics: fresh } })); } catch { /* not in a browser */ }
  return fresh;
}

/* ─── Saying it ─── */

const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const say = (n) => (Number.isInteger(n) && n >= 0 && n < NUM.length ? NUM[n] : String(n));
const WORTH = (w) => (w === 1 ? 'one each' : w === 2 ? 'two each' : w === 0.5 ? 'half each' : w === 0.25 ? 'a quarter each' : `${w} each`);

/** How a mechanic unlocks, in words: "8 to unlock: rooms read, one each; rhythms found, two each; …". */
export function unlockWords(mech, measures = registry?.measures) {
  const caps = measures || {};
  const parts = Object.entries(mech?.weigh || {}).map(([measure, w]) => {
    const cap = caps[measure]?.cap;
    return `${caps[measure]?.says || measure}, ${WORTH(w)}${cap ? ` (up to ${say(cap)})` : ''}`;
  });
  return `${say(mech?.unlock || 0).replace(/^./, (c) => c.toUpperCase())} to unlock: ${parts.join('; ')}`;
}

/** Where the reader stands, in words. */
export function standingWords(id) {
  const s = standing(id);
  if (s.why === 'before') return 'Open: you were here before it was an unlock, so it stays yours.';
  if (s.why === 'kept') return 'Unlocked, and kept in this browser.';
  if (s.why === 'weight') return 'Unlocked: you have weight enough.';
  if (s.why === 'visit') return `Open for this visit (tried from a link). ${s.have} of ${s.need} toward keeping it.`;
  if (s.why === 'loading' || s.why === 'unknown') return '';
  return `${s.have} of ${s.need} toward unlocking it.`;
}

/** The spell for one mechanic, as the registry writes it. */
export function mechanicSpell(mech) {
  const weigh = Object.entries(mech.weigh || {}).map(([m, w]) => `%${m}[${w}]`).join(' ');
  return `*${mech.id}{ %unlock[${mech.unlock}] %weigh{ ${weigh} } .page["${mech.page}"] }`;
}
