import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-23-sigil',
  title: 'Unclosed Circle Sigil',
  phrase: '^[chapter/23]{%(chalk_circle & night_choir){#[sliver]{never round off}}}',
  meaning: 'Scope mode: grown hands steady round one shared chord while leaving the circle’s honest sliver open.',
  prompts: [
    'Which stubborn remainder keeps your measure truer than rounding it off?',
    'What shared hum steadies tired hands better than pressing harder on the oak?',
    'Which blank line on your roll stays open for whoever sits down next?'
  ],
  route: {
    href: '/book/chapter/24/',
    label: '^[route/24]{four windows in one wall}',
    ariaLabel: 'Continue to chapter 24: Four Windows in One Wall'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
