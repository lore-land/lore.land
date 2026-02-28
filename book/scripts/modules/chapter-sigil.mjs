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
