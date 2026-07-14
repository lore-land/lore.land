import { withSiteBase } from '../modules/spw-routing.mjs?v=2026_03_02.A';

export const spwPrelude = `#[canon]{
  ~[series]{ title: "Lore.Land" chapters: 13 }
  ^[intent]{ "publish the world so it can be returned to" }
  ![pillars]{ worldbuilding | code-craft | marketing | intrigue }
}`;

/**
 * Canonical chamber index for the Lore.Land monument.
 * Titles and loglines should stay in sync with book/content/chapters/*.json.
 */
export const chapterManifest = [
  {
    number: 1,
    title: 'Dawn in Boon.land',
    logline: 'A missing measure. A ledger taught to lie.',
    spw: '^[chapter/01]{ ("boon.land") [ <dawn>{ cactus wakes } ] }'
  },
  {
    number: 2,
    title: 'The First Echo',
    logline: 'The grove repeats what it cannot keep.',
    spw: '^[chapter/02]{ ("bane.land") [ <echo>{ distant drums answer } ] }'
  },
  {
    number: 3,
    title: 'Signals in the Sand',
    logline: 'Routes older than the map begin to answer.',
    spw: '^[chapter/03]{ ?[signal]{ dunes whisper old routes } }'
  },
  {
    number: 4,
    title: 'Crosswind Council',
    logline: 'Boon and bane negotiate under shared weather.',
    spw: '^[chapter/04]{ &[council]{ boon + bane negotiate } }'
  },
  {
    number: 5,
    title: 'The Quiet Rift',
    logline: 'Calm outside. Fracture in the ledger.',
    spw: '^[chapter/05]{ ~[rift]{ calm outside, fracture within } }'
  },
  {
    number: 6,
    title: 'Lanterns of Bonk City',
    logline: 'Impact becomes civic light.',
    spw: '^[chapter/06]{ ("bonk.city") [ ![lantern]{ streets ignite } ] }'
  },
  {
    number: 7,
    title: 'Blueberry Oath',
    logline: 'A binding made in public, paid in private.',
    spw: '^[chapter/07]{ <oath>{ boof binds fate at the ball } }'
  },
  {
    number: 8,
    title: 'Songs of the Watering Eye',
    logline: 'Memory resonates until it names a debt.',
    spw: '^[chapter/08]{ #[song]{ memory resonates in water } }'
  },
  {
    number: 9,
    title: 'Shards of Nine Honks',
    logline: 'Signal scatters. Collection begins.',
    spw: '^[chapter/09]{ *[relic]{ nine honks scatter into night } }'
  },
  {
    number: 10,
    title: 'Bone.land Resonance',
    logline: 'Structure shakes the veil and holds.',
    spw: '^[chapter/10]{ ("bone.land") [ <concert>{ truth shakes the veil } ] }'
  },
  {
    number: 11,
    title: 'Paradox Bloom',
    logline: 'Impossible paths flower into usable form.',
    spw: '^[chapter/11]{ ~[paradox]{ impossible paths flower } }'
  },
  {
    number: 12,
    title: 'The Last Confluence',
    logline: 'Threads merge without erasing their sources.',
    spw: '^[chapter/12]{ &[confluence]{ all threads merge } }'
  },
  {
    number: 13,
    title: 'Lore.Land Canon',
    logline: 'The world records itself—and leaves a door open.',
    spw: '^[chapter/13]{ ^[canon]{ world records itself and loops } }'
  }
];

export function chapterHref(number) {
  return withSiteBase(`/book/chapter/${String(number).padStart(2, '0')}`);
}
