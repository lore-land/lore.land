/**
 * Spw sigil glyphs for the LoreLand Display typeface.
 *
 * These are the heart of the font — each of the 12 Spw operators
 * gets a distinctive, memorable glyph that carries its semantic weight.
 * They are discovered in Tiers 4 and 5, the climax and resolution
 * of Boof's journey.
 *
 * Tier 4 (awakening): ! ? ~ @ & * ^
 * Tier 5 (mastery):   # = % $
 *
 * The period (.) is available from Tier 0 as punctuation,
 * but its identity as the "ground" sigil deepens with context.
 */

import { CAP_HEIGHT, X_HEIGHT, STROKE, SIGIL_STROKE } from './metrics.mjs';
import { vbar, hbar, octagon, diamond } from './primitives.mjs';
import { glyphS } from './uppercase.mjs';

/** ! action — sharp downward strike with diamond dot */
export function glyphBang(path) {
    const s = SIGIL_STROKE;
    const cx = 300;
    vbar(path, cx - s / 2, 160, CAP_HEIGHT - 160, s);
    diamond(path, cx, 50, 44);
}

/** ? probe — angular hook descending into a diamond */
export function glyphQuestion(path) {
    const s = SIGIL_STROKE;
    hbar(path, 140, CAP_HEIGHT - s, 320, s);
    vbar(path, 460 - s, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s, s);
    hbar(path, 240, CAP_HEIGHT * 0.5, 220, s);
    vbar(path, 240, 160, CAP_HEIGHT * 0.5 - 160, s);
    diamond(path, 270, 50, 40);
}

/** ~ potential — wave form, deference and superposition */
export function glyphTilde(path) {
    const s = SIGIL_STROKE;
    const y = X_HEIGHT * 0.7;
    path.moveTo(100, y);
    path.lineTo(200, y + 100);
    path.lineTo(300, y - 40);
    path.lineTo(400, y + 100);
    path.lineTo(500, y);
    path.lineTo(500, y + s);
    path.lineTo(400, y + 100 + s);
    path.lineTo(300, y - 40 + s);
    path.lineTo(200, y + 100 + s);
    path.lineTo(100, y + s);
    path.close();
}

/** @ perspective — octagonal frame with inner anchor diamond */
export function glyphAt(path) {
    const s = SIGIL_STROKE;
    octagon(path, 300, CAP_HEIGHT / 2, 280, s);
    diamond(path, 300, CAP_HEIGHT / 2, 60);
}

/** & confluence — two interlocking octagonal loops */
export function glyphAmpersand(path) {
    const s = SIGIL_STROKE;
    octagon(path, 220, CAP_HEIGHT * 0.65, 160, s);
    octagon(path, 380, CAP_HEIGHT * 0.35, 160, s);
}

/** * value — six-pointed radial burst, collapse to concrete */
export function glyphAsterisk(path) {
    const s = SIGIL_STROKE / 2;
    const cx = 300, cy = CAP_HEIGHT * 0.55, r = 200;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r;
        path.moveTo(cx - s * Math.sin(angle), cy - s * Math.cos(angle));
        path.lineTo(cx + dx, cy + dy);
        path.lineTo(cx + s * Math.sin(angle), cy + s * Math.cos(angle));
        path.close();
    }
}

/** ^ integration — upward chevron, bind upward and emit */
export function glyphCaret(path) {
    const s = SIGIL_STROKE;
    path.moveTo(100, CAP_HEIGHT * 0.35);
    path.lineTo(300, CAP_HEIGHT);
    path.lineTo(500, CAP_HEIGHT * 0.35);
    path.lineTo(500 - s, CAP_HEIGHT * 0.35);
    path.lineTo(300, CAP_HEIGHT - s * 1.5);
    path.lineTo(100 + s, CAP_HEIGHT * 0.35);
    path.close();
}

/** # annotation — double cross-hatch, self-reference and resonance */
export function glyphHash(path) {
    const s = SIGIL_STROKE;
    vbar(path, 200, 40, CAP_HEIGHT - 80, s);
    vbar(path, 360, 40, CAP_HEIGHT - 80, s);
    hbar(path, 100, CAP_HEIGHT * 0.6, 400, s);
    hbar(path, 100, CAP_HEIGHT * 0.32, 400, s);
}

/** = config — parallel bars, constrain and bias */
export function glyphEquals(path) {
    const s = SIGIL_STROKE;
    hbar(path, 100, CAP_HEIGHT * 0.6, 400, s);
    hbar(path, 100, CAP_HEIGHT * 0.35, 400, s);
}

/** % measure — two diamonds with diagonal, quantify and observe */
export function glyphPercent(path) {
    const s = SIGIL_STROKE;
    diamond(path, 180, CAP_HEIGHT * 0.72, 70);
    diamond(path, 420, CAP_HEIGHT * 0.28, 70);
    path.moveTo(440, CAP_HEIGHT);
    path.lineTo(440 + s, CAP_HEIGHT);
    path.lineTo(160 + s, 0);
    path.lineTo(160, 0);
    path.close();
}

/** $ substrate — S with vertical strike-through, introspection */
export function glyphDollar(path) {
    const s = SIGIL_STROKE;
    glyphS(path);
    vbar(path, 300 - s / 2, -40, CAP_HEIGHT + 80, s);
}
