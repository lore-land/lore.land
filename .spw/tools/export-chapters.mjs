import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CHAPTER_ROOT = path.join(ROOT, 'book', 'chapter');
const OUTPUT_ROOT = path.join(ROOT, '.spw', 'chapters');

function pad(num) {
  return String(num).padStart(2, '0');
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

function emitChapterSpw(data) {
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
    fs.writeFileSync(outputPath, emitChapterSpw(data), 'utf8');

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

  fs.writeFileSync(path.join(OUTPUT_ROOT, 'index.spw'), `${lines.join('\n')}\n`, 'utf8');
}

main();
