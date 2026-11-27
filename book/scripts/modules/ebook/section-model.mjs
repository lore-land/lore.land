/**
 * ebook/section-model.mjs — Chapter section classification, perspective & payload
 * filters, handle resolution, and Spw expression formatting for ebook-navigation.mjs.
 */
import { parseSpwExpressions } from '../spw-expression-index.mjs?v=2026_03_01.A';

export const PERSPECTIVE_MODES = Object.freeze([
  { id: 'composite', sigil: '&', label: 'composite' },
  { id: 'wonder', sigil: '?', label: 'wonder' },
  { id: 'ground', sigil: '.', label: 'ground' },
  { id: 'dangling', sigil: '~', label: 'dangling' },
  { id: 'bound', sigil: '^', label: 'bound' }
]);

export const PAYLOAD_MODES = Object.freeze([
  { id: 'all', kind: null, sigil: '&', label: 'all' },
  { id: 'object', kind: '{}', sigil: '.', label: '{}' },
  { id: 'array', kind: '[]', sigil: '?', label: '[]' },
  { id: 'angle', kind: '<>', sigil: '^', label: '<>' },
  { id: 'paren', kind: '()', sigil: '~', label: '()' }
]);

export function labelFromSection(section, index) {
  const heading = section.querySelector('h2, h3, h4');
  if (heading && heading.textContent) {
    return heading.textContent.trim();
  }

  if (section.dataset.voiceKicker) {
    // "Boof · Ant-warmth smelled earthy…" — skip the marks row (.section-marks).
    const opening = section.querySelector(':scope > p:not(.section-marks)')?.textContent.trim().split(/\s+/).slice(0, 4).join(' ');
    return opening ? `${section.dataset.voiceKicker} · ${opening.replace(/[,.;:!?]+$/, '')}…` : section.dataset.voiceKicker;
  }

  if (section.dataset.spwComponent) {
    return section.dataset.spwComponent.replace(/^custom-/, '').replace(/-/g, ' ');
  }

  if (section.tagName) {
    return section.tagName.toLowerCase();
  }

  return `section ${index + 1}`;
}

export function parseSectionIndex(input) {
  const value = Number(input || 0);
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.floor(value);
}

export function deriveConceptsFromSections(sections) {
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

export function sanitizeHandle(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:/._-]+/g, '')
    .replace(/-{2,}/g, '-');
}

export function slugify(raw) {
  return sanitizeHandle(raw).replace(/[/:.]/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

export function payloadKindForSection(node) {
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

export function extractAssociations(source) {
  const parsed = parseSpwExpressions(source);
  return parsed.expressions
    .map((expression) => ({
      sigil: expression.sigil,
      handle: sanitizeHandle(expression.handle),
      payload: sanitizeHandle(expression.payload)
    }))
    .filter((expression) => Boolean(expression.handle));
}

export function extractReferenceHandles(node, source) {
  const handles = new Set();

  node.querySelectorAll('[data-content_id]').forEach((entry) => {
    const handle = sanitizeHandle(entry.getAttribute('data-content_id'));
    if (handle) handles.add(handle);
  });

  node.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    const handle = sanitizeHandle(href.replace(/^#/, ''));
    if (handle) handles.add(handle);
  });

  const contentAnchorRegex = /#>\s*([a-z0-9:/._-]+)/gi;
  let anchorMatch = contentAnchorRegex.exec(source);
  while (anchorMatch) {
    const handle = sanitizeHandle(anchorMatch[1]);
    if (handle) handles.add(handle);
    anchorMatch = contentAnchorRegex.exec(source);
  }

  const conceptRegex = /@\[([^\]\n]+)\]/g;
  let conceptMatch = conceptRegex.exec(source);
  while (conceptMatch) {
    const handle = sanitizeHandle(conceptMatch[1]);
    if (handle) handles.add(handle);
    conceptMatch = conceptRegex.exec(source);
  }

  extractAssociations(source).forEach((association) => {
    handles.add(association.handle);
  });

  return handles;
}

/* A room's doorplate (chapter-render.mjs, rooms.css) is its signature, not its prose. */
export function proseText(node) {
  const text = node.textContent || '';
  const plate = node.querySelector(':scope > .room-head')?.textContent || '';
  return plate ? text.replace(plate, '') : text;
}

export function classifySection(node, label, parseInfo = null) {
  const text = `${label} ${proseText(node)}`;
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

export function deriveRegion(section) {
  if (section.classification.payloadKind === '[]') return 'media';
  if (section.classification.payloadKind === '<>') return 'component';
  if (section.classification.hasReference || section.classification.danglingCount > 0) return 'reference';
  if (section.classification.hasQuestion) return 'wonder';
  if (section.classification.hasHeading) return 'ground';
  return 'narrative';
}

export function matchesPerspective(section, perspective) {
  if (perspective === 'wonder') return section.classification.hasQuestion;
  if (perspective === 'ground') return section.classification.hasHeading && !section.classification.hasReference;
  if (perspective === 'dangling') return section.classification.danglingCount > 0 || (!section.classification.isBound && section.classification.hasReference);
  if (perspective === 'bound') return section.classification.isBound || section.classification.boundCount > 0;
  return true;
}

export function matchesPayload(section, mode) {
  const selected = PAYLOAD_MODES.find((item) => item.id === mode) || PAYLOAD_MODES[0];
  if (!selected.kind) return true;
  return section.classification.payloadKind === selected.kind;
}

export function sigilForSection(section) {
  if (section.classification.danglingCount > 0) return '~';
  if (section.classification.isBound || section.classification.boundCount > 0) return '^';
  if (section.classification.hasQuestion) return '?';
  if (section.classification.hasHeading) return '.';
  return '&';
}

export function formatExpression(sigil, handle, payload, syntax = 'prefix') {
  const safeHandle = String(handle || '').trim();
  const safePayload = String(payload || '').trim();
  if (!safeHandle) return safePayload;
  if (!safePayload || syntax !== 'postfix') {
    return safePayload ? `${sigil}[${JSON.stringify(safeHandle)}]{${JSON.stringify(safePayload)}}` : `${sigil}[${JSON.stringify(safeHandle)}]`;
  }
  return `{${JSON.stringify(safePayload)}}${sigil}[${JSON.stringify(safeHandle)}]`;
}

export function formatSectionHandle(section, syntax = 'prefix') {
  const base = `s${String(section.index).padStart(2, '0')}/${section.classification.payloadKind}`;
  return formatExpression(sigilForSection(section), base, section.label, syntax);
}

export function registerHandle(map, handle, sectionIndex) {
  const key = sanitizeHandle(handle);
  if (!key) return;
  const list = map.get(key);
  if (list) {
    if (!list.includes(sectionIndex)) list.push(sectionIndex);
    return;
  }
  map.set(key, [sectionIndex]);
}

/**
 * Inspect chapter flow DOM nodes, attach section metadata attributes, and resolve
 * cross-section definition/reference handle maps.
 */
export function analyzeChapterSections(sectionNodes, chapterId) {
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
    const source = proseText(node);
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

  return { sections, definitionsByHandle, referencesByHandle };
}
