import { registerChapterSigil as register } from '../../scripts/modules/chapter-sigil.mjs?v=2026_07_18.A';

const CONFIG = {
  tagName: 'chapter-26-sigil',
  title: 'Uneven Slice Sigil',
  phrase: '^[chapter/26]{^{great_table & uneven_slice}{#[ring]{turn onward whole}}}',
  meaning: 'Integration mode: one honest spill turns an unclosed circle onward without resetting, leaving room for the path.',
  prompts: [
    'When has one small unexpected spill let a tight circle turn cleanly onward?',
    'Who deserves to sit at the head of the table while everyone else carries plates?',
    'What mystery in your furrow is warmer left unexplained?'
  ],
  route: {
    href: '/book/chapter/01/',
    label: '^[route/01]{begin again · book one}',
    ariaLabel: 'Return to chapter 01: Dawn in Boon.land'
  }
};

export function registerChapterSigil(target) {
  return register(CONFIG, target);
}
