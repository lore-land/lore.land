// scripts/custom-game.mjs
import { attachAdvancedSpwRuntime } from './spw-advanced-runtime.mjs?v=2026_02_28.I';

export class CustomGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.releaseSpwRuntime = null;
    this.render();
  }

  connectedCallback() {
    if (this.releaseSpwRuntime) {
      this.releaseSpwRuntime();
    }
    this.releaseSpwRuntime = attachAdvancedSpwRuntime(this);
  }

  disconnectedCallback() {
    if (this.releaseSpwRuntime) {
      this.releaseSpwRuntime();
      this.releaseSpwRuntime = null;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          background: rgba(100, 200, 255, 0.2);
          background: var(--spw-runtime-surface-strong, rgba(100, 200, 255, 0.2));
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          font-style: italic;
          border: 1px solid rgba(100, 150, 255, 0.5);
          border-color: var(--spw-runtime-outline, rgba(100, 150, 255, 0.5));
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(100, 200, 255, 0.4);
          background: var(--spw-runtime-surface, rgba(100, 200, 255, 0.4));
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
