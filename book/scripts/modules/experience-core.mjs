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

  const onConnectionChange = () => {
    root.dataset.connection = navigator.connection.effectiveType;
  };
  const connection = navigator.connection;
  if (connection && connection.effectiveType) {
    root.dataset.connection = connection.effectiveType;
    connection.addEventListener('change', onConnectionChange);
  }

  const onOnline = () => {
    root.dataset.online = 'online';
    announce('Connection restored.');
  };
  const onOffline = () => {
    root.dataset.online = 'offline';
    announce('You are offline. Cached content remains available.');
  };

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  const destroy = () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    if (connection) {
      connection.removeEventListener('change', onConnectionChange);
    }
  };

  return { root, announce, destroy };
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
    return () => {};
  }

  if (!('IntersectionObserver' in window)) {
    nodes.forEach((node) => {
      node.classList.add('is-visible');
      node.dataset.revealState = 'visible';
    });
    return () => {};
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

  return () => {
    observer.disconnect();
  };
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
    return () => {};
  }

  const doc = document.documentElement;
  let ticking = false;
  let rafId = 0;

  const updateAttention = () => {
    rafId = 0;
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
    rafId = window.requestAnimationFrame(updateAttention);
  };

  updateAttention();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
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
    return () => {};
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

  const onPointermove = (event) => {
    updatePoint(event.clientX, event.clientY);
    updateSemantic(event.target, 0.68);
  };

  const onTouchmove = (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }
    updatePoint(touch.clientX, touch.clientY);
    updateSemantic(event.target, 0.66);
  };

  const onFocusin = (event) => {
    updateSemantic(event.target, 0.76);
  };

  const onMouseover = (event) => {
    updateSemantic(event.target, 0.64);
  };

  const onFocusout = () => {
    state.strength = 0.56;
    sync();
  };

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  window.addEventListener('pointermove', onPointermove, { passive: true });
  window.addEventListener('touchmove', onTouchmove, { passive: true });
  document.addEventListener('focusin', onFocusin);
  document.addEventListener('mouseover', onMouseover, { passive: true });
  document.addEventListener('focusout', onFocusout);

  updateScroll();

  return () => {
    window.removeEventListener('scroll', updateScroll);
    window.removeEventListener('resize', updateScroll);
    window.removeEventListener('pointermove', onPointermove);
    window.removeEventListener('touchmove', onTouchmove);
    document.removeEventListener('focusin', onFocusin);
    document.removeEventListener('mouseover', onMouseover);
    document.removeEventListener('focusout', onFocusout);
  };
}

export function initSpatialPerspective(options = {}) {
  const root = options.root || document.documentElement;
  const reducedMotion = root.dataset.reducedMotion === 'reduce';
  const layerSelector = options.layerSelector || '[data-scroll-layer]';
  const layers = [...document.querySelectorAll(layerSelector)];

  root.style.setProperty('--focal-x', '50');
  root.style.setProperty('--focal-y', '50');
  root.style.setProperty('--tap-shadow-x', '50');
  root.style.setProperty('--tap-shadow-y', '50');
  root.style.setProperty('--tap-shadow-strength', reducedMotion ? '0' : '0');
  root.style.setProperty('--perspective-depth', reducedMotion ? '0px' : '920px');

  if (reducedMotion) {
    return () => {};
  }

  const state = {
    x: 50,
    y: 50,
    tapX: 50,
    tapY: 50,
    tapStrength: 0
  };

  const sync = () => {
    root.style.setProperty('--focal-x', state.x.toFixed(2));
    root.style.setProperty('--focal-y', state.y.toFixed(2));
    root.style.setProperty('--tap-shadow-x', state.tapX.toFixed(2));
    root.style.setProperty('--tap-shadow-y', state.tapY.toFixed(2));
    root.style.setProperty('--tap-shadow-strength', state.tapStrength.toFixed(3));
  };

  const syncLayerTilt = () => {
    const xDelta = (state.x - 50) / 50;
    const yDelta = (state.y - 50) / 50;
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.scrollLayerDepth || '0.2');
      const tiltX = (yDelta * -1.8 * depth).toFixed(3);
      const tiltY = (xDelta * 1.8 * depth).toFixed(3);
      layer.style.setProperty('--scroll-layer-tilt-x', `${tiltX}deg`);
      layer.style.setProperty('--scroll-layer-tilt-y', `${tiltY}deg`);
    });
  };

  const updatePoint = (clientX, clientY) => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    state.x = Math.min(Math.max((clientX / width) * 100, 0), 100);
    state.y = Math.min(Math.max((clientY / height) * 100, 0), 100);
    sync();
    syncLayerTilt();
  };

  let tapDecayId = 0;

  const pulseTapShadow = (clientX, clientY) => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    state.tapX = Math.min(Math.max((clientX / width) * 100, 0), 100);
    state.tapY = Math.min(Math.max((clientY / height) * 100, 0), 100);
    state.tapStrength = 0.9;
    sync();

    if (tapDecayId) {
      cancelAnimationFrame(tapDecayId);
    }

    const started = performance.now();
    const decay = (now) => {
      const progress = Math.min((now - started) / 700, 1);
      state.tapStrength = Math.max(0, 0.9 * (1 - progress));
      sync();
      if (progress < 1) {
        tapDecayId = window.requestAnimationFrame(decay);
      } else {
        tapDecayId = 0;
      }
    };
    tapDecayId = window.requestAnimationFrame(decay);
  };

  const updatePerspectiveDepth = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scroll = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    const depth = 940 - (scroll * 200);
    root.style.setProperty('--perspective-depth', `${depth.toFixed(1)}px`);
  };

  const onPointermove = (event) => {
    updatePoint(event.clientX, event.clientY);
  };

  const onTouchmove = (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }
    updatePoint(touch.clientX, touch.clientY);
  };

  const onPointerdown = (event) => {
    pulseTapShadow(event.clientX, event.clientY);
  };

  const onTouchstart = (event) => {
    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }
    pulseTapShadow(touch.clientX, touch.clientY);
  };

  window.addEventListener('pointermove', onPointermove, { passive: true });
  window.addEventListener('touchmove', onTouchmove, { passive: true });
  window.addEventListener('pointerdown', onPointerdown, { passive: true });
  window.addEventListener('touchstart', onTouchstart, { passive: true });
  window.addEventListener('scroll', updatePerspectiveDepth, { passive: true });
  window.addEventListener('resize', updatePerspectiveDepth, { passive: true });

  sync();
  syncLayerTilt();
  updatePerspectiveDepth();

  return () => {
    window.removeEventListener('pointermove', onPointermove);
    window.removeEventListener('touchmove', onTouchmove);
    window.removeEventListener('pointerdown', onPointerdown);
    window.removeEventListener('touchstart', onTouchstart);
    window.removeEventListener('scroll', updatePerspectiveDepth);
    window.removeEventListener('resize', updatePerspectiveDepth);
    if (tapDecayId) {
      cancelAnimationFrame(tapDecayId);
    }
  };
}

export function initGenreCombinatorics(options = {}) {
  const root = options.root || document.documentElement;
  const body = document.body;
  let lastCore = '';

  const applyGenre = () => {
    const mood = (body.dataset.mood || root.dataset.mood || 'neutral').toLowerCase();
    const stage = (body.dataset.loadStage || root.dataset.loadStage || 'flow').toLowerCase();
    const mode = (body.dataset.chapterMode || root.dataset.chapterMode || '').toLowerCase();

    const core = mood === 'boon' && stage === 'honk'
      ? 'boonhonk'
      : `${mood}${stage}`;

    const tags = [core];
    if (mode) {
      tags.push(mode);
    }

    const genre = tags.join(' ');
    root.setAttribute('data-genre', genre);
    body.setAttribute('data-genre', genre);

    if (core === 'boonhonk' && lastCore !== 'boonhonk' && options.announce) {
      options.announce('boonhonk combinatoric genre engaged.');
    }
    lastCore = core;
  };

  applyGenre();
  window.addEventListener('lore:load-stage', applyGenre);

  const observer = new MutationObserver(applyGenre);
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-mood', 'data-load-stage', 'data-chapter-mode']
  });

  return () => {
    window.removeEventListener('lore:load-stage', applyGenre);
    observer.disconnect();
  };
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
