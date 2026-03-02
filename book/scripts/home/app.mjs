import { chapterManifest } from './data.mjs';
import { seedManifest, seedSets, seedDimensions, chapterSeedMap } from './seeds.mjs';
import { producerStructure } from './producer-structure.mjs';
import { renderHero, renderTimeline, renderSeedAtlas, renderGrammarObservatory, renderProducerConstellation } from './ui.mjs';
import { withCacheContext } from '../modules/cache-context.mjs?v=2026_02_28.I';
import { createLoadLifecycle } from '../modules/load-lifecycle.mjs?v=2026_02_28.I';
import {
  bootstrapExperience,
  initAttentionDetails,
  initGenreCombinatorics,
  initSemanticShader,
  initSpatialPerspective,
  initSelectPreference,
  initProgressiveReveal,
  enhanceLazyImages,
  registerStoryServiceWorker
} from '../modules/experience-core.mjs?v=2026_02_28.I';
import { initSpwLanguageRuntime } from '../modules/spw-interactions.mjs?v=2026_02_28.I';
import { initSpwEthosIntegration } from '../modules/spw-ethos.mjs?v=2026_02_28.I';
import { describeLoadStage } from '../modules/story-lexicon.mjs?v=2026_02_28.I';
import { injectSvgFilters } from '../modules/svg-filters.mjs';

const SEED_REWARD_LIMIT = 3;
const SEED_STORAGE_KEY = 'lore.experience.seed-adopted';
const GRAMMAR_MODE_KEY = 'lore.experience.grammar-mode';

function safeReadAdoptedSeeds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEED_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read seed adoption state:', error);
    return [];
  }
}

function safeWriteAdoptedSeeds(ids) {
  try {
    window.localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.warn('Failed to write seed adoption state:', error);
  }
}

function safeReadGrammarMode() {
  try {
    const mode = window.localStorage.getItem(GRAMMAR_MODE_KEY) || '';
    if (mode === 'plain' || mode === 'lyric' || mode === 'orbital') {
      return mode;
    }
    return 'lyric';
  } catch (error) {
    console.warn('Failed to read grammar mode:', error);
    return 'lyric';
  }
}

function safeWriteGrammarMode(mode) {
  try {
    window.localStorage.setItem(GRAMMAR_MODE_KEY, mode);
  } catch (error) {
    console.warn('Failed to write grammar mode:', error);
  }
}

function setMoodStylesheet(announce) {
  const moodSelect = document.getElementById('mood-select');
  const moodStyles = document.getElementById('mood-styles');

  if (!moodSelect || !moodStyles) {
    return;
  }

  const updateMood = () => {
    const mood = moodSelect.value;
    if (!mood) {
      moodStyles.disabled = true;
      moodStyles.removeAttribute('href');
      document.body.dataset.mood = '';
      return;
    }

    moodStyles.disabled = false;
    moodStyles.href = withCacheContext(`/book/styles/moods/${mood}.css`, {
      channel: `mood-${mood}`
    });
    document.body.dataset.mood = mood;

    if (announce) {
      announce(`Mood changed to ${mood}.`);
    }
  };

  moodSelect.addEventListener('change', updateMood);
  updateMood();
}

function setupExperienceControls(homeRoot, announce) {
  initSelectPreference({
    id: 'theme-select',
    root: document.documentElement,
    datasetKey: 'theme',
    preferenceName: 'theme',
    defaultValue: 'paper',
    announce,
    announceLabel: 'Theme'
  });

  initSelectPreference({
    id: 'dimension-select',
    root: document.documentElement,
    datasetKey: 'dimension',
    preferenceName: 'dimension',
    defaultValue: 'stage',
    announce,
    announceLabel: 'Dimension'
  });

  initSelectPreference({
    id: 'layout-select',
    root: document.documentElement,
    target: homeRoot,
    datasetKey: 'componentVariant',
    preferenceName: 'layout',
    defaultValue: 'grid',
    announce,
    announceLabel: 'Layout',
    onChange: (value) => {
      document.documentElement.dataset.layout = value;
    }
  });
}

function setupGrammarObservatory(homeRoot, announce) {
  const section = homeRoot.querySelector('#grammar-observatory');
  if (!section) {
    return;
  }

  const buttons = [...section.querySelectorAll('.grammar-mode-button[data-grammar-mode]')];
  if (!buttons.length) {
    return;
  }

  const applyMode = (mode, spoken = false) => {
    const targetMode = buttons.some((button) => button.dataset.grammarMode === mode) ? mode : 'lyric';
    document.documentElement.dataset.grammarMode = targetMode;
    section.dataset.grammarMode = targetMode;
    buttons.forEach((button) => {
      const active = button.dataset.grammarMode === targetMode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    safeWriteGrammarMode(targetMode);
    if (spoken && announce) {
      announce(`Grammar mode set to ${targetMode}.`);
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      applyMode(button.dataset.grammarMode || 'lyric', true);
    });
  });

  applyMode(safeReadGrammarMode(), false);
}

function focusChapterSpw(card, announce, sourceLabel = 'runtime') {
  if (!card) {
    return;
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const snippet = card.querySelector('.spw-snippet');
  if (!snippet) {
    return;
  }

  const interactive = snippet.querySelector('.spw-chunk, .spw-token');
  if (interactive instanceof HTMLElement) {
    interactive.click();
    interactive.focus({ preventScroll: true });
  } else if (snippet instanceof HTMLElement) {
    snippet.focus({ preventScroll: true });
  }

  if (announce) {
    const chapterId = String(card.dataset.chapter || '').padStart(2, '0');
    announce(`Spw runtime focus synced to chapter ${chapterId} via ${sourceLabel}.`);
  }
}

function setupSpwRuntimeIntegration(homeRoot, announce) {
  const observatory = homeRoot.querySelector('#grammar-observatory');
  if (!observatory) {
    return;
  }

  const DEFAULT_SELECTION_STATUS =
    'Runtime bridge: select any Spw token or chapter grammar chip to sync focus.';
  const runtimeStatus = observatory.querySelector('#grammar-runtime-status');
  const chips = [...observatory.querySelectorAll('.grammar-chip[data-chapter]')];
  const cards = [...homeRoot.querySelectorAll('.chapter-card[data-chapter]')];
  let selectionStatus = DEFAULT_SELECTION_STATUS;
  let stageStatus = '';

  const updateRuntimeStatus = (text) => {
    if (runtimeStatus) {
      runtimeStatus.textContent = text;
    }
  };

  const renderRuntimeStatus = () => {
    if (selectionStatus && stageStatus) {
      updateRuntimeStatus(`${selectionStatus} | ${stageStatus}`);
      return;
    }
    updateRuntimeStatus(selectionStatus || stageStatus || DEFAULT_SELECTION_STATUS);
  };

  const syncActiveHandle = (handle) => {
    const token = String(handle || '').trim();
    chips.forEach((chip) => {
      const active = token && (chip.dataset.spwHandle || '').includes(token);
      chip.dataset.runtimeActive = active ? 'true' : 'false';
    });

    cards.forEach((card) => {
      const snippet = card.querySelector('.spw-snippet');
      const source = snippet?.dataset.spwSource || snippet?.textContent || '';
      const active = token && source.includes(token);
      card.dataset.runtimeActive = active ? 'true' : 'false';
    });
  };

  const applyLoadStage = (stage, detail = '') => {
    const token = String(stage || '').trim();
    if (!token) {
      return;
    }

    const descriptor = describeLoadStage(token);
    const pipelineStage = descriptor.pipelineStage || 'fallback';
    const precipitateStages = descriptor.precipitates || descriptor.precipitants || [];
    const precipitateText = precipitateStages.length
      ? precipitateStages.join(' + ')
      : 'none';

    observatory.dataset.loadStage = token;
    observatory.dataset.pipelineStage = pipelineStage;
    observatory.dataset.precipitateStages = precipitateStages.join(',');
    observatory.dataset.precipitantStages = precipitateStages.join(',');

    const detailSuffix = detail ? ` (${detail})` : '';
    stageStatus = `Lifecycle: ${token} -> ${pipelineStage} -> ${precipitateText}${detailSuffix}.`;
    renderRuntimeStatus();
  };

  observatory.addEventListener('click', (event) => {
    const chip = event.target.closest('.grammar-chip[data-chapter]');
    if (!chip) {
      return;
    }
    const chapter = Number(chip.dataset.chapter || '0');
    if (!chapter) {
      return;
    }
    const card = homeRoot.querySelector(`.chapter-card[data-chapter="${chapter}"]`);
    focusChapterSpw(card, announce, 'grammar-chip');
  });

  homeRoot.addEventListener('click', (event) => {
    const lens = event.target.closest('[data-spw-lens]');
    if (!lens) {
      return;
    }
    const card = lens.closest('.chapter-card[data-chapter]');
    focusChapterSpw(card, announce, lens.dataset.spwLens || 'chapter-lens');
  });

  homeRoot.addEventListener('keydown', (event) => {
    const lens = event.target.closest('[data-spw-lens]');
    if (!lens) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const card = lens.closest('.chapter-card[data-chapter]');
      focusChapterSpw(card, announce, lens.dataset.spwLens || 'chapter-lens');
    }
  });

  window.addEventListener('lore:spw-selection', (event) => {
    const detail = event.detail || {};
    const handle = detail.handle || '';
    const contextOrigin = detail.payload?.context?.origin || 'selection';
    if (handle) {
      selectionStatus = `Runtime bridge: ${handle} selected via ${contextOrigin}.`;
      renderRuntimeStatus();
      syncActiveHandle(handle);
    }
  });

  window.addEventListener('lore:load-stage', (event) => {
    const detail = event.detail || {};
    applyLoadStage(detail.stage || '', detail.detail || '');
  });

  const initialStage = document.body.dataset.loadStage || document.documentElement.dataset.loadStage || '';
  if (initialStage) {
    applyLoadStage(initialStage);
  } else {
    renderRuntimeStatus();
  }
}

function setupTimelineMotifAnnouncements(homeRoot, announce) {
  if (!homeRoot) {
    return;
  }

  homeRoot.addEventListener('click', (event) => {
    const button = event.target.closest('.chapter-motif-toggle');
    if (!button) {
      return;
    }

    const card = button.closest('.chapter-card');
    const chapter = card ? String(card.dataset.chapter || '').padStart(2, '0') : '';
    const expanded = button.getAttribute('aria-expanded') === 'true';

    if (announce) {
      announce(
        expanded
          ? `Optional motif revealed for chapter ${chapter}.`
          : `Optional motif hidden for chapter ${chapter}.`
      );
    }
  });
}

function summarizeReward(count) {
  if (count <= 0) {
    return 'Curate a few motifs. Rewards are deterministic and non-addictive.';
  }

  if (count === 1) {
    return 'Reward: first motif anchored. You have 1 of 3 development signals.';
  }

  if (count === 2) {
    return 'Reward: second motif anchored. You have 2 of 3 development signals.';
  }

  return 'Reward: motif triad complete. Development state is harmonized.';
}

function setupSeedAtlasInteractions(announce) {
  const section = document.getElementById('seed-atlas');
  if (!section) {
    return;
  }

  const setSelect = document.getElementById('seed-set-select');
  const dimensionSelect = document.getElementById('seed-dimension-select');
  const randomButton = document.getElementById('seed-randomize');
  const rewardOutput = document.getElementById('seed-reward-output');
  const cards = [...section.querySelectorAll('.seed-card')];
  const buttons = [...section.querySelectorAll('.seed-adopt-button')];

  const adopted = new Set(safeReadAdoptedSeeds());

  const updateReward = () => {
    const adoptedCount = Math.min(SEED_REWARD_LIMIT, adopted.size);
    if (rewardOutput) {
      rewardOutput.textContent = summarizeReward(adoptedCount);
    }
    section.dataset.rewardCount = String(adoptedCount);
  };

  const syncButtons = () => {
    buttons.forEach((button) => {
      const isAdopted = adopted.has(button.dataset.seedId);
      button.setAttribute('aria-pressed', isAdopted ? 'true' : 'false');
      button.textContent = isAdopted ? 'Motif adopted' : 'Adopt motif';
    });
  };

  const applyFilters = () => {
    const setValue = setSelect ? setSelect.value : 'all';
    const dimensionValue = dimensionSelect ? dimensionSelect.value : 'all';

    cards.forEach((card) => {
      const setMatches = setValue === 'all' || card.dataset.seedSet === setValue;
      const dimensionMatches = dimensionValue === 'all' || card.dataset.seedDimension === dimensionValue;
      const visible = setMatches && dimensionMatches;
      card.hidden = !visible;
      card.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const seedId = button.dataset.seedId;
      if (!seedId) {
        return;
      }

      if (adopted.has(seedId)) {
        adopted.delete(seedId);
      } else if (adopted.size < SEED_REWARD_LIMIT) {
        adopted.add(seedId);
      } else if (announce) {
        announce('Motif triad already complete. Swap one adopted motif to choose another.');
      }

      safeWriteAdoptedSeeds([...adopted]);
      syncButtons();
      updateReward();
    });
  });

  if (setSelect) {
    setSelect.addEventListener('change', () => {
      applyFilters();
      if (announce) {
        announce(`Seed set filter: ${setSelect.value}`);
      }
    });
  }

  if (dimensionSelect) {
    dimensionSelect.addEventListener('change', () => {
      applyFilters();
      if (announce) {
        announce(`Seed dimension filter: ${dimensionSelect.value}`);
      }
    });
  }

  if (randomButton) {
    randomButton.addEventListener('click', () => {
      const visibleCards = cards.filter((card) => !card.hidden);
      if (!visibleCards.length) {
        return;
      }

      const candidate = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      candidate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      candidate.focus({ preventScroll: true });

      const dimension = candidate.dataset.seedDimension || 'seed';
      if (announce) {
        announce(`Suggested motif: ${dimension}`);
      }
    });
  }

  syncButtons();
  applyFilters();
  updateReward();
}

function setupProducerConstellation(homeRoot, announce) {
  const section = homeRoot.querySelector('#producer-constellation');
  if (!section) {
    return;
  }

  const clusterSelect = section.querySelector('#producer-cluster-select');
  const suggestButton = section.querySelector('#producer-slot-suggest');
  const statusOutput = section.querySelector('#producer-slot-status');
  const slotButtons = [...section.querySelectorAll('.producer-slot-button')];
  const clusterCards = [...section.querySelectorAll('.producer-cluster-card[data-cluster]')];
  const clusterLabelById = new Map(clusterCards.map((card) => {
    const clusterId = card.dataset.cluster || '';
    const clusterLabel = card.querySelector('h4')?.textContent || clusterId || 'cluster';
    return [clusterId, clusterLabel];
  }));

  const setStatus = (text) => {
    if (statusOutput) {
      statusOutput.textContent = text;
    }
  };

  const applyClusterFilter = (clusterId, spoken = false) => {
    const selected = clusterId || 'all';
    const clusterLabel = selected === 'all' ? 'all clusters' : (clusterLabelById.get(selected) || selected);
    section.dataset.clusterFilter = selected;

    slotButtons.forEach((slot) => {
      const visible = selected === 'all' || slot.dataset.cluster === selected;
      slot.hidden = !visible;
      slot.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });

    clusterCards.forEach((card) => {
      const active = selected === 'all' || card.dataset.cluster === selected;
      card.dataset.active = active ? 'true' : 'false';
      card.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    setStatus(
      selected === 'all'
        ? 'Structure view: all domain slots available.'
        : `Structure view: ${clusterLabel} slots filtered.`
    );

    if (spoken && announce) {
      announce(
        selected === 'all'
          ? 'Producer structure filter cleared.'
          : `Producer structure filtered to ${clusterLabel}.`
      );
    }
  };

  if (clusterSelect) {
    clusterSelect.addEventListener('change', () => {
      applyClusterFilter(clusterSelect.value || 'all', true);
    });
  }

  clusterCards.forEach((card) => {
    const selectCard = () => {
      const clusterId = card.dataset.cluster || 'all';
      if (clusterSelect) {
        clusterSelect.value = clusterId;
      }
      applyClusterFilter(clusterId, true);
    };

    card.addEventListener('click', selectCard);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCard();
      }
    });
  });

  slotButtons.forEach((slot) => {
    slot.addEventListener('click', () => {
      const slotId = slot.dataset.slotId || '';
      const clusterId = slot.dataset.cluster || '';
      section.dataset.activeSlot = slotId;
      const clusterLabel = clusterLabelById.get(clusterId) || clusterId;
      slotButtons.forEach((item) => item.setAttribute('aria-pressed', item === slot ? 'true' : 'false'));
      setStatus(`Slot selected: ${slotId} in ${clusterLabel}. Map concrete naming by context.`);
      if (announce) {
        announce(`Producer slot selected: ${slotId}.`);
      }
    });
  });

  if (suggestButton) {
    suggestButton.addEventListener('click', () => {
      const visible = slotButtons.filter((slot) => !slot.hidden);
      if (!visible.length) {
        setStatus('No slots visible for this filter.');
        return;
      }
      const pick = visible[Math.floor(Math.random() * visible.length)];
      pick.focus({ preventScroll: true });
      pick.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      pick.click();
    });
  }

  applyClusterFilter('all', false);
}

function initHomepage() {
  const homeRoot = document.getElementById('home-app');
  if (!homeRoot) {
    return;
  }

  const { root, announce } = bootstrapExperience();
  registerStoryServiceWorker({ root, swPath: '/sw.js', scope: '/' });
  injectSvgFilters(document);

  const lifecycle = createLoadLifecycle({
    id: 'home',
    shell: homeRoot,
    spinnerDelayMs: 320,
    skeletonLines: 5
  });

  lifecycle.boon('preloader engaged');
  lifecycle.armBane('spinner + fallback');

  try {
    lifecycle.bone('skeletons loaded');
    renderHero(homeRoot, chapterManifest.length);
    renderTimeline(homeRoot, chapterManifest, chapterSeedMap(chapterManifest.length, '01'));
    renderProducerConstellation(homeRoot, producerStructure);
    renderSeedAtlas(homeRoot, seedSets, seedManifest, seedDimensions);
    renderGrammarObservatory(homeRoot, chapterManifest);
    initSpwEthosIntegration({ context: 'home', container: homeRoot, root: document, announce });

    setMoodStylesheet(announce);
    setupExperienceControls(homeRoot, announce);
    setupGrammarObservatory(homeRoot, announce);
    setupProducerConstellation(homeRoot, announce);
    setupTimelineMotifAnnouncements(homeRoot, announce);
    setupSeedAtlasInteractions(announce);
    initSpwLanguageRuntime({ root: homeRoot, announce });
    setupSpwRuntimeIntegration(homeRoot, announce);
    initAttentionDetails({ root });
    initSemanticShader({ root });
    initSpatialPerspective({ root });
    initGenreCombinatorics({ root, announce });

    initProgressiveReveal({ root: document });
    enhanceLazyImages({ root: homeRoot });

    const acoustics = lifecycle.bonk('acoustics + spacing check', homeRoot);
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);
  } catch (error) {
    lifecycle.bane('render fallback engaged');
    console.error('Home render lifecycle failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', initHomepage);
