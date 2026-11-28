// @ts-check
/**
 * vite-spw-live.mjs — the .spw tree, live under `npm run dev`.
 *
 * Every saved .spw file under .spw/ (not the mounted workbench) is read by the workbench parser the page itself uses
 * (book/scripts/vendor/spw-seed.mjs, prose profile, no rule trace), and the dev server says how it read in the terminal:
 * whole, or where it falls back to prose, or that spw:lint --strict would fail it. The page hears the same over Vite's
 * socket; spw-live.mjs hands the new text to whichever reader took that surface (the lanes' rules, the chapter levels,
 * the bias registers…), so a tuning is tried by saving the file, with no reload and no rebuild. A draft that does not
 * read whole is reported and not handed on. A small note in the corner of the page says what happened and who took it.
 *
 * Dev only (apply: 'serve'): nothing here reaches `vite build`, dist, or the raw-ESM site on main. It reads and
 * never writes; the workbench's own `spw dev` watcher formats files in place, which is why this is not that.
 */
import { readFile, stat } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const CLIENT_ID = '/@spw-live';
const RESOLVED = '\0spw-live';
const EVENT = 'spw:surface';
const MAX_SOURCE = 512 * 1024;
const MAX_ISSUES = 5;

/**
 * Whether a changed file is a surface this watches: a .spw under .spw/, outside the mounted workbench.
 * @param {string} rel repo-relative, forward slashes
 */
export const watches = (rel) => rel.startsWith('.spw/') && rel.endsWith('.spw') && !rel.startsWith('.spw/_workbench/');

/**
 * How a source reads, as the page and spw:lint would read it.
 * @param {{ parse: (text: string, options?: Record<string, unknown>) => any }} seed
 * @param {string} source
 */
export function readSurface(seed, source) {
  const started = performance.now();
  const result = seed.parse(source, { lexProfile: 'prose', eventPolicy: 'diagnostics' });
  const ms = Math.round((performance.now() - started) * 10) / 10;
  const complete = Boolean(result?.completeness?.complete);
  const proseFallback = Boolean(result?.completeness?.proseFallback);
  /** @param {'error' | 'warning'} kind */
  const issue = (kind) => (/** @type {any} */ e) => ({ line: e?.position?.line ?? 0, column: e?.position?.column ?? 0, message: String(e?.data?.message ?? kind), kind });
  const issues = [...(result?.errors || []).map(issue('error')), ...(result?.warnings || []).map(issue('warning'))].slice(0, MAX_ISSUES);
  return {
    whole: Boolean(result?.success) && complete && !proseFallback,
    lintFails: !result?.success || (result?.errors?.length ?? 0) > 0,
    complete,
    proseFallback,
    issues,
    ms
  };
}

/** @returns {import('vite').Plugin} */
export function spwLive() {
  /** @type {Promise<any> | null} */
  let seedPromise = null;
  let seedStamp = 0;
  return {
    name: 'lore-spw-live',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      const logger = server.config.logger;
      const bundle = resolve(root, 'book/scripts/vendor/spw-seed.mjs');
      // A rebundled parser (a workbench bump while the server runs) is picked up on the next save.
      const loadSeed = async () => {
        const stamp = (await stat(bundle)).mtimeMs;
        if (!seedPromise || stamp !== seedStamp) {
          seedStamp = stamp;
          seedPromise = import(`${pathToFileURL(bundle).href}?t=${stamp}`);
        }
        return seedPromise;
      };
      /** @param {string} file */
      const check = async (file) => {
        const rel = relative(root, file).split(sep).join('/');
        if (!watches(rel)) return;
        let source;
        try {
          source = await readFile(file, 'utf8');
        } catch {
          return;
        }
        let read;
        try {
          read = readSurface(await loadSeed(), source);
        } catch (error) {
          logger.warn(`spw  ${rel} could not be read: ${error instanceof Error ? error.message : error}`, { timestamp: true });
          return;
        }
        const first = read.issues[0];
        const where = first ? ` at ${first.line}:${first.column} (${first.message})` : '';
        if (read.whole) logger.info(`spw  ${rel} reads whole · ${read.ms} ms`, { timestamp: true });
        else logger.warn(`spw  ${rel} ${read.proseFallback ? 'falls back to prose' : 'does not read whole'}${where}${read.lintFails ? ' · spw:lint --strict would fail it' : ''}`, { timestamp: true });
        server.ws.send({ type: 'custom', event: EVENT, data: { path: `/${rel}`, source: source.length <= MAX_SOURCE ? source : null, ...read } });
      };
      server.watcher.add(resolve(root, '.spw'));
      server.watcher.on('change', check);
      server.watcher.on('add', check);
    },
    resolveId(id) {
      return id === CLIENT_ID ? RESOLVED : undefined;
    },
    load(id) {
      return id === RESOLVED ? CLIENT : undefined;
    },
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { type: 'module', src: CLIENT_ID }, injectTo: 'head' }];
    }
  };
}

/* The page's side, served only by the dev server: pass the news on as a DOM event (spw-live.mjs), then say what
 * came of it in a corner note. Readers answer synchronously by name (taken: read again, kept: kept what they had). */
const CLIENT = `
const SURFACE_EVENT = 'lore:spw-surface';
let note = null;
let quiet = 0;
const say = (detail) => {
  if (!document.body) return;
  if (!note) {
    note = document.createElement('output');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.dataset.spwLive = '';
    note.title = 'npm run dev: a saved .spw surface, read by the workbench parser (click to close)';
    note.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;max-width:min(40rem,calc(100vw - 24px));padding:8px 12px;border-radius:8px;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#f5efde;background:rgba(18,21,31,.94);border:1px solid #4f9a98;box-shadow:0 6px 24px rgba(0,0,0,.35);white-space:pre-wrap;cursor:pointer';
    note.addEventListener('click', () => { note.hidden = true; });
    document.body.append(note);
  }
  const name = detail.path.split('/').pop();
  const first = detail.issues[0];
  const lines = [];
  if (detail.whole) {
    lines.push(name + ' reads whole · ' + detail.ms + ' ms');
    lines.push(detail.taken.length ? 'read again by ' + detail.taken.join(', ') : 'nothing on this page reads it');
  } else {
    lines.push(name + (detail.proseFallback ? ' falls back to prose' : ' does not read whole') + (first ? ' at ' + first.line + ':' + first.column : ''));
    if (first) lines.push(first.message);
    lines.push(detail.kept.length ? 'kept as it was by ' + detail.kept.join(', ') : 'nothing on this page reads it');
  }
  note.textContent = lines.join('\\n');
  note.style.borderColor = detail.whole ? '#4f9a98' : '#d9a24a';
  note.hidden = false;
  clearTimeout(quiet);
  if (detail.whole) quiet = setTimeout(() => { note.hidden = true; }, 4000);
};
if (import.meta.hot) {
  import.meta.hot.on('${EVENT}', (data) => {
    const detail = { ...data, taken: [], kept: [] };
    window.dispatchEvent(new CustomEvent(SURFACE_EVENT, { detail }));
    say(detail);
  });
}
`;
