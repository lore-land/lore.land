import { VALENCE_PENTAD, mapLoadStageToLifecycleState } from './story-lexicon.mjs?v=2026_02_28.H';

export const LOAD_STAGES = Object.freeze([...VALENCE_PENTAD]);

function ensureLifecycleHud(id, skeletonLines) {
  const domId = `load-lifecycle-${id}`;
  const existing = document.getElementById(domId);
  if (existing) {
    return existing;
  }

  const hud = document.createElement('aside');
  hud.id = domId;
  hud.className = 'lifecycle-hud';
  hud.setAttribute('aria-live', 'polite');
  hud.setAttribute('aria-atomic', 'true');

  const title = document.createElement('p');
  title.className = 'lifecycle-title';
  title.textContent = 'loading lifecycle';

  const status = document.createElement('p');
  status.className = 'lifecycle-status';
  status.textContent = 'boon: preloader';

  const preloader = document.createElement('div');
  preloader.className = 'lifecycle-preloader';
  preloader.innerHTML = '<span class="lifecycle-chip">boon</span><span>preloader primed</span>';

  const spinnerWrap = document.createElement('div');
  spinnerWrap.className = 'lifecycle-spinner-wrap';
  spinnerWrap.hidden = true;
  spinnerWrap.innerHTML = '<span class="lifecycle-spinner" aria-hidden="true"></span><span>bane fallback spinner</span>';

  const skeleton = document.createElement('div');
  skeleton.className = 'lifecycle-skeleton';
  skeleton.hidden = true;

  const lines = Math.max(2, skeletonLines);
  for (let i = 0; i < lines; i += 1) {
    const line = document.createElement('span');
    line.style.width = `${90 - (i % 3) * 15}%`;
    skeleton.appendChild(line);
  }

  hud.append(title, status, preloader, spinnerWrap, skeleton);
  document.body.appendChild(hud);
  return hud;
}

function setVisibility(element, visible) {
  if (!element) {
    return;
  }

  element.hidden = !visible;
}

function estimateAcoustics(target) {
  if (!target) {
    return {
      label: 'silent',
      avgWords: 0,
      avgSpacing: 0,
      sampleCount: 0
    };
  }

  const nodes = target.querySelectorAll('h1, h2, h3, p, li, pre, figcaption');
  if (!nodes.length) {
    return {
      label: 'silent',
      avgWords: 0,
      avgSpacing: 0,
      sampleCount: 0
    };
  }

  let totalWords = 0;
  let totalSpacing = 0;

  nodes.forEach((node) => {
    const text = node.textContent ? node.textContent.trim() : '';
    if (text) {
      totalWords += text.split(/\s+/).filter(Boolean).length;
    }

    const computed = window.getComputedStyle(node);
    totalSpacing += parseFloat(computed.marginBottom || '0');
  });

  const avgWords = totalWords / nodes.length;
  const avgSpacing = totalSpacing / nodes.length;

  let label = 'balanced';
  if (avgWords > 26 || avgSpacing < 7) {
    label = 'dense';
  } else if (avgWords < 11 || avgSpacing > 24) {
    label = 'airy';
  }

  return {
    label,
    avgWords,
    avgSpacing,
    sampleCount: nodes.length
  };
}

export function createLoadLifecycle(options = {}) {
  const root = options.root || document.body;
  const shell =
    options.shell ||
    (options.shellSelector ? document.querySelector(options.shellSelector) : null) ||
    document.querySelector('main');
  const spinnerDelayMs = options.spinnerDelayMs ?? 420;
  const hud = ensureLifecycleHud(options.id || 'main', options.skeletonLines || 4);

  const status = hud.querySelector('.lifecycle-status');
  const preloader = hud.querySelector('.lifecycle-preloader');
  const spinnerWrap = hud.querySelector('.lifecycle-spinner-wrap');
  const skeleton = hud.querySelector('.lifecycle-skeleton');

  let baneTimer = null;

  function setStage(stage, detail = '') {
    if (!LOAD_STAGES.includes(stage)) {
      return;
    }

    const lifecycleState = mapLoadStageToLifecycleState(stage);
    root.dataset.loadStage = stage;
    root.dataset.lifecycleState = lifecycleState;
    root.dataset.spwValence = stage;

    if (status) {
      status.textContent = detail ? `${stage}: ${detail}` : stage;
    }

    window.dispatchEvent(
      new CustomEvent('lore:load-stage', {
        detail: {
          stage,
          lifecycleState,
          valence: stage,
          detail
        }
      })
    );
  }

  function clearBaneTimer() {
    if (baneTimer) {
      window.clearTimeout(baneTimer);
      baneTimer = null;
    }
  }

  function boon(detail = 'preloader') {
    root.setAttribute('aria-busy', 'true');
    setStage('boon', detail);
    setVisibility(preloader, true);
    setVisibility(spinnerWrap, false);
    setVisibility(skeleton, false);
  }

  function bane(detail = 'spinner fallback') {
    setStage('bane', detail);
    setVisibility(preloader, true);
    setVisibility(spinnerWrap, true);
    setVisibility(skeleton, false);
  }

  function armBane(detail = 'spinner fallback') {
    clearBaneTimer();
    baneTimer = window.setTimeout(() => {
      if (root.dataset.loadStage !== 'honk') {
        bane(detail);
      }
    }, spinnerDelayMs);
  }

  function bone(detail = 'skeleton loaded') {
    setStage('bone', detail);
    setVisibility(preloader, false);
    setVisibility(spinnerWrap, false);
    setVisibility(skeleton, true);
  }

  function bonk(detail = 'acoustics check', target = shell) {
    const acoustics = estimateAcoustics(target);
    setStage('bonk', `${detail} (${acoustics.label})`);

    if (target) {
      target.dataset.acoustics = acoustics.label;
      target.style.setProperty('--acoustic-spacing', `${acoustics.avgSpacing.toFixed(2)}px`);
    }

    setVisibility(preloader, false);
    setVisibility(spinnerWrap, false);
    setVisibility(skeleton, false);

    return acoustics;
  }

  function honk(detail = 'resolution and harmony') {
    clearBaneTimer();
    setStage('honk', detail);
    setVisibility(preloader, false);
    setVisibility(spinnerWrap, false);
    setVisibility(skeleton, false);
    root.removeAttribute('aria-busy');
  }

  function teardown() {
    clearBaneTimer();
    hud.remove();
    delete root.dataset.loadStage;
    delete root.dataset.lifecycleState;
    delete root.dataset.spwValence;
    root.removeAttribute('aria-busy');
  }

  return {
    boon,
    bane,
    bone,
    bonk,
    honk,
    armBane,
    setStage,
    teardown
  };
}
