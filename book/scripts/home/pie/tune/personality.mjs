// @ts-check
/**
 * pie/tune/personality.mjs — a carrier's own intervals.
 *
 * Catch, WAP and a trick duck the bed. They do not yet say who is carrying.
 * Each carrier keeps three steps. A gesture plays those steps in its own time.
 * The figure is not named here. The intervals are the person.
 */

/** @typedef {{ voice: string, deg: number, octave: number, at: number, dur: number, vol: number, side: number }} Note */
/** @typedef {{ who: string, gesture: string, lean: string, color: string, notes: Note[] }} VoicePlan */

/** @type {Readonly<Record<string, { lean: string, voice: string, color: string, steps: readonly number[] }>>} */
export const CARRIER_TUNES = Object.freeze({
  figure: { lean: 'open_quartal', voice: 'vibes', color: '#d7d2c8', steps: [0, 2, 5] },
  porter: { lean: 'poised_69', voice: 'marimba', color: '#c4a574', steps: [0, 0, 3] },
  clerk: { lean: 'poised_69', voice: 'musicBox', color: '#9eb4c4', steps: [0, 1, 4] },
  genie: { lean: 'lydian_court', voice: 'celesta', color: '#e6c56a', steps: [0, 4, 1] },
  clown: { lean: 'lydian_court', voice: 'marimba', color: '#e07a5f', steps: [0, 3, 4] }
});

/** @type {Readonly<Record<string, { gap: number, dur: number, rise: number }>>} */
export const GESTURES = Object.freeze({
  catch: { gap: 0.07, dur: 0.16, rise: 0 },
  wap: { gap: 0.045, dur: 0.09, rise: -1 },
  trick: { gap: 0.1, dur: 0.22, rise: 1 },
  egg: { gap: 0.12, dur: 0.42, rise: 0 }
});

/**
 * @param {string | null | undefined} who
 * @param {string} gesture
 * @returns {VoicePlan}
 */
export function voicePlan(who, gesture) {
  const person = CARRIER_TUNES[String(who || 'figure')] || CARRIER_TUNES.figure;
  const how = GESTURES[gesture] || GESTURES.catch;
  return {
    who: String(who || 'figure'),
    gesture,
    lean: person.lean,
    color: person.color,
    notes: person.steps.map((deg, i) => ({
      voice: person.voice,
      deg: Math.max(0, deg + how.rise),
      octave: 12,
      at: Number((i * how.gap).toFixed(3)),
      dur: how.dur,
      vol: 0.02,
      side: Number(((i - 1) * 0.12).toFixed(2))
    }))
  };
}

/**
 * Five ears, finest at the ends. open is the chapter. bright keeps a wider
 * pentatonic and the lift. warm sits in the room. near is a triad, close.
 * hush is that triad, shorter, and nothing above the room.
 * @type {Readonly<Record<string, { set: readonly number[] | null, quiet: number, cap: number, top: number, take: 'turn' | 'bright' | 'body' | 'soft' }>>}
 */
export const EARS = Object.freeze({
  open: { set: null, quiet: 1, cap: 9, top: 48, take: 'turn' },
  bright: { set: [0, 2, 4, 7, 9], quiet: 0.9, cap: 0.5, top: 24, take: 'bright' },
  warm: { set: [0, 2, 4, 7], quiet: 0.78, cap: 0.42, top: 12, take: 'body' },
  near: { set: [0, 4, 7], quiet: 0.66, cap: 0.32, top: 12, take: 'body' },
  hush: { set: [0, 4, 7], quiet: 0.5, cap: 0.22, top: 12, take: 'soft' }
});

const nearest = (deg, set) => set.reduce((best, step) => (Math.abs(step - deg) < Math.abs(best - deg) ? step : best), set[0]);

/**
 * How the ear wants a plan. open returns the same plan.
 * @param {VoicePlan | { notes?: Note[], lean?: string }} plan
 * @param {string} [ear]
 */
export function soften(plan, ear = 'open') {
  const how = EARS[ear] || EARS.open;
  if (!plan?.notes?.length || !how.set) return plan;
  return {
    ...plan,
    ear,
    notes: plan.notes.map((note) => ({
      ...note,
      deg: note.deg == null ? note.deg : nearest(note.deg, how.set),
      octave: Math.min(note.octave ?? 0, how.top),
      dur: Number(Math.min(note.dur, how.cap).toFixed(3)),
      vol: Number(((note.vol || 0.02) * how.quiet).toFixed(4))
    }))
  };
}

/**
 * Which recorded take to prefer. The library is the 21 CC0 takes already
 * decoded with the page. turn keeps the round robin. bright is the loudest
 * of an event, body the middle, soft the quietest. No new file is fetched.
 * @param {string} [ear]
 * @returns {'turn' | 'bright' | 'body' | 'soft'}
 */
export function takeSense(ear = 'open') {
  return (EARS[ear] || EARS.open).take;
}
