/**
 * Uppercase letterform glyphs for the LoreLand Display typeface.
 *
 * Each letter is built from the geometric primitives (bars, octagons,
 * diamonds). The style is angular and structural — as if the letters
 * themselves are Spw constructs being assembled from operators and braces.
 *
 * Standard advance width: 600 units.
 */

import { CAP_HEIGHT, STROKE } from './metrics.mjs';
import { vbar, hbar, octagon } from './primitives.mjs';

export function glyphA(path) {
    const s = STROKE;
    path.moveTo(300, CAP_HEIGHT);
    path.lineTo(540, 0);
    path.lineTo(540 - s, 0);
    path.lineTo(300, CAP_HEIGHT - s * 2);
    path.lineTo(60 + s, 0);
    path.lineTo(60, 0);
    path.close();
    hbar(path, 140, CAP_HEIGHT * 0.38, 320);
}

export function glyphB(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT - s, 380);
    hbar(path, 80, CAP_HEIGHT * 0.5, 360);
    hbar(path, 80, 0, 380);
    vbar(path, 460, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    vbar(path, 440, 0 + s, CAP_HEIGHT * 0.5 - s);
}

export function glyphC(path) {
    const s = STROKE;
    vbar(path, 80, s, CAP_HEIGHT - s * 2);
    hbar(path, 80, CAP_HEIGHT - s, 400);
    hbar(path, 80, 0, 400);
}

export function glyphD(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT - s, 340);
    hbar(path, 80, 0, 340);
    vbar(path, 420, s, CAP_HEIGHT - s * 2);
    path.moveTo(420, CAP_HEIGHT - s);
    path.lineTo(420 + s, CAP_HEIGHT - s);
    path.lineTo(420 + s, CAP_HEIGHT - s * 2);
    path.close();
    path.moveTo(420, s);
    path.lineTo(420 + s, s);
    path.lineTo(420 + s, s * 2);
    path.close();
}

export function glyphE(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT - s, 400);
    hbar(path, 80, CAP_HEIGHT * 0.5, 320);
    hbar(path, 80, 0, 400);
}

export function glyphF(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT - s, 400);
    hbar(path, 80, CAP_HEIGHT * 0.5, 320);
}

export function glyphG(path) {
    const s = STROKE;
    vbar(path, 80, s, CAP_HEIGHT - s * 2);
    hbar(path, 80, CAP_HEIGHT - s, 420);
    hbar(path, 80, 0, 420);
    vbar(path, 500 - s, s, CAP_HEIGHT * 0.45);
    hbar(path, 300, CAP_HEIGHT * 0.42, 200 - s);
}

export function glyphH(path) {
    vbar(path, 80, 0, CAP_HEIGHT);
    vbar(path, 460, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT * 0.5, 380 + STROKE);
}

export function glyphI(path) {
    const s = STROKE;
    const cx = 300;
    vbar(path, cx - s / 2, 0, CAP_HEIGHT);
    hbar(path, cx - 120, CAP_HEIGHT - s, 240);
    hbar(path, cx - 120, 0, 240);
}

export function glyphJ(path) {
    const s = STROKE;
    vbar(path, 380, s, CAP_HEIGHT - s);
    hbar(path, 250, CAP_HEIGHT - s, 230);
    hbar(path, 100, 0, 280 + s);
    vbar(path, 100, 0 + s, CAP_HEIGHT * 0.25);
}

export function glyphK(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    path.moveTo(80 + s, CAP_HEIGHT * 0.5);
    path.lineTo(80 + s, CAP_HEIGHT * 0.5 + s);
    path.lineTo(480, CAP_HEIGHT);
    path.lineTo(480, CAP_HEIGHT - s);
    path.close();
    path.moveTo(80 + s, CAP_HEIGHT * 0.5);
    path.lineTo(80 + s, CAP_HEIGHT * 0.5 - s);
    path.lineTo(480, 0);
    path.lineTo(480, s);
    path.close();
}

export function glyphL(path) {
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, 0, 400);
}

export function glyphM(path) {
    const s = STROKE;
    vbar(path, 60, 0, CAP_HEIGHT);
    vbar(path, 540 - s, 0, CAP_HEIGHT);
    path.moveTo(60, CAP_HEIGHT);
    path.lineTo(60 + s, CAP_HEIGHT);
    path.lineTo(300 + s / 2, CAP_HEIGHT * 0.45);
    path.lineTo(300 - s / 2, CAP_HEIGHT * 0.45);
    path.close();
    path.moveTo(540 - s, CAP_HEIGHT);
    path.lineTo(540, CAP_HEIGHT);
    path.lineTo(300 + s / 2, CAP_HEIGHT * 0.45);
    path.lineTo(300 - s / 2, CAP_HEIGHT * 0.45);
    path.close();
}

export function glyphN(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    vbar(path, 480, 0, CAP_HEIGHT);
    path.moveTo(80, CAP_HEIGHT);
    path.lineTo(80 + s, CAP_HEIGHT);
    path.lineTo(480 + s, 0);
    path.lineTo(480, 0);
    path.close();
}

export function glyphO(path) {
    octagon(path, 300, CAP_HEIGHT / 2, 260);
}

export function glyphP(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT - s, 380);
    hbar(path, 80, CAP_HEIGHT * 0.5, 380);
    vbar(path, 460, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
}

export function glyphQ(path) {
    const s = STROKE;
    octagon(path, 300, CAP_HEIGHT / 2, 260);
    path.moveTo(360, 140);
    path.lineTo(360 + s, 140);
    path.lineTo(520, -40);
    path.lineTo(520 - s, -40);
    path.close();
}

export function glyphR(path) {
    const s = STROKE;
    vbar(path, 80, 0, CAP_HEIGHT);
    hbar(path, 80, CAP_HEIGHT - s, 380);
    hbar(path, 80, CAP_HEIGHT * 0.5, 380);
    vbar(path, 460, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    path.moveTo(260, CAP_HEIGHT * 0.5);
    path.lineTo(260 + s, CAP_HEIGHT * 0.5);
    path.lineTo(500, 0);
    path.lineTo(500 - s, 0);
    path.close();
}

export function glyphS(path) {
    const s = STROKE;
    hbar(path, 80, CAP_HEIGHT - s, 420);
    vbar(path, 80, CAP_HEIGHT * 0.5, CAP_HEIGHT * 0.5 - s);
    hbar(path, 80, CAP_HEIGHT * 0.5, 420);
    vbar(path, 500 - s, s, CAP_HEIGHT * 0.5 - s);
    hbar(path, 80, 0, 420);
}

export function glyphT(path) {
    const s = STROKE;
    hbar(path, 60, CAP_HEIGHT - s, 480);
    vbar(path, 300 - s / 2, 0, CAP_HEIGHT - s);
}

export function glyphU(path) {
    const s = STROKE;
    vbar(path, 80, s, CAP_HEIGHT);
    vbar(path, 480 - s, s, CAP_HEIGHT);
    hbar(path, 80, 0, 400);
}

export function glyphV(path) {
    const s = STROKE;
    path.moveTo(60, CAP_HEIGHT);
    path.lineTo(60 + s, CAP_HEIGHT);
    path.lineTo(300 + s / 2, 0);
    path.lineTo(300 - s / 2, 0);
    path.close();
    path.moveTo(540 - s, CAP_HEIGHT);
    path.lineTo(540, CAP_HEIGHT);
    path.lineTo(300 + s / 2, 0);
    path.lineTo(300 - s / 2, 0);
    path.close();
}

export function glyphW(path) {
    const s = STROKE;
    vbar(path, 40, 0, CAP_HEIGHT);
    vbar(path, 540 - s, 0, CAP_HEIGHT);
    vbar(path, 290 - s / 2, 0, CAP_HEIGHT * 0.55);
    hbar(path, 40, 0, 500);
}

export function glyphX(path) {
    const s = STROKE;
    path.moveTo(80, CAP_HEIGHT);
    path.lineTo(80 + s, CAP_HEIGHT);
    path.lineTo(520, 0);
    path.lineTo(520 - s, 0);
    path.close();
    path.moveTo(520 - s, CAP_HEIGHT);
    path.lineTo(520, CAP_HEIGHT);
    path.lineTo(80 + s, 0);
    path.lineTo(80, 0);
    path.close();
}

export function glyphY(path) {
    const s = STROKE;
    path.moveTo(60, CAP_HEIGHT);
    path.lineTo(60 + s, CAP_HEIGHT);
    path.lineTo(300 + s / 2, CAP_HEIGHT * 0.45);
    path.lineTo(300 - s / 2, CAP_HEIGHT * 0.45);
    path.close();
    path.moveTo(540 - s, CAP_HEIGHT);
    path.lineTo(540, CAP_HEIGHT);
    path.lineTo(300 + s / 2, CAP_HEIGHT * 0.45);
    path.lineTo(300 - s / 2, CAP_HEIGHT * 0.45);
    path.close();
    vbar(path, 300 - s / 2, 0, CAP_HEIGHT * 0.45);
}

export function glyphZ(path) {
    const s = STROKE;
    hbar(path, 80, CAP_HEIGHT - s, 440);
    path.moveTo(520 - s, CAP_HEIGHT - s);
    path.lineTo(520, CAP_HEIGHT - s);
    path.lineTo(80 + s, s);
    path.lineTo(80, s);
    path.close();
    hbar(path, 80, 0, 440);
}

/** Map of char → builder function */
export const UPPERCASE = Object.freeze({
    A: glyphA, B: glyphB, C: glyphC, D: glyphD, E: glyphE,
    F: glyphF, G: glyphG, H: glyphH, I: glyphI, J: glyphJ,
    K: glyphK, L: glyphL, M: glyphM, N: glyphN, O: glyphO,
    P: glyphP, Q: glyphQ, R: glyphR, S: glyphS, T: glyphT,
    U: glyphU, V: glyphV, W: glyphW, X: glyphX, Y: glyphY, Z: glyphZ
});
