import assert from 'node:assert/strict';
import test from 'node:test';
import { sceneVector, scenePhysics, handleOf } from './scene.mjs';
import { teachLine, leanSentence, jokeOf } from '../menu/teach.mjs';
import { thresholdBranch, shelvesOpen } from '../story/thresholds.mjs';

test('an untouched board keeps the even genre dial', () => {
  const v = sceneVector({}, { boon: 2, bone: 1 });
  assert.equal(v.boon, 2);
  assert.equal(v.bane, 1);
  assert.equal(v.bone, 1);
  assert.equal(v.bonk, 1);
  assert.equal(v.honk, 1);
});

test('a chosen handle leans its shelf and teaches the joke', () => {
  const v = sceneVector({ feel: 'jazz', wap: 'cream', steps: 'tiptoe' }, {});
  assert.ok(v.honk > v.boon);
  assert.equal(handleOf('feel', 'jazz')?.shelf, 'honk');
  assert.match(teachLine('wap', 'cream'), /whistle/);
  assert.equal(jokeOf('steps', 'felt')?.id, 'socks');
  assert.match(leanSentence({ feel: 'jazz', wap: 'cream', steps: 'tiptoe' }, {}), /honk/);
  assert.match(leanSentence({}, {}), /even/);
});

test('scene physics follows the handles', () => {
  const jazz = scenePhysics({ feel: 'jazz', songSpace: 'hall', swing: 'deep' });
  assert.ok(jazz.air > 1);
  assert.ok(jazz.wonder > 1);
  assert.ok(jazz.pocket > 1);
  const hush = scenePhysics({ steps: 'felt', feel: 'written' });
  assert.ok(hush.settle > 1);
});

test('a threshold speaks once, strongest shelf first, and remembers who misread it', () => {
  const v = { boon: 0.2, bane: 0.1, bone: 0.1, bonk: 0.22, honk: 0.38 };
  assert.deepEqual(shelvesOpen(v), ['honk']);
  const first = thresholdBranch(v, []);
  assert.equal(first?.shelf, 'honk');
  assert.equal(first?.who, 'boof');
  assert.match(first?.aside || '', /punchline/);
  assert.equal(thresholdBranch(v, ['honk']), null);
  const both = { boon: 0.34, bane: 0.08, bone: 0.08, bonk: 0.16, honk: 0.34 };
  assert.equal(thresholdBranch(both, [])?.shelf, 'boon');
});
