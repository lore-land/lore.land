import { STORY_VOICES } from '../modules/story-lexicon.mjs?v=2026_09_26.A';
import { StoryVoiceElement } from './story-voice.mjs?v=2026_11_09.I';

function createVoiceClass() {
  return class extends StoryVoiceElement {};
}

export function registerCustomElements() {
  Object.keys(STORY_VOICES).forEach((tagName) => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, createVoiceClass());
    }
  });
}

export { StoryVoiceElement };
