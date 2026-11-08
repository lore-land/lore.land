/**
 * chapter-render.mjs — chapter JSON → prose DOM, one renderer for two hosts.
 *
 * The build (book/scripts/tools/build-chapters.mjs) runs this against a
 * small DOM shim and writes the result into each chapter's HTML, so the
 * story is in the page before any script runs: readable without JS,
 * indexable, reader-mode friendly, and on screen at first paint. The
 * browser runs the same code only as a fallback, when a page arrives
 * without prerendered prose (main.chapter lacks data-prerendered).
 *
 * Keep it host-neutral: create nodes through `doc`, write attributes with
 * setAttribute/dataset/className/textContent, and never read layout,
 * window, or location here.
 */

import {
  applyStoryVoiceAttributes,
  isCustomElementType,
  storyVoiceFor,
  voiceKickerWithMask
} from './story-lexicon.mjs?v=2026_09_26.A';
import { applySectionClimateAttributes } from './copy-climate.mjs?v=2026_11_06.D';
import { LENSES, leanFor } from './valence-lens.mjs?v=2026_09_27.A';
import { readRoom, roomSentence } from './room-signature.mjs?v=2026_11_08.J';

const NUMBER_WORDS = Object.freeze([
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
  'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five', 'Twenty-Six'
]);

/** Style tail for plate prompts — the series look from the 2026-09-26 studies. */
export const PLATE_PROMPT_STYLE = 'lore.land, teal and amber lit from within, leaf-dark ground, vignette and grain';
export const PLATE_PROMPT_FLAGS = '--raw --stylize 1000 --v 8.2';
const WORDS_PER_MINUTE = 230;

/** Mark kinds rendered as kicker chips, in display order. */
const SECTION_MARK_KINDS = Object.freeze([
  { attribute: 'data-motif', kind: 'motif', description: 'recurring motif' },
  { attribute: 'data-trope', kind: 'trope', description: 'sampled trope' },
  { attribute: 'data-foreshadow', kind: 'foreshadow', description: 'foreshadowing' }
]);

export function padChapterNumber(number) {
  return String(number).padStart(2, '0');
}

/** "Chapter One" for 1–13, "Chapter 14" past the words we carry. */
export function chapterOrdinal(number) {
  const n = Number(number);
  return `Chapter ${NUMBER_WORDS[n] || padChapterNumber(n)}`;
}

/** Stable, human-readable anchor for a titled section: #the-warm-furrow. */
export function sectionSlug(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/* Living slots (PLAN.E L15, contract c024): a paragraph's text may carry
 * {{name}} placeholders; variant zero of each slot is the canonical prose. */
const SLOT_PATTERN = /\{\{([a-z0-9-]+)\}\}/g;

/** The paragraph's canonical text: every {{slot}} resolved to its variant zero. */
export function resolveSlots(block) {
  const text = String(block?.text || '');
  if (!block?.slots || !text.includes('{{')) return text;
  return text.replace(SLOT_PATTERN, (match, name) => block.slots[name]?.variants?.[0] ?? '');
}

function blockText(block) {
  if (!block) {
    return '';
  }
  const own = [resolveSlots(block), block.content && typeof block.content === 'string' ? block.content : '']
    .filter(Boolean).join(' ');
  const children = [...(Array.isArray(block.content) ? block.content : []), ...(block.children || [])]
    .map(blockText).join(' ');
  return `${own} ${children}`;
}

function readMinutes(blocks) {
  const words = (Array.isArray(blocks) ? blocks : [blocks]).map(blockText).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readTimeChip(h, block) {
  return h('span', { className: 'read-time', hidden: '' }, `${readMinutes(block)} min`);
}

function humanizeMarkValue(value) {
  return String(value).split('-').join(' ');
}

/* ─── Rooms: each section of the flow, by its Spw signature ───────────── */

/** A room is a section of the flow: a titled section or a voice. Plates are hung in rooms, not rooms. */
export function isRoomBlock(section) {
  return section?.type === 'section' || isCustomElementType(section?.type);
}

/** The anchor ebook-navigation.mjs gives a room with no title of its own: chapter-01-section-03. */
export function positionalRoomId(chapterNumber, n) {
  return `chapter-${padChapterNumber(chapterNumber)}-section-${String(n).padStart(2, '0')}`;
}

/**
 * The chapter's rooms, aligned with its sections (null for plates): each
 * room's place ("room 3 of 6"), its anchor, its signature read, its air.
 * A drafting room keeps only what its door shows: no title, no prose.
 * @param {Object} data - chapter JSON
 * @param {Set<string>} [usedIds] - ids already taken on the page
 */
export function planRooms(data, usedIds = new Set(['chapter-title', 'chapter-content'])) {
  const sections = Array.isArray(data?.sections) ? data.sections : [];
  const total = sections.filter(isRoomBlock).length;
  let n = 0;
  return sections.map((section) => {
    if (!isRoomBlock(section)) {
      return null;
    }
    n += 1;
    const drafting = section.status === 'drafting';
    const slug = !drafting && section.type === 'section' && section.title ? sectionSlug(section.title) : '';
    const id = slug && !usedIds.has(slug) ? slug : positionalRoomId(data.chapterNumber, n);
    usedIds.add(id);
    return {
      n,
      of: total,
      id,
      reading: readRoom(section.room?.spw),
      air: String(section.room?.air || ''),
      title: drafting ? '' : String(section.title || ''),
      drafting,
      due: drafting ? String(section.due || '') : ''
    };
  });
}

/** The signature with each part in its own span, so the sigils can be tinted by role. */
function renderSignature(h, reading, className) {
  return h('code', { className, 'aria-hidden': 'true' },
    h('span', { className: 'room-sig-op' }, reading.op),
    h('span', { className: 'room-sig-brace' }, reading.open),
    h('span', { className: 'room-sig-label' }, reading.label),
    h('span', { className: 'room-sig-brace' }, reading.close),
    h('span', { className: 'room-sig-at' }, '@'),
    h('span', { className: 'room-sig-who' }, reading.who));
}

/** The room's doorplate: signature, its place in the chapter, and its air. */
function renderRoomHead(h, room) {
  if (!room?.reading) {
    return null;
  }
  return h('div', { className: 'room-head' },
    h('div', { className: 'room-doorplate', title: roomSentence(room.reading) },
      renderSignature(h, room.reading, 'room-sig'),
      h('span', { className: 'sr-only' }, `${roomSentence(room.reading)} `),
      h('span', { className: 'room-count' }, `room ${room.n} of ${room.of}`)),
    room.air ? h('div', { className: 'room-air' }, room.air) : null);
}

/** Classes say what kind of room it is (rooms.css styles classes, never new attributes). */
function dressRoom(elem, room) {
  if (!room) {
    return;
  }
  elem.setAttribute('id', room.id);
  const classes = room.reading ? ['room', `room--${room.reading.kind}`, `room-motion--${room.reading.motion}`] : ['room'];
  if (room.drafting) {
    classes.push('is-drafting');
  }
  elem.className = [elem.className, ...classes].filter(Boolean).join(' ');
}

/**
 * A room still being written: a sealed door with its signature, its air and
 * the day it opens. Always a <section>, so the rooms after it keep their
 * places in the chapter and in ebook navigation.
 */
function renderDraftingDoor(h, room) {
  const door = h('section');
  dressRoom(door, room);
  // The heading names the door, not the room: its title is part of what is still being written.
  door.append(h('h2', { className: 'room-drafting-title' }, 'Still being written'));
  const head = renderRoomHead(h, room);
  if (head) {
    door.append(head);
  }
  const day = stoneDay(room.due);
  door.append(h('div', { className: 'room-drafting-note', dataset: { due: room.due } },
    h('span', { className: 'room-drafting-day' }, day ? `This room opens ${day}.` : 'This room opens when it is ready.')));
  return door;
}

/** A strip of the chapter's rooms, under the title: one signature chip per room. */
function renderRoomStrip(h, rooms) {
  const list = (rooms || []).filter(Boolean);
  if (!list.some((room) => room.reading)) {
    return null;
  }
  return h('nav', { className: 'room-strip', 'aria-label': `Rooms in this chapter, ${list.length} in all`, dataset: { component: 'room-strip' } },
    h('ol', { className: 'room-strip-list' }, ...list.map((room) => {
      const kind = room.reading ? ` room-chip--${room.reading.kind} room-motion--${room.reading.motion}` : '';
      const name = room.title || (room.reading ? `The ${room.reading.place}` : `Room ${room.n}`);
      return h('li', { className: 'room-strip-item' },
        h('a', {
          className: `room-chip${kind}${room.drafting ? ' is-drafting' : ''}`,
          href: `#${room.id}`,
          dataset: { roomIndex: String(room.n) },
          title: `${room.n}. ${name}${room.drafting ? ' (still being written)' : ''}`,
          'aria-label': `Room ${room.n} of ${room.of}: ${name}${room.drafting ? ', still being written' : ''}`
        },
          room.reading ? renderSignature(h, room.reading, 'room-chip-sig') : h('span', { 'aria-hidden': 'true' }, String(room.n))));
    })));
}

/**
 * Renders the chapter's body into `container` (appends; the caller clears):
 * head, prose, end mark, and the turn toward the next chapter.
 * @param {Element} container
 * @param {Object} data - chapter JSON
 * @param {Object} [options]
 * @param {Document} [options.doc] - node factory (a shim under Node)
 * @param {(href: string) => string} [options.withBase] - site-base resolver
 * @param {string} [options.inWhich] - "a dog finds an egg…" (no "In which", no period)
 * @param {{ number: number, title: string, inWhich?: string, href: string, wraps?: boolean }} [options.next]
 * @param {{ entries: Array, search: string }} [options.stacks] - this chapter's shelf list
 */
export function renderChapterBody(container, data, options = {}) {
  const doc = options.doc || container.ownerDocument;
  const withBase = options.withBase || ((href) => href);
  const h = createFactory(doc);
  const usedIds = new Set(['chapter-title', 'chapter-content']);
  const rooms = planRooms(data, usedIds);

  container.append(renderHead(h, data, options.inWhich, rooms));

  const stamp = `Chamber ${padChapterNumber(data.chapterNumber)} · ${data.title}`;
  // Wonders (book/content/world/almanac.json): the first time each is named in
  // a chapter it is marked, so a reader can collect it (modules/almanac.mjs).
  const wonders = Array.isArray(options.wonders) ? options.wonders : [];
  const marked = options.markedOut instanceof Set ? options.markedOut : new Set();
  (Array.isArray(data.sections) ? data.sections : []).forEach((section, index) => {
    const node = renderBlock(h, section, { stamp, usedIds, wonders, marked, room: rooms[index] });
    if (node) {
      container.append(node);
    }
  });

  container.append(h('p', { className: 'chapter-end-mark', 'aria-hidden': 'true' }, '❦'));

  if (options.next?.href) {
    container.append(renderTurn(h, options.next, withBase));
  }
  if (options.stacks?.entries?.length) {
    container.append(renderStacks(h, options.stacks));
  }
  if (data.table) {
    container.append(renderTable(h, data, options.wonderNames || {}));
  }
  return container;
}

/**
 * At the table (PLAN.E L19): the chapter as a place to play. A closed
 * game-master's page — the place, its light, its people, three hooks, a d6
 * of encounters, the wonders worth carrying out, a bracework move — and the
 * page's own dice: every living slot in the chapter, numbered, its first
 * face the book's own words.
 */
function renderTable(h, data, wonderNames) {
  const t = data.table;
  const heading = (text) => h('p', { className: 'chapter-table-h' }, text);
  const slots = [];
  const gather = (node) => (Array.isArray(node?.content) ? node.content : []).forEach((item) => {
    if (item.type === 'paragraph' && item.slots) Object.entries(item.slots).forEach(([name, slot]) => slots.push({ name, ...slot }));
    else if (Array.isArray(item.content)) gather(item);
  });
  (data.sections || []).forEach(gather);

  const body = h('div', { className: 'chapter-table-body' },
    h('p', { className: 'chapter-table-place' }, t.place || ''),
    t.light ? h('p', { className: 'chapter-table-light' }, h('span', { className: 'chapter-table-label' }, 'Light'), ` ${t.light}`) : null,
    Array.isArray(t.people) && t.people.length ? h('div', { className: 'chapter-table-block' },
      heading('People'),
      h('ul', { className: 'chapter-table-people' }, ...t.people.map((p) => h('li', {},
        h('strong', {}, p.name), ` wants ${String(p.want || '').replace(/^wants?\s+/i, '')}`,
        p.voice ? h('span', { className: 'chapter-table-voice' }, ` — ${p.voice}`) : null)))) : null,
    Array.isArray(t.hooks) && t.hooks.length ? h('div', { className: 'chapter-table-block' },
      heading('Hooks'), h('ol', { className: 'chapter-table-hooks' }, ...t.hooks.map((hook) => h('li', {}, hook)))) : null,
    Array.isArray(t.encounters) && t.encounters.length ? h('div', { className: 'chapter-table-block' },
      heading(`Roll a d${t.encounters.length}`), h('ol', { className: 'chapter-table-dice' }, ...t.encounters.map((e) => h('li', {}, e)))) : null,
    Array.isArray(t.finds) && t.finds.length ? h('div', { className: 'chapter-table-block' },
      heading('Worth carrying out'),
      h('ul', { className: 'chapter-table-finds' }, ...t.finds.map((f) => h('li', {},
        h('a', { href: `/almanac/#wonder-${f.wonder}`, className: 'chapter-table-find' }, wonderNames[f.wonder] || f.wonder), ` — ${f.use}`)))) : null,
    t.bracework?.spw ? h('div', { className: 'chapter-table-block chapter-table-brace' },
      heading('A bracework move'),
      h('code', { className: 'chapter-table-spw' }, t.bracework.spw),
      h('p', {}, h('span', { className: 'chapter-table-label' }, 'Does'), ` ${t.bracework.does}`),
      h('p', {}, h('span', { className: 'chapter-table-label' }, 'Costs'), ` ${t.bracework.costs}`)) : null,
    slots.length ? h('div', { className: 'chapter-table-block chapter-table-slots' },
      heading('The page\u2019s own dice'),
      h('p', { className: 'chapter-table-note' }, 'Every phrase in this chapter that breathes, as a table to roll on. The first face is the book\u2019s own words.'),
      ...slots.map((slot) => h('div', { className: 'chapter-table-slot' },
        h('p', { className: 'chapter-table-slot-head' }, `d${slot.variants.length} · turns by the ${slot.clock || 'hour'}`),
        h('ol', {}, ...slot.variants.map((v, i) => h('li', i === 0 ? { className: 'is-canon' } : {}, v)))))) : null,
    t.question ? h('p', { className: 'chapter-table-question' }, h('span', { className: 'chapter-table-label' }, 'Ask the table'), ` ${t.question}`) : null);

  return h('details', { className: 'chapter-table', id: 'table', dataset: { component: 'chapter-table' } },
    h('summary', {},
      h('span', { className: 'chapter-table-kicker' }, 'At the table'),
      h('span', { className: 'chapter-table-title' }, 'Play in this chapter')),
    body);
}

/**
 * Wander the stacks: the chapter's shelf-mates in any library, by call
 * number, from book/content/world/shelf-list.json. The story's last
 * gesture is outward — into a building full of other stories.
 */
function renderStacks(h, stacks) {
  return h('nav', { className: 'chapter-stacks', id: 'stacks', 'aria-label': 'Wander the stacks', dataset: { component: 'chapter-stacks' } },
    h('p', { className: 'chapter-stacks-kicker' }, 'Wander the stacks'),
    h('p', { className: 'chapter-stacks-lede' }, 'This chapter has shelf-mates in any library. Take a call number into the aisles and see what is standing next to it.'),
    h('ul', { className: 'chapter-stacks-list' }, ...stacks.entries.map((entry) => h('li', { className: 'chapter-stacks-item' },
      h('p', { className: 'chapter-stacks-subject' }, entry.subject),
      h('p', { className: 'chapter-stacks-call' },
        h('abbr', { title: 'Library of Congress classification' }, 'LC'), ` ${entry.lc}`,
        h('span', { className: 'chapter-stacks-sep', 'aria-hidden': 'true' }, ' · '),
        'Dewey ', entry.dewey,
        entry.tale ? h('span', { className: 'chapter-stacks-tale' }, ` · tale type ${entry.tale}`) : null
      ),
      h('p', { className: 'chapter-stacks-wander' }, entry.wander),
      h('a', {
        className: 'chapter-stacks-find',
        href: `${stacks.search}${encodeURIComponent(entry.search || entry.subject)}`,
        rel: 'noopener',
        target: '_blank'
      }, 'Find it in a library near you', h('span', { 'aria-hidden': 'true' }, ' ↗'))
    )))
  );
}

/**
 * Renders what follows the story (and the scribes' slip): threads, byline,
 * and the doors out into the wider land.
 */
export function renderChapterCoda(container, data, options = {}) {
  const doc = options.doc || container.ownerDocument;
  const withBase = options.withBase || ((href) => href);
  const h = createFactory(doc);

  const colophon = renderColophon(h, data, withBase, options.wonders);
  if (colophon) {
    container.append(colophon);
  }
  const prompts = renderPlatePrompts(h, data);
  if (prompts) {
    container.append(prompts);
  }
  const routes = renderRouteRail(h, data, withBase);
  if (routes) {
    container.append(routes);
  }
  return container;
}

/**
 * Suggested image prompts, one per scene plus a room for the nook — an
 * editorial component for scribes and illustrators. Ships hidden; the
 * "prompts" trial switch shows it. Composed from the chapter's own scene
 * hints, so improving a hint improves its prompt.
 */
function renderPlatePrompts(h, data) {
  const scenes = [];
  (data.sections || []).forEach((section, index) => {
    if (section.scene?.hint) {
      scenes.push({ label: section.title || storyVoiceFor(section.type)?.kicker || `Block ${index + 1}`, hint: section.scene.hint });
    }
  });
  if (!scenes.length) {
    return null;
  }
  const first = (data.sections || []).find((section) => section.climate) || {};
  const tempo = first.climate?.tempo || 'dusk';
  const tint = first.climate?.tint || 'amber';
  const rows = [
    ...scenes.map((scene) => ({
      label: `${scene.label} · plate, 40:21`,
      text: `${scene.hint}; ${PLATE_PROMPT_STYLE} --ar 40:21 ${PLATE_PROMPT_FLAGS}`
    })),
    {
      label: `The nook for ${data.title} · room, 9:16`,
      text: `a quiet reading nook for a chapter called "${data.title}", ${tempo} light with a ${tint} cast, shelves of old books, one candle, a small boonberry lantern glowing amber, soft focus, dreamy; ${PLATE_PROMPT_STYLE} --ar 9:16 ${PLATE_PROMPT_FLAGS}`
    }
  ];
  return h('div', { className: 'plate-prompts', role: 'region', 'aria-label': 'Suggested image prompts', hidden: '', dataset: { component: 'plate-prompts' } },
    h('p', { className: 'plate-prompts-kicker' }, 'Plate prompts · for scribes and illustrators'),
    h('p', { className: 'plate-prompts-note' }, 'Composed from this chapter\u2019s scene hints. Improve a hint in the chapter\u2019s canon and its prompt improves with it.'),
    h('ol', { className: 'plate-prompts-list' }, ...rows.map((row) => h('li', {},
      h('p', { className: 'plate-prompt-for' }, row.label),
      h('code', { className: 'plate-prompt-text' }, row.text),
      h('button', { type: 'button', className: 'plate-prompt-copy', dataset: { copyPrompt: 'true' } }, 'Copy')
    )))
  );
}

/* ─── Head: kicker + title, in-which, epigraph. Story first. ─────────── */

function renderHead(h, data, inWhich, rooms = []) {
  const head = h('header', { className: 'chapter-head', dataset: { component: 'chapter-head' } });
  // Returning readers knew the logline above the title; the "logline"
  // switch (reading-switches.mjs) keeps it for them. Hidden otherwise.
  if (data.logline) {
    head.append(h('p', { className: 'chapter-logline', hidden: '' }, data.logline));
  }
  const title = h('h1', { id: 'chapter-title' },
    h('span', { className: 'chapter-kicker' },
      chapterOrdinal(data.chapterNumber),
      h('span', { className: 'sr-only' }, ': ')
    ),
    h('span', { className: 'chapter-title-text' }, data.title)
  );
  head.append(title);

  const line = inWhich || data.inWhich;
  if (line) {
    head.append(h('p', { className: 'chapter-in-which' }, `In which ${line}.`));
  }

  if (data.epigraph) {
    head.append(h('p', { className: 'chapter-epigraph', dataset: { component: 'chapter-epigraph' } }, data.epigraph));
  }
  // The chapter's rooms, one chip each (modules/rooms.mjs lights the ones read).
  const strip = renderRoomStrip(h, rooms);
  if (strip) {
    head.append(strip);
  }
  // Read as boon, bane or bone (lens-control.mjs wakes this; hidden without script).
  head.append(h('div', { className: 'chapter-lens', hidden: '' },
    h('button', { type: 'button', className: 'chapter-lens-toggle', 'aria-expanded': 'false' },
      h('span', { className: 'chapter-lens-label' }, 'Read as'),
      h('b', { className: 'chapter-lens-current' }, 'Balanced'),
      h('span', { className: 'chapter-lens-caret', 'aria-hidden': 'true' }, '▾')
    ),
    h('div', { className: 'chapter-lens-menu', role: 'group', 'aria-label': 'Read this chapter as', hidden: '' },
      h('button', { type: 'button', className: 'chapter-lens-option', dataset: { lens: '' }, 'aria-pressed': 'true' }, 'Balanced'),
      ...LENSES.map((lens) => h('button', {
        type: 'button', className: 'chapter-lens-option', dataset: { lens: lens.id }, 'aria-pressed': 'false', title: lens.question
      }, lens.label)),
      h('p', { className: 'chapter-lens-gloss', 'aria-live': 'polite' }, '')
    )
  ));
  const minutes = readMinutes(data.sections);
  head.append(h('p', { className: 'read-time read-time--chapter', hidden: '' }, `${minutes} min read`));
  return head;
}

/* ─── Flow blocks ─────────────────────────────────────────────────────── */

function renderBlock(h, section, context = {}) {
  if (!section || !section.type) {
    return null;
  }
  if (context.room?.drafting) {
    return renderDraftingDoor(h, context.room);
  }
  switch (section.type) {
    case 'paragraph':
      return renderParagraph(h, section, context);
    case 'pull':
      return h('blockquote', { className: 'voice-pull', dataset: { component: 'voice-pull' } }, String(section.text || '').trim());
    case 'bracework':
      return renderBracework(h, section);
    case 'figure':
      return renderFigure(h, section);
    case 'section':
      return renderSection(h, section, context);
    default:
      if (isCustomElementType(section.type)) {
        return renderVoice(h, section, context);
      }
      return null;
  }
}

/* A term matches as a whole word when it begins or ends with a letter;
 * sigil-led bracework terms (# face, {frost & hearth}) match exactly. */
const termPatterns = new Map();
export function wonderTermPattern(term) {
  return termPattern(term);
}
function termPattern(term) {
  if (!termPatterns.has(term)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lead = /^[\p{L}\p{N}]/u.test(term) ? '(?<![\\p{L}\\p{N}-])' : '';
    const tail = /[\p{L}\p{N}]$/u.test(term) ? '(?![\\p{L}\\p{N}-])' : '';
    termPatterns.set(term, new RegExp(`${lead}${escaped}${tail}`, /^[\p{L}]/u.test(term) ? 'iu' : 'u'));
  }
  return termPatterns.get(term);
}

function appendMarked(h, parent, text, context = {}) {
  const wonders = context.wonders || [];
  let rest = String(text || '');
  while (rest) {
    let best = null;
    for (const wonder of wonders) {
      if (context.marked?.has(wonder.id)) continue;
      for (const term of wonder.terms || []) {
        const match = termPattern(term).exec(rest);
        if (match && (!best || match.index < best.index || (match.index === best.index && match[0].length > best.length))) {
          best = { index: match.index, length: match[0].length, wonder };
        }
      }
    }
    if (!best) {
      parent.append(rest);
      return;
    }
    if (best.index) parent.append(rest.slice(0, best.index));
    parent.append(h('span', { className: 'wonder-mark', dataset: { wonder: best.wonder.id, kind: best.wonder.kind } }, rest.slice(best.index, best.index + best.length)));
    context.marked.add(best.wonder.id);
    rest = rest.slice(best.index + best.length);
  }
}

/* Text with living slots: the canonical words of each slot sit in a span that
 * carries its clock and variants; living.mjs turns them when the reader has
 * the living page on. Everything around a slot is marked for wonders as usual. */
function appendWithSlots(h, p, section, context) {
  const text = String(section.text || '');
  if (!section.slots || !text.includes('{{')) {
    appendMarked(h, p, text, context);
    return;
  }
  let last = 0;
  for (const match of text.matchAll(SLOT_PATTERN)) {
    if (match.index > last) appendMarked(h, p, text.slice(last, match.index), context);
    const slot = section.slots[match[1]];
    const variants = Array.isArray(slot?.variants) ? slot.variants : [];
    p.append(h('span', {
      className: 'living-slot',
      dataset: { slot: match[1], clock: slot?.clock || 'hour', variants: JSON.stringify(variants) }
    }, variants[0] ?? ''));
    last = match.index + match[0].length;
  }
  if (last < text.length) appendMarked(h, p, text.slice(last), context);
}

/* Bracework (PLAN.E L14, contract c025): the makers' notation, set in the
 * page as its expression and a gloss; bracework.mjs asks the Spw interpreter
 * to read it into a diagram when the block comes near. */
function renderBracework(h, section) {
  const expr = String(section.spw || '').trim();
  if (!expr) return null;
  return h('figure', { className: 'bracework', dataset: { component: 'bracework', spw: expr } },
    h('span', { className: 'bracework-kicker' }, 'Bracework'),
    h('code', { className: 'bracework-expr' }, expr),
    h('figcaption', { className: 'bracework-gloss' },
      String(section.gloss || ''),
      section.maker ? h('span', { className: 'bracework-maker' }, ` — ${section.maker}`) : null));
}

function renderParagraph(h, section, context = {}) {
  const p = h('p');
  // The paragraph's lean (boon / bane / bone) for the reading lens.
  const plain = `${resolveSlots(section)}${(section.children || []).map((child) => child.text || child.content || '').join('')}`;
  const lean = leanFor(plain, section.lean);
  if (lean) {
    p.dataset.lean = lean;
  }
  if (section.text) {
    appendWithSlots(h, p, section, context);
  }
  if (Array.isArray(section.children)) {
    section.children.forEach((child) => {
      if (isCustomElementType(child.type)) {
        const phrase = h(child.type, {}, child.content);
        applyStoryVoiceAttributes(phrase, child.type, 'phrase');
        p.append(phrase);
      } else if (child.type === 'text') {
        appendMarked(h, p, child.text, context);
      }
    });
  }
  return p;
}

function renderFigure(h, section) {
  const figure = h('figure', { className: 'chapter-figure' });
  if (section.img) {
    const src = section.img.src;
    if (/\/book\/images\//.test(src)) {
      figure.dataset.visualDefault = 'colloquial';
    }
    const attrs = {
      src,
      alt: section.img.alt || '',
      loading: section.img.loading || 'lazy',
      decoding: 'async'
    };
    if (section.img.width && section.img.height) {
      attrs.width = String(section.img.width);
      attrs.height = String(section.img.height);
    }
    figure.append(h('img', attrs));
  }
  if (section.figcaption) {
    figure.append(h('figcaption', {}, section.figcaption));
  }
  return figure;
}

/**
 * A section's `scene` block as a folded sketch — an invitation to imagine.
 * The structured fields stay machine-readable in #chapter-data for image
 * models; the reader gets vantage / light / scent / edges.
 */
function renderSceneSketch(h, scene) {
  const details = h('details', { className: 'scene-sketch', dataset: { component: 'scene-sketch' } });
  if (scene.hint) {
    details.dataset.sceneHint = scene.hint;
  }
  details.append(h('summary', {}, 'Step into the scene'));
  const body = h('div', { className: 'scene-sketch-body' });
  [['vantage', scene.vantage], ['light', scene.light], ['scent', scene.scent]].forEach(([label, text]) => {
    if (text) {
      body.append(h('p', { className: 'scene-sense' }, h('span', { className: 'scene-sense-label' }, label), ' ', text));
    }
  });
  if (Array.isArray(scene.edges) && scene.edges.length) {
    body.append(h('ul', { className: 'scene-edges' }, ...scene.edges.map((edge) => h('li', {}, edge))));
  }
  details.append(body);
  return details;
}

/** Motif / trope / foreshadow marks as a quiet chip row. */
function renderMarks(h, elem) {
  const marks = SECTION_MARK_KINDS
    .map((meta) => ({ ...meta, value: elem.getAttribute(meta.attribute) }))
    .filter((meta) => meta.value);
  if (!marks.length) {
    return null;
  }
  return h('p', { className: 'section-marks' }, ...marks.map((meta) => {
    const label = `${meta.description}: ${humanizeMarkValue(meta.value)}`;
    return h('span', {
      className: `mark mark--${meta.kind}`,
      dataset: { mark: meta.value },
      title: label,
      'aria-label': label
    }, humanizeMarkValue(meta.value));
  }));
}

function passDataAttributes(elem, section) {
  Object.entries(section).forEach(([key, value]) => {
    if (key.startsWith('data-') && typeof value === 'string' && !elem.hasAttribute(key)) {
      elem.setAttribute(key, value);
    }
  });
}

/** Marks and the scene toggle share one line under the heading. */
function renderSectionMeta(h, elem, scene, section) {
  const marks = renderMarks(h, elem);
  const meta = h('div', { className: 'section-meta' });
  if (marks) {
    meta.append(marks);
  }
  meta.append(readTimeChip(h, section));
  if (scene) {
    elem.dataset.scene = 'true';
    meta.append(renderSceneSketch(h, scene));
  }
  return meta;
}

function renderSection(h, section, context) {
  const sec = h('section');
  if (context.room) {
    // The room plan (planRooms) already chose the anchor: the title's slug, or its place.
    dressRoom(sec, context.room);
  } else if (section.title) {
    const slug = sectionSlug(section.title);
    if (slug && context.usedIds && !context.usedIds.has(slug)) {
      context.usedIds.add(slug);
      sec.setAttribute('id', slug);
    }
  }
  if (section.title) {
    sec.append(h('h2', {}, section.title));
  }
  const roomHead = renderRoomHead(h, context.room);
  if (roomHead) {
    sec.append(roomHead);
  }

  applySectionClimateAttributes(sec, section);
  passDataAttributes(sec, section);

  sec.append(renderSectionMeta(h, sec, section.scene, section));

  // Content blocks are not rooms; only the section itself is.
  const inner = { ...context, room: null };
  (section.content || []).forEach((item) => {
    const node = renderBlock(h, item, inner);
    if (node) {
      sec.append(node);
    }
  });
  return sec;
}

function renderVoice(h, section, context) {
  const elem = h(section.type);
  applyStoryVoiceAttributes(elem, section.type, 'block');

  if (section.valence) {
    elem.dataset.spwValence = section.valence;
  }
  applySectionClimateAttributes(elem, section);
  passDataAttributes(elem, section);

  if (section.mask && !elem.dataset.mask) {
    elem.dataset.mask = String(section.mask);
  }
  if (section.type === 'custom-fool') {
    if (!elem.getAttribute('data-trope')) {
      elem.setAttribute('data-trope', 'trickster');
    }
    if (!elem.getAttribute('data-frame')) {
      elem.setAttribute('data-frame', 'shot');
    }
  }

  const meta = storyVoiceFor(section.type);
  const kicker = elem.dataset.mask
    ? voiceKickerWithMask(elem.dataset.voiceKicker || meta?.kicker, elem.dataset.mask)
    : (elem.dataset.voiceKicker || meta?.kicker || '');
  if (kicker) {
    elem.dataset.voiceKicker = kicker;
    // StoryVoiceElement mounts this on upgrade; shipping it keeps the
    // no-JS page and the first paint identical to the hydrated one.
    elem.append(h('div', { className: 'voice-kicker', 'aria-hidden': 'true' }, kicker));
  }
  dressRoom(elem, context.room);
  const roomHead = renderRoomHead(h, context.room);
  if (roomHead) {
    elem.append(roomHead);
  }

  const marks = renderMarks(h, elem);
  if (marks) {
    elem.append(marks);
  }
  elem.append(readTimeChip(h, section));

  const inner = { ...context, room: null };
  (section.content || []).forEach((item) => {
    const node = renderBlock(h, item, inner);
    if (node) {
      elem.append(node);
    }
  });

  const wantsStamp = elem.getAttribute('data-frame') === 'shot'
    || section.type === 'custom-fool'
    || (Array.isArray(section.content) && section.content.some((item) => item.type === 'pull'));
  if (wantsStamp && context.stamp) {
    elem.append(h('div', { className: 'voice-stamp' }, context.stamp));
  }

  if (section.scene) {
    elem.dataset.scene = 'true';
    elem.append(renderSceneSketch(h, section.scene));
  }
  return elem;
}

/* ─── Chapter end: the turn, the colophon, the doors ─────────────────── */

/** "2026-11-13" → "Friday 13 November", read as a calendar day wherever the reader is. */
function stoneDay(iso) {
  const [year, month, day] = String(iso || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const monthName = date.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  return `${weekday} ${day} ${monthName}`;
}

function renderTurn(h, next, withBase) {
  // The newest chapter turns toward the next stone, then back to the first page.
  const stone = next.wraps && next.upcoming ? stoneDay(next.upcoming.date) : '';
  const kicker = stone
    ? `${chapterOrdinal(next.upcoming.chapter)} is set ${stone} · until then, begin again`
    : next.wraps ? 'The serial continues · begin again' : 'Turn the page';
  const link = h('a', {
    className: 'chapter-turn-link',
    href: withBase(next.href),
    rel: next.wraps ? 'first' : 'next'
  },
    h('span', { className: 'chapter-turn-kicker' }, kicker),
    h('span', { className: 'chapter-turn-title' },
      h('span', { className: 'chapter-turn-number' }, chapterOrdinal(next.number)),
      ' ',
      next.title
    )
  );
  if (next.inWhich) {
    link.append(h('span', { className: 'chapter-turn-in-which' }, `In which ${next.inWhich}.`));
  }
  return h('nav', { className: 'chapter-turn', 'aria-label': 'Next chapter', dataset: { component: 'chapter-turn' } }, link);
}

function renderColophon(h, data, withBase, wonders = []) {
  const hasTopics = Array.isArray(data.topics) && data.topics.length;
  const colophon = h('footer', { className: 'chapter-colophon', dataset: { component: 'chapter-colophon' } });

  // Nothing is a dead end (c027): the wonders this chapter names, each a door to the almanac.
  if (Array.isArray(wonders) && wonders.length) {
    const row = h('nav', { className: 'chapter-wonder-row', 'aria-label': 'Wonders in this chapter', dataset: { component: 'chapter-wonders' } });
    row.append(h('span', { className: 'chapter-threads-label' }, 'Wonders here'));
    wonders.forEach((wonder) => {
      row.append(h('a', {
        className: 'chapter-wonder-chip',
        href: withBase(`/almanac/#wonder-${wonder.id}`),
        dataset: { kind: wonder.kind, wonderLink: wonder.id },
        title: wonder.lives ? `Lives in ${wonder.lives}` : wonder.name
      }, wonder.name));
    });
    colophon.append(row);
  }

  if (hasTopics || (Array.isArray(data.pillars) && data.pillars.length)) {
    const threads = h('nav', { className: 'chapter-topic-row', 'aria-label': 'Threads in this chapter', dataset: { component: 'chapter-topics' } });
    threads.append(h('span', { className: 'chapter-threads-label' }, 'Threads'));
    (data.topics || []).forEach((topic) => {
      threads.append(h('a', {
        className: 'chapter-topic-chip',
        href: withBase(topic.href || `/topics/#${topic.id || ''}`)
      }, topic.label || topic.id || 'topic'));
    });
    threads.append(h('a', { className: 'chapter-topic-chip chapter-topic-chip--quiet', href: withBase('/topics/') }, 'All threads'));
    colophon.append(threads);
  }

  const byline = h('p', { className: 'chapter-byline', dataset: { component: 'chapter-byline' } },
    `${chapterOrdinal(data.chapterNumber)} of `,
    h('a', { href: withBase('/') }, 'Lore.Land'),
    ', a living serial by ',
    h('a', {
      href: 'https://spwashi.com/?from=lore.land',
      target: '_blank',
      rel: 'noopener noreferrer author'
    }, 'Spwashi'),
    '.'
  );
  if (Array.isArray(data.pillars) && data.pillars.length) {
    byline.append(' ', h('span', { className: 'chapter-pillars', dataset: { component: 'chapter-pillars' } }, `Seeded with ${data.pillars.join(', ')}.`));
  }
  colophon.append(byline);
  return colophon;
}

function renderRouteRail(h, data, withBase) {
  const routes = (data.relatedRoutes || []).filter((route) => route.kicker !== 'Next');
  if (!routes.length) {
    return null;
  }
  return h('nav', { className: 'chapter-route-rail', 'aria-label': 'Continue exploring', dataset: { component: 'chapter-related-routes' } },
    h('p', { className: 'chapter-route-rail-label' }, 'Wander off the page'),
    ...routes.map((route) => h('a', { className: 'chapter-route-card', href: withBase(route.href || '#') },
      route.kicker ? h('span', { className: 'chapter-route-kicker' }, route.kicker) : null,
      h('span', { className: 'chapter-route-title' }, route.label || 'Route')
    ))
  );
}

/* ─── Tiny hyperscript over whichever document we were handed ────────── */

function createFactory(doc) {
  return function h(tag, attrs = {}, ...children) {
    const node = doc.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) {
        return;
      }
      if (key === 'className') {
        node.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          node.dataset[dataKey] = String(dataValue);
        });
      } else {
        node.setAttribute(key, String(value));
      }
    });
    children.forEach((child) => {
      if (child == null || child === false) {
        return;
      }
      node.append(typeof child === 'string' ? child : child);
    });
    return node;
  };
}
