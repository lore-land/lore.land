import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CHAPTER_ROOT = path.join(ROOT, 'book', 'chapter');
const OUTPUT_ROOT = path.join(ROOT, '.spw', 'chapters');

function pad(num) {
  return String(num).padStart(2, '0');
}

/* One-line registers for the cast confluence. Boof and the Fool are fixed
   characters (established across media — characterization is not flexible);
   guest voices take their register from the chamber that summons them. */
const VOICE_REGISTERS = {
  boof: 'dog of the Commons Scale; her repair ledger’s ink refuses to dry until the wrong it names is mended',
  fool: 'tone-balance; walks in through doors that were only painted, asking the sideways question that unlocks the straight answer',
  boonberry: 'lantern-fruit of the grove; kindles wherever a phrase is repeated until it hardens into law',
  echo: 'an old scent re-lit; a summons wearing a borrowed voice, never proof',
  paradox: 'twin truths braided into one rope, pulling opposite ways',
  mirror: 'a glass that returns the council’s procedure with the spell reversed',
  song: 'a melody that pockets what the minutes leave out and hums it elsewhere',
  labyrinth: 'a maze that grows a corridor for every wrong turn, and remembers each one',
  shadow: 'the oath’s unspoken clause, given legs and a long noon stride',
  game: 'rules that enchant only the players who notice them',
  puzzle: 'nine shards, ten edges; assembles into a question instead of a picture',
  bonk: 'a blunt bell-note that shakes stray magic out of the meter',
  awakening: 'the hour the archive opens one eye and finds itself being read',
  path: 'a road conjured by walking; it unwalks itself behind you',
  reflection: 'the book reading itself back by candlelight, tallying its own spells'
};

/* One step of the weave reading per voice; closers override when the voice
   has the chapter's last word. */
const VOICE_STEPS = {
  boof: 'Boof pads in on a thread of scent',
  fool: 'the Fool sidles in through a painted door',
  boonberry: 'the boonberries kindle',
  echo: 'an echo answers in a borrowed voice',
  paradox: 'a paradox braids the path',
  mirror: 'the mirror turns its silver',
  song: 'a song slips through the wards',
  labyrinth: 'the labyrinth grows a new corridor',
  shadow: 'a shadow lengthens to keep pace',
  game: 'the game declares its enchanted rules',
  puzzle: 'the puzzle offers a charmed corner',
  bonk: 'a bonk rings like a struck bell',
  awakening: 'something old stirs awake',
  path: 'the path unrolls itself, listening',
  reflection: 'the reflection reads back by candlelight'
};

const VOICE_CLOSERS = {
  boof: 'Boof closes the day with the trail still warm',
  fool: 'the Fool takes the last word and vanishes with it'
};

/* Second and later appearances — a return reads differently than an entrance. */
const VOICE_RETURNS = {
  boof: 'Boof doubles back along the scent-thread',
  fool: 'the Fool reappears where no door was'
};

function voiceName(type) {
  return String(type || '').replace(/^custom-/, '');
}

function readChapterJson(indexHtmlPath) {
  const source = fs.readFileSync(indexHtmlPath, 'utf8');
  const match = source.match(/<script type="application\/json" id="chapter-data">([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error(`Missing chapter-data JSON in ${indexHtmlPath}`);
  }

  return JSON.parse(match[1]);
}

function oneLine(value, max = 172) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return '';
  }
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function sectionHandle(section, index) {
  const type = String(section?.type || 'section').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  return `${type}/${pad(index + 1)}`;
}

function collectParagraphs(section, sink) {
  if (!section || typeof section !== 'object') {
    return;
  }

  if (section.type === 'paragraph' && typeof section.text === 'string') {
    sink.push(section.text);
  }

  if (Array.isArray(section.children)) {
    section.children.forEach((child) => {
      if (!child || typeof child !== 'object') {
        return;
      }
      if (typeof child.text === 'string') {
        sink.push(child.text);
      }
      if (typeof child.content === 'string') {
        sink.push(child.content);
      }
    });
  }

  if (Array.isArray(section.content)) {
    section.content.forEach((entry) => collectParagraphs(entry, sink));
  }
}

function collectHandles(section, sink) {
  if (!section || typeof section !== 'object') {
    return;
  }

  Object.entries(section).forEach(([key, value]) => {
    if (key === 'data-content_id' && typeof value === 'string') {
      sink.add(value.trim());
    }
  });

  if (Array.isArray(section.content)) {
    section.content.forEach((entry) => collectHandles(entry, sink));
  }

  if (Array.isArray(section.children)) {
    section.children.forEach((entry) => collectHandles(entry, sink));
  }
}

/* The container itself carries the section's structural role instead of a
   redundant string label — frame [] for a selectable figure, capsule <>
   for a directed custom-character insert, body {} for ordinary prose scope,
   scope () for anything else. See CONTAINER_ROLES (spw-interactions.mjs) /
   core/CONTAINERS.md for the same four roles used the same way elsewhere
   in this canon. */
function sectionContainer(section) {
  if (section?.type === 'figure') {
    return ['[', ']'];
  }
  if (typeof section?.type === 'string' && section.type.startsWith('custom-')) {
    return ['<', '>'];
  }
  if (section?.type === 'section') {
    return ['{', '}'];
  }
  return ['(', ')'];
}

function emitSection(section, chapterNumber, index) {
  const [open, close] = sectionContainer(section);
  const handle = sectionHandle(section, index);
  const kind = String(section?.type || 'section');
  const chapterId = pad(chapterNumber);

  const textParts = [];
  collectParagraphs(section, textParts);
  const excerpt = oneLine(textParts.join(' '), 220);

  const handles = new Set();
  collectHandles(section, handles);

  const lines = [];
  lines.push(`  s${pad(index + 1)}: ${open}`);
  lines.push(`    handle: "${handle}"`);
  lines.push(`    type: "${kind}"`);

  if (typeof section?.title === 'string') {
    lines.push(`    title: "${section.title.replace(/"/g, '\\"')}"`);
  }

  if (typeof section?.valence === 'string') {
    lines.push(`    valence: "${section.valence}"`);
  }

  if (section?.img?.src) {
    lines.push(`    image: "${section.img.src}"`);
  }

  if (excerpt) {
    lines.push(`    excerpt: "${excerpt.replace(/"/g, '\\"')}"`);
  }

  if (handles.size) {
    lines.push(`    handles: [${[...handles].map((h) => `"${h.replace(/"/g, '\\"')}"`).join(', ')}]`);
  }

  /* Unquoted — a real embedded ^[...]{...} sub-expression, not a string
     that merely looks like one. */
  lines.push(`    route: ^[chapter/${chapterId}/s${pad(index + 1)}]{open}`);
  lines.push(`  ${close}`);

  return lines.join('\n');
}

function emitLoreItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return '  notes: []';
  }

  const lines = ['  notes: ['];
  items.forEach((item) => {
    const text = oneLine(item?.description || '', 190).replace(/"/g, '\\"');
    if (text) {
      lines.push(`    "${text}"`);
    }
  });
  lines.push('  ]');
  return lines.join('\n');
}

/* The chapter's container rhythm, read straight off sectionContainer():
   {} prose, <> voice, [] plate, () aside — a glyph score of the weave. */
function weaveGlyphs(sections) {
  return sections.map((section) => sectionContainer(section).join('')).join(' ');
}

function weaveReading(sections) {
  const last = sections.length - 1;
  const seen = new Set();
  return sections
    .map((section, index) => {
      const type = String(section?.type || 'section');
      if (type === 'figure') {
        return 'the plate catches the light';
      }
      if (type.startsWith('custom-')) {
        const name = voiceName(type);
        const returning = seen.has(name);
        seen.add(name);
        if (index === last && VOICE_CLOSERS[name]) {
          return VOICE_CLOSERS[name];
        }
        if (returning) {
          return VOICE_RETURNS[name] || `the ${name} returns`;
        }
        return VOICE_STEPS[name] || `${name} speaks`;
      }
      if (index === 0) {
        return 'the telling opens';
      }
      return index === last ? 'the telling settles' : 'the telling gathers';
    })
    .join('; ');
}

/* =prev / =next are labeled bias edges (bias-product registry, workbench
   bb1ffe6) — the serial's directed lean along its own spine, read in the
   mount sense: the neighbor chapter's canon lives at that path. First
   adoption of the labeled form in this repo. */
function emitSpine(sections, chapterNumber, chapterCount) {
  const chapterId = pad(chapterNumber);
  const lines = [`^[chapter/${chapterId}/spine]{`];
  if (chapterNumber > 1) {
    const prev = pad(chapterNumber - 1);
    lines.push(`  =prev{ ~".spw/chapters/${prev}.spw#chapter_${prev}" }`);
  }
  if (chapterNumber < chapterCount) {
    const next = pad(chapterNumber + 1);
    lines.push(`  =next{ ~".spw/chapters/${next}.spw#chapter_${next}" }`);
  }
  lines.push(`  weave: "${weaveGlyphs(sections)}"`);
  lines.push(`  reading: "${weaveReading(sections)}"`);
  lines.push('}');
  return lines.join('\n');
}

/* Cast entries are capsules, like the sections that summon them — each
   voice is a directed insert into the chapter, not part of its prose body.
   .enters is ground (intrinsic structural fact: first appearance). */
function emitCast(sections, chapterId) {
  const seen = new Map();
  sections.forEach((section, index) => {
    const type = String(section?.type || '');
    if (!type.startsWith('custom-')) {
      return;
    }
    const name = voiceName(type);
    if (!seen.has(name)) {
      seen.set(name, sectionHandle(section, index));
    }
  });

  if (!seen.size) {
    return null;
  }

  const lines = [`&[chapter/${chapterId}/cast]{`];
  seen.forEach((handle, name) => {
    const register = VOICE_REGISTERS[name] || 'uncatalogued voice; listen before indexing';
    lines.push(`  ${name}: <`);
    lines.push(`    register: "${register.replace(/"/g, '\\"')}"`);
    lines.push(`    .enters: "${handle}"`);
    lines.push('  >');
  });
  lines.push('}');
  return lines.join('\n');
}

function emitMeasures(sections, chapterId) {
  const voices = new Set();
  let prose = 0;
  let plates = 0;
  sections.forEach((section) => {
    const type = String(section?.type || 'section');
    if (type.startsWith('custom-')) {
      voices.add(voiceName(type));
    } else if (type === 'figure') {
      plates += 1;
    } else {
      prose += 1;
    }
  });

  return [
    `%[chapter/${chapterId}/measures]{`,
    `  %sections: ${sections.length}`,
    `  %prose: ${prose}`,
    `  %plates: ${plates}`,
    `  %voices: ${voices.size}`,
    '}'
  ].join('\n');
}

function emitChapterSpw(data, chapterCount) {
  const chapterNumber = Number(data?.chapterNumber || 0);
  const chapterId = pad(chapterNumber);
  const title = String(data?.title || `Chapter ${chapterId}`).replace(/"/g, '\\"');
  const description = oneLine(data?.description || '', 240).replace(/"/g, '\\"');
  const mood = String(data?.mood || '');
  const period = String(data?.period || '');
  const sections = Array.isArray(data?.sections) ? data.sections : [];

  const lines = [];
  lines.push(`# Chapter ${chapterId} Canon Reference`);
  lines.push(`# Generated from /book/chapter/${chapterId}/index.html#chapter-data`);
  lines.push('# Long-form Spw reference for extension, adaptation, and chapter-semantic diffs.');
  lines.push(`#>chapter_${chapterId}`);
  lines.push('#:chapter-canon #!reference');
  lines.push('');

  lines.push(`^[chapter/${chapterId}]{`);
  lines.push(`  title: "${title}"`);
  if (description) {
    lines.push(`  description: "${description}"`);
  }
  if (mood) {
    lines.push(`  mood: "${mood}"`);
  }
  if (period) {
    lines.push(`  period: "${period}"`);
  }
  lines.push(`  chapter_path: "/book/chapter/${chapterId}/"`);
  lines.push('}');
  lines.push('');

  lines.push(`&[chapter/${chapterId}/routes]{`);
  lines.push(`  web: "/book/chapter/${chapterId}/"`);
  lines.push(`  timeline: "/book/timeline.html#chapter-${chapterId}"`);
  lines.push(`  motif: ~[motif/chapter-${chapterId}]{optional}`);
  lines.push('}');
  lines.push('');

  lines.push(emitSpine(sections, chapterNumber, chapterCount));
  lines.push('');

  /* Ordered, indexable, homogeneous — a frame, not a body (matches the
     ^"stages"[...] precedent in .spw/runtime/precipitates.spw). */
  lines.push(`^[chapter/${chapterId}/sections][`);
  if (!sections.length) {
    lines.push('  empty: true');
  } else {
    sections.forEach((section, index) => {
      lines.push(emitSection(section, chapterNumber, index));
    });
  }
  lines.push(']');
  lines.push('');

  const cast = emitCast(sections, chapterId);
  if (cast) {
    lines.push(cast);
    lines.push('');
  }

  lines.push(emitMeasures(sections, chapterId));
  lines.push('');

  lines.push(`#[chapter/${chapterId}/lore]{`);
  lines.push(emitLoreItems(data?.lore?.loreItems));
  lines.push('}');
  lines.push('');

  lines.push(`~[chapter/${chapterId}/adaptation]{`);
  lines.push('  intent: "Readable raw text first, interactive runtime second."');
  lines.push('  extension_rule: "Prefer additive section handles over mutating existing handle meaning."');
  lines.push('  test_probe: "lore:spw-selection + lore:ebook-section-change"');
  lines.push('}');

  return `${lines.join('\n')}\n`;
}

function main() {
  const chapterDirs = fs
    .readdirSync(CHAPTER_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  if (!chapterDirs.length) {
    throw new Error('No chapter directories found.');
  }

  const summary = [];
  chapterDirs.forEach((chapterId) => {
    const data = readChapterJson(path.join(CHAPTER_ROOT, chapterId, 'index.html'));
    const outputPath = path.join(OUTPUT_ROOT, `${chapterId}.spw`);
    fs.writeFileSync(outputPath, emitChapterSpw(data, chapterDirs.length), 'utf8');

    summary.push({
      id: chapterId,
      title: data?.title || '',
      sections: Array.isArray(data?.sections) ? data.sections.length : 0
    });
  });

  const lines = [];
  lines.push('# Chapter Canon Index');
  lines.push('#>chapter_canon_index');
  lines.push('#:chapter-canon #!index');
  lines.push('');
  /* Ordered, indexable, homogeneous — a frame, matching the sections list
     above and the ^"stages"[...] precedent in precipitates.spw. */
  lines.push('&[chapters][');
  summary.forEach((item) => {
    lines.push(`  c${item.id}: {`);
    lines.push(`    title: "${String(item.title).replace(/"/g, '\\"')}"`);
    lines.push(`    &file: @spw/chapters/${item.id}.spw`);
    lines.push(`    sections: ${item.sections}`);
    lines.push('  }');
  });
  lines.push(']');
  lines.push('');
  lines.push('^[routes]{');
  summary.forEach((item) => {
    lines.push(`  "chapter-${item.id}": "#>chapter_${item.id}"`);
  });
  lines.push('}');
  lines.push('');

  /* Hand-authored neighbor — this exporter regenerates every NN.spw and
     this index, never the apocrypha shelf. The reflexive bias reads in the
     mount sense: the shelf's canon lives there. */
  lines.push('~[apocrypha]{');
  lines.push('  ={ ~".spw/chapters/apocrypha.spw#chapter_apocrypha" }');
  lines.push('  note: "Hand-authored companion shelf; spw:export leaves it untouched."');
  lines.push('}');
  lines.push('');

  fs.writeFileSync(path.join(OUTPUT_ROOT, 'index.spw'), `${lines.join('\n')}\n`, 'utf8');
}

main();
