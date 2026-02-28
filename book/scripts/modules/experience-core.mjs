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
