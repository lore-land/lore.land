// scripts/custom-echo.mjs
import { attachAdvancedSpwRuntime } from './spw-advanced-runtime.mjs?v=2026_02_28.I';

export class CustomEcho extends HTMLElement {
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
          display: block;
          padding: var(--padding-large);
          border-radius: var(--border-radius-main);
          margin-bottom: var(--margin-large);
          background: rgba(255, 255, 0, 0.1);
          background: var(--spw-runtime-surface-strong, rgba(255, 255, 0, 0.1));
          font-style: italic;
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(255, 255, 0, 0.2);
          background: var(--spw-runtime-surface, rgba(255, 255, 0, 0.2));
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
