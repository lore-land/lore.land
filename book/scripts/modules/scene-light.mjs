/**
 * scene-light.mjs — hold the light (PLAN.E L20, L21).
 *
 * Every section already carries its own light: a tempo, a tint, a motif and
 * often a sentence from its scene (data-scene-light). copy-climate.mjs turns
 * those into the page's field light as the reader moves. This module makes
 * that light something a reader can play with, and something a screenshot
 * can be tuned by, without leaving the page.
 *
 * Knobs (book/content/world/knobs.json) are the few continuous controls that
 * steer the chapter's CSS tokens: where the light stands and how high, glow,
 * warmth, ink, grain and edge. Motifs are presets: the active section's
 * motif steers the knobs part of the way toward its own light (an egg holds
 * amber low; a hat is pencil on paper; a torch keeps the dark close). A
 * scene's edges — the strange details at its frame — deepen the vignette.
 *
 * At the end of every section: "Hold the light" opens the light table — a
 * sky to drag the sun across, the knobs, "carry the light" (it follows the
 * pointer until set down), and "let the scene light itself". "Frame this"
 * opens a framed card of the passage you are reading, at story, square or
 * card proportions, its knobs at hand, for a clean screenshot. Tapping a
 * wonder flares the light toward it.
 *
 * Stage directions (stage-directions.mjs) set all of this from the URL for
 * one visit — ?stage=story&p=3&light=dusk&warmth=0.8&motif=egg#section — and
 * "Copy stage link" writes the current stage back into a link: the named
 * light cue nearest where the sun stands, and only the knobs a reader turned.
 *
 * Reduced motion: no gliding, no flare; every knob still works.
 * Switch: `scene-light` (default on).
 */
import { readStage, stageLink } from './stage-directions.mjs?v=2026_11_06.F';
import { cueForHour } from './tellings.mjs?v=2026_11_09.L';
import { readStory, storyParams } from './story-directions.mjs?v=2026_11_09.L';

const KNOBS_URL = '/book/content/world/knobs.json';
const NUMERIC = ['x', 'y', 'glow', 'warmth', 'ink', 'grain', 'edge'];
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

let configPromise = null;
const loadKnobs = () => {
  configPromise = configPromise || fetch(KNOBS_URL).then((res) => (res.ok ? res.json() : null)).catch(() => null);
  return configPromise;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value * 1000) / 1000;
const pad = (n) => String(n).padStart(2, '0');

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

/** Hue blend along the short way round the wheel. */
function blendHue(from, to, t) {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return (from + delta * t + 360) % 360;
}

const canPopover = () => 'showPopover' in HTMLElement.prototype;
function show(node) {
  if (canPopover()) {
    node.setAttribute('popover', 'manual');
    document.body.append(node);
    node.showPopover();
  } else {
    document.documentElement.append(node);
  }
}
function hide(node) {
  if (!node) return;
  if (node.hasAttribute('popover') && node.matches(':popover-open')) {
    try { node.hidePopover(); } catch { /* already hidden */ }
  }
  node.remove();
}

export function initSceneLight({ chapterData, announce } = {}) {
  const root = document.documentElement;
  const main = document.getElementById('chapter-content');
  if (!main) return () => {};
  const sections = [...main.querySelectorAll('[data-ebook-section]')];
  if (!sections.length) return () => {};

  const enabled = () => root.getAttribute('data-switch-scene-light') === 'on' || !root.hasAttribute('data-switches-ready');
  let config = null;
  let base = null;     // the light copy-climate last set (before steering)
  let held = null;     // the reader's light, when they have taken it
  let active = null;   // the section being read
  let table = null;
  let stage = null;
  let carrying = null;
  let flareTimer = 0;
  const directions = readStage();
  let cue = null;              // the named light cue last set
  let dialLight = false;       // the cue came from the hour dial
  const touched = new Set();   // knobs the reader (or the URL) turned past the cue

  /* The cue nearest where the light stands: links name a light, not coordinates. */
  const nearestCue = (values) => {
    const cues = Object.entries(config?.cues || {});
    if (!cues.length || !values) return null;
    return cues.reduce((best, [name, c]) => {
      const d = (c.x - values.x) ** 2 + (c.y - values.y) ** 2;
      return d < best.d ? { name, d } : best;
    }, { name: null, d: Infinity }).name;
  };

  /* The stage as it stands, as a link anyone can open (stage-directions.mjs). */
  const currentStage = (extra = {}) => {
    const clock = root.dataset.stageClock;
    return {
      knobs: held ? Object.fromEntries([...touched].filter((k) => k in held).map((k) => [k, held[k]])) : {},
      cue: held ? (cue || nearestCue(held)) : directions.cue,
      motif: directions.motif,
      binding: root.dataset.binding || null,
      phrases: clock && clock !== 'canon' ? 'turn' : null,
      at: clock === 'canon' ? 'canon' : clock ? new Date(clock) : null,
      ...extra
    };
  };
  const copyStage = async (button, extra) => {
    // The visit's story directions (an edition, a lens…) ride along with the stage's.
    const here = new URL(window.location.href);
    storyParams(readStory(), here.searchParams);
    const link = stageLink(currentStage(extra), here.toString());
    try {
      await navigator.clipboard.writeText(link);
      button.textContent = 'Stage link copied';
    } catch {
      window.prompt?.call(window, 'Stage link', link);
    }
    settle('Stage link', 'Anyone who opens it sees this light, these words and this frame.', button);
  };

  const token = (key) => config?.knobs?.[key]?.token;
  const read = () => {
    const style = getComputedStyle(root);
    const out = {};
    NUMERIC.forEach((key) => {
      const raw = Number.parseFloat(root.style.getPropertyValue(token(key)) || style.getPropertyValue(token(key)));
      out[key] = Number.isFinite(raw) ? raw : config.knobs[key].default;
    });
    return out;
  };
  const write = (values) => {
    Object.entries(values).forEach(([key, value]) => {
      const knob = config.knobs[key];
      if (knob && Number.isFinite(value)) root.style.setProperty(knob.token, String(round(clamp(value, knob.min, knob.max))));
    });
  };

  /* Steer the light the climate just set toward the active section's motif. */
  const steer = () => {
    if (!config || !enabled()) return;
    if (held) {
      write(held);
      return;
    }
    const current = base || read();
    const motif = directions.motif || active?.dataset.motif;
    const preset = config.motifs?.[motif];
    const t = config.steer ?? 0.45;
    const target = { ...current };
    if (preset) {
      ['glow', 'warmth'].forEach((key) => {
        if (Number.isFinite(preset[key])) target[key] = current[key] + (preset[key] - current[key]) * t;
      });
      if (Number.isFinite(preset.ink)) target.ink = blendHue(current.ink, preset.ink, t);
    }
    const edges = active?.querySelectorAll('.scene-edges li').length || 0;
    target.edge = (preset?.edge ?? config.knobs.edge.default) + edges * (config.edgePerSceneEdge ?? 0.03);
    target.grain = preset?.grain ?? config.knobs.grain.default;
    write(target);
    root.dataset.lightMotif = motif || '';
  };

  /* The page's field light is fixed to the viewport on wide screens and
   * scrolls with the document otherwise; a pointer maps to whichever it is. */
  const pointToLight = (clientX, clientY) => {
    const fixed = getComputedStyle(document.body).backgroundAttachment === 'fixed';
    const x = (clientX / window.innerWidth) * 100;
    const y = fixed
      ? (clientY / window.innerHeight) * 100
      : ((window.scrollY + clientY) / Math.max(document.documentElement.scrollHeight, 1)) * 100;
    return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  };

  const settle = (title, detail, at) => window.dispatchEvent(new CustomEvent('lore:settled', {
    detail: { sigil: '☼', title, detail, at, region: 'main.chapter' }
  }));

  const take = (patch, quiet = false) => {
    held = { ...(held || read()), ...patch };
    if ('x' in patch || 'y' in patch) {
      cue = null;
      dialLight = false;
    }
    root.dataset.lightHeld = 'true';
    write(held);
    if (!quiet) paintTable();
  };

  const applyCue = (name) => {
    const c = config?.cues?.[name];
    if (!c) return false;
    take({ x: c.x, y: c.y, warmth: c.warmth, glow: c.glow }, true);
    cue = name;
    touched.delete('warmth');
    touched.delete('glow');
    paintTable();
    return true;
  };

  const letGo = (at, quiet = false) => {
    held = null;
    cue = null;
    touched.clear();
    delete root.dataset.lightHeld;
    if (base) write(base);
    steer();
    paintTable();
    if (!quiet) settle('The scene lights itself', 'The light goes back to the scene’s own.', at);
  };

  /* The hour dial (tellings.mjs) walks the light with the page's clock —
   * unless the reader has moved the sun by hand, which wins. */
  const onStageClock = (event) => {
    if (!config || !enabled()) return;
    const at = event.detail?.at;
    if (held && !cue && !dialLight) return;
    if (at instanceof Date) {
      if (applyCue(cueForHour(at.getHours()))) dialLight = true;
    } else if (dialLight) {
      dialLight = false;
      if (directions.cue) applyCue(directions.cue);
      else letGo(null, true);
    }
  };

  /* ─── The light table ─────────────────────────────────────────────── */

  const closeTable = () => {
    hide(table);
    table = null;
  };

  const paintTable = () => {
    if (!table) return;
    const values = held || read();
    const dot = table.querySelector('.light-sun');
    if (dot) {
      dot.style.left = `${values.x}%`;
      dot.style.top = `${values.y}%`;
    }
    table.querySelectorAll('input[data-knob]').forEach((input) => {
      const key = input.dataset.knob;
      if (document.activeElement !== input) input.value = String(values[key]);
    });
    table.querySelector('.light-held').textContent = held ? 'You are holding the light.' : 'The scene is lighting itself.';
  };

  const openTable = (button, section) => {
    closeTable();
    const motif = section.dataset.motif;
    const preset = config.motifs?.[motif];
    const sky = el('div', { className: 'light-sky', role: 'slider', tabindex: '0', 'aria-label': 'Where the light stands: drag the sun' },
      el('span', { className: 'light-sun', 'aria-hidden': 'true' }));
    const knobRow = (key) => {
      const knob = config.knobs[key];
      const input = el('input', { type: 'range', min: knob.min, max: knob.max, step: knob.step, 'data-knob': key, 'aria-label': knob.label });
      input.addEventListener('input', () => { touched.add(key); take({ [key]: Number(input.value) }, true); });
      input.addEventListener('change', () => settle(`${knob.label} held`, knob.reads ? `${knob.reads.charAt(0).toUpperCase()}${knob.reads.slice(1)}.` : '', input));
      return el('label', { className: 'light-knob' }, el('span', {}, knob.label), input);
    };
    const carry = el('button', { type: 'button', className: 'light-action' }, 'Carry the light');
    const release = el('button', { type: 'button', className: 'light-action is-quiet' }, 'Let the scene light itself');
    const framer = el('button', { type: 'button', className: 'light-action' }, 'Frame this');
    const linker = el('button', { type: 'button', className: 'light-action is-quiet' }, 'Copy stage link');
    linker.addEventListener('click', () => copyStage(linker, { section: section.id || null }));
    table = el('div', { className: 'light-table', role: 'dialog', 'aria-label': 'The light table' },
      el('div', { className: 'light-head' },
        el('span', { className: 'light-kicker' }, '☼ The light table'),
        el('button', { type: 'button', className: 'light-close', 'aria-label': 'Close' }, '×')),
      section.dataset.sceneLight ? el('p', { className: 'light-scene' }, el('span', {}, 'The scene’s own light · '), section.dataset.sceneLight) : null,
      preset ? el('p', { className: 'light-steer' }, `Steered by ${motif.replace(/-/g, ' ')}: ${preset.says}.`) : null,
      el('div', { className: 'light-cues', role: 'group', 'aria-label': 'Light cues' },
        ...Object.entries(config.cues || {}).map(([name, c]) => {
          const chip = el('button', { type: 'button', className: `light-cue${cue === name ? ' is-on' : ''}`, title: c.says, 'data-cue': name }, name);
          chip.addEventListener('click', () => {
            applyCue(name);
            dialLight = false;
            table.querySelectorAll('.light-cue').forEach((x) => x.classList.toggle('is-on', x === chip));
            settle(`Light cue: ${name}`, `${c.says.charAt(0).toUpperCase()}${c.says.slice(1)}.`, chip);
          });
          return chip;
        })),
      sky,
      el('div', { className: 'light-knobs' }, ...['glow', 'warmth', 'ink', 'grain', 'edge'].map(knobRow)),
      el('p', { className: 'light-held' }),
      el('div', { className: 'light-actions' }, carry, framer, release, linker));

    const fromSky = (event) => {
      const box = sky.getBoundingClientRect();
      take({ x: clamp(((event.clientX - box.left) / box.width) * 100, 0, 100), y: clamp(((event.clientY - box.top) / box.height) * 100, 0, 100) });
    };
    sky.addEventListener('pointerdown', (event) => {
      sky.setPointerCapture(event.pointerId);
      fromSky(event);
      const move = (e) => fromSky(e);
      const up = () => {
        sky.removeEventListener('pointermove', move);
        settle('The sun stays where you set it', 'Drag again to move it; let go to give it back.', sky);
      };
      sky.addEventListener('pointermove', move);
      sky.addEventListener('pointerup', up, { once: true });
    });
    sky.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 10 : 3;
      const values = held || read();
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!moves) return;
      event.preventDefault();
      take({ x: clamp(values.x + moves[0], 0, 100), y: clamp(values.y + moves[1], 0, 100) });
    });
    table.querySelector('.light-close').addEventListener('click', closeTable);
    carry.addEventListener('click', () => startCarrying(carry));
    release.addEventListener('click', () => letGo(release));
    framer.addEventListener('click', () => {
      closeTable();
      openFrame(section);
    });

    show(table);
    const box = button.getBoundingClientRect();
    const narrow = window.matchMedia('(max-width: 40rem)').matches;
    table.classList.toggle('is-sheet', narrow);
    if (!narrow) {
      const width = table.offsetWidth || 320;
      const height = table.offsetHeight || 360;
      table.style.left = `${Math.round(clamp(box.left + box.width / 2 - width / 2, 10, window.innerWidth - width - 10))}px`;
      table.style.top = `${Math.round(box.top - height - 10 > 10 ? box.top - height - 10 : Math.min(box.bottom + 10, window.innerHeight - height - 10))}px`;
    }
    paintTable();
  };

  /* Carry the light: it follows the pointer until it is set down. */
  const startCarrying = (button) => {
    closeTable();
    root.dataset.lightCarried = 'true';
    settle('You are carrying the light', 'It follows you. Tap or click to set it down.', button);
    const move = (event) => take(pointToLight(event.clientX, event.clientY), true);
    const drop = (event) => {
      event.preventDefault();
      event.stopPropagation();
      take(pointToLight(event.clientX, event.clientY), true);
      stopCarrying();
      settle('The light stays where you set it down', 'Hold the light again to move it, or let the scene light itself.', null);
    };
    carrying = { move, drop };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', drop, { capture: true, once: true });
  };
  const stopCarrying = () => {
    if (!carrying) return;
    window.removeEventListener('pointermove', carrying.move);
    window.removeEventListener('pointerdown', carrying.drop, { capture: true });
    carrying = null;
    delete root.dataset.lightCarried;
  };

  /* ─── Frame this: a passage set for a screenshot ─────────────────────── */

  const closeFrame = () => {
    hide(stage);
    stage = null;
    delete root.dataset.framing;
  };

  const openFrame = (section, opts = {}) => {
    closeFrame();
    const paragraphs = [...section.querySelectorAll(':scope > p:not(.section-marks)')].filter((p) => p.textContent.trim());
    if (!paragraphs.length) return;
    const band = window.innerHeight / 2;
    let index = paragraphs.reduce((best, p, i) => {
      const box = p.getBoundingClientRect();
      const d = Math.abs(box.top + box.height / 2 - band);
      return d < best.d ? { i, d } : best;
    }, { i: 0, d: Infinity }).i;
    if (Number.isInteger(opts.paragraph)) index = Math.min(Math.max(opts.paragraph - 1, 0), paragraphs.length - 1);
    let whole = opts.paragraph === 'all';
    let aspect = opts.aspect || 'story';
    const number = Number(chapterData?.chapterNumber || 0);
    const title = section.querySelector('h2, h3')?.textContent?.trim() || section.dataset.voiceKicker || '';
    const text = el('div', { className: 'frame-text' });
    const card = el('div', { className: 'frame-card', 'data-aspect': aspect },
      el('p', { className: 'frame-kicker' }, `LORE . LAND · Chapter ${pad(number)}${chapterData?.title ? ` · ${chapterData.title}` : ''}`),
      title ? el('p', { className: 'frame-title' }, title) : null,
      text,
      el('p', { className: 'frame-foot' }, `lore.land/book/chapter/${pad(number)}/${section.id ? `#${section.id}` : ''}`));
    let sized = false;
    const fill = () => {
      const chosen = whole ? paragraphs : [paragraphs[index]];
      // Until the reader sets the type, a short line is set large and a long passage smaller.
      if (!sized) {
        const length = chosen.reduce((n, p) => n + p.textContent.length, 0);
        const fit = length < 140 ? 1.75 : length < 320 ? 1.45 : length < 640 ? 1.2 : 1.02;
        card.style.setProperty('--frame-type', `${fit}rem`);
        size.value = String(fit);
      }
      text.replaceChildren(...chosen.map((p) => {
        const copy = p.cloneNode(true);
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
        return copy;
      }));
    };
    const aspectButtons = Object.entries(config.frames || {}).map(([id, frame]) => {
      const b = el('button', { type: 'button', className: `frame-aspect${id === aspect ? ' is-on' : ''}`, 'data-aspect': id }, frame.label);
      b.addEventListener('click', () => {
        aspect = id;
        card.dataset.aspect = id;
        bar.querySelectorAll('.frame-aspect').forEach((x) => x.classList.toggle('is-on', x === b));
      });
      return b;
    });
    const prev = el('button', { type: 'button', className: 'frame-step', 'aria-label': 'Previous paragraph' }, '◀');
    const next = el('button', { type: 'button', className: 'frame-step', 'aria-label': 'Next paragraph' }, '▶');
    const all = el('button', { type: 'button', className: `frame-step${whole ? ' is-on' : ''}` }, 'Whole section');
    prev.addEventListener('click', () => { whole = false; index = (index - 1 + paragraphs.length) % paragraphs.length; fill(); });
    next.addEventListener('click', () => { whole = false; index = (index + 1) % paragraphs.length; fill(); });
    all.addEventListener('click', () => { whole = !whole; all.classList.toggle('is-on', whole); fill(); });
    const size = el('input', { type: 'range', min: '0.85', max: '1.7', step: '0.01', value: '1.15', 'aria-label': 'Type size' });
    size.addEventListener('input', () => {
      sized = true;
      card.style.setProperty('--frame-type', `${size.value}rem`);
    });
    if (opts.type) {
      sized = true;
      size.value = String(opts.type);
      card.style.setProperty('--frame-type', `${opts.type}rem`);
    }
    const knob = (key) => {
      const k = config.knobs[key];
      const input = el('input', { type: 'range', min: k.min, max: k.max, step: k.step, value: String((held || read())[key]), 'aria-label': k.label });
      input.addEventListener('input', () => { touched.add(key); take({ [key]: Number(input.value) }, true); });
      return el('label', { className: 'frame-knob' }, el('span', {}, k.label), input);
    };
    const done = el('button', { type: 'button', className: 'frame-done' }, 'Done');
    done.addEventListener('click', closeFrame);
    const linker = el('button', { type: 'button', className: 'frame-link' }, 'Copy stage link');
    linker.addEventListener('click', () => copyStage(linker, {
      section: section.id || null,
      aspect,
      paragraph: whole ? 'all' : index + 1,
      type: sized ? Number(size.value) : null
    }));
    const bar = el('div', { className: 'frame-bar' },
      el('div', { className: 'frame-group' }, ...aspectButtons),
      el('div', { className: 'frame-group' }, prev, next, all),
      el('label', { className: 'frame-knob' }, el('span', {}, 'Type'), size),
      ...['glow', 'warmth', 'edge', 'grain'].map(knob),
      linker,
      done);
    stage = el('div', { className: 'frame-stage', role: 'dialog', 'aria-label': 'Frame for a screenshot' }, card, bar);
    fill();
    root.dataset.framing = 'true';
    show(stage);
    // The bar steps back after a moment so the screenshot is clean; any movement brings it back.
    let quiet = 0;
    const wake = () => {
      bar.classList.remove('is-quiet');
      clearTimeout(quiet);
      quiet = setTimeout(() => bar.classList.add('is-quiet'), 2600);
    };
    if (opts.controls === 'off') {
      bar.classList.add('is-hidden');
    } else {
      stage.addEventListener('pointermove', wake);
      stage.addEventListener('keydown', wake);
      wake();
    }
    announce?.('Framed for a screenshot. The controls step back after a moment; Escape closes.');
  };

  /* ─── Tools at the end of each section ───────────────────────────────── */

  const tools = sections.map((section) => {
    const row = el('div', { className: 'scene-tools', 'aria-label': 'Light and frame this scene' });
    const light = el('button', { type: 'button', className: 'scene-tool' }, '☼ Hold the light');
    const frame = el('button', { type: 'button', className: 'scene-tool' }, '▢ Frame this');
    light.addEventListener('click', (event) => { event.stopPropagation(); if (config) openTable(light, section); });
    frame.addEventListener('click', (event) => { event.stopPropagation(); if (config) openFrame(section); });
    row.append(light, frame);
    section.append(row);
    return row;
  });

  /* Which section is being read. */
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    const hit = entries.filter((e) => e.isIntersecting).map((e) => e.target)[0];
    if (hit && hit !== active) {
      active = hit;
      requestAnimationFrame(steer);
    }
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 }) : null;
  sections.forEach((section) => observer?.observe(section));

  const onClimate = () => {
    if (!config) return;
    if (!held) base = read();
    steer();
  };
  const onWonder = (event) => {
    const at = event.detail?.at;
    if (!config || !enabled() || held || reduced?.matches || !(at instanceof Element)) return;
    const box = at.getBoundingClientRect();
    const point = pointToLight(box.left + box.width / 2, box.top + box.height / 2);
    const before = read();
    write({ ...point, glow: Math.min(1, before.glow + 0.25) });
    clearTimeout(flareTimer);
    flareTimer = setTimeout(() => { write(before); }, 1600);
  };
  const onKey = (event) => {
    if (event.key !== 'Escape') return;
    if (stage) closeFrame();
    else if (table) closeTable();
    else if (carrying) stopCarrying();
  };
  const onOutside = (event) => {
    if (table && !table.contains(event.target) && !event.target.closest?.('.scene-tool')) closeTable();
  };

  window.addEventListener('lore:copy-climate', onClimate);
  window.addEventListener('lore:wonder', onWonder);
  window.addEventListener('lore:stage-clock', onStageClock);
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onOutside);
  loadKnobs().then((data) => {
    config = data;
    if (!config) return;
    root.dataset.sceneKnobs = 'ready';
    base = read();
    // Stage directions from the URL: the motif's light first, the cue held
    // over it, the turned knobs over that, then the frame.
    steer();
    if (directions.cue) applyCue(directions.cue);
    if (Object.keys(directions.knobs).length) {
      Object.keys(directions.knobs).forEach((key) => touched.add(key));
      take(directions.knobs, true);
    }
    steer();
    if (directions.aspect) {
      const target = sections.find((s) => s.id && s.id === directions.section) || sections[0];
      target.scrollIntoView({ block: 'center' });
      setTimeout(() => openFrame(target, directions), 450);
    }
  });

  return () => {
    observer?.disconnect();
    stopCarrying();
    closeTable();
    closeFrame();
    tools.forEach((row) => row.remove());
    window.removeEventListener('lore:copy-climate', onClimate);
    window.removeEventListener('lore:wonder', onWonder);
    window.removeEventListener('lore:stage-clock', onStageClock);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onOutside);
  };
}
