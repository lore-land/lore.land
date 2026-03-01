import { tryParseSelector } from './spw-selector-parser.mjs?v=2026_02_28.I';
import { getSpwRegisterBank } from './spw-register-bank.mjs?v=2026_02_28.I';

const OPERATOR_SEQUENCE = Object.freeze(['^', '&', '~', '?', '!', '#', '*']);

const OPEN_TO_CLOSE = Object.freeze({
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>'
});

const CLOSE_TO_OPEN = Object.freeze({
  ')': '(',
  ']': '[',
  '}': '{',
  '>': '<'
});

const HANDLE_PAYLOAD_REGEX = /([!~@^#.?=&*$%])\[([^\]\n]+)\](?:\{([^}\n]*)\})?/g;

const SPW_SELECTOR = [
  '.spw-block',
  '.spw-snippet',
  '.motif-spw',
  '.sigil-phrase',
  '[data-spw-expression]'
].join(', ');

const SPW_CONTROL_SELECTOR = 'pre, .spw-block, .spw-snippet, .motif-spw, .sigil-phrase';

const CUBE_AXES = Object.freeze(['x', 'y', 'z']);
const CUBE_FACE_ORDER = Object.freeze(['front', 'right', 'back', 'left', 'top', 'bottom']);

function isOperator(char) {
  return OPERATOR_SEQUENCE.includes(char);
}

function isBrace(char) {
  return char in OPEN_TO_CLOSE || char in CLOSE_TO_OPEN;
}

function isOpener(char) {
  return char in OPEN_TO_CLOSE;
}

function nextOperator(char) {
  const index = OPERATOR_SEQUENCE.indexOf(char);
  if (index < 0) {
    return OPERATOR_SEQUENCE[0];
  }
  return OPERATOR_SEQUENCE[(index + 1) % OPERATOR_SEQUENCE.length];
}

function hashId(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function ensureNativeSpwComponents() {
  if (!customElements.get('spw-registers')) {
    class SpwRegistersElement extends HTMLElement {
      set data(value) {
        this._data = value;
        this.render();
      }

      connectedCallback() {
        this.render();
      }

      render() {
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }

        const data = this._data || {};
        const snapshot = data.snapshot || {};
        const active = snapshot.active || null;
        const handles = Array.isArray(snapshot.handles) ? snapshot.handles : [];
        const concepts = Array.isArray(snapshot.concepts) ? snapshot.concepts : [];

        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
            }
            .register-shell {
              display: grid;
              gap: 0.3rem;
              border: 1px solid rgba(42, 111, 127, 0.28);
              border-radius: 9px;
              background: rgba(255, 255, 255, 0.72);
              padding: 0.48rem;
              font-family: var(--font-family-body, Georgia, serif);
              color: var(--color-text-main, #1a2233);
            }
            .register-title {
              margin: 0;
              font-family: var(--font-family-heading, monospace);
              font-size: 0.74rem;
              color: var(--color-text-alt, #45506b);
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .register-handle {
              margin: 0;
              font-size: 0.8rem;
              font-family: var(--font-family-heading, monospace);
              color: var(--color-accent-alt, #1c4f63);
            }
            .register-meta {
              margin: 0;
              font-size: 0.74rem;
              color: var(--color-text-alt, #45506b);
              line-height: 1.35;
            }
            .register-list {
              display: flex;
              flex-wrap: wrap;
              gap: 0.24rem;
            }
            .register-chip {
              border: 1px solid rgba(42, 111, 127, 0.34);
              border-radius: 999px;
              padding: 0.06rem 0.42rem;
              font-size: 0.68rem;
              font-family: var(--font-family-heading, monospace);
              color: var(--color-text-alt, #45506b);
              background: rgba(255, 255, 255, 0.85);
            }
          </style>
          <div class="register-shell">
            <p class="register-title">Spw Registers</p>
            <p class="register-handle">${active ? active.handle : 'No handle selected'}</p>
            <p class="register-meta">History: ${snapshot.historySize || 0} • Handles: ${handles.length}</p>
            <div class="register-list">
              ${concepts.slice(0, 6).map((item) => `<span class="register-chip">${item.concept}:${item.count}</span>`).join('')}
            </div>
          </div>
        `;
      }
    }

    customElements.define('spw-registers', SpwRegistersElement);
  }
}

function readSource(node) {
  if (node.dataset.spwSource) {
    return node.dataset.spwSource;
  }

  if (node.dataset.spwRouteLabel) {
    node.dataset.spwSource = node.dataset.spwRouteLabel;
    return node.dataset.spwSource;
  }

  node.dataset.spwSource = node.textContent || '';
  return node.dataset.spwSource;
}

function writeSource(node, source) {
  node.dataset.spwSource = source;
  if (node.dataset.spwRouteLabel) {
    node.dataset.spwRouteLabel = source;
  }
}

function updateSourceFromTokens(node, tokens) {
  const ordered = [...tokens].sort((a, b) => a.sourceIndex - b.sourceIndex);
  const lastIndex = ordered.length ? ordered[ordered.length - 1].sourceIndex : -1;
  const sourceChars = new Array(lastIndex + 1).fill('');

  ordered.forEach((token) => {
    sourceChars[token.sourceIndex] = token.el.textContent;
  });

  const base = readSource(node).split('');
  sourceChars.forEach((char, index) => {
    if (char !== '') {
      base[index] = char;
    }
  });

  writeSource(node, base.join(''));
}

function extractAssociations(source) {
  const associations = [];
  const regex = new RegExp(HANDLE_PAYLOAD_REGEX.source, 'g');
  let match = regex.exec(source);
  while (match) {
    const sigil = match[1];
    const handle = match[2];
    const payload = match[3] || '';
    const text = match[0];
    const start = match.index;
    const end = start + text.length;

    associations.push({
      sigil,
      handle,
      payload,
      text,
      start,
      end
    });
    match = regex.exec(source);
  }
  return associations;
}

function findAssociationByIndex(associations, index) {
  if (!associations.length || typeof index !== 'number') {
    return null;
  }

  const direct = associations.find((association) => index >= association.start && index < association.end);
  if (direct) {
    return direct;
  }

  let closest = associations[0];
  let minDistance = Math.abs(index - closest.start);
  for (let i = 1; i < associations.length; i += 1) {
    const distance = Math.abs(index - associations[i].start);
    if (distance < minDistance) {
      minDistance = distance;
      closest = associations[i];
    }
  }
  return closest;
}

function parseInlineAssociation(text) {
  const pattern = /^([!~@^#.?=&*$%])\[([^\]\n]+)\](?:\{([^}\n]*)\})?$/;
  const parsed = pattern.exec(String(text || '').trim());
  if (!parsed) {
    return null;
  }
  const literal = parsed[0];
  return {
    sigil: parsed[1],
    handle: parsed[2],
    payload: parsed[3] || '',
    text: literal,
    start: 0,
    end: literal.length
  };
}

function activateBracePair(node, braces, pairId, announce) {
  braces.forEach((brace) => {
    brace.el.classList.toggle('is-active', brace.pairId === pairId);
  });

  node.dataset.spwActivePair = pairId ? String(pairId) : '';

  if (pairId && announce) {
    announce(`Brace pair ${pairId} focused.`);
  }
}

function deriveConcepts(...values) {
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

function uniqueOrdered(values) {
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

function buildStoryCube(associations, source, expressionId, registerSnapshot = null) {
  const snapshot = registerSnapshot || {};
  const active = snapshot.active || null;
  const bankHandles = Array.isArray(snapshot.handles) ? snapshot.handles : [];
  const bankConcepts = Array.isArray(snapshot.concepts) ? snapshot.concepts.map((item) => item.concept) : [];
  const handles = uniqueOrdered([
    active?.handle,
    ...bankHandles,
    ...associations.map((item) => `${item.sigil}[${item.handle}]`)
  ]);
  const associationPayloads = associations.map((item) => item.payload).filter(Boolean);
  const activePayloadText = active?.payload?.selection
    || active?.payload?.association?.payload
    || (active?.payloadId ? String(active.payloadId) : '');
  const payloads = uniqueOrdered([
    activePayloadText,
    ...associationPayloads
  ]);
  const concepts = deriveConcepts(source, ...handles, ...payloads, ...bankConcepts);
  const operators = uniqueOrdered((source.match(/[!~@^#.?=&*$%]/g) || []));

  const front = handles.slice(0, 6);
  const right = operators.length
    ? operators.map((operator, index) => `${operator}[spin-${index + 1}]`)
    : ['^[cube]{operator-spin}'];
  const back = payloads.slice(0, 6).map((payload, index) => `~[payload/${index + 1}]{${payload}}`);
  const left = concepts.slice(0, 6).map((concept) => `@[concept/${concept}]`);
  const top = [
    `#[expression/${expressionId}]{focus}`,
    `^[registers]{${active?.handle || 'active-handle'}}`,
    snapshot.historySize ? `&[history]{${snapshot.historySize}-steps}` : '&[story]{association-space}'
  ];
  const bottom = [
    '?[parser]{selection-lens}',
    active?.payloadId ? `%[payload/${active.payloadId}]{structured}` : '%[llm]{structured-payload}',
    `*[concepts]{${concepts.length}-facets}`
  ];

  return {
    front,
    right,
    back,
    left,
    top,
    bottom
  };
}

function rotateFaceIndex(current, axis) {
  const normalized = String(axis || '').toLowerCase();
  const steps = {
    x: 1,
    y: 2,
    z: 3
  };
  return (current + (steps[normalized] || 1)) % CUBE_FACE_ORDER.length;
}

function buildTokenizedFragment(source, hostInteractive) {
  const fragment = document.createDocumentFragment();
  const tokens = [];
  const operators = [];
  const braces = [];
  const stack = [];
  let pairCount = 0;
  let buffer = '';
  let bufferStart = 0;

  const flushBuffer = () => {
    if (!buffer) {
      return;
    }

    const chunk = document.createElement('span');
    chunk.className = 'spw-chunk';
    chunk.textContent = buffer;
    chunk.dataset.spwChunk = 'true';
    chunk.dataset.spwStart = String(bufferStart);
    chunk.dataset.spwEnd = String(bufferStart + buffer.length);
    chunk.tabIndex = hostInteractive ? -1 : 0;
    if (!hostInteractive) {
      chunk.setAttribute('role', 'button');
      chunk.setAttribute('aria-label', 'Select Spw chunk');
    }
    fragment.append(chunk);
    buffer = '';
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (!isOperator(char) && !isBrace(char)) {
      if (!buffer) {
        bufferStart = i;
      }
      buffer += char;
      continue;
    }

    flushBuffer();
    const span = document.createElement('span');
    span.className = 'spw-token';
    span.textContent = char;
    span.dataset.spwToken = char;
    span.dataset.spwIndex = String(i);
    span.tabIndex = hostInteractive ? -1 : 0;

    const token = { el: span, sourceIndex: i, char };
    tokens.push(token);

    if (isOperator(char)) {
      span.classList.add('spw-operator');
      if (!hostInteractive) {
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `Swap operator ${char}`);
      }
      operators.push(token);
    }

    if (isBrace(char)) {
      span.classList.add('spw-brace');
      if (!hostInteractive) {
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `Trace brace ${char}`);
      }
      const brace = {
        ...token,
        pairId: 0
      };
      braces.push(brace);

      if (isOpener(char)) {
        stack.push(brace);
      } else {
        const expected = CLOSE_TO_OPEN[char];
        const opener = stack.length ? stack[stack.length - 1] : null;
        if (opener && opener.char === expected) {
          stack.pop();
          pairCount += 1;
          opener.pairId = pairCount;
          brace.pairId = pairCount;
        }
      }
    }

    fragment.append(span);
  }

  flushBuffer();
  return { fragment, tokens, operators, braces };
}

function focusGeometryNode(nodes, activeIndex, announce, options = {}) {
  const clamped = Math.max(0, Math.min(activeIndex, nodes.length - 1));
  nodes.forEach((node, index) => {
    node.el.classList.toggle('is-geometry-active', index === clamped);
  });
  const active = nodes[clamped];
  const shouldFocus = options.focus !== false;
  const shouldAnnounce = options.announce !== false;
  if (active && shouldFocus) {
    active.el.focus({ preventScroll: true });
    active.el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    if (announce && shouldAnnounce) {
      announce(`Geometry node ${clamped + 1} of ${nodes.length}: ${active.el.textContent}`);
    }
  }
  return clamped;
}

function createGeometryNavigator(node, nodes, announce) {
  if (!nodes.length) {
    return null;
  }

  const nav = document.createElement('div');
  nav.className = 'spw-geometry-nav';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Spw geometry navigator');

  const label = document.createElement('p');
  label.className = 'spw-geometry-label';
  label.textContent = 'Geometry';

  const controls = document.createElement('div');
  controls.className = 'spw-geometry-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'spw-geometry-prev';
  prev.textContent = 'Prev node';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'spw-geometry-next';
  next.textContent = 'Next node';

  const status = document.createElement('span');
  status.className = 'spw-geometry-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  controls.append(prev, next, status);
  nav.append(label, controls);

  let activeIndex = 0;
  const syncStatus = () => {
    status.textContent = `${activeIndex + 1}/${nodes.length}`;
  };

  const setNode = (target, options = {}) => {
    activeIndex = focusGeometryNode(nodes, target, announce, options);
    syncStatus();
  };

  prev.addEventListener('click', () => {
    setNode(activeIndex - 1);
  });

  next.addEventListener('click', () => {
    setNode(activeIndex + 1);
  });

  node.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setNode(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setNode(activeIndex + 1);
    }
  });

  setNode(0, { focus: false, announce: false });
  return nav;
}

function createOperatorControl(node, operators, tokens, announce) {
  if (!operators.length) {
    return null;
  }

  const controls = document.createElement('div');
  controls.className = 'spw-operator-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Spw operator controls');

  const label = document.createElement('span');
  label.className = 'spw-operator-label';
  label.textContent = 'Operators';

  const swapAll = document.createElement('button');
  swapAll.type = 'button';
  swapAll.className = 'spw-operator-swap-all';
  swapAll.textContent = 'Swap all';

  swapAll.addEventListener('click', () => {
    operators.forEach((operator) => {
      const next = nextOperator(operator.el.textContent || operator.char);
      operator.el.textContent = next;
      operator.el.dataset.spwToken = next;
    });
    updateSourceFromTokens(node, tokens);
    if (announce) {
      announce('All Spw operators swapped.');
    }
  });

  controls.append(label, swapAll);
  return controls;
}

function selectionFromNode(node) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return '';
  }
  const range = selection.getRangeAt(0);
  const common = range.commonAncestorContainer;
  const owned = common.nodeType === Node.ELEMENT_NODE
    ? common
    : common.parentElement;
  if (!owned || !node.contains(owned)) {
    return '';
  }
  return selection.toString().trim();
}

function dispatchSelection(detail) {
  window.dispatchEvent(
    new CustomEvent('lore:spw-selection', {
      detail
    })
  );
}

function createRegisterControls(context) {
  const { node, source, associations, expressionId, announce } = context;
  const bank = getSpwRegisterBank();
  let storyCube = buildStoryCube(associations, source, expressionId, bank.snapshot());

  const controls = document.createElement('div');
  controls.className = 'spw-register-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Spw register controls');

  const title = document.createElement('span');
  title.className = 'spw-register-label';
  title.textContent = 'Registers';

  const handleRow = document.createElement('div');
  handleRow.className = 'spw-handle-grid';

  const inspector = document.createElement('pre');
  inspector.className = 'spw-payload-inspector';
  inspector.setAttribute('aria-live', 'polite');
  inspector.textContent = 'Select part of the expression to open structured handle/payload.';

  const registerView = document.createElement('spw-registers');
  const cubeWrap = document.createElement('div');
  cubeWrap.className = 'spw-cube-controls';
  cubeWrap.setAttribute('role', 'group');
  cubeWrap.setAttribute('aria-label', "Rubik's Cube storytelling controls");

  const cubeLabel = document.createElement('span');
  cubeLabel.className = 'spw-cube-label';
  cubeLabel.textContent = "Rubik's Cube";

  const cubeAxes = document.createElement('div');
  cubeAxes.className = 'spw-cube-axis';

  const cubeFaceLabel = document.createElement('span');
  cubeFaceLabel.className = 'spw-cube-face-label';

  const cubeFace = document.createElement('div');
  cubeFace.className = 'spw-cube-face';

  const cubeStatus = document.createElement('span');
  cubeStatus.className = 'spw-cube-status';
  cubeStatus.setAttribute('role', 'status');
  cubeStatus.setAttribute('aria-live', 'polite');

  let cubeFaceIndex = 0;
  const refreshCube = () => {
    storyCube = buildStoryCube(associations, source, expressionId, bank.snapshot());
    renderCubeFace();
  };

  const commitSelection = (selectionText, association = null, atIndex = null, contextMeta = null) => {
    const text = (selectionText || '').trim();
    if (!text) {
      return;
    }

    const parsedSelection = tryParseSelector(text);
    const parsedExpression = tryParseSelector(source.trim());
    const inferredAssociation = association || findAssociationByIndex(associations, atIndex) || parseInlineAssociation(text);

    const handle = inferredAssociation
      ? `${inferredAssociation.sigil}[${inferredAssociation.handle}]`
      : `^[selection/${hashId(`${expressionId}:${text}`)}]{payload}`;

    const payloadId = `${expressionId}:${hashId(`${handle}:${text}`)}`;
    const concepts = deriveConcepts(
      text,
      inferredAssociation?.handle,
      inferredAssociation?.payload,
      expressionId
    );

    const payload = {
      expressionId,
      source,
      selection: text,
      association: inferredAssociation
        ? {
          sigil: inferredAssociation.sigil,
          handle: inferredAssociation.handle,
          payload: inferredAssociation.payload
        }
        : null,
      parser: {
        selectionSelector: parsedSelection,
        expressionSelector: parsedExpression
      },
      context: contextMeta || null,
      concepts
    };

    const entry = {
      handle,
      payloadId,
      payload,
      concepts,
      timestamp: new Date().toISOString()
    };

    bank.setActive(entry);
    registerView.data = { snapshot: bank.snapshot() };
    inspector.textContent = JSON.stringify(payload, null, 2);
    node.dataset.spwHandle = handle;
    node.dataset.spwPayloadId = payloadId;
    dispatchSelection(entry);
    refreshCube();

    if (announce) {
      announce(`Spw handle selected: ${handle}`);
    }
  };

  const renderCubeFace = () => {
    const faceName = CUBE_FACE_ORDER[cubeFaceIndex];
    const facets = Array.isArray(storyCube[faceName]) ? storyCube[faceName] : [];
    node.dataset.spwCubeFace = faceName;
    cubeFace.dataset.spwCubeFace = faceName;
    cubeFaceLabel.textContent = `Face: ${faceName}`;
    cubeStatus.textContent = `${faceName} • ${facets.length} facets`;
    cubeFace.textContent = '';

    if (!facets.length) {
      const empty = document.createElement('span');
      empty.className = 'spw-cube-empty';
      empty.textContent = 'No facets on this face.';
      cubeFace.append(empty);
      return;
    }

    facets.forEach((facet, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spw-cube-entry';
      button.dataset.spwCubeFace = faceName;
      button.dataset.spwFacetIndex = String(index);
      button.textContent = facet;
      button.setAttribute('aria-label', `Select ${faceName} face facet ${index + 1}`);
      button.addEventListener('click', () => {
        const association = parseInlineAssociation(facet) || associations.find((item) => item.text === facet) || null;
        const atIndex = association ? association.start : null;
        commitSelection(facet, association, atIndex, {
          origin: 'cube',
          face: faceName,
          facetIndex: index
        });
        if (announce) {
          announce(`Rubik's Cube ${faceName} facet ${index + 1} selected.`);
        }
      });
      cubeFace.append(button);
    });
  };

  CUBE_AXES.forEach((axis) => {
    const rotate = document.createElement('button');
    rotate.type = 'button';
    rotate.className = 'spw-cube-rotate';
    rotate.dataset.spwAxis = axis;
    rotate.textContent = `Rotate ${axis.toUpperCase()}`;
    rotate.setAttribute('aria-label', `Rotate Rubik's Cube on ${axis.toUpperCase()} axis`);
    rotate.addEventListener('click', () => {
      cubeFaceIndex = rotateFaceIndex(cubeFaceIndex, axis);
      renderCubeFace();
      if (announce) {
        const faceName = CUBE_FACE_ORDER[cubeFaceIndex];
        announce(`Rubik's Cube rotated ${axis.toUpperCase()}, now on ${faceName} face.`);
      }
    });
    cubeAxes.append(rotate);
  });

  associations.slice(0, 16).forEach((association, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spw-handle-button';
    button.dataset.spwHandle = association.handle;
    button.dataset.spwPayload = association.payload;
    button.textContent = `${association.sigil}[${association.handle}]`;
    button.setAttribute('aria-label', `Select handle ${association.handle}`);
    button.addEventListener('click', () => {
      commitSelection(association.text, association, association.start);
    });
    button.style.setProperty('--spw-handle-order', String(index + 1));
    handleRow.append(button);
  });

  node.addEventListener('mouseup', () => {
    const selected = selectionFromNode(node);
    if (selected) {
      commitSelection(selected, null, null, { origin: 'selection' });
    }
  });

  node.addEventListener('keyup', () => {
    const selected = selectionFromNode(node);
    if (selected) {
      commitSelection(selected, null, null, { origin: 'selection' });
    }
  });

  cubeWrap.append(cubeLabel, cubeAxes, cubeFaceLabel, cubeFace, cubeStatus);
  controls.append(title, handleRow, cubeWrap, registerView, inspector);
  registerView.data = { snapshot: bank.snapshot() };
  renderCubeFace();
  return { controls, commitSelection };
}

function enhanceExpressionNode(node, announce) {
  if (!node || node.dataset.spwInteractive === 'true') {
    return false;
  }

  const source = readSource(node);
  if (!source || !source.trim()) {
    return false;
  }

  const associations = extractAssociations(source);

  node.dataset.spwInteractive = 'true';
  node.classList.add('spw-language');
  node.setAttribute('data-spw-expression', 'true');
  const hostInteractive = node.matches('a, button');
  const expressionId = node.id || `spw-expression-${hashId(source).slice(0, 8)}`;
  node.dataset.spwExpressionId = expressionId;

  const { fragment, tokens, operators, braces } = buildTokenizedFragment(source, hostInteractive);
  node.innerHTML = '';
  node.append(fragment);

  if (!node.dataset.spwOriginal) {
    node.dataset.spwOriginal = source;
  }

  if (!hostInteractive) {
    braces.forEach((brace) => {
      const onActivate = () => {
        if (!brace.pairId) {
          activateBracePair(node, braces, 0, announce);
          return;
        }
        activateBracePair(node, braces, brace.pairId, announce);
      };

      brace.el.addEventListener('click', onActivate);
      brace.el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate();
        }
      });
    });

    operators.forEach((operator) => {
      const swapOperator = () => {
        const next = nextOperator(operator.el.textContent || operator.char);
        operator.el.textContent = next;
        operator.el.dataset.spwToken = next;
        updateSourceFromTokens(node, tokens);
        if (announce) {
          announce(`Operator swapped to ${next}.`);
        }
      };

      operator.el.addEventListener('click', swapOperator);
      operator.el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          swapOperator();
        }
      });
    });
  }

  const geometryNodes = tokens.filter((token) => {
    const char = token.el.textContent;
    return isOperator(char) || isOpener(char);
  });
  geometryNodes.forEach((token) => token.el.classList.add('spw-geometry-node'));

  if (!hostInteractive && node.matches(SPW_CONTROL_SELECTOR)) {
    const controlWrap = document.createElement('div');
    controlWrap.className = 'spw-language-controls';

    const operatorControl = createOperatorControl(node, operators, tokens, announce);
    const geometryNav = createGeometryNavigator(node, geometryNodes, announce);
    const registerControl = createRegisterControls({
      node,
      source,
      associations,
      expressionId,
      announce
    });

    if (operatorControl) {
      controlWrap.append(operatorControl);
    }
    if (geometryNav) {
      controlWrap.append(geometryNav);
    }
    if (registerControl?.controls) {
      controlWrap.append(registerControl.controls);
    }

    tokens.forEach((token) => {
      token.el.addEventListener('click', () => {
        registerControl.commitSelection(token.el.textContent, null, token.sourceIndex, {
          origin: 'token'
        });
      });
    });

    const chunkNodes = [...node.querySelectorAll('.spw-chunk')];
    chunkNodes.forEach((chunk) => {
      const commitChunk = () => {
        const start = Number(chunk.dataset.spwStart || '-1');
        const association = findAssociationByIndex(associations, start);
        const selected = association?.text || (chunk.textContent || '').trim();
        if (selected) {
          registerControl.commitSelection(selected, association, start, {
            origin: 'chunk',
            face: node.dataset.spwCubeFace || null
          });
        }
        if (association && announce) {
          announce(`Concept association: ${association.handle}`);
        }
      };

      chunk.addEventListener('click', commitChunk);
      chunk.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          commitChunk();
        }
      });
    });

    if (controlWrap.childElementCount) {
      node.insertAdjacentElement('afterend', controlWrap);
    }
  }

  return true;
}

export function initSpwLanguageRuntime(options = {}) {
  ensureNativeSpwComponents();
  const root = options.root || document;
  const announce = options.announce;
  const selector = options.selector || SPW_SELECTOR;
  const nodes = [...root.querySelectorAll(selector)];
  let enhancedCount = 0;

  nodes.forEach((node) => {
    if (enhanceExpressionNode(node, announce)) {
      enhancedCount += 1;
    }
  });

  return enhancedCount;
}
