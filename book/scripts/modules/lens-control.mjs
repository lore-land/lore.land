/**
 * lens-control.mjs — tune a chapter's genre: boon · bane · bone.
 *
 * Under the title: "Read as" with four quick positions (Balanced, Boon,
 * Bane, Bone) and a Tune dial — a triangle whose corners are the three
 * lands. Where the reader puts the point sets three weights; every
 * paragraph's presence follows its lean's weight (chapter/reading.css reads
 * --w-boon / --w-bane / --w-bone / --w-none), so genre is a blend, not a
 * mode. When one land holds most of the weight (≥ 60%) it also becomes the
 * lens: boon unfolds the scenes, bone brings up the notation.
 *
 * Stored with the reader's room (lore.nook.v1 → genre {boon,bane,bone}, and
 * lens for the dominant land); the template's head script applies both
 * before first paint. Balanced is the default: nothing is weighted.
 */

import { LENSES, lensById } from './valence-lens.mjs?v=2026_09_27.A';

const NOOK_KEY = 'lore.nook.v1';
const BALANCED = Object.freeze({ boon: 1 / 3, bane: 1 / 3, bone: 1 / 3 });
const CORNERS = Object.freeze({
  boon: { x: 50, y: 8 },
  bane: { x: 8, y: 82 },
  bone: { x: 92, y: 82 }
});
export const GENRE_NAMES = Object.freeze({ boon: 'fairy tale', bane: 'absurd reality', bone: 'low magic' });

function readNook() {
  try {
    return JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeNook(patch) {
  try {
    window.localStorage.setItem(NOOK_KEY, JSON.stringify({ ...readNook(), ...patch }));
  } catch {
    // Private mode: the dial holds for this visit.
  }
}

export function normalizeGenre(weights) {
  const clean = Object.fromEntries(['boon', 'bane', 'bone'].map((id) => [id, Math.max(0, Number(weights?.[id]) || 0)]));
  const total = clean.boon + clean.bane + clean.bone;
  return total > 0 ? Object.fromEntries(Object.entries(clean).map(([id, value]) => [id, value / total])) : { ...BALANCED };
}

/** Stored genre, or the older single lens as a corner, or balanced. */
export function readGenre() {
  const nook = readNook();
  if (nook.genre) {
    return normalizeGenre(nook.genre);
  }
  if (lensById(nook.lens)) {
    return normalizeGenre({ [nook.lens]: 1 });
  }
  return { ...BALANCED };
}

function dominant(genre) {
  const [id, share] = Object.entries(genre).sort((a, b) => b[1] - a[1])[0];
  return share >= 0.6 ? id : '';
}

function isBalanced(genre) {
  return Math.max(genre.boon, genre.bane, genre.bone) - Math.min(genre.boon, genre.bane, genre.bone) < 0.08;
}

/** Same writes the head script makes. */
export function applyGenre(genre) {
  const root = document.documentElement;
  if (isBalanced(genre)) {
    root.removeAttribute('data-genre-tuned');
    root.removeAttribute('data-lens');
    return;
  }
  const max = Math.max(genre.boon, genre.bane, genre.bone);
  root.setAttribute('data-genre-tuned', '');
  ['boon', 'bane', 'bone'].forEach((id) => root.style.setProperty(`--w-${id}`, (genre[id] / max).toFixed(3)));
  root.style.setProperty('--w-none', ((1 / 3) / max).toFixed(3));
  const lens = dominant(genre);
  if (lens) {
    root.setAttribute('data-lens', lens);
  } else {
    root.removeAttribute('data-lens');
  }
}

const capital = (text) => `${text[0].toUpperCase()}${text.slice(1)}`;

export function describeGenre(genre) {
  if (isBalanced(genre)) {
    return 'Balanced: fairy tale, absurd reality and low magic in equal measure.';
  }
  const [[first, a], [second, b]] = Object.entries(genre).sort((x, y) => y[1] - x[1]);
  if (a >= 0.6) {
    return b >= 0.15 ? `Mostly ${GENRE_NAMES[first]}, with some ${GENRE_NAMES[second]}.` : `${capital(GENRE_NAMES[first])}, nearly all the way.`;
  }
  return `${capital(GENRE_NAMES[first])} and ${GENRE_NAMES[second]}, about even.`;
}

/* Barycentric ↔ point in the triangle. */
function toPoint(genre) {
  return {
    x: genre.boon * CORNERS.boon.x + genre.bane * CORNERS.bane.x + genre.bone * CORNERS.bone.x,
    y: genre.boon * CORNERS.boon.y + genre.bane * CORNERS.bane.y + genre.bone * CORNERS.bone.y
  };
}

function toGenre({ x, y }) {
  const { boon: a, bane: b, bone: c } = CORNERS;
  const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  const wa = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / det;
  const wb = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / det;
  return normalizeGenre({ boon: wa, bane: wb, bone: 1 - wa - wb });
}

const SVG = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  const node = document.createElementNS(SVG, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

export function initLensControl({ announce } = {}) {
  const control = document.querySelector('main.chapter .chapter-lens');
  if (!control) {
    return () => {};
  }
  const gloss = control.querySelector('.chapter-lens-gloss');
  const options = [...control.querySelectorAll('.chapter-lens-option')];
  const menu = control.querySelector('.chapter-lens-menu') || control;
  const toggle = control.querySelector('.chapter-lens-toggle');
  const current = control.querySelector('.chapter-lens-current');
  let genre = readGenre();

  const shortName = () => {
    if (isBalanced(genre)) {
      return 'Balanced';
    }
    const [[first, a], [second, b]] = Object.entries(genre).sort((x, y) => y[1] - x[1]);
    const name = (id) => lensById(id)?.label || id;
    return a > 0.97 ? name(first) : b >= 0.2 ? `${name(first)} & ${name(second)}` : `Mostly ${name(first)}`;
  };

  /* The dial: a triangle, a point, and the three lands at its corners. */
  const tune = document.createElement('button');
  tune.type = 'button';
  tune.className = 'chapter-lens-option chapter-lens-tune';
  tune.setAttribute('aria-expanded', 'false');
  tune.textContent = 'Tune';
  gloss.before(tune);
  const onToggle = () => {
    menu.hidden = !menu.hidden;
    toggle?.setAttribute('aria-expanded', String(!menu.hidden));
    if (menu.hidden) {
      dial.hidden = true;
      tune.setAttribute('aria-expanded', 'false');
    }
  };
  toggle?.addEventListener('click', onToggle);

  const dial = document.createElement('div');
  dial.className = 'genre-dial';
  dial.hidden = true;
  const svg = svgEl('svg', { viewBox: '0 0 100 92', class: 'genre-dial-svg', 'aria-hidden': 'true' });
  const { boon: A, bane: B, bone: C } = CORNERS;
  const handle = svgEl('circle', { r: 4.2, class: 'genre-dial-handle' });
  svg.append(
    svgEl('polygon', { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`, class: 'genre-dial-field' }),
    svgEl('circle', { cx: A.x, cy: A.y, r: 2.4, class: 'genre-dial-corner genre-dial-corner--boon' }),
    svgEl('circle', { cx: B.x, cy: B.y, r: 2.4, class: 'genre-dial-corner genre-dial-corner--bane' }),
    svgEl('circle', { cx: C.x, cy: C.y, r: 2.4, class: 'genre-dial-corner genre-dial-corner--bone' }),
    handle
  );
  const thumb = document.createElement('div');
  thumb.className = 'genre-dial-thumb';
  thumb.tabIndex = 0;
  thumb.setAttribute('role', 'slider');
  thumb.setAttribute('aria-label', 'Genre dial: arrow keys move between fairy tale, absurd reality and low magic; Home returns to balanced');
  const labels = LENSES.map((lens) => {
    const label = document.createElement('span');
    label.className = `genre-dial-label genre-dial-label--${lens.id}`;
    const name = document.createElement('strong');
    name.textContent = lens.label;
    const kind = document.createElement('span');
    kind.textContent = GENRE_NAMES[lens.id];
    label.append(name, kind);
    return label;
  });
  const stage = document.createElement('div');
  stage.className = 'genre-dial-stage';
  stage.append(svg, thumb, ...labels);
  dial.append(stage);
  menu.append(dial);

  const place = () => {
    const point = toPoint(genre);
    handle.setAttribute('cx', point.x.toFixed(2));
    handle.setAttribute('cy', point.y.toFixed(2));
    thumb.style.left = `${point.x}%`;
    thumb.style.top = `${(point.y / 92) * 100}%`;
    thumb.setAttribute('aria-valuetext', describeGenre(genre));
  };

  const render = () => {
    const at = isBalanced(genre) ? 'balanced' : (['boon', 'bane', 'bone'].find((id) => genre[id] > 0.97) || '');
    options.forEach((option) => option.setAttribute('aria-pressed', String((option.dataset.lens || 'balanced') === at)));
    gloss.textContent = describeGenre(genre);
    if (current) {
      current.textContent = shortName();
    }
    place();
  };

  const commit = (next, spoken) => {
    genre = normalizeGenre(next);
    applyGenre(genre);
    writeNook({ genre, lens: dominant(genre) });
    render();
    if (dominant(genre) === 'boon') {
      document.querySelectorAll('main.chapter details.scene-sketch').forEach((details) => { details.open = true; });
    }
    if (spoken) {
      announce?.(describeGenre(genre));
    }
  };

  const onOption = (event) => {
    const option = event.target.closest('.chapter-lens-option');
    if (!option || option === tune) {
      return;
    }
    const lens = option.dataset.lens || '';
    commit(lens ? { [lens]: 1 } : BALANCED, true);
  };

  const onTune = () => {
    dial.hidden = !dial.hidden;
    tune.setAttribute('aria-expanded', String(!dial.hidden));
  };

  const fromEvent = (event) => {
    const box = svg.getBoundingClientRect();
    return toGenre({ x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 92 });
  };
  let dragging = false;
  const onDown = (event) => {
    dragging = true;
    stage.setPointerCapture?.(event.pointerId);
    commit(fromEvent(event), false);
    event.preventDefault();
  };
  const onMove = (event) => {
    if (dragging) {
      commit(fromEvent(event), false);
    }
  };
  const onUp = () => {
    if (dragging) {
      dragging = false;
      announce?.(describeGenre(genre));
    }
  };
  const onKey = (event) => {
    const step = event.shiftKey ? 8 : 3;
    const point = toPoint(genre);
    const moves = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    if (moves[event.key]) {
      event.preventDefault();
      commit(toGenre({ x: point.x + moves[event.key][0], y: point.y + moves[event.key][1] }), false);
    } else if (event.key === 'Home') {
      event.preventDefault();
      commit(BALANCED, true);
    }
  };

  control.addEventListener('click', onOption);
  tune.addEventListener('click', onTune);
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  thumb.addEventListener('keydown', onKey);

  control.hidden = false;
  applyGenre(genre);
  render();

  return () => {
    control.removeEventListener('click', onOption);
    toggle?.removeEventListener('click', onToggle);
    tune.removeEventListener('click', onTune);
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onUp);
    thumb.removeEventListener('keydown', onKey);
    dial.remove();
    tune.remove();
  };
}
