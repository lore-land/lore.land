import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_02_28.F';

const CONFIG = {
  tagName: 'chapter-06-sigil',
  title: 'Lantern Sigil',
  phrase: '^[chapter/06]{("bonk.city")[![lantern]{streets ignite}]}',
  meaning: 'Lantern mode rewards orientation and tangible wayfinding.',
  prompts: [
    'Interpret exclamation as illumination, not alarm.',
    'Replace city with subsystem and map the metaphor.',
    'Which interface edges need lantern treatment?'
  ],
  route: {
    href: '/book/chapter/07/',
    label: '^[route/07]{continue}',
    ariaLabel: 'Continue to chapter 07'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
