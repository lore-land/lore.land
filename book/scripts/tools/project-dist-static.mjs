#!/usr/bin/env node
/**
 * Copy root-static shell assets into dist/ after Vite build.
 *
 * Vite (publicDir: false) only emits rollup inputs + imported assets.
 * Absolute paths used by the monument still need to exist at deploy root:
 *   /sw.js, /manifest.webmanifest, /robots.txt, /sitemap.xml,
 *   /book/images/*, /book/pwa/icons/*, /seeds/*, /CNAME, /.nojekyll
 *
 * Usage:
 *   node book/scripts/tools/project-dist-static.mjs
 *   node book/scripts/tools/project-dist-static.mjs --out dist
 *   node book/scripts/tools/project-dist-static.mjs --verify
 *   node book/scripts/tools/project-dist-static.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_OUT = path.join(ROOT, 'dist');

/** Files copied as-is to dist root (or under the same relative path). */
const ROOT_FILES = Object.freeze([
  'sw.js',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
  '.nojekyll'
]);

/** Directory trees copied recursively (source relative → same path under out). */
const TREE_DIRS = Object.freeze([
  'book/images',
  'book/pwa/icons',
  'seeds'
]);

/** Paths that must exist after project for a honest dist deploy. */
const REQUIRED = Object.freeze([
  'sw.js',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'book/pwa/offline.html',
  'book/pwa/icons/icon-192.png',
  'book/pwa/icons/icon-512.png',
  'book/images/01.png',
  'zine/index.html',
  'index.html',
  '.spw/claims/chapter-claims.spw'
]);

function parseArgs(argv) {
  const args = { out: DEFAULT_OUT, dryRun: false, verify: false, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--out' || token === '-o') {
      args.out = path.resolve(ROOT, argv[i + 1] || '');
      i += 1;
      continue;
    }
    if (token === '--dry-run') args.dryRun = true;
    if (token === '--verify') args.verify = true;
    if (token === '--quiet' || token === '-q') args.quiet = true;
    if (token === '--help' || token === '-h') args.help = true;
  }
  return args;
}

function ensureDir(dir, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, dryRun) {
  if (!fs.existsSync(src)) {
    return { ok: false, reason: 'missing_source' };
  }
  if (dryRun) {
    return { ok: true, dryRun: true };
  }
  ensureDir(path.dirname(dest), false);
  fs.copyFileSync(src, dest);
  return { ok: true };
}

function copyTree(srcDir, destDir, dryRun) {
  if (!fs.existsSync(srcDir)) {
    return { copied: 0, missing: true };
  }
  let copied = 0;
  const walk = (from, to) => {
    const entries = fs.readdirSync(from, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const fromPath = path.join(from, entry.name);
      const toPath = path.join(to, entry.name);
      if (entry.isDirectory()) {
        ensureDir(toPath, dryRun);
        walk(fromPath, toPath);
        continue;
      }
      if (entry.isFile()) {
        const result = copyFile(fromPath, toPath, dryRun);
        if (result.ok) copied += 1;
      }
    }
  };
  ensureDir(destDir, dryRun);
  walk(srcDir, destDir);
  return { copied, missing: false };
}

function verifyOut(outDir) {
  const missing = [];
  for (const rel of REQUIRED) {
    const full = path.join(outDir, rel);
    if (!fs.existsSync(full)) missing.push(rel);
  }
  return missing;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node book/scripts/tools/project-dist-static.mjs [--out dist] [--verify] [--dry-run]`);
    process.exit(0);
  }

  if (args.verify) {
    const missing = verifyOut(args.out);
    if (missing.length) {
      console.error(`dist static verify failed — missing:\n  ${missing.join('\n  ')}`);
      process.exit(1);
    }
    if (!args.quiet) {
      console.log(`dist static verify ok (${REQUIRED.length} required paths under ${path.relative(ROOT, args.out) || '.'})`);
    }
    process.exit(0);
  }

  if (!fs.existsSync(args.out) && !args.dryRun) {
    console.error(`Out dir does not exist: ${args.out}\nRun vite build first, or pass --dry-run.`);
    process.exit(1);
  }

  let files = 0;
  for (const rel of ROOT_FILES) {
    const src = path.join(ROOT, rel);
    const dest = path.join(args.out, rel);
    const result = copyFile(src, dest, args.dryRun);
    if (result.ok) {
      files += 1;
      if (!args.quiet) {
        console.log(`${args.dryRun ? 'would copy' : 'copied'} ${rel}`);
      }
    } else if (!args.quiet) {
      console.warn(`skip ${rel} (${result.reason})`);
    }
  }

  for (const rel of TREE_DIRS) {
    const src = path.join(ROOT, rel);
    const dest = path.join(args.out, rel);
    const result = copyTree(src, dest, args.dryRun);
    if (result.missing) {
      if (!args.quiet) console.warn(`skip tree ${rel}/ (missing source)`);
      continue;
    }
    files += result.copied;
    if (!args.quiet) {
      console.log(`${args.dryRun ? 'would copy' : 'copied'} ${rel}/ (${result.copied} files)`);
    }
  }

  if (!args.dryRun) {
    const missing = verifyOut(args.out);
    if (missing.length) {
      console.error(`dist static incomplete after copy — missing:\n  ${missing.join('\n  ')}`);
      process.exit(1);
    }
  }

  if (!args.quiet) {
    console.log(`dist static projection ${args.dryRun ? 'dry-run ' : ''}complete (${files} file ops).`);
  }
}

main();
