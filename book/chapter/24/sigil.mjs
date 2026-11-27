import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-24-sigil',
  title: 'Double Shutter Sigil',
  phrase: '^[chapter/24]{=[four_shutters & one_courtyard]{#[frame]{open two at once}}}',
  meaning: 'Frame mode: four narrow windows prove four spotless contradictions until two shutters open together and cast crossing shadows.',
  prompts: [
    'Which airtight verdict depends on keeping the neighbouring shutter latched?',
    'What crossing shadow appears the moment two views share one courtyard?',
    'Can you pin four contradictory scorecards together without tearing any of them up?'
  ],
  route: {
    href: '/book/chapter/25/',
    label: '^[route/25]{the warm hearth before the feast}',
    ariaLabel: 'Continue to chapter 25: The Warm Hearth Before the Feast'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
