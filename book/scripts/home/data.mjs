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
    logline: 'At dawn, Boof digs a warm egg out of a frozen furrow — an unspent wish, humming like a held breath, that every map in Boon.land refuses to write down.',
    spw: '^[chapter/01]{ ("boon.land") [ <dawn>{ cactus wakes } ] }'
  },
  {
    number: 2,
    title: 'The First Echo',
    logline: 'The grove repeats the egg a beat late — the wish rehearsing futures it has not decided to grant.',
    spw: '^[chapter/02]{ ("bane.land") [ <echo>{ distant drums answer } ] }'
  },
  {
    number: 3,
    title: 'Signals in the Sand',
    logline: 'Where two old routes want to be one turn, Boof digs up a Discount Genie who can grant anything — except see what she wants.',
    spw: '^[chapter/03]{ ?[signal]{ dunes whisper old routes } }'
  },
  {
    number: 4,
    title: 'Crosswind Council',
    logline: 'No law on the hill covers the egg — a wish is the largest key ever cut, and Mr. BaneWAP wants it filed, appraised, and auctioned to himself.',
    spw: '^[chapter/04]{ &[council]{ boon + bane negotiate } }'
  },
  {
    number: 5,
    title: 'The Quiet Rift',
    logline: 'Two claims pull at one warm egg until the floor itself parts — and the crack beneath the hall is still singing the price of a grand wish granted centuries ago.',
    spw: '^[chapter/05]{ ~[rift]{ calm outside, fracture within } }'
  },
  {
    number: 6,
    title: 'Lanterns of Bonk City',
    logline: 'In a labyrinth of lantern-light, Mr. BoonWAP — a warm pie who serves himself and is never smaller — asks Boof the one question she cannot answer yet.',
    spw: '^[chapter/06]{ ("bonk.city") [ ![lantern]{ streets ignite } ] }'
  },
  {
    number: 7,
    title: 'Blueberry Oath',
    logline: 'At the market stone Boof swears the only oath a wish allows: to spend it when the want is true — and learns the shadow price, that every spent wish owes a coincidence to a stranger.',
    spw: '^[chapter/07]{ <oath>{ boof binds fate at the ball } }'
  },
  {
    number: 8,
    title: 'Songs of the Watering Eye',
    logline: 'At a tavern leaning over a well that folds every face it has held, the Genie prices wishes for locals — and Boof\'s small asks come back unpriceable.',
    spw: '^[chapter/08]{ #[song]{ memory resonates in water } }'
  },
  {
    number: 9,
    title: 'Shards of Nine Honks',
    logline: 'On the ridge, eight honks lie out as shards of sound — and the pieces assemble into a shape with one hole, exactly egg-sized.',
    spw: '^[chapter/09]{ *[relic]{ nine honks scatter into night } }'
  },
  {
    number: 10,
    title: 'Bone.land Resonance',
    logline: 'In Bone.land\'s timber hall, a pie of clean-boiled honesty sets the Egg on the great frame and listens to what it will bear — and the answer, rung through every beam, ends BaneWAP\'s patience: the smallest wishes have the longest arcs.',
    spw: '^[chapter/10]{ ("bone.land") [ <concert>{ truth shakes the veil } ] }'
  },
  {
    number: 11,
    title: 'Paradox Bloom',
    logline: 'BaneWAP seizes the egg and wishes huge — and the wish grants at once, minimum-viable, an empire hollow as a rented crown.',
    spw: '^[chapter/11]{ ~[paradox]{ impossible paths flower } }'
  },
  {
    number: 12,
    title: 'The Last Confluence',
    logline: 'Boof finally knows her wish, and it is small: one warm furrow kept open, always, for whatever arrives next without a receipt.',
    spw: '^[chapter/12]{ &[confluence]{ all threads merge } }'
  },
  {
    number: 13,
    title: 'The Shell-Shaped Door',
    logline: 'The spent wish sounds as the ninth honk; the maps take the ink at last, and the empty shell waits beside a blank last line — for the next wish, and for whoever is coming to make it.',
    spw: '^[chapter/13]{ ^[canon]{ world records itself and loops } }'
  }
];

export function chapterHref(number) {
  return withSiteBase(`/book/chapter/${String(number).padStart(2, '0')}`);
}
