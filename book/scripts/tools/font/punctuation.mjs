/**
 * Punctuation, brace, and digit glyphs for the LoreLand Display typeface.
 *
 * Braces are central to the Spw language — they are "primordial semantic
 * constructs, not punctuation." Their glyph forms reflect this: angular,
 * deliberate shapes that accumulate and discharge charge.
 */

import { CAP_HEIGHT, STROKE, SIGIL_STROKE } from './metrics.mjs';
import { vbar, hbar, octagon, diamond } from './primitives.mjs';

// ─── Punctuation ────────────────────────────────────────────────

export function glyphPeriod(path) {
    diamond(path, 300, 50, 50);
}

export function glyphComma(path) {
    const s = SIGIL_STROKE;
    diamond(path, 300, 50, 45);
    path.moveTo(300, 5);
    path.lineTo(300 + s / 2, 5);
    path.lineTo(260, -60);
    path.lineTo(260 - s / 2, -60);
    path.close();
}

export function glyphColon(path) {
    diamond(path, 300, CAP_HEIGHT * 0.55, 45);
    diamond(path, 300, 80, 45);
}

export function glyphSemicolon(path) {
    diamond(path, 300, CAP_HEIGHT * 0.55, 45);
    glyphComma(path);
}

export function glyphHyphen(path) {
    hbar(path, 160, CAP_HEIGHT * 0.42, 280, SIGIL_STROKE);
}

export function glyphEnDash(path) {
    hbar(path, 120, CAP_HEIGHT * 0.42, 360, SIGIL_STROKE);
}

export function glyphEmDash(path) {
    hbar(path, 80, CAP_HEIGHT * 0.42, 440, SIGIL_STROKE);
}

export function glyphSlash(path) {
    const s = SIGIL_STROKE;
    path.moveTo(420, CAP_HEIGHT);
    path.lineTo(420 + s, CAP_HEIGHT);
    path.lineTo(180 + s, 0);
    path.lineTo(180, 0);
    path.close();
}

export function glyphQuoteSingle(path) {
    const s = SIGIL_STROKE;
    vbar(path, 300 - s / 2, CAP_HEIGHT * 0.6, CAP_HEIGHT * 0.4, s);
}

export function glyphQuoteDouble(path) {
    const s = SIGIL_STROKE;
    vbar(path, 240 - s / 2, CAP_HEIGHT * 0.6, CAP_HEIGHT * 0.4, s);
    vbar(path, 360 - s / 2, CAP_HEIGHT * 0.6, CAP_HEIGHT * 0.4, s);
}

// ─── Braces (primordial semantic constructs) ────────────────────

export function glyphBraceOpen(path) {
    const s = SIGIL_STROKE;
    vbar(path, 240, s, CAP_HEIGHT - s * 2, s);
    hbar(path, 240, CAP_HEIGHT - s, 200, s);
    hbar(path, 240, 0, 200, s);
}

export function glyphBraceClose(path) {
    const s = SIGIL_STROKE;
    vbar(path, 360 - s, s, CAP_HEIGHT - s * 2, s);
    hbar(path, 160, CAP_HEIGHT - s, 200, s);
    hbar(path, 160, 0, 200, s);
}

export function glyphBracketOpen(path) {
    const s = SIGIL_STROKE;
    vbar(path, 220, 0, CAP_HEIGHT, s);
    hbar(path, 220, CAP_HEIGHT - s, 180, s);
    hbar(path, 220, 0, 180, s);
}

export function glyphBracketClose(path) {
    const s = SIGIL_STROKE;
    vbar(path, 380 - s, 0, CAP_HEIGHT, s);
    hbar(path, 200, CAP_HEIGHT - s, 180, s);
    hbar(path, 200, 0, 180, s);
}

export function glyphParenOpen(path) {
    const s = SIGIL_STROKE;
    path.moveTo(360, CAP_HEIGHT);
    path.lineTo(220, CAP_HEIGHT * 0.5);
    path.lineTo(360, 0);
    path.lineTo(360, s);
    path.lineTo(220 + s * 1.5, CAP_HEIGHT * 0.5);
    path.lineTo(360, CAP_HEIGHT - s);
    path.close();
}

export function glyphParenClose(path) {
    const s = SIGIL_STROKE;
    path.moveTo(240, CAP_HEIGHT);
    path.lineTo(380, CAP_HEIGHT * 0.5);
    path.lineTo(240, 0);
    path.lineTo(240, s);
    path.lineTo(380 - s * 1.5, CAP_HEIGHT * 0.5);
    path.lineTo(240, CAP_HEIGHT - s);
    path.close();
}

export function glyphAngleOpen(path) {
    const s = SIGIL_STROKE;
    path.moveTo(420, CAP_HEIGHT);
    path.lineTo(180, CAP_HEIGHT * 0.5);
    path.lineTo(420, 0);
    path.lineTo(420, s);
    path.lineTo(180 + s * 2, CAP_HEIGHT * 0.5);
    path.lineTo(420, CAP_HEIGHT - s);
    path.close();
}

export function glyphAngleClose(path) {
    const s = SIGIL_STROKE;
    path.moveTo(180, CAP_HEIGHT);
    path.lineTo(420, CAP_HEIGHT * 0.5);
    path.lineTo(180, 0);
    path.lineTo(180, s);
    path.lineTo(420 - s * 2, CAP_HEIGHT * 0.5);
    path.lineTo(180, CAP_HEIGHT - s);
    path.close();
}

// ─── Digits ─────────────────────────────────────────────────────

export function digit0(p) { octagon(p, 300, CAP_HEIGHT / 2, 240); }

export function digit1(p) {
    vbar(p, 270, 0, CAP_HEIGHT);
    hbar(p, 200, 0, 200);
}

export function digit2(p) {
    const s = STROKE;
    hbar(p, 100, CAP_HEIGHT - s, 400);
    vbar(p, 500 - s, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, CAP_HEIGHT * 0.5, 400);
    vbar(p, 100, s, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, 0, 400);
}

export function digit3(p) {
    const s = STROKE;
    hbar(p, 100, CAP_HEIGHT - s, 400);
    vbar(p, 500 - s, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    hbar(p, 200, CAP_HEIGHT * 0.5, 300);
    vbar(p, 500 - s, s, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, 0, 400);
}

export function digit4(p) {
    vbar(p, 100, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5);
    hbar(p, 100, CAP_HEIGHT * 0.5, 400);
    vbar(p, 400, 0, CAP_HEIGHT);
}

export function digit5(p) {
    const s = STROKE;
    hbar(p, 100, CAP_HEIGHT - s, 400);
    vbar(p, 100, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, CAP_HEIGHT * 0.5, 400);
    vbar(p, 500 - s, s, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, 0, 400);
}

export function digit6(p) {
    const s = STROKE;
    hbar(p, 100, CAP_HEIGHT - s, 400);
    vbar(p, 100, 0, CAP_HEIGHT);
    hbar(p, 100, CAP_HEIGHT * 0.5, 400);
    vbar(p, 500 - s, s, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, 0, 400);
}

export function digit7(p) {
    const s = STROKE;
    hbar(p, 100, CAP_HEIGHT - s, 400);
    vbar(p, 500 - s, 0, CAP_HEIGHT);
}

export function digit8(p) {
    octagon(p, 300, CAP_HEIGHT * 0.72, 160);
    octagon(p, 300, CAP_HEIGHT * 0.28, 160);
}

export function digit9(p) {
    const s = STROKE;
    hbar(p, 100, CAP_HEIGHT - s, 400);
    vbar(p, 100, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    hbar(p, 100, CAP_HEIGHT * 0.5, 400);
    vbar(p, 500 - s, 0, CAP_HEIGHT);
    hbar(p, 100, 0, 400);
}

export const DIGITS = Object.freeze({
    '0': digit0, '1': digit1, '2': digit2, '3': digit3, '4': digit4,
    '5': digit5, '6': digit6, '7': digit7, '8': digit8, '9': digit9
});
