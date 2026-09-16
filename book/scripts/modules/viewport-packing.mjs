/**
 * viewport-packing.mjs — mirror the visual viewport's pinch scale into CSS.
 *
 * The viewport meta never blocks pinch zoom. When a reader does zoom the
 * page (browser-level), `visualViewport.scale` is mirrored onto <html> so
 * layouts can *repack* instead of forcing horizontal panning:
 *
 *   html[data-packing]  spacious — scale < 1.1 (default layout)
 *                       cozy     — 1.1 ≤ scale ≤ 1.6 (tightened gutters)
 *                       compact  — scale > 1.6 (single-column, wrapped rows)
 *   --pinch-scale       the raw scale, three decimals
 *
 * Shared by the home surface (styles/home/readable.css) and chapter pages
 * (styles/components/gestures.css). On chapter prose, reading-gestures.mjs
 * captures the pinch itself and turns it into text size; this module still
 * covers zooms that start on chrome, the aside, or non-prose surfaces.
 */
const COZY_AT = 1.1;
const COMPACT_AT = 1.6;

export function packingFor(scale) {
  if (scale > COMPACT_AT) return 'compact';
  if (scale >= COZY_AT) return 'cozy';
  return 'spacious';
}

export function initPinchPacking() {
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (!vv) {
    root.dataset.packing = 'spacious';
    return () => {};
  }

  let frame = 0;
  const apply = () => {
    frame = 0;
    const scale = vv.scale || 1;
    root.style.setProperty('--pinch-scale', scale.toFixed(3));
    const packing = packingFor(scale);
    if (root.dataset.packing !== packing) {
      root.dataset.packing = packing;
    }
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(apply);
  };

  vv.addEventListener('resize', schedule, { passive: true });
  vv.addEventListener('scroll', schedule, { passive: true });
  apply();

  return () => {
    vv.removeEventListener('resize', schedule);
    vv.removeEventListener('scroll', schedule);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
