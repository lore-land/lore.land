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
// names of its parts (the board line, for whoever reads Setup by ear). readLine/writeLine/slotHash/readRegisterStamps/
// readMarks/checkLine/hydrateSnippet arrived with workbench 84cf313; splitMarks/readFragments/pivotsOf/pivotReadCounts (spw.pivots/1) arrived with cf41ca22.
// 39bea1be (rule_trace_when_kept, bcf0da18) builds no rule trace when the parse keeps none; see TRACE below.
const EXPORTS = [
  'parse',
  'readBias',
  'scanPairLabels',
  'spokenLine',
  'readLine',
  'writeLine',
  'joinParts',
  'slotHash',
  'textHash',
  'readRegisterStamps',
  'summarizeRegisterStamps',
  'readMarks',
  'formatLineReading',
  'checkLine',
  'hydrateSnippet',
  'parseBindings',
  'splitMarks',
  'readFragments',
  'pivotsOf',
  'pivotReadCounts'
];
const OUTFILE = path.join(ROOT, 'book/scripts/vendor/spw-seed.mjs');
/* Nothing lore.land runs reads a parse's rule trace, and the workbench's parse() keeps one unless told otherwise:
 * on .spw/runtime/pie-levels.spw that is 194,098 events and about twelve times the time. So the bundle's own default
 * keeps none. That covers the parses its readers make inside (pivotsOf reads every candidate back through parse()).
 * Trees, errors, warnings and completeness are the same either way; pass { eventPolicy: 'trace' } to keep a trace.
 * The line is matched exactly, so a workbench bump that moves it fails here, not silently. */
const TRACE = { file: path.join(ROOT, '.spw/_workbench/packages/spw-seed/src/types/state.ts'), from: "  eventPolicy: 'trace',\n  lexProfile: undefined,", to: "  eventPolicy: 'none',\n  lexProfile: undefined," };
const quietTrace = {
  name: 'lore-quiet-trace',
  /** @param {import('esbuild').PluginBuild} build */
  setup(build) {
    build.onLoad({ filter: /[\\/]types[\\/]state\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== TRACE.file) return undefined;
      const source = fs.readFileSync(args.path, 'utf8');
      if (!source.includes(TRACE.from)) throw new Error(`[bundle-spw-seed] the parser's default event policy moved (${path.relative(ROOT, TRACE.file)}); look again before bundling`);
      return { contents: source.replace(TRACE.from, TRACE.to), loader: 'ts' };
    });
  }
};
const VERIFY = process.argv.includes('--verify');

if (!fs.existsSync(ENTRY)) {
  console.error(`[bundle-spw-seed] entry not found: ${path.relative(ROOT, ENTRY)} — is the submodule checked out?`);
  process.exit(1);
}

const banner = `/* GENERATED — do not hand-edit.
   Bundled from .spw/_workbench/packages/spw-seed/src/index.ts (spw-workbench parser kernel)
   via node book/scripts/tools/bundle-spw-seed.mjs. Regenerate after every workbench update.
   parse() keeps no rule trace by default here; pass { eventPolicy: 'trace' } for one. */
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
  plugins: [quietTrace],
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
