/**
 * folio-wall.mjs — the folio wall (/folios/).
 *
 * A folio is a page pressed under glass: made, glassed, seasoned, layered.
 * The wall shows the maker's folios first, then readers', each with its
 * layers (an updated folio is a new scan over the old; the old stays
 * legible underneath), the chamber it stands near, and its call-number
 * neighbourhood in a library.
 *
 * Seasoning: a folio glassed less than one stone ago (a 13th or a 26th has
 * not passed since) is still liquid — it renders as liquid glass, refracting
 * and moving a little under the pointer — and settles to clear glass once
 * its stone has passed. Canon: .spw/surfaces/folios.spw.
 *
 * Data: book/content/folios.json. No uploads yet; folios enter by the
 * maker's hand (a scan, a line, a chamber).
 */

const FOLIOS_URL = '/book/content/folios.json';
const SHELF_URL = '/book/content/world/shelf-list.json';
const CATALOG_URL = '/book/content/catalog.json';
const STONE_DAYS = [13, 26];

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' as a local date — Date.parse would read it as UTC midnight. */
function localDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

/** Has a stone day (13th or 26th) passed between `glassed` and today? */
export function isSeasoned(glassed, today = new Date()) {
  const from = localDate(glassed);
  if (Number.isNaN(from.getTime())) return true;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (STONE_DAYS.includes(d.getDate())) return true;
  }
  return false;
}

export function nextStoneAfter(glassed) {
  const d = localDate(glassed);
  if (Number.isNaN(d.getTime())) return null;
  for (let i = 1; i <= 32; i += 1) {
    const c = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    if (STONE_DAYS.includes(c.getDate())) return c;
  }
  return null;
}

function fmt(date) {
  const d = localDate(date);
  return Number.isNaN(d.getTime()) ? String(date) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

async function getJSON(url) {
  try {
    const res = await fetch(url);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

/* ─── Liquid glass: an SVG displacement filter, animated, pointer-aware ── */

function ensureFilter() {
  if (document.getElementById('liquid-glass-filter')) return;
  const svg = el('svg', { id: 'liquid-glass-filter', width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute' });
  svg.innerHTML = `
    <filter id="liquid-glass" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="1" seed="7" result="noise">
        <animate attributeName="baseFrequency" dur="16s" values="0.006 0.009;0.009 0.006;0.006 0.009" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="liquid-glass-still" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.007 0.008" numOctaves="1" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  document.body.prepend(svg);
}

/* ─── Cards ─────────────────────────────────────────────────────────── */

function renderFolio(folio, { catalog, shelf, eager = false }) {
  const layers = [...(folio.layers || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const top = layers[layers.length - 1];
  const seasoned = isSeasoned(folio.glassed);
  const stone = nextStoneAfter(folio.glassed);
  const chapter = catalog?.chapters?.find((c) => c.number === folio.chamber);
  const shelfMate = folio.subject
    ? { subject: folio.subject, lc: folio.lc, dewey: folio.dewey }
    : (shelf?.chapters?.[String(folio.chamber)] || [])[0];

  const glass = el('div', { className: 'folio-glass' },
    ...layers.slice(0, -1).map((layer, i) => el('img', {
      className: 'folio-layer folio-layer--under', src: layer.scan, alt: '', loading: 'lazy', decoding: 'async',
      style: `--depth:${layers.length - 1 - i}`
    })),
    top ? el('img', {
      className: 'folio-layer', src: top.scan, alt: folio.alt || folio.title, loading: eager ? 'eager' : 'lazy', decoding: 'async',
      // Each glass takes the shape of its own scan: a folio is whatever page it was.
      onLoad: (event) => { const img = event.currentTarget; if (img.naturalWidth) img.closest('.folio-glass').style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`; }
    }) : el('div', { className: 'folio-empty' }, 'unscanned'),
    el('span', { className: 'folio-sheen', 'aria-hidden': 'true' })
  );

  const card = el('article', {
    className: `folio${seasoned ? ' is-seasoned' : ' is-liquid'}${folio.digital ? ' is-digital' : ''}`,
    id: `folio-${folio.id}`,
    dataset: { maker: folio.maker || 'maker' }
  },
    el('figure', { className: 'folio-figure' }, glass,
      el('figcaption', { className: 'folio-caption' },
        el('span', { className: 'folio-kicker' }, `${folio.digital ? 'digital folio' : 'glassed folio'} · ${folio.maker === 'maker' || !folio.maker ? 'the maker' : folio.maker}`),
        el('h3', { className: 'folio-title' }, folio.title),
        folio.note ? el('p', { className: 'folio-note' }, folio.note) : null
      )),
    el('dl', { className: 'folio-meta' },
      el('div', {}, el('dt', {}, 'Made'), el('dd', {}, fmt(folio.made))),
      el('div', {}, el('dt', {}, 'Glassed'), el('dd', {}, fmt(folio.glassed))),
      el('div', {}, el('dt', {}, seasoned ? 'Seasoned' : 'Seasons'), el('dd', {}, seasoned ? 'clear' : (stone ? `on the ${stone.getDate()}th — still liquid` : 'still liquid'))),
      layers.length > 1 ? el('div', {}, el('dt', {}, 'Layers'), el('dd', {}, `${layers.length}, oldest ${fmt(layers[0].date)}`)) : null,
      chapter ? el('div', {}, el('dt', {}, 'Stands near'), el('dd', {}, el('a', { href: chapter.href }, `Chapter ${pad(chapter.number)} · ${chapter.title}`))) : null,
      shelfMate ? el('div', {}, el('dt', {}, 'In the stacks'), el('dd', {}, `${shelfMate.subject}${shelfMate.lc ? ` · LC ${shelfMate.lc}` : ''}${shelfMate.dewey ? ` · Dewey ${shelfMate.dewey}` : ''}`)) : null
    )
  );

  // The liquid state follows the pointer: a highlight and a small tilt.
  if (!seasoned) {
    const onMove = (event) => {
      const box = glass.getBoundingClientRect();
      glass.style.setProperty('--mx', `${((event.clientX - box.left) / box.width * 100).toFixed(1)}%`);
      glass.style.setProperty('--my', `${((event.clientY - box.top) / box.height * 100).toFixed(1)}%`);
    };
    glass.addEventListener('pointermove', onMove);
    glass.addEventListener('pointerleave', () => { glass.style.removeProperty('--mx'); glass.style.removeProperty('--my'); });
  }
  return card;
}

export async function initFolioWall() {
  const mount = document.getElementById('folio-wall');
  if (!mount) return () => {};
  ensureFilter();
  const [data, shelf, catalog] = await Promise.all([getJSON(FOLIOS_URL), getJSON(SHELF_URL), getJSON(CATALOG_URL)]);
  const folios = (data?.folios || []).slice().sort((a, b) => String(b.glassed).localeCompare(String(a.glassed)));
  const makers = folios.filter((f) => !f.maker || f.maker === 'maker');
  const readers = folios.filter((f) => f.maker && f.maker !== 'maker');
  const liquid = folios.filter((f) => !isSeasoned(f.glassed)).length;

  const status = el('p', { className: 'folio-status' },
    `${folios.length} folio${folios.length === 1 ? '' : 's'} on the wall · ${liquid} still liquid · new folios season on the 13th and the 26th.`);

  const section = (title, list) => list.length ? el('section', { className: 'folio-shelf', 'aria-label': title },
    el('h2', { className: 'folio-shelf-title' }, title),
    el('div', { className: 'folio-grid' }, list.map((f, i) => renderFolio(f, { catalog, shelf, eager: i < 6 })))) : null;

  mount.replaceChildren(status, section('The maker’s folios', makers), section('Readers’ folios', readers) || el('p', { className: 'folio-status' }, 'No readers’ folios yet. The first one will be glassed here.'));
  mount.dataset.ready = 'true';
  return () => {};
}

if (typeof document !== 'undefined') {
  const start = () => initFolioWall();
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
}
