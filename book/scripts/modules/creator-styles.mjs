// @ts-check
/**
 * creator-styles.mjs — Resident Artist & Peer Creator Style Packs for lore.land/pie.
 *
 * Connects the existing pack canon (`book/content/packs/index.json` via `packs.mjs`) with
 * live, authored creator style spells:
 *   @style[handle]{ #name["..."] #ink[#2d241c] #accent[#c98a1e] $stroke[hand] $voicing[folk] ~interval[7] =value[witness] #note["..."] }
 *
 * A style pack gently transforms how the canvas renders linework & palette warmth, accents musical
 * voicings/intervals, and attributes the active aesthetic in carry provenances & deck notes —
 * without obscuring hazard silhouettes or touching story prose.
 */

const STYLES_KEY = 'lore.creator.styles.v1';
const ACTIVE_KEY = 'lore.creator.active.v1';

/** @typedef {{ id: string, handle: string, name: string, maker: string, ink: string, accent: string, wash: string, stroke: 'clean' | 'hand' | 'woodcut' | 'chalk', voicing: 'folk' | 'warm' | 'bright' | 'velvet', interval: number, value: string, note: string, packRoute?: string, builtIn?: boolean }} CreatorStyle */

export const STROKE_MODES = Object.freeze(['clean', 'hand', 'woodcut', 'chalk']);

/** Starter resident / house creator styles grounded in lore.land packs & craft traditions. */
export const BUILTIN_STYLES = Object.freeze(/** @type {CreatorStyle[]} */ ([
  {
    id: 'house',
    handle: 'lore_land',
    name: 'Book & Folio (House)',
    maker: 'Lore.Land',
    ink: '#2d241c',
    accent: '#23665d',
    wash: '#f4ecd8',
    stroke: 'clean',
    voicing: 'folk',
    interval: 7,
    value: 'auto',
    note: 'The book’s baseline pen and warm paper wash.',
    builtIn: true
  },
  {
    id: 'spwashi',
    handle: 'spwashi',
    name: "spwashi's hand",
    maker: 'spwashi',
    ink: '#231d19',
    accent: '#c98a1e',
    wash: '#f5ecd9',
    stroke: 'hand',
    voicing: 'warm',
    interval: 4,
    value: 'witness',
    note: 'Alphabet blocks traced in double-weight pen with amber warmth.',
    packRoute: '/?/texture.website/@spwashi',
    builtIn: true
  },
  {
    id: 'hearth_press',
    handle: 'hearth_press',
    name: 'Hearth Woodcut',
    maker: 'Hearth Press',
    ink: '#2b1b14',
    accent: '#b55632',
    wash: '#f3e5d0',
    stroke: 'woodcut',
    voicing: 'velvet',
    interval: 5,
    value: 'care',
    note: 'Carved block outlines, ochre warmth, and muted felt woodwinds.',
    builtIn: true
  },
  {
    id: 'evening_kiln',
    handle: 'evening_kiln',
    name: 'Cobalt Kiln & Glaze',
    maker: 'Evening Kiln',
    ink: '#1e2838',
    accent: '#3b739c',
    wash: '#eef2f5',
    stroke: 'chalk',
    voicing: 'bright',
    interval: 11,
    value: 'craft',
    note: 'Mineral blue ink lines, crisp bell overtones, major-seven glint.',
    builtIn: true
  }
]));

const cleanHandle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 28) || 'guest_artist';
const cleanHex = (s, fallback) => (/^#[0-9a-f]{6}$/i.test(String(s || '').trim()) ? String(s).trim().toLowerCase() : fallback);
const cleanText = (s, max = 96) => String(s || '').replace(/[\r\n<>`"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Parse a `@style[handle]{ ... }` creator spell cleanly & safely. */
export function parseCreatorStyle(text = '') {
  const m = /@style\[([a-z0-9_-]+)\]\{([\s\S]*)\}/i.exec(String(text || '').trim());
  if (!m) return null;
  const handle = cleanHandle(m[1]);
  const body = m[2];
  const name = cleanText((/#name\["([^"]*)"\]/.exec(body) || [])[1] || `@${handle}`, 48);
  const ink = cleanHex((/#ink\[(#[0-9a-f]{6})\]/i.exec(body) || [])[1], '#2d241c');
  const accent = cleanHex((/#accent\[(#[0-9a-f]{6})\]/i.exec(body) || [])[1], '#c98a1e');
  const wash = cleanHex((/#wash\[(#[0-9a-f]{6})\]/i.exec(body) || [])[1], '#f4ecd8');
  const strokeRaw = (/\$stroke\[([a-z]+)\]/i.exec(body) || [])[1] || 'hand';
  const stroke = /** @type {CreatorStyle['stroke']} */ (STROKE_MODES.includes(strokeRaw) ? strokeRaw : 'hand');
  const voicingRaw = (/\$voicing\[([a-z]+)\]/i.exec(body) || [])[1] || 'folk';
  const voicing = /** @type {CreatorStyle['voicing']} */ (['folk', 'warm', 'bright', 'velvet'].includes(voicingRaw) ? voicingRaw : 'folk');
  const intervalRaw = Number((/~interval\[(-?\d+)\]/.exec(body) || [])[1]);
  const interval = Number.isFinite(intervalRaw) ? Math.max(0, Math.min(14, Math.round(intervalRaw))) : 7;
  const valRaw = (/=value\[([a-z]+)\]/i.exec(body) || [])[1] || 'auto';
  const value = ['auto', 'care', 'craft', 'witness', 'mercy', 'boldness'].includes(valRaw) ? valRaw : 'auto';
  const note = cleanText((/#note\["([^"]*)"\]/.exec(body) || [])[1] || 'Peer creator style for the lanes.', 120);
  return { id: `custom_${handle}`, handle, name, maker: `@${handle}`, ink, accent, wash, stroke, voicing, interval, value, note, builtIn: false };
}

/** Serialize a CreatorStyle into a shareable Spw block. */
export function formatCreatorStyle(style) {
  if (!style) return '';
  const handle = cleanHandle(style.handle || style.id);
  const safeName = cleanText(style.name || handle, 48);
  const safeNote = cleanText(style.note || '', 120);
  return `@style[${handle}]{ #name["${safeName}"] #ink[${cleanHex(style.ink, '#2d241c')}] #accent[${cleanHex(style.accent, '#c98a1e')}] #wash[${cleanHex(style.wash, '#f4ecd8')}] $stroke[${style.stroke || 'clean'}] $voicing[${style.voicing || 'folk'}] ~interval[${style.interval ?? 7}] =value[${style.value || 'auto'}] #note["${safeNote}"] }`;
}

const local = () => { try { return window.localStorage; } catch { return null; } };
const session = () => { try { return window.sessionStorage; } catch { return null; } };

export function readCustomStyles() {
  try {
    const raw = JSON.parse(local()?.getItem(STYLES_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((s) => s && s.handle) : [];
  } catch {
    return [];
  }
}

export function allCreatorStyles() {
  return [...BUILTIN_STYLES, ...readCustomStyles()];
}

export function saveCreatorStyle(style) {
  if (!style?.handle) return allCreatorStyles();
  const norm = {
    ...style,
    id: style.id || `custom_${cleanHandle(style.handle)}`,
    handle: cleanHandle(style.handle),
    name: cleanText(style.name || style.handle, 48),
    note: cleanText(style.note || '', 120),
    builtIn: false
  };
  const custom = readCustomStyles().filter((s) => s.id !== norm.id && s.handle !== norm.handle);
  custom.unshift(norm);
  try { local()?.setItem(STYLES_KEY, JSON.stringify(custom.slice(0, 16))); } catch { /* visit only */ }
  return allCreatorStyles();
}

export function activeCreatorStyleId() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('style');
    if (fromUrl) return cleanHandle(fromUrl);
    const fromSession = session()?.getItem(ACTIVE_KEY);
    if (fromSession) return fromSession;
    return local()?.getItem(ACTIVE_KEY) || 'house';
  } catch {
    return 'house';
  }
}

export function setActiveCreatorStyle(idOrHandle, { persist = true } = {}) {
  const styles = allCreatorStyles();
  const match = styles.find((s) => s.id === idOrHandle || s.handle === idOrHandle) || BUILTIN_STYLES[0];
  try {
    if (persist) local()?.setItem(ACTIVE_KEY, match.id);
    else session()?.setItem(ACTIVE_KEY, match.id);
  } catch { /* ignore */ }
  return match;
}

export function activeCreatorStyle() {
  const id = activeCreatorStyleId();
  const styles = allCreatorStyles();
  return styles.find((s) => s.id === id || s.handle === id) || BUILTIN_STYLES[0];
}

/** Attribution line included in Spw carry provenance when a creator style shapes play. */
export function styleLineForProvenance(style) {
  if (!style || style.id === 'house') return '';
  return `@style[@${cleanHandle(style.handle)}]{ $stroke[${style.stroke}] $voicing[${style.voicing}] ~interval[${style.interval}] }`;
}
