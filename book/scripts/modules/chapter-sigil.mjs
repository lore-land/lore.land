import { initSpwLanguageRuntime } from './spw-interactions.mjs?v=2026_07_23.A';
import { el } from './dom.mjs';

function createTemplate(config) {
  const prompt = el('p', { id: 'sigil-prompt', className: 'sigil-prompt', role: 'status', 'aria-live': 'polite', textContent: config.prompts[0] || 'Trace meaning through structure.' });
  const cycleButton = el('button', { type: 'button', className: 'sigil-cycle', textContent: 'reinterpret' });

  const wrapper = el('article', { className: 'sigil-panel', role: 'group', 'aria-label': `${config.title} interpretation panel` },
    el('h3', { textContent: config.title }),
    el('pre', { className: 'sigil-phrase', textContent: config.phrase }),
    el('p', { className: 'sigil-meaning', textContent: config.meaning }),
    prompt,
    el('div', { className: 'sigil-controls' },
      cycleButton,
      el('a', { className: 'sigil-route', href: config.route.href, textContent: config.route.label, 'aria-label': config.route.ariaLabel || config.route.label })
    )
  );

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
      grid-template-columns: minmax(0, 1fr);
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
      overflow-wrap: anywhere;
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

    .spw-chunk {
      border-radius: 4px;
      transition: background-color 140ms ease, color 140ms ease;
    }

    .spw-chunk:hover,
    .spw-chunk:focus-visible {
      background: rgba(157, 228, 255, 0.16);
    }

    .spw-chunk:focus-visible {
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
      grid-template-columns: minmax(0, 1fr);
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

    .spw-register-controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.32rem;
      border: 1px solid rgba(42, 111, 127, 0.28);
      border-radius: 9px;
      padding: 0.4rem;
      background: rgba(255, 255, 255, 0.72);
    }

    .spw-register-label,
    .spw-cube-label,
    .spw-cube-face-label,
    .spw-cube-status {
      margin: 0;
      color: var(--color-text-alt, #45506b);
      font-size: 0.7rem;
      font-family: var(--font-family-heading, monospace);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .spw-handle-mode {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.28rem;
    }

    .spw-handle-mode-button {
      border: 1px solid rgba(42, 111, 127, 0.34);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.84);
      font-size: 0.66rem;
      line-height: 1;
      padding: 0.18rem 0.48rem;
      color: var(--color-accent-alt, #1c4f63);
      font-family: var(--font-family-heading, monospace);
      cursor: pointer;
    }

    .spw-handle-mode-button[aria-pressed="true"] {
      background: rgba(38, 88, 124, 0.16);
      border-color: rgba(38, 88, 124, 0.48);
    }

    .spw-handle-grid,
    .spw-cube-axis {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .spw-handle-button,
    .spw-cube-rotate,
    .spw-cube-entry {
      border: 1px solid rgba(42, 111, 127, 0.34);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.84);
      font-size: 0.68rem;
      line-height: 1.2;
      padding: 0.2rem 0.52rem;
      color: var(--color-accent-alt, #1c4f63);
      font-family: var(--font-family-heading, monospace);
      cursor: pointer;
      text-align: left;
      min-width: 0;
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .spw-handle-button:focus-visible,
    .spw-cube-rotate:focus-visible,
    .spw-cube-entry:focus-visible,
    .spw-handle-mode-button:focus-visible,
    .spw-operator-controls button:focus-visible,
    .spw-geometry-nav button:focus-visible,
    .spw-codelens-link:focus-visible,
    .sigil-cycle:focus-visible,
    .sigil-route:focus-visible {
      outline: 2px solid rgba(112, 70, 161, 0.72);
      outline-offset: 2px;
    }

    .spw-cube-face {
      display: grid;
      gap: 0.24rem;
      grid-template-columns: repeat(auto-fit, minmax(8.2rem, 1fr));
    }

    .spw-cube-empty {
      color: var(--color-text-alt, #45506b);
      font-size: 0.7rem;
      font-style: italic;
    }

    .spw-payload-inspector {
      margin: 0;
      border: 1px solid rgba(42, 111, 127, 0.24);
      border-radius: 8px;
      background: #142036;
      color: #9de4ff;
      font-size: 0.66rem;
      line-height: 1.36;
      padding: 0.4rem;
      max-height: 12rem;
      overflow: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: var(--font-family-mono, monospace);
    }

    /* The Spw runtime injects inspection UI into this shadow root, where the
     * document stylesheets cannot reach. Mirror the light-DOM inspector look
     * (components/interactive.css) so the panel reads as one instrument. */
    .spw-inspection-controls {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.32rem;
      border: 1px solid rgba(42, 111, 127, 0.28);
      border-radius: 9px;
      padding: 0.42rem;
      background: rgba(255, 255, 255, 0.62);
    }

    .spw-inspection-label {
      margin: 0;
      color: var(--color-text-alt, #45506b);
      font-family: var(--font-family-heading, monospace);
      font-size: 0.7rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .spw-codelens-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .spw-codelens-link {
      border: 1px solid rgba(42, 111, 127, 0.34);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      color: var(--color-accent-alt, #1c4f63);
      font-family: var(--font-family-heading, monospace);
      font-size: 0.66rem;
      line-height: 1.2;
      padding: 0.18rem 0.5rem;
      text-decoration: none;
      cursor: pointer;
      overflow-wrap: anywhere;
      min-width: 0;
      max-width: 100%;
    }

    .spw-inlay-hints {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.24rem;
    }

    .spw-inlay-hint {
      border: 1px dashed rgba(42, 111, 127, 0.36);
      border-radius: 999px;
      padding: 0.14rem 0.46rem;
      color: var(--color-text-alt, #45506b);
      font-family: var(--font-family-heading, monospace);
      font-size: 0.64rem;
      background: rgba(255, 255, 255, 0.58);
      overflow-wrap: anywhere;
    }

    .spw-hover-inspector {
      margin: 0;
      max-height: 9.5rem;
      overflow: auto;
      border: 1px solid rgba(42, 111, 127, 0.24);
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.86);
      color: #dffcf0;
      font-size: 0.66rem;
      line-height: 1.34;
      padding: 0.44rem;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: var(--font-family-mono, monospace);
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

  const element = el(config.tagName, { dataset: { spwComponent: config.tagName, spwActionable: 'true' } });
  target.append(element);
  return element;
}
