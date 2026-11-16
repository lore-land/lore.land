#!/usr/bin/env node
// @ts-check
/**
 * plan-gate.mjs — what the plans claim, read with the real parser and held against the tree (npm run spw:plans).
 *
 * It reads and prints; it writes nothing. The first line is always the next stone, because a plan that is green while
 * the reader's next chapter does not exist has answered the wrong question.
 *
 *   hard  an open slice with no operation, files, decides or check; a check naming a script that is gone; a grant with no
 *         guess, no gain, no price or no receipt; an audit_active that points at nothing. Each is a claim nobody can act on.
 *   warn  a slice that names a path that is not there, or has outgrown its budget; how much recent work reached a reader;
 *         open questions, oldest first.
 *
 * --strict exits 1 on a hard finding. On a shallow clone it says what it could not read rather than guessing.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parse, readBias } from '../../book/scripts/vendor/spw-seed.mjs';
import { spwFiles } from './spw-files.mjs';
import { walkAst, parseProseSpw, nodeText, bindingInfo } from '../../book/scripts/modules/spw-ast.mjs';

/** @typedef {Record<string, any>} Node */

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const SLICE_BUDGET = 700;
const OPEN_RELEASES = new Set(['next', 'proposed', 'later']);
const QUESTION_LABELS = new Set(['open', 'decide', 'wonders', 'open_questions']);
const read = (/** @type {string} */ file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const git = (/** @type {string[]} */ ...args) => {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).trim(); } catch { return null; }
};
/** @type {string[]} */ const hard = [];
/** @type {string[]} */ const warn = [];

const parsed = (/** @type {string} */ file) => {
  const text = read(file);
  const { result, ast } = parseProseSpw(text, parse);
  if (!result?.completeness?.complete) hard.push(`${file}: does not read whole, so nothing in it can be checked`);
  return { text, ast: /** @type {Node} */ (ast) };
};

/* Optional scheduled stone in serial.json (dormant when serial.next is null). */
const serial = JSON.parse(read('book/content/serial.json'));
let stoneLine = null;
if (serial.next?.chapter && serial.next?.date) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));   // the maker's calendar day, not UTC's
  const days = Math.round((Date.parse(`${serial.next.date}T00:00:00Z`) - today.getTime()) / 86400000);
  const stoneFile = `book/content/chapters/${String(serial.next.chapter).padStart(2, '0')}.json`;
  const stoneExists = fs.existsSync(path.join(ROOT, stoneFile));
  if (!stoneExists && days <= 7) warn.push(`stone ${serial.next.chapter} is ${days < 0 ? 'late' : `due in ${days} days`} and has no chapter`);
  stoneLine = `stone ${serial.next.chapter} is due ${serial.next.date} (${days < 0 ? `${-days} days late` : `in ${days} days`}); ${stoneExists ? 'its chapter exists' : 'it has no chapter yet'}`;
}

/* The slices. */
const scripts = JSON.parse(read('package.json')).scripts;
let openSlices = 0;
for (const file of ['PLAN.E.spw', 'PLAN.F.spw']) {
  const { ast } = parsed(file);
  walkAst(ast, (node) => {
    if (node.type !== 'Parameter' || !/^[fi]\d+s?$/.test(node.name?.value ?? '')) return;
    /** @type {Record<string, string>} */ const fields = {};
    for (const expr of node.value?.terms?.[0]?.sequence?.expressions ?? []) {
      const b = bindingInfo(expr.terms?.[0]);
      if (b) fields[b.name] = b.text;
    }
    if (!OPEN_RELEASES.has(fields.release)) return;
    openSlices += 1;
    const id = `${file} ${node.name.value}`;
    const missing = ['operation', 'files', 'decides', 'check'].filter((key) => !fields[key]);
    if (missing.length) hard.push(`${id}: no ${missing.join(', ')}`);
    for (const [, name] of (fields.check || '').matchAll(/npm run ([\w:-]+)/g)) if (!scripts[name] && !(fields.done_when || '').includes(name)) hard.push(`${id}: its check names npm run ${name}, which is gone`);
    for (const part of (fields.files || '').split(',').map((word) => word.trim().split(/\s/)[0])) {
      if (part.includes('/') && /\.\w+$/.test(part) && !fs.existsSync(path.join(ROOT, part)) && !(fields.done_when || '').includes(part)) warn.push(`${id}: names ${part}, which is not there`);
    }
    const length = node.span.end.offset - node.span.start.offset;
    if (length > SLICE_BUDGET) warn.push(`${id}: ${length} characters, past the budget of ${SLICE_BUDGET}`);
  });
}

/* The grants: an improvement on record says what it was for, what was guessed, what it gave and what it took. */
const shallow = git('rev-parse', '--is-shallow-repository') !== 'false';
let grants = 0;
{
  const file = '.spw/state/grants.spw';
  const { text, ast } = parsed(file);
  walkAst(ast, (node) => {
    if (node.type !== 'Operation' || node.operator?.value !== '^' || node.operatorLabel?.value !== 'grant') return;
    grants += 1;
    const id = nodeText(node.frame?.content?.[0]?.value) || `at ${node.span.start.line}`;
    const body = text.slice(node.span.start.offset, node.span.end.offset);
    /** @type {string[]} */ const signs = [];
    walkAst(node.body, (inner) => { if (inner.type === 'Operation' && inner.operator?.value === '=') signs.push(.../** @type {string[]} */ (/** @type {any} */ (readBias(inner))?.valence ?? [])); });
    for (const [mark, words] of [[/!wish:/, 'wish'], [/~#expect:/, 'guess made beforehand']]) if (!/** @type {RegExp} */ (mark).test(body)) hard.push(`grant ${id}: no ${words}`);
    if (!signs.includes('boon')) hard.push(`grant ${id}: says nothing it gave (a =boon edge)`);
    if (!signs.includes('bane')) hard.push(`grant ${id}: says nothing it took (a =bane edge); nothing granted is free`);
    const receipt = body.match(/~#receipt:\s*"([0-9a-f]{7,40})"/)?.[1];
    if (!receipt) hard.push(`grant ${id}: no receipt`);
    else if (!shallow && git('cat-file', '-e', `${receipt}^{commit}`) === null) hard.push(`grant ${id}: receipt ${receipt} is not in this history`);
  });
}

/* The index points at something real. */
{
  const indexText = read('.spw/index.spw');
  const active = indexText.match(/audit_active:\s*~?"(?:@spw\/|\.spw\/|\.\.\/|\.\/)?([^"]+)"/)?.[1];
  if (!active || !fs.existsSync(path.join(ROOT, '.spw', active))) hard.push(`.spw/index.spw: audit_active points at ${active ?? 'nothing'}`);
}

/* Topical plan folders (.spw/plans/*, patterned after spwashi.com): each non-archive folder owns index.spw + PLAN.md. */
let planFolders = 0;
{
  const plansRoot = path.join(ROOT, '.spw/plans');
  if (fs.existsSync(plansRoot)) {
    parsed('.spw/plans/index.spw');
    for (const entry of fs.readdirSync(plansRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'archive') continue;
      planFolders += 1;
      const rel = `.spw/plans/${entry.name}`;
      if (!fs.existsSync(path.join(ROOT, rel, 'index.spw'))) hard.push(`${rel}: missing index.spw`);
      else parsed(`${rel}/index.spw`);
      if (!fs.existsSync(path.join(ROOT, rel, 'PLAN.md'))) warn.push(`${rel}: missing PLAN.md`);
    }
  }
}

/* The open questions, and whether any has been let go. */
/** @type {{ file: string, items: number, when: string }[]} */ const asked = [];
let answered = 0;
for (const full of [...spwFiles(path.join(ROOT, '.spw')), path.join(ROOT, 'PLAN.E.spw'), path.join(ROOT, 'PLAN.F.spw')]) {
  const file = path.relative(ROOT, full);
  const text = read(file);
  const result = parse(text, { lexProfile: 'prose' });
  let items = 0;
  walkAst(result.ast, (node) => {
    if (node.type !== 'Operation' || node.operator?.value !== '?' || !QUESTION_LABELS.has(node.operatorLabel?.value)) return;
    items += node.frame?.content?.length ?? node.body?.sequence?.expressions?.length ?? 0;
    answered += (text.slice(node.span.start.offset, node.span.end.offset).match(/~#(answer|retired)\(\d{4}-\d{2}-\d{2}\)/g) ?? []).length;
  });
  if (items) asked.push({ file, items, when: (shallow ? '' : git('log', '-1', '--format=%as', '--', file)) || 'not yet committed' });
}
asked.sort((a, b) => a.when.localeCompare(b.when));
const questions = asked.reduce((sum, entry) => sum + entry.items, 0);

/* How much recent work reached a reader. */
let spend = 'history is shallow here, so recent work could not be read';
if (!shallow) {
  const log = git('log', '-30', '--name-only', '--format=tformat:@@') ?? '';
  const commits = log.split('@@').map((chunk) => chunk.trim().split('\n').filter(Boolean)).filter((files) => files.length);
  const reaches = (/** @type {string} */ f) => /^(book\/content\/|book\/styles\/|book\/scripts\/(home|modules)\/|[\w-]+\/index\.html$|index\.html$)/.test(f);
  const reader = commits.filter((files) => files.some(reaches)).length;
  const chapters = commits.filter((files) => files.some((f) => f.startsWith('book/content/chapters/'))).length;
  spend = `${reader} of the last ${commits.length} commits reached a reader, ${chapters} touched a chapter`;
  if (serial.next?.chapter && commits.length >= 10 && chapters === 0) warn.push(`none of the last ${commits.length} commits touched a chapter`);
  if (commits.length && reader / commits.length < 0.5) warn.push(`${spend}: the tools are outrunning the book`);
}

if (stoneLine) console.log(`plans[stone]{ ${stoneLine} }`);
console.log(`plans[count]{ ${openSlices} open slices · ${planFolders} plan folders · ${grants} grants · ${questions} open questions, ${answered} answered · ${spend} }`);
for (const entry of asked.slice(0, 5)) console.log(`  oldest  ${entry.when}  ${entry.file} (${entry.items})`);
console.log('  unread  PLAN.A to PLAN.D do not parse, so nothing here holds them');
for (const line of warn) console.log(`  warn  ${line}`);
for (const line of hard) console.error(`  HARD  ${line}`);
console.log(`plans[${hard.length ? 'fail' : 'ok'}]{ ${hard.length} hard, ${warn.length} warnings }`);
process.exit(STRICT && hard.length ? 1 : 0);
