// scripts/custom-puzzle.mjs
export class CustomPuzzle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.answer = (this.getAttribute('answer') || '').toLowerCase();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('button').addEventListener('click', this.handleSubmit);
    this.shadowRoot.querySelector('input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      }
    });
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('button').removeEventListener('click', this.handleSubmit);
  }

  handleSubmit() {
    const input = this.shadowRoot.querySelector('input');
    const result = this.shadowRoot.querySelector('.result');
    const userAnswer = input.value.trim().toLowerCase();

    if (userAnswer === this.answer) {
      result.textContent = 'Correct!';
      result.style.color = 'green';
      this.dispatchEvent(new CustomEvent('puzzle-solved', { bubbles: true, composed: true }));
    } else {
      result.textContent = 'Try again.';
      result.style.color = 'red';
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
          background: rgba(255, 228, 181, 0.3); /* Moccasin */
          font-style: var(--font-style-italic);
          border: 1px dashed rgba(255, 215, 0, 0.5);
          transition: background-color var(--transition-duration) var(--transition-function), border-color var(--transition-duration) var(--transition-function);
        }
        :host(:hover), :host(:focus-within) {
          background: rgba(255, 228, 181, 0.5);
          border-color: var(--accent-color-alt);
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
          font-size: 1rem;
        }
        button {
          padding: var(--padding-small) var(--padding-medium);
          border: none;
          border-radius: var(--border-radius-small);
          background: var(--accent-color-main);
          color: var(--text-color-content);
          cursor: pointer;
          transition: background-color var(--transition-duration) var(--transition-function);
          font-size: 1rem;
        }
        button:hover, button:focus {
          background: var(--accent-color-alt);
        }
        .result {
          margin-top: var(--margin-small);
          font-weight: var(--font-weight-bold);
          min-height: 1.2em;
        }
      </style>
      <div class="puzzle-content">
        <slot></slot>
      </div>
      <div class="controls">
        <input type="text" placeholder="Your answer..." aria-label="Puzzle answer">
        <button type="button">Submit</button>
      </div>
      <div class="result" aria-live="polite"></div>
    `;
  }
}
