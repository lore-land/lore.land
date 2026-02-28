import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.E';

const CONFIG = {
  tagName: 'chapter-13-sigil',
  title: 'Canon Sigil',
  phrase: '^[chapter/13]{^[canon]{world records itself and loops}}',
  meaning: 'Canon mode captures memory, revision, and re-entry points.',
  prompts: [
    'Treat caret as authored intent and archival care.',
    'How does looping support catharsis instead of addiction?',
    'What new trope could this chapter authorize?'
  ],
  route: {
    href: '/book/chapter/01/',
    label: '^[route/01]{continue}',
    ariaLabel: 'Continue to chapter 01'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
