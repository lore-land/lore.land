/**
 * glyph-discovery.mjs — Runtime module for progressive glyph unlocking.
 *
 * Reads the current chapter number and the glyph-tiers.json manifest
 * to determine which glyphs are unlocked. Applies data attributes
 * to Spw tokens that drive CSS shimmer effects for locked glyphs
 * and flash animations when glyphs are newly unlocked.
 */

const TIER_STORAGE_KEY = 'lore.experience.max-glyph-tier';
const TIERS_MANIFEST_PATH = '/book/fonts/glyph-tiers.json';

/**
 * Reads the highest tier the reader has previously reached.
 * @returns {number}
 */
function readMaxTier() {
    try {
        const stored = window.localStorage.getItem(TIER_STORAGE_KEY);
        return stored !== null ? Number(stored) : -1;
    } catch {
        return -1;
    }
}

/**
 * Writes the new max tier.
 * @param {number} tier
 */
function writeMaxTier(tier) {
    try {
        window.localStorage.setItem(TIER_STORAGE_KEY, String(tier));
    } catch {
        // silent
    }
}

/**
 * Determines the tier of a given character from the manifest.
 * @param {string} char
 * @param {Object} manifest
 * @returns {number} - tier number, or -1 if not in the font
 */
function charTier(char, manifest) {
    for (const [tier, info] of Object.entries(manifest)) {
        if (info.chars && info.chars.includes(char)) {
            return Number(tier);
        }
    }
    return -1;
}

/**
 * Initializes glyph discovery for a chapter.
 *
 * @param {HTMLElement} root — the chapter content container
 * @param {number} chapterTier — the current chapter's glyph tier (0–5)
 * @returns {Function} cleanup function
 */
export async function initGlyphDiscovery(root, chapterTier) {
    if (!root) return () => { };

    let manifest;
    try {
        const response = await fetch(TIERS_MANIFEST_PATH);
        manifest = await response.json();
    } catch {
        console.warn('Could not load glyph tier manifest.');
        return () => { };
    }

    const previousMaxTier = readMaxTier();
    const isNewDiscovery = chapterTier > previousMaxTier;

    if (chapterTier > previousMaxTier) {
        writeMaxTier(chapterTier);
    }

    // Mark Spw tokens with their locked/unlocked state
    const tokens = root.querySelectorAll('.spw-token, .spw-operator, .spw-brace');
    const justUnlocked = [];

    for (const token of tokens) {
        const text = token.textContent.trim();
        if (!text) continue;

        // Check each character in the token
        const maxCharTier = Math.max(
            ...Array.from(text).map(c => charTier(c, manifest))
        );

        if (maxCharTier < 0) continue; // not in the font, skip

        token.dataset.glyphTier = String(maxCharTier);

        if (maxCharTier > chapterTier) {
            // This glyph hasn't been discovered yet
            token.dataset.glyphLocked = 'true';
            token.setAttribute('title', 'This sigil will be discovered later…');
        } else {
            token.dataset.glyphLocked = 'false';

            // If this tier was just unlocked in this visit, flash it
            if (isNewDiscovery && maxCharTier > previousMaxTier) {
                justUnlocked.push(token);
            }
        }
    }

    // Stagger the unlock flash for newly discovered glyphs
    if (justUnlocked.length > 0) {
        justUnlocked.forEach((token, i) => {
            setTimeout(() => {
                token.dataset.glyphJustUnlocked = 'true';
                setTimeout(() => {
                    delete token.dataset.glyphJustUnlocked;
                }, 1000);
            }, i * 120);
        });
    }

    // Update the lifecycle breadcrumb with discovery state
    const breadcrumb = document.querySelector('.lifecycle-breadcrumb');
    if (breadcrumb) {
        const tierInfo = manifest[chapterTier];
        if (tierInfo) {
            breadcrumb.textContent = tierInfo.name;
            breadcrumb.dataset.stage = tierInfo.name;
            breadcrumb.title = `Glyph tier: ${tierInfo.name} — ${tierInfo.description}`;
        }
    }

    return () => {
        for (const token of tokens) {
            delete token.dataset.glyphTier;
            delete token.dataset.glyphLocked;
            delete token.dataset.glyphJustUnlocked;
        }
    };
}
