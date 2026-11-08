/**
 * worktable.mjs — the maker's folios that stand near lore.land.
 *
 * The maker laminates real pages and scans them; the archive lives at
 * spwashi.com (design/folios/), where they were made. This shelf points at
 * the ones that stand near a place in lore.land — the folio's own picture,
 * served from spwashi.com, its own question where it asks one, where in the
 * land it stands, and a way across to see it where it lives. lore.land never
 * copies, reprices or claims them: it is a second source for new pieces,
 * never the origin of the archive (spwashi.com folio-archive.spw).
 *
 * Data: book/content/world/worktable.json (hand-chosen; ids are the archive's).
 * Any element with [data-worktable] fills; data-near="/pie/" keeps only the
 * folios that stand near that page; data-limit caps the count.
 */

const URL_ = '/book/content/world/worktable.json';

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

/* A door into the game remembers which wall it was found on. */
const nearHref = (piece) => (piece.near.href.startsWith('/pie/')
  ? `/pie/?from=${encodeURIComponent(`${location.pathname}#worktable`)}`
  : piece.near.href);

function card(piece) {
  const img = el('img', {
    src: piece.thumb,
    width: piece.width,
    height: piece.height,
    alt: piece.alt,
    loading: 'lazy',
    decoding: 'async',
    referrerpolicy: 'no-referrer-when-downgrade'
  });
  // If the maker's shelf is out of reach, the card still says what the folio is.
  img.addEventListener('error', () => img.closest('.worktable-card')?.classList.add('is-unseen'), { once: true });
  return el('li', { className: 'worktable-card' },
    el('a', { className: 'worktable-glass', href: piece.href, rel: 'noopener', 'aria-label': `${piece.title}, at the maker’s worktable` }, img),
    el('div', { className: 'worktable-text' },
      el('p', { className: 'worktable-title' }, piece.title),
      piece.asks ? el('p', { className: 'worktable-asks' }, `It asks: ${piece.asks}`) : null,
      el('p', { className: 'worktable-near' }, 'Stands near ', el('a', { href: nearHref(piece) }, piece.near.label)),
      el('a', { className: 'worktable-origin', href: piece.href, rel: 'noopener' }, 'See it where it was made →')));
}

export async function initWorktable(root = document) {
  const mounts = [...root.querySelectorAll('[data-worktable]')];
  if (!mounts.length) return;
  let data = null;
  try {
    const res = await fetch(URL_);
    data = res.ok ? await res.json() : null;
  } catch {
    data = null;
  }
  mounts.forEach((mount) => {
    const list = mount.querySelector('.worktable-list') || mount.appendChild(el('ul', { className: 'worktable-list' }));
    if (!data?.pieces?.length) {
      mount.hidden = true;
      return;
    }
    const near = mount.dataset.near;
    const limit = Number(mount.dataset.limit) || Infinity;
    const pieces = data.pieces.filter((piece) => !near || piece.near.href.startsWith(near)).slice(0, limit);
    if (!pieces.length) {
      mount.hidden = true;
      return;
    }
    list.replaceChildren(...pieces.map(card));
    mount.hidden = false;
  });
}

if (typeof document !== 'undefined') {
  const boot = () => initWorktable();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
