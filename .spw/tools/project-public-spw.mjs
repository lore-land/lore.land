#!/usr/bin/env node
/**
 * Project lore-owned .spw canon into a GitHub Pages / Vite-dist tree.
 *
 * Runtime honesty (PLAN.B hydration + walkable ethos refs) needs same-origin
 * /.spw/** URLs on the public monument. Vite builds to dist/ with publicDir
 * false, so nothing under .spw is emitted unless we project it.
 *
 * Allowlist: lore canon only. Never ship .spw/_workbench (submodule kernel)
 * or .spw/tools (build scripts). Workbench refs stay GitHub-side or local.
 *
 * Usage:
 *   node .spw/tools/project-public-spw.mjs
 *   node .spw/tools/project-public-spw.mjs --out dist/.spw
 *   node .spw/tools/project-public-spw.mjs --dry-run
 *   node .spw/tools/project-public-spw.mjs --verify   # check required files only
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const SPW_ROOT = path.join(ROOT, '.spw');
const DEFAULT_OUT = path.join(ROOT, 'dist', '.spw');

/** Relative directory/file globs under .spw/ that may be public. */
const PUBLIC_TREES = Object.freeze([
  'index.spw',
  'workspace.spw',
  'claims',
  'chapters',
  'runtime',
  'state',
  'surfaces',
  'audits'
]);

/** Paths that must exist after project for claim hydration + walkable specs. */
const REQUIRED_RELATIVE = Object.freeze([
  'claims/chapter-claims.spw',
  'chapters/index.spw',
  'chapters/01.spw',
  'runtime/precipitates.spw',
  'state/observable.spw',
  'state/alignment-ledger.spw',
  'surfaces/publish.spw',
  'surfaces/platform.spw',
  'surfaces/index.spw',
  'surfaces/atelier.spw',
  'index.spw',
  'workspace.spw'
]);

const EXCLUDED_DIR_NAMES = new Set(['_workbench', 'tools', 'node_modules', '.git']);

function parseArgs(argv) {
  const args = {
    out: DEFAULT_OUT,
    dryRun: false,
    verify: false,
    quiet: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--out' || token === '-o') {
      args.out = path.resolve(ROOT, argv[i + 1] || '');
      i += 1;
      continue;
    }
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--verify') {
      args.verify = true;
      continue;
    }
    if (token === '--quiet' || token === '-q') {
      args.quiet = true;
      continue;
    }
    if (token === '--help' || token === '-h') {
      args.help = true;
    }
  }

  return args;
}

function isSpwFile(name) {
  return /\.spw$/i.test(name);
}

function walkSpwFiles(dir, baseRel = '') {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.') {
      continue;
    }
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) {
        continue;
      }
      const childRel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
      files.push(...walkSpwFiles(path.join(dir, entry.name), childRel));
      continue;
    }
    if (entry.isFile() && isSpwFile(entry.name)) {
      const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
      files.push(rel.replace(/\\/g, '/'));
    }
  }

  return files;
}

function collectPublicFiles() {
  const collected = new Set();

  for (const tree of PUBLIC_TREES) {
    const abs = path.join(SPW_ROOT, tree);
    if (!fs.existsSync(abs)) {
      continue;
    }
    const stat = fs.statSync(abs);
    if (stat.isFile()) {
      if (isSpwFile(tree)) {
        collected.add(tree.replace(/\\/g, '/'));
      }
      continue;
    }
    if (stat.isDirectory()) {
      for (const rel of walkSpwFiles(abs, tree)) {
        collected.add(rel);
      }
    }
  }

  return [...collected].sort();
}

function ensureDir(dir, dryRun) {
  if (dryRun || fs.existsSync(dir)) {
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, dryRun) {
  if (dryRun) {
    return;
  }
  ensureDir(path.dirname(dest), false);
  fs.copyFileSync(src, dest);
}

function writeText(dest, text, dryRun) {
  if (dryRun) {
    return;
  }
  ensureDir(path.dirname(dest), false);
  fs.writeFileSync(dest, text, 'utf8');
}

/** Refuse outputs that would wipe the repo root or the source .spw tree. */
function assertSafeOutDir(outDir) {
  const resolved = path.resolve(outDir);
  const rootResolved = path.resolve(ROOT);
  const spwResolved = path.resolve(SPW_ROOT);
  const rootPrefix = rootResolved.endsWith(path.sep) ? rootResolved : `${rootResolved}${path.sep}`;

  if (resolved === rootResolved) {
    throw new Error('Refusing --out at project root (would rm -rf the working tree)');
  }
  if (resolved === spwResolved || resolved.startsWith(`${spwResolved}${path.sep}`)) {
    throw new Error('Refusing --out inside source .spw/ (projection is emit-only)');
  }
  if (resolved !== rootResolved && !resolved.startsWith(rootPrefix)) {
    throw new Error(`Refusing --out outside project root: ${resolved}`);
  }
}

function verifyRequired(files, label) {
  const missing = REQUIRED_RELATIVE.filter((rel) => !files.includes(rel));
  if (missing.length) {
    const list = missing.map((m) => `  - ${m}`).join('\n');
    throw new Error(`Public .spw projection incomplete (${label}). Missing:\n${list}`);
  }
}

function verifySourceTrees() {
  const files = collectPublicFiles();
  verifyRequired(files, 'source .spw');
  return files;
}

function projectTo(outDir, { dryRun = false, quiet = false } = {}) {
  if (!fs.existsSync(SPW_ROOT)) {
    throw new Error(`Missing .spw root at ${SPW_ROOT}`);
  }

  assertSafeOutDir(outDir);

  const files = collectPublicFiles();
  verifyRequired(files, 'source before project');

  if (!dryRun) {
    // Clean previous projection so removed canon files do not linger.
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    ensureDir(outDir, false);
  }

  for (const rel of files) {
    const src = path.join(SPW_ROOT, rel);
    const dest = path.join(outDir, rel);
    copyFile(src, dest, dryRun);
  }

  const manifest = {
    generated_by: 'project-public-spw.mjs',
    generated_at: new Date().toISOString(),
    public_url_prefix: '/.spw/',
    exclude: ['_workbench', 'tools'],
    trees: [...PUBLIC_TREES],
    required: [...REQUIRED_RELATIVE],
    files,
    counts: {
      files: files.length,
      bytes: files.reduce((sum, rel) => {
        try {
          return sum + fs.statSync(path.join(SPW_ROOT, rel)).size;
        } catch {
          return sum;
        }
      }, 0)
    },
    notes: [
      'Lore-owned canon only — hydrate claims from /.spw/claims/chapter-claims.spw',
      'Walkable ethos spec/impl refs that live under .spw/ resolve same-origin after project',
      'Workbench submodule is never projected; use GitHub blob URLs for kernel paths'
    ]
  };

  writeText(
    path.join(outDir, 'public-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    dryRun
  );

  // Tiny plain-text index so a human can open /.spw/ and see intent.
  const indexLines = [
    '# Lore.Land public Spw projection',
    `# emitted ${manifest.generated_at}`,
    '# URL prefix: /.spw/',
    '#',
    ...files.map((f) => `/.spw/${f}`)
  ];
  writeText(path.join(outDir, 'README.txt'), `${indexLines.join('\n')}\n`, dryRun);

  if (!quiet) {
    const mode = dryRun ? 'dry-run' : 'wrote';
    console.log(
      `[spw:project] ${mode} ${files.length} files → ${path.relative(ROOT, outDir) || outDir} (${manifest.counts.bytes} bytes)`
    );
  }

  return manifest;
}

function printHelp() {
  console.log(`project-public-spw.mjs — emit public lore .spw into a servable tree

Options:
  --out, -o <dir>   Output directory (default: dist/.spw)
  --dry-run         List what would be copied; do not write
  --verify          Only verify source allowlist has required files
  --quiet, -q       Suppress success log
  --help, -h        This help

Required public paths (claim hydration + walkable specs):
${REQUIRED_RELATIVE.map((r) => `  /.spw/${r}`).join('\n')}
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.verify) {
    const files = verifySourceTrees();
    if (!args.quiet) {
      console.log(`[spw:project] verify ok — ${files.length} public source files`);
    }
    return;
  }

  projectTo(args.out, { dryRun: args.dryRun, quiet: args.quiet });
}

// Allow import for tests / vite plugin without running main.
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(`[spw:project] ${error.message || error}`);
    process.exit(1);
  }
}

export {
  PUBLIC_TREES,
  REQUIRED_RELATIVE,
  collectPublicFiles,
  projectTo,
  verifySourceTrees
};
