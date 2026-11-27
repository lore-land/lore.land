#!/usr/bin/env node
// @ts-check
/**
 * ecology-compose.mjs — each chapter's ecology, measured from the canon, and the book cut into layers.
 *
 *   node .spw/tools/ecology-compose.mjs        (npm run spw:ecology, part of canon:build)
 *
 * Writes:
 *   .spw/ecologies/NN/ecology.spw        one chapter's physiology. The measured blocks are rewritten on every run;
 *                                        ^"biome" and ^"craft" are authored and kept as they stand.
 *   .spw/ecologies/index.spw             the ring, chapter by chapter, with each chapter's shape in one line.
 *   .spw/caches/chapter-substrate.spw    the substrate: every chapter on one ladder (word, sentence, paragraph,
 *                                        room, chapter, page and minute), its flow, its dimensions, the octave twins
 *                                        side by side, and the probes where page, lane and title part.
 *
 * The ladder keeps the alignment metaphor as numbers. Words are the stations on a line, a sentence is the line,
 * a paragraph (or a minute of reading) is the machine the line turns out. A chapter reads well when the lines and
 * the machines suit each other, and a maker can see where they do not before printing anything new from it.
 * Nothing here is dated, so a second run writes the same bytes; npm run check fails if a run would change them.
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** JSON at the boundary; book:check holds its shape. @param {string} p @returns {Promise<any>} */
const readJson = async (p) => JSON.parse(await readFile(resolve(ROOT, p), 'utf8'));
/** @param {string} p */
const readText = async (p) => { try { return await readFile(resolve(ROOT, p), 'utf8'); } catch { return ''; } };
/** @param {string} p */
const exists = async (p) => { try { await access(resolve(ROOT, p)); return true; } catch { return false; } };
/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0');
/** A value safe inside a Spw string on one line. @param {unknown} v */
const q = (v) => String(v ?? '').replace(/\s+/g, ' ').replace(/"/g, '”').trim();
/** @param {number} v @param {number} [d] */
const round = (v, d = 1) => (Number.isFinite(v) ? Number(v.toFixed(d)) : 0);

/* Reading units. A minute is the chapter page's own read-time chip (chapter-render.mjs WORDS_PER_MINUTE); a page is a
   trade paperback page. */
const WORDS_PER_MINUTE = 230;
const WORDS_PER_PAGE = 275;
const BARS = '▁▂▃▄▅▆▇█';
const STOP = new Set('a an and as at be but by for from in into is it its of on or the to was who with that this not one two'.split(' '));

const { ringSlotFor, RING_SEQUENCE } = await import(resolve(ROOT, 'book/scripts/modules/spw-ast.mjs'));
const { TOTAL_CHAPTERS } = await import(resolve(ROOT, 'book/scripts/modules/book-extent.mjs'));
const { CHARACTERS } = await import(resolve(ROOT, 'book/scripts/modules/characters.mjs'));
const { INTRO } = await import(resolve(ROOT, 'book/scripts/home/pie-world.mjs'));
const { paceAt } = await import(resolve(ROOT, 'book/scripts/home/pie-rhythm.mjs'));
const likeness = await readJson('book/content/world/likeness.json');
const almanac = await readJson('book/content/world/almanac.json');
const palettes = await readJson('book/content/world/palettes.json');
const tropes = await readJson('book/content/world/tropes.json');
const levelsText = await readText('.spw/runtime/pie-levels.spw');
const platesText = await readText('.spw/state/plates-manifest.spw');
const SIGILS = ['~', '#', '.', '?', '!', '*', '&', '@', '^', '=', '%', '$'];
const RING_LENGTH = RING_SEQUENCE.length;

/* ─── Prose: the reader-facing words of a chapter, room by room ─────────────────────────────────────────────── */

/** A paragraph's canonical text: each {{slot}} at its variant zero, tags dropped. @param {any} block @returns {string} */
function blockText(block) {
  if (!block || typeof block !== 'object') return '';
  let text = String(block.text || '');
  if (block.slots && text.includes('{{')) text = text.replace(/\{\{([a-z0-9-]+)\}\}/g, (_m, name) => block.slots[name]?.variants?.[0] ?? '');
  const own = block.type === 'bracework' ? '' : text;
  const kids = [...(Array.isArray(block.content) ? block.content : []), ...(Array.isArray(block.children) ? block.children : [])].map(blockText);
  return [own, ...kids].join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** A room is a titled section or a voice; a figure is a plate hung between rooms. @param {any} s */
const isRoom = (s) => s?.type === 'section' || /^custom-/.test(String(s?.type || ''));

/** @param {string} text */
const wordsOf = (text) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
/** @param {string} text */
const sentencesOf = (text) => text.split(/(?<=[.!?…])["”’)]*\s+(?=["“‘(]?[\p{Lu}\p{N}])/u).map((s) => s.trim()).filter((s) => wordsOf(s).length > 0);
/** Share of characters inside quotation marks: how much of the chapter is said aloud. @param {string} text */
const spokenShare = (text) => {
  const said = [...text.matchAll(/[“"]([^”"]{2,})[”"]/g)].reduce((sum, m) => sum + m[1].length, 0);
  return text.length ? said / text.length : 0;
};
/** @param {number[]} xs */
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
/** @param {number[]} xs */
const spread = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
/** @param {number[]} xs */
const spark = (xs) => { const top = Math.max(...xs, 1); return xs.map((x) => BARS[Math.min(BARS.length - 1, Math.round((x / top) * (BARS.length - 1)))]).join(''); };
/* The leg as the game reads it (pie-game.mjs loadLeg, tickFlows): every paragraph block, slots at variant zero, each
   given an equal share of a leg chars / 22 cobbles long, held between 200 and 480. A paragraph's load is its
   characters per cobble; 22 is the book's own rate by construction, so a capped leg reads faster than that. */
const LEG = { charsPerCobble: 22, min: 200, max: 480 };
/** @param {any[]} sections @returns {string[]} */
function legParagraphs(sections) {
  /** @type {string[]} */ const out = [];
  /** @param {any} node */
  const walk = (node) => (node.content || []).forEach((/** @type {any} */ item) => {
    if (item.type === 'paragraph' && item.text) out.push(String(item.text).replace(/\{\{([a-z0-9-]+)\}\}/gi, (_m, k) => item.slots?.[k]?.variants?.[0] ?? ''));
    else if (Array.isArray(item.content)) walk(item);
  });
  sections.forEach(walk);
  return out;
}
/** Caption strain: load above the book rate, where the leg is past half taut, averaged over the leg. @param {number[]} loads @param {number[]} pace */
const captionStrain = (loads, pace) => (loads.length ? loads.reduce((sum, load, i) => sum + Math.max(0, load - LEG.charsPerCobble) * Math.max(0, paceAt(pace, (i + 0.5) / loads.length) - 0.5), 0) / loads.length : 0);
/** Mean of a series in k equal parts, in order. @param {number[]} xs @param {number} k */
const parts = (xs, k) => Array.from({ length: k }, (_v, j) => { const slice = xs.filter((_x, i) => Math.floor((i / xs.length) * k) === j); return slice.length ? mean(slice) : 0; });
/** Content words of a phrase (title, biome line), for asking whether the prose holds them. @param {string} text */
const contentWords = (text) => (text.toLowerCase().match(/[\p{L}][\p{L}’'-]*/gu) || []).map((w) => w.replace(/[’']s$/, '')).filter((w) => w.length > 1 && !STOP.has(w));
/** Share of a phrase's content words the prose holds (a five-letter stem is enough: answers ~ answered). @param {string} phrase @param {string} prose */
const groundShare = (phrase, prose) => {
  const words = contentWords(phrase);
  if (!words.length) return 1;
  const hay = prose.toLowerCase();
  const held = words.filter((w) => hay.includes(w.length > 5 ? w.slice(0, 5) : w)).length;
  return held / words.length;
};

/* ─── Canon readers ───────────────────────────────────────────────────────────────────────────────────────────── */

/** One level's terms from pie-levels.spw: the chapter's music and how its leg plays. @param {number} n */
function levelOf(n) {
  const line = levelsText.split('\n').find((l) => l.trimStart().startsWith(`*ch${pad(n)}{`)) || '';
  /** @param {string} sig @param {string} key */
  const term = (sig, key) => (line.match(new RegExp(`\\${sig}${key}\\[([^\\]]*)\\]`)) || [])[1] || '';
  const rhythm = term('*', 'rhythm');
  const rline = rhythm ? levelsText.split('\n').find((l) => l.trimStart().startsWith(`*${rhythm}{`)) || '' : '';
  return {
    tempo: Number(term('%', 'tempo')) || 0, root: Number(term('%', 'root')) || 0, swing: Number(term('%', 'swing')) || 50,
    motif: term('~', 'motif'), theme: term('@', 'theme'), rhythm, cast: term('@', 'cast'), egg: term('%', 'egg'),
    pace: term('~', 'pace').split(/\s+/).filter(Boolean).map(Number),
    steps: (rline.match(/\.steps\["([^"]*)"\]/) || [])[1] || '', rhythmName: (rline.match(/#name\["([^"]*)"\]/) || [])[1] || ''
  };
}
/** @param {number} hz */
const noteName = (hz) => {
  if (!hz) return '';
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  return `${['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][midi % 12]}${Math.floor(midi / 12) - 1}`;
};
/** @param {number} n */
const plateState = (n) => (platesText.match(new RegExp(`\\^chamber\\[${pad(n)}\\]\\{[^}]*!state:([a-z]+)`)) || [])[1] || 'unlisted';
/** @param {Record<string, number>} m */
const tally = (m) => Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => `${k} ${v}`).join(', ');
/** @param {Record<string, number>} m @param {string} k */
const bump = (m, k) => { if (k) m[k] = (m[k] || 0) + 1; };

/** The kept blocks of an existing ecology, and the craft notes to lift into ^"craft" the first time. @param {string} text */
function keptBlocks(text) {
  /** @param {string} head */
  const block = (head) => {
    const lines = text.split('\n');
    const at = lines.findIndex((l) => l.startsWith(head));
    if (at < 0) return '';
    const end = lines.findIndex((l, i) => i > at && l === '}');
    return end < 0 ? '' : lines.slice(at, end + 1).join('\n');
  };
  const biome = block('^"biome"{');
  let craft = block('^"craft"{');
  if (!craft) {
    /** @param {string} key */
    const field = (key) => (text.match(new RegExp(`^\\s*${key.replace(/[!]/g, '\\$&')}:\\s*(.+)$`, 'm')) || [])[1]?.trim() || '';
    const rows = [
      ['modulators', field('modulators')], ['compost', field('compost')], ['!watch', field('!digestive_watch')],
      ['mode', field('mode')], ['tonal_role', field('tonal_role')]
    ].filter(([, v]) => v);
    craft = ['^"craft"{', ...rows.map(([k, v]) => `  ${k}: ${v}`), '}'].join('\n');
  }
  return { biome, craft };
}

/* ─── Measure every chapter ───────────────────────────────────────────────────────────────────────────────────── */

const roomsByChapter = /** @type {Record<number, any[]>} */ ({});
for (const it of Object.values(likeness.items || {})) {
  const item = /** @type {any} */ (it);
  if (item.kind === 'room') (roomsByChapter[item.chapter] = roomsByChapter[item.chapter] || []).push(item);
}
/** @type {Record<string, string[]>} */
const intro = {};
Object.entries(INTRO || {}).forEach(([kind, ch]) => { (intro[String(ch)] = intro[String(ch)] || []).push(kind); });

/** @type {any[]} */
const chapters = [];
for (let n = 1; n <= TOTAL_CHAPTERS; n += 1) {
  const path = `book/content/chapters/${pad(n)}.json`;
  if (!(await exists(path))) continue;
  const data = await readJson(path);
  const slot = ringSlotFor(n);
  const sections = Array.isArray(data.sections) ? data.sections : [];
  /** @type {any[]} */
  const roomSections = sections.filter(isRoom);
  const likeRooms = (roomsByChapter[n] || []).slice().sort((a, b) => Number(String(a.id).split('.')[1]) - Number(String(b.id).split('.')[1]));
  /** @type {any[]} */
  const stations = roomSections.map((/** @type {any} */ s, /** @type {number} */ i) => {
    const paragraphs = (Array.isArray(s.content) ? s.content : []).map(blockText).filter(Boolean);
    const text = paragraphs.join(' ');
    const like = likeRooms[i] || {};
    return {
      n: i + 1, title: like.title || s.title || `room ${i + 1}`, spw: s.room?.spw || like.spw || '',
      sigil: like.sigil || '', container: like.container || '', material: like.material || '', valence: like.valence || '', characters: like.characters || [],
      words: wordsOf(text).length, sentences: sentencesOf(text).length, paragraphs: paragraphs.length, text
    };
  });
  const prose = stations.map((s) => s.text).join(' ');
  const sentenceLengths = sentencesOf(prose).map((s) => wordsOf(s).length);
  const words = stations.reduce((a, s) => a + s.words, 0);
  const sentences = sentenceLengths.length;
  const paragraphs = stations.reduce((a, s) => a + s.paragraphs, 0);
  const level = levelOf(n);
  const legParas = legParagraphs(sections);
  const legChars = legParas.reduce((sum, p) => sum + p.length, 0);
  const legCobbles = Math.min(LEG.max, Math.max(LEG.min, Math.round(legChars / LEG.charsPerCobble)));
  const loads = legParas.map((p) => p.length / (legCobbles / Math.max(1, legParas.length)));
  const strain = level.pace.length ? captionStrain(loads, level.pace) : 0;
  /** @type {Record<string, Record<string, number>>} */
  const dims = { valence: {}, material: {}, container: {}, sigil: {}, cast: {} };
  for (const s of stations) {
    bump(dims.valence, s.valence); bump(dims.material, s.material); bump(dims.container, s.container); bump(dims.sigil, s.sigil);
    s.characters.forEach((/** @type {string} */ c) => bump(dims.cast, c));
  }
  /** @type {any[]} */
  const wonders = (almanac.wonders || []).filter((/** @type {any} */ w) => Number(w.home) === n);
  const echoes = (almanac.wonders || []).filter((/** @type {any} */ w) => (w.echoes || []).map(Number).includes(n)).map((/** @type {any} */ w) => w.id);
  const crossing = (tropes.tropes || []).filter((/** @type {any} */ t) => (t.faces?.story?.chambers || []).map(Number).includes(n)).map((/** @type {any} */ t) => t.id);
  const met = Object.entries(CHARACTERS).filter(([, c]) => Number(/** @type {any} */ (c).first) === n).map(([id]) => id);
  const palette = (palettes.palettes || []).find((/** @type {any} */ p) => Number(p.chapter) === n);
  const existing = await readText(`.spw/ecologies/${pad(n)}/ecology.spw`);
  const kept = keptBlocks(existing);
  const biomeText = (kept.biome.match(/"[^"]*"/g) || []).join(' ');
  chapters.push({
    n, data, slot, stations, words, sentences, paragraphs, level, legChars, legCobbles, loads, strain, dims, wonders, echoes, crossing, met, palette, kept,
    rooms: stations.length,
    minutes: words / WORDS_PER_MINUTE, pages: words / WORDS_PER_PAGE,
    wordsPerSentence: mean(sentenceLengths), sentenceSpread: spread(sentenceLengths), longestSentence: Math.max(0, ...sentenceLengths),
    sentencesPerParagraph: paragraphs ? sentences / paragraphs : 0, paragraphsPerMinute: words ? paragraphs / (words / WORDS_PER_MINUTE) : 0,
    spoken: spokenShare(prose),
    titleGround: groundShare(data.title, `${data.epigraph || ""} ${prose}`), biomeGround: biomeText ? groundShare(biomeText, prose) : 0,
    absentSigils: SIGILS.filter((s) => !dims.sigil[s]),
    lanes: intro[String(n)] || [], plate: plateState(n), og: await exists(`book/images/og/chapter-${pad(n)}.jpg`)
  });
}

/* ─── Write each ecology ──────────────────────────────────────────────────────────────────────────────────────── */

const byN = Object.fromEntries(chapters.map((c) => [c.n, c]));

for (const c of chapters) {
  const { n, data, slot, level } = c;
  const twin = n > RING_LENGTH ? n - RING_LENGTH : n + RING_LENGTH;
  const next = RING_SEQUENCE[slot.ring % RING_LENGTH];
  const open = c.stations[0] || {}; const close = c.stations[c.stations.length - 1] || {};
  const biome = c.kept.biome || '^"biome"{\n  terrain: "unwritten — an authored block: terrain, metabolite, symbiotes, irritant, circulation"\n}';
  const out = [
    `# Chapter ${pad(n)} Ecology — ${data.title}`,
    `# Composed by .spw/tools/ecology-compose.mjs (npm run spw:ecology) from the chapter JSON, likeness, almanac, pie levels`,
    `# and the plates manifest. ^"biome" and ^"craft" are authored and kept; every other block is measured and rewritten.`,
    `#>chapter_${pad(n)}_ecology`,
    `#:ecology #!book-${slot.book}`,
    '#:layer #!pragmatics',
    '#:status #!live',
    '',
    '~<rationale>{',
    `  Chapter ${n} measured from its canon. Ring ${slot.ring} of ${RING_LENGTH}, ${slot.symbol} ${slot.name}: ${slot.represents.toLowerCase()}. Its rooms can be read as the stations of one line, in order; its twin an octave away is Chapter ${twin}.`,
    '}',
    '',
    '^"identity"{',
    `  chapter: ${n}`, `  book: ${slot.book}`, `  ring: ${slot.ring}`, `  title: "${q(data.title)}"`,
    `  mood: "${q(data.mood)}"`, `  period: "${q(data.period)}"`, `  logline: "${q(data.logline)}"`, `  epigraph: "${q(data.epigraph)}"`,
    '}',
    '',
    '^"grammar"{',
    `  construct: "${slot.symbol}"`, `  construct_name: "${slot.name}"`, `  construct_kind: "${slot.kind}"`,
    `  opening_lens: "${q(slot.openingSense)}"`, `  closing_perspective: "${q(slot.closingTurn)}"`, `  represents: "${q(slot.represents)}"`,
    `  next_construct: "${next.symbol} (${next.name})"`,
    `  observed_open_room: "${q(open.spw)}"`, `  observed_close_room: "${q(close.spw)}"`,
    `  sigils_present: "${q(Object.keys(c.dims.sigil).join(' '))}"`, `  sigils_absent: "${q(c.absentSigils.join(' '))}"`,
    '}',
    '',
    biome,
    '',
    c.kept.craft,
    '',
    '^"stations"[',
    ...c.stations.map((/** @type {any} */ s) => `  s${pad(s.n)}: { title: "${q(s.title)}" .spw: "${q(s.spw)}" container: "${s.container}" $material: "${s.material}" =lean: "${s.valence}" %words: ${s.words} %sentences: ${s.sentences} %paragraphs: ${s.paragraphs} }`),
    ']',
    '',
    '%"scale"{',
    `  %words: ${c.words}`, `  %sentences: ${c.sentences}`, `  %paragraphs: ${c.paragraphs}`, `  %rooms: ${c.rooms}`,
    `  %pages: ${round(c.pages)}`, `  %reading_minutes: ${round(c.minutes)}`,
    `  %words_per_sentence: ${round(c.wordsPerSentence)}`, `  %sentences_per_paragraph: ${round(c.sentencesPerParagraph)}`, `  %paragraphs_per_minute: ${round(c.paragraphsPerMinute)}`,
    '}',
    '',
    '~"flow"{',
    `  room_words: "${c.stations.map((/** @type {any} */ s) => s.words).join(' ')}"`, `  room_shape: "${spark(c.stations.map((/** @type {any} */ s) => s.words))}"`,
    `  %sentence_spread: ${round(c.sentenceSpread)}`, `  %longest_sentence: ${c.longestSentence}`, `  %spoken_share: ${round(c.spoken, 2)}`,
    `  lane_pace: "${level.pace.join(' ')}"`, `  %leg_cobbles: ${c.legCobbles}`, `  %chars_per_cobble: ${round(c.legChars / c.legCobbles)}`,
    `  caption_load: "${parts(c.loads, 5).map((x) => Math.round(x)).join(' ')}"`, `  %caption_strain: ${round(c.strain, 2)}`,
    '}',
    '',
    '^"dimensions"{',
    `  lean: "${tally(c.dims.valence)}"`, `  material: "${tally(c.dims.material)}"`, `  container: "${tally(c.dims.container)}"`, `  cast: "${tally(c.dims.cast)}"`,
    `  tropes: "${c.crossing.join(' ')}"`, `  wonders_echoed: "${c.echoes.join(' ')}"`,
    `  %title_on_page: ${round(c.titleGround, 2)}`, `  %biome_on_page: ${round(c.biomeGround, 2)}`,
    '}',
    '',
    '^"assets"{',
    `  prose_json: ~"../../../book/content/chapters/${pad(n)}.json"`, `  canon_mirror: ~"../../chapters/${pad(n)}.spw"`,
    `  plate: ~"../../../book/images/${pad(n)}.png"`, `  plate_state: "${c.plate}"`,
    c.og ? `  og_card: ~"../../../book/images/og/chapter-${pad(n)}.jpg"` : '  og_card: "none yet"',
    `  palette: "${q(c.palette?.id || 'none')}"`,
    `  characters_met: [${c.met.map((/** @type {string} */ id) => `"${id}"`).join(', ')}]`,
    `  lanes_introduced: [${c.lanes.map((/** @type {string} */ k) => `"${k}"`).join(', ')}]`,
    '}',
    '',
    '%"gut_health"{',
    `  flora: { rooms: ${c.rooms} sections: ${(data.sections || []).length} wonders: ${c.wonders.length} creatures: ${c.wonders.filter((/** @type {any} */ w) => w.kind === 'creature').length} lore_lines: ${(data.lore?.loreItems || []).length} }`,
    `  wonder_ids: [${c.wonders.map((/** @type {any} */ w) => `"${w.id}"`).join(', ')}]`,
    '  permeability: "live page + /pie/ voyage leg + ?/ doors"',
    '}',
    '',
    '^"music"{',
    `  %tempo: ${level.tempo}`, `  %root: ${level.root}`, `  note_name: "${noteName(level.root)}"`, `  %swing: ${level.swing}`,
    `  ~motif: [${level.motif}]`, `  @theme: ${level.theme || 'none'}`, `  *rhythm: ${level.rhythm || 'none'}`,
    `  pattern: "${q(level.steps)}"`, `  rhythm_name: "${q(level.rhythmName)}"`,
    `  &level: ~"../../runtime/pie-levels.spw#lore_land_runtime_pie_levels"`,
    '}',
    '',
    '^"navigation"{',
    n > 1 ? `  &prev: ~"../${pad(n - 1)}/ecology.spw"` : '  &prev: ~"../index.spw"',
    n < chapters.length ? `  &next: ~"../${pad(n + 1)}/ecology.spw"` : '  &next: ~"../../surfaces/book-three.spw#lore_land_book_three"',
    byN[twin] ? `  &octave_twin: ~"../${pad(twin)}/ecology.spw#chapter_${pad(twin)}_ecology"` : '  &octave_twin: "not yet written"',
    '  &substrate: ~"../../caches/chapter-substrate.spw#lore_land_chapter_substrate"',
    '  &sound: ~"../../surfaces/sound-and-voice.spw#tonal_ring"',
    '  &poetics: ~"../../surfaces/poetics.spw#lore_land_surfaces_poetics"',
    '}',
    '',
    '^"valence_edges"{',
    `  =boon@chapter_${pad(n)}_ecology{ @chapter_${pad(twin)}_ecology }`,
    `  =bane@${slot.name}_${slot.ring}{ @chapter_${pad(n)}_irritant }`,
    `  =bone@chapter_${pad(n)}_ecology{ @tonal_ring }`,
    '}',
    ''
  ];
  await writeFile(resolve(ROOT, `.spw/ecologies/${pad(n)}/ecology.spw`), out.join('\n'));
}

/* ─── The index ───────────────────────────────────────────────────────────────────────────────────────────────── */

const index = [
  '# Lore.Land Chapter Ecologies Index (composed by .spw/tools/ecology-compose.mjs; do not edit by hand, re-run npm run spw:ecology)',
  '# Every chapter on the Ring of Thirteen, Book One and Book Two, apart from the generated .spw/chapters/NN.spw mirrors.',
  '#>lore_land_ecologies_index',
  '#:canon #!ecologies',
  '#:layer #!pragmatics',
  '#:status #!active',
  '',
  '~<rationale>{',
  '  Chapters need distinct internal physiology rather than flat uniform containers. Each ecology keeps two authored blocks, the biome and the craft notes, and measures the rest from the canon, so it cannot drift from the chapter it describes. The substrate cache lays all of them on one ladder.',
  '}',
  '',
  '^"meta"{',
  `  total_chapters: ${chapters.length}`,
  `  books: ${Math.max(...chapters.map((c) => c.slot.book))}`,
  `  sequence: "${RING_SEQUENCE.map((/** @type {any} */ r) => r.symbol).join(' ')}"`,
  '  &substrate: ~"../caches/chapter-substrate.spw#lore_land_chapter_substrate"',
  '  &world_ecology: ~"../surfaces/ecology.spw#ecology"',
  '  &ring_tour: ~"../surfaces/rooms.spw#ring_tour"',
  '  &book_three: ~"../surfaces/book-three.spw#lore_land_book_three"',
  '  &progression: ~"../audits/progression.spw#lore_land_audits_progression"',
  '}',
  '',
  '&[ecologies][',
  ...chapters.map((c) => `  c${pad(c.n)}: { title: "${q(c.data.title)}" book: ${c.slot.book} ring: ${c.slot.ring} construct: "${c.slot.symbol}" %words: ${c.words} %minutes: ${round(c.minutes)} shape: "${spark(c.stations.map((/** @type {any} */ s) => s.words))}" status: "live" &ecology: ~"./${pad(c.n)}/ecology.spw" }`),
  ']',
  ''
];
await writeFile(resolve(ROOT, '.spw/ecologies/index.spw'), index.join('\n'));

/* ─── The substrate cache ─────────────────────────────────────────────────────────────────────────────────────── */

/** @param {any[]} cs */
const rollup = (cs) => {
  const words = cs.reduce((a, c) => a + c.words, 0);
  const lean = /** @type {Record<string, number>} */ ({});
  const material = /** @type {Record<string, number>} */ ({});
  const container = /** @type {Record<string, number>} */ ({});
  for (const c of cs) {
    for (const [k, v] of Object.entries(c.dims.valence)) lean[k] = (lean[k] || 0) + Number(v);
    for (const [k, v] of Object.entries(c.dims.material)) material[k] = (material[k] || 0) + Number(v);
    for (const [k, v] of Object.entries(c.dims.container)) container[k] = (container[k] || 0) + Number(v);
  }
  const titleWords = cs.map((c) => wordsOf(c.data.title).length);
  return { words, minutes: words / WORDS_PER_MINUTE, pages: words / WORDS_PER_PAGE, lean, material, container, titleWords: mean(titleWords), shape: spark(cs.map((c) => c.words)) };
};
const books = [...new Set(chapters.map((c) => c.slot.book))].map((b) => ({ b, ...rollup(chapters.filter((c) => c.slot.book === b)) }));
const twins = chapters.filter((c) => c.n <= RING_LENGTH && byN[c.n + RING_LENGTH]).map((a) => {
  const b = byN[a.n + RING_LENGTH];
  const shared = (/** @type {string} */ key) => Object.keys(a.dims[key]).filter((k) => b.dims[key][k]).join(' ');
  return { a, b, ratio: a.words ? b.words / a.words : 0, materials: shared('material'), cast: shared('cast') };
});
/** Probes: where a line and its machine, a page and its lane, or a title and its chapter part. */
const probes = [];
for (const c of chapters) {
  if (c.titleGround < 0.5) probes.push(`c${pad(c.n)}_title: "${q(c.data.title)} — under half its words are in the prose (${round(c.titleGround, 2)})"`);
  if (c.biomeGround && c.biomeGround < 0.35) probes.push(`c${pad(c.n)}_biome: "the authored biome names little the prose holds (${round(c.biomeGround, 2)}); reread ^biome against the rooms"`);
  if (c.strain > 0.3) probes.push(`c${pad(c.n)}_lane: "long paragraphs are captioned where the leg is taut (caption strain ${round(c.strain, 2)}); ease ~pace there, or let the paragraph be read off the road"`);
  if (Math.round(c.legChars / LEG.charsPerCobble) > LEG.max) probes.push(`c${pad(c.n)}_cap: "the leg is held at ${LEG.max} cobbles, so its captions run at ${round(c.legChars / c.legCobbles)} characters a cobble against ${LEG.charsPerCobble}"`);
  if (c.wordsPerSentence > 24) probes.push(`c${pad(c.n)}_lines: "long lines (${round(c.wordsPerSentence)} words a sentence)"`);
}
const uneven = twins.filter((t) => t.ratio > 1.6 || t.ratio < 0.6);
if (uneven.length) probes.push(`twins_weight: "${uneven.length} of ${twins.length} octave twins differ in weight by more than half: ${uneven.map((t) => `${t.b.n} at ${round(t.ratio, 2)} of ${t.a.n}`).join(", ")}"`);

const substrate = [
  '# Lore.Land chapter substrate (composed by .spw/tools/ecology-compose.mjs; do not edit by hand, re-run npm run spw:ecology)',
  '# The book cut into layers, for makers and agents to design against before printing anything new from it.',
  '#>lore_land_chapter_substrate',
  '#:cache #!substrate',
  '#:layer #!pragmatics',
  '#:status #!generated',
  '',
  '~<rationale>{',
  '  One way to read it: desktop printing changed most when the model came apart from the machine, one shared file, a slicer that cuts it into layers, and any printer that can read the layers. Indie publishing at scale may be the same turn. Read that way, a chapter is the model; the page, the share card, the lane leg, the sound, the almanac entry and the trope page are prints. This cache is the sliced form, every chapter on one ladder, so a new print starts from measured layers instead of from a reread. On one end of the ladder words make sentences and sentences make paragraphs or minutes; a century ago the assembly line was the sentence and the machine it made was the paragraph. Alignment, in that reading, is the lines and the machines suiting each other, and flow how evenly the work moves down the line. Everything below is a count with its method; none of it is a verdict on the writing, and what a count means is a question for a person.',
  '}',
  '',
  '^"ladder"[',
  `  word: "a station on the line"`,
  `  sentence: "the line; words_per_sentence is its length"`,
  `  paragraph: "the machine the line turns out; sentences_per_paragraph is how many lines make one"`,
  `  room: "a bay of machines under one Spw signature; room_shape draws their weights in order"`,
  `  chapter: "the shipment; one ring slot, one construct"`,
  `  page: "${WORDS_PER_PAGE} words, a trade paperback page"`,
  `  minute: "${WORDS_PER_MINUTE} words read, the chapter page read-time chip; a lane leg keeps its own minute at the level tempo"`,
  ']',
  '',
  '%"books"{',
  ...books.map((x) => `  b${x.b}: { %words: ${x.words} %pages: ${round(x.pages)} %minutes: ${round(x.minutes)} %title_words: ${round(x.titleWords)} shape: "${x.shape}" lean: "${tally(x.lean)}" material: "${tally(x.material)}" container: "${tally(x.container)}" }`),
  '}',
  '',
  '&"chapters"[',
  ...chapters.map((c) => `  c${pad(c.n)}: { title: "${q(c.data.title)}" ring: ${c.slot.ring} construct: "${c.slot.symbol}" %words: ${c.words} %sentences: ${c.sentences} %paragraphs: ${c.paragraphs} %rooms: ${c.rooms} %pages: ${round(c.pages)} %minutes: ${round(c.minutes)} %words_per_sentence: ${round(c.wordsPerSentence)} %sentences_per_paragraph: ${round(c.sentencesPerParagraph)} shape: "${spark(c.stations.map((/** @type {any} */ s) => s.words))}" %spoken: ${round(c.spoken, 2)} lane_pace: "${c.level.pace.join(' ')}" %leg_cobbles: ${c.legCobbles} %caption_strain: ${round(c.strain, 2)} lean: "${tally(c.dims.valence)}" material: "${tally(c.dims.material)}" sigils_absent: "${c.absentSigils.join(' ')}" tropes: "${c.crossing.join(' ')}" %title_on_page: ${round(c.titleGround, 2)} &ecology: ~"../ecologies/${pad(c.n)}/ecology.spw" }`),
  ']',
  '',
  '&"octave_twins"[',
  ...twins.map((t) => `  t${pad(t.a.n)}_${pad(t.b.n)}: { construct: "${t.a.slot.symbol}" a: "${q(t.a.data.title)}" b: "${q(t.b.data.title)}" %weight_ratio: ${round(t.ratio, 2)} shared_material: "${t.materials}" shared_cast: "${t.cast}" }`),
  ']',
  '',
  '?probes[',
  ...(probes.length ? probes.map((p) => `  ${p}`) : ['  none: "every line, lane and title holds"']),
  ']',
  '',
  '^"prints"{',
  '  .note: "what each consumer reads from this cache; a new print adds a row here before it reads anything"',
  '  page: "chapter pages read the chapter JSON directly; this cache only describes them"',
  '  lanes: "pie-levels.spw ~pace is read against caption_load: a leg eases where its paragraphs are long, so captions can be read between dodges"',
  '  share_cards: "assets:brand sets the title; title_on_page counts how many title words the page or its epigraph holds, which says nothing about whether the title is right"',
  '  trope_wiki: "tropes per chapter, octave twins and lean give a trope page its crossings and its two registers"',
  '  autonomous_feedback: "shape and sentences_per_paragraph are counts a feedback route could ask beside; whether a reader loses the thread there is what the route asks, not what the count says"',
  '}',
  ''
];
await writeFile(resolve(ROOT, '.spw/caches/chapter-substrate.spw'), substrate.join('\n'));

/* ─── Hold the writes to the real parser ──────────────────────────────────────────────────────────────────────── */

const { parse } = await import(resolve(ROOT, 'book/scripts/vendor/spw-seed.mjs'));
const written = [...chapters.map((c) => `.spw/ecologies/${pad(c.n)}/ecology.spw`), '.spw/ecologies/index.spw', '.spw/caches/chapter-substrate.spw'];
const broken = [];
for (const file of written) {
  const read = parse(await readText(file), { lexProfile: 'prose' });
  if (!read.completeness?.complete || read.completeness?.proseFallback) broken.push(file);
}
if (broken.length) {
  console.error(`spw:ecology wrote ${broken.length} file(s) the parser does not read whole:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`spw:ecology[${chapters.length} chapters, ${probes.length} probes]{ .spw/ecologies/NN/ecology.spw, .spw/ecologies/index.spw, .spw/caches/chapter-substrate.spw }`);
