import { attachAdvancedSpwRuntime } from './spw-advanced-runtime.mjs?v=2026_09_07.A';
import {
  STORY_VOICE_READ_BEHAVIOR,
  storyVoiceFor,
  voiceKickerWithMask
} from '../modules/story-lexicon.mjs?v=2026_09_07.B';

/**
 * Shared custom-element base for story voices.
 *
 * Reading first: slotted prose is always visible. Block chambers carry a
 * quiet kicker; phrase marks sit inside a sentence. No collapse, no quiz,
 * no replacing the story with a toy caption.
 */
export class StoryVoiceElement extends HTMLElement {
  connectedCallback() {
    const type = this.tagName.toLowerCase();
    const meta = storyVoiceFor(type);

    if (meta) {
      const composedKicker = voiceKickerWithMask(meta.kicker, this.dataset.mask);
      if (!this.dataset.voiceKicker || this.dataset.voiceKicker === meta.kicker) {
        this.dataset.voiceKicker = composedKicker;
      }
      if (!this.dataset.spwGrammar) {
        this.dataset.spwGrammar = meta.grammar;
      }
      if (!this.dataset.spwVoice) {
        this.dataset.spwVoice = meta.voice;
      }
    }

    const shape = this.dataset.voiceShape || inferVoiceShape(this);
    this.dataset.voiceShape = shape;

    if (!this.getAttribute('data-spw-behavior') && !this.getAttribute('spw-behavior')) {
      this.setAttribute('data-spw-behavior', STORY_VOICE_READ_BEHAVIOR);
    }

    this.removeAttribute('tabindex');
    if (this.getAttribute('role') === 'button') {
      this.removeAttribute('role');
    }

    if (shape === 'block') {
      mountVoiceKicker(this);
    } else if (meta?.kicker && !this.getAttribute('title')) {
      this.setAttribute('title', meta.kicker);
    }

    if (this.releaseSpwRuntime) {
      this.releaseSpwRuntime();
    }
    this.releaseSpwRuntime = attachAdvancedSpwRuntime(this, {
      behavior: STORY_VOICE_READ_BEHAVIOR
    });
  }

  disconnectedCallback() {
    if (this.releaseSpwRuntime) {
      this.releaseSpwRuntime();
      this.releaseSpwRuntime = null;
    }
  }
}

function inferVoiceShape(node) {
  if (node.querySelector('p, section, details, figure, h2, ul')) {
    return 'block';
  }
  return 'phrase';
}

function mountVoiceKicker(node) {
  if (node.querySelector(':scope > .voice-kicker')) {
    return;
  }

  const label = String(node.dataset.voiceKicker || '').trim();
  if (!label) {
    return;
  }

  const kicker = document.createElement('div');
  kicker.className = 'voice-kicker';
  kicker.setAttribute('aria-hidden', 'true');
  kicker.textContent = label;
  node.insertBefore(kicker, node.firstChild);
}
