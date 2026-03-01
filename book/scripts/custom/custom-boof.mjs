// scripts/custom-boof.mjs
import { attachAdvancedSpwRuntime } from './spw-advanced-runtime.mjs?v=2026_02_28.I';

export class CustomBoof extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isCollapsed = true;
    this.releaseSpwRuntime = null;
    this.handleToggle = this.handleToggle.bind(this);
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.header').addEventListener('click', this.handleToggle);
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'button');
    if (this.releaseSpwRuntime) {
      this.releaseSpwRuntime();
    }
    this.releaseSpwRuntime = attachAdvancedSpwRuntime(this);
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('.header').removeEventListener('click', this.handleToggle);
    if (this.releaseSpwRuntime) {
      this.releaseSpwRuntime();
      this.releaseSpwRuntime = null;
    }
  }

  handleToggle() {
    this.toggleContent();
  }

  toggleContent() {
    this.isCollapsed = !this.isCollapsed;
    const content = this.shadowRoot.querySelector('.content');
    const toggleIcon = this.shadowRoot.querySelector('.toggle-icon');
    content.style.display = this.isCollapsed ? 'none' : 'block';
    toggleIcon.textContent = this.isCollapsed ? '+' : '−';
    this.setAttribute('aria-expanded', String(!this.isCollapsed));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: var(--padding-large);
          border-radius: var(--border-radius-main);
          margin-bottom: var(--margin-large);
          background: rgba(173, 216, 230, 0.2); /* Light blue */
          background: var(--spw-runtime-surface-strong, rgba(173, 216, 230, 0.2));
          cursor: pointer;
          outline: none;
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:focus) {
          box-shadow: 0 0 0 3px var(--spw-runtime-glow, rgba(173, 216, 230, 0.5));
        }
        .header {
          font-weight: var(--font-weight-bold);
          display: flex;
          align-items: center;
        }
        .toggle-icon {
          margin-right: var(--margin-small);
          font-size: 1.5rem;
          user-select: none;
        }
        .content {
          display: none;
          margin-top: var(--margin-small);
        }
      </style>
      <div class="header" aria-expanded="false">
        <span class="toggle-icon" aria-hidden="true">+</span>
        <span class="title"><slot name="title">[ Boof ]</slot></span>
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `;
  }
}
