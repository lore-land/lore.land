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
import { SWITCHES, readSwitches, setSwitch, keepChapters } from './reading-switches.mjs?v=2026_09_27.D';
import { constellationFor } from './constellation.mjs?v=2026_09_27.I';

const CATALOG_URL = '/book/content/catalog.json';
const SEMANTIC_URL = '/book/content/semantic.json';
const CHANGES_URL = '/book/content/changes.json';
const SEARCH_URL = '/book/content/search.json';
const FEEDBACK_URL = 'https://autonomous.feedback/lore.land?at=';
const HISTORY_KEY = 'lore.desk.spells.v1';
const NOOK_KEY = 'lore.nook.v1';
const TOTAL = 13;

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

/** The 13th and 26th: when the next stone is set. */
function nextStone(from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
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
  { op: '?', example: '?[next]', does: 'Ask when the next chapter lands. Also ?[new], ?[shelf].' },
  { op: '?', example: '?[find]{berries remember}', does: 'Search the whole book. Plain words work too.' },
  { op: '&', example: '&[thread]{motif}', does: 'Where a thread runs: every chamber that carries it. Also &[motif]{unspent-wish}, &[trope]{…}, &[lean]{bone}, &[voice]{fool}.' },
  { op: '&', example: '&[threads]', does: 'The whole weave: every thread and mark, with how far each runs.' },
  { op: '%', example: '%[read]', does: 'Count what you have read.' },
  { op: '!', example: '![keep]{shelf}', does: 'Keep every chapter for offline reading.' },
  { op: '^', example: '^[slip]{05}', does: 'Write a slip to the scribes about a chapter.' },
  { op: '#', example: '#[stacks]{03}', does: 'Open a chapter at its shelf-mates in the library.' },
  { op: '*', example: '*[card]{05}', does: 'Copy a chapter’s link, card and all.' },
  { op: '=', example: '=[lens]{bone}', does: 'Read chapters as boon, bane or bone (or balanced).' },
  { op: '=', example: '=[genre]{boon:2 bone:1}', does: 'Blend genres: fairy tale, absurd reality, low magic, in any proportion.' },
  { op: '=', example: '=[light]{lamp}', does: 'Set the room: light day|dusk|lamp, or any switch on|off.' },
  { op: '$', example: '$[desk]', does: 'Show this spellbook.' }
]);

const PRACTICE = Object.freeze([
  { ask: 'Open Chapter Seven.', check: (s) => s.op === '@' && chapterFrom(s.handle || s.payload) === 7 },
  { ask: 'Ask when the next chapter lands.', check: (s) => s.op === '?' && s.handle === 'next' },
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

  /* Each spell's effect. Returns nothing; speaks through `say`. */
  const cast = async (line) => {
    const text = String(line || '').trim();
    if (!text) {
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
        say(op, el('p', {}, 'Nothing is waiting yet: you have not opened a chapter here. @01 begins.'));
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
      } else {
        say(op, el('p', {}, `The desk does not know ?[${handle}] yet. Try ?[next], ?[new], ?[shelf] or ?[find]{words}.`));
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
      if (handle !== 'keep') {
        say(op, el('p', {}, 'The desk knows one event: ![keep]{shelf}.'));
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
        say(op, el('p', {}, 'Set what? =[lens]{bone}, =[light]{lamp}, =[cozy]{1.2}, or a switch like =[focus-line]{on}.'));
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
      el('p', {}, 'Keep all thirteen chapters on this device, dressed and whole, for trains, flights and quiet rooms.'), shelfStatus),
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
