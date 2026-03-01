const STORAGE_PREFIX = 'lore.experience';

function storageKey(name) {
  return `${STORAGE_PREFIX}.${name}`;
}

function ensureLiveRegion() {
  let region = document.getElementById('experience-live-region');
  if (region) {
    return region;
  }

  region = document.createElement('div');
  region.id = 'experience-live-region';
  region.className = 'sr-only';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.appendChild(region);
  return region;
}

function readPreference(name, fallback = '') {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get(name);
    if (fromQuery) {
      return fromQuery;
    }

    const fromStorage = window.localStorage.getItem(storageKey(name));
    if (fromStorage) {
      return fromStorage;
    }
  } catch (error) {
    console.warn(`Preference read failed for ${name}:`, error);
  }

  return fallback;
}

function writePreference(name, value) {
  try {
    window.localStorage.setItem(storageKey(name), value);
  } catch (error) {
    console.warn(`Preference write failed for ${name}:`, error);
  }
}

export function bootstrapExperience(options = {}) {
  const root = options.root || document.documentElement;
  const region = ensureLiveRegion();
  const announce = (message) => {
    region.textContent = message;
  };

  root.dataset.enhanced = 'true';
  root.dataset.jsReady = 'true';
  root.dataset.webComponents = 'customElements' in window ? 'available' : 'none';
  root.dataset.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'reduce'
    : 'full';
  root.dataset.online = navigator.onLine ? 'online' : 'offline';

  const theme = readPreference('theme', root.dataset.theme || 'paper');
  const dimension = readPreference('dimension', root.dataset.dimension || 'stage');
  const layout = readPreference('layout', root.dataset.layout || 'grid');

  root.dataset.theme = theme;
  root.dataset.dimension = dimension;
  root.dataset.layout = layout;

  const connection = navigator.connection;
  if (connection && connection.effectiveType) {
    root.dataset.connection = connection.effectiveType;
    connection.addEventListener('change', () => {
      root.dataset.connection = connection.effectiveType;
    });
  }

  window.addEventListener('online', () => {
    root.dataset.online = 'online';
    announce('Connection restored.');
  });

  window.addEventListener('offline', () => {
    root.dataset.online = 'offline';
    announce('You are offline. Cached content remains available.');
  });

  return { root, announce };
}

export function initSelectPreference(options = {}) {
  const root = options.root || document.documentElement;
  const select = options.select || document.getElementById(options.id || '');
  if (!select) {
    return null;
  }

  const target =
    typeof options.target === 'string'
      ? document.querySelector(options.target)
      : options.target || root;

  if (!target) {
    return null;
  }

  const datasetKey = options.datasetKey;
  if (!datasetKey) {
    return null;
  }

  const fallback = options.defaultValue || select.value || '';
  const preferred = readPreference(options.preferenceName || datasetKey, fallback);

  if ([...select.options].some((option) => option.value === preferred)) {
    select.value = preferred;
  }

  const apply = (value) => {
    target.dataset[datasetKey] = value;
    writePreference(options.preferenceName || datasetKey, value);

    if (options.onChange) {
      options.onChange(value, target);
    }

    window.dispatchEvent(
      new CustomEvent('lore:preference-change', {
        detail: {
          key: datasetKey,
          value
        }
      })
    );
  };

  apply(select.value || fallback);

  select.addEventListener('change', () => {
    const value = select.value || fallback;
    apply(value);

    if (options.announce) {
      options.announce(`${options.announceLabel || datasetKey} set to ${value}`);
    }
  });

  return select;
}

export function initProgressiveReveal(options = {}) {
  const root = options.root || document;
  const selector = options.selector || '[data-reveal]';
  const nodes = [...root.querySelectorAll(selector)];

  if (!nodes.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    nodes.forEach((node) => {
      node.classList.add('is-visible');
      node.dataset.revealState = 'visible';
    });
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      entry.target.dataset.revealState = 'visible';
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -8% 0px'
  });

  nodes.forEach((node) => {
    node.dataset.revealState = 'pending';
    observer.observe(node);
  });
}

export function initAttentionDetails(options = {}) {
  const root = options.root || document.documentElement;
  const revealSelector = options.revealSelector || '[data-reveal]';
  const layerSelector = options.layerSelector || '[data-component], [data-reveal]';
  const maxRevealDelay = Number(options.maxRevealDelayMs || 680);
  const stepDelay = Number(options.stepDelayMs || 70);
  const reducedMotion = root.dataset.reducedMotion === 'reduce';

  const revealNodes = [...document.querySelectorAll(revealSelector)];
  revealNodes.forEach((node, index) => {
    const delay = Math.min(index * stepDelay, maxRevealDelay);
    node.dataset.revealOrder = String(index + 1);
    node.style.setProperty('--reveal-delay', `${delay}ms`);
  });

  const layerNodes = [...document.querySelectorAll(layerSelector)];
  layerNodes.forEach((node, index) => {
    if (node.dataset.scrollLayerDepth) {
      return;
    }
    const cycleDepth = [0.28, 0.16, 0.36, 0.22][index % 4];
    node.dataset.scrollLayerDepth = String(cycleDepth);
    node.setAttribute('data-scroll-layer', 'auto');
  });

  if (reducedMotion) {
    root.style.setProperty('--attention-scroll-progress', '0');
    root.style.setProperty('--attention-hue-shift', '0');
    return;
  }

  const doc = document.documentElement;
  let ticking = false;

  const updateAttention = () => {
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const raw = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    const progress = Number(raw.toFixed(4));
    const hueShift = Math.round(progress * 30 - 15);

    root.style.setProperty('--attention-scroll-progress', String(progress));
    root.style.setProperty('--attention-hue-shift', String(hueShift));

    layerNodes.forEach((node) => {
      const depth = Number(node.dataset.scrollLayerDepth || '0');
      const offset = (progress - 0.5) * depth * 18;
      node.style.setProperty('--scroll-layer-offset', `${offset.toFixed(2)}px`);
    });

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(updateAttention);
  };

  updateAttention();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

function hashHue(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 360;
  }
  return (hash + 360) % 360;
}

function semanticKeyFromNode(node) {
  if (!node) {
    return '';
  }

  const data = node.dataset || {};
  return data.spwComponent
    || data.component
    || data.seedDimension
    || data.spwRoute
    || data.spwExpression
    || node.getAttribute('aria-label')
    || node.tagName
    || '';
}

export function initSemanticShader(options = {}) {
  const root = options.root || document.documentElement;
  const reducedMotion = root.dataset.reducedMotion === 'reduce';
  const semanticSelector = options.semanticSelector
    || '[data-component], [data-spw-component], [data-seed-dimension], [data-spw-expression], [data-spw-route]';

  root.dataset.semanticShader = reducedMotion ? 'minimal' : 'active';
  root.style.setProperty('--shader-x', '50');
  root.style.setProperty('--shader-y', '18');
  root.style.setProperty('--shader-hue', '204');
  root.style.setProperty('--shader-strength', reducedMotion ? '0.2' : '0.56');
  root.style.setProperty('--shader-scroll', '0');

  if (reducedMotion) {
    return;
  }

  const doc = document.documentElement;
  const state = {
    x: 50,
    y: 18,
    hue: 204,
    strength: 0.56,
    scroll: 0
  };

  const sync = () => {
    root.style.setProperty('--shader-x', state.x.toFixed(2));
    root.style.setProperty('--shader-y', state.y.toFixed(2));
    root.style.setProperty('--shader-hue', String(Math.round(state.hue)));
    root.style.setProperty('--shader-strength', state.strength.toFixed(2));
    root.style.setProperty('--shader-scroll', state.scroll.toFixed(4));
  };

  const updateScroll = () => {
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    state.scroll = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    sync();
  };

  const updatePoint = (clientX, clientY) => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    state.x = Math.min(Math.max((clientX / width) * 100, 0), 100);
    state.y = Math.min(Math.max((clientY / height) * 100, 0), 100);
    sync();
  };

  const updateSemantic = (target, strength = 0.72) => {
    const semanticNode = target ? target.closest(semanticSelector) : null;
    const key = semanticKeyFromNode(semanticNode);
    if (!key) {
      state.strength = 0.56;
      sync();
      return;
    }
    state.hue = hashHue(key);
    state.strength = strength;
    sync();
  };

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });

  window.addEventListener('pointermove', (event) => {
    updatePoint(event.clientX, event.clientY);
    updateSemantic(event.target, 0.68);
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }
    updatePoint(touch.clientX, touch.clientY);
    updateSemantic(event.target, 0.66);
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    updateSemantic(event.target, 0.76);
  });

  document.addEventListener('mouseover', (event) => {
    updateSemantic(event.target, 0.64);
  }, { passive: true });

  document.addEventListener('focusout', () => {
    state.strength = 0.56;
    sync();
  });

  updateScroll();
}

export function enhanceLazyImages(options = {}) {
  const root = options.root || document;
  const selector = options.selector || 'img[loading="lazy"]';
  const images = [...root.querySelectorAll(selector)];

  images.forEach((image) => {
    image.dataset.imageState = 'loading';

    const markLoaded = () => {
      image.dataset.imageState = 'loaded';
    };

    if (image.complete) {
      markLoaded();
      return;
    }

    image.addEventListener('load', markLoaded, { once: true });
    image.addEventListener('error', () => {
      image.dataset.imageState = 'error';
    }, { once: true });

    if ('decode' in image) {
      image.decode().then(markLoaded).catch(() => {
        // decode can fail before load; load/error handlers still manage state.
      });
    }
  });
}

export async function registerStoryServiceWorker(options = {}) {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const root = options.root || document.documentElement;
  const swPath = options.swPath || '/sw.js';
  const scope = options.scope || '/';

  try {
    const registration = await navigator.serviceWorker.register(swPath, { scope });
    root.dataset.pwa = 'registered';

    if (registration.waiting) {
      root.dataset.pwaState = 'waiting';
    } else if (registration.installing) {
      root.dataset.pwaState = 'installing';
    } else {
      root.dataset.pwaState = 'active';
    }

    return registration;
  } catch (error) {
    root.dataset.pwa = 'failed';
    console.warn('Service worker registration failed:', error);
    return null;
  }
}
