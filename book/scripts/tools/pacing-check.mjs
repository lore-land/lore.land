#!/usr/bin/env node
// @ts-check
/**
 * pacing-check.mjs — the pie game's story beats, paced (npm run pacing:check).
 *
 * Drives pie-pacing.mjs with a burst like the lanes make (a room, a meeting, a scheme, gossip, a chain, all in one
 * breath) and holds it to its promises: no two released closer than the gap, a gentler first minute, a quiet stretch
 * after a loud beat, a chapter's opening kept for its own words, urgent beats at once, nothing dropped (every beat
 * offered is released, merged, or folded and handed back), and the same title offered twice is one beat.
 * Then the captions: every paragraph of the chapters as they stand, cut into lines short enough to read between
 * dodges, with every word kept and in order.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPacer, PACING, foldedWords, CAPTION, captionsOf, captionSeconds, skipAhead } from '../home/pie-pacing.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

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

/* ─── Captions: the chapters' own prose, a line at a time ─── */
let captions = 0;
let longest = 0;
let waited = 0;
{
  const dir = resolve(ROOT, 'book/content/chapters');
  for (const file of readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).sort()) {
    const chapter = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
    for (const section of chapter.sections || []) for (const block of section.content || []) {
      if (block.type !== 'paragraph' || typeof block.text !== 'string') continue;
      const text = block.text.replace(/\{\{[^}]*\}\}/g, 'a thing').replace(/\s+/g, ' ').trim();
      const lines = captionsOf(text);
      // Nothing lost, nothing reordered.
      if (lines.map((l) => l.text).join(' ') !== text) { fail(`${file}: a paragraph's captions do not say its words back`); continue; }
      if (lines.length && !lines[0].opens) fail(`${file}: a paragraph's first caption does not open a sentence`);
      for (const line of lines) {
        captions += 1;
        longest = Math.max(longest, line.text.length);
        // A line over the limit is one with nowhere to turn; it is still read at its own pace, up to the most.
        if (captionSeconds(line.text) < CAPTION.least || captionSeconds(line.text) > CAPTION.most) fail(`${file}: a caption is given no sensible time`);
        if (line.text.length <= CAPTION.chars && line.text.split(/\s+/).length * CAPTION.secondsAWord > CAPTION.most) waited += 1;
      }
    }
  }
  if (!captions) fail('no caption was read from the chapters');
  if (waited) fail(`${waited} captions within the limit still need longer than they are given`);
  const over = captionsOf('A sentence with no comma anywhere in it that simply goes on and on past any reasonable limit for a line and has to be turned at a joining word somewhere near its middle.');
  if (over.length < 2 || over.some((l) => l.text.length > CAPTION.chars)) fail('a long clause with no comma was not turned at a joining word');
  // A name with a stop inside it is one word, and a title keeps its name: the lanes used to say Boon. and then land.
  const named = captionsOf('In Boon.land the vizier is baked goods. Mr. BaneWAP supplied his own name.').map((l) => l.text);
  if (named.length !== 2 || !named[0].includes('Boon.land') || !named[1].startsWith('Mr. BaneWAP')) fail(`a name was broken at its stop: ${JSON.stringify(named)}`);
  // Falling behind skips to where the newest sentence opens, never into the middle of one.
  const queue = [{ opens: true }, { opens: false }, { opens: true }, { opens: false }, { opens: false }, { opens: true }, { opens: false }, { opens: false }];
  if (skipAhead(queue) !== 5 || skipAhead(queue.slice(0, 4)) !== 0) fail('captions that fell behind did not skip to the start of the newest sentence');
  // With a passage's opening waiting, the skim picks up there, ahead of a later sentence in the passage before it.
  const passages = [{ opens: true, leads: true }, { opens: false }, { opens: true }, { opens: true, leads: true }, { opens: false }, { opens: true }, { opens: false }];
  if (skipAhead(passages) !== 3) fail('captions that fell behind did not pick up where the newest passage opens');
  // Negative control: with no limit a paragraph comes back as its sentences, however long.
  if (captionsOf('One, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen.', 1000).length !== 1) fail('negative control: a sentence was cut with no limit to cut it for');
}

console.log(`[pacing] burst: ${burst.length} offered, ${run.shown.length} shown (${run.shown.map((s) => `${s.t}s ${s.kind}`).join(', ')}), ${run.foldedTitles.length} folded, ${run.stats.merged} merged; flood: ${flooded.shown.length} shown, ${flooded.foldedTitles.length} folded`);
if (fails.length) { console.error(`[pacing] ${fails.length} problem(s):`); fails.forEach((f) => console.error(`  ✕ ${f}`)); process.exit(1); }
console.log(`[pacing] captions: ${captions} lines from the chapters as they stand, the longest ${longest} characters, every word kept.`);
console.log('[pacing] ok. Times are simulated; the carry itself is measured in the browser (smoke).');
