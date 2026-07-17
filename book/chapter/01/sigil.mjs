import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_16.A';

const CONFIG = {
  tagName: 'chapter-01-sigil',
  title: 'Dawn Sigil',
  phrase: '^[chapter/01]{("boon.land")[<dawn>{cactus wakes}]}',
  meaning: 'Boon energy begins as quiet wakefulness and gentle patterning.',
  prompts: [
    'Read the angle brackets as a stage cue for emergence.',
    'Try replacing dawn with another sensory verb and imagine the shift.',
    'Notice how location appears before action in this construct.'
  ],
  route: {
    href: '/book/chapter/02/',
    label: '^[route/02]{continue}',
    ariaLabel: 'Continue to chapter 02'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
