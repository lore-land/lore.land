import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-10-sigil',
  title: 'Resonance Sigil',
  phrase: '^[chapter/10]{("bone.land")[<concert>{truth shakes the veil}]}',
  meaning: 'Resonance mode lets structure vibrate with interpretation.',
  prompts: [
    'Treat concert as coordinated subsystem behavior.',
    'Swap truth with question and observe the shift.',
    'Which veil in your stack deserves careful shaking?'
  ],
  route: {
    href: '/book/chapter/11/',
    label: '^[route/11]{continue}',
    ariaLabel: 'Continue to chapter 11'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
