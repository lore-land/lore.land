#!/usr/bin/env node
// @ts-check
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
/* Only what lore.land imports, so the rest of the kernel shakes out (about a quarter of the bytes). Add a name here to use it. */
// scanPairLabels reads a sealed line's label and its mirrored close (finds, seasons); spokenLine says a line in the
// names of its parts (the board line, for whoever reads Setup by ear). Both arrived with workbench 47c178e.
const EXPORTS = ['parse', 'readBias', 'scanPairLabels', 'spokenLine'];
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
  stdin: { contents: `export { ${EXPORTS.join(', ')} } from ${JSON.stringify(ENTRY)};`, resolveDir: ROOT, loader: 'js' },
  bundle: true,
  treeShaking: true,
  minifyWhitespace: true,
  minifySyntax: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  banner: { js: banner },
  write: false,
  logLevel: 'silent'
});

const [output] = result.outputFiles;

if (VERIFY) {
  // The hand-written declaration has to name exactly what the bundle exports.
  const declared = [...fs.readFileSync(path.join(ROOT, 'book/scripts/vendor/spw-seed.d.mts'), 'utf8').matchAll(/^export function (\w+)/gm)].map((m) => m[1]).sort();
  if (declared.join() !== [...EXPORTS].sort().join()) {
    console.error(`[bundle-spw-seed] verify failed — spw-seed.d.mts declares ${declared.join(', ')}; EXPORTS has ${EXPORTS.join(', ')}`);
    process.exit(1);
  }
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
