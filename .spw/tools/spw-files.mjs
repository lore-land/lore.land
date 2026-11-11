// @ts-check
/**
 * spw-files.mjs — one answer to "which .spw files are the canon?", for every tool that walks the tree.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Directories under .spw that are not authored canon. */
export const SPW_SKIP_DIRS = Object.freeze(new Set(['_workbench', 'tools', 'gen', 'node_modules', '.git']));

/**
 * Every .spw file under a directory, skipping what is not canon.
 * @param {string} dir
 * @param {string[]} [out]
 * @returns {string[]}
 */
export function spwFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SPW_SKIP_DIRS.has(entry.name)) spwFiles(path.join(dir, entry.name), out);
    } else if (entry.name.endsWith('.spw')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}
