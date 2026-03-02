/**
 * Glyph registry — maps every character to its builder function,
 * discovery tier, and advance width.
 *
 * This is the master manifest that connects the narrative arc (tiers)
 * to the visual construction (glyph builders). The build script
 * reads this registry to assemble the font.
 */

import { ADVANCE, SMALLCAP_SCALE } from './metrics.mjs';
import { makeSmallcap } from './primitives.mjs';
import { UPPERCASE } from './uppercase.mjs';
import {
    DIGITS,
    glyphPeriod, glyphComma, glyphColon, glyphSemicolon,
    glyphHyphen, glyphEnDash, glyphEmDash, glyphSlash,
    glyphQuoteSingle, glyphQuoteDouble,
    glyphBraceOpen, glyphBraceClose,
    glyphBracketOpen, glyphBracketClose,
    glyphParenOpen, glyphParenClose,
    glyphAngleOpen, glyphAngleClose
} from './punctuation.mjs';
import {
    glyphBang, glyphQuestion, glyphTilde, glyphAt,
    glyphAmpersand, glyphAsterisk, glyphCaret,
    glyphHash, glyphEquals, glyphPercent, glyphDollar
} from './sigils.mjs';

const W = ADVANCE;
const SC = W * SMALLCAP_SCALE;

/**
 * Registry entries: [char, builder, tier, advanceWidth]
 * Ordered by tier for narrative clarity.
 */
const entries = [];

// ── Tier 0: whisper ─────────────────────────────────────────────
// Boof can only whisper — vowels, space, period
for (const c of 'aeiou') {
    entries.push([c, makeSmallcap(UPPERCASE[c.toUpperCase()]), 0, SC]);
}
entries.push([' ', () => { }, 0, 300]);   // space — silence
entries.push(['.', glyphPeriod, 0, 300]); // the ground sigil, always present

// ── Tier 1: speak ───────────────────────────────────────────────
// Boof finds their voice — consonants arrive
for (const c of 'bcdfghjklmnpqrstvwxyz') {
    entries.push([c, makeSmallcap(UPPERCASE[c.toUpperCase()]), 1, SC]);
}

// ── Tier 2: shape ───────────────────────────────────────────────
// The world takes shape — uppercase letters and digits
for (const [c, fn] of Object.entries(UPPERCASE)) {
    entries.push([c, fn, 2, W]);
}
for (const [d, fn] of Object.entries(DIGITS)) {
    entries.push([d, fn, 2, W]);
}

// ── Tier 3: structure ───────────────────────────────────────────
// Structure emerges — punctuation and semantic braces
const tier3 = [
    ['{', glyphBraceOpen, W],
    ['}', glyphBraceClose, W],
    ['[', glyphBracketOpen, W],
    [']', glyphBracketClose, W],
    ['(', glyphParenOpen, W],
    [')', glyphParenClose, W],
    ['<', glyphAngleOpen, W],
    ['>', glyphAngleClose, W],
    [':', glyphColon, 300],
    [';', glyphSemicolon, 300],
    [',', glyphComma, 300],
    ["'", glyphQuoteSingle, 240],
    ['"', glyphQuoteDouble, 400],
    ['-', glyphHyphen, 400],
    ['\u2013', glyphEnDash, 500],  // –
    ['\u2014', glyphEmDash, 560],  // —
    ['/', glyphSlash, W],
];
for (const [c, fn, aw] of tier3) {
    entries.push([c, fn, 3, aw]);
}

// ── Tier 4: awakening ───────────────────────────────────────────
// Core Spw operators awaken — the system reveals itself
const tier4 = [
    ['!', glyphBang, 300],
    ['?', glyphQuestion, W],
    ['~', glyphTilde, W],
    ['@', glyphAt, W],
    ['&', glyphAmpersand, W],
    ['*', glyphAsterisk, W],
    ['^', glyphCaret, W],
];
for (const [c, fn, aw] of tier4) {
    entries.push([c, fn, 4, aw]);
}

// ── Tier 5: mastery ─────────────────────────────────────────────
// Meta-sigils — full mastery, reflections complete
const tier5 = [
    ['#', glyphHash, W],
    ['=', glyphEquals, W],
    ['%', glyphPercent, W],
    ['$', glyphDollar, W],
];
for (const [c, fn, aw] of tier5) {
    entries.push([c, fn, 5, aw]);
}

/** @type {Map<string, { builder: Function, tier: number, advanceWidth: number }>} */
export const REGISTRY = new Map(
    entries.map(([char, builder, tier, advanceWidth]) => [
        char,
        { builder, tier, advanceWidth }
    ])
);
