import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-19-sigil',
  title: 'Unpriced Glass Sigil',
  phrase: '^[chapter/19]{*[chalk_tariff & silver_trail]{#[pane]{clear without coin}}}',
  meaning: 'Value mode: light catches on chalk stickers and runs straight through glass the snails have grazed clean.',
  prompts: [
    'What view turned crooked the moment somebody marked a tariff in its corner?',
    'Which quiet persistence erases clutter better than argument?',
    'What becomes visible once nobody owns the window?'
  ],
  route: {
    href: '/book/chapter/20/',
    label: '^[route/20]{two springs under the sill}',
    ariaLabel: 'Continue to chapter 20: Two Springs Under the Sill'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
