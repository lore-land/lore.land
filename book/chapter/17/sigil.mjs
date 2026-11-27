import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-17-sigil',
  title: 'Open Pigeonhole Sigil',
  phrase: '^[chapter/17]{?[filed_answer & unasked_question]{#[owl]{keep the gap clear}}}',
  meaning: 'Probe mode: an answer stamped before the question arrives cannot fold four corners into yes or no.',
  prompts: [
    'Which answer did you file early before hearing the question?',
    'What open pigeonhole are you keeping clear for whatever arrives next?',
    'Which unspent coincidence is still waiting for its honest owner?'
  ],
  route: {
    href: '/book/chapter/18/',
    label: '^[route/18]{flour in the bell-tower}',
    ariaLabel: 'Continue to chapter 18: Flour in the Bell-Tower'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
