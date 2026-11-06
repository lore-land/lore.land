// The almanac page: what this reader has found in the chapters, where else
// each thing lives, and a bench for combining found things into small
// realms (the night school's game; bracework as a toy). Everything is read
// from this browser's own shelf; nothing is sent anywhere.
import { loadAlmanac, readAlmanac, KIND_SIGIL } from '../modules/almanac.mjs?v=2026_11_05.C';
import { SIGHTINGS, readSightings, sightingsFigure } from '../modules/sightings.mjs?v=2026_11_05.B';

const COMBINES_KEY = 'lore.almanac.combines.v1';
const pad = (n) => String(n).padStart(2, '0');
const $ = (selector) => document.querySelector(selector);

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

function readCombines() {
  try {
    const value = JSON.parse(window.localStorage.getItem(COMBINES_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeCombines(list) {
  try {
    window.localStorage.setItem(COMBINES_KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    // A blocked shelf: the combine lasts as long as this page.
  }
}

/* ─── The drawing ───────────────────────────────────────────────────── */

function paintFigure() {
  const seen = readSightings();
  const count = SIGHTINGS.filter((s) => seen[s.id]).length;
  $('[data-almanac-sketch]').innerHTML = sightingsFigure(seen);
  $('[data-almanac-sightings]').textContent = count === SIGHTINGS.length
    ? 'Nine sightings, nine strokes. The drawing is whole, and he still has no name.'
    : count
      ? `${count} of ${SIGHTINGS.length} strokes, one for each time you noticed him. He turns up in the margins before he turns up in the story.`
      : 'A blank page. Each time you notice him in the chapters, his drawing gains a line.';
}

/* ─── The shelves ───────────────────────────────────────────────────── */

function placeChips(data, wonder, kept) {
  const places = data.places(wonder.id);
  const livesIn = [...new Set(places.map((p) => p.c))].sort((a, b) => a - b);
  return livesIn.map((n) => {
    const place = places.find((p) => p.c === n);
    const found = kept?.places?.includes(n);
    return el('a', {
      className: `almanac-place${found ? ' is-found' : ''}`,
      href: `/book/chapter/${pad(n)}/#${place.id}`,
      title: `${pad(n)} · ${data.titleOf(n)}${found ? ' — found here' : ''}`
    }, pad(n));
  });
}

function card(data, wonder, kept) {
  const chips = placeChips(data, wonder, kept);
  if (!kept) {
    return el('li', { className: 'almanac-card is-unfound' },
      el('p', { className: 'almanac-card-kicker' }, `Unrecorded · ${wonder.region}`),
      el('p', { className: 'almanac-card-hint' }, wonder.hint),
      chips.length ? el('p', { className: 'almanac-card-places' }, el('span', {}, 'Look in'), ...chips) : null);
  }
  return el('li', { className: 'almanac-card is-found', id: `wonder-${wonder.id}` },
    el('p', { className: 'almanac-card-kicker' }, `${KIND_SIGIL[wonder.kind] || '·'} ${wonder.region}`),
    el('p', { className: 'almanac-card-name' }, wonder.name),
    el('p', { className: 'almanac-card-note' }, wonder.note),
    chips.length ? el('p', { className: 'almanac-card-places' }, el('span', {}, chips.length > 1 ? 'Lives in' : 'Found in'), ...chips) : null,
    el('p', { className: 'almanac-card-first' }, `First kept ${kept.first}`));
}

function paintShelves(data) {
  const state = readAlmanac();
  let placesTotal = 0;
  let placesFound = 0;
  ['creature', 'contrivance', 'bracework'].forEach((kind) => {
    const list = data.wonders.filter((w) => w.kind === kind);
    // Found first, in the order the book meets them; then the unrecorded.
    const ordered = [...list.filter((w) => state[w.id]), ...list.filter((w) => !state[w.id])];
    $(`[data-shelf="${kind}"]`).replaceChildren(...ordered.map((w) => card(data, w, state[w.id])));
    $(`[data-shelf-count="${kind}"]`).textContent = `${list.filter((w) => state[w.id]).length} of ${list.length}`;
    list.forEach((w) => {
      const lives = new Set(data.places(w.id).map((p) => p.c));
      placesTotal += lives.size;
      placesFound += [...lives].filter((n) => state[w.id]?.places?.includes(n)).length;
    });
  });
  const kept = data.wonders.filter((w) => state[w.id]).length;
  $('[data-almanac-tally]').textContent = kept
    ? `${kept} of ${data.wonders.length} kept · found in ${placesFound} of ${placesTotal} places they live.`
    : `Nothing kept yet. ${data.wonders.length} wonders live in the chapters; the dotted words are doors.`;
}

/* ─── The bench ─────────────────────────────────────────────────────── */

const STARTERS = ['frost', 'hearth', 'river', 'moon', 'grove', 'dog', 'lantern', 'egg', 'pie', 'bell', 'map', 'Thursday', 'berry', 'snow'];

const CONTAINERS = Object.freeze({
  '[]': { open: '[', close: ']', lead: 'A window. You may only look in.' },
  '{}': { open: '{', close: '}', lead: 'A room. You may stand in it for a minute.' },
  '()': { open: '(', close: ')', lead: 'A gathering. Everything in it has to arrive together.' },
  '<>': { open: '<', close: '>', lead: 'A passage. You may go through it, never stay.' }
});

const SIGILS = Object.freeze({
  '&': (a, b) => `${a} and ${b}, together and still themselves.`,
  '~': (a, b) => `${a}, dreaming of being ${b}.`,
  '@': (a, b) => `${a}, watched by ${b}, and a little changed by being watched.`,
  '^': (a, b) => `${a}, lifted by ${b}.`
});

const WEATHERS = Object.freeze([
  'It smells of warm slate.',
  'It hums in a key nobody budgeted for.',
  'It snows inside, but warm.',
  'Something in it keeps time a beat late.',
  'Its shadow points the wrong way.',
  'The light in it leans hearthward.',
  'It is quieter than it looks.',
  'It leaves crumbs on the sill.',
  'It rings once when tapped, then thinks better of it.',
  'Moths gather on the glass to read it.',
  'It is warmest at the corners.',
  'It fogs when someone tells a lie nearby.'
]);

function wordFor(wonder) {
  const base = wonder.name.split(':')[0].replace(/^the\s+/i, '').trim();
  return base.charAt(0).toLowerCase() + base.slice(1);
}

function slug(word) {
  return word.replace(/\s+/g, '-');
}

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

function compose(container, sigil, a, b) {
  const shape = CONTAINERS[container];
  const expr = `${shape.open}${slug(a)} ${sigil} ${slug(b)}${shape.close}`;
  if (a === b) {
    return { expr, text: `${shape.lead} A thing combined with itself only becomes more itself. The box stays clear.` };
  }
  const say = SIGILS[sigil](a, b);
  const weather = WEATHERS[hash(expr) % WEATHERS.length];
  const ants = /ant/.test(a + b) ? ' The ants disapprove; they know where the warmth comes from.' : '';
  const cost = ` It runs on borrowed warmth: cold in a week, unless someone holds it.${ants}`;
  return { expr, text: `${shape.lead} ${say.charAt(0).toUpperCase()}${say.slice(1)} ${weather}${cost}` };
}

function paintKept() {
  const list = readCombines();
  const box = $('[data-kept]');
  if (!list.length) {
    box.replaceChildren(el('li', { className: 'almanac-kept-empty' }, 'None yet. A kept combine stays here, in this browser.'));
    return;
  }
  box.replaceChildren(...list.map((item, index) => el('li', { className: 'almanac-kept-item' },
    el('code', {}, item.expr),
    el('span', {}, item.text),
    el('button', { type: 'button', className: 'almanac-kept-drop', 'data-drop': String(index), 'aria-label': `Let ${item.expr} go` }, '×'))));
}

function initBench(data) {
  const form = $('[data-bench]');
  const out = $('[data-bench-out]');
  const state = readAlmanac();
  const found = data.wonders.filter((w) => state[w.id]).map(wordFor);
  const words = [...new Set([...found, ...STARTERS])];
  form.querySelectorAll('[data-noun]').forEach((select, index) => {
    select.replaceChildren(
      ...(found.length ? [el('optgroup', { label: 'From your almanac' }, ...found.map((w) => el('option', { value: w }, w)))] : []),
      el('optgroup', { label: 'Always in the hat' }, ...STARTERS.map((w) => el('option', { value: w }, w))));
    select.value = index === 0 ? (found[0] || 'frost') : 'hearth';
  });
  let current = null;
  const render = () => {
    const values = new FormData(form);
    current = compose(values.get('container'), values.get('sigil'), values.get('a'), values.get('b'));
    out.replaceChildren(el('code', { className: 'almanac-bench-expr' }, current.expr), el('span', {}, current.text));
    out.classList.remove('is-fogging');
    void out.offsetWidth;
    out.classList.add('is-fogging');
  };
  form.addEventListener('change', render);
  $('[data-draw]').addEventListener('click', () => {
    const pick = () => words[Math.floor(Math.random() * words.length)];
    form.elements.a.value = pick();
    form.elements.b.value = pick();
    render();
  });
  $('[data-keep]').addEventListener('click', () => {
    if (!current) return;
    const list = readCombines().filter((item) => item.expr !== current.expr);
    list.unshift({ ...current, at: new Date().toISOString().slice(0, 10) });
    writeCombines(list);
    paintKept();
  });
  $('[data-kept]').addEventListener('click', (event) => {
    const drop = event.target.closest('[data-drop]');
    if (!drop) return;
    const list = readCombines();
    list.splice(Number(drop.getAttribute('data-drop')), 1);
    writeCombines(list);
    paintKept();
  });
  render();
  paintKept();
}

paintFigure();
loadAlmanac().then((data) => {
  if (!data.wonders.length) {
    $('[data-almanac-tally]').textContent = 'The almanac could not be opened just now.';
    return;
  }
  paintShelves(data);
  initBench(data);
});
