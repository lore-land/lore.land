import { chapterManifest } from './data.mjs';
import { seedManifest, seedSets, seedDimensions, chapterSeedMap } from './seeds.mjs';
import { renderHero, renderTimeline, renderSeedAtlas } from './ui.mjs';
import { withCacheContext } from '../modules/cache-context.mjs?v=2026_02_28.F';
import { createLoadLifecycle } from '../modules/load-lifecycle.mjs?v=2026_02_28.F';
import {
  bootstrapExperience,
  initSelectPreference,
  initProgressiveReveal,
  enhanceLazyImages,
  registerStoryServiceWorker
} from '../modules/experience-core.mjs?v=2026_02_28.F';
import { initSpwLanguageRuntime } from '../modules/spw-interactions.mjs?v=2026_02_28.F';

const SEED_REWARD_LIMIT = 3;
const SEED_STORAGE_KEY = 'lore.experience.seed-adopted';

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

function initHomepage() {
  const homeRoot = document.getElementById('home-app');
  if (!homeRoot) {
    return;
  }

  const { root, announce } = bootstrapExperience();
  registerStoryServiceWorker({ root, swPath: '/sw.js', scope: '/' });

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
    renderSeedAtlas(homeRoot, seedSets, seedManifest, seedDimensions);

    setMoodStylesheet(announce);
    setupExperienceControls(homeRoot, announce);
    setupTimelineMotifAnnouncements(homeRoot, announce);
    setupSeedAtlasInteractions(announce);
    initSpwLanguageRuntime({ root: homeRoot, announce });

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
