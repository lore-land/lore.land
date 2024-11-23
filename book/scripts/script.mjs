// scripts/script.mjs

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
  const chapterDataElement = document.getElementById('chapter-data');
  if (!chapterDataElement) {
    console.error('Chapter data not found.');
    return;
  }

  let chapterData;
  try {
    chapterData = JSON.parse(chapterDataElement.textContent);
  } catch (error) {
    console.error('Error parsing chapter data:', error);
    return;
  }

  initializeStyles(chapterData);
  populateMetadata(chapterData);
  populateContent(chapterData);
  setupNavigation(chapterData);
  setupLoreCollector(chapterData);
  setupPrimaryAction(chapterData);
  setupCustomElementsInteractions(chapterData);
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
    periodStylesLink.href = `/book/styles/periods/${period}.css`;
    body.setAttribute('data-period', period);
  } else {
    periodStylesLink.disabled = true; // Disable if no period is set
  }

  if (mood) {
    moodStylesLink.href = `/book/styles/moods/${mood}.css`;
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
  switch (section.type) {
    case 'paragraph':
      return createParagraph(section);
    case 'figure':
      return createFigure(section);
    case 'section':
      return createSection(section);
    case 'custom-boof':
    case 'custom-puzzle':
    case 'custom-fool':
    case 'custom-reflection':
    case 'custom-path':
      return createCustomElement(section);
    default:
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
      if (child.type.startsWith('custom-')) {
        const customElement = document.createElement(child.type);
        customElement.textContent = child.content;
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

  if (section.img) {
    const img = document.createElement('img');
    img.src = section.img.src;
    img.alt = section.img.alt || '';
    img.loading = section.img.loading || 'lazy';
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
function setupNavigation(data) {
  const prevButton = document.querySelector('.chapter-navigation .prev');
  const nextButton = document.querySelector('.chapter-navigation .next');

  if (prevButton && data.previousChapter) {
    prevButton.textContent = 'Previous Chapter';
    prevButton.addEventListener('click', () => {
      window.location.href = data.previousChapter;
    });
  }

  if (nextButton && data.nextChapter) {
    nextButton.textContent = 'Next Chapter';
    nextButton.addEventListener('click', () => {
      window.location.href = data.nextChapter;
    });
  }
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

  if (!primaryActionButton) {
    console.warn('Primary action button not found.');
    return;
  }

  primaryActionButton.addEventListener('click', () => {
    // Define the primary action behavior here
    // For example, navigate to the next chapter or trigger an event
    if (data.nextChapter) {
      window.location.href = data.nextChapter;
    } else {
      console.warn('No next chapter defined.');
    }
  });
}

/**
 * Sets up interactions with custom elements to enhance user experience.
 * @param {Object} data - The chapter data object.
 */
function setupCustomElementsInteractions(data) {
  // Example: Add event listeners to all custom elements for interactivity
  const customElements = chapterContent.querySelectorAll('custom-boof, custom-puzzle, custom-fool, custom-reflection, custom-path');

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
