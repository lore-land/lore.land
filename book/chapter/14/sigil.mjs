import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-14-sigil',
  title: 'Quarter-Turn Sigil',
  phrase: '^[chapter/14]{@[hat]{~[thursday]{a day the field kept}}}',
  meaning: 'Arrival mode: something comes in at a right angle to the plot, and the land makes room before anyone names it.',
  prompts: [
    'What does your field keep that your calendar lost?',
    'Which nearby thing would straighten if a drawing walked past it?',
    'Who is looking a quarter turn away from the obvious ending?'
  ],
  route: {
    href: '/book/chapter/15/',
    label: '^[route/15]{continue}',
    ariaLabel: 'Continue to chapter 15'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
