/**
 * chapter-spell.mjs — what a chapter is made of, said as one Spw spell, and
 * every expression it holds, kept as an inventory the reader fills in.
 *
 * The spell (describeChapter), one clause to a line, each with its gloss:
 *
 *   ^chapter[1]{
 *     .rooms[ ~{warm_furrow}@boof .[furrow_rim]@boof … ] its rooms, by motion and kind
 *     @told_by[narrator boof]                           whose eyes it is told through
 *     $ink $steam $berry                                its strongest materials
 *     *wonders{ @torch_ants $press_stones … }           wonders first met here
 *     &met[boof ants]                                   who is met here first
 *     =palette[pool]                                    the palette it is finished into
 *     ~berries{ boonberry baneberry $boneberry[…] }     its berries, and what a boneberry tastes of in it
 *     &harmonies[ <torch_ants roots> … ]                what keeps what, by Boof's nose
 *   }
 *
 * A wonder or a character not yet found is never named: its atom is veiled
 * as a probe that says where to look (?room_3), and its gloss counts it
 * among those still to find. Both the whole spell and its fully veiled form
 * must read whole with the real parser (spellProblems); the build refuses a
 * chapter whose spell does not.
 *
 * The inventory (chapterInventory) is every expression on the page, grouped
 * by its leading sigil: room signatures, the marks under a room's heading,
 * the makers' bracework, the wonders marked in the prose, the characters
 * first met, the berries named, the chapter's palette. The build prerenders
 * it collapsed at the chapter's end (renderChapterInventory); the page
 * lights what the reader has found (chapter-inventory.mjs).
 *
 * Host-neutral, like room-signature.mjs: the build, spw:export and the page
 * all import it. No window, no document; HTML is made through the `doc`
 * passed in. The page only uses spellText, glossFor and INVENTORY_SIGILS.
 */

import { planRooms, resolveSlots, padChapterNumber, chapterOrdinal } from './chapter-render.mjs?v=2026_11_08.J';
import { storyVoiceFor } from './story-lexicon.mjs?v=2026_09_26.A';
import { ROOM_KINDS, ROOM_RESERVED_WORDS, roomSentence, readRoom } from './room-signature.mjs?v=2026_11_08.J';

/* ─── Words ──────────────────────────────────────────────────────────── */

/** The twelve sigils in the order the inventory reads them, each with its role and what it holds. */
export const INVENTORY_SIGILS = Object.freeze([
  { sigil: '?', role: 'probe', holds: 'what asks' },
  { sigil: '~', role: 'potential', holds: 'what lasts, or might' },
  { sigil: '@', role: 'perspective', holds: 'whose eyes' },
  { sigil: '&', role: 'confluence', holds: 'what meets and stays itself' },
  { sigil: '*', role: 'value', holds: 'a thing made real' },
  { sigil: '^', role: 'integration', holds: 'what binds upward' },
  { sigil: '!', role: 'action', holds: 'what happens at once' },
  { sigil: '#', role: 'annotation', holds: 'what is said, or marked' },
  { sigil: '.', role: 'ground', holds: 'what stays where it is put' },
  { sigil: '=', role: 'config', holds: 'a lean, a way chosen' },
  { sigil: '%', role: 'measure', holds: 'how much' },
  { sigil: '$', role: 'substrate', holds: 'what it is made of' }
].map(Object.freeze));

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const countWord = (n) => NUMBER_WORDS[n] ?? String(n);
const capital = (text) => String(text).charAt(0).toUpperCase() + String(text).slice(1);
const lower = (text) => String(text).charAt(0).toLowerCase() + String(text).slice(1);

/** ['a', 'b', 'c'] → "a, b and c". */
export function listWords(words) {
  const list = words.filter(Boolean);
  if (list.length < 2) return list[0] || '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

const roomsWord = (rooms) => {
  const list = [...new Set(rooms.filter(Boolean))].sort((a, b) => a - b);
  if (!list.length) return '';
  return list.length === 1 ? `room ${list[0]}` : `rooms ${listWords(list.map(String))}`;
};

/** A label the Spw lexer reads as a name: snake_case, and never one of the valence words. */
export function spwLabel(text, { reserved = 'the_' } = {}) {
  const label = String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unnamed';
  const safe = /^[a-z]/.test(label) ? label : `n_${label}`;
  return ROOM_RESERVED_WORDS.includes(safe) ? `${reserved}${safe}` : safe;
}

/* ─── Reading a spell with what the reader has found ─────────────────── */

/**
 * Parts are strings and atoms ({ key, text, veil }): an atom whose key the
 * reader has not found is written as its veil, a probe that says where to look.
 */
export function spellText(parts, isFound = () => true) {
  return (parts || []).map((part) => (typeof part === 'string' ? part : (isFound(part.key) ? part.text : part.veil))).join('');
}

/** A clause's gloss in plain words, naming only what has been found. */
export function glossFor(gloss, isFound = () => true) {
  if (!gloss) return '';
  if (gloss.text) return gloss.text;
  const items = gloss.items || [];
  const found = items.filter((item) => isFound(item.key));
  const hidden = items.filter((item) => !isFound(item.key));
  const where = roomsWord(hidden.map((item) => item.room));
  const names = listWords(found.map((item) => item.name));
  if (gloss.kind === 'wonders') {
    if (!found.length) return `${capital(countWord(items.length))} ${items.length === 1 ? 'wonder is' : 'wonders are'} first met here${where ? `; look in ${where}` : ''}.`;
    if (!hidden.length) return `First met here: ${names}.`;
    return `First met here: ${names}; ${countWord(hidden.length)} more ${hidden.length === 1 ? 'is' : 'are'} still to find${where ? `, in ${where}` : ''}.`;
  }
  if (gloss.kind === 'met') {
    if (!found.length) return `${capital(countWord(items.length))} ${items.length === 1 ? 'is' : 'are'} met here for the first time${where ? `; look in ${where}` : ''}.`;
    if (!hidden.length) return `Met here for the first time: ${names}.`;
    return `Met here for the first time: ${names}; ${countWord(hidden.length)} more ${hidden.length === 1 ? 'is' : 'are'} still to meet${where ? `, in ${where}` : ''}.`;
  }
  return '';
}

/* ─── The world the chapter is read against ──────────────────────────── */

export const KIND_SIGIL = Object.freeze({ creature: '@', contrivance: '$', bracework: '&', saying: '#' });
const KIND_WORD = Object.freeze({ creature: 'a creature', contrivance: 'a contrivance', bracework: 'bracework', saying: 'a saying' });

const VOICE_WORDS = Object.freeze({
  narrator: 'the narrator', boof: 'Boof', boonberry: 'the boonberries', fool: 'the Fool', bonk: 'the bonk',
  puzzle: 'the shards', echo: 'an echo', paradox: 'a paradox', mirror: 'the mirror', song: 'a song',
  labyrinth: 'the labyrinth', shadow: 'a shadow', game: 'the fold', awakening: 'the bloom', path: 'the path',
  reflection: 'the record'
});

/* Where a character is first named, for the hint (collection.mjs NAMED turns the same cards; keep in step). */
const CHARACTER_CUES = Object.freeze({
  boof: /\bBoof\b/,
  ants: /\btorch-ants?\b/i,
  genie: /\bGenie\b/,
  bane: /\b(?:Mr\.?\s+)?BaneWAP\b/,
  boon: /\b(?:Mr\.?\s+)?BoonWAP\b/,
  bonewap: /\bBoneWAP\b/,
  porter: /\bporter\b/i,
  clerk: /\bfeast clerk\b/i,
  // Chapter 14 draws him before it names him ("A circle, under the hat"); NAMED's "plain lines" is not in its prose.
  figure: /\bplain lines\b|\bA circle, under the hat\b|\bthe figure\b/i
});
/* Character ids the lexer would read as valence words, named the way the book names them. */
const CHARACTER_LABELS = Object.freeze({ boon: 'boonwap', bane: 'banewap' });

/* The three berries: the card each turns (collection.mjs), and its expression. */
const BERRIES = Object.freeze([
  { id: 'boonberry', card: 'berry', cue: /\bboonberr(?:y|ies)\b/i, sigil: '~', name: 'Boonberries', spell: () => '~boonberry[foresees]', words: 'boonberries foresee' },
  { id: 'baneberry', card: 'baneberry', cue: /\bbaneberr(?:y|ies)\b/i, sigil: '~', name: 'Baneberries', spell: () => '~baneberry[foretells]', words: 'baneberries foretell' },
  { id: 'boneberry', card: 'boneberry', cue: /\bboneberr(?:y|ies)\b/i, sigil: '$', name: 'Boneberries', spell: (flavour) => `$boneberry[${spwLabel(flavour || 'what_it_shows')}]`, words: '' }
]);

const MARKS = Object.freeze([
  { attribute: 'data-motif', kind: 'motif', sigil: '#', word: 'a motif' },
  { attribute: 'data-trope', kind: 'trope', sigil: '&', word: 'a trope' },
  { attribute: 'data-foreshadow', kind: 'foreshadow', sigil: '~', word: 'a foreshadowing' }
]);

/** A wonder's short name for a sentence: "The council slab: &[…]" → "the council slab"; sayings in quotes. */
function wonderWords(wonder) {
  const short = String(wonder.name || wonder.id).split(':')[0].trim();
  return wonder.kind === 'saying' ? `a saying, “${short}”` : lower(short);
}

/* The prose a room holds, slots at their canonical words. */
function roomProse(section) {
  const out = [];
  const walk = (node) => (Array.isArray(node?.content) ? node.content : []).forEach((item) => {
    if (item.type === 'paragraph') out.push(`${resolveSlots(item)} ${(item.children || []).map((k) => k.text || k.content || '').join(' ')}`);
    else if (Array.isArray(item.content)) walk(item);
  });
  walk(section);
  return out.join(' ');
}

function bracework(section) {
  const out = [];
  const walk = (node) => (Array.isArray(node?.content) ? node.content : []).forEach((item) => {
    if (item.type === 'bracework' && item.spw) out.push(item);
    else if (Array.isArray(item.content)) walk(item);
  });
  walk(section);
  return out;
}

/** The chapter's rooms, each with its section, its prose and its place on the page. */
function readChapter(chapter) {
  const plan = planRooms(chapter);
  const rooms = [];
  (chapter.sections || []).forEach((section, index) => {
    const room = plan[index];
    if (room) rooms.push({ ...room, section, prose: room.drafting ? '' : roomProse(section) });
  });
  return { rooms, byId: new Map(rooms.map((room) => [room.id, room])) };
}

const firstRoomNaming = (rooms, cue) => rooms.find((room) => cue.test(room.prose))?.n || null;

/** Where each wonder is marked in this chapter: the semantic index's place, as a room. */
function wonderRoom(world, id, n, byId) {
  const place = (world.semantic?.wonders?.[id] || []).find((p) => p.c === n);
  return place ? { room: byId.get(place.id)?.n || null, anchor: place.id } : { room: null, anchor: null };
}

/* ─── The spell ──────────────────────────────────────────────────────── */

/* A long list breaks onto a new line every `per` atoms, but never before a ? or a # (or an atom whose
 * veil is one): at the start of a line the parser reads those as a directive or a comment, not an atom. */
const leadsLine = (atom) => (typeof atom === 'string' ? [atom] : [atom.text, atom.veil]).every((text) => !/^[?#]/.test(text));
function wrap(atoms, per, indent = '\n    ') {
  const out = [];
  let run = 0;
  atoms.forEach((atom, i) => {
    if (i > 0) {
      const breaks = run >= per && leadsLine(atom);
      out.push(breaks ? indent : ' ');
      run = breaks ? 0 : run;
    }
    out.push(atom);
    run += 1;
  });
  return out;
}

/**
 * The chapter, said as one Spw spell.
 * world: { almanac, semantic, characters, palettes, berries, harmonies } (the JSON files, parsed).
 * Returns { n, title, from, parts, text, veiled, clauses: [{ key, head, gloss }], explain }.
 */
export function describeChapter(chapter, world) {
  const n = Number(chapter.chapterNumber);
  const { rooms, byId } = readChapter(chapter);
  const prose = rooms.map((room) => room.prose).join(' ');
  const clauses = [];
  const explain = {};
  const say = (key, words) => { if (key && words && !explain[key]) explain[key] = words; };

  // .rooms — every room by its motion and its kind
  const signed = rooms.filter((room) => room.reading);
  if (signed.length) {
    const kinds = Object.values(ROOM_KINDS).map((kind) => [kind, signed.filter((room) => room.reading.kind === kind.id).length]).filter(([, c]) => c);
    kinds.sort((a, b) => b[1] - a[1]);
    const kindWords = kinds.map(([kind, c]) => (c === 1 ? `a ${kind.open} ${kind.close} ${kind.name}` : `${countWord(c)} ${kind.open} ${kind.close} ${kind.name}s`));
    const keepers = new Map();
    const keeperWords = (reading) => reading.keeper.replace(/^the fool$/, 'the Fool');
    signed.forEach((room) => keepers.set(keeperWords(room.reading), (keepers.get(keeperWords(room.reading)) || 0) + 1));
    const ranked = [...keepers.entries()].sort((a, b) => b[1] - a[1]);
    const keptBy = ranked.length === 1
      ? `all kept by ${ranked[0][0]}`
      : `${countWord(ranked[0][1])} kept by ${ranked[0][0]}, the rest by ${listWords(ranked.slice(1).map(([who]) => who))}`;
    const drafting = signed.filter((room) => room.drafting).length;
    const gloss = `${capital(countWord(signed.length))} ${signed.length === 1 ? 'room' : 'rooms'}: ${listWords(kindWords)}; ${keptBy}${drafting ? `; ${countWord(drafting)} still being written` : ''}.`;
    clauses.push({ key: 'rooms', head: '.rooms', parts: ['.rooms[ ', ...wrap(signed.map((room) => room.reading.spw), 3), ' ]'], gloss: { text: gloss } });
    say('rooms', 'The chapter’s rooms, each by its motion (the sigil) and its kind (the braces).');
    signed.forEach((room) => say(`${room.reading.op}${room.reading.open}${room.reading.label}${room.reading.close}`, roomSentence(room.reading)));
  }

  // @told_by — the voices, in the order they first speak
  const voices = [];
  rooms.forEach((room) => {
    if (room.drafting) return;
    const id = room.section.type === 'section' ? 'narrator' : (storyVoiceFor(room.section.type)?.id || room.section.type.replace('custom-', ''));
    if (!voices.includes(id)) voices.push(id);
  });
  if (voices.length) {
    const words = listWords(voices.map((id) => VOICE_WORDS[id] || id));
    clauses.push({ key: 'told_by', head: '@told_by', parts: [`@told_by[${voices.map((id) => spwLabel(id)).join(' ')}]`], gloss: { text: `Told by ${words}.` } });
    say('told_by', `Told by ${words}.`);
  }

  // $ — its strongest materials (semantic.json, materials.mjs)
  const materials = Object.entries(world.semantic?.materials || {})
    .map(([id, m]) => ({ id, label: m.label, gloss: m.gloss, n: m.chapters?.[String(n)]?.n || 0 }))
    .filter((m) => m.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  if (materials.length) {
    const words = materials.map((m) => m.label).join(', then ');
    clauses.push({ key: 'made_of', head: '$', parts: [materials.map((m) => `$${m.id}`).join(' ')], gloss: { text: `Made most of ${words}.` } });
    materials.forEach((m) => say(m.id, `${capital(m.label)}: ${m.gloss}.`));
  }

  // *wonders — first met here (almanac.json home), veiled until kept
  const homeWonders = (world.almanac?.wonders || []).filter((w) => w.home === n)
    .map((w) => ({ wonder: w, ...wonderRoom(world, w.id, n, byId) }))
    .sort((a, b) => (a.room || 99) - (b.room || 99));
  if (homeWonders.length) {
    const atoms = homeWonders.map(({ wonder, room }) => ({
      key: `wonder:${wonder.id}`,
      text: `${KIND_SIGIL[wonder.kind] || '*'}${spwLabel(wonder.id)}`,
      veil: room ? `?room_${room}` : '?here'
    }));
    clauses.push({
      key: 'wonders',
      head: '*wonders',
      parts: ['*wonders{ ', ...wrap(atoms, 4), ' }'],
      gloss: { kind: 'wonders', items: homeWonders.map(({ wonder, room }) => ({ key: `wonder:${wonder.id}`, name: wonderWords(wonder), room })) }
    });
    say('wonders', 'The wonders first met in this chapter: tap one where the prose names it and it goes into your almanac.');
    homeWonders.forEach(({ wonder }) => say(spwLabel(wonder.id), `${wonder.name.split(':')[0]}: ${KIND_WORD[wonder.kind] || wonder.kind} of ${wonder.region}.`));
  }

  // &met — characters first met here (characters.json first), veiled until met
  const firsts = (world.characters?.characters || []).filter((c) => c.first === n)
    .map((c) => ({ character: c, room: CHARACTER_CUES[c.id] ? firstRoomNaming(rooms, CHARACTER_CUES[c.id]) : null }));
  if (firsts.length) {
    const atoms = firsts.map(({ character, room }) => ({
      key: `character:${character.id}`,
      text: CHARACTER_LABELS[character.id] || spwLabel(character.id),
      veil: room ? `?room_${room}` : '?here'
    }));
    clauses.push({
      key: 'met',
      head: '&met',
      parts: ['&met[', ...wrap(atoms, 4), ']'],
      gloss: { kind: 'met', items: firsts.map(({ character, room }) => ({ key: `character:${character.id}`, name: /^(The|A|An) /.test(character.name) ? lower(character.name) : character.name, room })) }
    });
    say('met', 'Who you meet here for the first time.');
    firsts.forEach(({ character }) => say(CHARACTER_LABELS[character.id] || spwLabel(character.id), `${character.name}. ${character.line}`));
  }

  // =palette — the palette it is finished into (palettes.json)
  const palette = (world.palettes?.palettes || []).find((p) => p.chapter === n);
  if (palette) {
    const words = `Its palette is ${lower(palette.name)}, earned a layer at a time: ${lower(palette.gloss)}`;
    clauses.push({ key: 'palette', head: '=palette', parts: [`=palette[${spwLabel(palette.id)}]`], gloss: { text: words } });
    say('palette', words);
  }

  // ~berries — the berries named here, and what a boneberry tastes of in this place (berries.json)
  const bone = world.berries?.berries?.bone;
  const flavour = bone?.flavours?.[bone?.chapters?.[String(n)]] || '';
  const named = BERRIES.filter((berry) => berry.id !== 'boneberry' && berry.cue.test(prose));
  if (named.length || flavour) {
    const atoms = [...named.map((berry) => berry.id), ...(flavour ? [BERRIES[2].spell(flavour)] : [])];
    const sayings = named.map((berry) => berry.words);
    const words = `${sayings.length ? `Here ${listWords(sayings)}` : ''}${sayings.length && flavour ? '; a' : flavour ? 'A' : ''}${flavour ? ` boneberry in this chapter tastes of ${flavour}` : ''}.`;
    clauses.push({ key: 'berries', head: '~berries', parts: [`~berries{ ${atoms.join(' ')} }`], gloss: { text: words } });
    say('berries', words);
    say('boonberry', 'A boonberry foresees: it shows the way something will go well, a moment before it does.');
    say('baneberry', 'A baneberry foretells: it says what will go wrong, and it goes wrong because it was said.');
    if (flavour) say('boneberry', `A boneberry promises nothing and feeds you what it shows: in this chapter, ${flavour}.`);
  }

  // &harmonies — what keeps what (harmonies.json); those first told here lead, six at most
  const told = (world.harmonies?.harmonies || []).filter((h) => (h.chapters || []).includes(n));
  if (told.length) {
    const firstHere = (h) => Math.min(...h.chapters) === n;
    const chosen = [...told.filter(firstHere), ...told.filter((h) => !firstHere(h)).sort((a, b) => a.chapters.length - b.chapters.length)].slice(0, 6);
    const more = told.length - chosen.length;
    const atoms = chosen.map((h) => `<${spwLabel(h.from)} ${spwLabel(h.to)}>`);
    const words = `${chosen.map((h) => h.says).join(' ')}${more ? ` And ${countWord(more)} more on Boof’s map.` : ''}`;
    clauses.push({ key: 'harmonies', head: '&harmonies', parts: ['&harmonies[ ', ...wrap(atoms, 3), ' ]'], gloss: { text: words } });
    say('harmonies', 'What keeps what, as Boof knows it by nose: each < > a way one thing keeps another.');
  }

  const parts = [`^chapter[${n}]{`];
  clauses.forEach((clause) => parts.push('\n  ', ...clause.parts));
  parts.push('\n}');
  say('chapter', `${chapterOrdinal(n)}, ${chapter.title}: everything inside binds up into it.`);
  rooms.forEach((room) => say(`room_${room.n}`, `Something still to find, in room ${room.n}.`));
  say('here', 'Something still to find, somewhere in this chapter.');

  return {
    n,
    title: chapter.title,
    from: `lore.land · ${chapterOrdinal(n)}, ${chapter.title}`,
    parts,
    text: spellText(parts, () => true),
    veiled: spellText(parts, () => false),
    clauses: clauses.map(({ key, head, gloss }) => ({ key, head, gloss })),
    explain
  };
}

/**
 * Hold a spell to the real parser: whole, never prose, never a valence word read as a modifier.
 * `parse` is spw-seed's parse; returns a list of problems (empty: it reads whole).
 */
export function spellProblems(text, parse) {
  const result = parse(text, { lexProfile: 'prose' });
  const problems = [];
  if (!result.success) problems.push('the Spw parser cannot read it');
  if (!result.completeness?.complete) problems.push('the Spw parser does not read it whole');
  if (result.completeness?.proseFallback) problems.push('the Spw parser reads it as prose');
  const seen = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type) seen.add(node.type);
    Object.values(node).forEach(walk);
  };
  walk(result.ast);
  if (seen.has('ProseChunk')) problems.push('part of it is read as prose');
  if (seen.has('MODIFIER')) problems.push('a valence word in it is read as a modifier');
  return problems;
}

/* ─── The inventory ──────────────────────────────────────────────────── */

/**
 * Every Spw expression the chapter holds, each with where it lives and how it is found.
 * marked: the wonders marked on the page, in the order they are marked (build-chapters).
 * Item: { id, kind, sigil, spell, name, note, hint, room, href, look, key, drafting, colors }.
 *   id   the likeness id (room:01.3, wonder:torch-ants, character:boof, palette:pool, berry:boonberry, mark:01.3.motif, bracework:01.4)
 *   key  what the reader's own stores know it by (a wonder id, a character id, a card kind, a palette id)
 */
export function chapterInventory(chapter, world, { marked = null } = {}) {
  const n = Number(chapter.chapterNumber);
  const nn = padChapterNumber(n);
  const { rooms, byId } = readChapter(chapter);
  const total = rooms.length;
  const items = [];
  const at = (room) => (room ? `#${rooms[room - 1]?.id || ''}` : '');

  rooms.forEach((room) => {
    if (!room.reading) return;
    items.push({
      id: `room:${nn}.${room.n}`, kind: 'room', sigil: room.reading.op, spell: room.reading.spw,
      name: room.title || `The ${room.reading.place}`, note: room.air,
      hint: room.drafting ? 'Still being written.' : `Room ${room.n} of ${total}: read it to its end.`,
      room: room.n, href: at(room.n), look: at(room.n), key: String(room.n), drafting: room.drafting
    });
    if (room.drafting) return;
    MARKS.forEach((mark) => {
      const value = room.section[mark.attribute] || (mark.kind === 'trope' && room.section.type === 'custom-fool' ? 'trickster' : '');
      if (!value) return;
      items.push({
        id: `mark:${nn}.${room.n}.${mark.kind}`, kind: 'mark', sigil: mark.sigil, spell: `${mark.sigil}${mark.kind}[${spwLabel(value)}]`,
        name: String(value).replaceAll('-', ' '), note: `${capital(mark.word)}, marked under the room’s heading.`,
        hint: `${capital(mark.word)}, marked in room ${room.n}.`, room: room.n, href: at(room.n), look: at(room.n), key: String(room.n)
      });
    });
  });

  // The makers' bracework, unless an almanac wonder already keeps the same expression.
  const wonderTerms = new Set((world.almanac?.wonders || []).flatMap((w) => w.terms || []));
  rooms.forEach((room) => {
    if (room.drafting) return;
    bracework(room.section).forEach((block, i) => {
      const spw = String(block.spw).trim();
      if (wonderTerms.has(spw)) return;
      items.push({
        id: `bracework:${nn}.${room.n}${i ? `.${i + 1}` : ''}`, kind: 'bracework', sigil: '&', spell: spw,
        name: block.maker ? `Bracework, by ${block.maker}` : 'Bracework', note: block.gloss || '',
        hint: `Bracework in room ${room.n}: the makers’ notation.`, room: room.n, href: at(room.n), look: at(room.n), key: String(room.n)
      });
    });
  });

  // Wonders marked in the prose (the first time each is named here).
  const byWonder = new Map((world.almanac?.wonders || []).map((w) => [w.id, w]));
  const markedIds = marked ? [...marked] : Object.entries(world.semantic?.wonders || {}).filter(([, places]) => places.some((p) => p.c === n)).map(([id]) => id);
  markedIds.forEach((id) => {
    const wonder = byWonder.get(id);
    if (!wonder) return;
    const { room, anchor } = wonderRoom(world, id, n, byId);
    const braced = wonder.kind === 'bracework' ? (wonder.terms || []).find((t) => /^[?~@&*^!#.=%$]?[[{(<]/.test(t)) : null;
    items.push({
      id: `wonder:${id}`, kind: 'wonder', sigil: KIND_SIGIL[wonder.kind] || '*',
      spell: braced || `${KIND_SIGIL[wonder.kind] || '*'}${spwLabel(id)}{ .at[${spwLabel(wonder.region)}] }`,
      name: wonder.name, note: `${capital(KIND_WORD[wonder.kind] || wonder.kind)} of ${wonder.region}${wonder.home === n ? ', first met here' : ', and it returns here'}.`,
      hint: wonder.hint || `${capital(KIND_WORD[wonder.kind] || 'a wonder')}.`, room, href: anchor ? `#${anchor}` : at(room), look: anchor ? `#${anchor}` : at(room), key: id
    });
  });

  // Characters first met here.
  (world.characters?.characters || []).filter((c) => c.first === n).forEach((c) => {
    const room = CHARACTER_CUES[c.id] ? firstRoomNaming(rooms, CHARACTER_CUES[c.id]) : null;
    items.push({
      id: `character:${c.id}`, kind: 'character', sigil: '@', spell: c.spell,
      name: c.name, note: c.line,
      hint: room ? `Someone you meet in room ${room}.` : 'Someone you meet in this chapter.',
      room, href: at(room), look: at(room), key: c.id
    });
  });

  // Berries named here; a boneberry tastes of the place it grows.
  const bone = world.berries?.berries?.bone;
  const flavour = bone?.flavours?.[bone?.chapters?.[String(n)]] || '';
  BERRIES.forEach((berry) => {
    const room = firstRoomNaming(rooms, berry.cue);
    if (!room) return;
    items.push({
      id: `berry:${berry.id}`, kind: 'berry', sigil: berry.sigil, spell: berry.spell(flavour),
      name: berry.id === 'boneberry' && flavour ? `${berry.name}, tasting of ${flavour}` : berry.name,
      note: { boonberry: 'They foresee kindly.', baneberry: 'They foretell, and it comes true because it was said.', boneberry: 'They promise nothing, and feed you what they show.' }[berry.id],
      hint: `A berry, named in room ${room}.`, room, href: at(room), look: at(room), key: berry.card
    });
  });

  // The palette it is finished into.
  const palette = (world.palettes?.palettes || []).find((p) => p.chapter === n);
  if (palette) {
    items.push({
      id: `palette:${palette.id}`, kind: 'palette', sigil: '=', spell: `=palette[${spwLabel(palette.id)}]`,
      name: palette.name, note: palette.gloss,
      hint: 'Read the chapter to its end, and its first colour is yours.',
      room: null, href: '/almanac/#keepsakes', look: '', key: palette.id, colors: palette.colors
    });
  }

  const order = new Map(INVENTORY_SIGILS.map((s, i) => [s.sigil, i]));
  const groups = INVENTORY_SIGILS
    .map((meta) => ({ ...meta, items: items.filter((item) => item.sigil === meta.sigil).sort((a, b) => (a.room || 99) - (b.room || 99)) }))
    .filter((group) => group.items.length);
  items.sort((a, b) => order.get(a.sigil) - order.get(b.sigil));
  return { n, title: chapter.title, items, groups, total: items.filter((item) => !item.drafting).length };
}

/* ─── The page: prerendered, collapsed, at the chapter's end ─────────── */

const SIGIL_IDS = Object.freeze({ '?': 'probe', '~': 'potential', '@': 'perspective', '&': 'confluence', '*': 'value', '^': 'integration', '!': 'action', '#': 'annotation', '.': 'ground', '=': 'config', '%': 'measure', '$': 'substrate' });

function factory(doc) {
  return function h(tag, attrs = {}, ...children) {
    const node = doc.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === 'className') node.className = value;
      else if (key === 'dataset') Object.entries(value).forEach(([k, v]) => { if (v != null && v !== '') node.dataset[k] = String(v); });
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    children.flat().forEach((child) => { if (child != null && child !== false && child !== '') node.append(child); });
    return node;
  };
}

/* A room's visual is its kind; a wonder's, its kind's sigil; a palette's, its colours; a character's portrait is drawn by the page. */
function visual(h, item) {
  const base = { className: `inv-visual inv-visual--${item.kind}`, 'aria-hidden': 'true', dataset: { discovery: 'veiled' } };
  if (item.kind === 'room') {
    const reading = readRoom(item.spell);
    return h('span', { ...base, className: `${base.className} room-chip--${reading?.kind || 'room'} room-motion--${reading?.motion || 'ground'}` }, reading ? reading.glyph : '{ }');
  }
  if (item.kind === 'palette') {
    return h('span', base, ...['ground', 'ink', 'accent', 'glow', 'edge'].map((key) => h('i', { className: `inv-swatch is-${key}`, style: `--swatch: ${item.colors?.[key] || 'transparent'}` })));
  }
  if (item.kind === 'character') return h('span', { ...base, dataset: { discovery: 'veiled', portrait: item.key } });
  if (item.kind === 'berry') return h('span', { ...base, className: `${base.className} is-${item.id.split(':')[1]}` }, h('i', {}));
  return h('span', base, item.sigil);
}

function renderItem(h, item) {
  const shown = item.kind === 'room';   // a room's signature is its doorplate: never a secret
  return h('li', {
    className: `inv-item inv-item--${item.kind} is-veiled${item.drafting ? ' is-drafting' : ''}`,
    dataset: {
      invId: item.id, invKind: item.kind, invKey: item.key, invRoom: item.room || '', invSpell: item.spell,
      invName: item.name, invNote: item.note || '', invHref: item.href || '', invDrafting: item.drafting ? 'true' : ''
    }
  },
    visual(h, item),
    h('span', { className: 'inv-text' },
      h('span', { className: 'inv-expr' }, h('code', { className: shown ? 'inv-code' : 'inv-code is-veiled' }, shown ? item.spell : `${item.sigil} ?`)),
      h('span', { className: 'inv-hint' }, item.hint),
      item.look && !item.drafting ? h('a', { className: 'inv-where', href: item.look }, item.room ? `Look in room ${item.room}` : 'Look for it') : null),
    // Hook for likeness.mjs: a seal and a "find similar" button sit here.
    h('span', { className: 'inv-likeness', dataset: { likenessId: item.id } }));
}

/**
 * The inventory, collapsed at the chapter's end: the spell with its gloss beside it, then
 * every expression by sigil. Everything is drawn as nothing-yet-found; chapter-inventory.mjs
 * lights what the reader has found.
 */
export function renderChapterInventory(container, { description, inventory }, options = {}) {
  const doc = options.doc || container.ownerDocument;
  const h = factory(doc);
  const nn = padChapterNumber(inventory.n);
  const head = (group) => `inv-${nn}-${group.role}`;
  const details = h('details', { className: 'chapter-inventory', id: 'chapter-inventory', dataset: { component: 'chapter-inventory', chapter: String(inventory.n) } },
    h('summary', { className: 'inv-summary' },
      h('span', { className: 'inv-summary-sigil', 'aria-hidden': 'true' }, '^'),
      h('span', { className: 'inv-summary-words' },
        h('span', { className: 'inv-kicker' }, 'The chapter in Spw'),
        h('span', { className: 'inv-title' }, 'What it is made of, and what you have found of it')),
      h('span', { className: 'inv-count', dataset: { invCount: 'all' } }, `0 of ${inventory.total} found`)),
    h('div', { className: 'inv-body' },
      h('div', { className: 'inv-description' },
        h('div', {
          className: 'inv-spell',
          dataset: { spellParts: JSON.stringify(description.parts), spellExplain: JSON.stringify(description.explain), spellFrom: description.from }
        }, h('code', { className: 'inv-spell-source' }, description.veiled)),
        h('dl', { className: 'inv-gloss' }, ...description.clauses.map((clause) => h('div', {
          className: 'inv-gloss-row',
          dataset: { clause: clause.key, gloss: clause.gloss.items ? JSON.stringify(clause.gloss) : '' }
        },
          h('dt', {}, h('code', { className: `inv-gloss-head op-${SIGIL_IDS[clause.head[0]] || 'plain'}` }, clause.head)),
          h('dd', {}, glossFor(clause.gloss, () => false)))))),
      h('p', { className: 'inv-lede' }, 'Every expression the chapter holds, by its sigil. What you have found is lit, and takes you to where it lives; the rest say where to look.'),
      h('div', { className: 'inv-groups' }, ...inventory.groups.map((group) => h('div', { className: `inv-group op-${group.role}`, role: 'group', 'aria-labelledby': head(group), dataset: { sigil: group.sigil } },
        h('p', { className: 'inv-group-head', id: head(group) },
          h('span', { className: 'inv-group-sigil', 'aria-hidden': 'true' }, group.sigil),
          h('span', { className: 'inv-group-role' }, group.role),
          h('span', { className: 'inv-group-holds' }, group.holds),
          h('span', { className: 'inv-group-count', dataset: { invCount: group.sigil } }, `0 of ${group.items.filter((item) => !item.drafting).length}`)),
        h('ul', { className: 'inv-list' }, ...group.items.map((item) => renderItem(h, item))))))));
  container.append(details);
  return details;
}
