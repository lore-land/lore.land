// @ts-check
/**
 * pie/tune/scene.mjs — semantic handles as one dimension on the genre shelves.
 *
 * A handle is the word in brackets: =feel[jazz], =wap[cream], =steps[tiptoe].
 * Each chosen handle leans one shelf (boon, bane, bone, bonk, honk), the same
 * five the genre dial already tunes. The play loop stays in pie-game.mjs.
 * This folder is the scene contract: the menu reads it, the lanes feed it to
 * the shelves, and factshift.center keeps a cousin of scenePhysics in its own
 * scene-tune (field, parlour, hall, carnival, hush).
 */

/** @typedef {'boon' | 'bane' | 'bone' | 'bonk' | 'honk'} Shelf */
/** @typedef {{ shelf: Shelf, teach: string, joke?: string, nudge?: string }} Handle */

/** @type {ReadonlyArray<Shelf>} */
export const SHELVES = Object.freeze(['boon', 'bane', 'bone', 'bonk', 'honk']);

/** @type {Readonly<Record<Shelf, string>>} */
export const SHELF_GENRE = Object.freeze({
  boon: 'fairy tale',
  bane: 'absurd reality',
  bone: 'low magic',
  bonk: 'the knock that enters bane',
  honk: 'the echo that enters boon'
});

/** @type {Readonly<Record<string, Readonly<Record<string, Handle>>>>} */
export const HANDLES = Object.freeze({
  feel: {
    written: { shelf: 'bone', teach: 'The chapter keeps the pocket it was written in.' },
    jazz: { shelf: 'honk', teach: 'The upper voice quotes the chapter a beat late, the way a person repeats a joke they only half heard.', joke: 'late_quote', nudge: 'a quote that arrives late' }
  },
  swing: {
    chapter: { shelf: 'bone', teach: 'This chapter’s own lilt. The next chapter will not borrow it.' },
    straight: { shelf: 'bone', teach: 'Even eighths. Useful when you are counting. The dance will notice.' },
    lilt: { shelf: 'honk', teach: 'A light triplet. The foot arrives early and pretends it meant to.', joke: 'early_foot', nudge: 'a foot that pretends' },
    deep: { shelf: 'bonk', teach: 'The note sits back, like a reply you drafted twice and still sent.', joke: 'drafted_twice', nudge: 'a reply drafted twice' }
  },
  wap: {
    splat: { shelf: 'boon', teach: 'A slapstick crack, then the wet fall. Crust, then filling. Three recorded takes, so it is never one slap.' },
    pillow: { shelf: 'bone', teach: 'The crack is muffled, as into a cushion. The filling still arrives.', joke: 'cushion', nudge: 'a cushion' },
    cream: { shelf: 'honk', teach: 'The crack, then a slide whistle. A noisemaker brought to a meeting.', joke: 'birthday', nudge: 'a whistle at a meeting' },
    bell: { shelf: 'boon', teach: 'The crack, then a fairground ding. The prize sounds like news.', joke: 'prize', nudge: 'a prize already paid for' }
  },
  steps: {
    ground: { shelf: 'bone', teach: 'The ground underfoot. Grass is a guiro scrape. Cobble is a clave tick. The ear chooses which of the three takes.' },
    tiptoe: { shelf: 'honk', teach: 'A plucked note above that ground. The lane is still there, softer.', joke: 'tiptoe', nudge: 'a quiet exit' },
    felt: { shelf: 'bane', teach: 'Almost no attack. Socks. The scrape and the tick stay, hushed.', joke: 'socks', nudge: 'socks in the hall' },
    wood: { shelf: 'bonk', teach: 'A woodblock tock on the step. Every step announced.', joke: 'receipt', nudge: 'a read receipt' }
  },
  voicing: {
    folk: { shelf: 'boon', teach: 'Celesta and wood lead the theme. A table, not a stage.' },
    warm: { shelf: 'bone', teach: 'Vibes and a low bass. The theme sits in the parlour.' },
    bright: { shelf: 'honk', teach: 'Bells. The theme announces itself before the answer.' },
    velvet: { shelf: 'bane', teach: 'Felt hammers. The same theme, as if the room had gone to night.' }
  },
  songSpace: {
    natural: { shelf: 'bone', teach: 'The place you are already in: field, plaza, or court.' },
    close: { shelf: 'bane', teach: 'Dry and near. A voice memo recorded under a blanket.' },
    hall: { shelf: 'boon', teach: 'A concert hall. Even a small honk is handed a balcony.' }
  },
  ear: {
    open: { shelf: 'bone', teach: 'The chapter’s intervals, and the recorded takes in turn. Nothing is softened.' },
    bright: { shelf: 'honk', teach: 'A wider pentatonic, still lifted. The loudest take of each sound: the crack, the tick.', joke: 'bright', nudge: 'the loudest take' },
    warm: { shelf: 'boon', teach: 'A pentatonic, in the room, a little quieter. The middle take: the body of the sound.', joke: 'pentatonic', nudge: 'a softer tune' },
    near: { shelf: 'bone', teach: 'A triad, short, close. The middle take again, and the egg’s beating tones stay out.', joke: 'triad', nudge: 'a near triad' },
    hush: { shelf: 'bane', teach: 'That triad, shorter, the quietest take, and nothing above the room.', joke: 'hush', nudge: 'a hush' }
  },
  music: {
    quiet: { shelf: 'bone', teach: 'Only what happens. The room does not accompany you.' },
    groove: { shelf: 'honk', teach: 'Rhythms you have found, still under the carry, the way a chorus sticks after you leave.' },
    full: { shelf: 'boon', teach: 'The room’s chord, held. You are inside the song, and the song has noticed.' }
  },
  themes: {
    calls: { shelf: 'honk', teach: 'A short call, three notes, and they leave. The chapter does not answer.' },
    themes: { shelf: 'boon', teach: 'The carrier’s three steps, coloured by this chapter’s lean. The theme stays long enough to be answered.' }
  },
  cues: {
    shaped: { shelf: 'bone', teach: 'A low thing rises a step. A tall thing falls one. The warning has looked at what is coming.' },
    one: { shelf: 'boon', teach: 'One warning for everything, the same interval. You learn the sound and not the shape.' },
    off: { shelf: 'bane', teach: 'No warning. You meet the wall with your face, which is also data.' }
  },
  tap: {
    throw: { shelf: 'bonk', teach: 'A tap throws there. The hand picks the lane. The pie does the talking.' },
    go: { shelf: 'boon', teach: 'A tap walks there. You point, and the carrier believes you meant the whole way.' },
    step: { shelf: 'bone', teach: 'A tap takes one step toward it. Patience, as a button.' },
    hop: { shelf: 'honk', teach: 'A tap hops. The ground is a suggestion you declined.' },
    none: { shelf: 'bane', teach: 'A tap in the lanes does nothing. The buttons keep the job.' }
  },
  doubleTap: {
    none: { shelf: 'bone', teach: 'Two taps are two taps. The second one is not a secret.' },
    hop: { shelf: 'honk', teach: 'The second tap hops. A double-take that leaves the ground.' },
    throw: { shelf: 'bonk', teach: 'The second tap throws. The first was only looking.' },
    go: { shelf: 'boon', teach: 'The second tap walks there. Commitment, after a pause people mistake for doubt.' }
  },
  swipeUp: {
    step: { shelf: 'bone', teach: 'A quick swipe steps ahead. A slow drag still steps. Speed is the same verb, said louder.' },
    hop: { shelf: 'honk', teach: 'A quick swipe hops. A slow drag steps. One gesture, two intentions, which is how most arguments start.', joke: 'two_speeds', nudge: 'two speeds of the same hand' }
  },
  buttons: {
    middle: { shelf: 'bone', teach: 'Throw and hop sit together, where one thumb can find them both.' },
    sides: { shelf: 'bonk', teach: 'One under each thumb. The screen is the road between two decisions.' },
    ab: { shelf: 'honk', teach: 'Diagonal, the way a console sits in a lap and pretends it is still a table.' }
  },
  controls: {
    icons: { shelf: 'honk', teach: 'Pictures only. You know which is which, or you will after one confident miss.' },
    words: { shelf: 'bone', teach: 'The buttons say their names. A kindness when the screen is large or the hour is late.' }
  },
  arrows: {
    row: { shelf: 'bone', teach: 'In a row, under the road, like a sentence you can walk.' },
    sides: { shelf: 'bonk', teach: 'Split, so each thumb owns a direction and neither owns the excuse.' },
    cross: { shelf: 'boon', teach: 'A cross. Up is still ahead. The shape is the reminder.' }
  },
  controlsPlace: {
    under: { shelf: 'bone', teach: 'Under the screen, on the ground the buttons stand on.' },
    edges: { shelf: 'bonk', teach: 'At the edges, where the thumbs rest when the phone is turned on its side.' },
    over: { shelf: 'honk', teach: 'Over the lanes, see-through. The road shows through the hands.' }
  }
});

/** @param {string} key @param {unknown} value @returns {Handle | null} */
export function handleOf(key, value) {
  const row = HANDLES[key];
  if (!row) return null;
  return row[String(value)] || null;
}

/**
 * Shelf weight the explicit choices add. Defaults that were never touched add nothing,
 * so an untouched board stays the even dial the shelves already had.
 * @param {Record<string, unknown>} [view]
 * @returns {Record<Shelf, number>}
 */
export function handleVector(view = {}) {
  /** @type {Record<Shelf, number>} */
  const v = { boon: 0, bane: 0, bone: 0, bonk: 0, honk: 0 };
  Object.entries(view).forEach(([key, value]) => {
    const handle = handleOf(key, value);
    if (handle) v[handle.shelf] += 1;
  });
  return v;
}

/**
 * The genre dial, plus the handles. A missing dial weight stays 1, as the shelves
 * always read it. Each chosen handle adds a third of a notch on its shelf.
 * @param {Record<string, unknown>} [view]
 * @param {Record<string, unknown>} [genre]
 * @returns {Record<Shelf, number>}
 */
export function sceneVector(view = {}, genre = {}) {
  const handles = handleVector(view);
  const num = (/** @type {string} */ shelf) => {
    const n = Number(genre[shelf]);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };
  return {
    boon: num('boon') + handles.boon * 0.35,
    bane: num('bane') + handles.bane * 0.35,
    bone: num('bone') + handles.bone * 0.35,
    bonk: num('bonk') + handles.bonk * 0.35,
    honk: num('honk') + handles.honk * 0.35
  };
}

/**
 * How a scene wants to move. 1 is the physics as written.
 * factshift’s scene words (field, parlour, hall, carnival, hush) are this shape in words.
 * @param {Record<string, unknown>} [view]
 */
export function scenePhysics(view = {}) {
  const space = String(view.songSpace || 'natural');
  const feel = String(view.feel || 'written');
  const swing = String(view.swing || 'chapter');
  const steps = String(view.steps || 'ground');
  const wap = String(view.wap || 'splat');
  return {
    air: space === 'hall' ? 1.45 : space === 'close' ? 0.62 : 1,
    settle: feel === 'jazz' ? 0.82 : steps === 'felt' ? 1.25 : 1,
    lift: swing === 'lilt' || swing === 'deep' || wap === 'cream' || wap === 'bell' ? 1.2 : 1,
    wonder: feel === 'jazz' || steps === 'tiptoe' ? 1.35 : space === 'close' ? 0.75 : 1,
    pocket: swing === 'deep' ? 1.4 : swing === 'straight' ? 0.75 : 1,
    ground: steps === 'felt' ? 1.25 : steps === 'tiptoe' ? 0.7 : 1
  };
}
