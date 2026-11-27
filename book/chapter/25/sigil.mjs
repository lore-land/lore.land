import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-25-sigil',
  title: 'Bakehouse Vault Sigil',
  phrase: '^[chapter/25]{&{bakehouse_vault & open_vent}{#[hearth]{wait till full}}}',
  meaning: 'Body mode: every unfinished ingredient gathers under one brick vault, held right to the breath before the damper opens.',
  prompts: [
    'What ingredients from across your season are simmering under one roof tonight?',
    'How do you recognise the exact breath to unlatch the vent before the crust scorches?',
    'Who is waiting politely outside your threshold for the first fork chime?'
  ],
  route: {
    href: '/book/chapter/26/',
    label: '^[route/26]{the feast of the uneven slice}',
    ariaLabel: 'Continue to chapter 26: The Feast of the Uneven Slice'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
