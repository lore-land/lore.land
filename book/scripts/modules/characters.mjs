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

/* The weight each one carries. The book keeps asking who catches the weight of a granted thing (Chapter Five: ask the
 * world to swing around you, and somebody else catches the weight), so each character stands somewhere on it: what they
 * carry, how they hand it on (or why they cannot), and what in the book eases it. Every line rests on a passage, named in
 * `ground`, and none is a line for anyone to say. Shown folded, beside the reasons; the figure's stays unsaid. */
export const WEIGHT = Object.freeze({
  boof: { carries: 'The rounds: every fence line, every morning, nothing unaccounted for.', hands_on: 'Never all of it. She works for the land, and the land does the keeping.', eased: 'Her wish, when she knows it, is small: one warm furrow kept open for whatever arrives next without a receipt.', ground: 'Chapter 12, the logline; Chapter 14, a dog keeps mornings, not weeks' },
  ants: { carries: 'The light, street by street, all winter.', hands_on: 'Torch to torch: no ant holds a street alone, and a detour is a street nobody has lit yet.', eased: 'Lines that run straight on a day nobody else keeps.', ground: 'Chapter 14, the torch-lines running straight; Chapter 1, the ant hearths' },
  genie: { carries: 'The price of every granted thing, worked out to the coincidence.', hands_on: 'He paid for hers himself: everything he had left, and one Thursday.', eased: 'The week forgets his Thursday, but a dog keeps mornings, not weeks, and the field keeps everything.', ground: 'Chapter 5, the slate and the weight; Chapter 14, the opening' },
  bane: { carries: 'He offers to. He proposed the wish be sold to someone prepared to bear its responsibilities, and supplied his own name.', hands_on: 'Not willingly; it has to be foiled out of his hands, and he always leaves the switch.', eased: 'Splitting himself as an apology, and being received warm.', ground: 'Chapter 4, the council; Chapter 12, re-sweetened' },
  boon: { carries: 'Everyone’s supper, and he never feels it.', hands_on: 'In slices, to anyone, and he is never smaller for it.', eased: 'Nothing needs easing, which is his limit: giving is not subtraction if the filling is true, and he has never had to ask what it costs anyone else.', ground: 'Chapter 6; Chapter 12, receiving BaneWAP' },
  bonewap: { carries: 'Only what the frame will bear, declared.', hands_on: 'Posts the receipt, so the weight is written where everyone can see it.', eased: 'A beam that answers when tapped.', ground: 'Chapter 10, set the wish on the frame; Chapter 12, both receipts' },
  porter: { carries: 'A gate hung for three porters and kept by one.', hands_on: 'Into the wall: the storm-weight, an iron counterweight, does what two more porters would.', eased: 'Holding it for a stranger, and signing for the spoiled flour in his own name.', ground: 'Chapter 15, the parcel gate' },
  clerk: { carries: 'Every slip, filed by evening.', hands_on: 'A line for the cause: the slip carries the knock so nobody has to remember it.', eased: 'A word at the top, and the line filled.', ground: 'Chapter 15, the DAMAGE slips' },
  figure: { carries: 'Nobody has said.', hands_on: 'Nobody has said.', eased: 'Nobody has said.', ground: 'Chapters 14 and 15' },
  clown: { carries: 'A feeling bigger than the moment.', hands_on: 'Straight back, as delight: a pie in the face, done right, is a kindness.', eased: 'Nobody minds how big it lands.', ground: 'The lanes' },
  mime: { carries: 'The words a chapter loses.', hands_on: 'Only to someone who carries them back.', eased: 'A slice over their heads, very clearly.', ground: 'The lanes' }
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

/* A mood is worn on the face, not only beside the head: `mien` picks this character's drawing of it, and falls back to
 * their calm one. The figure in plain lines has no mien: two dots stay two dots. */
let currentMood = 'calm';
const mien = (faces) => faces[currentMood] ?? faces.calm;

/* ─── The drawings: vector, 100 × 100, in the plain-line language of the game ─── */
const DRAW = Object.freeze({
  boof: (f) => `
    <path d="M28 62 Q22 40 38 30 Q50 22 62 30 Q74 38 72 56 Q70 70 56 74 L44 74 Q30 72 28 62Z" ${f('a')}/>
    <path d="M30 40 Q18 44 20 62 Q24 66 30 60Z" ${f('a')} opacity="0.9"/>
    <path d="M60 30 Q70 24 76 34 Q74 42 66 40Z" ${f('a')}/>
    <path d="M52 52 Q66 50 78 56 Q80 64 70 66 Q58 66 52 60Z" ${f('b')}/>
    <circle cx="78" cy="57" r="4" ${f('c')}/>
    ${mien({ calm: `<circle cx="56" cy="44" r="3" ${f('c')}/>`, glad: `<path d="M52 45 q4 -5 8 0" stroke-width="2.4" ${s('c')} fill="none" stroke-linecap="round"/>`, worried: `<circle cx="56" cy="45" r="3" ${f('c')}/><path d="M51 38 l9 -3" stroke-width="1.8" ${s('c')} stroke-linecap="round"/>`, surprised: `<circle cx="56" cy="44" r="4.2" ${f('c')}/><circle cx="54.8" cy="42.8" r="1.2" ${f('ground')}/>`, thinking: `<circle cx="57.5" cy="42.5" r="3" ${f('c')}/><path d="M52 37 q5 -2 9 1" stroke-width="1.6" ${s('c')} fill="none"/>` })}
    <path d="M36 50 q-3 8 0 15 M42 40 q-4 2 -6 6" stroke-width="1" ${s('c')} fill="none" opacity="0.35"/>
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
    <path d="M40 62 q10 6 20 0 M43 72 q7 4 14 0" stroke-width="0.9" ${s('a')} fill="none" opacity="0.45"/>
    ${mien({ calm: `<path d="M42 44 q3 2 6 0 M52 44 q3 2 6 0" stroke-width="1.8" ${s('c')} fill="none"/><path d="M45 54 q5 2 10 0" stroke-width="1.6" ${s('c')} fill="none"/>`, glad: `<path d="M42 45 q3 -3 6 0 M52 45 q3 -3 6 0" stroke-width="1.8" ${s('c')} fill="none"/><path d="M44 53 q6 5 12 0" stroke-width="1.6" ${s('c')} fill="none"/>`, worried: `<path d="M42 42 l6 2 M58 42 l-6 2" stroke-width="1.8" ${s('c')}/><path d="M45 56 q5 -3 10 0" stroke-width="1.6" ${s('c')} fill="none"/>`, surprised: `<circle cx="45" cy="44" r="2" ${f('c')}/><circle cx="55" cy="44" r="2" ${f('c')}/><circle cx="50" cy="55" r="2.6" fill="none" stroke-width="1.6" ${s('c')}/>`, thinking: `<path d="M42 44 h6 M52 43 q3 -2 6 0" stroke-width="1.8" ${s('c')} fill="none"/><path d="M46 55 h8" stroke-width="1.6" ${s('c')}/>` })}
    <circle cx="70" cy="62" r="5" ${f('accent')}/><circle cx="70" cy="62" r="2" ${f('ground')}/>`,
  bane: (f) => `
    <ellipse cx="50" cy="66" rx="34" ry="8" ${f('c')} opacity="0.25"/>
    <path d="M18 58 Q20 34 50 30 Q80 34 82 58 Q66 66 50 66 Q34 66 18 58Z" ${f('a')}/>
    ${[[34, 44], [48, 38], [62, 44], [42, 54], [58, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" ${f('b')}/><circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.1" fill="#d8c4ea" opacity="0.7"/>`).join('')}
    ${mien({ calm: `<path d="M38 50 l6 3 M62 50 l-6 3" stroke-width="2" ${s('c')}/><path d="M42 60 q8 -4 16 0" stroke-width="2" ${s('c')} fill="none"/>`, glad: `<path d="M38 52 l6 2 M62 52 l-6 2" stroke-width="2" ${s('c')}/><path d="M40 58 q10 8 20 0" stroke-width="2" ${s('c')} fill="none"/>`, worried: `<path d="M38 53 l6 -3 M62 53 l-6 -3" stroke-width="2" ${s('c')}/><path d="M43 61 q7 -5 14 0" stroke-width="2" ${s('c')} fill="none"/>`, surprised: `<path d="M38 47 l6 1 M62 47 l-6 1" stroke-width="2" ${s('c')}/><ellipse cx="50" cy="60" rx="3.4" ry="4" ${f('c')}/>`, thinking: `<path d="M38 50 l6 3 M62 47 l-6 1" stroke-width="2" ${s('c')}/><path d="M43 60 h14" stroke-width="2" ${s('c')}/>` })}
    <path d="M50 30 q2 -8 8 -10" stroke-width="1.8" ${s('accent')} fill="none"/>
    <rect x="70" y="20" width="12" height="8" rx="2" ${f('c')}/><path d="M76 24 l4 -6" stroke-width="2" ${s('accent')}/>`,
  boon: (f) => `
    <ellipse cx="50" cy="70" rx="36" ry="7" ${f('c')} opacity="0.2"/>
    <path d="M16 60 Q18 34 50 28 Q82 34 84 60 Q68 68 50 68 Q32 68 16 60Z" ${f('a')}/>
    <path d="M20 58 Q34 52 50 54 Q66 52 80 58" stroke-width="4" ${s('b')} fill="none"/>
    ${[26, 36, 46, 56, 66, 76].map((x) => `<circle cx="${x}" cy="${34 + Math.abs(x - 50) * 0.18}" r="3" ${f('a')} stroke="#b9773a" stroke-width="1"/>`).join('')}
    ${mien({ calm: `<circle cx="40" cy="44" r="3" ${f('c')}/><circle cx="60" cy="44" r="3" ${f('c')}/><path d="M40 50 q10 8 20 0" stroke-width="2.4" ${s('c')} fill="none"/>`, glad: `<path d="M36 45 q4 -5 8 0 M56 45 q4 -5 8 0" stroke-width="2.4" ${s('c')} fill="none"/><path d="M38 49 q12 12 24 0Z" ${f('c')}/>`, worried: `<circle cx="40" cy="45" r="3" ${f('c')}/><circle cx="60" cy="45" r="3" ${f('c')}/><path d="M35 39 l7 -2 M65 39 l-7 -2" stroke-width="1.8" ${s('c')}/><path d="M42 53 q8 -4 16 0" stroke-width="2.4" ${s('c')} fill="none"/>`, surprised: `<circle cx="40" cy="44" r="3.8" ${f('c')}/><circle cx="60" cy="44" r="3.8" ${f('c')}/><ellipse cx="50" cy="53" rx="4" ry="4.6" ${f('c')}/>`, thinking: `<circle cx="41" cy="43" r="3" ${f('c')}/><circle cx="61" cy="43" r="3" ${f('c')}/><path d="M43 52 q7 2 14 -1" stroke-width="2.4" ${s('c')} fill="none"/>` })}
    <path d="M44 22 q-4 -6 0 -10 M56 22 q4 -6 0 -10" stroke-width="1.6" ${s('accent')} fill="none" opacity="0.7"/>`,
  bonewap: (f) => `
    <ellipse cx="50" cy="70" rx="34" ry="7" ${f('c')} opacity="0.18"/>
    <path d="M18 60 Q20 34 50 30 Q80 34 82 60 Q66 68 50 68 Q34 68 18 60Z" ${f('a')} stroke-width="1.5" ${s('c')}/>
    <path d="M28 40 L72 60 M28 60 L72 40 M50 30 L50 68 M20 50 L80 50" stroke-width="1.6" ${s('b')} opacity="0.7"/>
    ${mien({ calm: `<circle cx="41" cy="45" r="2.6" ${f('c')}/><circle cx="59" cy="45" r="2.6" ${f('c')}/><path d="M42 56 h16" stroke-width="2" ${s('c')}/>`, glad: `<circle cx="41" cy="45" r="2.6" ${f('c')}/><circle cx="59" cy="45" r="2.6" ${f('c')}/><path d="M42 55 h16 l-2 3" stroke-width="2" ${s('c')} fill="none"/>`, worried: `<circle cx="41" cy="46" r="2.6" ${f('c')}/><circle cx="59" cy="46" r="2.6" ${f('c')}/><path d="M42 57 l8 -2 l8 2" stroke-width="2" ${s('c')} fill="none"/>`, surprised: `<circle cx="41" cy="45" r="3.4" fill="none" stroke-width="1.8" ${s('c')}/><circle cx="59" cy="45" r="3.4" fill="none" stroke-width="1.8" ${s('c')}/><path d="M47 56 h6" stroke-width="2" ${s('c')}/>`, thinking: `<path d="M38 45 h6" stroke-width="2.4" ${s('c')}/><circle cx="59" cy="45" r="2.6" ${f('c')}/><path d="M42 56 h16" stroke-width="2" ${s('c')}/>` })}
    <path d="M78 22 l-12 14" stroke-width="3" ${s('c')}/><rect x="74" y="14" width="12" height="8" rx="3" ${f('b')}/>`,
  porter: (f) => `
    <rect x="34" y="40" width="32" height="36" rx="6" ${f('a')}/>
    <circle cx="50" cy="30" r="10" ${f('b')}/>
    <path d="M38 24 Q50 14 62 24 L64 26 L36 26Z" ${f('c')}/>
    ${mien({ calm: `<circle cx="46" cy="30" r="1.6" ${f('c')}/><circle cx="54" cy="30" r="1.6" ${f('c')}/>`, glad: `<path d="M44 30 q2 -2 4 0 M52 30 q2 -2 4 0" stroke-width="1.3" ${s('c')} fill="none"/><path d="M46 35 q4 2.5 8 0" stroke-width="1.2" ${s('c')} fill="none"/>`, worried: `<circle cx="46" cy="31" r="1.6" ${f('c')}/><circle cx="54" cy="31" r="1.6" ${f('c')}/><path d="M46 36 q4 -2 8 0" stroke-width="1.2" ${s('c')} fill="none"/>`, surprised: `<circle cx="46" cy="30" r="2.2" ${f('c')}/><circle cx="54" cy="30" r="2.2" ${f('c')}/><circle cx="50" cy="36" r="1.5" ${f('c')}/>`, thinking: `<path d="M44 30 h4" stroke-width="1.6" ${s('c')}/><circle cx="54" cy="30" r="1.6" ${f('c')}/>` })}
    <path d="M40 46 v26 M60 46 v26" stroke-width="1" ${s('c')} opacity="0.3"/>
    <rect x="58" y="52" width="22" height="16" rx="2" ${f('b')}/><path d="M58 60 h22 M69 52 v16" stroke-width="1.4" ${s('c')}/>`,
  clerk: (f) => `
    <rect x="40" y="40" width="20" height="38" rx="5" ${f('a')}/>
    <circle cx="50" cy="30" r="8" ${f('d')}/>
    ${mien({ calm: `<circle cx="47" cy="30" r="1.4" ${f('c')}/><circle cx="53" cy="30" r="1.4" ${f('c')}/>`, glad: `<circle cx="47" cy="30" r="1.4" ${f('c')}/><circle cx="53" cy="30" r="1.4" ${f('c')}/><path d="M47 34 q3 2 6 0" stroke-width="1" ${s('c')} fill="none"/>`, worried: `<circle cx="47" cy="30" r="1.4" ${f('c')}/><circle cx="53" cy="30" r="1.4" ${f('c')}/><path d="M44 26 l4 -1.4 M56 26 l-4 -1.4" stroke-width="1.1" ${s('c')}/><path d="M47.5 35 q2.5 -2 5 0" stroke-width="1" ${s('c')} fill="none"/>`, surprised: `<circle cx="47" cy="30" r="2" ${f('c')}/><circle cx="53" cy="30" r="2" ${f('c')}/><circle cx="50" cy="35" r="1.2" ${f('c')}/>`, thinking: `<circle cx="48" cy="29" r="1.4" ${f('c')}/><circle cx="54" cy="29" r="1.4" ${f('c')}/><path d="M47.5 34.4 h5" stroke-width="1" ${s('c')}/>` })}
    <path d="M45 40 l5 7 l5 -7" stroke-width="1" ${s('b')} fill="none" opacity="0.7"/>
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
    ${mien({ calm: `<path d="M40 40 l4 -3 M60 40 l-4 -3" stroke-width="2" ${s('c')}/><circle cx="42" cy="42" r="2" ${f('c')}/><circle cx="58" cy="42" r="2" ${f('c')}/><path d="M40 55 q10 8 20 0" stroke-width="2.4" ${s('c')} fill="none"/>`, glad: `<path d="M38 42 q4 -5 8 0 M54 42 q4 -5 8 0" stroke-width="2.2" ${s('c')} fill="none"/><path d="M36 53 q14 16 28 0Z" ${f('b')} stroke-width="1.4" ${s('c')}/>`, worried: `<path d="M38 38 l5 3 M62 38 l-5 3" stroke-width="2" ${s('c')}/><circle cx="42" cy="43" r="2" ${f('c')}/><circle cx="58" cy="43" r="2" ${f('c')}/><path d="M42 59 q8 -6 16 0" stroke-width="2.4" ${s('c')} fill="none"/>`, surprised: `<path d="M38 36 l5 1 M62 36 l-5 1" stroke-width="2" ${s('c')}/><circle cx="42" cy="42" r="3.2" ${f('c')}/><circle cx="58" cy="42" r="3.2" ${f('c')}/><ellipse cx="50" cy="59" rx="4.4" ry="5" ${f('c')}/>`, thinking: `<path d="M40 40 l4 -1 M60 37 l-4 2" stroke-width="2" ${s('c')}/><circle cx="43" cy="41" r="2" ${f('c')}/><circle cx="59" cy="41" r="2" ${f('c')}/><path d="M43 57 q8 2 14 -1" stroke-width="2.4" ${s('c')} fill="none"/>` })}
    <circle cx="36" cy="26" r="5" ${f('b')}/><circle cx="64" cy="26" r="5" ${f('b')}/>`,
  mime: (f) => `
    <rect x="38" y="54" width="24" height="26" rx="4" ${f('a')}/>
    <path d="M38 60 h24 M38 66 h24 M38 72 h24" stroke-width="2.4" ${s('b')}/>
    <ellipse cx="50" cy="40" rx="11" ry="13" ${f('a')} stroke-width="1" ${s('c')}/>
    ${mien({ calm: `<path d="M45 37 v4 M55 37 v4" stroke-width="1.8" ${s('c')}/><path d="M46 47 q4 2 8 0" stroke-width="1.6" ${s('b')} fill="none"/>`, glad: `<path d="M43 39 q2 -3 4 0 M53 39 q2 -3 4 0" stroke-width="1.6" ${s('c')} fill="none"/><path d="M45 46 q5 4 10 0" stroke-width="1.6" ${s('b')} fill="none"/>`, worried: `<path d="M45 37 v4 M55 37 v4 M42 34 l5 -1.6 M58 34 l-5 -1.6" stroke-width="1.6" ${s('c')}/><path d="M46 48 q4 -3 8 0" stroke-width="1.6" ${s('b')} fill="none"/>`, surprised: `<path d="M45 35 v6 M55 35 v6" stroke-width="2" ${s('c')}/><circle cx="50" cy="47.5" r="2.4" fill="none" stroke-width="1.6" ${s('b')}/>`, thinking: `<path d="M45 39 h3 M55 37 v4" stroke-width="1.8" ${s('c')}/><path d="M46 47 h8" stroke-width="1.6" ${s('b')}/>` })}
    <rect x="20" y="42" width="10" height="15" rx="4" ${f('a')} stroke-width="1" ${s('c')}/><rect x="70" y="42" width="10" height="15" rx="4" ${f('a')} stroke-width="1" ${s('c')}/>
    <path d="M30 50 h8 M62 50 h8" stroke-width="2" ${s('a')}/>`
});

/* Fill and stroke, either as CSS custom properties (in-page: a silhouette until met) or as plain colours. */
let mode = 'vars';
let palette = null;
let portraitCount = 0;
const f = (key) => (mode === 'vars' ? `style="fill: var(--lp-${key})"` : `fill="${palette[key] || '#888'}"`);
const s = (key) => (mode === 'vars' ? `style="stroke: var(--lp-${key})"` : `stroke="${palette[key] || '#888'}"`);

/* What stands behind every sitter: a disc over a stepped horizon, the way the maker's panels are put together. */
const backdrop = () => `<circle cx="72" cy="30" r="17" ${f('accent')} opacity="0.16"/><path d="M0 84 h16 v-6 h14 v-5 h13 v5 h15 v6 h13 v-8 h12 v5 h17 V100 H0Z" ${f('c')} opacity="0.11"/>`;

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
  currentMood = mood;
  // A standalone file is the same every time it is written; in a page, each portrait needs an id of its own.
  const clip = standalone ? `lore-portrait-clip-${id}` : `lore-portrait-clip-${id}-${(portraitCount += 1).toString(36)}`;
  const vars = !standalone && met ? Object.entries(c.palette).map(([k, v]) => `--lp-${k}: ${v}`).join('; ') : '';
  const label = met ? c.name : `Not met yet${c.first ? `: first in Chapter ${c.first}` : ''}`;
  const body = DRAW[id](f).replace(/\s+/g, ' ');
  const ring = standalone ? `stroke="${c.palette.accent}"` : 'style="stroke: var(--lp-accent)"';
  const ground = standalone ? `fill="${c.palette.ground}"` : 'style="fill: var(--lp-ground)"';
  return `<svg class="lore-portrait-svg${met ? '' : ' is-unmet'}" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label.replace(/"/g, '&quot;')}"${vars ? ` style="${vars}"` : ''} xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${clip}"><circle cx="50" cy="50" r="46"/></clipPath></defs><circle cx="50" cy="50" r="47" ${ground}/><g clip-path="url(#${clip})">${backdrop()}${body}</g><circle cx="50" cy="50" r="47" fill="none" stroke-width="3" ${ring}/>${met && MOOD_MARKS[mood] ? MOOD_MARKS[mood]() : ''}${met ? '' : '<text x="50" y="58" text-anchor="middle" font-size="26" font-family="Georgia, serif" class="lore-portrait-q">?</text>'}</svg>`;
}

/* ─── Standing figures: the whole of someone, feet on the ground at y = 100, for a panel (panel-art.mjs). Plain colours.
 * A pie stands as a pie does, on its plate. The figure is one circle, one rectangle, four lines and two dots, at any scale. ─── */
const STAND = Object.freeze({
  boof: (p) => `<ellipse cx="50" cy="97" rx="36" ry="3" fill="#000" opacity="0.25"/><path d="M18 56 Q8 44 12 32" stroke="${p.a}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M26 70 v26 M36 72 v24 M60 72 v24 M68 70 v26" stroke="${p.a}" stroke-width="6" stroke-linecap="round"/><path d="M18 58 Q22 44 44 46 Q64 44 72 54 Q78 66 66 74 L28 74 Q16 70 18 58Z" fill="${p.a}"/><path d="M28 72 Q46 78 66 72" stroke="${p.c}" stroke-width="1.2" fill="none" opacity="0.35"/><path d="M66 54 Q80 54 86 70 L94 78 Q96 86 88 85 L76 83 Q66 78 64 66Z" fill="${p.a}"/><path d="M80 72 L94 78 Q96 86 88 85 L78 83Z" fill="${p.b}"/><path d="M71 54 Q61 60 64 74 Q73 73 76 62Z" fill="${p.c}" opacity="0.75"/><circle cx="91" cy="81" r="2.8" fill="${p.c}"/><circle cx="80" cy="66" r="1.6" fill="${p.c}"/><path d="M63 54 Q66 66 62 76" stroke="${p.accent}" stroke-width="3" fill="none"/>`,
  ants: (p) => `<path d="M6 94 Q50 88 94 94" stroke="${p.c}" stroke-width="1.5" fill="none" opacity="0.6"/>${[24, 52, 80].map((x, i) => `<ellipse cx="${x - 7}" cy="${90 - i}" rx="6" ry="4.5" fill="${p.a}"/><ellipse cx="${x}" cy="${88 - i}" rx="4.5" ry="4" fill="${p.a}"/><circle cx="${x + 6}" cy="${86 - i}" r="3.6" fill="${p.a}"/><path d="M${x - 9} ${93 - i} l-3 5 M${x - 2} ${91 - i} v6 M${x + 3} ${90 - i} l3 6" stroke="${p.a}" stroke-width="1.4"/><path d="M${x + 7} ${84 - i} l5 -16" stroke="${p.c}" stroke-width="1.7"/><path d="M${x + 12} ${68 - i} q-4 -7 0 -12 q4 5 0 12Z" fill="${p.b}"/>`).join('')}`,
  genie: (p) => `<ellipse cx="50" cy="97" rx="18" ry="3" fill="#000" opacity="0.22"/><path d="M50 98 Q30 92 38 76 Q24 60 36 42 Q40 26 50 24 Q60 26 64 42 Q76 60 62 76 Q70 92 50 98Z" fill="${p.b}" opacity="0.92"/><path d="M36 26 Q50 10 64 26 Q58 30 50 30 Q42 30 36 26Z" fill="${p.a}"/><circle cx="50" cy="14" r="3" fill="${p.accent}"/><path d="M42 40 q3 2 6 0 M52 40 q3 2 6 0" stroke="${p.c}" stroke-width="1.8" fill="none"/><path d="M45 50 q5 2 10 0" stroke="${p.c}" stroke-width="1.6" fill="none"/><path d="M38 60 q12 8 24 0 M42 78 q8 5 16 0" stroke="${p.a}" stroke-width="1" fill="none" opacity="0.5"/><circle cx="74" cy="60" r="6" fill="${p.accent}"/><circle cx="74" cy="60" r="2.4" fill="${p.ground}"/>`,
  bane: (p) => `<ellipse cx="50" cy="94" rx="40" ry="5" fill="${p.c}" opacity="0.55"/><path d="M14 86 Q16 54 50 50 Q84 54 86 86 Q68 94 50 94 Q32 94 14 86Z" fill="${p.a}"/>${[[32, 66], [48, 60], [64, 66], [40, 78], [60, 78]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${p.b}"/>`).join('')}<path d="M38 72 l6 3 M62 72 l-6 3" stroke="${p.c}" stroke-width="2"/><path d="M42 84 q8 -4 16 0" stroke="${p.c}" stroke-width="2" fill="none"/><path d="M50 50 q2 -10 9 -12" stroke="${p.accent}" stroke-width="1.8" fill="none"/><rect x="72" y="36" width="13" height="9" rx="2" fill="${p.c}"/><path d="M78 41 l4 -7" stroke="${p.accent}" stroke-width="2"/>`,
  boon: (p) => `<ellipse cx="50" cy="94" rx="44" ry="6" fill="${p.c}" opacity="0.4"/><path d="M10 84 Q12 48 50 42 Q88 48 90 84 Q70 94 50 94 Q30 94 10 84Z" fill="${p.a}"/><path d="M16 80 Q32 72 50 74 Q68 72 84 80" stroke="${p.b}" stroke-width="5" fill="none"/>${[20, 32, 44, 56, 68, 80].map((x) => `<circle cx="${x}" cy="${50 + Math.abs(x - 50) * 0.22}" r="3.4" fill="${p.a}" stroke="#b9773a" stroke-width="1"/>`).join('')}<circle cx="38" cy="62" r="3.2" fill="${p.c}"/><circle cx="62" cy="62" r="3.2" fill="${p.c}"/><path d="M38 69 q12 9 24 0" stroke="${p.c}" stroke-width="2.4" fill="none"/><path d="M42 36 q-4 -7 0 -12 M58 36 q4 -7 0 -12" stroke="${p.accent}" stroke-width="1.8" fill="none" opacity="0.8"/>`,
  bonewap: (p) => `<ellipse cx="50" cy="94" rx="38" ry="5" fill="${p.c}" opacity="0.4"/><path d="M14 86 Q16 54 50 50 Q84 54 86 86 Q68 94 50 94 Q32 94 14 86Z" fill="${p.a}" stroke="${p.c}" stroke-width="1.5"/><path d="M26 62 L74 84 M26 84 L74 62 M50 50 L50 94 M16 74 L84 74" stroke="${p.b}" stroke-width="1.6" opacity="0.7"/><circle cx="40" cy="68" r="2.8" fill="${p.c}"/><circle cx="60" cy="68" r="2.8" fill="${p.c}"/><path d="M42 80 h16" stroke="${p.c}" stroke-width="2"/><path d="M82 40 l-12 16" stroke="${p.c}" stroke-width="3"/><rect x="78" y="31" width="13" height="9" rx="3" fill="${p.b}"/>`,
  porter: (p) => `<ellipse cx="50" cy="97" rx="24" ry="3" fill="#000" opacity="0.25"/><path d="M40 72 v24 M60 72 v24" stroke="${p.c}" stroke-width="8" stroke-linecap="round"/><rect x="30" y="32" width="40" height="44" rx="7" fill="${p.a}"/><path d="M38 36 v36 M62 36 v36" stroke="${p.c}" stroke-width="1" opacity="0.35"/><circle cx="50" cy="20" r="11" fill="${p.b}"/><path d="M37 14 Q50 3 63 14 L66 17 L34 17Z" fill="${p.c}"/><circle cx="46" cy="21" r="1.7" fill="${p.c}"/><circle cx="54" cy="21" r="1.7" fill="${p.c}"/><rect x="60" y="46" width="26" height="20" rx="2" fill="${p.b}"/><path d="M60 56 h26 M73 46 v20" stroke="${p.c}" stroke-width="1.5"/>`,
  clerk: (p) => `<ellipse cx="50" cy="97" rx="14" ry="2.6" fill="#000" opacity="0.25"/><path d="M45 74 v22 M55 74 v22" stroke="${p.c}" stroke-width="4" stroke-linecap="round"/><rect x="40" y="34" width="20" height="44" rx="5" fill="${p.a}"/><circle cx="50" cy="23" r="9" fill="${p.d}"/><circle cx="47" cy="23" r="1.5" fill="${p.c}"/><circle cx="53" cy="23" r="1.5" fill="${p.c}"/><path d="M45 36 l5 7 l5 -7" stroke="${p.b}" stroke-width="1" fill="none"/><rect x="60" y="30" width="24" height="32" rx="1.5" fill="#fffdf6" stroke="${p.c}" stroke-width="1"/><path d="M63 38 h18" stroke="${p.b}" stroke-width="2.4"/><path d="M63 46 h18 M63 52 h13" stroke="${p.c}" stroke-width="1" opacity="0.6"/>`,
  figure: (p) => `<circle cx="50" cy="34" r="11" fill="none" stroke="${p.a}" stroke-width="2.6"/><circle cx="46" cy="34" r="1.5" fill="${p.a}"/><circle cx="54" cy="34" r="1.5" fill="${p.a}"/><rect x="41" y="48" width="18" height="26" fill="none" stroke="${p.a}" stroke-width="2.6"/><path d="M41 52 l-10 14 M59 52 l10 14 M45 74 l-4 22 M55 74 l4 22" stroke="${p.a}" stroke-width="2.6"/><path d="M36 11 Q50 4 64 11 Q66 15 64 17 L36 17 Q34 15 36 11Z" fill="${p.b}"/>`,
  clown: (p) => `<ellipse cx="50" cy="97" rx="26" ry="3" fill="#000" opacity="0.25"/><path d="M42 76 L38 94 M58 76 L62 94" stroke="${p.b}" stroke-width="7"/><ellipse cx="33" cy="95" rx="11" ry="4" fill="${p.c}"/><ellipse cx="67" cy="95" rx="11" ry="4" fill="${p.c}"/><path d="M32 46 Q50 38 68 46 L64 80 Q50 84 36 80Z" fill="${p.b}"/><circle cx="44" cy="58" r="2.4" fill="${p.a}"/><circle cx="56" cy="66" r="2.4" fill="${p.a}"/><circle cx="50" cy="26" r="15" fill="${p.a}"/><circle cx="50" cy="28" r="4" fill="${p.b}"/><circle cx="44" cy="23" r="1.8" fill="${p.c}"/><circle cx="56" cy="23" r="1.8" fill="${p.c}"/><path d="M42 34 q8 6 16 0" stroke="${p.c}" stroke-width="2" fill="none"/><circle cx="35" cy="14" r="5" fill="${p.b}"/><circle cx="65" cy="14" r="5" fill="${p.b}"/>`,
  mime: (p) => `<ellipse cx="46" cy="97" rx="16" ry="2.6" fill="#000" opacity="0.25"/><path d="M42 72 v24 M52 72 v24" stroke="${p.c}" stroke-width="5" stroke-linecap="round"/><rect x="36" y="38" width="22" height="36" rx="4" fill="${p.a}"/><path d="M36 46 h22 M36 54 h22 M36 62 h22" stroke="${p.b}" stroke-width="2.4"/><ellipse cx="47" cy="25" rx="10" ry="12" fill="${p.a}" stroke="${p.c}" stroke-width="1"/><path d="M43 22 v4 M51 22 v4" stroke="${p.c}" stroke-width="1.8"/><path d="M44 31 q3 2 6 0" stroke="${p.b}" stroke-width="1.5" fill="none"/><path d="M58 44 L74 40 M58 54 L74 56" stroke="${p.a}" stroke-width="4" stroke-linecap="round"/><rect x="74" y="32" width="8" height="14" rx="3" fill="${p.a}" stroke="${p.c}" stroke-width="1"/><rect x="74" y="50" width="8" height="14" rx="3" fill="${p.a}" stroke="${p.c}" stroke-width="1"/><path d="M84 24 V74" stroke="${p.a}" stroke-width="0.8" stroke-dasharray="2 4" opacity="0.7"/>`
});
/** Someone's whole figure as an SVG group in a 100 × 100 box, feet at the foot of it, to set inside a larger drawing. */
export const figureGroup = (id) => (STAND[id] && CHARACTERS[id] ? STAND[id](CHARACTERS[id].palette) : '');

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
