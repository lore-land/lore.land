// scripts/custom-game.mjs
export class CustomGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    // Implement game-specific interactivity here
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          background: rgba(100, 200, 255, 0.2);
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          font-style: italic;
          border: 1px solid rgba(100, 150, 255, 0.5);
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(100, 200, 255, 0.4);
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
