/**
 * constellation.mjs — where a thread runs through the book.
 *
 * Any mark on the page can be asked where else it recurs: a motif, trope or
 * foreshadow chip under a section heading, a thread chip in the colophon, a
 * thread in an x-ray note, or an element carrying data-constellation. The
 * answer is a constellation: a ring of thirteen boonberries, one per chamber,
 * lit where the thread runs (amber at the core), the chamber you are in
 * marked, and under it the sections themselves as doors. It is the shape
 * with one hole from chapter nine, drawn as navigation.
 *
 * Data: book/content/semantic.json (chapters:build). Fetched on first use.
 *
 * data-constellation values:  thread:<lexicon id> · motif:<value> ·
 * trope:<value> · foreshadow:<value> · lean:<boon|bane|bone> · voice:<id>
 */

const SEMANTIC_URL = '/book/content/semantic.json';
const TOTAL = 13;
const pad = (n) => String(n).padStart(2, '0');
const KIND_WORDS = Object.freeze({
  thread: 'a thread', motif: 'a motif', trope: 'a sampled trope', foreshadow: 'a foreshadowing', lean: 'a lean', voice: 'a voice'
});
const LEAN_QUESTION = Object.freeze({ boon: 'What could this become?', bane: 'What will this cost?', bone: 'What will remain?' });

let indexPromise = null;
function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(SEMANTIC_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  }
  return indexPromise;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

const SVG = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

function humanize(value) {
  return String(value || '').split('-').join(' ');
}

/** Resolve a data-constellation key against the index → { title, kicker, places } */
function resolve(index, key) {
  const [kind, ...rest] = String(key || '').split(':');
  const value = rest.join(':');
  if (!index || !kind || !value) return null;
  let title = humanize(value);
  let kicker = KIND_WORDS[kind] || kind;
  let href = '';
  let places = [];
  if (kind === 'thread') {
    const thread = index.threads[value];
    if (!thread) return null;
    title = thread.label;
    href = thread.href || '';
    Object.entries(thread.chapters).forEach(([c, sections]) => sections.forEach((s) => places.push({ c: Number(c), id: s.id, label: s.label, n: s.n })));
  } else if (kind === 'lean') {
    places = (index.leans[value] || []).map((p) => ({ ...p }));
    kicker = `${kicker} · ${LEAN_QUESTION[value] || ''}`;
  } else if (kind === 'voice') {
    places = (index.voices[value] || []).map((p) => ({ ...p }));
  } else if (index.marks[kind]) {
    places = (index.marks[kind][value] || []).map((p) => ({ ...p }));
  } else {
    return null;
  }
  places.sort((a, b) => a.c - b.c);
  const chapters = [...new Set(places.map((p) => p.c))];
  return { kind, value, title, kicker, href, places, chapters };
}

/* ─── The ring ──────────────────────────────────────────────────────── */

function drawRing(result, index, current, onPick) {
  const size = 132;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 52;
  const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, class: 'constellation-ring', role: 'img', 'aria-label': `${result.title}: chambers ${result.chapters.map(pad).join(', ')}` });
  // The faint path the wish walked: chamber to chamber, round the ring.
  svg.append(svgEl('circle', { cx, cy, r: radius, class: 'constellation-path' }));
  const centre = svgEl('text', { x: cx, y: cy + 1, class: 'constellation-centre', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
  centre.textContent = `${result.chapters.length}`;
  const centreSub = svgEl('text', { x: cx, y: cy + 13, class: 'constellation-centre-sub', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
  centreSub.textContent = result.chapters.length === 1 ? 'chamber' : 'chambers';
  svg.append(centre, centreSub);

  for (let n = 1; n <= TOTAL; n += 1) {
    // Chamber one at the top, clockwise; the thirteenth closes the ring beside it.
    const angle = -Math.PI / 2 + ((n - 1) / TOTAL) * Math.PI * 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const lit = result.chapters.includes(n);
    const chapter = index.chapters.find((c) => c.n === n);
    const g = svgEl('g', {
      class: `constellation-berry${lit ? ' is-lit' : ''}${n === current ? ' is-here' : ''}${n === TOTAL ? ' is-door' : ''}`,
      transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      tabindex: lit ? '0' : '-1',
      role: lit ? 'link' : 'presentation',
      'aria-label': lit ? `Chapter ${pad(n)}: ${chapter?.title || ''}` : undefined
    });
    g.append(svgEl('circle', { r: 6.2, class: 'constellation-skin' }));
    g.append(svgEl('circle', { r: 2.4, cy: 0.6, class: 'constellation-ember' }));
    if (n === current) g.append(svgEl('circle', { r: 9.5, class: 'constellation-here' }));
    const title = svgEl('title');
    title.textContent = `Chapter ${pad(n)}${chapter ? ` · ${chapter.title}` : ''}${lit ? '' : ' — not here'}`;
    g.append(title);
    if (lit) {
      const first = result.places.find((p) => p.c === n);
      g.addEventListener('click', () => onPick(n, first));
      g.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPick(n, first); } });
      g.addEventListener('pointerenter', () => { centre.textContent = pad(n); centreSub.textContent = (chapter?.title || '').slice(0, 18); });
      g.addEventListener('pointerleave', () => { centre.textContent = `${result.chapters.length}`; centreSub.textContent = result.chapters.length === 1 ? 'chamber' : 'chambers'; });
    }
    svg.append(g);
  }
  return svg;
}

/* ─── The popover ───────────────────────────────────────────────────── */

export function initConstellation({ announce } = {}) {
  const supportsPopover = Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');
  const current = Number(document.body.dataset.chapter) || 0;
  const pop = el('div', { className: 'constellation', id: 'constellation', popover: supportsPopover ? 'auto' : null, hidden: !supportsPopover, 'aria-label': 'Where this runs through the book' });
  document.body.append(pop);
  let anchor = null;

  const place = () => {
    if (!anchor) return;
    const box = anchor.getBoundingClientRect();
    const narrow = window.matchMedia('(max-width: 40rem)').matches;
    pop.classList.toggle('is-sheet', narrow);
    if (narrow) {
      pop.style.left = '';
      pop.style.top = '';
      return;
    }
    const width = pop.offsetWidth || 320;
    const height = pop.offsetHeight || 320;
    let left = box.left + box.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = box.bottom + 10;
    if (top + height > window.innerHeight - 8) top = Math.max(8, box.top - height - 10);
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
  };

  const close = () => {
    if (supportsPopover) { try { pop.hidePopover(); } catch { /* already closed */ } } else { pop.hidden = true; }
  };

  const open = async (key, trigger) => {
    let index = null;
    try {
      index = await loadIndex();
    } catch (error) {
      console.warn('constellation: index unavailable', error);
    }
    const result = resolve(index, key);
    if (!result) {
      announce?.('Nothing else carries that yet.');
      return;
    }
    anchor = trigger;
    const list = el('ol', { className: 'constellation-list' }, result.places.map((p) => {
      const chapter = index.chapters.find((c) => c.n === p.c);
      const here = p.c === current;
      return el('li', { className: here ? 'is-here' : '' },
        el('a', { href: `${chapter?.href || `/book/chapter/${pad(p.c)}/`}#${p.id}` },
          el('span', { className: 'constellation-num' }, pad(p.c)),
          el('span', { className: 'constellation-where' }, `${chapter?.title || ''} · ${p.label}${p.n ? ` · ${p.n}` : ''}`),
          here ? el('span', { className: 'constellation-tag' }, 'here') : null));
    }));
    const go = (n, first) => {
      const chapter = index.chapters.find((c) => c.n === n);
      close();
      window.location.href = `${chapter?.href || `/book/chapter/${pad(n)}/`}#${first?.id || ''}`;
    };
    pop.replaceChildren(...[
      el('div', { className: 'constellation-head' },
        el('p', { className: 'constellation-kicker' }, result.kicker),
        el('h2', { className: 'constellation-title' }, result.title),
        el('button', { type: 'button', className: 'constellation-close', 'aria-label': 'Close', onClick: close }, '×')),
      drawRing(result, index, current, go),
      el('p', { className: 'constellation-sum' }, `Runs through ${result.chapters.length} of ${TOTAL} chambers, ${result.places.length} section${result.places.length === 1 ? '' : 's'}. Tap a berry, or a door below.`),
      list,
      result.href ? el('a', { className: 'constellation-all', href: result.href }, 'All of this thread →') : null
    ].filter(Boolean));
    try {
      if (supportsPopover) { pop.showPopover(); } else { pop.hidden = false; }
    } catch (error) {
      console.warn('constellation: could not open', error);
      pop.hidden = false;
    }
    place();
    announce?.(`${result.title}: ${result.chapters.length} chambers.`);
  };

  /* Voice elements' own runtime stops clicks from bubbling, so every trigger
     gets its own listener; the document listener covers anything else. */
  const bound = new WeakSet();
  const bind = (node) => {
    if (bound.has(node)) return;
    bound.add(node);
    node.addEventListener('click', (event) => {
      if (node.tagName === 'A' && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return;
      event.preventDefault();
      event.stopPropagation();
      open(node.dataset.constellation, node);
    });
    if (node.tagName !== 'BUTTON' && node.tagName !== 'A') {
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(node.dataset.constellation, node); }
      });
    }
  };

  /* Upgrade the page's marks into triggers. */
  const upgrade = () => {
    document.querySelectorAll('main.chapter .section-marks .mark[data-mark]:not([data-constellation])').forEach((chip) => {
      const kind = ['motif', 'trope', 'foreshadow'].find((k) => chip.classList.contains(`mark--${k}`));
      if (!kind) return;
      const button = el('button', { type: 'button', className: chip.className, dataset: { mark: chip.dataset.mark, constellation: `${kind}:${chip.dataset.mark}` }, title: `${chip.title} — where else it runs` }, chip.textContent);
      chip.replaceWith(button);
      bind(button);
    });
    document.querySelectorAll('main.chapter .chapter-topic-chip:not(.chapter-topic-chip--quiet):not([data-constellation])').forEach((chip) => {
      const id = (chip.getAttribute('href') || '').split('#')[1];
      if (id) { chip.dataset.constellation = `thread:${id}`; bind(chip); }
    });
    document.querySelectorAll('main.chapter > [data-voice-shape="block"] > .voice-kicker:not([data-constellation])').forEach((kicker) => {
      const voice = kicker.closest('[data-spw-component]')?.dataset.spwComponent?.replace('custom-', '');
      if (voice) { kicker.dataset.constellation = `voice:${voice}`; kicker.setAttribute('role', 'button'); kicker.tabIndex = 0; kicker.title = 'Where else this voice speaks'; bind(kicker); }
    });
    document.querySelectorAll('[data-constellation]').forEach((node) => { if (!pop.contains(node)) bind(node); });
  };

  const onClick = (event) => {
    const trigger = event.target.closest('[data-constellation]');
    if (!trigger || pop.contains(trigger) || bound.has(trigger)) return;
    if (trigger.tagName === 'A' && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return;
    event.preventDefault();
    open(trigger.dataset.constellation, trigger);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  const onResize = () => { if (pop.matches(':popover-open')) place(); };

  upgrade();
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  // Voice kickers mount on element upgrade; catch late ones.
  const late = setTimeout(upgrade, 1500);

  return () => {
    clearTimeout(late);
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    pop.remove();
  };
}

/** For other rooms (the desk): the resolved places for a key. */
export async function constellationFor(key) {
  return resolve(await loadIndex(), key);
}
