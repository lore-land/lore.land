import { withCacheContext } from './cache-context.mjs?v=2026_02_28.I';
import { createLoadLifecycle } from './load-lifecycle.mjs?v=2026_02_28.I';
import { CHAPTER_FLOW_SELECTOR, CUSTOM_ELEMENTS_SELECTOR } from './story-lexicon.mjs?v=2026_02_28.I';
import {
  bootstrapExperience,
  enhanceLazyImages,
  initAttentionDetails,
  initGenreCombinatorics,
  initSemanticShader,
  initSpatialPerspective,
  initProgressiveReveal,
  registerStoryServiceWorker
} from './experience-core.mjs?v=2026_02_28.I';
import { initSpwLanguageRuntime } from './spw-interactions.mjs?v=2026_02_28.I';
import { initEbookNavigation } from './ebook-navigation.mjs?v=2026_02_28.I';
import { deriveChapterLinks } from './chapter-links.mjs?v=2026_02_28.I';
import { initSpwEthosIntegration } from './spw-ethos.mjs?v=2026_07_16.A';
import { registerCustomElements } from '../custom/register.mjs?v=2026_02_28.I';

function readChapterData() {
  const source = document.getElementById('chapter-data');
  if (!source || !source.textContent) {
    return null;
  }

  try {
    return JSON.parse(source.textContent);
  } catch (error) {
    console.warn('Legacy ebook scaffold: unable to parse chapter data.', error);
    return null;
  }
}

// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  registerCustomElements();

  const { root, announce, destroy: destroyBootstrap } = bootstrapExperience();
  registerStoryServiceWorker({ root, swPath: '/sw.js', scope: '/' });
  const chapterData = readChapterData();

  const lifecycle = createLoadLifecycle({
    id: 'charm',
    shellSelector: 'main',
    spinnerDelayMs: 320,
    skeletonLines: 4
  });

  lifecycle.boon('preloader engaged');
  lifecycle.armBane('spinner + fallback');
  lifecycle.bone('skeletons loaded');

  try {
    initializeStyles(chapterData);
    setupNavigation(chapterData, announce);
    setupLoreCollector(chapterData);
    setupPrimaryAction(chapterData, announce);
    setupCustomElementsInteractions();
    let ebookNav = null;
    if (chapterData) {
      ebookNav = initEbookNavigation(chapterData, { announce });
    }
    initSpwEthosIntegration({ context: 'chapter', container: document.querySelector('aside'), announce });
    initSpwLanguageRuntime({ root: document, announce });
    const destroyAttention = initAttentionDetails({ root });
    const destroyShader = initSemanticShader({ root });
    const destroySpatial = initSpatialPerspective({ root });
    const destroyGenre = initGenreCombinatorics({ root });
    const destroyReveal = initProgressiveReveal({ root: document });
    enhanceLazyImages({ root: document });
    const acoustics = lifecycle.bonk('acoustics + spacing check', document.querySelector('main'));
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);

    window.__loreCleanup = () => {
      destroyBootstrap();
      if (ebookNav?.destroy) ebookNav.destroy();
      if (destroyAttention) destroyAttention();
      if (destroyShader) destroyShader();
      if (destroySpatial) destroySpatial();
      if (destroyGenre) destroyGenre();
      if (destroyReveal) destroyReveal();
    };
  } catch (error) {
    lifecycle.bane('runtime fallback path');
    console.error('Charm lifecycle failed:', error);
  }
});

/**
 * Dynamically loads period and mood stylesheets based on data attributes.
 */
function initializeStyles(data) {
  const periodStylesLink = document.getElementById('period-styles');
  const moodStylesLink = document.getElementById('mood-styles');
  const body = document.body;

  const period = data?.period || body.getAttribute('data-period');
  const mood = data?.mood || body.getAttribute('data-mood');

  if (period && periodStylesLink) {
    periodStylesLink.href = withCacheContext(`/book/styles/periods/${period}.css`, {
      channel: `period-${period}`
    });
    body.setAttribute('data-period', period);
  }

  if (mood && moodStylesLink) {
    moodStylesLink.href = withCacheContext(`/book/styles/moods/${mood}.css`, {
      channel: `mood-${mood}`
    });
    body.setAttribute('data-mood', mood);
  }
}

/**
 * Sets up chapter and section navigation controls.
 */
function setupNavigation(data, announce) {
  const links = deriveChapterLinks(data);
  const chapterPrev = document.querySelector('nav[aria-label="Chapter navigation"] .prev');
  const chapterNext = document.querySelector('nav[aria-label="Chapter navigation"] .next');

  if (chapterPrev) {
    chapterPrev.textContent = `← Chapter ${String(links.previous).padStart(2, '0')}`;
    delete chapterPrev.dataset.spwExpression;
    chapterPrev.setAttribute('aria-label', `Open chapter ${links.previous}`);
    chapterPrev.addEventListener('click', () => {
      window.location.href = links.previousHref;
      if (announce) {
        announce(`Route activated: chapter ${links.previous}.`);
      }
    });
  }

  if (chapterNext) {
    chapterNext.textContent = `Chapter ${String(links.next).padStart(2, '0')} →`;
    delete chapterNext.dataset.spwExpression;
    chapterNext.setAttribute('aria-label', `Open chapter ${links.next}`);
    chapterNext.addEventListener('click', () => {
      window.location.href = links.nextHref;
      if (announce) {
        announce(`Route activated: chapter ${links.next}.`);
      }
    });
  }

  const sectionNav = document.querySelector('.section-navigation');
  if (sectionNav) {
    const prevSectionBtn = sectionNav.querySelector('.prev');
    const nextSectionBtn = sectionNav.querySelector('.next');

    if (prevSectionBtn) {
      prevSectionBtn.textContent = '?[section]{prev}';
      prevSectionBtn.dataset.spwExpression = 'true';
      prevSectionBtn.addEventListener('click', () => navigateSection('prev'));
    }

    if (nextSectionBtn) {
      nextSectionBtn.textContent = '?[section]{next}';
      nextSectionBtn.dataset.spwExpression = 'true';
      nextSectionBtn.addEventListener('click', () => navigateSection('next'));
    }
  }
}

/**
 * Handles section navigation logic.
 * @param {string} direction - 'prev' or 'next'
 */
function navigateSection(direction) {
  const sections = [...document.querySelectorAll(CHAPTER_FLOW_SELECTOR)];
  if (!sections.length) {
    return;
  }

  const focused = document.activeElement;
  const activeSection = focused ? focused.closest(CHAPTER_FLOW_SELECTOR) : null;
  let index = activeSection ? sections.indexOf(activeSection) : -1;

  if (index < 0) {
    let closest = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    sections.forEach((section, sectionIndex) => {
      const distance = Math.abs(section.getBoundingClientRect().top - 130);
      if (distance < bestDistance) {
        bestDistance = distance;
        closest = sectionIndex;
      }
    });
    index = closest;
  }

  const nextIndex =
    direction === 'prev'
      ? Math.max(0, index - 1)
      : Math.min(sections.length - 1, index + 1);

  const target = sections[nextIndex];
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

/**
 * Sets up the lore collector functionality.
 */
function setupLoreCollector(data) {
  const loreButton = document.getElementById('lore-button');
  const loreCollector = document.getElementById('lore-collector');

  if (loreButton && loreCollector) {
    if (data?.lore?.loreItems?.length) {
      populateLoreCollector(data.lore.loreItems);
    }

    loreButton.addEventListener('click', () => {
      // Toggle visibility of lore collector
      const isExpanded = loreButton.getAttribute('aria-expanded') === 'true';
      loreButton.setAttribute('aria-expanded', String(!isExpanded));
      loreCollector.hidden = isExpanded;

      if (!isExpanded && !loreCollector.children.length) {
        populateLoreCollector();
      }
    });
  }
}

/**
 * Populates the lore collector with relevant lore items.
 */
function populateLoreCollector(seedItems = null) {
  const loreCollector = document.getElementById('lore-collector');
  if (!loreCollector) {
    return;
  }

  const writeItems = (items) => {
    loreCollector.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.description;
      loreCollector.appendChild(li);
    });
  };

  if (Array.isArray(seedItems) && seedItems.length) {
    writeItems(seedItems);
    return;
  }

  fetch('/book/data/lore.json')
    .then((response) => response.json())
    .then((fetched) => {
      if (Array.isArray(fetched?.loreItems) && fetched.loreItems.length) {
        writeItems(fetched.loreItems);
      }
    })
    .catch((error) => {
      console.error('Error fetching lore data:', error);
      loreCollector.innerHTML = '<li>Failed to load lore.</li>';
    });
}

/**
 * Sets up the primary action button functionality.
 */
function setupPrimaryAction(data, announce) {
  const primaryActionBtn = document.querySelector('.primary-action');
  if (!primaryActionBtn) {
    return;
  }

  const links = deriveChapterLinks(data);
  primaryActionBtn.textContent = `Continue to Chapter ${String(links.next).padStart(2, '0')}`;
  delete primaryActionBtn.dataset.spwExpression;
  primaryActionBtn.setAttribute('aria-label', `Advance to chapter ${links.next}`);
  primaryActionBtn.addEventListener('click', () => {
    window.location.href = links.nextHref;
    if (announce) {
      announce(`Route activated: chapter ${links.next}.`);
    }
  });
}

/**
 * Sets up interactions with custom elements.
 */
function setupCustomElementsInteractions() {
  const customElements = document.querySelectorAll(CUSTOM_ELEMENTS_SELECTOR);
  customElements.forEach((element) => {
    element.dataset.spwComponent = element.tagName.toLowerCase();
    element.dataset.spwActionable = 'true';
    element.tabIndex = element.tabIndex >= 0 ? element.tabIndex : 0;

    const togglePlayed = () => {
      element.classList.toggle('active');
      element.classList.toggle('played');
    };

    element.addEventListener('click', togglePlayed);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        togglePlayed();
      }
    });
  });

  // Similarly, add interactions for other custom elements as needed
}

/**
 * EBook Interactive Script
 *
 * This script transforms each word in the main content into a tabbable element,
 * tracks user interactions (focus and visit order), and sets up data attributes
 * for precise CSS targeting. It ensures accessibility and is designed for
 * easy integration and bundling into other projects.
 */

/**
 * EBook Class
 * Encapsulates all functionality related to making the e-book interactive.
 */
export class EBook {
  /**
   * Constructor initializes the EBook with given options.
   * @param {Object} options - Configuration options for EBook.
   */
  constructor(options = {}) {
    // Default configuration options
    const defaultOptions = {
      mainSelector: 'main.chapter',          // Selector for main content
      wordWrapper: 'span',                   // Element to wrap each word
      wordClass: 'ebook-word',               // Class name for word elements
      wordTabIndex: 0,                       // tabindex value for words
      dataAttributes: {                      // Data attributes for tracking
        wordIndex: 'data-word-index',
        visited: 'data-visited',
        visitOrder: 'data-visit-order',
        focused: 'data-focused',
      },
      visitedWordsVar: '--visited-words',    // CSS variable for visited count
      chapterDataset: 'chapter',             // Dataset key for chapter number
      sectionDataset: 'section',             // Dataset key for section number
      urlPattern: /chapter\/(\d+)\/index\.html$/, // Regex to extract chapter number
    };

    // Merge user-provided options with defaults
    this.options = { ...defaultOptions, ...options };

    // Initialize visit counter
    this.visitCounter = 0;

    // Initialize the EBook
    this.init();
  }

  /**
   * Initializes the EBook by setting up the interactive words.
   */
  init() {
    // Wait for the DOM to fully load
    document.addEventListener('DOMContentLoaded', () => {
      const mainContent = document.querySelector(this.options.mainSelector);
      if (!mainContent || mainContent.dataset.ebookWordsReady === 'true') {
        return;
      }

      // Extract chapter number from URL using regex
      const urlPath = window.location.pathname;
      const chapterMatch = urlPath.match(this.options.urlPattern);
      const chapterNumber = chapterMatch ? chapterMatch[1] : 'unknown';
      mainContent.dataset[this.options.chapterDataset] = chapterNumber;

      // Assign section numbers to sections and custom elements
      const sections = mainContent.querySelectorAll(CHAPTER_FLOW_SELECTOR);
      let sectionNumber = 1;
      sections.forEach((section) => {
        section.dataset[this.options.sectionDataset] = sectionNumber++;
      });

      // Transform words into interactive elements
      this.wrapWords(mainContent);

      // Add event listeners to handle interactions
      this.addWordEventListeners(mainContent);
      mainContent.dataset.ebookWordsReady = 'true';
    });
  }

  /**
   * Wraps each word in the specified element with a tabbable span.
   * @param {HTMLElement} element - The element containing the text to transform.
   */
  wrapWords(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('script, style, noscript')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains(this.options.wordClass)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const textNodes = [];

    // Collect all text nodes within the main content
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    // Iterate through each text node to wrap words
    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      const text = textNode.textContent;

      if (!parent || !text || !text.trim().length) {
        return;
      }

      // Split text into words and delimiters while preserving spacing.
      const words = text.split(/(\s+)/);

      const fragment = document.createDocumentFragment();
      const chapterId = element.dataset[this.options.chapterDataset] || 'unknown';
      const sectionHost = parent.closest(`[${this.options.dataAttributes.wordIndex}], [data-${this.options.sectionDataset}]`);
      const sectionId = sectionHost?.dataset?.[this.options.sectionDataset] || '0';
      let tokenCount = 0;

      words.forEach((word, index) => {
        if (!word) {
          return;
        }

        if (/^\s+$/.test(word)) {
          // Append whitespace or boundary as text node
          fragment.appendChild(document.createTextNode(word));
        } else {
          // Create a span for each word
          const span = document.createElement(this.options.wordWrapper);
          span.setAttribute('tabindex', this.options.wordTabIndex);
          span.classList.add(this.options.wordClass);
          span.dataset.spwExpression = 'true';
          span.textContent = word;

          // Assign a unique word index for tracking
          tokenCount += 1;
          const wordIndex = `${chapterId}-${sectionId}-${tokenCount}-${index}`;
          span.setAttribute(this.options.dataAttributes.wordIndex, wordIndex);

          fragment.appendChild(span);
        }
      });

      // Replace the original text node with the new fragment
      parent.replaceChild(fragment, textNode);
    });
  }

  /**
   * Adds focus and blur event listeners to all interactive word spans.
   * @param {HTMLElement} mainContent - The main content element.
   */
  addWordEventListeners(mainContent) {
    // Create bound handlers once so they can be removed later
    if (!this._boundFocus) {
      this._boundFocus = this.handleWordFocus.bind(this);
      this._boundBlur = this.handleWordBlur.bind(this);
    }

    // Select all word spans within the main content
    const wordSpans = mainContent.querySelectorAll(`.${this.options.wordClass}[tabindex="${this.options.wordTabIndex}"]`);
    wordSpans.forEach((span) => {
      span.addEventListener('focus', this._boundFocus);
      span.addEventListener('blur', this._boundBlur);

      // Allow words to be focused via mouse click
      span.addEventListener('click', () => {
        span.focus();
      });
    });
  }

  removeWordEventListeners(mainContent) {
    if (!this._boundFocus) {
      return;
    }
    const wordSpans = mainContent.querySelectorAll(`.${this.options.wordClass}[tabindex="${this.options.wordTabIndex}"]`);
    wordSpans.forEach((span) => {
      span.removeEventListener('focus', this._boundFocus);
      span.removeEventListener('blur', this._boundBlur);
    });
  }

  /**
   * Handles the focus event on a word span.
   * @param {FocusEvent} event - The focus event.
   */
  handleWordFocus(event) {
    const wordSpan = event.target;

    // If the word hasn't been visited yet, mark it as visited
    if (!wordSpan.hasAttribute(this.options.dataAttributes.visited)) {
      this.visitCounter++;
      wordSpan.setAttribute(this.options.dataAttributes.visited, 'true');
      wordSpan.setAttribute(this.options.dataAttributes.visitOrder, this.visitCounter);

      // Update the root-level CSS variable to reflect the number of visited words
      document.documentElement.style.setProperty(this.options.visitedWordsVar, this.visitCounter);
    }

    // Mark the word as currently focused
    wordSpan.setAttribute(this.options.dataAttributes.focused, 'true');
  }

  /**
   * Handles the blur event on a word span.
   * @param {FocusEvent} event - The blur event.
   */
  handleWordBlur(event) {
    const wordSpan = event.target;

    // Remove the focused attribute when the word loses focus
    wordSpan.removeAttribute(this.options.dataAttributes.focused);
  }
}
