/**
 * likeness.mjs — lore.land's own visual signature, and "find similar".
 *
 * Every story thing has a likeness: a room, a wonder, someone in the cast, a
 * palette, a study in the seed atlas, a card from the lanes. A likeness is the
 * dimensions the story itself gives a thing, drawn as one seal in the family of
 * the chamber seals (chamber-seals.mjs), so things that are alike look alike:
 *
 *   chapter     where the book first has it     petals, one per chapter (counting is reading)
 *   palette     its chapter's place-named colours  the ground, the wax and the marks
 *   sigil       its motion, one of the twelve   the glyph at the heart; the hour the petals start at
 *   container   [ ] window  { } room  ( ) gathering  < > passage
 *                                              the braces round the heart; the shape of each petal tip
 *   material    glass flour berry frost ink brass steam oak
 *                                              the texture of the outer ring
 *   valence     boon, bane or bone              a berry on the upper rim (boonberry, baneberry, boneberry)
 *   characters  who keeps it                    a pip in their colour along the lower rim
 *
 * "Find similar" opens a cluster of likenesses that rhyme on sight: rooms,
 * wonders, people, palettes, studies and cards that share a motion, a kind of
 * room, a material, a palette. Similarity is read from the canon alone
 * (book/content/world/likeness.json, built by `npm run spw:likeness`, which
 * uses the scoring below so the build and the page agree), never from what
 * other readers did. It is discovery inside the story, and it stays free.
 *
 * Partial discovery: by this reader's own shelves a thing is veiled, glimpsed or
 * found (discoveryOf), and any asset can wear that state (dressAsset, which sets
 * data-discovery for components/likeness.css).
 *
 * Host-neutral at import: the index tool imports the scoring and the seal.
 * Canon: .spw/surfaces/likeness.spw.
 */
import { CHARACTERS } from './characters.mjs?v=2026_11_08.W';
import { MATERIALS } from './materials.mjs?v=2026_11_08.H';

export const LIKENESS_URL = '/book/content/world/likeness.json';
export const ATLAS_HREF = '/seeds/2026-02-28/';

/* ─── The dimensions ─────────────────────────────────────────────────── */

export const CONTAINERS = Object.freeze({
  window: Object.freeze({ id: 'window', open: '[', close: ']', one: 'a window', many: 'windows' }),
  room: Object.freeze({ id: 'room', open: '{', close: '}', one: 'a room', many: 'rooms' }),
  gathering: Object.freeze({ id: 'gathering', open: '(', close: ')', one: 'a gathering', many: 'gatherings' }),
  passage: Object.freeze({ id: 'passage', open: '<', close: '>', one: 'a passage', many: 'passages' })
});
const CONTAINER_BY_GLYPH = Object.freeze({ '[': 'window', '{': 'room', '(': 'gathering', '<': 'passage' });

/* The twelve, in the spirit sequence's phase order (! ? ~ @ & * ^), then the
 * five without a phase. Each starts its petals at its own hour of the seal. */
export const SIGILS = Object.freeze(['!', '?', '~', '@', '&', '*', '^', '#', '.', '=', '%', '$']);
/* Motions, by role: the same ids room-signature.mjs ROOM_MOTIONS uses. */
export const MOTIONS = Object.freeze({
  '!': 'action', '?': 'probe', '~': 'potential', '@': 'perspective', '&': 'confluence', '*': 'value',
  '^': 'integration', '#': 'annotation', '.': 'ground', '=': 'lean', '%': 'measure', '$': 'substrate'
});

/*
 * The seed atlas's dimensions, as the book reads them (canon: likeness.spw#atlas_key).
 * Twelve dimensions take the twelve sigils one each; integration (set 00) and
 * ascension (set 01) are one dimension under two names; wonder is the
 * thirteenth and shares the probe with concept, a question before it is a
 * thing, with an echo of * (once kept, a wonder is a thing made real). The
 * motif shares & with subject: a thread where chapters meet and stay
 * themselves. Material says what each study is made of.
 */
export const DIMENSIONS = Object.freeze({
  action: Object.freeze({ sigil: '!', material: 'brass', gloss: 'struck, it rings' }),
  concept: Object.freeze({ sigil: '?', material: 'frost', gloss: 'a thought held still long enough to ask it' }),
  definition: Object.freeze({ sigil: '#', material: 'ink', gloss: 'written down, so it stays' }),
  ground: Object.freeze({ sigil: '.', material: 'flour', gloss: 'what everything is baked from' }),
  integration: Object.freeze({ sigil: '^', material: 'steam', gloss: 'warmth rising, binding as it goes' }),
  ascension: Object.freeze({ sigil: '^', material: 'steam', gloss: 'warmth rising, binding as it goes' }),
  mode: Object.freeze({ sigil: '=', material: 'glass', gloss: 'a way of looking, laminated' }),
  perspective: Object.freeze({ sigil: '@', material: 'glass', gloss: 'a lens, and whoever holds it' }),
  potential: Object.freeze({ sigil: '~', material: 'berry', gloss: 'a little borrowed summer, not spent yet' }),
  scene: Object.freeze({ sigil: '$', material: 'oak', gloss: 'the frame a moment stands in' }),
  subject: Object.freeze({ sigil: '&', material: 'ink', gloss: 'whoever is written into it' }),
  value: Object.freeze({ sigil: '*', material: 'brass', gloss: 'what rings true when it is counted' }),
  vibration: Object.freeze({ sigil: '%', material: 'steam', gloss: 'the hum under everything' }),
  wonder: Object.freeze({ sigil: '?', echo: '*', material: 'berry', gloss: 'lit from within' }),
  'story-motif': Object.freeze({ sigil: '&', material: 'flour', gloss: 'what the story keeps coming back to' })
});

/* Set 00 is the world being left (photographs, money, fashion): bane. Set 01 is
 * teal and amber lit from within, the book's own look: boon. The motif is a page
 * laid out, the notation underneath: bone. */
export const SET_VALENCE = Object.freeze({ '00': 'bane', '01': 'boon', motif: 'bone' });

/* The three readings (valence-lens.mjs) and the berry each wears on the rim (berries.json). */
export const VALENCES = Object.freeze({
  boon: Object.freeze({ id: 'boon', reading: 'fairy tale', angle: -135, fill: '#2c8b86', heart: '#e0a23a' }),
  bane: Object.freeze({ id: 'bane', reading: 'absurd reality', angle: -45, fill: '#3a1f45', heart: '#9a7ac8' }),
  bone: Object.freeze({ id: 'bone', reading: 'low magic', angle: -90, fill: '#efe6d6', heart: '#a8564a' })
});

const MATERIAL_WORDS = Object.freeze({
  glass: 'Bonk glass', flour: 'flour', berry: 'boonberries', frost: 'frost',
  ink: 'ink', brass: 'brass', steam: 'warmth', oak: 'oak'
});
const MATERIAL_IDS = new Set(MATERIALS.map((m) => m.id));

/* Where along the lower rim each person's pip sits (degrees, 0 = the right, 90 = the foot). */
const PIP_ANGLES = Object.freeze({
  boof: 150, ants: 132, genie: 30, bane: 48, boon: 66, bonewap: 114,
  porter: 96, clerk: 84, figure: 168, clown: 12, mime: 0
});
const CHARACTER_WORDS = Object.freeze({
  boof: 'Boof', ants: 'the torch-ants', genie: 'the Genie', bane: 'Mr. BaneWAP', boon: 'Mr. BoonWAP',
  bonewap: 'BoneWAP', porter: 'the porter', clerk: 'a feast clerk', figure: 'the figure in plain lines',
  clown: 'a clown', mime: 'a mime'
});

/*
 * Palette colours, mirrored from book/content/world/palettes.json so a seal can
 * be drawn before anything is fetched (and at build time). `npm run spw:likeness`
 * fails if this mirror drifts from palettes.json; likeness.json carries the live
 * copy, which replaces this one when it loads.
 */
const PALETTE_MIRROR = {
  pool: { name: 'The pool', chapter: 1, colors: { ground: '#efe9f6', ink: '#352d52', accent: '#3f78b5', glow: '#fbfaff', edge: '#a598c8' } },
  'grove-echo': { name: 'The grove', chapter: 2, colors: { ground: '#e9eee3', ink: '#1f2f26', accent: '#5f7a4e', glow: '#f2f1dc', edge: '#999869' } },
  'legal-pad': { name: 'The legal pad', chapter: 3, colors: { ground: '#f8eeb0', ink: '#1f2a44', accent: '#2b5aa6', glow: '#fffbe0', edge: '#c9b45a' } },
  announce: { name: 'The announcement', chapter: 4, colors: { ground: '#e9e0f0', ink: '#3d2457', accent: '#b98a55', glow: '#f3e7d6', edge: '#7d5a9e' } },
  rift: { name: 'The rift', chapter: 5, colors: { ground: '#e4ecea', ink: '#162a2c', accent: '#9a7b3c', glow: '#f1ead6', edge: '#2f4a4b' } },
  kiln: { name: 'The kiln', chapter: 6, colors: { ground: '#ece2ee', ink: '#3a1f45', accent: '#a8462b', glow: '#f6e3d8', edge: '#7b3f6e' } },
  oath: { name: 'The oath', chapter: 7, colors: { ground: '#e3ebee', ink: '#16252b', accent: '#2a5f8f', glow: '#eef3f4', edge: '#2a4d56' } },
  'watering-eye': { name: 'The watering eye', chapter: 8, colors: { ground: '#f6e4e6', ink: '#4a3226', accent: '#2f8e8a', glow: '#fff5f6', edge: '#c99aa0' } },
  'clown-downtown': { name: 'Clown downtown', chapter: 9, colors: { ground: '#e8e9d9', ink: '#3b3f24', accent: '#2d8a8a', glow: '#ebe4f4', edge: '#8c8f55' } },
  'land-tree': { name: 'The land tree', chapter: 10, colors: { ground: '#f1e4f3', ink: '#3b1d4a', accent: '#c2347c', glow: '#f7e6f1', edge: '#7a3f9a' } },
  'pale-moon': { name: 'The pale moon', chapter: 11, colors: { ground: '#f0ebe6', ink: '#4b1a24', accent: '#8a2c3f', glow: '#efe9d8', edge: '#9b9696' } },
  'rain-bonk': { name: 'The rain', chapter: 12, colors: { ground: '#e8f5ee', ink: '#2f3a2a', accent: '#e0507a', glow: '#fff3b8', edge: '#d8423a' } },
  'shell-swirl': { name: 'The shell', chapter: 13, colors: { ground: '#e3eeea', ink: '#23423f', accent: '#2c8b86', glow: '#ffffff', edge: '#6f5a7a' } },
  'hill-moon': { name: 'The hill', chapter: 14, colors: { ground: '#ece4f2', ink: '#1f3326', accent: '#5d6a73', glow: '#f4f2ee', edge: '#1b1b1b' } },
  'three-stools': { name: 'Three stools', chapter: 15, colors: { ground: '#d6e6e5', ink: '#123a3e', accent: '#1d5a60', glow: '#f2f0e6', edge: '#0f2a2e' } },
  'mime-wash': { name: 'The mime wash', chapter: null, colors: { ground: '#dfe3ea', ink: '#3c4555', accent: '#8a95a8', glow: '#eef0f4', edge: '#6c5a8e' } }
};
export const PALETTE_COLORS_MIRROR = PALETTE_MIRROR;
let palettes = PALETTE_MIRROR;
const NEUTRAL = Object.freeze({ ground: '#ece6dc', ink: '#2b2f38', accent: '#5f6672', glow: '#f7f3ec', edge: '#9a948a' });

const paletteForChapter = (chapter) => Object.keys(palettes).find((id) => palettes[id].chapter === chapter) || null;
const paletteColors = (id) => palettes[id]?.colors || NEUTRAL;

/* ─── Small helpers ──────────────────────────────────────────────────── */

const pad = (n) => String(n).padStart(2, '0');
const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
export const chapterName = (n) => `Chapter ${NUMBER_WORDS[n] || n}`;
const fx = (v) => Number(v.toFixed(2));
const esc = (text) => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function hashString(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = (hex) => {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
};
const toHex = (parts) => `#${parts.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const list = (parts) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`);

/* ─── A likeness, read ───────────────────────────────────────────────── */

function containerId(value) {
  if (!value) return null;
  if (CONTAINERS[value]) return value;
  return CONTAINER_BY_GLYPH[String(value).trim()[0]] || null;
}

/**
 * The signature dimensions of any story thing, normalised.
 * @param {{ id?, kind?, title?, chapter?, sigil?, echo?, container?, material?, palette?, valence?, characters? }} item
 */
export function likenessOf(item = {}) {
  const sigilRaw = String(item.sigil || '').trim()[0];
  const sigil = SIGILS.includes(sigilRaw) ? sigilRaw : null;
  const chapter = Number.isInteger(Number(item.chapter)) && Number(item.chapter) > 0 ? Number(item.chapter) : null;
  const palette = palettes[item.palette] ? item.palette : (chapter ? paletteForChapter(chapter) : null);
  const people = Array.isArray(item.characters) ? item.characters : (item.characters ? [item.characters] : []);
  return {
    id: String(item.id || ''),
    kind: String(item.kind || (item.id ? String(item.id).split(':')[0] : 'thing')),
    title: String(item.title || ''),
    chapter,
    palette,
    sigil,
    echo: SIGILS.includes(item.echo) ? item.echo : null,
    motion: sigil ? MOTIONS[sigil] : null,
    container: containerId(item.container),
    material: MATERIAL_IDS.has(item.material) ? item.material : null,
    valence: VALENCES[item.valence] ? item.valence : null,
    characters: [...new Set(people.filter((id) => CHARACTERS[id]))]
  };
}

/* ─── Alike: one score, shared by the build (near) and the page (similar) ── */

const WEIGHT = Object.freeze({ sigil: 3, echo: 1.5, container: 2, material: 2, chapter: 1.5, palette: 2, sameplace: 0.5, near: 0.5, valence: 1, character: 1.25 });

/** How alike two things are, and in what. */
export function likenessScore(a, b) {
  const A = likenessOf(a);
  const B = likenessOf(b);
  const shared = [];
  if (A.sigil && A.sigil === B.sigil) shared.push({ dim: 'sigil', value: A.sigil, w: WEIGHT.sigil });
  else if (A.sigil && B.sigil && (A.echo === B.sigil || B.echo === A.sigil)) {
    shared.push({ dim: 'echo', value: A.echo === B.sigil ? B.sigil : A.sigil, w: WEIGHT.echo });
  }
  if (A.container && A.container === B.container) shared.push({ dim: 'container', value: A.container, w: WEIGHT.container });
  if (A.material && A.material === B.material) shared.push({ dim: 'material', value: A.material, w: WEIGHT.material });
  if (A.chapter && A.chapter === B.chapter) {
    shared.push({ dim: 'chapter', value: A.chapter, w: WEIGHT.chapter + (A.palette && A.palette === B.palette ? WEIGHT.sameplace : 0) });
  } else if (A.palette && A.palette === B.palette) {
    shared.push({ dim: 'palette', value: A.palette, w: WEIGHT.palette });
  } else if (A.chapter && B.chapter && Math.abs(A.chapter - B.chapter) === 1) {
    shared.push({ dim: 'near', value: Math.min(A.chapter, B.chapter), w: WEIGHT.near });
  }
  if (A.valence && A.valence === B.valence) shared.push({ dim: 'valence', value: A.valence, w: WEIGHT.valence });
  A.characters.filter((id) => B.characters.includes(id)).slice(0, 2)
    .forEach((id) => shared.push({ dim: 'character', value: id, w: WEIGHT.character }));
  return { score: shared.reduce((sum, s) => sum + s.w, 0), shared };
}

function phrase(s) {
  switch (s.dim) {
    case 'sigil': return `the same ${s.value}`;
    case 'echo': return `an echo of ${s.value}`;
    case 'container': return `both ${CONTAINERS[s.value].many}`;
    case 'material': return MATERIAL_WORDS[s.value] || s.value;
    case 'chapter': return `both in ${chapterName(s.value)}`;
    case 'palette': {
      const name = palettes[s.value]?.name || s.value;
      return `${name.replace(/^The /, 'the ')}’s colours`;
    }
    case 'near': return 'a chapter apart';
    case 'valence': return `both lean ${s.value}`;
    case 'character': return `${CHARACTER_WORDS[s.value] || s.value} in both`;
    default: return '';
  }
}

/** Plain words for what two things share: "the same ~, both passages and frost". */
export function whyWords(shared = []) {
  const top = [...shared].sort((a, b) => b.w - a.w).slice(0, 3).map(phrase).filter(Boolean);
  return top.length ? list(top) : 'a distant rhyme';
}

/**
 * The nearest things to `target` among `items`, a cluster that crosses kinds:
 * the best of each kind first (when it is close enough), then the closest, at
 * most `perKind` of a kind until there is nothing else near.
 */
export function nearest(target, items, { n = 8, kinds = null, perKind = 3, min = 2 } = {}) {
  const A = likenessOf(target);
  const scored = [];
  for (const item of items) {
    if (!item || (A.id && item.id === A.id)) continue;
    if (kinds && !kinds.includes(item.kind)) continue;
    const { score, shared } = likenessScore(A, item);
    if (score >= min) scored.push({ item, score, shared });
  }
  scored.sort((a, b) => b.score - a.score || String(a.item.id).localeCompare(String(b.item.id)));
  if (!scored.length) return [];
  const floor = Math.max(min, scored[0].score * 0.5);
  const picked = [];
  const count = {};
  const take = (entry) => {
    picked.push(entry);
    count[entry.item.kind] = (count[entry.item.kind] || 0) + 1;
  };
  const firsts = new Map();
  scored.forEach((entry) => { if (!firsts.has(entry.item.kind) && entry.score >= floor) firsts.set(entry.item.kind, entry); });
  [...firsts.values()].slice(0, n).forEach(take);
  for (const entry of scored) {
    if (picked.length >= n) break;
    if (!picked.includes(entry) && (count[entry.item.kind] || 0) < perKind) take(entry);
  }
  for (const entry of scored) {
    if (picked.length >= n) break;
    if (!picked.includes(entry)) take(entry);
  }
  return picked
    .sort((a, b) => b.score - a.score || String(a.item.id).localeCompare(String(b.item.id)))
    .map((entry) => ({ item: entry.item, score: fx(entry.score), why: whyWords(entry.shared) }));
}

/* ─── The data ───────────────────────────────────────────────────────── */

let data = null;
let dataPromise = null;

function parseId(id) {
  const [kind, rest = ''] = String(id).split(':');
  if (kind === 'room') {
    const [chapter, n] = rest.split('.').map(Number);
    return { id, kind, chapter: chapter || null, n: n || null };
  }
  return { id, kind };
}

const resolveItem = (itemOrId) => {
  if (!itemOrId) return null;
  if (typeof itemOrId === 'string') return data?.items?.[itemOrId] || parseId(itemOrId);
  return itemOrId.id && data?.items?.[itemOrId.id] && Object.keys(itemOrId).length <= 1 ? data.items[itemOrId.id] : itemOrId;
};

/** Fetch the likeness index once: { items: {id: item}, near: {id: [ids]}, palettes, dimensions }. */
export function loadLikeness() {
  if (!dataPromise) {
    const request = typeof fetch === 'function'
      ? fetch(LIKENESS_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null)
      : Promise.resolve(null);
    dataPromise = request.then((json) => {
      data = json && json.items ? { ...json, near: json.near || {} } : { items: {}, near: {}, palettes: {}, dimensions: DIMENSIONS };
      if (json?.palettes && Object.keys(json.palettes).length) palettes = { ...PALETTE_MIRROR, ...json.palettes };
      return data;
    });
  }
  return dataPromise;
}

/** One item from the loaded index, or null (before loadLikeness() resolves, or for an unknown id). */
export function likenessItem(id) {
  return data?.items?.[id] || null;
}

/** The nearest things, by the canon: [{ item, score, why }]. Needs loadLikeness() to have resolved. */
export function similar(itemOrId, { n = 6, kinds } = {}) {
  if (!data) return [];
  const item = resolveItem(itemOrId);
  if (!item) return [];
  const kindList = kinds ? [].concat(kinds) : null;
  const pre = !kindList && item.id ? data.near[item.id] : null;
  if (pre && pre.length >= n) {
    return pre.slice(0, n).map((id) => data.items[id]).filter(Boolean).map((other) => {
      const { score, shared } = likenessScore(item, other);
      return { item: other, score: fx(score), why: whyWords(shared) };
    });
  }
  return nearest(item, Object.values(data.items), { n, kinds: kindList });
}

/* ─── Discovery: veiled, glimpsed, found ─────────────────────────────── */

let shelfCache = null;
let shelfAt = 0;
const store = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};
const readKey = (key, fallback) => {
  try {
    const value = JSON.parse(store()?.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

/* The reader's own shelves, read at most every half second. */
function shelves() {
  const now = Date.now();
  if (shelfCache && now - shelfAt < 500) return shelfCache;
  const progress = readKey('lore.chapter.progress.v1', {});
  const visited = new Set((Array.isArray(progress?.visited) ? progress.visited : []).map(Number).filter(Boolean));
  const rooms = readKey('lore.rooms.v1', {}) || {};
  Object.entries(rooms).forEach(([c, read]) => { if (Array.isArray(read) && read.length) visited.add(Number(c)); });
  const almanac = readKey('lore.almanac.v1', {}) || {};
  Object.values(almanac).forEach((entry) => (entry?.places || []).forEach((c) => visited.add(Number(c))));
  const pie = readKey('lore.pie.v1', null);
  const cards = new Set(Object.keys(readKey('lore.cards.v1', {}) || {}));
  (pie?.cards || []).forEach((kind) => cards.add(kind));
  const adopted = readKey('lore.experience.seed-adopted', []);
  shelfCache = {
    visited,
    rooms,
    almanac,
    cards,
    lanes: Boolean(pie),
    palettes: readKey('lore.palettes.v1', {})?.earned || {},
    adopted: new Set(Array.isArray(adopted) ? adopted : [])
  };
  shelfAt = now;
  return shelfCache;
}

/** Read the shelves afresh on the next question (after something was just kept). */
export function refreshDiscovery() {
  shelfCache = null;
}

/**
 * 'veiled' | 'glimpsed' | 'found', from this reader's own shelves only.
 *   found     a room read · a wonder kept · someone met · a palette begun · a card turned ·
 *             a study kept in the atlas (or the chapter it belongs to finished into its palette)
 *   glimpsed  its chapter has been opened (things only in the lanes: once the lanes have been played)
 *   veiled    otherwise
 */
export function discoveryOf(itemOrId) {
  const item = resolveItem(itemOrId);
  if (!item?.id) return 'veiled';
  const s = shelves();
  const kind = item.kind || String(item.id).split(':')[0];
  const key = String(item.id).slice(kind.length + 1);
  const opened = (c) => Boolean(c) && s.visited.has(Number(c));
  const elsewhere = () => (!item.chapter && s.lanes ? 'glimpsed' : 'veiled');
  switch (kind) {
    case 'room': {
      const [c, n] = key.split('.').map(Number);
      if ((s.rooms[String(c)] || []).includes(n)) return 'found';
      return opened(c) ? 'glimpsed' : 'veiled';
    }
    case 'wonder':
      if (s.almanac[key]) return 'found';
      return opened(item.chapter) || (item.lives || []).some(opened) ? 'glimpsed' : 'veiled';
    case 'character':
      // Boof is on the cover; the cast counts her met from the start (home/app.mjs).
      if (key === 'boof' || s.cards.has(item.card || CHARACTERS[key]?.card)) return 'found';
      return opened(item.chapter) ? 'glimpsed' : elsewhere();
    case 'palette':
      if (s.palettes[key]) return 'found';
      return opened(item.chapter) ? 'glimpsed' : elsewhere();
    case 'card':
      if (s.cards.has(key)) return 'found';
      return opened(item.chapter) ? 'glimpsed' : elsewhere();
    case 'seed':
      if (item.adopt && s.adopted.has(item.adopt)) return 'found';
      if (item.chapter && item.palette && s.palettes[item.palette]) return 'found';
      return opened(item.chapter || item.home) ? 'glimpsed' : 'veiled';
    default:
      return 'veiled';
  }
}

/* The words a kind uses for being found, and what it is called before. */
const KIND_WORDS = Object.freeze({
  room: { one: 'room', found: 'read', veiled: (it) => `${CONTAINERS[it.container]?.one ? CONTAINERS[it.container].one.replace(/^a /, 'A ') : 'A room'} in ${it.chapter ? chapterName(it.chapter) : 'the book'}` },
  wonder: { one: 'wonder', found: 'kept', veiled: () => 'A wonder not yet found', glimpsed: (it) => it.hint || 'A wonder not yet kept' },
  character: { one: 'someone', found: 'met', veiled: () => 'Someone not yet met', glimpsed: (it) => (it.chapter ? `Not met yet: first in ${chapterName(it.chapter)}` : 'Not met yet: in the lanes') },
  palette: { one: 'palette', found: 'begun', veiled: () => 'A palette not yet begun' },
  seed: { one: 'study', found: 'kept', veiled: () => 'A study, still veiled' },
  card: { one: 'card', found: 'turned', veiled: () => 'A card not yet turned' }
});

/** What a reader may call a thing in its present state (a wonder's name waits until it is kept). */
export function shownTitle(item, state = discoveryOf(item)) {
  const words = KIND_WORDS[item.kind] || { veiled: () => 'Something not yet found' };
  if (state === 'found') return item.title;
  if (state === 'glimpsed') return words.glimpsed ? words.glimpsed(item) : item.title;
  return words.veiled(item);
}

const stateWord = (item, state) => (state === 'found' ? KIND_WORDS[item.kind]?.found || 'found' : state === 'glimpsed' ? 'glimpsed' : 'still veiled');

/* ─── The seal ───────────────────────────────────────────────────────── */

const C = 32;
const polar = (r, deg) => [fx(C + r * Math.cos((deg * Math.PI) / 180)), fx(C + r * Math.sin((deg * Math.PI) / 180))];

/* Cooled wax: a smooth closed curve through jittered radial points (as chamber-seals.mjs). */
function blobPath(rng, radius) {
  const count = 9;
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.22;
    const r = radius * (0.92 + rng() * 0.16);
    points.push([C + Math.cos(angle) * r, C + Math.sin(angle) * r]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let path = '';
  for (let i = 0; i < count; i += 1) {
    const next = points[(i + 1) % count];
    const a = mid(points[i], next);
    const b = mid(next, points[(i + 2) % count]);
    if (i === 0) path += `M${fx(a[0])} ${fx(a[1])}`;
    path += `Q${fx(next[0])} ${fx(next[1])} ${fx(b[0])} ${fx(b[1])}`;
  }
  return `${path}Z`;
}

/* The material ring: what the thing is made of, as a texture round the rim. */
function materialRing(material, ink, rng) {
  const ring = (attrs) => `<circle cx="32" cy="32" fill="none" stroke="${ink}" ${attrs}/>`;
  const around = (count, fn) => Array.from({ length: count }, (_, i) => fn((i / count) * 360 - 90, i)).join('');
  switch (material) {
    case 'glass':
      return ring('r="27" stroke-width="0.9" stroke-opacity="0.75"') + ring('r="29.1" stroke-width="0.6" stroke-opacity="0.45"')
        + around(4, (deg) => { const [x, y] = polar(28.05, deg + 45); return `<path d="M${x} ${fx(y - 1.7)}l1.7 1.7l-1.7 1.7l-1.7-1.7z" fill="${ink}" fill-opacity="0.55"/>`; });
    case 'flour':
      return ring('r="28" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0.01 2.55" stroke-opacity="0.7"');
    case 'berry':
      return around(14, (deg) => { const [x, y] = polar(28, deg); return `<circle cx="${x}" cy="${y}" r="1.35" fill="${ink}" fill-opacity="0.68"/>`; });
    case 'frost':
      return `<g stroke="${ink}" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.72">${around(24, (deg, i) => {
        const [r1, r2] = i % 2 ? [27.3, 28.8] : [26.3, 29.8];
        const [x1, y1] = polar(r1, deg);
        const [x2, y2] = polar(r2, deg);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      })}</g>`;
    case 'ink': {
      const circ = 2 * Math.PI * 28;
      const turn = fx(-90 + rng() * 360);
      const [bx, by] = polar(28, turn + 312);
      return `<circle cx="32" cy="32" r="28" fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.78" stroke-dasharray="${fx(circ * 0.87)} ${fx(circ * 0.13)}" transform="rotate(${turn} 32 32)"/><circle cx="${bx}" cy="${by}" r="1.5" fill="${ink}" fill-opacity="0.78"/>`;
    }
    case 'brass':
      return ring('r="27.3" stroke-width="2" stroke-opacity="0.62"')
        + `<g stroke="${ink}" stroke-width="0.9" stroke-opacity="0.7">${around(12, (deg) => {
          const [x1, y1] = polar(28.6, deg);
          const [x2, y2] = polar(30.3, deg);
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        })}</g>`;
    case 'steam': {
      let d = '';
      for (let i = 0; i <= 96; i += 1) {
        const deg = (i / 96) * 360;
        const [x, y] = polar(28 + Math.sin((i / 96) * Math.PI * 2 * 11) * 1.15, deg);
        d += `${i ? 'L' : 'M'}${x} ${y}`;
      }
      return `<path d="${d}Z" fill="none" stroke="${ink}" stroke-width="1.05" stroke-linejoin="round" stroke-opacity="0.7"/>`;
    }
    case 'oak': {
      const circ = 2 * Math.PI * 28;
      return ring(`r="28" stroke-width="2.6" stroke-opacity="0.55" stroke-dasharray="${fx(circ / 10 - 1.7)} 1.7"`);
    }
    default:
      return ring('r="28" stroke-width="0.8" stroke-opacity="0.35" stroke-dasharray="1 2.4"');
  }
}

/* The braces round the heart: the kind of place it is. */
const BRACES = Object.freeze({
  window: 'M27.6 25.6h-2.8v12.8h2.8M36.4 25.6h2.8v12.8h-2.8',
  room: 'M27.8 25.2q-2.6 0-2.6 2.4v2.2q0 2.2-2 2.2q2 0 2 2.2v2.2q0 2.4 2.6 2.4M36.2 25.2q2.6 0 2.6 2.4v2.2q0 2.2 2 2.2q-2 0-2 2.2v2.2q0 2.4-2.6 2.4',
  gathering: 'M27.4 25.2q-4.4 6.8 0 13.6M36.6 25.2q4.4 6.8 0 13.6',
  passage: 'M27.6 25.4l-3.8 6.6l3.8 6.6M36.4 25.4l3.8 6.6l-3.8 6.6'
});

/* Each petal's tip, by the kind of place: square for a window, round for a room, a ring for a gathering, a point for a passage. */
function petalTip(container, deg, mark) {
  const [x, y] = polar(19.1, deg);
  switch (container) {
    case 'window': return `<rect x="${fx(x - 1.05)}" y="${fx(y - 1.05)}" width="2.1" height="2.1" transform="rotate(${fx(deg)} ${x} ${y})"/>`;
    case 'gathering': return `<circle cx="${x}" cy="${y}" r="1.15" fill="none" stroke="${mark}" stroke-width="0.75"/>`;
    case 'passage': {
      const [ax, ay] = polar(20.6, deg);
      const [lx, ly] = polar(18.4, deg - 5.5);
      const [rx, ry] = polar(18.4, deg + 5.5);
      return `<path d="M${ax} ${ay}L${lx} ${ly}L${rx} ${ry}Z"/>`;
    }
    default: return `<circle cx="${x}" cy="${y}" r="1.2"/>`;
  }
}

/** One plain sentence for a screen reader: what the seal says. */
export function describeLikeness(itemOrSig) {
  const sig = likenessOf(typeof itemOrSig === 'string' ? resolveItem(itemOrSig) || {} : itemOrSig);
  const parts = [];
  if (sig.sigil) parts.push(`${sig.sigil} ${sig.motion}`);
  if (sig.container) parts.push(CONTAINERS[sig.container].one);
  if (sig.material) parts.push(MATERIAL_WORDS[sig.material]);
  if (sig.palette) parts.push(`${palettes[sig.palette]?.name || sig.palette}’s colours`.replace(/^The /, 'the '));
  parts.push(sig.chapter ? `${sig.chapter} ${sig.chapter === 1 ? 'petal' : 'petals'}, ${chapterName(sig.chapter)}` : 'no petals yet');
  if (sig.valence) parts.push(`a ${sig.valence}berry`);
  sig.characters.forEach((id) => parts.push(CHARACTER_WORDS[id]));
  return `Seal: ${list(parts)}.`;
}

/**
 * The seal as an SVG string (build-time and static use). No ids inside, so any
 * number can share a page. { decorative: true } hides it from screen readers.
 */
export function likenessMarkup(itemOrSig, { size = 28, title, decorative = false } = {}) {
  const raw = typeof itemOrSig === 'string' ? resolveItem(itemOrSig) : itemOrSig;
  const sig = likenessOf(raw || {});
  const colors = paletteColors(sig.palette);
  const rng = mulberry32(hashString(`${sig.id}|${sig.sigil}|${sig.container}|${sig.material}|${sig.palette}|${sig.chapter}`));
  const mark = colors.glow;
  const wax = contrast(colors.accent, mark) >= 2.6 ? colors.accent : mix(colors.accent, colors.ink, 0.55);
  const deep = mix(wax, colors.ink, 0.5);
  const start = -90 + (sig.sigil ? SIGILS.indexOf(sig.sigil) * 30 : 0);

  let petals = '';
  const n = sig.chapter ? Math.min(sig.chapter, 26) : 0;
  for (let i = 0; i < n; i += 1) {
    const deg = start + (i / n) * 360 + (rng() - 0.5) * 2.4;
    const [x1, y1] = polar(12.7, deg);
    const [x2, y2] = polar(17.4, deg);
    petals += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${petalTip(sig.container, deg, mark)}`;
  }
  const unplanted = n ? '' : `<circle cx="32" cy="32" r="15.6" fill="none" stroke="${mark}" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="0.01 2.35" stroke-opacity="0.85"/>`;

  const heart = sig.sigil === '.'
    ? `<circle cx="32" cy="32" r="1.9" fill="${mark}"/>`
    : sig.sigil
      ? `<text x="32" y="32.4" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="9.6" font-weight="700" fill="${mark}">${esc(sig.sigil)}</text>`
      : `<circle cx="32" cy="32" r="1.6" fill="${mark}" fill-opacity="0.7"/>`;
  const braces = sig.container ? `<path d="${BRACES[sig.container]}" fill="none" stroke="${mark}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.92"/>` : '';

  const berry = sig.valence ? (() => {
    const v = VALENCES[sig.valence];
    const [x, y] = polar(28, v.angle);
    const ring = sig.valence === 'bone' ? ` stroke="${v.heart}" stroke-width="0.8"` : ` stroke="${colors.ground}" stroke-width="0.7"`;
    return `<circle cx="${x}" cy="${y}" r="2.75" fill="${v.fill}"${ring}/><circle cx="${fx(x - 0.75)}" cy="${fx(y - 0.75)}" r="1" fill="${v.heart}" fill-opacity="0.9"/>`;
  })() : '';
  const pips = sig.characters.map((id) => {
    const [x, y] = polar(28, PIP_ANGLES[id] ?? 90);
    return `<circle cx="${x}" cy="${y}" r="2.05" fill="${CHARACTERS[id].palette.accent}" stroke="${colors.ground}" stroke-width="0.75"/>`;
  }).join('');

  const label = title || (sig.title ? `${sig.title}. ${describeLikeness(sig)}` : describeLikeness(sig));
  const a11y = decorative ? 'aria-hidden="true" focusable="false"' : `role="img" aria-label="${esc(label)}"`;
  const data = [
    sig.kind ? `data-likeness-kind="${esc(sig.kind)}"` : '',
    sig.motion ? `data-likeness-motion="${sig.motion}"` : '',
    sig.container ? `data-likeness-container="${sig.container}"` : ''
  ].filter(Boolean).join(' ');

  return [
    `<svg class="likeness-mark" viewBox="0 0 64 64" width="${size}" height="${size}" ${a11y} ${data} xmlns="http://www.w3.org/2000/svg">`,
    `<circle cx="32" cy="32" r="31.2" fill="${colors.ground}" stroke="${colors.edge}" stroke-width="0.8" stroke-opacity="0.75"/>`,
    materialRing(sig.material, colors.ink, rng),
    `<path d="${blobPath(rng, 21.6)}" fill="${wax}" stroke="${deep}" stroke-width="1" stroke-opacity="0.7"/>`,
    `<circle cx="32" cy="32" r="11.4" fill="${deep}" fill-opacity="0.32"/>`,
    `<g stroke="${mark}" stroke-width="1.45" stroke-linecap="round" fill="${mark}" opacity="0.94">${petals}</g>`,
    unplanted,
    braces,
    heart,
    `<ellipse cx="24.5" cy="21.5" rx="8" ry="4" transform="rotate(-28 24.5 21.5)" fill="#fff" fill-opacity="0.16"/>`,
    berry,
    pips,
    '</svg>'
  ].join('');
}

/** The seal as a DOM element. */
export function likenessMark(itemOrSig, { size = 28, title, decorative = false } = {}) {
  if (typeof document === 'undefined') return null;
  const template = document.createElement('template');
  template.innerHTML = likenessMarkup(itemOrSig, { size, title, decorative });
  return template.content.firstElementChild;
}

/* ─── Assets in their discovery variant ──────────────────────────────── */

/* One duotone filter per palette, ink in the shadows and glow in the light (likeness.css: veiled). */
function ensureDuotone(paletteId) {
  if (typeof document === 'undefined' || !document.body || !paletteId || !palettes[paletteId]) return null;
  const id = `likeness-duo-${paletteId}`;
  if (document.getElementById(id)) return id;
  let host = document.getElementById('likeness-filters');
  if (!host) {
    host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    host.setAttribute('id', 'likeness-filters');
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('width', '0');
    host.setAttribute('height', '0');
    host.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    document.body.append(host);
  }
  const { ink, accent, glow } = paletteColors(paletteId);
  const table = (i) => [ink, accent, glow].map((hex) => fx(rgb(hex)[i] / 255)).join(' ');
  host.insertAdjacentHTML('beforeend', `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="${table(0)}"/><feFuncG type="table" tableValues="${table(1)}"/><feFuncB type="table" tableValues="${table(2)}"/></feComponentTransfer></filter>`);
  return id;
}

const SEEN_KEY = 'lore.likeness.seen.v1';

/* The settle flourish plays once, the first time a thing is seen found (never in a storm on a first visit). */
function markFresh(target, id, state) {
  const seen = readKey(SEEN_KEY, null);
  const first = !seen || typeof seen !== 'object';
  const book = first ? {} : seen;
  if (state === 'found' && !first && book[id] !== 'found') {
    target.setAttribute('data-discovery-fresh', '');
    target.addEventListener('animationend', () => target.removeAttribute('data-discovery-fresh'), { once: true });
  }
  if (book[id] !== state) {
    book[id] = state;
    try { store()?.setItem(SEEN_KEY, JSON.stringify(book)); } catch { /* kept for this visit only */ }
  }
}

/**
 * Dress an asset (img, svg, figure, a portrait's wrapper) in its discovery
 * variant: data-discovery, its palette as --lk-* tokens, a duotone for the veil,
 * the keyhole of its kind of place, and its seal (crisp, over the veil).
 * Returns the state, or null when there is nothing to dress.
 */
export function dressAsset(target, itemOrId, { seal = true, sealSize = 26, state } = {}) {
  if (!target || typeof document === 'undefined') return null;
  const item = resolveItem(itemOrId);
  if (!item?.id) return null;
  const discovery = state || discoveryOf(item);
  const sig = likenessOf(item);
  const colors = paletteColors(sig.palette);
  target.setAttribute('data-discovery', discovery);
  if (sig.container) target.setAttribute('data-likeness-container', sig.container);
  target.classList.add('likeness-asset');
  ['ground', 'ink', 'accent', 'glow', 'edge'].forEach((key) => target.style.setProperty(`--lk-${key}`, colors[key]));
  const duo = ensureDuotone(sig.palette);
  if (duo) target.style.setProperty('--lk-duo', `url(#${duo})`);
  const isMedia = target.matches('img, svg, picture');
  const img = isMedia ? null : target.querySelector('img');
  const src = img ? (img.currentSrc || img.getAttribute('src')) : '';
  if (src) target.style.setProperty('--lk-src', `url("${src.replace(/"/g, '%22')}")`);
  if (seal && !isMedia && !target.querySelector(':scope > .likeness-asset-seal')) {
    const badge = document.createElement('span');
    badge.className = 'likeness-asset-seal';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = likenessMarkup(item, { size: sealSize, decorative: true });
    target.append(badge);
  }
  markFresh(target, item.id, discovery);
  return discovery;
}

/* ─── Find similar: the cluster panel ────────────────────────────────── */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.entries(value).forEach(([name, v]) => { if (v != null) node.dataset[name] = v; });
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

const KIND_LABEL = Object.freeze({ room: 'room', wonder: 'wonder', character: 'cast', palette: 'palette', seed: 'study', card: 'card' });
let panelCount = 0;

function kicker(item) {
  const sig = likenessOf(item);
  const where = sig.chapter ? pad(sig.chapter) : item.kind === 'seed' ? 'the atlas' : 'the lanes';
  return `${KIND_LABEL[item.kind] || item.kind} · ${where}`;
}

function signatureLine(item) {
  const sig = likenessOf(item);
  return [
    sig.sigil ? `${sig.sigil} ${sig.motion}` : '',
    sig.container ? `${CONTAINERS[sig.container].open} ${CONTAINERS[sig.container].close} ${sig.container}` : '',
    sig.material ? MATERIAL_WORDS[sig.material] : '',
    sig.palette ? (palettes[sig.palette]?.name || '') : '',
    sig.valence || ''
  ].filter(Boolean).join(' · ');
}

function openCluster(start, { n = 6, from = null } = {}) {
  const titleId = `likeness-panel-title-${(panelCount += 1)}`;
  const dialog = el('dialog', { className: 'likeness-panel', 'aria-labelledby': titleId });
  const trail = [];

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const render = (item) => {
    const state = discoveryOf(item);
    const near = similar(item, { n });
    const head = el('header', { className: 'likeness-panel-head' },
      el('span', { className: 'likeness-panel-seal' }, likenessMark(item, { size: 64, decorative: true })),
      el('div', { className: 'likeness-panel-heading' },
        el('p', { className: 'likeness-panel-kicker', text: `Things like this · ${kicker(item)} · ${stateWord(item, state)}` }),
        el('h2', { className: 'likeness-panel-title', id: titleId, text: shownTitle(item, state) }),
        el('p', { className: 'likeness-panel-signature', text: signatureLine(item) })),
      el('button', { type: 'button', className: 'likeness-panel-close', 'aria-label': 'Close', text: '×' }));

    const items = near.map(({ item: other, why }) => {
      const otherState = discoveryOf(other);
      const name = shownTitle(other, otherState);
      const walk = el('button', {
        type: 'button', className: 'likeness-cluster-walk', 'data-walk': other.id,
        'aria-label': `Things like ${name}`, title: 'Things like this one'
      }, el('span', { 'aria-hidden': 'true', text: '≈' }));
      return el('li', { className: 'likeness-cluster-item', dataset: { discovery: otherState, likenessKind: other.kind } },
        el('a', { className: 'likeness-cluster-link', href: other.href || '#' },
          el('span', { className: 'likeness-cluster-seal' }, likenessMark(other, { size: 48, decorative: true })),
          el('span', { className: 'likeness-cluster-text' },
            el('span', { className: 'likeness-cluster-kind', text: `${kicker(other)} · ${stateWord(other, otherState)}` }),
            el('span', { className: 'likeness-cluster-title', text: name }),
            el('span', { className: 'likeness-cluster-why', text: why }))),
        walk);
    });

    const body = items.length
      ? el('ul', { className: 'likeness-cluster', role: 'list' }, items)
      : el('p', { className: 'likeness-panel-empty', text: 'Nothing in the book rhymes with this yet. Another chapter may.' });

    const crumbs = trail.length > 1
      ? el('nav', { className: 'likeness-trail', 'aria-label': 'Where you have walked' },
        el('span', { className: 'likeness-trail-label', text: 'Walked' }),
        ...trail.map((id, index) => {
          const step = data?.items?.[id] || { id };
          const here = index === trail.length - 1;
          return el('button', {
            type: 'button', className: `likeness-trail-step${here ? ' is-here' : ''}`, 'data-step': String(index),
            'aria-label': here ? `Here: ${shownTitle(step)}` : `Back to ${shownTitle(step)}`, 'aria-current': here ? 'step' : null
          }, likenessMark(step, { size: 22, decorative: true }));
        }))
      : null;

    const foot = el('p', { className: 'likeness-panel-foot', text: 'Alike by what the book made them of, never by who else has looked.' });
    dialog.replaceChildren(...[head, body, crumbs, foot].filter(Boolean));
  };

  const show = (itemOrId, { push = true } = {}) => {
    const item = resolveItem(itemOrId);
    if (!item?.id) return;
    if (push) trail.push(item.id);
    render(item);
    const first = dialog.querySelector('.likeness-cluster-link') || dialog.querySelector('.likeness-panel-close');
    first?.focus({ preventScroll: true });
  };

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) { close(); return; }
    if (event.target.closest('.likeness-panel-close')) { close(); return; }
    const walk = event.target.closest('[data-walk]');
    if (walk) { show(walk.getAttribute('data-walk')); return; }
    const step = event.target.closest('[data-step]');
    if (step) {
      const index = Number(step.getAttribute('data-step'));
      trail.splice(index + 1);
      show(trail[index], { push: false });
    }
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    from?.setAttribute('aria-expanded', 'false');
    from?.focus({ preventScroll: true });
  });

  document.body.append(dialog);
  show(start);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  from?.setAttribute('aria-expanded', 'true');
  const first = dialog.querySelector('.likeness-cluster-link') || dialog.querySelector('.likeness-panel-close');
  first?.focus({ preventScroll: true });
  return dialog;
}

/**
 * A ready button that opens the cluster of things like this one: marks, titles,
 * why, links, and a walk on to things like those. Wears the thing's own seal.
 */
export function findSimilar(itemOrId, { label = 'Find similar', n = 6 } = {}) {
  if (typeof document === 'undefined') return null;
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
  const button = el('button', {
    type: 'button', className: 'likeness-find', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'data-likeness-id': id || null
  },
    el('span', { className: 'likeness-find-seal', 'aria-hidden': 'true' }),
    el('span', { className: 'likeness-find-label', text: label }));
  const paintSeal = () => {
    const item = resolveItem(itemOrId);
    if (item) button.querySelector('.likeness-find-seal').replaceChildren(likenessMark(item, { size: 18, decorative: true }));
  };
  if (data) paintSeal();
  else loadLikeness().then(paintSeal);
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await loadLikeness();
    openCluster(itemOrId, { n, from: button });
  });
  return button;
}

/* ─── The atlas, from anywhere ───────────────────────────────────────── */

function seedsFor(chapterOrSigils, n) {
  const seeds = Object.values(data?.items || {}).filter((item) => item.kind === 'seed');
  const bySet = (a, b) => (a.set === '01' ? 0 : a.set === 'motif' ? 1 : 2) - (b.set === '01' ? 0 : b.set === 'motif' ? 1 : 2);
  let wanted = [];
  if (typeof chapterOrSigils === 'number' || /^\d+$/.test(String(chapterOrSigils))) {
    const chapter = Number(chapterOrSigils);
    const planted = seeds.filter((s) => (s.chapters || [s.chapter]).includes(chapter));
    const counts = {};
    Object.values(data.items).filter((item) => item.kind === 'room' && item.chapter === chapter)
      .forEach((room) => { counts[room.sigil] = (counts[room.sigil] || 0) + 1; });
    const sigils = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || SIGILS.indexOf(a) - SIGILS.indexOf(b));
    wanted = [...planted, ...sigils.flatMap((sigil) => seeds.filter((s) => s.sigil === sigil).sort(bySet))];
  } else {
    const sigils = Array.isArray(chapterOrSigils) ? chapterOrSigils : [...String(chapterOrSigils || '')];
    wanted = sigils.flatMap((sigil) => seeds.filter((s) => s.sigil === sigil || s.echo === sigil).sort(bySet));
  }
  const out = [];
  const dims = new Set();
  wanted.forEach((s) => { if (!out.includes(s) && !dims.has(s.dimension)) { out.push(s); dims.add(s.dimension); } });
  wanted.forEach((s) => { if (!out.includes(s)) out.push(s); });
  return out.slice(0, n);
}

/**
 * A strip of studies from the seed atlas that belong with a chapter (its own
 * motif first, then its rooms' motions) or with some sigils, each in its
 * discovery variant with its seal, linking into the atlas at its anchor.
 * Returns the element at once and fills it when the index arrives.
 */
export function atlasStrip(chapterOrSigils, { n = 3 } = {}) {
  if (typeof document === 'undefined') return null;
  const strip = el('nav', { className: 'likeness-atlas-strip', 'aria-label': 'From the seed atlas' },
    el('a', { className: 'likeness-atlas-strip-label', href: ATLAS_HREF, text: 'From the seed atlas' }),
    el('ul', { className: 'likeness-atlas-strip-list', role: 'list' }));
  loadLikeness().then(() => {
    const seeds = seedsFor(chapterOrSigils, n);
    if (!seeds.length) { strip.hidden = true; return; }
    strip.querySelector('ul').replaceChildren(...seeds.map((seed) => {
      const state = discoveryOf(seed);
      const name = shownTitle(seed, state);
      const figure = el('figure', { className: 'likeness-atlas-figure' },
        el('img', { src: seed.thumb || seed.img, alt: state === 'veiled' ? '' : `${seed.title}, a study from the seed atlas`, loading: 'lazy', decoding: 'async', width: 160, height: 160 }));
      dressAsset(figure, seed, { state, sealSize: 22 });
      return el('li', { className: 'likeness-atlas-strip-item' },
        el('a', { className: 'likeness-atlas-seed', href: seed.href, 'aria-label': `${name}: ${seed.sigil} ${MOTIONS[seed.sigil]}, ${stateWord(seed, state)}` },
          figure,
          el('span', { className: 'likeness-atlas-caption' },
            el('span', { className: 'likeness-atlas-sigil', dataset: { likenessMotion: MOTIONS[seed.sigil] }, text: seed.sigil }),
            el('span', { className: 'likeness-atlas-dimension', text: seed.dimension === 'story-motif' ? 'motif' : seed.dimension }))));
    }));
  });
  return strip;
}
