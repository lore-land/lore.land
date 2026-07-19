import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-09-sigil',
  title: 'Relic Sigil',
  phrase: '^[chapter/09]{*[relic]{nine honks scatter into night}}',
  meaning: 'Relic mode holds fragments that still carry meaning.',
  prompts: [
    'Read asterisk as wildcard memory retrieval.',
    'What fragment in your code still holds narrative value?',
    'How can unfinished pieces stay navigable?'
  ],
  route: {
    href: '/book/chapter/10/',
    label: '^[route/10]{continue}',
    ariaLabel: 'Continue to chapter 10'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
