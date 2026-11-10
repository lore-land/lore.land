/**
 * lanes-lore.mjs — what the pies let slip in Exactly One Pie, back in the room it is about.
 *
 * The game and the book feed each other. A line Mr. BoonWAP or Mr. BaneWAP lets slip in the lanes
 * (pie-lore.json, heard lines kept in lore.pie.v1) is grounded in a chapter, often in one room: here
 * it is set beside that room, in his voice, so playing deepens the reading. A line not heard yet
 * leaves a quiet note where it belongs (never what it says), with the two ways to it: hear it in
 * the lanes, or read every room of this chapter, which makes the pies say it the next time.
 *
 * And a room cast in the lanes (its sigil's verb done while it passed: struck, answered, joined…,
 * kept in lore.rooms.cast.v1 by pie-game.mjs) says so on its doorplate, with the way back to cast more.
 */
import { portraitSVG } from './characters.mjs?v=2026_11_10.A';

const LORE_URL = '/book/content/world/pie-lore.json';
const SPEAKERS = Object.freeze({ boon: 'Mr. BoonWAP', bane: 'Mr. BaneWAP' });
const MOODS = Object.freeze({ boon: 'glad', bane: 'thinking' });

const heard = () => {
  try {
    const record = JSON.parse(window.localStorage.getItem('lore.pie.v1') || '{}');
    return new Set(Array.isArray(record.lore) ? record.lore : []);
  } catch { return new Set(); }
};
const roomsRead = (n) => {
  try {
    const list = JSON.parse(window.localStorage.getItem('lore.rooms.v1') || '{}')[String(n)];
    return Array.isArray(list) ? list.length : 0;
  } catch { return 0; }
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function initLanesLore({ chapterData } = {}) {
  const main = document.getElementById('chapter-content');
  const n = Number(chapterData?.chapterNumber || 0);
  if (!main || !n) return () => {};
  let lines = [];
  let placed = [];
  const totalRooms = (chapterData.sections || []).filter((s) => s.room).length;

  const where = (line) => {
    const anchor = line.ground?.anchor && document.getElementById(line.ground.anchor);
    const room = anchor?.closest('[data-ebook-section]') || anchor;
    if (room && main.contains(room)) return { after: room };
    const end = main.querySelector(':scope > .chapter-inventory') || main.querySelector(':scope > .chapter-end-mark');
    return end ? { before: end } : { append: main };
  };

  const paintCasts = () => {
    let casts = {};
    try { casts = JSON.parse(window.localStorage.getItem('lore.rooms.cast.v1') || '{}')[String(n)] || {}; } catch { casts = {}; }
    const rooms = [...main.querySelectorAll(':scope > .room')];
    rooms.forEach((room, index) => {
      const cast = casts[index + 1];
      const head = room.querySelector(':scope > .room-head');
      let badge = head?.querySelector('.room-cast');
      if (!cast) { badge?.remove(); return; }
      if (!head) return;
      if (!badge) { badge = el('a', 'room-cast'); head.append(badge); }
      badge.href = '/pie/';
      badge.textContent = `cast in the lanes · ${cast.verb}`;
      badge.title = `This room's verb, done in Exactly One Pie while the room passed (${cast.at || 'kept'})`;
    });
  };

  const paint = () => {
    paintCasts();
    placed.forEach((node) => node.remove());
    placed = [];
    const known = heard();
    const read = roomsRead(n);
    let hints = 0;
    lines.forEach((line) => {
      const isHeard = known.has(line.id);
      if (!isHeard && hints >= 2) return;   // a quiet page: at most two notes of what is still to hear
      const note = el('figure', `lanes-lore${isHeard ? ' is-heard' : ' is-unheard'}`);
      note.dataset.speaker = line.speaker;
      if (isHeard) {
        const art = el('span', 'lanes-lore-art');
        art.innerHTML = portraitSVG(line.speaker, { size: 40, standalone: true, mood: MOODS[line.speaker] || 'calm' });
        const quote = el('blockquote', 'lanes-lore-line', line.line);
        const cap = el('figcaption', 'lanes-lore-cap');
        cap.append(`${SPEAKERS[line.speaker] || 'A pie'}, heard in the lanes · `);
        const a = el('a', '', 'Exactly One Pie →');
        a.href = `/pie/?from=${encodeURIComponent(`${location.pathname}#${line.ground?.anchor || ''}`)}`;
        cap.append(a);
        note.append(art, quote, cap);
      } else {
        hints += 1;
        const say = el('p', 'lanes-lore-hint');
        say.append(el('b', '', `${SPEAKERS[line.speaker] || 'The pies'} knows something about ${line.ground?.anchor ? 'this room' : 'this chapter'}.`), ' ');
        const a = el('a', '', 'Hear it in the lanes');
        a.href = '/pie/';
        say.append(a, totalRooms ? `, or read every room of this chapter (${read} of ${totalRooms}) and he will say it next time.` : '.');
        note.append(say);
      }
      const spot = where(line);
      if (spot.after) spot.after.after(note);
      else if (spot.before) spot.before.before(note);
      else spot.append.append(note);
      placed.push(note);
    });
  };

  paintCasts();
  fetch(LORE_URL).then((r) => r.json()).then((data) => {
    lines = (data.lines || []).filter((line) => Number(line.ground?.chapter) === n);
    if (lines.length) paint();
  }).catch(() => {});
  const onStorage = (event) => { if (!event.key || /lore\.(pie|rooms)/.test(event.key)) paint(); };
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('storage', onStorage);
    placed.forEach((node) => node.remove());
  };
}
