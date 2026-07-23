#!/usr/bin/env node
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
import { parse } from '../_workbench/packages/spw-seed/src/index.ts';

const ROOT = process.cwd();
const SPW_ROOT = path.join(ROOT, '.spw');
const STRICT = process.argv.includes('--strict');

const SKIP_DIRS = new Set(['_workbench']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walk(path.join(dir, entry.name), out);
      continue;
    }
    if (entry.name.endsWith('.spw')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const files = walk(SPW_ROOT).sort();
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
