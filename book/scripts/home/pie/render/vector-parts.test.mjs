import test from 'node:test';
import assert from 'node:assert/strict';

import { VECTOR_PARTS, computeCarrierPose, createStampCache, drawVectorPart } from './vector-parts.mjs';

test('VECTOR_PARTS defines non-empty SVG path grammar for carriers and presences', () => {
  const keys = Object.keys(VECTOR_PARTS);
  assert.ok(keys.includes('hatCrown'));
  assert.ok(keys.includes('baneCrown'));
  assert.ok(keys.includes('boofTail'));
  for (const key of keys) {
    assert.match(VECTOR_PARTS[key].d, /^M\s*-?\d/);
    assert.equal(VECTOR_PARTS[key].origin.length, 2);
  }
});

test('computeCarrierPose zeroes secondary motion when reduced or not running', () => {
  const reducedPose = computeCarrierPose({ t: 2.5, running: true, reduced: true, carrierId: 'genie', beatPulse: 1, wobble: 0.8 });
  const idlePose = computeCarrierPose({ t: 2.5, running: false, reduced: false, carrierId: 'porter', beatPulse: 1, wobble: 0.8 });
  for (const pose of [reducedPose, idlePose]) {
    assert.equal(pose.torsoLean, 0);
    assert.equal(pose.bobY, 0);
    assert.equal(pose.hemSwing, 0);
    assert.equal(pose.hatFloatY, 0);
    assert.equal(pose.strideLeft, 0);
    assert.equal(pose.plateCounter, 0);
  }
});

test('computeCarrierPose preserves Figure plain-line stillness while articulating other carriers', () => {
  const fig = computeCarrierPose({ t: 0.7, running: true, carrierId: 'figure', beatPulse: 0.9, wobble: 0.6, tiltDir: 1, moveProgress: 0.5, moveDir: 1 });
  assert.equal(fig.torsoLean, 0);
  assert.equal(fig.bobY, 0);
  assert.equal(fig.plateCounter, 0);
  assert.notEqual(fig.strideLeft, 0);

  const genie = computeCarrierPose({ t: 0.7, running: true, carrierId: 'genie', beatPulse: 0.9, wobble: 0.6, tiltDir: 1, moveProgress: 0.5, moveDir: 1 });
  assert.notEqual(genie.torsoLean, 0);
  assert.notEqual(genie.bobY, 0);
  assert.notEqual(genie.hemSwing, 0);
  assert.notEqual(genie.plateCounter, 0);
});

test('drawVectorPart invokes fallback cleanly when Path2D is unavailable in Node', () => {
  let called = false;
  const drew = drawVectorPart(/** @type {any} */ ({}), 'hatCrown', {
    fill: true,
    fallback: () => { called = true; }
  });
  assert.equal(drew, true);
  assert.equal(called, true);
});

test('createStampCache caches surfaces with LRU eviction when OffscreenCanvas exists', () => {
  const OriginalOffscreen = globalThis.OffscreenCanvas;
  try {
    globalThis.OffscreenCanvas = /** @type {any} */ (class MockOffscreen {
      constructor(w, h) { this.width = w; this.height = h; }
      getContext() {
        return { save() {}, scale() {}, restore() {} };
      }
    });
    const cache = createStampCache({ maxEntries: 2 });
    let renders = 0;
    const render = () => { renders += 1; };
    const a1 = cache.getOrRender('medallion:boon', 32, 32, render, 2);
    const a2 = cache.getOrRender('medallion:boon', 32, 32, render, 2);
    assert.equal(a1, a2);
    assert.equal(renders, 1);
    assert.equal(cache.stats().hits, 1);

    cache.getOrRender('medallion:bane', 32, 32, render, 2);
    // Touch boon again so bane becomes least-recently-used.
    cache.getOrRender('medallion:boon', 32, 32, render, 2);
    cache.getOrRender('medallion:bone', 32, 32, render, 2);
    assert.equal(cache.stats().size, 2);
    // Re-requesting bane triggers a miss; boon stays cached.
    cache.getOrRender('medallion:boon', 32, 32, render, 2);
    assert.equal(renders, 3);
    cache.getOrRender('medallion:bane', 32, 32, render, 2);
    assert.equal(renders, 4);
  } finally {
    if (OriginalOffscreen === undefined) delete globalThis.OffscreenCanvas;
    else globalThis.OffscreenCanvas = OriginalOffscreen;
  }
});
