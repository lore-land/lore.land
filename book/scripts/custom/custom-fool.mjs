// scripts/custom-fool.mjs
export class CustomFool extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.render();
  }

  connectedCallback() {
    this.addEventListener('mouseenter', this.showTooltip);
    this.addEventListener('mouseleave', this.hideTooltip);
    this.addEventListener('focus', this.showTooltip);
    this.addEventListener('blur', this.hideTooltip);
    this.setAttribute('tabindex', '0');
    this.setAttribute('aria-describedby', 'tooltip');
  }

  disconnectedCallback() {
    this.removeEventListener('mouseenter', this.showTooltip);
    this.removeEventListener('mouseleave', this.hideTooltip);
    this.removeEventListener('focus', this.showTooltip);
    this.removeEventListener('blur', this.hideTooltip);
  }

  showTooltip() {
    const tooltip = this.shadowRoot.querySelector('.tooltip');
    tooltip.style.display = 'block';
  }

  hideTooltip() {
    const tooltip = this.shadowRoot.querySelector('.tooltip');
    tooltip.style.display = 'none';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          background: rgba(144, 238, 144, 0.2); /* Light green */
          font-weight: var(--font-weight-bold);
          position: relative;
          cursor: help;
          outline: none;
        }
        :host(:focus) {
          box-shadow: 0 0 0 3px rgba(144, 238, 144, 0.5);
        }
        .tooltip {
          display: none;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: #fff;
          padding: var(--padding-small);
          border-radius: var(--border-radius-small);
          white-space: nowrap;
          font-size: var(--font-size-caption);
          margin-bottom: var(--margin-small);
          z-index: 10;
          opacity: 0;
          transition: opacity var(--transition-duration) var(--transition-function);
        }
        :host(:hover) .tooltip,
        :host(:focus) .tooltip {
          display: block;
          opacity: 1;
        }
        /* Arrow */
        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 5px;
          border-style: solid;
          border-color: #333 transparent transparent transparent;
        }
      </style>
      <slot></slot>
      <div class="tooltip" role="tooltip">
        <slot name="tooltip">Additional Info</slot>
      </div>
    `;
  }
}
