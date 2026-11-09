#!/usr/bin/env node
/**
 * book-check — no book file reaches main unless it passes (contract c026).
 *
 *   npm run book:check            check every chapter, the almanac and the serial
 *   npm run book:check -- 14 15   check only these chapters (plus the almanac)
 *
 * Checks, in the book's own vocabulary (book/schema/book-types.mjs):
 *   chapters   shape, known section and content types, leans
 *   slots      placeholders ↔ slots, clocks, variants, no wonder terms (c024)
 *   bracework  expression + gloss; read by the Spw interpreter (c025) — prose
 *              fallbacks are reported as notes, not errors
 *   rooms      every section of the flow has a room: a signature the Spw
 *              parser reads as op + one of the four containers + name +
 *              @keeper, a one-line air; status set|drafting, due a real day
 *   almanac    each wonder's shape; its terms appear in its home and echoes
 *   sightings  the anchor phrases the sightings loop listens for
 *   canon      compass words, wages, the withheld name
 *   serial     books are contiguous; the next stone is a date
 * Exit 1 on any error; warnings and notes print but pass.
 */
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEANS, CONTENT_TYPES, CANON_REFUSALS, ROOM_STATUSES, ROOM_AIR_MAX, canonicalText, termPattern, checkParagraphSlots, checkWonder, isCalendarDay
} from '../../schema/book-types.mjs';
import { CUSTOM_ELEMENT_TYPES } from '../modules/story-lexicon.mjs';
import { SIGHTINGS } from '../modules/sightings.mjs';
import { ROOM_KINDS, readRoom, roomShapeProblems } from '../modules/room-signature.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const pad = (n) => String(n).padStart(2, '0');

const errors = [];
const warnings = [];
const notes = [];
const error = (where, what) => errors.push(`${where}: ${what}`);
const warn = (where, what) => warnings.push(`${where}: ${what}`);

const files = (await readdir(resolve(ROOT, 'book/content/chapters'))).filter((f) => /^\d{2}\.json$/.test(f)).sort();
const only = process.argv.slice(2).map(Number).filter(Boolean);
const almanac = await read('book/content/world/almanac.json');
const serial = await read('book/content/serial.json');
const wonderTerms = almanac.wonders.flatMap((w) => w.terms.map(termPattern));
const SECTION_TYPES = new Set(['section', 'figure', ...CUSTOM_ELEMENT_TYPES]);
const isRoomBlock = (section) => section?.type === 'section' || CUSTOM_ELEMENT_TYPES.includes(section?.type);
const isPublished = (section) => section?.status !== 'drafting';

let parse = null;
try {
  ({ parse } = await import('../vendor/spw-seed.mjs'));
} catch {
  notes.push('Spw interpreter unavailable; bracework and room signatures are checked for shape only.');
}

/* Rooms (.spw/surfaces/rooms.spw): the signature, the air, and how it is released. */
function checkRoom(section, at, names) {
  const room = section.room;
  if (!room || typeof room !== 'object') {
    error(at, 'every section is a room: add "room": { "spw": "~{name}@keeper", "air": "…" }');
    return;
  }
  const reading = readRoom(room.spw);
  if (!reading) {
    error(at, `room.spw "${room.spw ?? ''}" is not a room signature — one sigil, then [ ] { } ( ) or < > around a snake_case name, then @keeper`);
  } else {
    if (!ROOM_KINDS[reading.kind]) error(at, `room.spw ${room.spw}: the container must be one of [ ] { } ( ) < >`);
    const problems = parse
      ? roomShapeProblems(reading, parse(room.spw, { lexProfile: 'prose' }))
      : roomShapeProblems(reading, { success: true, ast: {} }).filter((p) => !p.startsWith('the parser'));
    problems.forEach((p) => error(at, `room.spw ${room.spw}: ${p}`));
    if (names.has(reading.label)) error(at, `room.spw ${room.spw}: another room in this chapter is already called ${reading.label}`);
    names.add(reading.label);
  }
  if (typeof room.air !== 'string' || !room.air.trim()) error(at, 'room.air: one line of the room’s air');
  else if (/[\r\n]/.test(room.air)) error(at, 'room.air must be one line');
  else if (room.air.length > ROOM_AIR_MAX) warn(at, `room.air is ${room.air.length} characters — an air is one breath (≤ ${ROOM_AIR_MAX})`);
  if (section.status != null && !ROOM_STATUSES.includes(section.status)) error(at, `status must be ${ROOM_STATUSES.join(' | ')}`);
  if (section.due != null && !isCalendarDay(section.due)) error(at, `due "${section.due}" must be a calendar day, YYYY-MM-DD`);
  if (section.status === 'drafting' && section.due == null) error(at, 'a drafting room needs "due": "YYYY-MM-DD" — its door says the day it opens');
  if (section.due != null && section.status !== 'drafting') notes.push(`${at}: due ${section.due} on a room already set (only a drafting door shows it)`);
}

const chapters = [];
for (const file of files) {
  const n = Number(file.slice(0, 2));
  const where = `ch${pad(n)}`;
  let data;
  try {
    data = await read(`book/content/chapters/${file}`);
  } catch (e) {
    error(where, `invalid JSON — ${e.message}`);
    continue;
  }
  chapters.push(data);
  if (only.length && !only.includes(n)) continue;

  if (data.chapterNumber !== n) error(where, `chapterNumber ${data.chapterNumber} does not match the file`);
  ['title', 'description'].forEach((key) => { if (!data[key]) error(where, `missing ${key}`); });
  if (!Array.isArray(data.sections) || !data.sections.length) error(where, 'no sections');

  const roomNames = new Set();
  (data.sections || []).forEach((section, i) => {
    const at = `${where} §${i + 1}`;
    if (!SECTION_TYPES.has(section.type)) error(at, `unknown section type ${section.type}`);
    if (isRoomBlock(section)) checkRoom(section, at, roomNames);
    else if (section.room || section.status || section.due) error(at, 'a plate hangs in a room and is not one: room, status and due belong on a section or a voice');
    if (section.type === 'figure') return;
    (section.content || []).forEach((item, j) => {
      const here = `${at}.${j + 1}`;
      if (!CONTENT_TYPES.includes(item.type)) error(here, `unknown content type ${item.type}`);
      if (item.type === 'paragraph') {
        if (typeof item.text !== 'string') error(here, 'paragraph without text');
        if (item.lean && !LEANS.includes(item.lean)) error(here, `lean must be ${LEANS.join(' | ')}`);
        checkParagraphSlots(item, { wonderTerms }).forEach((p) => error(here, p));
        const words = canonicalText(item).split(/\s+/).filter(Boolean).length;
        if (words > 120) warn(here, `paragraph of ${words} words — split at a sentence turn`);
      }
      if (item.type === 'bracework') {
        if (!item.spw?.trim()) error(here, 'bracework without spw');
        if (!item.gloss?.trim()) error(here, 'bracework without a gloss');
        if (parse && item.spw) {
          const result = parse(item.spw, { lexProfile: 'prose' });
          if (!result.success) error(here, `the interpreter cannot read ${item.spw}`);
          else if (result.completeness?.proseFallback) notes.push(`${here}: the interpreter reads ${item.spw} as prose (honest fallback)`);
        }
      }
    });
  });

  // "At the table" (PLAN.E L19): optional, but if present, whole and true to the chapter.
  if (data.table) {
    const t = data.table;
    const at = `${where} table`;
    ['place', 'light', 'question'].forEach((key) => { if (!t[key]?.trim?.()) error(at, `missing ${key}`); });
    if (!Array.isArray(t.people) || t.people.length < 2 || t.people.length > 4 || t.people.some((p) => !p.name || !p.want || !p.voice)) error(at, 'people: 2–4 of {name, want, voice}');
    if (!Array.isArray(t.hooks) || t.hooks.length !== 3) error(at, 'hooks: exactly 3');
    if (!Array.isArray(t.encounters) || t.encounters.length !== 6) error(at, 'encounters: exactly 6 (a d6)');
    (t.finds || []).forEach((find) => {
      const wonder = almanac.wonders.find((w) => w.id === find.wonder);
      if (!wonder) error(at, `finds: unknown wonder ${find.wonder}`);
      else if (wonder.home !== n && !(wonder.echoes || []).includes(n)) error(at, `finds: ${find.wonder} does not live in this chapter`);
    });
    if (!t.bracework?.spw || !t.bracework?.does || !t.bracework?.costs) error(at, 'bracework: {spw, does, costs}');
    else if (parse) {
      const result = parse(t.bracework.spw, { lexProfile: 'prose' });
      if (result.completeness?.proseFallback) notes.push(`${at}: the interpreter reads ${t.bracework.spw} as prose`);
    }
    const blob = JSON.stringify(t);
    CANON_REFUSALS.forEach((refusal) => {
      const match = blob.match(refusal.pattern);
      if (match) error(at, `"${match[0]}" — ${refusal.why}`);
    });
  }

  const proseOfSections = (sections) => JSON.stringify(sections.map((s) => ({ ...s, content: (s.content || []).map((c) => (c.type === 'paragraph' ? { ...c, text: canonicalText(c), slots: undefined } : c)) })));
  // Canon holds for drafts too; sightings must be on the page, so drafting rooms do not count for them.
  const prose = proseOfSections(data.sections);
  const pageProse = proseOfSections(data.sections.filter(isPublished));
  CANON_REFUSALS.forEach((refusal) => {
    const match = prose.match(refusal.pattern);
    if (match) error(where, `"${match[0]}" — ${refusal.why}`);
  });
  SIGHTINGS.filter((s) => s.chapter === n && s.phrase).forEach((s) => {
    if (!pageProse.includes(s.phrase)) error(where, `sighting anchor removed: "${s.phrase}"`);
  });
}

/* The almanac: shape, and every wonder named in its home and each echo. */
const ids = new Set();
const proseOf = Object.fromEntries(chapters.map((c) => [c.chapterNumber,
  c.sections.filter(isPublished).flatMap((s) => (s.content || []).filter((x) => x.type === 'paragraph').map((x) => `${canonicalText(x)} ${(x.children || []).map((k) => k.text || '').join(' ')}`)).join(' ')]));
almanac.wonders.forEach((wonder) => {
  if (ids.has(wonder.id)) error('almanac', `duplicate id ${wonder.id}`);
  ids.add(wonder.id);
  checkWonder(wonder, { totalChapters: chapters.length }).forEach((p) => error('almanac', p));
  if (!wonder.prompt && wonder.kind !== 'saying') warn('almanac', `${wonder.id}: no plate prompt yet (PLAN.E L10)`);
  [wonder.home, ...(wonder.echoes || [])].forEach((n) => {
    if (only.length && !only.includes(n)) return;
    const text = proseOf[n] || '';
    if (!wonder.terms.some((t) => termPattern(t).test(text))) error(`ch${pad(n)}`, `${wonder.id} should be named here (${wonder.terms.join(' / ')})`);
  });
});

/* The tropes (book/content/world/tropes.json; .spw/surfaces/tropes.spw): the story and the lanes as strands of
 * one track. Each trope needs a face in both, its chambers published, its lanes kinds real cards, a crossing
 * each way (said, and wired when built); its reach (√(story² + lanes²) / √2), strength (reach × wired ÷ 2)
 * and status are said as a note, so the crossings still to lay stay in view. */
const tropes = await read('book/content/world/tropes.json');
const cardKinds = new Set([...(await readFile(resolve(ROOT, 'book/scripts/home/pie-cards.mjs'), 'utf8')).matchAll(/^\s+'?([a-z][\w-]*)'?:\s*\{\s*name:/gm)].map((m) => m[1]));
const referenceIds = new Set((await read('book/content/world/references.json')).entries.map((entry) => entry.id));
const tropeIds = new Set();
const track = { winding: [], 'one-way': [], parallel: [], stranded: [] };
const unit = (x) => typeof x === 'number' && x >= 0 && x <= 1;
(tropes.tropes || []).forEach((trope) => {
  const at = `tropes ${trope.id}`;
  if (tropeIds.has(trope.id)) error(at, 'duplicate id');
  tropeIds.add(trope.id);
  ['name', 'statement', 'prop', 'sigil'].forEach((key) => { if (!trope[key]) error(at, `missing ${key}`); });
  if (!unit(trope.presence?.story) || !unit(trope.presence?.lanes)) error(at, 'presence.story and presence.lanes must each be 0–1');
  if (!trope.faces?.story?.says || !trope.faces?.lanes?.says) error(at, 'needs a face in the story and one in the lanes');
  ['into_lanes', 'into_story'].forEach((way) => { if (!trope.crossings?.[way]?.says) error(at, `crossings.${way}.says: what crosses, even before it is wired`); });
  (trope.faces?.story?.chambers || []).forEach((n) => { if (!proseOf[n]) error(at, `story chamber ${n} is not a published chapter`); });
  (trope.faces?.lanes?.kinds || []).forEach((kind) => { if (!cardKinds.has(kind)) error(at, `lanes kind "${kind}" has no card in pie-cards.mjs`); });
  (trope.track || []).forEach((station, i) => {
    if (!['story', 'lanes'].includes(station.in) || !station.beat) error(at, `track[${i}]: needs in (story | lanes) and a beat`);
  });
  Object.values(trope.crossings || {}).forEach((crossing) => {
    const ref = String(crossing?.wired || '').match(/references\.json (rumour-[\w-]+)/);
    if (ref && !referenceIds.has(ref[1])) error(at, `crossing wired through unknown rumour ${ref[1]}`);
  });
});
(tropes.tropes || []).forEach((trope) => {
  (trope.rhymes || []).forEach((id) => { if (!tropeIds.has(id)) error(`tropes ${trope.id}`, `rhymes with unknown trope ${id}`); });
  const wired = ['into_lanes', 'into_story'].filter((way) => trope.crossings?.[way]?.wired).length;
  const story = trope.presence?.story || 0;
  const lanes = trope.presence?.lanes || 0;
  const status = !story || !lanes ? 'stranded' : wired === 2 ? 'winding' : wired === 1 ? 'one-way' : 'parallel';
  track[status].push(trope.id);
});
notes.push(`tropes: ${tropeIds.size} on the track — ${track.winding.length} winding, ${track['one-way'].length} one-way (${track['one-way'].join(', ')}), ${track.parallel.length} parallel, ${track.stranded.length} stranded; crossings to lay in .spw/surfaces/tropes.spw`);

/* The serial. */
const books = serial.books || [];
books.forEach((book, i) => {
  const next = books[i + 1];
  if (next && book.last != null && next.first !== book.last + 1) error('serial', `book ${next.number} does not follow book ${book.number}`);
});
if (serial.next && !/^\d{4}-\d{2}-\d{2}$/.test(serial.next.date || '')) error('serial', 'next.date must be YYYY-MM-DD');

const checked = only.length ? only.map(pad).join(', ') : `${chapters.length} chapters`;
notes.forEach((line) => console.log(`[book:check] note  ${line}`));
warnings.forEach((line) => console.log(`[book:check] warn  ${line}`));
errors.forEach((line) => console.log(`[book:check] ERROR ${line}`));
console.log(`[book:check] ${checked}, ${almanac.wonders.length} wonders — ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
