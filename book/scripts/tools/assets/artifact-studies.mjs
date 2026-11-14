#!/usr/bin/env node
/**
 * artifact-studies.mjs — drawn studies for the almanac's artifacts (npm run assets:studies).
 *
 * Until an artifact has a painted plate, it has a study: one object in one light, drawn in cream ink over the
 * series ground (leaf-dark, teal and amber lit from within, vignette and grain), the way plates 14 and 15 began as
 * drawn studies. Each is an SVG in book/images/studies/artifact-<id>-v<v>.svg; almanac.json points to it
 * (`plate: { src, state: "study" }`), and the plate prompt beside it is what a painted plate is made from.
 * Authoring-time only; the outputs are committed. Re-run after changing a drawing: bump its `v` (the file becomes
 * artifact-<id>-v<v>.svg), point almanac.json at the new file, and remove the old one.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const OUT = resolve(ROOT, 'book/images/studies');
const W = 600;
const H = 400;
const INK = '#efe3c8';
const AMBER = '#f2b04e';
const TEAL = '#5fb3a8';
const BERRY = '#b0566e';
const IRON = '#2a2f33';

/* The series ground: leaf-dark, a glow where the object is, a teal rim, grain and a vignette. */
const ground = (id, { glowX = 300, glowY = 190, warm = 0.5 } = {}) => `
  <defs>
    <radialGradient id="${id}-ground" cx="50%" cy="46%" r="75%">
      <stop offset="0" stop-color="#26362c"/><stop offset="0.6" stop-color="#15221c"/><stop offset="1" stop-color="#0b1310"/>
    </radialGradient>
    <radialGradient id="${id}-glow" cx="${(glowX / W) * 100}%" cy="${(glowY / H) * 100}%" r="42%">
      <stop offset="0" stop-color="${AMBER}" stop-opacity="${warm}"/><stop offset="0.55" stop-color="${AMBER}" stop-opacity="${warm * 0.18}"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL}" stop-opacity="0.28"/><stop offset="0.5" stop-color="${TEAL}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/>
    </radialGradient>
    <filter id="${id}-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.94  0 0 0 0 0.89  0 0 0 0 0.78  0 0 0 0.09 0"/>
    </filter>
    <filter id="${id}-soft"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}-ground)"/>
  <rect width="${W}" height="${H}" fill="url(#${id}-rim)"/>
  <rect width="${W}" height="${H}" fill="url(#${id}-glow)"/>`;
const finish = (id) => `
  <rect width="${W}" height="${H}" filter="url(#${id}-grain)"/>
  <rect width="${W}" height="${H}" fill="url(#${id}-vignette)"/>`;
const svg = (id, title, desc, body, glow) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="${id}-t ${id}-d">
  <title id="${id}-t">${title} — a study</title>
  <desc id="${id}-d">${desc}</desc>${ground(id, glow)}
  <g fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}
  </g>${finish(id)}
</svg>
`;
const rain = (x0, x1, y0, y1, n, seed = 1) => {
  let s = seed;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, () => {
    const x = x0 + r() * (x1 - x0);
    const y = y0 + r() * (y1 - y0);
    return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l-6 16" stroke="${TEAL}" stroke-opacity="0.35" stroke-width="1.2"/>`;
  }).join('');
};

const STUDIES = {
  'horn-button': {
    title: 'The horn button',
    desc: 'A round horn button with two thread-holes, scuffed where it was trodden in the plaza, at rest on the parcel gate\'s wet iron threshold; a single drawn line, the figure\'s arm, reaches in from the dark to lift it.',
    glow: { glowX: 300, glowY: 205, warm: 0.55 },
    body: `
    ${rain(40, 560, 20, 240, 26, 3)}
    <path d="M40 286H560" stroke-width="1.6" stroke-opacity="0.5"/>
    <rect x="40" y="288" width="520" height="34" fill="${IRON}" stroke="none" opacity="0.85"/>
    <path d="M40 288H560M40 322H560" stroke="${TEAL}" stroke-opacity="0.45" stroke-width="1.4"/>
    <path d="M70 305h460" stroke="${INK}" stroke-opacity="0.25" stroke-dasharray="3 9"/>
    <circle cx="300" cy="226" r="54" fill="#8c6a43" stroke="none" opacity="0.95"/>
    <circle cx="300" cy="226" r="54" fill="none" stroke="${INK}"/>
    <circle cx="300" cy="226" r="44" fill="none" stroke="${AMBER}" stroke-opacity="0.7" stroke-width="1.6"/>
    <circle cx="287" cy="226" r="6.5" fill="#15221c" stroke="${INK}" stroke-width="1.8"/>
    <circle cx="313" cy="226" r="6.5" fill="#15221c" stroke="${INK}" stroke-width="1.8"/>
    <path d="M270 196q10-6 22-6M318 252q12 2 20-8" stroke="${INK}" stroke-opacity="0.55" stroke-width="1.4"/>
    <path d="M100 360L262 286Q276 280 284 284" stroke-width="2.6"/>
    <path d="M284 284q8 2 12-6" stroke-width="2.6"/>`
  },
  'waxed-slice': {
    title: 'The slice in waxed paper',
    desc: 'A slice of pie folded in soft waxed paper on the shelf of a cold stove, a faint berry stain through the paper and steam still rising from it, though the room is cold.',
    glow: { glowX: 300, glowY: 230, warm: 0.6 },
    body: `
    <path d="M60 300H540" stroke-width="2"/>
    <path d="M60 300v48M540 300v48" stroke-opacity="0.4"/>
    <rect x="70" y="200" width="70" height="100" stroke-opacity="0.35"/>
    <path d="M80 210l50 80M130 210l-50 80" stroke-opacity="0.18"/>
    <path d="M188 296L246 206L438 214L462 296Z" fill="#e8d9b4" fill-opacity="0.1"/>
    <path d="M188 296L246 206L438 214L462 296" stroke-opacity="0.45" stroke-width="1.6"/>
    <path d="M246 206L292 258M438 214L410 262" stroke-opacity="0.25" stroke-width="1.2"/>
    <path d="M232 262v20L404 300v-20" fill="${BERRY}" fill-opacity="0.45"/>
    <path d="M232 262L386 222Q424 246 404 280Z" fill="#e8d9b4" fill-opacity="0.2"/>
    <path d="M232 262L386 222Q424 246 404 280Z"/>
    <path d="M386 222Q424 246 404 280" stroke="#c99a5a" stroke-width="9" stroke-opacity="0.9"/>
    <path d="M404 280v20" stroke="#c99a5a" stroke-width="9" stroke-opacity="0.7"/>
    <path d="M262 256l56-10M290 262l64-12" stroke-opacity="0.3" stroke-width="1.2"/>
    <path d="M232 262L274 296L292 256Z" fill="#e8d9b4" fill-opacity="0.28"/>
    <ellipse cx="340" cy="252" rx="14" ry="7" fill="${BERRY}" fill-opacity="0.6" stroke="none"/>
    <path d="M276 196c-10-18 12-26 0-44s8-28 0-40" stroke="${INK}" stroke-opacity="0.55" stroke-width="1.8"/>
    <path d="M304 192c-8-16 10-22 0-38s6-24 0-36" stroke="${INK}" stroke-opacity="0.4" stroke-width="1.6"/>
    <path d="M330 200c-8-14 8-20 0-34" stroke="${INK}" stroke-opacity="0.3" stroke-width="1.4"/>`
  },
  'gate-book-entry': {
    title: 'The gate-book entry',
    desc: 'The parcel gate\'s ledger open under a hooded lamp, ruled columns and one row filled in a careful hand, with a single word under remarks: parcel.',
    glow: { glowX: 300, glowY: 120, warm: 0.62 },
    body: `
    <path d="M250 40h100l-14 40h-72z" stroke-opacity="0.7"/>
    <path d="M300 80v12" stroke-opacity="0.5"/>
    <path d="M120 150L480 140L520 340L80 352Z" fill="#e8d9b4" fill-opacity="0.12"/>
    <path d="M120 150L480 140L520 340L80 352Z"/>
    <path d="M300 145L300 346" stroke-opacity="0.5"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${112 - i * 6} ${176 + i * 30}L${486 + i * 6} ${166 + i * 30}" stroke-opacity="0.25" stroke-width="1.2"/>`).join('')}
    ${[170, 220, 360, 420].map((x) => `<path d="M${x} 146L${x - (x - 300) * 0.12} 348" stroke-opacity="0.22" stroke-width="1.2"/>`).join('')}
    <path d="M130 228q12-8 24 0t24 0 24 0M184 226q10-6 20 0" stroke="${AMBER}" stroke-width="1.8"/>
    <path d="M232 225q8-6 16 0t16 0M326 222q10-6 20 0t20 0" stroke="${AMBER}" stroke-width="1.8"/>
    <text x="430" y="226" fill="${AMBER}" stroke="none" font-family="Georgia, serif" font-style="italic" font-size="22" text-anchor="middle">parcel</text>
    <path d="M500 300l40-90" stroke-width="3" stroke-opacity="0.7"/>
    <path d="M500 300l-4 10" stroke="${AMBER}" stroke-width="3"/>`
  },
  'damage-slip': {
    title: 'The signed DAMAGE slip',
    desc: 'A feast clerk\'s slip stamped DAMAGE in smudged red, flour paste drying on its corner, and on the line where the cause should go, the porter\'s own signature pressed hard into the paper; spoiled sacks behind.',
    glow: { glowX: 300, glowY: 200, warm: 0.5 },
    body: `
    <path d="M60 330q30-60 70-60t70 60z" fill="#e8d9b4" fill-opacity="0.08" stroke-opacity="0.35"/>
    <path d="M420 330q30-70 75-70t70 70z" fill="#e8d9b4" fill-opacity="0.08" stroke-opacity="0.35"/>
    <g transform="rotate(-6 300 210)">
      <rect x="170" y="110" width="260" height="190" fill="#e8d9b4" fill-opacity="0.14"/>
      <rect x="170" y="110" width="260" height="190"/>
      <text x="300" y="168" fill="#c8483c" fill-opacity="0.85" stroke="none" font-family="ui-monospace, monospace" font-weight="700" font-size="34" letter-spacing="6" text-anchor="middle">DAMAGE</text>
      <rect x="196" y="134" width="208" height="46" stroke="#c8483c" stroke-opacity="0.6" stroke-width="2.4"/>
      <path d="M196 214H404" stroke-opacity="0.35" stroke-width="1.2"/>
      <path d="M196 254H404" stroke-opacity="0.6" stroke-width="1.2"/>
      <path d="M206 250c14-20 22 4 34-10s16 10 28-4 14 12 26-2 20 6 40-4" stroke="${AMBER}" stroke-width="2.2"/>
      <path d="M400 112q22 6 28 26" fill="#e8d9b4" fill-opacity="0.35" stroke="${INK}" stroke-opacity="0.4"/>
    </g>`
  },
  'relit-torch': {
    // v2: the ant drawn near enough to read at card width (v1 was a speck), with its six legs, its feelers and the
    // torch held up in one foreleg; the street ruled straight to it, and the arm's warm tip a spark short of the pith.
    v: 2,
    title: 'The relit torch',
    desc: 'A ruled ant-street running dead straight across frosted loam to one ant holding up a tiny torch, lit again from the warm tip of a long drawn line that ends a little early.',
    glow: { glowX: 450, glowY: 200, warm: 0.72 },
    body: `
    ${Array.from({ length: 22 }, (_, i) => `<path d="M${30 + i * 26} ${318 + (i % 3) * 16}l12 -4" stroke="${INK}" stroke-opacity="0.2" stroke-width="1.2"/>`).join('')}
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${40 + ((i * 97) % 520)}" cy="${300 + ((i * 53) % 80)}" r="1.4" fill="${INK}" fill-opacity="0.35" stroke="none"/>`).join('')}
    <path d="M30 252L380 244M30 292L380 270" stroke-width="2" stroke-opacity="0.8"/>
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${52 + i * 30} ${290 - i * 2}L${52 + i * 30} ${251 - i * 0.7}" stroke-opacity="0.28" stroke-width="1.1"/>`).join('')}
    <g fill="${INK}" fill-opacity="0.92" stroke="none">
      <ellipse cx="398" cy="258" rx="20" ry="13" transform="rotate(-8 398 258)"/>
      <ellipse cx="426" cy="251" rx="10" ry="7.5"/>
      <circle cx="446" cy="244" r="9"/>
    </g>
    <circle cx="449" cy="241" r="1.8" fill="#15221c" stroke="none"/>
    <path d="M418 256l-12 16l-8 2M426 258l-2 18l-7 5M433 256l12 14l8 1" stroke-width="2.4"/>
    <path d="M420 253l-16 10l-8 0M428 255l4 15" stroke-width="2" stroke-opacity="0.55"/>
    <path d="M451 236q6 -12 16 -13M446 235q1 -13 9 -19" stroke-width="1.8"/>
    <path d="M434 247l10 -20l6 -6" stroke-width="2.4"/>
    <path d="M447 224L456 196" stroke="#c99a5a" stroke-width="3.4"/>
    <circle cx="458" cy="188" r="15" fill="${AMBER}" stroke="none" filter="url(#relit-torch-soft)" opacity="0.85"/>
    <path d="M458 196q-8 -8 0 -20q8 12 0 20z" fill="${AMBER}" stroke="none"/>
    <circle cx="458" cy="190" r="3.4" fill="#fff4d6" stroke="none"/>
    <path d="M60 104L440 180" stroke-width="2.8"/>
    <circle cx="441" cy="180" r="3.6" fill="${AMBER}" stroke="none"/>
    <path d="M445 182l5 2M447 177l4 -1" stroke="${AMBER}" stroke-width="1.4" stroke-opacity="0.8"/>`
  },
  'criers-note': {
    title: 'The crier\'s note',
    desc: 'A crier\'s pad with one line written on it — a hat — under the brass bell of her cart, mid-swing, and far off above the field the faint shape of a bowler at a person\'s height, touching nothing.',
    glow: { glowX: 260, glowY: 230, warm: 0.5 },
    body: `
    <path d="M360 60q30 0 34 34l8 40h-84l8-40q4-34 34-34z" fill="${AMBER}" fill-opacity="0.22"/>
    <path d="M360 60q30 0 34 34l8 40h-84l8-40q4-34 34-34z"/>
    <circle cx="360" cy="142" r="6" fill="${AMBER}" stroke="none"/>
    <path d="M300 70q-10 14-6 30M420 70q10 14 6 30" stroke-opacity="0.4" stroke-width="1.4"/>
    <path d="M360 44v16" />
    <g opacity="0.45"><path d="M492 120h40M498 120q0-22 14-22t14 22" stroke-width="1.8"/></g>
    <rect x="150" y="180" width="220" height="170" rx="6" fill="#e8d9b4" fill-opacity="0.12"/>
    <rect x="150" y="180" width="220" height="170" rx="6"/>
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="${172 + i * 22}" cy="180" r="5"/>`).join('')}
    ${[230, 262, 294, 326].map((y) => `<path d="M168 ${y}H352" stroke-opacity="0.22" stroke-width="1.2"/>`).join('')}
    <text x="176" y="224" fill="${AMBER}" stroke="none" font-family="Georgia, serif" font-style="italic" font-size="26">a hat.</text>`
  },
  'bridge-receipts': {
    title: 'Two receipts on the rail',
    desc: 'Two paper slips pinned side by side with worn brass pins on the confluence bridge rail, the river below split down its seam, berry-dark on one side and chalk-pale on the other.',
    glow: { glowX: 300, glowY: 170, warm: 0.45 },
    body: `
    <rect x="0" y="270" width="300" height="130" fill="#3a1f33" stroke="none" opacity="0.7"/>
    <rect x="300" y="270" width="300" height="130" fill="#cfcab8" stroke="none" opacity="0.18"/>
    <path d="M300 270v130" stroke="${INK}" stroke-opacity="0.45" stroke-dasharray="4 6"/>
    ${[290, 320, 350].map((y) => `<path d="M20 ${y}q40-8 80 0t80 0 80 0M330 ${y}q40-6 80 0t80 0" stroke="${TEAL}" stroke-opacity="0.3" stroke-width="1.2"/>`).join('')}
    <path d="M30 150H570M30 166H570" stroke-width="2.4"/>
    ${[60, 200, 400, 540].map((x) => `<path d="M${x} 166V262" stroke-width="2.2"/>`).join('')}
    <path d="M30 262H570" stroke-opacity="0.6"/>
    <g transform="rotate(-3 240 196)"><rect x="200" y="160" width="84" height="104" fill="#e8d9b4" fill-opacity="0.2"/><rect x="200" y="160" width="84" height="104"/>
      ${[186, 202, 218, 234].map((y) => `<path d="M212 ${y}h60" stroke-opacity="0.45" stroke-width="1.2"/>`).join('')}</g>
    <g transform="rotate(4 360 196)"><rect x="318" y="160" width="84" height="104" fill="#e8d9b4" fill-opacity="0.2"/><rect x="318" y="160" width="84" height="104"/>
      ${[186, 202, 218, 234].map((y) => `<path d="M330 ${y}h60" stroke-opacity="0.45" stroke-width="1.2"/>`).join('')}</g>
    <circle cx="242" cy="158" r="5" fill="${AMBER}" stroke="none"/><circle cx="360" cy="158" r="5" fill="${AMBER}" stroke="none"/>`
  },
  'stacked-plate': {
    title: 'A plate from the stack',
    desc: 'A stack of plates by a bowl of cold spring water, taller than any meal could have been and leaning a little, one berry smear on the topmost rim, a dish-cloth nobody is holding; starlight from an opening above.',
    glow: { glowX: 300, glowY: 140, warm: 0.4 },
    body: `
    ${[[-60, 0.12], [-20, 0.18], [20, 0.18], [60, 0.12]].map(([dx, o]) => `<path d="M300 -10L${300 + dx * 2.4} 380" stroke="${INK}" stroke-opacity="${o}" stroke-width="1"/>`).join('')}
    ${Array.from({ length: 11 }, (_, i) => `<ellipse cx="${262 + i * 1.6}" cy="${330 - i * 17}" rx="78" ry="16" fill="#15221c" fill-opacity="0.9"/>`).join('')}
    <ellipse cx="278" cy="160" rx="78" ry="16" fill="#e8d9b4" fill-opacity="0.12"/>
    <ellipse cx="278" cy="160" rx="54" ry="10" stroke-opacity="0.45"/>
    <path d="M318 154q12 2 18 8" stroke="${BERRY}" stroke-width="5" stroke-opacity="0.8"/>
    <ellipse cx="470" cy="318" rx="70" ry="22"/>
    <ellipse cx="470" cy="312" rx="56" ry="14" fill="${TEAL}" fill-opacity="0.18" stroke="${TEAL}" stroke-opacity="0.5"/>
    <path d="M440 312q30 6 60 0" stroke="${INK}" stroke-opacity="0.35" stroke-width="1.2"/>
    <path d="M110 250q20 30 6 70q24-6 34 10" stroke-opacity="0.6"/>`
  },
  'found-line': {
    title: 'A found line',
    desc: 'Cobbles under low raking light, and painted across them five words in a line, kept from the road one at a time: one boxed in ink where a hop landed on it, one with a berry stain where a slice came down, one underlined in gold where it was walked.',
    glow: { glowX: 300, glowY: 230, warm: 0.5 },
    body: `
    ${Array.from({ length: 6 }, (_, row) => Array.from({ length: 9 }, (_, col) => {
      const y = 150 + row * 40;
      const w = 54 + row * 6;
      const x = 300 + (col - 4) * w - (row % 2 ? w / 2 : 0);
      return `<rect x="${(x - w / 2 + 3).toFixed(1)}" y="${y}" width="${w - 6}" height="34" rx="9" stroke="${INK}" stroke-opacity="${0.12 + row * 0.03}" stroke-width="1.2"/>`;
    }).join('')).join('')}
    ${[[150, 236, 54], [222, 232, 70], [312, 230, 62], [396, 232, 50], [462, 236, 40]].map(([x, y, w], i) => `<rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="18" rx="4" fill="${AMBER}" fill-opacity="${i === 3 ? 0.45 : 0.85}" stroke="none"/>`).join('')}
    <rect x="${222 - 41}" y="${232 - 17}" width="82" height="34" stroke="${INK}" stroke-width="2"/>
    <circle cx="${312 + 40}" cy="${230 - 12}" r="6" fill="${BERRY}" stroke="none"/>
    <path d="M${150 - 27} 250H${150 + 27}" stroke="${AMBER}" stroke-width="2.4"/>`
  },
  'struck-price-tag': {
    title: 'A struck price tag',
    desc: 'A paper price tag turning on a knotted string, the lanes dark behind it: a 3, a 2 and a 1, each struck through harder than the last, and under them a coin drawn with an arrow pointing away; a real coin set down by it, and a ring stain on one corner.',
    glow: { glowX: 310, glowY: 200, warm: 0.55 },
    body: `
    <path d="M237 210Q200 110 150 30" stroke-opacity="0.7" stroke-width="1.6"/>
    <path d="M231 212q6 5 12 0q-6 -7 -12 0" stroke-opacity="0.7" stroke-width="1.6"/>
    <g transform="rotate(-8 320 205)">
      <path d="M196 205L240 152H436V258H240Z" fill="#e8d9b4" fill-opacity="0.2"/>
      <path d="M196 205L240 152H436V258H240Z"/>
      <circle cx="236" cy="205" r="8"/>
      <path d="M262 174q16 -10 26 2q6 10 -9 17q18 4 9 19q-9 11 -28 1" stroke-width="4"/>
      <path d="M318 180q12 -14 24 -2q6 10 -22 36h28" stroke-width="4"/>
      <path d="M378 184l12 -10v46" stroke-width="4"/>
      <path d="M254 218L298 170" stroke="${BERRY}" stroke-width="3" stroke-opacity="0.75"/>
      <path d="M312 220L356 168" stroke="${BERRY}" stroke-width="4" stroke-opacity="0.85"/>
      <path d="M368 222L410 166" stroke="${BERRY}" stroke-width="5.5" stroke-opacity="0.95"/>
      <circle cx="330" cy="240" r="7" stroke="${AMBER}" stroke-width="2"/>
      <path d="M342 240h30m-8 -6l8 6l-8 6" stroke="${AMBER}" stroke-width="2"/>
      <circle cx="414" cy="244" r="10" stroke-opacity="0.3" stroke-width="1.4"/>
    </g>
    <circle cx="470" cy="318" r="22" fill="${AMBER}" fill-opacity="0.25" stroke="${AMBER}" stroke-opacity="0.8"/>
    <circle cx="470" cy="318" r="14" stroke="${AMBER}" stroke-opacity="0.5" stroke-width="1.2"/>
    <ellipse cx="130" cy="326" rx="48" ry="16" stroke-opacity="0.25" stroke-width="1.4"/>
    <ellipse cx="130" cy="326" rx="15" ry="5" stroke-opacity="0.25" stroke-width="1.2"/>`
  },
  'pressed-rose': {
    title: 'A pressed rose',
    desc: 'A page of small print seen from above, its last lines finer than the rest, and a dark rose pressed flat across them: the petals gone the colour of old wine, one thorn still on the stem, the first word of the clause showing under a petal, a crease where the page was shut on it.',
    glow: { glowX: 320, glowY: 270, warm: 0.45 },
    body: `
    <rect x="172" y="64" width="256" height="296" rx="3" fill="#e8d9b4" fill-opacity="0.14"/>
    <rect x="172" y="64" width="256" height="296" rx="3"/>
    <path d="M300 70V354" stroke-opacity="0.18" stroke-width="1.2"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M192 ${96 + i * 13}H${404 - ((i * 37) % 60)}" stroke-opacity="0.32" stroke-width="1.2"/>`).join('')}
    ${Array.from({ length: 6 }, (_, i) => `<path d="M192 ${290 + i * 9}H${404 - ((i * 23) % 40)}" stroke-opacity="0.26" stroke-width="0.8"/>`).join('')}
    <path d="M192 344h34" stroke="${AMBER}" stroke-opacity="0.8" stroke-width="1.6"/>
    <path d="M330 300Q270 322 214 334" stroke-opacity="0.75" stroke-width="2.4"/>
    <path d="M262 318l-6 -9l11 4" stroke-opacity="0.75" stroke-width="1.6"/>
    <path d="M286 312q-18 -24 -40 -16q16 18 40 16Z" fill="${TEAL}" fill-opacity="0.35" stroke="${TEAL}" stroke-opacity="0.6" stroke-width="1.4"/>
    <path d="M240 330q-6 22 -28 24q8 -20 28 -24Z" fill="${TEAL}" fill-opacity="0.3" stroke="${TEAL}" stroke-opacity="0.55" stroke-width="1.4"/>
    ${[[0, 34, 20], [60, 30, 18], [120, 33, 19], [180, 31, 20], [240, 34, 18], [300, 30, 19]].map(([a, rx, ry]) => `<ellipse cx="342" cy="294" rx="${rx}" ry="${ry}" transform="rotate(${a} 342 294) translate(14 0)" fill="#6e2a3e" fill-opacity="0.75" stroke="${BERRY}" stroke-opacity="0.7" stroke-width="1.2"/>`).join('')}
    <path d="M342 294m-4 0a4 4 0 1 1 8 0a8 8 0 1 1 -16 0a12 12 0 1 1 24 0" stroke="#3a1420" stroke-opacity="0.7" stroke-width="1.6"/>`
  }
};

await mkdir(OUT, { recursive: true });
for (const [id, s] of Object.entries(STUDIES)) {
  const file = resolve(OUT, `artifact-${id}-v${s.v || 1}.svg`);
  await writeFile(file, svg(id, s.title, s.desc, s.body, s.glow));
  console.log(`[assets:studies] ${file.replace(`${ROOT}/`, '')}`);
}
