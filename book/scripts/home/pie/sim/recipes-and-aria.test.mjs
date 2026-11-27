import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BUILTIN_RECIPES, RECIPES, registerRecipe, unregisterRecipe, listRecipes,
  recipeVisualFor, resolveRecipeBake
} from './recipes.mjs';
import { formatBoardReadout, createAriaMirror } from './aria-mirror.mjs';

test('recipe registry supports custom recipes with visual defaults and clean unregistration', () => {
  const baseCount = listRecipes().length;
  assert.ok(baseCount >= 7);
  const created = registerRecipe('frost_tart', {
    name: 'Frost-Glass Tart',
    short: 'Frost',
    formula: 'frost + warm furrow',
    summary: 'Crisp winter crust.',
    visual: { crustTop: '#d7eef7', sheen: true }
  });
  assert.equal(RECIPES.frost_tart.name, 'Frost-Glass Tart');
  assert.equal(created.visual.crustTop, '#d7eef7');
  assert.equal(created.visual.fluteCount, BUILTIN_RECIPES.warm.visual.fluteCount);
  assert.equal(recipeVisualFor('frost_tart').sheen, true);

  unregisterRecipe('frost_tart');
  assert.equal(RECIPES.frost_tart, undefined);
  assert.equal(listRecipes().length, baseCount);
});

test('resolveRecipeBake upgrades combining crafted recipes at high richness into Sovereign Quinary', () => {
  const normal = resolveRecipeBake({ id: 'set_jam', prevId: 'warm', richness: 0.9, charges: 3 });
  assert.deepEqual(normal, { id: 'set_jam', charges: 3, royal: false });

  const lowRich = resolveRecipeBake({ id: 'savoury', prevId: 'set_jam', richness: 0.6, charges: 3 });
  assert.deepEqual(lowRich, { id: 'savoury', charges: 3, royal: false });

  const royal = resolveRecipeBake({ id: 'savoury', prevId: 'set_jam', richness: 0.82, charges: 3 });
  assert.deepEqual(royal, { id: 'royal', charges: 5, royal: true });

  assert.equal(resolveRecipeBake({ id: 'missing_recipe', prevId: 'warm', richness: 0.9 }), null);
});

test('formatBoardReadout produces concise screen-reader summaries across game states', () => {
  assert.match(formatBoardReadout(null), /ready to begin/i);
  assert.match(formatBoardReadout({
    state: 'title', chapter: 4, carrierName: 'the figure', lane: 2, lanes: 5, row: 0,
    wobble: 0, waps: 0, cobbles: 0, recipeName: 'Warm pie', presence: null,
    aheadThreat: null, aheadFriend: null, caption: null
  }), /Chapter 4/);

  const live = formatBoardReadout({
    state: 'running', chapter: 6, carrierName: 'the Genie', lane: 1, lanes: 5, row: 2,
    wobble: 0.42, waps: 3, cobbles: 120, recipeName: 'Set jam', presence: 'Mr. BoonWAP',
    aheadThreat: 'dividers in lane 2', aheadFriend: null, caption: 'Hold steady.'
  });
  assert.match(live, /Chapter 6/);
  assert.match(live, /the Genie, lane 2 of 5, row 3/);
  assert.match(live, /tilt 42%/);
  assert.match(live, /pie Set jam/);
  assert.match(live, /Mr\. BoonWAP present/);
  assert.match(live, /ahead: dividers in lane 2/);
  assert.match(live, /3 WAPs/);
});

test('createAriaMirror rate-limits polite sync and forces immediate readout via readNow', () => {
  const spoken = [];
  const mirror = createAriaMirror({ root: null, say: (line) => spoken.push(line) });
  const snapA = {
    state: 'running', chapter: 1, carrierName: 'the figure', lane: 2, lanes: 5, row: 0,
    wobble: 0.1, waps: 0, cobbles: 10, recipeName: 'Warm pie', presence: null,
    aheadThreat: null, aheadFriend: 'clown in lane 3', caption: null
  };
  const snapB = { ...snapA, lane: 3, wobble: 0.35 };

  const first = mirror.sync(snapA, { force: true });
  assert.equal(mirror.lastReadout(), first);
  assert.equal(spoken.length, 0);

  // Immediately syncing snapB is throttled (doesn't overwrite lastReadout within 1400ms).
  mirror.sync(snapB);
  assert.equal(mirror.lastReadout(), first);

  // readNow forces an update and calls say().
  const forced = mirror.readNow(snapB);
  assert.equal(mirror.lastReadout(), forced);
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0], forced);
});
