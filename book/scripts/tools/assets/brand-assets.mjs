/**
 * brand-assets.mjs — share cards and app icons from canon, reproducibly.
 *
 *   node book/scripts/tools/assets/brand-assets.mjs            (npm run assets:brand)
 *   node book/scripts/tools/assets/brand-assets.mjs --og       only chapter share cards
 *   node book/scripts/tools/assets/brand-assets.mjs --icons    only PWA icons
 *
 * Chapter cards (book/images/og/chapter-NN.jpg, 1200×630): the chapter's own
 * plate (book/images/NN.png) under a leaf-dark veil, set in the cover type —
 * bud sigil, LORE . LAND, "Chapter One", title, "In which …". Icons
 * (book/pwa/icons/): the bud sigil in cover gold on the cover field, as
 * "any" (192, 512), "maskable" (512, sigil inside the safe zone) and an
 * Apple touch icon (180).
 *
 * Authoring-time tool, not part of `npm run build`: needs ImageMagick
 * (`magick`), `rsvg-convert` and a Georgia face (macOS ships one). Outputs
 * are committed. Re-run after a title, in-which line, plate or sigil changes.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapterOrdinal } from '../../modules/chapter-render.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const CHAPTERS = join(ROOT, 'book/content/chapters');
const REFERENCES = join(ROOT, 'book/content/world/references.json');
const OG_DIR = join(ROOT, 'book/images/og');
const ICON_DIR = join(ROOT, 'book/pwa/icons');

const FIELD = '#2F483A';
const EDGE = '#1F2213';
const GOLD = '#CDAA72';
const GOLD_LIGHT = '#E6C98F';
const INK = '#F3E7CC';
const INK_SOFT = '#D8CAAC';

const FONT_DIR = '/System/Library/Fonts/Supplemental';
const SERIF = join(FONT_DIR, 'Georgia.ttf');
const SERIF_ITALIC = join(FONT_DIR, 'Georgia Italic.ttf');

/** The bud sigil from the v2 cover, as drawn in book/images/covers/bud-sigil.svg. */
const BUD_PATH = 'M15 2 C16.4 5 18.6 7.4 20.2 10.2 C20.6 11 20.8 11.8 21.4 12.3 C22.6 12.8 24.4 13.4 24.8 15.6 C25.2 19 22.4 22.8 19.2 25.4 C17.6 26.7 16.2 27.9 15 29.6 C13.8 27.9 12.4 26.7 10.8 25.4 C7.6 22.8 4.8 19 5.2 15.6 C5.6 13.4 7.4 12.8 8.6 12.3 C9.2 11.8 9.4 11 9.8 10.2 C11.4 7.4 13.6 5 15 2 Z';
const VEIN_PATH = 'M15 29.6 C14.8 26.5 14.9 23.5 15.3 20.5';

function need(bin) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
  } catch {
    throw new Error(`brand-assets needs \`${bin}\` on PATH.`);
  }
}

/**
 * The sigil as an SVG document. `scale` is the sigil's height as a share of
 * the canvas; `stroke` thickens it for small sizes so it survives at 32px.
 */
function sigilSvg({ size, scale, stroke = 0.9, background = true }) {
  const box = 32 / scale;
  const offsetX = (box - 30) / 2;
  const offsetY = (box - 32) / 2;
  const field = background
    ? `<defs><radialGradient id="f" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${FIELD}"/><stop offset="1" stop-color="${EDGE}"/></radialGradient></defs><rect width="${box}" height="${box}" fill="url(#f)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${box} ${box}">${field}`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GOLD}" stop-opacity="0.7"/><stop offset="0.55" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_LIGHT}"/></linearGradient></defs>`
    + `<g transform="translate(${offsetX} ${offsetY})">`
    + `<path d="${BUD_PATH}" fill="rgba(10,20,15,0.25)" stroke="url(#g)" stroke-width="${stroke}" stroke-linejoin="round"/>`
    + `<path d="${VEIN_PATH}" fill="none" stroke="${GOLD}" stroke-width="${stroke * 0.6}" stroke-linecap="round" opacity="0.75"/>`
    + '</g></svg>';
}

function renderSvg(svg, out, work) {
  const src = join(work, `${Math.random().toString(36).slice(2)}.svg`);
  writeFileSync(src, svg);
  execFileSync('rsvg-convert', ['-o', out, src]);
}

function magick(args) {
  execFileSync('magick', args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

function buildIcons(work) {
  mkdirSync(ICON_DIR, { recursive: true });
  // "any": the sigil fills the tile; "maskable": it sits inside the 80% safe
  // circle so every launcher mask keeps it whole.
  renderSvg(sigilSvg({ size: 192, scale: 0.62, stroke: 1.5 }), join(ICON_DIR, 'icon-192.png'), work);
  renderSvg(sigilSvg({ size: 512, scale: 0.62, stroke: 1.2 }), join(ICON_DIR, 'icon-512.png'), work);
  renderSvg(sigilSvg({ size: 512, scale: 0.44, stroke: 1.3 }), join(ICON_DIR, 'icon-maskable-512.png'), work);
  renderSvg(sigilSvg({ size: 180, scale: 0.56, stroke: 1.5 }), join(ICON_DIR, 'apple-touch-icon.png'), work);
  writeFileSync(join(ICON_DIR, 'favicon.svg'), `${sigilSvg({ size: 32, scale: 0.78, stroke: 2.1 })}\n`);
  console.log('icons: icon-192, icon-512, icon-maskable-512, apple-touch-icon, favicon.svg');
}

function buildCards(work) {
  if (!existsSync(SERIF) || !existsSync(SERIF_ITALIC)) {
    throw new Error(`brand-assets needs Georgia at ${FONT_DIR} for chapter cards.`);
  }
  mkdirSync(OG_DIR, { recursive: true });
  const refs = JSON.parse(readFileSync(REFERENCES, 'utf8'));
  const sigil = join(work, 'card-sigil.png');
  renderSvg(sigilSvg({ size: 46, scale: 1, stroke: 1.1, background: false }), sigil, work);

  const files = readdirSync(CHAPTERS).filter((name) => /^\d{2}\.json$/.test(name)).sort();
  for (const name of files) {
    const data = JSON.parse(readFileSync(join(CHAPTERS, name), 'utf8'));
    const slug = name.slice(0, 2);
    const plate = join(ROOT, `book/images/${slug}.png`);
    const inWhich = data.inWhich || refs.inWhich?.[String(data.chapterNumber)] || '';
    const veil = join(work, 'veil.png');
    const text = join(work, `text-${slug}.png`);
    const out = join(OG_DIR, `chapter-${slug}.jpg`);

    // A leaf-dark veil: heavy at the bottom-left where the type sits, open
    // at the top-right so the plate still reads as a painting.
    magick(['-size', '1200x630', 'gradient:rgba(14,22,17,0.05)-rgba(14,22,17,0.94)', '-rotate', '0',
      '(', '-size', '1200x630', 'gradient:rgba(14,22,17,0.55)-rgba(14,22,17,0)', '-rotate', '-90', ')',
      '-compose', 'over', '-composite', veil]);

    const args = ['-size', '1200x630', 'xc:none',
      // wordmark
      '-font', SERIF, '-fill', GOLD, '-pointsize', '17', '-kerning', '7',
      '-annotate', '+64+72', 'LORE . LAND',
      // kicker
      '-pointsize', '19', '-kerning', '6', '-fill', GOLD,
      '-annotate', '+64+410', chapterOrdinal(data.chapterNumber).toUpperCase(),
      // title
      '-font', SERIF, '-fill', INK, '-kerning', '-1', '-pointsize', data.title.length > 22 ? '58' : '66',
      '-annotate', '+62+478', data.title
    ];
    magick([...args, text]);

    const layers = [plate, '-resize', '1200x630^', '-gravity', 'center', '-extent', '1200x630',
      '-modulate', '92,96', veil, '-gravity', 'northwest', '-compose', 'over', '-composite',
      text, '-composite',
      sigil, '-geometry', '+60+326', '-composite'];
    if (inWhich) {
      const caption = join(work, `caption-${slug}.png`);
      magick(['-background', 'none', '-fill', INK_SOFT, '-font', SERIF_ITALIC, '-pointsize', '26',
        '-size', '980x', `caption:In which ${inWhich}.`, caption]);
      layers.push(caption, '-geometry', '+64+508', '-composite');
    }
    magick([...layers, '-strip', '-interlace', 'Plane', '-quality', '93', out]);
    console.log(`card: ${out.replace(`${ROOT}/`, '')}`);
  }
}

need('magick');
need('rsvg-convert');
const work = mkdtempSync(join(tmpdir(), 'lore-brand-'));
try {
  const only = process.argv.slice(2);
  if (!only.length || only.includes('--icons')) buildIcons(work);
  if (!only.length || only.includes('--og')) buildCards(work);
} finally {
  rmSync(work, { recursive: true, force: true });
}
