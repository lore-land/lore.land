import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-21-sigil',
  title: 'Fourteen-Inch Vantage Sigil',
  phrase: '^[chapter/21]{@[cobble_level]{#[scent]{boots tell the minutes}}}',
  meaning: 'Perspective mode: dropping fourteen inches to the paving slabs shows every trail the tabletop speeches leave out.',
  prompts: [
    'What does the floor of your workshop know that the meeting table never mentions?',
    'Which three trails are crossing at your kerb right now?',
    'When is a crumb a signpost rather than a snack?'
  ],
  route: {
    href: '/book/chapter/22/',
    label: '^[route/22]{through the chute with no receipt}',
    ariaLabel: 'Continue to chapter 22: Through the Chute With No Receipt'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
