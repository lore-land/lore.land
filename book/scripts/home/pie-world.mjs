/**
 * pie-world.mjs — the cast of Exactly One Pie, as data.
 *
 * Scenes, the things in the lanes, who may wear the hat, what a spill is
 * blamed on, how an impact looks, and the small games a horn can start.
 * These are the rules the lanes start from. Once pie-rules.spw has been
 * read, a visit may replace the knocks, the tune and the whimsy
 * (pie-spw.mjs). Until then, these play.
 *
 * A derived file keeps a sidecar (asset-sidecar.mjs): a sound take, a share
 * card, an icon. This catalogue is not a derived file, so the game imports
 * it before the first frame.
 */

export const SCENES = Object.freeze([
  { id: 'field', card: 'The field, frost in the furrows.', tint: 'frost', rain: false, kinds: ['stone', 'hole', 'stone', 'hole', 'pigeon', 'snail', 'ditch'], low: ['frost', 'frost', 'furrow'] },
  { id: 'gate', card: 'The parcel gate, in a storm.', tint: 'night', rain: true, kinds: ['sack', 'sack', 'pigeon', 'post', 'ditch'] },
  { id: 'lanes', card: 'The lanes, which curve for everyone.', tint: 'bronze', rain: false, kinds: ['post', 'post', 'snail', 'spool', 'pigeon', 'pane', 'hole', 'mime'] },
  { id: 'plaza', card: 'The plaza, where the pie holds court.', tint: 'ember', rain: false, kinds: ['clerk', 'wasps', 'post', 'spool', 'dividers', 'banner', 'pane', 'mime', 'march'], presence: 'boon' },
  { id: 'court', card: 'The rented court, arriving in pieces.', tint: 'berry', rain: false, kinds: ['throne', 'subject', 'wasps', 'post', 'banner', 'mime', 'march'], presence: 'bane' },
  { id: 'table', card: 'The long table. A second place is set.', tint: 'gold', rain: false, kinds: ['chair', 'chair', 'clerk', 'dividers', 'wasps', 'table'] }
]);
export const WIDE = new Set(['banner', 'table', 'ditch', 'march']);

/* What a knock costs. Every hazard tilts the pie — the level is the only thing at stake, and
 * at the top it spills — and some take a little more besides. (Read by the legend, too.) */
export const KNOCKS = Object.freeze({
  post: { tilt: 0.5 },
  stone: { tilt: 0.6 },
  hole: { tilt: 0.55, drop: true, label: 'IN A HOLE' },
  mime: { tilt: 0.3, label: 'MIMED AT' },
  mimewall: { tilt: 0.45, label: 'INVISIBLE WALL' },
  march: { tilt: 0.45, label: 'MIMES AGAINST WAP' },
  ditch: { tilt: 0.6, drop: true, label: 'IN THE DITCH' },
  pane: { tilt: 0.45, label: 'GLASS' },
  throne: { tilt: 0.55 },
  chair: { tilt: 0.45 },
  table: { tilt: 0.6 },
  banner: { tilt: 0.45 },
  subject: { tilt: 0.4 },
  snail: { tilt: 0.35 },
  clerk: { tilt: 0.35, tax: true, label: 'DAMAGE' },
  dividers: { tilt: 0.3, crust: 0.15, filling: 0.15, label: 'MEASURED' },
  spool: { tilt: 0.3, shove: true, label: 'TRIPPED' },
  pigeon: { tilt: 0.25, crust: 0.3, label: 'PECKED' },
  wasps: { tilt: 0.25, filling: 0.3, label: 'STUNG' }
});
export const SLIPS = new Set(['puddle', 'frost', 'sack']);
/* Low enough to jump: a hop clears them. (Berries, wonders and clowns are met in the air too.) */
export const LOW = new Set(['baneberry', 'stone', 'hole', 'ditch', 'snail', 'spool', 'puddle', 'frost', 'sack', 'pile', 'furrow', 'banner']);
export const JUMP_DUR = 0.62;
/* The implicit z: how high each thing stands, as its own dimension of play. 0 ground (puddles, holes,
 * arrows: underfoot) · 1 low (a hop clears it) · 2 body (posts, glass, people: too tall, though a high
 * hop clears the lighter ones) · 3 air (pigeons, wasps: drawn over the carrier) · 4 high (the Egg). */
export const Z = Object.freeze({
  puddle: 0, frost: 0, hole: 0, ditch: 0, furrow: 0, pile: 0, arrow: 0,
  sack: 1, stone: 1, snail: 1, spool: 1, banner: 1, baneberry: 1, berry: 1, boneberry: 1, beaver: 1, switch: 1,
  post: 2, pane: 2, chair: 2, throne: 2, table: 2, mime: 2, mimewall: 2, march: 2, clerk: 2, subject: 2, dividers: 2, clown: 2, vane: 2, horn: 2, wonder: 2,
  pigeon: 3, wasps: 3, egg: 4
});
/* A high hop (the third of a chain) clears the lighter of the tall things too. */
export const HIGH_CLEARS = new Set(['post', 'pane', 'chair', 'stone', 'snail', 'spool', 'banner', 'hole', 'ditch']);

/* Learnability: the book introduces the lanes as it goes. A thing first comes up the lanes in the
 * chapter where the story is ready for it (or anywhere, once the visitor has met it), and the
 * first meeting is said under the screen, with what it does. */
export const INTRO = Object.freeze({
  stone: 1, hole: 1, frost: 1, furrow: 1, pigeon: 1, snail: 1,
  ditch: 2, puddle: 2, beaver: 2,
  sack: 3, post: 3, spool: 3, pane: 3, boneberry: 3,
  throne: 4, subject: 4, wasps: 4, banner: 4, baneberry: 4, bane: 4, arrow: 4, vane: 4, horn: 4,
  mime: 5,
  clerk: 6, dividers: 6, chair: 6, march: 6, boon: 6
});
export const MEET = Object.freeze({
  stone: ['A field stone', 'Red underfoot means it knocks the pie. Low enough to hop: Space.'],
  hole: ['A hole', 'Knocks, and drops you a step back down the lanes. Hop it.'],
  frost: ['Frost', 'Blue underfoot means it slips: your next step slides a lane further.'],
  furrow: ['A warm furrow', 'Walk through it: something keeps it warm from underneath. A little crust, a little filling.'],
  pigeon: ['A gate-pigeon', 'Knocks and pecks your crust, and takes any slice thrown past it.'],
  snail: ['A pane-snail', 'Was there first. Knocks; low enough to hop.'],
  berry: ['Boonberries', 'Filling, and a glimpse: walk through them and the clear way up the lanes shows teal for a moment, before you need it.'],
  boneberry: ['A boneberry', 'Savoury, a whole meal in a berry: crust and filling both, and for a while your steps tilt less.'],
  arrow: ['An arrow on the track', 'Step on it and the needle points where it points, held there a moment: every throw while it holds is Perfect.'],
  vane: ['A weathercock by the lanes', 'Walk past it and your needle swings the way it is pointing. The lanes vote, here, with iron.'],
  horn: ['A horn on a stand', 'Step into it and a game begins: an alley of arrows, a parade of clowns down the diagonal, or the long view.'],
  pile: ['A pile of flour', 'Crust underfoot, and a ramp: a slice thrown over it is lofted.'],
  clown: ['A clown', 'The pips over its head are how much pie it wants. Throw (X, or tap where), or walk into it.'],
  wonder: ['A wonder from this chapter', 'It waits up the lanes a moment: step ahead (↑) into it to keep it.'],
  ditch: ['A ditch', 'Across every lane, with no way round. Time a hop.'],
  puddle: ['A puddle', 'Slips: the pie tilts.'],
  beaver: ['A slow beaver', 'Touch it and the land goes at its pace for a while, and you do not; berries come up behind it.'],
  sack: ['A bag of flour', 'Crust, but it sets the story back. A slice thrown into it makes a ramp.'],
  post: ['A bronze post', 'Knocks. Curves a thrown slice toward the nearest face.'],
  spool: ['A spool', 'Knocks and trips you a lane. Hop it.'],
  pane: ['A pane of Bonk glass', 'Knocks. A slice thrown at it banks off, Perfect.'],
  throne: ['A rented throne', 'Knocks hard. Gilt over pine.'],
  subject: ['A subject on an errand', 'Knocks; share a whole slice and they trade you crust.'],
  wasps: ['Crown-wasps', 'Knock, sting the filling, and snatch a thrown slice.'],
  banner: ['A fallen banner', 'A whole row with one way through, and low enough to hop.'],
  baneberry: ['A baneberry', 'It foretells, and what it says comes because it was said: let one past and a knock is on its way to that lane. Step on it and it never says; throw a slice over it and it says something kind.'],
  mime: ['A mime, and its wall', 'Both knock; both box a flat slice. A lofted slice sails over.'],
  clerk: ['A feast clerk', 'Knocks with a DAMAGE slip; share a whole slice and it is SETTLED.'],
  dividers: ['Pie-dividers', 'Two night-school pupils, two lanes: knocks, and measures off a little of both.'],
  chair: ['A chair', 'Pulled out for someone else. Knocks.'],
  table: ['The long table', 'A whole row; the empty place is the only way through.'],
  march: ['Mimes Against WAP', 'Through the gap, or over. If they out-do the pie in a chapter, they hold it: harder to wonder about pie there.']
});

/* The voyage: every chapter is a leg of the carry, in the place it happens. */
export const CHAPTER_SCENE = Object.freeze({ 1: 'field', 2: 'field', 3: 'lanes', 4: 'court', 5: 'lanes', 6: 'plaza', 7: 'lanes', 8: 'field', 9: 'lanes', 10: 'lanes', 11: 'court', 12: 'field', 13: 'table', 14: 'field', 15: 'gate' });
/* Where the Egg is likelier to be passed: the field it was found in, the theft, the door. */
export const EGG_ODDS = Object.freeze({ 1: 0.5, 11: 0.7, 13: 0.9, 14: 0.5 });
export const pad2 = (n) => String(n).padStart(2, '0');

/* Mr. BaneWAP's schemes: each announced, each with an off switch. */
export const SCHEMES = Object.freeze({
  wind: {
    says: '“Behold: a rented wind! Let us see how level your little pie stays.”',
    foiled: '“Curses. The wind was only rented anyway.”'
  },
  tax: {
    says: '“Every step shall be taxed. Every. Single. Step.”',
    foiled: '“Untaxed! Again! Do you know what a ledger costs?”'
  },
  relet: {
    says: '“These lanes are hereby re-let. Under new management. Mine.”',
    foiled: '“The lease is void? Who reads a lease?”'
  },
  march: {
    says: '“I have organised a silent protest. They agreed with me, silently. Behold: Mimes Against WAP!”',
    foiled: '“They have gone home. They did not say why. They never say anything.”'
  }
});

/* Who the hat settles on. Each carries the pie their own way. */
export const CARRIERS = Object.freeze([
  { id: 'figure', name: 'the figure in plain lines', weight: 4, step: 0.09, wobble: 0.18, hurried: 0.3, settle: 0.5, width: 24,
    knack: { id: 'fine_aim', name: 'Fine hands', says: 'The needle turns a finer notch in his hands, and every stroke noticed steadies them more.' } },
  { id: 'porter', name: 'the porter from the parcel gate', weight: 2, step: 0.13, wobble: 0.12, hurried: 0.22, settle: 0.56, width: 28, says: 'Steady as a sack of flour, and as quick.',
    knack: { id: 'long_hold', name: 'Long hold', says: 'An arrow on the track holds the needle half as long again for him.' } },
  { id: 'clerk', name: 'a feast clerk', weight: 1.5, step: 0.065, wobble: 0.23, hurried: 0.36, settle: 0.46, width: 19, says: 'Quick, precise, and nervous about the paperwork.',
    knack: { id: 'quick_feet', name: 'Quick feet', says: 'A wider moment to chain one hop into the next: the clerk is always halfway to the next thing.' } },
  { id: 'genie', name: 'the Genie, off-season', weight: 1.5, step: 0.15, wobble: 0.16, hurried: 0.26, settle: 0.7, width: 24, says: 'Glides. Settles a pie the way he settles a price.',
    knack: { id: 'true_after', name: 'True after a WAP', says: 'Each clown satisfied, the needle points true for two seconds.' } },
  { id: 'clown', name: 'a clown', weight: 1, step: 0.09, wobble: 0.25, hurried: 0.4, settle: 0.42, width: 24, says: 'A clown, carrying a pie. Everyone is nervous.',
    knack: { id: 'big_feelings', name: 'Big feelings', says: 'Everything lands bigger: a third more drama in every pop, splat and bonk.' } }
]);
/* A carrier's model, as a reader would weigh it: steady (settles a tilt), quick (between steps), calm
 * (wobbles less at a knock), unhurried (wobbles less when hurried). Each 0..1 across the five. */
export const carrierStats = (c) => {
  const span = (v, lo, hi) => Math.max(0.08, Math.min(1, (v - lo) / (hi - lo)));
  return [
    ['Steady', span(c.settle, 0.4, 0.72)],
    ['Quick', span(0.16 - c.step, 0, 0.1)],
    ['Calm', span(0.27 - c.wobble, 0, 0.16)],
    ['Unhurried', span(0.42 - c.hurried, 0, 0.21)]
  ];
};
export const carrierById = (id) => CARRIERS.find((carrier) => carrier.id === id) || CARRIERS[0];
export function drawCarrierLot(not = null) {
  const pool = CARRIERS.filter((carrier) => carrier.id !== not);
  let roll = Math.random() * pool.reduce((sum, carrier) => sum + carrier.weight, 0);
  for (const carrier of pool) {
    roll -= carrier.weight;
    if (roll <= 0) return carrier;
  }
  return pool[0];
}

/* What happened, said the way the land would say it. */
export const CAUSES = Object.freeze({
  post: 'A bronze post curves for everyone. It did not curve this time.',
  sack: 'Flour, everywhere. It does not spill a pie; it only sets the story back.',
  snail: 'A pane-snail was there first. They always are.',
  spool: 'A spool rolled in from a chapter nobody here was in.',
  pigeon: 'A gate-pigeon rose. So, briefly, did the pie.',
  dividers: 'Two night-school pupils measured the pie with brass dividers, for luck. It came out even. It never does.',
  clerk: 'A feast clerk wrote DAMAGE at the top, and under that, a line for the cause.',
  wasps: 'The crown-wasps knew sweetness before anyone.',
  banner: 'A banner in colours nobody ordered came down across the lane.',
  table: 'Straight into the long table. The second place stayed set.',
  chair: 'Somebody had pulled out a chair for someone else.',
  throne: 'A rented throne, gilt over pine, set down exactly where it was not wanted.',
  subject: 'A subject halfway through an errand. Neither of them had meant to be in an empire.',
  wobble: 'Too much, too soon. The pie had opinions about that.',
  stone: 'A field stone, older than the furrow. It has never once moved for anyone.',
  pane: 'A pane of Bonk glass. It remembers being struck, and now it remembers this.',
  mime: 'A mime, miming a wall. The wall was imaginary. The spill was not.',
  mimewall: 'An invisible wall. A mime had put it there, and had been very clear about it.',
  march: 'Mimes Against WAP, marching in silence. Nobody heard them coming; that is rather the point.',
  hole: 'A hole, freshly dug. Someone with a good nose had been looking for something warm. The pie went in first.',
  ditch: 'A ditch across every lane. It wanted a hop.',
  'wobble-clown': 'A clown cannot hold a pie that long. WAP: its own face. It counts as a spill; it was also a delight.'
});

export const WHIMSY_DEFAULTS = Object.freeze({
  clown: { pops: ['WAP!', 'SPLAT!', 'SPLORP!', 'WAPPED!', 'SPLOOSH!'], bits: 'juice', drama: 1 },
  perfect: { pops: ['PERFECT!!', 'BULLSEYE!', 'SPLENDID!'], bits: 'stars', drama: 1.4 },
  combo: { pops: ['COMBO!'], bits: 'confetti', drama: 1.2 },
  knock: { pops: ['BONK!', 'THUNK!', 'OOF!', 'CLONK!'], bits: 'crumbs', drama: 1 },
  post: { pops: ['BWONG!', 'DOINK!'], bits: 'stars', drama: 1 },
  stone: { pops: ['CLONK!', 'OOF!'], bits: 'crumbs', drama: 1 },
  hole: { pops: ['FWUMP!', 'WHOOPS!'], bits: 'flour', drama: 1 },
  ditch: { pops: ['KERFLUMP!'], bits: 'flour', drama: 1.1 },
  pane: { pops: ['TINK!', 'CRACK!'], bits: 'glass', drama: 1.1 },
  wasps: { pops: ['BZZT!', 'OW OW OW!'], bits: 'crumbs', drama: 0.9 },
  pigeon: { pops: ['PECK!', 'COO?!'], bits: 'feathers', drama: 0.9 },
  spool: { pops: ['WHOOPS!', 'TRIP!'], bits: 'confetti', drama: 0.9 },
  mime: { pops: ['…!', '(silently) OOF'], bits: 'none', drama: 0.7 },
  mimewall: { pops: ['…!'], bits: 'none', drama: 0.7 },
  march: { pops: ['…!!!'], bits: 'none', drama: 0.9 },
  clerk: { pops: ['DAMAGE!', 'STAMPED!'], bits: 'confetti', drama: 1 },
  switch: { pops: ['FOILED!', 'CLICK!'], bits: 'stars', drama: 1.3 },
  spill: { pops: ['SPLAT!!', 'EXACTLY ONE.'], bits: 'juice', drama: 1.8 },
  hop: { pops: ['HOP!', 'WHEE!'], bits: 'flour', drama: 0.7 },
  arrow: { pops: ['→ AIMED!', 'ON THE ARROW!'], bits: 'stars', drama: 0.7 },
  horn: { pops: ['TOOT!'], bits: 'confetti', drama: 1.3 }
});
export const SCENE_WHIMSY_DEFAULTS = Object.freeze({
  field: { drama: 0.9, material: 'frost' }, gate: { drama: 1, material: 'steam' }, lanes: { drama: 1.1, material: 'brass' },
  plaza: { drama: 1.3, material: 'flour' }, court: { drama: 1.2, material: 'glass' }, table: { drama: 1, material: 'oak' }
});
export const BIT_COLORS = Object.freeze({
  juice: ['#4d9f97', '#f4b25c', '#c86d2c'], crumbs: ['#e0a95a', '#b9773a', '#f2d29a'], feathers: ['#9aa3ad', '#d8dde3'],
  glass: ['#cfeaf0', '#7fb4c0', '#ffffff'], confetti: ['#d6473e', '#f2c14e', '#4d9f97', '#7a3f9a'], stars: ['#f2c14e', '#ffe36b'], flour: ['#faf6ec', '#efe6d2']
});

export const DIMENSIONS_GAINED = Object.freeze([
  [4, 'height', 'The lanes have height now', 'Arrows on the track and weathercocks by the lanes turn your aim. Hop in a chain and the third, a high hop, clears the lighter tall things (⤒⤒).'],
  [6, 'games', 'The lanes have games now', 'A brass horn up the lanes starts one: an alley of arrows, or a parade down the diagonal.'],
  [10, 'depth', 'The lanes have depth now', 'A horn may open the long view: the road recedes to a far point, and you see what is coming sooner.']
]);
export const MINIS = Object.freeze({
  alley: { from: 4, dur: 8, title: 'Vane Alley', line: 'Arrows on every row. Step on one and the needle points true and holds; a throw while it holds is Perfect.', word: 'VANE ALLEY!' },
  parade: { from: 6, dur: 9, title: 'The Parade', line: 'Clowns come down the diagonal from one side, and the needle holds their angle. WAP them as they come.', word: 'PARADE!' },
  long_view: { from: 10, dur: 10, title: 'The Long View', line: 'The lanes recede to a far point. You see what is coming sooner; every hop clean and every WAP counts.', word: 'THE LONG VIEW' }
});
