/**
 * scroll-coordinator.mjs — One passive scroll/resize listener, many subscribers.
 *
 * Coalesces window scroll + resize into a single rAF tick and fans out
 * progress + viewport metrics. Keeps chapter/hub pages from stacking
 * independent scroll handlers that each thrash layout.
 */

/** @typedef {{ y: number, max: number, progress: number, width: number, height: number }} ScrollSnapshot */

/** @type {Set<(snap: ScrollSnapshot) => void>} */
const scrollSubs = new Set();
/** @type {Set<(snap: ScrollSnapshot) => void>} */
const resizeSubs = new Set();

let attached = false;
let scrollRaf = 0;
let resizeRaf = 0;
/** @type {ScrollSnapshot} */
let snapshot = {
  y: 0,
  max: 1,
  progress: 0,
  width: 0,
  height: 0
};

function readSnapshot() {
  const doc = document.documentElement;
  const y = window.scrollY || 0;
  const height = window.innerHeight || 1;
  const width = window.innerWidth || 1;
  const max = Math.max(doc.scrollHeight - height, 1);
  const progress = Math.min(1, Math.max(0, y / max));
  snapshot = { y, max, progress, width, height };
  return snapshot;
}

function emitScroll() {
  scrollRaf = 0;
  const snap = readSnapshot();
  scrollSubs.forEach((fn) => {
    try {
      fn(snap);
    } catch (error) {
      console.warn('scroll subscriber failed:', error);
    }
  });
}

function emitResize() {
  resizeRaf = 0;
  const snap = readSnapshot();
  resizeSubs.forEach((fn) => {
    try {
      fn(snap);
    } catch (error) {
      console.warn('resize subscriber failed:', error);
    }
  });
  // Resize often implies scroll metrics change; notify scroll subs once.
  scrollSubs.forEach((fn) => {
    try {
      fn(snap);
    } catch (error) {
      console.warn('scroll subscriber failed:', error);
    }
  });
}

function onScroll() {
  if (scrollRaf) {
    return;
  }
  scrollRaf = requestAnimationFrame(emitScroll);
}

function onResize() {
  if (resizeRaf) {
    return;
  }
  resizeRaf = requestAnimationFrame(emitResize);
}

function ensureAttached() {
  if (attached || typeof window === 'undefined') {
    return;
  }
  attached = true;
  readSnapshot();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
}

function maybeDetach() {
  if (!attached || scrollSubs.size || resizeSubs.size) {
    return;
  }
  attached = false;
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
  if (scrollRaf) {
    cancelAnimationFrame(scrollRaf);
    scrollRaf = 0;
  }
  if (resizeRaf) {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = 0;
  }
}

/**
 * Subscribe to coalesced scroll frames.
 * @param {(snap: ScrollSnapshot) => void} fn
 * @param {{ immediate?: boolean }} [options]
 * @returns {() => void} unsubscribe
 */
export function onScrollFrame(fn, options = {}) {
  if (typeof fn !== 'function') {
    return () => {};
  }
  ensureAttached();
  scrollSubs.add(fn);
  if (options.immediate !== false) {
    fn(readSnapshot());
  }
  return () => {
    scrollSubs.delete(fn);
    maybeDetach();
  };
}

/**
 * Subscribe to coalesced resize frames.
 * @param {(snap: ScrollSnapshot) => void} fn
 * @param {{ immediate?: boolean }} [options]
 * @returns {() => void} unsubscribe
 */
export function onResizeFrame(fn, options = {}) {
  if (typeof fn !== 'function') {
    return () => {};
  }
  ensureAttached();
  resizeSubs.add(fn);
  if (options.immediate !== false) {
    fn(readSnapshot());
  }
  return () => {
    resizeSubs.delete(fn);
    maybeDetach();
  };
}

/** @returns {ScrollSnapshot} */
export function getScrollSnapshot() {
  return readSnapshot();
}

/**
 * Schedule work when the browser is idle (falls back to timeout).
 * @param {() => void} fn
 * @param {{ timeout?: number }} [options]
 * @returns {() => void} cancel
 */
export function whenIdle(fn, options = {}) {
  const timeout = options.timeout ?? 1200;
  if (typeof window === 'undefined') {
    return () => {};
  }
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => fn(), { timeout });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, Math.min(timeout, 200));
  return () => window.clearTimeout(id);
}
