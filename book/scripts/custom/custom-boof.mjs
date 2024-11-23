// scripts/custom-boof.mjs
export class CustomBoof extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isCollapsed = true;
    this.handleToggle = this.handleToggle.bind(this);
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.header').addEventListener('click', this.handleToggle);
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'button');
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('.header').removeEventListener('click', this.handleToggle);
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
          cursor: pointer;
          outline: none;
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:focus) {
          box-shadow: 0 0 0 3px rgba(173, 216, 230, 0.5);
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
