import { parseSpwExpressions } from './spw-expression-index.mjs?v=2026_03_01.A';
import {
  hashId,
  extractAssociations,
  findAssociationByIndex
} from './spw-interactions/story-cube.mjs';
import {
  ensureNativeSpwComponents,
  createGeometryNavigator,
  createOperatorControl,
  selectionFromNode,
  createRegisterControls
} from './spw-interactions/controls.mjs';

/* Click-to-swap cycle order follows the spirit-sequence phase pipeline
   (0-6: ! ? ~ @ & * ^) so cycling an operator walks the actual phase
   progression rather than an arbitrary rotation. @ is excluded — its
   meaning is positional (prefix/postfix relative to a following '['),
   not swappable in place. # is appended: it has no phase (meta/annotation)
   but is still a valid single-role operator worth cycling into. */
const OPERATOR_SEQUENCE = Object.freeze(['!', '?', '~', '&', '*', '^', '#']);

/* Canonical Spw v0.2.0-alpha operator table.
   spirit_sequence = ?~<#.>@(#.)&[#.]*{#.}^   (phase 0 = !, phases 1-6 = sequence above)
   Accessor polarity: # = extrinsic/projection (surface-outward), . = intrinsic/reduction (structure-inward) */
const OPERATOR_ROLES = Object.freeze({
  '?': { role: 'probe',       label: 'probe',       phase: 1, description: 'inspect, select, evaluate' },
  '~': { role: 'potential',   label: 'potential',   phase: 2, description: 'defer, name, superpose' },
  '@': { role: 'perspective', label: 'perspective', phase: 3, description: 'root scope / observer point — @path resolves from this anchor' },
  '&': { role: 'confluence',  label: 'confluence',  phase: 4, description: 'merge, combine frames' },
  '*': { role: 'value',       label: 'value',       phase: 5, description: 'collapse to concrete' },
  '^': { role: 'integration', label: 'integration', phase: 6, description: 'bind upward, emit' },
  '!': { role: 'action',      label: 'action',      phase: 0, description: 'fire effect, inject' },
  '#': { role: 'annotation',  label: 'annotation',  phase: null, polarity: 'extrinsic', description: 'self-reference, resonance — extrinsic / projection accessor' },
  '.': { role: 'ground',      label: 'ground',      phase: null, polarity: 'intrinsic', description: 'access, intrinsic state — intrinsic / reduction accessor' },
  '=': { role: 'config',      label: 'config',      phase: null, description: 'constrain, bias state' },
  '%': { role: 'measure',     label: 'measure',     phase: null, description: 'quantify, observe depth' },
  '$': { role: 'substrate',   label: 'substrate',   phase: null, description: 'introspection, meta-access' }
});

/* Brace-first container model (Spw v0.2.0-alpha).
   Left brace = accumulate charge; right brace = discharge.
   spirit roles: <#.> capsule, (#.) scope, [#.] frame, {#.} body */
const CONTAINER_ROLES = Object.freeze({
  '[': { name: 'frame',   role: 'selection',  charge: '+selection',   spirit: '[#.]', description: 'selection, ordered, indexable' },
  ']': { name: 'frame',   role: 'selection',  charge: '-release',     spirit: '[#.]', description: 'release selection' },
  '{': { name: 'body',    role: 'scope',      charge: '+tension',     spirit: '{#.}', description: 'scope, fundamental container — accumulates semantic mass' },
  '}': { name: 'body',    role: 'scope',      charge: '-discharge',   spirit: '{#.}', description: 'discharge body — collapses field into unit' },
  '(': { name: 'scope',   role: 'grouping',   charge: '+containment', spirit: '(#.)', description: 'grouping, parenthetical — captures flow' },
  ')': { name: 'scope',   role: 'grouping',   charge: '-emission',    spirit: '(#.)', description: 'emit — releases captured flow' },
  '<': { name: 'capsule', role: 'channel',    charge: '+channel',     spirit: '<#.>', description: 'directed channel — names the coupling' },
  '>': { name: 'capsule', role: 'channel',    charge: '-delivery',    spirit: '<#.>', description: 'delivery — completes the conduit' }
});

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

const SPW_CONTROL_SELECTOR = 'pre, .spw-block, .spw-snippet, .motif-spw, .sigil-phrase';

function isOperator(char) {
  return OPERATOR_SEQUENCE.includes(char);
}

/* The "spell reading" — a Spw sigil's meaning is context-sensitive, not a
   fixed label. The same operator reads differently depending on what
   container channels it and what chapter it's spoken in. Swapping the
   sigil, changing the enclosing container, or moving to a different
   chapter's mood are all supposed to change this line, not just the
   glyph or its color. */
function outermostContainerChar(source) {
  for (const char of String(source || '')) {
    if (CONTAINER_ROLES[char]) {
      return char;
    }
  }
  return null;
}

function currentMood() {
  if (typeof document === 'undefined') {
    return 'unmarked';
  }
  return document.body?.dataset?.mood || document.documentElement?.dataset?.mood || 'unmarked';
}

function interpretHandle(sigil, source) {
  const op = OPERATOR_ROLES[sigil];
  if (!op) {
    return '';
  }
  const containerChar = outermostContainerChar(source);
  const container = containerChar ? CONTAINER_ROLES[containerChar] : null;
  const mood = currentMood();

  const clauses = [`${op.role} (${sigil}) — ${op.description}`];
  if (container) {
    clauses.push(`channeled through a ${container.name} (${container.role}) — ${container.description}`);
  }
  clauses.push(`read in a "${mood}"-toned chapter`);
  return clauses.join('; ');
}

/* '.' is ground only when immediately before '[' (e.g. .[property]).
   '@' is always a perspective token — direction is determined by context. */
function isExtendedOperator(char, nextChar, prevChar) {
  if (char === '.') {
    return nextChar === '[';
  }
  if (char === '@') {
    return true;
  }
  return false;
}

/* Derive perspective direction for '@':
   left@ (postfix) when preceded by word char  →  'postfix'  (flashlight)
   @right (prefix) when followed by '['        →  'prefix'   (instantiation)
   Otherwise 'neutral'. */
function perspectiveDirection(prevChar, nextChar) {
  if (nextChar === '[') {
    return 'prefix';
  }
  if (prevChar && /[a-zA-Z0-9_]/.test(prevChar)) {
    return 'postfix';
  }
  return 'neutral';
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

/* Selection anchors: a committed Spw handle becomes a shareable URL
   fragment (#spw=<expressionId>:<handle>) and a matching fragment on
   load/hashchange restores that exact selection. expressionId is a
   content hash of the block's own source text, so it's stable across
   reloads without needing DOM ids. The registry is module-global (not
   per-node) because chapter-sigil.mjs's shadow-root instances each call
   initSpwLanguageRuntime separately, but a selection anchor should
   resolve regardless of which host initialized first. */
const expressionRegistry = new Map();
let lastRestoredHash = null;
let hashRestoreListenerBound = false;

function encodeSelectionHash(expressionId, handle) {
  return `spw=${encodeURIComponent(expressionId)}:${encodeURIComponent(handle)}`;
}

function decodeSelectionHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  const match = raw.match(/^spw=([^:]+):(.+)$/);
  if (!match) {
    return null;
  }
  try {
    return { expressionId: decodeURIComponent(match[1]), handle: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

function updateSelectionHash(expressionId, handle) {
  if (typeof history === 'undefined' || typeof location === 'undefined') {
    return;
  }
  const next = `#${encodeSelectionHash(expressionId, handle)}`;
  if (location.hash === next) {
    return;
  }
  history.replaceState(history.state, '', next);
  lastRestoredHash = next;
}

/* Restore a committed selection from location.hash, if the registry
   already has the target expression registered. Safe to call after
   every initSpwLanguageRuntime pass — a no-op until the right block has
   registered, and idempotent once the hash has already been restored. */
export function restoreSpwSelectionFromLocation() {
  if (typeof location === 'undefined') {
    return false;
  }
  const hash = location.hash;
  if (!hash || hash === lastRestoredHash) {
    return false;
  }
  const decoded = decodeSelectionHash(hash);
  if (!decoded) {
    return false;
  }
  const entry = expressionRegistry.get(decoded.expressionId);
  if (!entry) {
    return false;
  }
  const association = entry.associations.find(
    (item) => `${item.sigil}[${item.handle}]` === decoded.handle
  );
  entry.commitSelection(association ? association.text : decoded.handle, association, association?.start ?? null, {
    origin: 'anchor-restore'
  });
  entry.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  lastRestoredHash = hash;
  return true;
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
    const nextChar = source[i + 1] || '';
    const prevChar = source[i - 1] || '';
    const extended = !isOperator(char) && !isBrace(char) && isExtendedOperator(char, nextChar, prevChar);

    if (!isOperator(char) && !isBrace(char) && !extended) {
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

    const role = OPERATOR_ROLES[char];
    if (role) {
      span.dataset.spwRole = role.role;
    }

    const token = { el: span, sourceIndex: i, char };
    tokens.push(token);

    if (isOperator(char) || extended) {
      span.classList.add('spw-operator');
      if (char === '@') {
        const dir = perspectiveDirection(prevChar, nextChar);
        span.dataset.spwDirection = dir;
        span.classList.add(`spw-perspective-${dir}`);
      }
      if (!hostInteractive) {
        const roleLabel = role ? role.label : char;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', isOperator(char) ? `Swap operator ${char} (${roleLabel})` : `${roleLabel} operator ${char}`);
      }
      if (isOperator(char)) {
        operators.push(token);
      }
    }

    if (isBrace(char)) {
      span.classList.add('spw-brace');
      const container = CONTAINER_ROLES[char];
      if (container) {
        span.dataset.spwContainerRole = container.name;
        span.dataset.spwCharge = container.charge;
        span.classList.add(`spw-brace-${container.name}`);
      }
      if (!hostInteractive) {
        const containerLabel = container ? `${container.name} ${container.charge}` : char;
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `Trace brace ${char} (${containerLabel})`);
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

function enhanceExpressionNode(node, announce) {
  if (!node || node.dataset.spwInteractive === 'true') {
    return false;
  }

  const source = readSource(node);
  if (!source || !source.trim()) {
    return false;
  }

  const parseInfo = parseSpwExpressions(source);
  const associations = extractAssociations(parseInfo);
  node.dataset.spwParseExpressions = String(parseInfo.expressions.length);
  node.dataset.spwParseDiagnostics = String(parseInfo.diagnostics.length);

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
        const nextRole = OPERATOR_ROLES[next];
        operator.el.textContent = next;
        operator.el.dataset.spwToken = next;
        if (nextRole) {
          operator.el.dataset.spwRole = nextRole.role;
          operator.el.setAttribute('aria-label', `Swap operator ${next} (${nextRole.label})`);
        }
        updateSourceFromTokens(node, tokens);
        node.__spwRefreshSpellReading?.();
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

    const operatorControl = createOperatorControl(node, operators, tokens, announce, {
      OPERATOR_ROLES,
      nextOperator,
      updateSourceFromTokens
    });
    const geometryNav = createGeometryNavigator(node, geometryNodes, announce);
    const registerControl = createRegisterControls({
      node,
      source,
      associations,
      expressionId,
      announce,
      OPERATOR_ROLES,
      readSource,
      interpretHandle,
      updateSelectionHash
    });

    if (registerControl?.commitSelection) {
      expressionRegistry.set(expressionId, { node, associations, commitSelection: registerControl.commitSelection });
    }

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

    /* Drag-to-scope: click-drag across the expression creates a ( ) scope span.
       A small scope chip appears after release and is committed to the register. */
    let dragStarted = false;
    node.addEventListener('mousedown', () => {
      dragStarted = false;
    });
    node.addEventListener('mousemove', () => {
      dragStarted = true;
    });
    node.addEventListener('mouseup', () => {
      if (!dragStarted) {
        return;
      }
      dragStarted = false;
      const selected = selectionFromNode(node);
      if (!selected || selected.split(/\s+/).length < 2) {
        return;
      }
      const scopeText = `(${selected})`;
      node.dataset.spwScope = scopeText;
      node.classList.add('has-spw-scope');
      const chip = document.createElement('span');
      chip.className = 'spw-scope-chip';
      chip.textContent = scopeText;
      chip.setAttribute('role', 'status');
      chip.setAttribute('aria-label', `Scope: ${scopeText}`);
      node.insertAdjacentElement('afterend', chip);
      registerControl.commitSelection(selected, null, null, { origin: 'drag-scope', scopeText });
      const scopeTimerId = setTimeout(() => {
        if (chip.parentNode) {
          chip.remove();
        }
        if (node.isConnected) {
          node.classList.remove('has-spw-scope');
          delete node.dataset.spwScope;
        }
      }, 2800);
      if (announce) {
        announce(`Scope created: ${scopeText}`);
      }
    });
  }

  return true;
}

export { OPERATOR_ROLES, CONTAINER_ROLES };

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

  if (!hashRestoreListenerBound && typeof window !== 'undefined') {
    hashRestoreListenerBound = true;
    window.addEventListener('hashchange', () => {
      lastRestoredHash = null;
      restoreSpwSelectionFromLocation();
    });
  }
  restoreSpwSelectionFromLocation();

  return enhancedCount;
}
