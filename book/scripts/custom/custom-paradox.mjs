// scripts/custom-paradox.mjs
import { attachAdvancedSpwRuntime } from './spw-advanced-runtime.mjs?v=2026_02_28.I';

export class CustomParadox extends HTMLElement {
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
          background: rgba(255, 255, 255, 0.1);
          background: var(--spw-runtime-surface-strong, rgba(255, 255, 255, 0.1));
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          font-style: italic;
          border: 1px dashed var(--accent-color-main);
          border-color: var(--spw-runtime-outline, var(--accent-color-main));
          transition: background-color var(--transition-duration) var(--transition-function), border-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(255, 255, 255, 0.2);
          background: var(--spw-runtime-surface, rgba(255, 255, 255, 0.2));
          border-color: var(--spw-runtime-accent, var(--accent-color-alt));
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
