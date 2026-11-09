/**
 * chapter-inventory.mjs — the chapter's Spw at its end, lit by what this reader has found.
 *
 * The build prerenders it (chapter-spell.mjs): a collapsed <details> after
 * the end mark, holding the chapter's description spell with its gloss, and
 * every expression the chapter holds, grouped by sigil, all drawn as
 * nothing-yet-found. Here the reader's own stores light it:
 *
 *   rooms, marks, bracework   a room read         lore.rooms.v1 (rooms.mjs)
 *   wonders                   kept in the almanac lore.almanac.v1 (almanac.mjs)
 *   characters, berries       a card turned       lore.cards.v1 + lore.pie.v1 (collection.mjs)
 *   the palette               a layer earned      lore.palettes.v1 (collection.mjs)
 *
 * A found item shows its spell (spw-spell.mjs), its name and a door to where
 * it lives; one not yet found says only where to look. Each item's visual
 * wears data-discovery (veiled | glimpsed | found, the likeness states:
 * glimpsed once its chapter has been opened), and an empty .inv-likeness
 * hook waits for a seal and "find similar". The spell veils what is not yet
 * found (?room_3: a probe that says where to look). Counts are by sigil and
 * overall: "9 of 14 found". Nothing here is scored; it is the chapter, lit.
 *
 * Additive: collapsed at the chapter's end, nothing anyone had is moved.
 */

import { renderSpell } from './spw-spell.mjs?v=2026_11_09.I';
import { readRoom, roomSentence } from './room-signature.mjs?v=2026_11_08.W';
import { roomsRead } from './rooms.mjs?v=2026_11_09.L';
import { readAlmanac } from './almanac.mjs?v=2026_11_09.G';
import { CHARACTERS, portraitSVG } from './characters.mjs?v=2026_11_08.W';
import { cardsTurned, readPaletteState, layersOf, LAYERS, LAYER_WAYS } from './collection.mjs?v=2026_11_09.L';
import { spellText, glossFor } from './chapter-spell.mjs?v=2026_11_09.I';

const PROGRESS_KEY = 'lore.chapter.progress.v1';

function readJSON(text, fallback) {
  try { return JSON.parse(text || 'null') ?? fallback; } catch { return fallback; }
}

/** This reader's shelves, as the inventory reads them. */
function shelves(n) {
  const read = roomsRead(n);
  const almanac = readAlmanac();
  let visited = false;
  try {
    const progress = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
    visited = (Array.isArray(progress?.visited) ? progress.visited : []).map(Number).includes(n);
  } catch { /* storage blocked: nothing opened yet */ }
  return {
    read,
    almanac,
    cards: cardsTurned(),
    palettes: readPaletteState(),
    // The chapter has been opened: visited, a room read, or a wonder kept here (likeness.mjs reads it the same way).
    opened: visited || read.size > 0 || Object.values(almanac).some((entry) => (entry?.places || []).includes(n))
  };
}

function isFound(item, s) {
  switch (item.kind) {
    case 'room':
    case 'mark':
    case 'bracework': return s.read.has(Number(item.room));
    case 'wonder': return Boolean(s.almanac[item.key]);
    // Boof is on the cover: the cast counts her met from the start (home/app.mjs, likeness.mjs).
    case 'character': return item.key === 'boof' || s.cards.has(CHARACTERS[item.key]?.card);
    case 'berry': return s.cards.has(item.key);
    case 'palette': return layersOf(item.key, s.palettes).length > 0;
    default: return false;
  }
}

/* The spell's veiled atoms are keyed like the inventory: wonder:id, character:id. */
function keyFound(key, s) {
  const [kind, id] = String(key).split(':');
  return isFound({ kind, key: id }, s);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function initChapterInventory({ chapterData } = {}) {
  const main = document.getElementById('chapter-content');
  const box = main?.querySelector(':scope > .chapter-inventory');
  if (!box) return () => {};
  const n = Number(chapterData?.chapterNumber || box.dataset.chapter || 0);
  if (!n) return () => {};

  const items = [...box.querySelectorAll('.inv-item[data-inv-id]')].map((node) => ({
    node,
    id: node.dataset.invId,
    kind: node.dataset.invKind,
    key: node.dataset.invKey,
    room: Number(node.dataset.invRoom) || null,
    spell: node.dataset.invSpell || '',
    name: node.dataset.invName || '',
    note: node.dataset.invNote || '',
    href: node.dataset.invHref || '',
    drafting: node.dataset.invDrafting === 'true',
    visual: node.querySelector('.inv-visual'),
    expr: node.querySelector('.inv-expr'),
    hint: node.querySelector('.inv-hint'),
    hintText: node.querySelector('.inv-hint')?.textContent || '',
    where: node.querySelector('.inv-where'),
    whereText: node.querySelector('.inv-where')?.textContent || '',
    state: null,
    spelled: false
  }));
  const groups = [...box.querySelectorAll('.inv-group')].map((node) => ({
    node,
    count: node.querySelector('[data-inv-count]'),
    items: items.filter((item) => node.contains(item.node) && !item.drafting)
  }));
  const counted = items.filter((item) => !item.drafting);
  const allCount = box.querySelector('.inv-summary [data-inv-count]');
  const spellHost = box.querySelector('.inv-spell');
  const parts = readJSON(spellHost?.dataset.spellParts, []);
  const explainMap = readJSON(spellHost?.dataset.spellExplain, {});
  const from = spellHost?.dataset.spellFrom || '';
  const glossRows = [...box.querySelectorAll('.inv-gloss-row[data-gloss]')].map((row) => ({ dd: row.querySelector('dd'), gloss: readJSON(row.dataset.gloss, null) }));
  let shownSpell = null;

  const explainItem = (item) => () => {
    if (item.kind === 'room') return roomSentence(readRoom(item.spell));
    return `${item.name}${item.note ? `: ${item.note}` : ''}`;
  };

  const hintFor = (item, s) => {
    if (item.drafting) return item.hintText;
    const passed = item.room && s.read.has(item.room) && !['room', 'mark', 'bracework'].includes(item.kind);
    if (passed && item.kind === 'wonder') return `${item.hintText} You read past it in room ${item.room}: tap it where the prose names it.`;
    if (passed) return `${item.hintText} You read past it in room ${item.room}.`;
    return item.hintText;
  };

  const noteFor = (item, s) => {
    if (item.kind === 'palette') {
      const kept = layersOf(item.key, s.palettes);
      const ways = LAYERS.filter((layer) => !kept.includes(layer)).map((layer) => `${layer}: ${LAYER_WAYS[layer]}`);
      return `${item.note} Kept: ${kept.join(', ')}.${ways.length ? ` Still to earn, ${ways.join('; ')}.` : ' The whole palette is yours.'}`;
    }
    if (item.kind === 'wonder' && !(s.almanac[item.key]?.places || []).includes(n)) {
      return `${item.note} Kept from another chapter; it is marked here too.`;
    }
    return item.note;
  };

  const paintItem = (item, s) => {
    const found = !item.drafting && isFound(item, s);
    const state = item.drafting ? 'veiled' : found ? 'found' : s.opened ? 'glimpsed' : 'veiled';
    item.node.classList.toggle('is-found', state === 'found');
    item.node.classList.toggle('is-glimpsed', state === 'glimpsed');
    item.node.classList.toggle('is-veiled', state === 'veiled');
    if (item.visual) item.visual.dataset.discovery = state;
    if (item.kind === 'character' && item.visual && item.state !== state) {
      item.visual.innerHTML = portraitSVG(item.key, { size: 40, met: found });
    }
    if (item.hint) item.hint.textContent = found ? noteFor(item, s) : hintFor(item, s);
    let name = item.node.querySelector('.inv-name');
    if (found && !name) {
      name = el('span', 'inv-name', item.name);
      item.hint?.before(name);
    } else if (!found && name) {
      name.remove();
    }
    if (item.where) {
      if (found && item.href) {
        item.where.href = item.href;
        item.where.textContent = item.room ? `In room ${item.room} →` : item.kind === 'palette' ? 'On the almanac’s shelf →' : 'Where it lives →';
      } else {
        item.where.textContent = item.whereText;
      }
    } else if (found && item.href) {
      const link = el('a', 'inv-where', 'On the almanac’s shelf →');
      link.href = item.href;
      item.node.querySelector('.inv-text')?.append(link);
      item.where = link;
      item.whereText = '';
    }
    item.state = state;
    return found;
  };

  // Spells are drawn when the inventory is first opened: a room's always (its doorplate is no secret), the rest once found.
  const spellItems = () => {
    items.forEach((item) => {
      if (item.spelled || !item.expr || !item.spell) return;
      if (item.kind !== 'room' && item.state !== 'found') return;
      // One line, as written: a list of verses would stand taller than the list itself.
      const spell = renderSpell(item.spell, { cast: false, layout: 'line', explain: explainItem(item) });
      spell.classList.add('is-compact');
      item.expr.replaceChildren(spell);
      item.spelled = true;
    });
  };

  const spellDescription = (s) => {
    if (!spellHost || !parts.length) return;
    const text = spellText(parts, (key) => keyFound(key, s));
    if (text === shownSpell) return;
    shownSpell = text;
    const spell = renderSpell(text, {
      cast: true,
      play: true,
      copy: from,
      label: `The chapter in Spw: ${from}`,
      explain: (atom, sigil, label) => explainMap[label] || explainMap[atom] || null
    });
    spell.classList.add('inv-spell-render');
    spellHost.replaceChildren(spell);
  };

  const paint = () => {
    const s = shelves(n);
    let found = 0;
    items.forEach((item) => { if (paintItem(item, s) && !item.drafting) found += 1; });
    groups.forEach((group) => {
      const here = group.items.filter((item) => item.state === 'found').length;
      if (group.count) group.count.textContent = `${here} of ${group.items.length}`;
      group.node.classList.toggle('is-complete', here === group.items.length && here > 0);
    });
    if (allCount) allCount.textContent = found === counted.length ? `all ${counted.length} found` : `${found} of ${counted.length} found`;
    box.classList.toggle('is-complete', found === counted.length && found > 0);
    glossRows.forEach((row) => { if (row.dd && row.gloss) row.dd.textContent = glossFor(row.gloss, (key) => keyFound(key, s)); });
    if (box.open) {
      spellDescription(s);
      spellItems();
      dressLikeness();
    }
  };

  // Each thing's seal and what in the book is like it (likeness.mjs), and the atlas studies that share
  // this chapter's sigils: loaded the first time the inventory is opened, so a chapter stays light.
  let likeness = null;
  const dressLikeness = async () => {
    if (likeness === false) return;
    if (!likeness) {
      likeness = false;
      try {
        const mod = await import('./likeness.mjs?v=2026_11_09.I');
        await mod.loadLikeness();
        likeness = mod;
      } catch { return; }
      const strip = likeness.atlasStrip(n, { n: 3 });
      if (strip) {
        const atlas = el('div', 'inv-atlas');
        atlas.append(strip);
        const walk = box.querySelector(':scope > .inv-projection');
        if (walk) walk.before(atlas); else box.append(atlas);
      }
    }
    box.querySelectorAll('.inv-likeness[data-likeness-id]:not(.is-dressed)').forEach((slot) => {
      const id = slot.dataset.likenessId;
      if (!likeness.likenessItem(id)) return;
      slot.classList.add('is-dressed');
      slot.append(likeness.findSimilar(id, { label: 'Like it', n: 6 }));
    });
  };

  // The last word: walk out from this chapter on the scriptorium's disk (spw-projection-disk.mjs).
  if (!box.querySelector(':scope > .inv-projection')) {
    const walk = el('p', 'inv-projection');
    const link = el('a', '', '◎ Walk the projection from here');
    link.href = `/scriptorium/?focus=chapter:${String(n).padStart(2, '0')}#projection`;
    walk.append(link);
    box.append(walk);
  }

  let queued = 0;
  const soon = () => {
    if (queued) return;
    queued = requestAnimationFrame(() => { queued = 0; paint(); });
  };
  const onToggle = () => { if (box.open) paint(); };
  box.addEventListener('toggle', onToggle);
  window.addEventListener('lore:wonder', soon);
  window.addEventListener('storage', soon);
  document.addEventListener('lore:palette', soon);
  // Rooms are read and cards turn as the reader goes: look again whenever the inventory comes into view.
  const seen = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) soon(); })
    : null;
  seen?.observe(box);
  paint();

  return () => {
    cancelAnimationFrame(queued);
    seen?.disconnect();
    box.removeEventListener('toggle', onToggle);
    window.removeEventListener('lore:wonder', soon);
    window.removeEventListener('storage', soon);
    document.removeEventListener('lore:palette', soon);
  };
}
