/**
 * spw-interactions/story-cube.mjs — Pure association extraction, concept derivation,
 * path/annotation collectors, and 6-face Rubik's Cube storytelling projection.
 */
import { findSpwExpressionByIndex, parseSpwExpressions } from '../spw-expression-index.mjs?v=2026_03_01.A';

const PATH_REF_REGEX = /@([a-z0-9_-]+(?:\/[a-z0-9._-]+)+)/gi;
const ANNOTATION_REGEX = /#([:!>]?)([a-z0-9._-]+)/gi;

export const CUBE_AXES = Object.freeze(['x', 'y', 'z']);
export const CUBE_FACE_ORDER = Object.freeze(['front', 'right', 'back', 'left', 'top', 'bottom']);

export function hashId(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function extractAssociations(sourceOrParsed) {
  const parsed =
    typeof sourceOrParsed === 'string'
      ? parseSpwExpressions(sourceOrParsed)
      : sourceOrParsed || { expressions: [] };
  return parsed.expressions.map((expression) => ({
    sigil: expression.sigil,
    handle: expression.handle,
    payload: expression.payload || '',
    text: expression.text,
    start: expression.start,
    end: expression.end,
    depth: expression.depth,
    line: expression.line,
    column: expression.column
  }));
}

export function findAssociationByIndex(associations, index) {
  if (!associations.length || typeof index !== 'number') {
    return null;
  }
  return findSpwExpressionByIndex(associations, index);
}

export function parseInlineAssociation(text) {
  const parsed = parseSpwExpressions(String(text || '').trim()).expressions[0];
  if (!parsed || parsed.start !== 0 || parsed.end !== String(text || '').trim().length) {
    return null;
  }
  return {
    sigil: parsed.sigil,
    handle: parsed.handle,
    payload: parsed.payload || '',
    text: parsed.text,
    start: 0,
    end: parsed.text.length
  };
}

export function deriveConcepts(...values) {
  const concepts = new Set();
  values.forEach((value) => {
    if (!value) {
      return;
    }
    String(value)
      .split(/[^a-zA-Z0-9_./-]+/g)
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
      .forEach((part) => concepts.add(part));
  });
  return [...concepts].slice(0, 16);
}

export function sanitizeHandleToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'selection';
}

export function uniqueOrdered(values) {
  const seen = new Set();
  const ordered = [];
  values.forEach((value) => {
    const text = String(value || '').trim();
    if (!text || seen.has(text)) {
      return;
    }
    seen.add(text);
    ordered.push(text);
  });
  return ordered;
}

export function buildStoryCube(associations, source, expressionId) {
  const handles = uniqueOrdered(associations.map((item) => `${item.sigil}[${item.handle}]`));
  const payloads = uniqueOrdered(associations.map((item) => item.payload).filter(Boolean));
  const concepts = deriveConcepts(source, ...handles, ...payloads);
  const operators = uniqueOrdered((source.match(/[!~@^#.?=&*$%]/g) || []));

  const front = handles.slice(0, 6);
  const right = operators.length
    ? operators.map((operator, index) => `${operator}[spin-${index + 1}]`)
    : ['^[cube]{operator-spin}'];
  const back = payloads.slice(0, 6).map((payload, index) => `~[payload/${index + 1}]{${payload}}`);
  const left = concepts.slice(0, 6).map((concept) => `@[concept/${concept}]`);
  const top = [
    `#[expression/${expressionId}]{focus}`,
    `^[registers]{active-handle}`,
    '&[story]{association-space}'
  ];
  const bottom = [
    '?[parser]{selection-lens}',
    '%[llm]{structured-payload}',
    '*[boonhonk]{combinatoric-genre}'
  ];

  return { front, right, back, left, top, bottom };
}

export function collectPathRefs(source) {
  const refs = [];
  const regex = new RegExp(PATH_REF_REGEX.source, 'gi');
  let match = regex.exec(source);
  while (match) {
    refs.push(`@${match[1]}`);
    match = regex.exec(source);
  }
  return uniqueOrdered(refs);
}

export function collectAnnotationKinds(source) {
  const summary = { topic: 0, lens: 0, intent: 0, anchor: 0 };
  const regex = new RegExp(ANNOTATION_REGEX.source, 'gi');
  let match = regex.exec(source);
  while (match) {
    const marker = match[1];
    if (marker === ':') {
      summary.lens += 1;
    } else if (marker === '!') {
      summary.intent += 1;
    } else if (marker === '>') {
      summary.anchor += 1;
    } else {
      summary.topic += 1;
    }
    match = regex.exec(source);
  }
  return summary;
}

export function previewValue(value, max = 220) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

export function rotateFaceIndex(current, axis) {
  const normalized = String(axis || '').toLowerCase();
  const steps = { x: 1, y: 2, z: 3 };
  return (current + (steps[normalized] || 1)) % CUBE_FACE_ORDER.length;
}
