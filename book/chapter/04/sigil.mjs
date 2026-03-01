import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.G';

const CONFIG = {
  tagName: 'chapter-04-sigil',
  title: 'Council Sigil',
  phrase: '^[chapter/04]{&[council]{boon + bane negotiate}}',
  meaning: 'Council mode uses conjunction to hold multiple truths at once.',
  prompts: [
    'Read ampersand as co-authorship instead of conflict.',
    'Experiment with replacing negotiate with compose.',
    'What pairings in your stack need council treatment?'
  ],
  route: {
    href: '/book/chapter/05/',
    label: '^[route/05]{continue}',
    ariaLabel: 'Continue to chapter 05'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
