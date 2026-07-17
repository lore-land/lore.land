import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_16.A';

const CONFIG = {
  tagName: 'chapter-12-sigil',
  title: 'Confluence Sigil',
  phrase: '^[chapter/12]{&[confluence]{all threads merge}}',
  meaning: 'Confluence mode assembles strands into legible coherence.',
  prompts: [
    'Use confluence to synthesize language and visual motifs.',
    'Which thread have you been postponing to merge?',
    'What makes a merged interface still breathable?'
  ],
  route: {
    href: '/book/chapter/13/',
    label: '^[route/13]{continue}',
    ariaLabel: 'Continue to chapter 13'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
