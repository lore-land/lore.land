/**
 * pie/sim/input.mjs — keyboard, pointer, touch, button, visibility, resize,
 * and theme-recolor listeners for Exactly One Pie.
 *
 * Adds hotkey `R` to announce the live ARIA semantic board mirror snapshot
 * on demand (`PLAN.F#f36`) without interrupting gameplay.
 */

const FLICK_MS = 220;

/**
 * Bind all live input controls and lifecycle observers.
 * Returns a cleanup callback invoked by `initPieGame`'s teardown function.
 * @param {object} deps
 */
export function initPieInput({
  root, canvas, voyage, card, cardAction, left, right, soundToggle, record,
  W, LANE_W, PLAYER_Y, ROWS, ROW_H, AIM_MAX, TUNE,
  clamp, laneX, rowY, laneAt, viewScale, throwFrom, spawnRing,
  getRun, getState, getBoard, getColors, setColors, palette,
  setting, isAsking, inspect,
  start, pause, resume, closeReveal, setFull, cycleShow,
  step, climb, jump, throwSlice, turnAim,
  fit, draw, paintLegend, paintSound, writeRecord,
  primeAudio, setMusicBed, setSoundTilt, setAmbience, wapSound, placesOn, scene,
  onReadBoardStatus
}) {
  const onKey = (event) => {
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const key = event.key;
    const state = getState();
    if (state === 'revealing' && (key === ' ' || key === 'Enter' || key === 'Escape')) {
      event.preventDefault();
      closeReveal();
      return;
    }
    if (key === 'Escape' && voyage?.classList.contains('is-immersive') && state !== 'running') {
      setFull(false);
      return;
    }
    const steering = state === 'running' || root.contains(document.activeElement);
    const lower = key.length === 1 ? key.toLowerCase() : key;
    const moves = { ArrowLeft: [step, -1], a: [step, -1], ArrowRight: [step, 1], d: [step, 1], ArrowUp: [climb, 1], w: [climb, 1], ArrowDown: [climb, -1], s: [climb, -1] };
    if (moves[lower] && steering) {
      event.preventDefault();
      const [move, dir] = moves[lower];
      move(dir);
    } else if ((key === ' ' || lower === 'j') && state === 'running') {
      event.preventDefault();
      jump();
    } else if ((lower === 'x' || lower === 'f') && state === 'running') {
      event.preventDefault();
      throwSlice();
    } else if ((lower === 'q' || lower === 'e' || key === '[' || key === ']') && state === 'running') {
      event.preventDefault();
      turnAim(lower === 'q' || key === '[' ? -1 : 1);
    } else if (key === ' ' || key === 'Enter') {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (event.target.closest?.('a, button')) return;
      event.preventDefault();
      if (state === 'paused') resume();
      else if (state === 'running') pause();
      else if (state === 'title' || state === 'over') start();
    } else if ((key === 'Escape' || lower === 'p') && state === 'running') {
      pause();
    } else if (lower === 'v' && !event.metaKey && !event.ctrlKey) {
      cycleShow();
    } else if (lower === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      onReadBoardStatus?.();
    }
  };

  let press = null;
  const toGame = (event) => {
    const board = getBoard();
    const box = canvas.getBoundingClientRect();
    const y = board.y0 + ((event.clientY - box.top) / box.height) * board.h;
    const x = W / 2 + ((board.x0 + ((event.clientX - box.left) / box.width) * board.w) - W / 2) / viewScale(y);
    return { x, y, px: box.width / board.w };
  };
  const stepAcross = () => LANE_W * TUNE.swipe_across;
  const stepAlong = () => TUNE.swipe_along;

  const onPointerDown = (event) => {
    const state = getState();
    const run = getRun();
    const at = toGame(event);
    const nearPie = state === 'running' && run && Math.hypot(at.x - run.x, at.y - (run.y - 24)) < 34;
    press = { x: event.clientX, y: event.clientY, id: event.pointerId, at, ox: at.x, oy: at.y, fromPie: nearPie, steps: 0, aimed: false, t0: performance.now() };
    if (state === 'running') { try { canvas.setPointerCapture?.(event.pointerId); } catch { /* cannot hold */ } }
  };

  const onPointerMoveWhilePressed = (event) => {
    const state = getState();
    const run = getRun();
    if (!press || press.id !== event.pointerId || state !== 'running' || !run) return false;
    const at = toGame(event);
    if (press.fromPie) {
      const from = throwFrom();
      if (Math.hypot(at.x - from.x, at.y - from.y) > 14 && at.y < from.y) {
        run.aim.a = clamp(Math.atan2(at.x - from.x, from.y - at.y), -AIM_MAX, AIM_MAX);
        press.aimed = true;
      }
      return true;
    }
    const dx = at.x - press.ox;
    const dy = at.y - press.oy;
    if (!press.axis && Math.hypot(dx, dy) > 10) press.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    if (press.axis === 'x' && Math.abs(dx) >= stepAcross()) {
      step(dx < 0 ? -1 : 1);
      press.ox += Math.sign(dx) * stepAcross();
      press.oy = at.y;
      press.steps += 1;
    } else if (press.axis === 'y' && Math.abs(dy) >= stepAlong()) {
      if (dy < 0 && setting('swipeUp') === 'hop' && performance.now() - press.t0 < FLICK_MS) return true;
      climb(dy < 0 ? 1 : -1);
      press.oy += Math.sign(dy) * stepAlong();
      press.ox = at.x;
      press.steps += 1;
    }
    return true;
  };

  let lastTap = null;
  const tapLanes = (at) => {
    const run = getRun();
    const colors = getColors();
    const now = performance.now();
    const twice = setting('doubleTap') !== 'none' && lastTap && now - lastTap.t < 320 && Math.hypot(at.x - lastTap.x, at.y - lastTap.y) < 54;
    lastTap = twice ? null : { t: now, x: at.x, y: at.y };
    const what = twice ? setting('doubleTap') : setting('tap');
    if (what === 'hop') { jump(); return; }
    if (what === 'go') {
      run.target = { lane: laneAt(at.x), row: clamp(Math.round((PLAYER_Y - at.y) / ROW_H), 0, ROWS - 1), held: false };
      spawnRing(laneX(run.target.lane), rowY(run.target.row) - 6, 16, colors.gold, 0.35);
      return;
    }
    if (what === 'step') {
      if (Math.abs(at.x - run.x) > LANE_W * 0.5) step(at.x < run.x ? -1 : 1);
      else climb(at.y < run.y - ROW_H * 0.5 ? 1 : -1);
      return;
    }
    if (what !== 'throw') return;
    const from = throwFrom();
    if (at.y > from.y - 10) {
      step(at.x < run.x ? -1 : 1);
      return;
    }
    const angle = Math.atan2(at.x - from.x, from.y - at.y);
    run.aim.a = clamp(angle, -AIM_MAX, AIM_MAX);
    throwSlice(angle);
  };

  const onPointerUp = (event) => {
    if (!press || press.id !== event.pointerId) return;
    const done = press;
    press = null;
    const state = getState();
    const run = getRun();
    const dx = event.clientX - done.x;
    const dy = event.clientY - done.y;
    if (state === 'title' || state === 'over') {
      start();
      return;
    }
    if (state !== 'running') return;
    if (isAsking() && Math.hypot(dx, dy) < 26 && inspect(toGame(event))) return;
    if (done.fromPie) {
      if (done.aimed) throwSlice(run.aim.a);
      else jump();
      return;
    }
    if (!done.steps && setting('swipeUp') === 'hop' && dy < -26 && Math.abs(dy) > Math.abs(dx) * 1.2 && performance.now() - done.t0 < FLICK_MS + 80) {
      jump();
      return;
    }
    if (done.steps) return;
    if (Math.hypot(dx, dy) > 26) {
      if (Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? -1 : 1);
      else climb(dy < 0 ? 1 : -1);
      return;
    }
    tapLanes(toGame(event));
  };

  const onPointerMove = (event) => {
    if (onPointerMoveWhilePressed(event)) return;
    const run = getRun();
    if (getState() !== 'running' || !run || event.pointerType === 'touch') return;
    const at = toGame(event);
    run.pointer = { x: at.x, y: at.y, active: true };
    const from = throwFrom();
    if (at.y < from.y - 10) run.aim.a = clamp(Math.atan2(at.x - from.x, from.y - at.y), -AIM_MAX, AIM_MAX);
  };
  const onPointerLeave = () => {
    const run = getRun();
    if (run?.pointer) run.pointer.active = false;
  };
  const onVisibility = () => { if (document.hidden) pause(); };
  const onAction = () => {
    if (getState() === 'paused') resume();
    else start();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', () => { press = null; });

  const onPress = (button, act) => {
    if (!button) return;
    let pressed = -1;
    button.addEventListener('pointerdown', (event) => {
      if (event.button > 0) return;
      event.preventDefault();
      pressed = performance.now();
      act();
    });
    button.addEventListener('click', (event) => { if (event.detail && performance.now() - pressed < 800) return; act(); });
  };
  onPress(left, () => step(-1));
  onPress(right, () => step(1));
  onPress(root.querySelector('[data-pie-jump]'), jump);
  root.querySelectorAll('[data-pie-climb]').forEach((button) => onPress(button, () => climb(Number(button.dataset.pieClimb) || 1)));
  onPress(root.querySelector('[data-pie-throw]'), () => {
    const state = getState();
    if (state === 'title' || state === 'over') start();
    else throwSlice();
  });
  cardAction.addEventListener('click', onAction);
  card.addEventListener('click', (event) => {
    const state = getState();
    if (event.target === card && (state === 'title' || state === 'over')) start();
  });
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);

  const resize = new ResizeObserver(fit);
  resize.observe(canvas);
  const recolor = new MutationObserver(() => { setColors(palette()); draw(); paintLegend(); });
  recolor.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  soundToggle?.addEventListener('click', () => {
    record.sound = !record.sound;
    writeRecord(record);
    paintSound();
    if (!record.sound) { setMusicBed(false); setSoundTilt(0); setAmbience(null); }
    if (record.sound) {
      primeAudio();
      if (placesOn() && getRun() && getState() === 'running') setAmbience(scene().acoustic?.ambience || null);
      wapSound();
    }
  });

  return () => {
    resize.disconnect();
    recolor.disconnect();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
