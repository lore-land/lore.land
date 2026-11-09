#!/usr/bin/env node
/**
 * css-audit.mjs — a small audit for a refinement pass over one stylesheet:
 *   - selectors declared more than once in the same context (an override stacked on its original),
 *   - classes no page or module mentions (dynamic ones such as `is-${kind}` show up here too: check first),
 *   - hex colours repeated three times or more (candidates for a named token),
 *   - how many !important there are.
 *
 *   npm run css:audit -- book/styles/home/pie.css
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('../../..', import.meta.url).pathname;
const file = process.argv[2] || 'book/styles/home/pie.css';
const css = readFileSync(join(ROOT, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
// Walk rules with their at-rule context.
const rules = [];
let i = 0; const stack = [];
let buf = '';
while (i < css.length) {
  const ch = css[i];
  if (ch === '{') {
    const head = buf.trim(); buf = '';
    if (head.startsWith('@media') || head.startsWith('@supports') || head.startsWith('@container') || head.startsWith('@layer')) { stack.push(head); i += 1; continue; }
    // a rule body (or keyframes)
    let depth = 1; let j = i + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth += 1; else if (css[j] === '}') depth -= 1; j += 1; }
    const body = css.slice(i + 1, j - 1);
    if (!head.startsWith('@keyframes')) rules.push({ ctx: stack.join(' > '), sel: head.replace(/\s+/g, ' '), body, line: css.slice(0, i).split('\n').length });
    i = j; continue;
  }
  if (ch === '}') { stack.pop(); buf = ''; i += 1; continue; }
  buf += ch; i += 1;
}
const bySel = new Map();
rules.forEach((r) => { const k = `${r.ctx}||${r.sel}`; (bySel.get(k) || bySel.set(k, []).get(k)).push(r); });
const dups = [...bySel.entries()].filter(([, list]) => list.length > 1);
console.log(`rules: ${rules.length}, duplicated selector groups: ${dups.length}`);
dups.slice(0, 60).forEach(([k, list]) => console.log(`  ${list.length}× ${k.replace('||', ' :: ').slice(0, 110)}  lines ${list.map((r) => r.line).join(',')}`));
// Classes never referenced in html/mjs.
const sources = [];
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); if (/node_modules|dist|_workbench|\.git/.test(p)) return; const s = statSync(p); if (s.isDirectory()) walk(p); else if (/\.(html|mjs|js)$/.test(f)) sources.push(readFileSync(p, 'utf8')); });
walk(ROOT);
const all = sources.join('\n');
const classes = new Set([...css.matchAll(/\.([a-zA-Z][\w-]+)/g)].map((m) => m[1]));
const unused = [...classes].filter((c) => !all.includes(c));
console.log(`classes: ${classes.size}, never referenced in html/mjs: ${unused.length}`);
console.log('  ' + unused.join(' '));
const hex = {}; [...css.matchAll(/#[0-9a-fA-F]{6}\b/g)].forEach((m) => { hex[m[0].toLowerCase()] = (hex[m[0].toLowerCase()] || 0) + 1; });
console.log('repeated hex:', Object.entries(hex).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h}×${n}`).join(' '));
console.log('!important:', (css.match(/!important/g) || []).length);
