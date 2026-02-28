import { initSpwLanguageRuntime } from './spw-interactions.mjs?v=2026_02_28.F';

function createTemplate(config) {
  const wrapper = document.createElement('article');
  wrapper.className = 'sigil-panel';
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-label', `${config.title} interpretation panel`);

  const heading = document.createElement('h3');
  heading.textContent = config.title;

  const phrase = document.createElement('pre');
  phrase.className = 'sigil-phrase';
  phrase.textContent = config.phrase;

  const meaning = document.createElement('p');
  meaning.className = 'sigil-meaning';
  meaning.textContent = config.meaning;

  const prompt = document.createElement('p');
  prompt.id = 'sigil-prompt';
  prompt.className = 'sigil-prompt';
  prompt.setAttribute('role', 'status');
  prompt.setAttribute('aria-live', 'polite');
  prompt.textContent = config.prompts[0] || 'Trace meaning through structure.';

  const controls = document.createElement('div');
  controls.className = 'sigil-controls';

  const cycleButton = document.createElement('button');
  cycleButton.type = 'button';
  cycleButton.className = 'sigil-cycle';
  cycleButton.textContent = 'reinterpret';

  const route = document.createElement('a');
  route.className = 'sigil-route';
  route.href = config.route.href;
  route.textContent = config.route.label;
  route.setAttribute('aria-label', config.route.ariaLabel || config.route.label);

  controls.append(cycleButton, route);
  wrapper.append(heading, phrase, meaning, prompt, controls);

  const style = document.createElement('style');
  style.textContent = `
    :host {
      display: block;
      margin-top: 0.55rem;
      font-family: var(--font-family-body, Georgia, serif);
      color: var(--color-text-main, #1a2233);
    }

    .sigil-panel {
      border: 1px solid rgba(42, 111, 127, 0.3);
      border-radius: 10px;
      padding: 0.7rem;
      background: rgba(255, 255, 255, 0.76);
      display: grid;
      gap: 0.45rem;
    }

    h3 {
      margin: 0;
      font-family: var(--font-family-heading, monospace);
      font-size: 0.92rem;
      letter-spacing: 0.04em;
    }

    .sigil-phrase {
      margin: 0;
      border-radius: 8px;
      border: 1px solid rgba(42, 111, 127, 0.24);
      background: #142036;
      color: #9de4ff;
      padding: 0.48rem;
      font-size: 0.76rem;
      line-height: 1.4;
      white-space: pre-wrap;
      font-family: var(--font-family-mono, monospace);
    }

    .sigil-meaning,
    .sigil-prompt {
      margin: 0;
      font-size: 0.84rem;
      color: var(--color-text-alt, #45506b);
    }

    .sigil-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.42rem;
      align-items: center;
    }

    .sigil-cycle,
    .sigil-route {
      border: 1px solid rgba(42, 111, 127, 0.34);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      text-decoration: none;
      font-size: 0.76rem;
      line-height: 1;
      padding: 0.28rem 0.62rem;
      color: var(--color-accent-alt, #1c4f63);
      font-family: var(--font-family-heading, monospace);
      cursor: pointer;
    }

    .spw-token {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0.68em;
      border-radius: 4px;
      transition: background-color 140ms ease, color 140ms ease;
    }

    .spw-token:focus-visible {
      outline: 2px solid rgba(112, 70, 161, 0.72);
      outline-offset: 1px;
    }

    .spw-brace,
    .spw-operator {
      cursor: pointer;
    }

    .spw-brace.is-active {
      background: rgba(157, 228, 255, 0.3);
      color: #e6f8ff;
    }

    .spw-operator {
      color: #e7a4ff;
    }

    .spw-operator:hover,
    .spw-operator:focus-visible {
      background: rgba(231, 164, 255, 0.22);
    }

    .spw-language-controls {
      display: grid;
      gap: 0.34rem;
    }

    .spw-operator-controls,
    .spw-geometry-nav {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .spw-operator-controls button,
    .spw-geometry-nav button {
      border: 1px solid rgba(42, 111, 127, 0.34);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      font-size: 0.7rem;
      line-height: 1;
      padding: 0.2rem 0.54rem;
      color: var(--color-accent-alt, #1c4f63);
      font-family: var(--font-family-heading, monospace);
      cursor: pointer;
    }

    .spw-geometry-label,
    .spw-operator-label,
    .spw-geometry-status {
      margin: 0;
      color: var(--color-text-alt, #45506b);
      font-size: 0.72rem;
      font-family: var(--font-family-heading, monospace);
    }
  `;

  return { style, wrapper, cycleButton, prompt };
}

export function registerChapterSigil(config, target = document.querySelector('aside')) {
  if (!config || !config.tagName) {
    return null;
  }

  if (!customElements.get(config.tagName)) {
    class ChapterSigilElement extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) {
          return;
        }

        const shadow = this.attachShadow({ mode: 'open' });
        const prompts = Array.isArray(config.prompts) && config.prompts.length
          ? config.prompts
          : ['Trace meaning through structure.'];

        const { style, wrapper, cycleButton, prompt } = createTemplate(config);
        let promptIndex = 0;

        cycleButton.addEventListener('click', () => {
          promptIndex = (promptIndex + 1) % prompts.length;
          prompt.textContent = prompts[promptIndex];
        });

        shadow.append(style, wrapper);
        initSpwLanguageRuntime({ root: shadow });
      }
    }

    customElements.define(config.tagName, ChapterSigilElement);
  }

  if (!target) {
    return null;
  }

  const existing = target.querySelector(config.tagName);
  if (existing) {
    return existing;
  }

  const element = document.createElement(config.tagName);
  element.dataset.spwComponent = config.tagName;
  element.dataset.spwActionable = 'true';
  target.append(element);
  return element;
}
