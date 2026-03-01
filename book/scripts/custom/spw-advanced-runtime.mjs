import { attachSpwBinding } from './spw-component-binding.mjs?v=2026_02_28.I';
import { applySpwStyleLibrary } from './spw-style-library.mjs?v=2026_02_28.I';
import { attachSpwBehaviorLibrary } from './spw-behavior-library.mjs?v=2026_02_28.I';

const RUNTIME_ATTRS = Object.freeze({
  style: ['data-spw-style', 'spw-style'],
  behavior: ['data-spw-behavior', 'spw-behavior']
});

const RUNTIME_ATTR_FILTER = Object.freeze([...new Set(Object.values(RUNTIME_ATTRS).flat())]);

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

function hashSignal(text) {
  const source = String(text || '');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash));
}

function dispatchRuntimeEvent(component, phase, detail = {}) {
  component.dispatchEvent(new CustomEvent('lore:spw-runtime-cycle', {
    bubbles: true,
    composed: true,
    detail: {
      phase,
      ...detail
    }
  }));
}

export function attachAdvancedSpwRuntime(component, options = {}) {
  if (!(component instanceof HTMLElement)) {
    return () => {};
  }

  let active = true;
  let releaseStyle = null;
  let releaseBehavior = null;
  let releaseBinding = null;
  let cycleCount = 0;
  let lastSignal = '';

  const clearPrimeResources = () => {
    if (releaseStyle) {
      releaseStyle();
      releaseStyle = null;
    }
    if (releaseBehavior) {
      releaseBehavior();
      releaseBehavior = null;
    }
    if (releaseBinding) {
      releaseBinding();
      releaseBinding = null;
    }
  };

  const resolveCycle = (reason = 'settled') => {
    if (!active) {
      return;
    }

    cycleCount += 1;
    const source = component.dataset.spwSource || component.textContent || '';
    const signal = `${source.length}:${hashSignal(source)}`;
    const changed = signal !== lastSignal;
    lastSignal = signal;

    component.dataset.spwRuntimeState = 'resolved';
    component.dataset.spwRuntimeCycle = String(cycleCount);
    component.dataset.spwRuntimeResolution = reason;
    component.dataset.spwRuntimeSignal = signal;

    dispatchRuntimeEvent(component, 'resolve', {
      cycle: cycleCount,
      reason,
      changed,
      signal
    });
  };

  const primeCycle = () => {
    if (!active) {
      return;
    }

    clearPrimeResources();

    component.dataset.spwRuntimeState = 'priming';
    component.dataset.spwRuntimeCycle = String(cycleCount + 1);

    const styleToken = readFirstAttr(component, RUNTIME_ATTRS.style) || options.style || '';
    const behaviorToken = readFirstAttr(component, RUNTIME_ATTRS.behavior) || options.behavior || '';

    releaseStyle = applySpwStyleLibrary(component, styleToken);
    releaseBehavior = attachSpwBehaviorLibrary(component, behaviorToken);
    releaseBinding = attachSpwBinding(component);

    dispatchRuntimeEvent(component, 'prime', {
      cycle: cycleCount + 1,
      style: component.dataset.spwStyleLibrary || '',
      behavior: component.dataset.spwBehaviorLibrary || ''
    });

    queueMicrotask(() => resolveCycle('prime'));
  };

  const onApplied = (event) => {
    if (event.target !== component || !active) {
      return;
    }
    resolveCycle('binding-applied');
  };

  const onError = (event) => {
    if (event.target !== component || !active) {
      return;
    }
    component.dataset.spwRuntimeState = 'error';
    component.dataset.spwRuntimeError = String(event.detail?.error || 'runtime-error');
    dispatchRuntimeEvent(component, 'error', {
      cycle: cycleCount,
      error: component.dataset.spwRuntimeError
    });
  };

  component.addEventListener('lore:spw-component-applied', onApplied);
  component.addEventListener('lore:spw-component-error', onError);

  const observer = new MutationObserver((mutations) => {
    if (!active) {
      return;
    }

    const shouldReprime = mutations.some((mutation) =>
      RUNTIME_ATTR_FILTER.includes(mutation.attributeName || '')
    );

    if (shouldReprime) {
      primeCycle();
    }
  });

  observer.observe(component, {
    attributes: true,
    attributeFilter: [...RUNTIME_ATTR_FILTER]
  });

  primeCycle();

  return () => {
    active = false;
    observer.disconnect();
    component.removeEventListener('lore:spw-component-applied', onApplied);
    component.removeEventListener('lore:spw-component-error', onError);
    clearPrimeResources();
    delete component.dataset.spwRuntimeState;
    delete component.dataset.spwRuntimeCycle;
    delete component.dataset.spwRuntimeResolution;
    delete component.dataset.spwRuntimeSignal;
    delete component.dataset.spwRuntimeError;
  };
}
