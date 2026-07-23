#!/usr/bin/env node
/**
 * Bundle spw-workbench's parser kernel (packages/spw-seed) into a single
 * dependency-free ESM file the browser runtime can import directly.
 *
 * packages/spw-seed ships no compiled output (package.json is private:true,
 * exports point straight at .ts source) and is explicitly documented as
 * portable — "no DOM or app-specific imports allowed" — so it's a clean
 * esbuild target: no externals needed, no Node built-ins to shim.
 *
 * Usage: node book/scripts/tools/bundle-spw-seed.mjs [--verify]
 *   --verify  exit 1 if the checked-in bundle is stale vs the submodule source
 */

import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENTRY = path.join(ROOT, '.spw/_workbench/packages/spw-seed/src/index.ts');
const OUTFILE = path.join(ROOT, 'book/scripts/vendor/spw-seed.mjs');
const VERIFY = process.argv.includes('--verify');

if (!fs.existsSync(ENTRY)) {
  console.error(`[bundle-spw-seed] entry not found: ${path.relative(ROOT, ENTRY)} — is the submodule checked out?`);
  process.exit(1);
}

const banner = `/* GENERATED — do not hand-edit.
   Bundled from .spw/_workbench/packages/spw-seed/src/index.ts (spw-workbench parser kernel)
   via node book/scripts/tools/bundle-spw-seed.mjs. Regenerate after every workbench update. */
`;

const result = await esbuild.build({
  entryPoints: [ENTRY],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  banner: { js: banner },
  write: false,
  logLevel: 'silent'
});

const [output] = result.outputFiles;

if (VERIFY) {
  if (!fs.existsSync(OUTFILE)) {
    console.error('[bundle-spw-seed] verify failed — no bundle checked in yet');
    process.exit(1);
  }
  const current = fs.readFileSync(OUTFILE, 'utf8');
  if (current !== output.text) {
    console.error('[bundle-spw-seed] verify failed — bundle is stale; run node book/scripts/tools/bundle-spw-seed.mjs');
    process.exit(1);
  }
  console.log('[bundle-spw-seed] verify ok — bundle matches current submodule pin');
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUTFILE), { recursive: true });
fs.writeFileSync(OUTFILE, output.text);
console.log(`[bundle-spw-seed] wrote ${path.relative(ROOT, OUTFILE)} (${(output.text.length / 1024).toFixed(1)}KB)`);
