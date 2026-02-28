import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.E';

const CONFIG = {
  tagName: 'chapter-05-sigil',
  title: 'Rift Sigil',
  phrase: '^[chapter/05]{~[rift]{calm outside, fracture within}}',
  meaning: 'Rift mode makes room for inner contradiction without collapse.',
  prompts: [
    'Treat tilde as oscillation between states.',
    'Try expressing your own rift in two short clauses.',
    'Which convention in web work hides useful fracture?'
  ],
  route: {
    href: '/book/chapter/06/',
    label: '^[route/06]{continue}',
    ariaLabel: 'Continue to chapter 06'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
