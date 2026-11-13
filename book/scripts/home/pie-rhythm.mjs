/**
 * pie-rhythm.mjs — the lanes keep time: each chapter's level, the musical clock, and rhythms to find.
 *
 * Levels live in .spw/runtime/pie-levels.spw: a chapter's tempo, its key (a root in hertz), its lean (%swing), the
 * motif its catches spell out, whose theme it carries, and the rhythm the land keeps in one of its rooms. A small reader here reads
 * them at once (the file is plain and regular, and the game need not wait for the parser); book:check reads the
 * file again with the Spw interpreter and holds the two reads to agree.
 *
 * The conductor is the clock the lanes keep: sixteen steps to the bar at the level's tempo, advanced by the
 * game's own time (so a pause pauses it). It counts in steps, not seconds, so a chapter with a new tempo goes on
 * from the same place in the bar. It decides when a row is let in, so that it arrives at the carrier on a
 * beat — every one, two or three beats, as the pace allows, the spacing the lanes always had, now in time.
 *
 * It also says what is about to sound: each step a moment before it falls, with how long until it does, so the
 * sound can be placed on the audio clock and not on whichever frame noticed it. A level may lean its
 * off-sixteenths late (%swing: where in the eighth the off-sixteenth falls, 50 even, 66 a triplet); the land
 * keeps its rhythm with that lean, and the carrier's steps are heard against it the same way.
 *
 * A rhythm is found by playing it. In its room the land keeps it softly; each step, hop or throw the carrier makes
 * is heard against its hits (on a hit: within WINDOW seconds of one), and six of the last seven on a hit find it.
 * Found rhythms are kept in this browser (lore.pie.rhythms.v1) and play under later carries (Setup: Music).
 */

/* The token is the release the levels last changed in, so a returning player's kept copy is not last release's. */
export const LEVELS_URL = '/.spw/runtime/pie-levels.spw?v=2026_11_09.S';
export const STORE = 'lore.pie.rhythms.v1';
export const WINDOW = 0.075;
const NEED = 6;
const OF = 7;
/* How far ahead (seconds, as the listener counts them) a step is said before it falls. */
const LOOK = 0.09;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ─── Reading the levels: a small reader for a plain, regular file ─── */

const blockOf = (text, name) => {
  const at = text.indexOf(`!${name}{`);
  if (at < 0) return '';
  let depth = 0;
  for (let i = text.indexOf('{', at); i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') { depth -= 1; if (depth === 0) return text.slice(text.indexOf('{', at) + 1, i); }
  }
  return '';
};
const entriesOf = (block) => [...block.matchAll(/\*([a-z0-9_]+)\{([^\n]*)\}\s*$/gim)].map((m) => [m[1], m[2]]);
const field = (body, op, label) => {
  const m = body.match(new RegExp(`\\${op}${label}\\[("([^"]*)"|[^\\]]*)\\]`));
  return m ? (m[2] !== undefined ? m[2] : m[1].trim()) : null;
};

/** Read the levels file's text into { levels: {1: …}, rhythms: {name: …} }. Nothing here can throw. */
export function readLevels(text = '') {
  const levels = {};
  const rhythms = {};
  try {
    entriesOf(blockOf(text, 'levels')).forEach(([id, body]) => {
      const n = Number(id.replace(/\D/g, ''));
      if (!n) return;
      levels[n] = {
        tempo: Number(field(body, '%', 'tempo')) || null,
        root: Number(field(body, '%', 'root')) || null,
        swing: Number(field(body, '%', 'swing')) || null,
        motif: (field(body, '~', 'motif') || '').split(/\s+/).filter(Boolean).map(Number).filter(Number.isFinite),
        theme: field(body, '@', 'theme'),
        rhythm: field(body, '*', 'rhythm'),
        room: field(body, '.', 'room')
      };
    });
    entriesOf(blockOf(text, 'rhythms')).forEach(([id, body]) => {
      const steps = field(body, '.', 'steps') || '';
      if (!/^[Xx.]{16}$/.test(steps)) return;
      const ref = body.match(/~"([^"]+)"/);
      rhythms[id] = {
        id,
        steps,
        hits: [...steps].map((c, i) => (c === '.' ? null : i)).filter((i) => i !== null),
        strong: [...steps].map((c, i) => (c === 'X' ? i : null)).filter((i) => i !== null),
        voice: field(body, '!', 'voice') || 'tock',
        chapter: Number(field(body, '&', 'chapter')) || null,
        name: field(body, '#', 'name') || id,
        says: field(body, '#', 'says') || '',
        ref: ref ? ref[1] : null
      };
    });
  } catch { /* a level that will not read is a level the game's defaults carry */ }
  return { levels, rhythms };
}

export async function loadLevels() {
  const text = await fetch(LEVELS_URL).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  return { text, ...readLevels(text) };
}

/* ─── What has been found ─── */

export function foundRhythms() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; }
}
function keepFound(id, chapter) {
  try {
    const all = foundRhythms();
    if (all[id]) return false;
    all[id] = { found: new Date().toISOString().slice(0, 10), chapter };
    localStorage.setItem(STORE, JSON.stringify(all));
    return true;
  } catch { return false; }
}

/* ─── The conductor ─── */

/**
 * A clock for the lanes. tick(dt, { speed, travel, gap, rate }) advances it and says what happened this frame:
 * { steps: [step indices passed], beat, bar, row, late, ahead } — row is true when a row should be let in now so
 * that it reaches the carrier on a beat; late is how long ago the beat fell (seconds, as the listener counts
 * them); ahead is each step about to sound, { k, step, bar, in }, said once, a moment before it falls. rate is
 * game seconds per real second (the pace, a slowed moment), so `late` and `in` are real time.
 * act(kind) hears an action against the hidden rhythm; when one is found, onFound(rhythm) is called once.
 */
export function createConductor({ onFound = () => {} } = {}) {
  const c = {
    tempo: 96, swing: 0.5, writtenSwing: 0.5, swingOverride: null, t: 0, pos: 0, step: -1, said: -1, level: null, rhythm: null, rhythms: {}, chapter: 1,
    lastRowStep: -999, inRoom: false, heard: [], whispered: false, lastPocket: null, lastSwungStep: null
  };
  const sixteenth = () => 60 / c.tempo / 4;
  /* Where a step falls, in steps: an off-sixteenth leans late by the level's swing. */
  const lean = () => (c.swing - 0.5) * 2;
  const stepPos = (k) => k + (Math.abs(k) % 2 ? lean() : 0);

  c.setLevels = ({ rhythms = {} } = {}) => { c.rhythms = rhythms; };

  c.setChapter = (n, level = null) => {
    c.chapter = n;
    c.level = level;
    c.tempo = level?.tempo || 96;
    c.writtenSwing = clamp((level?.swing || 50) / 100, 0.5, 0.67);
    c.swing = c.swingOverride != null ? clamp(c.swingOverride, 0.5, 0.67) : c.writtenSwing;
    c.rhythm = level?.rhythm ? c.rhythms[level.rhythm] || null : null;
    c.heard = [];
    c.inRoom = false;
  };

  /** Override swing ratio directly (e.g. from Setup Swing / Jazz feel), or pass null for chapter default. */
  c.setSwingOverride = (swingFrac = null) => {
    c.swingOverride = swingFrac == null ? null : clamp(swingFrac, 0.5, 0.67);
    c.swing = c.swingOverride != null ? c.swingOverride : c.writtenSwing;
  };

  /** The hidden rhythm is kept in its room: is the carry passing it? */
  c.setRoom = (sig = '') => {
    const was = c.inRoom;
    c.inRoom = Boolean(c.rhythm && c.level?.room && String(sig).includes(c.level.room));
    if (c.inRoom !== was) c.heard = [];
    return c.inRoom && !was;
  };

  c.tick = (dt, { speed = 150, travel = 2, gap = 220, rate = 1 } = {}) => {
    const out = { steps: [], ahead: [], beat: false, bar: false, row: false, late: 0 };
    if (!(dt > 0)) return out;
    const s = sixteenth();
    const r = clamp(rate || 1, 0.05, 4);
    c.t += dt;
    c.pos += dt / s;
    const now = Math.floor(c.pos);
    // What is about to sound: every step whose moment comes within the look-ahead, said once.
    if (c.said < now - 1) c.said = now - 1;
    const reach = c.pos + (LOOK * r) / s;
    for (let k = c.said + 1, guard = 0; stepPos(k) <= reach && guard < 8; k += 1, guard += 1) {
      out.ahead.push({ k, step: k % 16, bar: Math.floor(k / 16), in: Math.max(0, ((stepPos(k) - c.pos) * s) / r) });
      c.said = k;
    }
    // Every step passed this frame (a slow frame can pass two); the row is decided on the last.
    for (let k = Math.max(c.step + 1, now - 4); k <= now; k += 1) {
      out.steps.push(k);
      if (k % 4 === 0) { out.beat = true; out.late = ((c.pos - k) * s) / r; }
      if (k % 16 === 0) out.bar = true;
    }
    if (!out.steps.length) return out;
    c.step = now;
    // A row is let in now if it will reach the carrier on a beat: travel steps from here is a beat, and the beats
    // between rows keep the distance the lanes always kept (one, two or three beats, as the pace allows).
    const travelSteps = Math.round(travel / s);
    const arrive = now + travelSteps;
    const beatPx = speed * s * 4;
    const every = Math.max(1, Math.min(3, Math.round(gap / Math.max(1, beatPx))));
    const enough = (arrive - (c.lastRowStep + travelSteps)) * s * speed >= gap * 0.82;
    if (arrive % 4 === 0 && (arrive / 4) % every === 0 && enough) {
      out.row = true;
      c.lastRowStep = now;
    }
    return out;
  };

  /** The nearest hit of the hidden rhythm: how far off it is (seconds, signed) and which step it is; or null. */
  const nearHit = () => {
    if (!c.rhythm) return null;
    const bar0 = Math.floor(c.pos / 16) * 16;
    let best = null;
    c.rhythm.hits.forEach((h) => {
      [-16, 0, 16].forEach((wrap) => {
        const k = bar0 + h + wrap;
        const d = c.pos - stepPos(k);
        if (!best || Math.abs(d) < Math.abs(best.d)) best = { d, k };
      });
    });
    return best && { off: best.d * sixteenth(), k: best.k };
  };

  /** An action (step, hop, throw), heard against the hidden rhythm while its room passes. */
  c.act = (kind) => {
    if (!c.inRoom || !c.rhythm) return null;
    const near = nearHit();
    const on = Boolean(near) && Math.abs(near.off) <= WINDOW;
    c.heard.push(on);
    if (c.heard.length > OF) c.heard.shift();
    const onCount = c.heard.filter(Boolean).length;
    if (onCount >= NEED && !foundRhythms()[c.rhythm.id]) {
      if (keepFound(c.rhythm.id, c.chapter)) onFound(c.rhythm);
      c.heard = [];
    }
    return { on, onCount, kind };
  };

  /** In the pocket (an unlock, unlocks.mjs): an action on a hit of the chapter's own rhythm, once found, anywhere
   * in the chapter. Once per hit, so a flurry of steps on one hit counts once. */
  c.pocket = () => {
    if (!c.rhythm || !foundRhythms()[c.rhythm.id]) return false;
    const near = nearHit();
    if (!near || Math.abs(near.off) > WINDOW) return false;
    if (near.k === c.lastPocket) return false;
    c.lastPocket = near.k;
    return true;
  };

  /** Check whether an action falls on a swung beat or triplet off-beat for Jazz maneuver synergy. */
  c.swungMoment = () => {
    const base = Math.floor(c.pos / 2) * 2;
    let best = null;
    [-2, 0, 2, 4].forEach((offset) => {
      [-1, 0, 1].forEach((sub) => {
        const k = base + offset + sub;
        const offSec = (c.pos - stepPos(k)) * sixteenth();
        const absOff = Math.abs(offSec);
        if (!best || absOff < best.absOff) best = { k, offSec, absOff };
      });
    });
    const inPocket = Boolean(best && best.absOff <= WINDOW * 1.15);
    const stepInBar = ((best?.k || 0) % 16 + 16) % 16;
    const offbeat = Boolean(best && (Math.abs(best.k) % 2 === 1 || stepInBar % 4 === 2));
    const freshHit = inPocket && best.k !== c.lastSwungStep;
    if (freshHit) c.lastSwungStep = best.k;
    return { inPocket, freshHit, offbeat, step: stepInBar, phase: c.phase() };
  };

  /* A step as it is passed (a number) or as it is said ahead ({ k, in }). */
  const said = (e) => (typeof e === 'number' ? { k: e, in: 0 } : e);
  const inBar = (k) => ((k % 16) + 16) % 16;

  /** The hidden rhythm's hits among these steps (for the land to keep it softly), each with when it falls. */
  c.hitsIn = (steps) => {
    if (!c.rhythm || !c.inRoom) return [];
    return steps.map(said).filter((e) => c.rhythm.steps[inBar(e.k)] !== '.').map((e) => ({ step: inBar(e.k), strong: c.rhythm.steps[inBar(e.k)] === 'X', in: e.in }));
  };

  /** The rhythms to play under the carry: the chapter's own if found, and one more found elsewhere, in turn. */
  c.groove = (steps) => {
    const found = foundRhythms();
    const kept = Object.keys(found).map((id) => c.rhythms[id]).filter(Boolean);
    if (!kept.length) return [];
    const own = c.rhythm && found[c.rhythm.id] ? c.rhythm : null;
    const others = kept.filter((r) => r !== own);
    const visiting = others.length ? others[Math.floor(c.pos / 64) % others.length] : null;
    const out = [];
    steps.map(said).forEach((e) => {
      const i = inBar(e.k);
      [[own, 1], [visiting, own ? 0.55 : 0.8]].forEach(([r, level]) => {
        if (r && r.steps[i] !== '.') out.push({ rhythm: r, step: i, strong: r.steps[i] === 'X', level, in: e.in });
      });
    });
    return out;
  };

  /** Where in the beat the lanes are, 0 to 1. */
  c.phase = () => (((c.pos % 4) + 4) % 4) / 4;
  return c;
}
