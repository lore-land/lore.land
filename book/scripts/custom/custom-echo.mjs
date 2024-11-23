// scripts/custom-echo.mjs
export class CustomEcho extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    // Additional interactivity can be implemented here
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
          font-style: italic;
          transition: background-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(255, 255, 0, 0.2);
        }
        ::slotted(*) {
          margin: 0;
        }
      </style>
      <slot></slot>
    `;
  }
}
