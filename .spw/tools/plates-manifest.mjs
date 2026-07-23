#!/usr/bin/env node
/**
 * Plate manifest reader/checker — parses .spw/state/plates-manifest.spw
 * (`^chamber[NN]{ #slug:"" !state:draft|grounded|study|public %version:N .file:"" &ledger:"" }`)
 * and either prints the gate-status table or cross-checks it against
 * book/images/*.png on disk.
 *
 * Usage:
 *   node .spw/tools/plates-manifest.mjs           # print gate table
 *   node .spw/tools/plates-manifest.mjs --check    # cross-check manifest vs disk, exit 1 on mismatch
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PLATE_MIN_BYTES = 100 * 1024; // atelier phase 02 quality floor — applies once a plate is `public`
const STATES = ['draft', 'grounded', 'study', 'public'];
const CHECK = process.argv.includes('--check');

export function parseManifest(text) {
  const chambers = [];
  const chamberRe = /\^chamber\[(\d+)\]\{([^}]*)\}/g;
  let match;
  while ((match = chamberRe.exec(text))) {
    const [, id, body] = match;
    chambers.push({
      id,
      slug: (body.match(/#slug:"([^"]*)"/) || [])[1] || '',
      state: (body.match(/!state:(\w+)/) || [])[1] || '',
      version: Number((body.match(/%version:(\d+)/) || [])[1] || 0),
      file: (body.match(/\.file:"([^"]*)"/) || [])[1] || '',
      ledger: (body.match(/&ledger:"([^"]*)"/) || [])[1] || ''
    });
  }
  return chambers;
}

export function readManifest(root = ROOT) {
  const text = fs.readFileSync(path.join(root, '.spw', 'state', 'plates-manifest.spw'), 'utf8');
  return parseManifest(text);
}

/** Chamber state for a given book/images path, or undefined if not manifested. */
export function stateForFile(localPath, root = ROOT) {
  const chamber = readManifest(root).find((c) => c.file === localPath);
  return chamber?.state;
}

function printTable(chambers) {
  const width = { id: 3, slug: Math.max(...chambers.map((c) => c.slug.length)), state: 8 };
  for (const c of chambers) {
    const flag = STATES.includes(c.state) ? '' : '  ⚠ unknown state';
    console.log(
      `${c.id}  ${c.slug.padEnd(width.slug)}  ${c.state.padEnd(width.state)}  v${c.version}  ${c.file}${flag}`
    );
  }
}

function runCheck(chambers) {
  const problems = [];
  for (const c of chambers) {
    if (!STATES.includes(c.state)) {
      problems.push(`chamber ${c.id}: unknown state "${c.state}"`);
      continue;
    }
    const full = path.join(ROOT, c.file);
    if (!fs.existsSync(full)) {
      problems.push(`chamber ${c.id}: manifest file missing on disk — ${c.file}`);
      continue;
    }
    if (c.state === 'public') {
      const bytes = fs.statSync(full).size;
      if (bytes < PLATE_MIN_BYTES) {
        problems.push(
          `chamber ${c.id}: state is public but ${(bytes / 1024).toFixed(1)}KB is under the ${PLATE_MIN_BYTES / 1024}KB floor`
        );
      }
    }
  }
  return problems;
}

function main() {
  const chambers = readManifest();

  if (CHECK) {
    const problems = runCheck(chambers);
    if (problems.length === 0) {
      console.log(`[spw:plates] check ok — ${chambers.length} chambers`);
      process.exit(0);
    }
    console.log(`[spw:plates] ${problems.length} problem(s):`);
    problems.forEach((p) => console.log(`  ${p}`));
    process.exit(1);
  } else {
    printTable(chambers);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
