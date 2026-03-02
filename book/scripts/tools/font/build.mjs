#!/usr/bin/env node
/**
 * build.mjs — Assembles and writes the LoreLand Display font.
 *
 * Usage:
 *   node book/scripts/tools/font/build.mjs
 *
 * Output:
 *   book/fonts/LoreLand-Display.otf
 *   book/fonts/glyph-tiers.json
 */

import opentype from 'opentype.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { UNITS_PER_EM, ASCENDER, DESCENDER, CAP_HEIGHT, ADVANCE, STROKE } from './metrics.mjs';
import { makePath, rect } from './primitives.mjs';
import { TIERS } from './tiers.mjs';
import { REGISTRY } from './registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../../fonts');
const FONT_PATH = join(OUTPUT_DIR, 'LoreLand-Display.otf');
const TIERS_PATH = join(OUTPUT_DIR, 'glyph-tiers.json');

// ─── .notdef glyph (required) ───────────────────────────────────

function buildNotdef() {
    const path = makePath();
    rect(path, 80, 0, 440, CAP_HEIGHT);
    rect(path, 80 + STROKE, STROKE, 440 - STROKE * 2, CAP_HEIGHT - STROKE * 2);
    return new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        advanceWidth: ADVANCE,
        path
    });
}

// ─── Name a glyph from its character ────────────────────────────

function glyphName(char) {
    if (char === ' ') return 'space';
    if (char === '.') return 'period';
    if (char === ',') return 'comma';
    const code = char.codePointAt(0);
    return `uni${code.toString(16).toUpperCase().padStart(4, '0')}`;
}

// ─── Assemble the font ─────────────────────────────────────────

function build() {
    console.log('Generating LoreLand Display font…\n');

    const glyphs = [buildNotdef()];
    const tierManifest = {};

    for (const [char, entry] of REGISTRY) {
        const path = makePath();
        entry.builder(path);

        glyphs.push(new opentype.Glyph({
            name: glyphName(char),
            unicode: char.codePointAt(0),
            advanceWidth: entry.advanceWidth,
            path
        }));

        // Accumulate tier manifest for runtime
        if (!tierManifest[entry.tier]) {
            const tierInfo = TIERS[entry.tier] || { name: 'unknown', description: '' };
            tierManifest[entry.tier] = {
                name: tierInfo.name,
                description: tierInfo.description,
                chapters: tierInfo.chapters || [],
                chars: []
            };
        }
        tierManifest[entry.tier].chars.push(char);
    }

    const font = new opentype.Font({
        familyName: 'LoreLand',
        styleName: 'Display',
        unitsPerEm: UNITS_PER_EM,
        ascender: ASCENDER,
        descender: DESCENDER,
        glyphs
    });

    // ─── Write files ────────────────────────────────────────────

    mkdirSync(OUTPUT_DIR, { recursive: true });
    font.download(FONT_PATH);
    writeFileSync(TIERS_PATH, JSON.stringify(tierManifest, null, 2));

    // ─── Report ─────────────────────────────────────────────────

    console.log(`  → ${FONT_PATH}`);
    console.log(`  → ${TIERS_PATH}\n`);
    console.log('Glyph tiers (discovery arc):\n');

    for (const [tier, info] of Object.entries(tierManifest).sort((a, b) => a[0] - b[0])) {
        const display = info.chars.map(c => c === ' ' ? '⎵' : c).join('  ');
        console.log(`  Tier ${tier} — "${info.name}" (${info.description})`);
        console.log(`    ${display}\n`);
    }

    console.log(`Total glyphs: ${glyphs.length}`);
    console.log('Done. The font is ready for the story.\n');
}

build();
