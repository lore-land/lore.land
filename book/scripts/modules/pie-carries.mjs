/**
 * pie-carries.mjs — what carrying the pie through a chapter does to the book (PLAN.E L28).
 *
 * Every chapter the carry finishes leaves a mark on that chapter, kept in this
 * browser only:
 *
 *   lean   how the carry went there, as the three lands' weights: boon (clowns
 *          satisfied, wonders kept, the warm things met), bane (knocks taken,
 *          slices boxed, baneberries brought to Mr. BaneWAP), bone (hops, perfect
 *          throws, slices lofted over the mimes). On the chapter page it leans the
 *          reading a little that way (lens-control.mjs weights), unless the reader
 *          has set a lens of their own.
 *   mimes  where Mimes Against WAP out-did the pie, they hold the chapter: it is
 *          harder to wonder about pie there. Its pie words go quiet (mimed) on the
 *          page and in the game's passage, and Mr. BoonWAP mimes rather than speaks
 *          while they lead. Carry the pie through again and out-do them to win it back.
 *
 * Nothing here is hidden: the chapter page says how and why it leans, the game
 * page lists every chapter's mark, and either can be switched off or forgotten.
 * No DOM at import; the game, the chapter pages and the entrance share it.
 */

const KEY = 'lore.pie.chapters.v1';
const PROJECTION_KEY = 'lore.pie.projection';
export const LEAN_NAMES = Object.freeze({ boon: 'fairy tale', bane: 'absurd reality', bone: 'low magic' });
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];
const words = (n) => WORDS[n] || String(n);

const normalize = (lean) => {
  const clean = ['boon', 'bane', 'bone'].map((id) => Math.max(0, Number(lean?.[id]) || 0));
  const total = clean[0] + clean[1] + clean[2];
  return total > 0
    ? { boon: clean[0] / total, bane: clean[1] / total, bone: clean[2] / total }
    : { boon: 1 / 3, bane: 1 / 3, bone: 1 / 3 };
};

/** Every chapter's mark: { [n]: { carried, lean, maw: null | 'won' | 'back', wonBack, at } }. */
export function readCarries() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCarries(all) {
  try { window.localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* kept for this visit only */ }
}

export const carryFor = (n) => readCarries()[n] || null;
export const mimesHold = (n) => carryFor(n)?.maw === 'won';

/**
 * A finished leg, kept. tally = { boon, bane, bone, wap, maw, mawSeen }.
 * Returns what changed: 'won' (the mimes took it), 'held' (they kept it), 'back' (won back), or null.
 */
export function keepCarry(n, tally) {
  const all = readCarries();
  const prev = all[n] || { carried: 0, lean: null, maw: null, wonBack: 0 };
  const raw = normalize({ boon: 1 + tally.boon, bane: 1 + tally.bane, bone: 1 + tally.bone });
  const lean = prev.lean
    ? normalize({ boon: prev.lean.boon * 0.45 + raw.boon * 0.55, bane: prev.lean.bane * 0.45 + raw.bane * 0.55, bone: prev.lean.bone * 0.45 + raw.bone * 0.55 })
    : raw;
  let maw = prev.maw;
  let outcome = null;
  let wonBack = prev.wonBack || 0;
  if (prev.maw === 'won') {
    if (tally.wap > tally.maw) {
      maw = 'back';
      wonBack += 1;
      outcome = 'back';
    } else {
      outcome = 'held';
    }
  } else if (tally.mawSeen && tally.maw >= 3 && tally.maw > tally.wap) {
    maw = 'won';
    outcome = 'won';
  }
  all[n] = { carried: (prev.carried || 0) + 1, lean, maw, wonBack, at: new Date().toISOString().slice(0, 10) };
  writeCarries(all);
  return outcome;
}

/** The reader's switch: may the carries lean the reading? On unless turned off. */
export function projectionOn() {
  try {
    // A spell can ask for this visit to read plainly (projection.mjs, ?plain=carries); the reader's own switch otherwise.
    if (window.sessionStorage.getItem('lore.pie.projection.visit') === 'off') return false;
    return window.localStorage.getItem(PROJECTION_KEY) !== 'off';
  } catch { return true; }
}
export function setProjection(on) {
  try {
    window.sessionStorage.removeItem('lore.pie.projection.visit');
    window.localStorage.setItem(PROJECTION_KEY, on ? 'on' : 'off');
  } catch { /* this visit */ }
}
export function forgetCarries() {
  try { window.localStorage.removeItem(KEY); } catch { /* nothing kept */ }
}

/** The land a lean favours, or '' when it is about even. */
export function leanOf(lean) {
  if (!lean) return '';
  const [[id, share], [, next]] = Object.entries(normalize(lean)).sort((a, b) => b[1] - a[1]);
  return share - next >= 0.06 ? id : '';
}
export function describeLean(lean) {
  const id = leanOf(lean);
  return id ? `leans toward ${LEAN_NAMES[id]}` : 'is about even';
}

/** The reading a carry gives a chapter: mostly balanced, nudged toward the carry's lean. */
export function projectedGenre(lean) {
  const l = normalize(lean);
  return normalize({ boon: 1 / 3 * 0.7 + l.boon * 0.3, bane: 1 / 3 * 0.7 + l.bane * 0.3, bone: 1 / 3 * 0.7 + l.bone * 0.3 });
}

/** Totals for the lore and the entrance. */
export function carriesSummary(all = readCarries()) {
  const entries = Object.entries(all);
  return {
    carried: entries.length,
    held: entries.filter(([, entry]) => entry.maw === 'won').map(([n]) => Number(n)).sort((a, b) => a - b),
    wonBack: entries.reduce((sum, [, entry]) => sum + (entry.wonBack || 0), 0),
    taken: entries.filter(([, entry]) => entry.maw === 'won' || entry.maw === 'back').length
  };
}

export const chapterList = (ns) => ns.map(words).join(', ').replace(/, ([^,]*)$/, ' and $1');

/** Pie words: what goes quiet where the mimes hold a chapter. */
export const PIE_WORDS = /(\bpi\(e\)|\b(?:pies?|WAP|slices?)\b)/gi;

const CHARM_SHAPES = Object.freeze({
  '[': { bracket: '[]', label: 'window', note: 'lights the way through longer' },
  '{': { bracket: '{}', label: 'room', note: 'steadies and poises the plate sooner' },
  '(': { bracket: '()', label: 'gathering', note: 'reaches a little wider for friends and berries' },
  '<': { bracket: '<>', label: 'passage', note: 'settles the pie and feeds the aura at each new chapter' }
});

/** The latest combine kept on the almanac bench, carried as a small bracework charm. */
export function activeCombine() {
  try {
    const list = JSON.parse(window.localStorage.getItem('lore.almanac.combines.v1') || '[]');
    const top = Array.isArray(list) && list[0];
    if (!top?.expr || typeof top.expr !== 'string') return null;
    const shape = CHARM_SHAPES[top.expr.trim()[0]] || CHARM_SHAPES['['];
    return { expr: top.expr, ...shape };
  } catch {
    return null;
  }
}

/** Keep a living-slot variant heard during a carry in lore.tellings.v1. */
export function recordHeardTelling(chapter, slotName, index) {
  if (!chapter || !slotName || !(index >= 0)) return false;
  try {
    const key = 'lore.tellings.v1';
    const raw = JSON.parse(window.localStorage.getItem(key) || '{}');
    const heard = raw && typeof raw === 'object' ? raw : {};
    const slotKey = `${Number(chapter)}:${slotName}`;
    const list = new Set(Array.isArray(heard[slotKey]) ? heard[slotKey] : []);
    if (list.has(index)) return false;
    list.add(index);
    heard[slotKey] = [...list].sort((a, b) => a - b);
    window.localStorage.setItem(key, JSON.stringify(heard));
    return true;
  } catch {
    return false;
  }
}

/** A snapshot of what this browser keeps across the book that touches the carry. */
export function readLoreTies() {
  const readObj = (k) => {
    try {
      const v = JSON.parse(window.localStorage.getItem(k) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch { return {}; }
  };
  const sightings = Object.keys(readObj('lore.sightings.v1')).length;
  const wonders = Object.keys(readObj('lore.almanac.v1')).length;
  const tellings = Object.values(readObj('lore.tellings.v1')).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  const combine = activeCombine();
  return { sightings, wonders, tellings, combine };
}

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

/**
 * The game page's account of it: every chapter's mark, the switch, and a way to forget.
 * mount: an element to fill (pie/index.html [data-pie-carries]).
 */
export function renderCarriesPanel(mount, { totalChapters = 15, onChange } = {}) {
  if (!mount) return;
  const all = readCarries();
  const on = projectionOn();
  const list = el('ol', { className: 'pie-carries-list' });
  const pending = [];
  for (let n = 1; n <= totalChapters; n += 1) {
    const entry = all[n];
    const href = `/book/chapter/${String(n).padStart(2, '0')}/`;
    if (!entry) {
      pending.push(n);
      continue;
    }
    const lean = normalize(entry.lean);
    const bar = el('span', { className: 'pie-carries-lean', 'aria-hidden': 'true' },
      ...['boon', 'bane', 'bone'].map((id) => {
        const seg = el('i', { className: `is-${id}` });
        seg.style.flexGrow = String(Math.round(lean[id] * 100));
        return seg;
      }));
    const mimes = entry.maw === 'won'
      ? el('span', { className: 'pie-carries-chip is-mimes' }, 'held by the mimes')
      : entry.maw === 'back' ? el('span', { className: 'pie-carries-chip is-back' }, 'won back') : null;
    list.append(el('li', { className: `pie-carries-row${entry.maw === 'won' ? ' is-held' : ''}` },
      el('span', { className: 'pie-carries-n' }, String(n)),
      el('span', { className: 'pie-carries-what' },
        el('a', { href }, `Chapter ${words(n)}`),
        ` ${describeLean(lean)} · carried ${entry.carried === 1 ? 'once' : `${entry.carried} times`}`,
        mimes ? ' · ' : '', mimes),
      bar));
  }
  const toggle = el('button', { type: 'button', className: 'pie-carries-toggle', 'aria-pressed': on ? 'true' : 'false' },
    on ? 'Your carries lean the reading: on' : 'Your carries lean the reading: off');
  toggle.addEventListener('click', () => {
    setProjection(!projectionOn());
    renderCarriesPanel(mount, { totalChapters, onChange });
    onChange?.();
  });
  const forget = el('button', { type: 'button', className: 'pie-carries-forget' }, 'Forget the carries');
  forget.addEventListener('click', () => {
    if (forget.dataset.sure !== 'yes') {
      forget.dataset.sure = 'yes';
      forget.textContent = 'Forget every chapter’s mark? Press again';
      return;
    }
    forgetCarries();
    renderCarriesPanel(mount, { totalChapters, onChange });
    onChange?.();
  });
  const summary = carriesSummary(all);
  const lede = summary.carried
    ? `${summary.carried} chapter${summary.carried === 1 ? '' : 's'} carried through.${summary.held.length ? ` The mimes hold ${summary.held.length === 1 ? 'Chapter' : 'Chapters'} ${chapterList(summary.held)}: it is harder to wonder about pie there until you win ${summary.held.length === 1 ? 'it' : 'them'} back.` : ''}`
    : 'No chapter carried through yet. Finish a chapter in the lanes and it will be marked here.';
  mount.querySelector('[data-pie-carries-lede]')?.replaceChildren(lede);
  const body = mount.querySelector('[data-pie-carries-body]') || mount;
  // Chapters not yet carried, in one line: each a door into the carry from there.
  const rest = pending.length
    ? el('p', { className: 'pie-carries-pending' }, 'Not carried through yet: ',
      ...pending.map((n) => el('a', { href: `/pie/?chapter=${n}`, className: 'pie-carries-pending-n', 'aria-label': `Carry the pie from Chapter ${words(n)}` }, String(n))))
    : null;
  const ties = readLoreTies();
  const tiesLine = el('p', { className: 'pie-carries-ties' },
    'Kept across the book in this browser: ',
    el('a', { href: '/almanac/' }, `almanac (${ties.wonders} kept)`),
    ties.combine ? [` · bench charm `, el('code', {}, ties.combine.expr), ` (${ties.combine.note})`] : ' · no bench combine kept yet',
    ` · sightings (${ties.sightings}/9 strokes, steadying the figure’s hands)`,
    ` · other tellings heard (${ties.tellings}).`
  );
  body.replaceChildren(...(list.children.length ? [list] : []), rest, tiesLine, el('p', { className: 'pie-carries-controls' }, toggle, ' ', forget));
}
