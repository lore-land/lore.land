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
