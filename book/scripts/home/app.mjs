import { chapterManifest } from './data.mjs';
import { renderHero, renderTimeline } from './ui.mjs';
import { withCacheContext } from '../modules/cache-context.mjs?v=2026_02_28.C';
import { createLoadLifecycle } from '../modules/load-lifecycle.mjs?v=2026_02_28.C';

function setMoodStylesheet() {
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
  };

  moodSelect.addEventListener('change', updateMood);
  updateMood();
}

function initHomepage() {
  const homeRoot = document.getElementById('home-app');
  if (!homeRoot) {
    return;
  }

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
    renderTimeline(homeRoot, chapterManifest);
    setMoodStylesheet();
    const acoustics = lifecycle.bonk('acoustics + spacing check', homeRoot);
    lifecycle.honk(`resolution + harmony (${acoustics.label})`);
  } catch (error) {
    lifecycle.bane('render fallback engaged');
    console.error('Home render lifecycle failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', initHomepage);
