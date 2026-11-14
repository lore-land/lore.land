/**
 * way-through.mjs — your way through the book, as one line of Spw.
 *
 * A reader may set a chapter aside, or keep two characters out of the same room. Both are said as a line:
 *
 *   ^way{ !aside[7, 9] =apart[two_pies] }
 *
 * The line is the state: the panel at the desk writes it, typing it sets the panel, and a link can carry it for one
 * visit (?way=). The prerendered page is the book as it stands and no mark is touched: a chapter set aside can still be opened,
 * and a chapter that follows one says what it held. The lanes read the same line (pie-game.mjs): they skip what is set
 * aside and keep the same people apart.
 *
 * Every act has one sentence, and that sentence is its accessible name. Pointing at a control primes it (the foot of
 * the panel says what it would do); pressing actualizes it (the foot says what it did). The grammar is factshift.center's.
 *
 * Each chapter also says why it is in the book, and holds one wonder: a line one edit past a room's own, a guess among
 * a few ways it could come out, and a later chapter to check it against (workbench: docs/theory/spw/wonder-field.spw).
 * A guess is kept in this browser; what closes it is the reader's own word.
 *
 * Where the book forks (the forks trial): every choice the way offers is also a fork, one line of Spw drawn from
 * way.json (forks.mjs): ?two_pies[way]{ =boon@meet{ @c12 } =bane@apart{ @c12[told] } }. A chapter's end draws the
 * forks that touch it, with the reader's side lit; taking the other side writes the way and tells the chapter again at
 * once. At the desk, each pairing shows its fork beside its button.
 *
 * Switches: way-through, reasons and forks, all trials. Off, this module fetches nothing and adds nothing.
 * Data: book/content/world/way.json, held by book:check.
 */

import { settle } from './settled.mjs?v=2026_11_09.L';
import { readSwitches, setSwitch } from './reading-switches.mjs?v=2026_11_13.B';
import { renderSpell } from './spw-spell.mjs?v=2026_11_12.A';
import { TOTAL_CHAPTERS } from './book-extent.mjs';

export const WAY_URL = '/book/content/world/way.json?v=2026_11_10.A';
const WAY_KEY = 'lore.way.v1';
const VISIT_KEY = 'lore.way.visit';
export const ASKED_KEY = 'lore.wonders.asked.v1';
const PROGRESS_KEY = 'lore.chapter.progress.v1';
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];
const words = (n) => `Chapter ${WORDS[n] || n}`;
const pad = (n) => String(n).padStart(2, '0');
const hrefOf = (n) => `/book/chapter/${pad(n)}/`;

let dataPromise = null;
export const loadWay = () => {
  dataPromise = dataPromise || fetch(WAY_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  return dataPromise;
};

const store = (kind) => { try { return window[kind]; } catch { return null; } };
const readJSON = (s, key) => { try { return JSON.parse(s?.getItem(key) || 'null'); } catch { return null; } };
const clean = (way) => ({
  aside: [...new Set((way?.aside || []).map(Number).filter((n) => n >= 1 && n <= TOTAL_CHAPTERS))].sort((a, b) => a - b),
  apart: [...new Set((way?.apart || []).map(String).filter((id) => /^[a-z_]+$/.test(id)))].sort()
});

/* ─── The line ─── */

/** The way, said as Spw. An empty way is an empty body. */
export function waySpell(way) {
  const { aside, apart } = clean(way);
  const parts = [aside.length && `!aside[${aside.join(', ')}]`, apart.length && `=apart[${apart.join(', ')}]`].filter(Boolean);
  return parts.length ? `^way{ ${parts.join(' ')} }` : '^way{ }';
}

/** A line read back; null when it is not a way. book:check holds this small reader to the Spw interpreter. */
export function parseWay(text) {
  const src = String(text || '').trim();
  if (!/^\^way\s*\{[\s\S]*\}$/.test(src)) return null;
  const list = (op, name) => {
    const m = new RegExp(`\\${op}${name}\\[([^\\]]*)\\]`).exec(src);
    return m ? m[1].split(/[,\s]+/).filter(Boolean) : [];
  };
  return clean({ aside: list('!', 'aside'), apart: list('=', 'apart') });
}

/* ─── Whose way it is: a link's for this visit, otherwise the reader's ─── */

export function wayIsOn() {
  if (readJSON(store('sessionStorage'), VISIT_KEY)) return true;
  try { return readSwitches().values['way-through'] === 'on'; } catch { return false; }
}
export function readWay() {
  const visit = readJSON(store('sessionStorage'), VISIT_KEY);
  if (visit) return { ...clean(visit), source: 'visit' };
  if (!wayIsOn()) return { aside: [], apart: [], source: 'off' };
  return { ...clean(readJSON(store('localStorage'), WAY_KEY)), source: 'yours' };
}
/* `now` keeps the whole list, a pairing's chapters included, so chapter-links.mjs can step over them without the data. */
export function writeWay(way, data = null) {
  try {
    const kept = clean(way);
    store('sessionStorage')?.removeItem(VISIT_KEY);
    store('localStorage')?.setItem(WAY_KEY, JSON.stringify({ ...kept, now: asideNow(kept, data) }));
  } catch { /* this visit */ }
}
/** A way handed over in the address holds for this visit, and is never saved unless the reader keeps it. */
export function takeWayFromAddress() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('way')) return;
    const value = params.get('way');
    const way = value === 'mine' ? null : parseWay(value);
    if (way) store('sessionStorage')?.setItem(VISIT_KEY, JSON.stringify(way));
    else store('sessionStorage')?.removeItem(VISIT_KEY);
    // What someone would rather not meet is theirs: read it, then take it out of the address, the history and any link copied from here.
    const url = new URL(window.location.href);
    url.searchParams.delete('way');
    window.history.replaceState(window.history.state, '', url);
  } catch { /* the page reads as it would */ }
}

/** The chapters out of the way: the reader's own, and any a pairing needs. */
export function asideNow(way, data) {
  const fromPairs = (data?.pairs || []).filter((p) => way.apart.includes(p.id)).flatMap((p) => p.aside || []);
  return [...new Set([...way.aside, ...fromPairs])].sort((a, b) => a - b);
}
export const pairFor = (who, data, way) => (data?.pairs || []).find((p) => way.apart.includes(p.id) && who.every((id) => p.who.includes(id))) || null;

/** The next chapter on the way after n, going round; n itself if everything is set aside. */
export function keptAfter(n, aside, step = 1) {
  for (let i = 1; i <= TOTAL_CHAPTERS; i += 1) {
    const c = ((n - 1 + step * i + TOTAL_CHAPTERS * i) % TOTAL_CHAPTERS) + 1;
    if (!aside.includes(c)) return c;
  }
  return n;
}

/* ─── A chapter ─── */

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

/* A phrase, wherever it stands: across several text nodes if something has wrapped its words (Structure mode does). */
function swapPhrase(main, swap, title) {
  const nodes = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const whole = nodes.map((node) => node.nodeValue).join('');
  const at = whole.indexOf(swap.find);
  if (at < 0) return null;
  const place = (offset) => {
    let seen = 0;
    for (const node of nodes) {
      if (offset <= seen + node.nodeValue.length) return [node, offset - seen];
      seen += node.nodeValue.length;
    }
    return [nodes[nodes.length - 1], nodes[nodes.length - 1].nodeValue.length];
  };
  const range = document.createRange();
  range.setStart(...place(at));
  range.setEnd(...place(at + swap.find.length));
  const was = range.cloneContents();
  range.deleteContents();
  const mark = el('span', { className: 'way-swapped', title }, swap.to);
  range.insertNode(mark);
  return () => mark.replaceWith(was);
}

/** A pairing's swaps on this chapter, each one marked where it stands. Returns how to put every one of them back. */
function applySwaps(main, pair, n) {
  const title = `Told this way because of your way through: ${pair.name}`;
  const undo = [];
  (pair.rooms || []).filter((room) => room.chapter === n).forEach((room) => room.swaps.forEach((swap) => {
    if (swap.para) {
      const p = [...main.querySelectorAll('[data-ebook-section] p')].find((node) => node.textContent.trim().startsWith(swap.para));
      if (!p) return;
      const was = [...p.childNodes];
      p.replaceChildren(swap.text);
      p.classList.add('way-swapped');
      p.title = title;
      undo.push(() => { p.replaceChildren(...was); p.classList.remove('way-swapped'); p.removeAttribute('title'); });
      return;
    }
    const back = swapPhrase(main, swap, title);
    if (back) undo.push(back);
  }));
  return undo;
}

/* Said at the head of the chapter, with a way back to the words as written, for this page. */
function swapNote(undo, pairs, source) {
  const back = el('button', { type: 'button', className: 'way-pick', 'aria-label': 'Read this chapter as the book has it, for this page' }, 'Read it as written');
  const note = el('aside', { className: 'way-note', 'aria-label': 'This chapter is told another way' },
    el('p', { className: 'way-kicker' }, 'Told another way here'),
    el('p', {}, `${source === 'visit' ? 'A link you opened asks' : 'Your way through asks'} for this: ${pairs.map((p) => p.name).join('; ')}. The changed words are marked.`),
    el('p', { className: 'way-foot' }, back, ' ', el('a', { href: '/scriptorium/#way' }, 'Change your way through')));
  back.addEventListener('click', () => { undo.forEach((fn) => fn()); note.replaceChildren(el('p', { className: 'way-foot' }, 'Back as the book has it, for this page.')); settle(note); });
  return note;
}

function bridgeNote(gap, data) {
  const items = gap.map((n) => el('li', {}, el('a', { href: hrefOf(n) }, words(n)), `: ${data.chapters[n].holds}`));
  return el('aside', { className: 'way-note way-bridge', 'aria-label': 'What the chapters you set aside held' },
    el('p', { className: 'way-kicker' }, 'Set aside before this one'),
    el('ul', {}, items),
    el('p', { className: 'way-foot' }, el('a', { href: '/scriptorium/#way' }, 'Change your way through')));
}

/* The guess, and what closes it. A guess is written before the check; the answer is the reader's. */
const readAsked = () => readJSON(store('localStorage'), ASKED_KEY) || {};
const writeAsked = (all) => { try { store('localStorage')?.setItem(ASKED_KEY, JSON.stringify(all)); } catch { /* this visit */ } };
const visitedChapters = () => (readJSON(store('localStorage'), PROGRESS_KEY)?.visited || []).map(Number);

function wonderCard(n, wonder) {
  const box = el('div', { className: 'way-wonder' });
  const paint = () => {
    const asked = readAsked()[n];
    box.replaceChildren(
      el('p', { className: 'way-kicker' }, 'One edit away'),
      renderSpell(wonder.line, { cast: false, layout: 'line', label: 'A room of this chapter, as written' }),
      renderSpell(wonder.edit, { cast: false, layout: 'line', label: 'The same room, one edit away' }),
      el('p', {}, wonder.says),
      el('p', { className: 'way-asks' }, wonder.asks)
    );
    if (!asked) {
      const row = el('div', { className: 'way-ways', role: 'group', 'aria-label': 'What do you expect?' });
      wonder.ways.forEach((way, i) => {
        const b = el('button', { type: 'button', className: 'way-pick', 'aria-label': `Expect this: ${way}` }, way);
        b.addEventListener('click', () => { const all = readAsked(); all[n] = { expect: i, at: new Date().toISOString().slice(0, 10) }; writeAsked(all); paint(); settle(box); });
        row.append(b);
      });
      box.append(row, el('p', { className: 'way-foot' }, wonder.probe ? `Guess before you get to ${words(wonder.probe)}, and see.` : 'This one is kept open. Guess anyway, or leave it.'));
      return;
    }
    box.append(el('p', { className: 'way-receipt' }, `You expected: ${wonder.ways[asked.expect]}.`));
    if (asked.answer) {
      box.append(el('p', { className: 'way-foot' }, asked.answer === 'held' ? 'You said it held.' : asked.answer === 'other' ? 'You said it went another way.' : 'You kept it open.'));
    } else if (wonder.probe && visitedChapters().includes(wonder.probe)) {
      const row = el('div', { className: 'way-ways', role: 'group', 'aria-label': `Having read ${words(wonder.probe)}, did it hold?` });
      [['held', 'It held'], ['other', 'It went another way'], ['open', 'Keep it open']].forEach(([id, label]) => {
        const b = el('button', { type: 'button', className: 'way-pick', 'aria-label': `Having read ${words(wonder.probe)}: ${label}` }, label);
        b.addEventListener('click', () => { const all = readAsked(); all[n] = { ...all[n], answer: id }; writeAsked(all); paint(); settle(box); });
        row.append(b);
      });
      box.append(el('p', { className: 'way-foot' }, `You have been to ${words(wonder.probe)} since. Only you can say.`), row);
    } else if (wonder.probe) {
      box.append(el('p', { className: 'way-foot' }, el('a', { href: hrefOf(wonder.probe) }, words(wonder.probe)), ' is where to check it.'));
    }
  };
  paint();
  return box;
}

function reasonFold(n, data) {
  const c = data.chapters[n];
  return el('details', { className: 'way-why', 'data-way-why': n },
    el('summary', {}, 'Why this chapter is here'),
    el('p', {}, c.reason),
    wonderCard(n, c.wonder));
}

/* ─── Forks: each choice of the way, drawn from its own line (forks.mjs) ─── */

/* forks.mjs loads only when the forks trial is on: off, a chapter fetches nothing for it. */
let F = null;
let forksPromise = null;
const loadForks = () => {
  forksPromise = forksPromise || import('./forks.mjs?v=2026_11_13.B').then((m) => { F = m; return m; }).catch(() => null);
  return forksPromise;
};

const SIDE_VERBS = { kept: 'Keep it', aside: 'Set it aside', meet: 'Let them meet', apart: 'Keep them apart' };
const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}
/* A side's sign, boon or bane: the drawing dashes a bane side, and its control says so in its border. */
const signed = (node, valence) => { node.dataset.sign = valence; return node; };
const forcedAside = (n, data, way) => (data?.pairs || []).find((p) => way.apart.includes(p.id) && (p.aside || []).includes(n)) || null;

/**
 * One fork: its line, its shape (a trunk, and a branch for each side; the reader's lit, a bane side dashed), and its
 * sides with where each goes. With take, each side is a control; without, a drawing.
 */
function forkFigure(entry, { on, forced = null, take = null, say = () => {}, caption = true } = {}) {
  const { sides } = entry.fork;
  const ys = sides.map((_, i) => (sides.length === 1 ? 40 : 14 + (i * 52) / (sides.length - 1)));
  const draw = svgEl('svg', { viewBox: '0 0 120 80', class: 'way-fork-draw', 'aria-hidden': 'true', focusable: 'false' });
  draw.append(svgEl('path', { class: 'way-fork-trunk', d: 'M6 40 H40' }));
  sides.forEach((s, i) => {
    const lit = s.side === on ? ' is-on' : '';
    draw.append(signed(svgEl('path', { class: `way-fork-branch${lit}`, d: `M40 40 C62 40 70 ${ys[i]} 110 ${ys[i]}` }), s.valence));
    draw.append(signed(svgEl('circle', { class: `way-fork-end${lit}`, cx: 110, cy: ys[i], r: lit ? 5 : 3.5 }), s.valence));
  });
  draw.append(svgEl('circle', { class: 'way-fork-knot', cx: 40, cy: 40, r: 4.5 }));
  const list = el('ol', { className: 'way-fork-sides' }, sides.map((s) => {
    const lit = s.side === on;
    const what = F.saySide(s);
    const body = [el('code', { className: 'way-fork-edge' }, F.sideLine(s)), el('span', { className: 'way-fork-words' }, what)];
    if (!take) return signed(el('li', { className: lit ? 'is-on' : null }, ...body, lit ? el('small', {}, 'your side') : null), s.valence);
    const blocked = Boolean(forced) && s.side === 'kept';
    const would = lit ? `You are on this side: ${what}.` : `${SIDE_VERBS[s.side] || 'Take this side'}: ${what}.`;
    const b = signed(el('button', { type: 'button', className: 'way-fork-side', 'data-side': s.side, 'aria-pressed': lit ? 'true' : 'false', 'aria-label': would, disabled: blocked },
      ...body, lit ? el('small', {}, 'your side') : null, blocked ? el('small', {}, `kept aside by: ${forced.name}`) : null), s.valence);
    b.addEventListener('pointerenter', () => say(would));
    b.addEventListener('focus', () => say(would));
    b.addEventListener('click', () => { if (lit) say(would); else take(s.side); });
    return el('li', {}, b);
  }));
  return el('figure', { className: 'way-fork', 'data-fork': entry.id, 'data-side': on },
    caption ? el('figcaption', { className: 'way-kicker' }, entry.kind === 'chapter' ? `${entry.name}: kept, or set aside` : entry.name) : null,
    renderSpell(entry.line, { cast: false, layout: 'auto', label: `${entry.name}, as a fork in Spw` }),
    el('div', { className: 'way-fork-shape' }, draw, list));
}

/** The forks that touch chapter n, at its end. Taking a side writes the way, then `taken` tells the chapter again. */
function forksFold(n, data, { taken }) {
  const fold = el('details', { className: 'way-forks', 'data-way-forks': n });
  const foot = el('output', { className: 'way-receipt', 'aria-live': 'polite' }, '');
  const say = (text) => { foot.textContent = text; };
  const take = (entry, side) => {
    // Choosing is consent, as at the desk: the way is turned on by the reader's own hand, and turned on first, so a way
    // they set before switching it off is read back and kept, not written over.
    setSwitch('way-through', true);
    const way = readWay();
    const base = { aside: way.aside, apart: way.apart };
    const next = entry.kind === 'chapter'
      ? { ...base, aside: side === 'aside' ? [...base.aside, n] : base.aside.filter((c) => c !== n) }
      : { ...base, apart: side === 'apart' ? [...base.apart, entry.pair] : base.apart.filter((id) => id !== entry.pair) };
    writeWay(next, data);
    paint();
    taken();
    const s = entry.fork.sides.find((x) => x.side === side);
    say(`Done: ${(SIDE_VERBS[side] || side).toLowerCase()}. ${F.saySide(s)}. Your way through is now ${waySpell(next)}`);
    settle(fold);
  };
  const paint = () => {
    const way = readWay();
    const now = asideNow(way, data);
    const forced = forcedAside(n, data, way);
    const seen = visitedChapters();
    const figures = F.forksOfChapter(n, data, TOTAL_CHAPTERS).map((entry) => {
      const figure = forkFigure(entry, { on: F.sideOf(entry, way, now), forced: entry.kind === 'chapter' ? forced : null, say, take: (side) => take(entry, side) });
      // A pairing that reaches chapters not yet read names them: folded, as the desk folds what a pairing gives away.
      const ahead = entry.kind === 'pair' && entry.fork.sides.some((s) => s.where.some((w) => { const c = Number(/^c(\d+)$/.exec(w.to)?.[1]); return c > n && !seen.includes(c); }));
      return ahead ? el('details', { className: 'way-fork-ahead' }, el('summary', {}, `${entry.name}: where this goes names chapters you have not read yet`), figure) : figure;
    });
    fold.replaceChildren(
      el('summary', {}, 'Where this chapter forks'),
      el('p', {}, 'Each fork is one line: what forks, on what, and where each side goes. The lit side is the one you are on; take the other and this chapter is told that way at once.'),
      ...figures,
      el('p', { className: 'way-foot' }, wayIsOn() ? '' : 'Taking a side turns on your way through, a trial. Every choice can be taken back. ', el('a', { href: '/scriptorium/#way' }, 'Your way through, at the desk')),
      foot);
  };
  paint();
  return fold;
}

const once = (fn) => { let done = false; return () => { if (!done) { done = true; fn(); } }; };

/** The reader's way, told on this chapter: notes, swaps and the turn. Returns how to take all of it back. */
function applyWay(main, n, data) {
  const way = readWay();
  if (way.source === 'off') return () => {};
  const aside = asideNow(way, data);
  if (way.source === 'visit') { try { store('sessionStorage')?.setItem(VISIT_KEY, JSON.stringify({ aside: way.aside, apart: way.apart, now: aside })); } catch { /* this page */ } }
  const head = main.querySelector('.chapter-head');
  const added = [];
  let live = true;
  let restoreLink = () => {};
  const swapping = data.pairs.filter((p) => way.apart.includes(p.id));
  const undo = swapping.flatMap((p) => applySwaps(main, p, n)).map(once);
  if (undo.length) {
    const note = swapNote(undo, swapping.filter((p) => (p.rooms || []).some((room) => room.chapter === n)), way.source);
    head?.after(note);
    added.push(note);
  }
  if (aside.length) {
    if (aside.includes(n)) {
      const note = el('aside', { className: 'way-note', 'aria-label': 'This chapter is set aside' },
        el('p', { className: 'way-kicker' }, `${words(n)} is set aside`),
        el('p', {}, 'Reading it changes nothing. It stays out of your way through until you take it back.'),
        el('p', { className: 'way-foot' }, el('a', { href: '/scriptorium/#way' }, 'Change your way through')));
      head?.after(note);
      added.push(note);
    } else {
      // The chapters just before this one that the way stepped over.
      const gap = [];
      for (let c = n - 1; c >= 1 && aside.includes(c); c -= 1) gap.unshift(c);
      if (gap.length) { const note = bridgeNote(gap, data); head?.after(note); added.push(note); }
    }
    const next = keptAfter(n, aside);
    const link = main.querySelector('.chapter-turn-link');
    if (link && next !== n + 1 && next > n) {
      const was = { href: link.getAttribute('href'), rel: link.getAttribute('rel'), html: link.innerHTML };
      restoreLink = () => {
        if (was.href == null) link.removeAttribute('href'); else link.setAttribute('href', was.href);
        if (was.rel == null) link.removeAttribute('rel'); else link.setAttribute('rel', was.rel);
        link.innerHTML = was.html;
      };
      fetch('/book/content/catalog.json').then((res) => (res.ok ? res.json() : null)).then((catalog) => {
        if (!live) return;
        const entry = (catalog?.chapters || []).find((c) => Number(c.number) === next);
        link.href = hrefOf(next);
        link.rel = 'next';
        const num = link.querySelector('.chapter-turn-number');
        const title = link.querySelector('.chapter-turn-title');
        if (title && num && entry) { num.textContent = words(next); title.replaceChildren(num, ` ${entry.title}`); }
        const which = link.querySelector('.chapter-turn-in-which');
        if (which && entry?.inWhich) which.textContent = `In which ${entry.inWhich}.`;
      }).catch(() => { if (live) link.href = hrefOf(next); });
    }
  }
  return () => { live = false; undo.forEach((fn) => fn()); added.forEach((node) => node.remove()); restoreLink(); };
}

/** Everything a chapter page does with the way. */
export function initWayThrough({ chapterData } = {}) {
  takeWayFromAddress();
  const n = Number(chapterData?.chapterNumber);
  if (!n) return () => {};
  const main = document.querySelector('main.chapter');
  let alive = true;
  const added = [];
  const switchOn = (id) => { try { return readSwitches().values[id] === 'on'; } catch { return false; } };
  if (readWay().source === 'off' && !switchOn('reasons') && !switchOn('forks')) return () => {};
  let undoWay = () => {};
  loadWay().then((data) => {
    if (!alive || !data || !main) return;
    const place = (node) => {
      const turn = main.querySelector('.chapter-turn');
      if (turn) turn.before(node); else main.append(node);
      added.push(node);
    };
    if (switchOn('reasons') && data.chapters[n]) place(reasonFold(n, data));
    undoWay = applyWay(main, n, data);
    // A side taken at the chapter's end: the chapter is told the new way at once, and the old way taken back first.
    if (switchOn('forks')) loadForks().then((m) => { if (alive && m) place(forksFold(n, data, { taken: () => { undoWay(); undoWay = applyWay(main, n, data); } })); });
  });
  return () => { alive = false; undoWay(); added.forEach((node) => node.remove()); };
}

/* ─── The desk: the line, the chapters, the pairings ─── */

/** The panel at /scriptorium/#way. Runs at import on that page. */
export async function mountWayPanel(root) {
  takeWayFromAddress();
  const data = await loadWay();
  if (!root || !data) return;
  const catalog = await fetch('/book/content/catalog.json').then((res) => (res.ok ? res.json() : null)).catch(() => null);
  // Where the book forks (a trial): each pairing's fork drawn beside its button, the reader's side lit.
  let forksWanted = false;
  try { forksWanted = readSwitches().values.forks === 'on'; } catch { /* drawn without */ }
  if (forksWanted) await loadForks();
  const titleOf = (n) => (catalog?.chapters || []).find((c) => Number(c.number) === n)?.title || '';
  const foot = el('output', { className: 'way-receipt', 'aria-live': 'polite' }, '');
  const say = (text) => { foot.textContent = text; };

  const paint = () => {
    const on = wayIsOn();
    if (!on) {
      const b = el('button', { type: 'button', className: 'way-pick', 'aria-label': 'Turn on your way through: choose chapters to set aside and people to keep apart' }, 'Turn it on');
      b.addEventListener('click', () => { setSwitch('way-through', true); paint(); settle(root); });
      root.replaceChildren(el('p', {}, 'Off for now, while it is being tried. Nothing changes until you choose something, and every choice can be taken back.'), b);
      return;
    }
    const way = readWay();
    const aside = asideNow(way, data);
    // Choosing is consent: a panel opened through a ?try= link stays on after the reader has used it.
    const apply = (next, done) => { setSwitch('way-through', true); writeWay(next, data); paint(); say(done); settle(root); };

    const field = el('input', { className: 'way-line-input', value: waySpell(way), 'aria-label': 'Your way through, as a line of Spw', spellcheck: 'false', autocomplete: 'off' });
    const take = el('button', { type: 'button', className: 'way-pick', 'aria-label': 'Take this line as your way through' }, 'Take this line');
    field.addEventListener('input', () => {
      const read = parseWay(field.value);
      if (!read) { say('That line is not a way yet. It starts ^way{ and ends }.'); return; }
      const parts = [read.aside.length && `set aside ${read.aside.map(words).join(', ')}`, read.apart.length && `keep ${read.apart.length} pairing${read.apart.length > 1 ? 's' : ''} apart`].filter(Boolean);
      say(parts.length ? `This line would ${parts.join(' and ')}.` : 'This line would read the whole book as it is.');
    });
    take.addEventListener('click', () => {
      const read = parseWay(field.value);
      if (read) apply(read, `Done. Your way through is now ${waySpell(read)}`);
    });
    const share = `/book/chapter/01/?way=${encodeURIComponent(waySpell(way))}`;

    const chapters = el('ol', { className: 'way-chapters' });
    for (let n = 1; n <= TOTAL_CHAPTERS; n += 1) {
      const forced = (data.pairs || []).find((p) => way.apart.includes(p.id) && (p.aside || []).includes(n));
      const isAside = aside.includes(n);
      const verb = isAside ? `Take ${words(n)} back` : `Set ${words(n)} aside`;
      const effect = isAside ? `${words(n)} comes back into the book.` : `${words(n)} steps out. The chapter after it will say in a line what it held.`;
      const b = el('button', { type: 'button', className: 'way-chapter', 'aria-pressed': isAside ? 'true' : 'false', 'aria-label': `${verb}. ${effect}`, disabled: Boolean(forced) },
        el('span', { className: 'way-chapter-n' }, pad(n)), el('span', {}, titleOf(n)), forced ? el('small', {}, `kept aside by: ${forced.name}`) : null);
      b.addEventListener('pointerenter', () => say(effect));
      b.addEventListener('focus', () => say(effect));
      b.addEventListener('click', () => {
        const next = isAside ? { ...way, aside: way.aside.filter((c) => c !== n) } : { ...way, aside: [...way.aside, n] };
        apply(next, isAside ? `${words(n)} is back.` : `${words(n)} is set aside. Your marks in it are kept.`);
      });
      chapters.append(el('li', {}, b));
    }

    const pairs = el('ul', { className: 'way-pairs' });
    const forkOf = F && forksWanted ? Object.fromEntries(F.wayForks(data, TOTAL_CHAPTERS).filter((e) => e.kind === 'pair').map((e) => [e.id, e])) : {};
    data.pairs.forEach((p) => {
      const isApart = way.apart.includes(p.id);
      const b = el('button', { type: 'button', className: 'way-pair', 'aria-pressed': isApart ? 'true' : 'false', 'aria-label': `${isApart ? 'Let them meet' : 'Keep apart'}: ${p.name}. ${p.primes}` }, p.name);
      b.addEventListener('pointerenter', () => say(p.primes));
      b.addEventListener('focus', () => say(p.primes));
      b.addEventListener('click', () => {
        const next = isApart ? { ...way, apart: way.apart.filter((id) => id !== p.id) } : { ...way, apart: [...way.apart, p.id] };
        apply(next, isApart ? `${p.name}: they may meet again.` : `${p.name}: done.`);
      });
      const fork = forkOf[p.id] ? forkFigure(forkOf[p.id], { on: isApart ? 'apart' : 'meet', caption: false }) : null;
      pairs.append(el('li', {}, b, fork, el('details', {}, el('summary', {}, 'What this changes, and why it is offered (gives away some of the plot)'), el('p', {}, p.why), el('p', {}, p.costs))));
    });

    const held = el('ul', { className: 'way-held' }, data.held.map((h) => el('li', {}, h.why)));
    const fromLink = [];
    if (way.source === 'visit') {
      const keep = el('button', { type: 'button', className: 'way-pick', 'aria-label': 'Keep the way this link gave you as your own' }, 'Keep it as mine');
      keep.addEventListener('click', () => apply(way, 'Kept as yours.'));
      fromLink.push(el('p', { className: 'way-foot' }, 'A link set this for this visit. ', keep));
    }
    root.replaceChildren(
      ...fromLink,
      renderSpell(waySpell(way), { cast: false, layout: 'line', copy: share, label: 'Your way through, as Spw' }),
      el('div', { className: 'way-line' }, field, take),
      el('h3', {}, 'Chapters'),
      chapters,
      el('h3', {}, 'People kept apart'),
      pairs,
      el('details', { className: 'way-why' }, el('summary', {}, 'Who cannot be kept apart, and why (gives away some of the plot)'), held),
      foot
    );
  };
  paint();
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-way-panel]');
  if (root) mountWayPanel(root);
}
