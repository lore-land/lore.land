#!/usr/bin/env node
// @ts-check
/**
 * Real-grammar .spw linter — parses every hand-authored .spw file under
 * .spw/ with spw-workbench's actual parser (packages/spw-seed), not a
 * regex/bracket-balance heuristic.
 *
 * Requires the workbench submodule (.spw/_workbench) to be checked out.
 * Run via tsx (see package.json spw:lint) so the TS source imports directly
 * — no build step, no vendored copy.
 *
 * Usage: npx tsx .spw/tools/spw-lint.mjs [--strict]
 *   --strict  exit 1 when any file fails to parse (default: report only)
 */

import fs from 'node:fs';
import path from 'node:path';
/* Read straight from the submodule's source. A variable specifier keeps tsc from type-checking the workbench under this repo's settings. */
const SEED_SOURCE = '../_workbench/packages/spw-seed/src/index.ts';
/** @type {typeof import('../../book/scripts/vendor/spw-seed.mjs').parse} */
const parse = (await import(SEED_SOURCE)).parse;
import { spwFiles } from './spw-files.mjs';

const ROOT = process.cwd();
const SPW_ROOT = path.join(ROOT, '.spw');
const STRICT = process.argv.includes('--strict');


/* The canon, and the root plans that are kept as records. PLAN.A to PLAN.D predate the parser's rules and do not read; see the tooling audit. */
const rootFiles = ['PLAN.E.spw', 'PLAN.F.spw'].map((name) => path.join(ROOT, name));
const files = [...spwFiles(SPW_ROOT), ...rootFiles].sort();
let failCount = 0;
let errorTotal = 0;
let warningTotal = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  const result = parse(text, { lexProfile: 'prose' });

  errorTotal += result.errors.length;
  warningTotal += result.warnings.length;

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

console.log(
  `[spw:lint] ${files.length} file(s) parsed — ${failCount} failed, ${errorTotal} error(s), ${warningTotal} warning(s)`
);

if (STRICT && failCount > 0) {
  process.exit(1);
}
