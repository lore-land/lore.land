/**
 * Story Spark — a live, cyclable invitation to imagine, not a report.
 *
 * .spw/surfaces/plates.spw already holds real, well-written material for
 * this: domain_constellations (cross-discipline crossings per chamber, each
 * with a provocation question), idiomarium (Spw-phrase idioms with a "read"
 * line), and a peripheral_field word bank — but it sits as static prose,
 * one combination at a time only findable by reading the whole file.
 *
 * This fetches the same public canon source (dist/.spw already carries it —
 * `surfaces` is a whole allowlisted directory) and, on each "Conjure
 * another spark" click, composes ONE fresh combination — one chamber, one
 * domain crossing, one idiom, one peripheral cross — as an invitation to
 * imagine, not a data dump of everything at once.
 */

import { normalizeSpwSource } from './spw-routing.mjs?v=2026_03_02.A';

const PLATES_SOURCE = 'surfaces/plates';
const CHAMBER_COUNT = 13;

function pad(num) {
  return String(num).padStart(2, '0');
}

/* -- extraction (mirrors .spw/tools/trope-prompt.mjs, browser-side) -- */

function readShelf(text, chamber) {
  const re = new RegExp(`\\{\\s*${chamber}:\\s*"([^"]*)"\\s*status:\\s*(\\S+)\\s*anchor:\\s*"([^"]*)"\\s*\\}`);
  const m = text.match(re);
  return m ? { tropes: m[1].split('/').map((s) => s.trim()), status: m[2], anchor: m[3] } : null;
}

function readConstellations(text, chamber) {
  const n = Number(chamber);
  const re = /&(\w+)\{\s*domains:\s*\[([^\]]*)\]\s*chambers:\s*\[([^\]]*)\]\s*recurring_forms:\s*\[([^\]]*)\]\s*ask:\s*"([^"]*)"\s*\}/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) {
    const chambers = m[3].split(',').map((s) => Number(s.trim()));
    if (chambers.includes(n)) {
      hits.push({ name: m[1], recurringForms: m[4].split(',').map((s) => s.trim()), ask: m[5] });
    }
  }
  return hits;
}

function readIdioms(text, chamber) {
  const n = Number(chamber);
  const re = /\^idiom\["([^"]*)"\]\{\s*phrase:\s*"([^"]*)"\s*read:\s*"([^"]*)"\s*use:\s*(\[[^\]]*\]|"[^"]*")\s*\}/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) {
    const useRaw = m[4];
    const applies = useRaw.startsWith('[')
      ? useRaw.slice(1, -1).split(',').map((s) => Number(s.trim())).includes(n)
      : true;
    if (applies) {
      hits.push({ label: m[1], phrase: m[2], read: m[3] });
    }
  }
  return hits;
}

function readPeripheralLists(text) {
  const block = text.match(/~<"peripheral_field">\{([\s\S]*?)\n\}/);
  if (!block) return {};
  const lists = {};
  const re = /(\w+):\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(block[1]))) {
    lists[m[1]] = m[2].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return lists;
}

function pickRandom(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

/** Compose one fresh spark for a random chamber. Returns null if the
 *  canon text doesn't have enough for that chamber (should not happen
 *  across all 13, but stay honest rather than fabricate). */
export function composeSpark(text, chamberOverride) {
  const chamber = chamberOverride || pad(1 + Math.floor(Math.random() * CHAMBER_COUNT));
  const shelf = readShelf(text, chamber);
  if (!shelf) {
    return null;
  }
  const constellation = pickRandom(readConstellations(text, chamber));
  const idiom = pickRandom(readIdioms(text, chamber));
  const peripheralLists = readPeripheralLists(text);
  const listNames = Object.keys(peripheralLists);
  const crossA = pickRandom(listNames.map((name) => peripheralLists[name]).filter((l) => l.length));
  const crossItem = crossA ? pickRandom(crossA) : null;

  return { chamber, shelf, constellation, idiom, crossItem };
}

function renderSpark(spark) {
  if (!spark) {
    return 'The canon didn\'t have enough to spark from — try again.';
  }
  const lines = [];
  lines.push(`Chamber ${spark.chamber} · ${spark.shelf.anchor} · ${spark.shelf.tropes.join(' / ')}`);
  lines.push('');
  if (spark.constellation) {
    lines.push(spark.constellation.ask);
    lines.push(`What if the answer showed up as ${spark.constellation.recurringForms[0] || 'something recurring'}?`);
    lines.push('');
  }
  if (spark.idiom) {
    lines.push(`"${spark.idiom.label}"`);
    lines.push(`${spark.idiom.phrase}`);
    lines.push(`— ${spark.idiom.read}`);
    lines.push('');
  }
  if (spark.crossItem) {
    lines.push(`Cross it with: ${spark.crossItem}.`);
  }
  return lines.join('\n');
}

const STYLE = `
  :host { display: block; }
  .spark-panel {
    border: 1px solid rgba(42, 111, 127, 0.3);
    border-radius: 10px;
    padding: 0.9rem 1rem;
    background: rgba(255, 255, 255, 0.7);
    display: grid;
    gap: 0.6rem;
  }
  .spark-text {
    margin: 0;
    white-space: pre-wrap;
    font-family: var(--font-family-body, Georgia, serif);
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-text-main, #1a2233);
    min-height: 6rem;
  }
  .spark-conjure {
    justify-self: start;
    border: 1px solid rgba(42, 111, 127, 0.4);
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    background: transparent;
    font-family: var(--font-family-heading, monospace);
    font-size: 0.8rem;
    letter-spacing: 0.03em;
    cursor: pointer;
  }
  .spark-conjure:hover, .spark-conjure:focus-visible { background: rgba(42, 111, 127, 0.1); }
`;

class StorySparkElement extends HTMLElement {
  async connectedCallback() {
    if (this.shadowRoot) {
      return;
    }
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;

    const panel = document.createElement('div');
    panel.className = 'spark-panel';

    const text = document.createElement('p');
    text.className = 'spark-text';
    text.setAttribute('aria-live', 'polite');
    text.textContent = 'Gathering canon…';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spark-conjure';
    button.textContent = 'Conjure another spark';
    button.disabled = true;

    panel.append(text, button);
    shadow.append(style, panel);

    let plateText = null;
    try {
      const response = await fetch(normalizeSpwSource(PLATES_SOURCE));
      if (!response.ok) {
        throw new Error(`fetch failed: ${response.status}`);
      }
      plateText = await response.text();
    } catch {
      text.textContent = 'The canon is resting — try reloading to spark again.';
      return;
    }

    const conjure = () => {
      text.textContent = renderSpark(composeSpark(plateText));
    };

    button.disabled = false;
    button.addEventListener('click', conjure);
    conjure();
  }
}

export function initStorySpark() {
  if (!customElements.get('story-spark')) {
    customElements.define('story-spark', StorySparkElement);
  }
}
