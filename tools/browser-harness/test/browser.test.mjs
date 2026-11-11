// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HarnessError, findChrome, startHarness, withHarness } from '../index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'fixtures/site');
const cli = path.join(here, '../cli.mjs');
let skip = /** @type {string | false} */ (false);
try { findChrome(); } catch { skip = 'no Chrome on this machine'; }
const profiles = () => fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('browser-harness-'));

test('a missing browser says so', () => {
  assert.throws(() => findChrome('/nope/chrome'), (error) => error instanceof HarnessError && error.code === 'CHROME_NOT_FOUND');
});

test('a root that is not a directory says so', async () => {
  await assert.rejects(startHarness({ root: '/nonexistent/place' }), (error) => error instanceof HarnessError && error.code === 'BAD_ROOT');
});

test('a clean page has no problems; transforms reach the page', { skip }, async () => {
  await withHarness({ root, transforms: [{ path: 'index.html', apply: (text) => text.replace("'original'", "'patched'") }] }, async (harness) => {
    const page = await harness.open('/');
    assert.equal(await page.waitFor('window.ready'), true);
    assert.equal(await page.ev('window.marker'), 'patched');
    assert.deepEqual(page.problems(), { exceptions: [], consoleErrors: [], failedRequests: [] });
    page.close();
  });
});

test('problems are collected, from the first request on', { skip }, async () => {
  await withHarness({ root }, async (harness) => {
    const page = await harness.open('/broken.html');
    await page.waitFor('document.readyState === "complete"');
    await new Promise((resolve) => { setTimeout(resolve, 300); });
    const problems = page.problems();
    assert.match(problems.exceptions.join(), /thrown later/);
    assert.match(problems.consoleErrors.join(), /logged an error/);
    assert.match(problems.failedRequests.join(), /404 .*missing\.png/);
    page.close();
  });
});

test('ev rejects when the page throws; waitFor rejects on timeout', { skip }, async () => {
  await withHarness({ root }, async (harness) => {
    const page = await harness.open('/');
    await assert.rejects(page.ev('nope.nope'), (error) => error instanceof HarnessError && error.code === 'PAGE_THROW');
    await assert.rejects(page.waitFor('false', { timeoutMs: 200 }), (error) => error instanceof HarnessError && error.code === 'TIMEOUT');
    page.close();
  });
});

test('beforeLoad runs ahead of page scripts; viewport applies', { skip }, async () => {
  await withHarness({ root }, async (harness) => {
    const page = await harness.open();
    await page.beforeLoad('window.seeded = 7;');
    await page.setViewport(390, 700, { mobile: true });
    await page.goto('/');
    assert.equal(await page.ev('window.seeded'), 7);
    assert.equal(await page.ev('innerWidth'), 390);
    page.close();
  });
});

test('stop leaves no profile behind, and is safe to repeat', { skip }, async () => {
  const before = profiles();
  const harness = await startHarness({ root });
  assert.equal(profiles().length, before.length + 1);
  await harness.stop();
  await harness.stop();
  assert.deepEqual(profiles(), before);
});

test('the CLI exits 0 on a clean route, 1 on a broken one, 2 on bad usage', { skip }, () => {
  assert.match(execFileSync('node', [cli, '--root', root, '--route', '/', '--settle', '100']).toString(), /ok\s+\//);
  const broken = spawnSync('node', [cli, '--root', root, '--route', '/broken.html', '--settle', '300', '--json']);
  assert.equal(broken.status, 1);
  const kinds = JSON.parse(broken.stdout.toString()).reports[0].problems.map((/** @type {string} */ text) => text.split(':')[0]);
  for (const kind of ['exception', 'console', 'request', 'overflow']) assert.ok(kinds.includes(kind), kind);
  assert.equal(spawnSync('node', [cli, '--root', root]).status, 2);
});
