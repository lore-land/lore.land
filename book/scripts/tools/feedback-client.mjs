#!/usr/bin/env node
/**
 * feedback-client.mjs — lore.land's client file for autonomous.feedback (/.well-known/autonomous-feedback.json).
 *
 * autonomous.feedback is the post the Scriptorium reads (its worker lives in spwashi.com, workers/autonomous-feedback):
 * a reader writes a card at autonomous.feedback/lore.land, and the post reads this file to know the book's subjects,
 * kinds, threads and pages. The worker keeps only so much of it (config.js SUBJECT_LIMITS and the route list), and
 * drops the rest without saying so, so this tool writes the routes from the catalog within the limit, and
 * clientProblems() holds the whole file to the limits for book:check.
 *
 * Routes name a page in the post's picker and on the card. Every chapter's slip door passes its own ?at=, so a
 * chapter left out of the picker is still known by its path; the picker keeps the entrance, the rooms of the site,
 * Chapter One and the newest chapters. Run by chapters:build; --check reports drift and exits 1 without writing.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const CLIENT = resolve(ROOT, '.well-known/autonomous-feedback.json');

/** What the worker keeps (spwashi.com workers/autonomous-feedback/src/config.js). */
export const LIMITS = Object.freeze({ routes: 20, routeName: 40, subjects: 12, paths: 8, kinds: 8, asks: 3, threads: 6, prompt: 160, example: 160, stance: 300 });
export const KINDS = Object.freeze(['appreciation', 'question', 'confusing', 'missing', 'wrong', 'broken']);

/** The rooms of the site a reader may write from without a chapter in hand. */
const HUBS = Object.freeze([
  ['Exactly One Pie', '/pie/'],
  ['Almanac', '/almanac/'],
  ['Scriptorium', '/scriptorium/'],
  ['Folios', '/folios/'],
  ['The Boonberry Broadside', '/zine/'],
  ['texture.website', '/texture/'],
  ['Charms', '/charm/']
]);

export function routesFrom(catalog) {
  const chapters = (catalog.chapters || []).filter((c) => c.number).sort((a, b) => a.number - b.number);
  const room = LIMITS.routes - 1 - HUBS.length;
  const newest = chapters.slice(1).slice(-(room - 1));
  const kept = [chapters[0], ...newest].filter(Boolean);
  const name = (c) => {
    const full = `Ch. ${c.number} · ${c.title}`;
    return full.length <= LIMITS.routeName ? full : `${full.slice(0, LIMITS.routeName - 1)}…`;
  };
  return [
    { name: 'The entrance', path: '/' },
    ...kept.map((c) => ({ name: name(c), path: `/book/chapter/${String(c.number).padStart(2, '0')}/` })),
    ...HUBS.map(([n, path]) => ({ name: n, path }))
  ];
}

/** Everything in the file the worker would drop or refuse, in words. */
export function clientProblems(client, root = ROOT) {
  const out = [];
  const routes = client.routes || [];
  if (routes.length > LIMITS.routes) out.push(`${routes.length} routes; the post keeps the first ${LIMITS.routes}`);
  routes.forEach((r) => {
    if (!r.name || r.name.length > LIMITS.routeName) out.push(`route ${r.path}: a name of 1 to ${LIMITS.routeName} characters`);
    if (!/^\//.test(r.path || '')) out.push(`route ${r.name}: a path that starts with /`);
    else if (!existsSync(resolve(root, `.${r.path}`, r.path.endsWith('/') ? 'index.html' : ''))) out.push(`route ${r.path}: no such page`);
  });
  (client.kinds || []).forEach((k) => { if (!KINDS.includes(k)) out.push(`kind ${k} is not one the post knows`); });
  const subjects = client.subjects || [];
  if (subjects.length > LIMITS.subjects) out.push(`${subjects.length} subjects; the post keeps the first ${LIMITS.subjects}`);
  subjects.forEach((s) => {
    const at = `subject ${s.id}`;
    if ((s.paths || []).length > LIMITS.paths) out.push(`${at}: more than ${LIMITS.paths} paths`);
    if ((s.kinds || []).length > LIMITS.kinds) out.push(`${at}: more than ${LIMITS.kinds} kinds`);
    (s.kinds || []).forEach((k) => { if (!(client.kinds || KINDS).includes(k)) out.push(`${at}: kind ${k} is not one of the site's kinds`); });
    if ((s.asks || []).length > LIMITS.asks) out.push(`${at}: more than ${LIMITS.asks} asks`);
    if ((s.threads || []).length > LIMITS.threads) out.push(`${at}: more than ${LIMITS.threads} threads`);
    if ((s.prompt || '').length > LIMITS.prompt) out.push(`${at}: a prompt longer than ${LIMITS.prompt}`);
    if ((s.example || '').length > LIMITS.example) out.push(`${at}: an example longer than ${LIMITS.example}`);
    (s.threads || []).forEach((t) => {
      if ((t.stance || '').length > LIMITS.stance) out.push(`${at}.${t.id}: a stance longer than ${LIMITS.stance}`);
      if (t.link && !/^\//.test(t.link)) out.push(`${at}.${t.id}: a link must be a path on the site`);
      if (t.kind && !(s.kinds || client.kinds || KINDS).includes(t.kind)) out.push(`${at}.${t.id}: kind ${t.kind} is not one of the subject's kinds`);
    });
  });
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const catalog = JSON.parse(readFileSync(resolve(ROOT, 'book/content/catalog.json'), 'utf8'));
  const text = readFileSync(CLIENT, 'utf8');
  const client = JSON.parse(text);
  client.routes = routesFrom(catalog);
  const next = `${JSON.stringify(client, null, 2)}\n`;
  if (check) {
    if (next !== text) { console.log('[feedback:client] the routes are out of date (npm run chapters:build)'); process.exit(1); }
  } else if (next !== text) writeFileSync(CLIENT, next);
  const problems = clientProblems(client);
  console.log(`[feedback:client] ${client.routes.length} routes, ${(client.subjects || []).length} subjects${problems.length ? ` · ${problems.length} problem(s)` : ''}`);
  problems.forEach((p) => console.log(`  ${p}`));
}
