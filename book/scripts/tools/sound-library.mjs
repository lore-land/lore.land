#!/usr/bin/env node
/**
 * sound-library.mjs — fetch the open sounds named in book/content/sound-library.json (npm run sounds:fetch).
 *
 * Everything lands in sound-library/ (git-ignored): raw sources are large and stay out of the published site; a sound
 * reaches the game only as a trimmed, encoded file chosen for an event (see .spw/surfaces/sound-and-voice.spw).
 *
 *   kenney   each pack's page is read first and must say its license (licenseCheck) before its zip is fetched; the
 *            signed download link is asked for the way the page's own button asks; each zip is unpacked into its
 *            own empty folder. Nothing downloaded is run.
 *   vcsl     the files of each named folder at the pinned commit, from raw.githubusercontent.com, plus the LICENSE.
 *
 * A file already present at its size is not fetched again. sound-library/INDEX.json lists every file with its source,
 * license and category. --only=kenney|vcsl limits a run; --dry lists what would be fetched.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const MANIFEST = JSON.parse(readFileSync(resolve(ROOT, 'book/content/sound-library.json'), 'utf8'));
const OUT = resolve(ROOT, MANIFEST.root);
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';
const DRY = process.argv.includes('--dry');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const JAR = resolve(OUT, '.cookies');

const curl = (args, opts = {}) => execFileSync('curl', ['-sSL', '--fail', '--max-time', '600', '-A', UA, ...args], { maxBuffer: 64 * 1024 * 1024, ...opts });
const run = promisify(execFile);
/* A file fetched in the background, tried three times: a long download can drop. */
const fetchTo = async (url, dest) => {
  for (let attempt = 1; ; attempt += 1) {
    try { await run('curl', ['-sSL', '--fail', '--max-time', '600', '-A', UA, '-o', dest, url]); return; } catch (err) {
      if (attempt >= 3) throw new Error(`${url}: ${String(err.stderr || err.message).trim()}`);
    }
  }
};
const say = (msg) => console.log(`[sounds] ${msg}`);
const index = [];
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));

async function kenney(source) {
  const base = resolve(OUT, 'kenney');
  for (const pack of source.packs) {
    const dir = resolve(base, pack.slug);
    const page = `https://kenney.nl/assets/${pack.slug}`;
    if (existsSync(dir) && readdirSync(dir).length) {
      say(`kenney/${pack.slug}: already here`);
    } else {
      // The page must say its license before anything is taken from it.
      const html = curl(['-c', JAR, page]).toString();
      if (!html.includes(source.licenseCheck)) throw new Error(`${page} does not say ${source.licenseCheck}; not fetched`);
      const id = (html.match(/data-download-id=['"]([0-9a-f]+)['"]/) || [])[1];
      if (!id) throw new Error(`${page}: no download id`);
      if (DRY) { say(`would fetch kenney/${pack.slug}`); continue; }
      const link = JSON.parse(curl(['-b', JAR, '-c', JAR, '-H', `Referer: ${page}`, `https://kenney.nl/download-link/${id}`]).toString()).url;
      if (!link) throw new Error(`${page}: no signed link`);
      const zip = resolve(base, `${pack.slug}.zip`);
      mkdirSync(base, { recursive: true });
      curl(['-b', JAR, '-o', zip, link]);
      mkdirSync(dir, { recursive: true });
      execFileSync('unzip', ['-q', '-o', zip, '-d', dir]);
      rmSync(zip);
      say(`kenney/${pack.slug}: fetched`);
    }
    walk(dir).forEach((f) => index.push({ file: relative(OUT, f), source: 'kenney', pack: pack.slug, page, license: source.license, author: source.author, category: pack.category }));
  }
}

async function vcsl(source) {
  const base = resolve(OUT, 'vcsl');
  const raw = (path) => `https://raw.githubusercontent.com/${source.repo}/${source.commit}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const tree = JSON.parse(curl([`https://api.github.com/repos/${source.repo}/git/trees/${source.commit}?recursive=1`]).toString());
  if (tree.truncated) throw new Error('the VCSL tree came back truncated');
  const blobs = tree.tree.filter((e) => e.type === 'blob');
  const wanted = [...blobs.filter((e) => e.path === 'LICENSE'), ...source.folders.flatMap((f) => {
    const files = blobs.filter((e) => e.path.startsWith(`${f.path}/`));
    if (!files.length) throw new Error(`VCSL has no folder ${f.path} at ${source.commit}`);
    return files.map((e) => ({ ...e, folder: f }));
  })];
  const total = wanted.reduce((s, e) => s + (e.size || 0), 0);
  say(`vcsl: ${wanted.length} files, ${(total / 1e6).toFixed(1)} MB at ${source.commit.slice(0, 7)}`);
  if (DRY) return;
  let done = 0; let fetched = 0;
  const queue = [...wanted];
  const worker = async () => {
    while (queue.length) {
      const e = queue.shift();
      const dest = resolve(base, e.path);
      if (!(existsSync(dest) && statSync(dest).size === e.size)) {
        mkdirSync(dirname(dest), { recursive: true });
        await fetchTo(raw(e.path), dest);
        fetched += 1;
      }
      done += 1;
      if (done % 50 === 0) say(`vcsl: ${done} of ${wanted.length}`);
      index.push({ file: relative(OUT, dest), source: 'vcsl', page: `https://github.com/${source.repo}/blob/${source.commit}/${e.path}`, license: source.license, author: source.author, category: e.folder?.category || 'license', why: e.folder?.why });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  say(`vcsl: ${fetched} fetched, ${wanted.length - fetched} already here`);
}

mkdirSync(OUT, { recursive: true });
for (const source of MANIFEST.sources) {
  if (ONLY && source.id !== ONLY) continue;
  if (source.license && !MANIFEST.policy.allowed.includes(source.license)) throw new Error(`${source.id}: ${source.license} is not an allowed license`);
  if (source.id === 'kenney') await kenney(source);
  if (source.id === 'vcsl') await vcsl(source);
}
if (existsSync(JAR)) rmSync(JAR);
if (!DRY) {
  const prior = existsSync(resolve(OUT, 'INDEX.json')) ? JSON.parse(readFileSync(resolve(OUT, 'INDEX.json'), 'utf8')).files || [] : [];
  const files = [...prior.filter((p) => !index.some((i) => i.file === p.file) && existsSync(resolve(OUT, p.file))), ...index].sort((a, b) => a.file.localeCompare(b.file));
  writeFileSync(resolve(OUT, 'INDEX.json'), `${JSON.stringify({ about: 'Every file in sound-library/, where it came from and its license. Written by npm run sounds:fetch from book/content/sound-library.json.', files }, null, 2)}\n`);
  say(`INDEX.json: ${files.length} files`);
}
