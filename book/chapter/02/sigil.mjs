import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.F';

const CONFIG = {
  tagName: 'chapter-02-sigil',
  title: 'Echo Sigil',
  phrase: '^[chapter/02]{("bane.land")[<echo>{distant drums answer}]}',
  meaning: 'Echo marks response loops without forcing urgency.',
  prompts: [
    'Treat echo as relational rather than repetitive.',
    'Swap drums for another texture and evaluate emotional change.',
    'Observe how answer implies prior unheard context.'
  ],
  route: {
    href: '/book/chapter/03/',
    label: '^[route/03]{continue}',
    ariaLabel: 'Continue to chapter 03'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
