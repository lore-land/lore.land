import { withSiteBase } from './spw-routing.mjs?v=2026_03_02.A';
import { TOTAL_CHAPTERS } from './book-extent.mjs';

const DEFAULT_TOTAL_CHAPTERS = TOTAL_CHAPTERS;

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

/* The chapters a reader has set aside (way-through.mjs): a link's for this visit, or the reader's own while the
 * switch is on. Empty for everyone else, and in a build, so the prerendered page is the book as it stands. */
function asideChapters() {
  if (typeof window === 'undefined') return [];
  try {
    const visit = JSON.parse(window.sessionStorage.getItem('lore.way.visit') || 'null');
    const on = document.documentElement.getAttribute('data-switch-way-through') === 'on';
    const way = visit || (on ? JSON.parse(window.localStorage.getItem('lore.way.v1') || 'null') : null);
    return (way?.now || way?.aside || []).map(Number);
  } catch {
    return [];
  }
}

export function deriveChapterLinks(data, options = {}) {
  const total = Number(options.totalChapters) || DEFAULT_TOTAL_CHAPTERS;
  const current = Number(data?.chapterNumber) || 1;
  const aside = asideChapters();
  const step = (dir) => {
    for (let i = 1; i <= total; i += 1) {
      const n = ((current - 1 + dir * i + total * i) % total) + 1;
      if (!aside.includes(n)) return n;
    }
    return current;
  };
  const previous = step(-1);
  const next = step(1);
  const skipped = aside.length > 0;

  return {
    current,
    previous,
    next,
    previousHref: (!skipped && normalizeHref(data?.previousChapter)) || chapterPath(previous),
    nextHref: (!skipped && normalizeHref(data?.nextChapter)) || chapterPath(next)
  };
}
