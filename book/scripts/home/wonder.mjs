// Native disclosures carry the complete experience without JavaScript.
// Enhancement: the drawers remember what each reader has found (and say so),
// the land riffles through them before it chooses, and the hat drawer keeps
// the drawing of every sighting the reader has noticed in the chapters.
import { SIGHTINGS, readSightings, sightingsFigure } from '../modules/sightings.mjs?v=2026_11_05.B';

const FOUND_KEY = 'lore.home.curiosities.v1';
const cabinet = document.querySelector('.wonder-cabinet');

function readFound() {
  try {
    const value = JSON.parse(window.localStorage.getItem(FOUND_KEY) || '[]');
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function writeFound(found) {
  try {
    window.localStorage.setItem(FOUND_KEY, JSON.stringify([...found]));
  } catch {
    // A blocked shelf: the drawers still remember for this visit.
  }
}

function paintSketch(mount) {
  const seen = readSightings();
  const count = SIGHTINGS.filter((s) => seen[s.id]).length;
  const line = count === SIGHTINGS.length
    ? 'Your drawing is whole: nine sightings, nine strokes. He still has no name.'
    : count
      ? `Your drawing so far: ${count} of ${SIGHTINGS.length} strokes, one for each time you noticed him.`
      : 'Your drawing is a blank page. Each time you notice him in the chapters, it gains a line.';
  mount.innerHTML = `<span class="wonder-sketch-art">${sightingsFigure(seen)}</span>`;
  const words = document.createElement('span');
  words.className = 'wonder-sketch-words';
  const text = document.createElement('span');
  text.textContent = line;
  const desk = document.createElement('a');
  desk.href = '/scriptorium/#desk';
  desk.textContent = 'Your desk: ?[sightings] →';
  words.append(text, desk);
  mount.append(words);
  mount.hidden = false;
}

if (cabinet) {
  const drawers = [...cabinet.querySelectorAll('.wonder-drawer')];
  const button = cabinet.querySelector('.wonder-draw');
  const status = cabinet.querySelector('.wonder-status');
  const sketch = cabinet.querySelector('[data-sightings-sketch]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const found = readFound();
  const total = drawers.length;
  let remaining = [];
  let last;
  let riffling = false;

  const say = (fresh) => {
    const n = drawers.filter((drawer) => found.has(drawer.id)).length;
    if (n === total) {
      status.textContent = fresh
        ? `${total} curiosities, ${total} beginnings. Which thread will you follow?`
        : 'Every drawer has been opened. The hat drawer keeps your sightings.';
    } else if (n) {
      status.textContent = `${n} of ${total} curiosities found. The land has more to tell.`;
    }
  };

  function remember(drawer) {
    drawer.dataset.discovered = 'true';
    if (found.has(drawer.id)) return;
    found.add(drawer.id);
    writeFound(found);
    if (!reduced) {
      drawer.classList.add('is-fresh-find');
      setTimeout(() => drawer.classList.remove('is-fresh-find'), 1200);
    }
    say(true);
    if (drawers.every((d) => found.has(d.id))) {
      cabinet.classList.add('is-complete');
    }
  }

  drawers.forEach((drawer) => {
    if (found.has(drawer.id)) drawer.dataset.discovered = 'true';
    drawer.addEventListener('toggle', () => {
      if (!drawer.open) return;
      remember(drawer);
      if (sketch && drawer.contains(sketch)) paintSketch(sketch);
    });
  });
  if (drawers.every((d) => found.has(d.id))) cabinet.classList.add('is-complete');
  say(false);

  const open = (chosen) => {
    drawers.forEach((drawer) => { drawer.open = drawer === chosen; });
    last = chosen;
    remember(chosen);
    chosen.querySelector('summary').focus({ preventScroll: true });
    chosen.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };

  button.hidden = false;
  button.addEventListener('click', () => {
    if (riffling) return;
    if (!remaining.length) remaining = drawers.filter((drawer) => drawer !== last);
    const [chosen] = remaining.splice(Math.floor(Math.random() * remaining.length), 1);
    if (reduced) {
      open(chosen);
      return;
    }
    // The land riffles: a light runs along the drawers, slowing, and stops on one.
    riffling = true;
    button.setAttribute('aria-busy', 'true');
    const target = drawers.indexOf(chosen);
    const steps = total * 2 + ((target - (drawers.indexOf(last) + 1) + total * 3) % total);
    let step = 0;
    let at = (drawers.indexOf(last) + 1 + total) % total;
    const tick = () => {
      drawers.forEach((drawer, i) => drawer.classList.toggle('is-riffling', i === at));
      if (step >= steps) {
        setTimeout(() => {
          drawers.forEach((drawer) => drawer.classList.remove('is-riffling'));
          riffling = false;
          button.removeAttribute('aria-busy');
          open(chosen);
        }, 160);
        return;
      }
      step += 1;
      at = (at + 1) % total;
      setTimeout(tick, 50 + step * step * 1.5);
    };
    tick();
  });
}
