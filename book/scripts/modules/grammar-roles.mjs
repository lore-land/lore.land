/**
 * grammar-roles.mjs — Maps story voices to grammatical roles.
 *
 * Each custom element in the chapter behaves as a part of speech
 * in the narrative. Voice metadata lives in story-lexicon.mjs so
 * kickers, motion, and this module cannot drift.
 */

import { STORY_VOICES } from './story-lexicon.mjs?v=2026_09_07.A';

const SECTION_ROLES = Object.freeze({
  section: { grammar: 'predicate', voice: 'environment' },
  figure: { grammar: 'illustration', voice: 'environment' }
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

  for (const [tag, meta] of Object.entries(STORY_VOICES)) {
    const elements = root.querySelectorAll(tag);
    for (const el of elements) {
      if (!el.dataset.spwGrammar) {
        el.dataset.spwGrammar = meta.grammar;
      }
      if (!el.dataset.spwVoice) {
        el.dataset.spwVoice = meta.voice;
      }
    }
  }

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
