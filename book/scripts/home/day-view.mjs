/**
 * day-view.mjs — ?/day.lore.land, an event through the ?/ door: the day's room, the week's trope, the month's lens,
 * the quarter's band. Painted into the route page by texture-page.mjs (route-events.mjs names the event).
 *
 * Reads the site's own JSON (likeness.json rooms, search.json passages, tropes.json) and hands it
 * to daily.mjs, which chooses; this only lays it out. Every sentence of the book shown here is the
 * book's own. The one thing kept is a reach the reader picks for themselves (lore.day.reach.v1, on
 * this device), never asked for and never sent. Proposed: .spw/surfaces/cadence.spw.
 */
import { prepareDaily, today } from '../modules/daily.mjs?v=2026_11_11.A';
import { BANDS, CLUSTERS, combinatoricsFor } from '../modules/competency.mjs?v=2026_11_11.A';
import { TOTAL_CHAPTERS, NEXT_STONE } from '../modules/book-extent.mjs';

const REACH_KEY = 'lore.day.reach.v1';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ORDER_WORDS = { true: 'in order (a sequence)', false: 'in any order (a set)', either: 'as a set or as a sequence' };
const handWords = (c) => (c.hand === 1 ? 'One card at a time' : `A hand of ${c.hand}, ${ORDER_WORDS[String(c.ordered)]}${c.repeats ? ', a card may repeat' : ''}`);

const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('aria-') || key.startsWith('data-') || key === 'for') node.setAttribute(key, String(value));
    else node[key] = value;
  });
  kids.flat().forEach((kid) => kid != null && node.append(kid));
  return node;
};
const longDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

function readReach() {
  try {
    const n = Number(localStorage.getItem(REACH_KEY));
    return Number.isInteger(n) && n >= 1 && n <= 13 ? n : null;
  } catch { return null; }
}
function writeReach(n) {
  try {
    if (n) localStorage.setItem(REACH_KEY, String(n));
    else localStorage.removeItem(REACH_KEY);
  } catch { /* a choice for this visit only */ }
}

const fetchJSON = (url) => fetch(url, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`))));

/* ─── The cone: seven clusters on an arc, the ones in view lit, beams down to the pupil ─── */
function coneSVG(focus, inView) {
  const ns = 'http://www.w3.org/2000/svg';
  const W = 320;
  const H = 190;
  const cx = W / 2;
  const pupil = { x: cx, y: H - 22 };
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'day-cone');
  svg.setAttribute('role', 'img');
  const names = inView.map((id) => CLUSTERS.find((c) => c.id === id)?.name).filter(Boolean);
  svg.setAttribute('aria-label', `The cone of attention: ${names.join(', ')} in view, facing the pupil.`);
  const add = (tag, attrs, text) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (text) node.textContent = text;
    svg.append(node);
    return node;
  };
  // The ring, drawn as an arc over the pupil; the focus at its crown, neighbours out to each side.
  const at = CLUSTERS.findIndex((c) => c.id === focus);
  const slot = (i) => {
    const offset = ((i - at + CLUSTERS.length + 3) % CLUSTERS.length) - 3;   // -3 … 3, focus at 0
    const angle = (-90 + offset * 26) * (Math.PI / 180);
    return { x: cx + Math.cos(angle) * 128, y: 150 + Math.sin(angle) * 128, offset };
  };
  add('path', { class: 'ring', d: `M ${cx - 128 * Math.sin(78 * Math.PI / 180)} ${150 - 128 * Math.cos(78 * Math.PI / 180)} A 128 128 0 0 1 ${cx + 128 * Math.sin(78 * Math.PI / 180)} ${150 - 128 * Math.cos(78 * Math.PI / 180)}` });
  const lit = CLUSTERS.map((c, i) => ({ c, ...slot(i) })).filter((p) => inView.includes(p.c.id));
  if (lit.length) {
    const xs = lit.map((p) => p.x);
    const top = Math.min(...lit.map((p) => p.y));
    add('path', { class: 'beam', d: `M ${Math.min(...xs) - 14} ${top} L ${Math.max(...xs) + 14} ${top} L ${pupil.x + 6} ${pupil.y} L ${pupil.x - 6} ${pupil.y} Z` });
  }
  CLUSTERS.forEach((c, i) => {
    const p = slot(i);
    const cls = `cluster${inView.includes(c.id) ? ' in-view' : ''}${c.id === focus ? ' focus' : ''}`;
    add('circle', { class: cls, cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 15 });
    add('text', { x: p.x.toFixed(1), y: p.y.toFixed(1) }, c.sigil);
  });
  add('circle', { class: 'pupil', cx: pupil.x, cy: pupil.y, r: 7 });
  return svg;
}

/* ─── The layers ─── */
function dayLayer(r) {
  const d = r.day;
  const lens = r.month.label;
  return el('section', { className: 'day-layer', 'data-layer': 'day', 'aria-label': 'Today' },
    el('p', { className: 'day-kicker' }, `Today · Chapter ${d.chapter}`),
    el('h2', {}, d.title),
    el('p', { className: 'day-sig' }, el('code', {}, d.spw), d.reading ? el('span', {}, `${d.reading.lead} ${d.reading.gloss ? `(${d.reading.gloss})` : ''}`.trim()) : null),
    el('blockquote', { className: 'day-excerpt' }, d.excerpt),
    el('p', { className: 'day-actions' },
      el('a', { href: d.href }, 'Read the room'),
      el('a', { href: d.lensHref }, `Read it as ${lens}`)));
}

function weekLayer(r) {
  const t = r.week.trope;
  const list = el('ol', { className: 'day-week' });
  r.week.rooms.forEach((room, k) => {
    const a = el('a', { href: room.href }, el('b', {}, WEEKDAYS[k]), el('span', {}, `${room.chapter} · ${room.title}`));
    if (room.today) a.setAttribute('aria-current', 'date');
    list.append(el('li', {}, a));
  });
  return el('section', { className: 'day-layer', 'data-layer': 'week', 'aria-label': 'This week' },
    el('p', { className: 'day-kicker' }, `This week · ${t.sigil} · chapters ${t.chambers.join(', ')}`),
    el('h2', {}, t.name),
    el('p', {}, t.statement),
    list);
}

function monthLayer(r) {
  const m = r.month;
  const turn = el('ol', { className: 'day-turn', 'aria-label': 'The quarter turns the triangle, one land a month' });
  ['Boon', 'Bane', 'Bone'].forEach((label, i) => {
    const li = el('li', {}, label);
    if (i + 1 === m.turn) li.setAttribute('aria-current', 'true');
    turn.append(li);
  });
  return el('section', { className: 'day-layer', 'data-layer': 'month', 'aria-label': 'This month' },
    el('p', { className: 'day-kicker' }, `This month · read as ${m.label}`),
    el('h2', {}, m.question),
    el('p', {}, m.gloss),
    turn);
}

function quarterLayer(r) {
  const q = r.quarter;
  const cluster = q.cluster;
  const select = el('select', { id: 'day-reach', name: 'reach' },
    el('option', { value: '' }, 'none chosen'),
    BANDS.map((b) => el('option', { value: String(b.band) }, `${b.band} · ${b.name}`)));
  const out = el('output', { for: 'day-reach' });
  let cone = coneSVG(q.focus, q.clusters);
  const paint = (band) => {
    select.value = band ? String(band) : '';
    const next = coneSVG(q.focus, band ? combinatoricsFor({ band, focus: q.focus }).clusters : q.clusters);
    cone.replaceWith(next);
    cone = next;
    if (!band) { out.textContent = `The land is at band ${q.band}: ${q.land.name}. ${handWords(q.land)}: ${q.land.sigilHands.toLocaleString()} spells from the twelve sigils.`; return; }
    const c = combinatoricsFor({ band, focus: q.focus });
    out.textContent = `${c.name}: ${c.holds.join(', ')}. ${handWords(c)}: ${c.sigilHands.toLocaleString()} spells from the twelve sigils. ${c.cone} of the 7 clusters in view.`;
  };
  select.addEventListener('change', () => {
    const band = Number(select.value) || null;
    writeReach(band);
    paint(band);
  });
  const section = el('section', { className: 'day-layer', 'data-layer': 'quarter', 'aria-label': 'This quarter' },
    el('p', { className: 'day-kicker' }, `This quarter · ${q.q} of ${q.of}`),
    el('h2', {}, `${cluster.sigil} ${cluster.name}`),
    el('p', {}, `Facing the pupil this quarter: ${cluster.holds}.`),
    cone,
    el('label', { className: 'day-reach' }, 'Your reach, if you want one (kept on this device only)', select, out));
  paint(q.reach?.band || null);
  return section;
}

/**
 * Paint a day's reading into host. date: a Date (the reader's own day by default, or one an address names).
 * @param {HTMLElement} host
 * @param {{ date?: Date }} [opts]
 */
export async function renderDay(host, { date = new Date() } = {}) {
  if (!host) return null;
  host.replaceChildren(el('p', { className: 'day-status' }, 'Setting the day\u2019s reading\u2026'));
  try {
    const [likeness, search, tropes] = await Promise.all([
      fetchJSON('/book/content/world/likeness.json'),
      fetchJSON('/book/content/search.json'),
      fetchJSON('/book/content/world/tropes.json')
    ]);
    const data = prepareDaily({ likeness, search, tropes, extent: { total: TOTAL_CHAPTERS, next: NEXT_STONE } });
    const r = today(date, { data, reach: readReach() });
    if (!r) throw new Error('no reading');
    const next = r.next ? el('p', { className: 'day-next' }, r.next.days > 0
      ? `Chapter ${r.next.chapter} is set for ${longDate(r.next.date)}.`
      : r.next.days === 0 ? `Chapter ${r.next.chapter} is set for today.` : `Chapter ${r.next.chapter} was set for ${longDate(r.next.date)}.`) : null;
    host.replaceChildren(el('div', { className: 'day-layers' }, dayLayer(r), weekLayer(r), monthLayer(r), quarterLayer(r)), ...(next ? [next] : []));
    return r;
  } catch (error) {
    host.replaceChildren(el('p', { className: 'day-status' }, 'The day\u2019s reading could not be set. The chapters are all here: '), el('p', {}, el('a', { href: '/#chambers' }, 'Contents')));
    console.warn('[day]', error);
    return null;
  }
}
