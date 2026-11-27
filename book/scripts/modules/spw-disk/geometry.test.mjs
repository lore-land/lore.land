import test from 'node:test';
import assert from 'node:assert/strict';

import { mobius, alongGeodesic, fromCentre, geodesic, layoutFrom, cAbs } from './geometry.mjs';
import {
  buildGraph, loopKey, loopsThrough, subgraphAround, shortestPath, exportWalkAsSpw
} from './graph.mjs';
import { decodeSpwFragment } from '../spw-portable.mjs';

function sampleGraph() {
  return buildGraph({
    chapters: [
      { number: 1, title: 'The Frosted Field', inWhich: 'a warm thing is found' },
      { number: 2, title: 'The Lanes', inWhich: 'pies begin to fly' }
    ],
    items: {
      'room:1.1': { id: 'room:1.1', kind: 'room', chapter: 1, sigil: '~', title: 'Dawn Furrow', spw: '~dawn_furrow@boof', href: '/book/chapter/01/#r1' },
      'room:1.2': { id: 'room:1.2', kind: 'room', chapter: 1, sigil: '?', title: 'Egg Hollow', spw: '?egg_hollow@boof', href: '/book/chapter/01/#r2' },
      'room:2.1': { id: 'room:2.1', kind: 'room', chapter: 2, sigil: '~', title: 'Cobble Gate', spw: '~cobble_gate@boof', href: '/book/chapter/02/#r1' },
      'character:boof': { id: 'character:boof', kind: 'character', chapter: 1, sigil: '@', title: 'Boof' },
      'wonder:torch_ant': { id: 'wonder:torch_ant', kind: 'wonder', chapter: 1, sigil: '*', title: 'Torch-Ant' }
    },
    wonders: [{ id: 'torch_ant', kind: 'creature', home: 1, region: 'dawnward field', note: 'lights the lane' }],
    places: (key) => (key === 'torch_ant' ? [{ c: 1, id: 'r1' }, { c: 2, id: 'r1' }] : [])
  });
}

test('Poincaré disk Möbius map, geodesic interpolation, and SVG path preserve hyperbolic invariants', () => {
  const a = [0.42, -0.31];
  const carried = mobius(a, a);
  assert.ok(cAbs(carried) < 1e-12);
  const rimSafe = mobius([0.7, 0.5], a);
  assert.ok(cAbs(rimSafe) < 1);

  assert.equal(cAbs(alongGeodesic(a, 0)), 0);
  const end = alongGeodesic(a, 1);
  assert.ok(Math.hypot(end[0] - a[0], end[1] - a[1]) < 1e-9);
  assert.ok(fromCentre(alongGeodesic(a, 0.5)) < fromCentre(a));

  assert.match(geodesic([0, 0], [0.5, 0]), /^M.*L/);
  assert.match(geodesic([0.5, 0], [0, 0.5]), /^M.*A/);
});

test('buildGraph, layoutFrom, loopsThrough, subgraphAround, and shortestPath traverse canon cleanly', () => {
  const graph = sampleGraph();
  const layout = layoutFrom(graph, 'chapter:01');
  assert.equal(layout.focus, 'chapter:01');
  assert.equal(cAbs(layout.at.get('chapter:01')?.z), 0);
  assert.ok(layout.at.size >= 5);

  const sub = subgraphAround(graph, 'chapter:01', { maxDepth: 1 });
  assert.ok(sub.nodeIds.includes('chapter:01'));
  assert.ok(sub.nodeIds.includes('room:1.1'));
  assert.ok(!sub.nodeIds.includes('chapter:02'));

  const path = shortestPath(graph, 'chapter:01', 'chapter:02');
  assert.ok(path && path.ids[0] === 'chapter:01' && path.ids[path.ids.length - 1] === 'chapter:02');
  assert.equal(path.edges.length, path.ids.length - 1);

  const loops = loopsThrough(graph, 'chapter:01');
  assert.ok(loops.length >= 1);
  assert.equal(loopKey(['a', 'b', 'c']), loopKey(['c', 'b', 'a']));
});

test('exportWalkAsSpw produces canonical Spw and portable #spw64= URLs', () => {
  const graph = sampleGraph();
  const plain = exportWalkAsSpw(graph, ['chapter:01', 'room:1.1', 'egg'], { title: 'Morning Walk' });
  assert.equal(plain, '~walk[morning_walk]<chapter_1 dawn_furrow ?egg>');

  const bundle = exportWalkAsSpw(graph, ['chapter:01', 'room:1.1', 'egg'], { title: 'Morning Walk', portable: true });
  assert.equal(bundle.spw, plain);
  assert.match(bundle.slot, /^~morning_walk\[projection_disk\]/);
  assert.equal(decodeSpwFragment(bundle.url), plain);
});
