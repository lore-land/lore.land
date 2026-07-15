import { CHAPTER_FLOW_SELECTOR } from './story-lexicon.mjs?v=2026_02_28.I';
import { parseSpwExpressions } from './spw-expression-index.mjs?v=2026_03_01.A';
import { el } from './dom.mjs';

const STORAGE_KEY = 'lore.ebook.navigation.v1';
const REGISTER_KEY = 'lore.ebook.register.v1';
const PERSPECTIVE_MODES = Object.freeze([
  { id: 'composite', sigil: '&', label: 'composite' },
  { id: 'wonder', sigil: '?', label: 'wonder' },
  { id: 'ground', sigil: '.', label: 'ground' },
  { id: 'dangling', sigil: '~', label: 'dangling' },
  { id: 'bound', sigil: '^', label: 'bound' }
]);
const PAYLOAD_MODES = Object.freeze([
  { id: 'all', kind: null, sigil: '&', label: 'all' },
  { id: 'object', kind: '{}', sigil: '.', label: '{}' },
  { id: 'array', kind: '[]', sigil: '?', label: '[]' },
  { id: 'angle', kind: '<>', sigil: '^', label: '<>' },
  { id: 'paren', kind: '()', sigil: '~', label: '()' }
]);

function readState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Failed to read ebook navigation state:', error);
    return {};
  }
}

function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to write ebook navigation state:', error);
  }
}

function readRegisterMode() {
  try {
    const value = window.localStorage.getItem(REGISTER_KEY);
    if (value === 'reader' || value === 'engineer') {
      return value;
    }
  } catch (error) {
    console.warn('Failed to read ebook register mode:', error);
  }
  return 'reader';
}

function writeRegisterMode(mode) {
  try {
    window.localStorage.setItem(REGISTER_KEY, mode);
  } catch (error) {
    console.warn('Failed to write ebook register mode:', error);
  }
}

function chapterKey(chapterNumber) {
  return `chapter-${String(chapterNumber || 0).padStart(2, '0')}`;
}

function labelFromSection(section, index) {
  const heading = section.querySelector('h2, h3, h4');
  if (heading && heading.textContent) {
    return heading.textContent.trim();
  }

  if (section.dataset.spwComponent) {
    return section.dataset.spwComponent.replace(/^custom-/, '').replace(/-/g, ' ');
  }

  if (section.tagName) {
    return section.tagName.toLowerCase();
  }

  return `section ${index + 1}`;
}

function parseSectionIndex(input) {
  const value = Number(input || 0);
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.floor(value);
}

function nearestSectionIndex(sections) {
  if (!sections.length) {
    return 1;
  }

  const anchor = 130;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  sections.forEach((entry, index) => {
    const rect = entry.node.getBoundingClientRect();
    const distance = Math.abs(rect.top - anchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex + 1;
}

function deriveConceptsFromSections(sections) {
  const stop = new Set(['the', 'and', 'of', 'to', 'a', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'from']);
  const seen = new Set();
  const concepts = [];

  sections.forEach((section) => {
    section.label
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean)
      .forEach((word) => {
        if (word.length < 4 || stop.has(word) || seen.has(word)) {
          return;
        }
        seen.add(word);
        concepts.push(word);
      });
  });

  return concepts.slice(0, 12);
}

function sanitizeHandle(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:/._-]+/g, '')
    .replace(/-{2,}/g, '-');
}

function slugify(raw) {
  return sanitizeHandle(raw).replace(/[/:.]/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

function payloadKindForSection(node) {
  if (node.matches('section')) {
    return '{}';
  }
  if (node.matches('figure')) {
    return '[]';
  }
  if (node.dataset.spwComponent || node.tagName.includes('-')) {
    return '<>';
  }
  return '()';
}

function extractAssociations(source) {
  const parsed = parseSpwExpressions(source);
  return parsed.expressions
    .map((expression) => ({
      sigil: expression.sigil,
      handle: sanitizeHandle(expression.handle),
      payload: sanitizeHandle(expression.payload)
    }))
    .filter((expression) => Boolean(expression.handle));
}

function extractReferenceHandles(node, source) {
  const handles = new Set();

  node.querySelectorAll('[data-content_id]').forEach((entry) => {
    const handle = sanitizeHandle(entry.getAttribute('data-content_id'));
    if (handle) {
      handles.add(handle);
    }
  });

  node.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    const handle = sanitizeHandle(href.replace(/^#/, ''));
    if (handle) {
      handles.add(handle);
    }
  });

  const contentAnchorRegex = /#>\s*([a-z0-9:/._-]+)/gi;
  let anchorMatch = contentAnchorRegex.exec(source);
  while (anchorMatch) {
    const handle = sanitizeHandle(anchorMatch[1]);
    if (handle) {
      handles.add(handle);
    }
    anchorMatch = contentAnchorRegex.exec(source);
  }

  const conceptRegex = /@\[([^\]\n]+)\]/g;
  let conceptMatch = conceptRegex.exec(source);
  while (conceptMatch) {
    const handle = sanitizeHandle(conceptMatch[1]);
    if (handle) {
      handles.add(handle);
    }
    conceptMatch = conceptRegex.exec(source);
  }

  extractAssociations(source).forEach((association) => {
    handles.add(association.handle);
  });

  return handles;
}

function classifySection(node, label, parseInfo = null) {
  const text = `${label} ${node.textContent || ''}`;
  const hasHeading = Boolean(node.querySelector('h2, h3, h4'));
  const hasQuestion = /\?/.test(text);
  const hasReference = Boolean(node.querySelector('[data-content_id], a[href^="#"]')) || /#>|@\[/.test(text);
  const isBound = Boolean(node.dataset.spwComponent) || node.tagName.includes('-');
  const parseExpressions = Number(parseInfo?.expressions?.length || 0);
  const parseDiagnostics = Number(parseInfo?.diagnostics?.length || 0);

  return {
    hasHeading,
    hasQuestion,
    hasReference,
    isBound,
    payloadKind: payloadKindForSection(node),
    region: 'narrative',
    boundCount: 0,
    danglingCount: 0,
    parseExpressions,
    parseDiagnostics
  };
}

function deriveRegion(section) {
  if (section.classification.payloadKind === '[]') {
    return 'media';
  }
  if (section.classification.payloadKind === '<>') {
    return 'component';
  }
  if (section.classification.hasReference || section.classification.danglingCount > 0) {
    return 'reference';
  }
  if (section.classification.hasQuestion) {
    return 'wonder';
  }
  if (section.classification.hasHeading) {
    return 'ground';
  }
  return 'narrative';
}

function matchesPerspective(section, perspective) {
  if (perspective === 'wonder') {
    return section.classification.hasQuestion;
  }
  if (perspective === 'ground') {
    return section.classification.hasHeading && !section.classification.hasReference;
  }
  if (perspective === 'dangling') {
    return section.classification.danglingCount > 0 || (!section.classification.isBound && section.classification.hasReference);
  }
  if (perspective === 'bound') {
    return section.classification.isBound || section.classification.boundCount > 0;
  }
  return true;
}

function matchesPayload(section, mode) {
  const selected = PAYLOAD_MODES.find((item) => item.id === mode) || PAYLOAD_MODES[0];
  if (!selected.kind) {
    return true;
  }
  return section.classification.payloadKind === selected.kind;
}

function sigilForSection(section) {
  if (section.classification.danglingCount > 0) {
    return '~';
  }
  if (section.classification.isBound || section.classification.boundCount > 0) {
    return '^';
  }
  if (section.classification.hasQuestion) {
    return '?';
  }
  if (section.classification.hasHeading) {
    return '.';
  }
  return '&';
}

function formatExpression(sigil, handle, payload, syntax = 'prefix') {
  const safeHandle = String(handle || '').trim();
  const safePayload = String(payload || '').trim();
  if (!safeHandle) {
    return safePayload;
  }

  if (!safePayload || syntax !== 'postfix') {
    return safePayload ? `${sigil}[${safeHandle}]{${safePayload}}` : `${sigil}[${safeHandle}]`;
  }
  return `{${safePayload}}${sigil}[${safeHandle}]`;
}

function formatSectionHandle(section, syntax = 'prefix') {
  const base = `s${String(section.index).padStart(2, '0')}/${section.classification.payloadKind}`;
  return formatExpression(sigilForSection(section), base, section.label, syntax);
}

function registerHandle(map, handle, sectionIndex) {
  const key = sanitizeHandle(handle);
  if (!key) {
    return;
  }

  const list = map.get(key);
  if (list) {
    if (!list.includes(sectionIndex)) {
      list.push(sectionIndex);
    }
    return;
  }

  map.set(key, [sectionIndex]);
}

export function initEbookNavigation(chapterData, options = {}) {
  const chapterNumber = Number(chapterData?.chapterNumber || 0);
  const main = options.main || document.getElementById('chapter-content');
  const aside = options.aside || document.querySelector('aside');
  const announce = options.announce;

  if (!chapterNumber || !main || !aside) {
    return null;
  }

  const chapterId = String(chapterNumber).padStart(2, '0');
  const navKey = chapterKey(chapterNumber);
  const sectionNodes = [...main.querySelectorAll(CHAPTER_FLOW_SELECTOR)];
  if (!sectionNodes.length) {
    return null;
  }

  const sections = sectionNodes.map((node, index) => {
    const sectionIndex = index + 1;
    if (!node.id) {
      node.id = `chapter-${chapterId}-section-${String(sectionIndex).padStart(2, '0')}`;
    }

    node.dataset.ebookSection = 'true';
    node.dataset.sectionIndex = String(sectionIndex);
    if (typeof node.tabIndex !== 'number' || node.tabIndex < 0) {
      node.tabIndex = -1;
    }

    const label = labelFromSection(node, index);
    const source = node.textContent || '';
    const parseInfo = parseSpwExpressions(source);
    const classification = classifySection(node, label, parseInfo);
    const primaryHandle = sanitizeHandle(
      `${chapterId}/${slugify(label) || `section-${String(sectionIndex).padStart(2, '0')}`}`
    );

    const definitionHandles = new Set([
      sanitizeHandle(node.id),
      sanitizeHandle(`s${String(sectionIndex).padStart(2, '0')}`),
      primaryHandle
    ]);
    if (node.dataset.spwComponent) {
      definitionHandles.add(sanitizeHandle(node.dataset.spwComponent));
    }
    node.querySelectorAll('[data-content_id]').forEach((entry) => {
      definitionHandles.add(sanitizeHandle(entry.getAttribute('data-content_id')));
    });

    const referenceHandles = extractReferenceHandles(node, source);

    return {
      node,
      id: node.id,
      index: sectionIndex,
      label,
      primaryHandle,
      classification,
      definitionHandles,
      referenceHandles,
      boundHandles: [],
      danglingHandles: [],
      parseInfo
    };
  });

  const definitionsByHandle = new Map();
  const referencesByHandle = new Map();
  sections.forEach((section) => {
    section.definitionHandles.forEach((handle) => registerHandle(definitionsByHandle, handle, section.index));
    section.referenceHandles.forEach((handle) => registerHandle(referencesByHandle, handle, section.index));
  });

  sections.forEach((section) => {
    section.boundHandles = [...section.referenceHandles].filter((handle) => definitionsByHandle.has(handle));
    section.danglingHandles = [...section.referenceHandles].filter((handle) => !definitionsByHandle.has(handle));
    section.classification.boundCount = section.boundHandles.length + (section.classification.isBound ? 1 : 0);
    section.classification.danglingCount = section.danglingHandles.length;
    section.classification.region = deriveRegion(section);

    section.node.dataset.ebookPayload = section.classification.payloadKind;
    section.node.dataset.ebookRegion = section.classification.region;
    section.node.dataset.spwPrimaryHandle = section.primaryHandle;
    section.node.dataset.spwDefinitions = [...section.definitionHandles].join('|');
    section.node.dataset.spwReferences = [...section.referenceHandles].join('|');
    section.node.dataset.spwDangling = section.danglingHandles.length ? section.danglingHandles.join('|') : '';
    section.node.dataset.spwParseExpressions = String(section.classification.parseExpressions || 0);
    section.node.dataset.spwParseDiagnostics = String(section.classification.parseDiagnostics || 0);
  });

  document.body.dataset.ebookExperience = 'model';
  document.body.dataset.ebookChapter = chapterId;

  const existing = aside.querySelector('.ebook-nav-panel');
  if (existing) {
    existing.remove();
  }

  const readerButton = el('button', {
    type: 'button', className: 'ebook-register-button',
    dataset: { ebookRegister: 'reader', spwExpression: 'true' },
    textContent: '^[register]{reader}', 'aria-label': 'Switch to reader register'
  });

  const engineerButton = el('button', {
    type: 'button', className: 'ebook-register-button',
    dataset: { ebookRegister: 'engineer', spwExpression: 'true' },
    textContent: '^[register]{engineer}', 'aria-label': 'Switch to engineer register'
  });

  const registerSwitch = el('div', { className: 'ebook-register-switch', role: 'group', 'aria-label': 'Ebook register mode' }, readerButton, engineerButton);

  const perspectiveButtons = PERSPECTIVE_MODES.map((mode) => el('button', {
    type: 'button', className: 'ebook-perspective-button',
    dataset: { perspective: mode.id, spwExpression: 'true' },
    textContent: `${mode.sigil}[view]{${mode.label}}`, 'aria-label': `Apply ${mode.label} perspective`
  }));

  const perspectiveSwitch = el('div', { className: 'ebook-perspective-switch', role: 'group', 'aria-label': 'Section perspective' }, ...perspectiveButtons);

  const prefixButton = el('button', {
    type: 'button', className: 'ebook-syntax-button',
    dataset: { syntax: 'prefix', spwExpression: 'true' },
    textContent: '^[handle]{prefix}', 'aria-label': 'Use prefix handle syntax'
  });

  const postfixButton = el('button', {
    type: 'button', className: 'ebook-syntax-button',
    dataset: { syntax: 'postfix', spwExpression: 'true' },
    textContent: '^[handle]{postfix}', 'aria-label': 'Use postfix handle syntax'
  });

  const syntaxSwitch = el('div', { className: 'ebook-syntax-switch', role: 'group', 'aria-label': 'Spw handle syntax' }, prefixButton, postfixButton);

  const payloadButtons = PAYLOAD_MODES.map((mode) => el('button', {
    type: 'button', className: 'ebook-payload-button',
    dataset: { payloadMode: mode.id, spwExpression: 'true' },
    'aria-label': `Filter sections by ${mode.label} payload containers`
  }));

  const payloadSwitch = el('div', { className: 'ebook-payload-switch', role: 'group', 'aria-label': 'Container payload mode' }, ...payloadButtons);

  const status = el('p', { className: 'ebook-nav-status', role: 'status', 'aria-live': 'polite' });
  const payloadStatus = el('p', { className: 'ebook-payload-status', role: 'status', 'aria-live': 'polite' });
  const progress = el('progress', { className: 'ebook-nav-progress', max: sections.length, value: 1, 'aria-label': 'Section reading progress' });

  const prevButton = el('button', {
    type: 'button', className: 'ebook-prev',
    dataset: { spwExpression: 'true' },
    textContent: '?[section]{prev}', 'aria-label': 'Go to previous section'
  });

  const resumeButton = el('button', {
    type: 'button', className: 'ebook-resume',
    dataset: { spwExpression: 'true' },
    textContent: '#[resume]{section}', 'aria-label': 'Resume reading at saved section',
    hidden: true
  });

  const nextButton = el('button', {
    type: 'button', className: 'ebook-next',
    dataset: { spwExpression: 'true' },
    textContent: '?[section]{next}', 'aria-label': 'Go to next section'
  });

  const controls = el('div', { className: 'ebook-nav-controls' }, prevButton, resumeButton, nextButton);

  const tocLinks = sections.map((section) => el('button', {
    type: 'button', className: 'ebook-toc-link',
    dataset: { sectionId: section.id, sectionIndex: String(section.index), spwExpression: 'true', spwAnchor: `#>${section.id}` },
    textContent: formatSectionHandle(section, 'prefix'), 'aria-label': `Jump to section ${section.index}: ${section.label}`
  }));

  const toc = el('ol', { className: 'ebook-toc' }, ...tocLinks.map(link => el('li', {}, link)));

  const conceptButtons = deriveConceptsFromSections(sections).map((concept) => el('button', {
    type: 'button', className: 'ebook-concept-link',
    dataset: { concept, spwExpression: 'true' },
    role: 'listitem', textContent: `@[concept/${concept}]`
  }));

  const conceptRail = el('div', { className: 'ebook-concept-rail', role: 'list' }, ...conceptButtons);

  const lspSummary = el('p', { className: 'ebook-lsp-summary' });
  const lspList = el('ul', { className: 'ebook-lsp-list' });
  const lspPanel = el('div', {
    className: 'ebook-lsp-panel',
    'aria-label': 'Spw handle inspector'
  }, lspSummary, lspList);

  // Reading zone: always present. Engineering tools live in a folded details
  // so the rail stops competing with the story on first look.
  const readingZone = el('div', {
    className: 'ebook-rail-zone ebook-rail-zone--reading',
    dataset: { railZone: 'reading' }
  },
    el('h2', { textContent: 'Sections' }),
    status,
    progress,
    controls,
    toc
  );

  const engineerZone = el('details', {
    className: 'ebook-rail-zone ebook-rail-zone--engineer',
    dataset: { railZone: 'engineer' }
  },
    el('summary', { textContent: 'Handles & filters' }),
    el('p', {
      className: 'ebook-nav-bridge',
      textContent: 'Reader register keeps the path simple. Engineer register surfaces handles, filters, and hops.'
    }),
    el('p', {
      className: 'ebook-nav-legend',
      textContent: 'Perspectives: ? wonder · . ground · & composite · ~ dangling · ^ bound'
    }),
    registerSwitch,
    perspectiveSwitch,
    payloadSwitch,
    syntaxSwitch,
    payloadStatus,
    el('h3', { className: 'ebook-concept-heading', textContent: 'Handle inspector' }),
    lspPanel,
    el('h3', { className: 'ebook-concept-heading', textContent: 'Concept routes' }),
    conceptRail
  );

  const panel = el('section', {
    className: 'ebook-nav-panel',
    dataset: { component: 'ebook-navigation', spwComponent: 'ebook-navigation' },
    'aria-label': 'Ebook navigation'
  },
    readingZone,
    engineerZone
  );
  const progressPanel = aside.querySelector('.chapter-progress-panel');
  if (progressPanel) {
    progressPanel.insertAdjacentElement('afterend', panel);
  } else {
    aside.prepend(panel);
  }

  const shellPrev = document.querySelector('.section-navigation .prev');
  const shellNext = document.querySelector('.section-navigation .next');
  [shellPrev, shellNext].forEach((button) => {
    if (!button) {
      return;
    }
    button.dataset.ebookNav = 'true';
    button.dataset.spwExpression = 'true';
  });

  if (shellPrev) {
    shellPrev.textContent = '?[section]{prev}';
    shellPrev.setAttribute('aria-label', 'Open previous section');
  }
  if (shellNext) {
    shellNext.textContent = '?[section]{next}';
    shellNext.setAttribute('aria-label', 'Open next section');
  }

  let activeIndex = 1;
  let programmaticUntil = 0;
  let syntaxMode = 'prefix';
  let perspectiveMode = 'composite';
  let payloadMode = 'all';

  const matchingSections = () =>
    sections.filter((section) => matchesPerspective(section, perspectiveMode) && matchesPayload(section, payloadMode));

  const matchingIndices = () => matchingSections().map((section) => section.index);

  const renderControlLabels = () => {
    readerButton.textContent = formatExpression('^', 'register', 'reader', syntaxMode);
    engineerButton.textContent = formatExpression('^', 'register', 'engineer', syntaxMode);
    prevButton.textContent = formatExpression('?', 'section', 'prev', syntaxMode);
    nextButton.textContent = formatExpression('?', 'section', 'next', syntaxMode);
    if (shellPrev) {
      shellPrev.textContent = formatExpression('?', 'section', 'prev', syntaxMode);
    }
    if (shellNext) {
      shellNext.textContent = formatExpression('?', 'section', 'next', syntaxMode);
    }

    perspectiveButtons.forEach((button) => {
      const mode = PERSPECTIVE_MODES.find((entry) => entry.id === button.dataset.perspective);
      if (!mode) {
        return;
      }
      button.textContent = formatExpression(mode.sigil, 'view', mode.label, syntaxMode);
    });

    payloadButtons.forEach((button) => {
      const mode = PAYLOAD_MODES.find((entry) => entry.id === button.dataset.payloadMode);
      if (!mode) {
        return;
      }
      button.textContent = formatExpression(mode.sigil, 'payload', mode.label, syntaxMode);
    });

    if (!resumeButton.hidden && resumeButton.dataset.resumeIndex) {
      const resumeIndex = parseSectionIndex(resumeButton.dataset.resumeIndex);
      resumeButton.textContent = formatExpression(
        '#',
        'resume',
        `s${String(resumeIndex).padStart(2, '0')}`,
        syntaxMode
      );
    }

    conceptButtons.forEach((button) => {
      const concept = button.dataset.concept || 'concept';
      button.textContent = formatExpression('@', `concept/${concept}`, 'route', syntaxMode);
    });

    tocLinks.forEach((link, index) => {
      const section = sections[index];
      const handle = formatSectionHandle(section, syntaxMode);
      link.textContent = handle;
      link.dataset.spwHandle = handle;
    });
  };

  const applyRegister = (mode, spoken = false) => {
    const nextMode = mode === 'engineer' ? 'engineer' : 'reader';
    document.documentElement.dataset.ebookRegister = nextMode;
    panel.dataset.ebookRegister = nextMode;
    // Engineer tools stay folded in reader mode; open when inspecting structure.
    engineerZone.open = nextMode === 'engineer';
    engineerZone.dataset.register = nextMode;
    [readerButton, engineerButton].forEach((button) => {
      const active = button.dataset.ebookRegister === nextMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    writeRegisterMode(nextMode);
    if (spoken && announce) {
      announce(`Ebook register set to ${nextMode}.`);
    }
  };

  const applySyntaxMode = (mode, spoken = false) => {
    syntaxMode = mode === 'postfix' ? 'postfix' : 'prefix';
    panel.dataset.syntax = syntaxMode;
    [prefixButton, postfixButton].forEach((button) => {
      const active = button.dataset.syntax === syntaxMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderControlLabels();
    const current = sections[activeIndex - 1];
    if (current) {
      updateLspInspector(current);
    }

    if (spoken && announce) {
      announce(`Handle syntax: ${syntaxMode}.`);
    }
  };

  const applyPerspective = (mode, spoken = false) => {
    perspectiveMode = PERSPECTIVE_MODES.some((item) => item.id === mode) ? mode : 'composite';
    panel.dataset.perspective = perspectiveMode;
    perspectiveButtons.forEach((button) => {
      const active = button.dataset.perspective === perspectiveMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    applyFilters(spoken);
  };

  const applyPayloadMode = (mode, spoken = false) => {
    payloadMode = PAYLOAD_MODES.some((item) => item.id === mode) ? mode : 'all';
    panel.dataset.payloadMode = payloadMode;
    payloadButtons.forEach((button) => {
      const active = button.dataset.payloadMode === payloadMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    applyFilters(spoken);
  };

  const applyFilters = (spoken = false) => {
    const matching = matchingSections();
    sections.forEach((section, index) => {
      const perspectiveMatch = matchesPerspective(section, perspectiveMode);
      const payloadMatch = matchesPayload(section, payloadMode);
      const match = perspectiveMatch && payloadMatch;
      section.node.dataset.ebookPerspectiveMatch = perspectiveMatch ? 'true' : 'false';
      section.node.dataset.ebookPayloadMatch = payloadMatch ? 'true' : 'false';
      section.node.dataset.ebookFilterMatch = match ? 'true' : 'false';
      tocLinks[index].dataset.perspectiveMatch = perspectiveMatch ? 'true' : 'false';
      tocLinks[index].dataset.payloadMatch = payloadMatch ? 'true' : 'false';
      tocLinks[index].dataset.filterMatch = match ? 'true' : 'false';
    });

    panel.dataset.emptyFilter = matching.length ? 'false' : 'true';

    if (!matching.length) {
      updateControls();
      updateReadouts();
      const current = sections[activeIndex - 1];
      if (current) {
        updateLspInspector(current);
      }
    } else if (!matching.some((section) => section.index === activeIndex)) {
      jumpTo(matching[0].index, 'filters');
    } else {
      updateControls();
      updateReadouts();
      const current = sections[activeIndex - 1];
      if (current) {
        updateLspInspector(current);
      }
    }

    if (spoken && announce) {
      announce(`View filters set: ${perspectiveMode} perspective, ${payloadMode} payload.`);
    }
  };

  const persist = (index) => {
    const state = readState();
    state[navKey] = {
      sectionIndex: index,
      sectionId: sections[index - 1]?.id || '',
      progress: Number((index / sections.length).toFixed(3)),
      perspective: perspectiveMode,
      payloadMode,
      syntaxMode,
      updatedAt: new Date().toISOString()
    };
    writeState(state);
  };

  const updateControls = () => {
    const matches = matchingIndices();
    if (!matches.length) {
      prevButton.disabled = true;
      nextButton.disabled = true;
      if (shellPrev) {
        shellPrev.disabled = true;
      }
      if (shellNext) {
        shellNext.disabled = true;
      }
      return;
    }

    const position = matches.indexOf(activeIndex);
    const atStart = position <= 0;
    const atEnd = position < 0 || position >= matches.length - 1;

    prevButton.disabled = atStart;
    nextButton.disabled = atEnd;
    if (shellPrev) {
      shellPrev.disabled = atStart;
    }
    if (shellNext) {
      shellNext.disabled = atEnd;
    }
  };

  const updateReadouts = () => {
    const activeSection = sections[activeIndex - 1];
    if (!activeSection) {
      return;
    }

    const matches = matchingIndices();
    const viewPosition = matches.indexOf(activeIndex);
    const viewLabel = matches.length
      ? `view ${Math.max(1, viewPosition + 1)} of ${matches.length}`
      : 'view empty';

    progress.value = activeIndex;
    status.textContent = `Section ${activeIndex} of ${sections.length} • ${activeSection.label} • ${viewLabel}`;
    payloadStatus.textContent = `Payload ${activeSection.classification.payloadKind} • Region ${activeSection.classification.region} • Bound ${activeSection.classification.boundCount} • Dangling ${activeSection.classification.danglingCount} • Parsed ${activeSection.classification.parseExpressions} • Diagnostics ${activeSection.classification.parseDiagnostics}`;
  };

  const pickAlternateSection = (candidates) => {
    if (!candidates || !candidates.length) {
      return null;
    }
    return candidates.find((index) => index !== activeIndex) || candidates[0];
  };

  const updateLspInspector = (section) => {
    lspList.innerHTML = '';
    if (!section) {
      lspSummary.textContent = formatExpression('&', 'lsp', 'no-section', syntaxMode);
      return;
    }

    const definitionHandles = [...section.definitionHandles].slice(0, 6);
    const referenceHandles = [...section.referenceHandles].slice(0, 6);

    // Prefer primary + component handles; drop noisy auto-ids unless alone.
    const preferredDefs = definitionHandles.filter((handle) => {
      if (handle === section.primaryHandle) return true;
      if (handle.startsWith('custom-') || handle.includes('/')) return true;
      if (/^s\d{2}$/.test(handle)) return true;
      return definitionHandles.length <= 2;
    });
    const defsToShow = preferredDefs.length ? preferredDefs.slice(0, 4) : definitionHandles.slice(0, 4);

    const linkedCount = defsToShow.filter((handle) => {
      const refs = (referencesByHandle.get(handle) || []).filter((idx) => idx !== section.index);
      return refs.length > 0;
    }).length;

    lspSummary.textContent = formatExpression(
      '&',
      `lsp/${section.primaryHandle}`,
      `local:${defsToShow.length - linkedCount} linked:${linkedCount}`,
      syntaxMode
    );

    const appendItem = ({ sigil, handle, payload, target, stateLabel, source }) => {
      const item = document.createElement('li');
      item.className = 'ebook-lsp-item';
      item.dataset.handleState = stateLabel;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ebook-lsp-link';
      button.dataset.spwExpression = 'true';
      button.textContent = formatExpression(sigil, `lsp/${handle}`, payload, syntaxMode);
      if (!target) {
        button.disabled = true;
      } else {
        button.addEventListener('click', () => jumpTo(target, source));
      }

      const state = document.createElement('span');
      state.className = 'ebook-lsp-state';
      state.textContent = stateLabel;

      item.append(button, state);
      lspList.append(item);
    };

    defsToShow.forEach((handle) => {
      const refs = (referencesByHandle.get(handle) || []).filter((idx) => idx !== section.index);
      const target = pickAlternateSection(refs);
      // Local = defined here, not yet cited elsewhere (normal for chamber prose).
      const stateLabel = refs.length ? 'linked' : 'local';
      appendItem({
        sigil: refs.length ? '^' : '.',
        handle,
        payload: refs.length ? `refs:${refs.length}` : 'local',
        target,
        stateLabel,
        source: 'lsp-references'
      });
    });

    referenceHandles.forEach((handle) => {
      const defs = definitionsByHandle.get(handle) || [];
      const target = pickAlternateSection(defs);
      appendItem({
        sigil: defs.length ? '@' : '~',
        handle,
        payload: defs.length ? `defs:${defs.length}` : 'dangling',
        target,
        stateLabel: defs.length ? 'bound' : 'dangling',
        source: defs.length ? 'lsp-definition' : 'lsp-dangling'
      });
    });

    if (!lspList.childElementCount) {
      appendItem({
        sigil: '&',
        handle: section.primaryHandle || 'section',
        payload: 'section',
        target: null,
        stateLabel: 'local',
        source: 'lsp-empty'
      });
    }
  };

  const setActive = (index, source = 'section') => {
    const nextIndex = Math.max(1, Math.min(index, sections.length));
    activeIndex = nextIndex;

    sections.forEach((section, sectionIdx) => {
      section.node.classList.toggle('is-ebook-active', sectionIdx + 1 === activeIndex);
    });

    tocLinks.forEach((link, linkIdx) => {
      link.setAttribute('aria-current', linkIdx + 1 === activeIndex ? 'true' : 'false');
    });

    const activeLabel = sections[activeIndex - 1].label.toLowerCase();
    conceptButtons.forEach((button) => {
      const concept = String(button.dataset.concept || '').toLowerCase();
      button.setAttribute('aria-current', concept && activeLabel.includes(concept) ? 'true' : 'false');
    });

    document.body.dataset.ebookSection = String(activeIndex);
    updateControls();
    updateReadouts();
    updateLspInspector(sections[activeIndex - 1]);
    persist(activeIndex);

    window.dispatchEvent(
      new CustomEvent('lore:ebook-section-change', {
        detail: {
          chapterNumber,
          sectionIndex: activeIndex,
          sectionId: sections[activeIndex - 1].id,
          source
        }
      })
    );
  };

  const jumpRelative = (step, source = 'controls') => {
    const matches = matchingIndices();
    if (!matches.length) {
      return;
    }
    const position = matches.indexOf(activeIndex);
    if (position < 0) {
      jumpTo(matches[step >= 0 ? 0 : matches.length - 1], source);
      return;
    }
    const nextPosition = Math.max(0, Math.min(position + step, matches.length - 1));
    jumpTo(matches[nextPosition], source);
  };

  const jumpTo = (index, source = 'toc') => {
    const nextIndex = Math.max(1, Math.min(index, sections.length));
    const target = sections[nextIndex - 1];
    if (!target) {
      return;
    }

    programmaticUntil = Date.now() + 420;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    target.node.focus({ preventScroll: true });
    setActive(nextIndex, source);

    if (announce) {
      announce(`Section ${nextIndex}: ${target.label}`);
    }
  };

  tocLinks.forEach((link) => {
    link.addEventListener('click', () => {
      jumpTo(parseSectionIndex(link.dataset.sectionIndex), 'toc');
    });
  });

  prevButton.addEventListener('click', () => jumpRelative(-1, 'controls'));
  nextButton.addEventListener('click', () => jumpRelative(1, 'controls'));
  if (shellPrev) {
    shellPrev.addEventListener('click', () => jumpRelative(-1, 'shell-controls'));
  }
  if (shellNext) {
    shellNext.addEventListener('click', () => jumpRelative(1, 'shell-controls'));
  }

  conceptButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const concept = button.dataset.concept || '';
      const scoped = matchingSections();
      const match =
        scoped.find((section) => section.label.toLowerCase().includes(concept)) ||
        sections.find((section) => section.label.toLowerCase().includes(concept));
      if (!match) {
        return;
      }
      jumpTo(match.index, 'concept');
      if (announce) {
        announce(`Concept route: ${concept}.`);
      }
    });
  });

  readerButton.addEventListener('click', () => applyRegister('reader', true));
  engineerButton.addEventListener('click', () => applyRegister('engineer', true));
  prefixButton.addEventListener('click', () => applySyntaxMode('prefix', true));
  postfixButton.addEventListener('click', () => applySyntaxMode('postfix', true));
  payloadButtons.forEach((button) => {
    button.addEventListener('click', () => applyPayloadMode(button.dataset.payloadMode || 'all', true));
  });
  perspectiveButtons.forEach((button) => {
    button.addEventListener('click', () => applyPerspective(button.dataset.perspective || 'composite', true));
  });

  const stored = readState()[navKey];
  const resumeIndex = parseSectionIndex(stored?.sectionIndex);
  if (resumeIndex > 1 && resumeIndex <= sections.length) {
    resumeButton.hidden = false;
    resumeButton.dataset.resumeIndex = String(resumeIndex);
    resumeButton.textContent = formatExpression(
      '#',
      'resume',
      `s${String(resumeIndex).padStart(2, '0')}`,
      syntaxMode
    );
    resumeButton.addEventListener('click', () => jumpTo(resumeIndex, 'resume'));
  }

  let rafId = 0;
  const onScroll = () => {
    if (Date.now() < programmaticUntil) {
      return;
    }
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      const candidates = matchingSections();
      const index = nearestSectionIndex(candidates.length ? candidates : sections);
      if (index !== activeIndex) {
        setActive(index, 'scroll');
      }
    });
  };

  const onKeydownNav = (event) => {
    if (event.defaultPrevented) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const focused = document.activeElement;
    const tagName = focused ? focused.tagName : '';
    if (focused?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return;
    }

    if (event.key === 'PageDown' || (event.altKey && event.key === 'ArrowDown')) {
      event.preventDefault();
      jumpRelative(1, 'keyboard');
    } else if (event.key === 'PageUp' || (event.altKey && event.key === 'ArrowUp')) {
      event.preventDefault();
      jumpRelative(-1, 'keyboard');
    } else if (event.key === ']') {
      /* ] click → next section (bracket navigation) */
      event.preventDefault();
      jumpRelative(1, 'bracket');
    } else if (event.key === '[') {
      /* [ click → previous section (bracket navigation) */
      event.preventDefault();
      jumpRelative(-1, 'bracket');
    }
  };

  /* { / } hold — different navigation shape.
     { (Shift+[) held → breadth mode: see all concept routes and perspectives.
     } (Shift+]) held → depth mode: focus region / structural zoom.
     These use separate listeners to bypass the shiftKey guard above. */
  const NAV_HOLD_SHAPES = Object.freeze({ '{': 'breadth', '}': 'depth' });
  const holdKeys = new Set();

  const applyNavShape = () => {
    const shape = holdKeys.has('{') ? 'breadth' : holdKeys.has('}') ? 'depth' : null;
    if (shape) {
      panel.dataset.navShape = shape;
      document.body.dataset.ebookNavShape = shape;
    } else {
      delete panel.dataset.navShape;
      delete document.body.dataset.ebookNavShape;
    }
  };

  const onKeydownShape = (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) {
      return;
    }
    const focused = document.activeElement;
    const tagName = focused ? focused.tagName : '';
    if (focused?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return;
    }
    if (NAV_HOLD_SHAPES[event.key]) {
      holdKeys.add(event.key);
      applyNavShape();
    }
  };

  const onKeyup = (event) => {
    if (NAV_HOLD_SHAPES[event.key]) {
      holdKeys.delete(event.key);
      applyNavShape();
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('keydown', onKeydownNav);
  document.addEventListener('keydown', onKeydownShape);
  document.addEventListener('keyup', onKeyup);

  const startIndex = resumeIndex > 0 && resumeIndex <= sections.length ? resumeIndex : parseSectionIndex(stored?.sectionIndex);
  applyRegister(readRegisterMode(), false);
  applySyntaxMode(stored?.syntaxMode === 'postfix' ? 'postfix' : 'prefix', false);
  applyPerspective(stored?.perspective || 'composite', false);
  applyPayloadMode(stored?.payloadMode || 'all', false);
  renderControlLabels();
  setActive(startIndex, 'init');
  applyFilters(false);

  const destroy = () => {
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', onKeydownNav);
    document.removeEventListener('keydown', onKeydownShape);
    document.removeEventListener('keyup', onKeyup);
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    holdKeys.clear();
    panel.remove();
  };

  return {
    chapterNumber,
    sectionCount: sections.length,
    jumpToSection: (index) => jumpTo(index, 'api'),
    currentSection: () => activeIndex,
    setPerspective: (mode) => applyPerspective(mode, false),
    setPayloadMode: (mode) => applyPayloadMode(mode, false),
    setSyntaxMode: (mode) => applySyntaxMode(mode, false),
    destroy
  };
}
