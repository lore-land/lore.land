// scripts/script.mjs
import { withCacheContext } from './modules/cache-context.mjs?v=2026_09_07.A';
import { createLoadLifecycle } from './modules/load-lifecycle.mjs?v=2026_07_23.B';
import { CUSTOM_ELEMENTS_SELECTOR } from './modules/story-lexicon.mjs?v=2026_09_26.A';
import { renderChapterBody, renderChapterCoda, padChapterNumber } from './modules/chapter-render.mjs?v=2026_09_27.A';
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
} from './modules/experience-core.mjs?v=2026_08_27.A';
import { initChapterProgression } from './modules/chapter-progression.mjs?v=2026_02_28.I';
import { chapterSeedMap } from './home/seeds.mjs?v=2026_02_28.I';
import { initSpwLanguageRuntime } from './modules/spw-interactions.mjs?v=2026_07_23.D';
import { initEbookNavigation } from './modules/ebook-navigation.mjs?v=2026_09_26.A';
import { initReadingScale, initReadingGestures } from './modules/reading-gestures.mjs?v=2026_09_16.A';
import { initPinchPacking } from './modules/viewport-packing.mjs?v=2026_09_16.A';
import { deriveChapterLinks } from './modules/chapter-links.mjs?v=2026_02_28.I';
import { initSpwEthosIntegration } from './modules/spw-ethos.mjs?v=2026_08_27.A';
import { normalizeSpwSource, withSiteBase } from './modules/spw-routing.mjs?v=2026_03_02.A';
import { registerCustomElements } from './custom/register.mjs?v=2026_09_07.B';
import { assignGrammarRoles } from './modules/grammar-roles.mjs?v=2026_09_07.A';
import { initBookScrollObserver } from './modules/book-scroll-observer.mjs?v=2026_09_26.A';
import { setupPrintContext } from './modules/print-context.mjs?v=2026_03_02.A';
import { initGlyphDiscovery } from './modules/glyph-discovery.mjs?v=2026_03_02.A';
import { initLayoutObserver } from './modules/book-layout-observer.mjs?v=2026_03_02.A';
import { injectSvgFilters } from './modules/svg-filters.mjs';
import { renderChamberSeals } from './modules/chamber-seals.mjs?v=2026_08_27.A';
import { initLanguageExploration } from './modules/language-exploration.mjs?v=2026_08_27.A';
import {
  initChapterChrome,
  initScrollChrome
} from './modules/reading-chrome.mjs?v=2026_08_27.A';
import { initCopyClimate } from './modules/copy-climate.mjs?v=2026_08_27.A';
import { whenIdle } from './modules/scroll-coordinator.mjs?v=2026_08_27.A';
import {
  initPassAlong,
  initServiceWorkerUpdate,
  initSegmentKeyboard,
  initPointerCraft
} from './modules/interaction-surface.mjs?v=2026_08_27.A';
import { initProductionFlow } from './modules/production-flow.mjs?v=2026_08_27.A';
import { initReferences } from './modules/references.mjs?v=2026_09_27.A';
import { initLineShare } from './modules/line-share.mjs?v=2026_09_26.A';
import { initReadingNook } from './modules/reading-nook.mjs?v=2026_09_26.B';
import { initReadingSwitches } from './modules/reading-switches.mjs?v=2026_09_26.D';
import { initResonanceLayer } from './modules/resonance-layer.mjs?v=2026_09_27.A';
import { initLensControl } from './modules/lens-control.mjs?v=2026_09_27.B';

const CHAPTER_SEED_LOOKUP = chapterSeedMap(13, '01');

/* import.meta.glob is a Vite build-time construct; the deployed site serves
 * these modules raw, where calling it throws before anything renders. Under
 * raw ESM we fall back to a plain dynamic import in mountChapterSigil. */
let CHAPTER_SIGIL_MODULES = null;
try {
  CHAPTER_SIGIL_MODULES = import.meta.glob('../chapter/*/sigil.mjs');
} catch {
  CHAPTER_SIGIL_MODULES = null;
}

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', async () => {
  registerCustomElements();

  const { root, announce, destroy: destroyBootstrap } = bootstrapExperience();
  let destroySwUpdate = null;
  registerStoryServiceWorker({
    root,
    swPath: '/sw.js',
    scope: '/',
    onRegistered: (registration) => {
      destroySwUpdate = initServiceWorkerUpdate(registration, { announce });
    }
  });
  injectSvgFilters(document);

  // Page-forward entrance (chapter/motion.css) — only when the browser has
  // to draw the chapter itself. Prerendered prose is already on screen, and
  // fading it out to fade it back in would read as a flicker; page turns
  // between chapters are a cross-document view transition instead.
  const chapterShell = document.getElementById('chapter-content');
  if (chapterShell && !chapterShell.dataset.prerendered) {
    chapterShell.dataset.chapterEntering = 'true';
    const settleEntrance = () => {
      delete chapterShell.dataset.chapterEntering;
    };
    chapterShell.addEventListener('animationend', settleEntrance, { once: true });
    setTimeout(settleEntrance, 1200);
  }

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

    setupNavigation(chapterData, announce);
    const ebookNav = initEbookNavigation(chapterData, { announce });
    // Reader gestures: pinch sizes the prose, swipe turns sections. The
    // text-size panel is the keyboard/mouse route to the same state.
    const readerScale = initReadingScale({ announce });
    const destroyGestures = initReadingGestures({
      surface: chapterContent,
      nav: ebookNav,
      scale: readerScale,
      links: deriveChapterLinks(chapterData),
      announce
    });
    const destroyPacking = initPinchPacking();
    const destroyNook = initReadingNook({ announce });
    const destroySwitches = initReadingSwitches({ announce });
    const destroyResonance = initResonanceLayer();
    const destroyLens = initLensControl({ announce });
    const destroyLineShare = initLineShare({ announce });
    setupAuthorAttribution(announce);
    setupLoreCollector(chapterData);
    setupPrimaryAction(chapterData);
    setupCustomElementsInteractions(chapterData);
    setupSpwHypertextRoutes(chapterData, announce);
    setupTropeLedger(announce);
    setupTuningControls(announce);
    // Reading chrome + climate: needed early for sticky pad and temporal light.
    const destroyChapterChrome = initChapterChrome();
    const destroyScrollChrome = initScrollChrome({ mode: 'chapter' });
    const copyClimate = initCopyClimate({
      root: chapterContent || document.getElementById('chapter-content'),
      defaultTempo: chapterData.mood === 'boon' ? 'dawn' : undefined
    });
    document.body.classList.add('chapter-climate-ready');
    initChapterProgression(chapterData, { announce });
    const destroyReveal = initProgressiveReveal({ root: document });
    enhanceLazyImages({ root: chapterContent || document });
    const destroyPassAlong = initPassAlong({
      title: `${chapterData.title} | Lore.Land`,
      text: chapterData.logline || chapterData.description || chapterData.title,
      url: typeof location !== 'undefined' ? location.href : '',
      announce
    });
    const destroySegmentKeys = initSegmentKeyboard(document);
    const destroyPointerCraft = initPointerCraft(document);
    const destroyProduction = initProductionFlow({
      surface: 'chapter',
      chapterData,
      announce
    });

    // Secondary enhancement: defer until idle so first paint/input stay free.
    let languageExplore = null;
    let destroyAttention = null;
    let destroyShader = null;
    let destroySpatial = null;
    let destroyGenre = null;
    let destroyReferences = null;
    let cancelIdle = () => {};

    cancelIdle = whenIdle(async () => {
      initSpwEthosIntegration({
        context: 'chapter',
        container: document.querySelector('aside'),
        announce
      });
      setupMotifDiscovery(chapterData, announce);
      await mountChapterSigil(chapterData, announce);
      initSpwLanguageRuntime({ root: document, announce });
      languageExplore = initLanguageExploration(chapterData, {
        root: chapterContent || document.getElementById('chapter-content'),
        announce
      });
      destroyAttention = initAttentionDetails({ root });
      destroyShader = initSemanticShader({ root });
      destroySpatial = initSpatialPerspective({ root });
      destroyGenre = initGenreCombinatorics({ root, announce });
      destroyReferences = await initReferences({ chapterData, announce });
      requestAnimationFrame(() => initGlyphDiscovery(chapterContent, glyphTier));
    }, { timeout: 900 });

    if (ebookNav && announce) {
      announce(`Model ebook navigation ready: ${ebookNav.sectionCount} sections.`);
    }

    const acoustics = lifecycle.bonk('acoustics + spacing check', chapterContent);
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);

    window.__loreCleanup = () => {
      cancelIdle();
      destroyBootstrap();
      if (destroyGestures) destroyGestures();
      if (destroyPacking) destroyPacking();
      if (destroyLineShare) destroyLineShare();
      if (destroyNook) destroyNook();
      if (destroySwitches) destroySwitches();
      if (destroyResonance) destroyResonance();
      if (destroyLens) destroyLens();
      if (ebookNav?.destroy) ebookNav.destroy();
      if (languageExplore?.destroy) languageExplore.destroy();
      if (destroyChapterChrome) destroyChapterChrome();
      if (destroyScrollChrome) destroyScrollChrome();
      if (copyClimate?.destroy) copyClimate.destroy();
      if (destroyPassAlong) destroyPassAlong();
      if (destroySegmentKeys) destroySegmentKeys();
      if (destroyPointerCraft) destroyPointerCraft();
      if (destroyProduction) destroyProduction();
      if (destroyReferences) destroyReferences();
      if (destroySwUpdate) destroySwUpdate();
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
 * Chapter prose arrives prerendered (build-chapters.mjs runs the same
 * renderer at build time), so the usual path only notes the reading
 * position. The browser renders only when a page arrives without prose.
 * @param {Object} data - The chapter data object.
 */
function populateContent(data) {
  const chapterContent = document.getElementById('chapter-content');
  if (!chapterContent) {
    console.error('Chapter content container not found.');
    return;
  }

  if (!chapterContent.dataset.prerendered) {
    // The slip for the scribes is static in the template; hold it while the chapter is drawn.
    const slip = chapterContent.querySelector('.scriptorium-slip');
    chapterContent.replaceChildren();
    renderChapterBody(chapterContent, data, { doc: document, withBase: withSiteBase });
    if (slip) chapterContent.appendChild(slip);
    renderChapterCoda(chapterContent, data, { doc: document, withBase: withSiteBase });
  }

  persistReadingResume(data);
}

/** Humanizes a kebab-case mark value ("ninth-honk" → "ninth honk"). */
function humanizeMarkValue(value) {
  return String(value).split('-').join(' ');
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

/**
 * Adds a "Trope ledger" section to the chapter aside when the rendered page
 * contains any [data-trope] mark: one chip per marked section that scrolls
 * smoothly to it and briefly flashes it (`.mark-target-flash`).
 * @param {Function} [announce] - Optional live-region announcer.
 */
function setupTropeLedger(announce) {
  const aside = document.querySelector('aside');
  const chapterContent = document.getElementById('chapter-content');
  if (!aside || !chapterContent) {
    return;
  }

  const existing = aside.querySelector('.trope-ledger');
  if (existing) {
    existing.remove();
  }

  const marked = Array.from(chapterContent.querySelectorAll('[data-trope]'));
  if (!marked.length) {
    return;
  }

  const section = document.createElement('section');
  section.className = 'trope-ledger';
  section.dataset.component = 'trope-ledger';
  section.setAttribute('aria-label', 'Trope ledger');

  const heading = document.createElement('h2');
  heading.textContent = 'Trope Ledger';

  const lead = document.createElement('p');
  lead.textContent = 'Sampled tropes in this chapter. Select one to visit its section.';

  const list = document.createElement('ul');
  list.className = 'trope-ledger-list';

  marked.forEach((target) => {
    const value = target.getAttribute('data-trope');
    const human = humanizeMarkValue(value);

    const li = document.createElement('li');
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'trope-ledger-chip mark mark--trope';
    chip.dataset.mark = value;
    chip.textContent = human;
    chip.setAttribute('aria-label', `Scroll to sampled trope: ${human}`);

    chip.addEventListener('click', () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      target.classList.remove('mark-target-flash');
      // Force a reflow so re-clicking the same chip restarts the flash.
      void target.offsetWidth;
      target.classList.add('mark-target-flash');
      window.setTimeout(() => target.classList.remove('mark-target-flash'), 1600);
      if (announce) {
        announce(`Trope located: ${human}`);
      }
    });

    li.append(chip);
    list.append(li);
  });

  section.append(heading, lead, list);
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
  const modulePath = `../chapter/${chapterId}/sigil.mjs`;
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

function bindRouteControl(control, route, announce) {
  if (!control || !route) {
    return;
  }

  control.setAttribute('data-spw-route', route.routeName);
  control.setAttribute('data-spw-route-label', route.label);
  control.setAttribute('data-spw-expression', 'true');

  // Real links (the template ships them) navigate natively: new tabs,
  // prefetch, and cross-document view transitions all keep working.
  if (control.tagName === 'A' && control.getAttribute('href')) {
    return;
  }

  control.textContent = route.label;
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

  if (primaryActionButton.tagName === 'A' && primaryActionButton.getAttribute('href')) {
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

  chapterContent.querySelectorAll(`${CUSTOM_ELEMENTS_SELECTOR}[data-voice-shape="phrase"]`).forEach((elem) => {
    elem.addEventListener('click', (event) => {
      event.stopPropagation();
      const held = elem.classList.toggle('is-voice-held');
      elem.setAttribute('aria-pressed', String(held));
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
