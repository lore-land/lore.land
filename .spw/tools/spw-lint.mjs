#!/usr/bin/env node
// @ts-check
/**
 * Real-grammar .spw linter — parses every hand-authored .spw file under
 * .spw/ with spw-workbench's actual parser (packages/spw-seed), checks
 * register-stamp contracts (84cf313), and validates template hydration in
 * .spw/surfaces/projection.spw.
 *
 * Requires the workbench submodule (.spw/_workbench) to be checked out.
 * Run via tsx (see package.json spw:lint) so the TS source imports directly
 * — no build step, no vendored copy.
 *
 * Usage: npx tsx .spw/tools/spw-lint.mjs [--strict]
 *   --strict  exit 1 when any file fails to parse or a template fails (default: report only)
 */

import fs from 'node:fs';
import path from 'node:path';
/* Read straight from the submodule's source. A variable specifier keeps tsc from type-checking the workbench under this repo's settings. */
const SEED_SOURCE = '../_workbench/packages/spw-seed/src/index.ts';
/** @type {typeof import('../../book/scripts/vendor/spw-seed.mjs')} */
const seed = await import(SEED_SOURCE);
const { parse, readRegisterStamps, summarizeRegisterStamps, hydrateSnippet, readLine, slotHash } = seed;
import { spwFiles } from './spw-files.mjs';
import { parseProseSpw, readProjectionTemplates } from '../../book/scripts/modules/spw-ast.mjs';

const ROOT = process.cwd();
const SPW_ROOT = path.join(ROOT, '.spw');
const STRICT = process.argv.includes('--strict');

/* The canon, and the root plans that are kept as records. PLAN.A to PLAN.D predate the parser's rules and do not read; see the tooling audit. */
const rootFiles = ['PLAN.E.spw', 'PLAN.F.spw'].map((name) => path.join(ROOT, name));
const files = [...spwFiles(SPW_ROOT), ...rootFiles].sort();
let failCount = 0;
let errorTotal = 0;
let warningTotal = 0;
let stampTotal = 0;
let informingTotal = 0;
let restatingTotal = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  const result = parse(text, { lexProfile: 'prose', eventPolicy: 'none' });   // no rule trace: errors and warnings are kept either way

  errorTotal += result.errors.length;
  warningTotal += result.warnings.length;

  const stamps = readRegisterStamps(text);
  if (stamps.length > 0) {
    const summary = summarizeRegisterStamps(stamps);
    stampTotal += summary.total;
    informingTotal += summary.informing;
    restatingTotal += summary.restating;
    if (summary.restating > 0) {
      warningTotal += summary.restating;
      console.log(`[spw:lint] warn ${rel} — ${summary.restating} restating register stamp(s) ([reg=...])`);
    }
  }

  if (!result.success || result.errors.length > 0) {
    failCount += 1;
    console.log(`[spw:lint] FAIL ${rel}`);
    for (const err of result.errors) {
      const data = err.data;
      const loc = `${err.position.line}:${err.position.column}`;
      console.log(`    ${loc} ${data.message}${data.expected ? ` (expected: ${data.expected.join(', ')})` : ''}`);
    }
  } else if (result.warnings.length > 0) {
    console.log(`[spw:lint] warn ${rel} — ${result.warnings.length} warning(s)`);
  }
}

/* Validate Spw templates in .spw/surfaces/projection.spw: hydrate with defaults and parse the result whole,
 * plus cross-check *chapter_page declared slots against book/templates/chapter.html placeholders. */
let templatesChecked = 0;
const projectionPath = path.join(SPW_ROOT, 'surfaces', 'projection.spw');
if (fs.existsSync(projectionPath)) {
  const proj = parseProseSpw(fs.readFileSync(projectionPath, 'utf8'), parse);
  const { slots, sources } = readProjectionTemplates(proj.ast);
  const tplPath = path.join(ROOT, 'book/templates/chapter.html');
  if (slots.length && fs.existsSync(tplPath)) {
    const htmlSlots = new Set([...fs.readFileSync(tplPath, 'utf8').matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]));
    const declared = new Set(slots);
    const missing = [...htmlSlots].filter((s) => !declared.has(s));
    const extra = [...declared].filter((s) => !htmlSlots.has(s));
    if (missing.length || extra.length) {
      failCount += 1;
      errorTotal += 1;
      console.log(`[spw:lint] FAIL *chapter_page slots in projection.spw (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})`);
    }
  }
  for (const { source } of sources) {
    const hydrated = hydrateSnippet(source, {}, { applyDefaults: true });
    const check = parseProseSpw(hydrated.text, parse);
    templatesChecked += 1;
    if (!check.whole) {
      failCount += 1;
      errorTotal += check.errors.length || 1;
      console.log(`[spw:lint] FAIL template in .spw/surfaces/projection.spw: ${hydrated.text}`);
    } else if (!hydrated.text.includes('\n')) {
      const lineReading = readLine(hydrated.text);
      const hash = slotHash(lineReading, { seed: 'lore.land' });
      if (!hash.vector.length) {
        failCount += 1;
        console.log(`[spw:lint] FAIL template slotHash for ${hydrated.text}`);
      }
    }
  }
}

console.log(
  `[spw:lint] ${files.length} file(s) parsed (${templatesChecked} template(s), ${stampTotal} register stamp(s): ${informingTotal} informing, ${restatingTotal} restating) — ${failCount} failed, ${errorTotal} error(s), ${warningTotal} warning(s)`
);

if (STRICT && failCount > 0) {
  process.exit(1);
}
