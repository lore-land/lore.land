/**
 * featured.mjs — one thing worth opening, under each page's hero ([data-featured="<page>"]).
 *
 * A returning reader (this browser has been here: a release on record, or any lore. mark) is shown what moved;
 * a newcomer, a way in. What is shown comes from the site's own data — the catalog, the release notes, the
 * almanac, the folio findings, the materials — so it is never older than the book. Things "of the day" turn
 * with the date, the same for everyone that day. The slot keeps its room while it is filled (hub.css), so
 * nothing under it moves. Self-starting: a page includes the module and the slot, nothing else.
 */

const day = Math.floor(Date.now() / 86400000);
const ofTheDay = (list, salt = 0) => (list.length ? list[(day + salt) % list.length] : null);
const get = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const pad = (n) => String(n).padStart(2, '0');

function returning() {
  try {
    if (localStorage.getItem('lore.release.seen')) return true;
    return Object.keys(localStorage).some((k) => k.startsWith('lore.') && !/^lore\.(switches|nook|release)/.test(k));
  } catch { return false; }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => { if (v == null || v === false) return; if (k === 'className') node.className = v; else node.setAttribute(k, v === true ? '' : String(v)); });
  children.flat().forEach((c) => { if (c != null && c !== false) node.append(c); });
  return node;
}

/** A card: what kind of thing, its name as a door, a line, and a picture when there is one. */
function card({ kicker, title, href, line, more, art, quote }) {
  return el('div', { className: `featured-card${art ? ' has-art' : ''}${quote ? ' is-quote' : ''}` },
    art ? el('a', { href, className: 'featured-art', tabindex: '-1', 'aria-hidden': 'true' }, el('img', { src: art, alt: '', width: '120', height: '80', loading: 'lazy', decoding: 'async' })) : null,
    el('div', { className: 'featured-words' },
      el('p', { className: 'featured-kicker' }, kicker),
      quote ? el('blockquote', { className: 'featured-quote' }, quote) : null,
      el('p', { className: 'featured-title' }, el('a', { href }, title)),
      line ? el('p', { className: 'featured-line' }, line) : null,
      more ? el('p', { className: 'featured-more' }, ...more) : null));
}

const newestChapter = (catalog) => catalog?.chapters?.at(-1) || null;
const nextLine = (catalog) => (catalog?.next ? `Chapter ${catalog.next.chapter} is set for ${new Date(`${catalog.next.date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}.` : '');

const PROVIDERS = {
  async home(isBack) {
    const [catalog, changes] = await Promise.all([get('/book/content/catalog.json'), get('/book/content/changes.json')]);
    const latest = changes?.releases?.[0];
    if (isBack && latest?.notes?.length) {
      const first = latest.notes[0];
      return card({ kicker: 'New since the last release', title: first.length > 170 ? `${first.slice(0, 168).replace(/\s+\S*$/, '')}…` : first, href: '/scriptorium/#desk', line: latest.notes.length > 1 ? `and ${latest.notes.length - 1} more on your desk` : '' });
    }
    const c = newestChapter(catalog);
    if (!c) return null;
    return card({ kicker: 'The newest chapter', title: `${c.number}. ${c.title}`, href: c.href, line: c.inWhich ? `in which ${c.inWhich}. ${nextLine(catalog)}` : nextLine(catalog), more: ['New here? ', el('a', { href: '/book/chapter/01/' }, 'Chapter One'), ' is where it starts.'] });
  },

  async almanac() {
    const data = await get('/book/content/world/almanac.json');
    const pool = (data?.wonders || []).filter((w) => w.home && w.kind !== 'saying');
    const withPlate = pool.filter((w) => w.plate);
    const w = ofTheDay(day % 3 === 0 && withPlate.length ? withPlate : pool, 7);
    if (!w) return null;
    let kept = false;
    try { kept = Boolean(JSON.parse(localStorage.getItem('lore.almanac.v1') || '{}')[w.id]); } catch { /* fine */ }
    return card({
      kicker: kept ? 'From your almanac, today' : 'To look for today',
      title: kept ? w.name : w.hint,
      href: kept ? `#wonder-${w.id}` : `/book/chapter/${pad(w.home)}/`,
      line: kept ? w.note : `It lives in Chapter ${w.home}${w.region ? `, ${w.region}` : ''}. Tap the dotted word when you find it.`,
      art: w.plate?.src || null
    });
  },

  async pie() {
    const catalog = await get('/book/content/catalog.json');
    const c = newestChapter(catalog);
    if (!c) return null;
    return card({ kicker: 'Carry the pie through the newest chapter', title: `${c.number}. ${c.title}`, href: `/pie/?chapter=${c.number}`, line: c.inWhich ? `in which ${c.inWhich}` : '' });
  },

  async folios(isBack) {
    const findings = await get('/book/content/packs/texture.website/@spwashi/findings.json');
    if (isBack && findings) {
      const m = ofTheDay(findings.motifs.filter((x) => x.pieces.some((p) => p.thumb)), 3);
      if (m) {
        const piece = m.pieces.find((p) => p.thumb);
        return card({ kicker: `A ${m.kind} on the folios, today`, title: m.words, href: `/?/texture.website/~${m.handle.slice(1)}`, line: `held on ${m.pieces.length} piece${m.pieces.length === 1 ? '' : 's'}, among them ${piece.title}`, art: piece.thumb });
      }
    }
    return card({ kicker: 'Lettered by hand', title: 'spwashi’s hand', href: '/?/texture.website/@spwashi', line: 'An alphabet lettered on a ruled sheet, traced into type: write a word in it and hear the sounds it is made of.' });
  },

  async scriptorium() {
    const catalog = await get('/book/content/catalog.json');
    const c = newestChapter(catalog);
    if (!c) return null;
    return card({ kicker: 'On the shelf now', title: `${c.number}. ${c.title}`, href: c.href, line: nextLine(catalog), more: [el('a', { href: '/book/timeline.html' }, 'Every chapter, in order')] });
  },

  async texture(isBack) {
    if (isBack) {
      const { MATERIALS } = await import('./texture-materials.mjs?v=2026_11_09.H');
      const name = ofTheDay(Object.keys(MATERIALS), 2);
      return card({ kicker: 'A material, today', title: `$${name}`, href: `/?/texture.website/@spwashi/$${name}/!${encodeURIComponent(name).replace(/%20/g, '+')}`, line: MATERIALS[name].says });
    }
    const findings = await get('/book/content/packs/texture.website/@spwashi/findings.json');
    const m = ofTheDay((findings?.motifs || []).filter((x) => x.pieces.some((p) => p.thumb)), 5);
    if (!m) return null;
    const piece = m.pieces.find((p) => p.thumb);
    return card({ kicker: `A ${m.kind} from the folios, today`, title: m.words, href: `/?/texture.website/~${m.handle.slice(1)}`, line: `on ${piece.title}`, art: piece.thumb });
  },

  async zine() {
    const data = await get('/book/content/world/almanac.json');
    const s = ofTheDay((data?.wonders || []).filter((w) => w.kind === 'saying'), 11);
    if (!s) return null;
    return card({ kicker: 'A saying for the fold, today', quote: s.name, title: `Said in Chapter ${s.home}`, href: `/book/chapter/${pad(s.home)}/`, line: s.note || '' });
  }
};

async function initFeatured() {
  const slot = document.querySelector('[data-featured]');
  if (!slot) return;
  const provider = PROVIDERS[slot.dataset.featured];
  if (!provider) { slot.remove(); return; }
  const node = await provider(returning()).catch(() => null);
  if (!node) { slot.classList.add('is-empty'); return; }
  slot.replaceChildren(node);
  slot.classList.add('is-filled');
}

initFeatured();
