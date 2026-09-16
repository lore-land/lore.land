/**
 * reading-gestures.mjs — pinch to size the prose, swipe to turn sections.
 *
 * Two readers' gestures, both scoped to the chapter prose (`main.chapter`)
 * so the rest of the page keeps native browser behaviour:
 *
 *   pinch   → reading scale. Two fingers on the prose scale the text, not
 *             the page: `--reader-scale` on <html> (0.85–1.6), persisted per
 *             device. Trackpad pinch (ctrl+wheel) on the prose does the same.
 *             Zooms that start anywhere else still zoom the page natively and
 *             are mirrored by viewport-packing.mjs.
 *   swipe   → section navigation. A horizontal drag on the prose reveals an
 *             edge cue naming the neighbouring section; release past the
 *             threshold (or flick) turns to it. At the chapter's first/last
 *             section a swipe arms the chapter edge — swipe again inside
 *             1.8s to open the next/previous chapter. Page loads are never
 *             one accidental flick away.
 *
 * Everything here is progressive enhancement over the existing controls:
 * the text-size panel in the aside, the section dock, `[` / `]`, PageUp/Down.
 *
 * Data contract (read by styles/components/gestures.css). Everything is
 * written on `main.chapter` or the cue elements themselves — never on
 * <html>/<body> — so per-frame gesture state only invalidates the prose:
 *   main.chapter  --reader-scale, [data-reader-scale=small|default|large|huge]
 *   main.chapter  [data-reading-gestures=on], [data-gesture=pinch|swipe], [data-swipe=prev|next]
 *   .is-ebook-active  inline transform lean while dragging
 *   .swipe-cue[data-edge][data-state]  --cue-reveal (0…1), set inline
 *   .gesture-hint  first-run hint (touch only)
 */

const SCALE_KEY = 'lore.reader.scale.v1';
const HINT_KEY = 'lore.reader.gesture-hint.v1';

const SCALE_MIN = 0.85;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.08;

const SWIPE_ENGAGE = 14; // px of horizontal travel before a drag becomes a swipe
const SWIPE_FLICK_VELOCITY = 0.6; // px per ms
const SWIPE_FLICK_MIN = 36; // px — a flick still needs some travel
const EDGE_ARM_MS = 1800;
const CUE_COMMIT_MS = 340;
const HINT_DELAY_MS = 1400;
const HINT_TTL_MS = 7000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — the gesture still works for this page */
  }
};
const vibrate = (pattern) => {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
};
const isTouchPrimary = () => document.documentElement.dataset.touch === 'true';

function bucketFor(scale) {
  if (scale < 0.97) return 'small';
  if (scale < 1.12) return 'default';
  if (scale < 1.36) return 'large';
  return 'huge';
}

function percent(scale) {
  return `${Math.round(scale * 100)}%`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Reading scale — the state pinch drives, plus its keyboard-reachable panel.
 * ───────────────────────────────────────────────────────────────────────── */

export function initReadingScale(options = {}) {
  /* State lives on the prose surface, not <html>: the font-size rules that
     read --reader-scale sit on main.chapter, and keeping every hot-path
     write inside that subtree avoids invalidating the whole document. */
  const root = options.surface || document.getElementById('chapter-content') || document.documentElement;
  const aside = options.aside || document.querySelector('aside');
  const announce = typeof options.announce === 'function' ? options.announce : () => {};

  const stored = Number.parseFloat(readStorage(SCALE_KEY) || '');
  let current = Number.isFinite(stored) ? clamp(stored, SCALE_MIN, SCALE_MAX) : 1;

  let readout = null;
  let resetButton = null;
  let smallerButton = null;
  let largerButton = null;

  const render = () => {
    root.style.setProperty('--reader-scale', current.toFixed(3));
    root.dataset.readerScale = bucketFor(current);
    if (readout) {
      readout.value = percent(current);
      readout.textContent = percent(current);
    }
    if (resetButton) {
      resetButton.hidden = Math.abs(current - 1) < 0.005;
    }
    if (smallerButton) smallerButton.disabled = current <= SCALE_MIN + 0.001;
    if (largerButton) largerButton.disabled = current >= SCALE_MAX - 0.001;
  };

  const set = (value, { persist = true, quiet = false } = {}) => {
    const next = clamp(Number(value) || 1, SCALE_MIN, SCALE_MAX);
    const changed = Math.abs(next - current) > 0.0005;
    current = next;
    render();
    if (persist) {
      writeStorage(SCALE_KEY, current.toFixed(3));
      window.dispatchEvent(
        new CustomEvent('lore:reader-scale-change', { detail: { scale: current, percent: percent(current) } })
      );
    }
    if (persist && !quiet && changed) {
      announce(`Text size ${percent(current)}.`);
    }
    return current;
  };

  const nudge = (steps) => set(Math.round((current + steps * SCALE_STEP) / 0.01) * 0.01);
  const reset = () => set(1);

  if (aside && !aside.querySelector('.reader-scale-controls')) {
    const panel = document.createElement('section');
    panel.className = 'reader-scale-controls';
    panel.dataset.component = 'reader-scale';
    panel.setAttribute('aria-label', 'Text size');

    const heading = document.createElement('h2');
    heading.textContent = 'Text size';

    const row = document.createElement('div');
    row.className = 'reader-scale-row';

    smallerButton = document.createElement('button');
    smallerButton.type = 'button';
    smallerButton.className = 'reader-scale-button';
    smallerButton.dataset.step = '-1';
    smallerButton.setAttribute('aria-label', 'Smaller text');
    smallerButton.innerHTML = '<span aria-hidden="true">A<sup>−</sup></span>';

    readout = document.createElement('output');
    readout.className = 'reader-scale-readout';
    readout.setAttribute('aria-live', 'off');
    readout.setAttribute('aria-label', 'Current text size');

    largerButton = document.createElement('button');
    largerButton.type = 'button';
    largerButton.className = 'reader-scale-button';
    largerButton.dataset.step = '1';
    largerButton.setAttribute('aria-label', 'Larger text');
    largerButton.innerHTML = '<span aria-hidden="true">A<sup>+</sup></span>';

    resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'reader-scale-reset';
    resetButton.textContent = 'reset';
    resetButton.setAttribute('aria-label', 'Reset text size');

    row.append(smallerButton, readout, largerButton, resetButton);

    const guide = document.createElement('p');
    guide.className = 'reader-scale-guide';
    guide.textContent = isTouchPrimary()
      ? 'Pinch the prose to size it. Swipe it to turn sections.'
      : 'Pinch on a trackpad over the prose to size it; [ and ] turn sections.';

    panel.append(heading, row, guide);

    const tuning = aside.querySelector('.chapter-tuning-controls');
    if (tuning) {
      tuning.insertAdjacentElement('beforebegin', panel);
    } else {
      aside.append(panel);
    }

    row.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button === resetButton) {
        reset();
        return;
      }
      const step = Number(button.dataset.step || 0);
      if (step) nudge(step);
    });
  }

  render();

  return {
    get: () => current,
    set,
    nudge,
    reset,
    min: SCALE_MIN,
    max: SCALE_MAX
  };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Gestures — pinch + swipe on the prose surface.
 * ───────────────────────────────────────────────────────────────────────── */

export function initReadingGestures(options = {}) {
  const surface = options.surface || document.getElementById('chapter-content');
  const nav = options.nav || null;
  const scale = options.scale || null;
  const links = options.links || null;
  const announce = typeof options.announce === 'function' ? options.announce : () => {};

  if (!surface || typeof window.PointerEvent !== 'function') {
    return () => {};
  }

  const body = document.body;
  surface.dataset.readingGestures = 'on';

  /* ── edge cues ─────────────────────────────────────────────────────── */

  const makeCue = (edge) => {
    const cue = document.createElement('div');
    cue.className = 'swipe-cue';
    cue.dataset.edge = edge;
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML =
      '<span class="swipe-cue-glyph"></span><span class="swipe-cue-kicker"></span><span class="swipe-cue-label"></span>';
    body.append(cue);
    return cue;
  };
  const cues = { prev: makeCue('prev'), next: makeCue('next') };
  let cueTimer = 0;

  const setCue = (edge, { kicker, label, state }) => {
    const cue = cues[edge];
    if (!cue) return;
    cue.querySelector('.swipe-cue-glyph').textContent = edge === 'next' ? '›' : '‹';
    cue.querySelector('.swipe-cue-kicker').textContent = kicker || '';
    cue.querySelector('.swipe-cue-label').textContent = label || '';
    cue.dataset.state = state || 'idle';
  };

  const activeSection = () => surface.querySelector('[data-ebook-section="true"].is-ebook-active');

  const clearCues = () => {
    Object.values(cues).forEach((cue) => {
      cue.dataset.state = 'idle';
      cue.style.removeProperty('--cue-reveal');
    });
    surface.querySelectorAll('[data-ebook-section="true"][data-swipe-lean]').forEach((node) => {
      node.style.removeProperty('transform');
      delete node.dataset.swipeLean;
    });
    delete surface.dataset.swipe;
  };

  const flashCue = (edge, state = 'commit') => {
    const cue = cues[edge];
    if (!cue) return;
    cue.dataset.state = state;
    window.clearTimeout(cueTimer);
    cueTimer = window.setTimeout(clearCues, state === 'armed' ? EDGE_ARM_MS : CUE_COMMIT_MS);
  };

  /* ── first-run hint ────────────────────────────────────────────────── */

  let hint = null;
  let hintTimer = 0;
  const dismissHint = () => {
    if (!hint) return;
    hint.dataset.state = 'leaving';
    const node = hint;
    hint = null;
    window.clearTimeout(hintTimer);
    window.setTimeout(() => node.remove(), 260);
    writeStorage(HINT_KEY, 'seen');
  };

  if (isTouchPrimary() && readStorage(HINT_KEY) !== 'seen') {
    hintTimer = window.setTimeout(() => {
      hint = document.createElement('div');
      hint.className = 'gesture-hint';
      hint.setAttribute('role', 'status');
      hint.innerHTML =
        '<span class="gesture-hint-line"><span class="gesture-hint-glyph" aria-hidden="true">‹ ›</span> swipe the prose to turn sections</span>' +
        '<span class="gesture-hint-line"><span class="gesture-hint-glyph" aria-hidden="true">⤡</span> pinch it to size the text</span>' +
        '<button type="button" class="gesture-hint-close" aria-label="Dismiss hint">×</button>';
      hint.querySelector('.gesture-hint-close').addEventListener('click', dismissHint);
      body.append(hint);
      window.requestAnimationFrame(() => {
        if (hint) hint.dataset.state = 'shown';
      });
      hintTimer = window.setTimeout(dismissHint, HINT_TTL_MS);
    }, HINT_DELAY_MS);
  }

  /* ── pointer state ─────────────────────────────────────────────────── */

  const pointers = new Map();
  let mode = null; // null | 'swipe' | 'pending' | 'pinch' | 'spent'
  let swipe = null; // { id, x0, y0, t0, x, t, dir, threshold, engaged }
  let pinch = null; // { d0, s0 }
  let frame = 0;
  let pendingScale = null;
  let pendingProgress = null;
  let leanTarget = null;
  let armedEdge = null;
  let armedUntil = 0;

  const flush = () => {
    frame = 0;
    if (pendingScale !== null && scale) {
      scale.set(pendingScale, { persist: false });
      pendingScale = null;
    }
    if (pendingProgress !== null && swipe) {
      const cue = cues[swipe.dir];
      if (cue) cue.style.setProperty('--cue-reveal', Math.min(1, Math.abs(pendingProgress)).toFixed(3));
      if (leanTarget && !reducedMotion) {
        leanTarget.dataset.swipeLean = 'true';
        leanTarget.style.transform = `translateX(${(pendingProgress * 14).toFixed(1)}px) translateY(-0.5px)`;
      }
      pendingProgress = null;
    }
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(flush);
  };

  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(b.x - a.x, b.y - a.y);
  };

  const swipeThreshold = () => clamp(surface.clientWidth * 0.22, 72, 140);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const interactiveTarget = (target) =>
    Boolean(
      target?.closest?.(
        'button, a, input, select, textarea, summary, [contenteditable], [draggable="true"], pre, .motif-spw, [data-spw-drag]'
      )
    );

  const hasSelection = () => {
    const selection = document.getSelection?.();
    return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
  };

  const neighbourCue = (dir) => {
    if (!nav) return { kicker: '', label: '' };
    const current = nav.currentSection();
    const count = nav.sectionCount;
    const step = dir === 'next' ? 1 : -1;
    const target = current + step;
    if (target < 1 || target > count) {
      const chapter = dir === 'next' ? links?.next : links?.previous;
      const armed = armedEdge === dir && Date.now() < armedUntil;
      return {
        kicker: armed ? 'swipe again' : dir === 'next' ? 'end of chapter' : 'start of chapter',
        label: chapter ? `Chapter ${String(chapter).padStart(2, '0')}` : '',
        edge: true
      };
    }
    return {
      kicker: `§${String(target).padStart(2, '0')}`,
      label: nav.sectionLabel(target)
    };
  };

  const commitSwipe = (dir) => {
    if (!nav) return;
    const current = nav.currentSection();
    const count = nav.sectionCount;
    const step = dir === 'next' ? 1 : -1;
    const target = current + step;

    if (target >= 1 && target <= count) {
      nav.jumpRelative(step, 'swipe');
      setCue(dir, { ...neighbourCue(dir), state: 'commit' });
      flashCue(dir, 'commit');
      vibrate(6);
      dismissHint();
      return;
    }

    const href = dir === 'next' ? links?.nextHref : links?.previousHref;
    const chapter = dir === 'next' ? links?.next : links?.previous;
    if (!href) {
      flashCue(dir, 'blocked');
      return;
    }

    if (armedEdge === dir && Date.now() < armedUntil) {
      armedEdge = null;
      setCue(dir, { kicker: 'opening', label: `Chapter ${String(chapter).padStart(2, '0')}`, state: 'commit' });
      cues[dir].dataset.state = 'commit';
      announce(`Opening chapter ${chapter}.`);
      vibrate([8, 30, 8]);
      window.setTimeout(() => {
        window.location.href = href;
      }, 120);
      return;
    }

    armedEdge = dir;
    armedUntil = Date.now() + EDGE_ARM_MS;
    setCue(dir, { kicker: 'swipe again', label: `Chapter ${String(chapter).padStart(2, '0')}`, state: 'armed' });
    flashCue(dir, 'armed');
    announce(`${dir === 'next' ? 'End' : 'Start'} of chapter. Swipe again to open chapter ${chapter}.`);
    vibrate(10);
    dismissHint();
  };

  const endSwipe = (commit) => {
    if (!swipe) return;
    const state = swipe;
    swipe = null;
    if (!state.engaged) {
      clearCues();
      return;
    }
    delete surface.dataset.gesture;
    leanTarget = null;
    if (commit) {
      const travelled = Math.abs(state.x - state.x0);
      const elapsed = Math.max(1, state.t - state.t0);
      const velocity = travelled / elapsed;
      const past = travelled >= state.threshold;
      const flick = velocity >= SWIPE_FLICK_VELOCITY && travelled >= SWIPE_FLICK_MIN;
      if (past || flick) {
        commitSwipe(state.dir);
        return;
      }
    }
    clearCues();
  };

  const beginPinch = () => {
    if (!scale || pointers.size !== 2) return;
    if (swipe) endSwipe(false);
    mode = 'pinch';
    pinch = { d0: Math.max(1, distance()), s0: scale.get() };
    surface.dataset.gesture = 'pinch';
  };

  const endPinch = () => {
    if (!pinch) return;
    pinch = null;
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    if (pendingScale !== null && scale) {
      scale.set(pendingScale, { persist: false, quiet: true });
      pendingScale = null;
    }
    delete surface.dataset.gesture;
    if (scale) {
      scale.set(Math.round(scale.get() / 0.01) * 0.01, { persist: true, quiet: true });
      announce(`Text size ${percent(scale.get())}.`);
    }
    dismissHint();
    mode = 'spent';
  };

  /* ── handlers ──────────────────────────────────────────────────────── */

  const onPointerDown = (event) => {
    if (event.pointerType !== 'touch') return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2) {
      beginPinch();
      return;
    }
    if (pointers.size > 2) {
      if (mode === 'pinch') endPinch();
      mode = 'spent';
      return;
    }

    mode = 'pending';
    if (interactiveTarget(event.target) || hasSelection()) {
      mode = 'spent';
      return;
    }
    swipe = {
      id: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      t0: event.timeStamp,
      x: event.clientX,
      t: event.timeStamp,
      dir: null,
      threshold: swipeThreshold(),
      engaged: false
    };
  };

  const onPointerMove = (event) => {
    if (event.pointerType !== 'touch' || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (mode === 'pinch' && pinch && pointers.size === 2 && scale) {
      const ratio = distance() / pinch.d0;
      const next = Math.round(clamp(pinch.s0 * ratio, scale.min, scale.max) / 0.02) * 0.02;
      if (Math.abs(next - scale.get()) < 0.01) return;
      pendingScale = next;
      schedule();
      return;
    }

    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x0;
    const dy = event.clientY - swipe.y0;
    swipe.x = event.clientX;
    swipe.t = event.timeStamp;

    if (!swipe.engaged) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
        swipe = null; // vertical — the browser is scrolling
        mode = 'spent';
        return;
      }
      if (Math.abs(dx) < SWIPE_ENGAGE || Math.abs(dx) < Math.abs(dy) * 1.5) {
        return;
      }
      swipe.engaged = true;
      swipe.dir = dx < 0 ? 'next' : 'prev';
      mode = 'swipe';
      surface.dataset.gesture = 'swipe';
      surface.dataset.swipe = swipe.dir;
      leanTarget = activeSection();
      setCue(swipe.dir, { ...neighbourCue(swipe.dir), state: 'dragging' });
    }

    const dir = dx < 0 ? 'next' : 'prev';
    if (dir !== swipe.dir) {
      cues[swipe.dir].dataset.state = 'idle';
      cues[swipe.dir].style.removeProperty('--cue-reveal');
      swipe.dir = dir;
      surface.dataset.swipe = dir;
      setCue(dir, { ...neighbourCue(dir), state: 'dragging' });
    }
    const progress = clamp(dx / swipe.threshold, -1, 1);
    pendingProgress = progress;
    cues[dir].dataset.state = Math.abs(progress) >= 1 ? 'ready' : 'dragging';
    schedule();
  };

  const release = (event, commit) => {
    if (event.pointerType !== 'touch' || !pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);

    if (mode === 'pinch') {
      if (pointers.size < 2) endPinch();
      return;
    }
    if (swipe && swipe.id === event.pointerId) {
      swipe.x = event.clientX;
      swipe.t = event.timeStamp;
      endSwipe(commit);
    }
    if (!pointers.size) {
      mode = null;
      pinch = null;
    }
  };
  const onPointerUp = (event) => release(event, true);
  const onPointerCancel = (event) => release(event, false);

  /* Safari: block its own page zoom while a pinch is being read as text
     size. `touch-action: pan-y` covers Chromium; these cover WebKit. */
  const onGesture = (event) => {
    if (mode === 'pinch' || pointers.size >= 2) event.preventDefault();
  };
  const onTouchMove = (event) => {
    if (mode === 'pinch' && event.touches.length >= 2 && event.cancelable) event.preventDefault();
  };

  /* Trackpad pinch arrives as ctrl+wheel. Over the prose it sizes the text. */
  let wheelAnnounce = 0;
  const onWheel = (event) => {
    if (!scale || !event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.deltaMode !== 0) return; // a real mouse wheel with ctrl — leave browser zoom alone
    event.preventDefault();
    const delta = clamp(-event.deltaY, -40, 40) * 0.0035;
    scale.set(scale.get() + delta, { persist: false });
    window.clearTimeout(wheelAnnounce);
    wheelAnnounce = window.setTimeout(() => {
      scale.set(Math.round(scale.get() / 0.01) * 0.01, { persist: true });
    }, 220);
  };

  const onAnyTap = () => {
    if (hint) dismissHint();
  };

  surface.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerCancel, { passive: true });
  surface.addEventListener('gesturestart', onGesture);
  surface.addEventListener('gesturechange', onGesture);
  surface.addEventListener('touchmove', onTouchMove, { passive: false });
  surface.addEventListener('wheel', onWheel, { passive: false });
  body.addEventListener('pointerdown', onAnyTap, { passive: true, capture: true });

  return () => {
    surface.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    surface.removeEventListener('gesturestart', onGesture);
    surface.removeEventListener('gesturechange', onGesture);
    surface.removeEventListener('touchmove', onTouchMove);
    surface.removeEventListener('wheel', onWheel);
    body.removeEventListener('pointerdown', onAnyTap, { capture: true });
    window.clearTimeout(cueTimer);
    window.clearTimeout(hintTimer);
    window.clearTimeout(wheelAnnounce);
    if (frame) window.cancelAnimationFrame(frame);
    Object.values(cues).forEach((cue) => cue.remove());
    hint?.remove();
    clearCues();
    delete surface.dataset.gesture;
    delete surface.dataset.readingGestures;
  };
}
