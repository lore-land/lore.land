/**
 * almanac.mjs — the wonders a reader collects.
 *
 * Boon.land is full of things worth keeping: creatures of the wild places,
 * contrivances of the built ones, and bracework — the makers' habit of
 * writing what they mean to make in sigils and braces. The first time a
 * chapter names one, the build marks it (`.wonder-mark[data-wonder]`,
 * chapter-render.mjs). Tap it and it goes into the reader's almanac, with
 * the chapter it was found in. Most wonders live in more than one place;
 * the card says where else, so a reader has a reason to go back.
 *
 * Data: book/content/world/almanac.json (the wonders) and
 * book/content/semantic.json `wonders` (where each is marked). Collection:
 * localStorage lore.almanac.v1 = { id: { first, places: [chapter…] } } —
 * a per-reader convenience; a blocked shelf keeps this visit's finds only.
 * Switch: `wonders` (Switches → Wonders in the prose), on by default.
 * Canon: .spw/surfaces/almanac.spw.
 */

const KEY = 'lore.almanac.v1';
const DATA_URL = '/book/content/world/almanac.json';
const SEMANTIC_URL = '/book/content/semantic.json';

export const KIND_SIGIL = Object.freeze({ creature: '@', contrivance: '$', bracework: '&', saying: '#' });
export const KIND_WORD = Object.freeze({ creature: 'creature', contrivance: 'contrivance', bracework: 'bracework', saying: 'saying' });

const pad = (n) => String(n).padStart(2, '0');

export function readAlmanac() {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeAlmanac(value) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private mode: the find still counts for this visit.
  }
}

let dataPromise = null;
/** Wonders, by id, with the places each is marked (chapter + section). */
export function loadAlmanac() {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetch(DATA_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null),
      fetch(SEMANTIC_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null)
    ]).then(([data, semantic]) => {
      const wonders = data?.wonders || [];
      const places = semantic?.wonders || {};
      const titles = Object.fromEntries((semantic?.chapters || []).map((c) => [c.n, c.title]));
      return {
        kinds: data?.kinds || {},
        wonders,
        byId: new Map(wonders.map((w) => [w.id, w])),
        places: (id) => places[id] || [],
        titleOf: (n) => titles[n] || ''
      };
    });
  }
  return dataPromise;
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Keep a find. Returns what changed so the card can say so. */
export function collectWonder(id, chapter) {
  const state = readAlmanac();
  const entry = state[id] || { first: today(), places: [] };
  const isNew = !state[id];
  const newPlace = Boolean(chapter) && !entry.places.includes(chapter);
  if (newPlace) entry.places.push(chapter);
  state[id] = entry;
  if (isNew || newPlace) writeAlmanac(state);
  return { isNew, newPlace, entry, state };
}

/* ─── The card ──────────────────────────────────────────────────────── */

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

/* body carries perspective (reset.css): fixed cards belong in the top layer. */
const canPopover = () => 'showPopover' in HTMLElement.prototype;

function placeCard(card, at) {
  const narrow = window.matchMedia('(max-width: 40rem)').matches;
  card.classList.toggle('is-sheet', narrow);
  if (narrow) {
    card.style.left = '';
    card.style.top = '';
    return;
  }
  const box = at.getBoundingClientRect();
  const width = card.offsetWidth || 320;
  const height = card.offsetHeight || 200;
  let left = box.left + box.width / 2 - width / 2;
  left = Math.max(10, Math.min(left, window.innerWidth - width - 10));
  let top = box.bottom + 10;
  if (top + height > window.innerHeight - 10) top = Math.max(10, box.top - height - 10);
  card.style.left = `${Math.round(left)}px`;
  card.style.top = `${Math.round(top)}px`;
}

function statusLine(result, livesIn, count, total) {
  const seen = livesIn.filter((n) => result.entry.places.includes(n)).length;
  const where = livesIn.length > 1 ? ` · found in ${seen} of the ${livesIn.length} places it lives` : '';
  if (result.isNew) return `New in your almanac · ${count} of ${total}${where}`;
  if (result.newPlace) return `Found again, somewhere new${where}`;
  return `In your almanac${where}`;
}

/**
 * Upgrade this chapter's marks, collect on tap, and answer with a card that
 * says what was kept and where else the wonder lives.
 */
export function initAlmanac({ chapterData, announce } = {}) {
  const chapter = Number(chapterData?.chapterNumber || 0);
  const main = document.getElementById('chapter-content');
  const marks = main ? [...main.querySelectorAll('.wonder-mark[data-wonder]')] : [];
  if (!chapter || !marks.length) return () => {};

  const root = document.documentElement;
  const enabled = () => !root.hasAttribute('data-switches-ready') || root.getAttribute('data-switch-wonders') === 'on';
  let card = null;
  let openMark = null;

  const paint = () => {
    const state = readAlmanac();
    const on = enabled();
    marks.forEach((mark) => {
      if (on) {
        mark.setAttribute('role', 'button');
        mark.setAttribute('tabindex', '0');
      } else {
        mark.removeAttribute('role');
        mark.removeAttribute('tabindex');
      }
      const kept = state[mark.dataset.wonder];
      if (kept?.places?.includes(chapter)) mark.setAttribute('data-found', 'here');
      else if (kept) mark.setAttribute('data-found', 'elsewhere');
      else mark.removeAttribute('data-found');
    });
  };

  const close = () => {
    if (!card) return;
    if (card.hasAttribute('popover') && card.matches(':popover-open')) {
      try { card.hidePopover(); } catch { /* already hidden */ }
    }
    card.remove();
    card = null;
    openMark?.setAttribute('aria-expanded', 'false');
    openMark = null;
  };

  const open = async (mark) => {
    const data = await loadAlmanac();
    const wonder = data.byId.get(mark.dataset.wonder);
    if (!wonder) return;
    close();
    const result = collectWonder(wonder.id, chapter);
    const count = data.wonders.filter((w) => result.state[w.id]).length;
    const places = data.places(wonder.id);
    const livesIn = [...new Set(places.map((p) => p.c))].sort((a, b) => a - b);

    const doors = livesIn.map((n) => {
      const place = places.find((p) => p.c === n);
      const found = result.entry.places.includes(n);
      const here = n === chapter;
      return el('a', {
        className: `wonder-card-place${found ? ' is-found' : ''}${here ? ' is-here' : ''}`,
        href: here ? `#${place.id}` : `/book/chapter/${pad(n)}/#${place.id}`,
        title: `${pad(n)} · ${data.titleOf(n)}${found ? ' — found' : ''}`
      }, pad(n));
    });

    card = el('div', {
      className: `wonder-card is-${wonder.kind}${result.isNew ? ' is-new' : ''}`,
      role: 'dialog',
      'aria-label': `${wonder.name}, ${KIND_WORD[wonder.kind] || wonder.kind}`
    },
      el('div', { className: 'wonder-card-head' },
        el('span', { className: 'wonder-card-sigil', 'aria-hidden': 'true' }, KIND_SIGIL[wonder.kind] || '·'),
        el('span', { className: 'wonder-card-kind' }, `${KIND_WORD[wonder.kind] || wonder.kind} · ${wonder.region}`),
        el('button', { type: 'button', className: 'wonder-card-close', 'aria-label': 'Close' }, '×')),
      el('p', { className: 'wonder-card-name' }, wonder.name),
      el('p', { className: 'wonder-card-note' }, wonder.note),
      wonder.craft ? el('p', { className: 'wonder-card-craft' }, el('span', {}, 'In the workshop · '), wonder.craft) : null,
      el('p', { className: 'wonder-card-status' }, statusLine(result, livesIn, count, data.wonders.length)),
      livesIn.length > 1 ? el('nav', { className: 'wonder-card-places', 'aria-label': `Where ${wonder.name} lives` },
        el('span', { className: 'wonder-card-places-label' }, 'Lives in'), ...doors) : null,
      el('a', { className: 'wonder-card-almanac', href: '/almanac/' }, 'Your almanac →'));

    if (canPopover()) card.setAttribute('popover', 'manual');
    document.body.append(card);
    if (card.hasAttribute('popover')) card.showPopover();
    placeCard(card, mark);
    card.querySelector('.wonder-card-close').addEventListener('click', close);
    openMark = mark;
    mark.setAttribute('aria-expanded', 'true');
    // Other rooms may answer a find (scene-light.mjs flares the light toward it).
    window.dispatchEvent(new CustomEvent('lore:wonder', { detail: { id: wonder.id, kind: wonder.kind, isNew: result.isNew, at: mark } }));
    paint();
    if (result.isNew) {
      mark.classList.remove('is-kept');
      void mark.offsetWidth;
      mark.classList.add('is-kept');
    }
    announce?.(`${wonder.name}: ${statusLine(result, livesIn, count, data.wonders.length)}.`);
  };

  // Story-voice elements stop clicks from bubbling, so each mark listens for itself.
  const onMark = (event) => {
    if (!enabled()) return;
    const mark = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    if (openMark === mark) close();
    else open(mark);
  };
  const onMarkKey = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && enabled()) {
      event.preventDefault();
      open(event.currentTarget);
    }
  };
  const onOutside = (event) => {
    if (card && !card.contains(event.target) && !event.target.closest?.('.wonder-mark')) close();
  };
  const onKey = (event) => {
    if (event.key === 'Escape' && card) {
      const back = openMark;
      close();
      back?.focus();
    }
  };
  const onScroll = () => { if (card && openMark) placeCard(card, openMark); };

  marks.forEach((mark) => {
    mark.addEventListener('click', onMark);
    mark.addEventListener('keydown', onMarkKey);
  });
  document.addEventListener('click', onOutside);
  document.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
  const watcher = new MutationObserver(paint);
  watcher.observe(root, { attributes: true, attributeFilter: ['data-switch-wonders', 'data-switches-ready'] });
  paint();
  loadAlmanac();

  return () => {
    close();
    marks.forEach((mark) => {
      mark.removeEventListener('click', onMark);
      mark.removeEventListener('keydown', onMarkKey);
    });
    document.removeEventListener('click', onOutside);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
    watcher.disconnect();
  };
}
