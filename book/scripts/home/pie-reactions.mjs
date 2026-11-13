// @ts-check
/**
 * pie-reactions.mjs — how the people of the lanes answer what happens (a trial: the reactions switch). Pure: the
 * game shows a face and a caption; this chooses whose, in what mood, and what the narrator says they did.
 *
 * Three kinds of moment: a power taken (take:lit), a timed power running out (end:lit), which used to pass with
 * nothing said, and a knock (knock:post). Each has rows: who answers, in which mood, and a deed. A row may belong to
 * one carrier, to whoever is carrying, or to someone standing in the lanes; a few are for a second time, or for a
 * reader the lanes have come to know. Some answer the other way from what one would guess: a clown is glad of a
 * knock, and a mime whose wall is struck does not move.
 *
 * A deed is narration. Nobody says anything: no quotation marks, no first person, no name the land keeps back. The
 * figure in plain lines answers with a mood and no deed at all. (.spw/surfaces/reactions-in-the-lanes.spw)
 */

/** @typedef {'calm' | 'glad' | 'worried' | 'surprised' | 'thinking'} Mood */
/** @typedef {{ who: string, mood: Mood, deed: string, when?: 'first' | 'again' | 'often', only?: 'carrying' | 'standing' }} Row */

export const MOODS = Object.freeze(['calm', 'glad', 'worried', 'surprised', 'thinking']);
/** Who can answer: the characters the meanwhile panel can draw. */
export const WHO = Object.freeze(['boof', 'ants', 'genie', 'bane', 'boon', 'bonewap', 'porter', 'clerk', 'figure', 'clown', 'mime']);
const CARRIERS = Object.freeze(['figure', 'porter', 'clerk', 'genie', 'clown']);

/** @type {(who: string, mood: Mood, deed: string, when?: Row['when']) => Row} */
const row = (who, mood, deed, when) => (when ? { who, mood, deed, when } : { who, mood, deed });
/** A row for someone only while they carry the pie, or only while they stand in the lanes. */
const carrying = (/** @type {Row} */ r) => /** @type {Row} */ ({ ...r, only: 'carrying' });
const standing = (/** @type {Row} */ r) => /** @type {Row} */ ({ ...r, only: 'standing' });

/**
 * The rows. A moment's own rows come first; the family's (take, end, knock) stand behind every moment of the family.
 * @type {Readonly<Record<string, ReadonlyArray<Row>>>}
 */
export const REACTIONS = Object.freeze({
  // ─── A power taken ───
  'take:lit': [
    row('carrier', 'thinking', 'Walks a little taller. The furrows ahead come up warm.'),
    carrying(row('porter', 'glad', 'The porter shifts the pie to the lit side, as if for a guest.'))
  ],
  'take:lag': [
    row('carrier', 'calm', 'Takes the borrowed time and does not hurry it.'),
    carrying(row('clerk', 'worried', 'The clerk checks the hour twice. It is the same hour.'))
  ],
  'take:unkept': [
    row('carrier', 'surprised', 'For a moment the lanes cannot find anyone to knock.'),
    carrying(row('genie', 'thinking', 'The Genie notes that nothing is owed for a moment nobody kept.'))
  ],
  'take:warm': [row('carrier', 'glad', 'The pie settles as if somebody had been expecting it.')],
  'take:fed': [
    row('carrier', 'calm', 'Steps land softer. A whole meal will do that.'),
    row('clown', 'glad', 'The clown would rather it were pie. It is still very good.')
  ],
  'take:glimpse': [
    row('carrier', 'thinking', 'Sees the clear way a breath before needing it.'),
    standing(row('boof', 'calm', 'Boof had already gone that way. She has no opinion.'))
  ],
  'take:true_aim': [row('carrier', 'thinking', 'The needle leans toward the nearest face, as if it were a lamp.')],
  'take:echoes': [row('carrier', 'surprised', 'The grove says the last throw again, a beat late.')],
  'take:frill': [row('carrier', 'calm', 'Carries more edge than room, and minds the edge.')],
  'take:tin': [row('carrier', 'glad', 'The next slices will go further than they look.')],
  'take:level': [
    row('carrier', 'calm', 'The pie forgets it was ever tipped.'),
    carrying(row('clerk', 'glad', 'The clerk strikes a line through a slip not yet written.'))
  ],
  'take:ready': [
    row('carrier', 'glad', 'A slice is ready. Somebody ahead is about to be delighted.'),
    standing(row('clown', 'glad', 'A clown has noticed the slice before the carrier has.'))
  ],
  'take:honk': [
    row('carrier', 'surprised', 'Nine honks, in uneven time. The road steps aside.'),
    standing(row('mime', 'calm', 'A mime covers both ears, slowly, for everyone to see.'))
  ],
  'take:crust': [row('carrier', 'calm', 'The crust is fed. It shows.')],
  'take:filling': [row('carrier', 'glad', 'The filling is fed, and the pie sits heavier and happier.')],
  take: [
    row('any', 'calm', 'Takes it as one takes a thing kept before.', 'again'),
    row('any', 'thinking', 'The land has started handing things over without being asked.', 'often')
  ],

  // ─── A timed power running out: it used to end with nothing said ───
  'end:lit': [row('any', 'thinking', 'The torch-ant runs on ahead. The furrows cool behind it.')],
  'end:lag': [
    row('any', 'surprised', 'The land catches up with itself, all at once.'),
    carrying(row('clerk', 'worried', 'The clerk finds the hour has moved on without a slip.'))
  ],
  'end:unkept': [row('any', 'worried', 'The lanes can find the pie again, and remember where they were.')],
  'end:warm': [row('any', 'calm', 'The warmth goes back to wherever it is kept.')],
  'end:fed': [row('any', 'calm', 'The meal wears off. Steps tilt as steps do.')],
  'end:glimpse': [row('any', 'thinking', 'The clear way closes over, as if it had only been lent.')],
  'end:true_aim': [row('any', 'thinking', 'The needle is the carrier’s own again.')],
  end: [row('any', 'calm', 'It ends as it was lent: quietly, and on time.', 'again')],

  // ─── A knock ───
  'knock:post': [
    row('carrier', 'worried', 'Meets a bronze post that has met many.'),
    carrying(row('porter', 'calm', 'The porter nods to the post. They have worked the same gate.'))
  ],
  'knock:stone': [row('carrier', 'worried', 'Finds the stone by the oldest method there is.')],
  'knock:hole': [row('carrier', 'surprised', 'Steps into where the road is not.')],
  'knock:mime': [
    row('carrier', 'worried', 'Walks into someone who was not making a sound about it.'),
    carrying(row('clown', 'glad', 'The clown apologises with the whole body. The mime accepts with one hand.'))
  ],
  'knock:mimewall': [
    row('carrier', 'surprised', 'Finds the wall that is not there, exactly where it is.'),
    standing(row('mime', 'calm', 'The mime does not move. Both hands stay flat on it, and it holds.'))
  ],
  'knock:march': [row('carrier', 'worried', 'Meets the march. Every placard is blank but one.')],
  'knock:ditch': [row('carrier', 'surprised', 'The road dips. The pie dips after it.')],
  'knock:pane': [
    row('carrier', 'worried', 'Strikes city glass. It will go to the kiln and be forgiven.'),
    carrying(row('genie', 'thinking', 'The Genie looks at the glass as if it were a bill.'))
  ],
  'knock:throne': [row('carrier', 'worried', 'Runs into a throne that had only just arrived.')],
  'knock:chair': [row('carrier', 'surprised', 'Finds a chair pulled out for nobody yet.')],
  'knock:table': [row('carrier', 'worried', 'Meets the long table sideways.')],
  'knock:banner': [row('carrier', 'surprised', 'Walks into an announcement.')],
  'knock:subject': [row('carrier', 'worried', 'Collides with someone halfway through an errand. Both go on.')],
  'knock:snail': [row('carrier', 'thinking', 'Is stopped by a snail, which was in no hurry to be struck.')],
  'knock:banerose': [row('carrier', 'worried', 'Walks into a rose that was sent to the other side. It has kept its thorns.')],
  'knock:clerk': [
    row('carrier', 'worried', 'Is handed a slip. It has a word at the top.'),
    carrying(row('clerk', 'thinking', 'The clerk writes a slip for the clerk, and fills in the cause.'))
  ],
  'knock:dividers': [row('carrier', 'worried', 'Is measured, briefly, by brass pie-dividers.')],
  'knock:spool': [row('carrier', 'surprised', 'A spool crosses at ankle height, on business of its own.')],
  'knock:pigeon': [row('carrier', 'surprised', 'A pigeon and the pie disagree about the air.')],
  'knock:wasps': [row('carrier', 'worried', 'The wasps have opinions about the filling.')],
  knock: [
    // How each carrier takes any knock: the clown the other way round.
    carrying(row('clown', 'glad', 'The clown counts it as a WAP that went the wrong way, and is delighted.')),
    carrying(row('porter', 'calm', 'The porter barely notes it. Storms weigh more.', 'again')),
    carrying(row('clerk', 'worried', 'The clerk will have this one filed by evening.', 'again')),
    carrying(row('genie', 'thinking', 'The Genie reckons what the knock would cost to undo.', 'again')),
    row('any', 'worried', 'The same lesson, kept a second time.', 'again'),
    row('any', 'thinking', 'The lanes are getting to know this pie.', 'often')
  ]
});

/** The moments that have rows of their own. */
export const MOMENTS = Object.freeze(Object.keys(REACTIONS).filter((key) => key.includes(':')));

/** What makes a deed narration and nothing else. */
export const GUARDS = Object.freeze({
  spoken: /["“”«»]|\b(I|me|my|mine|we|us|our)\b/,
  held: /wap\s*-?\s*boy|wabo|\bhat\b|\beggs?\b|dregg|\bfigure\b/i,
  away: /\b(north|south|east|west)\w*\b|\bwages?\b|\bprice[sd]?\b|\bchild(ren)?\b/i,
  longest: 84
});

/** What is wrong with a deed, in words. @param {string} deed @returns {string[]} */
export function deedProblems(deed) {
  /** @type {string[]} */
  const problems = [];
  if (deed.length > GUARDS.longest) problems.push(`longer than ${GUARDS.longest} characters`);
  if (GUARDS.spoken.test(deed)) problems.push('somebody speaks in it');
  if (GUARDS.held.test(deed)) problems.push('it names something the land keeps back');
  if (GUARDS.away.test(deed)) problems.push('it uses a word the book does not');
  return problems;
}

/**
 * The moments a power implies when it is taken, the most particular first: what it does for a while, then what it
 * charges, then what it does at once, then what it feeds.
 * @param {{ timed?: Record<string, number>, charges?: Record<string, number>, acts?: string[], amounts?: Record<string, number> } | null | undefined} power
 * @returns {string[]}
 */
export function powerMoments(power) {
  if (!power) return [];
  const words = [...Object.keys(power.timed || {}), ...Object.keys(power.charges || {}), ...(power.acts || []), ...Object.keys(power.amounts || {})];
  return words.map((word) => `take:${word}`).filter((moment) => REACTIONS[moment]);
}

/** The game's timer names, as the spells call them. */
const TIMER_WORD = Object.freeze({ lit: 'lit', lag: 'lag', unkept: 'unkept', warm: 'warm', fed: 'fed', glimpse: 'glimpse', trueAim: 'true_aim' });

/**
 * The timed powers that ran out between two readings of the timers.
 * @param {Record<string, number | undefined> | null | undefined} before @param {Record<string, number | undefined> | null | undefined} after
 * @returns {string[]}
 */
export function ended(before, after) {
  if (!before || !after) return [];
  return Object.entries(TIMER_WORD).filter(([key]) => (before[key] || 0) > 0 && !((after[key] || 0) > 0)).map(([, word]) => `end:${word}`);
}

/**
 * Who answers a moment, in what mood, and what the narrator says. Someone standing in the lanes answers before the
 * carrier does; the carrier's own row before the row for whoever carries; a row for this telling (the first, a
 * repeat, a reader the lanes know) before a row for any telling. null for a moment with no rows.
 * @param {string} moment
 * @param {{ carrier?: string, present?: ReadonlyArray<string>, times?: number, lifetime?: number, rand?: () => number }} [at]
 * @returns {{ who: string, mood: Mood, deed: string } | null}
 */
export function reactionFor(moment, { carrier = 'figure', present = [], times = 0, lifetime = 0, rand = Math.random } = {}) {
  const own = REACTIONS[moment];
  if (!own) return null;
  const family = REACTIONS[moment.split(':')[0]] || [];
  const telling = times === 0 ? 'first' : lifetime >= 5 ? 'often' : 'again';
  /** @type {Array<{ r: Row, score: number }>} */
  const scored = [];
  [own, family].forEach((rows, isFamily) => rows.forEach((r) => {
    if (r.when && r.when !== telling) return;
    const inLanes = r.only !== 'carrying' && present.includes(r.who);
    const carries = r.only !== 'standing' && r.who === carrier;
    const whose = inLanes ? 4 : carries ? 3 : r.who === 'carrier' ? 2 : r.who === 'any' ? 1 : 0;
    if (!whose) return;
    // On a repeat a row written for the repeat comes first, so the same line is not said twice.
    const fit = r.when ? 2 : times === 0 ? 1 : 0;
    scored.push({ r, score: fit * 100 + whose * 10 + (isFamily ? 0 : 1) });
  }));
  if (!scored.length) return null;
  const best = Math.max(...scored.map((s) => s.score));
  const picks = scored.filter((s) => s.score === best);
  const { r } = picks[Math.floor(rand() * picks.length) % picks.length];
  const who = r.who === 'carrier' || r.who === 'any' ? (CARRIERS.includes(carrier) ? carrier : 'boof') : r.who;
  // The figure answers with a mood and nothing else: it has no interior to narrate.
  return { who, mood: r.mood, deed: who === 'figure' ? '' : r.deed };
}
