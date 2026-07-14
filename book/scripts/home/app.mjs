/**
 * Monument entrance progressive enhancement.
 * Static HTML carries the full threshold path; this module only adds
 * service worker, optional announce region, and light reading polish.
 */
import {
  bootstrapExperience,
  enhanceLazyImages,
  registerStoryServiceWorker
} from '../modules/experience-core.mjs?v=2026_07_13.A';
import { injectSvgFilters } from '../modules/svg-filters.mjs';

const RESUME_KEY = 'lore.reading.resume-chapter';

function readResumeChapter() {
  try {
    const value = Number(window.localStorage.getItem(RESUME_KEY) || '0');
    return value >= 1 && value <= 13 ? value : 0;
  } catch {
    return 0;
  }
}

function markCurrentChapterInIndex() {
  const resume = readResumeChapter();
  if (!resume) {
    return;
  }

  const padded = String(resume).padStart(2, '0');
  const links = document.querySelectorAll('.hub-chapter-list a[href*="/book/chapter/"]');
  links.forEach((link) => {
    if (link.getAttribute('href')?.includes(`/chapter/${padded}`)) {
      link.dataset.resume = 'true';
      link.setAttribute('aria-current', 'true');
    }
  });
}

function enhancePrimaryCta() {
  const resume = readResumeChapter();
  if (resume <= 1) {
    return;
  }

  const primary = document.querySelector('.hub-hero .hub-cta-primary');
  if (!primary) {
    return;
  }

  const padded = String(resume).padStart(2, '0');
  const sub = document.createElement('span');
  sub.className = 'hub-cta-sub';
  sub.textContent = `Chapter ${padded}`;
  primary.href = `/book/chapter/${padded}/`;
  primary.replaceChildren(document.createTextNode('Continue reading'), sub);
  primary.setAttribute('aria-label', `Continue reading at chapter ${padded}`);
}

function initMonumentEntrance() {
  if (!document.body || document.body.dataset.surface !== 'monument') {
    return;
  }

  const { destroy: destroyBootstrap } = bootstrapExperience();
  registerStoryServiceWorker({ swPath: '/sw.js', scope: '/' });
  injectSvgFilters(document);
  enhanceLazyImages({ root: document });
  markCurrentChapterInIndex();
  enhancePrimaryCta();

  window.__loreCleanup = () => {
    destroyBootstrap();
  };
}

document.addEventListener('DOMContentLoaded', initMonumentEntrance);
