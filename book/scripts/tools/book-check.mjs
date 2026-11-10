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
import { access, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEANS, CONTENT_TYPES, CANON_REFUSALS, ROOM_STATUSES, ROOM_AIR_MAX, canonicalText, termPattern, checkParagraphSlots, checkWonder, isCalendarDay
} from '../../schema/book-types.mjs';
import { CUSTOM_ELEMENT_TYPES } from '../modules/story-lexicon.mjs';
import { SIGHTINGS } from '../modules/sightings.mjs';
import { ROOM_KINDS, readRoom, roomShapeProblems } from '../modules/room-signature.mjs';
import { packProblems } from '../modules/packs.mjs';
import { readLevels } from '../home/pie-rhythm.mjs';
import { readMotifs, motifNotes } from '../home/pie-tropes.mjs';
import { parseWay, waySpell } from '../modules/way-through.mjs';
import { CHARACTERS, REASONS } from '../modules/characters.mjs';
import { readMechanics } from '../modules/unlocks.mjs';
import { CLIENT, clientProblems } from './feedback-client.mjs';
import { existsSync } from 'node:fs';
import { CARD_MUTATIONS, ICON_MUTATIONS, SOUND_MUTATIONS, missingMutations, mutationEdge, readSidecar } from '../modules/asset-sidecar.mjs';

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
let readBias = null;
try {
  ({ parse, readBias } = await import('../vendor/spw-seed.mjs'));
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
const plateChecks = [];
const proseOf = Object.fromEntries(chapters.map((c) => [c.chapterNumber,
  c.sections.filter(isPublished).flatMap((s) => (s.content || []).filter((x) => x.type === 'paragraph').map((x) => `${canonicalText(x)} ${(x.children || []).map((k) => k.text || '').join(' ')}`)).join(' ')]));
almanac.wonders.forEach((wonder) => {
  if (ids.has(wonder.id)) error('almanac', `duplicate id ${wonder.id}`);
  ids.add(wonder.id);
  checkWonder(wonder, { totalChapters: chapters.length }).forEach((p) => error('almanac', p));
  if (!wonder.prompt && wonder.kind !== 'saying') warn('almanac', `${wonder.id}: no plate prompt yet (PLAN.E L10)`);
  // A plate (a drawn study until it is painted) is a file the cards show: it must be there, in a state the cards know.
  if (wonder.plate) plateChecks.push(access(resolve(ROOT, wonder.plate.src.replace(/^\//, '')))
    .then(() => { if (!['study', 'public'].includes(wonder.plate.state)) error('almanac', `${wonder.id}: plate state should be study or public`); })
    .catch(() => error('almanac', `${wonder.id}: plate ${wonder.plate.src} is missing`)));
  // Made in the lanes (an artifact a carry's deed makes), a wonder is not named in the prose: it is kept by play.
  if (wonder.made_in === 'lanes') return;
  [wonder.home, ...(wonder.echoes || [])].forEach((n) => {
    if (only.length && !only.includes(n)) return;
    const text = proseOf[n] || '';
    if (!wonder.terms.some((t) => termPattern(t).test(text))) error(`ch${pad(n)}`, `${wonder.id} should be named here (${wonder.terms.join(' / ')})`);
  });
});
await Promise.all(plateChecks);

/* A runtime .spw file as the Spw interpreter reads it: each !block{} as [id, fields] pairs, a field keyed by its sigil
 * and label (%tempo, @theme, ~ for a path) and holding its frame's values, or the fields of its own body. */
function spwBlocks(text) {
  const result = parse(text, { lexProfile: 'prose' });
  if (!result?.completeness?.complete || result.completeness.proseFallback) return null;
  const exprs = (body) => body?.sequence?.expressions || [];
  const unquote = (s) => String(s ?? '').replace(/^"(.*)"$/s, '$1');
  const valueOf = (p) => {
    const v = p?.value;
    if (v?.type === 'Literal') return unquote(v.token?.value);
    // The valence words (bone boon bane bonk honk) are modifiers in the grammar: [honk] is a modifier, not a name.
    if (v?.type === 'Expression') return [...(v.terms || []).map((t) => t.token?.value ?? t.raw ?? ''), ...(v.modifiers?.modifiers || []).map((x) => x.value)].join(' ');
    return '';
  };
  const fieldsOf = (body) => {
    const out = {};
    exprs(body).forEach((e) => e.terms.forEach((t) => {
      if (t.type === 'PathRef') { out['~'] = [unquote(t.path?.token?.value)]; return; }
      // An @label[...] reads as a reference whose frame sits on its expression; the other sigils as operations.
      const op = t.type === 'Reference' ? '@' : t.operator?.value;
      const label = t.type === 'Reference' ? t.raw : t.operatorLabel?.value;
      if (!op || !label) return;
      const frame = t.frame || e.frame;
      out[op + label] = !frame && t.body ? fieldsOf(t.body) : (frame?.content || []).map(valueOf);
    }));
    return out;
  };
  const blocks = {};
  exprs(result.ast?.expression ? { sequence: result.ast.expression } : null).forEach((e) => e.terms.forEach((t) => {
    if (t.type === 'Operation' && t.operator?.value === '!' && t.operatorLabel) {
      blocks[t.operatorLabel.value] = exprs(t.body).flatMap((x) => x.terms).filter((x) => x.operatorLabel).map((x) => [x.operatorLabel.value, fieldsOf(x.body)]);
    }
  }));
  return blocks;
}

/* The levels as the Spw interpreter reads them, in the small reader's shape, so the two reads can be compared: the
 * game reads the file with the small reader (at once, no parser to wait for), and this holds it to the grammar. */
function parsedLevels(text) {
  const blocks = spwBlocks(text);
  if (!blocks) return null;
  const levels = {};
  (blocks.levels || []).forEach(([id, f]) => {
    const n = Number(id.replace(/\D/g, ''));
    if (!n) return;
    levels[n] = {
      tempo: Number(f['%tempo']?.[0]) || null,
      root: Number(f['%root']?.[0]) || null,
      swing: Number(f['%swing']?.[0]) || null,
      motif: (f['~motif'] || []).map(Number).filter(Number.isFinite),
      theme: f['@theme']?.[0] ?? null,
      rhythm: f['*rhythm']?.[0] ?? null,
      room: f['.room']?.[0] ?? null
    };
  });
  const rhythms = {};
  (blocks.rhythms || []).forEach(([id, f]) => {
    rhythms[id] = {
      steps: f['.steps']?.[0] ?? '',
      voice: f['!voice']?.[0] ?? 'tock',
      chapter: Number(f['&chapter']?.[0]) || null,
      name: f['#name']?.[0] ?? id,
      says: f['#says']?.[0] ?? '',
      ref: f['~']?.[0] ?? null
    };
  });
  return { levels, rhythms };
}

/* The game's levels (.spw/runtime/pie-levels.spw; pie-rhythm.mjs): every chapter has one, every level's rhythm
 * exists and is sixteen steps, the room it hides in is a room of that chapter, and the game's small reader reads
 * the file as the Spw interpreter does. */
{
  const levelsText = await readFile(resolve(ROOT, '.spw/runtime/pie-levels.spw'), 'utf8');
  const { levels, rhythms } = readLevels(levelsText);
  if (parse) {
    const parsed = parsedLevels(levelsText);
    if (!parsed) error('levels', 'pie-levels.spw does not read whole with the Spw interpreter (it fell back to prose)');
    else {
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      new Set([...Object.keys(levels), ...Object.keys(parsed.levels)]).forEach((n) => {
        if (!same(levels[n], parsed.levels[n])) error('levels', `ch${pad(Number(n))}: the game's reader and the Spw interpreter read this level differently (${JSON.stringify(levels[n])} vs ${JSON.stringify(parsed.levels[n])})`);
      });
      new Set([...Object.keys(rhythms), ...Object.keys(parsed.rhythms)]).forEach((id) => {
        const mine = rhythms[id] && { steps: rhythms[id].steps, voice: rhythms[id].voice, chapter: rhythms[id].chapter, name: rhythms[id].name, says: rhythms[id].says, ref: rhythms[id].ref };
        if (!same(mine, parsed.rhythms[id])) error('levels', `rhythm ${id}: the game's reader and the Spw interpreter read it differently (${JSON.stringify(mine)} vs ${JSON.stringify(parsed.rhythms[id])})`);
      });
    }
  }
  chapters.forEach((c) => {
    const level = levels[c.chapterNumber];
    if (!level) { warn('levels', `chapter ${c.chapterNumber} has no level (its lanes keep the game's defaults)`); return; }
    if (!level.tempo || !level.root) error('levels', `ch${pad(c.chapterNumber)}: a level needs a %tempo and a %root`);
    if (level.swing && (level.swing < 50 || level.swing > 66)) error('levels', `ch${pad(c.chapterNumber)}: %swing is where in the eighth the off-sixteenth falls, 50 (even) to 66 (a triplet), not ${level.swing}`);
    if (level.rhythm && !rhythms[level.rhythm]) error('levels', `ch${pad(c.chapterNumber)}: rhythm ${level.rhythm} is not under !rhythms (or its steps are not sixteen of X x .)`);
    const rooms = (c.sections || []).map((sec) => sec.room?.spw).filter(Boolean);
    if (level.room && !rooms.some((sig) => sig.includes(level.room))) error('levels', `ch${pad(c.chapterNumber)}: the rhythm's room ${level.room} is not a room of this chapter`);
  });
  notes.push(`levels: ${Object.keys(levels).length} levels, ${Object.keys(rhythms).length} rhythms to find`);

  /* Whose it is (.spw/runtime/audio-tropes.spw; pie-tropes.mjs): the game's reader agrees with the interpreter, and the
   * three WAPs are one shape turned three ways. */
  const tropesText = await readFile(resolve(ROOT, '.spw/runtime/audio-tropes.spw'), 'utf8');
  const motifs = readMotifs(tropesText);
  if (parse) {
    const blocks = spwBlocks(tropesText);
    if (!blocks) error('motifs', 'audio-tropes.spw does not read whole with the Spw interpreter (it fell back to prose)');
    else (blocks.motifs || []).forEach(([id, f]) => {
      const notesRead = (f['~notes'] || []).map(Number);
      if (JSON.stringify(notesRead) !== JSON.stringify(motifs[id]?.notes || [])) error('motifs', `${id}: the game's reader and the Spw interpreter read its notes differently (${JSON.stringify(motifs[id]?.notes)} vs ${JSON.stringify(notesRead)})`);
      if ((f['$timbre']?.[0] ?? undefined) !== motifs[id]?.timbre) error('motifs', `${id}: the two readers part on its timbre`);
    });
  }
  const wap = motifNotes(motifs, 'wap');
  if (JSON.stringify(motifNotes(motifs, 'boonwap')) !== JSON.stringify(wap)) error('motifs', 'boonwap should be the shape as it is');
  if (JSON.stringify(motifNotes(motifs, 'bonewap')) !== JSON.stringify([...(wap || [])].reverse())) error('motifs', 'bonewap should be the shape backwards');
  if (JSON.stringify(motifNotes(motifs, 'banewap')) !== JSON.stringify((wap || []).map((n) => 2 * wap[0] - n))) error('motifs', 'banewap should be the shape upside down');
  notes.push(`motifs: ${Object.keys(motifs).length} themes, one shape turned three ways`);

  /* Your way through (book/content/world/way.json; way-through.mjs). A wonder is one edit past a room's own line; a swap
   * adds no spoken line; a pairing names people the book has; the line reads whole and reads back. */
  const way = await read('book/content/world/way.json');
  const proseOf = (b) => (typeof b === 'string' ? b : Array.isArray(b) ? b.map(proseOf).join(' ') : b && typeof b === 'object' ? Object.values(b).map(proseOf).join(' ') : '');
  const tokensOf = (line) => line.match(/[~!?@&*^#.=%$]|[{}[\]()<>]|[A-Za-z_0-9]+/g) || [];
  const editDistance = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    a.forEach((token, i) => {
      let prev = i;
      row[0] = i + 1;
      b.forEach((other, j) => { const cur = row[j + 1]; row[j + 1] = Math.min(row[j + 1] + 1, row[j] + 1, prev + (token === other ? 0 : 1)); prev = cur; });
    });
    return row[b.length];
  };
  const reads = (line) => { const r = parse?.(line, { lexProfile: 'prose' }); return !parse || (r?.completeness?.complete && !r?.completeness?.proseFallback); };
  const knownChapters = new Set(chapters.map((c) => c.chapterNumber));
  if (/WAPboy/.test(JSON.stringify(way)) || /WAPboy/.test(JSON.stringify(REASONS))) error('way', 'the figure is never named');
  chapters.forEach((c) => {
    const n = c.chapterNumber;
    const entry = way.chapters[n];
    if (!entry) { error('way', `ch${pad(n)}: no reason, holds or wonder`); return; }
    ['reason', 'holds'].forEach((key) => { if (!entry[key]) error('way', `ch${pad(n)}: ${key} is empty`); });
    const w = entry.wonder || {};
    if (!(c.sections || []).some((sec) => sec.room?.spw === w.line)) error('way', `ch${pad(n)}: the wonder's line ${w.line} is not a room of this chapter`);
    if (editDistance(tokensOf(w.line || ''), tokensOf(w.edit || '')) !== 1) error('way', `ch${pad(n)}: ${w.edit} is not one edit from ${w.line}`);
    if (!reads(w.line) || !reads(w.edit)) error('way', `ch${pad(n)}: the wonder does not read whole with the Spw interpreter`);
    if (!Array.isArray(w.ways) || w.ways.length < 2) error('way', `ch${pad(n)}: a wonder needs at least two ways it could come out`);
    if (w.probe != null && (!knownChapters.has(w.probe) || w.probe <= n)) error('way', `ch${pad(n)}: a probe is a later chapter of the book, not ${w.probe}`);
  });
  (way.pairs || []).forEach((p) => {
    p.who.forEach((who) => { if (!CHARACTERS[who]) error('way', `${p.id}: unknown character ${who}`); });
    if (!/^[a-z_]+$/.test(p.id)) error('way', `${p.id}: an id is lower case with underscores, so it reads inside =apart[…]`);
    (p.aside || []).forEach((n) => { if (!knownChapters.has(n)) error('way', `${p.id}: no chapter ${n}`); });
    (p.rooms || []).forEach((room) => {
      const c = chapters.find((ch) => ch.chapterNumber === room.chapter);
      if (!c) { error('way', `${p.id}: no chapter ${room.chapter}`); return; }
      const paragraphs = (c.sections || []).flatMap((sec) => (sec.content || []).filter((b) => b.type === 'paragraph').map((b) => b.text));
      const whole = proseOf(c.sections);
      room.swaps.forEach((swap) => {
        if (swap.para) {
          if (paragraphs.filter((t) => t.startsWith(swap.para)).length !== 1) error('way', `${p.id}: "${swap.para}" should open exactly one paragraph of chapter ${room.chapter}`);
          if (/[“”"]/.test(swap.text)) error('way', `${p.id}: a swap adds no spoken line ("${swap.text.slice(0, 40)}…")`);
        } else {
          if (whole.split(swap.find).length !== 2) error('way', `${p.id}: "${swap.find}" should appear exactly once in chapter ${room.chapter}`);
          if (/[“”"]/.test(swap.to)) error('way', `${p.id}: a swap adds no spoken line`);
        }
      });
    });
  });
  (way.held || []).forEach((h) => h.who.forEach((who) => { if (!CHARACTERS[who]) error('way', `held: unknown character ${who}`); }));
  Object.keys(CHARACTERS).forEach((id) => {
    ['want', 'limit', 'escape', 'reason'].forEach((key) => { if (!REASONS[id]?.[key]) error('characters', `${id}: ${key} is empty`); });
  });
  const sampleWay = { aside: [2, 7], apart: (way.pairs || []).map((p) => p.id) };
  if (!reads(waySpell(sampleWay))) error('way', 'a way line does not read whole with the Spw interpreter');
  if (JSON.stringify(parseWay(waySpell(sampleWay))) !== JSON.stringify({ aside: [2, 7], apart: [...sampleWay.apart].sort() })) error('way', 'a way line does not read back as itself');
  notes.push(`way: ${Object.keys(way.chapters).length} chapters with reasons and wonders, ${(way.pairs || []).length} pairings, ${(way.held || []).length} held together`);
}

/* Marks stay marked (book/content/marks.json): each says who, for what and since when, stands beside pages that
 * exist, links through a marked threshold, and keeps its words short; build-chapters shows it, this holds it. */
{
  const registry = JSON.parse(await readFile(resolve(ROOT, 'book/content/marks.json'), 'utf8'));
  const marks = registry.marks || [];
  if (!(registry.policy || []).length) error('marks', 'marks.json has no policy');
  const ids = new Set();
  marks.forEach((m) => {
    const at = `mark ${m.id || '(no id)'}`;
    if (!/^[a-z0-9-]+$/.test(m.id || '')) error('marks', `${at}: an id of lowercase letters, digits and hyphens`);
    if (ids.has(m.id)) error('marks', `${at}: the id is used twice`);
    ids.add(m.id);
    ['who', 'what', 'words'].forEach((k) => { if (!String(m[k] || '').trim()) error('marks', `${at}: says no ${k}`); });
    if (m.what && registry.kinds && !registry.kinds[m.what]) error('marks', `${at}: what should be one of the kinds (${Object.keys(registry.kinds).join(', ')})`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.since || '')) error('marks', `${at}: since should be a date, YYYY-MM-DD`);
    if (!/^https:\/\//.test(m.url || '')) error('marks', `${at}: its link should be https`);
    if (String(m.words || '').length > 120) error('marks', `${at}: words of 120 characters or fewer`);
    if (!(m.routes || []).length) error('marks', `${at}: names no page to stand beside`);
    (m.routes || []).forEach((r) => { if (!/^\/.*\/$/.test(r) || !existsSync(resolve(ROOT, `.${r}`, 'index.html'))) error('marks', `${at}: ${r} is not a page`); });
  });
  notes.push(`marks: ${marks.length ? `${marks.length} mark(s), each shown where it stands` : 'nothing in the book is paid for'}`);
}

/* lore.land's client file for autonomous.feedback: within what the post keeps, every route a page that exists. */
{
  const client = JSON.parse(await readFile(CLIENT, 'utf8'));
  clientProblems(client).forEach((p) => error('feedback', p));
  notes.push(`feedback: ${(client.routes || []).length} routes, ${(client.subjects || []).length} subjects for autonomous.feedback`);
}

/* The game's mechanics (.spw/runtime/mechanics.spw; unlocks.mjs): each is one sentence with a landing page, unlocks
 * by measures the registry names, is placed in layers.spw as an unlock, and reads the same with the Spw interpreter. */
{
  const mechText = await readFile(resolve(ROOT, '.spw/runtime/mechanics.spw'), 'utf8');
  const layersText = await readFile(resolve(ROOT, '.spw/surfaces/layers.spw'), 'utf8');
  const { measures, mechanics } = readMechanics(mechText);
  const list = Object.values(mechanics);
  if (!list.length) error('unlocks', 'no mechanics read from .spw/runtime/mechanics.spw');
  for (const m of list) {
    const at = `unlock ${m.id}`;
    if (!/^[A-Z][^]*\.$/.test(m.says) || /[.!?]\s+[A-Z]/.test(m.says) || m.says.length > 140) error('unlocks', `${at}: #says should be one sentence of 140 characters or fewer`);
    if (!(m.unlock > 0)) error('unlocks', `${at}: %unlock should be a weight above zero`);
    if (!Object.keys(m.weigh).length) error('unlocks', `${at}: %weigh{} names no measure`);
    Object.keys(m.weigh).forEach((k) => { if (!measures[k]) error('unlocks', `${at}: weighs ${k}, which is not under !measures`); });
    if (!['open', 'locked'].includes(m.before)) error('unlocks', `${at}: &before should be open or locked`);
    if (!m.floor) error('unlocks', `${at}: #floor should say what nobody loses`);
    if (!existsSync(resolve(ROOT, 'pie/unlocks', m.page, 'index.html'))) error('unlocks', `${at}: pie/unlocks/${m.page}/ is not built (npm run unlocks:build)`);
    if (!new RegExp(`premium: unlock, where: "[^"]*unlocks\\.mjs[^"]*\\b${m.id}\\b`).test(layersText)) error('unlocks', `${at}: not placed in .spw/surfaces/layers.spw as premium: unlock (where naming unlocks.mjs ${m.id})`);
  }
  if (parse) {
    const blocks = spwBlocks(mechText);
    if (!blocks) error('unlocks', 'mechanics.spw does not read whole with the Spw interpreter (it fell back to prose)');
    else {
      const read = Object.fromEntries((blocks.mechanics || []).map(([id, f]) => [id, { unlock: Number(f['%unlock']?.[0]) || 0, weigh: Object.fromEntries(Object.entries(f['%weigh'] || {}).map(([k, v]) => [k.replace(/^%/, ''), Number(v?.[0])])), page: f['.page']?.[0] ?? null }]));
      new Set([...Object.keys(mechanics), ...Object.keys(read)]).forEach((id) => {
        const mine = mechanics[id] && { unlock: mechanics[id].unlock, weigh: mechanics[id].weigh, page: mechanics[id].page };
        if (JSON.stringify(mine) !== JSON.stringify(read[id])) error('unlocks', `unlock ${id}: the game's reader and the Spw interpreter read it differently (${JSON.stringify(mine)} vs ${JSON.stringify(read[id])})`);
      });
    }
  }
  notes.push(`unlocks: ${list.length} mechanics, each with its page (${list.map((m) => m.page).join(', ')})`);
}

/* Packs (book/content/packs/; .spw/surfaces/texture-website.spw): every pack where its route says, its sources
 * linked where they live, its files there, a maker's scheme and curriculum whole. */
const packIndex = await read('book/content/packs/index.json');
for (const entry of packIndex.packs) {
  const pack = await read(entry.src.replace(/^\//, '')).catch(() => null);
  if (!pack) { error('packs', `${entry.id}: ${entry.src} will not load`); continue; }
  if (pack.id !== entry.id) error('packs', `${entry.src} says it is ${pack.id}, the index says ${entry.id}`);
  if (pack.route !== entry.route) error('packs', `${entry.id}: the index routes it to ${entry.route}, the pack to ${pack.route}`);
  if (!entry.src.startsWith(`/book/content/packs${pack.route}/`)) error('packs', `${entry.id}: lives where its route says (book/content/packs${pack.route}/)`);
  packProblems(pack, { exists: (path) => existsSync(resolve(ROOT, path.replace(/^\//, ''))) }).forEach((p) => error('packs', p));
  const plans = pack.curriculum || [];
  if (plans.length) notes.push(`packs: ${pack.id}: ${plans.filter((p) => p.state === 'done').length} of ${plans.length} plans done, ${plans.filter((p) => p.state === 'open').length} under way`);
}

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

/** A sidecar's mutations, as text and, when the interpreter is loaded, as read edges. */
function checkMutations(at, text, pairs) {
  for (const [anchor, target] of pairs) {
    if (!text.includes(mutationEdge(anchor, target))) error(at, `sidecar missing ${mutationEdge(anchor, target)}`);
  }
  if (!parse) return;
  const side = readSidecar(text, parse, readBias);
  if (!side.ok) error(at, `sidecar ${side.error}`);
  else {
    const missing = missingMutations(side.mutations, pairs);
    if (missing.length) error(at, `sidecar mutations unread: ${missing.map(([anchor, target]) => `${anchor} ${target}`).join(', ')}`);
  }
}

async function checkSpwWhole(rel) {
  try {
    const text = await readFile(resolve(ROOT, rel), 'utf8');
    if (!parse) return text;
    const result = parse(text, { lexProfile: 'prose' });
    if (!result?.completeness?.complete || result.completeness.proseFallback) error('assets', `${rel} does not read whole`);
    return text;
  } catch {
    error('assets', `missing ${rel}`);
    return '';
  }
}

/* Pie samples (book/content/sounds.json): CC0 only, present, short, under the size budget. */
const SOUND_EVENTS = new Set(['wap', 'step-field', 'step-city', 'flour', 'land', 'spill', 'beaver']);
try {
  const soundsDoc = await read('book/content/sounds.json');
  const sounds = soundsDoc.sounds || [];
  if (!sounds.length) error('sounds', 'no takes');
  let bytes = 0;
  for (const s of sounds) {
    const at = `sounds ${s.id || '?'}`;
    if (!SOUND_EVENTS.has(s.event)) error(at, `unknown event ${s.event}`);
    if (s.license !== 'CC0-1.0') error(at, `license ${s.license || 'missing'} is not on the allowlist`);
    if (!s.source || !s.author || !s.changed) error(at, 'needs source, author and changed');
    if (typeof s.gain !== 'number' || s.gain <= 0 || s.gain > 1) error(at, 'gain must be above 0 and at most 1');
    if (typeof s.duration !== 'number' || s.duration < 0.04 || s.duration > 1.2) error(at, 'duration must be between 0.04s and 1.2s');
    if (typeof s.file !== 'string' || !/^\/book\/audio\/[a-z-]+\/\d+\.m4a$/.test(s.file)) error(at, 'file must be /book/audio/<event>/<n>.m4a');
    else {
      try { bytes += (await stat(resolve(ROOT, s.file.slice(1)))).size; }
      catch { error(at, `missing ${s.file}`); }
    }
    if (!s.says) error(at, 'needs a description');
    if (!s.hear?.type || typeof s.hear.freq !== 'number') error(at, 'needs a hearing (type and freq)');
    const sidePath = s.file.replace(/\.m4a$/, '.spw');
    let sideText = '';
    try { sideText = await readFile(resolve(ROOT, sidePath.slice(1)), 'utf8'); }
    catch { error(at, `missing sidecar ${sidePath}`); }
    if (sideText) {
      if (!sideText.includes(`#says["${s.says}"]`)) error(at, 'sidecar description does not match sounds.json');
      checkMutations(at, sideText, [...SOUND_MUTATIONS, ['heard', s.hear.type]]);
    }
  }
  if (parse) {
    for (const name of ['index.spw', ...[...SOUND_EVENTS].map((event) => `${event}/index.spw`)]) {
      try {
        const text = await readFile(resolve(ROOT, 'book/audio', name), 'utf8');
        const result = parse(text, { lexProfile: 'prose' });
        if (!result?.completeness?.complete || result.completeness.proseFallback) error('sounds', `${name} does not read whole`);
      } catch { error('sounds', `missing book/audio/${name}`); }
    }
  }
  const budget = soundsDoc.budgetBytes || 1572864;
  if (bytes > budget) error('sounds', `${bytes} bytes over the ${budget} budget`);
  notes.push(`sounds: ${sounds.length} takes, ${(bytes / 1024).toFixed(0)} KB, colouring ${new Set(sounds.map((s) => s.event)).size} events`);
} catch (err) {
  if (err?.code !== 'ENOENT') throw err;
  notes.push('sounds: no book/content/sounds.json; the lanes stay synthesized');
}

/* Share cards and app icons: the same sidecar shape, beside the derived file. */
const ICON_SCALES = [
  ['icon-192', 'mark'],
  ['icon-512', 'mark'],
  ['icon-maskable-512', 'safe'],
  ['apple-touch-icon', 'touch'],
  ['favicon', 'small'],
];
try {
  const refs = await read('book/content/world/references.json');
  let cards = 0;
  for (let n = 1; n <= 15; n += 1) {
    const slug = pad(n);
    const at = `share chapter ${slug}`;
    const data = await read(`book/content/chapters/${slug}.json`);
    const inWhich = data.inWhich || refs.inWhich?.[String(data.chapterNumber ?? n)] || '';
    const jpg = `book/images/og/chapter-${slug}.jpg`;
    const plate = `book/images/${slug}.png`;
    if (!existsSync(resolve(ROOT, jpg))) error(at, `missing ${jpg}`);
    if (!existsSync(resolve(ROOT, plate))) error(at, `missing ${plate}`);
    let text = '';
    try { text = await readFile(resolve(ROOT, `book/images/og/chapter-${slug}.spw`), 'utf8'); }
    catch { error(at, 'missing sidecar'); }
    if (text) {
      if (!text.includes(`#title["${data.title}"]`)) error(at, 'sidecar title does not match the chapter');
      if (!text.includes(`#in_which["${inWhich}"]`)) error(at, 'sidecar in-which does not match the chapter');
      if (!text.includes(`.plate["${plate}"]`)) error(at, 'sidecar does not name its plate');
      checkMutations(at, text, CARD_MUTATIONS);
      cards += 1;
    }
  }
  await checkSpwWhole('book/images/og/index.spw');
  let icons = 0;
  for (const [name, scale] of ICON_SCALES) {
    const at = `icon ${name}`;
    const file = name === 'favicon' ? 'book/pwa/icons/favicon.svg' : `book/pwa/icons/${name}.png`;
    if (!existsSync(resolve(ROOT, file))) error(at, `missing ${file}`);
    let text = '';
    try { text = await readFile(resolve(ROOT, `book/pwa/icons/${name}.spw`), 'utf8'); }
    catch { error(at, 'missing sidecar'); }
    if (text) {
      if (!text.includes('#says["')) error(at, 'sidecar needs a description');
      checkMutations(at, text, [...ICON_MUTATIONS, ['scale', scale]]);
      icons += 1;
    }
  }
  await checkSpwWhole('book/pwa/icons/index.spw');
  notes.push(`assets: ${cards} share cards and ${icons} icons, each with a sidecar`);
} catch (err) {
  if (err?.code !== 'ENOENT') throw err;
  error('assets', 'chapter or references missing while checking share cards');
}

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
