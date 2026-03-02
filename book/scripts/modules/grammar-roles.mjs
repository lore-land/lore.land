/**
 * grammar-roles.mjs — Maps custom elements to grammatical roles.
 *
 * Each custom element in the chapter behaves as a part of speech
 * in the narrative. This module assigns `data-spw-grammar` and
 * `data-spw-voice` attributes so CSS can style them and animations
 * can time them according to their narrative function.
 */

const GRAMMAR_ROLES = Object.freeze({
    'custom-boof': { grammar: 'narrator', voice: 'boof' },
    'custom-fool': { grammar: 'interlocutor', voice: 'fool' },
    'custom-boonberry': { grammar: 'modifier', voice: 'environment' },
    'custom-echo': { grammar: 'echo', voice: 'environment' },
    'custom-song': { grammar: 'melody', voice: 'environment' },
    'custom-paradox': { grammar: 'paradox', voice: 'fool' },
    'custom-labyrinth': { grammar: 'labyrinth', voice: 'environment' },
    'custom-shadow': { grammar: 'shadow', voice: 'fool' },
    'custom-game': { grammar: 'game', voice: 'environment' },
    'custom-puzzle': { grammar: 'puzzle', voice: 'environment' },
    'custom-bonk': { grammar: 'bonk', voice: 'environment' },
    'custom-awakening': { grammar: 'awakening', voice: 'boof' },
    'custom-path': { grammar: 'path', voice: 'boof' },
    'custom-reflection': { grammar: 'reflection', voice: 'boof' },
});

const SECTION_ROLES = Object.freeze({
    section: { grammar: 'predicate', voice: 'environment' },
    figure: { grammar: 'illustration', voice: 'environment' },
});

/**
 * Assigns grammar roles to all narrative elements within a root.
 *
 * Sets:
 * - data-spw-grammar: the grammatical role (narrator, interlocutor, etc.)
 * - data-spw-voice: the voice group (boof, fool, environment)
 *
 * @param {HTMLElement} root — the chapter content root
 */
export function assignGrammarRoles(root) {
    if (!root) return;

    // Custom elements
    for (const [tag, roles] of Object.entries(GRAMMAR_ROLES)) {
        const elements = root.querySelectorAll(tag);
        for (const el of elements) {
            el.dataset.spwGrammar = roles.grammar;
            el.dataset.spwVoice = roles.voice;
        }
    }

    // Standard sections and figures
    for (const [tag, roles] of Object.entries(SECTION_ROLES)) {
        const elements = root.querySelectorAll(tag);
        for (const el of elements) {
            if (!el.dataset.spwGrammar) {
                el.dataset.spwGrammar = roles.grammar;
                el.dataset.spwVoice = roles.voice;
            }
        }
    }
}
