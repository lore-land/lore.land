// @ts-check
/**
 * pie-finds.mjs — finds: what opens only to a rare carry played well. A gift from a live stream (or the Ring Tide)
 * supplies one half; the carrier's hands supply the other. Pure: the game says what happened in the lanes and draws
 * the moment; this reads the rules and keeps the record.
 *
 * A find is a line of Spw, read here by a small reader with a held vocabulary, as pie-powers.mjs reads a power. The
 * line is the rule: what it says is what runs, and an unknown word is reported, never guessed.
 *
 *   ?find[haggle]{ @carrier[genie] &eat[donut] %count[3] %lanes[3] ~within[3] ^moment[haggle] #crosses[never-smaller] }
 *
 *   @carrier[id]      who must be carrying
 *   &verb[kind]       a step done in the lanes, in order        eat · hop · foil · meet
 *   %count[n]         the step before it, n times over
 *   %lanes[n]         ... from n different lanes: only steering does that
 *   ~within[s]        the whole sequence inside s seconds
 *   ^moment[id]       the classic beat it plays, drawn and not said
 *   #crosses[trope]   the trope it crosses (book/content/world/tropes.json)
 *
 * What a find opens: a moment (a freeze, a double take, a price tag), a character's own want or limit seen from a
 * side the lanes had not shown (REASONS in characters.mjs; no new plot), a benefit for the rest of the carry, and a
 * sealed line kept by play and nothing else. On a live stream it also deepens that gift for everyone's gifts for the
 * rest of the visit, so whoever finds it finds it for the room. Nobody here speaks: the words are narration.
 * (.spw/surfaces/finds.spw)
 */

/** @typedef {{ verb: string, kind: string, count: number, lanes: number }} Step */
/** @typedef {{ id: string, carrier: string, steps: Step[], within: number, moment: string, crosses: string, errors: string[] }} FindRule */
/** @typedef {{ verb: string, kind: string, t: number, lane?: number }} Deed */
/** @typedef {{ id: string, name: string, rule: string, who: string, grounds: 'want' | 'limit', says: string, live: string, riddle: string }} Find */

/** The verbs a step may use: what the game says happened. */
export const VERBS = Object.freeze(['eat', 'hop', 'foil', 'meet']);
/** The moments the game can draw. */
export const MOMENTS = Object.freeze(['haggle', 'sniff']);

/** @type {ReadonlyArray<Find>} */
export const FINDS = Object.freeze([
  Object.freeze({
    id: 'haggle',
    name: 'The haggle',
    rule: '?find[haggle]{ @carrier[genie] &eat[donut] %count[3] %lanes[3] ~within[3] ^moment[haggle] #crosses[never-smaller] }',
    who: 'genie',
    grounds: /** @type {'limit'} */ ('limit'),
    says: 'Three donuts in three seconds, and the Genie could not help pricing them: three for the price of two, with the difference handed back. For the rest of the carry every donut counts twice.',
    live: 'every donut sent up the lanes counts twice for the rest of the stream.',
    riddle: 'Someone who cannot stop pricing, and a trail of rings taken quickly.'
  }),
  Object.freeze({
    id: 'sniff',
    name: 'The sniff',
    rule: '?find[sniff]{ &hop[banerose] &foil[bane] ~within[3] ^moment[sniff] #crosses[off-switch] }',
    who: 'bane',
    grounds: /** @type {'want'} */ ('want'),
    says: 'A bane rose cleared, and his off switch thrown before it could fade: Mr. BaneWAP stopped to smell the rose on his way out. He wants to hold a thing longest, and a rose does not last. The bane roses ahead wilt.',
    live: 'one bane rose in two arrives wilted for the rest of the stream.',
    riddle: 'A rose sent against you, cleared, and a switch thrown before it fades.'
  })
]);

const ATOM = /([@&%~^#])([a-z_]+)\[([^\]]*)\]/g;

/** A find's rule, read. @param {string} text @returns {FindRule} */
export function readFind(text) {
  /** @type {string[]} */
  const errors = [];
  const src = String(text || '');
  const head = /^\?find\[([a-z][a-z0-9_-]*)\]\s*\{([\s\S]*)\}\s*$/.exec(src.trim());
  /** @type {FindRule} */
  const rule = { id: '', carrier: '', steps: [], within: 0, moment: '', crosses: '', errors };
  if (!head) { errors.push('a find is ?find[name]{ … }'); return rule; }
  rule.id = head[1];
  const body = head[2];
  for (const [, sigil, word, arg] of body.matchAll(ATOM)) {
    const a = arg.trim();
    if (sigil === '@' && word === 'carrier') rule.carrier = a;
    else if (sigil === '&' && VERBS.includes(word)) rule.steps.push({ verb: word, kind: a, count: 1, lanes: 1 });
    else if (sigil === '%' && word === 'count' && rule.steps.length) rule.steps[rule.steps.length - 1].count = Math.max(1, Math.min(9, Math.round(Number(a)) || 1));
    else if (sigil === '%' && word === 'lanes' && rule.steps.length) rule.steps[rule.steps.length - 1].lanes = Math.max(1, Math.min(5, Math.round(Number(a)) || 1));
    else if (sigil === '~' && word === 'within') rule.within = Math.max(0.5, Math.min(30, Number(a) || 0));
    else if (sigil === '^' && word === 'moment' && MOMENTS.includes(a)) rule.moment = a;
    else if (sigil === '#' && word === 'crosses') rule.crosses = a;
    else errors.push(`${sigil}${word}[${a}] is not a word a find knows`);
  }
  const left = body.replace(ATOM, '').trim();
  if (left) errors.push(`“${left.slice(0, 40)}” was not read`);
  if (!rule.steps.length) errors.push('a find needs at least one step');
  if (!rule.within) errors.push('a find needs ~within[seconds]');
  if (!rule.moment) errors.push('a find needs a ^moment the game can draw');
  return rule;
}

/**
 * Whether a rule opens on what has just happened: the newest deed completes its last step, and every step, in order
 * and as many times as it counts, falls inside the window. Deeds in between that are not steps do not break it.
 * @param {FindRule} rule @param {Deed[]} deeds oldest first @param {{ carrier: string }} at
 */
export function opens(rule, deeds, { carrier }) {
  if (rule.errors.length || !deeds.length) return false;
  if (rule.carrier && rule.carrier !== carrier) return false;
  const want = rule.steps.flatMap((s) => Array(s.count).fill(s));
  const last = deeds[deeds.length - 1];
  const tail = want[want.length - 1];
  if (last.verb !== tail.verb || last.kind !== tail.kind) return false;
  let need = want.length - 1;
  let first = last.t;
  /** @type {Map<Step, Set<number | undefined>>} */
  const lanes = new Map();
  for (let i = deeds.length - 1; i >= 0 && need >= 0; i -= 1) {
    const d = deeds[i];
    if (last.t - d.t > rule.within) break;
    const s = want[need];
    if (d.verb === s.verb && d.kind === s.kind) {
      first = d.t;
      need -= 1;
      if (!lanes.has(s)) lanes.set(s, new Set());
      lanes.get(s)?.add(d.lane);
    }
  }
  if (need >= 0 || last.t - first > rule.within) return false;
  // A step that asks for lanes is only met from that many different ones.
  return rule.steps.every((s) => s.lanes <= 1 || (lanes.get(s)?.size || 0) >= s.lanes);
}

/** A label mirrored, as a sealed line closes. @param {string} label */
export const mirrored = (label) => [...String(label)].reverse().join('');

/**
 * The line a find leaves: the day, the chapter and the carrier, between the find's name and its mirror.
 * @param {Find} find @param {{ day: string, chapter: number, carrier: string }} at
 */
export function foundLine(find, { day, chapter, carrier }) {
  const who = String(carrier || 'figure').replace(/[^a-z0-9_-]/gi, '') || 'figure';
  return `^found[${find.id}]{_${find.id} .day["${day}"] .chapter[${Math.max(1, Math.round(Number(chapter)) || 1)}] .carrier[${who}] ${mirrored(find.id)}_}`;
}

/**
 * A find, written in the record by play: the first time the day and a line, later only a count.
 * @param {Record<string, { was?: string, takes?: number, line?: string }>} record @param {Find} find
 * @param {{ day: string, chapter: number, carrier: string }} at
 */
export function take(record, find, at) {
  const all = { ...(record || {}) };
  const had = all[find.id] || {};
  const first = !had.was;
  const line = had.line || foundLine(find, at);
  all[find.id] = { was: had.was || at.day, takes: (Number(had.takes) || 0) + 1, line };
  return { record: all, first, line: first ? line : '' };
}
