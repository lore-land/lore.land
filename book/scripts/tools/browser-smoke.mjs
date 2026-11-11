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
const HOOK = 'window.__pieTest = { get run() { return run; }, get state() { return state; }, enterChapter: (...a) => enterChapter(...a), closeLeg: () => closeLeg(), knock: (t) => knock(t) };\n';
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
  ['the real parser runs where it can fall back silently', async (page) => {
    await page.goto('/pie/');
    const reader = await page.ev(`import('/book/scripts/home/pie-spw.mjs').then(async (m) => (await m.loadRules())?.reader)`);
    if (reader !== 'spw-seed') throw new Error(`pie rules were read by ${reader}`);
  }]
];

const failures = await withHarness({
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
    const page = await harness.open();
    try {
      await run(page);
      const { exceptions } = page.problems();
      if (exceptions.length) throw new Error(`uncaught: ${exceptions[0].split('\n')[0]}`);
      console.log(`  ok  ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`  FAIL ${name}\n       ${error instanceof Error ? error.message : String(error)}`);
    }
    page.close();
  }
  return failed;
});
console.log(`smoke[${failures ? 'fail' : 'ok'}]{${SCENARIOS.length - failures} of ${SCENARIOS.length}}`);
process.exit(failures ? 1 : 0);
