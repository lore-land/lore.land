import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.H';

const CONFIG = {
  tagName: 'chapter-11-sigil',
  title: 'Paradox Sigil',
  phrase: '^[chapter/11]{~[paradox]{impossible paths flower}}',
  meaning: 'Paradox mode invites plural interpretations without punishment.',
  prompts: [
    'Read impossible as not-yet-modeled, not invalid.',
    'Try adding one impossible path to your own workflow map.',
    'Which trope could become a new interface pattern?'
  ],
  route: {
    href: '/book/chapter/12/',
    label: '^[route/12]{continue}',
    ariaLabel: 'Continue to chapter 12'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
