#!/usr/bin/env node
// @ts-check
/**
 * sound-check.mjs — the scored hooks (pie-sound.mjs, the sound-design trial) held to what scored.spw promises, without a
 * speaker (npm run sound:check). Sound can be measured, not judged: this checks the plans, not how they sound.
 *   the bed's colour stays in range, an even vector is the bed as it was, and no shelf is a key or a mode
 *   stings plan in key for every shelf, a completed chain adds a cadence, and stings rate-limit and soften
 *   a trope motif grows with its stage for every trope, the same tune every time, a refrain only once named
 *   the figure is unvoiced, the mime is the rest, and the hooks are silent with no speaker and no switch
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sound from '../home/pie-sound.mjs';
import { cadenceOf } from '../modules/spw-cadence.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const fails = [];
const fail = (/** @type {string} */ why) => fails.push(why);
const notes = [];

// The bed's colour.
{
  const RANGES = { bright: [-9, -3], room: [0.3, 0.75], echo: [0.12, 0.38], wet: [0.06, 0.16], padTone: [0.7, 1.4], dry: [0, 0.6] };
  const even = sound.shelfColorParams({ boon: 1, bane: 1, bone: 1, bonk: 1, honk: 1 });
  const none = sound.shelfColorParams({});
  const base = { bright: -6, room: 0.5, echo: 0.22, wet: 0.1, padTone: 1, dry: 0 };
  Object.entries(base).forEach(([k, v]) => {
    if (Math.abs(/** @type {any} */ (even)[k] - v) > 1e-9) fail(`an even vector changes the bed's ${k}`);
    if (Math.abs(/** @type {any} */ (none)[k] - v) > 1e-9) fail(`an empty vector changes the bed's ${k}`);
  });
  let r = 7;
  const rand = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < 400; i += 1) {
    const v = { boon: rand() ** 2 * 3, bane: rand() ** 2 * 3, bone: rand() ** 2 * 3, bonk: rand() ** 2 * 3, honk: rand() ** 2 * 3 };
    const p = sound.shelfColorParams(v);
    Object.entries(RANGES).forEach(([k, [lo, hi]]) => { const x = /** @type {any} */ (p)[k]; if (!(x >= lo && x <= hi)) fail(`shelfColor ${k} ${x} is out of [${lo}, ${hi}] for ${JSON.stringify(v)}`); });
    if (p.mode !== 'unchanged' || Object.keys(p).some((k) => /minor|major|key|scale/.test(k))) fail('a shelf selected a key or a mode');
  }
  const lean = (/** @type {string} */ shelf) => sound.shelfColorParams({ [shelf]: 1 });
  if (!(lean('boon').bright > even.bright && lean('boon').room > even.room)) fail('a boon lean is not brighter and roomier');
  if (!(lean('bone').bright < even.bright && lean('bone').padTone < even.padTone)) fail('a bone lean is not darker');
  if (!(lean('bonk').dry > 0 && lean('bonk').room < even.room)) fail('a bonk lean is not drier');
  if (!(lean('honk').echo > even.echo && lean('honk').wet > even.wet)) fail('a honk lean has no more echo');
  if (!(lean('bane').room < even.room)) fail('a bane lean is not forward and close');
  notes.push(`shelfColor: 400 random vectors in range; boon bright ${lean('boon').bright.toFixed(1)} dB, bone ${lean('bone').bright.toFixed(1)}, bonk dry ${lean('bonk').dry.toFixed(2)}, honk echo ${lean('honk').echo.toFixed(2)}`);
}

// Stings.
{
  sound.SCORED_SHELVES.forEach((shelf) => {
    const set = sound.stingPlan(shelf);
    const done = sound.stingPlan(shelf, { complete: true });
    if (!set.length) fail(`${shelf}: no sting`);
    if (!(done.length > set.length)) fail(`${shelf}: a completed chain adds no cadence`);
    [...set, ...done].forEach((n) => { if (n.tone == null && n.bass == null && n.voice !== 'tock') fail(`${shelf}: a sting note is placed in no chord, scale or bass`); });
    if (set.some((n) => (n.vol || 0) > 0.05)) fail(`${shelf}: a sting is louder than a catch`);
  });
  let st = null;
  const a = sound.admitSting(st, 'boon', 10); st = a.state;
  const b = sound.admitSting(st, 'bane', 10.4);
  if (!a.play || b.play) fail('two stings within the gap both played');
  const vols = [];
  let t = 20;
  for (let i = 0; i < 6; i += 1) { const g = sound.admitSting(st, 'boon', t); st = g.state; vols.push(g.play ? g.vol : 0); t += 1; }
  if (!(vols[1] < vols[0] && vols[2] < vols[1])) fail(`a repeated sting does not soften: ${vols.map((v) => v.toFixed(2)).join(', ')}`);
  if (!vols.includes(0)) fail('a sting heard once a second never rests');
  const rested = sound.admitSting(st, 'boon', t + 30);
  if (!rested.play || rested.vol < 0.9) fail('a sting does not recover after a rest');
  notes.push(`stings: gap ${sound.STING_GAP}s; the same shelf once a second plays at ${vols.map((v) => v.toFixed(2)).join(', ')}, and recovers after half a minute`);
}

// Trope motifs.
{
  /** @type {{ id: string }[]} */
  const tropes = JSON.parse(readFileSync(resolve(ROOT, 'book/content/world/tropes.json'), 'utf8')).tropes;
  const counts = new Set();
  tropes.forEach((tr) => {
    const sizes = [0, 1, 2, 3, 4].map((s) => sound.motifPlan(tr.id, s).notes.length);
    if (sizes.some((n, i) => i && n < sizes[i - 1]) || sizes[0] !== 1 || sizes[4] <= sizes[2]) fail(`${tr.id}: the motif does not grow by stage (${sizes.join(', ')})`);
    counts.add(sizes.join(','));
    if (JSON.stringify(sound.motifPlan(tr.id, 2)) !== JSON.stringify(sound.motifPlan(tr.id, 2))) fail(`${tr.id}: the motif is not the same tune twice`);
    const shape = sound.tropeShape(tr.id);
    if (Math.max(...shape) - Math.min(...shape) > 7) fail(`${tr.id}: the motif wanders past an octave`);
    if (sound.motifPlan(tr.id, 1, { refrain: 3 }).notes.length !== sizes[1]) fail(`${tr.id}: a refrain is heard before the trope is named`);
    const r = sound.motifPlan(tr.id, 4, { refrain: 3 }).notes;
    const tail = r.slice(sizes[4]);
    if (tail.length !== 6 || tail.some((n, i) => i >= 2 && n.vol >= tail[i - 2].vol)) fail(`${tr.id}: a refrain does not come back quieter each time`);
  });
  const tunes = new Set(tropes.map((tr) => sound.tropeShape(tr.id).join(' ')));
  notes.push(`trope motifs: ${tropes.length} tropes, notes by stage ${[...counts].join(' / ')}; ${tunes.size} different tunes`);
}

// Characters' own time.
{
  const line = '@boof{ ?scent !dig ~ &berry ^up .ground }';
  const fig = sound.cadencePlan('figure', cadenceOf(line, 'figure'));
  const mime = sound.cadencePlan('mime', cadenceOf(line, 'mime'));
  if (fig.voiced || fig.notes.length) fail('the figure is voiced');
  if (!mime.rest || mime.voiced) fail('the mime is not the rest');
  ['boof', 'genie', 'clown', 'bonewap', 'ants'].forEach((who) => {
    const p = sound.cadencePlan(who, cadenceOf(line, who));
    if (!p.voiced || p.notes.length > 16) fail(`${who}: not voiced, or longer than sixteen hits`);
    if (p.notes.some((n) => n.vol > 0.025)) fail(`${who}: louder than a quiet voice`);
  });
  notes.push(`own time: figure unvoiced, mime the rest, boof ${sound.cadencePlan('boof', cadenceOf(line, 'boof')).notes.length} hits, genie ${sound.cadencePlan('genie', cadenceOf(line, 'genie')).notes.length}`);
}

// Silent with no speaker, and with the switch off.
{
  sound.setSoundDesign(null);
  if (sound.chainSting('boon') || sound.tropeMotif('wap', 2) || sound.cadenceVoice('boof', cadenceOf('!a', 'boof'))) fail('a hook sounded with no speaker');
  const off = sound.shelfColor({ boon: 1 });
  if (!off || off.bright !== -6 || off.dry !== 0) fail('with the trial off the bed is not left as it was');
  sound.setSoundDesign(true);
  if (sound.chainSting('boon')) fail('a hook sounded with no audio context');
  sound.setSoundDesign(null);
}

notes.forEach((n) => console.log(`  ${n}`));
if (fails.length) {
  console.error(`[sound] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.slice(0, 30).forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[sound] ok. Plans only: nobody has listened, and how it sounds is not judged here.');
