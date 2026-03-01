const BEHAVIOR_TOKENS = Object.freeze({
  interactive: 'interactive',
  loadReactive: 'load-reactive',
  selectionReactive: 'selection-reactive'
});

const DEFAULT_BEHAVIORS = Object.freeze([
  BEHAVIOR_TOKENS.interactive,
  BEHAVIOR_TOKENS.loadReactive,
  BEHAVIOR_TOKENS.selectionReactive
]);

function toBehaviorList(raw = '') {
  const normalized = String(raw || '')
    .split(/[,\s]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (!normalized.length) {
    return [...DEFAULT_BEHAVIORS];
  }

  if (normalized.includes('none')) {
    return [];
  }

  return [...new Set(normalized)];
}

function attachInteractiveBehavior(component) {
  const hadTabIndex = component.hasAttribute('tabindex');
  if (!hadTabIndex) {
    component.setAttribute('tabindex', '0');
  }

  const onKeyDown = (event) => {
    if (event.defaultPrevented || event.target !== component) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      component.click();
    }
  };

  component.addEventListener('keydown', onKeyDown);

  return () => {
    component.removeEventListener('keydown', onKeyDown);
    if (!hadTabIndex) {
      component.removeAttribute('tabindex');
    }
  };
}

function attachLoadReactiveBehavior(component) {
  const applyStage = (detail = {}) => {
    const stage = String(detail.stage || document.body.dataset.loadStage || '').trim();
    const pipeline = String(detail.pipelineStage || document.body.dataset.pipelineStage || '').trim();
    component.dataset.spwRuntimeLoadStage = stage;
    component.dataset.spwRuntimePipeline = pipeline;
  };

  const onLoadStage = (event) => {
    applyStage(event.detail || {});
  };

  window.addEventListener('lore:load-stage', onLoadStage);
  applyStage({});

  return () => {
    window.removeEventListener('lore:load-stage', onLoadStage);
    delete component.dataset.spwRuntimeLoadStage;
    delete component.dataset.spwRuntimePipeline;
  };
}

function attachSelectionReactiveBehavior(component) {
  const matcher = String(component.dataset.spwHandleMatch || '').trim();
  component.dataset.spwRuntimeSelection = 'idle';

  const onSelection = (event) => {
    const handle = String(event.detail?.handle || '').trim();
    if (!handle) {
      component.dataset.spwRuntimeSelection = 'idle';
      return;
    }

    if (!matcher) {
      component.dataset.spwRuntimeSelection = 'active';
      return;
    }

    component.dataset.spwRuntimeSelection = handle.includes(matcher) ? 'hit' : 'miss';
  };

  window.addEventListener('lore:spw-selection', onSelection);

  return () => {
    window.removeEventListener('lore:spw-selection', onSelection);
    delete component.dataset.spwRuntimeSelection;
  };
}

const BEHAVIOR_HANDLERS = Object.freeze({
  [BEHAVIOR_TOKENS.interactive]: attachInteractiveBehavior,
  [BEHAVIOR_TOKENS.loadReactive]: attachLoadReactiveBehavior,
  [BEHAVIOR_TOKENS.selectionReactive]: attachSelectionReactiveBehavior
});

export function attachSpwBehaviorLibrary(component, rawBehaviors = '') {
  const behaviorList = toBehaviorList(rawBehaviors);
  component.dataset.spwBehaviorLibrary = behaviorList.join(',');

  const releases = behaviorList
    .map((token) => BEHAVIOR_HANDLERS[token])
    .filter(Boolean)
    .map((handler) => handler(component));

  return () => {
    releases.forEach((release) => {
      if (typeof release === 'function') {
        release();
      }
    });
    delete component.dataset.spwBehaviorLibrary;
  };
}
