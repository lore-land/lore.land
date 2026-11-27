/**
 * chapter/motifs.mjs — Optional Midjourney motif vault panel, ambient motif overlay,
 * and per-chapter sigil module mounting.
 */
import { withCacheContext } from '../modules/cache-context.mjs?v=2026_11_16.B';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';
import { chapterSeedMap } from '../home/seeds.mjs?v=2026_11_08.N';
import { withSiteBase } from '../modules/spw-routing.mjs?v=2026_03_02.A';

const CHAPTER_SEED_LOOKUP = chapterSeedMap(TOTAL_CHAPTERS, '01');

/* import.meta.glob is a Vite build-time construct; the deployed site serves
 * these modules raw, where calling it throws before anything renders. Under
 * raw ESM we fall back to a plain dynamic import in mountChapterSigil. */
let CHAPTER_SIGIL_MODULES = null;
try {
  CHAPTER_SIGIL_MODULES = import.meta.glob('../../chapter/*/sigil.mjs');
} catch {
  CHAPTER_SIGIL_MODULES = null;
}

export function resolveChapterMotif(chapterNumber) {
  return CHAPTER_SEED_LOOKUP.get(Number(chapterNumber)) || null;
}

export function setChapterMotifOverlay(seed, enabled) {
  const chapterContent = document.getElementById('chapter-content');
  if (!chapterContent || !seed) {
    return;
  }

  if (enabled) {
    chapterContent.style.setProperty('--chapter-motif-url', `url("${seed.src}")`);
    document.body.dataset.motifOverlay = 'on';
  } else {
    chapterContent.style.removeProperty('--chapter-motif-url');
    document.body.dataset.motifOverlay = 'off';
  }
}

export function setupMotifDiscovery(data, announce) {
  const aside = document.querySelector('aside');
  const chapterId = String(data.chapterNumber || '').padStart(2, '0');
  const seed = resolveChapterMotif(data.chapterNumber);

  if (!aside || !chapterId || !seed) {
    return;
  }

  const existing = aside.querySelector('.chapter-motif-discovery');
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement('section');
  panel.className = 'chapter-motif-discovery';
  panel.dataset.component = 'chapter-motif-discovery';
  panel.dataset.seedDimension = seed.dimension;
  panel.setAttribute('aria-label', `Optional motif discovery for chapter ${chapterId}`);

  const heading = document.createElement('h2');
  heading.textContent = 'Optional Motif Vault';

  const intro = document.createElement('p');
  intro.textContent = 'Colloquial chapter art remains default. Reveal a Midjourney motif when you want extra texture.';

  const phrase = document.createElement('pre');
  phrase.className = 'motif-spw';
  phrase.textContent = `~[motif/${seed.dimension}]{chapter/${chapterId}::discover}`;

  const controls = document.createElement('div');
  controls.className = 'motif-controls';

  const revealButton = document.createElement('button');
  revealButton.type = 'button';
  revealButton.className = 'motif-reveal';
  revealButton.setAttribute('aria-expanded', 'false');
  revealButton.textContent = 'Reveal motif';

  const ambientButton = document.createElement('button');
  ambientButton.type = 'button';
  ambientButton.className = 'motif-ambient';
  ambientButton.textContent = 'Use as ambient texture';
  ambientButton.disabled = true;
  ambientButton.setAttribute('aria-pressed', 'false');

  controls.append(revealButton, ambientButton);

  const figure = document.createElement('figure');
  figure.className = 'motif-preview';
  figure.hidden = true;

  const image = document.createElement('img');
  image.src = seed.src;
  image.alt = `${seed.label} optional Midjourney motif for chapter ${chapterId}`;
  image.loading = 'lazy';
  image.decoding = 'async';

  const caption = document.createElement('figcaption');
  caption.textContent = `${seed.label} • Set ${seed.setId} • optional discovery layer`;

  figure.append(image, caption);
  panel.append(heading, intro, phrase, controls, figure);
  aside.append(panel);

  let revealed = false;
  let ambient = false;

  revealButton.addEventListener('click', () => {
    revealed = !revealed;
    figure.hidden = !revealed;
    panel.dataset.discovered = revealed ? 'true' : 'false';
    revealButton.setAttribute('aria-expanded', revealed ? 'true' : 'false');
    revealButton.textContent = revealed ? 'Hide motif' : 'Reveal motif';
    ambientButton.disabled = !revealed;

    if (!revealed && ambient) {
      ambient = false;
      ambientButton.setAttribute('aria-pressed', 'false');
      ambientButton.textContent = 'Use as ambient texture';
      setChapterMotifOverlay(seed, false);
    }

    if (announce) {
      announce(
        revealed
          ? `${seed.label} motif revealed for chapter ${chapterId}.`
          : 'Motif hidden. Default chapter art remains primary.'
      );
    }
  });

  ambientButton.addEventListener('click', () => {
    if (!revealed) {
      return;
    }

    ambient = !ambient;
    ambientButton.setAttribute('aria-pressed', ambient ? 'true' : 'false');
    ambientButton.textContent = ambient ? 'Ambient texture active' : 'Use as ambient texture';
    setChapterMotifOverlay(seed, ambient);

    if (announce) {
      announce(
        ambient
          ? `Ambient motif texture enabled: ${seed.label}.`
          : 'Ambient motif texture disabled.'
      );
    }
  });
}

export async function mountChapterSigil(data, announce) {
  const aside = document.querySelector('aside');
  if (!aside || !data.chapterNumber) {
    return;
  }

  const chapterId = String(data.chapterNumber).padStart(2, '0');
  const modulePath = `../../chapter/${chapterId}/sigil.mjs`;
  const loadModule = CHAPTER_SIGIL_MODULES
    ? CHAPTER_SIGIL_MODULES[modulePath]
    : () => import(withCacheContext(withSiteBase(`/book/chapter/${chapterId}/sigil.mjs`), { channel: 'sigil' }));

  if (!loadModule) {
    console.warn(`No chapter sigil module is registered for chapter ${chapterId}.`);
    return;
  }

  try {
    const module = await loadModule();
    if (module && typeof module.registerChapterSigil === 'function') {
      module.registerChapterSigil(aside);
      if (announce) {
        announce(`Chapter ${chapterId} sigil loaded.`);
      }
    }
  } catch (error) {
    console.warn(`Unable to load chapter sigil module for chapter ${chapterId}:`, error);
  }
}
