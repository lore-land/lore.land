import { chapterHref, spwPrelude } from './data.mjs';
import { createFrameSvg } from './svg.mjs';
import {
  GRAMMAR_PROFILES,
  grammarProfileForChapter,
  buildChapterLogline,
  buildChapterVerse
} from './grammar-profiles.mjs';

function humanizeSetLabel(setId) {
  return `Set ${setId}`;
}

function padChapter(number) {
  return String(number).padStart(2, '0');
}

function chapterImagePath(number) {
  return `/book/images/${padChapter(number)}.png`;
}

export function renderHero(root, chapterCount) {
  const panel = document.createElement('section');
  panel.className = 'hero-panel';
  panel.dataset.reveal = 'enter';
  panel.dataset.component = 'hero-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', 'home-hero-title');

  const eyebrow = document.createElement('p');
  eyebrow.className = 'hero-eyebrow';
  eyebrow.textContent = 'Spw Story Architecture';

  const title = document.createElement('h1');
  title.id = 'home-hero-title';
  title.textContent = 'Lore.Land — 13 Chapters in Spw';

  const subtitle = document.createElement('p');
  subtitle.className = 'hero-subtitle';
  subtitle.textContent =
    'An abstract reading frame where each chapter opens as a compact Spw scene.';

  const stats = document.createElement('p');
  stats.className = 'hero-stats';
  stats.textContent = `${chapterCount} chapters • semantic flow • canonical timeline`;

  const actionRow = document.createElement('div');
  actionRow.className = 'hero-actions';

  const startLink = document.createElement('a');
  startLink.href = chapterHref(1);
  startLink.textContent = '^[route/01]{begin-story}';
  startLink.className = 'hero-action';
  startLink.setAttribute('aria-label', 'Begin story at chapter 01');

  const atlasLink = document.createElement('a');
  atlasLink.href = '/seeds/2026-28-02/';
  atlasLink.textContent = '~[seed-atlas]{discover-motifs}';
  atlasLink.className = 'hero-action';
  atlasLink.setAttribute('aria-label', 'Open Midjourney seed atlas');

  actionRow.append(startLink, atlasLink);

  const prelude = document.createElement('pre');
  prelude.className = 'spw-block';
  prelude.textContent = spwPrelude;

  panel.append(eyebrow, title, subtitle, stats, actionRow, prelude, createFrameSvg());
  root.append(panel);
}

export function renderTimeline(root, chapters, chapterSeeds = new Map()) {
  const section = document.createElement('section');
  section.className = 'chapter-timeline';
  section.dataset.reveal = 'enter';
  section.dataset.component = 'chapter-timeline';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-labelledby', 'chapter-flow-title');

  const heading = document.createElement('h2');
  heading.id = 'chapter-flow-title';
  heading.textContent = 'Chapter Progression';

  const lead = document.createElement('p');
  lead.className = 'timeline-subtitle';
  lead.textContent = 'Each chapter can be themed, swapped, and read as a unique story interface.';

  const grid = document.createElement('div');
  grid.className = 'chapter-grid';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', 'Thirteen chapter story flow');

  chapters.forEach((chapter) => {
    const profile = grammarProfileForChapter(chapter.number);
    const chapterId = padChapter(chapter.number);
    const card = document.createElement('article');
    card.className = 'chapter-card';
    card.setAttribute('role', 'listitem');
    card.dataset.component = 'chapter-card';
    card.dataset.chapter = String(chapter.number);
    card.dataset.grammarProfile = profile.id;
    card.dataset.cadence = profile.cadence;
    card.dataset.reveal = 'enter';

    const marker = document.createElement('span');
    marker.className = 'chapter-marker';
    marker.textContent = String(chapter.number).padStart(2, '0');

    const heading = document.createElement('h3');
    heading.textContent = chapter.title;

    const logline = document.createElement('p');
    logline.className = 'chapter-logline';
    logline.textContent = buildChapterLogline(chapter, profile);

    const register = document.createElement('p');
    register.className = 'chapter-register';
    register.textContent = `${profile.register} register • ${profile.id} syntax`;

    const verse = document.createElement('blockquote');
    verse.className = 'chapter-verse';
    verse.textContent = buildChapterVerse(chapter, profile);

    const snippet = document.createElement('pre');
    snippet.className = 'spw-snippet';
    snippet.textContent = chapter.spw;

    const genericFigure = document.createElement('figure');
    genericFigure.className = 'chapter-default-preview';
    genericFigure.dataset.visualDefault = 'colloquial';

    const genericImage = document.createElement('img');
    genericImage.src = chapterImagePath(chapter.number);
    genericImage.alt = `Colloquial default scene for chapter ${chapter.number}`;
    genericImage.loading = 'lazy';
    genericImage.decoding = 'async';

    const genericCaption = document.createElement('figcaption');
    genericCaption.textContent = 'Colloquial default scene';

    genericFigure.append(genericImage, genericCaption);

    const seed = chapterSeeds.get(chapter.number);
    let motifToggle = null;
    let motifFigure = null;
    if (seed) {
      motifToggle = document.createElement('button');
      motifToggle.type = 'button';
      motifToggle.className = 'chapter-motif-toggle';
      motifToggle.textContent = 'Reveal optional motif';
      motifToggle.setAttribute('aria-expanded', 'false');

      motifFigure = document.createElement('figure');
      motifFigure.className = 'chapter-seed-preview';
      motifFigure.hidden = true;

      const image = document.createElement('img');
      image.src = seed.src;
      image.alt = `${seed.label} optional Midjourney motif for chapter ${chapter.number}`;
      image.loading = 'lazy';
      image.decoding = 'async';

      const caption = document.createElement('figcaption');
      caption.textContent = `${seed.label} • ${humanizeSetLabel(seed.setId)} • optional`;

      motifFigure.append(image, caption);

      motifToggle.addEventListener('click', () => {
        const revealed = motifFigure.hidden;
        motifFigure.hidden = !revealed;
        motifToggle.setAttribute('aria-expanded', revealed ? 'true' : 'false');
        motifToggle.textContent = revealed ? 'Hide optional motif' : 'Reveal optional motif';
        card.dataset.motifState = revealed ? 'revealed' : 'hidden';
      });
    }

    const link = document.createElement('a');
    link.href = chapterHref(chapter.number);
    link.textContent = `^[chapter/${chapterId}]{open}`;
    link.setAttribute('aria-label', `Open chapter ${chapter.number}: ${chapter.title}`);

    if (motifToggle && motifFigure) {
      card.append(marker, heading, logline, register, verse, genericFigure, motifToggle, motifFigure, snippet, link);
    } else {
      card.append(marker, heading, logline, register, verse, genericFigure, snippet, link);
    }
    grid.append(card);
  });

  section.append(heading, lead, grid);
  root.append(section);
}

export function renderGrammarObservatory(root, chapters) {
  const section = document.createElement('section');
  section.id = 'grammar-observatory';
  section.className = 'grammar-observatory';
  section.dataset.component = 'grammar-observatory';
  section.dataset.reveal = 'enter';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-labelledby', 'grammar-observatory-title');

  const heading = document.createElement('h2');
  heading.id = 'grammar-observatory-title';
  heading.textContent = 'Grammar Observatory';

  const lead = document.createElement('p');
  lead.className = 'grammar-observatory-subtitle';
  lead.textContent =
    'Each chapter carries a grammar register that shapes how a reader experiences time, agency, and resolution. Your display preference is stored locally only.';

  const switcher = document.createElement('div');
  switcher.className = 'grammar-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Narrative grammar mode');

  [
    { mode: 'lyric',   label: 'Lyric',   hint: 'logline, verse, and register visible' },
    { mode: 'plain',   label: 'Plain',   hint: 'logline only' },
    { mode: 'orbital', label: 'Orbital', hint: 'verse only, enlarged' }
  ].forEach(({ mode, label, hint }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grammar-mode-button';
    button.dataset.grammarMode = mode;
    button.setAttribute('aria-pressed', mode === 'lyric' ? 'true' : 'false');
    button.title = hint;
    button.textContent = label;
    switcher.append(button);
  });

  const ledger = document.createElement('ul');
  ledger.className = 'grammar-ledger';
  ledger.setAttribute('role', 'list');
  GRAMMAR_PROFILES.forEach((profile) => {
    const item = document.createElement('li');
    item.dataset.grammarProfile = profile.id;
    item.textContent = `${profile.register} — ${profile.description}`;
    ledger.append(item);
  });

  const sample = document.createElement('pre');
  sample.className = 'motif-spw grammar-sample';
  sample.textContent = `^[grammar]{ 
  &[register]{ declarative | interrogative | imperative | exclamatory | conditional }
  ?[mode]{ plain | lyric | orbital }
  ~[cadence]{ measured, searching, percussive, radiant, spiral }
}`;

  const matrix = document.createElement('div');
  matrix.className = 'grammar-matrix';
  matrix.setAttribute('role', 'list');
  matrix.setAttribute('aria-label', 'Chapter grammar facets');

  chapters.slice(0, 9).forEach((chapter, index) => {
    const profile = grammarProfileForChapter(chapter.number);
    const chip = document.createElement('span');
    chip.className = 'grammar-chip';
    chip.setAttribute('role', 'listitem');
    chip.dataset.grammarProfile = profile.id;
    chip.dataset.cadence = profile.cadence;
    chip.dataset.reveal = 'enter';
    chip.style.setProperty('--reveal-delay', `${index * 55}ms`);
    chip.textContent = `${padChapter(chapter.number)} • ${profile.register}`;
    matrix.append(chip);
  });

  section.append(heading, lead, switcher, ledger, sample, matrix);
  root.append(section);
}

export function renderSeedAtlas(root, seedSets, seedManifest, seedDimensions) {
  const section = document.createElement('section');
  section.id = 'seed-atlas';
  section.className = 'seed-atlas';
  section.dataset.component = 'seed-atlas';
  section.dataset.componentVariant = 'grid';
  section.dataset.reveal = 'enter';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-labelledby', 'seed-atlas-title');

  const heading = document.createElement('h2');
  heading.id = 'seed-atlas-title';
  heading.textContent = 'Seed Atlas';

  const lead = document.createElement('p');
  lead.className = 'seed-atlas-subtitle';
  lead.textContent =
    'Midjourney studies become modular narrative ingredients for chapter-specific scene development.';

  const controls = document.createElement('form');
  controls.className = 'seed-controls';
  controls.setAttribute('aria-label', 'Seed atlas controls');
  controls.setAttribute('action', '#');

  const setLabel = document.createElement('label');
  setLabel.setAttribute('for', 'seed-set-select');
  setLabel.innerHTML = '<span>Set</span>';

  const setSelect = document.createElement('select');
  setSelect.id = 'seed-set-select';
  setSelect.name = 'seed-set';
  setSelect.innerHTML = '<option value="all">all sets</option>';

  seedSets.forEach((set) => {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = humanizeSetLabel(set.id);
    setSelect.append(option);
  });

  setLabel.append(setSelect);

  const dimensionLabel = document.createElement('label');
  dimensionLabel.setAttribute('for', 'seed-dimension-select');
  dimensionLabel.innerHTML = '<span>Dimension</span>';

  const dimensionSelect = document.createElement('select');
  dimensionSelect.id = 'seed-dimension-select';
  dimensionSelect.name = 'seed-dimension';
  dimensionSelect.innerHTML = '<option value="all">all dimensions</option>';

  seedDimensions.forEach((dimension) => {
    const option = document.createElement('option');
    option.value = dimension;
    option.textContent = dimension;
    dimensionSelect.append(option);
  });

  dimensionLabel.append(dimensionSelect);

  const randomButton = document.createElement('button');
  randomButton.type = 'button';
  randomButton.id = 'seed-randomize';
  randomButton.className = 'seed-randomize';
  randomButton.textContent = 'Suggest Seed';

  controls.append(setLabel, dimensionLabel, randomButton);

  const reward = document.createElement('p');
  reward.id = 'seed-reward-output';
  reward.className = 'seed-reward-output';
  reward.setAttribute('role', 'status');
  reward.setAttribute('aria-live', 'polite');
  reward.textContent = 'Curate a few motifs. Rewards are deterministic and non-addictive.';

  const grid = document.createElement('div');
  grid.id = 'seed-grid';
  grid.className = 'seed-grid';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', 'Visual seed collection');

  seedManifest.forEach((seed) => {
    const card = document.createElement('article');
    card.className = 'seed-card';
    card.setAttribute('role', 'listitem');
    card.dataset.seedId = seed.id;
    card.dataset.seedSet = seed.setId;
    card.dataset.seedDimension = seed.dimension;
    card.dataset.component = 'seed-card';
    card.dataset.reveal = 'enter';
    card.tabIndex = 0;

    const figure = document.createElement('figure');
    figure.className = 'seed-figure';

    const image = document.createElement('img');
    image.src = seed.src;
    image.alt = seed.alt;
    image.loading = 'lazy';
    image.decoding = 'async';

    const caption = document.createElement('figcaption');
    caption.textContent = `${seed.label} • ${humanizeSetLabel(seed.setId)}`;

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'seed-adopt-button';
    action.dataset.seedId = seed.id;
    action.setAttribute('aria-pressed', 'false');
    action.textContent = 'Adopt motif';

    figure.append(image, caption);
    card.append(figure, action);
    grid.append(card);
  });

  const atlasLink = document.createElement('a');
  atlasLink.href = '/seeds/2026-28-02/';
  atlasLink.className = 'seed-atlas-link';
  atlasLink.textContent = 'Open full Midjourney archive';

  section.append(heading, lead, controls, reward, grid, atlasLink);
  root.append(section);
}
