#!/usr/bin/env node
// @ts-check
/**
 * formulas-check.mjs — the Spw formulas and the land's answers, held to account (npm run formulas:check).
 *
 *   - every catalogued formula (spw-formulas.mjs FORMULAS, mirrored in .spw/surfaces/formulas.spw) is parsed by the
 *     vendored parser under the prose profile (what lint uses) and the default profile (the plain grammar); a form
 *     that does not read whole is a finding, printed, not a failure
 *   - every formula with an expected value computes it, and lines that must not compute do not (negative controls)
 *   - the land (land-answers.mjs) acknowledges a sample of expressions in the canon's own words, answers an unknown
 *     one honestly (what was read, and what is near), and never acknowledges a held word
 *   - every special pairing resolves every path it names to canon text (so no answer is new prose)
 *   - a board line cast at the desk round-trips into the pie game's record (view keys only, nothing else touched)
 * Nothing here was seen in a browser.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORMULAS, castFormula, resolveLand, ladderOf, readMind, mergeBoard, isFormula, MINDS } from '../modules/spw-formulas.mjs';
import { buildLand, answer, coverage, surfacePairs, SPECIAL, HELD } from '../modules/land-answers.mjs';
import { CHARACTERS, MODELS, REASONS, WEIGHT } from '../modules/characters.mjs';
import { KINDS } from '../modules/kinds.mjs';
import { POWER_SPELLS } from '../home/pie-powers.mjs';
import { OPERATOR_RESONANCE } from '../modules/spw-resonance.mjs';
import { readBoardLine } from '../home/pie-frame.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const json = (/** @type {string} */ p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
/** The folios are pieces of texture.website (its pack); until the pack holds them, the land answers without them. */
const FOLIOS = 'book/content/packs/texture.website/@spwashi/folios.json';
/** @type {string[]} */
const fails = [];
/** @type {string[]} */
const findings = [];
const fail = (/** @type {string} */ why) => fails.push(why);

/** @type {any} */
const seed = await import('../vendor/spw-seed.mjs').catch(() => null);
if (!seed) fail('the vendored Spw parser could not be loaded');
const opts = { parse: seed?.parse || null, readBias: seed?.readBias || null };

// 1. The catalogue: parsed both ways, and computed where it computes.
let wholeProse = 0;
let wholeDefault = 0;
for (const f of FORMULAS) {
  if (seed) {
    const p = seed.parse(f.form, { lexProfile: 'prose' });
    const d = seed.parse(f.form, { lexProfile: 'default' });
    const okP = Boolean(p.completeness?.complete && !p.completeness.proseFallback);
    const okD = Boolean(d.completeness?.complete && !d.completeness.proseFallback);
    if (okP) wholeProse += 1; else findings.push(`prose profile does not read ${f.form} whole`);
    if (okD) wholeDefault += 1; else findings.push(`default profile does not read ${f.form} whole`);
  }
  if (f.expect !== undefined) {
    const { said } = castFormula(f.form, opts);
    if (String(said.value) !== String(f.expect)) fail(`${f.form}: computed ${JSON.stringify(said.value)}, expected ${JSON.stringify(f.expect)} (${said.kind})`);
  }
  if (f.castable && !isFormula(f.form) && !/^[~=]\[|^~#/.test(f.form)) findings.push(`${f.form} is castable but the desk would not treat it as a formula (it goes to the land, which also answers it)`);
}
// Quirks the parser shows on these forms, read from its own tree.
if (seed) {
  const ground = seed.parse('.<boon>', { lexProfile: 'default' });
  const first = ground.ast?.expression?.expressions?.[0]?.terms?.[0];
  if (first?.type === 'Capsule') findings.push('.<boon> reads as a bare Capsule: the ground sigil is dropped before <, so "ground the concept one step" has no form the parser keeps (.( ) and .[ ] keep it)');
  const mind = seed.parse('@boof{ <boon>{bone} }', { lexProfile: 'default' });
  const e = mind.ast?.expression?.expressions?.[0];
  if (e?.terms?.[0]?.type === 'Reference' && e.body) findings.push('@boof{ … } reads as a Reference whose body hangs on the Expression, not the term (as @word[ … ] does with its frame)');
  const cap = e?.body?.sequence?.expressions?.[0]?.terms?.[0];
  if (cap?.type === 'Capsule' && cap.interior?.expressions?.[0]?.modifiers?.modifiers?.[0]?.value === 'boon') findings.push('<boon> reads as a Capsule whose interior is an empty Expression carrying the modifier boon: a valence word in any container is a modifier, not a name');
}

// 2. Negative controls: what must not compute.
/** @type {Array<[string, (s: { kind: string, value?: unknown, says: string[] }) => boolean, string]>} */
const NOT = [
  ['*hand[3]{ %from[2] =ordered[no] =repeats[no] }', (s) => s.value === 0, 'three different cards cannot come from two'],
  ['%[slice]{ 0 }', (s) => s.value === undefined, 'a slice of nothing is not a measure'],
  ['=lean{ }', (s) => s.value === undefined, 'a lean with no weight leans nowhere'],
  ['<boon>.land@genie', (s) => s.value === 'open', 'a mind with no table is open, never guessed'],
  ['<bane>.land@boof', (s) => s.value === 'open', 'a row the maker has not written is open'],
  ['{boon}.land@boof', (s) => s.value === '{boon}.land', 'the literal place is the literal place, for Boof too'],
  ['{bonk}.land', (s) => /not one of the three lands/.test(s.says.join(' ')), 'bonk is in the pentad, but is not a land'],
  ['@boof{ <boon>{bane} }', (s) => s.value === '', 'a map that disagrees with the canon is read, not kept'],
  ['^[boon]{ x', (s) => s.kind !== 'ladder', 'an unclosed body is not a step on the ladder']
];
NOT.forEach(([form, ok, what]) => { const { said } = castFormula(form, opts); if (!ok(said)) fail(`negative control failed (${what}): ${form} gave ${JSON.stringify(said)}`); });
if (resolveLand('<boon>.land', { as: 'boof' }).resolved !== '{bone}.land') fail('resolving <boon>.land as Boof did not give {bone}.land');
if (resolveLand('<boon>.land').resolved !== null) fail('a concept with no mind resolved to a place');
if (ladderOf('^<boon>')?.moved !== null) fail('a concept moved past the top of the ladder');
if (readMind('@boof{ <boon>{bone} }', opts)?.reader !== (seed ? 'spw-seed' : 'small')) fail('the map @boof{ <boon>{bone} } was not read by the parser');
if (Object.keys(MINDS).length !== 1) findings.push(`minds with tables: ${Object.keys(MINDS).join(', ')} (every other mind is open, for the maker)`);

// 3. The land answers.
const land = buildLand({
  characters: CHARACTERS, models: MODELS, reasons: REASONS, weight: WEIGHT, kinds: KINDS, powers: POWER_SPELLS, resonance: OPERATOR_RESONANCE,
  almanac: json('book/content/world/almanac.json'), tropes: json('book/content/world/tropes.json'), likeness: json('book/content/world/likeness.json'),
  folios: existsSync(resolve(ROOT, FOLIOS)) ? json(FOLIOS) : null, berries: json('book/content/world/berries.json'),
  inventions: surfacePairs(readFileSync(resolve(ROOT, '.spw/surfaces/inventions.spw'), 'utf8')),
  physics: surfacePairs(readFileSync(resolve(ROOT, '.spw/surfaces/liminal-physics.spw'), 'utf8'))
});
const cov = coverage(land);
const ACK = ['*beaver{ ~lag }', '@boof{ ?scent }', '&ants{ !torch }', '=bane@pie{ @mime }', '^[porter]{ .storm_weight }', '%[slice]{ 1/8 }', '<pocket>{ }', '?porter', '#hob_deer', '.warm_furrow', '@exactly_one', '*creature', '%boof', '=porter', '@boof{ &ants }', '@genie{ ?thursday }', '<boon>.land@boof', '*hand[3]{ %from[5] =ordered[no] =repeats[no] }', '{ }', '~[torch_ants]', '!jazz_geese', '$boonberries'];
ACK.forEach((e) => { const a = answer(land, e, opts); if (!a.acknowledged) fail(`${e} was not acknowledged: ${a.says.join(' ')}`); });
// Every name under every sigil it has a field for is acknowledged (sampled across every name, every sigil).
let swept = 0;
for (const noun of new Set(land.nouns.values())) {
  for (const sigil of Object.keys(noun.fields)) {
    const a = answer(land, `${sigil}${noun.key}`, opts);
    swept += 1;
    if (!a.acknowledged && !a.held) fail(`${sigil}${noun.key} has a field but was not acknowledged`);
  }
}
// The honest unknown: what was read, and what is near, never an error.
const unknown = answer(land, '!clwn', opts);
if (unknown.acknowledged || !/Read: ! \(action\)/.test(unknown.says[0]) || !unknown.nearest?.length) fail(`the honest unknown did not say what it read or what is near: ${JSON.stringify(unknown)}`);
const nothing = answer(land, '@zzqx{ ~qqq }', opts);
if (nothing.acknowledged || !nothing.says.length) fail('an unknown with nothing near was not answered');
// Held words are never acknowledged as anything, and never offered as near.
const HELD_TRY = ['@wapboy', '*hat', '?[figure]', '~egg', '@boof{ ?hat }', '!WAP_boy', '#bowler', '*plain_lines', '&shell'];
HELD_TRY.forEach((e) => { const a = answer(land, e, opts); if (a.acknowledged) fail(`held word acknowledged: ${e}`); });
if ([...land.nouns.keys()].some((k) => HELD.test(k.replace(/_/g, ' ')))) fail('a held word is a name the land knows');
const answersText = [...new Set(land.nouns.values())].flatMap((n) => Object.values(n.fields).map((f) => f?.text || ''));
if (answersText.some((t) => /wap\s*-?\s*boy|wabo/i.test(t))) fail('an answer names who is under the hat');
// Every special pairing resolves to canon.
SPECIAL.forEach(([form, paths]) => {
  const a = answer(land, form, opts);
  if (!a.acknowledged || !a.special) fail(`special pairing ${form} did not answer as itself`);
  if (a.says.length < paths.length) fail(`special pairing ${form}: ${paths.length - a.says.length} of its canon paths gave nothing (${paths.join(', ')})`);
});

// 4. The desk's board path: a line in, the pie record out, view keys only.
{
  const before = { best: 412, runs: 9, view: { story: true, hand: 'right', tap: 'throw', fill: 'fit' }, sound: false };
  const { view } = readBoardLine('^board{ @hold[one_thumb] @hand[left] =story_at[off] %lanes[0.9] }', { parse: opts.parse });
  const after = mergeBoard(before, view);
  if (after.best !== 412 || after.runs !== 9 || after.sound !== false) fail('keeping a board line touched more than the view');
  if (after.view.hand !== 'left' || after.view.hold !== 'one_thumb' || after.view.tap !== 'go' || after.view.share !== 0.9 || after.view.story !== false) fail(`the board did not round-trip: ${JSON.stringify(after.view)}`);
  if (before.view.tap !== 'throw') fail('keeping a board line changed the record it was given');
  const again = mergeBoard(null, readBoardLine('^board{ =wings[two] }').view);
  if (Object.keys(again.view).length) fail('a line with no choices kept something');
}

console.log(`[formulas] ${FORMULAS.length} formulas catalogued: ${wholeProse} read whole in the prose profile, ${wholeDefault} in the default profile; ${FORMULAS.filter((f) => f.expect !== undefined).length} compute their expected value; ${NOT.length} negative controls.`);
console.log(`[land] ${cov.nouns} things known by ${cov.names} names (${Object.entries(cov.byType).map(([k, v]) => `${v} ${k}`).join(', ')}); ${cov.pairs} name × sigil answers, every one swept (${swept}); ${cov.special} special pairings; ${ACK.length} sampled expressions acknowledged; ${HELD_TRY.length} held words refused.`);
console.log(`[land] expressions a reader could write that get an answer: ${cov.pairs * 4} single-name forms (four shapes each), ${cov.single} counting every alias, and ${cov.meetings.toLocaleString('en')} two-name meetings.`);
if (!existsSync(resolve(ROOT, FOLIOS))) console.log(`  note: ${FOLIOS} is not there yet, so folios were left out of the land for this run`);
findings.forEach((f) => console.log(`  finding: ${f}`));
if (fails.length) {
  console.error(`[formulas] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.slice(0, 40).forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[formulas] ok. Nothing here was seen in a browser.');
