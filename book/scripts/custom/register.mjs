import { CustomBonk } from './custom-bonk.mjs?v=2026_02_28.I';
import { CustomBoof } from './custom-boof.mjs?v=2026_02_28.I';
import { CustomBoonberry } from './custom-boonberry.mjs?v=2026_02_28.I';
import { CustomEcho } from './custom-echo.mjs?v=2026_02_28.I';
import { CustomFool } from './custom-fool.mjs?v=2026_02_28.I';
import { CustomGame } from './custom-game.mjs?v=2026_02_28.I';
import { CustomParadox } from './custom-paradox.mjs?v=2026_02_28.I';
import { CustomPuzzle } from './custom-puzzle.mjs?v=2026_02_28.I';
import { CustomSong } from './custom-song.mjs?v=2026_02_28.I';
import { attachSpwBinding } from './spw-component-binding.mjs?v=2026_02_28.I';

class GenericSpwElement extends HTMLElement {
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
          background: rgba(120, 150, 190, 0.14);
          border: 1px solid rgba(120, 150, 190, 0.35);
        }
      </style>
      <slot></slot>
    `;
  }
}

class CustomAwakening extends GenericSpwElement {}
class CustomPath extends GenericSpwElement {}
class CustomReflection extends GenericSpwElement {}

const CUSTOM_ELEMENT_REGISTRY = Object.freeze([
  ['custom-boof', CustomBoof],
  ['custom-fool', CustomFool],
  ['custom-bonk', CustomBonk],
  ['custom-boonberry', CustomBoonberry],
  ['custom-echo', CustomEcho],
  ['custom-game', CustomGame],
  ['custom-paradox', CustomParadox],
  ['custom-puzzle', CustomPuzzle],
  ['custom-song', CustomSong],
  ['custom-awakening', CustomAwakening],
  ['custom-path', CustomPath],
  ['custom-reflection', CustomReflection]
]);

export function registerCustomElements() {
  CUSTOM_ELEMENT_REGISTRY.forEach(([tagName, constructor]) => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, constructor);
    }
  });
}
