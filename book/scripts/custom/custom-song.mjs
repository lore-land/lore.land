// scripts/custom-song.mjs
import { attachSpwBinding } from './spw-component-binding.mjs?v=2026_02_28.I';

export class CustomSong extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.releaseSpwBinding = null;
    this.render();
  }

  connectedCallback() {
    if (this.releaseSpwBinding) {
      this.releaseSpwBinding();
    }
    this.releaseSpwBinding = attachSpwBinding(this);
  }

  disconnectedCallback() {
    if (this.releaseSpwBinding) {
      this.releaseSpwBinding();
      this.releaseSpwBinding = null;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          background: rgba(255, 255, 100, 0.2);
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          font-style: italic;
          border: 1px solid rgba(200, 200, 100, 0.5);
          transition: background-color var(--transition-duration) var(--transition-function), border-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(255, 255, 100, 0.4);
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
