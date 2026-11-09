/**
 * icons.mjs — the site's interface icons, drawn once, in one hand.
 *
 * A 24-unit grid, a 1.75 stroke in currentColor, round caps and joins: so an icon takes the ink and the size of
 * whatever holds it, and every icon on every page looks drawn by the same pen. They replace glyphs (❚❚ ♪ ◫ ◌ ⛶ …)
 * that each platform's fonts drew differently. An icon is decoration beside its words (aria-hidden), unless it
 * is given a label to stand alone. Kinds of wonder have their own badges (kinds.mjs). No DOM at import.
 */

const gear = (() => {
  // Eight teeth round a ring, and the hub.
  const pts = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 16;
    const r = i % 2 ? 7.1 : 9.4;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `<path d="M${pts.join('L')}Z"/><circle cx="12" cy="12" r="2.8"/>`;
})();

export const ICONS = Object.freeze({
  pause: '<rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none"/>',
  play: '<path d="M8 5.2v13.6L18.6 12z" fill="currentColor" stroke="none"/>',
  sound: '<path d="M4 9.5h3.4L12 5.6v12.8l-4.6-3.9H4z"/><path d="M15.4 9.2a4 4 0 0 1 0 5.6M17.8 6.8a7.4 7.4 0 0 1 0 10.4"/><path class="icon-off" d="M3.5 3.5l17 17"/>',
  story: '<path d="M3.5 6.2c3-1.2 5.8-1 8.5 1 2.7-2 5.5-2.2 8.5-1v12c-3-1.2-5.8-1-8.5 1-2.7-2-5.5-2.2-8.5-1z"/><path d="M12 7.2v12"/>',
  zen: '<path d="M18.2 8.2A7.6 7.6 0 1 0 19.6 13"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  fullscreen: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  leave: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  ask: '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.5"/><circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none"/>',
  labels: '<path d="M3.6 12.4V4.6h7.8l8.8 8.8-7.8 7.8z"/><circle cx="8.2" cy="9.2" r="1.4"/>',
  show: '<rect x="3.5" y="5" width="17" height="14" rx="1.6"/><path d="M3.8 15.2l4.6-4 3.6 3 3-2.6 5.4 4.2"/><circle cx="15.8" cy="9" r="1.3"/>',
  hands: '<path d="M6.5 8h12.5l-3.2-3.2M17.5 16H5l3.2 3.2"/>',
  setup: gear,
  begin: '<path d="M5.2 12.4A6.9 6.9 0 1 0 7.4 7"/><path d="M5 3.8v4.4h4.4"/>',
  screen: '<rect x="3.5" y="4.5" width="17" height="11.5" rx="1.6"/><path d="M9 20h6M12 16v4"/>',
  controls: '<path d="M9.6 3.6h4.8v6h6v4.8h-6v6H9.6v-6h-6V9.6h6z"/>',
  touch: '<path d="M9.2 11.6V6.2a1.5 1.5 0 0 1 3 0v5.2l4.4.9a2 2 0 0 1 1.6 2.3l-.8 4.1a2.6 2.6 0 0 1-2.5 2.1h-3.7a3 3 0 0 1-2.4-1.2l-2.8-3.8a1.5 1.5 0 0 1 2.3-1.9l.9 1.1"/><path d="M6.2 6.4a4.6 4.6 0 0 1 9 0"/>',
  panels: '<rect x="3.5" y="4" width="17" height="16" rx="1.6"/><path d="M10.2 4v16M10.2 11.2h10.3"/>',
  cards: '<rect x="8" y="3.6" width="11.4" height="15.2" rx="1.6"/><path d="M5.2 7v11.6a1.6 1.6 0 0 0 1.6 1.6h8.4"/>',
  book: '<path d="M5 4.5h10.5a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z"/><path d="M5 17.5a2 2 0 0 1 2-2h10.5"/>'
});

/** An icon as inline SVG markup: decoration (aria-hidden) unless it is given a label. */
export function icon(name, { size = 18, label = '' } = {}) {
  const body = ICONS[name];
  if (!body) return '';
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" ${a11y} fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** An icon as a DOM node (pages only). */
export function iconNode(name, options) {
  const holder = document.createElement('span');
  holder.innerHTML = icon(name, options);
  return holder.firstElementChild;
}

/* The glyphs the interface used to draw, and the icon each now is (a button's words can change the icon). */
const GLYPHS = Object.freeze({ '❚❚': 'pause', '▶': 'play', '♪': 'sound', '◫': 'story', '◌': 'zen', '⛶': 'fullscreen', '?': 'ask', '◇': 'labels', '▢': 'show', '⇄': 'hands', '⚙': 'setup', '↺': 'begin' });
export function iconForGlyph(glyph, words = '') {
  if (glyph === '⛶' && /^leave/i.test(words)) return 'leave';
  return GLYPHS[glyph] || null;
}
