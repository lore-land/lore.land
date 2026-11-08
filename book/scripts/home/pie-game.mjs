/**
 * pie-game.mjs — Exactly One Pie (PLAN.E L28).
 *
 * Someone is destined to spill exactly one pie. A figure in a hat carries
 * one up the lanes of Bonk City while the city streams down at him. He never
 * goes the way the scene goes: he steps across it, at a right angle, one
 * lane-length at a time (story-boonhonk.spw#trope_physics, orthogonal_motion).
 *
 *   step       ← → or A D, a tap on either half of the lane, a swipe, or the step buttons
 *   wobble     every step tilts the pie; steps in a hurry tilt it more; puddles slip it;
 *              it settles if you let it. Tilted all the way, it goes.
 *   Boof       now and then she crosses the lanes on her own business. Brush past her
 *              and the pie steadies: she works for the land, and the land likes a level pie.
 *   cuts       the scene changes like a silent film: a title card, then the next place —
 *              the parcel gate in a storm, the lanes, the plaza, the long table.
 *   the end    always exactly one spill. The prophecy holds; what changes is how far he
 *              carried it. The hat does not fall. It never has.
 *   ?scene=    gate | lanes | plaza | table — a link can start the carry in that place.
 *
 * Drawn on a canvas in the page's own colours (the reader's binding: --hub-*),
 * except the figure, who is always the same plain ink drawing — he sticks out
 * of every scene he is in. He is never named here.
 *
 * Kept: lore.pie.v1 = { best, runs, causes: { post: n, … } } (begin-again.mjs clears it
 * with a fresh copy). Reduced motion: no rain, no bob; every control the same.
 */

const KEY = 'lore.pie.v1';
const W = 360;
const H = 560;
const LANES = 5;
const LANE_W = W / LANES;
const PLAYER_Y = H - 92;
const COBBLE = 24;            // px of scroll per cobble
const SCENE_LENGTH = 300;     // cobbles per scene
const reduced = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const SCENES = Object.freeze([
  { id: 'gate', card: 'The parcel gate, in a storm.', tint: 'night', rain: true, kinds: ['sack', 'sack', 'puddle', 'puddle', 'pigeon', 'post'] },
  { id: 'lanes', card: 'The lanes, which curve for everyone.', tint: 'bronze', rain: false, kinds: ['post', 'post', 'snail', 'spool', 'puddle', 'pigeon'] },
  { id: 'plaza', card: 'The plaza, where the pie holds court.', tint: 'ember', rain: false, kinds: ['dividers', 'clerk', 'wasps', 'post', 'spool', 'banner'] },
  { id: 'table', card: 'The long table. A second place is set.', tint: 'gold', rain: false, kinds: ['table', 'clerk', 'chair', 'chair', 'wasps', 'dividers'] }
]);

/* What happened, said the way the land would say it. */
const CAUSES = Object.freeze({
  post: 'A bronze post curves for everyone. It did not curve for him.',
  sack: 'A sack of flour does not move for anyone. That is what makes it flour.',
  snail: 'A pane-snail was there first. They always are.',
  spool: 'A spool rolled in from a chapter he was not in.',
  pigeon: 'A gate-pigeon rose. So, briefly, did the pie.',
  dividers: 'Two children measured the pie with brass dividers. It came out even. It never does.',
  clerk: 'A feast clerk wrote DAMAGE at the top, and under that, a line for the cause.',
  wasps: 'The crown-wasps knew sweetness before anyone.',
  banner: 'A banner in colours nobody ordered came down across the lane.',
  table: 'He walked into the long table. The second place stayed set.',
  chair: 'Somebody had pulled out a chair for someone else.',
  wobble: 'He moved too much, too soon. The pie had opinions about that.'
});

function readRecord() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return { best: Number(parsed.best) || 0, runs: Number(parsed.runs) || 0, causes: parsed.causes && typeof parsed.causes === 'object' ? parsed.causes : {} };
  } catch {
    return { best: 0, runs: 0, causes: {} };
  }
}

function writeRecord(record) {
  try { window.localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* the run still counted */ }
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
  const live = root.querySelector('[data-pie-live]');
  const bestOut = document.querySelector('[data-pie-best]');
  const left = root.querySelector('[data-pie-step="-1"]');
  const right = root.querySelector('[data-pie-step="1"]');

  let colors = palette();
  let record = readRecord();
  let state = 'title';     // title | running | cut | paused | spilling | over
  let frame = 0;
  let last = 0;
  let run = null;

  const say = (text) => { if (live) live.textContent = text; };
  const paintBest = () => {
    if (!bestOut) return;
    bestOut.textContent = record.runs
      ? `Carried furthest: ${record.best} cobbles. Pies spilled: ${record.runs}, exactly one each time.`
      : 'Nobody has carried it yet.';
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
  const fresh = () => ({
    lane: 2,
    x: laneX(2),
    from: laneX(2),
    moveT: 1,
    lastStep: -1,
    dir: 0,
    wobble: 0,
    phase: 0,
    speed: 150,
    scroll: 0,
    sceneIndex: firstScene,
    sceneStart: 0,
    things: [],
    spawnIn: 0.9,
    boofIn: rand(9, 14),
    boof: null,
    drops: [],
    hat: { x: laneX(2), y: PLAYER_Y - 62, vx: 0, vy: 0 },
    spill: null,
    steadied: 0,
    t: 0
  });

  const cobbles = () => Math.floor((run?.scroll || 0) / COBBLE);
  const scene = () => SCENES[run.sceneIndex % SCENES.length];

  /* ─── Things in the lanes ─── */
  const spawn = () => {
    const kind = pick(scene().kinds);
    const lane = Math.floor(Math.random() * LANES);
    const y = -40;
    const thing = { kind, y, lane, x: laneX(lane), w: 30, h: 30, fatal: true, born: run.t };
    switch (kind) {
      case 'post': thing.w = 22; thing.h = 22; break;
      case 'sack': thing.w = 46; thing.h = 34; break;
      case 'puddle': thing.w = 52; thing.h = 18; thing.fatal = false; break;
      case 'snail': thing.w = 22; thing.h = 14; thing.vx = rand(-8, 8); break;
      case 'spool': thing.w = 16; thing.h = 16; thing.vx = pick([-1, 1]) * rand(38, 64); break;
      case 'pigeon': thing.w = 22; thing.h = 14; thing.vx = pick([-1, 1]) * rand(20, 40); thing.flap = rand(0, 6); break;
      case 'clerk': thing.w = 26; thing.h = 30; thing.vx = pick([-1, 1]) * 26; break;
      case 'wasps': thing.w = 26; thing.h = 22; thing.zig = rand(0, 6); break;
      case 'chair': thing.w = 30; thing.h = 26; break;
      case 'dividers': {
        // Two children and a brass divider across two lanes; one lane beside them is clear.
        const start = Math.floor(Math.random() * (LANES - 1));
        thing.lanes = [start, start + 1];
        thing.x = (laneX(start) + laneX(start + 1)) / 2;
        thing.w = LANE_W * 2 - 10;
        thing.h = 22;
        break;
      }
      case 'banner':
      case 'table': {
        // Across every lane but one: the gap is the way through (at the table, the empty place).
        const gap = Math.floor(Math.random() * LANES);
        thing.gap = gap;
        thing.x = W / 2;
        thing.w = W;
        thing.h = kind === 'table' ? 34 : 18;
        break;
      }
      default: break;
    }
    run.things.push(thing);
  };

  const hits = (thing) => {
    const py = PLAYER_Y - 18;   // the pie rides at chest height
    const ph = 40;
    const pw = 26;
    const overlapY = Math.abs(thing.y - py) < (thing.h + ph) / 2;
    if (!overlapY) return false;
    if (thing.kind === 'banner' || thing.kind === 'table') {
      const gapLeft = thing.gap * LANE_W + 6;
      const gapRight = (thing.gap + 1) * LANE_W - 6;
      return run.x - pw / 2 < gapLeft || run.x + pw / 2 > gapRight;
    }
    return Math.abs(thing.x - run.x) < (thing.w + pw) / 2;
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
    run.wobble = Math.min(1.2, run.wobble + (hurried ? 0.36 : 0.22));
  };

  /* ─── Title cards: the prophecy and the cuts, like a silent film ─── */
  const showCard = (title, line, action) => {
    cardTitle.textContent = title;
    cardLine.textContent = line || '';
    cardAction.textContent = action || '';
    cardAction.hidden = !action;
    card.hidden = false;
  };
  const hideCard = () => { card.hidden = true; };

  const start = () => {
    colors = palette();
    run = fresh();
    state = 'cut';
    showCard(scene().card, '', '');
    say(`Carrying the pie. ${scene().card}`);
    setTimeout(() => {
      if (state === 'cut') {
        hideCard();
        state = 'running';
      }
    }, reduced?.matches ? 700 : 1100);
    last = performance.now();
    loop();
  };

  const cutTo = (index) => {
    run.sceneIndex = index;
    run.sceneStart = cobbles();
    run.things = run.things.filter((thing) => thing.y > H * 0.55);
    state = 'cut';
    const again = index >= SCENES.length ? ' Again, and faster.' : '';
    showCard(scene().card, again.trim(), '');
    say(`${scene().card}${again}`);
    setTimeout(() => {
      if (state === 'cut') {
        hideCard();
        state = 'running';
        last = performance.now();
      }
    }, reduced?.matches ? 650 : 1000);
  };

  const spill = (cause) => {
    state = 'spilling';
    run.spill = { cause, t: 0, dir: run.dir || pick([-1, 1]), x: run.x, y: PLAYER_Y - 18 };
    const distance = cobbles();
    record.runs += 1;
    record.causes[cause] = (record.causes[cause] || 0) + 1;
    const best = distance > record.best;
    if (best) record.best = distance;
    writeRecord(record);
    paintBest();
    setTimeout(() => {
      state = 'over';
      showCard('Exactly one.', `${CAUSES[cause]} He carried it ${distance} cobbles${best ? ', further than ever' : ''}. The hat did not fall.`, 'Carry another pie');
      say(`Spilled. ${CAUSES[cause]} ${distance} cobbles.`);
      cardAction.focus({ preventScroll: true });
    }, reduced?.matches ? 300 : 1100);
  };

  /* ─── The world moving ─── */
  const update = (dt) => {
    run.t += dt;
    if (state === 'running') {
      run.speed = Math.min(430, run.speed + dt * (5 + run.sceneIndex * 1.5));
      run.scroll += run.speed * dt;
      if (cobbles() - run.sceneStart >= SCENE_LENGTH) {
        cutTo(run.sceneIndex + 1);
        return;
      }
      run.spawnIn -= dt;
      if (run.spawnIn <= 0) {
        spawn();
        run.spawnIn = clamp(rand(0.55, 1.05) * (190 / run.speed) * 1.6, 0.32, 1.2);
      }
      run.boofIn -= dt;
      if (run.boofIn <= 0 && !run.boof) {
        const from = pick([-1, 1]);
        run.boof = { x: from < 0 ? -40 : W + 40, y: rand(80, 200), vx: -from * rand(60, 80), touched: false };
        run.boofIn = rand(12, 18);
      }
    }
    // Stepping: a line segment, quickly drawn.
    run.moveT = Math.min(1, run.moveT + dt / 0.09);
    run.x = run.from + (laneX(run.lane) - run.from) * (1 - (1 - run.moveT) ** 3);
    // The pie settles if you let it.
    run.wobble = Math.max(0, run.wobble - dt * 0.42);
    run.phase += dt * (6 + run.wobble * 10);
    if (run.steadied > 0) run.steadied -= dt;

    if (state === 'running') {
      run.things.forEach((thing) => {
        thing.y += run.speed * dt;
        if (thing.vx) {
          thing.x += thing.vx * dt;
          if (thing.x < 14 || thing.x > W - 14) thing.vx *= -1;
        }
        if (thing.kind === 'wasps') thing.x = laneX(thing.lane) + Math.sin((run.t + thing.zig) * 4) * LANE_W * 0.55;
        if (thing.kind === 'pigeon') thing.flap += dt * 14;
      });
      run.things = run.things.filter((thing) => thing.y < H + 60);
      for (const thing of run.things) {
        if (!hits(thing)) continue;
        if (thing.kind === 'puddle') {
          if (!thing.slipped) {
            thing.slipped = true;
            run.wobble = Math.min(1.2, run.wobble + 0.42);
            say('A puddle. The pie slides.');
          }
          continue;
        }
        spill(thing.kind);
        return;
      }
      if (run.boof) {
        run.boof.y += run.speed * dt * 0.55;
        run.boof.x += run.boof.vx * dt;
        if (!run.boof.touched && Math.abs(run.boof.x - run.x) < 30 && Math.abs(run.boof.y - (PLAYER_Y - 10)) < 34) {
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
    if (run.spill) run.spill.t += dt;
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

  const drawScene = () => {
    const s = run ? scene() : SCENES[0];
    const tint = { night: colors.night, bronze: colors.gold, ember: colors.hearth, gold: colors.gold }[s.tint];
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix(colors.paper, tint, s.tint === 'night' ? 0.32 : 0.16));
    sky.addColorStop(1, mix(colors.deep, tint, s.tint === 'night' ? 0.22 : 0.08));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Cobbles, scrolling with the scene.
    const offset = (run?.scroll || 0) % 32;
    ctx.strokeStyle = mix(colors.muted, colors.paper, 0.72);
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
  };

  const drawThing = (thing) => {
    const { x, y } = thing;
    ctx.save();
    switch (thing.kind) {
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
    ctx.beginPath();
    ctx.arc(x, y - 44, 9, 0, Math.PI * 2);          // head
    ctx.stroke();
    ctx.strokeRect(x - 8, y - 33, 16, 26);             // body
    ctx.beginPath();                                     // legs
    ctx.moveTo(x - 4, y - 7); ctx.lineTo(x - 6 - stride, y + 16);
    ctx.moveTo(x + 4, y - 7); ctx.lineTo(x + 6 + stride, y + 16);
    ctx.stroke();
    const spilled = run?.spill;
    const tilt = run && !spilled ? Math.sin(run.phase) * run.wobble * 0.38 + (run.dir || 0) * run.wobble * 0.12 : 0;
    // Arms: two lines from the shoulders, down and out to the plate's rim.
    const px = x;
    const py = y - 18;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 30); ctx.lineTo(px - 18, py + 2);
    ctx.moveTo(x + 8, y - 30); ctx.lineTo(px + 18, py + 2);
    ctx.stroke();
    // Eyes, when the drawing remembers them.
    ctx.beginPath();
    ctx.arc(x - 3, y - 45, 1.3, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 45, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (!spilled) drawPie(px, py, tilt);
    drawHat();
  };

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

  const drawHud = () => {
    if (!run) return;
    ctx.fillStyle = colors.ink;
    ctx.font = '600 12px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${cobbles()} cobbles`, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`best ${Math.max(record.best, 0)}`, W - 10, 20);
  };

  function draw() {
    if (!canvas.width) return;
    drawScene();
    run?.things.forEach(drawThing);
    drawBoof();
    drawFigure();
    drawSpill();
    drawRain();
    drawHud();
  }

  function loop() {
    cancelAnimationFrame(frame);
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state === 'running' || state === 'spilling' || state === 'cut') update(state === 'cut' ? 0 : dt);
      draw();
      if (state !== 'paused' && state !== 'title' && state !== 'over') frame = requestAnimationFrame(tick);
      else if (state === 'over') draw();
    };
    frame = requestAnimationFrame(tick);
  }

  const pause = () => {
    if (state !== 'running') return;
    state = 'paused';
    showCard('A pause.', 'He holds the pie very still. The city waits, politely.', 'Carry on');
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
    const steering = state === 'running' || state === 'cut' || root.contains(document.activeElement);
    if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && steering) { event.preventDefault(); step(-1); }
    else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && steering) { event.preventDefault(); step(1); }
    else if (key === ' ' || key === 'Enter') {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
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
  const onTouchStart = (event) => { touchX = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event) => {
    const endX = event.changedTouches[0]?.clientX;
    if (touchX != null && endX != null && Math.abs(endX - touchX) > 28) {
      event.preventDefault();
      step(endX < touchX ? -1 : 1);
    }
    touchX = null;
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
  cardAction.addEventListener('click', onAction);
  card.addEventListener('click', (event) => { if (event.target === card && (state === 'title' || state === 'over')) start(); });
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  const resize = new ResizeObserver(fit);
  resize.observe(canvas);
  // The binding can change while the page is open (home/bindery.mjs); the game follows.
  const recolor = new MutationObserver(() => { colors = palette(); draw(); });
  recolor.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  paintBest();
  showCard('Someone is destined to spill exactly one pie.', 'Nobody has said who. Through the lanes of Bonk City, a figure in a hat is carrying one, level, in both hands.', 'Carry the pie');
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
