/**
 * chapter/panels.mjs — Chapter aside panels & interactive prose spans:
 * trope ledger, tuning profile selector, authorship attribution, lore collector,
 * and custom voice/content element interactions.
 */
import { CUSTOM_ELEMENTS_SELECTOR } from '../modules/story-lexicon.mjs?v=2026_09_26.A';
import { initSelectPreference } from '../modules/experience-core.mjs?v=2026_08_27.A';

/** Humanizes a kebab-case mark value ("ninth-honk" → "ninth honk"). */
export function humanizeMarkValue(value) {
  return String(value).split('-').join(' ');
}

export function setupTropeLedger(announce) {
  const aside = document.querySelector('aside');
  const chapterContent = document.getElementById('chapter-content');
  if (!aside || !chapterContent) {
    return;
  }

  const existing = aside.querySelector('.trope-ledger');
  if (existing) {
    existing.remove();
  }

  const marked = Array.from(chapterContent.querySelectorAll('[data-trope]'));
  if (!marked.length) {
    return;
  }

  const section = document.createElement('section');
  section.className = 'trope-ledger';
  section.dataset.component = 'trope-ledger';
  section.setAttribute('aria-label', 'Trope ledger');

  const heading = document.createElement('h2');
  heading.textContent = 'Trope Ledger';

  const lead = document.createElement('p');
  lead.textContent = 'Sampled tropes in this chapter. Select one to visit its section.';

  const list = document.createElement('ul');
  list.className = 'trope-ledger-list';

  marked.forEach((target) => {
    const value = target.getAttribute('data-trope');
    const human = humanizeMarkValue(value);

    const li = document.createElement('li');
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'trope-ledger-chip mark mark--trope';
    chip.dataset.mark = value;
    chip.textContent = human;
    chip.setAttribute('aria-label', `Scroll to sampled trope: ${human}`);

    chip.addEventListener('click', () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      target.classList.remove('mark-target-flash');
      void target.offsetWidth;
      target.classList.add('mark-target-flash');
      window.setTimeout(() => target.classList.remove('mark-target-flash'), 1600);
      if (announce) {
        announce(`Trope located: ${human}`);
      }
    });

    li.append(chip);
    list.append(li);
  });

  section.append(heading, lead, list);
  aside.append(section);
}

export function setupTuningControls(announce) {
  const aside = document.querySelector('aside');
  if (!aside) {
    return;
  }

  let form = aside.querySelector('.chapter-tuning-controls');
  if (!form) {
    form = document.createElement('form');
    form.className = 'chapter-tuning-controls';
    form.dataset.component = 'chapter-tuning-controls';
    form.setAttribute('aria-label', 'Chapter tuning controls');
    form.setAttribute('action', '#');

    const label = document.createElement('label');
    label.setAttribute('for', 'chapter-tuning-select');

    const span = document.createElement('span');
    span.textContent = 'Tuning';
    label.append(span);

    const select = document.createElement('select');
    select.id = 'chapter-tuning-select';
    select.setAttribute('aria-label', 'Select tuning profile');

    [
      ['calm', 'calm'],
      ['focus', 'focus'],
      ['explore', 'explore']
    ].forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.append(option);
    });

    label.append(select);

    const guide = document.createElement('p');
    guide.className = 'chapter-tuning-guide';
    guide.textContent = 'Calm expands space. Focus balances contrast. Explore increases texture.';

    form.append(label, guide);
    aside.append(form);
  }

  initSelectPreference({
    select: form.querySelector('#chapter-tuning-select'),
    root: document.documentElement,
    datasetKey: 'tuning',
    preferenceName: 'tuning',
    defaultValue: 'focus',
    announce,
    announceLabel: 'Tuning'
  });
}

export function setupAuthorAttribution(announce) {
  const aside = document.querySelector('aside');
  if (!aside) {
    return;
  }

  const existing = aside.querySelector('.story-attribution-panel');
  if (existing) {
    existing.remove();
  }

  const panel = document.createElement('section');
  panel.className = 'story-attribution-panel';
  panel.dataset.component = 'story-attribution';
  panel.setAttribute('aria-label', 'Story authorship and brand links');

  const heading = document.createElement('h2');
  heading.textContent = 'Authorship';

  const summary = document.createElement('p');
  summary.textContent =
    'Lore.Land stories are written by spwashi.com. spwashi.click is the brand toy-links page.';

  const links = document.createElement('div');
  links.className = 'story-attribution-links';

  const author = document.createElement('a');
  author.href = 'https://spwashi.com';
  author.target = '_blank';
  author.rel = 'noopener noreferrer';
  author.dataset.spwExpression = 'true';
  author.textContent = '^[author]{spwashi.com}';
  author.setAttribute('aria-label', 'Open spwashi.com');

  const toys = document.createElement('a');
  toys.href = 'https://spwashi.click';
  toys.target = '_blank';
  toys.rel = 'noopener noreferrer';
  toys.dataset.spwExpression = 'true';
  toys.textContent = '~[toy-links]{spwashi.click}';
  toys.setAttribute('aria-label', 'Open spwashi.click');

  links.append(author, toys);
  panel.append(heading, summary, links);
  aside.append(panel);

  if (announce) {
    announce('Authorship links synced: spwashi.com and spwashi.click.');
  }
}

export function setupLoreCollector(data) {
  const loreCollector = document.getElementById('lore-collector');
  const loreButton = document.getElementById('lore-button');

  if (!loreCollector || !loreButton) {
    console.warn('Lore collector elements not found.');
    return;
  }

  if (data.lore && Array.isArray(data.lore.loreItems)) {
    data.lore.loreItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.description;
      loreCollector.appendChild(li);
    });
  }

  loreButton.addEventListener('click', () => {
    const isExpanded = loreButton.getAttribute('aria-expanded') === 'true';
    loreButton.setAttribute('aria-expanded', String(!isExpanded));
    loreCollector.style.display = isExpanded ? 'none' : 'block';
  });
}

export function setupCustomElementsInteractions() {
  const chapterContent = document.getElementById('chapter-content');
  if (!chapterContent) {
    return;
  }

  chapterContent.querySelectorAll(`${CUSTOM_ELEMENTS_SELECTOR}[data-voice-shape="phrase"]`).forEach((elem) => {
    elem.addEventListener('click', (event) => {
      event.stopPropagation();
      const held = elem.classList.toggle('is-voice-held');
      elem.setAttribute('aria-pressed', String(held));
    });
  });

  const interactiveSpans = chapterContent.querySelectorAll('span[data-content_id]');

  interactiveSpans.forEach((span) => {
    span.addEventListener('click', () => {
      if (!span.classList.contains('played')) {
        span.classList.add('played');
        const textToReveal = span.getAttribute('data-text');
        if (textToReveal) {
          span.textContent = textToReveal;
        }
      }
    });
  });
}
