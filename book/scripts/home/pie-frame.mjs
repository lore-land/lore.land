// @ts-check
/**
 * pie-frame.mjs — the board: a frame around the lanes, the ways a screen is held, and the whole set-up as one
 * line of Spw.
 *
 * The world of the lanes is one size for everyone: 360 by 560, five lanes, the carrier 92 from its foot. A screen
 * is any shape. So the board is a frame [ ] around the world's body { }: the world is never stretched, and no
 * screen, however tall or wide, shows a row anyone could play in sooner than another does. When the lanes fill a
 * screen of another shape, everything the frame adds is scenery, each part in its sigil's role:
 *   ?  haze over the far end of the road. The lanes go on, but nothing in it can be made out yet: things come
 *      out of it where they always did, so a tall phone sees no further than a short one. (Foresight stays a
 *      thing the game prices: a boonberry's glimpse, the long view.)
 *   .  ground under the carrier's feet. The buttons stand on it, so a thumb covers no lane anyone plays in;
 *      the last of the road, already passed, may run under their glass.
 * and, on a screen held on its side, a verge either side of the road, where the thumbs rest.
 *
 * frameFor() places the world in a screen. boardLine() and readBoardLine() write and read the set-up as
 *   ^board{ @hold[one_thumb] =frame[fill] %lanes[0.9] =tap[go] }
 * the same state ⚙ Setup keeps (never a second copy): what a player chose, and nothing they did not.
 * A line goes in a link (?board=) to carry a pair of hands to another screen.
 */

/** @typedef {string | number | boolean} Choice */
/** @typedef {[string, string, Array<[Choice, string]>, Choice]} SetupRow */
/** @typedef {{ above: number, below: number, left: number, right: number }} Bands */
/** @typedef {{ x0: number, y0: number, w: number, h: number, s: number, bands: Bands, shape: string, filled: boolean }} Frame */
/** @typedef {{ name: string, says: string, view: Record<string, Choice> }} Hold */
/** @typedef {{ sigil: string, name: string, arg: string }} Term */
/** @typedef {(text: string, options?: any) => any} Parse */
/** @typedef {{ view: Record<string, Choice>, unknown: string[], reader: string }} BoardRead */

export const WORLD = Object.freeze({ W: 360, H: 560, PLAYER_Y: 468 });
/** The frame when nothing is filled: the world exactly. @type {Readonly<Frame>} */
export const IDENTITY = Object.freeze({ x0: 0, y0: 0, w: WORLD.W, h: WORLD.H, s: 1, bands: Object.freeze({ above: 0, below: 0, left: 0, right: 0 }), shape: 'world', filled: false });

/** A screen's shape, by its width over its height. @param {number} w @param {number} h @returns {string} */
export function shapeOf(w, h) {
  const a = w / Math.max(1, h);
  return a < 0.62 ? 'tall' : a < 0.9 ? 'upright' : a < 1.2 ? 'square' : a < 1.85 ? 'broad' : 'long';
}

/**
 * Where the world goes in a screen it fills.
 *   box      the screen, in CSS px: { w, h }
 *   reserve  px each edge's overlays need: { top, bottom, left, right } (switches, buttons)
 *   share    how much of the room the lanes take, 0.6 to 1 (the rest is more ground and haze)
 *   tuck     world units of the road's foot, already passed, that may run under the bottom overlay's glass
 * Returns { x0, y0, w, h } in world units (the part of the world, and beyond it, the screen shows), s (px per
 * world unit), bands (how much haze, ground and verge, in world units), shape, and filled: true.
 * @param {{ box?: { w: number, h: number }, reserve?: { top?: number, bottom?: number, left?: number, right?: number }, share?: Choice, tuck?: number }} [opts]
 * @returns {Frame}
 */
export function frameFor({ box, reserve = {}, share = 1, tuck = 40 } = {}) {
  const { W, H } = WORLD;
  const bw = Math.max(1, Number(box?.w) || W);
  const bh = Math.max(1, Number(box?.h) || H);
  let top = Math.max(0, reserve.top || 0);
  let bottom = Math.max(0, reserve.bottom || 0);
  let left = Math.max(0, reserve.left || 0);
  let right = Math.max(0, reserve.right || 0);
  // Overlays that would leave the lanes under a third of the screen give way (they shrink with it), never the world.
  const squeezeV = Math.min(1, (bh * 0.66) / Math.max(1, top + bottom));
  const squeezeH = Math.min(1, (bw * 0.66) / Math.max(1, left + right));
  top *= squeezeV; bottom *= squeezeV; left *= squeezeH; right *= squeezeH;
  const k = Math.min(1, Math.max(0.6, Number(share) || 1));
  // The tallest the world may stand: clear of the top's overlays, and clear of the bottom's except the tucked foot.
  const sH = Math.min((bh - top) / H, (bh - top - bottom) / (H - tuck));
  const sW = (bw - left - right) / W;
  const s = Math.max(0.05, Math.min(sH, sW) * k);
  const worldW = W * s;
  const worldH = H * s;
  const worldLeft = left + (bw - left - right - worldW) / 2;
  // The world stands on the ground: its foot at the bottom overlay (less what may tuck under it); haze takes the rest.
  const worldBottom = bh - Math.max(0, bottom - tuck * s) - (k < 1 ? (bh - top - bottom - worldH) * (1 - k) * 0.5 : 0);
  const worldTop = Math.max(top, worldBottom - worldH);
  const x0 = -worldLeft / s;
  const y0 = -worldTop / s;
  const w = bw / s;
  const h = bh / s;
  return {
    x0, y0, w, h, s,
    bands: { above: -y0, below: y0 + h - H, left: -x0, right: x0 + w - W },
    shape: shapeOf(bw, bh),
    filled: true
  };
}

/** World units to screen px, and back, through a frame. @type {(frame: Frame, x: number, y: number) => { x: number, y: number }} */
export const toScreen = (frame, x, y) => ({ x: (x - frame.x0) * frame.s, y: (y - frame.y0) * frame.s });
/** @type {(frame: Frame, px: number, py: number) => { x: number, y: number }} */
export const toWorld = (frame, px, py) => ({ x: frame.x0 + px / frame.s, y: frame.y0 + py / frame.s });

/* ─── ⚙ Setup: every choice, its words, and its default (one table; the game and the line both read it) ─── */
/** @type {ReadonlyArray<SetupRow>} */
export const SETUP = Object.freeze([
  ['hold', 'How you hold it', [['auto', 'As this screen suggests'], ['one_thumb', 'One thumb, held up'], ['two_thumbs', 'Two thumbs, on its side'], ['propped', 'Propped up, a finger'], ['desk', 'At a desk'], ['far', 'From across the room']], 'auto'],
  ['fill', 'Full screen, the lanes', [['fit', 'Keep their shape, in the middle'], ['fill', 'Fill it; the buttons stand on the ground']], 'fit'],
  ['share', 'The lanes take', [[1, 'All the room'], [0.9, 'Most of it'], [0.8, 'Less, with more ground']], 1],
  ['size', 'Cabinet', [['fit', 'Fit the window'], [0.86, 'Small'], [1, 'Medium'], [1.16, 'Large'], [1.32, 'Larger']], 'fit'],
  ['wide', 'The game takes', [['page', 'The page’s column'], ['window', 'The whole window']], 'page'],
  ['pace', 'Pace', [[0.8, 'Gentle'], [1, 'As written'], [1.2, 'Brisk']], 1],
  ['controls', 'Controls', [['icons', 'Icons, one row'], ['words', 'Icons and words']], 'icons'],
  ['controlsAt', 'Controls sit', [['top', 'Above the screen'], ['bottom', 'Below it']], 'top'],
  ['buttons', 'Throw and hop', [['middle', 'In the middle'], ['sides', 'Either side'], ['ab', 'A/B, diagonal']], 'middle'],
  ['buttonsSwap', 'Which is which', [[false, 'Throw, then hop'], [true, 'Hop, then throw']], false],
  ['controlsSize', 'Button size', [[0.85, 'Small'], [1, 'Medium'], [1.2, 'Large']], 1],
  ['arrows', 'On-screen arrows', [['row', 'In a row'], ['sides', 'Either side'], ['cross', 'A cross']], 'row'],
  ['controlsPlace', 'Arrows and buttons', [['under', 'Under the screen'], ['edges', 'At its edges'], ['over', 'Over the screen']], 'under'],
  ['tap', 'A tap in the lanes', [['throw', 'Throws there'], ['go', 'Walks there'], ['step', 'Steps toward it'], ['hop', 'Hops'], ['none', 'Nothing']], 'throw'],
  ['doubleTap', 'A double tap', [['none', 'Two taps'], ['hop', 'Hops'], ['throw', 'Throws there'], ['go', 'Walks there']], 'none'],
  ['swipeUp', 'A quick swipe up', [['step', 'Steps ahead'], ['hop', 'Hops (a slow drag steps)']], 'step'],
  ['panels', 'Panels', [['auto', 'Arranged for this screen'], ['manual', 'As set below']], 'manual'],
  ['cardPace', 'New cards', [['at-once', 'Open at once'], ['breath', 'Wait for a breath'], ['quiet', 'Never pause']], 'at-once'],
  ['music', 'Music', [['quiet', 'Only what happens'], ['groove', 'Rhythms you have found, softly'], ['full', 'Rhythms and the room’s chord, held']], 'quiet'],
  ['themes', 'Characters', [['calls', 'A short call each'], ['themes', 'Their own themes, and how the chapter leans']], 'calls'],
  ['glow', 'Glow', [['off', 'Off'], ['beat', 'On every beat'], ['bar', 'On the first of each bar']], 'off'],
  ['panelsAt', 'Caption and heights', [['beside', 'Beside the cabinet (wide screens)'], ['cabinet', 'In the cabinet']], 'beside'],
  ['storyAt', 'The story', [['beside', 'Beside the screen'], ['under', 'Under the screen'], ['off', 'Folded away']], 'beside'],
  ['storyIn', 'Story in the lanes', [['caption', 'A caption'], ['road', 'On the road'], ['both', 'Both'], ['off', 'Not in the lanes']], 'auto'],
  ['storyMotion', 'Story moves', [['passage', 'A passage at a time'], ['smooth', 'Smoothly, with the carry']], 'passage'],
  ['storyLine', 'Passing line', [[0.3, 'High'], [0.5, 'Middle'], [0.66, 'Low']], 0.5],
  ['flowSize', 'Story words', [[0.88, 'Small'], [1, 'Medium'], [1.18, 'Large'], [1.36, 'Larger']], 1],
  ['caption', 'Caption box', [[true, 'Shown'], [false, 'Hidden (still said aloud)']], true],
  ['heightsShown', '⤒ Heights strip', [[true, 'Shown'], [false, 'Hidden']], true],
  ['focusOnPlay', 'On Play', [[true, 'Bring the game into view'], [false, 'Leave the page where it is']], true]
]);

/* The sheet in sections, each with its icon (icons.mjs). Every SETUP row belongs to one section. */
/** @type {ReadonlyArray<[string, string, string, string[]]>} */
export const SETUP_GROUPS = Object.freeze([
  ['screen', 'Screen and pace', 'screen', ['fill', 'share', 'size', 'wide', 'pace', 'panels', 'panelsAt', 'heightsShown', 'focusOnPlay']],
  ['controls', 'Buttons and arrows', 'controls', ['controls', 'controlsAt', 'arrows', 'controlsPlace', 'buttons', 'buttonsSwap', 'controlsSize']],
  ['touch', 'Taps and swipes', 'touch', ['tap', 'doubleTap', 'swipeUp']],
  ['story', 'The story', 'book', ['storyAt', 'storyIn', 'storyMotion', 'storyLine', 'flowSize']],
  ['cards', 'Cards and captions', 'cards', ['cardPace', 'caption']],
  ['music', 'Music and rhythm', 'sound', ['music', 'themes', 'glow']]
]);

/* ─── How a screen is held: each a set of choices made at once, drawn, and said as Spw ───
 * A hold changes only how the board meets the hands (frame, buttons, taps, sizes), never what is shown (the
 * layouts do that): the two are separate dimensions, and any hold goes with any layout. */
/** @type {Readonly<Record<string, Hold>>} */
export const HOLDS = Object.freeze({
  one_thumb: {
    name: 'One thumb', says: 'A phone held up in one hand. In full screen the lanes fill it, the buttons stand on the ground under your thumb, a tap walks there and a double tap hops.',
    view: { fill: 'fill', share: 1, controlsPlace: 'under', arrows: 'row', buttons: 'sides', tap: 'go', doubleTap: 'hop', swipeUp: 'hop', controlsSize: 1.2 }
  },
  two_thumbs: {
    name: 'Two thumbs', says: 'A phone or a small tablet on its side. The lanes fill the middle; arrows under one thumb, throw and hop under the other, on the verges.',
    view: { fill: 'fill', share: 1, controlsPlace: 'edges', arrows: 'sides', buttons: 'ab', tap: 'throw', doubleTap: 'none', swipeUp: 'step', controlsSize: 1 }
  },
  propped: {
    name: 'Propped up', says: 'A tablet on a stand, played with a finger. The lanes fill it, a cross of arrows at one edge, and a tap throws.',
    view: { fill: 'fill', share: 0.9, controlsPlace: 'edges', arrows: 'cross', buttons: 'middle', tap: 'throw', doubleTap: 'hop', controlsSize: 1.2 }
  },
  desk: {
    name: 'At a desk', says: 'Keys and a pointer. The lanes keep their shape beside the story; the buttons carry their words.',
    view: { fill: 'fit', controlsPlace: 'under', arrows: 'row', buttons: 'middle', controls: 'words', tap: 'throw', doubleTap: 'none', controlsSize: 1 }
  },
  far: {
    name: 'From across the room', says: 'A big screen seen from a sofa. Everything larger, the lanes filling it, the words on the buttons.',
    view: { fill: 'fill', share: 0.9, controls: 'words', controlsSize: 1.2, flowSize: 1.36, tap: 'throw' }
  }
});

/**
 * The hold a screen suggests, before anyone chooses: a touch screen held up, on its side, or a big one; or a desk.
 * @param {{ coarse?: boolean, vw?: number, vh?: number }} [screen]
 * @returns {string}
 */
export function suggestHold({ coarse = false, vw = 1280, vh = 800 } = {}) {
  if (!coarse) return vw >= 1600 && vh >= 900 ? 'far' : 'desk';
  const small = Math.min(vw, vh) < 600;
  if (vw > vh * 1.15) return small ? 'two_thumbs' : 'propped';
  return small ? 'one_thumb' : 'propped';
}

/** A hold drawn small: the screen's outline, the lanes in it, the ground or verges, and where the thumbs go. @param {string} id @returns {string} */
export function holdMini(id) {
  const across = id === 'two_thumbs' || id === 'propped' || id === 'far';
  const [w, h] = across ? [100, 56] : [40, 56];
  const ox = across ? 0 : 30;
  const lanes = across ? (id === 'propped' ? [36, 4, 30, 47] : [34, 4, 32, 48]) : [ox + 4, 12, 32, 30];
  const ground = across ? '' : `<rect class="pie-mini-ground" x="${ox + 2}" y="43" width="36" height="11" rx="1.2"/>`;
  const haze = across ? '' : `<rect class="pie-mini-haze" x="${ox + 4}" y="3" width="32" height="9" rx="1.2"/>`;
  /** @type {Record<string, string>} */
  const THUMBS = {
    one_thumb: `<circle class="pie-mini-thumb" cx="${ox + 29}" cy="48" r="5"/>`,
    two_thumbs: '<circle class="pie-mini-thumb" cx="14" cy="40" r="6"/><circle class="pie-mini-thumb" cx="86" cy="40" r="6"/>',
    propped: '<circle class="pie-mini-thumb" cx="16" cy="40" r="5"/>',
    desk: '',
    far: '<rect class="pie-mini-thumb" x="44" y="50" width="12" height="4" rx="2"/>'
  };
  const thumbs = THUMBS[id] || '';
  const window = id === 'desk'
    ? `<rect class="pie-mini-window" x="0.5" y="0.5" width="99" height="55" rx="2.5"/><rect class="pie-mini-words" x="6" y="8" width="22" height="40" rx="1.2"/><rect class="pie-mini-lanes" x="34" y="4" width="32" height="48" rx="1.2"/><rect class="pie-mini-tools" x="72" y="44" width="22" height="6" rx="1.2"/>`
    : `<rect class="pie-mini-window" x="${ox + 0.5}" y="0.5" width="${w - 1}" height="${h - 1}" rx="${across ? 2.5 : 4}"/>${haze}<rect class="pie-mini-lanes" x="${lanes[0]}" y="${lanes[1]}" width="${lanes[2]}" height="${lanes[3]}" rx="1.2"/>${ground}`;
  return `<svg viewBox="0 0 100 56" aria-hidden="true" class="pie-mini">${window}${thumbs}</svg>`;
}

/* ─── The line: ^board{ … } ───────────────────────────────────────────────
 * Each choice is one term, in its sigil's role: @ whose hands (hold, hand), % an amount (sizes, pace, the
 * lanes' share), = a value the board is tuned to (everything else). A key's name is its Setup key in
 * snake_case, except two said as what they are: fill is =frame, share is %lanes. */
/** @type {SetupRow} */
const HAND_ROW = ['hand', 'Hand', [['right', 'Right'], ['left', 'Left']], 'right'];
/** @type {ReadonlyArray<SetupRow>} */
const ROWS = Object.freeze([...SETUP, HAND_ROW]);
const PERSPECTIVE = new Set(['hold', 'hand']);
/** @type {Readonly<Record<string, string>>} */
const ALIAS = Object.freeze({ fill: 'frame', share: 'lanes' });
/** @type {Readonly<Record<string, string>>} */
const UNALIAS = Object.freeze(Object.fromEntries(Object.entries(ALIAS).map(([k, v]) => [v, k])));
/** @param {string} key @returns {string} */
export const termName = (key) => ALIAS[key] || key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
/** @param {string} name @returns {string} */
const keyOf = (name) => UNALIAS[name] || name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
/** @param {unknown} value @returns {string} */
const word = (value) => String(value).replace(/-/g, '_');
/** @param {string} key @param {Choice} value @returns {string} */
const sigilOf = (key, value) => (PERSPECTIVE.has(key) ? '@' : typeof value === 'number' ? '%' : '=');

/**
 * The line for a set of choices. chosen(key) gives what the player chose for that key, or undefined if they
 * never did; only chosen keys whose value is one of the row's own are written, in the table's order.
 * @param {(key: string) => Choice | undefined | null} chosen
 * @returns {string}
 */
export function boardLine(chosen) {
  /** @type {string[]} */
  const terms = [];
  ROWS.forEach(([key, , options]) => {
    const value = chosen(key);
    if (value === undefined || value === null) return;
    const option = options.find(([v]) => String(v) === String(value));
    if (!option) return;
    terms.push(`${sigilOf(key, option[0])}${termName(key)}[${word(option[0])}]`);
  });
  return `^board{ ${terms.join(' ')}${terms.length ? ' ' : ''}}`;
}

/** The terms of a line, read by hand: [{ sigil, name, arg }]. @param {unknown} src @returns {Term[] | null} */
function smallRead(src) {
  const body = /\^board\s*\{([\s\S]*)\}/.exec(String(src || ''));
  if (!body) return null;
  return [...body[1].matchAll(/([@=%])([a-z_]+)\[\s*([^\]\s]*)\s*\]/g)].map((m) => ({ sigil: m[1], name: m[2], arg: m[3] }));
}

/**
 * The terms of a line, read by the real parser (spw-seed): [{ sigil, name, arg }], or null if it did not read whole.
 * The parser's tree is walked loosely (any): its shapes are the workbench's, and pie-spw.mjs keeps the list of quirks.
 * @param {unknown} src @param {Parse} parse @returns {Term[] | null}
 */
function treeRead(src, parse) {
  let result;
  try { result = parse(String(src || ''), { lexProfile: 'prose' }); } catch { return null; }
  if (!result?.completeness?.complete || result.completeness.proseFallback) return null;
  const ast = result.ast || result.document || result;
  /** @type {any[]} */
  const top = (ast?.expression?.expressions || ast?.expressions || []).flatMap((/** @type {any} */ e) => e.terms || []);
  const board = top.find((t) => t.type === 'Operation' && t.operator?.value === '^' && t.operatorLabel?.value === 'board');
  if (!board) return null;
  /** @param {any} frame @returns {string} */
  const argOf = (frame) => {
    const v = frame?.content?.[0]?.value ?? frame?.content?.[0];
    const lit = v?.type === 'Literal' ? v.token?.value : v?.type === 'Expression' ? (v.terms || []).find((/** @type {any} */ t) => t.type === 'Identifier')?.token?.value ?? v.modifiers?.modifiers?.[0]?.value : v?.token?.value;
    return lit == null ? '' : String(lit);
  };
  /** @type {Term[]} */
  const terms = [];
  (board.body?.sequence?.expressions || []).forEach((/** @type {any} */ expr) => (expr.terms || []).forEach((/** @type {any} */ term) => {
    if (term.type === 'Operation') terms.push({ sigil: term.operator?.value, name: term.operatorLabel?.value || '', arg: argOf(term.frame) });
    // @word[…] reads as a Reference: the sigil is not kept on the node, and the frame hangs on the Expression.
    else if (term.type === 'Reference') terms.push({ sigil: '@', name: term.raw || term.path?.map((/** @type {any} */ p) => p.value).join('.') || '', arg: argOf(expr.frame || term.frame) });
  }));
  return terms;
}

/**
 * Read a line back into choices: { view, unknown, reader }. view holds only keys the line names with a value
 * the row has; unknown says, in words, every term that was not a choice (so nothing is dropped silently).
 * With parse (the real parser) the line must read whole; without it, or if it does not, the small reader reads it.
 * @param {unknown} src
 * @param {{ parse?: Parse | null }} [opts]
 * @returns {BoardRead}
 */
export function readBoardLine(src, { parse = null } = {}) {
  const fromTree = parse ? treeRead(src, parse) : null;
  const terms = fromTree || smallRead(src);
  const reader = fromTree ? 'spw-seed' : 'small';
  if (!terms) return { view: {}, unknown: ['no ^board{ … } in it'], reader };
  /** @type {Record<string, Choice>} */
  const view = {};
  /** @type {string[]} */
  const unknown = parse && !fromTree ? ['it did not read whole as Spw, so it was read by hand, term by term'] : [];
  terms.forEach(({ sigil, name, arg }) => {
    const key = keyOf(name.replace(/^@/, ''));
    const row = ROWS.find(([k]) => k === key);
    if (!row) { unknown.push(`${sigil}${name}: not a choice the board has`); return; }
    const option = row[2].find(([v]) => word(v) === word(arg));
    if (!option) { unknown.push(`${sigil}${name}[${arg}]: not one of its values`); return; }
    if (sigil !== sigilOf(key, option[0])) unknown.push(`${sigil}${name}: read, though it is written ${sigilOf(key, option[0])}${name}`);
    view[key] = option[0];
  });
  return { view, unknown, reader };
}

/** Every value a row may hold, by key (for a reader that keeps a record: nothing outside these is kept). */
/** @type {Readonly<Record<string, Choice[]>>} */
export const ALLOWED = Object.freeze(Object.fromEntries(ROWS.map(([key, , options]) => [key, options.map(([v]) => v)])));
