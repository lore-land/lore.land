import {
  parseSpwExpressions,
  selectSpwExpressionBySelector
} from '../modules/spw-expression-index.mjs?v=2026_03_01.A';

const SPW_BINDING_ATTRS = Object.freeze({
  fetch: ['data-spw-fetch', 'spw-fetch', 'data-spw-src', 'spw-src'],
  select: ['data-spw-select', 'spw-select'],
  inline: ['data-spw-inline', 'spw-inline'],
  apply: ['data-spw-apply', 'spw-apply'],
  target: ['data-spw-target', 'spw-target'],
  fallback: ['data-spw-fallback', 'spw-fallback']
});

const SPW_BINDING_ATTR_FILTER = Object.freeze([
  ...new Set(Object.values(SPW_BINDING_ATTRS).flat())
]);

const SPW_PREFIX = 'spw/';
const OPEN_TO_CLOSE = Object.freeze({
  '{': '}',
  '[': ']',
  '(': ')',
  '<': '>'
});

function readFirstAttr(node, names) {
  for (const name of names) {
    if (!node.hasAttribute(name)) {
      continue;
    }
    const value = node.getAttribute(name);
    if (value != null) {
      return value;
    }
  }
  return '';
}

function splitPathTokens(path) {
  const hashIndex = path.indexOf('#');
  const queryIndex = path.indexOf('?');
  const splitIndex =
    hashIndex >= 0 && queryIndex >= 0
      ? Math.min(hashIndex, queryIndex)
      : Math.max(hashIndex, queryIndex);

  if (splitIndex < 0) {
    return { pathname: path, suffix: '' };
  }

  return {
    pathname: path.slice(0, splitIndex),
    suffix: path.slice(splitIndex)
  };
}

function ensureSpwSuffix(path) {
  const { pathname, suffix } = splitPathTokens(path);
  if (/\.spw$/i.test(pathname)) {
    return path;
  }

  const normalizedPath = pathname.endsWith('/')
    ? `${pathname}index.spw`
    : `${pathname}.spw`;
  return `${normalizedPath}${suffix}`;
}

function normalizeSpwSource(rawSource) {
  const source = String(rawSource || '').trim();
  if (!source) {
    return '';
  }

  if (/^https?:\/\//i.test(source) || source.startsWith('/')) {
    return ensureSpwSuffix(source);
  }

  if (source === 'spw' || source === '.spw' || source === '/.spw') {
    return '/.spw/index.spw';
  }

  if (source.startsWith(SPW_PREFIX)) {
    return ensureSpwSuffix(`/.spw/${source.slice(SPW_PREFIX.length)}`);
  }

  if (source.startsWith('.spw/')) {
    return ensureSpwSuffix(`/${source.replace(/^\/+/, '')}`);
  }

  return ensureSpwSuffix(source);
}

function stripOuterQuotes(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function captureBalanced(source, startIndex) {
  const open = source[startIndex];
  const close = OPEN_TO_CLOSE[open];
  if (!close) {
    return '';
  }

  let depth = 0;
  for (let index = startIndex; index < source.length; index += 1) {
    const token = source[index];
    if (token === open) {
      depth += 1;
    } else if (token === close) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return source.slice(startIndex);
}

function buildSelectorCandidates(selector) {
  const trimmed = String(selector || '').trim();
  if (!trimmed) {
    return [];
  }

  const naked = stripOuterQuotes(trimmed);
  const candidates = new Set([trimmed, naked]);

  if (!/^[?~<@&*^#.=$!]/.test(naked)) {
    candidates.add(`^"${naked}"`);
    candidates.add(`^${naked}`);
  }

  return [...candidates].filter(Boolean);
}

export function selectSpwExpression(source, selector) {
  const text = String(source || '');
  if (!text.trim()) {
    return '';
  }

  const trimmedSelector = String(selector || '').trim();
  const selectorTarget = selectSpwExpressionBySelector(text, trimmedSelector);
  if (selectorTarget) {
    return selectorTarget;
  }

  const candidates = buildSelectorCandidates(selector);
  if (!candidates.length) {
    return text.trim();
  }

  for (const candidate of candidates) {
    const anchorIndex = text.indexOf(candidate);
    if (anchorIndex < 0) {
      continue;
    }

    const lineStart = Math.max(0, text.lastIndexOf('\n', anchorIndex) + 1);
    let cursor = anchorIndex + candidate.length;
    while (cursor < text.length && /\s/.test(text[cursor])) {
      cursor += 1;
    }

    const opener = text[cursor];
    if (OPEN_TO_CLOSE[opener]) {
      const block = captureBalanced(text, cursor);
      return `${text.slice(lineStart, cursor)}${block}`.trim();
    }

    const lineEnd = text.indexOf('\n', anchorIndex);
    return text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd).trim();
  }

  return '';
}

function resolveTarget(component, targetSpec = '') {
  const spec = String(targetSpec || '').trim();
  if (!spec || spec === 'host') {
    return component;
  }

  if (spec === 'shadow') {
    return component.shadowRoot || component;
  }

  if (spec.startsWith('shadow:')) {
    const selector = spec.slice('shadow:'.length).trim();
    return component.shadowRoot?.querySelector(selector) || null;
  }

  if (spec.startsWith('host:')) {
    const selector = spec.slice('host:'.length).trim();
    return component.querySelector(selector);
  }

  return (
    component.shadowRoot?.querySelector(spec) ||
    component.querySelector(spec) ||
    component
  );
}

function applyValue(component, value, applySpec = 'replace', targetSpec = 'host') {
  const rawApply = String(applySpec || 'replace').trim();
  const applyLower = rawApply.toLowerCase();
  const nextValue = String(value ?? '');

  if (applyLower === 'none') {
    return;
  }

  if (applyLower.startsWith('attr:')) {
    const attrName = rawApply.slice('attr:'.length).trim();
    if (attrName) {
      component.setAttribute(attrName, nextValue);
    }
    return;
  }

  if (applyLower.startsWith('dataset:')) {
    const datasetKey = rawApply.slice('dataset:'.length).trim();
    if (datasetKey) {
      component.dataset[datasetKey] = nextValue;
    }
    return;
  }

  const target = resolveTarget(component, targetSpec);
  if (!target) {
    return;
  }

  if ('value' in target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    target.value = nextValue;
    return;
  }

  const current = target.textContent || '';
  if (applyLower === 'append') {
    target.textContent = current ? `${current}\n${nextValue}` : nextValue;
    return;
  }

  if (applyLower === 'prepend') {
    target.textContent = current ? `${nextValue}\n${current}` : nextValue;
    return;
  }

  target.textContent = nextValue;
}

function setState(component, state, detail = {}) {
  component.dataset.spwFetchState = state;
  component.dataset.spwFetchPath = detail.path || '';
  component.dataset.spwFetchSelect = detail.selector || '';
  component.dataset.spwFetchLength = detail.length != null ? String(detail.length) : '';
  component.dataset.spwFetchError = detail.error || '';
}

function dispatchBindingEvent(component, type, detail) {
  component.dispatchEvent(new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail
  }));
}

function markAsSpwExpression(component, source) {
  if (!component.hasAttribute('data-spw-expression')) {
    component.setAttribute('data-spw-expression', 'true');
  }
  const text = String(source ?? '');
  const parseInfo = parseSpwExpressions(text);
  component.dataset.spwSource = text;
  component.dataset.spwParseExpressions = String(parseInfo.expressions.length);
  component.dataset.spwParseDiagnostics = String(parseInfo.diagnostics.length);
}

export function attachSpwBinding(component) {
  if (!(component instanceof HTMLElement)) {
    return () => {};
  }

  let active = true;
  let sequence = 0;
  let controller = null;

  const run = async () => {
    if (!active) {
      return;
    }

    const currentRun = ++sequence;
    const fetchSource = normalizeSpwSource(readFirstAttr(component, SPW_BINDING_ATTRS.fetch));
    const select = readFirstAttr(component, SPW_BINDING_ATTRS.select).trim();
    const inline = readFirstAttr(component, SPW_BINDING_ATTRS.inline);
    const fallback = readFirstAttr(component, SPW_BINDING_ATTRS.fallback);
    const applySpec = readFirstAttr(component, SPW_BINDING_ATTRS.apply).trim() || 'replace';
    const targetSpec = readFirstAttr(component, SPW_BINDING_ATTRS.target).trim() || 'host';

    if (!fetchSource && !inline) {
      setState(component, 'idle');
      return;
    }

    if (controller) {
      controller.abort();
      controller = null;
    }

    if (!fetchSource) {
      applyValue(component, inline, applySpec, targetSpec);
      markAsSpwExpression(component, inline);
      setState(component, 'ready', { length: inline.length });
      dispatchBindingEvent(component, 'lore:spw-component-applied', {
        source: '',
        selector: '',
        applied: inline
      });
      return;
    }

    controller = new AbortController();
    setState(component, 'loading', { path: fetchSource, selector: select });

    try {
      const response = await fetch(fetchSource, {
        signal: controller.signal,
        headers: { Accept: 'text/plain, text/spw, text/*, */*' }
      });

      if (!response.ok) {
        throw new Error(`Fetch failed (${response.status}) for ${fetchSource}`);
      }

      const source = await response.text();
      if (!active || currentRun !== sequence) {
        return;
      }

      let applied = select ? selectSpwExpression(source, select) : source.trim();
      if (!applied && inline) {
        applied = inline;
      }
      if (!applied && fallback) {
        applied = fallback;
      }
      if (!applied) {
        applied = source.trim();
      }

      applyValue(component, applied, applySpec, targetSpec);
      markAsSpwExpression(component, applied);
      setState(component, 'ready', {
        path: fetchSource,
        selector: select,
        length: applied.length
      });

      dispatchBindingEvent(component, 'lore:spw-component-applied', {
        source: fetchSource,
        selector: select,
        applied
      });
    } catch (error) {
      if (!active || currentRun !== sequence || error?.name === 'AbortError') {
        return;
      }

      const fallbackApplied = inline || fallback || '';
      if (fallbackApplied) {
        applyValue(component, fallbackApplied, applySpec, targetSpec);
        markAsSpwExpression(component, fallbackApplied);
        setState(component, 'ready', {
          path: fetchSource,
          selector: select,
          length: fallbackApplied.length,
          error: String(error?.message || error)
        });
        dispatchBindingEvent(component, 'lore:spw-component-applied', {
          source: fetchSource,
          selector: select,
          applied: fallbackApplied,
          fallback: true
        });
        return;
      }

      setState(component, 'error', {
        path: fetchSource,
        selector: select,
        error: String(error?.message || error)
      });
      dispatchBindingEvent(component, 'lore:spw-component-error', {
        source: fetchSource,
        selector: select,
        error: String(error?.message || error)
      });
      console.warn('SPW component binding failed:', error);
    }
  };

  const observer = new MutationObserver((mutations) => {
    if (!active) {
      return;
    }

    const shouldRefresh = mutations.some((mutation) =>
      SPW_BINDING_ATTR_FILTER.includes(mutation.attributeName || '')
    );

    if (shouldRefresh) {
      run();
    }
  });

  observer.observe(component, {
    attributes: true,
    attributeFilter: [...SPW_BINDING_ATTR_FILTER]
  });

  run();

  return () => {
    active = false;
    sequence += 1;
    if (controller) {
      controller.abort();
      controller = null;
    }
    observer.disconnect();
  };
}
