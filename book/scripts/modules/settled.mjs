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
 */

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

function ensureHost() {
  if (host && host.isConnected) return host;
  host = el('div', { className: 'settled', role: 'status', 'aria-live': 'polite', hidden: '' });
  document.body.append(host);
  return host;
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
 * @param {{ sigil?: string, title: string, detail?: string, at?: Element|null, region?: string|Element|null, tone?: string }} what
 */
export function settle(what = {}) {
  if (!what.title || typeof document === 'undefined') return;
  const box = ensureHost();
  clearTimeout(timer);
  const card = el('div', { className: `settled-card${what.tone ? ` is-${what.tone}` : ''}` },
    el('span', { className: 'settled-sigil', 'aria-hidden': 'true' }, what.sigil || '·'),
    el('span', { className: 'settled-text' },
      el('strong', { className: 'settled-title' }, what.title),
      what.detail ? el('span', { className: 'settled-detail' }, what.detail) : null));
  box.replaceChildren(card);
  box.hidden = false;
  placeNear(card, what.at instanceof Element ? what.at : null);
  // A timeout, not a frame: frames stop in a background tab, and the card must still settle.
  setTimeout(() => card.classList.add('is-in'), 20);
  if (what.region) sweep(what.region);
  timer = setTimeout(() => {
    card.classList.remove('is-in');
    card.classList.add('is-out');
    setTimeout(() => { if (box.firstChild === card) { box.hidden = true; box.replaceChildren(); } }, 320);
  }, LIFETIME);
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
