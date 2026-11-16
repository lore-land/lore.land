// @ts-check
/**
 * intrinsic-rewards.mjs — cross-site curiosity sparks & emergent interactive rewards.
 *
 * Notice what feels interesting as reading and play unfold across chapters, /almanac/, /pie/,
 * and /scriptorium/: without points or paywalls, unique combinations of exploration awaken new
 * responsive gestures across the site (sigils answering in key, quiet canvas shimmer, kept lines
 * speaking back when clicked).
 *
 * Stored in `lore.curiosities.v1` (registered in `READING_MARKS` in begin-again.mjs).
 */

import { settle } from './settled.mjs?v=2026_11_16.B';
import { playSpell, playNavigationTransition } from './spw-sound.mjs?v=2026_11_16.B';
import { open as unlockOpen } from './unlocks.mjs?v=2026_11_16.B';

export const CURIOSITY_KEY = 'lore.curiosities.v1';
export const SPARK_EVENT = 'lore:spark';

export const SPARKS = Object.freeze({
  room_cast: {
    id: 'room_cast',
    name: 'A room answered in play',
    says: 'Doing a room’s verb while its words pass wakes its sigil across the chapter.',
    spell: '*spark[room_cast]{ @lanes &chapter ~sympathy }',
    gesture: 'Chapters gently highlight rooms you have cast.'
  },
  word_weaver: {
    id: 'word_weaver',
    name: 'Words gathered off the cobbles',
    says: 'Five road words read, marked, or fed assemble a found line that chimes when revisited.',
    spell: '*spark[word_weaver]{ .road %five ~chant }',
    gesture: 'Kept road phrases gain clickable harmonic playback.'
  },
  sympathetic_almanac: {
    id: 'sympathetic_almanac',
    name: 'Almanac & rhythm in tune',
    says: 'Combining wonders in the almanac while holding a found rhythm sets wonders ringing in key.',
    spell: '*spark[sympathetic_almanac]{ *wonder *rhythm ^chord }',
    gesture: 'Clicking wonders in the almanac plays their Spw charm chord.'
  },
  parallel_pilgrim: {
    id: 'parallel_pilgrim',
    name: 'Two ways through one chapter',
    says: 'Carrying the same chapter under different values shows how parallel choices reshape one road.',
    spell: '*spark[parallel_pilgrim]{ =value_a =value_b ?elsewhere }',
    gesture: 'Unlocks parallel-experience comparisons at rest and finish.'
  },
  quiet_stretch: {
    id: 'quiet_stretch',
    name: 'An unbruised crossing',
    says: 'Carrying thirty cobbles cleanly without a knock calms the ambient plate into harmonic stillness.',
    spell: '*spark[quiet_stretch]{ .still %thirty ~hush }',
    gesture: 'Adds a serene overtone ring to quiet carries.'
  },
  creator_hand: {
    id: 'creator_hand',
    name: 'Through a maker’s hand',
    says: 'Shaping a carry with a tuned domain dial or creator style binds your aesthetic signature into provenance.',
    spell: '@creator<style>{ !tune ^provenance }',
    gesture: 'Credits the active creator style in kept carry receipts.'
  }
});

const local = () => { try { return window.localStorage; } catch { return null; } };

export function readSparks() {
  try {
    const raw = JSON.parse(local()?.getItem(CURIOSITY_KEY) || 'null');
    return raw && typeof raw === 'object' ? { kept: raw.kept || {}, count: Object.keys(raw.kept || {}).length } : { kept: {}, count: 0 };
  } catch {
    return { kept: {}, count: 0 };
  }
}

/** Record an intrinsic curiosity discovery if new, emitting subtle audio/settled feedback. */
export function noteSpark(id, detail = '') {
  const def = SPARKS[id];
  if (!def) return null;
  const state = readSparks();
  const isNew = !state.kept[id];
  if (isNew) {
    state.kept[id] = { at: new Date().toISOString().slice(0, 10), ...(detail ? { detail } : {}) };
    state.count = Object.keys(state.kept).length;
    try { local()?.setItem(CURIOSITY_KEY, JSON.stringify(state)); } catch { /* visit only */ }
    try {
      window.dispatchEvent(new CustomEvent(SPARK_EVENT, { detail: { spark: def, detail, count: state.count } }));
    } catch { /* no window */ }
  }
  return { spark: def, isNew, count: state.count, total: Object.keys(SPARKS).length };
}

/** Check and award cross-site sparks derivable from current browser marks (e.g. almanac + rhythms). */
export function syncDerivedSparks() {
  const fresh = [];
  try {
    const combines = JSON.parse(local()?.getItem('lore.almanac.combines.v1') || '[]');
    const rhythms = JSON.parse(local()?.getItem('lore.pie.rhythms.v1') || '{}');
    if (Array.isArray(combines) && combines.length > 0 && rhythms && Object.keys(rhythms).length > 0) {
      const res = noteSpark('sympathetic_almanac');
      if (res?.isNew) fresh.push(res.spark);
    }
    const parallels = JSON.parse(local()?.getItem('lore.pie.parallels.v1') || '{}');
    if (parallels && Object.values(parallels).some((p) => Array.isArray(p?.values) && p.values.length >= 2)) {
      const res = noteSpark('parallel_pilgrim');
      if (res?.isNew) fresh.push(res.spark);
    }
    const casts = JSON.parse(local()?.getItem('lore.rooms.cast.v1') || '{}');
    if (casts && Object.keys(casts).length > 0) {
      const res = noteSpark('room_cast');
      if (res?.isNew) fresh.push(res.spark);
    }
  } catch { /* ignore */ }
  return fresh;
}

/** Human-readable summary of curiosity progress for Almanac, Scriptorium Desk, or Unlocks page. */
export function curiosityStanding() {
  const { kept, count } = readSparks();
  const total = Object.keys(SPARKS).length;
  return {
    count,
    total,
    kept,
    items: Object.values(SPARKS).map((s) => ({ ...s, found: Boolean(kept[s.id]), at: kept[s.id]?.at || null }))
  };
}

const PASSIVE_NAV_SOURCES = new Set(['init', 'scroll', '']);

function chapterFromPath(href = '') {
  const m = String(href).match(/\/chapter\/(\d+)/);
  return m ? Number(m[1]) : null;
}

function readSympatheticGain() {
  try {
    const raw = local()?.getItem('lore.pie.tuning.v1');
    const parsed = raw ? JSON.parse(raw) : null;
    const g = Number(parsed?.unlocks?.sympathetic_gain);
    return Number.isFinite(g) ? Math.max(0.2, Math.min(1.6, g)) : 1;
  } catch {
    return 1;
  }
}

function roomSigilOf(sectionEl) {
  if (!sectionEl) return '.';
  const raw = sectionEl.querySelector(':scope > .room-head .room-sig .room-sig-op')?.textContent
    || sectionEl.querySelector(':scope > .room-head .room-sig')?.textContent
    || '';
  const m = raw.trim().match(/^[.!?~@&*^#%=$]/);
  return m ? m[0] : '.';
}

/**
 * Enable subtle key-responsive sound & tactile settle responses across non-game pages
 * (chapter sigils, intentional room/chapter navigation, almanac wonders/combines, cards)
 * once `sympathetic_strings` or sparks wake them.
 * Never overrides reading flow or auto-plays on scroll; only responds directly to user gestures.
 * @param {{ root?: Document | Element, context?: string, chapter?: number | null }} [opts]
 */
export function bindSiteResonance({ root = document, context = 'site', chapter = null } = {}) {
  if (!root || typeof window === 'undefined') return;
  syncDerivedSparks();
  const awake = () => unlockOpen('sympathetic_strings') || readSparks().count >= 1;
  const pieSoundOn = () => {
    try { return JSON.parse(local()?.getItem('lore.pie.v1') || 'null')?.sound !== false; } catch { return true; }
  };
  const currentChapter = () => {
    if (Number.isFinite(chapter) && Number(chapter) > 0) return Number(chapter);
    const attr = (root instanceof Element ? root : document.documentElement).closest?.('[data-chapter]')?.getAttribute('data-chapter')
      || document.querySelector?.('[data-chapter]')?.getAttribute('data-chapter');
    if (attr && Number.isFinite(Number(attr))) return Number(attr);
    return chapterFromPath(window.location.pathname);
  };

  let hasUserGesture = false;
  let lastSectionIndex = 0;
  let lastSigil = '.';
  let lastNavAt = 0;

  const markGesture = () => { hasUserGesture = true; };

  const resonanceSelector = context === 'almanac'
    ? '[data-wonder], .almanac-combine-card, .spw-spell, [data-sigil]'
    : '.resonance-sigil, .spw-spell, [data-wonder-term], .chapter-room-sig, [data-card-kind]';
  const doorSelector = 'nav.chapter-navigation a.prev, nav.chapter-navigation a.next, a.hub-chapter-card[href*="/chapter/"], a.chapter-card[href*="/chapter/"]';

  /** @param {Event} event */
  const onClick = (event) => {
    markGesture();
    if (!awake() || !pieSoundOn()) return;
    if (!(event.target instanceof Element)) return;
    const gain = readSympatheticGain();
    const target = event.target.closest(resonanceSelector);
    if (target) {
      const expr = target.getAttribute('data-spw')
        || target.getAttribute('data-wonder-term')
        || target.textContent?.trim().slice(0, 64)
        || '*echo';
      const cardAttr = target.closest('[data-chapter]')?.getAttribute('data-chapter');
      const cardChapter = cardAttr && Number.isFinite(Number(cardAttr)) ? Number(cardAttr) : currentChapter();
      try {
        playSpell(
          expr.includes('{') || /^[!?~@&*^#.=%$]/.test(expr) ? expr : `*${expr.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 18)}`,
          { volume: 0.42 * gain, chapter: cardChapter }
        );
        target.classList.add('is-sympathetic-ring');
        setTimeout(() => target.classList.remove('is-sympathetic-ring'), 420);
        if (context === 'almanac' && target.closest('.almanac-combine-card')) {
          const res = noteSpark('sympathetic_almanac');
          if (res?.isNew) settle(`✦ ${res.spark.name}: ${res.spark.gesture}`);
        }
      } catch { /* silent fallback */ }
      return;
    }

    const door = event.target.closest(doorSelector);
    if (door) {
      const targetChapter = chapterFromPath(door.getAttribute('href') || '');
      const fromChapter = currentChapter();
      if (targetChapter && targetChapter !== fromChapter) {
        try {
          playNavigationTransition({
            fromChapter,
            toChapter: targetChapter,
            fromSigil: lastSigil,
            toSigil: '.',
            direction: fromChapter && targetChapter < fromChapter ? -1 : 1,
            volume: 0.36 * gain
          });
        } catch { /* silent fallback */ }
      }
    }
  };

  /** @param {Event} event */
  const onSectionChange = (event) => {
    if (context !== 'chapter' || !(event instanceof CustomEvent)) return;
    const detail = event.detail || {};
    const sectionIndex = Number(detail.sectionIndex || 0);
    const sectionEl = detail.sectionId ? document.getElementById(String(detail.sectionId)) : null;
    const nextSigil = roomSigilOf(sectionEl);
    const source = String(detail.source || '');
    const prevIndex = lastSectionIndex;
    const prevSigil = lastSigil;
    lastSectionIndex = sectionIndex || prevIndex;
    lastSigil = nextSigil;

    if (PASSIVE_NAV_SOURCES.has(source) || !hasUserGesture || !awake() || !pieSoundOn()) return;
    if (!sectionIndex || sectionIndex === prevIndex) return;
    const now = Date.now();
    if (now - lastNavAt < 200) return;
    lastNavAt = now;

    const ch = Number(detail.chapterNumber || 0) || currentChapter();
    try {
      playNavigationTransition({
        fromSigil: prevSigil,
        toSigil: nextSigil,
        toChapter: ch,
        direction: prevIndex && sectionIndex < prevIndex ? -1 : 1,
        volume: 0.36 * readSympatheticGain()
      });
      const chip = document.querySelector(`.room-strip .room-chip[data-room-index="${sectionIndex}"]`);
      if (chip) {
        chip.classList.add('is-sympathetic-ring');
        setTimeout(() => chip.classList.remove('is-sympathetic-ring'), 420);
      }
    } catch { /* silent fallback */ }
  };

  root.addEventListener('pointerdown', markGesture, { passive: true });
  root.addEventListener('keydown', markGesture, { passive: true });
  root.addEventListener('click', onClick);
  window.addEventListener('lore:ebook-section-change', onSectionChange);
  return () => {
    root.removeEventListener('pointerdown', markGesture);
    root.removeEventListener('keydown', markGesture);
    root.removeEventListener('click', onClick);
    window.removeEventListener('lore:ebook-section-change', onSectionChange);
  };
}
