// @ts-check
/**
 * spw-live.mjs — a .spw surface read again, in place, while it is being written.
 *
 * Under `npm run dev` the dev server (book/scripts/tools/vite-spw-live.mjs) reads every saved .spw file with the
 * workbench parser and announces it on window as SURFACE_EVENT. A reader that took a surface (the lanes' rules, the
 * chapter levels, the bias registers…) subscribes here and reads the new text without a reload. A draft that does not
 * read whole is announced but not handed on, so a half-written line never knocks the page over: the page keeps what
 * it had, and the dev note says so. On the deployed site nothing announces, and a subscription is one listener.
 *
 *   onSurface('/.spw/runtime/pie-rules.spw', 'the lanes’ rules', (source) => { … })
 *
 * A reader returns false when it is not ready to take the text yet (it will fetch the saved file when it is).
 */

export const SURFACE_EVENT = 'lore:spw-surface';

/**
 * @typedef {{ line: number, column: number, message: string, kind: 'error' | 'warning' }} SurfaceIssue
 * @typedef {{
 *   path: string, source: string | null, whole: boolean, complete: boolean, proseFallback: boolean,
 *   issues: SurfaceIssue[], ms: number, taken: string[], kept: string[]
 * }} SurfaceDetail
 */

/**
 * The path a surface URL names: no origin, no ?v= token.
 * @param {string} url
 * @returns {string}
 */
export function surfacePath(url) {
  try {
    return new URL(url, 'https://lore.land').pathname;
  } catch {
    return String(url).split('?')[0];
  }
}

/**
 * Hand `read` the saved text of the surface at `url` whenever it is saved and reads whole.
 * @param {string} url as the reader fetches it (a ?v= token is ignored)
 * @param {string} name who takes it, as the dev note says it
 * @param {(source: string, detail: SurfaceDetail) => unknown} read
 * @returns {() => void} let go
 */
export function onSurface(url, name, read) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
  const want = surfacePath(url);
  /** @param {Event} event */
  const listen = (event) => {
    const detail = /** @type {CustomEvent<SurfaceDetail>} */ (event).detail;
    if (!detail || detail.path !== want) return;
    if (!detail.whole || typeof detail.source !== 'string') {
      detail.kept?.push(name);
      return;
    }
    let took;
    try {
      took = read(detail.source, detail);
    } catch (error) {
      console.warn(`[spw-live] ${name} could not take ${want}`, error);
      took = false;
    }
    (took === false ? detail.kept : detail.taken)?.push(name);
    if (took && typeof (/** @type {any} */ (took)).catch === 'function') {
      /** @type {Promise<unknown>} */ (took).catch((error) => console.warn(`[spw-live] ${name} could not take ${want}`, error));
    }
  };
  window.addEventListener(SURFACE_EVENT, listen);
  return () => window.removeEventListener(SURFACE_EVENT, listen);
}
