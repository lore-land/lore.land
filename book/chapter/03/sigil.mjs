import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-03-sigil',
  title: 'Signal Sigil',
  phrase: '^[chapter/03]{?[signal]{dunes whisper old routes}}',
  meaning: 'Signal mode invites gentle puzzle-solving and route finding.',
  prompts: [
    'Parse question mark as curiosity, not uncertainty.',
    'Rename routes as rituals and re-evaluate intent.',
    'Where does whisper sit in your own navigation habits?'
  ],
  route: {
    href: '/book/chapter/04/',
    label: '^[route/04]{continue}',
    ariaLabel: 'Continue to chapter 04'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
