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

const SPW_SELECTOR = [
  '.spw-block',
  '.spw-snippet',
  '.motif-spw',
  '.sigil-phrase',
  '[data-spw-expression]'
].join(', ');

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

function activateBracePair(node, braces, pairId, announce) {
  braces.forEach((brace) => {
    brace.el.classList.toggle('is-active', brace.pairId === pairId);
  });

  node.dataset.spwActivePair = pairId ? String(pairId) : '';

  if (pairId && announce) {
    announce(`Brace pair ${pairId} focused.`);
  }
}

function buildTokenizedFragment(source, hostInteractive) {
  const fragment = document.createDocumentFragment();
  const tokens = [];
  const operators = [];
  const braces = [];
  const stack = [];
  let pairCount = 0;
  let buffer = '';

  const flushBuffer = () => {
    if (!buffer) {
      return;
    }
    fragment.append(document.createTextNode(buffer));
    buffer = '';
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (!isOperator(char) && !isBrace(char)) {
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

function enhanceExpressionNode(node, announce) {
  if (!node || node.dataset.spwInteractive === 'true') {
    return false;
  }

  const source = readSource(node);
  if (!source || !source.trim()) {
    return false;
  }

  node.dataset.spwInteractive = 'true';
  node.classList.add('spw-language');
  node.setAttribute('data-spw-expression', 'true');
  const hostInteractive = node.matches('a, button');

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

  if (!hostInteractive && node.matches('pre, .spw-block, .spw-snippet, .motif-spw, .sigil-phrase')) {
    const controlWrap = document.createElement('div');
    controlWrap.className = 'spw-language-controls';

    const operatorControl = createOperatorControl(node, operators, tokens, announce);
    const geometryNav = createGeometryNavigator(node, geometryNodes, announce);
    if (operatorControl) {
      controlWrap.append(operatorControl);
    }
    if (geometryNav) {
      controlWrap.append(geometryNav);
    }

    if (controlWrap.childElementCount) {
      node.insertAdjacentElement('afterend', controlWrap);
    }
  }

  return true;
}

export function initSpwLanguageRuntime(options = {}) {
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
