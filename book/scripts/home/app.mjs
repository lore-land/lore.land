/**
 * Monument surface progressive enhancement.
 * Static HTML carries the full threshold path; this module adds:
 * - reading climate toggle (theme / depth / lighting)
 * - dynamic field lighting (pointer + scroll)
 * - resume path, service worker, light polish
 */
import {
  bootstrapExperience,
  enhanceLazyImages,
  registerStoryServiceWorker
} from '../modules/experience-core.mjs?v=2026_07_19.A';
import { injectSvgFilters } from '../modules/svg-filters.mjs';
import { renderChamberSeals } from '../modules/chamber-seals.mjs?v=2026_07_19.A';
import { initHubMenu, initScrollChrome } from '../modules/reading-chrome.mjs?v=2026_07_19.A';
import { initHubTemporalClimate } from '../modules/copy-climate.mjs?v=2026_07_19.A';
import { onScrollFrame } from '../modules/scroll-coordinator.mjs?v=2026_07_19.A';
import { initStorySpark } from '../modules/story-spark.mjs?v=2026_07_23.A';
import {
  initPassAlong,
  initServiceWorkerUpdate,
  initSegmentKeyboard
} from '../modules/interaction-surface.mjs?v=2026_07_19.A';

const RESUME_KEY = 'lore.reading.resume-chapter';
const THEME_KEY = 'lore.monument.theme';
const WONDER_KEY = 'lore.monument.wonder';
const LIGHTING_KEY = 'lore.monument.lighting';

const THEMES = ['paper', 'ember', 'night'];
const WONDERS = ['quiet', 'rich', 'deep'];
const LIGHTINGS = ['still', 'raking', 'live'];

function readPref(key, allowed, fallback) {
  try {
    const value = window.localStorage.getItem(key) || '';
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writePref(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

function readResumeChapter() {
  try {
    const value = Number(window.localStorage.getItem(RESUME_KEY) || '0');
    return value >= 1 && value <= 13 ? value : 0;
  } catch {
    return 0;
  }
}

function markCurrentChapterInIndex() {
  const resume = readResumeChapter();
  if (!resume) {
    return;
  }

  const padded = String(resume).padStart(2, '0');
  const links = document.querySelectorAll('.hub-chapter-list a[href*="/book/chapter/"]');
  links.forEach((link) => {
    if (link.getAttribute('href')?.includes(`/chapter/${padded}`)) {
      link.dataset.resume = 'true';
      link.setAttribute('aria-current', 'true');
    }
  });
}

function enhancePrimaryCta() {
  const resume = readResumeChapter();
  if (resume <= 1) {
    return;
  }

  const primary = document.querySelector('.hub-hero .hub-cta-primary');
  if (!primary) {
    return;
  }

  const padded = String(resume).padStart(2, '0');
  const sub = document.createElement('span');
  sub.className = 'hub-cta-sub';
  sub.textContent = `Chapter ${padded}`;
  primary.href = `/book/chapter/${padded}/`;
  primary.replaceChildren(document.createTextNode('Continue reading'), sub);
  primary.setAttribute('aria-label', `Continue reading at chapter ${padded}`);
}

function applyClimate({ theme, wonder, lighting }) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.wonder = wonder;
  root.dataset.lighting = lighting;
  document.body.dataset.theme = theme;
  document.body.dataset.wonder = wonder;
  document.body.dataset.lighting = lighting;

  // Depth defaults for static lighting modes
  if (lighting === 'still') {
    root.style.setProperty('--light-x', '48');
    root.style.setProperty('--light-y', '12');
    root.style.setProperty('--light-strength', wonder === 'deep' ? '0.72' : wonder === 'quiet' ? '0.38' : '0.55');
  } else if (lighting === 'raking') {
    root.style.setProperty('--light-x', '78');
    root.style.setProperty('--light-y', '8');
    root.style.setProperty('--light-strength', wonder === 'deep' ? '0.82' : wonder === 'quiet' ? '0.48' : '0.66');
  }
}

function buildSegment(name, label, options, current) {
  const field = document.createElement('div');
  field.className = 'climate-field';
  field.dataset.climateField = name;

  const legend = document.createElement('span');
  legend.className = 'climate-legend';
  legend.textContent = label;
  field.appendChild(legend);

  const group = document.createElement('div');
  group.className = 'climate-segment';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label);

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'climate-option';
    button.dataset.value = option;
    button.textContent = option;
    button.setAttribute('aria-pressed', option === current ? 'true' : 'false');
    group.appendChild(button);
  });

  field.appendChild(group);
  return field;
}

function ensureClimateToggle(state, announce) {
  const topbar = document.querySelector('.hub-topbar');
  if (!topbar) {
    return null;
  }

  let form = topbar.querySelector('.monument-climate');
  if (form) {
    return form;
  }

  form = document.createElement('form');
  form.className = 'monument-climate';
  form.setAttribute('aria-label', 'Reading climate');
  form.addEventListener('submit', (event) => event.preventDefault());

  form.append(
    buildSegment('theme', 'Theme', THEMES, state.theme),
    buildSegment('wonder', 'Depth', WONDERS, state.wonder),
    buildSegment('lighting', 'Light', LIGHTINGS, state.lighting)
  );

  form.addEventListener('click', (event) => {
    const button = event.target.closest('.climate-option');
    if (!button) {
      return;
    }
    const field = button.closest('.climate-field');
    if (!field) {
      return;
    }
    const name = field.dataset.climateField;
    const value = button.dataset.value;
    if (!name || !value) {
      return;
    }

    field.querySelectorAll('.climate-option').forEach((item) => {
      item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
    });

    if (name === 'theme') {
      state.theme = value;
      writePref(THEME_KEY, value);
    } else if (name === 'wonder') {
      state.wonder = value;
      writePref(WONDER_KEY, value);
    } else if (name === 'lighting') {
      state.lighting = value;
      writePref(LIGHTING_KEY, value);
      if (value === 'live') {
        state._bindLivePointer?.();
      } else {
        state._unbindLivePointer?.();
      }
    }

    applyClimate(state);
    if (announce) {
      announce(`Climate: ${state.theme} theme, ${state.wonder} depth, ${state.lighting} light.`);
    }
  });

  // Place after nav when present
  const nav = topbar.querySelector('.hub-nav');
  if (nav) {
    nav.insertAdjacentElement('afterend', form);
  } else {
    topbar.appendChild(form);
  }

  return form;
}

function initDynamicLighting(state) {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let lastGlow = -1;
  let pointerBound = false;

  const setLight = (x, y, strength) => {
    root.style.setProperty('--light-x', String(Math.round(x * 10) / 10));
    root.style.setProperty('--light-y', String(Math.round(y * 10) / 10));
    root.style.setProperty('--light-strength', String(Math.round(strength * 100) / 100));
  };

  const onPointer = (event) => {
    if (state.lighting !== 'live' || reduced) {
      return;
    }
    const x = (event.clientX / Math.max(window.innerWidth, 1)) * 100;
    const y = (event.clientY / Math.max(window.innerHeight, 1)) * 100;
    const depth = state.wonder === 'deep' ? 0.88 : state.wonder === 'quiet' ? 0.5 : 0.7;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => setLight(x, y, depth));
  };

  const bindPointer = () => {
    if (pointerBound || reduced) {
      return;
    }
    window.addEventListener('pointermove', onPointer, { passive: true });
    pointerBound = true;
  };

  const unbindPointer = () => {
    if (!pointerBound) {
      return;
    }
    window.removeEventListener('pointermove', onPointer);
    pointerBound = false;
  };

  if (state.lighting === 'live') {
    bindPointer();
  }

  const unsubScroll = onScrollFrame((snap) => {
    const progress = snap.progress;
    if (Math.abs(progress - lastGlow) >= 0.01) {
      lastGlow = progress;
      root.style.setProperty('--scroll-glow', String(Math.round(progress * 100) / 100));
    }

    if (state.lighting === 'raking' && !reduced) {
      const x = 72 + progress * 18;
      const y = 6 + progress * 22;
      const strength = (state.wonder === 'deep' ? 0.78 : 0.58) + progress * 0.12;
      setLight(x, y, strength);
    } else if (state.lighting === 'live' && !reduced) {
      const currentY = Number(root.style.getPropertyValue('--light-y') || '20');
      setLight(
        Number(root.style.getPropertyValue('--light-x') || '50'),
        Math.min(88, currentY * 0.85 + (12 + progress * 40) * 0.15),
        Number(root.style.getPropertyValue('--light-strength') || '0.6')
      );
    }
  });

  // Expose binder so climate toggle can attach pointer only when live.
  state._bindLivePointer = bindPointer;
  state._unbindLivePointer = unbindPointer;

  return () => {
    unsubScroll();
    unbindPointer();
    cancelAnimationFrame(frame);
  };
}

/*
 * Boof's trail — marks stay marked.
 * On wide viewports the left margin is common land: as the reader descends,
 * paw prints settle where they walked. A berry sprig waits at the bottom.
 * Progressive polish only; the trail never intercepts pointer events.
 */
const PAW_SVG = [
  '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor">',
  '<ellipse cx="12" cy="15.6" rx="5" ry="4.2"/>',
  '<ellipse cx="5.6" cy="9.8" rx="2.1" ry="2.9" transform="rotate(-18 5.6 9.8)"/>',
  '<ellipse cx="9.9" cy="7" rx="2.1" ry="3" transform="rotate(-6 9.9 7)"/>',
  '<ellipse cx="14.3" cy="7" rx="2.1" ry="3" transform="rotate(6 14.3 7)"/>',
  '<ellipse cx="18.6" cy="9.8" rx="2.1" ry="2.9" transform="rotate(18 18.6 9.8)"/>',
  '</g></svg>'
].join('');

const SPRIG_SVG = [
  '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">',
  '<path d="M12 21 C 11 15, 12 9, 14 4"/>',
  '<path d="M13.4 8 C 15.5 7, 17 5.4, 17.6 3.4"/>',
  '</g><g fill="currentColor">',
  '<circle cx="9.2" cy="12.4" r="2.5"/><circle cx="14.6" cy="14.8" r="2.1"/><circle cx="10.8" cy="17.6" r="1.8"/>',
  '</g></svg>'
].join('');

function initBoofTrail() {
  const wide = window.matchMedia('(min-width: 72rem)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let trail = null;
  let marks = [];
  let rebuildTimer = 0;

  const buildTrail = () => {
    if (trail) {
      trail.remove();
      trail = null;
    }
    marks = [];
    if (!wide.matches) {
      return;
    }

    const docHeight = document.documentElement.scrollHeight;
    if (docHeight < 1400) {
      return;
    }

    trail = document.createElement('div');
    trail.className = 'boof-trail';
    trail.setAttribute('aria-hidden', 'true');

    const start = 340;
    const end = docHeight - 260;
    const step = 148;
    let stride = 0;
    for (let y = start; y < end; y += step + (stride % 3) * 9) {
      const paw = document.createElement('span');
      paw.className = 'boof-paw';
      const wander = Math.sin(y / 420) * 16;
      const gait = stride % 2 === 0 ? -8 : 8;
      const heading = Math.cos(y / 420) * 22;
      paw.style.top = `${y}px`;
      paw.style.setProperty('--paw-x', `${Math.round(22 + wander + gait)}px`);
      paw.style.setProperty('--paw-rot', `${Math.round(heading + gait * 1.4)}deg`);
      paw.innerHTML = PAW_SVG;
      trail.appendChild(paw);
      marks.push({ element: paw, y });
      stride += 1;
    }

    const sprig = document.createElement('span');
    sprig.className = 'boof-paw boof-sprig';
    sprig.style.top = `${end}px`;
    sprig.style.setProperty('--paw-x', '18px');
    sprig.style.setProperty('--paw-rot', '0deg');
    sprig.innerHTML = SPRIG_SVG;
    trail.appendChild(sprig);
    marks.push({ element: sprig, y: end });

    document.body.appendChild(trail);
    placeMarks();
  };

  const placeMarks = () => {
    if (!marks.length) {
      return;
    }
    const reach = window.scrollY + window.innerHeight * 0.72;
    marks.forEach((mark) => {
      if (reduced.matches || mark.y <= reach) {
        mark.element.classList.add('is-placed');
      }
    });
  };

  const scheduleRebuild = () => {
    window.clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(buildTrail, 220);
  };

  window.addEventListener('scroll', placeMarks, { passive: true });
  window.addEventListener('resize', scheduleRebuild, { passive: true });
  wide.addEventListener?.('change', scheduleRebuild);

  // Fonts and lazy media shift the document height after load settles.
  window.addEventListener('load', scheduleRebuild, { once: true });
  buildTrail();

  return () => {
    window.removeEventListener('scroll', placeMarks);
    window.removeEventListener('resize', scheduleRebuild);
    wide.removeEventListener?.('change', scheduleRebuild);
    window.clearTimeout(rebuildTimer);
    if (trail) {
      trail.remove();
    }
  };
}

function initScenePresence() {
  const body = document.body;
  const sections = [...document.querySelectorAll('.hub-main > section[id]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;

  body.dataset.presence = 'awake';
  body.dataset.motion = reduced ? 'reduced' : 'available';

  const compass = document.createElement('div');
  compass.className = 'reading-compass';
  compass.setAttribute('aria-hidden', 'true');
  compass.innerHTML = [
    '<svg viewBox="0 0 28 176" role="presentation">',
    '<circle cx="14" cy="10" r="4"/>',
    '<path class="reading-compass-bed" d="M14 19V157"/>',
    '<path class="reading-compass-current" pathLength="1" d="M14 19V157"/>',
    '<path class="reading-compass-seed" d="M14 166c-7-8-7-14 0-18 7 4 7 10 0 18Zm0-3c-1-7 2-12 9-14 1 7-2 12-9 14Z"/>',
    '</svg>'
  ].join('');
  body.appendChild(compass);

  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      body.style.setProperty('--page-progress', String(Math.min(1, Math.max(0, window.scrollY / max))));
    });
  };

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.dataset.sceneVisible = 'true';
          body.dataset.currentScene = entry.target.id;
        });
      }, { rootMargin: '-28% 0px -58% 0px', threshold: 0 })
    : null;

  sections.forEach((section) => observer?.observe(section));
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return () => {
    observer?.disconnect();
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frame);
    compass.remove();
  };
}

function initArtifactCircuit() {
  const cabinet = document.querySelector('.artifact-cabinet');
  if (!cabinet) {
    return null;
  }

  const signal = cabinet.querySelector('[data-artifact-signal]');
  const cards = [...cabinet.querySelectorAll('.artifact-card[data-artifact]')];
  const messages = {
    seal: 'A claim holds after the perfect surface breaks.',
    berry: 'The berry notices. Attention becomes relation.',
    ledger: 'Repair enters the record beside delivery.',
    soil: 'The invisible reserve keeps a future possible.',
    glass: 'Shared light finds a dependable return.'
  };
  let berryTimer = 0;

  const activate = (artifact) => {
    cabinet.dataset.activeArtifact = artifact;
    document.body.dataset.activeArtifact = artifact;
    if (signal) {
      signal.textContent = messages[artifact] || 'Five objects wait for consequence.';
    }
    if (artifact === 'berry') {
      window.clearTimeout(berryTimer);
      cabinet.dataset.berryAwake = 'true';
    }
  };

  const settle = () => {
    delete cabinet.dataset.activeArtifact;
    delete document.body.dataset.activeArtifact;
    if (signal) {
      signal.textContent = 'Five objects wait for consequence.';
    }
    window.clearTimeout(berryTimer);
    berryTimer = window.setTimeout(() => {
      delete cabinet.dataset.berryAwake;
    }, 900);
  };

  cards.forEach((card) => {
    const artifact = card.dataset.artifact;
    card.addEventListener('pointerenter', () => activate(artifact));
    card.addEventListener('focusin', () => activate(artifact));
  });
  cabinet.addEventListener('pointerleave', settle);
  cabinet.addEventListener('focusout', (event) => {
    if (!cabinet.contains(event.relatedTarget)) {
      settle();
    }
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observed) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          cabinet.dataset.circuitDrawn = 'true';
          observed.disconnect();
        }
      }, { rootMargin: '0px 0px -18% 0px', threshold: 0.18 })
    : null;
  observer?.observe(cabinet);
  if (!observer) {
    cabinet.dataset.circuitDrawn = 'true';
  }

  return () => {
    observer?.disconnect();
    window.clearTimeout(berryTimer);
    delete document.body.dataset.activeArtifact;
  };
}

function initMonumentEntrance() {
  if (!document.body || document.body.dataset.surface !== 'monument') {
    return;
  }

  const { announce, destroy: destroyBootstrap } = bootstrapExperience();
  let destroySwUpdate = null;
  registerStoryServiceWorker({
    swPath: '/sw.js',
    scope: '/',
    onRegistered: (registration) => {
      destroySwUpdate = initServiceWorkerUpdate(registration, { announce });
    }
  });
  injectSvgFilters(document);
  enhanceLazyImages({ root: document });
  initStorySpark();
  markCurrentChapterInIndex();
  enhancePrimaryCta();
  renderChamberSeals(document);
  const destroyTrail = initBoofTrail();
  const destroyPresence = initScenePresence();
  const destroyArtifactCircuit = initArtifactCircuit();

  const state = {
    theme: readPref(THEME_KEY, THEMES, document.documentElement.dataset.theme || 'paper'),
    wonder: readPref(WONDER_KEY, WONDERS, document.documentElement.dataset.wonder || 'rich'),
    lighting: readPref(LIGHTING_KEY, LIGHTINGS, document.documentElement.dataset.lighting || 'raking')
  };

  applyClimate(state);
  ensureClimateToggle(state, announce);
  const destroyLighting = initDynamicLighting(state);
  const destroyMenu = initHubMenu({ announce });
  const destroyScrollChrome = initScrollChrome({ mode: 'hub' });
  const destroyTemporal = initHubTemporalClimate();
  const destroySegmentKeys = initSegmentKeyboard(document);
  const destroyPassAlong = initPassAlong({
    title: 'Lore.Land — A Worldbuilding Monument',
    text: 'Enter a seeded world. Chapter One opens at the weighhouse.',
    url: typeof location !== 'undefined' ? `${location.origin}/` : 'https://lore.land/',
    mount: document.querySelector('.hub-hero .hub-actions'),
    label: 'Pass the monument',
    announce
  });

  window.__loreCleanup = () => {
    destroyBootstrap();
    if (destroyLighting) {
      destroyLighting();
    }
    if (destroyMenu) {
      destroyMenu();
    }
    if (destroyScrollChrome) {
      destroyScrollChrome();
    }
    if (destroyTemporal) {
      destroyTemporal();
    }
    if (destroyTrail) {
      destroyTrail();
    }
    if (destroyPresence) {
      destroyPresence();
    }
    if (destroyArtifactCircuit) {
      destroyArtifactCircuit();
    }
    if (destroySegmentKeys) {
      destroySegmentKeys();
    }
    if (destroyPassAlong) {
      destroyPassAlong();
    }
    if (destroySwUpdate) {
      destroySwUpdate();
    }
  };
}

document.addEventListener('DOMContentLoaded', initMonumentEntrance);
