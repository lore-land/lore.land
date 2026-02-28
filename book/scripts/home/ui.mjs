import { chapterHref, spwPrelude } from './data.mjs';
import { createFrameSvg } from './svg.mjs';

export function renderHero(root, chapterCount) {
  const panel = document.createElement('section');
  panel.className = 'hero-panel';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'hero-eyebrow';
  eyebrow.textContent = 'Spw Story Architecture';

  const title = document.createElement('h1');
  title.textContent = 'Lore.Land — 13 Chapters in Spw';

  const subtitle = document.createElement('p');
  subtitle.className = 'hero-subtitle';
  subtitle.textContent =
    'An abstract reading frame where each chapter opens as a compact Spw scene.';

  const stats = document.createElement('p');
  stats.className = 'hero-stats';
  stats.textContent = `${chapterCount} chapters • semantic flow • canonical timeline`;

  const prelude = document.createElement('pre');
  prelude.className = 'spw-block';
  prelude.textContent = spwPrelude;

  panel.append(eyebrow, title, subtitle, stats, prelude, createFrameSvg());
  root.append(panel);
}

export function renderTimeline(root, chapters) {
  const section = document.createElement('section');
  section.className = 'chapter-grid';
  section.setAttribute('aria-label', 'Thirteen chapter story flow');

  chapters.forEach((chapter) => {
    const card = document.createElement('article');
    card.className = 'chapter-card';

    const marker = document.createElement('span');
    marker.className = 'chapter-marker';
    marker.textContent = String(chapter.number).padStart(2, '0');

    const heading = document.createElement('h2');
    heading.textContent = chapter.title;

    const snippet = document.createElement('pre');
    snippet.className = 'spw-snippet';
    snippet.textContent = chapter.spw;

    const link = document.createElement('a');
    link.href = chapterHref(chapter.number);
    link.textContent = 'Open chapter';
    link.setAttribute('aria-label', `Open chapter ${chapter.number}: ${chapter.title}`);

    card.append(marker, heading, snippet, link);
    section.append(card);
  });

  root.append(section);
}
