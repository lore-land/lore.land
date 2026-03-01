const DEFAULT_TOTAL_CHAPTERS = 13;

export function chapterPath(number) {
  return `/book/chapter/${String(number).padStart(2, '0')}/`;
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
    previousHref: data?.previousChapter || chapterPath(previous),
    nextHref: data?.nextChapter || chapterPath(next)
  };
}
