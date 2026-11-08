/**
 * spw-spell.mjs — a Spw expression shown as a spell: every sigil lit by its role, every bracket
 * knowing its pair, every atom saying what it does, and the whole thing written in light the
 * first time it comes into view.
 *
 *   renderSpell(text, { explain, cast, link })  → an element (.spell) ready to place anywhere
 *   enchant(root)                               → turns every .spell-source inside root into a spell
 *
 * It reads the surface of the language only (sigils, containers, labels, strings, numbers, paths),
 * so it is cheap and never wrong about a spell it cannot parse: what it does not know stays plain.
 * The parser proper (vendor/spw-seed.mjs) is for meaning; this is for the eye and the hand.
 *
 * Magic, kept honest:
 *   - each sigil carries its role's ink (?, ~, @, &, *, ^, !, #, ., =, %, $) and a gloss
 *   - hover or focus an atom (sigil + label + frame) and it lights, with what it does said under it
 *   - hover a bracket and its pair lights too
 *   - cast: on first sight the spell inks in, glyph by glyph, and the sigils flare once
 *     (none of it under reduced motion; nothing depends on it)
 */

export const SIGIL_ROLES = Object.freeze({
  '?': { role: 'probe', says: 'asks' },
  '~': { role: 'potential', says: 'lasts, or might' },
  '@': { role: 'perspective', says: 'from whose eyes' },
  '&': { role: 'confluence', says: 'together with' },
  '*': { role: 'value', says: 'a thing, named, or a charge' },
  '^': { role: 'integration', says: 'binds upward' },
  '!': { role: 'action', says: 'happens at once' },
  '#': { role: 'annotation', says: 'is said, or marked' },
  '.': { role: 'ground', says: 'stands on' },
  '=': { role: 'config', says: 'tunes, or leans' },
  '%': { role: 'measure', says: 'how much' },
  '$': { role: 'substrate', says: 'made of' }
});

const CONTAINER_NAMES = Object.freeze({ '[': 'a frame', '{': 'a body', '(': 'a gathering', '<': 'a passage' });

/* The surface of a spell, as tokens: sigil, label, open, close, string, number, path, word, space, other. */
function tokenize(text) {
  const tokens = [];
  const re = /(\s+)|("(?:[^"\\]|\\.)*"?)|([?~@&*^!#.=%$])(?=[A-Za-z_"[{(<]|$)|([[{(<])|([\]})>])|(-?\d+(?:\.\d+)?)|([A-Za-z_][\w-]*)|(.)/gu;
  let m;
  while ((m = re.exec(text))) {
    const [whole, space, str, sigil, open, close, num, word] = m;
    if (space) tokens.push({ type: 'space', text: whole });
    else if (str) tokens.push({ type: 'string', text: whole });
    else if (sigil) tokens.push({ type: 'sigil', text: whole });
    else if (open) tokens.push({ type: 'open', text: whole });
    else if (close) tokens.push({ type: 'close', text: whole });
    else if (num) tokens.push({ type: 'number', text: whole });
    else if (word) tokens.push({ type: 'word', text: whole });
    else tokens.push({ type: 'other', text: whole });
  }
  // A string right after a sigil is a path (~"book/chapter/01#…"); a word right after a sigil is its label.
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    if (prev?.type === 'sigil' && t.type === 'string') t.type = 'path';
    else if (prev?.type === 'sigil' && t.type === 'word') t.type = 'label';
  });
  return tokens;
}

function span(className, text, title) {
  const node = document.createElement('span');
  node.className = className;
  node.textContent = text;
  if (title) node.title = title;
  return node;
}

/**
 * A spell, rendered. explain(atomText, sigil, label) may return a plain sentence for an atom
 * (shown under the spell as it is lit); link(path) may return an href for a quoted path.
 */
export function renderSpell(text, { explain = null, cast = true, link = null, label = '' } = {}) {
  const root = document.createElement('div');
  root.className = `spell${cast ? ' is-uncast' : ''}`;
  const line = document.createElement('code');
  line.className = 'spell-line';
  if (label) line.setAttribute('aria-label', label);
  const gloss = document.createElement('p');
  gloss.className = 'spell-gloss';
  gloss.setAttribute('aria-live', 'polite');
  const stack = [];
  let pairN = 0;
  let glyph = 0;
  let atom = null;
  const close = () => { atom = null; };
  tokenize(String(text)).forEach((t) => {
    let node;
    if (t.type === 'sigil') {
      const role = SIGIL_ROLES[t.text];
      atom = document.createElement('span');
      atom.className = `spell-atom op-${role?.role || 'plain'}`;
      atom.tabIndex = explain ? 0 : -1;
      line.append(atom);
      node = span(`spell-sigil op-${role?.role || 'plain'}`, t.text, role ? `${t.text} ${role.role}: ${role.says}` : '');
      atom.append(node);
      atom.dataset.sigil = t.text;
    } else if (t.type === 'label' && atom) {
      node = span('spell-label', t.text);
      atom.append(node);
      atom.dataset.label = t.text;
    } else if (t.type === 'open') {
      pairN += 1;
      stack.push(pairN);
      node = span(`spell-bracket spell-open b-${t.text === '[' ? 'frame' : t.text === '{' ? 'body' : t.text === '(' ? 'group' : 'capsule'}`, t.text, CONTAINER_NAMES[t.text]);
      node.dataset.pair = String(pairN);
      // A frame right after a label belongs to that atom; a body closes it.
      if (t.text === '[' && atom) atom.append(node); else { close(); line.append(node); }
      if (t.text === '[' && atom) atom.dataset.depth = String(stack.length);
    } else if (t.type === 'close') {
      const n = stack.pop();
      node = span('spell-bracket spell-close', t.text);
      if (n) node.dataset.pair = String(n);
      if (t.text === ']' && atom && atom.dataset.depth && Number(atom.dataset.depth) === (stack.length + 1)) {
        atom.append(node);
        close();
      } else {
        close();
        line.append(node);
      }
    } else if (t.type === 'string') {
      node = span('spell-string', t.text);
      (atom || line).append(node);
    } else if (t.type === 'path') {
      const href = link ? link(t.text.replace(/^"|"$/g, '')) : null;
      node = href ? Object.assign(document.createElement('a'), { className: 'spell-path', href, textContent: t.text }) : span('spell-path', t.text);
      (atom || line).append(node);
      close();
    } else if (t.type === 'number') {
      node = span('spell-number', t.text);
      (atom || line).append(node);
    } else if (t.type === 'space') {
      if (atom && !atom.querySelector('.spell-open')) close();
      (atom || line).append(document.createTextNode(t.text));
      return;   // spaces take no time to write
    } else {
      node = span(t.type === 'word' ? 'spell-word' : 'spell-other', t.text);
      (atom || line).append(node);
    }
    if (node.nodeType === 1) node.style.setProperty('--i', String(glyph));
    glyph += 1;
  });
  root.style.setProperty('--glyphs', String(glyph));
  root.append(line);
  if (explain) root.append(gloss);

  // Brackets know their pairs; atoms say what they do.
  const light = (pair, on) => line.querySelectorAll('.spell-bracket').forEach((b) => { if (b.dataset.pair === pair) b.classList.toggle('is-paired', on); });
  line.addEventListener('pointerover', (event) => {
    const b = event.target.closest('.spell-bracket');
    if (b?.dataset.pair) light(b.dataset.pair, true);
  });
  line.addEventListener('pointerout', (event) => {
    const b = event.target.closest('.spell-bracket');
    if (b?.dataset.pair) light(b.dataset.pair, false);
  });
  const say = (a, on) => {
    a.classList.toggle('is-lit', on);
    if (!explain) return;
    gloss.textContent = on ? (explain(a.textContent.trim(), a.dataset.sigil, a.dataset.label) || `${a.dataset.sigil} ${SIGIL_ROLES[a.dataset.sigil]?.role || ''}: ${SIGIL_ROLES[a.dataset.sigil]?.says || ''}`) : '';
  };
  line.addEventListener('pointerover', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, true); });
  line.addEventListener('pointerout', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, false); });
  line.addEventListener('focusin', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, true); });
  line.addEventListener('focusout', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, false); });

  if (cast) castWhenSeen(root);
  return root;
}

/* Written in light the first time it is seen (or at once, where nothing watches). */
let watcher = null;
function castWhenSeen(root) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof IntersectionObserver !== 'function') {
    root.classList.remove('is-uncast');
    return;
  }
  watcher = watcher || new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      watcher.unobserve(entry.target);
      entry.target.classList.remove('is-uncast');
      entry.target.classList.add('is-casting');
      const glyphs = Number(entry.target.style.getPropertyValue('--glyphs')) || 40;
      setTimeout(() => entry.target.classList.remove('is-casting'), Math.min(2400, 260 + glyphs * 18));
    });
  }, { threshold: 0.4 });
  watcher.observe(root);
}

/** Every .spell-source inside root (its text a spell) becomes a spell, in place. */
export function enchant(root = document, options = {}) {
  root.querySelectorAll('.spell-source').forEach((source) => {
    if (source.dataset.enchanted) return;
    source.dataset.enchanted = 'true';
    const spell = renderSpell(source.textContent, options);
    spell.classList.add(...[...source.classList].filter((c) => c !== 'spell-source'));
    source.replaceWith(spell);
  });
}
