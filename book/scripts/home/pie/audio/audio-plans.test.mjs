import test from 'node:test';
import assert from 'node:assert/strict';

import { colourPlan, harmonicBridgePlan, chapterArcPlan } from './harmony.mjs';
import { jazzStyleFor, registerJazzStyle, registerJazzLean, jazzPhrasePlan, compVoicingPlan, walkingBassPlan } from './jazz.mjs';
import { composePhraseVariation, themeFlourishPlan } from './story-plans.mjs';
import { roomPlan, shelfColorParams, stingPlan } from './scored-plans.mjs';

test('harmonicBridgePlan maps chapters onto the mod-13 ring and Pythagorean comma convergents', () => {
  const ch1 = harmonicBridgePlan(1);
  const ch14 = harmonicBridgePlan(14);
  assert.equal(ch1.book, 1);
  assert.equal(ch1.ringSeat, 1);
  assert.equal(ch1.octaveTwin, 14);
  assert.equal(ch14.book, 2);
  assert.equal(ch14.ringSeat, 1);
  assert.equal(ch14.octaveTwin, 1);
  assert.ok(ch1.commaCents > 23 && ch1.commaCents < 24);
  assert.match(ch1.earSpell, /^\^ear\{/);
});

test('custom jazz style and lean registries resolve through jazzPhrasePlan without mutating defaults', () => {
  const okStyle = registerJazzStyle('test_quartal_bright', {
    voicing: [5, 10, 14, 17],
    enclosure: false,
    layback: 0.01,
    pass: 7,
    approach: -1
  });
  assert.equal(okStyle, true);
  assert.equal(registerJazzLean('test_moment', 'test_quartal_bright'), true);
  assert.equal(jazzStyleFor('test_moment'), 'test_quartal_bright');
  const plan = jazzPhrasePlan({ motivation: 'test_moment', chapter: 3, progress: 0.4, richness: 0.8 });
  assert.equal(plan.style, 'test_quartal_bright');
  assert.deepEqual(plan.compSemis, [5, 10, 14, 17]);
  assert.equal(plan.walkLine.notes.length, 4);
  assert.ok(plan.compVoicing.every((n) => n >= 0 && n <= 16));
});

test('composePhraseVariation transforms motifs across retrograde, inversion, augmentation, and echo', () => {
  const base = themeFlourishPlan('boof', 'trick').notes;
  const retro = composePhraseVariation(base, 'retrograde');
  assert.deepEqual(retro.map((n) => n.deg), [...base].reverse().map((n) => n.deg));
  assert.deepEqual(retro.map((n) => n.at), base.map((n) => n.at));

  const inv = composePhraseVariation(base, 'invert');
  assert.equal(inv[0].deg, base[0].deg);
  assert.equal(inv[1].deg, 2 * base[0].deg - base[1].deg);

  const aug = composePhraseVariation(base, 'augment');
  assert.ok(aug[1].at > base[1].at);
  assert.ok(aug[0].dur > base[0].dur);

  const echoed = composePhraseVariation(base, 'echo', { delay: 0.2, decay: 0.5 });
  assert.equal(echoed.length, base.length * 2);
  assert.ok(echoed[echoed.length - 1].at >= base[base.length - 1].at + 0.19);
});

test('roomPlan, colourPlan, walkingBassPlan, and shelfColorParams preserve bounded acoustic invariants', () => {
  const colour = colourPlan('~', { jazz: true });
  assert.ok(colour.sung.length >= 2);
  const room = roomPlan({ ground: 'city', room: { secs: 9, damp: -2, early: [[0.01, 0.9], [0.02, 0.9]] } });
  assert.ok(room.secs <= 2.4 && room.secs >= 0.4);
  assert.ok(room.damp >= 0 && room.damp <= 1);
  const earlyEnergy = room.early.reduce((sum, [, g]) => sum + g * g, 0);
  assert.ok(earlyEnergy <= 0.5001);

  const neutral = shelfColorParams({});
  assert.equal(neutral.mode, 'unchanged');
  const boon = shelfColorParams({ boon: 5 });
  assert.equal(boon.mode, 'unchanged');
  assert.ok(boon.bright > neutral.bright);
  assert.ok(stingPlan('boon', { complete: true }).some((n) => n.part === 'cadence'));

  const walk = walkingBassPlan({ chapter: 10, progress: 0.4, bar: 1 });
  assert.equal(walk.approach, 'pedal');
  const arc = chapterArcPlan({ chapter: 9, progress: 0.9, bar: 3 });
  assert.equal(arc.withhold, true);
  assert.ok(compVoicingPlan({ bassOffset: 0, compSemis: [4, 7, 11], prevVoicing: [4, 7, 11] }).length === 3);
});
