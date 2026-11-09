/**
 * The seed atlas (/seeds/2026-02-28/): the studies the book was grown from,
 * each wearing its sigil, its seal (likeness.mjs) and its discovery variant,
 * each able to show what in the book is like it.
 *
 * Kept as it always was: the set and dimension filters, "Suggest a study", the
 * layout preference (lore.experience.layout) and keeping up to three studies
 * (lore.experience.seed-adopted, same ids). New: stable anchors (#seed-01-wonder),
 * the sigil key, find similar, and a choice to see the studies as you have
 * found them or all whole (lore.atlas.view; someone who kept studies here
 * before sees them whole, as they always did, until they choose otherwise).
 * The page wears the reader's binding through home/app.mjs, like the almanac.
 */
import { seedManifest, seedSets } from '../home/seeds.mjs?v=2026_11_08.N';
import {
  DIMENSIONS, MOTIONS, SIGILS, CONTAINERS, chapterName,
  loadLikeness, discoveryOf, refreshDiscovery, dressAsset, findSimilar, likenessMark
} from '../modules/likeness.mjs?v=2026_11_08.O';

const KEEP_LIMIT = 3;
const SEED_STORAGE_KEY = 'lore.experience.seed-adopted';
const LAYOUT_KEY = 'lore.experience.layout';
const VIEW_KEY = 'lore.atlas.view';
const LAYOUTS = ['grid', 'stream', 'cinema'];
const SET_WORDS = Object.freeze({ '00': 'Set 00 · the world being left', '01': 'Set 01 · lit from within', motif: 'The motif · a page laid out' });
const NUMBER_WORDS = ['no', 'one', 'two', 'three'];
const $ = (selector, root = document) => root.querySelector(selector);

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

const readJSON = (key, fallback) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const readText = (key) => {
  try { return window.localStorage.getItem(key) || ''; } catch { return ''; }
};
const write = (key, value) => {
  try { window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch { /* kept for this visit only */ }
};

function announce(message) {
  let region = document.getElementById('experience-live-region');
  if (!region) {
    region = el('div', { id: 'experience-live-region', className: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    document.body.append(region);
  }
  region.textContent = message;
}

const dimensionWord = (dimension) => (dimension === 'story-motif' ? 'motif' : dimension);
const studyName = (seed) => `${dimensionWord(seed.dimension)}${seed.setId === 'motif' ? '' : ` (${seed.setId})`}`;
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/* ─── What you keep ────────────────────────────────────────────────── */

function keptLine(kept) {
  const names = kept.map((id) => seedManifest.find((s) => s.id === id)).filter(Boolean).map(studyName);
  if (!names.length) return 'Nothing kept yet. You may keep three studies; a kept study is whole wherever it turns up in the book.';
  const list = names.length < 2 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const left = KEEP_LIMIT - names.length;
  return left > 0
    ? `You keep ${list}. ${capital(NUMBER_WORDS[left])} more may be kept.`
    : `You keep ${list}. To keep another, set one down.`;
}

/* ─── The sigil key ────────────────────────────────────────────────── */

function paintKey(likeness, onChoose) {
  const list = $('[data-atlas-key]');
  if (!list) return;
  const order = Object.keys(DIMENSIONS).sort((a, b) => SIGILS.indexOf(DIMENSIONS[a].sigil) - SIGILS.indexOf(DIMENSIONS[b].sigil));
  list.replaceChildren(...order.filter((dimension) => seedManifest.some((s) => s.dimension === dimension)).map((dimension) => {
    const dim = DIMENSIONS[dimension];
    const study = seedManifest.find((s) => s.dimension === dimension && s.setId !== '00') || seedManifest.find((s) => s.dimension === dimension);
    const item = likeness.items[study.likeness];
    const button = el('button', { type: 'button', className: 'atlas-key-item', dataset: { dimension, likenessMotion: MOTIONS[dim.sigil] } },
      el('span', { className: 'atlas-key-seal', 'aria-hidden': 'true' }, item ? likenessMark(item, { size: 34, decorative: true }) : null),
      el('span', { className: 'atlas-key-sigil', 'aria-hidden': 'true', dataset: { likenessMotion: MOTIONS[dim.sigil] }, text: dim.sigil }),
      el('span', { className: 'atlas-key-text' },
        el('span', { className: 'atlas-key-name', text: dimensionWord(dimension) }),
        el('span', { className: 'atlas-key-gloss', text: `${MOTIONS[dim.sigil]}${dim.echo ? `, an echo of ${dim.echo}` : ''} · ${dim.gloss}` })));
    button.setAttribute('aria-label', `${dimensionWord(dimension)}: ${dim.sigil} ${MOTIONS[dim.sigil]}, ${dim.gloss}. Show only its studies.`);
    button.addEventListener('click', () => onChoose(dimension));
    return el('li', { className: 'atlas-key-row' }, button);
  }));
}

/* ─── The studies ──────────────────────────────────────────────────── */

function whereLine(item) {
  if (!item) return null;
  if (item.chapter) {
    const chapters = item.chapters || [item.chapter];
    const links = chapters.map((n) => el('a', { href: `/book/chapter/${String(n).padStart(2, '0')}/`, text: chapterName(n) }));
    return el('p', { className: 'atlas-seed-where' },
      `The motif of `, ...links.flatMap((link, i) => (i ? [i === links.length - 1 ? ' and ' : ', ', link] : [link])), '.');
  }
  return el('p', { className: 'atlas-seed-where' },
    'Not yet planted in a chapter',
    item.home ? [', though its sigil is most at home in ', el('a', { href: `/book/chapter/${String(item.home).padStart(2, '0')}/`, text: chapterName(item.home) })] : null, '.');
}

const STATE_LINE = Object.freeze({
  veiled: (item) => `still veiled · open ${chapterName(item?.chapter || item?.home || 1)} to glimpse it`,
  glimpsed: () => 'glimpsed · keep it, or finish its chapter, to see it whole',
  found: () => 'whole'
});

function seedCard(seed, item, palettes = {}) {
  const dim = DIMENSIONS[seed.dimension] || {};
  const accent = palettes[item?.palette]?.colors?.accent;
  const img = el('img', {
    src: seed.thumb, alt: `${capital(dimensionWord(seed.dimension))}: a study${seed.setId === 'motif' ? '' : ` from set ${seed.setId}`}, four panels`,
    loading: 'lazy', decoding: 'async', width: 480, height: 480
  });
  img.addEventListener('error', () => { if (img.getAttribute('src') !== seed.src) img.setAttribute('src', seed.src); }, { once: true });
  const figure = el('figure', { className: 'atlas-seed-figure' }, img);
  const adopt = el('button', { type: 'button', className: 'seed-adopt-button', 'aria-pressed': 'false', dataset: { seedId: seed.id }, text: 'Keep this study' });
  const similarButton = item ? findSimilar(item, { label: 'Find similar', n: 8 }) : null;
  const open = el('a', { className: 'atlas-seed-open', href: seed.src, target: '_blank', rel: 'noopener', text: 'The whole study ↗' });
  const container = item?.container ? CONTAINERS[item.container] : null;
  return el('article', {
    className: 'seed-card atlas-seed', role: 'listitem', id: seed.anchor, tabindex: '-1',
    dataset: { seedId: seed.id, seedSet: seed.setId, seedDimension: seed.dimension },
    'aria-labelledby': `${seed.anchor}-title`,
    style: accent ? `--seed-accent: ${accent}` : null
  },
    figure,
    el('div', { className: 'atlas-seed-body' },
      el('p', { className: 'atlas-seed-role' },
        el('span', { className: 'atlas-seed-sigil', dataset: { likenessMotion: MOTIONS[dim.sigil] }, 'aria-hidden': 'true', text: dim.sigil || '·' }),
        el('span', { text: `${MOTIONS[dim.sigil] || ''}${container ? ` · ${container.open} ${container.close} ${container.id}` : ''} · ${seed.setId === 'motif' ? 'the motif' : `set ${seed.setId}`}` })),
      el('h3', { className: 'atlas-seed-title', id: `${seed.anchor}-title`, text: capital(dimensionWord(seed.dimension)) }),
      el('p', { className: 'atlas-seed-gloss', text: `${capital(dim.gloss || '')}.` }),
      whereLine(item),
      el('p', { className: 'atlas-seed-state', 'data-atlas-state': '' }),
      el('div', { className: 'atlas-seed-actions' }, adopt, similarButton, open)));
}

function initAtlas(appRoot, likeness) {
  const kept = new Set((readJSON(SEED_STORAGE_KEY, []) || []).filter((id) => seedManifest.some((s) => s.id === id)));
  // Someone who kept studies here before saw every study whole; they still do, until they choose.
  const viewStored = readText(VIEW_KEY);
  let view = viewStored === 'whole' || viewStored === 'found' ? viewStored : (kept.size ? 'whole' : 'found');
  let layout = LAYOUTS.includes(readText(LAYOUT_KEY)) ? readText(LAYOUT_KEY) : 'grid';

  const setSelect = el('select', { id: 'seed-set-select', name: 'seed-set' },
    el('option', { value: 'all', text: 'every set' }),
    ...seedSets.map((set) => el('option', { value: set.id, text: SET_WORDS[set.id] || set.label })));
  const dimensions = [...new Set(seedManifest.map((s) => s.dimension))]
    .sort((a, b) => SIGILS.indexOf(DIMENSIONS[a]?.sigil) - SIGILS.indexOf(DIMENSIONS[b]?.sigil));
  const dimensionSelect = el('select', { id: 'seed-dimension-select', name: 'seed-dimension' },
    el('option', { value: 'all', text: 'every part' }),
    ...dimensions.map((d) => el('option', { value: d, text: `${DIMENSIONS[d]?.sigil || '·'} ${dimensionWord(d)}` })));
  const layoutSelect = el('select', { id: 'atlas-layout-select', name: 'atlas-layout' },
    ...LAYOUTS.map((value) => el('option', { value, text: { grid: 'a grid', stream: 'a stream', cinema: 'large' }[value] })));
  layoutSelect.value = layout;
  const viewBox = el('fieldset', { className: 'atlas-view' },
    el('legend', { text: 'See the studies' }),
    ...[['found', 'as you have found them'], ['whole', 'all whole']].map(([value, label]) => el('label', {},
      el('input', { type: 'radio', name: 'atlas-view', value, checked: value === view }), ` ${label}`)));
  const suggest = el('button', { type: 'button', id: 'seed-randomize', className: 'seed-randomize', text: 'Suggest a study' });
  const status = el('p', { id: 'seed-reward-output', className: 'seed-reward-output atlas-kept', role: 'status', 'aria-live': 'polite' });
  const grid = el('div', { id: 'seed-grid', className: 'seed-grid atlas-grid', role: 'list', 'aria-label': 'The studies of the seed atlas' },
    ...seedManifest.map((seed) => seedCard(seed, likeness.items[seed.likeness], likeness.palettes)));

  appRoot.replaceChildren(
    el('form', { className: 'seed-controls atlas-controls', 'aria-label': 'Choose which studies to see', action: '#' },
      el('label', { for: 'seed-set-select' }, el('span', { text: 'Set' }), setSelect),
      el('label', { for: 'seed-dimension-select' }, el('span', { text: 'Part' }), dimensionSelect),
      el('label', { for: 'atlas-layout-select' }, el('span', { text: 'Laid out as' }), layoutSelect),
      viewBox,
      suggest),
    status,
    grid);
  appRoot.querySelector('form').addEventListener('submit', (event) => event.preventDefault());

  const cards = [...grid.querySelectorAll('.atlas-seed')];

  /* Each study in its variant, by the reader's own shelves. */
  const paint = () => {
    refreshDiscovery();
    grid.setAttribute('data-atlas-view', view);
    grid.setAttribute('data-atlas-layout', layout);
    const states = { veiled: 0, glimpsed: 0, found: 0 };
    cards.forEach((card) => {
      const seed = seedManifest.find((s) => s.id === card.dataset.seedId);
      const item = likeness.items[seed.likeness] || { id: seed.likeness, kind: 'seed', adopt: seed.id };
      const state = discoveryOf(item);
      states[state] += 1;
      dressAsset($('.atlas-seed-figure', card), item, { state, sealSize: 40 });
      const shownWhole = view === 'whole' || state === 'found';
      $('[data-atlas-state]', card).textContent = view === 'whole' && state !== 'found'
        ? `${STATE_LINE[state](item).split(' · ')[0]} · shown whole`
        : STATE_LINE[state](item);
      $('.atlas-seed-open', card).hidden = !shownWhole;
      const button = $('.seed-adopt-button', card);
      const isKept = kept.has(seed.id);
      button.setAttribute('aria-pressed', isKept ? 'true' : 'false');
      button.textContent = isKept ? 'Kept · set it down' : 'Keep this study';
    });
    status.textContent = keptLine([...kept]);
    const tally = $('[data-atlas-tally]');
    if (tally) {
      const parts = [
        states.found ? `${states.found} whole` : '',
        states.glimpsed ? `${states.glimpsed} glimpsed` : '',
        states.veiled ? `${states.veiled} still veiled` : ''
      ].filter(Boolean);
      tally.textContent = states.veiled === cards.length
        ? 'Every study is still veiled. Open a chapter, and the studies that belong to it come into view.'
        : `Of ${cards.length} studies: ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]}.`;
    }
  };

  const applyFilters = () => {
    const setValue = setSelect.value;
    const dimensionValue = dimensionSelect.value;
    let shown = 0;
    cards.forEach((card) => {
      const visible = (setValue === 'all' || card.dataset.seedSet === setValue)
        && (dimensionValue === 'all' || card.dataset.seedDimension === dimensionValue);
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    const count = $('[data-atlas-count]');
    if (count) count.textContent = shown === cards.length ? `${cards.length} studies` : `${shown} of ${cards.length} studies`;
    document.querySelectorAll('.atlas-key-item').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.dimension === dimensionValue ? 'true' : 'false');
    });
  };

  const highlight = (card, { scroll = true } = {}) => {
    cards.forEach((other) => { delete other.dataset.highlight; });
    card.dataset.highlight = 'true';
    if (scroll) card.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    card.focus({ preventScroll: true });
  };

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.seed-adopt-button');
    if (!button) return;
    const seedId = button.dataset.seedId;
    const seed = seedManifest.find((s) => s.id === seedId);
    if (kept.has(seedId)) {
      kept.delete(seedId);
      announce(`Set down: ${studyName(seed)}.`);
    } else if (kept.size < KEEP_LIMIT) {
      kept.add(seedId);
      announce(`Kept: ${studyName(seed)}. It is whole wherever it turns up.`);
    } else {
      announce('Three studies kept already. Set one down to keep this one.');
      return;
    }
    write(SEED_STORAGE_KEY, [...kept]);
    paint();
  });

  setSelect.addEventListener('change', applyFilters);
  dimensionSelect.addEventListener('change', applyFilters);
  layoutSelect.addEventListener('change', () => {
    layout = layoutSelect.value;
    write(LAYOUT_KEY, layout);
    grid.setAttribute('data-atlas-layout', layout);
    announce(`Laid out as ${layoutSelect.selectedOptions[0]?.textContent || layout}.`);
  });
  viewBox.addEventListener('change', (event) => {
    if (event.target.name !== 'atlas-view') return;
    view = event.target.value;
    write(VIEW_KEY, view);
    paint();
    announce(view === 'whole' ? 'Every study shown whole.' : 'The studies as you have found them.');
  });
  suggest.addEventListener('click', () => {
    const visible = cards.filter((card) => !card.hidden);
    if (!visible.length) return;
    const card = visible[Math.floor(Math.random() * visible.length)];
    highlight(card);
    const seed = seedManifest.find((s) => s.id === card.dataset.seedId);
    announce(`Suggested: ${DIMENSIONS[seed.dimension]?.sigil || ''} ${studyName(seed)}.`);
  });

  paintKey(likeness, (dimension) => {
    dimensionSelect.value = dimensionSelect.value === dimension ? 'all' : dimension;
    setSelect.value = 'all';
    applyFilters();
    $('#studies')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    announce(dimensionSelect.value === 'all' ? 'Every part shown.' : `Only ${dimensionWord(dimension)} shown.`);
  });

  /* A link into the atlas (#seed-01-wonder) opens at that study, whatever was filtered. */
  const openHash = () => {
    const card = location.hash && cards.find((c) => `#${c.id}` === location.hash);
    if (!card) return;
    if (card.hidden) {
      setSelect.value = 'all';
      dimensionSelect.value = 'all';
      applyFilters();
    }
    highlight(card);
  };
  window.addEventListener('hashchange', openHash);
  window.addEventListener('storage', paint);
  window.addEventListener('pageshow', (event) => { if (event.persisted) paint(); });

  paint();
  applyFilters();
  requestAnimationFrame(openHash);
}

document.addEventListener('DOMContentLoaded', async () => {
  const appRoot = document.getElementById('seed-app');
  if (!appRoot) return;
  const likeness = await loadLikeness();
  initAtlas(appRoot, likeness);
});
