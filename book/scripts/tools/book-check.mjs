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
  LEANS, CONTENT_TYPES, CANON_REFUSALS, canonicalText, termPattern, checkParagraphSlots, checkWonder
} from '../../schema/book-types.mjs';
import { CUSTOM_ELEMENT_TYPES } from '../modules/story-lexicon.mjs';
import { SIGHTINGS } from '../modules/sightings.mjs';

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

let parse = null;
try {
  ({ parse } = await import('../vendor/spw-seed.mjs'));
} catch {
  notes.push('Spw interpreter unavailable; bracework is checked for shape only.');
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

  (data.sections || []).forEach((section, i) => {
    const at = `${where} §${i + 1}`;
    if (!SECTION_TYPES.has(section.type)) error(at, `unknown section type ${section.type}`);
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

  const prose = JSON.stringify(data.sections.map((s) => ({ ...s, content: (s.content || []).map((c) => (c.type === 'paragraph' ? { ...c, text: canonicalText(c), slots: undefined } : c)) })));
  CANON_REFUSALS.forEach((refusal) => {
    const match = prose.match(refusal.pattern);
    if (match) error(where, `"${match[0]}" — ${refusal.why}`);
  });
  SIGHTINGS.filter((s) => s.chapter === n && s.phrase).forEach((s) => {
    if (!prose.includes(s.phrase)) error(where, `sighting anchor removed: "${s.phrase}"`);
  });
}

/* The almanac: shape, and every wonder named in its home and each echo. */
const ids = new Set();
const proseOf = Object.fromEntries(chapters.map((c) => [c.chapterNumber,
  c.sections.flatMap((s) => (s.content || []).filter((x) => x.type === 'paragraph').map((x) => `${canonicalText(x)} ${(x.children || []).map((k) => k.text || '').join(' ')}`)).join(' ')]));
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
