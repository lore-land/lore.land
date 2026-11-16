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
import { playSpell } from './spw-sound.mjs?v=2026_11_16.B';
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

/**
 * Enable subtle key-responsive sound & tactile settle responses across non-game pages
 * (chapter sigils, almanac wonders/combines, cards) once `sympathetic_strings` or sparks wake them.
 * Never overrides reading flow; only responds directly to user taps/clicks.
 */
export function bindSiteResonance({ root = document, context = 'site' } = {}) {
  if (!root || typeof window === 'undefined') return;
  syncDerivedSparks();
  const awake = () => unlockOpen('sympathetic_strings') || readSparks().count >= 1;
  const pieSoundOn = () => {
    try { return JSON.parse(local()?.getItem('lore.pie.v1') || 'null')?.sound !== false; } catch { return true; }
  };

  const resonanceSelector = context === 'almanac'
    ? '[data-wonder], .almanac-combine-card, .spw-spell, [data-sigil]'
    : '.resonance-sigil, .spw-spell, [data-wonder-term], .chapter-room-sig, [data-card-kind]';

  const onClick = (event) => {
    if (!awake() || !pieSoundOn()) return;
    const target = event.target instanceof Element ? event.target.closest(resonanceSelector) : null;
    if (!target) return;
    const expr = target.getAttribute('data-spw')
      || target.getAttribute('data-wonder-term')
      || target.textContent?.trim().slice(0, 64)
      || '*echo';
    try {
      playSpell(expr.includes('{') || /^[!?~@&*^#.=%$]/.test(expr) ? expr : `*${expr.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 18)}`, { volume: 0.42 });
      target.classList.add('is-sympathetic-ring');
      setTimeout(() => target.classList.remove('is-sympathetic-ring'), 420);
      if (context === 'almanac' && target.closest('.almanac-combine-card')) {
        const res = noteSpark('sympathetic_almanac');
        if (res?.isNew) settle(`✦ ${res.spark.name}: ${res.spark.gesture}`);
      }
    } catch { /* silent fallback */ }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
