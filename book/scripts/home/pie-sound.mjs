/**
 * pie-sound.mjs — the lanes, heard: WAP and the tactile notes of the carry, synthesized.
 * A few physical moments carry a CC0 sample (book/content/sounds.json), each a different material
 * in a different register: a slapstick crack over the wet fall of a WAP, a guiro for grass, a clave
 * for cobble, a cabasa for flour, a frame drum when the pie arrives, a bass drum for the floor
 * under a spill, a log drum for the beaver. A knock stays synthesized, a minor second out of key.
 * If a sample has not arrived, the synthesized voice plays. Tuned things stay in key.
 *
 * One bus for every sound: a soft top, a compressor, a short echo the size of a lane that darkens
 * as it returns, and a room around it all (open air in the field, walls close by in the city).
 * What is sung also has a second echo, in the chapter's time, left and then right; what is struck does not.
 * Every sound is placed where it happened: across by its lane, and back by how far up the lanes
 * it is (farther is quieter, softer, and more of the room). While the land runs at a beaver's pace
 * the bus is muffled, as if heard through slow time; while the mimes lead, it thins, the way it is
 * harder to wonder about pie. Footsteps know the ground: grass in the field, cobbles in the city.
 *
 * The music of it:
 *   a key        each chapter has its own, a pentatonic (a minor one while the mimes hold it), and
 *                its own pulse; knocks are out of key, on purpose, and the Egg's hum is in no key
 *   a chord      each room colours the key by its sigil (. home, ? left open, ~ drifting, @ the
 *                same notes seen from elsewhere, ^ lifting, = tuned in fifths …), and what the
 *                land gives sings the room's chord
 *   a line       every tuned thing (catches, bank shots, deft landings, shares) continues one
 *                melody, a step on through the key, landing on the chord and turning at the top
 *                and bottom; after a rest it starts again
 *   a pulse      answers come on the chapter's pulse: the second note of a catch, the honks after a
 *                WAP, the strum of an arpeggio; what the carrier does sounds at once
 *   a room, said a room opening changes the chord on the next beat, the held voices each moving the least
 *                they can, and (with the music on) the room says its chord once: strummed on plucked
 *                strings over its bass, far off. Home comes down onto its root; a room that asks is left
 *                without its bass
 *   the land     a run of good things fills the room's chord in under them: a fifth, then its third,
 *   joins in     then the colour the room adds, brighter the longer it runs; a knock lets it go;
 *                the spill resolves home. It is the chord changing, and nothing is added up. The chord
 *                breathes with the bar, the bass keeps the bars in fours, and as a fourth bar ends it
 *                turns: up to its fifth, down to the fifth below, and home
 *   the tilt     steadiness is being in tune. Past the line where the carrier can be poised, the pie's
 *                tilt is a low fifth on the side it leans to, drifting sharp and trembling faster the
 *                further it goes, and back in tune as it settles (with the music on)
 *   instruments  catches a celesta, deft landings a marimba, berries a vibraphone, shares two
 *                kalimbas (one each side), wonders a music box, glass rings a fifth, a bronze post
 *                its bar's odd partials, a hop a plucked string climbing the chord, the clowns'
 *                honks kazoos a chord tone higher for each WAP in a combo, over the room's bass
 *
 * Its themes and its time (pie-levels.spw, read in pie-rhythm.mjs):
 *   a motif      each chapter's level gives it a tune; the line spells it out as things are caught, in the
 *                chapter's key (fallen to the minor while the mimes hold it), turned backwards every third time
 *                round so it never wears thin, and heard once, softly, as the chapter begins
 *   the beat     the lanes keep the level's tempo (the rows arrive on its beats); every answer that waits for
 *                the pulse waits for the game's own beat (markBeat), so the music and the lanes keep one time.
 *                The conductor says each step a moment before it falls, and a rhythm's hit or the land's bass
 *                is placed on the audio clock for that moment, not on the frame that noticed it
 *   a lean       a level may swing: its off-sixteenths fall late (%swing), in the land's rhythm, in every
 *                answer that waits for the pulse, and in how the carrier's steps are heard
 *   a cadence    a chapter carried to its end closes in its own key, by how it went: home with its third;
 *                home with the major third it had lost, when it is won back from the mimes; home and still
 *                minor, when they keep it; and when they take it, the bass slips to the sixth and the top
 *                note is left alone. The next chapter's motif waits for it
 *   rhythms      each chapter hides one, kept softly by the land in one room (a whisper); a rhythm found plays
 *                under the carry in its own voice (groove), louder as the chord fills in, and the found moment is
 *                its bar played through, then the chapter's motif
 *   who comes    an obstacle is heard once as it nears, in the partials of what it is made of (stone grit,
 *                glass, wood, a gilt fifth, a hollow fall, a wasp's beat, a pigeon's odd harmonics, cloth).
 *                Boon rises, Bane falls, a clown scoops, a clerk closes sour until the slip is settled.
 *                The mimes stay quiet: they are the rest
 *   a bed        on request (Setup, Music: full), the room's chord held low under everything
 *   leitmotifs   Boof's three notes when Boof crosses the lanes
 *   themes       whose a sound is (Setup: Characters). The three WAPs are one shape turned three ways, the Genie a
 *                stack of fifths a comma sharp, the porter one knock in three meters, a mime a bar of rest; the line
 *                takes the carrier's instrument; a carry closes on the openings of who was met, in order
 *
 * Made to be heard the hundredth time, since a carry is hundreds of steps, catches and knocks:
 *   never twice the same   each sound is nudged a little in pitch, level, colour and place, and
 *                          its noise is read from a different part of one shared buffer
 *   an ear that tires      a sound repeated quickly comes back quieter and softer-edged, the way
 *                          an ear stops minding what it keeps hearing, and recovers in a breath
 *   once in an instant     the same sound twice at the same moment plays once
 *   soft edges             no bare square or saw: each goes through a filter, as a reed or a
 *                          kazoo; struck things are a few partials, the higher dying the sooner
 */

import { acousticEffectPlan, acousticPositionPlan, motifMemoryPlan } from '../modules/audio-model.mjs';

export { acousticEffectPlan, acousticPositionPlan, motifMemoryPlan };

let audio = null;
let bus = null;
let noiseBuffer = null;
const sound = { root: 293.66, minor: false, open: false, ground: 'field', muffled: false, thin: false, pulse: 96, swing: 0.5, written: 0.5, jazz: false, motif: null, development: null, carrier: '', rest: 0, harmonicTension: 0, styleInterval: 0, lane: 2, row: 0, prevLane: 2, prevRow: 0, chapter: 1 };
const musical = { swing: 'chapter', voicing: 'folk', motifCues: 'room', songSpace: 'natural', mix: 'balanced', patternMode: 'chapter', styleVoicing: '', jazzLean: 1 };
const swingTarget = () => {
  if (musical.swing === 'straight') return 0.5;
  if (musical.swing === 'lilt') return 0.58;
  if (musical.swing === 'deep') return 0.67;
  return sound.jazz ? Math.max(sound.written, 0.66) : sound.written;
};
const ROOTS = [293.66, 261.63, 329.63, 311.13, 277.18, 349.23, 293.66, 261.63, 392, 220, 246.94, 329.63, 293.66, 261.63, 349.23];
const PULSES = [96, 92, 104, 88, 100, 108, 96, 92, 112, 84, 100, 104, 96, 90, 108];
const MAJOR = [0, 2, 4, 7, 9];
const MINOR = [0, 3, 5, 7, 10];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const spread = (amount) => 1 + (Math.random() * 2 - 1) * amount;
const jitter = (amount) => (Math.random() * 2 - 1) * amount;
/** A pitch, in semitones from the chapter's root. */
const hz = (semi) => sound.root * 2 ** (semi / 12);

/* ─── Harmony: each room's sigil, a colour of the chapter's key ───────── */

/* Pitch classes above the key's root, and the one the bass takes. In a minor (the mimes) the
 * thirds, sixths and sevenths fall, except where that would sour a colour, which then has a minor of
 * its own. What the land gives sings only the chord's tones that are in the pentatonic (two at
 * least: the root and fifth stand in); the pad and the bass take the whole chord. */
const COLOURS = Object.freeze({
  '.': { bass: 0, pcs: [0, 4, 7] },        // ground: home
  '!': { bass: 0, pcs: [0, 7] },           // struck: a bare fifth
  '?': { bass: 0, pcs: [0, 2, 7] },        // asks: a sus2, left open
  '~': { bass: 5, pcs: [0, 4, 5, 9] },     // might be: the fourth's chord with its seventh, drifting
  '@': { bass: 9, pcs: [0, 4, 9] },        // seen from somewhere: the same notes, from the relative minor
  '&': { bass: 0, pcs: [0, 2, 4, 7] },     // joined: the third with a ninth beside it
  '*': { bass: 0, pcs: [0, 4, 7, 9], minor: { bass: 0, pcs: [0, 3, 7, 10] } },  // kept: a sixth, bright and dear
  '^': { bass: 7, pcs: [0, 2, 7] },        // lifted: the fifth's, suspended, rising
  '#': { bass: 4, pcs: [4, 7, 11] },       // marked: the third's, plain as a sign
  '=': { bass: 2, pcs: [2, 9], minor: { bass: 7, pcs: [2, 7] } },              // tuned: a fifth on the second, like strings tuning
  '%': { bass: 2, pcs: [2, 5, 9], minor: { bass: 10, pcs: [2, 5, 10] } },       // measured: the second's, considered
  '$': { bass: 5, pcs: [0, 5, 9] }         // made: the fourth's, earthy
});
const FALLS = Object.freeze({ 4: 3, 9: 8, 11: 10 });
const harmony = { sigil: '.', bass: 0, pcs: [0, 4, 7], sung: [0, 4, 7] };

/* ─── A jazz feel (Setup, Sound, Feel; the board line =feel[jazz]): for an ear that wants more to do ───
 * The music as written stays everyone's default. With jazz, three things change, each a step of theory to hear:
 *  · swing: the off-sixteenths fall at least a triplet late (long, short), whatever the chapter wrote;
 *  · the chords: each room's colour takes its tensions (sevenths, ninths, a sixth, a sharp eleven), and the lifted
 *    room (^) becomes the dominant seven with a flat nine, the one chord that wants to go home;
 *  · the line: it sings the whole mode rather than five notes of it, and every other caught note leans on the
 *    semitone above before it lands (an appoggiatura: a dissonance that resolves).
 * In the mimes' minor the same tensions fall as the colours do: a major seventh becomes a minor one. */
const JAZZ = Object.freeze({
  '.': { bass: 0, pcs: [0, 4, 7, 11] },         // home: a major seven
  '!': { bass: 0, pcs: [0, 5, 10] },            // struck: fourths stacked, the flat seven blue in a major key
  '?': { bass: 0, pcs: [0, 2, 7, 9] },          // asks: a six-nine, suspended
  '~': { bass: 5, pcs: [0, 4, 5, 7, 9] },       // might be: the fourth's major nine
  '@': { bass: 9, pcs: [0, 4, 7, 9] },          // seen from somewhere: the relative minor seven
  '&': { bass: 0, pcs: [0, 2, 4, 7, 11] },      // joined: a major nine
  '*': { bass: 0, pcs: [0, 2, 4, 7, 9] },       // kept: a six-nine, bright and dear
  '^': { bass: 7, pcs: [2, 5, 7, 8, 11] },      // lifted: the dominant seven, flat nine, leaning home
  '#': { bass: 4, pcs: [2, 4, 7, 11] },         // marked: the third's minor seven
  '=': { bass: 2, pcs: [0, 2, 5, 9] },          // tuned: the second's minor seven
  '%': { bass: 2, pcs: [0, 2, 4, 5, 9] },       // measured: the second's minor nine
  '$': { bass: 5, pcs: [0, 4, 5, 9, 11] }       // made: the fourth's Lydian, a sharp eleven bright over the earth
});
const JAZZ_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];

/* A chapter leaning toward low magic sings in fourths: no thirds to say how it feels, a frame of load-bearing
 * intervals (the third up to the fourth, the sixth up to the seventh). Only with themes on (setSoundPlace). */
const OPEN = [0, 2, 5, 7, 10];
const RAISES = Object.freeze({ 4: 5, 9: 10, 11: 10 });
const scaleNow = () => (sound.minor ? (sound.jazz ? DORIAN : MINOR) : sound.open ? OPEN : sound.jazz ? JAZZ_MAJOR : MAJOR);

/** A room's chord as a plan, with no audio: its bass, its tones, the scale the line walks, and the tones it sings.
 *  As written or as jazz, in the key, the mimes' minor, or the open fourths of low magic. (sound:check reads it.) */
export function colourPlan(sigil, { jazz = false, minor = false, open = false } = {}) {
  const table = jazz ? JAZZ : COLOURS;
  const base = table[sigil] || table['.'];
  const own = minor && base.minor;
  const colour = own || base;
  const fall = (pc) => (minor && !own ? (FALLS[pc] ?? pc) : open ? (RAISES[pc] ?? pc) : pc);
  const scale = minor ? (jazz ? DORIAN : MINOR) : open ? OPEN : jazz ? JAZZ_MAJOR : MAJOR;
  const pcs = [...new Set(colour.pcs.map(fall))].sort((a, b) => a - b);
  let sung = pcs.filter((pc) => scale.includes(pc));
  if (sung.length < 2) sung = [...new Set([...sung, 0, 7])].sort((a, b) => a - b);
  return { sigil: table[sigil] ? sigil : '.', bass: fall(colour.bass), pcs, sung, scale };
}
function setHarmony(sigil) {
  const plan = colourPlan(sigil, { jazz: sound.jazz, minor: sound.minor, open: sound.open });
  Object.assign(harmony, { sigil: plan.sigil, bass: plan.bass, pcs: plan.pcs, sung: plan.sung });
  retunePad();
}
/** The i-th tone the chord sings, climbing by octaves. */
const sungTone = (i) => {
  const n = harmony.sung.length;
  return harmony.sung[((i % n) + n) % n] + 12 * Math.floor(i / n);
};
/** The room's bass, an octave or two under the key's root. */
const bassLow = () => harmony.bass - (harmony.bass > 6 ? 24 : 12);

/* ─── The line: one melody through every tuned thing ──────────────────── */

const line = { at: 7, dir: 1, last: -9 };
const scaleRun = () => {
  const scale = scaleNow();
  const out = [];
  for (let o = -1; o <= 3; o += 1) scale.forEach((s) => out.push(s + 12 * o));
  return out;
};
const isSung = (semi) => harmony.sung.includes(((semi % 12) + 12) % 12);
const nearestIndex = (run, semi) => run.reduce((best, s, i) => (Math.abs(s - semi) < Math.abs(run[best] - semi) ? i : best), 0);
/** The nearest tone the chord sings to a pitch. */
const sungNear = (semi) => {
  const run = scaleRun().filter(isSung);
  return run[nearestIndex(run, semi)];
};
/** The next tone the chord sings above (or below) a pitch. */
const sungFrom = (semi, dir = 1) => {
  const run = scaleRun().filter(isSung);
  return (dir > 0 ? run.find((s) => s > semi) : [...run].reverse().find((s) => s < semi)) ?? semi + 12 * dir;
};
/** The line's next note: `steps` on through the key the way it is heading, landing on the chord;
 *  at the top or bottom of its range it turns; after a rest it starts again near the middle. */
const fallen = (semi) => {
  if (!sound.minor && !sound.open) return semi;
  const pc = ((semi % 12) + 12) % 12;
  return semi - pc + ((sound.minor ? FALLS[pc] : RAISES[pc]) ?? pc);
};
function nextNote(now, steps = 1) {
  // A chapter with a motif: the line spells it out, from its start after a rest, backwards every third time round.
  if (sound.motif?.length) {
    if (now - line.last > 3.5) line.motifAt = 0;
    const len = sound.motif.length;
    const round = Math.floor((line.motifAt || 0) / len);
    const i = (line.motifAt || 0) % len;
    const semi = sound.motif[round % 3 === 2 ? len - 1 - i : i];
    line.motifAt = (line.motifAt || 0) + steps;
    line.at = fallen(semi) + (semi < 0 ? 12 : 0);
    line.last = now;
    return line.at;
  }
  if (now - line.last > 3.5) {
    line.at = sungNear(7 + [-3, 0, 2, 5][Math.floor(Math.random() * 4)]);
    line.dir = 1;
    line.last = now;
    return line.at;
  }
  const run = scaleRun();
  const i = nearestIndex(run, line.at);
  let j = i + steps * line.dir;
  if (!run[j] && run[j] !== 0) j = i - steps * line.dir;
  if (run[j] > 24 || run[j] < 0) { line.dir = -line.dir; j = i + steps * line.dir; }
  for (let guard = 0; guard < 3 && j > 0 && j < run.length - 1 && !isSung(run[j]); guard += 1) j += line.dir;
  line.at = run[clamp(j, 0, run.length - 1)];
  line.last = now;
  return line.at;
}

/* ─── The pulse: answers land on it ───────────────────────────────────── */

const sixteenth = () => 60 / sound.pulse / 4;
/* A level may lean: its off-sixteenths fall late by this much (seconds), and every answer leans with them. */
const lean = () => (sound.swing - 0.5) * 2 * sixteenth();
/* The audio clock, read finely. A page is told the audio's time in steps of a few milliseconds, so two
 * readings a frame apart can be the same number. The page's own clock is fine-grained: the audio's time is
 * the page's time plus the largest lead the audio has shown lately (the reading taken just as it stepped).
 * If the audio stops and starts again, the lead is taken afresh. Never earlier than the audio says. */
const lead = { by: null, at: 0 };
function audioNow() {
  const coarse = audio.currentTime;
  if (typeof performance === 'undefined') return coarse;
  const page = performance.now() / 1000;
  const shown = coarse - page;
  if (lead.by === null || lead.by - shown > 0.05 || shown > lead.by) lead.by = shown;
  else lead.by -= (page - lead.at) * 0.0002;       // let it follow two clocks that drift apart
  lead.at = page;
  return Math.max(coarse, page + lead.by);
}

/* The game's own beat: the lanes say when a beat fell (markBeat, and how long ago, since a frame notices a
 * beat a little after it falls), and every answer waits for that grid. */
let beatAnchor = 0;
export function markBeat(late = 0) { if (audio) beatAnchor = audioNow() - clamp(Number(late) || 0, 0, 0.25); }
/** The pulse from t on: at(n) is seconds from t to the n-th sixteenth from the first one at least `after`
 *  away, on the game's beat, each off-sixteenth leaning as the level leans. */
const pulseFrom = (t, after = 0.045) => {
  const s = sixteenth();
  const first = Math.ceil((t + after - beatAnchor) / s);
  return (n = 0) => (first + n) * s + (Math.abs(first + n) % 2 ? lean() : 0) + beatAnchor - t;
};
/** Seconds from t to the pulse's next sixteenth at least `after` away. */
const toPulse = (t, after = 0.045) => pulseFrom(t, after)(0);
/** Seconds from t to the next beat at least `after` away. */
const toBeat = (t, after = 0.03) => {
  const b = sixteenth() * 4;
  return Math.ceil((t + after - beatAnchor) / b) * b + beatAnchor - t;
};

/* ─── The bus, and the room around it ─────────────────────────────────── */

let unlockWired = false;
function unlockAudio(ctx) {
  if (!ctx) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.audioSession && navigator.audioSession.type !== 'playback') {
      navigator.audioSession.type = 'playback';
    }
  } catch { /* ignore */ }
  if (ctx.state !== 'running') {
    ctx.resume().catch(() => {});
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch { /* ignore */ }
  }
  if (!unlockWired && typeof document !== 'undefined') {
    unlockWired = true;
    const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
    const onGesture = () => {
      if (!audio) return;
      unlockAudio(audio);
      if (audio.state === 'running') {
        events.forEach((ev) => document.removeEventListener(ev, onGesture, true));
        unlockWired = false;
      }
    };
    events.forEach((ev) => document.addEventListener(ev, onGesture, { capture: true, passive: true }));
  }
}

function context() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audio) {
    audio = new AudioCtx();
    audio.addEventListener?.('statechange', () => {
      if (audio && audio.state !== 'running') unlockAudio(audio);
    });
  }
  if (audio.state !== 'running') unlockAudio(audio);
  ensureBus();
  ensureSamples();
  return audio;
}

/** Browsers let sound start only from a gesture: the click or key that starts a carry. */
export function primeAudio() {
  try { context(); } catch { /* silent, then */ }
}

/* ─── Samples: a few physical moments, coloured; the synth if they have not arrived ─── */

let sampleGroups = null;
let samplesAsked = false;
const lastSample = new Map();

function ensureSamples() {
  if (samplesAsked || !audio) return;
  samplesAsked = true;
  fetch('/book/content/sounds.json')
    .then((res) => (res.ok ? res.json() : null))
    .then(async (doc) => {
      if (!doc?.sounds?.length || !audio) return;
      const groups = new Map();
      await Promise.all(doc.sounds.map(async (s) => {
        try {
          const res = await fetch(s.file);
          if (!res.ok) return;
          const buf = await audio.decodeAudioData(await res.arrayBuffer());
          const list = groups.get(s.event) || [];
          list.push({ buf, gain: Number(s.gain) || 1, shape: s.hear?.type ? s.hear : null });
          groups.set(s.event, list);
        } catch { /* the synthesized voice remains */ }
      }));
      sampleGroups = groups;
    })
    .catch(() => {});
}

/** One take of an event, not the same take twice in a row. */
function pickSample(event) {
  const list = sampleGroups?.get(event);
  if (!list?.length) return null;
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastSample.get(event)) i = (i + 1) % list.length;
  lastSample.set(event, i);
  return list[i];
}

/* A room's answer, as a stereo impulse: in the field, a soft bounce off the ground and open air
 * that darkens as it fades; in the city, walls close on either side, then the street's tail. */
/* Those two rooms, as numbers: how long the tail is, the first reflections ([seconds, gain]), how bright the tail
 * starts and how far it darkens (a one-pole's coefficient), how fast it dies, how soon it swells in. `damp` says
 * where each sits for a place's own room (roomPlan): 0.2 is the city's stone, 0.8 the field's air. */
const ROOMS = Object.freeze({
  field: Object.freeze({ secs: 1.8, early: [[0.006, 0.45]], damp: 0.8, bright: 0.5, darken: 0.42, decay: 3.8, onset: 0.025, weighed: false }),
  city: Object.freeze({ secs: 1.2, early: [[0.009, 0.5], [0.017, 0.38], [0.026, 0.3], [0.041, 0.22], [0.057, 0.15]], damp: 0.2, bright: 0.68, darken: 0.5, decay: 5.4, onset: 0.01, weighed: false })
});
/* All of a room's first reflections together carry at most this much of its tail's energy, so a room never turns into a comb. */
const EARLY_SHARE = 0.5;

/**
 * A room, unplayed: the numbers its impulse is built from. A ground's name ('field', 'city'), or an acoustic with
 * no room of its own, gives the room the lanes have always had there. A place's own room (pie-world SCENES
 * `acoustic`: { ground, room: { secs, early, damp } }) is held in range (0.4 to 2.4 seconds, at most eight
 * reflections inside the room, gains to 0.6, damp 0 to 1) and lies on the line through those two rooms: brighter
 * and quicker toward stone, darker and slower toward open air. Its tail has always died away by the end, and it
 * swells in as the first wall answers. In the two old rooms a reflection is one sample among the tail's many, far
 * under it; in a place's room each is weighed against the whole tail (`weighed`), so a slap or a flutter can be heard.
 * @param {unknown} acoustic
 * @returns {{ secs: number, early: number[][], damp: number, bright: number, darken: number, decay: number, onset: number, weighed: boolean }}
 */
export function roomPlan(acoustic) {
  const named = typeof acoustic === 'string' ? { ground: acoustic } : acoustic || {};
  const base = ROOMS[named.ground === 'field' ? 'field' : 'city'];
  const room = named.room;
  if (!room || typeof room !== 'object') return { ...base, early: base.early.map((e) => [...e]) };
  const secs = clamp(Number.isFinite(room.secs) ? room.secs : base.secs, 0.4, 2.4);
  const damp = clamp(Number.isFinite(room.damp) ? room.damp : base.damp, 0, 1);
  let early = (Array.isArray(room.early) ? room.early : [])
    .filter((e) => Array.isArray(e) && Number.isFinite(e[0]) && Number.isFinite(e[1]) && e[1] > 0)
    .map(([at, g]) => [clamp(at, 0.001, Math.min(0.25, secs / 2)), clamp(g, 0, 0.6)])
    .sort((a, b) => a[0] - b[0])
    .slice(0, 8);
  const share = early.reduce((sum, [, g]) => sum + g * g, 0);
  if (share > EARLY_SHARE) early = early.map(([at, g]) => [at, g * Math.sqrt(EARLY_SHARE / share)]);
  const u = (damp - ROOMS.city.damp) / (ROOMS.field.damp - ROOMS.city.damp);
  const along = (city, field) => city + (field - city) * u;
  // How far the tail has fallen by the end of the room (decay × secs) is kept, so a short room is not cut off mid-tail.
  const fall = along(ROOMS.city.decay * ROOMS.city.secs, ROOMS.field.decay * ROOMS.field.secs);
  return {
    secs, early, damp,
    bright: along(ROOMS.city.bright, ROOMS.field.bright),
    darken: along(ROOMS.city.darken, ROOMS.field.darken),
    decay: fall / secs,
    onset: early.length ? clamp(early[0][0], 0.005, 0.04) : along(ROOMS.city.onset, ROOMS.field.onset),
    weighed: true
  };
}

function roomImpulse(ground, plan = null) {
  const sr = audio.sampleRate;
  const p = plan || ROOMS[ground === 'field' ? 'field' : 'city'];
  const secs = p.secs;
  const n = Math.floor(sr * secs);
  const ir = audio.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c += 1) {
    const d = ir.getChannelData(c);
    let lp = 0;
    let power = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / sr;
      const darken = Math.min(1, t / secs);
      lp += (p.bright - p.darken * darken) * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t * p.decay) * Math.min(1, t / p.onset);
      power += d[i] * d[i];
    }
    const weight = p.weighed ? Math.sqrt(power) : 1;
    p.early.forEach(([at, g], k) => {
      const i = Math.floor((at + (k % 2 === c ? 0 : 0.0011)) * sr);
      if (i < n) d[i] += g * weight * (k % 2 === c ? 1 : 0.55);
    });
  }
  return ir;
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
  // A soft top: the sizzle above the voices is what tires an ear first.
  const soft = audio.createBiquadFilter();
  soft.type = 'highshelf';
  soft.frequency.value = 4800;
  soft.gain.value = -6;
  const comp = audio.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.ratio.value = 4;
  const master = audio.createGain();
  master.gain.value = 0.85;
  // The echo the size of a lane, darker on each return, so it lingers without ringing.
  const echo = audio.createDelay(0.6);
  echo.delayTime.value = 0.14;
  const dark = audio.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 3000;
  const feedback = audio.createGain();
  feedback.gain.value = 0.22;
  const wet = audio.createGain();
  wet.gain.value = 0.1;
  // The room: each sound sends some of itself, the far and the said more than the near and the struck.
  const air = audio.createGain();
  const room = audio.createConvolver();
  room.buffer = roomImpulse(sound.ground, sound.room);
  const roomOut = audio.createGain();
  roomOut.gain.value = 0.5;
  input.connect(muffle).connect(thin).connect(soft).connect(comp).connect(master).connect(audio.destination);
  air.connect(room).connect(roomOut).connect(muffle);
  soft.connect(echo);
  echo.connect(dark).connect(feedback).connect(echo);
  dark.connect(wet).connect(comp);
  // The song's echo: what is sung (a catch, a berry, a wonder, a room's chord) sends a little of itself to a
  // second echo that keeps the chapter's time, left and then right, darker and quieter each return. What is
  // struck (a step, a knock, a WAP) does not, so the echo carries the tune and never the clatter.
  const song = audio.createGain();
  const songLow = audio.createBiquadFilter();
  songLow.type = 'highpass';
  songLow.frequency.value = 320;
  const songA = audio.createDelay(1.5);
  const songB = audio.createDelay(1.5);
  songA.delayTime.value = songB.delayTime.value = songTime();
  const darkA = audio.createBiquadFilter();
  darkA.type = 'lowpass';
  darkA.frequency.value = 2600;
  const darkB = audio.createBiquadFilter();
  darkB.type = 'lowpass';
  darkB.frequency.value = 2000;
  const across = audio.createGain();
  across.gain.value = 0.55;
  const again = audio.createGain();
  again.gain.value = 0.3;
  const songOut = audio.createGain();
  songOut.gain.value = 0.5;
  const sideOf = (pan) => {
    if (!audio.createStereoPanner) return songOut;
    const p = audio.createStereoPanner();
    p.pan.value = pan;
    p.connect(songOut);
    return p;
  };
  song.connect(songLow).connect(songA).connect(darkA);
  darkA.connect(sideOf(-0.55));
  darkA.connect(across).connect(songB).connect(darkB);
  darkB.connect(sideOf(0.55));
  darkB.connect(again).connect(songA);
  songOut.connect(muffle);
  bus = { input, muffle, thin, air, room, roomOut, song, songA, songB, soft, feedback, wet, ground: roomKey(), door: null };
  return bus;
}

/* The song's echo is three sixteenths long (a dotted eighth, the echo that answers between the beats); where
 * the level leans, a whole beat, so the echo never argues with the lean. */
function songTime() {
  return clamp(sixteenth() * (sound.swing > 0.53 ? 4 : 3), 0.2, 1.4);
}
function retimeSong() {
  if (!bus?.songA || !audio) return;
  const now = audio.currentTime;
  [bus.songA, bus.songB].forEach((d) => d.delayTime.setTargetAtTime(songTime(), now, 0.05));
}

/* What the room now standing was built from: a place's own plan (sound.room), or else the ground's name. */
const roomKey = () => (sound.room ? JSON.stringify(sound.room) : sound.ground);
/* Rooms cross over as the colours do at a door (pie-game's sceneT, 1.4 s): nearly there after three of these. */
const ROOM_CROSS = 0.45;

/** A new room when the ground changes: the field's air, or the city's walls. A place with a room of its own
 *  (setSoundPlace's `scene`, setSoundScene) is crossed over to instead (crossRooms). */
function regroundRoom() {
  if (!bus || bus.ground === roomKey()) return;
  const room = audio.createConvolver();
  room.buffer = roomImpulse(sound.ground, sound.room);
  if (!sound.room && !bus.door) {
    bus.air.connect(room).connect(bus.roomOut);
    bus.air.disconnect(bus.room);
  } else crossRooms(room);
  bus.room = room;
  bus.ground = roomKey();
}

/* A place's own room is entered through a door (a gain on what is sent to it), which opens as the door of the room
 * before it closes. The old room's tail rings out, and it is let go once it has. The two old rooms have no door:
 * leaving one, it stops being sent to at once, as it always has. */
function crossRooms(room) {
  const now = audio.currentTime;
  const was = { door: bus.door, room: bus.room };
  if (sound.room) {
    const door = audio.createGain();
    door.gain.setValueAtTime(0, now);
    door.gain.setTargetAtTime(1, now, ROOM_CROSS);
    bus.air.connect(door).connect(room).connect(bus.roomOut);
    bus.door = door;
  } else {
    bus.air.connect(room).connect(bus.roomOut);
    bus.door = null;
  }
  if (!was.door) { bus.air.disconnect(was.room); return; }
  was.door.gain.setTargetAtTime(0, now, ROOM_CROSS);
  setTimeout(() => { try { bus.air.disconnect(was.door); was.room.disconnect(); } catch { /* already gone */ } }, (ROOM_CROSS * 6 + 2.4) * 1000);
}

/** Where the carry is: the chapter's key, pulse and ground, and whether the mimes hold it. With `after`
 *  (seconds), the chord held under the carry stays in the old key that long, while a cadence finishes there.
 *  With `scene` (a pie-world SCENES record), the ground and the room are the ones the place is drawn in; without
 *  it the chapter's number says the ground, as it always has. The key is the chapter's either way. */
let placeAfter = 0;
/** @param {{ chapter?: number, held?: boolean, level?: any, after?: number, lean?: string, scene?: any }} [place] */
export function setSoundPlace({ chapter = 1, held = false, level = null, after = 0, lean: leaning = '', scene = null } = {}) {
  sound.chapter = Math.max(1, Math.floor(Number(chapter) || 1));
  sound.root = level?.root || ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.pulse = level?.tempo || PULSES[(chapter - 1) % PULSES.length] || 96;
  sound.written = clamp((Number(level?.swing) || 50) / 100, 0.5, 0.67);
  sound.swing = swingTarget();
  sound.motif = Array.isArray(level?.motif) && level.motif.length ? level.motif : null;
  sound.development = Array.isArray(level?.development) && level.development.length ? level.development : null;
  line.motifAt = 0;
  // How the chapter leans (the reader's lens, or their carries), heard: low magic opens the key. The minor stays the mimes' alone.
  sound.minor = held;
  sound.open = !sound.minor && leaning === 'bone';
  const place = placePlan({ chapter, scene });
  sound.ground = place.ground;
  sound.room = place.room;
  line.last = -9;
  lastCompVoicing = null;
  placeAfter = clamp(Number(after) || 0, 0, 4);
  setHarmony('.');
  placeAfter = 0;
  try { regroundRoom(); retimeSong(); } catch { /* the old room will do */ }
}

/** The room passing now, by its sigil: the chord the land sings while it passes. The chord changes on the
 *  next beat, and with `announce` the room says it once as it opens (sayRoom). */
export function setSoundRoom(sigil, { announce = false } = {}) {
  if (!COLOURS[sigil] || sigil === harmony.sigil) return;
  setHarmony(sigil);
  if (announce) sayRoom();
}

/** The land's pace and the mimes' hold, heard: muffled in slow time, thinner while they lead. */
export function setSoundMood({ muffled = false, thin = false } = {}) {
  if (!audio || !bus) return;
  const t = audio.currentTime;
  if (muffled !== sound.muffled) bus.muffle.frequency.setTargetAtTime(muffled ? 1300 : 16000, t, 0.12);
  if (thin !== sound.thin) bus.thin.frequency.setTargetAtTime(thin ? 420 : 30, t, 0.2);
  sound.muffled = muffled;
  sound.thin = thin;
}

/* ─── The ear ─────────────────────────────────────────────────────── */

/* How tired the ear is of each sound: one more each time it plays, halving every HALF_LIFE seconds.
 * The carry's own sounds tire it most (they come constantly); what the land gives, least. */
const HALF_LIFE = 1.2;
const TIRES = Object.freeze({ step: 1.3, land: 1, flour: 1, throw: 0.9, hop: 0.7, knock: 0.7, catch: 0.6, deft: 0.6, glass: 0.5, post: 0.5, ramp: 0.5, wap: 0.45, 'land-pulse': 0.35, 'near:berry': 1.6, 'near:boneberry': 1.6, trick: 0.45, power_story: 0.5, story_pass: 1.2, furrow: 0.65, splash: 0.7, easter_egg: 0.3, theme_flourish: 0.4 });
const heard = new Map();

/** Hear a sound: how tired the ear already is of it (null: it was just heard, this instant). */
function hear(kind, now) {
  const was = heard.get(kind);
  if (was && now - was.last < 0.03) return null;
  const heat = was ? was.heat * 0.5 ** ((now - was.last) / HALF_LIFE) : 0;
  heard.set(kind, { heat: heat + 1, last: now });
  return heat * (TIRES[kind] ?? 0.6);
}

/* How much of the room each sound takes: the struck and the near little, the said and the rung more. */
const AIR = Object.freeze({
  step: 0.03, land: 0.05, flour: 0.14, throw: 0.08, hop: 0.12, knock: 0.1, squash: 0.06, wap: 0.16,
  catch: 0.28, deft: 0.25, glass: 0.4, post: 0.32, ramp: 0.2, berry: 0.35, sweet: 0.42, share: 0.28,
  wonder: 0.45, bone: 0.18, foretell: 0.5, fulfil: 0.3, beaver: 0.25, foil: 0.25, egg: 0.6, spill: 0.3,
  haggle: 0.22, coin: 0.35, pocket: 0.14, poise: 0.32, pantry: 0.38, recipe: 0.4,
  rose: 0.45, gift: 0.4, anthill: 0.08, brush: 0.15,
  trick: 0.28, power_story: 0.36, story_pass: 0.24, furrow: 0.22, splash: 0.14,
  easter_egg: 0.52, theme_flourish: 0.38
});

/* How much of each sound the song's echo repeats: the sung things, a little; the struck things, nothing. */
const SONG = Object.freeze({ catch: 0.2, deft: 0.14, glass: 0.3, post: 0.2, berry: 0.26, sweet: 0.28, share: 0.2, wonder: 0.34, poise: 0.22, pantry: 0.28, recipe: 0.26, trick: 0.22, power_story: 0.28, story_pass: 0.16, furrow: 0.14, easter_egg: 0.32, theme_flourish: 0.22 });
const outletAcoustics = new WeakMap();

/** Render a pure acoustic plan into the shared edge, room and song buses. `kit` renders its distance and side with
 *  a PannerNode when the browser has one, or the equivalent bounded gain and StereoPanner fallback when it does not. */
function outlet(heat, { depth = 0, air = 0, song = 0, role = 'fx' } = {}) {
  const b = ensureBus();
  const level = audio.createGain();
  const plan = acousticEffectPlan({ heat, depth, air, song, role, space: musical.songSpace, mix: musical.mix, voicing: musical.voicing, dry: sound.dry });
  const spatial = plan.distance > 1.001 && typeof audio.createPanner === 'function';
  level.gain.value = (spatial ? plan.spatialGain : plan.directGain) * spread(0.12);
  outletAcoustics.set(level, { ...plan, spatial });
  const edge = audio.createBiquadFilter();
  edge.type = 'lowpass';
  edge.Q.value = 0;
  edge.frequency.value = plan.cutoffHz;
  level.connect(edge).connect(b.input);
  const send = audio.createGain();
  send.gain.value = plan.roomSend;
  edge.connect(send).connect(b.air);
  if (plan.echoSend > 0 && b.song) {
    const sung = audio.createGain();
    sung.gain.value = plan.echoSend;
    edge.connect(sung).connect(b.song);
  }
  return level;
}

function noise() {
  if (noiseBuffer?.sampleRate === audio.sampleRate) return noiseBuffer;
  const n = audio.sampleRate * 2;
  noiseBuffer = audio.createBuffer(1, n, audio.sampleRate);
  const ch = noiseBuffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) ch[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/* A plucked string (Karplus–Strong), softened at the start, one buffer per pitch. */
const PLUCKS = new Map();
function pluckBuffer(f) {
  const key = `${audio.sampleRate}:${f.toFixed(1)}`;
  if (PLUCKS.has(key)) return PLUCKS.get(key);
  const sr = audio.sampleRate;
  const n = Math.floor(sr * 0.6);
  const p = Math.max(2, Math.round(sr / f));
  const ring = new Float32Array(p);
  for (let i = 0; i < p; i += 1) ring[i] = Math.random() * 2 - 1;
  for (let pass = 0; pass < 3; pass += 1) for (let i = 0; i < p; i += 1) ring[i] = (ring[i] + ring[(i + 1) % p]) * 0.5;
  const buf = audio.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  let idx = 0;
  let peak = 0;
  for (let i = 0; i < n; i += 1) {
    const next = (idx + 1) % p;
    const v = ring[idx];
    d[i] = v;
    peak = Math.max(peak, Math.abs(v));
    ring[idx] = 0.985 * 0.5 * (v + ring[next]);
    idx = next;
  }
  const fade = Math.floor(n * 0.2);
  for (let i = 0; i < n; i += 1) d[i] = (d[i] / (peak || 1)) * (i > n - fade ? (n - i) / fade : 1);
  PLUCKS.set(key, buf);
  return buf;
}

/** The instruments, for one sound starting at t, placed at pan and going out through out. Each
 *  voice can lean a little to one side of it (`side`), so a struck thing has width. */
function kit(out, t, pan = 0) {
  const places = new Map();
  const place = (side = 0) => {
    const p = clamp(pan + side, -0.9, 0.9);
    const key = p.toFixed(2);
    if (!places.has(key)) {
      const acoustic = outletAcoustics.get(out);
      if (acoustic?.spatial) {
        const node = audio.createPanner();
        node.panningModel = acoustic.panningModel;
        node.distanceModel = acoustic.distanceModel;
        node.refDistance = acoustic.refDistance;
        node.maxDistance = acoustic.maxDistance;
        node.rolloffFactor = acoustic.rolloffFactor;
        const position = acousticPositionPlan(acoustic, p);
        if (node.positionX && node.positionY && node.positionZ) {
          node.positionX.value = position.x;
          node.positionY.value = position.y;
          node.positionZ.value = position.z;
        } else node.setPosition(position.x, position.y, position.z);
        node.connect(out);
        places.set(key, node);
        return node;
      }
      if (!audio.createStereoPanner) return out;
      const node = audio.createStereoPanner();
      node.pan.value = p;
      node.connect(out);
      places.set(key, node);
    }
    return places.get(key);
  };
  const envelope = (at, attack, vol, dur) => {
    const g = audio.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + Math.min(attack, dur * 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    return g;
  };
  // A voice. A square or a saw always goes through a filter: a reed, never a buzz.
  const tone = (type, f0, f1, dur, vol, delay = 0, { attack = 0.012, cents = 6, cut = 0, vibrato = 0, tremolo = 0, side = 0 } = {}) => {
    const at = t + delay;
    const osc = audio.createOscillator();
    osc.type = type;
    osc.detune.value = jitter(cents);
    osc.frequency.setValueAtTime(f0, at);
    if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur);
    let node = osc;
    if (type === 'square' || type === 'sawtooth') {
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cut || Math.min(2400, f0 * 4);
      filter.Q.value = 3;
      node = node.connect(filter);
    }
    if (vibrato) {
      const lfo = audio.createOscillator();
      const depth = audio.createGain();
      lfo.frequency.value = 6.2;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(osc.detune);
      lfo.start(at);
      lfo.stop(at + dur + 0.05);
    }
    if (tremolo) {
      const swing = audio.createGain();
      swing.gain.value = 0.8;
      const lfo = audio.createOscillator();
      const depth = audio.createGain();
      lfo.frequency.value = tremolo;
      depth.gain.value = 0.2;
      lfo.connect(depth).connect(swing.gain);
      lfo.start(at);
      lfo.stop(at + dur + 0.05);
      node = node.connect(swing);
    }
    node.connect(envelope(at, attack, vol, dur)).connect(place(side));
    osc.start(at);
    osc.stop(at + dur + 0.05);
  };
  // Noise through a filter; with width, two noises a little apart, one either side.
  const hiss = (f0, f1, dur, vol, q = 1.8, delay = 0, type = 'bandpass', width = 0) => {
    const at = t + delay;
    const buf = noise();
    const sides = width ? [-width, width] : [0];
    sides.forEach((side) => {
      const src = audio.createBufferSource();
      src.buffer = buf;
      const flt = audio.createBiquadFilter();
      flt.type = type;
      flt.Q.value = type === 'lowpass' ? 0 : q;
      const k = spread(0.08);
      flt.frequency.setValueAtTime(f0 * k, at);
      flt.frequency.exponentialRampToValueAtTime(Math.max(60, f1 * k), at + dur);
      src.connect(flt).connect(envelope(at, 0.008, vol / Math.sqrt(sides.length), dur)).connect(place(side));
      src.start(at, Math.random() * (buf.duration - dur - 0.1), dur + 0.05);
    });
  };
  const pluck = (f, vol, delay = 0) => {
    const src = audio.createBufferSource();
    src.buffer = pluckBuffer(f);
    src.playbackRate.value = 2 ** (jitter(5) / 1200);
    const g = audio.createGain();
    g.gain.value = vol;
    src.connect(g).connect(place(0));
    src.start(t + delay);
  };
  const swell = (type, f, dur, vol, delay = 0) => tone(type, f, 0, dur, vol, delay, { attack: dur * 0.4, cents: 3 });
  // Celesta: a hammer on a steel bar over a box: the note, its octave and its twelfth, the higher dying the sooner.
  const celesta = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.005, cents: 4, side });
    tone('sine', f * 2.003, 0, dur * 0.45, vol * 0.22, delay, { attack: 0.004, cents: 4, side: side + 0.12 });
    tone('sine', f * 3.01, 0, dur * 0.22, vol * 0.07, delay, { attack: 0.003, cents: 4, side: side - 0.12 });
  };
  // Marimba: wood over a tube: the note, a bright partial two octaves up that dies at once, and the mallet.
  const marimba = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.003, cents: 4, side });
    tone('sine', f * 3.93, 0, Math.min(0.08, dur * 0.3), vol * 0.28, delay, { attack: 0.002, cents: 6, side: side + 0.1 });
    tone('sine', f * 9.2, 0, 0.025, vol * 0.05, delay, { attack: 0.001, side: side - 0.1 });
  };
  // Vibraphone: metal bars, a slow tremolo, ringing longer.
  const vibes = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.004, cents: 3, tremolo: 5.2, side });
    tone('sine', f * 4, 0, dur * 0.25, vol * 0.12, delay, { attack: 0.002, cents: 3, side: side + 0.15 });
  };
  // Kalimba: a tine under a thumb.
  const kalimba = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.003, cents: 4, side });
    tone('sine', f * 5.4, 0, 0.05, vol * 0.15, delay, { attack: 0.001, side });
  };
  // Music box: a comb's tooth, bright for an instant, then only the note.
  const musicBox = (f, dur, vol, delay = 0, side = 0) => {
    tone('sine', f, 0, dur, vol, delay, { attack: 0.002, cents: 3, side });
    tone('sine', f * 4, 0, 0.1, vol * 0.25, delay, { attack: 0.001, side: side + 0.1 });
  };
  // The clown's honk: a kazoo, a reed through a nasal filter, scooping up into the note.
  const honk = (f, dur, vol, delay = 0, side = 0) => tone('sawtooth', f * 0.97, f * 1.02, dur, vol, delay, { attack: 0.012, cut: 1700, vibrato: 14, side });
  // Wood: a tock, its knock, and the click of the strike.
  const tock = (f0, f1, vol, delay = 0) => {
    tone('sine', f0, f1, 0.07, vol, delay, { attack: 0.002, cents: 25 });
    tone('sine', f0 * 2.25, 0, 0.03, vol * 0.3, delay, { attack: 0.002, cents: 25 });
    hiss(2500, 2300, 0.014, vol * 0.3, 3, delay);
  };
  // Upright pizzicato bass: woody finger pluck transient + warm fundamental with slight acoustic scoop and body resonance.
  const uprightBass = (f, dur, vol, delay = 0, side = 0) => {
    tone('triangle', f * 0.992, f, dur, vol, delay, { attack: 0.008, cents: 3, side });
    tone('sine', f, 0, dur * 1.12, vol * 0.65, delay, { attack: 0.012, cents: 2, side });
    hiss(1100, 420, 0.022, vol * 0.16, 1.4, delay, 'bandpass', 0.06);
  };
  // Jazz ride cymbal ("spang-a-lang"): quiet metallic shimmer + two inharmonic bell partials, softly articulated.
  const ride = (vol, delay = 0, { accent = false, skip = false, side = 0.14 } = {}) => {
    const dur = skip ? 0.042 : accent ? 0.085 : 0.062;
    hiss(accent ? 8200 : 7600, skip ? 5600 : 5100, dur, vol, skip ? 2.8 : 2.2, delay, 'bandpass', 0.18);
    tone('sine', accent ? 3180 : 3020, 0, dur * 0.7, vol * (skip ? 0.14 : 0.22), delay, { attack: 0.002, cents: 14, side });
    tone('sine', accent ? 4680 : 4440, 0, dur * 0.45, vol * (skip ? 0.08 : 0.12), delay, { attack: 0.002, cents: 18, side: -side });
  };
  // Hi-hat chick on beats 2 & 4: crisp, short, high-passed brush closure.
  const hihatChick = (vol, delay = 0) => {
    hiss(7400, 6200, 0.028, vol, 2.6, delay, 'highpass', 0.12);
  };
  // A recorded take, through the same place as the voices, and through a filter that keeps its
  // register: the crack high, the grass in the middle, the floor under everything. False if none has arrived.
  const sample = (event, gain = 1, delay = 0, shape = null) => {
    const picked = pickSample(event);
    if (!picked) return false;
    const heard = shape || picked.shape;
    const src = audio.createBufferSource();
    src.buffer = picked.buf;
    src.playbackRate.value = 2 ** (jitter(20) / 1200);
    const g = audio.createGain();
    g.gain.value = picked.gain * gain * spread(0.05);
    src.connect(g);
    if (heard) {
      const flt = audio.createBiquadFilter();
      flt.type = heard.type;
      flt.frequency.value = heard.freq;
      flt.Q.value = heard.q ?? 0.7;
      g.connect(flt).connect(place(0));
    } else g.connect(place(0));
    src.start(t + delay);
    return true;
  };
  return { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, honk, tock, uprightBass, ride, hihatChick, sample };
}

/* ─── The land joins in: a run of good things fills the room's chord in, a fifth, then its third, then its colour ─── */

const pad = { voices: null, bass: null, out: null, tone: null, momentum: 0, at: 0, timer: 0, shown: 0, semis: null, root: 0 };
const PAD_VOICES = 4;
const WORTH = Object.freeze({ catch: 1, deft: 1, glass: 0.8, post: 0.8, ramp: 0.8, berry: 1, sweet: 1.2, share: 1.2, wonder: 1.5, bone: 0.8, wap: 1.4, pantry: 1.4, recipe: 1.6, pocket: 0.4, trick: 0.85, power_story: 1.0, furrow: 0.4 });
/** The room's chord, close and low (under the key's root), in four voices: where the voices start. */
const padTones = () => Array.from({ length: PAD_VOICES }, (_, i) => harmony.pcs[i % harmony.pcs.length] + 12 * Math.floor(i / harmony.pcs.length) - 12);
const pcOf = (semi) => ((Math.round(semi) % 12) + 12) % 12;
/** Where the four voices are now (semitones from the key's root). */
const padNow = () => pad.semis || padTones();

/* A chord changes the way a choir changes it: each voice goes to the nearest tone of the new chord that no
 * other voice has taken, and a tone nobody took is given to whoever doubles another and has least far to go.
 * `from` is where the voices are, in semitones from the present root. */
function leadVoices(from, pcs) {
  const options = [];
  for (let o = -24; o <= 12; o += 12) pcs.forEach((pc) => { const semi = pc + o; if (semi >= -19 && semi <= 5) options.push(semi); });
  if (!options.length) return padTones();
  const taken = new Set();
  const to = from.map((f) => {
    const free = options.filter((o) => !taken.has(o));
    const pool = free.length ? free : options;
    const best = pool.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
    taken.add(best);
    return best;
  });
  pcs.forEach((pc) => {
    if (to.some((semi) => pcOf(semi) === pc)) return;
    let who = -1;
    let where = 0;
    let cost = Infinity;
    to.forEach((semi, i) => {
      if (to.filter((x) => pcOf(x) === pcOf(semi)).length < 2) return;
      options.filter((o) => pcOf(o) === pc && !to.includes(o)).forEach((o) => {
        const c = Math.abs(o - from[i]);
        if (c < cost) { cost = c; who = i; where = o; }
      });
    });
    if (who >= 0) to[who] = where;
  });
  return to;
}

function ensurePad() {
  if (pad.voices) return;
  const b = ensureBus();
  const out = audio.createGain();
  out.gain.value = 0.0001;
  const tone = audio.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = 0;
  tone.frequency.value = 700;
  tone.connect(out);
  out.connect(b.input);
  const send = audio.createGain();
  send.gain.value = 0.7;
  out.connect(send).connect(b.air);
  // Each voice twice, a few cents apart, one either side and wider as they go up.
  pad.semis = padTones();
  pad.root = sound.root;
  pad.voices = pad.semis.map((semi, i) => [-1, 1].map((side) => {
    const osc = audio.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz(semi);
    osc.detune.value = side * 7;
    const g = audio.createGain();
    g.gain.value = 0.02 / (PAD_VOICES * 2);
    let node = osc.connect(g);
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner();
      p.pan.value = side * (0.35 + 0.12 * i);
      node = node.connect(p);
    }
    node.connect(tone);
    osc.start();
    return { osc, gain: g };
  }));
  pad.bass = audio.createOscillator();
  pad.bass.frequency.value = hz(bassLow());
  const bassLevel = audio.createGain();
  bassLevel.gain.value = 0.3;
  pad.bass.connect(bassLevel).connect(out);
  pad.bass.start();
  pad.out = out;
  pad.tone = tone;
}

/* The chord changes on the beat: the voices move together, each the least it can, and quickly (a change, not a
 * slide). Across a change of key the voices are first heard from the new root, so they still move by step. */
function retunePad() {
  if (!pad.voices || !audio) return;
  const now = audio.currentTime;
  const when = now + (placeAfter || clamp(toBeat(now), 0, 1.2));
  const moved = 12 * Math.log2((pad.root || sound.root) / sound.root);
  pad.semis = leadVoices(padNow().map((semi) => semi + moved), harmony.pcs);
  pad.root = sound.root;
  pad.semis.forEach((semi, i) => pad.voices[i].forEach(({ osc }) => osc.frequency.setTargetAtTime(hz(semi), when, 0.07)));
  pad.bass.frequency.setTargetAtTime(hz(bassLow()), when, 0.07);
  tunePadVoices(when, landQuality().stage);
}

/* The chord breathes with the bar: a little brighter as the bar opens, settling through it. Its level stays. */
function breathePad(t) {
  if (!pad.voices) return;
  const base = (600 + 2000 * landQuality().lift) * (sound.padTone || 1);
  pad.tone.frequency.setTargetAtTime(base * 1.45, t, 0.05);
  pad.tone.frequency.setTargetAtTime(base, t + 0.16, 0.45);
}

const holdAt = (param, now) => {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
};

/* The bed (Setup, Music: full): the pad never falls below a low floor, so the room's chord is always there. */
const bed = { on: false, level: 0.007 };
const floorOf = () => (bed.on ? bed.level : 0.0001);

/** How full the room is, from the run of good things still in the air. 0 quiet, 1 a fifth, 2 its third, 3 the colour. */
export function landQuality() {
  if (!pad.at) return { stage: 0, lift: 0, bed: bed.on };
  const now = audio ? audio.currentTime : pad.at;
  const m = pad.momentum * 0.5 ** ((now - pad.at) / 2.5);
  const stage = m >= 8 ? 3 : m >= 5 ? 2 : m >= 2.5 ? 1 : 0;
  return { stage, lift: clamp((m - 2) / 8, 0, 1), bed: bed.on && stage === 0 };
}

/* A voice is admitted as the run earns it. The bed, when it is on, already sings the whole chord. */
function admit(semi, stage) {
  if (bed.on) return 1;
  if (stage <= 0) return 0.02;
  const pc = ((semi % 12) + 12) % 12;
  const bassPc = ((harmony.bass % 12) + 12) % 12;
  const rootish = pc === 0 || pc === 7 || pc === bassPc || pc === (bassPc + 7) % 12;
  if (rootish) return 1;
  if (stage === 1) return 0.02;
  if (pc === (sound.minor ? 3 : sound.open ? 5 : 4)) return 1;
  return stage >= 3 ? 1 : 0.05;
}

function tunePadVoices(now, stage) {
  if (!pad.voices) return;
  padNow().forEach((semi, i) => {
    const open = admit(semi, stage) / (PAD_VOICES * 2);
    pad.voices[i].forEach(({ gain }) => gain.gain.setTargetAtTime(open, now, 0.28));
  });
}

/* The moment a new part of the chord is allowed in, it is struck once, so the ear hears the quality arrive. */
function bloomStage(now, stage) {
  if (stage <= pad.shown) return;
  const prev = pad.shown;
  pad.shown = stage;
  try {
    const fresh = padNow().filter((semi) => admit(semi, stage) > 0.5 && admit(semi, prev) <= 0.5);
    const k = kit(outlet(0, { air: 0.4 }), now, 0);
    if (!fresh.length) k.tone('sine', hz(bassLow()), 0, 0.35, 0.028, 0, { attack: 0.03, cents: 0 });
    else fresh.forEach((semi, i) => k.celesta(hz(semi + 12), 0.42, 0.02, i * sixteenth()));
  } catch { /* the pad still rises */ }
}

export function setMusicBed(on) {
  bed.on = Boolean(on);
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  if (bed.on) {
    ensurePad();
    tunePadVoices(now, landQuality().stage);
    holdAt(pad.out.gain, now);
    pad.out.gain.setTargetAtTime(Math.max(bed.level, pad.out.gain.value), now, 0.8);
  } else if (pad.voices) {
    tunePadVoices(now, landQuality().stage);
    holdAt(pad.out.gain, now);
    pad.out.gain.setTargetAtTime(0.0001, now, 0.6);
    clearTimeout(pad.timer);
    pad.timer = setTimeout(stopPad, 9000);
  }
}

function swellPad(now, worth) {
  pad.momentum = pad.momentum * 0.5 ** ((now - pad.at) / 2.5) + worth;
  pad.at = now;
  if (pad.momentum < 2.5 && !pad.voices && !bed.on) return;
  ensurePad();
  const { stage, lift } = landQuality();
  tunePadVoices(now, stage);
  bloomStage(now, stage);
  holdAt(pad.out.gain, now);
  pad.out.gain.setTargetAtTime(Math.max(floorOf(), 0.0001 + 0.028 * lift), now, 0.5);
  pad.out.gain.setTargetAtTime(floorOf(), now + 1.5, 1.4);
  pad.tone.frequency.setTargetAtTime((600 + 2000 * lift + (sound.row || 0) * 70) * (sound.padTone || 1), now, 0.4);
  clearTimeout(pad.timer);
  pad.timer = setTimeout(stopPad, 9000);
}

/** A knock, or the spill, lets the chord go. */
function hushPad(now) {
  pad.momentum *= 0.3;
  pad.at = now;
  const stage = landQuality().stage;
  pad.shown = stage;
  if (!pad.voices) return;
  tunePadVoices(now, stage);
  holdAt(pad.out.gain, now);
  pad.out.gain.setTargetAtTime(floorOf(), now, 0.15);
}

function stopPad() {
  if (!pad.voices || bed.on) return;
  if (audio.currentTime - pad.at < 8) { pad.timer = setTimeout(stopPad, 3000); return; }
  pad.voices.flat().forEach(({ osc }) => osc.stop());
  pad.bass.stop();
  pad.out.disconnect();
  pad.voices = null;
  pad.semis = null;
  pad.shown = 0;
}

/* ─── A room says its chord ───────────────────────────────────────────── */

/* The chord's tones from its bass upward, as a hand would find them on strings. */
const roomTones = () => {
  const bassPc = ((harmony.bass % 12) + 12) % 12;
  const up = harmony.pcs.map((pc) => (pc < bassPc ? pc + 12 : pc)).sort((a, b) => a - b);
  return up.length < 3 ? [...up, up[0] + 12] : up;
};
let incipitAt = -9;

/** A room opens: on the next beat its bass, and its chord strummed once on plucked strings, far off and soft.
 *  Most rooms are strummed upward. Home (.) comes down onto its root. A room that asks (?) goes up and is
 *  left without its bass. Nothing is said while the chapter's own motif is still being played. */
function sayRoom() {
  try {
    if (!audio || audio.state !== 'running') return;
    const now = audio.currentTime;
    if (now > incipitAt - 0.6 && now < incipitAt + 2.4) return;
    const wait = clamp(toBeat(now), 0, 1.2);
    const heat = hear('room', now + wait);
    if (heat === null || heat > 1.6) return;
    const k = kit(outlet(heat, { depth: 0.3, air: 0.5, song: 0.22 }), now + wait, 0);
    const tones = harmony.sigil === '.' ? roomTones().reverse() : roomTones();
    const gap = sixteenth() / 2;
    const strumAt = (i) => (sound.jazz ? i * gap * (i % 2 ? 1.18 : 0.92) : i * gap);
    tones.forEach((semi, i) => k.pluck(hz(semi), 0.036 * (i === tones.length - 1 ? 1.15 : 1), strumAt(i)));
    if (harmony.sigil !== '?') k.tone('sine', hz(bassLow()), 0, 0.5, 0.034, harmony.sigil === '.' ? strumAt(tones.length - 1) : 0, { attack: 0.02, cents: 0 });
  } catch { /* the room opens all the same */ }
}

/* ─── The tilt, heard: steadiness is being in tune ────────────────────── */

/* Past the line where the carrier can no longer be poised, the pie's tilt is a tone: the fifth under the key's
 * root, low and soft, on the side the pie leans to. The further it tilts, the sharper the tone drifts and the
 * faster it trembles. As the pie settles it comes back into tune and is gone. A knock is out of key for an
 * instant; a tilt is out of tune for as long as it lasts. */
const tilt = { a: null, b: null, out: null, pan: null, level: 0, said: 0, timer: 0 };
const TILT_FROM = 0.62;

function stopTilt() {
  if (!tilt.out) return;
  if (tilt.level > 0 && audio.currentTime - tilt.said < 3) { tilt.timer = setTimeout(stopTilt, 3000); return; }
  tilt.level = 0;
  [tilt.a, tilt.b].forEach((osc) => { try { osc.stop(); } catch { /* already still */ } });
  tilt.out.disconnect();
  tilt.out = null;
}

/** How far the pie is tilting (0 steady, 1 about to go) and to which side (-1 to 1). Call it every frame while
 *  the carry runs: a tilt that stops being said (a pause, a card, the end) fades by itself in under a second. */
export function setSoundTilt(wobble = 0, dir = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const w = clamp((wobble - TILT_FROM) / (1 - TILT_FROM), 0, 1);
    if (!w && !tilt.level) return;
    const now = audio.currentTime;
    if (Math.abs(w - tilt.level) < 0.04 && w > 0 && now - tilt.said < 0.2) return;
    tilt.said = now;
    if (!tilt.out) {
      const b = ensureBus();
      tilt.out = audio.createGain();
      tilt.out.gain.value = 0.0001;
      tilt.a = audio.createOscillator();
      tilt.b = audio.createOscillator();
      const half = audio.createGain();
      half.gain.value = 0.5;
      tilt.a.connect(half);
      tilt.b.connect(half);
      let node = half.connect(tilt.out);
      if (audio.createStereoPanner) {
        tilt.pan = audio.createStereoPanner();
        node = node.connect(tilt.pan);
      }
      node.connect(b.input);
      const send = audio.createGain();
      send.gain.value = 0.3;
      node.connect(send).connect(b.air);
      tilt.a.start();
      tilt.b.start();
    }
    const f = hz(-5) * 2 ** ((70 * w) / 1200);
    tilt.a.frequency.setTargetAtTime(f, now, 0.12);
    tilt.b.frequency.setTargetAtTime(f + 1.5 + 5.5 * w, now, 0.12);
    holdAt(tilt.out.gain, now);
    tilt.out.gain.setTargetAtTime(w ? 0.004 + 0.022 * w ** 1.5 : 0.0001, now, w > tilt.level ? 0.08 : 0.25);
    tilt.out.gain.setTargetAtTime(0.0001, now + 0.6, 0.2);
    tilt.pan?.pan.setTargetAtTime(clamp(dir, -1, 1) * 0.3, now, 0.15);
    tilt.level = w;
    clearTimeout(tilt.timer);
    tilt.timer = setTimeout(stopTilt, 4000);
  } catch { /* the pie tilts all the same */ }
}

/* ─── Rhythm and theme: the land's rhythms, the found moment, a chapter's motif, Boof's three notes ─── */

/** One voice of a rhythm at a moment: each a soft thing, in the room's chord where it is pitched, contoured by its step in the bar. */
function rhythmVoice(k, voice, strong, vol, delay = 0, { step = 0, interlock = 'primary' } = {}) {
  const { tone, hiss, celesta, marimba, vibes, kalimba, musicBox, honk, tock } = k;
  const s = ((Number(step) || 0) % 16 + 16) % 16;
  const beatIdx = Math.floor(s / 4);
  const offSixteenth = s % 2 === 1;
  const offEighth = s % 4 === 2;
  const harmShift = interlock === 'complement' ? 2 : interlock === 'answer' ? 1 : 0;
  const stepDeg = (strong ? [0, 2, 1, 3][beatIdx] : offEighth ? 3 : offSixteenth ? 4 : 2) + harmShift;
  const durMul = offSixteenth ? 0.72 : offEighth ? 0.88 : 1;
  switch (voice) {
    case 'kalimba': kalimba(hz(sungTone(stepDeg)), 0.25 * durMul, 0.034 * vol, delay); break;
    case 'shaker': hiss(offSixteenth ? 7200 : 6200, offSixteenth ? 5400 : 4600, 0.045 * durMul, 0.026 * vol, 2.2, delay, 'bandpass', strong ? 0.22 : 0.14); break;
    case 'marimba': marimba(hz(sungTone(strong ? (beatIdx % 2 === 0 ? 0 : 2) + harmShift : stepDeg)), 0.25 * durMul, 0.042 * vol, delay); break;
    case 'glass': celesta(hz(sungTone(stepDeg + 2) + 12), 0.3 * durMul, 0.022 * vol, delay); break;
    case 'vibes': vibes(hz(sungTone(stepDeg + 1)), 0.35 * durMul, 0.03 * vol, delay); break;
    case 'drip': tone('sine', strong ? 1500 : offEighth ? 1360 : 1220, strong ? 720 : 610, 0.06 * durMul, 0.03 * vol, delay, { attack: 0.002 }); break;
    case 'honk': honk(hz(sungTone(stepDeg)), 0.08 * durMul, 0.034 * vol, delay); break;
    case 'bass': tone('sine', hz(bassLow() + (strong ? 0 : beatIdx === 3 ? 7 : 5)), 0, 0.3 * durMul, 0.075 * vol, delay, { attack: 0.01, cents: 0 }); break;
    case 'musicbox': musicBox(hz(sungTone(stepDeg + 2) + 12), 0.3 * durMul, 0.026 * vol, delay); break;
    default: tock(strong ? 620 : offEighth ? 690 : 760, strong ? 440 : 530, 0.06 * vol, delay); break;
  }
}

/* The bar has a metric shape: downbeats (0, 8) and backbeats (4, 12 — lifted in swing/jazz) anchor the bar,
 * eighth-note offbeats (2, 6, 10, 14) lean forward when swung, and off-sixteenths ghost softly. */
const placeInBar = (step, { swing = sound.swing || 0.5, jazz = sound.jazz } = {}) => {
  const s = ((Number(step) || 0) % 16 + 16) % 16;
  const swung = jazz || swing > 0.53;
  if (s === 0) return 1.04;
  if (s === 8) return 0.98;
  if (s === 4 || s === 12) return swung ? 1.02 : 0.94;
  if (s % 2 === 0) return swung ? 0.91 : 0.86;
  return swung && (s === 7 || s === 15) ? 0.84 : 0.74;
};

/** A hit of a rhythm, `in` seconds from now (the conductor says a step a moment before it falls, so the hit is
 *  placed on the audio clock): found (groove) under the carry, louder as the chord fills in; or the land
 *  keeping it softly in its room (whisper), farther off and more of the room. */
export function rhythmHit({ voice = 'tock', strong = false, level = 1, whisper = false, pan = 0, step = 0, interlock = 'primary', in: wait = 0 } = {}) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audioNow() + 0.005 + clamp(Number(wait) || 0, 0, 0.5);
    if (!whisper && t < sound.rest) return;   // a mime is passing: the groove rests; a rhythm still to be found keeps its whisper
    const heat = hear(`${whisper ? 'whisper' : 'groove'}:${voice}:${interlock}`, t);
    if (heat === null) return;
    const lift = whisper ? 0.55 : clamp(0.54 + pad.momentum / 12, 0.54, 1.05);
    const stepPan = pan + (interlock === 'answer' ? 0.22 : interlock === 'complement' ? -0.18 : 0) + ((step % 4) - 1.5) * 0.04;
    const k = kit(outlet(heat * 0.28, { depth: whisper ? 0.55 : 0.14, air: whisper ? 0.55 : 0.22 }), t, clamp(stepPan + jitter(0.05), -0.85, 0.85));
    rhythmVoice(k, voice, strong, level * lift * (strong ? 1 : 0.74) * placeInBar(step), 0, { step, interlock });
  } catch { /* a rhythm kept silently is still kept */ }
}

/** A rhythm found: its bar played through, a little quicker, then the chapter's motif on a music box. */
export function rhythmFound(rhythm) {
  try {
    if (!audio || audio.state !== 'running' || !rhythm) return;
    const t = audio.currentTime + 0.02;
    const s = sixteenth() * 0.8;
    const k = kit(outlet(0, { air: 0.35 }), t, 0);
    rhythm.hits.forEach((h) => rhythmVoice(k, rhythm.voice, rhythm.steps[h] === 'X', 1.3, h * s, { step: h }));
    const after = 16 * s + 0.05;
    (sound.motif || [0, 4, 7, 12]).forEach((semi, i, all) => k.musicBox(hz(fallen(semi) + 12), i === all.length - 1 ? 0.8 : 0.35, 0.04, after + i * s * 2, (i - 1.5) * 0.12));
  } catch { /* found, if unheard */ }
}

/* One cell of the shared form, per chapter, taken from the rhythm that chapter already keeps
 * (.spw/runtime/pie-levels.spw). A chapter not listed sings the shared progression. */
export const LEVEL_CELLS = Object.freeze({
  2: Object.freeze({ id: 'late_echo', bridge: 'backdoor' }),          // the grove answers a beat late
  6: Object.freeze({ id: 'threes', comp: 'charleston' }),                 // the glass rings in threes
  7: Object.freeze({ id: 'uneven_oath', harmony: 'swing_only' }),         // counted never quite even; the swing is the behavior
  9: Object.freeze({ id: 'missing_ninth', turnaround: 'withhold' }),      // eight honks, and a warm place where the ninth should be
  10: Object.freeze({ id: 'three_in_four', rising: 'pedal' }),             // three long beats: the pedal holds, the walk waits
  11: Object.freeze({ id: 'early_bloom', guide: 'anticipate' }),           // every hit a little before the beat
  12: Object.freeze({ id: 'two_currents', rising: 'complement' }),         // two currents, each keeping its own name
  14: Object.freeze({ id: 'one_beat', turnaround: 'single' }),             // one beat to the bar, and the rest of the week missing
  15: Object.freeze({ id: 'three_knocks', turnaround: 'tries' })           // knocked three ways; the third lands
});
/* A foreshadow's parked degree, in the scale and never the root. The same id is always the same degree. */
const DEBT_PCS = Object.freeze([2, 4, 5, 7, 9]);
const debtPc = (degree) => DEBT_PCS[(Math.round(Number(degree) || 1) - 1 + DEBT_PCS.length) % DEBT_PCS.length];
/** Step a downbeat off a parked degree. The degree stays in the scale; it just may not be the note the bar stands on. */
const offDebt = (semi, degree) => {
  if (degree == null) return semi;
  const pc = ((semi % 12) + 12) % 12;
  if (pc !== debtPc(degree)) return semi;
  return semi + 2;
};

/**
 * Four-movement harmonic progression through a chapter (`0..1` progress):
 *   1. opening    (< 0.25)  grounded pedal & exposition
 *   2. rising     (< 0.55)  walking subdominant/supertonic motion & motif answer
 *   3. bridge     (< 0.82)  mediant/submediant expansion & counter-voice
 *   4. turnaround (>= 0.82) ii–V–I cadential drive toward the chapter door
 * With a chapter, that chapter owns one cell of the form (LEVEL_CELLS), taken from the rhythm its level already keeps.
 * Without one, every chapter shares this progression, as it always has.
 * @param {{ progress?: number, bar?: number, step?: number, stage?: number, chapter?: number }} [opts]
 */
export function chapterArcPlan({ progress = 0, bar = 0, step = 0, stage = 1, chapter = 0 } = {}) {
  const p = clamp(Number(progress) || 0, 0, 1);
  const inPhrase = ((Math.floor(Number(bar) || 0) % 4) + 4) % 4;
  const movement = p < 0.25 ? 'opening' : p < 0.55 ? 'rising' : p < 0.82 ? 'bridge' : 'turnaround';
  const cell = LEVEL_CELLS[Math.floor(Number(chapter) || 0)] || null;
  let bassCycle = movement === 'opening'
    ? [0, 0, 0, 5]
    : movement === 'rising'
      ? [0, 5, 2, 7]
      : movement === 'bridge'
        ? [-3, 5, 4, 7]
        : [2, 7, 0, 7];
  let guideCycle = movement === 'opening'
    ? [4, 4, 3, 2]
    : movement === 'rising'
      ? [4, 5, 2, 11]
      : movement === 'bridge'
        ? [3, 9, 8, 11]
        : [5, 11, 4, 9];
  const pedalHolds = Boolean(cell?.rising === 'pedal' && movement === 'rising');
  const withhold = Boolean(cell?.turnaround === 'withhold' && movement === 'turnaround');
  const single = Boolean(cell?.turnaround === 'single' && movement === 'turnaround');
  const tries = Boolean(cell?.turnaround === 'tries' && movement === 'turnaround');
  const complement = Boolean(cell?.rising === 'complement' && (movement === 'rising' || movement === 'bridge'));
  const anticipate = Boolean(cell?.guide === 'anticipate');
  if (cell?.bridge === 'backdoor' && movement === 'bridge') bassCycle = [0, 10, 5, 0];
  if (pedalHolds) bassCycle = [0, 0, 0, 5];
  if (withhold) bassCycle = [2, 7, 7, 2];
  if (single) { bassCycle = [0, 0, 0, 0]; guideCycle = [4, 4, 4, 4]; }
  if (tries) bassCycle = [2, 7, 5, 0];
  const bassOffset = bassCycle[inPhrase];
  const guideToneOffset = guideCycle[inPhrase];
  const turnOffset = step === 12 ? (movement === 'turnaround' ? 2 : 7) : (movement === 'bridge' ? 4 : -5);
  const motifForm = movement === 'opening' ? 'prime' : movement === 'rising' ? 'answer' : movement === 'bridge' ? 'inversion' : 'resolve';
  const harmonyRole = movement === 'opening' ? 'tonic_pedal' : movement === 'rising' ? 'subdominant_walk' : movement === 'bridge' ? 'mediant_bridge' : 'cadential_ii_V_I';
  let motifDeg = (step === 8 && stage >= 2 && movement !== 'opening')
    ? (movement === 'rising' ? (inPhrase % 2 ? 2 : 1) : movement === 'bridge' ? 3 + (inPhrase % 2) : 4)
    : (step === 12 && stage >= 2 && movement === 'turnaround')
      ? 5
      : null;
  if (withhold || single) motifDeg = null;
  return {
    movement,
    inPhrase,
    bassOffset,
    guideToneOffset,
    turnOffset,
    motifForm,
    harmonyRole,
    motifDeg,
    cell: cell?.id || '',
    pedalHolds,
    withhold,
    single,
    tries,
    complement,
    anticipate,
    volMul: movement === 'turnaround' ? 1.15 : movement === 'bridge' ? 1.08 : 1
  };
}

/* ─── One jazz vocabulary for the land, the spells, the cast and the things in the road ───
 * Each style is a way of leaning: the comping it voices (semitones over the bass), whether its line encloses a
 * landing (approaches it from a semitone off), how far it sits behind the beat, and the bass's passing tone
 * (`pass`; null walks by the phrase: a semitone under on the fourth bar, else the fifth). The land's phrasing
 * (jazzPhrasePlan) picks one from the pie's balance or the court it is in; a gesture (a spell's story, a dodged
 * obstacle, a trick, a character) names its lean, and inflectGesture plays it in that style. */
export const JAZZ_STYLES = Object.freeze({
  poised_69: Object.freeze({ voicing: [4, 7, 9, 14], enclosure: false, layback: 0.014, pass: null, approach: -1 }),       // at ease: a six-nine, laid back
  enclosure: Object.freeze({ voicing: [3, 7, 10, 14], enclosure: true, layback: 0.004, pass: 6, approach: 1 }),           // searching: lands by surrounding the note
  altered_dominant: Object.freeze({ voicing: [4, 8, 10, 13], enclosure: true, layback: 0.004, pass: 1, approach: 1 }),    // tipping: flat nine, sharp five, wants home
  lydian_court: Object.freeze({ voicing: [4, 6, 9, 14], enclosure: false, layback: 0.014, pass: null, approach: -1 }),    // Boon: the sharp eleven, bright and unhurried
  bebop_bite: Object.freeze({ voicing: [1, 6, 10, 13], enclosure: true, layback: 0.004, pass: 1, approach: 1 }),          // Bane: the semitone that bites, on the beat
  open_quartal: Object.freeze({ voicing: [5, 10, 14, 19], enclosure: false, layback: 0.009, pass: 7, approach: -2 }),     // Bone: stacked fourths, load-bearing, no third
  backdoor_cadence: Object.freeze({ voicing: [3, 7, 10, 14], enclosure: false, layback: 0.012, pass: 10, approach: -2 }), // Turn/Memory: flat-VII nine resolving warmly home
  upper_structure: Object.freeze({ voicing: [6, 9, 11, 16], enclosure: true, layback: 0.008, pass: 6, approach: 2 })      // Payoff/Bracework: polychordal triad over shell
});
/* Who leans which way. The three courts first; spells by the role their story plays (powerStoryPlan); tricks by
 * what they do; the cast by the themes they already have; trope stages by how far a trope has come; collectible
 * syntax wonders by their almanac kind. Anything unnamed is at ease. */
export const JAZZ_LEANS = Object.freeze({
  boon: 'lydian_court', bane: 'bebop_bite', bone: 'open_quartal',
  lag: 'poised_69', lit: 'lydian_court', unkept: 'enclosure', echoes: 'poised_69', honk: 'bebop_bite', true_aim: 'enclosure', settle: 'open_quartal', glimpse: 'lydian_court',
  hop_clear: 'enclosure', apex: 'poised_69', mime_glass: 'altered_dominant', pierce: 'bebop_bite', shield_hold: 'open_quartal', frill_catch: 'poised_69', unkept_pass: 'enclosure', bank_score: 'altered_dominant',
  genie: 'lydian_court', clerk: 'bebop_bite', bonewap: 'open_quartal', boof: 'poised_69',
  seed: 'poised_69', hint: 'enclosure', named: 'lydian_court', turned: 'backdoor_cadence', paid: 'upper_structure',
  creature: 'lydian_court', antique: 'backdoor_cadence', artifact: 'open_quartal', contrivance: 'bebop_bite', bracework: 'upper_structure', saying: 'poised_69',
  story_word: 'poised_69', story_mark: 'enclosure', story_feed: 'lydian_court', story_ask: 'backdoor_cadence', room_cast: 'upper_structure',
  // A shelf's chain, by the link it has just fired (valence-shelves.mjs CHAINS). Bonk and honk are crossings, not styles of their own.
  court: 'lydian_court', clowns: 'lydian_court', wap: 'upper_structure',
  scheme: 'bebop_bite', march: 'bebop_bite', mimes: 'bebop_bite',
  receipt: 'open_quartal', frame: 'open_quartal', dividers: 'open_quartal',
  mimewall: 'altered_dominant', grudge: 'altered_dominant',
  echo: 'backdoor_cadence', rhythm: 'lydian_court',
  easter_egg: 'poised_69', theme_flourish: 'lydian_court', egg_warmth: 'lydian_court',
  pi: 'poised_69', golden: 'lydian_court', shepard: 'open_quartal', boof_perk: 'poised_69', genie_wish: 'lydian_court'
});
/* Where a fired link leans the next bar: bonk into bane's semitone, honk into boon, bone putting a tension down. */
const MOTIVATION_FEEDS = Object.freeze({
  mimewall: 'bane', grudge: 'bane', echo: 'boon', rhythm: 'boon', receipt: 'clear', frame: 'clear', dividers: 'clear'
});
const SCHEMES_END = 12;
/** @param {string} lean a court, a spell's story role, a trick, or a character id */
export const jazzStyleFor = (lean) => (JAZZ_STYLES[lean] ? lean : JAZZ_LEANS[lean] || 'poised_69');

/** How far a gesture leans in jazz feel: 0 written, 1 as jazz has it (gestures take the jazz chord through the
 *  room, nothing more), up to 2, where they approach their landing note and sit back. (Setup: Characters, jazz_lean.) */
const jazzLean = () => (sound.jazz ? musical.jazzLean : 0);

/**
 * A gesture played in its lean's style, past plain jazz: the landing note (the last on a chord tone) is approached
 * from the style's side by a quick grace note, and the whole gesture sits back by the style's layback. At an
 * amount of 1 or less the notes come back as they were: the written feel and plain jazz sound as they always have.
 * Notes are in renderNotes' terms (`deg` a chord tone, `octave` and `semi` semitones, `at` seconds).
 * @template {{ deg?: number, bass?: number, octave?: number, semi?: number, at: number, dur: number, vol: number, voice?: string, side?: number }} N
 * @param {N[]} notes
 * @param {{ lean?: string, amount?: number }} [opts]
 * @returns {(N & { semi?: number })[]}
 */
export function inflectGesture(notes, { lean = '', amount = 0 } = {}) {
  const extra = clamp((Number(amount) || 0) - 1, 0, 1);
  if (!extra || !notes?.length) return notes;
  const spec = JAZZ_STYLES[jazzStyleFor(lean)];
  const sit = spec.layback * 2 * extra;
  let land = -1;
  notes.forEach((n, i) => { if (n.deg != null && (land < 0 || n.at >= notes[land].at)) land = i; });
  const grace = 0.045 * extra;
  const out = notes.map((n, i) => ({ ...n, at: n.at + sit + (i === land ? grace : 0) }));
  if (land >= 0) {
    const to = notes[land];
    out.push({ ...to, semi: (to.semi || 0) + spec.approach, at: to.at + sit, dur: 0.06, vol: to.vol * 0.55 });
    if (spec.enclosure && extra >= 0.5) out.push({ ...to, semi: (to.semi || 0) - spec.approach, at: to.at + sit + grace * 0.5, dur: 0.05, vol: to.vol * 0.45 });
  }
  return out.sort((a, b) => a.at - b.at);
}

/**
 * Pure rootless voice-led jazz comping plan: transposes `compSemis` over the bar's `bassOffset`,
 * adapts to `minor`/`open` mode, folds into the warm mid-register `[0, 16]`, and voice-leads
 * smoothly from `prevVoicing` (minimal semitone motion, Bill Evans A/B rootless form style).
 * Keeps a `parked` foreshadow scale degree off the top voice until its paying chapter.
 * @param {{ bassOffset?: number, compSemis?: number[], minor?: boolean, open?: boolean, prevVoicing?: number[] | null, parked?: number | null }} [opts]
 * @returns {number[]}
 */
export function compVoicingPlan({ bassOffset = 0, compSemis = [4, 7, 9, 14], minor = false, open = false, prevVoicing = null, parked = null } = {}) {
  const bass = Number(bassOffset) || 0;
  const modal = (pc) => (minor ? (FALLS[pc] ?? pc) : open ? (RAISES[pc] ?? pc) : pc);
  const rawPcs = [...new Set((compSemis || [4, 7, 9]).map((s) => modal(((bass + s) % 12 + 12) % 12)))];
  const foldIn = (pc, anchor) => {
    const candidates = [pc, pc + 12, pc - 12].filter((x) => x >= 0 && x <= 16);
    if (!candidates.length) return clamp(pc, 0, 16);
    if (anchor == null) return candidates[0];
    return candidates.reduce((best, c) => (Math.abs(c - anchor) < Math.abs(best - anchor) ? c : best), candidates[0]);
  };
  let voiced;
  if (Array.isArray(prevVoicing) && prevVoicing.length) {
    const used = new Set();
    voiced = rawPcs.map((pc, idx) => {
      const anchor = prevVoicing[Math.min(idx, prevVoicing.length - 1)];
      let note = foldIn(pc, anchor);
      if (used.has(note)) {
        const alt = [pc, pc + 12].find((x) => x >= 0 && x <= 16 && !used.has(x));
        if (alt != null) note = alt;
      }
      used.add(note);
      return note;
    }).sort((a, b) => a - b);
  } else {
    voiced = rawPcs.map((pc, idx) => {
      const base = idx === 0 && pc > 9 ? pc - 12 : pc;
      return clamp(base < 0 ? base + 12 : base, 0, 16);
    }).sort((a, b) => a - b);
  }
  if (parked != null && voiced.length) {
    const parkedPc = debtPc(parked);
    const topIdx = voiced.length - 1;
    if (((voiced[topIdx] % 12) + 12) % 12 === parkedPc) {
      voiced[topIdx] = clamp(voiced[topIdx] + 2, 0, 16);
      voiced.sort((a, b) => a - b);
    }
  }
  return voiced;
}

/**
 * Pure 4-beat target-driven jazz walking bass plan connecting this bar's chord root (`bassOffset`)
 * to the next bar's chord root (`nextBass`), with chromatic/dominant beat-4 approach tones.
 * Respects level cells (`pedalHolds`, `withhold`, `single`) and harmonic debts (`tritoneSub`, `backdoor`, `feeds`).
 * @param {{ progress?: number, bar?: number, chapter?: number, jazz?: boolean, minor?: boolean, tritoneSub?: boolean, backdoor?: boolean, feeds?: string, passOffset?: number | null }} [opts]
 * @returns {{ notes: number[], target: number, approach: 'chromatic_up' | 'chromatic_down' | 'tritone' | 'backdoor' | 'dominant' | 'pedal' | 'withhold' | 'single' }}
 */
export function walkingBassPlan({ progress = 0, bar = 0, chapter = 0, jazz = true, minor = false, tritoneSub = false, backdoor = false, feeds = '', passOffset = null } = {}) {
  const arc = chapterArcPlan({ progress, bar, step: 0, stage: 2, chapter });
  const nextArc = chapterArcPlan({ progress, bar: (Number(bar) || 0) + 1, step: 0, stage: 2, chapter });
  const root = arc.bassOffset;
  const target = nextArc.bassOffset;
  if (arc.single) return { notes: [0, 0, 0, 0], target, approach: 'single' };
  if (arc.pedalHolds) return { notes: [root, root, root, root], target, approach: 'pedal' };
  if (arc.withhold) return { notes: [root, root + (minor ? 3 : 4), root + 7, 7], target, approach: 'withhold' };
  const third = minor ? 3 : 4;
  const diff = target - root;
  const beat2 = diff > 2 ? root + 2 : diff < -2 ? root - 2 : root + third;
  const beat3 = diff === 0 ? root + 7 : Math.abs(target - (root + 7)) <= 5 ? root + 7 : target + (diff > 0 ? -2 : 2);
  let beat4;
  /** @type {'chromatic_up' | 'chromatic_down' | 'tritone' | 'backdoor' | 'dominant' | 'pedal' | 'withhold' | 'single'} */
  let approach = 'chromatic_up';
  if (tritoneSub || feeds === 'bane') {
    beat4 = target + 1;
    approach = 'tritone';
  } else if (backdoor) {
    beat4 = 10;
    approach = 'backdoor';
  } else if (feeds === 'clear') {
    beat4 = target + 7 > 11 ? target - 5 : target + 7;
    approach = 'dominant';
  } else if (!jazz) {
    beat4 = arc.turnOffset;
    approach = 'dominant';
  } else if (passOffset != null && (arc.inPhrase === 3 || arc.movement === 'turnaround')) {
    beat4 = passOffset === -1 ? target - 1 : passOffset === 1 ? target + 1 : target - 1;
    approach = beat4 > target ? 'chromatic_down' : 'chromatic_up';
  } else if (diff < 0) {
    beat4 = target + 1;
    approach = 'chromatic_down';
  } else {
    beat4 = target - 1;
    approach = 'chromatic_up';
  }
  return { notes: [root, beat2, beat3, beat4], target, approach };
}

/**
 * Pure rhythm-section density ducking under high-combo or dense activity runs:
 * gives the player's soloist line (catches, WAPs, tricks) breathing room while keeping the walking bass anchored.
 * @param {{ combo?: number, stage?: number, pace?: number | null, recentHeat?: number }} [opts]
 * @returns {{ compGain: number, rideGain: number, maxVoices: number, skipOffComp: boolean }}
 */
export function densityDuckFactor({ combo = 0, stage = 1, pace = null, recentHeat = 0 } = {}) {
  const c = Math.max(0, Number(combo) || 0);
  const h = Math.max(0, Number(recentHeat) || 0);
  const taut = pace == null ? 0.5 : clamp(Number(pace) > 1 ? Number(pace) / 9 : Number(pace), 0, 1);
  const pressure = clamp((Math.max(0, c - 2) * 0.065) + (h * 0.08) + (stage >= 3 ? 0.06 : 0) + (taut > 0.75 ? 0.05 : 0), 0, 0.45);
  const compGain = clamp(1 - pressure, 0.55, 1);
  const rideGain = clamp(1 - pressure * 0.85, 0.58, 1);
  const maxVoices = pressure >= 0.34 ? 2 : pressure >= 0.18 ? 3 : 4;
  return { compGain, rideGain, maxVoices, skipOffComp: pressure >= 0.38 };
}

/**
 * Multi-dimensional jazz phrasing plan reflecting balance (`wobble`), streak (`combo`),
 * pie fullness (`richness`), story court (`presence`), trope stage (`tropeStage`),
 * collectible wonder kind (`wonderKind`), wonder chain (`wonderChain`), and chapter `progress`.
 * A live chain link (`motivation`) outranks the court. A chapter number retires the clock's own
 * substitutions: the backdoor and the tritone belong to that chapter's cell, or to a debt
 * (an open bane link, a foreshadow at the turned rung), and from chapter 12 a wobble alone
 * cannot bring the bite back. With no chapter, the clock still owns them, as the checks grew up with.
 * @param {{ progress?: number, wobble?: number, combo?: number, richness?: number, presence?: string, step?: number, bar?: number, tropeStage?: string, wonderKind?: string, wonderChain?: number, chapter?: number, motivation?: string, pace?: number | null, foreshadow?: string, foreshadowChapters?: number[], motif?: number[], development?: string[] | null }} [opts]
 */
export function jazzPhrasePlan({ progress = 0, wobble = 0, combo = 0, richness = 0.5, presence = '', step = 0, bar = 0, tropeStage = '', wonderKind = '', wonderChain = 0, chapter = 0, motivation = '', pace = null, foreshadow = '', foreshadowChapters = [], motif = [0, 2, 4, 7], development = null } = {}) {
  const w = clamp(Number(wobble) || 0, 0, 1);
  const c = Math.max(0, Math.floor(Number(combo) || 0));
  const wc = Math.max(0, Math.floor(Number(wonderChain) || 0));
  const r = clamp(Number(richness) ?? 0.5, 0, 1);
  const p = clamp(Number(progress) || 0, 0, 1);
  const ch = Math.floor(Number(chapter) || 0);
  const inPhrase = ((Math.floor(Number(bar) || 0) % 4) + 4) % 4;
  const arc = chapterArcPlan({ progress: p, bar, step, stage: 2, chapter: ch });
  const cell = ch ? LEVEL_CELLS[ch] : null;
  const owed = foreshadow ? foreshadowPlan(foreshadow, { chapter: ch || 1, appearances: foreshadowChapters, movement: arc.movement }) : null;
  const motivated = Boolean(motivation && JAZZ_LEANS[motivation]);
  const clock = !ch;
  const debtBite = Boolean(owed?.turned || presence === 'bane' || (motivated && (jazzStyleFor(motivation) === 'bebop_bite' || jazzStyleFor(motivation) === 'altered_dominant')));
  let style = motivated
    ? jazzStyleFor(motivation)
    : (presence === 'boon' || presence === 'bane' || presence === 'bone')
      ? jazzStyleFor(presence)
      : tropeStage && JAZZ_LEANS[tropeStage]
        ? jazzStyleFor(tropeStage)
        : wc >= 3 && !ch
          ? 'upper_structure'
          : wonderKind && JAZZ_LEANS[wonderKind]
            ? jazzStyleFor(wonderKind)
            : cell?.harmony === 'swing_only'
              ? 'poised_69'
              : w >= 0.58 && (clock || debtBite)
                ? 'altered_dominant'
                : w >= 0.22
                  ? 'enclosure'
                  : clock && p >= 0.82 && inPhrase === 3
                    ? 'upper_structure'
                    : (clock || cell?.bridge === 'backdoor' || owed?.turned) && p >= 0.55 && p < 0.82 && inPhrase === 1
                      ? 'backdoor_cadence'
                      : owed?.turned && p >= 0.82 && inPhrase === 3
                        ? 'upper_structure'
                        : 'poised_69';
  const earnedBite = debtBite || motivated;
  if (ch >= SCHEMES_END && !earnedBite && (style === 'bebop_bite' || style === 'altered_dominant')) style = 'poised_69';
  const spec = JAZZ_STYLES[style];
  const taut = pace == null ? null : clamp(Number(pace) > 1 ? Number(pace) / 9 : Number(pace), 0, 1);
  let voiceCount = r >= 0.72 || c >= 3 || wc >= 2 ? 4 : r >= 0.42 || c >= 1 ? 3 : 2;
  if (taut != null && taut >= 0.75) voiceCount = Math.min(4, voiceCount + 1);
  if (taut != null && taut <= 0.25) voiceCount = Math.max(2, voiceCount - 1);
  const feeds = MOTIVATION_FEEDS[motivation] || '';
  if (feeds === 'clear') voiceCount = Math.max(2, voiceCount - 1);
  const compSemis = spec.voicing.slice(0, voiceCount);
  if (wc >= 2 && !compSemis.includes(14)) compSemis.push(14);
  if (wc >= 4 && !compSemis.includes(21)) compSemis.push(21);
  const charleston = cell?.comp === 'charleston'
    ? (step === 0 || step === 6 || step === 10)
    : step === 0 || (step === 6 && (c >= 1 || wc >= 2 || r >= 0.5 || p >= 0.5 || inPhrase === 2));
  const walkingPass = step === 10 || step === 14;
  const tritoneSub = Boolean((clock && p >= 0.82 && inPhrase === 3) || (!clock && debtBite && p >= 0.82 && inPhrase === 3));
  const backdoor = Boolean((clock && p >= 0.55 && p < 0.82 && inPhrase === 1) || (cell?.bridge === 'backdoor' && arc.movement === 'bridge' && inPhrase === 1) || (owed?.turned && arc.movement === 'bridge' && inPhrase === 1));
  let passOffset = tritoneSub ? 1 : backdoor ? 10 : (spec.pass ?? (inPhrase === 3 ? -1 : 7));
  if (feeds === 'bane') passOffset = 1;
  if (feeds === 'clear' && (passOffset === 1 || passOffset === -1)) passOffset = 7;
  if (arc.withhold) passOffset = 7;
  const parked = owed && !owed.mayLand ? owed.degree : null;
  const landing = owed?.mayLand ? owed.degree : null;
  const walkLine = walkingBassPlan({ progress: p, bar, chapter: ch, jazz: true, tritoneSub, backdoor, feeds, passOffset });
  const compVoicing = compVoicingPlan({ bassOffset: arc.bassOffset, compSemis, parked });
  const motifPlan = motifMemoryPlan({ motif, development, bar, guideTone: arc.guideToneOffset, parked, landing: landing == null ? null : debtPc(landing) });
  const duck = densityDuckFactor({ combo: c, stage: r >= 0.72 ? 3 : r >= 0.42 ? 2 : 1, pace: taut });
  return {
    style,
    compSemis,
    compVoicing,
    walkLine,
    duck,
    enclosure: spec.enclosure,
    layback: spec.layback,
    charleston,
    walkingPass,
    passOffset,
    tritoneSub,
    backdoor,
    guideTone: arc.guideToneOffset,
    motifForm: motifPlan.form,
    motif: motifPlan,
    developmentForm: arc.motifForm,
    blueSlide: c >= 2 || p >= 0.55,
    cell: arc.cell,
    feeds,
    parked,
    landing
  };
}

/**
 * Pure 16-step beat-pocket plan for a bar: models downbeat/half-bar bass pulse, 4-beat walking bass,
 * backbeat (beats 2 & 4), swung ride/shaker subdivisions, and bar-4 phrase pickup fills.
 * @param {{ step?: number, bar?: number, progress?: number, stage?: number, swing?: number, jazz?: boolean, ground?: string, combo?: number, bedOn?: boolean, chapter?: number }} [opts]
 */
export function beatPocketPlan({ step = 0, bar = 0, progress = 0, stage = 1, swing = 0.5, jazz = false, ground = 'city', combo = 0, bedOn = false, chapter = 0 } = {}) {
  const s = ((Math.floor(Number(step) || 0) % 16) + 16) % 16;
  const arc = chapterArcPlan({ progress, bar, step: s, stage, chapter });
  const swung = Boolean(jazz || (Number(swing) || 0.5) > 0.53);
  const active = Boolean(bedOn || stage >= 1 || combo >= 1);
  let walkingBass = Boolean(active && (s === 0 || s === 8 || ((s === 4 || s === 12) && (jazz || arc.movement === 'rising' || arc.movement === 'bridge' || arc.movement === 'turnaround'))));
  const walkStepOffsets = [arc.bassOffset, arc.bassOffset + 4, arc.bassOffset + 7, arc.turnOffset];
  const bassSemi = walkStepOffsets[Math.floor(s / 4)] ?? arc.bassOffset;
  let backbeat = Boolean(active && (s === 4 || s === 12));
  let ridePing = Boolean((stage >= 1 || bedOn || combo >= 2) && (
    swung
      ? (s === 0 || s === 4 || s === 7 || s === 8 || s === 12 || s === 15)
      : (s === 2 || s === 6 || s === 10 || s === 14)
  ));
  let pickupFill = Boolean(active && arc.inPhrase === 3 && (s === 14 || s === 15));
  if (arc.pedalHolds) walkingBass = s === 0 || s === 8;
  const spare = Boolean(arc.single);
  if (spare) {
    walkingBass = s === 0;
    backbeat = false;
    ridePing = false;
    pickupFill = false;
  }
  return {
    step: s,
    beatIndex: Math.floor(s / 4),
    inPhrase: arc.inPhrase,
    movement: arc.movement,
    swung,
    walkingBass,
    bassSemi,
    backbeat,
    backbeatStrong: s === 12,
    ridePing,
    rideOffbeat: s === 7 || s === 15 || s % 4 === 2,
    pickupFill,
    spare,
    cell: arc.cell,
    percussionVoice: ground === 'field' ? 'wood' : 'brush'
  };
}

/* The lanes' own pulse, so a chain that completes while they are running can wait for bar 4.
 * An audition that never pulses plays the cadence at once. */
let pulseSeen = -9;
let pendingCadence = null;
/** Last voice-led jazz comping chord, so consecutive bars move smoothly by step or common tone. */
let lastCompVoicing = null;
/** A downbeat, steered off a parked foreshadow, or onto one the paying chapter is allowed to land. */
function downbeatBass(semi, { jz = null, arc = null, step = 0 } = {}) {
  let out = semi;
  if (jz?.parked != null && (step === 0 || step === 8)) out = offDebt(out, jz.parked);
  if (jz?.landing != null && step === 0 && arc?.movement === 'turnaround' && arc?.inPhrase === 3) {
    const want = debtPc(jz.landing);
    const pc = ((out % 12) + 12) % 12;
    let up = (want - pc + 12) % 12;
    if (up > 6) up -= 12;
    out += up;
  }
  return out;
}

/** Play a voice-led rootless jazz comping stab, tapered by voice height and density ducking. */
function playJazzComp(k, jz, arc, duck, { dur = 0.2, gain = 1, roll = 0.008 } = {}) {
  if (!jz || !k) return;
  const voiced = compVoicingPlan({
    bassOffset: arc.bassOffset,
    compSemis: jz.compSemis,
    minor: sound.minor,
    open: sound.open,
    prevVoicing: lastCompVoicing,
    parked: jz.parked
  });
  lastCompVoicing = voiced;
  const count = Math.min(voiced.length, Math.max(2, duck.maxVoices));
  const tones = voiced.slice(0, count);
  const center = (tones.length - 1) / 2;
  tones.forEach((semi, idx) => {
    const taper = idx < 2 ? 1 : idx === 2 ? 0.86 : 0.72;
    k.vibes(hz(semi + 12), dur, 0.014 * gain * duck.compGain * taper, jz.layback + idx * roll, (idx - center) * 0.14);
  });
}

/** The land's bass, beat pocket, and chapter progression, step by step. Bars come in fours, evolving across the
 *  chapter's four movements (opening pedal -> rising walk -> bridge expansion -> cadential turnaround toward the door),
 *  keeping a warm heartbeat on 1 & 3, a brushed/wood backbeat on 2 & 4, swung ride/shaker subdivisions, and in
 *  jazz feel adding voice-led Charleston comping, target-driven upright walking bass, ride spang-a-lang, hi-hat
 *  chicks on 2 & 4, and combo density ducking. */
export function landPulse({ step = 0, bar = 0, in: wait = 0, progress = 0, wobble = 0, combo = 0, richness = 0.5, presence = '', tropeStage = '', wonderKind = '', wonderChain = 0, chapter = 0, motivation = '', pace = null, foreshadow = '', foreshadowChapters = [] } = {}) {
  try {
    if (![0, 2, 4, 6, 7, 8, 10, 12, 14, 15].includes(step)) return;
    if (!audio || audio.state !== 'running') return;
    pulseSeen = audio.currentTime;
    const t = audioNow() + 0.005 + clamp(Number(wait) || 0, 0, 0.5);
    if (t < sound.rest) return;
    const { stage } = landQuality();
    const ch = Math.floor(Number(chapter) || sound.chapter || 0);
    const arc = chapterArcPlan({ progress, bar, step, stage, chapter: ch });
    const pocket = beatPocketPlan({ step, bar, progress, stage, swing: sound.swing, jazz: sound.jazz, ground: sound.ground, combo, bedOn: bed.on, chapter: ch });
    const jz = sound.jazz ? jazzPhrasePlan({ progress, wobble, combo, richness, presence, step, bar, tropeStage, wonderKind, wonderChain, chapter: ch, motivation, pace, foreshadow, foreshadowChapters, motif: sound.motif, development: sound.development }) : null;
    const owed = foreshadow ? foreshadowPlan(foreshadow, { chapter: ch || 1, appearances: foreshadowChapters, movement: arc.movement }) : null;
    const steer = jz || { parked: owed && !owed.mayLand ? owed.degree : null, landing: owed?.mayLand ? owed.degree : null };
    const recentHeat = (heard.get('catch')?.heat || 0) * 0.5 + (heard.get('wap')?.heat || 0) * 0.6;
    const duck = densityDuckFactor({ combo, stage, pace, recentHeat });
    const walk = jz ? walkingBassPlan({ progress, bar, chapter: ch, jazz: true, minor: sound.minor, tritoneSub: jz.tritoneSub, backdoor: jz.backdoor, feeds: jz.feeds, passOffset: jz.passOffset }) : null;
    if (step === 0 && pendingCadence && arc.inPhrase === 3) {
      const armed = pendingCadence;
      pendingCadence = null;
      playPlan(stingPlan(armed.shelf, { complete: true }).filter((n) => n.part === 'cadence'), { vol: armed.vol, air: armed.air });
    }
    if (pocket.spare && step !== 0) return;

    if (step === 0) {
      breathePad(t);
      if (!pocket.walkingBass && stage < 1 && !bed.on) return;
      const heat = hear('land-pulse', t);
      if (heat === null) return;
      const k = kit(outlet(heat * 0.22, { air: 0.25 }), t, 0);
      const bassNote = downbeatBass(bassLow() + fallen(walk ? walk.notes[0] : arc.bassOffset), { jz: steer, arc, step });
      const volScale = stage === 3 ? 1.25 : stage === 2 ? 1.05 : stage === 1 ? 0.85 : 0.68;
      if (sound.jazz) {
        k.uprightBass(hz(bassNote), stage < 2 ? 0.3 : 0.24, 0.03 * volScale * arc.volMul, 0);
      } else {
        k.tone('sine', hz(bassNote), 0, stage < 2 ? 0.28 : 0.2, 0.028 * volScale * arc.volMul, 0, { attack: 0.014, cents: 0 });
      }
      if (arc.complement && (stage >= 1 || bed.on)) {
        k.tone('sine', hz(bassLow() + fallen(arc.bassOffset + 7)), 0, 0.16, 0.011 * volScale, 0.03, { attack: 0.02, cents: 0 });
      }
      if (pocket.ridePing && sound.jazz) {
        k.ride(0.011 * volScale * duck.rideGain, 0, { accent: true, skip: false, side: 0.16 });
      }
      if (jz && jz.charleston && (stage >= 1 || combo >= 1)) {
        playJazzComp(k, jz, arc, duck, { dur: 0.17, gain: 0.88, roll: 0.006 });
      }
      if (stage >= 2 && arc.movement !== 'opening' && !arc.anticipate) {
        const guideSemi = fallen(arc.guideToneOffset) + 12;
        k.vibes(hz(guideSemi), 0.24, 0.011 * duck.compGain, jz ? jz.layback : 0.006, -0.1);
      }
      if (stage === 3) {
        const topSemi = harmony.pcs[harmony.pcs.length - 1] + 12 + (arc.movement === 'turnaround' ? 2 : 0);
        k.celesta(hz(topSemi), 0.22, 0.012 * duck.compGain, jz ? jz.layback : 0, 0.1);
      }
      return;
    }

    // Backbeat on beats 2 and 4 (steps 4 and 12), plus quarter-note walking bass when in Rising/Bridge/Turnaround or Jazz.
    if (step === 4 || step === 12) {
      if (!pocket.backbeat && !pocket.walkingBass) return;
      if (hear(`land-backbeat:${step}`, t) === null) return;
      const k = kit(outlet(0.18, { air: 0.2, role: 'music' }), t, step === 4 ? -0.08 : 0.08);
      const gain = (stage >= 2 ? 1 : 0.76) * (pocket.backbeatStrong ? 1.12 : 0.95);
      if (pocket.walkingBass && (stage >= 1 || bed.on)) {
        if (sound.jazz && walk) {
          const walkSemi = bassLow() + (step === 4 ? fallen(walk.notes[1]) : walk.notes[3]);
          k.uprightBass(hz(walkSemi), 0.21, 0.022 * gain, jz ? jz.layback * 0.5 : 0);
        } else {
          const walkSemi = bassLow() + fallen(step === 12 && jz ? jz.passOffset : pocket.bassSemi);
          k.marimba(hz(walkSemi), 0.18, 0.018 * gain, jz ? jz.layback * 0.5 : 0);
        }
      }
      if (sound.jazz && pocket.ridePing) {
        k.ride(0.01 * gain * duck.rideGain, jz ? jz.layback * 0.5 : 0, { accent: step === 12, skip: false, side: 0.15 });
        k.hihatChick(0.012 * gain * duck.rideGain, jz ? jz.layback : 0);
      }
      if (pocket.percussionVoice === 'wood') {
        k.tock(pocket.backbeatStrong ? 590 : 660, pocket.backbeatStrong ? 420 : 480, 0.016 * gain * (sound.jazz ? duck.rideGain : 1), jz ? jz.layback : 0);
      } else {
        k.hiss(5800, 3900, 0.045, 0.013 * gain * (sound.jazz ? duck.rideGain : 1), 1.9, jz ? jz.layback : 0, 'bandpass', 0.14);
      }
      if (step === 12 && arc.motifDeg != null && stage >= 2) {
        k.celesta(hz(sungTone(arc.motifDeg) + 12), 0.24, 0.014 * duck.compGain, jz ? jz.layback : 0, 0.15);
      }
      return;
    }

    // Jazz Charleston off-beat comping on step 6 ("and" of beat 2), or straight eighth subdivision on steps 2 & 6.
    if (step === 2 || step === 6) {
      if (step === 6 && jz && jz.charleston && (stage >= 1 || combo >= 2) && !duck.skipOffComp) {
        if (hear('land-comp', t) === null) return;
        const k = kit(outlet(0.2, { air: 0.3, song: 0.18, role: 'music' }), t, 0);
        playJazzComp(k, jz, arc, duck, { dur: 0.22, gain: 1, roll: 0.008 });
        return;
      }
      if (pocket.ridePing && (stage >= 2 || combo >= 3)) {
        if (hear(`land-sub:${step}`, t) === null) return;
        const k = kit(outlet(0.25, { air: 0.16, role: 'music' }), t, step === 2 ? -0.14 : 0.14);
        k.hiss(6800, 5100, 0.032, 0.008 * duck.rideGain, 2.4, 0, 'bandpass', 0.1);
      }
      return;
    }

    // Swung ride "spang-a-lang" skip notes on steps 7 and 15 (the swung 16th before beats 3 and 1).
    if (step === 7 || step === 15) {
      if (!pocket.ridePing && !pocket.pickupFill) return;
      if (hear(`land-skip:${step}`, t) === null) return;
      const k = kit(outlet(0.2, { air: 0.2, role: 'music' }), t, step === 7 ? 0.16 : -0.16);
      if (sound.jazz) {
        k.ride(0.009 * (stage >= 2 ? 1.15 : 0.85) * duck.rideGain, jz ? jz.layback * 0.6 : 0, { accent: false, skip: true, side: step === 7 ? 0.16 : -0.16 });
      } else {
        k.hiss(7800, 5600, 0.036, 0.01 * (stage >= 2 ? 1.15 : 0.85), 2.5, jz ? jz.layback * 0.6 : 0, 'bandpass', 0.18);
      }
      if (step === 15 && arc.anticipate && stage >= 2 && arc.movement !== 'opening') {
        k.vibes(hz(fallen(arc.guideToneOffset) + 12), 0.2, 0.01 * duck.compGain, 0, 0.12);
      }
      if (step === 15 && pocket.pickupFill && (stage >= 1 || bed.on)) {
        k.kalimba(hz(sungTone(1)), 0.14, 0.013 * duck.compGain, 0, 0.1);
      }
      return;
    }

    // Mid-bar pulse (beat 3, step 8): half-bar bass anchor plus chapter motif development during rising, bridge, and turnaround.
    if (step === 8) {
      if (!pocket.walkingBass && stage < 1) return;
      if (hear('land-motif', t) === null) return;
      const k = kit(outlet(0.2, { air: 0.3, song: 0.18, role: 'music' }), t, arc.movement === 'bridge' ? -0.18 : 0.12);
      const halfBass = downbeatBass(bassLow() + fallen(walk ? walk.notes[2] : (arc.bassOffset + (arc.movement === 'opening' ? 0 : 7))), { jz: steer, arc, step });
      if (sound.jazz) {
        k.uprightBass(hz(halfBass), 0.22, 0.023 * (stage >= 2 ? 1 : 0.78) * arc.volMul, 0);
        if (pocket.ridePing) k.ride(0.01 * duck.rideGain, 0, { accent: false, skip: false, side: 0.15 });
      } else {
        k.tone('sine', hz(halfBass), 0, 0.2, 0.02 * (stage >= 2 ? 1 : 0.75) * arc.volMul, 0, { attack: 0.014, cents: 0 });
      }
      if (stage >= 2 && (arc.motifDeg != null || jz?.motif)) {
        const phrase = jz?.motif?.events || [{ semi: sound.motif?.[arc.motifDeg % (sound.motif?.length || 1)] ?? sungTone(arc.motifDeg), at: 0, dur: 0.9, accent: 1 }];
        phrase.forEach((event, idx) => {
          const degSemi = fallen(event.semi) + 12;
          const at = (jz?.layback || 0) + event.at * sixteenth();
          const vol = (0.012 + event.accent * 0.005) * duck.compGain;
          if (jz?.enclosure && idx === phrase.length - 1) {
            k.vibes(hz(degSemi + 1), 0.07, vol * 0.7, Math.max(0, at - sixteenth() * 0.5), -0.1);
          }
          k.kalimba(hz(degSemi), Math.max(0.08, event.dur * sixteenth()), vol, at, (idx - 1) * 0.1);
        });
      }
      return;
    }

    // Jazz walking bass passing tone on step 10 (and Chapter 6's third Charleston comp stab on step 10).
    if (step === 10) {
      if (!jz || (stage < 1 && combo < 2)) return;
      if (jz.charleston && !duck.skipOffComp && hear('land-comp:10', t) !== null) {
        const kComp = kit(outlet(0.2, { air: 0.28, song: 0.16, role: 'music' }), t, 0);
        playJazzComp(kComp, jz, arc, duck, { dur: 0.19, gain: 0.92, roll: 0.007 });
      }
      if (!jz.walkingPass || hear('land-walk', t) === null) return;
      const k = kit(outlet(0.15, { air: 0.22 }), t, 0);
      k.uprightBass(hz(bassLow() + jz.passOffset), 0.16, 0.017, jz.layback);
      return;
    }

    // Step 14: 4-bar turnaround approach or phrase pickup.
    if ((arc.inPhrase !== 3 && arc.movement !== 'turnaround') || (stage < 1 && !bed.on)) return;
    if (hear('land-turn', t) === null) return;
    const k = kit(outlet(0, { air: 0.25 }), t, 0);
    const turnSemi = bassLow() + (jz ? jz.passOffset : arc.turnOffset);
    if (sound.jazz) k.uprightBass(hz(turnSemi), 0.18, 0.022, jz ? jz.layback * 0.5 : 0);
    else k.tone('sine', hz(turnSemi), 0, 0.2, 0.022, 0, { attack: 0.012, cents: 0 });
  } catch { /* the bar still turns */ }
}

/* What an obstacle is made of, heard once as it comes down its lane. The mimes are absent on purpose. */
const APPROACH = Object.freeze({
  stone: 'stone', pane: 'glass', frost: 'glass',
  chair: 'wood', table: 'wood', spool: 'wood', beaver: 'wood', dividers: 'wood',
  throne: 'gilt', post: 'gilt',   // the post is bronze (pie-reasons, playTone 'post')
  hole: 'hollow', ditch: 'hollow', snail: 'hollow', puddle: 'hollow',
  wasps: 'swarm', pigeon: 'odd',
  banner: 'cloth', sack: 'cloth', mimewall: 'cloth',
  // Friends, heard warm, so the lanes can be carried by ear: go toward these.
  berry: 'warm', boneberry: 'warm', wonder: 'warm', egg: 'warm', place: 'warm', switch: 'warm',
  dolphin: 'water', donut: 'dough', boonrose: 'warm', banerose: 'wood'
});

/** A quiet material, panned to the lane, as the thing nears. Unknown kinds, and the mimes, stay silent. */
export function approachCue(kind, pan = 0, depth = 0) {
  try {
    const mat = APPROACH[kind];
    if (!mat || !audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear(`near:${kind}`, t);
    if (heat === null || heat > 2.4) return;
    const k = kit(outlet(heat, { depth, air: 0.32 }), t, pan);
    const f = hz(bassLow() + 12);
    if (mat === 'stone') [1, 1.59, 2.14].forEach((p, i) => k.tone('sine', f * p, f * p * 0.82, 0.07, 0.022 / (i + 1), i * 0.006, { attack: 0.002, cents: 16 }));
    else if (mat === 'glass') {
      k.tone('sine', f * 2.756, 0, 0.2, 0.016, 0, { attack: 0.004, cents: 3 });
      k.tone('sine', f * 5.4, 0, 0.07, 0.006, 0.012, { attack: 0.002 });
    } else if (mat === 'wood') {
      k.tone('sine', f, 0, 0.09, 0.024, 0, { attack: 0.003 });
      k.tone('sine', f * 3, 0, 0.05, 0.01, 0, { attack: 0.002 });
    } else if (mat === 'gilt') {
      k.tone('sine', f, 0, 0.12, 0.022, 0, { attack: 0.003 });
      k.tone('sine', f * 1.5, 0, 0.16, 0.014, 0.02, { attack: 0.004, cents: 2 });
    } else if (mat === 'hollow') k.tone('sine', Math.max(40, f * 0.5), Math.max(32, f * 0.32), 0.26, 0.026, 0, { attack: 0.02, cents: 5 });
    else if (mat === 'swarm') {
      k.tone('sawtooth', 196, 196, 0.14, 0.016, 0, { attack: 0.012, cut: 1400 });
      k.tone('sawtooth', 203, 203, 0.14, 0.012, 0, { attack: 0.012, cut: 1400 });
    } else if (mat === 'odd') {
      const p = hz(sungTone(4) + 12);
      k.tone('sine', p, 0, 0.08, 0.018, 0, { attack: 0.004 });
      k.tone('sine', p * 3, 0, 0.04, 0.007, 0, { attack: 0.002 });
      k.tone('sine', p * 5, 0, 0.02, 0.004, 0, { attack: 0.002 });
    } else if (mat === 'warm') {
      // Up a major third, softly: something to go toward.
      const p = hz(sungTone(2) + 12);
      k.tone('sine', p, 0, 0.12, 0.016, 0, { attack: 0.01 });
      k.tone('sine', p * 1.26, 0, 0.16, 0.014, 0.07, { attack: 0.01 });
    } else if (mat === 'water') {
      // Two bubbles rising: a dolphin coming up out of the salt.
      k.tone('sine', f * 1.5, f * 2.6, 0.09, 0.018, 0, { attack: 0.004 });
      k.tone('sine', f * 2, f * 3.4, 0.08, 0.014, 0.09, { attack: 0.004 });
    } else if (mat === 'dough') {
      // A soft, low pat: dough on the road.
      k.tone('sine', Math.max(60, f * 0.75), Math.max(50, f * 0.6), 0.1, 0.024, 0, { attack: 0.006 });
      k.hiss(700, 300, 0.06, 0.008, 1, 0, 'lowpass', 0.5);
    } else k.hiss(900, 480, 0.12, 0.016, 1.2, 0, 'bandpass', 0.35);
  } catch { /* it still arrives */ }
}

/**
 * Heard first: a power that lasts is about to run out. A soft falling third on the vibes, a second before it ends,
 * centred, so the end of a ride is known before it comes. Tires, so two ending together are heard once.
 */
export function powerEnding() {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear('power-ending', t);
    if (heat === null || heat > 1.5) return;
    const k = kit(outlet(heat, { air: 0.3 }), t, 0);
    const p = hz(sungTone(4) + 12);
    k.tone('sine', p, 0, 0.16, 0.016, 0, { attack: 0.006 });
    k.tone('sine', p / 1.19, 0, 0.24, 0.014, 0.13, { attack: 0.006 });
  } catch { /* it still runs out */ }
}

/**
 * Heard first: something that knocks is close in the carrier's own lane. Two short low pulses that mean nothing
 * else, nearly centred (it is in your lane), louder the nearer it is. Tires like any sound, so a crowded lane does
 * not become an alarm. @param {number} pan @param {number} near 0 (far) to 1 (upon you)
 */
export function laneWarning(pan = 0, near = 0.5, shape = 'one') {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear('lane-warn', t);
    if (heat === null || heat > 3) return;
    const k = kit(outlet(heat, { air: 0.08, role: 'cue' }), t, clamp(pan, -1, 1) * 0.3);
    const f = hz(bassLow() + 7);
    const level = 0.03 + 0.02 * clamp(near, 0, 1);
    // Shaped by height, so the ear knows which way to go: something low enough to hop is two pulses that climb a
    // fourth, each sliding up (a hop); something that stands tall is two that step down, each sliding down (a wall).
    // One for all is the falling pair at one pitch, as it was first heard.
    if (shape === 'low') {
      k.tone('triangle', f, f * 1.12, 0.06, level, 0, { attack: 0.002 });
      k.tone('triangle', f * 4 / 3, f * 4 / 3 * 1.12, 0.06, level * 0.9, 0.09, { attack: 0.002 });
    } else if (shape === 'tall') {
      k.tone('triangle', f * 4 / 3, f * 4 / 3 * 0.94, 0.07, level, 0, { attack: 0.002 });
      k.tone('triangle', f, f * 0.94, 0.08, level * 0.9, 0.1, { attack: 0.002 });
    } else {
      k.tone('triangle', f, f * 0.94, 0.06, level, 0, { attack: 0.002 });
      k.tone('triangle', f, f * 0.94, 0.06, level * 0.85, 0.09, { attack: 0.002 });
    }
  } catch { /* the lane still says it */ }
}

/** A character, once, in the room's key. Boon climbs, Bane falls, a clown scoops, a clerk closes. */
export function characterMotif(who, pan = 0, { settled = false } = {}) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.01;
    const heat = hear(`who:${who}`, t);
    if (heat === null || heat > 2.5) return;
    const k = kit(outlet(heat, { air: 0.28 }), t, pan);
    const s = sixteenth();
    const honkAt = (i, delay, vol = 0.04) => k.honk(hz(sungTone(i)), 0.09, vol, delay, pan * 0.2);
    if (who === 'boon') [1, 2, 4].forEach((i, n) => honkAt(i, toPulse(t, 0.02) + n * s, 0.038));
    else if (who === 'bane') [4, 2, 1].forEach((i, n) => honkAt(i, n * s, 0.034));
    else if (who === 'clown') { honkAt(1, 0, 0.032); honkAt(4, s, 0.028); }
    else if (who === 'clerk') {
      k.tock(520, 400, 0.045);
      if (settled) k.marimba(hz(4), 0.2, 0.036, s * 2);
      else k.tone('sine', hz(0) * 2 ** (1 / 12), 0, 0.12, 0.026, s * 2, { attack: 0.004, cents: 4 });
    }
  } catch { /* they still arrive */ }
}

/* ─── Themes: whose it is (.spw/runtime/audio-tropes.spw, read in pie-tropes.mjs) ───
 * A theme is longer than a call and is the same someone everywhere. Mr. BoonWAP, Mr. BaneWAP and BoneWAP are one
 * shape turned three ways, so where the book has two of them in a room the second can answer the first. */
let MOTIFS = {};
let meterTurn = 0;
export function setThemes(motifs = {}) { MOTIFS = motifs || {}; }
/** Who is carrying, or '' when themes are off: the line takes their instrument. */
export function setSoundCarrier(id = '') { sound.carrier = id; }

const degree = (d) => {
  const scale = scaleNow();
  const n = scale.length;
  return scale[((d % n) + n) % n] + 12 * Math.floor(d / n);
};
/* The notes of a motif, with its `of` followed and its form applied (the reader's motifNotes, without the import). */
const themeNotes = (who) => {
  const m = MOTIFS[who];
  if (!m) return null;
  if (!m.of) return m.notes || null;
  const source = MOTIFS[m.of]?.notes;
  if (!source) return null;
  if (m.form === 'inversion') return source.map((n) => 2 * source[0] - n);
  if (m.form === 'retrograde') return [...source].reverse();
  return source;
};
/* What each timbre of the file is played on here. Reed keeps the kazoo the pies have always had. */
const voiceFor = (k, timbre) => ({ reed: k.honk, wood: k.marimba, marimba_bar: k.marimba, glass: k.celesta, odd: k.vibes }[timbre] || k.kalimba);

function playTheme(k, who, at, { vol = 1, settled = false, side = 0 } = {}) {
  const s = sixteenth();
  const m = MOTIFS[who];
  if (!m) return 0;
  if (who === 'genie') {
    // A stack of pure fifths, folded back into the octave, and home again a comma sharp: every wish costs a little.
    const f = hz(0);
    [1, 1.5, 1.125, 1.6875].forEach((ratio, i) => k.vibes(f * ratio, 0.4, 0.018 * vol, at + i * s * 2, side));
    k.vibes(f * 2, 0.9, 0.013 * vol, at + s * 8, side - 0.1);
    k.vibes(f * 2 * (531441 / 524288), 0.9, 0.013 * vol, at + s * 8, side + 0.1);
    return s * 8 + 0.9;
  }
  if (who === 'clerk') {
    // A tally: four strokes and a fifth across, closing on a minor second, or a major third once settled.
    [0, 1, 2, 3].forEach((i) => k.tock(520, 400, 0.034 * vol, at + i * s * 0.8));
    k.tock(760, 300, 0.044 * vol, at + s * 3.6);
    if (settled) k.marimba(hz(4), 0.2, 0.036 * vol, at + s * 5);
    else k.tone('sine', hz(0) * 2 ** (1 / 12), 0, 0.12, 0.026 * vol, at + s * 5, { attack: 0.004, cents: 4 });
    return s * 5 + 0.2;
  }
  if (who === 'ants') {
    // A triad and two single moves through the Tonnetz (R, then L): one street lit at a time.
    [0, 4, 7, 9, 5].forEach((semi, i) => k.marimba(hz(fallen(semi) + 12), 0.2, 0.024 * vol, at + i * s, side + (i - 2) * 0.1));
    return s * 5;
  }
  if (who === 'figure') {
    // The carrier is the pulse itself: one plain tone on the beat, and nothing said after it.
    k.tone('sine', hz(0), 0, 0.22, 0.03 * vol, at, { attack: 0.006, cents: 2 });
    return 0.25;
  }
  const notes = themeNotes(who);
  if (!notes) return 0;
  if (who === 'clown') {
    // A kazoo slide up; satisfied, it lands on the chord.
    const from = hz(degree(notes[0]));
    const to = hz(settled ? sungNear(degree(notes[1])) : degree(notes[1]));
    k.tone('sawtooth', from, to, s * 3, 0.03 * vol, at, { attack: 0.012, cut: 1700, vibrato: 14, side });
    return s * 3;
  }
  const play = voiceFor(k, m.timbre);
  let gap = 2;
  if (m.meters?.length) {
    // One knock, three ways: the same notes in the next of its meters, all of them right.
    meterTurn += 1;
    gap = m.meters[meterTurn % m.meters.length];
  }
  notes.forEach((d, i) => play(hz(degree(d)), m.timbre === 'reed' ? 0.1 : 0.26, (m.timbre === 'reed' ? 0.036 : 0.026) * vol, at + i * s * gap, side));
  return s * gap * notes.length;
}

/** A character's theme, once, on the pulse. `answer` names who replies a bar later, from further off. */
export function characterTheme(who, pan = 0, { settled = false, answer = '' } = {}) {
  try {
    if (!audio || audio.state !== 'running' || !MOTIFS[who]) return false;
    const t = audio.currentTime + 0.01;
    const heat = hear(`who:${who}`, t);
    if (heat === null || heat > 2.5) return false;
    const k = kit(outlet(heat, { air: 0.28 }), t, pan);
    const at = toPulse(t, 0.02);
    playTheme(k, who, at, { settled });
    if (answer && MOTIFS[answer]) {
      const far = kit(outlet(heat, { depth: 0.7, air: 0.55 }), t, -pan);
      playTheme(far, answer, at + sixteenth() * 16, { vol: 0.62 });
    }
    return true;
  } catch { return false; }
}

/** A mime, heard by what goes missing: the groove rests for a bar. */
export function mimeRest() {
  try {
    if (!audio || audio.state !== 'running') return;
    sound.rest = Math.max(sound.rest, audioNow() + sixteenth() * 16);
  } catch { /* the groove goes on */ }
}

/** The end of a carry, after the spill has fallen home: the opening of each theme, in the order they were met. */
export function curtainCall(cast = [], wait = 1.4) {
  try {
    if (!audio || audio.state !== 'running' || !cast.length) return;
    const t = audio.currentTime + 0.01;
    const k = kit(outlet(0, { air: 0.42 }), t, 0);
    const s = sixteenth() * 1.5;
    let at = clamp(wait, 0, 4);
    cast.slice(0, 5).forEach((who, i) => {
      const side = cast.length > 1 ? (i / (cast.length - 1) - 0.5) * 0.7 : 0;
      const notes = themeNotes(who) || [0];
      const play = voiceFor(k, MOTIFS[who]?.timbre);
      notes.slice(0, 2).forEach((d, n) => play(hz(degree(d)), 0.3, 0.03, at + n * s, side));
      at += s * 3;
    });
    k.musicBox(hz(12), 1, 0.026, at + s);
  } catch { /* the curtain comes down quietly */ }
}

/** The lanes gain a dimension: height climbs, games are a horn, depth is a low fifth and a far high note. */
export function dimensionFanfare(id) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.04;
    const k = kit(outlet(0, { air: 0.48 }), t, 0);
    const s = sixteenth();
    if (id === 'height') {
      [0, 2, 4].forEach((i, n) => k.pluck(hz(sungTone(i)), 0.05, n * s));
      k.celesta(hz(sungTone(4) + 12), 0.4, 0.028, 3 * s);
    } else if (id === 'games') {
      k.honk(hz(sungTone(2)), 0.14, 0.05, 0, -0.12);
      k.honk(hz(sungTone(4)), 0.18, 0.042, s * 2, 0.12);
    } else if (id === 'depth') {
      k.tone('sine', hz(bassLow()), 0, 0.8, 0.045, 0, { attack: 0.06, cents: 0 });
      k.tone('sine', hz(7), 0, 0.9, 0.028, 0.12, { attack: 0.08, cents: 0 });
      k.celesta(hz(sungTone(5) + 24), 0.5, 0.012, 0.4);
    }
  } catch { /* the lanes gain it all the same */ }
}

/** A chapter closes, heard in the key it was carried in, by how it went. Two steps up to the door over the fifth
 *  below, then where it lands: carried, home with its third; won back from the mimes, home with the major third
 *  the chapter had lost; kept by the mimes, home and still minor; taken by the mimes, the bass slips to the
 *  sixth and the top note is left alone (an ending that is not one). Call it before the next chapter's place
 *  is set. It gives back how long it takes, so the next chapter's motif can wait for it. */
export function chapterCadence(outcome = 'carried') {
  try {
    if (!audio || audio.state !== 'running') return 0;
    const t = audio.currentTime + 0.01;
    const at = pulseFrom(t, 0.06);
    const k = kit(outlet(0, { air: 0.4, song: 0.18 }), t, 0);
    (sound.minor ? [7, 10] : sound.open ? [7, 10] : [7, 9]).forEach((semi, i) => k.marimba(hz(semi), 0.24, 0.042, at(i * 2), (i - 0.5) * 0.2));
    k.tone('sine', hz(-17), 0, 0.34, 0.045, at(0), { attack: 0.012, cents: 0 });
    const home = at(4);
    if (sound.jazz) {
      // Jazz ii7 -> V7(b9) -> Imaj9 / Im6/9 (or deceptive bVImaj7 when taken by the mimes).
      k.uprightBass(hz(-10), 0.26, 0.044, at(0));
      [5, 9, 12].forEach((semi, i) => k.vibes(hz(fallen(semi)), 0.24, 0.02, at(0) + i * 0.012, (i - 1) * 0.14));
      k.uprightBass(hz(-17), 0.28, 0.046, at(2));
      [5, 8, 11].forEach((semi, i) => k.vibes(hz(semi), 0.26, 0.022, at(2) + i * 0.012, (i - 1) * 0.14));
      if (outcome === 'won') {
        k.uprightBass(hz(-16), 0.72, 0.048, home);
        [12, 15, 19].forEach((semi, i) => k.vibes(hz(semi), 0.8, 0.024, home + i * 0.018, (i - 1) * 0.15));
      } else if (outcome === 'back') {
        k.uprightBass(hz(-12), 0.75, 0.05, home);
        [11, 14, 16, 19].forEach((semi, i) => k.celesta(hz(semi), i === 3 ? 0.95 : 0.55, 0.026, home + i * sixteenth() * 0.45, (i - 1.5) * 0.16));
      } else if (outcome === 'held' || sound.minor) {
        k.uprightBass(hz(-12), 0.7, 0.048, home);
        [9, 14, 15].forEach((semi, i) => k.vibes(hz(semi), 0.72, 0.024, home + i * 0.018, (i - 1) * 0.14));
      } else {
        k.uprightBass(hz(-12), 0.75, 0.05, home);
        [11, 14, 16].forEach((semi, i) => k.vibes(hz(semi), 0.82, 0.026, home + i * 0.018, (i - 1) * 0.14));
      }
      return home + sixteenth() * 4;
    }
    const bass = (semi) => k.tone('sine', hz(semi), 0, 0.7, 0.05, home, { attack: 0.015, cents: 0 });
    if (outcome === 'won') {
      bass(-15);
      k.vibes(hz(12), 0.8, 0.036, home);
    } else if (outcome === 'back') {
      bass(-12);
      [12, 16, 19].forEach((semi, i) => k.celesta(hz(semi), i === 2 ? 0.9 : 0.5, 0.036, home + i * sixteenth() * 0.5, (i - 1) * 0.18));
    } else if (outcome === 'held') {
      bass(-12);
      k.marimba(hz(12), 0.5, 0.04, home, -0.1);
      k.marimba(hz(15), 0.5, 0.03, home, 0.1);
    } else {
      bass(-12);
      k.celesta(hz(12), 0.7, 0.04, home, -0.12);
      k.celesta(hz(sound.minor ? 15 : sound.open ? 17 : 16), 0.7, 0.03, home, 0.12);
    }
    return home + sixteenth() * 4;
  } catch { return 0; }
}

/** The chapter's motif, once, softly, as it begins (after `wait` seconds, when a cadence comes first). */
export function chapterIncipit(wait = 0) {
  try {
    if (!audio || audio.state !== 'running' || !sound.motif?.length) return;
    const t = audio.currentTime + 0.05 + clamp(Number(wait) || 0, 0, 4);
    incipitAt = t;
    const s = sixteenth();
    const k = kit(outlet(0, { air: 0.45, depth: 0.25, song: 0.2 }), t, 0);
    sound.motif.forEach((semi, i, all) => k.musicBox(hz(fallen(semi) + 12), i === all.length - 1 ? 0.9 : 0.4, 0.028, i * s * 2, (i - (all.length - 1) / 2) * 0.08));
  } catch { /* the chapter begins all the same */ }
}

/* Leitmotifs: the land's own, heard when they come. */
const LEITMOTIFS = Object.freeze({ boof: { voice: 'marimba', notes: [0, 7, 4], gap: 2 } });
export function leitmotif(who, pan = 0) {
  try {
    const m = LEITMOTIFS[who];
    if (!m || !audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.01;
    const heat = hear(`motif:${who}`, t);
    if (heat === null || heat > 2) return;
    const k = kit(outlet(heat, { air: 0.3 }), t, pan);
    const start = toPulse(t, 0.02);
    m.notes.forEach((semi, i) => k.marimba(hz(fallen(semi) - 12), 0.28, 0.05, start + i * sixteenth() * m.gap, pan * 0.3));
  } catch { /* Boof crosses quietly */ }
}

/* ─── Textures a player chooses (Setup, Sound; on the board line as =wap[…] and =steps[…]) ───
 * The two sounds heard most are the ones worth choosing: the WAP, and a step across the lanes. Each texture is a
 * recipe in the same kit and the room's key, so whichever is chosen still belongs to the chapter it is heard in, and
 * each keeps what the sound tells (a step says which way; a WAP climbs with the combo). Whimsical, cozy, or plain. */
export const TEXTURES = Object.freeze({
  wap: Object.freeze(['splat', 'pillow', 'cream', 'bell']),
  steps: Object.freeze(['ground', 'tiptoe', 'felt', 'wood'])
});
const textures = { wap: 'splat', steps: 'ground' };
/** @param {{ wap?: string, steps?: string }} chosen */
/** The feel: as each chapter is written, or jazz (see JAZZ). Changing it re-colours the room at once. */
export function setSoundFeel(feel = 'written') {
  const jazz = feel === 'jazz';
  if (jazz === sound.jazz) return;
  sound.jazz = jazz;
  sound.swing = swingTarget();
  try { setHarmony(harmony.sigil); } catch { /* the room keeps its chord until the next */ }
}

/** Update musicality settings cluster: swing, voicing, motifCues, songSpace, mix, plus optional creator style accents. */
export function setSoundConfig({ swing, voicing, motifCues, songSpace, mix, styleVoicing, styleInterval, patternMode, jazzLean: leaning } = {}) {
  if (['chapter', 'straight', 'lilt', 'deep'].includes(swing)) musical.swing = swing;
  if (['folk', 'warm', 'bright', 'velvet'].includes(voicing)) musical.voicing = voicing;
  if (['off', 'room', 'board'].includes(motifCues)) musical.motifCues = motifCues;
  if (['natural', 'close', 'hall'].includes(songSpace)) musical.songSpace = songSpace;
  if (['balanced', 'music', 'ear'].includes(mix)) musical.mix = mix;
  if (['folk', 'warm', 'bright', 'velvet', ''].includes(styleVoicing)) musical.styleVoicing = styleVoicing;
  if (typeof patternMode === 'string' && patternMode) musical.patternMode = patternMode;
  if (Number.isFinite(Number(styleInterval))) sound.styleInterval = clamp(Number(styleInterval), 0, 14);
  if (leaning != null && Number.isFinite(Number(leaning))) musical.jazzLean = clamp(Number(leaning), 0, 2);
  sound.swing = swingTarget();
  try { retimeSong(); } catch { /* retimed on next context */ }
}

const LANE_DEGS = Object.freeze([0, 2, 4, 7, 9]);
const STORY_BANE_KINDS = new Set(['banerose', 'clerk', 'dividers', 'throne', 'march', 'pane', 'baneberry', 'mime', 'mimewall']);
const STORY_BONE_KINDS = new Set(['stone', 'post', 'hole', 'ditch', 'snail', 'puddle', 'frost', 'beaver', 'boneberry']);

/**
 * Pure directional board-movement phrase plan for stepping across lanes and rows.
 * @param {{ lane?: number, row?: number, prevLane?: number, prevRow?: number, kind?: string, towardSafe?: boolean, diagonal?: boolean, dir?: number }} [opts]
 * @returns {{ notes: { semiOffset: number, dur: number, vol: number, at: number, panMul?: number }[] }}
 */
export function boardStepPlan({ lane = 2, row = 0, prevLane = lane, prevRow = row, kind = 'step', towardSafe = false, diagonal = false, dir = 1 } = {}) {
  const curL = clamp(Number(lane) || 0, 0, 4);
  const oldL = clamp(Number(prevLane) ?? curL, 0, 4);
  const curR = clamp(Number(row) || 0, 0, 4);
  const oldR = clamp(Number(prevRow) ?? curR, 0, 4);
  if (kind === 'bump') {
    return { notes: [{ semiOffset: -5, dur: 0.09, vol: 0.02, at: 0 }, { semiOffset: -12, dur: 0.14, vol: 0.016, at: 0.04 }] };
  }
  const start = LANE_DEGS[oldL] + oldR * 2;
  const dest = LANE_DEGS[curL] + curR * 2;
  if (kind === 'slide') {
    return { notes: [{ semiOffset: start + 12, dur: 0.12, vol: 0.018, at: 0 }, { semiOffset: dest + 19, dur: 0.2, vol: 0.02, at: 0.06 }] };
  }
  if (kind === 'climb' || curR !== oldR) {
    const up = curR > oldR || dir > 0;
    const notes = [
      { semiOffset: start + 12, dur: 0.11, vol: 0.016, at: 0 },
      { semiOffset: dest + (up ? 17 : 10), dur: 0.18, vol: 0.02, at: 0.055 }
    ];
    if (diagonal) notes.push({ semiOffset: dest + 24, dur: 0.18, vol: 0.014, at: 0.11 });
    return { notes };
  }
  const notes = [{ semiOffset: dest + 12, dur: 0.15, vol: 0.018, at: 0 }];
  if (diagonal) notes.unshift({ semiOffset: start + 12, dur: 0.1, vol: 0.014, at: 0 });
  if (towardSafe) notes.push({ semiOffset: dest + 19, dur: 0.2, vol: 0.017, at: 0.065 });
  return { notes };
}

/**
 * Pure maneuvering-trick note plan (hop clears, apex hangs, imaginary glass, shield warmth, bank shots).
 * @param {string} kind
 * @param {{ clears?: number, high?: boolean, inTime?: boolean, count?: number }} [opts]
 * @returns {{ notes: { voice: string, deg?: number, octave?: number, bass?: number, at: number, dur: number, vol: number, side?: number }[] }}
 */
export function trickPlan(kind, { clears = 1, high = false, inTime = false, count = 1 } = {}) {
  const n = Math.max(1, Math.min(4, Number(clears) || 1));
  const chain = Math.max(1, Math.min(4, Number(count) || 1));
  switch (kind) {
    case 'hop_clear': {
      if (high || n >= 2) {
        return {
          notes: [
            { voice: 'celesta', deg: 2, octave: 12, at: 0, dur: 0.18, vol: 0.026, side: -0.15 },
            { voice: 'vibes', deg: 4, octave: 12, at: 0.05, dur: 0.24, vol: 0.028, side: 0 },
            { voice: 'celesta', deg: 5 + Math.min(2, n - 1), octave: 12, at: 0.1, dur: 0.34, vol: 0.026, side: 0.18 }
          ]
        };
      }
      return {
        notes: [
          { voice: 'kalimba', deg: 2 + (inTime ? chain : 0), octave: 12, at: 0, dur: 0.16, vol: 0.026 },
          { voice: inTime ? 'celesta' : 'kalimba', deg: 4 + (inTime ? chain : 0), octave: 12, at: 0.06, dur: 0.24, vol: 0.024, side: 0.12 }
        ]
      };
    }
    case 'apex':
      return {
        notes: [
          { voice: 'celesta', deg: 3 + Math.min(2, chain - 1), octave: 12, at: 0, dur: 0.22, vol: 0.02 }
        ]
      };
    case 'mime_glass':
      return {
        notes: [
          { voice: 'celesta', deg: 4, octave: 24, at: 0, dur: 0.28, vol: 0.024, side: -0.2 },
          { voice: 'celesta', deg: 5, octave: 24, at: 0.045, dur: 0.34, vol: 0.02, side: 0.2 }
        ]
      };
    case 'pierce':
      return {
        notes: [
          { voice: 'vibes', deg: 3, octave: 12, at: 0, dur: 0.2, vol: 0.03 },
          { voice: 'celesta', deg: 5, octave: 12, at: 0.04, dur: 0.26, vol: 0.024 }
        ]
      };
    case 'shield_hold':
      return {
        notes: [
          { voice: 'marimba', bass: 0, at: 0, dur: 0.36, vol: 0.04 },
          { voice: 'vibes', deg: 2, octave: 12, at: 0.02, dur: 0.42, vol: 0.028, side: -0.12 },
          { voice: 'vibes', deg: 4, octave: 12, at: 0.09, dur: 0.48, vol: 0.024, side: 0.12 }
        ]
      };
    case 'frill_catch':
      return {
        notes: [
          { voice: 'marimba', bass: 0, at: 0, dur: 0.2, vol: 0.032 },
          { voice: 'kalimba', deg: 2, octave: 12, at: 0.03, dur: 0.18, vol: 0.022 }
        ]
      };
    case 'unkept_pass':
      return {
        notes: [
          { voice: 'musicBox', deg: 1, octave: 12, at: 0, dur: 0.22, vol: 0.02, side: -0.16 },
          { voice: 'musicBox', deg: 3, octave: 12, at: 0.055, dur: 0.28, vol: 0.02, side: 0.16 }
        ]
      };
    case 'bank_score':
      return {
        notes: [
          { voice: 'celesta', deg: 4, octave: 12, at: 0, dur: 0.24, vol: 0.028, side: -0.15 },
          { voice: 'celesta', deg: 6, octave: 12, at: 0.06, dur: 0.36, vol: 0.028, side: 0.15 }
        ]
      };
    default:
      return { notes: [{ voice: 'celesta', deg: 4, octave: 12, at: 0, dur: 0.2, vol: 0.02 }] };
  }
}

/**
 * Story gesture for a power-up spell: translates what the spell does in the book into a 2-4 note pulse motif.
 * @param {{ id?: string, timed?: Record<string, number>, acts?: string[], charges?: Record<string, number> } | null | undefined} power
 * @returns {{ role: string, notes: { voice: string, deg?: number, octave?: number, bass?: number, at: number, dur: number, vol: number, side?: number }[] }}
 */
export function powerStoryPlan(power) {
  const timed = power?.timed || {};
  const acts = power?.acts || [];
  const charges = power?.charges || {};
  if (timed.lag) {
    return {
      role: 'lag',
      notes: [
        { voice: 'marimba', bass: 12, at: 0, dur: 0.26, vol: 0.032 },
        { voice: 'vibes', deg: 2, octave: 12, at: 0.26, dur: 0.34, vol: 0.026, side: 0.14 }
      ]
    };
  }
  if (timed.lit) {
    return {
      role: 'lit',
      notes: [
        { voice: 'vibes', deg: 0, octave: 12, at: 0, dur: 0.26, vol: 0.024 },
        { voice: 'vibes', deg: 2, octave: 12, at: 0.07, dur: 0.3, vol: 0.024 },
        { voice: 'celesta', deg: 5, octave: 12, at: 0.14, dur: 0.42, vol: 0.022 }
      ]
    };
  }
  if (timed.unkept) {
    return {
      role: 'unkept',
      notes: [
        { voice: 'musicBox', deg: 0, octave: 12, at: 0, dur: 0.24, vol: 0.024, side: -0.15 },
        { voice: 'musicBox', deg: 3, octave: 12, at: 0.08, dur: 0.3, vol: 0.022, side: 0.15 },
        { voice: 'celesta', deg: 4, octave: 12, at: 0.16, dur: 0.38, vol: 0.02 }
      ]
    };
  }
  if (charges.echoes) {
    return {
      role: 'echoes',
      notes: [
        { voice: 'celesta', deg: 4, octave: 12, at: 0, dur: 0.22, vol: 0.03, side: -0.2 },
        { voice: 'celesta', deg: 4, octave: 12, at: 0.18, dur: 0.32, vol: 0.016, side: 0.2 }
      ]
    };
  }
  if (acts.includes('honk')) {
    return {
      role: 'honk',
      notes: [
        { voice: 'kalimba', deg: 2, octave: 12, at: 0, dur: 0.14, vol: 0.028, side: -0.2 },
        { voice: 'kalimba', deg: 4, octave: 12, at: 0.08, dur: 0.16, vol: 0.026, side: 0.2 },
        { voice: 'vibes', deg: 5, octave: 12, at: 0.18, dur: 0.28, vol: 0.024 }
      ]
    };
  }
  if (timed.true_aim) {
    return {
      role: 'true_aim',
      notes: [
        { voice: 'celesta', deg: 3, octave: 12, at: 0, dur: 0.14, vol: 0.024 },
        { voice: 'celesta', deg: 4, octave: 12, at: 0.06, dur: 0.14, vol: 0.022 },
        { voice: 'celesta', deg: 5, octave: 12, at: 0.12, dur: 0.3, vol: 0.024 }
      ]
    };
  }
  if (acts.includes('level') || acts.includes('forgive')) {
    return {
      role: 'settle',
      notes: [
        { voice: 'vibes', deg: 4, octave: 12, at: 0, dur: 0.22, vol: 0.024 },
        { voice: 'marimba', bass: 12, at: 0.09, dur: 0.34, vol: 0.03 }
      ]
    };
  }
  return {
    role: timed.glimpse ? 'glimpse' : 'story',
    notes: [
      { voice: 'vibes', deg: 2, octave: 12, at: 0, dur: 0.22, vol: 0.024 },
      { voice: 'celesta', deg: 4, octave: 12, at: 0.09, dur: 0.3, vol: 0.02 }
    ]
  };
}

/**
 * Quiet close-pass resolution cue connecting a dodged or handled obstacle to its story leaning.
 * @param {string} kind
 * @returns {{ lean: 'bane' | 'bone' | 'boon', notes: { voice: string, deg?: number, bass?: number, octave?: number, at: number, dur: number, vol: number }[] } | null}
 */
export function obstacleStoryPlan(kind) {
  if (!kind) return null;
  if (STORY_BANE_KINDS.has(kind)) {
    return {
      lean: 'bane',
      notes: [
        { voice: 'vibes', deg: 4, octave: 12, at: 0, dur: 0.14, vol: 0.018 },
        { voice: 'vibes', deg: 3, octave: 12, at: 0.07, dur: 0.22, vol: 0.016 }
      ]
    };
  }
  if (STORY_BONE_KINDS.has(kind)) {
    return {
      lean: 'bone',
      notes: [
        { voice: 'kalimba', deg: 3, octave: 0, at: 0, dur: 0.14, vol: 0.02 },
        { voice: 'marimba', bass: 12, at: 0.06, dur: 0.22, vol: 0.018 }
      ]
    };
  }
  return {
    lean: 'boon',
    notes: [
      { voice: 'celesta', deg: 2, octave: 12, at: 0, dur: 0.14, vol: 0.018 },
      { voice: 'celesta', deg: 5, octave: 12, at: 0.07, dur: 0.24, vol: 0.016 }
    ]
  };
}

const WONDER_SYNTAX_META = Object.freeze({
  creature: Object.freeze({ sigil: '@', container: '{}', lean: 'creature', shape: [0, 1, 3, 2], voice: 'musicBox' }),
  antique: Object.freeze({ sigil: '.', container: '{}', lean: 'antique', shape: [0, 0, 2, 1], voice: 'musicBox' }),
  artifact: Object.freeze({ sigil: '*', container: '[]', lean: 'artifact', shape: [2, 0, 3, 1], voice: 'musicBox' }),
  contrivance: Object.freeze({ sigil: '$', container: '()', lean: 'contrivance', shape: [0, 1, 2, 3], voice: 'musicBox' }),
  bracework: Object.freeze({ sigil: '&', container: '{}', lean: 'bracework', shape: [0, 2, 1, 3], voice: 'musicBox' }),
  saying: Object.freeze({ sigil: '#', container: '<>', lean: 'saying', shape: [3, 2, 1, 0], voice: 'musicBox' })
});

/**
 * Collectible syntax wonder note plan: translates an almanac wonder's Spw structure
 * (`?kind{ ... }` unfound probe -> answered sigil + container + movement) into a pure note sequence.
 * @param {string | { kind?: string, id?: string, spw?: string, found?: boolean, movement?: string } | null | undefined} kindOrWonder
 * @param {{ found?: boolean, movement?: string }} [opts]
 * @returns {{ kind: string, sigil: string, container: string, lean: string, spw: string, notes: { voice: string, deg?: number, bass?: number, octave?: number, at: number, dur: number, vol: number, side?: number }[] }}
 */
export function wonderSyntaxPlan(kindOrWonder, { found = true, movement = 'opening' } = {}) {
  const isObj = typeof kindOrWonder === 'object' && kindOrWonder !== null;
  const rawKind = isObj ? String(kindOrWonder.kind || 'creature') : String(kindOrWonder || 'creature');
  const isFound = isObj && kindOrWonder.found !== undefined ? Boolean(kindOrWonder.found) : Boolean(found);
  const mov = isObj && kindOrWonder.movement ? String(kindOrWonder.movement) : String(movement || 'opening');
  const id = isObj && kindOrWonder.id ? String(kindOrWonder.id).replace(/-/g, '_') : rawKind;
  const customSpw = isObj && kindOrWonder.spw ? String(kindOrWonder.spw) : '';
  const meta = WONDER_SYNTAX_META[rawKind] || WONDER_SYNTAX_META.creature;
  if (!isFound) {
    return {
      kind: rawKind,
      sigil: '?',
      container: meta.container,
      lean: 'hint',
      spw: `?${rawKind}${meta.container[0]} … ${meta.container[1]}`,
      notes: [
        { voice: 'musicBox', deg: 0, octave: 12, at: 0, dur: 0.28, vol: 0.022, side: -0.1 },
        { voice: 'musicBox', deg: 3, octave: 12, at: 0.09, dur: 0.42, vol: 0.024, side: 0.1 }
      ]
    };
  }
  const movLift = mov === 'turnaround' ? 2 : mov === 'bridge' ? 1 : 0;
  const stepGap = 0.04;
  const notes = meta.shape.map((degIdx, k) => ({
    voice: meta.voice,
    deg: degIdx + 3 + (k === meta.shape.length - 1 ? movLift : 0),
    octave: 0,
    at: k * stepGap,
    dur: k === meta.shape.length - 1 ? 0.68 : 0.34,
    vol: 0.036,
    side: (k - 1.5) * 0.12
  }));
  if (meta.container === '{}') {
    notes.unshift({ voice: 'marimba', bass: 12, at: 0, dur: 0.3, vol: 0.024, side: 0 });
  }
  return {
    kind: rawKind,
    sigil: meta.sigil,
    container: meta.container,
    lean: meta.lean,
    spw: customSpw || `${meta.sigil}${id}${meta.container[0]} #${rawKind} ${meta.container[1]}`,
    notes
  };
}

/**
 * Pure musical plan for audio easter eggs: mathematical prophecies, golden spirals, infinite sliver tin, celestial egg harmonics.
 * boof_perk and genie_wish are plans the check plays; the lanes call themeFlourishPlan for those two.
 * @param {string} kind 'pi' | 'golden' | 'shepard' | 'egg_warmth' | 'boof_perk' | 'genie_wish'
 * @param {{ combo?: number, inTime?: boolean, chapter?: number }} [opts]
 */
export function easterEggPlan(kind = 'pi', { combo = 1, inTime = false, chapter = 1 } = {}) {
  const PI_DIGITS = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3];
  switch (kind) {
    case 'pi': {
      // The Prophecy of 1pi(e): digits of pi mapped musically to pentatonic scale degrees with jazz swing
      const notes = PI_DIGITS.map((d, i) => {
        const deg = d % 5;
        const octave = d >= 5 ? 12 : 0;
        const swing = i % 2 === 1 ? 0.024 : 0;
        return {
          voice: i % 2 === 0 ? 'musicBox' : 'celesta',
          deg,
          octave: octave + 12,
          at: i * 0.09 + swing,
          dur: 0.14,
          vol: 0.022,
          side: Number((((i % 4) - 1.5) * 0.12).toFixed(2))
        };
      });
      return { kind: 'pi', role: 'easter_egg', lean: 'poised_69', notes };
    }
    case 'golden': {
      // Remainder Moths Golden Ratio Spiral: 8 steps at frac(n * phi), stepping across the stereo field
      const phi = 0.61803398875;
      const notes = Array.from({ length: 8 }, (_, i) => {
        const pos = (i * phi) % 1;
        const deg = Math.floor(pos * 5);
        const pan = (pos - 0.5) * 1.5;
        return {
          voice: i % 3 === 0 ? 'celesta' : 'vibes',
          deg,
          octave: 12 + (pos > 0.5 ? 7 : 0),
          at: i * 0.085,
          dur: 0.22,
          vol: 0.024,
          side: Number(pan.toFixed(2))
        };
      });
      return { kind: 'golden', role: 'easter_egg', lean: 'lydian_court', notes };
    }
    case 'shepard': {
      // The Sliver Tin Shepard Tone: 6 octave partials weighted by a bell curve envelope
      const partials = [-12, 0, 12, 24, 36, 48];
      const bell = [0.15, 0.45, 0.9, 0.85, 0.4, 0.1];
      const notes = partials.map((semi, i) => ({
        voice: 'vibes',
        deg: 0,
        octave: 12,
        semi,
        at: i * 0.02,
        dur: 0.65,
        vol: Number((0.025 * bell[i]).toFixed(4)),
        side: (i % 2 === 0 ? -1 : 1) * 0.1
      }));
      return { kind: 'shepard', role: 'easter_egg', lean: 'open_quartal', notes };
    }
    case 'egg_warmth': {
      // The warm egg celestial overtone chord
      return {
        kind: 'egg_warmth',
        role: 'easter_egg',
        lean: 'lydian_court',
        notes: [
          { voice: 'marimba', deg: 0, octave: 0, at: 0, dur: 0.45, vol: 0.032, side: -0.15 },
          { voice: 'vibes', deg: 2, octave: 12, at: 0.06, dur: 0.52, vol: 0.026, side: 0.15 },
          { voice: 'celesta', deg: 4, octave: 12, at: 0.12, dur: 0.58, vol: 0.024, side: 0 },
          { voice: 'musicBox', deg: 6, octave: 24, at: 0.18, dur: 0.62, vol: 0.02, side: 0.18 }
        ]
      };
    }
    case 'boof_perk': {
      // Boof's cheerful tail-wag ear-perk: motif 0-3-2 followed by a bright fifth and whistle
      return {
        kind: 'boof_perk',
        role: 'easter_egg',
        lean: 'poised_69',
        notes: [
          { voice: 'marimba', deg: 0, octave: 12, at: 0, dur: 0.18, vol: 0.03, side: -0.1 },
          { voice: 'marimba', deg: 3, octave: 12, at: 0.08, dur: 0.22, vol: 0.032, side: 0 },
          { voice: 'marimba', deg: 2, octave: 12, at: 0.16, dur: 0.26, vol: 0.03, side: 0.1 },
          { voice: 'celesta', deg: 4, octave: 24, at: 0.26, dur: 0.35, vol: 0.022, side: 0.2 }
        ]
      };
    }
    case 'genie_wish': {
      // Genie's pure Pythagorean fifths and comma shimmer
      return {
        kind: 'genie_wish',
        role: 'easter_egg',
        lean: 'lydian_court',
        notes: [
          { voice: 'vibes', deg: 0, octave: 12, at: 0, dur: 0.38, vol: 0.026, side: -0.2 },
          { voice: 'vibes', deg: 4, octave: 12, at: 0.09, dur: 0.42, vol: 0.024, side: -0.05 },
          { voice: 'celesta', deg: 1, octave: 24, at: 0.18, dur: 0.48, vol: 0.022, side: 0.1 },
          { voice: 'celesta', deg: 5, octave: 24, at: 0.28, dur: 0.55, vol: 0.02, side: 0.25 }
        ]
      };
    }
    default:
      return {
        kind: 'pi',
        role: 'easter_egg',
        lean: 'poised_69',
        notes: [{ voice: 'celesta', deg: 3, octave: 12, at: 0, dur: 0.2, vol: 0.025 }]
      };
  }
}

/**
 * Thematic flourish for a character during gameplay (on combos, high trick vaults, or character milestones).
 * @param {string} who
 * @param {string} [event]
 * @returns {{ who: string, event: string, lean: string, notes: { voice: string, deg?: number, bass?: number, octave?: number, at: number, dur: number, vol: number, side?: number }[] }}
 */
export function themeFlourishPlan(who = 'boof', event = 'trick') {
  const norm = String(who || 'figure').toLowerCase();
  switch (norm) {
    case 'boof':
      return {
        who: 'boof', event, lean: 'poised_69',
        notes: [
          { voice: 'marimba', deg: 0, octave: 12, at: 0, dur: 0.15, vol: 0.028, side: -0.1 },
          { voice: 'marimba', deg: 3, octave: 12, at: 0.07, dur: 0.18, vol: 0.03, side: 0 },
          { voice: 'kalimba', deg: 4, octave: 12, at: 0.14, dur: 0.24, vol: 0.024, side: 0.15 }
        ]
      };
    case 'boon':
    case 'boonwap':
      return {
        who: 'boon', event, lean: 'lydian_court',
        notes: [
          { voice: 'honk', deg: 0, octave: 12, at: 0, dur: 0.12, vol: 0.032, side: -0.1 },
          { voice: 'honk', deg: 2, octave: 12, at: 0.06, dur: 0.14, vol: 0.034, side: 0 },
          { voice: 'celesta', deg: 4, octave: 24, at: 0.12, dur: 0.28, vol: 0.025, side: 0.18 }
        ]
      };
    case 'bane':
    case 'banewap':
      return {
        who: 'bane', event, lean: 'bebop_bite',
        notes: [
          { voice: 'honk', deg: 4, octave: 12, at: 0, dur: 0.12, vol: 0.03, side: 0.1 },
          { voice: 'honk', deg: 2, octave: 12, at: 0.06, dur: 0.14, vol: 0.032, side: 0 },
          { voice: 'tock', bass: 1, at: 0.12, dur: 0.08, vol: 0.036, side: -0.15 }
        ]
      };
    case 'bonewap':
      return {
        who: 'bonewap', event, lean: 'open_quartal',
        notes: [
          { voice: 'marimba', deg: 3, octave: 0, at: 0, dur: 0.2, vol: 0.035, side: -0.12 },
          { voice: 'marimba', deg: 0, octave: 12, at: 0.08, dur: 0.24, vol: 0.035, side: 0.12 }
        ]
      };
    case 'genie':
      return {
        who: 'genie', event, lean: 'lydian_court',
        notes: [
          { voice: 'vibes', deg: 0, octave: 12, at: 0, dur: 0.32, vol: 0.025, side: -0.15 },
          { voice: 'celesta', deg: 4, octave: 24, at: 0.09, dur: 0.38, vol: 0.022, side: 0.15 }
        ]
      };
    case 'porter':
      return {
        who: 'porter', event, lean: 'backdoor_cadence',
        notes: [
          { voice: 'tock', at: 0, dur: 0.05, vol: 0.035 },
          { voice: 'marimba', deg: 2, octave: 12, at: 0.07, dur: 0.18, vol: 0.028 },
          { voice: 'tock', at: 0.15, dur: 0.05, vol: 0.035 }
        ]
      };
    case 'clerk':
      return {
        who: 'clerk', event, lean: 'bebop_bite',
        notes: [
          { voice: 'tock', at: 0, dur: 0.04, vol: 0.032 },
          { voice: 'tock', at: 0.06, dur: 0.04, vol: 0.034 },
          { voice: 'marimba', deg: 4, octave: 12, at: 0.13, dur: 0.22, vol: 0.03, side: 0.12 }
        ]
      };
    case 'ants':
      return {
        who: 'ants', event, lean: 'open_quartal',
        notes: [
          { voice: 'marimba', deg: 0, octave: 12, at: 0, dur: 0.14, vol: 0.025, side: -0.15 },
          { voice: 'marimba', deg: 2, octave: 12, at: 0.05, dur: 0.16, vol: 0.025, side: 0 },
          { voice: 'marimba', deg: 4, octave: 12, at: 0.1, dur: 0.2, vol: 0.025, side: 0.15 }
        ]
      };
    default:
      return {
        who: 'figure', event, lean: 'poised_69',
        notes: [
          { voice: 'kalimba', deg: 2, octave: 12, at: 0, dur: 0.18, vol: 0.024 },
          { voice: 'celesta', deg: 4, octave: 12, at: 0.08, dur: 0.22, vol: 0.022 }
        ]
      };
  }
}

/** Track the carrier's normalized position on the board (lane 0..4, row 0..3) so harmonic movement answers in pitch and stereo. */
export function setBoardPosition({ lane = 2, row = 0 } = {}) {
  sound.prevLane = sound.lane;
  sound.prevRow = sound.row;
  sound.lane = clamp(Number(lane) || 0, 0, 4);
  sound.row = clamp(Number(row) || 0, 0, 4);
  if (pad.tone && audio && audio.state === 'running') {
    try {
      pad.tone.frequency.setTargetAtTime((600 + sound.row * 85) * (sound.padTone || 1), audio.currentTime, 0.2);
    } catch { /* pad settles on next tick */ }
  }
}

/** Audition and interpret local board state via intentional chapter-motif intervals and harmonic tensions. */
export function setBoardHarmonicState({ tension = '', tensionLevel = 0 } = {}) {
  sound.harmonicTension = tension ? clamp(Number(tensionLevel) || 0.5, 0, 1) : 0;
  if (!pad.voices || !audio || audio.state !== 'running') return;
  try {
    const now = audio.currentTime;
    const norm = tension === '#11' ? 'sharp11' : tension;
    const stretch = norm === 'b9' ? 1 : norm === 'sharp11' ? 6 : norm === 'sus4' ? 5 : 0;
    const topVoice = pad.voices[PAD_VOICES - 1];
    const topSemi = padNow()[PAD_VOICES - 1];
    if (topVoice && Number.isFinite(topSemi)) {
      const targetSemi = stretch ? topSemi - (topSemi % 12) + stretch : topSemi;
      topVoice.forEach(({ osc }) => osc.frequency.setTargetAtTime(hz(targetSemi), now, 0.12));
    }
  } catch { /* pad stays steady */ }
}

/** Play a brief motif-derived directional, maneuver, tension, story, or resolution cue in the chapter's key. */
export function playBoardMotifCue({ action = 'steer', pan = 0, depth = 0.2, kind = 'clear', tension = '#11', stepIndex = 0, degOffset = null, lane = sound.lane, row = sound.row, prevLane = sound.prevLane, prevRow = sound.prevRow, towardSafe = false, diagonal = false, dir = 1 } = {}) {
  try {
    if (!audio || audio.state !== 'running' || musical.motifCues === 'off') return;
    if (action === 'steer' && musical.motifCues !== 'board') return;
    const t = audio.currentTime + 0.008;
    const cueKey = `motif-cue:${action}:${kind}`;
    const heat = hear(cueKey, t);
    if (heat === null || heat > 2.6) return;
    const s = sixteenth();
    const m = sound.motif?.length ? sound.motif : [0, 2, 4, 7, 4];
    const activeVoicing = musical.styleVoicing || musical.voicing;
    const base = fallen(degOffset != null ? degOffset : (m[stepIndex % m.length] ?? 0)) + 12;
    const k = kit(outlet(heat * 0.4, { depth, air: 0.34, song: 0.22, role: action === 'maneuver' ? 'music' : 'cue' }), t, clamp(pan, -1, 1) * 0.45);
    const voice = activeVoicing === 'warm' ? k.vibes : activeVoicing === 'bright' ? k.celesta : activeVoicing === 'velvet' ? k.musicBox : k.kalimba;
    if (action === 'tension') {
      const interval = tension === 'b9' ? 1 : (tension === '#11' || tension === 'sharp11') ? 6 : 5;
      voice(hz(base), 0.16, 0.024, 0, -0.1);
      voice(hz(base + interval), 0.28, 0.028, s * 0.85, 0.12);
      return;
    }
    if (action === 'resolve') {
      const target = sound.jazz ? 14 : 12;
      voice(hz(base + (sound.jazz ? 1 : 0)), 0.14, 0.028, 0, -0.1);
      voice(hz(sungTone(3) + target), 0.36, 0.036, s, 0.12);
      k.marimba(hz(bassLow() + 12), 0.22, 0.03, s);
      return;
    }
    if (action === 'pantry') {
      voice(hz(sungTone(2) + 12), 0.2, 0.024, 0, pan * 0.3);
      voice(hz(sungTone(4) + 12), 0.28, 0.02, s * 1.5, pan * 0.3);
      return;
    }
    if (action === 'story') {
      const degreeIdx = kind === 'room_cast' ? 4 : kind === 'word_ask' ? 5 : kind === 'word_feed' ? 3 : 2;
      voice(hz(sungTone(degreeIdx) + 12), 0.24, 0.024, 0, pan * 0.3);
      if (kind === 'room_cast' || kind === 'parallel') {
        k.vibes(hz(sungTone(degreeIdx + 2) + 12), 0.38, 0.02, s * 1.4, -pan * 0.25);
      }
      return;
    }
    if (action === 'maneuver') {
      const stepPlan = boardStepPlan({ lane, row, prevLane, prevRow, kind, towardSafe, diagonal, dir });
      stepPlan.notes.forEach((n, idx) => {
        const play = idx === 2 || (towardSafe && idx > 0) ? k.vibes : voice;
        play(hz(fallen(n.semiOffset)), n.dur, n.vol, n.at, pan * 0.4);
      });
      return;
    }
    // Directional steer / height cue shaped by the chapter's motif.
    const next = fallen(m[(stepIndex + 1) % m.length] ?? (base + 4)) + 12;
    const second = kind === 'low' ? Math.max(base + 5, next) : kind === 'tall' ? base - 3 : next;
    voice(hz(base), 0.14, 0.022, 0, pan * 0.35);
    voice(hz(second), 0.2, 0.026, s * (sound.swing > 0.56 ? 1.3 : 1), pan * 0.35);
  } catch { /* silent cue still informs visually */ }
}
/** Heard when the feel is chosen: a two-five-one in the chapter's key, swung, as written or as jazz, so the ear
 *  knows what changed. As written: three plain triads. Jazz: a minor seven, a dominant with a flat nine, a major
 *  seven; the flat nine is the dissonance, and the last chord is where it resolves. */
export function feelSample(feel = 'written') {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.05;
    const k = kit(outlet(0, { air: 0.35, song: 0.1 }), t, 0);
    const jazz = feel === 'jazz';
    const chords = jazz ? [[2, 5, 9, 12], [-1, 2, 5, 8], [0, 4, 7, 11]] : [[2, 5, 9], [-1, 2, 7], [0, 4, 7]];
    const roots = [2, 7, 0];
    const beat = 60 / (sound.pulse || 96);
    const swung = jazz ? 2 / 3 : 0.5;
    chords.forEach((chord, c) => {
      const at = c * beat * 1.5;
      k.marimba(hz(roots[c] - 24), 0.5, 0.05, at);
      chord.forEach((semi, i) => k.vibes(hz(semi + 12), c === 2 ? 0.9 : 0.42, 0.024, at + (i % 2 ? swung : 0) * beat * 0.5 + Math.floor(i / 2) * beat * 0.5, (i - 1.5) * 0.12));
    });
  } catch { /* chosen, if not heard */ }
}

/** Audition the current chapter's 4-movement progression (opening -> rising -> bridge -> turnaround) in the active feel. */
export function auditionChapterProgression(feel = sound.jazz ? 'jazz' : 'written') {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.04;
    const k = kit(outlet(0, { air: 0.38, song: 0.16, role: 'music' }), t, 0);
    const jazz = feel === 'jazz';
    const beat = 60 / (sound.pulse || 96);
    const swung = jazz ? 2 / 3 : 0.5;
    const stages = [0.1, 0.4, 0.68, 0.92];
    const m = sound.motif?.length ? sound.motif : [0, 2, 4, 7];
    stages.forEach((p, idx) => {
      const arc = chapterArcPlan({ progress: p, bar: idx, step: 8, stage: 3, chapter: sound.chapter });
      const at = idx * beat * 1.35;
      if (jazz) k.uprightBass(hz(bassLow() + fallen(arc.bassOffset)), 0.42, 0.045, at);
      else k.marimba(hz(bassLow() + fallen(arc.bassOffset)), 0.42, 0.045, at);
      const lead = fallen(m[idx % m.length] ?? sungTone(idx + 1)) + 12;
      if (jazz) {
        const jz = jazzPhrasePlan({ progress: p, wobble: idx === 2 ? 0.42 : 0.1, combo: idx, richness: 0.7, step: 6, bar: idx, chapter: sound.chapter });
        const voiced = compVoicingPlan({ bassOffset: arc.bassOffset, compSemis: jz.compSemis, minor: sound.minor, open: sound.open });
        voiced.slice(0, 4).forEach((s, ci) => k.vibes(hz(s + 12), 0.34, 0.016, at + ci * 0.02, (ci - 1.5) * 0.14));
        if (jz.enclosure) {
          k.celesta(hz(lead + 1), 0.1, 0.02, at + beat * 0.35, -0.1);
          k.celesta(hz(lead - 1), 0.1, 0.02, at + beat * 0.52, 0.08);
        }
      }
      k.celesta(hz(lead), idx === 3 ? 0.65 : 0.36, 0.024, at + beat * swung, (idx - 1.5) * 0.12);
    });
  } catch { /* silent preview fallback */ }
}

export function setSoundTextures({ wap, steps } = {}) {
  if (TEXTURES.wap.includes(wap)) textures.wap = wap;
  if (TEXTURES.steps.includes(steps)) textures.steps = steps;
}

/* ─── The sounds ──────────────────────────────────────────────────── */

export function wapSound(combo = 1, pan = 0, depth = 0, { recipe = '', perfect = false, satisfied = false } = {}) {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.005;
    const heat = hear('wap', t);
    if (heat === null) return;
    const { tone, hiss, honk, celesta, marimba, vibes, sample } = kit(outlet(heat, { depth, air: AIR.wap, role: 'fx' }), t, pan + jitter(0.04));
    const texture = textures.wap;
    if (texture === 'pillow') {
      // Into a pillow: a round whumpf, the crust muffled by the filling, nothing sharp in it.
      hiss(700, 120, 0.36, 0.3, 0.6, 0, 'lowpass');
      tone('sine', 140, 52, 0.3, 0.32, 0, { attack: 0.01, cents: 0 });
    } else if (texture === 'cream') {
      // Whipped cream: a squelch that slides down, and after it a slide whistle that goes up, as in a cartoon.
      tone('sine', 420, 70, 0.26, 0.34, 0, { attack: 0.004, cents: 60 });
      hiss(2400, 300, 0.24, 0.24, 1.6, 0, 'bandpass', 0.3);
      tone('sine', hz(sungTone(0)), hz(sungTone(4)), 0.34, 0.05, 0.12, { attack: 0.03, cents: 0 });
    } else if (texture === 'bell') {
      // The fairground bell: a small splat, then a ding, as if a prize were won.
      hiss(1500, 300, 0.12, 0.2, 1.1, 0, 'bandpass', 0.35);
      celesta(hz(sungTone(4) + 12), 0.6, 0.06, 0.04);
      celesta(hz(sungTone(2) + 12), 0.5, 0.03, 0.04);
    } else {
      // Crust crackle, high and crisp, over warm creamy splash.
      sample('wap');
      tone('triangle', 380, 58, 0.22, 0.42, 0, { attack: 0.004, cents: 40 });
      tone('sine', 240, 88, 0.14, 0.22, 0.004, { attack: 0.002, cents: 20 });
      hiss(2900, 1250, 0.075, 0.16, 1.7, 0.002, 'bandpass', 0.28);
      hiss(1700, 200, 0.3, 0.36, 1.1, 0, 'bandpass', 0.35);
      hiss(480, 110, 0.34, 0.18, 0.7, 0.02, 'lowpass');
    }
    // Under it, the room's bass.
    tone('sine', hz(bassLow()), hz(bassLow()) * 0.98, 0.32, 0.095, 0, { attack: 0.006, cents: 0 });
    tone('sine', hz(bassLow() - 12), 0, 0.28, 0.05, 0, { attack: 0.008, cents: 0 });
    // And the clown's delight: two honks on the pulse, chord tones a step higher for each WAP in a combo.
    const step = clamp(combo - 1, 0, 4);
    const pulse = pulseFrom(t, 0.15);
    const first = pulse(0);
    // In a pillow the delight is a soft mallet rather than a honk; every other texture keeps the clown's honks.
    const delight = texture === 'pillow' ? (f, d, v, at, p) => marimba(f, d * 2, v * 0.6, at, p) : honk;
    delight(hz(sungTone(2 + step)), 0.1, 0.09, first, -0.08);
    delight(hz(sungTone(3 + step)), 0.12, 0.1, pulse(1), 0.08);
    // A run of WAPs fills the same way the room does: from two, the third; from four, the room's colour.
    if (step >= 1) tone('sine', hz(sound.minor ? 3 : sound.open ? 5 : 4), 0, 0.18, 0.03, first, { attack: 0.012, cents: 0 });
    if (step >= 3) celesta(hz(harmony.pcs[harmony.pcs.length - 1] + 12), 0.26, 0.016, pulse(1));
    // Recipe sheen over the WAP.
    if (recipe === 'set_jam' || recipe === 'royal') vibes(hz(sungTone(4) + 12), 0.36, 0.022, first, 0.15);
    else if (recipe === 'tempered') celesta(hz(sungTone(5) + 12), 0.28, 0.02, first, -0.15);
    else if (recipe === 'savoury') marimba(hz(sungTone(1)), 0.24, 0.028, first);
    // Scored: a Perfect and a satisfied clown are heard by length, not loudness. A Perfect gets one high ting on the
    // next pulse; a clown satisfied gets the chord climbing home, long and soft, after the honks. The WAP itself is
    // the WAP everyone knows.
    if (designOn() && (perfect || satisfied)) {
      const { vibes: ring, celesta: ting } = kit(outlet(heat, { depth, air: 0.4 }), t, pan);
      const after = pulseFrom(t, 0.15);
      if (perfect) ting(hz(sungTone(6) + 12), 0.5, 0.03, after(2));
      if (satisfied) [2, 4, 7].forEach((i, n) => ring(hz(sungTone(i)), 0.7 - n * 0.1, 0.022, after(2) + n * sixteenth(), (n - 1) * 0.15));
    }
    swellPad(t, WORTH.wap);
  } catch { /* a silent WAP is still a WAP */ }
}

/**
 * Tactile micro-sounds: steps, hops, bank shots, the berries' voices, knocks, recipes, and the Egg's hum.
 * @param {string} kind
 * @param {any} [param]
 * @param {number} [pan]
 * @param {number} [depth]
 */
export function playTone(kind, param = 1, pan = 0, depth = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear(kind, t);
    if (heat === null) return;
    const role = ['step', 'climb', 'bump', 'slide'].includes(kind)
      ? 'step'
      : ['catch', 'deft', 'berry', 'sweet', 'pantry', 'recipe', 'poise', 'aim', 'story_word', 'story_mark', 'story_feed', 'story_ask', 'room_cast', 'trick', 'power_story', 'story_pass', 'furrow', 'easter_egg', 'theme_flourish'].includes(kind)
        ? 'music'
        : 'fx';
    const kitMap = kit(outlet(heat, { depth, air: AIR[kind] ?? 0.2, song: SONG[kind] || 0, role }), t, pan + jitter(0.04));
    const { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, tock, sample } = kitMap;
    // A gesture's notes, leaning the way its role, court or carrier does when the feel is jazz (inflectGesture).
    const renderNotes = (list, delay = 0, lean = '') => inflectGesture(list, { lean, amount: jazzLean() }).forEach((n) => {
      const fn = kitMap[n.voice] || voiceLead;
      const pitch = hz((n.bass != null ? bassLow() + n.bass : sungTone(n.deg || 0) + (n.octave || 0)) + (n.semi || 0));
      fn(pitch, n.dur, n.vol, delay + n.at, n.side || 0);
    });
    const answer = toPulse(t);
    const s32 = sixteenth() / 2;
    const activeVoicing = musical.styleVoicing || musical.voicing;
    const voiceLead = activeVoicing === 'warm' ? vibes : activeVoicing === 'bright' ? musicBox : activeVoicing === 'velvet' ? kalimba : celesta;
    switch (kind) {
      // Footsteps know the ground: a brush of grass in the field, a tick of cobble in the city; left and right differ,
      // and when music or motif cues are active, lateral movement lightly traces a pentatonic contour across the lanes.
      case 'step': {
        const dir = typeof param === 'object' && param ? (Number(param.dir) || 1) : (Number(param) || 1);
        const lane = typeof param === 'object' && param && param.lane != null ? clamp(Number(param.lane), 0, 4) : sound.lane;
        const row = typeof param === 'object' && param && param.row != null ? clamp(Number(param.row), 0, 4) : sound.row;
        // A chosen texture (=steps[…]): each still says which way, left and right a step apart.
        if (textures.steps === 'tiptoe') pluck(hz(sungTone(dir > 0 ? 2 : 1)), 0.036);
        else if (textures.steps === 'felt') { tone('sine', dir > 0 ? 96 : 88, 60, 0.06, 0.032, 0, { attack: 0.006, cents: 0 }); hiss(500, 300, 0.05, 0.012, 0.7, 0, 'lowpass'); }
        else if (textures.steps === 'wood') tock(dir > 0 ? 760 : 680, dir > 0 ? 560 : 500, 0.042);
        else if (sound.ground === 'field') {
          if (!sample('step-field')) {
            hiss(1400 + (dir > 0 ? 220 : 0), 650, 0.06, 0.045, 1.1); tone('sine', 118, 70, 0.05, 0.035, 0, { cents: 40 });
          }
        } else if (!sample('step-city')) {
          tone('triangle', 150 + (dir > 0 ? 14 : 0), 72, 0.04, 0.05, 0, { attack: 0.003, cents: 40 }); hiss(2800, 2000, 0.022, 0.024, 2.5);
        }
        if (musical.motifCues !== 'off') {
          const laneDeg = [0, 2, 4, 5, 7][lane] ?? 2;
          const noteSemi = fallen(laneDeg + row * 2);
          kalimba(hz(noteSemi), 0.13, 0.014, s32 * 0.5);
        }
        break;
      }
      // Advancing or retreating along the rows: climbing up lifts a fourth in anticipation; stepping back settles.
      case 'climb': {
        const dir = typeof param === 'object' && param ? (Number(param.dir) || 1) : (Number(param) || 1);
        const row = typeof param === 'object' && param && param.row != null ? clamp(Number(param.row), 0, 4) : sound.row;
        const baseSemi = fallen(row * 2);
        const targetSemi = dir > 0 ? baseSemi + 5 : Math.max(-5, baseSemi - 2);
        if (sound.ground === 'field') hiss(1200 + (dir > 0 ? 400 : 0), 500, 0.055, 0.03, 1.2);
        else tock(dir > 0 ? 640 + row * 40 : 520, 440, 0.028);
        voiceLead(hz(baseSemi + 12), 0.11, 0.016, 0);
        voiceLead(hz(targetSemi + 12), 0.16, 0.019, s32 * 0.85);
        break;
      }
      // Sliding across frost: crystalline slip shimmer in key.
      case 'slide':
        hiss(3400, 5600, 0.16, 0.028, 3.2, 0, 'bandpass', 0.25);
        tone('sine', hz(sungTone(4) + 12), hz(sungTone(6) + 12), 0.14, 0.024, 0, { cents: 15 });
        break;
      // Bumping a lane or row boundary: hollow wood guardrail thud.
      case 'bump':
        tock(240, 170, 0.045);
        tone('triangle', 120, 74, 0.07, 0.035, 0, { attack: 0.002 });
        break;
      // Aiming the slice needle: quiet scaled tick that blooms into a harmonic lock when aligned with a target.
      case 'aim': {
        const info = typeof param === 'object' && param ? param : { angle: Number(param) || 0 };
        const idx = clamp(Math.round((info.angle + 0.65) * 4), 0, 6);
        tock(880 + idx * 55, 620 + idx * 35, 0.014);
        voiceLead(hz(sungTone(idx) + 12), info.locked ? 0.22 : 0.09, info.locked ? 0.024 : 0.011, 0);
        if (info.locked) celesta(hz(sungTone(idx + 2) + 12), 0.26, 0.018, s32);
        break;
      }
      // Story road words & room casts: quiet musical punctuation grounded in the passing passage's room key and jazz lean.
      case 'story_word': {
        const deg = typeof param === 'object' && param?.deg != null ? Number(param.deg) : (sound.lane % 5);
        renderNotes([{ voice: 'kalimba', deg, octave: 0, at: 0, dur: 0.12, vol: 0.012 }], 0, 'story_word');
        break;
      }
      case 'story_mark':
        renderNotes([
          { voice: 'celesta', deg: 3, octave: 12, at: 0, dur: 0.2, vol: 0.024 },
          { voice: 'celesta', deg: 5, octave: 12, at: answer, dur: 0.24, vol: 0.02 }
        ], 0, 'story_mark');
        break;
      case 'story_feed':
        renderNotes([
          { voice: 'vibes', deg: 2, octave: 12, at: 0, dur: 0.28, vol: 0.026 },
          { voice: 'vibes', deg: 4, octave: 12, at: s32, dur: 0.34, vol: 0.022 }
        ], 0, 'story_feed');
        break;
      case 'story_ask':
        renderNotes([
          { voice: 'musicBox', deg: 4, octave: 12, at: 0, dur: 0.26, vol: 0.024 },
          { voice: 'musicBox', deg: 6, octave: 12, at: s32 * 1.4, dur: 0.34, vol: 0.022 }
        ], 0, 'story_ask');
        break;
      case 'room_cast': {
        renderNotes([
          { voice: 'marimba', bass: 0, at: 0, dur: 0.4, vol: 0.042 },
          ...[0, 2, 4, 7].map((semi, idx) => ({ voice: 'vibes', deg: idx + 1, octave: 12, semi: fallen(semi) - sungTone(idx + 1), at: idx * s32, dur: 0.36 + idx * 0.08, vol: 0.024, side: (idx - 1.5) * 0.14 }))
        ], 0, 'room_cast');
        break;
      }
      // A catch: the line's next note answered on the pulse, with warm wood body & jazz enclosure.
      case 'catch': {
        const a = nextNote(t);
        const sing = { porter: marimba, clerk: kalimba, genie: vibes }[sound.carrier] || voiceLead;
        const steep = Number(param) || 0;
        marimba(hz(a - 12), 0.18, 0.028);
        if (sound.jazz && (line.leaning = !line.leaning)) {
          sing(hz(a + 1), 0.07, 0.032);
          sing(hz(a), 0.22, 0.048, s32);
          if (steep > 0.45) vibes(hz(sungFrom(a) + 12), 0.3, 0.022, s32 * 2, -0.15);
        } else {
          sing(hz(a), 0.2, 0.046);
        }
        sing(hz(sungFrom(a)), 0.28, 0.038, answer, 0.12);
        break;
      }
      // Swung jazz pocket maneuver: brushed cymbal kiss + pizzicato bass pulse + dimensional comping.
      case 'pocket': {
        const info = typeof param === 'object' && param ? param : { chain: Number(param) || 1 };
        const chain = Number(info.chain ?? param) || 1;
        hiss(6800, 5200, 0.05, 0.028, 3, 0, 'highpass', 0.22);
        marimba(hz(bassLow() + (chain > 1 ? 7 : 0)), 0.14, 0.046);
        if (sound.jazz) {
          const jz = jazzPhrasePlan({ wobble: info.wobble || 0, combo: info.combo || chain, richness: info.richness ?? 0.6, presence: info.presence || '', progress: info.progress || 0, chapter: sound.chapter });
          jz.compSemis.slice(0, chain >= 3 ? 3 : 2).forEach((semi, idx) => vibes(hz(semi + 12), 0.22, 0.016, jz.layback + idx * s32 * 0.6, (idx - 0.5) * 0.16));
        } else if (chain >= 3) {
          voiceLead(hz(sungTone(3) + 12), 0.2, 0.018, s32);
        }
        break;
      }
      // Poise settled lock-in: serene crystal fifth.
      case 'poise':
        voiceLead(hz(sungTone(2) + 12), 0.34, 0.024, 0, -0.1);
        voiceLead(hz(sungTone(3) + 12), 0.42, 0.02, s32 * 1.5, 0.1);
        break;
      // Room of ingredients resonance bloom.
      case 'pantry': {
        const tones = roomTones().slice(0, 4);
        tones.forEach((semi, idx) => vibes(hz(semi), 0.42, 0.024, idx * s32, (idx - 1.5) * 0.14));
        marimba(hz(bassLow()), 0.28, 0.05);
        break;
      }
      // Complex recipe baked/set from tilt + ingredients.
      case 'recipe': {
        const chord = param === 'set_jam' ? [0, 4, 7, 11] : param === 'tempered' ? [0, 2, 7, 14] : param === 'savoury' ? [0, 5, 7, 9] : param === 'blistered' ? [0, 4, 9, 14] : [0, 4, 7, 11, 14];
        marimba(hz(bassLow()), 0.42, 0.075);
        chord.forEach((semi, idx) => {
          const play = idx % 2 ? celesta : vibes;
          play(hz(semi + 12), 0.45 + idx * 0.06, 0.028, idx * s32, (idx - 1.5) * 0.14);
        });
        break;
      }
      // A hop is a plucked string; a chain climbs the room's chord, and the high hop sparkles (with a blue-note slide in jazz feel).
      case 'hop': {
        const chain = clamp(Number(param) || 0, 0, 3);
        const target = sungTone(chain) - 12;
        if (sound.jazz && chain >= 1) {
          tone('triangle', hz(target - 1), hz(target), 0.08, 0.042, 0, { attack: 0.004 });
        } else {
          pluck(hz(target), 0.06);
        }
        hiss(900, 2300, 0.09, 0.02, 1.4);
        if (chain >= 2) [3, 4, 5].forEach((i, k) => celesta(hz(sungTone(i) + 12), 0.22, 0.014, answer + k * s32, (k - 1) * 0.2));
        break;
      }
      // A landing: felt, and in the field a little flour.
      case 'land':
        if (!sample('land')) tone('sine', 150, 68, 0.07, 0.04, 0, { attack: 0.004, cents: 40 });
        if (sound.ground === 'field') hiss(800, 300, 0.08, 0.025, 0.7, 0, 'lowpass', 0.2);
        break;
      // A deft landing: the line leaps, on a marimba, and is answered a chord tone higher (with chromatic approach in jazz feel).
      case 'deft': {
        const a = nextNote(t, 2);
        const top = sungFrom(sungFrom(a));
        marimba(hz(a), 0.3, 0.05);
        if (sound.jazz) {
          vibes(hz(top - 1), 0.08, 0.026, Math.max(0, answer - s32), -0.08);
          vibes(hz(top + 12), 0.28, 0.02, answer + s32, -0.14);
        }
        marimba(hz(top), 0.36, 0.045, answer, 0.12);
        break;
      }
      case 'throw': hiss(820, 2100, 0.09, 0.09, 2, 0, 'bandpass', 0.1); tone('sine', 280, 420, 0.07, 0.04, 0, { cents: 30 }); break;
      // Bank shots: a pane of glass rings the line's note high, with a fifth; a bronze post its bar's odd partials.
      case 'glass': { const f = hz(nextNote(t) + 12); celesta(f, 0.5, 0.06); tone('sine', f * 1.5, 0, 0.3, 0.028, 0.025, { attack: 0.004, side: 0.2 }); break; }
      case 'post': {
        const f = hz(nextNote(t));
        tone('sine', f, 0, 0.4, 0.065, 0, { attack: 0.003 });
        tone('sine', f * 2.76, 0, 0.16, 0.03, 0, { attack: 0.002, side: -0.15 });
        tone('sine', f * 5.4, 0, 0.06, 0.012, 0, { attack: 0.002, side: 0.15 });
        break;
      }
      case 'ramp': { const a = nextNote(t, 2); tone('sine', hz(a - 5), hz(a), 0.13, 0.07); celesta(hz(a + 12), 0.2, 0.02, answer); break; }
      // A boonberry: the room's chord climbed as they come, on a vibraphone, and an airy glimpse after.
      case 'berry': {
        const i = 2 + (Number(param) || 0) % 6;
        vibes(hz(sungTone(i)), 0.42, 0.05);
        vibes(hz(sungTone(i + 1)), 0.52, 0.045, answer, 0.12);
        celesta(hz(sungTone(i + 2) + 12), 0.3, 0.016, answer + s32, -0.14);
        hiss(5200, 7800, 0.18, 0.018, 4, answer, 'bandpass', 0.3);
        line.at = sungTone(i + 1);
        line.last = t;
        break;
      }
      case 'sweet': [0, 1, 2, 3].forEach((k) => vibes(hz(sungTone(k + 3)), 0.55, 0.042, k * s32, (k - 1.5) * 0.15)); celesta(hz(sungTone(5) + 12), 0.65, 0.022, s32 * 4); break;
      // A boon rose kept: bowed rather than struck, so it is never mistaken for a donut's four vibes.
      case 'rose':
        swell('sine', hz(sungTone(5) + 12), 0.7, 0.032);
        celesta(hz(sungTone(4) + 12), 0.45, 0.034, s32 * 2, 0.1);
        celesta(hz(sungTone(6) + 12), 0.5, 0.026, s32 * 4, -0.1);
        break;
      // A gift landing, by its order of magnitude (param: the count; negative when sent to the other side): one
      // note for a few, up to four for thousands, and from a hundred a low bloom under them. Up the chord for my
      // side, down it in the marimba's wood for the other. A gift leans nothing: this is size, not worth.
      case 'gift': {
        const n = Math.abs(Number(param) || 1);
        const rival = Number(param) < 0;
        const mag = clamp(Math.floor(Math.log10(Math.max(1, n))) + 1, 1, 4);
        for (let i = 0; i < mag; i += 1) (rival ? marimba : celesta)(hz(sungTone(rival ? 3 - i : 2 + i) + (rival ? -12 : 12)), 0.3 + 0.1 * i, 0.03, i * s32 * 2, (i - (mag - 1) / 2) * 0.2);
        if (mag >= 3) swell('sine', hz(bassLow()), 0.9, 0.035);
        break;
      }
      // An anthill bumped: the ants lift their weights, a tiny tick for each, all at once. Small, and many.
      case 'anthill':
        [0, 1, 2, 3].forEach((i) => tock(1500 + i * 140, 1100 + i * 90, 0.011, i * 0.028));
        break;
      // Brushing past Boof (scored): fur, and the first note of her three.
      case 'brush':
        if (!designOn()) break;
        hiss(900, 400, 0.12, 0.02, 0.8, 0, 'lowpass');
        marimba(hz(fallen(0) - 12), 0.3, 0.035, s32);
        break;
      // The haggle (pie-finds.mjs): each price struck is a wooden tock a step lower, and a soft vibes note that falls
      // with it, so the price is heard going down; then the coin handed back, two bright clinks and a glint. Cozy, and
      // a little silly, since nobody was selling.
      case 'haggle': {
        const round = clamp(Number(param) || 0, 0, 2);
        tock(560 - round * 70, 420 - round * 60, 0.05);
        // Jazz walks the price down by semitones (the fifth, its flat, the fourth) rather than by the chord.
        vibes(hz(sound.jazz ? 7 - round : sungTone(4 - round * 2)), 0.32, 0.03, s32 * 2);
        break;
      }
      case 'coin':
        // Jazz lands the coin on a six-nine, the ninth over the sixth.
        celesta(hz(sound.jazz ? 26 : sungTone(5) + 12), 0.2, 0.04);
        celesta(hz(sound.jazz ? 21 : sungTone(4) + 12), 0.32, 0.035, s32 * 1.5);
        hiss(6200, 5200, 0.05, 0.012, 4, s32 * 1.5);
        break;
      // A boneberry: low and woody, like a mallet on a bowl, savoury rather than sweet.
      case 'bone':
        marimba(hz(bassLow()), 0.3, 0.13);
        marimba(hz(sungTone(1) - 12), 0.22, 0.06, answer);
        hiss(2600, 1800, 0.02, 0.04, 3);
        break;
      // A baneberry squashed: a wet pop, and nothing said.
      case 'squash': tone('sine', 150, 55, 0.09, 0.12, 0, { cents: 40 }); hiss(380, 120, 0.09, 0.05, 0.8, 0, 'lowpass'); break;
      // A baneberry foretelling: the room's bass and a semitone over it, swelling, and a whisper under them.
      case 'foretell': swell('triangle', hz(bassLow()), 0.9, 0.05); swell('triangle', hz(bassLow() + 1), 0.9, 0.04, 0.05); hiss(900, 700, 0.7, 0.022, 6, 0, 'bandpass', 0.4); break;
      // ... and as it comes: a fall, low, out of key.
      case 'fulfil': tone('sawtooth', hz(bassLow() + 1), hz(bassLow() - 1), 0.32, 0.07, 0, { cut: 900 }); tone('sine', 90, 55, 0.25, 0.09); hushPad(t); break;
      // A slow beaver: two wooden tocks, unhurried.
      case 'beaver':
        if (!sample('beaver')) { tock(520, 380, 0.12); tock(470, 340, 0.1, 0.32); }
        else sample('beaver', 0.9, 0.38);
        break;
      // A share: two kalimbas, one either side, a chord's tones apart, together.
      case 'share': { const a = nextNote(t); kalimba(hz(a), 0.3, 0.05, 0, -0.25); kalimba(hz(sungFrom(a, -1)), 0.3, 0.045, 0.012, 0.25); break; }
      case 'flour':
        if (!sample('flour')) hiss(640, 170, 0.2, 0.085, 0.8, 0, 'bandpass', 0.28);
        marimba(hz(bassLow() + 7), 0.22, 0.024, s32);
        break;
      // A wonder: a music box playing the room's chord, shaped by its collectible Spw syntax & jazz lean.
      case 'wonder': {
        const plan = wonderSyntaxPlan(param);
        renderNotes(plan.notes, 0, plan.lean);
        break;
      }
      // A knock: two notes a minor second apart, falling. Out of key on purpose, so it cannot be a step
      // or the beaver; it breaks the spell. No sample — a recording cannot sit outside the chapter's key.
      // A knock: two notes a minor second apart, out of key. Scored (the trial), its size is heard: a pigeon's
      // brush is higher, shorter and lighter than a stone's thud, by how far it tilts the pie. Otherwise as it was.
      case 'knock': {
        const k = designOn() ? clamp((Number(param) || 0.4) - 0.4, -0.3, 0.4) : 0;
        const f = 2 ** (-k * 1.2);
        const dur = 1 + k;
        const vol = 1 + k * 0.6;
        tone('sine', 108 * f, 50 * f, 0.24 * dur, 0.16 * vol, 0, { attack: 0.003, cents: 12 });
        tone('sine', 114.5 * f, 53 * f, 0.2 * dur, 0.12 * vol, 0.012, { attack: 0.004, cents: 8 });
        hiss(460 * f, 120, 0.16 * dur, 0.07 * vol, 1);
        hushPad(t);
        break;
      }
      // A scheme foiled: Mr. BaneWAP's plans going down, then the line coming back up on the pulse.
      case 'foil': { tone('square', 520, 180, 0.2, 0.07, 0, { cut: 1200 });
        // Scored: the off switch is the pie side's biggest score, and was quieter than any WAP. The room's bass gives
        // it a floor, and the line lands on a chord rather than a single note.
        if (designOn()) { tone('triangle', hz(bassLow()), hz(bassLow()) * 0.98, 0.4, 0.13, 0, { attack: 0.006, cents: 0 }); vibes(hz(sungTone(2) + 12), 0.5, 0.035, answer, -0.15); vibes(hz(sungTone(4) + 12), 0.55, 0.03, answer, 0.15); }
        const a = nextNote(t); celesta(hz(a), 0.2, 0.05, answer); celesta(hz(sungFrom(a)), 0.3, 0.045, pulseFrom(t)(1), 0.1); break; }
      // The Egg: a hum belonging to no chapter's key.
      case 'egg': tone('sine', 130.8, 131.2, 0.5, 0.1, 0, { attack: 0.08, cents: 0, side: -0.15 }); tone('sine', 196, 196.5, 0.5, 0.07, 0.03, { attack: 0.08, cents: 0, side: 0.15 }); break;
      // The spill: the pie goes down, the floor takes it, then home — five, three, one. Exactly one.
      case 'spill': {
        tone('triangle', 460, 46, 0.5, 0.22);
        hiss(1400, 150, 0.4, 0.12, 1, 0, 'bandpass', 0.2);
        sample('spill', 1, 0.14);
        hushPad(t);
        const home = toPulse(t, 0.5);
        (sound.minor ? [7, 3, 0] : sound.open ? [7, 5, 0] : [7, 4, 0]).forEach((semi, k) => celesta(hz(semi), k === 2 ? 1.1 : 0.5, 0.04, home + k * sixteenth() * 2, (1 - k) * 0.15));
        break;
      }
      // Maneuvering tricks: vault clears over hazards, hang-apex suspension, imaginary panes, pierce shots, shield warmth, bank scores.
      case 'trick': {
        const info = typeof param === 'object' && param ? param : { kind: String(param || 'hop_clear') };
        const plan = trickPlan(info.kind, info);
        if (info.kind === 'mime_glass') hiss(4800, 7400, 0.16, 0.016, 4, 0, 'highpass', 0.35);
        else if (info.kind === 'frill_catch') hiss(1200, 480, 0.09, 0.024, 1.4);
        // A trick is the carrier's own move: with themes on, it leans the way they do; otherwise the way the trick does.
        renderNotes(plan.notes, info.inTime ? answer : 0, JAZZ_LEANS[sound.carrier] ? sound.carrier : info.kind);
        if (sound.carrier && (info.chain >= 3 || info.clears >= 2)) {
          const flourish = themeFlourishPlan(sound.carrier, info.kind);
          if (flourish?.notes?.length) {
            renderNotes(flourish.notes, answer + sixteenth() * 2, JAZZ_LEANS[sound.carrier] || 'poised_69');
          }
        }
        break;
      }
      // Power-up story signature: scheduled one pulse after pickup so item feel and narrative rule both sound clearly.
      case 'power_story': {
        const plan = powerStoryPlan(param && typeof param === 'object' ? param : null);
        if (plan.notes.length) renderNotes(plan.notes, answer, plan.role);
        break;
      }
      // Obstacles dodged cleanly: resolves its story tension (Bane chromatic resolve, Bone open fifth, Boon major sixth).
      case 'story_pass': {
        const info = typeof param === 'object' && param ? param : { kind: String(param || '') };
        const plan = obstacleStoryPlan(info.kind);
        if (plan?.notes?.length) renderNotes(plan.notes, 0, plan.lean);
        break;
      }
      // Warm furrow stepped on: cozy toast resonance, blooming brighter when caramelizing a tilt.
      case 'furrow': {
        const tilting = Boolean(typeof param === 'object' && param?.tilting);
        marimba(hz(bassLow() + 12), 0.24, 0.045);
        vibes(hz(sungTone(tilting ? 4 : 2) + 12), tilting ? 0.36 : 0.24, 0.024, s32);
        if (tilting) celesta(hz(sungTone(6) + 12), 0.3, 0.018, s32 * 2);
        break;
      }
      // Stepping in a puddle: wet hollow drop & rush.
      case 'splash':
        hiss(1600, 380, 0.14, 0.036, 1.8, 0, 'bandpass', 0.2);
        tone('sine', 210, 82, 0.12, 0.045, 0, { cents: 20 });
        break;
      // Audio Easter Eggs: mathematical prophecies, golden spirals, infinite sliver tin, celestial egg harmonics, and theme flourishes.
      case 'easter_egg': {
        const info = typeof param === 'object' && param ? param : { kind: String(param || 'pi') };
        const plan = easterEggPlan(info.kind, info);
        if (plan?.notes?.length) {
          renderNotes(plan.notes, plan.delay || 0, plan.lean || sound.carrier || 'poised_69');
        }
        if (info.kind === 'egg_warmth') {
          tone('sine', 130.81, 131.2, 0.7, 0.08, 0, { attack: 0.09, cents: 0, side: -0.2 });
          tone('sine', 196.0, 196.5, 0.7, 0.06, 0.04, { attack: 0.09, cents: 0, side: 0.2 });
          tone('sine', 317.0, 318.0, 0.6, 0.035, 0.08, { attack: 0.12, cents: 2, side: 0 });
        }
        break;
      }
      // A character's thematic flourish during play (e.g. on tricks, streaks, or meeting milestones):
      case 'theme_flourish': {
        const who = typeof param === 'string' ? param : (param?.who || sound.carrier || 'boof');
        const plan = themeFlourishPlan(who, param?.event || 'trick');
        if (plan?.notes?.length) {
          renderNotes(plan.notes, answer, JAZZ_LEANS[who] || 'poised_69');
        }
        break;
      }
      // The carrier's three steps, already planned (pie/tune/personality.mjs).
      case 'voice': {
        const plan = typeof param === 'object' ? param : null;
        if (plan?.notes?.length) renderNotes(plan.notes, 0, plan.lean || 'poised_69');
        break;
      }
      default: break;
    }
    if (WORTH[kind]) swellPad(t, WORTH[kind]);
  } catch { /* silent play still counts */ }
}

/* ─── Scored: what the story is doing, heard (the sound-design trial; .spw/surfaces/scored.spw) ───
 * Four hooks the lanes call. Each tells the ear something true, never decoration:
 *   shelfColor     the five shelves (valence-shelves.mjs) colour the bed: a boon lean brighter and roomier, a bone lean
 *                  darker and closer to the fundamental, a bonk lean drier and struck, a honk lean with more echo, a bane
 *                  lean forward and close, as an announcement is. The key never changes for it: the minor stays the
 *                  mimes' cue, and bane is never a mode of its own.
 *   chainSting     a shelf's motivation sets off: a short sting in the shelf's own voice, and when its chain completes,
 *                  a fuller cadence on bar 4 while the lanes are pulsing (at once, if they are not). A bonk link ends
 *                  on bane's semitone; a honk link's echo is boon's colour, a beat late; a bone cadence puts the
 *                  tension down on the fifth, then the root. Stings tire the ear like everything else.
 *   tropeMotif     each trope has a leitmotif drawn from its name, and it grows as the trope does: seeded, one note far
 *                  off; hinted, an interval; named, the motif; turned, the motif inverted over the sixth; paid off, the
 *                  motif home to its root. A refrain the parser finds recurring across the book (rhymes.json, read by
 *                  trope-reveal.mjs) is heard as the motif's tail coming back, quieter each time.
 *   cadenceVoice   a character's own time (spw-cadence.mjs) as a quiet voice in the lanes: one at a time, rarely. The mime
 *                  is the rest (the groove drops a bar); the figure in plain lines is unvoiced.
 * Silent unless the trial is on and sound is on, and only ever from a context a gesture started. Each has a pure plan
 * (shelfColorParams, stingPlan, motifPlan, cadencePlan) that a check reads without a speaker. */

let designOverride = null;
/** For the audition page and checks: force the scored hooks on (true), off (false), or back to the switch (null). */
export function setSoundDesign(on) { designOverride = on == null ? null : Boolean(on); }
const designCache = { at: -1e9, on: false };
/** The trial switch (reading-switches.mjs, saved resolved map, as the game reads it) and the game's own sound setting. */
function designOn() {
  if (designOverride !== null) return designOverride;
  const now = Date.now();
  if (now - designCache.at < 2000) return designCache.on;
  let on = false;
  try {
    const store = globalThis.localStorage;
    const sw = JSON.parse(store?.getItem('lore.switches.v1') || 'null');
    const rec = JSON.parse(store?.getItem('lore.pie.v1') || 'null');
    on = sw?.resolved?.['sound-design'] === 'on' && rec?.sound !== false;
  } catch { on = false; }
  Object.assign(designCache, { at: now, on });
  return on;
}
const scoredLive = () => Boolean(audio && audio.state === 'running' && designOn());

export const SCORED_SHELVES = Object.freeze(['boon', 'bane', 'bone', 'bonk', 'honk']);
const NEUTRAL = Object.freeze({ bright: -6, room: 0.5, echo: 0.22, wet: 0.1, padTone: 1, dry: 0, mode: 'unchanged' });

/**
 * The bed's colour for a five-shelf vector, unplayed. An even (or empty) vector is the bed as it always was. Every
 * value stays in its range, and none of them is a key or a mode.
 * @param {Record<string, number>} [v]
 */
export function shelfColorParams(v = {}) {
  const raw = SCORED_SHELVES.map((k) => Math.max(0, Number(v?.[k]) || 0));
  const sum = raw.reduce((a, b) => a + b, 0);
  if (!sum) return { ...NEUTRAL };
  const [boon, bane, bone, bonk, honk] = raw.map((x) => x / sum - 0.2);   // the lean away from even
  return {
    bright: clamp(-6 + 5 * boon - 3 * bone + 1.5 * bane, -9, -3),
    room: clamp(0.5 + 0.4 * boon - 0.5 * bonk - 0.25 * bane + 0.15 * bone, 0.3, 0.75),
    echo: clamp(0.22 + 0.32 * honk - 0.15 * bonk, 0.12, 0.38),
    wet: clamp(0.1 + 0.12 * honk - 0.06 * bonk, 0.06, 0.16),
    padTone: clamp(1 + 0.6 * boon - 0.4 * bone, 0.7, 1.4),
    dry: clamp(1.2 * bonk, 0, 0.6),
    mode: 'unchanged'
  };
}

/** The shelves colour the bed, slowly (a lean is a lean, not a cut). Off, the bed goes back to how it always was. */
export function shelfColor(v) {
  try {
    const p = designOn() ? shelfColorParams(v) : { ...NEUTRAL };
    sound.dry = p.dry;
    sound.padTone = p.padTone;
    if (!audio || audio.state !== 'running' || !bus) return p;
    const t = audio.currentTime;
    bus.soft?.gain.setTargetAtTime(p.bright, t, 1.4);
    bus.roomOut.gain.setTargetAtTime(p.room, t, 1.4);
    bus.feedback?.gain.setTargetAtTime(p.echo, t, 1.4);
    bus.wet?.gain.setTargetAtTime(p.wet, t, 1.4);
    return p;
  } catch { return null; }
}

/* A sting is a few notes, each named by where it sits in the room's chord (tone: the i-th tone it sings; bass: the
 * room's bass and an offset in semitones), so it is always in key, whatever the chapter. */
const STINGS = Object.freeze({
  boon: { set: [{ voice: 'vibes', tone: 2, at: 0, dur: 0.35, vol: 0.03 }, { voice: 'vibes', tone: 4, at: 2, dur: 0.45, vol: 0.026, glimpse: true }],
    done: [{ voice: 'vibes', tone: 5, at: 4, dur: 0.4, vol: 0.024 }, { voice: 'musicBox', tone: 6, at: 6, dur: 0.9, vol: 0.022 }] },
  bane: { set: [{ voice: 'swell', bass: 0, at: 0, dur: 0.55, vol: 0.026 }, { voice: 'swell', bass: 1, at: 0, dur: 0.55, vol: 0.018 }],
    done: [{ voice: 'swell', bass: 1, at: 4, dur: 0.4, vol: 0.02 }, { voice: 'tone', bass: 0, at: 6, dur: 0.7, vol: 0.03 }] },
  bone: { set: [{ voice: 'marimba', bass: 0, at: 0, dur: 0.25, vol: 0.045 }, { voice: 'marimba', bass: 5, at: 2, dur: 0.3, vol: 0.036 }],
    done: [{ voice: 'marimba', bass: 7, at: 4, dur: 0.3, vol: 0.032 }, { voice: 'marimba', bass: 0, at: 6, dur: 0.5, vol: 0.036 }] },
  bonk: { set: [{ voice: 'tock', at: 0, vol: 0.045 }, { voice: 'celesta', tone: 4, at: 1, dur: 0.2, vol: 0.02 }, { voice: 'swell', bass: 1, at: 3, dur: 0.35, vol: 0.016 }],
    done: [{ voice: 'tock', at: 3, vol: 0.04 }, { voice: 'tock', at: 6, vol: 0.035 }, { voice: 'celesta', tone: 3, at: 8, dur: 0.6, vol: 0.022 }] },
  honk: { set: [{ voice: 'honk', tone: 1, at: 0, dur: 0.1, vol: 0.028 }, { voice: 'honk', tone: 2, at: 4, dur: 0.1, vol: 0.012, far: true }],
    done: [{ voice: 'honk', tone: 2, at: 6, dur: 0.1, vol: 0.026 }, { voice: 'honk', tone: 4, at: 7, dur: 0.16, vol: 0.026 }, { voice: 'honk', tone: 4, at: 11, dur: 0.16, vol: 0.011, far: true }] }
});

/**
 * One note of a shelf's sting. `at` is in sixteenths. `part` splits the announcement from the cadence.
 * @typedef {{ voice?: string, tone?: number, bass?: number, deg?: number, at?: number, dur?: number, vol?: number, far?: boolean, glimpse?: boolean, semi?: number, part?: string }} StingNote
 */

/** A shelf's sting, unplayed: its notes (at in sixteenths), the fuller cadence added when the chain completes.
 * @param {string} shelf
 * @param {{ complete?: boolean }} [opts]
 * @returns {StingNote[]}
 */
export function stingPlan(shelf, { complete = false } = {}) {
  const s = STINGS[shelf];
  if (!s) return [];
  /** @type {StingNote[]} */
  const set = s.set.map((n) => ({ ...n, part: 'set' }));
  if (!complete) return set;
  return [...set, ...s.done.map((n) => /** @type {StingNote} */ ({ ...n, part: 'cadence' }))];
}

/** Two stings never crowd each other, and the same shelf heard again soon comes back softer, then not at all. */
export const STING_GAP = 0.9;
export function admitSting(state, shelf, now) {
  const s = state || { last: -9, heat: {} };
  if (now - s.last < STING_GAP) return { play: false, vol: 0, state: s };
  const was = s.heat[shelf] || { heat: 0, at: now };
  const heat = was.heat * 0.5 ** ((now - was.at) / 6);
  if (heat > 3) return { play: false, vol: 0, state: s };
  return { play: true, vol: 1 / (1 + 0.6 * heat), state: { last: now, heat: { ...s.heat, [shelf]: { heat: heat + 1, at: now } } } };
}
let stingState = null;

/** Play a few planned notes through one outlet, on the pulse. `deg` is a scale degree, `tone` a chord tone, `bass` an
 *  offset from the room's bass; `far` notes go further off and into the song's echo. */
function playPlan(notes, { vol = 1, air = 0.3, pan = 0, voice: forced = '' } = {}) {
  const t = audio.currentTime + 0.01;
  const near = kit(outlet(0, { air, song: 0.2 }), t, pan);
  const far = kit(outlet(0, { depth: 0.65, air: air + 0.2, song: 0.35 }), t, -pan * 0.5);
  const at0 = toPulse(t, 0.02);
  const s = sixteenth();
  let end = 0;
  notes.forEach((n) => {
    const k = n.far ? far : near;
    const semi = (n.bass != null ? bassLow() + n.bass : n.tone != null ? sungTone(n.tone) : n.deg != null ? degree(n.deg) : 0) + (n.semi || 0);
    const f = hz(semi);
    const at = at0 + n.at * s;
    const dur = n.dur || 0.2;
    const level = (n.vol || 0.02) * vol;
    const v = n.voice || forced || 'kalimba';
    if (v === 'tock') k.tock(520, 400, level, at);
    else if (v === 'swell') k.swell('triangle', f, dur, level, at);
    else if (v === 'tone') k.tone('sine', f, 0, dur, level, at, { attack: 0.02, cents: 0 });
    else if (v === 'honk') k.honk(f, dur, level, at);
    else (k[v] || k.kalimba)(f, dur, level, at);
    if (n.glimpse) k.hiss(5200, 7800, 0.16, level * 0.5, 4, at, 'bandpass', 0.3);
    end = Math.max(end, at + dur);
  });
  return end;
}

/** A shelf's motivation sets off (valence-shelves.mjs chainStep): its sting; a fuller cadence when the chain completes.
 *  While the lanes are pulsing, that cadence waits for bar 4 of the phrase. With no pulse (an audition), it lands at once. */
export function chainSting(shelf, { complete = false } = {}) {
  try {
    if (!scoredLive() || !STINGS[shelf]) return false;
    const gate = admitSting(stingState, shelf, audio.currentTime);
    stingState = gate.state;
    if (!gate.play) return false;
    const air = shelf === 'bonk' ? 0.08 : shelf === 'honk' ? 0.4 : 0.28;
    playPlan(stingPlan(shelf), { vol: gate.vol, air });
    if (complete) {
      const cadence = { shelf, vol: gate.vol, air };
      if (audio.currentTime - pulseSeen < 1.2) pendingCadence = cadence;
      else playPlan(stingPlan(shelf, { complete: true }).filter((n) => n.part === 'cadence'), { vol: gate.vol, air });
    }
    return true;
  } catch { return false; }
}

/* A trope's motif comes from its name: four notes, a step or a small leap at a time, inside an octave. The same trope
 * is always the same tune, in whatever key the chapter is in. */
const nameHash = (text) => {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
/** A foreshadow's parked scale degree, 1 through 5, never the root. The same id is always the same degree. @param {string} id */
export function foreshadowDegree(id) {
  return (nameHash(String(id || 'mark')) % DEBT_PCS.length) + 1;
}

/**
 * Where a foreshadow stands. `appearances` are the chapters that carry the mark.
 * A whisper or a glimpse may sound before the last of them. Only that last chapter
 * may put the degree on a downbeat; a mark that lives in one chapter waits for its turnaround.
 * The turned rung (the chapter before the last, or the same chapter before the turnaround) is what
 * may borrow a backdoor or a tritone. Held plot is not in this list: a chapter that never appears owes nothing.
 * @param {string} id
 * @param {{ chapter?: number, appearances?: number[], movement?: string }} [opts]
 */
export function foreshadowPlan(id, { chapter = 1, appearances = [], movement = '' } = {}) {
  const degree = foreshadowDegree(id);
  const chs = [...new Set((appearances || []).map((n) => Math.floor(Number(n))).filter((n) => n > 0))].sort((a, b) => a - b);
  const chapterN = Math.max(1, Math.floor(Number(chapter) || 1));
  if (!chs.length) return { id: String(id || ''), degree, stage: 'whisper', mayLand: false, turned: false, first: null, last: null, appearances: [] };
  const first = chs[0];
  const last = chs[chs.length - 1];
  const idx = chs.indexOf(chapterN);
  const onlyHere = chs.length === 1;
  const mayLand = chapterN === last && (!onlyHere || movement === 'turnaround');
  let stage = 'glimpse';
  if (idx < 0 || chapterN < first) stage = 'whisper';
  else if (idx === 0 && !onlyHere) stage = 'whisper';
  else if (mayLand) stage = 'reveal';
  else if (chapterN === last || idx === chs.length - 2) stage = 'passage';
  return { id: String(id || ''), degree, stage, mayLand, turned: stage === 'passage', first, last, appearances: chs };
}

const foreshadowAt = new Map();
/** The plant, once, far off, at seed volume. A chapter that may already land the degree stays quiet here: the phrase lands it. */
export function foreshadowHear(id, { chapter = 1, appearances = [] } = {}) {
  try {
    if (!scoredLive() || !id) return false;
    const plan = foreshadowPlan(id, { chapter, appearances, movement: 'opening' });
    if (plan.mayLand) return false;
    const now = audio.currentTime;
    if (now - (foreshadowAt.get(id) ?? -99) < 6) return false;
    foreshadowAt.set(id, now);
    playPlan([{ deg: plan.degree, at: 0, dur: 0.5, vol: 0.016, far: true }], { voice: 'celesta', air: 0.42 });
    return true;
  } catch { return false; }
}

/** A trope's motif, in scale degrees. @param {string} id */
export function tropeShape(id) {
  const h = nameHash(id);
  const notes = [h % 3];
  [2, 5, 8].forEach((bit) => {
    const m = ((h >>> bit) % 5) - 2;
    notes.push(clamp(notes[notes.length - 1] + (m || 1), -2, 7));
  });
  return notes;
}
export const TROPE_STAGES = Object.freeze(['seed', 'hint', 'named', 'turned', 'paid']);
const TROPE_VOICES = Object.freeze(['celesta', 'vibes', 'marimba', 'kalimba', 'musicBox']);
const refrainCount = (r) => clamp(Math.round(Number(typeof r === 'number' ? r : r?.count ?? r?.instances?.length ?? (r ? 2 : 0)) || 0), 0, 3);

/**
 * A trope's motif at a stage, unplayed: { voice, notes }. It grows: seed one note far off, hint an interval, named
 * the motif, turned the motif inverted over the sixth, paid the motif home to its root. A refrain (stage named and
 * after) brings the last two notes back, quieter each time, at most three times.
 * @param {string} id @param {number} stageIndex @param {{ refrain?: unknown }} [opts]
 */
export function motifPlan(id, stageIndex, { refrain = null } = {}) {
  const stage = clamp(Math.round(Number(stageIndex) || 0), 0, 4);
  const shape = tropeShape(id);
  const voice = TROPE_VOICES[nameHash(`${id}:voice`) % TROPE_VOICES.length];
  /** @type {{ deg?: number, bass?: number, at: number, dur: number, vol: number, far?: boolean, voice?: string }[]} */
  let notes = [];
  if (stage === 0) notes = [{ deg: shape[0], at: 0, dur: 0.5, vol: 0.016, far: true }];
  else if (stage === 1) notes = [{ deg: shape[0], at: 0, dur: 0.4, vol: 0.02 }, { deg: shape[1], at: 2, dur: 0.55, vol: 0.02 }];
  else if (stage === 2) notes = shape.map((d, i) => ({ deg: d, at: i * 2, dur: 0.32, vol: 0.024 }));
  else if (stage === 3) notes = [...shape.map((d, i) => ({ deg: 2 * shape[0] - d, at: i * 2, dur: 0.32, vol: 0.024 })), { bass: 9, at: 0, dur: 1.4, vol: 0.018, voice: 'tone' }];
  else notes = [...shape.map((d, i) => ({ deg: d, at: i * 2, dur: 0.3, vol: 0.024 })), { deg: 3, at: 8, dur: 0.3, vol: 0.022 }, { deg: 5, at: 10, dur: 0.9, vol: 0.026 }, { bass: 0, at: 8, dur: 1.4, vol: 0.02, voice: 'tone' }];
  const times = stage >= 2 ? refrainCount(refrain) : 0;
  const melody = notes.filter((n) => n.deg != null);
  const tail = melody.slice(-2);
  const after = Math.max(...notes.map((n) => n.at)) + 4;
  for (let k = 0; k < times; k += 1) tail.forEach((n, i) => notes.push({ deg: n.deg, at: after + k * 6 + i * 2, dur: n.dur, vol: n.vol * 0.6 ** (k + 1), far: true }));
  return { voice, notes, stage: TROPE_STAGES[stage] };
}

/** A trope, heard at the stage it has reached (trope-reveal.mjs). Once in a while per trope: a motif is a reminder.
 *  `again` lifts the gap (the audition page, to hear one trope grow). */
export const TROPE_GAP = 6;
const tropeAt = new Map();
export function tropeMotif(tropeId, stageIndex, { refrain = null, again = false } = {}) {
  try {
    if (!scoredLive() || !tropeId) return false;
    const now = audio.currentTime;
    if (!again && now - (tropeAt.get(tropeId) ?? -99) < TROPE_GAP) return false;
    tropeAt.set(tropeId, now);
    const plan = motifPlan(tropeId, stageIndex, { refrain });
    const notesToPlay = sound.jazz ? inflectGesture(plan.notes, { lean: plan.stage, amount: Math.max(1.35, jazzLean()) }) : plan.notes;
    const wait = stingState && now - stingState.last < 0.6 ? 0.6 : 0;
    const go = () => { try { if (scoredLive()) playPlan(notesToPlay, { voice: plan.voice, vol: 1, air: 0.36 }); } catch { /* the trope turns quietly */ } };
    if (wait) setTimeout(go, wait * 1000);
    else go();
    return true;
  } catch { return false; }
}

/* Whose instrument a character's own time is played on (their theme's timbre where pie-tropes gave one). */
const OWN_VOICE = Object.freeze({ boof: 'marimba', ants: 'marimba', genie: 'vibes', boon: 'honk', bane: 'honk', bonewap: 'marimba', porter: 'marimba', clerk: 'kalimba', clown: 'honk' });

/**
 * A character's own time as notes, unplayed. The figure in plain lines is unvoiced (nobody has said); the mime is the
 * rest. Everyone else: at most sixteen of their hits, accents louder, in scale degrees.
 * @param {string} who @param {{ steps?: { at: number, dur: number, accent: number, pitch: number, voice: string, rest: boolean, chord?: boolean }[], length?: number }} pattern
 */
export function cadencePlan(who, pattern) {
  if (who === 'figure') return { voiced: false, rest: false, notes: [], why: 'unvoiced: nobody has said' };
  if (who === 'mime') return { voiced: false, rest: true, notes: [], why: 'the mime is the rest' };
  const steps = (pattern?.steps || []).filter((s) => !s.rest).slice(0, 16);
  return {
    voiced: steps.length > 0,
    rest: false,
    voice: OWN_VOICE[who] || 'kalimba',
    length: Math.min(8, Number(pattern?.length) || 8),
    notes: steps.map((s) => ({ deg: s.voice === 'bass' ? null : s.pitch, bass: s.voice === 'bass', at: s.at, dur: s.dur, vol: s.accent >= 2 ? 0.02 : s.accent ? 0.016 : 0.011, chord: Boolean(s.chord) }))
  };
}
const voiceAt = new Map();
let voiceBusy = 0;
/** A character keeps their own time in the lanes, quietly, one at a time, and seldom. Returns whether anything sounded. */
export function cadenceVoice(who, pattern, { at = 0, lean = '' } = {}) {
  try {
    if (!scoredLive()) return false;
    const plan = cadencePlan(who, pattern);
    if (plan.rest) { mimeRest(); return true; }
    if (!plan.voiced) return false;
    const now = audio.currentTime;
    if (now < voiceBusy || now - (voiceAt.get(who) ?? -99) < 8) return false;
    voiceAt.set(who, now);
    const t = now + 0.01;
    const k = kit(outlet(0, { depth: 0.35, air: 0.32 }), t, jitter(0.3));
    const beat = 60 / sound.pulse;
    const start = toBeat(t, 0.03) + clamp(Number(at) || 0, 0, 2);
    const play = k[plan.voice] || k.kalimba;
    const notes = lean && sound.jazz && jazzLean() > 1
      ? inflectGesture(plan.notes, { lean, amount: Math.max(1.35, jazzLean()) })
      : plan.notes;
    let end = start;
    notes.filter((n) => n.at < plan.length + 0.2).forEach((n) => {
      const when = start + n.at * beat;
      const grace = n.semi && n.dur <= 0.07;
      const dur = grace ? n.dur : clamp(n.dur * beat * 0.85, 0.06, 0.6);
      if (n.bass) k.tone('sine', hz(bassLow()), 0, dur, n.vol * 1.4, when, { attack: 0.01, cents: 0 });
      else if (n.deg != null) {
        const f = hz(degree(n.deg) + (n.semi || 0) + (who === 'ants' ? 12 : 0));
        if (plan.voice === 'honk') k.honk(f, Math.min(dur, 0.14), n.vol, when);
        else play(f, dur, n.vol, when);
        if (n.chord) k.kalimba(hz(degree(n.deg + 2)), dur, n.vol * 0.6, when);
      }
      end = Math.max(end, when + dur);
    });
    voiceBusy = t + end + 0.5;
    return true;
  } catch { return false; }
}

/* ─── Places: where a scene is heard (pie-world.mjs SCENES `acoustic`) ───
 * A place is heard by three things, and none of them is a key: the ground underfoot, the room around the bus
 * (roomPlan), and a bed of air under everything (ambiencePlan). Its material (frost, steam, brass …) is one short
 * gesture in the chapter's own key (materialPlan). All of it is asked for by the lanes: setSoundPlace's `scene`,
 * setSoundScene at a door, setAmbience, sceneMaterial. Unasked, the lanes sound as they always have. Each has a
 * pure plan a check reads without a speaker. */

/**
 * Where a place is heard, unplayed: its ground, its room and its bed. A scene (pie-world SCENES) says for itself;
 * with none, the chapter's number says the ground, as it always has, and the room is that ground's.
 * @param {{ chapter?: number, scene?: any }} [place]
 * @returns {{ ground: string, room: ReturnType<typeof roomPlan> | null, ambience: string | null }}
 */
export function placePlan({ chapter = 1, scene = null } = {}) {
  const acoustic = scene?.acoustic;
  if (!acoustic) return { ground: chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city', room: null, ambience: null };
  return {
    ground: acoustic.ground === 'field' ? 'field' : 'city',
    room: acoustic.room ? roomPlan(acoustic) : null,
    ambience: ambiencePlan(acoustic.ambience) ? acoustic.ambience : null
  };
}

/** A door mid-chapter (a SCENES record): the place changes and the key does not. Its ground at once, its room
 *  crossed over to, and its bed if a bed is playing: a door changes which bed plays, never whether one does. */
export function setSoundScene(scene) {
  if (!scene?.acoustic) return false;
  const place = placePlan({ scene });
  sound.ground = place.ground;
  sound.room = place.room;
  try { regroundRoom(); } catch { /* the old room will do */ }
  if (ambience.name) setAmbience(place.ambience);
  return true;
}

/* The beds. `level` is the most a bed ever is (the gain on noise that peaks at one; the flutter only dips under it),
 * and each sits about where the music's bed does, far under a catch. `colour` is how the top of its band falls
 * away, `band` the hertz it lives between, `flutter` how slowly and how far it moves, `drops` the rain's own. */
const AMBIENCES = Object.freeze({
  wind: { level: 0.012, colour: 'pink', band: [120, 900], flutter: { rate: 0.13, depth: 0.55 } },
  rain: { level: 0.005, colour: 'white', band: [1800, 7500], flutter: { rate: 0.31, depth: 0.2 }, drops: { everySec: 0.6, level: 0.011 } },
  lane: { level: 0.01, colour: 'brown', band: [260, 1100], flutter: { rate: 0.19, depth: 0.3 } },
  square: { level: 0.009, colour: 'pink', band: [200, 2400], flutter: { rate: 0.09, depth: 0.35 } },
  court: { level: 0.005, colour: 'white', band: [700, 4200], flutter: { rate: 0.07, depth: 0.15 } },
  hall: { level: 0.012, colour: 'brown', band: [90, 420], flutter: { rate: 0.11, depth: 0.2 } }
});
/* A colour is a slope: decibels an octave that the top of the band falls by (a cut, never a lift). */
const COLOUR_FALL = Object.freeze({ white: 0, pink: -3, brown: -6 });

/**
 * A place's bed, unplayed, or null for a name nobody gave one.
 * @param {unknown} name
 * @returns {{ level: number, colour: string, band: number[], flutter: { rate: number, depth: number }, drops?: { everySec: number, level: number } } | null}
 */
export function ambiencePlan(name) {
  const a = typeof name === 'string' && Object.prototype.hasOwnProperty.call(AMBIENCES, name) ? AMBIENCES[name] : null;
  if (!a) return null;
  return { level: a.level, colour: a.colour, band: [...a.band], flutter: { ...a.flutter }, ...(a.drops ? { drops: { ...a.drops } } : {}) };
}

const ambience = { name: null, bed: null, timer: 0 };
const BED_AIR = 0.35;      // how much of a bed the room takes
const BED_IN = 0.6;        // a bed arrives slowly …
const BED_OUT = 0.3;       // … and leaves a little sooner
const BAND_SWAY = 900;     // cents the band moves by, at a flutter of full depth

/* One bed: the shared noise read twice (two places in it, two speeds, one either side, so it neither repeats nor
 * sits in the middle), its top cut by its colour, through its band, moving slowly: two slow sines that never line
 * up lift the band and the level together, as a gust does. Into the bus, so slow time muffles it and the mimes
 * thin it, with some of it sent to the room. */
function startBed(plan) {
  const b = ensureBus();
  const now = audio.currentTime;
  const [lo, hi] = plan.band;
  const mid = Math.sqrt(lo * hi);
  const { rate, depth } = plan.flutter;
  const fade = audio.createGain();
  fade.gain.setValueAtTime(0, now);
  fade.gain.setTargetAtTime(1, now, BED_IN);
  const sway = audio.createGain();
  sway.gain.value = plan.level * (1 - depth / 2);
  sway.connect(fade);
  fade.connect(b.input);
  const send = audio.createGain();
  send.gain.value = BED_AIR;
  fade.connect(send).connect(b.air);
  const buf = noise();
  const fall = Math.max(-18, (COLOUR_FALL[plan.colour] || 0) * Math.log2(hi / lo));
  const bands = [];
  const running = [];
  [-1, 1].forEach((side, i) => {
    const src = audio.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.playbackRate.value = i ? 0.871 : 1;
    let node = src;
    if (fall) {
      const shelf = audio.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = mid;
      shelf.gain.value = fall;
      node = node.connect(shelf);
    }
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = mid;
    band.Q.value = mid / (hi - lo);
    node = node.connect(band);
    // Two noises never add up to more than the bed's level: each a half in power, or in level where there is no side to put it on.
    const half = audio.createGain();
    half.gain.value = audio.createStereoPanner ? Math.SQRT1_2 : 0.5;
    node = node.connect(half);
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner();
      p.pan.value = side * 0.6;
      node = node.connect(p);
    }
    node.connect(sway);
    src.start(now, Math.random() * (buf.duration - 0.1));
    bands.push(band);
    running.push(src);
  });
  [[1, 0.6], [1.618, 0.4]].forEach(([times, share]) => {
    const lfo = audio.createOscillator();
    lfo.frequency.value = rate * times;
    const toLevel = audio.createGain();
    toLevel.gain.value = share * plan.level * depth / 2;
    lfo.connect(toLevel).connect(sway.gain);
    const toBand = audio.createGain();
    toBand.gain.value = share * depth * BAND_SWAY;
    lfo.connect(toBand);
    bands.forEach((band) => { if (band.detune) toBand.connect(band.detune); });
    lfo.start(now);
    running.push(lfo);
  });
  return { plan, fade, running };
}

/* A bed leaves: it fades, and then what made it is stopped and let go. */
function stopBed(bed) {
  const now = audio.currentTime;
  holdAt(bed.fade.gain, now);
  bed.fade.gain.setTargetAtTime(0, now, BED_OUT);
  setTimeout(() => {
    bed.running.forEach((node) => { try { node.stop(); } catch { /* already still */ } });
    try { bed.fade.disconnect(); } catch { /* already gone */ }
  }, BED_OUT * 8 * 1000);
}

/* The rain's drops: now and then a soft tick, a click through a filter, somewhere across the lanes and some way
 * off. Near the pulse when the lanes have marked one (never on it exactly: rain keeps no time), resting while a
 * mime passes, and tiring the ear like anything else. Unpitched on purpose, and nowhere near the voices a hidden
 * rhythm is whispered in (a tock has a tone, a drip is a sine, a shaker is higher and longer). */
function rainDrop() {
  ambience.timer = 0;
  const drops = ambience.bed?.plan.drops;
  if (!drops || !audio) return;
  ambience.timer = setTimeout(rainDrop, drops.everySec * (0.5 + Math.random()) * 1000);
  try {
    if (audio.state !== 'running') return;
    const t = audioNow() + 0.02;
    const wait = Math.max(0, beatAnchor ? pulseFrom(t, 0.03)(Math.floor(Math.random() * 4)) + jitter(0.012) : Math.random() * 0.2);
    if (t + wait < sound.rest) return;
    const heat = hear('drop', t + wait);
    if (heat === null) return;
    const k = kit(outlet(heat, { depth: 0.2 + Math.random() * 0.6, air: 0.3 }), t, jitter(0.8));
    const f = 4200 * 2 ** jitter(0.4);
    k.hiss(f, f * 0.6, 0.016, drops.level, 1.2, wait);
  } catch { /* it rains all the same */ }
}

/** The bed of the place the carry is in ('wind', 'rain', 'lane', 'square', 'court', 'hall'), or null (or a name
 *  nobody gave a bed) for none: the old one fades as the new one arrives. Say null when sound is turned off, at a
 *  pause and when the carry ends; a bed plays until it is told. It never starts the audio itself: before
 *  primeAudio() has made the context there is nothing to play it. Returns whether a bed is now playing.
 *  @param {string | null} [name] */
export function setAmbience(name = null) {
  try {
    const plan = ambiencePlan(name);
    const want = plan ? name : null;
    if (!audio) { ambience.name = null; return false; }
    if (want === ambience.name) return Boolean(want);
    const was = ambience.bed;
    clearTimeout(ambience.timer);
    Object.assign(ambience, { name: null, bed: null, timer: 0 });
    if (was) stopBed(was);
    if (!want) return false;
    ambience.bed = startBed(plan);
    ambience.name = want;
    if (plan.drops) ambience.timer = setTimeout(rainDrop, plan.drops.everySec * 1000);
    return true;
  } catch { return false; }
}

/* A material is a few notes, each named by where it sits in the room's chord (tone) or over its bass (bass), and
 * noise through a band (hiss), which has no key to be out of. `at` is in sixteenths. The eight of spw-sound.mjs. */
const MATERIALS = Object.freeze({
  glass: [{ voice: 'swell', wave: 'sine', tone: 5, at: 0, dur: 0.7, vol: 0.014 }, { voice: 'swell', wave: 'sine', tone: 6, at: 0.2, dur: 0.7, vol: 0.012 }, { voice: 'swell', wave: 'sine', tone: 7, at: 0.4, dur: 0.7, vol: 0.01 }, { voice: 'hiss', band: [6500, 7800], at: 0, dur: 0.5, vol: 0.008, q: 5 }],
  flour: [0.024, 0.018, 0.012].map((vol, i) => ({ voice: 'hiss', band: [900, 300], at: i, dur: 0.16, vol, q: 0.7 })),
  berry: [{ voice: 'vibes', tone: 2, at: 0, dur: 0.3, vol: 0.022 }, { voice: 'vibes', tone: 3, at: 1, dur: 0.3, vol: 0.022 }, { voice: 'vibes', tone: 4, at: 2, dur: 0.45, vol: 0.022 }],
  frost: [0, 0.3, 0.55, 1, 1.35, 1.9, 2.7].map((at, i) => ({ voice: 'hiss', band: [5200, 4400], at, dur: 0.012, vol: 0.018 - 0.0015 * i, q: 3 })),
  ink: [{ voice: 'swell', bass: 0, at: 0, dur: 0.8, vol: 0.022 }],
  brass: [{ voice: 'bar', bass: 12, at: 0, dur: 0.6, vol: 0.026 }],
  steam: [{ voice: 'hiss', band: [400, 2400], at: 0, dur: 0.7, vol: 0.024, q: 1.5 }],
  oak: [{ voice: 'marimba', bass: 12, at: 0, dur: 0.3, vol: 0.03 }, { voice: 'hiss', band: [2500, 2300], at: 0, dur: 0.03, vol: 0.012, q: 3 }]
});

/**
 * A material's gesture, unplayed: glass a high chord swelling in, flour three puffs settling, berry three notes up
 * the chord, frost a crackle, ink a swell on the room's bass, brass a struck bar on it, steam a rising hiss, oak a
 * knock on it. Empty for a material nobody voiced.
 * @param {unknown} material
 * @returns {{ voice: string, at: number, dur: number, vol: number, tone?: number, bass?: number, band?: number[], q?: number, wave?: string }[]}
 */
export function materialPlan(material) {
  const list = typeof material === 'string' && Object.prototype.hasOwnProperty.call(MATERIALS, material) ? MATERIALS[material] : [];
  return list.map((n) => ({ ...n, ...(n.band ? { band: [...n.band] } : {}) }));
}

/** A place's material, once, as it begins: in the chapter's key, far off and into the place's own room, tiring the
 *  ear like anything else. With `after` (seconds: a cadence finishing) it waits and lands where the chapter's
 *  motif does; otherwise on the next pulse. Returns whether anything sounded. */
export function sceneMaterial(material, pan = 0, { after = 0 } = {}) {
  try {
    const plan = materialPlan(material);
    if (!plan.length || !audio || audio.state !== 'running') return false;
    const wait = clamp(Number(after) || 0, 0, 4);
    const t = audio.currentTime + 0.05 + wait;
    const heat = hear(`material:${material}`, t);
    if (heat === null || heat > 2) return false;
    const k = kit(outlet(heat, { depth: 0.25, air: 0.45, song: 0.15 }), t, clamp(Number(pan) || 0, -0.9, 0.9));
    const first = wait ? 0 : toPulse(t, 0.02);
    const s = sixteenth();
    plan.forEach((n) => {
      const at = first + n.at * s;
      if (n.voice === 'hiss') { k.hiss(n.band[0], n.band[1], n.dur, n.vol, n.q, at, 'bandpass', 0.25); return; }
      const f = hz(n.bass != null ? bassLow() + n.bass : sungTone(n.tone));
      if (n.voice === 'swell') k.swell(n.wave || 'triangle', f, n.dur, n.vol, at);
      // A bar: its note and the odd partials of bronze, the higher dying the sooner (as a post rings).
      else if (n.voice === 'bar') [[1, 1, 1, 0], [2.76, 0.4, 0.46, -0.15], [5.4, 0.15, 0.18, 0.15]].forEach(([part, len, share, side]) => k.tone('sine', f * part, 0, n.dur * len, n.vol * share, at, { attack: 0.003, side }));
      else (k[n.voice] || k.kalimba)(f, n.dur, n.vol, at);
    });
    return true;
  } catch { return false; }
}
