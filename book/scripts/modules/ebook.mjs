// Ensure the script runs after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeStyles();
  setupNavigation();
  setupLoreCollector();
  setupPrimaryAction();
  setupCustomElementsInteractions();
});

/**
 * Dynamically loads period and mood stylesheets based on data attributes.
 */
function initializeStyles() {
  const periodStylesLink = document.getElementById('period-styles');
  const moodStylesLink = document.getElementById('mood-styles');
  const body = document.body;

  const period = body.getAttribute('data-period'); // Assuming you have data-period
  const mood = body.getAttribute('data-mood');

  if (period) {
    periodStylesLink.href = `/book/styles/periods/${period}.css`;
  }

  if (mood) {
    moodStylesLink.href = `/book/styles/moods/${mood}.css`;
  }
}

/**
 * Sets up chapter and section navigation controls.
 */
function setupNavigation() {
  // Chapter Navigation
  const chapterNav = document.querySelector('nav[aria-label="Chapter navigation"]');
  if (chapterNav) {
    chapterNav.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') {
        event.preventDefault();
        const href = event.target.getAttribute('href');
        // Implement smooth navigation or fetch content dynamically
        window.location.href = href;
      }
    });
  }

  // Section Navigation
  const sectionNav = document.querySelector('.section-navigation');
  if (sectionNav) {
    const prevSectionBtn = sectionNav.querySelector('.prev-section');
    const nextSectionBtn = sectionNav.querySelector('.next-section');

    prevSectionBtn.addEventListener('click', () => navigateSection('prev'));
    nextSectionBtn.addEventListener('click', () => navigateSection('next'));
  }
}

/**
 * Handles section navigation logic.
 * @param {string} direction - 'prev' or 'next'
 */
function navigateSection(direction) {
  // Placeholder: Implement section navigation logic
  // This could involve scrolling to the previous/next section smoothly
  const sections = document.querySelectorAll('.chapter > section, .chapter > custom-boof, .chapter > custom-boonberry, .chapter > custom-fool');
  const activeSection = document.activeElement || document.querySelector('.chapter :focus') || sections[0];
  let index = Array.from(sections).indexOf(activeSection);

  if (direction === 'prev' && index > 0) {
    sections[index - 1].scrollIntoView({ behavior: 'smooth' });
    sections[index - 1].focus();
  } else if (direction === 'next' && index < sections.length - 1) {
    sections[index + 1].scrollIntoView({ behavior: 'smooth' });
    sections[index + 1].focus();
  }
}

/**
 * Sets up the lore collector functionality.
 */
function setupLoreCollector() {
  const loreButton = document.getElementById('lore-button');
  const loreCollector = document.getElementById('lore-collector');

  if (loreButton && loreCollector) {
    loreButton.addEventListener('click', () => {
      // Toggle visibility of lore collector
      const isExpanded = loreButton.getAttribute('aria-expanded') === 'true';
      loreButton.setAttribute('aria-expanded', String(!isExpanded));
      loreCollector.hidden = isExpanded;

      if (!isExpanded) {
        populateLoreCollector();
      }
    });
  }
}

/**
 * Populates the lore collector with relevant lore items.
 */
function populateLoreCollector() {
  const loreCollector = document.getElementById('lore-collector');
  if (!loreCollector) return;

  // Example: Fetch lore data from a JSON file or API
  fetch('/book/data/lore.json')
    .then(response => response.json())
    .then(data => {
      loreCollector.innerHTML = ''; // Clear existing content
      data.loreItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.description;
        loreCollector.appendChild(li);
      });
    })
    .catch(error => {
      console.error('Error fetching lore data:', error);
      loreCollector.innerHTML = '<li>Failed to load lore.</li>';
    });
}

/**
 * Sets up the primary action button functionality.
 */
function setupPrimaryAction() {
  const primaryActionBtn = document.querySelector('.primary-action');
  if (primaryActionBtn) {
    primaryActionBtn.addEventListener('click', () => {
      // Define the action to advance the story
      // This could navigate to the next chapter, reveal hidden content, etc.
      alert('Advancing the story...');
      // Example: Navigate to the next chapter
      window.location.href = '../../chapter/02/index.html';
    });
  }
}

/**
 * Sets up interactions with custom elements.
 */
function setupCustomElementsInteractions() {
  // Example: Enhance <custom-boof> interactions
  const customBoofs = document.querySelectorAll('custom-boof');
  customBoofs.forEach(boof => {
    boof.addEventListener('click', () => {
      // Define what happens when a custom-boof is clicked
      boof.classList.toggle('active');
      // Possibly reveal more content or trigger animations
    });
  });

  // Example: Enhance <custom-fool> interactions
  const customFools = document.querySelectorAll('custom-fool');
  customFools.forEach(fool => {
    fool.addEventListener('mouseenter', () => {
      // Maybe play a sound or highlight the element
      fool.classList.add('highlight');
    });
    fool.addEventListener('mouseleave', () => {
      fool.classList.remove('highlight');
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
      if (!mainContent) return; // Exit if main content is not found

      // Extract chapter number from URL using regex
      const urlPath = window.location.pathname;
      const chapterMatch = urlPath.match(this.options.urlPattern);
      const chapterNumber = chapterMatch ? chapterMatch[1] : 'unknown';
      mainContent.dataset[this.options.chapterDataset] = chapterNumber;

      // Assign section numbers to sections and custom elements
      const sections = mainContent.querySelectorAll(
        'section, custom-boof, custom-boonberry, custom-fool, custom-echo, custom-puzzle, custom-bonk, custom-paradox, custom-mirror, custom-song, custom-labyrinth, custom-shadow, custom-game, custom-awakening, custom-path, custom-reflection'
      );
      let sectionNumber = 1;
      sections.forEach(section => {
        section.dataset[this.options.sectionDataset] = sectionNumber++;
      });

      // Transform words into interactive elements
      this.wrapWords(mainContent);

      // Add event listeners to handle interactions
      this.addWordEventListeners(mainContent);
    });
  }

  /**
   * Wraps each word in the specified element with a tabbable span.
   * @param {HTMLElement} element - The element containing the text to transform.
   */
  wrapWords(element) {
    // Create a TreeWalker to traverse text nodes
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];

    // Collect all text nodes within the main content
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    // Iterate through each text node to wrap words
    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      const text = textNode.textContent.trim();

      if (text.length === 0) return; // Skip empty text nodes

      // Split text into words and delimiters (spaces, punctuation)
      const words = text.split(/(\s+|\b)/);

      const fragment = document.createDocumentFragment();

      words.forEach((word, index) => {
        if (/\s+/.test(word) || /^\b$/.test(word)) {
          // Append whitespace or boundary as text node
          fragment.appendChild(document.createTextNode(word));
        } else {
          // Create a span for each word
          const span = document.createElement(this.options.wordWrapper);
          span.setAttribute('tabindex', this.options.wordTabIndex);
          span.classList.add(this.options.wordClass);
          span.textContent = word;

          // Assign a unique word index for tracking
          const wordIndex = `${parent.dataset[this.options.chapterDataset]}-${parent.dataset[this.options.sectionDataset]}-${index}`;
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
    // Select all word spans within the main content
    const wordSpans = mainContent.querySelectorAll(`.${this.options.wordClass}[tabindex="${this.options.wordTabIndex}"]`);
    wordSpans.forEach(span => {
      // Bind event handlers to maintain correct 'this' context
      span.addEventListener('focus', this.handleWordFocus.bind(this));
      span.addEventListener('blur', this.handleWordBlur.bind(this));

      // Allow words to be focused via mouse click
      span.addEventListener('click', () => {
        span.focus();
      });
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
