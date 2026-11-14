// @ts-check
/**
 * pie-jokes.mjs — callbacks: a small beat in the lanes, met again, comes back changed, and the last time it lands a
 * payoff that needed the beats before it (the callbacks trial; .spw/surfaces/jokes.spw). Pure: the game says what
 * happened in the lanes and shows the beat; this reads the rules, keeps count and says where each beat's words are.
 *
 * A callback is a line of Spw, read here by a small reader with a held vocabulary, as pie-finds.mjs reads a find. The
 * line is the rule: what it says is what runs, and an unknown word is reported, never guessed.
 *
 *   ?joke[damage]{ @carrier[porter] ~setup[knock:clerk] %count[3] ^payoff[chapter_15] #crosses[records] =bane@porter{ @damage } }
 *
 *   @carrier[id]        who must be carrying; never the figure in plain lines, who answers with a mood and no deed
 *   &heard[entry]       a margin heard first (references.json, kept as heard by references.mjs): the book sets it up
 *   ~setup[moment]      the beat met in the lanes: one moment (knock:clerk), or a family (knock) counted thing by thing
 *   %count[n]           met n times in one carry; the nth meeting is the payoff, once a carry
 *   ^payoff[where]      whose words land: chapter_N, a paragraph of the book; or lanes, a row the lanes already say
 *   #crosses[trope]     the trope it crosses (tropes.json), met in the lanes when it lands
 *   =bane@who{ @what }  who pays, and for what: the signed edge of elaboration.spw (=boon@who{ @what } for a gift)
 *
 * Words by reference: each beat names where its words already are (a row of pie-reactions.mjs, sentences of a released
 * paragraph), never the words themselves. jokes-check resolves every one, holds it to narration and to the registry.
 * A payoff the lanes already say is held back from the reactions until it lands, so it is not spent early. A family's
 * payoff lands the thing's own row when it has one: the third pane, the glass; the third post, the knock.
 */

/** @typedef {{ row: string, who: string }} RowRef a row of pie-reactions.mjs REACTIONS: the moment, and whose row */
/** @typedef {{ chapter: number, section: number, para: number, sentences?: [number, number], starts: string, who: string, mood: string }} BookRef
 * a released paragraph: section and paragraph counted from 1 as the chapter walks them, sentences [from, to] counted
 * from 0 (all of it when absent); starts is the quote's opening, so a paragraph that moves fails the check */
/** @typedef {RowRef | BookRef | null} Beat */
/** @typedef {{ id: string, rule: string, beats: ReadonlyArray<Beat> }} Joke */
/** @typedef {{ sign: string, who: string, what: string }} Cost */
/** @typedef {{ id: string, carrier: string, heard: string, setup: string, count: number, payoff: string, crosses: string, cost: Cost | null, errors: string[] }} JokeRule */

/** The families a setup may name, counted thing by thing: pie-reactions.mjs moments are family:thing. */
export const FAMILIES = Object.freeze(['knock', 'take', 'end']);
/** The deed a landed callback is kept as, on the chapter it landed in. @param {{ id: string }} joke */
export const jokeDeed = (joke) => `joke_${joke.id}`;

/** @type {ReadonlyArray<Joke>} */
export const JOKES = Object.freeze([
  Object.freeze({
    // The rule of three, ending in the book's own turn (Chapter Fifteen, at the parcel gate): a slip with a word at the
    // top, then what porters write under it, then what this one wrote.
    id: 'damage',
    rule: '?joke[damage]{ @carrier[porter] ~setup[knock:clerk] %count[3] ^payoff[chapter_15] #crosses[records] =bane@porter{ @damage } }',
    beats: Object.freeze([
      Object.freeze({ row: 'knock:clerk', who: 'carrier' }),
      Object.freeze({ chapter: 15, section: 3, para: 4, sentences: /** @type {[number, number]} */ ([4, 5]), starts: 'Most porters', who: 'porter', mood: 'thinking' }),
      Object.freeze({ chapter: 15, section: 3, para: 5, starts: 'He wrote', who: 'porter', mood: 'calm' })
    ])
  }),
  Object.freeze({
    // A margin sets it up (Chapter Five: he cannot pass three of a thing without pricing them); the lanes pay it off on
    // the third of a thing, with the row they already had for him, held back until then.
    id: 'priced',
    rule: '?joke[priced]{ @carrier[genie] &heard[rumour-haggle] ~setup[knock] %count[3] ^payoff[lanes] #crosses[missing-day] =bane@genie{ @knock } }',
    beats: Object.freeze([null, null, Object.freeze({ row: 'knock', who: 'genie' })])
  })
]);

const ATOM = /([@&~%^#])([a-z_]+)\[([^\]]*)\]/g;
const COST = /=(bane|boon)@([a-z][a-z0-9_-]*)\{\s*@([a-z][a-z0-9_-]*)\s*\}/g;

/** A callback's rule, read. @param {string} text @returns {JokeRule} */
export function readJoke(text) {
  /** @type {string[]} */
  const errors = [];
  const src = String(text || '');
  const head = /^\?joke\[([a-z][a-z0-9_-]*)\]\s*\{([\s\S]*)\}\s*$/.exec(src.trim());
  /** @type {JokeRule} */
  const rule = { id: '', carrier: '', heard: '', setup: '', count: 0, payoff: '', crosses: '', cost: null, errors };
  if (!head) { errors.push('a callback is ?joke[name]{ … }'); return rule; }
  rule.id = head[1];
  let body = head[2];
  for (const [, sign, who, what] of body.matchAll(COST)) {
    if (rule.cost) errors.push('a callback has one cost');
    rule.cost = { sign, who, what };
  }
  body = body.replace(COST, ' ');
  for (const [, sigil, word, arg] of body.matchAll(ATOM)) {
    const a = arg.trim();
    if (sigil === '@' && word === 'carrier') rule.carrier = a;
    else if (sigil === '&' && word === 'heard') rule.heard = a;
    else if (sigil === '~' && word === 'setup' && /^[a-z]+(?::[a-z_]+)?$/.test(a)) rule.setup = a;
    else if (sigil === '%' && word === 'count') rule.count = Math.max(0, Math.min(5, Math.round(Number(a)) || 0));
    else if (sigil === '^' && word === 'payoff' && /^(?:lanes|chapter_\d+)$/.test(a)) rule.payoff = a;
    else if (sigil === '#' && word === 'crosses') rule.crosses = a;
    else errors.push(`${sigil}${word}[${a}] is not a word a callback knows`);
  }
  const left = body.replace(ATOM, '').trim();
  if (left) errors.push(`“${left.slice(0, 40)}” was not read`);
  if (!rule.setup) errors.push('a callback needs ~setup[moment]');
  if (rule.count < 2) errors.push('a callback needs %count[n] of two or more: something to call back to');
  if (!rule.payoff) errors.push('a callback needs ^payoff[lanes] or ^payoff[chapter_N]');
  if (!rule.cost) errors.push('a callback says who pays: =bane@who{ @what }, or =boon@who{ @what } for a gift');
  if (rule.carrier === 'figure') errors.push('the figure in plain lines answers with a mood, never a beat');
  return rule;
}

/** Every callback, read once. @type {ReadonlyArray<{ joke: Joke, rule: JokeRule }>} */
export const READ = Object.freeze(JOKES.map((joke) => Object.freeze({ joke, rule: readJoke(joke.rule) })));

/** How particular a rule is: a carrier, a margin heard and a single moment each make it more so. @param {JokeRule} rule */
const particular = (rule) => (rule.carrier ? 1 : 0) + (rule.heard ? 1 : 0) + (rule.setup.includes(':') ? 1 : 0);

/** Whether a rule is armed for this carry. @param {JokeRule} rule @param {{ carrier: string, heard: Record<string, unknown> }} at */
export const armed = (rule, { carrier, heard }) => !rule.errors.length && carrier !== 'figure'
  && (!rule.carrier || rule.carrier === carrier) && (!rule.heard || Boolean(heard?.[rule.heard]));

/**
 * A moment met: every armed callback whose setup it is counts it, and the most particular one with a beat at that
 * count gives it. Counts live in the carry (`counts`, changed here); a callback lands once a carry.
 * @param {string} moment pie-reactions.mjs moment, family:thing
 * @param {{ carrier: string, heard: Record<string, unknown>, counts: Record<string, number> }} at
 * @param {ReadonlyArray<{ joke: Joke, rule: JokeRule }>} [all]
 * @returns {{ joke: Joke, rule: JokeRule, index: number, last: boolean, beat: Exclude<Beat, null> } | null}
 */
export function meet(moment, { carrier, heard, counts }, all = READ) {
  const family = moment.split(':')[0];
  /** @type {Array<{ joke: Joke, rule: JokeRule, index: number, last: boolean, beat: Exclude<Beat, null>, weight: number }>} */
  const due = [];
  for (const { joke, rule } of all) {
    if (!armed(rule, { carrier, heard }) || counts[`${rule.id}!`]) continue;
    if (rule.setup !== moment && rule.setup !== family) continue;
    const key = rule.setup === moment ? rule.id : `${rule.id}@${moment}`;
    const index = counts[key] || 0;
    counts[key] = index + 1;
    const last = index + 1 >= rule.count;
    if (last) counts[`${rule.id}!`] = 1;
    const beat = joke.beats[index];
    if (beat) due.push({ joke, rule, index, last, beat, weight: particular(rule) });
  }
  if (!due.length) return null;
  const best = Math.max(...due.map((d) => d.weight));
  const { weight, ...pick } = /** @type {(typeof due)[number]} */ (due.find((d) => d.weight === best));
  return pick;
}

/** @typedef {Record<string, ReadonlyArray<{ who: string, mood: string, deed: string }>>} Reactions */

/**
 * The deeds a callback is saving for its payoff, not to be said before it lands: for each armed callback whose payoff
 * is a row the lanes already say, until it has landed this carry. A family's row saves that person's row in every
 * moment of the family too, since the payoff lands the thing's own row when it has one.
 * @param {{ carrier: string, heard: Record<string, unknown>, counts: Record<string, number> }} at
 * @param {Reactions} reactions
 * @param {ReadonlyArray<{ joke: Joke, rule: JokeRule }>} [all]
 * @returns {string[]}
 */
export function saving({ carrier, heard, counts }, reactions, all = READ) {
  return all.filter(({ rule }) => rule.payoff === 'lanes' && armed(rule, { carrier, heard }) && !counts[`${rule.id}!`])
    .map(({ joke }) => joke.beats[joke.beats.length - 1])
    .flatMap((beat) => {
      if (!beat || !('row' in beat)) return [];
      const moments = beat.row.includes(':') ? [beat.row] : Object.keys(reactions).filter((key) => key === beat.row || key.startsWith(`${beat.row}:`));
      return moments.flatMap((key) => (reactions[key] || []).filter((r) => r.who === beat.who).map((r) => r.deed));
    });
}

/* ─── Where the words are ─── */

/**
 * A row of the reactions table, by moment and whose. A family's row, met at one of its moments, is that moment's own
 * row for the same person when there is one (the Genie at a pane looks at the glass; at a post he reckons the knock).
 * @param {Reactions} reactions @param {RowRef} ref @param {string} [moment]
 */
export function rowOf(reactions, ref, moment = '') {
  const own = !ref.row.includes(':') && moment.startsWith(`${ref.row}:`) ? (reactions[moment] || []).find((r) => r.who === ref.who) : null;
  return own || (reactions[ref.row] || []).find((r) => r.who === ref.who) || null;
}

/**
 * A chapter's paragraphs, section by section, walked as the lanes walk them (pie-game.mjs loadLeg): every paragraph
 * item with text, nested ones included.
 * @param {any} chapter chapter JSON
 * @returns {Array<Array<{ text: string, slots: boolean }>>}
 */
export function paragraphsOf(chapter) {
  return (chapter?.sections || []).map((/** @type {any} */ section) => {
    /** @type {Array<{ text: string, slots: boolean }>} */
    const out = [];
    const walk = (/** @type {any} */ node) => (node.content || []).forEach((/** @type {any} */ item) => {
      if (item.type === 'paragraph' && item.text) out.push({ text: String(item.text), slots: /\{\{[a-z0-9-]+\}\}/i.test(String(item.text)) || Boolean(item.slots) });
      else if (Array.isArray(item.content)) walk(item);
    });
    walk(section);
    return out;
  });
}

/** A paragraph's sentences. @param {string} text */
export const sentencesOf = (text) => (String(text).match(/[^.!?]+[.!?]+["”’)]*(?=\s|$)/g) || []).map((s) => s.trim()).filter(Boolean);

/**
 * The words a book beat names, '' if they are not there (or the paragraph has slots, which turn).
 * @param {any} chapter chapter JSON @param {BookRef} ref
 */
export function quoteOf(chapter, ref) {
  const para = paragraphsOf(chapter)[ref.section - 1]?.[ref.para - 1];
  if (!para || para.slots) return '';
  const all = sentencesOf(para.text);
  const [from, to] = ref.sentences || [0, all.length - 1];
  if (from < 0 || to >= all.length || from > to) return '';
  const words = all.slice(from, to + 1).join(' ');
  return words.startsWith(ref.starts) ? words : '';
}

/**
 * A beat's words, who answers it and in what mood: from the reactions table (at the moment it is met) or a fetched
 * chapter. null when its words are not to hand.
 * @param {Exclude<Beat, null>} beat
 * @param {{ reactions: Reactions, chapters: Record<number, any>, moment?: string }} from
 * @returns {{ who: string, mood: string, words: string } | null}
 */
export function wordsOf(beat, { reactions, chapters, moment = '' }) {
  if ('row' in beat) {
    const r = rowOf(reactions, beat, moment);
    return r ? { who: r.who, mood: r.mood, words: r.deed } : null;
  }
  const words = chapters[beat.chapter] ? quoteOf(chapters[beat.chapter], beat) : '';
  return words ? { who: beat.who, mood: beat.mood, words } : null;
}

/** The chapters the callbacks quote, to fetch once. */
export const QUOTED = Object.freeze([...new Set(JOKES.flatMap((j) => j.beats.flatMap((b) => (b && 'chapter' in b ? [b.chapter] : []))))]);
