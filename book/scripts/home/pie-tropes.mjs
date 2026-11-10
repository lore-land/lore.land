/**
 * pie-tropes.mjs — whose tune it is: the motifs of .spw/runtime/audio-tropes.spw, read for the lanes.
 *
 * A motif says whose a sound is. Most are notes, as degrees of the chapter's pentatonic (0 is its root). Three are one
 * shape turned three ways: Mr. BoonWAP has it as it is, Mr. BaneWAP upside down, BoneWAP backwards, so the ear can
 * tell they are related before it can say how. Some are not notes at all: the Genie is a stack of pure fifths that
 * comes out a comma sharp, the porter one knock in three meters, the clerk a tally, the mime a rest.
 *
 * A small reader reads the file at once (it is plain and regular, and the game need not wait for the parser);
 * book:check reads it again with the Spw interpreter and holds the two reads to agree. pie-sound.mjs plays them.
 */

/* The token is the release the motifs last changed in, so a returning player's kept copy is not last release's. */
export const TROPES_URL = '/.spw/runtime/audio-tropes.spw?v=2026_11_10.A';

const blockOf = (text, name) => {
  const at = text.indexOf(`!${name}{`);
  if (at < 0) return '';
  let depth = 0;
  for (let i = text.indexOf('{', at); i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') { depth -= 1; if (depth === 0) return text.slice(text.indexOf('{', at) + 1, i); }
  }
  return '';
};
const field = (body, op, label) => {
  const m = body.match(new RegExp(`\\${op}${label}\\[("([^"]*)"|[^\\]]*)\\]`));
  return m ? (m[2] !== undefined ? m[2] : m[1].trim()) : null;
};
const numbers = (value) => (value == null ? null : value.split(/\s+/).filter(Boolean).map(Number));

/** Read the file's text into { boof: { notes, timbre, says, … }, … }. Nothing here can throw. */
export function readMotifs(text = '') {
  const motifs = {};
  try {
    [...blockOf(text, 'motifs').matchAll(/\*([a-z0-9_]+)\{([^\n]*)\}\s*$/gim)].forEach(([, id, body]) => {
      const motif = {
        notes: numbers(field(body, '~', 'notes')),
        of: field(body, '~', 'of'),
        form: field(body, '=', 'form'),
        timbre: field(body, '$', 'timbre'),
        meters: numbers(field(body, '~', 'meters')),
        stack: field(body, '~', 'stack'),
        count: numbers(field(body, '%', 'count'))?.[0] ?? null,
        pattern: field(body, '~', 'pattern'),
        glide: field(body, '=', 'glide'),
        walk: field(body, '~', 'walk')
      };
      motifs[id] = Object.fromEntries(Object.entries(motif).filter(([, value]) => value !== null));
    });
  } catch { /* the calls they already had still play */ }
  return motifs;
}

/* A shape, turned: as it is, upside down about its first note, or backwards. */
const turned = (notes, form) => {
  if (form === 'inversion') return notes.map((n) => 2 * notes[0] - n);
  if (form === 'retrograde') return [...notes].reverse();
  return [...notes];
};

/** The notes a motif plays, its `of` followed and its form applied; null for a motif that is not made of notes. */
export function motifNotes(motifs, who) {
  const motif = motifs?.[who];
  if (!motif) return null;
  if (motif.of) {
    const source = motifs[motif.of]?.notes;
    return source ? turned(source, motif.form) : null;
  }
  return motif.notes ? [...motif.notes] : null;
}

export function loadMotifs() {
  return fetch(TROPES_URL).then((res) => (res.ok ? res.text() : '')).then(readMotifs).catch(() => ({}));
}
