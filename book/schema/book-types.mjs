/**
 * book-types.mjs — the book's types, named once (PLAN.E L13, L17).
 *
 * Vocabulary first, code second. These are the narrative and semiotic
 * abstractions every tool, renderer and future book shares: what a chapter,
 * section, paragraph, living slot and bracework block are; what a wonder is;
 * and the sign each of them makes. `npm run book:check` validates content
 * against them; generators (spw:trope-prompt, a future spw:scene-seed) read
 * them to propose seeds, never prose.
 *
 * Plain ES module, no dependencies: importable by Node tools and the browser.
 */

/** @typedef {'boon'|'bane'|'bone'} Lean — how a paragraph weighs (c023). */
/** @typedef {'minute'|'hour'|'day'} Clock — how often a living slot turns (c024). */
/** @typedef {'creature'|'contrivance'|'bracework'|'saying'} WonderKind — a saying carries a piece of the makers' philosophy (PLAN.E as theme). */
/** @typedef {'!'|'?'|'~'|'@'|'&'|'*'|'^'} Beat — what a section does (the spirit sequence). */

/**
 * @typedef {object} Slot
 * @property {Clock} clock
 * @property {string[]} variants — variants[0] is the canonical prose (c024)
 */

/**
 * @typedef {object} Paragraph
 * @property {'paragraph'} type
 * @property {string} text — may carry {{slot}} placeholders
 * @property {Record<string, Slot>} [slots]
 * @property {Lean} [lean]
 * @property {object[]} [children] — inline voices
 */

/**
 * @typedef {object} Bracework
 * @property {'bracework'} type
 * @property {string} spw — the makers' expression, read by the Spw interpreter (c025)
 * @property {string} gloss
 * @property {string} [maker]
 */

/**
 * @typedef {object} Wonder
 * @property {string} id
 * @property {string} name
 * @property {WonderKind} kind
 * @property {string} region
 * @property {string[]} terms — matched verbatim in the prose
 * @property {string} note
 * @property {string} hint
 * @property {number} home — the chapter that introduces it
 * @property {number[]} echoes — the chapters it returns in
 * @property {{vantage: string, light: string, scent: string, edges: string[], hint: string}} [prompt]
 * @property {string} [craft] — the workshop reading of a saying: what it teaches about style and development
 */

/**
 * A chapter's "At the table" page (PLAN.E L19): the place as an RPG location.
 * @typedef {object} Table
 * @property {string} place
 * @property {string} light
 * @property {{name: string, want: string, voice: string}[]} people — 2–4
 * @property {string[]} hooks — 3
 * @property {string[]} encounters — 6 (a d6)
 * @property {{wonder: string, use: string}[]} finds — 1–3 almanac ids living in the chapter
 * @property {{spw: string, does: string, costs: string}} bracework
 * @property {string} question
 */

/**
 * A Sign (Peirce, kept plain): the mark on the page, what the story means
 * by it, and what a witness leaves with. Wonders, sightings, bracework and
 * slots are all signs; a reader's almanac is a record of interpretants.
 * @typedef {object} Sign
 * @property {string} signifier
 * @property {string} signified
 * @property {string} [interpretant]
 */

/**
 * A scene seed (L17): Place × Voice × Beat × Lean, echoing a wonder already
 * met, leaving a remainder the next scene can inherit.
 * @typedef {object} SceneSeed
 * @property {string} place
 * @property {string} voice
 * @property {Beat} beat
 * @property {Lean} lean
 * @property {string[]} echoes — wonder ids
 * @property {string} remainder
 */

export const LEANS = Object.freeze(['boon', 'bane', 'bone']);
export const CLOCKS = Object.freeze(['minute', 'hour', 'day']);
export const WONDER_KINDS = Object.freeze(['creature', 'contrivance', 'bracework', 'saying']);
export const BEATS = Object.freeze(['!', '?', '~', '@', '&', '*', '^']);
export const CONTENT_TYPES = Object.freeze(['paragraph', 'pull', 'bracework']);
export const SLOT_PATTERN = /\{\{([a-z0-9-]+)\}\}/g;
export const SLOT_VARIANTS = Object.freeze({ min: 3, max: 6 });

/** Words the land never uses (canon): compass points, wages, the withheld name. */
export const CANON_REFUSALS = Object.freeze([
  { pattern: /\b(east|west|north|south)(ern|ward)?\b/i, why: 'Boon.land has no cardinal directions — dawnward, hearthward, duskward.' },
  { pattern: /\bwages?\b/i, why: 'Boof works for the land; nobody pays her.' },
  { pattern: /\bWAPboy\b/, why: 'The figure under the hat is not named in the prose.' }
]);

/** The paragraph's canonical text: every {{slot}} resolved to its variant zero. */
export function canonicalText(paragraph) {
  const text = String(paragraph?.text || '');
  if (!paragraph?.slots) return text;
  return text.replace(SLOT_PATTERN, (_match, name) => paragraph.slots[name]?.variants?.[0] ?? '');
}

/** Whole-word, case-insensitive for word terms; exact for sigil-led bracework terms. */
export function termPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lead = /^[\p{L}\p{N}]/u.test(term) ? '(?<![\\p{L}\\p{N}-])' : '';
  const tail = /[\p{L}\p{N}]$/u.test(term) ? '(?![\\p{L}\\p{N}-])' : '';
  return new RegExp(`${lead}${escaped}${tail}`, /^\p{L}/u.test(term) ? 'iu' : 'u');
}

/** Validate one living slot. Returns a list of problems. */
export function checkSlot(name, slot, { wonderTerms = [] } = {}) {
  const problems = [];
  if (!CLOCKS.includes(slot?.clock)) problems.push(`slot ${name}: clock must be ${CLOCKS.join(' | ')}`);
  const variants = slot?.variants;
  if (!Array.isArray(variants) || variants.length < SLOT_VARIANTS.min || variants.length > SLOT_VARIANTS.max) {
    problems.push(`slot ${name}: needs ${SLOT_VARIANTS.min}–${SLOT_VARIANTS.max} variants`);
    return problems;
  }
  if (!variants.every((v) => typeof v === 'string' && v.trim())) problems.push(`slot ${name}: empty variant`);
  if (new Set(variants).size !== variants.length) problems.push(`slot ${name}: duplicate variants`);
  variants.forEach((variant, index) => {
    if (/\{\{|\}\}/.test(variant)) problems.push(`slot ${name}: braces inside a variant`);
    CANON_REFUSALS.forEach((refusal) => {
      if (refusal.pattern.test(variant)) problems.push(`slot ${name}: "${variant}" — ${refusal.why}`);
    });
    if (wonderTerms.some((pattern) => pattern.test(variant))) {
      problems.push(`slot ${name}: ${index === 0 ? 'the canonical words' : `variant ${index}`} name an almanac wonder; slots never carry wonder terms`);
    }
  });
  return problems;
}

/** Validate a paragraph's slots against its placeholders. */
export function checkParagraphSlots(paragraph, options = {}) {
  const problems = [];
  const text = String(paragraph?.text || '');
  const names = [...text.matchAll(SLOT_PATTERN)].map((m) => m[1]);
  const slots = paragraph?.slots || {};
  if (names.length !== new Set(names).size) problems.push('a placeholder is used twice in one paragraph');
  names.filter((n) => !slots[n]).forEach((n) => problems.push(`placeholder {{${n}}} has no slot`));
  Object.keys(slots).filter((n) => !names.includes(n)).forEach((n) => problems.push(`slot ${n} is never placed`));
  Object.entries(slots).forEach(([name, slot]) => problems.push(...checkSlot(name, slot, options)));
  return problems;
}

/** Validate an almanac wonder's own shape (cross-checks against prose live in book-check). */
export function checkWonder(wonder, { totalChapters = Infinity } = {}) {
  const problems = [];
  ['id', 'name', 'region', 'note', 'hint'].forEach((key) => {
    if (typeof wonder?.[key] !== 'string' || !wonder[key].trim()) problems.push(`${wonder?.id || '?'}: missing ${key}`);
  });
  if (!WONDER_KINDS.includes(wonder?.kind)) problems.push(`${wonder?.id}: kind must be ${WONDER_KINDS.join(' | ')}`);
  if (!Array.isArray(wonder?.terms) || !wonder.terms.length) problems.push(`${wonder?.id}: needs terms`);
  const inBook = (n) => Number.isInteger(n) && n >= 1 && n <= totalChapters;
  if (!inBook(wonder?.home)) problems.push(`${wonder?.id}: home ${wonder?.home} is not a chapter`);
  (wonder?.echoes || []).forEach((n) => { if (!inBook(n)) problems.push(`${wonder.id}: echo ${n} is not a chapter`); });
  if (wonder?.kind === 'saying' && (typeof wonder.craft !== 'string' || !wonder.craft.trim())) problems.push(`${wonder.id}: a saying needs its craft reading`);
  if (wonder?.prompt) {
    ['vantage', 'light', 'scent', 'hint'].forEach((key) => {
      if (typeof wonder.prompt[key] !== 'string' || !wonder.prompt[key].trim()) problems.push(`${wonder.id}: prompt.${key} missing`);
    });
    if (!Array.isArray(wonder.prompt.edges) || wonder.prompt.edges.length < 2) problems.push(`${wonder.id}: prompt.edges needs 2–4 details`);
  }
  return problems;
}
