// custom-components.js

class CustomBoof extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isCollapsed = true;
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.header').addEventListener('click', () => this.toggleContent());
  }

  toggleContent() {
    this.isCollapsed = !this.isCollapsed;
    this.shadowRoot.querySelector('.content').style.display = this.isCollapsed ? 'none' : 'block';
    this.shadowRoot.querySelector('.toggle-icon').textContent = this.isCollapsed ? '+' : '−';
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                /* Styles specific to custom-boof */
                :host {
                    display: block;
                    padding: var(--padding-large);
                    border-radius: var(--border-radius-main);
                    margin-bottom: var(--margin-large);
                    background: rgba(173, 216, 230, 0.2); /* Light blue */
                    cursor: pointer;
                }
                .header {
                    font-weight: var(--font-weight-bold);
                    display: flex;
                    align-items: center;
                }
                .toggle-icon {
                    margin-right: var(--margin-small);
                    font-size: 1.5rem;
                }
                .content {
                    display: none;
                    margin-top: var(--margin-small);
                }
            </style>
            <div class="header">
                <span class="toggle-icon">+</span>
                <slot name="title">Boof Title</slot>
            </div>
            <div class="content">
                <slot></slot>
            </div>
        `;
  }
}

class CustomBoonberry extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                /* Styles specific to custom-boonberry */
                :host {
                    display: block;
                    padding: var(--padding-large);
                    border-radius: var(--border-radius-main);
                    margin-bottom: var(--margin-large);
                    background: rgba(240, 128, 128, 0.2); /* Light coral */
                    transition: background-color var(--transition-duration) var(--transition-function);
                }
                :host(:hover) {
                    background-color: rgba(240, 128, 128, 0.4); /* Darker coral on hover */
                }
            </style>
            <slot></slot>
        `;
  }
}

class CustomFool extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.addEventListener('mouseenter', () => this.showTooltip());
    this.addEventListener('mouseleave', () => this.hideTooltip());
  }

  showTooltip() {
    this.shadowRoot.querySelector('.tooltip').style.display = 'block';
  }

  hideTooltip() {
    this.shadowRoot.querySelector('.tooltip').style.display = 'none';
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                /* Styles specific to custom-fool */
                :host {
                    display: inline-block;
                    padding: var(--padding-small);
                    border-radius: var(--border-radius-small);
                    background: rgba(144, 238, 144, 0.2); /* Light green */
                    font-weight: var(--font-weight-bold);
                    position: relative;
                    cursor: help;
                }
                .tooltip {
                    display: none;
                    position: absolute;
                    bottom: 100%;
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
                }
            </style>
            <slot></slot>
            <div class="tooltip">
                <slot name="tooltip">Additional Info</slot>
            </div>
        `;
  }
}

class CustomPuzzle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.answer = this.getAttribute('answer') || '';
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('button').addEventListener('click', () => this.checkAnswer());
  }

  checkAnswer() {
    const userAnswer = this.shadowRoot.querySelector('input').value;
    const result = this.shadowRoot.querySelector('.result');
    if (userAnswer.toLowerCase() === this.answer.toLowerCase()) {
      result.textContent = 'Correct!';
      result.style.color = 'green';
    } else {
      result.textContent = 'Try again.';
      result.style.color = 'red';
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                /* Styles specific to custom-puzzle */
                :host {
                    display: block;
                    padding: var(--padding-large);
                    border-radius: var(--border-radius-main);
                    margin-bottom: var(--margin-large);
                    background: rgba(255, 228, 181, 0.3); /* Moccasin */
                    font-style: var(--font-style-italic);
                    border: 1px dashed rgba(255, 215, 0, 0.5);
                }
                .puzzle-content {
                    margin-bottom: var(--margin-small);
                }
                .controls {
                    display: flex;
                    align-items: center;
                }
                input {
                    flex: 1;
                    padding: var(--padding-small);
                    margin-right: var(--margin-small);
                    border-radius: var(--border-radius-small);
                    border: 1px solid #ccc;
                }
                button {
                    padding: var(--padding-small) var(--padding-medium);
                    border: none;
                    border-radius: var(--border-radius-small);
                    background: var(--accent-color-main);
                    color: var(--text-color-content);
                    cursor: pointer;
                    transition: background-color var(--transition-duration) var(--transition-function);
                }
                button:hover {
                    background: var(--accent-color-alt);
                }
                .result {
                    margin-top: var(--margin-small);
                    font-weight: var(--font-weight-bold);
                }
            </style>
            <div class="puzzle-content">
                <slot></slot>
            </div>
            <div class="controls">
                <input type="text" placeholder="Your answer...">
                <button>Submit</button>
            </div>
            <div class="result"></div>
        `;
  }
}

class CustomBonk extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.originalContent = this.innerHTML;
    this.clicked = false;
    this.render();
  }

  connectedCallback() {
    this.addEventListener('click', () => this.bonk());
  }

  bonk() {
    const content = this.shadowRoot.querySelector('.content');
    if (!this.clicked) {
      content.textContent = 'Bonked!';
      this.clicked = true;
    } else {
      content.innerHTML = this.originalContent;
      this.clicked = false;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                /* Styles specific to custom-bonk */
                :host {
                    display: inline-block;
                    padding: var(--padding-small);
                    border-radius: var(--border-radius-small);
                    background: rgba(255, 182, 193, 0.3); /* Light pink */
                    font-style: var(--font-style-italic);
                    border: 1px solid rgba(255, 105, 180, 0.5);
                    cursor: pointer;
                    transition: transform var(--transition-duration) var(--transition-function);
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

// Register the custom elements
customElements.define('custom-boof', CustomBoof);
customElements.define('custom-boonberry', CustomBoonberry);
customElements.define('custom-fool', CustomFool);
customElements.define('custom-puzzle', CustomPuzzle);
customElements.define('custom-bonk', CustomBonk);
