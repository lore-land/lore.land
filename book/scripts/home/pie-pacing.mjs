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

/* ─── The story as captions: a line short enough to read between dodges, and time enough to read it ─── */

/** Reading a caption while carrying: how long a line may be, how long it is given, and how long it may wait. */
export const CAPTION = Object.freeze({
  chars: 84,            // about two subtitle lines: a caption is a glance, not a paragraph
  secondsAWord: 0.28,
  least: 2,
  most: 6,
  waitsForRoad: 3,      // seconds a caption may stay unread while the road is busy
  behind: 6             // waiting captions beyond this skip ahead, to where the newest sentence opens
});

/** Words a long clause may be turned at, when it has no comma to turn at. */
const TURNS = /\s+(?=(?:and|but|or|nor|that|which|who|whom|whose|when|where|while|as|because|so|then|than|until|with|without|for|to|of|in|on|at|from|by|into|over|under|through)\s)/gi;

/**
 * A piece no longer than the limit, turned at the joining word nearest its middle; as it is when it has none.
 * @param {string} piece @param {number} limit @returns {string[]}
 */
function turned(piece, limit) {
  if (piece.length <= limit) return [piece];
  const points = [...piece.matchAll(TURNS)].map((m) => /** @type {number} */ (m.index)).filter((i) => i > 12 && i < piece.length - 12);
  if (!points.length) return [piece];
  const mid = piece.length / 2;
  const at = points.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best), points[0]);
  return [...turned(piece.slice(0, at).trim(), limit), ...turned(piece.slice(at).trim(), limit)];
}

/** A title's full stop is not the end of a sentence: Mr. BaneWAP is one name. */
const TITLED = /(?:^|\s)(?:Mr|Mrs|Ms|Dr|St)\.$/;

/**
 * A passage in sentences. A sentence ends at its mark only where a space follows, so a name with a stop inside it
 * (Boon.land) stays one word, and a title keeps its name.
 * @param {string} text @returns {string[]}
 */
export function sentencesOf(text) {
  /** @type {string[]} */
  const out = [];
  let from = 0;
  for (const m of text.matchAll(/[.!?…]+["”’)\]]*\s+/g)) {
    const at = /** @type {number} */ (m.index);
    const upTo = text.slice(from, at + m[0].trimEnd().length);
    if (TITLED.test(upTo)) continue;
    if (upTo.trim()) out.push(upTo.trim());
    from = at + m[0].length;
  }
  const rest = text.slice(from).trim();
  if (rest) out.push(rest);
  return out;
}

/**
 * A passage as captions: its sentences, a long one in clauses (at a comma, a semicolon, a colon, a dash), and a long
 * clause turned at a joining word. Every word is kept, in order; each caption says whether it opens a sentence.
 * @param {string} text @param {number} [limit] @returns {Array<{ text: string, opens: boolean }>}
 */
export function captionsOf(text, limit = CAPTION.chars) {
  return sentencesOf(String(text)).flatMap((sentence) => {
    /** @type {string[]} */
    const packed = [];
    let cur = '';
    (sentence.length <= limit ? [sentence] : sentence.split(/(?<=[,;:—])\s+/)).forEach((clause) => {
      if (cur && cur.length + clause.length + 1 > limit) { packed.push(cur); cur = clause; } else cur = cur ? `${cur} ${clause}` : clause;
    });
    if (cur) packed.push(cur);
    return packed.flatMap((piece) => turned(piece, limit)).map((piece, i) => ({ text: piece, opens: i === 0 }));
  });
}

/** Seconds a caption needs to be read. @param {string} text */
export const captionSeconds = (text) => Math.min(CAPTION.most, Math.max(CAPTION.least, String(text).split(/\s+/).filter(Boolean).length * CAPTION.secondsAWord));

/**
 * When captions have fallen behind, how many to let go from the front. The carry passes a chapter several times
 * faster than its captions can be read, so what is shown is a skim: it picks up where the newest passage waiting
 * opens, and failing that where the newest sentence opens, never in the middle of one.
 * @param {ReadonlyArray<{ opens: boolean, leads?: boolean }>} waiting
 */
export function skipAhead(waiting, behind = CAPTION.behind) {
  if (waiting.length <= behind) return 0;
  for (let i = waiting.length - 1; i > 0; i -= 1) if (waiting[i].leads) return i;
  let start = waiting.length - 1;
  while (start > 0 && !waiting[start].opens) start -= 1;
  return start;
}
