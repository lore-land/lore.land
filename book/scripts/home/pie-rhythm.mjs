/**
 * pie-rhythm.mjs — the lanes keep time: each chapter's level, the musical clock, and rhythms to find.
 *
 * Levels live in .spw/runtime/pie-levels.spw: a chapter's tempo, its key (a root in hertz), the motif its catches
 * spell out, whose theme it carries, and the rhythm the land keeps in one of its rooms. A small reader here reads
 * them at once (the file is plain and regular, and the game need not wait for the parser); book:check reads the
 * file again with the Spw interpreter and holds the two reads to agree.
 *
 * The conductor is the clock the lanes keep: sixteen steps to the bar at the level's tempo, advanced by the
 * game's own time (so a pause pauses it). It decides when a row is let in, so that it arrives at the carrier on a
 * beat — every one, two or three beats, as the pace allows, the spacing the lanes always had, now in time.
 *
 * A rhythm is found by playing it. In its room the land keeps it softly; each step, hop or throw the carrier makes
 * is heard against its hits (on a hit: within WINDOW seconds of one), and six of the last seven on a hit find it.
 * Found rhythms are kept in this browser (lore.pie.rhythms.v1) and play under later carries (Setup: Music).
 */

export const LEVELS_URL = '/.spw/runtime/pie-levels.spw';
export const STORE = 'lore.pie.rhythms.v1';
export const WINDOW = 0.075;
const NEED = 6;
const OF = 7;

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
 * A clock for the lanes. tick(dt, { speed, travel, gap, room }) advances it and says what happened this frame:
 * { steps: [step indices passed], beat, bar, row } — row is true when a row should be let in now so that it
 * reaches the carrier on a beat. act(kind) hears an action against the hidden rhythm; when one is found,
 * onFound(rhythm) is called once.
 */
export function createConductor({ onFound = () => {} } = {}) {
  const c = {
    tempo: 96, t: 0, step: -1, level: null, rhythm: null, rhythms: {}, chapter: 1,
    lastRowStep: -999, inRoom: false, heard: [], whispered: false, lastPocket: null
  };
  const sixteenth = () => 60 / c.tempo / 4;

  c.setLevels = ({ rhythms = {} } = {}) => { c.rhythms = rhythms; };

  c.setChapter = (n, level = null) => {
    c.chapter = n;
    c.level = level;
    c.tempo = level?.tempo || 96;
    c.rhythm = level?.rhythm ? c.rhythms[level.rhythm] || null : null;
    c.heard = [];
    c.inRoom = false;
  };

  /** The hidden rhythm is kept in its room: is the carry passing it? */
  c.setRoom = (sig = '') => {
    const was = c.inRoom;
    c.inRoom = Boolean(c.rhythm && c.level?.room && String(sig).includes(c.level.room));
    if (c.inRoom !== was) c.heard = [];
    return c.inRoom && !was;
  };

  c.tick = (dt, { speed = 150, travel = 2, gap = 220 } = {}) => {
    const out = { steps: [], beat: false, bar: false, row: false };
    if (!(dt > 0)) return out;
    c.t += dt;
    const s = sixteenth();
    const now = Math.floor(c.t / s);
    // Every step passed this frame (a slow frame can pass two); the row is decided on the last.
    for (let k = c.step + 1; k <= now; k += 1) {
      out.steps.push(k);
      if (k % 4 === 0) out.beat = true;
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

  /** Seconds from now to the nearest hit of the hidden rhythm (signed), or null when none is kept here. */
  const offHit = () => {
    if (!c.rhythm) return null;
    const s = sixteenth();
    const barT = c.t % (s * 16);
    let best = Infinity;
    c.rhythm.hits.forEach((h) => {
      [-16, 0, 16].forEach((wrap) => {
        const d = barT - (h + wrap) * s;
        if (Math.abs(d) < Math.abs(best)) best = d;
      });
    });
    return best;
  };

  /** An action (step, hop, throw), heard against the hidden rhythm while its room passes. */
  c.act = (kind) => {
    if (!c.inRoom || !c.rhythm) return null;
    const d = offHit();
    const on = d !== null && Math.abs(d) <= WINDOW;
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
    const d = offHit();
    if (d === null || Math.abs(d) > WINDOW) return false;
    const hit = Math.round((c.t - d) / sixteenth());
    if (hit === c.lastPocket) return false;
    c.lastPocket = hit;
    return true;
  };

  /** The hidden rhythm's hits in the steps just passed (for the land to keep it softly), and whether it is found. */
  c.hitsIn = (steps) => {
    if (!c.rhythm || !c.inRoom) return [];
    return steps.map((k) => k % 16).filter((k) => c.rhythm.steps[k] !== '.').map((k) => ({ step: k, strong: c.rhythm.steps[k] === 'X' }));
  };

  /** The rhythms to play under the carry: the chapter's own if found, and one more found elsewhere, in turn. */
  c.groove = (steps) => {
    const found = foundRhythms();
    const kept = Object.keys(found).map((id) => c.rhythms[id]).filter(Boolean);
    if (!kept.length) return [];
    const own = c.rhythm && found[c.rhythm.id] ? c.rhythm : null;
    const others = kept.filter((r) => r !== own);
    const visiting = others.length ? others[Math.floor(c.t / (sixteenth() * 64)) % others.length] : null;
    const out = [];
    steps.forEach((k) => {
      const i = k % 16;
      [[own, 1], [visiting, own ? 0.55 : 0.8]].forEach(([r, level]) => {
        if (r && r.steps[i] !== '.') out.push({ rhythm: r, step: i, strong: r.steps[i] === 'X', level });
      });
    });
    return out;
  };

  c.phase = () => (c.t % (sixteenth() * 4)) / (sixteenth() * 4);
  return c;
}
