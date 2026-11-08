/**
 * room-signature.mjs — a room's Spw signature, read one way everywhere.
 *
 * A room is one section of a chapter: the unit the story is read, kept and
 * released in. Each carries a signature, one Spw expression, in its chapter
 * JSON (`room.spw`) beside a one-line `air`:
 *
 *     ~{warm_furrow}@boof
 *     │││           └── who keeps the room (postfix @, the observer)
 *     ││└── the room's name, snake_case, read as "the warm furrow"
 *     │└── the container says what kind of room it is
 *     └── one operator: the room's motion
 *
 * The four containers are the almanac bench's (home/almanac-page.mjs):
 * a window you may only look into, a room you stand in for a minute, a
 * gathering where everything arrives together, a passage you go through.
 *
 * Host-neutral (the build, book:check and the page all import it): no DOM,
 * no window. `readRoom` reads the shape the page renders; `roomShapeProblems`
 * holds a parse from the real Spw parser to that shape, because the parser
 * accepts some signatures by reading them as something else (see
 * .spw/surfaces/rooms.spw#parser_notes).
 */

export const ROOM_KINDS = Object.freeze({
  window: Object.freeze({
    id: 'window', open: '[', close: ']', node: 'Frame', name: 'window',
    lead: 'A window. You may only look in.',
    door: (place) => `Up to the [ ] window on the ${place}`
  }),
  room: Object.freeze({
    id: 'room', open: '{', close: '}', node: 'Body', name: 'room',
    lead: 'A room. You may stand in it for a minute.',
    door: (place) => `Into the { } room of the ${place}`
  }),
  gathering: Object.freeze({
    id: 'gathering', open: '(', close: ')', node: 'Scope', name: 'gathering',
    lead: 'A gathering. Everything in it has to arrive together.',
    door: (place) => `Into the ( ) gathering at the ${place}`
  }),
  passage: Object.freeze({
    id: 'passage', open: '<', close: '>', node: 'Capsule', name: 'passage',
    lead: 'A passage. You may go through it, never stay.',
    door: (place) => `Through the < > passage to the ${place}`
  })
});

const KIND_BY_OPEN = Object.freeze(Object.fromEntries(Object.values(ROOM_KINDS).map((kind) => [kind.open, kind])));

/** The room's motion: one of the twelve sigils, by its role (spw-interactions.mjs OPERATOR_ROLES). */
export const ROOM_MOTIONS = Object.freeze({
  '~': Object.freeze({ id: 'potential', gloss: 'something not yet happened' }),
  '&': Object.freeze({ id: 'confluence', gloss: 'things meeting and staying themselves' }),
  '!': Object.freeze({ id: 'action', gloss: 'something fires' }),
  '?': Object.freeze({ id: 'probe', gloss: 'a question put to the place' }),
  '^': Object.freeze({ id: 'integration', gloss: 'a lift, a binding upward' }),
  '#': Object.freeze({ id: 'annotation', gloss: 'something written down' }),
  '.': Object.freeze({ id: 'ground', gloss: 'what stays where it is put' }),
  '=': Object.freeze({ id: 'lean', gloss: 'a lean, a way chosen' }),
  '*': Object.freeze({ id: 'value', gloss: 'a thing made real' }),
  '%': Object.freeze({ id: 'measure', gloss: 'a weighing' }),
  '$': Object.freeze({ id: 'substrate', gloss: 'what lies underneath' }),
  '@': Object.freeze({ id: 'perspective', gloss: 'a way of looking' })
});

/** The valence pentad: the Spw lexer reads these whole words as modifiers, not names. */
export const ROOM_RESERVED_WORDS = Object.freeze(['boon', 'bane', 'bone', 'bonk', 'honk']);

/* Pairs the parser accepts but reads as something else: a probe or an
 * annotation followed by these containers swallows the rest of the line as
 * prose, so the room would have no name and no keeper. */
export const ROOM_UNREADABLE = Object.freeze(['?<', '#(', '#<']);

const SIGNATURE = /^([~&!?^#.=*%$@])([[{(<])([a-z][a-z0-9_]*)([\]})>])@([a-z][a-z0-9_]*)$/;

const KEEPERS = Object.freeze({
  boof: 'Boof',
  genie: 'the Genie',
  boonwap: 'Mr. BoonWAP',
  banewap: 'Mr. BaneWAP',
  bonewap: 'Mx. BoneWAP'
});

/** "warm_furrow" → "warm furrow" (doors say "the warm furrow"). */
export function roomPlace(label) {
  return String(label || '').replaceAll('_', ' ');
}

/** "the_land" → "the land"; known names are capitalised the way the book writes them. */
export function roomKeeper(who) {
  return KEEPERS[who] || roomPlace(who);
}

/**
 * Read a signature into its parts, or null when it is not one room's shape.
 * @param {string} spw
 * @returns {{ spw: string, op: string, motion: string, gloss: string, kind: string, open: string, close: string, glyph: string, label: string, place: string, who: string, keeper: string, lead: string } | null}
 */
export function readRoom(spw) {
  const match = SIGNATURE.exec(String(spw || '').trim());
  if (!match) return null;
  const [, op, open, label, close, who] = match;
  const kind = KIND_BY_OPEN[open];
  if (!kind || kind.close !== close) return null;
  return {
    spw: match[0],
    op,
    motion: ROOM_MOTIONS[op].id,
    gloss: ROOM_MOTIONS[op].gloss,
    kind: kind.id,
    open,
    close,
    glyph: `${open} ${close}`,
    label,
    place: roomPlace(label),
    who,
    keeper: roomKeeper(who),
    lead: kind.lead
  };
}

/** The door at the end of a room, phrased by the kind of the room it opens onto. */
export function roomDoor(reading) {
  return reading ? ROOM_KINDS[reading.kind].door(reading.place) : '';
}

/** One plain sentence for a screen reader: what the signature says, without the sigils. */
export function roomSentence(reading) {
  if (!reading) return '';
  return `${ROOM_KINDS[reading.kind].lead} Its motion is ${reading.motion}: ${reading.gloss}. It is ${reading.keeper === 'Boof' ? 'Boof’s' : `kept by ${reading.keeper}`}.`;
}

/**
 * Hold the real parser's reading of a signature to the room's shape.
 * `parsed` is the result of spw-seed's parse(spw, { lexProfile: 'prose' }).
 * Returns a list of problems; empty means the parser read what the page reads.
 */
export function roomShapeProblems(reading, parsed) {
  if (!reading) return ['not a room signature: op + [ ] { } ( ) < > around a snake_case name, then @keeper'];
  const problems = [];
  ROOM_UNREADABLE.forEach((pair) => {
    if (reading.spw.startsWith(pair)) problems.push(`${pair}…${reading.close} reads as prose, not a room`);
  });
  [reading.label, reading.who].forEach((word) => {
    if (ROOM_RESERVED_WORDS.includes(word)) problems.push(`"${word}" is a valence modifier, not a name`);
  });
  if (!parsed?.success) {
    problems.push('the Spw parser cannot read it');
    return problems;
  }
  if (parsed.completeness?.proseFallback) problems.push('the Spw parser reads it as prose');
  const seen = { ops: new Set(), nodes: new Set(), identifiers: new Set(), references: new Set(), prose: false, modifiers: false };
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    switch (node.type) {
      case 'Operation': seen.ops.add(node.operator?.value); break;
      case 'Identifier': seen.identifiers.add(node.token?.value); break;
      case 'Reference': seen.references.add(node.raw); break;
      case 'ProseChunk': seen.prose = true; break;
      case 'MODIFIER': seen.modifiers = true; break;
      default: break;
    }
    if (['Frame', 'Body', 'Scope', 'Capsule'].includes(node.type)) seen.nodes.add(node.type);
    Object.values(node).forEach(walk);
  };
  walk(parsed.ast);
  if (seen.prose) problems.push('part of it is read as prose');
  if (seen.modifiers) problems.push('part of it is read as a valence modifier');
  if (!seen.ops.has(reading.op)) problems.push(`the parser does not see ${reading.op} as the room’s motion`);
  if (!seen.nodes.has(ROOM_KINDS[reading.kind].node)) problems.push(`the parser does not see a ${reading.glyph} ${reading.kind}`);
  if (!seen.identifiers.has(reading.label)) problems.push(`the parser does not see ${reading.label} as the room’s name`);
  if (!seen.references.has(reading.who)) problems.push(`the parser does not see @${reading.who} as its keeper`);
  return problems;
}
