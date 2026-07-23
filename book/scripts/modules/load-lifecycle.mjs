import { VALENCE_PENTAD, describeLoadStage } from './story-lexicon.mjs?v=2026_02_28.I';
import { el } from './dom.mjs';

export const LOAD_STAGES = Object.freeze([...VALENCE_PENTAD]);

function ensureLifecycleHud(id, skeletonLines) {
  const domId = `load-lifecycle-${id}`;
  const existing = document.getElementById(domId);
  if (existing) {
    return existing;
  }

  const lines = Math.max(2, skeletonLines);
  const skeletonChildren = Array.from({ length: lines }).map((_, i) =>
    el('span', { style: { width: `${90 - (i % 3) * 15}%` } })
  );

  const hud = el('aside', {
    id: domId,
    className: 'lifecycle-hud',
    dataset: { component: 'load-lifecycle', settled: 'false' },
    'aria-live': 'polite',
    'aria-atomic': 'true',
    'aria-label': 'Chapter load status'
  },
    el('p', { className: 'lifecycle-title', textContent: 'Load lifecycle' }),
    el('p', { className: 'lifecycle-status', textContent: 'boon: preloader' }),
    el('div', { className: 'lifecycle-preloader', innerHTML: '<span class="lifecycle-chip">boon</span><span>preloader primed</span>' }),
    el('div', { className: 'lifecycle-spinner-wrap', hidden: true, innerHTML: '<span class="lifecycle-spinner" aria-hidden="true"></span><span>bane fallback spinner</span>' }),
    el('div', { className: 'lifecycle-skeleton', hidden: true }, ...skeletonChildren)
  );

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
      texture: 'still',
      readability: 'neutral',
      avgWords: 0,
      avgSentenceWords: 0,
      avgSpacing: 0,
      avgChars: 0,
      sentenceCount: 0,
      proseCount: 0,
      sampleCount: 0
    };
  }

  const proseNodes = target.querySelectorAll('p, li, blockquote, figcaption, pre');
  const nodes = proseNodes.length
    ? proseNodes
    : target.querySelectorAll('h1, h2, h3, p, li, blockquote, pre, figcaption');
  if (!nodes.length) {
    return {
      label: 'silent',
      texture: 'still',
      readability: 'neutral',
      avgWords: 0,
      avgSentenceWords: 0,
      avgSpacing: 0,
      avgChars: 0,
      sentenceCount: 0,
      proseCount: 0,
      sampleCount: 0
    };
  }

  let totalWords = 0;
  let totalSpacing = 0;
  let totalChars = 0;
  let totalSentences = 0;

  nodes.forEach((node) => {
    const text = node.textContent ? node.textContent.trim() : '';
    if (text) {
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = text
        .split(/[.!?]+/g)
        .map((fragment) => fragment.trim())
        .filter(Boolean).length;
      totalWords += words;
      totalChars += text.length;
      totalSentences += sentences || 1;
    }

    const computed = window.getComputedStyle(node);
    totalSpacing += parseFloat(computed.marginBottom || '0');
  });

  const avgWords = totalWords / nodes.length;
  const avgSpacing = totalSpacing / nodes.length;
  const avgChars = totalChars / nodes.length;
  const avgSentenceWords = totalSentences > 0 ? totalWords / totalSentences : avgWords;

  let label = 'balanced';
  if (avgWords > 30 || avgSpacing < 6.3 || avgSentenceWords > 25 || avgChars > 178) {
    label = 'dense';
  } else if (avgWords < 9 || avgSpacing > 26 || avgSentenceWords < 7.2 || avgChars < 44) {
    label = 'airy';
  }

  let texture = 'lyric';
  if (avgSentenceWords >= 23 || avgChars >= 162) {
    texture = 'epic';
  } else if (avgSentenceWords <= 8 || avgChars <= 48) {
    texture = 'staccato';
  }

  let readability = 'comfortable';
  if (label === 'dense' || avgSpacing < 7.2 || avgSentenceWords > 22) {
    readability = 'tight';
  } else if (label === 'airy' || avgSpacing > 22 || avgSentenceWords < 9) {
    readability = 'open';
  }

  return {
    label,
    texture,
    readability,
    avgWords,
    avgSentenceWords,
    avgSpacing,
    avgChars,
    sentenceCount: totalSentences,
    proseCount: proseNodes.length,
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
  let settleTimer = null;
  const title = hud.querySelector('.lifecycle-title');

  function clearSettleTimer() {
    if (settleTimer) {
      window.clearTimeout(settleTimer);
      settleTimer = null;
    }
  }

  function setStage(stage, detail = '') {
    if (!LOAD_STAGES.includes(stage)) {
      return;
    }

    const descriptor = describeLoadStage(stage);
    const lifecycleState = descriptor.lifecycleState;
    const pipelineStage = descriptor.pipelineStage;
    const precipitateStages = descriptor.precipitates || descriptor.precipitants || [];
    const substrateEvents = descriptor.substrateEvents || [];
    const resonanceTypes = descriptor.resonances || [];
    const stageRole = descriptor.role;
    const settled = stage === 'honk';

    root.dataset.loadStage = stage;
    root.dataset.lifecycleState = lifecycleState;
    root.dataset.spwValence = stage;
    root.dataset.pipelineStage = pipelineStage || '';
    root.dataset.precipitateStages = precipitateStages.join(',');
    root.dataset.precipitantStages = precipitateStages.join(',');
    root.dataset.substrateEvents = substrateEvents.join(',');
    root.dataset.resonanceTypes = resonanceTypes.join(',');
    root.dataset.stageRole = stageRole || '';
    root.dataset.loadSettled = settled ? 'true' : 'false';
    hud.dataset.settled = settled ? 'true' : 'false';
    hud.dataset.stage = stage;
    hud.hidden = false;
    hud.removeAttribute('aria-hidden');

    if (title) {
      title.textContent = settled ? 'Load ready' : 'Load lifecycle';
    }

    if (status) {
      const pipelineToken = pipelineStage ? ` → ${pipelineStage}` : '';
      status.textContent = detail ? `${stage}${pipelineToken}: ${detail}` : `${stage}${pipelineToken}`;
    }

    window.dispatchEvent(
      new CustomEvent('lore:load-stage', {
        detail: {
          stage,
          lifecycleState,
          valence: stage,
          pipelineStage,
          precipitateStages,
          precipitantStages: precipitateStages,
          substrateEvents,
          resonanceTypes,
          role: stageRole,
          detail,
          settled
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
    clearBaneTimer();
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
    setStage('bonk', `${detail} (${acoustics.label}/${acoustics.texture})`);

    if (target) {
      target.dataset.acoustics = acoustics.label;
      target.dataset.acousticTexture = acoustics.texture;
      target.dataset.readabilityBand = acoustics.readability;
      target.style.setProperty('--acoustic-spacing', `${acoustics.avgSpacing.toFixed(2)}px`);
      target.style.setProperty('--acoustic-avg-words', `${acoustics.avgWords.toFixed(2)}`);
      target.style.setProperty('--acoustic-sentence-words', `${acoustics.avgSentenceWords.toFixed(2)}`);
    }

    root.dataset.acoustics = acoustics.label;
    root.dataset.acousticTexture = acoustics.texture;
    root.dataset.readabilityBand = acoustics.readability;
    root.style.setProperty('--acoustic-spacing', `${acoustics.avgSpacing.toFixed(2)}px`);
    root.style.setProperty('--acoustic-avg-words', `${acoustics.avgWords.toFixed(2)}`);
    root.style.setProperty('--acoustic-sentence-words', `${acoustics.avgSentenceWords.toFixed(2)}`);

    document.documentElement.dataset.acoustics = acoustics.label;
    document.documentElement.dataset.acousticTexture = acoustics.texture;
    document.documentElement.dataset.readabilityBand = acoustics.readability;

    window.dispatchEvent(
      new CustomEvent('lore:acoustics-profile', {
        detail: { ...acoustics }
      })
    );

    setVisibility(preloader, false);
    setVisibility(spinnerWrap, false);
    setVisibility(skeleton, false);

    return acoustics;
  }

  function honk(detail = 'resolution and harmony') {
    clearBaneTimer();
    clearSettleTimer();
    setStage('honk', detail);
    setVisibility(preloader, false);
    setVisibility(spinnerWrap, false);
    setVisibility(skeleton, false);
    root.removeAttribute('aria-busy');

    // Leave a brief confirmation, then get out of the reading chrome.
    settleTimer = window.setTimeout(() => {
      hud.dataset.settled = 'true';
      hud.dataset.dismissed = 'true';
      hud.setAttribute('aria-hidden', 'true');
      hud.hidden = true;
    }, 1400);
  }

  function teardown() {
    clearBaneTimer();
    clearSettleTimer();
    hud.remove();
    delete root.dataset.loadStage;
    delete root.dataset.lifecycleState;
    delete root.dataset.spwValence;
    delete root.dataset.pipelineStage;
    delete root.dataset.precipitateStages;
    delete root.dataset.precipitantStages;
    delete root.dataset.substrateEvents;
    delete root.dataset.resonanceTypes;
    delete root.dataset.stageRole;
    delete root.dataset.loadSettled;
    delete root.dataset.acoustics;
    delete root.dataset.acousticTexture;
    delete root.dataset.readabilityBand;
    root.style.removeProperty('--acoustic-spacing');
    root.style.removeProperty('--acoustic-avg-words');
    root.style.removeProperty('--acoustic-sentence-words');
    delete document.documentElement.dataset.acoustics;
    delete document.documentElement.dataset.acousticTexture;
    delete document.documentElement.dataset.readabilityBand;
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
