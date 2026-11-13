#!/usr/bin/env node
// @ts-check
/**
 * sound-check.mjs — the scored hooks (pie-sound.mjs, the sound-design trial) held to what scored.spw promises, without a
 * speaker (npm run sound:check). Sound can be measured, not judged: this checks the plans, not how they sound.
 *   the bed's colour stays in range, an even vector is the bed as it was, and no shelf is a key or a mode
 *   stings plan in key for every shelf, a completed chain adds a cadence, and stings rate-limit and soften
 *   a trope motif grows with its stage for every trope, the same tune every time, a refrain only once named
 *   the figure is unvoiced, the mime is the rest, and the hooks are silent with no speaker and no switch
 *   every scene has a ground, a room and a bed; rooms stay in range and can be told apart; a bed sits far under a
 *   catch; a material is placed in the chord or over the bass; no place names a key; unasked, the chapter's rule stands
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sound from '../home/pie-sound.mjs';
import { CHAPTER_SCENE, SCENES, SCENE_WHIMSY_DEFAULTS } from '../home/pie-world.mjs';
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

// Places: each scene's ground, room and bed (pie-world SCENES acoustic), and its material.
{
  const BED_CEILING = 0.012;     // a bed, and a drop of rain, at most
  const STING_CEILING = 0.05;    // a catch: what the stings above are held under
  const A_KEY = /key|root|mode|minor|major|scale/i;
  /** @type {(v: unknown) => boolean} */
  const namesAKey = (v) => (typeof v === 'string' ? A_KEY.test(v)
    : Array.isArray(v) ? v.some(namesAKey)
      : v && typeof v === 'object' ? Object.entries(v).some(([k, x]) => A_KEY.test(k) || namesAKey(x)) : false);
  /** The one predicate a bed is held to: its level, and its drops' level, under the bed ceiling and far under a catch.
   *  @param {{ level?: unknown, drops?: { level?: unknown } } | null} p */
  const quietBed = (p) => Boolean(p) && [p?.level, p?.drops ? p.drops.level : 0].every((l) => typeof l === 'number' && l >= 0 && l <= BED_CEILING && l < STING_CEILING / 2);
  /** @param {ReturnType<typeof sound.roomPlan>} p @param {string} who */
  const inRange = (p, who) => {
    const nums = [p.secs, p.damp, p.bright, p.darken, p.decay, p.onset, ...p.early.flat()];
    if (nums.some((x) => !Number.isFinite(x))) return fail(`${who}: a room has a number that is not one`);
    if (!(p.secs >= 0.4 && p.secs <= 2.4)) fail(`${who}: a room lasts ${p.secs}s`);
    if (!(p.damp >= 0 && p.damp <= 1)) fail(`${who}: damp ${p.damp}`);
    if (p.early.length > 8) fail(`${who}: ${p.early.length} reflections`);
    if (p.early.some(([at, g]) => !(at > 0 && at < p.secs && g >= 0 && g <= 0.6))) fail(`${who}: a reflection outside the room, or louder than 0.6`);
    if (p.weighed && p.early.reduce((sum, [, g]) => sum + g * g, 0) > 0.5 + 1e-9) fail(`${who}: the reflections outweigh half the tail`);
    // The tail's filter must keep a coefficient between 0 and 1 to its end, or the impulse is not a sound at all.
    if (!(p.bright < 1 && p.bright - p.darken > 0.02)) fail(`${who}: the tail's filter leaves (0, 1): ${p.bright} falling by ${p.darken}`);
    if (!(p.decay * p.secs >= 6)) fail(`${who}: the tail is cut off before it has died (${(p.decay * p.secs).toFixed(2)})`);
    if (!(p.onset >= 0.005 && p.onset <= 0.04)) fail(`${who}: the tail swells in over ${p.onset}s`);
    return undefined;
  };

  // The two rooms the lanes have always had are still themselves, and still two.
  const field = sound.roomPlan('field');
  const city = sound.roomPlan({ ground: 'city' });
  const WAS = {
    field: { secs: 1.8, early: [[0.006, 0.45]], damp: 0.8, bright: 0.5, darken: 0.42, decay: 3.8, onset: 0.025, weighed: false },
    city: { secs: 1.2, early: [[0.009, 0.5], [0.017, 0.38], [0.026, 0.3], [0.041, 0.22], [0.057, 0.15]], damp: 0.2, bright: 0.68, darken: 0.5, decay: 5.4, onset: 0.01, weighed: false }
  };
  if (JSON.stringify(field) !== JSON.stringify(WAS.field) || JSON.stringify(city) !== JSON.stringify(WAS.city)) fail('an old room is not the room it was');
  if (JSON.stringify(field) === JSON.stringify(city) || !(field.secs > city.secs && field.early.length < city.early.length)) fail('the field and the city are one room');
  if (JSON.stringify(sound.roomPlan('anywhere')) !== JSON.stringify(city) || JSON.stringify(sound.roomPlan(null)) !== JSON.stringify(city)) fail('a ground with no name is not the city');
  // A place's room lies on the line through them: at their damp it has their brightness and their decay.
  /** @type {['field' | 'city', typeof field][]} */ ([['field', field], ['city', city]]).forEach(([ground, was]) => {
    const p = sound.roomPlan({ ground, room: { secs: was.secs, early: was.early, damp: was.damp } });
    if (Math.abs(p.bright - was.bright) > 1e-9 || Math.abs(p.darken - was.darken) > 1e-9 || Math.abs(p.decay - was.decay) > 1e-9 || !p.weighed) fail(`a place's room at the ${ground}'s damp is not on the ${ground}'s line`);
  });

  // Wild inputs are held in range.
  const wild = sound.roomPlan({ ground: 'x', room: { secs: 99, early: Array.from({ length: 20 }, (_, i) => [9 + i, 9]), damp: -4 } });
  if (wild.secs !== 2.4 || wild.early.length !== 8 || wild.damp !== 0) fail(`a wild room is not held in: ${JSON.stringify(wild)}`);
  if (sound.roomPlan({ room: { secs: -1, damp: 7 } }).secs !== 0.4 || sound.roomPlan({ room: { secs: -1, damp: 7 } }).damp !== 1) fail('a room shorter than short, or damper than damp');
  [{ room: { secs: NaN, early: 'no', damp: '0.3' } }, { room: { early: [[NaN, 1], ['a', 'b'], null, [0.01, -3], [0.02, Infinity]] } }, { ground: 'field', room: {} }, { room: [] }]
    .forEach((odd, i) => inRange(sound.roomPlan(odd), `odd room ${i}`));
  let r = 11;
  const rand = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < 400; i += 1) {
    const early = Array.from({ length: Math.floor(rand() * 14) }, () => [rand() * 3 - 0.5, rand() * 4 - 1]);
    inRange(sound.roomPlan({ ground: rand() < 0.5 ? 'field' : 'city', room: { secs: rand() * 12 - 2, early, damp: rand() * 6 - 2 } }), `random room ${i}`);
  }

  // Every scene has an acoustic, and the six can be told apart on paper.
  const plans = SCENES.map((sc) => {
    const a = sc.acoustic;
    if (!a || !['field', 'city'].includes(a.ground) || !a.room || !Number.isFinite(a.room.secs) || !Array.isArray(a.room.early) || !Number.isFinite(a.room.damp) || typeof a.ambience !== 'string') fail(`${sc.id}: no acoustic, or half of one`);
    const p = sound.roomPlan(a);
    inRange(p, sc.id);
    if (!p.weighed) fail(`${sc.id}: its reflections are not weighed against its tail`);
    if (p.secs !== a.room.secs || p.damp !== a.room.damp || p.early.length !== a.room.early.length) fail(`${sc.id}: its room is written outside the range and was changed`);
    if (namesAKey(a) || namesAKey(p)) fail(`${sc.id}: a place names a key, a root or a mode`);
    return { id: sc.id, p };
  });
  /** @param {typeof field} a @param {typeof field} b */
  const apart = (a, b) => Math.abs(a.secs - b.secs) >= 0.15 || Math.abs(a.damp - b.damp) >= 0.1 || a.early.length !== b.early.length || Math.abs((a.early[0]?.[0] ?? 0) - (b.early[0]?.[0] ?? 0)) >= 0.004;
  plans.forEach((a, i) => plans.slice(i + 1).forEach((b) => { if (!apart(a.p, b.p)) fail(`${a.id} and ${b.id} are one room`); }));

  // Beds: every scene's has a plan, quiet by the one predicate; an unknown name has none.
  const beds = [...new Set(SCENES.map((sc) => sc.acoustic.ambience))];
  beds.forEach((name) => {
    const b = sound.ambiencePlan(name);
    if (!b) return fail(`${name}: a scene's bed has no plan`);
    if (!quietBed(b)) fail(`${name}: a bed, or its drops, is louder than ${BED_CEILING}`);
    if (!['white', 'pink', 'brown'].includes(b.colour)) fail(`${name}: colour ${b.colour}`);
    if (!(b.band.length === 2 && b.band[0] >= 40 && b.band[0] < b.band[1] && b.band[1] <= 12000)) fail(`${name}: band ${b.band}`);
    if (!(b.flutter.rate > 0 && b.flutter.rate <= 0.5 && b.flutter.depth >= 0 && b.flutter.depth <= 0.7)) fail(`${name}: a flutter that is not slow, or not a flutter`);
    if (b.drops && !(b.drops.everySec >= 0.3)) fail(`${name}: drops that are not sparse`);
    if (namesAKey(b)) fail(`${name}: a bed names a key, a root or a mode`);
    return undefined;
  });
  if (new Set(beds.map((name) => JSON.stringify(sound.ambiencePlan(name)))).size !== beds.length) fail('two beds are one bed');
  if (!SCENES.every((sc) => Boolean(sc.rain) === Boolean(sound.ambiencePlan(sc.acoustic.ambience)?.drops))) fail('rain is drawn where no drops fall, or falls where none is drawn');
  [undefined, null, '', 'thunder', 'constructor', 'toString', '__proto__', 42].forEach((name) => { if (sound.ambiencePlan(name) !== null) fail(`an unknown bed (${String(name)}) has a plan`); });
  // The negative control: the same predicate refuses a bed as loud as a catch, and drops as loud as one.
  if (quietBed({ level: 0.05 }) || quietBed({ level: 0.01, drops: { level: 0.05 } }) || quietBed(null) || !quietBed({ level: 0.012 })) fail('the bed predicate does not refuse a loud bed');

  // Without a scene, the chapter's number says the ground, as it always has; with one, the place does.
  const heardAnew = [];
  for (let n = 1; n <= 15; n += 1) {
    const was = sound.placePlan({ chapter: n });
    if (was.ground !== ([1, 2, 3, 7, 14].includes(n) ? 'field' : 'city') || was.room !== null || was.ambience !== null) fail(`chapter ${n}: with no scene, not the ground it always was`);
    const sc = SCENES.find((s) => s.id === /** @type {Record<number, string>} */ (CHAPTER_SCENE)[n]);
    if (!sc) { fail(`chapter ${n}: no scene`); continue; }
    const now = sound.placePlan({ chapter: n, scene: sc });
    if (now.ground !== sc.acoustic.ground || !now.room || now.ambience !== sc.acoustic.ambience) fail(`chapter ${n}: not heard where it is drawn`);
    if (now.ground !== was.ground) heardAnew.push(`${n} ${now.ground === 'field' ? 'grass' : 'cobble'}`);
  }
  if (sound.placePlan({ chapter: 5, scene: { id: 'nowhere' } }).ground !== 'city' || sound.placePlan({ chapter: 2, scene: null }).ground !== 'field') fail('a scene with no acoustic does not leave the chapter its rule');

  // Materials: the eight spw-sound.mjs names, and every scene's, each placed in the chord or over the bass and under a catch.
  const eight = (readFileSync(resolve(ROOT, 'book/scripts/modules/spw-sound.mjs'), 'utf8').match(/MATERIAL_WORDS = Object\.freeze\(\[([^\]]+)\]/)?.[1] || '').match(/[a-z]+/g) || [];
  if (eight.length !== 8) fail(`spw-sound.mjs names ${eight.length} materials, not eight`);
  [...new Set([...eight, ...Object.values(SCENE_WHIMSY_DEFAULTS).map((w) => w.material)])].forEach((m) => {
    const notes = sound.materialPlan(m);
    if (!notes.length) fail(`${m}: a material with no gesture`);
    notes.forEach((n) => {
      if (n.voice === 'hiss' ? !(n.band && n.band.length === 2) : n.tone == null && n.bass == null) fail(`${m}: a note placed in no chord and over no bass`);
      if (!(n.vol > 0 && n.vol <= 0.03 && n.vol < STING_CEILING)) fail(`${m}: louder than a quiet voice (${n.vol})`);
      if (!(n.at >= 0 && n.at <= 4 && n.dur > 0 && n.dur <= 0.9)) fail(`${m}: not one short gesture`);
    });
    if (namesAKey(notes)) fail(`${m}: a material names a key, a root or a mode`);
  });
  if (sound.materialPlan('velvet').length || sound.materialPlan('constructor').length || sound.materialPlan(null).length) fail('an unknown material has a gesture');

  // Silent with no speaker: nothing starts, nothing throws, and the place is still set.
  if (sound.setAmbience('rain') || sound.setAmbience(null) || sound.sceneMaterial('glass', 0) || sound.sceneMaterial('oak', 0.3, { after: 1 })) fail('a place sounded with no speaker');
  try {
    sound.setSoundPlace({ chapter: 3, scene: SCENES[2] });
    if (!sound.setSoundScene(SCENES[1]) || sound.setSoundScene(null) || sound.setSoundScene({ id: 'nowhere' })) fail('a door did not take a scene, or took none for one');
    sound.setSoundPlace({ chapter: 1 });
  } catch (err) { fail(`setting a place threw with no speaker: ${err}`); }

  const rain = sound.ambiencePlan('rain');
  notes.push(`places: ${SCENES.length} scenes, rooms ${plans.map(({ id, p }) => `${id} ${p.secs}s/${p.early.length}`).join(', ')}; 400 random rooms in range`);
  notes.push(`beds: ${beds.map((name) => `${name} ${sound.ambiencePlan(name)?.level}`).join(', ')} (ceiling ${BED_CEILING}); rain drops ${rain?.drops?.level} every ${rain?.drops?.everySec}s; ${eight.length} materials`);
  notes.push(`ground by scene: ${heardAnew.length ? `chapters ${heardAnew.join(', ')}` : 'no chapter changes'}; with no scene, every chapter as it was`);
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
