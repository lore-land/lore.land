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
import { normalizeSpwSource, withSiteBase } from './modules/spw-routing.mjs?v=2026_03_02.A';
import { registerCustomElements } from './custom/register.mjs?v=2026_02_28.I';
import { assignGrammarRoles } from './modules/grammar-roles.mjs?v=2026_03_02.A';
import { initBookScrollObserver } from './modules/book-scroll-observer.mjs?v=2026_03_02.A';
import { setupPrintContext } from './modules/print-context.mjs?v=2026_03_02.A';
import { initGlyphDiscovery } from './modules/glyph-discovery.mjs?v=2026_03_02.A';
import { initLayoutObserver } from './modules/book-layout-observer.mjs?v=2026_03_02.A';
import { injectSvgFilters } from './modules/svg-filters.mjs';
import { renderChamberSeals } from './modules/chamber-seals.mjs?v=2026_07_14.E';
import { initLanguageExploration } from './modules/language-exploration.mjs?v=2026_07_14.G';
import {
  initChapterChrome,
  initScrollChrome
} from './modules/reading-chrome.mjs?v=2026_07_14.G';
import {
  applySectionClimateAttributes,
  initCopyClimate
} from './modules/copy-climate.mjs?v=2026_07_14.G';

const CHAPTER_SEED_LOOKUP = chapterSeedMap(13, '01');

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', async () => {
  registerCustomElements();

  const { root, announce, destroy: destroyBootstrap } = bootstrapExperience();
  registerStoryServiceWorker({ root, swPath: '/sw.js', scope: '/' });
  injectSvgFilters(document);

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
    renderChamberSeals(document);

    // Book experience: grammar roles, scroll reveal, glyph discovery, print context
    const chapterContent = document.getElementById('chapter-content');
    if (chapterContent) {
      chapterContent.classList.add('chapter');
      chapterContent.dataset.chapterLabel = `Chapter ${padChapterNumber(chapterData.chapterNumber)} — ${chapterData.title}`;
      assignGrammarRoles(chapterContent);
      initBookScrollObserver(chapterContent);
      initLayoutObserver(chapterContent);
    }
    // Set glyph discovery tier based on chapter progression
    const chapterNum = Number(chapterData.chapterNumber) || 1;
    const glyphTier = chapterNum >= 12 ? 5 : chapterNum >= 10 ? 4 : chapterNum >= 7 ? 3 : chapterNum >= 4 ? 2 : chapterNum >= 1 ? 1 : 0;
    document.documentElement.dataset.glyphTier = String(glyphTier);
    setupPrintContext(chapterContent);
    // Glyph discovery runs after Spw runtime, deferred to let tokens render
    requestAnimationFrame(() => initGlyphDiscovery(chapterContent, glyphTier));

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
    // Optional: thematic marks + resonance — prose stands alone without it.
    const languageExplore = initLanguageExploration(chapterData, {
      root: chapterContent || document.getElementById('chapter-content'),
      announce
    });
    const destroyChapterChrome = initChapterChrome({ announce });
    const destroyScrollChrome = initScrollChrome({ mode: 'chapter', announce });
    const copyClimate = initCopyClimate({
      root: chapterContent || document.getElementById('chapter-content'),
      announce,
      defaultTempo: chapterData.mood === 'boon' ? 'dawn' : undefined
    });
    document.body.classList.add('chapter-climate-ready');
    const destroyAttention = initAttentionDetails({ root });
    const destroyShader = initSemanticShader({ root });
    const destroySpatial = initSpatialPerspective({ root });
    const destroyGenre = initGenreCombinatorics({ root, announce });
    initChapterProgression(chapterData, { announce });
    const destroyReveal = initProgressiveReveal({ root: document });

    if (ebookNav && announce) {
      announce(`Model ebook navigation ready: ${ebookNav.sectionCount} sections.`);
    }

    enhanceLazyImages({ root: chapterContent || document });
    const acoustics = lifecycle.bonk('acoustics + spacing check', chapterContent);
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);

    window.__loreCleanup = () => {
      destroyBootstrap();
      if (ebookNav?.destroy) ebookNav.destroy();
      if (languageExplore?.destroy) languageExplore.destroy();
      if (destroyChapterChrome) destroyChapterChrome();
      if (destroyScrollChrome) destroyScrollChrome();
      if (copyClimate?.destroy) copyClimate.destroy();
      if (destroyAttention) destroyAttention();
      if (destroyShader) destroyShader();
      if (destroySpatial) destroySpatial();
      if (destroyGenre) destroyGenre();
      if (destroyReveal) destroyReveal();
    };
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
  const chapterLabel = `Chapter ${padChapterNumber(data.chapterNumber)}: ${data.title}`;

  if (titleElement) {
    titleElement.textContent = `${data.title} | Lore.Land`;
  }

  if (descriptionElement) {
    const description = data.description || data.logline || chapterLabel;
    descriptionElement.setAttribute('content', description);
  }

  document.title = `${data.title} | Lore.Land`;
}

/**
 * Persist last-read chapter so the entrance can offer a continue path.
 * @param {Object} data - The chapter data object.
 */
function persistReadingResume(data) {
  const chapterNumber = Number(data?.chapterNumber);
  if (!Number.isFinite(chapterNumber) || chapterNumber < 1) {
    return;
  }

  try {
    window.localStorage.setItem('lore.reading.resume-chapter', String(chapterNumber));
  } catch (error) {
    console.warn('Unable to persist reading resume state:', error);
  }
}

/**
 * Populates the main content of the chapter based on the sections defined in chapter data.
 * Template order: logline → title → epigraph → byline → sections.
 * @param {Object} data - The chapter data object.
 */
function populateContent(data) {
  const chapterContent = document.getElementById('chapter-content');
  if (!chapterContent) {
    console.error('Chapter content container not found.');
    return;
  }

  chapterContent.innerHTML = '';

  if (data.logline) {
    const logline = document.createElement('p');
    logline.className = 'chapter-logline';
    logline.dataset.component = 'chapter-logline';
    logline.textContent = data.logline;
    chapterContent.appendChild(logline);
  }

  const chapterHeading = document.createElement('h1');
  chapterHeading.textContent = `Chapter ${padChapterNumber(data.chapterNumber)}: ${data.title}`;
  chapterContent.appendChild(chapterHeading);

  if (data.epigraph) {
    const epigraph = document.createElement('p');
    epigraph.className = 'chapter-epigraph';
    epigraph.dataset.component = 'chapter-epigraph';
    epigraph.textContent = data.epigraph;
    chapterContent.appendChild(epigraph);
  }

  const byline = document.createElement('p');
  byline.className = 'chapter-byline';
  byline.dataset.component = 'chapter-byline';

  const authorLink = document.createElement('a');
  authorLink.href = 'https://spwashi.com/?from=lore.land';
  authorLink.target = '_blank';
  authorLink.rel = 'noopener noreferrer';
  authorLink.textContent = 'Spwashi';
  authorLink.setAttribute('aria-label', 'Open author site spwashi.com');

  const homeLink = document.createElement('a');
  homeLink.href = withSiteBase('/');
  homeLink.textContent = 'Lore.Land';
  homeLink.setAttribute('aria-label', 'Return to Lore.Land');

  byline.append('From the Lore.Land monument · ', authorLink, ' · ', homeLink);
  chapterContent.appendChild(byline);

  if (Array.isArray(data.pillars) && data.pillars.length) {
    const pillars = document.createElement('p');
    pillars.className = 'chapter-pillars';
    pillars.dataset.component = 'chapter-pillars';
    pillars.textContent = `Seeded with: ${data.pillars.join(' · ')}`;
    chapterContent.appendChild(pillars);
  }

  if (Array.isArray(data.topics) && data.topics.length) {
    const topicNav = document.createElement('nav');
    topicNav.className = 'chapter-topic-row';
    topicNav.dataset.component = 'chapter-topics';
    topicNav.setAttribute('aria-label', 'Related topics');
    data.topics.forEach((topic) => {
      const chip = document.createElement('a');
      chip.className = 'chapter-topic-chip';
      chip.href = topic.href || `/topics/#${topic.id || ''}`;
      chip.textContent = topic.label || topic.id || 'topic';
      topicNav.appendChild(chip);
    });
    const allTopics = document.createElement('a');
    allTopics.className = 'chapter-topic-chip chapter-topic-chip--quiet';
    allTopics.href = withSiteBase('/topics/');
    allTopics.textContent = 'All topics';
    topicNav.appendChild(allTopics);
    chapterContent.appendChild(topicNav);
  }

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

  if (Array.isArray(data.relatedRoutes) && data.relatedRoutes.length) {
    const rail = document.createElement('nav');
    rail.className = 'chapter-route-rail';
    rail.dataset.component = 'chapter-related-routes';
    rail.setAttribute('aria-label', 'Continue exploring');

    const label = document.createElement('p');
    label.className = 'chapter-route-rail-label';
    label.textContent = 'Continue';
    rail.appendChild(label);

    data.relatedRoutes.forEach((route) => {
      const card = document.createElement('a');
      card.className = 'chapter-route-card';
      card.href = route.href || '#';
      if (route.kicker) {
        const kicker = document.createElement('span');
        kicker.className = 'chapter-route-kicker';
        kicker.textContent = route.kicker;
        card.appendChild(kicker);
      }
      const title = document.createElement('span');
      title.className = 'chapter-route-title';
      title.textContent = route.label || 'Route';
      card.appendChild(title);
      rail.appendChild(card);
    });

    chapterContent.appendChild(rail);
  }

  persistReadingResume(data);
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
 * Renders a section's `scene` block as a collapsed sketch — an invitation
 * to imagine, not an obligation. The structured fields (vantage / light /
 * scent / edges / hint) also stay machine-readable in #chapter-data so
 * later image models can pick up the same hooks the reader practices on.
 * @param {Object} scene - { vantage, light, scent, edges[], hint }
 * @returns {HTMLElement} - A <details class="scene-sketch"> element.
 */
function createSceneSketch(scene) {
  const details = document.createElement('details');
  details.className = 'scene-sketch';
  details.dataset.component = 'scene-sketch';
  if (scene.hint) {
    details.dataset.sceneHint = scene.hint;
  }

  const summary = document.createElement('summary');
  summary.textContent = 'Step into the scene';
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'scene-sketch-body';

  const addSense = (label, text) => {
    if (!text) {
      return;
    }
    const line = document.createElement('p');
    line.className = 'scene-sense';
    const tag = document.createElement('span');
    tag.className = 'scene-sense-label';
    tag.textContent = label;
    line.append(tag, ' ', text);
    body.appendChild(line);
  };

  addSense('vantage', scene.vantage);
  addSense('light', scene.light);
  addSense('scent', scene.scent);

  if (Array.isArray(scene.edges) && scene.edges.length) {
    const edges = document.createElement('ul');
    edges.className = 'scene-edges';
    scene.edges.forEach((edge) => {
      const item = document.createElement('li');
      item.textContent = edge;
      edges.appendChild(item);
    });
    body.appendChild(edges);
  }

  details.appendChild(body);
  return details;
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

  // Copy hooks → data-tempo / data-tint / data-climate (authored or inferred)
  applySectionClimateAttributes(sec, section);

  // Pass through any remaining data-* keys from JSON (builder attribute surface)
  Object.entries(section).forEach(([key, value]) => {
    if (key.startsWith('data-') && typeof value === 'string' && !sec.hasAttribute(key)) {
      sec.setAttribute(key, value);
    }
  });

  if (section.scene) {
    sec.dataset.scene = 'true';
    sec.appendChild(createSceneSketch(section.scene));
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

  applySectionClimateAttributes(customElem, section);

  Object.entries(section).forEach(([key, value]) => {
    if (key.startsWith('data-') && typeof value === 'string' && !customElem.hasAttribute(key)) {
      customElem.setAttribute(key, value);
    }
  });

  if (section.scene) {
    customElem.dataset.scene = 'true';
    customElem.appendChild(createSceneSketch(section.scene));
  }

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
  const previousLabel = `← Chapter ${String(links.previous).padStart(2, '0')}`;
  const nextLabel = `Chapter ${String(links.next).padStart(2, '0')} →`;

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
    'Shortcuts: Alt+Left/Right = chapter, PageUp/Down or [/] = section, hold { = breadth, hold } = depth, Alt+H = home, Alt+T = timeline, Alt+P = .spw canon.';

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
      href: withSiteBase('/book/timeline.html'),
      aria: 'Open canonical timeline'
    },
    {
      label: '@[path]{@spw/index.spw}',
      href: normalizeSpwSource('spw/index'),
      aria: 'Open Spw canon root for lore.land'
    },
    {
      label: '@[path]{@spw/chapters/index.spw}',
      href: normalizeSpwSource('spw/chapters/index'),
      aria: 'Open Spw chapter reference index'
    },
    {
      label: '~[seed-atlas]{visual motifs}',
      href: withSiteBase('/seeds/2026-02-28/'),
      aria: 'Open seed atlas'
    },
    {
      label: '^[home]{lore.land}',
      href: withSiteBase('/'),
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
    return null;
  }

  document.body.dataset.spwShortcuts = 'ready';

  const onKeydown = (event) => {
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
      destination = withSiteBase('/');
      label = '^[home]{lore.land}';
    } else if (event.key.toLowerCase() === 't') {
      destination = withSiteBase('/book/timeline.html');
      label = '&[timeline]{canon-sequence}';
    } else if (event.key.toLowerCase() === 'p') {
      destination = normalizeSpwSource('spw/index');
      label = '@[path]{@spw/index.spw}';
    } else {
      return;
    }

    event.preventDefault();
    if (announce) {
      announce(`Shortcut route: ${label}`);
    }
    window.location.href = destination;
  };

  document.addEventListener('keydown', onKeydown);

  return () => {
    document.removeEventListener('keydown', onKeydown);
    delete document.body.dataset.spwShortcuts;
  };
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

  primaryActionButton.textContent = `Continue to Chapter ${String(links.next).padStart(2, '0')}`;
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
