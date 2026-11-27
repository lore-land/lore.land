import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toBase64Url, fromBase64Url, encodeSpwFragment, decodeSpwFragment,
  projectCrossHostSlot, buildPortableDoorUrl
} from './spw-portable.mjs';

test('base64url and #spw64= fragment codec round-trip ASCII, Spw operators, and Unicode', () => {
  const spw = '~walk[dawn_field]<chapter_1 lantern_path ?egg>{ #note["boon—berry · warm"] }';
  const b64 = toBase64Url(spw);
  assert.doesNotMatch(b64, /[+/=]/);
  assert.equal(fromBase64Url(b64), spw);

  const frag = encodeSpwFragment(spw);
  assert.ok(frag.startsWith('#spw64='));
  assert.equal(decodeSpwFragment(frag), spw);
  assert.equal(decodeSpwFragment(`https://lore.land/scriptorium/?focus=egg#projection&${frag.slice(1)}`), spw);
});

test('decodeSpwFragment and fromBase64Url reject malformed or empty inputs safely', () => {
  assert.equal(fromBase64Url(''), null);
  assert.equal(fromBase64Url('not!valid*base64'), null);
  assert.equal(decodeSpwFragment(''), null);
  assert.equal(decodeSpwFragment('#projection'), null);
  assert.equal(decodeSpwFragment('#spw64=***bad***'), null);
});

test('projectCrossHostSlot formats lore.land items into word[mode]{body}(scene)<concept>', () => {
  const slot = projectCrossHostSlot({
    sigil: '*',
    word: 'Torch Ant',
    mode: 'wonder',
    body: ['.at[dawnward_field]', '#keeps[lane_light]'],
    scene: 'chapter 01',
    concept: 'warmth',
    source: 'lore.land/almanac/'
  });
  assert.equal(
    slot,
    '*torch_ant[wonder]{ .at[dawnward_field] #keeps[lane_light] }(chapter_01)<warmth> #from["lore.land/almanac/"]'
  );
});

test('buildPortableDoorUrl appends #spw64= and replaces any existing fragment cleanly', () => {
  const url = buildPortableDoorUrl('https://factshift.center/desk#old', '^board{ .hold[far] }');
  assert.ok(url.startsWith('https://factshift.center/desk#spw64='));
  assert.equal(decodeSpwFragment(url), '^board{ .hold[far] }');
});
