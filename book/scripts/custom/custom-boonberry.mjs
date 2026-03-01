// scripts/custom-boonberry.mjs
import { attachAdvancedSpwRuntime } from './spw-advanced-runtime.mjs?v=2026_02_28.I';

export class CustomBoonberry extends HTMLElement {
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
          background: rgba(240, 128, 128, 0.2); /* Light coral */
          background: var(--spw-runtime-surface-strong, rgba(240, 128, 128, 0.2));
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background-color: rgba(240, 128, 128, 0.4); /* Darker coral on hover/focus */
          background-color: var(--spw-runtime-surface, rgba(240, 128, 128, 0.4));
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
