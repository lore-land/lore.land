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
    logline: 'At dawn, Boof digs a warm egg out of a frozen furrow — and every map in Boon.land pretends it was never there.',
    spw: '^[chapter/01]{ ("boon.land") [ <dawn>{ cactus wakes } ] }'
  },
  {
    number: 2,
    title: 'The First Echo',
    logline: 'The grove repeats the egg a beat late — so there always seems to be a second one just out of sight.',
    spw: '^[chapter/02]{ ("bane.land") [ <echo>{ distant drums answer } ] }'
  },
  {
    number: 3,
    title: 'Signals in the Sand',
    logline: 'Two old routes want to be one turn. The egg is the only witness that both were true.',
    spw: '^[chapter/03]{ ?[signal]{ dunes whisper old routes } }'
  },
  {
    number: 4,
    title: 'Crosswind Council',
    logline: 'At council, keys may be filed smaller, never grown in secret. No key yet covers the egg.',
    spw: '^[chapter/04]{ &[council]{ boon + bane negotiate } }'
  },
  {
    number: 5,
    title: 'The Quiet Rift',
    logline: 'Two receipts cannot both post. The rift is the song of that disagreement.',
    spw: '^[chapter/05]{ ~[rift]{ calm outside, fracture within } }'
  },
  {
    number: 6,
    title: 'Lanterns of Bonk City',
    logline: 'Bonk City turns impact into glass: lanterns that show light without claiming to be it.',
    spw: '^[chapter/06]{ ("bonk.city") [ ![lantern]{ streets ignite } ] }'
  },
  {
    number: 7,
    title: 'Blueberry Oath',
    logline: 'An oath is a key given in public, paid in fruit, with the egg as witness.',
    spw: '^[chapter/07]{ <oath>{ boof binds fate at the ball } }'
  },
  {
    number: 8,
    title: 'Songs of the Watering Eye',
    logline: 'The Watering Eye is a well that folds every face it has held. The egg\'s heat names a debt in the water.',
    spw: '^[chapter/08]{ #[song]{ memory resonates in water } }'
  },
  {
    number: 9,
    title: 'Shards of Nine Honks',
    logline: 'Eight honks scatter. The ninth was never sounded; its shard is the egg, and it warms.',
    spw: '^[chapter/09]{ *[relic]{ nine honks scatter into night } }'
  },
  {
    number: 10,
    title: 'Bone.land Resonance',
    logline: 'Bone.land is the small constitution — the spine that holds when the veil shakes.',
    spw: '^[chapter/10]{ ("bone.land") [ <concert>{ truth shakes the veil } ] }'
  },
  {
    number: 11,
    title: 'Paradox Bloom',
    logline: 'Bloom before seed: the egg is the seed that arrives late and is right anyway.',
    spw: '^[chapter/11]{ ~[paradox]{ impossible paths flower } }'
  },
  {
    number: 12,
    title: 'The Last Confluence',
    logline: 'Threads meet in a membrane that shares without giving the house away.',
    spw: '^[chapter/12]{ &[confluence]{ all threads merge } }'
  },
  {
    number: 13,
    title: 'Lore.Land Canon',
    logline: 'The canon records itself. A small reader can check the whole history. The last door is shell-shaped.',
    spw: '^[chapter/13]{ ^[canon]{ world records itself and loops } }'
  }
];

export function chapterHref(number) {
  return withSiteBase(`/book/chapter/${String(number).padStart(2, '0')}`);
}
