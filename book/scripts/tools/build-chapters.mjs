import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderChapterBody, renderChapterCoda, padChapterNumber, chapterOrdinal, sectionSlug } from '../modules/chapter-render.mjs';
import { isCustomElementType, storyVoiceFor } from '../modules/story-lexicon.mjs';
import { createMiniDocument } from './mini-dom.mjs';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOL_DIR, '../../..');
const CONTENT_DIR = resolve(ROOT, 'book/content/chapters');
const TEMPLATE_PATH = resolve(ROOT, 'book/templates/chapter.html');
const RELEASE = '2026_09_27.B';
const REFERENCES_PATH = resolve(ROOT, 'book/content/world/references.json');
const SHELF_LIST_PATH = resolve(ROOT, 'book/content/world/shelf-list.json');

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

if (filenames.length !== 13) {
  throw new Error(`Expected 13 chapter files in ${CONTENT_DIR}; found ${filenames.length}.`);
}

const references = JSON.parse(await readFile(REFERENCES_PATH, 'utf8'));
const shelfList = JSON.parse(await readFile(SHELF_LIST_PATH, 'utf8'));
const chapters = await Promise.all(filenames.map(async (filename) => (
  JSON.parse(await readFile(resolve(CONTENT_DIR, filename), 'utf8'))
)));
const inWhichFor = (chapter) => chapter.inWhich || references.inWhich?.[String(chapter.chapterNumber)] || '';
const chapterHref = (number) => `/book/chapter/${padChapterNumber(number)}/`;

/** Prose goes into the page at build time; the browser only enhances it. */
const renderSlot = (render, data, options) => {
  const doc = createMiniDocument();
  const holder = doc.createElement('div');
  render(holder, data, { doc, ...options });
  return holder.children.map((node) => `    ${node.outerHTML}`).join('\n');
};

for (const [index, filename] of filenames.entries()) {
  const slug = filename.slice(0, 2);
  const data = chapters[index];
  const expectedNumber = Number(slug);
  const previous = chapters[(index - 1 + chapters.length) % chapters.length];
  const next = chapters[(index + 1) % chapters.length];

  if (data.chapterNumber !== expectedNumber || !data.title || !data.description || !Array.isArray(data.sections)) {
    throw new Error(`${filename} does not satisfy the chapter content contract.`);
  }

  const pageTitle = `${data.title} | Lore.Land`;
  const canonicalUrl = `https://lore.land/book/chapter/${slug}/`;
  const logline = data.logline || data.description;
  const chapterDir = resolve(ROOT, `book/chapter/${slug}`);
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
    CHAPTER_BODY: renderSlot(renderChapterBody, data, {
      inWhich: inWhichFor(data),
      next: {
        number: next.chapterNumber,
        title: next.title,
        inWhich: inWhichFor(next),
        href: chapterHref(next.chapterNumber),
        wraps: index === chapters.length - 1
      },
      stacks: {
        entries: shelfList.chapters?.[String(data.chapterNumber)] || [],
        search: shelfList.search
      }
    }),
    CHAPTER_CODA: renderSlot(renderChapterCoda, data, {}),
    CHAPTER_DATA: JSON.stringify(data, null, 2).replaceAll('<', '\\u003c')
  });

  await writeFile(resolve(chapterDir, 'index.html'), page);
}

/* The catalog: every chapter's number, title, question and door, for the
 * Scriptorium desk, the offline shelf, and any sibling site that lists us. */
const catalog = {
  note: 'Generated by book/scripts/tools/build-chapters.mjs — do not edit by hand.',
  release: RELEASE,
  cadence: 'New chapters are set on the 13th and 26th of each month.',
  chapters: chapters.map((chapter) => ({
    number: chapter.chapterNumber,
    title: chapter.title,
    inWhich: inWhichFor(chapter),
    href: chapterHref(chapter.chapterNumber),
    card: `/book/images/og/chapter-${padChapterNumber(chapter.chapterNumber)}.jpg`
  }))
};
await writeFile(resolve(ROOT, 'book/content/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);

/* The search index: one entry per chamber of prose, addressed the way the
 * reader's browser will address it — a title slug for titled sections, the
 * runtime's positional id (chapter-NN-section-XX) for voices. */
const flowText = (block) => {
  if (!block) return '';
  const own = [block.text, typeof block.content === 'string' ? block.content : ''].filter(Boolean).join(' ');
  const inner = [...(Array.isArray(block.content) ? block.content : []), ...(block.children || [])]
    .filter((child) => child.type !== 'figure')
    .map(flowText).join(' ');
  return `${own} ${inner}`.replace(/\s+/g, ' ').trim();
};
const search = { note: 'Generated by build-chapters.mjs for the Scriptorium desk search.', release: RELEASE, entries: [] };
for (const chapter of chapters) {
  const slug = padChapterNumber(chapter.chapterNumber);
  const used = new Set(['chapter-title', 'chapter-content']);
  let flowIndex = 0;
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
    const label = block.title || storyVoiceFor(block.type)?.kicker || block.type.replace('custom-', '');
    search.entries.push({ c: chapter.chapterNumber, id, label, text: flowText(block) });
  }
}
await writeFile(resolve(ROOT, 'book/content/search.json'), `${JSON.stringify(search)}\n`);

console.log(`Generated ${filenames.length} chapter pages from portable JSON canon (${RELEASE}).`);
