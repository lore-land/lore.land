import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.G';

const CONFIG = {
  tagName: 'chapter-08-sigil',
  title: 'Song Sigil',
  phrase: '^[chapter/08]{#[song]{memory resonates in water}}',
  meaning: 'Song mode introduces cadence and resonant recall.',
  prompts: [
    'Treat hash as motif indexing across scenes.',
    'Try converting a memory into one resonant noun.',
    'Where can repetition feel soothing instead of tedious?'
  ],
  route: {
    href: '/book/chapter/09/',
    label: '^[route/09]{continue}',
    ariaLabel: 'Continue to chapter 09'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
