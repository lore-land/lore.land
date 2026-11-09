/**
 * packs.mjs — what is added to lore.land, by whom, from where, and at which address.
 *
 * A pack adds without changing what is there. It lives where its route says (book/content/packs/<surface>/@<who>/
 * pack.json, listed in book/content/packs/index.json) and answers that route on lore.land
 * (lore.land/?/texture.website/@spwashi; texture-routes.mjs). It says what it brings (fonts, data, pages, tools),
 * where every source lives (linked, never copied), and, for a maker, their depiction scheme
 * (spwashi@<lore.land>.{) and a curriculum: plans, each something to make and a question to ask about media,
 * for readers of every age (Intergenerational Media Literacy, .spw/surfaces/texture-website.spw). Removing its
 * line from the index removes it.
 *
 * Portable: the page and the checks (book:check) share it. No DOM at import.
 */

export const REGISTRY = '/book/content/packs/index.json';

export const PACK_KINDS = Object.freeze({
  maker: { word: 'Maker', says: 'a maker\'s material, seen from lore.land: a scheme for how it is shown, and a curriculum' },
  expansion: { word: 'Expansion', says: 'more of the land: chapters, wonders, rooms or a feature, added and removable' }
});

/* The literacy ladder (.spw/index.spw ~production): each plan says which rung it is on. */
export const RUNGS = Object.freeze(['read', 'notice', 'explore', 'operate', 'inspect', 'author']);
export const PLAN_STATES = Object.freeze({ done: 'done', open: 'under way', planned: 'planned' });

/** The packs, in the registry's order. A pack that will not load is left out, never fatal. */
export async function loadPacks({ get = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)) } = {}) {
  const index = await get(REGISTRY).catch(() => null);
  if (!index?.packs) return [];
  const packs = await Promise.all(index.packs.map((entry) => get(entry.src).then((pack) => (pack ? { ...pack, entry } : null)).catch(() => null)));
  return packs.filter(Boolean);
}

/** The scheme's own reading, operator by operator, for a page to show. */
export const schemeParts = (pack) => Object.entries(pack.reads || {}).map(([part, says]) => ({ part, says }));

/** A pack's fonts, made available to the page (FontFace, so a page that never shows them never fetches them). */
export function registerFonts(pack, doc = globalThis.document) {
  if (!doc?.fonts || typeof FontFace === 'undefined') return [];
  return (pack.contributes?.fonts || []).map((f) => {
    const face = new FontFace(f.family, `url(${f.src}) format('opentype')`, { display: 'swap' });
    doc.fonts.add(face);
    return face;
  });
}

/** What is wrong with a pack, in words (book:check). `exists(path)` says whether a site path is there. */
export function packProblems(pack, { exists = () => true } = {}) {
  const problems = [];
  const at = `pack ${pack.id || '?'}`;
  if (!pack.id || !/^[a-z][a-z0-9-]*$/.test(pack.id)) problems.push(`${at}: an id of lowercase words`);
  if (!PACK_KINDS[pack.kind]) problems.push(`${at}: kind should be ${Object.keys(PACK_KINDS).join(' or ')}`);
  if (!pack.title) problems.push(`${at}: a title`);
  (pack.sources || []).forEach((s, i) => {
    if (!/^https:\/\//.test(s.href || '')) problems.push(`${at}: source ${i + 1} is linked where it lives (https), never copied`);
    if (!s.use) problems.push(`${at}: source ${i + 1} says how it is used`);
  });
  const files = [...(pack.contributes?.fonts || []), ...(pack.contributes?.data || [])].map((f) => f.src);
  files.forEach((src) => { if (!exists(src)) problems.push(`${at}: ${src} is not there`); });
  // A page is a file, or a route (/?/…), which /texture/ answers.
  (pack.contributes?.pages || []).forEach((p) => {
    const file = p.href.startsWith('/?/') ? '/texture/index.html' : `${p.href.replace(/\/$/, '')}/index.html`;
    if (!exists(file)) problems.push(`${at}: page ${p.href} is not there`);
  });
  if (!/^\/[a-z0-9-]+(\.[a-z0-9-]+)+(\/@[\w.-]+)?$/i.test(pack.route || '')) problems.push(`${at}: a route of a surface and, for a maker, whose (/texture.website/@spwashi)`);
  if (pack.kind === 'maker') {
    if (!pack.maker) problems.push(`${at}: a maker's pack names its maker`);
    if (pack.route && !pack.route.endsWith(`/@${pack.maker}`)) problems.push(`${at}: its route ends at its maker (/@${pack.maker})`);
    if (!pack.scheme) problems.push(`${at}: a maker's pack has a depiction scheme`);
    if (!/^[\w.-]+@<[^>]+>/.test(pack.scheme || '')) problems.push(`${at}: the scheme reads maker@<through>… (spwashi@<lore.land>.{)`);
    const ids = new Set();
    (pack.curriculum || []).forEach((plan) => {
      if (ids.has(plan.id)) problems.push(`${at}: plan ${plan.id} twice`);
      ids.add(plan.id);
      if (!PLAN_STATES[plan.state]) problems.push(`${at}: plan ${plan.id} state should be ${Object.keys(PLAN_STATES).join(', ')}`);
      if (!RUNGS.includes(plan.rung)) problems.push(`${at}: plan ${plan.id} rung should be one of ${RUNGS.join(', ')}`);
      if (!plan.make || !plan.ask) problems.push(`${at}: plan ${plan.id} has something to make and a question to ask`);
      if (!plan.ages) problems.push(`${at}: plan ${plan.id} says who it is for, across ages`);
    });
    if (!(pack.curriculum || []).length) problems.push(`${at}: a maker's pack has a curriculum`);
  }
  return problems;
}
