// @ts-check
/**
 * pie/sim/aria-mirror.mjs — standard accessible semantic board mirror for `/pie/`
 * (PLAN.F#f36: zero Origin Trials, pure ARIA live/status mirror).
 *
 * Keeps a concise, human-readable text snapshot of the live lanes (chapter,
 * carrier, lane/row, tilt percentage, active recipe, nearest threat or friend
 * ahead) that screen-reader users can trigger on demand (hotkey `R`) or hear
 * politely at chapter/carrier/presence transitions without flooding the live
 * region on every animation frame.
 */

/**
 * @typedef {object} BoardMirrorSnapshot
 * @property {string} state
 * @property {number} chapter
 * @property {string} carrierName
 * @property {number} lane
 * @property {number} lanes
 * @property {number} row
 * @property {number} wobble
 * @property {number} waps
 * @property {number} cobbles
 * @property {string} recipeName
 * @property {string | null} presence
 * @property {string | null} aheadThreat
 * @property {string | null} aheadFriend
 * @property {string | null} caption
 */

/**
 * Build a concise, screen-reader-friendly summary sentence from a live run snapshot.
 * Pure function so it is deterministic and directly unit-testable.
 * @param {BoardMirrorSnapshot | null} snap
 * @returns {string}
 */
export function formatBoardReadout(snap) {
  if (!snap) return 'Exactly One Pie is ready to begin.';
  if (snap.state === 'title') return `Ready on Chapter ${snap.chapter}. Press Enter or Space to start carrying.`;
  if (snap.state === 'paused') return `Paused on Chapter ${snap.chapter}, lane ${snap.lane + 1} of ${snap.lanes}, tilt ${Math.round(snap.wobble * 100)} percent.`;
  if (snap.state === 'over') return `Carry finished at Chapter ${snap.chapter}, ${snap.cobbles} cobbles, ${snap.waps} WAPs.`;

  const parts = [
    `Chapter ${snap.chapter}`,
    `${snap.carrierName}, lane ${snap.lane + 1} of ${snap.lanes}${snap.row > 0 ? `, row ${snap.row + 1}` : ''}`,
    `tilt ${Math.round(Math.max(0, Math.min(1, snap.wobble)) * 100)}%`
  ];
  if (snap.recipeName && snap.recipeName !== 'Warm pie') parts.push(`pie ${snap.recipeName}`);
  if (snap.presence) parts.push(`${snap.presence} present`);
  if (snap.aheadThreat) parts.push(`ahead: ${snap.aheadThreat}`);
  else if (snap.aheadFriend) parts.push(`ahead: ${snap.aheadFriend}`);
  if (snap.waps > 0) parts.push(`${snap.waps} WAP${snap.waps === 1 ? '' : 's'}`);
  if (snap.caption) parts.push(snap.caption);
  return `${parts.join('. ')}.`;
}

/**
 * Mount a visually hidden (`sr-only`) polite ARIA status node inside the pie
 * cabinet (or reuse an existing `[data-pie-aria-mirror]` element) and expose
 * throttled update + on-demand readout hooks.
 *
 * @param {{ root: HTMLElement | null, say?: (line: string) => void }} opts
 */
export function createAriaMirror({ root, say }) {
  /** @type {HTMLElement | null} */
  let el = root?.querySelector('[data-pie-aria-mirror]') || null;
  if (!el && root && typeof document !== 'undefined') {
    el = document.createElement('div');
    el.dataset.pieAriaMirror = '';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    root.appendChild(el);
  }

  let lastText = '';
  let lastAt = 0;

  /**
   * Update the hidden status mirror politely (rate-limited unless `force` is true).
   * @param {BoardMirrorSnapshot | null} snap
   * @param {{ force?: boolean, announce?: boolean }} [opts]
   * @returns {string}
   */
  function sync(snap, { force = false, announce = false } = {}) {
    const text = formatBoardReadout(snap);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!force && (text === lastText || now - lastAt < 1400)) return text;
    lastText = text;
    lastAt = now;
    if (el) el.textContent = text;
    if (announce && typeof say === 'function') say(text);
    return text;
  }

  return {
    el,
    sync,
    readNow(snap) { return sync(snap, { force: true, announce: true }); },
    lastReadout() { return lastText; }
  };
}
