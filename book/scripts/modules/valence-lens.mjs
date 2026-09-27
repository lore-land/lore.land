/**
 * valence-lens.mjs — read a chapter as boon, bane or bone.
 *
 * The three lands' questions (story-boonhonk.spw#three_lands) become a
 * reading lens. Every paragraph leans somewhere; the lens brings one lean
 * forward and lets the others step back.
 *
 *   boon  the fairytale: wonder, and the living alchemy of the land
 *   bane  the reality it is leaving: the mundane, the absurd, the hard
 *   bone  what can be wondered about the same way twice: structure, count,
 *         line — the notation underneath (Spw as a low magic)
 *
 * A paragraph's lean is authored (`"lean": "bane"` on the paragraph — Spw's
 * `=`, the lean) or read from its vocabulary. No DOM, no imports: the build
 * and the browser share it, and any sibling land can load it.
 */

export const LENSES = Object.freeze([
  { id: 'boon', label: 'Boon', question: 'What could this become?', gloss: 'The fairytale: wonder, and the living alchemy of the land.' },
  { id: 'bane', label: 'Bane', question: 'What will this cost?', gloss: 'The reality being left behind: the mundane, the absurd, the hard.' },
  { id: 'bone', label: 'Bone', question: 'What will remain?', gloss: 'What you can wonder about the same way twice: the notation underneath.' }
]);

const VOCABULARY = Object.freeze({
  boon: [
    'berry', 'berries', 'boonberry', 'boonberries', 'blueberry', 'blueberries', 'bloom', 'bloomed', 'blossom',
    'glow', 'glowed', 'glowing', 'gold', 'golden', 'light', 'lantern', 'lanterns', 'ember', 'embers', 'warm',
    'warmth', 'hum', 'hummed', 'humming', 'grove', 'echo', 'echoes', 'root', 'roots', 'seed', 'seeds', 'ant',
    'ants', 'hearth', 'hearths', 'honey', 'orchard', 'garden', 'spring', 'dawn', 'star', 'stars', 'wish',
    'wishes', 'wonder', 'song', 'sang', 'sing', 'shimmer', 'moss', 'dew', 'magic', 'alive', 'sweet', 'pie',
    'bread', 'remembered', 'remember', 'sun', 'sunlight', 'leaf', 'leaves', 'green', 'bees', 'nectar', 'jazz'
  ],
  bane: [
    'claim', 'claims', 'price', 'priced', 'cost', 'costs', 'debt', 'debts', 'paperwork', 'sealed', 'envelope',
    'crust', 'sour', 'bitter', 'auction', 'auctioned', 'asset', 'bank', 'banker', 'coin', 'coins', 'wage',
    'wages', 'paid', 'pay', 'paying', 'owe', 'owed', 'interest', 'invoice', 'receipt', 'receipts', 'rent',
    'rented', 'throne', 'crown', 'empire', 'greed', 'greedy', 'cuff', 'cuffs', 'contract', 'clerk', 'clerks',
    'council', 'tax', 'bargain', 'stamp', 'stamps', 'banewap', 'hoard', 'hoarded', 'locked', 'gate', 'queue',
    'rule', 'ruled', 'rules', 'budget', 'budgeted', 'afford', 'trade', 'shop', 'market', 'appointment', 'late',
    'refused', 'refuse', 'argue', 'argued', 'quarrel', 'hungry', 'tired', 'mud'
  ],
  bone: [
    'frame', 'beam', 'beams', 'joint', 'joints', 'peg', 'pegs', 'oak', 'timber', 'spine', 'skeleton', 'bone',
    'bones', 'load', 'weight', 'measure', 'measured', 'count', 'counted', 'line', 'lines', 'map', 'maps', 'ink',
    'shape', 'circle', 'rectangle', 'square', 'edge', 'edges', 'crack', 'seam', 'slate', 'stone', 'stones',
    'tooth', 'remain', 'remains', 'record', 'book', 'page', 'pages', 'letter', 'sign', 'diagram', 'number',
    'nine', 'thirteen', 'key', 'keys', 'filed', 'shell', 'door', 'thread', 'grid', 'angle', 'corner', 'corners',
    'rhythm', 'beat', 'note', 'notes', 'shard', 'shards', 'puzzle', 'hole', 'structure', 'plumb', 'scale'
  ]
});

const LOOKUP = new Map();
Object.entries(VOCABULARY).forEach(([lean, words]) => words.forEach((word) => LOOKUP.set(word, lean)));

/** Word counts per lean, for inspection and tuning. */
export function leanScores(text) {
  const scores = { boon: 0, bane: 0, bone: 0 };
  String(text || '').toLowerCase().match(/[a-z’']+/g)?.forEach((word) => {
    const lean = LOOKUP.get(word.replace(/[’']s$/, ''));
    if (lean) {
      scores[lean] += 1;
    }
  });
  return scores;
}

/**
 * A paragraph's lean: the land its words stand in most, if it stands
 * somewhere clearly (two words or more, and ahead of the others).
 */
export function leanFor(text, authored) {
  if (authored && VOCABULARY[authored]) {
    return authored;
  }
  const scores = leanScores(text);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [[lean, top], [, second]] = ranked;
  return top >= 2 && top > second ? lean : '';
}

export function lensById(id) {
  return LENSES.find((lens) => lens.id === id) || null;
}
