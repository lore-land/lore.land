import { seedManifest, seedSets, seedDimensions } from '../home/seeds.mjs';
import { renderSeedAtlas } from '../home/ui.mjs';
import {
  bootstrapExperience,
  initSelectPreference,
  initAttentionDetails,
  initGenreCombinatorics,
  initSemanticShader,
  initSpatialPerspective,
  initProgressiveReveal,
  enhanceLazyImages,
  registerStoryServiceWorker
} from '../modules/experience-core.mjs?v=2026_02_28.I';

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

  setSelect?.addEventListener('change', applyFilters);
  dimensionSelect?.addEventListener('change', applyFilters);

  randomButton?.addEventListener('click', () => {
    const visibleCards = cards.filter((card) => !card.hidden);
    if (!visibleCards.length) {
      return;
    }

    const candidate = visibleCards[Math.floor(Math.random() * visibleCards.length)];
    candidate.scrollIntoView({ behavior: 'smooth', block: 'center' });
    candidate.focus({ preventScroll: true });

    if (announce) {
      announce(`Suggested motif: ${candidate.dataset.seedDimension || 'seed'}`);
    }
  });

  syncButtons();
  applyFilters();
  updateReward();
}

document.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('seed-app');
  if (!appRoot) {
    return;
  }

  const { root, announce } = bootstrapExperience();
  registerStoryServiceWorker({ root, swPath: '/sw.js', scope: '/' });

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
    target: appRoot,
    datasetKey: 'componentVariant',
    preferenceName: 'layout',
    defaultValue: 'grid',
    announce,
    announceLabel: 'Layout',
    onChange: (value) => {
      document.documentElement.dataset.layout = value;
    }
  });

  renderSeedAtlas(appRoot, seedSets, seedManifest, seedDimensions);
  setupSeedAtlasInteractions(announce);
  initAttentionDetails({ root });
  initSemanticShader({ root });
  initSpatialPerspective({ root });
  initGenreCombinatorics({ root, announce });
  initProgressiveReveal({ root: document });
  enhanceLazyImages({ root: appRoot });
});
