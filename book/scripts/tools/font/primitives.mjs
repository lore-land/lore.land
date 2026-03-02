/**
 * Primitive shape builders for the LoreLand Display typeface.
 *
 * These are the geometric vocabulary from which every glyph is
 * constructed: bars, rectangles, octagons, and diamonds. The
 * angular, constructed aesthetic makes letters feel like Spw
 * structures — built, not drawn.
 */

import opentype from 'opentype.js';
import { STROKE } from './metrics.mjs';

export function makePath() {
    return new opentype.Path();
}

/** Filled rectangle */
export function rect(path, x, y, w, h) {
    path.moveTo(x, y);
    path.lineTo(x + w, y);
    path.lineTo(x + w, y + h);
    path.lineTo(x, y + h);
    path.close();
}

/** Vertical bar (column) */
export function vbar(path, x, y, height, width = STROKE) {
    rect(path, x, y, width, height);
}

/** Horizontal bar (beam) */
export function hbar(path, x, y, barWidth, height = STROKE) {
    rect(path, x, y, barWidth, height);
}

/**
 * Approximate circle as octagon — geometric, not organic.
 * Inner cutout creates a stroked ring.
 */
export function octagon(path, cx, cy, r, sw = STROKE) {
    const inner = r - sw;
    const k = 0.414; // tan(π/8)

    // outer (clockwise)
    path.moveTo(cx - r * k, cy + r);
    path.lineTo(cx + r * k, cy + r);
    path.lineTo(cx + r, cy + r * k);
    path.lineTo(cx + r, cy - r * k);
    path.lineTo(cx + r * k, cy - r);
    path.lineTo(cx - r * k, cy - r);
    path.lineTo(cx - r, cy - r * k);
    path.lineTo(cx - r, cy + r * k);
    path.close();

    // inner (counter-clockwise cutout)
    if (inner > 0) {
        path.moveTo(cx - inner * k, cy + inner);
        path.lineTo(cx - inner, cy + inner * k);
        path.lineTo(cx - inner, cy - inner * k);
        path.lineTo(cx - inner * k, cy - inner);
        path.lineTo(cx + inner * k, cy - inner);
        path.lineTo(cx + inner, cy - inner * k);
        path.lineTo(cx + inner, cy + inner * k);
        path.lineTo(cx + inner * k, cy + inner);
        path.close();
    }
}

/** Diamond (rotated square) — the atomic shape of Spw sigils */
export function diamond(path, cx, cy, r) {
    path.moveTo(cx, cy + r);
    path.lineTo(cx + r, cy);
    path.lineTo(cx, cy - r);
    path.lineTo(cx - r, cy);
    path.close();
}

/**
 * Creates a smallcap variant of an uppercase glyph function
 * by scaling all path coordinates.
 */
export function makeSmallcap(uppercaseFn, scale = 0.72) {
    return function (path) {
        const temp = makePath();
        uppercaseFn(temp);
        for (const cmd of temp.commands) {
            const scaled = { type: cmd.type };
            if (cmd.x !== undefined) scaled.x = cmd.x * scale;
            if (cmd.y !== undefined) scaled.y = cmd.y * scale;
            if (cmd.x1 !== undefined) scaled.x1 = cmd.x1 * scale;
            if (cmd.y1 !== undefined) scaled.y1 = cmd.y1 * scale;
            if (cmd.x2 !== undefined) scaled.x2 = cmd.x2 * scale;
            if (cmd.y2 !== undefined) scaled.y2 = cmd.y2 * scale;
            path.commands.push(scaled);
        }
    };
}
