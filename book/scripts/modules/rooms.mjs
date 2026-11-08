/**
 * rooms.mjs — the chapter as rooms you pass through (.spw/surfaces/rooms.spw).
 *
 * Every section of a chapter is a room with a Spw signature
 * (room-signature.mjs) and a doorplate the build sets in the page
 * (chapter-render.mjs). This module does what needs a reader:
 *
 *   Progress    A room counts as read when its end is reached (the end
 *               mark comes into view and stays a moment, after the reader
 *               has moved the page). Kept in lore.rooms.v1 as
 *               { chapterNumber: [room numbers read] }. The strip under the
 *               title lights each room read; a chip takes you to its room.
 *
 *   Room by room (trial switch `room-by-room`, off by default)
 *               The room you are in stands whole; rooms you have read fold
 *               to their signature; the rest are doors, sealed until you
 *               reach them. At each room's end a door names the next one by
 *               its kind: "Through the < > passage to the moon lane".
 *               Sealed prose is hidden="until-found", so find-in-page and
 *               text-fragment links still reach it, and opening a match
 *               opens its room. Ebook navigation stays the way through:
 *               Next, Back, swipes, [ and ], the contents and the strip all
 *               open the room they land on.
 *
 * A room still being written arrives from the build as its door alone
 * (signature, air, the day it opens); nothing here can open it.
 */
import { readRoom, roomDoor, ROOM_KINDS } from './room-signature.mjs?v=2026_11_08.J';
import { settle } from './settled.mjs?v=2026_11_05.B';

const ROOMS_KEY = 'lore.rooms.v1';
const SWITCH = 'data-switch-room-by-room';
const DWELL = 650;
const QUIET_AFTER_JUMP = 1100;
/* Ebook navigation sources that mean "take me there" (not the scroll spy). */
const PASSIVE_SOURCES = new Set(['scroll', 'init', 'filters']);
/* Sources that step one section from where navigation thinks the reader is. */
const STEP_SOURCES = new Set(['controls', 'shell-controls', 'keyboard', 'bracket', 'swipe']);

function readAll() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ROOMS_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

/** The rooms read in one chapter, as a Set of room numbers (1-based). */
export function roomsRead(chapterNumber) {
  const list = readAll()[String(chapterNumber)];
  return new Set(Array.isArray(list) ? list.filter((n) => Number.isInteger(n) && n > 0) : []);
}

function keepRead(chapterNumber, read) {
  try {
    const all = readAll();
    all[String(chapterNumber)] = [...read].sort((a, b) => a - b);
    window.localStorage.setItem(ROOMS_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked: the rooms stay lit for this visit.
  }
}

/** "2026-11-13" → "Friday 13 November", the calendar day wherever the reader is. */
function dayOf(iso) {
  const [year, month, day] = String(iso || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const monthName = date.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  return `${weekday} ${day} ${monthName}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function initRooms({ chapterData, nav = null, announce } = {}) {
  const main = document.getElementById('chapter-content');
  const root = document.documentElement;
  const chapterNumber = Number(chapterData?.chapterNumber || 0);
  if (!main || !chapterNumber) return () => {};

  const nodes = [...main.querySelectorAll(':scope > .room')];
  if (!nodes.length) return () => {};

  // Each room is read from its own doorplate, so the page and its signatures can never drift apart.
  const rooms = nodes.map((node, index) => ({
    n: index + 1,
    node,
    reading: readRoom(node.querySelector(':scope > .room-head .room-sig')?.textContent),
    drafting: node.classList.contains('is-drafting'),
    name: node.querySelector(':scope > h2')?.textContent.trim() || ''
  }));
  const total = rooms.length;
  const settable = rooms.filter((room) => !room.drafting);
  const chips = new Map([...main.querySelectorAll('.room-strip .room-chip[data-room-index]')]
    .map((chip) => [Number(chip.dataset.roomIndex), chip]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let read = roomsRead(chapterNumber);
  let current = 0;
  let byRoom = false;
  let armed = false;
  let quietUntil = 0;

  /* ─── Progress ─────────────────────────────────────────────────── */

  const paintChips = () => {
    chips.forEach((chip, n) => chip.classList.toggle('is-read', read.has(n)));
    main.querySelector('.room-strip')?.classList.toggle('is-all-read', settable.length > 0 && settable.every((room) => read.has(room.n)));
  };

  const markRead = (n) => {
    const room = rooms[n - 1];
    if (!room || room.drafting || read.has(n)) return;
    const wasAll = settable.every((r) => read.has(r.n));
    read = new Set(read).add(n);
    keepRead(chapterNumber, read);
    room.node.classList.add('is-read');
    paintChips();
    const chip = chips.get(n);
    if (chip && !reduced.matches) {
      chip.classList.remove('is-fresh');
      void chip.offsetWidth;
      chip.classList.add('is-fresh');
      setTimeout(() => chip.classList.remove('is-fresh'), 1400);
    }
    if (!wasAll && settable.every((r) => read.has(r.n))) {
      settle({
        sigil: '^',
        title: 'Every room read',
        detail: `All ${settable.length} rooms of ${chapterData.title || 'this chapter'}, each one lit in the strip.`,
        at: main.querySelector('.room-strip'),
        region: main.querySelector('.room-strip')
      });
    }
  };

  // The end of each room: a quiet mark the reader passes when the room is done.
  const ends = rooms.map((room) => {
    if (room.drafting) return null;
    const end = el('span', 'room-end');
    end.setAttribute('aria-hidden', 'true');
    end.dataset.roomEnd = String(room.n);
    room.node.append(end);
    return end;
  });

  const visible = new Set();
  const timers = new Map();
  const tryRead = (n) => {
    if (!armed || Date.now() < quietUntil || !visible.has(n)) return;
    if (byRoom && n !== current) return;
    markRead(n);
  };
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const n = Number(entry.target.dataset.roomEnd);
        clearTimeout(timers.get(n));
        if (entry.isIntersecting) {
          visible.add(n);
          timers.set(n, setTimeout(() => tryRead(n), DWELL));
        } else {
          visible.delete(n);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' })
    : null;
  ends.forEach((end) => end && observer?.observe(end));

  // Opening a chapter is not reading it: rooms count once the reader moves the page.
  const arm = () => {
    if (armed) return;
    armed = true;
    visible.forEach((n) => timers.set(n, setTimeout(() => tryRead(n), DWELL)));
  };
  const ARM_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
  ARM_EVENTS.forEach((type) => window.addEventListener(type, arm, { passive: true, once: true }));

  /* ─── The strip ───────────────────────────────────────────────── */

  const onChip = (event) => {
    const chip = event.target.closest?.('.room-chip[data-room-index]');
    if (!chip || !main.contains(chip)) return;
    const n = Number(chip.dataset.roomIndex);
    if (!rooms[n - 1]) return;
    event.preventDefault();
    if (byRoom && !rooms[n - 1].drafting) open(n);
    if (nav?.jumpToSection) nav.jumpToSection(n);
    else rooms[n - 1].node.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  };
  main.addEventListener('click', onChip);

  const markHere = (n) => {
    chips.forEach((chip, i) => {
      chip.classList.toggle('is-here', i === n);
      if (i === n) chip.setAttribute('aria-current', 'location');
      else chip.removeAttribute('aria-current');
    });
  };

  /* ─── Room by room ────────────────────────────────────────────── */

  // Doors and latches are made once and only shown (rooms.css) while the trial is on.
  rooms.forEach((room, index) => {
    if (room.drafting) return;
    const head = room.node.querySelector(':scope > .room-head');
    if (head) {
      const latch = el('button', 'room-latch');
      latch.type = 'button';
      latch.addEventListener('click', () => {
        open(room.n);
        if (nav?.jumpToSection) nav.jumpToSection(room.n);
      });
      head.append(latch);
      room.latch = latch;
    }
    const next = rooms[index + 1];
    if (!next) return;
    const door = el('div', 'room-door');
    if (next.drafting) {
      const due = next.node.querySelector('.room-drafting-note')?.dataset.due || '';
      const kind = next.reading ? ROOM_KINDS[next.reading.kind] : null;
      door.append(el('p', 'room-door-sealed',
        `Beyond this door, ${kind ? `a ${kind.open} ${kind.close} ${kind.name}` : 'a room'} still being written.${dayOf(due) ? ` It opens ${dayOf(due)}.` : ''}`));
    } else {
      const phrase = next.reading ? roomDoor(next.reading) : `On to room ${next.n}`;
      const glyph = next.reading ? `${next.reading.open} ${next.reading.close}` : '';
      const [before, after] = glyph ? phrase.split(glyph) : [phrase, ''];
      const button = el('button', `room-door-button${next.reading ? ` room-door--${next.reading.kind} room-motion--${next.reading.motion}` : ''}`);
      button.type = 'button';
      button.setAttribute('aria-label', `${phrase.replace(` ${glyph}`, '')}, room ${next.n} of ${total}`);
      const words = el('span', 'room-door-phrase');
      words.append(before || '');
      if (glyph) words.append(el('span', 'room-door-glyph', glyph));
      words.append(after || '');
      button.append(el('span', 'room-door-count', `room ${next.n} of ${total}`), words, el('span', 'room-door-arrow', '→'));
      button.querySelector('.room-door-arrow').setAttribute('aria-hidden', 'true');
      button.addEventListener('click', () => {
        // A door is at the room's end: whoever opens it has reached it.
        markRead(room.n);
        open(next.n);
        if (nav?.jumpToSection) nav.jumpToSection(next.n);
        else next.node.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
      });
      door.append(button);
    }
    room.node.append(door);
    room.door = door;
  });

  // A room still being written may already be late; say so plainly rather than promise a day gone by.
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  main.querySelectorAll('.room.is-drafting .room-drafting-note[data-due]').forEach((note) => {
    const due = note.dataset.due;
    if (due && due < todayIso) {
      const day = note.querySelector('.room-drafting-day');
      if (day) day.textContent = `This room was due ${dayOf(due)}. It is nearly ready.`;
    }
  });

  /* Figures (the painted plates) hang in the room after them: a plate is the
     frontispiece of the room it introduces, and shows when that room is open. */
  const plates = [...main.querySelectorAll(':scope > figure')].map((figure) => {
    let next = figure.nextElementSibling;
    while (next && !next.classList.contains('room')) next = next.nextElementSibling;
    return { figure, owner: next ? rooms.find((room) => room.node === next) : null };
  });

  const HELD = 'room-held';
  const KEEP_OPEN = ['room-head', 'room-door', 'room-end', 'voice-kicker'];
  const hold = (child, on) => {
    if (on) {
      if (child.hasAttribute('hidden') && !child.classList.contains(HELD)) return; // hidden by someone else
      if (KEEP_OPEN.some((name) => child.classList.contains(name))) return;
      child.setAttribute('hidden', 'until-found');
      child.classList.add(HELD);
    } else if (child.classList.contains(HELD)) {
      child.removeAttribute('hidden');
      child.classList.remove(HELD);
    }
  };

  const paintRooms = () => {
    rooms.forEach((room) => {
      if (room.drafting) return;
      const isCurrent = byRoom && room.n === current;
      const folded = byRoom && !isCurrent && read.has(room.n);
      const sealed = byRoom && !isCurrent && !read.has(room.n);
      room.node.classList.toggle('is-current', isCurrent);
      // The door stays the room's last word, after any tools other modules hang at its end.
      if (isCurrent && room.door && room.node.lastElementChild !== room.door) room.node.append(room.door);
      room.node.classList.toggle('is-folded', folded);
      room.node.classList.toggle('is-sealed', sealed);
      [...room.node.children].forEach((child) => {
        // A sealed door keeps its title; a folded room keeps only its signature.
        const keepTitle = sealed && child.tagName === 'H2';
        hold(child, (folded || sealed) && !keepTitle);
      });
      if (room.latch) {
        room.latch.textContent = folded ? 'Step back in' : 'Open the door';
        room.latch.setAttribute('aria-label', `${folded ? 'Step back into' : 'Open'} room ${room.n} of ${total}${room.name ? `: ${room.name}` : ''}`);
      }
    });
    plates.forEach(({ figure, owner }) => {
      const behind = byRoom && owner && owner.n !== current;
      figure.classList.toggle('is-behind-door', Boolean(behind));
    });
  };

  const open = (n, { arriving = true } = {}) => {
    const room = rooms[n - 1];
    if (!room || room.drafting || (byRoom && n === current)) return;
    current = n;
    if (!byRoom) return;
    paintRooms();
    if (arriving && !reduced.matches) {
      room.node.classList.remove('is-arriving');
      void room.node.offsetWidth;
      room.node.classList.add('is-arriving');
      setTimeout(() => room.node.classList.remove('is-arriving'), 700);
    }
  };

  const roomOf = (target) => {
    const node = target?.closest?.('main.chapter > .room');
    return node ? rooms.find((room) => room.node === node) : null;
  };

  const firstUnread = () => (settable.find((room) => !read.has(room.n)) || settable[0])?.n || 1;

  const fromHash = () => {
    const id = decodeURIComponent((window.location.hash || '').slice(1));
    if (!id) return null;
    try {
      return roomOf(document.getElementById(id));
    } catch {
      return null;
    }
  };

  /* Keep the reader's room under their eyes while the rooms around it fold
     or open. 'instant', not 'auto': the page's scroll-behavior is smooth.
     Settled over a few frames, since content-visibility sizes the rooms
     above only as they render. */
  const keepPlace = (room) => {
    if (!room) return;
    let frames = 4;
    const land = () => {
      room.node.scrollIntoView({ behavior: 'instant', block: 'start' });
      if ((frames -= 1) > 0) requestAnimationFrame(land);
    };
    requestAnimationFrame(land);
  };

  const enter = ({ midRead }) => {
    if (byRoom) return;
    byRoom = true;
    main.classList.add('is-room-by-room');
    const hashed = fromHash();
    const here = nav?.currentSection ? rooms[nav.currentSection() - 1] : null;
    current = hashed && !hashed.drafting ? hashed.n
      : midRead && here && !here.drafting ? here.n
        : firstUnread();
    paintRooms();
    const start = current;
    if (midRead || hashed) keepPlace(rooms[start - 1]);
  };

  const leave = () => {
    if (!byRoom) return;
    const here = rooms[current - 1];
    byRoom = false;
    main.classList.remove('is-room-by-room');
    paintRooms();
    keepPlace(here);
  };

  const sync = (midRead) => {
    if (root.getAttribute(SWITCH) === 'on') enter({ midRead });
    else leave();
  };

  const watcher = new MutationObserver(() => sync(true));
  watcher.observe(root, { attributes: true, attributeFilter: [SWITCH] });

  // Ebook navigation is the way through: wherever it lands, that room opens.
  let lastActive = nav?.currentSection ? nav.currentSection() : 1;
  const onSection = (event) => {
    const { sectionIndex, source } = event.detail || {};
    const n = Number(sectionIndex);
    if (!rooms[n - 1]) return;
    const from = lastActive;
    lastActive = n;
    // Room by room, Next and Back step from the open room, not from wherever the page was scrolled.
    if (byRoom && STEP_SOURCES.has(source) && current && from !== current && nav?.jumpToSection) {
      const target = Math.max(1, Math.min(total, current + Math.sign(n - from || 1)));
      if (target !== n) {
        nav.jumpToSection(target);
        return;
      }
    }
    markHere(n);
    if (!PASSIVE_SOURCES.has(source)) quietUntil = Date.now() + QUIET_AFTER_JUMP;
    if (!byRoom || PASSIVE_SOURCES.has(source) || n === current || rooms[n - 1].drafting) return;
    open(n);
    // The rooms above have folded or opened since navigation scrolled; land again.
    requestAnimationFrame(() => rooms[n - 1].node.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' }));
  };
  window.addEventListener('lore:ebook-section-change', onSection);

  // Find-in-page or a text fragment reached sealed prose: open the room it is in.
  const onMatch = (event) => {
    const room = roomOf(event.target);
    if (room && byRoom) open(room.n, { arriving: false });
  };
  main.addEventListener('beforematch', onMatch);

  const onHash = () => {
    const room = fromHash();
    if (room && byRoom && !room.drafting) {
      open(room.n);
      keepPlace(room);
    }
  };
  window.addEventListener('hashchange', onHash);

  rooms.forEach((room) => room.node.classList.toggle('is-read', read.has(room.n)));
  paintChips();
  if (nav?.currentSection) markHere(nav.currentSection());
  sync(false);
  if (byRoom && announce) {
    announce(`Room by room: room ${current} of ${total} is open.`);
  }

  return () => {
    watcher.disconnect();
    observer?.disconnect();
    timers.forEach((timer) => clearTimeout(timer));
    ARM_EVENTS.forEach((type) => window.removeEventListener(type, arm));
    window.removeEventListener('lore:ebook-section-change', onSection);
    window.removeEventListener('hashchange', onHash);
    main.removeEventListener('click', onChip);
    main.removeEventListener('beforematch', onMatch);
    leave();
    ends.forEach((end) => end?.remove());
    main.querySelectorAll('.room-door, .room-latch').forEach((node) => node.remove());
  };
}
