#!/usr/bin/env node
/**
 * Trope-prompt generator — an ideation aid for authors, not a content
 * generator. Pulls together material that's already written but scattered
 * and un-indexed by chamber in .spw/surfaces/plates.spw (domain
 * constellations, idiomarium phrases, the peripheral-field word banks,
 * plate_shelf's trope triple) into one prompt card for a given chamber.
 *
 * Also proposes a concrete authoring syntax for data-trope/data-motif/
 * data-foreshadow — CSS exists for these (book/styles/components/motifs.css)
 * but no chapter has ever used them (AL-010: "kept as a declared
 * content-annotation hook until chapter JSON either adopts or formally
 * retires them"). This tool assumes adoption; it doesn't touch content.
 *
 * Usage: node .spw/tools/trope-prompt.mjs <chamber-number>
 *   node .spw/tools/trope-prompt.mjs 02
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PLATES_PATH = path.join(ROOT, '.spw', 'surfaces', 'plates.spw');
const chamber = (process.argv[2] || '').padStart(2, '0');

if (!/^\d{2}$/.test(chamber)) {
  console.error('[trope-prompt] usage: node .spw/tools/trope-prompt.mjs <chamber-number>  (e.g. 02)');
  process.exit(1);
}

const text = fs.readFileSync(PLATES_PATH, 'utf8');
const n = Number(chamber);

/* plate_shelf: { NN: "trope / trope / trope"  status: x  anchor: "y" } */
function readShelfEntry() {
  const re = new RegExp(`\\{\\s*${chamber}:\\s*"([^"]*)"\\s*status:\\s*(\\S+)\\s*anchor:\\s*"([^"]*)"\\s*\\}`);
  const m = text.match(re);
  return m ? { tropes: m[1].split('/').map((s) => s.trim()), status: m[2], anchor: m[3] } : null;
}

/* &name{ domains: [...] chambers: [...] recurring_forms: [...] ask: "..." } */
function readConstellations() {
  const re = /&(\w+)\{\s*domains:\s*\[([^\]]*)\]\s*chambers:\s*\[([^\]]*)\]\s*recurring_forms:\s*\[([^\]]*)\]\s*ask:\s*"([^"]*)"\s*\}/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) {
    const chambers = m[3].split(',').map((s) => Number(s.trim()));
    if (chambers.includes(n)) {
      hits.push({
        name: m[1],
        domains: m[2].split(',').map((s) => s.trim()),
        recurringForms: m[4].split(',').map((s) => s.trim()),
        ask: m[5]
      });
    }
  }
  return hits;
}

/* ^idiom["label"]{ phrase: "..." read: "..." use: [...] | "..." } */
function readIdioms() {
  const re = /\^idiom\["([^"]*)"\]\{\s*phrase:\s*"([^"]*)"\s*read:\s*"([^"]*)"\s*use:\s*(\[[^\]]*\]|"[^"]*")\s*\}/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) {
    const useRaw = m[4];
    const appliesToChamber = useRaw.startsWith('[')
      ? useRaw.slice(1, -1).split(',').map((s) => Number(s.trim())).includes(n)
      : true; // string form ("every production gate") applies everywhere
    if (appliesToChamber) {
      hits.push({ label: m[1], phrase: m[2], read: m[3] });
    }
  }
  return hits;
}

/* ~<"peripheral_field">{ list_name: [a, b, c, ...] ... } — pick one item
   per list as a cross-suggestion, deterministically by chamber number so
   re-runs are stable rather than random. */
function readPeripheralPick() {
  const block = text.match(/~<"peripheral_field">\{([\s\S]*?)\n\}/);
  if (!block) return null;
  const lists = {};
  const re = /(\w+):\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(block[1]))) {
    lists[m[1]] = m[2].split(',').map((s) => s.trim()).filter(Boolean);
  }
  const pick = {};
  for (const [name, items] of Object.entries(lists)) {
    if (items.length) pick[name] = items[n % items.length];
  }
  return pick;
}

const shelf = readShelfEntry();
const constellations = readConstellations();
const idioms = readIdioms();
const peripheral = readPeripheralPick();

if (!shelf) {
  console.error(`[trope-prompt] no plate_shelf entry found for chamber ${chamber}`);
  process.exit(1);
}

console.log(`\n— Chamber ${chamber} · anchor: ${shelf.anchor} · scene status: ${shelf.status} —\n`);

console.log('Trope triple (plate_shelf):');
console.log(`  ${shelf.tropes.join(' / ')}\n`);

if (constellations.length) {
  console.log('Domain crossings this chamber already belongs to:');
  constellations.forEach((c) => {
    console.log(`  &${c.name} — ${c.domains.join(', ')}`);
    console.log(`    recurring forms: ${c.recurringForms.join(', ')}`);
    console.log(`    ask: "${c.ask}"`);
  });
  console.log('');
}

if (idioms.length) {
  console.log('Idiomarium phrases tagged for this chamber:');
  idioms.forEach((i) => {
    console.log(`  "${i.label}" — ${i.phrase}`);
    console.log(`    ${i.read}`);
  });
  console.log('');
}

if (peripheral && Object.keys(peripheral).length) {
  console.log('One peripheral-field cross to try (deterministic pick, not prescriptive):');
  Object.entries(peripheral).forEach(([list, item]) => console.log(`  ${list}: ${item}`));
  console.log('');
}

console.log('Proposed authoring syntax (data-trope/data-motif/data-foreshadow are dormant — CSS');
console.log('exists, no chapter has used them yet; AL-010 flags them for retirement if that stays');
console.log('true). Same shape as the already-live data-mood convention:\n');
console.log('  {');
console.log('    "type": "custom-boonberry",');
console.log(`    "data-motif": "${shelf.tropes[0] || 'motif-name'}",`);
console.log('    "content": [ { "type": "paragraph", "text": "..." } ]');
console.log('  }\n');
console.log('This tool only prompts — it does not write chapter content. Applying a mark is an');
console.log('editorial choice; run this again after a revision to see what still resonates.\n');
