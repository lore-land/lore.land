/**
 * Glyph discovery tiers — the narrative arc of the font.
 *
 * Each tier maps to a moment in Boof's journey. The reader
 * unlocks new letterforms as they progress through chapters.
 *
 * Tier 0 (Prologue):   Vowels + space + period — Boof can only whisper
 * Tier 1 (Ch 1–3):     Consonants — Boof finds their voice
 * Tier 2 (Ch 4–6):     Uppercase + digits — the world takes shape
 * Tier 3 (Ch 7–9):     Punctuation + braces — structure emerges
 * Tier 4 (Ch 10–11):   Core Spw operators — the system awakens
 * Tier 5 (Ch 12–13):   Meta-sigils — full mastery
 */

export const TIERS = Object.freeze({
    0: { name: 'whisper', chapters: [0], description: 'Boof can only whisper' },
    1: { name: 'speak', chapters: [1, 2, 3], description: 'Boof finds their voice' },
    2: { name: 'shape', chapters: [4, 5, 6], description: 'The world takes shape' },
    3: { name: 'structure', chapters: [7, 8, 9], description: 'Structure emerges' },
    4: { name: 'awakening', chapters: [10, 11], description: 'Spw operators awaken' },
    5: { name: 'mastery', chapters: [12, 13], description: 'Meta-sigils — full mastery' }
});

/**
 * Returns the highest tier unlocked by a given chapter number.
 * @param {number} chapter — chapter number (1–13)
 * @returns {number} — tier (0–5)
 */
export function tierForChapter(chapter) {
    const ch = Number(chapter) || 0;
    if (ch >= 12) return 5;
    if (ch >= 10) return 4;
    if (ch >= 7) return 3;
    if (ch >= 4) return 2;
    if (ch >= 1) return 1;
    return 0;
}
