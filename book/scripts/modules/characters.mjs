/**
 * characters.mjs — everyone in the book, as one portable registry and a portrait any page can show.
 *
 * One record per character: name, the card it turns (pie-cards / collection), where the book first
 * has them, where to go to meet them, a palette and a material, and who they are as a Spw spell.
 * portraitSVG() draws each one in the same medallion style, from vector shapes in the game's own
 * plain-line language, so a portrait can go on a card, a notice, the cast, a map, a print, or another
 * site: { standalone: true } writes plain fills (a file that stands on its own); the default writes
 * fills as CSS custom properties, so a character not yet met can be drawn as a silhouette with a hint
 * of where to meet them (characters.css). <lore-portrait kind="boof"> places one anywhere.
 *
 * Canon: the figure in plain lines is never named; the Egg is not a character and is never explained;
 * Boof works for the land. Children are never portraits.
 */

export const CHARACTERS = Object.freeze({
  boof: {
    name: 'Boof', card: 'boof', first: 1, href: '/characters/boof.html',
    line: 'A working dog. Works for the land wherever the fences stand, and trusts an honest scent before a name.',
    palette: { ground: '#f3e3c8', a: '#8a5a32', b: '#d9b48a', c: '#2f2018', accent: '#c86d2c' }, material: 'berry'
  },
  ants: {
    name: 'The torch-ants', card: 'ants', first: 1, href: '/world/boonberry-commons.html#ant-hearths',
    line: 'Keep lit streets along the berry roots all winter. Businesslike; very particular about torches.',
    palette: { ground: '#f6ead2', a: '#3a2a20', b: '#f6b24a', c: '#c86d2c', accent: '#f6b24a' }, material: 'steam'
  },
  genie: {
    name: 'The Genie, off-season', card: 'carrier-genie', first: 3, href: '/book/chapter/03/',
    line: 'Could grant anything except a want as small as Boof’s. Paid for hers with everything he had left, and one Thursday.',
    palette: { ground: '#e6eef5', a: '#2b5aa6', b: '#7fb4c0', c: '#1d2a44', accent: '#c4922e' }, material: 'glass'
  },
  bane: {
    name: 'Mr. BaneWAP', card: 'bane', first: 4, href: '/book/chapter/04/',
    line: 'A pie made of baneberries. What he announces comes true the bad way, because he said it; he keeps an off switch in every scheme.',
    palette: { ground: '#ebe2f0', a: '#4a2c5a', b: '#7a3f9a', c: '#1f1426', accent: '#b04558' }, material: 'ink'
  },
  boon: {
    name: 'Mr. BoonWAP', card: 'boon', first: 6, href: '/book/chapter/06/',
    line: 'A warm pie who holds court in Bonk City, serves himself in slices, and is never smaller.',
    palette: { ground: '#fbecc4', a: '#e0a95a', b: '#4d9f97', c: '#6a3a14', accent: '#e0a23a' }, material: 'flour'
  },
  bonewap: {
    name: 'BoneWAP', card: 'bonewap', first: 10, href: '/book/chapter/10/',
    line: 'A pie with its joints showing: no sugar it has not declared. Taps the sill beam and lets the timber answer.',
    palette: { ground: '#f2efe9', a: '#efe6d6', b: '#a8564a', c: '#3a302a', accent: '#a8564a' }, material: 'oak'
  },
  porter: {
    name: 'The porter', card: 'carrier-porter', first: 15, href: '/book/chapter/15/',
    line: 'Keeps the parcel gate, hung for three porters and kept by one. Held it in a storm for a stranger.',
    palette: { ground: '#e8e2d6', a: '#5d6a73', b: '#b9773a', c: '#22262a', accent: '#5d6a73' }, material: 'oak'
  },
  clerk: {
    name: 'A feast clerk', card: 'carrier-clerk', first: 15, href: '/book/chapter/15/',
    line: 'Keeps the DAMAGE slips for the Feast of the Uneven Slice: a word at the top, a line for the cause.',
    palette: { ground: '#f3ece0', a: '#3d4a5c', b: '#c0392b', c: '#1d1d22', d: '#e9d8c4', accent: '#c0392b' }, material: 'ink'
  },
  figure: {
    name: 'The figure in plain lines', card: 'carrier-figure', first: 14, href: '/book/chapter/14/',
    line: 'One circle, one rectangle, four lines, two dots. Nobody has said who. The hat rests above, and never lands.',
    palette: { ground: '#f4f1ea', a: '#1d1d22', b: '#3a3a40', c: '#1d1d22', accent: '#c4922e' }, material: 'ink'
  },
  clown: {
    name: 'A clown', card: 'clown', first: null, href: '/pie/',
    line: 'Clowns love WAP: Bonk City’s word for a pie in the face. The pie on the plate is never smaller for it.',
    palette: { ground: '#fdf1e6', a: '#fbf7f0', b: '#d6473e', c: '#2a2026', accent: '#d6473e' }, material: 'flour'
  },
  mime: {
    name: 'A mime', card: 'mime', first: null, href: '/pie/',
    line: 'Silent, white-gloved, palms flat on a wall that is not there. Gathers baneberries for Mr. BaneWAP, in pantomime.',
    palette: { ground: '#eceff3', a: '#fbfbfd', b: '#3c4555', c: '#1d1d22', accent: '#3c4555' }, material: 'glass'
  }
});

/** Who they are, as a Spw spell (the same shape the game's cards use). */
/* ─── Each character's model: traits a reader could name, a temperament in one line, and (for those
 * the hat settles on in Exactly One Pie) their knack. The portrait wears five moods, drawn as the marks
 * comics have always used beside a head, so any portrait in the set can wear any of them. ─── */
export const MODELS = Object.freeze({
  boof: { traits: ['nose first', 'works for the land', 'patient'], temperament: 'Unhurried until she is not; trusts a scent before a name.' },
  ants: { traits: ['businesslike', 'particular', 'many'], temperament: 'Keep the lights on; a detour is just a street nobody has lit yet.' },
  genie: { traits: ['glides', 'off-season', 'generous to a fault'], temperament: 'Settles a pie the way he settles a price.', knack: 'True after a WAP: each clown satisfied, the needle points true for two seconds.' },
  bane: { traits: ['announces', 'self-fulfilling', 'keeps an off switch'], temperament: 'Says what will happen, and so it does, the bad way.' },
  boon: { traits: ['holds court', 'warm', 'never smaller'], temperament: 'Serves himself in slices and is never the less for it.' },
  bonewap: { traits: ['declared', 'savoury', 'listens to timber'], temperament: 'No sugar it has not declared; lets the beam answer.' },
  porter: { traits: ['steady', 'broad', 'holds the gate'], temperament: 'Steady as a sack of flour, and as quick.', knack: 'Long hold: an arrow on the track holds the needle half as long again.' },
  clerk: { traits: ['precise', 'quick', 'nervous'], temperament: 'A word at the top, a line for the cause.', knack: 'Quick feet: a wider moment to chain one hop into the next.' },
  figure: { traits: ['plain lines', 'unnamed', 'under the hat'], temperament: 'Nobody has said who; the hat has an opinion.', knack: 'Fine hands: the needle turns a finer notch, steadier with every stroke noticed.' },
  clown: { traits: ['loves WAP', 'big feelings', 'forgiving'], temperament: 'A pie in the face is a kindness, done right.', knack: 'Big feelings: every impact lands bigger.' },
  mime: { traits: ['silent', 'white-gloved', 'very clear about walls'], temperament: 'Says nothing, and is very clear about it.' }
});
/* Why each one is drawn the way they are. A character is a want and a limit on one sheet. `escape` is what you get to be
 * while they carry, or while they keep you company: the lanes are for getting away, and this is who from. `reason` is the
 * maker's register, and only ever shown folded, off the lanes. Nobody here is given a line to say. */
export const REASONS = Object.freeze({
  boof: { want: 'To finish the rounds with nothing unaccounted for.', limit: 'Cannot read, and will not be told what a smell means.', escape: 'She crosses your lanes on her own business. For a moment you are someone a dog has no opinion about.', reason: 'The book needed a witness with no stake in being believed. A working dog notices and does not interpret, so the reader gets to.' },
  ants: { want: 'The street lit by evening.', limit: 'Will not go anywhere unlit.', escape: 'While they walk with you the way is lit, and it is somebody else\u2019s job.', reason: 'A wish this large needs something small that goes on working around it. The ants keep the book\u2019s scale honest.' },
  genie: { want: 'To close the practice with the books even.', limit: 'Cannot read a want as small as hers, and cannot stop pricing.', escape: 'For a carry you are unhurried and very good at your job.', reason: 'Wish stories usually take the genie for granted. This one keeps asking who pays for a granted thing.' },
  bane: { want: 'To hold the thing longest.', limit: 'What he announces comes true, and he cannot help leaving an off switch.', escape: 'He is the trouble, and the trouble has a switch on it.', reason: 'A villain who always leaves an off switch can be foiled by anyone paying attention. The fear has a floor, so it can be played with.' },
  boon: { want: 'To feed everyone, and be thanked in passing.', limit: 'Cannot get smaller, so nothing he gives costs him, and he has never noticed.', escape: 'Near him there is enough. For once nobody is counting.', reason: 'Generosity with no cost is a comfort and a problem. He is funny so a reader can enjoy him before asking what it would take to be him.' },
  bonewap: { want: 'A frame that holds.', limit: 'Will not say what it cannot show.', escape: 'Nothing near it is pretending.', reason: 'Between what could be and what it will cost, the book needed someone who asks only what remains. BoneWAP is exact so the other two can be excessive.' },
  porter: { want: 'The gate before the storm.', limit: 'One rule kept thirty years, and he has broken it once.', escape: 'For a carry you are the one who does not get moved.', reason: 'Book Two asks who gets let in. The porter answers with his shoulder before any record does.' },
  clerk: { want: 'Every slip filed by evening.', limit: 'Can write only what fits on the line.', escape: 'For a carry your nerves are your job, and they make you quick.', reason: 'Records are comedy and care here. The clerk is anxious so the paperwork can be tender.' },
  figure: { want: 'Nobody has said.', limit: 'Four lines, two dots, and a hat that will not land.', escape: 'For a carry nobody knows who you are, and your hands are very fine.', reason: 'Nobody in the book has said, and this card will not either.' },
  clown: { want: 'A pie in the face, done right.', limit: 'Cannot have a small feeling.', escape: 'For a carry everything lands bigger and nobody minds.', reason: 'The clown wants exactly what is about to happen to them, which turns slapstick into a gift. Nobody in the lanes is a victim.' },
  mime: { want: 'Quiet, where the pie words were.', limit: 'Cannot say so.', escape: 'Someone else has decided not to explain.', reason: 'A contest needs someone who cannot be argued with. The mimes take the words away so a reader feels what a chapter loses without them, and can carry them back.' }
});

/* What they remember of you: the lanes' deeds, said from their side. Counted, never set. Returns '' for someone you have not touched. */
const REMEMBERS = Object.freeze({
  boof: ['boof', 'Brushed past %n time%s. She has no opinion.'],
  boon: ['shared', '%n slice%s passed along. He has not noticed, and is delighted.'],
  bane: ['foiled', 'Foiled %n time%s. He has made a note of the switch.'],
  bonewap: ['boneberry', '%n boneberr%ies eaten, every one declared.'],
  clerk: ['knocked', 'The slips say %n knock%s, each with a line for the cause.'],
  clown: ['satisfied', '%n went home delighted.'],
  mime: ['over_mimes', '%n slice%s over their heads. They are very clear about it.'],
  ants: ['furrow', '%n warm furrow%s crossed, on streets they lit.']
});
export function remembers(id, deeds = {}) {
  const [key, says] = REMEMBERS[id] || [];
  if (!key) return '';
  const n = Math.round(Object.values(deeds).reduce((sum, d) => sum + (Number(d?.[key]) || 0), 0));
  if (n <= 0) return '';
  return says.replace(/%n/g, String(n)).replace(/%ies/g, n === 1 ? 'y' : 'ies').replace(/%s/g, n === 1 ? '' : 's');
}

export const MOODS = Object.freeze(['calm', 'glad', 'worried', 'surprised', 'thinking']);
const MOOD_MARKS = Object.freeze({
  calm: () => '',
  glad: () => `<path d="M80 20 l6 -6 M84 28 l8 -2 M74 15 l1 -8" stroke-width="2.4" stroke-linecap="round" ${s('accent')} fill="none"/>`,
  worried: () => `<path d="M83 14 q5 9 0 12 q-5 -3 0 -12Z" fill="#7fb4c0" stroke="#3c6f86" stroke-width="0.8"/><path d="M71 12 q3 -2 6 0 M88 32 q3 -2 6 0" stroke-width="1.6" ${s('c')} fill="none" opacity="0.7"/>`,
  surprised: () => `<path d="M84 8 v12" stroke-width="3.4" stroke-linecap="round" ${s('accent')}/><circle cx="84" cy="26" r="2" ${f('accent')}/>`,
  thinking: () => `<path d="M79 13 q0 -6 6 -6 q6 0 6 5 q0 4 -5 6 v3" stroke-width="2.4" stroke-linecap="round" ${s('accent')} fill="none"/><circle cx="86" cy="26" r="1.8" ${f('accent')}/>`
});

export const identitySpell = (id) => {
  const c = CHARACTERS[id];
  if (!c) return '';
  return `@${id}{ .type[character] ${c.first ? `.first[chapter_${c.first}]` : '.first[the_lanes]'} $${c.material} #name["${c.name.replace(/"/g, "'")}"] }`;
};

/* ─── The drawings: vector, 100 × 100, in the plain-line language of the game ─── */
const DRAW = Object.freeze({
  boof: (f) => `
    <path d="M28 62 Q22 40 38 30 Q50 22 62 30 Q74 38 72 56 Q70 70 56 74 L44 74 Q30 72 28 62Z" ${f('a')}/>
    <path d="M30 40 Q18 44 20 62 Q24 66 30 60Z" ${f('a')} opacity="0.9"/>
    <path d="M60 30 Q70 24 76 34 Q74 42 66 40Z" ${f('a')}/>
    <path d="M52 52 Q66 50 78 56 Q80 64 70 66 Q58 66 52 60Z" ${f('b')}/>
    <circle cx="78" cy="57" r="4" ${f('c')}/>
    <circle cx="56" cy="44" r="3" ${f('c')}/>
    <path d="M40 74 Q50 80 60 74" stroke-width="4" ${s('accent')} fill="none"/>
    <path d="M84 50 q4 -3 8 0 M84 44 q4 -3 8 0" stroke-width="1.6" ${s('c')} fill="none" opacity="0.6"/>`,
  ants: (f) => `
    <path d="M10 70 Q50 62 90 70" stroke-width="2" ${s('c')} fill="none" opacity="0.5"/>
    ${[22, 50, 78].map((x, i) => `
      <ellipse cx="${x - 6}" cy="${66 - i}" rx="5" ry="4" ${f('a')}/><ellipse cx="${x}" cy="${64 - i}" rx="4" ry="3.5" ${f('a')}/><circle cx="${x + 5}" cy="${62 - i}" r="3.2" ${f('a')}/>
      <path d="M${x - 8} ${69 - i} l-3 5 M${x - 2} ${67 - i} l0 6 M${x + 3} ${66 - i} l3 5" stroke-width="1.4" ${s('a')}/>
      <path d="M${x + 6} ${60 - i} l4 -14" stroke-width="1.6" ${s('c')}/>
      <path d="M${x + 10} ${46 - i} q-3 -6 0 -10 q3 4 0 10Z" ${f('b')}/>`).join('')}`,
  genie: (f) => `
    <path d="M50 84 Q34 80 40 66 Q30 56 38 44 Q42 30 50 28 Q58 30 62 44 Q70 56 60 66 Q66 80 50 84Z" ${f('b')} opacity="0.9"/>
    <path d="M36 30 Q50 16 64 30 Q58 34 50 34 Q42 34 36 30Z" ${f('a')}/>
    <circle cx="50" cy="20" r="3" ${f('accent')}/>
    <path d="M42 44 q3 2 6 0 M52 44 q3 2 6 0" stroke-width="1.8" ${s('c')} fill="none"/>
    <path d="M45 54 q5 2 10 0" stroke-width="1.6" ${s('c')} fill="none"/>
    <circle cx="70" cy="62" r="5" ${f('accent')}/><circle cx="70" cy="62" r="2" ${f('ground')}/>`,
  bane: (f) => `
    <ellipse cx="50" cy="66" rx="34" ry="8" ${f('c')} opacity="0.25"/>
    <path d="M18 58 Q20 34 50 30 Q80 34 82 58 Q66 66 50 66 Q34 66 18 58Z" ${f('a')}/>
    ${[[34, 44], [48, 38], [62, 44], [42, 54], [58, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" ${f('b')}/><circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.1" fill="#d8c4ea" opacity="0.7"/>`).join('')}
    <path d="M38 50 l6 3 M62 50 l-6 3" stroke-width="2" ${s('c')}/>
    <path d="M42 60 q8 -4 16 0" stroke-width="2" ${s('c')} fill="none"/>
    <path d="M50 30 q2 -8 8 -10" stroke-width="1.8" ${s('accent')} fill="none"/>
    <rect x="70" y="20" width="12" height="8" rx="2" ${f('c')}/><path d="M76 24 l4 -6" stroke-width="2" ${s('accent')}/>`,
  boon: (f) => `
    <ellipse cx="50" cy="70" rx="36" ry="7" ${f('c')} opacity="0.2"/>
    <path d="M16 60 Q18 34 50 28 Q82 34 84 60 Q68 68 50 68 Q32 68 16 60Z" ${f('a')}/>
    <path d="M20 58 Q34 52 50 54 Q66 52 80 58" stroke-width="4" ${s('b')} fill="none"/>
    ${[26, 36, 46, 56, 66, 76].map((x) => `<circle cx="${x}" cy="${34 + Math.abs(x - 50) * 0.18}" r="3" ${f('a')} stroke="#b9773a" stroke-width="1"/>`).join('')}
    <circle cx="40" cy="44" r="3" ${f('c')}/><circle cx="60" cy="44" r="3" ${f('c')}/>
    <path d="M40 50 q10 8 20 0" stroke-width="2.4" ${s('c')} fill="none"/>
    <path d="M44 22 q-4 -6 0 -10 M56 22 q4 -6 0 -10" stroke-width="1.6" ${s('accent')} fill="none" opacity="0.7"/>`,
  bonewap: (f) => `
    <ellipse cx="50" cy="70" rx="34" ry="7" ${f('c')} opacity="0.18"/>
    <path d="M18 60 Q20 34 50 30 Q80 34 82 60 Q66 68 50 68 Q34 68 18 60Z" ${f('a')} stroke-width="1.5" ${s('c')}/>
    <path d="M28 40 L72 60 M28 60 L72 40 M50 30 L50 68 M20 50 L80 50" stroke-width="1.6" ${s('b')} opacity="0.7"/>
    <circle cx="41" cy="45" r="2.6" ${f('c')}/><circle cx="59" cy="45" r="2.6" ${f('c')}/>
    <path d="M42 56 h16" stroke-width="2" ${s('c')}/>
    <path d="M78 22 l-12 14" stroke-width="3" ${s('c')}/><rect x="74" y="14" width="12" height="8" rx="3" ${f('b')}/>`,
  porter: (f) => `
    <rect x="34" y="40" width="32" height="36" rx="6" ${f('a')}/>
    <circle cx="50" cy="30" r="10" ${f('b')}/>
    <path d="M38 24 Q50 14 62 24 L64 26 L36 26Z" ${f('c')}/>
    <circle cx="46" cy="30" r="1.6" ${f('c')}/><circle cx="54" cy="30" r="1.6" ${f('c')}/>
    <rect x="58" y="52" width="22" height="16" rx="2" ${f('b')}/><path d="M58 60 h22 M69 52 v16" stroke-width="1.4" ${s('c')}/>`,
  clerk: (f) => `
    <rect x="40" y="40" width="20" height="38" rx="5" ${f('a')}/>
    <circle cx="50" cy="30" r="8" ${f('d')}/>
    <circle cx="47" cy="30" r="1.4" ${f('c')}/><circle cx="53" cy="30" r="1.4" ${f('c')}/>
    <rect x="58" y="34" width="22" height="28" rx="1.5" fill="#fffdf6" stroke-width="1" ${s('c')}/>
    <text x="69" y="43" font-size="5.5" font-family="ui-monospace, monospace" font-weight="700" text-anchor="middle" ${f('b')}>DAMAGE</text>
    <path d="M61 50 h16 M61 55 h12" stroke-width="1" ${s('c')} opacity="0.6"/>`,
  figure: (f) => `
    <path d="M36 18 Q50 12 64 18 Q66 22 64 24 L36 24 Q34 22 36 18Z" ${f('b')}/>
    <circle cx="50" cy="38" r="9" fill="none" stroke-width="2.4" ${s('a')}/>
    <circle cx="47" cy="38" r="1.3" ${f('a')}/><circle cx="53" cy="38" r="1.3" ${f('a')}/>
    <rect x="42" y="50" width="16" height="20" fill="none" stroke-width="2.4" ${s('a')}/>
    <path d="M42 54 l-8 10 M58 54 l8 10 M46 70 l-3 12 M54 70 l3 12" stroke-width="2.4" ${s('a')}/>`,
  clown: (f) => `
    <circle cx="50" cy="46" r="20" ${f('a')}/>
    <path d="M28 66 Q50 58 72 66 Q66 74 50 74 Q34 74 28 66Z" ${f('b')} opacity="0.85"/>
    <circle cx="50" cy="48" r="5" ${f('b')}/>
    <path d="M40 40 l4 -3 M60 40 l-4 -3" stroke-width="2" ${s('c')}/>
    <circle cx="42" cy="42" r="2" ${f('c')}/><circle cx="58" cy="42" r="2" ${f('c')}/>
    <path d="M40 55 q10 8 20 0" stroke-width="2.4" ${s('c')} fill="none"/>
    <circle cx="36" cy="26" r="5" ${f('b')}/><circle cx="64" cy="26" r="5" ${f('b')}/>`,
  mime: (f) => `
    <rect x="38" y="54" width="24" height="26" rx="4" ${f('a')}/>
    <path d="M38 60 h24 M38 66 h24 M38 72 h24" stroke-width="2.4" ${s('b')}/>
    <ellipse cx="50" cy="40" rx="11" ry="13" ${f('a')} stroke-width="1" ${s('c')}/>
    <path d="M45 37 v4 M55 37 v4" stroke-width="1.8" ${s('c')}/>
    <path d="M46 47 q4 2 8 0" stroke-width="1.6" ${s('b')} fill="none"/>
    <rect x="20" y="42" width="10" height="15" rx="4" ${f('a')} stroke-width="1" ${s('c')}/><rect x="70" y="42" width="10" height="15" rx="4" ${f('a')} stroke-width="1" ${s('c')}/>
    <path d="M30 50 h8 M62 50 h8" stroke-width="2" ${s('a')}/>`
});

/* Fill and stroke, either as CSS custom properties (in-page: a silhouette until met) or as plain colours. */
let mode = 'vars';
let palette = null;
const f = (key) => (mode === 'vars' ? `style="fill: var(--lp-${key})"` : `fill="${palette[key] || '#888'}"`);
const s = (key) => (mode === 'vars' ? `style="stroke: var(--lp-${key})"` : `stroke="${palette[key] || '#888'}"`);

/**
 * A character's portrait in its medallion. { size, met, standalone }: standalone writes plain colours
 * (a file that stands on its own, for prints and other sites); otherwise fills are tokens, and a
 * character not met is drawn as a silhouette.
 */
export function portraitSVG(id, { size = 96, met = true, standalone = false, mood = 'calm' } = {}) {
  const c = CHARACTERS[id];
  if (!c) return '';
  mode = standalone ? 'plain' : 'vars';
  palette = c.palette;
  const vars = !standalone && met ? Object.entries(c.palette).map(([k, v]) => `--lp-${k}: ${v}`).join('; ') : '';
  const label = met ? c.name : `Not met yet${c.first ? `: first in Chapter ${c.first}` : ''}`;
  const body = DRAW[id](f).replace(/\s+/g, ' ');
  const ring = standalone ? `stroke="${c.palette.accent}"` : 'style="stroke: var(--lp-accent)"';
  const ground = standalone ? `fill="${c.palette.ground}"` : 'style="fill: var(--lp-ground)"';
  return `<svg class="lore-portrait-svg${met ? '' : ' is-unmet'}" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label.replace(/"/g, '&quot;')}"${vars ? ` style="${vars}"` : ''} xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="lore-portrait-clip"><circle cx="50" cy="50" r="46"/></clipPath></defs><circle cx="50" cy="50" r="47" ${ground}/><g clip-path="url(#lore-portrait-clip)">${body}</g><circle cx="50" cy="50" r="47" fill="none" stroke-width="3" ${ring}/>${met && MOOD_MARKS[mood] ? MOOD_MARKS[mood]() : ''}${met ? '' : '<text x="50" y="58" text-anchor="middle" font-size="26" font-family="Georgia, serif" class="lore-portrait-q">?</text>'}</svg>`;
}

/** Every character as one portable sheet: name, identity spell, first chapter and the portrait itself. */
export function charactersSheet() {
  return Object.entries(CHARACTERS).map(([id, c]) => ({
    id, name: c.name, first: c.first, href: c.href, line: c.line, material: c.material, palette: c.palette, spell: identitySpell(id),
    traits: MODELS[id]?.traits || [], temperament: MODELS[id]?.temperament || '', knack: MODELS[id]?.knack || null,
    want: REASONS[id]?.want || '', limit: REASONS[id]?.limit || '', escape: REASONS[id]?.escape || '', reason: REASONS[id]?.reason || '',
    svg: portraitSVG(id, { standalone: true, size: 256 }),
    moods: Object.fromEntries(MOODS.map((mood) => [mood, portraitSVG(id, { standalone: true, size: 256, mood })]))
  }));
}

/* <lore-portrait kind="boof" size="72" always> — met or not is read from the reader's own deck. */
const turnedKinds = () => {
  try {
    const shelf = JSON.parse(window.localStorage.getItem('lore.cards.v1') || '{}');
    const pie = JSON.parse(window.localStorage.getItem('lore.pie.v1') || '{}');
    return new Set([...Object.keys(shelf), ...(pie.cards || [])]);
  } catch { return new Set(); }
};
export const hasMet = (id) => {
  const c = CHARACTERS[id];
  return Boolean(c) && turnedKinds().has(c.card);
};

if (typeof window !== 'undefined' && window.customElements && !window.customElements.get('lore-portrait')) {
  window.customElements.define('lore-portrait', class extends HTMLElement {
    connectedCallback() {
      const id = this.getAttribute('kind');
      const size = Number(this.getAttribute('size')) || 72;
      const met = this.hasAttribute('always') || hasMet(id);
      this.innerHTML = portraitSVG(id, { size, met, mood: this.getAttribute('mood') || 'calm' });
      this.classList.add('lore-portrait');
      this.classList.toggle('is-unmet', !met);
      if (!this.title) this.title = met ? CHARACTERS[id]?.name || '' : `Not met yet${CHARACTERS[id]?.first ? `: first in Chapter ${CHARACTERS[id].first}` : ''}`;
    }
  });
}
