// The almanac page: what this reader has found in the chapters, where else
// each thing lives, and a bench for combining found things into small
// realms (the night school's game; bracework as a toy). Everything is read
// from this browser's own shelf; nothing is sent anywhere.
import { loadAlmanac, readAlmanac, KIND_SIGIL } from '../modules/almanac.mjs?v=2026_11_06.B';
import { SIGHTINGS, readSightings, sightingsFigure } from '../modules/sightings.mjs?v=2026_11_05.B';
import { loadPalettes, reconcile, readPaletteState, layersOf, paletteTokens, paletteExtraction, readCards, cardsTurned, allCards, LAYERS, LAYER_WAYS } from '../modules/collection.mjs?v=2026_11_08.O';
import { CARD_TYPES } from './pie-cards.mjs?v=2026_11_08.L';
import { CHARACTERS, portraitSVG } from '../modules/characters.mjs?v=2026_11_08.O';
import { renderSpell } from '../modules/spw-spell.mjs?v=2026_11_08.N';
import { loadLikeness, likenessItem, likenessMark, findSimilar, dressAsset, atlasStrip } from '../modules/likeness.mjs?v=2026_11_08.O';

const COMBINES_KEY = 'lore.almanac.combines.v1';
// The series look, as chapter-render.mjs PLATE_PROMPT_STYLE / _FLAGS (kept in step by hand).
const PLATE_STYLE = 'lore.land, teal and amber lit from within, leaf-dark ground, vignette and grain';
const PLATE_FLAGS = '--raw --stylize 1000 --v 8.2';
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

/* A kept wonder offers its plate prompt (PLAN.E L10): the scene in words, ready to paint from. */
function promptBlock(wonder) {
  const prompt = wonder.prompt;
  if (!prompt?.hint) return null;
  const line = `${prompt.hint}, ${PLATE_STYLE} ${PLATE_FLAGS}`;
  const copy = el('button', { type: 'button', className: 'almanac-prompt-copy' }, 'Copy');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(line);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Select and copy';
    }
  });
  return el('details', { className: 'almanac-prompt' },
    el('summary', {}, 'Plate prompt'),
    el('dl', {},
      el('dt', {}, 'Vantage'), el('dd', {}, prompt.vantage || ''),
      el('dt', {}, 'Light'), el('dd', {}, prompt.light || ''),
      el('dt', {}, 'Scent'), el('dd', {}, prompt.scent || '')),
    el('p', { className: 'almanac-prompt-line' }, el('code', {}, line)),
    copy);
}

/* A thing's likeness (likeness.mjs): its seal in the corner, and the way to what is like it. */
const likenessSeal = (id) => {
  const item = likenessItem(id);
  return item ? el('span', { className: 'almanac-likeness-seal' }, likenessMark(item, { size: 34 })) : null;
};
const likenessFind = (id) => (likenessItem(id) ? el('p', { className: 'almanac-likeness' }, findSimilar(id)) : null);

function card(data, wonder, kept) {
  const chips = placeChips(data, wonder, kept);
  const id = `wonder:${wonder.id}`;
  if (!kept) {
    return el('li', { className: 'almanac-card is-unfound', id: `wonder-${wonder.id}` },
      likenessSeal(id),
      el('p', { className: 'almanac-card-kicker' }, `Unrecorded · ${wonder.region}`),
      el('p', { className: 'almanac-card-hint' }, wonder.hint),
      chips.length ? el('p', { className: 'almanac-card-places' }, el('span', {}, 'Look in'), ...chips) : null,
      likenessFind(id));
  }
  return el('li', { className: 'almanac-card is-found', id: `wonder-${wonder.id}` },
    likenessSeal(id),
    el('p', { className: 'almanac-card-kicker' }, `${KIND_SIGIL[wonder.kind] || '·'} ${wonder.region}`),
    el('p', { className: 'almanac-card-name' }, wonder.name),
    el('p', { className: 'almanac-card-note' }, wonder.note),
    wonder.craft ? el('p', { className: 'almanac-card-craft' }, el('span', {}, 'In the workshop · '), wonder.craft) : null,
    chips.length ? el('p', { className: 'almanac-card-places' }, el('span', {}, chips.length > 1 ? 'Lives in' : 'Found in'), ...chips) : null,
    promptBlock(wonder),
    el('p', { className: 'almanac-card-first' }, `First kept ${kept.first}`),
    likenessFind(id));
}

function paintShelves(data) {
  const state = readAlmanac();
  let placesTotal = 0;
  let placesFound = 0;
  ['creature', 'contrivance', 'bracework', 'saying'].forEach((kind) => {
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

/* ─── Palettes and cards (collection.mjs) ───────────────────────────── */

const CHAPTER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
const chapterName = (n) => `Chapter ${CHAPTER_WORDS[n] || n}`;

async function copyText(button, text, done) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = done;
  } catch {
    button.textContent = 'Select and copy it above';
  }
}

function paletteCard(data, p, state) {
  const layers = layersOf(p.id, state);
  const begun = layers.length > 0;
  const li = el('li', { className: `palette-card${begun ? '' : ' is-unbegun'}`, id: `palette-${p.id}` });
  Object.entries(paletteTokens(p)).forEach(([name, value]) => li.style.setProperty(name, value));
  LAYERS.forEach((layer) => li.classList.toggle(`has-${layer}`, layers.includes(layer)));
  const title = p.chapter ? data.titleOf(p.chapter) : 'Won back';
  const source = p.folio || p.plate;
  const extraction = paletteExtraction(p);
  const spw = renderSpell(extraction.spw, { cast: false });
  spw.classList.add('is-compact');
  const css = el('pre', { className: 'palette-extract-code' }, extraction.css);
  const copySpw = el('button', { type: 'button', className: 'palette-copy' }, 'Copy the Spw atom');
  const copyCss = el('button', { type: 'button', className: 'palette-copy' }, 'Copy the CSS tokens');
  copySpw.addEventListener('click', () => copyText(copySpw, extraction.spw, 'Copied the atom'));
  copyCss.addEventListener('click', () => copyText(copyCss, extraction.css, 'Copied the tokens'));
  li.append(...[
    el('div', { className: 'palette-swatches', 'aria-hidden': 'true' },
      ...['ground', 'ink', 'accent', 'glow', 'edge'].map((key) => {
        const chip = el('i', { className: `palette-swatch is-${key}`, title: `${key} ${p.colors[key]}` });
        chip.style.setProperty('--swatch', p.colors[key]);
        return chip;
      })),
    // The type, projected: the chapter's own title in the palette's lettering, ink on its ground.
    el('p', { className: 'palette-specimen' }, title || p.name),
    el('p', { className: 'almanac-card-kicker' }, p.chapter ? chapterName(p.chapter) : 'Mimes Against WAP'),
    el('h3', {}, p.name),
    el('p', { className: 'palette-gloss' }, p.gloss),
    el('p', { className: 'palette-type-note' }, `Lettering: ${p.type?.from || 'the book’s own'}.`),
    el('ul', { className: 'palette-layers' },
      ...LAYERS.map((layer) => el('li', { className: layers.includes(layer) ? 'is-kept' : '' },
        el('b', {}, layer), ` · ${p.earn === 'won-back' ? 'win a chapter back' : LAYER_WAYS[layer]}`))),
    source ? el('p', { className: 'palette-source' }, p.folio ? 'From the folio ' : 'From ',
      el('a', { href: source.href, ...(p.folio ? { rel: 'noopener' } : {}) }, source.title),
      p.folio ? ' on spwashi.com' : '') : null,
    begun ? el('details', { className: 'palette-extract' },
      el('summary', {}, 'Carry it away'),
      spw, el('p', {}, copySpw),
      css, el('p', {}, copyCss)) : null,
    likenessFind(`palette:${p.id}`)].filter(Boolean));
  return li;
}

async function paintPalettes(data) {
  const palettes = await loadPalettes();
  if (!palettes.length) return;
  await reconcile(palettes);
  const state = readPaletteState();
  const begun = palettes.filter((p) => layersOf(p.id, state).length);
  const layerCount = palettes.reduce((sum, p) => sum + layersOf(p.id, state).length, 0);
  $('[data-palette-count]').textContent = `${begun.length} of ${palettes.length} begun · ${layerCount} of ${palettes.length * LAYERS.length} layers`;
  const ordered = [...begun, ...palettes.filter((p) => !begun.includes(p))];
  $('[data-palettes]').replaceChildren(...ordered.map((p) => paletteCard(data, p, state)));
}

/* A character card wears its portrait: in colour once met, a silhouette with a question mark before. */
const characterFor = (kind) => Object.keys(CHARACTERS).find((id) => CHARACTERS[id].card === kind) || null;
const portraitFor = (kind, met) => {
  const who = characterFor(kind);
  if (!who) return null;
  const span = el('span', { className: 'deck-portrait lore-portrait' });
  span.innerHTML = portraitSVG(who, { size: 72, met });
  // Veiled, glimpsed or met, by this reader's shelves (likeness.mjs), with its seal at the rim.
  if (likenessItem(`character:${who}`)) dressAsset(span, `character:${who}`, { sealSize: 22 });
  return span;
};
const deckLikeness = (kind) => {
  const who = characterFor(kind);
  return likenessFind(who ? `character:${who}` : `card:${kind}`);
};

function paintDeck() {
  const cards = allCards();
  const shelf = readCards();
  const turned = cardsTurned();
  const kinds = Object.keys(cards);
  $('[data-deck-count]').textContent = `${kinds.filter((k) => turned.has(k)).length} of ${kinds.length} turned`;
  // Turned first; then the rest in the order the book meets them, the lanes' own last.
  const unturned = kinds.filter((k) => !turned.has(k)).sort((a, b) => (cards[a].chapter || 99) - (cards[b].chapter || 99));
  const ordered = [...kinds.filter((k) => turned.has(k)), ...unturned];
  $('[data-deck]').replaceChildren(...ordered.map((kind) => {
    const card = cards[kind];
    const kept = shelf[kind];
    if (!turned.has(kind)) {
      const silhouette = portraitFor(kind, false);
      return el('li', { className: `deck-card is-face-down type-${card.type}` },
        el('p', { className: 'almanac-card-kicker' }, CARD_TYPES[card.type] || card.type),
        silhouette || el('p', { className: 'deck-card-back' }, '?'),
        el('p', { className: 'deck-card-hint' }, card.chapter ? `Somewhere from ${chapterName(card.chapter)} on` : 'Only in the lanes'),
        deckLikeness(kind));
    }
    const where = kept?.how === 'lanes'
      ? `Met in the lanes${kept.chapter ? `, ${chapterName(kept.chapter)}` : ''}`
      : kept?.chapter ? `Met reading ${chapterName(kept.chapter)}` : 'Met in the lanes';
    return el('li', { className: `deck-card type-${card.type}` },
      el('p', { className: 'almanac-card-kicker' }, CARD_TYPES[card.type] || card.type),
      portraitFor(kind, true),
      el('h3', {}, card.name),
      el('p', {}, card.story),
      el('p', { className: 'deck-card-lanes' }, card.lanes),
      el('p', { className: 'almanac-card-first' }, `${where}${kept?.first ? ` · ${kept.first}` : ''}`),
      deckLikeness(kind));
  }));
}

/* Each shelf shows the studies of its sigil from the seed atlas, and links into it. */
function placeAtlasStrips() {
  [['#bestiary', '@'], ['#contrivances', '$'], ['#bracework', '&'], ['#sayings', '#'], ['#keepsakes', '='], ['#cards', '@!']]
    .forEach(([selector, sigils]) => {
      const lede = document.querySelector(`${selector} .almanac-shelf-lede`);
      if (!lede || lede.nextElementSibling?.classList.contains('likeness-atlas-strip')) return;
      const strip = atlasStrip(sigils.length > 1 ? [...sigils] : sigils, { n: 2 });
      if (strip) lede.after(strip);
    });
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
// The likeness index rides along: a seal and "find similar" on every card, when it arrives.
Promise.all([loadAlmanac(), loadLikeness()]).then(([data]) => {
  if (!data.wonders.length) {
    $('[data-almanac-tally]').textContent = 'The almanac could not be opened just now.';
    return;
  }
  paintShelves(data);
  paintPalettes(data);
  initBench(data);
});
paintDeck();
loadLikeness().then(() => {
  paintDeck();
  placeAtlasStrips();
});
