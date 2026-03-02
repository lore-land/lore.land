import { withSiteBase } from './spw-routing.mjs?v=2026_03_02.A';

const DEFAULT_TOTAL_CHAPTERS = 13;

export function chapterPath(number) {
  return withSiteBase(`/book/chapter/${String(number).padStart(2, '0')}/`);
}

function normalizeHref(href) {
  const value = String(href || '').trim();
  if (!value) {
    return '';
  }
  return withSiteBase(value);
}

export function deriveChapterLinks(data, options = {}) {
  const total = Number(options.totalChapters) || DEFAULT_TOTAL_CHAPTERS;
  const current = Number(data?.chapterNumber) || 1;
  const previous = current > 1 ? current - 1 : total;
  const next = current < total ? current + 1 : 1;

  return {
    current,
    previous,
    next,
    previousHref: normalizeHref(data?.previousChapter) || chapterPath(previous),
    nextHref: normalizeHref(data?.nextChapter) || chapterPath(next)
  };
}
