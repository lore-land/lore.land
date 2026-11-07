/**
 * reading-nook.mjs — three dials for the room the reader sits in.
 *
 *   coziness  --cozy          0.6 snug … 1.5 roomy   every gap, pad and the leading
 *   texture   --nook-texture  0 plain paper … 1 lively   grain, glows, tints, vignette
 *   light     data-nook-light day · dusk · lamp          the room's own light
 *   hearth    (Web Audio)     0 silent … 1 rain & embers   synthesized, no files
 *   binding   data-binding    rag · glass · salt · ember · slate · starfield
 *             the book's paper and ink, chosen from a shelf of spines (PLAN.E L25);
 *             lamplight takes a light binding into the dark, the dark ones keep
 *             their own night. ?binding=glass binds it for one visit.
 *
 * State lives in localStorage (lore.nook.v1). The chapter template's head
 * script applies coziness and texture before first paint so a returning
 * reader never sees the room rearrange itself; this module owns the panel
 * and the sound. Sound only ever starts from the reader's own gesture.
 */

import { settle } from './settled.mjs?v=2026_11_05.B';

const NOOK_KEY = 'lore.nook.v1';
const DEFAULTS = Object.freeze({ cozy: 1, texture: 0.6, light: 0, hearth: 0, binding: 'rag' });

/** The bindings on the shelf: paper, ink and the room each brings. `tone` dark keeps its own night. */
export const BINDINGS = Object.freeze([
  { id: 'rag', spine: 'Rag', name: 'Rag paper', says: 'Cream rag, iron-gall ink: the book as it was first bound.', paper: '#f3ede1', ink: '#1c4f63', band: '#a67c38', tone: 'light', chrome: '#f3ede1' },
  { id: 'glass', spine: 'Glass', name: 'Bonk glass', says: 'Sea-glass pages and bottle-green ink, glass that remembers being struck.', paper: '#dce9e3', ink: '#0f4a44', band: '#5aa79d', tone: 'light', chrome: '#dfe9e4' },
  { id: 'salt', spine: 'Salt', name: 'Salt flat', says: 'Bleached white and sky-blue ink, all glare and air.', paper: '#f7f8f5', ink: '#284e6c', band: '#c47c58', tone: 'light', chrome: '#f4f5f2' },
  { id: 'ember', spine: 'Clay', name: 'Hearth clay', says: 'Terracotta and soot-brown ink, warm from the oven wall.', paper: '#f1e1cf', ink: '#6f3420', band: '#c86d2c', tone: 'light', chrome: '#f1e3d3' },
  { id: 'slate', spine: 'Slate', name: 'Slate & chalk', says: 'A schoolroom slate: chalk-white words, chalk-yellow marks. Cheaper than oak.', paper: '#262e30', ink: '#ecebe4', band: '#f0d46a', tone: 'dark', chrome: '#1f2526' },
  { id: 'starfield', spine: 'Stars', name: 'Starfield', says: 'Night-blue cloth stamped with pale stars, for reading outdoors.', paper: '#141e34', ink: '#eef3ff', band: '#7ed0ff', tone: 'dark', chrome: '#0e1526' }
]);
const bindingFor = (id) => BINDINGS.find((binding) => binding.id === id) || BINDINGS[0];

const DIALS = Object.freeze([
  {
    id: 'cozy', label: 'Coziness', min: 0.6, max: 1.5, step: 0.05,
    words: [[0.8, 'snug'], [1.15, 'cozy'], [Infinity, 'roomy']],
    effect: (v) => v < 0.8 ? 'Lines sit closer; more story per screen.' : v < 1.15 ? 'The page breathes at its usual pace.' : 'Wide margins and air between the lines.'
  },
  {
    id: 'texture', label: 'Texture', min: 0, max: 1, step: 0.05,
    words: [[0.15, 'plain paper'], [0.8, 'soft grain'], [Infinity, 'lively']],
    effect: (v) => v < 0.15 ? 'A flat page, nothing moving.' : v < 0.8 ? 'A faint grain under the words.' : 'Grain and motion in the paper, like a lit room.'
  },
  {
    id: 'light', label: 'Light', min: 0, max: 1, step: 0.5,
    words: [[0.25, 'daylight'], [0.75, 'dusk'], [Infinity, 'lamplight']],
    effect: (v) => v < 0.25 ? 'Read by day: the page at its brightest.' : v < 0.75 ? 'The room dims toward evening.' : 'A lamp on the page; the room goes dark around it.'
  },
  {
    id: 'hearth', label: 'Hearth', min: 0, max: 1, step: 0.05,
    words: [[0.001, 'silent'], [0.4, 'a whisper of rain'], [Infinity, 'rain & embers']],
    effect: (v) => v < 0.001 ? 'The room is quiet.' : v < 0.4 ? 'Rain, faintly, behind the story.' : 'Rain and a fire, for as long as this tab is open.'
  }
]);

function readNook() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}');
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeNook(state) {
  try {
    window.localStorage.setItem(NOOK_KEY, JSON.stringify(state));
  } catch {
    // Private mode: the dials still work for this visit.
  }
}

function clampDial(dial, value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(dial.max, Math.max(dial.min, n)) : DEFAULTS[dial.id];
}

function wordFor(dial, value) {
  return dial.words.find(([limit]) => value < limit)?.[1] || '';
}

export function textureBand(value) {
  return value < 0.15 ? 'plain' : value > 0.8 ? 'lively' : 'soft';
}

export function lightBand(value) {
  return value < 0.25 ? 'day' : value < 0.75 ? 'dusk' : 'lamp';
}

/** The binding on show: a stage direction (?binding=) for this visit, else the reader's own. */
function shownBinding(state) {
  try {
    const staged = new URLSearchParams(window.location.search).get('binding');
    if (BINDINGS.some((binding) => binding.id === staged)) return staged;
  } catch { /* no URL */ }
  return bindingFor(state.binding).id;
}

/** Same writes the template's head script makes, kept in one place here. */
function applyRoom(state) {
  const root = document.documentElement;
  root.style.setProperty('--cozy', String(state.cozy));
  root.style.setProperty('--nook-texture', String(state.texture));
  root.dataset.nookTexture = textureBand(state.texture);
  root.dataset.nookLight = lightBand(state.light);
  const binding = bindingFor(shownBinding(state));
  if (binding.id === 'rag') {
    delete root.dataset.binding;
    delete root.dataset.bindingTone;
  } else {
    root.dataset.binding = binding.id;
    root.dataset.bindingTone = binding.tone;
  }
  // The browser chrome (and an installed app's title bar) follows the room.
  const theme = document.getElementById('theme-color');
  if (theme) {
    const lamp = lightBand(state.light) === 'lamp' && binding.tone !== 'dark';
    theme.setAttribute('content', lamp ? '#161d16' : binding.id !== 'rag' ? binding.chrome : { day: '#f3ede1', dusk: '#e7dbc6' }[lightBand(state.light)]);
  }
}

/* A rebinding sweeps across the page like a turned board, where the browser can. */
function rebind(change) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && typeof document.startViewTransition === 'function') {
    document.documentElement.dataset.rebinding = 'true';
    const transition = document.startViewTransition(change);
    // A sweep that cannot finish (a starved or hidden tab) never holds the page.
    const skip = setTimeout(() => transition.skipTransition?.(), 1500);
    transition.finished.finally(() => {
      clearTimeout(skip);
      delete document.documentElement.dataset.rebinding;
    });
  } else {
    change();
  }
}

/* ─── Hearth: brown-noise rain through a breathing lowpass, plus embers ── */

function createHearth() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Four seconds of brown noise, ends blended so the loop has no seam.
  const length = ctx.sampleRate * 4;
  const rainBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = rainBuffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const seam = Math.floor(ctx.sampleRate * 0.25);
  for (let i = 0; i < seam; i += 1) {
    const mix = i / seam;
    data[length - seam + i] = data[length - seam + i] * (1 - mix) + data[i] * mix;
  }

  const rain = ctx.createBufferSource();
  rain.buffer = rainBuffer;
  rain.loop = true;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1000;
  const breath = ctx.createOscillator();
  breath.frequency.value = 0.06;
  const breathDepth = ctx.createGain();
  breathDepth.gain.value = 260;
  breath.connect(breathDepth).connect(lowpass.frequency);
  rain.connect(lowpass).connect(master);
  rain.start();
  breath.start();

  // Embers: short filtered clicks, clustered, never regular.
  const popBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  popBuffer.getChannelData(0).forEach((_, i, arr) => { arr[i] = Math.random() * 2 - 1; });
  const emberBus = ctx.createGain();
  emberBus.gain.value = 0;
  emberBus.connect(master);

  const pop = () => {
    const t = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = popBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1400 + Math.random() * 3000;
    band.Q.value = 0.9;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.2 + Math.random() * 0.45, t + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.025 + Math.random() * 0.07);
    source.connect(band).connect(env).connect(emberBus);
    source.start(t);
    source.stop(t + 0.12);
  };

  let emberTimer = 0;
  let level = 0;
  const scheduleEmbers = () => {
    clearTimeout(emberTimer);
    if (level <= 0 || ctx.state !== 'running') {
      return;
    }
    pop();
    if (Math.random() < 0.3) {
      setTimeout(pop, 30 + Math.random() * 90);
    }
    emberTimer = setTimeout(scheduleEmbers, 180 + Math.random() * (1600 - level * 900));
  };

  const set = async (value) => {
    level = value;
    const now = ctx.currentTime;
    // Perceived loudness: square the dial, keep the ceiling gentle.
    master.gain.setTargetAtTime(value * value * 0.32, now, 0.35);
    // Embers only join once the rain is established.
    emberBus.gain.setTargetAtTime(Math.max(0, value - 0.35) * 0.9, now, 0.5);
    if (value > 0 && ctx.state !== 'running') {
      await ctx.resume().catch(() => {});
    }
    scheduleEmbers();
    if (value <= 0) {
      setTimeout(() => {
        if (level <= 0) {
          ctx.suspend().catch(() => {});
        }
      }, 1600);
    }
  };

  const onVisibility = () => {
    if (document.hidden) {
      ctx.suspend().catch(() => {});
    } else if (level > 0) {
      ctx.resume().then(scheduleEmbers).catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    set,
    destroy() {
      clearTimeout(emberTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      ctx.close().catch(() => {});
    }
  };
}

/* ─── Panel ─────────────────────────────────────────────────────────── */

export function initReadingNook({ announce } = {}) {
  const state = readNook();
  DIALS.forEach((dial) => { state[dial.id] = clampDial(dial, state[dial.id]); });
  applyRoom(state);

  const aside = document.querySelector('aside');
  let hearth = null;
  const ensureHearth = () => {
    if (!hearth) {
      hearth = createHearth();
    }
    return hearth;
  };

  const panel = document.createElement('section');
  panel.className = 'reading-nook';
  panel.setAttribute('aria-label', 'Reading nook');
  const heading = document.createElement('h2');
  heading.textContent = 'Reading nook';
  panel.append(heading);

  const readouts = {};
  DIALS.forEach((dial) => {
    const row = document.createElement('label');
    row.className = 'reading-nook-dial';
    row.dataset.dial = dial.id;

    const name = document.createElement('span');
    name.className = 'reading-nook-name';
    name.textContent = dial.label;

    const readout = document.createElement('output');
    readout.className = 'reading-nook-readout';
    readouts[dial.id] = readout;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(dial.min);
    input.max = String(dial.max);
    input.step = String(dial.step);
    input.value = String(state[dial.id]);
    input.setAttribute('aria-valuetext', wordFor(dial, state[dial.id]));

    input.addEventListener('input', () => {
      const value = clampDial(dial, input.value);
      state[dial.id] = value;
      readout.textContent = wordFor(dial, value);
      input.setAttribute('aria-valuetext', readout.textContent);
      if (dial.id === 'hearth') {
        ensureHearth()?.set(value);
      } else {
        applyRoom(state);
      }
    });
    input.addEventListener('change', () => {
      writeNook(state);
      announce?.(`${dial.label}: ${readout.textContent}.`);
      settle({ sigil: '.', title: `${dial.label}: ${readout.textContent}`, detail: dial.effect?.(state[dial.id]) || '', at: input, region: dial.id === 'hearth' ? null : 'main.chapter' });
    });

    readout.textContent = wordFor(dial, state[dial.id]);
    row.append(name, readout, input);
    panel.append(row);
  });

  /* The binding: a shelf of spines. The one the book is bound in stands out. */
  const shelf = document.createElement('div');
  shelf.className = 'reading-nook-binding';
  const shelfName = document.createElement('span');
  shelfName.className = 'reading-nook-name';
  shelfName.textContent = 'Binding';
  const shelfReadout = document.createElement('output');
  shelfReadout.className = 'reading-nook-readout';
  const spines = document.createElement('div');
  spines.className = 'binding-shelf';
  spines.setAttribute('role', 'radiogroup');
  spines.setAttribute('aria-label', 'Binding');
  const says = document.createElement('p');
  says.className = 'binding-says';
  const paintShelf = () => {
    const current = shownBinding(state);
    const binding = bindingFor(current);
    shelfReadout.textContent = binding.name;
    says.textContent = binding.says + (binding.tone !== 'dark' && lightBand(state.light) === 'lamp' ? ' Lamplight takes it into the dark.' : '');
    spines.querySelectorAll('.binding-spine').forEach((spine) => {
      const on = spine.dataset.binding === current;
      spine.setAttribute('aria-checked', on ? 'true' : 'false');
      spine.tabIndex = on ? 0 : -1;
    });
  };
  BINDINGS.forEach((binding, index) => {
    const spine = document.createElement('button');
    spine.type = 'button';
    spine.className = 'binding-spine';
    spine.dataset.binding = binding.id;
    spine.setAttribute('role', 'radio');
    spine.setAttribute('aria-label', binding.name);
    spine.title = binding.name;
    spine.style.setProperty('--spine-paper', binding.paper);
    spine.style.setProperty('--spine-ink', binding.ink);
    spine.style.setProperty('--spine-band', binding.band);
    spine.style.setProperty('--spine-lean', `${((index * 7) % 5) - 2}deg`);
    const stamp = document.createElement('span');
    stamp.className = 'binding-spine-title';
    stamp.textContent = binding.spine;
    spine.append(stamp);
    spine.addEventListener('click', () => {
      if (state.binding === binding.id && shownBinding(state) === binding.id) return;
      state.binding = binding.id;
      rebind(() => {
        // A chosen binding outlasts a stage direction's: drop ?binding= from this page's address.
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.has('binding')) {
            url.searchParams.delete('binding');
            window.history.replaceState(window.history.state, '', url);
          }
        } catch { /* keep the address */ }
        applyRoom(state);
        paintShelf();
      });
      writeNook(state);
      announce?.(`Bound in ${binding.name}.`);
      settle({ sigil: '❘', title: `Bound in ${binding.name}`, detail: binding.says, at: spine, region: 'main.chapter' });
    });
    spine.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = spines.children[(index + step + BINDINGS.length) % BINDINGS.length];
      next.focus();
      next.click();
    });
    spines.append(spine);
  });
  shelf.append(shelfName, shelfReadout, spines, says);
  panel.append(shelf);
  paintShelf();
  panel.addEventListener('change', paintShelf);

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'reading-nook-reset';
  reset.textContent = 'Back to the usual room';
  reset.addEventListener('click', () => {
    Object.assign(state, DEFAULTS);
    panel.querySelectorAll('.reading-nook-dial').forEach((row) => {
      const dial = DIALS.find((entry) => entry.id === row.dataset.dial);
      const input = row.querySelector('input');
      input.value = String(state[dial.id]);
      readouts[dial.id].textContent = wordFor(dial, state[dial.id]);
    });
    rebind(() => {
      applyRoom(state);
      paintShelf();
    });
    hearth?.set(0);
    writeNook(state);
    announce?.('Reading nook reset.');
    settle({ sigil: '.', title: 'The usual room', detail: 'Cozy, soft grain, daylight, quiet, rag paper.', at: reset, region: 'main.chapter' });
  });
  panel.append(reset);

  if (aside) {
    const scale = aside.querySelector('.reader-scale-controls');
    if (scale) {
      scale.insertAdjacentElement('afterend', panel);
    } else {
      aside.append(panel);
    }
  }

  // A hearth left burning last visit relights on the first touch or key —
  // browsers only let sound begin from a gesture, which is also only fair.
  let relight = null;
  if (state.hearth > 0) {
    const hearthDial = DIALS.find((dial) => dial.id === 'hearth');
    readouts.hearth.textContent = `${wordFor(hearthDial, state.hearth)} · tap to relight`;
    relight = () => {
      ensureHearth()?.set(state.hearth);
      readouts.hearth.textContent = wordFor(hearthDial, state.hearth);
      window.removeEventListener('pointerdown', relight);
      window.removeEventListener('keydown', relight);
    };
    window.addEventListener('pointerdown', relight, { once: true });
    window.addEventListener('keydown', relight, { once: true });
  }

  return () => {
    if (relight) {
      window.removeEventListener('pointerdown', relight);
      window.removeEventListener('keydown', relight);
    }
    hearth?.destroy();
    panel.remove();
  };
}
