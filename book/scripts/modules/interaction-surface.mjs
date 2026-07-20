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
