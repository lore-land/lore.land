import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-15-sigil',
  title: 'Three-Record Sigil',
  phrase: '^[chapter/15]{&[child, parcel, door]{#[records]{all three bear weight}}}',
  meaning: 'Record mode: three careful readings of one stranger stay pinned side by side, none smoothed into the others.',
  prompts: [
    'Which of your records would you refuse to take down?',
    'What rule did someone hold open for you, and what did it cost them?',
    'Whose name did you leave blank so they could fill it in?'
  ],
  route: {
    href: '/book/chapter/16/',
    label: '^[route/16]{the second place}',
    ariaLabel: 'Continue to chapter 16: The Second Place'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
