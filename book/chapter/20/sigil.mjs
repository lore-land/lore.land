import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-20-sigil',
  title: 'Third-Chime Lock Sigil',
  phrase: '^[chapter/20]{&[sweet_gate, toll_gate]{#[sill]{alternate on three}}}',
  meaning: 'Confluence mode: opposing currents need not merge to share one sill; alternating every third chime keeps both honest.',
  prompts: [
    'Which two opposing waters in your craft hold cleaner when they take turns?',
    'What sharp pinch keeps a sweet thing from turning flat?',
    'Where is the narrow dry sill you can stand on without choosing a side too soon?'
  ],
  route: {
    href: '/book/chapter/21/',
    label: '^[route/21]{at the nose of the work}',
    ariaLabel: 'Continue to chapter 21: At the Nose of the Work'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
