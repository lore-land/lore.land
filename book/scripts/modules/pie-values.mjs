// @ts-check
/**
 * pie-values.mjs — how gameplay reflects diverse goals & values, and invites wondering about
 * parallel experiences.
 *
 * Alongside the three literary leans (boon · bane · bone) that shape how a chapter reads, players
 * naturally inhabit the lanes with distinct values and goals:
 *   care      hospitality: sharing slices, warm furrows, sweetening baneberries, passing the Egg
 *   craft     precision: bank shots, ramps, poised throws, caught tilts, hops in time
 *   witness   curiosity: reading/keeping road words, sightings, wonders kept, casting rooms
 *   mercy     quietude: unhurried balance, clean stretches without knocking or crushing
 *   boldness  nerve: climbing upper rows, foiling BaneWAP switches, throwing over mimes, minigames
 *
 * Nothing locks a player into one value or ranks one over another. Instead, emerging values lend
 * subtle blessings in play, appear alongside provenances, and surface concrete "parallel
 * experiences" — showing how another value path or carrier meets the exact same room or chapter.
 */

const PARALLELS_KEY = 'lore.pie.parallels.v1';

/** @typedef {'care' | 'craft' | 'witness' | 'mercy' | 'boldness'} PlayValue */

export const VALUE_DEFS = Object.freeze({
  care: {
    id: 'care',
    name: 'Hospitality',
    sigil: '&',
    color: '#c98a1e',
    tone: 'warm',
    says: 'Sharing slices, sweetening foretellings, warming furrows, passing the Egg.',
    blessing: 'Slices shared soothe wobble slightly further and linger warmly.',
    altRoom: 'carried with Hospitality — sharing slices along the way and sweetening what fell behind'
  },
  craft: {
    id: 'craft',
    name: 'Precision',
    sigil: '*',
    color: '#2c7e76',
    tone: 'clear',
    says: 'Bank shots off glass and post, ramps, poised throws, caught tilts, hops in time.',
    blessing: 'Aim lock sings truer on sighted targets and pocket windows steady the rim.',
    altRoom: 'walked by Precision — waiting for poised holds, glass banks, and exact hops'
  },
  witness: {
    id: 'witness',
    name: 'Curiosity',
    sigil: '?',
    color: '#34689a',
    tone: 'reflective',
    says: 'Treading and keeping road words, noticing figure strokes, casting rooms, keeping wonders.',
    blessing: 'Road words stay illuminated a breath longer and room sigils answer musically.',
    altRoom: 'lived as Witness — reading phrases underfoot, casting the room, and pausing to ask'
  },
  mercy: {
    id: 'mercy',
    name: 'Quietude',
    sigil: '.',
    color: '#6b7e63',
    tone: 'hushed',
    says: 'Unhurried footing, clean unknocked stretches, leaving foretellings un-squashed.',
    blessing: 'Clean steps past danger gently settle wobble and soften harsh lane clamor.',
    altRoom: 'passed in Quietude — hugging calm seams and letting the lanes flow unbruised'
  },
  boldness: {
    id: 'boldness',
    name: 'Nerve',
    sigil: '!',
    color: '#a34c42',
    tone: 'vivid',
    says: 'Pushing high up the rows, foiling BaneWAP switches, throwing over mimes, taking horns.',
    blessing: 'Higher rows gain brisker momentum shimmer and daring deflections spark fuller fanfares.',
    altRoom: 'charged through with Nerve — climbing near the horizon, foiling switches at full tilt'
  }
});

export const VALUE_IDS = Object.freeze(/** @type {PlayValue[]} */ (['care', 'craft', 'witness', 'mercy', 'boldness']));

/** Event weights feeding emergent play values (purely interpretive, never punitive). */
export const VALUE_OF_EVENT = Object.freeze({
  satisfied: ['care', 0.8],
  shared: ['care', 1.4],
  furrow: ['care', 0.9],
  sweetened: ['care', 1.3],
  egg: ['care', 1.4],
  boonberry: ['care', 0.5],
  boonrose: ['care', 0.8],
  dolphin: ['care', 0.7],

  perfect: ['craft', 1.4],
  ramp: ['craft', 1.1],
  caught: ['craft', 1.0],
  in_time: ['craft', 1.1],
  pocket: ['craft', 1.0],
  deft: ['craft', 0.9],
  boneberry: ['craft', 0.8],
  tempered: ['craft', 1.2],
  set_jam: ['craft', 1.0],

  read: ['witness', 1.2],
  word_mark: ['witness', 1.2],
  word_feed: ['witness', 1.1],
  word_ask: ['witness', 1.3],
  found_line: ['witness', 1.5],
  sighting: ['witness', 1.6],
  kept: ['witness', 1.4],
  cast: ['witness', 1.5],
  boonwap: ['witness', 0.6],
  boof: ['witness', 0.7],
  aimed: ['witness', 0.5],

  clean_stretch: ['mercy', 1.1],
  hop_clear: ['mercy', 0.9],
  wilted: ['mercy', 0.8],
  donut: ['mercy', 0.6],

  ahead: ['boldness', 1.1],
  foiled: ['boldness', 1.5],
  over_mimes: ['boldness', 1.4],
  alley: ['boldness', 1.1],
  parade: ['boldness', 1.1],
  long_view: ['boldness', 1.1],
  turned: ['boldness', 1.0]
});

const round2 = (v) => Math.round(v * 100) / 100;

/** Create fresh accumulator state for a carry. */
export function newValueState(intention = 'auto') {
  return {
    intention: VALUE_IDS.includes(/** @type {PlayValue} */ (intention)) ? intention : 'auto',
    scores: { care: 0, craft: 0, witness: 0, mercy: 0, boldness: 0 },
    cleanCobbles: 0,
    cleanPeak: 0,
    lastKnockCobble: 0
  };
}

/** Record an action/deed against the current carry's value tally. */
export function noteValueEvent(state, event, scale = 1) {
  if (!state?.scores) return null;
  const row = VALUE_OF_EVENT[event];
  if (!row) return null;
  const [id, pts] = row;
  const bonus = state.intention === id ? 1.15 : 1;
  state.scores[id] = round2((state.scores[id] || 0) + pts * scale * bonus);
  return { id, pts: pts * scale * bonus };
}

/** Rank values by emerged weight. */
export function rankValues(state) {
  const scores = state?.scores || {};
  const list = VALUE_IDS.map((id) => ({
    id,
    def: VALUE_DEFS[id],
    score: round2(Number(scores[id]) || 0)
  })).sort((a, b) => b.score - a.score);
  const total = list.reduce((s, x) => s + x.score, 0);
  const primary = total > 0 ? list[0] : { id: /** @type {PlayValue} */ (state?.intention !== 'auto' ? state.intention : 'witness'), def: VALUE_DEFS[state?.intention !== 'auto' ? state.intention : 'witness'], score: 0 };
  const secondary = list.find((x) => x.id !== primary.id && x.score > 0) || null;
  return { primary, secondary, list, total: round2(total) };
}

/** Compute gentle gameplay blessings from active values + chosen intention. */
export function valueBlessing(state) {
  const ranked = rankValues(state);
  const s = state?.scores || {};
  const focus = state?.intention && state.intention !== 'auto' ? state.intention : ranked.primary.id;
  const weight = (id) => Math.min(1, ((s[id] || 0) + (focus === id ? 2.5 : 0)) / 10);
  return {
    focus,
    primary: ranked.primary.id,
    roadGlowBonus: weight('witness') * 0.25,      // Witness notices a few more subtle passage phrases
    aimChimeSharpness: weight('craft') * 0.35,   // Craft tightens aim lock harmonic feedback
    calmDrift: weight('mercy') * 0.22,           // Mercy steadies gentle wobble on unknocked stretches
    shareGrace: weight('care') * 0.28,           // Care lets slices warm nearby targets more kindly
    vanguardSpark: weight('boldness') * 0.25     // Boldness adds rhythmic charge on upper rows
  };
}

/**
 * Generate a concrete "parallel experience" reflection comparing what happened here with
 * how another set of values or carrier would meet the same room / chapter.
 */
export function parallelReflection({ chapter = 1, carrier = 'porter', state, room = null, lean = 'boon' } = {}) {
  const { primary } = rankValues(state);
  const alt = VALUE_IDS.filter((id) => id !== primary.id)[(chapter + (room?.n || 1)) % (VALUE_IDS.length - 1)];
  const altDef = VALUE_DEFS[alt];
  const CARRIER_NAMES = {
    porter: 'the Porter',
    clerk: 'the Feast Clerk',
    genie: 'the Genie',
    clown: 'a Clown',
    figure: 'the figure in plain lines'
  };
  const others = Object.keys(CARRIER_NAMES).filter((c) => c !== carrier);
  const otherCarrier = CARRIER_NAMES[others[(chapter + (room?.n || 0)) % others.length]] || 'another carrier';
  const placeText = room?.title ? `Room ${room.n} (${room.title})` : `Chapter ${chapter}`;
  const leanText = lean === 'bane' ? 'leaning absurd reality' : lean === 'bone' ? 'leaning low magic' : 'leaning fairy tale';
  return {
    here: primary.id,
    elsewhere: alt,
    line: `In ${placeText} (${leanText}), your path moved by ${primary.def.name}; elsewhere, ${otherCarrier} ${altDef.altRoom}.`,
    short: `Parallel path: ${otherCarrier} by ${altDef.name}`
  };
}

const readJSON = (key, fallback) => {
  try { return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
};

/** Read per-chapter parallel experiences carried so far (`lore.pie.parallels.v1`). */
export function readChapterParallels() {
  return readJSON(PARALLELS_KEY, {});
}

/** Record distinct ways a chapter has been carried (value, carrier, style) so players see parallel depth. */
export function recordChapterParallel(chapter, { value, carrier, lean, style = '' } = {}) {
  if (!chapter || !value) return readChapterParallels();
  const data = readChapterParallels();
  const key = String(chapter);
  const entry = data[key] && typeof data[key] === 'object' ? data[key] : { values: [], carriers: [], leans: [], styles: [] };
  const add = (arr, item) => { if (item && !arr.includes(item)) arr.push(item); };
  add(entry.values, value);
  add(entry.carriers, carrier);
  add(entry.leans, lean);
  if (style) add(entry.styles, style);
  entry.last = { value, carrier, lean, style, at: new Date().toISOString().slice(0, 10) };
  data[key] = entry;
  try { window.localStorage.setItem(PARALLELS_KEY, JSON.stringify(data)); } catch { /* private mode */ }
  return data;
}
