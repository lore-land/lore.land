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

/** @typedef {import('../../../tools/browser-harness/index.mjs').Page} Page */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/* Reaches the game's closure as the file is served. The repository carries no test hook. */
const HOOK_AT = '  const update = (rawDt) => {';
const HOOK = 'window.__pieTest = { get run() { return run; }, get state() { return state; }, get board() { return board; }, actOutChain: (f) => actOutChain(f), scheme: () => scheme(), enterChapter: (...a) => enterChapter(...a), closeLeg: () => closeLeg(), knock: (t) => knock(t), setClock: (iso) => { seasonClock = () => new Date(iso); }, paste: (t) => pasteSpell(t), carrier: (id) => { run.carrier = carrierById(id); }, jump: () => jump(), laneX: (l) => laneX(l) };\n';
const SWITCHES = { cohort: 'returning', choices: { 'way-through': 'on', reasons: 'on' }, tried: [], resolved: { 'way-through': 'on', reasons: 'on' } };
/* A new player's story cards stop the clock. */
const PLAYER = { best: 1, runs: 3, view: { story: false, zen: true, focusOnPlay: false }, sound: false, met: [], cards: [] };

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
    const after = await page.ev(`({ moments: (window.__pieTest.run.moments || []).map((m) => m.kind), wilted: window.__pieTest.run.things.filter((x) => x.kind === 'banerose' && !x.cleared).map((x) => x.wilted && !x.fatal) })`);
    if (!after.moments.includes('sniff') || !after.wilted.length || !after.wilted.every(Boolean)) throw new Error(`the sniff opened but its moment or its wilting did not: ${JSON.stringify(after)}`);
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
