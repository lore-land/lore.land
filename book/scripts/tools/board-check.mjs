#!/usr/bin/env node
// @ts-check
/**
 * board-check.mjs — the board, held to account without a browser (npm run board:check).
 *
 * The pie game's board is a frame around a world that is one size for everyone (pie-frame.mjs). This walks a table
 * of real screen sizes, each held the way it would be, through frameFor() with the overlays a filled screen
 * keeps (switches, buttons, safe areas), and fails if any screen would:
 *   - cut the world (every lane, the whole length of the road, in view),
 *   - put the world under the switches, or under the buttons anywhere but the road's foot already passed,
 *   - put the carrier under a button,
 *   - stretch the world (it keeps its own shape on every screen).
 * Then it reads every ⚙ Setup choice out as a ^board{ … } line and back, by the small reader and by the real
 * Spw parser, which must agree; and it checks lines that must not read (negative controls) do not.
 * The numbers are estimates of where overlays stand, not measurements: a browser has the last word (npm run smoke).
 */
import { WORLD, frameFor, SETUP, SETUP_GROUPS, HOLDS, ALLOWED, suggestHold, boardLine, readBoardLine } from '../home/pie-frame.mjs';
import { planPanels } from '../home/pie-panels.mjs';

const { W, H, PLAYER_Y } = WORLD;
const REM = 16;
/** @type {string[]} */
const fails = [];
/** @type {string[]} */
const rows = [];
const fail = (/** @type {string} */ why) => fails.push(why);

// Screens: [name, width, height, touch, safe top, safe bottom, safe side].
/** @type {Array<[string, number, number, boolean, number, number, number]>} */
const SCREENS = [
  ['small phone, held up', 320, 568, true, 20, 0, 0],
  ['android, held up', 360, 640, true, 24, 0, 0],
  ['phone, held up', 390, 844, true, 47, 34, 0],
  ['large phone, held up', 430, 932, true, 59, 34, 0],
  ['small phone, on its side', 568, 320, true, 0, 0, 0],
  ['android, on its side', 640, 360, true, 0, 0, 0],
  ['phone, on its side', 844, 390, true, 0, 21, 47],
  ['large phone, on its side', 932, 430, true, 0, 21, 59],
  ['tablet, held up', 768, 1024, true, 24, 20, 0],
  ['tablet, on its side', 1024, 768, true, 24, 20, 0],
  ['large tablet, held up', 1024, 1366, true, 24, 20, 0],
  ['laptop', 1280, 800, false, 0, 0, 0],
  ['desk', 1920, 1080, false, 0, 0, 0],
  ['wide desk', 2560, 1080, false, 0, 0, 0]
];

/**
 * Where the overlays of a filled screen stand, estimated from pie.css: the switches a row at the top (a two-wide
 * rail on the far verge when the screen is on its side); the buttons three rows at the foot, which on a screen on
 * its side split into a column at each edge.
 * @param {number} w @param {number} h @param {number} scale @param {number} safeTop @param {number} safeBottom @param {number} safeSide
 */
function reserveFor(w, h, scale, safeTop, safeBottom, safeSide) {
  const across = w > h * 1.15;
  const keyH = 2.3 * REM * scale;
  const actW = 3.5 * REM * scale;
  const steps = 3 * keyH + 2 * 0.25 * REM + 0.45 * REM + safeBottom + 4;
  if (!across) return { top: safeTop + 2.4 * REM, bottom: steps, left: 0, right: 0 };
  const rail = 2 * 2.2 * REM + 0.9 * REM;
  return { top: 0, bottom: 0, left: safeSide + 0.45 * REM + actW + 4, right: Math.max(safeSide + 0.45 * REM + actW + 4, rail + 0.3 * REM) };
}

for (const [name, w, h, touch, safeTop, safeBottom, safeSide] of SCREENS) {
  const hold = suggestHold({ coarse: touch, vw: w, vh: h });
  if (!HOLDS[hold]) fail(`${name}: suggests "${hold}", which is not a hold`);
  const holds = touch ? [hold, ...Object.keys(HOLDS).filter((k) => k !== hold && k !== 'desk')] : [hold];
  for (const id of holds) {
    const view = HOLDS[id]?.view || {};
    if (view.fill !== 'fill') continue;
    for (const share of /** @type {number[]} */ (ALLOWED.share)) {
      const reserve = reserveFor(w, h, Number(view.controlsSize) || 1, safeTop, safeBottom, safeSide);
      const f = frameFor({ box: { w, h }, reserve, share });
      const at = `${name} (${w}×${h}), ${id}, lanes ${share}`;
      const left = -f.x0 * f.s;
      const top = -f.y0 * f.s;
      const right = left + W * f.s;
      const bottom = top + H * f.s;
      const e = 0.5;
      if (f.x0 > e || f.y0 > e || f.x0 + f.w < W - e || f.y0 + f.h < H - e) fail(`${at}: the world is cut`);
      if (top < Math.min(reserve.top, h * 0.34) - e) fail(`${at}: the world is under the switches (${top.toFixed(1)} < ${reserve.top.toFixed(1)})`);
      if (left < Math.min(reserve.left, w * 0.34) - e || right > w - Math.min(reserve.right, w * 0.34) + e) fail(`${at}: the world is under a verge's buttons`);
      const carrierFoot = (PLAYER_Y + 30 - f.y0) * f.s;
      if (carrierFoot > h - Math.min(reserve.bottom, h * 0.34) + e) fail(`${at}: the carrier stands under the buttons`);
      if (Math.abs((W * f.s) / (H * f.s) - W / H) > 1e-9) fail(`${at}: the world is stretched`);
      if (share === 1 && id === hold) {
        const laneW = (W / 5) * f.s;
        rows.push(`${name.padEnd(26)} ${String(w).padStart(4)}×${String(h).padEnd(4)} ${id.padEnd(10)} lanes ${Math.round(W * f.s)}×${Math.round(H * f.s)} px (${Math.round((W * f.s * H * f.s) / (w * h) * 100)}% of the screen), a lane ${laneW.toFixed(0)} px; haze ${Math.round(f.bands.above)}, ground ${Math.round(f.bands.below)}, verges ${Math.round(f.bands.left)}/${Math.round(f.bands.right)} world units`);
        if (laneW < 34) fail(`${at}: a lane is ${laneW.toFixed(1)} px, under a fingertip`);
      }
    }
  }
}

// A filled screen's plan: the lanes have it, the heights wait, the buttons are over the ground.
{
  const plan = planPanels({ vw: 390, vh: 844, coarse: true, fill: true, want: { caption: true, strip: true, heights: true, show: true } });
  if (plan.arrangement !== 'fill' || plan.forms.heights !== 'off' || plan.forms.caption !== 'glass' || plan.place !== 'over') fail(`a filled plan came out ${JSON.stringify({ arrangement: plan.arrangement, forms: plan.forms, place: plan.place })}`);
  if (!/full screen/.test(plan.why)) fail(`a filled plan's words do not say it is full screen: ${plan.why}`);
}

// Every Setup row is in a section (the hold is drawn in Layouts), and every hold sets only values its rows have.
{
  const placed = new Set([...SETUP_GROUPS.flatMap(([, , , keys]) => keys), 'hold']);
  SETUP.forEach(([key]) => { if (!placed.has(key)) fail(`Setup row ${key} is in no section`); });
  Object.entries(HOLDS).forEach(([id, hold]) => Object.entries(hold.view).forEach(([key, value]) => {
    if (!ALLOWED[key]?.some((v) => v === value)) fail(`hold ${id} sets ${key} to ${value}, which its row does not have`);
  }));
}

// The line: every choice out and back, by both readers.
const seed = await import('../vendor/spw-seed.mjs').catch(() => null);
const parse = seed?.parse || null;
if (!parse) fail('the vendored Spw parser could not be loaded, so the line was not read by it');
let terms = 0;
for (const [key, values] of Object.entries(ALLOWED)) {
  for (const value of values) {
    const line = boardLine((k) => (k === key ? value : undefined));
    const small = readBoardLine(line);
    const tree = parse ? readBoardLine(line, { parse }) : small;
    terms += 1;
    if (small.view[key] !== value) fail(`${line}: the small reader read ${JSON.stringify(small.view)}`);
    if (tree.view[key] !== value || tree.reader !== 'spw-seed') fail(`${line}: the parser read ${JSON.stringify(tree.view)} (${tree.reader}; ${tree.unknown.join('; ')})`);
    if (small.unknown.length || tree.unknown.length) fail(`${line}: a clean line left terms unread: ${[...small.unknown, ...tree.unknown].join('; ')}`);
  }
}
{
  /** @type {Record<string, import('../home/pie-frame.mjs').Choice>} */
  const everything = Object.fromEntries(Object.entries(ALLOWED).map(([key, values]) => [key, values[values.length - 1]]));
  const line = boardLine((k) => everything[k]);
  const a = readBoardLine(line);
  const b = parse ? readBoardLine(line, { parse }) : a;
  if (JSON.stringify(a.view) !== JSON.stringify(everything) || JSON.stringify(b.view) !== JSON.stringify(everything)) fail(`the whole line did not come back: ${line}`);
  rows.push(`the line with every row set: ${line.length} characters, read back whole by ${b.reader}`);
}
// Lines that must not read whole, or must say what they could not take.
/** @type {Array<[string, (r: ReturnType<typeof readBoardLine>) => boolean, string]>} */
const CONTROLS = [
  ['^board{ =tap[go }', (r) => r.unknown.some((u) => /did not read whole/.test(u)), 'an unclosed frame is said not to read whole'],
  ['^board{ =tap[fly] }', (r) => !('tap' in r.view) && r.unknown.some((u) => /not one of its values/.test(u)), 'a value the row does not have is refused'],
  ['^board{ =wings[two] }', (r) => r.unknown.some((u) => /not a choice/.test(u)), 'a key the board does not have is refused'],
  ['^board{ %tap[go] }', (r) => r.view.tap === 'go' && r.unknown.some((u) => /written =tap/.test(u)), 'a term in the wrong sigil is read, and the right one said'],
  ['=tap[go]', (r) => !Object.keys(r.view).length, 'a term outside ^board{ } is not a board'],
  ["^board{ =tap[go] the maker's }", (r) => r.unknown.some((u) => /did not read whole/.test(u)), 'an apostrophe in the body is said not to read whole']
];
if (parse) CONTROLS.forEach(([line, ok, what]) => { const r = readBoardLine(line, { parse }); if (!ok(r)) fail(`negative control failed (${what}): ${line} gave ${JSON.stringify(r)}`); });

console.log(`[board] ${SCREENS.length} screens, each in its suggested hold and every touch hold that fills; ${terms} choices out and back by both readers; ${parse ? CONTROLS.length : 0} negative controls.`);
rows.forEach((row) => console.log(`  ${row}`));
if (fails.length) {
  console.error(`[board] ${fails.length} problem${fails.length === 1 ? '' : 's'}:`);
  fails.slice(0, 40).forEach((f) => console.error(`  ✕ ${f}`));
  process.exit(1);
}
console.log('[board] ok. Overlay sizes are estimates from the stylesheet; nothing here was seen in a browser.');
