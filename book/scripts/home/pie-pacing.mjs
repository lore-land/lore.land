// @ts-check
/**
 * pie-pacing.mjs — the story's beats in a carry, given room: one at a time, never in a pile, never lost.
 *
 * The lanes produce story beats far faster than anyone reads: a room's name, a first meeting, a scheme, a motivation
 * setting off, a trope rising, gossip. The pacer takes them as they are offered and releases them with spacing:
 *   - a minimum gap between any two (wider in a carry's first minute, which should be gentle);
 *   - a quiet stretch after a loud beat (a scheme, a meeting, a chain completing), as a quiet room follows a loud one;
 *   - a chapter's opening kept for the chapter's own words, and its last stretch kept for its ending;
 *   - by priority (the story's own moments first), then by age;
 *   - an urgent beat (what changes play: a knock, a spill, a scheme with its off switch to find) goes at once, and the
 *     spacing counts from it;
 *   - nothing is dropped: a beat that has waited too long is folded, handed back to be said in the next caption's line
 *     or on the carry's end card, and the same title offered twice is one beat.
 * Pure: the game passes the time (seconds) and paints what comes back.
 */

/** @typedef {{ title: string, line?: string, ms?: number, voice?: string, weight?: number, kind?: string, urgent?: boolean }} Beat */
/** @typedef {Beat & { at: number }} Waiting */

/** Loud kinds: after one, the pacer keeps a quiet stretch. */
export const LOUD = Object.freeze(new Set(['scheme', 'meeting', 'chain', 'stage', 'chapter']));

export const PACING = Object.freeze({
  gap: 2.6,              // seconds between any two beats
  firstMinuteGap: 3.8,   // a carry's first minute is gentler
  quietAfterLoud: 4.2,   // after a loud beat, a quiet stretch
  opening: 5,            // a chapter's first seconds are for the chapter's own words
  ending: 4,             // and its last seconds for its ending
  maxWait: 12,           // a beat that waits longer is folded, not dropped
  queue: 6               // waiting beats beyond this fold at once (oldest, least weighty first)
});

/**
 * A pacer for one carry.
 * @param {Partial<typeof PACING>} [tuning]
 */
export function createPacer(tuning = {}) {
  const T = { ...PACING, ...tuning };
  /** @type {Waiting[]} */
  let waiting = [];
  /** @type {Beat[]} */
  let folded = [];
  let lastAt = -99;
  let lastLoud = false;
  let carryAt = 0;
  let chapterAt = -99;
  let endingFrom = Infinity;
  let holdUntil = -99;
  const stats = { offered: 0, released: 0, urgent: 0, folded: 0, merged: 0, longestWait: 0 };

  const gapAt = (/** @type {number} */ now) => {
    const base = now - carryAt < 60 ? T.firstMinuteGap : T.gap;
    return lastLoud ? Math.max(base, T.quietAfterLoud) : base;
  };
  const weightOf = (/** @type {Beat} */ b) => (b.kind === 'chapter' ? 9 : b.weight ?? 1);
  const allowedNow = (/** @type {Beat} */ b, /** @type {number} */ now) => {
    if (now < holdUntil) return false;
    if (now - chapterAt < T.opening && b.kind !== 'chapter') return false;
    if (now >= endingFrom && b.kind !== 'chapter' && b.kind !== 'ending') return false;
    return now - lastAt >= gapAt(now);
  };
  const release = (/** @type {Beat} */ b, /** @type {number} */ now) => {
    lastAt = now;
    lastLoud = LOUD.has(b.kind || '');
    stats.released += 1;
    return b;
  };
  const foldOldest = () => {
    waiting.sort((a, b) => weightOf(a) - weightOf(b) || a.at - b.at);
    const out = waiting.shift();
    if (out) { folded.push(out); stats.folded += 1; }
  };

  return {
    /** A carry begins (or begins again). @param {number} now */
    startCarry(now) { carryAt = now; lastAt = -99; lastLoud = false; waiting = []; endingFrom = Infinity; chapterAt = -99; },
    /** A chapter opens: its first seconds are kept for its own words. @param {number} now */
    startChapter(now) { chapterAt = now; endingFrom = Infinity; },
    /** Something else has the reader's eye a moment (a face reacting): no caption until then. @param {number} until */
    hold(until) { holdUntil = Math.max(holdUntil, until); },
    /** A chapter's last stretch begins: only its ending speaks. @param {number} now */
    chapterEnding(now) { endingFrom = now; },
    /**
     * Offer a beat. Returns it if it may be painted now, else null (it waits, or was merged with one waiting).
     * @param {Beat} beat @param {number} now
     * @returns {Beat | null}
     */
    offer(beat, now) {
      stats.offered += 1;
      if (beat.urgent) { stats.urgent += 1; return release(beat, now); }
      const same = waiting.findIndex((w) => w.title === beat.title);
      if (same >= 0) { waiting[same] = { ...beat, at: waiting[same].at }; stats.merged += 1; return null; }
      if (!waiting.length && allowedNow(beat, now)) return release(beat, now);
      waiting.push({ ...beat, at: now });
      while (waiting.length > T.queue) foldOldest();
      return null;
    },
    /**
     * Called every frame (or so): the beat due now, if any, and any beats that waited too long (folded).
     * @param {number} now
     * @returns {{ due: Beat | null, folded: Beat[] }}
     */
    tick(now) {
      waiting.forEach((w) => { stats.longestWait = Math.max(stats.longestWait, now - w.at); });
      const stale = waiting.filter((w) => now - w.at > T.maxWait);
      if (stale.length) {
        waiting = waiting.filter((w) => now - w.at <= T.maxWait);
        stale.forEach((w) => folded.push(w));
        stats.folded += stale.length;
      }
      let due = null;
      if (waiting.length) {
        waiting.sort((a, b) => weightOf(b) - weightOf(a) || a.at - b.at);
        if (allowedNow(waiting[0], now)) due = release(/** @type {Beat} */ (waiting.shift()), now);
      }
      const out = folded;
      folded = [];
      return { due, folded: out };
    },
    /** What is still waiting (for the carry's end card: nothing is lost). */
    drain() { const out = [...waiting, ...folded]; waiting = []; folded = []; stats.folded += out.length; return out; },
    /** How it has gone so far. */
    stats() { return { ...stats, waiting: waiting.length }; }
  };
}

/** Folded beats said in a few words, for the next caption's line or the end card. @param {Beat[]} beats */
export const foldedWords = (beats) => {
  const titles = [...new Set(beats.map((b) => b.title.replace(/\s+·.*$/, '').trim()).filter(Boolean))];
  return titles.length ? `Also, on the way: ${titles.slice(0, 4).join('; ')}${titles.length > 4 ? `; and ${titles.length - 4} more` : ''}.` : '';
};
