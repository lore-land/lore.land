import { withSiteBase } from '../modules/spw-routing.mjs?v=2026_03_02.A';

export const spwPrelude = `#[canon]{
  ~[series]{ title: "Lore.Land" chapters: 13 }
  ^[intent]{ "tell the tale in Spw syntax" }
}`;

export const chapterManifest = [
  { number: 1, title: 'Dawn in Boon.land', spw: '^[chapter/01]{ ("boon.land") [ <dawn>{ cactus wakes } ] }' },
  { number: 2, title: 'The First Echo', spw: '^[chapter/02]{ ("bane.land") [ <echo>{ distant drums answer } ] }' },
  { number: 3, title: 'Signals in the Sand', spw: '^[chapter/03]{ ?[signal]{ dunes whisper old routes } }' },
  { number: 4, title: 'Crosswind Council', spw: '^[chapter/04]{ &[council]{ boon + bane negotiate } }' },
  { number: 5, title: 'The Quiet Rift', spw: '^[chapter/05]{ ~[rift]{ calm outside, fracture within } }' },
  { number: 6, title: 'Lanterns of Bonk City', spw: '^[chapter/06]{ ("bonk.city") [ ![lantern]{ streets ignite } ] }' },
  { number: 7, title: 'Blueberry Oath', spw: '^[chapter/07]{ <oath>{ boof binds fate at the ball } }' },
  { number: 8, title: 'Songs of the Watering Eye', spw: '^[chapter/08]{ #[song]{ memory resonates in water } }' },
  { number: 9, title: 'Shards of Nine Honks', spw: '^[chapter/09]{ *[relic]{ nine honks scatter into night } }' },
  { number: 10, title: 'Bone.land Resonance', spw: '^[chapter/10]{ ("bone.land") [ <concert>{ truth shakes the veil } ] }' },
  { number: 11, title: 'Paradox Bloom', spw: '^[chapter/11]{ ~[paradox]{ impossible paths flower } }' },
  { number: 12, title: 'The Last Confluence', spw: '^[chapter/12]{ &[confluence]{ all threads merge } }' },
  { number: 13, title: 'Lore.Land Canon', spw: '^[chapter/13]{ ^[canon]{ world records itself and loops } }' }
];

export function chapterHref(number) {
  return withSiteBase(`/book/chapter/${String(number).padStart(2, '0')}`);
}
