// scripts/custom-boonberry.mjs
import { attachSpwBinding } from './spw-component-binding.mjs?v=2026_02_28.I';

export class CustomBoonberry extends HTMLElement {
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
          display: block;
          padding: var(--padding-large);
          border-radius: var(--border-radius-main);
          margin-bottom: var(--margin-large);
          background: rgba(240, 128, 128, 0.2); /* Light coral */
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background-color: rgba(240, 128, 128, 0.4); /* Darker coral on hover/focus */
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
