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
 * Switch: `living` ("Phrases turn with the clock", a trial). Stage directions
 * set it for one visit: ?phrases=turn|still, and ?at=19:00 (or a full date,
 * or "canon") pins every phrase to the words of that moment — no ticking —
 * so a screenshot can be reproduced exactly (stage-directions.mjs).
 *
 * Other tellings (tellings.mjs, PLAN.E L24) ask this module to turn, by event:
 *   lore:telling {node, index}   a reader turned one phrase; it holds until the clock is dialed
 *   lore:stage-clock {at}        the hour dial set the page's clock (a Date, 'canon', or null for now)
 * and every turn is told back as lore:told {node, index, by} (clock, reader, dial).
 */
import { loadAlmanac } from './almanac.mjs?v=2026_11_06.B';
import { readStage } from './stage-directions.mjs?v=2026_11_06.D';

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

  const stage = readStage();
  const pinned = stage.at instanceof Date ? stage.at : null;
  let dial = null; // the hour dial's clock (tellings.mjs): a Date, 'canon', or null for the page's own
  const on = () => {
    if (dial === 'canon') return false;
    if (dial instanceof Date) return true;
    if (stage.phrases === 'still' || stage.at === 'canon') return false;
    if (stage.phrases === 'turn' || pinned) return true;
    return root.getAttribute('data-switch-living') === 'on';
  };
  const clockNow = () => (dial instanceof Date ? dial : pinned) || new Date();
  // Stage directions turn phrases on without touching the reader's switch; the glints follow.
  const staged = on() && root.getAttribute('data-switch-living') !== 'on';
  if (staged) root.setAttribute('data-stage-phrases', 'turn');
  let timer = 0;
  let soiled = false;

  const inReadingBand = (node) => {
    const box = node.getBoundingClientRect();
    const h = window.innerHeight;
    return box.bottom > h * 0.28 && box.top < h * 0.72;
  };

  const told = (slot, by) => window.dispatchEvent(new CustomEvent('lore:told', {
    detail: { node: slot.node, index: slot.variants.indexOf(slot.node.textContent), by }
  }));

  /* A turn rolls like a tumbler: up and out, then in from below. `top` on an
   * inline box moves it without reflowing the line. */
  const turn = (slot, text, animate, by = 'clock', delay = 0) => {
    slot.waiting = null;
    // A newer turn always wins over one still rolling.
    clearTimeout(slot.rolling);
    slot.node.classList.remove('is-turning', 'is-arriving');
    if (slot.node.textContent === text) return;
    if (!animate || reduced?.matches) {
      slot.node.textContent = text;
      told(slot, by);
      return;
    }
    slot.rolling = setTimeout(() => {
      slot.node.classList.add('is-turning');
      slot.rolling = setTimeout(() => {
        slot.node.textContent = text;
        slot.node.classList.remove('is-turning');
        slot.node.classList.add('is-arriving');
        void slot.node.offsetWidth;
        slot.node.classList.remove('is-arriving');
        slot.node.classList.add('is-turned');
        told(slot, by);
        setTimeout(() => slot.node.classList.remove('is-turned'), 1400);
      }, 240);
    }, delay);
  };

  const schedule = () => {
    clearTimeout(timer);
    if (pinned || dial) return; // a pinned or dialed clock does not tick
    timer = setTimeout(() => tick({ animate: true }), PERIOD.minute - (Date.now() % PERIOD.minute) + 40);
  };

  /* A dialed clock ripples out from the middle of the screen. */
  const ripple = (slot) => {
    const box = slot.node.getBoundingClientRect();
    return Math.min(700, Math.abs(box.top + box.height / 2 - window.innerHeight / 2) / 3);
  };

  const tick = ({ animate = false, band = animate, by = 'clock' } = {}) => {
    if (!on()) return;
    const now = clockNow();
    // The moment the phrases show, for "Copy stage link" (scene-light.mjs).
    root.dataset.stageClock = new Date(Math.floor(now.getTime() / PERIOD.minute) * PERIOD.minute).toISOString();
    slots.forEach((slot) => {
      if (slot.held) return;
      const text = variantFor(slot.name, slot.clock, slot.variants, now, salt);
      if (text === slot.node.textContent) return;
      if (band && inReadingBand(slot.node)) {
        slot.waiting = text;
        return;
      }
      turn(slot, text, animate, by, by === 'dial' ? ripple(slot) : 0);
    });
    schedule();
  };

  /* Soil: each mark glints on its own period, projected from how far its
   * wonder runs through the book, phased by the hour. */
  const soil = async () => {
    if (soiled || !marks.length) return;
    soiled = true;
    const data = await loadAlmanac();
    const hour = bucket('hour', clockNow());
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

  const restore = (animate = false, by = 'clock') => {
    clearTimeout(timer);
    if (dial === 'canon') root.dataset.stageClock = 'canon';
    else delete root.dataset.stageClock;
    slots.forEach((slot) => {
      slot.held = false;
      turn(slot, slot.variants[0], animate, by, animate ? ripple(slot) : 0);
    });
  };

  const apply = () => {
    if (on()) {
      tick();
      soil();
    } else {
      restore();
    }
  };

  /* A reader turned one phrase by hand (tellings.mjs): it holds until the clock is dialed. */
  const onTelling = (event) => {
    const slot = slots.find((s) => s.node === event.detail?.node);
    const text = slot?.variants[Number(event.detail?.index)];
    if (text == null) return;
    slot.held = true;
    turn(slot, text, true, 'reader');
  };

  /* The hour dial set the page's clock: every phrase turns, even the one being read. */
  const onStageClock = (event) => {
    const at = event.detail?.at;
    dial = at instanceof Date || at === 'canon' ? at : null;
    slots.forEach((slot) => { slot.held = false; });
    if (dial instanceof Date || staged) root.setAttribute('data-stage-phrases', 'turn');
    else root.removeAttribute('data-stage-phrases');
    if (on()) {
      tick({ animate: true, band: false, by: 'dial' });
      soil();
    } else {
      restore(true, 'dial');
    }
  };

  const onVisible = () => { if (document.visibilityState === 'visible') tick({ animate: true }); };
  const watcher = new MutationObserver(apply);
  watcher.observe(root, { attributes: true, attributeFilter: ['data-switch-living'] });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('lore:telling', onTelling);
  window.addEventListener('lore:stage-clock', onStageClock);
  document.addEventListener('visibilitychange', onVisible);
  apply();

  return () => {
    clearTimeout(timer);
    watcher.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('lore:telling', onTelling);
    window.removeEventListener('lore:stage-clock', onStageClock);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
