/**
 * spw-resonance.mjs — the literary register of the Spw grammar.
 *
 * One grammar, two registers. spwashi.com demonstrates what each operator
 * and container *does* (the engineering register: OPERATOR_ROLES and
 * CONTAINER_ROLES in spw-interactions.mjs, from the workbench spec) —
 * the engine room, digital, mechanical. lore.land shows what the same
 * sigil *means* in a story, and how a library would keep it — the
 * reading room, analog, bibliographic. `reading` is the story's sense,
 * `library` the stacks' sense. This module is
 * the literary half: no DOM, no imports, safe to load from anywhere — a
 * sibling site can `import { RESONANCE } from 'https://lore.land/book/
 * scripts/modules/spw-resonance.mjs'` and set the two readings side by side.
 *
 * Every reading names where lore.land already enacts it and a witness line
 * from the canon that does the thing without saying so.
 * Canon: .spw/surfaces/resonance.spw.
 */

export const RESONANCE_VERSION = '2026-09-26';

/** Operators, keyed by sigil. `role` joins to OPERATOR_ROLES[sigil].role. */
export const OPERATOR_RESONANCE = Object.freeze({
  '!': {
    role: 'action', name: 'the event',
    reading: 'Something happens that cannot be unhappened: a dig, a honk, a crack in the shell.',
    enacted: 'bonk voices; the beat a scene turns on',
    library: "Accession: an item enters the collection and the record changes for good.",
    witness: { chapter: 1, text: 'Then a sound came out of the grove. HONK.' }
  },
  '?': {
    role: 'probe', name: 'the question',
    reading: 'What the chapter asks and will not fully answer. It is how a reader leans in.',
    enacted: 'the "In which…" line under every title',
    library: "The reference interview: the question behind the question a reader brings to the desk.",
    witness: { chapter: 1, text: 'Why had nobody come to fetch it?' }
  },
  '~': {
    role: 'potential', name: 'the unspent',
    reading: 'What waits without being spent: a foreshadowing, a name held back, an egg not yet hatched.',
    enacted: 'foreshadow marks; the Egg itself',
    library: "On order, not yet shelved: held in the catalog before it can be borrowed.",
    witness: { chapter: 1, text: 'Inside the shell, an unspent wish waited.' }
  },
  '@': {
    role: 'perspective', name: 'whose eyes',
    reading: 'The vantage a reader borrows. Change it and the same room becomes another room.',
    enacted: 'voice blocks and their kickers; every scene’s vantage',
    library: "Provenance: who held it, and from which point of access it is found.",
    witness: { chapter: 1, text: 'Boof heard only the hum.' }
  },
  '&': {
    role: 'confluence', name: 'the meeting',
    reading: 'Two things meet and neither leaves unchanged: a motif crossing another, a trope sampled and returned.',
    enacted: 'trope marks; the trope ledger',
    library: "See also: the cross-reference that makes two shelves one subject.",
    witness: { chapter: 1, text: 'The egg’s hum slipped into time with it.' }
  },
  '*': {
    role: 'value', name: 'the cost made concrete',
    reading: 'An abstraction becomes a thing you can hold, pay, or chew.',
    enacted: 'Boof’s wages; the chapter’s closing ornament',
    library: "The copy in hand: the work becomes an item with a call number you can take down.",
    witness: { chapter: 1, text: 'Coin was difficult to chew.' }
  },
  '^': {
    role: 'integration', name: 'the turn',
    reading: 'A chapter binds upward into the serial. The last line leans into the next page.',
    enacted: 'the "Turn the page" card at every chapter’s end',
    library: "The series statement: this volume points to the next.",
    witness: { chapter: 1, text: 'She put her paw down and entered the trees.' }
  },
  '#': {
    role: 'annotation', name: 'the margin',
    reading: 'What is said about the story from outside it: marks, marginalia, references, a scribe’s note.',
    enacted: 'section marks; references; numbered paragraphs',
    library: "Subject headings and marginalia: description added from outside the text.",
    witness: { chapter: 1, text: 'The ink gathered into beads and rolled off the page.' }
  },
  '.': {
    role: 'ground', name: 'the ground',
    reading: 'What the story stands on from inside it: the setting, the light, the smell of the place.',
    enacted: 'scene sketches (vantage, light, scent, edges)',
    library: "The reading room and the physical description: what the book is made of, where you sit with it.",
    witness: { chapter: 1, text: 'Dawn smelled of frost and wet fur.' }
  },
  '=': {
    role: 'config', name: 'the lean',
    reading: 'Tone and pressure: which way a chapter leans without saying so.',
    enacted: 'the epigraph; climate tempo and tint',
    library: "The scope note: how a heading leans, what it includes and leaves out.",
    witness: { chapter: 1, text: 'A wish is not a thing. It is a direction the world has not agreed to turn yet.' }
  },
  '%': {
    role: 'measure', name: 'the cadence',
    reading: 'Pacing and count: how long a silence lasts, how many steps before the stop.',
    enacted: 'sentence rhythm; minutes per section',
    library: "Collation: pages, plates, extent — the count that proves nothing is missing.",
    witness: { chapter: 1, text: 'She sniffed. Stepped. Stopped.' }
  },
  '$': {
    role: 'substrate', name: 'the page itself',
    reading: 'The medium noticing it is a medium: a book aware of being read, a room the reader can tune.',
    enacted: 'the reading nook; the berry that notices the story it is in',
    library: "The catalog describing itself: a library that knows it is a library.",
    witness: { chapter: 0, text: 'Now and then one of them notices the story it is sitting in, which is more than most fruit will do.' }
  }
});

/** Containers, keyed by their opening brace. `name` joins to CONTAINER_ROLES. */
export const CONTAINER_RESONANCE = Object.freeze({
  '[': {
    pair: '[]', name: 'frame', literary: 'the shot',
    reading: 'A moment framed and put in order: a scene you could point a camera at, a line worth screenshotting.',
    library: "The plate: an illustration bound in order, listed so it can be found again.",
    enacted: 'pull quotes; shot-framed voices'
  },
  '{': {
    pair: '{}', name: 'body', literary: 'the chamber',
    reading: 'A section gathers weight as it goes and discharges it at its close.',
    library: "The bound unit: a chapter or volume, cataloged whole.",
    enacted: 'every numbered section (§01, §02…)'
  },
  '(': {
    pair: '()', name: 'scope', literary: 'the aside',
    reading: 'A held breath inside a sentence: a phrase in another voice, a parenthesis the story whispers.',
    library: "The footnote: a voice set beneath the text, still part of the page.",
    enacted: 'phrase voices inside paragraphs'
  },
  '<': {
    pair: '<>', name: 'capsule', literary: 'the letter',
    reading: 'A message with a sender and a receiver. Something is carried from here to there.',
    library: "The call slip: a request carried from reader to stacks and back.",
    enacted: 'the slip Boof carries to the Scriptorium; a link to one line'
  }
});

/**
 * The spirit sequence read as a chapter's spine (phases 0–6, then the
 * containers it passes through). A craft checklist for writing teams.
 */
export const SPIRIT_SPINE = Object.freeze([
  { sigil: '!', line: 'Something happens.' },
  { sigil: '?', line: 'The chapter asks.' },
  { sigil: '~', line: 'Something waits, unspent.' },
  { sigil: '@', line: 'We choose whose eyes.' },
  { sigil: '&', line: 'Two things meet.' },
  { sigil: '*', line: 'Something costs.' },
  { sigil: '^', line: 'The page turns.' }
]);

export function resonanceFor(sigil) {
  return OPERATOR_RESONANCE[sigil] || CONTAINER_RESONANCE[sigil] || null;
}
