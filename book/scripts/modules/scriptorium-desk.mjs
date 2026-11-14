/**
 * scriptorium-desk.mjs — the reader's desk, worked by spells.
 *
 * The Scriptorium is where the serial keeps your place: pick up where you
 * stopped, see your copy of the book, keep it for offline, learn when the
 * next chapter lands and what changed, write to the scribes, set the room.
 * Every one of those is also a spell — a line of Spw — shown on its card and
 * castable by tapping it. Newcomers learn by tapping; once learned, press /
 * anywhere on the desk and cast. Plain words search the whole book, and the
 * results open on the exact words (URL text fragments). Practice mode asks
 * for a spell in plain words and checks it without casting.
 *
 * Spell grammar (the same shape as any Spw expression):
 *   <operator>[<handle>]{<payload>}   or   <operator><handle>
 * The operator is the verb, and each verb reads as the operator's literary
 * meaning (spw-resonance.mjs): @ whose eyes, ~ the unspent, ! the event…
 */

import { OPERATOR_RESONANCE } from './spw-resonance.mjs?v=2026_09_26.C';
import { SWITCHES, readSwitches, setSwitch, keepChapters } from './reading-switches.mjs?v=2026_11_13.B';
import { readHeard, heardCount, loadTellingTotals } from './tellings.mjs?v=2026_11_09.L';
import { openBeginAgain, fromTheTop } from './begin-again.mjs?v=2026_11_12.A';
import { BINDINGS } from './reading-nook.mjs?v=2026_11_09.L';
import { readStory, describeStory, hasStory } from './story-directions.mjs?v=2026_11_09.L';
import { constellationFor, semanticIndex } from './constellation.mjs?v=2026_11_08.J';
import { TOTAL_CHAPTERS, NEXT_STONE } from './book-extent.mjs';
import { SIGHTINGS, readSightings, sightingsFigure } from './sightings.mjs?v=2026_11_05.B';
import { loadAlmanac, readAlmanac } from './almanac.mjs?v=2026_11_13.B';
import { readCarries, carriesSummary, chapterList, describeLean } from './pie-carries.mjs?v=2026_11_08.J';
import { mergeBoard } from './spw-formulas.mjs?v=2026_11_13.B';
import { loadLand, answer as landAnswer } from './land-answers.mjs?v=2026_11_13.B';
import { noteCrossing } from './trope-reveal.mjs?v=2026_11_13.B';
import { readBoardLine } from '../home/pie-frame.mjs?v=2026_11_13.B';

const CATALOG_URL = '/book/content/catalog.json';
const SEMANTIC_URL = '/book/content/semantic.json';
const CHANGES_URL = '/book/content/changes.json';
const SEARCH_URL = '/book/content/search.json';
const FEEDBACK_URL = 'https://autonomous.feedback/lore.land?at=';
const HISTORY_KEY = 'lore.desk.spells.v1';
const PIE_KEY = 'lore.pie.v1';
/* The real parser, loaded only when a formula is cast. */
let seedPromise = null;
const loadSeed = () => { seedPromise = seedPromise || import('../vendor/spw-seed.mjs').catch(() => null); return seedPromise; };
/* What the desk's own spells answer, by operator: anything else with a sign is the land's to answer (land-answers.mjs). */
const DESK_OWNS = Object.freeze({
  '@': /^(folios?|pie|game|play|home|entrance|chapter\/\d+|\d{1,2})$/i,
  '~': /^(resume)?$/i,
  '?': /^(spells|next|new|shelf|find|living|breathing|sightings|hat|almanac|wonders|pie|carries|tellings|told|links|story)?$/i,
  '&': /^(threads?|motif|trope|foreshadow|lean|voice)?$/i,
  '%': /^(read)?$/i,
  '!': /^(again|keep)$/i,
  '^': /^(slip|\d{1,2}|chapter\/\d+)?$/i,
  '#': /^(stacks|\d{1,2}|chapter\/\d+)?$/i,
  '*': /^(card|\d{1,2}|chapter\/\d+)?$/i,
  '=': /^(lens|genre|light|binding|cozy|texture)$/i,
  '$': /^(desk)?$/i
});
const NOOK_KEY = 'lore.nook.v1';
const TOTAL = TOTAL_CHAPTERS;

const pad = (n) => String(n).padStart(2, '0');

function readJSON(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode: the desk still works for this visit.
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => {
    if (child != null && child !== false) node.append(child);
  });
  return node;
}

/* ─── The reader's state, read from what the chapters already keep ───── */

function readerState() {
  const progress = readJSON('lore.chapter.progress.v1', {});
  const visited = new Set((progress.visited || []).map((value) => Number(value)));
  const resume = Number(window.localStorage?.getItem?.('lore.reading.resume-chapter') || 0) || 0;
  const nav = readJSON('lore.ebook.navigation.v1', {});
  const place = resume ? nav[`chapter-${pad(resume)}`] : null;
  return { visited, resume, place };
}

/** When the next stone is set: the serial's own date if it has one, else the next 13th or 26th. */
function nextStone(from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const [y, m, d] = String(NEXT_STONE?.date || '').split('-').map(Number);
  if (y && m && d) {
    const set = new Date(y, m - 1, d);
    if (set >= today) return { date: set, days: Math.round((set - today) / 86400000) };
  }
  for (let offset = 0; offset < 2; offset += 1) {
    for (const day of [13, 26]) {
      const candidate = new Date(today.getFullYear(), today.getMonth() + offset, day);
      if (candidate >= today) {
        const days = Math.round((candidate - today) / 86400000);
        return { date: candidate, days };
      }
    }
  }
  return null;
}

/* ─── Spells ─────────────────────────────────────────────────────────── */

const SPELL_PATTERN = /^\s*([!?~@&*^#.=%$])\s*(?:\[([^\]]*)\]|([\w./-]+))?\s*(?:\{([^}]*)\})?\s*$/;

export function parseSpell(line) {
  const match = SPELL_PATTERN.exec(String(line || ''));
  if (!match) {
    return null;
  }
  const [, op, framed, bare, payload] = match;
  return { op, handle: (framed ?? bare ?? '').trim(), payload: (payload ?? '').trim() };
}

function chapterFrom(value) {
  const digits = String(value || '').match(/(\d{1,2})/);
  const number = digits ? Number(digits[1]) : 0;
  return number >= 1 && number <= TOTAL ? number : 0;
}

/** The spellbook: what a desk can do, as Spw. `example` is castable as-is. */
export const SPELLBOOK = Object.freeze([
  { op: '~', example: '~[resume]', does: 'Pick up where you left off.' },
  { op: '@', example: '@05', does: 'Open a chapter. @[chapter/05]{section} opens a chamber.' },
  { op: '@', example: '@[folios]', does: 'Step over to the folio wall: pages under glass, seasoning.' },
  { op: '@', example: '@[pie]', does: 'Exactly One Pie: carry it up the lanes of Bonk City and try not to spill it.' },
  { op: '?', example: '?[next]', does: 'Ask when the next chapter lands. Also ?[new], ?[shelf].' },
  { op: '?', example: '?[find]{berries remember}', does: 'Search the whole book. Plain words work too.' },
  { op: '?', example: '?[sightings]', does: 'The figure under the hat: what you have noticed, and his drawing so far.' },
  { op: '?', example: '?[almanac]', does: 'The creatures, antiques, artifacts, contrivances and bracework you have kept, and how many are still out there.' },
  { op: '?', example: '?[pie]', does: 'Your carries: how far, how many clowns got WAP, each chapter’s reading lean, and any chapter Mimes Against WAP hold.' },
  { op: '?', example: '?[living]', does: 'What breathes in the book: how many phrases turn by the minute, the hour and the day.' },
  { op: '?', example: '?[tellings]', does: 'How many of the book’s other tellings you have heard.' },
  { op: '?', example: '?[links]', does: 'What a link can carry to set the story: an edition, a lens, the room, a binding, pinned tellings.' },
  { op: '&', example: '&[thread]{motif}', does: 'Where a thread runs: every chamber that carries it. Also &[motif]{unspent-wish}, &[trope]{…}, &[lean]{bone}, &[voice]{fool}.' },
  { op: '&', example: '&[threads]', does: 'The whole weave: every thread and mark, with how far each runs.' },
  { op: '%', example: '%[read]', does: 'Count what you have read.' },
  { op: '!', example: '![keep]{shelf}', does: 'Keep every chapter for offline reading.' },
  { op: '!', example: '![again]', does: 'Begin the book again: from the top, or a fresh copy. ![again]{top} goes straight there.' },
  { op: '^', example: '^[slip]{05}', does: 'Write a slip to the scribes about a chapter.' },
  { op: '#', example: '#[stacks]{03}', does: 'Open a chapter at its shelf-mates in the library.' },
  { op: '*', example: '*[card]{05}', does: 'Copy a chapter’s link, card and all.' },
  { op: '=', example: '=[lens]{bone}', does: 'Read chapters as boon, bane or bone (or balanced).' },
  { op: '=', example: '=[genre]{boon:2 bone:1}', does: 'Blend genres: fairy tale, absurd reality, low magic, in any proportion.' },
  { op: '=', example: '=[light]{lamp}', does: 'Set the room: light day|dusk|lamp, or any switch on|off.' },
  { op: '=', example: '=[binding]{glass}', does: 'Bind the book: rag, glass, salt, ember, slate or starfield.' },
  { op: '$', example: '$[desk]', does: 'Show this spellbook.' },
  { op: '@', example: '@boof{ ?scent }', does: 'Name anything in the land under any sign, a character, a wonder, a room, a trope, a folio, and the land answers in the book’s own words.' },
  { op: '*', example: '*hand[3]{ %from[5] =ordered[no] =repeats[no] }', does: 'Count hands of cards, and list them when there are few.' },
  { op: '~', example: '<boon>.land@boof', does: 'A concept, and where a mind holds it: {boon}.land is the place itself; <boon> is the idea, and Boof holds it as {bone}.' },
  { op: '^', example: '^board{ @hold[two_thumbs] }', does: 'How you hold the pie game, kept for the lanes.' }
]);

const PRACTICE = Object.freeze([
  { ask: 'Open Chapter Seven.', check: (s) => s.op === '@' && chapterFrom(s.handle || s.payload) === 7 },
  { ask: 'Ask when the next chapter lands.', check: (s) => s.op === '?' && s.handle === 'next' },
  { ask: 'Count your sightings of the hat.', check: (s) => s.op === '?' && s.handle === 'sightings' },
  { ask: 'Open your almanac and count what you have kept.', check: (s) => s.op === '?' && s.handle === 'almanac' },
  { ask: 'Keep the whole book for a trip without signal.', check: (s) => s.op === '!' && s.handle === 'keep' },
  { ask: 'Pick up where you stopped reading.', check: (s) => s.op === '~' && (!s.handle || s.handle === 'resume') },
  { ask: 'Turn the room to lamplight.', check: (s) => s.op === '=' && s.handle === 'light' && s.payload === 'lamp' },
  { ask: 'Read the next chapter for what will remain.', check: (s) => s.op === '=' && s.handle === 'lens' && s.payload === 'bone' },
  { ask: 'Find every chamber where the unspent wish recurs.', check: (s) => s.op === '&' && /^(motif|thread)$/.test(s.handle) && s.payload === 'unspent-wish' },
  { ask: 'Tell the scribes what stayed with you in Chapter Two.', check: (s) => s.op === '^' && s.handle === 'slip' && chapterFrom(s.payload) === 2 },
  { ask: 'Find Chapter Three’s shelf-mates in the library.', check: (s) => s.op === '#' && s.handle === 'stacks' && chapterFrom(s.payload) === 3 }
]);

/* ─── Search ─────────────────────────────────────────────────────────── */

let searchIndex = null;
async function loadSearch() {
  if (!searchIndex) {
    searchIndex = fetch(SEARCH_URL).then((res) => (res.ok ? res.json() : { entries: [] })).catch(() => ({ entries: [] }));
  }
  return searchIndex;
}

function encodeFragment(text) {
  return encodeURIComponent(text).replace(/-/g, '%2D').replace(/,/g, '%2C').replace(/&/g, '%26');
}

async function searchBook(query, catalog) {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 1);
  if (!words.length) {
    return [];
  }
  const index = await loadSearch();
  const phrase = query.trim().toLowerCase();
  return (index.entries || [])
    .map((entry) => {
      const hay = entry.text.toLowerCase();
      if (!words.every((word) => hay.includes(word) || entry.label.toLowerCase().includes(word))) {
        return null;
      }
      const at = hay.indexOf(phrase) >= 0 ? hay.indexOf(phrase) : hay.indexOf(words[0]);
      // Text fragments only match on word boundaries: widen the match to
      // whole words ("remember" inside "remembered" → "remembered").
      let end = at + (hay.indexOf(phrase) >= 0 ? phrase.length : words[0].length);
      let begin = at;
      while (begin > 0 && /[\p{L}\p{N}'’]/u.test(entry.text[begin - 1])) begin -= 1;
      while (end < entry.text.length && /[\p{L}\p{N}'’]/u.test(entry.text[end])) end += 1;
      const exact = at >= 0 ? entry.text.slice(begin, end) : '';
      const score = (hay.includes(phrase) ? 10 : 0) + words.filter((word) => entry.label.toLowerCase().includes(word)).length * 3 + words.length;
      const start = Math.max(0, at - 60);
      const snippet = `${start > 0 ? '…' : ''}${entry.text.slice(start, at + 110).trim()}…`;
      const chapter = catalog?.chapters?.find((item) => item.number === entry.c);
      const href = `/book/chapter/${pad(entry.c)}/#${entry.id}${exact ? `:~:text=${encodeFragment(exact)}` : ''}`;
      return { entry, chapter, snippet, href, score, exact };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

/* ─── The desk ───────────────────────────────────────────────────────── */

export async function initScriptoriumDesk() {
  const mount = document.getElementById('desk');
  if (!mount) {
    return () => {};
  }
  const catalog = await fetch(CATALOG_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  const changes = await fetch(CHANGES_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  const titleOf = (n) => catalog?.chapters?.find((item) => item.number === n)?.title || `Chapter ${pad(n)}`;
  const reply = el('div', { className: 'spell-reply', role: 'status', 'aria-live': 'polite' });
  const history = readJSON(HISTORY_KEY, []);
  let historyAt = history.length;
  let practice = null;

  const say = (op, ...content) => {
    const reading = OPERATOR_RESONANCE[op];
    reply.replaceChildren(
      el('span', { className: 'spell-reply-sigil', 'aria-hidden': 'true' }, op),
      el('div', { className: 'spell-reply-body' },
        reading ? el('p', { className: 'spell-reply-reading' }, `${op} ${reading.name}`) : null,
        ...content
      )
    );
    reply.classList.remove('is-cast');
    void reply.offsetWidth;
    reply.classList.add('is-cast');
  };

  const go = (href) => {
    window.setTimeout(() => { window.location.href = href; }, 420);
  };

  /* The line as a loop (spw-cadence.mjs): drawn as a ring in the time of whoever it names with @ (else Boof), heard only
   * when pressed, and played in anyone else's time on request. The line is the score, and it travels as a link. */
  let cadenceMod = null;
  let playing = null;
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  async function cadenceBlock(text, seed) {
    try { cadenceMod = cadenceMod || await import('./spw-cadence.mjs?v=2026_11_11.A'); } catch { return null; }
    const mod = cadenceMod;
    const named = mod.playerFor(/@([A-Za-z_-]+)/.exec(text)?.[1] || '');
    let current = mod.cadenceOf(text, named || 'boof', { bars: 2, parse: seed?.parse || null });
    const ring = el('div', { className: 'desk-cadence-ring' });
    const says = el('p', { className: 'desk-cadence-says' });
    const paint = (c) => {
      current = c;
      ring.innerHTML = mod.cadenceRingSVG(c, { size: 132, palette: mod.castOf(c.who).palette });
      says.textContent = c.says;
    };
    const hear = (c) => {
      playing?.stop();
      const sound = mod.playCadence(c, { loops: 2 });
      playing = sound;
      const hand = ring.querySelector('.cadence-hand');
      if (!sound || !hand || reducedMotion()) return;
      const start = performance.now();
      hand.setAttribute('opacity', '0.9');
      const turn = (now) => {
        const t = (now - start) / 1000;
        if (playing !== sound || t > sound.seconds) { hand.setAttribute('opacity', '0'); return; }
        hand.setAttribute('transform', `rotate(${((t / (sound.seconds / 2)) * 360) % 360} 50 50)`);
        requestAnimationFrame(turn);
      };
      requestAnimationFrame(turn);
    };
    paint(current);
    const others = mod.PLAYERS.filter((p) => p !== current.who && p !== 'figure').map((p) => el('button', {
      type: 'button', className: 'spell-chip', onClick: () => { paint(mod.cadenceOf(text, p, { bars: 2, parse: seed?.parse || null })); hear(current); }
    }, mod.castOf(p).name.replace(/^The /, '')));
    const share = `${window.location.origin}/scriptorium/?cast=${encodeURIComponent(text)}`;
    return el('div', { className: 'desk-cadence' },
      ring,
      says,
      current.whole === false ? el('p', {}, 'It did not read whole as Spw, so it is heard as far as it reads, token by token.') : null,
      el('p', {}, el('button', { type: 'button', className: 'spell-chip', onClick: () => hear(current) }, 'Hear it'), ' ', el('span', {}, 'or in another time: '), ...others),
      el('p', {}, 'What you wrote is a loop anyone can play back. ', el('a', { href: share }, 'Pass it along →')));
  }

  /* Each spell's effect. Returns nothing; speaks through `say`. */
  const cast = async (line) => {
    const text = String(line || '').trim();
    if (!text) {
      return;
    }
    // A route (texture-routes.mjs): a line that begins ?/ is an address, opened through the same door the root page uses.
    if (!practice && /^\?\/\S/.test(text)) {
      say('?', el('p', {}, `Following the route ${text}.`));
      go(`/texture/${text.replace(/\s+/g, '+')}`);
      return;
    }
    // A board line (pie-frame.mjs): kept into the pie game's record, so the lanes open held this way.
    if (!practice && /^\^board\s*\{/.test(text)) {
      const seed = await loadSeed();
      const { view, unknown, reader } = readBoardLine(text, { parse: seed?.parse || null });
      const keys = Object.keys(view);
      if (keys.length) writeJSON(PIE_KEY, mergeBoard(readJSON(PIE_KEY, {}), view));
      say('^', el('p', {}, keys.length ? `Kept for the lanes${reader === 'spw-seed' ? ', read by the Spw parser' : ''}: ${keys.map((k) => `${k} ${String(view[k])}`).join(', ')}. The game opens held this way.` : 'Nothing in that line is a choice the board has.'),
        unknown.length ? el('p', {}, `Not taken: ${unknown.join('; ')}.`) : null,
        keys.length ? el('a', { href: '/pie/' }, 'To the lanes →') : null);
      return;
    }
    const spell = parseSpell(text);

    if (practice) {
      const drill = PRACTICE[practice.index];
      if (spell && drill.check(spell)) {
        practice.index += 1;
        practice.right += 1;
        if (practice.index >= PRACTICE.length) {
          say(spell.op, el('p', {}, `The spell holds. That is all ${PRACTICE.length}: you can work the desk by spell now. Press / anywhere on this page to cast.`));
          practice = null;
          practiceButton.textContent = 'Practise again';
          practiceButton.setAttribute('aria-pressed', 'false');
          return;
        }
        say(spell.op, el('p', {}, 'The spell holds.'), el('p', { className: 'spell-reply-ask' }, `Next: ${PRACTICE[practice.index].ask}`));
      } else {
        say('?', el('p', {}, spell ? 'Close — that spell does something else.' : 'Plain words search the book, but here the desk wants a spell. A spell starts with a sign: @ ~ ! ? ^ = …'),
          el('p', { className: 'spell-reply-ask' }, `Still: ${drill.ask}`));
      }
      return;
    }

    history.push(text);
    writeJSON(HISTORY_KEY, history.slice(-30));
    historyAt = history.length;

    // The land answers (land-answers.mjs): anything written with a sign or a container that is not a desk spell is
    // read, and acknowledged in the book's own words, or answered honestly with what was read and what is near.
    const owned = spell && (DESK_OWNS[spell.op]?.test(spell.handle) || (spell.op === '=' && SWITCHES.some((entry) => entry.id === spell.handle)) || (spell.op === '@' && chapterFrom(spell.handle)));
    const switchOn = (id) => readSwitches().values?.[id] === 'on';
    if (!owned && switchOn('land-answers') && /^[!?~@&*^#.=%$<{[(]/.test(text)) {
      const [land, seed] = await Promise.all([loadLand({ withWeight: switchOn('reasons') }), loadSeed()]);
      const heard = landAnswer(land, text, { parse: seed?.parse || null, readBias: seed?.readBias || null });
      // A trope written at the desk is met in a strand of its own (trope-reveal.mjs): it counts toward its turn.
      if (heard.acknowledged && heard.noun && String(heard.href || '').includes('tropes.json')) noteCrossing(String(heard.noun).replace(/_/g, '-'), 'desk');
      const sign = heard.sigil || text[0];
      say(sign, ...heard.says.map((line) => el('p', {}, line)),
        heard.href ? el('a', { href: heard.href }, 'Where the land keeps it →') : null,
        await cadenceBlock(text, seed));
      return;
    }

    if (!spell) {
      const results = await searchBook(text, catalog);
      say('?', el('p', {}, results.length ? `Found in ${results.length} ${results.length === 1 ? 'place' : 'places'}. Opens on the words themselves.` : 'Not in the book yet. Try fewer words, or a name.'),
        results.length ? el('ol', { className: 'desk-results' }, results.map((r) => el('li', {},
          el('a', { href: r.href }, el('span', { className: 'desk-result-where' }, `${pad(r.entry.c)} · ${r.chapter?.title || ''} · ${r.entry.label}`),
            el('span', { className: 'desk-result-snippet' }, r.snippet))
        ))) : null);
      return;
    }

    const { op, handle, payload } = spell;
    const state = readerState();
    if (op === '@') {
      const home = /^(home|entrance)$/i.test(handle);
      const n = chapterFrom(handle || payload);
      if (/^folios?$/i.test(handle)) {
        say(op, el('p', {}, 'Stepping over to the folio wall.'));
        go('/folios/');
      } else if (/^(pie|game|play)$/i.test(handle)) {
        say(op, el('p', {}, 'Someone is destined to spill exactly one pie. Off to the lanes.'));
        go('/pie/?from=%2Fscriptorium%2F');
      } else if (home) {
        say(op, el('p', {}, 'Stepping back to the entrance.'));
        go('/');
      } else if (n) {
        const anchor = payload && !/^\d+$/.test(payload) ? `#${payload}` : '';
        say(op, el('p', {}, `Stepping into Chapter ${pad(n)}: ${titleOf(n)}.`));
        go(`/book/chapter/${pad(n)}/${anchor}`);
      } else {
        say(op, el('p', {}, 'Whose eyes? Name a chapter: @05, or @[chapter/05].'));
      }
    } else if (op === '~') {
      if (!state.resume) {
        say(op, el('p', {}, 'Nothing is waiting yet: you have not opened a chapter here. Chapter One begins it.'));
      } else {
        const anchor = state.place?.sectionId ? `#${state.place.sectionId}` : '';
        say(op, el('p', {}, `Picking up Chapter ${pad(state.resume)}: ${titleOf(state.resume)}${state.place?.sectionIndex ? `, §${pad(state.place.sectionIndex)}` : ''}.`));
        go(`/book/chapter/${pad(state.resume)}/${anchor}`);
      }
    } else if (op === '?') {
      if (!handle || handle === 'spells') {
        say(op, el('p', {}, 'The spellbook is below. Tap any spell to cast it.'));
        document.getElementById('desk-spellbook')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (handle === 'next') {
        const stone = nextStone();
        const when = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(stone.date);
        say(op, el('p', {}, stone.days === 0 ? `Today, ${when}, is a stone day.` : `The next stone is set ${when} — in ${stone.days} day${stone.days === 1 ? '' : 's'}.`));
      } else if (handle === 'new') {
        const latest = changes?.releases?.[0];
        say(op, latest ? el('ul', {}, (latest.notes || []).map((note) => el('li', {}, note))) : el('p', {}, 'No notes yet.'));
      } else if (handle === 'shelf') {
        say(op, el('p', {}, await shelfLine()));
      } else if (handle === 'find') {
        cast(payload);
      } else if (handle === 'living' || handle === 'breathing') {
        const index = await semanticIndex();
        const slots = index?.slots;
        const on = readSwitches().values.living === 'on';
        if (!slots) {
          say(op, el('p', {}, 'The book has not said what breathes yet.'));
        } else {
          const total = slots.minute + slots.hour + slots.day;
          say(op, el('div', {},
            el('p', {}, `The book breathes in ${total} places: ${slots.minute} by the minute, ${slots.hour} by the hour, ${slots.day} by the day. The words you read first are always its own.`),
            el('p', {}, on ? 'Phrases turn with the clock for you.' : 'Phrases hold still for you. =[living]{on} lets them turn; for one visit, open a chapter with ?phrases=turn, or ?at=19:00 to read the words of that hour.')));
        }
      } else if (handle === 'links' || handle === 'story') {
        const story = readStory();
        const row = (code, words) => el('li', {}, el('code', {}, code), ` ${words}`);
        say(op, el('div', {},
          el('p', {}, hasStory(story) ? `This visit is following a link: ${describeStory(story).join(', ')}. Add ?story=mine to any chapter to let it go.` : 'Any chapter link can carry how the book is read, for a whole visit:'),
          el('ul', { className: 'spell-reply-list' },
            row('?edition=7', 'every turning phrase takes edition 7’s telling, the same for everyone (any word works: ?edition=winter; ?edition=first is the book’s own)'),
            row('?lens=bone', 'or ?genre=boon:2,bone:1, read as one land or a blend'),
            row('?room=lamp', 'daylight, dusk or lamplight; ?cozy=0.8 and ?texture=0.2 for the page itself'),
            row('?binding=slate', 'rag, glass, salt, ember, slate or starfield'),
            row('?with=living', 'and ?without=wonders, switches for the visit'),
            row('?tell=kitchen-smell.3', 'one page: pin a phrase to a telling (.1 is the book’s own)')),
          el('p', {}, 'Other tellings in any chapter has Copy this telling, which writes one for you.')));
      } else if (handle === 'tellings' || handle === 'told') {
        const totals = await loadTellingTotals();
        const heard = heardCount(readHeard());
        say(op, el('div', {},
          el('p', {}, totals?.total
            ? `You have heard ${heard} of the book’s ${totals.total} tellings.`
            : `You have heard ${heard} tellings.`),
          el('p', {}, 'In any chapter, tap a phrase with a wavy line to hear its next telling, hold it to see them all, or turn the hour in the rail.')));
      } else if (handle === 'almanac' || handle === 'wonders') {
        const data = await loadAlmanac();
        const kept = readAlmanac();
        const line = (kind, word) => {
          const list = data.wonders.filter((w) => w.kind === kind);
          return el('li', {}, `${word}: ${list.filter((w) => kept[w.id]).length} of ${list.length}`);
        };
        const total = data.wonders.filter((w) => kept[w.id]).length;
        say(op, el('div', {},
          el('p', {}, total ? `${total} of ${data.wonders.length} wonders kept.` : 'Nothing kept yet. In any chapter, the dotted words are doors: tap one to keep it.'),
          el('ul', {}, line('creature', 'Creatures'), line('antique', 'Antiques'), line('artifact', 'Artifacts'), line('contrivance', 'Contrivances'), line('bracework', 'Bracework')),
          el('p', {}, el('a', { href: '/almanac/' }, 'Open your almanac →'))));
      } else if (handle === 'sightings' || handle === 'hat') {
        const seen = readSightings();
        const found = SIGHTINGS.filter((s) => seen[s.id]);
        const sketch = el('span', { className: 'desk-sightings-sketch' });
        sketch.innerHTML = sightingsFigure(seen);
        const line = found.length === SIGHTINGS.length
          ? 'Nine sightings, nine strokes. The drawing is whole; he still has no name.'
          : found.length
            ? `${found.length} of ${SIGHTINGS.length} noticed. The rest are in the margins and the prose, waiting to be read past.`
            : 'Nothing noticed yet. He turns up in the margins before he turns up in the story.';
        say(op, el('div', { className: 'desk-sightings' }, sketch,
          el('div', {}, el('p', {}, line),
            found.length ? el('ul', {}, found.map((s) => el('li', {}, el('a', { href: `/book/chapter/${pad(s.chapter)}/` }, `${pad(s.chapter)} · ${s.title}`)))) : null)));
      } else if (handle === 'pie' || handle === 'carries') {
        const record = readJSON('lore.pie.v1', {}) || {};
        const all = readCarries();
        const sum = carriesSummary(all);
        const lines = Object.entries(all)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([n, entry]) => el('li', {},
            el('a', { href: `/book/chapter/${pad(Number(n))}/` }, `${pad(Number(n))} · ${titleOf(Number(n))}`),
            ` — ${describeLean(entry.lean)}${entry.maw === 'won' ? ' · held by the mimes' : entry.maw === 'back' ? ' · won back' : ''}`));
        const said = Array.isArray(record.lore) ? record.lore.length : 0;
        say(op, el('div', {},
          el('p', {}, Number(record.runs)
            ? `Furthest carry: ${Number(record.best) || 0} cobbles. Pies spilled: ${record.runs}, exactly one each time. Clowns given WAP: ${Number(record.waps) || 0}.${said ? ` Lines the pies let slip: ${said}.` : ''}`
            : 'Nobody has carried it yet. The game is a tap away.'),
          sum.held.length ? el('p', {}, `Mimes Against WAP hold ${sum.held.length === 1 ? 'Chapter' : 'Chapters'} ${chapterList(sum.held)}: it is harder to wonder about pie there until you carry it through and out-do them.`) : null,
          lines.length ? el('ul', {}, lines) : null,
          el('p', {}, el('a', { href: '/pie/?from=%2Fscriptorium%2F#pie-carries' }, 'Every chapter’s mark, and the switch →'))));
      } else {
        say(op, el('p', {}, `The desk does not know ?[${handle}] yet. Try ?[next], ?[new], ?[shelf], ?[sightings], ?[almanac], ?[pie] or ?[find]{words}.`));
      }
    } else if (op === '&') {
      const kinds = ['thread', 'motif', 'trope', 'foreshadow', 'lean', 'voice'];
      if (!handle || (/^threads?$/.test(handle) && !payload)) {
        const index = await fetch(SEMANTIC_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
        if (!index) { say(op, el('p', {}, 'The weave is not loaded.')); return; }
        const chip = (key, label, count) => el('button', { type: 'button', className: 'spell-chip', onClick: () => { input.value = key; cast(key); } }, `${label} · ${count}`);
        const threads = Object.entries(index.threads).map(([id, t]) => chip(`&[thread]{${id}}`, t.label, Object.keys(t.chapters).length));
        const motifs = Object.entries(index.marks.motif).map(([k, v]) => chip(`&[motif]{${k}}`, k.split('-').join(' '), v.length));
        const tropes = Object.entries(index.marks.trope).map(([k, v]) => chip(`&[trope]{${k}}`, k.split('-').join(' '), v.length));
        say(op, el('p', {}, 'The weave. Each count is how many places carry it; tap one to see where.'),
          el('p', { className: 'desk-weave-kicker' }, 'Threads'), el('div', { className: 'desk-weave' }, threads),
          el('p', { className: 'desk-weave-kicker' }, 'Motifs'), el('div', { className: 'desk-weave' }, motifs),
          el('p', { className: 'desk-weave-kicker' }, 'Sampled tropes'), el('div', { className: 'desk-weave' }, tropes),
          el('p', { className: 'desk-weave-kicker' }, 'Leans and voices'), el('div', { className: 'desk-weave' },
            ['boon', 'bane', 'bone'].map((l) => chip(`&[lean]{${l}}`, l, index.leans[l].length)),
            Object.entries(index.voices).map(([v, list]) => chip(`&[voice]{${v}}`, v, list.length))));
        return;
      }
      const kind = kinds.includes(handle) ? handle : 'motif';
      const result = await constellationFor(`${kind}:${payload || handle}`);
      if (!result) { say(op, el('p', {}, `Nothing carries ${kind} “${payload || handle}” yet. &[threads] lists what exists.`)); return; }
      say(op, el('p', {}, `${result.title} — ${result.kicker}. Runs through ${result.chapters.length} of ${TOTAL} chambers, ${result.places.length} section${result.places.length === 1 ? '' : 's'}.`),
        el('ol', { className: 'desk-results' }, result.places.map((p) => el('li', {},
          el('a', { href: `/book/chapter/${pad(p.c)}/#${p.id}` },
            el('span', { className: 'desk-result-where' }, `${pad(p.c)} · ${titleOf(p.c)} · ${p.label}${p.n ? ` · ${p.n}` : ''}`))))),
        result.href ? el('a', { href: result.href }, 'All of this thread →') : null);
    } else if (op === '%') {
      say(op, el('p', {}, `You have opened ${state.visited.size} of ${TOTAL} chapters.${state.visited.size < TOTAL ? ` The next unopened is Chapter ${pad([...Array(TOTAL)].map((_, i) => i + 1).find((n) => !state.visited.has(n)))}.` : ' Every one.'}`));
    } else if (op === '!') {
      if (handle === 'again') {
        const how = payload.toLowerCase();
        if (how === 'top') {
          fromTheTop();
          window.location.assign('/book/chapter/01/');
        } else if (how === 'fresh') {
          say(op, el('p', {}, 'A fresh copy clears what you have read and kept. Choose it on the sheet, so nothing is cleared by a typo.'));
          openBeginAgain();
        } else {
          openBeginAgain();
          say(op, el('p', {}, 'Two ways to begin again: from the top, keeping everything, or a fresh copy.'));
        }
        return;
      }
      if (handle !== 'keep') {
        say(op, el('p', {}, 'The desk knows two events: ![keep]{shelf} and ![again].'));
        return;
      }
      setSwitch('offline-shelf', true);
      say(op, el('p', {}, 'Keeping every chapter for offline reading…'));
      keepChapters((result) => {
        say(op, el('p', {}, result ? `${result.kept} of ${result.total} chapters are on your shelf.` : 'The shelf fills the next time you open a chapter with the offline helper running.'));
        refreshShelf();
      });
    } else if (op === '^') {
      const n = chapterFrom(payload || handle) || state.resume || 1;
      say(op, el('p', {}, `A slip for Chapter ${pad(n)}. Boof carries it to the scribes.`));
      window.open(`${FEEDBACK_URL}/book/chapter/${pad(n)}/`, '_blank', 'noopener');
    } else if (op === '#') {
      const n = chapterFrom(payload || handle) || state.resume || 1;
      say(op, el('p', {}, `Chapter ${pad(n)}'s shelf-mates, by call number.`));
      go(`/book/chapter/${pad(n)}/#stacks`);
    } else if (op === '*') {
      const n = chapterFrom(payload || handle) || state.resume || 1;
      const url = `${window.location.origin}/book/chapter/${pad(n)}/`;
      try {
        await navigator.clipboard.writeText(url);
        say(op, el('p', {}, `Copied Chapter ${pad(n)}'s link. It shares with its painting and title.`));
      } catch {
        say(op, el('p', {}, url));
      }
    } else if (op === '=') {
      const value = payload.toLowerCase();
      const nook = readJSON(NOOK_KEY, {});
      if (handle === 'lens' && ['boon', 'bane', 'bone', 'balanced', 'none', ''].includes(value)) {
        const lens = ['boon', 'bane', 'bone'].includes(value) ? value : '';
        const genre = lens ? { boon: 0, bane: 0, bone: 0, [lens]: 1 } : { boon: 1 / 3, bane: 1 / 3, bone: 1 / 3 };
        writeJSON(NOOK_KEY, { ...nook, lens, genre });
        say(op, el('p', {}, lens ? `Chapters will read as ${lens}: ${{ boon: 'the fairytale, wonder first', bane: 'the reality being left behind', bone: 'the notation underneath' }[lens]}.` : 'Chapters will read balanced.'));
      } else if (handle === 'genre' && /boon|bane|bone/.test(value)) {
        // =[genre]{boon:2 bone:1} — a blend, weights in any proportion.
        const raw = { boon: 0, bane: 0, bone: 0 };
        value.replace(/(boon|bane|bone)\s*[:=]?\s*(\d*\.?\d+)?/g, (_, id, amount) => { raw[id] += amount ? Number(amount) : 1; return ''; });
        const total = raw.boon + raw.bane + raw.bone;
        const genre = Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, v / total]));
        const top = Object.entries(genre).sort((a, b) => b[1] - a[1])[0];
        writeJSON(NOOK_KEY, { ...nook, genre, lens: top[1] >= 0.6 ? top[0] : '' });
        const pct = (id) => `${Math.round(genre[id] * 100)}%`;
        say(op, el('p', {}, `Chapters will blend fairy tale ${pct('boon')}, absurd reality ${pct('bane')}, low magic ${pct('bone')}.`));
      } else if (handle === 'light' && ['day', 'dusk', 'lamp'].includes(value)) {
        writeJSON(NOOK_KEY, { ...nook, light: { day: 0, dusk: 0.5, lamp: 1 }[value] });
        say(op, el('p', {}, `The room will be ${value === 'lamp' ? 'lamplit' : value === 'dusk' ? 'at dusk' : 'in daylight'} when you next open a chapter.`));
      } else if (handle === 'binding' && BINDINGS.some((binding) => binding.id === value)) {
        writeJSON(NOOK_KEY, { ...nook, binding: value });
        // One book, one binding: the home page wears it too (home/bindery.mjs).
        try { window.localStorage.setItem('lore.monument.theme', { rag: 'paper', starfield: 'night' }[value] || value); } catch { /* home keeps its own */ }
        const binding = BINDINGS.find((entry) => entry.id === value);
        say(op, el('p', {}, `The book will be bound in ${binding.name} when you next open a chapter. ${binding.says}`));
      } else if (['cozy', 'texture'].includes(handle) && Number.isFinite(Number(value))) {
        writeJSON(NOOK_KEY, { ...nook, [handle]: Number(value) });
        say(op, el('p', {}, `${handle} set to ${value}.`));
      } else if (SWITCHES.some((entry) => entry.id === handle)) {
        const current = readSwitches().values[handle] === 'on';
        const next = value ? value === 'on' : !current;
        setSwitch(handle, next);
        say(op, el('p', {}, `${SWITCHES.find((entry) => entry.id === handle).label}: ${next ? 'on' : 'off'}.`));
        renderSwitches();
      } else {
        say(op, el('p', {}, 'Set what? =[lens]{bone}, =[light]{lamp}, =[binding]{slate}, =[cozy]{1.2}, or a switch like =[focus-line]{on}.'));
      }
    } else if (op === '$') {
      say(op, el('p', {}, 'The desk describing itself: every spell it knows is in the spellbook.'));
      document.getElementById('desk-spellbook')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      say(op, el('p', {}, `${op} is a real sign, but the desk has no spell for it yet.`));
    }
  };

  /* A chip is a spell you can tap. */
  const chip = (spell) => el('button', {
    type: 'button', className: 'spell-chip', title: `Cast ${spell}`,
    onClick: () => { input.value = spell; cast(spell); }
  }, spell);

  /* The spell line. */
  const input = el('input', {
    type: 'text', id: 'spell-line', className: 'spell-input', autocomplete: 'off', spellcheck: 'false',
    placeholder: 'A spell, or words to find', 'aria-describedby': 'spell-hint', list: 'spell-suggestions'
  });
  const suggestions = el('datalist', { id: 'spell-suggestions' }, SPELLBOOK.map((entry) => el('option', { value: entry.example })));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      cast(input.value);
    } else if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyAt = Math.max(0, historyAt - 1);
      input.value = history[historyAt] || '';
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyAt = Math.min(history.length, historyAt + 1);
      input.value = history[historyAt] || '';
    } else if (event.key === 'Escape') {
      if (practice) {
        stopPractice();
      }
      input.value = '';
    }
  });
  const onSlash = (event) => {
    const tag = document.activeElement?.tagName;
    if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      input.focus();
    }
  };
  document.addEventListener('keydown', onSlash);

  function stopPractice() {
    practice = null;
    practiceButton.textContent = 'Practise spells';
    practiceButton.setAttribute('aria-pressed', 'false');
    say('?', el('p', {}, 'Practice put away. The spell line casts for real again.'));
  }

  const practiceButton = el('button', {
    type: 'button', className: 'spell-practice', 'aria-pressed': 'false',
    onClick: () => {
      if (practice) {
        stopPractice();
        return;
      }
      practice = { index: 0, right: 0 };
      practiceButton.textContent = 'Stop practising';
      practiceButton.setAttribute('aria-pressed', 'true');
      say('?', el('p', {}, 'Practice: the desk asks in plain words; you answer with a spell. Nothing is cast while you practise. Esc stops.'),
        el('p', { className: 'spell-reply-ask' }, PRACTICE[0].ask));
      input.focus();
    }
  }, 'Practise spells');

  const slate = el('div', { className: 'spell-slate' },
    el('label', { className: 'spell-label', for: 'spell-line' }, el('span', { 'aria-hidden': 'true' }, '›'), el('span', { className: 'sr-only' }, 'Spell line')),
    input, suggestions,
    el('button', { type: 'button', className: 'spell-cast', onClick: () => cast(input.value) }, 'Cast')
  );
  const hint = el('p', { id: 'spell-hint', className: 'spell-hint' },
    'Tap any spell on the desk to cast it. Once you know them, press ', el('kbd', {}, '/'), ' and type. Plain words search the whole book.');

  /* Cards. */
  const card = (id, op, title, spell, ...body) => el('article', { className: 'desk-card', id, dataset: { sigil: op } },
    el('header', { className: 'desk-card-head' },
      el('h3', {}, title),
      spell ? chip(spell) : null),
    ...body);

  const state = readerState();
  const resumeBody = state.resume
    ? [el('p', { className: 'desk-big' }, `Chapter ${pad(state.resume)}: ${titleOf(state.resume)}`),
      el('p', { className: 'desk-quiet' }, state.place?.sectionIndex ? `You were at §${pad(state.place.sectionIndex)}.` : 'Your place is kept in the chapter.')]
    : [el('p', { className: 'desk-big' }, 'Begin at Chapter One'), el('p', { className: 'desk-quiet' }, 'Dawn in Boon.land. The desk keeps your place from here on.')];

  const stone = nextStone();
  const when = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(stone.date);

  const bookList = el('ol', { className: 'desk-book' }, (catalog?.chapters || []).map((item) => el('li', {
    className: state.visited.has(item.number) ? 'is-opened' : ''
  },
    el('a', { href: item.href },
      el('span', { className: 'desk-book-num' }, pad(item.number)),
      el('span', { className: 'desk-book-title' }, item.title),
      el('span', { className: 'desk-book-mark', 'aria-label': state.visited.has(item.number) ? 'opened' : 'not yet opened' }, state.visited.has(item.number) ? '✓' : '')),
    item.inWhich ? el('span', { className: 'desk-book-which' }, `In which ${item.inWhich}.`) : null
  )));

  const shelfStatus = el('p', { className: 'desk-quiet' }, '…');
  async function shelfLine() {
    if (!('caches' in window)) return 'This browser cannot keep chapters offline.';
    try {
      const cache = await caches.open('lore-pages-v1');
      const kept = (await cache.keys()).filter((request) => /\/book\/chapter\/\d{2}\/$/.test(new URL(request.url).pathname)).length;
      return kept ? `${kept} of ${TOTAL} chapters are on your shelf.` : 'Nothing on your shelf yet.';
    } catch {
      return 'The shelf could not be read.';
    }
  }
  async function refreshShelf() {
    shelfStatus.textContent = await shelfLine();
  }
  refreshShelf();

  const slipSelect = el('select', { className: 'desk-select', 'aria-label': 'Chapter for the slip' },
    (catalog?.chapters || []).map((item) => el('option', { value: item.number, selected: item.number === (state.resume || 1) }, `${pad(item.number)} · ${item.title}`)));
  // The slip's spell follows the select, so it casts what it shows.
  const slipSpell = () => `^[slip]{${pad(slipSelect.value)}}`;
  const slipChip = el('button', {
    type: 'button', className: 'spell-chip',
    onClick: () => { input.value = slipSpell(); cast(slipSpell()); }
  }, slipSpell());
  slipSelect.addEventListener('change', () => { slipChip.textContent = slipSpell(); });

  const switchesBox = el('div', { className: 'desk-switches' });
  function renderSwitches() {
    const { values, engaged } = readSwitches();
    switchesBox.replaceChildren(...SWITCHES
      .filter((entry) => entry.stage === 'stable' || engaged)
      .map((entry) => el('label', { className: 'desk-switch' },
        el('input', {
          type: 'checkbox', checked: values[entry.id] === 'on',
          onChange: (event) => { setSwitch(entry.id, event.target.checked); renderSwitches(); }
        }),
        el('span', {}, entry.label, entry.stage === 'trial' ? el('span', { className: 'desk-trial' }, ' trial') : null),
        el('code', { className: 'desk-switch-spell' }, `=[${entry.id}]{${values[entry.id] === 'on' ? 'off' : 'on'}}`)
      )));
  }
  renderSwitches();

  const latest = changes?.releases?.[0];

  const grid = el('div', { className: 'desk-grid' },
    card('desk-resume', '~', 'Pick up where you left off', '~[resume]', ...resumeBody),
    card('desk-next', '?', 'When the next chapter lands', '?[next]',
      el('p', { className: 'desk-big' }, stone.days === 0 ? 'Today' : when),
      el('p', { className: 'desk-quiet' }, stone.days === 0 ? 'Today is a stone day.' : `In ${stone.days} day${stone.days === 1 ? '' : 's'}. New chapters are set on the 13th and 26th.`)),
    card('desk-book', '%', 'Your copy of the book', '%[read]',
      el('p', { className: 'desk-quiet' }, `${state.visited.size} of ${TOTAL} opened.`), bookList),
    card('desk-shelf', '!', 'Read without a signal', '![keep]{shelf}',
      el('p', {}, 'Keep every chapter on this device, dressed and whole, for trains, flights and quiet rooms.'), shelfStatus),
    card('desk-new', '?', 'What changed', '?[new]',
      latest ? el('ul', { className: 'desk-notes' }, (latest.notes || []).map((note) => el('li', {}, note))) : el('p', {}, 'No notes yet.'),
      latest?.date ? el('p', { className: 'desk-quiet' }, `Set ${latest.date}.`) : null),
    card('desk-slip', '^', 'Write to the scribes', null,
      el('p', {}, 'A line that hummed, a place the path went dark, a theory about the Egg. Boof carries it to the people who write the serial.'),
      el('div', { className: 'desk-row' }, slipSelect, slipChip)),
    card('desk-room', '=', 'Your room and switches', '=[light]{lamp}',
      el('p', { className: 'desk-quiet' }, 'Settings that follow you into every chapter. Each one is a spell too.'), switchesBox),
    card('desk-spellbook', '$', 'The spellbook', '$[desk]',
      el('p', {}, 'Every spell is a line of Spw: a sign, a name in brackets, a value in braces. The sign is the verb, and each verb has a meaning in the story.'),
      el('table', { className: 'desk-spells' },
        el('tbody', {}, SPELLBOOK.map((entry) => el('tr', {},
          el('td', {}, chip(entry.example)),
          el('td', {}, entry.does, el('span', { className: 'desk-spell-reading' }, ` ${entry.op} ${OPERATOR_RESONANCE[entry.op]?.name || ''}`))
        )))),
      practiceButton)
  );

  const index = el('nav', { className: 'desk-index', 'aria-label': 'Desk' },
    [['desk-resume', '~', 'Pick up'], ['desk-next', '?', 'Next'], ['desk-book', '%', 'Your book'], ['desk-shelf', '!', 'Offline'],
      ['desk-new', '?', 'New'], ['desk-slip', '^', 'Slip'], ['desk-room', '=', 'Room'], ['desk-spellbook', '$', 'Spells']]
      .map(([id, op, label]) => el('a', { href: `#${id}` }, el('span', { className: 'desk-index-sigil', 'aria-hidden': 'true' }, op), label)));

  mount.replaceChildren(slate, hint, reply, index, grid);
  mount.dataset.ready = 'true';
  // A line passed along (?cast=): cast as if written here. It is read and answered; nothing is heard until pressed.
  try {
    const passed = new URLSearchParams(window.location.search).get('cast');
    if (passed) { input.value = passed; cast(passed); }
  } catch { /* no line in the address */ }

  return () => document.removeEventListener('keydown', onSlash);
}

if (typeof document !== 'undefined') {
  const start = () => initScriptoriumDesk();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
