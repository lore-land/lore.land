import assert from 'node:assert/strict';
import test from 'node:test';
import { voicePlan, CARRIER_TUNES } from './personality.mjs';
import { warmthMark, hushToast, hushMark } from '../story/eggs.mjs';

test('each carrier keeps three steps, and a WAP sits lower than a trick', () => {
  for (const id of Object.keys(CARRIER_TUNES)) {
    const plan = voicePlan(id, 'catch');
    assert.equal(plan.notes.length, 3);
    assert.equal(plan.who, id);
  }
  const wap = voicePlan('clown', 'wap');
  const trick = voicePlan('clown', 'trick');
  assert.ok(wap.notes[1].deg < trick.notes[1].deg);
  assert.ok(trick.notes[0].at < trick.notes[2].at);
});

test('an unknown carrier borrows the figure, and does not say a name', () => {
  const plan = voicePlan('nobody', 'catch');
  assert.equal(plan.who, 'nobody');
  assert.equal(plan.lean, CARRIER_TUNES.figure.lean);
  assert.equal(JSON.stringify(plan).includes('plain lines'), false);
});

test('the egg is a mark, and the hidden taps do not name their formula', () => {
  const warm = warmthMark(10, 20, 3);
  assert.equal(warm.kind, 'warmth');
  assert.equal(warm.rings, 3);
  const pi = hushToast('pi');
  assert.ok(pi);
  assert.equal(/pi|phi|prophecy/i.test(`${pi.title} ${pi.body}`), false);
  assert.equal(hushMark('golden', 1, 2)?.kind, 'spiral');
  assert.equal(hushToast('egg'), null);
});
