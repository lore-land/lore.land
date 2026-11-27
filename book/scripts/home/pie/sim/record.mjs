/**
 * pie/sim/record.mjs — shared board geometry constants, localStorage record
 * persistence, discovery aggregation, and CSS-to-canvas palette utilities
 * for Exactly One Pie.
 */

export const KEY = 'lore.pie.v1';
export const W = 360;
export const H = 560;
export const LANES = 5;
export const LANE_W = W / LANES;
export const PLAYER_Y = H - 92;
export const COBBLE = 24;
export const PRESENCE_Y = 150;
export const ROWS = 4;
export const ROW_H = 64;
export const rowY = (row) => PLAYER_Y - row * ROW_H;
export const SLICE_COST = 0.14;
export const WASTE_COST = 0.08;
export const FLOUR_GIVES = 0.38;
export const BERRY_GIVES = 0.3;

export const TROPES_URL = '/book/content/world/tropes.json';
export const HEARD_KEY = 'lore.rumours.heard.v1';
export const DEEDS_KEY = 'lore.pie.deeds.v1';
export const LORE_URL = '/book/content/world/pie-lore.json';

export const laneX = (lane) => lane * LANE_W + LANE_W / 2;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const rand = (lo, hi) => lo + Math.random() * (hi - lo);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export const readStore = (key) => {
  try { return JSON.parse(window.localStorage.getItem(key) || '{}') || {}; }
  catch { return {}; }
};

/**
 * Read persisted `lore.pie.v1` player record, validating view fields against
 * `TEXTURES` and `ALLOWED`.
 */
export function readRecord({ TEXTURES, ALLOWED }) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    const obj = (value) => (value && typeof value === 'object' ? value : {});
    const counts = (value) => Object.fromEntries(Object.entries(obj(value)).map(([key, n]) => [key, Number(n)]).filter(([, n]) => Number.isFinite(n)));
    return {
      best: Number(parsed.best) || 0,
      runs: Number(parsed.runs) || 0,
      waps: Number(parsed.waps) || 0,
      bestWaps: Number(parsed.bestWaps) || 0,
      causes: obj(parsed.causes),
      carriers: obj(parsed.carriers),
      perfects: Number(parsed.perfects) || 0,
      satisfied: Number(parsed.satisfied) || 0,
      shared: Number(parsed.shared) || 0,
      sweetened: Number(parsed.sweetened) || 0,
      foils: Number(parsed.foils) || 0,
      reached: Number(parsed.reached) || 0,
      wasted: Number(parsed.wasted) || 0,
      eggs: Number(parsed.eggs) || 0,
      kept: Number(parsed.kept) || 0,
      lore: Array.isArray(parsed.lore) ? parsed.lore : [],
      met: Array.isArray(parsed.met) ? parsed.met : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      qa: Array.isArray(parsed.qa) ? parsed.qa.slice(-200) : [],
      mimes: { shattered: Math.max(0, Number(parsed.mimes?.shattered) || 0) },
      tropeStages: counts(parsed.tropeStages),
      roomsSeen: counts(parsed.roomsSeen),
      roomsCast: counts(parsed.roomsCast),
      bests: counts(parsed.bests),
      reactions: counts(parsed.reactions),
      view: {
        story: parsed.view?.story !== false,
        zen: parsed.view?.zen === true,
        hand: parsed.view?.hand === 'left' ? 'left' : 'right',
        labels: parsed.view?.labels === true,
        heights: parsed.view?.heights !== false,
        heightsCfg: parsed.view?.heightsCfg && typeof parsed.view.heightsCfg === 'object' ? parsed.view.heightsCfg : null,
        size: parsed.view?.size === 'fit' ? 'fit' : Number.isFinite(parsed.view?.size) ? Math.min(1.45, Math.max(0.8, parsed.view.size)) : undefined,
        wide: ['page', 'window'].includes(parsed.view?.wide) ? parsed.view.wide : undefined,
        controls: ['icons', 'words'].includes(parsed.view?.controls) ? parsed.view.controls : undefined,
        controlsAt: ['top', 'bottom'].includes(parsed.view?.controlsAt) ? parsed.view.controlsAt : undefined,
        buttons: ['middle', 'sides', 'ab'].includes(parsed.view?.buttons) ? parsed.view.buttons : undefined,
        buttonsSwap: parsed.view?.buttonsSwap === true ? true : undefined,
        controlsSize: [0.85, 1, 1.2].includes(parsed.view?.controlsSize) ? parsed.view.controlsSize : undefined,
        panelsAt: ['beside', 'cabinet'].includes(parsed.view?.panelsAt) ? parsed.view.panelsAt : undefined,
        storyMotion: ['passage', 'smooth'].includes(parsed.view?.storyMotion) ? parsed.view.storyMotion : undefined,
        storyIn: ['off', 'caption', 'road', 'both'].includes(parsed.view?.storyIn) ? parsed.view.storyIn : undefined,
        stripH: Number.isFinite(parsed.view?.stripH) ? Math.min(16, Math.max(4, parsed.view.stripH)) : undefined,
        storyLine: [0.3, 0.5, 0.66].includes(parsed.view?.storyLine) ? parsed.view.storyLine : undefined,
        caption: parsed.view?.caption === false ? false : undefined,
        focusOnPlay: parsed.view?.focusOnPlay === false ? false : undefined,
        flowSize: Number.isFinite(parsed.view?.flowSize) ? Math.min(1.6, Math.max(0.8, parsed.view.flowSize)) : undefined,
        pace: [0.8, 1, 1.2].includes(parsed.view?.pace) ? parsed.view.pace : undefined,
        storyAt: ['beside', 'under'].includes(parsed.view?.storyAt) ? parsed.view.storyAt : undefined,
        heightsShown: parsed.view?.heightsShown === false ? false : undefined,
        show: ['inset', 'board'].includes(parsed.view?.show) ? parsed.view.show : 'off',
        arrows: ['row', 'sides', 'cross'].includes(parsed.view?.arrows) ? parsed.view.arrows : undefined,
        controlsPlace: ['under', 'edges', 'over'].includes(parsed.view?.controlsPlace) ? parsed.view.controlsPlace : undefined,
        tap: ['throw', 'go', 'step', 'hop', 'none'].includes(parsed.view?.tap) ? parsed.view.tap : undefined,
        doubleTap: ['none', 'hop', 'throw', 'go'].includes(parsed.view?.doubleTap) ? parsed.view.doubleTap : undefined,
        swipeUp: ['step', 'hop'].includes(parsed.view?.swipeUp) ? parsed.view.swipeUp : (Number(parsed.runs) ? undefined : 'hop'),
        panels: ['auto', 'manual'].includes(parsed.view?.panels) ? parsed.view.panels : (Number(parsed.runs) ? undefined : 'auto'),
        cardPace: ['at-once', 'breath', 'quiet'].includes(parsed.view?.cardPace) ? parsed.view.cardPace : (Number(parsed.runs) ? undefined : 'breath'),
        cardMore: parsed.view?.cardMore === true,
        music: ['quiet', 'groove', 'full'].includes(parsed.view?.music) ? parsed.view.music : (Number(parsed.runs) ? undefined : 'groove'),
        themes: ['calls', 'themes'].includes(parsed.view?.themes) ? parsed.view.themes : (Number(parsed.runs) ? undefined : 'themes'),
        glow: ['off', 'beat', 'bar'].includes(parsed.view?.glow) ? parsed.view.glow : undefined,
        cues: ['shaped', 'one', 'off'].includes(parsed.view?.cues) ? parsed.view.cues : (Number(parsed.runs) ? undefined : 'shaped'),
        feel: ['written', 'jazz'].includes(parsed.view?.feel) ? parsed.view.feel : undefined,
        wap: TEXTURES.wap.includes(parsed.view?.wap) ? parsed.view.wap : undefined,
        steps: TEXTURES.steps.includes(parsed.view?.steps) ? parsed.view.steps : undefined,
        hold: ALLOWED.hold.includes(parsed.view?.hold) ? parsed.view.hold : undefined,
        fill: ALLOWED.fill.includes(parsed.view?.fill) ? parsed.view.fill : undefined,
        share: ALLOWED.share.includes(parsed.view?.share) ? parsed.view.share : undefined
      },
      sound: parsed.sound !== false
    };
  } catch {
    return {
      best: 0, runs: 0, waps: 0, bestWaps: 0, causes: {}, carriers: {},
      perfects: 0, satisfied: 0, shared: 0, sweetened: 0, foils: 0, reached: 0, wasted: 0, eggs: 0, kept: 0,
      lore: [], met: [], cards: [], qa: [],
      view: { story: true, zen: false, hand: 'right', show: 'off', swipeUp: 'hop', panels: 'auto', wide: 'window', cardPace: 'breath', cues: 'shaped' },
      sound: true
    };
  }
}

export function writeRecordWithVisit(record, visitBoard) {
  let out = record;
  if (visitBoard && Object.keys(visitBoard.before).length) {
    const view = { ...record.view };
    Object.entries(visitBoard.before).forEach(([key, value]) => {
      if (value === undefined) delete view[key];
      else view[key] = value;
    });
    out = { ...record, view };
  }
  try { window.localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* the run still counted */ }
}

export const ROOM_TOTALS = {};

export const roomsReadIn = (n) => {
  try {
    const list = JSON.parse(window.localStorage.getItem('lore.rooms.v1') || '{}')[String(n)];
    return Array.isArray(list) ? list.length : 0;
  } catch { return 0; }
};

export const roomsDone = () => Object.entries(ROOM_TOTALS)
  .filter(([n, total]) => total > 0 && roomsReadIn(n) >= total)
  .map(([n]) => Number(n));

export function discoveries(record, { carriesSummary, readCarries }) {
  const read = (key, fallback) => {
    try { return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const progress = read('lore.chapter.progress.v1', {});
  const tellings = read('lore.tellings.v1', {});
  const visited = Array.isArray(progress?.visited) ? progress.visited.map(Number) : [];
  const sum = carriesSummary(readCarries());
  return {
    chapters: visited.length,
    visited,
    roomsDone: roomsDone(),
    wonders: Object.keys(read('lore.almanac.v1', {}) || {}).length,
    sightings: Object.keys(read('lore.sightings.v1', {}) || {}).length,
    tellings: Object.values(tellings || {}).reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0),
    waps: record.waps,
    satisfied: record.satisfied || 0,
    shared: record.shared || 0,
    sweetened: record.sweetened || 0,
    perfects: record.perfects,
    foils: record.foils,
    reached: record.reached,
    carried: sum.carried,
    wonback: sum.wonBack,
    mimes: sum.taken
  };
}

export function isUnlocked(line, found) {
  const { kind, n } = line.unlock || { kind: 'always' };
  if (kind === 'always') return true;
  if (line.ground?.chapter && found.roomsDone?.includes(Number(line.ground.chapter))) return true;
  if (kind === 'chapter') return found.visited.includes(Number(n));
  return (found[kind] ?? 0) >= Number(n);
}

let probe = null;
export function rgbOf(value, fallback) {
  if (!probe) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    probe = c.getContext('2d', { willReadFrequently: true });
  }
  const span = document.createElement('span');
  span.style.color = fallback;
  span.style.color = value;
  document.body.append(span);
  const computed = getComputedStyle(span).color;
  span.remove();
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = fallback;
  probe.fillStyle = computed;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export function palette() {
  const style = getComputedStyle(document.body);
  const v = (name, fallback) => rgbOf(style.getPropertyValue(name).trim() || fallback, fallback);
  return {
    paper: v('--hub-paper', '#f3ede1'),
    deep: v('--hub-paper-deep', '#e6dcc8'),
    ink: v('--hub-ink', '#161d2b'),
    muted: v('--hub-muted', '#5b6472'),
    accent: v('--hub-accent', '#246270'),
    gold: v('--hub-gold', '#c4922e'),
    hearth: v('--hub-hearth', '#b0602a'),
    berry: v('--hub-berry', '#5b3a6e'),
    night: v('--hub-night', '#12394a')
  };
}

export const channels = (rgb) => (rgb.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);

export function mix(a, b, t) {
  const x = channels(a);
  const y = channels(b);
  return `rgb(${x.map((n, i) => Math.round(n + (y[i] - n) * t)).join(', ')})`;
}
