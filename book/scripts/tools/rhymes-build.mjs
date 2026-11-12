#!/usr/bin/env node
// @ts-check
/**
 * rhymes-build.mjs — the shapes the book writes more than once, and the tropes they serve (npm run rhymes:build).
 *
 * Runs through tsx, as spw:lint does, so it reads the workbench's own source: findRhymes (spw-seed experimental,
 * workbench 9ef3d22) over parse columns of the released chapter mirrors and the trope and character canon. A rhyme is
 * a shape written more than once with different words (a template with holes and the words that filled them); a
 * refrain is the same shape with the same words. Each is matched to the tropes it serves by the chapters it spans and
 * the words that fill it, and written to book/content/world/rhymes.json, which trope-reveal.mjs reads: a refrain
 * recurring across chapters is evidence a trope has turned; a template with holes is how the land elaborates it.
 *
 * Deterministic. Only released chapters (book-extent.mjs). Nothing that names what the book holds back.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/* A variable specifier keeps tsc from type-checking the workbench under this repo's settings. */
const SEED_SOURCE = '../../../.spw/_workbench/packages/spw-seed/src/index.ts';
/** @type {any} */
const seed = await import(SEED_SOURCE);
const { TOTAL_CHAPTERS } = await import('../modules/book-extent.mjs');
const OUT = resolve(ROOT, 'book/content/world/rhymes.json');
/* Held on the maker's side: never in a template, a filler, or a file this reads. */
export const HELD = /wap\s*-?\s*boy|wabo|bowler|\bhat\b|figure (?:in|under|with)|plain[\s_-]*lines|\begg\b|dregg/i;

const tropes = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/tropes.json'), 'utf8')).tropes;
const released = (/** @type {string} */ name) => { const n = Number(name.replace(/\.spw$/, '')); return Number.isFinite(n) && n >= 1 && n <= TOTAL_CHAPTERS; };
const chapterFiles = readdirSync(resolve(ROOT, '.spw/chapters')).filter((f) => /^\d{2}\.spw$/.test(f) && released(f)).sort().map((f) => `.spw/chapters/${f}`);
const canonFiles = ['.spw/surfaces/tropes.spw', '.spw/surfaces/characters.spw'].filter((f) => existsSync(resolve(ROOT, f)));

/** @type {{ file: string, source: string, columns: any }[]} */
const surfaces = [];
const skipped = [];
for (const file of [...chapterFiles, ...canonFiles]) {
  const source = readFileSync(resolve(ROOT, file), 'utf8');
  const out = seed.parse(source, { lexProfile: 'prose' });
  if (!out.ast || !out.completeness?.complete || out.completeness?.proseFallback) { skipped.push(file); continue; }
  surfaces.push({ file, source, columns: seed.columnsOfAst(out.ast, { success: out.success, complete: out.completeness.complete, proseFallback: out.completeness.proseFallback }) });
}

/** @type {any[]} */
const found = seed.findRhymes(surfaces, { minRows: 6, fillers: 4 });

const chapterOf = (/** @type {string} */ file) => { const m = /chapters\/(\d{2})\.spw$/.exec(file); return m ? Number(m[1]) : null; };
const words = (/** @type {string} */ text) => new Set(String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w.length > 2));
const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'are', 'has', 'its', 'one', 'chapter', 'reference', 'canon', 'spw']);
/** @type {{ id: string, chambers: Set<number>, words: Set<string> }[]} */
const tropeWords = tropes.map((/** @type {any} */ t) => ({
  id: t.id,
  chambers: new Set((t.faces?.story?.chambers || []).map(Number)),
  words: new Set([...words(t.id.replace(/-/g, ' ')), ...words(t.name), ...words((t.aliases || []).join(' ')), ...words(t.prop), ...words((t.faces?.lanes?.kinds || []).join(' '))].filter((w) => !STOP.has(w)))
}));

/**
 * The tropes a rhyme serves: the chapters it spans, and the words its holes share with a trope.
 * @param {any} r
 * @param {number[]} chapters
 * @returns {string[]}
 */
function tropesOf(r, chapters) {
  // What varies is what is said: the holes' fillers, less paths, ids and numbers (the template is the scaffolding).
  const content = r.holes.flatMap((/** @type {any} */ h) => h.fillers).filter((/** @type {string} */ f) => !/[\/#]|\.spw|^[\d\s"]+$|^"?[a-z]+[-_][a-z0-9]+"?$/i.test(String(f)));
  const said = new Set([...words(content.join(' '))].filter((w) => !STOP.has(w)));
  return tropeWords
    .map((t) => {
      const overlap = [...t.words].filter((w) => said.has(w)).length;
      const inChambers = chapters.filter((n) => t.chambers.has(n)).length;
      // Words decide; the chapters only add. A shape that shares no word with a trope is scaffolding, not its rhyme.
      return { id: t.id, overlap, score: overlap * 2 + Math.min(2, inChambers * 0.5) };
    })
    .filter((x) => x.overlap >= 1 && x.score >= 2.5)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 2)
    .map((x) => x.id);
}

const kept = [];
let held = 0;
for (const r of found) {
  const text = [r.template, ...r.holes.flatMap((/** @type {any} */ h) => h.fillers)].join(' ');
  if (HELD.test(text)) { held += 1; continue; }
  const files = [...new Set(r.instances.map((/** @type {any} */ i) => i.file))].sort();
  const chapters = [...new Set(files.map(chapterOf).filter((n) => n != null))].sort((a, b) => /** @type {number} */ (a) - /** @type {number} */ (b));
  const serves = tropesOf(r, /** @type {number[]} */ (chapters));
  kept.push({
    kind: r.kind,
    head: r.head,
    nodes: r.nodes,
    instances: r.instances.length,
    files,
    chapters,
    template: r.template.replace(/\s+/g, ' ').trim().slice(0, 280),
    holes: r.holes.slice(0, 6).map((/** @type {any} */ h) => ({ kind: h.kind, fillers: h.fillers, distinct: h.distinct })),
    tropes: serves
  });
}
kept.sort((a, b) => (b.chapters.length - a.chapters.length) || (b.instances * b.nodes - a.instances * a.nodes) || a.template.localeCompare(b.template));
const top = kept.slice(0, 80).map((r, i) => ({ id: `${r.kind}-${String(i + 1).padStart(2, '0')}`, ...r }));

let commit = '';
try { commit = execFileSync('git', ['-C', resolve(ROOT, '.spw/_workbench'), 'rev-parse', '--short', 'HEAD']).toString().trim(); } catch { /* no git here */ }
const doc = {
  note: 'The shapes the book writes more than once (book/scripts/tools/rhymes-build.mjs; npm run rhymes:build), found by the workbench parser’s findRhymes over the released chapter mirrors and the trope and character canon. A rhyme is a shape written again with other words (a template with holes); a refrain is the same shape, same words. Each names the tropes it serves; trope-reveal.mjs counts them as evidence a trope has turned. Generated: do not edit by hand.',
  source: { workbench: commit, released: TOTAL_CHAPTERS, files: surfaces.map((s) => s.file), skipped },
  counts: { found: found.length, kept: top.length, rhymes: top.filter((r) => r.kind === 'rhyme').length, refrains: top.filter((r) => r.kind === 'refrain').length, held_out: held, serving_a_trope: top.filter((r) => r.tropes.length).length },
  rhymes: top
};
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`[rhymes] ${found.length} shapes written more than once across ${surfaces.length} surfaces (${skipped.length} skipped); kept ${top.length} (${doc.counts.rhymes} rhymes, ${doc.counts.refrains} refrains), ${doc.counts.serving_a_trope} serving a trope; ${held} held out → book/content/world/rhymes.json`);
