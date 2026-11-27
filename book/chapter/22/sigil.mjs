import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-22-sigil',
  title: 'Copper Chute Sigil',
  phrase: '^[chapter/22]{~<copper_chute & return_duct>{#[parcel]{carry by hand}}}',
  meaning: 'Capsule mode: pass swiftly through the pipe; anything that cannot survive translation must still be carried by hand.',
  prompts: [
    'What came out of a fast channel as a description of somebody else’s bundle?',
    'Which warm tin deserves to be carried up the stairs instead of dropped down a chute?',
    'Where should you pass through cleanly without ever camping inside?'
  ],
  route: {
    href: '/book/chapter/23/',
    label: '^[route/23]{rehearsal of the night school}',
    ariaLabel: 'Continue to chapter 23: Rehearsal of the Night School'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
