// @ts-check
/* The live .spw loop (npm run dev): what the dev server says of a saved surface, and what the page's readers take. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { watches, readSurface } from './vite-spw-live.mjs';

const seed = await import('../vendor/spw-seed.mjs');
const RULES = readFileSync(new URL('../../../.spw/runtime/pie-rules.spw', import.meta.url), 'utf8');

test('watches the tree, not the mounted workbench', () => {
  assert.equal(watches('.spw/runtime/pie-rules.spw'), true);
  assert.equal(watches('.spw/surfaces/tropes.spw'), true);
  assert.equal(watches('.spw/_workbench/.spw/index.spw'), false);
  assert.equal(watches('PLAN.F.spw'), false);
  assert.equal(watches('.spw/runtime/notes.md'), false);
});

test('a runtime surface as committed reads whole', () => {
  const read = readSurface(seed, RULES);
  assert.equal(read.whole, true);
  assert.equal(read.lintFails, false);
  assert.deepEqual(read.issues, []);
});

test('a broken draft says where, and that spw:lint --strict would fail it', () => {
  const read = readSurface(seed, `${RULES}^broken{ "never closed\n`);
  assert.equal(read.whole, false);
  assert.equal(read.lintFails, true);
  assert.equal(read.issues[0].kind, 'error');
  assert.ok(read.issues[0].line > 1);
});

test('readers take a whole surface by name, keep what they had for a broken one, and can decline', async () => {
  const target = new EventTarget();
  /** @type {any} */ (globalThis).window = target;
  try {
    const { onSurface, SURFACE_EVENT } = await import(`../modules/spw-live.mjs?test=${Date.now()}`);
    /** @type {string[]} */
    const got = [];
    const stop = onSurface('/.spw/runtime/pie-rules.spw?v=2026_11_16.B', 'the rules', (/** @type {string} */ source) => { got.push(source); });
    onSurface('/.spw/runtime/pie-rules.spw', 'a reader not ready', () => false);
    onSurface('/.spw/runtime/bias.spw', 'the registers', () => { got.push('wrong surface'); });
    /** @param {Record<string, unknown>} over */
    const hear = (over) => {
      const detail = { path: '/.spw/runtime/pie-rules.spw', source: 'x', whole: true, complete: true, proseFallback: false, issues: [], ms: 1, taken: [], kept: [], ...over };
      target.dispatchEvent(new CustomEvent(SURFACE_EVENT, { detail }));
      return detail;
    };
    const whole = hear({ source: '^rules{ }' });
    assert.deepEqual(got, ['^rules{ }']);
    assert.deepEqual(whole.taken, ['the rules']);
    assert.deepEqual(whole.kept, ['a reader not ready']);
    const broken = hear({ whole: false, source: '^rules{' });
    assert.deepEqual(got, ['^rules{ }']);
    assert.deepEqual(broken.kept, ['the rules', 'a reader not ready']);
    stop();
    const after = hear({ source: '^later{ }' });
    assert.deepEqual(after.taken, []);
  } finally {
    delete (/** @type {any} */ (globalThis).window);
  }
});
