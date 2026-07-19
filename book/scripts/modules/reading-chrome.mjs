/**
 * reading-chrome.mjs — Menu and scroll chrome for monument + chapter surfaces.
 *
 * Progressive enhancement only:
 * - Hub: collapsible primary nav on narrow viewports
 * - All: compact sticky chrome after scroll; hide-on-scroll-down for reading space
 * - Shared CSS vars for scroll padding so anchors clear sticky bars
 */

import { onScrollFrame, onResizeFrame } from './scroll-coordinator.mjs?v=2026_07_18.B';

const COMPACT_AT = 48;
const HIDE_DELTA = 10;
const SHOW_NEAR_TOP = 72;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function smoothScrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

/**
 * Scroll-aware chrome state on <html>:
 * data-scroll-compact, data-scroll-dir, data-chrome-hidden
 * --page-scroll, --scroll-pad-top
 *
 * @param {{ mode?: 'hub' | 'chapter' }} [options]
 * @returns {() => void}
 */
export function initScrollChrome(options = {}) {
  const root = document.documentElement;
  const mode = options.mode || (document.body?.dataset.surface === 'monument' ? 'hub' : 'chapter');
  root.dataset.scrollChrome = mode;

  let lastY = window.scrollY;
  let hidden = false;
  let compact = false;
  let dir = 'idle';
  const reduced = prefersReducedMotion();

  const measurePad = () => {
    const topbar =
      document.querySelector('.hub-topbar') ||
      document.querySelector('nav.chapter-navigation');
    const height = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
    const pad = Math.max(height + 12, mode === 'hub' ? 72 : 56);
    root.style.setProperty('--scroll-pad-top', `${pad}px`);
    return pad;
  };

  const apply = (snap) => {
    const y = snap?.y ?? window.scrollY;
    const progress = snap?.progress ?? 0;
    root.style.setProperty('--page-scroll', String(Math.round(progress * 1000) / 1000));

    const nextCompact = y > COMPACT_AT;
    if (nextCompact !== compact) {
      compact = nextCompact;
      root.dataset.scrollCompact = compact ? 'true' : 'false';
    }

    const delta = y - lastY;
    let nextDir = dir;
    if (Math.abs(delta) >= 2) {
      nextDir = delta > 0 ? 'down' : 'up';
    }

    let nextHidden = hidden;
    if (reduced) {
      nextHidden = false;
    } else if (y < SHOW_NEAR_TOP) {
      nextHidden = false;
    } else if (delta > HIDE_DELTA) {
      nextHidden = true;
    } else if (delta < -HIDE_DELTA) {
      nextHidden = false;
    }

    if (root.dataset.menuOpen === 'true') {
      nextHidden = false;
    }

    if (nextDir !== dir) {
      dir = nextDir;
      root.dataset.scrollDir = dir;
    }

    if (nextHidden !== hidden) {
      hidden = nextHidden;
      root.dataset.chromeHidden = hidden ? 'true' : 'false';
      document.body.dataset.chromeHidden = hidden ? 'true' : 'false';
    }

    lastY = y;
  };

  measurePad();
  root.dataset.scrollCompact = 'false';
  root.dataset.chromeHidden = 'false';
  root.dataset.scrollDir = 'idle';

  const unsubScroll = onScrollFrame(apply);
  const unsubResize = onResizeFrame(() => {
    measurePad();
  }, { immediate: false });

  return () => {
    unsubScroll();
    unsubResize();
    delete root.dataset.scrollChrome;
    delete root.dataset.scrollCompact;
    delete root.dataset.scrollDir;
    delete root.dataset.chromeHidden;
    delete document.body.dataset.chromeHidden;
    root.style.removeProperty('--page-scroll');
    root.style.removeProperty('--scroll-pad-top');
  };
}

/**
 * Collapsible primary nav for monument topbars on narrow viewports.
 * Desktop keeps the full inline nav; no-JS remains fully linked.
 *
 * @param {{ root?: ParentNode, announce?: Function }} [options]
 * @returns {() => void | null}
 */
export function initHubMenu(options = {}) {
  const root = options.root || document;
  const topbar = root.querySelector?.('.hub-topbar') || document.querySelector('.hub-topbar');
  const nav = topbar?.querySelector('.hub-nav');
  if (!topbar || !nav) {
    return null;
  }

  // Avoid double-init
  if (topbar.querySelector('.hub-menu-toggle')) {
    return () => {};
  }

  topbar.classList.add('hub-topbar--enhanced');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hub-menu-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.innerHTML = '<span class="hub-menu-toggle-bars" aria-hidden="true"></span><span class="hub-menu-toggle-label">Menu</span>';

  if (!nav.id) {
    nav.id = 'hub-primary-nav';
  }
  toggle.setAttribute('aria-controls', nav.id);

  const mark = topbar.querySelector('.hub-mark');
  if (mark) {
    mark.insertAdjacentElement('afterend', toggle);
  } else {
    topbar.prepend(toggle);
  }

  let open = false;
  const mq = window.matchMedia('(max-width: 52rem)');

  const setOpen = (next, { quiet = false } = {}) => {
    open = Boolean(next) && mq.matches;
    topbar.dataset.menuOpen = open ? 'true' : 'false';
    document.documentElement.dataset.menuOpen = open ? 'true' : 'false';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('.hub-menu-toggle-label').textContent = open ? 'Close' : 'Menu';

    if (open) {
      // Trap focus lightly: focus first link
      const first = nav.querySelector('a');
      first?.focus({ preventScroll: true });
    }

    if (!quiet && options.announce) {
      options.announce(open ? 'Menu open.' : 'Menu closed.');
    }
  };

  const onToggle = () => setOpen(!open);

  const onNavClick = (event) => {
    const link = event.target.closest?.('a');
    if (!link || !nav.contains(link)) {
      return;
    }
    // Close after in-page or route navigation starts
    if (mq.matches) {
      setOpen(false, { quiet: true });
    }
  };

  const onKey = (event) => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  };

  const onMedia = () => {
    if (!mq.matches) {
      setOpen(false, { quiet: true });
    }
  };

  // Smooth in-page anchors under sticky chrome
  const onDocClick = (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || link.getAttribute('href') === '#') {
      return;
    }
    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) {
      return;
    }
    event.preventDefault();
    if (open) {
      setOpen(false, { quiet: true });
    }
    target.scrollIntoView({ behavior: smoothScrollBehavior(), block: 'start' });
    if (history.replaceState) {
      history.replaceState(null, '', `#${id}`);
    }
    // Move focus for a11y without fighting the scroll
    if (!target.hasAttribute('tabindex')) {
      target.tabIndex = -1;
    }
    target.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', onToggle);
  nav.addEventListener('click', onNavClick);
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onDocClick);
  if (mq.addEventListener) {
    mq.addEventListener('change', onMedia);
  } else {
    mq.addListener(onMedia);
  }

  return () => {
    toggle.removeEventListener('click', onToggle);
    nav.removeEventListener('click', onNavClick);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onDocClick);
    if (mq.removeEventListener) {
      mq.removeEventListener('change', onMedia);
    } else {
      mq.removeListener(onMedia);
    }
    toggle.remove();
    delete topbar.dataset.menuOpen;
    delete document.documentElement.dataset.menuOpen;
    topbar.classList.remove('hub-topbar--enhanced');
  };
}

/**
 * Chapter shell polish: sticky bar labels, section dock, keyboard reveal of chrome.
 * @returns {() => void | null}
 */
export function initChapterChrome() {
  const nav = document.querySelector('nav.chapter-navigation');
  const sectionNav = document.querySelector('.section-navigation');
  if (!nav && !sectionNav) {
    return null;
  }

  document.body.dataset.readingChrome = 'chapter';
  nav?.classList.add('chapter-navigation--enhanced');
  sectionNav?.classList.add('section-navigation--enhanced');

  if (sectionNav && !sectionNav.getAttribute('aria-label')) {
    sectionNav.setAttribute('aria-label', 'Section navigation');
  }

  const reveal = () => {
    document.documentElement.dataset.chromeHidden = 'false';
    document.body.dataset.chromeHidden = 'false';
  };
  nav?.addEventListener('focusin', reveal);
  sectionNav?.addEventListener('focusin', reveal);

  return () => {
    nav?.removeEventListener('focusin', reveal);
    sectionNav?.removeEventListener('focusin', reveal);
    nav?.classList.remove('chapter-navigation--enhanced');
    sectionNav?.classList.remove('section-navigation--enhanced');
    delete document.body.dataset.readingChrome;
  };
}

export { smoothScrollBehavior };
