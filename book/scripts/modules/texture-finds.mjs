/**
 * texture-finds.mjs — pieces of texture.website (the maker's scanned folios and panels) that turn up in the land.
 *
 * The pieces live at spwashi.com, where they were made and are already shown, and are read through texture.website
 * on lore.land: ?/texture.website/*<piece> is one piece, and the surface (?/texture.website) lists what has turned up.
 * lore.land never copies them: the pack's folios.json (book/content/packs/texture.website/@spwashi/, npm run
 * texture:finds:build) holds each piece's own alt, its question if it asks one, its picture URLs at spwashi.com, and
 * what it answers here: a room, a trope, a motif, a sigil, or the places in the story where a page is glassed.
 *
 * A piece turns up by passing what it answers: a room opening, a carry ending in a chapter whose tropes it shares. At
 * most one turns up per carry, so it stays a moment. Until then it is a drawing in the panels' own composition (a
 * wash, a stepped horizon, a disc, thin ink), never the scan; once found, the scan itself, with a way across to
 * where it lives.
 *
 * Host-neutral at import (no window, no storage touched until a function asks), so book tools can import the scoring.
 * <lore-folio folio="folio-2026-09-26-21"> shows one anywhere.
 */

export const FOLIOS_URL = '/book/content/packs/texture.website/@spwashi/folios.json';
export const STORE_KEY = 'lore.texture.finds.v1';
/** A piece's own address, through texture.website, by its readable name. @param {{ id: string, slug?: string } | string} piece */
export const pieceRoute = (piece) => `/?/texture.website/*${encodeURIComponent(typeof piece === 'string' ? piece : piece.slug || piece.id)}`;
/** What the archive keeps on its own side; the build and the check hold every piece to it. */
export const HELD_TERMS = /wap\s*-?\s*boy|wabo|bowler|hatted figure|figure (?:in|under|with) (?:a |the )?hat|school|college|classroom|teacher|grade/i;

/* ─── The data ─────────────────────────────────────────────────────────── */

let docPromise = null;
/** The pieces, fetched once per page. Resolves to null when it cannot be had. */
export function loadFolios(url = FOLIOS_URL) {
  if (!docPromise) {
    docPromise = (typeof fetch === 'function' ? fetch(url).then((r) => (r.ok ? r.json() : null)) : Promise.resolve(null)).catch(() => null);
  }
  return docPromise;
}

/** A room as the game or a page knows it: '06:lamp_ladder', or a signature '^[lamp_ladder]@genie' with a chapter. */
function roomKey(room, chapter) {
  if (!room) return '';
  const text = String(room).trim();
  if (/^\d{2}:[a-z][a-z0-9_]*$/.test(text)) return text;
  const label = /[[{(<]([a-z][a-z0-9_]*)[\]})>]/.exec(text)?.[1] || (/^[a-z][a-z0-9_]*$/.test(text) ? text : '');
  return label && chapter ? `${String(chapter).padStart(2, '0')}:${label}` : '';
}
const chapterOfKey = (key) => Number(String(key).slice(0, 2)) || 0;

/**
 * The pieces a moment answers, best first: [{ piece, score, via }].
 * moment: { room, chapter, tropes: [ids], sigils: [chars], page: '/pie/' }. A room's own resonance counts most, then a
 * hand placement in its chapter, then a shared trope (named, or standing in the chapter), then a sigil
 * the piece and the room share. A piece nothing nearer claims waits under glass, in the chapters where a
 * page is glassed in the story, and is found there.
 * @param {any} doc
 * @param {{ room?: string, chapter?: number, tropes?: string[], sigils?: string[], page?: string }} [moment]
 * @returns {{ piece: any, score: number, via: string }[]}
 */
export function foliosFor(doc, { room = '', chapter = 0, tropes = [], sigils = [], page = '' } = {}) {
  if (!doc?.pieces) return [];
  const key = roomKey(room, chapter);
  const ch = Number(chapter) || chapterOfKey(key);
  const named = new Set(tropes);
  const standing = new Set((doc.chapters?.[ch] || []).filter((id) => !named.has(id)));
  const marks = new Set(sigils);
  const chapterHref = ch ? `/book/chapter/${String(ch).padStart(2, '0')}/` : '';
  const ranked = [];
  for (const piece of doc.pieces) {
    let score = 0;
    let via = '';
    const take = (points, why) => { score += points; if (!via) via = why; };
    for (const r of piece.resonance || []) {
      if (r.kind === 'room' && key && r.id === key) take(6, r.label);
      else if (r.kind === 'room' && ch && chapterOfKey(r.id) === ch) take(1, r.label);
      else if (r.kind === 'near' && chapterHref && String(r.href || '').startsWith(chapterHref)) take(4, r.label);
      else if (r.kind === 'near' && page && r.href === page) take(4, r.label);
      else if (r.kind === 'trope' && named.has(r.id)) take(3, r.label);
      else if (r.kind === 'trope' && standing.has(r.id)) take(1.5, r.label);
      else if (r.kind === 'sigil' && marks.has(r.id) && score > 0) take(0.5, `the ${r.id} it shares`);
      else if (r.kind === 'glass' && ch && Number(r.id) === ch) take(3, r.label);
    }
    if (score > 0) ranked.push({ piece, score, via });
  }
  return ranked.sort((a, b) => b.score - a.score || a.piece.id.localeCompare(b.piece.id));
}

/* ─── What the reader holds ────────────────────────────────────────────── */

function readStore() {
  try {
    const raw = globalThis.localStorage?.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' && data.held ? data : { held: {} };
  } catch { return { held: {} }; }
}

/** { [pieceId]: { at: 'YYYY-MM-DD', via } } for every piece the reader has found. */
export function held() {
  return readStore().held;
}

/** Keep a piece. Says so with a lore:texture-find event; returns false if it was already held. */
export function hold(id, via = '') {
  const store = readStore();
  if (!id || store.held[id]) return false;
  const day = new Date();
  store.held[id] = { at: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`, via: String(via).slice(0, 80) };
  try { globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* found for this visit */ }
  try { globalThis.dispatchEvent?.(new CustomEvent('lore:texture-find', { detail: { id, via } })); } catch { /* no events here */ }
  return true;
}

/**
 * The best piece this moment answers that the reader does not hold yet, or null. Only a moment that
 * reaches some floor finds anything: a room's own piece, a hand placement, or a trope the moment names.
 * @param {any} doc
 * @param {{ room?: string, chapter?: number, tropes?: string[], sigils?: string[], page?: string, floor?: number }} [moment]
 * @param {Record<string, any>} [holding]
 */
export function offer(doc, moment = {}, holding = held()) {
  const floor = moment.floor ?? 3;
  return foliosFor(doc, moment).find((r) => r.score >= floor && !holding[r.piece.id]) || null;
}

const foundThisCarry = new Set();
/**
 * The game's one call, when a room opens or a carry ends: finds and keeps at most one piece per carry.
 * moment: { room, chapter, tropes, sigils, page, carry, end }. end: true at a carry's end, which names the
 * chapter's standing tropes. Resolves to { piece, via, href, fresh: true } or null. The caller checks the
 * texture-finds switch first.
 */
export async function findMoment(moment = {}) {
  const carry = moment.carry ?? 'visit';
  if (foundThisCarry.has(carry)) return null;
  const doc = await loadFolios();
  // A carry that ends names the tropes standing in its chapter.
  const named = moment.end && !moment.tropes?.length ? { ...moment, tropes: doc?.chapters?.[moment.chapter] || [] } : moment;
  const found = doc ? offer(doc, named) : null;
  if (!found || !hold(found.piece.id, found.via)) return null;
  foundThisCarry.add(carry);
  return { piece: found.piece, via: found.via, href: pieceRoute(found.piece), fresh: true };
}

/* ─── Drawing ──────────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = (x) => Math.round(x * 10) / 10;
const seeded = (text) => {
  let a = 2166136261;
  for (const ch of String(text)) { a ^= ch.codePointAt(0); a = Math.imul(a, 16777619); }
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/* The panels' colours (panel-art.mjs), found by the words a piece's own alt and tags use. */
const PAINT = Object.freeze({
  plum: '#4b2c44', maroon: '#572733', violet: '#6f4c7c', mauve: '#6f4c7c', lilac: '#8a7aa0', lavender: '#8a7aa0', dusk: '#39304a',
  green: '#26362c', sage: '#5d6238', olive: '#5d6238', teal: '#4f9a98', aqua: '#4f9a98', rose: '#bd5472', pink: '#bd5472', magenta: '#9a3a6a',
  rust: '#a8502e', ember: '#a8502e', red: '#8c3a2e', orange: '#b8652e', amber: '#d9a24a', yellow: '#d9a24a', ochre: '#b8892e', gold: '#d9a24a',
  grey: '#8a8496', gray: '#8a8496', blue: '#2b5aa6', navy: '#22323c', storm: '#22323c', white: '#e6dfd0', bone: '#e6dfd0', cream: '#e6dfd0', brown: '#6a4a2e'
});
const FALLBACK = ['#39304a', '#4b2c44', '#4f9a98', '#8a8496'];

function paletteOf(piece) {
  const text = `${piece.alt || ''} ${(piece.tags || []).join(' ')}`.toLowerCase();
  const found = [];
  for (const word of text.split(/[^a-z]+/)) if (PAINT[word] && !found.includes(PAINT[word])) found.push(PAINT[word]);
  return found.length >= 2 ? found.slice(0, 4) : [...found, ...FALLBACK].slice(0, 4);
}

/**
 * A piece not yet found, as a drawing in the panels' composition: its own colours scumbled across,
 * a stepped horizon, a disc, a laminate edge, and its sigils in thin ink. Never the scan.
 */
export function folioSilhouetteSVG(piece, { w = 200, h = 0 } = {}) {
  const landscape = piece?.scan?.orientation === 'landscape';
  const height = h || Math.round(w * (landscape ? 0.79 : 1.27));
  const rand = seeded(piece?.id || 'folio');
  const colors = paletteOf(piece || {});
  const strokes = Array.from({ length: 14 }, () => {
    const y = rand() * (height + 40) - 20;
    const dy = (w + 60) * -0.16 + (rand() - 0.5) * 20;
    return `<path d="M-30 ${n1(y)} Q${n1(w / 2)} ${n1(y + dy / 2 + (rand() - 0.5) * 24)} ${n1(w + 30)} ${n1(y + dy)}" stroke="${colors[Math.floor(rand() * colors.length)]}" stroke-width="${n1(8 + rand() * 22)}" stroke-opacity="${n1(0.3 + rand() * 0.4)}" fill="none" stroke-linecap="round"/>`;
  }).join('');
  let x = -4;
  let y = height * (0.6 + rand() * 0.14);
  const pts = [[x, y]];
  while (x < w + 4) {
    x += w * 0.1 * (0.6 + rand() * 0.9);
    pts.push([x, y]);
    y = Math.max(height * 0.5, Math.min(height * 0.86, y + (rand() < 0.7 ? -1 : 1) * height * 0.04 * (0.5 + rand())));
    pts.push([x, y]);
  }
  const terrace = `M${pts.map(([px, py]) => `${n1(px)} ${n1(py)}`).join(' L')} L${w + 4} ${height + 4} L-4 ${height + 4}Z`;
  const r = n1(Math.min(w, height) * (0.1 + rand() * 0.07));
  const cx = n1(w * (0.22 + rand() * 0.56));
  const cy = n1(height * (0.2 + rand() * 0.16));
  const sigils = (piece?.sigils || []).slice(0, 4).join(' ');
  const label = piece ? `Not found yet: a ${piece.kind} by the maker, waiting near ${nearestWords(piece)}` : 'A folio not found yet';
  return `<svg class="lore-folio-svg" viewBox="0 0 ${w} ${height}" width="${w}" height="${height}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${height}" rx="6" fill="${colors[0]}"/><g opacity="0.92">${strokes}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#e6dfd0" opacity="0.82"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#efe3c8" stroke-width="1.2"/><path d="${terrace}" fill="#1b1622" opacity="0.42"/><path d="${terrace}" fill="none" stroke="#efe3c8" stroke-width="0.9" opacity="0.55"/><rect x="3" y="3" width="${w - 6}" height="${height - 6}" rx="5" fill="none" stroke="#efe3c8" stroke-opacity="0.5" stroke-width="1.4"/>${sigils ? `<text x="${n1(w - 10)}" y="${n1(height - 12)}" text-anchor="end" font-family="ui-monospace, monospace" font-size="${n1(Math.max(11, w / 11))}" fill="#efe3c8" opacity="0.85">${esc(sigils)}</text>` : ''}</svg>`;
}

/** Where a piece waits, in words: its nearest room or placement. */
export function nearestWords(piece) {
  const r = (piece?.resonance || []).find((x) => x.kind === 'near') || (piece?.resonance || []).find((x) => x.kind === 'room') || (piece?.resonance || []).find((x) => x.kind === 'trope') || (piece?.resonance || []).find((x) => x.kind === 'glass');
  return r ? r.label : 'somewhere in the land';
}

const saveData = () => { try { return Boolean(globalThis.navigator?.connection?.saveData); } catch { return false; } };

/** A found piece: the scan itself, from spwashi.com, at the size the page asks for. */
export function folioPictureHTML(piece, { sizes = '(max-width: 40rem) 45vw, 14rem', eager = false } = {}) {
  const tiers = ['thumb', 'display', ...(saveData() ? [] : ['hero'])].map((t) => [t, piece.tiers?.[t]]).filter(([, t]) => t);
  const set = (fmt) => tiers.filter(([, t]) => t[fmt]).map(([, t]) => `${t[fmt]} ${t.width}w`).join(', ');
  const display = piece.tiers.display;
  return `<picture>${set('avif') ? `<source type="image/avif" srcset="${esc(set('avif'))}" sizes="${esc(sizes)}">` : ''}<source type="image/webp" srcset="${esc(set('webp'))}" sizes="${esc(sizes)}"><img src="${esc(display.webp)}" width="${display.width}" height="${display.height}" alt="${esc(piece.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer"></picture>`;
}

/* <lore-folio folio="folio-2026-09-26-21" [size="200"]></lore-folio> */
if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('lore-folio')) {
  window.customElements.define('lore-folio', class extends HTMLElement {
    connectedCallback() {
      this.classList.add('lore-folio');
      this.onFound = (event) => { if (event.detail?.id === this.getAttribute('folio')) this.paint(); };
      window.addEventListener('lore:texture-find', this.onFound);
      this.paint();
    }

    disconnectedCallback() {
      window.removeEventListener('lore:texture-find', this.onFound);
    }

    async paint() {
      const doc = await loadFolios();
      const piece = doc?.pieces?.find((p) => p.id === this.getAttribute('folio'));
      if (!piece) { this.hidden = true; return; }
      const found = Boolean(held()[piece.id]) || this.hasAttribute('found');
      const size = Number(this.getAttribute('size')) || 200;
      this.dataset.state = found ? 'found' : 'waiting';
      this.dataset.kind = piece.kind;
      const answers = (piece.resonance || []).filter((r) => ['near', 'room', 'trope', 'glass'].includes(r.kind)).slice(0, 3);
      const motifs = (piece.resonance || []).filter((r) => r.kind === 'motif').map((r) => r.id).slice(0, 3);
      const answerList = answers.map((r) => (r.href ? `<a href="${esc(r.href)}">${esc(r.label)}</a>` : esc(r.label))).join(' · ');
      this.innerHTML = found
        ? `<figure class="lore-folio-face">${folioPictureHTML(piece, { sizes: this.getAttribute('sizes') || undefined })}<figcaption><strong class="lore-folio-title">${esc(piece.title)}</strong>${piece.asks ? `<span class="lore-folio-asks">${esc(piece.asks)}</span>` : ''}${answerList ? `<span class="lore-folio-answers">Answers ${answerList}</span>` : ''}<a class="lore-folio-across" href="${esc(piece.shown_at)}" rel="noopener">Where it lives, at spwashi.com →</a></figcaption></figure>`
        : `<figure class="lore-folio-face"><button type="button" class="lore-folio-wait" aria-expanded="false">${folioSilhouetteSVG(piece, { w: size })}</button><figcaption><span class="lore-folio-near">Waits near ${esc(nearestWords(piece))}</span>${piece.asks ? `<span class="lore-folio-asks">${esc(piece.asks)}</span>` : ''}${motifs.length ? `<span class="lore-folio-motifs">${esc(motifs.join(' '))}</span>` : ''}<span class="lore-folio-hint" hidden>Carry a pie past ${answerList || 'where it waits'} and it turns up here. It already hangs at <a href="${esc(piece.shown_at)}" rel="noopener">spwashi.com</a>, where it was made.</span></figcaption></figure>`;
      const wait = this.querySelector('.lore-folio-wait');
      if (wait) {
        wait.addEventListener('click', (event) => {
          event.stopPropagation();
          const hint = this.querySelector('.lore-folio-hint');
          const open = wait.getAttribute('aria-expanded') !== 'true';
          wait.setAttribute('aria-expanded', String(open));
          if (hint) hint.hidden = !open;
        });
      }
    }
  });
}
