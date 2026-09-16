/**
 * Pinch-aware readability enhancement for the home surface.
 *
 * The viewport meta never blocks pinch zoom; this entry mirrors the visual
 * viewport's pinch scale into CSS so the page can *repack* components (see
 * styles/home/readable.css) instead of forcing horizontal panning when a
 * reader scales the text up. The mirroring itself lives in the shared
 * modules/viewport-packing.mjs so chapter pages use the same thresholds.
 */
import { initPinchPacking } from '../modules/viewport-packing.mjs?v=2026_09_16.A';

export { initPinchPacking };

initPinchPacking();
