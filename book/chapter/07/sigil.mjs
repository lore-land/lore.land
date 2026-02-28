import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.F';

const CONFIG = {
  tagName: 'chapter-07-sigil',
  title: 'Oath Sigil',
  phrase: '^[chapter/07]{<oath>{boof binds fate at the ball}}',
  meaning: 'Oath mode frames commitment as a designed interaction.',
  prompts: [
    'Read bind as intentional coupling, not lock-in.',
    'What oath does your current product silently make?',
    'How can rituals support ADHD-friendly continuity?'
  ],
  route: {
    href: '/book/chapter/08/',
    label: '^[route/08]{continue}',
    ariaLabel: 'Continue to chapter 08'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
