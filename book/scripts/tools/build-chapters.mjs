import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderChapterBody, renderChapterCoda, padChapterNumber, chapterOrdinal, sectionSlug, wonderTermPattern, resolveSlots } from '../modules/chapter-render.mjs';
import { isCustomElementType, storyVoiceFor } from '../modules/story-lexicon.mjs';
import { leanFor } from '../modules/valence-lens.mjs';
import { MATERIALS, materialScores } from '../modules/materials.mjs';
import { describeChapter, chapterInventory, renderChapterInventory, spellProblems } from '../modules/chapter-spell.mjs';
import { CANON_REFUSALS } from '../../schema/book-types.mjs';
import { parse as parseSpw } from '../vendor/spw-seed.mjs';
import { createMiniDocument } from './mini-dom.mjs';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOL_DIR, '../../..');
const CONTENT_DIR = resolve(ROOT, 'book/content/chapters');
const TEMPLATE_PATH = resolve(ROOT, 'book/templates/chapter.html');
const RELEASE = '2026_11_09.J';
const REFERENCES_PATH = resolve(ROOT, 'book/content/world/references.json');
const SHELF_LIST_PATH = resolve(ROOT, 'book/content/world/shelf-list.json');
const SERIAL_PATH = resolve(ROOT, 'book/content/serial.json');
const ALMANAC_PATH = resolve(ROOT, 'book/content/world/almanac.json');
const EXTENT_PATH = resolve(ROOT, 'book/scripts/modules/book-extent.mjs');
const WORLD_DIR = resolve(ROOT, 'book/content/world');

const escapeAttribute = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const render = (template, values) => Object.entries(values).reduce(
  (page, [key, value]) => page.replaceAll(`{{${key}}}`, value),
  template
);

const template = await readFile(TEMPLATE_PATH, 'utf8');
const filenames = (await readdir(CONTENT_DIR))
  .filter((name) => /^\d{2}\.json$/.test(name))
  .sort();

// Book One is thirteen chambers; the serial only ever grows past it, one stone at a time.
if (filenames.length < 13 || filenames.some((name, index) => Number(name.slice(0, 2)) !== index + 1)) {
  throw new Error(`Expected chapter files 01..NN (at least 13) in ${CONTENT_DIR}; found ${filenames.join(', ')}.`);
}

const references = JSON.parse(await readFile(REFERENCES_PATH, 'utf8'));
const shelfList = JSON.parse(await readFile(SHELF_LIST_PATH, 'utf8'));
const serial = JSON.parse(await readFile(SERIAL_PATH, 'utf8'));
const almanac = JSON.parse(await readFile(ALMANAC_PATH, 'utf8'));
// What a chapter's Spw description and inventory are read against (chapter-spell.mjs).
const [characters, palettes, berries, harmonies] = await Promise.all(['characters', 'palettes', 'berries', 'harmonies']
  .map(async (name) => JSON.parse(await readFile(resolve(WORLD_DIR, `${name}.json`), 'utf8'))));
const wonders = (almanac.wonders || []).map(({ id, kind, terms }) => ({ id, kind, terms }));
const wonderNames = Object.fromEntries((almanac.wonders || []).map((w) => [w.id, w.name]));
/* Releasing the story a room at a time (.spw/surfaces/rooms.spw): a section
 * marked "status": "drafting" is published as its door — type, signature,
 * air and due date — and nothing else. Its title and prose stay out of the
 * page, #chapter-data, search.json and semantic.json until the maker sets it. */
const publishedChapter = (chapter) => ({
  ...chapter,
  sections: (chapter.sections || []).map((section) => (section.status === 'drafting'
    ? { type: section.type, status: 'drafting', due: section.due, room: section.room }
    : section))
});
const chapters = await Promise.all(filenames.map(async (filename) => (
  publishedChapter(JSON.parse(await readFile(resolve(CONTENT_DIR, filename), 'utf8')))
)));
/* Which chapters name each wonder (canonical text, slots resolved), so a
 * chapter's colophon can say where else its wonders live. */
const canonicalProse = (block) => {
  const out = [];
  const walk = (node) => (Array.isArray(node?.content) ? node.content : []).forEach((item) => {
    if (item.type === 'paragraph') out.push(`${resolveSlots(item)}${(item.children || []).map((k) => k.text || '').join('')}`);
    else if (Array.isArray(item.content)) walk(item);
  });
  walk(block);
  return out.join(' ');
};
const wonderChapters = {};
chapters.forEach((chapter) => {
  const prose = chapter.sections.map(canonicalProse).join(' ');
  wonders.forEach((wonder) => {
    if (wonder.terms.some((term) => wonderTermPattern(term).test(prose))) {
      (wonderChapters[wonder.id] = wonderChapters[wonder.id] || []).push(chapter.chapterNumber);
    }
  });
});
const inWhichFor = (chapter) => chapter.inWhich || references.inWhich?.[String(chapter.chapterNumber)] || '';
const chapterHref = (number) => `/book/chapter/${padChapterNumber(number)}/`;

/** Prose goes into the page at build time; the browser only enhances it. */
const renderSlot = (render, data, options) => {
  const doc = createMiniDocument();
  const holder = doc.createElement('div');
  render(holder, data, { doc, ...options });
  return holder.children.map((node) => `    ${node.outerHTML}`).join('\n');
};

/* The chapter's body, and its Spw right after the end mark: the description
 * spell and the inventory of every expression it holds, collapsed (the
 * keepsakes slip in between at runtime). `marked` is filled by the body
 * render, so the inventory lists exactly the wonders marked on the page. */
const renderBodyWithSpell = (data, options, world) => {
  const doc = createMiniDocument();
  const holder = doc.createElement('div');
  renderChapterBody(holder, data, { doc, ...options });
  const description = describeChapter(data, world);
  [description.text, description.veiled].forEach((text, i) => {
    const problems = spellProblems(text, parseSpw);
    if (problems.length) {
      throw new Error(`Chapter ${data.chapterNumber}'s ${i ? 'veiled ' : ''}Spw description does not read whole: ${problems.join('; ')}\n${text}`);
    }
  });
  const inventory = chapterInventory(data, world, { marked: options.markedOut });
  // Generated words are held to the same canon as the prose (compass words, wages, the withheld name).
  const said = JSON.stringify({ clauses: description.clauses, items: inventory.items.map(({ name, note, hint }) => ({ name, note, hint })) });
  CANON_REFUSALS.forEach((refusal) => {
    const match = said.match(refusal.pattern);
    if (match) throw new Error(`Chapter ${data.chapterNumber}'s Spw inventory says "${match[0]}" — ${refusal.why}`);
  });
  const shelf = doc.createElement('div');
  const node = renderChapterInventory(shelf, { description, inventory }, { doc });
  const end = holder.childNodes.findIndex((child) => child.nodeType === 1 && child.className === 'chapter-end-mark');
  holder.childNodes.splice(end < 0 ? holder.childNodes.length : end + 1, 0, node);
  return holder.children.map((child) => `    ${child.outerHTML}`).join('\n');
};

/* The catalog: every chapter's number, title, question and door, for the
 * Scriptorium desk, the offline shelf, and any sibling site that lists us. */
const catalog = {
  note: 'Generated by book/scripts/tools/build-chapters.mjs — do not edit by hand.',
  release: RELEASE,
  cadence: serial.cadence,
  books: serial.books,
  next: serial.next,
  chapters: chapters.map((chapter) => ({
    number: chapter.chapterNumber,
    title: chapter.title,
    inWhich: inWhichFor(chapter),
    rooms: (chapter.sections || []).filter((section) => section.room).length,
    href: chapterHref(chapter.chapterNumber),
    card: `/book/images/og/chapter-${padChapterNumber(chapter.chapterNumber)}.jpg`
  }))
};
await writeFile(resolve(ROOT, 'book/content/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);

/* Every chapter, in order (book/timeline.html): written from the catalog with every build, so the list a
 * chapter's rail, the desk and the contents send readers to is never older than the book. */
const escHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const timelineBooks = catalog.books.map((book) => {
  const list = catalog.chapters.filter((c) => c.number >= book.first && (book.last == null || c.number <= book.last));
  return `      <section class="timeline-book" aria-labelledby="book-${book.number}">
        <h2 id="book-${book.number}">Book ${book.number === 1 ? 'One' : book.number === 2 ? 'Two' : book.number} · ${escHtml(book.title)}</h2>
        <ol class="timeline-list" start="${book.first}">
${list.map((c) => `          <li><a href="${c.href}"><span class="timeline-title">${escHtml(c.title)}</span></a>${c.inWhich ? ` <span class="timeline-in-which">in which ${escHtml(c.inWhich)}</span>` : ''}</li>`).join('\n')}
        </ol>
      </section>`;
}).join('\n');
const nextLine = catalog.next ? `Chapter ${catalog.next.chapter} is set for ${new Date(`${catalog.next.date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}.` : '';
await writeFile(resolve(ROOT, 'book/timeline.html'), `<!DOCTYPE html>
<html lang="en" data-cache-release="${RELEASE}" data-cache-context="timeline" data-theme="paper">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Every chapter, in order · Lore.Land</title>
  <meta name="description" content="Every chapter of Lore.Land in order, each with the line that says what happens in it. ${escHtml(catalog.cadence)}">
  <meta name="theme-color" content="#f3ede1">
  <link rel="canonical" href="https://lore.land/book/timeline.html">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/book/pwa/icons/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/book/pwa/icons/apple-touch-icon.png">
  <link rel="preload" href="/book/fonts/jetbrains-mono/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/book/styles/core/fonts.css?v=${RELEASE}&ctx=canon:fonts">
  <link rel="stylesheet" href="/book/styles/core/layers.css?v=${RELEASE}&ctx=canon:baseline">
  <link rel="stylesheet" href="/book/styles/core/tokens.css?v=${RELEASE}&ctx=canon:baseline">
  <link rel="stylesheet" href="/book/styles/core/themes.css?v=${RELEASE}&ctx=canon:baseline">
  <link rel="stylesheet" href="/book/styles/core/reset.css?v=${RELEASE}&ctx=canon:baseline">
  <link rel="stylesheet" href="/book/styles/core/typography.css?v=${RELEASE}&ctx=home:scene">
  <link rel="stylesheet" href="/book/styles/home/hub.css?v=${RELEASE}&ctx=home:hub">
  <style>
    .timeline-list { padding-left: 1.6rem; }
    .timeline-list li { margin: 0.35rem 0; max-width: 44rem; }
    .timeline-title { font-weight: 600; }
    .timeline-in-which { color: var(--hub-muted, #5a5a5a); font-style: italic; }
  </style>
</head>
<body data-surface="monument" data-current-scene="timeline">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="hub-shell">
    <header class="hub-topbar">
      <a class="hub-mark" href="/">Lore.Land</a>
      <nav class="hub-nav" aria-label="Primary">
        <a href="/book/chapter/01/">Read</a>
        <a href="/#chambers">Chapters</a>
        <a href="/pie/">Play</a>
        <a href="/almanac/">Almanac</a>
        <a href="/scriptorium/">Scriptorium</a>
        <a href="/folios/">Folios</a>
        <a href="/zine/">Broadside</a>
        <a href="/world/civic-magic.html">The world</a>
      </nav>
    </header>
    <main id="main-content" class="hub-main">
      <section class="hub-hero" aria-labelledby="timeline-title">
        <p class="hub-eyebrow">The book, from the first page</p>
        <h1 id="timeline-title">Every chapter, in order</h1>
        <p class="hub-lede">${escHtml(catalog.cadence)} ${escHtml(nextLine)}</p>
      </section>
${timelineBooks}
    </main>
    <footer class="hub-footer">
      <p>Raised by <a href="https://spwashi.com/?from=lore.land" rel="noopener noreferrer">Spwashi</a></p>
      <p class="hub-footer-note">Story first · process in the grain · marks stay marked</p>
    </footer>
  </div>
</body>
</html>
`);

/* The book's extent, for runtime modules that count chambers (navigation,
 * the constellation, seals, the desk, the offline shelf). Imported without a
 * ?v= token on purpose: it changes with every stone, and the service worker's
 * release bump is what turns it over for returning readers. */
const extent = [
  '/* Generated by book/scripts/tools/build-chapters.mjs from book/content/serial.json — do not edit by hand. */',
  `export const TOTAL_CHAPTERS = ${chapters.length};`,
  '/** Book One is a ring of thirteen; each later book starts a new ring (a second day). */',
  'export const CHAMBERS_PER_RING = 13;',
  `export const BOOKS = Object.freeze(${JSON.stringify(serial.books)});`,
  `export const NEXT_STONE = Object.freeze(${JSON.stringify(serial.next || null)});`,
  'export const bookFor = (n) => BOOKS.find((book) => n >= book.first && (book.last == null || n <= book.last)) || BOOKS[0];',
  ''
].join('\n');
await writeFile(EXTENT_PATH, extent);

/* The search index: one entry per chamber of prose, addressed the way the
 * reader's browser will address it — a title slug for titled sections, the
 * runtime's positional id (chapter-NN-section-XX) for voices. */
const flowText = (block) => {
  if (!block) return '';
  const own = [block.type === 'paragraph' ? resolveSlots(block) : block.text, typeof block.content === 'string' ? block.content : ''].filter(Boolean).join(' ');
  const inner = [...(Array.isArray(block.content) ? block.content : []), ...(block.children || [])]
    .filter((child) => child.type !== 'figure')
    .map(flowText).join(' ');
  return `${own} ${inner}`.replace(/\s+/g, ' ').trim();
};
const search = { note: 'Generated by build-chapters.mjs for the Scriptorium desk search.', release: RELEASE, entries: [] };

/* The semantic index: where every thread, mark, lean and voice runs across
 * the book, by chamber and section — what the constellation and the desk's
 * &[thread] spells navigate. Section ids match the page's own anchors. */
const semantic = {
  note: 'Generated by build-chapters.mjs — do not edit by hand. Section ids are the chapters\' own anchors.',
  release: RELEASE,
  chapters: chapters.map((c) => ({ n: c.chapterNumber, title: c.title, href: chapterHref(c.chapterNumber) })),
  threads: {},
  marks: { motif: {}, trope: {}, foreshadow: {} },
  leans: { boon: [], bane: [], bone: [] },
  // Where each almanac wonder is first named in a chapter (the marked place).
  wonders: {},
  // Living slots (PLAN.E L15): how many phrases breathe, by chapter and clock.
  slots: { minute: 0, hour: 0, day: 0, chapters: {} },
  // Other tellings (PLAN.E L24): how many ways each slot is told, by chapter.
  tellings: { total: 0, chapters: {} },
  voices: {},
  // Materials (materials.mjs): what each chamber is made of, by chapter — the strongest place for each.
  materials: Object.fromEntries(MATERIALS.map((m) => [m.id, { label: m.label, sigil: m.sigil, verb: m.verb, gloss: m.gloss, chapters: {} }]))
};
const paragraphsOf = (block) => {
  const out = [];
  const walk = (node) => (Array.isArray(node.content) ? node.content : []).forEach((item) => {
    if (item.type === 'paragraph') out.push({ text: `${resolveSlots(item)}${(item.children || []).map((k) => k.text || k.content || '').join('')}`, lean: item.lean });
    else if (Array.isArray(item.content)) walk(item);
  });
  walk(block);
  return out;
};
const termHits = (text, terms) => {
  const words = text.toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) || [];
  const set = new Set(terms.map((t) => t.toLowerCase()));
  return words.filter((w) => {
    const plain = w.replace(/[’']s$/, '');
    return set.has(plain) || set.has(plain.replace(/s$/, '')) || set.has(`${plain}s`);
  }).length;
};

for (const chapter of chapters) {
  const slug = padChapterNumber(chapter.chapterNumber);
  const used = new Set(['chapter-title', 'chapter-content']);
  let flowIndex = 0;
  const lexicon = chapter.lexicon || [];
  lexicon.forEach((group) => {
    const entry = semantic.threads[group.id] || (semantic.threads[group.id] = { labels: {}, href: group.href, chapters: {} });
    entry.labels[group.label] = (entry.labels[group.label] || 0) + 1;
  });
  const wondersFound = new Set();
  for (const block of chapter.sections) {
    const isFlow = block.type === 'section' || isCustomElementType(block.type);
    if (!isFlow) continue;
    flowIndex += 1;
    let id = `chapter-${slug}-section-${String(flowIndex).padStart(2, '0')}`;
    if (block.type === 'section' && block.title) {
      const titled = sectionSlug(block.title);
      if (titled && !used.has(titled)) {
        used.add(titled);
        id = titled;
      }
    }
    // A drafting room keeps its place in the count (its door is a section on the page) but nothing else.
    if (block.status === 'drafting') continue;
    // A voice's name alone repeats down a list; its opening words tell chambers apart.
    const opening = (paragraphsOf(block)[0]?.text || '').trim().split(/\s+/).slice(0, 4).join(' ').replace(/[,.;:!?]+$/, '');
    const kicker = storyVoiceFor(block.type)?.kicker || block.type.replace('custom-', '');
    const label = block.title || (opening ? `${kicker} · ${opening}…` : kicker);
    const text = flowText(block);
    search.entries.push({ c: chapter.chapterNumber, id, label, text });

    const where = { c: chapter.chapterNumber, id, label };
    // marks (the renderer gives custom-fool a default trope, so mirror that)
    const marks = { motif: block['data-motif'], trope: block['data-trope'] || (block.type === 'custom-fool' ? 'trickster' : undefined), foreshadow: block['data-foreshadow'] };
    Object.entries(marks).forEach(([kind, value]) => {
      if (!value) return;
      (semantic.marks[kind][value] = semantic.marks[kind][value] || []).push(where);
    });
    // slots: phrases that breathe here, by clock
    const countSlots = (node) => (Array.isArray(node?.content) ? node.content : []).forEach((item) => {
      if (item.type === 'paragraph' && item.slots) {
        Object.entries(item.slots).forEach(([name, slot]) => {
          const clock = ['minute', 'hour', 'day'].includes(slot.clock) ? slot.clock : 'hour';
          semantic.slots[clock] += 1;
          const key = String(chapter.chapterNumber);
          semantic.slots.chapters[key] = (semantic.slots.chapters[key] || 0) + 1;
          const told = Array.isArray(slot.variants) ? slot.variants.length : 0;
          (semantic.tellings.chapters[key] = semantic.tellings.chapters[key] || {})[name] = told;
          semantic.tellings.total += told;
        });
      } else if (Array.isArray(item.content)) countSlots(item);
    });
    countSlots(block);
    // wonders: the first section in this chapter that names each one
    const prose = paragraphsOf(block).map((p) => p.text).join(' ');
    wonders.forEach((wonder) => {
      if (wondersFound.has(wonder.id)) return;
      if (!wonder.terms.some((term) => wonderTermPattern(term).test(prose))) return;
      wondersFound.add(wonder.id);
      (semantic.wonders[wonder.id] = semantic.wonders[wonder.id] || []).push(where);
    });
    // voice
    const voice = block.type === 'section' ? 'narrator' : (storyVoiceFor(block.type)?.id || block.type.replace('custom-', ''));
    (semantic.voices[voice] = semantic.voices[voice] || []).push(where);
    // leans: how many paragraphs of this section lean each way
    const counts = { boon: 0, bane: 0, bone: 0 };
    paragraphsOf(block).forEach((p) => { const lean = leanFor(p.text, p.lean); if (lean) counts[lean] += 1; });
    Object.entries(counts).forEach(([lean, n]) => { if (n) semantic.leans[lean].push({ ...where, n }); });
    // materials: hits per material; each chapter keeps its total and its strongest chamber
    Object.entries(materialScores(paragraphsOf(block).map((p) => p.text).join(' '))).forEach(([material, n]) => {
      if (!n) return;
      const key = String(chapter.chapterNumber);
      const entry = semantic.materials[material].chapters[key] || (semantic.materials[material].chapters[key] = { n: 0, id, label, best: 0 });
      entry.n += n;
      if (n > entry.best) Object.assign(entry, { id, label, best: n });
    });
    // threads: word hits per lexicon group
    lexicon.forEach((group) => {
      const n = termHits(text, group.terms || []);
      if (!n) return;
      const entry = semantic.threads[group.id];
      (entry.chapters[String(chapter.chapterNumber)] = entry.chapters[String(chapter.chapterNumber)] || []).push({ id, label, n });
    });
  }
}
Object.values(semantic.threads).forEach((entry) => {
  entry.label = Object.entries(entry.labels).sort((a, b) => b[1] - a[1])[0][0];
  delete entry.labels;
});
Object.values(semantic.leans).forEach((list) => list.sort((a, b) => b.n - a.n || a.c - b.c));

/* The pages, after the semantic index: each chapter's Spw description and
 * inventory (chapter-spell.mjs) read its materials and where its wonders are
 * marked. A chapter whose spell does not read whole is refused. */
const world = { almanac, semantic, characters, palettes, berries, harmonies };
for (const [index, filename] of filenames.entries()) {
  const slug = filename.slice(0, 2);
  const data = chapters[index];
  const expectedNumber = Number(slug);
  const previous = chapters[(index - 1 + chapters.length) % chapters.length];
  const next = chapters[(index + 1) % chapters.length];

  if (data.chapterNumber !== expectedNumber || !data.title || !data.description || !Array.isArray(data.sections)) {
    throw new Error(`${filename} does not satisfy the chapter content contract.`);
  }

  const pageTitle = `${data.title} · Lore.Land`;
  const canonicalUrl = `https://lore.land/book/chapter/${slug}/`;
  const logline = data.logline || data.description;
  const chapterDir = resolve(ROOT, `book/chapter/${slug}`);
  const marked = new Set();
  await mkdir(chapterDir, { recursive: true });

  const page = render(template, {
    RELEASE,
    PAGE_TITLE: escapeAttribute(pageTitle),
    DESCRIPTION: escapeAttribute(data.description),
    LOGLINE: escapeAttribute(logline),
    EPIGRAPH: escapeAttribute(data.epigraph || ''),
    CANONICAL_URL: canonicalUrl,
    // Share card = the chapter's plate set in the cover type (npm run assets:brand).
    OG_IMAGE: `https://lore.land/book/images/og/chapter-${slug}.jpg`,
    OG_IMAGE_ALT: escapeAttribute(`${chapterOrdinal(data.chapterNumber)}: ${data.title}, set over the chapter's painted plate. ${logline}`),
    CHAPTER_SLUG: slug,
    CHAPTER_HEADING: escapeAttribute(`Chapter ${slug}: ${data.title}`),
    CHAPTER_TITLE: escapeAttribute(data.title),
    CHAPTER_NUMBER: String(expectedNumber),
    // The chapter rides along explicitly, so the slip knows where the reader was even without a Referer.
    FEEDBACK_URL: `https://autonomous.feedback/lore.land?at=/book/chapter/${slug}/`,
    MOOD: escapeAttribute(data.mood || 'boon'),
    PREV_HREF: chapterHref(previous.chapterNumber),
    PREV_NUMBER: padChapterNumber(previous.chapterNumber),
    PREV_TITLE: escapeAttribute(previous.title),
    NEXT_HREF: chapterHref(next.chapterNumber),
    NEXT_NUMBER: padChapterNumber(next.chapterNumber),
    NEXT_TITLE: escapeAttribute(next.title),
    CHAPTER_EDGE: index === 0 ? 'first' : index === chapters.length - 1 ? 'last' : 'middle',
    CHAPTER_BODY: renderBodyWithSpell(data, {
      wonders,
      wonderNames,
      markedOut: marked,
      inWhich: inWhichFor(data),
      next: {
        number: next.chapterNumber,
        title: next.title,
        inWhich: inWhichFor(next),
        href: chapterHref(next.chapterNumber),
        wraps: index === chapters.length - 1,
        upcoming: index === chapters.length - 1 ? serial.next : null
      },
      stacks: {
        entries: shelfList.chapters?.[String(data.chapterNumber)] || [],
        search: shelfList.search
      }
    }, world),
    CHAPTER_CODA: renderSlot(renderChapterCoda, data, {
      wonders: [...marked].map((id) => ({
        id,
        kind: wonders.find((w) => w.id === id)?.kind,
        name: wonderNames[id] || id,
        lives: (wonderChapters[id] || []).map(padChapterNumber).join(' · ')
      }))
    }),
    CHAPTER_DATA: JSON.stringify(data, null, 2).replaceAll('<', '\\u003c')
  });

  await writeFile(resolve(chapterDir, 'index.html'), page);
}

await writeFile(resolve(ROOT, 'book/content/search.json'), `${JSON.stringify(search)}\n`);
await writeFile(resolve(ROOT, 'book/content/semantic.json'), `${JSON.stringify(semantic)}\n`);

console.log(`Generated ${filenames.length} chapter pages from portable JSON canon (${RELEASE}).`);
