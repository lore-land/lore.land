// @ts-check
/**
 * pie-reasons.mjs — why each thing is in the road: whose it is, why it is there, the shelf it leans and the dimension
 * it lives in (.spw/surfaces/shelves.spw #reasons; valence-shelves.mjs). Every whose and why rests on canon already
 * written: a passage in book/content/chapters, a card in pie-cards.mjs, a character in characters.mjs. Where nothing
 * says, whose is "nobody has said": the road keeps that as honestly as the book does. Nobody here says anything.
 * Shown under Ask, folded with the reasons, so the lanes stay quick.
 */

/** @typedef {{ whose: string, why: string, shelf: 'boon' | 'bane' | 'bone' | 'bonk' | 'honk', dimension: string, ground: string }} Reason */

export const NOBODY = 'nobody has said';

/** @type {Readonly<Record<string, Reason>>} */
export const REASONS_IN_THE_ROAD = Object.freeze({
  // The land's own people, met in the lanes.
  boof: { whose: 'the land, which she works for', why: 'her rounds cross your lanes on her own business', shelf: 'boon', dimension: 'across', ground: 'Chapter 1: Boof read the field the way she read it every morning' },
  boon: { whose: 'his own court, in Bonk City', why: 'he holds court where the pie goes, and is never smaller for it', shelf: 'boon', dimension: 'ahead', ground: 'pie-cards: a warm pie who holds court in Bonk City, serves himself in slices' },
  bane: { whose: 'himself, and he says so', why: 'a scheme is announced to anyone who did not ask, with an off switch in it', shelf: 'bane', dimension: 'across', ground: 'Chapter 4: he offered nobody a slice, then supplied his own name' },
  clown: { whose: 'Bonk City, where a pie in the face is called WAP', why: 'clowns love WAP, and wait for one', shelf: 'bonk', dimension: 'games', ground: 'pie-cards: Bonk City’s word for a pie in the face, after the sound it makes' },
  mime: { whose: 'their own street, and the quiet on it', why: 'a wall is mimed around something kept, and the baneberries gathered for Mr. BaneWAP go all the same', shelf: 'bane', dimension: 'across', ground: 'pie-cards: palms flat on a wall that is not there' },
  mimewall: { whose: 'the mime beside it', why: 'invisible, and also there: the line of a quiet someone is keeping', shelf: 'bonk', dimension: 'across', ground: 'pie-cards: a shimmer and two gloves show where' },
  march: { whose: 'the mimes, by their own placards; Mr. BaneWAP likes to say he organised them', why: 'a silent protest against WAP, across every lane but one', shelf: 'bane', dimension: 'across', ground: 'pie-cards: placards blank but one, MAW, and a pie crossed out' },
  subject: { whose: 'an empire nobody meant to be in', why: 'halfway through an errand when the lanes came through', shelf: 'bane', dimension: 'across', ground: 'Chapter 11 (pie-cards): halfway through an errand in an empire nobody meant to be in' },
  clerk: { whose: 'the Feast of the Uneven Slice, whose slips they keep', why: 'every knock gets a slip: DAMAGE at the top, a line for the cause', shelf: 'bane', dimension: 'across', ground: 'Chapter 15 (pie-cards): writes DAMAGE at the top of a slip, and under that, a line for the cause' },
  // The road itself, and what stands in it.
  stone: { whose: 'the field, older than the furrow', why: 'it has never once moved for anyone', shelf: 'bone', dimension: 'across', ground: 'Chapter 14 (pie-cards): older than the furrow' },
  hole: { whose: 'someone with a good nose, in the field; in the lanes, a cobble gone', why: 'freshly dug, by someone who smelled something', shelf: 'bonk', dimension: 'height', ground: 'Chapter 1: Boof put her nose to the ground and read the field' },
  ditch: { whose: NOBODY, why: 'across every lane, in the field and at the gate; it wanted a hop', shelf: 'bonk', dimension: 'height', ground: 'pie-cards: it wanted a hop' },
  post: { whose: 'Bonk City, whose posts curve for everyone', why: 'the streets did not follow straight surveyor lines; one post leaned two hundred years and stood up after the figure passed', shelf: 'bone', dimension: 'across', ground: 'Chapter 6: curving bronze posts, rain-slick arches, and leaning panes' },
  pane: { whose: 'Bonk City, whose glass is made of every knock it took', why: 'it remembers being struck, and bends what passes through', shelf: 'bonk', dimension: 'depth', ground: 'Chapter 6: leaning panes; pie-cards: it remembers being struck' },
  snail: { whose: NOBODY, why: 'it was there first, clamped flat to humming glass in a storm', shelf: 'bone', dimension: 'height', ground: 'pie-cards: clamps itself flat to humming glass in a storm. Was there first' },
  spool: { whose: NOBODY, why: 'rolled in from a chapter nobody here was in', shelf: 'bonk', dimension: 'across', ground: 'pie-cards: rolled in from a chapter nobody here was in' },
  pigeon: { whose: 'the parcel gate, whose counterweight it sleeps on', why: 'it rides the storm-weight up and down all night without waking', shelf: 'honk', dimension: 'height', ground: 'Chapter 15: an iron counterweight the size of a bread-oven, riding in a slot in the wall' },
  wasps: { whose: 'the blackthorn, where the crown-wasps build', why: 'they build paper crowns from fence rails and old auction notices, and knew sweetness before anyone', shelf: 'bane', dimension: 'height', ground: 'Chapter 11: all spring the crown-wasps had been building in the blackthorn' },
  throne: { whose: 'the rented court', why: 'gilt over pine, set down exactly where it was not wanted', shelf: 'bane', dimension: 'across', ground: 'Chapter 11 (pie-cards): gilt over pine, set down exactly where it was not wanted' },
  chair: { whose: 'the long table in the plaza', why: 'pulled out for someone else', shelf: 'boon', dimension: 'across', ground: 'Chapter 15: the city had already set a second place' },
  dividers: { whose: 'the night school, whose pupils come after the day’s work', why: 'walked round a paper pie for luck; it never comes out even, and the sliver left over is the luck', shelf: 'bone', dimension: 'games', ground: 'Chapter 15: porters and lamplighters and laundresses who come after the day’s work to learn their letters' },
  banner: { whose: NOBODY, why: 'in colours nobody ordered, come down across the lane', shelf: 'bane', dimension: 'across', ground: 'pie-cards: in colours nobody ordered' },
  table: { whose: 'the city, which set it', why: 'at its head a second place, with a cloth, a cup and a plate, for the one who is coming', shelf: 'boon', dimension: 'across', ground: 'Chapter 15: a second place, with a cloth, and a cup, and a plate' },
  puddle: { whose: NOBODY, why: 'standing water, ringed with ripples', shelf: 'bonk', dimension: 'across', ground: 'pie-cards: standing water, ringed with ripples' },
  frost: { whose: 'the field, held still', why: 'frost in the furrows: the morning has not moved yet', shelf: 'bone', dimension: 'timing', ground: 'Chapter 1: loam-dark under the rime' },
  sack: { whose: 'the Feast of the Uneven Slice, through the parcel gate', why: 'fine flour stamped for the feast; three sacks were spoiled through, and the porter signed for them', shelf: 'bane', dimension: 'across', ground: 'Chapter 15: the door the city takes its flour through' },
  // What helps, and what is kept.
  berry: { whose: 'the ants, who keep them under the snow', why: 'a little borrowed summer: they foresee kindly', shelf: 'boon', dimension: 'ahead', ground: 'Chapter 1 (pie-cards): kept under the snow by the ants' },
  baneberry: { whose: 'Mr. BaneWAP, who is made of them', why: 'they foretell chaos that comes because it was said; nobody eats them for pleasure, but a pinch in the pot sets a jam', shelf: 'bane', dimension: 'ahead', ground: 'pie-cards: what Mr. BaneWAP is made of' },
  boneberry: { whose: 'where they grow: Bonk City, Bone.land, the parcel gate', why: 'a whole meal in a berry, grown, not raised', shelf: 'bone', dimension: 'depth', ground: 'Chapter 10 (pie-cards): they taste of the place they grow' },
  furrow: { whose: 'the field, kept warm by torches along the roots', why: 'something keeps the field warm from underneath', shelf: 'boon', dimension: 'depth', ground: 'Chapter 1 (pie-cards): torches along the roots' },
  pile: { whose: NOBODY, why: 'what a burst bag leaves, heaped like a ramp', shelf: 'bone', dimension: 'height', ground: 'pie-cards: what a burst bag leaves' },
  arrow: { whose: 'the crosswind council, whose iron weathercocks point', why: 'painted where the council votes; the lanes take its word', shelf: 'bone', dimension: 'ahead', ground: 'Chapter 4: under crosswind weather, on Council Hill' },
  vane: { whose: 'the crosswind council', why: 'three faced to the pie, three tails to him, the seventh spinning on its pin', shelf: 'bone', dimension: 'ahead', ground: 'Chapter 4 (pie-cards): iron, on a pole by the lanes' },
  horn: { whose: NOBODY, why: 'left on a stand by someone who meant to start something', shelf: 'honk', dimension: 'sound', ground: 'pie-cards: left on a stand by someone who meant to start something' },
  beaver: { whose: 'its own time, which it lends', why: 'in no hurry; where a beaver has been, boonberries come up behind', shelf: 'honk', dimension: 'timing', ground: 'pie-cards: keeps its own time, and lends it' },
  wonder: { whose: 'the chapter going by', why: 'one of the land’s own, named where the book has it', shelf: 'boon', dimension: 'ahead', ground: 'pie-cards: named in the chapter going by' },
  egg: { whose: NOBODY, why: 'it is not explained', shelf: 'boon', dimension: 'depth', ground: 'Chapter 1 (pie-cards): it is not explained' },
  // The ants' own (the anthills trial; .spw/surfaces/gossip-and-kitchens.spw).
  anthill: { whose: 'the torch-ants, who keep the streets lit along the berry roots', why: 'where the boonberries are rolled home; run into it and they put their crumbs down, lift weights, and gossip', shelf: 'honk', dimension: 'across', ground: 'Chapter 1: the ant hearths along the berry roots; the maker, 2026-11-11: ants roll boonberries home and gossip at the anthill' },
  antgift: { whose: 'the ants, carrying', why: 'a crumb and a scrap of the book, taken to the edge of the road as a gift for the crows and ravens', shelf: 'honk', dimension: 'across', ground: 'the maker, 2026-11-11: ants carry lore with crumbs, often as fragments of gifts to ravens and crows' },
  corvid: { whose: NOBODY, why: 'a crow or a raven at the edge of the road, taking what the ants bring', shelf: 'honk', dimension: 'ahead', ground: 'the maker, 2026-11-11; the corvids have no names yet' },
  // A season's own (the seasons trial; .spw/surfaces/seasons.spw).
  dolphin: { whose: 'the salt sea under the crust', why: 'come up with the Ring Tide, for a few days, to carry a pie a while', shelf: 'boon', dimension: 'height', ground: 'the maker, 2026-11-12: a sequence of a few days where dolphins aid the carrier significantly' },
  donut: { whose: 'the Ring Tide, which leaves them', why: 'a ring of dough on the road, warm, a boost for whoever passes through it', shelf: 'bone', dimension: 'across', ground: 'the maker, 2026-11-12: donuts add a boost or power-up while the tide is in' },
  place: { whose: 'the city, which sets it', why: 'a cloth, a cup and a plate by the road, set early for the one who is coming', shelf: 'boon', dimension: 'across', ground: 'Chapter 15: the city had already set a second place, with a cloth, and a cup, and a plate, for the one who was coming' },
  switch: { whose: 'Mr. BaneWAP, by contract', why: 'every scheme of his has one; he wrote his contract, badly', shelf: 'bone', dimension: 'games', ground: 'Chapter 11 (pie-cards): it is in his contract. He wrote his contract' }
});

/** Why a thing is in the road, or null for a thing the road does not keep. @param {string} kind @returns {Reason | null} */
export const reasonFor = (kind) => REASONS_IN_THE_ROAD[kind] || null;
