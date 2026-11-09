#!/usr/bin/env node
/**
 * align-tokens.mjs — one ?v= token per file, everywhere it is linked or imported (npm run tokens:align).
 *
 * A module imported as x.mjs?v=A in one place and x.mjs?v=B in another is two modules to the browser: two
 * downloads, two instances, two copies of its state (story-lexicon.mjs was instantiated four times on a chapter).
 * A stylesheet linked with different tokens on different pages is downloaded once per spelling. This gives every
 * file one token: the release's own (cache-context.mjs) for a file changed since the last commit or new, otherwise
 * the newest token any reference already uses. Generated pages (the chapters, book/timeline.html) carry the build's
 * release token and are left to chapters:build. --check reports drift and exits 1 without writing.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const CHECK = process.argv.includes('--check');
const RELEASE = readFileSync(resolve(ROOT, 'book/scripts/modules/cache-context.mjs'), 'utf8').match(/DEFAULT_CACHE_RELEASE = '([^']+)'/)[1];

const git = (...args) => execFileSync('git', args, { cwd: ROOT }).toString().split('\n').filter(Boolean);
const tracked = git('ls-files').filter((f) => /\.(m?js|html|css)$/.test(f) && !/^(dist|node_modules|\.spw\/_workbench)\//.test(f) && !/^book\/chapter\/\d\d\//.test(f) && f !== 'book/timeline.html');
const untracked = git('ls-files', '--others', '--exclude-standard').filter((f) => /\.(m?js|html|css)$/.test(f) && !/^book\/chapter\/\d\d\//.test(f) && f !== 'book/timeline.html');
const files = [...new Set([...tracked, ...untracked])].filter((f) => existsSync(resolve(ROOT, f)));
const changed = new Set([...git('diff', '--name-only', 'HEAD'), ...untracked]);

const order = (t) => { const [date, letter = ''] = t.split('.'); return `${date}.${String(letter.length).padStart(2, '0')}${letter}`; };
const newest = (a, b) => (order(a) >= order(b) ? a : b);

// A reference: an asset path with a ?v= token, in an HTML attribute or an import specifier.
const REF = /((?:\/|\.{1,2}\/)[\w./@-]+?\.(?:m?js|css))\?v=([0-9]{4}_[0-9]{2}_[0-9]{2}\.[A-Z]+)/g;
const targetOf = (file, path) => (path.startsWith('/') ? path.slice(1) : relative(ROOT, resolve(ROOT, dirname(file), path)));

const tokens = new Map();
for (const file of files) {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  for (const m of text.matchAll(REF)) {
    const target = targetOf(file, m[1]);
    if (!existsSync(resolve(ROOT, target))) continue;
    tokens.set(target, tokens.has(target) ? newest(tokens.get(target), m[2]) : m[2]);
  }
}
const want = new Map([...tokens].map(([target, token]) => [target, changed.has(target) ? RELEASE : token]));

let drift = 0;
const touched = [];
for (const file of files) {
  const path = resolve(ROOT, file);
  const text = readFileSync(path, 'utf8');
  const next = text.replace(REF, (all, ref, token) => {
    const target = targetOf(file, ref);
    const goal = want.get(target);
    if (!goal || goal === token) return all;
    drift += 1;
    return `${ref}?v=${goal}`;
  });
  if (next !== text) { touched.push(file); if (!CHECK) writeFileSync(path, next); }
}
console.log(`[tokens:align] ${tokens.size} files referenced with tokens · ${drift} reference${drift === 1 ? '' : 's'} ${CHECK ? 'out of line' : 'aligned'} in ${touched.length} file${touched.length === 1 ? '' : 's'} · release ${RELEASE}`);
if (CHECK && drift) { touched.slice(0, 20).forEach((f) => console.log(`  ${f}`)); process.exit(1); }
