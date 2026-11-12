#!/usr/bin/env node
// @ts-check
/**
 * browser-smoke.mjs — the behaviours checks cannot see, driven in a real browser (npm run smoke).
 *
 * Needs Chrome, so it is not a CI step. Each scenario is something that once passed every check while being wrong:
 * a game whose clock had stopped, a passage changed with no mark, a deed that never reached its margin, a parser path
 * that fell back without saying so.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../../../tools/browser-harness/index.mjs';

/** @typedef {import('../../../tools/browser-harness/index.mjs').Page} Page */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/* Reaches the game's closure as the file is served. The repository carries no test hook. */
const HOOK_AT = '  const update = (rawDt) => {';
const HOOK = 'window.__pieTest = { get run() { return run; }, get state() { return state; }, get board() { return board; }, enterChapter: (...a) => enterChapter(...a), closeLeg: () => closeLeg(), knock: (t) => knock(t) };\n';
const SWITCHES = { cohort: 'returning', choices: { 'way-through': 'on', reasons: 'on' }, tried: [], resolved: { 'way-through': 'on', reasons: 'on' } };
/* A new player's story cards stop the clock. */
const PLAYER = { best: 1, runs: 3, view: { story: false, zen: true, focusOnPlay: false }, sound: false, met: [], cards: [] };

/**
 * Start from a known browser state.
 * @param {Page} page
 * @param {Record<string, unknown>} store
 */
async function seed(page, store) {
  await page.goto('/charm/');
  await page.ev(`(() => { localStorage.clear(); sessionStorage.clear(); for (const [k, v] of Object.entries(${JSON.stringify(store)})) localStorage.setItem(k, JSON.stringify(v)); })()`);
}

/** @type {[string, (page: Page) => Promise<void>][]} */
const SCENARIOS = [
  ['the game clock runs, and a set-aside chapter is stepped over', async (page) => {
    await seed(page, { 'lore.switches.v1': SWITCHES, 'lore.pie.v1': PLAYER, 'lore.way.v1': { aside: [2], apart: [], now: [2] } });
    await page.goto('/pie/?chapter=1');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`__pieTest.state === 'running'`);
    const t = await page.ev('__pieTest.run.t');
    await page.waitFor(`__pieTest.run.t > ${t} + 1`);
    const chapter = await page.ev(`(() => { const r = __pieTest.run; __pieTest.closeLeg(); __pieTest.enterChapter(r.chapter + 1, { closed: 'carried', note: '' }); return __pieTest.run.chapter; })()`);
    if (chapter !== 3) throw new Error(`expected Chapter 3 after stepping over 2, got ${chapter}`);
  }],
  ['a deed in the lanes reaches its margin', async (page) => {
    await seed(page, { 'lore.switches.v1': SWITCHES, 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=6');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`__pieTest.state === 'running'`);
    await page.ev(`(() => { const r = __pieTest.run; r.hurtT = 0; __pieTest.knock({ kind: 'pane', x: r.x, y: r.y }); __pieTest.closeLeg(); })()`);
    const deeds = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.deeds.v1'))`);
    if (!deeds?.[6]?.pane_struck) throw new Error(`no pane_struck kept: ${JSON.stringify(deeds)}`);
    await page.setViewport(1400, 900);
    await page.goto('/book/chapter/06/');
    await page.waitFor(`document.querySelector('[data-ebook-section]')`);
    const told = await page.ev(`(async () => { for (const s of document.querySelectorAll('main.chapter [data-ebook-section]')) { s.scrollIntoView(); await new Promise((r) => setTimeout(r, 900)); if (/struck \\d+ pane/.test(document.body.textContent)) return true; } return false; })()`);
    if (!told) throw new Error('the margin never said how many panes were struck');
  }],
  ['a passage told another way is marked, and can be put back', async (page) => {
    await seed(page, { 'lore.switches.v1': SWITCHES, 'lore.way.v1': { aside: [], apart: ['two_pies'], now: [] } });
    await page.goto('/book/chapter/12/');
    await page.waitFor(`document.querySelectorAll('main.chapter .way-swapped').length >= 5`);
    await page.ev(`[...document.querySelectorAll('.way-note .way-pick')].find((b) => /as written/.test(b.textContent)).click()`);
    const back = await page.ev(`(() => { const m = document.querySelector('main.chapter'); return m.textContent.includes('received in welcome') && m.querySelectorAll('.way-swapped').length === 0; })()`);
    if (!back) throw new Error('the words did not come back');
  }],
  ['a way from a link holds for the visit and leaves the address', async (page) => {
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: {}, tried: [], resolved: {} } });
    await page.goto(`/book/chapter/06/?way=${encodeURIComponent('^way{ !aside[7] }')}`);
    await page.waitFor(`sessionStorage.getItem('lore.way.visit')`);
    await page.waitFor(`!location.search.includes('way=')`);
    if (await page.ev(`localStorage.getItem('lore.way.v1')`)) throw new Error('a link wrote the reader\'s own way');
  }],
  ['a switch hands its room back at once', async (page) => {
    await page.setViewport(1440, 900);
    await seed(page, { 'lore.pie.v1': { ...PLAYER, view: { story: true, zen: false, focusOnPlay: false, cardPace: 'quiet', panels: 'auto' } } });
    await page.goto('/pie/?chapter=3');
    await page.waitFor(`window.__pieTest && document.querySelector('.pie-voyage').dataset.tracks`);
    await page.ev(`document.querySelector('[data-pie-toggle="zen"]').click()`);
    await page.waitFor(`document.querySelector('.pie-voyage').dataset.tracks === 'solo'`);
    await page.waitFor(`Math.abs((() => { const b = document.querySelector('.pie-cabinet').getBoundingClientRect(); return (b.left + b.right) / 2 - document.documentElement.clientWidth / 2; })()) < 12`);
    await page.ev(`document.querySelector('[data-pie-toggle="zen"]').click()`);
    await page.ev(`document.querySelector('[data-pie-toggle="story"]').click()`);
    await page.waitFor(`document.querySelector('.pie-voyage').dataset.tracks === 'pair'`);
    const caption = await page.ev(`Boolean(document.querySelector('.pie-caption').offsetParent)`);
    if (!caption) throw new Error('folding the story took the caption with it');
  }],
  ['Setup leaves the lanes in view, and no choice runs off it', async (page) => {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await page.setViewport(w, h);
      await seed(page, { 'lore.pie.v1': { ...PLAYER, view: { story: true, zen: false, focusOnPlay: false, cardPace: 'quiet', panels: 'auto' } } });
      await page.goto('/pie/?chapter=3');
      await page.waitFor(`document.querySelector('[data-pie-setup-toggle]')?.offsetParent`);
      await page.ev(`document.querySelector('.pie-cabinet').scrollIntoView({ block: 'start', behavior: 'instant' }); document.querySelector('[data-pie-setup-toggle]').click()`);
      await page.waitFor(`document.querySelector('[data-pie-setup]').matches(':popover-open')`);
      const seen = await page.ev(`(() => { const s = document.querySelector('[data-pie-setup]'); const a = s.getBoundingClientRect(); const b = document.querySelector('.pie-screen').getBoundingClientRect(); const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)); const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); const wide = [...s.querySelectorAll('[role=tab]')].some((t) => { t.click(); const p = s.querySelector('.pie-setup-panel'); return p.scrollWidth > p.clientWidth + 1; }); return { covered: (ix * iy) / (b.width * b.height), wide }; })()`);
      if (seen.covered > 0.62) throw new Error(`Setup covers ${Math.round(seen.covered * 100)}% of the lanes at ${w}`);
      if (seen.wide) throw new Error(`a section of Setup runs off its side at ${w}`);
    }
  }],
  ['a filled screen is all lanes and ground, the buttons clear of the road in play', async (page) => {
    /** @type {Array<[number, number, string]>} */
    const screens = [[390, 844, 'one_thumb'], [844, 390, 'two_thumbs'], [768, 1024, 'propped']];
    for (const [w, h, hold] of screens) {
      await page.setViewport(w, h, { mobile: true });
      await seed(page, { 'lore.pie.v1': { ...PLAYER, view: { story: true, zen: false, focusOnPlay: false, cardPace: 'quiet', panels: 'auto', hold, fill: 'fill' } } });
      await page.goto('/pie/?chapter=3');
      await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-fullscreen]')?.offsetParent`);
      // Headless refuses requestFullscreen without a real gesture, so this takes the immersive path, as an iPhone does.
      await page.ev(`document.querySelector('[data-pie-fullscreen]').click()`);
      await page.waitFor(`window.__pieTest.board.filled`);
      const seen = await page.ev(`(() => { const b = window.__pieTest.board; const c = document.querySelector('.pie-screen canvas').getBoundingClientRect(); const keys = [...document.querySelectorAll('.pie-screen .pie-steps .pie-step')].filter((k) => k.offsetParent).map((k) => k.getBoundingClientRect()); const left = -b.x0 * b.s, top = -b.y0 * b.s, right = left + 360 * b.s, played = top + 520 * b.s; return { canvas: [c.width, c.height], view: [innerWidth, innerHeight], inside: b.x0 <= 0.5 && b.y0 <= 0.5 && b.x0 + b.w >= 359.5 && b.y0 + b.h >= 559.5, over: keys.filter((k) => k.left < right && k.right > left && k.top < played && k.bottom > top).length, keys: keys.length }; })()`);
      if (Math.abs(seen.canvas[0] - seen.view[0]) > 1 || Math.abs(seen.canvas[1] - seen.view[1]) > 1) throw new Error(`the filled canvas is ${seen.canvas.join('×')} on a ${seen.view.join('×')} screen`);
      if (!seen.inside) throw new Error(`the world is cut at ${w}×${h}`);
      if (!seen.keys) throw new Error(`no buttons stand on a filled screen at ${w}×${h}`);
      if (seen.over) throw new Error(`${seen.over} button(s) over the road in play at ${w}×${h}`);
    }
  }],
  ['an anthill is a bump and gossip, never a spill', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: { anthills: 'on' }, tried: [], resolved: { anthills: 'on' } }, 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=1');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running' && window.__pieTest.run`);
    // Clear the road near the pie, and set an anthill straight ahead of it.
    await page.ev(`(() => { const r = window.__pieTest.run; r.things = r.things.filter((t) => t.y < 0); r.things.push({ kind: 'anthill', x: r.x, home: r.x, lane: r.lane, y: r.y - 70, w: 36, h: 18, fatal: false, born: r.t }); })()`);
    await page.waitFor(`window.__pieTest.run.tags.some((t) => /THE ANTS GOSSIP/.test(t.text))`, { timeoutMs: 8000 });
    const state = await page.ev(`window.__pieTest.state`);
    if (state !== 'running') throw new Error(`an anthill ended the carry (${state})`);
  }],
  ['every id in a drawing is its own', async (page) => {
    await page.setViewport(1200, 900);
    await page.goto('/pie/');
    await page.waitFor(`document.querySelectorAll('lore-panel svg').length >= 6`);
    // Through the page's own copy of the module: another copy at another address would count from one again.
    await page.ev(`import(document.querySelector('script[src*="pie-game.mjs"]').src).then(() => import([...performance.getEntriesByType('resource')].find((r) => r.name.includes('characters.mjs')).name)).then((m) => { const d = document.createElement('div'); d.innerHTML = m.portraitSVG('boof') + m.portraitSVG('boof'); document.body.append(d); })`);
    const clash = await page.ev(`(() => { const seen = new Set(); for (const e of document.querySelectorAll('svg [id]')) { if (seen.has(e.id)) return e.id; seen.add(e.id); } return ''; })()`);
    if (clash) throw new Error(`two drawings share the id ${clash}`);
  }],
  ['the real parser runs where it can fall back silently', async (page) => {
    await page.goto('/pie/');
    const reader = await page.ev(`import('/book/scripts/home/pie-spw.mjs').then(async (m) => (await m.loadRules())?.reader)`);
    if (reader !== 'spw-seed') throw new Error(`pie rules were read by ${reader}`);
    const bias = await page.ev(`import('/book/scripts/modules/spw-bias.mjs').then(async (m) => { await m.warmBiasParser(); return m.readBias('=meme[pov]{ pop }').reader; })`);
    if (bias !== 'spw-seed') throw new Error(`a bias spell was read by ${bias}`);
    await page.goto('/book/chapter/10/');
    await page.waitFor(`document.querySelector('.bracework')`);
    await page.ev(`(() => { const plate = document.querySelector('.bracework'); plate.scrollIntoView(); plate.querySelector('button, summary')?.click(); })()`);
    await page.waitFor(`/Read by the Spw interpreter/.test(document.querySelector('.bracework').textContent)`);
  }]
];

/** @type {number} */
let failures;
try {
failures = await withHarness({
  root: ROOT,
  allowDotPaths: ['.spw', '.well-known'],
  denyPaths: ['.spw/_workbench', '.spw/tools', 'node_modules', '.studio'],
  transforms: [{ path: 'book/scripts/home/pie-game.mjs', apply: (text) => {
    if (!text.includes(HOOK_AT)) throw new Error('browser-smoke: the hook point has moved in pie-game.mjs');
    return text.replace(HOOK_AT, HOOK + HOOK_AT);
  } }]
}, async (harness) => {
  let failed = 0;
  for (const [name, run] of SCENARIOS) {
    /** @type {Page | null} */
    let page = null;
    try {
      page = await harness.open();
      await run(page);
      const { exceptions } = page.problems();
      if (exceptions.length) throw new Error(`uncaught: ${exceptions[0].split('\n')[0]}`);
      console.log(`  ok  ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`  FAIL ${name}\n       ${error instanceof Error ? error.message : String(error)}`);
    }
    page?.close();
  }
  return failed;
});
} catch (error) {
  // The browser itself could not start or stay up, which says nothing about the site.
  console.error(`smoke[blocked]{${error instanceof Error ? error.message : String(error)}}`);
  process.exit(2);
}
console.log(`smoke[${failures ? 'fail' : 'ok'}]{${SCENARIOS.length - failures} of ${SCENARIOS.length}}`);
process.exit(failures ? 1 : 0);
