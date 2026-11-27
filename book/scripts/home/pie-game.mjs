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
 *   jump       Space or J, the jump button, or a tap on the carrier: a hop. It rises, hangs
 *              at the top, and comes down. Low things pass under it — stones, snails, spools,
 *              puddles, frost, bags and piles of flour, a fallen banner — and are cleared for
 *              good. A clear in the hang is in time: the pie steadies, and a slice comes back.
 *              Hop again as you come down and the next goes higher; the third is a high hop,
 *              which clears the lighter tall things too. A throw from the hang leaves high.
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
 *              clown's face (or Mr. BaneWAP's off switch) the ring turns gold: TRUE, and near
 *              it, NEAR. Dead centre counts twice, steadies the pie, and brings the next slice
 *              on. Near does less of the same. Off a wall, off Bonk glass, or off a ramp is
 *              Perfect on its own; dead centre as well, and the way you got there (the hang,
 *              a held poise) stacks on that. Bronze posts bend a slice; wasps and pigeons
 *              snatch it; anything solid takes it with a splat.
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
 *   the cast   pie-world.mjs: the scenes, the things in the lanes, who wears the hat, what a spill
 *              is blamed on, the whimsy and the horn games. A derived file (a take, a share card,
 *              an icon) keeps a sidecar; this catalogue is the rules, so the game imports it.
 *   berries    three kinds of foretelling (berries.json). Boonberries foresee kindly: filling,
 *              and a glimpse of the clear way, in teal. Baneberries foretell chaos that comes
 *              because it was said: let one past and its lane is posted in violet, and the knock
 *              comes; squashed, it never says; sweetened, it foretells boonberries. Boneberries
 *              promise nothing and feed you: savoury, tasting of the region, and fed (steps
 *              tilt less).
 *   sound      pie-sound.mjs: one bus, panned to where things happen; a few CC0 samples colour
 *              the physical moments and the synth plays if they have not arrived; what the land gives plays
 *              in the chapter's pentatonic key, climbing as it comes (minor while the mimes hold
 *              it); knocks are out of key; slow time muffles, the mimes' lead thins; footsteps
 *              know grass from cobble; a room around it all, the far things farther. Each room
 *              colours the key by its sigil, every tuned thing continues one melody that lands
 *              on that chord, answers come on the chapter's pulse. A run of good things fills
 *              that chord in — a fifth, then its third, then the room's colour — and a knock
 *              lets it go. An obstacle is heard once, in the stuff it is made of; Boon climbs,
 *              Bane falls. The spill resolves home. The lanes and the music keep one clock
 *              (pie-rhythm.mjs counts in steps, so a new tempo goes on from the same place in
 *              the bar, and says each step a moment before it falls, so its sound is placed on
 *              the audio clock); some chapters lean (%swing). A room opening changes the chord
 *              on the beat and says it once on plucked strings; a chapter closes with a cadence
 *              by how it went; what is sung has an echo in the chapter's time; the bass keeps
 *              bars in fours and turns at the fourth; past poise the pie's tilt is a low tone
 *              drifting out of tune. Made to be heard the hundredth time:
 *              nothing plays the same twice, and a sound repeated fast comes back quieter.
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
 *   tuned      the chapter-tuned trial: each leg plays as its chapter develops, as its line in
 *              pie-levels.spw says (&meets, &kinds, @cast, !schemes, ~pace, %egg, ^beat): nothing
 *              before the chapter that names it, a tension shaped like the chapter's, no scheme
 *              after Mr. BaneWAP's turn, no Egg after its shell is left empty. book:check holds
 *              each line to the released prose.
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
 *   ?chapter=  1–15: start the carry there. ?scene= (a door) starts in the chapter named
 *              by ?from= when that chapter has the scene, otherwise the scene's home
 *              chapter. ?from= also sends the reader back (pie-segues.mjs).
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

import { SEGUES, segueFor, chapterWords, safeReturn, describeReturn, leaveBackNote } from '../modules/pie-segues.mjs?v=2026_11_16.B';
import { carryFor, keepCarry, mimesHold, readCarries, carriesSummary, chapterList, describeLean, leanOf, renderCarriesPanel, PIE_WORDS, LEAN_NAMES, activeCombine, recordHeardTelling, readLoreTies } from '../modules/pie-carries.mjs?v=2026_11_16.B';
import { collectWonder, KIND_SIGIL } from '../modules/almanac.mjs?v=2026_11_16.B';
import { SIGHTINGS, readSightings, recordSighting } from '../modules/sightings.mjs?v=2026_11_05.B';
import { TOTAL_CHAPTERS } from '../modules/book-extent.mjs';
import { CARDS, CARD_TYPES } from './pie-cards.mjs?v=2026_11_11.A';
import { turnCard as shelveCard, cardsTurned } from '../modules/collection.mjs?v=2026_11_16.B';
import { POWER_SPELLS, WORDS, powersInPlay, takePowersFromAddress, readSpells, describePower, visitSpells, setVisitSpells, powersLink, carryProvenance } from './pie-powers.mjs?v=2026_11_09.F';
import { loadRules, readRules, writePower, loadParser } from './pie-spw.mjs?v=2026_11_16.B';
import { CHARACTERS, REASONS, remembers, portraitSVG, identitySpell as characterSpell } from '../modules/characters.mjs?v=2026_11_16.B';
import { placeSVG, tropeEmblemSVG, PLACES, COLORS as PLACE_COLORS } from '../modules/panel-art.mjs?v=2026_11_16.B';
import { renderSpell } from '../modules/spw-spell.mjs?v=2026_11_16.B';
import { createShow, LEGEND } from './pie-show.mjs?v=2026_11_11.A';
import { createHeights, clearance, HEIGHTS_DEFAULTS } from './pie-heights.mjs?v=2026_11_16.B';
import { primeAudio, wapSound, playTone, setSoundPlace, setSoundMood, setSoundRoom, setSoundTilt, markBeat, rhythmHit, rhythmFound, chapterIncipit, chapterCadence, leitmotif, setMusicBed, landQuality, landPulse, approachCue, characterMotif, dimensionFanfare, characterTheme, mimeRest, curtainCall, setThemes, setSoundCarrier, setSoundConfig, setBoardHarmonicState, playBoardMotifCue, setBoardPosition } from './pie-sound.mjs?v=2026_11_16.B';
import { shelfColor, chainSting, tropeMotif, cadenceVoice, foreshadowHear, setSoundScene, setAmbience, sceneMaterial, laneWarning, powerEnding, TEXTURES, setSoundTextures, setSoundFeel, feelSample, auditionChapterProgression } from './pie-sound.mjs?v=2026_11_16.B';
import { TUNING_DOMAINS, DOMAIN_ORDER, patternStep, loadAudioTropes, parseTuningDomains, writeTuningDomains, effectiveDomain } from '../modules/pie-tuning.mjs';
import { VALUE_DEFS, VALUE_IDS, newValueState, noteValueEvent, rankValues, valueBlessing, parallelReflection, recordChapterParallel, readChapterParallels } from '../modules/pie-values.mjs';
import { BUILTIN_STYLES, parseCreatorStyle, formatCreatorStyle, allCreatorStyles, saveCreatorStyle, activeCreatorStyle, setActiveCreatorStyle, styleLineForProvenance } from '../modules/creator-styles.mjs';
import { noteSpark, syncDerivedSparks, bindSiteResonance } from '../modules/intrinsic-rewards.mjs?v=2026_11_16.B';
import { loadLevels, createConductor, foundRhythms, meetsOf, paceAt, BEATS } from './pie-rhythm.mjs?v=2026_11_16.B';
import { loadMotifs } from './pie-tropes.mjs';
import { loadWay, readWay, asideNow, pairFor, takeWayFromAddress } from '../modules/way-through.mjs?v=2026_11_16.B';
import { loadMechanics, open as unlockOpen, earn, standing, unlockWords, mechanics as unlockMechanics, UNLOCK_EVENT } from '../modules/unlocks.mjs?v=2026_11_16.B';
import { planPanels, settlePlan, beatOf } from './pie-panels.mjs?v=2026_11_11.A';
import { IDENTITY, frameFor, shapeOf, SETUP, SETUP_GROUPS, HOLDS, suggestHold, holdMini, boardLine, readBoardLine, ALLOWED } from './pie-frame.mjs?v=2026_11_13.B';
import { sceneVector, handleOf } from './pie/tune/scene.mjs';
import { voicePlan, CARRIER_TUNES } from './pie/tune/personality.mjs';
import { warmthMark, hushMark, hushToast, voiceMark } from './pie/story/eggs.mjs';
import { teachLine, handsLine, leanSentence, jokeOf, nudgeLine } from './pie/menu/teach.mjs';
import { thresholdBranch } from './pie/story/thresholds.mjs';
import { formerLife, grudgeOf, marchWeight, mimeInstead, formerWords, BAKERY_FLOUR } from './pie-mimes.mjs?v=2026_11_11.A';
import { vectorOf, deedsFrom, branchOdds, SCHEME_SIGNATURES, schemeChose, chainStart, chainStep, CHAINS, SHELVES } from '../modules/valence-shelves.mjs?v=2026_11_16.B';
import { reasonFor } from './pie-reasons.mjs?v=2026_11_12.A';
import { createPacer, foldedWords } from './pie-pacing.mjs?v=2026_11_12.A';
import { STAGES, revealStage, noteCrossing, tropeSignals, refrainsFor, loadRhymes } from '../modules/trope-reveal.mjs?v=2026_11_13.B';
import { cadenceOf } from '../modules/spw-cadence.mjs?v=2026_11_16.B';
import { gossipFrom, ANT_KINDS, ANT_SAYS } from './pie-ants.mjs?v=2026_11_11.A';
import { reactionFor, powerMoments, ended as timersEnded, REACTIONS } from './pie-reactions.mjs?v=2026_11_13.B';
import { meet as meetCallback, saving as callbacksSaving, wordsOf as callbackWords, jokeDeed, QUOTED as CALLBACK_CHAPTERS } from './pie-jokes.mjs?v=2026_11_13.B';
import { SEASONS, SEASON_KINDS, SEASON_SAYS, SEASON_EXTRAS, openSeason, standing as seasonStanding, take as takeSeason, receive as receiveKept, keptProblems } from './pie-seasons.mjs?v=2026_11_12.A';
import { orderAsRead } from '../modules/wish-kitchen.mjs?v=2026_11_16.B';
import { initLive, GIFT_ART, BOON_ROSE, liveFound, markLiveFound } from './pie-live.mjs?v=2026_11_13.A';
import { initStoryLane } from './pie-story-lane.mjs?v=2026_11_16.B';
import { initPieDraw } from './pie-draw.mjs?v=2026_11_16.B';
import { initPieSetupUI } from './pie-setup-ui.mjs?v=2026_11_16.B';
import { FINDS, HAGGLE_BEATS, readFind, deedOf, opens as findOpens, take as takeFind } from './pie-finds.mjs?v=2026_11_13.B';
import { icon, iconForGlyph } from '../modules/icons.mjs?v=2026_11_09.G';
import { BIAS_EVENT, initBiasFromURL, loadRegisters, warmBiasParser, biased, setBias, readBias, activeBias, biasLayerNote, biasLink, writeBias } from '../modules/spw-bias.mjs?v=2026_11_16.B';
import {
  BIT_COLORS, CAUSES, CARRIERS, CHAPTER_SCENE, DIMENSIONS_GAINED, EGG_ODDS, HIGH_CLEARS,
  HOP_HANG, hopCurve, INTRO, JUMP_DUR, KNOCKS, LOW, MEET, MINIS, SCENES, SCENE_WHIMSY_DEFAULTS, SCHEMES, SLIPS,
  WHIMSY_DEFAULTS, WIDE, Z, carrierById, carrierStats, drawCarrierLot, pad2,
} from './pie-world.mjs?v=2026_11_16.B';
import {
  W, H, LANES, LANE_W, PLAYER_Y, COBBLE, PRESENCE_Y, ROWS, ROW_H, rowY,
  SLICE_COST, WASTE_COST, FLOUR_GIVES, BERRY_GIVES,
  TROPES_URL, HEARD_KEY, DEEDS_KEY, LORE_URL,
  readStore, readRecord as readStoredRecord, writeRecordWithVisit,
  ROOM_TOTALS, roomsReadIn, discoveries as collectDiscoveries, isUnlocked,
  laneX, clamp, rand, pick, palette, channels, mix
} from './pie/sim/record.mjs';
import {
  RECIPES, INGREDIENT_ROOMS, resolveRecipeBake,
  registerRecipe, unregisterRecipe, listRecipes
} from './pie/sim/recipes.mjs';
import { createAriaMirror } from './pie/sim/aria-mirror.mjs';
import { initThingsRenderer, registerThingRenderer, unregisterThingRenderer } from './pie/render/things.mjs';
import { initCastRenderer, registerCarrierRenderer, unregisterCarrierRenderer } from './pie/render/cast.mjs';
import { initHudRenderer } from './pie/render/hud.mjs';
import { initPieSetup } from './pie/ui/setup.mjs';
import { initPieCards, SPRITES } from './pie/ui/cards.mjs';
import { initPieWorkbench } from './pie/ui/workbench.mjs';
import { initPieInput } from './pie/sim/input.mjs';

export {
  RECIPES, registerRecipe, unregisterRecipe, listRecipes,
  registerThingRenderer, unregisterThingRenderer,
  registerCarrierRenderer, unregisterCarrierRenderer
};

const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const readRecord = () => readStoredRecord({ TEXTURES, ALLOWED });
let visitBoard = null;
const writeRecord = (record) => writeRecordWithVisit(record, visitBoard);

/* ─── The tropes (book/content/world/tropes.json): each card names the trope its thing belongs to, and what
 * the book hands the lanes there; the story and the lanes are strands of one track, crossing both ways. ─── */
const tropeOfKind = new Map();
const tropesAtMoment = new Map();
const tropeById = new Map();
fetch(TROPES_URL).then((res) => (res.ok ? res.json() : null)).then((data) => {
  (data?.tropes || []).forEach((trope) => (trope.faces?.lanes?.kinds || []).forEach((kind) => {
    const had = tropeOfKind.get(kind);
    if (!had || trope.faces.lanes.kinds.length < had.faces.lanes.kinds.length) tropeOfKind.set(kind, trope);
  }));
  (data?.tropes || []).forEach((trope) => {
    tropeById.set(trope.id, trope);
    (trope.faces?.lanes?.moments || []).forEach((moment) => tropesAtMoment.set(moment, [...(tropesAtMoment.get(moment) || []), trope]));
  });
}).catch(() => {});

const marginRumours = [];
fetch('/book/content/world/references.json').then((res) => (res.ok ? res.json() : null)).then((data) => {
  (data?.entries || []).filter((entry) => entry.track?.lanes).forEach((entry) => marginRumours.push(entry));
}).catch(() => {});
function keepDeeds(chapter, deeds) {
  const all = readStore(DEEDS_KEY);
  const had = all[chapter] || {};
  Object.entries(deeds).forEach(([key, n]) => { if (n > 0) had[key] = (had[key] || 0) + n; });
  all[chapter] = had;
  try { window.localStorage.setItem(DEEDS_KEY, JSON.stringify(all)); } catch { /* kept for this visit */ }
}

let lorePromise = null;
const loadLore = () => {
  lorePromise = lorePromise || fetch(LORE_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  return lorePromise;
};
const discoveries = (record) => collectDiscoveries(record, { carriesSummary, readCarries });

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
  const cardModes = card.querySelector('[data-pie-card-modes]');
  const meter = root.querySelector('[data-pie-meter]');
  const auraMeter = root.querySelector('[data-pie-aura]');
  const recipeMeter = root.querySelector('[data-pie-recipe]');
  const toast = root.querySelector('[data-pie-toast]');
  const toastTitle = toast?.querySelector('[data-pie-toast-title]');
  const toastLine = toast?.querySelector('[data-pie-toast-line]');
  let toastTimer = 0;
  const live = root.querySelector('[data-pie-live]');
  const bestOut = document.querySelector('[data-pie-best]');
  const left = root.querySelector('[data-pie-step="-1"]');
  const right = root.querySelector('[data-pie-step="1"]');
  // The panels as arranged for this screen (⚙ Setup › Panels; pie-panels.mjs), and how far down the
  // lanes the caption reaches when it rides them as glass (the lanes' own caption goes under it).
  let panelPlan = null;
  let glassFoot = 0;
  // The board's frame around the world (pie-frame.mjs): the world exactly, unless a full screen is filled.
  let board = IDENTITY;
  let fullOn = false;   // the voyage has the whole display (fullscreen, or the immersive fallback)
  const filling = () => fullOn && setting('fill') === 'fill';
  const fillFrame = () => ctx.fillRect(board.x0, board.y0, board.w, board.h);
  const setting = (key) => { const def = SETUP.find(([k]) => k === key)?.[3]; return record.view[key] ?? def; };
  const pct = (v) => `${Math.round(v * 100)}%`;
  const round2 = (v) => Math.round(v * 100) / 100;
  const nodeOf = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
  const voyage = root.closest('.pie-voyage');
  let likenessMod = null;
  let introMode = false;
  let biasRegisters = {};
  const withCanvasTarget = (nextCtx, nextRun, nextState, fn) => {
    const saved = { ctx, run, state };
    if (nextCtx !== undefined && nextCtx !== null) ctx = nextCtx;
    if (nextRun !== undefined) run = nextRun;
    if (nextState !== undefined && nextState !== null) state = nextState;
    try { return fn(); }
    finally {
      ctx = saved.ctx;
      run = saved.run;
      state = saved.state;
    }
  };
  // The reader's switches, read from where reading-switches.mjs keeps them (its resolved map, as the almanac reads
  // it): this page does not set the data-switch-* attributes the chapters do. Read once, and again on a change.
  let switchValues = null;
  // A ?try= link is an explicit choice for this visit, here as on the chapters (reading-switches.mjs).
  const triedHere = (() => { try { return (new URLSearchParams(location.search).get('try') || '').split(',').map((t) => t.trim()); } catch { return []; } })();
  const switchOn = (id) => {
    if (triedHere.includes(id)) return true;
    if (!switchValues) { try { switchValues = JSON.parse(localStorage.getItem('lore.switches.v1') || 'null')?.resolved || {}; } catch { switchValues = {}; } }
    return switchValues[id] === 'on';
  };
  window.addEventListener('storage', (event) => { if (!event.key || event.key === 'lore.switches.v1') switchValues = null; });
  // The mimes remember (pie-mimes.mjs), a trial: former lives, bakeries, and imaginary panes that are not forgotten.
  const mimesOn = () => switchOn('mimes-remember');
  const voiceOn = () => switchOn('carrier-tune');
  const carrierSpeak = (gesture, x, y) => {
    if (!voiceOn() || !run) return;
    const plan = voicePlan(run.carrier?.id, gesture);
    sfx('voice', plan);
    (run.marks ||= []).push(voiceMark(plan.color, x ?? run.x, y ?? run.y));
  };
  const mimeGrudge = () => grudgeOf(record.mimes?.shattered || 0);
  /* Five shelves (valence-shelves.mjs, .spw/surfaces/shelves.spw), a trial: boon, bane, bone, bonk and honk, weighed from
   * how the reader tuned the genre dial (the nook's genre, boon/bane/bone; bonk and honk even), the semantic handles
   * they chose in Setup (pie/tune/scene.mjs: a jazz feel leans honk, felt steps lean bane), and what this carry has done.
   * Each room the vector is taken again, a shelf held three rooms sets a motivation going, and Mr.
   * BaneWAP's scheme is drawn from odds the shelves tilt. A shelf that crosses the line also opens the character's
   * misreading of that motive (pie/story/thresholds.mjs), once a shelf a carry. */
  // Default on, including a resolved map saved before this switch existed. An explicit off is kept.
  const teachOn = () => {
    if (triedHere.includes('teach-menu')) return true;
    if (!switchValues) { try { switchValues = JSON.parse(localStorage.getItem('lore.switches.v1') || 'null')?.resolved || {}; } catch { switchValues = {}; } }
    if (!Object.prototype.hasOwnProperty.call(switchValues, 'teach-menu')) return true;
    return switchValues['teach-menu'] === 'on';
  };
  const shelvesOn = () => switchOn('shelves');
  // Anthills (pie-ants.mjs), a trial: the torch-ants' hills by the road, their gossip, and their gifts to the crows.
  const anthillsOn = () => switchOn('anthills');
  /* Seasons (pie-seasons.mjs, .spw/surfaces/seasons.spw), a trial: for a few days the land keeps a place by the road,
   * and what the season leaves is one sealed line of Spw. The day is the reader's own clock: nothing in an address
   * or a paste turns it (the smoke test reaches into this closure to do so). */
  const seasonsOn = () => switchOn('seasons');
  // Places (.spw/surfaces/places-in-the-lanes.spw), a trial: each of the six places keeps its own light over the road
  // and its own air (the ground underfoot, the room, a quiet ambience), and a door moves the ear as well as the paint.
  const placesOn = () => switchOn('places');
  // Reactions (.spw/surfaces/reactions-in-the-lanes.spw), a trial: the people of the lanes answer what happens with a
  // face and a deed the narrator says, and remember what earlier carries did. Nobody speaks.
  const reactionsOn = () => switchOn('reactions');
  let seasonClock = () => new Date();
  const SEASONS_KEY = 'lore.pie.seasons.v1';
  const readSeasons = () => readStore(SEASONS_KEY);
  const writeSeasons = (all) => { try { window.localStorage.setItem(SEASONS_KEY, JSON.stringify(all)); } catch { /* kept for this visit */ } };
  const seasonNow = () => {
    if (!seasonsOn()) return null;
    const now = seasonClock();
    const open = openSeason(now);
    if (open) return { season: open, mode: 'open', set: false };
    const mine = readSeasons();
    const kept = SEASONS.find((s) => seasonStanding(s, mine, now) === 'kept');
    return kept ? { season: kept, mode: 'kept', set: false } : null;
  };
  const seasonPower = (text) => Object.values(readSpells(text).powers)[0] || null;
  const shelfTuning = () => {
    try {
      const g = JSON.parse(localStorage.getItem('lore.nook.v1') || 'null')?.genre || {};
      return sceneVector(record.view || {}, g);
    } catch { return sceneVector(record.view || {}, {}); }
  };
  const nudgeFor = (shelf) => {
    const view = record.view || {};
    for (const [key, value] of Object.entries(view)) {
      if (handleOf(key, value)?.shelf === shelf) {
        const nudge = nudgeLine(key, value);
        if (nudge) return nudge;
      }
    }
    return '';
  };
  /* A chain's link acts out its Spw edge with what the lanes already have (valence-shelves.mjs CHAINS), and the edge
   * is shown as it acts: boon brings Mr. BoonWAP to court and the clowns flock; bane makes the next scheme a march; bone
   * measures the road; bonk puts glass ahead, then imaginary glass; honk sounds an echo, and then a rhythm to keep. */
  const CHAIN_VOICE = { boon: 'boon', bane: 'bane', bone: 'wonder', bonk: 'flour', honk: 'wonder' };
  function actOutChain(fired, branch = null) {
    const open = [...Array(LANES).keys()].filter((l) => l !== run.safe);
    const ahead = (kind, lane = pick(open)) => { const t = makeThing(kind, lane); t.y = -60; run.things.push(t); return t; };
    const pair = () => { const l = pick(open.filter((x) => x + 1 < LANES && x + 1 !== run.safe)); return l == null ? null : [l, l + 1]; };
    const link = CHAINS[fired.shelf]?.findIndex((c) => c.line === fired.line) ?? 0;
    // A tuned leg (chapter-tuned) puts ahead only what its chapter has met: the edge is still shown, and said.
    const fits = (kind) => !tunedLeg() || allowed(kind);
    if (fired.shelf === 'boon') {
      if (!run.boon && !run.bane) holdCourt();
      if (link >= 1) { ahead('clown'); ahead('clown'); }
      if (fired.complete) open.slice(0, 3).forEach((l) => ahead('clown', l));
    } else if (fired.shelf === 'bane') {
      if (link === 0 && !run.bane && !run.boon) scheme();
      if (link >= 1) run.marchNext = true;
      if (fired.complete) { const p = pair(); if (p && fits('mime')) { const mime = ahead('mime', p[0]); mime.facing = 1; ahead('mimewall', p[1]); } }
    } else if (fired.shelf === 'bone') {
      const p = pair();
      if (link >= 1 && p && fits('dividers')) { const d = ahead('dividers', p[0]); d.lanes = p; d.x = (laneX(p[0]) + laneX(p[1])) / 2; d.w = LANE_W * 2 - 14; d.h = 22; }
      if (link === 0) run.tags.push({ x: W / 2, y: PRESENCE_Y + 44, t: 0, text: 'A RECEIPT, POSTED' });
    } else if (fired.shelf === 'bonk') {
      if (link === 0 && fits('pane')) ahead('pane');
      if (fired.complete || link >= 1) { const p = pair(); if (p && fits('mime')) { const mime = ahead('mime', p[0]); mime.facing = 1; ahead('mimewall', p[1]); } }
    } else if (fired.shelf === 'honk') {
      spawnRing(run.x, run.y - 30, 34, colors.gold, 0.6);
      setTimeout(() => { if (run) spawnRing(run.x, run.y - 30, 26, colors.gold, 0.45); }, 520);   // the echo, a beat late
      if (link >= 1 || fired.complete) showToast('Something here keeps time', 'Listen for it. Step, hop or throw along with it, and it is yours.', 3400, 'wonder', 1, 'note');
    }
    run.tags.push({ x: W / 2, y: PRESENCE_Y + 28, t: 0, text: fired.line });
    const myopia = branch && branch.shelf === fired.shelf ? ` ${branch.aside}` : '';
    showToast(`${fired.shelf} · ${fired.says}`, `${fired.line}${fired.complete ? ' That chain is complete.' : ''}${myopia}`, myopia ? 4600 : 3400, CHAIN_VOICE[fired.shelf] || '', fired.complete ? 2 : 1, 'chain');
    say(`The ${fired.shelf} shelf: ${fired.says}${fired.complete ? '. That chain is complete.' : '.'}${myopia}`);
    chainSting(fired.shelf, { complete: fired.complete });
    // The link colours the phrase until the shelf lets go, or until the chain completes and the cadence answers it.
    run.motivation = fired.complete ? '' : fired.invokes;
    const who = { boon: 'boon', bane: 'bane', bone: 'bonewap', bonk: 'clown', honk: 'boof' }[fired.shelf];
    if (who && !fired.complete) cadenceVoice(who, cadenceFor(who), { lean: fired.invokes });
  }
  /* Trope development as a mechanic (trope-reveal.mjs): a thing of a trope's kinds, carried past, is a crossing in the
   * lanes; with the trope-reveal trial on, a trope whose stage rises says so (its stage and its Spw) and its motif
   * grows a step (pie-sound.mjs tropeMotif, with a refrain the canon repeats when there is one). */
  const tropeRevealOn = () => switchOn('trope-reveal');
  let rhymesAsked = false;
  // A trope met at a moment of the carry (trope-reveal.mjs LANES_MOMENTS), once a carry: exactly one at the spill,
  // the missing day when Friday arrives, beyond the frame when the end card counts plates.
  function metAt(moment) {
    if (!run) return;
    run.momentsMet = run.momentsMet || {};
    if (run.momentsMet[moment]) return;
    run.momentsMet[moment] = true;
    (tropesAtMoment.get(moment) || []).forEach((trope) => tropeMet(trope));
  }
  function tropeMet(trope) {
    try { noteCrossing(trope.id, 'lanes'); } catch { /* the stage waits */ }
    if (!tropeRevealOn() || !run) return;
    if (!rhymesAsked) { rhymesAsked = true; loadRhymes().catch(() => {}); }
    let reveal = null;
    try { reveal = revealStage(trope, tropeSignals(trope.id, { trope, lean: run.shelfV || null })); } catch { return; }
    if (!reveal) return;
    record.tropeStages = record.tropeStages || {};
    const was = record.tropeStages[trope.id] ?? -1;
    if (reveal.index <= was) return;
    record.tropeStages[trope.id] = reveal.index;
    run.lastTropeStage = reveal.stage;
    writeRecord(record);
    if (was < 0 && reveal.index === 0) return;   // a seed is planted quietly; the hint is the first thing said
    run.tags.push({ x: W / 2, y: 96, t: 0, trope: true, text: `${trope.name} · ${reveal.stage}` });
    // One trope a room is said aloud and heard; the rest rise quietly (their tag, and the carry's sheet).
    if (run.tropeSaidRoom === roomShown) return;
    run.tropeSaidRoom = roomShown;
    const plainTrope = `${reveal.words || ''}${reveal.spw ? ` ${reveal.spw}` : ''}`.trim();
    const tropeLine = biased('reveal.trope', plainTrope, { what: trope.name, where: reveal.stage, seed: reveal.index });
    showToast(`${trope.name} · ${reveal.stage}`, tropeLine, 3800, 'wonder', 2, 'stage');
    let refrain = null;
    try { refrain = (refrainsFor(trope.id) || [])[0] || null; } catch { refrain = null; }
    tropeMotif(trope.id, reveal.index, { refrain });
  }
  /* Characters keep their own time in the lanes (spw-cadence.mjs): each one's own signature read as a loop, a lift on
   * an accent, held still on a rest; the mime mostly still, the figure not at all. Cached; nothing under reduced motion. */
  const cadenceCache = new Map();
  const cadenceFor = (who) => {
    if (!cadenceCache.has(who)) { let c = null; try { c = cadenceOf(characterSpell(who), who, { bars: 1 }); } catch { c = null; } cadenceCache.set(who, c); }
    return cadenceCache.get(who);
  };
  const CADENCE_BEAT = 0.5;   // seconds a beat, unhurried
  const cadenceLift = (who, t) => {
    if (reduced?.matches || who === 'figure') return 0;
    const c = cadenceFor(who);
    if (!c?.steps?.length || !c.length) return 0;
    const pos = (((t / CADENCE_BEAT) % c.length) + c.length) % c.length;
    let step = null;
    for (const st of c.steps) { if (st.at <= pos + 1e-6) step = st; else break; }
    if (!step || step.rest || pos > step.at + step.dur) return 0;
    const into = (pos - step.at) / Math.max(0.05, step.dur);
    return (1 - into) * (step.accent >= 2 ? 1 : step.accent === 1 ? 0.6 : 0.3);
  };
  const withLift = (who, px, draw) => {
    const lift = run ? cadenceLift(who, run.t) * px : 0;
    if (!lift) { draw(); return; }
    ctx.save();
    ctx.translate(0, -lift);
    draw();
    ctx.restore();
  };
  const shelfVector = () => vectorOf({
    shelf: shelfTuning(),
    // The ants' gossip is heard as the honk shelf's echoes (an announcement passed along).
    deeds: deedsFrom(run?.leanWhy || {}, { waps: run?.waps || 0, wasted: run?.wasted || 0, shattered: record.mimes?.shattered || 0, echoes: run?.gossiped || 0 })
  });
  const soundToggle = root.querySelector('[data-pie-sound]');
  const cardLinks = card.querySelector('[data-pie-card-links]');
  const loreOut = document.querySelector('[data-pie-lore]');
  let lore = null;
  const returnLink = document.querySelector('[data-pie-return]');

  let colors = palette();
  let record = readRecord();
  /* A board line written into choices (pie-frame.mjs): the hold first (it sets several), then each term, so a term
   * the line names after its hold wins. With before, what each key held is noted, so a link's line can be held
   * for the visit only (writeRecord keeps the noted values). */
  const applyBoardView = (view, before = null) => {
    const note = (key) => { if (before && !(key in before)) before[key] = record.view[key]; };
    const put = (key, value) => {
      if (key === 'storyAt') { note('story'); note('storyAt'); record.view.story = value !== 'off'; if (value !== 'off') record.view.storyAt = value; return; }
      note(key);
      record.view[key] = value;
    };
    if (view.hold && HOLDS[view.hold]) Object.entries(HOLDS[view.hold].view).forEach(([key, value]) => put(key, value));
    Object.entries(view).forEach(([key, value]) => put(key, value));
  };
  try {
    const carried = new URLSearchParams(window.location.search).get('board');
    if (carried) {
      const { view } = readBoardLine(carried);
      if (Object.keys(view).length) { visitBoard = { before: {}, line: carried }; applyBoardView(view, visitBoard.before); }
    }
  } catch { /* no line, or none that reads: the board as kept */ }
  let state = 'title';     // title | running | paused | spilling | over
  let frame = 0;
  let last = 0;
  let run = null;
  // The side of the lane: how high everything stands and what a hop does (pie-heights.mjs).
  const heightsPanel = root.querySelector('[data-pie-heights]');
  const heights = createHeights({ panel: heightsPanel, config: () => record.view.heightsCfg });
  // The show: the last interactions in a window, or the lanes as a board (pie-show.mjs).
  const show = createShow({
    canvas,
    insetFigure: root.querySelector('[data-pie-show-inset]'),
    reelList: document.querySelector('[data-pie-show-reel]'),
    env: { W, H, LANES, LANE_W, PLAYER_Y, ROWS, ROW_H, PRESENCE_Y, Z, LOW, HIGH_CLEARS, KNOCKS, reduced, frame: () => board, nameOf: (t) => (t.wonder?.name || CARDS[t.kind]?.name || t.kind).replace(/^(A|An|The) /, '') }
  });

  const say = (text) => { if (live) live.textContent = text; };
  // Every sound is panned to where it happened: the carrier, unless something else is said to be the source.
  // Narrow on purpose (was 0.7): a step across the lanes leans the sound, it does not move it into one ear.
  const panOf = (x) => (Number.isFinite(x) ? (x / W) * 2 - 1 : run ? (run.x / W) * 2 - 1 : 0) * 0.4;
  // ... and back by how far up the lanes it is: at the carrier, near; at the top of the lanes, far.
  const depthOf = (y) => (Number.isFinite(y) ? clamp((PLAYER_Y - y) / (PLAYER_Y - 40), 0, 1) : 0);
  const sfx = (kind, param, x, y) => { if (record.sound) playTone(kind, param, panOf(x), depthOf(y)); };
  /* The lanes keep time (pie-rhythm.mjs): each chapter's level (.spw/runtime/pie-levels.spw) sets its tempo, key
   * and motif; rows come on its beats; one room keeps a rhythm, found by playing along. */
  let levelData = { levels: {}, rhythms: {} };
  const conductor = createConductor({ onFound: (r) => foundRhythm(r) });
  loadLevels().then((data) => {
    levelData = data;
    meetsAt = meetsOf(data.levels);
    conductor.setLevels(data);
    if (run?.chapter) conductor.setChapter(run.chapter, data.levels[run.chapter]);
  });
  /* How each leg plays as its chapter develops it (pie-levels.spw: &meets, &kinds, @cast, !schemes, ~pace, %egg, ^beat),
   * a trial (chapter-tuned): what a leg brings in first, the mix it keeps in its own place, who may come and which of
   * his schemes, how taut it is through its length, and whether the Egg is passed. With the trial off, a term left out,
   * or the levels not read yet, the game keeps its own rule. A beat is read either way: the lines say where it plays. */
  let meetsAt = null;
  const tunedOn = () => switchOn('chapter-tuned');
  const linesRead = () => Object.keys(levelData.levels).length > 0;
  const tunedLeg = (n = run?.chapter) => (tunedOn() ? levelData.levels[n]?.leg || null : null);
  const beatHere = (beat) => (linesRead() ? levelData.levels[run?.chapter]?.leg?.beat === beat : run?.chapter === BEATS[beat]);
  const tunedIntro = (kind) => (tunedOn() && meetsAt && kind in meetsAt ? meetsAt[kind] : null);
  const introOf = (kind) => tunedIntro(kind) ?? INTRO[kind];
  // Who a leg's cast leaves out stays out, whatever was met before: after his turn, a regular has met him long since.
  const castBars = (who) => Boolean(tunedLeg()?.cast) && !tunedLeg().cast.includes(who);
  // How taut the leg is here (0..1): its ~pace through its length, or the straight build every leg had.
  const legTension = () => { const p = progress(); const pace = tunedLeg()?.pace; return pace?.length ? paceAt(pace, p) : p; };
  /* Whose it is: each character's theme (.spw/runtime/audio-tropes.spw), and the reader's way through (way-through.mjs). */
  loadMotifs().then((motifs) => setThemes(motifs));
  takeWayFromAddress();
  let wayData = null;
  let way = readWay();
  if (way.source !== 'off') loadWay().then((data) => { wayData = data; way = readWay(); });
  const asideList = () => (wayData ? asideNow(way, wayData) : way.aside);
  const keptApart = (...who) => Boolean(wayData && pairFor(who, wayData, way));
  const droppedKinds = () => new Set((wayData?.pairs || []).filter((p) => way.apart.includes(p.id)).flatMap((p) => p.lanes?.drop || []));
  const themesOn = () => setting('themes') === 'themes';
  /* Where the book has the two pies in one room, the lanes let the second answer the first, a bar later and far off. */
  const SHARED_ROOMS = new Set([6, 10, 12]);
  const THEME_OF = Object.freeze({ boon: 'boonwap', bane: 'banewap' });
  const CHAPTER_THEME = Object.freeze({ genie: 'genie', clowns: 'clown', hall: 'bonewap', thursday: 'ants', porter: 'porter' });
  const heardTheme = (who) => { if (run && !run.heardThemes.includes(who)) run.heardThemes.push(who); };
  const voiced = (who, pan = 0, opts = {}) => {
    if (!record.sound) return;
    const theme = THEME_OF[who] || who;
    const other = who === 'boon' ? 'banewap' : who === 'bane' ? 'boonwap' : '';
    const answer = other && SHARED_ROOMS.has(run?.chapter) && !keptApart('boon', 'bane') ? other : '';
    if (themesOn() && characterTheme(theme, pan, { ...opts, answer })) heardTheme(theme);
    else characterMotif(who, pan, opts);
  };
  /* How a chapter is heard to lean: the reader's own lens first, then what their carries left there. */
  const leanHeard = (n) => {
    if (!themesOn()) return '';
    try {
      const nook = JSON.parse(window.localStorage.getItem('lore.nook.v1') || '{}') || {};
      if (['boon', 'bane', 'bone'].includes(nook.lens)) return nook.lens;
      if (nook.lens === 'balanced') return '';
    } catch { /* their carries, then */ }
    return carryFor(n) ? leanOf(carryFor(n).lean) : '';
  };
  const heardAct = (kind) => {
    const heard = conductor.act(kind);
    if (heard?.on && heard.onCount >= 2 && run) {
      const glyph = heard.accuracy === 'perfect' ? '♬' : '♪';
      run.tags.push({ x: run.x, y: run.y - 40, t: 0, text: glyph.repeat(Math.min(3, Math.max(1, heard.onCount - 1))) });
      if (heard.accuracy === 'perfect') spawnRing(run.x, run.y - 8, 16, colors.gold, 0.32);
    }
    // In the pocket (an unlock): on a hit of the chapter's own found rhythm, anywhere in the chapter.
    const pock = run && state === 'running' && unlockOpen('in_the_pocket') ? conductor.pocket() : null;
    if (pock) {
      lean('pocket');
      run.tags.push({ x: run.x + 18, y: run.y - 58, t: 0, text: pock.accuracy === 'perfect' ? '♬' : '♪' });
      if (pock.strong) spawnRing(run.x, run.y - 10, 18, colors.gold, 0.35);
    }
  };
  // Mechanics unlocked by weight (unlocks.mjs): said once, when kept.
  const unlockSaid = (list) => list.forEach((m, i) => setTimeout(() => showToast(`Unlocked · ${m.name}`, `${m.says} (lore.land/pie/unlocks/${m.page}/)`, 5200, 'wonder', 2), i * 5600));
  loadMechanics().then(() => { unlockSaid(earn()); paintBias(); });
  function foundRhythm(r) {
    if (record.sound) rhythmFound(r);
    showToast(`♪ A rhythm found · ${r.name}`, `${r.says} It plays under the carry from now on (⚙ Setup › Music and rhythm).`, 5200, 'wonder', 2);
    if (run) run.tags.push({ x: W / 2, y: 120, t: 0, text: `♪ ${r.name.toUpperCase()} ♪` });
    beat();
    setTimeout(() => unlockSaid(earn()), 5600);
  }
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
    // Filling a screen, the canvas is the screen's own shape and the world stands in it on the ground, clear
    // of every overlay (pie-frame.mjs); otherwise the canvas is the world's shape and shows it exactly.
    board = filling() && box.width > 40 && box.height > 40 ? frameForFill(box) : IDENTITY;
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round((board.filled ? box.height : box.width * (H / W)) * ratio);
    const sx = canvas.width / board.w;
    const sy = canvas.height / board.h;
    ctx.setTransform(sx, 0, 0, sy, -board.x0 * sx, -board.y0 * sy);
    if (cabinetVoyage) {
      cabinetVoyage.dataset.shape = board.filled ? board.shape : shapeOf(window.innerWidth, window.innerHeight);
      if (board.filled) {
        // Where the world stands in the screen, for overlays that go with it rather than with the screen's edges.
        cabinetVoyage.style.setProperty('--world-top', `${Math.round(-board.y0 * board.s)}px`);
        cabinetVoyage.style.setProperty('--world-bottom', `${Math.round((board.y0 + board.h - H) * board.s)}px`);
        cabinetVoyage.style.setProperty('--world-side', `${Math.round(-board.x0 * board.s)}px`);
      }
    }
    draw();
  };
  /* A filled screen's frame. Held up, the caption sits under the switches in the haze; when there is not haze enough,
   * the world steps down for it if that costs the lanes little (8% at most), and otherwise the caption rides the far
   * end of the road as glass. */
  function frameForFill(box) {
    const reserve = fillReserve(box);
    const share = setting('share');
    let frame = frameFor({ box: { w: box.width, h: box.height }, reserve, share });
    const cap = screenBox?.querySelector(':scope > .pie-caption');
    if (cap && cap.offsetParent && box.width <= box.height * 1.15) {
      const foot = cap.getBoundingClientRect().bottom - box.top + 6;
      if (foot > reserve.top) {
        const under = frameFor({ box: { w: box.width, h: box.height }, reserve: { ...reserve, top: foot }, share });
        if (under.s >= frame.s * 0.92) frame = under;
      }
    }
    return frame;
  }
  /* What a filled screen keeps clear for its overlays, in px from each edge, measured where they stand: the
   * switches along the top; the buttons along the foot when the screen is held up, at the sides when it is on
   * its side. The glass caption is not counted: it rides the haze when there is haze enough, and the far end of
   * the road (where nothing is near yet) when there is not. */
  function fillReserve(box) {
    const reserve = { top: 0, bottom: 0, left: 0, right: 0 };
    const across = box.width > box.height * 1.15;
    const tools = root.querySelector('.pie-tools');
    const visible = (el) => el && el.offsetParent && el.getBoundingClientRect().width > 0;
    if (visible(tools)) {
      const r = tools.getBoundingClientRect();
      if (r.height > r.width) {
        // A rail: it stands at one side.
        if (r.left - box.left < box.width / 2) reserve.left = Math.max(reserve.left, r.right - box.left);
        else reserve.right = Math.max(reserve.right, box.right - r.left);
      } else reserve.top = Math.max(reserve.top, r.bottom - box.top);
    }
    root.querySelectorAll('.pie-screen .pie-steps .pie-step, .pie-screen .pie-thumbs').forEach((el) => {
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      const mid = (r.left + r.right) / 2 - box.left;
      if (across && mid < box.width / 3) reserve.left = Math.max(reserve.left, r.right - box.left + 4);
      else if (across && mid > (box.width * 2) / 3) reserve.right = Math.max(reserve.right, box.right - r.left + 4);
      else reserve.bottom = Math.max(reserve.bottom, box.bottom - r.top + 4);
    });
    return reserve;
  }

  /* ─── A run: a voyage through the chapters ─── */
  const firstChapter = (() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const asked = Number(q.get('chapter'));
      if (asked >= 1 && asked <= TOTAL_CHAPTERS) return asked;
      const came = q.get('from') || document.referrer || '';
      const segue = segueFor(q.get('scene'), came);
      if (segue) return segue.chapter;
      const chapter = /\/book\/chapter\/(\d{2})\//.exec(came);
      if (chapter) return Number(chapter[1]);
    } catch { /* from the beginning */ }
    return 1;
  })();
  let chosenStartChapter = firstChapter;
  let audioTropes = { patterns: {}, timbres: {}, bindings: {} };
  const TUNING_KEY = 'lore.pie.tuning.v1';
  const readSavedTuning = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(TUNING_KEY) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch { return {}; }
  };
  let savedTuningDomains = readSavedTuning();
  let tuningDomains = { ...savedTuningDomains, ...parseTuningDomains(visitSpells()) };
  const keepTuningDomains = () => {
    try { localStorage.setItem(TUNING_KEY, JSON.stringify(Object.fromEntries(DOMAIN_ORDER.map((id) => [id, effectiveDomain(id, savedTuningDomains)])))); } catch { /* this visit only */ }
  };
  let chosenIntention = '';
  let creatorStyle = activeCreatorStyle();
  const domainTune = (domainId) => effectiveDomain(domainId, tuningDomains);
  const fresh = (carrier = drawCarrierLot(), startChap = chosenStartChapter) => ({
    heardThemes: [],
    carrier,
    charm: activeCombine(),
    values: newValueState(chosenIntention),
    intention: chosenIntention,
    style: creatorStyle,
    cleanSteps: 0,
    stepBeat: 0,
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
    eggs: 0,
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
    feed: [],
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
    t: 0,
    lastClimb: -9,
    stepBuffer: null,
    jazzPocketT: 0,
    jazzChain: 0,
    autoHopCharges: 0,
    autoHopUsed: false,
    roomPantryT: 0,
    pantryHeard: new Set(),
    recipe: { id: 'warm', charges: 0, earnedAt: -9 },
    motifState: { tension: '', tensionLevel: 0, safeDir: 0, hopHint: false, armedAt: -9, resolvedCount: 0, lastCueAt: -9, stepIdx: 0 }
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
    // Rooms read in this chapter: the pie knows the way here (up to a third steadier).
    const knownBonus = 1 + Math.min(0.32, roomsReadIn(run.chapter) * 0.04);
    const tunePoise = domainTune('arcs').recovery_grace || 1;
    return run.carrier.settle * figureBonus * charmBonus * fedBonus * knownBonus * Number(tunePoise);
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
  const tally = (key, k = 1, why = '') => {
    if (!run?.tally) return;
    run.tally[key] += k;
    // The contest is said where it happened, with why (lean() says the three ways itself).
    if (key === 'wap' || key === 'maw') noteFeed({ side: key, pts: k, word: CONTEST_ONE[why] || '' });
  };
  /* The three ways a chapter develops, and what moves it each way (=lean{} in pie-rules.spw; these
   * defaults until the rules are read). Each event leans its category by its weight and is counted,
   * so the chapter can say why it leans the way it does. Contest tallies (wap, maw) stay apart. */
  const LEAN_DEFAULTS = Object.freeze({
    satisfied: ['boon', 1], shared: ['boon', 1], kept: ['boon', 1], egg: ['boon', 1], sweetened: ['boon', 0.6],
    boonberry: ['boon', 0.4], furrow: ['boon', 0.3], sighting: ['boon', 0.6], boonwap: ['boon', 0.3], boof: ['boon', 0.5],
    knocked: ['bane', 1], boxed: ['bane', 0.8], bane_fed: ['bane', 0.6], scheme_ran: ['bane', 1], foretold: ['bane', 0.8],
    flinched: ['bane', 0.6], let_past: ['bane', 0.3],
    perfect: ['bone', 1], over_mimes: ['bone', 1], ramp: ['bone', 0.6], hop_clear: ['bone', 0.5], deft: ['bone', 0.6],
    caught: ['bone', 0.5], boneberry: ['bone', 0.6], foiled: ['bone', 1], squashed: ['bone', 0.4], ahead: ['bone', 0.3],
    aimed: ['bone', 0.3], alley: ['bone', 0.6], parade: ['boon', 0.6], long_view: ['bone', 0.6], in_time: ['bone', 0.5], pocket: ['bone', 0.3], read: ['boon', 0.2], cast: ['bone', 0.5],
    // What a season or a stream sends counts only when hands take it: a dolphin ridden, a donut eaten, a boon rose
    // kept, a wilted rose walked through, a thing the other side sent hopped. A gift landing leans nothing.
    dolphin: ['boon', 0.5], boonrose: ['boon', 0.5], wilted: ['boon', 0.3], donut: ['bone', 0.3], turned: ['bone', 0.6]
  });
  const LEAN_WORDS = Object.freeze({
    satisfied: 'clowns satisfied', shared: 'slices shared', kept: 'wonders kept', egg: 'the warm thing passed', sweetened: 'baneberries sweetened',
    boonberry: 'boonberries', furrow: 'warm furrows', sighting: 'strokes noticed', boonwap: 'Mr. BoonWAP held court', boof: 'brushes past Boof',
    knocked: 'knocks', boxed: 'slices boxed', bane_fed: 'baneberries fed to him', scheme_ran: 'schemes run', foretold: 'foretellings come true',
    flinched: 'flinches', let_past: 'baneberries let past',
    perfect: 'perfect throws', over_mimes: 'over the mimes', ramp: 'ramps', hop_clear: 'hops clean', deft: 'deft landings',
    caught: 'tilts caught', boneberry: 'boneberries', foiled: 'Mr. BaneWAP foiled', squashed: 'foretellings left unsaid', ahead: 'moments up the lanes',
    aimed: 'arrows followed', alley: 'vane alleys', parade: 'parades', long_view: 'long views', in_time: 'hops in time', pocket: 'moves in the pocket', read: 'words read underfoot', cast: 'rooms cast',
    dolphin: 'dolphins ridden', boonrose: 'boon roses kept', wilted: 'wilted roses walked through', donut: 'donuts eaten', turned: 'what the other side sent, hopped'
  });
  let leanRules = {};
  // A find leans the way its own line says (=lean[…], pie-finds.mjs), under its deed's name (find_<id>).
  const leanRow = (event) => leanRules[event] || LEAN_DEFAULTS[event] || FIND_LEANS[event] || [];
  const leanWord = (event) => LEAN_WORDS[event] || FIND_WORDS[event] || event.replace(/_/g, ' ');
  const lean = (event, n = 1) => {
    if (!run?.tally) return;
    noteValueEvent(run.values, event, n);
    const [cat, w] = leanRow(event);
    if (!cat) return;
    tally(cat, w * n);
    noteFeed({ cat, pts: w * n, event, word: LEAN_ONE[event] || leanWord(event) });
    if (event !== 'cast') castIfRoomAsks(event);
    // Every event of the leg is a deed the book's margins may count (keepDeeds, references.mjs).
    if (run.legEvents) run.legEvents[event] = (run.legEvents[event] || 0) + n;
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
  /* ─── Points, as they came: every lean and every point in the contest is said where it happened ───
   * One interaction (a clown satisfied, a knock, a slice over the mimes) can move more than one tally
   * at once; whatever moves in the same moment is one entry, placed where its impact was, so a chip
   * can rise from that spot, the show can take a still of it, and the panel can say it in words. */
  const LEAN_GLYPH = Object.freeze({ boon: '✿', bane: '✺', bone: '✦' });
  const LEAN_INK = Object.freeze({ boon: '#c98a1e', bane: '#8a4fb0', bone: '#5f8696' });
  const LEAN_ONE = Object.freeze({
    satisfied: 'a clown satisfied', shared: 'a slice shared', kept: 'a wonder kept', egg: 'the warm thing passed', sweetened: 'a baneberry sweetened',
    boonberry: 'boonberries', furrow: 'a warm furrow', sighting: 'a stroke noticed', boonwap: 'Mr. BoonWAP held court', boof: 'a brush past Boof',
    knocked: 'a knock', boxed: 'a slice boxed', bane_fed: 'a baneberry fed to him', scheme_ran: 'a scheme run', foretold: 'a foretelling come true',
    flinched: 'a flinch', let_past: 'a baneberry let past', perfect: 'a perfect throw', over_mimes: 'over the mimes', ramp: 'off a ramp',
    hop_clear: 'a clean hop', deft: 'a deft landing', caught: 'a tilt caught', boneberry: 'a boneberry', foiled: 'Mr. BaneWAP foiled',
    squashed: 'a foretelling left unsaid', ahead: 'up the lanes, ahead', aimed: 'an arrow followed', alley: 'Vane Alley', parade: 'The Parade', long_view: 'The Long View', in_time: 'a hop in time', pocket: 'in the pocket', read: 'a word read underfoot', cast: 'a room cast',
    dolphin: 'a dolphin ridden', boonrose: 'a boon rose kept', wilted: 'a wilted rose walked through', donut: 'a donut eaten', turned: 'a thing the other side sent, hopped'
  });
  /* The contest with Mimes Against WAP: what scores for the pie, and what for the mimes. */
  const CONTEST = Object.freeze({
    wap: [['over_mimes', 1, 'a slice lofted over the mimes'], ['sweetened', 1, 'a baneberry sweetened'], ['satisfied', 0.5, 'a clown satisfied'], ['foiled', 2, 'Mr. BaneWAP foiled']],
    maw: [['boxed', 1, 'a slice boxed by a mime or a march'], ['mime_knock', 1, 'a knock from a mime, their wall or a march'], ['brought', 1, 'a baneberry the mimes brought him'], ['march_past', 1, 'a march let past unanswered'], ['march_ran', 2, 'a march scheme run its course']]
  });
  const CONTEST_ONE = Object.freeze(Object.fromEntries([...CONTEST.wap, ...CONTEST.maw].map(([id, , words]) => [id, words])));
  const fmtPts = (n) => {
    const r = Math.round(n * 100) / 100;
    if (Number.isInteger(r)) return String(r);
    if (Math.abs(r * 2 - Math.round(r * 2)) < 1e-6) return `${Math.floor(r) || ''}½`;
    return r.toFixed(1);
  };
  let feedSeen = 0;
  function noteFeed(part) {
    if (!run) return;
    let entry = run.feed[run.feed.length - 1];
    if (!entry || run.t - entry.t > 0.08) {
      entry = { t: run.t, x: run.x, y: run.y - 26, parts: {}, contest: {}, words: [], events: [], chapter: run.chapter, n: ++feedSeen, ref: roomRef() };
      run.feed.push(entry);
      if (run.feed.length > 60) run.feed.shift();
      queueMicrotask(() => { if (run?.feed.includes(entry)) { showFeed(entry); paintPointsSoon(); } });
    }
    if (part.word && !entry.words.includes(part.word)) entry.words.push(part.word);
    if (part.event) entry.events.push(part.event);
    if (part.cat) entry.parts[part.cat] = (entry.parts[part.cat] || 0) + part.pts;
    if (part.side) entry.contest[part.side] = (entry.contest[part.side] || 0) + part.pts;
    // The whole carry's sums, for the card at the spill.
    const key = part.cat || part.side;
    if (key) {
      run.points = run.points || {};
      run.points[key] = (run.points[key] || 0) + part.pts;
      if (part.word && part.cat) {
        run.pointWords = run.pointWords || {};
        run.pointWords[part.word] = (run.pointWords[part.word] || 0) + 1;
      }
    }
  }
  /** One entry as words and chips: what happened, and what it was worth. */
  function captionOf(entry) {
    const chips = [
      ...Object.entries(entry.parts).map(([cat, pts]) => ({ cat, text: `${LEAN_GLYPH[cat]} +${fmtPts(pts)} ${LEAN_NAMES[cat]}` })),
      ...Object.entries(entry.contest).map(([side, pts]) => ({ cat: side, text: `${side === 'wap' ? 'pie' : 'mimes'} +${fmtPts(pts)}` }))
    ];
    const words = entry.words.join(', ') || 'something happened';
    const line = `${words.charAt(0).toUpperCase()}${words.slice(1)}${chips.length ? ` · ${chips.map((c) => c.text).join(' · ')}` : ''}`;
    // In a register, the moment is also said that way (bias × show); the plain words and points stay.
    const top = Object.entries(entry.parts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const register = top ? biased(`points.${top}`, '', { what: words, seed: entry.n }) : '';
    return { words: `${words.charAt(0).toUpperCase()}${words.slice(1)}`, chips, line, register };
  }
  /* A chip rises from where it happened: the way it leaned, in its ink. Quiet in zen. */
  const drawPoints = () => {
    if (!run?.feed?.length || record.view.zen) return;
    const calm = reduced?.matches;
    ctx.save();
    ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    run.feed.slice(-6).forEach((entry) => {
      const age = run.t - entry.t;
      if (age < 0 || age > 1.3) return;
      if (entry.events.length && entry.events.every((e) => e === 'ahead')) return;   // the HUD says this one
      const bits = [
        ...Object.entries(entry.parts).map(([cat, pts]) => [`${LEAN_GLYPH[cat]}+${fmtPts(pts)}`, LEAN_INK[cat]]),
        ...Object.entries(entry.contest).map(([side, pts]) => [`${side === 'wap' ? 'pie' : 'mimes'}+${fmtPts(pts)}`, side === 'wap' ? colors.accent : '#7a3f9a'])
      ];
      if (!bits.length) return;
      const widths = bits.map(([text]) => ctx.measureText(text).width + 10);
      const total = widths.reduce((a, b) => a + b, 0) + (bits.length - 1) * 3;
      let x = clamp(entry.x - total / 2, 4, W - total - 4);
      const y = entry.y + 18 - (calm ? 0 : age * 26);
      ctx.globalAlpha = Math.min(1, (1.3 - age) / 0.4);
      bits.forEach(([text, ink], i) => {
        ctx.fillStyle = 'rgba(255, 252, 244, 0.92)';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(x, y - 7, widths[i], 14, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = ink;
        ctx.textAlign = 'center';
        ctx.fillText(text, x + widths[i] / 2, y + 0.5);
        x += widths[i] + 3;
      });
    });
    ctx.restore();
  };
  /* ─── Rooms in the lanes: the story's own events shape the play, and the play can cast a room ───
   * Every room has a Spw signature, and its sigil says what kind of room it is. While a room passes,
   * the lanes lean its way: its own things come up more often, blending into the next room's as the
   * passage nears it (a gradient, not a switch). And every sigil has a verb: do the room's verb while it
   * passes and the room is cast, kept in lore.rooms.cast.v1, and shown beside the room on the page.
   * Each outcome in the lanes is also an outcome in Spw: what it asked (?), what it measured (%), the
   * bias it returns (= toward a way of reading) and where in the story it happened (~ the room). */
  const ROOM_PLAY = Object.freeze({
    '!': { kinds: ['post', 'stone', 'spool'], verb: 'struck', events: ['satisfied', 'perfect', 'foiled'], says: 'things strike here: more comes at you', how: 'give a clown its WAP while the room passes' },
    '?': { kinds: ['baneberry', 'snail'], verb: 'answered', events: ['squashed', 'sweetened', 'in_time'], says: 'a room of questions: foretellings come up the lanes', how: 'squash or sweeten a baneberry, or hop in time' },
    '~': { kinds: ['berry', 'furrow'], verb: 'taken', events: ['boonberry', 'furrow', 'kept'], says: 'a room of what might be: boonberries and warm furrows', how: 'take boonberries, or a warm furrow' },
    '@': { kinds: ['pigeon', 'vane'], verb: 'seen', events: ['sighting', 'boof', 'boonwap'], says: 'a room seen from somewhere: watchers and weathercocks', how: 'notice someone: brush past Boof, or catch the figure' },
    '&': { kinds: ['clown', 'clerk', 'subject'], verb: 'joined', events: ['shared', 'satisfied'], says: 'a room of meetings: people to share with', how: 'share a slice, or satisfy a clown' },
    '*': { kinds: ['boneberry', 'berry'], verb: 'kept', events: ['kept', 'boneberry', 'egg'], says: 'a room of what is valued: things worth keeping', how: 'keep a wonder, or eat a boneberry' },
    '^': { kinds: ['pile', 'arrow'], verb: 'lifted', events: ['ramp', 'over_mimes', 'in_time'], says: 'a room that rises: ramps of flour and arrows', how: 'throw off a ramp, or hop in time' },
    '#': { kinds: ['arrow', 'vane', 'banner'], verb: 'marked', events: ['aimed', 'read'], says: 'a room of signs: arrows, vanes and words', how: 'follow an arrow, or read a glowing word underfoot' },
    '.': { kinds: ['stone', 'hole', 'snail'], verb: 'let go', events: ['hop_clear', 'deft'], says: 'a room of ground: stones and holes', how: 'hop something clean' },
    '=': { kinds: ['mime', 'pane'], verb: 'tuned', events: ['caught', 'over_mimes'], says: 'a room of rules: mimes and their walls, Bonk glass', how: 'catch the pie as it leans, or throw over the mimes' },
    '%': { kinds: ['clerk'], verb: 'measured', events: ['perfect', 'satisfied'], says: 'a room of measures: feast clerks with their slips', how: 'make a perfect throw' },
    '$': { kinds: ['sack', 'pile'], verb: 'made', events: ['boneberry', 'ramp', 'caught'], says: 'a room made of something: flour, sacks and what they make', how: 'eat a boneberry, or throw off a ramp' }
  });
  const CAST_KEY = 'lore.rooms.cast.v1';
  const readCasts = () => { try { return JSON.parse(window.localStorage.getItem(CAST_KEY) || '{}') || {}; } catch { return {}; } };
  /* The page's anchor for a room: its own id, or the build's slug of its title. */
  const roomAnchor = (para) => para?.id || (para?.title ? para.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '');
  /* The room passing now: its number, signature, sigil, how far through it the carry is, and the next one. */
  function roomNow() {
    const at = passing();
    if (!at?.para?.room) return null;
    const { leg, i, para } = at;
    let first = i;
    let last = i;
    while (first > 0 && leg.paras[first - 1].sec === para.sec) first -= 1;
    while (last < leg.paras.length - 1 && leg.paras[last + 1].sec === para.sec) last += 1;
    const span = Math.max(1, last - first + 1);
    const n = leg.paras.length;
    const within = clamp(progress() * n - first, 0, span) / span;
    const nextPara = leg.paras.slice(last + 1).find((p) => p.room);
    // The page gives a titled room an anchor from its title (the build's slug), when it has no id of its own.
    const anchor = roomAnchor(para);
    return { chapter: leg.n, n: para.roomNo, sig: para.room, sigil: para.room.charAt(0), title: para.title, id: anchor, within, next: nextPara ? nextPara.room.charAt(0) : null };
  }
  const roomRef = () => { const r = roomNow(); return r ? { chapter: r.chapter, n: r.n, sig: r.sig, sigil: r.sigil, id: r.id } : null; };
  /* The gradient: a thing of the room's own kinds, now and then, weighted toward the next room's as it nears. */
  function roomThing(free) {
    const r = roomNow();
    if (!r || !free.length) return null;
    const blend = r.within > 0.7 && r.next ? (r.within - 0.7) / 0.3 : 0;   // the last third leans into what is next
    const sigil = Math.random() < blend ? r.next : r.sigil;
    const play = ROOM_PLAY[sigil];
    if (!play || Math.random() > 0.3) return null;
    const kinds = play.kinds.filter((kind) => allowed(kind) && !WIDE.has(kind));
    return kinds.length ? makeThing(pick(kinds), pick(free)) : null;
  }
  /* Casting: the room's verb, done while it passes. Once a carry, once a room; kept for the page. */
  function castIfRoomAsks(event) {
    const r = roomNow();
    const play = r && ROOM_PLAY[r.sigil];
    if (!play || !play.events.includes(event) || !r.n) return;
    run.castThisCarry = run.castThisCarry || new Set();
    const key = `${r.chapter}:${r.n}`;
    if (run.castThisCarry.has(key)) return;
    run.castThisCarry.add(key);
    const casts = readCasts();
    const isNew = !casts[r.chapter]?.[r.n];
    casts[r.chapter] = casts[r.chapter] || {};
    casts[r.chapter][r.n] = { verb: play.verb, by: event, sig: r.sig, at: new Date().toISOString().slice(0, 10) };
    try { window.localStorage.setItem(CAST_KEY, JSON.stringify(casts)); } catch { /* kept for the visit */ }
    record.roomsCast = record.roomsCast || {};
    record.roomsCast[r.sigil] = (record.roomsCast[r.sigil] || 0) + (isNew ? 1 : 0);
    writeRecord(record);
    lean('cast');
    sfx('room_cast', r.n);
    playBoardMotifCue({ action: 'story', kind: 'room_cast', motif: r.sigil });
    noteSpark('room_cast', { chapter: r.chapter, room: r.n, verb: play.verb });
    run.tags.push({ x: run.x, y: run.y - 120, t: 0, text: `ROOM ${r.n} CAST: ${play.verb.toUpperCase()}` });
    impact('combo', W / 2, 150, { scale: 0.7, word: `${r.sigil} ${play.verb.toUpperCase()}!` });
    showToast(`Room ${r.n} cast · ${play.verb}`, `${r.sig}${r.title ? ` — ${r.title}` : ''}. ${isNew ? 'Kept on the chapter page, beside the room.' : 'Cast again.'}`, 3200, 'wonder', 2);
  }
  /* Entering a room: its banner, by how well its sigil is known. Syntax (its signature) always; semantics
   * (what the sigil makes of the lanes) once a room of that sigil has passed before; pragmatics (how to
   * cast it) from the third such room, or as soon as one has been cast. */
  /* Texture finds (texture-finds.mjs), a trial: with it on, a room that answers one of the maker's pieces on
   * texture.website, or a carry's end, may find one, at most one a carry. It is said in the caption, and its address
   * is ?/texture.website/*<piece>, where the scan is shown from spwashi.com. Off, nothing is loaded. */
  const findsOn = () => switchOn('texture-finds');
  let findsMod = null;
  async function textureFind(moment) {
    if (!findsOn()) return null;
    try {
      findsMod = findsMod || await import('../modules/texture-finds.mjs?v=2026_11_11.A');
      return await findsMod.findMoment(moment);
    } catch { return null; }
  }
  const findSaid = (found) => {
    if (!found) return;
    showToast('A piece turns up', `${found.piece.title}, near ${found.via}. It is on texture.website now.`, 3400, 'wonder', 1);
    say(`A piece turns up: ${found.piece.title}. It is on texture.website now.`);
  };
  /* Run into an anthill: the ants put their crumbs down, lift weights, and gossip, a few words from further on in the
   * chapter (pie-ants.mjs). A bump, not a spill; heard as the honk shelf, and a whisper when the shelves are on. */
  function anthillBump(hill) {
    hill.bumped = true;
    sfx('anthill', 0, hill.x, hill.y);
    hill.liftAt = run.t;
    run.wobble = Math.min(1.2, run.wobble + 0.12);
    const at = passing();
    const scrap = at ? gossipFrom(at.leg.paras, { from: at.i }) : null;
    run.gossiped = (run.gossiped || 0) + 1;
    run.gossipAt = run.t;
    hill.scrap = scrap ? { ...scrap, chapter: at.leg.n } : null;
    run.tags.push({ x: hill.x, y: hill.y - 24, t: 0, text: shelvesOn() ? 'THE ANTS GOSSIP · A WHISPER' : 'THE ANTS GOSSIP' });
    if (scrap) run.tags.push({ x: W / 2, y: hill.y - 44, t: 0, text: scrap.text.slice(0, 44) });
    say(`${ANT_SAYS.bump}${scrap ? `: ${scrap.text}` : '.'}`);
  }
  /* Someone answers a moment (pie-reactions.mjs): a face in the meanwhile panel, in a mood, and what they did, said
   * by the narrator in the caption and paced like any other beat. Whoever stands in the lanes answers before the
   * carrier. The deed is said the first two times a carry; after that the face is enough. The reactions trial. */
  const standingBy = () => [...new Set(run.things.filter((t) => !t.wapped && t.y > 0 && t.y < run.y + 20 && (t.kind === 'clown' || t.kind === 'mime' || t.kind === 'clerk')).map((t) => t.kind)), ...(run.boof ? ['boof'] : []), ...(run.boon ? ['boon'] : []), ...(run.bane ? ['bane'] : [])];
  function react(moment) {
    if (!reactionsOn() || !run) return false;
    run.reacted = run.reacted || {};
    record.reactions = record.reactions || {};
    const times = run.reacted[moment] || 0;
    const answer = reactionFor(moment, { carrier: run.carrier.id, present: standingBy(), times, lifetime: record.reactions[moment] || 0, hold: callbacksHeld() });
    run.reacted[moment] = times + 1;
    record.reactions[moment] = (record.reactions[moment] || 0) + 1;   // kept at the next save a carry makes
    if (!answer) return false;
    meanwhile(answer.who, answer.mood, '');
    if (answer.deed && times < 2) showToast(`Meanwhile, ${shortName(answer.who)}`, answer.deed, 3000, 'flour', 1, 'note');
    return true;
  }
  /* Callbacks (pie-jokes.mjs; .spw/surfaces/jokes.spw; the callbacks trial): a beat met again in one carry comes back
   * changed, and the last time it lands, in words the book or the lanes already have; a margin heard can set one up.
   * A payoff the lanes already say is held back from the reactions until it lands. Landing meets the trope it crosses
   * and is kept as a deed on the chapter (joke_<name>). It needs no other trial on. */
  const callbacksOn = () => switchOn('callbacks');
  const callbackChapters = {};
  let callbackChaptersAsked = false;
  const callbackAt = () => ({ carrier: run.carrier.id, heard: readStore(HEARD_KEY), counts: (run.callbacks ||= { counts: {}, landed: [], said: [] }).counts });
  function callbacksHeld() {
    if (!callbacksOn() || !run) return [];
    return callbacksSaving(callbackAt(), REACTIONS);
  }
  function callbackSaid(moment) {
    if (!callbacksOn() || !run) return false;
    if (!callbackChaptersAsked) {
      callbackChaptersAsked = true;
      CALLBACK_CHAPTERS.forEach((n) => fetch(`/book/content/chapters/${pad2(n)}.json`).then((res) => (res.ok ? res.json() : null)).then((data) => { if (data) callbackChapters[n] = data; }).catch(() => {}));
    }
    const due = meetCallback(moment, callbackAt());
    if (!due) return false;
    const trope = tropeById.get(due.rule.crosses);
    if (due.last) {
      run.callbacks.landed.push(due.rule.id);
      keepDeeds(run.chapter, { [jokeDeed(due.rule)]: 1 });
      if (trope) tropeMet(trope);
    }
    const said = callbackWords(due.beat, { reactions: REACTIONS, chapters: callbackChapters, moment });
    if (!said) return false;   // its words not yet to hand (a chapter still on its way): the lanes answer as they would
    run.callbacks.said.push(said.words);
    const who =said.who === 'carrier' || said.who === 'any' ? run.carrier.id : said.who;
    if (CHARACTERS[who]) meanwhile(who, said.mood, '');
    showToast(CHARACTERS[who] ? `Meanwhile, ${shortName(who)}` : `${trope?.sigil || ''} ${trope?.name || ''}`.trim(), said.words, 3200, 'flour', 1, 'note');
    return true;
  }
  /* What someone remembers of you (characters.mjs remembers, from the deeds every chapter carried keeps), told once
   * a carry when they first come into the lanes: their face in the meanwhile panel, the line in the caption, paced
   * like any other beat. The reactions trial. */
  function recall(who) {
    if (!reactionsOn() || !run || !CHARACTERS[who]) return;
    run.recalled = run.recalled || {};
    if (run.recalled[who]) return;
    run.recalled[who] = true;
    run.deedsWere = run.deedsWere || readStore(DEEDS_KEY);
    const line = remembers(who, run.deedsWere);
    if (!line) return;
    meanwhile(who, 'thinking', '');
    showToast(`Meanwhile, ${shortName(who)}`, line, 3200, 'flour', 1, 'note');
  }
  /* A season's place, met (pie-seasons.mjs). While the season is open the pie is expected: it settles, a slice is
   * ready, and the first time the land hands over a line to keep. After it, for a reader who was there and kept
   * the line, the place is still set, and what plays is what the season left. */
  function meetPlace(place) {
    place.met = true;
    const at = run.season;
    if (!at) return;
    const { season, mode } = at;
    const says = SEASON_SAYS[season.id] || {};
    const mine = readSeasons();
    // After the season the line is the key and not the spell: what plays is the season's own residue, whatever a
    // line handed over or rewritten may hold.
    const power = seasonPower(mode === 'open' ? season.power : season.residue);
    applyPower(power);
    sfx('share', 0, place.x, place.y);
    spawnRing(place.x, place.y, 30, colors.gold, 0.5);
    run.tags.push({ x: place.x, y: place.y - 26, t: 0, text: mode === 'open' ? says.tag : says.stillTag });
    // What it is, once a carry; and the first time ever, the line the season leaves (the pacer gives each its room).
    if (!run.placeSaid) showToast(mode === 'open' ? says.meet : says.still, power?.says || '', 3600, 'wonder');
    run.placeSaid = true;
    if (mode === 'open') {
      const taken = takeSeason(mine, season, { now: seasonClock(), chapter: run.chapter, carrier: run.carrier.id });
      writeSeasons(taken.record);
      if (taken.line) {
        run.keptLine = season.id;
        showToast(says.kept, says.keptLine, 5200, 'wonder', 1);
        paintProvenance();
      }
    }
    say(`${mode === 'open' ? says.meet : says.still}. ${power?.says || ''}`);
  }
  /* The Ring Tide (pie-seasons.mjs): a dolphin comes up out of the salt under the crust and carries the pie a while,
   * riding beside the carrier. One the season set is met like its place, line and all; one sent from a live stream
   * (pie-live.mjs) does what the tide does and hands over no line, since a line is only ever met in its days. */
  const RING_TIDE = SEASONS.find((s) => s.id === 'ringtide');
  function meetDolphin(dolphin) {
    dolphin.ride = dolphin.faint ? 2 : 6;
    lean('dolphin');
    if (!dolphin.gift && run.season?.season.kind === 'dolphin') meetPlace(dolphin);
    else {
      dolphin.met = true;
      const power = seasonPower(RING_TIDE?.power || '');
      applyPower(power);
      if (power) run.powersUsed[power.id] = 'gift';
      sfx('share', 0, dolphin.x, dolphin.y);
      spawnRing(dolphin.x, dolphin.y, 32, '#8fd3e8', 0.55);
      run.tags.push({ x: dolphin.x, y: dolphin.y - 26, t: 0, text: 'CARRIED BY A DOLPHIN' });
      if (!run.dolphinSaid) showToast('A dolphin, sent', power?.says || '', 3600, 'wonder');
      run.dolphinSaid = true;
      say(`A dolphin, sent up the lanes. ${power?.says || ''}`);
    }
  }
  /* A donut on the road: a ring of dough, a boost (SEASON_EXTRAS), eaten in passing. */
  function eatDonut(donut) {
    donut.eaten = true;
    donut.wapped = true;
    donut.wapT = 0.5;
    donut.spin = 0;
    const power = seasonPower(SEASON_EXTRAS.donut);
    applyPower(power);
    // The haggle, found (pie-finds.mjs): every donut counts twice, this carry, or on a stream for the rest of it.
    if (run.haggled || (donut.gift && liveFound('haggle'))) applyPower(power);
    if (power) run.powersUsed[power.id] = donut.gift ? 'gift' : 'season';
    run.donuts = (run.donuts || 0) + 1;
    creditIngredient(donut, 'donut');
    sfx('sweet', 0, donut.x, donut.y);
    spawnRing(donut.x, donut.y, 22, '#e98fb0', 0.45);
    run.tags.push({ x: donut.x, y: donut.y - 22, t: 0, text: '+ DONUT · FILLING · SLICES FILL MORE' });
    if (run.donuts === 1) { showToast('A donut', power?.says || '', 3200, 'wonder'); say(`A donut. ${power?.says || ''}`); }
    lean('donut');
    noteDeed('eat', 'donut');
  }
  /* Finds (pie-finds.mjs): what opens only to a rare carry played well. The lanes say what happened, a deed at a
   * time; each find's line of Spw is read once and is the rule. A find opens a classic beat (a freeze, then the
   * moment, drawn and not said), shows a character's own want or limit from a new side, gives the rest of the carry
   * something, and keeps a sealed line, by play only. On a stream (?live) it deepens that gift for the room. */
  const FIND_RULES = FINDS.map((find) => ({ find, rule: readFind(find.rule) }));
  const FIND_LEANS = Object.freeze(Object.fromEntries(FIND_RULES.filter(({ rule }) => rule.lean).map(({ find, rule }) => [deedOf(find), [rule.lean, 1]])));
  const FIND_WORDS = Object.freeze(Object.fromEntries(FINDS.map((find) => [deedOf(find), `${find.name.replace(/^The /, '').toLowerCase()} found`])));
  const FINDS_KEY = 'lore.pie.finds.v1';
  function noteDeed(verb, kind) {
    if (!run) return;
    run.deeds = [...(run.deeds || []).filter((d) => run.t - d.t < 30), { verb, kind, t: run.t, lane: laneAt(run.x) }];
    FIND_RULES.forEach(({ find, rule }) => {
      if (run.found?.[find.id] || !findOpens(rule, run.deeds, { carrier: run.carrier.id })) return;
      openFind(find, rule);
    });
  }
  function openFind(find, rule) {
    (run.found ||= {})[find.id] = true;
    // What the hands did leans the land the way the find's line says, and is kept on this chapter at once, spilled
    // or not: the deed makes the find's artifact in the almanac and turns its margin rumour in the book.
    const deed = deedOf(find);
    lean(deed);
    if (run.legEvents) delete run.legEvents[deed];   // kept here if at all, and not again when the leg closes
    // A find held from the book (no artifact, no margin) leans the carry and keeps nothing on the chapter.
    if (find.made || find.margin) keepDeeds(run.chapter, { [deed]: 1 });
    let first = false;
    try {
      const had = JSON.parse(localStorage.getItem(FINDS_KEY) || '{}') || {};
      const day = new Date().toISOString().slice(0, 10);
      const taken = takeFind(had, find, { day, chapter: run.chapter, carrier: run.carrier.id });
      localStorage.setItem(FINDS_KEY, JSON.stringify(taken.record));
      first = taken.first;
    } catch { /* found this carry, if not kept */ }
    // The beat: the lanes hold their breath, then the moment.
    run.hitStop = Math.max(run.hitStop || 0, 0.35);
    const at = find.id === 'sniff' && run.lastFoilAt ? run.lastFoilAt : { x: run.x, y: run.y - 80 };
    (run.moments ||= []).push({ kind: rule.moment, t0: run.t, x: at.x, y: at.y });
    if (find.id === 'haggle') { run.haggled = true; sfx('catch'); }
    if (find.id === 'sniff') {
      run.wilting = true;
      run.things.forEach((thing) => { if (thing.kind === 'banerose' && !thing.knocked && !thing.cleared) Object.assign(thing, { wilted: true, fatal: false }); });
      sfx('sweet');
    }
    if (find.id === 'unwritten') { run.unkept = Math.max(run.unkept || 0, 2.5); sfx('wonder'); }
    try { if (rule.crosses) noteCrossing(rule.crosses, 'lanes'); } catch { /* the stage waits */ }
    showToast(`✧ ${find.name}${first ? ' · a find' : ''}`, find.says, 6400, 'wonder', 2);
    say(`${find.name}. ${find.says}`);
    if (find.made) makeFromDeeds(run.chapter);   // its card waits behind the find's own (the pacer keeps the order)
    if (liveDesk) { markLiveFound(find.id); liveDesk.found(find); }
  }
  /* Gifts from a live stream (pie-live.mjs), only when the address asks (?live): typed on the gift desk or sent
   * by a feed on the streamer's own machine. Each waits for a carry, then lands one at a time: dolphins and donuts
   * up the lanes, anything else as its spell, once, at a size held to the spell ranges. */
  const liveGifts = [];
  let liveAt = 0;
  let liveDesk = null;
  try {
    liveDesk = initLive({ screen: root.querySelector('.pie-screen'), onGift: (gift) => {
      liveGifts.push(gift);
      if (state !== 'running' || !run) liveDesk?.waiting(gift);
    } });
  } catch (err) { console.warn('[pie-live]', err); }
  function landGift(gift) {
    if (gift.moment === 'freeze') {
      // Icy Clash, in a battle: the other side is frozen. What they set in the road ahead turns to frost (a slip,
      // never a knock), and for half a minute what they are sent comes as frost.
      run.frozenUntil = run.t + 30;
      run.things.forEach((thing) => {
        if (!thing.rival || thing.wapped || thing.y > run.y - 20) return;
        Object.assign(thing, { kind: 'frost', w: 50, h: 20, fatal: false, frozen: true });
        run.tags.push({ x: thing.x, y: thing.y - 18, t: 0, text: 'FROZEN' });
      });
      spawnRing(W / 2, run.y - 120, 60, '#8fd3e8', 0.6);
      (run.giftArt ||= []).push({ art: 'ice', t0: run.t, x: run.x });
      say(`Icy Clash: ${gift.lands}`);
      liveDesk?.landed(gift);
      return;
    }
    if (gift.side === 'rival') {
      // A gift to the other side becomes something in the road (the maker, 2026-11-12: the opponent's gifts are
      // obstacles, mine are benefits), and feeds Mr. BaneWAP (never anyone real), who comes sooner with a longer
      // scheme. Each obstacle wears a violet ring, so whoever is watching can see where it came from. They come one
      // at a time, never a full row: there is always a way through, a hop over the stones and holes, and his off switch.
      const canBane = allowed('bane');
      const frozen = (run.frozenUntil || 0) > run.t;
      const specific = Array.isArray(gift.rivalKinds) ? gift.rivalKinds.filter(allowed) : [];
      const fallback = (gift.count >= 100 ? ['pane', 'stone', 'hole'] : gift.count >= 10 ? ['stone', 'hole', 'puddle'] : ['puddle', 'frost']).filter(allowed);
      const kinds = frozen ? ['frost'].filter(allowed) : specific.length ? specific : fallback;
      const many = Math.min(8, 1 + Math.floor(Math.log2(gift.count)));
      for (let i = 0; i < many && kinds.length; i += 1) {
        const block = makeThing(pick(kinds), Math.floor(Math.random() * LANES));
        block.y = -44 - i * 72;
        block.rival = true;
        // The sniff, found: bane roses come wilted this carry, and one in two on the rest of a stream.
        if (block.kind === 'banerose' && (run.wilting || (liveFound('sniff') && Math.random() < 0.5))) Object.assign(block, { wilted: true, fatal: false });
        run.things.push(block);
      }
      run.baneStore = Math.min(5, (run.baneStore || 0) + 1 + Math.floor(gift.count / 25));
      if (canBane) {
        run.rivalCall = true;
        if (!run.bane && !run.boon) run.nextPresence = Math.min(run.nextPresence ?? 4, 2.5);
      }
      spawnRing(W / 2, PRESENCE_Y, 40, '#7e57c2', 0.5);
      run.tags.push({ x: W / 2, y: PRESENCE_Y + 30, t: 0, text: `${gift.count} ${gift.name.toUpperCase()}${gift.count === 1 ? '' : 'S'} · TO THE OTHER SIDE` });
      say(`${gift.count} ${gift.name}${gift.count === 1 ? '' : 's'}, to the other side. ${canBane ? gift.lands : 'Mr. BaneWAP is not in the book until Chapter Four; what he was given waits for him.'}`);
      react('gift:rival');
      sfx('gift', -gift.count, W / 2, PRESENCE_Y);
      liveDesk?.landed(gift);
      return;
    }
    if (gift.kind === 'dolphin' || gift.kind === 'donut' || gift.kind === 'berry' || gift.kind === 'boonrose') {
      const n = Math.max(1, Math.min(gift.things ?? Math.floor(gift.count / (gift.per || 1)), gift.most || 4));
      // Up from the carrier's own lane, one after another: dolphins weave near it; a donut trail walks across the lanes
      // and back, so it is followed by steering, and a carrier standing still meets one in eight.
      let walk = run.lane;
      let dir = run.lane >= LANES - 1 ? -1 : 1;
      for (let i = 0; i < n; i += 1) {
        let lane = clamp(run.lane + Math.round(Math.sin(i * 1.3)), 0, LANES - 1);
        if (gift.kind !== 'dolphin') {
          lane = walk;
          if (walk + dir < 0 || walk + dir > LANES - 1) dir = -dir;
          walk += dir;
        }
        const thing = makeThing(gift.kind, lane);
        thing.y = -44 - i * (gift.kind === 'dolphin' ? 90 : 46);
        thing.gift = true;
        run.things.push(thing);
      }
    } else {
      const power = seasonPower(gift.spell);
      applyPower(power);
      if (power) run.powersUsed[power.id] = 'gift';
      spawnRing(run.x, run.y - 20, 34, colors.gold, 0.5);
      // TGIF: Friday arrives with everyone in it (as in the Thursday chapter): a row of clowns, a way left through.
      if (gift.key === 'tgif') {
        impact('combo', W / 2, 150, { scale: 0.85, word: 'FRIDAY!' });
        const way = run.safe ?? run.lane;
        [...Array(LANES).keys()].filter((lane) => lane !== way).forEach((lane, i) => {
          const who = makeThing('clown', lane);
          who.y -= 24 + i * 6;
          who.gift = true;
          run.things.push(who);
        });
      }
      // GG: a good game. What the other side set in the road ahead shakes hands and steps aside.
      if (gift.key === 'gg') run.things.forEach((thing) => {
        if (!thing.rival || thing.wapped || thing.y > run.y - 10) return;
        Object.assign(thing, { wapped: true, wapT: 0, spin: thing.x < W / 2 ? -1 : 1, fatal: false });
        run.tags.push({ x: thing.x, y: thing.y - 20, t: 0, text: 'GG' });
      });
    }
    run.tags.push({ x: run.x, y: run.y - 46, t: 0, text: `${gift.count} ${gift.name.toUpperCase()}${gift.count === 1 ? '' : 'S'}` });
    if (gift.art) (run.giftArt ||= []).push({ art: gift.art, t0: run.t, x: run.x });
    say(`${gift.count} ${gift.name}${gift.count === 1 ? '' : 's'}${gift.who ? ` from ${gift.who}` : ''}: ${gift.lands}`);
    react(gift.key === 'finger heart' ? 'gift:finger_heart' : gift.key === 'hi bear' ? 'gift:hi_bear' : 'gift:mine');
    sfx('gift', gift.count, run.x, run.y);
    liveDesk?.landed(gift);
  }
  if (liveDesk) {
    setInterval(() => {
      if (!liveGifts.length || state !== 'running' || !run) return;
      const now = performance.now();
      if (now < liveAt) return;
      liveAt = now + 1600;
      try { landGift(liveGifts.shift()); } catch (err) { console.warn('[pie-live]', err); }
    }, 250);
  }
  let roomShown = '';
  function announceRoom() {
    const r = roomNow();
    if (!r || !r.n) return;
    setSoundRoom(r.sigil, { announce: Boolean(record.sound && state === 'running' && setting('music') !== 'quiet') });
    // The room that keeps the chapter's rhythm: said once, the first time, if it has not been found.
    if (conductor.setRoom(r.sig) && conductor.rhythm && !foundRhythms()[conductor.rhythm.id]) {
      showToast('Something here keeps time', 'Listen for it. Step, hop or throw along with it, and it is yours.', 3400, 'wonder', 1);
    }
    const key = `${r.chapter}:${r.n}`;
    if (key === roomShown) return;
    roomShown = key;
    if (run) run.roomAt = run.t;   // the beat: a room opens (the narrator and the prose come forward)
    if (run && state === 'running' && (shelvesOn() || switchOn('sound-design'))) {
      run.shelfV = shelfVector();
      shelfColor(run.shelfV);   // the sound takes the shelves' colour (pie-sound.mjs; a no-op unless the lanes are scored)
    }
    if (run && state === 'running' && shelvesOn()) {
      const stepped = chainStep(run.chains || chainStart(), run.shelfV);
      run.chains = stepped.state;
      run.shelvesSaid = run.shelvesSaid || [];
      const branch = thresholdBranch(run.shelfV, run.shelvesSaid);
      if (branch) {
        run.shelvesSaid.push(branch.shelf);
        const nudge = nudgeFor(branch.shelf);
        if (nudge) branch.aside = `${branch.aside} What warmed it: ${nudge}.`;
      }
      const fired = stepped.fired[0];
      if (fired) actOutChain(fired, branch);
      if (branch && branch.shelf !== fired?.shelf) {
        run.tags.push({ x: W / 2, y: PRESENCE_Y + 44, t: 0, text: branch.toward });
        showToast(`${branch.shelf} · what they notice`, branch.aside, 4200, CHAIN_VOICE[branch.shelf] || '', 1, 'chain');
        say(`${branch.aside} ${branch.toward}`);
      }
      else if (!fired && run.motivation) {
        const shelf = Object.entries(CHAINS).find(([, links]) => links.some((link) => link.invokes === run.motivation))?.[0];
        if (!shelf || !(run.shelfV?.[shelf] >= 0.3)) run.motivation = '';
      }
    }
    if (run && state === 'running') textureFind({ room: r.sig, chapter: r.chapter, sigils: [r.sigil], carry: run }).then(findSaid);
    const play = ROOM_PLAY[r.sigil];
    record.roomsSeen = record.roomsSeen || {};
    const seen = record.roomsSeen[r.sigil] || 0;
    record.roomsSeen[r.sigil] = seen + 1;
    writeRecord(record);
    const cast = (record.roomsCast?.[r.sigil] || 0) > 0;
    const already = readCasts()[r.chapter]?.[r.n];
    const lines = [];
    if (play && (seen >= 1 || cast)) lines.push(`${r.sigil}: ${play.says}.`);
    if (play && (seen >= 2 || cast)) lines.push(already ? `Cast before (${already.verb}).` : `Cast it: ${play.how}.`);
    showToast(`Room ${r.n} · ${r.sig}`, lines.join(' ') || (r.title || 'A room of the chapter, passing.'), 3000, '');
  }
  /* The beat, for emphasis only (pie-panels.mjs beatOf): a room opening brings the narrator and the prose
   * forward; danger close thins whatever rides the lanes so they show through; sizes never change. */
  let beatShown = '';
  function paintBeat() {
    const beat = state === 'running' && run ? beatOf({ sinceRoom: run.t - (run.roomAt ?? -99), danger: root.dataset.cabinetMood === 'danger' }) : '';
    if (beat === beatShown) return;
    beatShown = beat;
    const voyageEl = root.closest('.pie-voyage');
    if (voyageEl) voyageEl.dataset.beat = beat;
  }
  /* An outcome as Spw: what it asked, what it measured, the bias it returns, and where it happened. */
  const OUTCOME = Object.freeze({
    satisfied: ['appetite', 'pips'], perfect: ['aim', 'bounces'], knocked: ['clears', 'tilt'], hop_clear: ['clears', 'lift'], in_time: ['timing', 'phase'], pocket: ['groove', 'hits'],
    boxed: ['through', 'gap'], kept: ['reach', 'rows'], read: ['underfoot', 'words'], foiled: ['switch', 'schemes'], over_mimes: ['loft', 'height'],
    sweetened: ['kindness', 'foretold'], ahead: ['nerve', 'rows'], shared: ['company', 'slices'], caught: ['lean', 'tilt'], cast: ['room', 'verb'],
    aimed: ['needle', 'arrows'], boonberry: ['sweetness', 'berries'], furrow: ['warmth', 'furrows'], boneberry: ['savour', 'berries'], deft: ['landing', 'hops'],
    ramp: ['rise', 'ramps'], sighting: ['notice', 'strokes'], boof: ['nose', 'brushes'], boonwap: ['court', 'lines'], scheme_ran: ['scheme', 'runs'],
    bane_fed: ['appetite', 'baneberries'], let_past: ['watch', 'baneberries'], foretold: ['prophecy', 'come_true'], squashed: ['silence', 'unsaid'],
    flinched: ['nerve', 'flinches'], egg: ['warmth', 'passes'], alley: ['game', 'arrows'], parade: ['game', 'clowns'], long_view: ['game', 'cleared']
  });
  const WAY_LABEL = Object.freeze({ boon: 'fairy_tale', bane: 'absurd_reality', bone: 'low_magic' });
  function outcomeSpell(entry) {
    const event = entry.events[0] || 'moment';
    const [probe, measure] = OUTCOME[event] || ['what', 'n'];
    const parts = [`?${probe}`, `%${measure}[${entry.events.length || 1}]`];
    const num = (v) => String(Math.round(v * 100) / 100);   // plain numbers in Spw: 0.5, never ½
    Object.entries(entry.parts).forEach(([cat, pts]) => parts.push(`=${WAY_LABEL[cat]}[${num(pts)}]`));
    Object.entries(entry.contest).forEach(([side, pts]) => parts.push(`&${side === 'wap' ? 'pie' : 'mimes'}[${num(pts)}]`));
    if (entry.ref) parts.push(`~"book/chapter/${pad2(entry.ref.chapter)}${entry.ref.id ? `#${entry.ref.id}` : ''}"`, `#room[${entry.ref.n}]`);
    return `!${event}{ ${parts.join(' ')} }`;
  }

  /* ─── The lane from the side (pie-heights.mjs): what the game will do, handed over each frame ─── */
  const inLaneOf = (th) => (WIDE.has(th.kind) ? th.gap !== run.lane : Math.abs(th.x - run.x) < ((th.w || 24) + run.carrier.width) / 2);
  function heightsSnap() {
    if (!run || state === 'title' || state === 'over') return null;
    const speed = Math.max(40, run.speed || 120);
    const windowFull = TUNE.hop_window * (run.carrier.id === 'clerk' ? 1.4 : 1);
    const sinceLand = run.t - (run.lastLand ?? -9);
    const windowLeft = run.jumpT <= 0 && run.lastHopGood ? Math.max(0, windowFull - sinceLand) : 0;
    const chain = run.hopChain || 0;
    const things = run.things
      .filter((th) => !th.wapped && !th.cleared && !th.knocked && !th.gone && th.y < run.y + 30 && inLaneOf(th))
      .map((th) => {
        const harmful = Boolean(th.fatal || SLIPS.has(th.kind) || KNOCKS[th.kind]);
        return {
          eta: (run.y - th.y) / speed,
          cls: clearance(th.kind, { Z, LOW, HIGH_CLEARS, harmful }),
          z: Z[th.kind] ?? 2,
          wide: WIDE.has(th.kind),
          name: (th.wonder?.name || CARDS[th.kind]?.name || th.kind).replace(/^(A|An|The) /, '').toLowerCase()
        };
      });
    return {
      things,
      lift: jumpLift(),
      highHop: Boolean(run.highHop),
      jumpT: run.jumpT || 0,
      jumpDur: JUMP_DUR,
      hopLift: TUNE.hop_lift,
      hopChainStep: TUNE.hop_chain,
      power: run.hopPower || 1,
      chain,
      windowLeft,
      windowFull,
      canHop: run.jumpT <= 0 && !(run.jumpCool > 0),
      nextChain: windowLeft > 0 ? Math.min(3, chain + 1) : 0,
      recipe: recipeIdNow(),
      jazzPocket: (run.jazzPocketT || 0) > 0,
      pantry: (run.roomPantryT || 0) > 0,
      motif: run.motifState ? { ...run.motifState } : null
    };
  }
  heightsPanel?.addEventListener('toggle', () => {
    record.view.heights = heightsPanel.open;
    writeRecord(record);
    if (heightsPanel.open) heights.fit();
  });
  if (heightsPanel) heightsPanel.open = record.view.heights !== false;
  /* The side view is configurable: each part on or off, and how far ahead it looks; kept in this browser.
   * (In time it may become something earned; for now every part is there to turn.) */
  const heightsCfgOut = root.querySelector('[data-pie-heights-cfg]');
  const HEIGHTS_PARTS = Object.freeze([['marks', '⤒ marks in the lanes', 'Each thing in the lanes wears ⤒ (a hop clears it), ⤒⤒ (a high hop) or ▮ (too tall)'], ['arc', '◠ arc', 'The arc of a hop taken now'], ['words', '¶ words', 'What is next, in words'], ['bands', '≡ bands', 'The bands of height, labelled'], ['chain', '●●● chain', 'The chain toward a high hop'], ['meanwhile', '▣ meanwhile', 'The meanwhile panel']]);
  function paintHeightsCfg() {
    if (!heightsCfgOut) return;
    const cfg = { ...HEIGHTS_DEFAULTS, ...(record.view.heightsCfg || {}) };
    const chips = HEIGHTS_PARTS.map(([key, label, title]) => {
      const b = nodeOf('button', 'pie-heights-chip', label);
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-pressed', cfg[key] ? 'true' : 'false');
      b.addEventListener('click', () => {
        record.view.heightsCfg = { ...cfg, [key]: !cfg[key] };
        writeRecord(record);
        if (key === 'meanwhile' && cfg[key]) heightsPanel?.querySelector('[data-pie-meanwhile]')?.setAttribute('hidden', '');
        paintHeightsCfg();
      });
      return b;
    });
    const reach = nodeOf('button', 'pie-heights-chip', `⟷ ${cfg.horizon} s ahead`);
    reach.type = 'button';
    reach.title = 'How far ahead the side view looks';
    reach.addEventListener('click', () => {
      const order = [1.2, 1.8, 2.4];
      record.view.heightsCfg = { ...cfg, horizon: order[(order.indexOf(cfg.horizon) + 1) % order.length] || 1.8 };
      writeRecord(record);
      paintHeightsCfg();
    });
    heightsCfgOut.replaceChildren(...chips, reach);
  }
  requestAnimationFrame(paintHeightsCfg);   // after setup: its helpers are defined further down

  /* ─── The page as a comic: panels on one beat, and a meanwhile ───
   * The lanes, the side of the lane and the show are panels of one page. On a beat (an impact, a hop
   * in time) their frames ink together, so the eye reads them as the same moment. And now and then
   * the inset panel cuts to someone elsewhere, in a mood, with a word: meanwhile. */
  const cabinetEl = root;
  let beatTimer = 0;
  function beat() {
    if (reduced?.matches || record.view.zen) return;
    cabinetEl.classList.remove('is-beat');
    void cabinetEl.offsetWidth;
    cabinetEl.classList.add('is-beat');
    clearTimeout(beatTimer);
    beatTimer = setTimeout(() => cabinetEl.classList.remove('is-beat'), 260);
  }
  const meanwhileOut = root.querySelector('[data-pie-meanwhile]');
  const SHORT_NAMES = { boof: 'Boof', ants: 'the ants', genie: 'the Genie', bane: 'BaneWAP', boon: 'BoonWAP', bonewap: 'BoneWAP', porter: 'the porter', clerk: 'the clerk', figure: 'the figure', clown: 'a clown', mime: 'a mime' };
  const shortName = (who) => SHORT_NAMES[who] || CHARACTERS[who]?.name || who;
  let meanwhileAt = 0;
  let meanwhileWait = 0;
  function meanwhile(who, mood, words, { force = false } = {}) {
    if (!meanwhileOut || !CHARACTERS[who] || record.view.zen || record.view.heightsCfg?.meanwhile === false) return;
    const now = performance.now();
    if (!force && now - meanwhileAt < 2200) return;
    // A reaction never lands on a caption: it waits until the caption has been seen a moment (pie-pacing.mjs).
    const sinceCaption = now - captionAt * 1000;
    if (!force && sinceCaption < 1200) {
      clearTimeout(meanwhileWait);
      meanwhileWait = setTimeout(() => meanwhile(who, mood, words, { force: true }), 1200 - sinceCaption);
      return;
    }
    meanwhileAt = now;
    if (!force) pacer.hold(now / 1000 + 0.9);   // a face reacting has the eye a moment; the next caption waits for it
    const art = meanwhileOut.querySelector('.pie-meanwhile-art');
    const balloon = meanwhileOut.querySelector('.pie-meanwhile-says');
    const name = meanwhileOut.querySelector('.pie-meanwhile-who');
    if (art) art.innerHTML = portraitSVG(who, { size: 56, mood, standalone: true });
    if (balloon) balloon.textContent = words;
    if (name) name.textContent = shortName(who);
    meanwhileOut.hidden = false;
    meanwhileOut.classList.remove('is-cut');
    void meanwhileOut.offsetWidth;
    meanwhileOut.classList.add('is-cut');
  }

  /* ─── The story in the lanes (pie-story-lane.mjs): captions, road words, found lines, story-to-character cues ─── */
  const {
    laneStory, storyInMode, laneStoryTick, laneStoryStep, paveSentence,
    wordUnder, keepWord, tellWord, roadWordsStep, drawRoadWords, drawLaneCaption
  } = initStoryLane({
    getCtx: () => ctx,
    W,
    H,
    record,
    getPanelPlan: () => panelPlan,
    reduced,
    getColors: () => colors,
    mix,
    getFlowProse: () => flowProse,
    getRun: () => run,
    getState: () => state,
    getGlassFoot: () => glassFoot,
    airborne: () => airborne(),
    inLaneOf,
    lean,
    showToast: (...args) => showToast(...args),
    sfx,
    say,
    reactionsOn,
    react,
    meanwhile,
    onStoryKeep: ({ kind, phrase, word } = {}) => {
      if (run?.values) noteValueEvent(run.values, kind === 'foundLine' ? 'kept' : 'read', 1);
      noteSpark('word_weaver', { kind, phrase, word });
      syncDerivedSparks();
    }
  });

  let paintPortraits, paintStress, keepProvenance, paintProvenance;

  /* ─── Whimsy: how an impact looks and sounds, by sprite and by scene ───
   * !whimsy{ *kind{ #pop["BONK!", …] *bits[crumbs] !sound[…] %drama[1] } } and !scenes{ *field{ $frost
   * %drama[0.9] } } in pie-rules.spw, over the defaults in pie-world.mjs. An impact pops a word, flings bits, gives
   * the screen a punch and (when it matters) a breath of hit-stop, all scaled by =drama, the sprite's
   * own drama and the scene's. Under reduced motion or zen: the word only, quietly. */
  let whimsyRules = { sprites: {}, scenes: {} };
  const whimsyFor = (kind) => ({ ...WHIMSY_DEFAULTS.knock, ...(WHIMSY_DEFAULTS[kind] || {}), ...(whimsyRules.sprites[kind] || {}) });
  const sceneWhimsy = (id = run?.sceneId) => ({ ...(SCENE_WHIMSY_DEFAULTS[id] || {}), ...(whimsyRules.scenes[id] || {}) });
  function impact(kind, x, y, { scale = 1, word = null, hurt = false } = {}) {
    if (!run) return;
    if (kind !== 'hop' || (run.hopChain || 0) > 0) beat();
    // What moved in this moment happened here: its chip rises from here, and its still is taken here.
    const latest = run.feed[run.feed.length - 1];
    if (latest && run.t - latest.t < 0.05 && !latest.placed) { latest.x = x; latest.y = y; latest.placed = true; }
    const w = whimsyFor(kind);
    const drama = TUNE.drama * (w.drama ?? 1) * (sceneWhimsy().drama ?? 1) * scale * (run.carrier?.id === 'clown' ? 1.3 : 1);
    if (drama <= 0) return;
    const calm = reduced?.matches || record.view.zen;
    // A register cast for the visit (spw-bias.mjs) may answer instead, now and then; never the story.
    const popText = biased(`pop.${kind}`, word || pick(w.pops || ['!']), { seed: Math.round(run.t * 1000) });
    run.pops.push({ x: clamp(x, 40, W - 40), y, t: 0, text: popText, size: 0.75 + Math.min(1.5, drama * 0.55), hurt, spin: calm ? 0 : rand(-0.22, 0.22) });
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
    if (w.sound) sfx(w.sound, 0, x, y);
  }
  /* ─── Minigames: a horn up the lanes starts one (and the lanes gain a dimension as the book goes) ───
   * Each is a timed session with its own rule, a banner and a countdown, and a score said at its end.
   *   alley      (from Four)  arrows on every row: step on one and the needle points true and holds;
   *                           clowns come at the angles the arrows point to
   *   parade     (from Six)   clowns come down the diagonal from one side; the needle holds their angle
   *   long_view  (from Ten)   the lanes recede to a far point: you see what is coming sooner, and the
   *                           far end of the road is drawn small (a change of perspective, not of rules) */
  function startMini(id) {
    if (!run || run.mini) return;
    const open = Object.entries(MINIS).filter(([, m]) => m.from <= run.chapter || run.lap > 0).map(([k]) => k);
    const which = id && MINIS[id] ? id : pick(open.length ? open : ['alley']);
    const m = MINIS[which];
    const miniTune = domainTune('minis');
    const tempoMul = Number(miniTune.mini_tempo) || 1;
    run.mini = { id: which, t: 0, dur: m.dur * TUNE.mini_dur * (1 / Math.max(0.5, tempoMul)), score: 0, side: pick([-1, 1]), next: 0.3 };
    impact('horn', W / 2, 150, { scale: 1.3, word: m.word });
    sfx('wonder', 'contrivance');
    playBoardMotifCue({ action: 'story', kind: 'minigame', lane: run.lane, row: run.row });
    showToast(m.title, m.line, 3200, 'wonder');
    say(`${m.title}. ${m.line}`);
    turnCard('horn');
  }
  function endMini() {
    const m = run.mini;
    run.mini = null;
    if (!m) return;
    impact('combo', W / 2, 160, { scale: 0.8 + Math.min(1.2, m.score * 0.12), word: `${MINIS[m.id].title.toUpperCase()} ×${m.score}` });
    if (m.score) lean(m.id, Math.min(3, m.score / 3));
    say(`${MINIS[m.id].title}, over: ${m.score}.`);
  }
  function tickMini(dt) {
    const m = run?.mini;
    if (!m) return;
    m.t += dt;
    m.next -= dt;
    if (m.id === 'parade') {
      // The needle holds the parade's angle; clowns come down the diagonal from one side.
      run.aim.a = clamp(m.side * 0.42, -AIM_MAX, AIM_MAX);
      run.aimLock = Math.max(run.aimLock || 0, 0.25);
      if (m.next <= 0) {
        m.next = 0.8;
        const c = makeThing('clown', m.side > 0 ? LANES - 1 : 0);
        c.vx = -m.side * 60;
        c.parade = true;
        run.things.push(c);
      }
    } else if (m.id === 'alley' && m.next <= 0) {
      m.next = 1.2;
      run.things.push(makeThing('clown', pick([0, 1, LANES - 2, LANES - 1])));
    }
    if (m.t >= m.dur) endMini();
  }
  /* How far into the long view: it eases in and out, so the road leans away and back. */
  const longK = () => {
    const m = run?.mini;
    if (!m || m.id !== 'long_view' || reduced?.matches) return 0;
    return clamp(Math.min(m.t, m.dur - m.t) / 0.8, 0, 1);
  };
  /* The long view's perspective: a row at height y is drawn this much narrower, toward the middle. */
  const viewScale = (y) => 1 - longK() * (1 - clamp(y / H, 0, 1)) * 0.42;
  /* Clear about height: a hazard wears a small mark of what a hop does about it. */
  const heightMark = (thing) => {
    if (LOW.has(thing.kind)) return '⤒';
    if (HIGH_CLEARS.has(thing.kind)) return '⤒⤒';
    return (Z[thing.kind] ?? 2) >= 2 && thing.fatal ? '▮' : '';
  };

  /* A scene's own texture as it begins (its $material, played by spw-sound.mjs), when sound is on. */
  function sceneTexture(id, after = 0) {
    const material = sceneWhimsy(id).material;
    if (!record.sound || !material) return;
    if (placesOn()) { sceneMaterial(material, 0, { after }); return; }
    import('../modules/spw-sound.mjs?v=2026_11_16.B').then((m) => m.playSpell(`$${material}`, { tempo: 70 })).catch(() => {});
  }

  const mawAhead = () => Boolean(run?.tally?.mawSeen && run.tally.maw > run.tally.wap + 0.5);
  const met = (kind) => record.met.includes(kind);
  /* The Thursday nobody kept (Chapter Fourteen; tropes.json#missing-day): no person is in the day, so nobody
   * comes down the lanes (no clown, clerk, subject or mime; neither pie holds court or schemes; nobody
   * blows a horn) until the last of it, when Friday arrives with everyone in it. */
  const NOBODY_ON_THURSDAY = new Set(['clown', 'clerk', 'subject', 'mime', 'mimewall', 'march', 'dividers', 'boon', 'bane', 'horn']);
  const thursday = () => beatHere('thursday') && !run.friday;
  /* With the chapter-tuned trial, a thing comes down a leg only from the leg its line meets it in (the book has named it
   * by then; a lap round the book frees it), and Mr. BoonWAP or Mr. BaneWAP only where the leg's cast has them. */
  const allowed = (kind) => !(thursday() && NOBODY_ON_THURSDAY.has(kind))
    && !droppedKinds().has(kind)
    && !((kind === 'boon' || kind === 'bane') && castBars(kind))
    && (tunedIntro(kind) != null ? tunedIntro(kind) <= run.chapter || run.lap > 0
      : (!(kind in INTRO) || INTRO[kind] <= run.chapter || run.lap > 0 || met(kind)));
  /* A rumour heard in this chapter's margins, said in the lanes as the carry reaches it. */
  function tickMargins() {
    if (run.marginSaid || run.marginAt == null || run.t < run.marginAt) return;
    run.marginSaid = true;
    const heard = readStore(HEARD_KEY);
    // Rumours before the land's other notes; carry by carry, they take turns.
    const here = marginRumours.filter((entry) => heard[entry.id] && (entry.chambers || []).includes(run.chapter))
      .sort((x, y) => (y.kind === 'rumour') - (x.kind === 'rumour'));
    const rumour = here[(record.runs || 0) % Math.max(1, here.length)];
    if (!rumour) return;
    showToast(`Heard in the margins of ${chapterWords(run.chapter)}`, rumour.track.lanes, 4600, '', 2);
    say(rumour.track.lanes);
  }
  function tickThursday(dt) {
    if (!beatHere('thursday')) return;
    // Said a breath in, after the first room has said its own name.
    run.thursdayT = (run.thursdayT || 0) + dt;
    if (!run.thursdaySaid && run.thursdayT > 3.4) {
      run.thursdaySaid = true;
      showToast('The Thursday nobody kept', 'No person is in the day. The lanes are yours and the land’s.', 3400, '');
    }
    if (run.friday || progress() < 0.86) return;
    run.friday = true;
    metAt('friday');
    showToast('Friday', 'Friday arrives with everyone in it.', 3600, 'wonder', 2);
    impact('combo', W / 2, 150, { scale: 0.85, word: 'FRIDAY!' });
    say('Friday arrives with everyone in it.');
    // Everyone at once: a row of the people the day did not have, a way left through.
    const way = run.safe;
    [...Array(LANES).keys()].filter((lane) => lane !== way).forEach((lane, i) => {
      // (A tuned leg brings in only who its chapter has named: the feast clerks wait for the parcel gate.)
      const kind = ['clown', 'subject', 'clown', 'clerk'][i % 4];
      const who = makeThing(tunedLeg() && !allowed(kind) ? 'clown' : kind, lane);
      who.y -= 24 + i * 6;
      run.things.push(who);
    });
    run.nextPresence = Math.min(run.nextPresence ?? 4, 2);
  }

  /* ─── Things in the lanes: they come in rows, and every row leaves a way through ─── */
  const difficulty = () => clamp(run.t / 110 + (run.chapter - 1) * 0.025 + run.lap * 0.25, 0, 1);

  const makeThing = (kind, lane) => {
    const thing = { kind, y: -44, lane, x: laneX(lane), home: laneX(lane), w: 30, h: 30, fatal: true, born: run.t };
    switch (kind) {
      case 'post': thing.w = 24; thing.h = 24; break;
      case 'anthill': thing.w = 36; thing.h = 18; thing.fatal = false; break;   // a bump, never a spill
      case 'antgift': thing.w = 30; thing.h = 10; thing.fatal = false; break;
      case 'place': thing.w = 34; thing.h = 20; thing.fatal = false; break;   // a season's place: met, never a knock
      case 'dolphin': thing.w = 34; thing.h = 22; thing.fatal = false; break;   // the Ring Tide's: carries, never knocks
      case 'donut': thing.w = 24; thing.h = 22; thing.fatal = false; break;   // the Ring Tide's: a boost on the road
      case 'boonrose': thing.w = 22; thing.h = 26; thing.fatal = false; break;   // a rose sent on my side, laid by the road
      case 'banerose': thing.w = 30; thing.h = 26; break;   // a rose sent to the other side: thorns that knock
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
      case 'arrow': thing.w = 30; thing.h = 14; thing.fatal = false; thing.angle = pick([-0.5, -0.3, 0.3, 0.5]); break;
      case 'vane': thing.w = 18; thing.h = 40; thing.fatal = false; thing.ghost = true; thing.angle = pick([-0.45, 0.45]); break;
      case 'horn': thing.w = 26; thing.h = 26; thing.fatal = false; break;
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
    // (With the chapter-tuned trial, the leg's own ~pace: a chapter that peaks early is busiest early.)
    const d = clamp(difficulty() * (0.8 + legTension() * 0.4), 0, 1);
    const calm = run.breath > 0;
    const s = scene();
    // A tuned leg in its own place keeps the mix its line names (&kinds); a door to another place brings that place's.
    const own = tunedLeg()?.kinds && run.sceneId === (CHAPTER_SCENE[run.chapter] || 'lanes') ? tunedLeg().kinds : s.kinds;
    const kinds = own.filter(allowed);
    const solid = kinds.filter((kind) => !WIDE.has(kind));
    const solids = solid.length ? solid : [(tunedLeg() ? 'stone' : s.kinds.find((kind) => !WIDE.has(kind))) || 'post'];
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
      // A grudge the land holds turns a few more of a mime-keeping room's solid things into mimes, later on.
      if (mimesOn() && kind !== 'mime' && solids.includes('mime') && mimeInstead(mimeGrudge(), Math.random())) kind = 'mime';
      if (kind === 'dividers' || kind === 'mime') {
        const pair = [lane + 1, lane - 1].find((other) => other >= 0 && other < LANES && other !== run.safe && !blocked.has(other));
        if (pair == null) {
          kind = tunedLeg() && !allowed('post') ? 'stone' : 'post';   // (a tuned leg before Bonk City has no bronze posts)
        } else if (kind === 'mime') {
          // A mime, and beside it the wall it is miming: invisible, and also there.
          const mime = makeThing('mime', lane);
          mime.facing = Math.sign(pair - lane);
          if (mimesOn()) {
            mime.former = formerLife(Math.random());
            if (mime.former.panes) run.glassSeen = (run.glassSeen || 0) + 1;
          }
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
    // The room passing leans the lanes its way (and, near its end, toward the next room's way).
    if (!calm) { const roomish = roomThing(free.filter((lane) => !run.things.some((t) => t.y < 0 && t.lane === lane))); if (roomish) run.things.push(roomish); }
    // This chapter's wonders, in the order the leg reaches them. Ones already in your almanac wait a little longer.
    if (run.wonderQueue.length && progress() >= run.wonderQueue[0].at) {
      const wonder = makeThing('wonder', pick(free));
      wonder.wonder = run.wonderQueue.shift();
      if (wonder.wonder.known) wonder.stay = 3.5;
      // Its kind (kinds.mjs): an antique waits longest; a creature that stays, longer; an artifact lies on the road
      // in the near rows, where a step can reach it.
      const wk = wonder.wonder.kind;
      if (wk === 'antique') wonder.stay *= 1.8;
      else if (wonder.wonder.motion === 'stays') wonder.stay *= 1.5;
      if (wk === 'artifact') wonder.hover = rowY(pick([0, 1, 1])) - 10;
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
    // The torch-ants (pie-ants.mjs, the anthills trial): a hill by the road in the field and the lanes; now and then a
    // line of them rolling a boonberry home to it, or carrying a crumb and a scrap of the book to the crows.
    if (anthillsOn()) {
      if (['field', 'lanes'].includes(s.id) && !calm && Math.random() < 0.08 && !run.things.some((t) => t.kind === 'anthill' && t.y < 140)) {
        run.things.push(makeThing('anthill', pick(free)));
      }
      const hill = run.things.find((t) => t.kind === 'anthill' && !t.wapped && t.y > -40 && t.y < run.y - 160);
      if (hill && Math.random() < 0.2) {
        const away = [...Array(LANES).keys()].filter((l) => l !== hill.lane && Math.abs(l - hill.lane) <= 2);
        const berry = makeThing('berry', pick(away));
        berry.y = hill.y - rand(6, 26);
        berry.rollTo = hill.x;
        berry.rolled = true;
        run.things.push(berry);
      }
      if (Math.random() < 0.05) {
        const at = passing();
        const scrap = at ? gossipFrom(at.leg.paras, { from: at.i }) : null;
        if (scrap) {
          const gift = makeThing('antgift', pick(free));
          gift.vx = gift.x < W / 2 ? -22 : 22;
          gift.range = W * 2;
          gift.scrap = { ...scrap, chapter: at.leg.n };
          run.things.push(gift);
        }
      }
    }
    // A season's place by the road (pie-seasons.mjs, the seasons trial): now and then while the season is open; once
    // a chapter after it, for a reader who was there and kept the line.
    const setsKind = run.season?.season.kind || 'place';
    if (run.season && !calm && free.length && !run.things.some((t) => t.kind === setsKind && !t.gift && t.y < 220)) {
      if (run.season.mode === 'open' ? Math.random() < (setsKind === 'dolphin' ? 0.14 : 0.07) : !run.season.set) {
        const place = makeThing(setsKind, pick(free));
        place.faint = run.season.mode !== 'open';
        run.things.push(place);
        run.season.set = true;
      }
    }
    // What else a season sets while it is open: the Ring Tide's donuts, warm on the road.
    if (run.season?.mode === 'open' && !calm && free.length && run.season.season.extras?.length && Math.random() < 0.2) {
      run.things.push(makeThing(pick(run.season.season.extras), pick(free)));
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
    // The land points: arrows on the track and vanes by the lanes (from Four, where the weathercocks
    // vote), and now and then a horn that starts a game.
    if (allowed('arrow') && Math.random() < (run.mini?.id === 'alley' ? 0.85 : 0.06)) {
      const arrow = makeThing('arrow', pick(free));
      arrow.y -= 30;
      run.things.push(arrow);
    }
    if (allowed('vane') && !run.mini && Math.random() < 0.035) {
      const vane = makeThing('vane', pick([0, LANES - 1]));
      vane.y -= 20;
      run.things.push(vane);
    }
    if (allowed('horn') && !run.mini && Math.random() < TUNE.horn_chance) {
      const horn = makeThing('horn', pick(free));
      horn.y -= 40;
      run.things.push(horn);
    }
    const clowns = (run.boon ? 0.62 : 0.14) * (s.id === 'plaza' ? 1.4 : 1);
    if (allowed('clown') && Math.random() < clowns) {
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

  /* ─── Recipes involving tilt, rooms of ingredients, jazz maneuvers, and motif interpretation ─── */
  const jazzOn = () => setting('feel') === 'jazz';
  const recipeIdNow = () => {
    if (!run) return 'warm';
    if (!whole()) return 'thin';
    return run.recipe?.charges > 0 && RECIPES[run.recipe.id] ? run.recipe.id : 'warm';
  };
  function bakeRecipe(id, charges = 3, reason = '') {
    if (!run) return;
    const baked = resolveRecipeBake({ id, prevId: recipeIdNow(), richness: richness(), charges });
    if (!baked) return;
    run.recipe = { id: baked.id, charges: baked.charges, earnedAt: run.t };
    const info = RECIPES[baked.id];
    run.tags.push({ x: run.x, y: run.y - 108, t: 0, text: `RECIPE · ${info.short.toUpperCase()}` });
    spawnRing(run.x, run.y - 20, 32, colors.gold, 0.5);
    if (record.sound) playTone('recipe', baked.id, panOf(run.x), 0);
    if (reason) say(`${info.name}: ${reason}`);
  }
  function creditIngredient(thing, what = 'ingredient') {
    const r = roomNow();
    if (!r || !INGREDIENT_ROOMS.has(r.sigil)) return;
    run.roomPantryT = Math.max(run.roomPantryT || 0, 5.2);
    const home = (r.sigil === '~' && (what === 'berry' || what === 'furrow'))
      || (r.sigil === '*' && (what === 'bone' || what === 'berry'))
      || (r.sigil === '$' && (what === 'flour' || what === 'bone'))
      || (r.sigil === '?' && what === 'sweet');
    const bonus = home ? 0.08 : 0.05;
    if (what === 'flour' || what === 'bone') run.aura = Math.min(1, run.aura + bonus);
    if (what === 'berry' || what === 'sweet' || what === 'furrow' || what === 'donut') run.filling = Math.min(1, run.filling + bonus);
    if (record.sound && setting('music') !== 'quiet') {
      playTone('pantry', what, panOf(thing?.x), depthOf(thing?.y));
    }
    if (home && run.pantryTagAt !== r.n) {
      run.pantryTagAt = r.n;
      run.tags.push({ x: run.x, y: run.y - 72, t: 0, text: 'PANTRY HARMONY · +YIELD' });
    }
  }
  function resolveMotifTension(reason = 'steered') {
    const m = run?.motifState;
    if (!m || !m.tension) return false;
    const was = m.tension;
    m.tension = '';
    m.tensionLevel = 0;
    m.hopHint = false;
    m.safeDir = 0;
    m.resolvedCount += 1;
    setBoardHarmonicState({ tension: '', tensionLevel: 0 });
    if (jazzOn() || setting('motifCues') !== 'off') {
      run.sliceReady = Math.min(1, run.sliceReady + (jazzOn() ? 0.18 : 0.1));
      run.wobble = Math.max(0, run.wobble - (jazzOn() ? 0.07 : 0.04));
      if (run.comboT > 0) run.comboT = Math.min(2.8, run.comboT + 0.6);
      run.tags.push({ x: run.x, y: run.y - 96, t: 0, text: jazzOn() ? `♪ ${was.toUpperCase()} → 9` : `♪ RESOLVED` });
      if (record.sound) playBoardMotifCue({ action: 'resolve', pan: panOf(run.x), kind: reason, stepIndex: m.stepIdx++ });
    }
    return true;
  }
  function noteSwungManeuver(action) {
    if (!run || state !== 'running') return { swung: false };
    const sw = conductor.swungMoment?.();
    const activeJazz = jazzOn();
    if (!sw?.inPocket) return { swung: false };
    if (activeJazz) {
      run.jazzPocketT = Math.max(run.jazzPocketT || 0, 1.15);
      run.jazzChain = sw.freshHit ? Math.min(6, (run.jazzChain || 0) + 1) : (run.jazzChain || 1);
      if (sw.freshHit && record.sound && setting('music') !== 'quiet') {
        playTone('pocket', {
          chain: run.jazzChain,
          sparkle: domainTune('unlocks').pocket_sparkle,
          wobble: run.wobble,
          combo: run.combo,
          richness: richness(),
          presence: run.boon ? 'boon' : run.bane ? 'bane' : '',
          progress: progress()
        }, panOf(run.x), 0);
      }
      if (sw.offbeat && sw.freshHit && action !== 'step') {
        run.tags.push({ x: run.x + 14, y: run.y - 68, t: 0, text: '♪ SWUNG' });
      }
    }
    return { swung: activeJazz, offbeat: sw.offbeat };
  }
  function tickMotifInterpreter() {
    if (!run || state !== 'running' || run.spill) return;
    const m = run.motifState;
    if (run.t - m.lastCueAt < 0.18) return;
    m.lastCueAt = run.t;
    const ahead = run.things.filter((t) => !t.wapped && !t.knocked && !t.cleared && t.y < run.y + 8 && run.y - t.y < 230);
    const laneDanger = new Array(LANES).fill(0);
    let hoppableInLane = false;
    let tallInLane = false;
    let nearItem = null;
    ahead.forEach((th) => {
      const dist = Math.max(1, run.y - th.y);
      const weight = (230 - dist) / 230;
      if (th.fatal) {
        if (WIDE.has(th.kind)) {
          for (let l = 0; l < LANES; l += 1) if (l !== th.gap) laneDanger[l] = Math.max(laneDanger[l], weight);
          if (th.gap !== run.lane && LOW.has(th.kind)) hoppableInLane = true;
        } else {
          const l = laneAt(th.x);
          laneDanger[l] = Math.max(laneDanger[l], weight);
          if (l === run.lane) {
            if (LOW.has(th.kind)) hoppableInLane = true;
            else tallInLane = true;
          }
        }
      } else if (['berry', 'sack', 'boneberry', 'furrow'].includes(th.kind) && !nearItem) {
        nearItem = th;
      }
    });
    // Also cue approaching ingredients aurally while Pantry Harmony resonates.
    if (nearItem && run.roomPantryT > 0 && !run.pantryHeard.has(nearItem) && record.sound) {
      run.pantryHeard.add(nearItem);
      playBoardMotifCue({ action: 'pantry', pan: panOf(nearItem.x), depth: depthOf(nearItem.y), kind: nearItem.kind, stepIndex: m.stepIdx++ });
    }
    const hereDanger = laneDanger[run.lane];
    let bestDir = 0;
    const leftD = run.lane > 0 ? laneDanger[run.lane - 1] : 9;
    const rightD = run.lane < LANES - 1 ? laneDanger[run.lane + 1] : 9;
    if (hereDanger > 0.25 && Math.min(leftD, rightD) < hereDanger - 0.1) bestDir = leftD <= rightD ? -1 : 1;
    else if (run.wobble >= 0.28 && Math.abs(run.tiltDir) >= 0.3) bestDir = Math.sign(run.tiltDir);
    let tension = '';
    if (run.wobble >= 0.45 || hereDanger >= 0.58) tension = 'b9';
    else if (tallInLane || hereDanger >= 0.3 || run.things.some((th) => th.kind === 'mimewall' && Math.abs(th.y - run.y) < 180)) tension = '#11';
    else if (hoppableInLane) tension = 'sus4';
    m.tension = tension;
    m.tensionLevel = Math.max(hereDanger, run.wobble);
    m.safeDir = bestDir;
    m.hopHint = Boolean(hoppableInLane && hereDanger > 0.2);
    setBoardHarmonicState({ tension, tensionLevel: m.tensionLevel });
    if (tension && record.sound && (run.t - m.armedAt > 1.2)) {
      m.armedAt = run.t;
      playBoardMotifCue({
        action: 'steer',
        pan: bestDir ? bestDir * 0.75 : 0,
        depth: 0.2,
        kind: hoppableInLane ? 'low' : tallInLane ? 'tall' : 'clear',
        stepIndex: m.stepIdx++
      });
    }
  }

  /* ─── Stepping: across the scene, a lane at a time ─── */
  const step = (dir) => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    if (run.moveT < 0.45) {
      run.stepBuffer = { fn: 'step', arg: dir };
      return;
    }
    // Frost underfoot: the next step slides a lane further.
    const slid = run.slideT > 0 && clamp(run.lane + dir * 2, 0, LANES - 1) !== clamp(run.lane + dir, 0, LANES - 1);
    const next = clamp(run.lane + dir * (slid ? 2 : 1), 0, LANES - 1);
    if (next === run.lane) {
      run.wobble = Math.min(1, run.wobble + 0.08); // bumping the edge of the lane jostles it a little
      run.tiltDir = clamp(run.tiltDir + dir * 0.45, -1, 1);
      setBoardPosition({ lane: run.lane, row: run.row, lanes: LANES, rows: ROWS });
      sfx('bump', dir);
      playBoardMotifCue({ action: 'maneuver', kind: 'bump', lane: run.lane, row: run.row, dir });
      return;
    }
    if (slid) {
      run.slideT = 0;
      run.tags.push({ x: laneX(next), y: run.y - 84, t: 0, text: 'SLID' });
    }
    const swung = noteSwungManeuver('step');
    const prevLane = run.lane;
    const towardSafe = Boolean(run.motifState?.tension && run.motifState.safeDir === Math.sign(dir));
    const diagonal = run.t - (run.lastClimb ?? -9) < 0.26;
    run.from = run.x;
    run.lane = next;
    run.moveT = 0;
    run.dir = dir;
    run.stillT = 0;
    if (towardSafe) resolveMotifTension('steered');
    // Stepping under the tilt catches the balance instead of adding to the wobble.
    if (run.wobble >= 0.24 && Math.abs(run.tiltDir) >= 0.3 && Math.sign(dir) === Math.sign(run.tiltDir)) {
      const steep = run.wobble;
      const jazzCatchBonus = swung.swung ? 0.05 : 0;
      run.wobble = Math.max(0, run.wobble - (0.14 + jazzCatchBonus));
      run.tiltDir *= 0.25;
      run.steadied = Math.max(run.steadied, swung.swung ? 0.95 : 0.75);
      run.tags.push({ x: laneX(next), y: run.y - 84, t: 0, text: swung.swung ? 'SWUNG CATCH · STEADIED' : 'CAUGHT · STEADIED' });
      spawnRing(laneX(next), run.y - 18, 28, colors.gold);
      setBoardPosition({ lane: run.lane, row: run.row, lanes: LANES, rows: ROWS });
      if (run.motifState?.tension) resolveMotifTension('caught');
      sfx('catch', steep);
      lean('caught');
      if (steep >= 0.34 && whole() && richness() >= 0.42) {
        bakeRecipe('tempered', 3, 'Steep catch tempered the glaze into fast, bouncing slices.');
      }
      if (!run.caughtSaid) {
        run.caughtSaid = true;
        say('Caught the tilt: stepping under the lean steadies the plate.');
      }
      return;
    }
    run.tiltDir = clamp(run.tiltDir * 0.55 + dir * 0.55, -1, 1);
    setBoardPosition({ lane: run.lane, row: run.row, lanes: LANES, rows: ROWS });
    sfx(slid ? 'slide' : 'step', { dir, lane: run.lane, row: run.row });
    run.stepBeat = ((run.stepBeat || 0) + 1) % 16;
    run.cleanSteps = (run.cleanSteps || 0) + 1;
    if (run.cleanSteps === 18) noteSpark('quiet_stretch', { chapter: run.chapter });
    if (slid || diagonal || towardSafe || patternStep(String(domainTune('characters').pattern_mode || 'euclid'), run.stepBeat).active) {
      playBoardMotifCue({ action: 'maneuver', kind: slid ? 'slide' : 'step', pan: panOf(run.x), lane: run.lane, row: run.row, prevLane, prevRow: run.row, towardSafe, diagonal, dir });
    }
    heardAct('step');
    const stepFactor = diagonal ? 0.6 : 1;
    jostle((swung.swung ? 0.55 : 1) * stepFactor);
  };

  /* Ahead and back: up the lanes toward what is coming, or down toward the start line. */
  const climb = (dir) => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    if (run.moveYT < 0.45) {
      run.stepBuffer = { fn: 'climb', arg: dir };
      return;
    }
    const next = clamp(run.row + dir, 0, ROWS - 1);
    if (next === run.row) {
      run.wobble = Math.min(1, run.wobble + 0.06);
      setBoardPosition({ lane: run.lane, row: run.row, lanes: LANES, rows: ROWS });
      sfx('bump', dir);
      playBoardMotifCue({ action: 'maneuver', kind: 'bump', pan: panOf(run.x), lane: run.lane, row: run.row, dir });
      return;
    }
    const swung = noteSwungManeuver('climb');
    const prevRow = run.row;
    const diagonalBool = run.t - run.lastStep < 0.26;
    const diagonal = diagonalBool ? 0.55 : 1;
    run.lastClimb = run.t;
    run.fromY = run.y;
    run.row = next;
    run.moveYT = 0;
    run.stillT = 0;
    setBoardPosition({ lane: run.lane, row: run.row, lanes: LANES, rows: ROWS });
    sfx('climb', { dir, lane: run.lane, row: run.row });
    run.stepBeat = ((run.stepBeat || 0) + 1) % 16;
    run.cleanSteps = (run.cleanSteps || 0) + 1;
    if (run.cleanSteps === 18) noteSpark('quiet_stretch', { chapter: run.chapter });
    playBoardMotifCue({ action: 'maneuver', kind: 'climb', pan: panOf(run.x), lane: run.lane, row: run.row, prevLane: run.lane, prevRow, diagonal: diagonalBool, dir });
    heardAct('step');
    jostle(0.8 * diagonal * (swung.swung ? 0.55 : 1));
  };

  /* A hop: low things pass under it. It rises, hangs, and lands. Another hop pressed while
   * it is in the air is remembered, and leaves the ground again as soon as this one is down. */
  const hopPhase = () => (run?.jumpT > 0 ? clamp(1 - run.jumpT / JUMP_DUR, 0, 1) : 0);
  const inHang = () => { const u = hopPhase(); return u >= HOP_HANG[0] && u <= HOP_HANG[1]; };
  const jumpLift = () => (run?.jumpT > 0 ? hopCurve(hopPhase()) * TUNE.hop_lift * (run.hopPower || 1) : 0);
  const airborne = () => jumpLift() > 9;
  const jump = () => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    if (run.jumpT > 0 || run.jumpCool > 0) {
      run.hopWant = true;
      return;
    }
    run.hopWant = false;
    run.inTimeAtHop = run.inTime || 0;
    heardAct('hop');
    const swung = noteSwungManeuver('hop');
    if (run.motifState?.hopHint) resolveMotifTension('hopped');
    // A deft hop right as a low hazard reaches the carrier lands steadier and readies a slice.
    const grazing = run.things.some((th) => !th.wapped && !th.cleared && !th.knocked && LOW.has(th.kind) && (th.fatal || SLIPS.has(th.kind))
      && Math.abs(th.y - run.y) < 42
      && (WIDE.has(th.kind) ? th.gap !== run.lane : Math.abs(th.x - run.x) < (th.w + 24) / 2));
    run.deftHop = grazing;
    run.stillT = 0;
    run.jumpT = JUMP_DUR;
    // A chain: hop again soon after a good landing and the next hop goes higher; the third is a high
    // hop, which clears the lighter tall things too (=hop_window, =hop_chain).
    const jazzWindow = swung.swung || run.jazzPocketT > 0 ? 1.24 : 1;
    const quick = run.t - (run.lastLand ?? -9) < TUNE.hop_window * (run.carrier.id === 'clerk' ? 1.4 : 1) * jazzWindow;
    run.hopChain = quick && run.lastHopGood ? Math.min(3, (run.hopChain || 0) + 1) : 0;
    run.hopPower = 1 + run.hopChain * TUNE.hop_chain;
    run.highHop = run.hopChain >= 2;
    if (run.hopChain) impact('hop', run.x, run.y - 74, { scale: 0.45 + run.hopChain * 0.25, word: run.highHop ? 'HIGH HOP!' : 'HOP HOP!' });
    if (!reduced?.matches) for (let i = 0; i < 6; i += 1) run.puffs.push({ x: run.x + rand(-10, 10), y: run.y + 14, vx: rand(-50, 50), vy: rand(-30, -5), t: 0.3 });
    run.wobble = Math.min(1.2, run.wobble + (grazing ? 0.01 : 0.025));
    sfx('hop', run.hopChain);
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
    swipe_across: [0.25, 1.2], swipe_along: [20, 90], ahead_bonus: [0, 0.5], drama: [0, 2],
    hop_lift: [16, 44], hop_chain: [0, 0.35], hop_window: [0.2, 1.2], arrow_hold: [0.5, 5], horn_chance: [0, 0.2], mini_dur: [0.5, 2]
  });
  const TUNE_DEFAULTS = Object.freeze({
    aim_step: 0.13, knock_swing: 0.12, pad_pace: 0.85, slow_land: 0.55, foretell_after: 3.2, flinch_chance: 0.22, flinch_tilt: 0.16, in_kind: 0.9,
    swipe_across: 0.5, swipe_along: 40, ahead_bonus: 0.18, drama: 1,
    hop_lift: 26, hop_chain: 0.15, hop_window: 0.55, arrow_hold: 2.2, horn_chance: 0.03, mini_dur: 1
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
    run.aim.a = clamp(run.aim.a + dir * TUNE.aim_step * (run.carrier.id === 'figure' ? 0.7 : 1), -AIM_MAX, AIM_MAX);
    run.aimFocusT = 0.9;   // the carrier's face narrows to the needle
    sfx('aim', { dir, locked: Boolean(sighted(run.aim.a)) });
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
    const leftHigh = airborne();
    const leftHang = Boolean(leftHigh && inHang());
    let loft = leftHang ? 160 : leftHigh ? 85 : 0;
    let bounces = 0;
    let curved = false;
    let ramped = false;
    const bent = new Set();
    let hit = null;
    let off = null;
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
          off = Math.abs(thing.x - x);
          const trueLine = off < (poised() ? 10 : 7);
          label = trueLine && leftHang ? 'HUNG TRUE'
            : trueLine ? 'TRUE'
            : bounces > 0 ? 'BANK SHOT'
            : curved ? 'CURVE SHOT'
            : ramped ? 'LOFT SHOT'
            : leftHang ? 'FROM THE HANG'
            : leftHigh ? 'JUMP THROW'
            : 'THROW';
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
    return { points, hit, label, bounces, curved, ramped, leftHang, leftHigh, off };
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
    const activeRec = recipeIdNow();
    const drain = activeRec === 'set_jam' || activeRec === 'royal' ? SLICE_COST * 0.75 : SLICE_COST;
    run.aura = Math.max(0, run.aura - drain);         // the pie in hand is made whole again from the aura:
    run.filling = Math.max(0, run.filling - drain);   // crust and filling both
    if (run.recipe?.charges > 0) {
      run.recipe.charges -= 1;
      if (run.recipe.charges <= 0) run.recipe = { id: 'warm', charges: 0, earnedAt: run.t };
    }
    const swung = noteSwungManeuver('throw');
    const a = angle == null ? run.aim.a : clamp(angle, -AIM_MAX * 1.4, AIM_MAX * 1.4);
    const from = throwFrom();
    const speedMul = activeRec === 'tempered' || activeRec === 'royal' ? 1.2 : 1;
    const sizeMul = (missing ? 0.85 : 0.9 + rich * 0.6) * (activeRec === 'blistered' || activeRec === 'royal' ? 1.22 : 1);
    const helpBonus = (activeRec === 'set_jam' || activeRec === 'royal' ? 0.75 : 0) + (activeRec === 'royal' ? 0.25 : 0);
    const shot = (heading, echo = false) => ({
      x: from.x, y: from.y, vx: Math.sin(heading) * SLICE_SPEED * speedMul, vy: -Math.cos(heading) * SLICE_SPEED * speedMul,
      reach: SLICE_REACH + (wasPoised ? 45 : 0) + (activeRec === 'tempered' || activeRec === 'royal' ? 65 : 0),
      bounces: 0, t: 0, bent: new Set(), ramped: new Set(), loft: 0, missing, echo, poised: wasPoised,
      recipe: activeRec, blueNote: Boolean(jazzOn() && (swung.swung || run.jazzPocketT > 0 || activeRec === 'royal')),
      pierce: activeRec === 'set_jam' || activeRec === 'royal' ? 1 : 0,
      helping: (missing ? 1 : helping(rich) + (run.tin > 0 ? 0.5 : 0)) + helpBonus,
      size: sizeMul
    });
    const first = shot(a);
    first.sure = run.aimLock > 0;   // thrown on an arrow (or in a parade): Perfect wherever it lands on a face
    if (run.tin > 0 && !missing) run.tin -= 1;   // the sliver tin: half again, three times
    sfx('throw');
    heardAct('throw');
    if (run.motifState?.tension && (wasPoised || swung.swung)) resolveMotifTension('thrown');
    // Thrown from a hop, the slice leaves high. The hang throws it higher. The line still has to be true.
    if (airborne()) {
      const hung = inHang();
      first.loft = hung ? 160 : 85;
      first.hung = hung;
      first.aloft = true;
      run.tags.push({ x: run.x, y: run.y - 100, t: 0, text: hung ? 'FROM THE HANG' : 'JUMP THROW' });
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
    if (wasPoised || ['tempered', 'royal'].includes(activeRec)) run.wobble = Math.max(0, run.wobble - (wasPoised ? 0.05 : 0.04));
    else run.wobble = Math.min(1.2, run.wobble + 0.06);
  };

  /* A slice in flight meets the city. */
  const flySlice = (shot, dt) => {
    shot.t += dt;
    if (run.bane?.id === 'wind') shot.vx += run.bane.dir * 160 * dt;   // a rented wind drifts it
    // Blue-note curve: in jazz feel during pocket poise or Sovereign Quinary, slices subtly bend toward nearby faces.
    if (shot.blueNote && shot.vy < 0) {
      const target = run.things.filter(aimable).filter((other) => other.y < shot.y - 14 && shot.y - other.y < 180 && Math.abs(other.x - shot.x) < 62)
        .sort((a, b) => Math.hypot(a.x - shot.x, a.y - shot.y) - Math.hypot(b.x - shot.x, b.y - shot.y))[0];
      if (target) shot.vx += clamp(target.x - shot.x, -40, 40) * 4.5 * dt;
    }
    const stepDist = Math.hypot(shot.vx, shot.vy) * dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.reach -= stepDist;
    if (!reduced?.matches && Math.random() < 0.48) {
      run.trails.push({
        x: shot.x + rand(-3, 3),
        y: shot.y + rand(-3, 3),
        r: (shot.bounces > 0 || shot.curved || shot.poised || shot.hung) ? 2.4 : 1.7,
        gold: Boolean(shot.bounces > 0 || shot.curved || shot.ramped.size > 0 || shot.poised || shot.hung),
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
          tally('wap', 1, 'over_mimes');
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
        tally('wap', 1, 'sweetened');
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
          if (thing.kind === 'march') { tally('maw', 1, 'boxed'); lean('boxed'); }
          return splat(shot, thing.kind === 'march' ? 'boxed by mimes' : 'splat');
        }
        continue;
      }
      if (Math.abs(thing.x - shot.x) > thing.w * 0.6 + 6 * (shot.size || 1)) continue;   // a bigger slice reaches wider
      if (Math.abs((thing.y - 6) - shot.y) > thing.h * 0.5 + 6) continue;
      if (thing.kind === 'baneberry' && !thing.wapped) {
        // Pinch of baneberry (berries.json): throwing a slice over rich filling catches its tartness to set a jam!
        if (!shot.bent.has(thing) && (run.filling >= 0.58 || shot.poised)) {
          shot.bent.add(thing);
          thing.wapped = true;
          thing.wapT = 0.5;
          thing.spin = 0;
          bakeRecipe('set_jam', 4, 'A pinch of baneberry set the rich filling into glossy ruby jam.');
          run.filling = Math.min(1, run.filling + 0.08);
          continue;
        }
      }
      if (thing.kind === 'clown' || thing.kind === 'switch') {
        const off = Math.abs(thing.x - shot.x);
        const pocketGrace = shot.blueNote ? 3 : 0;
        const trueLine = off < (shot.poised ? 10 : 7) + pocketGrace;
        const closeLine = !trueLine && off < (shot.poised ? 16 : 12) + pocketGrace;
        const piled = [...shot.ramped].some((id) => id !== 'mimes');
        const craft = shot.bounces > 0 || shot.curved || piled || shot.sure;
        const perfect = trueLine || craft;
        const manners = { trueLine, closeLine, hung: Boolean(shot.hung), poised: Boolean(shot.poised), craft, recipe: shot.recipe };
        if (thing.kind === 'switch') foil(thing, perfect, manners);
        else if (shot.missing) wap(thing, 'thin', shot.missing, 1, manners);
        else wap(thing, perfect ? 'perfect' : closeLine ? 'near' : 'throw', null, shot.helping, manners);
        if (shot.recipe === 'savoury' || shot.recipe === 'royal') run.aura = Math.min(1, run.aura + 0.08);
        if (shot.bounces > 0 && perfect) { run.tags.push({ x: thing.x, y: thing.y - 54, t: 0, text: 'OFF THE WALL' }); sfx('trick', { kind: 'bank_score' }, thing.x, thing.y); }
        else if (shot.curved && perfect) { run.tags.push({ x: thing.x, y: thing.y - 54, t: 0, text: 'AROUND THE POST' }); sfx('trick', { kind: 'bank_score' }, thing.x, thing.y); }
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
              poised: shot.poised,
              sure: shot.sure,
              hung: shot.hung,
              aloft: shot.aloft,
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
      if (thing.kind === 'mimewall' && mimesOn() && !thing.shattered) {
        // The pane is imaginary, so it breaks: the slice goes on, the lane opens, the mime only looks. Remembered.
        thing.shattered = true;
        thing.wapped = true;
        thing.wapT = 0;
        const owner = run.things.find((m) => m.kind === 'mime' && !m.wapped && Math.abs(m.y - thing.y) < 8 && Math.abs(m.x - thing.x) < LANE_W * 1.5);
        if (owner) owner.aghast = run.t;
        record.mimes = record.mimes || { shattered: 0 };
        record.mimes.shattered += 1;
        writeRecord(record);
        sfx('trick', { kind: 'mime_glass' }, thing.x, thing.y);
        run.tags.push({ x: thing.x, y: thing.y - 24, t: 0, text: 'IMAGINARY GLASS' });
        if (!run.shatterSaid) { run.shatterSaid = true; say('The slice went through a mime\u2019s imaginary pane. Nothing happens. The mime saw.'); }
        continue;
      }
      if (thing.kind === 'mime' || thing.kind === 'mimewall') {   // caught in an invisible box
        tally('maw', 1, 'boxed');
        lean('boxed');
        return splat(shot, 'boxed');
      }
      if (thing.kind === 'wasps' || thing.kind === 'pigeon') return splat(shot, thing.kind === 'wasps' ? 'snatched by wasps' : 'a pigeon took it');
      if (['puddle', 'snail', 'berry', 'frost', 'furrow', 'egg', 'wonder', 'beaver'].includes(thing.kind)) continue;   // low things: it flies over
      if (shot.pierce > 0) {
        shot.pierce -= 1;
        thing.knocked = true;
        sfx('trick', { kind: 'pierce' }, thing.x, thing.y);
        spawnRing(thing.x, thing.y, 20, colors.berry, 0.35);
        run.tags.push({ x: shot.x, y: shot.y - 14, t: 0, text: 'SET JAM PIERCE' });
        continue;
      }
      return splat(shot, 'splat');
    }
    if (shot.reach <= 0 || shot.y < -30 || shot.y > H + 30) {
      shot.done = true;
      // Come down over a word on the road, the slice feeds it: the word is kept, and nothing is wasted.
      const fed = shot.reach <= 0 ? wordUnder(shot.x, shot.y, 8) : null;
      if (fed && !fed.kept) { keepWord(fed, 'fed'); spawnRing(fed.x, fed.y, 16, colors.berry, 0.4); return undefined; }
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
  const wap = (thing, how = 'plate', missing = null, size = 1, manners = null) => {
    if (how === 'plate' && thing.fedT > 0) return;   // still chewing the last one
    const perfect = how === 'perfect';
    // Satisfaction: a whole slice fills a pip — a pip and a half, rich; two, a full pie — and a Perfect
    // twice that; a slice short of crust or filling half a pip, crumbs a quarter.
    const portion = missing ? (missing === 'everything' ? 0.25 : 0.5) : size * (perfect ? 2 : 1);
    if (!missing && size > 1) run.tags.push({ x: thing.x, y: thing.y - 86, t: 0, text: size >= 2 ? 'A FULL PIE' : 'A BIG SLICE' });
    thing.fed = (thing.fed || 0) + portion;
    thing.fedT = 0.8;
    noteFeed({ word: perfect ? 'a perfect WAP' : how === 'boon' ? 'a WAP from Mr. BoonWAP' : 'a WAP' });
    thing.pied = true;
    thing.missing = missing;
    const want = thing.want || 1;
    const satisfied = thing.fed >= want - 1e-6;
    if (satisfied) {
      thing.wapped = true;
      thing.wapT = 0;
      thing.spin = pick([-1, 1]);
      run.satisfied += 1;
      run.gladT = 1.4;
      if (run.carrier.id === 'genie') run.trueAim = Math.max(run.trueAim, 2);
      meanwhile('clown', 'glad', pick(['WAP!', 'Again!', 'Ha!']));
      lean('satisfied');
      tally('wap', 0.5, 'satisfied');
      thanks(thing);
    } else {
      run.tags.push({ x: thing.x, y: thing.y - 72, t: 0, text: `${Math.round(thing.fed * 100) / 100} OF ${want} · MORE` });
    }
    run.waps += perfect ? 2 : 1;
    if (run.mini) run.mini.score += perfect ? 2 : 1;
    // WAPs close together run on: a combo steadies the pie and readies the next slice.
    run.combo = run.comboT > 0 ? run.combo + 1 : 1;
    run.comboT = 2.6;
    if (run.combo >= 2) {
      run.tags.push({ x: thing.x, y: thing.y - 58, t: 0, text: biased('tag.combo', `COMBO ×${run.combo}`, { what: `×${run.combo}`, seed: run.combo }) });
      run.wobble = Math.max(0, run.wobble - 0.1 * Math.min(run.combo, 4));
      if (run.combo >= 3) run.sliceReady = 1;
      run.bestCombo = Math.max(run.bestCombo || 0, run.combo);
      if (run.combo === 3 || run.combo === 5) {
        if (record.sound && themesOn()) sfx('theme_flourish', { who: run.carrier?.id || 'boof', event: 'combo' });
        carrierSpeak('wap', run.x, run.y);
      }
    }
    if (missing) {
      // A thin pie, and the clown is satisfied anyway: it counts once, never twice.
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: missing === 'everything' ? 'WAP · CRUMBS' : `WAP · NO ${missing.toUpperCase()}` });
      run.bursts.push({ x: thing.x, y: thing.y - 14, t: 0, size: 0.8 });
      if (record.sound) wapSound(run.combo, panOf(thing.x), depthOf(thing.y), { recipe: manners?.recipe || recipeIdNow() });
      say(`WAP, thin: ${missing === 'everything' ? 'crumbs, mostly' : `no ${missing}`}. ${satisfied ? 'Enough, just: the clown is satisfied.' : 'It helps; the clown wants more.'}`);
      return;
    }
    if (perfect) {
      run.perfects += 1;
      lean('perfect');
      const m = manners || {};
      // A true line is the aim. The hang, a held poise, and a worked path each add to it. A trick on its own is still perfect.
      const extra = m.trueLine ? (m.hung ? 1 : 0) + (m.poised ? 1 : 0) + (m.craft ? 1 : 0) : 0;
      run.wobble = Math.max(0, run.wobble - (0.3 + 0.1 * extra));
      run.sliceReady = Math.min(1, run.sliceReady + (m.trueLine ? 0.4 : 0.15) + 0.2 * extra);
      spawnRing(thing.x, thing.y - 10, 32, '#f2c14e', 0.5);
      const word = !m.trueLine ? 'PERFECT' : m.hung ? 'HUNG TRUE' : m.poised ? 'HELD TRUE' : m.craft ? 'WORKED TRUE' : 'TRUE';
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: word });
    } else if (how === 'near') {
      run.wobble = Math.max(0, run.wobble - 0.1);
      run.sliceReady = Math.min(1, run.sliceReady + 0.2);
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'NEAR' });
    } else if (how === 'plate') {
      run.wobble = Math.min(1.2, run.wobble + 0.18);
    }
    run.bursts.push({ x: thing.x, y: thing.y - 14, t: 0, size: ((perfect ? 1.25 : 1) + Math.min(run.combo, 6) * 0.06) * (0.85 + Math.min(1, TUNE.drama) * 0.3) });
    impact(perfect ? 'perfect' : 'clown', thing.x, thing.y - 52);
    if (run.combo >= 3) impact('combo', thing.x, thing.y - 84, { scale: 0.5 + run.combo * 0.15, word: `COMBO ×${run.combo}!` });
    if (record.sound) wapSound(run.combo, panOf(thing.x), depthOf(thing.y), { recipe: manners?.recipe || recipeIdNow(), perfect: perfect || Boolean(manners?.trueLine), satisfied });
    const by = how === 'boon' ? ' Mr. BoonWAP threw that one.' : manners?.trueLine ? ' Dead centre. It counts twice, and the pie is ready for another.' : perfect ? ' Perfectly timed: it counts twice, and the pie steadies.' : how === 'near' ? ' Close: the pie steadies a little.' : '';
    say(run.waps === 1
      ? `WAP. A clown got the pie in the eye, and loved it. The pie on the plate is no smaller.${by}`
      : `WAP. ${run.waps} for the clowns, and still one pie.${by}`);
  };

  /* Mr. BaneWAP's off switch: every scheme has one. */
  const foil = (thing, perfect = false, manners = null) => {
    if (!run.bane) return;
    const scheme = SCHEMES[run.bane.id];
    thing.wapped = true;
    thing.wapT = 0;
    thing.spin = 1;
    run.bane = null;
    run.presenceEnded = run.t;
    run.foils += 1;
    run.lastFoilAt = { x: thing.x ?? W / 2, y: thing.y ?? PRESENCE_Y };
    noteDeed('foil', 'bane');
    tally('wap', 2, 'foiled');
    lean('foiled');
    meanwhile('bane', 'surprised', 'Not over!', { force: true });
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
    if (perfect && manners?.trueLine) {
      run.wobble = Math.max(0, run.wobble - 0.22);
      run.sliceReady = Math.min(1, run.sliceReady + 0.5);
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'FOILED TRUE' });
    } else if (perfect) run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'FOILED FROM AFAR' });
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
      if (asideList().includes(n)) { btn.disabled = true; btn.setAttribute('data-aside', ''); }
      btn.textContent = String(n);
      btn.title = `${chapterWords(n)} (${(SCENES.find((s) => s.id === (CHAPTER_SCENE[n] || 'lanes')) || SCENES[2]).card.replace(/\.$/, '')})${mimesHold(n) ? ' · held by the mimes' : ''}${asideList().includes(n) ? ' · set aside' : ''}`;
      btn.setAttribute('aria-label', asideList().includes(n) ? `${chapterWords(n)} is set aside` : `Start at ${chapterWords(n)}`);
      btn.setAttribute('aria-pressed', n === chosenStartChapter ? 'true' : 'false');
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        chosenStartChapter = n;
        paintCardChapters(n);
        paintCardArt(n);
        if (state === 'title' || state === 'over') {
          cardAction.textContent = state === 'over'
            ? `▶ Play again from ${chapterWords(n)}`
            : n > 1 ? `▶ Play from ${chapterWords(n)}` : '▶ Play';
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
  /* The place a carry would start in, painted at the head of the card that offers it. */
  const cardArt = card.querySelector('[data-pie-card-art]');
  const paintCardArt = (n) => {
    if (!cardArt) return;
    const place = CHAPTER_SCENE[n] || 'lanes';
    if (cardArt.dataset.place === place && !cardArt.hidden) return;
    cardArt.dataset.place = place;
    cardArt.innerHTML = PLACES[place] ? placeSVG(place, { w: 320, h: 110, light: 'dusk' }) : '';
    cardArt.hidden = !PLACES[place];
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
    card.querySelector('[data-pie-card-next]')?.setAttribute('hidden', '');
    if (cardArt) cardArt.hidden = true;
    if (cardChapters) cardChapters.hidden = true;
    if (cardModes) cardModes.hidden = true;
    cardLinks?.replaceChildren();
  };

  /* A toast: where we are now, and who is under the hat. Play does not stop for it. */
  /* The story's beats are paced (pie-pacing.mjs): one at a time with a gap between (wider in a carry's first minute),
   * a quiet stretch after a loud one, a chapter's opening kept for its own words and its last stretch for its ending.
   * What changes play goes at once. Nothing is dropped: a beat that waited too long is folded into the next caption's
   * line, and whatever is left at the end of a carry is said on its card. */
  const pacer = createPacer();
  let foldedNow = [];
  const guessKind = (title, voice, weight) => (/has a scheme|foiled|^Pushed back/i.test(title) ? 'urgent'
    : /^First meeting|holds court|keeps talking|withdraws/i.test(title) ? 'meeting'
      : /^Room \d/.test(title) ? 'room' : weight >= 2 ? 'story' : 'note');
  const paintPaced = (b) => {
    const also = foldedNow.length ? ` ${foldedWords(foldedNow)}` : '';
    foldedNow = [];
    paintCaption(b.title, `${b.line || ''}${also}`, b.ms || 2600, b.voice || '', b.weight || 1);
  };
  const showToast = (title, line, ms = 2600, voice = '', weight = 1, kind = '') => {
    if (!toast || record.view.zen) return;   // zen: nothing pops up; the live region still says it
    const k = kind || guessKind(title, voice, weight);
    const due = pacer.offer({ title, line, ms, voice, weight, kind: k === 'urgent' ? 'scheme' : k, urgent: k === 'urgent' }, performance.now() / 1000);
    if (due) paintPaced(due);
  };
  const pacerTick = () => {
    const { due, folded } = pacer.tick(performance.now() / 1000);
    if (folded.length) foldedNow.push(...folded);
    if (due) paintPaced(due);
  };
  setInterval(pacerTick, 200);
  let captionAt = -99;
  let captionWeight = 0;
  function paintCaption(title, line, ms, voice, weight) {
    captionAt = performance.now() / 1000;
    captionWeight = weight;
    toastTitle.textContent = title;
    toastLine.textContent = line || '';
    toast.dataset.voice = voice;
    toast.classList.remove('is-in');
    void toast.offsetWidth;
    toast.classList.add('is-in');
    clearTimeout(toastTimer);
    // The words stay, quieter, until the next ones: a caption can be read again.
    toastTimer = setTimeout(() => toast.classList.remove('is-in'), ms);
  }
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
  let lastProvenance = '';

  /* ─── The carry, inspected: every achievement a tile; tap one for what it is, how it counted, how it
   * compares with your best and your whole record, the stills of those moments, and its Spw atom ─── */
  const ACHIEVEMENTS = Object.freeze([
    ['cobbles', '.', 'cobbles carried', 'How far up the book the pie went. Further up the lanes, each cobble counts for more (×(1 + rows ahead × =ahead_bonus)).', null, 'best'],
    ['chapters', '^', 'chapters carried through', 'A chapter carried through (or mostly, when it spilled) is kept on that chapter: how you carried it leans its reading on its page.', null, null],
    ['waps', '!', 'clowns given WAP', 'A slice to a clown, square: the pie on the plate is never smaller.', null, 'waps'],
    ['satisfied', '*', 'clowns satisfied', 'A clown whose appetite was filled: a whole slice a pip, a perfect slice two.', 'satisfied', 'satisfied'],
    ['perfects', '*', 'perfect throws', 'Dead centre, or off a wall, off Bonk glass, off a ramp, or on an arrow: it counts twice. Dead centre from the hang, from a held poise, or along a worked path, steadies more.', 'perfect', 'perfects'],
    ['bestCombo', '&', 'WAPs in a row, at best', 'WAPs close together run on: from two the pie steadies; from three, a slice is ready at once.', null, null],
    ['inTimeTotal', '~', 'hops in time', 'A hazard cleared in the hang, the flat top of a hop.', 'in_time', null],
    ['cleared', '~', 'hopped clear', 'A low thing passed under a hop: passed for good, and a slice readies.', 'hop_clear', null],
    ['highClears', '^', 'over the top', 'A taller thing cleared by a high hop, the third of a clean chain.', null, null],
    ['foils', '!', 'Mr. BaneWAP foiled', 'His off switch, found and thrown: a scheme undone.', 'foiled', 'foils'],
    ['kept', '*', 'wonders kept', 'Steered into, up the lanes: kept in your almanac, with a gift for the carry.', 'kept', 'kept'],
    ['shared', '&', 'slices shared', 'A whole slice to a clerk or a subject, who trade you something back.', 'shared', 'shared'],
    ['sweetened', '&', 'baneberries sweetened', 'A baneberry WAPped kindly: its foretelling turns good.', 'sweetened', 'sweetened'],
    ['squashed', '.', 'foretellings left unsaid', 'A baneberry stopped before it could say what would happen.', 'squashed', null],
    ['met', '@', 'met for the first time', 'New to your deck: each has a card, a spell, and a place in the book.', null, null],
    ['newLore', '#', 'lines of lore let slip', 'Said by a pie in the lanes: each is set beside its room on the chapter page.', null, null],
    ['roomsCast', '^', 'rooms cast', 'A room’s own verb, done while it passed (struck, answered, joined, kept…): kept beside the room on the chapter page.', 'cast', null],
    ['wasted', '%', 'slices wasted', 'A slice that hit nothing, or was boxed by a mime. It costs a little of each ingredient.', null, null]
  ]);
  function paintCarrySheet({ cause, distance, best }) {
    const out = document.querySelector('[data-pie-carry-sheet]');
    if (!out || !run) return null;
    const value = {
      cobbles: distance, chapters: run.outcomes.length, waps: run.waps, satisfied: run.satisfied, perfects: run.perfects, bestCombo: run.bestCombo || 0,
      inTimeTotal: run.inTimeTotal || 0, cleared: run.cleared || 0, highClears: run.highClears || 0, foils: run.foils || 0, kept: run.kept || 0,
      shared: run.shared || 0, sweetened: run.sweetened || 0, squashed: run.squashed || 0, met: run.met.length, newLore: run.newLore || 0, wasted: run.wasted || 0,
      roomsCast: run.castThisCarry?.size || 0
    };
    // Bests, kept per achievement (cobbles keeps its own, record.best).
    record.bests = record.bests || {};
    const isBest = {};
    ACHIEVEMENTS.forEach(([key]) => {
      const was = key === 'cobbles' ? null : record.bests[key] || 0;
      isBest[key] = key === 'cobbles' ? best : value[key] > 0 && value[key] > was && key !== 'wasted';
      if (key !== 'cobbles' && key !== 'wasted') record.bests[key] = Math.max(was, value[key]);
    });
    writeRecord(record);
    const shown = ACHIEVEMENTS.filter(([key]) => value[key] > 0 || key === 'cobbles');
    const grid = nodeOf('ul', 'pie-ach-grid');
    const detail = nodeOf('div', 'pie-ach-detail');
    detail.setAttribute('aria-live', 'polite');
    const open = (key, button) => {
      grid.querySelectorAll('.pie-ach').forEach((b) => b.setAttribute('aria-pressed', b === button ? 'true' : 'false'));
      const [, sigil, label, says, leanKey, totalKey] = ACHIEVEMENTS.find(([k]) => k === key);
      const parts = [nodeOf('p', 'pie-ach-what', says)];
      const rule = leanKey && (leanRules[leanKey] || LEAN_DEFAULTS[leanKey]);
      const contest = leanKey && [...CONTEST.wap, ...CONTEST.maw].find(([id]) => id === leanKey);
      if (rule || contest) {
        const worth = nodeOf('p', 'pie-ach-worth');
        worth.append('Each one: ');
        if (rule) worth.append(nodeOf('b', `pie-points-chip is-${rule[0]}`, `${LEAN_GLYPH[rule[0]]} +${fmtPts(rule[1])} ${LEAN_NAMES[rule[0]]}`));
        if (contest) worth.append(' ', nodeOf('b', `pie-points-chip is-${CONTEST.wap.includes(contest) ? 'wap' : 'maw'}`, `${CONTEST.wap.includes(contest) ? 'pie' : 'mimes'} +${fmtPts(contest[1])}`));
        parts.push(worth);
      }
      const compare = [`This carry: ${value[key]}`];
      if (key === 'cobbles') compare.push(`your best: ${record.best}`);
      else if (record.bests?.[key] != null && key !== 'wasted') compare.push(`your best: ${record.bests[key]}`);
      if (totalKey && totalKey !== 'best' && record[totalKey] != null) compare.push(`in every carry so far: ${record[totalKey]}`);
      parts.push(nodeOf('p', 'pie-ach-compare', `${compare.join(' · ')}.`));
      if (key === 'met' && run.met.length) parts.push(nodeOf('p', 'pie-ach-names', run.met.join(', ')));
      // The stills of moments like these, if the show was keeping them.
      const words = { waps: /WAP/i, satisfied: /satisfied/i, perfects: /perfect/i, inTimeTotal: /in time/i, cleared: /hop/i, foils: /foiled/i, kept: /wonder kept/i, shared: /shared/i, sweetened: /sweetened/i }[key];
      const stills = words ? show.stills((c) => words.test(c.words || '')) : [];
      if (stills.length) {
        const strip = nodeOf('div', 'pie-ach-stills');
        stills.slice(0, 3).forEach(({ still }) => {
          const c = document.createElement('canvas');
          c.width = still.width; c.height = still.height;
          c.getContext('2d').drawImage(still, 0, 0);
          c.setAttribute('aria-hidden', 'true');
          strip.append(c);
        });
        parts.push(strip);
      } else if (words && show.mode === 'off') {
        parts.push(nodeOf('p', 'pie-ach-hint', 'Turn on ▢ Show and the next carry keeps stills of moments like these.'));
      }
      // Where in the story it happened: each time, as an outcome in Spw, with a way into that room.
      const where = leanKey ? (run.feed || []).filter((e) => e.events.includes(leanKey) && e.ref).slice(-3).reverse() : [];
      if (where.length) {
        const list = nodeOf('ul', 'pie-ach-where');
        where.forEach((e) => {
          const li = nodeOf('li', '');
          const a = nodeOf('a', '', `Room ${e.ref.n} of ${chapterWords(e.ref.chapter)} →`);
          a.href = `/book/chapter/${pad2(e.ref.chapter)}/${e.ref.id ? `#${e.ref.id}` : ''}`;
          li.append(renderSpell(outcomeSpell(e), { cast: false, layout: 'line', label: 'Where it happened, as Spw' }), a);
          list.append(li);
        });
        parts.push(nodeOf('p', 'pie-ach-sub', 'Where in the story it happened:'), list);
      }
      const atom = `${sigil}${key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)}[${value[key]}]`;
      parts.push(renderSpell(atom, { cast: false, label: `${label}, as Spw` }));
      detail.replaceChildren(nodeOf('p', 'pie-ach-head', `${value[key]} ${label}${isBest[key] ? ' · your best yet' : ''}`), ...parts);
    };
    shown.forEach(([key, sigil, label]) => {
      const li = nodeOf('li', '');
      const b = nodeOf('button', `pie-ach${isBest[key] ? ' is-best' : ''}`);
      b.type = 'button';
      b.dataset.key = key;
      b.setAttribute('aria-pressed', 'false');
      b.append(nodeOf('span', 'pie-ach-sigil', sigil), nodeOf('b', 'pie-ach-n', String(value[key])), nodeOf('span', 'pie-ach-label', label));
      if (isBest[key]) b.append(nodeOf('span', 'pie-ach-best', 'best yet'));
      b.addEventListener('click', () => open(key, b));
      li.append(b);
      grid.append(li);
    });
    const rankedVals = rankValues(run.values);
    const blessing = valueBlessing(run.values);
    const leanName = run.tally ? describeLean({ boon: 1 + run.tally.boon, bane: 1 + run.tally.bane, bone: 1 + run.tally.bone }) : '';
    const leanKind = !run.tally ? 'boon' : (run.tally.bane >= run.tally.boon && run.tally.bane >= run.tally.bone ? 'bane' : run.tally.bone >= run.tally.boon ? 'bone' : 'boon');
    const parallel = parallelReflection({ chapter: run.chapter, carrier: run.carrier.id, state: run.values, lean: leanKind });
    const reflectBox = nodeOf('div', 'pie-values-reflect');
    const activeStyleNow = run.style || creatorStyle;
    const styleNote = styleLineForProvenance(activeStyleNow) || `@style[@${activeStyleNow.handle}]{ #name["${activeStyleNow.name}"] }`;
    reflectBox.append(
      nodeOf('p', 'pie-values-head', `What this carry valued${run.intention && VALUE_DEFS[run.intention] ? ` · held beside ${VALUE_DEFS[run.intention].name.toLowerCase()}` : ''}: ${rankedVals.primary.def.name}`),
      nodeOf('p', 'pie-values-blessing', rankedVals.primary.def.blessing || ''),
      nodeOf('p', 'pie-values-style', `${styleNote}${leanName ? ` · chapter ${leanName}` : ''}`),
      nodeOf('p', 'pie-values-parallel', parallel.line)
    );
    void blessing;
    const spell = lastProvenance ? renderSpell(lastProvenance, { cast: true, play: true, copy: 'lore.land/pie#carry', label: 'This carry, as Spw' }) : null;
    const copy = nodeOf('button', 'pie-tool', '⧉ Copy as a prompt');
    copy.type = 'button';
    const status = nodeOf('p', 'pie-ach-status');
    status.setAttribute('role', 'status');
    copy.addEventListener('click', () => copyInto(carryPrompt({ cause, distance, value }), copy, status));
    out.replaceChildren(
      nodeOf('p', 'pie-flow-head', 'The carry, inspected'),
      nodeOf('p', 'pie-ach-lede', `${chapterWords(run.chapter)}, under ${run.carrier.name}. Tap any of these for what it is and how it counted.`),
      grid, detail,
      reflectBox,
      ...(spell ? [nodeOf('p', 'pie-ach-sub', 'The carry, as Spw: read back by the parser, kept with the provenance cards.'), spell] : []),
      (() => { const p = nodeOf('p', 'pie-ach-actions'); p.append(copy); return p; })(), status
    );
    out.hidden = false;
    const first = grid.querySelector('.pie-ach.is-best') || grid.querySelector('.pie-ach');
    if (first) open(first.dataset.key, first);
    return { value, isBest };
  }
  const copyInto = async (text, button, status) => {
    try { await navigator.clipboard.writeText(text); status.textContent = 'Copied: a scene from this carry, to write from, draw from, or pass along.'; } catch { status.textContent = text; }
    button.blur();
  };
  /* The carry as a prompt: a scene to write or draw from, in the book's voice, with where it came from. */
  function carryPrompt({ cause, distance, value }) {
    const title = document.querySelector('[data-pie-flow-title]')?.textContent?.trim() || '';
    const done = [
      value.waps && `${value.waps} clown${value.waps === 1 ? '' : 's'} given WAP`,
      value.inTimeTotal && `${value.inTimeTotal} hop${value.inTimeTotal === 1 ? '' : 's'} in time`,
      value.kept && `${value.kept} wonder${value.kept === 1 ? '' : 's'} kept`,
      value.foils && 'Mr. BaneWAP foiled',
      run.met.length && `met for the first time: ${run.met.join(', ')}`
    ].filter(Boolean);
    return [
      `A scene from lore.land, the serial book: ${run.carrier.name} carries exactly one pie up the lanes of ${chapterWords(run.chapter)}${title ? `, ${title}` : ''}. ${scene().card}`,
      `The moment it spills: ${CAUSES[cause] || 'it spills, as it was always going to.'}`,
      done.length ? `Before that, ${distance} cobbles of it: ${done.join('; ')}.` : `Before that, ${distance} cobbles of it.`,
      'Tell it, or draw it, warm and exact and a little absurd; nobody is hurt, the hat does not fall, and the pie on the plate is never smaller.',
      `#from["lore.land/pie carry ${new Date().toISOString().slice(0, 10)}"]`
    ].join('\n');
  }
  /* What to try next: one plain prompt, from what actually happened, with a way to do it. */
  function paintNextPrompt({ cause }) {
    const out = card.querySelector('[data-pie-card-next]');
    if (!out || !run) return;
    const n = run.chapter;
    const known = roomsReadIn(n);
    const total = ROOM_TOTALS[n] || 0;
    const tries = [];
    const z = Z[cause];
    const thingName = (CARDS[cause]?.name || MEET[cause]?.[0] || cause).replace(/^(A|An|The) /, '').toLowerCase();
    if (LOW.has(cause)) tries.push({ text: `The ${thingName} was low enough to hop. ⤒ Heights shows the moment to hop it.`, label: '⤒ Open Heights', act: () => { if (heightsPanel) { heightsPanel.open = true; heightsPanel.scrollIntoView({ block: 'nearest' }); } } });
    else if (HIGH_CLEARS.has(cause)) tries.push({ text: `Only a high hop clears a ${thingName}: three clean hops in a row. Or step aside a lane early.` });
    else if (z >= 3) tries.push({ text: `The ${thingName} came through the air: no hop helps. Step aside before it reaches your lane.` });
    else if (cause === 'wobble') tries.push({ text: 'Too much, too soon: stand still a moment and the pie settles; when it leans, step toward the lean to catch it.' });
    else if (KNOCKS[cause]) tries.push({ text: `A ${thingName} is too tall to hop: watch its lane, and step aside early.` });
    const taken = run.outcomes.find((o) => o.outcome === 'won');
    if (taken) tries.push({ text: `The mimes took ${chapterWords(taken.n)}. Win it back: throw over them off a hop, or satisfy clowns faster than they march.`, label: `▶ From ${chapterWords(taken.n)}`, act: () => { chosenStartChapter = taken.n; paintCardChapters(taken.n); cardAction.click(); } });
    if (total && known < total) tries.push({ text: `You have read ${known} of ${total} rooms of ${chapterWords(n)}. Read the rest and the pie is steadier there, and the pies will say what they know of it.`, label: `Read ${chapterWords(n)} →`, href: `/book/chapter/${pad2(n)}/` });
    if (!tries.length) tries.push({ text: 'Try another way up: a different start chapter, or the knack of whoever the hat settles on next.' });
    const [first, ...rest] = tries;
    const make = (t, primary) => {
      const p = nodeOf('p', `pie-card-next-line${primary ? ' is-primary' : ''}`);
      p.append(nodeOf('span', '', t.text));
      if (t.href) { const a = nodeOf('a', 'pie-card-next-act', t.label); a.href = t.href; p.append(' ', a); }
      else if (t.act) { const b = nodeOf('button', 'pie-card-next-act', t.label); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); t.act(); }); p.append(' ', b); }
      return p;
    };
    out.replaceChildren(nodeOf('span', 'pie-card-next-head', 'Next'), make(first, true), ...rest.slice(0, 1).map((t) => make(t, false)));
    out.hidden = false;
  }
  const carryNote = (path, place, source) => ({
    path,
    place,
    cobbles: source?.cobbles ?? null,
    waps: source?.waps || 0,
    carrier: source?.carrier || null,
    wonders: source?.kept || 0,
    eggs: source?.eggs || 0
  });
  const goBack = () => {
    if (!from) return;
    const live = state === 'running' && run;
    leaveBackNote(carryNote(from, live ? chapterWords(run.chapter) : (lastCarry ? chapterWords(lastCarry.chapter) : null), live
      ? { cobbles: null, waps: run.waps, carrier: run.carrier?.name || null, kept: run.kept, eggs: run.eggs }
      : lastCarry));
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
  /* Artifacts made in the lanes (almanac.json made_by; kinds.mjs): when the carries' deeds reach one, it is made
   * and kept in the almanac, with the chapter it was made in, and said; the almanac's shelf of artifacts fills
   * by play as well as by reading. */
  function makeFromDeeds(n) {
    loadAlmanacData().then((data) => {
      const deeds = readStore(DEEDS_KEY);
      const total = (key) => Object.values(deeds).reduce((sum, d) => sum + (d?.[key] || 0), 0);
      const shelf = readStore('lore.almanac.v1');
      (data?.wonders || []).filter((w) => w.made_by && !shelf[w.id] && total(w.made_by.deed) >= w.made_by.at_least).forEach((w) => {
        try { collectWonder(w.id, n); } catch { /* made, if not shelved */ }
        showToast(`* ${w.name} · made in the lanes`, `${w.note} Kept in your almanac.`, 4200, 'wonder', 2);
        say(`${w.name}, made in the lanes, and kept in your almanac.`);
      });
    }).catch(() => {});
  }
  const legs = new Map();
  /* Which chapters carry each foreshadow (semantic.json marks). A plant may sound before the index arrives;
   * the paying chapter is known once it has. */
  let foreshadowIndex = {};
  const foreshadowChaptersOf = (id) => (id && foreshadowIndex[id]) || [];
  fetch('/book/content/semantic.json').then((res) => (res.ok ? res.json() : null)).then((data) => {
    const out = {};
    Object.entries(data?.marks?.foreshadow || {}).forEach(([id, list]) => {
      out[id] = [...new Set((list || []).map((place) => place.c))].filter((n) => n > 0).sort((a, b) => a - b);
    });
    foreshadowIndex = out;
  }).catch(() => {});
  const voiceName = (type) => (/^custom-/.test(type || '') ? type.replace(/^custom-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : null);
  async function loadLeg(n) {
    const [chapter, almanac] = await Promise.all([
      fetch(`/book/content/chapters/${pad2(n)}.json`).then((res) => (res.ok ? res.json() : null)).catch(() => null),
      loadAlmanacData()
    ]);
    const paras = [];
    // Rooms are numbered as the chapter page numbers them: among the sections that have a room.
    const roomNoOf = new Map();
    (chapter?.sections || []).forEach((section, sec) => { if (section.room) roomNoOf.set(sec, roomNoOf.size + 1); });
    (chapter?.sections || []).forEach((section, sec) => {
      const walk = (node) => (node.content || []).forEach((item) => {
        if (item.type === 'paragraph' && item.text) {
          // Variant zero: the book's own words; slots stay ready to turn with the carry's lean.
          const rawText = String(item.text);
          const text = rawText.replace(/\{\{([a-z0-9-]+)\}\}/gi, (_, name) => item.slots?.[name]?.variants?.[0] ?? '');
          paras.push({ text, rawText, slots: item.slots || null, id: section.id || null, sec, roomNo: roomNoOf.get(sec) || null, voice: voiceName(section.type), room: section.room?.spw || null, title: section.title || null, foreshadow: section['data-foreshadow'] || '' });
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
      const titled = (para) => roomAnchor({ title: para.title });
      const i = segue.anchor ? paras.findIndex((para) => para.id === segue.anchor || titled(para) === segue.anchor) : lower.findIndex((text) => text.includes(plain(segue.find)));
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
      .filter((w) => w.made_in !== 'lanes' && (w.home === n || (w.echoes || []).includes(n)))
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
        motion: w.motion || null,
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
  const nextChapter = (n) => {
    const aside = asideList();
    let c = n;
    for (let i = 0; i < TOTAL_CHAPTERS; i += 1) {
      c = c >= TOTAL_CHAPTERS ? 1 : c + 1;
      if (!aside.includes(c)) return c;
    }
    return n >= TOTAL_CHAPTERS ? 1 : n + 1;
  };

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
    keepDeeds(n, { ...run.legEvents, waps: run.waps - (run.legFrom?.waps || 0), satisfied: run.satisfied - (run.legFrom?.satisfied || 0), found: (run.foundLines?.length || 0) - (run.legFrom?.found || 0) });
    makeFromDeeds(n);
    // Whoever carried this chapter crossed their own trope by carrying it: tropes.json names carrier kinds in the
    // lanes (the figure in the plain lines, anyone under the floating title), and a carrier is never a thing passed.
    const worn = tropeOfKind.get(`carrier-${run.carrier.id}`);
    if (worn) tropeMet(worn);
    const lean = describeLean({ boon: 1 + t.boon, bane: 1 + t.bane, bone: 1 + t.bone });
    const topVal = rankValues(run.values).primary.id;
    recordChapterParallel(n, { value: topVal, carrier: run.carrier.id, lean, style: run.style?.handle || creatorStyle.handle });
    if (Object.keys(readChapterParallels()).length >= 2) noteSpark('parallel_pilgrim', { chapter: n, value: topVal });
    run.outcomes.push({ n, outcome, lean });
    if (outcome === 'won') return `Mimes Against WAP take ${chapterWords(n)}: it will be harder to wonder about pie there until you win it back.`;
    if (outcome === 'back') return `${chapterWords(n)} won back from the mimes: its pie words come back.`;
    if (outcome === 'held') return `The mimes keep ${chapterWords(n)}.`;
    return `${chapterWords(n)} carried: its reading ${lean}.`;
  };

  const enterChapter = (wanted, { back = false, first = false, note = '', closed = '' } = {}) => {
    let n = wanted;
    let lapped = false;
    // A chapter set aside is stepped over; the book's order is otherwise the carry's.
    const aside = asideList();
    const stepOver = () => { for (let i = 0; i < TOTAL_CHAPTERS && aside.includes(n) && aside.length < TOTAL_CHAPTERS; i += 1) n += 1; };
    stepOver();
    if (n > TOTAL_CHAPTERS) {
      // Round again: a lap is the whole book, so a carry begun mid-book first goes back to its beginning.
      n = 1;
      if (run.startChapter === 1 || run.wrapped) run.lap += 1;
      run.wrapped = true;
      lapped = true;
      stepOver();
    }
    n = Math.max(1, n);
    // A chapter carried to its end closes with a cadence in its own key, by how it went; the next one's motif waits for it.
    const cadence = closed && record.sound ? chapterCadence(closed) : 0;
    // With Places on, the place the chapter is drawn in decides the ground underfoot, the room and the air; without
    // it the old rule stands (a ground chosen by chapter number, which hears chapters 3, 7, 8 and 12 as the wrong place).
    const placeHeard = placesOn() ? SCENES.find((entry) => entry.id === (CHAPTER_SCENE[n] || 'lanes')) : null;
    setSoundPlace({ chapter: n, held: mimesHold(n), level: levelData.levels[n] || null, after: cadence, lean: leanHeard(n), ...(placeHeard ? { scene: placeHeard } : {}) });
    setAmbience(placeHeard && record.sound ? placeHeard.acoustic.ambience : null);
    conductor.setChapter(n, levelData.levels[n] || null);
    if (record.sound) chapterIncipit(cadence);
    // Themes wait for the chapter's own tune: who is carrying, the first time, and whose chapter this is.
    if (record.sound && themesOn()) {
      const theme = CHAPTER_THEME[levelData.levels[n]?.theme];
      setTimeout(() => {
        if (!run || state !== 'running') return;
        if (first && characterTheme(run.carrier.id, 0)) heardTheme(run.carrier.id);
        else if (theme && characterTheme(theme, 0)) heardTheme(theme);
      }, (cadence + 2.6) * 1000);
    }
    run.prevScene = run.sceneId;
    run.sceneT = first ? 1 : 0;
    run.chapter = n;
    run.tally = newTally(n);
    run.legFrom = { waps: run.waps || 0, satisfied: run.satisfied || 0, found: run.foundLines?.length || 0 };
    run.legEvents = {};
    run.marginAt = run.t + 8;   // after the room has said its name, the margins say what was heard of here
    run.marginSaid = false;
    run.season = seasonNow();   // a season's place, if one is set today (pie-seasons.mjs)
    paintPointsSoon();
    run.lastSection = undefined;
    run.mawWas = mawAhead();
    if (run.sceneId !== (CHAPTER_SCENE[n] || 'lanes') || (first && placesOn())) sceneTexture(CHAPTER_SCENE[n] || 'lanes', cadence);
    run.sceneId = CHAPTER_SCENE[n] || 'lanes';
    // The lanes gain a dimension as the book goes: height from Four, games from Six, depth from Ten.
    const gained = DIMENSIONS_GAINED.find(([from, id]) => n === from && !record.met.includes(`dim-${id}`));
    if (gained) {
      record.met.push(`dim-${gained[1]}`);
      writeRecord(record);
      run.dimFlash = { id: gained[1], t: 0 };
      if (record.sound) dimensionFanfare(gained[1]);
      setTimeout(() => showToast(gained[2], gained[3], 4200, 'wonder'), 1600);
    }
    run.legStart = cobbles();
    run.leg = null;
    run.wonderQueue = [];
    run.eggAt = Math.random() < (tunedLeg(n)?.egg != null ? tunedLeg(n).egg / 100 : EGG_ODDS[n] ?? 0.2) ? rand(0.3, 0.8) : Infinity;
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
      setSoundCarrier(themesOn() ? run.carrier.id : '');
      moved = `The hat moved on. Under it now: ${run.carrier.name}.`;
      turnCard(`carrier-${run.carrier.id}`);
    }
    const who = first ? `Under the hat: ${run.carrier.name}.${run.carrier.says ? ` ${run.carrier.says}` : ''}${REASONS[run.carrier.id]?.escape ? ` ${REASONS[run.carrier.id].escape}` : ''}` : '';
    const held = run.tally.held ? 'The mimes hold this chapter: out-do them before it ends to win it back.' : '';
    const line = [note, lapped ? (run.lap ? 'The book again, and faster.' : 'Back to the beginning of the book.') : '', who, moved, held].filter(Boolean).join(' ');
    const known = roomsReadIn(n);
    const total = ROOM_TOTALS[n] || 0;
    const knownWords = known ? ` You have read ${known}${total ? ` of ${total}` : ''} room${known === 1 ? '' : 's'} here: the pie knows the way${total && known >= total ? ', and the pies will tell you what they know of it' : ''}.` : '';
    pacer.startChapter(performance.now() / 1000);
    run.endingMarked = false;
    showToast(place, biased('toast.chapter', `${line}${knownWords}`, { where: place }), note || held || known ? 4600 : 3200, run.tally.held ? 'bane' : '', 2, 'chapter');
    meanwhile(held ? 'mime' : 'boof', held ? 'thinking' : 'calm', held ? '…' : 'sniff.', { force: true });
    say(`${place}. ${line}`);
  };

  const start = () => {
    colors = palette();
    if (record.sound) { primeAudio(); setMusicBed(setting('music') === 'full'); }
    run = fresh();
    pacer.startCarry(performance.now() / 1000);
    setSoundCarrier(themesOn() ? run.carrier.id : '');
    run.intro = introMode;
    show.reset();
    Object.assign(laneStory, { para: -1, at: -1, capQ: [], cap: '', roadQ: [] });
    roomShown = '';
    hideCard();
    state = 'running';
    // Immersion: on Play, the whole cabinet comes into view (⚙ Setup can leave the page where it is).
    if (record.view.focusOnPlay !== false) {
      // Measured a frame later, once the card is gone; the cabinet sticks at its own top on a wide screen.
      requestAnimationFrame(() => {
        const box = root.getBoundingClientRect();
        const stick = window.matchMedia('(min-width: 62rem)').matches ? parseFloat(getComputedStyle(root).top) || 72 : 6;
        if (box.top < stick - 2 || box.bottom > window.innerHeight + 4) {
          window.scrollTo({ top: Math.max(0, window.scrollY + box.top - stick), behavior: reduced?.matches ? 'auto' : 'smooth' });
        }
      });
    }
    enterChapter(run.chapter, { first: true });
    turnCard(`carrier-${run.carrier.id}`);
    last = performance.now();
    loop();
  };

  const spill = (rawCause) => {
    hideToast();
    setAmbience(null);
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
    // The curtain: the opening of each theme, in the order they were met, after the spill has fallen home.
    if (record.sound && themesOn()) curtainCall(run.heardThemes.filter((who) => who !== 'mime'), 1.6);
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
    const topVal = rankValues(run.values).primary.id;
    recordChapterParallel(run.chapter, {
      value: topVal,
      carrier: run.carrier.id,
      lean: describeLean({ boon: 1 + run.tally.boon, bane: 1 + run.tally.bane, bone: 1 + run.tally.bone }),
      style: (run.style || creatorStyle).handle
    });
    if ((run.style || creatorStyle).id !== 'house') noteSpark('creator_hand', { handle: (run.style || creatorStyle).handle });
    if (Object.keys(readChapterParallels()).length >= 2) noteSpark('parallel_pilgrim', { chapter: run.chapter, value: topVal });
    syncDerivedSparks();
    // The carry, written back as Spw: how this pie came to be where it spilled (pie-powers.mjs).
    keepProvenance(lastProvenance = carryProvenance({
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
    // Exactly one spill is the lanes' whole rule, and every WAP left a plate the end card counts.
    metAt('spill');
    if (run.waps > 0) metAt('plates');
    const at = passing();
    lastCarry = { scene: run.sceneId, chapter: run.chapter, href: at ? passageHref(at) : `/book/chapter/${pad2(run.chapter)}/`, cobbles: distance, waps: run.waps, carrier: run.carrier.name, kept: run.kept || 0, eggs: run.eggs || 0 };
    const best = distance > record.best;
    if (best) record.best = distance;
    writeRecord(record);
    paintBest();
    setTimeout(() => unlockSaid(earn()), 2400);
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
    // A carry's end may find a piece the chapter answers (texture finds, a trial); its link joins the card's.
    const endedRun = run;
    textureFind({ chapter: run.chapter, end: true, page: '/pie/', carry: run }).then((found) => {
      if (!found) return;
      findSaid(found);
      const addLink = () => {
        if (state !== 'over' || run !== endedRun || !cardLinks) return;
        const a = document.createElement('a');
        a.href = found.href;
        a.className = 'pie-card-link pie-card-find-link';
        const art = nodeOf('span', 'pie-card-find-art');
        art.innerHTML = findsMod.folioPictureHTML(found.piece, { sizes: '3rem' });
        a.append(art, nodeOf('span', '', `A piece turned up: ${found.piece.title} →`));
        cardLinks.append(a);
      };
      setTimeout(addLink, 2600);
    });
    setTimeout(() => {
      state = 'over';
      // What this carry did to the book, and what was met for the first time.
      const marks = run.outcomes.map((o) => (o.outcome === 'won' ? `The mimes took ${chapterWords(o.n)}.` : o.outcome === 'back' ? `${chapterWords(o.n)} won back from the mimes.` : o.outcome === 'held' ? `The mimes kept ${chapterWords(o.n)}.` : '')).filter(Boolean).join(' ');
      const carried = run.outcomes.length ? ` Chapters carried through: ${run.outcomes.length}.${marks ? ` ${marks}` : ''}` : '';
      const firsts = run.met.length ? ` Met for the first time: ${run.met.join(', ')}.` : '';
      // The card is a prompt: what happened in a line, what stood out, and what to try next. Everything
      // else, inspectable, is in The carry, inspected, beside the screen.
      showCard(biased('spill.title', 'Exactly one.', { who: run.carrier.name }), `${biased('spill.line', CAUSES[cause], { who: run.carrier.name, where: chapterWords(run.chapter) })} ${run.carrier.name.charAt(0).toUpperCase()}${run.carrier.name.slice(1)}, ${distance} cobbles${best ? ', further than ever' : ''}, as far as ${chapterWords(run.chapter)}${run.lap ? ` (the book ${run.lap + 1} times over)` : ''}.${marks ? ` ${marks}` : ''}`, chosenStartChapter > 1 ? `▶ Play again from ${chapterWords(chosenStartChapter)}` : '▶ Play again');
      const waited = foldedWords(pacer.drain());
      if (waited && cardLine) cardLine.textContent = `${cardLine.textContent} ${waited}`;
      const sheet = paintCarrySheet({ cause, distance, best });
      paintNextPrompt({ cause, sheet });
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
        read.addEventListener('click', () => leaveBackNote(carryNote(lastCarry.href, chapterWords(lastCarry.chapter), { cobbles: distance, waps: run.waps, carrier: run.carrier.name, kept: run.kept, eggs: run.eggs })));
        links.push(read);
      }
      if (run.outcomes.length) {
        const marked = document.createElement('a');
        marked.href = '#pie-carries';
        marked.className = 'pie-card-link';
        marked.textContent = 'See what your carries have done to the book →';
        links.push(marked);
      }
      const inspect = document.createElement('a');
      inspect.href = '#pie-carry-sheet';
      inspect.className = 'pie-card-link';
      inspect.textContent = 'The carry, inspected →';
      inspect.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.getElementById('pie-carry-sheet');
        target?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
        target?.querySelector('.pie-ach')?.focus({ preventScroll: true });
      });
      links.unshift(inspect);
      if (newLore) {
        const slip = document.createElement('a');
        slip.href = '#pie-lore';
        slip.className = 'pie-card-link';
        slip.textContent = `✦ The pies let slip ${newLore} new line${newLore === 1 ? '' : 's'} of lore →`;
        links.unshift(slip);
      }
      const home = returnAnchor();
      if (home) links.push(home);
      // How the carry was scored, in the same chips as the lanes: the three ways, and the contest.
      const pts = run.points || {};
      if (Object.keys(pts).length) {
        const scored = nodeOf('span', 'pie-card-points');
        scored.append(nodeOf('span', 'pie-card-points-head', 'How it was scored'));
        ['boon', 'bane', 'bone'].forEach((cat) => { if (pts[cat]) scored.append(nodeOf('b', `pie-points-chip is-${cat}`, `${LEAN_GLYPH[cat]} ${fmtPts(pts[cat])} ${LEAN_NAMES[cat]}`)); });
        if (pts.wap) scored.append(nodeOf('b', 'pie-points-chip is-wap', `pie ${fmtPts(pts.wap)}`));
        if (pts.maw) scored.append(nodeOf('b', 'pie-points-chip is-maw', `mimes ${fmtPts(pts.maw)}`));
        const most = Object.entries(run.pointWords || {}).sort((a, b) => b[1] - a[1]).slice(0, 2);
        if (most.length) scored.append(nodeOf('span', 'pie-card-points-most', `Most of it: ${most.map(([w, n]) => `${w} ×${n}`).join(', ')}.`));
        links.unshift(scored);
      }
      // Beyond the frame (tropes.json#beyond-the-frame): every WAP leaves a plate for the washer-up nobody thanks.
      if (run.waps > 0) links.unshift(nodeOf('span', 'pie-card-plates', `${run.waps} plate${run.waps === 1 ? '' : 's'} left for the washer-up, beyond the frame.`));
      // What a season left this carry (pie-seasons.mjs): one line, kept with the provenance cards.
      if (run.keptLine) { const keptNote = nodeOf('a', 'pie-card-kept', SEASON_SAYS[run.keptLine]?.ended || 'A line was kept. It is with your carries.'); keptNote.href = '#pie-provenance'; links.unshift(keptNote); }
      // What was taken from the road, word by word: the carry's found lines (and any words short of one).
      const leftover = (run.found?.length || 0) % 5;
      if (run.foundLines?.length || leftover) {
        const lines = [...(run.foundLines || []), ...(leftover ? [`${run.found.slice(-leftover).join(' ')} …`] : [])];
        const foundWrap = nodeOf('span', 'pie-card-found', `Found on the road: ${lines.map((line) => `«${line}»`).join(' ')}`);
        if (run.foundSpells?.length) {
          const spellEl = renderSpell(run.foundSpells[run.foundSpells.length - 1], { cast: false, play: true, copy: 'lore.land/pie#found-line', layout: 'line', label: 'Found road line, as Spw' });
          spellEl.classList.add('is-compact');
          foundWrap.append(' ', spellEl);
        }
        links.unshift(foundWrap);
      }
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
    // Bonk glass remembers: a pane struck here is one more blow the margin's lantern glass counts (references.json glass).
    if (thing.kind === 'pane' && run.legEvents) run.legEvents.pane_struck = (run.legEvents.pane_struck || 0) + 1;
    // How a carrier takes a knock: the porter barely, the clerk and the clown badly; a savoury pie cushions more.
    let tilt = cost.tilt * clamp(run.carrier.wobble / 0.18, 0.7, 1.3) * (['savoury', 'royal'].includes(recipeIdNow()) ? 0.75 : 1);
    const frilled = run.frill > 0;
    if (frilled) {
      // Frill-lichen: more edge than room, and a knock lands on the edge.
      tilt *= 0.5;
      run.frill -= 1;
    }
    run.wobble = Math.min(1.2, run.wobble + tilt);
    run.stillT = 0;
    run.cleanSteps = 0;
    run.tiltDir = clamp(run.tiltDir + (thing.x < run.x ? 0.65 : -0.65), -1, 1);
    // A knock turns the carrier, and the needle turns with them, away from what hit.
    if (!(run.aimLock > 0)) run.aim.a = clamp(run.aim.a + (thing.x < run.x ? TUNE.knock_swing : -TUNE.knock_swing), -AIM_MAX, AIM_MAX);
    run.hurtT = 0.9;
    run.rattled = 0.6;
    run.shake = 0.28;
    run.knockT = 1.6;
    run.lastKnock = thing.kind;
    lean('knocked');
    if (!callbackSaid(`knock:${thing.kind}`) && !react(`knock:${thing.kind}`)) meanwhile(CHARACTERS[run.carrier.id] ? run.carrier.id : 'boof', CHARACTERS[run.carrier.id] ? 'worried' : 'surprised', pick(['Oof.', 'Steady…', 'Mind it!']));
    if (thing.kind === 'mime' || thing.kind === 'mimewall' || thing.kind === 'march') tally('maw', 1, 'mime_knock');
    sfx('knock', tilt, thing.x, thing.y);
    if (frilled) sfx('trick', { kind: 'frill_catch' }, thing.x, thing.y);
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
    say(`Knocked by ${thing.kind === 'dividers' ? 'the pie-dividers' : thing.kind === 'banerose' ? 'a bane rose' : `a ${thing.kind}`}. The pie tilts${cost.crust ? ' and loses crust' : ''}${cost.filling ? ' and loses filling' : ''}.`);
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
    creditIngredient(thing, 'flour');
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
    paintPointsRules();
    whimsyRules = {
      sprites: { ...(bookRules?.whimsy || {}), ...(visitRead?.whimsy || {}) },
      scenes: { ...(bookRules?.scenes || {}), ...(visitRead?.scenes || {}) }
    };
    tuningDomains = { ...savedTuningDomains, ...parseTuningDomains(visitSpells()) };
  };
  const readVisit = async () => { visitRead = visitSpells() ? await readRules(visitSpells()) : null; compose(); };
  // The rules are read by the real parser (650 KB): it loads when someone first reaches for the game (a touch, a
  // key), or after a while on the page, never just for passing through; until then the lanes run on their defaults.
  const whenQuiet = (fn) => {
    let done = false;
    const go = () => { if (done) return; done = true; ['pointerdown', 'keydown'].forEach((t) => document.removeEventListener(t, go, true)); fn(); };
    ['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, go, { capture: true, passive: true }));
    setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 4000 }) : go()), 12000);
  };
  whenQuiet(async () => {
    bookRules = await loadRules();
    loadAudioTropes().then((tropes) => { audioTropes = tropes; }).catch(() => {});
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
      sfx(p.kindly ? 'berry' : 'fulfil', 0, x, 60);
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
    // Somebody answers what the power does longest (pie-reactions.mjs, the reactions trial).
    const taken = powerMoments(power)[0];
    if (taken) react(taken);
    if (record.sound && setting('music') !== 'quiet' && (power.acts?.length || Object.keys(t).length || Object.keys(c).length)) {
      playTone('power_story', power, panOf(run.x), 0);
    }
  }
  /* How the land's own move while they wait (kinds.mjs MOTIONS): a roamer wanders across the lanes, a swimmer
   * keeps to the seam between two, a lagger comes to where the carrier was a beat ago, a contrivance hums, an
   * antique or an artifact keeps still; the rest sway a little. */
  function wonderSway(thing, dt) {
    const w = thing.wonder || {};
    if (reduced?.matches) return 0;
    const t = run.t + thing.born;
    switch (w.motion) {
      case 'roams': return Math.sin(t * 0.9) * LANE_W * 0.7;
      case 'swims': return LANE_W / 2 * (Math.sin(t * 1.6) > 0 ? 1 : -1) + Math.sin(t * 5) * 2;
      case 'flies': return Math.sin(t * 2.6) * 10;
      case 'burrows': return Math.sin(t * 1.2) * 3;
      case 'lags': {
        // It drifts toward where the carrier was a beat ago.
        thing.lagX = thing.lagX ?? thing.home;
        thing.lagX += ((run.lastX ?? run.x) - thing.lagX) * Math.min(1, dt * 0.9);
        run.lastX = (run.lastX ?? run.x) + (run.x - (run.lastX ?? run.x)) * Math.min(1, dt * 1.2);
        return clamp(thing.lagX - thing.home, -LANE_W * 1.5, LANE_W * 1.5);
      }
      case 'stays': return 0;
      default: break;
    }
    if (w.kind === 'contrivance') return Math.sin(t * 40) * 1.2;   // it hums
    if (w.kind === 'antique' || w.kind === 'artifact') return 0;
    return Math.sin(t * 2) * 6;
  }
  /* Whether it can be kept from where the carrier is: a flier only from a hop, a burrower only from the ground. */
  function reachable(thing) {
    const motion = thing.wonder?.motion;
    const up = airborne();
    if ((motion === 'flies' && !up) || (motion === 'burrows' && up)) {
      if (!thing.saidHow) {
        thing.saidHow = true;
        run.tags.push({ x: thing.x, y: thing.y - 34, t: 0, text: motion === 'flies' ? 'IT FLIES · HOP TO KEEP' : 'IT BURROWS · KEEP YOUR FEET' });
      }
      return false;
    }
    return true;
  }
  function keep(thing) {
    const w = thing.wonder;
    thing.wapped = true;
    thing.wapT = 0.5;
    thing.spin = 0;
    thing.kept = true;
    run.kept += 1;
    run.lastWonderKind = w.kind;
    run.wonderChain = Math.min(6, (run.wonderChain || 0) + 1);
    run.wonderChainT = 6.5;
    (run.keptIds ||= []).push(w.id);
    lean('kept');
    const prog = progress();
    const mov = prog < 0.25 ? 'opening' : prog < 0.55 ? 'rising' : prog < 0.82 ? 'bridge' : 'turnaround';
    sfx(powerFor(w.id)?.refs?.sound || 'wonder', { kind: w.kind, id: w.id, found: true, movement: mov });
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
    const syntaxAtom = `${sigil}${String(w.id || 'wonder').replace(/-/g, '_')}[${w.kind}]`;
    const chainN = run.wonderChain || 1;
    if (chainN >= 2) {
      run.sliceReady = Math.min(1, run.sliceReady + 0.08 * chainN);
      if (jazzOn()) run.jazzPocketT = Math.max(run.jazzPocketT || 0, 1.1 + chainN * 0.25);
      // Re-up auto-hop charges on chained wonders, at odds with pie poise (wobble).
      run.autoHopCharges = Math.min(3, (run.autoHopCharges || 0) + 1);
      run.wobble = Math.min(1.2, run.wobble + 0.07);
    }
    const chainLabel = chainN >= 2 ? ` · ♪×${chainN}${chainN >= 4 ? ' UPPER' : chainN >= 3 ? ' #11' : ' +9'}` : '';
    run.tags.push({ x: thing.x, y: thing.y - 30, t: 0, text: `${sigil} ${w.name.toUpperCase()} · ${syntaxAtom}${chainLabel}` });
    showToast(`${sigil} ${w.name}${isNew ? ' · new to your almanac' : ' · kept'}`, `${gift?.says || ''} (${syntaxAtom})`.trim(), 3200, gift?.refs?.voice || 'wonder');
    say(`${w.name}, kept${isNew ? ', and new to your almanac' : ''}. ${gift.says}`);
    markWonder(w.id, 'kept');
  }
  function meetEgg(thing) {
    thing.met = true;
    run.warm = 9;
    run.shield = true;
    lean('egg');
    sfx('egg');
    sfx('easter_egg', 'egg_warmth');
    spawnRing(thing.x, thing.y, 40, '#f0ad58', 0.65);
    if (voiceOn()) {
      carrierSpeak('egg', thing.x, thing.y);
      (run.marks ||= []).push(warmthMark(thing.x, thing.y - 6, run.eggs + 1));
    }
    run.eggs = (run.eggs || 0) + 1;
    record.eggs = (record.eggs || 0) + 1;
    writeRecord(record);
    if (record.eggs >= 3) {
      sfx('easter_egg', 'shepard');
    }
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
  let titleTaps = 0;
  let titleTapTimer = null;
  if (flowTitle) {
    flowTitle.addEventListener('click', () => {
      titleTaps += 1;
      clearTimeout(titleTapTimer);
      titleTapTimer = setTimeout(() => { titleTaps = 0; }, 1200);
      if (titleTaps >= 3) {
        titleTaps = 0;
        sfx('easter_egg', 'pi');
        if (voiceOn()) {
          const said = hushToast('pi');
          (run.marks ||= []).push(hushMark('pi', run.x, run.y - 20));
          showToast(said.title, said.body, 3400, 'flour');
        } else showToast('The 1pi(e) prophecy', '3.141592653589793… sung in key', 3400, 'flour');
      }
    });
  }
  let wondersTaps = 0;
  let wondersTapTimer = null;
  if (flowWonders) {
    flowWonders.addEventListener('click', (e) => {
      if (e.target.closest('.pie-flow-wonder.is-quiet')) {
        wondersTaps += 1;
        clearTimeout(wondersTapTimer);
        wondersTapTimer = setTimeout(() => { wondersTaps = 0; }, 1200);
        if (wondersTaps >= 3) {
          wondersTaps = 0;
          sfx('easter_egg', 'golden');
          if (voiceOn()) {
            const said = hushToast('golden');
            (run.marks ||= []).push(hushMark('golden', run.x, run.y - 20));
            showToast(said.title, said.body, 3400, 'wonder');
          } else showToast('Remainder moths', 'Phi golden spiral round the flame', 3400, 'wonder');
        }
      }
    });
  }
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
        if (para.cue) li.dataset.cue = para.cue;
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
        .filter(([event]) => leanRow(event)[0] === cat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([event, n]) => `${Math.round(n)} ${leanWord(event)}`);
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
    const topVal = run.values ? rankValues(run.values).primary : null;
    const styleNow = run.style || creatorStyle;
    const key = ['live', t.boon, t.bane, t.bone, t.wap, t.maw, t.mawSeen, ahead, run.chapter, run.carrier.id, run.strokes, topVal?.id, topVal?.score, styleNow?.handle].map((v) => (typeof v === 'number' ? Math.round(v * 2) : v)).join('|');
    if (key === nowKey) return;
    nowKey = key;
    const lean = { boon: 1 + t.boon, bane: 1 + t.bane, bone: 1 + t.bone };
    const bar = makeLeanBar(lean);
    const whoParts = [
      `Under the hat: ${run.carrier.name}${run.carrier.id === 'figure' && run.strokes ? ` (${run.strokes}/9 strokes steadying)` : ''}${run.carrier.knack ? ` · knack: ${run.carrier.knack.name.toLowerCase()}` : ''}`,
      run.charm ? `charm ${run.charm.expr}` : null,
      topVal && topVal.score > 0 ? `value: ${topVal.def.name.toLowerCase()}` : null,
      styleNow && styleNow.id !== 'house' ? `style @${styleNow.handle}` : null
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
    laneStoryTick(i, f - i);
    announceRoom();
    const { top, h } = flowMeasure[i];
    // Where the passing line sits (⚙ Setup: high, middle, low), and how the story moves: a passage at a
    // time (each held still while it passes, easier to read) or smoothly with the carry.
    const focus = flowProse.parentElement.clientHeight * (Number(record.view.storyLine) || 0.5);
    const byPassage = (record.view.storyMotion || 'passage') === 'passage';
    flowProse.classList.toggle('is-by-passage', byPassage);
    const shift = Math.round(byPassage ? focus - (top + h / 2) : focus - (top + h - (f - i) * h));
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
      if (placesOn()) { setSoundScene(scene()); sceneTexture(para.scene); }   // the door is heard, and the new place's air
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
    const planted = para.foreshadow || '';
    if (planted !== (run.foreshadow || '')) {
      run.foreshadow = planted;
      if (planted) foreshadowHear(planted, { chapter: run.chapter, appearances: foreshadowChaptersOf(planted) });
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
    // A tuned leg whose cast does not have him yet (before Bonk City) keeps him out, however he is called.
    if (castBars('boon')) return;
    run.boon = { t: 0, dur: 8.5, lobIn: 0.9 };
    cadenceVoice('boon', cadenceFor('boon'));
    turnCard('boon');
    recall('boon');
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
    voiced('boon');
    const said = speak('boon');
    const words = said ? `“${said.text}”` : 'A sentient pie of the quinary five. Clowns flock to him, and every pie finds an eye.';
    showToast(`Mr. BoonWAP holds court${said?.isNew ? ' · ✦ new' : ''}`, words, 6000, 'boon');
    say(`Mr. BoonWAP holds court; clowns flock to him. ${said ? said.text : ''}`);
  };
  const scheme = () => {
    // After his turn (a tuned leg whose cast leaves him out), nothing is schemed and nothing is said, however he was
    // called: the presence timer, a passage that names him, the bane shelf's chain, a gift to the other side.
    if (castBars('bane')) return;
    const may = tunedLeg()?.schemes;
    const ids = Object.keys(SCHEMES).filter((key) => (key !== 'march' || allowed('march')) && (!may || may.includes(key)));
    if (!ids.length) return;
    recall('bane');
    // Panes broken in earlier chapters and carries make the march easier to call (pie-mimes.mjs): never at once.
    if (mimesOn() && ids.includes('march')) ids.push(...Array(marchWeight({ grudge: mimeGrudge(), glassSeen: run.glassSeen || 0 })).fill('march'));
    let id = pick(ids);
    let chose = null;
    if (shelvesOn()) {
      // The shelves tilt the scheme (a floor of one in twenty keeps every scheme possible); the mimes' extra chances
      // still count, as more weight on the march.
      const counts = ids.reduce((acc, key) => { acc[key] = (acc[key] || 0) + 1; return acc; }, {});
      const odds = branchOdds(Object.keys(counts).filter((key) => SCHEME_SIGNATURES[key]).map((key) => ({ id: key, signature: SCHEME_SIGNATURES[key] })), run.shelfV || shelfVector(), { firmness: 2 });
      const weighted = odds.map((o) => ({ id: o.id, w: o.p * counts[o.id] }));
      const total = weighted.reduce((n, o) => n + o.w, 0);
      let r = Math.random() * total;
      id = weighted.find((o) => (r -= o.w) < 0)?.id || id;
      // His scheme is a fork on the shelves (valence-shelves.mjs SCHEME_FORK): what each place weighed this time.
      chose = { odds: weighted.map((o) => ({ id: o.id, p: total ? o.w / total : 0 })), drew: id };
    }
    // The bane chain called a march (=bane@scheme{ @march }): the next scheme is one, if a march may happen here.
    // Then the chain chose it, not the odds, and no fork line is shown for it.
    if (run.marchNext && ids.includes('march')) { id = 'march'; run.marchNext = false; chose = null; }
    if (!met('bane')) { record.met.push('bane'); writeRecord(record); }
    const fed = Math.min(5, run.baneStore || 0);
    run.baneStore = 0;
    turnCard('bane');
    run.bane = { id, t: 0, dur: 9 + fed * 1.2, fed, beat: id === 'relet' ? 2.4 : id === 'march' ? 3.2 : 1.8, nextBeat: 1.6, dir: pick([-1, 1]) };
    run.pendingSwitch = true;
    run.lastPresence = 'bane';
    meanwhile('bane', 'thinking', 'Hm. Yes.', { force: true });
    // Once a carry, the line that chose: his places ranked by what each weighed (first strongest), and the one drawn.
    const fork = chose && !run.schemeFork ? schemeChose(chose.odds, chose.drew) : null;
    if (fork) {
      run.schemeFork = { ...fork, drew: chose.drew };
      run.tags.push({ x: W / 2, y: PRESENCE_Y + 28, t: 0, text: fork.drawn });
    }
    showToast('Mr. BaneWAP has a scheme.', `${SCHEMES[id].says} Somewhere ahead: an off switch.${fork ? ` Your shelves weighed ${fork.ranked} and drew @${chose.drew}.` : ''}`, fork ? 4600 : 3400, 'bane');
    say(`Mr. BaneWAP has a scheme. ${SCHEMES[id].says} Find the off switch.${fork ? ` Your shelves drew it: ${fork.words}.` : ''}`);
    voiced('bane');
  };

  const update = (rawDt) => {
    // A chapter's last stretch: kept for its ending (pie-pacing.mjs).
    if (run && state === 'running' && !run.endingMarked && run.legLength && progress() > 0.94) { run.endingMarked = true; pacer.chapterEnding(performance.now() / 1000); }
    // Hit-stop: the world holds its breath a moment at a great impact (the pops and bits still move).
    let dt = rawDt;
    if (run?.hitStop > 0) { run.hitStop = Math.max(0, run.hitStop - rawDt); dt = rawDt * 0.12; }
    if (isAsking() && state === 'running') dt *= 0.25;   // ? Ask: the lanes slow while you look
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
      const head = run.revealQueue[0];
      head.waited = (head.waited || 0) + dt;
      const pace = run.intro ? 'at-once' : setting('cardPace');
      // A breath: the section's break, or nothing knocking within reach of the carrier.
      const calm = run.breath > 0 || !run.things.some((th) => th.fatal && !th.wapped && th.y < run.y + 10 && run.y - th.y < 230);
      // A first carry ever (none finished yet, and not the introductions): the lanes come first. The first card waits
      // until the pie has been in the player's hands for ten seconds; a phone visit used to open one a second in.
      // At a breath, nobody meets a card in a carry's first moments either: six seconds in hand first. At once stays
      // at once, as whoever chose it knows it (a floor there only piles the cards up to open back to back).
      const floor = run.intro ? 0 : record.runs === 0 ? 10 : pace === 'breath' ? 6 : 0;
      // At a breath, cards keep their distance: twelve seconds of carrying between two, so a room full of first
      // meetings does not stop the carry three times running.
      const spaced = pace !== 'breath' || run.lastCardT == null || run.t - run.lastCardT >= 12;
      if (run.t >= floor && spaced && (pace !== 'breath' || head.waited > 20 || (calm && head.waited > 1))) {
        run.lastCardT = run.t;
        openReveal(run.revealQueue.shift());
        return;
      }
    }
    run.t += dt;
    // The haggle is heard as it is drawn, on the carry's own clock: a tock for each struck price, then the coin.
    run.moments?.forEach((m) => {
      if (m.kind !== 'haggle') return;
      const age = run.t - m.t0;
      m.heard ||= 0;
      while (m.heard < HAGGLE_BEATS.strikes.length && age >= HAGGLE_BEATS.strikes[m.heard]) { sfx('haggle', m.heard, run.x, run.y); m.heard += 1; }
      if (!m.coin && age >= HAGGLE_BEATS.coin) { m.coin = true; sfx('coin', 0, run.x, run.y); }
    });
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
        enterChapter(run.chapter + 1, { note, closed: run.outcomes[run.outcomes.length - 1]?.outcome || 'carried' });
        return;
      }
      const at = passing();
      if (at && at.i !== run.paraAt) {
        run.paraAt = at.i;
        onPassage(at.para);
      }
      // Rows a set distance apart, so the time to react holds as the pace builds; with a level, they are let in
      // so that they reach the carrier on its beats (pie-rhythm.mjs), and the music keeps the same time.
      const gap = clamp(270 - difficulty() * 120, 150, 270);
      // The clock says each step a moment before it falls, and how long until it does in the listener's time
      // (the pace, a held breath and ? Ask all slow the game's clock), so every sound it starts is on the audio clock.
      const rate = (record.view.pace || 1) * (rawDt > 0 ? dt / rawDt : 1);
      const music = conductor.tick(dt, { speed: Math.max(run.speed, 60), travel: (run.y + 44) / Math.max(run.speed, 60), gap, rate });
      if (Object.keys(levelData.levels).length) {
        if (music.row) spawnRow();
      } else {
        run.rowIn -= dt;
        if (run.rowIn <= 0) {
          spawnRow();
          run.rowIn = gap / Math.max(run.speed, 90);
        }
      }
      if (music.beat) markBeat(music.late);
      if (music.ahead.length && record.sound) {
        // The land's bass keeps the bar, develops through the chapter's four movements, and turns every fourth;
        // it keeps its rhythm softly in its room; rhythms found play under the carry (⚙ Setup › Music).
        const progNow = progress();
        const richNow = richness();
        const presNow = run.boon ? 'boon' : run.bane ? 'bane' : '';
        const paceNow = paceAt(levelData.levels[run.chapter]?.leg?.pace, progNow);
        music.ahead.forEach((h) => landPulse({ ...h, progress: progNow, wobble: run.wobble, combo: run.combo, richness: richNow, presence: presNow, tropeStage: run.lastTropeStage || '', wonderKind: run.lastWonderKind || '', wonderChain: run.wonderChain || 0, chapter: run.chapter, motivation: run.motivation || '', pace: paceNow, foreshadow: run.foreshadow || '', foreshadowChapters: foreshadowChaptersOf(run.foreshadow) }));
        conductor.hitsIn(music.ahead).forEach((h) => rhythmHit({ voice: conductor.rhythm.voice, strong: h.strong, whisper: true, pan: 0.35, step: h.step, in: h.in }));
        if (setting('music') !== 'quiet' && unlockOpen('groove')) conductor.groove(music.ahead).forEach((h) => rhythmHit({ voice: h.rhythm.voice, strong: h.strong, level: h.level, pan: h.level < 1 ? -0.3 : 0, step: h.step, interlock: h.interlock || 'primary', in: h.in }));
      }
      run.boofIn -= dt;
      if (run.boofIn <= 0 && !run.boof && !(run.bane && keptApart('boof', 'bane'))) {
        const side = pick([-1, 1]);
        run.boof = { x: side < 0 ? -40 : W + 40, y: rand(80, 200), vx: -side * rand(60, 80), touched: false };
        turnCard('boof');
        recall('boof');
        if (record.sound) { leitmotif('boof', side * 0.6); heardTheme('boof'); }
        run.boofIn = rand(12, 18);
      }
      // Presences: Mr. BoonWAP and Mr. BaneWAP never share the stage.
      if (!run.boon && !run.bane) {
        run.nextPresence -= dt * (1 + run.dust * 2);   // flour in the air draws them sooner
        if (run.nextPresence <= 0) {
          const lean = scene().presence;
          // Flour the mimes put in the air is meant for Mr. BaneWAP, and usually brings him.
          // So do gifts to the other side, on a live stream (pie-live.mjs).
          const forBane = run.t - (run.mimeFlourAt ?? -99) < 4 || run.rivalCall;
          run.rivalCall = false;
          let boon = forBane ? Math.random() < 0.2 : lean === 'boon' ? Math.random() < 0.75 : lean === 'bane' ? Math.random() < 0.2 : run.lastPresence !== 'boon';
          // The cast arrives as the book does: Mr. BaneWAP from Chapter Four, Mr. BoonWAP from Six.
          const canBoon = allowed('boon');
          const canBane = allowed('bane');
          // After his turn (chapter-tuned), the moment that would have been his stays quiet: Mr. BoonWAP does not take it,
          // and the turn passes as if it had been his, so the next falls to Mr. BoonWAP as it always would have.
          const his = !boon && castBars('bane');
          if (!canBoon) boon = false;
          if (!canBane) boon = true;
          if (his || (!canBoon && !canBane)) {
            run.nextPresence = rand(10, 15);
            if (his) run.lastPresence = 'bane';
          } else if (boon) holdCourt(); else scheme();
          if (!run.boon && !run.bane && run.nextPresence <= 0) run.nextPresence = rand(10, 15);
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
        // The bloom garden (a trial), as in Chapter Eleven: every bud opens at once for him, and a flower opened on demand
        // has not had time to fill. While he schemes there, whatever the scheme (the step tax has no beats of its own),
        // a bane rose opens up the lanes soon after he begins, and later ones may: thorned, low enough to hop, never in
        // the lane that is the way through as it opens (the way moves on with the next row; a rose can always be
        // hopped), three at most a scheme.
        if (switchOn('bloom-garden') && beatHere('bloom') && (b.roses || 0) < 3) {
          b.bloomIn = (b.bloomIn ?? 1.6) - dt;
          if (b.bloomIn <= 0) {
            b.bloomIn = 2.2;
            if (!b.roses || Math.random() < 0.5) {
              const lanes = [...Array(LANES).keys()].filter((lane) => lane !== run.safe);
              const rose = makeThing('banerose', pick(lanes));
              rose.bloom = true;
              rose.wayWas = run.safe;   // the way through as it stood when this rose opened: never its lane
              if (run.wilting) Object.assign(rose, { wilted: true, fatal: false });
              run.things.push(rose);
              b.roses = (b.roses || 0) + 1;
            }
          }
        }
        if (b.id !== 'tax') {
          b.nextBeat -= dt * (1 + run.dust * 1.2);   // fed on flour in the air, his scheme quickens
          if (b.nextBeat <= 0) {
            if (b.id === 'wind') shove(b.dir);
            if (b.id === 'march') run.pendingMarch = true;
            if (b.id === 'relet') {
              // Re-let: the lanes ahead shift over; the way through goes with them.
              const nextSafe = clamp(run.safe + b.dir, 0, LANES - 1);
              run.things.forEach((thing) => {
                if (thing.wapped || WIDE.has(thing.kind) || thing.y > run.y - 120 || thing.kind === 'switch' || thing.kind === 'wonder' || thing.kind === 'egg' || thing.lanes) return;
                const lane = thing.lane + b.dir;
                if (lane < 0 || lane >= LANES) return;
                if (thing.bloom && lane === nextSafe) return;
                thing.lane = lane;
                if (thing.wayWas != null) thing.wayWas = nextSafe;
                thing.home += b.dir * LANE_W;
                thing.shift = { from: thing.x, t: 0 };
              });
              run.safe = nextSafe;
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
          if (b.id === 'march') tally('maw', 2, 'march_ran');
          showToast('Mr. BaneWAP withdraws.', '“This is not over.” It is, for now.', 2200, 'bane');
        }
      }
    }
    // Stepping: a line segment, quickly drawn.
    run.moveT = Math.min(1, run.moveT + dt / run.carrier.step);
    run.x = run.from + (laneX(run.lane) - run.from) * (1 - (1 - run.moveT) ** 3);
    if (run.stepBuffer && state === 'running' && ((run.stepBuffer.fn === 'step' && run.moveT >= 0.72) || (run.stepBuffer.fn === 'climb' && run.moveYT >= 0.72))) {
      const queued = run.stepBuffer;
      run.stepBuffer = null;
      if (queued.fn === 'step') step(queued.arg);
      else climb(queued.arg);
    }
    run.dust = Math.max(0, run.dust - dt * 0.18);
    if (run.jumpT > 0) {
      run.jumpT = Math.max(0, run.jumpT - dt);
      if (run.jumpT > 0 && inHang() && !run.wasHang) {
        run.wasHang = true;
        run.apexGlow = 0.22;
        spawnRing(run.x, run.y - jumpLift(), 18, '#f2c14e', 0.35);
        if (run.hopChain >= 1 || run.things.some((th) => !th.wapped && !th.cleared && (th.fatal || SLIPS.has(th.kind)) && Math.abs(th.y - run.y) < 55 && Math.abs(th.x - run.x) < 42)) {
          sfx('trick', { kind: 'apex', count: (run.hopChain || 0) + 1 }, run.x, run.y);
        }
      }
      if (run.jumpT === 0) {
        // Down again. A hop that cleared something lands light and is ready to chain. An empty hop lands heavier.
        const clears = run.hopClears || 0;
        const deft = Boolean(run.deftHop);
        const timed = (run.inTime || 0) > (run.inTimeAtHop || 0);
        run.lastHopGood = deft || clears >= 1;
        run.landT = run.lastHopGood ? 0.16 : 0.2;
        run.jumpCool = run.lastHopGood ? 0.07 : 0.16;
        run.lastLand = run.t;
        run.wasHang = false;
        if (!reduced?.matches) for (let i = 0; i < 8; i += 1) run.puffs.push({ x: run.x + rand(-12, 12), y: run.y + 14, vx: rand(-70, 70), vy: rand(-25, -5), t: 0.25 });
        // Landing on a word of the road marks it (and a room of signs counts it read).
        const landedOn = wordUnder(run.x, run.y + 10, 8);
        if (landedOn && !landedOn.kept) { keepWord(landedOn, 'marked'); lean('read'); }
        if (run.lastHopGood) {
          const grace = 0.08 + (deft ? 0.06 : 0) + (timed ? 0.06 : 0) + Math.max(0, clears - 1) * 0.04;
          run.wobble = Math.max(0, run.wobble - grace);
          run.sliceReady = Math.min(1, run.sliceReady + 0.16 + (timed ? 0.28 : 0) + (clears >= 2 ? 0.14 : 0));
          const word = timed && run.highHop ? 'HIGH, IN TIME' : timed ? 'IN TIME' : run.highHop ? 'HIGH HOP' : clears >= 2 ? `CLEARED ×${clears}` : clears >= 1 ? 'CLEARED' : 'DEFT HOP';
          run.tags.push({ x: run.x, y: run.y - 104, t: 0, text: word });
          if (timed || deft || clears >= 2) {
            sfx('deft');
            lean('deft');
            spawnRing(run.x, run.y + 10, 26, colors.gold, 0.45);
            run.punch = Math.max(run.punch || 0, 0.25 * TUNE.drama);
            impact('hop', run.x, run.y - 92, { scale: 0.55 + Math.min(3, clears || 1) * 0.15, word });
          } else {
            sfx('land');
          }
        } else {
          run.hopChain = 0;
          sfx('land');
          run.wobble = Math.min(1.2, run.wobble + 0.05);
        }
        run.highHop = false;
        run.autoHopUsed = false;
        if (!clears) run.inTime = 0;
        run.deftHop = false;
        run.hopClears = 0;
      }
    } else if (run.jumpCool > 0) {
      run.jumpCool = Math.max(0, run.jumpCool - dt);
      if (run.jumpCool === 0 && run.hopWant) jump();
    }
    run.moveYT = Math.min(1, run.moveYT + dt / run.carrier.step);
    run.y = run.fromY + (rowY(run.row) - run.fromY) * (1 - (1 - run.moveYT) ** 3);
    if (state === 'running' && run.moveT >= 1 && run.moveYT >= 1 && run.jumpT <= 0) {
      const wasPoised = poised();
      run.stillT += dt;
      if (!wasPoised && poised() && record.sound && setting('music') !== 'quiet') playTone('poise', 1, panOf(run.x), 0);
      if (poised() && !run.poisedSaid && run.stillT >= 0.85) {
        run.poisedSaid = true;
        run.tags.push({ x: run.x, y: run.y - 88, t: 0, text: 'POISED' });
      }
    } else {
      run.stillT = 0;
    }
    // Heard first: a power that lasts says when it is about to run out, a second before, so the end of a dolphin's
    // ride or a lit way is not a surprise to anyone carrying by ear.
    if (record.sound && state === 'running') ['unkept', 'lit', 'lag', 'glimpse', 'fed', 'warm'].forEach((key) => {
      if (run[key] > 1 && run[key] - dt <= 1) powerEnding();
    });
    ['lit', 'lag', 'unkept', 'warm', 'fed', 'glimpse', 'aimLock', 'landT', 'slideT', 'hurtT', 'rattled', 'shake', 'comboT', 'knockT', 'breath', 'meetCool', 'gladT', 'aimFocusT', 'jazzPocketT', 'roomPantryT', 'wonderChainT'].forEach((key) => { if (run[key] > 0) run[key] = Math.max(0, run[key] - dt); });
    if (!(run.jazzPocketT > 0)) run.jazzChain = 0;
    if (!(run.wonderChainT > 0)) run.wonderChain = 0;
    // A timed power that has just run out is noticed (pie-reactions.mjs, the reactions trial): it used to end with
    // nothing said. Read against the last frame, so wherever a timer is counted down it is seen.
    if (reactionsOn()) {
      const timers = { lit: run.lit, lag: run.lag, unkept: run.unkept, warm: run.warm, fed: run.fed, glimpse: run.glimpse, trueAim: run.trueAim };
      timersEnded(run.timersWere, timers).forEach((moment) => react(moment));
      run.timersWere = timers;
    }
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
    const readyRate = (whole() ? 1.0 : 1.6) / ((run.jazzPocketT > 0 ? 1.25 : 1) * (run.roomPantryT > 0 ? 1.15 : 1));
    run.sliceReady = Math.min(1, run.sliceReady + dt / readyRate);
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
      tickMini(dt);
      tickThursday(dt);
      tickMargins();
      tickMotifInterpreter();
      // A weathercock by the lanes swings the needle the way it points, while the carrier passes it.
      const vane = run.things.find((t) => t.kind === 'vane' && Math.abs(t.x - run.x) < LANE_W * 1.6 && Math.abs(t.y - run.y) < 70);
      if (vane && !(run.aimLock > 0)) {
        run.aim.a += (clamp(vane.angle, -AIM_MAX, AIM_MAX) - run.aim.a) * Math.min(1, dt * 3);
        if (!vane.said) { vane.said = true; run.tags.push({ x: vane.x, y: vane.y - 40, t: 0, text: 'THE VANE TURNS YOU' }); }
      }
      if (run.escort) run.escort.t -= dt;
    }
    setSoundMood({ muffled: state === 'running' && run.lag > 0, thin: state === 'running' && mawAhead() });
    // The tilt, heard (with the music on): past poise the pie drifts out of tune on the side it leans to.
    setSoundTilt(state === 'running' && record.sound && setting('music') !== 'quiet' ? run.wobble : 0, run.tiltDir);
    if (run.dimFlash) {
      run.dimFlash.t += dt;
      if (run.dimFlash.t > 2.6) run.dimFlash = null;
    }
    if (state === 'running' && record.sound) {
      const q = landQuality();
      if (q.stage >= 3 && (run.landStage || 0) < 3 && !met('land-colour')) {
        record.met.push('land-colour');
        writeRecord(record);
        showToast('The land is in it', 'A run of good things fills the room: a fifth, then its third, then the colour the room adds. A knock lets it go.', 4200, 'wonder');
      }
      run.landStage = q.stage;
    }
    paintBeat();

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
        if (thing.ride != null) {
          // A dolphin carrying the pie: beside the carrier while it lasts, then back down into the salt.
          thing.ride -= dt;
          if (thing.ride > 0) {
            const side = run.x < W / 2 ? 1 : -1;
            thing.x += (run.x + side * 28 - thing.x) * Math.min(1, dt * 6);
            thing.y += (run.y + 4 - thing.y) * Math.min(1, dt * 6);
          } else {
            thing.x += (thing.x < W / 2 ? -1 : 1) * 170 * dt;
            thing.y -= 24 * dt;
          }
          return;
        }
        if (thing.hover != null) {
          // The land's own wait a moment, up the lanes, then go about their business.
          if (!thing.leaving && thing.y >= thing.hover) {
            thing.y = thing.hover;
            thing.stay -= dt;
            thing.x = thing.home + wonderSway(thing, dt);
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
        } else if (thing.rollTo != null) {
          // Rolled home by the ants: once it is there, it is theirs.
          thing.x += clamp(thing.rollTo - thing.x, -26 * dt, 26 * dt);
          if (Math.abs(thing.rollTo - thing.x) < 1.5 && !thing.wapped) {
            thing.wapped = true;
            thing.wapT = 0.5;
            thing.spin = 0;
            if (!run.rolledSaid) { run.rolledSaid = true; say(`${ANT_SAYS.rolled}, and it is home.`); }
          }
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
              tally('maw', 1, 'brought');   // the mimes brought him that one
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
        if (thing.kind === 'antgift' && !thing.given && (thing.x < 2 || thing.x > W - 2)) {
          // A crow or a raven at the edge takes the gift.
          thing.given = true;
          thing.wapped = true;
          thing.wapT = 0.6;
          run.corvids = (run.corvids || []).filter((c) => run.t - c.at < 3);
          run.corvids.push({ edge: thing.x < W / 2 ? -1 : 1, y: thing.y, at: run.t, raven: Math.random() < 0.5 });
          run.tags.push({ x: thing.x < W / 2 ? 30 : W - 30, y: thing.y - 18, t: 0, text: 'A GIFT FOR THE CROWS' });
          if (!run.giftSaid) { run.giftSaid = true; say(`${ANT_SAYS.gift}: ${thing.scrap?.text || 'a crumb'}. ${ANT_SAYS.taken}.`); }
        }
        if (thing.kind === 'mime' && anthillsOn() && !thing.dishDecided && run.gossipAt != null && run.t - run.gossipAt < 8 && thing.y > 20 && thing.y < run.y) {
          // A mime will not entertain gossip until a baneberry dish is ordered. A sweetened baneberry is the order
          // reaching a chef who can make one; otherwise a busy kitchen reads the mimed order its own way.
          thing.dishDecided = true;
          if (run.sweetened > 0) {
            thing.eating = true;
            if (!run.dishSaid) { run.dishSaid = true; say('A mime has a baneberry dish, from a chef who can make one, and listens to the gossip with a spoon.'); }
          } else {
            const order = orderAsRead('bane_dish', { busyness: clamp(0.4 + run.speed / 400, 0.4, 1) });
            thing.waiting = true;
            if (!run.dishSaid) { run.dishSaid = true; say(`A mime ordered a baneberry dish, to hear the gossip properly. The kitchen was busy${order.misread ? ` and brought ${order.dish.name}` : ''}; the mime waits.`); }
          }
        }
        // Someone of the lanes coming into view remembers what earlier carries did (the reactions trial).
        if (!thing.recalled && thing.y > 40 && (thing.kind === 'clown' || thing.kind === 'mime' || thing.kind === 'clerk')) { thing.recalled = true; recall(thing.kind); }
        // A crossing in the lanes: the thing carried past, or met by doing what its trope is about (a clown given
        // its WAP, a switch thrown, a pane forgiven). Ignoring it used to be the only way to cross it.
        if (!thing.tropeNoted && (thing.wapped || thing.y > run.y + 16)) {
          thing.tropeNoted = true;
          const trope = tropeOfKind.get(thing.kind);
          if (trope) tropeMet(trope);
        }
        if (!thing.passedClose && !thing.knocked && !thing.cleared && !thing.wapped && thing.fatal && thing.y > run.y + 14 && thing.y < run.y + 70 && Math.abs(laneAt(thing.x) - run.lane) <= 1) {
          thing.passedClose = true;
          if (record.sound && setting('music') !== 'quiet') playTone('story_pass', { kind: thing.kind }, panOf(thing.x), depthOf(thing.y));
        }
        if (thing.kind === 'mime' && thing.former?.bakes && !thing.floured && thing.y > run.y - 10 && Math.abs(thing.x - run.x) < LANE_W * 1.6) {
          // A mime who bakes, passed close: a little flour for the crust, and no fuss about it.
          thing.floured = true;
          run.aura = Math.min(1, run.aura + BAKERY_FLOUR);
          run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: 'FLOUR, FROM A MIME' });
          if (!run.bakerySaid) { run.bakerySaid = true; say('A mime who works at a bakery left a little flour on the crust as you passed.'); }
        }
        if (thing.kind === 'march' && !thing.passedBy && thing.y > run.y + 30) {
          // A march that gets past the pie unanswered has made its point.
          thing.passedBy = true;
          tally('maw', 1, 'march_past');
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
        // Heard once, as it comes: a character by motif, an obstacle by the stuff it is made of.
        if (record.sound && thing.y > 24 && thing.y < run.y - 36) {
          if (!thing.voiced && (thing.kind === 'clown' || thing.kind === 'clerk')) {
            thing.voiced = true;
            voiced(thing.kind, panOf(thing.x), { settled: Boolean(thing.shared) });
          }
          // A mime is heard by what goes missing: the groove rests for a bar.
          if (!thing.voiced && themesOn() && (thing.kind === 'mime' || thing.kind === 'march')) {
            thing.voiced = true;
            mimeRest();
            heardTheme('mime');
          }
          if (!thing.neared && thing.y > run.y - 300) {
            thing.neared = true;
            approachCue(thing.kind, panOf(thing.x), depthOf(thing.y));
          }
          // Heard first: something that knocks, close in the carrier's own lane, is said by sound, so the lanes can be
          // carried by ear. Said again if the carrier steps into its lane; not while nothing can hold the carrier.
          const gap = run.y - thing.y;
          if (thing.fatal && !thing.knocked && !thing.cleared && !(run.unkept > 0) && gap > 50 && gap < 170 && laneAt(thing.x) === run.lane && thing.warnedIn !== run.lane) {
            thing.warnedIn = run.lane;
            // Shaped (Setup, Heard first): two pulses that rise for something low enough to hop, two that fall for
            // something that stands tall, so the ear knows which way to go; or one warning for all; or none.
            const cues = setting('cues');
            if (cues !== 'off') {
              const shape = cues === 'one' ? 'one' : LOW.has(thing.kind) ? 'low' : 'tall';
              laneWarning(panOf(thing.x), 1 - (gap - 50) / 120, shape);
              // Said in words the first time, so the pulses can be learned.
              const key = shape === 'one' ? 'lane-warn' : 'lane-shape';
              if (!met(key)) {
                record.met.push(key);
                writeRecord(record);
                const [title, line] = shape === 'one'
                  ? ['Two low pulses', 'Something that would knock you is close in your own lane. Step aside, or hop.']
                  : ['Heard first', 'Something that would knock you is close in your own lane. Two pulses that rise: it is low, so hop it or step aside. Two that fall: it stands tall, so step aside.'];
                showToast(title, line, 4200, '');
                say(`${title}: ${line}`);
              }
            }
          }
        }
      });
      run.things = run.things.filter((thing) => {
        const gone = thing.y > H + 60 || thing.x < -60 || thing.x > W + 60 || (thing.wapped && thing.wapT > 1.1);
        if (gone && thing.kind === 'wonder' && !thing.wapped) markWonder(thing.wonder.id, 'missed');
        return !gone;
      });
      run.ways.forEach((way) => { way.y += run.speed * dt; });
      laneStoryStep();
      roadWordsStep(dt);
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
          showToast(`First meeting · ${name}`, biased('toast.meet', line, { who: name }), 4200, fresh.fatal ? 'bane' : 'boon');
          if (CHARACTERS[fresh.kind]) cadenceVoice(fresh.kind, cadenceFor(fresh.kind));
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
        if (thing.ghost || thing.wapped || thing.knocked || thing.cleared || !hits(thing)) continue;
        if (!airborne() && (run.autoHopCharges || 0) > 0 && (thing.fatal || SLIPS.has(thing.kind)) && (LOW.has(thing.kind) || HIGH_CLEARS.has(thing.kind))) {
          run.autoHopCharges -= 1;
          run.jumpT = JUMP_DUR;
          run.hopPower = 1 + 2 * TUNE.hop_chain;
          run.highHop = true;
          run.autoHopUsed = true;
          run.wobble = Math.min(1.2, run.wobble + 0.08);
          sfx('hop', 2);
          spawnRing(run.x, run.y + 12, 22, colors.gold, 0.45);
          run.tags.push({ x: run.x, y: run.y - 46, t: 0, text: `AUTO HOP (${run.autoHopCharges} LEFT)` });
        }
        if (airborne() && (LOW.has(thing.kind) || (run.highHop && HIGH_CLEARS.has(thing.kind)))) {
          // Cleared in a hop: a hazard or a slip passed under is passed for good, and a slice readies.
          if (thing.fatal || SLIPS.has(thing.kind)) {
            thing.cleared = true;
            run.cleared += 1;
            noteDeed('hop', thing.kind);
            lean('hop_clear');
            if (thing.rival) lean('turned');
            run.hopClears = (run.hopClears || 0) + 1;
            run.sliceReady = Math.min(1, run.sliceReady + 0.3);
            // In time: cleared in the hang, the flat top of the hop. A run of them is a rhythm (manual hops only).
            const inTime = !run.autoHopUsed && inHang();
            if (inTime) {
              run.inTime = (run.inTime || 0) + 1;
              run.inTimeTotal = (run.inTimeTotal || 0) + 1;
              lean('in_time');
              sfx('deft');
              beat();
              if (run.inTime >= 2) meanwhile('boof', 'glad', run.inTime >= 3 ? '♪ ♪' : '♪');
            }
            sfx('trick', { kind: 'hop_clear', clears: run.hopClears, high: Boolean(run.highHop && !LOW.has(thing.kind)), inTime, count: run.inTime || run.hopClears }, thing.x, thing.y);
            carrierSpeak('trick', thing.x, thing.y);
            run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: inTime ? (run.inTime >= 2 ? `IN TIME ×${run.inTime}` : 'IN TIME') : run.highHop && !LOW.has(thing.kind) ? 'OVER THE TOP' : 'CLEARED' });
            if (run.highHop && !LOW.has(thing.kind)) { meanwhile('boof', 'surprised', '!'); run.highClears = (run.highClears || 0) + 1; }
            if (run.mini) run.mini.score += 1;
            if (run.highHop && !LOW.has(thing.kind)) impact('hop', thing.x, thing.y - 40, { scale: 0.8, word: pick(['OVER!', 'WHEEE!', 'UP AND OVER!']) });
          }
          continue;
        }
        if (thing.kind === 'arrow') {
          // On the arrow: the needle points where it points, and holds; a throw while it holds is Perfect.
          if (!airborne()) {
            thing.wapped = true;
            thing.wapT = 0.4;
            thing.spin = 0;
            run.aim.a = clamp(thing.angle, -AIM_MAX, AIM_MAX);
            run.aimLock = TUNE.arrow_hold * (run.carrier.id === 'porter' ? 1.5 : 1);
            sfx('catch');
            carrierSpeak('catch', thing.x, thing.y);
            impact('arrow', thing.x, thing.y - 24, { scale: 0.7 });
            lean('aimed');
          }
          continue;
        }
        if (thing.kind === 'horn') {
          thing.wapped = true;
          thing.wapT = 0.5;
          thing.spin = 0;
          startMini();
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
          if (reachable(thing)) keep(thing);
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
            creditIngredient(thing, 'sweet');
            if (run.filling >= 0.58) bakeRecipe('set_jam', 4, 'Sweetened baneberry set the sweet filling into bright jam.');
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
          // Time a beaver lends is counted beside the dam it came from (references.json rumour-slow-dam).
          if (run.legEvents) run.legEvents.beaver_time = (run.legEvents.beaver_time || 0) + 1;
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
            const tilting = run.wobble >= 0.26;
            sfx('furrow', { tilting }, thing.x, thing.y);
            lean('furrow');
            run.aura = Math.min(1, run.aura + (tilting ? 0.16 : 0.12));
            run.filling = Math.min(1, run.filling + (tilting ? 0.14 : 0.08));
            run.wobble = Math.max(0, run.wobble - (tilting ? run.wobble * 0.48 : 0.15));
            run.tags.push({ x: thing.x, y: thing.y - 18, t: 0, text: tilting ? '+ CARAMELIZED WARMTH' : '+ WARM' });
            creditIngredient(thing, 'furrow');
            if (tilting && whole()) bakeRecipe('blistered', 3, 'The warm furrow caramelized your tilt into a wide amber glaze.');
            if (!run.furrowSaid) {
              run.furrowSaid = true;
              say('A warm furrow. Something keeps the field warm from underneath.');
            }
          }
          continue;
        }
        // Unkept: for a moment nothing in the lanes can hold the carrier. What a tide or a stream gave is still taken:
        // a dolphin used to carry the pie straight past its own donuts, and past the haggle with them.
        const given = !thing.fatal && (thing.gift || thing.kind === 'donut' || thing.kind === 'boonrose' || thing.kind === 'dolphin');
        if (run.unkept > 0 && !given) {
          if (!thing.passed) {
            thing.passed = true;
            sfx('trick', { kind: 'unkept_pass' }, thing.x, thing.y);
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
          sfx('trick', { kind: 'shield_hold' }, thing.x, thing.y);
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
          creditIngredient(thing, 'berry');
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
          creditIngredient(thing, 'bone');
          if (run.wobble < 0.28 && run.aura >= 0.42) bakeRecipe('savoury', 4, 'Grown, not raised, folded crisp under steady poise.');
          lean('boneberry');
          const taste = boneFlavour();
          run.tags.push({ x: thing.x, y: thing.y - 26, t: 0, text: `+ BOTH · FED · ${taste.toUpperCase()}` });
          if (run.berriesEaten.bone === 1 || run.berriesEaten.bone % 3 === 0) {
            showToast('A boneberry', `Here it tastes of ${taste}. Grown, not raised: a whole meal, and nobody suffered for it.`, 3000, 'wonder');
            say(`A boneberry. Here it tastes of ${taste}. Your steps tilt less for a while.`);
          }
          continue;
        }
        if (thing.kind === 'anthill') {
          if (!thing.bumped) anthillBump(thing);
          continue;
        }
        if (thing.kind === 'antgift') continue;   // stepped over: the ants have somewhere to be
        if (thing.kind === 'place') {
          if (!thing.met) meetPlace(thing);
          continue;
        }
        if (thing.kind === 'dolphin') {
          if (!thing.met) meetDolphin(thing);
          continue;
        }
        if (thing.kind === 'donut') {
          if (!thing.eaten) eatDonut(thing);
          continue;
        }
        if (thing.kind === 'boonrose') {
          // A boon rose, from a live stream: picked up in passing.
          thing.wapped = true;
          thing.wapT = 0.5;
          thing.spin = 0;
          const power = seasonPower(BOON_ROSE);
          applyPower(power);
          if (power) run.powersUsed[power.id] = 'gift';
          if (run.found?.unwritten || liveFound('unwritten')) run.unkept = Math.max(run.unkept || 0, 1.5);
          sfx('rose', 0, thing.x, thing.y);
          spawnRing(thing.x, thing.y, 24, '#d62f4a', 0.45);
          run.tags.push({ x: thing.x, y: thing.y - 24, t: 0, text: '+ BOON ROSE · FILLING · GLIMPSE' });
          lean('boonrose');
          noteDeed('meet', 'boonrose');
          continue;
        }
        if (thing.kind === 'banerose' && thing.wilted) {
          // A bane rose wilted by the sniff: walked through, and the crust takes what it was.
          if (!thing.trodden) {
            thing.trodden = true;
            lean('wilted');
            run.aura = Math.min(1, run.aura + 0.06);
            run.tags.push({ x: thing.x, y: thing.y - 20, t: 0, text: '+ CRUST · A WILTED ROSE' });
          }
          continue;
        }
        if (thing.kind === 'puddle') {
          if (!thing.slipped) {
            thing.slipped = true;
            sfx('splash', 0, thing.x, thing.y);
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
            creditIngredient(thing, 'flour');
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
          sfx('brush', 0, run.boof.x, run.boof.y);
          lean('boof');
          run.wobble = 0;
          run.tiltDir = 0;
          run.steadied = 1.6;
          spawnRing(run.x, run.y - 18, 34, colors.gold, 0.55);
          say('Boof brushes past. The pie steadies.');
          const beside = tropeOfKind.get('boof');   // her trope names her kind in the lanes, and she is not a thing passed
          if (beside) tropeMet(beside);
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
    if (run.marks) {
      run.marks.forEach((mark) => { mark.t += dt; });
      run.marks = run.marks.filter((mark) => mark.t < mark.life);
    }
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
      if (recipeMeter) {
        const rid = recipeIdNow();
        const showRec = rid !== 'warm' || richness() >= 0.72;
        recipeMeter.hidden = !showRec;
        if (showRec) {
          recipeMeter.dataset.recipe = rid;
          const lbl = recipeMeter.querySelector('b');
          const charges = run.recipe?.charges > 0 && run.recipe.id === rid ? ` ×${run.recipe.charges}` : '';
          if (lbl) lbl.textContent = `${(RECIPES[rid]?.short || 'Warm pie')}${charges}`;
        }
      }
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
    ariaMirror.sync(boardMirrorSnapshot());
  };

  /* ─── Standard ARIA semantic board mirror (pie/sim/aria-mirror.mjs, PLAN.F#f36) ─── */
  const ariaMirror = createAriaMirror({ root, say });
  const boardMirrorSnapshot = () => {
    const ahead = run ? run.things.filter((t) => !t.wapped && !t.knocked && !t.cleared && t.y < run.y + 8 && run.y - t.y < 280 && (WIDE.has(t.kind) ? t.gap !== run.lane : Math.abs(t.x - run.x) < (t.w + 26) / 2)).sort((a, b) => b.y - a.y) : [];
    const threat = ahead.find((t) => t.fatal || SLIPS.has(t.kind));
    const friend = ahead.find((t) => !t.fatal && !SLIPS.has(t.kind));
    const labelFor = (t) => (t ? (t.wonder?.name || CARDS[t.kind]?.name || t.kind) : null);
    const caption = toast?.classList.contains('is-in') ? [toastTitle?.textContent, toastLine?.textContent].filter(Boolean).join(': ') : null;
    return {
      state,
      chapter: run?.chapter || chosenStartChapter,
      carrierName: run?.carrier?.name || 'The figure in plain lines',
      lane: run?.lane ?? 2,
      lanes: LANES,
      row: run?.row ?? 0,
      wobble: run?.wobble ?? 0,
      waps: run?.waps ?? 0,
      cobbles: cobbles(),
      recipeName: RECIPES[recipeIdNow()]?.short || 'Warm pie',
      presence: run?.boon ? 'Mr. BoonWAP' : run?.bane ? 'Mr. BaneWAP' : null,
      aheadThreat: labelFor(threat),
      aheadFriend: labelFor(friend),
      caption
    };
  };

  /* ─── Drawing: the city in its colours; the figure in plain ink ─── */

  /* ─── Canvas draw primitives (pie-draw.mjs): ground, sky, carrier face, power ring, gift art, moments ─── */
  const {
    skyFor, drawGroundFor, moodOf, drawFace,
    drawPowerRing, drawGiftArt, drawMoments, drawMechanics
  } = initPieDraw({
    getCtx: () => ctx,
    W,
    LANES,
    LANE_W,
    getBoard: () => board,
    record,
    reduced,
    getColors: () => colors,
    mix,
    clamp,
    getRun: () => run,
    getState: () => state,
    jumpLift: () => jumpLift(),
    poiseNeed: () => poiseNeed(),
    poised: () => poised()
  });

  /* ─── Lane entities & medallions (pie/render/things.mjs) ─── */
  const {
    drawThing, drawWedge, setLikenessMod
  } = initThingsRenderer({
    getCtx: () => ctx,
    getRun: () => run,
    getState: () => state,
    getColors: () => colors,
    record,
    reduced,
    W,
    LANES,
    LANE_W,
    laneX,
    clamp,
    mix,
    WIDE,
    SLIPS,
    KIND_SIGIL,
    GIFT_ART,
    domainTune,
    getTuningDomains: () => tuningDomains,
    cadenceLift,
    mawAhead,
    heightMark
  });

  /* ─── Carrier rig, pie, hat, presences & flight (pie/render/cast.mjs) ─── */
  // From Chapter 14 onward, the figure's right arm is slightly shorter, warm at the tip like a small torch.
  const shortArm = (who) => who === 'figure' && run && run.chapter >= 14;
  const {
    drawFigure, drawPie, drawSpill, drawBoof,
    drawBoonWAP, drawBaneWAP, drawEscorts, drawFlight, drawBursts
  } = initCastRenderer({
    getCtx: () => ctx,
    getRun: () => run,
    getState: () => state,
    getColors: () => colors,
    reduced,
    W,
    LANES,
    LANE_W,
    PLAYER_Y,
    PRESENCE_Y,
    SLICE_COST,
    laneX,
    clamp,
    mix,
    jumpLift,
    hopPhase,
    hopCurve,
    getCreatorStyle: () => creatorStyle,
    domainTune,
    drawFace,
    moodOf,
    drawWedge,
    poised,
    richness,
    recipeIdNow,
    throwFrom,
    getBeatPulse: () => {
      if (reduced?.matches || record.view.zen || state !== 'running') return 0;
      const snap = conductor.beatState();
      const pickup = jazzOn() && snap.pickup
        ? Math.exp(-snap.sinceStep * 5) * (snap.swing - 0.5) * Number(domainTune('characters').jazz_lean)
        : 0;
      return Math.max(Math.exp(-snap.phase * 7), pickup);
    },
    isShortArm: shortArm
  });

  /* ─── Scene framing, HUD, aim & overlays (pie/render/hud.mjs) ─── */
  const {
    drawCorvids, drawBands, drawScene, drawAim, drawDust, drawRules, drawRain,
    drawHud, drawForetold, drawDepthGuide, drawDimensionFlash, drawLandQuality,
    drawCarrierTune, warpLongView, drawMiniBanner, drawHopGauge, drawWhimsy
  } = initHudRenderer({
    getCtx: () => ctx,
    getCanvas: () => canvas,
    getRun: () => run,
    getState: () => state,
    getColors: () => colors,
    getBoard: () => board,
    record,
    reduced,
    W,
    H,
    LANES,
    LANE_W,
    ROWS,
    PRESENCE_Y,
    TOTAL_CHAPTERS,
    AIM_MAX,
    SCENES,
    CHAPTER_SCENE,
    PLACES,
    PLACE_COLORS,
    MINIS,
    FORETOLD,
    SHELVES,
    CHAINS,
    CARRIER_TUNES,
    RECIPES,
    getChosenStartChapter: () => chosenStartChapter,
    getTune: () => TUNE,
    domainTune,
    setting,
    laneX,
    rowY,
    clamp,
    mix,
    channels,
    fillFrame,
    scene,
    skyFor,
    drawGroundFor,
    placesOn,
    shelvesOn,
    voiceOn,
    conductor,
    throwFrom,
    sighted,
    traceTrajectory,
    poised,
    cobbles,
    progress,
    recipeIdNow,
    mawAhead,
    fmtPts,
    jumpLift,
    inHang,
    longK,
    viewScale,
    landQuality
  });

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
    drawRoadWords();
    withLift('boon', 3, drawBoonWAP);
    withLift('bane', 3, drawBaneWAP);
    // Drawn by height (the implicit z): ground first, then low, then bodies; things in the air after
    // the carrier, so a pigeon passes over the hat and a hop passes over a stone.
    const byZ = (a, b) => (Z[a.kind] ?? 2) - (Z[b.kind] ?? 2) || a.y - b.y;
    const things = run ? [...run.things].sort(byZ) : [];
    things.filter((t) => (Z[t.kind] ?? 2) < 3).forEach(drawThing);
    drawForetold();
    drawAim();
    drawEscorts();
    withLift('boof', 2, drawBoof);
    drawPowerRing();
    drawFigure();
    things.filter((t) => (Z[t.kind] ?? 2) >= 3).forEach(drawThing);
    drawCorvids();
    drawHopGauge();
    drawMechanics();
    drawFlight();
    drawSpill();
    drawBursts();
    drawGiftArt();
    drawMoments();
    drawWhimsy();
    drawRain();
    drawDust();
    drawCarrierTune();
    if (run?.lag > 0) {
      // The land at a beaver's pace: a cool hush over everything but the carrier's own time.
      ctx.fillStyle = `rgba(70, 120, 160, ${Math.min(1, run.lag) * 0.08})`;
      fillFrame();
    }
    drawBands();
    ctx.restore();
    warpLongView();
    drawDepthGuide();
    drawDimensionFlash();
    drawLandQuality();
    drawMiniBanner();
    drawAskTags();
    if (run?.hurtT > 0 && !record.view.zen) {
      const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.62);
      edge.addColorStop(0, 'rgba(200, 50, 36, 0)');
      edge.addColorStop(1, `rgba(200, 50, 36, ${0.32 * Math.min(1, run.hurtT / 0.9)})`);
      ctx.fillStyle = edge;
      fillFrame();
    }
    drawHud();
    drawLaneCaption();
    drawPoints();
    if (show.mode !== 'off') show.frame(run, colors);
    heights.draw(heightsSnap(), colors);
    // The board: the alternate view, drawn over the lanes once they are in the window.
    if (show.mode === 'board' && run) {
      show.drawBoard(ctx, run, colors);
      drawMechanics();
      drawAim();
      drawFlight();
      drawWhimsy();
      drawPoints();
      drawMiniBanner();
      drawDepthGuide();
      drawDimensionFlash();
      drawLandQuality();
      drawAskTags();
      drawHud();
      drawLaneCaption();
    }
  }

  let paintPadHook = () => {};   // the thumbs' pad (set once the pad is built, further down)
  function loop() {
    cancelAnimationFrame(frame);
    const tick = (now) => {
      // A frame's timestamp can come just before the moment play resumed: never let time run backwards.
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      // Pace (⚙ Setup): the whole world at a gentler or brisker clock, carrier and all.
      if (state === 'running' || state === 'spilling') update(dt * (record.view.pace || 1));
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
    setSoundTilt(0);
    setAmbience(null);
    showCard('A pause.', 'The pie is held very still. The city waits, politely.', '▶ Keep playing');
    const home = returnAnchor();
    if (home) cardLinks?.replaceChildren(home);
    say('Paused.');
    paintPauseBtn();
  };
  const resume = () => {
    if (state !== 'paused') return;
    hideCard();
    state = 'running';
    if (placesOn() && record.sound && run) setAmbience(scene().acoustic?.ambience || null);
    last = performance.now();
    loop();
    paintPauseBtn();
  };
  /* ❚❚ Pause, at the top of the cabinet: in reach on a phone, where there is no Esc. */
  const pauseBtn = root.querySelector('[data-pie-pause]');
  function paintPauseBtn() {
    if (!pauseBtn) return;
    const paused = state === 'paused';
    pauseBtn.textContent = paused ? '▶ Resume' : '❚❚ Pause';
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.disabled = !(state === 'running' || state === 'paused');
  }
  pauseBtn?.addEventListener('click', () => { if (state === 'running') pause(); else if (state === 'paused') resume(); });
  setInterval(paintPauseBtn, 600);

  /* ─── ⚙ Setup drawer, panel layout, grips & pinch scaling (pie/ui/setup.mjs) ─── */
  const {
    cabinetVoyage, setupOut, screenBox, holdNow,
    syncConductorSwing, applySetup, paintSetup, placeSetup
  } = initPieSetup({
    root, record, W, H, LANES, clamp, nodeOf,
    SETUP, SETUP_GROUPS, HOLDS, HEIGHTS_DEFAULTS, TUNING_DOMAINS, TUNING_KEY,
    planPanels, settlePlan, suggestHold, holdMini, boardLine, readBoardLine,
    icon, iconForGlyph, teachLine, handsLine, leanSentence, jokeOf,
    loadParser, foundRhythms, unlockMechanics, standing, parseTuningDomains, effectiveDomain, visitSpells,
    primeAudio, wapSound, feelSample, playTone, laneWarning, playBoardMotifCue, auditionChapterProgression,
    setMusicBed, setSoundTextures, setSoundFeel, setSoundConfig, setSoundCarrier,
    conductor, levelData, heightsPanel,
    getRun: () => run,
    getChosenStartChapter: () => chosenStartChapter,
    getBoard: () => board,
    getFullOn: () => fullOn,
    getPanelPlan: () => panelPlan,
    setPanelPlan: (p) => { panelPlan = p; },
    setGlassFoot: (v) => { glassFoot = v; },
    getVisitBoard: () => visitBoard,
    setVisitBoard: (v) => { visitBoard = v; },
    getFlowProse: () => flowProse,
    getFlowMeasure: () => flowMeasure,
    setFlowMeasure: (m) => { flowMeasure = m; },
    getCreatorStyle: () => creatorStyle,
    getSavedTuningDomains: () => savedTuningDomains,
    setSavedTuningDomains: (v) => { savedTuningDomains = v; },
    getTuningDomains: () => tuningDomains,
    setTuningDomains: (v) => { tuningDomains = v; },
    keepTuningDomains,
    domainTune,
    writeRecord,
    applyBoardView,
    applyView: () => applyView(),
    applyShow: () => applyShow(),
    setFull: (on) => setFull(on),
    fit,
    storyInMode,
    themesOn,
    teachOn,
    progress,
    say
  });

  /* ─── Legend sprites, lore shelf, almanac/QA cards & Ask mode (pie/ui/cards.mjs) ─── */
  const {
    buildId, drawSprite, drawRecipeSprite, paintLegend, paintLore,
    turnCard, explainAtom, bookLink, inspect, drawAskTags,
    openReveal, closeReveal, paintDeck, paintCardModes, isAsking
  } = initPieCards({
    root, card, cardAction, loreOut, record, reduced,
    W, H, LANE_W, PLAYER_Y, PRESENCE_Y, ROWS,
    CARDS, CARD_TYPES, KNOCKS, LOW, HIGH_CLEARS, SLIPS, WIDE, Z,
    POWER_SPELLS, WORDS, TUNE, TUNE_RANGE, LEAN_DEFAULTS, LEAN_WORDS, LEAN_ONE, LEAN_GLYPH, LEAN_NAMES, CONTEST,
    ANT_KINDS, SEASON_KINDS, ROOM_TOTALS,
    carrierById, carrierStats, pad2, chapterWords, mimesHold, shelveCard, cardsTurned,
    writePower, renderSpell, tropeEmblemSVG, biased, formerWords, reasonFor,
    laneX, nodeOf, pct, round2, fmtPts, roomsReadIn,
    discoveriesNow: () => discoveries(record),
    isUnlocked, pieParts,
    tropeOfKind, withCanvasTarget, fresh, makeThing,
    tropeStages: STAGES,
    readTropeStage: (trope) => tropeRevealOn()
      ? revealStage(trope, tropeSignals(trope.id, { trope, lean: run?.shelfV || null }))
      : null,
    drawFigure, drawBoonWAP, drawBaneWAP, drawBoof, drawThing, drawPie,
    getCtx: () => ctx,
    getRun: () => run,
    getState: () => state,
    setState: (s) => { state = s; },
    setLastTime: (t) => { last = t; },
    getBookRules: () => bookRules,
    getKnockRules: () => knockRules,
    getLeanRules: () => leanRules,
    getPlay: () => play,
    getLore: () => lore,
    getLikenessMod: () => likenessMod,
    getChosenStartChapter: () => chosenStartChapter,
    setChosenStartChapter: (n) => { chosenStartChapter = n; },
    getIntroMode: () => introMode,
    setIntroMode: (v) => { introMode = v; },
    setting, writeRecord, introOf, cobbles, mimesOn, shelvesOn,
    passing, passageHref, wordUnder, tellWord, showToast, say,
    prepareLeg, paintFlows, paintCardChapters, loop
  });

  /* ─── Secondary drawer UI (pie-setup-ui.mjs): portraits, Spw stress test, provenance cards ─── */
  ({ paintPortraits, paintStress, keepProvenance, paintProvenance } = initPieSetupUI({
    nodeOf,
    explainAtom,
    readStore,
    DEEDS_KEY,
    switchOn,
    getBookRules: () => bookRules,
    seasonsOn,
    readSeasons,
    writeSeasons,
    seasonClock: () => seasonClock(),
    say
  }));

  /* ─── Workbench, paste router, thumbs pad, show/bias/points & assets (pie/ui/workbench.mjs) ─── */
  const {
    paintBench, paintDesk, pasteSpell, paintPad,
    applyView, applyShow, cycleShow, showFeed,
    paintBias, paintPointsSoon, paintPoints, paintPointsRules,
    paintFull, setFull
  } = initPieWorkbench({
    root, voyage, record, reduced,
    W, H, LANES, LANE_W, ROWS, AIM_MAX,
    CARDS, KNOCKS, LOW, SLIPS, WIDE, INTRO, SCENES, CHAPTER_SCENE, SCENE_WHIMSY_DEFAULTS,
    POWER_SPELLS, TUNE, TUNE_DEFAULTS, TUNE_RANGE, LEAN_DEFAULTS, LEAN_WORDS, LEAN_ONE, LEAN_GLYPH, LEAN_NAMES, CONTEST,
    TUNING_DOMAINS, DOMAIN_ORDER, VALUE_DEFS, VALUE_IDS, SEASON_SAYS, LEGEND, RECIPES, SPRITES,
    clamp, mix, nodeOf, pct, fmtPts, pad2, chapterWords, laneAt,
    readRules, loadParser, powersInPlay, describePower, readSpells, visitSpells, setVisitSpells, powersLink,
    renderSpell, explainAtom, bookLink, parseTuningDomains, writeTuningDomains,
    allCreatorStyles, parseCreatorStyle, formatCreatorStyle, saveCreatorStyle, setActiveCreatorStyle,
    noteSpark, receiveKept, keptProblems, readSeasons, writeSeasons,
    BIAS_EVENT, setBias, activeBias, biasLayerNote, biasLink, unlockOpen, standing,
    show, skyFor, drawGroundFor, drawSprite, drawRecipeSprite, buildId,
    withCanvasTarget, fresh, makeThing, sceneWhimsy, captionOf,
    getRun: () => run,
    getState: () => state,
    getColors: () => colors,
    getBookRules: () => bookRules,
    getVisitRead: () => visitRead,
    getPlay: () => play,
    getLeanRules: () => leanRules,
    setLeanRules: (v) => { leanRules = v; },
    getTuningDomains: () => tuningDomains,
    setTuningDomains: (v) => { tuningDomains = v; },
    getCreatorStyle: () => creatorStyle,
    setCreatorStyle: (v) => { creatorStyle = v; },
    getChosenIntention: () => chosenIntention,
    setChosenIntention: (v) => { chosenIntention = v; },
    getFullOn: () => fullOn,
    setFullOn: (v) => { fullOn = v; },
    getBiasRegisters: () => biasRegisters,
    setting, holdNow, domainTune, writeRecord, readVisit,
    applySetup, paintSetup, placeSetup,
    getSetupOut: () => setupOut,
    paintProvenance, paintNow, start, jump, throwSlice, fit, draw, sfx, say
  });
  paintPadHook = paintPad;

  whenQuiet(() => fetch('/book/content/catalog.json').then((r) => r.json()).then((cat) => {
    (cat.chapters || []).forEach((c) => { if (c.rooms) ROOM_TOTALS[c.number] = c.rooms; });
    paintLore();
  }).catch(() => {}));
  whenQuiet(() => import('../modules/likeness.mjs?v=2026_11_16.B').then(async (mod) => { await mod.loadLikeness(); likenessMod = mod; setLikenessMod(mod); paintDeck(); }).catch(() => {}));
  initBiasFromURL();
  whenQuiet(() => {
    warmBiasParser();
    loadRegisters().then(({ registers }) => { biasRegisters = registers || {}; paintBias(); }).catch(() => {});
  });

  /* ─── Controls & live observers (pie/sim/input.mjs) ─── */
  const destroyInput = initPieInput({
    root, canvas, voyage, card, cardAction, left, right, soundToggle, record,
    W, LANE_W, PLAYER_Y, ROWS, ROW_H, AIM_MAX, TUNE,
    clamp, laneX, rowY, laneAt, viewScale, throwFrom, spawnRing,
    getRun: () => run,
    getState: () => state,
    getBoard: () => board,
    getColors: () => colors,
    setColors: (c) => { colors = c; },
    palette, setting, isAsking, inspect,
    start, pause, resume, closeReveal, setFull, cycleShow,
    step, climb, jump, throwSlice, turnAim,
    fit, draw, paintLegend, paintSound, writeRecord,
    primeAudio, setMusicBed, setSoundTilt, setAmbience, wapSound, placesOn, scene,
    onReadBoardStatus: () => ariaMirror.readNow(boardMirrorSnapshot())
  });

  paintBest();
  paintCarries();
  paintSound();
  // Found in the story? Say where the carry begins: the book goes by, chapter by chapter, from there.
  const entry = (() => {
    try {
      const scene = new URLSearchParams(window.location.search).get('scene');
      const segue = segueFor(scene, from);
      return segue && segue.chapter === firstChapter ? segue : null;
    } catch { return null; }
  })();
  paintCardArt(firstChapter);
  showCard('Someone is destined to spill exactly one pie.',
    firstChapter > 1
      ? `From ${chapterWords(firstChapter)}${entry ? `, ${entry.place}` : ''}: someone in a hat is carrying one, level, through the rest of the book. It is not always the same someone.`
      : 'Nobody has said who. Someone in a hat is carrying one, level, in both hands, through the whole book, chapter by chapter. It is not always the same someone.',
    entry ? `▶ Play: ${entry.door.charAt(0).toLowerCase()}${entry.door.slice(1)}` : firstChapter > 1 ? `▶ Play from ${chapterWords(firstChapter)}` : '▶ Play');
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
  {
    const carried = new URLSearchParams(location.search).get('kept');
    if (carried) {
      pasteSpell(carried, { carriedIn: true });
      const url = new URL(location.href);
      url.searchParams.delete('kept');
      window.history.replaceState(null, '', url);
    }
  }
  paintDesk();
  paintPortraits();
  syncDerivedSparks();
  const destroyResonance = bindSiteResonance({ root: document, context: 'pie' });
  loadLore().then((data) => {
    lore = data;
    paintLore();
  });

  return () => {
    cancelAnimationFrame(frame);
    destroyInput();
    destroyResonance?.();
  };
}

if (typeof document !== 'undefined') {
  const boot = () => initPieGame();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
