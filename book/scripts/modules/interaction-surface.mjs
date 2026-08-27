/**
 * Progressive interaction surface for the monument.
 * Share/copy a chamber, SW update toast, and roving focus for segmented controls.
 * All paths degrade: no-JS keeps static reading; missing APIs fall back gracefully.
 */

/**
 * @param {string} message
 * @param {{ announce?: (msg: string) => void, timeoutMs?: number }} [options]
 */
export function showToast(message, options = {}) {
  if (!message || typeof document === 'undefined') {
    return null;
  }

  let host = document.getElementById('lore-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'lore-toast-host';
    host.className = 'lore-toast-host';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-relevant', 'additions text');
    document.body.appendChild(host);
  }

  const toast = document.createElement('div');
  toast.className = 'lore-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  host.appendChild(toast);

  // Force layout so the enter transition lands
  requestAnimationFrame(() => {
    toast.dataset.state = 'visible';
  });

  if (options.announce) {
    options.announce(message);
  }

  const timeoutMs = options.timeoutMs ?? 4200;
  const hide = () => {
    toast.dataset.state = 'hiding';
    window.setTimeout(() => toast.remove(), 280);
  };
  const timer = window.setTimeout(hide, timeoutMs);

  toast.addEventListener('click', () => {
    window.clearTimeout(timer);
    hide();
  });

  return toast;
}

/**
 * Pass-the-chamber: Web Share API when present, clipboard copy otherwise.
 *
 * @param {{
 *   title?: string,
 *   text?: string,
 *   url?: string,
 *   mount?: Element | null,
 *   label?: string,
 *   announce?: (msg: string) => void
 * }} [options]
 * @returns {() => void | null}
 */
export function initPassAlong(options = {}) {
  const url = options.url || (typeof location !== 'undefined' ? location.href : '');
  const title = options.title || document.title || 'Lore.Land';
  const text = options.text || title;
  const mount =
    options.mount ||
    document.querySelector('aside .additional-links') ||
    document.querySelector('aside') ||
    document.querySelector('.hub-actions');

  if (!mount || !url) {
    return null;
  }

  if (mount.querySelector('.pass-along-button')) {
    return () => {};
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const canCopy = typeof navigator !== 'undefined' && navigator.clipboard?.writeText;

  if (!canShare && !canCopy) {
    return null;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pass-along-button';
  button.dataset.passAlong = canShare ? 'share' : 'copy';
  button.textContent = options.label || (canShare ? 'Pass this chamber' : 'Copy chamber link');
  button.setAttribute(
    'aria-label',
    canShare ? 'Share this chamber link' : 'Copy this chamber link to the clipboard'
  );

  const onClick = async () => {
    button.disabled = true;
    try {
      if (canShare) {
        await navigator.share({ title, text, url });
        showToast('Chamber passed along.', { announce: options.announce });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied — ready to pass along.', { announce: options.announce });
        button.textContent = 'Link copied';
        window.setTimeout(() => {
          button.textContent = options.label || 'Copy chamber link';
        }, 1800);
      }
    } catch (error) {
      // User cancelled share, or clipboard denied — stay quiet unless real failure.
      if (error && error.name !== 'AbortError') {
        showToast('Could not share just now. Try again in a moment.', {
          announce: options.announce,
          timeoutMs: 3200
        });
      }
    } finally {
      button.disabled = false;
    }
  };

  button.addEventListener('click', onClick);

  if (mount.matches?.('.additional-links, .hub-actions')) {
    mount.appendChild(button);
  } else if (mount.tagName === 'ASIDE' || mount.classList?.contains('hub-shell')) {
    const wrap = document.createElement('div');
    wrap.className = 'pass-along-wrap';
    wrap.appendChild(button);
    mount.appendChild(wrap);
  } else {
    mount.appendChild(button);
  }

  return () => {
    button.removeEventListener('click', onClick);
    button.remove();
  };
}

/**
 * When a new service worker is waiting, offer an honest update toast.
 *
 * @param {ServiceWorkerRegistration | null | undefined} registration
 * @param {{ announce?: (msg: string) => void }} [options]
 * @returns {() => void | null}
 */
export function initServiceWorkerUpdate(registration, options = {}) {
  if (!registration || !('serviceWorker' in navigator)) {
    return null;
  }

  let toastEl = null;
  let destroyed = false;

  const offerUpdate = (worker) => {
    if (destroyed || !worker || toastEl) {
      return;
    }

    const host = document.getElementById('lore-toast-host') || (() => {
      const node = document.createElement('div');
      node.id = 'lore-toast-host';
      node.className = 'lore-toast-host';
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
      return node;
    })();

    toastEl = document.createElement('div');
    toastEl.className = 'lore-toast lore-toast--action';
    toastEl.setAttribute('role', 'status');
    toastEl.innerHTML =
      '<span class="lore-toast-copy">A fresher shell is ready.</span>' +
      '<button type="button" class="lore-toast-action">Reload</button>';

    const action = toastEl.querySelector('.lore-toast-action');
    const onReload = () => {
      worker.postMessage?.({ type: 'SKIP_WAITING' });
      // Even without message support, reload picks up the waiting worker after claim.
      window.location.reload();
    };
    action?.addEventListener('click', onReload);

    host.appendChild(toastEl);
    requestAnimationFrame(() => {
      toastEl.dataset.state = 'visible';
    });
    options.announce?.('A fresher shell is ready. Reload to update.');

    document.documentElement.dataset.pwaState = 'waiting';
  };

  if (registration.waiting) {
    offerUpdate(registration.waiting);
  }

  const onUpdateFound = () => {
    const installing = registration.installing;
    if (!installing) {
      return;
    }
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        offerUpdate(registration.waiting || installing);
      }
    });
  };

  registration.addEventListener('updatefound', onUpdateFound);

  // Periodic quiet check on long-lived tabs (once per hour).
  const interval = window.setInterval(() => {
    registration.update?.().catch(() => {});
  }, 60 * 60 * 1000);

  return () => {
    destroyed = true;
    registration.removeEventListener('updatefound', onUpdateFound);
    window.clearInterval(interval);
    toastEl?.remove();
    toastEl = null;
  };
}

/**
 * Roving focus + arrow keys inside segmented button groups (climate, etc.).
 *
 * @param {ParentNode} root
 * @param {string} [groupSelector]
 * @returns {() => void}
 */
export function initSegmentKeyboard(root = document, groupSelector = '.climate-segment, [role="group"].ebook-register-switch') {
  const groups = [...root.querySelectorAll(groupSelector)];
  if (!groups.length) {
    return () => {};
  }

  const cleanups = [];

  groups.forEach((group) => {
    const options = () =>
      [...group.querySelectorAll('button, [role="button"]')].filter(
        (node) => !node.disabled && node.getAttribute('aria-hidden') !== 'true'
      );

    const syncTabIndex = () => {
      const items = options();
      const pressed = items.find((item) => item.getAttribute('aria-pressed') === 'true') || items[0];
      items.forEach((item) => {
        item.tabIndex = item === pressed ? 0 : -1;
      });
    };

    syncTabIndex();

    const onKey = (event) => {
      const items = options();
      if (items.length < 2) {
        return;
      }
      const current = document.activeElement;
      const index = items.indexOf(current);
      if (index < 0) {
        return;
      }

      let next = -1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        next = (index + 1) % items.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        next = (index - 1 + items.length) % items.length;
      } else if (event.key === 'Home') {
        next = 0;
      } else if (event.key === 'End') {
        next = items.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      items[next].tabIndex = 0;
      items[index].tabIndex = -1;
      items[next].focus();
    };

    const onClick = () => {
      // After press changes, keep tab order on the selected option.
      window.requestAnimationFrame(syncTabIndex);
    };

    group.addEventListener('keydown', onKey);
    group.addEventListener('click', onClick);
    cleanups.push(() => {
      group.removeEventListener('keydown', onKey);
      group.removeEventListener('click', onClick);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

const POINTER_CRAFT_SELECTOR = [
  '.hub-cta',
  '.chip',
  '.pass-along-button',
  '.climate-option',
  '.hub-chapter-list a',
  '.topic-card',
  '.lexicon-card',
  '.hub-pillar-grid li',
  '.artifact-card',
  '.chamber-seal-mount',
  'main.chapter figure',
  '.lore-toast-action'
].join(', ');

const HEAT_SELECTOR = '[data-motif="egg"], main.chapter figure, .hub-hero-media, .hub-ch-thumb';

function stampCraftPoint(el, clientX, clientY) {
  const rect = el.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const x = Math.min(100, Math.max(0, ((clientX - rect.left) / width) * 100));
  const y = Math.min(100, Math.max(0, ((clientY - rect.top) / height) * 100));
  el.style.setProperty('--craft-x', x.toFixed(1));
  el.style.setProperty('--craft-y', y.toFixed(1));
}

function nearestHeat(nodes, clientX, clientY) {
  let best = 0;
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      continue;
    }
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const reach = Math.max(rect.width, rect.height) * 0.85 + 120;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const warmth = Math.max(0, 1 - dist / reach);
    if (warmth > 0.04) {
      node.style.setProperty('--heat', warmth.toFixed(3));
      if (warmth > best) {
        best = warmth;
      }
    } else if (node.style.getPropertyValue('--heat')) {
      node.style.removeProperty('--heat');
    }
  }
  return best;
}

/**
 * Local pointer craft: magnetic press, gold sheen origin, egg heat.
 * CSS owns the look; this only stamps coordinates. Reduced-motion still
 * gets hover/press state without magnet travel.
 *
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function initPointerCraft(root = document) {
  const html = document.documentElement;
  if (html.dataset.pointerCraft === 'on') {
    return () => {};
  }

  html.dataset.pointerCraft = 'on';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.dataset.pointerCraftMotion = reduced ? 'reduce' : 'full';

  let hot = null;
  let heatNodes = [];
  let heatFrame = 0;
  let lastHeatX = 50;
  let lastHeatY = 20;

  const refreshHeatNodes = () => {
    heatNodes = [...root.querySelectorAll(HEAT_SELECTOR)];
  };
  refreshHeatNodes();

  const setCraft = (el, state) => {
    if (!el) {
      return;
    }
    if (state) {
      el.dataset.craft = state;
    } else {
      delete el.dataset.craft;
    }
  };

  const onOver = (event) => {
    const target = event.target.closest?.(POINTER_CRAFT_SELECTOR);
    if (!target || target === hot) {
      return;
    }
    if (hot && hot !== target) {
      setCraft(hot, '');
    }
    hot = target;
    setCraft(target, 'hot');
    stampCraftPoint(target, event.clientX, event.clientY);
  };

  const onMove = (event) => {
    lastHeatX = event.clientX;
    lastHeatY = event.clientY;
    if (hot && (event.buttons === 0 || hot.contains(event.target) || hot === event.target)) {
      stampCraftPoint(hot, event.clientX, event.clientY);
    }
    if (heatFrame || !heatNodes.length) {
      return;
    }
    heatFrame = window.requestAnimationFrame(() => {
      heatFrame = 0;
      const warmth = nearestHeat(heatNodes, lastHeatX, lastHeatY);
      html.style.setProperty('--page-heat', warmth.toFixed(3));
    });
  };

  const onDown = (event) => {
    const target = event.target.closest?.(POINTER_CRAFT_SELECTOR);
    if (!target) {
      return;
    }
    hot = target;
    stampCraftPoint(target, event.clientX, event.clientY);
    setCraft(target, 'press');
  };

  const onUp = (event) => {
    if (!hot) {
      return;
    }
    const still = event.target.closest?.(POINTER_CRAFT_SELECTOR);
    setCraft(hot, still === hot ? 'hot' : '');
    if (still !== hot) {
      hot = still || null;
      if (hot) {
        setCraft(hot, 'hot');
      }
    }
  };

  const onOut = (event) => {
    if (!hot) {
      return;
    }
    const next = event.relatedTarget;
    if (next && hot.contains(next)) {
      return;
    }
    setCraft(hot, '');
    hot = null;
  };

  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('pointerout', onOut);

  return () => {
    html.dataset.pointerCraft = 'off';
    root.removeEventListener('pointerover', onOver);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerdown', onDown);
    root.removeEventListener('pointerup', onUp);
    root.removeEventListener('pointercancel', onUp);
    root.removeEventListener('pointerout', onOut);
    if (heatFrame) {
      cancelAnimationFrame(heatFrame);
    }
    if (hot) {
      setCraft(hot, '');
    }
  };
}

/**
 * Wrap a DOM mutation in a View Transition when the browser allows it.
 * Falls back to an immediate apply. Reduced-motion skips the transition.
 *
 * @param {() => void} apply
 * @returns {void}
 */
export function withViewTransition(apply) {
  if (typeof apply !== 'function') {
    return;
  }
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof document.startViewTransition !== 'function') {
    apply();
    return;
  }
  try {
    document.startViewTransition(apply);
  } catch {
    apply();
  }
}
