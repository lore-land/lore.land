import { tryParseSelector } from './spw-selector-parser.mjs?v=2026_02_28.I';

const SIGILS = new Set(['!', '~', '@', '^', '#', '.', '?', '=', '&', '*', '$', '%']);
const OPEN_TO_CLOSE = Object.freeze({
  '{': '}',
  '[': ']',
  '(': ')',
  '<': '>'
});

function clone(value) {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function isSigil(char) {
  return SIGILS.has(char);
}

function skipWhitespace(source, index) {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }
  return cursor;
}

function captureBracket(source, startIndex) {
  if (source[startIndex] !== '[') {
    return null;
  }

  let cursor = startIndex + 1;
  let escaped = false;

  while (cursor < source.length) {
    const char = source[cursor];
    if (escaped) {
      escaped = false;
      cursor += 1;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      cursor += 1;
      continue;
    }

    if (char === ']') {
      return {
        text: source.slice(startIndex, cursor + 1),
        value: source.slice(startIndex + 1, cursor),
        end: cursor + 1,
        closed: true
      };
    }

    cursor += 1;
  }

  return {
    text: source.slice(startIndex),
    value: source.slice(startIndex + 1),
    end: source.length,
    closed: false
  };
}

function captureBalanced(source, startIndex) {
  const opener = source[startIndex];
  const closer = OPEN_TO_CLOSE[opener];
  if (!closer) {
    return null;
  }

  let cursor = startIndex;
  let depth = 0;

  while (cursor < source.length) {
    const char = source[cursor];
    if (char === opener) {
      depth += 1;
    } else if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return {
          text: source.slice(startIndex, cursor + 1),
          value: source.slice(startIndex + 1, cursor),
          end: cursor + 1,
          closed: true
        };
      }
    }
    cursor += 1;
  }

  return {
    text: source.slice(startIndex),
    value: source.slice(startIndex + 1),
    end: source.length,
    closed: false
  };
}

function lineOffsets(source) {
  const offsets = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

function locationForOffset(offsets, offset) {
  let low = 0;
  let high = offsets.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (offsets[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const line = Math.max(0, high);
  const column = Math.max(0, offset - offsets[line]);
  return {
    line: line + 1,
    column: column + 1
  };
}

function computeDepthAt(source, offset) {
  let depth = 0;
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '{') {
      depth += 1;
    } else if (source[i] === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  return depth;
}

function matchPattern(pattern, expression) {
  if (pattern.sigil != null && pattern.sigil !== '*' && pattern.sigil !== expression.sigil) {
    return false;
  }

  if (pattern.brace != null) {
    if (pattern.brace === '[]' && expression.brace !== '[]') {
      return false;
    }

    if (pattern.brace === '{}' && !expression.payload) {
      return false;
    }

    if (pattern.brace === '()') {
      return false;
    }
  }

  if (pattern.brace2 != null) {
    if (pattern.brace2 === '{}' && !expression.payload) {
      return false;
    }
    if (pattern.brace2 === '()') {
      return false;
    }
  }

  if (pattern.modifier != null) {
    const modifier = String(pattern.modifier);
    const candidates = expression.handle
      .split(/[^a-zA-Z0-9_]+/g)
      .map((token) => token.trim())
      .filter(Boolean);

    if (!candidates.includes(modifier) && expression.handle !== modifier) {
      return false;
    }
  }

  if (pattern.value != null) {
    const expected = String(pattern.value);
    const payloadMatch = expression.payload === expected;
    const handleMatch = expression.handle === expected;
    if (!payloadMatch && !handleMatch) {
      return false;
    }
  }

  if (pattern.depth != null && expression.depth !== pattern.depth) {
    return false;
  }

  if (pattern.depthRange != null) {
    const [min, max] = pattern.depthRange;
    if (expression.depth < min || expression.depth > max) {
      return false;
    }
  }

  return true;
}

function findParentIndex(expressions, index) {
  const current = expressions[index];
  if (!current) {
    return -1;
  }

  for (let i = index - 1; i >= 0; i -= 1) {
    const candidate = expressions[i];
    if (!candidate) {
      continue;
    }

    if (candidate.start <= current.start && candidate.end >= current.end) {
      return i;
    }
  }

  return -1;
}

function matchesSelectorAt(expressions, index, selector) {
  const expression = expressions[index];
  if (!expression || !selector || typeof selector !== 'object') {
    return false;
  }

  if ('and' in selector) {
    return (
      matchesSelectorAt(expressions, index, selector.and[0]) &&
      matchesSelectorAt(expressions, index, selector.and[1])
    );
  }

  if ('or' in selector) {
    return (
      matchesSelectorAt(expressions, index, selector.or[0]) ||
      matchesSelectorAt(expressions, index, selector.or[1])
    );
  }

  if ('not' in selector) {
    return !matchesSelectorAt(expressions, index, selector.not);
  }

  if ('descend' in selector) {
    const [parentSelector, childSelector] = selector.descend;
    if (!matchesSelectorAt(expressions, index, childSelector)) {
      return false;
    }

    let parentIndex = findParentIndex(expressions, index);
    while (parentIndex >= 0) {
      if (matchesSelectorAt(expressions, parentIndex, parentSelector)) {
        return true;
      }
      parentIndex = findParentIndex(expressions, parentIndex);
    }
    return false;
  }

  if ('seq' in selector) {
    const [leftSelector, rightSelector] = selector.seq;
    const parentIndex = findParentIndex(expressions, index);

    const siblings = expressions
      .map((entry, entryIndex) => ({ entry, entryIndex }))
      .filter(({ entryIndex }) => findParentIndex(expressions, entryIndex) === parentIndex)
      .sort((a, b) => a.entry.start - b.entry.start);

    const at = siblings.findIndex((item) => item.entryIndex === index);
    if (at < 0) {
      return false;
    }

    const previous = siblings[at - 1]?.entryIndex;
    const next = siblings[at + 1]?.entryIndex;

    if (
      next != null &&
      matchesSelectorAt(expressions, index, leftSelector) &&
      matchesSelectorAt(expressions, next, rightSelector)
    ) {
      return true;
    }

    if (
      previous != null &&
      matchesSelectorAt(expressions, previous, leftSelector) &&
      matchesSelectorAt(expressions, index, rightSelector)
    ) {
      return true;
    }

    return false;
  }

  return matchPattern(selector, expression);
}

function isLikelySpwSelector(selector) {
  const text = String(selector || '').trim();
  if (!text) {
    return false;
  }

  if (/^(spwq:|selector:)/i.test(text)) {
    return true;
  }

  return /^[!~@^#.?=&*$%]/.test(text);
}

function unwrapSelector(selector) {
  const text = String(selector || '').trim();
  if (!text) {
    return '';
  }

  if (/^spwq:/i.test(text)) {
    return text.slice(5).trim();
  }

  if (/^selector:/i.test(text)) {
    return text.slice(9).trim();
  }

  return text;
}

export function parseSpwExpressions(source) {
  const text = String(source || '');
  const offsets = lineOffsets(text);
  const expressions = [];
  const diagnostics = [];

  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (!isSigil(char)) {
      index += 1;
      continue;
    }

    const handleStart = skipWhitespace(text, index + 1);
    if (text[handleStart] !== '[') {
      index += 1;
      continue;
    }

    const capturedHandle = captureBracket(text, handleStart);
    if (!capturedHandle) {
      index += 1;
      continue;
    }

    if (!capturedHandle.closed) {
      const loc = locationForOffset(offsets, handleStart);
      diagnostics.push({
        code: 'unclosed-handle',
        message: 'Handle is missing closing ] bracket.',
        offset: handleStart,
        line: loc.line,
        column: loc.column
      });
      break;
    }

    const payloadStart = skipWhitespace(text, capturedHandle.end);
    let payload = '';
    let payloadText = '';
    let end = capturedHandle.end;

    if (text[payloadStart] === '{') {
      const capturedPayload = captureBalanced(text, payloadStart);
      if (capturedPayload) {
        payload = capturedPayload.value;
        payloadText = capturedPayload.text;
        end = capturedPayload.end;

        if (!capturedPayload.closed) {
          const loc = locationForOffset(offsets, payloadStart);
          diagnostics.push({
            code: 'unclosed-payload',
            message: 'Payload is missing closing } brace.',
            offset: payloadStart,
            line: loc.line,
            column: loc.column
          });
          break;
        }
      }
    }

    const depth = computeDepthAt(text, index);
    const location = locationForOffset(offsets, index);
    const entry = {
      sigil: char,
      handle: capturedHandle.value.trim(),
      payload: payload.trim(),
      text: text.slice(index, end),
      start: index,
      end,
      depth,
      line: location.line,
      column: location.column,
      brace: '[]',
      brace2: payloadText ? '{}' : undefined
    };

    expressions.push(entry);
    index = Math.max(index + 1, end);
  }

  return {
    expressions,
    diagnostics
  };
}

export function findSpwExpressionByIndex(expressions, index) {
  if (!Array.isArray(expressions) || typeof index !== 'number' || Number.isNaN(index)) {
    return null;
  }

  const direct = expressions.find((expression) => index >= expression.start && index < expression.end);
  if (direct) {
    return direct;
  }

  if (!expressions.length) {
    return null;
  }

  let closest = expressions[0];
  let bestDistance = Math.abs(index - closest.start);
  for (let i = 1; i < expressions.length; i += 1) {
    const distance = Math.abs(index - expressions[i].start);
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = expressions[i];
    }
  }

  return closest;
}

export function matchSpwExpressions(source, selector) {
  if (!isLikelySpwSelector(selector)) {
    return [];
  }

  const normalizedSelector = unwrapSelector(selector);
  const selectorAst = tryParseSelector(normalizedSelector);
  if (!selectorAst) {
    return [];
  }

  const { expressions } = parseSpwExpressions(source);
  return expressions.filter((_, index) => matchesSelectorAt(expressions, index, selectorAst)).map(clone);
}

export function selectSpwExpressionBySelector(source, selector) {
  const matches = matchSpwExpressions(source, selector);
  if (!matches.length) {
    return '';
  }
  return String(matches[0].text || '').trim();
}
