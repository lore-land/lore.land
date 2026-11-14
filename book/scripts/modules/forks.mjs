// @ts-check
/**
 * forks.mjs — a branch, said as one line of Spw: what forks, on what, and where each side goes.
 *
 *   ?two_pies[way]{ =boon@meet{ @c12 } =bane@apart{ @c12[told] } }
 *   ?scheme[shelves]{ =bane@banewap{ @wind[bane, bonk] @tax[bane, bone] @relet[bane, bane] @march[bane, bonk, bonk] } }
 *
 *   ?name            the question: what forks
 *   [on]             what decides it. way: the reader takes a side whole, and everything it names happens.
 *                    shelves: the land draws one place from the side, weighed by the five shelves (valence-shelves.mjs)
 *   =boon@side{ … }  a side that leans forward: the book as it stands
 *   =bane@side{ … }  a side that leans inverse: the book turned from itself (or, for a weighed fork, his schemes)
 *   @where[how]      where a side goes, and how: @c12 read as written, @c12[told] told another way, @c04[aside]
 *                    stepped over, @c08[held] says what the chapter before it held, @c14[last] where a way ends,
 *                    @lanes as they are, @lanes[apart] kept apart there; in a weighed fork the frame names the
 *                    shelves a place leans on, comma-separated (a space-separated frame falls to prose)
 *
 * Each side is a signed bias edge (workbench .spw/registries/bias-product.spw): readBias gives its anchor, targets and
 * sign. readBias does not keep a target's frame, so the frames are read off the tree. A shelf word is a modifier, not
 * a reference: it can stand in a frame but never as a target (=bane@wind{ @bane } reads with no targets at all).
 *
 * Two readers, one answer: readFork() reads with the real parser (vendor/spw-seed.mjs, loaded lazily in the browser),
 * and readForkSmall() is a small sync reader for when the parser is not to hand. book:check and shelves:check hold the
 * two equal on every fork the site writes. Pure: no DOM, no storage.
 */

/** @typedef {{ to: string, how: string[] }} Where */
/** @typedef {{ sign: 'forward' | 'inverse', valence: string, side: string, where: Where[] }} Side */
/** @typedef {{ what: string, on: string, sides: Side[] }} Fork */
/** @typedef {{ id: string, kind: 'chapter' | 'pair', chapter?: number, pair?: string, name: string, line: string, fork: Fork }} ForkEntry */

/** The signs a side may carry, and which way each leans (workbench registry: boon forward, bane inverse). */
export const SIGNS = Object.freeze({ boon: 'forward', bane: 'inverse' });
/** What may decide a fork. */
export const DECIDERS = Object.freeze(['way', 'shelves']);
const SHELF_WORDS = Object.freeze(['boon', 'bane', 'bone', 'bonk', 'honk']);
const NAME = '[a-z_][a-z0-9_]*';
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
/** @param {number} n */
export const chapterWords = (n) => `Chapter ${WORDS[n] || n}`;
/** @param {number} n */
const cid = (n) => `c${String(n).padStart(2, '0')}`;
/** @param {string} id @returns {number} */
const chapterOf = (id) => (/^c(\d+)$/.exec(id) ? Number(id.slice(1)) : 0);

/* ─── The line ─── */

/** @param {Where} w */
const whereText = (w) => `@${w.to}${w.how.length ? `[${w.how.join(', ')}]` : ''}`;
/** A side, as its signed edge. @param {Side} s */
export const sideLine = (s) => `=${s.valence}@${s.side}{${s.where.length ? ` ${s.where.map(whereText).join(' ')} ` : ' '}}`;
/** A fork, as one line. @param {Fork} f */
export const forkLine = (f) => `?${f.what}[${f.on}]{ ${f.sides.map(sideLine).join(' ')} }`;

/* ─── The small reader ─── */

/**
 * A fork read back without the parser; null when it is not one. Strict: anything in the body that is not a side, or in
 * a side that is not a place, and it is not a fork.
 * @param {string} text
 * @returns {Fork | null}
 */
export function readForkSmall(text) {
  const src = String(text || '').trim();
  const head = new RegExp(`^\\?(${NAME})\\[\\s*(${NAME})\\s*\\]\\s*\\{([\\s\\S]*)\\}$`).exec(src);
  if (!head) return null;
  const [, what, on, body] = head;
  /** @type {Side[]} */
  const sides = [];
  const sideRe = new RegExp(`=(${SHELF_WORDS.join('|')})@(${NAME})\\s*\\{([^{}]*)\\}`, 'g');
  const rest = body.replace(sideRe, (_, valence, side, inner) => {
    /** @type {Where[]} */
    const where = [];
    const left = inner.replace(new RegExp(`@(${NAME})(?:\\[([^\\]]*)\\])?`, 'g'), (/** @type {string} */ __, /** @type {string} */ to, /** @type {string | undefined} */ how) => {
      where.push({ to, how: how == null ? [] : how.split(',').map((h) => h.trim()).filter(Boolean) });
      return ' ';
    });
    if (left.trim()) where.push({ to: '', how: [left.trim()] });   // something that is not a place: refused below
    sides.push({ sign: valence === 'boon' ? 'forward' : 'inverse', valence, side, where });
    return ' ';
  });
  if (rest.trim() || !sides.length) return null;
  if (sides.some((s) => s.where.some((w) => !w.to || w.how.some((h) => !new RegExp(`^${NAME}$`).test(h))))) return null;
  return { what, on, sides };
}

/* ─── The real parser ─── */

/** @param {any} param @returns {string | null} */
function frameWord(param) {
  const v = param?.value;
  if (!v) return null;
  const id = (v.terms || []).find((/** @type {any} */ t) => t.type === 'Identifier');
  if (id) return id.token?.value ?? null;
  if (v.type === 'Literal') return v.token?.value ?? null;
  // A shelf word in a frame comes back as a modifier on an empty expression.
  return v.modifiers?.modifiers?.[0]?.value ?? null;
}

/**
 * A fork read with the real parser: the line must read whole, be one ? operation with a name and a frame, and hold
 * only signed edges whose places are references. null otherwise.
 * @param {string} text
 * @param {{ parse: Function, readBias?: Function }} seed vendor/spw-seed.mjs
 * @returns {Fork | null}
 */
export function readFork(text, seed) {
  if (!seed?.parse) return null;
  const result = seed.parse(String(text || '').trim(), { lexProfile: 'prose' });
  if (!result?.completeness?.complete || result.completeness.proseFallback) return null;
  const top = result.ast?.expression?.expressions || [];
  if (top.length !== 1 || top[0].terms?.length !== 1) return null;
  const op = top[0].terms[0];
  if (op.type !== 'Operation' || op.operator?.value !== '?' || !op.operatorLabel?.value) return null;
  const frame = op.frame?.content || [];
  const on = frame.length === 1 ? frameWord(frame[0]) : null;
  if (!on) return null;
  /** @type {Side[]} */
  const sides = [];
  for (const expr of op.body?.sequence?.expressions || []) {
    for (const term of expr.terms || []) {
      const valence = term.modifiers?.modifiers?.[0]?.value;
      if (term.type !== 'Operation' || term.operator?.value !== '=' || !valence || term.subject?.type !== 'Reference') return null;
      const bias = seed.readBias ? seed.readBias(term) : null;
      /** @type {Where[]} */
      const where = [];
      for (const inner of term.body?.sequence?.expressions || []) {
        const ref = (inner.terms || []).length === 1 ? inner.terms[0] : null;
        if (ref?.type !== 'Reference') return null;
        /** @type {(string | null)[]} */
        const how = (inner.frame?.content || []).map(frameWord);
        if (how.some((h) => h == null)) return null;
        where.push({ to: ref.raw || (ref.path || []).map((/** @type {any} */ p) => p.value).join('.'), how: /** @type {string[]} */ (how) });
      }
      // readBias is the workbench's own reading of the edge: hold the anchor and targets to it when it is there.
      if (bias) {
        if (bias.anchor?.value !== (term.subject.raw || '')) return null;
        if ((bias.targets || []).map((/** @type {any} */ t) => t.value).join() !== where.map((w) => w.to).join()) return null;
      }
      sides.push({ sign: bias?.sign || (valence === 'boon' ? 'forward' : 'inverse'), valence, side: term.subject.raw || '', where });
    }
  }
  if (!sides.length) return null;
  return { what: op.operatorLabel.value, on, sides };
}

/**
 * What is wrong with a fork, in words; empty when it is whole. A fork forks: at least one side, every side goes
 * somewhere, every side is signed boon or bane, and it is decided by something the site knows how to decide.
 * @param {Fork | null} fork
 * @returns {string[]}
 */
export function forkProblems(fork) {
  if (!fork) return ['it does not read as a fork'];
  const problems = [];
  if (!DECIDERS.includes(fork.on)) problems.push(`nothing decides a fork on ${fork.on}`);
  fork.sides.forEach((s) => {
    if (!(s.valence in SIGNS)) problems.push(`=${s.valence}@${s.side}: a side leans boon or bane`);
    if (!s.where.length) problems.push(`=${s.valence}@${s.side}: a side that goes nowhere`);
    if (SHELF_WORDS.includes(s.side) || s.where.some((w) => SHELF_WORDS.includes(w.to))) problems.push(`=${s.valence}@${s.side}: a shelf word is a modifier, never a place`);
  });
  if (fork.on === 'way' && fork.sides.length !== 2) problems.push('a fork on the way has two sides: the book as it stands, and turned');
  if (fork.on === 'shelves' && fork.sides.some((s) => s.where.some((w) => !w.how.length || w.how.some((h) => !SHELF_WORDS.includes(h))))) problems.push('every place in a weighed fork names the shelves it leans on');
  return problems;
}

/* ─── Weighed forks: the land draws one place ─── */

/**
 * The five-part signature of every place a weighed fork can go: how many times each shelf is named in its frame.
 * @param {Fork | null} fork
 * @returns {Record<string, Record<string, number>>}
 */
export function signaturesOf(fork) {
  /** @type {Record<string, Record<string, number>>} */
  const out = {};
  (fork?.sides || []).forEach((s) => s.where.forEach((w) => {
    /** @type {Record<string, number>} */
    const sig = {};
    w.how.forEach((h) => { if (SHELF_WORDS.includes(h)) sig[h] = (sig[h] || 0) + 1; });
    out[w.to] = sig;
  }));
  return out;
}

/**
 * The line that chose: the fork's side with its places ranked by the odds, first strongest (the bias registry's
 * ranked-targets convention), and the place drawn as its own edge.
 * @param {Fork} fork
 * @param {{ id: string, p: number }[]} odds
 * @param {string} drew
 * @returns {{ ranked: string, drawn: string, words: string }}
 */
export function choseLine(fork, odds, drew) {
  const side = fork.sides[0];
  const order = [...odds].sort((a, b) => b.p - a.p);
  const ranked = `=${side.valence}@${side.side}{ ${order.map((o) => `@${o.id}`).join(' ')} }`;
  const drawn = `=${side.valence}@${side.side}{ @${drew} }`;
  const words = order.map((o) => `${o.id} ${Math.round(o.p * 100)} in 100`).join(', ');
  return { ranked, drawn, words };
}

/* ─── The reader's way: forks drawn from book/content/world/way.json ─── */

/**
 * A chapter's own fork on the way: kept, or set aside (the chapter after it says what it held; the last says where a
 * way ends).
 * @param {number} n
 * @param {number} total
 * @returns {Fork}
 */
export function chapterFork(n, total) {
  const away = n < total ? { to: cid(n + 1), how: ['held'] } : { to: cid(Math.max(1, n - 1)), how: ['last'] };
  return { what: cid(n), on: 'way', sides: [
    { sign: 'forward', valence: 'boon', side: 'kept', where: [{ to: cid(n), how: [] }] },
    { sign: 'inverse', valence: 'bane', side: 'aside', where: [away] }
  ] };
}

/**
 * A pairing's fork: they meet, as the book has it, or are kept apart, and where each of those goes, from the pairing's
 * own fields (aside, rooms, lanes). Never written by hand.
 * @param {{ id: string, aside?: number[], rooms?: { chapter: number }[], lanes?: object }} pair
 * @returns {Fork}
 */
export function pairFork(pair) {
  const aside = [...new Set((pair.aside || []).map(Number))];
  const told = [...new Set((pair.rooms || []).map((r) => Number(r.chapter)))].filter((c) => !aside.includes(c));
  const chapters = [...new Set([...aside, ...told])].sort((a, b) => a - b);
  /** @type {Where[]} */
  const meet = chapters.map((c) => ({ to: cid(c), how: [] }));
  /** @type {Where[]} */
  const apart = chapters.map((c) => ({ to: cid(c), how: [aside.includes(c) ? 'aside' : 'told'] }));
  if (pair.lanes) { meet.push({ to: 'lanes', how: [] }); apart.push({ to: 'lanes', how: ['apart'] }); }
  return { what: pair.id, on: 'way', sides: [
    { sign: 'forward', valence: 'boon', side: 'meet', where: meet },
    { sign: 'inverse', valence: 'bane', side: 'apart', where: apart }
  ] };
}

/**
 * Every fork the way has: one per chapter, then one per pairing.
 * @param {{ pairs?: { id: string, name?: string, aside?: number[], rooms?: { chapter: number }[], lanes?: object }[] } | null} data
 * @param {number} total
 * @returns {ForkEntry[]}
 */
export function wayForks(data, total) {
  /** @type {ForkEntry[]} */
  const out = [];
  for (let n = 1; n <= total; n += 1) {
    const fork = chapterFork(n, total);
    out.push({ id: cid(n), kind: 'chapter', chapter: n, name: chapterWords(n), line: forkLine(fork), fork });
  }
  (data?.pairs || []).forEach((p) => {
    const fork = pairFork(p);
    out.push({ id: p.id, kind: 'pair', pair: p.id, name: p.name || p.id, line: forkLine(fork), fork });
  });
  return out;
}

/**
 * The forks that touch chapter n: its own, and every pairing that sets it aside or tells it another way.
 * @param {number} n
 * @param {Parameters<typeof wayForks>[0]} data
 * @param {number} total
 * @returns {ForkEntry[]}
 */
export function forksOfChapter(n, data, total) {
  return wayForks(data, total).filter((e) => (e.kind === 'chapter' ? e.chapter === n : e.fork.sides.some((s) => s.where.some((w) => chapterOf(w.to) === n))));
}

/**
 * Which side of a fork on the way a reader is on.
 * @param {ForkEntry} entry
 * @param {{ aside: number[], apart: string[] }} way
 * @param {number[]} asideNow every chapter out of the way, a pairing's included
 * @returns {string}
 */
export function sideOf(entry, way, asideNow) {
  if (entry.kind === 'pair') return way.apart.includes(String(entry.pair)) ? 'apart' : 'meet';
  return asideNow.includes(Number(entry.chapter)) ? 'aside' : 'kept';
}

/** A place, in words. @param {Where} w */
export function sayWhere(w) {
  const n = chapterOf(w.to);
  const how = w.how[0] || '';
  if (n) {
    const name = chapterWords(n);
    return ({ '': `${name} as written`, told: `${name} told another way, the changed words marked`, aside: `${name} set aside`, held: `${name} says in a line what was held`, last: `the way ends at ${name}` })[how] || `${name} (${w.how.join(', ')})`;
  }
  if (w.to === 'lanes') return how === 'apart' ? 'the lanes keep them apart too' : 'the lanes as they are';
  return w.how.length ? `${w.to} (${w.how.join(', ')})` : w.to;
}

/** A side, in words. @param {Side} s */
export const saySide = (s) => s.where.map(sayWhere).join('; ');
