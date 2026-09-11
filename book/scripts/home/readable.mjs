/**
 * Pinch-aware readability enhancement.
 *
 * The viewport meta never blocks pinch zoom; this module goes one step
 * further and mirrors the visual viewport's pinch scale into CSS so the
 * page can *repack* components (see styles/home/readable.css) instead of
 * forcing horizontal panning when a reader scales the text up.
 *
 * html[data-packing]:
 *   spacious — scale < 1.1 (default layout)
 *   cozy     — 1.1 ≤ scale ≤ 1.6 (tightened gutters)
 *   compact  — scale > 1.6 (single-column, wrapped rows)
 */
const COZY_AT = 1.1;
const COMPACT_AT = 1.6;

function packingFor(scale) {
  if (scale > COMPACT_AT) return 'compact';
  if (scale >= COZY_AT) return 'cozy';
  return 'spacious';
}

export function initPinchPacking() {
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (!vv) {
    root.dataset.packing = 'spacious';
    return;
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
}

initPinchPacking();
