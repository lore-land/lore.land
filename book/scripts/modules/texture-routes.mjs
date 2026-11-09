/**
 * texture-routes.mjs — addresses that read: texture.website, played through lore.land.
 *
 * texture.website is the neighbour for material, grain and the tactile side of publishing (spwashi.com's canon:
 * "texture.website is grain. lore.land is long-form."). Its first use here is as a lab for routes: an address on
 * lore.land that begins ?/ is a route, read the way Spw is read, part by part:
 *
 *   lore.land/?/texture.website/@spwashi/!Boof+and+the+pie/=~2+@8
 *              └ a surface ────┘ └ whose ┘ └ write this ──────┘ └ tuned ┘
 *
 * Each part after the surface opens with an operator that says what it is (ROUTE_OPS): @ whose, * a thing itself,
 * ! do, = tuned, ~ a motif, $ made on (a material: texture-materials.mjs), & together with, . a field to edit,
 * % how many, ^ up to, ? a pass through spw.quest (quest-middleware.mjs). A route is state
 * you can read aloud and pass along: the page writes what you do back into it. The root page hands any ?/ address
 * to /texture/ and the address bar keeps the route as given. Portable: no DOM.
 */

export const ROUTE_OPS = Object.freeze({
  '@': { role: 'perspective', reads: 'whose: the maker it is seen from' },
  '*': { role: 'value', reads: 'a thing itself: one glyph, one piece' },
  '!': { role: 'action', reads: 'do: write these words' },
  '=': { role: 'config', reads: 'tuned: how it is shown' },
  '~': { role: 'potential', reads: 'a motif: what keeps coming back' },
  '&': { role: 'confluence', reads: 'together with: another surface, as for ?ground' },
  '.': { role: 'ground', reads: 'a field to change: .field:value, for ?edit' },
  '%': { role: 'measure', reads: 'how many' },
  '^': { role: 'integration', reads: 'up to' },
  '$': { role: 'substrate', reads: 'what it is made on: a material (texture, typography, physics)' },
  '?': { role: 'probe', reads: 'passed through spw.quest: a verb that edits, enhances, clarifies, aligns, mutates, grounds or resonates' }
});

const SURFACE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/* A segment in an address: % and # and / and + would break it, spaces travel as +. */
const encodeSegment = (text) => String(text).replace(/%/g, '%25').replace(/\+/g, '%2B').replace(/#/g, '%23').replace(/\//g, '%2F').replace(/"/g, '%22').replace(/ /g, '+');
const decodeSegment = (text) => { try { return decodeURIComponent(text.replace(/\+/g, ' ')); } catch { return text.replace(/\+/g, ' '); } };

/** Read an address (location.search, with or without its ?) into its parts. Not a route: null. */
export function readRoute(search = '') {
  const raw = String(search).replace(/^\?/, '');
  if (!raw.startsWith('/')) return null;
  const parts = raw.split('/').filter(Boolean).map((segment) => {
    // A surface's dots are its name, not the ground operator; = and ! keep the rest of the segment whole.
    const decoded = decodeSegment(segment);
    if (SURFACE.test(decoded)) return { op: '/', role: 'surface', name: decoded, reads: 'a neighbour of lore.land, played through it' };
    const op = decoded[0];
    if (ROUTE_OPS[op] && decoded.length > 1) return { op, role: ROUTE_OPS[op].role, name: decoded.slice(1), reads: ROUTE_OPS[op].reads };
    if (ROUTE_OPS[op]) return { op, role: ROUTE_OPS[op].role, name: '', reads: ROUTE_OPS[op].reads };
    return { op: '', role: 'path', name: decoded, reads: 'a step along the way' };
  });
  const first = (role) => parts.find((p) => p.role === role)?.name ?? null;
  const all = (role) => parts.filter((p) => p.role === role && p.name).map((p) => p.name);
  return {
    raw: `?${raw}`,
    parts,
    surface: first('surface'),
    perspective: first('perspective'),
    value: first('value'),
    action: first('action'),
    config: first('config'),
    motif: first('potential'),
    substrate: first('substrate'),
    with: first('confluence'),
    grounds: all('ground'),
    asked: all('probe')
  };
}

/** Write a route from its parts, in a fixed order so the same state is always the same address:
 * surface, @whose, ~motif, $material, *letter, !words, =tuning, .edits, &with, ?passes. */
export function writeRoute({ surface, perspective, value, action, config, motif, substrate, with: also, grounds = [], asked = [] } = {}) {
  const segments = [];
  if (surface) segments.push(surface);
  if (perspective) segments.push(`@${perspective}`);
  if (motif) segments.push(`~${motif}`);
  if (substrate) segments.push(`$${substrate}`);
  if (value) segments.push(`*${value}`);
  if (action) segments.push(`!${action}`);
  if (config) segments.push(`=${config}`);
  (grounds || []).forEach((g) => segments.push(`.${g}`));
  if (also) segments.push(`&${also}`);
  (asked || []).forEach((verb) => segments.push(`?${verb}`));
  return `?/${segments.map((s, i) => (i === 0 ? s : `${s[0]}${encodeSegment(s.slice(1))}`)).join('/')}`;
}

/** The pack a route lands on: the one whose own route (/surface/@maker) it begins with. */
export function resolveRoute(route, packs = []) {
  if (!route) return { kind: 'none' };
  const pack = packs.find((p) => {
    const own = readRoute(`?${p.route || ''}`);
    return own && own.surface === route.surface && (own.perspective || null) === (route.perspective || null);
  });
  if (pack) return { kind: 'pack', pack };
  if (route.surface && !route.perspective) {
    const here = packs.filter((p) => readRoute(`?${p.route || ''}`)?.surface === route.surface);
    if (here.length) return { kind: 'surface', packs: here };
  }
  return { kind: 'unknown' };
}

/** Routes to try: each shows one part of the grammar. */
export const TRY = Object.freeze([
  ['?/texture.website', 'the surface: what lives there'],
  ['?/texture.website/@spwashi', 'spwashi\'s hand'],
  ['?/texture.website/@spwashi/!Boof+and+the+pie', 'written in the hand'],
  ['?/texture.website/@spwashi/!honk/=~2+^1+?1', 'written, and tuned to wander, bounce and tilt'],
  ['?/texture.website/@spwashi/!Q/=*+%23', 'as scanned, with its measure showing'],
  ['?/texture.website/@spwashi/*g', 'one letter, and where it came from'],
  ['?/texture.website/~drip', 'a motif, across the folios'],
  ['?/texture.website/@spwashi/$honey/!slow+honk', 'made on honey: drag a letter, it comes back late'],
  ['?/texture.website/@spwashi/$drip/!drip', 'made on a folio texture: the letters sag'],
  ['?/texture.website/@spwashi/$storm/!parcel+gate/&factshift.center/?ground', 'a material, said in factshift.center\'s physics'],
  ['?/texture.website/@spwashi/!Boof/=~9+@40/?align', 'through spw.quest: put in range, with a receipt'],
  ['?/texture.website/@spwashi/!Boof/?mutate', 'through spw.quest: a variation, every time'],
  ['?/texture.website/@spwashi/.word:moon/.material:wash/?edit', 'through spw.quest: an edit written in the address'],
  ['?/texture.website/@spwashi/!pie+and+egg/?clarify/?resonate', 'through spw.quest: what it means, and what echoes it']
]);
