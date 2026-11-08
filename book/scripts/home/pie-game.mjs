/**
 * pie-game.mjs — Exactly One Pie (PLAN.E L28).
 *
 * Someone is destined to spill exactly one pie. Someone in a hat carries
 * one up the lanes of Bonk City while the city streams down at them, and
 * steps across it, never along it, one lane-length at a time
 * (story-boonhonk.spw#trope_physics, orthogonal_motion).
 *
 *   the hat    it is not always him under it. The chosen title floats, like the hat,
 *              and may be worn by the wrong person for a scene without becoming false
 *              (trope_physics, chosen_one). Each run the hat settles on someone — the
 *              figure in plain lines, the porter, a feast clerk, the Genie, a clown —
 *              and at a cut it may move on. Each carries differently.
 *   clowns     clowns love WAP: a pie in the face. They drift toward the pie; step into
 *              one and WAP — it gets the pie, square, and loves it, and the pie on the
 *              plate is no smaller (wonder_about_pie: one pie that remains whole after
 *              being served). A WAP jostles the plate. It is not a spill.
 *   step       ← → or A D, a tap on either half of the lane, a swipe, or the step buttons
 *   wobble     every step tilts the pie; steps in a hurry tilt it more; puddles slip it;
 *              it settles if you let it. Tilted all the way, it goes.
 *   Boof       now and then she crosses the lanes on her own business. Brush past her
 *              and the pie steadies: she works for the land, and the land likes a level pie.
 *   scenes     the city changes under the carry — the parcel gate in a storm, the lanes,
 *              the plaza, the long table — said in a toast at the top of the screen
 *              while the colours cross over and play goes on; a beat with nothing new
 *              in the lanes lets the next place arrive. Only the prophecy and the
 *              spill get a whole silent-film card.
 *   the end    always exactly one spill. The prophecy holds; what changes is who was
 *              under the hat, how far they carried it, and how many clowns got WAP.
 *              The hat does not fall. It never has.
 *   sound      a WAP is heard (synthesized: a splat and a horn); the toggle remembers.
 *   presences  two of the quinary five come and go. Mr. BoonWAP, a sentient pie who means
 *              well, holds court at the head of the lanes: clowns flock, every pie finds an
 *              eye, and he flings slices of himself into theirs (he is never smaller). Mr.
 *              BaneWAP, his foil, meddles: he announces a scheme — a rented wind, a tax on
 *              every step, the lanes re-let — and, being a proper cartoon villain, leaves a
 *              visible off switch in one lane. Step on it and he is foiled. They never share
 *              the stage. (spwashi.com, RPG Wednesday: the quinary story bible.)
 *   flour      a sack of flour does not spill the pie: it slows the carry, and pushes it
 *              back in the story — back along this place, or, early on, back to the last.
 *              The track at the top shows where in the story the carry is.
 *   throw      ↑ W, Space, a swipe up or the throw button: a slice flies up the lane (the pie on
 *              the plate is never smaller; the next slice takes a moment). A clown or Mr.
 *              BaneWAP's off switch in the lane wears a ring that turns gold in the moment to
 *              throw: a throw in that moment is Perfect — the WAP counts twice, the pie
 *              steadies, and a switch is foiled from afar. Point-blank still lands, and jostles.
 *   rows       the city comes in rows, and every row leaves a way through no more than one
 *              step from the last; things that drift stay near their own lane; the start is
 *              gentle, and the pace builds by the place and the minute.
 *   ?scene=    gate | lanes | plaza | court | table — a link can start the carry in that place;
 *   ?from=     and remember where the reader found the game, to send them back there
 *              (pie-segues.mjs: the doors in the chapters, and the way out of each level).
 *
 * Drawn on a canvas in the page's own colours (the reader's binding: --hub-*),
 * except the figure, who is always the same plain ink drawing — he sticks out
 * of every scene he is in. He is never named here; the others are named by
 * what they do.
 *
 * Kept: lore.pie.v1 = { best, runs, waps, bestWaps, causes, carriers, sound }
 * (begin-again.mjs clears it with a fresh copy). Reduced motion: no rain, no bob,
 * no flying clowns; every control the same.
 */

import { segueFor, storyHref, chapterWords, safeReturn, describeReturn, leaveBackNote } from '../modules/pie-segues.mjs?v=2026_11_07.D';

const KEY = 'lore.pie.v1';
const W = 360;
const H = 560;
const LANES = 5;
const LANE_W = W / LANES;
const PLAYER_Y = H - 92;
const COBBLE = 24;            // px of scroll per cobble
const PRESENCE_Y = 150;       // where Mr. BoonWAP and Mr. BaneWAP float: below the toasts, above the carry
const SCENE_LENGTH = 300;     // cobbles per scene
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const SCENES = Object.freeze([
  { id: 'gate', card: 'The parcel gate, in a storm.', tint: 'night', rain: true, kinds: ['sack', 'sack', 'pigeon', 'post'] },
  { id: 'lanes', card: 'The lanes, which curve for everyone.', tint: 'bronze', rain: false, kinds: ['post', 'post', 'snail', 'spool', 'pigeon'] },
  { id: 'plaza', card: 'The plaza, where the pie holds court.', tint: 'ember', rain: false, kinds: ['clerk', 'wasps', 'post', 'spool', 'dividers', 'banner'], presence: 'boon' },
  { id: 'court', card: 'The rented court, arriving in pieces.', tint: 'berry', rain: false, kinds: ['throne', 'subject', 'wasps', 'post', 'banner'], presence: 'bane' },
  { id: 'table', card: 'The long table. A second place is set.', tint: 'gold', rain: false, kinds: ['chair', 'chair', 'clerk', 'dividers', 'wasps', 'table'] }
]);
const WIDE = new Set(['banner', 'table']);

/* Mr. BaneWAP's schemes: each announced, each with an off switch. */
const SCHEMES = Object.freeze({
  wind: {
    says: '“Behold: a rented wind! Let us see how level your little pie stays.”',
    foiled: '“Curses. The wind was only rented anyway.”'
  },
  tax: {
    says: '“Every step shall be taxed. Every. Single. Step.”',
    foiled: '“Untaxed! Again! Do you know what a ledger costs?”'
  },
  relet: {
    says: '“These lanes are hereby re-let. Under new management. Mine.”',
    foiled: '“The lease is void? Who reads a lease?”'
  }
});

/* Who the hat settles on. Each carries the pie their own way. */
const CARRIERS = Object.freeze([
  { id: 'figure', name: 'the figure in plain lines', weight: 4, step: 0.09, wobble: 0.18, hurried: 0.3, settle: 0.5, width: 24 },
  { id: 'porter', name: 'the porter from the parcel gate', weight: 2, step: 0.13, wobble: 0.12, hurried: 0.22, settle: 0.56, width: 28, says: 'Steady as a sack of flour, and as quick.' },
  { id: 'clerk', name: 'a feast clerk', weight: 1.5, step: 0.065, wobble: 0.23, hurried: 0.36, settle: 0.46, width: 19, says: 'Quick, precise, and nervous about the paperwork.' },
  { id: 'genie', name: 'the Genie, off-season', weight: 1.5, step: 0.15, wobble: 0.16, hurried: 0.26, settle: 0.7, width: 24, says: 'Glides. Settles a pie the way he settles a price.' },
  { id: 'clown', name: 'a clown', weight: 1, step: 0.09, wobble: 0.25, hurried: 0.4, settle: 0.42, width: 24, says: 'A clown, carrying a pie. Everyone is nervous.' }
]);
const carrierById = (id) => CARRIERS.find((carrier) => carrier.id === id) || CARRIERS[0];
function drawCarrierLot(not = null) {
  const pool = CARRIERS.filter((carrier) => carrier.id !== not);
  let roll = Math.random() * pool.reduce((sum, carrier) => sum + carrier.weight, 0);
  for (const carrier of pool) {
    roll -= carrier.weight;
    if (roll <= 0) return carrier;
  }
  return pool[0];
}

/* What happened, said the way the land would say it. */
const CAUSES = Object.freeze({
  post: 'A bronze post curves for everyone. It did not curve this time.',
  sack: 'Flour, everywhere. It does not spill a pie; it only slows one down.',
  snail: 'A pane-snail was there first. They always are.',
  spool: 'A spool rolled in from a chapter nobody here was in.',
  pigeon: 'A gate-pigeon rose. So, briefly, did the pie.',
  dividers: 'Two children measured the pie with brass dividers. It came out even. It never does.',
  clerk: 'A feast clerk wrote DAMAGE at the top, and under that, a line for the cause.',
  wasps: 'The crown-wasps knew sweetness before anyone.',
  banner: 'A banner in colours nobody ordered came down across the lane.',
  table: 'Straight into the long table. The second place stayed set.',
  chair: 'Somebody had pulled out a chair for someone else.',
  throne: 'A rented throne, gilt over pine, set down exactly where it was not wanted.',
  subject: 'A subject halfway through an errand. Neither of them had meant to be in an empire.',
  wobble: 'Too much, too soon. The pie had opinions about that.',
  'wobble-clown': 'A clown cannot hold a pie that long. WAP: its own face. It counts as a spill; it was also a delight.'
});

function readRecord() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    const obj = (value) => (value && typeof value === 'object' ? value : {});
    return {
      best: Number(parsed.best) || 0,
      runs: Number(parsed.runs) || 0,
      waps: Number(parsed.waps) || 0,
      bestWaps: Number(parsed.bestWaps) || 0,
      causes: obj(parsed.causes),
      carriers: obj(parsed.carriers),
      sound: parsed.sound !== false
    };
  } catch {
    return { best: 0, runs: 0, waps: 0, bestWaps: 0, causes: {}, carriers: {}, sound: true };
  }
}

function writeRecord(record) {
  try { window.localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* the run still counted */ }
}

/* ─── WAP: a splat and a horn, synthesized; no files ─── */
let audio = null;
/** Browsers let sound start only from a gesture: the click or key that starts a carry. */
function primeAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio = audio || new AudioCtx();
    if (audio.state !== 'running') audio.resume().catch(() => {});
  } catch { /* silent, then */ }
}
function wapSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio = audio || new AudioCtx();
    if (audio.state !== 'running') audio.resume().catch(() => {});
    const t = audio.currentTime;
    const out = audio.createGain();
    out.gain.value = 0.5;
    out.connect(audio.destination);
    // The W: a short drop in pitch, like a cheek meeting crust.
    const thump = audio.createOscillator();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(320, t);
    thump.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    const thumpGain = audio.createGain();
    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    thump.connect(thumpGain).connect(out);
    thump.start(t);
    thump.stop(t + 0.18);
    // The AP: filling, everywhere — a burst of noise through a closing filter.
    const length = Math.floor(audio.sampleRate * 0.22);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const splat = audio.createBufferSource();
    splat.buffer = buffer;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.4;
    band.frequency.setValueAtTime(1800, t);
    band.frequency.exponentialRampToValueAtTime(260, t + 0.2);
    const splatGain = audio.createGain();
    splatGain.gain.setValueAtTime(0.0001, t);
    splatGain.gain.exponentialRampToValueAtTime(0.8, t + 0.01);
    splatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    splat.connect(band).connect(splatGain).connect(out);
    splat.start(t);
    // And the clown's delight: two honks.
    [0.2, 0.34].forEach((at, i) => {
      const horn = audio.createOscillator();
      horn.type = 'square';
      horn.frequency.setValueAtTime(i ? 660 : 520, t + at);
      horn.frequency.linearRampToValueAtTime(i ? 700 : 560, t + at + 0.09);
      const hornGain = audio.createGain();
      hornGain.gain.setValueAtTime(0.0001, t + at);
      hornGain.gain.exponentialRampToValueAtTime(0.12, t + at + 0.01);
      hornGain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.1);
      horn.connect(hornGain).connect(out);
      horn.start(t + at);
      horn.stop(t + at + 0.12);
    });
  } catch { /* a silent WAP is still a WAP */ }
}

const laneX = (lane) => lane * LANE_W + LANE_W / 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* Any CSS colour the page uses (hex, color-mix, a var) → plain rgb() a canvas can mix. */
let probe = null;
function rgbOf(value, fallback) {
  if (!probe) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    probe = c.getContext('2d', { willReadFrequently: true });
  }
  const span = document.createElement('span');
  span.style.color = fallback;
  span.style.color = value;
  document.body.append(span);
  const computed = getComputedStyle(span).color;
  span.remove();
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = fallback;
  probe.fillStyle = computed;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/** The page's colours, so the game wears the reader's binding. */
function palette() {
  const style = getComputedStyle(document.body);
  const v = (name, fallback) => rgbOf(style.getPropertyValue(name).trim() || fallback, fallback);
  return {
    paper: v('--hub-paper', '#f3ede1'),
    deep: v('--hub-paper-deep', '#e6dcc8'),
    ink: v('--hub-ink', '#161d2b'),
    muted: v('--hub-muted', '#5b6472'),
    accent: v('--hub-accent', '#246270'),
    gold: v('--hub-gold', '#c4922e'),
    hearth: v('--hub-hearth', '#b0602a'),
    berry: v('--hub-berry', '#5b3a6e'),
    night: v('--hub-night', '#12394a')
  };
}

const channels = (rgb) => (rgb.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
/** a toward b by t, as rgb(). */
function mix(a, b, t) {
  const x = channels(a);
  const y = channels(b);
  return `rgb(${x.map((n, i) => Math.round(n + (y[i] - n) * t)).join(', ')})`;
}

export function initPieGame(root = document.querySelector('[data-pie-game]')) {
  if (!root) return () => {};
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const card = root.querySelector('[data-pie-card]');
  const cardTitle = card.querySelector('[data-pie-card-title]');
  const cardLine = card.querySelector('[data-pie-card-line]');
  const cardAction = card.querySelector('[data-pie-card-action]');
  const meter = root.querySelector('[data-pie-meter]');
  const toast = root.querySelector('[data-pie-toast]');
  const toastTitle = toast?.querySelector('[data-pie-toast-title]');
  const toastLine = toast?.querySelector('[data-pie-toast-line]');
  let toastTimer = 0;
  const live = root.querySelector('[data-pie-live]');
  const bestOut = document.querySelector('[data-pie-best]');
  const left = root.querySelector('[data-pie-step="-1"]');
  const right = root.querySelector('[data-pie-step="1"]');
  const soundToggle = root.querySelector('[data-pie-sound]');
  const cardLinks = card.querySelector('[data-pie-card-links]');
  const returnLink = document.querySelector('[data-pie-return]');

  let colors = palette();
  let record = readRecord();
  let state = 'title';     // title | running | paused | spilling | over
  let frame = 0;
  let last = 0;
  let run = null;

  const say = (text) => { if (live) live.textContent = text; };
  const paintBest = () => {
    if (!bestOut) return;
    bestOut.textContent = record.runs
      ? `Carried furthest: ${record.best} cobbles. Pies spilled: ${record.runs}, exactly one each time. Clowns given WAP: ${record.waps}${record.bestWaps ? ` (most in one carry: ${record.bestWaps})` : ''}.`
      : 'Nobody has carried it yet.';
  };
  const paintSound = () => {
    if (!soundToggle) return;
    soundToggle.textContent = record.sound ? '♪ WAP sounds: on' : '♪ WAP sounds: off';
    soundToggle.setAttribute('aria-pressed', record.sound ? 'true' : 'false');
  };

  /* ─── Sizing: a crisp canvas at any width ─── */
  const fit = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.width * (H / W) * ratio);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    draw();
  };

  /* ─── A run ─── */
  const firstScene = (() => {
    try {
      const wanted = new URLSearchParams(window.location.search).get('scene');
      return Math.max(0, SCENES.findIndex((entry) => entry.id === wanted));
    } catch {
      return 0;
    }
  })();
  const fresh = (carrier = drawCarrierLot()) => ({
    carrier,
    waps: 0,
    bursts: [],
    lane: 2,
    x: laneX(2),
    from: laneX(2),
    moveT: 1,
    lastStep: -1,
    dir: 0,
    wobble: 0,
    phase: 0,
    speed: 150,
    drag: 1,
    scroll: 0,
    sceneIndex: firstScene,
    sceneStart: 0,
    things: [],
    rowIn: 1.6,
    rows: 0,
    safe: 2,
    boofIn: rand(9, 14),
    boon: null,
    bane: null,
    lastPresence: null,
    nextPresence: rand(13, 18),
    pendingSwitch: false,
    slices: [],
    throws: [],
    sliceReady: 1,
    perfects: 0,
    puffs: [],
    tags: [],
    foils: 0,
    floured: 0,
    setbacks: 0,
    boof: null,
    drops: [],
    hat: { x: laneX(2), y: PLAYER_Y - 62, vx: 0, vy: 0 },
    spill: null,
    steadied: 0,
    t: 0
  });

  const cobbles = () => Math.floor((run?.scroll || 0) / COBBLE);
  const scene = () => SCENES[run.sceneIndex % SCENES.length];

  /* ─── Things in the lanes: they come in rows, and every row leaves a way through ─── */
  const difficulty = () => clamp(run.t / 110 + (run.sceneIndex % SCENES.length) * 0.06 + Math.floor(run.sceneIndex / SCENES.length) * 0.25, 0, 1);

  const makeThing = (kind, lane) => {
    const thing = { kind, y: -44, lane, x: laneX(lane), home: laneX(lane), w: 30, h: 30, fatal: true, born: run.t };
    switch (kind) {
      case 'post': thing.w = 24; thing.h = 24; break;
      case 'sack': thing.w = 48; thing.h = 34; thing.fatal = false; break;   // flour slows; it does not spill
      case 'puddle': thing.w = 54; thing.h = 18; thing.fatal = false; break;
      case 'snail': thing.w = 24; thing.h = 16; thing.vx = rand(-6, 6); break;
      case 'spool': thing.w = 18; thing.h = 18; thing.vx = pick([-1, 1]) * rand(30, 46); break;
      case 'pigeon': thing.w = 24; thing.h = 16; thing.vx = pick([-1, 1]) * rand(20, 34); thing.flap = rand(0, 6); break;
      case 'clerk': thing.w = 26; thing.h = 32; thing.vx = pick([-1, 1]) * 22; break;
      case 'wasps': thing.w = 26; thing.h = 22; thing.zig = rand(0, 6); break;
      case 'chair': thing.w = 30; thing.h = 26; break;
      case 'throne': thing.w = 34; thing.h = 36; break;
      case 'subject': thing.w = 24; thing.h = 32; thing.loaf = Math.random() < 0.6; break;
      case 'clown': thing.w = 26; thing.h = 32; thing.fatal = false; thing.vx = 0; thing.honk = rand(0, 6); break;
      case 'switch': thing.w = 30; thing.h = 30; thing.fatal = false; break;
      default: break;
    }
    // Things that drift stay near their own lane: the way through is never taken back.
    thing.range = LANE_W * 0.2;
    return thing;
  };

  const spawnRow = () => {
    const d = difficulty();
    const s = scene();
    const lanes = [...Array(LANES).keys()];
    // The way through: never more than one step from the last.
    run.safe = clamp(run.safe + pick([-1, 0, 0, 1]), 0, LANES - 1);
    // Mr. BaneWAP's off switch rides on the way through, where it can always be reached.
    if (run.pendingSwitch && run.bane) {
      run.things.push(makeThing('switch', run.safe));
      run.pendingSwitch = false;
    }
    // Now and then a whole row with one opening, on the way through (at the table, the empty place).
    const wide = s.kinds.filter((kind) => WIDE.has(kind));
    if (wide.length && run.rows > 4 && Math.random() < 0.1 + d * 0.12) {
      const thing = makeThing(pick(wide), run.safe);
      thing.gap = run.safe;
      thing.x = W / 2;
      thing.w = W;
      thing.h = thing.kind === 'table' ? 34 : 18;
      run.things.push(thing);
      run.rows += 1;
      return;
    }
    const most = run.rows < 4 ? 1 : d < 0.3 ? 1 : d < 0.65 ? 2 : 3;
    const count = 1 + Math.floor(Math.random() * most);
    const open = lanes.filter((lane) => lane !== run.safe).sort(() => Math.random() - 0.5);
    const blocked = new Set();
    for (const lane of open) {
      if (blocked.size >= count) break;
      if (blocked.has(lane)) continue;
      let kind = pick(s.kinds.filter((k) => !WIDE.has(k)));
      if (kind === 'dividers') {
        const pair = [lane + 1, lane - 1].find((other) => other >= 0 && other < LANES && other !== run.safe && !blocked.has(other));
        if (pair == null) {
          kind = 'post';
        } else {
          const thing = makeThing('dividers', Math.min(lane, pair));
          thing.lanes = [Math.min(lane, pair), Math.max(lane, pair)];
          thing.x = (laneX(thing.lanes[0]) + laneX(thing.lanes[1])) / 2;
          thing.w = LANE_W * 2 - 14;
          thing.h = 22;
          run.things.push(thing);
          blocked.add(lane);
          blocked.add(pair);
          continue;
        }
      }
      run.things.push(makeThing(kind, lane));
      blocked.add(lane);
    }
    // Puddles and clowns in what is left; a puddle may lie on the way through — it only slips.
    const free = lanes.filter((lane) => !blocked.has(lane));
    if (Math.random() < 0.14 + d * 0.12) run.things.push(makeThing('puddle', pick(free)));
    const clowns = (run.boon ? 0.62 : 0.14) * (s.id === 'plaza' ? 1.4 : 1);
    if (Math.random() < clowns) {
      const lane = pick(free);
      const clown = makeThing('clown', lane);
      clown.y -= 30;
      run.things.push(clown);
    }
    run.rows += 1;
  };

  /* Forgiving by design: a near miss is a miss. Friends reach a little further. */
  const hits = (thing) => {
    const py = PLAYER_Y - 18;   // the pie rides at chest height
    const ph = 34;
    const pw = run.carrier.width * 0.85;
    const friendly = !thing.fatal;
    const reach = thing.kind === 'clown' ? (run.boon ? 1.7 : 1.15) : friendly ? 1 : 0.76;
    const overlapY = Math.abs(thing.y - py) < (thing.h * reach + ph) / 2;
    if (!overlapY) return false;
    if (WIDE.has(thing.kind)) {
      const gapLeft = thing.gap * LANE_W - 4;
      const gapRight = (thing.gap + 1) * LANE_W + 4;
      return run.x - pw / 2 < gapLeft || run.x + pw / 2 > gapRight;
    }
    return Math.abs(thing.x - run.x) < (thing.w * reach + pw) / 2;
  };

  /* ─── Stepping: across the scene, a lane at a time ─── */
  const step = (dir) => {
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    const next = clamp(run.lane + dir, 0, LANES - 1);
    if (next === run.lane) {
      run.wobble = Math.min(1, run.wobble + 0.08); // bumping the edge of the lane jostles it a little
      return;
    }
    const hurried = run.t - run.lastStep < 0.28;
    run.from = run.x;
    run.lane = next;
    run.moveT = 0;
    run.dir = dir;
    run.lastStep = run.t;
    const taxed = run.bane?.id === 'tax' ? 1.8 : 1;
    run.wobble = Math.min(1.2, run.wobble + (hurried ? run.carrier.hurried : run.carrier.wobble) * taxed);
    if (taxed > 1) run.tags.push({ x: run.x, y: PLAYER_Y - 76, t: 0, text: 'TAX' });
  };

  /* An involuntary step: Mr. BaneWAP's rented wind. */
  const shove = (dir) => {
    const next = clamp(run.lane + dir, 0, LANES - 1);
    if (next === run.lane) {
      run.wobble = Math.min(1.2, run.wobble + 0.12);
      return;
    }
    run.from = run.x;
    run.lane = next;
    run.moveT = 0;
    run.dir = dir;
    run.wobble = Math.min(1.2, run.wobble + 0.1);
  };

  /* ─── Throwing: a slice up the lane; the pie on the plate is never smaller ─── */
  const SWEET = [120, 230];   // px above the pie: the moment to throw
  const inLane = (thing) => Math.abs(thing.x - run.x) < LANE_W * 0.55;
  const targetAhead = () => run.things
    .filter((thing) => (thing.kind === 'clown' || thing.kind === 'switch') && !thing.wapped && !thing.targeted && inLane(thing) && thing.y < PLAYER_Y - 20)
    .sort((a, b) => b.y - a.y)[0] || null;
  const throwSlice = () => {
    if (state !== 'running') return;
    if (run.sliceReady < 1) {
      run.wobble = Math.min(1.2, run.wobble + 0.04); // reaching for a slice that is not there yet
      return;
    }
    run.sliceReady = 0;
    const target = targetAhead();
    const gap = target ? PLAYER_Y - 18 - target.y : Infinity;
    const perfect = target && gap >= SWEET[0] && gap <= SWEET[1];
    const blank = target && gap < SWEET[0];
    if (target) target.targeted = true;
    run.throws.push({ x: run.x, y: PLAYER_Y - 30, target, perfect, t: 0 });
    run.wobble = Math.min(1.2, run.wobble + (blank ? 0.16 : perfect ? 0 : 0.07));
  };

  /* ─── WAP: a clown gets the pie, square, and the pie on the plate is no smaller ─── */
  const wap = (thing, how = 'plate') => {
    thing.wapped = true;
    thing.wapT = 0;
    thing.spin = pick([-1, 1]);
    const perfect = how === 'perfect';
    run.waps += perfect ? 2 : 1;
    if (perfect) {
      run.perfects += 1;
      run.wobble = Math.max(0, run.wobble - 0.3);
      run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'PERFECT' });
    } else if (how === 'plate') {
      run.wobble = Math.min(1.2, run.wobble + 0.18);
    }
    run.bursts.push({ x: thing.x, y: thing.y - 14, t: 0, size: (perfect ? 1.25 : 1) + Math.min(run.waps, 6) * 0.05 });
    if (record.sound) wapSound();
    const by = how === 'boon' ? ' Mr. BoonWAP threw that one.' : perfect ? ' Perfectly timed: it counts twice, and the pie steadies.' : '';
    say(run.waps === 1
      ? `WAP. A clown got the pie in the eye, and loved it. The pie on the plate is no smaller.${by}`
      : `WAP. ${run.waps} for the clowns, and still one pie.${by}`);
  };

  /* Mr. BaneWAP's off switch: every scheme has one. */
  const foil = (thing, perfect = false) => {
    if (!run.bane) return;
    const scheme = SCHEMES[run.bane.id];
    thing.wapped = true;
    thing.wapT = 0;
    thing.spin = 1;
    run.bane = null;
    run.foils += 1;
    run.nextPresence = rand(15, 22);
    if (perfect) run.tags.push({ x: thing.x, y: thing.y - 40, t: 0, text: 'FOILED FROM AFAR' });
    showToast('Foiled.', `Mr. BaneWAP: ${scheme.foiled}`, 2600, 'bane');
    say(`Foiled. ${scheme.foiled}`);
  };

  /* ─── Title cards: the prophecy and the cuts, like a silent film ─── */
  const showCard = (title, line, action) => {
    cardTitle.textContent = title;
    cardLine.textContent = line || '';
    cardAction.textContent = action || '';
    cardAction.hidden = !action;
    card.hidden = false;
  };
  const hideCard = () => {
    card.hidden = true;
    cardLinks?.replaceChildren();
  };

  /* A toast: where we are now, and who is under the hat. Play does not stop for it. */
  const showToast = (title, line, ms = 2600, voice = '') => {
    if (!toast) return;
    toastTitle.textContent = title;
    toastLine.textContent = line || '';
    toast.dataset.voice = voice;
    toast.classList.remove('is-in');
    void toast.offsetWidth;
    toast.classList.add('is-in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-in'), ms);
  };
  const hideToast = () => {
    clearTimeout(toastTimer);
    toast?.classList.remove('is-in');
  };

  /* Where the reader found the game, to send them back there (pie-segues.mjs). */
  const from = (() => {
    try {
      const given = safeReturn(new URLSearchParams(window.location.search).get('from'));
      if (given) {
        window.sessionStorage.setItem('lore.pie.from', given);
        return given;
      }
      const kept = safeReturn(window.sessionStorage.getItem('lore.pie.from'));
      if (kept) return kept;
      const ref = document.referrer ? new URL(document.referrer) : null;
      return ref && ref.origin === window.location.origin && ref.pathname !== window.location.pathname ? safeReturn(ref.pathname + ref.hash) : null;
    } catch {
      return null;
    }
  })();
  let lastCarry = null;
  const goBack = () => {
    if (!from) return;
    leaveBackNote({
      path: from,
      place: lastCarry ? segueFor(lastCarry.scene)?.place : null,
      cobbles: lastCarry?.cobbles ?? null,
      waps: lastCarry?.waps || 0,
      carrier: lastCarry?.carrier || null
    });
  };
  if (returnLink && from) {
    returnLink.href = from;
    returnLink.textContent = `↩ Back to ${describeReturn(from)}`;
    returnLink.hidden = false;
    returnLink.addEventListener('click', goBack);
  }
  const returnAnchor = () => {
    if (!from) return null;
    const a = document.createElement('a');
    a.href = from;
    a.className = 'pie-card-link';
    a.textContent = `↩ Back to ${describeReturn(from)}`;
    a.addEventListener('click', goBack);
    return a;
  };

  const start = () => {
    colors = palette();
    if (record.sound) primeAudio();
    run = fresh();
    hideCard();
    state = 'running';
    const who = `Under the hat: ${run.carrier.name}.${run.carrier.says ? ` ${run.carrier.says}` : ''}`;
    showToast(scene().card, who, 3200);
    say(`${scene().card} ${who}`);
    last = performance.now();
    loop();
  };

  const cutTo = (index, { back = false } = {}) => {
    run.prevScene = run.sceneIndex;
    run.sceneT = 0;
    run.sceneIndex = index;
    run.sceneStart = cobbles();
    // A beat with nothing new in the lanes, so the next place can arrive.
    run.rowIn = Math.max(run.rowIn, 1.2);
    if (back) {
      showToast(`Pushed back in the story: ${scene().card.replace(/\.$/, '')}`, 'The flour got everywhere. You will have to come through here again.', 2800, 'flour');
      say(`Pushed back in the story. ${scene().card}`);
      return;
    }
    const again = index >= SCENES.length ? 'Again, and faster.' : '';
    // The title floats, like the hat: at a change of place it may settle on someone else.
    let moved = '';
    if (Math.random() < 0.5) {
      run.prevCarrier = run.carrier;
      run.swapT = 0;
      run.carrier = drawCarrierLot(run.carrier.id);
      moved = `The hat moved on. Under it now: ${run.carrier.name}.`;
    }
    const line = [again, moved].filter(Boolean).join(' ');
    showToast(scene().card, line, moved ? 3000 : 2400);
    say(`${scene().card} ${line}`);
  };

  const spill = (rawCause) => {
    hideToast();
    const selfWap = rawCause === 'wobble' && run.carrier.id === 'clown';
    const cause = selfWap ? 'wobble-clown' : rawCause;
    state = 'spilling';
    run.spill = { cause, t: 0, dir: run.dir || pick([-1, 1]), x: run.x, y: PLAYER_Y - 18, selfWap };
    if (selfWap) {
      run.bursts.push({ x: run.x, y: PLAYER_Y - 60, t: 0, size: 1.2 });
      if (record.sound) wapSound();
    }
    const distance = cobbles();
    record.runs += 1;
    record.causes[cause] = (record.causes[cause] || 0) + 1;
    record.carriers[run.carrier.id] = (record.carriers[run.carrier.id] || 0) + 1;
    record.waps += run.waps;
    record.bestWaps = Math.max(record.bestWaps, run.waps);
    lastCarry = { scene: scene().id, cobbles: distance, waps: run.waps, carrier: run.carrier.name };
    const best = distance > record.best;
    if (best) record.best = distance;
    writeRecord(record);
    paintBest();
    const served = run.waps
      ? ` Clowns given WAP on the way: ${run.waps}${run.perfects ? ` (${run.perfects} perfectly timed)` : ''}. The pie was never smaller.`
      : '';
    const foiled = run.foils ? ` Mr. BaneWAP foiled ${run.foils === 1 ? 'once' : `${run.foils} times`}.` : '';
    setTimeout(() => {
      state = 'over';
      showCard('Exactly one.', `${CAUSES[cause]} Under the hat this time: ${run.carrier.name}, ${distance} cobbles${best ? ', further than ever' : ''}.${served}${foiled} The hat did not fall.`, 'Carry another pie');
      // The way out: into the chapter where this place happens, or home to where the game was found.
      const segue = segueFor(scene().id);
      const links = [];
      if (segue && storyHref(segue) !== from) {
        const read = document.createElement('a');
        read.href = storyHref(segue);
        read.className = 'pie-card-link';
        read.textContent = `Read ${segue.place} in ${chapterWords(segue.chapter)} →`;
        read.addEventListener('click', () => leaveBackNote({ path: storyHref(segue), place: segue.place, cobbles: distance, waps: run.waps, carrier: run.carrier.name }));
        links.push(read);
      }
      const home = returnAnchor();
      if (home) links.push(home);
      cardLinks?.replaceChildren(...links);
      say(`Spilled. ${CAUSES[cause]} ${run.carrier.name}, ${distance} cobbles.${served}`);
      cardAction.focus({ preventScroll: true });
    }, reduced?.matches ? 300 : 1100);
  };

  /* ─── The world moving ─── */
  const progress = () => clamp((cobbles() - run.sceneStart) / SCENE_LENGTH, 0, 1);

  /* Flour: it slows the carry and pushes it back in the story. */
  const flour = (thing) => {
    thing.floured = true;
    run.floured = 1.6;
    run.drag = 0.45;
    run.setbacks += 1;
    run.wobble = Math.min(1.2, run.wobble + 0.05);
    for (let i = 0; i < 16; i += 1) run.puffs.push({ x: run.x + rand(-14, 14), y: PLAYER_Y - 20 + rand(-10, 10), vx: rand(-60, 60), vy: rand(-70, -10), t: 0 });
    const back = 70;
    if (cobbles() - run.sceneStart >= back || run.sceneIndex === 0) {
      run.sceneStart = Math.min(cobbles(), run.sceneStart + back);
      showToast('Flour.', 'Everything slows, and the story slips back a little.', 1800, 'flour');
      say('Flour. Everything slows, and the story slips back a little.');
    } else {
      cutTo(run.sceneIndex - 1, { back: true });
      run.sceneStart = cobbles() - Math.round(SCENE_LENGTH * 0.6);
    }
  };

  /* Two of the quinary five, one at a time. */
  const holdCourt = () => {
    run.boon = { t: 0, dur: 8.5, lobIn: 0.9 };
    run.lastPresence = 'boon';
    showToast('Mr. BoonWAP holds court.', 'A sentient pie of the quinary five. Clowns flock to him, and every pie finds an eye.', 3200, 'boon');
    say('Mr. BoonWAP holds court. Clowns flock to him, and every pie finds an eye.');
  };
  const scheme = () => {
    const id = pick(Object.keys(SCHEMES));
    run.bane = { id, t: 0, dur: 9, beat: id === 'relet' ? 2.4 : 1.8, nextBeat: 1.6, dir: pick([-1, 1]) };
    run.pendingSwitch = true;
    run.lastPresence = 'bane';
    showToast('Mr. BaneWAP has a scheme.', `${SCHEMES[id].says} Somewhere ahead: an off switch.`, 3400, 'bane');
    say(`Mr. BaneWAP has a scheme. ${SCHEMES[id].says} Find the off switch.`);
  };

  const update = (dt) => {
    run.t += dt;
    if (state === 'running') {
      // The pace: gentle at first, building by the place and the minute; flour drags it back.
      run.drag = Math.min(1, run.drag + dt * 0.35);
      const pace = Math.min(350, 150 + run.t * 2.2 + (run.sceneIndex % SCENES.length) * 14 + Math.floor(run.sceneIndex / SCENES.length) * 40);
      run.speed = pace * run.drag;
      run.scroll += run.speed * dt;
      if (cobbles() - run.sceneStart >= SCENE_LENGTH) {
        cutTo(run.sceneIndex + 1);
        return;
      }
      run.rowIn -= dt;
      if (run.rowIn <= 0) {
        spawnRow();
        // Rows a set distance apart, so the time to react holds as the pace builds.
        const gap = clamp(270 - difficulty() * 120, 150, 270);
        run.rowIn = gap / Math.max(run.speed, 90);
      }
      run.boofIn -= dt;
      if (run.boofIn <= 0 && !run.boof) {
        const side = pick([-1, 1]);
        run.boof = { x: side < 0 ? -40 : W + 40, y: rand(80, 200), vx: -side * rand(60, 80), touched: false };
        run.boofIn = rand(12, 18);
      }
      // Presences: Mr. BoonWAP and Mr. BaneWAP never share the stage.
      if (!run.boon && !run.bane) {
        run.nextPresence -= dt;
        if (run.nextPresence <= 0) {
          const lean = scene().presence;
          const boon = lean === 'boon' ? Math.random() < 0.75 : lean === 'bane' ? Math.random() < 0.2 : run.lastPresence !== 'boon';
          if (boon) holdCourt(); else scheme();
        }
      }
      if (run.boon) {
        const b = run.boon;
        b.t += dt;
        b.lobIn -= dt;
        if (b.lobIn <= 0) {
          const target = run.things
            .filter((thing) => thing.kind === 'clown' && !thing.wapped && !thing.targeted && thing.y > 40 && thing.y < PLAYER_Y - 50)
            .sort((a, c) => Math.abs(a.x - W / 2) - Math.abs(c.x - W / 2))[0];
          if (target) {
            target.targeted = true;
            run.slices.push({ x0: W / 2, y0: PRESENCE_Y + 14, target, t: 0 });
          }
          b.lobIn = 1.05;
        }
        if (b.t >= b.dur) {
          run.boon = null;
          run.nextPresence = scene().presence === 'boon' ? rand(9, 13) : rand(15, 22);
          showToast('Mr. BoonWAP keeps talking.', 'The room has moved on. He has not noticed.', 2200, 'boon');
        }
      }
      if (run.bane) {
        const b = run.bane;
        b.t += dt;
        if (b.id !== 'tax') {
          b.nextBeat -= dt;
          if (b.nextBeat <= 0) {
            if (b.id === 'wind') shove(b.dir);
            if (b.id === 'relet') {
              // Re-let: the lanes ahead shift over; the way through goes with them.
              run.things.forEach((thing) => {
                if (thing.wapped || WIDE.has(thing.kind) || thing.y > PLAYER_Y - 120 || thing.kind === 'switch' || thing.lanes) return;
                const lane = thing.lane + b.dir;
                if (lane < 0 || lane >= LANES) return;
                thing.lane = lane;
                thing.home += b.dir * LANE_W;
                thing.shift = { from: thing.x, t: 0 };
              });
              run.safe = clamp(run.safe + b.dir, 0, LANES - 1);
            }
            b.nextBeat = b.beat;
            if (Math.random() < 0.35) b.dir *= -1;
          }
        }
        if (b.t >= b.dur && run.bane) {
          run.bane = null;
          run.pendingSwitch = false;
          run.things = run.things.filter((thing) => thing.kind !== 'switch' || thing.wapped);
          run.nextPresence = scene().presence === 'bane' ? rand(8, 12) : rand(15, 22);
          showToast('Mr. BaneWAP withdraws.', '“This is not over.” It is, for now.', 2200, 'bane');
        }
      }
    }
    // Stepping: a line segment, quickly drawn.
    run.moveT = Math.min(1, run.moveT + dt / run.carrier.step);
    run.x = run.from + (laneX(run.lane) - run.from) * (1 - (1 - run.moveT) ** 3);
    // The pie settles if you let it.
    run.wobble = Math.max(0, run.wobble - dt * run.carrier.settle);
    run.phase += dt * (6 + run.wobble * 10);
    if (run.steadied > 0) run.steadied -= dt;
    if (run.floured > 0) run.floured -= dt;
    run.sliceReady = Math.min(1, run.sliceReady + dt / 1.0);

    if (state === 'running') {
      run.things.forEach((thing) => {
        if (thing.wapped) {
          // Delighted (or foiled), and briefly airborne.
          thing.wapT += dt;
          if (!reduced?.matches) {
            thing.y -= 150 * dt;
            thing.x += thing.spin * 60 * dt;
          }
          return;
        }
        thing.y += run.speed * dt;
        if (thing.shift) {
          thing.shift.t = Math.min(1, thing.shift.t + dt / 0.3);
          thing.x = thing.shift.from + (thing.home - thing.shift.from) * thing.shift.t;
          if (thing.shift.t >= 1) thing.shift = null;
          return;
        }
        // Clowns love WAP: they drift toward the pie while there is still time to get in front of it.
        if (thing.kind === 'clown' && thing.y < PLAYER_Y - 70) {
          const pull = run.boon ? 70 : 42;
          thing.x += clamp((run.x - thing.x) * 0.9, -pull, pull) * dt;
        } else if (thing.vx) {
          thing.x += thing.vx * dt;
          if (Math.abs(thing.x - thing.home) > thing.range) {
            thing.x = thing.home + Math.sign(thing.x - thing.home) * thing.range;
            thing.vx *= -1;
          }
        }
        if (thing.kind === 'wasps') thing.x = thing.home + Math.sin((run.t + thing.zig) * 4) * thing.range;
        if (thing.kind === 'pigeon') thing.flap += dt * 14;
      });
      run.things = run.things.filter((thing) => thing.y < H + 60 && !(thing.wapped && thing.wapT > 1.1));

      // Slices in flight: Mr. BoonWAP's, and the carrier's.
      run.slices.forEach((slice) => { slice.t += dt / 0.6; });
      run.slices = run.slices.filter((slice) => {
        if (slice.t < 1) return true;
        if (!slice.target.wapped && run.things.includes(slice.target)) wap(slice.target, 'boon');
        return false;
      });
      run.throws.forEach((shot) => {
        shot.t += dt;
        shot.y -= 560 * dt;
        if (shot.target && !shot.target.wapped && run.things.includes(shot.target)) {
          shot.x += (shot.target.x - shot.x) * Math.min(1, dt * 10);
          if (shot.y <= shot.target.y + 6) {
            if (shot.target.kind === 'switch') foil(shot.target, shot.perfect);
            else wap(shot.target, shot.perfect ? 'perfect' : 'throw');
            shot.done = true;
          }
        }
      });
      run.throws = run.throws.filter((shot) => !shot.done && shot.y > -30);

      for (const thing of run.things) {
        if (thing.wapped || !hits(thing)) continue;
        if (thing.kind === 'clown') {
          wap(thing);
          continue;
        }
        if (thing.kind === 'switch') {
          foil(thing);
          continue;
        }
        if (thing.kind === 'puddle') {
          if (!thing.slipped) {
            thing.slipped = true;
            run.wobble = Math.min(1.2, run.wobble + 0.36);
            say('A puddle. The pie slides.');
          }
          continue;
        }
        if (thing.kind === 'sack') {
          if (!thing.floured) flour(thing);
          continue;
        }
        spill(thing.kind);
        return;
      }
      if (run.boof) {
        run.boof.y += run.speed * dt * 0.55;
        run.boof.x += run.boof.vx * dt;
        if (!run.boof.touched && Math.abs(run.boof.x - run.x) < 32 && Math.abs(run.boof.y - (PLAYER_Y - 10)) < 36) {
          run.boof.touched = true;
          run.wobble = 0;
          run.steadied = 1.6;
          say('Boof brushes past. The pie steadies.');
        }
        if (run.boof.x < -60 || run.boof.x > W + 60 || run.boof.y > H + 40) run.boof = null;
      }
      if (run.wobble >= 1) {
        spill('wobble');
        return;
      }
    }

    // The hat: it follows the head, late, and never quite obeys gravity.
    const hat = run.hat;
    if (state !== 'spilling' && state !== 'over') {
      const tx = run.x;
      const ty = PLAYER_Y - 64 - (reduced?.matches ? 0 : Math.sin(run.t * 1.7) * 3);
      hat.vx += (tx - hat.x) * dt * 38;
      hat.vy += (ty - hat.y) * dt * 38;
      hat.vx *= 0.82;
      hat.vy *= 0.82;
      hat.x += hat.vx * dt * 10;
      hat.y += hat.vy * dt * 10;
    }
    if (run.sceneT != null && run.sceneT < 1) run.sceneT = Math.min(1, run.sceneT + dt / (reduced?.matches ? 0.4 : 1.4));
    if (run.swapT != null && run.swapT < 1) run.swapT = Math.min(1, run.swapT + dt / 0.6);
    if (run.spill) run.spill.t += dt;
    run.bursts.forEach((burst) => { burst.t += dt; });
    run.bursts = run.bursts.filter((burst) => burst.t < 0.9);
    run.puffs.forEach((puff) => { puff.t += dt; puff.x += puff.vx * dt; puff.y += puff.vy * dt; puff.vy += 60 * dt; });
    run.puffs = run.puffs.filter((puff) => puff.t < 1.1);
    run.tags.forEach((tag) => { tag.t += dt; });
    run.tags = run.tags.filter((tag) => tag.t < 1);
    if (scene().rain && !reduced?.matches) {
      while (run.drops.length < 70) run.drops.push({ x: rand(0, W), y: rand(-H, 0), v: rand(420, 620) });
      run.drops.forEach((drop) => {
        drop.y += drop.v * dt;
        drop.x -= 40 * dt;
        if (drop.y > H) { drop.y = rand(-40, 0); drop.x = rand(0, W + 40); }
      });
    } else {
      run.drops.length = 0;
    }
    if (meter) meter.style.setProperty('--wobble', String(clamp(run.wobble, 0, 1)));
  };

  /* ─── Drawing: the city in its colours; the figure in plain ink ─── */

  /* A place's light: the paper, tinted. Between places, one crosses into the next. */
  const skyFor = (s) => {
    const tint = { night: colors.night, bronze: colors.gold, ember: colors.hearth, gold: colors.gold, berry: colors.berry }[s.tint];
    return [mix(colors.paper, tint, s.tint === 'night' ? 0.32 : 0.16), mix(colors.deep, tint, s.tint === 'night' ? 0.22 : 0.08)];
  };
  const drawScene = () => {
    const s = run ? scene() : SCENES[0];
    let [top, bottom] = skyFor(s);
    if (run && run.prevScene != null && run.sceneT < 1) {
      const [fromTop, fromBottom] = skyFor(SCENES[run.prevScene % SCENES.length]);
      top = mix(fromTop, top, run.sceneT);
      bottom = mix(fromBottom, bottom, run.sceneT);
    }
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Cobbles, scrolling with the scene.
    const offset = (run?.scroll || 0) % 32;
    // Quiet enough that what is in the lanes reads first.
    ctx.strokeStyle = mix(colors.muted, colors.paper, 0.86);
    ctx.lineWidth = 1;
    for (let y = -32 + offset; y < H; y += 32) {
      for (let lane = 0; lane < LANES; lane += 1) {
        const shift = (Math.floor((y - offset) / 32) % 2) * 12;
        ctx.beginPath();
        ctx.ellipse(lane * LANE_W + 18 + shift, y, 14, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // The lanes: faint lines, the grammar he moves in.
    ctx.strokeStyle = mix(colors.muted, colors.paper, 0.6);
    ctx.setLineDash([6, 10]);
    for (let lane = 1; lane < LANES; lane += 1) {
      ctx.beginPath();
      ctx.moveTo(lane * LANE_W, 0);
      ctx.lineTo(lane * LANE_W, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // The lane being carried in, lit a little: where you are is never in doubt.
    if (run && state !== 'title') {
      const glow = ctx.createLinearGradient(0, 0, 0, H);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
      glow.addColorStop(1, mix(colors.paper, 'rgb(255, 255, 255)', 0.5).replace('rgb(', 'rgba(').replace(')', ', 0.28)'));
      ctx.fillStyle = glow;
      ctx.fillRect(run.x - LANE_W / 2, 0, LANE_W, H);
    }
  };

  /* A ring on what can be thrown at, in the carrier's lane: gold in the moment to throw. */
  const drawAim = () => {
    if (!run || state !== 'running') return;
    const target = targetAhead();
    if (!target) return;
    const gap = PLAYER_Y - 18 - target.y;
    const sweet = gap >= SWEET[0] && gap <= SWEET[1];
    ctx.save();
    ctx.strokeStyle = sweet ? '#f2c14e' : mix(colors.ink, colors.paper, 0.45);
    ctx.lineWidth = sweet ? 3 : 1.5;
    ctx.setLineDash(sweet ? [] : [4, 4]);
    ctx.beginPath();
    ctx.arc(target.x, target.y - 4, 24, 0, Math.PI * 2);
    ctx.stroke();
    if (sweet) {
      ctx.fillStyle = '#f2c14e';
      ctx.font = '700 9px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(run.sliceReady >= 1 ? 'THROW' : '…', target.x, target.y - 34);
    }
    ctx.restore();
  };

  const HAZARD_SCALE = 1.2;
  const drawThing = (thing) => {
    const { x, y } = thing;
    ctx.save();
    // Every thing touches the ground: a shadow under it, and hazards drawn a size larger.
    if (!WIDE.has(thing.kind) && thing.kind !== 'puddle' && !thing.wapped) {
      ctx.fillStyle = 'rgba(20, 16, 10, 0.18)';
      ctx.beginPath();
      ctx.ellipse(x, y + thing.h * 0.55, thing.w * 0.55, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (thing.fatal && !WIDE.has(thing.kind)) {
      ctx.translate(x, y);
      ctx.scale(HAZARD_SCALE, HAZARD_SCALE);
      ctx.translate(-x, -y);
    }
    // Friends glow: go toward these.
    if ((thing.kind === 'clown' || thing.kind === 'switch') && !thing.wapped) {
      const halo = ctx.createRadialGradient(x, y - 4, 4, x, y - 4, 30);
      halo.addColorStop(0, 'rgba(255, 214, 102, 0.45)');
      halo.addColorStop(1, 'rgba(255, 214, 102, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y - 4, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    switch (thing.kind) {
      case 'throne':
        ctx.fillStyle = '#c9a23a';
        ctx.strokeStyle = '#6a4e14';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - 14, y - 18, 28, 14, 4);          // back
        ctx.rect(x - 15, y - 4, 30, 9);                     // seat
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#8a3a3a';
        ctx.fillRect(x - 11, y - 3, 22, 5);                  // cushion
        ctx.fillStyle = '#b8935a';
        ctx.fillRect(x - 13, y + 5, 4, 10);
        ctx.fillRect(x + 9, y + 5, 4, 10);
        ctx.fillStyle = '#6a4e14';
        ctx.font = '600 6px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('RENTED', x, y - 9);
        break;
      case 'subject':
        ctx.fillStyle = '#5a6b52';
        ctx.beginPath();
        ctx.roundRect(x - 9, y - 6, 18, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#e2b48c';
        ctx.beginPath();
        ctx.arc(x, y - 12, 7, 0, Math.PI * 2);
        ctx.fill();
        if (thing.loaf) {
          ctx.fillStyle = '#c98a3e';
          ctx.beginPath();
          ctx.ellipse(x + 10, y + 2, 7, 4, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'switch': {
        // Mr. BaneWAP's off switch: every scheme has one, in plain view.
        if (thing.wapped) ctx.globalAlpha = Math.max(0, 1 - thing.wapT * 1.5);
        ctx.fillStyle = '#2b2b30';
        ctx.beginPath();
        ctx.roundRect(x - 13, y - 6, 26, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#d6473e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x + (thing.wapped ? -9 : 9), y - 14);
        ctx.stroke();
        ctx.fillStyle = '#d6473e';
        ctx.beginPath();
        ctx.arc(x + (thing.wapped ? -9 : 9), y - 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f3ead6';
        ctx.font = '700 6px "JetBrainsMono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(thing.wapped ? 'OFF' : 'ON', x, y + 7);
        break;
      }
      case 'post': {
        const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 13);
        g.addColorStop(0, '#f0c97a');
        g.addColorStop(1, '#8a5a1e');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 220, 140, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y - 16, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'sack':
        if (thing.floured) ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#e8dcc0';
        ctx.strokeStyle = '#a89870';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - 22, y - 16, 44, 32, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#8a7a58';
        ctx.font = '600 8px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('FLOUR', x, y + 3);
        break;
      case 'puddle':
        ctx.fillStyle = mix(colors.accent, colors.paper, 0.55);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(x, y, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'snail':
        ctx.fillStyle = '#c9d6d2';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9fb8b2';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 3.5, 0, Math.PI * 1.5);
        ctx.stroke();
        break;
      case 'spool':
        ctx.translate(x, y);
        ctx.rotate(run.t * (thing.vx > 0 ? 6 : -6));
        ctx.fillStyle = colors.berry;
        ctx.fillRect(-8, -5, 16, 10);
        ctx.fillStyle = '#c8a46a';
        ctx.fillRect(-8, -8, 3, 16);
        ctx.fillRect(5, -8, 3, 16);
        break;
      case 'pigeon': {
        ctx.fillStyle = '#8f98a6';
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        const flap = Math.sin(thing.flap) * 6;
        ctx.beginPath();
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x - 13, y - flap);
        ctx.lineTo(x - 4, y + 2);
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + 13, y - flap);
        ctx.lineTo(x + 4, y + 2);
        ctx.fill();
        break;
      }
      case 'clerk':
        ctx.fillStyle = colors.night;
        ctx.beginPath();
        ctx.roundRect(x - 11, y - 12, 22, 26, 6);
        ctx.fill();
        ctx.fillStyle = '#f7f1e2';
        ctx.fillRect(x - 6, y - 6, 12, 15);
        ctx.fillStyle = colors.hearth;
        ctx.font = '700 4.5px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('DAMAGE', x, y - 1);
        break;
      case 'wasps':
        ctx.fillStyle = '#b8b2a0';
        ctx.beginPath();
        ctx.moveTo(x - 12, y + 8);
        ctx.lineTo(x - 12, y - 4);
        ctx.lineTo(x - 6, y - 10);
        ctx.lineTo(x, y - 4);
        ctx.lineTo(x + 6, y - 10);
        ctx.lineTo(x + 12, y - 4);
        ctx.lineTo(x + 12, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3a3426';
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.arc(x - 10 + i * 10 + Math.sin(run.t * 9 + i) * 3, y - 14 + Math.cos(run.t * 7 + i) * 3, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'clown': {
        if (thing.wapped) {
          ctx.translate(x, y);
          if (!reduced?.matches) ctx.rotate(thing.spin * thing.wapT * 5);
          ctx.globalAlpha = Math.max(0, 1 - Math.max(0, thing.wapT - 0.6) * 2);
          drawClown(0, 0, true);
        } else {
          drawClown(x, y, false, Math.sin((run.t + thing.honk) * 6));
        }
        break;
      }
      case 'chair':
        ctx.fillStyle = '#8a5a34';
        ctx.fillRect(x - 12, y - 4, 24, 6);
        ctx.fillRect(x - 12, y - 14, 4, 22);
        ctx.fillRect(x + 8, y - 4, 4, 12);
        break;
      case 'dividers': {
        const [a, b] = thing.lanes.map(laneX);
        ctx.strokeStyle = '#c49a3a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a + 8, y);
        ctx.lineTo((a + b) / 2, y - 12);
        ctx.lineTo(b - 8, y);
        ctx.stroke();
        [a, b].forEach((cx) => {
          ctx.fillStyle = colors.berry;
          ctx.beginPath();
          ctx.arc(cx, y + 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f2d2b0';
          ctx.beginPath();
          ctx.arc(cx, y - 7, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }
      case 'banner':
      case 'table': {
        const top = y - thing.h / 2;
        for (let lane = 0; lane < LANES; lane += 1) {
          if (lane === thing.gap) continue;
          const lx = lane * LANE_W;
          if (thing.kind === 'banner') {
            ctx.fillStyle = [colors.berry, colors.gold, colors.accent, colors.hearth][lane % 4];
            ctx.fillRect(lx, top, LANE_W, thing.h);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(lx, top + thing.h - 4, LANE_W, 4);
          } else {
            ctx.fillStyle = '#7a4e2c';
            ctx.fillRect(lx, top, LANE_W, thing.h);
            ctx.fillStyle = '#f4ece0';
            ctx.fillRect(lx + 2, top + 2, LANE_W - 4, thing.h - 10);
            ctx.fillStyle = colors.gold;
            ctx.beginPath();
            ctx.arc(lx + LANE_W / 2, top + 12, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (thing.kind === 'table') {
          // The second place: set, empty, and the only way through.
          const gx = laneX(thing.gap);
          ctx.strokeStyle = colors.gold;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(gx - LANE_W / 2 + 4, top + 2, LANE_W - 8, thing.h - 4);
          ctx.setLineDash([]);
        }
        break;
      }
      default: break;
    }
    ctx.restore();
  };

  /* A clown: white face, red nose, hair like two exclamations, a ruff. Pie-faced, delighted. */
  function drawClown(x, y, pied, bounce = 0) {
    ctx.save();
    ctx.translate(x, y + bounce);
    // Suit and ruff.
    ctx.fillStyle = '#e8c34a';
    ctx.beginPath();
    ctx.roundRect(-10, 2, 20, 16, 6);
    ctx.fill();
    ctx.fillStyle = '#d6473e';
    [[-5, 7], [4, 12], [-2, 15]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.arc(i * 4, 1, 3, 0, Math.PI * 2); ctx.fill(); }
    // Hair.
    ctx.fillStyle = '#e0582e';
    ctx.beginPath(); ctx.arc(-9, -10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -10, 5, 0, Math.PI * 2); ctx.fill();
    // Face.
    ctx.fillStyle = '#fbf6ee';
    ctx.beginPath(); ctx.arc(0, -9, 8, 0, Math.PI * 2); ctx.fill();
    if (pied) {
      // A pie, square in the face. Filling, everywhere. A very happy clown underneath.
      ctx.fillStyle = '#e0a95a';
      ctx.beginPath(); ctx.arc(0, -9, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = colors.berry;
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 9, -9 + Math.sin(a) * 9, 3, 1.6, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#7a3a1a';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, -7, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(0, -8, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath(); ctx.arc(-3, -12, 1.1, 0, Math.PI * 2); ctx.arc(3, -12, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d6473e';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -6, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  /* WAP!, in the old way: a star of a word. */
  const drawBursts = () => {
    run?.bursts.forEach((burst) => {
      const t = burst.t / 0.9;
      const grow = reduced?.matches ? 1 : 0.7 + Math.min(1, t * 4) * 0.5;
      const r = 26 * burst.size * grow;
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, t - 0.6) * 2.5;
      ctx.translate(burst.x, burst.y - (reduced?.matches ? 0 : t * 18));
      ctx.rotate(-0.12);
      ctx.fillStyle = '#ffe36b';
      ctx.strokeStyle = '#1d1d22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 20; i += 1) {
        const a = (i / 20) * Math.PI * 2;
        const rr = i % 2 ? r * 0.62 : r;
        ctx.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d6473e';
      ctx.font = `900 ${Math.round(15 * burst.size * grow)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WAP!', 0, 1);
      ctx.restore();
    });
  };

  /* Mr. BoonWAP: a sentient pie, golden, enormous, pleased with himself. */
  const drawBoonWAP = () => {
    const b = run?.boon;
    if (!b) return;
    const enter = Math.min(1, b.t / 0.5, (b.dur - b.t) / 0.5);
    const x = W / 2;
    const y = PRESENCE_Y + (reduced?.matches ? 0 : Math.sin(run.t * 2) * 3) - (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = Math.max(0, enter);
    const halo = ctx.createRadialGradient(x, y, 10, x, y, 64);
    halo.addColorStop(0, 'rgba(255, 210, 120, 0.55)');
    halo.addColorStop(1, 'rgba(255, 210, 120, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, 64, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9e2d4';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 40, 8, 0, 0, Math.PI * 2); ctx.fill();          // his own plate
    const crust = ctx.createLinearGradient(0, y - 22, 0, y + 14);
    crust.addColorStop(0, '#f1bd6a');
    crust.addColorStop(1, '#b06a2a');
    ctx.fillStyle = crust;
    ctx.beginPath(); ctx.ellipse(x, y, 34, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(110, 50, 14, 0.55)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i += 1) { ctx.beginPath(); ctx.moveTo(x + i * 8 - 3, y - 12); ctx.lineTo(x + i * 8 + 3, y + 8); ctx.stroke(); }
    ctx.fillStyle = '#2a160a';                                                                  // a face: delighted with itself
    ctx.beginPath(); ctx.arc(x - 10, y - 4, 2.6, 0, Math.PI * 2); ctx.arc(x + 10, y - 4, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a160a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y + 1, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (!reduced?.matches) {                                                                    // steam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 12, y - 20);
        ctx.quadraticCurveTo(x + i * 12 + Math.sin(run.t * 3 + i) * 5, y - 32, x + i * 12, y - 42);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* Mr. BaneWAP: banker's crust, a monocle, a hollow paper crown; theatrical about it. */
  const drawBaneWAP = () => {
    const b = run?.bane;
    if (!b) return;
    const enter = Math.min(1, b.t / 0.5, (b.dur - b.t) / 0.5);
    const x = W / 2 + (reduced?.matches ? 0 : Math.sin(run.t * 7) * 2);
    const y = PRESENCE_Y - (1 - enter) * 60;
    ctx.save();
    ctx.globalAlpha = Math.max(0, enter);
    ctx.fillStyle = 'rgba(80, 20, 30, 0.28)';
    ctx.beginPath(); ctx.arc(x, y, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9d2c4';
    ctx.beginPath(); ctx.ellipse(x, y + 14, 38, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6e5038';                                                                  // banker's crust, cracking
    ctx.beginPath(); ctx.ellipse(x, y, 32, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2e1e12';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 6); ctx.lineTo(x - 12, y + 2); ctx.lineTo(x - 16, y + 9); ctx.stroke();
    ctx.fillStyle = '#b8b2a0';                                                                  // the crown: paper, hollow, occupied
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 14); ctx.lineTo(x - 16, y - 28); ctx.lineTo(x - 8, y - 20); ctx.lineTo(x, y - 32); ctx.lineTo(x + 8, y - 20); ctx.lineTo(x + 16, y - 28); ctx.lineTo(x + 16, y - 14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.arc(x - 9, y - 4, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e2c46a';                                                                // the monocle
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x + 9, y - 4, 4.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1d1d22';
    ctx.beginPath(); ctx.arc(x + 9, y - 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1d22';                                                                // a moustache, twirled
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x - 10, y + 10, x - 16, y + 2); ctx.moveTo(x, y + 4); ctx.quadraticCurveTo(x + 10, y + 10, x + 16, y + 2); ctx.stroke();
    ctx.restore();
    // The scheme, shown before it happens: wind streaks, or the lanes' new lease.
    const soon = b.id !== 'tax' && b.nextBeat < 0.7;
    if (b.id === 'wind' || b.id === 'relet') {
      ctx.save();
      ctx.globalAlpha = soon ? 0.9 : 0.35;
      ctx.strokeStyle = b.id === 'wind' ? mix(colors.ink, colors.paper, 0.4) : '#d6473e';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2.5;
      const ay = b.id === 'wind' ? PLAYER_Y - 40 : 170;
      for (let i = 0; i < 3; i += 1) {
        const ax = W / 2 + b.dir * (i * 26 - 26);
        ctx.beginPath();
        ctx.moveTo(ax - b.dir * 10, ay - 9);
        ctx.lineTo(ax + b.dir * 4, ay);
        ctx.lineTo(ax - b.dir * 10, ay + 9);
        ctx.stroke();
      }
      ctx.font = '700 10px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.id === 'wind' ? 'RENTED WIND' : 'LANES RE-LET', W / 2, ay - 16);
      ctx.restore();
    }
  };

  const drawFlight = () => {
    if (!run) return;
    // Mr. BoonWAP's slices: lobbed, arcing, into an eye.
    run.slices.forEach((slice) => {
      const t = Math.min(1, slice.t);
      const tx = slice.target.x;
      const ty = slice.target.y - 10;
      const x = slice.x0 + (tx - slice.x0) * t;
      const y = slice.y0 + (ty - slice.y0) * t - Math.sin(t * Math.PI) * 50;
      drawWedge(x, y, t * 8);
    });
    // The carrier's throws: straight up the lane.
    run.throws.forEach((shot) => drawWedge(shot.x, shot.y, shot.t * 14, shot.perfect));
    // Flour, everywhere.
    run.puffs.forEach((puff) => {
      ctx.fillStyle = `rgba(250, 246, 236, ${Math.max(0, 0.85 - puff.t * 0.8)})`;
      ctx.beginPath(); ctx.arc(puff.x, puff.y, 4 + puff.t * 6, 0, Math.PI * 2); ctx.fill();
    });
    // Tags: TAX, PERFECT, FOILED.
    run.tags.forEach((tag) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - tag.t);
      ctx.fillStyle = tag.text === 'TAX' ? '#d6473e' : '#b8860b';
      ctx.font = '800 11px "JetBrainsMono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tag.text, tag.x, tag.y - tag.t * 20);
      ctx.restore();
    });
  };

  function drawWedge(x, y, spin, gold = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = '#e0a95a';
    ctx.strokeStyle = gold ? '#f2c14e' : '#8a4a1a';
    ctx.lineWidth = gold ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = colors.berry;
    ctx.fillRect(-6, 3, 12, 2.5);
    ctx.restore();
  }

  const drawBoof = () => {
    const b = run?.boof;
    if (!b) return;
    const facing = b.vx > 0 ? 1 : -1;
    const trot = Math.sin(run.t * 12) * 2;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(facing, 1);
    ctx.fillStyle = '#c98a4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, -8, 8, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a5e2c';
    ctx.beginPath();
    ctx.ellipse(14, -14, 3, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-14, 6, 4, 8 + trot);
    ctx.fillRect(10, 6, 4, 8 - trot);
    ctx.beginPath();
    ctx.moveTo(-17, -3);
    ctx.quadraticCurveTo(-28, -14 + trot, -24, -18);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c98a4a';
    ctx.stroke();
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.arc(22, -9, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (b.touched && run.steadied > 0) {
      ctx.fillStyle = colors.ink;
      ctx.globalAlpha = Math.min(1, run.steadied);
      ctx.font = 'italic 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('steadied', run.x, PLAYER_Y - 100);
      ctx.globalAlpha = 1;
    }
  };

  /* The figure: one circle, one rectangle, four lines, two dots. Always ink. */
  const drawFigure = () => {
    const x = run ? run.x : laneX(2);
    const y = PLAYER_Y;
    const ink = colors.ink;
    const stride = state === 'running' && !reduced?.matches ? Math.sin((run?.t || 0) * 10) * 5 : 0;
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    // A step is a line segment: the ghost of where he was, for a moment.
    if (run && run.moveT < 1) {
      ctx.globalAlpha = 0.35 * (1 - run.moveT);
      ctx.beginPath();
      ctx.moveTo(run.from, y + 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const who = run?.carrier?.id || 'figure';
    const plainLines = (alpha) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.beginPath();
      ctx.arc(x, y - 44, 9, 0, Math.PI * 2);          // head
      ctx.stroke();
      ctx.strokeRect(x - 8, y - 33, 16, 26);             // body
      ctx.beginPath();                                     // legs
      ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 6 - stride, y + 16);
      ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 6 + stride, y + 16);
      ctx.stroke();
      ctx.beginPath();                                     // eyes, when the drawing remembers them
      ctx.arc(x - 3, y - 45, 1.3, 0, Math.PI * 2);
      ctx.arc(x + 3, y - 45, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const bodyOf = (id, alpha) => {
      if (id === 'figure') plainLines(alpha);
      else {
        ctx.save();
        ctx.globalAlpha *= alpha;
        drawBody(id, x, y, stride);
        ctx.restore();
      }
    };
    // When the hat moves on, the one who was under it fades and the next comes up; the hat stays.
    const swapping = run?.prevCarrier && run.swapT < 1;
    if (swapping) bodyOf(run.prevCarrier.id, 1 - run.swapT);
    bodyOf(who, swapping ? run.swapT : 1);
    if (who !== 'figure') {
      ctx.strokeStyle = who === 'clown' ? '#d6473e' : '#3a2a20';
      ctx.fillStyle = ctx.strokeStyle;
    }
    const spilled = run?.spill;
    const tilt = run && !spilled ? Math.sin(run.phase) * run.wobble * 0.38 + (run.dir || 0) * run.wobble * 0.12 : 0;
    // Arms: two lines from the shoulders, down and out to the plate's rim.
    const px = x;
    const py = y - 18;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 30); ctx.lineTo(px - 18, py + 2);
    ctx.moveTo(x + 8, y - 30); ctx.lineTo(px + 18, py + 2);
    ctx.stroke();
    ctx.restore();
    if (!spilled) drawPie(px, py, tilt);
    if (run?.floured > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, run.floured * 0.4);
      ctx.fillStyle = '#fbf8f0';
      ctx.beginPath(); ctx.ellipse(x, y - 24, 16, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawHat();
  };

  /* The others the hat settles on: drawn in their materials, unlike him. */
  function drawBody(who, x, y, stride) {
    ctx.save();
    const legs = (color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 5 - stride, y + 16);
      ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 5 + stride, y + 16);
      ctx.stroke();
    };
    const head = (skin) => {
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(x, y - 44, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath(); ctx.arc(x - 3, y - 45, 1.2, 0, Math.PI * 2); ctx.arc(x + 3, y - 45, 1.2, 0, Math.PI * 2); ctx.fill();
    };
    if (who === 'porter') {
      legs('#4a3426');
      ctx.fillStyle = '#7a5236';
      ctx.beginPath(); ctx.roundRect(x - 13, y - 35, 26, 30, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';   // flour, from the sacks he carried in
      [[-6, -28], [5, -22], [-2, -14], [7, -31]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2); ctx.fill(); });
      head('#d9a679');
    } else if (who === 'clerk') {
      legs('#1d2a3a');
      ctx.fillStyle = colors.night;
      ctx.beginPath(); ctx.roundRect(x - 8, y - 34, 16, 28, 5); ctx.fill();
      ctx.fillStyle = '#f7f1e2';
      ctx.fillRect(x + 3, y - 31, 5, 8);              // a slip in the pocket
      head('#e8c4a0');
    } else if (who === 'genie') {
      // Off-season: neat as a handkerchief, dressed like a clerk, no feet to speak of.
      ctx.fillStyle = '#c9ccd2';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 34);
      ctx.lineTo(x + 10, y - 34);
      ctx.quadraticCurveTo(x + 9, y, x + 2 + Math.sin((run?.t || 0) * 3) * 4, y + 14);
      ctx.quadraticCurveTo(x - 6, y, x - 10, y - 34);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(x - 7, y - 30); ctx.lineTo(x - 2, y - 30); ctx.lineTo(x - 4.5, y - 26); ctx.fill();
      head('#b9d4e8');
    } else if (who === 'clown') {
      legs('#3a6ab0');
      ctx.fillStyle = '#e8c34a';
      ctx.beginPath(); ctx.roundRect(x - 11, y - 34, 22, 28, 8); ctx.fill();
      ctx.fillStyle = '#d6473e';
      [[-5, -28], [5, -20], [-3, -13]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 2.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#e0582e';
      ctx.beginPath(); ctx.arc(x - 9, y - 47, 5, 0, Math.PI * 2); ctx.arc(x + 9, y - 47, 5, 0, Math.PI * 2); ctx.fill();
      head('#fbf6ee');
      ctx.fillStyle = '#d6473e';
      ctx.beginPath(); ctx.arc(x, y - 43, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  const drawPie = (x, y, tilt, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.fillStyle = '#e9e2d4';
    ctx.beginPath();
    ctx.ellipse(0, 3, 21, 5, 0, 0, Math.PI * 2);   // the plate
    ctx.fill();
    const crust = ctx.createLinearGradient(0, -8, 0, 4);
    crust.addColorStop(0, '#e0a95a');
    crust.addColorStop(1, '#a8652a');
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.ellipse(0, -1, 17, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 40, 10, 0.5)';
    ctx.lineWidth = 0.8;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 2, -5);
      ctx.lineTo(i * 5 + 2, 2);
      ctx.stroke();
    }
    if (run && run.wobble > 0.7 && !run.spill) {
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.ellipse(Math.sign(tilt || 1) * 16, 1, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawHat = () => {
    const hat = run ? run.hat : { x: laneX(2), y: PLAYER_Y - 64 };
    ctx.save();
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.ellipse(hat.x, hat.y + 6, 13, 3, 0, 0, Math.PI * 2);   // brim
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hat.x, hat.y, 8, 7, 0, Math.PI, 0);             // crown
    ctx.rect(hat.x - 8, hat.y, 16, 6);
    ctx.fill();
    ctx.restore();
  };

  const drawSpill = () => {
    const s = run?.spill;
    if (!s) return;
    const t = Math.min(1, s.t / 0.9);
    if (s.selfWap) {
      const k = Math.min(1, t * 2.4);
      drawPie(s.x, s.y + (PLAYER_Y - 44 - s.y) * k, 0, 1 - Math.max(0, t - 0.5) * 2);
      return;
    }
    const x = s.x + s.dir * t * 38;
    const y = s.y + t * t * 60;
    drawPie(x, y, s.dir * t * 2.6, 1 - Math.max(0, t - 0.85) * 4);
    if (t > 0.7) {
      ctx.fillStyle = colors.berry;
      ctx.globalAlpha = Math.min(1, (t - 0.7) * 4);
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 16, y + 12 + Math.sin(a) * 5, 5, 2.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  const drawRain = () => {
    if (!run?.drops.length) return;
    ctx.strokeStyle = mix(colors.accent, colors.paper, 0.4);
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.beginPath();
    run.drops.forEach((drop) => {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + 12);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  /* The HUD: plain pills, readable on any binding; and the track of the story. */
  const pill = (text, x, y, align, color = colors.ink) => {
    ctx.font = '700 12px "JetBrainsMono", ui-monospace, monospace';
    const w = ctx.measureText(text).width + 14;
    const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    ctx.fillStyle = mix(colors.paper, 'rgb(255, 255, 255)', 0.3).replace('rgb(', 'rgba(').replace(')', ', 0.86)');
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.75);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, y - 12, w, 19, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + 7, y - 2);
    ctx.textBaseline = 'alphabetic';
  };

  const drawHud = () => {
    if (!run) return;
    pill(`${cobbles()} cobbles`, 8, 20, 'left');
    pill(`best ${Math.max(record.best, 0)}`, W - 8, 20, 'right', colors.muted);
    if (run.waps) pill(`WAP ×${run.waps}`, W / 2, 20, 'center', '#c0392b');
    // The story so far: five places, this one filling; flour pushes it back.
    const n = SCENES.length;
    const span = 150;
    const x0 = W / 2 - span / 2;
    const y = 42;
    const at = run.sceneIndex % n;
    ctx.save();
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + span, y); ctx.stroke();
    const step = span / (n - 1);
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + step * (at + Math.min(1, progress())), y); ctx.stroke();
    SCENES.forEach((entry, i) => {
      ctx.fillStyle = i < at ? colors.gold : i === at ? colors.ink : mix(colors.ink, colors.paper, 0.6);
      ctx.beginPath(); ctx.arc(x0 + step * i, y, i === at ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    // The next slice: a small ring that fills.
    ctx.save();
    ctx.strokeStyle = run.sliceReady >= 1 ? colors.gold : mix(colors.ink, colors.paper, 0.6);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(run.x + 30, PLAYER_Y - 18, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * run.sliceReady);
    ctx.stroke();
    ctx.restore();
  };

  function draw() {
    if (!canvas.width) return;
    drawScene();
    drawBoonWAP();
    drawBaneWAP();
    run?.things.forEach(drawThing);
    drawAim();
    drawBoof();
    drawFigure();
    drawFlight();
    drawSpill();
    drawBursts();
    drawRain();
    drawHud();
  }

  function loop() {
    cancelAnimationFrame(frame);
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state === 'running' || state === 'spilling') update(dt);
      draw();
      if (state !== 'paused' && state !== 'title' && state !== 'over') frame = requestAnimationFrame(tick);
      else if (state === 'over') draw();
    };
    frame = requestAnimationFrame(tick);
  }

  const pause = () => {
    if (state !== 'running') return;
    state = 'paused';
    showCard('A pause.', 'The pie is held very still. The city waits, politely.', 'Carry on');
    const home = returnAnchor();
    if (home) cardLinks?.replaceChildren(home);
    say('Paused.');
  };
  const resume = () => {
    if (state !== 'paused') return;
    hideCard();
    state = 'running';
    last = performance.now();
    loop();
  };

  /* ─── Controls ─── */
  const onKey = (event) => {
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const key = event.key;
    // Mid-run the arrows always steer; otherwise they start a run only from inside the game.
    const steering = state === 'running' || root.contains(document.activeElement);
    if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && steering) { event.preventDefault(); step(-1); }
    else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && steering) { event.preventDefault(); step(1); }
    else if ((key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') && state === 'running') { event.preventDefault(); throwSlice(); }
    else if (key === ' ' || key === 'Enter') {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (event.target.closest?.('a, button')) return;
      event.preventDefault();
      if (state === 'paused') resume();
      else if (state === 'running') pause();
      else if (state === 'title' || state === 'over') start();
    } else if ((key === 'Escape' || key === 'p' || key === 'P') && state === 'running') {
      pause();
    }
  };
  const onCanvasPointer = (event) => {
    const box = canvas.getBoundingClientRect();
    step(event.clientX - box.left < box.width / 2 ? -1 : 1);
  };
  let touchX = null;
  let touchY = null;
  const onTouchStart = (event) => {
    touchX = event.touches[0]?.clientX ?? null;
    touchY = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event) => {
    const endX = event.changedTouches[0]?.clientX;
    const endY = event.changedTouches[0]?.clientY;
    if (touchY != null && endY != null && touchY - endY > 34 && Math.abs(endX - touchX) < touchY - endY) {
      event.preventDefault();
      throwSlice();   // a swipe up throws
    } else if (touchX != null && endX != null && Math.abs(endX - touchX) > 28) {
      event.preventDefault();
      step(endX < touchX ? -1 : 1);
    }
    touchX = null;
    touchY = null;
  };
  const onVisibility = () => { if (document.hidden) pause(); };
  const onAction = () => {
    if (state === 'paused') resume();
    else start();
  };

  canvas.addEventListener('pointerdown', onCanvasPointer);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd);
  left?.addEventListener('click', () => step(-1));
  right?.addEventListener('click', () => step(1));
  root.querySelector('[data-pie-throw]')?.addEventListener('click', () => {
    if (state === 'title' || state === 'over') start();
    else throwSlice();
  });
  cardAction.addEventListener('click', onAction);
  card.addEventListener('click', (event) => { if (event.target === card && (state === 'title' || state === 'over')) start(); });
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  const resize = new ResizeObserver(fit);
  resize.observe(canvas);
  // The binding can change while the page is open (home/bindery.mjs); the game follows.
  const recolor = new MutationObserver(() => { colors = palette(); draw(); });
  recolor.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  soundToggle?.addEventListener('click', () => {
    record.sound = !record.sound;
    writeRecord(record);
    paintSound();
    if (record.sound) {
      primeAudio();
      wapSound();
    }
  });

  paintBest();
  paintSound();
  // Found in the story? Say where the carry begins.
  const entry = (() => {
    try { return segueFor(new URLSearchParams(window.location.search).get('scene')); } catch { return null; }
  })();
  showCard('Someone is destined to spill exactly one pie.',
    entry && from
      ? `From ${/\/book\/chapter\/(\d{2})\//.test(from) ? chapterWords(Number(/\/book\/chapter\/(\d{2})\//.exec(from)[1])) : describeReturn(from)}: someone in a hat is carrying one, level, through ${entry.place}. It is not always the same someone.`
      : 'Nobody has said who. Through the lanes of Bonk City, someone in a hat is carrying one, level, in both hands. It is not always the same someone.',
    entry ? entry.door : 'Carry the pie');
  if (from) {
    const home = returnAnchor();
    if (home) cardLinks?.replaceChildren(home);
  }
  root.classList.add('is-ready');
  fit();

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    recolor.disconnect();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

if (typeof document !== 'undefined') {
  const boot = () => initPieGame();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
