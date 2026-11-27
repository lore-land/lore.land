import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-16-sigil',
  title: 'Scullery Ground Sigil',
  phrase: '^[chapter/16]{.[long_table & cold_sink]{#[plates]{hands still tire}}}',
  meaning: 'Ground mode: infinite arithmetic at the head of the table stays anchored to the wet stoneware stacked behind the curtain.',
  prompts: [
    'What endless gift in your world hides an uncounted pair of wet hands?',
    'Which title did you wear for one honest course before hanging it on a peg?',
    'Who behind the curtain has nobody thought to ask the name of?'
  ],
  route: {
    href: '/book/chapter/17/',
    label: '^[route/17]{ledger of unasked questions}',
    ariaLabel: 'Continue to chapter 17: Ledger of Unasked Questions'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
