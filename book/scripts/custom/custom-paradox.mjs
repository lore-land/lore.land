// scripts/custom-paradox.mjs
export class CustomParadox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    // Implement paradox-specific interactivity here
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          font-style: italic;
          border: 1px dashed var(--accent-color-main);
          transition: background-color var(--transition-duration) var(--transition-function), border-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(255, 255, 255, 0.2);
          border-color: var(--accent-color-alt);
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
