#!/usr/bin/env node
/**
 * sigil-audit.mjs — the chapter-by-chapter, sigil-by-sigil audit plan, grounded in counts.
 *
 *   node .spw/tools/sigil-audit.mjs        (npm run spw:sigil-audit)
 *
 * Writes .spw/audits/sigil-chapter-audit.spw: for every chapter, its rooms by sigil and container
 * (room signatures), the wonders first met there by kind, its strongest materials and the harmonies
 * that tell it; for every sigil, the rooms that move by it and the questions an audit of components,
 * creatures, ecology and interaction semantics should ask of it. The counts are the baseline; the
 * questions are the plan; each pass of the audit moves one cell from seed to checked.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = async (p) => JSON.parse(await readFile(resolve(ROOT, p), 'utf8'));
const pad = (n) => String(n).padStart(2, '0');

const ROLES = Object.freeze({
  '?': 'probe', '~': 'potential', '@': 'perspective', '&': 'confluence', '*': 'value', '^': 'integration',
  '!': 'action', '#': 'annotation', '.': 'ground', '=': 'config', '%': 'measure', '$': 'substrate'
});
const CONTAINERS = Object.freeze({ '[': 'window', '{': 'room', '(': 'gathering', '<': 'passage' });

/* What an audit asks of each sigil, in each of the four lenses. */
const QUESTIONS = Object.freeze({
  probe: { components: 'every place that asks the reader something says what an answer does', creatures: 'which wonders are questions (the Egg is one, never answered)', ecology: 'what in the land is still undecided, and is it allowed to stay so', interaction: 'a probe never commits anything: hovering, peeking, asking' },
  potential: { components: 'what lasts a while shows how long (timers, glows, tellings that may turn)', creatures: 'gifts that last (lit, lag, unkept) name their giver', ecology: 'what is held in reserve: berries under snow, a wish unspent', interaction: 'nothing potential is lost on a reload unless it was meant to fade' },
  perspective: { components: 'whose eyes a component speaks from is visible (voices, doorplates @keeper)', creatures: 'who watches whom: the stag unseen, the figure noticed', ecology: 'Boof by nose, the ants by street, the city by glass', interaction: 'a reader can always tell whose view they are in' },
  confluence: { components: 'where two things merge, both stay readable (combines, carries, palettes)', creatures: 'wonders that only work together', ecology: 'harmonies: what keeps what', interaction: 'a merge is reversible or says it is not' },
  value: { components: 'what can be kept is shown as kept (cards, wonders, palettes)', creatures: 'each creature has a card and a spell', ecology: 'what the land treasures without owning', interaction: 'keeping something never costs the reader anything they did not choose' },
  integration: { components: 'what binds upward says where it goes (^card, ^projects, ^upstream)', creatures: 'gifts that turn a card or change a chapter', ecology: 'how small things add up to a season', interaction: 'every integration leaves a mark the reader can find' },
  action: { components: 'every action is a control a hand can reach, and says what it did (settle)', creatures: 'knocks, honks, foils: what happens at once', ecology: 'storms, bursts, a bag of flour', interaction: 'no action is irreversible without a warning' },
  annotation: { components: 'what is said is legible on every cover (contrast), never only on hover', creatures: 'each wonder says one line of its own', ecology: 'sayings: rules the makers keep', interaction: 'a note can be copied and travels with its origin (#from)' },
  ground: { components: 'what a component stands on is stable (rooms, chapters, plates)', creatures: 'where each creature lives (.at, first chapter)', ecology: 'the field, the lanes, the gate: places before plots', interaction: 'a link to a place lands in the right room' },
  config: { components: 'every tuning shows its range and its default (the desk)', creatures: 'how a creature can be retuned for a visit', ecology: 'the lean among fairy tale, absurd reality and low magic', interaction: 'a reader setting is kept; a visit setting is said to be for the visit' },
  measure: { components: 'what is counted is shown as counted, never as a score to chase', creatures: 'what each knock and gift costs, in the game own numbers', ecology: 'how much of each material a chapter holds', interaction: 'measures are recorded, never set by a link' },
  substrate: { components: 'what a component is made of shows in its tokens (materials)', creatures: 'which material each creature belongs to', ecology: 'glass, flour, berry, frost, ink, brass, steam, oak', interaction: 'a material sounds and looks like itself (spell textures)' }
});

async function main() {
  const almanac = await read('book/content/world/almanac.json');
  const semantic = await read('book/content/semantic.json');
  let harmonies = { harmonies: [] };
  try { harmonies = await read('book/content/world/harmonies.json'); } catch { /* optional */ }
  const edges = harmonies.harmonies || harmonies.edges || [];
  const chapters = [];
  for (let n = 1; n <= 15; n += 1) {
    let data;
    try { data = await read(`book/content/chapters/${pad(n)}.json`); } catch { continue; }
    const rooms = (data.sections || []).map((s) => s.room?.spw).filter(Boolean);
    const sigils = {};
    const containers = {};
    rooms.forEach((sig) => {
      const op = sig[0];
      const open = [...sig].find((ch) => CONTAINERS[ch]);
      sigils[op] = (sigils[op] || 0) + 1;
      if (open) containers[CONTAINERS[open]] = (containers[CONTAINERS[open]] || 0) + 1;
    });
    const firsts = {};
    (almanac.wonders || []).forEach((w) => {
      const places = semantic.wonders?.[w.id] || [];
      if (places.length && Math.min(...places.map((p) => p.c)) === n) firsts[w.kind] = (firsts[w.kind] || 0) + 1;
    });
    const materials = Object.entries(semantic.materials || {})
      .map(([id, m]) => [id, m.chapters?.[String(n)]?.n || 0])
      .filter(([, k]) => k > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const told = edges.filter((e) => (e.chapters || e.told || []).map(Number).includes(n)).length;
    chapters.push({ n, title: data.title, rooms, sigils, containers, firsts, materials, told });
  }
  const bySigil = {};
  chapters.forEach((c) => Object.entries(c.sigils).forEach(([op, k]) => {
    const role = ROLES[op];
    if (!role) return;
    bySigil[role] = bySigil[role] || { rooms: 0, chapters: [] };
    bySigil[role].rooms += k;
    bySigil[role].chapters.push(c.n);
  }));
  const q = (s) => String(s).replace(/"/g, "'");
  const lines = [
    '# Lore.Land sigil × chapter audit (generated by .spw/tools/sigil-audit.mjs; do not edit by hand, re-run it)',
    '# The chapter-by-chapter, sigil-by-sigil plan to audit components, creatures, ecology and interaction',
    '# semantics, grounded in counts read from the canon. Counts are the baseline; questions are the plan.',
    '#>lore_land_audits_sigil_chapter',
    '#:surface #!audit',
    '#:layer #!pragmatics',
    '#:status #!seeded',
    '',
    '~<rationale>{',
    '  Every chapter is made of rooms, and every room moves by one sigil. Reading the book sigil by sigil and chapter by chapter shows where a kind of motion is crowded or missing, where creatures and materials gather, and where a component or an interaction does not yet mean what its sigil says. The audit walks the grid one cell at a time.',
    '}',
    '',
    '^method{',
    '  passes: "one chapter at a time, top to bottom; in each, one sigil at a time; for each cell, the four lenses: components, creatures, ecology, interaction semantics"',
    '  states: "seed (counted only) → read (the cell has been looked at) → checked (every question answered or waived with a reason) → moved (a change shipped because of it)"',
    '  sources: "room signatures (chapter JSON room.spw), the almanac, semantic.json materials, harmonies.json, the game rules (.spw/runtime/pie-rules.spw)"',
    '  rerun: "npm run spw:sigil-audit after any room, wonder, material or harmony changes"',
    '}',
    '',
    '%chapters{'
  ];
  chapters.forEach((c) => {
    const sig = Object.entries(c.sigils).map(([op, k]) => `${op}${k}`).join(' ');
    const con = Object.entries(c.containers).map(([k, v]) => `${k} ${v}`).join(', ');
    const won = Object.entries(c.firsts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none first met here';
    const mat = c.materials.map(([id, k]) => `${id} ${k}`).join(', ') || 'none counted';
    lines.push(`  c${pad(c.n)}: { title: "${q(c.title)}" rooms: ${c.rooms.length} sigils: "${sig}" kinds: "${con}" wonders: "${won}" materials: "${mat}" harmonies: ${c.told} state: "seed" }`);
  });
  lines.push('}', '', '%sigils{');
  Object.entries(ROLES).forEach(([op, role]) => {
    const s = bySigil[role] || { rooms: 0, chapters: [] };
    lines.push(`  ${role}: { sigil: "${op}" rooms: ${s.rooms} chapters: "${[...new Set(s.chapters)].join(' ') || 'none'}" components: "${q(QUESTIONS[role].components)}" creatures: "${q(QUESTIONS[role].creatures)}" ecology: "${q(QUESTIONS[role].ecology)}" interaction: "${q(QUESTIONS[role].interaction)}" state: "seed" }`);
  });
  lines.push('}', '');
  const sparse = Object.entries(ROLES).filter(([, role]) => (bySigil[role]?.rooms || 0) < 3).map(([op]) => op);
  lines.push('~notice{', `  sparse_sigils: "${sparse.length ? `${sparse.join(' ')}: few rooms move by these; an audit asks whether that is a choice` : 'none: every sigil moves at least three rooms'}"`, `  densest_chapter: "${[...chapters].sort((a, b) => b.rooms.length - a.rooms.length)[0]?.title || ''}"`, '}', '');
  await writeFile(resolve(ROOT, '.spw/audits/sigil-chapter-audit.spw'), lines.join('\n'));
  console.log(`[spw:sigil-audit] ${chapters.length} chapters, ${Object.keys(bySigil).length} sigils in use → .spw/audits/sigil-chapter-audit.spw`);
}

main().catch((error) => { console.error(error); process.exit(1); });
