# browser-harness

Drive a static site in headless Chrome. No dependencies, no browser download, no build step: one file of plain JavaScript that uses the Chrome already on your machine.

Requires Node 22 or later and Chrome or Chromium.

## When to use it

Use it for a site that is files on disk, when you want to load real pages and fail on real errors without adding a dependency tree. It suits a hand-built site, a static export, or a project where installing a browser automation stack is more than the job is worth.

Use [Playwright](https://playwright.dev) instead if you need Firefox or WebKit, parallel workers, tracing, or a rich locator API. This tool drives Chrome only and runs one thing at a time.

## From the command line

```sh
node cli.mjs --root ./public --route / --route /about/ --width 390
```

Each route is loaded and watched for uncaught exceptions, `console.error`, failed requests, and sideways overflow. It exits 0 if every route is clean, 1 if any is not, and 2 if it could not run. `--json` prints a report, `--ignore <regex>` filters known noise, and `--help` lists the rest.

## From code

```js
import { withHarness } from './index.mjs';

await withHarness({ root: './public' }, async (harness) => {
  const page = await harness.open();
  await page.setViewport(390, 800, { mobile: true });
  await page.beforeLoad(`localStorage.setItem('returning', '1')`);
  await page.goto('/');
  await page.waitFor(`document.querySelector('.ready')`);
  console.log(await page.ev('document.title'), page.problems());
  page.close();
});
```

`open(route?)` starts listening before the first request, so errors during load are caught. `ev` rejects if the page throws. `waitFor` polls an expression until it is truthy and rejects on timeout. `send` is the raw DevTools protocol, for anything else.

### Test hooks without changing your code

A transform rewrites a file as it is served and leaves the file on disk alone, so a test can reach a module's internals and the repository carries no test hook:

```js
withHarness({
  root: '.',
  transforms: [{ path: 'js/game.mjs', apply: (text) => `${text}\nwindow.__game = state;` }]
}, run);
```

## What it will and won't serve

The server listens on 127.0.0.1 only, on a free port, and answers only GET and HEAD.

A request is contained by real path, so neither `..` nor a symlink can lead out of the root. Every dot-named path segment is refused unless you list it in `allowDotPaths`, and `.git`, `.env*`, `.npmrc`, `.ssh` and `.aws` are refused even then. `denyPaths` refuses root-relative prefixes.

Chrome runs in a throwaway profile, removed on `stop()`, on normal exit, and on SIGINT or SIGTERM. The sandbox stays on unless you pass `--no-sandbox` or set `HARNESS_NO_SANDBOX=1`, which some containers need.

The harness runs whatever scripts your pages contain, in a real browser with network access. Point it at code you trust.

## Tests

```sh
node --test "test/*.test.mjs"
```

The containment and server tests need no browser. The browser tests skip if Chrome isn't installed.
