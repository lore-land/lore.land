/**
 * settled.mjs — every change says what it changed.
 *
 * A setting on lore.land is a small act with a real effect on the page, and
 * the effect should be visible where it lands, not only in a control's
 * state. `settle()` shows a short card — a sigil, what settled, and one line
 * of consequence — near the control that changed (or as a strip at the foot
 * of a phone screen), and runs a brief gold sweep over the region it
 * changed. The card fades on its own; nothing waits on it.
 *
 * Any module may call settle(); the settled-layer also listens for a
 * `lore:settled` CustomEvent on window with the same detail, so modules
 * that must not import this one (or code in other rooms) can still confirm.
 *
 *   settle({ sigil: '=', title: 'Lamplight', detail: 'The room is lit for evening.',
 *            at: controlElement, region: 'main.chapter' })
 *
 * `art` (an SVG string this codebase wrote, never reader text) sits beside
 * the words — the sightings drawing uses it to show the stroke just earned.
 *
 * With a meme register cast for the visit (spw-bias.mjs), a receipt may add
 * one line in that register beside the plain detail, never instead of it;
 * `register: false` keeps a receipt plain. With no register cast, nothing
 * changes.
 */

import { biased } from './spw-bias.mjs?v=2026_11_08.N';

const LIFETIME = 2600;
const SWEEP = 900;

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

let host = null;
let timer = 0;

/* body carries perspective (reset.css), which makes it the containing block
 * for position:fixed — a card placed by viewport coordinates would land at
 * the top of the document, off-screen once the reader has scrolled. The top
 * layer (a manual popover) is outside every containing block; without the
 * Popover API the host sits beside body instead. */
const canPopover = () => typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

function ensureHost() {
  if (host && host.isConnected) return host;
  host = el('div', { className: 'settled', role: 'status', 'aria-live': 'polite', hidden: '' });
  if (canPopover()) {
    host.setAttribute('popover', 'manual');
    document.body.append(host);
  } else {
    document.documentElement.append(host);
  }
  return host;
}

function reveal(box) {
  box.hidden = false;
  if (box.hasAttribute('popover') && !box.matches(':popover-open')) {
    try { box.showPopover(); } catch { /* already shown or detached */ }
  }
}

function conceal(box) {
  if (box.hasAttribute('popover') && box.matches(':popover-open')) {
    try { box.hidePopover(); } catch { /* already hidden */ }
  }
  box.hidden = true;
}

function placeNear(card, at) {
  const narrow = window.matchMedia('(max-width: 40rem)').matches;
  card.classList.toggle('is-strip', narrow || !at);
  if (narrow || !at) {
    card.style.left = '';
    card.style.top = '';
    return;
  }
  const box = at.getBoundingClientRect();
  const width = card.offsetWidth || 280;
  const height = card.offsetHeight || 64;
  let left = box.left + box.width / 2 - width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  let top = box.top - height - 10;
  if (top < 8) top = box.bottom + 10;
  card.style.left = `${Math.round(left)}px`;
  card.style.top = `${Math.round(top)}px`;
}

function sweep(region) {
  const nodes = typeof region === 'string' ? document.querySelectorAll(region) : (region ? [region] : []);
  nodes.forEach((node) => {
    node.classList.remove('is-settling');
    void node.offsetWidth;
    node.classList.add('is-settling');
    setTimeout(() => node.classList.remove('is-settling'), SWEEP);
  });
}

/**
 * @param {{ sigil?: string, title: string, detail?: string, art?: string, lifetime?: number, at?: Element|null, region?: string|Element|null, tone?: string, register?: boolean }} what
 */
export function settle(what = {}) {
  if (!what.title || typeof document === 'undefined') return;
  const box = ensureHost();
  clearTimeout(timer);
  const art = typeof what.art === 'string' && what.art.startsWith('<svg') ? el('span', { className: 'settled-art', 'aria-hidden': 'true' }) : null;
  if (art) art.innerHTML = what.art;
  const aside = what.register === false ? '' : biased('settle', '', { what: what.title });
  const card = el('div', { className: `settled-card${what.tone ? ` is-${what.tone}` : ''}${art ? ' has-art' : ''}` },
    art || el('span', { className: 'settled-sigil', 'aria-hidden': 'true' }, what.sigil || '·'),
    el('span', { className: 'settled-text' },
      el('strong', { className: 'settled-title' }, what.title),
      what.detail ? el('span', { className: 'settled-detail' }, what.detail) : null,
      aside ? el('span', { className: 'settled-detail is-register' }, aside) : null));
  box.replaceChildren(card);
  reveal(box);
  placeNear(card, what.at instanceof Element ? what.at : null);
  // A timeout, not a frame: frames stop in a background tab, and the card must still settle.
  setTimeout(() => card.classList.add('is-in'), 20);
  if (what.region) sweep(what.region);
  timer = setTimeout(() => {
    card.classList.remove('is-in');
    card.classList.add('is-out');
    setTimeout(() => { if (box.firstChild === card) { conceal(box); box.replaceChildren(); } }, 320);
  }, Number(what.lifetime) > 0 ? Number(what.lifetime) : LIFETIME);
}

export function initSettled() {
  const onEvent = (event) => settle(event.detail || {});
  window.addEventListener('lore:settled', onEvent);
  return () => {
    window.removeEventListener('lore:settled', onEvent);
    clearTimeout(timer);
    host?.remove();
    host = null;
  };
}
