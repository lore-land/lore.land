/**
 * kinds.mjs — the kinds of things the land keeps, in one place.
 *
 * Every feature that shows a wonder (the chapter's marks and cards, the almanac's shelves, the lanes'
 * medallions and gifts, the desk, the projection, the build's chapter spells, the checks) reads its
 * kind from here: its sigil, its word, its shelf, its ink (a CSS token in core/tokens.css), how it
 * moves in the lanes, how a reader comes to find it, what an artist needs to paint it, and its badge.
 * Canon: .spw/surfaces/ecology.spw. Data: book/content/world/almanac.json. No DOM at import, so the
 * build and the checks share it with the page.
 *
 *   creature     @  the bestiary: living things with a habit, a cost, and someone who misreads them
 *   antique      .  old made things the land keeps, with a provenance: who made it, who keeps it, what it remembers
 *   artifact     *  what a scene leaves behind, marked by what happened; some are made in the lanes
 *   contrivance  $  made things in use, by the people who use them
 *   bracework    &  the makers' craft of writing a thing in sigils and braces before building it
 *   saying       #  a piece of the makers' philosophy, kept in a phrase
 */

export const KINDS = Object.freeze({
  creature: {
    sigil: '@', word: 'creature', words: 'creatures', shelf: 'Bestiary', anchor: 'bestiary', token: '--kind-creature',
    found: 'Named where it lives in the prose, or steered into in the lanes. Its habit shows first; who misreads it, once kept.',
    lanes: 'moves by its own motion (roams, flies, burrows, swims, lags, stays): a flier is kept from a hop, a burrower from the ground',
    fields: ['motion', 'misread'],
    art: ['vantage', 'light', 'scent', 'edges', 'hint'],
    frame: 'ring'
  },
  antique: {
    sigil: '.', word: 'antique', words: 'antiques', shelf: 'Antiques', anchor: 'antiques', token: '--kind-antique',
    found: 'Named where it is kept; its card gives who made it and what it remembers, and the chapters it was made and kept in.',
    lanes: 'stays: it waits by its lane longer than anything else, and keeping it steadies the pie the way old things do',
    fields: ['provenance'],
    art: ['vantage', 'light', 'scent', 'edges', 'hint'],
    frame: 'plaque'
  },
  artifact: {
    sigil: '*', word: 'artifact', words: 'artifacts', shelf: 'Artifacts', anchor: 'artifacts', token: '--kind-artifact',
    found: 'Left by a scene and named where it was left; some are made in the lanes, by what a carry does, and come to the almanac on their own.',
    lanes: 'lies on the road: stepped onto, it is kept, and readies a slice; made in the lanes, it is kept when its deed is done',
    fields: ['residue'],
    art: ['vantage', 'light', 'edges', 'hint'],
    frame: 'tag'
  },
  contrivance: {
    sigil: '$', word: 'contrivance', words: 'contrivances', shelf: 'Contrivances', anchor: 'contrivances', token: '--kind-contrivance',
    found: 'Named where it is used, by the people who use it.',
    lanes: 'hums in its lane: keeping it feeds the crust',
    fields: [],
    art: ['vantage', 'light', 'scent', 'edges', 'hint'],
    frame: 'cog'
  },
  bracework: {
    sigil: '&', word: 'bracework', words: 'bracework', shelf: 'Bracework', anchor: 'bracework', token: '--kind-bracework',
    found: 'Named where makers write before they build; combined on the almanac\'s bench.',
    lanes: 'written before it is built: keeping it readies a slice',
    fields: [],
    art: ['vantage', 'light', 'edges', 'hint'],
    frame: 'braces'
  },
  saying: {
    sigil: '#', word: 'saying', words: 'sayings', shelf: 'Sayings', anchor: 'sayings', token: '--kind-saying',
    found: 'Said in the prose by someone who means it.',
    lanes: 'a rule the makers keep: keeping it steadies the pie',
    fields: ['craft'],
    art: [],
    frame: 'ribbon'
  }
});

/** The shelves, in the order the almanac shows them. */
export const KIND_ORDER = Object.freeze(['creature', 'antique', 'artifact', 'contrivance', 'bracework', 'saying']);
export const KIND_SIGIL = Object.freeze(Object.fromEntries(KIND_ORDER.map((k) => [k, KINDS[k].sigil])));
export const KIND_WORD = Object.freeze(Object.fromEntries(KIND_ORDER.map((k) => [k, KINDS[k].word])));

/* How a creature moves in the lanes (the motion each bestiary entry names). */
export const MOTIONS = Object.freeze({
  roams: 'wanders across the lanes, a little each way',
  flies: 'passes over at hat height: kept from a hop, not from the ground',
  burrows: 'keeps low, under the road: kept from the ground, never from a hop',
  swims: 'keeps to the seam between two lanes: kept from either',
  lags: 'arrives where it was a beat ago: kept a beat late',
  stays: 'keeps its place and waits longer'
});

/* ─── Badges: each kind framed in its own shape, its sigil at the heart ─── */

const ring = () => {
  // A ring of eight small ticks: something alive, looking every way.
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const x1 = 20 + Math.cos(a) * 15.5;
    const y1 = 20 + Math.sin(a) * 15.5;
    const x2 = 20 + Math.cos(a) * 18.5;
    const y2 = 20 + Math.sin(a) * 18.5;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }).join('');
  return `<circle class="kind-badge-fill" cx="20" cy="20" r="13.5"/><circle cx="20" cy="20" r="13.5" fill="none"/><path d="${ticks}" fill="none"/>`;
};
const cog = () => {
  // Ten teeth: something that turns because someone turns it.
  const teeth = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const at = (r, da) => `${(20 + Math.cos(a + da) * r).toFixed(1)} ${(20 + Math.sin(a + da) * r).toFixed(1)}`;
    return `M${at(13, -0.16)}L${at(17.5, -0.12)}L${at(17.5, 0.12)}L${at(13, 0.16)}`;
  }).join('');
  return `<circle class="kind-badge-fill" cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="13" fill="none"/><path d="${teeth}" fill="none"/>`;
};
const FRAMES = Object.freeze({
  ring,
  cog,
  // A plaque with a bevel and two rivets: old, mounted, kept.
  plaque: () => '<rect class="kind-badge-fill" x="4.5" y="8.5" width="31" height="23" rx="2.5"/><rect x="4.5" y="8.5" width="31" height="23" rx="2.5" fill="none"/><rect x="7.5" y="11.5" width="25" height="17" rx="1.2" fill="none" opacity="0.55"/><circle cx="8.8" cy="12.8" r="0.9"/><circle cx="31.2" cy="27.2" r="0.9"/>',
  // A luggage tag with its string: left behind, and meant to be picked up.
  tag: () => '<path class="kind-badge-fill" d="M9 11.5H27.5L35 20L27.5 28.5H9Z"/><path d="M9 11.5H27.5L35 20L27.5 28.5H9Z" fill="none"/><circle cx="29.5" cy="20" r="1.6" fill="none"/><path d="M29.5 20Q24 33 13 35" fill="none" opacity="0.6"/>',
  // Two braces: written before it is built.
  braces: () => '<rect class="kind-badge-fill" x="9" y="7" width="22" height="26" rx="4"/><path d="M13 7.5Q8.5 7.5 8.5 12V16.5Q8.5 20 5 20Q8.5 20 8.5 23.5V28Q8.5 32.5 13 32.5M27 7.5Q31.5 7.5 31.5 12V16.5Q31.5 20 35 20Q31.5 20 31.5 23.5V28Q31.5 32.5 27 32.5" fill="none"/>',
  // A ribbon with folded ends: said, and kept being said.
  ribbon: () => '<path class="kind-badge-fill" d="M7 13H33V27H7Z"/><path d="M7 13H33V27H7ZM7 15.5L2 15.5L4.5 20.5L2 25.5H7M33 15.5H38L35.5 20.5L38 25.5H33" fill="none"/>'
});

/**
 * A kind's badge as inline SVG markup: its frame in the kind's ink (currentColor, set by CSS from its
 * token), a pale fill, and its sigil. `label` names it for a screen reader; without one it is hidden.
 */
export function kindBadge(kind, { size = 28, label = '' } = {}) {
  const k = KINDS[kind] || KINDS.creature;
  const frame = (FRAMES[k.frame] || FRAMES.ring)();
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  // The ground's sigil is a point: drawn, since a full stop sits on its baseline, not at the heart.
  const heart = k.sigil === '.'
    ? '<circle cx="20" cy="20" r="2.8" stroke="none"/>'
    : `<text x="20" y="20.5" text-anchor="middle" dominant-baseline="central" stroke="none" font-family="ui-monospace, 'JetBrains Mono', monospace" font-weight="700" font-size="14">${k.sigil}</text>`;
  return `<svg class="kind-badge" data-kind="${kind}" viewBox="0 0 40 40" width="${size}" height="${size}" ${a11y} fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${frame}${heart}</svg>`;
}

/** A badge as a DOM node (pages only). */
export function kindBadgeNode(kind, options) {
  const holder = document.createElement('span');
  holder.className = 'kind-badge-holder';
  holder.innerHTML = kindBadge(kind, options);
  return holder.firstElementChild;
}

/** What a wonder of this kind says about itself on a card, beyond its note: its kind's own fields. */
export function kindLines(wonder) {
  const lines = [];
  if (!wonder) return lines;
  if (wonder.kind === 'creature') {
    if (wonder.motion) lines.push(['Moves', MOTIONS[wonder.motion] || wonder.motion]);
    if (wonder.misread) lines.push(['Misread', wonder.misread]);
  } else if (wonder.kind === 'antique' && wonder.provenance) {
    if (wonder.provenance.made) lines.push(['Made', wonder.provenance.made]);
    if (wonder.provenance.kept) lines.push(['Kept by', wonder.provenance.kept]);
    if (wonder.provenance.remembers) lines.push(['Remembers', wonder.provenance.remembers]);
  } else if (wonder.kind === 'artifact' && wonder.residue) {
    if (wonder.residue.left_by) lines.push(['Left by', wonder.residue.left_by]);
    if (wonder.residue.obliges) lines.push(['Asks', wonder.residue.obliges]);
    if (wonder.made_by) lines.push(['Made in the lanes', wonder.made_by.says || 'by what a carry does']);
  }
  return lines;
}

/** Problems with a wonder's kind-specific fields (book:check, through book/schema/book-types.mjs). */
export function kindProblems(wonder) {
  const problems = [];
  const id = wonder?.id || '?';
  if (!KINDS[wonder?.kind]) return [`${id}: kind must be ${KIND_ORDER.join(' | ')}`];
  if (wonder.kind === 'creature') {
    if (!MOTIONS[wonder.motion]) problems.push(`${id}: a creature moves (motion: ${Object.keys(MOTIONS).join(' | ')})`);
    if (typeof wonder.misread !== 'string' || !wonder.misread.trim()) problems.push(`${id}: a creature has someone who misreads it (misread)`);
  }
  if (wonder.kind === 'antique') {
    ['made', 'kept', 'remembers'].forEach((key) => {
      if (typeof wonder.provenance?.[key] !== 'string' || !wonder.provenance[key].trim()) problems.push(`${id}: an antique's provenance needs ${key}`);
    });
  }
  if (wonder.kind === 'artifact') {
    ['left_by', 'obliges'].forEach((key) => {
      if (typeof wonder.residue?.[key] !== 'string' || !wonder.residue[key].trim()) problems.push(`${id}: an artifact's residue needs ${key}`);
    });
    if (wonder.made_by && (typeof wonder.made_by.deed !== 'string' || !(wonder.made_by.at_least >= 1))) problems.push(`${id}: made_by needs a deed and at_least ≥ 1`);
  }
  return problems;
}
