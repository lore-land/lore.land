/**
 * sightings.mjs — the drawing fills in as you notice him.
 *
 * Nine sightings are scattered through the book: six in the margins (the
 * rumours references.mjs surfaces beside the prose) and three in the prose
 * itself. Each one, noticed, gives the reader one stroke of a plain drawing:
 * a hat, a circle, a rectangle, four lines, two dots. Nine strokes, nine
 * sightings; the order is whatever order you read in. The drawing never
 * gets a name — the story has not given him one.
 *
 * Kept per reader in localStorage (lore.sightings.v1); a blocked shelf only
 * means this visit's sightings are not remembered. A sighting is announced
 * with a settle card when the `sightings` switch is on (it is, by default),
 * and always kept quietly either way. The home page's hat drawer and the
 * desk's ?[sightings] spell show the drawing so far.
 *
 * Canon: .spw/surfaces/wonder-about-pie.spw#book_two (sightings).
 */

const KEY = 'lore.sightings.v1';
const TOTAL = 9;

export const SIGHTINGS = Object.freeze([
  { id: 'sighting-sand', chapter: 3, stroke: 'head', title: 'Lines in the sand' },
  { id: 'sighting-records', chapter: 4, stroke: 'body', title: 'Three records of one visitor' },
  { id: 'sighting-hat', chapter: 6, stroke: 'hat', title: 'A hat, first' },
  { id: 'sighting-corners', chapter: 9, stroke: 'leg-left', title: 'A puzzle with corners' },
  { id: 'sighting-orthogonal', chapter: 11, stroke: 'leg-right', title: 'Facing another way' },
  { id: 'sighting-scent', chapter: 12, stroke: 'eye-left', title: 'A true scent' },
  { id: 'road', chapter: 13, stroke: 'arm-left', title: 'A hat on the road', phrase: 'a hat hung in the air' },
  { id: 'furrow', chapter: 14, stroke: 'arm-right', title: 'A shape in the steam', phrase: 'the steam had a shape in it' },
  { id: 'button', chapter: 15, stroke: 'eye-right', title: 'Round, with two holes', phrase: 'Round, with two holes' }
]);

const BY_ID = new Map(SIGHTINGS.map((entry) => [entry.id, entry]));

export const isSighting = (id) => BY_ID.has(id);

export function readSightings() {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeSightings(value) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private mode: the sighting still counts for this visit.
  }
}

/** Keep a sighting. Returns what changed, so callers can say so. */
export function recordSighting(id) {
  const entry = BY_ID.get(id);
  if (!entry) return null;
  const seen = readSightings();
  const isNew = !seen[id];
  if (isNew) {
    const now = new Date();
    seen[id] = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    writeSightings(seen);
  }
  const count = SIGHTINGS.filter((s) => seen[s.id]).length;
  return { entry, isNew, count, total: TOTAL, seen };
}

/* ─── The drawing ───────────────────────────────────────────────────── */

/* Plain on purpose: the figure is a circle, a rectangle, four lines and two
 * dots, under a hat that does not touch him. The right arm is shorter — it
 * lit an ant's torch in chapter fourteen. */
const STROKES = Object.freeze({
  hat: '<g class="sk-hat" data-stroke="hat" fill="currentColor"><path d="M33 25 Q50 29 67 25 Q50 22 33 25Z"/><path d="M39 24.5C38 9 62 9 61 24.5Z"/></g>',
  head: '<circle data-stroke="head" class="sk-line" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" cx="50" cy="45" r="12" pathLength="1"/>',
  body: '<rect data-stroke="body" class="sk-line" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" x="38" y="61" width="24" height="36" pathLength="1"/>',
  'arm-left': '<path data-stroke="arm-left" class="sk-line" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M38 67 L23 89" pathLength="1"/>',
  'arm-right': '<path data-stroke="arm-right" class="sk-line" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M62 67 L72 81" pathLength="1"/>',
  'leg-left': '<path data-stroke="leg-left" class="sk-line" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M45 97 L39 123" pathLength="1"/>',
  'leg-right': '<path data-stroke="leg-right" class="sk-line" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M55 97 L62 122" pathLength="1"/>',
  'eye-left': '<circle data-stroke="eye-left" class="sk-dot" fill="currentColor" cx="45.5" cy="44" r="1.8"/>',
  'eye-right': '<circle data-stroke="eye-right" class="sk-dot" fill="currentColor" cx="54.5" cy="44" r="1.8"/>'
});

/**
 * The drawing as it stands: only the strokes noticed so far. `fresh` names
 * the stroke to draw in (it animates; reduced motion shows it plainly).
 */
export function sightingsFigure(seen = readSightings(), { fresh = null, label = '' } = {}) {
  const strokes = SIGHTINGS.filter((s) => seen[s.id])
    .map((s) => (s.stroke === fresh ? STROKES[s.stroke].replace('class="sk-', 'class="is-fresh sk-') : STROKES[s.stroke]));
  const count = strokes.length;
  const aria = label || (count ? `A plain drawing, ${count} of ${TOTAL} strokes noticed` : 'An empty page; nothing noticed yet');
  return `<svg class="sightings-sketch" viewBox="0 0 100 130" role="img" aria-label="${aria}" data-count="${count}">${strokes.join('')}</svg>`;
}

/* ─── On a chapter page ─────────────────────────────────────────────── */

function announce(result, at) {
  if (!result?.isNew) return;
  const root = document.documentElement;
  // Before switches are applied the default (on) holds; after, the reader's choice.
  if (root.hasAttribute('data-switches-ready') && root.getAttribute('data-switch-sightings') !== 'on') return;
  const whole = result.count === result.total;
  window.dispatchEvent(new CustomEvent('lore:settled', {
    detail: {
      sigil: '@',
      title: whole ? 'The drawing is whole' : `A sighting · ${result.count} of ${result.total}`,
      detail: whole
        ? 'Nine strokes, nine sightings. He still has no name.'
        : `${result.entry.title} — a line for the drawing.`,
      art: sightingsFigure(result.seen, { fresh: result.entry.stroke }),
      tone: 'sighting',
      lifetime: whole ? 6000 : 4200,
      at: at instanceof Element ? at : null
    }
  }));
}

/** Notice one sighting (from the margins or the prose) and say so. */
export function noticeSighting(id, at = null) {
  const result = recordSighting(id);
  announce(result, at);
  return result;
}

/**
 * Watch this chapter's prose sightings, and the margins' via `lore:sighting`
 * (dispatched by references.mjs when a sighting rumour surfaces).
 */
export function initSightings({ chapterData } = {}) {
  const chapter = Number(chapterData?.chapterNumber || 0);
  const main = document.getElementById('chapter-content');
  if (!chapter || !main) return () => {};

  const onRumour = (event) => {
    const { id, at } = event.detail || {};
    if (isSighting(id)) noticeSighting(id, at);
  };
  window.addEventListener('lore:sighting', onRumour);

  const prose = SIGHTINGS.filter((s) => s.chapter === chapter && s.phrase);
  let observer = null;
  if (prose.length && 'IntersectionObserver' in window) {
    const targets = new Map();
    main.querySelectorAll('p').forEach((p) => {
      const text = p.textContent || '';
      prose.forEach((s) => {
        if (!targets.has(s.id) && text.includes(s.phrase)) targets.set(s.id, p);
      });
    });
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('data-sighting');
        observer.unobserve(entry.target);
        entry.target.classList.add('is-sighted');
        noticeSighting(id, entry.target);
      });
    }, { rootMargin: '-20% 0px -30% 0px', threshold: 0.6 });
    targets.forEach((p, id) => {
      p.setAttribute('data-sighting', id);
      observer.observe(p);
    });
  }

  return () => {
    window.removeEventListener('lore:sighting', onRumour);
    observer?.disconnect();
  };
}
