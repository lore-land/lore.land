/**
 * materials.mjs — what the land is made of, as threads through the book.
 *
 * Boon.land is told in materials before it is told in morals: Bonk glass that
 * keeps every knock, flour that sets the story back, berries lit from within,
 * frost that holds a field still, ink and plain line, brass that rings, steam
 * over a warm furrow, oak that bears a load. Each material is a vocabulary;
 * the build counts it through every chamber (semantic.json `materials`), the
 * chapter pages offer to follow a material to where it comes back
 * (material-paths.mjs), and components wear a material through its tokens
 * (components/materials.css: --mat-ink, --mat-ground, --mat-edge, --mat-sheen).
 *
 * No DOM, no imports: the build and the browser share it.
 */

export const MATERIALS = Object.freeze([
  { id: 'glass', label: 'Bonk glass', sigil: '◇', verb: 'Follow the glass', gloss: 'every knock, kept',
    terms: ['glass', 'pane', 'panes', 'window', 'windows', 'shard', 'shards', 'lens', 'lantern', 'lanterns', 'glassed', 'glassing'] },
  { id: 'flour', label: 'flour', sigil: '∴', verb: 'Follow the flour', gloss: 'what the story is baked from, and set back by',
    terms: ['flour', 'dough', 'bread', 'loaf', 'loaves', 'crust', 'sack', 'sacks', 'oven', 'baker', 'crumb', 'crumbs', 'slice', 'slices'] },
  { id: 'berry', label: 'boonberries', sigil: '●', verb: 'Follow the berries', gloss: 'a little borrowed summer',
    terms: ['berry', 'berries', 'boonberry', 'boonberries', 'blueberry', 'blueberries', 'juice', 'bramble', 'canes'] },
  { id: 'frost', label: 'frost', sigil: '❄', verb: 'Follow the frost', gloss: 'the field held still',
    terms: ['frost', 'frosted', 'rime', 'ice', 'icy', 'snow', 'snowed', 'frozen', 'winter', 'thaw'] },
  { id: 'ink', label: 'ink and line', sigil: '∕', verb: 'Follow the ink', gloss: 'what is written down, and what will not be',
    terms: ['ink', 'line', 'lines', 'page', 'pages', 'map', 'maps', 'chalk', 'slate', 'drawing', 'drawn', 'written', 'letter', 'letters'] },
  { id: 'brass', label: 'brass and bronze', sigil: '◎', verb: 'Follow the brass', gloss: 'things that ring, and things that measure',
    terms: ['brass', 'bronze', 'bell', 'bells', 'iron', 'dividers', 'coin', 'coins', 'counterweight', 'hinge'] },
  { id: 'steam', label: 'steam and warmth', sigil: '≈', verb: 'Follow the warmth', gloss: 'the hearth under everything',
    terms: ['steam', 'steamed', 'steaming', 'warm', 'warmth', 'hearth', 'hearths', 'ember', 'embers', 'torch', 'torches', 'lamp', 'lamps'] },
  { id: 'oak', label: 'oak and frame', sigil: '⌂', verb: 'Follow the oak', gloss: 'what bears the load',
    terms: ['oak', 'beam', 'beams', 'timber', 'frame', 'peg', 'pegs', 'joint', 'joints', 'table', 'door', 'doors'] }
]);

const LOOKUP = new Map();
MATERIALS.forEach((material) => material.terms.forEach((term) => LOOKUP.set(term, material.id)));

/** Hits per material in a passage. */
export function materialScores(text) {
  const scores = Object.fromEntries(MATERIALS.map((m) => [m.id, 0]));
  String(text || '').toLowerCase().match(/[a-z’']+/g)?.forEach((word) => {
    const id = LOOKUP.get(word.replace(/[’']s$/, ''));
    if (id) scores[id] += 1;
  });
  return scores;
}

export const materialById = (id) => MATERIALS.find((m) => m.id === id) || null;
