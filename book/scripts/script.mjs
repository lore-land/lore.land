// scripts/script.mjs
import { withCacheContext } from './modules/cache-context.mjs?v=2026_02_28.I';
import { createLoadLifecycle } from './modules/load-lifecycle.mjs?v=2026_02_28.I';
import { CUSTOM_ELEMENTS_SELECTOR, isCustomElementType } from './modules/story-lexicon.mjs?v=2026_02_28.I';
import {
  bootstrapExperience,
  enhanceLazyImages,
  initAttentionDetails,
  initGenreCombinatorics,
  initSemanticShader,
  initSpatialPerspective,
  initSelectPreference,
  initProgressiveReveal,
  registerStoryServiceWorker
} from './modules/experience-core.mjs?v=2026_02_28.I';
import { initChapterProgression } from './modules/chapter-progression.mjs?v=2026_02_28.I';
import { chapterSeedMap } from './home/seeds.mjs?v=2026_02_28.I';
import { initSpwLanguageRuntime } from './modules/spw-interactions.mjs?v=2026_02_28.I';
import { initEbookNavigation } from './modules/ebook-navigation.mjs?v=2026_02_28.I';
import { deriveChapterLinks } from './modules/chapter-links.mjs?v=2026_02_28.I';
import { initSpwEthosIntegration } from './modules/spw-ethos.mjs?v=2026_02_28.I';

const CHAPTER_SEED_LOOKUP = chapterSeedMap(13, '01');

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', async () => {
  const { root, announce } = bootstrapExperience();
  registerStoryServiceWorker({ root, swPath: '/sw.js', scope: '/' });

  const lifecycle = createLoadLifecycle({
    id: 'chapter',
    shellSelector: '#chapter-content',
    spinnerDelayMs: 320,
    skeletonLines: 6
  });

  lifecycle.boon('preloader engaged');
  lifecycle.armBane('spinner + fallback');

  const chapterDataElement = document.getElementById('chapter-data');
  if (!chapterDataElement) {
    lifecycle.bane('missing chapter data');
    console.error('Chapter data not found.');
    return;
  }

  let chapterData;
  try {
    chapterData = JSON.parse(chapterDataElement.textContent);
  } catch (error) {
    lifecycle.bane('chapter data parse fallback');
    console.error('Error parsing chapter data:', error);
    return;
  }

  lifecycle.bone('skeletons loaded');

  try {
    initializeStyles(chapterData);
    populateMetadata(chapterData);
    populateContent(chapterData);
    setupNavigation(chapterData, announce);
    const ebookNav = initEbookNavigation(chapterData, { announce });
    setupAuthorAttribution(announce);
    setupLoreCollector(chapterData);
    setupPrimaryAction(chapterData);
    setupCustomElementsInteractions(chapterData);
    setupSpwHypertextRoutes(chapterData, announce);
    initSpwEthosIntegration({ context: 'chapter', container: document.querySelector('aside'), announce });
    setupTuningControls(announce);
    setupMotifDiscovery(chapterData, announce);
    await mountChapterSigil(chapterData, announce);
    initSpwLanguageRuntime({ root: document, announce });
    initAttentionDetails({ root });
    initSemanticShader({ root });
    initSpatialPerspective({ root });
    initGenreCombinatorics({ root, announce });
    initChapterProgression(chapterData, { announce });
    initProgressiveReveal({ root: document });

    if (ebookNav && announce) {
      announce(`Model ebook navigation ready: ${ebookNav.sectionCount} sections.`);
    }

    const chapterContent = document.getElementById('chapter-content');
    enhanceLazyImages({ root: chapterContent || document });
    const acoustics = lifecycle.bonk('acoustics + spacing check', chapterContent);
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);
  } catch (error) {
    lifecycle.bane('runtime fallback path');
    console.error('Chapter lifecycle failed:', error);
  }
});

/**
 * Initializes the period and mood stylesheets based on chapter data.
 * @param {Object} data - The chapter data object.
 */
function initializeStyles(data) {
  const periodStylesLink = document.getElementById('period-styles');
  const moodStylesLink = document.getElementById('mood-styles');
  const body = document.body;

  const period = data.period;
  const mood = data.mood;

  if (period) {
    periodStylesLink.href = withCacheContext(`/book/styles/periods/${period}.css`, {
      channel: `period-${period}`
    });
    body.setAttribute('data-period', period);
  } else {
    periodStylesLink.disabled = true; // Disable if no period is set
  }

  if (mood) {
    moodStylesLink.href = withCacheContext(`/book/styles/moods/${mood}.css`, {
      channel: `mood-${mood}`
    });
    body.setAttribute('data-mood', mood);
  } else {
    moodStylesLink.disabled = true; // Disable if no mood is set
  }
}

/**
 * Populates the page's metadata (title and description) based on chapter data.
 * @param {Object} data - The chapter data object.
 */
function populateMetadata(data) {
  const titleElement = document.getElementById('page-title');
  const descriptionElement = document.getElementById('page-description');

  if (titleElement) {
    titleElement.textContent = `${data.title} | Lore.Land`;
  }

  if (descriptionElement) {
    descriptionElement.setAttribute('content', data.description);
  }
}

/**
 * Populates the main content of the chapter based on the sections defined in chapter data.
 * @param {Object} data - The chapter data object.
 */
function populateContent(data) {
  const chapterContent = document.getElementById('chapter-content');
  if (!chapterContent) {
    console.error('Chapter content container not found.');
    return;
  }

  // Clear any existing content
  chapterContent.innerHTML = '';

  // Create and append the chapter heading
  const chapterHeading = document.createElement('h1');
  chapterHeading.textContent = `Chapter ${padChapterNumber(data.chapterNumber)}: ${data.title}`;
  chapterContent.appendChild(chapterHeading);

  const byline = document.createElement('p');
  byline.className = 'chapter-byline';
  byline.dataset.component = 'chapter-byline';

  const authorLink = document.createElement('a');
  authorLink.href = 'https://spwashi.com';
  authorLink.target = '_blank';
  authorLink.rel = 'noopener noreferrer';
  authorLink.dataset.spwExpression = 'true';
  authorLink.textContent = '^[author]{spwashi.com}';
  authorLink.setAttribute('aria-label', 'Open author site spwashi.com');

  const brandLink = document.createElement('a');
  brandLink.href = 'https://spwashi.click';
  brandLink.target = '_blank';
  brandLink.rel = 'noopener noreferrer';
  brandLink.dataset.spwExpression = 'true';
  brandLink.textContent = '~[toy-links]{spwashi.click}';
  brandLink.setAttribute('aria-label', 'Open Spwashi toy links page');

  byline.append('Stories written by ', authorLink, '. Brand toy links: ', brandLink, '.');
  chapterContent.appendChild(byline);

  // Iterate over each section and append to chapter content
  if (Array.isArray(data.sections)) {
    data.sections.forEach(section => {
      const sectionElement = createSectionElement(section);
      if (sectionElement) {
        chapterContent.appendChild(sectionElement);
      }
    });
  } else {
    console.warn('No sections found in chapter data.');
  }
}

/**
 * Pads the chapter number with a leading zero if necessary.
 * @param {number} number - The chapter number.
 * @returns {string} - The padded chapter number.
 */
function padChapterNumber(number) {
  return number.toString().padStart(2, '0');
}

/**
 * Creates a DOM element based on the section type.
 * @param {Object} section - The section data object.
 * @returns {HTMLElement|null} - The created DOM element or null if type is unrecognized.
 */
function createSectionElement(section) {
  if (!section || !section.type) {
    return null;
  }

  switch (section.type) {
    case 'paragraph':
      return createParagraph(section);
    case 'figure':
      return createFigure(section);
    case 'section':
      return createSection(section);
    default:
      if (isCustomElementType(section.type)) {
        return createCustomElement(section);
      }
      console.warn(`Unrecognized section type: ${section.type}`);
      return null;
  }
}

/**
 * Creates a paragraph element, handling any nested children.
 * @param {Object} section - The paragraph section data.
 * @returns {HTMLElement} - The created paragraph element.
 */
function createParagraph(section) {
  const p = document.createElement('p');

  if (section.text) {
    p.textContent = section.text;
  }

  if (section.children && Array.isArray(section.children)) {
    section.children.forEach(child => {
      if (isCustomElementType(child.type)) {
        const customElement = document.createElement(child.type);
        customElement.textContent = child.content;
        customElement.dataset.spwComponent = child.type;
        customElement.dataset.spwActionable = 'true';
        p.appendChild(customElement);
      } else if (child.type === 'text') {
        const textNode = document.createTextNode(child.text);
        p.appendChild(textNode);
      }
    });
  }

  return p;
}

/**
 * Creates a figure element with an image and caption.
 * @param {Object} section - The figure section data.
 * @returns {HTMLElement} - The created figure element.
 */
function createFigure(section) {
  const figure = document.createElement('figure');
  figure.className = 'chapter-figure';

  if (section.img) {
    const img = document.createElement('img');
    img.src = section.img.src;
    img.alt = section.img.alt || '';
    img.loading = section.img.loading || 'lazy';
    img.decoding = 'async';
    if (/\/book\/images\//.test(section.img.src)) {
      figure.dataset.visualDefault = 'colloquial';
    }
    figure.appendChild(img);
  }

  if (section.figcaption) {
    const figcaption = document.createElement('figcaption');
    figcaption.textContent = section.figcaption;
    figure.appendChild(figcaption);
  }

  return figure;
}

/**
 * Creates a section element with a heading and content.
 * @param {Object} section - The section data object.
 * @returns {HTMLElement} - The created section element.
 */
function createSection(section) {
  const sec = document.createElement('section');

  if (section.title) {
    const h2 = document.createElement('h2');
    h2.textContent = section.title;
    sec.appendChild(h2);
  }

  if (section.content && Array.isArray(section.content)) {
    section.content.forEach(contentItem => {
      const contentElement = createSectionElement(contentItem);
      if (contentElement) {
        sec.appendChild(contentElement);
      }
    });
  }

  return sec;
}

/**
 * Creates a custom element based on its type and content.
 * @param {Object} section - The custom element section data.
 * @returns {HTMLElement} - The created custom element.
 */
function createCustomElement(section) {
  const customElem = document.createElement(section.type);
  customElem.dataset.spwComponent = section.type;
  customElem.dataset.spwActionable = 'true';

  if (section.valence) {
    customElem.dataset.spwValence = section.valence;
  }

  Object.entries(section).forEach(([key, value]) => {
    if (key.startsWith('data-') && typeof value === 'string') {
      customElem.setAttribute(key, value);
    }
  });

  if (section.content && Array.isArray(section.content)) {
    section.content.forEach(contentItem => {
      const contentElement = createSectionElement(contentItem);
      if (contentElement) {
        customElem.appendChild(contentElement);
      }
    });
  }

  return customElem;
}

/**
 * Sets up the navigation buttons for previous and next chapters.
 * @param {Object} data - The chapter data object.
 */
function setupNavigation(data, announce) {
  const links = deriveChapterLinks(data);
  const previousLabel = `^[route/${String(links.previous).padStart(2, '0')}]{prev}`;
  const nextLabel = `^[route/${String(links.next).padStart(2, '0')}]{next}`;

  const prevControls = document.querySelectorAll('.chapter-navigation .prev');
  const nextControls = document.querySelectorAll('.chapter-navigation .next');

  prevControls.forEach((control) => {
    bindRouteControl(control, {
      href: links.previousHref,
      label: previousLabel,
      routeName: 'prev',
      ariaLabel: `Open chapter ${links.previous}`
    }, announce);
  });

  nextControls.forEach((control) => {
    bindRouteControl(control, {
      href: links.nextHref,
      label: nextLabel,
      routeName: 'next',
      ariaLabel: `Open chapter ${links.next}`
    }, announce);
  });

  setupKeyboardRoutes(links, announce);
}

function setupSpwHypertextRoutes(data, announce) {
  const aside = document.querySelector('aside');
  if (!aside) {
    return;
  }

  const existing = aside.querySelector('.spw-hypertext-routes');
  if (existing) {
    existing.remove();
  }

  const links = deriveChapterLinks(data);

  const section = document.createElement('section');
  section.className = 'spw-hypertext-routes';
  section.dataset.component = 'spw-hypertext-routes';
  section.setAttribute('aria-label', 'Spw hypertext routes');

  const heading = document.createElement('h2');
  heading.textContent = 'Spw Routes';

  const lead = document.createElement('p');
  lead.textContent = 'Hypertext routes in Spw form for learnable, composable navigation.';

  const shortcutHint = document.createElement('p');
  shortcutHint.className = 'spw-shortcut-hint';
  shortcutHint.textContent =
    'Shortcuts: Alt+Left = prev chapter, Alt+Right = next chapter, PageUp/PageDown = section, Alt+H = home, Alt+T = timeline.';

  const list = document.createElement('ul');

  const routeItems = [
    {
      label: `^[route/${String(links.previous).padStart(2, '0')}]{prev}`,
      href: links.previousHref,
      aria: `Open chapter ${links.previous}`
    },
    {
      label: `^[route/${String(links.next).padStart(2, '0')}]{next}`,
      href: links.nextHref,
      aria: `Open chapter ${links.next}`
    },
    {
      label: '&[timeline]{canon-sequence}',
      href: '/book/timeline.html',
      aria: 'Open canonical timeline'
    },
    {
      label: '~[seed-atlas]{visual motifs}',
      href: '/seeds/2026-28-02/',
      aria: 'Open seed atlas'
    },
    {
      label: '^[home]{lore.land}',
      href: '/',
      aria: 'Return to home'
    },
    {
      label: '^[author]{spwashi.com}',
      href: 'https://spwashi.com',
      aria: 'Open story author site'
    },
    {
      label: '~[toy-links]{spwashi.click}',
      href: 'https://spwashi.click',
      aria: 'Open Spwashi toy links page'
    }
  ];

  routeItems.forEach((item) => {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = item.href;
    anchor.textContent = item.label;
    anchor.setAttribute('aria-label', item.aria);
    anchor.dataset.spwRoute = item.label;
    anchor.dataset.spwExpression = 'true';
    if (/^https?:\/\//.test(item.href)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    anchor.addEventListener('focus', () => {
      if (announce) {
        announce(`Route focused: ${item.label}`);
      }
    });
    li.append(anchor);
    list.append(li);
  });

  section.append(heading, lead, shortcutHint, list);
  aside.append(section);
}

function setupTuningControls(announce) {
  const aside = document.querySelector('aside');
  if (!aside) {
    return;
  }

  let form = aside.querySelector('.chapter-tuning-controls');
  if (!form) {
    form = document.createElement('form');
    form.className = 'chapter-tuning-controls';
    form.dataset.component = 'chapter-tuning-controls';
    form.setAttribute('aria-label', 'Chapter tuning controls');
    form.setAttribute('action', '#');

    const label = document.createElement('label');
    label.setAttribute('for', 'chapter-tuning-select');

    const span = document.createElement('span');
    span.textContent = 'Tuning';
    label.append(span);

    const select = document.createElement('select');
    select.id = 'chapter-tuning-select';
    select.setAttribute('aria-label', 'Select tuning profile');

    [
      ['calm', 'calm'],
      ['focus', 'focus'],
      ['explore', 'explore']
    ].forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.append(option);
    });

    label.append(select);

    const guide = document.createElement('p');
    guide.className = 'chapter-tuning-guide';
    guide.textContent = 'Calm expands space. Focus balances contrast. Explore increases texture.';

    form.append(label, guide);
    aside.append(form);
  }

  initSelectPreference({
    select: form.querySelector('#chapter-tuning-select'),
    root: document.documentElement,
    datasetKey: 'tuning',
    preferenceName: 'tuning',
    defaultValue: 'focus',
    announce,
    announceLabel: 'Tuning'
  });
}

function setupAuthorAttribution(announce) {
  const aside = document.querySelector('aside');
  if (!aside) {
    return;
  }

  const existing = aside.querySelector('.story-attribution-panel');
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement('section');
  panel.className = 'story-attribution-panel';
  panel.dataset.component = 'story-attribution';
  panel.setAttribute('aria-label', 'Story authorship and brand links');

  const heading = document.createElement('h2');
  heading.textContent = 'Authorship';

  const summary = document.createElement('p');
  summary.textContent =
    'Lore.Land stories are written by spwashi.com. spwashi.click is the brand toy-links page.';

  const links = document.createElement('div');
  links.className = 'story-attribution-links';

  const author = document.createElement('a');
  author.href = 'https://spwashi.com';
  author.target = '_blank';
  author.rel = 'noopener noreferrer';
  author.dataset.spwExpression = 'true';
  author.textContent = '^[author]{spwashi.com}';
  author.setAttribute('aria-label', 'Open spwashi.com');

  const toys = document.createElement('a');
  toys.href = 'https://spwashi.click';
  toys.target = '_blank';
  toys.rel = 'noopener noreferrer';
  toys.dataset.spwExpression = 'true';
  toys.textContent = '~[toy-links]{spwashi.click}';
  toys.setAttribute('aria-label', 'Open spwashi.click');

  links.append(author, toys);
  panel.append(heading, summary, links);
  aside.append(panel);

  if (announce) {
    announce('Authorship links synced: spwashi.com and spwashi.click.');
  }
}

function resolveChapterMotif(chapterNumber) {
  return CHAPTER_SEED_LOOKUP.get(Number(chapterNumber)) || null;
}

function setChapterMotifOverlay(seed, enabled) {
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

function setupMotifDiscovery(data, announce) {
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
          : `Motif hidden. Default chapter art remains primary.`
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

async function mountChapterSigil(data, announce) {
  const aside = document.querySelector('aside');
  if (!aside || !data.chapterNumber) {
    return;
  }

  const chapterId = String(data.chapterNumber).padStart(2, '0');
  const path = `/book/chapter/${chapterId}/sigil.mjs?v=2026_02_28.I`;

  try {
    const module = await import(path);
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

function bindRouteControl(control, route, announce) {
  if (!control || !route) {
    return;
  }

  control.textContent = route.label;
  control.setAttribute('data-spw-route', route.routeName);
  control.setAttribute('data-spw-route-label', route.label);
  control.setAttribute('data-spw-expression', 'true');
  control.setAttribute('aria-label', route.ariaLabel);

  control.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = route.href;
    if (announce) {
      announce(`Route activated: ${route.label}`);
    }
  });
}

function setupKeyboardRoutes(links, announce) {
  if (document.body.dataset.spwShortcuts === 'ready') {
    return;
  }

  document.body.dataset.spwShortcuts = 'ready';
  document.addEventListener('keydown', (event) => {
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) {
      return;
    }

    const focused = document.activeElement;
    const tagName = focused ? focused.tagName : '';
    if (focused?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return;
    }

    let destination = '';
    let label = '';

    if (event.key === 'ArrowLeft') {
      destination = links.previousHref;
      label = `^[route/${String(links.previous).padStart(2, '0')}]{prev}`;
    } else if (event.key === 'ArrowRight') {
      destination = links.nextHref;
      label = `^[route/${String(links.next).padStart(2, '0')}]{next}`;
    } else if (event.key === 'Home' || event.key.toLowerCase() === 'h') {
      destination = '/';
      label = '^[home]{lore.land}';
    } else if (event.key.toLowerCase() === 't') {
      destination = '/book/timeline.html';
      label = '&[timeline]{canon-sequence}';
    } else {
      return;
    }

    event.preventDefault();
    if (announce) {
      announce(`Shortcut route: ${label}`);
    }
    window.location.href = destination;
  });
}

/**
 * Sets up the lore collector functionality.
 * @param {Object} data - The chapter data object.
 */
function setupLoreCollector(data) {
  const loreCollector = document.getElementById('lore-collector');
  const loreButton = document.getElementById('lore-button');

  if (!loreCollector || !loreButton) {
    console.warn('Lore collector elements not found.');
    return;
  }

  // Populate lore items
  if (data.lore && Array.isArray(data.lore.loreItems)) {
    data.lore.loreItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.description;
      loreCollector.appendChild(li);
    });
  }

  // Toggle lore collector visibility
  loreButton.addEventListener('click', () => {
    const isExpanded = loreButton.getAttribute('aria-expanded') === 'true';
    loreButton.setAttribute('aria-expanded', !isExpanded);
    loreCollector.style.display = isExpanded ? 'none' : 'block';
  });
}

/**
 * Sets up the primary action button functionality.
 * @param {Object} data - The chapter data object.
 */
function setupPrimaryAction(data) {
  const primaryActionButton = document.querySelector('.primary-action');
  const links = deriveChapterLinks(data);

  if (!primaryActionButton) {
    console.warn('Primary action button not found.');
    return;
  }

  primaryActionButton.textContent = `^[route/${String(links.next).padStart(2, '0')}]{advance}`;
  primaryActionButton.setAttribute('aria-label', `Advance to chapter ${links.next}`);

  primaryActionButton.addEventListener('click', () => {
    window.location.href = data.nextChapter || links.nextHref;
  });
}

/**
 * Sets up interactions with custom elements to enhance user experience.
 * @param {Object} data - The chapter data object.
 */
function setupCustomElementsInteractions(data) {
  const chapterContent = document.getElementById('chapter-content');
  if (!chapterContent) {
    return;
  }

  // Example: Add event listeners to all custom elements for interactivity
  const customElements = chapterContent.querySelectorAll(CUSTOM_ELEMENTS_SELECTOR);

  customElements.forEach(elem => {
    // Make custom elements focusable
    elem.setAttribute('tabindex', '0');

    // Handle focus and blur events for accessibility
    elem.addEventListener('focus', () => {
      elem.classList.add('focused');
    });

    elem.addEventListener('blur', () => {
      elem.classList.remove('focused');
    });

    // Example: Handle click events to toggle 'played' state
    elem.addEventListener('click', () => {
      elem.classList.toggle('played');
    });
  });

  // Handle interactive spans with data-content_id
  const interactiveSpans = chapterContent.querySelectorAll('span[data-content_id]');

  interactiveSpans.forEach(span => {
    span.addEventListener('click', () => {
      if (!span.classList.contains('played')) {
        span.classList.add('played');
        // Define additional behaviors here, e.g., reveal content, play sound, etc.
        // Example: Reveal hidden text
        const textToReveal = span.getAttribute('data-text');
        if (textToReveal) {
          span.textContent = textToReveal;
        }
      }
    });
  });
}
