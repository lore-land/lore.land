// scripts/custom-bonk.mjs
export class CustomBonk extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.clicked = false;
    this.handleClick = this.handleClick.bind(this);
    this.render();
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  handleClick() {
    this.bonk();
  }

  bonk() {
    const content = this.shadowRoot.querySelector('.content');
    if (!this.clicked) {
      content.textContent = 'Bonked!';
      this.clicked = true;
    } else {
      content.innerHTML = `<slot></slot>`;
      this.clicked = false;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          background: rgba(255, 182, 193, 0.3); /* Light pink */
          font-style: var(--font-style-italic);
          border: 1px solid rgba(255, 105, 180, 0.5);
          cursor: pointer;
          transition: transform var(--transition-duration) var(--transition-function), background-color var(--transition-duration) var(--transition-function);
          outline: none;
        }
        :host(:focus) {
          box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.5);
        }
        :host(:active) {
          transform: scale(0.95);
        }
      </style>
      <span class="content">
        <slot></slot>
      </span>
    `;
  }
}
