/**
 * copy-climate.mjs — Theme and lighting respond to authored copy hooks.
 *
 * Progressive enhancement:
 * 1. Builder stamps data-tempo / data-tint / data-climate on sections
 * 2. Scroll (IntersectionObserver) promotes the active hook to <html>
 * 3. Interaction (scene open, language mark, focus) can nudge tint briefly
 * 4. Temporal lighting profiles drive CSS variables for field light
 *
 * Story remains primary: without JS, attributes still document intent;
 * without attributes, runtime falls back to chapter mood/period defaults.
 */

/** Temporal lighting profiles — hour-of-story, not wall clock. */
export const TEMPO_PROFILES = Object.freeze({
  night: Object.freeze({
    label: 'night',
    lightX: 22,
    lightY: 18,
    strength: 0.42,
    warmth: 0.18,
    cool: 0.72,
    hue: 228,
    paperMix: 0.22,
    accent: 'night'
  }),
  dawn: Object.freeze({
    label: 'dawn',
    lightX: 78,
    lightY: 14,
    strength: 0.68,
    warmth: 0.62,
    cool: 0.48,
    hue: 38,
    paperMix: 0.12,
    accent: 'gold'
  }),
  morning: Object.freeze({
    label: 'morning',
    lightX: 62,
    lightY: 12,
    strength: 0.74,
    warmth: 0.48,
    cool: 0.38,
    hue: 48,
    paperMix: 0.08,
    accent: 'gold'
  }),
  day: Object.freeze({
    label: 'day',
    lightX: 50,
    lightY: 10,
    strength: 0.7,
    warmth: 0.36,
    cool: 0.32,
    hue: 175,
    paperMix: 0.06,
    accent: 'teal'
  }),
  dusk: Object.freeze({
    label: 'dusk',
    lightX: 28,
    lightY: 28,
    strength: 0.58,
    warmth: 0.34,
    cool: 0.58,
    hue: 255,
    paperMix: 0.16,
    accent: 'archive'
  }),
  sunset: Object.freeze({
    label: 'sunset',
    lightX: 86,
    lightY: 42,
    strength: 0.78,
    warmth: 0.82,
    cool: 0.28,
    hue: 24,
    paperMix: 0.18,
    accent: 'ember'
  }),
  lamplight: Object.freeze({
    label: 'lamplight',
    lightX: 48,
    lightY: 62,
    strength: 0.64,
    warmth: 0.7,
    cool: 0.45,
    hue: 32,
    paperMix: 0.2,
    accent: 'brass'
  })
});

/** Tint tokens map to accent bias (CSS --copy-tint-*). */
export const TINT_PROFILES = Object.freeze({
  gold: Object.freeze({ hue: 42, chroma: 0.55, label: 'gold' }),
  teal: Object.freeze({ hue: 188, chroma: 0.48, label: 'teal' }),
  ember: Object.freeze({ hue: 22, chroma: 0.58, label: 'ember' }),
  archive: Object.freeze({ hue: 258, chroma: 0.36, label: 'archive' }),
  hearth: Object.freeze({ hue: 18, chroma: 0.5, label: 'hearth' }),
  berry: Object.freeze({ hue: 312, chroma: 0.42, label: 'berry' }),
  night: Object.freeze({ hue: 222, chroma: 0.4, label: 'night' }),
  brass: Object.freeze({ hue: 36, chroma: 0.52, label: 'brass' }),
  paper: Object.freeze({ hue: 40, chroma: 0.18, label: 'paper' })
});

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clearClimateDatasets(root, body) {
  if (root) {
    delete root.dataset.copyClimate;
    delete root.dataset.tempo;
    delete root.dataset.copyHook;
    delete root.dataset.tempoTheme;
    delete root.dataset.copyTint;
    delete root.dataset.climateReason;
    delete root.dataset.climatePulse;
  }
  if (body) {
    delete body.dataset.tempo;
    delete body.dataset.copyHook;
  }
}

function applyTempoCssVars(root, profile) {
  root.style.setProperty('--tempo-warmth', String(profile.warmth));
  root.style.setProperty('--tempo-cool', String(profile.cool));
  root.style.setProperty('--tempo-hue', String(profile.hue));
  root.style.setProperty('--tempo-paper-mix', String(profile.paperMix));
}

/**
 * Infer tempo from free text (scene.light, prose snippet, or climate label).
 * @param {string} text
 * @returns {string|null}
 */
export function inferTempo(text) {
  const raw = String(text || '').toLowerCase();
  if (!raw) {
    return null;
  }
  if (/\b(sunset|level amber|emptying to blue)\b/.test(raw)) {
    return 'sunset';
  }
  if (/\b(dusk|twilight|aisles keep|footlight|brass lamp|underlit)\b/.test(raw)) {
    return 'dusk';
  }
  if (/\b(lamplight|single brass|little brass lamp)\b/.test(raw) && !/\bdawn\b/.test(raw)) {
    return 'lamplight';
  }
  if (/\b(mid-morning|full morning|morning bell|shadowless)\b/.test(raw)) {
    return 'morning';
  }
  if (/\b(noon|midday|by noon)\b/.test(raw)) {
    return 'day';
  }
  if (/\b(dawn|first sun|night-cold|slat-light|before the measure)\b/.test(raw)) {
    return 'dawn';
  }
  if (/\b(night|midnight)\b/.test(raw)) {
    return 'night';
  }
  if (/\bamber\b/.test(raw) && /\b(warm|behind|backlight)\b/.test(raw)) {
    return 'sunset';
  }
  return null;
}

/**
 * Infer tint from tempo + text + topic-like hints.
 * @param {{ tempo?: string, text?: string, tint?: string }} input
 * @returns {string}
 */
export function inferTint({ tempo, text, tint } = {}) {
  if (tint && TINT_PROFILES[tint]) {
    return tint;
  }
  const raw = String(text || '').toLowerCase();
  if (/\b(hearth|stove|kitchen)\b/.test(raw)) {
    return 'hearth';
  }
  if (/\b(archive|tax map|aisle|shelf)\b/.test(raw)) {
    return 'archive';
  }
  if (/\b(berry|boonberry|blueberry)\b/.test(raw)) {
    return 'berry';
  }
  if (/\b(brass|seal|scale|ledger)\b/.test(raw)) {
    return 'brass';
  }
  const profile = TEMPO_PROFILES[tempo];
  if (profile?.accent && TINT_PROFILES[profile.accent]) {
    return profile.accent;
  }
  return 'teal';
}

/**
 * Resolve climate from a chapter section object (JSON).
 * Supports:
 *   section.climate = { tempo, tint, hook?, strength? }
 *   section.scene.tempo / section.scene.tint
 *   section.scene.light inference
 *   data-tempo / data-tint passthrough keys
 *
 * @param {Object} section
 * @returns {{ tempo: string, tint: string, hook: string, strength: number, source: string }}
 */
export function resolveSectionClimate(section = {}) {
  const authored = section.climate && typeof section.climate === 'object' ? section.climate : {};
  const scene = section.scene && typeof section.scene === 'object' ? section.scene : {};
  const dataTempo = section['data-tempo'] || section.tempo;
  const dataTint = section['data-tint'] || section.tint;

  const lightText = [scene.light, scene.hint, authored.note].filter(Boolean).join(' ');
  const tempo =
    (authored.tempo && TEMPO_PROFILES[authored.tempo] && authored.tempo) ||
    (scene.tempo && TEMPO_PROFILES[scene.tempo] && scene.tempo) ||
    (dataTempo && TEMPO_PROFILES[dataTempo] && dataTempo) ||
    inferTempo(lightText) ||
    inferTempo(section.title) ||
    'day';

  const tint = inferTint({
    tempo,
    text: lightText,
    tint: authored.tint || scene.tint || dataTint
  });

  const hook = String(
    authored.hook ||
      scene.hook ||
      section.hook ||
      section['data-climate'] ||
      section.title ||
      section.type ||
      'passage'
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  const strength = Number(authored.strength ?? scene.strength ?? 1);
  const source = authored.tempo || scene.tempo || dataTempo
    ? 'authored'
    : lightText && inferTempo(lightText)
      ? 'inferred'
      : 'default';

  return {
    tempo,
    tint,
    hook: hook || 'passage',
    strength: Number.isFinite(strength) ? Math.min(1.4, Math.max(0.4, strength)) : 1,
    source
  };
}

/**
 * Stamp climate data attributes on a built section element.
 * Safe to call with missing climate — uses defaults.
 *
 * @param {HTMLElement} el
 * @param {Object} section - chapter JSON section
 * @returns {{ tempo: string, tint: string, hook: string, strength: number, source: string }}
 */
export function applySectionClimateAttributes(el, section = {}) {
  if (!el) {
    return resolveSectionClimate(section);
  }

  const climate = resolveSectionClimate(section);
  el.dataset.tempo = climate.tempo;
  el.dataset.tint = climate.tint;
  el.dataset.climate = climate.hook;
  el.dataset.climateSource = climate.source;
  el.dataset.climateStrength = String(climate.strength);
  el.setAttribute('data-copy-hook', climate.hook);

  if (section.scene?.light) {
    el.dataset.sceneLight = String(section.scene.light).slice(0, 160);
  }

  return climate;
}

function setLightVars(root, profile, strengthScale = 1) {
  const s = profile.strength * strengthScale;
  root.style.setProperty('--light-x', String(profile.lightX));
  root.style.setProperty('--light-y', String(profile.lightY));
  root.style.setProperty('--light-strength', String(Math.round(s * 100) / 100));
  root.style.setProperty('--copy-climate-strength', String(Math.round(s * 100) / 100));
  applyTempoCssVars(root, profile);
}

function setTintVars(root, tintId) {
  const tint = TINT_PROFILES[tintId] || TINT_PROFILES.teal;
  root.style.setProperty('--copy-tint-hue', String(tint.hue));
  root.style.setProperty('--copy-tint-chroma', String(tint.chroma));
  root.dataset.copyTint = tint.label;
}

/**
 * Activate a climate profile on the document.
 * @param {{ tempo: string, tint: string, hook?: string, strength?: number }} climate
 * @param {{ root?: HTMLElement, reason?: string }} [options]
 */
export function activateClimate(climate, options = {}) {
  const root = options.root || document.documentElement;
  const body = document.body;
  const tempo = climate.tempo && TEMPO_PROFILES[climate.tempo] ? climate.tempo : 'day';
  const tint = climate.tint && TINT_PROFILES[climate.tint] ? climate.tint : 'teal';
  const profile = TEMPO_PROFILES[tempo];
  const strength = Number(climate.strength || 1);

  root.dataset.tempo = tempo;
  root.dataset.copyHook = climate.hook || '';
  body.dataset.tempo = tempo;
  body.dataset.copyHook = climate.hook || '';
  if (options.reason) {
    root.dataset.climateReason = options.reason;
  }

  setLightVars(root, profile, strength);
  setTintVars(root, tint);

  // Soft paper theme bias without fighting user night/ember prefs.
  const userTheme = root.dataset.theme || body.dataset.theme || 'paper';
  if (userTheme !== 'paper' && userTheme) {
    root.dataset.tempoTheme = 'respect-user';
  } else if (tempo === 'night' || tempo === 'dusk') {
    root.dataset.tempoTheme = 'deep';
  } else if (tempo === 'sunset' || tempo === 'lamplight') {
    root.dataset.tempoTheme = 'warm';
  } else if (tempo === 'dawn' || tempo === 'morning') {
    root.dataset.tempoTheme = 'gold';
  } else {
    root.dataset.tempoTheme = 'clear';
  }

  window.dispatchEvent(
    new CustomEvent('lore:copy-climate', {
      detail: {
        tempo,
        tint,
        hook: climate.hook || '',
        strength,
        reason: options.reason || 'activate'
      }
    })
  );
}

/**
 * Map language-exploration theme ids to tints.
 */
const LANG_THEME_TINT = Object.freeze({
  promise: 'brass',
  reward: 'berry',
  audience: 'hearth',
  wonder: 'gold',
  motif: 'teal',
  guide: 'teal',
  voice: 'ember',
  memory: 'archive',
  polarity: 'night',
  provenance: 'brass'
});

/**
 * Initialize scroll + interaction climate for a chapter.
 *
 * @param {{ root?: HTMLElement, announce?: Function, defaultTempo?: string }} [options]
 * @returns {{ destroy: Function, activate: Function } | null}
 */
export function initCopyClimate(options = {}) {
  const root = options.root || document.getElementById('chapter-content');
  const html = document.documentElement;
  if (!root) {
    return null;
  }

  const reduced = prefersReducedMotion();
  html.dataset.copyClimate = reduced ? 'static' : 'live';

  const hooks = [...root.querySelectorAll('[data-tempo], [data-climate], [data-copy-hook]')];
  if (!hooks.length) {
    const tempo =
      options.defaultTempo ||
      (document.body.dataset.mood === 'boon' ? 'dawn' : 'day');
    activateClimate(
      { tempo, tint: 'teal', hook: 'chapter', strength: 0.9 },
      { reason: 'chapter-default' }
    );
    return {
      destroy: () => clearClimateDatasets(html, document.body),
      activate: (c) => activateClimate(c, { reason: 'manual' })
    };
  }

  let activeEl = null;
  let nudgeTimer = 0;
  let scrollFrame = 0;

  const readClimate = (el) => ({
    tempo: el.dataset.tempo || 'day',
    tint: el.dataset.tint || 'teal',
    hook: el.dataset.climate || el.dataset.copyHook || 'passage',
    strength: Number(el.dataset.climateStrength || 1)
  });

  const promote = (el, reason = 'scroll') => {
    if (!el || (el === activeEl && reason === 'scroll')) {
      return;
    }
    if (activeEl) {
      activeEl.dataset.climateActive = 'false';
    }
    activeEl = el;
    el.dataset.climateActive = 'true';
    activateClimate(readClimate(el), { reason });
  };

  // Prefer the section nearest the reading band (upper-middle viewport).
  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visible[0]) {
              promote(visible[0].target, 'scroll');
            }
          },
          {
            root: null,
            rootMargin: '-22% 0px -48% 0px',
            threshold: [0, 0.12, 0.28, 0.45, 0.6]
          }
        )
      : null;

  hooks.forEach((el) => {
    el.dataset.climateActive = 'false';
    observer?.observe(el);
  });

  // Seed first hook
  promote(hooks[0], 'init');

  // Scroll progress still blends strength slightly (dawn→dusk arc within page).
  const onScroll = () => {
    if (scrollFrame) {
      return;
    }
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      html.style.setProperty('--copy-scroll', String(Math.round(progress * 1000) / 1000));
      // Subtle vertical drift of light as the day of the chapter advances with scroll
      if (!reduced && activeEl) {
        const base = TEMPO_PROFILES[activeEl.dataset.tempo] || TEMPO_PROFILES.day;
        const y = base.lightY + progress * 10;
        html.style.setProperty('--light-y', String(Math.round(y * 10) / 10));
        html.style.setProperty(
          '--light-strength',
          String(Math.round((base.strength + progress * 0.06) * 100) / 100)
        );
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Interaction: opening a scene sketch locks that section's climate briefly.
  const onToggle = (event) => {
    const details = event.target.closest?.('details.scene-sketch');
    if (!details || !root.contains(details)) {
      return;
    }
    const host = details.closest('[data-tempo], [data-climate]');
    if (!host) {
      return;
    }
    if (details.open) {
      promote(host, 'scene-open');
      html.dataset.climatePulse = 'scene';
      window.clearTimeout(nudgeTimer);
      nudgeTimer = window.setTimeout(() => {
        delete html.dataset.climatePulse;
      }, reduced ? 0 : 1200);
    }
  };
  root.addEventListener('toggle', onToggle, true);

  // Language marks: thematic tint nudge without replacing tempo.
  const onMark = (event) => {
    const mark = event.target.closest?.('mark.lang-mark');
    if (!mark || !root.contains(mark)) {
      return;
    }
    const theme = mark.dataset.theme || '';
    const tint = LANG_THEME_TINT[theme];
    if (!tint) {
      return;
    }
    setTintVars(html, tint);
    html.dataset.climatePulse = 'lexis';
    window.clearTimeout(nudgeTimer);
    nudgeTimer = window.setTimeout(() => {
      if (activeEl) {
        setTintVars(html, activeEl.dataset.tint || 'teal');
      }
      delete html.dataset.climatePulse;
    }, reduced ? 0 : 900);
  };
  root.addEventListener('focusin', onMark);
  root.addEventListener('pointerover', onMark);

  const destroy = () => {
    observer?.disconnect();
    window.removeEventListener('scroll', onScroll);
    root.removeEventListener('toggle', onToggle, true);
    root.removeEventListener('focusin', onMark);
    root.removeEventListener('pointerover', onMark);
    window.clearTimeout(nudgeTimer);
    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame);
    }
    hooks.forEach((el) => {
      delete el.dataset.climateActive;
    });
    clearClimateDatasets(html, document.body);
  };

  return {
    destroy,
    activate: (climate) => activateClimate(climate, { reason: 'manual' })
  };
}

const HUB_REGION_TEMPO = Object.freeze({
  threshold: 'dawn',
  seedbed: 'morning',
  chambers: 'day',
  grain: 'day',
  theme: 'morning',
  scriptorium: 'lamplight',
  dusk: 'dusk',
  night: 'night'
});

/**
 * Hub-side: map monument regions + scroll to a soft temporal arc.
 * @returns {() => void | null}
 */
export function initHubTemporalClimate() {
  const body = document.body;
  if (!body || body.dataset.surface !== 'monument') {
    return null;
  }

  const html = document.documentElement;
  const reduced = prefersReducedMotion();
  html.dataset.copyClimate = reduced ? 'static' : 'live';

  const regions = [...document.querySelectorAll('[data-climate], [data-tempo], [data-region]')];
  let frame = 0;
  let lastTempo = '';

  const fromScroll = () => {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress < 0.18) return 'dawn';
    if (progress < 0.4) return 'morning';
    if (progress < 0.62) return 'day';
    if (progress < 0.82) return 'dusk';
    return 'sunset';
  };

  const apply = (tempo, reason) => {
    if (!tempo || (tempo === lastTempo && reason !== 'hub-init')) {
      return;
    }
    lastTempo = tempo;
    const profile = TEMPO_PROFILES[tempo] || TEMPO_PROFILES.day;
    const lighting = html.dataset.lighting || body.dataset.lighting || 'raking';
    // live/raking: stamp tempo/tint only; pointer/scroll lighting keeps --light-x/y.
    if (lighting === 'live' || lighting === 'raking') {
      html.dataset.tempo = tempo;
      body.dataset.tempo = tempo;
      html.dataset.copyHook = reason;
      body.dataset.copyHook = reason;
      setTintVars(html, profile.accent);
      applyTempoCssVars(html, profile);
      if (lighting === 'raking') {
        const base = Number(html.style.getPropertyValue('--light-strength') || profile.strength);
        html.style.setProperty(
          '--light-strength',
          String(Math.round(((base + profile.strength) / 2) * 100) / 100)
        );
      }
      return;
    }
    activateClimate(
      { tempo, tint: profile.accent, hook: reason, strength: 1 },
      { reason }
    );
  };

  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            const hit = entries
              .filter((e) => e.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!hit) {
              return;
            }
            const el = hit.target;
            const tempo =
              el.dataset.tempo ||
              HUB_REGION_TEMPO[el.dataset.climate] ||
              HUB_REGION_TEMPO[el.dataset.region] ||
              fromScroll();
            apply(tempo, el.id || el.dataset.region || 'region');
          },
          { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.2, 0.4] }
        )
      : null;

  regions.forEach((el) => {
    if (!el.dataset.tempo) {
      const guess = HUB_REGION_TEMPO[el.dataset.climate] || HUB_REGION_TEMPO[el.dataset.region];
      if (guess) {
        el.dataset.tempo = guess;
      }
    }
    observer?.observe(el);
  });

  const onScroll = () => {
    if (frame) {
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      html.style.setProperty('--copy-scroll', String(Math.round(progress * 1000) / 1000));
      if (!html.dataset.tempo) {
        apply(fromScroll(), 'scroll-arc');
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  apply(fromScroll(), 'hub-init');
  onScroll();

  return () => {
    observer?.disconnect();
    window.removeEventListener('scroll', onScroll);
    if (frame) {
      cancelAnimationFrame(frame);
    }
    clearClimateDatasets(html, body);
  };
}
