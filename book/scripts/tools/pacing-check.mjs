#!/usr/bin/env node
// @ts-check
/**
 * pacing-check.mjs — the pie game's story beats, paced (npm run pacing:check).
 *
 * Drives pie-pacing.mjs with a burst like the lanes make (a room, a meeting, a scheme, gossip, a chain, all in one
 * breath) and holds it to its promises: no two released closer than the gap, a gentler first minute, a quiet stretch
 * after a loud beat, a chapter's opening kept for its own words, urgent beats at once, nothing dropped (every beat
 * offered is released, merged, or folded and handed back), and the same title offered twice is one beat.
 */
import { createPacer, PACING, foldedWords } from '../home/pie-pacing.mjs';

/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);

/** Run a pacer over a timeline of offers, ticking every 0.1 s. @param {Array<[number, import('../home/pie-pacing.mjs').Beat]>} offers @param {number} until */
function simulate(offers, until, { chapters = [0] } = {}) {
  const pacer = createPacer();
  pacer.startCarry(0);
  /** @type {Array<{ t: number, title: string, kind?: string, urgent?: boolean }>} */
  const shown = [];
  /** @type {string[]} */
  const foldedTitles = [];
  let i = 0;
  for (let t = 0; t <= until + 1e-9; t = Math.round((t + 0.1) * 10) / 10) {
    if (chapters.includes(t)) pacer.startChapter(t);
    while (i < offers.length && offers[i][0] <= t) {
      const b = pacer.offer(offers[i][1], t);
      if (b) shown.push({ t, title: b.title, kind: b.kind, urgent: b.urgent });
      i += 1;
    }
    const { due, folded } = pacer.tick(t);
    if (due) shown.push({ t, title: due.title, kind: due.kind, urgent: due.urgent });
    folded.forEach((f) => foldedTitles.push(f.title));
  }
  pacer.drain().forEach((b) => foldedTitles.push(b.title));
  return { shown, foldedTitles, stats: pacer.stats() };
}

// A burst: everything at once, a minute and a half in.
const burst = /** @type {Array<[number, import('../home/pie-pacing.mjs').Beat]>} */ ([
  [0, { title: 'Chapter Six', kind: 'chapter', weight: 2 }],
  [0.5, { title: 'Room 1 · ^[lantern_row]', kind: 'room' }],
  [1, { title: 'Mr. BoonWAP holds court', kind: 'meeting', weight: 2 }],
  [1.2, { title: 'Mr. BaneWAP has a scheme.', kind: 'scheme', weight: 2 }],
  [1.3, { title: 'The ants gossip', kind: 'gossip' }],
  [1.4, { title: 'BANE · MARCH', kind: 'chain' }],
  [1.5, { title: 'Room 1 · ^[lantern_row]', kind: 'room' }],
  [70, { title: 'Room 4 · =[glass_rule]', kind: 'room' }],
  [70.2, { title: 'A trope turns', kind: 'stage', weight: 2 }],
  [70.3, { title: 'Something here keeps time', kind: 'note' }],
  [70.4, { title: 'Spilled', kind: 'spill', urgent: true }]
]);
const run = simulate(burst, 120);
const offeredTitles = new Set(burst.map(([, b]) => b.title));
const accounted = new Set([...run.shown.map((s) => s.title), ...run.foldedTitles]);
offeredTitles.forEach((t) => { if (!accounted.has(t)) fail(`dropped silently: ${t}`); });
if (run.stats.merged < 1) fail('the same title offered twice was not one beat');
const paced = run.shown.filter((s) => !s.urgent);
for (let k = 1; k < paced.length; k += 1) {
  const gap = paced[k].t - paced[k - 1].t;
  const need = paced[k].t < 60 ? PACING.firstMinuteGap : PACING.gap;
  if (gap + 1e-9 < Math.min(need, PACING.gap)) fail(`two beats ${gap.toFixed(1)} s apart: ${paced[k - 1].title} / ${paced[k].title}`);
}
const afterLoud = paced.findIndex((s) => ['scheme', 'meeting', 'chain', 'stage'].includes(s.kind || ''));
if (afterLoud >= 0 && paced[afterLoud + 1] && paced[afterLoud + 1].t - paced[afterLoud].t + 1e-9 < PACING.quietAfterLoud) fail('no quiet stretch after a loud beat');
if (run.shown[0]?.kind !== 'chapter') fail('the chapter did not speak first');
if (run.shown.some((s) => s.t > 0 && s.t < PACING.opening && s.kind !== 'chapter' && !s.urgent)) fail('another beat spoke in the chapter’s opening');
const spill = run.shown.find((s) => s.urgent);
if (!spill || spill.t !== 70.4) fail('an urgent beat waited');
// Never more than the queue: a flood folds, and says so.
const flood = /** @type {Array<[number, import('../home/pie-pacing.mjs').Beat]>} */ (Array.from({ length: 20 }, (_, n) => [10 + n * 0.05, { title: `beat ${n}`, kind: 'note' }]));
const flooded = simulate(flood, 40, { chapters: [] });
if (flooded.shown.length + flooded.foldedTitles.length !== 20) fail(`a flood of 20 came out as ${flooded.shown.length} shown and ${flooded.foldedTitles.length} folded`);
if (!foldedWords(flooded.foldedTitles.map((title) => ({ title }))).startsWith('Also, on the way')) fail('folded beats are not said');
// Negative control: with no gap a burst piles up at once; with the house gap only one goes. The gap is what spaces them.
const pileOf = (/** @type {object} */ tuning) => { const p = createPacer(tuning); p.startCarry(0); return ['a', 'b', 'c'].map((title) => p.offer({ title }, 90)).filter(Boolean).length; };
const loosePile = pileOf({ gap: 0, firstMinuteGap: 0, quietAfterLoud: 0, opening: 0 });
const housePile = pileOf({});
if (loosePile !== 3 || housePile !== 1) fail(`negative control: three beats in one breath gave ${loosePile} with no gap and ${housePile} with the house gap (expected 3 and 1)`);

console.log(`[pacing] burst: ${burst.length} offered, ${run.shown.length} shown (${run.shown.map((s) => `${s.t}s ${s.kind}`).join(', ')}), ${run.foldedTitles.length} folded, ${run.stats.merged} merged; flood: ${flooded.shown.length} shown, ${flooded.foldedTitles.length} folded`);
if (fails.length) { console.error(`[pacing] ${fails.length} problem(s):`); fails.forEach((f) => console.error(`  ✕ ${f}`)); process.exit(1); }
console.log('[pacing] ok. Times are simulated; the carry itself is measured in the browser (smoke).');
