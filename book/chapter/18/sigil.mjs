import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-18-sigil',
  title: 'Muffled Clapper Sigil',
  phrase: '^[chapter/18]{![dropped_heel & flour_cloud]{#[belfry]{silence carries}}}',
  meaning: 'Action mode: one irreversible step turns brass noise into a white hush that makes the whole square look up together.',
  prompts: [
    'When did a missing sound tell you more than a loud announcement?',
    'Which loose floorboard in your loft has been waiting for one step too hard?',
    'What stayed sharp black ink even when the whole room filled with dust?'
  ],
  route: {
    href: '/book/chapter/19/',
    label: '^[route/19]{the priced window}',
    ariaLabel: 'Continue to chapter 19: The Priced Window'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
