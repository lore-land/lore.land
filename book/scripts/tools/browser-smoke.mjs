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
import { SEASONS, keptLine } from '../home/pie-seasons.mjs';
import { SHELF_LABEL, mirrored } from '../modules/kept-lines.mjs';
import { readFileSync } from 'node:fs';
import { forksOfChapter } from '../modules/forks.mjs';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';

/** @typedef {import('../../../tools/browser-harness/index.mjs').Page} Page */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/* Reaches the game's closure as the file is served. The repository carries no test hook. */
const HOOK_AT = '  const update = (rawDt) => {';
const HOOK = 'window.__pieTest = { get run() { return run; }, get state() { return state; }, get board() { return board; }, actOutChain: (f) => actOutChain(f), scheme: () => scheme(), enterChapter: (...a) => enterChapter(...a), closeLeg: () => closeLeg(), knock: (t) => knock(t), setClock: (iso) => { seasonClock = () => new Date(iso); }, paste: (t) => pasteSpell(t), carrier: (id) => { run.carrier = carrierById(id); }, jump: () => jump(), laneX: (l) => laneX(l), ring: (...a) => spawnRing(...a) };\n';
const SWITCHES = { cohort: 'returning', choices: { 'way-through': 'on', reasons: 'on' }, tried: [], resolved: { 'way-through': 'on', reasons: 'on' } };
/* A new player's story cards stop the clock. */
const PLAYER = { best: 1, runs: 3, view: { story: false, zen: true, focusOnPlay: false }, sound: false, met: [], cards: [] };

/* Where the book forks (forks.mjs): the forks trial alone (the way off, so taking a side must turn it on), and the lines
 * Twelve should draw, written here from way.json by the same module. The shelves trial, for his scheme. */
const FORKS_ON = { cohort: 'returning', choices: { forks: 'on' }, tried: [], resolved: { forks: 'on' } };
const SHELVES_ON = { cohort: 'returning', choices: { shelves: 'on' }, tried: [], resolved: { shelves: 'on' } };
const FORKS_12 = forksOfChapter(12, JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../content/world/way.json'), 'utf8')), TOTAL_CHAPTERS);

/* A season (pie-seasons.mjs): its switch on, a day inside it, a day after it, and the line it leaves. */
const SEASON = SEASONS[0];
const SEASON_ON = { cohort: 'returning', choices: { seasons: 'on' }, tried: [], resolved: { seasons: 'on' } };
const SEASON_DAY = `${SEASON.opens.slice(0, 8)}${String(Number(SEASON.opens.slice(8)) + 1).padStart(2, '0')}`;
const SEASON_LINE = keptLine(SEASON, { day: SEASON_DAY, chapter: 1, carrier: 'porter' });
const AFTER_SEASON = '2026-12-05T12:00:00';
/** Open the lanes on a day, and start a carry. @param {Page} page @param {string} at */
async function carryOn(page, at) {
  await page.setViewport(1200, 900);
  await page.goto('/pie/?chapter=1');
  await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
  await page.ev(`__pieTest.setClock(${JSON.stringify(at)})`);
  await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
  await page.waitFor(`window.__pieTest.state === 'running' && window.__pieTest.run`);
}
/** Clear the road near the pie and set a season's place straight ahead of it. */
const PLACE_AHEAD = `(() => { const r = window.__pieTest.run; r.things = r.things.filter((t) => t.y < 0); r.things.push({ kind: 'place', x: r.x, home: r.x, lane: r.lane, y: r.y - 70, w: 34, h: 20, fatal: false, born: r.t, faint: r.season?.mode !== 'open' }); })()`;

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
  ['a chapter draws its forks from their own lines, and a side taken there tells it that way at once', async (page) => {
    await seed(page, { 'lore.switches.v1': FORKS_ON });
    await page.goto('/book/chapter/12/');
    await page.waitFor(`document.querySelectorAll('.way-forks[data-way-forks="12"] .way-fork').length === ${FORKS_12.length}`);
    // Each fork is drawn from its own line: the line shown reads whole with the real parser, and is the line forks.mjs writes.
    const drawn = await page.ev(`(async () => { const seed = await import('/book/scripts/vendor/spw-seed.mjs'); return [...document.querySelectorAll('.way-fork')].map((f) => { const line = f.querySelector('.spell-line').textContent.replace(/\\s+/g, ' ').trim(); const c = seed.parse(line, { lexProfile: 'prose' }).completeness; return { id: f.dataset.fork, side: f.dataset.side, line, whole: c.complete && !c.proseFallback, sides: f.querySelectorAll('.way-fork-side').length }; }); })()`);
    FORKS_12.forEach((want) => {
      const got = drawn.find((/** @type {{ id: string }} */ d) => d.id === want.id);
      if (!got) throw new Error(`no fork ${want.id} at the end of Twelve`);
      if (got.line !== want.line) throw new Error(`${want.id} drew ${got.line}, not its own line ${want.line}`);
      if (!got.whole || got.sides !== 2) throw new Error(`${want.id}: ${JSON.stringify(got)}`);
      if (got.side !== (want.kind === 'chapter' ? 'kept' : 'meet')) throw new Error(`${want.id}: a reader with no way is on ${got.side}, not the book as it stands`);
    });
    if (await page.ev(`document.querySelectorAll('main.chapter .way-swapped').length`)) throw new Error('a passage was told another way before any side was taken');
    // Take the other side: the way is written, turned on by that hand, and the chapter is told that way at once.
    await page.ev(`(() => { document.querySelector('.way-forks').open = true; document.querySelector('[data-fork="two_pies"] .way-fork-side[data-side="apart"]').click(); })()`);
    await page.waitFor(`document.querySelectorAll('main.chapter .way-swapped').length >= 5 && document.querySelector('[data-fork="two_pies"]').dataset.side === 'apart'`);
    const kept = await page.ev(`({ way: JSON.parse(localStorage.getItem('lore.way.v1')), on: JSON.parse(localStorage.getItem('lore.switches.v1')).choices['way-through'], said: document.querySelector('.way-forks .way-receipt').textContent })`);
    if (!kept.way?.apart?.includes('two_pies') || kept.on !== 'on') throw new Error(`taking a side did not write the way: ${JSON.stringify(kept)}`);
    if (!kept.said.includes('^way{ =apart[two_pies] }')) throw new Error(`the receipt did not say the new way: ${kept.said}`);
    // And back: the words as written, and nothing left marked.
    await page.ev(`document.querySelector('[data-fork="two_pies"] .way-fork-side[data-side="meet"]').click()`);
    await page.waitFor(`(() => { const m = document.querySelector('main.chapter'); return m.textContent.includes('received in welcome') && m.querySelectorAll('.way-swapped').length === 0 && document.querySelector('[data-fork="two_pies"]').dataset.side === 'meet'; })()`);
    // Setting the chapter itself aside says so at its head; taking it back takes the note away.
    await page.ev(`document.querySelector('[data-fork="c12"] .way-fork-side[data-side="aside"]').click()`);
    await page.waitFor(`/is set aside/.test(document.querySelector('.way-note')?.textContent || '')`);
    await page.ev(`document.querySelector('[data-fork="c12"] .way-fork-side[data-side="kept"]').click()`);
    await page.waitFor(`!document.querySelector('.way-note')`);
    // A way set before the reader switched it off is read back, not written over, when a side turns it on again.
    await seed(page, { 'lore.switches.v1': FORKS_ON, 'lore.way.v1': { aside: [2], apart: [], now: [2] } });
    await page.goto('/book/chapter/12/');
    await page.waitFor(`document.querySelector('[data-fork="two_pies"] .way-fork-side[data-side="apart"]')`);
    await page.ev(`document.querySelector('[data-fork="two_pies"] .way-fork-side[data-side="apart"]').click()`);
    await page.waitFor(`document.querySelector('[data-fork="two_pies"]').dataset.side === 'apart'`);
    const after = await page.ev(`JSON.parse(localStorage.getItem('lore.way.v1'))`);
    if (!after?.aside?.includes(2) || !after.apart?.includes('two_pies')) throw new Error(`taking a side wrote over the way the reader had: ${JSON.stringify(after)}`);
    // With the switch off, a chapter adds no fold and fetches nothing for it.
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: {}, tried: [], resolved: {} } });
    await page.goto('/book/chapter/12/');
    await page.waitFor(`document.querySelector('.chapter-turn')`);
    await new Promise((r) => setTimeout(r, 1200));
    const off = await page.ev(`({ fold: Boolean(document.querySelector('.way-forks')), fetched: performance.getEntriesByType('resource').filter((e) => /\\/world\\/way\\.json|\\/modules\\/forks\\.mjs/.test(e.name)).map((e) => e.name) })`);
    if (off.fold || off.fetched.length) throw new Error(`with the switch off: ${JSON.stringify(off)}`);
  }],
  ['his scheme, drawn by the shelves, shows the line that chose it once a carry', async (page) => {
    await seed(page, { 'lore.switches.v1': SHELVES_ON, 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=3');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`__pieTest.state === 'running'`);
    const t = await page.ev('__pieTest.run.t');
    await page.waitFor(`__pieTest.run.t > ${t} + 0.5`);
    await page.ev(`(() => { __pieTest.run.marchNext = false; __pieTest.scheme(); })()`);
    const first = await page.ev(`(async () => { const r = __pieTest.run; const seed = await import('/book/scripts/vendor/spw-seed.mjs'); const whole = (l) => { const c = seed.parse(l, { lexProfile: 'prose' }).completeness; return c.complete && !c.proseFallback; }; return { fork: r.schemeFork, drew: r.bane?.id, tagged: r.tags.filter((g) => /^=bane@banewap\\{/.test(g.text)).length, whole: r.schemeFork ? whole(r.schemeFork.ranked) && whole(r.schemeFork.drawn) : false }; })()`);
    if (!first.fork) throw new Error('the shelves drew his scheme and no line said so');
    if (first.fork.drawn !== `=bane@banewap{ @${first.drew} }` || !first.fork.ranked.includes(`@${first.drew}`)) throw new Error(`the line that chose does not name the scheme drawn (${first.drew}): ${JSON.stringify(first.fork)}`);
    if (!first.whole || first.tagged !== 1) throw new Error(`the line that chose: ${JSON.stringify(first)}`);
    // Once a carry: a second scheme keeps the first line and adds no other.
    await page.ev(`(() => { __pieTest.run.schemeFork.seen = 1; __pieTest.run.bane = null; __pieTest.run.marchNext = false; __pieTest.scheme(); })()`);
    const second = await page.ev(`({ seen: __pieTest.run.schemeFork.seen, tagged: __pieTest.run.tags.filter((g) => /^=bane@banewap\\{/.test(g.text)).length })`);
    if (second.seen !== 1 || second.tagged > 1) throw new Error(`the line was shown twice in one carry: ${JSON.stringify(second)}`);
    // A march the bane chain called was chosen by the chain, not the odds: no line chose it, so none is shown.
    await page.goto('/pie/?chapter=6');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`__pieTest.state === 'running'`);
    await page.ev(`(() => { __pieTest.run.marchNext = true; __pieTest.scheme(); })()`);
    const called = await page.ev(`({ id: __pieTest.run.bane?.id, fork: Boolean(__pieTest.run.schemeFork) })`);
    if (called.id !== 'march' || called.fork) throw new Error(`a march the chain called: ${JSON.stringify(called)}`);
    // With the shelves off, no line chose, and none is shown.
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: {}, tried: [], resolved: {} }, 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=3');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`__pieTest.state === 'running'`);
    await page.ev(`__pieTest.scheme()`);
    if (await page.ev(`Boolean(__pieTest.run.schemeFork)`)) throw new Error('a line was shown with the shelves off');
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
  ['the story is paced: no two captions crowd in the first half minute', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: { shelves: 'on' }, tried: [], resolved: { shelves: 'on' } }, 'lore.pie.v1': { ...PLAYER, view: { story: true, zen: false, focusOnPlay: false, cardPace: 'quiet', panels: 'auto' } } });
    // Chapter Fourteen's rooms are short and much in it is met for the first time: the densest opening in the book.
    await page.goto('/pie/?chapter=14');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    await page.ev(`(() => { const t0 = performance.now(); window.__caps = []; const el = document.querySelector('[data-pie-toast-title]'); new MutationObserver(() => window.__caps.push({ t: (performance.now() - t0) / 1000, text: el.textContent })).observe(el, { childList: true, characterData: true, subtree: true }); setInterval(() => { const r = window.__pieTest.run; if (r) r.wobble = 0; }, 100); })()`);
    await new Promise((r) => setTimeout(r, 30000));
    const caps = await page.ev(`window.__caps.filter((c, i, all) => !all.slice(0, i).some((o) => Math.abs(o.t - c.t) < 0.15)).filter((c) => !/has a scheme|foiled|^Pushed back|withdraws/i.test(c.text))`);
    const gaps = caps.slice(1).map((/** @type {{ t: number }} */ c, /** @type {number} */ i) => c.t - caps[i].t);
    if (caps.length < 3) throw new Error(`only ${caps.length} captions in 30 seconds: the carry may have stopped`);
    if (Math.min(...gaps) < 2.4) throw new Error(`two captions ${Math.min(...gaps).toFixed(2)} s apart in the first half minute`);
  }],
  ['a first carry on a phone: a tap plays, and the lanes run ten seconds before any card', async (page) => {
    // A new player on a phone used to tap Play and meet a card a second later, with the clock stopped under it.
    await page.setViewport(390, 844, { mobile: true });
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await seed(page, {});
    await page.goto('/pie/');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    // A finger taps Play once the page has settled. The page scrolls smoothly, so a tap measured mid-scroll can land on
    // a mode button (introductions open their cards at once, as they should): the tap waits until Play is under it.
    await page.ev(`document.querySelector('[data-pie-card-action]').scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await page.waitFor(`(() => { const e = document.querySelector('[data-pie-card-action]'); const b = e.getBoundingClientRect(); const x = b.x + b.width / 2, y = b.y + b.height / 2; const was = window.__at; window.__at = x + ',' + y; return was === window.__at && document.elementFromPoint(x, y) === e; })()`, { timeoutMs: 8000 });
    const at = await page.ev(`(() => { const b = document.querySelector('[data-pie-card-action]').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
    await page.send('Input.synthesizeTapGesture', { x: at.x, y: at.y, gestureSourceType: 'touch' });
    await page.waitFor(`window.__pieTest.state === 'running'`, { timeoutMs: 6000 });
    await page.ev(`setInterval(() => { const r = window.__pieTest.run; if (r) r.wobble = 0; }, 100)`);
    await page.waitFor(`window.__pieTest.state !== 'running' || window.__pieTest.run.t > 10`, { timeoutMs: 40000 });
    const t = await page.ev(`window.__pieTest.state + ' at ' + window.__pieTest.run.t.toFixed(1) + ' s'`);
    if (!t.startsWith('running')) throw new Error(`the carry stopped before ten seconds: ${t}`);
  }],
  ['a find opens by skill and not by gifts: the Genie steers three donuts from three lanes, and the haggle plays', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=1&live');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    await page.ev(`setInterval(() => { const r = window.__pieTest.run; if (r) r.wobble = 0; }, 100)`);
    /** Three donuts met one after another: from one lane (standing still) or from three (steering). */
    const eatThree = (/** @type {boolean} */ steer) => page.ev(`(async () => { const t = window.__pieTest; for (let i = 0; i < 3; i += 1) { const r = t.run; r.things = r.things.filter((x) => x.y < 0 && !x.fatal); const lane = ${steer ? 'i + 1' : '2'}; r.x = t.laneX(lane); r.lane = lane; r.things.push({ kind: 'donut', x: r.x, home: r.x, lane, y: r.y - 6, w: 24, h: 22, fatal: false, born: r.t }); await new Promise((ok) => setTimeout(ok, 350)); } return { donuts: t.run.donuts, found: JSON.parse(localStorage.getItem('lore.pie.finds.v1') || '{}') }; })()`);
    await page.ev(`window.__pieTest.carrier('genie')`);
    const still = await eatThree(false);
    if (still.found.haggle) throw new Error('the haggle opened for a Genie standing still in one lane');
    const porter = await page.ev(`(window.__pieTest.carrier('porter'), true)`) && await eatThree(true);
    if (porter.found.haggle) throw new Error('the haggle opened for a carrier who is not the Genie');
    await page.ev(`window.__pieTest.carrier('genie')`);
    const steered = await eatThree(true);
    if (!steered.found.haggle?.line?.endsWith(' elggah_}')) throw new Error(`the haggle did not open, or its line is not sealed: ${JSON.stringify(steered.found)}`);
    const after = await page.ev(`({ haggled: window.__pieTest.run.haggled, moments: (window.__pieTest.run.moments || []).map((m) => m.kind), room: JSON.parse(sessionStorage.getItem('lore.pie.live.finds') || '[]'), said: [...document.querySelectorAll('.pie-live-gift[data-phase=found]')].map((p) => p.textContent) })`);
    if (!after.haggled || !after.moments.includes('haggle')) throw new Error(`the haggle opened but its moment or its gift did not: ${JSON.stringify(after)}`);
    if (!after.room.includes('haggle') || !after.said.length) throw new Error(`the room was not told: ${JSON.stringify(after)}`);
    // Heard as drawn: a tock for each struck price, then the coin, on the carry's own clock.
    await page.waitFor(`(window.__pieTest.run.moments || []).some((m) => m.kind === 'haggle' && m.heard === 3 && m.coin)`, { timeoutMs: 6000 });
    // What the hands did, handed to the book: the deed kept on its chapter, the lean said, the artifact made.
    await page.waitFor(`JSON.parse(localStorage.getItem('lore.almanac.v1') || '{}')['struck-price-tag']`, { timeoutMs: 6000 });
    const kept = await page.ev(`({ deeds: JSON.parse(localStorage.getItem('lore.pie.deeds.v1') || '{}'), why: window.__pieTest.run.leanWhy || {}, legs: window.__pieTest.run.legEvents || {} })`);
    if (kept.deeds[1]?.find_haggle !== 1 || kept.legs.find_haggle) throw new Error(`the haggle was not kept once on Chapter One: ${JSON.stringify(kept.deeds)}`);
    if (kept.why.find_haggle !== 1 || !(kept.why.donut >= 3)) throw new Error(`the haggle and the donuts did not lean the land: ${JSON.stringify(kept.why)}`);
  }],
  ['a find is retold in its chapter: the margin at the Genie\'s price tag counts the haggles', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.pie.deeds.v1': { 5: { find_haggle: 2 } } });
    await page.goto('/book/chapter/05/');
    // The margin follows the paragraph being read: the one where he reads a gauge the way he reads a price tag.
    await page.waitFor(`[...document.querySelectorAll('main p')].some((p) => /price tag/.test(p.textContent)) && document.querySelector('.reading-ref')`, { timeoutMs: 8000 });
    await page.ev(`[...document.querySelectorAll('main p')].find((p) => /price tag/.test(p.textContent)).scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await page.waitFor(`[...document.querySelectorAll('.reading-ref-item[data-track=lanes], .reading-ref-whisper')].some((e) => /Priced against himself/.test(e.textContent) && /proved it 2 times/.test(e.textContent))`, { timeoutMs: 8000 });
  }],
  ['a find turns a rival gift by skill: a bane rose hopped, the off switch thrown, and the sniff wilts the thorns', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.pie.v1': { ...PLAYER, reached: 6 } });
    await page.goto('/pie/?chapter=5');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    await page.ev(`setInterval(() => { const r = window.__pieTest.run; if (r) r.wobble = 0; }, 100)`);
    // A bane rose ahead, and another further up; a hop over the near one.
    await page.ev(`(() => { const t = window.__pieTest; const r = t.run; r.unkept = 0; r.things = r.things.filter((x) => x.y < 0 && !x.fatal); r.things.push({ kind: 'banerose', rival: true, x: r.x, home: r.x, lane: r.lane, y: -200, w: 30, h: 26, fatal: true, born: r.t }); t.jump(); })()`);
    // In the hang of the hop, a bane rose arrives under the carrier.
    await page.waitFor(`window.__pieTest.run.jumpT > 0 && window.__pieTest.run.jumpT < 0.42`, { timeoutMs: 3000 });
    await page.ev(`(() => { const r = window.__pieTest.run; r.things.push({ kind: 'banerose', rival: true, x: r.x, home: r.x, lane: r.lane, y: r.y, w: 30, h: 26, fatal: true, born: r.t }); })()`);
    await page.waitFor(`window.__pieTest.run.things.some((x) => x.kind === 'banerose' && x.cleared)`, { timeoutMs: 3000 });
    // His scheme, and its switch thrown at once.
    await page.ev(`(() => { const t = window.__pieTest; t.scheme(); const r = t.run; r.things.push({ kind: 'switch', x: r.x, home: r.x, lane: r.lane, y: r.y - 6, w: 26, h: 26, fatal: false, born: r.t }); })()`);
    await page.waitFor(`JSON.parse(localStorage.getItem('lore.pie.finds.v1') || '{}').sniff`, { timeoutMs: 5000 });
    const after = await page.ev(`({ moments: (window.__pieTest.run.moments || []).map((m) => m.kind), wilted: window.__pieTest.run.things.filter((x) => x.kind === 'banerose' && !x.cleared).map((x) => x.wilted && !x.fatal), why: window.__pieTest.run.leanWhy || {} })`);
    if (!after.moments.includes('sniff') || !after.wilted.length || !after.wilted.every(Boolean)) throw new Error(`the sniff opened but its moment or its wilting did not: ${JSON.stringify(after)}`);
    if (!(after.why.turned >= 1) || after.why.find_sniff !== 1) throw new Error(`a rival rose hopped, and the sniff, did not lean the land: ${JSON.stringify(after.why)}`);
  }],
  ['the bloom garden (a trial): in Chapter Eleven his scheme opens bane roses, never in the way through, and the sniff needs no stream', async (page) => {
    await page.setViewport(1200, 900);
    // Off, as every trial starts: his scheme opens nothing. (Cards never pause here: a first meeting in Chapter Eleven
    // used to open a card now and then, stop the clock, and leave his first beat unplayed.)
    await seed(page, { 'lore.pie.v1': { ...PLAYER, reached: 12, view: { ...PLAYER.view, cardPace: 'quiet' } } });
    await page.goto('/pie/?chapter=11');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    await page.ev(`setInterval(() => { const r = window.__pieTest.run; if (r) { r.wobble = 0; r.unkept = 5; } }, 100)`);
    await page.ev(`window.__pieTest.scheme()`);
    await new Promise((r) => setTimeout(r, 2600));
    if (await page.ev(`window.__pieTest.run.things.some((x) => x.bloom)`)) throw new Error('the bloom garden opened roses with its trial off');
    await page.goto('/pie/?chapter=11&try=bloom-garden');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    await page.ev(`setInterval(() => { const r = window.__pieTest.run; if (r) { r.wobble = 0; r.unkept = 5; } }, 100)`);
    await page.ev(`window.__pieTest.scheme()`);
    await page.waitFor(`window.__pieTest.state !== 'running' || window.__pieTest.run.things.some((x) => x.kind === 'banerose' && x.bloom)`, { timeoutMs: 15000 });
    const clock = await page.ev(`window.__pieTest.state`);
    if (clock !== 'running') throw new Error(`the clock stopped before his first beat (${clock})`);
    const roses = await page.ev(`window.__pieTest.run.things.filter((x) => x.bloom).map((x) => ({ lane: x.lane, safe: x.wayWas, rival: Boolean(x.rival) }))`);
    if (roses.some((/** @type {{ lane: number, safe: number, rival: boolean }} */ r) => r.lane === r.safe || r.rival)) throw new Error(`a bloom rose opened in the way through, or came as a rival's: ${JSON.stringify(roses)}`);
    // Hopped (one brought under the carrier in the hang, as steering would), then his switch thrown: the sniff, unstreamed.
    await page.ev(`(() => { const r = window.__pieTest.run; r.unkept = 0; window.__pieTest.jump(); })()`);
    await page.waitFor(`window.__pieTest.run.jumpT > 0 && window.__pieTest.run.jumpT < 0.42`, { timeoutMs: 3000 });
    await page.ev(`(() => { const r = window.__pieTest.run; const rose = r.things.find((x) => x.bloom && !x.cleared); Object.assign(rose, { x: r.x, home: r.x, lane: r.lane, y: r.y }); })()`);
    await page.waitFor(`window.__pieTest.run.things.some((x) => x.bloom && x.cleared)`, { timeoutMs: 3000 });
    await page.ev(`(() => { const r = window.__pieTest.run; r.things.push({ kind: 'switch', x: r.x, home: r.x, lane: r.lane, y: r.y - 6, w: 26, h: 26, fatal: false, born: r.t }); })()`);
    await page.waitFor(`JSON.parse(localStorage.getItem('lore.pie.finds.v1') || '{}').sniff`, { timeoutMs: 5000 });
    await page.waitFor(`JSON.parse(localStorage.getItem('lore.almanac.v1') || '{}')['pressed-rose']`, { timeoutMs: 6000 });
    const deeds = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.deeds.v1') || '{}')`);
    if (deeds[11]?.find_sniff !== 1) throw new Error(`the sniff was not kept on Chapter Eleven: ${JSON.stringify(deeds)}`);
  }],
  ['carried by a dolphin, the pie still takes its donuts and roses, and still passes what would knock it', async (page) => {
    // Unkept used to pass everything, so a Ring Tide dolphin carried the pie straight past the tide's own donuts.
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=1&live');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    await page.ev(`setInterval(() => { const r = window.__pieTest.run; if (r) { r.wobble = 0; r.unkept = 5; } }, 50)`);
    await page.ev(`(() => { const r = window.__pieTest.run; r.things = r.things.filter((x) => x.y < 0 && !x.fatal); const at = { x: r.x, home: r.x, lane: r.lane, born: r.t }; r.things.push({ ...at, kind: 'donut', y: r.y - 6, w: 24, h: 22, fatal: false }, { ...at, kind: 'boonrose', y: r.y - 40, w: 26, h: 24, fatal: false }, { ...at, kind: 'stone', y: r.y - 80, w: 30, h: 24, fatal: true }); })()`);
    await page.waitFor(`window.__pieTest.run.donuts >= 1 && (window.__pieTest.run.deeds || []).some((d) => d.kind === 'boonrose')`, { timeoutMs: 6000 });
    await page.waitFor(`window.__pieTest.run.things.some((x) => x.kind === 'stone' && x.passed) || !window.__pieTest.run.things.some((x) => x.kind === 'stone')`, { timeoutMs: 6000 });
    const after = await page.ev(`({ state: window.__pieTest.state, knocked: window.__pieTest.run.things.some((x) => x.kind === 'stone' && x.knocked), why: window.__pieTest.run.leanWhy || {} })`);
    if (after.state !== 'running' || after.knocked || after.why.knocked) throw new Error(`unkept, a stone still knocked the pie: ${JSON.stringify(after)}`);
  }],
  ['a ring is drawn: the widening circle round a catch, a gift or a find shows on the canvas', async (page) => {
    // No ring was ever drawn (its radius was read from fields no ring has), and nothing noticed, since a ring changes no state.
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=1');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    const green = `(() => { const c = document.querySelector('.pie-screen canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 1] > d[i] + 45 && d[i + 1] > d[i + 2] + 45) n += 1; return n; })()`;
    const before = await page.ev(green);
    await page.ev(`window.__pieTest.ring(180, 260, 60, '#00ff00', 2)`);
    await new Promise((r) => setTimeout(r, 300));
    const after = await page.ev(green);
    if (!(after > before + 40)) throw new Error(`a ring was spawned and not drawn: ${before} green pixels before, ${after} after`);
  }],
  ['sounds are chosen by ear and written on the board line: a feel, a WAP, a step and a warning', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.pie.v1': { ...PLAYER, sound: true } });
    await page.goto('/pie/');
    await page.waitFor(`document.querySelector('[data-pie-setup-toggle]')`);
    await page.ev(`document.querySelector('[data-pie-setup-toggle]').click()`);
    await page.waitFor(`document.querySelector('[data-pie-setup] [data-tab=music]')`);
    await page.ev(`document.querySelector('[data-pie-setup] [data-tab=music]').click()`);
    const chosen = [['feel', 'jazz'], ['wap', 'cream'], ['steps', 'tiptoe'], ['cues', 'shaped']];
    for (const [key, value] of chosen) {
      await page.waitFor(`document.querySelector('.pie-setup-opt[data-key=${key}][data-value=${value}]')`, { timeoutMs: 3000 });
      await page.ev(`document.querySelector('.pie-setup-opt[data-key=${key}][data-value=${value}]').click()`);
    }
    const kept = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.v1') || '{}').view || {}`);
    if (chosen.some(([key, value]) => kept[key] !== value)) throw new Error(`the sounds chosen were not kept: ${JSON.stringify(kept)}`);
    await page.ev(`document.querySelector('[data-pie-setup] [data-tab=layouts]')?.click()`);
    await page.waitFor(`document.querySelector('.pie-setup-board-line')`, { timeoutMs: 3000 });
    const line = await page.ev(`document.querySelector('.pie-setup-board-line').textContent`);
    if (!chosen.every(([key, value]) => line.includes(`=${key}[${value}]`))) throw new Error(`the board line does not say the sounds chosen: ${line}`);
    // Said by ear in the names of its parts (the workbench's spokenLine), once the parser has loaded.
    await page.waitFor(`/^The board line: /.test(document.querySelector('.pie-setup-board-line')?.getAttribute('aria-label') || '')`, { timeoutMs: 8000 });
  }],
  ['Setup can be walked end to end on a phone by its steps, a swipe goes back, and it opens where it was left', async (page) => {
    await page.setViewport(390, 844, { mobile: true });
    await seed(page, { 'lore.pie.v1': PLAYER });
    await page.goto('/pie/');
    await page.waitFor(`document.querySelector('[data-pie-setup-toggle]')`);
    await page.ev(`document.querySelector('[data-pie-setup-toggle]').click()`);
    await page.waitFor(`document.querySelector('.pie-setup-steps')`);
    const walked = await page.ev(`(async () => { const seen = []; for (let i = 0; i < 12; i += 1) { const tab = document.querySelector('[data-pie-setup] [aria-selected=true]')?.dataset.tab; seen.push(tab); const next = document.querySelector('.pie-setup-step.is-on'); if (!next) break; next.click(); await new Promise((r) => setTimeout(r, 60)); } return seen; })()`);
    if (walked.length < 6 || walked[walked.length - 1] !== 'guide' || new Set(walked).size !== walked.length) throw new Error(`the steps did not walk Setup once through: ${walked.join(' > ')}`);
    const kept = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.v1')).view.setupTab`);
    if (kept !== 'guide') throw new Error(`Setup did not keep where it was left (${kept})`);
    await page.ev(`document.querySelector('.pie-setup-close').click()`);
    await page.ev(`document.querySelector('[data-pie-setup-toggle]').click()`);
    await page.waitFor(`document.querySelector('[data-pie-setup] [aria-selected=true]')`);
    const reopened = await page.ev(`document.querySelector('[data-pie-setup] [aria-selected=true]').dataset.tab`);
    if (reopened !== 'guide') throw new Error(`Setup reopened at ${reopened}, not where it was left`);
  }],
  ['a chain acts out its edge: a march called, glass ahead', async (page) => {
    await page.setViewport(1200, 900);
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: { shelves: 'on' }, tried: [], resolved: { shelves: 'on' } }, 'lore.pie.v1': PLAYER });
    await page.goto('/pie/?chapter=6');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running'`);
    const seen = await page.ev(`(() => { const t = window.__pieTest; const r = t.run; r.bane = null; r.boon = null;
      t.actOutChain({ shelf: 'bane', line: '=bane@scheme{ @march }', invokes: 'march', says: 'the scheme calls a march', complete: false });
      const called = r.marchNext === true; t.scheme(); const scheme = r.bane?.id;
      const panes = r.things.filter((x) => x.kind === 'pane').length;
      t.actOutChain({ shelf: 'bonk', line: '=bane@pane{ @mimewall }', invokes: 'mimewall', says: 'glass broken, then imaginary glass', complete: false });
      return { called, scheme, more: r.things.filter((x) => x.kind === 'pane').length - panes, edge: r.tags.some((x) => x.text === '=bane@scheme{ @march }') }; })()`);
    if (!seen.called || seen.scheme !== 'march') throw new Error(`the bane chain did not make the next scheme a march (${JSON.stringify(seen)})`);
    if (seen.more < 1) throw new Error('the bonk chain put no glass ahead');
    if (!seen.edge) throw new Error('the edge was not shown as it acted');
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
  }],
  ['kept lines (a trial): the shelf is one sealed line with holes, a card is a question until kept, a given line is compared and never kept, and the bench knows the book’s bracework', async (page) => {
    const kept = { 'torch-ants': { first: '2026-11-01', places: [1] }, 'salt-whales': { first: '2026-11-02', places: [3] } };
    const on = { cohort: 'returning', choices: { 'kept-lines': 'on' }, tried: [], resolved: { 'kept-lines': 'on' } };
    // Off, the almanac is as it was: no shelf line, no line on any card.
    await seed(page, { 'lore.almanac.v1': kept });
    await page.goto('/almanac/');
    await page.waitFor(`document.querySelector('#wonder-torch-ants')`, { timeoutMs: 8000 });
    const off = await page.ev(`document.querySelectorAll('#shelf-line, .kept-line').length`);
    if (off) throw new Error(`with the switch off the almanac shows ${off} lines`);
    // On: the shelf as one line, holes in place, sealed as the workbench reads it, said by ear by the real parser.
    await seed(page, { 'lore.almanac.v1': kept, 'lore.switches.v1': on });
    await page.goto('/almanac/');
    await page.waitFor(`document.querySelector('#shelf-line .spell-line')?.dataset.said === 'spw-seed'`, { timeoutMs: 10000 });
    const shelf = await page.ev(`(async () => { const line = document.querySelector('#shelf-line .kept-line').dataset.keptLine; const m = await import('/book/scripts/vendor/spw-seed.mjs'); return { line, sealed: (m.scanPairLabels(line).pairs || []).some((p) => p.label === 'shelf' && p.close?.spelling === 'mirrored'), holes: document.querySelectorAll('#shelf-line .spell-other.kept-hole').length }; })()`);
    if (!/^\*shelf\{_shelf @creatures\[torch_ants \?\d+ salt_whales \?\d+\]/.test(shelf.line)) throw new Error(`the shelf line does not keep its order and holes: ${shelf.line}`);
    if (!shelf.sealed || !shelf.holes) throw new Error(`the shelf line is not sealed with holes: ${JSON.stringify(shelf)}`);
    // A card still to find asks; a kept one answers in its kind's sigil.
    const cards = await page.ev(`({ asks: document.querySelector('#wonder-echo-wrens .kept-line')?.dataset.keptLine, answers: document.querySelector('#wonder-torch-ants .kept-line')?.dataset.keptLine, seal: document.querySelector('#wonder-echo-wrens .likeness-mark')?.getAttribute('aria-label') || '' })`);
    if (!/^\?creature\{/.test(cards.asks || '') || /echo|wren/.test(cards.asks) || /wren/i.test(cards.seal)) throw new Error(`an unfound card says more than its hint: ${JSON.stringify(cards)}`);
    if (!/^@torch_ants\{ .*&ants/.test(cards.answers || '')) throw new Error(`a kept card does not answer: ${cards.answers}`);
    // The bench knows {frost & hearth} is the book's, opens the door to it, and keeps nothing for it.
    await page.ev(`(() => { const f = document.querySelector('[data-bench]'); f.elements.a.value = 'hearth'; f.elements.b.value = 'frost'; f.querySelector('input[name=container][value="{}"]').checked = true; f.querySelector('input[name=sigil][value="&"]').checked = true; f.dispatchEvent(new Event('change')); })()`);
    const bench = await page.ev(`({ canon: document.querySelector('[data-bench-canon]')?.dataset.benchCanon, door: document.querySelector('[data-bench-canon] a')?.getAttribute('href') || '', kept: Object.keys(JSON.parse(localStorage.getItem('lore.almanac.v1') || '{}')) })`);
    if (bench.canon !== 'hearth-drift' || !/^\/book\/chapter\/\d\d\/#/.test(bench.door)) throw new Error(`the bench did not know Hearth-drift: ${JSON.stringify(bench)}`);
    if (bench.kept.includes('hearth-drift')) throw new Error('the bench kept a wonder the reader has not found');
    // Someone's line, carried in an address: read for the visit, compared, gone from the address, and never kept.
    const theirs = `*${SHELF_LABEL}{_${SHELF_LABEL} @creatures[torch_ants ?1 lag_stag ?21] .antiques[?12] *artifacts[?11] $contrivances[?15] &bracework[?6] #sayings[first_ink_stays ?14] .day["2026-11-10"] ${mirrored(SHELF_LABEL)}_}`;
    // First as a stranger gets it: the switch off and nothing kept. It is read, and nothing is written.
    await seed(page, {});
    await page.goto(`/almanac/?shelf=${encodeURIComponent(theirs)}`);
    await page.waitFor(`document.querySelector('[data-shelf-read]')?.dataset.shelfRead === 'sealed'`, { timeoutMs: 10000 });
    const stranger = await page.ev(`({ both: document.querySelector('[data-shelf-read]').dataset.shelfBoth, search: location.search, almanac: localStorage.getItem('lore.almanac.v1'), switches: localStorage.getItem('lore.switches.v1') || '' })`);
    if (stranger.both !== '0' || stranger.almanac !== null || /kept-lines/.test(stranger.switches) || /shelf=/.test(stranger.search)) throw new Error(`a stranger's visit changed something: ${JSON.stringify(stranger)}`);
    // Then beside a shelf of one's own.
    await seed(page, { 'lore.almanac.v1': kept, 'lore.switches.v1': on });
    await page.goto(`/almanac/?shelf=${encodeURIComponent(theirs)}`);
    await page.waitFor(`document.querySelector('[data-shelf-read]')?.dataset.shelfRead === 'sealed'`, { timeoutMs: 10000 });
    const read = await page.ev(`({ ...document.querySelector('[data-shelf-read]').dataset, text: document.querySelector('[data-shelf-read]').textContent, search: location.search, kept: Object.keys(JSON.parse(localStorage.getItem('lore.almanac.v1') || '{}')).sort() })`);
    if (read.shelfReader !== 'spw-seed' || read.shelfBoth !== '1' || read.shelfOnlyTheirs !== '2') throw new Error(`the given line was misread: ${JSON.stringify(read)}`);
    if (/shelf=/.test(read.search)) throw new Error(`the line stayed in the address: ${read.search}`);
    if (read.kept.join() !== 'salt-whales,torch-ants') throw new Error(`a given line wrote to the reader's shelf: ${read.kept}`);
    if (/Lag-stag|First ink stays/.test(read.text)) throw new Error('a given line named what this reader has not found');
    // Cut short in passing, it says so.
    await page.ev(`(() => { const t = document.querySelector('[data-shelf-given]'); t.value = ${JSON.stringify(theirs.slice(0, -9))}; t.dispatchEvent(new Event('input')); })()`);
    await page.waitFor(`document.querySelector('[data-shelf-read]')?.dataset.shelfRead === 'cracked'`, { timeoutMs: 6000 });
  }],
  ['kept lines (a trial): a chapter’s wonder card answers its question and says what is still to find here', async (page) => {
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: { 'kept-lines': 'on' }, tried: [], resolved: { 'kept-lines': 'on', wonders: 'on' } } });
    await page.setViewport(1200, 900);
    await page.goto('/book/chapter/01/');
    await page.waitFor(`document.querySelector('.wonder-mark[data-wonder="torch-ants"][role=button]')`, { timeoutMs: 10000 });
    await page.ev(`(() => { const m = document.querySelector('.wonder-mark[data-wonder="torch-ants"]'); m.scrollIntoView({ block: 'center' }); m.click(); })()`);
    await page.waitFor(`document.querySelector('.wonder-card .wonder-card-spw .spell-line')?.dataset.said === 'spw-seed'`, { timeoutMs: 10000 });
    const lines = await page.ev(`({ was: document.querySelector('.wonder-card-was')?.textContent || '', lines: [...document.querySelectorAll('.wonder-card .kept-line')].map((s) => s.dataset.keptLine) })`);
    if (!/^\?creature/.test(lines.was) || !/^@torch_ants\{/.test(lines.lines[0] || '') || !/^\*chapter\[1\]\{ @torch_ants \?\d+ \}$/.test(lines.lines[1] || '')) throw new Error(`the card's lines: ${JSON.stringify(lines)}`);
  }],
  ['a season: before its days nothing is set, and with the switch off nothing is set in them', async (page) => {
    await seed(page, { 'lore.switches.v1': SEASON_ON, 'lore.pie.v1': PLAYER });
    await carryOn(page, `${SEASON.opens.slice(0, 8)}20T12:00:00`);
    const early = await page.ev(`window.__pieTest.run.season`);
    if (early) throw new Error(`a season was set before its days: ${JSON.stringify(early)}`);
    await seed(page, { 'lore.pie.v1': PLAYER });
    await carryOn(page, `${SEASON_DAY}T12:00:00`);
    const off = await page.ev(`window.__pieTest.run.season`);
    if (off) throw new Error('a season was set with its switch off');
  }],
  ['a season: in its days a place is met, the pie settles, and one sealed line is kept', async (page) => {
    await seed(page, { 'lore.switches.v1': SEASON_ON, 'lore.pie.v1': PLAYER });
    await carryOn(page, `${SEASON_DAY}T12:00:00`);
    const mode = await page.ev(`window.__pieTest.run.season?.mode`);
    if (mode !== 'open') throw new Error(`the season is not open on ${SEASON_DAY}: ${mode}`);
    await page.ev(PLACE_AHEAD);
    await page.waitFor(`window.__pieTest.run.tags.some((t) => /A PLACE, SET EARLY/.test(t.text))`, { timeoutMs: 8000 });
    const got = await page.ev(`(() => { const r = window.__pieTest.run; const kept = JSON.parse(localStorage.getItem('lore.pie.seasons.v1') || '{}'); const box = document.querySelector('.pie-kept-line'); return { state: window.__pieTest.state, warm: r.warm, ready: r.sliceReady, kept, sealed: Boolean(box?.querySelector('.spell-pair-mirror.is-sealed') && box.querySelector('.spell-pair-label.is-sealed')) }; })()`);
    if (got.state !== 'running') throw new Error(`a place ended the carry (${got.state})`);
    if (!(got.warm > 4) || got.ready !== 1) throw new Error(`the place did not settle the pie and ready a slice: ${JSON.stringify(got)}`);
    const mark = got.kept[SEASON.id];
    if (mark?.was !== SEASON_DAY || mark.takes !== 1 || !mark.line?.endsWith(`${[...SEASON.id].reverse().join('')}_}`)) throw new Error(`the day and a sealed line were not kept: ${JSON.stringify(got.kept)}`);
    if (!got.sealed) throw new Error('the kept line is not shown sealed among the carries');
    // Met again the same carry: the day stays, and no second line is written.
    await page.ev(`(() => { const r = window.__pieTest.run; r.tags = []; })()`);
    await page.ev(PLACE_AHEAD);
    await page.waitFor(`window.__pieTest.run.tags.some((t) => /A PLACE, SET EARLY/.test(t.text))`, { timeoutMs: 8000 });
    const again = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.seasons.v1'))`);
    if (again[SEASON.id].takes !== 2 || again[SEASON.id].line !== mark.line || again[SEASON.id].was !== SEASON_DAY) throw new Error(`a second meeting changed the day or the line: ${JSON.stringify(again)}`);
  }],
  ['a season: after its days the place stays set for whoever was there and kept the line', async (page) => {
    await seed(page, { 'lore.switches.v1': SEASON_ON, 'lore.pie.v1': PLAYER, 'lore.pie.seasons.v1': { [SEASON.id]: { was: SEASON_DAY, takes: 1, line: SEASON_LINE } } });
    await carryOn(page, AFTER_SEASON);
    const mode = await page.ev(`window.__pieTest.run.season?.mode`);
    if (mode !== 'kept') throw new Error(`the place is not kept for someone who was there with the line: ${mode}`);
    await page.ev(PLACE_AHEAD);
    await page.waitFor(`window.__pieTest.run.tags.some((t) => /STILL SET/.test(t.text))`, { timeoutMs: 8000 });
    const got = await page.ev(`(() => { const r = window.__pieTest.run; return { warm: r.warm, ready: r.sliceReady, kept: JSON.parse(localStorage.getItem('lore.pie.seasons.v1')) }; })()`);
    if (!(got.warm > 0 && got.warm <= 4)) throw new Error(`what is left is not less than the season: warm ${got.warm}`);
    if (got.kept[SEASON.id].takes !== 1) throw new Error('a meeting after the season was counted as being there');
  }],
  ['a season: a line without the day is shown, never kept, and sets nothing', async (page) => {
    await seed(page, { 'lore.switches.v1': SEASON_ON, 'lore.pie.v1': PLAYER, 'lore.pie.seasons.v1': { [SEASON.id]: { line: SEASON_LINE } } });
    await carryOn(page, AFTER_SEASON);
    const held = await page.ev(`window.__pieTest.run.season`);
    if (held) throw new Error('a line alone set the place');
    await seed(page, { 'lore.switches.v1': SEASON_ON, 'lore.pie.v1': PLAYER });
    await carryOn(page, AFTER_SEASON);
    await page.ev(`window.__pieTest.paste(${JSON.stringify(`${SEASON_LINE}\n#from["lore.land/pie#kept:${SEASON.id}"]`)})`);
    await page.waitFor(`/answers to whoever was there/.test(document.querySelector('[data-pie-paste-note]').textContent)`, { timeoutMs: 8000 });
    const got = await page.ev(`({ kept: localStorage.getItem('lore.pie.seasons.v1'), shown: Boolean(document.querySelector('.pie-kept-line[data-pie-kept-stands="tease"] .spell-pair-mirror.is-sealed')), season: window.__pieTest.run.season })`);
    if (got.kept && got.kept !== '{}') throw new Error(`a pasted line was kept by someone who was not there: ${got.kept}`);
    if (!got.shown) throw new Error('the pasted line was not shown, sealed, as pasted and not kept');
    if (got.season) throw new Error('a pasted line set the place');
    // Cut short on the way, it does not close, and is refused even from someone who was there.
    await page.ev(`localStorage.setItem('lore.pie.seasons.v1', ${JSON.stringify(JSON.stringify({ [SEASON.id]: { was: SEASON_DAY, takes: 1 } }))})`);
    await page.ev(`window.__pieTest.paste(${JSON.stringify(SEASON_LINE.slice(0, -6))})`);
    await page.waitFor(`/does not close/.test(document.querySelector('[data-pie-paste-note]').textContent)`, { timeoutMs: 8000 });
    const cut = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.seasons.v1'))`);
    if (cut[SEASON.id].line) throw new Error('a line cut short was kept');
    // Whole, and handed to someone who was there, it is kept.
    await page.ev(`window.__pieTest.paste(${JSON.stringify(SEASON_LINE)})`);
    await page.waitFor(`/you were there/.test(document.querySelector('[data-pie-paste-note]').textContent)`, { timeoutMs: 8000 });
    const whole = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.seasons.v1'))`);
    if (whole[SEASON.id].line !== SEASON_LINE) throw new Error('a whole line handed to someone who was there was not kept');
  }],
  ['the lanes react: a knock is answered in the carrier\u2019s way, a power that runs out is noticed, and with the switch off neither is', async (page) => {
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: { reactions: 'on' }, tried: [], resolved: { reactions: 'on' } }, 'lore.pie.v1': { ...PLAYER, view: { story: false, zen: false, focusOnPlay: false } } });
    await carryOn(page, '2026-06-01T12:00:00');
    await page.ev(`(() => { const r = window.__pieTest.run; r.things = r.things.filter((t) => t.y < 0); r.hurtT = 0; window.__pieTest.knock({ kind: 'post', x: r.x - 10, y: r.y }); })()`);
    const knocked = await page.ev(`({ reacted: window.__pieTest.run.reacted, face: document.querySelector('[data-pie-meanwhile]')?.hidden === false, state: window.__pieTest.state })`);
    if (knocked.reacted?.['knock:post'] !== 1) throw new Error(`a knock was not answered: ${JSON.stringify(knocked)}`);
    if (!knocked.face) throw new Error('nobody\u2019s face came up beside the lanes');
    // A kept light about to run out: when it does, somebody notices.
    await page.ev(`(() => { const r = window.__pieTest.run; r.things = r.things.filter((t) => t.y < 0); r.wobble = 0; r.lit = 0.3; })()`);
    await page.waitFor(`window.__pieTest.run.reacted['end:lit'] === 1`, { timeoutMs: 8000 });
    // (What the narrator says goes through the pacer, which may hold or fold it in a busy first minute: pacing:check
    // holds that nothing offered is lost.)
    // Off, a knock gets the old word and nothing is counted.
    await seed(page, { 'lore.pie.v1': PLAYER });
    await carryOn(page, '2026-06-01T12:00:00');
    await page.ev(`(() => { const r = window.__pieTest.run; r.hurtT = 0; window.__pieTest.knock({ kind: 'post', x: r.x - 10, y: r.y }); r.lit = 0.2; })()`);
    await page.waitFor(`window.__pieTest.run.lit === 0`, { timeoutMs: 6000 });
    const off = await page.ev(`window.__pieTest.run.reacted || null`);
    if (off) throw new Error(`with the switch off something was answered: ${JSON.stringify(off)}`);
  }],
  ['places: with sound on, the gate, a door and a pause run their air with nothing thrown', async (page) => {
    await seed(page, { 'lore.switches.v1': { cohort: 'returning', choices: { places: 'on' }, tried: [], resolved: { places: 'on' } }, 'lore.pie.v1': { ...PLAYER, sound: true } });
    await page.setViewport(1200, 900);
    await page.goto('/pie/?chapter=15');
    await page.waitFor(`window.__pieTest && document.querySelector('[data-pie-card-action]')`);
    await page.ev(`document.querySelector('[data-pie-card-action]').click()`);
    await page.waitFor(`window.__pieTest.state === 'running' && window.__pieTest.run`);
    const t = await page.ev('window.__pieTest.run.t');
    await page.waitFor(`window.__pieTest.run.t > ${t} + 1`);
    const scene = await page.ev(`window.__pieTest.run.sceneId`);
    if (scene !== 'gate') throw new Error(`chapter 15 did not open at the gate: ${scene}`);
    // Through to a chapter drawn in another place, then a pause and back: each changes the air.
    await page.ev(`(() => { const r = window.__pieTest.run; window.__pieTest.closeLeg(); window.__pieTest.enterChapter(3, { closed: 'carried', note: '' }); })()`);
    await page.waitFor(`window.__pieTest.run.sceneId === 'lanes'`);
    await page.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    const t2 = await page.ev('window.__pieTest.run.t');
    await page.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await page.ev(`window.__pieTest.state === 'paused' && document.querySelector('[data-pie-card-action]')?.click()`);
    await page.waitFor(`window.__pieTest.state === 'running' && window.__pieTest.run.t > ${t2} + 0.5`, { timeoutMs: 8000 });
  }],
  ['a season: a line carried in an address is shown to a stranger, leaves the address, and is not kept', async (page) => {
    // A stranger: no switch on, no day. The line still shows what it is.
    await seed(page, { 'lore.pie.v1': PLAYER });
    await page.setViewport(1200, 900);
    await page.goto(`/pie/?kept=${encodeURIComponent(SEASON_LINE)}`);
    await page.waitFor(`/answers to whoever was there/.test(document.querySelector('[data-pie-paste-note]')?.textContent || '')`, { timeoutMs: 8000 });
    const got = await page.ev(`({ search: location.search, kept: localStorage.getItem('lore.pie.seasons.v1'), shown: Boolean(document.querySelector('.pie-kept-line[data-pie-kept-stands="tease"] .spell-pair-mirror.is-sealed')) })`);
    if (/kept=/.test(got.search)) throw new Error(`the line stayed in the address: ${got.search}`);
    if (got.kept) throw new Error(`an address wrote to the reader's seasons: ${got.kept}`);
    if (!got.shown) throw new Error('the carried line was not shown sealed');
    // Someone who was there, holding a line of their own: an address shows the other line and changes nothing.
    const mine = { [SEASON.id]: { was: SEASON_DAY, takes: 1, line: SEASON_LINE } };
    await seed(page, { 'lore.switches.v1': SEASON_ON, 'lore.pie.v1': PLAYER, 'lore.pie.seasons.v1': mine });
    const other = SEASON_LINE.replace('~warm[4]', '~warm[10] !level ~unkept[6]');
    await page.goto(`/pie/?kept=${encodeURIComponent(other)}`);
    await page.waitFor(`/carried in an address/.test(document.querySelector('[data-pie-paste-note]')?.textContent || '')`, { timeoutMs: 8000 });
    const kept = await page.ev(`JSON.parse(localStorage.getItem('lore.pie.seasons.v1'))`);
    if (kept[SEASON.id].line !== SEASON_LINE) throw new Error('an address replaced a line the reader held');
    // And a rewritten line, pasted and kept, still plays only what the season left.
    await carryOn(page, AFTER_SEASON);
    await page.ev(`window.__pieTest.paste(${JSON.stringify(other)})`);
    await page.waitFor(`/you were there/.test(document.querySelector('[data-pie-paste-note]')?.textContent || '')`, { timeoutMs: 8000 });
    await page.ev(`(() => { const r = window.__pieTest.run; r.wobble = 0.5; r.unkept = 0; r.season = { season: r.season?.season, mode: 'kept', set: true }; })()`);
    await page.ev(PLACE_AHEAD);
    await page.waitFor(`window.__pieTest.run.tags.some((t) => /STILL SET/.test(t.text))`, { timeoutMs: 8000 });
    const played = await page.ev(`({ warm: window.__pieTest.run.warm, unkept: window.__pieTest.run.unkept })`);
    if (!(played.warm > 0 && played.warm <= 4) || played.unkept > 0) throw new Error(`a rewritten line played more than the season left: ${JSON.stringify(played)}`);
  }],
  ['callbacks (a trial): three clerks and the porter writes his own name; the Genie prices the third of a thing once its margin is heard; off, nothing calls back; a spill meets exactly one', async (page) => {
    const ON = { cohort: 'returning', choices: { callbacks: 'on' }, tried: [], resolved: { callbacks: 'on' } };
    // With the tropes trial on too, so a stage that rises at the spill is said between the spill and the end card.
    const WITH_STAGES = { cohort: 'returning', choices: { callbacks: 'on', 'trope-reveal': 'on' }, tried: [], resolved: { callbacks: 'on', 'trope-reveal': 'on' } };
    // Three knocks a breath apart, the road ahead cleared and the pie steadied before each, so none of them spills it.
    const knockThrice = (/** @type {string} */ kind) => `(async () => { const r = window.__pieTest.run; for (let i = 0; i < 3; i += 1) { r.things = r.things.filter((t) => t.y < 0); r.hurtT = 0; r.wobble = 0; window.__pieTest.knock({ kind: '${kind}', x: r.x - 10, y: r.y }); await new Promise((ok) => setTimeout(ok, 700)); } return { state: window.__pieTest.state, callbacks: r.callbacks || null, t: r.t }; })()`;
    // On, carried by the porter: a slip with a word at the top, what porters write, and what he wrote, in the book's words.
    await seed(page, { 'lore.switches.v1': WITH_STAGES, 'lore.pie.v1': PLAYER });
    await carryOn(page, '2026-06-01T12:00:00');
    const t0 = await page.ev('window.__pieTest.run.t');
    await page.ev(`window.__pieTest.carrier('porter')`);
    const porter = await page.ev(knockThrice('clerk'));
    if (porter.state !== 'running') throw new Error(`three knocks spilled the pie: ${JSON.stringify(porter)}`);
    if (!(porter.t > t0)) throw new Error('the game clock did not advance');
    if (!porter.callbacks?.landed?.includes('damage')) throw new Error(`the porter's callback did not land: ${JSON.stringify(porter.callbacks)}`);
    if (porter.callbacks.said.length !== 3 || porter.callbacks.said[2] !== 'He wrote his own name.') throw new Error(`it landed other words: ${JSON.stringify(porter.callbacks.said)}`);
    const kept = await page.ev(`({ deeds: JSON.parse(localStorage.getItem('lore.pie.deeds.v1') || '{}'), tropes: JSON.parse(localStorage.getItem('lore.tropes.v1') || '{}') })`);
    if (!Object.values(kept.deeds).some((d) => d?.joke_damage === 1)) throw new Error(`the landing was not kept as a deed: ${JSON.stringify(kept.deeds)}`);
    if (!(kept.tropes.records?.crossed?.lanes > 0)) throw new Error(`landing did not meet records in the lanes: ${JSON.stringify(kept.tropes)}`);
    // A spill meets exactly one in the lanes (tropes.json faces.lanes.moments), and the end card still comes.
    await page.ev(`(() => { const r = window.__pieTest.run; r.wobble = 1.5; r.rattled = 0.6; })()`);
    await page.waitFor(`window.__pieTest.state === 'over'`, { timeoutMs: 8000 });
    const spilled = await page.ev(`JSON.parse(localStorage.getItem('lore.tropes.v1') || '{}')['exactly-one'] || null`);
    if (!(spilled?.crossed?.lanes > 0)) throw new Error(`a spill did not meet exactly one: ${JSON.stringify(spilled)}`);
    // The Genie, with Five's margin heard: the third pane lands his own row for glass, once, and not before.
    await seed(page, { 'lore.switches.v1': ON, 'lore.pie.v1': PLAYER, 'lore.rumours.heard.v1': { 'rumour-haggle': '2026-11-13' } });
    await carryOn(page, '2026-06-01T12:00:00');
    await page.ev(`window.__pieTest.carrier('genie')`);
    const genie = await page.ev(knockThrice('pane'));
    if (!genie.callbacks?.landed?.includes('priced') || genie.callbacks.said.length !== 1) throw new Error(`the Genie's callback did not land once, on the third: ${JSON.stringify(genie.callbacks)}`);
    if (genie.callbacks.said[0] !== 'The Genie looks at the glass as if it were a bill.') throw new Error(`the third pane landed other words: ${JSON.stringify(genie.callbacks.said)}`);
    // The margin not heard: nothing is priced.
    await seed(page, { 'lore.switches.v1': ON, 'lore.pie.v1': PLAYER });
    await carryOn(page, '2026-06-01T12:00:00');
    await page.ev(`window.__pieTest.carrier('genie')`);
    const unheard = await page.ev(knockThrice('post'));
    if (unheard.callbacks?.landed?.length) throw new Error(`a callback landed for a reader who never heard its margin: ${JSON.stringify(unheard.callbacks)}`);
    // Off: nothing calls back.
    await seed(page, { 'lore.pie.v1': PLAYER });
    await carryOn(page, '2026-06-01T12:00:00');
    await page.ev(`window.__pieTest.carrier('porter')`);
    const off = await page.ev(knockThrice('clerk'));
    if (off.callbacks) throw new Error(`with the switch off something called back: ${JSON.stringify(off.callbacks)}`);
  }]
];

// SMOKE_ONLY=pattern runs only the scenarios whose names match it (case aside), for walking one change quickly.
const CHOSEN = process.env.SMOKE_ONLY ? SCENARIOS.filter(([name]) => new RegExp(String(process.env.SMOKE_ONLY), 'i').test(name)) : SCENARIOS;
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
  for (const [name, run] of CHOSEN) {
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
console.log(`smoke[${failures ? 'fail' : 'ok'}]{${CHOSEN.length - failures} of ${CHOSEN.length}${CHOSEN.length < SCENARIOS.length ? `, chosen by SMOKE_ONLY from ${SCENARIOS.length}` : ''}}`);
process.exit(failures ? 1 : 0);
