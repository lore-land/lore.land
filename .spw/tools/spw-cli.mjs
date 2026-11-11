#!/usr/bin/env node
// @ts-check
/**
 * spw-cli.mjs — the workbench CLI, read-only (npm run spw -- <command>).
 *
 * The canon is written by hand and by its generators. This door lets through commands that measure and select, and
 * refuses the ones that rewrite sources. To run one deliberately, call the workbench's main.ts yourself.
 */
import { spawnSync } from 'node:child_process';

/** Commands that read. `format` and `mount` are allowed only in their read forms, below. */
const READS = new Set(['doctor', 'roots', 'tree', 'census', 'graph', 'formula', 'density', 'form', 'lattice', 'measure', 'authority', 'taste', 'stack', 'fingerprint', 'lint', 'query', 'resolve', 'select', 'outline', 'ls', 'inspect', 'help']);
const WRITE_FLAGS = /^--(write|apply|fix|save|html|force)(=|$)/;

/**
 * Why a command line may not run, or null if it may.
 * @param {string[]} args
 * @returns {string | null}
 */
export function refusal(args) {
  const [command, sub] = args;
  if (!command || args.includes('--help') || args.includes('-h')) return null;
  const flag = args.find((arg) => WRITE_FLAGS.test(arg));
  if (flag) return `${flag} would write`;
  if (command === 'format') return args.includes('--check') ? null : 'format rewrites sources without --check';
  if (command === 'mount') return ['check', 'resolve'].includes(sub) ? null : `mount ${sub ?? ''} is not a read`.trim();
  return READS.has(command) ? null : `${command} is not on the read-only list`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const why = refusal(args);
  if (why) {
    console.error(`[spw] refused: ${why}. To run it deliberately: npx tsx --tsconfig .spw/_workbench/tsconfig.base.json .spw/_workbench/packages/spw-cli/src/main.ts ${args.join(' ')}`);
    process.exit(2);
  }
  const run = spawnSync('npx', ['tsx', '--tsconfig', '.spw/_workbench/tsconfig.base.json', '.spw/_workbench/packages/spw-cli/src/main.ts', ...args], { stdio: 'inherit' });
  process.exit(run.status ?? 1);
}
