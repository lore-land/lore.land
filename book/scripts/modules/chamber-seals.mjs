/*
 * Chamber seals — the wax marks of the monument.
 *
 * Every chamber wears its number as petals: counting is reading.
 * The thirteen tints sweep one full day, dawn gold to midnight ink,
 * so the chapter index doubles as a horizon timeline.
 *
 * Pure string construction, deterministic per chapter, no DOM required
 * until render — the same module can stamp seals at build time.
 */

export const CHAMBER_TINTS = [
  { name: 'dawn gold', wax: '#c08b2d', deep: '#7c5313', mark: '#fdf4dd' },
  { name: 'straw echo', wax: '#a48d33', deep: '#665717', mark: '#faf3d8' },
  { name: 'field green', wax: '#78883f', deep: '#47541f', mark: '#f3f5da' },
  { name: 'council sea', wax: '#4c7f58', deep: '#274e33', mark: '#e5f3e5' },
  { name: 'quiet teal', wax: '#2f7a72', deep: '#164a45', mark: '#ddf2ec' },
  { name: 'lantern teal', wax: '#2a6f7f', deep: '#143f4d', mark: '#dcf0f4' },
  { name: 'oath blue', wax: '#2e5f86', deep: '#173753', mark: '#dcebf8' },
  { name: 'watering indigo', wax: '#3b4f8a', deep: '#1f2c55', mark: '#e0e6f9' },
  { name: 'shard violet', wax: '#4a4390', deep: '#292259', mark: '#e6e1f8' },
  { name: 'bone berry', wax: '#5b3a6e', deep: '#341d43', mark: '#eee0f4' },
  { name: 'paradox plum', wax: '#7a3a63', deep: '#4a1e3a', mark: '#f6dfec' },
  { name: 'confluence maroon', wax: '#94404c', deep: '#5b212a', mark: '#fae0e0' },
  { name: 'midnight canon', wax: '#1d2a44', deep: '#0b1220', mark: '#cfdcf2' }
];

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fixed = (value) => Number(value.toFixed(2));

/* Irregular wax blob: a smooth closed curve through jittered radial points. */
function waxBlobPath(rng, cx, cy, baseRadius) {
  const points = [];
  const count = 9;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.22;
    const radius = baseRadius * (0.9 + rng() * 0.2);
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }

  // Quadratic segments through midpoints keep the rim soft, like cooled wax.
  let path = '';
  for (let i = 0; i < count; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % count];
    const mid = [(current[0] + next[0]) / 2, (current[1] + next[1]) / 2];
    if (i === 0) {
      path += `M ${fixed(mid[0])} ${fixed(mid[1])} `;
    }
    const after = points[(i + 1) % count];
    const midNext = [
      (after[0] + points[(i + 2) % count][0]) / 2,
      (after[1] + points[(i + 2) % count][1]) / 2
    ];
    path += `Q ${fixed(next[0])} ${fixed(next[1])} ${fixed(midNext[0])} ${fixed(midNext[1])} `;
  }
  return `${path}Z`;
}

export function chamberTint(chapterNumber) {
  const index = Math.min(Math.max(chapterNumber, 1), CHAMBER_TINTS.length) - 1;
  return CHAMBER_TINTS[index];
}

/**
 * Build the seal as an SVG string.
 * @param {number} chapterNumber 1..13 — the petal count and tint index.
 * @param {{ idSuffix?: string, title?: string }} [options]
 */
export function sealMarkup(chapterNumber, options = {}) {
  const n = Math.min(Math.max(Math.round(chapterNumber) || 1, 1), 13);
  const tint = chamberTint(n);
  const rng = mulberry32(n * 1013 + 7);
  const gradientId = `seal-wax-${n}${options.idSuffix ? `-${options.idSuffix}` : ''}`;
  const cx = 60;
  const cy = 60;

  const blob = waxBlobPath(rng, cx, cy, 44);
  const rimTilt = fixed(-14 + rng() * 28);

  let petals = '';
  const startAngle = -Math.PI / 2 + (rng() - 0.5) * 0.3;
  for (let i = 0; i < n; i += 1) {
    const angle = startAngle + (i / n) * Math.PI * 2 + (rng() - 0.5) * 0.06;
    const inner = 20;
    const outer = 31.5 + (rng() - 0.5) * 2;
    const x1 = fixed(cx + Math.cos(angle) * inner);
    const y1 = fixed(cy + Math.sin(angle) * inner);
    const x2 = fixed(cx + Math.cos(angle) * outer);
    const y2 = fixed(cy + Math.sin(angle) * outer);
    const bx = fixed(cx + Math.cos(angle) * (outer + 3.6));
    const by = fixed(cy + Math.sin(angle) * (outer + 3.6));
    petals += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    petals += `<circle cx="${bx}" cy="${by}" r="1.55"/>`;
  }

  const title = options.title || `Seal of chamber ${String(n).padStart(2, '0')} — ${n} petals, ${tint.name}`;

  return [
    `<svg class="chamber-seal-svg" viewBox="0 0 120 120" role="img" aria-label="${title}" data-seal="${n}">`,
    `<defs><radialGradient id="${gradientId}" cx="38%" cy="30%" r="78%">`,
    `<stop offset="0%" stop-color="${tint.mark}" stop-opacity="0.34"/>`,
    `<stop offset="34%" stop-color="${tint.wax}"/>`,
    `<stop offset="100%" stop-color="${tint.deep}"/>`,
    `</radialGradient></defs>`,
    `<path d="${blob}" fill="url(#${gradientId})" stroke="${tint.deep}" stroke-opacity="0.55" stroke-width="1.2"/>`,
    `<g transform="rotate(${rimTilt} ${cx} ${cy})">`,
    `<circle cx="${cx}" cy="${cy}" r="37.5" fill="none" stroke="${tint.mark}" stroke-opacity="0.34" stroke-width="0.9" stroke-dasharray="1.4 3.1"/>`,
    `</g>`,
    `<g stroke="${tint.mark}" stroke-width="2.4" stroke-linecap="round" fill="${tint.mark}" opacity="0.92">${petals}</g>`,
    `<circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="${tint.mark}" stroke-opacity="0.5" stroke-width="1"/>`,
    `<circle cx="${cx}" cy="${cy}" r="4.4" fill="${tint.mark}" fill-opacity="0.94"/>`,
    `<ellipse cx="44" cy="38" rx="15" ry="8" transform="rotate(-28 44 38)" fill="#fff" fill-opacity="0.14"/>`,
    `</svg>`
  ].join('');
}

/**
 * Stamp seals into a document.
 * Fills `.hub-ch-thumb-pending[data-chapter]` (the chamber index) and any
 * `[data-chamber-seal="NN"]` mount. Idempotent.
 */
export function renderChamberSeals(root = document) {
  let stamped = 0;

  root.querySelectorAll('.hub-ch-thumb-pending[data-chapter]').forEach((thumb) => {
    if (thumb.querySelector('.chamber-seal-svg')) {
      return;
    }
    const n = Number.parseInt(thumb.dataset.chapter, 10);
    if (!Number.isFinite(n)) {
      return;
    }
    thumb.insertAdjacentHTML('afterbegin', sealMarkup(n, { idSuffix: 'index' }));
    thumb.classList.add('has-seal');
    stamped += 1;
  });

  root.querySelectorAll('[data-chamber-seal]').forEach((mount) => {
    if (mount.querySelector('.chamber-seal-svg')) {
      return;
    }
    const n = Number.parseInt(mount.dataset.chamberSeal, 10);
    if (!Number.isFinite(n)) {
      return;
    }
    mount.insertAdjacentHTML('afterbegin', sealMarkup(n, { idSuffix: mount.id || 'mount' }));
    mount.classList.add('has-seal');
    stamped += 1;
  });

  return stamped;
}
