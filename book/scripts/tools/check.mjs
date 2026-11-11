#!/usr/bin/env node
// @ts-check
/**
 * check.mjs — one door: every `npm run` step in .github/workflows/ci.yml, in that order (npm run check).
 *
 * The steps are read from the workflow, so the door and CI cannot part. It stops at the first failure and shows that
 * step's output; a passing step stays quiet. It also fails if running the steps changed a tracked file, which means a
 * generated file was stale. The last line is one token a person can paste.
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const steps = [...readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8').matchAll(/^\s*(?:- )?run:\s*npm run (.+?)\s*$/gm)].map((m) => m[1]);
const tree = () => execFileSync('git', ['status', '--porcelain'], { cwd: ROOT }).toString();
/** @type {(state: string, detail: string, code: number) => never} */
const finish = (state, detail, code) => { console.log(`check[${state}]{${detail}}`); process.exit(code); };

if (!steps.length) finish('fail', 'no npm run steps found in ci.yml', 1);
const before = tree();
const began = Date.now();
for (const step of steps) {
  // A local run reports the probes without writing a dated audit; CI's copy is thrown away with the runner.
  const line = step.startsWith('spw:probes') ? `${step} -- --no-write` : step;
  const started = Date.now();
  const run = spawnSync(`npm run --silent ${line}`, { cwd: ROOT, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (run.status !== 0) {
    const output = `${run.stdout || ''}${run.stderr || ''}`.trim().split('\n').slice(-40).join('\n');
    console.error(output);
    finish('fail', step, run.status || 1);
  }
  console.log(`  ok  ${step} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
}
const after = tree();
if (after !== before) {
  const was = new Set(before.split('\n'));
  console.error(after.split('\n').filter((row) => row && !was.has(row)).slice(0, 20).join('\n'));
  finish('stale', 'the steps changed tracked files: a generated file was out of date', 1);
}
finish('ok', `${steps.length} steps, ${Math.round((Date.now() - began) / 1000)}s`, 0);
