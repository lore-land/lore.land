// @ts-check
/**
 * trope-wiring.mjs — reads a crossing's `wired` string (book/content/world/tropes.json) and says what in it does not
 * resolve. book-check runs it over every crossing.
 *
 * A wired string names where a crossing is built: hops along one way, and ways side by side.
 *
 *   wired := way ( " ; " way )*      way := hop ( " → " hop )*      hop := [file] name* [(gloss)]
 *
 * A file is a basename the tree has once (book/scripts/home, book/scripts/modules, book/content/world). A hop with no
 * file is in the file before it. Every hop names something:
 *   in a .mjs file, a declaration of that name (function, const, let, var, class); NAME[key] imports the module and
 *     needs the key on that export (INTRO[boon]);
 *   in references.json, an entry id, and the entry has a track: a margin a crossing runs through is a tracked one;
 *   in another .json file, a key it has.
 * A one-word gloss is held too: on references.json it is the deed the entry's track counts, on a .mjs file a word the
 * file uses. A gloss of several words is a note and is not read.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** Where a wired file may live. */
export const WIRED_DIRS = Object.freeze(['book/scripts/home', 'book/scripts/modules', 'book/content/world']);

/** @type {Map<string, string>} */
const texts = new Map();
const textOf = (/** @type {string} */ rel) => {
  if (!texts.has(rel)) texts.set(rel, readFileSync(resolve(ROOT, rel), 'utf8'));
  return /** @type {string} */ (texts.get(rel));
};
/** @type {Map<string, Promise<any>>} */
const modules = new Map();
const moduleOf = (/** @type {string} */ rel) => {
  if (!modules.has(rel)) modules.set(rel, import(pathToFileURL(resolve(ROOT, rel)).href).catch(() => null));
  return /** @type {Promise<any>} */ (modules.get(rel));
};
const escape = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The files a basename names under WIRED_DIRS. @param {string} base */
export const wiredFiles = (base) => WIRED_DIRS.map((dir) => `${dir}/${base}`).filter((rel) => existsSync(resolve(ROOT, rel)));

/** Whether a .mjs source declares a name. @param {string} text @param {string} name */
export const declares = (text, name) => new RegExp(`(?:^|[\\s;{(,])(?:export\\s+)?(?:async\\s+)?(?:function\\*?\\s+${escape(name)}\\b|(?:const|let|var|class)\\s+${escape(name)}\\b)`, 'm').test(text);

const HOP = /^(?:([\w.-]+\.(?:mjs|json))\s*)?((?:[A-Za-z_$][\w$-]*(?:\[[\w-]+\])?\s*)*)(?:\(([^)]*)\))?$/;
const ONE_WORD = /^[A-Za-z_][\w-]*$/;

/**
 * A wired string read into ways of hops. null for a hop it cannot read.
 * @param {string} wired
 * @returns {Array<Array<{ file: string, names: Array<{ name: string, key: string }>, gloss: string, raw: string } | null>>}
 */
export function readWired(wired) {
  return String(wired || '').split(/\s+;\s+/).map((way) => {
    let file = '';
    return way.split(/\s*→\s*/).map((raw) => {
      const m = HOP.exec(raw.trim());
      if (!m) return null;
      if (m[1]) file = m[1];
      const names = [...(m[2] || '').matchAll(/([A-Za-z_$][\w$-]*)(?:\[([\w-]+)\])?/g)].map((n) => ({ name: n[1], key: n[2] || '' }));
      return { file, names, gloss: (m[3] || '').trim(), raw: raw.trim() };
    });
  });
}

/**
 * What in a wired string does not resolve, in words; [] when every hop names something that is there.
 * @param {string} wired
 * @returns {Promise<string[]>}
 */
export async function wiredProblems(wired) {
  /** @type {string[]} */
  const problems = [];
  const references = JSON.parse(textOf('book/content/world/references.json')).entries || [];
  for (const way of readWired(wired)) {
    for (const hop of way) {
      if (!hop) { problems.push(`a hop in "${wired}" cannot be read as file, names and a gloss`); continue; }
      if (!hop.file) { problems.push(`"${hop.raw}" is in no file`); continue; }
      const found = wiredFiles(hop.file);
      if (found.length !== 1) { problems.push(`${hop.file} ${found.length ? 'is more than one file' : 'is not a file in the tree'}`); continue; }
      const rel = found[0];
      if (!hop.names.length) { problems.push(`"${hop.raw}" names nothing in ${hop.file}`); continue; }
      const oneWordGloss = ONE_WORD.test(hop.gloss) ? hop.gloss : '';
      if (rel.endsWith('references.json')) {
        for (const { name } of hop.names) {
          const entry = references.find((/** @type {{ id: string }} */ e) => e.id === name);
          if (!entry) problems.push(`references.json has no entry ${name}`);
          else if (!entry.track) problems.push(`references.json ${name} has no track: a margin a crossing runs through is tracked`);
          else if (oneWordGloss && entry.track.after?.count !== oneWordGloss) problems.push(`references.json ${name} counts ${entry.track.after?.count || 'nothing'}, not ${oneWordGloss}`);
        }
        continue;
      }
      const text = textOf(rel);
      if (rel.endsWith('.json')) {
        hop.names.forEach(({ name }) => { if (!text.includes(`"${name}"`)) problems.push(`${hop.file} has no key ${name}`); });
        continue;
      }
      for (const { name, key } of hop.names) {
        if (!declares(text, name)) { problems.push(`${hop.file} declares no ${name}`); continue; }
        if (key) {
          const mod = await moduleOf(rel);
          const value = mod?.[name];
          if (!mod) problems.push(`${hop.file} cannot be read here to find ${name}[${key}]`);
          else if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)) problems.push(`${hop.file} ${name} has no ${key}`);
        }
      }
      if (oneWordGloss && !new RegExp(`\\b${escape(oneWordGloss)}\\b`).test(text)) problems.push(`${hop.file} never uses ${oneWordGloss}`);
    }
  }
  return problems;
}
