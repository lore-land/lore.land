import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOL_DIR, '../../..');
const CONTENT_DIR = resolve(ROOT, 'book/content/chapters');
const TEMPLATE_PATH = resolve(ROOT, 'book/templates/chapter.html');
const RELEASE = '2026_07_19.A';

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

for (const filename of filenames) {
  const slug = filename.slice(0, 2);
  const source = await readFile(resolve(CONTENT_DIR, filename), 'utf8');
  const data = JSON.parse(source);
  const expectedNumber = Number(slug);

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
    OG_IMAGE: `https://lore.land/book/images/${slug}.png`,
    OG_IMAGE_ALT: escapeAttribute(`${data.title} — ${logline}`),
    CHAPTER_SLUG: slug,
    CHAPTER_HEADING: escapeAttribute(`Chapter ${slug}: ${data.title}`),
    MOOD: escapeAttribute(data.mood || 'boon'),
    CHAPTER_DATA: JSON.stringify(data, null, 2).replaceAll('<', '\\u003c')
  });

  await writeFile(resolve(chapterDir, 'index.html'), page);
}

console.log(`Generated ${filenames.length} chapter pages from portable JSON canon (${RELEASE}).`);
