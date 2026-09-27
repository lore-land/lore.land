/**
 * resonance-layer.mjs — the grammar, faintly (a reading-switches trial).
 *
 * When html[data-switch-resonance="on"], each structural part of the
 * chapter carries its Spw sigil in the margin: ? beside the question it
 * asks, @ beside a voice, { } at each chamber, < > on the slip, ^ on the
 * turn, & on the stacks. Tapping a sigil opens three readings at once: what
 * it means in the story, how a library keeps it, and what the operator
 * does in the machine (the engineering register spwashi.com demonstrates).
 * Off, nothing is added to the page.
 */

import { OPERATOR_ROLES, CONTAINER_ROLES } from './spw-interactions.mjs?v=2026_07_23.D';
import { resonanceFor } from './spw-resonance.mjs?v=2026_09_26.C';

const SWITCH_ATTRIBUTE = 'data-switch-resonance';

/** Where each sigil lives in a chapter, in document order of discovery. */
const PLACEMENTS = Object.freeze([
  { selector: 'main.chapter .chapter-head .chapter-in-which', sigil: '?' },
  { selector: 'main.chapter .chapter-head .chapter-epigraph', sigil: '=' },
  { selector: 'main.chapter > section[data-ebook-section] > h2', sigil: '{' },
  { selector: 'main.chapter > [data-voice-shape="block"] > .voice-kicker', sigil: '@' },
  { selector: 'main.chapter [data-spw-grammar="bonk"] > .voice-kicker', sigil: '!' },
  { selector: 'main.chapter .section-marks .mark--motif', sigil: '#' },
  { selector: 'main.chapter .section-marks .mark--trope', sigil: '&' },
  { selector: 'main.chapter .section-marks .mark--foreshadow', sigil: '~' },
  { selector: 'main.chapter .scene-sketch > summary', sigil: '.' },
  { selector: 'main.chapter .voice-pull', sigil: '[' },
  { selector: 'main.chapter > .chapter-end-mark', sigil: '*' },
  { selector: 'main.chapter .chapter-turn-kicker', sigil: '^' },
  { selector: 'main.chapter .chapter-stacks-kicker', sigil: '&' },
  { selector: 'main.chapter .scriptorium-slip-kicker', sigil: '<' },
  { selector: 'aside .reading-nook > h2', sigil: '$' }
]);

function engineeringFor(sigil) {
  const operator = OPERATOR_ROLES[sigil];
  if (operator) {
    return `${operator.label}: ${operator.description}`;
  }
  const container = CONTAINER_ROLES[sigil];
  return container ? `${container.name} (${container.role}): ${container.description}` : '';
}

function glyph(sigil) {
  const pair = resonanceFor(sigil)?.pair;
  return pair || sigil;
}

function literaryName(entry) {
  return entry.literary || entry.name;
}

function makeSigil(sigil) {
  const entry = resonanceFor(sigil);
  if (!entry) {
    return null;
  }
  const wrap = document.createElement('span');
  wrap.className = 'resonance';
  wrap.dataset.resonanceSigil = sigil;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'resonance-sigil';
  button.textContent = glyph(sigil);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', `${glyph(sigil)}: ${literaryName(entry)}. Show both readings.`);

  const note = document.createElement('span');
  note.className = 'resonance-note';
  note.hidden = true;
  const title = document.createElement('span');
  title.className = 'resonance-note-title';
  title.textContent = `${glyph(sigil)}  ${literaryName(entry)}`;
  const literary = document.createElement('span');
  literary.className = 'resonance-note-literary';
  literary.textContent = entry.reading;
  const library = document.createElement('span');
  library.className = 'resonance-note-library';
  library.textContent = `In the stacks — ${entry.library}`;
  const engineering = document.createElement('span');
  engineering.className = 'resonance-note-engineering';
  engineering.textContent = `In the machine — ${engineeringFor(sigil)}`;
  note.append(title, literary, library, engineering);
  if (entry.witness?.text) {
    const witness = document.createElement('span');
    witness.className = 'resonance-note-witness';
    witness.textContent = `“${entry.witness.text}”`;
    note.append(witness);
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const open = note.hidden;
    note.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
  wrap.append(button, note);
  return wrap;
}

function apply() {
  PLACEMENTS.forEach(({ selector, sigil }) => {
    document.querySelectorAll(selector).forEach((host) => {
      if (host.querySelector(':scope > .resonance')) {
        return;
      }
      const node = makeSigil(sigil);
      if (node) {
        host.append(node);
      }
    });
  });
}

function clear() {
  document.querySelectorAll('.resonance').forEach((node) => node.remove());
}

export function initResonanceLayer() {
  const root = document.documentElement;
  const sync = () => (root.getAttribute(SWITCH_ATTRIBUTE) === 'on' ? apply() : clear());
  sync();
  // The drawer can switch it any time; the rail's nook panel mounts late.
  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: [SWITCH_ATTRIBUTE] });
  const late = setTimeout(sync, 1500);
  return () => {
    observer.disconnect();
    clearTimeout(late);
    clear();
  };
}
