/**
 * editor-page.mjs — Sticker & Profile Card Studio for Lore.Land (/editor/).
 *
 * Composes shareable profile cards and meme seals from the site's own procedural SVG art
 * (placeSVG, portraitSVG, figureGroup, tropeEmblemSVG), active pie recipes, and Spw meme
 * registers (spw-bias.mjs), exporting standalone SVG, PNG, Spw source, and playable /pie/ invites.
 */

import { CHARACTERS, MOODS, portraitSVG, figureGroup } from '../modules/characters.mjs?v=2026_11_11.A';
import { PLACES, COLORS, EMBLEMS, placeSVG, tropeEmblemSVG } from '../modules/panel-art.mjs?v=2026_11_13.B';
import { loadRegisters } from '../modules/spw-bias.mjs?v=2026_11_09.L';
import { readBoardLine } from './pie-frame.mjs?v=2026_11_13.B';

const DRAFT_KEY = 'lore.editor.draft.v1';

const FORMATS = Object.freeze({
  share: { label: 'Share card (1200×630)', w: 1200, h: 630 },
  profile: { label: 'Profile card (960×540)', w: 960, h: 540 },
  seal: { label: 'Square seal (800×800)', w: 800, h: 800 }
});

const TONES = Object.freeze({
  paper: { label: 'Rag paper', slab: '#f6efe0', slabOpacity: 0.9, ink: '#1e2420', muted: '#5a584f', border: '#c9b896', accent: '#c86d2c' },
  glass: { label: 'Warm glass', slab: '#eef4f3', slabOpacity: 0.84, ink: '#182b2e', muted: '#486063', border: '#8fc8c4', accent: '#4f9a98' },
  ember: { label: 'Ember clay', slab: '#361f24', slabOpacity: 0.9, ink: '#f8eedc', muted: '#d8bea2', border: '#d9a24a', accent: '#d9a24a' },
  slate: { label: 'Quiet slate', slab: '#202630', slabOpacity: 0.9, ink: '#f1ece0', muted: '#b6b4bf', border: '#8a8496', accent: '#d9a24a' },
  night: { label: 'Starfield', slab: '#12151f', slabOpacity: 0.92, ink: '#f5efde', muted: '#a8b0c4', border: '#d9a24a', accent: '#f2c14e' }
});

const RECIPE_BADGES = Object.freeze({
  warm: { label: 'Warm Boonberry', short: 'Warm pie' },
  tempered: { label: 'Tempered Glaze', short: 'Tempered' },
  set_jam: { label: 'Bane-Set Jam', short: 'Set jam' },
  savoury: { label: 'Hearth Boneberry', short: 'Savoury' },
  blistered: { label: 'Furrow Caramel', short: 'Caramel' },
  royal: { label: 'Sovereign Quinary', short: 'Quinary' }
});

const TROPE_SIGILS = Object.freeze({
  'exactly-one': '!',
  'floating-title': '~',
  'never-smaller': '%',
  wap: '!',
  'silent-protest': '#',
  'off-switch': '!',
  'said-so': '?',
  glimpse: '?',
  'plain-lines': '@',
  'warm-question': '?',
  'forgiving-glass': '.',
  'slow-gift': '&',
  records: '#',
  'missing-day': '~',
  'beyond-the-frame': '=',
  'right-angle-companion': '&',
  'torch-arm': '*'
});

const PROP_STICKERS = Object.freeze({
  boonberry: {
    label: 'Boonberry',
    svg: '<circle cx="24" cy="36" r="11" fill="#4d9f97" stroke="#1f4c49" stroke-width="2"/><circle cx="40" cy="36" r="11" fill="#4d9f97" stroke="#1f4c49" stroke-width="2"/><circle cx="32" cy="24" r="11" fill="#4d9f97" stroke="#1f4c49" stroke-width="2"/><circle cx="24" cy="36" r="4" fill="#f4b25c"/><circle cx="40" cy="36" r="4" fill="#f4b25c"/><circle cx="32" cy="24" r="4" fill="#f4b25c"/><path d="M32 13 q5 -7 11 -6" fill="none" stroke="#3d6a3a" stroke-width="2.6" stroke-linecap="round"/>'
  },
  baneberry: {
    label: 'Baneberry',
    svg: '<circle cx="24" cy="36" r="10.5" fill="#4a2560" stroke="#1c0d24" stroke-width="2"/><circle cx="40" cy="36" r="10.5" fill="#4a2560" stroke="#1c0d24" stroke-width="2"/><circle cx="32" cy="24" r="10.5" fill="#4a2560" stroke="#1c0d24" stroke-width="2"/><circle cx="29" cy="21" r="2.2" fill="#d9c0f4"/><circle cx="21" cy="33" r="2.2" fill="#d9c0f4"/><path d="M32 13 l-6 -8 l2 4" fill="none" stroke="#3a4a2a" stroke-width="2.4" stroke-linecap="round"/>'
  },
  boneberry: {
    label: 'Boneberry',
    svg: '<ellipse cx="24" cy="37" rx="9.5" ry="11" fill="#ead9cc" stroke="#a8564a" stroke-width="2"/><ellipse cx="40" cy="37" rx="9.5" ry="11" fill="#ead9cc" stroke="#a8564a" stroke-width="2"/><ellipse cx="32" cy="24" rx="9.5" ry="11" fill="#fbf6ee" stroke="#a8564a" stroke-width="2"/><path d="M33 10 q5 -5 1 -9" fill="none" stroke="#a8564a" stroke-width="1.8" stroke-linecap="round"/>'
  },
  hat: {
    label: 'Floating hat',
    svg: '<path d="M12 40 Q32 45 52 40 Q32 35 12 40Z" fill="#2c2420"/><path d="M20 39 C19 18 45 18 44 39" fill="#3a302b" stroke="#efe3c8" stroke-width="1.6"/><path d="M21 34 Q32 36 43 34" fill="none" stroke="#d9a24a" stroke-width="3"/>'
  },
  pie: {
    label: 'One pie',
    svg: '<ellipse cx="32" cy="43" rx="24" ry="8" fill="#e9e2d4" stroke="#a89870" stroke-width="1.6"/><ellipse cx="32" cy="38" rx="19" ry="7.5" fill="#d99a45" stroke="#8c4e1c" stroke-width="1.8"/><path d="M22 35 l4 6 M30 34 l4 7 M38 35 l4 6" stroke="#7a2c50" stroke-width="2" stroke-linecap="round"/>'
  },
  seal: {
    label: 'Seed seal',
    svg: '<circle cx="32" cy="32" r="24" fill="#a8502e" stroke="#d9a24a" stroke-width="2.6"/><circle cx="32" cy="32" r="19" fill="none" stroke="#efe3c8" stroke-width="1.2" stroke-dasharray="3 3"/><text x="32" y="38" text-anchor="middle" font-size="22" font-family="Georgia, serif" fill="#efe3c8">*</text>'
  }
});

const STAGES = Object.freeze(['seed', 'hint', 'named', 'turned', 'paid']);

const escXml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const base64UrlEncode = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const DEFAULT_STATE = () => ({
  format: 'share',
  scene: 'field',
  light: 'dusk',
  tone: 'paper',
  carrier: 'boof',
  mood: 'glad',
  recipe: 'tempered',
  handle: 'boof-of-bonk',
  title: 'Carried level through the Frost Furrows',
  note: 'Two dots watching; the hat stays unlanded.',
  register: 'pov',
  board: '^board{ @feel[jazz] =swing[deep] }',
  stage: 'turned',
  stickers: [
    { id: 's1', kind: 'trope', key: 'exactly-one', stage: 'paid', x: 980, y: 128, scale: 1.15, rot: -6 },
    { id: 's2', kind: 'prop', key: 'hat', stage: 'named', x: 1095, y: 120, scale: 1.05, rot: 8 },
    { id: 's3', kind: 'trope', key: 'slow-gift', stage: 'turned', x: 1038, y: 235, scale: 1.0, rot: 3 }
  ]
});

function loadInitialState() {
  try {
    const q = new URLSearchParams(location.search);
    const shared = q.get('card');
    if (shared) {
      const parsed = base64UrlDecode(shared);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_STATE(), ...parsed };
    }
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_STATE(), ...parsed };
    }
  } catch { /* fallback to default plate */ }
  return DEFAULT_STATE();
}

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'className') node.className = v;
    else node.setAttribute(k, v === true ? '' : String(v));
  });
  children.flat().forEach((c) => { if (c != null && c !== false) node.append(c); });
  return node;
};

async function initEditor() {
  const root = document.querySelector('[data-editor-root]');
  if (!root) return;

  const registersData = await loadRegisters().catch(() => ({ registers: {}, anchors: {} }));
  const registerList = Object.entries(registersData.registers || {});

  let state = loadInitialState();
  let selectedId = state.stickers[0]?.id || null;
  let seq = 100;

  const dom = {
    formats: root.querySelector('[data-editor-formats]'),
    stage: root.querySelector('[data-editor-stage]'),
    inspector: root.querySelector('[data-editor-inspector]'),
    status: root.querySelector('[data-editor-status]'),
    spw: root.querySelector('[data-editor-spw]'),
    playInvite: root.querySelector('[data-editor-play-invite]'),
    scenes: root.querySelector('[data-editor-scenes]'),
    lights: root.querySelector('[data-editor-lights]'),
    tones: root.querySelector('[data-editor-tones]'),
    carriers: root.querySelector('[data-editor-carriers]'),
    moods: root.querySelector('[data-editor-moods]'),
    recipes: root.querySelector('[data-editor-recipes]'),
    registers: root.querySelector('[data-editor-registers]'),
    stages: root.querySelector('[data-editor-stages]'),
    tropeStickers: root.querySelector('[data-editor-trope-stickers]'),
    figureStickers: root.querySelector('[data-editor-figure-stickers]'),
    handle: root.querySelector('[data-editor-handle]'),
    title: root.querySelector('[data-editor-title]'),
    note: root.querySelector('[data-editor-note]'),
    board: root.querySelector('[data-editor-board]'),
    btnPng: root.querySelector('[data-editor-download-png]'),
    btnSvg: root.querySelector('[data-editor-download-svg]'),
    btnLink: root.querySelector('[data-editor-copy-link]'),
    btnSpw: root.querySelector('[data-editor-copy-spw]'),
    btnReset: root.querySelector('[data-editor-reset]')
  };

  const say = (msg) => { if (dom.status) dom.status.textContent = msg; };

  const persist = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  };

  const registerInfo = () => {
    const entry = registersData.registers?.[state.register];
    return entry ? { id: state.register, title: entry.title || state.register, line: entry.line || '' } : null;
  };

  const inviteHref = () => {
    const p = new URLSearchParams();
    if (state.register && state.register !== 'none') p.set('bias', state.register);
    if (state.board?.trim()) {
      const check = readBoardLine(state.board.trim());
      if (Object.keys(check.view || {}).length) p.set('board', state.board.trim());
    }
    const qs = p.toString();
    return qs ? `/pie/?${qs}` : '/pie/';
  };

  const spwCardSource = () => {
    const stickersLine = state.stickers.map((s) => `${s.kind}:${s.key}@${Math.round(s.x)},${Math.round(s.y)}`).join(' ');
    return [
      `^card[profile]{`,
      `  @carrier[${state.carrier}] @mood[${state.mood}] *recipe[${state.recipe}]`,
      `  ~scene[${state.scene}] =light[${state.light}] =tone[${state.tone}]`,
      state.register && state.register !== 'none' ? `  =meme@${state.carrier}[${state.register}]{ }` : null,
      state.board?.trim() ? `  ${state.board.trim()}` : null,
      stickersLine ? `  *stickers[${stickersLine}]` : null,
      `  #handle["${state.handle || 'unnamed'}"] #says["${state.title || ''}"]`,
      `}`
    ].filter(Boolean).join('\n');
  };

  const renderStickerBody = (st) => {
    if (st.kind === 'trope') {
      const svg = tropeEmblemSVG(st.key, { size: 78, sigil: TROPE_SIGILS[st.key] || '!', stage: st.stage || 'named' });
      return `<g transform="translate(-39,-39)">${svg}</g>`;
    }
    if (st.kind === 'figure') {
      const group = figureGroup(st.key);
      return `<g transform="translate(-44,-44)"><svg viewBox="0 0 100 100" width="88" height="88" xmlns="http://www.w3.org/2000/svg">${group}</svg></g>`;
    }
    const prop = PROP_STICKERS[st.key];
    if (!prop) return '';
    return `<g transform="translate(-38,-38)"><svg viewBox="0 0 64 64" width="76" height="76" xmlns="http://www.w3.org/2000/svg">${prop.svg}</svg></g>`;
  };

  const buildCardSVG = ({ interactive = true } = {}) => {
    const fmt = FORMATS[state.format] || FORMATS.share;
    const tone = TONES[state.tone] || TONES.paper;
    const w = fmt.w;
    const h = fmt.h;
    const sceneArt = placeSVG(state.scene, { w, h, light: state.light, plain: false });
    const portrait = portraitSVG(state.carrier, { size: 170, standalone: true, mood: state.mood });
    const reg = registerInfo();
    const recipe = RECIPE_BADGES[state.recipe] || RECIPE_BADGES.warm;

    const pad = Math.round(w * 0.04);
    const cardH = state.format === 'seal' ? 275 : 238;
    const cardY = h - cardH - pad;
    const cardW = w - pad * 2;
    const portraitSize = state.format === 'seal' ? 148 : 168;
    const portraitX = pad + 26;
    const portraitY = cardY + Math.round((cardH - portraitSize) / 2);
    const textX = portraitX + portraitSize + 28;
    const maxTextW = Math.max(240, cardW - (textX - pad) - 28);

    const safeTitle = escXml((state.title || 'Carried level through the lanes').slice(0, 66));
    const safeNote = escXml((state.note || '').slice(0, 88));
    const safeHandle = escXml((state.handle || CHARACTERS[state.carrier]?.name || 'carrier').slice(0, 32));
    const regText = reg ? `=meme[${reg.id}] · ${reg.title}` : '';
    const boardFlag = state.board?.trim() ? escXml(state.board.trim().slice(0, 52)) : '';

    const stickersMarkup = state.stickers.map((st) => {
      const sel = interactive && st.id === selectedId ? ' is-selected' : '';
      const ring = interactive
        ? `<circle class="editor-sticker-ring" cx="0" cy="0" r="46" fill="none" stroke="${tone.accent}" stroke-width="2.5" stroke-dasharray="5 4"/>`
        : '';
      const attrs = interactive
        ? ` class="editor-sticker-node${sel}" data-sticker-id="${escXml(st.id)}" tabindex="0" role="button" aria-label="Sticker ${escXml(st.key)}"`
        : '';
      return `<g transform="translate(${Math.round(st.x)},${Math.round(st.y)}) rotate(${Number(st.rot || 0)}) scale(${Number(st.scale || 1)})"${attrs}>${renderStickerBody(st)}${ring}</g>`;
    }).join('');

    return `<svg class="editor-canvas-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Edited Lore.Land profile card for ${safeHandle}">
      <defs>
        <clipPath id="ed-plate-clip"><rect width="${w}" height="${h}" rx="18"/></clipPath>
      </defs>
      <g clip-path="url(#ed-plate-clip)">
        ${sceneArt}
        <rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="12" fill="none" stroke="${COLORS.gold || '#d9a24a'}" stroke-opacity="0.45" stroke-width="1.5"/>
        <text x="${pad}" y="${pad + 14}" font-family="Georgia, serif" font-size="17" letter-spacing="4" fill="#efe3c8" opacity="0.9">LORE . LAND</text>
        ${boardFlag ? `<g transform="translate(${w - pad - 310}, ${pad - 4})"><rect width="310" height="30" rx="15" fill="${tone.slab}" fill-opacity="0.88" stroke="${tone.border}" stroke-width="1.2"/><text x="155" y="19" text-anchor="middle" font-family="monospace" font-size="11.5" fill="${tone.ink}">${boardFlag}</text></g>` : ''}
        <rect x="${pad}" y="${cardY}" width="${cardW}" height="${cardH}" rx="18" fill="${tone.slab}" fill-opacity="${tone.slabOpacity}" stroke="${tone.border}" stroke-width="2"/>
        <svg x="${portraitX}" y="${portraitY}" width="${portraitSize}" height="${portraitSize}" viewBox="0 0 100 100">${portrait}</svg>
        <g transform="translate(${textX}, ${cardY + 46})">
          <text x="0" y="0" font-family="monospace" font-size="15" font-weight="700" letter-spacing="1.2" fill="${tone.accent}">@${safeHandle} · ${escXml(CHARACTERS[state.carrier]?.name || state.carrier).toUpperCase()}</text>
          <text x="0" y="42" font-family="Georgia, serif" font-size="${maxTextW < 430 ? 23 : 29}" fill="${tone.ink}">${safeTitle}</text>
          <text x="0" y="76" font-family="Georgia, serif" font-size="17" fill="${tone.muted}">${safeNote}</text>
          <g transform="translate(0, 102)">
            <rect width="176" height="30" rx="15" fill="${tone.accent}" fill-opacity="0.16" stroke="${tone.border}" stroke-width="1.2"/>
            <text x="88" y="20" text-anchor="middle" font-family="monospace" font-size="12.5" font-weight="700" fill="${tone.ink}">PIE · ${escXml(recipe.short.toUpperCase())}</text>
            ${regText ? `<g transform="translate(188, 0)"><rect width="268" height="30" rx="15" fill="${tone.ink}" fill-opacity="0.08" stroke="${tone.border}" stroke-width="1.2"/><text x="14" y="20" font-family="monospace" font-size="12" fill="${tone.ink}">${escXml(regText.slice(0, 34))}</text></g>` : ''}
          </g>
          <text x="0" y="158" font-family="monospace" font-size="11.5" fill="${tone.muted}">${escXml(PLACES[state.scene]?.name || state.scene)} · ${escXml(state.light)} · lore.land/editor</text>
        </g>
        ${stickersMarkup}
      </g>
    </svg>`;
  };

  const renderInspector = () => {
    const st = state.stickers.find((item) => item.id === selectedId);
    if (!st) {
      dom.inspector.replaceChildren(el('p', { className: 'editor-stage-hint' }, 'Tap a sticker on the plate to move, scale, rotate, or remove it—or stamp a new one from Section 3.'));
      return;
    }
    const head = el('div', { className: 'editor-inspector-head' },
      el('strong', {}, `Selected: ${st.kind} · ${st.key}${st.kind === 'trope' ? ` (${st.stage || 'named'})` : ''}`),
      el('span', {}, `${Math.round(st.x)}, ${Math.round(st.y)} · ${Number(st.scale || 1).toFixed(2)}× · ${Number(st.rot || 0)}°`)
    );
    const act = (label, fn) => {
      const b = el('button', { type: 'button', className: 'editor-chip' }, label);
      b.addEventListener('click', fn);
      return b;
    };
    const row = el('div', { className: 'editor-inspector-row' },
      act('Larger +', () => { st.scale = Math.min(2.2, +(Number(st.scale || 1) + 0.15).toFixed(2)); update(); }),
      act('Smaller −', () => { st.scale = Math.max(0.55, +(Number(st.scale || 1) - 0.15).toFixed(2)); update(); }),
      act('Tilt ↺', () => { st.rot = Math.max(-45, (st.rot || 0) - 8); update(); }),
      act('Tilt ↻', () => { st.rot = Math.min(45, (st.rot || 0) + 8); update(); }),
      act('Front ↑', () => {
        const idx = state.stickers.indexOf(st);
        if (idx >= 0 && idx < state.stickers.length - 1) {
          state.stickers.splice(idx, 1);
          state.stickers.push(st);
          update();
        }
      }),
      act('Duplicate', () => {
        const copy = { ...st, id: `s${seq++}`, x: st.x + 28, y: st.y + 20 };
        state.stickers.push(copy);
        selectedId = copy.id;
        update();
      }),
      act('Remove ×', () => {
        state.stickers = state.stickers.filter((item) => item.id !== st.id);
        selectedId = state.stickers[state.stickers.length - 1]?.id || null;
        update();
      })
    );
    dom.inspector.replaceChildren(head, row);
  };

  const renderChipRow = (host, entries, currentValue, onPick) => {
    host.replaceChildren(...entries.map(([value, label]) => {
      const btn = el('button', { type: 'button', className: 'editor-chip', 'aria-pressed': String(currentValue) === String(value) ? 'true' : 'false' }, label);
      btn.addEventListener('click', () => { onPick(value); update(); });
      return btn;
    }));
  };

  const renderPaletteControls = () => {
    renderChipRow(dom.formats, Object.entries(FORMATS).map(([k, v]) => [k, v.label]), state.format, (v) => { state.format = v; });
    renderChipRow(dom.scenes, Object.entries(PLACES).map(([k, v]) => [k, v.name]), state.scene, (v) => { state.scene = v; });
    renderChipRow(dom.lights, [['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']], state.light, (v) => { state.light = v; });
    renderChipRow(dom.tones, Object.entries(TONES).map(([k, v]) => [k, v.label]), state.tone, (v) => { state.tone = v; });
    renderChipRow(dom.carriers, Object.entries(CHARACTERS).map(([k, v]) => [k, v.name]), state.carrier, (v) => { state.carrier = v; });
    renderChipRow(dom.moods, MOODS.map((m) => [m, m]), state.mood, (v) => { state.mood = v; });
    renderChipRow(dom.recipes, Object.entries(RECIPE_BADGES).map(([k, v]) => [k, v.short]), state.recipe, (v) => { state.recipe = v; });
    renderChipRow(dom.stages, STAGES.map((s) => [s, s]), state.stage, (v) => {
      state.stage = v;
      const sel = state.stickers.find((st) => st.id === selectedId);
      if (sel && sel.kind === 'trope') sel.stage = v;
    });
    const regEntries = [['none', 'Plain (none)'], ...registerList.map(([id, r]) => [id, r.title || id])];
    renderChipRow(dom.registers, regEntries, state.register, (v) => { state.register = v; });

    if (!dom.tropeStickers.children.length) {
      EMBLEMS.forEach((emblemId) => {
        const b = el('button', { type: 'button', className: 'editor-sticker-btn', title: `Stamp ${emblemId}` });
        b.innerHTML = `${tropeEmblemSVG(emblemId, { size: 36, sigil: TROPE_SIGILS[emblemId] || '!', stage: 'named' })}<span>${emblemId.replace(/-/g, ' ')}</span>`;
        b.addEventListener('click', () => stampSticker('trope', emblemId));
        dom.tropeStickers.append(b);
      });
    }
    if (!dom.figureStickers.children.length) {
      Object.entries(PROP_STICKERS).forEach(([pid, prop]) => {
        const b = el('button', { type: 'button', className: 'editor-sticker-btn', title: `Stamp ${prop.label}` });
        b.innerHTML = `<svg viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">${prop.svg}</svg><span>${prop.label}</span>`;
        b.addEventListener('click', () => stampSticker('prop', pid));
        dom.figureStickers.append(b);
      });
      Object.keys(CHARACTERS).forEach((cid) => {
        const b = el('button', { type: 'button', className: 'editor-sticker-btn', title: `Stamp ${CHARACTERS[cid].name} standing figure` });
        b.innerHTML = `<svg viewBox="0 0 100 100" width="36" height="36" aria-hidden="true">${figureGroup(cid)}</svg><span>${CHARACTERS[cid].name}</span>`;
        b.addEventListener('click', () => stampSticker('figure', cid));
        dom.figureStickers.append(b);
      });
    }
  };

  const stampSticker = (kind, key) => {
    const fmt = FORMATS[state.format] || FORMATS.share;
    const offset = (state.stickers.length % 5) * 26;
    const st = {
      id: `s${seq++}`,
      kind,
      key,
      stage: state.stage,
      x: Math.round(fmt.w * 0.72 + offset - 40),
      y: Math.round(fmt.h * 0.25 + (offset % 60)),
      scale: 1,
      rot: 0
    };
    state.stickers.push(st);
    selectedId = st.id;
    say(`Stamped ${key} onto the plate.`);
    update();
  };

  let drag = null;
  const attachStageEvents = () => {
    const svg = dom.stage.querySelector('svg.editor-canvas-svg');
    if (!svg) return;
    const fmt = FORMATS[state.format] || FORMATS.share;
    const toSvgPoint = (clientX, clientY) => {
      const box = svg.getBoundingClientRect();
      return {
        x: ((clientX - box.left) / Math.max(1, box.width)) * fmt.w,
        y: ((clientY - box.top) / Math.max(1, box.height)) * fmt.h
      };
    };

    svg.addEventListener('pointerdown', (event) => {
      const node = event.target.closest?.('[data-sticker-id]');
      if (!node) {
        if (selectedId) { selectedId = null; renderInspector(); svg.querySelectorAll('.is-selected').forEach((n) => n.classList.remove('is-selected')); }
        return;
      }
      const st = state.stickers.find((item) => item.id === node.dataset.stickerId);
      if (!st) return;
      event.preventDefault();
      selectedId = st.id;
      node.setPointerCapture?.(event.pointerId);
      const pt = toSvgPoint(event.clientX, event.clientY);
      drag = { st, dx: st.x - pt.x, dy: st.y - pt.y, node };
      svg.querySelectorAll('.is-selected').forEach((n) => n.classList.remove('is-selected'));
      node.classList.add('is-selected');
      renderInspector();
    });

    svg.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const pt = toSvgPoint(event.clientX, event.clientY);
      drag.st.x = Math.max(40, Math.min(fmt.w - 40, pt.x + drag.dx));
      drag.st.y = Math.max(40, Math.min(fmt.h - 40, pt.y + drag.dy));
      drag.node.setAttribute('transform', `translate(${Math.round(drag.st.x)},${Math.round(drag.st.y)}) rotate(${Number(drag.st.rot || 0)}) scale(${Number(drag.st.scale || 1)})`);
    });

    const endDrag = () => {
      if (!drag) return;
      drag = null;
      persist();
      renderInspector();
      dom.spw.textContent = spwCardSource();
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    svg.addEventListener('keydown', (event) => {
      const st = state.stickers.find((item) => item.id === selectedId);
      if (!st) return;
      const step = event.shiftKey ? 24 : 8;
      if (event.key === 'ArrowLeft') { event.preventDefault(); st.x = Math.max(40, st.x - step); update(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); st.x = Math.min(fmt.w - 40, st.x + step); update(); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); st.y = Math.max(40, st.y - step); update(); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); st.y = Math.min(fmt.h - 40, st.y + step); update(); }
      else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        state.stickers = state.stickers.filter((item) => item.id !== st.id);
        selectedId = null;
        update();
      }
    });
  };

  function update() {
    persist();
    dom.stage.innerHTML = buildCardSVG({ interactive: true });
    attachStageEvents();
    renderInspector();
    renderPaletteControls();
    if (dom.spw) dom.spw.textContent = spwCardSource();
    if (dom.playInvite) dom.playInvite.href = inviteHref();
  }

  dom.handle.value = state.handle || '';
  dom.title.value = state.title || '';
  dom.note.value = state.note || '';
  dom.board.value = state.board || '';

  const bindInput = (input, key) => {
    input?.addEventListener('input', () => {
      state[key] = input.value;
      persist();
      dom.stage.innerHTML = buildCardSVG({ interactive: true });
      attachStageEvents();
      if (dom.spw) dom.spw.textContent = spwCardSource();
      if (dom.playInvite) dom.playInvite.href = inviteHref();
    });
  };
  bindInput(dom.handle, 'handle');
  bindInput(dom.title, 'title');
  bindInput(dom.note, 'note');
  bindInput(dom.board, 'board');

  dom.btnSvg?.addEventListener('click', () => {
    const clean = buildCardSVG({ interactive: false });
    const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `lore-card-${(state.handle || 'plate').replace(/[^a-z0-9_-]/gi, '-')}.svg` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('Exported standalone vector SVG.');
  });

  dom.btnPng?.addEventListener('click', () => {
    const fmt = FORMATS[state.format] || FORMATS.share;
    const clean = buildCardSVG({ interactive: false });
    const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = fmt.w;
      cv.height = fmt.h;
      const c = cv.getContext('2d');
      c.drawImage(img, 0, 0, fmt.w, fmt.h);
      URL.revokeObjectURL(url);
      cv.toBlob((png) => {
        if (!png) { say('Could not encode PNG.'); return; }
        const dl = URL.createObjectURL(png);
        const a = el('a', { href: dl, download: `lore-card-${(state.handle || 'plate').replace(/[^a-z0-9_-]/gi, '-')}.png` });
        a.click();
        setTimeout(() => URL.revokeObjectURL(dl), 1000);
        say(`Exported ${fmt.w}×${fmt.h} PNG share card.`);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); say('PNG conversion failed in this browser.'); };
    img.src = url;
  });

  dom.btnLink?.addEventListener('click', async () => {
    const encoded = base64UrlEncode(state);
    const shareUrl = `${location.origin}/editor/?card=${encoded}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      say('Copied shareable card link to clipboard.');
    } catch {
      history.replaceState(null, '', `?card=${encoded}`);
      say('Updated address bar with your shareable card link.');
    }
  });

  dom.btnSpw?.addEventListener('click', async () => {
    const text = spwCardSource();
    try {
      await navigator.clipboard.writeText(text);
      say('Copied card as Spw.');
    } catch {
      say('Spw card is shown below.');
    }
  });

  dom.btnReset?.addEventListener('click', () => {
    state = DEFAULT_STATE();
    selectedId = state.stickers[0]?.id || null;
    dom.handle.value = state.handle;
    dom.title.value = state.title;
    dom.note.value = state.note;
    dom.board.value = state.board;
    history.replaceState(null, '', '/editor/');
    say('Plate returned to defaults.');
    update();
  });

  update();
}

initEditor();
