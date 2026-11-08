/**
 * pie-game.mjs — Exactly One Pie (PLAN.E L28).
 *
 * Someone is destined to spill exactly one pie. Someone in a hat carries one
 * through the book, chapter by chapter, while the land streams down at them;
 * the cabinet holds still and the story goes by it, like a ship through the
 * book's own space (story-boonhonk.spw#trope_physics, orthogonal_motion).
 *
 *   voyage     every chapter is a leg of the carry, in the place it happens (the frosted
 *              field, the lanes, the plaza, the rented court, the long table, the parcel
 *              gate), as long as its prose. The chapter's own words (variant zero) go by on
 *              one side of the cabinet, the passage passing now level with the carrier; its
 *              wonders wait on the other. After Chapter Fifteen, the book again, faster.
 *              A track of fifteen dots at the top says where the carry is.
 *   the hat    it is not always him under it. The chosen title floats, like the hat, and
 *              may be worn by the wrong person for a while without becoming false
 *              (trope_physics, chosen_one): the figure in plain lines, the porter, a feast
 *              clerk, the Genie, a clown. At a new chapter it may move on.
 *   step       ← → / A D across a lane; ↑ ↓ / W S ahead or back, four steps up the lanes;
 *              a drag in the lanes (a step for every half lane it crosses, as it goes; a quick
 *              flick is one); or the step buttons. Up the lanes is where wonders wait,
 *              and where what is coming comes sooner.
 *   jump       Space or J, the jump button, or a tap on the carrier: a hop. Low things pass
 *              under it — stones, snails, spools, puddles, frost, bags and piles of flour, a
 *              fallen banner — and are cleared for good (a slice readies). Posts, glass,
 *              tables and people are too tall. It lands with a little jostle. A slice thrown
 *              at the top of a hop is lofted as if off a ramp, and can be Perfect.
 *   tilt       the one thing at stake. Every step tilts the pie a little, hurried steps
 *              more; it settles if you let it. Tilted all the way, it spills.
 *   knocks     hazards wear a red ring at their foot. A knock tilts the pie by what hit it
 *              (shown as it happens: TILT +50%), and some take more — wasps sting the filling,
 *              pigeons peck the crust, a spool trips you a lane, the dividers measure off a
 *              little of both. A breath of grace after, while the carrier blinks; the screen
 *              shakes and reddens. The spill is blamed on the last knock. Slips wear a blue
 *              ring: puddles tilt, frost slides your next step a lane further, a bag of flour
 *              sets the story back.
 *   clowns     clowns love WAP: a pie in the face. They drift toward the pie; step into one,
 *              or throw, and WAP — and the pie on the plate is no smaller (wonder_about_pie).
 *              WAPs close together are a combo: the pie steadies, and from three a slice is
 *              ready at once.
 *   throw      X or F along the aim needle from the pie; or click or tap the lanes to throw
 *              right there; or drag from the pie and let go. The needle holds where it was
 *              left: only something done turns it (Q/E or [ ], a pointer, a tap, a drag from
 *              the pie, a knock that swings the carrier, remainder-moths leading it to the
 *              nearest face). It does not home. When the needle lines up with a
 *              clown's face (or Mr. BaneWAP's off switch) the ring turns gold. Dead centre, off
 *              a wall, off Bonk glass or off a ramp is Perfect: it counts twice. Bronze posts
 *              bend a slice; wasps and pigeons snatch it; anything solid takes it with a splat.
 *   aura       the pie in hand stays whole because an aura keeps replenishing it: flour for
 *              the crust, boonberries for the filling. Every slice draws on both; a wasted one
 *              costs more. Short of either, the slice goes without it — crust and no filling,
 *              filling and no crust, or crumbs — and the clown is satisfied anyway (it counts
 *              once). A thin pie tips more easily.
 *   flour      a bag feeds the crust and pushes the carry back in the story — back along this
 *              chapter or, early on, into the last. It never slows the carrier. A pile is a
 *              little crust, and a ramp: a slice over it is lofted clean over what is next.
 *   wonders    the chapter's own creatures, contrivances, bracework and sayings (almanac.json)
 *              wait a moment up the lanes, then go about their business. Steer into one and it
 *              is kept in the almanac, and does in the lanes what it does in the book, keeping
 *              the carrier company while it lasts (drawEscorts): torch-ants light your lane and
 *              warm the furrows ahead; echo-wrens perch on the pie and say your throws again;
 *              the lag-stag's prints land a beat late, and so does the land; remainder-moths
 *              lead the needle; pane-snails forgive the panes ahead.
 *   powers     every gift is a Spw spell (pie-powers.mjs): ~ what lasts, % how much, * charges,
 *              ! at once, &with / &without how the land answers. A visit can carry other spells
 *              (?powers=, or the bench on the page); each spill writes a provenance card in Spw.
 *   rules      .spw/runtime/pie-rules.spw, read by the real Spw parser when the page is quiet
 *              (pie-spw.mjs): =tune{} (TUNE), !knocks{} (over KNOCKS), *powers{} with the references
 *              each dispatches (^card, !sound, @voice, a quoted path). The game is a stress test of
 *              the language too: reads measured, readers compared, rules fuzzed (#pie-stress).
 *   berries    three kinds of foretelling (berries.json). Boonberries foresee kindly: filling,
 *              and a glimpse of the clear way, in teal. Baneberries foretell chaos that comes
 *              because it was said: let one past and its lane is posted in violet, and the knock
 *              comes; squashed, it never says; sweetened, it foretells boonberries. Boneberries
 *              promise nothing and feed you: savoury, tasting of the region, and fed (steps
 *              tilt less).
 *   sound      one bus, panned to where things happen; what the land gives plays in the
 *              chapter's pentatonic key, climbing as it comes (minor while the mimes hold it);
 *              knocks are out of key; slow time muffles, the mimes' lead thins; footsteps know
 *              grass from cobble.
 *   slow       a slow beaver ambles through the lanes now and then: steer into it and the land
 *              goes at its pace for a while (the carrier does not), so dodging is easier. The
 *              lag-stag does the same. Slowing is a gift here, never a penalty.
 *   rich       the pies grow with the aura: with plenty of flour and boonberries the pie in hand
 *              swells and every slice is bigger — drawn bigger, reaching wider, and filling more
 *              of a clown's appetite (a pip and a half; two, a full pie).
 *   clowns'    each clown wants so much pie (pips over its head). Satisfied, it goes home
 *   appetite   delighted and tosses back whatever the aura is shortest of; wanting, it follows.
 *   mimes      a mime works a lane, miming a wall in the next one: invisible, and also there.
 *              Mimes Against WAP march across the lanes in silence, one gap, placards blank but
 *              one; they box any slice thrown into them, and shake flour into the air for Mr.
 *              BaneWAP (his march is a scheme now). If Mr. BoonWAP is holding court, he eats it.
 *   baneberry  what Mr. BaneWAP is made of: plum-black, a cold violet sheen. Thicker on the
 *              ground while he is about and where mimes are; a mime nearby gathers them for him,
 *              and while he is here any that get past the pie are his. Each one makes his scheme
 *              last and quicken (or, away, brings him sooner and longer). Step on them to keep
 *              them from him.
 *   flour in   flour in the air — a bag burst, a slice into a bag, a pile kicked up, a march —
 *   the air    feeds the pies: BoonWAP throws faster, pours crust and lingers; BaneWAP's scheme
 *              quickens and lasts; and either comes sooner.
 *   the Egg    now and then, at the very top of the lanes, something warm and egg-shaped. It
 *              is not for taking, and it is not explained. Pass close: the pie settles faster
 *              for a while, and the next knock is forgiven.
 *   the field  frost in the furrows; field stones; warm furrows (something keeps the field
 *              warm from underneath) that give a little of both ingredients.
 *   Boof       now and then she crosses the lanes on her own business. Brush past her and the
 *              pie steadies: she works for the land, and the land likes a level pie.
 *   presences  two of the quinary five come and go. Mr. BoonWAP, a sentient pie who means
 *              well, holds court: clowns flock, he flings slices of himself into their eyes,
 *              pours filling back into the aura and catches what is wasted. Mr. BaneWAP, his
 *              foil, meddles — a rented wind, a tax on every step, the lanes re-let — and,
 *              being a proper cartoon villain, leaves a visible off switch. They never share
 *              the stage. (spwashi.com, RPG Wednesday: the quinary story bible.)
 *   lore       what the pies let slip (book/content/world/pie-lore.json), unlocked by what the
 *              visitor has found across the site and done here.
 *   caption    places and the pies' words are said under the screen, like subtitles.
 *   the end    always exactly one spill. What changes is who was under the hat, how far they
 *              carried it, and how many clowns got WAP. The hat does not fall. It never has.
 *   learning   the book introduces the lanes as it goes: each thing first comes up the lanes in
 *              the chapter the story is ready for it (INTRO; anywhere, once met), Mr. BaneWAP
 *              from Four and Mr. BoonWAP from Six, and a first meeting is said under the screen
 *              with what it does, a NEW over it while it is in view (lore.pie.v1 met).
 *   rhythm     each chapter builds toward its end; a section break in the words is a breath in
 *              the lanes (a § rule across them, a row or two with nothing to knock).
 *   carries    every chapter finished (or mostly carried when it spilled) keeps a mark
 *              (pie-carries.mjs): its tally of boon (satisfied, kept, warm), bane (knocked,
 *              boxed, fed to BaneWAP) and bone (hopped, perfect, over the mimes) leans that
 *              chapter's reading on its page (pie-projection.mjs); "so far" beside the screen
 *              shows the tally as it goes, and the page lists every chapter's mark, with a
 *              switch and a way to forget.
 *   the mimes  a contest, once Mimes Against WAP are in a chapter: pie (satisfied clowns,
 *              slices over them, baneberries sweetened or squashed, BaneWAP foiled) against
 *              mimes (slices boxed, baneberries gathered, knocks, marches that get past, his
 *              march run its course). While the mimes lead it is harder to wonder about pie:
 *              the passage's pie words go quiet, wonders show only as a shimmer until you are
 *              close, and Mr. BoonWAP mimes rather than speaks. Finish a chapter with them ahead
 *              and they hold it — its pie words go quiet on the page too — until a carry
 *              through it out-does them again.
 *   ?chapter=  1–15: start the carry there. ?scene= (a door from a chapter) starts it in that
 *              door's chapter; ?from= remembers where the reader found the game, to send them
 *              back (pie-segues.mjs). Found from a chapter page, the carry starts there.
 *
 * Drawn on a canvas in the page's own colours (the reader's binding: --hub-*),
 * except the figure, who is always the same plain ink drawing. He is never named
 * here; the others are named by what they do.
 *
 * Kept: lore.pie.v1 = { best, runs, waps, bestWaps, causes, carriers, perfects, foils,
 * reached, wasted, eggs, kept, lore, met, sound } (begin-again.mjs clears it); each
 * chapter's mark in lore.pie.chapters.v1 (pie-carries.mjs), and the reader's switch. Reduced motion:
 * no rain, no bob, no shake, no flying clowns; every control the same.
 */

import { SEGUES, segueFor, chapterWords, safeReturn, describeReturn, leaveBackNote } from '../modules/pie-segues.mjs?v=2026_11_08.J';
import { carryFor, keepCarry, mimesHold, readCarries, carriesSummary, chapterList, describeLean, leanOf, renderCarriesPanel, PIE_WORDS, LEAN_NAMES, activeCombine, recordHeardTelling, readLoreTies } from '../modules/pie-carries.mjs?v=2026_11_08.J';
import { collectWonder, KIND_SIGIL } from '../modules/almanac.mjs?v=2026_11_06.B';
import { SIGHTINGS, readSightings, recordSighting } from '../modules/sightings.mjs?v=2026_11_05.B';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';
import { CARDS, CARD_TYPES } from './pie-cards.mjs?v=2026_11_08.H';
import { turnCard as shelveCard, cardsTurned } from '../modules/collection.mjs?v=2026_11_08.J';
import { POWER_SPELLS, WORDS, powersInPlay, takePowersFromAddress, readSpells, describePower, visitSpells, setVisitSpells, powersLink, carryProvenance } from './pie-powers.mjs?v=2026_11_08.J';
import { loadRules, readRules, crossRead, fuzz, stressReport, writePower } from './pie-spw.mjs?v=2026_11_08.K';
import { renderSpell } from '../modules/spw-spell.mjs?v=2026_11_08.K';

const KEY = 'lore.pie.v1';
const W = 360;
const H = 560;
const LANES = 5;
const LANE_W = W / LANES;
const PLAYER_Y = H - 92;
const COBBLE = 24;            // px of scroll per cobble
const PRESENCE_Y = 150;       // where Mr. BoonWAP and Mr. BaneWAP float: below the toasts, above the carry
const ROWS = 4;               // how far ahead of the start line the carrier may step
const ROW_H = 64;
const rowY = (row) => PLAYER_Y - row * ROW_H;
const SLICE_COST = 0.14;      // of each ingredient, to replenish the pie after a throw
const WASTE_COST = 0.08;      // of each, what a wasted slice costs on top
const FLOUR_GIVES = 0.38;     // flour: the crust
const BERRY_GIVES = 0.3;      // boonberries: the filling
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const SCENES = Object.freeze([
  { id: 'field', card: 'The field, frost in the furrows.', tint: 'frost', rain: false, kinds: ['stone', 'hole', 'stone', 'hole', 'pigeon', 'snail', 'ditch'], low: ['frost', 'frost', 'furrow'] },
  { id: 'gate', card: 'The parcel gate, in a storm.', tint: 'night', rain: true, kinds: ['sack', 'sack', 'pigeon', 'post', 'ditch'] },
  { id: 'lanes', card: 'The lanes, which curve for everyone.', tint: 'bronze', rain: false, kinds: ['post', 'post', 'snail', 'spool', 'pigeon', 'pane', 'hole', 'mime'] },
  { id: 'plaza', card: 'The plaza, where the pie holds court.', tint: 'ember', rain: false, kinds: ['clerk', 'wasps', 'post', 'spool', 'dividers', 'banner', 'pane', 'mime', 'march'], presence: 'boon' },
  { id: 'court', card: 'The rented court, arriving in pieces.', tint: 'berry', rain: false, kinds: ['throne', 'subject', 'wasps', 'post', 'banner', 'mime', 'march'], presence: 'bane' },
  { id: 'table', card: 'The long table. A second place is set.', tint: 'gold', rain: false, kinds: ['chair', 'chair', 'clerk', 'dividers', 'wasps', 'table'] }
]);
const WIDE = new Set(['banner', 'table', 'ditch', 'march']);

/* What a knock costs. Every hazard tilts the pie — the level is the only thing at stake, and
 * at the top it spills — and some take a little more besides. (Read by the legend, too.) */
const KNOCKS = Object.freeze({
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
const SLIPS = new Set(['puddle', 'frost', 'sack']);
/* Low enough to jump: a hop clears them. (Berries, wonders and clowns are met in the air too.) */
const LOW = new Set(['baneberry', 'stone', 'hole', 'ditch', 'snail', 'spool', 'puddle', 'frost', 'sack', 'pile', 'furrow', 'banner']);
const JUMP_DUR = 0.62;

/* Learnability: the book introduces the lanes as it goes. A thing first comes up the lanes in the
 * chapter where the story is ready for it (or anywhere, once the visitor has met it), and the
 * first meeting is said under the screen, with what it does. */
const INTRO = Object.freeze({
  stone: 1, hole: 1, frost: 1, furrow: 1, pigeon: 1, snail: 1,
  ditch: 2, puddle: 2, beaver: 2,
  sack: 3, post: 3, spool: 3, pane: 3, boneberry: 3,
  throne: 4, subject: 4, wasps: 4, banner: 4, baneberry: 4, bane: 4,
  mime: 5,
  clerk: 6, dividers: 6, chair: 6, march: 6, boon: 6
});
const MEET = Object.freeze({
  stone: ['A field stone', 'Red underfoot means it knocks the pie. Low enough to hop: Space.'],
  hole: ['A hole', 'Knocks, and drops you a step back down the lanes. Hop it.'],
  frost: ['Frost', 'Blue underfoot means it slips: your next step slides a lane further.'],
  furrow: ['A warm furrow', 'Walk through it: something keeps it warm from underneath. A little crust, a little filling.'],
  pigeon: ['A gate-pigeon', 'Knocks and pecks your crust, and takes any slice thrown past it.'],
  snail: ['A pane-snail', 'Was there first. Knocks; low enough to hop.'],
  berry: ['Boonberries', 'Filling, and a glimpse: walk through them and the clear way up the lanes shows teal for a moment, before you need it.'],
  boneberry: ['A boneberry', 'Savoury, a whole meal in a berry: crust and filling both, and for a while your steps tilt less.'],
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
const CHAPTER_SCENE = Object.freeze({ 1: 'field', 2: 'field', 3: 'lanes', 4: 'court', 5: 'lanes', 6: 'plaza', 7: 'lanes', 8: 'field', 9: 'lanes', 10: 'lanes', 11: 'court', 12: 'field', 13: 'table', 14: 'field', 15: 'gate' });
/* Where the Egg is likelier to be passed: the field it was found in, the theft, the door. */
const EGG_ODDS = Object.freeze({ 1: 0.5, 11: 0.7, 13: 0.9, 14: 0.5 });
const pad2 = (n) => String(n).padStart(2, '0');

/* Mr. BaneWAP's schemes: each announced, each with an off switch. */
const SCHEMES = Object.freeze({
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
const CARRIERS = Object.freeze([
  { id: 'figure', name: 'the figure in plain lines', weight: 4, step: 0.09, wobble: 0.18, hurried: 0.3, settle: 0.5, width: 24 },
  { id: 'porter', name: 'the porter from the parcel gate', weight: 2, step: 0.13, wobble: 0.12, hurried: 0.22, settle: 0.56, width: 28, says: 'Steady as a sack of flour, and as quick.' },
  { id: 'clerk', name: 'a feast clerk', weight: 1.5, step: 0.065, wobble: 0.23, hurried: 0.36, settle: 0.46, width: 19, says: 'Quick, precise, and nervous about the paperwork.' },
  { id: 'genie', name: 'the Genie, off-season', weight: 1.5, step: 0.15, wobble: 0.16, hurried: 0.26, settle: 0.7, width: 24, says: 'Glides. Settles a pie the way he settles a price.' },
  { id: 'clown', name: 'a clown', weight: 1, step: 0.09, wobble: 0.25, hurried: 0.4, settle: 0.42, width: 24, says: 'A clown, carrying a pie. Everyone is nervous.' }
]);
const carrierById = (id) => CARRIERS.find((carrier) => carrier.id === id) || CARRIERS[0];
function drawCarrierLot(not = null) {
  const pool = CARRIERS.filter((carrier) => carrier.id !== not);
  let roll = Math.random() * pool.reduce((sum, carrier) => sum + carrier.weight, 0);
  for (const carrier of pool) {
    roll -= carrier.weight;
    if (roll <= 0) return carrier;
  }
  return pool[0];
}

/* What happened, said the way the land would say it. */
const CAUSES = Object.freeze({
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

function readRecord() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    const obj = (value) => (value && typeof value === 'object' ? value : {});
    return {
      best: Number(parsed.best) || 0,
      runs: Number(parsed.runs) || 0,
      waps: Number(parsed.waps) || 0,
      bestWaps: Number(parsed.bestWaps) || 0,
      causes: obj(parsed.causes),
      carriers: obj(parsed.carriers),
      perfects: Number(parsed.perfects) || 0,
      satisfied: Number(parsed.satisfied) || 0,
      shared: Number(parsed.shared) || 0,
      sweetened: Number(parsed.sweetened) || 0,
      foils: Number(parsed.foils) || 0,
      reached: Number(parsed.reached) || 0,
      wasted: Number(parsed.wasted) || 0,
      eggs: Number(parsed.eggs) || 0,
      kept: Number(parsed.kept) || 0,
      lore: Array.isArray(parsed.lore) ? parsed.lore : [],
      met: Array.isArray(parsed.met) ? parsed.met : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      qa: Array.isArray(parsed.qa) ? parsed.qa.slice(-200) : [],
      view: { story: parsed.view?.story !== false, zen: parsed.view?.zen === true, hand: parsed.view?.hand === 'left' ? 'left' : 'right' },
      sound: parsed.sound !== false
    };
  } catch {
    return { best: 0, runs: 0, waps: 0, bestWaps: 0, causes: {}, carriers: {}, perfects: 0, satisfied: 0, shared: 0, sweetened: 0, foils: 0, reached: 0, wasted: 0, eggs: 0, kept: 0, lore: [], met: [], cards: [], qa: [], view: { story: true, zen: false, hand: 'right' }, sound: true };
  }
}

function writeRecord(record) {
  try { window.localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* the run still counted */ }
}

/* ─── Soundscape: WAP and the tactile notes of the carry, synthesized; no files ───
 * One bus for every sound: a compressor, and a short echo the size of a lane. Every sound
 * is panned to where it happened. Things the land gives play in the chapter's own key, a
 * pentatonic that climbs as they come (a minor one while the mimes hold the chapter);
 * knocks are out of key, on purpose. While the land runs at a beaver's pace the bus is
 * muffled, as if heard through slow time; while the mimes lead, it thins, the way it is
 * harder to wonder about pie. Footsteps know the ground: grass in the field, cobbles in
 * the city. */
let audio = null;
let bus = null;
const sound = { root: 293.66, minor: false, ground: 'field', muffled: false, thin: false };
const ROOTS = [293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23];
const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];
/** Browsers let sound start only from a gesture: the click or key that starts a carry. */
function primeAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio = audio || new AudioCtx();
    if (audio.state !== 'running') audio.resume().catch(() => {});
    ensureBus();
  } catch { /* silent, then */ }
}
function ensureBus() {
  if (!audio || bus) return bus;
  const input = audio.createGain();
  const muffle = audio.createBiquadFilter();
  muffle.type = 'lowpass';
  muffle.frequency.value = 16000;
  const thin = audio.createBiquadFilter();
  thin.type = 'highpass';
  thin.frequency.value = 30;
  const comp = audio.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  const master = audio.createGain();
  master.gain.value = 0.9;
  const echo = audio.createDelay(0.6);
  echo.delayTime.value = 0.14;
  const feedback = audio.createGain();
  feedback.gain.value = 0.2;
  const wet = audio.createGain();
  wet.gain.value = 0.14;
  input.connect(muffle).connect(thin).connect(comp).connect(master).connect(audio.destination);
  thin.connect(echo);
  echo.connect(feedback).connect(echo);
  echo.connect(wet).connect(comp);
  bus = { input, muffle, thin };
  return bus;
}
/** Where the carry is: the chapter's key and ground, and whether the mimes hold it. */
function setSoundPlace({ chapter = 1, held = false } = {}) {
  sound.root = ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.minor = held;
  sound.ground = chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city';
}
/** The land's pace and the mimes' hold, heard: muffled in slow time, thinner while they lead. */
function setSoundMood({ muffled = false, thin = false } = {}) {
  if (!audio || !bus) return;
  const t = audio.currentTime;
  if (muffled !== sound.muffled) bus.muffle.frequency.setTargetAtTime(muffled ? 1300 : 16000, t, 0.12);
  if (thin !== sound.thin) bus.thin.frequency.setTargetAtTime(thin ? 420 : 30, t, 0.2);
  sound.muffled = muffled;
  sound.thin = thin;
}
/** A degree of the chapter's pentatonic, in octaves from its root. */
const note = (degree, octave = 0) => {
  const scale = sound.minor ? MINOR : MAJOR;
  const d = Math.max(0, Math.round(degree));
  return sound.root * 2 ** (octave + Math.floor(d / 5) + scale[d % 5] / 12);
};
const outlet = (pan = 0) => {
  ensureBus();
  if (!bus) return audio.destination;
  if (!audio.createStereoPanner) return bus.input;
  const panner = audio.createStereoPanner();
  panner.pan.value = Math.max(-0.8, Math.min(0.8, pan));
  panner.connect(bus.input);
  return panner;
};
function wapSound(lift = 1, pan = 0) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio = audio || new AudioCtx();
    if (audio.state !== 'running') audio.resume().catch(() => {});
    const t = audio.currentTime;
    const out = audio.createGain();
    out.gain.value = 0.5;
    out.connect(outlet(pan));
    // The W: a short drop in pitch, like a cheek meeting crust.
    const thump = audio.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(320, t);
    thump.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    const thumpGain = audio.createGain();
    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    thump.connect(thumpGain).connect(out);
    thump.start(t);
    thump.stop(t + 0.18);
    // The AP: filling, everywhere — a burst of noise through a closing filter.
    const length = Math.floor(audio.sampleRate * 0.22);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const splat = audio.createBufferSource();
    splat.buffer = buffer;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(1800, t);
    band.frequency.exponentialRampToValueAtTime(260, t + 0.2);
    const splatGain = audio.createGain();
    splatGain.gain.setValueAtTime(0.0001, t);
    splatGain.gain.exponentialRampToValueAtTime(0.8, t + 0.01);
    splatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    splat.connect(band).connect(splatGain).connect(out);
    splat.start(t);
    // And the clown's delight: two honks.
    [0.2, 0.34].forEach((at, i) => {
      const horn = audio.createOscillator();
      horn.type = 'square';
      horn.frequency.setValueAtTime((i ? 660 : 520) * lift, t + at);
      horn.frequency.linearRampToValueAtTime((i ? 700 : 560) * lift, t + at + 0.09);
      const hornGain = audio.createGain();
      hornGain.gain.setValueAtTime(0.0001, t + at);
      hornGain.gain.exponentialRampToValueAtTime(0.12, t + at + 0.01);
      hornGain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.1);
      horn.connect(hornGain).connect(out);
      horn.start(t + at);
      horn.stop(t + at + 0.12);
    });
  } catch { /* a silent WAP is still a WAP */ }
}

/** Tactile micro-sounds: steps, hops, bank shots, the berries' voices, knocks, and the Egg's hum. */
function playTone(kind, param = 1, pan = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime;
    const out = outlet(pan);
    const tone = (type, f0, f1, dur, vol, delay = 0) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t + delay);
      if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + delay + dur);
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + Math.min(0.015, dur * 0.25));
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      osc.connect(g).connect(out);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.02);
    };
    // A slow swell, for things that are said rather than struck.
    const swell = (type, f, dur, vol, delay = 0) => {
      const osc = audio.createOscillator();
      const g = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, t + delay);
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      osc.connect(g).connect(out);
      osc.start(t + delay);
      osc.stop(t + delay + dur + 0.02);
    };
    const hiss = (f0, f1, dur, vol, q = 1.8, delay = 0) => {
      const len = Math.max(1, Math.floor(audio.sampleRate * dur));
      const buf = audio.createBuffer(1, len, audio.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = audio.createBufferSource();
      src.buffer = buf;
      const flt = audio.createBiquadFilter();
      flt.type = 'bandpass';
      flt.Q.value = q;
      flt.frequency.setValueAtTime(f0, t + delay);
      flt.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t + delay + dur);
      const g = audio.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      src.connect(flt).connect(g).connect(out);
      src.start(t + delay);
    };
    switch (kind) {
      // Footsteps know the ground: a brush of grass in the field, a tick of cobble in the city; left and right differ.
      case 'step':
        if (sound.ground === 'field') { hiss(1600 + (param > 0 ? 200 : 0), 700, 0.05, 0.05, 1.2); tone('sine', 120, 70, 0.04, 0.04); }
        else { tone('triangle', 150 + (param > 0 ? 14 : 0), 70, 0.035, 0.055); hiss(3200, 2200, 0.02, 0.03, 3); }
        break;
      case 'catch': tone('sine', note(2), note(4), 0.09, 0.1); tone('triangle', note(4), note(5), 0.11, 0.08, 0.04); break;
      case 'hop': tone('triangle', 210, 430, 0.11, 0.11); hiss(900, 2400, 0.08, 0.03, 1.5); break;
      case 'land': tone('triangle', 175, 85, 0.06, 0.08); if (sound.ground === 'field') hiss(900, 400, 0.06, 0.05); break;
      case 'deft': tone('sine', note(4), note(6), 0.11, 0.11); tone('sine', note(6), note(8), 0.12, 0.09, 0.05); break;
      case 'throw': hiss(820, 2100, 0.085, 0.12, 2.2); tone('sine', 280, 420, 0.07, 0.06); break;
      case 'glass': tone('sine', 1175, 1185, 0.22, 0.12); tone('sine', 1760, 1780, 0.26, 0.09, 0.03); break;
      case 'post': tone('triangle', 440, 660, 0.17, 0.12); break;
      case 'ramp': tone('sine', 350, 560, 0.12, 0.09); break;
      // A boonberry: two notes that climb the key as they come, and an airy glimpse after.
      case 'berry': {
        const d = 2 + (Number(param) || 0) % 6;
        tone('sine', note(d), note(d) * 1.003, 0.1, 0.1);
        tone('sine', note(d + 2), note(d + 2) * 1.003, 0.16, 0.09, 0.06);
        hiss(5200, 7800, 0.18, 0.025, 4, 0.08);
        break;
      }
      case 'sweet': [0, 2, 4, 5].forEach((d, i) => tone('sine', note(d, 1), note(d, 1) * 1.004, 0.16, 0.08, i * 0.05)); break;
      // A boneberry: low and woody, like a mallet on a bowl, savoury rather than sweet.
      case 'bone': tone('sine', note(0, -1), note(0, -1) * 0.97, 0.22, 0.15); tone('sine', note(3, -1), note(3, -1) * 0.98, 0.18, 0.08, 0.07); hiss(2600, 1800, 0.02, 0.05, 3); break;
      // A baneberry squashed: a wet pop, and nothing said.
      case 'squash': tone('sine', 150, 55, 0.09, 0.14); hiss(320, 120, 0.08, 0.08, 1.2); break;
      // A baneberry foretelling: two notes a semitone apart, swelling, and a whisper under them.
      case 'foretell': swell('triangle', note(0, -1), 0.9, 0.06); swell('triangle', note(0, -1) * 1.0595, 0.9, 0.05, 0.05); hiss(900, 700, 0.7, 0.03, 6); break;
      // ... and as it comes: a fall, low, out of key.
      case 'fulfil': tone('sawtooth', note(2, -1) * 1.0595, note(0, -1) * 0.94, 0.32, 0.06); tone('sine', 90, 55, 0.25, 0.1); break;
      // A slow beaver: two wooden tocks, unhurried.
      case 'beaver': tone('sine', 520, 380, 0.05, 0.12); tone('sine', 470, 340, 0.05, 0.1, 0.32); break;
      case 'share': tone('triangle', note(3), note(3) * 1.004, 0.12, 0.1); tone('triangle', note(5), note(5) * 1.004, 0.16, 0.1, 0.05); break;
      case 'flour': hiss(640, 170, 0.16, 0.14, 1.1); break;
      // A wonder: an arpeggio in the chapter's key, its shape by kind.
      case 'wonder': {
        const shape = param === 'contrivance' ? [0, 2, 4, 5] : param === 'bracework' ? [0, 3, 5, 8] : param === 'saying' ? [4, 2, 0, 5] : [0, 2, 3, 5];
        shape.forEach((d, i) => tone('sine', note(d, 1), note(d, 1) * 1.005, 0.22, 0.08, i * 0.05));
        break;
      }
      case 'knock': tone('sawtooth', 190, 68, 0.15, 0.12); hiss(420, 120, 0.12, 0.12, 1.5); tone('sine', 80, 45, 0.18, 0.12); break;
      case 'foil': tone('square', 520, 180, 0.2, 0.1); tone('triangle', note(4), note(6), 0.14, 0.1, 0.08); break;
      case 'egg': tone('sine', 130.8, 131.2, 0.45, 0.11); tone('sine', 196, 196.5, 0.45, 0.08, 0.03); break;
      case 'spill': tone('triangle', 280, 65, 0.32, 0.2); hiss(1100, 160, 0.28, 0.2, 1.2); break;
      default: break;
    }
  } catch { /* silent play still counts */ }
}

/* ─── What the pies let slip ─── */
const LORE_URL = '/book/content/world/pie-lore.json';
let lorePromise = null;
const loadLore = () => {
  lorePromise = lorePromise || fetch(LORE_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  return lorePromise;
};

/** What the visitor has found across the site, and done in the game. */
function discoveries(record) {
  const read = (key, fallback) => {
    try { return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const progress = read('lore.chapter.progress.v1', {});
  const tellings = read('lore.tellings.v1', {});
  const visited = Array.isArray(progress?.visited) ? progress.visited.map(Number) : [];
  return {
    chapters: visited.length,
    visited,
    wonders: Object.keys(read('lore.almanac.v1', {}) || {}).length,
    sightings: Object.keys(read('lore.sightings.v1', {}) || {}).length,
    tellings: Object.values(tellings || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0),
    waps: record.waps,
    satisfied: record.satisfied || 0,
    shared: record.shared || 0,
    sweetened: record.sweetened || 0,
    perfects: record.perfects,
    foils: record.foils,
    reached: record.reached,
    ...(() => {
      const sum = carriesSummary(readCarries());
      return { carried: sum.carried, wonback: sum.wonBack, mimes: sum.taken };
    })()
  };
}

function isUnlocked(line, found) {
  const { kind, n } = line.unlock || { kind: 'always' };
  if (kind === 'always') return true;
  if (kind === 'chapter') return found.visited.includes(Number(n));
  return (found[kind] ?? 0) >= Number(n);
}

const laneX = (lane) => lane * LANE_W + LANE_W / 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* Any CSS colour the page uses (hex, color-mix, a var) → plain rgb() a canvas can mix. */
let probe = null;
function rgbOf(value, fallback) {
  if (!probe) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    probe = c.getContext('2d', { willReadFrequently: true });
  }
  const span = document.createElement('span');
  span.style.color = fallback;
  span.style.color = value;
  document.body.append(span);
  const computed = getComputedStyle(span).color;
  span.remove();
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = fallback;
  probe.fillStyle = computed;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/** The page's colours, so the game wears the reader's binding. */
function palette() {
  const style = getComputedStyle(document.body);
  const v = (name, fallback) => rgbOf(style.getPropertyValue(name).trim() || fallback, fallback);
  return {
    paper: v('--hub-paper', '#f3ede1'),
    deep: v('--hub-paper-deep', '#e6dcc8'),
    ink: v('--hub-ink', '#161d2b'),
    muted: v('--hub-muted', '#5b6472'),
    accent: v('--hub-accent', '#246270'),
    gold: v('--hub-gold', '#c4922e'),
    hearth: v('--hub-hearth', '#b0602a'),
    berry: v('--hub-berry', '#5b3a6e'),
    night: v('--hub-night', '#12394a')
  };
}

const channels = (rgb) => (rgb.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
/** a toward b by t, as rgb(). */
function mix(a, b, t) {
  const x = channels(a);
  const y = channels(b);
  return `rgb(${x.map((n, i) => Math.round(n + (y[i] - n) * t)).join(', ')})`;
}

export function initPieGame(root = document.querySelector('[data-pie-game]')) {
  if (!root) return () => {};
  const canvas = root.querySelector('canvas');
  const screenCtx = canvas.getContext('2d');
  let ctx = screenCtx;   // swapped briefly to draw the legend's sprites with the same hands
  const card = root.querySelector('[data-pie-card]');
  const cardTitle = card.querySelector('[data-pie-card-title]');
  const cardLine = card.querySelector('[data-pie-card-line]');
  const cardAction = card.querySelector('[data-pie-card-action]');
  const cardChapters = card.querySelector('[data-pie-card-chapters]');
  const meter = root.querySelector('[data-pie-meter]');
  const auraMeter = root.querySelector('[data-pie-aura]');
  const toast = root.querySelector('[data-pie-toast]');
  const toastTitle = toast?.querySelector('[data-pie-toast-title]');
  const toastLine = toast?.querySelector('[data-pie-toast-line]');
  let toastTimer = 0;
  const live = root.querySelector('[data-pie-live]');
  const bestOut = document.querySelector('[data-pie-best]');
  const left = root.querySelector('[data-pie-step="-1"]');
  const right = root.querySelector('[data-pie-step="1"]');
  const soundToggle = root.querySelector('[data-pie-sound]');
  const cardLinks = card.querySelector('[data-pie-card-links]');
  const loreOut = document.querySelector('[data-pie-lore]');
  let lore = null;
  const returnLink = document.querySelector('[data-pie-return]');

  let colors = palette();
  let record = readRecord();
  let state = 'title';     // title | running | paused | spilling | over
  let frame = 0;
  let last = 0;
  let run = null;

  const say = (text) => { if (live) live.textContent = text; };
  // Every sound is panned to where it happened: the carrier, unless something else is said to be the source.
  const panOf = (x) => (Number.isFinite(x) ? (x / W) * 2 - 1 : run ? (run.x / W) * 2 - 1 : 0) * 0.7;
  const sfx = (kind, param, x) => { if (record.sound) playTone(kind, param, panOf(x)); };
  const paintBest = () => {
    if (!bestOut) return;
    bestOut.textContent = record.runs
      ? `Carried furthest: ${record.best} cobbles. Pies spilled: ${record.runs}, exactly one each time. Clowns given WAP: ${record.waps}${record.bestWaps ? ` (most in one carry: ${record.bestWaps})` : ''}${record.shared ? ` · slices shared: ${record.shared}` : ''}.`
      : 'Nobody has carried it yet.';
    // Where the book stands: chapters carried through, and any the mimes hold.
    const sum = carriesSummary(readCarries());
    if (sum.carried) bestOut.textContent += ` Chapters carried through: ${sum.carried}.${sum.held.length ? ` Held by the mimes: ${chapterList(sum.held)}.` : ''}`;
  };
  const carriesMount = document.querySelector('[data-pie-carries]');
  const paintCarries = () => renderCarriesPanel(carriesMount, {
    totalChapters: TOTAL_CHAPTERS,
    onChange: () => {
      paintBest();
      paintNow(run?.chapter || chosenStartChapter);
    }
  });
  const paintSound = () => {
    if (!soundToggle) return;
    soundToggle.textContent = '♪ Sound';
    soundToggle.title = record.sound ? 'WAP sounds are on' : 'WAP sounds are off';
    soundToggle.setAttribute('aria-pressed', record.sound ? 'true' : 'false');
  };

  /* ─── Sizing: a crisp canvas at any width ─── */
  const fit = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.width * (H / W) * ratio);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    draw();
  };

  /* ─── A run: a voyage through the chapters ─── */
  const firstChapter = (() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const asked = Number(q.get('chapter'));
      if (asked >= 1 && asked <= TOTAL_CHAPTERS) return asked;
      const segue = segueFor(q.get('scene'));
      if (segue) return segue.chapter;
      const came = /\/book\/chapter\/(\d{2})\//.exec(q.get('from') || document.referrer || '');
      if (came) return Number(came[1]);
    } catch { /* from the beginning */ }
    return 1;
  })();
  let chosenStartChapter = firstChapter;
  const fresh = (carrier = drawCarrierLot(), startChap = chosenStartChapter) => ({
    carrier,
    charm: activeCombine(),
    strokes: Object.keys(readSightings()).length,
    waps: 0,
    bursts: [],
    lane: 2,
    x: laneX(2),
    from: laneX(2),
    moveT: 1,
    lastStep: -1,
    dir: 0,
    tiltDir: 0,
    stillT: 0,
    poisedSaid: false,
    deftHop: false,
    wobble: 0,
    phase: 0,
    speed: 150,
    scroll: 0,
    chapter: startChap,
    startChapter: startChap,
    wrapped: false,
    sceneId: CHAPTER_SCENE[startChap] || 'lanes',
    lap: 0,
    leg: null,
    legStart: 0,
    legLength: 320,
    wonderQueue: [],
    pendingWonder: null,
    kept: 0,
    shared: 0,
    sweetened: 0,
    row: 0,
    y: PLAYER_Y,
    fromY: PLAYER_Y,
    moveYT: 1,
    warm: 0,
    shield: false,
    eggAt: Infinity,
    lit: 0,
    echoes: 0,
    lag: 0,
    unkept: 0,
    fed: 0,
    glimpse: 0,
    trueAim: 0,
    ecology: [],
    prophecies: [],
    foretold: { said: 0, came: 0, unsaid: 0, kind: 0 },
    berriesEaten: { boon: 0, bone: 0 },
    powersUsed: {},
    slideT: 0,
    ways: [],
    hurtT: 0,
    intro: false,
    seenCards: new Set(),
    revealQueue: [],
    tally: null,
    breath: 0,
    rules: [],
    met: [],
    outcomes: [],
    meetCool: 0,
    nowAt: 0,
    satisfied: 0,
    dust: 0,
    jumpT: 0,
    jumpCool: 0,
    cleared: 0,
    rattled: 0,
    shake: 0,
    knockT: 0,
    lastKnock: null,
    combo: 0,
    comboT: 0,
    bestCombo: 0,
    things: [],
    rowIn: 1.6,
    rows: 0,
    safe: 2,
    boofIn: rand(9, 14),
    boon: null,
    bane: null,
    lastPresence: null,
    nextPresence: rand(13, 18),
    pendingSwitch: false,
    slices: [],
    throws: [],
    sliceReady: 1,
    aim: { a: 0 },
    aura: 0.6,       // flour: the crust
    filling: 0.6,    // boonberries: the filling
    wasted: 0,
    perfects: 0,
    puffs: [],
    rings: [],
    trails: [],
    pointer: null,
    tags: [],
    pops: [],
    bits: [],
    punch: 0,
    hitStop: 0,
    foils: 0,
    floured: 0,
    setbacks: 0,
    boof: null,
    drops: [],
    hat: { x: laneX(2), y: PLAYER_Y - 62, vx: 0, vy: 0 },
    spill: null,
    steadied: 0,
    t: 0
  });

  const cobbles = () => Math.floor((run?.scroll || 0) / COBBLE);
  const scene = () => SCENES.find((entry) => entry.id === run.sceneId) || SCENES[1];
  const poiseNeed = () => (run?.charm?.bracket === '{}' ? 0.52 : 0.65);
  const poised = () => state === 'running' && Boolean(run && run.stillT >= poiseNeed() && run.wobble < 0.72 && run.hurtT <= 0);
  // Each stroke noticed for the figure in plain lines steadies his hands; a kept {room} charm steadies any carrier.
  const carrierSettle = () => {
    if (!run) return 0.5;
    const figureBonus = run.carrier.id === 'figure' ? 1 + (run.strokes || 0) * 0.025 : 1;
    const charmBonus = run.charm?.bracket === '{}' ? 1.12 : 1;
    const fedBonus = run.fed > 0 ? 1.25 : 1;   // a boneberry meal: steadier on your feet
    return run.carrier.settle * figureBonus * charmBonus * fedBonus;
  };
  const spawnRing = (x, y, maxR = 28, color = colors.gold, dur = 0.55, dashed = false) => {
    if (!reduced?.matches && run) run.rings.push({ x, y, r: 4, maxR, t: 0, dur, color, dashed });
  };

  /* ─── The chapter's tally: how the carry is going here, and so how this chapter will be kept ───
   * boon · bane · bone lean the chapter's reading (pie-carries.mjs); pie and mimes are the contest
   * with Mimes Against WAP. A chapter the mimes already hold starts with them two ahead. */
  const newTally = (n) => {
    const held = mimesHold(n);
    return { boon: 0, bane: 0, bone: 0, wap: 0, maw: held ? 2 : 0, mawSeen: held, held };
  };
  const tally = (key, k = 1) => { if (run?.tally) run.tally[key] += k; };
  /* The three ways a chapter develops, and what moves it each way (=lean{} in pie-rules.spw; these
   * defaults until the rules are read). Each event leans its category by its weight and is counted,
   * so the chapter can say why it leans the way it does. Contest tallies (wap, maw) stay apart. */
  const LEAN_DEFAULTS = Object.freeze({
    satisfied: ['boon', 1], shared: ['boon', 1], kept: ['boon', 1], egg: ['boon', 1], sweetened: ['boon', 0.6],
    boonberry: ['boon', 0.4], furrow: ['boon', 0.3], sighting: ['boon', 0.6], boonwap: ['boon', 0.3], boof: ['boon', 0.5],
    knocked: ['bane', 1], boxed: ['bane', 0.8], bane_fed: ['bane', 0.6], scheme_ran: ['bane', 1], foretold: ['bane', 0.8],
    flinched: ['bane', 0.6], let_past: ['bane', 0.3],
    perfect: ['bone', 1], over_mimes: ['bone', 1], ramp: ['bone', 0.6], hop_clear: ['bone', 0.5], deft: ['bone', 0.6],
    caught: ['bone', 0.5], boneberry: ['bone', 0.6], foiled: ['bone', 1], squashed: ['bone', 0.4], ahead: ['bone', 0.3]
  });
  const LEAN_WORDS = Object.freeze({
    satisfied: 'clowns satisfied', shared: 'slices shared', kept: 'wonders kept', egg: 'the warm thing passed', sweetened: 'baneberries sweetened',
    boonberry: 'boonberries', furrow: 'warm furrows', sighting: 'strokes noticed', boonwap: 'Mr. BoonWAP held court', boof: 'brushes past Boof',
    knocked: 'knocks', boxed: 'slices boxed', bane_fed: 'baneberries fed to him', scheme_ran: 'schemes run', foretold: 'foretellings come true',
    flinched: 'flinches', let_past: 'baneberries let past',
    perfect: 'perfect throws', over_mimes: 'over the mimes', ramp: 'ramps', hop_clear: 'hops clean', deft: 'deft landings',
    caught: 'tilts caught', boneberry: 'boneberries', foiled: 'Mr. BaneWAP foiled', squashed: 'foretellings left unsaid', ahead: 'moments up the lanes'
  });
  let leanRules = {};
  const lean = (event, n = 1) => {
    const [cat, w] = leanRules[event] || LEAN_DEFAULTS[event] || [];
    if (!cat || !run?.tally) return;
    tally(cat, w * n);
    run.leanWhy = run.leanWhy || {};
    run.leanWhy[event] = (run.leanWhy[event] || 0) + n;
  };
  /* The land answers in kind: the more a chapter has leaned one way, the more of that way's own
   * things come up the lanes (boonberries for the fairy tale, baneberries for absurd reality,
   * ramps of flour for low magic). Gentle, and held between 0.8× and 1.4×. */
  const inKind = (cat) => {
    const t = run?.tally;
    if (!t) return 1;
    const sum = t.boon + t.bane + t.bone;
    if (sum < 3) return 1;
    return clamp(0.8 + (t[cat] / sum) * TUNE.in_kind, 0.8, 1.4);
  };
  /* ─── Whimsy: how an impact looks and sounds, by sprite and by scene ───
   * !whimsy{ *kind{ #pop["BONK!", …] *bits[crumbs] !sound[…] %drama[1] } } and !scenes{ *field{ $frost
   * %drama[0.9] } } in pie-rules.spw, over these defaults. An impact pops a word, flings bits, gives
   * the screen a punch and (when it matters) a breath of hit-stop, all scaled by =drama, the sprite's
   * own drama and the scene's. Under reduced motion or zen: the word only, quietly. */
  const WHIMSY_DEFAULTS = Object.freeze({
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
    spill: { pops: ['SPLAT!!', 'EXACTLY ONE.'], bits: 'juice', drama: 1.8 }
  });
  const SCENE_WHIMSY_DEFAULTS = Object.freeze({
    field: { drama: 0.9, material: 'frost' }, gate: { drama: 1, material: 'steam' }, lanes: { drama: 1.1, material: 'brass' },
    plaza: { drama: 1.3, material: 'flour' }, court: { drama: 1.2, material: 'glass' }, table: { drama: 1, material: 'oak' }
  });
  let whimsyRules = { sprites: {}, scenes: {} };
  const whimsyFor = (kind) => ({ ...WHIMSY_DEFAULTS.knock, ...(WHIMSY_DEFAULTS[kind] || {}), ...(whimsyRules.sprites[kind] || {}) });
  const sceneWhimsy = (id = run?.sceneId) => ({ ...(SCENE_WHIMSY_DEFAULTS[id] || {}), ...(whimsyRules.scenes[id] || {}) });
  const BIT_COLORS = Object.freeze({
    juice: ['#4d9f97', '#f4b25c', '#c86d2c'], crumbs: ['#e0a95a', '#b9773a', '#f2d29a'], feathers: ['#9aa3ad', '#d8dde3'],
    glass: ['#cfeaf0', '#7fb4c0', '#ffffff'], confetti: ['#d6473e', '#f2c14e', '#4d9f97', '#7a3f9a'], stars: ['#f2c14e', '#ffe36b'], flour: ['#faf6ec', '#efe6d2']
  });
  function impact(kind, x, y, { scale = 1, word = null, hurt = false } = {}) {
    if (!run) return;
    const w = whimsyFor(kind);
    const drama = TUNE.drama * (w.drama ?? 1) * (sceneWhimsy().drama ?? 1) * scale;
    if (drama <= 0) return;
    const calm = reduced?.matches || record.view.zen;
    run.pops.push({ x: clamp(x, 40, W - 40), y, t: 0, text: word || pick(w.pops || ['!']), size: 0.75 + Math.min(1.5, drama * 0.55), hurt, spin: calm ? 0 : rand(-0.22, 0.22) });
    if (run.pops.length > 6) run.pops.shift();
    if (calm) return;
    run.punch = Math.max(run.punch || 0, Math.min(1, 0.32 * drama));
    if (drama >= 1.2) run.hitStop = Math.max(run.hitStop || 0, Math.min(0.12, 0.045 * drama));
    const colorsOf = BIT_COLORS[w.bits];
    if (colorsOf) {
      const n = Math.round(Math.min(24, 7 * drama));
      for (let i = 0; i < n; i += 1) {
        const a = rand(-Math.PI, 0);
        const v = rand(80, 220) * Math.min(1.6, drama);
        run.bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, kind: w.bits, color: pick(colorsOf), rot: rand(0, 6), vr: rand(-12, 12) });
      }
      if (run.bits.length > 140) run.bits.splice(0, run.bits.length - 140);
    }
    if (w.sound) sfx(w.sound, 0, x);
  }
  /* A scene's own texture as it begins (its $material, played by spw-sound.mjs), when sound is on. */
  function sceneTexture(id) {
    const material = sceneWhimsy(id).material;
    if (!record.sound || !material) return;
    import('../modules/spw-sound.mjs?v=2026_11_08.K').then((m) => m.playSpell(`$${material}`, { tempo: 70 })).catch(() => {});
  }
  const drawWhimsy = () => {
    if (!run) return;
    run.bits.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - b.t / 1.1);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      if (b.kind === 'stars') {
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) { const r = i % 2 ? 2 : 5; const a = (i / 10) * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
      } else if (b.kind === 'feathers') {
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (b.kind === 'glass') {
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 3); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill();
      } else if (b.kind === 'juice' || b.kind === 'flour') {
        ctx.beginPath(); ctx.arc(0, 0, b.kind === 'flour' ? 4 + b.t * 6 : 3, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-3, -2, 6, 4);
      }
      ctx.restore();
    });
    run.pops.forEach((p) => {
      const settle = Math.exp(-p.t * 9) * Math.cos(p.t * 26);
      const s = p.size * (1 + 0.55 * settle);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (1.1 - p.t) * 2.2));
      ctx.translate(p.x, p.y - p.t * 26);
      ctx.rotate(p.spin * (1 - Math.min(1, p.t * 3)));
      ctx.scale(s, s);
      ctx.font = '900 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1d1d22';
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.hurt ? '#e8553f' : '#ffe36b';
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
  };

  const mawAhead = () => Boolean(run?.tally?.mawSeen && run.tally.maw > run.tally.wap + 0.5);
  const met = (kind) => record.met.includes(kind);
  const allowed = (kind) => !(kind in INTRO) || INTRO[kind] <= run.chapter || run.lap > 0 || met(kind);

  /* ─── Things in the lanes: they come in rows, and every row leaves a way through ─── */
  const difficulty = () => clamp(run.t / 110 + (run.chapter - 1) * 0.025 + run.lap * 0.25, 0, 1);

  const makeThing = (kind, lane) => {
    const thing = { kind, y: -44, lane, x: laneX(lane), home: laneX(lane), w: 30, h: 30, fatal: true, born: run.t };
    switch (kind) {
      case 'post': thing.w = 24; thing.h = 24; break;
      case 'sack': thing.w = 48; thing.h = 34; thing.fatal = false; break;   // flour slows; it does not spill
      case 'puddle': thing.w = 54; thing.h = 18; thing.fatal = false; break;
      case 'snail': thing.w = 24; thing.h = 16; thing.vx = rand(-6, 6); break;
      case 'spool': thing.w = 18; thing.h = 18; thing.vx = pick([-1, 1]) * rand(30, 46); break;
      case 'pigeon': thing.w = 24; thing.h = 16; thing.vx = pick([-1, 1]) * rand(20, 34); thing.flap = rand(0, 6); break;
      case 'clerk': thing.w = 26; thing.h = 32; thing.vx = pick([-1, 1]) * 22; break;
      case 'wasps': thing.w = 26; thing.h = 22; thing.zig = rand(0, 6); break;
      case 'chair': thing.w = 30; thing.h = 26; break;
      case 'throne': thing.w = 34; thing.h = 36; break;
      case 'subject': thing.w = 24; thing.h = 32; thing.loaf = Math.random() < 0.6; break;
      case 'clown': thing.w = 26; thing.h = 32; thing.fatal = false; thing.vx = 0; thing.honk = rand(0, 6); thing.want = 1; thing.fed = 0; break;
      case 'switch': thing.w = 30; thing.h = 30; thing.fatal = false; break;
      case 'berry': thing.w = 24; thing.h = 22; thing.fatal = false; break;
      case 'boneberry': thing.w = 22; thing.h = 20; thing.fatal = false; break;
      case 'baneberry': thing.w = 22; thing.h = 20; thing.fatal = false; break;
      case 'beaver': thing.w = 30; thing.h = 20; thing.fatal = false; thing.vx = pick([-1, 1]) * 8; break;
      case 'pile': thing.w = 40; thing.h = 14; thing.fatal = false; break;
      case 'stone': thing.w = 30; thing.h = 24; break;
      case 'hole': thing.w = 34; thing.h = 18; break;
      case 'mime': thing.w = 24; thing.h = 34; break;
      case 'mimewall': thing.w = 40; thing.h = 40; break;
      case 'pane': thing.w = 34; thing.h = 30; break;
      case 'frost': thing.w = 50; thing.h = 20; thing.fatal = false; break;
      case 'furrow': thing.w = 56; thing.h = 16; thing.fatal = false; break;
      // The land's own: they wait a moment, higher up the lanes, then go about their business.
      case 'wonder': thing.w = 28; thing.h = 28; thing.fatal = false; thing.hover = rowY(pick([1, 2, 2, 3, 3])) - 18; thing.stay = 2.8; break;
      case 'egg': thing.w = 26; thing.h = 30; thing.fatal = false; thing.hover = rowY(ROWS - 1) - 18; thing.stay = 2.2; break;
      default: break;
    }
    // Things that drift stay near their own lane: the way through is never taken back.
    thing.range = LANE_W * 0.2;
    return thing;
  };

  const spawnRow = () => {
    // Each chapter builds toward its end; a section break in the words is a breath in the lanes.
    const d = clamp(difficulty() * (0.8 + progress() * 0.4), 0, 1);
    const calm = run.breath > 0;
    const s = scene();
    const kinds = s.kinds.filter(allowed);
    const solid = kinds.filter((kind) => !WIDE.has(kind));
    const solids = solid.length ? solid : [s.kinds.find((kind) => !WIDE.has(kind)) || 'post'];
    const lanes = [...Array(LANES).keys()];
    // The way through: never more than one step from the last. (Torch-ants light it.)
    run.safe = clamp(run.safe + pick([-1, 0, 0, 1]), 0, LANES - 1);
    run.ways.push({ y: -44, lane: run.safe });
    // Mr. BaneWAP's off switch rides on the way through, where it can always be reached.
    if (run.pendingSwitch && run.bane) {
      run.things.push(makeThing('switch', run.safe));
      run.pendingSwitch = false;
    }
    // Now and then a whole row with one opening, on the way through (at the table, the empty place).
    // Mr. BaneWAP's march brings Mimes Against WAP, whatever the place.
    const wide = kinds.filter((kind) => WIDE.has(kind));
    const marching = run.pendingMarch && run.bane?.id === 'march' && !calm;
    if (marching || (!calm && wide.length && run.rows > 4 && Math.random() < 0.1 + d * 0.12)) {
      run.pendingMarch = false;
      const thing = makeThing(marching ? 'march' : pick(wide), run.safe);
      if (thing.kind === 'march') run.tally.mawSeen = true;
      thing.gap = thing.kind === 'ditch' ? -1 : run.safe;   // a ditch has no way round: only over
      thing.x = W / 2;
      thing.w = W;
      thing.h = thing.kind === 'table' ? 34 : thing.kind === 'march' ? 30 : thing.kind === 'ditch' ? 20 : 18;
      run.things.push(thing);
      run.rows += 1;
      return;
    }
    const most = run.rows < 4 ? 1 : d < 0.3 ? 1 : d < 0.65 ? 2 : 3;
    const count = calm ? 0 : 1 + Math.floor(Math.random() * most);
    const open = lanes.filter((lane) => lane !== run.safe).sort(() => Math.random() - 0.5);
    const blocked = new Set();
    for (const lane of open) {
      if (blocked.size >= count) break;
      if (blocked.has(lane)) continue;
      let kind = pick(solids);
      if (kind === 'dividers' || kind === 'mime') {
        const pair = [lane + 1, lane - 1].find((other) => other >= 0 && other < LANES && other !== run.safe && !blocked.has(other));
        if (pair == null) {
          kind = 'post';
        } else if (kind === 'mime') {
          // A mime, and beside it the wall it is miming: invisible, and also there.
          const mime = makeThing('mime', lane);
          mime.facing = Math.sign(pair - lane);
          const wall = makeThing('mimewall', pair);
          run.things.push(mime, wall);
          blocked.add(lane);
          blocked.add(pair);
          run.tally.mawSeen = true;
          continue;
        } else {
          const thing = makeThing('dividers', Math.min(lane, pair));
          thing.lanes = [Math.min(lane, pair), Math.max(lane, pair)];
          thing.x = (laneX(thing.lanes[0]) + laneX(thing.lanes[1])) / 2;
          thing.w = LANE_W * 2 - 14;
          thing.h = 22;
          run.things.push(thing);
          blocked.add(lane);
          blocked.add(pair);
          continue;
        }
      }
      run.things.push(makeThing(kind, lane));
      blocked.add(lane);
    }
    // Puddles (frost and furrows, in the field) and clowns in what is left; low things may lie on the way through.
    const free = lanes.filter((lane) => !blocked.has(lane));
    const low = (s.low || ['puddle']).filter(allowed);
    if (low.length && Math.random() < 0.14 + d * 0.12 + (s.low ? 0.12 : 0)) run.things.push(makeThing(pick(low), pick(free)));
    // This chapter's wonders, in the order the leg reaches them. Ones already in your almanac wait a little longer.
    if (run.wonderQueue.length && progress() >= run.wonderQueue[0].at) {
      const wonder = makeThing('wonder', pick(free));
      wonder.wonder = run.wonderQueue.shift();
      if (wonder.wonder.known) wonder.stay = 3.5;
      wonder.y -= 50;
      run.things.push(wonder);
      markWonder(wonder.wonder.id, 'here');
    }
    // The Egg, now and then. It is not for taking.
    if (progress() >= run.eggAt) {
      run.eggAt = Infinity;
      const egg = makeThing('egg', pick(free));
      egg.y -= 70;
      run.things.push(egg);
    }
    // Piles of flour: a little crust underfoot, and a ramp for a thrown slice.
    if (Math.random() < (0.16 + d * 0.06) * inKind('bone')) {
      const pile = makeThing('pile', pick(free));
      pile.y -= 20;
      run.things.push(pile);
    }
    // Baneberries: what Mr. BaneWAP is made of. Thicker on the ground while he is about, and where mimes are.
    const mimesAbout = run.things.some((other) => !other.wapped && (other.kind === 'mime' || other.kind === 'march'));
    if (allowed('baneberry') && Math.random() < (0.05 + (run.bane ? 0.16 : 0) + (mimesAbout ? 0.14 : 0)) * inKind('bane')) {
      const bane = makeThing('baneberry', pick(free));
      bane.y -= 50;
      run.things.push(bane);
    }
    // A slow beaver, now and then: they keep their own time, and lend it.
    if (allowed('beaver') && Math.random() < 0.06 + d * 0.04) {
      const beaver = makeThing('beaver', pick(free));
      beaver.y -= 40;
      run.things.push(beaver);
    }
    // Boonberries, the filling: more often when the filling runs low.
    if (Math.random() < (run.filling < 0.3 ? 0.34 : 0.2) * inKind('boon')) {
      const berry = makeThing('berry', pick(free));
      berry.y -= 60;
      run.things.push(berry);
    }
    // Boneberries, savoury: rare in most places, common in Bone.land, where they were first grown.
    if (allowed('boneberry') && Math.random() < (run.chapter === 10 ? 0.16 : 0.05) + (run.aura < 0.3 && run.filling < 0.3 ? 0.08 : 0)) {
      const bone = makeThing('boneberry', pick(free));
      bone.y -= 70;
      run.things.push(bone);
    }
    const clowns = (run.boon ? 0.62 : 0.14) * (s.id === 'plaza' ? 1.4 : 1);
    if (Math.random() < clowns) {
      const lane = pick(free);
      const clown = makeThing('clown', lane);
      clown.y -= 30;
      // An appetite: one slice, or seconds, more often further into the book.
      clown.want = Math.random() < 0.18 + d * 0.45 ? (Math.random() < d * 0.4 ? 3 : 2) : 1;
      run.things.push(clown);
    }
    run.rows += 1;
  };

  /* Forgiving by design: a near miss is a miss. Friends reach a little further; a (gathering) charm reaches wider still. */
  const hits = (thing) => {
    const py = run.y - 18;   // the pie rides at chest height
    const ph = 34;
    const pw = run.carrier.width * 0.85;
    const friendly = !thing.fatal;
    const charmReach = friendly && run.charm?.bracket === '()' ? 1.12 : 1;
    const reach = (thing.kind === 'clown' ? (run.boon ? 1.7 : 1.15) : friendly ? 1 : 0.76) * charmReach;
    const overlapY = Math.abs(thing.y - py) < (thing.h * reach + ph) / 2;
    if (!overlapY) return false;
    if (WIDE.has(thing.kind)) {
      const gapLeft = thing.gap * LANE_W - 4;
      const gapRight = (thing.gap + 1) * LANE_W + 4;
      return run.x - pw / 2 < gapLeft || run.x + pw / 2 > gapRight;
    }
    return Math.abs(thing.x - run.x) < (thing.w * reach + pw) / 2;
  };

  /* ─── Stepping: across the scene, a lane at a time ─── */
  const step = (dir) => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    // Frost underfoot: the next step slides a lane further.
    const slid = run.slideT > 0 && clamp(run.lane + dir * 2, 0, LANES - 1) !== clamp(run.lane + dir, 0, LANES - 1);
    const next = clamp(run.lane + dir * (slid ? 2 : 1), 0, LANES - 1);
    if (next === run.lane) {
      run.wobble = Math.min(1, run.wobble + 0.08); // bumping the edge of the lane jostles it a little
      run.tiltDir = clamp(run.tiltDir + dir * 0.45, -1, 1);
      return;
    }
    if (slid) {
      run.slideT = 0;
      run.tags.push({ x: laneX(next), y: run.y - 84, t: 0, text: 'SLID' });
    }
    run.from = run.x;
    run.lane = next;
    run.moveT = 0;
    run.dir = dir;
    run.stillT = 0;
    // Stepping under the tilt catches the balance instead of adding to the wobble.
    if (run.wobble >= 0.24 && Math.abs(run.tiltDir) >= 0.3 && Math.sign(dir) === Math.sign(run.tiltDir)) {
      run.wobble = Math.max(0, run.wobble - 0.14);
      run.tiltDir *= 0.25;
      run.steadied = Math.max(run.steadied, 0.75);
      run.tags.push({ x: laneX(next), y: run.y - 84, t: 0, text: 'CAUGHT · STEADIED' });
      spawnRing(laneX(next), run.y - 18, 28, colors.gold);
      sfx('catch');
      lean('caught');
      if (!run.caughtSaid) {
        run.caughtSaid = true;
        say('Caught the tilt: stepping under the lean steadies the plate.');
      }
      return;
    }
    run.tiltDir = clamp(run.tiltDir * 0.55 + dir * 0.55, -1, 1);
    sfx('step', dir);
    jostle(1);
  };

  /* Ahead and back: up the lanes toward what is coming, or down toward the start line. */
  const climb = (dir) => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    const next = clamp(run.row + dir, 0, ROWS - 1);
    if (next === run.row) {
      run.wobble = Math.min(1, run.wobble + 0.06);
      return;
    }
    run.fromY = run.y;
    run.row = next;
    run.moveYT = 0;
    run.stillT = 0;
    sfx('step', dir);
    jostle(0.8);
  };

  /* A hop: low things pass under it. The pie lifts a little off the plate, and lands with a jostle. */
  const jumpLift = () => (run?.jumpT > 0 ? Math.sin(Math.PI * (1 - run.jumpT / JUMP_DUR)) * 26 : 0);
  const airborne = () => jumpLift() > 9;
  const jump = () => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running' || run.jumpT > 0 || run.jumpCool > 0) return;
    // A deft hop right as a low hazard reaches the carrier lands steadier and readies a slice.
    const grazing = run.things.some((th) => !th.wapped && !th.cleared && !th.knocked && LOW.has(th.kind) && (th.fatal || SLIPS.has(th.kind))
      && Math.abs(th.y - run.y) < 42
      && (WIDE.has(th.kind) ? th.gap !== run.lane : Math.abs(th.x - run.x) < (th.w + 24) / 2));
    run.deftHop = grazing;
    run.stillT = 0;
    run.jumpT = JUMP_DUR;
    run.wobble = Math.min(1.2, run.wobble + (grazing ? 0.01 : 0.04));
    sfx('hop');
    spawnRing(run.x, run.y + 12, 22, colors.ink, 0.45);
    if (!run.jumpSaid) {
      run.jumpSaid = true;
      say('A hop. Low things pass under it: stones, snails, spools, puddles, frost, flour, a fallen banner.');
    }
  };

  /* Every step tilts the pie; hurried steps more; a thin pie, and Mr. BaneWAP's tax, more again. */
  function jostle(k) {
    const hurried = run.t - run.lastStep < 0.28;
    run.lastStep = run.t;
    const taxed = (run.bane?.id === 'tax' ? 1.8 + run.dust * 0.6 : 1) * (whole() ? 1 : 1.35);
    run.wobble = Math.min(1.2, run.wobble + (hurried ? run.carrier.hurried : run.carrier.wobble) * taxed * k * (run.fed > 0 ? 0.6 : 1));
    if (run.bane?.id === 'tax') run.tags.push({ x: run.x, y: run.y - 76, t: 0, text: 'TAX' });
  }

  /* An involuntary step: Mr. BaneWAP's rented wind. */
  const shove = (dir) => {
    run.stillT = 0;
    run.tiltDir = clamp(run.tiltDir + dir * 0.65, -1, 1);
    const next = clamp(run.lane + dir, 0, LANES - 1);
    if (next === run.lane) {
      run.wobble = Math.min(1.2, run.wobble + 0.12);
      return;
    }
    run.from = run.x;
    run.lane = next;
    run.moveT = 0;
    run.dir = dir;
    run.wobble = Math.min(1.2, run.wobble + 0.1);
  };

  /* ─── Throwing: aimed, not homing; the pie on the plate is never smaller ─── */
  const AIM_MAX = 0.62;          // radians either side of straight ahead
  const SLICE_SPEED = 520;
  const SLICE_REACH = 430;
  const throwFrom = () => ({ x: run.x, y: run.y - 30 - jumpLift() });
  /* What the game is tuned by: these defaults, then =tune{} in .spw/runtime/pie-rules.spw, then a
   * visit's own (the bench, ?powers=). Each value is held to a range, so a tune can change the feel
   * of the lanes but never break them. */
  const TUNE_RANGE = Object.freeze({
    aim_step: [0.04, 0.4], knock_swing: [0, 0.4], pad_pace: [0.5, 1], slow_land: [0.3, 0.9],
    foretell_after: [1, 8], flinch_chance: [0, 0.6], flinch_tilt: [0, 0.4], in_kind: [0, 1.5],
    swipe_across: [0.25, 1.2], swipe_along: [20, 90], ahead_bonus: [0, 0.5], drama: [0, 2]
  });
  const TUNE_DEFAULTS = Object.freeze({
    aim_step: 0.13, knock_swing: 0.12, pad_pace: 0.85, slow_land: 0.55, foretell_after: 3.2, flinch_chance: 0.22, flinch_tilt: 0.16, in_kind: 0.9,
    swipe_across: 0.5, swipe_along: 40, ahead_bonus: 0.18, drama: 1
  });
  const TUNE = { ...TUNE_DEFAULTS };
  const tuneWith = (values = {}) => Object.entries(values).forEach(([key, value]) => {
    const range = TUNE_RANGE[key];
    if (range && Number.isFinite(value)) TUNE[key] = clamp(value, range[0], range[1]);
  });
  /* What each knock costs, from !knocks{} when the rules are read (the code's KNOCKS until then). */
  let knockRules = {};
  /** Turn the needle a notch (Q/E, [ ]); it holds there until something turns it again. */
  const turnAim = (dir) => {
    if (!run) return;
    run.aim.a = clamp(run.aim.a + dir * TUNE.aim_step, -AIM_MAX, AIM_MAX);
  };
  const whole = () => run.aura >= SLICE_COST && run.filling >= SLICE_COST;   // both ingredients on hand
  /* The pies grow with the aura: plenty of flour and boonberries make a bigger slice, and a more satisfying one. */
  const richness = () => clamp(Math.min(run.aura, run.filling), 0, 1);
  const helping = (rich) => (rich >= 0.85 ? 2 : rich >= 0.5 ? 1.5 : 1);   // pips a whole slice fills
  const aimable = (thing) => (thing.kind === 'clown' || thing.kind === 'switch') && !thing.wapped && thing.y < run.y - 30;
  /* Where the needle points now: the nearest target the straight line passes, and how close to its face. */
  const sighted = (angle = run.aim.a) => {
    const from = throwFrom();
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    let best = null;
    run.things.filter(aimable).forEach((thing) => {
      const tx = thing.x - from.x;
      const ty = (thing.y - 8) - from.y;
      const along = tx * dx + ty * dy;
      if (along <= 0 || along > SLICE_REACH) return;
      const off = Math.abs(tx * dy - ty * dx);
      if (off < 16 && (!best || along < best.along)) best = { thing, along, off };
    });
    return best;
  };
  /* Trace a prospective slice path, including wall banks, Bonk glass banks, bronze post curves, and flour ramps. */
  const traceTrajectory = (angle = run.aim.a) => {
    const from = throwFrom();
    const points = [{ x: from.x, y: from.y }];
    let x = from.x;
    let y = from.y;
    let vx = Math.sin(angle) * SLICE_SPEED;
    let vy = -Math.cos(angle) * SLICE_SPEED;
    let reach = SLICE_REACH;
    let loft = airborne() ? 120 : 0;
    let bounces = 0;
    let curved = false;
    let ramped = false;
    const bent = new Set();
    let hit = null;
    let label = '';
    const dt = 14 / SLICE_SPEED;
    for (let stepIdx = 0; stepIdx < 34 && reach > 0; stepIdx += 1) {
      if (run.bane?.id === 'wind') vx += run.bane.dir * 160 * dt;
      const dist = Math.hypot(vx, vy) * dt;
      x += vx * dt;
      y += vy * dt;
      reach -= dist;
      if (x < 8 || x > W - 8) {
        x = clamp(x, 8, W - 8);
        vx *= -1;
        bounces += 1;
        reach -= 70;
        points.push({ x, y, bank: true });
      }
      if (loft > 0) loft -= dist;
      let stopped = false;
      for (const thing of run.things) {
        if (thing.wapped) continue;
        if (thing.kind === 'pile' && !bent.has(thing) && Math.abs(thing.x - x) < thing.w * 0.5 && Math.abs(thing.y - y) < 12) {
          bent.add(thing);
          loft = Math.max(0, loft) + 110;
          ramped = true;
          points.push({ x, y, ramp: true });
          continue;
        }
        if (loft > 0 && thing.kind !== 'clown' && thing.kind !== 'switch') continue;
        if (thing.kind === 'ditch' || thing.kind === 'hole' || thing.kind === 'baneberry') continue;
        if (WIDE.has(thing.kind)) {
          const inGap = x > thing.gap * LANE_W && x < (thing.gap + 1) * LANE_W;
          if (Math.abs(thing.y - y) < thing.h * 0.5 + 4 && !inGap) { stopped = true; break; }
          continue;
        }
        if (Math.abs(thing.x - x) > thing.w * 0.6 + 7) continue;
        if (Math.abs((thing.y - 6) - y) > thing.h * 0.5 + 6) continue;
        if (thing.kind === 'clown' || thing.kind === 'switch') {
          hit = thing;
          label = bounces > 0 ? 'BANK SHOT' : curved ? 'CURVE SHOT' : ramped ? 'LOFT SHOT' : 'THROW';
          stopped = true;
          break;
        }
        if ((thing.kind === 'clerk' || thing.kind === 'subject') && whole() && !thing.shared) {
          hit = thing;
          label = 'SHARE SLICE';
          stopped = true;
          break;
        }
        if (thing.kind === 'post' && !bent.has(thing)) {
          bent.add(thing);
          curved = true;
          const speed = Math.hypot(vx, vy);
          const target = run.things.filter(aimable).find((other) => other.y < thing.y && thing.y - other.y < 260);
          if (target) {
            const tx = target.x - x;
            const ty = (target.y - 8) - y;
            const d = Math.hypot(tx, ty) || 1;
            vx = vx * 0.28 + (tx / d) * speed * 0.72;
            vy = vy * 0.28 + (ty / d) * speed * 0.72;
          } else {
            vx += Math.sign(x - thing.x || 1) * 260;
          }
          const k = speed / (Math.hypot(vx, vy) || 1);
          vx *= k;
          vy *= k;
          reach += 50;
          points.push({ x, y, curve: true });
          continue;
        }
        if (thing.kind === 'pane' && !bent.has(thing)) {
          bent.add(thing);
          bounces += 1;
          const speed = Math.hypot(vx, vy);
          const side = Math.sign(x - thing.x || 1);
          const target = run.things.filter(aimable).find((other) => other.y < thing.y && thing.y - other.y < 240 && Math.sign(other.x - thing.x || side) === side);
          if (target) {
            const tx = target.x - x;
            const ty = (target.y - 8) - y;
            const d = Math.hypot(tx, ty) || 1;
            vx = (tx / d) * speed;
            vy = (ty / d) * speed;
          } else {
            vx = side * (Math.abs(vx) + 300);
            const k = speed / (Math.hypot(vx, vy) || 1);
            vx *= k;
            vy *= k;
          }
          reach -= 30;
          points.push({ x, y, bank: true });
          continue;
        }
        if (['puddle', 'snail', 'berry', 'frost', 'furrow', 'egg', 'wonder', 'beaver'].includes(thing.kind)) continue;
        stopped = true;
        break;
      }
      if (stopped || y < -20) break;
    }
    points.push({ x, y });
    return { points, hit, label, bounces, curved, ramped };
  };
  const throwSlice = (angle = null) => {
    if (state !== 'running') return;
    if (run.sliceReady < 1) {
      run.wobble = Math.min(1.2, run.wobble + 0.04); // reaching for a slice that is not there yet
      return;
    }
    const wasPoised = poised();
    // Short of an ingredient, the slice goes anyway, without it: the clowns are not particular.
    const missing = whole() ? null : run.aura < SLICE_COST && run.filling < SLICE_COST ? 'everything' : run.aura < SLICE_COST ? 'crust' : 'filling';
    if (missing && !run.thinSaid) {
      run.thinSaid = true;
      const need = missing === 'crust' ? 'flour' : missing === 'filling' ? 'boonberries' : 'flour and boonberries';
      say(`The pie is thin: this slice goes without its ${missing === 'everything' ? 'crust or filling' : missing}. Find ${need} to make them whole again.`);
    }
    run.sliceReady = 0;
    const rich = richness();   // measured before the aura pays for it
    run.aura = Math.max(0, run.aura - SLICE_COST);         // the pie in hand is made whole again from the aura:
    run.filling = Math.max(0, run.filling - SLICE_COST);   // crust and filling both
    const a = angle == null ? run.aim.a : clamp(angle, -AIM_MAX * 1.4, AIM_MAX * 1.4);
    const from = throwFrom();
    const shot = (heading, echo = false) => ({ x: from.x, y: from.y, vx: Math.sin(heading) * SLICE_SPEED, vy: -Math.cos(heading) * SLICE_SPEED, reach: SLICE_REACH + (wasPoised ? 45 : 0), bounces: 0, t: 0, bent: new Set(), ramped: new Set(), loft: 0, missing, echo, poised: wasPoised, helping: missing ? 1 : helping(rich) + (run.tin > 0 ? 0.5 : 0), size: missing ? 0.85 : 0.9 + rich * 0.6 });
    const first = shot(a);
    if (run.tin > 0 && !missing) run.tin -= 1;   // the sliver tin: half again, three times
    sfx('throw');
    // Thrown from the top of a hop, a slice is lofted as if off a ramp.
    if (airborne()) {
      first.loft = 120;
      first.ramped.add('jump');
      run.tags.push({ x: run.x, y: run.y - 100, t: 0, text: 'JUMP THROW' });
    } else if (wasPoised) {
      run.tags.push({ x: run.x, y: run.y - 98, t: 0, text: 'POISED THROW' });
      spawnRing(from.x, from.y, 26, colors.gold, 0.45);
    }
    run.throws.push(first);
    // Echo-wrens: the throw comes back as its own mirror, free.
    if (run.echoes > 0) {
      run.echoes -= 1;
      run.throws.push(shot(Math.abs(a) < 0.08 ? 0.3 * pick([-1, 1]) : -a, true));
    }
    if (missing) run.tags.push({ x: run.x, y: run.y - 80, t: 0, text: missing === 'everything' ? 'A THIN SLICE' : `NO ${missing.toUpperCase()}` });
    if (wasPoised) run.wobble = Math.max(0, run.wobble - 0.05);
    else run.wobble = Math.min(1.2, run.wobble + 0.06);
  };

  /* A slice in flight meets the city. */
  const flySlice = (shot, dt) => {
    shot.t += dt;
    if (run.bane?.id === 'wind') shot.vx += run.bane.dir * 160 * dt;   // a rented wind drifts it
    const stepDist = Math.hypot(shot.vx, shot.vy) * dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.reach -= stepDist;
    if (!reduced?.matches && Math.random() < 0.48) {
      run.trails.push({
        x: shot.x + rand(-3, 3),
        y: shot.y + rand(-3, 3),
        r: (shot.bounces > 0 || shot.curved || shot.poised) ? 2.4 : 1.7,
        gold: Boolean(shot.bounces > 0 || shot.curved || shot.ramped.size > 0 || shot.poised),
        t: 0
      });
    }
    // The walls bounce it; each bounce costs reach, and makes a bank shot.
    if (shot.x < 8 || shot.x > W - 8) {
      shot.x = clamp(shot.x, 8, W - 8);
      shot.vx *= -1;
      shot.bounces += 1;
      shot.reach -= 70;
      spawnRing(shot.x, shot.y, 18, '#f2c14e', 0.38);
    }
    if (shot.loft > 0) shot.loft -= stepDist;
    for (const thing of run.things) {
      if (thing.wapped) continue;
      // A pile is a ramp: over it, the slice is lofted; piles in a row stack the loft.
      if (thing.kind === 'pile' && !shot.ramped.has(thing) && Math.abs(thing.x - shot.x) < thing.w * 0.5 && Math.abs(thing.y - shot.y) < 12) {
        shot.ramped.add(thing);
        shot.loft = Math.max(0, shot.loft || 0) + 110;
        sfx('ramp');
        spawnRing(thing.x, thing.y, 24, '#e0a95a', 0.45);
        run.tags.push({ x: shot.x, y: shot.y - 12, t: 0, text: shot.ramped.size > 1 ? `RAMP ×${shot.ramped.size}` : 'RAMP' });
        lean('ramp');
        continue;
      }
      if (shot.loft > 0 && thing.kind !== 'clown' && thing.kind !== 'switch') {
        if ((thing.kind === 'march' || thing.kind === 'mime' || thing.kind === 'mimewall') && !shot.overMimes && Math.abs(thing.y - shot.y) < 16) {
          shot.overMimes = true;
          shot.ramped.add('mimes');
          run.tags.push({ x: shot.x, y: shot.y - 18, t: 0, text: 'OVER THE MIMES' });
          tally('wap');
          lean('over_mimes');
        }
        continue;   // lofted: over it
      }
      if (thing.kind === 'ditch' || thing.kind === 'hole') continue;   // a slice flies over a hole in the ground
      // A warm slice passing over a baneberry sweetens its core: mimes will not touch it, and stepping on it feeds the filling.
      if (thing.kind === 'baneberry' && !thing.sweetened && Math.abs(thing.x - shot.x) < thing.w * 0.75 + 6 && Math.abs(thing.y - shot.y) < thing.h * 0.65 + 6) {
        thing.sweetened = true;
        run.sweetened += 1;
        sfx('sweet');
        spawnRing(thing.x, thing.y, 26, '#f2c14e', 0.5);
        run.tags.push({ x: thing.x, y: thing.y - 22, t: 0, text: 'SWEETENED' });
        tally('wap');
        lean('sweetened');
        if (!run.sweetSaid) {
          run.sweetSaid = true;
          say('A warm slice passed over a baneberry and sweetened its core. Mimes will leave it alone; step on it for filling.');
        }
        continue;
      }
      if (WIDE.has(thing.kind)) {
        const inGap = shot.x > thing.gap * LANE_W && shot.x < (thing.gap + 1) * LANE_W;
        if (Math.abs(thing.y - shot.y) < thing.h * 0.5 + 4 && !inGap) {
          if (thing.kind === 'march') { tally('maw'); lean('boxed'); }
          return splat(shot, thing.kind === 'march' ? 'boxed by mimes' : 'splat');
        }
        continue;
      }
      if (Math.abs(thing.x - shot.x) > thing.w * 0.6 + 6 * (shot.size || 1)) continue;   // a bigger slice reaches wider
      if (Math.abs((thing.y - 6) - shot.y) > thing.h * 0.5 + 6) continue;
      if (thing.kind === 'clown' || thing.kind === 'switch') {
        const centred = Math.abs(thing.x - shot.x) < (shot.poised ? 9 : 6);
        const perfect = centred || shot.bounces > 0 || shot.ramped.size > 0 || shot.curved;
        if (thing.kind === 'switch') foil(thing, perfect);
        else if (shot.missing) wap(thing, 'thin', shot.missing);
        else wap(thing, perfect ? 'perfect' : 'throw', null, shot.helping);
        if (shot.bounces > 0 && perfect) run.tags.push({ x: thing.x, y: thing.y - 54, t: 0, text: 'OFF THE WALL' });
        else if (shot.curved && perfect) run.tags.push({ x: thing.x, y: thing.y - 54, t: 0, text: 'AROUND THE POST' });
        shot.done = true;
        return;
      }
      if (thing.kind === 'post') {
        // Bronze posts curve for everyone: the slice bends round it, curving toward the nearest clown or switch ahead.
        if (!shot.bent.has(thing)) {
          shot.bent.add(thing);
          shot.curved = true;
          const speed = Math.hypot(shot.vx, shot.vy);
          const target = run.things
            .filter(aimable)
            .filter((other) => other.y < thing.y && thing.y - other.y < 260)
            .sort((a, b) => Math.hypot(a.x - thing.x, a.y - thing.y) - Math.hypot(b.x - thing.x, b.y - thing.y))[0];
          if (target) {
            const tx = target.x - shot.x;
            const ty = (target.y - 8) - shot.y;
            const d = Math.hypot(tx, ty) || 1;
            shot.vx = shot.vx * 0.28 + (tx / d) * speed * 0.72;
            shot.vy = shot.vy * 0.28 + (ty / d) * speed * 0.72;
          } else {
            shot.vx += Math.sign(shot.x - thing.x || pick([-1, 1])) * 260;
          }
          const k = speed / (Math.hypot(shot.vx, shot.vy) || 1);
          shot.vx *= k;
          shot.vy *= k;
          shot.reach += 60;
          sfx('post');
          spawnRing(thing.x, thing.y, 26, '#f0c97a', 0.45);
          run.tags.push({ x: thing.x, y: thing.y - 22, t: 0, text: 'CURVED' });
        }
        continue;
      }
      if (thing.kind === 'pane') {
        // Bonk glass banks a slice, and remembers being struck: a whole slice leaves a second shard-slice in flight.
        if (!shot.bent.has(thing)) {
          shot.bent.add(thing);
          const speed = Math.hypot(shot.vx, shot.vy);
          const side = Math.sign(shot.x - thing.x || pick([-1, 1]));
          const target = run.things
            .filter(aimable)
            .filter((other) => other.y < thing.y && thing.y - other.y < 240 && Math.sign(other.x - thing.x || side) === side)
            .sort((a, b) => Math.hypot(a.x - thing.x, a.y - thing.y) - Math.hypot(b.x - thing.x, b.y - thing.y))[0];
          if (target) {
            const tx = target.x - shot.x;
            const ty = (target.y - 8) - shot.y;
            const d = Math.hypot(tx, ty) || 1;
            shot.vx = (tx / d) * speed;
            shot.vy = (ty / d) * speed;
          } else {
            shot.vx = side * (Math.abs(shot.vx) + 300);
            const k = speed / (Math.hypot(shot.vx, shot.vy) || 1);
            shot.vx *= k;
            shot.vy *= k;
          }
          shot.bounces += 1;
          shot.reach -= 30;
          sfx('glass');
          spawnRing(thing.x, thing.y, 28, '#96cdd2', 0.5);
          if (!shot.missing && !shot.remembered) {
            shot.remembered = true;
            const shardVx = -shot.vx * 0.78;
            const shardVy = -Math.abs(shot.vy);
            const sk = speed / (Math.hypot(shardVx, shardVy) || 1);
            const shardBent = new Set(shot.bent);
            run.throws.push({
              x: thing.x,
              y: thing.y - 6,
              vx: shardVx * sk,
              vy: shardVy * sk,
              reach: Math.max(180, shot.reach),
              bounces: 1,
              t: 0,
              bent: shardBent,
              ramped: new Set(shot.ramped),
              loft: shot.loft,
              missing: null,
              echo: true,
              remembered: true,
              helping: shot.helping,
              size: (shot.size || 1) * 0.85
            });
            run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: 'THE GLASS REMEMBERS' });
          } else {
            run.tags.push({ x: thing.x, y: thing.y - 24, t: 0, text: 'OFF THE GLASS' });
          }
        }
        continue;
      }
      if (thing.kind === 'sack') {
        // A slice into a bag bursts it into a pile: the slice becomes the ramp, and is not wasted.
        thing.kind = 'pile';
        dust(0.4);
        thing.w = 44;
        thing.h = 14;
        thing.floured = true;
        sfx('flour');
        spawnRing(thing.x, thing.y, 28, '#f2ead8', 0.45);
        for (let i = 0; i < 10; i += 1) run.puffs.push({ x: thing.x + rand(-12, 12), y: thing.y, vx: rand(-50, 50), vy: rand(-60, -10), t: 0 });
        run.tags.push({ x: thing.x, y: thing.y - 22, t: 0, text: 'RAMP MADE' });
        shot.done = true;
        return undefined;
      }
      if ((thing.kind === 'clerk' || thing.kind === 'subject') && !shot.missing && !thing.shared) {
        // A whole slice shared with a clerk settles the DAMAGE slip; shared with a subject, they trade a loaf's crust.
        thing.shared = true;
        thing.wapped = true;
        thing.wapT = 0.25;
        thing.spin = 0;
        run.shared += 1;
        lean('shared');
        shot.done = true;
        sfx('share');
        spawnRing(thing.x, thing.y, 26, colors.gold, 0.5);
        if (thing.kind === 'clerk') {
          run.wobble = Math.max(0, run.wobble - 0.16);
          run.tags.push({ x: thing.x, y: thing.y - 28, t: 0, text: 'SETTLED · NO DAMAGE' });
          if (!run.sharedClerkSaid) {
            run.sharedClerkSaid = true;
            say('Shared a slice with the clerk. He writes SETTLED on the slip, and steps aside.');
          }
        } else {
          run.aura = Math.min(1, run.aura + 0.24);
          run.tags.push({ x: thing.x, y: thing.y - 28, t: 0, text: 'SHARED · + CRUST' });
          if (!run.sharedSubjectSaid) {
            run.sharedSubjectSaid = true;
            say('Shared a slice with one of the King’s subjects. They leave you a little crust from their loaf.');
          }
        }
        return undefined;
      }
      if (thing.kind === 'mime' || thing.kind === 'mimewall') {   // caught in an invisible box
        tally('maw');
        lean('boxed');
        return splat(shot, 'boxed');
      }
      if (thing.kind === 'wasps' || thing.kind === 'pigeon') return splat(shot, thing.kind === 'wasps' ? 'snatched by wasps' : 'a pigeon took it');
      if (['puddle', 'snail', 'berry', 'frost', 'furrow', 'egg', 'wonder', 'beaver'].includes(thing.kind)) continue;   // low things: it flies over
      return splat(shot, 'splat');
    }
    if (shot.reach <= 0 || shot.y < -30 || shot.y > H + 30) {
      shot.done = true;
      waste(shot);
    }
    return undefined;
  };
  function splat(shot, what) {
    shot.done = true;
    run.tags.push({ x: shot.x, y: shot.y - 10, t: 0, text: what.toUpperCase() });
    for (let i = 0; i < 6; i += 1) run.puffs.push({ x: shot.x, y: shot.y, vx: rand(-40, 40), vy: rand(-30, 30), t: 0.4 });
    waste(shot);
  }
  /* A slice that reached nobody. Mr. BoonWAP catches them while he holds court; otherwise the aura pays. */
  function waste(shot) {
    if (run.boon) {
      run.tags.push({ x: W / 2, y: PRESENCE_Y + 40, t: 0, text: 'CAUGHT BY BOONWAP' });
      return;
    }
    run.wasted += 1;
    run.aura = Math.max(0, run.aura - WASTE_COST);
    run.filling = Math.max(0, run.filling - WASTE_COST);
    run.tags.push({ x: shot.x, y: Math.max(40, shot.y) + 14, t: 0, text: 'WASTED' });
    if (run.wasted === 1) say('A slice wasted. The aura that keeps the pie whole pays for it.');
  }

  /* Flour in the air: a bag burst, a slice into a bag, a pile kicked up. The pies feed on it. */
  function dust(k) {
    run.dust = Math.min(1, run.dust + k);
    if ((run.boon || run.bane) && run.dust > 0.3 && !run.dustSaid) {
      run.dustSaid = true;
      run.tags.push({ x: W / 2, y: PRESENCE_Y - 52, t: 0, text: 'FLOUR IN THE AIR FEEDS HIM' });
      say(run.boon ? 'Flour in the air: Mr. BoonWAP drinks it in, and throws faster.' : 'Flour in the air: Mr. BaneWAP drinks it in, and his scheme quickens.');
    }
  }

  /* Baneberries reaching Mr. BaneWAP: here, his scheme lasts and quickens; away, he comes sooner and stays longer. */
  function feedBane(n, from) {
    run.baneStore = (run.baneStore || 0) + n;
    lean('bane_fed', n);
    if (run.bane) {
      run.bane.dur = Math.min(16, run.bane.dur + 1.2 * n);
      run.bane.nextBeat = Math.max(0.2, run.bane.nextBeat - 0.4 * n);
    } else {
      run.nextPresence -= 2 * n;
    }
    if (from) run.tags.push({ x: from.x, y: from.y - 24, t: 0, text: '→ BANEWAP' });
    if (!run.baneFedSaid) {
      run.baneFedSaid = true;
      say('A baneberry, gathered for Mr. BaneWAP. He is made of them; every one makes his next scheme last.');
    }
  }

  /* A satisfied clown goes home delighted, and tosses back whatever the aura is shortest of. */
  function thanks(thing) {
    const filling = run.filling <= run.aura;
    if (filling) run.filling = Math.min(1, run.filling + 0.15);
    else run.aura = Math.min(1, run.aura + 0.15);
    run.tags.push({ x: thing.x, y: thing.y - 72, t: 0, text: `SATISFIED · + ${filling ? 'FILLING' : 'CRUST'}` });
    run.bursts.push({ x: thing.x, y: thing.y - 30, t: 0, size: 0.7 });
    if (!run.thanksSaid) {
      run.thanksSaid = true;
      say(`Satisfied. The clown goes home delighted, and tosses back a little ${filling ? 'filling' : 'flour'}.`);
    }
  }

  /* ─── WAP: a clown gets the pie, square, and the pie on the plate is no smaller ─── */
  const wap = (thing, how = 'plate', missing = null, size = 1) => {
    if (how === 'plate' && thing.fedT > 0) return;   // still chewing the last one
    const perfect = how === 'perfect';
    // Satisfaction: a whole slice fills a pip — a pip and a half, rich; two, a full pie — and a Perfect
    // twice that; a slice short of crust or filling half a pip, crumbs a quarter.
    const portion = missing ? (missing === 'everything' ? 0.25 : 0.5) : size * (perfect ? 2 : 1);
    if (!missing && size > 1) run.tags.push({ x: thing.x, y: thing.y - 86, t: 0, text: size >= 2 ? 'A FULL PIE' : 'A BIG SLICE' });
    thing.fed = (thing.fed || 0) + portion;
    thing.fedT = 0.8;
    thing.pied = true;
    thing.missing = missing;
    const want = thing.want || 1;
    const satisfied = thing.fed >= want - 1e-6;
    if (satisfied) {
      thing.wapped = true;
      thing.wapT = 0;
      thing.spin = pick([-1, 1]);
      run.satisfied += 1;
      lean('satisfied');
      tally('wap', 0.5);
      thanks(thing);
    } else {
      run.tags.push({ x: thing.x, y: thing.y - 72, t: 0, text: `${Math.round(thing.fed * 100) / 100} OF ${want} · MORE` });
    }
    run.waps += perfect ? 2 : 1;
    // WAPs close together run on: a combo steadies the pie and readies the next slice.
    run.combo = run.comboT > 0 ? run.combo + 1 : 1;
    run.comboT = 2.6;
    if (run.combo >= 2) {
      run.tags.push({ x: thing.x, y: thing.y - 58, t: 0, text: `COMBO ×${run.combo}` });
      run.wobble = Math.max(0, run.wobble - 0.1 * Math.min(run.combo, 4));
      if (run.combo >= 3) run.sliceReady = 1;
      run.bestCombo = Math.max(run.bestCombo || 0, run.combo);
    }
    const lift = 1 + Math.min(run.combo - 1, 6) * 0.08;
    if (missing) {
      // A thin pie, and the clown is satisfied anyway: it counts once, never twice.
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: missing === 'everything' ? 'WAP · CRUMBS' : `WAP · NO ${missing.toUpperCase()}` });
      run.bursts.push({ x: thing.x, y: thing.y - 14, t: 0, size: 0.8 });
      if (record.sound) wapSound(lift, panOf(thing.x));
      say(`WAP, thin: ${missing === 'everything' ? 'crumbs, mostly' : `no ${missing}`}. ${satisfied ? 'Enough, just: the clown is satisfied.' : 'It helps; the clown wants more.'}`);
      return;
    }
    if (perfect) {
      run.perfects += 1;
      lean('perfect');
      run.wobble = Math.max(0, run.wobble - 0.3);
      spawnRing(thing.x, thing.y - 10, 32, '#f2c14e', 0.5);
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'PERFECT' });
    } else if (how === 'plate') {
      run.wobble = Math.min(1.2, run.wobble + 0.18);
    }
    run.bursts.push({ x: thing.x, y: thing.y - 14, t: 0, size: ((perfect ? 1.25 : 1) + Math.min(run.combo, 6) * 0.06) * (0.85 + Math.min(1, TUNE.drama) * 0.3) });
    impact(perfect ? 'perfect' : 'clown', thing.x, thing.y - 52);
    if (run.combo >= 3) impact('combo', thing.x, thing.y - 84, { scale: 0.5 + run.combo * 0.15, word: `COMBO ×${run.combo}!` });
    if (record.sound) wapSound(lift, panOf(thing.x));
    const by = how === 'boon' ? ' Mr. BoonWAP threw that one.' : perfect ? ' Perfectly timed: it counts twice, and the pie steadies.' : '';
    say(run.waps === 1
      ? `WAP. A clown got the pie in the eye, and loved it. The pie on the plate is no smaller.${by}`
      : `WAP. ${run.waps} for the clowns, and still one pie.${by}`);
  };

  /* Mr. BaneWAP's off switch: every scheme has one. */
  const foil = (thing, perfect = false) => {
    if (!run.bane) return;
    const scheme = SCHEMES[run.bane.id];
    thing.wapped = true;
    thing.wapT = 0;
    thing.spin = 1;
    run.bane = null;
    run.presenceEnded = run.t;
    run.foils += 1;
    tally('wap', 2);
    lean('foiled');
    impact('switch', thing.x ?? W / 2, (thing.y ?? PRESENCE_Y) - 30);
    sfx('foil');
    spawnRing(thing.x, thing.y, 38, '#d6473e', 0.6);
    // His march goes home with him: Mimes Against WAP never stay for a foiled man.
    run.things.forEach((other) => {
      if (other.wapped || !['march', 'mime', 'mimewall'].includes(other.kind)) return;
      other.wapped = true;
      other.wapT = 0.2;
      other.spin = other.x < W / 2 ? -1 : 1;
    });
    run.nextPresence = rand(15, 22);
    if (perfect) run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'FOILED FROM AFAR' });
    // A foiled villain says more than he means to.
    const said = speak('bane');
    const words = said ? `“${said.text}”` : scheme.foiled;
    showToast(`Mr. BaneWAP, foiled${said?.isNew ? ' · ✦ new' : ''}`, words, 6000, 'bane');
    say(`Foiled. Mr. BaneWAP: ${said ? said.text : scheme.foiled}`);
  };

  /* ─── Title cards: the prophecy and the cuts, like a silent film ─── */
  const paintCardChapters = (activeChap = chosenStartChapter) => {
    if (!cardChapters) return;
    const found = discoveries(record);
    const maxChap = clamp(Math.max(record.reached || 1, firstChapter, activeChap || 1, ...(found.visited || [1])), 1, TOTAL_CHAPTERS);
    if (maxChap <= 1 || introMode) {
      cardChapters.hidden = true;
      cardChapters.replaceChildren();
      return;
    }
    const label = document.createElement('span');
    label.className = 'pie-card-chapters-label';
    label.textContent = 'Start leg:';
    const buttons = [];
    for (let n = 1; n <= maxChap; n += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pie-card-chapter-btn${n === chosenStartChapter ? ' is-active' : ''}${mimesHold(n) ? ' is-held' : ''}`;
      btn.textContent = String(n);
      btn.title = `${chapterWords(n)} (${(SCENES.find((s) => s.id === (CHAPTER_SCENE[n] || 'lanes')) || SCENES[2]).card.replace(/\.$/, '')})${mimesHold(n) ? ' · held by the mimes' : ''}`;
      btn.setAttribute('aria-label', `Start at ${chapterWords(n)}`);
      btn.setAttribute('aria-pressed', n === chosenStartChapter ? 'true' : 'false');
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        chosenStartChapter = n;
        paintCardChapters(n);
        if (state === 'title' || state === 'over') {
          cardAction.textContent = state === 'over'
            ? `Carry another pie from ${chapterWords(n)}`
            : n > 1 ? `Carry the pie from ${chapterWords(n)}` : 'Carry the pie';
          prepareLeg(n).then((leg) => {
            if ((state === 'title' || state === 'over') && chosenStartChapter === n) paintFlows(leg);
          });
          draw();
        }
      });
      buttons.push(btn);
    }
    cardChapters.replaceChildren(label, ...buttons);
    cardChapters.hidden = false;
  };
  const showCard = (title, line, action) => {
    cardTitle.textContent = title;
    cardLine.textContent = line || '';
    cardAction.textContent = action || '';
    cardAction.hidden = !action;
    card.hidden = false;
  };
  const hideCard = () => {
    card.hidden = true;
    if (cardChapters) cardChapters.hidden = true;
    if (cardModes) cardModes.hidden = true;
    cardLinks?.replaceChildren();
  };

  /* A toast: where we are now, and who is under the hat. Play does not stop for it. */
  const showToast = (title, line, ms = 2600, voice = '') => {
    if (!toast || record.view.zen) return;   // zen: nothing pops up; the live region still says it
    toastTitle.textContent = title;
    toastLine.textContent = line || '';
    toast.dataset.voice = voice;
    toast.classList.remove('is-in');
    void toast.offsetWidth;
    toast.classList.add('is-in');
    clearTimeout(toastTimer);
    // The words stay, quieter, until the next ones: a caption can be read again.
    toastTimer = setTimeout(() => toast.classList.remove('is-in'), ms);
  };
  const hideToast = () => {
    clearTimeout(toastTimer);
    toast?.classList.remove('is-in');
  };

  /* Where the reader found the game, to send them back there (pie-segues.mjs). */
  const from = (() => {
    try {
      // The link's own word first; then the page the reader actually came from; then, after a reload, the last one kept.
      const given = safeReturn(new URLSearchParams(window.location.search).get('from'));
      const ref = document.referrer ? new URL(document.referrer) : null;
      const came = ref && ref.origin === window.location.origin && ref.pathname !== window.location.pathname ? safeReturn(ref.pathname + ref.hash) : null;
      const chosen = given || came || safeReturn(window.sessionStorage.getItem('lore.pie.from'));
      if (chosen) window.sessionStorage.setItem('lore.pie.from', chosen);
      return chosen;
    } catch {
      return null;
    }
  })();
  let lastCarry = null;
  const goBack = () => {
    if (!from) return;
    leaveBackNote({
      path: from,
      place: lastCarry ? chapterWords(lastCarry.chapter) : null,
      cobbles: lastCarry?.cobbles ?? null,
      waps: lastCarry?.waps || 0,
      carrier: lastCarry?.carrier || null
    });
  };
  if (returnLink && from) {
    returnLink.href = from;
    returnLink.textContent = `↩ Back to ${describeReturn(from)}`;
    returnLink.hidden = false;
    returnLink.addEventListener('click', goBack);
  }
  const returnAnchor = () => {
    if (!from) return null;
    const a = document.createElement('a');
    a.href = from;
    a.className = 'pie-card-link';
    a.textContent = `↩ Back to ${describeReturn(from)}`;
    a.addEventListener('click', goBack);
    return a;
  };

  /* ─── The legs: a chapter's prose and its wonders, fetched as the carry reaches it ─── */
  let almanacData = null;
  const loadAlmanacData = () => {
    almanacData = almanacData || fetch('/book/content/world/almanac.json').then((res) => (res.ok ? res.json() : null)).catch(() => null);
    return almanacData;
  };
  const legs = new Map();
  const voiceName = (type) => (/^custom-/.test(type || '') ? type.replace(/^custom-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : null);
  async function loadLeg(n) {
    const [chapter, almanac] = await Promise.all([
      fetch(`/book/content/chapters/${pad2(n)}.json`).then((res) => (res.ok ? res.json() : null)).catch(() => null),
      loadAlmanacData()
    ]);
    const paras = [];
    (chapter?.sections || []).forEach((section, sec) => {
      const walk = (node) => (node.content || []).forEach((item) => {
        if (item.type === 'paragraph' && item.text) {
          // Variant zero: the book's own words; slots stay ready to turn with the carry's lean.
          const rawText = String(item.text);
          const text = rawText.replace(/\{\{([a-z0-9-]+)\}\}/gi, (_, name) => item.slots?.[name]?.variants?.[0] ?? '');
          paras.push({ text, rawText, slots: item.slots || null, id: section.id || null, sec, voice: voiceName(section.type) });
        } else if (Array.isArray(item.content)) {
          walk(item);
        }
      });
      walk(section);
    });
    const chars = paras.reduce((sum, para) => sum + para.text.length, 0);
    // The passage cues the carry: the pies arrive when the words speak of them, a door's place begins
    // where its section does, Boof's sections bring her across the lanes, and prose sightings notice a stroke.
    const plain = (text) => String(text || '').replace(/[’']/g, "'").toLowerCase();
    const lower = paras.map((para) => plain(para.text));
    paras.forEach((para, i) => {
      if (lower[i].includes('boonwap')) para.cue = 'boon';
      else if (lower[i].includes('banewap')) para.cue = 'bane';
    });
    SEGUES.filter((segue) => segue.chapter === n).forEach((segue) => {
      const i = segue.anchor ? paras.findIndex((para) => para.id === segue.anchor) : lower.findIndex((text) => text.includes(plain(segue.find)));
      if (i >= 0) paras[i].scene = segue.scene;
    });
    SIGHTINGS.filter((s) => s.chapter === n && s.phrase).forEach((s) => {
      const i = lower.findIndex((text) => text.includes(plain(s.phrase)));
      if (i >= 0) paras[i].sighting = s;
    });
    // The wonders this chapter keeps: its own first, then its echoes; ones not yet in the almanac before ones that are.
    let known = {};
    try { known = JSON.parse(window.localStorage.getItem('lore.almanac.v1') || '{}') || {}; } catch { known = {}; }
    const wonders = (almanac?.wonders || [])
      .filter((w) => w.home === n || (w.echoes || []).includes(n))
      .map((w) => ({ w, rank: (w.home === n ? 0 : 2) + (known[w.id] ? 1 : 0) }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6)
      .map(({ w }) => w)
      // Each comes up the lanes when the words beside the carry first name it.
      .map((w) => ({ w, said: lower.findIndex((text) => (w.terms || [w.name]).some((term) => text.includes(plain(term)))) }))
      .sort((a, b) => (a.said < 0 ? 1e9 : a.said) - (b.said < 0 ? 1e9 : b.said));
    return {
      n,
      title: chapter?.title || chapterWords(n),
      paras,
      length: clamp(Math.round(chars / 22), 200, 480),
      wonders: wonders.map(({ w, said }, i) => ({
        id: w.id,
        name: w.name,
        kind: w.kind,
        terms: w.terms || [w.name],
        known: Boolean(known[w.id]),
        said,
        at: said >= 0 ? Math.max(0.03, (said + 0.25) / Math.max(1, paras.length)) : 0.08 + ((i + 0.5) / wonders.length) * 0.84
      }))
    };
  }
  const prepareLeg = (n) => {
    if (!legs.has(n)) legs.set(n, loadLeg(n));
    return legs.get(n);
  };
  const nextChapter = (n) => (n >= TOTAL_CHAPTERS ? 1 : n + 1);

  /* Where in the story the carry is: the paragraph passing now. */
  const passing = () => {
    const leg = run?.leg;
    if (!leg?.paras.length) return null;
    const i = clamp(Math.floor(progress() * leg.paras.length), 0, leg.paras.length - 1);
    return { leg, i, para: leg.paras[i] };
  };
  const passageHref = (at) => `/book/chapter/${pad2(at.leg.n)}/#:~:text=${encodeURIComponent(at.para.text.split(/\s+/).slice(0, 6).join(' ').replace(/[“”"]/g, ''))}`;

  /* The section the reader left, if they came from this chapter: the carry picks up there. */
  const fromPlace = (() => {
    const m = /^\/book\/chapter\/(\d{2})\/#(.+)$/.exec(from || '');
    if (!m) return null;
    const hash = m[2];
    const text = hash.startsWith(':~:text=') ? decodeURIComponent(hash.slice(8)).split(',')[0] : null;
    return { chapter: Number(m[1]), id: text ? null : hash, text };
  })();
  const placeIndex = (leg, place) => {
    const plain = (t) => String(t || '').replace(/[’']/g, "'").toLowerCase();
    return place.id ? leg.paras.findIndex((para) => para.id === place.id) : leg.paras.findIndex((para) => plain(para.text).includes(plain(place.text)));
  };

  /* A chapter finished (or mostly carried when it spilled) is kept on that chapter, and said. */
  const closeLeg = () => {
    if (!run?.leg || !run.tally) return '';
    const n = run.chapter;
    const t = run.tally;
    const outcome = keepCarry(n, { ...t, why: leanWhyText().replace(/^Why: /, '').replace(/\.$/, '') });
    const lean = describeLean({ boon: 1 + t.boon, bane: 1 + t.bane, bone: 1 + t.bone });
    run.outcomes.push({ n, outcome, lean });
    if (outcome === 'won') return `Mimes Against WAP take ${chapterWords(n)}: it will be harder to wonder about pie there until you win it back.`;
    if (outcome === 'back') return `${chapterWords(n)} won back from the mimes: its pie words come back.`;
    if (outcome === 'held') return `The mimes keep ${chapterWords(n)}.`;
    return `${chapterWords(n)} carried: its reading ${lean}.`;
  };

  const enterChapter = (wanted, { back = false, first = false, note = '' } = {}) => {
    let n = wanted;
    let lapped = false;
    if (n > TOTAL_CHAPTERS) {
      // Round again: a lap is the whole book, so a carry begun mid-book first goes back to its beginning.
      n = 1;
      if (run.startChapter === 1 || run.wrapped) run.lap += 1;
      run.wrapped = true;
      lapped = true;
    }
    n = Math.max(1, n);
    setSoundPlace({ chapter: n, held: mimesHold(n) });
    run.prevScene = run.sceneId;
    run.sceneT = first ? 1 : 0;
    run.chapter = n;
    run.tally = newTally(n);
    run.lastSection = undefined;
    run.mawWas = mawAhead();
    if (run.sceneId !== (CHAPTER_SCENE[n] || 'lanes')) sceneTexture(CHAPTER_SCENE[n] || 'lanes');
    run.sceneId = CHAPTER_SCENE[n] || 'lanes';
    run.legStart = cobbles();
    run.leg = null;
    run.wonderQueue = [];
    run.eggAt = Math.random() < (EGG_ODDS[n] ?? 0.2) ? rand(0.3, 0.8) : Infinity;
    if (!first) run.rowIn = Math.max(run.rowIn, 1.2);
    const ticket = run;
    prepareLeg(n).then((leg) => {
      if (run !== ticket || run.chapter !== n) return;
      run.leg = leg;
      run.legLength = leg.length;
      run.paraAt = -1;
      run.wonderQueue = back ? [] : leg.wonders.slice();
      const resume = first && fromPlace?.chapter === n ? placeIndex(leg, fromPlace) : -1;
      if (resume > 0) {
        run.legStart = cobbles() - Math.round((resume / leg.paras.length) * leg.length);
        run.wonderQueue = run.wonderQueue.filter((w) => w.at >= progress());
        showToast(`${chapterWords(n)}, where you left it`, 'The carry picks up at the passage you were reading.', 3000);
      }
      paintFlows(leg);
    });
    prepareLeg(nextChapter(n));
    if (n > record.reached) {
      record.reached = n;
      writeRecord(record);
    }
    const place = `${chapterWords(n)} · ${scene().card.replace(/\.$/, '')}`;
    if (back) {
      showToast(`Pushed back: ${place}`, 'The flour got everywhere. You will have to come through here again.', 3000, 'flour');
      say(`Pushed back in the story, to ${chapterWords(n)}.`);
      return;
    }
    if (!first && run.charm?.bracket === '<>') {
      // A kept <passage> combine from the almanac bench steadies the plate and feeds the aura at each new chapter.
      run.wobble = Math.max(0, run.wobble - 0.18);
      run.aura = Math.min(1, run.aura + 0.08);
      run.filling = Math.min(1, run.filling + 0.08);
      run.tags.push({ x: run.x, y: run.y - 98, t: 0, text: 'PASSAGE CHARM · STEADIED' });
    }
    let moved = '';
    if (!first && Math.random() < 0.5) {
      // The title floats, like the hat: at a new chapter it may settle on someone else.
      run.prevCarrier = run.carrier;
      run.swapT = 0;
      run.carrier = drawCarrierLot(run.carrier.id);
      moved = `The hat moved on. Under it now: ${run.carrier.name}.`;
      turnCard(`carrier-${run.carrier.id}`);
    }
    const who = first ? `Under the hat: ${run.carrier.name}.${run.carrier.says ? ` ${run.carrier.says}` : ''}` : '';
    const held = run.tally.held ? 'The mimes hold this chapter: out-do them before it ends to win it back.' : '';
    const line = [note, lapped ? (run.lap ? 'The book again, and faster.' : 'Back to the beginning of the book.') : '', who, moved, held].filter(Boolean).join(' ');
    showToast(place, line, note || held ? 4400 : 3200, run.tally.held ? 'bane' : '');
    say(`${place}. ${line}`);
  };

  const start = () => {
    colors = palette();
    if (record.sound) primeAudio();
    run = fresh();
    run.intro = introMode;
    hideCard();
    state = 'running';
    enterChapter(run.chapter, { first: true });
    turnCard(`carrier-${run.carrier.id}`);
    last = performance.now();
    loop();
  };

  const spill = (rawCause) => {
    hideToast();
    const selfWap = rawCause === 'wobble' && run.carrier.id === 'clown';
    const cause = selfWap ? 'wobble-clown' : rawCause;
    state = 'spilling';
    root.dataset.cabinetMood = '';
    run.spill = { cause, t: 0, dir: run.dir || pick([-1, 1]), x: run.x, y: run.y - 18, selfWap };
    if (selfWap) {
      run.bursts.push({ x: run.x, y: run.y - 60, t: 0, size: 1.2 });
      if (record.sound) wapSound();
    } else {
      sfx('spill');
    }
    impact('spill', run.x, run.y - 70, { hurt: true });
    const distance = cobbles() + Math.floor(run.aheadCobbles || 0);
    record.runs += 1;
    record.causes[cause] = (record.causes[cause] || 0) + 1;
    record.carriers[run.carrier.id] = (record.carriers[run.carrier.id] || 0) + 1;
    record.waps += run.waps;
    record.bestWaps = Math.max(record.bestWaps, run.waps);
    record.perfects += run.perfects;
    record.satisfied = (record.satisfied || 0) + run.satisfied;
    record.wasted = (record.wasted || 0) + run.wasted;
    record.foils += run.foils;
    record.kept = (record.kept || 0) + run.kept;
    record.shared = (record.shared || 0) + run.shared;
    record.sweetened = (record.sweetened || 0) + run.sweetened;
    // The carry, written back as Spw: how this pie came to be where it spilled (pie-powers.mjs).
    keepProvenance(carryProvenance({
      date: new Date().toISOString().slice(0, 10),
      chapter: run.chapter,
      carrier: run.carrier.id,
      mode: run.intro ? 'introductions' : 'carry',
      cobbles: distance,
      waps: run.waps,
      perfects: run.perfects,
      satisfied: run.satisfied,
      tilt: Math.round(clamp(run.wobble, 0, 1) * 100) / 100,
      crust: Math.round(run.aura * 100) / 100,
      filling: Math.round(run.filling * 100) / 100,
      kept: run.keptIds || [],
      foretold: run.foretold,
      berries: { boon: run.berriesEaten.boon, squashed: run.squashed || 0, bone: run.berriesEaten.bone },
      powers: Object.entries(run.powersUsed).map(([id, whose]) => ({ id, whose })),
      cause,
      spells: play.replaced.length || Object.keys(visitRead?.tune || {}).length || Object.keys(visitRead?.knocks || {}).length ? visitSpells() : '',
      reader: bookRules?.reader || 'built-in',
      parseMs: bookRules?.stats?.ms ?? null,
      tune: visitRead?.tune || null
    }));
    record.reached = Math.max(record.reached, run.chapter);
    // Most of a chapter carried counts for it, spilled or not.
    if (run.leg && progress() >= 0.5) closeLeg();
    const at = passing();
    lastCarry = { scene: run.sceneId, chapter: run.chapter, href: at ? passageHref(at) : `/book/chapter/${pad2(run.chapter)}/`, cobbles: distance, waps: run.waps, carrier: run.carrier.name };
    const best = distance > record.best;
    if (best) record.best = distance;
    writeRecord(record);
    paintBest();
    const served = run.waps
      ? ` Clowns given WAP on the way: ${run.waps}${run.perfects ? ` (${run.perfects} perfectly timed)` : ''}${run.bestCombo >= 2 ? `, ${run.bestCombo} in a row at best` : ''}; clowns satisfied: ${run.satisfied}. The pie was never smaller.`
      : '';
    const foiled = (run.foils ? ` Mr. BaneWAP foiled ${run.foils === 1 ? 'once' : `${run.foils} times`}.` : '')
      + (run.kept ? ` Wonders kept: ${run.kept}.` : '')
      + (run.shared ? ` Slices shared: ${run.shared}.` : '')
      + (run.sweetened ? ` Baneberries sweetened: ${run.sweetened}.` : '')
      + (run.cleared ? ` Hopped clear: ${run.cleared}.` : '')
      + (run.squashed ? ` Baneberries kept from him: ${run.squashed}.` : '')
      + (run.wasted ? ` Slices wasted: ${run.wasted}.` : '');
    const newLore = run.newLore || 0;
    setTimeout(() => {
      state = 'over';
      // What this carry did to the book, and what was met for the first time.
      const marks = run.outcomes.map((o) => (o.outcome === 'won' ? `The mimes took ${chapterWords(o.n)}.` : o.outcome === 'back' ? `${chapterWords(o.n)} won back from the mimes.` : o.outcome === 'held' ? `The mimes kept ${chapterWords(o.n)}.` : '')).filter(Boolean).join(' ');
      const carried = run.outcomes.length ? ` Chapters carried through: ${run.outcomes.length}.${marks ? ` ${marks}` : ''}` : '';
      const firsts = run.met.length ? ` Met for the first time: ${run.met.join(', ')}.` : '';
      showCard('Exactly one.', `${CAUSES[cause]} Under the hat this time: ${run.carrier.name}, ${distance} cobbles${best ? ', further than ever' : ''}, as far as ${chapterWords(run.chapter)}${run.lap ? ` (the book ${run.lap + 1} times over)` : ''}.${served}${foiled}${carried}${firsts} The hat did not fall.`, chosenStartChapter > 1 ? `Carry another pie from ${chapterWords(chosenStartChapter)}` : 'Carry another pie');
      paintCarries();
      paintCardChapters(run.chapter);
      paintCardModes();
      // The way out: into the chapter where this place happens, or home to where the game was found.
      const links = [];
      if (lastCarry.href !== from) {
        // Out of the carry and into the page: the passage that was going by when it spilled.
        const read = document.createElement('a');
        read.href = lastCarry.href;
        read.className = 'pie-card-link';
        read.textContent = `Read where it spilled, in ${chapterWords(lastCarry.chapter)} →`;
        read.addEventListener('click', () => leaveBackNote({ path: lastCarry.href, place: chapterWords(lastCarry.chapter), cobbles: distance, waps: run.waps, carrier: run.carrier.name }));
        links.push(read);
      }
      if (run.outcomes.length) {
        const marked = document.createElement('a');
        marked.href = '#pie-carries';
        marked.className = 'pie-card-link';
        marked.textContent = 'See what your carries have done to the book →';
        links.push(marked);
      }
      if (newLore) {
        const slip = document.createElement('a');
        slip.href = '#pie-lore';
        slip.className = 'pie-card-link';
        slip.textContent = `✦ The pies let slip ${newLore} new line${newLore === 1 ? '' : 's'} of lore →`;
        links.unshift(slip);
      }
      const home = returnAnchor();
      if (home) links.push(home);
      cardLinks?.replaceChildren(...links);
      say(`Spilled. ${CAUSES[cause]} ${run.carrier.name}, ${distance} cobbles.${served}`);
      cardAction.focus({ preventScroll: true });
    }, reduced?.matches ? 300 : 1100);
  };

  /* ─── The world moving ─── */
  const progress = () => clamp((cobbles() - run.legStart) / run.legLength, 0, 1);

  /* A knock: the pie tilts by what hit it (the level shows how much), and some things take more.
   * A breath of grace after, so one bad row is one knock. Tilted to the top, it spills. */
  const TEACH = {
    knock: 'A knock tilts the pie: watch the red ring by the pie, and the level under the screen. Tilt it all the way and it spills.',
    take: 'Some knocks take an ingredient too: the aura levels show what is left.',
    catch: 'When the pie leans left or right, step once in the direction of the lean to catch the plate and steady it.'
  };
  const teach = (key, title = 'A knock') => {
    if (record.runs > 2 || run.taught?.[key]) return;
    run.taught = { ...(run.taught || {}), [key]: true };
    showToast(title, TEACH[key], 3600, 'flour');
  };
  function knock(thing) {
    thing.knocked = true;
    if (run.hurtT > 0) return false;   // still steadying from the last one
    const cost = { ...(KNOCKS[thing.kind] || { tilt: 0.45 }), ...(knockRules[thing.kind] || {}) };
    // How a carrier takes a knock: the porter barely, the clerk and the clown badly.
    let tilt = cost.tilt * clamp(run.carrier.wobble / 0.18, 0.7, 1.3);
    if (run.frill > 0) {
      // Frill-lichen: more edge than room, and a knock lands on the edge.
      tilt *= 0.5;
      run.frill -= 1;
    }
    run.wobble = Math.min(1.2, run.wobble + tilt);
    run.stillT = 0;
    run.tiltDir = clamp(run.tiltDir + (thing.x < run.x ? 0.65 : -0.65), -1, 1);
    // A knock turns the carrier, and the needle turns with them, away from what hit.
    run.aim.a = clamp(run.aim.a + (thing.x < run.x ? TUNE.knock_swing : -TUNE.knock_swing), -AIM_MAX, AIM_MAX);
    run.hurtT = 0.9;
    run.rattled = 0.6;
    run.shake = 0.28;
    run.knockT = 1.6;
    run.lastKnock = thing.kind;
    lean('knocked');
    if (thing.kind === 'mime' || thing.kind === 'mimewall' || thing.kind === 'march') tally('maw');
    sfx('knock');
    impact(thing.kind, thing.x, thing.y - 26, { hurt: true });
    const lines = [`${cost.label || 'KNOCK'} · TILT +${Math.round(tilt * 100)}%`];
    if (cost.crust) { run.aura = Math.max(0, run.aura - cost.crust); lines.push('− CRUST'); }
    if (cost.filling) { run.filling = Math.max(0, run.filling - cost.filling); lines.push('− FILLING'); }
    if (cost.tax && run.bane?.id !== 'tax') lines.push('PAPERWORK');
    if (cost.shove) shove(thing.x < run.x ? 1 : -1);
    if (cost.drop && run.row > 0) {
      // In and out again, a step further back down the lanes.
      run.fromY = run.y;
      run.row -= 1;
      run.moveYT = 0;
    }
    lines.forEach((text, i) => run.tags.push({ x: clamp(run.x, 60, W - 60), y: run.y - 92 - i * 14, t: 0, text, hurt: true }));
    teach(cost.crust || cost.filling ? 'take' : 'knock');
    say(`Knocked by ${thing.kind === 'dividers' ? 'the pie-dividers' : `a ${thing.kind}`}. The pie tilts${cost.crust ? ' and loses crust' : ''}${cost.filling ? ' and loses filling' : ''}.`);
    if (run.wobble >= 1) {
      spill(thing.kind);
      return true;
    }
    return false;
  }

  /* Flour: it feeds the crust and pushes the carry back in the story. It never slows the carrier. */
  const flour = (thing) => {
    thing.floured = true;
    sfx('flour');
    run.aura = Math.min(1, run.aura + FLOUR_GIVES);   // flour: the crust
    run.tags.push({ x: run.x, y: run.y - 96, t: 0, text: '+ CRUST' });
    run.floured = 1.6;   // a dusting on the carrier; flour never slows them
    run.setbacks += 1;
    run.tags.push({ x: run.x, y: run.y - 110, t: 0, text: '↶ STORY SET BACK' });
    dust(0.55);
    run.wobble = Math.min(1.2, run.wobble + 0.05);
    for (let i = 0; i < 16; i += 1) run.puffs.push({ x: run.x + rand(-14, 14), y: run.y - 20 + rand(-10, 10), vx: rand(-60, 60), vy: rand(-70, -10), t: 0 });
    const back = 70;
    if (cobbles() - run.legStart >= back || run.chapter === 1) {
      run.legStart = Math.min(cobbles(), run.legStart + back);
      showToast('A bag of flour', 'The crust drinks it in, and the story slips back a little.', 2400, 'flour');
      say('Flour. The crust is fed, and the story slips back a little.');
    } else {
      enterChapter(run.chapter - 1, { back: true });
      run.legStart = cobbles() - Math.round(run.legLength * 0.6);
    }
  };

  /* ─── The land's own: wonders kept on the way, each with a gift ───
   * Every gift is a Spw spell (pie-powers.mjs): the wonder doing in the lanes what it does in
   * the book. A visit may carry other spells (?powers=, or the bench on the page). */
  takePowersFromAddress();
  let play = powersInPlay();
  /* The book's rules, read by the real Spw parser once the page is quiet (pie-spw.mjs), and a
   * visit's own read the same way over them. Until they arrive the built-in spells play. */
  let bookRules = null;
  let visitRead = null;
  const compose = () => {
    const own = bookRules?.powers && Object.keys(bookRules.powers).length ? bookRules.powers : powersInPlay().powers;
    const visitPowers = visitRead?.powers || {};
    play = { powers: { ...own, ...visitPowers }, replaced: Object.keys(visitPowers).filter((id) => id in own), errors: visitRead?.errors || [] };
    Object.assign(TUNE, TUNE_DEFAULTS);
    tuneWith(bookRules?.tune);
    tuneWith(visitRead?.tune);
    knockRules = { ...(bookRules?.knocks || {}), ...(visitRead?.knocks || {}) };
    leanRules = { ...(bookRules?.lean || {}), ...(visitRead?.lean || {}) };
    whimsyRules = {
      sprites: { ...(bookRules?.whimsy || {}), ...(visitRead?.whimsy || {}) },
      scenes: { ...(bookRules?.scenes || {}), ...(visitRead?.scenes || {}) }
    };
  };
  const readVisit = async () => { visitRead = visitSpells() ? await readRules(visitSpells()) : null; compose(); };
  const whenQuiet = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 600));
  whenQuiet(async () => {
    bookRules = await loadRules();
    await readVisit();
    paintBench?.();
    paintStress?.();
    paintDesk?.();
  });
  const powerFor = (id) => play.powers[String(id).replace(/-/g, '_')] || null;

  /** Whether this carry is running on the book's own spell for a power, or a visit's replacement. */
  const whosePower = (id) => (play.replaced.includes(id) ? 'visit' : 'book');

  /* The ecology answers: &with brings kinds up the lanes for a while; &without quiets them ahead. */
  const QUIETED = Object.freeze({ frost: 'MELTED', puddle: 'DRAINED', pane: 'FORGIVEN CLEAR', baneberry: 'GONE QUIET' });
  const quiet = (kind) => {
    run.things.forEach((other) => {
      if (other.kind !== kind || other.wapped || other.y > run.y) return;
      other.wapped = true;
      other.wapT = 0.3;
      other.spin = 0;
      other.fatal = false;
      run.tags.push({ x: other.x, y: other.y - 20, t: 0, text: QUIETED[kind] || 'QUIET' });
    });
  };
  const honkClear = () => {
    run.things.forEach((other) => {
      if (other.wapped || !other.fatal || WIDE.has(other.kind) || other.y > run.y || Math.abs(other.x - run.x) > LANE_W * 1.6) return;
      other.wapped = true;
      other.wapT = 0.2;
      other.spin = Math.sign(other.x - run.x) || pick([-1, 1]);
    });
  };
  /* ─── The three berries, each a kind of foretelling (berries.json) ─── */
  const laneAt = (x) => clamp(Math.floor(x / LANE_W), 0, LANES - 1);
  const BOON_GLIMPSES = Object.freeze([
    'A boonberry, and for a moment you knew which way was clear. Whether the berry told you, or you remembered it, the lane does not say.',
    'It tasted of a lane you had not walked yet. Or you had walked it, and this was the second time.',
    'A little borrowed summer, and with it the way through, a breath before you needed it.',
    'Boof says they remember things kindly, before they happen. Nobody has asked her whether she means the berries or herself.'
  ]);
  let berryCanon = null;
  fetch('/book/content/world/berries.json').then((res) => (res.ok ? res.json() : null)).then((data) => { berryCanon = data?.berries || null; }).catch(() => {});
  const boneFlavour = () => {
    const bone = berryCanon?.bone;
    const region = bone?.chapters?.[String(run.chapter)];
    return bone?.flavours?.[region] || 'roast chestnut and sage';
  };
  /* A baneberry's foretelling: chaotic, and it comes because it was said. Sweetened, it says something kind. */
  const FORETOLD = Object.freeze({
    wasps: 'WASPS, THIS LANE',
    spool: 'A SPOOL WILL TRIP YOU',
    pigeon: 'A PIGEON FOR YOUR CRUST',
    stone: 'A STONE IN THE WAY',
    puddle: 'THE PIE WILL SLIDE',
    flinch: 'YOU WILL FLINCH HERE',
    berry: 'BOONBERRIES, THIS LANE'
  });
  function foretell(lane, { kindly = false } = {}) {
    if (run.prophecies.length >= 3) return;
    let what = 'berry';
    if (!kindly) {
      const knocks = ['wasps', 'spool', 'pigeon', 'stone', 'puddle'].filter(allowed);
      what = Math.random() < TUNE.flinch_chance || !knocks.length ? 'flinch' : pick(knocks);
    }
    run.prophecies.push({ lane, what, kindly, t: TUNE.foretell_after, dur: TUNE.foretell_after });
    if (kindly) run.foretold.kind += 1;
    else run.foretold.said += 1;
    sfx(kindly ? 'sweet' : 'foretell', 0, laneX(lane));
    if (!kindly && run.foretold.said === 1) {
      showToast('A baneberry foretells', 'Let past the pie, it says what will happen in its lane, and saying it is what brings it. Squash the next one and it never says.', 3600, 'flour');
    }
    say(kindly ? 'Sweetened, it foretells something kind: boonberries, in its lane.' : `A baneberry, let past, foretells: ${FORETOLD[what].toLowerCase()}. Said, it is on its way.`);
  }
  function tickForetold(dt) {
    run.prophecies.forEach((p) => { p.t -= dt; });
    run.prophecies.filter((p) => p.t <= 0).forEach((p) => {
      const x = laneX(p.lane);
      if (p.what === 'flinch') {
        // Self-fulfilling: whoever waits for it in that lane flinches, because they were waiting.
        if (laneAt(run.x) === p.lane) {
          run.wobble = Math.min(1.2, run.wobble + TUNE.flinch_tilt);
          run.foretold.came += 1;
          lean('flinched');
          sfx('fulfil', 0, x);
          run.tags.push({ x: run.x, y: run.y - 100, t: 0, text: 'FORETOLD · YOU FLINCHED' });
        } else {
          run.tags.push({ x, y: 70, t: 0, text: 'NOT HERE, THIS TIME' });
        }
        return;
      }
      const thing = makeThing(p.what, p.lane);
      thing.foretold = true;
      run.things.push(thing);
      if (!p.kindly) { run.foretold.came += 1; lean('foretold'); }
      sfx(p.kindly ? 'berry' : 'fulfil', 0, x);
      run.tags.push({ x, y: 60, t: 0, text: p.kindly ? 'AS FORETOLD, KINDLY' : 'AS FORETOLD' });
    });
    run.prophecies = run.prophecies.filter((p) => p.t > 0);
  }
  function tickEcology(dt) {
    run.ecology.forEach((e) => {
      e.t -= dt;
      e.next -= dt;
      if (e.next > 0 || e.t <= 0) return;
      e.next = 1.4;
      const open = [0, 1, 2, 3, 4].filter((lane) => !run.things.some((t) => !t.wapped && laneAt(t.x) === lane && t.y < 40));
      if (!open.length) return;
      const thing = makeThing(e.kind, pick(open));
      thing.ecology = true;
      run.things.push(thing);
    });
    run.ecology = run.ecology.filter((e) => e.t > 0);
  }

  /** A power, applied: what its spell says, held to the ranges pie-powers.mjs allows. */
  function applyPower(power, { boost = 1, charmLit = 0 } = {}) {
    if (!power) return;
    const t = power.timed;
    const n = power.amounts;
    const c = power.charges;
    if (t.lit) run.lit = t.lit * boost + charmLit;
    if (t.lag) run.lag = Math.max(run.lag, t.lag * boost);
    if (t.unkept) run.unkept = Math.max(run.unkept, t.unkept * boost);
    if (t.warm) run.warm = Math.max(run.warm, t.warm);
    if (t.fed) run.fed = Math.max(run.fed, t.fed);
    if (t.glimpse) run.glimpse = Math.max(run.glimpse, t.glimpse);
    if (t.true_aim) run.trueAim = Math.max(run.trueAim, t.true_aim);
    if (n.crust) run.aura = Math.min(1, run.aura + n.crust * boost);
    if (n.filling) run.filling = Math.min(1, run.filling + n.filling * boost);
    if (c.echoes) run.echoes = c.echoes;
    if (c.frill) run.frill = (run.frill || 0) + c.frill;
    if (c.tin) run.tin = (run.tin || 0) + c.tin;
    if (power.acts.includes('level')) { run.wobble = 0; run.tiltDir = 0; run.steadied = 1.2; }
    if (power.acts.includes('ready')) run.sliceReady = 1;
    if (power.acts.includes('forgive')) run.shield = true;
    if (power.acts.includes('honk')) honkClear();
    const lasts = Math.max(4, ...Object.values(t));
    power.with.forEach((kind) => run.ecology.push({ kind, t: lasts, next: 0.5 }));
    power.without.forEach(quiet);
    run.powersUsed[power.id] = whosePower(power.id);
    // References the spell dispatches: its card turns (the first time), wherever it was applied.
    if (power.refs?.card && CARDS[power.refs.card]) turnCard(power.refs.card);
  }
  function keep(thing) {
    const w = thing.wonder;
    thing.wapped = true;
    thing.wapT = 0.5;
    thing.spin = 0;
    thing.kept = true;
    run.kept += 1;
    (run.keptIds ||= []).push(w.id);
    lean('kept');
    sfx(powerFor(w.id)?.refs?.sound || 'wonder', w.kind);
    spawnRing(thing.x, thing.y, 34, colors.gold, 0.55);
    let isNew = false;
    try { isNew = Boolean(collectWonder(w.id, run.chapter)?.isNew); } catch { /* kept in the run, if not the almanac */ }
    // A wonder already in your almanac knows you and gives a little more; a [window] charm extends its light.
    const boost = w.known ? 1.2 : 1;
    const charmLit = run.charm?.bracket === '[]' ? 1.5 : 0;
    const gift = powerFor(w.id) || powerFor(w.kind) || powerFor('creature');
    applyPower(gift, { boost, charmLit });
    run.escort = { id: gift?.id || w.id, t: 3.5 };
    const sigil = KIND_SIGIL[w.kind] || '@';
    run.tags.push({ x: thing.x, y: thing.y - 30, t: 0, text: `${sigil} ${w.name.toUpperCase()}` });
    showToast(`${sigil} ${w.name}${isNew ? ' · new to your almanac' : ' · kept'}`, gift?.says || '', 3200, gift?.refs?.voice || 'wonder');
    say(`${w.name}, kept${isNew ? ', and new to your almanac' : ''}. ${gift.says}`);
    markWonder(w.id, 'kept');
  }
  function meetEgg(thing) {
    thing.met = true;
    run.warm = 9;
    run.shield = true;
    lean('egg');
    sfx('egg');
    spawnRing(thing.x, thing.y, 40, '#f0ad58', 0.65);
    record.eggs = (record.eggs || 0) + 1;
    writeRecord(record);
    run.tags.push({ x: thing.x, y: thing.y - 34, t: 0, text: 'WARM' });
    // It is not explained. It is only passed, close enough to feel.
    showToast('Something warm, egg-shaped', record.eggs === 1 ? 'You did not take it. You are warmer anyway.' : 'It was there again. You did not take it this time either.', 3600, 'egg');
    say('Something warm and egg-shaped, passed close. The pie is held a little more level, and the next knock will be forgiven.');
  }

  /* ─── The flows: the chapter's own words going by on one side, its wonders on the other ─── */
  const flowProse = document.querySelector('[data-pie-flow-list]');
  const flowChapter = document.querySelector('[data-pie-flow-chapter]');
  const flowTitle = document.querySelector('[data-pie-flow-title]');
  const flowWonders = document.querySelector('[data-pie-flow-wonders]');
  const flowKept = document.querySelector('[data-pie-flow-kept]');
  let flowAt = -1;
  let flowShift = null;
  let flowMeasure = [];
  function renderParaContent(para, leg) {
    para.slotNodes = [];
    if (!para.slots || !para.rawText || !/\{\{([a-z0-9-]+)\}\}/i.test(para.rawText)) {
      return marked(para.text, leg.wonders);
    }
    const parts = para.rawText.split(/\{\{([a-z0-9-]+)\}\}/gi);
    return parts.flatMap((part, idx) => {
      if (idx % 2 === 0) return marked(part, leg.wonders);
      const variants = para.slots[part]?.variants || [];
      if (variants.length <= 1) return marked(variants[0] ?? '', leg.wonders);
      const slotNode = document.createElement('span');
      slotNode.className = 'pie-flow-slot';
      slotNode.title = `Another telling (${variants.length} ways) — turns with the carry’s lean, or tap to turn`;
      slotNode.replaceChildren(...marked(variants[0] ?? '', leg.wonders));
      const recordSlot = { node: slotNode, name: part, variants, index: 0 };
      para.slotNodes.push(recordSlot);
      slotNode.addEventListener('click', (event) => {
        event.stopPropagation();
        recordSlot.index = (recordSlot.index + 1) % variants.length;
        slotNode.replaceChildren(...marked(variants[recordSlot.index] ?? '', leg.wonders));
        slotNode.classList.toggle('is-turned', recordSlot.index > 0);
        recordHeardTelling(leg.n, part, recordSlot.index);
      });
      return [slotNode];
    });
  }
  function paintFlows(leg) {
    flowAt = -1;
    flowShift = null;
    if (flowChapter) {
      flowChapter.textContent = chapterWords(leg.n);
      flowChapter.href = `/book/chapter/${pad2(leg.n)}/`;
    }
    if (flowTitle) flowTitle.textContent = leg.title;
    if (flowProse) {
      let voice = null;
      flowProse.classList.toggle('is-mimed', state === 'running' ? mawAhead() : mimesHold(leg.n));
      flowProse.replaceChildren(...leg.paras.map((para) => {
        const li = document.createElement('li');
        li.className = 'pie-flow-para';
        if (para.voice && para.voice !== voice) {
          const who = document.createElement('span');
          who.className = 'pie-flow-voice';
          who.textContent = para.voice;
          li.append(who);
        }
        voice = para.voice;
        li.append(...renderParaContent(para, leg));
        return li;
      }));
      flowMeasure = [...flowProse.children].map((li) => ({ top: li.offsetTop, h: li.offsetHeight }));
      if (state !== 'running' && flowProse.children[0]) {
        flowProse.children[0].classList.add('is-passing');
        flowAt = 0;
        flowProse.style.transform = 'translateY(16px)';
      }
    }
    if (flowWonders) {
      let known = {};
      try { known = JSON.parse(window.localStorage.getItem('lore.almanac.v1') || '{}') || {}; } catch { known = {}; }
      flowWonders.replaceChildren(...leg.wonders.map((w) => {
        const li = document.createElement('li');
        li.className = `pie-flow-wonder ${known[w.id] ? 'is-known' : 'is-ahead'}`;
        li.dataset.wonder = w.id;
        const sigil = document.createElement('span');
        sigil.className = 'pie-flow-sigil';
        sigil.setAttribute('aria-hidden', 'true');
        sigil.textContent = KIND_SIGIL[w.kind] || '@';
        const name = document.createElement('strong');
        name.textContent = w.name;
        const note = document.createElement('span');
        note.className = 'pie-flow-state';
        note.textContent = known[w.id] ? 'in your almanac' : 'ahead';
        const giftText = (powerFor(w.id) || powerFor(w.kind) || powerFor('creature'))?.says || '';
        const giftSpan = document.createElement('span');
        giftSpan.className = 'pie-flow-gift';
        giftSpan.textContent = giftText;
        li.append(sigil, name, note, giftSpan);
        // The gift's spell says where the book has it (a quoted path, dispatched here as a link).
        const where = (powerFor(w.id))?.refs?.path;
        if (where) {
          const link = document.createElement('a');
          link.className = 'pie-flow-where';
          link.href = `/${where.replace(/(chapter\/\d+)(#|$)/, '$1/$2')}`;
          link.textContent = 'where the book has it →';
          li.append(link);
        }
        li.addEventListener('pointerenter', () => {
          flowProse?.querySelectorAll(`[data-term="${w.id}"]`).forEach((m) => m.classList.add('is-peek'));
        });
        li.addEventListener('pointerleave', () => {
          flowProse?.querySelectorAll(`[data-term="${w.id}"]`).forEach((m) => m.classList.remove('is-peek'));
        });
        return li;
      }));
      if (!leg.wonders.length) {
        const li = document.createElement('li');
        li.className = 'pie-flow-wonder is-quiet';
        li.textContent = 'Nothing is waiting in this chapter. Keep going.';
        flowWonders.append(li);
      }
    }
    paintKept();
    paintNow(leg.n);
  }
  /* A wonder's own words in the passage, marked: they light when it is up the lanes, and stay lit once kept. */
  /* Pie words, so that they can go quiet while the mimes lead. */
  const pieParts = (text) => text.split(new RegExp(PIE_WORDS.source, 'gi')).map((part, i) => {
    if (i % 2 === 0) return part;
    const span = document.createElement('span');
    span.className = 'pie-flow-pie';
    span.textContent = part;
    return span;
  });
  function marked(text, wonders) {
    const terms = wonders.flatMap((w) => w.terms.map((term) => ({ term, id: w.id }))).sort((a, b) => b.term.length - a.term.length);
    if (!terms.length) return pieParts(text);
    const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(${terms.map((t) => escape(t.term)).join('|')})`, 'gi');
    return text.split(pattern).flatMap((part, i) => {
      if (i % 2 === 0) return pieParts(part);
      const hit = terms.find((t) => t.term.toLowerCase() === part.toLowerCase());
      const mark = document.createElement('mark');
      mark.className = 'pie-flow-term';
      mark.dataset.term = hit?.id || '';
      mark.textContent = part;
      return mark;
    });
  }
  function paintKept() {
    if (flowKept) flowKept.textContent = run?.kept ? `Kept on this carry: ${run.kept}` : 'Steer into a wonder, up the lanes, to keep it.';
  }
  function markWonder(id, how) {
    const li = flowWonders?.querySelector(`[data-wonder="${id}"]`);
    if (!li) return;
    if (how === 'missed' && li.classList.contains('is-kept')) return;
    li.classList.remove('is-ahead', 'is-here', 'is-missed', 'is-known');
    li.classList.add(`is-${how}`);
    const note = li.querySelector('.pie-flow-state');
    if (note) note.textContent = { here: 'here, up the lanes', kept: 'kept', missed: 'went about its business' }[how] || '';
    flowProse?.querySelectorAll(`[data-term="${id}"]`).forEach((mark) => {
      mark.classList.toggle('is-lit', how === 'here');
      mark.classList.toggle('is-kept', how === 'kept');
    });
    if (how === 'kept') paintKept();
  }
  /* The words go by as the carry goes on: the passage now passing sits level with the carrier. */
  /* This chapter, so far: how it will be kept, and how the contest with the mimes stands. */
  const flowNow = document.querySelector('[data-pie-flow-now]');
  let nowKey = '';
  const span = (className, text) => { const node = document.createElement('span'); node.className = className; if (text != null) node.textContent = text; return node; };
  const makeLeanBar = (lean) => {
    const total = (lean.boon || 0) + (lean.bane || 0) + (lean.bone || 0) || 1;
    const bar = span('pie-flow-now-lean');
    bar.setAttribute('aria-hidden', 'true');
    ['boon', 'bane', 'bone'].forEach((id) => {
      const seg = document.createElement('i');
      seg.className = `is-${id}`;
      seg.style.flexGrow = String(Math.round(((lean[id] || 0) / total) * 100));
      bar.append(seg);
    });
    return bar;
  };
  /** Why this chapter leans as it does: the two strongest reasons in each way it has moved. */
  function leanWhyText() {
    const why = run?.leanWhy || {};
    const parts = ['boon', 'bane', 'bone'].map((cat) => {
      const reasons = Object.entries(why)
        .filter(([event]) => ((leanRules[event] || LEAN_DEFAULTS[event]) || [])[0] === cat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([event, n]) => `${Math.round(n)} ${LEAN_WORDS[event] || event.replace(/_/g, ' ')}`);
      return reasons.length ? `${LEAN_NAMES[cat]}: ${reasons.join(', ')}` : null;
    }).filter(Boolean);
    return parts.length ? `Why: ${parts.join(' · ')}.` : 'Nothing has leaned it yet.';
  }
  function paintNow(idleChap = chosenStartChapter) {
    if (!flowNow) return;
    if (state !== 'running' || !run?.tally) {
      const chap = idleChap || chosenStartChapter || 1;
      const saved = carryFor(chap);
      const ties = readLoreTies();
      const key = ['idle', chap, saved?.carried || 0, saved?.maw || '', ties.wonders, ties.sightings, ties.tellings, ties.combine?.expr || ''].join('|');
      if (key === nowKey) return;
      nowKey = key;
      const rows = [span('pie-flow-now-head', `${chapterWords(chap)} · kept in this browser`)];
      if (saved) {
        rows.push(
          span('pie-flow-now-line', `Carried ${saved.carried === 1 ? 'once' : `${saved.carried} times`}: its reading ${describeLean(saved.lean)}.${saved.maw === 'won' ? ' Held by Mimes Against WAP.' : saved.maw === 'back' ? ' Won back from the mimes.' : ''}`),
          makeLeanBar(saved.lean)
        );
      } else {
        rows.push(span('pie-flow-now-line', 'Not carried through yet. Finish this chapter in the lanes and how you carried it will gently lean its reading on the chapter page.'));
      }
      const tieParts = [
        `${ties.wonders} almanac wonder${ties.wonders === 1 ? '' : 's'}`,
        `${ties.sightings}/9 figure strokes`,
        ties.combine ? `charm ${ties.combine.expr} (${ties.combine.note})` : null,
        ties.tellings ? `${ties.tellings} telling${ties.tellings === 1 ? '' : 's'} heard` : null
      ].filter(Boolean);
      rows.push(span('pie-flow-now-ties', `In play from your shelves: ${tieParts.join(' · ')}.`));
      flowNow.replaceChildren(...rows);
      return;
    }
    const t = run.tally;
    const ahead = mawAhead();
    const key = ['live', t.boon, t.bane, t.bone, t.wap, t.maw, t.mawSeen, ahead, run.chapter, run.carrier.id, run.strokes].map((v) => (typeof v === 'number' ? Math.round(v * 2) : v)).join('|');
    if (key === nowKey) return;
    nowKey = key;
    const lean = { boon: 1 + t.boon, bane: 1 + t.bane, bone: 1 + t.bone };
    const bar = makeLeanBar(lean);
    const whoParts = [
      `Under the hat: ${run.carrier.name}${run.carrier.id === 'figure' && run.strokes ? ` (${run.strokes}/9 strokes steadying)` : ''}`,
      run.charm ? `charm ${run.charm.expr}` : null
    ].filter(Boolean);
    const rows = [
      span('pie-flow-now-head', `${chapterWords(run.chapter)}, so far`),
      span('pie-flow-now-ties', whoParts.join(' · ')),
      span('pie-flow-now-line', `Its reading ${describeLean(lean)}. (${LEAN_NAMES.boon}: ${Math.round(t.boon)} · ${LEAN_NAMES.bane}: ${Math.round(t.bane)} · ${LEAN_NAMES.bone}: ${Math.round(t.bone)})`),
      bar,
      span('pie-flow-now-why', leanWhyText())
    ];
    if (t.mawSeen) {
      rows.push(span(`pie-flow-now-contest${ahead ? ' is-mimes' : ''}`, `Pie ${Math.round(t.wap)} · Mimes ${Math.round(t.maw)} — ${t.held
        ? (ahead ? 'the mimes hold this chapter; out-do them before it ends to win it back.' : 'ahead of the mimes: finish the chapter like this to win it back.')
        : (ahead ? 'the mimes are ahead: finish like this and they hold the chapter.' : 'the pie is ahead.')}`));
    }
    flowNow.replaceChildren(...rows);
  }
  function tickFlows() {
    if (!flowProse || !run?.leg || !flowMeasure.length) return;
    flowProse.classList.toggle('is-mimed', mawAhead());
    if (run.t - run.nowAt > 0.4) {
      run.nowAt = run.t;
      paintNow();
    }
    const n = flowMeasure.length;
    const f = clamp(progress() * n, 0, n - 0.001);
    const i = Math.floor(f);
    if (i !== flowAt) {
      flowProse.children[flowAt]?.classList.remove('is-passing');
      flowProse.children[i]?.classList.add('is-passing');
      flowAt = i;
    }
    const { top, h } = flowMeasure[i];
    const focus = flowProse.parentElement.clientHeight * 0.62;
    const shift = Math.round(focus - (top + h - (f - i) * h));
    if (shift !== flowShift) {
      flowShift = shift;
      flowProse.style.transform = `translateY(${shift}px)`;
    }
  }

  /* What a pie says now: a line not yet said, if one is unlocked; else one already known. */
  const speak = (speaker) => {
    if (!lore) return null;
    const found = discoveries(record);
    const mine = lore.lines.filter((line) => line.speaker === speaker && isUnlocked(line, found));
    if (!mine.length) return null;
    const unsaid = mine.find((line) => !record.lore.includes(line.id));
    const line = unsaid || pick(mine);
    if (unsaid) {
      record.lore.push(unsaid.id);
      run.newLore = (run.newLore || 0) + 1;
      writeRecord(record);
      paintLore();
      run.tags.push({ x: W / 2, y: PRESENCE_Y - 44, t: 0, text: '✦ NEW LORE' });
    }
    return { text: line.line, isNew: Boolean(unsaid) };
  };

  /* The words going by cue the lanes, and the carry cues the words going by. */
  function onPassage(para) {
    if (para.scene && para.scene !== run.sceneId) {
      // A door's place begins where its section does: the colours cross over, play goes on.
      run.prevScene = run.sceneId;
      run.sceneId = para.scene;
      run.sceneT = 0;
      showToast(`${chapterWords(run.chapter)} · ${scene().card.replace(/\.$/, '')}`, 'Where the words beside you say so.', 2800);
    }
    // A prose sighting passed in the carry notices a stroke for the figure under the hat.
    if (para.sighting) {
      const res = recordSighting(para.sighting.id);
      if (res) {
        run.strokes = res.count;
        if (res.isNew) {
          run.wobble = Math.max(0, run.wobble - 0.18);
          lean('sighting');
          run.tags.push({ x: run.x, y: run.y - 98, t: 0, text: '✦ STROKE NOTICED' });
          showToast(
            res.count === res.total ? 'The drawing is whole · 9 of 9' : `A sighting in the passage · ${res.count} of ${res.total}`,
            `${res.entry.title} — a stroke for the figure under the hat.`,
            3600,
            'wonder'
          );
        }
      }
    }
    // Living slots in the passage turn toward the carry's lean, and are kept in lore.tellings.v1.
    if (para.slotNodes?.length && run.tally && run.leg) {
      const leanId = leanOf({ boon: 1 + run.tally.boon, bane: 1 + run.tally.bane, bone: 1 + run.tally.bone });
      const offset = { boon: 1, bane: 2, bone: 3 }[leanId] || 0;
      para.slotNodes.forEach((slot) => {
        const idx = offset ? (offset % slot.variants.length || 1) : 0;
        if (idx !== slot.index && slot.variants[idx]) {
          slot.index = idx;
          slot.node.replaceChildren(...marked(slot.variants[idx], run.leg.wonders));
          slot.node.classList.toggle('is-turned', idx > 0);
        }
        recordHeardTelling(run.chapter, slot.name, slot.index);
      });
    }
    // A new section is a breath: a row or two with nothing to knock, and a rule across the lanes.
    if (run.lastSection !== undefined && para.sec !== run.lastSection) {
      run.breath = 1.5;
      run.rules.push({ y: -16 });
    }
    run.lastSection = para.sec;
    const quiet = run.t - (run.presenceEnded ?? -99) > 3;
    if (para.cue && !run.boon && !run.bane && quiet && allowed(para.cue)) {
      if (para.cue === 'boon') holdCourt();
      else scheme();
      run.cued = true;
    }
    if (para.voice === 'Boof' && run.lastVoice !== 'Boof' && !run.boof) run.boofIn = Math.min(run.boofIn, 0.8);
    run.lastVoice = para.voice;
  }

  /* Two of the quinary five, one at a time. */
  const holdCourt = () => {
    run.boon = { t: 0, dur: 8.5, lobIn: 0.9 };
    turnCard('boon');
    run.wobble = Math.max(0, run.wobble - 0.25);   // a steadying word, first
    run.lastPresence = 'boon';
    lean('boonwap');
    if (!met('boon')) { record.met.push('boon'); writeRecord(record); }
    if (mawAhead()) {
      // The mimes have the floor: harder to wonder about pie. He mimes his one true thing instead.
      showToast('Mr. BoonWAP holds court, in mime', 'The mimes are ahead in this chapter: he mimes his one true thing, and nobody can make it out. Out-do them and he will say it.', 5000, 'bone');
      say('Mr. BoonWAP holds court, but the mimes are ahead here: he mimes his one true thing, and nobody can make it out.');
      return;
    }
    const said = speak('boon');
    const words = said ? `“${said.text}”` : 'A sentient pie of the quinary five. Clowns flock to him, and every pie finds an eye.';
    showToast(`Mr. BoonWAP holds court${said?.isNew ? ' · ✦ new' : ''}`, words, 6000, 'boon');
    say(`Mr. BoonWAP holds court; clowns flock to him. ${said ? said.text : ''}`);
  };
  const scheme = () => {
    const id = pick(Object.keys(SCHEMES).filter((key) => key !== 'march' || allowed('march')));
    if (!met('bane')) { record.met.push('bane'); writeRecord(record); }
    const fed = Math.min(5, run.baneStore || 0);
    run.baneStore = 0;
    turnCard('bane');
    run.bane = { id, t: 0, dur: 9 + fed * 1.2, fed, beat: id === 'relet' ? 2.4 : id === 'march' ? 3.2 : 1.8, nextBeat: 1.6, dir: pick([-1, 1]) };
    run.pendingSwitch = true;
    run.lastPresence = 'bane';
    showToast('Mr. BaneWAP has a scheme.', `${SCHEMES[id].says} Somewhere ahead: an off switch.`, 3400, 'bane');
    say(`Mr. BaneWAP has a scheme. ${SCHEMES[id].says} Find the off switch.`);
  };

  const update = (rawDt) => {
    // Hit-stop: the world holds its breath a moment at a great impact (the pops and bits still move).
    let dt = rawDt;
    if (run?.hitStop > 0) { run.hitStop = Math.max(0, run.hitStop - rawDt); dt = rawDt * 0.12; }
    if (run) {
      run.punch = Math.max(0, (run.punch || 0) - rawDt * 4);
      run.pops = run.pops.filter((p) => (p.t += rawDt) < 1.1);
      run.bits = run.bits.filter((b) => {
        b.t += rawDt;
        b.vy += 420 * rawDt;
        b.x += b.vx * rawDt;
        b.y += b.vy * rawDt;
        b.rot += b.vr * rawDt;
        return b.t < 1.1 && b.y < H + 20;
      });
    }
    if (state === 'running' && run.revealQueue.length) {
      openReveal(run.revealQueue.shift());
      return;
    }
    run.t += dt;
    if (state === 'running') {
      // The pace: gentle at first, building by the chapter and the minute. (A lag-stag lags the city, not the carrier.)
      const pace = Math.min(350, 150 + run.t * 2.2 + (run.chapter - 1) * 5 + run.lap * 40);
      run.speed = pace * (run.lag > 0 ? TUNE.slow_land : 1);
      run.scroll += run.speed * dt;
      // Further up the lanes there is less warning, and more reward: the story moves on sooner,
      // the carry counts for more, and daring leans the chapter toward low magic (=ahead_bonus).
      if (run.row > 0 && TUNE.ahead_bonus > 0) {
        const gain = (run.speed * dt * run.row * TUNE.ahead_bonus) / COBBLE;
        run.legStart -= gain;
        run.aheadCobbles = (run.aheadCobbles || 0) + gain;
        run.aheadT = (run.aheadT || 0) + dt * run.row;
        if (run.aheadT >= 4) { run.aheadT -= 4; lean('ahead'); }
      }
      if (progress() >= 1 && run.leg) {
        const note = closeLeg();
        enterChapter(run.chapter + 1, { note });
        return;
      }
      const at = passing();
      if (at && at.i !== run.paraAt) {
        run.paraAt = at.i;
        onPassage(at.para);
      }
      run.rowIn -= dt;
      if (run.rowIn <= 0) {
        spawnRow();
        // Rows a set distance apart, so the time to react holds as the pace builds.
        const gap = clamp(270 - difficulty() * 120, 150, 270);
        run.rowIn = gap / Math.max(run.speed, 90);
      }
      run.boofIn -= dt;
      if (run.boofIn <= 0 && !run.boof) {
        const side = pick([-1, 1]);
        run.boof = { x: side < 0 ? -40 : W + 40, y: rand(80, 200), vx: -side * rand(60, 80), touched: false };
        turnCard('boof');
        run.boofIn = rand(12, 18);
      }
      // Presences: Mr. BoonWAP and Mr. BaneWAP never share the stage.
      if (!run.boon && !run.bane) {
        run.nextPresence -= dt * (1 + run.dust * 2);   // flour in the air draws them sooner
        if (run.nextPresence <= 0) {
          const lean = scene().presence;
          // Flour the mimes put in the air is meant for Mr. BaneWAP, and usually brings him.
          const forBane = run.t - (run.mimeFlourAt ?? -99) < 4;
          let boon = forBane ? Math.random() < 0.2 : lean === 'boon' ? Math.random() < 0.75 : lean === 'bane' ? Math.random() < 0.2 : run.lastPresence !== 'boon';
          // The cast arrives as the book does: Mr. BaneWAP from Chapter Four, Mr. BoonWAP from Six.
          const canBoon = allowed('boon');
          const canBane = allowed('bane');
          if (!canBoon) boon = false;
          if (!canBane) boon = true;
          if (!canBoon && !canBane) run.nextPresence = rand(10, 15);
          else if (boon) holdCourt(); else scheme();
        }
      }
      if (run.boon) {
        const b = run.boon;
        b.t += dt;
        // Benevolence: he pours filling (and a little crust) into the aura while he holds court.
        // Fed on flour in the air, he pours more crust, throws faster, and lingers.
        run.filling = Math.min(1, run.filling + dt * 0.14);
        run.aura = Math.min(1, run.aura + dt * (0.05 + run.dust * 0.12));
        b.dur = Math.min(13, b.dur + dt * run.dust * 0.6);
        b.lobIn -= dt * (1 + run.dust * 1.4);
        if (b.lobIn <= 0) {
          const target = run.things
            .filter((thing) => thing.kind === 'clown' && !thing.wapped && !thing.targeted && thing.y > 40 && thing.y < run.y - 50)
            .sort((a, c) => Math.abs(a.x - W / 2) - Math.abs(c.x - W / 2))[0];
          if (target) {
            target.targeted = true;
            run.slices.push({ x0: W / 2, y0: PRESENCE_Y + 14, target, t: 0 });
          }
          b.lobIn = 1.05;
        }
        if (b.t >= b.dur) {
          run.boon = null;
          run.presenceEnded = run.t;
          run.nextPresence = scene().presence === 'boon' ? rand(9, 13) : rand(15, 22);
          showToast('Mr. BoonWAP keeps talking.', 'The room has moved on. He has not noticed.', 2200, 'boon');
        }
      }
      if (run.bane) {
        const b = run.bane;
        b.t += dt;
        if (b.id !== 'tax') {
          b.nextBeat -= dt * (1 + run.dust * 1.2);   // fed on flour in the air, his scheme quickens
          if (b.nextBeat <= 0) {
            if (b.id === 'wind') shove(b.dir);
            if (b.id === 'march') run.pendingMarch = true;
            if (b.id === 'relet') {
              // Re-let: the lanes ahead shift over; the way through goes with them.
              run.things.forEach((thing) => {
                if (thing.wapped || WIDE.has(thing.kind) || thing.y > run.y - 120 || thing.kind === 'switch' || thing.kind === 'wonder' || thing.kind === 'egg' || thing.lanes) return;
                const lane = thing.lane + b.dir;
                if (lane < 0 || lane >= LANES) return;
                thing.lane = lane;
                thing.home += b.dir * LANE_W;
                thing.shift = { from: thing.x, t: 0 };
              });
              run.safe = clamp(run.safe + b.dir, 0, LANES - 1);
            }
            b.nextBeat = b.beat;
            if (Math.random() < 0.35) b.dir *= -1;
          }
        }
        b.dur = Math.min(14, b.dur + dt * run.dust * 0.5);
        if (b.t >= b.dur && run.bane) {
          run.bane = null;
          run.presenceEnded = run.t;
          run.pendingSwitch = false;
          run.things = run.things.filter((thing) => thing.kind !== 'switch' || thing.wapped);
          run.nextPresence = scene().presence === 'bane' ? rand(8, 12) : rand(15, 22);
          // Unfoiled, a scheme counts for him; a march run its course counts for the mimes.
          lean('scheme_ran');
          if (b.id === 'march') tally('maw', 2);
          showToast('Mr. BaneWAP withdraws.', '“This is not over.” It is, for now.', 2200, 'bane');
        }
      }
    }
    // Stepping: a line segment, quickly drawn.
    run.moveT = Math.min(1, run.moveT + dt / run.carrier.step);
    run.x = run.from + (laneX(run.lane) - run.from) * (1 - (1 - run.moveT) ** 3);
    run.dust = Math.max(0, run.dust - dt * 0.18);
    if (run.jumpT > 0) {
      run.jumpT = Math.max(0, run.jumpT - dt);
      if (run.jumpT === 0) {
        // Down again: the pie lands on the plate with a little jostle (the porter barely feels it).
        run.jumpCool = 0.22;
        if (run.deftHop || run.hopClears >= 2) {
          sfx('deft');
          lean('deft');
          spawnRing(run.x, run.y + 10, 26, colors.gold, 0.45);
          run.wobble = Math.max(0, run.wobble - 0.12 * Math.max(1, run.hopClears || 1));
          run.sliceReady = Math.min(1, run.sliceReady + 0.35);
          run.tags.push({ x: run.x, y: run.y - 104, t: 0, text: run.hopClears >= 2 ? `HOP ×${run.hopClears}` : 'DEFT HOP' });
        } else {
          sfx('land');
          run.wobble = Math.min(1.2, run.wobble + 0.1 * clamp(run.carrier.wobble / 0.18, 0.7, 1.3));
        }
        run.deftHop = false;
        run.hopClears = 0;
      }
    } else if (run.jumpCool > 0) {
      run.jumpCool = Math.max(0, run.jumpCool - dt);
    }
    run.moveYT = Math.min(1, run.moveYT + dt / run.carrier.step);
    run.y = run.fromY + (rowY(run.row) - run.fromY) * (1 - (1 - run.moveYT) ** 3);
    if (state === 'running' && run.moveT >= 1 && run.moveYT >= 1 && run.jumpT <= 0) {
      run.stillT += dt;
      if (poised() && !run.poisedSaid && run.stillT >= 0.85) {
        run.poisedSaid = true;
        run.tags.push({ x: run.x, y: run.y - 88, t: 0, text: 'POISED' });
      }
    } else {
      run.stillT = 0;
    }
    ['lit', 'lag', 'unkept', 'warm', 'fed', 'glimpse', 'slideT', 'hurtT', 'rattled', 'shake', 'comboT', 'knockT', 'breath', 'meetCool'].forEach((key) => { if (run[key] > 0) run[key] = Math.max(0, run[key] - dt); });
    // The pie settles if you let it.
    // A knock rattles it for a moment; after that it settles, faster with something warm close by or when held in poise.
    if (!(run.rattled > 0)) {
      run.wobble = Math.max(0, run.wobble - dt * carrierSettle() * (run.warm > 0 ? 1.8 : 1) * (poised() ? 1.65 : 1));
    }
    if (state === 'running' && run.wobble > 0.44 && Math.abs(run.tiltDir) >= 0.35 && run.hurtT <= 0) {
      teach('catch', 'Catching the tilt');
    }
    run.tiltDir *= Math.max(0, 1 - dt * (run.wobble < 0.08 ? 6 : 1.8));
    run.phase += dt * (6 + run.wobble * 10);
    if (run.steadied > 0) run.steadied -= dt;
    if (run.floured > 0) run.floured -= dt;
    run.sliceReady = Math.min(1, run.sliceReady + dt / (whole() ? 1.0 : 1.6));
    // The aim needle holds where it was left. Only something done turns it: Q/E, a pointer, a tap,
    // a knock that swings the carrier, or remainder-moths, who go to the nearest face like a lamp.
    if (run.trueAim > 0) {
      run.trueAim = Math.max(0, run.trueAim - dt);
      const from = throwFrom();
      const face = run.things
        .filter((t) => t.kind === 'clown' && !t.wapped && t.y < from.y - 20)
        .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
      if (face) {
        const want = clamp(Math.atan2(face.x - from.x, from.y - (face.y - 8)), -AIM_MAX, AIM_MAX);
        run.aim.a += (want - run.aim.a) * Math.min(1, dt * 5);
      }
    }
    // The pad's target: the carrier walks there a step at a time, at its own pace (no hurried steps).
    if (state === 'running' && run.target) {
      if (run.target.lane !== run.lane && run.moveT >= TUNE.pad_pace) step(Math.sign(run.target.lane - run.lane));
      else if (run.target.lane === run.lane && run.target.row !== run.row && run.moveT >= TUNE.pad_pace && run.moveYT >= TUNE.pad_pace) climb(Math.sign(run.target.row - run.row));
      else if (run.target.lane === run.lane && run.target.row === run.row && !run.target.held) run.target = null;
    }
    if (state === 'running') {
      tickForetold(dt);
      tickEcology(dt);
      if (run.escort) run.escort.t -= dt;
    }
    setSoundMood({ muffled: state === 'running' && run.lag > 0, thin: state === 'running' && mawAhead() });

    if (state === 'running') {
      run.things.forEach((thing) => {
        if (thing.wapped) {
          // Delighted (or foiled), and briefly airborne.
          thing.wapT += dt;
          if (!reduced?.matches) {
            thing.y -= 150 * dt;
            thing.x += thing.spin * 60 * dt;
          }
          return;
        }
        if (thing.hover != null) {
          // The land's own wait a moment, up the lanes, then go about their business.
          if (!thing.leaving && thing.y >= thing.hover) {
            thing.y = thing.hover;
            thing.stay -= dt;
            thing.x = thing.home + Math.sin(run.t * 2 + thing.born) * 6;
            if (thing.stay <= 0) {
              if (thing.kind === 'egg') thing.hover = null;   // the Egg stays where it is; the carry goes on
              else thing.leaving = thing.x < W / 2 ? -1 : 1;
            }
            return;
          }
          if (thing.leaving) {
            thing.x += thing.leaving * 150 * dt;
            thing.y -= 30 * dt;
            return;
          }
        }
        thing.y += run.speed * dt;
        if (thing.shift) {
          thing.shift.t = Math.min(1, thing.shift.t + dt / 0.3);
          thing.x = thing.shift.from + (thing.home - thing.shift.from) * thing.shift.t;
          if (thing.shift.t >= 1) thing.shift = null;
          return;
        }
        // Clowns love WAP: they drift toward the pie while there is still time to get in front of it.
        if (thing.kind === 'clown' && thing.y < run.y - 70) {
          const pull = run.boon ? 70 : 42;
          thing.x += clamp((run.x - thing.x) * 0.9, -pull, pull) * dt;
        } else if (thing.vx) {
          thing.x += thing.vx * dt;
          if (Math.abs(thing.x - thing.home) > thing.range) {
            thing.x = thing.home + Math.sign(thing.x - thing.home) * thing.range;
            thing.vx *= -1;
          }
        }
        if (thing.kind === 'wasps') thing.x = thing.home + Math.sin((run.t + thing.zig) * 4) * thing.range;
        // Baneberries: a mime nearby gathers them for him (in pantomime, but they go all the same);
        // while he is here, any that get past the pie are his (unless sweetened by a warm slice).
        if (thing.kind === 'baneberry' && !thing.sweetened) {
          const mime = run.things.find((other) => !other.wapped && (other.kind === 'mime' || other.kind === 'march')
            && Math.abs((other.kind === 'march' ? thing.x : other.x) - thing.x) < 150 && Math.abs(other.y - thing.y) < 90);
          if (mime) {
            const mx = mime.kind === 'march' ? thing.x : mime.x;
            thing.x += clamp((mx - thing.x) * 2, -90, 90) * dt;
            thing.y += clamp((mime.y - thing.y) * 2, -90, 90) * dt;
            if (Math.abs(mx - thing.x) < 14 && Math.abs(mime.y - thing.y) < 16) {
              thing.wapped = true;
              thing.wapT = 0.6;
              thing.spin = 0;
              feedBane(1, thing);
              tally('maw');   // the mimes brought him that one
            }
          } else if (run.bane && !thing.gone && thing.y > run.y + 24) {
            thing.gone = true;
            feedBane(0.5, thing);
          }
          // Let past the pie, it foretells something for its lane, and saying it is what brings it.
          if (!thing.wapped && !thing.foretelling && thing.y > run.y + 18) {
            thing.foretelling = true;
            lean('let_past');
            foretell(laneAt(thing.x));
          }
        }
        // Mimes Against WAP shake flour off their placards, into the air, for Mr. BaneWAP (and a mime
        // will mime shaking out a sack while he is about). If Mr. BoonWAP is holding court, it feeds him.
        if ((thing.kind === 'march' || (thing.kind === 'mime' && run.bane)) && thing.y > 0 && thing.y < H) {
          const k = thing.kind === 'march' ? 0.4 : 0.12;
          run.dust = Math.min(1, run.dust + dt * k);
          run.mimeFlourAt = run.t;
          if (Math.random() < dt * (thing.kind === 'march' ? 10 : 3)) {
            const lane = thing.kind === 'march' ? pick([...Array(LANES).keys()].filter((l) => l !== thing.gap)) : thing.lane;
            run.puffs.push({ x: laneX(lane) + rand(-8, 8), y: thing.y - 34, vx: rand(-20, 20), vy: rand(-60, -30), t: 0.2 });
          }
          if (!run.siftSaid) {
            run.siftSaid = true;
            run.tags.push({ x: thing.x, y: thing.y - 56, t: 0, text: run.boon ? 'FLOUR FOR BANEWAP · BOONWAP EATS IT' : 'FLOUR FOR BANEWAP' });
            say(run.boon
              ? 'The mimes shake flour into the air for Mr. BaneWAP. Mr. BoonWAP, holding court, eats it.'
              : 'Mimes Against WAP shake flour into the air, for Mr. BaneWAP. It feeds his schemes.');
          }
        }
        if (thing.kind === 'march' && !thing.passedBy && thing.y > run.y + 30) {
          // A march that gets past the pie unanswered has made its point.
          thing.passedBy = true;
          tally('maw');
        }
        if (thing.kind === 'clown') {
          if (thing.fedT > 0) thing.fedT -= dt;
          // Past the pie still hungry: it goes off wanting.
          if (!thing.passedBy && thing.y > run.y + 24) {
            thing.passedBy = true;
            if (thing.fed > 0) run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'WANTED MORE' });
          }
        }
        if (thing.kind === 'pigeon') thing.flap += dt * 14;
      });
      run.things = run.things.filter((thing) => {
        const gone = thing.y > H + 60 || thing.x < -60 || thing.x > W + 60 || (thing.wapped && thing.wapT > 1.1);
        if (gone && thing.kind === 'wonder' && !thing.wapped) markWonder(thing.wonder.id, 'missed');
        return !gone;
      });
      run.ways.forEach((way) => { way.y += run.speed * dt; });
      run.rules.forEach((rule) => { rule.y += run.speed * dt; });
      run.rules = run.rules.filter((rule) => rule.y < H + 20);
      // First meetings: said under the screen once per visitor, with what the thing does.
      if (run.meetCool <= 0) {
        // Every first sight of a kind in this carry turns its card (pausing on it in Story, or for Introductions).
        run.things.forEach((thing) => { if (!thing.wapped && thing.y > 12 && thing.y < run.y && CARDS[thing.kind]) turnCard(thing.kind); });
        const fresh = run.revealQueue.length ? null : run.things.find((thing) => !thing.wapped && thing.y > 12 && thing.y < run.y && MEET[thing.kind] && !met(thing.kind));
        if (fresh) {
          const [name, line] = MEET[fresh.kind];
          record.met.push(fresh.kind);
          writeRecord(record);
          run.met.push(name.replace(/^(A|An|The) /, (word) => word.toLowerCase()));
          run.things.forEach((other) => { if (other.kind === fresh.kind) other.isNew = true; });
          run.meetCool = 2.6;
          showToast(`First meeting · ${name}`, line, 4200, fresh.fatal ? 'bane' : 'boon');
          say(`${name}. ${line}`);
        }
      }
      // When the mimes pull ahead, it gets harder to wonder about pie; say so, and say when it passes.
      const ahead = mawAhead();
      if (ahead !== run.mawWas) {
        run.mawWas = ahead;
        if (ahead) showToast('The mimes are ahead here', 'Harder to wonder about pie: its words go quiet, wonders hide until you are close, Mr. BoonWAP mimes. Satisfy clowns, throw over the mimes, sweeten or squash baneberries, foil Mr. BaneWAP.', 4800, 'bane');
        else if (run.tally?.mawSeen) showToast('The pie is ahead again', 'The words come back.', 2400, 'boon');
      }
      run.ways = run.ways.filter((way) => way.y < H + 40);

      // Slices in flight: Mr. BoonWAP's, and the carrier's.
      run.slices.forEach((slice) => { slice.t += dt / 0.6; });
      run.slices = run.slices.filter((slice) => {
        if (slice.t < 1) return true;
        if (!slice.target.wapped && run.things.includes(slice.target)) wap(slice.target, 'boon', null, 1.5);
        slice.target.targeted = false;
        return false;
      });
      run.throws.forEach((shot) => flySlice(shot, dt));
      run.throws = run.throws.filter((shot) => !shot.done);

      for (const thing of run.things) {
        if (thing.wapped || thing.knocked || thing.cleared || !hits(thing)) continue;
        if (airborne() && LOW.has(thing.kind)) {
          // Cleared in a hop: a hazard or a slip passed under is passed for good, and a slice readies.
          if (thing.fatal || SLIPS.has(thing.kind)) {
            thing.cleared = true;
            run.cleared += 1;
            lean('hop_clear');
            run.hopClears = (run.hopClears || 0) + 1;
            run.sliceReady = Math.min(1, run.sliceReady + 0.3);
            run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: 'CLEARED' });
          }
          continue;
        }
        if (thing.kind === 'clown') {
          if (whole()) wap(thing, 'plate', null, helping(richness()));
          else wap(thing, 'thin', run.aura < SLICE_COST && run.filling < SLICE_COST ? 'everything' : run.aura < SLICE_COST ? 'crust' : 'filling');
          continue;
        }
        if (thing.kind === 'switch') {
          foil(thing);
          continue;
        }
        if (thing.kind === 'wonder') {
          keep(thing);
          continue;
        }
        if (thing.kind === 'baneberry') {
          thing.wapped = true;
          thing.wapT = 0.6;
          thing.spin = 0;
          if (thing.sweetened) {
            // Sweetened at the core: feeds the filling, steadies the pie, and foretells something kind.
            run.filling = Math.min(1, run.filling + 0.22);
            run.wobble = Math.max(0, run.wobble - 0.16);
            if (run.bane) run.bane.dur = Math.max(0.4, run.bane.dur - 1.5);
            sfx('sweet');
            spawnRing(thing.x, thing.y, 26, '#f2c14e', 0.45);
            run.tags.push({ x: thing.x, y: thing.y - 24, t: 0, text: 'SWEETENED · + FILLING' });
            foretell(laneAt(thing.x), { kindly: true });
          } else {
            // Squashed underfoot: one he will not get, and a foretelling that never gets said.
            run.squashed = (run.squashed || 0) + 1;
            run.foretold.unsaid += 1;
            tally('wap');
            lean('squashed');
            sfx('squash');
            run.tags.push({ x: thing.x, y: thing.y - 24, t: 0, text: 'SQUASHED · UNSAID' });
            if (run.foretold.unsaid === 1) say('Squashed before it could say anything. Whatever it would have foretold will not come because of it.');
          }
          continue;
        }
        if (thing.kind === 'beaver') {
          // Slow beavers keep their own time: for a while the land goes at theirs, and the carrier does not.
          thing.wapped = true;
          thing.wapT = 0.6;
          thing.spin = 0;
          applyPower(powerFor('beaver'));
          sfx(powerFor('beaver')?.refs?.sound || 'beaver');
          run.tags.push({ x: thing.x, y: thing.y - 28, t: 0, text: 'SLOW BEAVER · BERRIES BEHIND IT' });
          if (!run.beaverSaid) {
            run.beaverSaid = true;
            say(powerFor('beaver')?.says || 'A slow beaver. For a while the land goes at its pace, and you do not.');
          }
          continue;
        }
        if (thing.kind === 'egg') {
          if (!thing.met) meetEgg(thing);
          continue;
        }
        if (thing.kind === 'frost') {
          if (!thing.slipped) {
            thing.slipped = true;
            run.slideT = 1.4;
            run.tags.push({ x: thing.x, y: thing.y - 18, t: 0, text: 'FROST' });
            if (!run.frostSaid) {
              run.frostSaid = true;
              say('Frost underfoot. The next step slides a lane further.');
            }
          }
          continue;
        }
        if (thing.kind === 'furrow') {
          if (!thing.warmed) {
            thing.warmed = true;
            lean('furrow');
            run.aura = Math.min(1, run.aura + 0.12);
            run.filling = Math.min(1, run.filling + 0.08);
            run.wobble = Math.max(0, run.wobble - 0.15);
            run.tags.push({ x: thing.x, y: thing.y - 18, t: 0, text: '+ WARM' });
            if (!run.furrowSaid) {
              run.furrowSaid = true;
              say('A warm furrow. Something keeps the field warm from underneath.');
            }
          }
          continue;
        }
        if (run.unkept > 0) {
          // Unkept: for a moment nothing in the lanes can hold the carrier.
          if (!thing.passed) {
            thing.passed = true;
            run.tags.push({ x: thing.x, y: thing.y - 24, t: 0, text: 'UNKEPT' });
          }
          continue;
        }
        if (run.shield && thing.fatal) {
          // The warmth holds, once.
          run.shield = false;
          thing.wapped = true;
          thing.wapT = 0.3;
          thing.spin = Math.sign(thing.x - run.x) || 1;
          run.wobble = Math.min(run.wobble, 0.5);
          run.tags.push({ x: run.x, y: run.y - 90, t: 0, text: 'THE WARMTH HELD' });
          say('Something warm held the pie level, once.');
          continue;
        }
        if (thing.kind === 'berry') {
          thing.wapped = true;
          thing.wapT = 0.7;
          thing.spin = 0;
          sfx(powerFor('boonberry')?.refs?.sound || 'berry', run.berriesEaten.boon);
          spawnRing(thing.x, thing.y, 24, '#4d9f97', 0.45);
          applyPower(powerFor('boonberry'));
          run.berriesEaten.boon += 1;
          lean('boonberry');
          run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: '+ FILLING · A GLIMPSE' });
          // Kindly foretelling: whether the berry showed it or you remembered it, the lane does not say.
          if (run.berriesEaten.boon === 1 || run.berriesEaten.boon % 4 === 0) say(pick(BOON_GLIMPSES));
          continue;
        }
        if (thing.kind === 'boneberry') {
          thing.wapped = true;
          thing.wapT = 0.7;
          thing.spin = 0;
          sfx(powerFor('boneberry')?.refs?.sound || 'bone');
          spawnRing(thing.x, thing.y, 24, '#c9a99a', 0.45);
          applyPower(powerFor('boneberry'));
          run.berriesEaten.bone += 1;
          lean('boneberry');
          const taste = boneFlavour();
          run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: `+ BOTH · FED · ${taste.toUpperCase()}` });
          if (run.berriesEaten.bone === 1 || run.berriesEaten.bone % 3 === 0) {
            showToast('A boneberry', `Here it tastes of ${taste}. Grown, not raised: a whole meal, and nobody suffered for it.`, 3000, 'wonder');
            say(`A boneberry. Here it tastes of ${taste}. Your steps tilt less for a while.`);
          }
          continue;
        }
        if (thing.kind === 'puddle') {
          if (!thing.slipped) {
            thing.slipped = true;
            run.wobble = Math.min(1.2, run.wobble + 0.36);
            say('A puddle. The pie slides.');
          }
          continue;
        }
        if (thing.kind === 'sack') {
          if (!thing.floured) flour(thing);
          continue;
        }
        if (thing.kind === 'pile') {
          if (!thing.trodden) {
            thing.trodden = true;
            dust(0.15);
            run.aura = Math.min(1, run.aura + 0.18);
            run.tags.push({ x: thing.x, y: thing.y - 20, t: 0, text: '+ CRUST' });
          }
          continue;
        }
        if (knock(thing)) return;
        continue;
      }
      if (run.boof) {
        run.boof.y += run.speed * dt * 0.55;
        run.boof.x += run.boof.vx * dt;
        if (!run.boof.touched && Math.abs(run.boof.x - run.x) < 32 && Math.abs(run.boof.y - (run.y - 10)) < 36) {
          run.boof.touched = true;
          lean('boof');
          run.wobble = 0;
          run.tiltDir = 0;
          run.steadied = 1.6;
          spawnRing(run.x, run.y - 18, 34, colors.gold, 0.55);
          say('Boof brushes past. The pie steadies.');
        }
        if (run.boof.x < -60 || run.boof.x > W + 60 || run.boof.y > H + 40) run.boof = null;
      }
      if (run.wobble >= 1) {
        // Tipped over the edge: blamed on the last thing that knocked it, if it was lately.
        spill(run.knockT > 0 && run.lastKnock ? run.lastKnock : 'wobble');
        return;
      }
    }

    // The hat: it follows the head, late, and never quite obeys gravity.
    const hat = run.hat;
    if (state !== 'spilling' && state !== 'over') {
      const tx = run.x;
      const ty = run.y - 64 - jumpLift() - (reduced?.matches ? 0 : Math.sin(run.t * 1.7) * 3);
      hat.vx += (tx - hat.x) * dt * 38;
      hat.vy += (ty - hat.y) * dt * 38;
      hat.vx *= 0.82;
      hat.vy *= 0.82;
      hat.x += hat.vx * dt * 10;
      hat.y += hat.vy * dt * 10;
    }
    if (run.sceneT != null && run.sceneT < 1) run.sceneT = Math.min(1, run.sceneT + dt / (reduced?.matches ? 0.4 : 1.4));
    if (run.swapT != null && run.swapT < 1) run.swapT = Math.min(1, run.swapT + dt / 0.6);
    if (run.spill) run.spill.t += dt;
    run.bursts.forEach((burst) => { burst.t += dt; });
    run.bursts = run.bursts.filter((burst) => burst.t < 0.9);
    run.puffs.forEach((puff) => { puff.t += dt; puff.x += puff.vx * dt; puff.y += puff.vy * dt; puff.vy += 60 * dt; });
    run.puffs = run.puffs.filter((puff) => puff.t < 1.1);
    run.rings.forEach((ring) => {
      ring.t += dt;
      ring.r = 4 + (ring.maxR - 4) * Math.min(1, ring.t / ring.dur);
    });
    run.rings = run.rings.filter((ring) => ring.t < ring.dur);
    run.trails.forEach((tr) => { tr.t += dt; });
    run.trails = run.trails.filter((tr) => tr.t < 0.28);
    run.tags.forEach((tag) => { tag.t += dt; });
    run.tags = run.tags.filter((tag) => tag.t < 1);
    if (scene().rain && !reduced?.matches) {
      while (run.drops.length < 70) run.drops.push({ x: rand(0, W), y: rand(-H, 0), v: rand(420, 620) });
      run.drops.forEach((drop) => {
        drop.y += drop.v * dt;
        drop.x -= 40 * dt;
        if (drop.y > H) { drop.y = rand(-40, 0); drop.x = rand(0, W + 40); }
      });
    } else {
      run.drops.length = 0;
    }
    if (state === 'running') tickFlows();
    if (meter) {
      meter.style.setProperty('--wobble', String(clamp(run.wobble, 0, 1)));
      meter.style.setProperty('--lean', String(clamp(run.tiltDir * Math.min(1, run.wobble * 1.4), -1, 1)));
    }
    if (auraMeter) {
      auraMeter.style.setProperty('--crust', String(clamp(run.aura, 0, 1)));
      auraMeter.style.setProperty('--filling', String(clamp(run.filling, 0, 1)));
      auraMeter.classList.toggle('is-thin', !whole());
      auraMeter.classList.toggle('is-rich', richness() >= 0.85);
    }
    root.dataset.cabinetMood = state !== 'running'
      ? ''
      : run.wobble > 0.75
        ? 'danger'
        : run.boon
          ? 'boon'
          : run.bane
            ? 'bane'
            : (run.warm > 0 || run.shield)
              ? 'warm'
              : poised()
                ? 'poise'
                : '';
  };

  /* ─── Drawing: the city in its colours; the figure in plain ink ─── */

  /* A place's light: the paper, tinted. Between places, one crosses into the next. */
  const skyFor = (s) => {
    const tint = { night: colors.night, bronze: colors.gold, ember: colors.hearth, gold: colors.gold, berry: colors.berry, frost: mix(colors.accent, 'rgb(236, 244, 248)', 0.55) }[s.tint];
    return [mix(colors.paper, tint, s.tint === 'night' ? 0.32 : 0.16), mix(colors.deep, tint, s.tint === 'night' ? 0.22 : 0.08)];
  };
  const drawGroundFor = (sceneId, scroll, alpha = 1) => {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const stroke = mix(colors.muted, colors.paper, 0.84);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    if (sceneId === 'field') {
      // Turned earth ridges and frost-flecked furrow lines.
      const off = scroll % 36;
      for (let y = -36 + off; y < H + 18; y += 36) {
        const rowIdx = Math.floor((y - off) / 36);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let lx = 0; lx <= W; lx += 36) {
          const wave = Math.sin(lx * 0.05 + rowIdx) * 2.5;
          ctx.lineTo(lx, y + wave);
        }
        ctx.stroke();
        ctx.fillStyle = mix(colors.accent, colors.paper, 0.85);
        for (let lane = 0; lane < LANES; lane += 1) {
          const fx = lane * LANE_W + 22 + ((rowIdx + lane) % 3) * 10;
          ctx.beginPath(); ctx.arc(fx, y - 10, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (sceneId === 'gate') {
      // Squared parcel-gate flagstones with bronze threshold rivets.
      const off = scroll % 38;
      for (let y = -38 + off; y < H; y += 38) {
        const shift = (Math.floor((y - off) / 38) % 2) * (LANE_W * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        for (let x = shift; x < W; x += LANE_W) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 38);
        }
        ctx.stroke();
        ctx.fillStyle = mix(colors.gold, colors.paper, 0.78);
        for (let x = shift + 6; x < W; x += LANE_W) {
          ctx.beginPath(); ctx.arc(x, y + 5, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (sceneId === 'plaza') {
      // Fan-paved festival courses and radial joints.
      const off = scroll % 40;
      for (let y = -40 + off; y < H + 40; y += 40) {
        ctx.beginPath();
        ctx.ellipse(W / 2, y + 60, W * 0.68, 38, 0, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
        for (let lane = 0; lane < LANES; lane += 1) {
          const lx = laneX(lane);
          ctx.beginPath();
          ctx.arc(lx, y, 10, 0, Math.PI);
          ctx.stroke();
        }
      }
    } else if (sceneId === 'court') {
      // Chequered palace flagstones and a worn runner down the middle lane.
      const off = scroll % 36;
      ctx.fillStyle = mix(colors.hearth, colors.paper, 0.9);
      ctx.fillRect(laneX(2) - LANE_W * 0.44, 0, LANE_W * 0.88, H);
      ctx.strokeStyle = mix(colors.gold, colors.paper, 0.74);
      ctx.beginPath();
      ctx.moveTo(laneX(2) - LANE_W * 0.4, 0); ctx.lineTo(laneX(2) - LANE_W * 0.4, H);
      ctx.moveTo(laneX(2) + LANE_W * 0.4, 0); ctx.lineTo(laneX(2) + LANE_W * 0.4, H);
      ctx.stroke();
      ctx.strokeStyle = stroke;
      for (let y = -36 + off; y < H; y += 36) {
        const rowIdx = Math.floor((y - off) / 36);
        for (let lane = 0; lane < LANES; lane += 1) {
          if ((rowIdx + lane) % 2 === 0 && lane !== 2) {
            ctx.fillStyle = mix(colors.muted, colors.paper, 0.93);
            ctx.fillRect(lane * LANE_W + 3, y + 3, LANE_W - 6, 30);
          }
          ctx.strokeRect(lane * LANE_W + 2, y + 2, LANE_W - 4, 32);
        }
      }
    } else if (sceneId === 'table') {
      // Wide banqueting-hall floorboards and brass dowel pins.
      const off = scroll % 44;
      for (let lane = 0; lane < LANES; lane += 1) {
        const lx = lane * LANE_W;
        ctx.beginPath();
        ctx.moveTo(lx + LANE_W * 0.5, 0);
        ctx.lineTo(lx + LANE_W * 0.5, H);
        ctx.stroke();
      }
      for (let y = -44 + off; y < H; y += 44) {
        const rowIdx = Math.floor((y - off) / 44);
        for (let lane = 0; lane < LANES; lane += 1) {
          const jy = y + ((lane * 17 + rowIdx * 9) % 22);
          ctx.beginPath();
          ctx.moveTo(lane * LANE_W + 2, jy);
          ctx.lineTo((lane + 1) * LANE_W - 2, jy);
          ctx.stroke();
          ctx.fillStyle = mix(colors.gold, colors.paper, 0.76);
          ctx.beginPath();
          ctx.arc(lane * LANE_W + 10, jy + 4, 1.1, 0, Math.PI * 2);
          ctx.arc((lane + 1) * LANE_W - 10, jy + 4, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Cobbles, scrolling with the scene.
      const off = scroll % 32;
      for (let y = -32 + off; y < H; y += 32) {
        for (let lane = 0; lane < LANES; lane += 1) {
          const shift = (Math.floor((y - off) / 32) % 2) * 12;
          ctx.beginPath();
          ctx.ellipse(lane * LANE_W + 18 + shift, y, 14, 9, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };
  const drawScene = () => {
    const defaultSceneId = CHAPTER_SCENE[chosenStartChapter] || 'lanes';
    const s = run ? scene() : (SCENES.find((entry) => entry.id === defaultSceneId) || SCENES[2]);
    let [top, bottom] = skyFor(s);
    if (run && run.prevScene != null && run.sceneT < 1) {
      const [fromTop, fromBottom] = skyFor(SCENES.find((entry) => entry.id === run.prevScene) || s);
      top = mix(fromTop, top, run.sceneT);
      bottom = mix(fromBottom, bottom, run.sceneT);
    }
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const scroll = run?.scroll || 0;
    if (run && run.prevScene && run.prevScene !== s.id && run.sceneT < 1) {
      drawGroundFor(run.prevScene, scroll, 1 - run.sceneT);
      drawGroundFor(s.id, scroll, run.sceneT);
    } else {
      drawGroundFor(s.id, scroll, 1);
    }
    // The lanes: faint lines, the grammar he moves in.
    ctx.strokeStyle = mix(colors.muted, colors.paper, 0.6);
    ctx.setLineDash([6, 10]);
    for (let lane = 1; lane < LANES; lane += 1) {
      ctx.beginPath();
      ctx.moveTo(lane * LANE_W, 0);
      ctx.lineTo(lane * LANE_W, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // The lane being carried in, lit a little: where you are is never in doubt.
    if (run && state !== 'title') {
      const glow = ctx.createLinearGradient(0, 0, 0, H);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glow.addColorStop(1, mix(colors.paper, 'rgb(255, 255, 255)', 0.5).replace('rgb(', 'rgba(').replace(')', ', 0.28)'));
      ctx.fillStyle = glow;
      ctx.fillRect(run.x - LANE_W / 2, 0, LANE_W, H);
      // How far up the lanes: four marks on each wall, the carrier's lit.
      for (let row = 0; row < ROWS; row += 1) {
        const ty = rowY(row) - 18;
        ctx.fillStyle = row === run.row ? colors.gold : mix(colors.ink, colors.paper, 0.72);
        ctx.fillRect(0, ty - 1.5, row === run.row ? 9 : 5, 3);
        ctx.fillRect(W - (row === run.row ? 9 : 5), ty - 1.5, row === run.row ? 9 : 5, 3);
      }
    }
    // A boonberry's glimpse: the clear way up the lanes, in teal, a breath before you need it.
    if (run?.glimpse > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.glimpse) * 0.85;
      const ways = run.ways.filter((way) => way.y <= run.y).sort((a, b) => b.y - a.y);
      ctx.strokeStyle = 'rgba(77, 159, 151, 0.55)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(run.x, run.y - 30);
      ways.forEach((way) => ctx.lineTo(laneX(way.lane), way.y));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244, 178, 92, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 7]);
      ctx.stroke();
      ctx.restore();
    }
    // Torch-ants (or the salt-whales' lamps): the way through, lit, row by row.
    if (run?.lit > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, run.lit);
      run.ways.forEach((way) => {
        if (way.y > run.y) return;
        const x = laneX(way.lane);
        const flicker = reduced?.matches ? 0 : Math.sin(run.t * 11 + way.y) * 1.2;
        const g = ctx.createRadialGradient(x, way.y, 1, x, way.y, 14);
        g.addColorStop(0, 'rgba(255, 196, 92, 0.75)');
        g.addColorStop(1, 'rgba(255, 196, 92, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, way.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f6b24a';
        ctx.beginPath(); ctx.ellipse(x, way.y - 2, 2.2, 3.6 + flicker, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    }
  };

  /* The aim needle from the pie, and a trajectory preview when lining up a shot, bank, curve, or ramp. */
  const drawAim = () => {
    if (!run || state !== 'running') return;
    const from = throwFrom();
    const pointerActive = Boolean(run.pointer?.active && run.pointer.y < from.y - 10);
    const a = pointerActive ? clamp(Math.atan2(run.pointer.x - from.x, from.y - run.pointer.y), -AIM_MAX * 1.4, AIM_MAX * 1.4) : run.aim.a;
    const hit = sighted(a);
    const trace = traceTrajectory(a);
    const trick = trace.bounces > 0 || trace.curved || trace.ramped;
    const gold = Boolean((hit && hit.off < 7) || (trace.hit && trick) || trace.label === 'SHARE SLICE');
    const ready = run.sliceReady >= 1;
    ctx.save();
    ctx.strokeStyle = gold ? '#f2c14e' : mix(colors.ink, colors.paper, ready ? 0.35 : 0.7);
    ctx.lineWidth = gold ? 2.4 : 1.5;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    if (pointerActive || trick || trace.hit) {
      trace.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x + Math.sin(a) * 14, pt.y - Math.cos(a) * 14);
        else ctx.lineTo(pt.x, pt.y);
      });
    } else {
      ctx.moveTo(from.x + Math.sin(a) * 14, from.y - Math.cos(a) * 14);
      const len = hit ? Math.min(hit.along, 150) : 110;
      ctx.lineTo(from.x + Math.sin(a) * len, from.y - Math.cos(a) * len);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // Mark bank, curve, or ramp nodes along the trajectory.
    if (pointerActive || trick) {
      trace.points.forEach((pt) => {
        if (!pt.bank && !pt.curve && !pt.ramp) return;
        ctx.strokeStyle = pt.curve ? '#f0c97a' : pt.ramp ? '#e0a95a' : '#96cdd2';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
    const targetThing = trace.hit || hit?.thing;
    if (targetThing) {
      ctx.strokeStyle = gold ? '#f2c14e' : mix(colors.ink, colors.paper, 0.45);
      ctx.lineWidth = gold ? 3 : 1.5;
      if (!gold) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(targetThing.x, targetThing.y - 6, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (gold) {
        ctx.fillStyle = '#f2c14e';
        ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ready ? (trace.label || 'THROW') : '…', targetThing.x, targetThing.y - 34);
      }
    }
    ctx.restore();
  };

  const HAZARD_SCALE = 1.2;
  const drawThing = (thing) => {
    const { x, y } = thing;
    ctx.save();
    // Every thing touches the ground: a shadow under it, and hazards drawn a size larger.
    if (!WIDE.has(thing.kind) && !['puddle', 'frost', 'furrow', 'hole'].includes(thing.kind) && !thing.wapped) {
      ctx.fillStyle = 'rgba(20, 16, 10, 0.18)';
      ctx.beginPath();
      ctx.ellipse(x, y + thing.h * 0.55, thing.w * 0.55, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // What it does, at its foot: a red zone knocks the pie, a blue one slips it. (Friends glow gold.)
    // A hazard coming down the carrier's own lane pulses, so the one that matters reads first.
    if (!thing.wapped && !thing.knocked && !thing.cleared && (thing.fatal || SLIPS.has(thing.kind))) {
      const hurt = thing.fatal;
      const coming = run && state === 'running' && thing.y < run.y && run.y - thing.y < 260
        && (WIDE.has(thing.kind) ? thing.gap !== run.lane : Math.abs(thing.x - run.x) < (thing.w + 20) / 2);
      const pulse = coming && !reduced?.matches ? 0.5 + Math.sin(run.t * 12) * 0.5 : coming ? 1 : 0;
      const rgb = hurt ? '200, 56, 40' : '40, 110, 170';
      ctx.fillStyle = `rgba(${rgb}, ${(hurt ? 0.2 : 0.16) + pulse * 0.14})`;
      ctx.strokeStyle = `rgba(${rgb}, ${0.75 + pulse * 0.25})`;
      ctx.lineWidth = (hurt ? 2.2 : 1.8) + pulse * 1.2;
      if (!hurt) ctx.setLineDash([4, 3]);
      if (WIDE.has(thing.kind)) {
        const top = y - thing.h / 2 - 3;
        for (let lane = 0; lane < LANES; lane += 1) {
          if (lane === thing.gap) continue;
          ctx.fillRect(lane * LANE_W + 2, top, LANE_W - 4, thing.h + 6);
          ctx.beginPath(); ctx.moveTo(lane * LANE_W + 4, top + thing.h + 8); ctx.lineTo((lane + 1) * LANE_W - 4, top + thing.h + 8); ctx.stroke();
        }
      } else {
        const rx = thing.w * 0.62 + 3;
        const footY = SLIPS.has(thing.kind) && thing.kind !== 'sack' ? y : y + thing.h * 0.5;
        ctx.beginPath();
        ctx.ellipse(x, footY, rx, thing.kind === 'puddle' || thing.kind === 'frost' ? 12 : 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    if (thing.knocked || thing.cleared) ctx.globalAlpha = 0.4;   // already knocked, or hopped: it cannot again
    if (thing.fatal && !WIDE.has(thing.kind)) {
      ctx.translate(x, y);
      ctx.scale(HAZARD_SCALE, HAZARD_SCALE);
      ctx.translate(-x, -y);
    }
    // Friends glow: go toward these.
    if ((['clown', 'switch', 'berry', 'boneberry', 'wonder', 'egg', 'beaver'].includes(thing.kind) || (thing.kind === 'baneberry' && thing.sweetened)) && !thing.wapped) {
      const halo = ctx.createRadialGradient(x, y - 4, 4, x, y - 4, 30);
      halo.addColorStop(0, 'rgba(255, 214, 102, 0.45)');
      halo.addColorStop(1, 'rgba(255, 214, 102, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y - 4, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    switch (thing.kind) {
      case 'stone': {
        // A field stone, older than the furrow: jagged, faceted, cracked, flecked with frost.
        const rock = [[-15, 9], [-16, 0], [-10, -9], [-3, -14], [5, -12], [12, -7], [16, 2], [13, 10]];
        ctx.fillStyle = '#5f5a52';
        ctx.strokeStyle = '#2f2b26';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        rock.forEach(([dx, dy], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#8a847a';   // the lit facet
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 9); ctx.lineTo(x - 3, y - 14); ctx.lineTo(x + 5, y - 12); ctx.lineTo(x + 1, y - 3); ctx.lineTo(x - 8, y - 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2f2b26';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 3); ctx.lineTo(x + 4, y + 4); ctx.lineTo(x + 2, y + 9);
        ctx.moveTo(x + 1, y - 3); ctx.lineTo(x + 10, y - 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(236, 246, 252, 0.9)';
        [[-6, -10], [-1, -12], [3, -11], [-9, -5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.2, 0, Math.PI * 2); ctx.fill(); });
        break;
      }
      case 'pane': {
        // A pane of Bonk glass on its edge: it remembers being struck.
        ctx.fillStyle = 'rgba(150, 205, 210, 0.42)';
        ctx.strokeStyle = 'rgba(70, 120, 130, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 12); ctx.lineTo(x - 12, y - 15); ctx.lineTo(x + 15, y - 12); ctx.lineTo(x + 13, y + 14); ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 2); ctx.lineTo(x - 9, y - 10);
        ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 8, y - 6);
        ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 2, y + 10);
        ctx.stroke();
        break;
      }
      case 'baneberry': {
        // A baneberry cluster: plum-black, a cold violet sheen, a thorn on the stem (or amber-hearted once sweetened).
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.6) * 3);
        ctx.strokeStyle = thing.sweetened ? 'rgba(242, 193, 78, 0.85)' : 'rgba(120, 60, 150, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash(thing.sweetened ? [] : [2, 3]);
        ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        [[-4, 2], [4, 2], [0, -4], [-1, 6], [5, -3]].forEach(([dx, dy]) => {
          const g = ctx.createRadialGradient(x + dx - 1.5, y + dy - 1.5, 0.5, x + dx, y + dy, 5);
          if (thing.sweetened) {
            g.addColorStop(0, '#ffe38a');
            g.addColorStop(0.45, '#d4843a');
            g.addColorStop(1, '#5a2548');
          } else {
            g.addColorStop(0, '#9c7bd0');
            g.addColorStop(0.35, '#4a2560');
            g.addColorStop(1, '#1c0d24');
          }
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x + dx, y + dy, 5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.strokeStyle = '#3a4a2a';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x - 4, y - 14); ctx.lineTo(x - 2, y - 11); ctx.stroke();
        break;
      }
      case 'beaver': {
        // A slow beaver: in no hurry, flat tail, two good teeth.
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.6) * 3);
        const dir = thing.vx < 0 ? -1 : 1;
        ctx.fillStyle = '#5a3a22';
        ctx.beginPath(); ctx.ellipse(x - dir * 15, y + 3, 7, 4, 0, 0, Math.PI * 2); ctx.fill();   // tail
        ctx.strokeStyle = 'rgba(30, 18, 10, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - dir * 20, y + 3); ctx.lineTo(x - dir * 10, y + 3); ctx.stroke();
        ctx.fillStyle = '#8a5a34';
        ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0, 0, Math.PI * 2); ctx.fill();               // body
        ctx.beginPath(); ctx.arc(x + dir * 11, y - 3, 6, 0, Math.PI * 2); ctx.fill();           // head
        ctx.fillStyle = '#fbf6ea';
        ctx.fillRect(x + dir * 15 - 1.5, y, 3, 3.5);                                               // teeth
        ctx.fillStyle = '#1d1209';
        ctx.beginPath(); ctx.arc(x + dir * 13, y - 5, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colors.accent;
        ctx.font = '700 7px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        if (!thing.wapped) ctx.fillText('SLOW', x, y - 14);
        break;
      }
      case 'mime':
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
        drawMime(x, y, thing.facing || 1, run.t + thing.born);
        break;
      case 'mimewall': {
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
        // The wall a mime is miming: a shimmer, two gloved hands pressed flat against it.
        const shimmer = reduced?.matches ? 0.5 : 0.5 + Math.sin(run.t * 3 + thing.born) * 0.5;
        ctx.fillStyle = `rgba(214, 228, 240, ${0.18 + shimmer * 0.1})`;
        ctx.strokeStyle = `rgba(150, 175, 200, ${0.55 + shimmer * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.rect(x - 20, y - 22, 40, 40); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        [[-8, -6], [8, 2]].forEach(([dx, dy]) => {
          ctx.fillStyle = '#fbfaf6';
          ctx.strokeStyle = 'rgba(40, 40, 46, 0.6)';
          ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          for (let f = -1.5; f <= 1.5; f += 1) { ctx.beginPath(); ctx.ellipse(x + dx + f * 2.4, y + dy - 6.5, 1.1, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
        });
        break;
      }
      case 'march': {
        // Mimes Against WAP: a silent line, placards up, one gap. (Foiled with him, they go home.)
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.2);
        for (let lane = 0; lane < LANES; lane += 1) {
          if (lane === thing.gap) continue;
          const mx = laneX(lane);
          drawMime(mx, y + 4, lane < thing.gap ? 1 : -1, run.t + lane, true);
          ctx.fillStyle = '#fbfaf6';
          ctx.strokeStyle = '#2a2a30';
          ctx.lineWidth = 1.2;
          ctx.fillRect(mx - 13, y - 40, 26, 16);
          ctx.strokeRect(mx - 13, y - 40, 26, 16);
          ctx.beginPath(); ctx.moveTo(mx, y - 24); ctx.lineTo(mx, y - 12); ctx.stroke();
          if (lane === (thing.gap + 2) % LANES) {
            ctx.fillStyle = '#2a2a30';
            ctx.font = '800 8px "JetBrainsMono", ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MAW', mx, y - 29);
          } else if (lane % 2) {
            // A pie, crossed out: the only thing any of them has said.
            ctx.fillStyle = '#e0a95a';
            ctx.beginPath(); ctx.ellipse(mx, y - 32, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(mx - 7, y - 37); ctx.lineTo(mx + 7, y - 27); ctx.stroke();
          }
        }
        break;
      }
      case 'hole': {
        // A hole, freshly dug: a dark mouth, a rim of turned earth, clods thrown about.
        ctx.fillStyle = '#7a5a3a';
        ctx.beginPath(); ctx.ellipse(x, y + 1, 19, 10, 0, 0, Math.PI * 2); ctx.fill();
        const mouth = ctx.createRadialGradient(x, y + 2, 1, x, y + 2, 15);
        mouth.addColorStop(0, '#0d0906');
        mouth.addColorStop(1, '#3a2716');
        ctx.fillStyle = mouth;
        ctx.beginPath(); ctx.ellipse(x, y + 2, 15, 7.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a4a2c';
        [[-20, -6], [17, -7], [22, 4], [-23, 5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); });
        break;
      }
      case 'ditch': {
        // A ditch across every lane: the only way over is up.
        const top = y - thing.h / 2;
        ctx.fillStyle = '#6a4a2c';
        ctx.fillRect(0, top - 3, W, thing.h + 6);
        const pit = ctx.createLinearGradient(0, top, 0, top + thing.h);
        pit.addColorStop(0, '#120c08');
        pit.addColorStop(1, '#3a2716');
        ctx.fillStyle = pit;
        ctx.fillRect(0, top + 2, W, thing.h - 4);
        if (!thing.cleared && !thing.knocked) {
          ctx.fillStyle = 'rgba(242, 193, 78, 0.9)';
          ctx.font = '800 10px "JetBrainsMono", ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let lane = 0; lane < LANES; lane += 2) ctx.fillText('HOP ⤒', laneX(lane), y);
          ctx.textBaseline = 'alphabetic';
        }
        break;
      }
      case 'frost': {
        ctx.fillStyle = 'rgba(226, 240, 248, 0.85)';
        ctx.beginPath();
        ctx.ellipse(x, y, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(120, 165, 190, 0.8)';
        ctx.lineWidth = 1;
        [[-12, 0], [0, -2], [11, 1]].forEach(([dx, dy]) => {
          ctx.beginPath();
          for (let i = 0; i < 3; i += 1) {
            const a = (i / 3) * Math.PI;
            ctx.moveTo(x + dx - Math.cos(a) * 4, y + dy - Math.sin(a) * 2.5);
            ctx.lineTo(x + dx + Math.cos(a) * 4, y + dy + Math.sin(a) * 2.5);
          }
          ctx.stroke();
        });
        break;
      }
      case 'furrow': {
        // A dug furrow, warm from underneath: pinprick torches along it.
        ctx.fillStyle = '#5a3f2a';
        ctx.beginPath();
        ctx.roundRect(x - 26, y - 5, 52, 10, 5);
        ctx.fill();
        for (let i = 0; i < 5; i += 1) {
          const tx = x - 20 + i * 10;
          const flick = thing.warmed ? 0.35 : 0.8 + Math.sin(run.t * 9 + i) * 0.2;
          ctx.fillStyle = `rgba(255, 190, 90, ${flick})`;
          ctx.beginPath(); ctx.arc(tx, y, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case 'egg': {
        // Something warm, egg-shaped, in a nest of furrow-straw. Unexplained.
        const pulse = reduced?.matches ? 0 : Math.sin(run.t * 2.2) * 0.12;
        const glow = ctx.createRadialGradient(x, y - 4, 2, x, y - 4, 30);
        glow.addColorStop(0, `rgba(255, 186, 96, ${0.45 + pulse})`);
        glow.addColorStop(1, 'rgba(255, 186, 96, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y - 4, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a07a3c';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = -2; i <= 2; i += 1) { ctx.moveTo(x - 14, y + 8 + i); ctx.lineTo(x + 14, y + 6 - i); }
        ctx.stroke();
        const shell = ctx.createLinearGradient(x - 9, y - 18, x + 9, y + 8);
        shell.addColorStop(0, '#fbf1dc');
        shell.addColorStop(1, '#d9b98a');
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.ellipse(x, y - 5, 9.5, 12.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160, 110, 50, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - 4, y - 12); ctx.lineTo(x - 1, y - 9); ctx.lineTo(x - 3, y - 6); ctx.stroke();
        break;
      }
      case 'wonder': {
        // Harder to wonder: while the mimes lead, a wonder shows only as a shimmer until the carrier is close.
        if (mawAhead() && !thing.wapped && Math.hypot(thing.x - run.x, thing.y - run.y) > 120) {
          ctx.strokeStyle = 'rgba(150, 175, 200, 0.7)';
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(150, 175, 200, 0.8)';
          ctx.font = '700 12px "JetBrainsMono", ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', x, y + 1);
          ctx.textBaseline = 'alphabetic';
          break;
        }
        // One of the land's own: a medallion with its sigil (@ creature, $ contrivance, & bracework, # saying).
        if (thing.wapped) {
          const t = Math.min(1, (thing.wapT - 0.5) / 0.6);
          ctx.globalAlpha = Math.max(0, 1 - t);
          ctx.translate(x, y);
          ctx.scale(1 + t * 0.8, 1 + t * 0.8);
          ctx.translate(-x, -y);
        }
        const bob = reduced?.matches ? 0 : Math.sin(run.t * 3 + thing.born) * 2;
        ctx.fillStyle = mix(colors.paper, 'rgb(255, 255, 255)', 0.4);
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x, y + bob, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = colors.accent;
        ctx.font = '800 14px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(KIND_SIGIL[thing.wonder?.kind] || '@', x, y + bob + 1);
        ctx.textBaseline = 'alphabetic';
        if (thing.wonder?.name && !thing.wapped && !thing.leaving) {
          ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
          ctx.fillStyle = colors.ink;
          ctx.fillText(thing.wonder.name.toUpperCase(), clamp(x, 36, W - 36), y + bob - 19);
        }
        break;
      }
      case 'throne':
        ctx.fillStyle = '#c9a23a';
        ctx.strokeStyle = '#6a4e14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - 14, y - 18, 28, 14, 4);          // back
        ctx.rect(x - 15, y - 4, 30, 9);                     // seat
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#8a3a3a';
        ctx.fillRect(x - 11, y - 3, 22, 5);                  // cushion
        ctx.fillStyle = '#b8935a';
        ctx.fillRect(x - 13, y + 5, 4, 10);
        ctx.fillRect(x + 9, y + 5, 4, 10);
        ctx.fillStyle = '#6a4e14';
        ctx.font = '600 6px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('RENTED', x, y - 9);
        break;
      case 'subject':
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.25) * 1.4);
        ctx.fillStyle = '#5a6b52';
        ctx.beginPath();
        ctx.roundRect(x - 9, y - 6, 18, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#e2b48c';
        ctx.beginPath();
        ctx.arc(x, y - 12, 7, 0, Math.PI * 2);
        ctx.fill();
        if (thing.loaf || thing.shared) {
          ctx.fillStyle = thing.shared ? '#f2c14e' : '#c98a3e';
          ctx.beginPath();
          ctx.ellipse(x + 10, y + 2, 7, 4, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'pile': {
        // A pile of flour, heaped like a ramp; trodden ones lie flatter.
        const flat = thing.trodden ? 0.6 : 1;
        ctx.fillStyle = '#f2ead8';
        ctx.strokeStyle = 'rgba(150, 130, 95, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - thing.w / 2, y + 6);
        ctx.quadraticCurveTo(x - 6, y - 12 * flat, x + 4, y - 9 * flat);
        ctx.quadraticCurveTo(x + 14, y - 6 * flat, x + thing.w / 2, y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(150, 130, 95, 0.75)';
        ctx.font = '700 7px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⌃', x, y + 3);
        break;
      }
      case 'berry': {
        // A boonberry cluster: glassy teal drupelets, each with an amber ember at its core.
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.7) * 3);
        [[-5, 2], [5, 2], [0, -5], [-2, 6], [4, -2]].forEach(([dx, dy]) => {
          const g = ctx.createRadialGradient(x + dx, y + dy, 0.5, x + dx, y + dy, 5.5);
          g.addColorStop(0, '#f4b25c');
          g.addColorStop(0.35, '#c86d2c');
          g.addColorStop(0.55, '#4d9f97');
          g.addColorStop(1, '#235f5b');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x + dx, y + dy, 5.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.strokeStyle = '#3d6a3a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 3, y - 14, x + 7, y - 15); ctx.stroke();
        break;
      }
      case 'boneberry': {
        // A boneberry: bone-white, a dusk-red blush, firm; a faint smoke off the skin.
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - (thing.wapT - 0.7) * 3);
        [[-5, 3], [5, 3], [0, -4]].forEach(([dx, dy]) => {
          const g = ctx.createRadialGradient(x + dx - 2, y + dy - 2, 0.5, x + dx, y + dy, 6.5);
          g.addColorStop(0, '#fbf6ee');
          g.addColorStop(0.55, '#ead9cc');
          g.addColorStop(1, '#a8564a');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 5.5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(80, 40, 34, 0.45)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        });
        ctx.strokeStyle = 'rgba(160, 150, 140, 0.55)';
        ctx.lineWidth = 1.1;
        const drift = reduced?.matches ? 0 : Math.sin((run?.t || 0) * 3 + x) * 1.5;
        ctx.beginPath(); ctx.moveTo(x + 1, y - 11); ctx.bezierCurveTo(x + 4 + drift, y - 15, x - 3 + drift, y - 18, x + 1, y - 22); ctx.stroke();
        break;
      }
      case 'switch': {
        // Mr. BaneWAP's off switch: every scheme has one, in plain view.
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.5);
        ctx.fillStyle = '#2b2b30';
        ctx.beginPath();
        ctx.roundRect(x - 13, y - 6, 26, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#d6473e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x + (thing.wapped ? -9 : 9), y - 14);
        ctx.stroke();
        ctx.fillStyle = '#d6473e';
        ctx.beginPath();
        ctx.arc(x + (thing.wapped ? -9 : 9), y - 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f3ead6';
        ctx.font = '700 6px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(thing.wapped ? 'OFF' : 'ON', x, y + 7);
        break;
      }
      case 'post': {
        const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 13);
        g.addColorStop(0, '#f0c97a');
        g.addColorStop(1, '#8a5a1e');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 220, 140, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y - 16, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'sack':
        if (thing.floured) ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#e8dcc0';
        ctx.strokeStyle = '#a89870';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - 22, y - 16, 44, 32, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#8a7a58';
        ctx.font = '600 8px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('FLOUR', x, y + 3);
        break;
      case 'puddle': {
        // Standing water: deep enough to slide in, ringed with ripples.
        const water = ctx.createLinearGradient(x, y - 9, x, y + 9);
        water.addColorStop(0, '#6fa3c0');
        water.addColorStop(1, '#2f6688');
        ctx.fillStyle = water;
        ctx.strokeStyle = '#1f4a66';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - 26, y);
        ctx.bezierCurveTo(x - 24, y - 10, x + 8, y - 11, x + 26, y - 2);
        ctx.bezierCurveTo(x + 24, y + 9, x - 10, y + 11, x - 26, y);
        ctx.fill();
        ctx.stroke();
        const ripple = reduced?.matches ? 0.5 : (run.t * 0.8 + thing.born) % 1;
        ctx.strokeStyle = `rgba(230, 244, 252, ${0.85 - ripple * 0.6})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(x - 4, y, 4 + ripple * 12, 1.5 + ripple * 4, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath(); ctx.ellipse(x + 10, y - 4, 5, 1.4, -0.2, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'snail':
        ctx.fillStyle = '#c9d6d2';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9fb8b2';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 3.5, 0, Math.PI * 1.5);
        ctx.stroke();
        break;
      case 'spool':
        ctx.translate(x, y);
        ctx.rotate(run.t * (thing.vx > 0 ? 6 : -6));
        ctx.fillStyle = colors.berry;
        ctx.fillRect(-8, -5, 16, 10);
        ctx.fillStyle = '#c8a46a';
        ctx.fillRect(-8, -8, 3, 16);
        ctx.fillRect(5, -8, 3, 16);
        break;
      case 'pigeon': {
        ctx.fillStyle = '#8f98a6';
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        const flap = Math.sin(thing.flap) * 6;
        ctx.beginPath();
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x - 13, y - flap);
        ctx.lineTo(x - 4, y + 2);
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + 13, y - flap);
        ctx.lineTo(x + 4, y + 2);
        ctx.fill();
        break;
      }
      case 'clerk':
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - Math.max(0, (thing.wapT - 0.25) * 1.4));
        ctx.fillStyle = colors.night;
        ctx.beginPath();
        ctx.roundRect(x - 11, y - 12, 22, 26, 6);
        ctx.fill();
        ctx.fillStyle = '#f7f1e2';
        ctx.fillRect(x - 6, y - 6, 12, 15);
        ctx.fillStyle = thing.shared ? '#2e6f5e' : colors.hearth;
        ctx.font = '700 4.5px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(thing.shared ? 'SETTLED' : 'DAMAGE', x, y - 1);
        break;
      case 'wasps':
        ctx.fillStyle = '#b8b2a0';
        ctx.beginPath();
        ctx.moveTo(x - 12, y + 8);
        ctx.lineTo(x - 12, y - 4);
        ctx.lineTo(x - 6, y - 10);
        ctx.lineTo(x, y - 4);
        ctx.lineTo(x + 6, y - 10);
        ctx.lineTo(x + 12, y - 4);
        ctx.lineTo(x + 12, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3a3426';
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.arc(x - 10 + i * 10 + Math.sin(run.t * 9 + i) * 3, y - 14 + Math.cos(run.t * 7 + i) * 3, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'clown': {
        if (thing.wapped) {
          ctx.translate(x, y);
          if (!reduced?.matches) ctx.rotate(thing.spin * thing.wapT * 5);
          ctx.globalAlpha = Math.max(0, 1 - Math.max(0, thing.wapT - 0.6) * 2);
          drawClown(0, 0, true, 0, thing.missing);
        } else {
          drawClown(x, y, Boolean(thing.pied), Math.sin((run.t + thing.honk) * 6), thing.missing);
          // Its appetite, over its head: a pip a slice, filled as it is fed.
          const want = thing.want || 1;
          for (let i = 0; i < want; i += 1) {
            const px = x - (want - 1) * 6 + i * 12;
            const py = y - 30;
            const fill = clamp((thing.fed || 0) - i, 0, 1);
            ctx.fillStyle = 'rgba(255, 252, 240, 0.95)';
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (fill > 0) {
              ctx.fillStyle = '#e0a95a';
              ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fill); ctx.closePath(); ctx.fill();
            }
          }
        }
        break;
      }
      case 'chair':
        ctx.fillStyle = '#8a5a34';
        ctx.fillRect(x - 12, y - 4, 24, 6);
        ctx.fillRect(x - 12, y - 14, 4, 22);
        ctx.fillRect(x + 8, y - 4, 4, 12);
        break;
      case 'dividers': {
        const [a, b] = thing.lanes.map(laneX);
        ctx.strokeStyle = '#c49a3a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a + 8, y);
        ctx.lineTo((a + b) / 2, y - 12);
        ctx.lineTo(b - 8, y);
        ctx.stroke();
        [a, b].forEach((cx) => {
          ctx.fillStyle = colors.berry;
          ctx.beginPath();
          ctx.arc(cx, y + 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f2d2b0';
          ctx.beginPath();
          ctx.arc(cx, y - 7, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }
      case 'banner':
      case 'table': {
        const top = y - thing.h / 2;
        for (let lane = 0; lane < LANES; lane += 1) {
          if (lane === thing.gap) continue;
          const lx = lane * LANE_W;
          if (thing.kind === 'banner') {
            ctx.fillStyle = [colors.berry, colors.gold, colors.accent, colors.hearth][lane % 4];
            ctx.fillRect(lx, top, LANE_W, thing.h);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(lx, top + thing.h - 4, LANE_W, 4);
          } else {
            ctx.fillStyle = '#7a4e2c';
            ctx.fillRect(lx, top, LANE_W, thing.h);
            ctx.fillStyle = '#f4ece0';
            ctx.fillRect(lx + 2, top + 2, LANE_W - 4, thing.h - 10);
            ctx.fillStyle = colors.gold;
            ctx.beginPath();
            ctx.arc(lx + LANE_W / 2, top + 12, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (thing.kind === 'table') {
          // The second place: set, empty, and the only way through.
          const gx = laneX(thing.gap);
          ctx.strokeStyle = colors.gold;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(gx - LANE_W / 2 + 4, top + 2, LANE_W - 8, thing.h - 4);
          ctx.setLineDash([]);
        }
        break;
      }
      default: break;
    }
    ctx.restore();
    // First met this carry: a small NEW over it while it is in view.
    if (thing.isNew && !thing.wapped && !thing.knocked && !thing.cleared && run && thing.y < run.y - 20) {
      const tx = WIDE.has(thing.kind) ? W / 2 : thing.x;
      const ty = thing.y - thing.h / 2 - (WIDE.has(thing.kind) ? 18 : 14);
      ctx.save();
      ctx.font = '800 8px "JetBrainsMono", ui-monospace, monospace';
      const tw = ctx.measureText('NEW').width + 8;
      ctx.fillStyle = colors.gold;
      ctx.beginPath(); ctx.roundRect(tx - tw / 2, ty - 7, tw, 12, 6); ctx.fill();
      ctx.fillStyle = colors.paper;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NEW', tx, ty - 0.5);
      ctx.restore();
    }
  };

  /* A mime: striped shirt, white face, black beret, white gloves up and flat against nothing. Silent. */
  function drawMime(x, y, facing, t, marching = false) {
    ctx.save();
    ctx.translate(x, y);
    const sway = reduced?.matches ? 0 : Math.sin(t * 2.4) * 1.2;
    ctx.fillStyle = '#1d1d22';
    ctx.fillRect(-6, 8, 4, 10);
    ctx.fillRect(2, 8, 4, 10);
    ctx.fillStyle = '#fbfaf6';
    ctx.beginPath(); ctx.roundRect(-9, -6, 18, 16, 4); ctx.fill();
    ctx.fillStyle = '#1d1d22';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(-9, -4 + i * 4, 18, 1.8);
    ctx.fillStyle = '#fbfaf6';
    ctx.strokeStyle = 'rgba(40, 40, 46, 0.6)';
    ctx.lineWidth = 1;
    if (marching) {
      // Both hands up on the placard pole.
      ctx.beginPath(); ctx.arc(-2, -10, 2.6, 0, Math.PI * 2); ctx.arc(3, -12, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      // Palms flat on the wall that is not there.
      ctx.beginPath(); ctx.ellipse(facing * 13 + sway, -8, 3, 4, 0, 0, Math.PI * 2); ctx.ellipse(facing * 13 + sway, 2, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#fbfaf6';
    ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.ellipse(1, -21, 7.5, 3, -0.2, 0, Math.PI * 2); ctx.fill();   // beret
    ctx.fillRect(-3.6, -16, 1.4, 3); ctx.fillRect(2.2, -16, 1.4, 3);                   // painted eyes
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.ellipse(0, -10.5, 2, 1, 0, 0, Math.PI * 2); ctx.fill();       // a small, silent mouth
    ctx.restore();
  }

  /* A clown: white face, red nose, hair like two exclamations, a ruff. Pie-faced, delighted. */
  function drawClown(x, y, pied, bounce = 0, missing = null) {
    ctx.save();
    ctx.translate(x, y + bounce);
    // Suit and ruff.
    ctx.fillStyle = '#e8c34a';
    ctx.beginPath();
    ctx.roundRect(-10, 2, 20, 16, 6);
    ctx.fill();
    ctx.fillStyle = '#d6473e';
    [[-5, 7], [4, 12], [-2, 15]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.arc(i * 4, 1, 3, 0, Math.PI * 2); ctx.fill(); }
    // Hair.
    ctx.fillStyle = '#e0582e';
    ctx.beginPath(); ctx.arc(-9, -10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -10, 5, 0, Math.PI * 2); ctx.fill();
    // Face.
    ctx.fillStyle = '#fbf6ee';
    ctx.beginPath(); ctx.arc(0, -9, 8, 0, Math.PI * 2); ctx.fill();
    if (pied) {
      // A pie, square in the face. Filling, everywhere. A very happy clown underneath.
      // (A thin one: crust without filling, filling without crust, or crumbs. Just as happy.)
      ctx.fillStyle = '#e0a95a';
      if (missing !== 'crust' && missing !== 'everything') { ctx.beginPath(); ctx.arc(0, -9, 9, 0, Math.PI * 2); ctx.fill(); }
      if (missing === 'everything') [[-4, -12], [3, -7], [5, -13], [-2, -5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 1.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = colors.berry;
      for (let i = 0; i < (missing === 'filling' || missing === 'everything' ? 0 : 6); i += 1) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 9, -9 + Math.sin(a) * 9, 3, 1.6, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#7a3a1a';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, -7, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(0, -8, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath(); ctx.arc(-3, -12, 1.1, 0, Math.PI * 2); ctx.arc(3, -12, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d6473e';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -6, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  /* WAP!, in the old way: a star of a word. */
  const drawBursts = () => {
    run?.bursts.forEach((burst) => {
      const t = burst.t / 0.9;
      const grow = reduced?.matches ? 1 : 0.7 + Math.min(1, t * 4) * 0.5;
      const r = 26 * burst.size * grow;
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, t - 0.6) * 2.5;
      ctx.translate(burst.x, burst.y - (reduced?.matches ? 0 : t * 18));
      ctx.rotate(-0.12);
      ctx.fillStyle = '#ffe36b';
      ctx.strokeStyle = '#1d1d22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 20; i += 1) {
        const a = (i / 20) * Math.PI * 2;
        const rr = i % 2 ? r * 0.62 : r;
        ctx.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d6473e';
      ctx.font = `900 ${Math.round(15 * burst.size * grow)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WAP!', 0, 1);
      ctx.restore();
    });
  };

  /* Mr. BoonWAP: a sentient pie, golden, enormous, pleased with himself. */
  const drawBoonWAP = () => {
    const b = run?.boon;
    if (!b) return;
    const enter = Math.min(1, b.t / 0.5, (b.dur - b.t) / 0.5);
    const x = W / 2;
    const y = PRESENCE_Y + (reduced?.matches ? 0 : Math.sin(run.t * 2) * 3) - (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = Math.max(0, enter);
    const halo = ctx.createRadialGradient(x, y, 10, x, y, 64);
    halo.addColorStop(0, 'rgba(255, 210, 120, 0.55)');
    halo.addColorStop(1, 'rgba(255, 210, 120, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, 64, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9e2d4';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 40, 8, 0, 0, Math.PI * 2); ctx.fill();          // his own plate
    const crust = ctx.createLinearGradient(0, y - 22, 0, y + 14);
    crust.addColorStop(0, '#f1bd6a');
    crust.addColorStop(1, '#b06a2a');
    ctx.fillStyle = crust;
    ctx.beginPath(); ctx.ellipse(x, y, 34, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(110, 50, 14, 0.55)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i += 1) { ctx.beginPath(); ctx.moveTo(x + i * 8 - 3, y - 12); ctx.lineTo(x + i * 8 + 3, y + 8); ctx.stroke(); }
    ctx.fillStyle = '#2a160a';                                                                  // a face: delighted with itself
    ctx.beginPath(); ctx.arc(x - 10, y - 4, 2.6, 0, Math.PI * 2); ctx.arc(x + 10, y - 4, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a160a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 1, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (!reduced?.matches) {                                                                    // steam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 12, y - 20);
        ctx.quadraticCurveTo(x + i * 12 + Math.sin(run.t * 3 + i) * 5, y - 32, x + i * 12, y - 42);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* Mr. BaneWAP: banker's crust, a monocle, a hollow paper crown; theatrical about it. */
  const drawBaneWAP = () => {
    const b = run?.bane;
    if (!b) return;
    const enter = Math.min(1, b.t / 0.5, (b.dur - b.t) / 0.5);
    const x = W / 2 + (reduced?.matches ? 0 : Math.sin(run.t * 7) * 2);
    const y = PRESENCE_Y - (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = Math.max(0, enter);
    ctx.fillStyle = 'rgba(80, 20, 30, 0.28)';
    ctx.beginPath(); ctx.arc(x, y, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9d2c4';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 38, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Made of baneberries: the more he has been brought, the fuller he sits.
    const full = 1 + Math.min(0.25, ((b.fed || 0) + (run.baneStore || 0)) * 0.05);
    ctx.translate(x, y);
    ctx.scale(full, full);
    ctx.translate(-x, -y);
    ctx.fillStyle = '#6e5038';                                                                  // banker's crust, cracking
    ctx.beginPath(); ctx.ellipse(x, y, 32, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a1a48';                                                                  // baneberry, through the cracks
    [[-17, 1], [-14, 7], [22, 4], [18, 9], [-24, 6], [26, -2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.6, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#2e1e12';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 6); ctx.lineTo(x - 12, y + 2); ctx.lineTo(x - 16, y + 9); ctx.stroke();
    ctx.fillStyle = '#b8b2a0';                                                                  // the crown: paper, hollow, occupied
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 14); ctx.lineTo(x - 16, y - 28); ctx.lineTo(x - 8, y - 20); ctx.lineTo(x, y - 32); ctx.lineTo(x + 8, y - 20); ctx.lineTo(x + 16, y - 28); ctx.lineTo(x + 16, y - 14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.arc(x - 9, y - 4, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e2c46a';                                                                // the monocle
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x + 9, y - 4, 4.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.arc(x + 9, y - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1d22';                                                                // a moustache, twirled
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x - 10, y + 10, x - 16, y + 2); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x + 10, y + 10, x + 16, y + 2); ctx.stroke();
    ctx.restore();
    // The scheme, shown before it happens: wind streaks, or the lanes' new lease.
    const soon = b.id !== 'tax' && b.nextBeat < 0.7;
    if (b.id === 'wind' || b.id === 'relet') {
      ctx.save();
      ctx.globalAlpha = soon ? 0.9 : 0.35;
      ctx.strokeStyle = b.id === 'wind' ? mix(colors.ink, colors.paper, 0.4) : '#d6473e';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2.5;
      const ay = b.id === 'wind' ? run.y - 40 : 170;
      for (let i = 0; i < 3; i += 1) {
        const ax = W / 2 + b.dir * (i * 26 - 26);
        ctx.beginPath();
        ctx.moveTo(ax - b.dir * 10, ay - 9);
        ctx.lineTo(ax + b.dir * 4, ay);
        ctx.lineTo(ax - b.dir * 10, ay + 9);
        ctx.stroke();
      }
      ctx.font = '700 10px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.id === 'wind' ? 'RENTED WIND' : 'LANES RE-LET', W / 2, ay - 16);
      ctx.restore();
    }
  };

  const drawFlight = () => {
    if (!run) return;
    // Expanding rings (poise catches, post curves, glass chimes, deft landings).
    run.rings.forEach((ring) => {
      const k = clamp(ring.t / ring.dur, 0, 1);
      ctx.save();
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.lineWidth = Math.max(1, 2.4 * (1 - k));
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r0 + (ring.r1 - ring.r0) * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    // Slice wake trails.
    run.trails.forEach((dot) => {
      const k = clamp(1 - dot.t * 2.5, 0, 1);
      ctx.save();
      ctx.fillStyle = dot.gold ? '#f2c14e' : dot.loft ? '#fbf8f0' : 'rgba(224, 169, 90, 0.75)';
      ctx.globalAlpha = k * 0.65;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.4 + k * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Mr. BoonWAP's slices: lobbed, arcing, into an eye.
    run.slices.forEach((slice) => {
      const t = Math.min(1, slice.t);
      const tx = slice.target.x;
      const ty = slice.target.y - 10;
      const x = slice.x0 + (tx - slice.x0) * t;
      const y = slice.y0 + (ty - slice.y0) * t - Math.sin(t * Math.PI) * 50;
      drawWedge(x, y, t * 8);
    });
    // The carrier's throws: straight up the lane, or banked.
    run.throws.forEach((shot) => {
      const lofted = shot.loft > 0;
      if (lofted) {
        // Up off a ramp: a shadow below, the slice a size larger above it.
        ctx.fillStyle = 'rgba(20, 16, 10, 0.2)';
        ctx.beginPath(); ctx.ellipse(shot.x, shot.y + 14, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      if (lofted) {
        ctx.translate(shot.x, shot.y);
        ctx.scale(1.35, 1.35);
        ctx.translate(-shot.x, -shot.y);
      }
      if (shot.echo) ctx.globalAlpha = 0.6;
      const isGold = shot.bounces > 0 || shot.ramped.size > 0 || shot.curved || shot.poised;
      drawWedge(shot.x, shot.y - (lofted ? 6 : 0), Math.atan2(shot.vx, -shot.vy) + shot.t * 10, isGold, shot.missing, shot.size || 1);
      ctx.restore();
    });
    // Flour, everywhere.
    run.puffs.forEach((puff) => {
      ctx.fillStyle = `rgba(250, 246, 236, ${Math.max(0, 0.85 - puff.t * 0.8)})`;
      ctx.beginPath(); ctx.arc(puff.x, puff.y, 4 + puff.t * 6, 0, Math.PI * 2); ctx.fill();
    });
    // Tags: TAX, PERFECT, FOILED.
    run.tags.forEach((tag) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - tag.t);
      ctx.fillStyle = tag.text === 'TAX' || tag.hurt ? '#c0392b' : '#b8860b';
      ctx.font = '800 11px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tag.text, tag.x, tag.y - tag.t * 20);
      ctx.restore();
    });
  };

  function drawWedge(x, y, spin, gold = false, missing = null, size = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.scale(size, size);
    ctx.fillStyle = missing === 'crust' || missing === 'everything' ? 'rgba(224, 169, 90, 0.25)' : '#e0a95a';
    ctx.strokeStyle = gold ? '#f2c14e' : '#8a4a1a';
    ctx.lineWidth = gold ? 2 : 1;
    if (missing) ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    if (missing !== 'filling' && missing !== 'everything') {
      ctx.fillStyle = colors.berry;
      ctx.fillRect(-6, 3, 12, 2.5);
    }
    ctx.restore();
  }

  const drawBoof = () => {
    const b = run?.boof;
    if (!b) return;
    const facing = b.vx > 0 ? 1 : -1;
    const trot = Math.sin(run.t * 12) * 2;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(facing, 1);
    ctx.fillStyle = '#c98a4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, -8, 8, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a5e2c';
    ctx.beginPath();
    ctx.ellipse(14, -14, 3, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-14, 6, 4, 8 + trot);
    ctx.fillRect(10, 6, 4, 8 - trot);
    ctx.beginPath();
    ctx.moveTo(-17, -3);
    ctx.quadraticCurveTo(-28, -14 + trot, -24, -18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c98a4a';
    ctx.stroke();
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.arc(22, -9, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (b.touched && run.steadied > 0) {
      ctx.fillStyle = colors.ink;
      ctx.globalAlpha = Math.min(1, run.steadied);
      ctx.font = 'italic 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('steadied', run.x, run.y - 100);
      ctx.globalAlpha = 1;
    }
  };

  /* The figure: one circle, one rectangle, four lines, two dots. Always ink. */
  const drawFigure = () => {
    const x = run ? run.x : laneX(2);
    const lift = run ? jumpLift() : 0;
    const y = (run ? run.y : PLAYER_Y) - lift;
    if (lift > 0) {
      // The ground stays where it was: a shadow under the hop.
      ctx.save();
      ctx.fillStyle = 'rgba(20, 16, 10, 0.2)';
      ctx.beginPath(); ctx.ellipse(x, y + lift + 16, 14 - lift * 0.2, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const ink = colors.ink;
    const stride = state === 'running' && !reduced?.matches ? Math.sin((run?.t || 0) * 10) * 5 : 0;
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    // A step is a line segment and a corner tick (∟): the ghost of where he was, for a moment.
    if (run && run.moveT < 1) {
      ctx.globalAlpha = 0.35 * (1 - run.moveT);
      const s = Math.sign(x - run.from) || 1;
      ctx.beginPath();
      ctx.moveTo(run.from, y + 6);
      ctx.lineTo(run.from, y + 10);
      ctx.lineTo(x, y + 10);
      ctx.moveTo(run.from + s * 4, y + 6);
      ctx.lineTo(run.from + s * 4, y + 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (run && run.moveYT < 1) {
      ctx.globalAlpha = 0.35 * (1 - run.moveYT);
      ctx.beginPath();
      ctx.moveTo(x - 10, run.fromY + 10);
      ctx.lineTo(x - 14, run.fromY + 10);
      ctx.lineTo(x - 14, y + 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Something warm, passed close: a glow that holds, once.
    if (run && (run.warm > 0 || run.shield)) {
      const g = ctx.createRadialGradient(x, y - 22, 6, x, y - 22, 46);
      g.addColorStop(0, `rgba(255, 186, 96, ${run.warm > 0 ? 0.32 : 0.16})`);
      g.addColorStop(1, 'rgba(255, 186, 96, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y - 22, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ink;
    }
    // Unkept: drawn faint, as if nobody were keeping the drawing.
    if (run?.unkept > 0) ctx.globalAlpha = 0.45 + Math.sin(run.t * 14) * 0.1;
    else if (run?.hurtT > 0) ctx.globalAlpha = Math.sin(run.t * 30) > 0 ? 1 : 0.35;
    const who = run?.carrier?.id || 'figure';
    const plainLines = (alpha) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.beginPath();
      ctx.arc(x, y - 44, 9, 0, Math.PI * 2);          // head
      ctx.stroke();
      ctx.strokeRect(x - 8, y - 33, 16, 26);             // body
      ctx.beginPath();                                     // legs
      ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 6 - stride, y + 16);
      ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 6 + stride, y + 16);
      ctx.stroke();
      ctx.beginPath();                                     // eyes, when the drawing remembers them
      ctx.arc(x - 3, y - 45, 1.3, 0, Math.PI * 2);
      ctx.arc(x + 3, y - 45, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const bodyOf = (id, alpha) => {
      if (id === 'figure') plainLines(alpha);
      else {
        ctx.save();
        ctx.globalAlpha *= alpha;
        drawBody(id, x, y, stride);
        ctx.restore();
      }
    };
    // When the hat moves on, the one who was under it fades and the next comes up; the hat stays.
    const swapping = run?.prevCarrier && run.swapT < 1;
    if (swapping) bodyOf(run.prevCarrier.id, 1 - run.swapT);
    bodyOf(who, swapping ? run.swapT : 1);
    if (who !== 'figure') {
      ctx.strokeStyle = who === 'clown' ? '#d6473e' : '#3a2a20';
      ctx.fillStyle = ctx.strokeStyle;
    }
    const spilled = run?.spill;
    const tilt = run && !spilled ? Math.sin(run.phase) * run.wobble * 0.38 + (run.dir || 0) * run.wobble * 0.12 : 0;
    // Arms: two lines from the shoulders, down and out to the plate's rim.
    // From Chapter 14 onward, the figure's right arm is slightly shorter, warm at the tip like a small torch.
    const px = x;
    const py = y - 18;
    const shortArm = who === 'figure' && run && run.chapter >= 14;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 30); ctx.lineTo(px - 18, py + 2);
    ctx.moveTo(x + 8, y - 30); ctx.lineTo(shortArm ? px + 15 : px + 18, shortArm ? py - 1 : py + 2);
    ctx.stroke();
    if (shortArm && !spilled) {
      ctx.save();
      ctx.fillStyle = '#f2a950';
      ctx.beginPath();
      ctx.arc(px + 15, py - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    if (!spilled) drawPie(px, py, tilt);
    if (run?.floured > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, run.floured * 0.4);
      ctx.fillStyle = '#fbf8f0';
      ctx.beginPath(); ctx.ellipse(x, y - 24, 16, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawHat();
  };

  /* The others the hat settles on: drawn in their materials, unlike him. */
  function drawBody(who, x, y, stride) {
    ctx.save();
    const legs = (color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 5 - stride, y + 16);
      ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 5 + stride, y + 16);
      ctx.stroke();
    };
    const head = (skin) => {
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(x, y - 44, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath(); ctx.arc(x - 3, y - 45, 1.2, 0, Math.PI * 2); ctx.arc(x + 3, y - 45, 1.2, 0, Math.PI * 2); ctx.fill();
    };
    if (who === 'porter') {
      legs('#4a3426');
      ctx.fillStyle = '#7a5236';
      ctx.beginPath(); ctx.roundRect(x - 13, y - 35, 26, 30, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';   // flour, from the sacks he carried in
      [[-6, -28], [5, -22], [-2, -14], [7, -31]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2); ctx.fill(); });
      head('#d9a679');
    } else if (who === 'clerk') {
      legs('#1d2a3a');
      ctx.fillStyle = colors.night;
      ctx.beginPath(); ctx.roundRect(x - 8, y - 34, 16, 28, 5); ctx.fill();
      ctx.fillStyle = '#f7f1e2';
      ctx.fillRect(x + 3, y - 31, 5, 8);              // a slip in the pocket
      head('#e8c4a0');
    } else if (who === 'genie') {
      // Off-season: neat as a handkerchief, dressed like a clerk, no feet to speak of.
      ctx.fillStyle = '#c9ccd2';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 34);
      ctx.lineTo(x + 10, y - 34);
      ctx.quadraticCurveTo(x + 9, y, x + 2 + Math.sin((run?.t || 0) * 3) * 4, y + 14);
      ctx.quadraticCurveTo(x - 6, y, x - 10, y - 34);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(x - 7, y - 30); ctx.lineTo(x - 2, y - 30); ctx.lineTo(x - 4.5, y - 26); ctx.fill();
      head('#b9d4e8');
    } else if (who === 'clown') {
      legs('#3a6ab0');
      ctx.fillStyle = '#e8c34a';
      ctx.beginPath(); ctx.roundRect(x - 11, y - 34, 22, 28, 8); ctx.fill();
      ctx.fillStyle = '#d6473e';
      [[-5, -28], [5, -20], [-3, -13]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#e0582e';
      ctx.beginPath(); ctx.arc(x - 9, y - 47, 5, 0, Math.PI * 2); ctx.arc(x + 9, y - 47, 5, 0, Math.PI * 2); ctx.fill();
      head('#fbf6ee');
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(x, y - 43, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  const drawPie = (x, y, tilt, alpha = 1) => {
    // The aura that keeps it whole: a warm glow, as strong as the aura is full.
    const strength = run ? Math.min(run.aura, run.filling) : 0;
    if (run && !run.spill && alpha === 1 && strength > 0.02) {
      ctx.save();
      const glow = ctx.createRadialGradient(x, y, 6, x, y, 34);
      glow.addColorStop(0, `rgba(255, 214, 120, ${0.15 + strength * 0.45})`);
      glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
      if (poised()) {
        ctx.strokeStyle = 'rgba(226, 178, 74, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.ellipse(x, y + 2, 26, 8, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(tilt);
    // The pie in hand swells with the aura: a rich one rides high on the plate.
    const swell = run && !run.spill ? 0.85 + richness() * 0.4 : 1;
    ctx.scale(swell, swell);
    ctx.fillStyle = '#e9e2d4';
    ctx.beginPath();
    ctx.ellipse(0, 3, 21, 5, 0, 0, Math.PI * 2);   // the plate
    ctx.fill();
    const crust = ctx.createLinearGradient(0, -8, 0, 4);
    crust.addColorStop(0, '#e0a95a');
    crust.addColorStop(1, '#a8652a');
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.ellipse(0, -1, 17, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Scalloped crust flutes around the rim when crust is healthy.
    if (!run || run.crust >= SLICE_COST) {
      ctx.fillStyle = '#ecc074';
      for (let i = -5; i <= 5; i += 1) {
        const a = (i / 5) * Math.PI * 0.85;
        ctx.beginPath();
        ctx.arc(Math.sin(a) * 15.5, -1 + Math.cos(a) * 4.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Vent slits showing berry filling underneath.
    ctx.strokeStyle = run && run.filling >= SLICE_COST ? colors.berry : 'rgba(90, 40, 10, 0.5)';
    ctx.lineWidth = 0.95;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 2, -5);
      ctx.lineTo(i * 5 + 2, 2);
      ctx.stroke();
    }
    // Warm steam wisps rising from a rich or warm pie.
    if (!reduced?.matches && run && !run.spill && (richness() >= 0.72 || run.warm > 0)) {
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.55)';
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i += 2) {
        const wisp = Math.sin(run.t * 3.2 + i) * 2.5;
        ctx.beginPath();
        ctx.moveTo(i * 5, -7);
        ctx.quadraticCurveTo(i * 5 + wisp, -13, i * 5 - wisp * 0.5, -18);
        ctx.stroke();
      }
    }
    // Directional lean bead on the plate rim when wobbling.
    if (run && Math.abs(run.tiltDir) > 0.25 && run.wobble > 0.2 && !run.spill) {
      ctx.fillStyle = run.wobble > 0.65 ? colors.berry : '#e2b24a';
      ctx.beginPath();
      ctx.ellipse(Math.sign(run.tiltDir) * 16, 1, 2.8, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (run && run.wobble > 0.7 && !run.spill) {
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.ellipse(Math.sign(tilt || 1) * 16, 1, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawHat = () => {
    const hat = run ? run.hat : { x: laneX(2), y: PLAYER_Y - 64 };
    ctx.save();
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.ellipse(hat.x, hat.y + 6, 13, 3, 0, 0, Math.PI * 2);   // brim
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hat.x, hat.y, 8, 7, 0, Math.PI, 0);             // crown
    ctx.rect(hat.x - 8, hat.y, 16, 6);
    ctx.fill();
    ctx.restore();
  };

  const drawSpill = () => {
    const s = run?.spill;
    if (!s) return;
    const t = Math.min(1, s.t / 0.9);
    if (s.selfWap) {
      const k = Math.min(1, t * 2.4);
      drawPie(s.x, s.y - 26 * k, 0, 1 - Math.max(0, t - 0.5) * 2);
      return;
    }
    const x = s.x + s.dir * t * 38;
    const y = s.y + t * t * 60;
    drawPie(x, y, s.dir * t * 2.6, 1 - Math.max(0, t - 0.85) * 4);
    if (t > 0.7) {
      ctx.fillStyle = colors.berry;
      ctx.globalAlpha = Math.min(1, (t - 0.7) * 4);
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 16, y + 12 + Math.sin(a) * 5, 5, 2.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  /* Flour in the air: a pale haze and drifting motes, thicker the more there is; the pies glow in it. */
  const drawDust = () => {
    if (!run || run.dust < 0.02) return;
    ctx.save();
    ctx.fillStyle = `rgba(250, 246, 236, ${run.dust * 0.2})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255, 253, 246, ${0.35 + run.dust * 0.5})`;
    const drift = reduced?.matches ? 0 : run.t;
    for (let i = 0; i < Math.round(run.dust * 36); i += 1) {
      const mx = (i * 97 + Math.sin(drift * 0.7 + i) * 24 + drift * 9) % W;
      const my = (i * 61 + drift * (14 + (i % 5) * 4)) % H;
      ctx.beginPath(); ctx.arc((mx + W) % W, my, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    if (run.boon || run.bane) {
      const g = ctx.createRadialGradient(W / 2, PRESENCE_Y, 10, W / 2, PRESENCE_Y, 70);
      g.addColorStop(0, `rgba(255, 244, 214, ${run.dust * 0.32})`);
      g.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(W / 2, PRESENCE_Y, 70, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  /* A section break in the words, drawn across the lanes: a breath. */
  const drawRules = () => {
    if (!run?.rules.length) return;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = colors.gold;
    ctx.fillStyle = colors.gold;
    ctx.lineWidth = 1.5;
    ctx.font = '700 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    run.rules.forEach((rule) => {
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(8, rule.y); ctx.lineTo(W / 2 - 14, rule.y);
      ctx.moveTo(W / 2 + 14, rule.y); ctx.lineTo(W - 8, rule.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('§', W / 2, rule.y + 1);
    });
    ctx.restore();
  };

  const drawRain = () => {
    if (!run?.drops.length) return;
    ctx.strokeStyle = mix(colors.accent, colors.paper, 0.4);
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.beginPath();
    run.drops.forEach((drop) => {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + 12);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  /* The HUD: plain pills, readable on any binding; and the track of the story. */
  const pill = (text, x, y, align, color = colors.ink) => {
    ctx.font = '700 12px "JetBrainsMono", ui-monospace, monospace';
    const w = ctx.measureText(text).width + 14;
    const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    ctx.fillStyle = mix(colors.paper, 'rgb(255, 255, 255)', 0.3).replace('rgb(', 'rgba(').replace(')', ', 0.86)');
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.75);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, y - 12, w, 19, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + 7, y - 2);
    ctx.textBaseline = 'alphabetic';
  };

  const drawHud = () => {
    if (!run) return;
    pill(`${cobbles()} cobbles`, 8, 20, 'left');
    pill(`best ${Math.max(record.best, 0)}`, W - 8, 20, 'right', colors.muted);
    if (run.waps) pill(`WAP ×${run.waps}`, W / 2, 20, 'center', '#c0392b');
    // The book so far: a dot a chapter, this one filling; flour pushes it back.
    const n = TOTAL_CHAPTERS;
    const span = 236;
    const x0 = W / 2 - span / 2;
    const y = 42;
    const at = run.chapter - 1;
    const step = span / (n - 1);
    ctx.save();
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + span, y); ctx.stroke();
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + step * Math.min(n - 1, at + progress()), y); ctx.stroke();
    for (let i = 0; i < n; i += 1) {
      ctx.fillStyle = i < at ? colors.gold : i === at ? colors.ink : mix(colors.ink, colors.paper, 0.6);
      ctx.beginPath(); ctx.arc(x0 + step * i, y, i === at ? 4.5 : 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.ink;
    ctx.fillText(`${run.chapter}${run.lap ? ` · lap ${run.lap + 1}` : ''}`, x0 + step * at, y + 15);
    ctx.restore();
    // What the land has given, while it lasts.
    const gifts = [
      poised() && 'poised',
      run.lit > 0 && `lit ${Math.ceil(run.lit)}`,
      run.echoes > 0 && `echoes ${Math.ceil(run.echoes)}`,
      run.lag > 0 && `slow ${Math.ceil(run.lag)}`,
      run.unkept > 0 && `unkept ${Math.ceil(run.unkept)}`,
      run.trueAim > 0 && `true aim ${Math.ceil(run.trueAim)}`,
      run.glimpse > 0 && 'a glimpse',
      run.row > 0 && TUNE.ahead_bonus > 0 && `ahead ×${(1 + run.row * TUNE.ahead_bonus).toFixed(2)}`,
      run.fed > 0 && `fed ${Math.ceil(run.fed)}`,
      run.frill > 0 && `soft ×${run.frill}`,
      run.tin > 0 && `half again ×${run.tin}`,
      run.dust > 0.25 && 'flour in the air',
      (run.warm > 0 || run.shield) && 'warm'
    ].filter(Boolean);
    if (gifts.length) pill(gifts.join(' · '), W / 2, 76, 'center', colors.accent);
    // The contest with Mimes Against WAP, once they are in this chapter.
    if (run.tally?.mawSeen) pill(`pie ${Math.round(run.tally.wap)} · mimes ${Math.round(run.tally.maw)}`, 8, 62, 'left', mawAhead() ? '#7a3f9a' : colors.accent);
    // The next slice: a small ring that fills.
    ctx.save();
    ctx.strokeStyle = run.sliceReady >= 1 ? colors.gold : mix(colors.ink, colors.paper, 0.6);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(run.x + 30, run.y - 18, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * run.sliceReady);
    ctx.stroke();
    // And the tilt: a ring on the other side, gold to red as it fills. Full, it spills.
    const tilt = clamp(run.wobble, 0, 1);
    if (tilt > 0.04) {
      ctx.strokeStyle = mix('rgb(226, 170, 60)', 'rgb(200, 50, 36)', tilt);
      ctx.lineWidth = tilt > 0.75 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(run.x - 30, run.y - 18, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tilt);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* A baneberry's foretelling, posted at the top of its lane until it comes (or a sweetened one's, in amber). */
  const drawForetold = () => {
    if (!run?.prophecies.length) return;
    ctx.save();
    run.prophecies.forEach((p) => {
      const x = laneX(p.lane);
      const k = clamp(p.t / p.dur, 0, 1);
      const ink = p.kindly ? 'rgba(214, 150, 52, 0.95)' : 'rgba(96, 48, 128, 0.95)';
      ctx.globalAlpha = 0.25 + (1 - k) * 0.25;
      ctx.fillStyle = p.kindly ? 'rgba(244, 178, 92, 0.18)' : 'rgba(96, 48, 128, 0.16)';
      ctx.fillRect(x - LANE_W / 2 + 3, 0, LANE_W - 6, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.kindly ? 'rgba(255, 246, 228, 0.95)' : 'rgba(34, 20, 44, 0.92)';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x - LANE_W / 2 + 4, 26, LANE_W - 8, 30, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.kindly ? '#6a4416' : '#e9dcf2';
      ctx.font = '700 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      const words = FORETOLD[p.what].split(' ');
      const half = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0, half).join(' '), x, 38);
      ctx.fillText(words.slice(half).join(' '), x, 48);
      // The countdown: a ring that closes as it comes due.
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, 64, 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
    });
    ctx.restore();
  };

  /* While a gift lasts, its giver keeps the carrier company, doing its job in the book. */
  const drawEscorts = () => {
    if (!run || state !== 'running') return;
    const t = run.t;
    const still = reduced?.matches;
    ctx.save();
    // Echo-wrens on the rim of the pie, one for each echo left.
    for (let i = 0; i < (run.echoes || 0); i += 1) {
      const wx = run.x - 14 + i * 9;
      const wy = run.y - 44 + (still ? 0 : Math.sin(t * 6 + i) * 1.2);
      ctx.fillStyle = '#7a5a3c';
      ctx.beginPath(); ctx.ellipse(wx, wy, 3.4, 2.4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(wx + 2.5, wy - 1); ctx.lineTo(wx + 5.5, wy - 3.5); ctx.lineTo(wx + 3, wy + 0.5); ctx.fill();
    }
    // The lag-stag: hoofprints pressing into the lanes a beat after nothing passed.
    if (run.lag > 0) {
      ctx.fillStyle = mix(colors.ink, colors.paper, 0.55);
      ctx.globalAlpha = Math.min(1, run.lag) * 0.5;
      for (let i = 0; i < 4; i += 1) {
        const py = ((t * 26 + i * 44) % 180) + run.y - 120;
        const px = run.x + (i % 2 ? 22 : 30);
        ctx.beginPath(); ctx.ellipse(px - 2, py, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.ellipse(px + 2, py, 1.6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // Unkept: a pale fox or a boot-high deer, running beside, late for something.
    if (run.unkept > 0) {
      const bx = run.x - 30;
      const by = run.y - 6 + (still ? 0 : Math.abs(Math.sin(t * 9)) * -4);
      ctx.globalAlpha = Math.min(1, run.unkept) * 0.8;
      ctx.fillStyle = '#efe6d2';
      ctx.strokeStyle = mix(colors.ink, colors.paper, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(bx, by, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + 6, by - 2); ctx.lineTo(bx + 11, by - 7); ctx.lineTo(bx + 12, by - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Remainder-moths: round the needle's tip like a flame, never landing twice in the same place.
    if (run.trueAim > 0) {
      const from = throwFrom();
      const tipX = from.x + Math.sin(run.aim.a) * 46;
      const tipY = from.y - Math.cos(run.aim.a) * 46;
      ctx.fillStyle = 'rgba(232, 222, 196, 0.9)';
      for (let i = 0; i < 3; i += 1) {
        const a = (still ? 0 : t * (2.1 + i * 0.37)) + i * 2.1;
        const r = 7 + i * 2;
        ctx.beginPath(); ctx.ellipse(tipX + Math.cos(a) * r, tipY + Math.sin(a) * r * 0.6, 2.4, 1.4, a, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Frill-lichen: a grey-green ruffle at the carrier's feet, one fold for each soft knock left.
    if (run.frill > 0) {
      ctx.strokeStyle = 'rgba(122, 146, 112, 0.85)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < run.frill; i += 1) {
        ctx.beginPath();
        for (let k = 0; k <= 12; k += 1) {
          const a = Math.PI + (k / 12) * Math.PI;
          const r = 14 + i * 4 + Math.sin(k * 2.2) * 1.6;
          const px = run.x + Math.cos(a) * r;
          const py = run.y + 6 - Math.sin(a) * r * 0.25;
          if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
    }
    // Fed: a boneberry's warmth low around the feet.
    if (run.fed > 0) {
      const g = ctx.createRadialGradient(run.x, run.y + 4, 2, run.x, run.y + 4, 22);
      g.addColorStop(0, `rgba(201, 169, 154, ${Math.min(1, run.fed) * 0.35})`);
      g.addColorStop(1, 'rgba(201, 169, 154, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(run.x, run.y + 4, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  function draw() {
    if (!canvas.width) return;
    ctx.save();
    // A knock shakes the screen a little (not under reduced motion; the red edge says it instead).
    if (run?.shake > 0 && !reduced?.matches && !record.view.zen) ctx.translate(rand(-4, 4) * run.shake * 3.5, rand(-3, 3) * run.shake * 3.5);
    // A punch: the whole view leans in a little at an impact, and springs back.
    if (run?.punch > 0 && !reduced?.matches && !record.view.zen) {
      const k = 1 + run.punch * 0.04;
      ctx.translate(run.x, run.y - 40);
      ctx.scale(k, k);
      ctx.translate(-run.x, -(run.y - 40));
    }
    drawScene();
    drawRules();
    drawBoonWAP();
    drawBaneWAP();
    run?.things.forEach(drawThing);
    drawForetold();
    drawAim();
    drawEscorts();
    drawBoof();
    drawFigure();
    drawFlight();
    drawSpill();
    drawBursts();
    drawWhimsy();
    drawRain();
    drawDust();
    if (run?.lag > 0) {
      // The land at a beaver's pace: a cool hush over everything but the carrier's own time.
      ctx.fillStyle = `rgba(70, 120, 160, ${Math.min(1, run.lag) * 0.08})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    if (run?.hurtT > 0 && !record.view.zen) {
      const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.62);
      edge.addColorStop(0, 'rgba(200, 50, 36, 0)');
      edge.addColorStop(1, `rgba(200, 50, 36, ${0.32 * Math.min(1, run.hurtT / 0.9)})`);
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, W, H);
    }
    drawHud();
  }

  let paintPadHook = () => {};   // the thumbs' pad (set once the pad is built, further down)
  function loop() {
    cancelAnimationFrame(frame);
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state === 'running' || state === 'spilling') update(dt);
      draw();
      paintPadHook();
      if (state !== 'paused' && state !== 'title' && state !== 'over' && state !== 'revealing') frame = requestAnimationFrame(tick);
      else if (state === 'over') draw();
    };
    frame = requestAnimationFrame(tick);
  }

  const pause = () => {
    if (state !== 'running') return;
    state = 'paused';
    showCard('A pause.', 'The pie is held very still. The city waits, politely.', 'Carry on');
    const home = returnAnchor();
    if (home) cardLinks?.replaceChildren(home);
    say('Paused.');
  };
  const resume = () => {
    if (state !== 'paused') return;
    hideCard();
    state = 'running';
    last = performance.now();
    loop();
  };

  /* ─── The legend: every thing in the game, drawn by the game's own hand ─── */
  const SPRITES = {
    post: { scale: 1.5 }, snail: { scale: 1.7 }, spool: { scale: 1.7 }, pigeon: { scale: 1.6 }, clerk: { scale: 1.4 },
    wasps: { scale: 1.5 }, chair: { scale: 1.5 }, throne: { scale: 1.3 }, subject: { scale: 1.4 }, sack: { scale: 1.1 },
    puddle: { scale: 1 }, pile: { scale: 1.2 }, beaver: { scale: 1.4 }, baneberry: { scale: 1.9 }, berry: { scale: 2 }, clown: { scale: 1.4 }, switch: { scale: 1.5 }, dividers: { scale: 0.42 }, table: { scale: 0.18 }, banner: { scale: 0.18 },
    stone: { scale: 1.5 }, hole: { scale: 1.4 }, mime: { scale: 1.4 }, mimewall: { scale: 1.1 }, march: { scale: 0.18 }, ditch: { scale: 0.18 }, pane: { scale: 1.4 }, frost: { scale: 1.1 }, furrow: { scale: 1 }, egg: { scale: 1.3 }, wonder: { scale: 1.6 }
  };
  function drawSprite(target, kind, size = 64) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    target.width = size * ratio;
    target.height = size * ratio;
    const c = target.getContext('2d');
    const saved = { ctx, run, state };
    ctx = c;
    run = fresh(carrierById(kind.replace('carrier-', '')));
    run.t = 0.6;
    state = 'title';
    try {
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      c.clearRect(0, 0, size, size);
      const at = (x, y, k) => { c.translate(size / 2 - x * k, size / 2 - y * k); c.scale(k, k); };
      if (kind.startsWith('carrier-')) {
        at(run.x, PLAYER_Y - 26, 0.62);
        drawFigure();
      } else if (kind === 'boon') {
        run.boon = { t: 1, dur: 9 };
        at(W / 2, PRESENCE_Y - 4, 0.72);
        drawBoonWAP();
      } else if (kind === 'bane') {
        run.bane = { t: 1, dur: 9, id: 'tax', nextBeat: 9 };
        at(W / 2, PRESENCE_Y - 6, 0.72);
        drawBaneWAP();
      } else if (kind === 'boof') {
        run.boof = { x: 180, y: 300, vx: 70, touched: false };
        at(186, 296, 1.25);
        drawBoof();
      } else {
        const thing = makeThing(kind, 2);
        thing.y = 300;
        if (kind === 'wonder') thing.wonder = { kind: 'creature', name: '' };
        if (kind === 'dividers') {
          thing.lanes = [1, 2];
          thing.x = (laneX(1) + laneX(2)) / 2;
          thing.w = LANE_W * 2 - 14;
          thing.h = 22;
        }
        if (WIDE.has(kind)) {
          thing.gap = 2;
          thing.x = W / 2;
          thing.w = W;
          thing.h = kind === 'table' ? 34 : kind === 'march' ? 30 : kind === 'ditch' ? 20 : 18;
          if (kind === 'ditch') thing.gap = -1;
          if (kind === 'march') thing.y = 320;
        }
        at(thing.x, thing.y, SPRITES[kind]?.scale || 1.4);
        drawThing(thing);
      }
    } finally {
      ctx = saved.ctx;
      run = saved.run;
      state = saved.state;
    }
  }
  const paintLegend = () => {
    document.querySelectorAll('canvas[data-pie-sprite]').forEach((target) => drawSprite(target, target.dataset.pieSprite));
  };
  // A browser may drop a canvas's drawing while the tab is away; draw the sprites again when it gives it back.
  document.querySelectorAll('canvas[data-pie-sprite]').forEach((target) => target.addEventListener('contextrestored', () => drawSprite(target, target.dataset.pieSprite)));
  // The index's link to the asset sheet opens it.
  document.querySelectorAll('a[href="#pie-assets"]').forEach((link) => link.addEventListener('click', () => {
    const sheet = document.getElementById('pie-assets');
    if (sheet && !sheet.open) sheet.open = true;
  }));

  /* The shelf of what the pies let slip: said, unsaid, and how to unlock the rest. */
  function paintLore() {
    if (!loreOut || !lore) return;
    const found = discoveries(record);
    const said = lore.lines.filter((line) => record.lore.includes(line.id)).length;
    const count = loreOut.querySelector('[data-pie-lore-count]');
    if (count) count.textContent = `${said} of ${lore.lines.length} lines let slip.`;
    ['boon', 'bane'].forEach((speaker) => {
      const list = loreOut.querySelector(`[data-pie-lore-list="${speaker}"]`);
      if (!list) return;
      list.replaceChildren(...lore.lines.filter((line) => line.speaker === speaker).map((line) => {
        const li = document.createElement('li');
        if (record.lore.includes(line.id)) {
          // Grounded in a chapter the mimes hold, a line's pie words are quiet here too.
          const hushed = line.ground && mimesHold(line.ground.chapter);
          li.className = `pie-lore-line is-said${hushed ? ' is-mimed' : ''}`;
          const quote = document.createElement('q');
          if (hushed) quote.append(...pieParts(line.line));
          else quote.textContent = line.line;
          li.append(quote);
          if (line.ground) {
            const a = document.createElement('a');
            const base = `/book/chapter/${String(line.ground.chapter).padStart(2, '0')}/`;
            a.href = line.ground.anchor ? `${base}#${line.ground.anchor}` : base;
            a.className = 'pie-lore-ground';
            a.textContent = `${line.ground.label}, ${chapterWords(line.ground.chapter)} →`;
            li.append(a);
          }
        } else if (isUnlocked(line, found)) {
          li.className = 'pie-lore-line is-ready';
          li.textContent = speaker === 'boon' ? 'Ready to be said, next time he holds court.' : 'Ready to slip out, next time he is foiled.';
        } else {
          li.className = 'pie-lore-line is-locked';
          li.textContent = line.hint || 'Not yet.';
        }
        return li;
      }));
    });
  }

  /* ─── Cards: everyone and everything in the lanes, turned at first meeting (pie-cards.mjs) ───
   * Story on and Zen off: a new card pauses the carry; Introductions (from the beginning) pauses on
   * every first meeting of the carry. Zen turns cards silently. Each card can carry a QA note. */
  const voyage = root.closest('.pie-voyage');
  const introOut = root.querySelector('[data-pie-intro]');
  const cardModes = card.querySelector('[data-pie-card-modes]');
  const deckOut = document.querySelector('[data-pie-deck]');
  const assetsOut = document.querySelector('[data-pie-assets]');
  const qaAll = (() => { try { return new URLSearchParams(location.search).has('qa'); } catch { return false; } })();
  /* ?design: a card's sections laid bare for a design table, each named and noted in Spw. */
  const designMode = (() => { try { return new URLSearchParams(location.search).has('design'); } catch { return false; } })();
  const CARD_SECTIONS = Object.freeze([
    ['pie-cardface-type', 'kind'], ['pie-cardface-sprite', 'sprite'], ['pie-cardface-name', 'name'], ['pie-cardface-story', 'story'],
    ['pie-cardface-lanes', 'lanes'], ['pie-cardface-chips', 'chips'], ['pie-cardface-book', 'book'], ['pie-cardface-spell', 'spell'],
    ['pie-cardface-moment', 'moment'], ['pie-cardface-qa', 'qa']
  ]);
  /** Name each section of a card and give it a note a design table can copy, fill in and pass around. */
  function designable(face, kind) {
    face.classList.add('is-designable');
    CARD_SECTIONS.forEach(([cls, name]) => {
      const part = face.querySelector(`:scope > .${cls}`);
      if (!part) return;
      part.classList.add('is-design-part');
      const tag = nodeOf('button', 'pie-design-tag', `${name} ⧉`);
      tag.type = 'button';
      tag.title = `Copy a design note for this card's ${name}`;
      tag.addEventListener('click', async () => {
        const now = (part.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160).replace(/"/g, "'");
        const note = `?design[card.${kind.replace(/-/g, '_')}.${name}]{ #now["${now}"] #note[""] @by[you] }\n#from["lore.land/pie?design#card:${kind}"]`;
        try { await navigator.clipboard.writeText(note); tag.textContent = `${name} ✓`; } catch { tag.textContent = `${name} !`; }
        setTimeout(() => { tag.textContent = `${name} ⧉`; }, 1400);
      });
      part.before(tag);
    });
  }
  const buildId = document.documentElement.dataset.cacheRelease || 'local';
  const pct = (v) => `${Math.round(v * 100)}%`;
  const round2 = (v) => Math.round(v * 100) / 100;
  const nodeOf = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };

  function momentOf() {
    if (!run) return null;
    return { chapter: run.chapter, carrier: run.carrier.id, row: run.row + 1, lane: run.lane + 1, speed: Math.round(run.speed), tilt: round2(run.wobble), crust: round2(run.aura), filling: round2(run.filling), cobbles: cobbles() };
  }
  function turnCard(kind) {
    if (!run || !CARDS[kind] || run.seenCards.has(kind)) return;
    run.seenCards.add(kind);
    const isNew = !record.cards.includes(kind);
    if (isNew) {
      record.cards.push(kind);
      writeRecord(record);
      // The site's shelf too (collection.mjs): the almanac and the chapters keep the same deck.
      shelveCard(kind, { chapter: run.chapter, how: 'lanes' });
      paintDeck();
    }
    const pause = record.view.story && !record.view.zen && (run.intro || isNew);
    if (pause) run.revealQueue.push({ kind, isNew, moment: momentOf() });
    else if (isNew) run.tags.push({ x: W / 2, y: 98, t: 0, text: `✦ CARD · ${CARDS[kind].name.toUpperCase()}` });
  }
  function chipsFor(kind) {
    const chips = [];
    const knock = KNOCKS[kind];
    if (knock) {
      chips.push(`tilt +${pct(knock.tilt)}`);
      if (knock.crust) chips.push(`− crust ${knock.crust}`);
      if (knock.filling) chips.push(`− filling ${knock.filling}`);
      if (knock.shove) chips.push('trips a lane');
      if (knock.drop) chips.push('a step back');
    }
    if (LOW.has(kind)) chips.push('⤒ a hop clears it');
    if (SLIPS.has(kind)) chips.push('slips');
    const from = INTRO[kind] || INTRO[kind.replace('carrier-', '')];
    if (from) chips.push(`in the lanes from Chapter ${from}`);
    return chips;
  }
  function qaNote(kind, feel = null, moment = null) {
    const knock = KNOCKS[kind];
    const lines = [
      '^"qa_note"{',
      `  $build[${buildId}]`,
      `  .card[${kind}]`,
      `  #feel[${feel || 'unrated'}]@tester`,
      moment ? `  %moment{ ${Object.entries(moment).map(([k, v]) => `${k}: ${v}`).join(' ')} }@game` : null,
      `  %mechanics{ ${[knock ? `tilt: ${knock.tilt}` : null, knock?.crust ? `crust: -${knock.crust}` : null, knock?.filling ? `filling: -${knock.filling}` : null, `low: ${LOW.has(kind) ? 'yes' : 'no'}`, `slip: ${SLIPS.has(kind) ? 'yes' : 'no'}`].filter(Boolean).join(' ')} }`,
      `  =view{ story: ${record.view.story ? 'on' : 'off'} zen: ${record.view.zen ? 'on' : 'off'} intro: ${run?.intro ? 'on' : 'off'} }`,
      '  #note: ""',
      '}'
    ];
    return lines.filter(Boolean).join('\n');
  }
  async function copyText(text, status) {
    try {
      await navigator.clipboard.writeText(text);
      if (status) status.textContent = 'Copied as Spw. Paste it into the thread; the numbers are the game’s own.';
    } catch {
      if (status) status.textContent = text;
    }
  }
  /** A card's face: what it is in the story, what it does in the lanes, where the book has it; and, live, the moment it was met. */
  /* A card's spell: a knock's line from !knocks{}, or the power its thing gives (pie-rules.spw). */
  const CARD_POWER = Object.freeze({ berry: 'boonberry', boneberry: 'boneberry', beaver: 'beaver', wonder: 'creature' });
  function spellFor(kind) {
    const knock = bookRules?.knockSpells?.[kind];
    if (knock) return { text: knock, kind: 'knock' };
    if (KNOCKS[kind]) {
      const k = { ...KNOCKS[kind], ...(knockRules[kind] || {}) };
      const parts = [`%tilt[${k.tilt}]`, k.crust && `%crust[${k.crust}]`, k.filling && `%filling[${k.filling}]`, k.drop && '!drop', k.tax && '!tax', k.shove && '!shove', k.label && `#says["${k.label}"]`].filter(Boolean);
      return { text: `*${kind}{ ${parts.join(' ')} }`, kind: 'knock' };
    }
    const id = CARD_POWER[kind];
    const spells = bookRules?.spells || POWER_SPELLS;
    if (id && spells[id]) return { text: spells[id], kind: 'power' };
    if (id && play.powers[id]) return { text: writePower(play.powers[id]), kind: 'power' };
    return null;
  }
  /** Who a card is, as a spell: the same shape for every card (pie-cards.mjs). */
  function identitySpell(kind) {
    const c = CARDS[kind];
    const parts = [`.type[${c.type}]`, c.chapter ? `.first[chapter_${c.chapter}]` : '.first[the_lanes]', c.sprite ? `^sprite[${c.sprite}]` : '', `#name["${String(c.name).replace(/"/g, "'")}"]`].filter(Boolean);
    return `@${kind.replace(/-/g, '_')}{ ${parts.join(' ')} }`;
  }
  /* The card interpreter: as a card turns in the lanes, its spell is read aloud, one atom at a time,
   * each atom lit and said in plain words, so what the card will do is heard before it is played. */
  function interpretCard(spellNode, context, box) {
    const atoms = [...spellNode.querySelectorAll('.spell-atom')];
    if (!atoms.length) return;
    const reading = nodeOf('ol', 'pie-cardface-reading');
    reading.setAttribute('aria-label', 'Read aloud by the lanes');
    box.append(nodeOf('span', 'pie-cardface-spell-label', 'Read aloud by the lanes'), reading);
    const explain = explainAtom(context);
    const lines = atoms.map((a) => explain(a.textContent.trim(), a.dataset.sigil, a.dataset.label) || `${a.dataset.sigil}${a.dataset.label || ''}`);
    const all = reduced?.matches;
    atoms.forEach((a, i) => {
      const show = () => {
        atoms.forEach((x) => x.classList.toggle('is-read', x === a));
        reading.append(nodeOf('li', '', lines[i]));
      };
      if (all) show(); else setTimeout(show, 260 + i * 420);
    });
    if (!all) setTimeout(() => atoms.forEach((x) => x.classList.remove('is-read')), 260 + atoms.length * 420 + 600);
  }
  /** What an atom does, in plain words, for the spell's gloss. */
  const explainAtom = (context) => (text, sigil, label) => {
    const n = Number((/\[(-?\d+(?:\.\d+)?)\]/.exec(text) || [])[1]);
    const arg = (/\[([^\]]*)\]/.exec(text) || [])[1];
    const pctText = Number.isFinite(n) ? `${Math.round(n * 100)}%` : '';
    if (context === 'knock') {
      if (label === 'tilt') return `It tilts the pie ${pctText}.`;
      if (label === 'crust' || label === 'filling') return `It takes ${pctText} of the ${label}.`;
      if (label === 'drop') return 'It drops you a step back down the lanes.';
      if (label === 'tax') return 'It taxes the next steps: they tilt more.';
      if (label === 'shove') return 'It trips you a lane over.';
    }
    if (label === 'says') return `Said under the screen: ${arg || ''}`;
    if (label === 'card') return `It turns the ${arg} card.`;
    if (label === 'sound') return `It sounds like a ${arg}.`;
    if (label === 'voice') return `Said in the ${arg} voice.`;
    if (label === 'with') return `The land answers: ${arg} comes up the lanes.`;
    if (label === 'without') return `The land answers: ${arg} ahead goes quiet.`;
    if (label && WORDS[label]) return sigil === '~' ? `For ${n} s, ${WORDS[label]}.` : sigil === '%' ? `+${pctText} ${WORDS[label]}.` : sigil === '*' ? `${WORDS[label]}, ×${n}.` : `${WORDS[label]}.`;
    if (sigil === '~' && /^"/.test(text.slice(1))) return 'Where the book has it.';
    if (label === 'type') return `It is a ${arg}.`;
    if (label === 'first') return arg === 'the_lanes' ? 'Only in the lanes, so far.' : `First met in ${String(arg).replace('_', ' ')}.`;
    if (label === 'sprite') return 'Drawn by the game itself.';
    if (label === 'name') return `Called ${arg}.`;
    if (label === 'pop') return `It says ${arg} when it lands.`;
    if (label === 'bits') return `It flings ${arg}.`;
    if (label === 'drama') return `Drama ×${n}.`;
    if (sigil === '=' && TUNE_RANGE[label]) return `Tunes ${label.replace(/_/g, ' ')}: now ${TUNE[label]}, held between ${TUNE_RANGE[label][0]} and ${TUNE_RANGE[label][1]}.`;
    if (sigil === '%' && LEAN_WORDS[label]) return `${LEAN_WORDS[label]} lean their way by ${n}.`;
    if (sigil === '$') return `Made of ${label}: it sounds and looks like it.`;
    if (sigil === '*') return `${label || 'This'}: a thing with a spell of its own.`;
    return '';
  };
  const bookLink = (path) => `/${String(path).replace(/(chapter\/\d+)(#|$)/, '$1/$2')}`;
  function sendToBench(text) {
    const area = document.querySelector('[data-pie-bench-spells]');
    if (!area) return;
    const label = (/^[!*]([a-z_]+)\{/.exec(text.trim()) || [])[1];
    const kept = label ? area.value.replace(new RegExp(`\\*${label}\\s*\\{[^{}]*\\}`, 'g'), '').trim() : area.value.trim();
    // A knock's line goes in as !knocks{ … }, so the bench reads it as a knock.
    const entry = /^\*/.test(text.trim()) && KNOCKS[label] ? `!knocks{ ${text.trim()} }` : text.trim();
    area.value = [kept, entry].filter(Boolean).join('\n');
    area.dispatchEvent(new Event('input'));
    area.closest('section')?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
    area.focus({ preventScroll: true });
  }
  function renderCard(kind, { moment = null, isNew = false, live = false, compact = false } = {}) {
    const c = CARDS[kind];
    const face = nodeOf('article', `pie-cardface type-${c.type}${compact ? ' is-compact' : ''}`);
    const sprite = document.createElement('canvas');
    sprite.className = 'pie-cardface-sprite';
    sprite.setAttribute('aria-hidden', 'true');
    drawSprite(sprite, c.sprite, compact ? 64 : 96);
    const chips = nodeOf('p', 'pie-cardface-chips');
    chipsFor(kind).forEach((chip) => chips.append(nodeOf('span', '', chip)));
    const book = nodeOf('p', 'pie-cardface-book');
    if (c.chapter) {
      const a = nodeOf('a', '', `Chapter ${chapterWords(c.chapter).replace('Chapter ', '')}`);
      a.href = `/book/chapter/${pad2(c.chapter)}/`;
      if (live) { a.target = '_blank'; a.rel = 'noopener'; }
      book.append('First in the book: ', a);
    } else {
      book.textContent = 'Only in the lanes, so far.';
    }
    face.append(
      nodeOf('p', 'pie-cardface-type', `${CARD_TYPES[c.type]}${isNew ? ' · new to your deck' : ''}`),
      sprite,
      nodeOf('h3', 'pie-cardface-name', c.name),
      (() => { const p = nodeOf('p', 'pie-cardface-story'); p.append(nodeOf('span', '', 'In the story'), ` ${c.story}`); return p; })(),
      (() => { const p = nodeOf('p', 'pie-cardface-lanes'); p.append(nodeOf('span', '', 'In the lanes'), ` ${c.lanes}`); return p; })(),
      chips,
      book);
    // Its spell: every card has one. The rule it runs on (pie-rules.spw) if it has one, else who it is,
    // written the same way; lit, playable, copyable, and changeable on the bench.
    const spell = spellFor(kind) || { text: identitySpell(kind), kind: 'identity' };
    const box = nodeOf('div', 'pie-cardface-spell');
    const rendered = renderSpell(spell.text, { explain: explainAtom(spell.kind), link: bookLink, cast: !compact && !live, label: `The spell for ${c.name}`, play: true, copy: `lore.land/pie#card:${kind}` });
    box.append(nodeOf('span', 'pie-cardface-spell-label', spell.kind === 'identity' ? 'Who it is, as a spell' : 'Its spell'), rendered);
    if (spell.kind !== 'identity') {
      const change = nodeOf('button', 'pie-cardface-change', '✎ change it on the bench');
      change.type = 'button';
      change.addEventListener('click', () => sendToBench(spell.text));
      box.append(change);
    }
    face.append(box);
    // Turned during a carry, the card is read aloud by the lanes before it plays: atom by atom.
    if (live) interpretCard(rendered, spell.kind, box);
    if (moment) {
      face.append(nodeOf('p', 'pie-cardface-moment', `Met in ${chapterWords(moment.chapter)}, under ${carrierById(moment.carrier).name}, row ${moment.row} of ${ROWS}, lane ${moment.lane}, at ${moment.speed} px/s, tilt ${pct(moment.tilt)}.`));
    }
    // The QA team's common ground: how it felt, and a note with the game's own numbers.
    const qa = nodeOf('div', 'pie-cardface-qa');
    const status = nodeOf('p', 'pie-cardface-status');
    status.setAttribute('role', 'status');
    let chosen = null;
    qa.append(nodeOf('span', 'pie-cardface-qa-label', 'How did it feel?'));
    ['too easy', 'just right', 'too hard', 'unclear', 'delightful'].forEach((feel) => {
      const b = nodeOf('button', 'pie-cardface-feel', feel);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        chosen = feel.replace(' ', '-');
        qa.querySelectorAll('.pie-cardface-feel').forEach((other) => other.setAttribute('aria-pressed', other === b ? 'true' : 'false'));
        record.qa.push({ kind, feel: chosen, moment, view: { ...record.view, intro: Boolean(run?.intro) }, build: buildId, at: new Date().toISOString() });
        record.qa = record.qa.slice(-200);
        writeRecord(record);
        status.textContent = `Noted in this browser: ${feel}.`;
      });
      qa.append(b);
    });
    const copy = nodeOf('button', 'pie-cardface-copy', 'Copy a QA note');
    copy.type = 'button';
    copy.addEventListener('click', () => copyText(qaNote(kind, chosen, moment), status));
    qa.append(copy);
    face.append(qa, status);
    if (live) {
      const go = nodeOf('button', 'pie-intro-go', 'Carry on ▸');
      go.type = 'button';
      go.addEventListener('click', closeReveal);
      face.append(go);
    }
    if (designMode) designable(face, kind);
    return face;
  }
  function openReveal(item) {
    if (!introOut || !CARDS[item.kind]) return;
    state = 'revealing';
    introOut.replaceChildren(renderCard(item.kind, { moment: item.moment, isNew: item.isNew, live: true }));
    introOut.hidden = false;
    introOut.querySelector('.pie-intro-go')?.focus({ preventScroll: true });
    const c = CARDS[item.kind];
    say(`${CARD_TYPES[c.type]}: ${c.name}. ${c.story} In the lanes: ${c.lanes}`);
  }
  function closeReveal() {
    if (state !== 'revealing') return;
    introOut.hidden = true;
    introOut.replaceChildren();
    state = 'running';
    last = performance.now();
    loop();
  }
  /** The deck on the page: cards turned face-up, the rest face-down (all face-up with ?qa). */
  function paintDeck() {
    if (!deckOut) return;
    const body = deckOut.querySelector('[data-pie-deck-body]');
    const lede = deckOut.querySelector('[data-pie-deck-lede]');
    const kinds = Object.keys(CARDS);
    // A card turned while reading a chapter is face-up here too.
    const shelf = cardsTurned();
    const isTurned = (k) => record.cards.includes(k) || shelf.has(k);
    const turned = kinds.filter(isTurned).length;
    if (lede) lede.textContent = `${turned} of ${kinds.length} cards turned${qaAll ? ' · QA view: every card face-up' : ''}. ${record.qa.length ? `${record.qa.length} QA note${record.qa.length === 1 ? '' : 's'} kept in this browser.` : ''}`;
    if (!body) return;
    const grid = nodeOf('ul', 'pie-deck-grid');
    kinds.forEach((kind) => {
      const li = nodeOf('li', 'pie-deck-slot');
      if (qaAll || isTurned(kind)) li.append(renderCard(kind, { compact: true }));
      else {
        const back = nodeOf('div', `pie-cardback type-${CARDS[kind].type}`);
        back.append(nodeOf('span', 'pie-cardback-mark', '?'), nodeOf('span', 'pie-cardback-type', CARD_TYPES[CARDS[kind].type]), nodeOf('span', 'pie-cardback-hint', 'Not met yet'));
        li.append(back);
      }
      grid.append(li);
    });
    const copyAll = nodeOf('button', 'pie-deck-copy', 'Copy every QA note');
    copyAll.type = 'button';
    const status = nodeOf('p', 'pie-deck-status');
    copyAll.addEventListener('click', () => copyText(record.qa.length ? record.qa.map((n) => qaNote(n.kind, n.feel, n.moment)).join('\n\n') : '# no QA notes yet', status));
    body.replaceChildren(grid, nodeOf('p', 'pie-deck-actions'), status);
    body.querySelector('.pie-deck-actions').append(copyAll);
  }

  /* ─── Modes on the start card: carry, or from the beginning with introductions ─── */
  let introMode = false;
  function paintCardModes() {
    if (!cardModes) return;
    const make = (intro, label) => {
      const b = nodeOf('button', `pie-card-mode${introMode === intro ? ' is-active' : ''}`, label);
      b.type = 'button';
      b.setAttribute('aria-pressed', introMode === intro ? 'true' : 'false');
      b.addEventListener('click', (event) => {
        event.stopPropagation();
        introMode = intro;
        if (intro) chosenStartChapter = 1;
        paintCardModes();
        paintCardChapters(chosenStartChapter);
        cardAction.textContent = intro ? 'Carry the pie from the beginning' : chosenStartChapter > 1 ? `Carry the pie from ${chapterWords(chosenStartChapter)}` : 'Carry the pie';
        prepareLeg(chosenStartChapter).then((leg) => { if (state === 'title' || state === 'over') paintFlows(leg); });
      });
      return b;
    };
    cardModes.replaceChildren(make(false, 'Carry'), make(true, 'From the beginning, with introductions'));
    cardModes.hidden = false;
  }

  /* ─── The power-up bench: every gift as a Spw spell; change one and carry with it, or pass it along ─── */
  const bench = document.querySelector('[data-pie-bench]');
  const benchArea = bench?.querySelector('[data-pie-bench-spells]');
  const benchRead = bench?.querySelector('[data-pie-bench-read]');
  const benchStatus = bench?.querySelector('[data-pie-bench-status]');
  // The visit's spells, read as they are written: by the real parser when it has loaded (else the small reader).
  let benchTimer = null;
  async function paintBenchRead() {
    if (!benchRead) return;
    const text = benchArea.value;
    const read = text.trim() ? await readRules(text) : { powers: {}, errors: [], tune: {}, knocks: {}, quirks: [], reader: 'none' };
    if (text !== benchArea.value) return;   // written over while it was being read
    const known = bookRules?.powers || powersInPlay().powers;
    const items = Object.values(read.powers).map((power) => {
      const li = nodeOf('li', power.id in known ? '' : 'is-new');
      li.append(nodeOf('code', '', `*${power.id}`), nodeOf('span', '', ` — ${describePower(power)}${power.id in known ? '' : ' (a new name: nothing in the lanes gives it yet)'}`));
      return li;
    });
    Object.entries(read.tune || {}).forEach(([key, value]) => items.push(nodeOf('li', key in TUNE ? '' : 'is-new', `=${key}[${value}]${key in TUNE ? ` — tunes ${key.replace(/_/g, ' ')} (now ${TUNE[key]})` : ' — nothing is tuned by that name'}`)));
    Object.keys(read.knocks || {}).forEach((kind) => items.push(nodeOf('li', KNOCKS[kind] ? '' : 'is-new', `!knocks *${kind} — ${Object.entries(read.knocks[kind]).map(([k, v]) => `${k} ${v}`).join(', ')}`)));
    Object.entries(read.lean || {}).forEach(([event, [cat, w]]) => items.push(nodeOf('li', LEAN_DEFAULTS[event] ? '' : 'is-new', `=lean ${LEAN_NAMES[cat]} %${event}[${w}]${LEAN_DEFAULTS[event] ? ` — ${LEAN_WORDS[event]} lean ${LEAN_NAMES[cat]} by ${w}` : ' — nothing in the lanes is called that'}`)));
    [...read.errors, ...(read.quirks || []).map((q) => `the parser: ${q}`)].forEach((err) => items.push(nodeOf('li', 'is-error', err)));
    if (read.stats) items.push(nodeOf('li', 'is-meta', `read by ${read.reader} in ${read.stats.ms} ms${read.stats.complete ? '' : ' · not whole'}`));
    benchRead.replaceChildren(...items);
  }
  function paintBench() {
    if (!bench) return;
    const list = bench.querySelector('[data-pie-bench-list]');
    const spells = bookRules?.spells && Object.keys(bookRules.spells).length ? bookRules.spells : POWER_SPELLS;
    const own = bookRules?.powers && Object.keys(bookRules.powers).length ? bookRules.powers : readSpells(Object.values(POWER_SPELLS).join('\n')).powers;
    list?.replaceChildren(...Object.entries(spells).map(([id, spell]) => {
      const li = nodeOf('li', play.replaced.includes(id) ? 'is-replaced' : '');
      const code = renderSpell(spell, { explain: explainAtom('power'), link: bookLink, cast: false, play: true, copy: `lore.land/pie#power:${id}` });
      code.classList.add('pie-bench-spell', 'is-compact');
      const what = nodeOf('p', 'pie-bench-what', describePower(own[id]) + (play.replaced.includes(id) ? ' · replaced this visit' : ''));
      const take = nodeOf('button', 'pie-tool', 'Change this');
      take.type = 'button';
      take.addEventListener('click', () => {
        const others = benchArea.value.replace(new RegExp(`\\*${id}\\s*\\{[^{}]*\\}`, 'g'), '').trim();
        benchArea.value = [others, spell].filter(Boolean).join('\n');
        paintBenchRead();
        benchArea.focus();
      });
      li.append(code, what, take);
      return li;
    }) || []);
    if (benchArea && !benchArea.value) benchArea.value = visitSpells();
    paintBenchRead();
  }
  benchArea?.addEventListener('input', () => { clearTimeout(benchTimer); benchTimer = setTimeout(paintBenchRead, 350); });
  bench?.querySelector('[data-pie-bench-apply]')?.addEventListener('click', async () => {
    const read = benchArea.value.trim() ? await readRules(benchArea.value) : null;
    const any = read && (Object.keys(read.powers).length || Object.keys(read.tune).length || Object.keys(read.knocks).length || Object.keys(read.lean || {}).length);
    setVisitSpells(any ? benchArea.value : '');
    await readVisit();
    paintBench();
    const parts = [
      play.replaced.length && `your spell${play.replaced.length === 1 ? '' : 's'} for ${play.replaced.join(', ')}`,
      Object.keys(visitRead?.tune || {}).length && `your tuning of ${Object.keys(visitRead.tune).join(', ').replace(/_/g, ' ')}`,
      Object.keys(visitRead?.knocks || {}).length && `your knocks for ${Object.keys(visitRead.knocks).join(', ')}`,
      Object.keys(visitRead?.lean || {}).length && `your weighing of ${Object.keys(visitRead.lean).map((e) => e.replace(/_/g, ' ')).join(', ')}`
    ].filter(Boolean);
    benchStatus.textContent = parts.length
      ? `This visit carries with ${parts.join('; ')}.${read?.errors?.length ? ' Some words were not read; see above.' : ''} Your own game is unchanged.`
      : 'Nothing here changes the lanes yet: use a name from the list, =tune{ … }, or !knocks{ … }.';
  });
  bench?.querySelector('[data-pie-bench-link]')?.addEventListener('click', async () => {
    if (!benchArea.value.trim()) { benchStatus.textContent = 'Write or change a spell first.'; return; }
    const link = powersLink(benchArea.value);
    try {
      await navigator.clipboard.writeText(link);
      benchStatus.textContent = 'Copied. Whoever opens it carries with these rules for their visit; their own game stays theirs.';
    } catch {
      benchStatus.textContent = link;
    }
  });
  bench?.querySelector('[data-pie-bench-reset]')?.addEventListener('click', async () => {
    setVisitSpells('');
    benchArea.value = '';
    await readVisit();
    paintBench();
    benchStatus.textContent = 'Back to the book’s own rules.';
  });

  /* ─── The tuning desk: the game's dials as spells, every number scrubbable (spw-spell.mjs scrub) ───
   * Scroll, drag or arrow a number and the lanes retune at once; the spell is kept as this visit's
   * own (=tune{} and =lean{} beside whatever else the bench holds), so it can be copied and passed on. */
  const desk = document.querySelector('[data-pie-desk]');
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));
  const deskTuneText = () => `=tune{ ${Object.keys(TUNE_DEFAULTS).map((k) => `=${k}[${fmt(TUNE[k])}]`).join(' ')} }`;
  const WAYS_OF = Object.freeze({ boon: 'fairy_tale', bane: 'absurd_reality', bone: 'low_magic' });
  const deskLeanText = () => {
    const table = { ...Object.fromEntries(Object.entries(LEAN_DEFAULTS)), ...leanRules };
    const ways = { boon: [], bane: [], bone: [] };
    Object.entries(table).forEach(([event, [cat, w]]) => ways[cat]?.push(`%${event}[${fmt(w)}]`));
    return `=lean{ ${Object.entries(ways).map(([cat, atoms]) => `&${WAYS_OF[cat]}{ ${atoms.join(' ')} }`).join(' ')} }`;
  };
  const deskScenesText = () => `!scenes{ ${Object.keys(SCENE_WHIMSY_DEFAULTS).map((id) => { const w = sceneWhimsy(id); return `*${id}{ $${w.material || 'ink'} %drama[${fmt(w.drama ?? 1)}] }`; }).join(' ')} }`;
  let deskTimer = null;
  // Keep the desk's spells as this visit's, replacing any earlier =tune / =lean / !scenes block.
  const keepDesk = (block, text) => {
    clearTimeout(deskTimer);
    deskTimer = setTimeout(async () => {
      const pattern = { tune: /=tune\{[^{}]*\}/g, lean: /=lean\{(?:[^{}]|\{[^{}]*\})*\}/g, scenes: /!scenes\{(?:[^{}]|\{[^{}]*\})*\}/g }[block];
      const rest = visitSpells().replace(pattern, '').trim();
      setVisitSpells([rest, text].filter(Boolean).join('\n'));
      await readVisit();
      if (benchArea) { benchArea.value = visitSpells(); paintBenchRead(); }
      paintBench();
    }, 400);
  };
  function paintDesk() {
    if (!desk) return;
    const tune = desk.querySelector('[data-pie-desk-tune]');
    const leanOut = desk.querySelector('[data-pie-desk-lean]');
    const scenes = desk.querySelector('[data-pie-desk-scenes]');
    tune?.replaceChildren(renderSpell(deskTuneText(), {
      cast: false, play: true, copy: 'lore.land/pie#tune', explain: explainAtom('tune'),
      scrub: {
        range: (label) => TUNE_RANGE[label] || [0, 10],
        change: (text, { label, value }) => { if (TUNE_RANGE[label]) TUNE[label] = clamp(value, TUNE_RANGE[label][0], TUNE_RANGE[label][1]); keepDesk('tune', text); }
      }
    }));
    leanOut?.replaceChildren(renderSpell(deskLeanText(), {
      cast: false, play: true, copy: 'lore.land/pie#lean', explain: explainAtom('lean'),
      scrub: {
        range: () => [0, 3],
        change: (text, { label, value }) => { const cat = (leanRules[label] || LEAN_DEFAULTS[label] || [])[0]; if (cat) leanRules = { ...leanRules, [label]: [cat, value] }; keepDesk('lean', text); }
      }
    }));
    scenes?.replaceChildren(renderSpell(deskScenesText(), {
      cast: false, play: true, copy: 'lore.land/pie#scenes', explain: explainAtom('scenes'),
      scrub: { range: () => [0, 3], change: (text) => keepDesk('scenes', text) }
    }));
  }
  desk?.querySelector('[data-pie-desk-reset]')?.addEventListener('click', async () => {
    setVisitSpells(visitSpells().replace(/=tune\{[^{}]*\}/g, '').replace(/=lean\{(?:[^{}]|\{[^{}]*\})*\}/g, '').replace(/!scenes\{(?:[^{}]|\{[^{}]*\})*\}/g, '').trim());
    await readVisit();
    paintDesk();
    paintBench();
  });

  /* ─── Paste: any spell pasted on this page is read and sent where it belongs ───
   * Rules (=tune, =lean, !knocks, !whimsy, !scenes, *powers) go to the bench and play this visit; a
   * card (@kind{ … } or #from[…card:kind]) opens that card in the deck; a carry (@carry[…]) is shown
   * with the provenance cards; a chapter's projection (@reader{ … }) becomes a link to read it that way. */
  const pasteNote = document.querySelector('[data-pie-paste-note]');
  async function pasteSpell(raw) {
    const from = (/#from\["([^"]*)"\]/.exec(raw) || [])[1] || '';
    const text = raw.replace(/#from\["[^"]*"\]/g, '').trim();
    const say2 = (msg) => { if (pasteNote) pasteNote.textContent = msg; say(msg); };
    const cardKind = (/card:([a-z-]+)/.exec(from) || [])[1] || (Object.keys(CARDS).find((k) => new RegExp(`^@${k.replace(/-/g, '_')}\\{`).test(text)));
    if (/^@carry\[/.test(text)) {
      const body = document.querySelector('[data-pie-provenance-body]');
      const box = nodeOf('div', 'pie-provenance-card is-latest');
      box.append(nodeOf('p', 'pie-card-pasted', 'Pasted here, not kept'), renderSpell(text, { cast: true, play: true }));
      body?.prepend(box);
      box.scrollIntoView({ block: 'center', behavior: reduced?.matches ? 'auto' : 'smooth' });
      say2('A carry, pasted: it is shown with the provenance cards (and not kept).');
      return;
    }
    if (/^@reader\{/.test(text)) {
      const n = Number((/\.chapter\[(\d+)\]/.exec(text) || [])[1]) || 1;
      const url = new URL(`/book/chapter/${pad2(n)}/`, location.origin);
      url.searchParams.set('spell', text);
      say2(`A reading of Chapter ${n}, pasted: open ${url.pathname} to read it this way.`);
      if (pasteNote) { const a = nodeOf('a', '', ' Read it this way →'); a.href = url.toString(); pasteNote.append(a); }
      return;
    }
    if (cardKind && CARDS[cardKind] && !/=tune|=lean|!knocks|!whimsy|!scenes/.test(text)) {
      const deck = document.getElementById('pie-deck');
      deck?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
      const face = [...document.querySelectorAll('.pie-cardface')].find((f) => f.querySelector('.pie-cardface-name')?.textContent === CARDS[cardKind].name);
      face?.classList.add('is-flashed');
      setTimeout(() => face?.classList.remove('is-flashed'), 1800);
      say2(`A card, pasted: ${CARDS[cardKind].name}.${face ? '' : ' Not turned in your deck yet.'}`);
      return;
    }
    const read = await readRules(text);
    const any = Object.keys(read.powers).length + Object.keys(read.tune).length + Object.keys(read.knocks).length + Object.keys(read.lean || {}).length + Object.keys(read.whimsy || {}).length + Object.keys(read.scenes || {}).length;
    if (any) {
      if (benchArea) benchArea.value = [benchArea.value.trim(), text].filter(Boolean).join('\n');
      bench?.querySelector('[data-pie-bench-apply]')?.click();
      bench?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
      say2(`Rules, pasted (read by ${read.reader}): they are on the bench and in play for this visit.`);
      return;
    }
    say2('That did not read as a spell the lanes know. Rules, cards, carries and readings can be pasted here.');
  }
  document.addEventListener('paste', (event) => {
    if (event.target.closest?.('input, textarea, [contenteditable]')) return;
    const text = event.clipboardData?.getData('text') || '';
    if (!/[=!*@^%~#$?.&][a-z_]+[[{]/.test(text)) return;
    event.preventDefault();
    pasteSpell(text);
  });

  /* ─── The stress test: what the game has learned about Spw (pie-spw.mjs) ─── */
  const stressOut = document.querySelector('[data-pie-stress]');
  let stressCross = [];
  let stressFuzz = [];
  function paintStress() {
    if (!stressOut || !bookRules) return;
    const s = bookRules.stats;
    const lede = stressOut.querySelector('[data-pie-stress-lede]');
    if (lede) {
      lede.textContent = s
        ? `The rules (${s.bytes} characters of Spw) were read by ${bookRules.reader} in ${s.ms} ms: ${s.complete ? 'whole' : 'not whole'}${s.proseFallback ? ', falling back to prose' : ''}, ${s.errors} error${s.errors === 1 ? '' : 's'}, ${s.warnings} warning${s.warnings === 1 ? '' : 's'}, ${s.gaps} gaps.`
        : `The rules were read by the ${bookRules.reader} reader; the parser could not be loaded here.`;
    }
    const list = stressOut.querySelector('[data-pie-stress-list]');
    const rows = [
      ...(bookRules.quirks || []).map((q) => ['quirk', q]),
      ...stressCross.map((f) => ['cross', f]),
      ...stressFuzz.map((f) => ['fuzz', `${f.name}: ${f.complete ? 'read whole' : f.proseFallback ? 'fell back to prose' : 'not whole'}, ${f.errors} errors, ${f.warnings} warnings, ${f.ms} ms${f.quiet ? ' — reported success anyway' : ''}`])
    ];
    list?.replaceChildren(...(rows.length ? rows : [['ok', 'Nothing odd yet. Cross-read and fuzz to look harder.']]).map(([kind, text]) => {
      const li = nodeOf('li', `is-${kind}`);
      li.append(nodeOf('b', '', kind), nodeOf('span', '', ` ${text}`));
      return li;
    }));
    const report = stressOut.querySelector('[data-pie-stress-report]');
    if (report) {
      report.dataset.text = stressReport({ read: bookRules, crossFindings: stressCross, fuzzed: stressFuzz });
      report.replaceChildren(renderSpell(report.dataset.text, { cast: false }));
    }
  }
  stressOut?.querySelector('[data-pie-stress-cross]')?.addEventListener('click', async (event) => {
    if (!bookRules) return;
    event.target.disabled = true;
    stressCross = await crossRead(bookRules);
    if (!stressCross.length) stressCross = ['every power read the same by both readers, and every one survived a round trip'];
    event.target.disabled = false;
    paintStress();
  });
  stressOut?.querySelector('[data-pie-stress-fuzz]')?.addEventListener('click', async (event) => {
    if (!bookRules?.source) return;
    event.target.disabled = true;
    stressFuzz = [...stressFuzz, ...(await fuzz(bookRules.source, 8))].slice(-24);
    event.target.disabled = false;
    paintStress();
  });
  stressOut?.querySelector('[data-pie-stress-copy]')?.addEventListener('click', async (event) => {
    const text = stressOut.querySelector('[data-pie-stress-report]')?.dataset.text || '';
    try { await navigator.clipboard.writeText(text); event.target.textContent = 'Copied'; } catch { event.target.textContent = 'Select it and copy'; }
  });

  /* ─── Provenance: each carry written back as a Spw card (kept in this browser, the last five) ─── */
  const PROVENANCE_KEY = 'lore.pie.provenance.v1';
  const readProvenance = () => {
    try { const list = JSON.parse(window.localStorage.getItem(PROVENANCE_KEY) || '[]'); return Array.isArray(list) ? list : []; } catch { return []; }
  };
  function keepProvenance(card) {
    const list = [card, ...readProvenance()].slice(0, 5);
    try { window.localStorage.setItem(PROVENANCE_KEY, JSON.stringify(list)); } catch { /* this visit only */ }
    paintProvenance(list);
  }
  function paintProvenance(list = readProvenance()) {
    const body = document.querySelector('[data-pie-provenance-body]');
    if (!body || !list.length) return;
    body.replaceChildren(...list.map((card, i) => {
      const box = nodeOf('div', `pie-provenance-card${i ? '' : ' is-latest'}`);
      const pre = renderSpell(card, { explain: explainAtom('carry'), cast: i === 0, play: true, copy: 'lore.land/pie#carry' });
      const copy = nodeOf('button', 'pie-tool', i ? 'Copy' : 'Copy the latest');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(card); copy.textContent = 'Copied'; } catch { copy.textContent = 'Select it and copy'; }
      });
      box.append(pre, copy);
      return box;
    }));
  }

  /* ─── Thumbs: controls for a phone held in two hands ───
   * The pad is the lanes in small (five across, four up): touch or slide to where you want to
   * stand and the carrier walks there at its own pace, so no step is hurried and none is lost.
   * Hop and throw sit under the other thumb; slide along throw to turn the needle, let go to
   * throw. Each column shows what is coming down that lane. Shown on touch screens (or as soon
   * as a touch is used); ⇄ swaps the pad and the buttons for the other hand. */
  const thumbs = root.querySelector('[data-pie-thumbs]');
  const padGrid = root.querySelector('[data-pie-pad-grid]');
  const padCells = [];
  if (padGrid) {
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      for (let lane = 0; lane < LANES; lane += 1) {
        const cell = document.createElement('span');
        cell.className = 'pie-pad-cell';
        padGrid.append(cell);
        padCells.push({ cell, lane, row: r });
      }
    }
  }
  const buzz = (ms) => { try { if (!reduced?.matches) navigator.vibrate?.(ms); } catch { /* no buzz here */ } };
  const padAt = (event) => {
    const box = padGrid.getBoundingClientRect();
    const lane = clamp(Math.floor(((event.clientX - box.left) / box.width) * LANES), 0, LANES - 1);
    const row = clamp(ROWS - 1 - Math.floor(((event.clientY - box.top) / box.height) * ROWS), 0, ROWS - 1);
    return { lane, row };
  };
  let padPointer = null;
  const padAim = (event, held) => {
    if (state === 'title' || state === 'over') { start(); return; }
    if (state !== 'running' || !run) return;
    const at = padAt(event);
    if (!run.target || run.target.lane !== at.lane || run.target.row !== at.row) buzz(4);
    run.target = { ...at, held };
  };
  padGrid?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    padPointer = event.pointerId;
    try { padGrid.setPointerCapture(event.pointerId); } catch { /* not held */ }
    root.classList.add('is-thumbs');
    padAim(event, true);
  });
  padGrid?.addEventListener('pointermove', (event) => { if (event.pointerId === padPointer) padAim(event, true); });
  const padRelease = (event) => {
    if (event.pointerId !== padPointer) return;
    padPointer = null;
    if (run?.target) run.target.held = false;
  };
  padGrid?.addEventListener('pointerup', padRelease);
  padGrid?.addEventListener('pointercancel', padRelease);

  const throwThumb = root.querySelector('[data-pie-thumb-throw]');
  let aimThumb = null;
  throwThumb?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (state === 'title' || state === 'over') { start(); return; }
    if (state !== 'running' || !run) return;
    try { throwThumb.setPointerCapture(event.pointerId); } catch { /* not held */ }
    aimThumb = { id: event.pointerId, x: event.clientX, a: run.aim.a };
    throwThumb.classList.add('is-aiming');
  });
  throwThumb?.addEventListener('pointermove', (event) => {
    if (!aimThumb || event.pointerId !== aimThumb.id || !run) return;
    // A thumb's width of travel turns the needle about a third of its swing.
    run.aim.a = clamp(aimThumb.a + ((event.clientX - aimThumb.x) / 110) * AIM_MAX, -AIM_MAX, AIM_MAX);
  });
  const throwRelease = (event) => {
    if (!aimThumb || event.pointerId !== aimThumb.id) return;
    aimThumb = null;
    throwThumb.classList.remove('is-aiming');
    if (event.type === 'pointerup' && state === 'running') throwSlice(run.aim.a);
  };
  throwThumb?.addEventListener('pointerup', throwRelease);
  throwThumb?.addEventListener('pointercancel', throwRelease);
  root.querySelector('[data-pie-thumb-hop]')?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (state === 'title' || state === 'over') { start(); return; }
    jump();
    buzz(8);
  });
  // A touch anywhere on the cabinet brings the thumbs, even on a screen that also has a mouse.
  root.addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch') root.classList.add('is-thumbs'); }, { passive: true });

  /** The pad, each frame: where the carrier stands, where it is going, and what is coming down each lane. */
  let padSeen = '';
  function paintPad() {
    if (!padCells.length || !thumbs || thumbs.offsetParent === null) return;
    const danger = new Array(LANES).fill(0);
    if (run && state === 'running') {
      run.things.forEach((t) => {
        if (t.wapped || !t.fatal || t.y > run.y || run.y - t.y > 300) return;
        const near = 1 - (run.y - t.y) / 300;
        if (WIDE.has(t.kind)) { for (let lane = 0; lane < LANES; lane += 1) if (lane !== t.gap) danger[lane] = Math.max(danger[lane], near); }
        else danger[laneAt(t.x)] = Math.max(danger[laneAt(t.x)], near);
      });
    }
    const key = run ? `${run.lane}.${run.row}.${run.target?.lane}.${run.target?.row}.${danger.map((d) => Math.round(d * 4)).join('')}` : '';
    if (key === padSeen) return;
    padSeen = key;
    padCells.forEach(({ cell, lane, row }) => {
      cell.classList.toggle('is-here', Boolean(run) && run.lane === lane && run.row === row);
      cell.classList.toggle('is-target', Boolean(run?.target) && run.target.lane === lane && run.target.row === row);
      cell.style.setProperty('--coming', danger[lane].toFixed(2));
    });
  }
  paintPadHook = paintPad;
  const handBtn = root.querySelector('[data-pie-hand]');
  const applyHand = () => {
    root.classList.toggle('is-left-handed', record.view.hand === 'left');
    handBtn?.setAttribute('aria-pressed', record.view.hand === 'left' ? 'true' : 'false');
  };
  handBtn?.addEventListener('click', () => {
    record.view.hand = record.view.hand === 'left' ? 'right' : 'left';
    writeRecord(record);
    applyHand();
    say(record.view.hand === 'left' ? 'The pad is under your right thumb now, hop and throw under your left.' : 'The pad is under your left thumb, hop and throw under your right.');
  });
  applyHand();

  /* ─── Story and Zen: the narrative beside the screen, collapsible; nothing popping up, in zen ─── */
  const applyView = () => {
    voyage?.classList.toggle('is-story-off', !record.view.story);
    voyage?.classList.toggle('is-zen', record.view.zen);
    root.querySelectorAll('[data-pie-toggle]').forEach((btn) => {
      const key = btn.dataset.pieToggle;
      const on = Boolean(record.view[key]);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = key === 'story' ? '◫ Story' : '◌ Zen';
      btn.title = key === 'story'
        ? (on ? 'The story flows beside the screen' : 'The story beside the screen is folded away')
        : (on ? 'Zen: nothing pops up, and the screen takes the room' : 'Zen is off');
    });
    requestAnimationFrame(fit);
  };
  root.querySelectorAll('[data-pie-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.pieToggle;
    record.view[key] = !record.view[key];
    writeRecord(record);
    applyView();
    say(key === 'story'
      ? (record.view.story ? 'The story flows beside the screen again, and new cards pause the carry.' : 'The story beside the screen is folded away.')
      : (record.view.zen ? 'Zen: the words fold away and the screen takes their room; nothing pops up or pauses.' : 'Zen is off.'));
    // Zen gives the screen the room the words leave: bring the whole of it into view.
    if (key === 'zen' && record.view.zen && !isFull()) root.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
  }));

  /* ─── Fullscreen: the whole voyage, screen and story, on the whole display ─── */
  const fullBtn = root.querySelector('[data-pie-fullscreen]');
  const isFull = () => Boolean(voyage) && (document.fullscreenElement === voyage || voyage.classList.contains('is-immersive'));
  const paintFull = () => {
    if (!fullBtn) return;
    fullBtn.textContent = isFull() ? '⛶ Leave' : '⛶ Full';
    fullBtn.title = isFull() ? 'Leave fullscreen' : 'Fullscreen';
    fullBtn.setAttribute('aria-pressed', isFull() ? 'true' : 'false');
  };
  const immersive = (on) => {
    voyage?.classList.toggle('is-immersive', on);
    document.documentElement.classList.toggle('pie-immersive', on);
    paintFull();
    requestAnimationFrame(fit);
  };
  function setFull(on) {
    if (!voyage) return;
    if (on) {
      if (document.fullscreenEnabled && voyage.requestFullscreen) voyage.requestFullscreen().catch(() => immersive(true));
      else immersive(true);
    } else {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      immersive(false);
    }
  }
  fullBtn?.addEventListener('click', () => setFull(!isFull()));
  const onFullChange = () => {
    voyage?.classList.toggle('is-full', document.fullscreenElement === voyage);
    paintFull();
    requestAnimationFrame(fit);
  };
  document.addEventListener('fullscreenchange', onFullChange);

  /* ─── The asset sheet: every background and sprite, drawn by the game, for design review ─── */
  function drawBackdrop(target, sceneId, width = 168) {
    const height = Math.round((width * H) / W);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    target.width = width * ratio;
    target.height = height * ratio;
    const c = target.getContext('2d');
    const saved = { ctx, run, state };
    ctx = c;
    run = null;
    state = 'title';
    try {
      c.setTransform((ratio * width) / W, 0, 0, (ratio * height) / H, 0, 0);
      const s = SCENES.find((entry) => entry.id === sceneId) || SCENES[2];
      const [top, bottom] = skyFor(s);
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, top);
      sky.addColorStop(1, bottom);
      c.fillStyle = sky;
      c.fillRect(0, 0, W, H);
      drawGroundFor(sceneId, 0, 1);
      c.strokeStyle = mix(colors.muted, colors.paper, 0.6);
      c.setLineDash([6, 10]);
      for (let lane = 1; lane < LANES; lane += 1) { c.beginPath(); c.moveTo(lane * LANE_W, 0); c.lineTo(lane * LANE_W, H); c.stroke(); }
      c.setLineDash([]);
    } finally {
      ctx = saved.ctx;
      run = saved.run;
      state = saved.state;
    }
  }
  function assetManifest() {
    const saved = run;
    run = fresh();
    try {
      const sprites = Object.keys(SPRITES).map((kind) => {
        const t = makeThing(kind, 2);
        return {
          id: kind,
          hitbox: { w: WIDE.has(kind) ? W : t.w, h: t.h },
          knocks: Boolean(KNOCKS[kind]),
          tilt: KNOCKS[kind]?.tilt ?? null,
          low: LOW.has(kind),
          slip: SLIPS.has(kind),
          wide: WIDE.has(kind),
          from_chapter: INTRO[kind] || 1,
          scenes: SCENES.filter((s) => s.kinds.includes(kind) || (s.low || []).includes(kind)).map((s) => s.id),
          card: CARDS[kind] ? CARDS[kind].name : null
        };
      });
      return {
        manifest: 'exactly-one-pie/assets',
        build: buildId,
        canvas: { width: W, height: H, lanes: LANES, rows: ROWS, lane_width: LANE_W },
        palette_tokens: ['--hub-paper', '--hub-paper-deep', '--hub-ink', '--hub-muted', '--hub-accent', '--hub-gold', '--hub-hearth', '--hub-berry', '--hub-night'],
        scenes: SCENES.map((s) => ({ id: s.id, card: s.card, tint: s.tint, rain: Boolean(s.rain), kinds: s.kinds, low: s.low || ['puddle'], presence: s.presence || null, chapters: Object.entries(CHAPTER_SCENE).filter(([, id]) => id === s.id).map(([n]) => Number(n)) })),
        sprites,
        figures: ['carrier-figure', 'carrier-porter', 'carrier-clerk', 'carrier-genie', 'carrier-clown', 'boon', 'bane', 'boof'],
        to_add_a_level: [
          'a scene: id, card line, tint (a --hub-* mix), rain or not',
          'a ground: drawGroundFor(scene) — the ground pattern under the lanes, drawn at any scroll',
          'kinds: which sprites come up the lanes there (and low things for the ground)',
          'a presence lean (boon or bane) if the place belongs to one of the pies',
          'chapters: CHAPTER_SCENE, or a door (pie-segues.mjs) and a passage cue',
          'a card for anything new (pie-cards.mjs): story, lanes in exact numbers, first chapter'
        ]
      };
    } finally {
      run = saved;
    }
  }
  function paintAssets() {
    if (!assetsOut || assetsOut.dataset.painted) return;
    assetsOut.dataset.painted = 'yes';
    const body = assetsOut.querySelector('[data-pie-assets-body]');
    if (!body) return;
    const manifest = assetManifest();
    const grounds = nodeOf('ul', 'pie-assets-grounds');
    manifest.scenes.forEach((scene) => {
      const li = nodeOf('li', 'pie-asset');
      const cv = document.createElement('canvas');
      cv.className = 'pie-asset-ground';
      cv.setAttribute('aria-hidden', 'true');
      drawBackdrop(cv, scene.id);
      li.append(cv, nodeOf('strong', '', scene.id), nodeOf('span', 'pie-asset-line', scene.card),
        nodeOf('span', 'pie-asset-meta', `tint ${scene.tint}${scene.rain ? ' · rain' : ''}${scene.presence ? ` · leans ${scene.presence}` : ''} · chapters ${scene.chapters.join(', ') || '—'}`),
        nodeOf('span', 'pie-asset-meta', `up the lanes: ${scene.kinds.join(', ')} · underfoot: ${scene.low.join(', ')}`));
      grounds.append(li);
    });
    const sprites = nodeOf('ul', 'pie-assets-sprites');
    [...manifest.figures.map((id) => ({ id, figure: true })), ...manifest.sprites].forEach((sp) => {
      const li = nodeOf('li', 'pie-asset');
      const cv = document.createElement('canvas');
      cv.className = 'pie-asset-sprite';
      cv.setAttribute('aria-hidden', 'true');
      drawSprite(cv, sp.id, 64);
      const meta = sp.figure
        ? 'figure (drawn by drawFigure / drawBoonWAP / drawBaneWAP / drawBoof)'
        : [`hitbox ${sp.hitbox.w}×${sp.hitbox.h}`, sp.knocks ? `knocks +${pct(sp.tilt)}` : null, sp.low ? 'low' : null, sp.slip ? 'slip' : null, sp.wide ? 'wide row' : null, `from ch ${sp.from_chapter}`, sp.scenes.length ? `in ${sp.scenes.join(', ')}` : 'spawned by rule'].filter(Boolean).join(' · ');
      li.append(cv, nodeOf('strong', '', sp.id), nodeOf('span', 'pie-asset-meta', meta));
      sprites.append(li);
    });
    const copy = nodeOf('button', 'pie-deck-copy', 'Copy the level manifest (JSON)');
    copy.type = 'button';
    const status = nodeOf('p', 'pie-deck-status');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(manifest, null, 2)); status.textContent = 'Copied: scenes, sprites, hitboxes, flags, palette tokens, and what a new level needs.'; } catch { status.textContent = JSON.stringify(manifest); }
    });
    const steps = nodeOf('ol', 'pie-assets-steps');
    manifest.to_add_a_level.forEach((line) => steps.append(nodeOf('li', '', line)));
    body.replaceChildren(nodeOf('h3', '', 'Backgrounds: one ground and light for each place'), grounds,
      nodeOf('h3', '', 'Sprites: everyone and everything in the lanes'), sprites,
      nodeOf('h3', '', 'To add a level, or reskin one'), steps,
      nodeOf('p', 'pie-deck-actions'), status);
    body.querySelector('.pie-deck-actions').append(copy);
  }
  assetsOut?.addEventListener('toggle', () => { if (assetsOut.open) paintAssets(); });

  /* ─── Controls ─── */
  const onKey = (event) => {
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const key = event.key;
    if (state === 'revealing' && (key === ' ' || key === 'Enter' || key === 'Escape')) {
      event.preventDefault();
      closeReveal();
      return;
    }
    if (key === 'Escape' && voyage?.classList.contains('is-immersive') && state !== 'running') {
      setFull(false);
      return;
    }
    // Mid-run the arrows always steer; otherwise they start a run only from inside the game.
    const steering = state === 'running' || root.contains(document.activeElement);
    const lower = key.length === 1 ? key.toLowerCase() : key;
    const moves = { ArrowLeft: [step, -1], a: [step, -1], ArrowRight: [step, 1], d: [step, 1], ArrowUp: [climb, 1], w: [climb, 1], ArrowDown: [climb, -1], s: [climb, -1] };
    if (moves[lower] && steering) {
      event.preventDefault();
      const [move, dir] = moves[lower];
      move(dir);
    } else if ((key === ' ' || lower === 'j') && state === 'running') {
      event.preventDefault();
      jump();
    } else if ((lower === 'x' || lower === 'f') && state === 'running') {
      event.preventDefault();
      throwSlice();
    } else if ((lower === 'q' || lower === 'e' || key === '[' || key === ']') && state === 'running') {
      // Turn the needle: it stays where you leave it.
      event.preventDefault();
      turnAim(lower === 'q' || key === '[' ? -1 : 1);
    } else if (key === ' ' || key === 'Enter') {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (event.target.closest?.('a, button')) return;
      event.preventDefault();
      if (state === 'paused') resume();
      else if (state === 'running') pause();
      else if (state === 'title' || state === 'over') start();
    } else if ((key === 'Escape' || lower === 'p') && state === 'running') {
      pause();
    }
  };
  /* Touch and pointer, by where a gesture starts and how it moves:
   *   drag in the lanes    steps as the finger goes: a lane each time it crosses half a lane,
   *                        a row each time it climbs or drops two-thirds of one (a quick flick is one step)
   *   drag from the pie    pulls the needle round to the finger; let go and the slice flies along it
   *   tap the carrier      a hop
   *   tap the lanes        a throw toward the tap, and the needle stays turned that way
   *   a pointer, hovering  turns the needle (a mouse); it stays turned when the pointer leaves */
  let press = null;
  const toGame = (event) => {
    const box = canvas.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * W, y: ((event.clientY - box.top) / box.height) * H, px: box.width / W };
  };
  // How far a drag goes for one step: =swipe_across (a fraction of a lane) and =swipe_along (in the game's units).
  const stepAcross = () => LANE_W * TUNE.swipe_across;
  const stepAlong = () => TUNE.swipe_along;
  const onPointerDown = (event) => {
    const at = toGame(event);
    const nearPie = state === 'running' && run && Math.hypot(at.x - run.x, at.y - (run.y - 24)) < 34;
    press = { x: event.clientX, y: event.clientY, id: event.pointerId, at, ox: at.x, oy: at.y, fromPie: nearPie, steps: 0, aimed: false };
    if (state === 'running') { try { canvas.setPointerCapture?.(event.pointerId); } catch { /* a pointer the page cannot hold */ } }
  };
  const onPointerMoveWhilePressed = (event) => {
    if (!press || press.id !== event.pointerId || state !== 'running' || !run) return false;
    const at = toGame(event);
    if (press.fromPie) {
      const from = throwFrom();
      if (Math.hypot(at.x - from.x, at.y - from.y) > 14 && at.y < from.y) {
        run.aim.a = clamp(Math.atan2(at.x - from.x, from.y - at.y), -AIM_MAX, AIM_MAX);
        press.aimed = true;
      }
      return true;
    }
    const dx = at.x - press.ox;
    const dy = at.y - press.oy;
    // The first clear movement decides the axis, and the drag keeps it: no stray steps from a wobbly thumb.
    if (!press.axis && Math.hypot(dx, dy) > 10) press.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    if (press.axis === 'x' && Math.abs(dx) >= stepAcross()) {
      step(dx < 0 ? -1 : 1);
      press.ox += Math.sign(dx) * stepAcross();
      press.oy = at.y;
      press.steps += 1;
    } else if (press.axis === 'y' && Math.abs(dy) >= stepAlong()) {
      climb(dy < 0 ? 1 : -1);
      press.oy += Math.sign(dy) * stepAlong();
      press.ox = at.x;
      press.steps += 1;
    }
    return true;
  };
  const onPointerUp = (event) => {
    if (!press || press.id !== event.pointerId) return;
    const done = press;
    press = null;
    const dx = event.clientX - done.x;
    const dy = event.clientY - done.y;
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    if (done.fromPie) {
      // Pulled from the pie: a flick along the needle; barely moved, a hop.
      if (done.aimed) throwSlice(run.aim.a);
      else jump();
      return;
    }
    if (done.steps) return;   // the drag already stepped
    if (Math.hypot(dx, dy) > 26) {
      // A quick flick shorter than a lane: still one step its way.
      if (Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? -1 : 1);
      else climb(dy < 0 ? 1 : -1);
      return;
    }
    const at = toGame(event);
    const from = throwFrom();
    if (at.y > from.y - 10) {
      // Below the pie there is nobody to throw to: a tap there steps toward it instead.
      step(at.x < run.x ? -1 : 1);
      return;
    }
    const angle = Math.atan2(at.x - from.x, from.y - at.y);
    run.aim.a = clamp(angle, -AIM_MAX, AIM_MAX);   // the needle remembers where you last threw
    throwSlice(angle);
  };
  const onPointerMove = (event) => {
    if (onPointerMoveWhilePressed(event)) return;
    if (state !== 'running' || !run || event.pointerType === 'touch') return;
    const at = toGame(event);
    run.pointer = { x: at.x, y: at.y, active: true };
    // Pointing turns the needle, and it stays turned when the pointer leaves.
    const from = throwFrom();
    if (at.y < from.y - 10) run.aim.a = clamp(Math.atan2(at.x - from.x, from.y - at.y), -AIM_MAX, AIM_MAX);
  };
  const onPointerLeave = () => {
    if (run?.pointer) run.pointer.active = false;
  };
  const onVisibility = () => { if (document.hidden) pause(); };
  const onAction = () => {
    if (state === 'paused') resume();
    else start();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', () => { press = null; });
  left?.addEventListener('click', () => step(-1));
  right?.addEventListener('click', () => step(1));
  root.querySelector('[data-pie-jump]')?.addEventListener('click', jump);
  root.querySelectorAll('[data-pie-climb]').forEach((button) => button.addEventListener('click', () => climb(Number(button.dataset.pieClimb) || 1)));
  root.querySelector('[data-pie-throw]')?.addEventListener('click', () => {
    if (state === 'title' || state === 'over') start();
    else throwSlice();
  });
  cardAction.addEventListener('click', onAction);
  card.addEventListener('click', (event) => { if (event.target === card && (state === 'title' || state === 'over')) start(); });
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  const resize = new ResizeObserver(fit);
  resize.observe(canvas);
  // The binding can change while the page is open (home/bindery.mjs); the game follows.
  const recolor = new MutationObserver(() => { colors = palette(); draw(); paintLegend(); });
  recolor.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  soundToggle?.addEventListener('click', () => {
    record.sound = !record.sound;
    writeRecord(record);
    paintSound();
    if (record.sound) {
      primeAudio();
      wapSound();
    }
  });

  paintBest();
  paintCarries();
  paintSound();
  // Found in the story? Say where the carry begins: the book goes by, chapter by chapter, from there.
  const entry = (() => {
    try { return segueFor(new URLSearchParams(window.location.search).get('scene')); } catch { return null; }
  })();
  showCard('Someone is destined to spill exactly one pie.',
    firstChapter > 1
      ? `From ${chapterWords(firstChapter)}${entry ? `, ${entry.place}` : ''}: someone in a hat is carrying one, level, through the rest of the book. It is not always the same someone.`
      : 'Nobody has said who. Someone in a hat is carrying one, level, in both hands, through the whole book, chapter by chapter. It is not always the same someone.',
    entry ? entry.door : firstChapter > 1 ? `Carry the pie from ${chapterWords(firstChapter)}` : 'Carry the pie');
  paintCardChapters(chosenStartChapter);
  prepareLeg(chosenStartChapter).then((leg) => {
    if (state === 'title') paintFlows(leg);
  });
  if (from) {
    const home = returnAnchor();
    if (home) cardLinks?.replaceChildren(home);
  }
  root.classList.add('is-ready');
  fit();
  paintLegend();
  paintCardModes();
  applyView();
  paintFull();
  paintDeck();
  paintBench();
  paintProvenance();
  paintDesk();
  loadLore().then((data) => {
    lore = data;
    paintLore();
  });

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    recolor.disconnect();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

if (typeof document !== 'undefined') {
  const boot = () => initPieGame();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
