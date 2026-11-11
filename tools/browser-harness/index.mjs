// @ts-check
/**
 * browser-harness — drive a static site in headless Chrome, with no dependencies and no browser download.
 *
 * It serves a directory on localhost, launches the Chrome already on the machine in a throwaway profile, and talks to it
 * over the DevTools protocol. Nothing here knows about any particular site: pass the root, what may be served, and any
 * source transforms. See README.md.
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * @typedef {'BAD_ROOT' | 'CHROME_NOT_FOUND' | 'CHROME_START' | 'TIMEOUT' | 'PAGE_THROW' | 'PROTOCOL' | 'NAVIGATION'} HarnessErrorCode
 *
 * @typedef {object} ServeRules
 * @property {string[]} [allowDotPaths] dot-named path segments that may be served, such as '.well-known'. All others are refused
 * @property {string[]} [denyPaths] root-relative prefixes to refuse
 *
 * @typedef {object} Transform
 * @property {string | RegExp} path a root-relative path, or a pattern tested against one
 * @property {(text: string, file: string) => string} apply rewrites the file as it is served; the file on disk is untouched
 *
 * @typedef {ServeRules & { root: string, transforms?: Transform[], chromePath?: string, noSandbox?: boolean, chromeArgs?: string[], timeoutMs?: number }} HarnessOptions
 *
 * @typedef {object} Problems
 * @property {string[]} exceptions uncaught exceptions and rejected promises
 * @property {string[]} consoleErrors console.error calls
 * @property {string[]} failedRequests responses of 400 and above, and requests that never completed
 *
 * @typedef {object} Page
 * @property {(route: string, options?: { timeoutMs?: number }) => Promise<void>} goto load a root-relative route and wait for the load event
 * @property {(expression: string) => Promise<any>} ev evaluate in the page, awaiting a promise; rejects if it throws
 * @property {(expression: string, options?: { timeoutMs?: number, intervalMs?: number }) => Promise<any>} waitFor poll until truthy and return the value
 * @property {(source: string) => Promise<void>} beforeLoad run a script before each new document's own scripts
 * @property {(width: number, height: number, options?: { mobile?: boolean, deviceScaleFactor?: number }) => Promise<void>} setViewport
 * @property {(file: string) => Promise<void>} screenshot write a PNG
 * @property {() => Problems} problems what has gone wrong since the page opened
 * @property {(method: string, params?: object) => Promise<any>} send a raw DevTools protocol call
 * @property {() => void} close
 *
 * @typedef {object} Harness
 * @property {string} baseUrl
 * @property {(route?: string) => Promise<Page>} open a new tab, listening before the first request
 * @property {() => Promise<void>} stop idempotent; kills Chrome and removes its profile
 */

export class HarnessError extends Error {
  /** @param {HarnessErrorCode} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = 'HarnessError';
    this.code = code;
  }
}

const MIME = /** @type {Record<string, string>} */ ({
  '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pdf': 'application/pdf'
});
const NEVER_SERVED = /^(\.git|\.env.*|\.npmrc|\.ssh|\.aws)$/;
const sleep = (/** @type {number} */ ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * The file a request may read, or null. Contains by real path, so a symlink cannot lead out of the root, and refuses every
 * dot-named segment unless it is allowed; `.git` and `.env` files are refused even then.
 * @param {string} root
 * @param {string} rawUrl
 * @param {ServeRules} [rules]
 * @returns {string | null}
 */
export function resolveRequest(root, rawUrl, { allowDotPaths = [], denyPaths = [] } = {}) {
  let pathname;
  try { pathname = decodeURIComponent(rawUrl.split(/[?#]/)[0]); } catch { return null; }
  if (pathname.includes('\0') || pathname.includes('\\')) return null;
  const realRoot = fs.realpathSync(root);
  const refused = (/** @type {string} */ file) => {
    const relative = path.relative(realRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return true;
    const parts = relative.split(path.sep).filter(Boolean);
    if (parts.some((part) => NEVER_SERVED.test(part))) return true;
    if (parts.some((part) => part.startsWith('.') && !allowDotPaths.includes(part))) return true;
    const posix = parts.join('/');
    return denyPaths.some((prefix) => posix === prefix || posix.startsWith(`${prefix.replace(/\/$/, '')}/`));
  };
  const candidate = path.resolve(realRoot, `.${pathname}`);
  if (refused(candidate)) return null;
  let real;
  try { real = fs.realpathSync(candidate); } catch { return null; }
  if (refused(real)) return null;
  if (fs.statSync(real).isDirectory()) {
    real = path.join(real, 'index.html');
    if (!fs.existsSync(real)) return null;
  }
  return real;
}

/**
 * Serve a directory on 127.0.0.1, on a free port.
 * @param {ServeRules & { root: string, transforms?: Transform[] }} options
 * @returns {Promise<{ server: http.Server, baseUrl: string }>}
 */
export function serve({ root, allowDotPaths = [], denyPaths = [], transforms = [] }) {
  const realRoot = fs.realpathSync(root);
  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { allow: 'GET, HEAD' }); response.end(); return; }
    const file = resolveRequest(realRoot, request.url || '/', { allowDotPaths, denyPaths });
    if (!file) { response.writeHead(404); response.end('not found'); return; }
    try {
      /** @type {string | Buffer} */
      let body = fs.readFileSync(file);
      const relative = path.relative(realRoot, file).split(path.sep).join('/');
      for (const transform of transforms) {
        const hit = typeof transform.path === 'string' ? transform.path === relative : transform.path.test(relative);
        if (hit) body = transform.apply(body.toString(), relative);
      }
      response.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(500); response.end('could not read'); }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = /** @type {import('node:net').AddressInfo} */ (server.address());
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

/**
 * The Chrome to use: an explicit path, $CHROME, or the first installed one.
 * @param {string} [explicit]
 * @returns {string}
 */
export function findChrome(explicit = process.env.CHROME) {
  if (explicit) {
    if (fs.existsSync(explicit)) return explicit;
    throw new HarnessError('CHROME_NOT_FOUND', `Chrome was not found at ${explicit}.`);
  }
  const absolute = /** @type {Record<string, string[]>} */ ({
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'],
    win32: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
  })[process.platform] || [];
  const found = absolute.find((file) => fs.existsSync(file));
  if (found) return found;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      const file = path.join(dir, name);
      if (dir && fs.existsSync(file)) return file;
    }
  }
  throw new HarnessError('CHROME_NOT_FOUND', 'No Chrome or Chromium was found. Install one, or set CHROME to its path.');
}

/* Harnesses still running, so an exit or an interrupt leaves no browser or profile behind. */
/** @type {Set<() => void>} */
const live = new Set();
let exitHooked = false;
function hookExit() {
  if (exitHooked) return;
  exitHooked = true;
  const sweep = () => { live.forEach((clean) => clean()); live.clear(); };
  process.once('exit', sweep);
  for (const [signal, code] of /** @type {[NodeJS.Signals, number][]} */ ([['SIGINT', 130], ['SIGTERM', 143]])) {
    process.once(signal, () => { sweep(); process.exit(code); });
  }
}

/**
 * @param {string} chromePath
 * @param {string} profile
 * @param {string[]} extra
 * @param {number} timeoutMs
 */
async function launchChrome(chromePath, profile, extra, timeoutMs) {
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', `--user-data-dir=${profile}`, '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--remote-debugging-port=0', ...extra, 'about:blank'];
  const chrome = spawn(chromePath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  /** @type {number | null} */
  let exited = null;
  chrome.stderr?.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-2000); });
  chrome.once('exit', (code) => { exited = code ?? -1; });
  chrome.once('error', (error) => { stderr = `${stderr}${error.message}`; exited = -1; });
  const portFile = path.join(profile, 'DevToolsActivePort');
  const deadline = Date.now() + timeoutMs;
  while (!fs.existsSync(portFile)) {
    if (exited !== null) throw new HarnessError('CHROME_START', `Chrome exited before opening its debugging port (code ${exited}). ${stderr.trim()}`);
    if (Date.now() > deadline) { chrome.kill('SIGKILL'); throw new HarnessError('CHROME_START', `Chrome did not open its debugging port within ${timeoutMs} ms.`); }
    await sleep(100);
  }
  await sleep(50);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
  return { chrome, devtools: `http://127.0.0.1:${port}` };
}

/**
 * @param {string} devtools
 * @param {string} baseUrl
 * @param {number} timeoutMs
 * @returns {Promise<Page>}
 */
async function openPage(devtools, baseUrl, timeoutMs) {
  const target = await (await fetch(`${devtools}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  /** @type {Map<number, { resolve: (value: any) => void, reject: (error: Error) => void }>} */
  const waiting = new Map();
  /** @type {Set<() => void>} */
  const loadWaiters = new Set();
  /** @type {Problems} */
  const problems = { exceptions: [], consoleErrors: [], failedRequests: [] };
  /** @type {Map<string, string>} */
  const requests = new Map();
  let id = 0;

  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const pending = waiting.get(message.id);
      if (!pending) return;
      waiting.delete(message.id);
      if (message.error) pending.reject(new HarnessError('PROTOCOL', message.error.message));
      else pending.resolve(message.result);
      return;
    }
    const params = message.params;
    if (message.method === 'Page.loadEventFired') { loadWaiters.forEach((done) => done()); loadWaiters.clear(); }
    else if (message.method === 'Runtime.exceptionThrown') problems.exceptions.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text);
    else if (message.method === 'Runtime.consoleAPICalled' && params.type === 'error') problems.consoleErrors.push(params.args.map((/** @type {any} */ arg) => arg.value ?? arg.description ?? '').join(' '));
    else if (message.method === 'Network.requestWillBeSent') requests.set(params.requestId, params.request.url);
    else if (message.method === 'Network.responseReceived' && params.response.status >= 400 && !/\/favicon\.ico$/.test(params.response.url)) problems.failedRequests.push(`${params.response.status} ${params.response.url}`);
    else if (message.method === 'Network.loadingFailed' && !params.canceled) problems.failedRequests.push(`${params.errorText} ${requests.get(params.requestId) || ''}`.trim());
  };
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new HarnessError('PROTOCOL', 'Could not connect to the page.'));
  });
  socket.onclose = () => { waiting.forEach(({ reject }) => reject(new HarnessError('PROTOCOL', 'The page closed.'))); waiting.clear(); };

  /** @type {Page['send']} */
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1;
    const current = id;
    const timer = setTimeout(() => { waiting.delete(current); reject(new HarnessError('TIMEOUT', `${method} did not answer within ${timeoutMs} ms.`)); }, timeoutMs);
    waiting.set(current, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id: current, method, params }));
  });
  await Promise.all([send('Page.enable'), send('Runtime.enable'), send('Network.enable')]);

  /** @type {Page['ev']} */
  const ev = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new HarnessError('PAGE_THROW', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };

  return {
    send, ev,
    goto: async (route, { timeoutMs: limit = timeoutMs } = {}) => {
      /** @type {() => void} */
      let settle = () => {};
      const loaded = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { loadWaiters.delete(settle); reject(new HarnessError('TIMEOUT', `${route} did not finish loading within ${limit} ms.`)); }, limit);
        settle = () => { clearTimeout(timer); resolve(undefined); };
        loadWaiters.add(settle);
      });
      const result = await send('Page.navigate', { url: new URL(route, baseUrl).href });
      if (result.errorText) { loadWaiters.delete(settle); settle(); throw new HarnessError('NAVIGATION', `${route}: ${result.errorText}`); }
      if (!result.loaderId) { loadWaiters.delete(settle); settle(); return; }
      await loaded;
    },
    waitFor: async (expression, { timeoutMs: limit = timeoutMs, intervalMs = 100 } = {}) => {
      const deadline = Date.now() + limit;
      /** @type {unknown} */
      let lastError = null;
      while (Date.now() < deadline) {
        try {
          const value = await ev(expression);
          if (value) return value;
          lastError = null;
        } catch (error) { lastError = error; }
        await sleep(intervalMs);
      }
      throw new HarnessError('TIMEOUT', `Still not true after ${limit} ms: ${expression}${lastError instanceof Error ? ` (last error: ${lastError.message})` : ''}`);
    },
    beforeLoad: async (source) => { await send('Page.addScriptToEvaluateOnNewDocument', { source }); },
    setViewport: async (width, height, { mobile = false, deviceScaleFactor = 1 } = {}) => { await send('Emulation.setDeviceMetricsOverride', { width, height, mobile, deviceScaleFactor }); },
    screenshot: async (file) => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(data, 'base64')); },
    problems: () => ({ exceptions: [...problems.exceptions], consoleErrors: [...problems.consoleErrors], failedRequests: [...problems.failedRequests] }),
    close: () => socket.close()
  };
}

/**
 * Start a server and a browser. Call stop() when done, or use withHarness.
 * @param {HarnessOptions} options
 * @returns {Promise<Harness>}
 */
export async function startHarness({ root, allowDotPaths, denyPaths, transforms, chromePath, noSandbox = process.env.HARNESS_NO_SANDBOX === '1', chromeArgs = [], timeoutMs = 30000 }) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new HarnessError('BAD_ROOT', `${root} is not a directory.`);
  const executable = findChrome(chromePath);
  const { server, baseUrl } = await serve({ root, allowDotPaths, denyPaths, transforms });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-harness-'));
  const closeServer = () => { server.close(); server.closeAllConnections(); };
  const removeProfile = () => { try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 200 }); } catch { /* the OS clears its temp directory */ } };
  let launched;
  try {
    launched = await launchChrome(executable, profile, [...(noSandbox ? ['--no-sandbox'] : []), ...chromeArgs], timeoutMs);
  } catch (error) { closeServer(); removeProfile(); throw error; }
  const { chrome, devtools } = launched;
  const sweep = () => { chrome.kill('SIGKILL'); removeProfile(); };
  hookExit();
  live.add(sweep);
  let stopped = false;
  return {
    baseUrl,
    open: async (route) => {
      const page = await openPage(devtools, baseUrl, timeoutMs);
      if (route) await page.goto(route);
      return page;
    },
    stop: async () => {
      if (stopped) return;
      stopped = true;
      live.delete(sweep);
      closeServer();
      if (chrome.exitCode === null) {
        const gone = new Promise((resolve) => { chrome.once('exit', resolve); });
        chrome.kill();
        await Promise.race([gone, sleep(3000)]);
        if (chrome.exitCode === null) chrome.kill('SIGKILL');
      }
      removeProfile();
    }
  };
}

/**
 * Start a harness, run a function with it, and always stop it.
 * @template T
 * @param {HarnessOptions} options
 * @param {(harness: Harness) => Promise<T>} work
 * @returns {Promise<T>}
 */
export async function withHarness(options, work) {
  const harness = await startHarness(options);
  try { return await work(harness); } finally { await harness.stop(); }
}
