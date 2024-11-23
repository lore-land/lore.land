import "./script.mjs";

// scripts/custom-elements.mjs

// Define a Base Class for Common Functionality
class BaseCustomElement extends HTMLElement {
  constructor() {
    super();
    // Attach Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupInteractivity();
  }

  render() {
    // To be implemented by subclasses
  }

  setupInteractivity() {
    const container = this.shadowRoot.querySelector('.container');
    if (container) {
      // Make the container focusable
      container.setAttribute('tabindex', '0');

      // Event listeners for interactivity
      container.addEventListener('mouseenter', () => {
        container.classList.add('hovered');
      });

      container.addEventListener('mouseleave', () => {
        container.classList.remove('hovered');
      });

      container.addEventListener('focus', () => {
        container.classList.add('focused');
      });

      container.addEventListener('blur', () => {
        container.classList.remove('focused');
      });

      // Example: Click event to dispatch a custom event
      container.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('element-clicked', {
          detail: { type: this.tagName.toLowerCase() },
          bubbles: true,
          composed: true
        }));
        // Toggle 'played' class
        container.classList.toggle('played');
      });
    }
  }
}

// Define <custom-boof>
class CustomBoof extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: block;
                    background: rgba(0, 0, 255, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(0, 0, 255, 0.2);
                }
                .container.focused {
                    outline: 3px solid #0000ff;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-fool>
class CustomFool extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: inline-block;
                    background: rgba(0, 255, 0, 0.1);
                    padding: 5px;
                    border-radius: 4px;
                    font-weight: bold;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(0, 255, 0, 0.2);
                }
                .container.focused {
                    outline: 3px solid #00ff00;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-bonk>
class CustomBonk extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: block;
                    background: rgba(255, 0, 0, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(255, 0, 0, 0.2);
                }
                .container.focused {
                    outline: 3px solid #ff0000;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-awakening>
class CustomAwakening extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: inline-block;
                    background: rgba(150, 150, 255, 0.2);
                    padding: 5px;
                    border-radius: 8px;
                    font-style: italic;
                    border: 1px solid rgba(100, 100, 255, 0.5);
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(150, 150, 255, 0.3);
                }
                .container.focused {
                    outline: 3px solid #6495ed;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-path>
class CustomPath extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: inline-block;
                    background: rgba(0, 0, 0, 0.05);
                    padding: 5px;
                    border-radius: 8px;
                    border: 2px dashed #000000;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(0, 0, 0, 0.1);
                }
                .container.focused {
                    outline: 3px solid #000000;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-reflection>
class CustomReflection extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: inline-block;
                    background: rgba(100, 149, 237, 0.2);
                    padding: 5px;
                    border-radius: 8px;
                    border: 1px solid rgba(65, 105, 225, 0.5);
                    font-style: italic;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(100, 149, 237, 0.3);
                }
                .container.focused {
                    outline: 3px solid #4169e1;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-boonberry>
class CustomBoonberry extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: block;
                    background: rgba(255, 105, 180, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(255, 105, 180, 0.2);
                }
                .container.focused {
                    outline: 3px solid #ff69b4;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Define <custom-puzzle>
class CustomPuzzle extends BaseCustomElement {
  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .container {
                    display: block;
                    background: rgba(255, 215, 0, 0.1);
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 2px solid #ffd700;
                    transition: transform 0.3s ease, background-color 0.3s ease;
                    cursor: pointer;
                }
                .container.hovered {
                    transform: scale(1.05);
                    background-color: rgba(255, 215, 0, 0.2);
                }
                .container.focused {
                    outline: 3px solid #ffd700;
                }
                .container.played {
                    opacity: 0.7;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `;
  }
}

// Register All Custom Elements
customElements.define('custom-boof', CustomBoof);
customElements.define('custom-fool', CustomFool);
customElements.define('custom-bonk', CustomBonk);
customElements.define('custom-awakening', CustomAwakening);
customElements.define('custom-path', CustomPath);
customElements.define('custom-reflection', CustomReflection);
customElements.define('custom-boonberry', CustomBoonberry);
customElements.define('custom-puzzle', CustomPuzzle);
