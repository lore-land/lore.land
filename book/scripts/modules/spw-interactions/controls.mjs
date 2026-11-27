/**
 * spw-interactions/controls.mjs — DOM controls for interactive Spw expressions:
 * <spw-registers> custom element, CodeLens inspection strip, geometry navigator,
 * batch operator swapper, and register/cube inspector.
 */
import { tryParseSelector } from '../spw-selector-parser.mjs?v=2026_02_28.I';
import { getSpwRegisterBank } from '../spw-register-bank.mjs?v=2026_02_28.I';
import { currentCanonFileHref, resolvePathRefHref } from '../spw-routing.mjs?v=2026_03_02.A';
import {
  CUBE_AXES,
  CUBE_FACE_ORDER,
  hashId,
  findAssociationByIndex,
  parseInlineAssociation,
  deriveConcepts,
  sanitizeHandleToken,
  buildStoryCube,
  collectPathRefs,
  collectAnnotationKinds,
  previewValue,
  rotateFaceIndex
} from './story-cube.mjs';

export function ensureNativeSpwComponents() {
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
        const focusKey = snapshot.focusKey || snapshot.activeKey || '"';
        const registerCount = snapshot.entries ? Object.keys(snapshot.entries).length : 0;

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
            <p class="register-meta">History: ${snapshot.historySize || 0} • Handles: ${handles.length} • Focus: ${focusKey} • Cells: ${registerCount}</p>
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

export function createInspectionControls(context) {
  const { source, associations, expressionId, announce } = context;
  const pathRefs = collectPathRefs(source);
  const annotationSummary = collectAnnotationKinds(source);
  const lineCount = Math.max(1, source.split(/\r?\n/).length);
  const charCount = source.length;
  const frameCount = associations.length;
  const fileHref = currentCanonFileHref();

  const controls = document.createElement('div');
  controls.className = 'spw-inspection-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Spw inspection insights');

  const label = document.createElement('span');
  label.className = 'spw-inspection-label';
  label.textContent = 'Inspection';

  const codelensRow = document.createElement('div');
  codelensRow.className = 'spw-codelens-row';

  const lineLens = document.createElement('button');
  lineLens.type = 'button';
  lineLens.className = 'spw-codelens-link';
  lineLens.dataset.spwExpression = 'true';
  lineLens.textContent = `%[line]{${lineCount}}`;
  lineLens.setAttribute('aria-label', `Expression has ${lineCount} lines and ${charCount} characters`);
  lineLens.addEventListener('click', () => {
    if (announce) {
      announce(`Inspection: ${lineCount} lines, ${charCount} characters.`);
    }
  });

  const frameLens = document.createElement('button');
  frameLens.type = 'button';
  frameLens.className = 'spw-codelens-link';
  frameLens.dataset.spwExpression = 'true';
  frameLens.textContent = `%[frames]{${frameCount}}`;
  frameLens.setAttribute('aria-label', `Expression has ${frameCount} parsed handle frames`);
  frameLens.addEventListener('click', () => {
    if (announce) {
      announce(`Inspection: ${frameCount} handle frames.`);
    }
  });

  const fileLens = document.createElement('a');
  fileLens.className = 'spw-codelens-link';
  fileLens.dataset.spwExpression = 'true';
  fileLens.href = fileHref;
  fileLens.textContent = `@[file]{${fileHref}}`;
  fileLens.setAttribute('aria-label', `Open canonical Spw file ${fileHref}`);

  codelensRow.append(lineLens, frameLens, fileLens);

  pathRefs.slice(0, 3).forEach((ref) => {
    const pathLink = document.createElement('a');
    pathLink.className = 'spw-codelens-link';
    pathLink.dataset.spwExpression = 'true';
    pathLink.href = resolvePathRefHref(ref);
    pathLink.textContent = `@[path]{${ref}}`;
    pathLink.setAttribute('aria-label', `Open path reference ${ref}`);
    codelensRow.append(pathLink);
  });

  const hints = document.createElement('ul');
  hints.className = 'spw-inlay-hints';

  [
    `%[chars]{${charCount}}`,
    `%[paths]{${pathRefs.length}}`,
    `#[annotations]{lens:${annotationSummary.lens} intent:${annotationSummary.intent} anchor:${annotationSummary.anchor} topic:${annotationSummary.topic}}`,
    `^[expression]{${expressionId}}`
  ].forEach((text) => {
    const item = document.createElement('li');
    item.className = 'spw-inlay-hint';
    item.dataset.spwExpression = 'true';
    item.textContent = text;
    hints.append(item);
  });

  const hover = document.createElement('pre');
  hover.className = 'spw-hover-inspector';
  hover.setAttribute('aria-live', 'polite');
  hover.textContent = 'Select any token to inspect inferred handle, context, and parser projection.';

  controls.append(label, codelensRow, hints, hover);

  const updateSelection = (entry) => {
    const handle = previewValue(entry?.handle || '');
    const selection = previewValue(entry?.payload?.selection || '');
    const origin = previewValue(entry?.payload?.context?.origin || 'selection');
    const assoc = entry?.payload?.association
      ? `${entry.payload.association.sigil}[${entry.payload.association.handle}]`
      : 'none';
    const parserSelection = previewValue(
      JSON.stringify(entry?.payload?.parser?.selectionSelector || null),
      160
    );
    const parserExpression = previewValue(
      JSON.stringify(entry?.payload?.parser?.expressionSelector || null),
      160
    );

    hover.textContent = [
      `handle: ${handle || 'n/a'}`,
      `selection: ${selection || 'n/a'}`,
      `origin: ${origin || 'n/a'}`,
      `association: ${assoc}`,
      `parser.selection: ${parserSelection || 'n/a'}`,
      `parser.expression: ${parserExpression || 'n/a'}`
    ].join('\n');
  };

  return { controls, updateSelection };
}

export function focusGeometryNode(nodes, activeIndex, announce, options = {}) {
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

export function createGeometryNavigator(node, nodes, announce) {
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

  prev.addEventListener('click', () => setNode(activeIndex - 1));
  next.addEventListener('click', () => setNode(activeIndex + 1));

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

export function createOperatorControl(node, operators, tokens, announce, deps) {
  const { OPERATOR_ROLES, nextOperator, updateSourceFromTokens } = deps;
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
      const nextRole = OPERATOR_ROLES[next];
      operator.el.textContent = next;
      operator.el.dataset.spwToken = next;
      if (nextRole) {
        operator.el.dataset.spwRole = nextRole.role;
        operator.el.setAttribute('aria-label', `Swap operator ${next} (${nextRole.label})`);
      }
    });
    updateSourceFromTokens(node, tokens);
    node.__spwRefreshSpellReading?.();
    if (announce) {
      announce('All Spw operators swapped.');
    }
  });

  controls.append(label, swapAll);
  return controls;
}

export function selectionFromNode(node) {
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

export function dispatchSelection(detail) {
  window.dispatchEvent(new CustomEvent('lore:spw-selection', { detail }));
}

export function createRegisterControls(context) {
  const {
    node, source, associations, expressionId, announce,
    OPERATOR_ROLES, readSource, interpretHandle, updateSelectionHash
  } = context;
  const bank = getSpwRegisterBank();
  const storyCube = buildStoryCube(associations, source, expressionId);
  const inspectionControl = createInspectionControls(context);

  const controls = document.createElement('div');
  controls.className = 'spw-register-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Spw register controls');

  const title = document.createElement('span');
  title.className = 'spw-register-label';
  title.textContent = 'Registers';

  const handleRow = document.createElement('div');
  handleRow.className = 'spw-handle-grid';

  const spellReading = document.createElement('p');
  spellReading.className = 'spw-spell-reading';
  spellReading.setAttribute('aria-live', 'polite');

  const refreshSpellReading = () => {
    const live = readSource(node);
    const outerOperator = [...live].find((char) => OPERATOR_ROLES[char]);
    spellReading.textContent = outerOperator ? interpretHandle(outerOperator, live) : '';
  };
  refreshSpellReading();
  node.__spwRefreshSpellReading = refreshSpellReading;

  const inspector = document.createElement('pre');
  inspector.className = 'spw-payload-inspector';
  inspector.setAttribute('aria-live', 'polite');
  inspector.textContent = 'Select part of the expression to open structured handle/payload.';

  const registerView = document.createElement('spw-registers');
  const modeWrap = document.createElement('div');
  modeWrap.className = 'spw-handle-mode';
  modeWrap.setAttribute('role', 'group');
  modeWrap.setAttribute('aria-label', 'Spw handle mode');
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

  const registerMode = document.createElement('button');
  registerMode.type = 'button';
  registerMode.className = 'spw-handle-mode-button';
  registerMode.dataset.spwHandleMode = 'register';
  registerMode.textContent = 'Register mode';

  const mathMode = document.createElement('button');
  mathMode.type = 'button';
  mathMode.className = 'spw-handle-mode-button';
  mathMode.dataset.spwHandleMode = 'math';
  mathMode.textContent = 'Math mode';

  modeWrap.append(registerMode, mathMode);

  let handleMode = node.dataset.spwHandleMode === 'math' ? 'math' : 'register';
  let cubeFaceIndex = 0;

  const applyHandleMode = (mode, spoken = false) => {
    handleMode = mode === 'math' ? 'math' : 'register';
    node.dataset.spwHandleMode = handleMode;
    controls.dataset.spwHandleMode = handleMode;
    [registerMode, mathMode].forEach((button) => {
      const active = button.dataset.spwHandleMode === handleMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (spoken && announce) {
      announce(`Spw handle mode: ${handleMode}.`);
    }
  };

  const commitSelection = (selectionText, association = null, atIndex = null, contextMeta = null) => {
    const text = (selectionText || '').trim();
    if (!text) {
      return;
    }

    const parsedSelection = tryParseSelector(text);
    const parsedExpression = tryParseSelector(source.trim());
    const inferredAssociation = association || findAssociationByIndex(associations, atIndex) || parseInlineAssociation(text);

    let handle = inferredAssociation
      ? `${inferredAssociation.sigil}[${inferredAssociation.handle}]`
      : `^[selection/${hashId(`${expressionId}:${text}`)}]{payload}`;

    if (handleMode === 'math') {
      const basis = sanitizeHandleToken(inferredAssociation?.handle || `selection/${hashId(text)}`);
      const payloadText = String(inferredAssociation?.payload || text).replace(/[{}]/g, '');
      handle = `%[math/${basis}]{${payloadText}}`;
    }

    const payloadId = `${expressionId}:${hashId(`${handle}:${text}`)}`;
    const concepts = deriveConcepts(
      text,
      inferredAssociation?.handle,
      inferredAssociation?.payload,
      expressionId
    );

    const payloadContext = {
      ...(contextMeta && typeof contextMeta === 'object' ? contextMeta : {}),
      handleMode
    };

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
      context: payloadContext,
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
    if (inspectionControl) {
      inspectionControl.updateSelection(entry);
    }
    node.dataset.spwHandle = handle;
    node.dataset.spwPayloadId = payloadId;
    dispatchSelection(entry);
    updateSelectionHash(expressionId, handle);

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
      commitSelection(association.text, association, association.start, { origin: 'handle-grid' });
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

  registerMode.addEventListener('click', () => applyHandleMode('register', true));
  mathMode.addEventListener('click', () => applyHandleMode('math', true));

  cubeWrap.append(cubeLabel, cubeAxes, cubeFaceLabel, cubeFace, cubeStatus);
  controls.append(title, spellReading, modeWrap, handleRow, cubeWrap, registerView, inspectionControl.controls, inspector);
  registerView.data = { snapshot: bank.snapshot() };
  applyHandleMode(handleMode, false);
  renderCubeFace();
  return { controls, commitSelection };
}
