/**
 * panel-art.mjs — the book's places as painted panels, drawn from vector shapes.
 *
 * The composition is learned from the maker's laminated panels (spwashi.com/design/folios): a scumbled
 * wash; a stepped horizon, terraced like a stair; a disc, or a pair of discs, standing over it; ink laid on
 * top in thin cream or gold line; now and then a paper slip. No scan is copied here: what carries over is
 * how a panel is put together.
 *
 * A panel is data, so a new scene costs a record rather than a drawing: PLACES holds its palette, its
 * horizon, its discs and which ink it wears. placeSVG(id, { w, h, light, cast }) draws one anywhere, and
 * <lore-panel place="gate"> places it on a page. Every id inside an SVG is prefixed, so any number of
 * panels can share a document. Nothing here runs per frame.
 *
 * Canon: nobody in a panel speaks; the figure in plain lines stays one circle, one rectangle, four lines
 * and two dots at any scale, and the hat rests above and never lands; children are never drawn.
 */
import { figureGroup } from './characters.mjs?v=2026_11_11.A';

const INK = '#efe3c8';
const GOLD = '#d9a24a';
export const COLORS = Object.freeze({
  plum: '#4b2c44', maroon: '#572733', violet: '#6f4c7c', dusk: '#39304a', leaf: '#26362c', olive: '#5d6238',
  teal: '#4f9a98', pale: '#8fc8c4', rose: '#bd5472', ember: '#a8502e', amber: '#d9a24a', bronze: '#8a6a3a',
  bone: '#e6dfd0', grey: '#8a8496', storm: '#22323c'
});

/* A small, repeatable random: the same place is always the same painting. */
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
const n1 = (x) => Math.round(x * 10) / 10;

/** Long dry strokes across the ground, at one lean, the way a wide brush leaves it. */
function wash(w, h, colors, rand, lean = -0.18) {
  const strokes = [];
  for (let i = 0; i < 22; i += 1) {
    const y = rand() * (h + 60) - 30;
    const x0 = -40 + rand() * 40;
    const x1 = w + rand() * 40;
    const c = colors[Math.floor(rand() * colors.length)];
    const dy = (x1 - x0) * lean + (rand() - 0.5) * 18;
    strokes.push(`<path d="M${n1(x0)} ${n1(y)} Q${n1(w / 2)} ${n1(y + dy / 2 + (rand() - 0.5) * 30)} ${n1(x1)} ${n1(y + dy)}" stroke="${c}" stroke-width="${n1(10 + rand() * 30)}" stroke-opacity="${n1(0.28 + rand() * 0.42)}" fill="none" stroke-linecap="round"/>`);
  }
  return strokes.join('');
}

/** A terraced edge across the panel, and the ground under it. `at` is the line's height as a share of h; `rise` tips it. */
function terrace(w, h, rand, { at = 0.62, rise = 0.16, run = 0.09, jitter = 0.5 } = {}) {
  let x = -4;
  let y = h * (at + rise / 2);
  const pts = [[x, y]];
  const stepW = w * run;
  while (x < w + 4) {
    x += stepW * (0.55 + rand() * 0.9);
    pts.push([x, y]);
    const dir = rand() < 0.74 ? -1 : 1;
    y += dir * h * rise * (0.14 + rand() * 0.26) * (0.5 + jitter * rand());
    y = Math.max(h * (at - rise), Math.min(h * (at + rise), y));
    pts.push([x, y]);
  }
  return `M${pts.map(([px, py]) => `${n1(px)} ${n1(py)}`).join(' L')} L${n1(w + 4)} ${n1(h + 4)} L-4 ${n1(h + 4)}Z`;
}

/** A disc: a rim, a shaded side, and a light that sits a little off centre. */
function disc(id, i, { x, y, r, fill, rim, glow = 0 }) {
  const shade = `${id}-disc${i}`;
  return `<defs><radialGradient id="${shade}" cx="38%" cy="34%" r="78%"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.04"/><stop offset="1" stop-color="#1b1622" stop-opacity="0.55"/></radialGradient></defs>${glow ? `<circle cx="${x}" cy="${y}" r="${n1(r * 1.55)}" fill="${fill}" opacity="${glow}"/>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${shade})"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${rim}" stroke-width="1.6"/><path d="M${n1(x - r * 0.72)} ${n1(y + r * 0.1)} q${n1(r * 0.5)} ${n1(r * 0.42)} ${n1(r * 1.1)} ${n1(r * 0.26)}" fill="none" stroke="${rim}" stroke-width="1" opacity="0.55"/>`;
}

/* The ink each place wears, in thin line over the paint. Each takes the panel's width and height. */
const INKS = Object.freeze({
  furrows: (w, h, rand) => {
    const rows = [0.72, 0.8, 0.88, 0.96].map((k, i) => `<path d="M-4 ${n1(h * k)} Q${n1(w * 0.35)} ${n1(h * (k - 0.05 + i * 0.01))} ${n1(w * 0.6)} ${n1(h * k)} T${n1(w + 4)} ${n1(h * (k - 0.03))}"/>`).join('');
    const frost = Array.from({ length: 16 }, () => { const x = rand() * w; const y = h * (0.7 + rand() * 0.28); return `<path d="M${n1(x)} ${n1(y)} l3 -5 M${n1(x + 3)} ${n1(y)} l3 -5" stroke-width="0.9"/>`; }).join('');
    return rows + frost;
  },
  gate: (w, h, rand) => {
    const cx = w * 0.56; const top = h * 0.3; const foot = h * 0.86;
    const rain = Array.from({ length: 34 }, () => { const x = rand() * (w + 40); const y = rand() * h; return `<path d="M${n1(x)} ${n1(y)} l-7 18" stroke-width="0.7" opacity="0.55"/>`; }).join('');
    return `${rain}<path d="M${n1(cx - 42)} ${n1(foot)} V${n1(top)} M${n1(cx + 42)} ${n1(foot)} V${n1(top)}" stroke-width="3.2"/><path d="M${n1(cx - 56)} ${n1(top)} H${n1(cx + 56)} M${n1(cx - 50)} ${n1(top + 8)} H${n1(cx + 50)}" stroke-width="2"/><path d="M${n1(cx - 42)} ${n1(foot - 12)} L${n1(cx)} ${n1(top + 34)} L${n1(cx + 42)} ${n1(foot - 12)}" stroke-width="1.1"/>`;
  },
  lanes: (w, h) => {
    const vx = w * 0.5; const vy = h * 0.5;
    return [-2.2, -1.1, 0, 1.1, 2.2].map((k) => `<path d="M${n1(vx + k * 12)} ${n1(vy + 6)} L${n1(vx + k * w * 0.27)} ${n1(h + 4)}" stroke-width="1.1" stroke-dasharray="7 6"/>`).join('');
  },
  columns: (w, h) => [0.14, 0.3, 0.7, 0.86].map((k) => `<path d="M${n1(w * k - 8)} ${n1(h * 0.9)} V${n1(h * 0.42)} M${n1(w * k + 8)} ${n1(h * 0.9)} V${n1(h * 0.42)}" stroke-width="1.3"/><path d="M${n1(w * k - 13)} ${n1(h * 0.42)} H${n1(w * k + 13)} M${n1(w * k - 13)} ${n1(h * 0.9)} H${n1(w * k + 13)}" stroke-width="2"/>`).join(''),
  throne: (w, h) => {
    const cx = w * 0.5; const seat = h * 0.68;
    return `<path d="M${n1(cx - 26)} ${n1(h * 0.9)} V${n1(seat)} M${n1(cx + 26)} ${n1(h * 0.9)} V${n1(seat)}" stroke-width="2.2"/><path d="M${n1(cx - 32)} ${n1(seat)} h26 M${n1(cx + 6)} ${n1(seat)} h26" stroke-width="2.6"/><path d="M${n1(cx - 24)} ${n1(seat - 8)} V${n1(h * 0.34)} l10 -9 l14 9 M${n1(cx + 24)} ${n1(seat - 12)} V${n1(h * 0.4)} l-10 -14" stroke-width="2"/><path d="M${n1(w * 0.14)} ${n1(h * 0.22)} l14 9 M${n1(w * 0.8)} ${n1(h * 0.28)} l-12 12 M${n1(w * 0.72)} ${n1(h * 0.14)} h14" stroke-width="1.4" opacity="0.8"/>`;
  },
  table: (w, h) => {
    const y = h * 0.66;
    const stool = (x) => `<path d="M${n1(x - 11)} ${n1(y + 26)} h22 M${n1(x - 7)} ${n1(y + 26)} l-3 24 M${n1(x + 7)} ${n1(y + 26)} l3 24" stroke-width="1.8"/>`;
    return `<path d="M${n1(w * 0.16)} ${n1(y)} H${n1(w * 0.84)}" stroke-width="3"/><path d="M${n1(w * 0.22)} ${n1(y)} v${n1(h * 0.3)} M${n1(w * 0.78)} ${n1(y)} v${n1(h * 0.3)}" stroke-width="2"/>${stool(w * 0.36)}${stool(w * 0.5)}${stool(w * 0.64)}<ellipse cx="${n1(w * 0.42)}" cy="${n1(y - 3)}" rx="14" ry="3" stroke-width="1.2"/><ellipse cx="${n1(w * 0.6)}" cy="${n1(y - 3)}" rx="14" ry="3" stroke-width="1.2"/>`;
  }
});

/** The places. `ground` is the wash, `far` and `near` the terraces, `discs` what stands over them. */
export const PLACES = Object.freeze({
  field: { name: 'The field', says: 'Frost in the furrows.', ground: ['leaf', 'olive', 'dusk', 'grey'], far: 'violet', near: 'leaf', horizon: { at: 0.58, rise: 0.1 }, discs: [{ x: 0.72, y: 0.27, r: 0.15, fill: 'bone', rim: 'pale' }], ink: 'furrows', lean: -0.08, stand: [0.28, 0.9] },
  gate: { name: 'The parcel gate', says: 'In a storm.', ground: ['storm', 'dusk', 'teal', 'plum'], far: 'plum', near: 'storm', horizon: { at: 0.7, rise: 0.12 }, discs: [{ x: 0.2, y: 0.24, r: 0.09, fill: 'grey', rim: 'pale' }], ink: 'gate', lean: 0.32, warmth: [0.56, 0.62], stand: [0.56, 0.92] },
  lanes: { name: 'The lanes', says: 'Which curve for everyone.', ground: ['bronze', 'plum', 'olive', 'maroon'], far: 'maroon', near: 'bronze', horizon: { at: 0.5, rise: 0.14 }, discs: [{ x: 0.34, y: 0.2, r: 0.1, fill: 'bone', rim: 'amber' }, { x: 0.62, y: 0.28, r: 0.13, fill: 'grey', rim: 'pale' }], ink: 'lanes', lean: -0.14, stand: [0.5, 0.94] },
  plaza: { name: 'The plaza', says: 'Where the pie holds court.', ground: ['ember', 'maroon', 'amber', 'rose'], far: 'maroon', near: 'ember', horizon: { at: 0.8, rise: 0.08 }, discs: [{ x: 0.5, y: 0.3, r: 0.17, fill: 'amber', rim: 'bone', glow: 0.25 }], ink: 'columns', lean: -0.05, stand: [0.5, 0.93] },
  court: { name: 'The rented court', says: 'Arriving in pieces.', ground: ['plum', 'violet', 'maroon', 'dusk'], far: 'violet', near: 'plum', horizon: { at: 0.76, rise: 0.16 }, discs: [{ x: 0.78, y: 0.3, r: 0.12, fill: 'teal', rim: 'pale' }, { x: 0.22, y: 0.44, r: 0.07, fill: 'rose', rim: 'bone' }], ink: 'throne', lean: 0.12, stand: [0.5, 0.92] },
  table: { name: 'The long table', says: 'A second place is set.', ground: ['teal', 'pale', 'dusk', 'storm'], far: 'dusk', near: 'storm', horizon: { at: 0.52, rise: 0.08 }, discs: [{ x: 0.74, y: 0.2, r: 0.11, fill: 'bone', rim: 'dusk' }], ink: 'table', lean: -0.2, stand: [0.5, 0.92] }
});

const LIGHTS = Object.freeze({
  day: '',
  dusk: '<rect width="100%" height="100%" fill="#7a3a22" opacity="0.2"/>',
  night: '<rect width="100%" height="100%" fill="#10141f" opacity="0.42"/>'
});

let counter = 0;

/**
 * A place, painted. { w, h, light, cast, standalone }: `cast` is a list of character ids, stood at the place's
 * standing point and spaced out from it. Rough edges and grain are SVG filters, so a page with many
 * panels can pass { plain: true } for a drawing without them.
 */
export function placeSVG(id, { w = 320, h = 200, light = 'day', cast = [], plain = false, label = '' } = {}) {
  const p = PLACES[id];
  if (!p) return '';
  const rand = seeded(id);
  const key = `lp${(counter += 1).toString(36)}-${id}`;
  const c = (name) => COLORS[name] || name;
  const r = Math.min(w, h * 1.6);
  const discs = p.discs.map((d, i) => disc(key, i, { x: n1(d.x * w), y: n1(d.y * h), r: n1(d.r * r), fill: c(d.fill), rim: c(d.rim), glow: d.glow || 0 })).join('');
  const far = terrace(w, h, rand, { ...p.horizon, at: p.horizon.at - 0.07 });
  const near = terrace(w, h, rand, { ...p.horizon, at: p.horizon.at + 0.06, run: 0.13 });
  const rough = plain ? '' : ` filter="url(#${key}-rough)"`;
  const warmth = p.warmth ? `<circle cx="${n1(p.warmth[0] * w)}" cy="${n1(p.warmth[1] * h)}" r="${n1(h * 0.16)}" fill="url(#${key}-warm)"/>` : '';
  const figures = cast.map((who, i) => {
    const [sx, sy] = p.stand;
    const size = h * 0.46;
    const spread = (i - (cast.length - 1) / 2) * size * 0.72;
    return `<g transform="translate(${n1(sx * w + spread - size / 2)} ${n1(sy * h - size)}) scale(${n1(size / 100 * 100) / 100})">${figureGroup(who)}</g>`;
  }).join('');
  const title = label || `${p.name}. ${p.says}`;
  return `<svg class="lore-panel-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title.replace(/"/g, '&quot;')}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><defs><clipPath id="${key}-clip"><rect width="${w}" height="${h}"/></clipPath><radialGradient id="${key}-warm"><stop offset="0" stop-color="${GOLD}" stop-opacity="0.9"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>${plain ? '' : `<filter id="${key}-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${Math.floor(rand() * 90)}"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter><filter id="${key}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 0.92 0 0 0 0 0.88 0 0 0 0 0.8 0 0 0 0.16 0"/></filter>`}</defs><g clip-path="url(#${key}-clip)"><rect width="${w}" height="${h}" fill="${c(p.ground[0])}"/><g${rough}>${wash(w, h, p.ground.map(c), rand, p.lean)}</g>${discs}<g${rough}><path d="${far}" fill="${c(p.far)}"/><path d="${near}" fill="${c(p.near)}"/></g><path d="${far}" fill="none" stroke="${INK}" stroke-width="0.9" opacity="0.5"/>${warmth}<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${INKS[p.ink](w, h, rand)}</g>${figures}${LIGHTS[light] || ''}${plain ? '' : `<rect width="${w}" height="${h}" filter="url(#${key}-grain)"/>`}</g></svg>`;
}

/* Each trope's prop, in ink on a 64 × 64 tile (book/content/world/tropes.json). A new trope needs one small drawing. */
const PROPS = Object.freeze({
  'exactly-one': `<ellipse cx="32" cy="42" rx="20" ry="6"/><path d="M13 41 Q15 24 32 22 Q49 24 51 41"/><path d="M32 22 v-9" stroke-width="2.4"/>`,
  'floating-title': `<path d="M18 28 Q32 32 46 28 Q32 24 18 28Z"/><path d="M23 27 C22 13 42 13 41 27"/><path d="M26 48 h12" stroke-dasharray="2 3"/>`,
  'never-smaller': `<path d="M14 42 L46 20 Q54 32 50 44Z"/><path d="M20 39 q14 -6 27 -12" stroke-width="1"/><path d="M28 16 q-3 -5 0 -9 M38 13 q-3 -4 0 -8" stroke-width="1.2"/>`,
  wap: `<path d="M32 8 l5 13 13 -6 -5 13 13 5 -13 5 5 13 -13 -6 -5 13 -5 -13 -13 6 5 -13 -13 -5 13 -5 -5 -13 13 6Z"/>`,
  'silent-protest': `<rect x="17" y="12" width="30" height="22" rx="1"/><path d="M32 34 v20" stroke-width="2.4"/>`,
  'off-switch': `<rect x="16" y="36" width="32" height="12" rx="2"/><path d="M32 36 L42 16" stroke-width="2.6"/><circle cx="43" cy="14" r="3.4" fill="#bd5472" stroke="none"/>`,
  'said-so': `<circle cx="32" cy="38" r="13" fill="#6f4c7c"/><path d="M32 25 q2 -9 9 -12"/><path d="M26 34 h.1 M37 40 h.1" stroke-width="2.6"/>`,
  glimpse: `<circle cx="32" cy="34" r="15" fill="#4f9a98"/><circle cx="32" cy="34" r="5" fill="#d9a24a" stroke="none"/><path d="M32 19 q4 -8 10 -8"/>`,
  'plain-lines': `<circle cx="32" cy="22" r="7"/><circle cx="29.6" cy="22" r="0.9" fill="#efe3c8" stroke="none"/><circle cx="34.4" cy="22" r="0.9" fill="#efe3c8" stroke="none"/><rect x="26" y="31" width="12" height="14"/><path d="M26 33 l-6 8 M38 33 l6 8 M29 45 l-2 11 M35 45 l2 11"/>`,
  'warm-question': `<path d="M4 54 H60" stroke-width="1"/><circle cx="54" cy="46" r="7" fill="#d9a24a" stroke="none" opacity="0.9"/><path d="M20 24 q0 -9 8 -9 q8 0 8 7 q0 6 -7 8 v4 M29 41 v.1" stroke-width="2.2"/>`,
  'forgiving-glass': `<path d="M20 12 L44 8 V50 L20 54Z"/><circle cx="32" cy="31" r="7" stroke-width="1" stroke-dasharray="2 2"/><path d="M26 18 l4 -1" stroke-width="1"/>`,
  'slow-gift': `<path d="M12 38 Q16 24 32 26 Q44 28 46 38 Q40 46 26 46 Q16 46 12 38Z"/><path d="M46 38 q10 -2 12 8 q-8 4 -14 -2"/><path d="M18 34 h.1" stroke-width="2.4"/><path d="M12 54 h3 M22 54 h3 M32 54 h3" stroke-width="1.2"/>`,
  records: `<rect x="17" y="10" width="26" height="36" rx="1"/><path d="M21 18 h18" stroke-width="2.4" stroke="#bd5472"/><path d="M21 26 h18 M21 32 h13"/><path d="M26 54 h20" stroke-width="1"/>`,
  'missing-day': `<rect x="14" y="14" width="36" height="36" rx="1"/><path d="M14 24 H50"/><path d="M26 14 v-4 M38 14 v-4" stroke-width="2"/>`,
  'beyond-the-frame': [50, 44, 38, 32, 26].map((y) => `<ellipse cx="32" cy="${y}" rx="17" ry="4"/>`).join(''),
  'right-angle-companion': `<path d="M14 12 V50 H52" stroke-width="2.2"/><path d="M24 40 q6 -4 12 0 M24 32 q6 -4 12 0 M24 24 q6 -4 12 0" stroke-width="1.2"/>`,
  'torch-arm': `<circle cx="32" cy="20" r="7"/><circle cx="29.6" cy="20" r="0.9" fill="#efe3c8" stroke="none"/><circle cx="34.4" cy="20" r="0.9" fill="#efe3c8" stroke="none"/><rect x="26" y="29" width="12" height="14"/><path d="M26 31 l-6 8 M38 31 l4 5 M29 43 l-2 11 M35 43 l2 11"/><circle cx="43" cy="37" r="2.6" fill="#d9a24a" stroke="none"/>`
});
const GROUND_BY_SIGIL = Object.freeze({ '!': 'maroon', '~': 'dusk', '%': 'bronze', '&': 'plum', '=': 'storm', '?': 'violet', '@': 'leaf', '*': 'ember', '#': 'teal', '.': 'grey' });

/** A trope's emblem: its prop in ink on a painted tile with a stepped foot, the ground chosen by its sigil. */
export function tropeEmblemSVG(id, { size = 48, sigil = '', label = '' } = {}) {
  const prop = PROPS[id];
  if (!prop) return '';
  const ground = COLORS[GROUND_BY_SIGIL[sigil] || 'dusk'];
  return `<svg class="lore-emblem-svg" viewBox="0 0 64 64" width="${size}" height="${size}" ${label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'} xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="4" fill="${ground}"/><path d="M0 58 h12 v-4 h12 v3 h14 v-5 h12 v4 h14 V64 H0Z" fill="#1b1622" opacity="0.35"/><g fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${prop}</g></svg>`;
}
export const EMBLEMS = Object.freeze(Object.keys(PROPS));

/* <lore-panel place="gate" light="night" cast="porter"></lore-panel> */
if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('lore-panel')) {
  window.customElements.define('lore-panel', class extends HTMLElement {
    connectedCallback() {
      const cast = (this.getAttribute('cast') || '').split(/[\s,]+/).filter(Boolean);
      this.innerHTML = placeSVG(this.getAttribute('place'), {
        w: Number(this.getAttribute('w')) || 320,
        h: Number(this.getAttribute('h')) || 200,
        light: this.getAttribute('light') || 'day',
        label: this.getAttribute('label') || '',
        cast
      });
      this.classList.add('lore-panel');
    }
  });
}
