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

let audio = null;
let bus = null;
let noiseBuffer = null;
const sound = { root: 293.66, minor: false, ground: 'field', muffled: false, thin: false, pulse: 96, swing: 0.5, motif: null };
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

function setHarmony(sigil) {
  const base = COLOURS[sigil] || COLOURS['.'];
  const own = sound.minor && base.minor;
  const colour = own || base;
  const fall = (pc) => (sound.minor && !own ? (FALLS[pc] ?? pc) : pc);
  const scale = sound.minor ? MINOR : MAJOR;
  const pcs = [...new Set(colour.pcs.map(fall))].sort((a, b) => a - b);
  let sung = pcs.filter((pc) => scale.includes(pc));
  if (sung.length < 2) sung = [...new Set([...sung, 0, 7])].sort((a, b) => a - b);
  Object.assign(harmony, { sigil: COLOURS[sigil] ? sigil : '.', bass: fall(colour.bass), pcs, sung });
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
  const scale = sound.minor ? MINOR : MAJOR;
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
  if (!sound.minor) return semi;
  const pc = ((semi % 12) + 12) % 12;
  return semi - pc + (FALLS[pc] ?? pc);
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

function context() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  audio = audio || new AudioCtx();
  if (audio.state !== 'running') audio.resume().catch(() => {});
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
function roomImpulse(ground) {
  const sr = audio.sampleRate;
  const field = ground === 'field';
  const secs = field ? 1.8 : 1.2;
  const n = Math.floor(sr * secs);
  const ir = audio.createBuffer(2, n, sr);
  const early = field ? [[0.006, 0.45]] : [[0.009, 0.5], [0.017, 0.38], [0.026, 0.3], [0.041, 0.22], [0.057, 0.15]];
  for (let c = 0; c < 2; c += 1) {
    const d = ir.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i += 1) {
      const t = i / sr;
      const darken = Math.min(1, t / secs);
      lp += (field ? 0.5 - 0.42 * darken : 0.68 - 0.5 * darken) * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t * (field ? 3.8 : 5.4)) * Math.min(1, t / (field ? 0.025 : 0.01));
    }
    early.forEach(([at, g], k) => {
      const i = Math.floor((at + (k % 2 === c ? 0 : 0.0011)) * sr);
      if (i < n) d[i] += g * (k % 2 === c ? 1 : 0.55);
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
  room.buffer = roomImpulse(sound.ground);
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
  bus = { input, muffle, thin, air, room, roomOut, song, songA, songB, ground: sound.ground };
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

/** A new room when the ground changes: the field's air, or the city's walls. */
function regroundRoom() {
  if (!bus || bus.ground === sound.ground) return;
  const room = audio.createConvolver();
  room.buffer = roomImpulse(sound.ground);
  bus.air.connect(room).connect(bus.roomOut);
  bus.air.disconnect(bus.room);
  bus.room = room;
  bus.ground = sound.ground;
}

/** Where the carry is: the chapter's key, pulse and ground, and whether the mimes hold it. With `after`
 *  (seconds), the chord held under the carry stays in the old key that long, while a cadence finishes there. */
let placeAfter = 0;
export function setSoundPlace({ chapter = 1, held = false, level = null, after = 0 } = {}) {
  sound.root = level?.root || ROOTS[(chapter - 1) % ROOTS.length] || 293.66;
  sound.pulse = level?.tempo || PULSES[(chapter - 1) % PULSES.length] || 96;
  sound.swing = clamp((Number(level?.swing) || 50) / 100, 0.5, 0.67);
  sound.motif = Array.isArray(level?.motif) && level.motif.length ? level.motif : null;
  line.motifAt = 0;
  sound.minor = held;
  sound.ground = chapter <= 3 || chapter === 7 || chapter === 14 ? 'field' : 'city';
  line.last = -9;
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
const TIRES = Object.freeze({ step: 1.3, land: 1, flour: 1, throw: 0.9, hop: 0.7, knock: 0.7, catch: 0.6, deft: 0.6, glass: 0.5, post: 0.5, ramp: 0.5, wap: 0.45, 'land-pulse': 0.35 });
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
  step: 0.03, land: 0.05, flour: 0.12, throw: 0.08, hop: 0.12, knock: 0.1, squash: 0.06, wap: 0.16,
  catch: 0.28, deft: 0.25, glass: 0.4, post: 0.32, ramp: 0.2, berry: 0.35, sweet: 0.4, share: 0.28,
  wonder: 0.45, bone: 0.18, foretell: 0.5, fulfil: 0.3, beaver: 0.25, foil: 0.25, egg: 0.6, spill: 0.3
});

/* How much of each sound the song's echo repeats: the sung things, a little; the struck things, nothing. */
const SONG = Object.freeze({ catch: 0.2, deft: 0.14, glass: 0.3, post: 0.2, berry: 0.26, sweet: 0.26, share: 0.2, wonder: 0.34 });

/** Where one sound goes: a level and an edge that soften as the ear tires and with distance, then
 *  into the bus, and some of it into the room. Far off, less of a sound reaches you directly while
 *  the room stays about as loud, so the far is quieter, darker, and more room than sound. */
function outlet(heat, { depth = 0, air = 0, song = 0 } = {}) {
  const b = ensureBus();
  const level = audio.createGain();
  level.gain.value = Math.max(0.45, 1 / (1 + 0.13 * heat)) * spread(0.12) * (1 - 0.6 * depth);
  const edge = audio.createBiquadFilter();
  edge.type = 'lowpass';
  edge.Q.value = 0;
  edge.frequency.value = Math.max(1800, (15000 / (1 + 0.3 * heat)) * (1 - 0.6 * depth));
  level.connect(edge).connect(b.input);
  const send = audio.createGain();
  send.gain.value = Math.min(1, (air + 0.1 * depth) / (1 - 0.6 * depth));
  edge.connect(send).connect(b.air);
  if (song > 0 && b.song) {
    const sung = audio.createGain();
    sung.gain.value = song;
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
    if (!audio.createStereoPanner) return out;
    const p = clamp(pan + side, -0.9, 0.9);
    const key = p.toFixed(2);
    if (!places.has(key)) {
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
  return { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, honk, tock, sample };
}

/* ─── The land joins in: a run of good things fills the room's chord in, a fifth, then its third, then its colour ─── */

const pad = { voices: null, bass: null, out: null, tone: null, momentum: 0, at: 0, timer: 0, shown: 0, semis: null, root: 0 };
const PAD_VOICES = 4;
const WORTH = Object.freeze({ catch: 1, deft: 1, glass: 0.8, post: 0.8, ramp: 0.8, berry: 1, sweet: 1.2, share: 1.2, wonder: 1.5, bone: 0.8, wap: 1.4 });
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
  const base = 600 + 2000 * landQuality().lift;
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
  if (pc === (sound.minor ? 3 : 4)) return 1;
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
  pad.tone.frequency.setTargetAtTime(600 + 2000 * lift, now, 0.4);
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
    tones.forEach((semi, i) => k.pluck(hz(semi), 0.036 * (i === tones.length - 1 ? 1.15 : 1), i * gap));
    if (harmony.sigil !== '?') k.tone('sine', hz(bassLow()), 0, 0.5, 0.034, harmony.sigil === '.' ? (tones.length - 1) * gap : 0, { attack: 0.02, cents: 0 });
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
    tilt.pan?.pan.setTargetAtTime(clamp(dir, -1, 1) * 0.5, now, 0.15);
    tilt.level = w;
    clearTimeout(tilt.timer);
    tilt.timer = setTimeout(stopTilt, 4000);
  } catch { /* the pie tilts all the same */ }
}

/* ─── Rhythm and theme: the land's rhythms, the found moment, a chapter's motif, Boof's three notes ─── */

/** One voice of a rhythm at a moment: each a soft thing, in the room's chord where it is pitched. */
function rhythmVoice(k, voice, strong, vol, delay = 0) {
  const { tone, hiss, celesta, marimba, vibes, kalimba, musicBox, honk, tock } = k;
  switch (voice) {
    case 'kalimba': kalimba(hz(sungTone(strong ? 2 : 3)), 0.25, 0.034 * vol, delay); break;
    case 'shaker': hiss(6200, 4600, 0.05, 0.026 * vol, 2.2, delay, 'bandpass', 0.15); break;
    case 'marimba': marimba(hz(sungTone(strong ? 0 : 1)), 0.25, 0.042 * vol, delay); break;
    case 'glass': celesta(hz(sungTone(strong ? 4 : 5) + 12), 0.3, 0.022 * vol, delay); break;
    case 'vibes': vibes(hz(sungTone(strong ? 2 : 4)), 0.35, 0.03 * vol, delay); break;
    case 'drip': tone('sine', strong ? 1500 : 1250, strong ? 720 : 610, 0.06, 0.03 * vol, delay, { attack: 0.002 }); break;
    case 'honk': honk(hz(sungTone(strong ? 2 : 3)), 0.08, 0.034 * vol, delay); break;
    case 'bass': tone('sine', hz(bassLow()), 0, 0.3, 0.075 * vol, delay, { attack: 0.01, cents: 0 }); break;
    case 'musicbox': musicBox(hz(sungTone(strong ? 4 : 5) + 12), 0.3, 0.026 * vol, delay); break;
    default: tock(strong ? 620 : 740, strong ? 440 : 530, 0.06 * vol, delay); break;
  }
}

/* The bar has a shape: a hit on a beat is the fullest, one between two beats a little less, an off-sixteenth least. */
const placeInBar = (step) => (step % 4 === 0 ? 1 : step % 2 === 0 ? 0.88 : 0.78);

/** A hit of a rhythm, `in` seconds from now (the conductor says a step a moment before it falls, so the hit is
 *  placed on the audio clock): found (groove) under the carry, louder as the chord fills in; or the land
 *  keeping it softly in its room (whisper), farther off and more of the room. */
export function rhythmHit({ voice = 'tock', strong = false, level = 1, whisper = false, pan = 0, step = 0, in: wait = 0 } = {}) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audioNow() + 0.005 + clamp(Number(wait) || 0, 0, 0.5);
    const heat = hear(`${whisper ? 'whisper' : 'groove'}:${voice}`, t);
    if (heat === null) return;
    const lift = whisper ? 0.55 : clamp(0.5 + pad.momentum / 12, 0.5, 1);
    const k = kit(outlet(heat * 0.3, { depth: whisper ? 0.55 : 0.15, air: whisper ? 0.55 : 0.22 }), t, pan + jitter(0.06));
    rhythmVoice(k, voice, strong, level * lift * (strong ? 1 : 0.72) * placeInBar(step));
  } catch { /* a rhythm kept silently is still kept */ }
}

/** A rhythm found: its bar played through, a little quicker, then the chapter's motif on a music box. */
export function rhythmFound(rhythm) {
  try {
    if (!audio || audio.state !== 'running' || !rhythm) return;
    const t = audio.currentTime + 0.02;
    const s = sixteenth() * 0.8;
    const k = kit(outlet(0, { air: 0.35 }), t, 0);
    rhythm.hits.forEach((h) => rhythmVoice(k, rhythm.voice, rhythm.steps[h] === 'X', 1.3, h * s));
    const after = 16 * s + 0.05;
    (sound.motif || [0, 4, 7, 12]).forEach((semi, i, all) => k.musicBox(hz(fallen(semi) + 12), i === all.length - 1 ? 0.8 : 0.35, 0.04, after + i * s * 2, (i - 1.5) * 0.12));
  } catch { /* found, if unheard */ }
}

/** The land's bass, step by step (the conductor says each step a moment before it falls). Bars come in fours.
 *  As a bar opens the chord breathes, and while the chord is in (its third or more) the bass sounds, with the
 *  room's own top note at full colour. With the bed on, the bass opens each four bars even when nothing is in.
 *  As the fourth bar ends the bass turns: up to its fifth, down to the fifth below, and the next bar is home. */
export function landPulse({ step = 0, bar = 0, in: wait = 0 } = {}) {
  try {
    if (step !== 0 && step !== 12 && step !== 14) return;
    if (!audio || audio.state !== 'running') return;
    const t = audioNow() + 0.005 + clamp(Number(wait) || 0, 0, 0.5);
    const { stage } = landQuality();
    const inPhrase = ((bar % 4) + 4) % 4;
    if (step === 0) {
      breathePad(t);
      if (stage < 2 && !(bed.on && inPhrase === 0)) return;
      const heat = hear('land-pulse', t);
      if (heat === null) return;
      const k = kit(outlet(heat * 0.25, { air: 0.25 }), t, 0);
      k.tone('sine', hz(bassLow()), 0, stage < 2 ? 0.3 : 0.16, 0.028 * (stage === 3 ? 1.25 : stage === 2 ? 1 : 0.8), 0, { attack: 0.015, cents: 0 });
      if (stage === 3) k.celesta(hz(harmony.pcs[harmony.pcs.length - 1] + 12), 0.22, 0.012);
      return;
    }
    if (inPhrase !== 3 || (stage < 2 && !bed.on)) return;
    if (hear('land-turn', t) === null) return;
    const k = kit(outlet(0, { air: 0.25 }), t, 0);
    k.tone('sine', hz(bassLow() + (step === 12 ? 7 : -5)), 0, 0.2, step === 12 ? 0.02 : 0.024, 0, { attack: 0.012, cents: 0 });
  } catch { /* the bar still turns */ }
}

/* What an obstacle is made of, heard once as it comes down its lane. The mimes are absent on purpose. */
const APPROACH = Object.freeze({
  stone: 'stone', pane: 'glass', frost: 'glass',
  chair: 'wood', table: 'wood', post: 'wood', spool: 'wood', beaver: 'wood', dividers: 'wood',
  throne: 'gilt',
  hole: 'hollow', ditch: 'hollow', snail: 'hollow', puddle: 'hollow',
  wasps: 'swarm', pigeon: 'odd',
  banner: 'cloth', sack: 'cloth', mimewall: 'cloth'
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
    } else k.hiss(900, 480, 0.12, 0.016, 1.2, 0, 'bandpass', 0.35);
  } catch { /* it still arrives */ }
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
    (sound.minor ? [7, 10] : [7, 9]).forEach((semi, i) => k.marimba(hz(semi), 0.24, 0.042, at(i * 2), (i - 0.5) * 0.2));
    k.tone('sine', hz(-17), 0, 0.34, 0.045, at(0), { attack: 0.012, cents: 0 });
    const home = at(4);
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
      k.celesta(hz(sound.minor ? 15 : 16), 0.7, 0.03, home, 0.12);
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

/* ─── The sounds ──────────────────────────────────────────────────── */

export function wapSound(combo = 1, pan = 0, depth = 0) {
  try {
    if (!context()) return;
    const t = audio.currentTime + 0.005;
    const heat = hear('wap', t);
    if (heat === null) return;
    const { tone, hiss, honk, celesta, sample } = kit(outlet(heat, { depth, air: AIR.wap }), t, pan + jitter(0.04));
    // Crust, high and short, over the filling. The filling always falls: a cheek meeting pie.
    sample('wap');
    tone('triangle', 380, 58, 0.22, 0.42, 0, { attack: 0.004, cents: 40 });
    hiss(1700, 200, 0.3, 0.38, 1.1, 0, 'bandpass', 0.35);
    hiss(480, 110, 0.34, 0.18, 0.7, 0.02, 'lowpass');
    // Under it, the room's bass.
    tone('sine', hz(bassLow()), hz(bassLow()) * 0.98, 0.32, 0.09, 0, { attack: 0.006, cents: 0 });
    tone('sine', hz(bassLow() - 12), 0, 0.28, 0.05, 0, { attack: 0.008, cents: 0 });
    // And the clown's delight: two honks on the pulse, chord tones a step higher for each WAP in a combo.
    const step = clamp(combo - 1, 0, 4);
    const pulse = pulseFrom(t, 0.15);
    const first = pulse(0);
    honk(hz(sungTone(2 + step)), 0.1, 0.09, first, -0.08);
    honk(hz(sungTone(3 + step)), 0.12, 0.1, pulse(1), 0.08);
    // A run of WAPs fills the same way the room does: from two, the third; from four, the room's colour.
    if (step >= 1) tone('sine', hz(sound.minor ? 3 : 4), 0, 0.18, 0.03, first, { attack: 0.012, cents: 0 });
    if (step >= 3) celesta(hz(harmony.pcs[harmony.pcs.length - 1] + 12), 0.26, 0.016, pulse(1));
    swellPad(t, WORTH.wap);
  } catch { /* a silent WAP is still a WAP */ }
}

/** Tactile micro-sounds: steps, hops, bank shots, the berries' voices, knocks, and the Egg's hum. */
export function playTone(kind, param = 1, pan = 0, depth = 0) {
  try {
    if (!audio || audio.state !== 'running') return;
    const t = audio.currentTime + 0.005;
    const heat = hear(kind, t);
    if (heat === null) return;
    const { tone, hiss, pluck, swell, celesta, marimba, vibes, kalimba, musicBox, tock, sample } = kit(outlet(heat, { depth, air: AIR[kind] ?? 0.2, song: SONG[kind] || 0 }), t, pan + jitter(0.04));
    const answer = toPulse(t);
    const s32 = sixteenth() / 2;
    switch (kind) {
      // Footsteps know the ground: a brush of grass in the field, a tick of cobble in the city; left and right differ.
      case 'step':
        if (sound.ground === 'field') {
          if (!sample('step-field')) {
            hiss(1400 + (param > 0 ? 220 : 0), 650, 0.06, 0.045, 1.1); tone('sine', 118, 70, 0.05, 0.035, 0, { cents: 40 });
          }
        } else if (!sample('step-city')) {
          tone('triangle', 150 + (param > 0 ? 14 : 0), 72, 0.04, 0.05, 0, { attack: 0.003, cents: 40 }); hiss(2800, 2000, 0.022, 0.024, 2.5);
        }
        break;
      // A catch: the line's next note on a celesta, answered on the pulse by the chord's next tone up.
      case 'catch': {
        const a = nextNote(t);
        celesta(hz(a), 0.18, 0.045);
        celesta(hz(sungFrom(a)), 0.26, 0.035, answer, 0.1);
        break;
      }
      // A hop is a plucked string; a chain climbs the room's chord, and the high hop sparkles.
      case 'hop': {
        const chain = clamp(Number(param) || 0, 0, 3);
        pluck(hz(sungTone(chain) - 12), 0.06);
        hiss(900, 2300, 0.09, 0.02, 1.4);
        if (chain >= 2) [3, 4, 5].forEach((i, k) => celesta(hz(sungTone(i) + 12), 0.22, 0.014, answer + k * s32, (k - 1) * 0.2));
        break;
      }
      // A landing: felt, and in the field a little flour.
      case 'land':
        if (!sample('land')) tone('sine', 150, 68, 0.07, 0.04, 0, { attack: 0.004, cents: 40 });
        if (sound.ground === 'field') hiss(800, 300, 0.08, 0.025, 0.7, 0, 'lowpass', 0.2);
        break;
      // A deft landing: the line leaps, on a marimba, and is answered a chord tone higher.
      case 'deft': { const a = nextNote(t, 2); marimba(hz(a), 0.3, 0.05); marimba(hz(sungFrom(sungFrom(a))), 0.36, 0.045, answer, 0.12); break; }
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
        vibes(hz(sungTone(i)), 0.4, 0.05);
        vibes(hz(sungTone(i + 1)), 0.5, 0.045, answer, 0.12);
        hiss(5200, 7800, 0.18, 0.018, 4, answer, 'bandpass', 0.3);
        line.at = sungTone(i + 1);
        line.last = t;
        break;
      }
      case 'sweet': [0, 1, 2, 3].forEach((k) => vibes(hz(sungTone(k + 3)), 0.5, 0.04, k * s32, (k - 1.5) * 0.15)); break;
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
        if (!sample('flour')) hiss(640, 170, 0.18, 0.085, 0.8, 0, 'bandpass', 0.25);
        break;
      // A wonder: a music box playing the room's chord, its shape by kind.
      case 'wonder': {
        const shape = param === 'contrivance' ? [0, 1, 2, 3] : param === 'antique' ? [0, 0, 2, 1] : param === 'artifact' ? [2, 0, 3, 1] : param === 'bracework' ? [0, 2, 1, 3] : param === 'saying' ? [3, 2, 1, 0] : [0, 1, 3, 2];
        shape.forEach((i, k) => musicBox(hz(sungTone(i + 3)), k === shape.length - 1 ? 0.7 : 0.35, 0.042, k * s32, (k - 1.5) * 0.12));
        break;
      }
      // A knock: two notes a minor second apart, falling. Out of key on purpose, so it cannot be a step
      // or the beaver; it breaks the spell. No sample — a recording cannot sit outside the chapter's key.
      case 'knock':
        tone('sine', 108, 50, 0.24, 0.16, 0, { attack: 0.003, cents: 12 });
        tone('sine', 114.5, 53, 0.2, 0.12, 0.012, { attack: 0.004, cents: 8 });
        hiss(460, 120, 0.16, 0.07, 1);
        hushPad(t);
        break;
      // A scheme foiled: Mr. BaneWAP's plans going down, then the line coming back up on the pulse.
      case 'foil': { tone('square', 520, 180, 0.2, 0.07, 0, { cut: 1200 }); const a = nextNote(t); celesta(hz(a), 0.2, 0.05, answer); celesta(hz(sungFrom(a)), 0.3, 0.045, pulseFrom(t)(1), 0.1); break; }
      // The Egg: a hum belonging to no chapter's key.
      case 'egg': tone('sine', 130.8, 131.2, 0.5, 0.1, 0, { attack: 0.08, cents: 0, side: -0.15 }); tone('sine', 196, 196.5, 0.5, 0.07, 0.03, { attack: 0.08, cents: 0, side: 0.15 }); break;
      // The spill: the pie goes down, the floor takes it, then home — five, three, one. Exactly one.
      case 'spill': {
        tone('triangle', 460, 46, 0.5, 0.22);
        hiss(1400, 150, 0.4, 0.12, 1, 0, 'bandpass', 0.2);
        sample('spill', 1, 0.14);
        hushPad(t);
        const home = toPulse(t, 0.5);
        (sound.minor ? [7, 3, 0] : [7, 4, 0]).forEach((semi, k) => celesta(hz(semi), k === 2 ? 1.1 : 0.5, 0.04, home + k * sixteenth() * 2, (1 - k) * 0.15));
        break;
      }
      default: break;
    }
    if (WORTH[kind]) swellPad(t, WORTH[kind]);
  } catch { /* silent play still counts */ }
}
