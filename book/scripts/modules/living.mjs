/**
 * living.mjs — the book breathes (PLAN.E L15, L16; contracts c024, c028).
 *
 * Living slots: some phrases carry a clock (minute, hour or day) and a few
 * variants (`.living-slot[data-variants]`, rendered by chapter-render.mjs).
 * Variant zero is the book's own wording: it is what the build prerenders,
 * what search and no-JS readers get, and what returns when the living page
 * is switched off. With it on, each slot turns on its clock, offset by a
 * hash of its name so the page never changes all at once.
 *
 * Attention is respected: a slot inside the band the reader is reading (the
 * middle of the viewport) waits until it has scrolled out of that band. The
 * words under the eye never change.
 *
 * Living soil: wonder marks glint like grains catching light. The rhythm is
 * projected from references — the more places a wonder lives, the slower
 * and surer its glint — and phased by the clock. Light only; nothing moves
 * or reflows. Reduced motion: slots turn without animation, nothing glints.
 *
 * Switch: `living` (a trial; ?try=living).
 */
import { loadAlmanac } from './almanac.mjs?v=2026_11_06.B';

const PERIOD = Object.freeze({ minute: 60_000, hour: 3_600_000, day: 86_400_000 });
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

/** Local-time bucket: the same minute, hour or day reads the same for everyone in it. */
function bucket(clock, now) {
  const local = now.getTime() - now.getTimezoneOffset() * 60_000;
  return Math.floor(local / (PERIOD[clock] || PERIOD.hour));
}

/** Which variant a slot shows now. Deterministic; variant zero is canon. */
export function variantFor(name, clock, variants, now = new Date(), salt = '') {
  if (!variants?.length) return '';
  return variants[(bucket(clock, now) + hash(`${salt}:${name}`)) % variants.length];
}

export function initLiving({ chapterData } = {}) {
  const main = document.getElementById('chapter-content');
  const root = document.documentElement;
  if (!main) return () => {};
  const salt = String(chapterData?.chapterNumber || '');
  const slots = [...main.querySelectorAll('.living-slot[data-variants]')].map((node) => {
    let variants = [];
    try { variants = JSON.parse(node.dataset.variants); } catch { variants = []; }
    return { node, name: node.dataset.slot, clock: node.dataset.clock, variants, waiting: null };
  }).filter((slot) => slot.variants.length);
  const marks = [...main.querySelectorAll('.wonder-mark[data-wonder]')];
  if (!slots.length && !marks.length) return () => {};

  const on = () => root.getAttribute('data-switch-living') === 'on';
  let timer = 0;
  let soiled = false;

  const inReadingBand = (node) => {
    const box = node.getBoundingClientRect();
    const h = window.innerHeight;
    return box.bottom > h * 0.28 && box.top < h * 0.72;
  };

  const turn = (slot, text, animate) => {
    slot.waiting = null;
    if (slot.node.textContent === text) return;
    if (!animate || reduced?.matches) {
      slot.node.textContent = text;
      return;
    }
    slot.node.classList.add('is-turning');
    setTimeout(() => {
      slot.node.textContent = text;
      slot.node.classList.remove('is-turning');
      slot.node.classList.add('is-turned');
      setTimeout(() => slot.node.classList.remove('is-turned'), 1400);
    }, 280);
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => tick(false), PERIOD.minute - (Date.now() % PERIOD.minute) + 40);
  };

  const tick = (immediate) => {
    if (!on()) return;
    const now = new Date();
    slots.forEach((slot) => {
      const text = variantFor(slot.name, slot.clock, slot.variants, now, salt);
      if (text === slot.node.textContent) return;
      if (!immediate && inReadingBand(slot.node)) {
        slot.waiting = text;
        return;
      }
      turn(slot, text, !immediate);
    });
    schedule();
  };

  /* Soil: each mark glints on its own period, projected from how far its
   * wonder runs through the book, phased by the hour. */
  const soil = async () => {
    if (soiled || !marks.length) return;
    soiled = true;
    const data = await loadAlmanac();
    const hour = bucket('hour', new Date());
    marks.forEach((mark) => {
      const lives = new Set(data.places(mark.dataset.wonder).map((p) => p.c)).size || 1;
      const period = 9 + lives * 3.5;
      mark.style.setProperty('--glint-period', `${period}s`);
      mark.style.setProperty('--glint-delay', `-${(hash(`${mark.dataset.wonder}:${hour}`) % (period * 10)) / 10}s`);
    });
  };

  const onScroll = () => {
    slots.forEach((slot) => {
      if (slot.waiting != null && !inReadingBand(slot.node)) turn(slot, slot.waiting, true);
    });
  };

  const restore = () => {
    clearTimeout(timer);
    slots.forEach((slot) => turn(slot, slot.variants[0], false));
  };

  const apply = () => {
    if (on()) {
      tick(true);
      soil();
    } else {
      restore();
    }
  };

  const onVisible = () => { if (document.visibilityState === 'visible') tick(false); };
  const watcher = new MutationObserver(apply);
  watcher.observe(root, { attributes: true, attributeFilter: ['data-switch-living'] });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisible);
  apply();

  return () => {
    clearTimeout(timer);
    watcher.disconnect();
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
