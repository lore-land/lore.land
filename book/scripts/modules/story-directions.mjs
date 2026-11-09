/**
 * story-directions.mjs — a link that sets the story (PLAN.E L27).
 *
 * Stage directions (stage-directions.mjs) set one page for one picture.
 * Story directions set how the book is read for a visit, and carry from
 * chapter to chapter in this tab until they are let go:
 *
 *   ?edition=7 | ?edition=winter | ?edition=first
 *        every turning phrase in the book takes that edition's telling: the
 *        same words for everyone who opens the link (first: the book's own)
 *   ?lens=boon|bane|bone|balanced     ?genre=boon:2,bone:1
 *   ?room=day|dusk|lamp   ?cozy=0.8   ?texture=0.2
 *   ?binding=rag|glass|salt|ember|slate|starfield
 *   ?with=living,focus-line           ?without=wonders,sightings
 *
 * and, for one page only (a slot's name belongs to its chapter):
 *   ?tell=kitchen-smell.3,field-birds.2   pin phrases to a telling (.1 is the book's own)
 *
 *   ?story=mine   let every story direction go; the reader's own settings return
 *
 * Nothing here is saved as the reader's own unless they choose "Keep as
 * mine" on the notice the page shows. Turning a control themselves drops
 * that one direction for the rest of the visit. The chapter template's head
 * script reads the same parameters before first paint; keep them in step.
 */
import { settle } from './settled.mjs?v=2026_11_08.N';

const STORY_KEY = 'lore.story.v1';
const NOOK_KEY = 'lore.nook.v1';
const SWITCHES_KEY = 'lore.switches.v1';
export const STORY_PARAMS = Object.freeze(['edition', 'lens', 'genre', 'room', 'cozy', 'texture', 'binding', 'with', 'without']);
const LENSES = ['boon', 'bane', 'bone', 'balanced'];
const ROOMS = { day: 0, dusk: 0.5, lamp: 1 };
const BINDINGS = ['rag', 'glass', 'salt', 'ember', 'slate', 'starfield'];
const BINDING_NAMES = { rag: 'rag paper', glass: 'Bonk glass', salt: 'salt crust', ember: 'oven clay', slate: 'slate', starfield: 'night cloth' };
const GENRE_NAMES = { boon: 'fairy tale', bane: 'absurd reality', bone: 'low magic' };

const session = () => {
  try { return window.sessionStorage; } catch { return null; }
};
const readSession = () => {
  try { return JSON.parse(session()?.getItem(STORY_KEY) || '{}') || {}; } catch { return {}; }
};
const writeSession = (story) => {
  try {
    if (Object.keys(story).length) session()?.setItem(STORY_KEY, JSON.stringify(story));
    else session()?.removeItem(STORY_KEY);
  } catch { /* the link still sets this page */ }
};

const list = (raw) => String(raw || '').split(',').map((id) => id.trim()).filter((id) => /^[a-z][a-z-]*$/.test(id));

/** genre=boon:2,bone:1 (or "boon 2 bone 1") → weights. */
export function parseGenre(raw) {
  const weights = {};
  String(raw || '').toLowerCase().replace(/(boon|bane|bone)\s*[:=]?\s*(\d*\.?\d+)?/g, (_, id, amount) => {
    weights[id] = (weights[id] || 0) + (amount ? Number(amount) : 1);
    return '';
  });
  return Object.values(weights).some((value) => value > 0) ? weights : null;
}

/** The story directions a set of URL parameters gives, validated. */
export function parseStory(params) {
  const q = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
  const story = {};
  const edition = (q.get('edition') || '').toLowerCase();
  if (/^[a-z0-9][a-z0-9-]{0,23}$/.test(edition)) story.edition = edition;
  const lens = q.get('lens');
  if (LENSES.includes(lens)) {
    story.lens = lens;
    story.genre = lens === 'balanced' ? { boon: 1, bane: 1, bone: 1 } : { [lens]: 1 };
  }
  const genre = parseGenre(q.get('genre'));
  if (genre) {
    story.genre = genre;
    delete story.lens;
  }
  if (q.get('room') in ROOMS) story.room = q.get('room');
  const number = (key, min, max) => {
    const n = Number(q.get(key));
    return q.has(key) && Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  if (number('cozy', 0.6, 1.5) != null) story.cozy = number('cozy', 0.6, 1.5);
  if (number('texture', 0, 1) != null) story.texture = number('texture', 0, 1);
  if (BINDINGS.includes(q.get('binding'))) story.binding = q.get('binding');
  if (list(q.get('with')).length) story.with = list(q.get('with'));
  if (list(q.get('without')).length) story.without = list(q.get('without'));
  return story;
}

let cached = null;
/**
 * This visit's story: the session's, with this page's link on top. Called
 * once per page it also remembers the merge, so the next chapter keeps it.
 */
export function readStory(href = typeof location !== 'undefined' ? location.href : '') {
  if (cached && cached.href === href) return { ...cached.story };
  let url;
  try { url = new URL(href); } catch { return {}; }
  let story;
  if (url.searchParams.get('story') === 'mine') {
    story = {};
  } else {
    const fromLink = parseStory(url.searchParams);
    story = { ...readSession(), ...fromLink };
    // A lens given by the link replaces a blend remembered from earlier, and the other way round.
    if (fromLink.genre && !fromLink.lens) delete story.lens;
  }
  writeSession(story);
  cached = { href, story };
  return { ...story };
}

export const hasStory = (story = readStory()) => STORY_PARAMS.some((key) => story[key] != null);

/** A reader turned that control themselves: the direction goes for the rest of the visit. */
export function dropStory(...keys) {
  const story = readStory();
  keys.forEach((key) => delete story[key]);
  if (keys.includes('genre')) delete story.lens;
  writeSession(story);
  if (cached) cached.story = story;
  window.dispatchEvent(new CustomEvent('lore:story', { detail: { story } }));
}

/** A reader flipped that switch themselves: it leaves the link's with/without lists. */
export function dropSwitch(id) {
  const story = readStory();
  let changed = false;
  ['with', 'without'].forEach((key) => {
    if (!story[key]?.includes(id)) return;
    story[key] = story[key].filter((entry) => entry !== id);
    if (!story[key].length) delete story[key];
    changed = true;
  });
  if (!changed) return;
  writeSession(story);
  if (cached) cached.story = story;
  window.dispatchEvent(new CustomEvent('lore:story', { detail: { story } }));
}

/** Switch values with a link's with/without lists over them. */
export function visitSwitches(map, story = readStory()) {
  const out = { ...map };
  (story.with || []).forEach((id) => { if (id in out) out[id] = 'on'; });
  (story.without || []).forEach((id) => { if (id in out) out[id] = 'off'; });
  return out;
}

export function clearStory() {
  writeSession({});
  if (cached) cached.story = {};
}

/** ?tell=kitchen-smell.3 → { 'kitchen-smell': 2 } (zero-based; .1 is the book's own). */
export function readTells(href = typeof location !== 'undefined' ? location.href : '') {
  let raw = '';
  try { raw = new URL(href).searchParams.get('tell') || ''; } catch { return {}; }
  const tells = {};
  raw.split(',').forEach((part) => {
    const match = /^([a-z][a-z0-9-]*)[.:](\d{1,2})$/.exec(part.trim());
    if (match && Number(match[2]) >= 1) tells[match[1]] = Number(match[2]) - 1;
  });
  return tells;
}

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

/** Which telling an edition gives a slot: the same for everyone, everywhere. */
export function editionIndex(edition, chapter, slot, count) {
  if (!edition || !count) return null;
  if (edition === 'first') return 0;
  return hash(`edition:${edition}:${chapter}:${slot}`) % count;
}

const round = (n) => Number(Number(n).toFixed(2));
const weightsText = (genre) => ['boon', 'bane', 'bone'].filter((id) => genre[id] > 0).map((id) => `${id}:${round(genre[id])}`).join(',');

/** Write a story into a link's parameters (only what is set). */
export function storyParams(story, params = new URLSearchParams()) {
  STORY_PARAMS.forEach((key) => params.delete(key));
  if (story.edition) params.set('edition', story.edition);
  if (story.lens) params.set('lens', story.lens);
  else if (story.genre) params.set('genre', weightsText(story.genre));
  if (story.room) params.set('room', story.room);
  if (story.cozy != null) params.set('cozy', String(round(story.cozy)));
  if (story.texture != null) params.set('texture', String(round(story.texture)));
  if (story.binding && story.binding !== 'rag') params.set('binding', story.binding);
  if (story.with?.length) params.set('with', story.with.join(','));
  if (story.without?.length) params.set('without', story.without.join(','));
  return params;
}

/** A link to this chapter carrying a story and, if given, the tellings to pin. */
export function storyLink({ story = readStory(), tells = null, href = location.href, hash: anchor } = {}) {
  const url = new URL(href);
  ['tell', 'story', 'try'].forEach((key) => url.searchParams.delete(key));
  storyParams(story, url.searchParams);
  if (tells && Object.keys(tells).length) {
    url.searchParams.set('tell', Object.entries(tells).map(([name, index]) => `${name}.${index + 1}`).join(','));
  }
  if (anchor !== undefined) url.hash = anchor ? `#${anchor}` : '';
  return url.toString();
}

/** The story in plain words, for the notice and for announcements. */
export function describeStory(story) {
  const out = [];
  if (story.edition) out.push(story.edition === 'first' ? 'the first edition: the book’s own words' : `edition ${story.edition}`);
  if (story.lens && story.lens !== 'balanced') out.push(`read as ${story.lens}`);
  else if (story.lens === 'balanced') out.push('read balanced');
  else if (story.genre) {
    const total = (story.genre.boon || 0) + (story.genre.bane || 0) + (story.genre.bone || 0) || 1;
    out.push(`a blend: ${['boon', 'bane', 'bone'].filter((id) => story.genre[id] > 0).map((id) => `${GENRE_NAMES[id]} ${Math.round((story.genre[id] / total) * 100)}%`).join(', ')}`);
  }
  if (story.room) out.push({ day: 'daylight', dusk: 'dusk', lamp: 'lamplight' }[story.room]);
  if (story.cozy != null) out.push(story.cozy < 0.8 ? 'set snug' : story.cozy > 1.15 ? 'set roomy' : 'set cozy');
  if (story.texture != null) out.push(story.texture < 0.15 ? 'plain paper' : story.texture > 0.8 ? 'lively paper' : 'soft grain');
  if (story.binding) out.push(`bound in ${BINDING_NAMES[story.binding] || story.binding}`);
  if (story.with?.length) out.push(`with ${story.with.join(', ').replace(/-/g, ' ')}`);
  if (story.without?.length) out.push(`without ${story.without.join(', ').replace(/-/g, ' ')}`);
  return out;
}

/** Keep as mine: the visit's directions become the reader's own settings. */
export function keepStory(story = readStory()) {
  try {
    const nook = JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}') || {};
    if (story.genre) {
      nook.genre = story.genre;
      nook.lens = story.lens && story.lens !== 'balanced' ? story.lens : '';
    }
    if (story.room) nook.light = ROOMS[story.room];
    if (story.cozy != null) nook.cozy = story.cozy;
    if (story.texture != null) nook.texture = story.texture;
    if (story.binding) {
      nook.binding = story.binding;
      window.localStorage.setItem('lore.monument.theme', { rag: 'paper', starfield: 'night' }[story.binding] || story.binding);
    }
    window.localStorage.setItem(NOOK_KEY, JSON.stringify(nook));
    if (story.with?.length || story.without?.length) {
      const switches = JSON.parse(window.localStorage.getItem(SWITCHES_KEY) || 'null');
      if (switches) {
        switches.choices = switches.choices || {};
        switches.resolved = switches.resolved || {};
        (story.with || []).forEach((id) => { switches.choices[id] = 'on'; switches.resolved[id] = 'on'; });
        (story.without || []).forEach((id) => { switches.choices[id] = 'off'; switches.resolved[id] = 'off'; });
        window.localStorage.setItem(SWITCHES_KEY, JSON.stringify(switches));
      }
    }
  } catch { /* private mode: the visit keeps them anyway */ }
  // An edition is a way of reading, not a setting: it stays with the visit.
  writeSession(story.edition ? { edition: story.edition } : {});
  if (cached) cached.story = story.edition ? { edition: story.edition } : {};
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

/**
 * The notice: a chapter opened with story directions says so under its
 * title, in plain words, with Keep as mine and Let go.
 */
export function initStoryDirections() {
  const head = document.querySelector('main.chapter .chapter-head');
  if (!head) return () => {};
  let notice = null;

  const render = () => {
    const story = readStory();
    notice?.remove();
    notice = null;
    if (!hasStory(story)) return;
    const keep = el('button', { type: 'button', className: 'story-directions-keep' }, 'Keep as mine');
    const go = el('button', { type: 'button', className: 'story-directions-go' }, 'Let go');
    keep.hidden = Object.keys(story).every((key) => key === 'edition');
    notice = el('p', { className: 'story-directions', role: 'note' },
      el('span', { className: 'story-directions-kicker' }, 'From a link'),
      el('span', { className: 'story-directions-what' }, describeStory(story).join(' · ')),
      el('span', { className: 'story-directions-actions' }, keep, go));
    keep.addEventListener('click', () => {
      keepStory(story);
      settle({ sigil: '❦', title: 'Kept as yours', detail: 'These settings are your own now; the nook, the lens and the switches show them.', at: keep, region: 'main.chapter' });
      render();
    });
    go.addEventListener('click', () => {
      clearStory();
      const url = new URL(window.location.href);
      STORY_PARAMS.concat(['tell', 'story']).forEach((key) => url.searchParams.delete(key));
      window.location.assign(url.toString());
    });
    head.insertAdjacentElement('afterend', notice);
  };

  render();
  window.addEventListener('lore:story', render);
  return () => {
    window.removeEventListener('lore:story', render);
    notice?.remove();
  };
}
