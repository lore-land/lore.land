#!/usr/bin/env node
// @ts-check
/**
 * Smoke-test routes of a static site: load each one, and report exceptions, console errors, failed requests and sideways overflow.
 *
 *   node cli.mjs --root ./public --route / --route /about/ --width 390
 *
 * Exit 0 if every route is clean, 1 if any is not, 2 if it could not run.
 */
import { parseArgs } from 'node:util';
import { HarnessError, withHarness } from './index.mjs';

const USAGE = `Usage: browser-harness --root <dir> --route <path> [--route <path>...]
  --allow-dot <name>   a dot-named directory that may be served (repeatable), such as .well-known
  --width <px>         viewport width (default 1280)
  --height <px>        viewport height (default 800)
  --settle <ms>        how long to watch after load (default 1500)
  --ignore <regex>     ignore problems matching this (repeatable)
  --chrome <path>      the browser (default: $CHROME, then the first one installed)
  --no-sandbox         for containers that need it
  --json               one JSON report on stdout`;

/** @param {string} message */
const usage = (message) => { console.error(`${message}\n\n${USAGE}`); process.exit(2); };

let parsed;
try {
  parsed = parseArgs({ options: {
    root: { type: 'string', default: '.' }, route: { type: 'string', multiple: true }, 'allow-dot': { type: 'string', multiple: true },
    width: { type: 'string', default: '1280' }, height: { type: 'string', default: '800' }, settle: { type: 'string', default: '1500' },
    ignore: { type: 'string', multiple: true }, chrome: { type: 'string' }, 'no-sandbox': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false }, help: { type: 'boolean', default: false }
  } }).values;
} catch (error) { usage(error instanceof Error ? error.message : String(error)); throw error; }
if (parsed.help) { console.log(USAGE); process.exit(0); }
const routes = parsed.route ?? [];
if (!routes.length) usage('At least one --route is needed.');
const [width, height, settle] = [Number(parsed.width), Number(parsed.height), Number(parsed.settle)];
if (![width, height, settle].every(Number.isFinite)) usage('--width, --height and --settle take numbers.');
const ignored = (parsed.ignore ?? []).map((pattern) => new RegExp(pattern));

try {
  const reports = await withHarness({ root: /** @type {string} */ (parsed.root), allowDotPaths: parsed['allow-dot'] ?? [], chromePath: parsed.chrome, noSandbox: parsed['no-sandbox'] }, async (harness) => {
    const out = [];
    for (const route of routes) {
      const page = await harness.open();
      await page.setViewport(width, height);
      /** @type {string[]} */
      let found = [];
      try {
        await page.goto(route);
        await new Promise((resolve) => { setTimeout(resolve, settle); });
        const widths = await page.ev('[document.documentElement.scrollWidth, innerWidth]');
        const problems = page.problems();
        found = [
          ...problems.exceptions.map((text) => `exception: ${text}`), ...problems.consoleErrors.map((text) => `console: ${text}`),
          ...problems.failedRequests.map((text) => `request: ${text}`), ...(widths[0] > widths[1] ? [`overflow: ${widths[0]}px wide in ${widths[1]}px`] : [])
        ].filter((text) => !ignored.some((pattern) => pattern.test(text)));
      } catch (error) { found = [`load: ${error instanceof Error ? error.message : String(error)}`]; }
      page.close();
      out.push({ route, ok: found.length === 0, problems: found });
    }
    return out;
  });
  if (parsed.json) console.log(JSON.stringify({ width, height, reports }, null, 2));
  else reports.forEach((report) => { console.log(`${report.ok ? 'ok  ' : 'FAIL'} ${report.route}`); report.problems.forEach((text) => console.log(`     ${text.split('\n')[0].slice(0, 200)}`)); });
  process.exit(reports.every((report) => report.ok) ? 0 : 1);
} catch (error) {
  console.error(error instanceof HarnessError ? `${error.code}: ${error.message}` : error);
  process.exit(2);
}
