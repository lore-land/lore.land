const STORAGE_KEY = 'lore.chapter.progress.v1';

const CHAPTER_MODES = Object.freeze([
  'dawn',
  'echo',
  'signal',
  'council',
  'rift',
  'lantern',
  'oath',
  'song',
  'relic',
  'resonance',
  'paradox',
  'confluence',
  'canon'
]);

const CHAPTER_REWARDS = Object.freeze([
  'Glyph of Dawn',
  'Resonant Echo',
  'Signal Compass',
  'Council Thread',
  'Rift Lantern',
  'City Pulse',
  'Oath Ribbon',
  'Song Current',
  'Relic Spark',
  'Bone Resonator',
  'Paradox Bloom',
  'Confluence Seal',
  'Canon Loop'
]);

function loadProgress() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      rewards: parsed.rewards && typeof parsed.rewards === 'object' ? parsed.rewards : {}
    };
  } catch (error) {
    console.warn('Failed to read chapter progress:', error);
    return {
      visited: [],
      rewards: {}
    };
  }
}

function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Failed to save chapter progress:', error);
  }
}

function chapterMode(chapterNumber) {
  return CHAPTER_MODES[(chapterNumber - 1) % CHAPTER_MODES.length];
}

function rewardForChapter(chapterNumber) {
  return CHAPTER_REWARDS[(chapterNumber - 1) % CHAPTER_REWARDS.length];
}

export function initChapterProgression(chapterData, options = {}) {
  const chapterNumber = chapterData.chapterNumber;
  if (!chapterNumber) {
    return null;
  }

  const progress = loadProgress();
  const chapterKey = String(chapterNumber);
  const firstVisit = !progress.visited.includes(chapterKey);

  if (firstVisit) {
    progress.visited.push(chapterKey);
    progress.visited.sort((a, b) => Number(a) - Number(b));
  }

  if (!progress.rewards[chapterKey]) {
    progress.rewards[chapterKey] = rewardForChapter(chapterNumber);
  }

  saveProgress(progress);

  const mode = chapterMode(chapterNumber);
  document.documentElement.dataset.chapterMode = mode;
  document.body.dataset.chapterMode = mode;

  const aside = options.aside || document.querySelector('aside');
  if (aside) {
    const panel = document.createElement('section');
    panel.className = 'chapter-progress-panel';
    panel.dataset.component = 'chapter-progress';
    panel.setAttribute('aria-label', 'Chapter progression');

    const heading = document.createElement('h2');
    heading.textContent = 'Story Development';

    const summary = document.createElement('p');
    const total = CHAPTER_MODES.length;
    summary.textContent = `${progress.visited.length} of ${total} chapters explored.`;

    const progressBar = document.createElement('progress');
    progressBar.max = total;
    progressBar.value = progress.visited.length;
    progressBar.setAttribute('aria-label', 'Story progression meter');

    const reward = document.createElement('p');
    reward.className = 'chapter-reward';
    reward.textContent = `Reward: ${progress.rewards[chapterKey]}.`;

    const modeText = document.createElement('p');
    modeText.className = 'chapter-mode';
    modeText.textContent = `Chapter mode: ${mode}`;

    panel.append(heading, summary, progressBar, reward, modeText);

    const existing = aside.querySelector('.chapter-progress-panel');
    if (existing) {
      existing.replaceWith(panel);
    } else {
      aside.prepend(panel);
    }
  }

  if (options.announce) {
    options.announce(
      firstVisit
        ? `Chapter ${chapterNumber} unlocked: ${progress.rewards[chapterKey]}`
        : `Chapter ${chapterNumber} revisited in ${mode} mode`
    );
  }

  return {
    chapterNumber,
    mode,
    reward: progress.rewards[chapterKey],
    visitedCount: progress.visited.length,
    firstVisit
  };
}
