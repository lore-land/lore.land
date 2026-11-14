// @ts-check
/**
 * kept-lines.mjs — what a reader keeps, written in the notation the book is written in (a trial: kept-lines).
 *
 * A thing's line. Every wonder (and every card in the deck) already has a likeness, the signature its seal is drawn
 * from (likeness.mjs): its sigil, the braces round its heart, what it is made of, the berry on its rim, the pips of
 * who keeps it, the chapters it lives in. Its line is the same signature read as Spw, so the seal and the line are
 * two readings of one thing, and each teaches the other:
 *
 *   @torch_ants{ $steam =boon &ants ~burrows .lives[1 2 8 12 14] }      kept
 *   ?creature{ $steam =boon ~burrows .lives[1 2 8 12 14] }              still to find: a question, until it is kept
 *
 * Before it is kept, the probe stands where the name will be, and the line carries only what its unfound card and
 * its seal already show (no name, nobody who keeps it). Kept, the probe is answered by the kind's own sigil.
 *
 * A shelf's line. Everything kept, in one line, sealed as a found line is sealed (pie-finds.mjs): its body opens
 * with a label and closes with the label mirrored, so a line cut short in passing does not close.
 *
 *   *shelf{_shelf @creatures[torch_ants ?3 lag_stag ?19] .antiques[?12] … .day["2026-11-13"] flehs_}
 *
 * Each kind's frame lists what is kept in the order the book meets it, and ?n for each run of n still to find, so
 * the line shows the shape of what is missing (where the gaps fall) and never what fills them. The parser says a
 * hole as "wonder 3". A line may be copied, given away and read back by anyone: read back, it is compared, never
 * kept. A letter, not a key: nothing in a pasted or addressed line writes to a reader's shelf.
 *
 * Pure, and host-neutral: the page passes in the wonders (almanac.json) and the likeness items it already has.
 * Canon: .spw/surfaces/almanac.spw (kept_lines).
 */

// @ts-ignore: a page loads it with its version token, which the type checker cannot resolve; the shapes are kinds.mjs's.
import { KINDS, KIND_ORDER, MOTIONS } from './kinds.mjs?v=2026_11_09.G';

/** @typedef {{ id: string, name?: string, kind: string, motion?: string, home?: number, echoes?: number[], hint?: string }} Wonder */
/** @typedef {{ id?: string, kind?: string, sigil?: string, container?: string, material?: string, valence?: string, characters?: string[], lives?: number[], chapter?: number }} Likeness */
/** @typedef {{ kept: string[], holes: number }} ShelfFrame */
/** @typedef {{ sealed: boolean, label: string, day: string, kept: Set<string>, holes: number, size: number, frames: Record<string, ShelfFrame>, unknown: string[], errors: string[] }} ShelfReading */

export const SHELF_LABEL = 'shelf';

/** A label mirrored, as a sealed line closes. @param {string} label */
export const mirrored = (label) => [...String(label)].reverse().join('');

/** An id as a word of Spw (torch-ants → torch_ants), and back. @param {string} id */
export const wordOf = (id) => String(id || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
/** @param {string} word */
export const idOf = (word) => String(word || '').replace(/_/g, '-');

/** The four containers, by the likeness's names for them. */
export const BRACES = Object.freeze({
  window: Object.freeze(['[', ']']),
  room: Object.freeze(['{', '}']),
  gathering: Object.freeze(['(', ')']),
  passage: Object.freeze(['<', '>'])
});
const BRACE_WORDS = Object.freeze({ window: 'a window', room: 'a room', gathering: 'a gathering', passage: 'a passage' });

/* What a seal's dimensions are called, for whoever reads the line (as likeness.mjs names them). */
const MATERIAL_WORDS = Object.freeze({
  glass: 'Bonk glass', flour: 'flour', berry: 'boonberries', frost: 'frost', ink: 'ink', brass: 'brass', steam: 'warmth', oak: 'oak'
});
const VALENCE_WORDS = Object.freeze({ boon: 'a fairy tale', bane: 'absurd reality', bone: 'low magic' });
const KEEPER_WORDS = Object.freeze({
  boof: 'Boof', ants: 'the torch-ants', genie: 'the Genie', bane: 'Mr. BaneWAP', boon: 'Mr. BoonWAP', bonewap: 'BoneWAP',
  porter: 'the porter', clerk: 'a feast clerk', clown: 'a clown', mime: 'a mime'
});
/* Who a line never names, and what never gets a line: the figure in plain lines is not said, and the Egg is not
 * explained. Their seals stay as they are; a line would say more than the seal draws. */
const UNSAID = Object.freeze(new Set(['figure']));
const NO_LINE = Object.freeze(new Set(['card:egg', 'character:figure', 'card:carrier-figure']));

/**
 * The line for one thing, from its likeness. `found` false writes the probe where the name will be and leaves out
 * who keeps it. `word` names it (default: from its id); `kind` is the word a probe asks after; `motion` is a
 * creature's way of moving in the lanes. Returns '' for what has no line.
 * @param {Likeness} sig
 * @param {{ found?: boolean, word?: string, kind?: string, motion?: string }} [options]
 */
export function thingLine(sig, { found = true, word = '', kind = '', motion = '' } = {}) {
  if (!sig || (sig.id && NO_LINE.has(sig.id))) return '';
  const name = wordOf(word || String(sig.id || '').replace(/^[a-z]+:/, ''));
  const asks = wordOf(kind || sig.kind || 'thing');
  const lead = found ? `${sig.sigil || '*'}${name}` : `?${asks}`;
  if (!lead || (found && !name)) return '';
  const [open, close] = BRACES[/** @type {keyof typeof BRACES} */ (sig.container)] || BRACES.room;
  const parts = [];
  if (sig.material) parts.push(`$${wordOf(sig.material)}`);
  if (sig.valence) parts.push(`=${wordOf(sig.valence)}`);
  if (found) (sig.characters || []).filter((c) => !UNSAID.has(c) && wordOf(c) !== name).forEach((c) => parts.push(`&${wordOf(c)}`));
  if (motion) parts.push(`~${wordOf(motion)}`);
  const lives = [...new Set((sig.lives || []).map(Number).filter((n) => n > 0))].sort((a, b) => a - b);
  if (lives.length) parts.push(`.lives[${lives.join(' ')}]`);
  else if (sig.chapter) parts.push(`.chapter[${Number(sig.chapter)}]`);
  return parts.length ? `${lead}${open} ${parts.join(' ')} ${close}` : `${lead}${open}${close}`;
}

/** A wonder's line, kept or still to find. @param {Wonder} wonder @param {Likeness | null | undefined} sig @param {boolean} found */
export function wonderLine(wonder, sig, found) {
  const lives = [wonder.home, ...(wonder.echoes || [])].filter((n) => Number(n) > 0).map(Number);
  /** @type {Likeness} */
  const base = sig || { id: `wonder:${wonder.id}`, kind: 'wonder', sigil: KINDS[/** @type {keyof typeof KINDS} */ (wonder.kind)]?.sigil, lives };
  return thingLine({ ...base, lives: base.lives?.length ? base.lives : lives }, {
    found,
    word: wonder.id,
    kind: KINDS[/** @type {keyof typeof KINDS} */ (wonder.kind)]?.word || wonder.kind,
    motion: wonder.kind === 'creature' ? wonder.motion || '' : ''
  });
}

/**
 * What one atom of a thing's line says, for whoever lights it (renderSpell's explain): each part is also a part of
 * the seal, and the words say which.
 * `lead` is the line's own first word (its name, or the kind a probe asks after), so a lead is not taken for a part.
 * @param {string} sigil @param {string} label @param {{ found?: boolean, name?: string, kindWord?: string, lead?: string }} [about]
 */
export function explainThing(sigil, label, { found = true, name = '', kindWord = 'thing', lead = '' } = {}) {
  const key = String(label || '').replace(/\[.*$/, '');
  if (sigil === '?') return `A ${kindWord} not yet kept: a question, until it is found. Kept, its own sigil answers it.`;
  if (lead && key === lead) return found && name ? `${name}, kept: ${sigil} is the heart of its seal.` : '';
  if (sigil === '$') return `Made of ${MATERIAL_WORDS[/** @type {keyof typeof MATERIAL_WORDS} */ (key)] || key}: the ring round its seal.`;
  if (sigil === '=') return `Leans ${key}, ${VALENCE_WORDS[/** @type {keyof typeof VALENCE_WORDS} */ (key)] || key}: the berry on its seal’s rim.`;
  if (sigil === '&') return `Kept with ${KEEPER_WORDS[/** @type {keyof typeof KEEPER_WORDS} */ (key)] || key.replace(/_/g, ' ')}: a pip on its seal’s lower rim.`;
  if (sigil === '~') return `It ${MOTIONS[/** @type {keyof typeof MOTIONS} */ (key)] ? `${key}: ${MOTIONS[/** @type {keyof typeof MOTIONS} */ (key)]}` : key}.`;
  if (sigil === '.' && key === 'lives') return 'The chapters it lives in. Its seal has a petal for each chapter up to the first.';
  if (sigil === '.' && key === 'chapter') return 'The chapter it is first in: a petal each, on its seal.';
  return '';
}

/* The braces of a line, said plainly (a frame is a window you may only look in, and so on). */
export const braceWord = (/** @type {string} */ container) => BRACE_WORDS[/** @type {keyof typeof BRACE_WORDS} */ (container)] || 'a room';

/* ─── The shelf, as one sealed line ─────────────────────────────────── */

/**
 * The reader's shelf as one sealed line: per kind, what is kept in the book's order and ?n for each run still to
 * find, then the day it was written.
 * @param {ReadonlyArray<Wonder>} wonders in the book's order (almanac.json)
 * @param {Record<string, unknown> | Set<string>} kept the reader's almanac (lore.almanac.v1), or a set of ids
 * @param {{ day?: string }} [at]
 */
export function shelfLine(wonders, kept, { day = '' } = {}) {
  const has = kept instanceof Set ? (/** @type {string} */ id) => kept.has(id) : (/** @type {string} */ id) => Boolean(kept && kept[id]);
  const frames = KIND_ORDER.map((/** @type {string} */ kind) => {
    const list = wonders.filter((w) => w.kind === kind);
    if (!list.length) return '';
    /** @type {string[]} */
    const words = [];
    let run = 0;
    list.forEach((w) => {
      if (has(w.id)) {
        if (run) words.push(`?${run}`);
        run = 0;
        words.push(wordOf(w.id));
      } else run += 1;
    });
    if (run) words.push(`?${run}`);
    return `${KINDS[kind].sigil}${wordOf(KINDS[kind].words)}[${words.join(' ')}]`;
  }).filter(Boolean);
  const dated = /^\d{4}-\d{2}-\d{2}$/.test(day) ? ` .day["${day}"]` : '';
  return `*${SHELF_LABEL}{_${SHELF_LABEL} ${frames.join(' ')}${dated} ${mirrored(SHELF_LABEL)}_}`;
}

/**
 * One chapter's wonders as a line: each kept here in its kind's sigil, ?n for each run still to find here.
 *   *chapter[3]{ @torch_ants ?2 $lamp_ladders }
 * @param {ReadonlyArray<Wonder>} wonders in the book's order
 * @param {(id: string) => Array<{ c: number }>} placesOf where each is marked (semantic.json wonders)
 * @param {number} chapter
 * @param {Record<string, { places?: number[] }>} kept the reader's almanac
 */
export function chapterLine(wonders, placesOf, chapter, kept) {
  const here = wonders.filter((w) => (placesOf(w.id) || []).some((p) => Number(p.c) === Number(chapter)));
  if (!here.length) return '';
  /** @type {string[]} */
  const words = [];
  let run = 0;
  here.forEach((w) => {
    if (kept?.[w.id]?.places?.includes(Number(chapter))) {
      if (run) words.push(`?${run}`);
      run = 0;
      words.push(`${KINDS[w.kind]?.sigil || '*'}${wordOf(w.id)}`);
    } else run += 1;
  });
  if (run) words.push(`?${run}`);
  return `*chapter[${Number(chapter)}]{ ${words.join(' ')} }`;
}

const HEAD = /^\*shelf\s*\{/;
const FRAME = /([@.*$&#])([a-z_]+)\[([^\]]*)\]/g;

/**
 * A shelf's line, read with a held vocabulary: an unknown word is reported, never guessed. `sealed` is this small
 * reader's own view (a label and its mirror); the page also asks the workbench (scanPairLabels) when it has loaded.
 * @param {string} text @param {ReadonlyArray<Wonder>} wonders @returns {ShelfReading | null} null when it is not a shelf's line
 */
export function readShelfLine(text, wonders) {
  const src = String(text || '').replace(/#from\["[^"]*"\]/g, '').trim();
  if (!HEAD.test(src)) return null;
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const unknown = [];
  const closes = src.endsWith('}');
  const inner = src.replace(HEAD, '').slice(0, closes ? -1 : undefined).trim();
  const label = (/^_([a-z][a-z0-9_]*)(?=\s|$)/i.exec(inner) || [])[1] || '';
  const tail = (/(?:^|\s)([a-z0-9][a-z0-9_]*)_$/i.exec(inner) || [])[1] || '';
  const sealed = closes && label === SHELF_LABEL && tail === mirrored(label);
  const byWord = new Map(wonders.map((w) => [wordOf(w.id), w]));
  /** @type {Record<string, ShelfFrame>} */
  const frames = {};
  const kept = new Set();
  let holes = 0;
  for (const [, sigil, word, body] of inner.matchAll(FRAME)) {
    const kind = KIND_ORDER.find((/** @type {string} */ k) => wordOf(KINDS[k].words) === word);
    if (!kind) { if (word !== 'day') errors.push(`${sigil}${word}[…] is not a shelf the almanac keeps`); continue; }
    if (KINDS[kind].sigil !== sigil) errors.push(`${word} is kept under ${KINDS[kind].sigil}, not ${sigil}`);
    const frame = frames[kind] || { kept: [], holes: 0 };
    body.split(/\s+/).filter(Boolean).forEach((part) => {
      const hole = /^\?(\d{1,3})$/.exec(part);
      if (hole) { frame.holes += Number(hole[1]); holes += Number(hole[1]); return; }
      const w = byWord.get(part);
      if (!w) { unknown.push(part); return; }
      if (w.kind !== kind) { errors.push(`${part} is not on the ${KINDS[kind].shelf} shelf`); return; }
      frame.kept.push(w.id);
      kept.add(w.id);
    });
    frames[kind] = frame;
  }
  if (!Object.keys(frames).length) errors.push('it names no shelf');
  const left = inner.replace(FRAME, ' ').replace(/\.day\["[^"]*"\]/, ' ').replace(/^_[a-z0-9_]*/i, ' ').replace(/[a-z0-9_]*_$/i, ' ').trim();
  if (left) errors.push(`“${left.slice(0, 40)}” was not read`);
  const day = (/\.day\["(\d{4}-\d{2}-\d{2})"\]/.exec(inner) || [])[1] || '';
  return { sealed, label, day, kept, holes, size: kept.size + holes, frames, unknown, errors };
}

/**
 * Two shelves side by side: what both keep, what only they keep, what only you keep.
 * @param {Set<string>} mine @param {Set<string>} theirs
 */
export function compareShelves(mine, theirs) {
  return {
    both: [...theirs].filter((id) => mine.has(id)),
    onlyTheirs: [...theirs].filter((id) => !mine.has(id)),
    onlyMine: [...mine].filter((id) => !theirs.has(id))
  };
}

/**
 * Whether the workbench reads a line as sealed by its label and the label mirrored (scanPairLabels).
 * @param {any} scan the result of scanPairLabels(text) @param {string} [label]
 */
export const sealedByWorkbench = (scan, label = SHELF_LABEL) =>
  (scan?.pairs || []).some((/** @type {any} */ p) => p.label === label && p.close?.spelling === 'mirrored');

/* ─── The bench: the book's own bracework, recognised ──────────────── */

/**
 * A combine the book already writes (a bracework wonder's own expression, as its terms give it), or null. A & combine
 * holds both ways round; the other sigils have a direction.
 * @param {string} expr as the bench writes it, e.g. {frost & hearth}
 * @param {ReadonlyArray<Wonder & { terms?: string[] }>} wonders
 */
export function benchCanon(expr, wonders) {
  const norm = (/** @type {string} */ s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
  const want = norm(expr);
  const swapped = /^([[{(<])(\S+) & (\S+)([\]})>])$/.exec(want);
  const ways = new Set([want, ...(swapped ? [`${swapped[1]}${swapped[3]} & ${swapped[2]}${swapped[4]}`] : [])]);
  return wonders.find((w) => w.kind === 'bracework' && (w.terms || []).some((t) => ways.has(norm(t)))) || null;
}

/* ─── On a page (called only where there is a document) ─────────────── */

/**
 * A run still to find (?3) is a hole in a rendered line (spw-spell.mjs renderSpell): lit as a question, and titled
 * with how many. @param {Element} spell @returns {Element}
 */
export function markHoles(spell) {
  spell.querySelectorAll('.spell-other').forEach((node) => {
    const count = node.nextElementSibling;
    if (node.textContent !== '?' || !count?.classList.contains('spell-number')) return;
    node.classList.add('kept-hole');
    count.classList.add('kept-hole');
    node.setAttribute('title', `${count.textContent} still to find`);
  });
  return spell;
}

/**
 * Every line inside `root` said in the names of its parts (the workbench's spokenLine), as its accessible name, for
 * whoever reads by ear. A line is a .kept-line carrying data-kept-line (and data-kept-say, what to say before it).
 * @param {ParentNode} root @param {((text: string) => any) | undefined} spokenLine
 */
export function sayLinesIn(root, spokenLine) {
  if (typeof spokenLine !== 'function') return;
  root.querySelectorAll('.kept-line[data-kept-line]').forEach((spell) => {
    const code = spell.querySelector('.spell-line');
    const line = spell.getAttribute('data-kept-line') || '';
    if (!code || code.getAttribute('data-said') || !line) return;
    try {
      const said = spokenLine(line);
      if (!said?.text) return;
      code.setAttribute('aria-label', `${spell.getAttribute('data-kept-say') || ''}${said.text}`);
      code.setAttribute('data-said', 'spw-seed');
    } catch { /* read as written */ }
  });
}
