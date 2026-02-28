import { chapterManifest } from './data.mjs';
import { renderHero, renderTimeline } from './ui.mjs';

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
    moodStyles.href = `/book/styles/moods/${mood}.css`;
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

  renderHero(homeRoot, chapterManifest.length);
  renderTimeline(homeRoot, chapterManifest);
  setMoodStylesheet();
}

document.addEventListener('DOMContentLoaded', initHomepage);
