/**
 * spw-spell.mjs — a Spw expression shown as a spell: every sigil lit by its role, every bracket
 * knowing its pair, every atom saying what it does, and the whole thing written in light the
 * first time it comes into view.
 *
 *   renderSpell(text, { explain, cast, link, play })  → an element (.spell) ready to place anywhere
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
 *   - play: a ▶ plays the spell as music (spw-sound.mjs), each atom lighting as it sounds
 *   - prime and cast (the canonical tap, after spwashi.com's charge cycle and factshift's lifecycle):
 *     a first tap primes an atom (nothing is written; its next step and what it would do are said,
 *     and it holds a charge that bleeds, 0.82 less 0.18 every 2.8 s, quiet below 0.08); a second tap
 *     while it is charged casts it: one change, a receipt in the sigil's own verb (answered, taken,
 *     struck…), a discharge of its kind (release ? ! · transfer ~ @ & $ · ground # = . % · project ^ *),
 *     and residue: a cast atom keeps a faint halo. Escape, or a tap elsewhere, lets go (back to ground).
 *     The spell element dispatches spw:cast (bubbles) with { sigil, label, atom, text, kind, verb }.
 *   - texture: a spell that names a material ($glass, $frost, …) wears it (materials.css tokens)
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
export function tokenize(text) {
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
const MATERIALS = Object.freeze(['glass', 'flour', 'berry', 'frost', 'ink', 'brass', 'steam', 'oak']);

/* The charge cycle, read from spwashi.com (.spw/conventions/charge-cycle.spw): how each sigil discharges,
 * the verb its receipt is said in, and the lifetime of a prime. */
export const DISCHARGE = Object.freeze({
  '?': 'release', '!': 'release', '~': 'transfer', '@': 'transfer', '&': 'transfer', '$': 'transfer',
  '#': 'ground', '=': 'ground', '.': 'ground', '%': 'ground', '^': 'project', '*': 'project'
});
export const CAST_VERB = Object.freeze({
  '?': 'answered', '!': 'struck', '~': 'taken', '@': 'seen', '&': 'joined', '$': 'made', '#': 'marked',
  '=': 'tuned', '.': 'let go', '%': 'measured', '^': 'lifted', '*': 'kept'
});
const KIND_SAYS = Object.freeze({
  release: 'a release: it happens at once, and is over',
  transfer: 'a transfer: it carries something to something else, for a while',
  ground: 'a ground: it sets a value, and it stays',
  project: 'a projection: it binds upward, and is kept'
});
const CHARGE = Object.freeze({ primed: 0.82, step: 0.18, tickMs: 2800, quiet: 0.08 });

export function renderSpell(text, { explain = null, cast = true, link = null, label = '', play = false, scrub = null, copy = false, onCast = null } = {}) {
  const root = document.createElement('div');
  root.className = `spell${cast ? ' is-uncast' : ''}`;
  // Made of something: the first $material it names gives it that material's ground and sheen.
  const material = (/\$([a-z]+)/.exec(String(text)) || [])[1];
  if (MATERIALS.includes(material)) {
    root.classList.add('has-material');
    root.dataset.material = material;
  }
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
  // Kept, so a scrubbed number can be written back into the spell's own text.
  const tokens = tokenize(String(text));
  let numberN = 0;
  tokens.forEach((t, position) => {
    let node;
    if (t.type === 'sigil') {
      const role = SIGIL_ROLES[t.text];
      atom = document.createElement('span');
      atom.className = `spell-atom op-${role?.role || 'plain'}`;
      atom.tabIndex = 0;
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
      if (scrub) {
        node.classList.add('is-scrub');
        node.tabIndex = 0;
        node.dataset.position = String(position);
        node.dataset.label = atom?.dataset.label || '';
        node.dataset.sigil = atom?.dataset.sigil || '';
        node.setAttribute('role', 'spinbutton');
        node.setAttribute('aria-label', `${atom?.dataset.label || 'number'}: scroll, drag or use the arrow keys to change`);
        node.setAttribute('aria-valuenow', t.text);
        numberN += 1;
      }
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
  if (play) root.append(playButton(text, line));
  if (copy) root.append(copyButton(() => tokens.map((t) => t.text).join(''), typeof copy === 'string' ? copy : ''));
  if (scrub && numberN) enableScrub(line, tokens, scrub);
  root.append(line);
  root.append(gloss);   // always: a prime and a cast say themselves here

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
    if (!explain || line.querySelector('.spell-atom.is-primed')) return;
    gloss.textContent = on ? (explain(a.textContent.trim(), a.dataset.sigil, a.dataset.label) || `${a.dataset.sigil} ${SIGIL_ROLES[a.dataset.sigil]?.role || ''}: ${SIGIL_ROLES[a.dataset.sigil]?.says || ''}`) : '';
  };
  line.addEventListener('pointerover', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, true); });
  line.addEventListener('pointerout', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, false); });
  line.addEventListener('focusin', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, true); });
  line.addEventListener('focusout', (event) => { const a = event.target.closest('.spell-atom'); if (a) say(a, false); });

  enablePriming(root, line, gloss, explain, onCast);
  if (cast) castWhenSeen(root);
  return root;
}

/* The canonical tap: prime, then cast; a prime is a charge that bleeds away; a cast leaves residue. */
function enablePriming(root, line, gloss, explain, onCast) {
  let primed = null;
  let timer = null;
  const say = (text) => { if (gloss.isConnected) gloss.textContent = text; };
  const meaning = (a) => (explain ? explain(a.textContent.trim(), a.dataset.sigil, a.dataset.label) : '') || `${a.dataset.sigil} ${SIGIL_ROLES[a.dataset.sigil]?.says || ''}`;
  const ground = (quietly = false) => {
    clearInterval(timer);
    timer = null;
    if (primed) {
      primed.classList.remove('is-primed');
      primed.style.removeProperty('--charge');
      if (!quietly) say(`${primed.dataset.sigil}${primed.dataset.label || ''}, let go: back to ground.`);
    }
    primed = null;
  };
  const prime = (a) => {
    ground(true);
    primed = a;
    let charge = CHARGE.primed;
    a.classList.add('is-primed');
    a.style.setProperty('--charge', String(charge));
    const kind = DISCHARGE[a.dataset.sigil] || 'ground';
    say(`Primed: ${meaning(a)} It is ${KIND_SAYS[kind]}. Tap again to cast it.`);
    timer = setInterval(() => {
      charge -= CHARGE.step;
      if (charge < CHARGE.quiet) { ground(); return; }
      a.style.setProperty('--charge', charge.toFixed(2));
    }, CHARGE.tickMs);
  };
  const castAtom = (a) => {
    const sigil = a.dataset.sigil;
    const kind = DISCHARGE[sigil] || 'ground';
    const verb = CAST_VERB[sigil] || 'cast';
    const detail = { sigil, label: a.dataset.label || '', atom: a.textContent.trim(), text: line.textContent, kind, verb };
    ground(true);
    a.classList.remove('is-cast');
    void a.offsetWidth;
    a.classList.add('is-cast', 'is-spent');
    const receipt = onCast?.(detail);
    say(`${verb.charAt(0).toUpperCase()}${verb.slice(1)}: ${typeof receipt === 'string' && receipt ? receipt : meaning(a)}`);
    root.dispatchEvent(new CustomEvent('spw:cast', { bubbles: true, detail }));
  };
  const tap = (a) => {
    if (primed === a) castAtom(a);
    else prime(a);
  };
  line.addEventListener('click', (event) => {
    if (event.target.closest('.spell-number.is-scrub, a')) return;
    const a = event.target.closest('.spell-atom');
    if (a) tap(a);
    else ground();
  });
  line.addEventListener('keydown', (event) => {
    const a = event.target.closest('.spell-atom');
    if (event.key === 'Escape') ground();
    else if (a && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); tap(a); }
  });
  // A tap anywhere else lets the prime go.
  document.addEventListener('pointerdown', (event) => { if (primed && !root.contains(event.target)) ground(true); });
}

/*
 * Scrub: a number in a spell is a dial. Scroll over it, drag it up or down, or focus it and use
 * the arrow keys (shift for ten times as much); scrub.range(label, sigil) may hold it between two
 * bounds, and scrub.change(text, { label, value }) hears the whole spell, rewritten, each time.
 */
function enableScrub(line, tokens, scrub) {
  const stepOf = (text) => {
    const decimals = (String(text).split('.')[1] || '').length;
    return decimals ? 10 ** -Math.min(decimals, 2) : 1;
  };
  const nudge = (node, steps) => {
    const position = Number(node.dataset.position);
    const before = tokens[position].text;
    const step = stepOf(before);
    const [lo, hi] = scrub.range?.(node.dataset.label, node.dataset.sigil) || [-Infinity, Infinity];
    const value = Math.min(hi, Math.max(lo, Number(before) + steps * step));
    const decimals = (String(step).split('.')[1] || '').length;
    const text = decimals ? value.toFixed(decimals) : String(Math.round(value));
    if (text === before) return;
    tokens[position].text = text;
    node.textContent = text;
    node.setAttribute('aria-valuenow', text);
    node.classList.remove('is-nudged');
    void node.offsetWidth;
    node.classList.add('is-nudged');
    scrub.change?.(tokens.map((t) => t.text).join(''), { label: node.dataset.label, value: Number(text) });
  };
  line.addEventListener('wheel', (event) => {
    const node = event.target.closest('.spell-number.is-scrub');
    if (!node) return;
    event.preventDefault();
    nudge(node, (event.deltaY < 0 ? 1 : -1) * (event.shiftKey ? 10 : 1));
  }, { passive: false });
  let drag = null;
  line.addEventListener('pointerdown', (event) => {
    const node = event.target.closest('.spell-number.is-scrub');
    if (!node) return;
    event.preventDefault();
    drag = { node, y: event.clientY, id: event.pointerId };
    try { node.setPointerCapture(event.pointerId); } catch { /* not held */ }
    node.classList.add('is-dragging');
  });
  line.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const steps = Math.trunc((drag.y - event.clientY) / 8);
    if (steps) { nudge(drag.node, steps); drag.y = event.clientY; }
  });
  const release = () => { drag?.node.classList.remove('is-dragging'); drag = null; };
  line.addEventListener('pointerup', release);
  line.addEventListener('pointercancel', release);
  line.addEventListener('keydown', (event) => {
    const node = event.target.closest('.spell-number.is-scrub');
    if (!node || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    nudge(node, (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1));
  });
}

/*
 * ⧉: copy the spell as clean Spw, nothing but the spell (no glosses, no buttons), and where it
 * came from as a #from annotation, so a paste elsewhere knows what it holds (pie-game.mjs pasteSpell).
 */
function copyButton(textOf, from) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'spell-copy';
  button.textContent = '⧉';
  button.title = 'Copy this spell';
  button.setAttribute('aria-label', 'Copy this spell as Spw');
  button.addEventListener('click', async () => {
    const text = from ? `${textOf()}\n#from["${from}"]` : textOf();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '✓';
    } catch {
      button.textContent = '!';
    }
    setTimeout(() => { button.textContent = '⧉'; }, 1400);
  });
  return button;
}

/* ▶: the spell played, each atom lit as it sounds (spw-sound.mjs, loaded only when pressed). */
function playButton(text, line) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'spell-play';
  button.textContent = '▶';
  button.title = 'Play this spell';
  button.setAttribute('aria-label', 'Play this spell as music');
  let stop = null;
  const atoms = () => [...line.querySelectorAll('.spell-atom')];
  const end = () => {
    stop = null;
    button.textContent = '▶';
    button.classList.remove('is-playing');
    atoms().forEach((a) => a.classList.remove('is-sounding'));
  };
  button.addEventListener('click', async () => {
    if (stop) { stop(); return; }
    const sound = await import('./spw-sound.mjs?v=2026_11_08.L').catch(() => null);
    if (!sound) return;
    button.textContent = '■';
    button.classList.add('is-playing');
    const all = atoms();
    stop = sound.playSpell(text, {
      onAtom: (i) => {
        const a = all[i];
        if (!a) return;
        a.classList.add('is-sounding');
        setTimeout(() => a.classList.remove('is-sounding'), 420);
      },
      onEnd: end
    });
  });
  return button;
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
