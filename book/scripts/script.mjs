// scripts/script.mjs
import { withCacheContext } from './modules/cache-context.mjs?v=2026_11_16.B';
import { createLoadLifecycle } from './modules/load-lifecycle.mjs?v=2026_11_16.B';
import { renderChapterBody, renderChapterCoda, padChapterNumber } from './modules/chapter-render.mjs?v=2026_11_16.B';
import { TOTAL_CHAPTERS } from './modules/book-extent.mjs';
import {
  bootstrapExperience,
  enhanceLazyImages,
  initAttentionDetails,
  initGenreCombinatorics,
  initSemanticShader,
  initSpatialPerspective,
  initProgressiveReveal,
  registerStoryServiceWorker
} from './modules/experience-core.mjs?v=2026_08_27.A';
import { initChapterProgression } from './modules/chapter-progression.mjs?v=2026_02_28.I';
import { initEbookNavigation } from './modules/ebook-navigation.mjs?v=2026_11_16.B';
import { initReadingScale, initReadingGestures } from './modules/reading-gestures.mjs?v=2026_11_16.B';
import { initPinchPacking } from './modules/viewport-packing.mjs?v=2026_09_16.A';
import { deriveChapterLinks } from './modules/chapter-links.mjs?v=2026_11_10.A';
import { withSiteBase } from './modules/spw-routing.mjs?v=2026_03_02.A';
import { registerCustomElements } from './custom/register.mjs?v=2026_11_09.I';
import { assignGrammarRoles } from './modules/grammar-roles.mjs?v=2026_11_09.I';
import { initBookScrollObserver } from './modules/book-scroll-observer.mjs?v=2026_09_26.A';
import { setupPrintContext } from './modules/print-context.mjs?v=2026_03_02.A';
import { initLayoutObserver } from './modules/book-layout-observer.mjs?v=2026_03_02.A';
import { injectSvgFilters } from './modules/svg-filters.mjs?v=2026_11_13.B';
import { renderChamberSeals } from './modules/chamber-seals.mjs?v=2026_11_05.A';
import {
  initChapterChrome,
  initScrollChrome
} from './modules/reading-chrome.mjs?v=2026_08_27.A';
import { initCopyClimate } from './modules/copy-climate.mjs?v=2026_11_06.D';
import { whenIdle } from './modules/scroll-coordinator.mjs?v=2026_08_27.A';
import {
  initPassAlong,
  initServiceWorkerUpdate,
  initSegmentKeyboard,
  initPointerCraft
} from './modules/interaction-surface.mjs?v=2026_08_27.A';
import { initProductionFlow } from './modules/production-flow.mjs?v=2026_08_27.A';
import { initAlmanac } from './modules/almanac.mjs?v=2026_11_16.B';
import { initLiving } from './modules/living.mjs?v=2026_11_16.B';
import { initTellings } from './modules/tellings.mjs?v=2026_11_16.B';
import { initStoryDirections } from './modules/story-directions.mjs?v=2026_11_16.B';
import { initPieSegues } from './modules/pie-segues.mjs?v=2026_11_16.B';
import { initPieProjection } from './modules/pie-projection.mjs?v=2026_11_16.B';
import { initWayThrough } from './modules/way-through.mjs?v=2026_11_16.B';
import { initDrawnPlaces } from './modules/drawn-places.mjs?v=2026_11_16.B';
import { initMaterialPaths } from './modules/material-paths.mjs?v=2026_11_16.B';
import { bindSiteResonance, syncDerivedSparks } from './modules/intrinsic-rewards.mjs?v=2026_11_16.B';
import { initProjectionSpell } from './modules/projection.mjs?v=2026_11_16.B';
import { initBeginAgain } from './modules/begin-again.mjs?v=2026_11_16.B';
import { initCollection } from './modules/collection.mjs?v=2026_11_16.B';
import { initChapterInventory } from './modules/chapter-inventory.mjs?v=2026_11_16.B';
import { initLanesLore } from './modules/lanes-lore.mjs?v=2026_11_16.B';
import { initBracework } from './modules/bracework.mjs?v=2026_11_16.B';
import { initSceneLight } from './modules/scene-light.mjs?v=2026_11_16.B';
import { initLineShare } from './modules/line-share.mjs?v=2026_09_26.A';
import { initRoomShare } from './modules/room-share.mjs?v=2026_11_16.B';
import { initReadingNook } from './modules/reading-nook.mjs?v=2026_11_16.B';
import { initReadingSwitches } from './modules/reading-switches.mjs?v=2026_11_16.B';
import { initResonanceLayer } from './modules/resonance-layer.mjs?v=2026_11_16.B';
import { initLensControl } from './modules/lens-control.mjs?v=2026_11_16.B';
import { initXrayReading } from './modules/xray-reading.mjs?v=2026_11_16.B';
import { initConstellation } from './modules/constellation.mjs?v=2026_11_08.J';
import { initSettled } from './modules/settled.mjs?v=2026_11_16.B';
import { initRooms } from './modules/rooms.mjs?v=2026_11_16.B';
import { setupNavigation, setupSpwHypertextRoutes, setupPrimaryAction } from './chapter/routes.mjs';
import { setupMotifDiscovery, mountChapterSigil } from './chapter/motifs.mjs';
import {
  setupTropeLedger,
  setupTuningControls,
  setupAuthorAttribution,
  setupLoreCollector,
  setupCustomElementsInteractions
} from './chapter/panels.mjs';

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
    const destroySettled = initSettled();
    const destroyNook = initReadingNook({ announce });
    const destroySwitches = initReadingSwitches({ announce });
    // Rooms: progress by room, and the room-by-room trial (after the switches, so its attribute is set).
    const destroyRooms = initRooms({ chapterData, nav: ebookNav, announce });
    const destroyResonance = initResonanceLayer();
    const destroyLens = initLensControl({ announce });
    const destroyXray = initXrayReading({ announce });
    const destroyConstellation = initConstellation({ announce });
    const destroyAlmanac = initAlmanac({ chapterData, announce });
    const destroyLiving = initLiving({ chapterData });
    const destroyBracework = initBracework();
    const destroySceneLight = initSceneLight({ chapterData, announce });
    const destroyTellings = initTellings({ chapterData, announce });
    const destroyStory = initStoryDirections();
    const destroySpell = initProjectionSpell({ chapterData });
    const destroyPieSegues = initPieSegues({ chapterData });
    const destroyPieProjection = initPieProjection({ chapterData });
    const destroyWay = initWayThrough({ chapterData });
    const destroyPlace = initDrawnPlaces({ chapterData });
    syncDerivedSparks();
    const destroySiteResonance = bindSiteResonance({ root: document, context: 'chapter' });
    let destroyMaterialPaths = null;
    initMaterialPaths({ chapterData }).then((destroy) => { destroyMaterialPaths = destroy; });
    const destroyBeginAgain = initBeginAgain({ chapterData, latest: TOTAL_CHAPTERS });
    const destroyCollection = initCollection({ chapterData, announce });
    // The chapter in Spw, at its end: its description spell and every expression it holds, lit by what was found.
    const destroyInventory = initChapterInventory({ chapterData });
    // What the pies let slip in the lanes, set back beside the room it is about (and the way to what is still unheard).
    const destroyLanesLore = initLanesLore({ chapterData });
    const destroyLineShare = initLineShare({ announce });
    const destroyRoomShare = initRoomShare({ announce });
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
      title: `${chapterData.title} · Lore.Land`,
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
    let isDisposed = false;
    let languageExplore = null;
    let destroyAttention = null;
    let destroyShader = null;
    let destroySpatial = null;
    let destroyGenre = null;
    let destroyReferences = null;
    let destroyTropes = null;
    let destroySightings = null;
    let cancelIdle = () => {};

    cancelIdle = whenIdle(async () => {
      try {
        const idleModulesPromise = Promise.all([
          import('./modules/spw-ethos.mjs?v=2026_11_09.I'),
          import('./modules/spw-interactions.mjs?v=2026_11_16.B'),
          import('./modules/language-exploration.mjs?v=2026_11_08.N'),
          import('./modules/sightings.mjs?v=2026_11_05.B'),
          import('./modules/references.mjs?v=2026_11_16.B'),
          import('./modules/trope-strip.mjs?v=2026_11_16.B'),
          import('./modules/glyph-discovery.mjs?v=2026_03_02.A')
        ]);
        setupMotifDiscovery(chapterData, announce);
        destroyAttention = initAttentionDetails({ root });
        destroyShader = initSemanticShader({ root });
        destroySpatial = initSpatialPerspective({ root });
        destroyGenre = initGenreCombinatorics({ root, announce });
        await mountChapterSigil(chapterData, announce);
        if (isDisposed) return;
        const [
          { initSpwEthosIntegration },
          { initSpwLanguageRuntime },
          { initLanguageExploration },
          { initSightings },
          { initReferences },
          { initTropeStrip },
          { initGlyphDiscovery }
        ] = await idleModulesPromise;
        if (isDisposed) return;
        initSpwEthosIntegration({
          context: 'chapter',
          container: document.querySelector('aside'),
          announce
        });
        initSpwLanguageRuntime({ root: document, announce });
        languageExplore = initLanguageExploration(chapterData, {
          root: chapterContent || document.getElementById('chapter-content'),
          announce
        });
        // Sightings listen first: the references' opening paint may already surface one.
        destroySightings = initSightings({ chapterData });
        destroyReferences = await initReferences({ chapterData, announce });
        if (isDisposed) {
          destroyReferences?.();
          destroySightings?.();
          languageExplore?.destroy?.();
          return;
        }
        // The tropes this chapter tells, each at the stage this reader has reached (the trope-reveal trial).
        destroyTropes = initTropeStrip({ chapterData, root: chapterContent || document });
        requestAnimationFrame(() => {
          if (!isDisposed) initGlyphDiscovery(chapterContent, glyphTier);
        });
      } catch (error) {
        console.warn('Idle chapter enhancements skipped:', error);
      }
    }, { timeout: 900 });

    if (ebookNav && announce) {
      announce(`Model ebook navigation ready: ${ebookNav.sectionCount} sections.`);
    }

    const acoustics = lifecycle.bonk('acoustics + spacing check', chapterContent);
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);

    window.__loreCleanup = () => {
      isDisposed = true;
      cancelIdle();
      destroyBootstrap();
      if (destroyGestures) destroyGestures();
      if (destroyPacking) destroyPacking();
      if (destroyLineShare) destroyLineShare();
      if (destroyRoomShare) destroyRoomShare();
      if (destroyNook) destroyNook();
      if (destroySettled) destroySettled();
      if (destroySwitches) destroySwitches();
      if (destroyRooms) destroyRooms();
      if (destroyResonance) destroyResonance();
      if (destroyLens) destroyLens();
      if (destroyXray) destroyXray();
      if (destroyConstellation) destroyConstellation();
      if (destroyAlmanac) destroyAlmanac();
      if (destroyLiving) destroyLiving();
      if (destroyBracework) destroyBracework();
      if (destroySceneLight) destroySceneLight();
      if (destroyTellings) destroyTellings();
      if (destroyStory) destroyStory();
      if (destroyPieSegues) destroyPieSegues();
      if (destroyPieProjection) destroyPieProjection();
      if (destroyWay) destroyWay();
      if (destroyPlace) destroyPlace();
      if (destroySpell) destroySpell();
      if (destroyMaterialPaths) destroyMaterialPaths();
      if (destroyBeginAgain) destroyBeginAgain();
      if (destroyCollection) destroyCollection();
      if (destroyInventory) destroyInventory();
      if (destroyLanesLore) destroyLanesLore();
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
      if (destroyTropes) destroyTropes();
      if (destroySightings) destroySightings();
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
  // Only sheets that exist are linked (a missing one is a 404 on every chapter); the attribute is set either way.
  const PERIOD_SHEETS = new Set();
  const MOOD_SHEETS = new Set(['tldr']);

  if (period && PERIOD_SHEETS.has(period)) {
    periodStylesLink.href = withCacheContext(`/book/styles/periods/${period}.css`, {
      channel: `period-${period}`
    });
    body.setAttribute('data-period', period);
  } else {
    if (period) body.setAttribute('data-period', period);
    periodStylesLink.disabled = true; // Disable if no period sheet
  }

  if (mood && MOOD_SHEETS.has(mood)) {
    moodStylesLink.href = withCacheContext(`/book/styles/moods/${mood}.css`, {
      channel: `mood-${mood}`
    });
    body.setAttribute('data-mood', mood);
  } else {
    if (mood) body.setAttribute('data-mood', mood);
    moodStylesLink.disabled = true; // Disable if no mood sheet
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
    titleElement.textContent = `${data.title} · Lore.Land`;
  }

  if (descriptionElement) {
    const description = data.description || data.logline || chapterLabel;
    descriptionElement.setAttribute('content', description);
  }

  document.title = `${data.title} · Lore.Land`;
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
