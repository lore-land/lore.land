/**
 * language-exploration.mjs — Optional progressive enhancement for
 * exploring language and thematic resonance inside a chamber.
 *
 * Story remains primary: prose is complete without this module.
 * When the reader opts in, thematic terms in the chapter are marked
 * lightly; focusing one term lights its theme family (resonance).
 * A small aside panel lists themes, counts, and filter controls.
 *
 * Source of truth for anchors:
 *   1. chapter.lexicon (authored, optional)
 *   2. chapter.topics → shared monument lexicon
 *   3. always-on civic seeds (seal, ledger, measure, kitchen, pack…)
 */

const STORAGE_KEY = 'lore.experience.languageExplore';
const PREF_EVENT = 'lore:preference-change';

/** Monument-wide seeds keyed by topic / civic id. */
export const MONUMENT_LEXICON = Object.freeze({
  promise: Object.freeze({
    id: 'promise',
    label: 'Public promise',
    href: '/topics/#promise',
    terms: Object.freeze([
      'promise',
      'promises',
      'ledger',
      'ledgers',
      'seal',
      'seals',
      'measure',
      'measures',
      'count',
      'record',
      'totals'
    ])
  }),
  voice: Object.freeze({
    id: 'voice',
    label: 'Voice & register',
    href: '/topics/#voice',
    terms: Object.freeze(['fool', 'register', 'joke', 'bow', 'voice'])
  }),
  audience: Object.freeze({
    id: 'audience',
    label: 'Who receives',
    href: '/topics/#audience',
    terms: Object.freeze([
      'kitchen',
      'kitchens',
      'stove',
      'stoves',
      'district',
      'districts',
      'children',
      'elders',
      'warmth'
    ])
  }),
  memory: Object.freeze({
    id: 'memory',
    label: 'Living memory',
    href: '/topics/#memory',
    terms: Object.freeze(['archive', 'map', 'stems', 'echo', 'echoes', 'memory'])
  }),
  polarity: Object.freeze({
    id: 'polarity',
    label: 'Held polarity',
    href: '/topics/#polarity',
    terms: Object.freeze(['boon', 'bane', 'bone', 'council', 'argument', 'motive', 'motives'])
  }),
  motif: Object.freeze({
    id: 'motif',
    label: 'Motif system',
    href: '/topics/#motif',
    terms: Object.freeze(['berry', 'berries', 'boonberry', 'boonberries', 'lantern', 'stem', 'stems'])
  }),
  reward: Object.freeze({
    id: 'reward',
    label: 'Motivation & reward',
    href: '/topics/#reward',
    terms: Object.freeze([
      'blueberry',
      'blueberries',
      'fruit',
      'pack',
      'nose',
      'scent',
      'applause',
      'treat',
      'reward'
    ])
  }),
  provenance: Object.freeze({
    id: 'provenance',
    label: 'Marked funding',
    href: '/topics/#provenance',
    terms: Object.freeze(['patron', 'sponsorship', 'threshold', 'pedestal'])
  }),
  wonder: Object.freeze({
    id: 'wonder',
    label: 'Wonder path',
    href: '/world/boonberry-commons.html',
    terms: Object.freeze(['dawn', 'dawnward', 'light', 'awakened', 'constellation', 'field', 'rows'])
  }),
  guide: Object.freeze({
    id: 'guide',
    label: 'Guide',
    href: '/characters/boof.html',
    terms: Object.freeze(['boof', 'dog', 'clerk', 'paw', 'paws'])
  }),
  cadence: Object.freeze({
    id: 'cadence',
    label: 'Release rhythm',
    href: '/topics/#cadence',
    terms: Object.freeze(['calendar', 'rhythm', 'return'])
  }),
  experience: Object.freeze({
    id: 'experience',
    label: 'Wonder path',
    href: '/scriptorium/#experience-path',
    terms: Object.freeze(['trail', 'beginning', 'inspection', 'path'])
  })
});

const SKIP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'a',
  'button',
  'summary',
  'pre',
  'code',
  'h1',
  'h2',
  'h3',
  'figcaption',
  'label',
  '.scene-sketch',
  '.lang-mark',
  '.chapter-topic-row',
  '.chapter-route-rail',
  '.chapter-pillars',
  '.chapter-byline',
  '.chapter-logline',
  '.chapter-epigraph',
  '.spw-language',
  '.spw-token',
  '[data-component="scene-sketch"]'
].join(', ');

/**
 * Resolve the active lexicon for a chapter payload.
 * @param {Object} data - chapter JSON
 * @returns {Array<{id:string,label:string,href?:string,terms:string[]}>}
 */
export function resolveChapterLexicon(data = {}) {
  const byId = new Map();

  const addEntry = (entry) => {
    if (!entry || !entry.id) {
      return;
    }
    const terms = Array.isArray(entry.terms)
      ? entry.terms.map((t) => String(t).trim()).filter(Boolean)
      : [];
    const existing = byId.get(entry.id);
    if (existing) {
      const merged = new Set([...existing.terms, ...terms]);
      existing.terms = [...merged];
      if (entry.label) {
        existing.label = entry.label;
      }
      if (entry.href) {
        existing.href = entry.href;
      }
      return;
    }
    byId.set(entry.id, {
      id: entry.id,
      label: entry.label || entry.id,
      href: entry.href || `/topics/#${entry.id}`,
      terms: [...new Set(terms)]
    });
  };

  if (Array.isArray(data.lexicon)) {
    data.lexicon.forEach(addEntry);
  }

  if (Array.isArray(data.topics)) {
    data.topics.forEach((topic) => {
      const seed = MONUMENT_LEXICON[topic.id];
      if (seed) {
        addEntry({
          ...seed,
          label: topic.label || seed.label,
          href: topic.href || seed.href
        });
      } else if (topic.id) {
        addEntry({
          id: topic.id,
          label: topic.label || topic.id,
          href: topic.href,
          terms: topic.terms || []
        });
      }
    });
  }

  // Civic seeds always available so language exploration works even without topics.
  ['promise', 'motif', 'reward', 'guide', 'wonder'].forEach((id) => {
    if (!byId.has(id) && MONUMENT_LEXICON[id]) {
      addEntry(MONUMENT_LEXICON[id]);
    }
  });

  return [...byId.values()].filter((entry) => entry.terms.length > 0);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMatcher(lexicon) {
  const termMap = new Map(); // lowercased term → entry
  const terms = [];

  lexicon.forEach((entry) => {
    entry.terms.forEach((term) => {
      const key = term.toLowerCase();
      if (!termMap.has(key)) {
        termMap.set(key, entry);
        terms.push(term);
      }
    });
  });

  if (!terms.length) {
    return null;
  }

  terms.sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
  return { pattern, termMap };
}

function collectTextNodes(root) {
  const nodes = [];
  if (!root) {
    return nodes;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.closest(SKIP_SELECTOR)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  return nodes;
}

function markTextNode(textNode, matcher, focusableThemes = new Set()) {
  const text = textNode.nodeValue;
  matcher.pattern.lastIndex = 0;
  if (!matcher.pattern.test(text)) {
    return 0;
  }

  matcher.pattern.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;
  let count = 0;

  while ((match = matcher.pattern.exec(text)) !== null) {
    const matched = match[0];
    const start = match.index;
    if (start > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
    }

    const entry = matcher.termMap.get(matched.toLowerCase());
    const mark = document.createElement('mark');
    mark.className = 'lang-mark';
    mark.dataset.theme = entry?.id || 'motif';
    mark.dataset.themeLabel = entry?.label || entry?.id || 'theme';
    if (entry?.href) {
      mark.dataset.themeHref = entry.href;
    }
    // One keyboard stop per theme (not per occurrence) keeps tab order usable.
    const themeId = entry?.id || 'motif';
    if (!focusableThemes.has(themeId)) {
      focusableThemes.add(themeId);
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute(
        'aria-label',
        `${matched}: thematic thread ${entry?.label || themeId}`
      );
    }
    mark.textContent = matched;
    fragment.appendChild(mark);
    count += 1;
    lastIndex = start + matched.length;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.parentNode.replaceChild(fragment, textNode);
  return count;
}

function clearMarks(root) {
  if (!root) {
    return;
  }
  root.querySelectorAll('mark.lang-mark').forEach((mark) => {
    const text = document.createTextNode(mark.textContent || '');
    mark.replaceWith(text);
  });
  // Merge adjacent text nodes left by unwrapping.
  root.normalize();
}

function readStoredEnabled() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writeStoredEnabled(enabled) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // preference is optional
  }
}

/**
 * Initialize optional language exploration + thematic resonance.
 *
 * @param {Object} data - chapter JSON
 * @param {{ root?: HTMLElement, announce?: Function }} [options]
 * @returns {{ destroy: Function, setEnabled: Function, isEnabled: Function } | null}
 */
export function initLanguageExploration(data, options = {}) {
  const root = options.root || document.getElementById('chapter-content');
  const aside = document.querySelector('aside');
  const announce = options.announce || (() => {});

  if (!root || !aside) {
    return null;
  }

  const lexicon = resolveChapterLexicon(data);
  const matcher = buildMatcher(lexicon);
  if (!matcher) {
    return null;
  }

  const existing = aside.querySelector('.language-explore-panel');
  if (existing) {
    existing.remove();
  }

  let enabled = false;
  let activeTheme = '';
  let filterTheme = '';
  let markCount = 0;
  const counts = new Map();

  const panel = document.createElement('section');
  panel.className = 'language-explore-panel';
  panel.dataset.component = 'language-explore';
  panel.setAttribute('aria-label', 'Optional language exploration');

  const heading = document.createElement('h2');
  heading.textContent = 'Explore language';

  const intro = document.createElement('p');
  intro.className = 'language-explore-intro';
  intro.textContent =
    'Optional. Mark thematic threads in the prose—promise, reward, pack, light—and feel which words lean toward each other.';

  const phrase = document.createElement('pre');
  phrase.className = 'motif-spw language-explore-spw';
  phrase.textContent = `?[language]{#[resonance] · ~[explore]}`;

  const controls = document.createElement('div');
  controls.className = 'language-explore-controls';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'language-explore-toggle';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = 'Mark thematic threads';

  const status = document.createElement('p');
  status.className = 'language-explore-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Marks stay hidden until you invite them.';

  controls.append(toggle);

  const themeList = document.createElement('ul');
  themeList.className = 'language-theme-list';
  themeList.setAttribute('role', 'list');
  themeList.hidden = true;

  const resonanceNote = document.createElement('p');
  resonanceNote.className = 'language-resonance-note';
  resonanceNote.hidden = true;
  resonanceNote.textContent =
    'Focus or hover a marked word: its theme family resonates across the chamber.';

  panel.append(heading, intro, phrase, controls, status, themeList, resonanceNote);
  aside.append(panel);

  const recount = () => {
    counts.clear();
    markCount = 0;
    root.querySelectorAll('mark.lang-mark').forEach((mark) => {
      markCount += 1;
      const theme = mark.dataset.theme || 'motif';
      counts.set(theme, (counts.get(theme) || 0) + 1);
    });
  };

  const renderThemeList = () => {
    themeList.replaceChildren();
    if (!enabled) {
      themeList.hidden = true;
      resonanceNote.hidden = true;
      return;
    }

    themeList.hidden = false;
    resonanceNote.hidden = false;

    const allItem = document.createElement('li');
    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = 'language-theme-chip';
    allButton.dataset.themeFilter = '';
    allButton.setAttribute('aria-pressed', filterTheme ? 'false' : 'true');
    allButton.textContent = `all · ${markCount}`;
    allButton.addEventListener('click', () => {
      filterTheme = '';
      applyFilter();
      renderThemeList();
      announce('Showing all thematic threads.');
    });
    allItem.append(allButton);
    themeList.append(allItem);

    lexicon.forEach((entry) => {
      const count = counts.get(entry.id) || 0;
      if (!count) {
        return;
      }
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'language-theme-chip';
      button.dataset.themeFilter = entry.id;
      button.dataset.theme = entry.id;
      button.setAttribute('aria-pressed', filterTheme === entry.id ? 'true' : 'false');
      button.textContent = `${entry.label} · ${count}`;
      button.title = entry.terms.slice(0, 6).join(', ');
      button.addEventListener('click', () => {
        filterTheme = filterTheme === entry.id ? '' : entry.id;
        applyFilter();
        renderThemeList();
        announce(
          filterTheme
            ? `Resonating theme: ${entry.label}.`
            : 'Showing all thematic threads.'
        );
      });
      item.append(button);
      themeList.append(item);
    });
  };

  const applyFilter = () => {
    root.querySelectorAll('mark.lang-mark').forEach((mark) => {
      const theme = mark.dataset.theme || '';
      const dimmed = Boolean(filterTheme) && theme !== filterTheme;
      mark.dataset.dimmed = dimmed ? 'true' : 'false';
      mark.classList.toggle('is-filtered-out', dimmed);
    });
    root.dataset.languageFilter = filterTheme || '';
  };

  const setResonance = (themeId) => {
    activeTheme = themeId || '';
    root.dataset.resonanceTheme = activeTheme;
    root.querySelectorAll('mark.lang-mark').forEach((mark) => {
      const match = activeTheme && mark.dataset.theme === activeTheme;
      mark.classList.toggle('is-resonant', Boolean(match));
      mark.classList.toggle('is-quiet', Boolean(activeTheme) && !match);
    });
  };

  const onMarkFocus = (event) => {
    const mark = event.target.closest?.('mark.lang-mark');
    if (!mark || !root.contains(mark)) {
      return;
    }
    setResonance(mark.dataset.theme || '');
  };

  const onMarkBlur = (event) => {
    const next = event.relatedTarget;
    if (next && root.contains(next) && next.closest?.('mark.lang-mark')) {
      return;
    }
    // Keep resonance if pointer is still over a mark; otherwise clear.
    if (!root.querySelector('mark.lang-mark:hover')) {
      setResonance('');
    }
  };

  const onMarkPointer = (event) => {
    const mark = event.target.closest?.('mark.lang-mark');
    if (!mark || !root.contains(mark)) {
      if (event.type === 'pointerleave' || event.type === 'pointerout') {
        if (!root.querySelector('mark.lang-mark:focus-visible, mark.lang-mark:focus')) {
          setResonance('');
        }
      }
      return;
    }
    if (event.type === 'pointerover' || event.type === 'pointerenter') {
      setResonance(mark.dataset.theme || '');
    }
  };

  const onMarkActivate = (event) => {
    const mark = event.target.closest?.('mark.lang-mark');
    if (!mark || !root.contains(mark)) {
      return;
    }
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (event.type === 'keydown') {
      event.preventDefault();
    }

    const theme = mark.dataset.theme || '';
    filterTheme = filterTheme === theme ? '' : theme;
    applyFilter();
    renderThemeList();
    setResonance(theme);

    const label = mark.dataset.themeLabel || theme;
    announce(
      filterTheme
        ? `Thread held: ${label}. Related words resonate.`
        : `Thread released. All marks rest.`
    );
  };

  const bindMarkEvents = () => {
    root.addEventListener('focusin', onMarkFocus);
    root.addEventListener('focusout', onMarkBlur);
    root.addEventListener('pointerover', onMarkPointer);
    root.addEventListener('pointerout', onMarkPointer);
    root.addEventListener('click', onMarkActivate);
    root.addEventListener('keydown', onMarkActivate);
  };

  const unbindMarkEvents = () => {
    root.removeEventListener('focusin', onMarkFocus);
    root.removeEventListener('focusout', onMarkBlur);
    root.removeEventListener('pointerover', onMarkPointer);
    root.removeEventListener('pointerout', onMarkPointer);
    root.removeEventListener('click', onMarkActivate);
    root.removeEventListener('keydown', onMarkActivate);
  };

  const applyMarks = () => {
    clearMarks(root);
    let total = 0;
    const focusableThemes = new Set();
    collectTextNodes(root).forEach((node) => {
      total += markTextNode(node, matcher, focusableThemes);
    });
    recount();
    applyFilter();
    renderThemeList();
    return total;
  };

  const setEnabled = (next, { persist = true, quiet = false } = {}) => {
    const want = Boolean(next);
    if (want === enabled) {
      if (want) {
        // Re-apply after content changes.
        applyMarks();
      }
      return enabled;
    }

    enabled = want;
    root.dataset.languageExplore = enabled ? 'on' : 'off';
    document.documentElement.dataset.languageExplore = enabled ? 'on' : 'off';
    panel.dataset.active = enabled ? 'true' : 'false';
    toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    toggle.textContent = enabled ? 'Clear thematic marks' : 'Mark thematic threads';

    if (enabled) {
      const total = applyMarks();
      bindMarkEvents();
      status.textContent =
        total > 0
          ? `${total} thread${total === 1 ? '' : 's'} marked across ${counts.size} theme${counts.size === 1 ? '' : 's'}.`
          : 'No matching threads in this chamber yet.';
      if (!quiet) {
        announce(`Language exploration on. ${status.textContent}`);
      }
    } else {
      unbindMarkEvents();
      clearMarks(root);
      setResonance('');
      filterTheme = '';
      markCount = 0;
      counts.clear();
      renderThemeList();
      delete root.dataset.languageFilter;
      delete root.dataset.resonanceTheme;
      status.textContent = 'Marks stay hidden until you invite them.';
      if (!quiet) {
        announce('Language exploration cleared. Prose rests unmarked.');
      }
    }

    if (persist) {
      writeStoredEnabled(enabled);
    }
    return enabled;
  };

  toggle.addEventListener('click', () => {
    setEnabled(!enabled);
  });

  // Soft invite when tuning is explore — never auto-mark without preference.
  const onPreference = (event) => {
    if (event.detail?.key !== 'tuning') {
      return;
    }
    if (event.detail.value === 'explore' && !enabled && !readStoredEnabled()) {
      status.textContent =
        'Explore tuning is on. Mark thematic threads when you want the language to show its seams.';
      panel.dataset.invite = 'true';
    } else {
      panel.dataset.invite = 'false';
    }
  };
  window.addEventListener(PREF_EVENT, onPreference);

  // Restore prior opt-in.
  if (readStoredEnabled()) {
    setEnabled(true, { persist: false, quiet: true });
  } else if (document.documentElement.dataset.tuning === 'explore') {
    panel.dataset.invite = 'true';
    status.textContent =
      'Explore tuning is on. Mark thematic threads when you want the language to show its seams.';
  }

  const destroy = () => {
    window.removeEventListener(PREF_EVENT, onPreference);
    unbindMarkEvents();
    clearMarks(root);
    delete root.dataset.languageExplore;
    delete root.dataset.languageFilter;
    delete root.dataset.resonanceTheme;
    delete document.documentElement.dataset.languageExplore;
    panel.remove();
  };

  return {
    destroy,
    setEnabled,
    isEnabled: () => enabled,
    lexicon
  };
}
