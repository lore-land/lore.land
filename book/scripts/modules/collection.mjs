/**
 * collection.mjs — what a reader collects across the whole site: cards and palettes.
 *
 * Cards. Everyone in the book has one (pie-cards.mjs CARDS, plus the few who
 * live only in the chapters, SITE_CARDS). A card turns the first time its name
 * comes into view in a chapter, or the first time it is met in the lanes; the
 * game's deck and the almanac's read the same shelf.
 *   lore.cards.v1 = { kind: { first, chapter, how: 'read' | 'lanes' } }
 *
 * Palettes. Each chapter has one, mixed from a laminated folio on spwashi.com
 * (or, where none fits yet, from the chapter's plate): book/content/world/palettes.json.
 * A palette is earned a layer at a time, one layer for each way of finishing
 * the chapter, so the reward is the chapter's own look and it fills in the
 * more ways the chapter is lived in:
 *   colour  read to its end           headings, drop cap, rules take its ink and accent
 *   type    carried through the lanes headings take the lettering its folio wears
 *   light   its own wonders kept      a faint wash of its ground and glow
 * Once earned the chapter wears it (the reader may take it off). The mime wash
 * is earned by winning a chapter back from Mimes Against WAP.
 *   lore.palettes.v1 = { earned: { id: { first, layers: { colour, type, light } } }, wear: true }
 *
 * No points, no streaks: what is kept is how the chapters look and who you have
 * met, and every keeping says so where it happens (settled.mjs).
 * Spw atom: =palette[id] (the projection spell names the one being worn).
 */
import { CARDS, CARD_TYPES } from '../home/pie-cards.mjs?v=2026_11_08.L';
import { readCarries } from './pie-carries.mjs?v=2026_11_08.J';
import { readAlmanac, loadAlmanac } from './almanac.mjs?v=2026_11_06.B';
import { settle } from './settled.mjs?v=2026_11_08.N';
import { CHARACTERS, portraitSVG } from './characters.mjs?v=2026_11_08.M';

/* A card's character, if it has one: the portrait shown when it turns (characters.mjs). */
const characterOf = (kind) => Object.keys(CHARACTERS).find((id) => CHARACTERS[id].card === kind) || null;

const CARDS_KEY = 'lore.cards.v1';
const PALETTES_KEY = 'lore.palettes.v1';
const PALETTES_URL = '/book/content/world/palettes.json';
const PALETTE_VISIT_KEY = 'lore.palettes.visit';
export const LAYERS = Object.freeze(['colour', 'type', 'light']);
export const LAYER_WAYS = Object.freeze({
  colour: 'read to its end',
  type: 'carried through the lanes',
  light: 'its own wonders kept'
});
const WONDERS_FOR_LIGHT = 3;

/* The few who live only in the chapters: no sprite, never in the lanes. */
export const SITE_CARDS = Object.freeze({
  ants: { name: 'The torch-ants', type: 'character', chapter: 1,
    story: 'Keep lit streets along the berry roots all winter, so the field never freezes through. Businesslike, very particular about torches, and they have never once asked Boof for anything.',
    lanes: 'Not in the lanes themselves: as a wonder kept, they light the way for 7 s.' },
  bonewap: { name: 'BoneWAP', type: 'character', chapter: 10,
    story: 'A pie with its joints showing: no sugar it has not declared, no filling it cannot show. Taps the sill beam with a listening mallet and lets the timber answer.',
    lanes: 'Not in the lanes. Where BoonWAP serves himself and BaneWAP schemes, BoneWAP audits.' }
});

export const allCards = () => ({ ...CARDS, ...SITE_CARDS });

/* What to look for in the prose: a card turns when one of these comes into view. */
const NAMED = Object.freeze([
  ['boof', /\bBoof\b/],
  ['berry', /\bboonberr(?:y|ies)\b/i],
  ['baneberry', /\bbaneberr(?:y|ies)\b/i],
  ['boneberry', /\bboneberr(?:y|ies)\b/i],
  ['egg', /\bthe Egg\b/],
  ['ants', /\btorch-ants?\b/i],
  ['furrow', /\bfurrow\b/i],
  ['carrier-genie', /\bGenie\b/],
  ['bane', /\b(?:Mr\.?\s+)?BaneWAP\b/],
  ['boon', /\b(?:Mr\.?\s+)?BoonWAP\b/],
  ['bonewap', /\bBoneWAP\b/],
  ['beaver', /\bbeavers?\b/i],
  ['carrier-figure', /\bplain lines\b/i],
  ['carrier-porter', /\bporter\b/i],
  ['carrier-clerk', /\bfeast clerk\b/i]
]);

const local = () => { try { return window.localStorage; } catch { return null; } };
function readJSON(key, fallback) {
  try {
    const value = JSON.parse(local()?.getItem(key) || 'null');
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try { local()?.setItem(key, JSON.stringify(value)); } catch { /* kept for this visit only */ }
}
const today = () => new Date().toISOString().slice(0, 10);
const words = (n) => ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'][n] || String(n);

/* ─── Cards ─────────────────────────────────────────────────────────── */

export const readCards = () => readJSON(CARDS_KEY, {});

/** Turn a card on the site's shelf. Returns true if it was new. */
export function turnCard(kind, { chapter = null, how = 'read' } = {}) {
  if (!allCards()[kind]) return false;
  const all = readCards();
  if (all[kind]) return false;
  all[kind] = { first: today(), chapter, how };
  writeJSON(CARDS_KEY, all);
  return true;
}

/** Every card turned anywhere: the site's shelf and the game's own record (lore.pie.v1 cards). */
export function cardsTurned() {
  const turned = new Set(Object.keys(readCards()));
  (readJSON('lore.pie.v1', {}).cards || []).forEach((kind) => turned.add(kind));
  return turned;
}

/* ─── Palettes ──────────────────────────────────────────────────────── */

let palettesPromise = null;
export function loadPalettes() {
  if (!palettesPromise) {
    palettesPromise = fetch(PALETTES_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.palettes || [])
      .catch(() => []);
  }
  return palettesPromise;
}

export function readPaletteState() {
  const state = readJSON(PALETTES_KEY, {});
  return { earned: state.earned && typeof state.earned === 'object' ? state.earned : {}, wear: state.wear !== false };
}

/** Earn one layer of a palette. Returns true if that layer was new. */
export function earnLayer(id, layer) {
  if (!LAYERS.includes(layer)) return false;
  const state = readPaletteState();
  const prev = state.earned[id] || { first: today(), layers: {} };
  if (prev.layers?.[layer]) return false;
  state.earned[id] = { ...prev, layers: { ...(prev.layers || {}), [layer]: today() } };
  writeJSON(PALETTES_KEY, state);
  return true;
}

export function setWearing(on) {
  const state = readPaletteState();
  writeJSON(PALETTES_KEY, { ...state, wear: Boolean(on) });
}

export const layersOf = (id, state = readPaletteState()) => LAYERS.filter((layer) => state.earned[id]?.layers?.[layer]);

/** A link may ask for one visit in the binding's own colours (?plain=palette); it never lends a palette. */
const plainThisVisit = () => {
  try { return window.sessionStorage.getItem(PALETTE_VISIT_KEY) === 'off'; } catch { return false; }
};

/** What has been kept across the site, counted: the %kept measure of the projection spell. */
export function keptMeasure(state = readPaletteState()) {
  const begun = Object.values(state.earned);
  return {
    cards: cardsTurned().size,
    palettes: begun.length,
    layers: begun.reduce((sum, entry) => sum + Object.keys(entry.layers || {}).length, 0)
  };
}

/**
 * Catch up on layers earned elsewhere: a carry through the chapter (pie-carries),
 * its wonders kept (almanac), a chapter won back (the mime wash). Quiet: returns
 * what was new so the caller can say so once.
 */
export async function reconcile(palettes, { wonders = true } = {}) {
  const fresh = [];
  const carries = readCarries();
  palettes.forEach((p) => {
    if (p.chapter && carries[p.chapter]?.carried && earnLayer(p.id, 'type')) fresh.push([p, 'type']);
    if (p.earn === 'won-back' && Object.values(carries).some((c) => (c?.wonBack || 0) > 0)) {
      LAYERS.forEach((layer) => { if (earnLayer(p.id, layer)) fresh.push([p, layer]); });
    }
  });
  const data = wonders ? await loadAlmanac().catch(() => null) : null;
  if (data?.wonders?.length) {
    const kept = readAlmanac();
    palettes.forEach((p) => {
      if (!p.chapter) return;
      const firsts = data.wonders.filter((w) => {
        const places = data.places(w.id);
        return places.length && Math.min(...places.map((pl) => pl.c)) === p.chapter;
      });
      const need = Math.min(WONDERS_FOR_LIGHT, firsts.length);
      if (need && firsts.filter((w) => kept[w.id]).length >= need && earnLayer(p.id, 'light')) fresh.push([p, 'light']);
    });
  }
  return fresh;
}

/* ─── Wearing a palette ─────────────────────────────────────────────── */

const FAMILY = Object.freeze({
  display: 'var(--font-family-display, "LoreLand Display", Georgia, serif)',
  body: 'var(--font-family-body, Georgia, serif)',
  mono: '"JetBrainsMono", var(--font-family-mono, monospace)'
});

/** The palette's colour and type as tokens: what the chapter wears, and what the almanac lets you copy. */
export function paletteTokens(p) {
  const c = p.colors || {};
  const t = p.type || {};
  return {
    '--pal-ground': c.ground,
    '--pal-ink': c.ink,
    '--pal-accent': c.accent,
    '--pal-glow': c.glow,
    '--pal-edge': c.edge,
    '--pal-type-family': FAMILY[t.family] || FAMILY.display,
    '--pal-type-case': t.case === 'upper' ? 'uppercase' : 'none',
    '--pal-type-variant': t.case === 'small-caps' ? 'small-caps' : 'normal',
    '--pal-type-style': t.style || 'normal',
    '--pal-type-tracking': t.tracking || '0',
    '--pal-type-weight': String(t.weight || 400)
  };
}

export function applyPalette(target, p, layers) {
  if (!target) return;
  Object.entries(paletteTokens(p)).forEach(([name, value]) => target.style.setProperty(name, value));
  target.classList.add('wears-palette');
  LAYERS.forEach((layer) => target.classList.toggle(`pal-${layer}`, layers.includes(layer)));
}

export function removePalette(target) {
  if (!target) return;
  target.classList.remove('wears-palette', ...LAYERS.map((layer) => `pal-${layer}`));
}

/** The palette as text to carry away: a Spw atom and the CSS tokens. */
export function paletteExtraction(p) {
  const c = p.colors || {};
  const t = p.type || {};
  const spw = `=palette[${p.id}]{ ground ${c.ground} ink ${c.ink} accent ${c.accent} glow ${c.glow} edge ${c.edge} } ^type{ ${t.family || 'display'} ${t.case && t.case !== 'none' ? `${t.case} ` : ''}${t.style || 'normal'} tracking ${t.tracking || '0'} }`;
  const css = Object.entries(paletteTokens(p)).map(([name, value]) => `  ${name}: ${value};`).join('\n');
  return { spw, css: `.palette-${p.id} {\n${css}\n}` };
}

/* ─── Small drawings (codebase-written SVG for settle art) ──────────── */

export function swatchArt(p, layers = LAYERS) {
  const c = p.colors || {};
  const keys = ['ground', 'ink', 'accent', 'glow', 'edge'];
  const lit = (key) => (key === 'ink' || key === 'accent' || key === 'edge') ? layers.includes('colour') : layers.includes('light');
  const cells = keys.map((key, i) => `<rect x="${2 + i * 11}" y="2" width="10" height="20" rx="2" fill="${c[key] || '#ccc'}" opacity="${lit(key) ? 1 : 0.25}"/>`).join('');
  return `<svg viewBox="0 0 58 24" width="58" height="24" aria-hidden="true">${cells}</svg>`;
}

function cardArt() {
  return '<svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true"><rect x="2" y="2" width="20" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13" r="4" fill="currentColor" opacity="0.5"/><path d="M6 23h12M8 26h8" stroke="currentColor" stroke-width="1.2"/></svg>';
}

/* ─── On a chapter page ─────────────────────────────────────────────── */

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

function cardChip(kind, entry) {
  const card = allCards()[kind];
  const who = characterOf(kind);
  const portrait = who ? el('span', { className: 'keepsake-portrait lore-portrait', 'aria-hidden': 'true' }) : null;
  if (portrait) portrait.innerHTML = portraitSVG(who, { size: 28 });
  return el('li', { className: 'keepsake-card' }, portrait,
    el('b', {}, card.name),
    el('span', {}, ` · ${CARD_TYPES[card.type] || card.type}`),
    entry?.how === 'lanes' ? el('span', { className: 'keepsake-how' }, ' · met in the lanes') : null);
}

/**
 * The chapter's keepsakes, at its end: its palette (with the layers still to
 * earn and how) and the cards first turned here.
 */
function renderKeepsakes(mount, { n, palette }) {
  const state = readPaletteState();
  const layers = palette ? layersOf(palette.id, state) : [];
  const cards = readCards();
  const here = Object.entries(cards).filter(([, entry]) => entry.chapter === n);
  const body = [];
  if (palette) {
    const source = palette.folio || palette.plate;
    body.push(
      el('div', { className: 'keepsake-palette' },
        el('span', { className: 'keepsake-swatches', 'aria-hidden': 'true' },
          ...['ground', 'ink', 'accent', 'glow', 'edge'].map((key) => {
            const chip = el('i', { className: `keepsake-swatch is-${key}` });
            chip.style.setProperty('--swatch', palette.colors[key]);
            return chip;
          })),
        el('div', {},
          el('p', { className: 'keepsake-name' }, palette.name),
          el('p', { className: 'keepsake-gloss' }, palette.gloss),
          source ? el('p', { className: 'keepsake-source' }, palette.folio ? 'Mixed from the folio ' : 'Mixed from ',
            el('a', { href: source.href, ...(palette.folio ? { rel: 'noopener' } : {}) }, source.title),
            palette.folio ? ', which lives on spwashi.com.' : '.') : null)),
      el('ul', { className: 'keepsake-layers' },
        ...LAYERS.map((layer) => el('li', { className: layers.includes(layer) ? 'is-kept' : '' },
          el('b', {}, layer), ` · ${LAYER_WAYS[layer]}`))));
    if (layers.length) {
      const toggle = el('button', { type: 'button', className: 'keepsake-wear', 'aria-pressed': state.wear ? 'true' : 'false' },
        state.wear ? 'The chapter is wearing it' : 'Let the chapter wear it');
      body.push(toggle);
    }
  }
  if (here.length) {
    body.push(el('p', { className: 'keepsake-cards-lede' }, `Cards first turned in Chapter ${words(n)}:`),
      el('ul', { className: 'keepsake-cards' }, ...here.map(([kind, entry]) => cardChip(kind, entry))));
  }
  body.push(el('p', { className: 'keepsake-more' }, el('a', { href: '/almanac/#keepsakes' }, 'Every palette and card you keep is on the almanac’s shelf →')));
  mount.replaceChildren(el('h2', { className: 'keepsake-title' }, 'Kept from this chapter'), ...body);
}

export function initCollection({ chapterData, announce } = {}) {
  const n = Number(chapterData?.chapterNumber || document.body.dataset.chapter || 0);
  const main = document.querySelector('main.chapter');
  if (!main || !n) return () => {};
  const observers = [];
  let palette = null;
  let mount = null;

  const wear = () => {
    if (!palette) return;
    const state = readPaletteState();
    const layers = layersOf(palette.id, state);
    const wearing = state.wear && !plainThisVisit() && layers.length > 0;
    if (wearing) applyPalette(main, palette, layers);
    else removePalette(main);
    document.dispatchEvent(new CustomEvent('lore:palette', { detail: { id: palette.id, layers, wearing, kept: keptMeasure(state) } }));
  };
  const repaint = () => { if (mount) renderKeepsakes(mount, { n, palette }); };

  const sayLayer = (p, layer) => {
    const layers = layersOf(p.id);
    settle({
      sigil: '=',
      title: `${p.name}: its ${layer}`,
      detail: layers.length === LAYERS.length
        ? `${p.gloss} The whole palette is yours; the chapter wears it.`
        : `Earned by ${LAYER_WAYS[layer]}. ${p.chapter === n ? 'The chapter wears it now.' : 'It is on the almanac’s shelf.'}`,
      region: 'main.chapter',
      art: swatchArt(p, layers)
    });
    if (announce) announce(`Palette earned: ${p.name}, ${layer}.`);
  };

  // Cards: a name coming into view turns its card, one notice at a time.
  const queue = [];
  let speaking = false;
  const speak = () => {
    if (speaking || !queue.length) return;
    speaking = true;
    const kind = queue.shift();
    const card = allCards()[kind];
    // As much of its story as reads at a glance: whole sentences, about a line and a half.
    const detail = card.story.split(/(?<=[.!?])\s/).reduce((said, sentence) => (!said || said.length + sentence.length < 120 ? `${said} ${sentence}`.trim() : said), '');
    const who = characterOf(kind);
    settle({ sigil: '@', title: `A card: ${card.name}`, detail, art: who ? portraitSVG(who, { size: 48, standalone: true }) : cardArt() });
    if (announce) announce(`Card turned: ${card.name}.`);
    setTimeout(() => { speaking = false; speak(); }, 3200);
    repaint();
  };
  const turned = cardsTurned();
  const looking = NAMED.filter(([kind]) => !turned.has(kind));
  if (looking.length && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        seen.unobserve(entry.target);
        const text = entry.target.textContent || '';
        for (let i = looking.length - 1; i >= 0; i -= 1) {
          const [kind, pattern] = looking[i];
          if (pattern.test(text)) {
            looking.splice(i, 1);
            if (turnCard(kind, { chapter: n, how: 'read' })) queue.push(kind);
          }
        }
        if (!looking.length) seen.disconnect();
        speak();
      });
    }, { rootMargin: '-35% 0px -35% 0px' });
    main.querySelectorAll('[data-ebook-section] p, [data-ebook-section] blockquote').forEach((node) => seen.observe(node));
    observers.push(seen);
  }

  loadPalettes().then(async (palettes) => {
    palette = palettes.find((p) => p.chapter === n) || null;
    const fresh = await reconcile(palettes);
    wear();
    // The keepsakes sit after the chapter's last flourish.
    const endMark = main.querySelector('.chapter-end-mark');
    if (endMark) {
      mount = el('section', { className: 'chapter-keepsakes', 'aria-label': 'Kept from this chapter' });
      if (palette) applyPalette(mount, palette, LAYERS);
      endMark.after(mount);
      repaint();
      mount.addEventListener('click', (event) => {
        if (!event.target.closest('.keepsake-wear')) return;
        const state = readPaletteState();
        setWearing(!state.wear);
        wear();
        repaint();
        settle({
          sigil: '=',
          title: state.wear ? 'Palette set aside' : `Wearing ${palette.name}`,
          detail: state.wear ? 'Every chapter reads in its binding’s own colours again.' : 'Chapters wear the palettes you have earned.',
          at: event.target,
          region: 'main.chapter'
        });
      });
      // Reading to the end earns the colour.
      if (palette && !layersOf(palette.id).includes('colour') && 'IntersectionObserver' in window) {
        const end = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          end.disconnect();
          if (earnLayer(palette.id, 'colour')) {
            wear();
            repaint();
            sayLayer(palette, 'colour');
          }
        }, { threshold: 1 });
        end.observe(endMark);
        observers.push(end);
      }
    }
    // Layers earned elsewhere since the last visit: said once, the chapter's own first.
    fresh.sort(([a], [b]) => (b.chapter === n) - (a.chapter === n)).slice(0, 2).forEach(([p, layer], i) => {
      setTimeout(() => sayLayer(p, layer), 1400 + i * 3000);
    });
  });

  return () => {
    observers.forEach((observer) => observer.disconnect());
    mount?.remove();
    removePalette(main);
  };
}
