/**
 * pie/ui/setup.mjs — Setup drawer/sheet, layout presets, hold selector, ^board{}
 * Spw line editor, sound clusters, domain tuning dials, cabinet & story strip
 * resize grips, and pinch/ctrl-wheel zoom for Exactly One Pie.
 */

const LAYOUTS = Object.freeze([
  ['lanes', 'Lanes first', 'The screen as large as the window allows; the story as a caption in the lanes; nothing else in the way.'],
  ['reader', 'Reader', 'The story beside the screen (under it on a phone), large, a passage at a time; the caption box kept.'],
  ['tactician', 'Tactician', 'Heights shown with every part, the show in its window, the story on the road where you can step on its words.'],
  ['comic', 'Comic page', 'Every panel: the caption, heights and its meanwhile, the show window, the story as a caption.'],
  ['arranged', 'Arranged for this screen', 'Every panel in view, each where this screen holds it best: beside the lanes on a tablet or a phone on its side, under them on a phone held up (the caption riding the lanes), spread either side on a desk.']
]);

const VIEWS = Object.freeze([
  ['The lanes, drawn', '✓', '✓', '✕', '·', '✕'],
  ['The board (▢ Show)', '✓', '✓', '·', '·', '✕'],
  ['⤒ Heights strip', '✕', '·', '✓', '✓', '✕'],
  ['The show window', '·', '✕', '·', '✓', '·'],
  ['The story beside', '·', '·', '·', '✕', '✓'],
  ['The story in the lanes', '·', '✕', '·', '·', '✓']
]);

const LAYOUT_MINIS = Object.freeze({
  lanes: [['lanes', 34, 3, 32, 50]],
  reader: [['words', 4, 6, 26, 48], ['lanes', 34, 3, 32, 50], ['caption', 70, 6, 26, 14]],
  tactician: [['lanes', 20, 3, 32, 50], ['heights', 56, 6, 40, 22], ['show', 56, 32, 24, 18]],
  comic: [['caption', 56, 4, 40, 12], ['heights', 56, 19, 40, 18], ['show', 56, 40, 24, 13], ['lanes', 20, 3, 32, 50]],
  arranged: [['words', 4, 6, 24, 30], ['lanes', 32, 3, 32, 50], ['caption', 68, 6, 28, 12], ['heights', 68, 21, 28, 18]]
});

const MAP_PARTS = Object.freeze([
  ['.pie-flow-prose', 'words', 'Story'], ['.pie-flow-wonders', 'side', 'Wonders'], ['.pie-caption', 'caption', 'Caption'],
  ['.pie-heights', 'heights', 'Heights'], ['.pie-show-inset', 'show', 'Show'], ['.pie-screen', 'lanes', 'Lanes'],
  ['.pie-tools', 'tools', 'Switches'], ['.pie-thumbs', 'tools', 'Pad']
]);

const SOUND_CLUSTERS = Object.freeze([
  ['storybook', 'Storybook', 'Even & folk-scored', { music: 'full', themes: 'themes', glow: 'bar', cues: 'shaped', feel: 'written', swing: 'chapter', voicing: 'folk', motifCues: 'room', songSpace: 'natural', mix: 'balanced', ear: 'open' }],
  ['hearth_jazz', 'Hearth jazz', 'Deep pocket, vibes & cues', { music: 'full', themes: 'themes', glow: 'beat', cues: 'shaped', feel: 'jazz', swing: 'deep', voicing: 'warm', motifCues: 'board', songSpace: 'hall', mix: 'music', ear: 'warm' }],
  ['by_ear', 'By ear', 'Strong lane & motif cues', { music: 'groove', themes: 'calls', glow: 'beat', cues: 'shaped', feel: 'jazz', swing: 'lilt', voicing: 'bright', motifCues: 'board', songSpace: 'natural', mix: 'ear', ear: 'bright' }],
  ['hushed', 'Hushed', 'Close room, straight time', { music: 'quiet', themes: 'calls', glow: 'off', cues: 'one', feel: 'written', swing: 'straight', voicing: 'velvet', motifCues: 'off', songSpace: 'close', mix: 'balanced', ear: 'hush' }]
]);

const PINCH_LIMITS = { size: [0.8, 1.45], flowSize: [0.8, 1.6] };
const miniBlocks = (blocks, w = 100, h = 56) => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" class="pie-mini"><rect class="pie-mini-window" x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="2.5"/>${blocks.map(([kind, x, y, bw, bh]) => `<rect class="pie-mini-${kind}" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.2"/>`).join('')}</svg>`;

/**
 * Initialize Setup sheet, layout arrangement, resize grips, and pinch scaling.
 * @param {object} deps
 */
export function initPieSetup({
  root, record, W, H, LANES, clamp, nodeOf,
  SETUP, SETUP_GROUPS, HOLDS, HEIGHTS_DEFAULTS, TUNING_DOMAINS, TUNING_KEY,
  planPanels, settlePlan, suggestHold, holdMini, boardLine, readBoardLine,
  icon, iconForGlyph, teachLine, handsLine, leanSentence, jokeOf,
  loadParser, foundRhythms, unlockMechanics, standing, parseTuningDomains, effectiveDomain, visitSpells,
  primeAudio, wapSound, feelSample, playTone, laneWarning, playBoardMotifCue, auditionChapterProgression,
  setMusicBed, setSoundTextures, setSoundFeel, setSoundConfig, setSoundCarrier,
  conductor, levelData, heightsPanel,
  getRun, getBoard, getFullOn, getPanelPlan, setPanelPlan, setGlassFoot,
  getVisitBoard, setVisitBoard, getFlowProse, getFlowMeasure, setFlowMeasure,
  getCreatorStyle, getSavedTuningDomains, setSavedTuningDomains, getTuningDomains, setTuningDomains, keepTuningDomains,
  domainTune, writeRecord, applyBoardView, applyView, applyShow, setFull, fit,
  storyInMode, themesOn, teachOn, progress, say
}) {
  const cabinetVoyage = root.closest('.pie-voyage');
  const setupBtn = root.querySelector('[data-pie-setup-toggle]');
  const setupOut = root.querySelector('[data-pie-setup]');
  const flowProseBox = document.querySelector('.pie-flow-prose');
  const flowHome = flowProseBox?.parentElement;
  const setting = (key) => { const def = SETUP.find(([k]) => k === key)?.[3]; return record.view[key] ?? def; };
  const filling = () => getFullOn() && setting('fill') === 'fill';
  let activeGroup = record.view?.setupTab || 'layouts';

  const coarseQuery = window.matchMedia('(pointer: coarse)');
  function shortWindow() { return window.innerHeight < 36 * 16 && window.innerWidth > window.innerHeight * 1.15; }
  const placeNow = () => (filling() ? 'over' : null) || record.view.controlsPlace || getPanelPlan()?.place || (shortWindow() && coarseQuery.matches ? 'edges' : 'under');

  const roomFor = (desktop) => {
    const pageW = cabinetVoyage?.clientWidth || 360;
    const tracks = cabinetVoyage?.dataset.tracks;
    const panelPlan = getPanelPlan();
    if (tracks === 'solo') return pageW;
    if (panelPlan?.arrangement === 'side' || tracks === 'pair') return Math.max(240, pageW - 15 * 16 - 24);
    const deskRoom = Math.min(window.innerWidth * (cabinetVoyage.classList.contains('is-story-under') ? 0.5 : 0.42), 760);
    if (panelPlan?.arrangement === 'spread') return Math.max(240, Math.min(deskRoom, pageW - 2 * (15 * 16 + 24)));
    return desktop ? deskRoom : pageW;
  };

  function cabinetRoom() {
    const screenEl = root.querySelector('.pie-screen');
    if (!screenEl || !cabinetVoyage) return null;
    const desktop = window.matchMedia('(min-width: 62rem)').matches;
    const topGap = desktop ? parseFloat(getComputedStyle(root).top) || 72 : 8;
    const pad = root.offsetWidth - screenEl.offsetWidth;
    const room = roomFor(desktop);
    const gap = parseFloat(getComputedStyle(root).rowGap) || 0;
    const below = getPanelPlan() ? 0 : [heightsPanel, root.querySelector('.pie-caption'), root.querySelector('.pie-flow-prose.is-under')]
      .filter((el) => el && el.parentElement === root && !el.hidden && el.offsetParent)
      .reduce((sum, el) => sum + el.offsetHeight + gap, 0);
    const chrome = root.offsetHeight - screenEl.offsetHeight - below;
    const screenH = Math.max(300, window.innerHeight - topGap - 12 - chrome);
    return { pad, room, fitW: Math.round(Math.min(room, Math.max(240, screenH * (W / H) + pad))) };
  }

  function fitCabinet() {
    if (!cabinetVoyage || setting('size') !== 'fit' || filling()) return;
    const screenEl = root.querySelector('.pie-screen');
    if (!screenEl) return;
    const desktop = window.matchMedia('(min-width: 62rem)').matches;
    const topGap = desktop ? parseFloat(getComputedStyle(root).top) || 72 : 8;
    const pad = root.offsetWidth - screenEl.offsetWidth;
    const room = roomFor(desktop);
    const gap = parseFloat(getComputedStyle(root).rowGap) || 0;
    const panelPlan = getPanelPlan();
    const belowFold = () => (panelPlan ? 0 : [heightsPanel, root.querySelector('.pie-caption'), root.querySelector('.pie-flow-prose.is-under')]
      .filter((el) => el && el.parentElement === root && !el.hidden && el.offsetParent)
      .reduce((sum, el) => sum + el.offsetHeight + gap, 0));
    let lanesRoom = window.innerHeight;
    for (let pass = 0; pass < 2; pass += 1) {
      const chrome = root.offsetHeight - screenEl.offsetHeight - belowFold();
      lanesRoom = window.innerHeight - topGap - 12 - chrome;
      const screenH = Math.max(Math.min(panelPlan ? 260 : 300, window.innerHeight * 0.6), lanesRoom);
      const w = Math.round(Math.min(room, Math.max(panelPlan ? 200 : 240 * Math.min(1, window.innerHeight / 560), screenH * (W / H) + pad)));
      cabinetVoyage.style.setProperty('--cabinet-fit', `${w}px`);
    }
    return lanesRoom;
  }

  let fitTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => { applySetup(); if (setupOut && !setupOut.hidden) placeSetup(); }, 150); });

  const planNow = () => (setting('panels') !== 'auto' && !filling() ? null : planPanels({
    fill: filling(),
    vw: window.innerWidth,
    vh: window.innerHeight,
    room: cabinetVoyage?.clientWidth || window.innerWidth,
    coarse: coarseQuery.matches,
    want: record.view.zen
      ? { caption: false, strip: false, heights: false, show: false, lanesStory: record.view.storyIn !== 'off' }
      : { caption: setting('caption') !== false, strip: record.view.story !== false, heights: setting('heightsShown') !== false, show: record.view.show === 'inset', lanesStory: record.view.storyIn !== 'off' },
    controls: record.view.controlsPlace || null,
    stripRem: record.view.stripH || 6.4,
    rail: shortWindow()
  }));

  const stepsBar = root.querySelector('.pie-steps');
  const screenBox = root.querySelector('.pie-screen');
  const screenCard = root.querySelector('[data-pie-card]');
  let screenRow = null;

  function placeControls(place) {
    if (!stepsBar || !screenBox) return;
    if (place === 'edges') {
      screenRow = screenRow || nodeOf('div', 'pie-screenrow');
      if (screenBox.parentElement !== screenRow) { screenBox.before(screenRow); screenRow.append(screenBox); }
      if (stepsBar.parentElement !== screenRow) screenRow.append(stepsBar);
      return;
    }
    if (screenRow && screenBox.parentElement === screenRow) { screenRow.before(screenBox); screenRow.remove(); }
    if (place === 'over') { if (stepsBar.parentElement !== screenBox) screenCard.before(stepsBar); }
    else if (stepsBar.parentElement !== root) root.insertBefore(stepsBar, root.querySelector('.pie-thumbs'));
  }

  const showInset = document.querySelector('[data-pie-show-inset]');
  const showInsetHome = showInset?.parentElement;
  const measureGlass = () => {
    const board = getBoard();
    const glass = screenBox?.querySelector(':scope > .pie-caption');
    setGlassFoot(glass && screenBox.clientHeight ? board.y0 + ((glass.offsetTop + glass.offsetHeight) / screenBox.clientHeight) * board.h : 0);
  };
  if (window.ResizeObserver) {
    const glassWatch = new ResizeObserver(measureGlass);
    const captionAtStart = root.querySelector('.pie-caption');
    if (captionAtStart) glassWatch.observe(captionAtStart);
    if (screenBox) glassWatch.observe(screenBox);
  }

  function syncConductorSwing(chapterNum = getRun()?.chapter || 1) {
    const swingSetting = setting('swing');
    const levelSwing = (levelData.levels[chapterNum]?.swing || 50) / 100;
    const override = swingSetting === 'straight' ? 0.5
      : swingSetting === 'lilt' ? 0.58
      : swingSetting === 'deep' ? 0.67
      : setting('feel') === 'jazz' ? Math.max(levelSwing, 0.66) : null;
    conductor.setSwingOverride(override);
  }

  let lastTerm = '';
  const holdNow = () => (setting('hold') === 'auto' ? suggestHold({ coarse: coarseQuery.matches, vw: window.innerWidth, vh: window.innerHeight }) : setting('hold'));
  const chosenOf = (key) => (key === 'storyAt' ? (record.view.story === false ? 'off' : record.view.storyAt) : record.view[key]);
  const lineNow = () => boardLine(chosenOf);

  function applySetup({ replan = true } = {}) {
    const run = getRun();
    setMusicBed(record.sound && setting('music') === 'full');
    setSoundTextures({ wap: setting('wap'), steps: setting('steps') });
    setSoundFeel(setting('feel'));
    const styleNow = run?.style || getCreatorStyle();
    const charTune = domainTune('characters');
    setSoundConfig({
      swing: setting('swing'),
      voicing: setting('voicing'),
      motifCues: setting('motifCues'),
      songSpace: setting('songSpace'),
      mix: setting('mix'),
      ear: setting('ear'),
      styleVoicing: styleNow.voicing,
      styleInterval: styleNow.interval,
      patternMode: String(charTune.pattern_mode || 'chapter'),
      jazzLean: Number(charTune.jazz_lean ?? 1)
    });
    syncConductorSwing();
    setSoundCarrier(themesOn() && run ? run.carrier.id : '');
    cabinetVoyage?.classList.toggle('is-wide', setting('wide') === 'window');
    cabinetVoyage?.classList.toggle('is-fill', filling());
    if (cabinetVoyage) cabinetVoyage.dataset.hold = holdNow();
    cabinetVoyage?.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
    root.classList.toggle('is-short', shortWindow());
    if (replan) setPanelPlan(planNow());
    const plan = getPanelPlan();
    const fitMode = setting('size') === 'fit';
    cabinetVoyage?.classList.toggle('is-fit', fitMode);
    cabinetVoyage?.style.setProperty('--cabinet-scale', String(fitMode ? 1 : setting('size')));
    root.classList.toggle('is-compact-controls', setting('controls') === 'icons');
    root.classList.toggle('is-controls-bottom', setting('controlsAt') === 'bottom');
    root.classList.toggle('is-caption-off', setting('caption') === false);
    cabinetVoyage?.classList.toggle('is-caption-off', setting('caption') === false);
    const arrows = setting('arrows');
    const place = placeNow();
    const plainRow = arrows === 'row' && place === 'under';
    root.classList.toggle('is-arrows', !plainRow);
    root.classList.toggle('is-arrows-cross', arrows === 'cross');
    root.classList.toggle('is-arrows-sides', !plainRow && arrows !== 'cross');
    root.classList.toggle('is-place-edges', place === 'edges');
    root.classList.toggle('is-place-over', place === 'over');
    root.classList.toggle('is-buttons-sides', plainRow && setting('buttons') === 'sides');
    root.classList.toggle('is-buttons-ab', plainRow && setting('buttons') === 'ab');
    root.classList.toggle('is-buttons-swap', setting('buttonsSwap') === true);
    root.style.setProperty('--controls-scale', String(setting('controlsSize')));
    cabinetVoyage?.style.setProperty('--flow-scale', String(setting('flowSize')));
    placeControls(place);
    const side = document.querySelector('.pie-flow-wonders');
    const at = record.view.story === false ? 'off'
      : plan ? (plan.forms.strip === 'verge' ? 'verge' : { spread: 'beside', side: 'side' }[plan.arrangement] || (['full', 'compact'].includes(plan.forms.strip) ? 'under' : 'folded'))
        : setting('storyAt');
    if (flowProseBox && flowHome) {
      if (at === 'verge') { if (flowProseBox.parentElement !== screenBox) screenCard.before(flowProseBox); }
      else if (at === 'under' && flowProseBox.parentElement !== root) root.insertBefore(flowProseBox, heightsPanel?.parentElement === root ? heightsPanel : root.querySelector(':scope > .pie-caption'));
      else if (at === 'side' && side && flowProseBox.parentElement !== side) side.prepend(flowProseBox);
      else if (!['under', 'side'].includes(at) && flowProseBox.parentElement !== flowHome) flowHome.prepend(flowProseBox);
      flowProseBox.classList.toggle('is-under', at === 'under');
      flowProseBox.classList.toggle('is-verge', at === 'verge');
      flowProseBox.classList.toggle('is-side', at === 'side');
      cabinetVoyage?.classList.toggle('is-story-under', at === 'under');
      cabinetVoyage?.classList.toggle('is-strip-folded', at === 'folded');
    }
    if (heightsPanel) heightsPanel.hidden = setting('heightsShown') === false;
    const wide = window.matchMedia('(min-width: 62rem)').matches;
    const captionEl = root.querySelector('.pie-caption') || side?.querySelector('.pie-caption');
    const anchor = () => (stepsBar?.parentElement === root ? stepsBar : root.querySelector('.pie-thumbs'));
    const beside = plan ? ['spread', 'side'].includes(plan.arrangement) : wide && setting('panelsAt') === 'beside';
    if (side && captionEl && heightsPanel) {
      if (beside) {
        if (captionEl.parentElement !== side || heightsPanel.parentElement !== side) {
          if (flowProseBox?.parentElement === side) flowProseBox.after(captionEl, heightsPanel);
          else side.prepend(captionEl, heightsPanel);
        }
      } else {
        if (heightsPanel.parentElement !== root) root.insertBefore(heightsPanel, anchor());
        if (plan?.forms.caption === 'glass') { if (captionEl.parentElement !== screenBox) screenCard.before(captionEl); }
        else if (captionEl.parentElement !== root) root.insertBefore(captionEl, anchor());
      }
      cabinetVoyage?.classList.toggle('is-panels-beside', captionEl.parentElement === side);
    }
    if (cabinetVoyage) {
      const sideBySide = wide || ['spread', 'side'].includes(plan?.arrangement);
      const leftTrack = !record.view.zen && record.view.story !== false && at === 'beside';
      const rightTrack = !record.view.zen && (record.view.story !== false
        || (captionEl?.parentElement === side && setting('caption') !== false)
        || (heightsPanel?.parentElement === side && setting('heightsShown') !== false));
      if (!sideBySide) delete cabinetVoyage.dataset.tracks;
      else cabinetVoyage.dataset.tracks = leftTrack && rightTrack ? 'trio' : rightTrack ? 'pair' : 'solo';
    }
    if (showInset && showInsetHome) {
      if (plan?.forms.show === 'pip') { if (showInset.parentElement !== screenBox) screenCard.before(showInset); }
      else if (showInset.parentElement !== showInsetHome) showInsetHome.append(showInset);
    }
    if (cabinetVoyage && plan) {
      cabinetVoyage.dataset.formCaption = plan.forms.caption;
      cabinetVoyage.dataset.formStrip = plan.forms.strip;
      cabinetVoyage.dataset.formHeights = plan.forms.heights;
      cabinetVoyage.dataset.formShow = plan.forms.show;
    } else if (cabinetVoyage) {
      ['formCaption', 'formStrip', 'formHeights', 'formShow'].forEach((key) => delete cabinetVoyage.dataset[key]);
    }
    cabinetVoyage?.classList.toggle('is-arranged', Boolean(plan));
    cabinetVoyage?.classList.toggle('is-arranged-side', plan?.arrangement === 'side');
    requestAnimationFrame(() => {
      const flowProse = getFlowProse();
      const flowMeasure = getFlowMeasure();
      if (flowProse && at !== 'folded' && at !== 'off' && flowMeasure.length && !flowMeasure.some((m) => m.h)) {
        setFlowMeasure([...flowProse.children].map((li) => ({ top: li.offsetTop, h: li.offsetHeight })));
      }
      const lanesH = fitCabinet();
      measureGlass();
      requestAnimationFrame(fit);
      const settled = setting('size') === 'fit' && Number.isFinite(lanesH) ? settlePlan(getPanelPlan(), lanesH) : null;
      if (settled && settled.settled <= 6) {
        setPanelPlan(settled);
        applySetup({ replan: false });
        if (setupOut && !setupOut.hidden) paintSetup();
        return;
      }
      document.documentElement.classList.remove('pie-settling');
    });
  }
  heightsPanel?.addEventListener('toggle', () => requestAnimationFrame(() => { fitCabinet(); requestAnimationFrame(fit); }));

  const toolsBar = root.querySelector('.pie-tools');
  const splitLabels = () => {
    toolsBar?.querySelectorAll('button').forEach((b) => {
      if (b.querySelector('.tool-icon')) return;
      const text = b.textContent.trim();
      const cut = text.indexOf(' ');
      if (cut < 1) return;
      const glyph = text.slice(0, cut);
      const words = text.slice(cut + 1);
      const mark = Object.assign(document.createElement('span'), { className: 'tool-icon' });
      const drawn = iconForGlyph(glyph, words);
      if (drawn) mark.innerHTML = icon(drawn, { size: 18 }); else mark.textContent = glyph;
      b.replaceChildren(mark, Object.assign(document.createElement('span'), { className: 'tool-words', textContent: words }));
      b.setAttribute('aria-label', words);
      if (!b.title) b.title = words;
    });
  };
  if (toolsBar) new MutationObserver(splitLabels).observe(toolsBar, { childList: true, subtree: true, characterData: true });
  requestAnimationFrame(splitLabels);

  function applyLayout(id) {
    const wide = window.matchMedia('(min-width: 62rem)').matches;
    const v = record.view;
    const set = {
      lanes: { panels: 'manual', size: 'fit', controls: 'icons', controlsAt: 'top', panelsAt: 'beside', storyIn: 'caption', caption: false, heightsShown: false, show: 'off', story: wide },
      reader: { panels: 'manual', size: 'fit', storyAt: wide ? 'beside' : 'under', storyIn: 'off', storyMotion: 'passage', flowSize: 1.18, caption: true, heightsShown: false, story: true },
      tactician: { panels: 'manual', size: 'fit', heightsShown: true, heights: true, show: 'inset', storyIn: 'road', caption: true, heightsCfg: { ...HEIGHTS_DEFAULTS } },
      comic: { panels: 'manual', size: 'fit', panelsAt: 'beside', caption: true, heightsShown: true, heights: true, show: 'inset', storyIn: 'caption', heightsCfg: { ...HEIGHTS_DEFAULTS, meanwhile: true } },
      arranged: { panels: 'auto', size: 'fit', story: true, caption: true, heightsShown: true, heights: true, storyIn: undefined }
    }[id];
    if (!set) return;
    Object.assign(v, set);
    writeRecord(record);
    if (heightsPanel && set.heights) heightsPanel.open = true;
    applyView();
    applyShow();
    applySetup();
    paintSetup();
    requestAnimationFrame(placeSetup);
    say(`${LAYOUTS.find(([k]) => k === id)[1]}: ${LAYOUTS.find(([k]) => k === id)[2]}`);
  }

  function viewsMatrix() {
    const box = nodeOf('details', 'pie-setup-matrix');
    box.append(nodeOf('summary', '', 'What each view makes easier'));
    const table = nodeOf('table', '');
    const head = nodeOf('tr', '');
    ['', 'Across', 'Ahead', 'Height', 'Timing', 'Story'].forEach((h) => head.append(nodeOf('th', '', h)));
    table.append(head);
    VIEWS.forEach(([name, ...cells]) => {
      const tr = nodeOf('tr', '');
      tr.append(nodeOf('th', '', name));
      cells.forEach((c) => { const td = nodeOf('td', c === '✓' ? 'is-easier' : c === '✕' ? 'is-harder' : '', c); td.setAttribute('aria-label', c === '✓' ? 'easier' : c === '✕' ? 'harder' : 'no change'); tr.append(td); });
      table.append(tr);
    });
    box.append(table, nodeOf('p', 'pie-setup-note', '✓ easier · ✕ harder · · neither. Height is the hardest to see from above: the ⤒ marks and the heights strip are there for it. The story is hardest to follow while playing: a caption or the road brings it into the lanes.'));
    box.append(nodeOf('p', 'pie-setup-note', 'The lanes gain three dimensions, each shown once: height rises in streaks from chapter Four, games open as a horn from Six, depth draws lines to a far point from Ten. A rented wind streaks across; a re-let redraws the lane edges. Off your left shoulder, a run of good things fills the room: FIFTH, then THIRD, then COLOUR. A knock lets it go. The marks name what is being sung.'));
    return box;
  }

  const notInUse = (key) => {
    const storyOn = record.view.story !== false && !record.view.zen;
    const plainRow = setting('arrows') === 'row' && placeNow() === 'under';
    const wideEnough = window.matchMedia('(min-width: 62rem)').matches;
    if (['buttons', 'buttonsSwap'].includes(key) && !plainRow) return 'Only with the arrows in a row, under the screen.';
    if (['storyMotion', 'storyLine', 'flowSize'].includes(key) && !storyOn) return 'Only while the story is shown.';
    if (key === 'panelsAt' && setting('panels') === 'auto') return 'The panels are arranged for this screen.';
    if (key === 'panelsAt' && !wideEnough) return 'Only on a wide window.';
    if (key === 'wide' && !wideEnough) return 'Only on a wide window.';
    if (key === 'swipeUp' && !coarseQuery.matches) return 'Only on a touch screen.';
    if (key === 'glow' && setting('music') === 'quiet') return 'Only with the music on.';
    if (key === 'share' && !filling()) return 'Only when the lanes fill a full screen (⛶, with Fill chosen above).';
    return '';
  };

  function paintSetupMap() {
    const out = setupOut?.querySelector('[data-pie-setup-map]');
    if (!out) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const scale = Math.min(150 / vw, 92 / vh);
    const sized = MAP_PARTS.map(([selector, kind, name]) => {
      const el = document.querySelector(selector);
      if (!el || !el.offsetParent) return null;
      const box = el.getBoundingClientRect();
      const x = Math.max(0, box.left);
      const y = Math.max(0, box.top);
      const w = Math.min(vw, box.right) - x;
      const h = Math.min(vh, box.bottom) - y;
      return w > 2 && h > 2 ? { kind, name, block: [kind, +(x * scale).toFixed(1), +(y * scale).toFixed(1), +(w * scale).toFixed(1), +(h * scale).toFixed(1)], share: (w * h) / (vw * vh) } : null;
    }).filter(Boolean);
    const lanes = sized.find((part) => part.kind === 'lanes');
    const sayLine = nodeOf('p', 'pie-setup-map-says', lanes ? `The lanes have ${Math.round(lanes.share * 100)}% of this window.` : 'The lanes are out of view.');
    const key = nodeOf('p', 'pie-setup-map-key', sized.map((part) => part.name).join(' · '));
    const art = nodeOf('span', 'pie-setup-map-art');
    art.innerHTML = miniBlocks(sized.map((part) => part.block), Math.round(vw * scale), Math.round(vh * scale));
    art.style.width = `${Math.round(vw * scale)}px`;
    art.style.height = `${Math.round(vh * scale)}px`;
    const words = nodeOf('span', 'pie-setup-map-words');
    words.append(sayLine, key);
    out.replaceChildren(art, words);
  }

  function applyHold(id) {
    if (id !== 'auto' && !HOLDS[id]) return;
    if (id === 'auto') record.view.hold = 'auto';
    else applyBoardView({ hold: id });
    const visitBoard = getVisitBoard();
    if (visitBoard) { Object.keys(HOLDS[id]?.view || {}).forEach((key) => delete visitBoard.before[key]); delete visitBoard.before.hold; }
    lastTerm = 'hold';
    writeRecord(record);
    applyView();
    applySetup();
    paintSetup();
    requestAnimationFrame(placeSetup);
    say(id === 'auto' ? 'Held as this screen suggests.' : `${HOLDS[id].name}: ${HOLDS[id].says}`);
  }

  const boardBlock = () => {
    const box = nodeOf('div', 'pie-setup-board');
    const line = lineNow();
    const code = nodeOf('code', 'pie-setup-board-line');
    loadParser().then((m) => {
      const said = m?.spokenLine?.(line);
      if (said?.clauses?.length && code.isConnected !== false) code.setAttribute('aria-label', `The board line: ${said.clauses.map((c) => c.says).join(', ')}`);
    }).catch(() => {});
    const changed = lastTerm ? `${lastTerm === 'fill' ? 'frame' : lastTerm === 'share' ? 'lanes' : lastTerm.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}[` : '';
    line.split(/(\s+)/).forEach((part) => {
      if (changed && part.slice(1).startsWith(changed)) code.append(nodeOf('mark', '', part));
      else code.append(part);
    });
    box.append(code, nodeOf('p', 'pie-setup-board-says', 'Every choice in Setup is a term of this line: @ is whose hands, % is how much, = is what the board is tuned to. The lanes are the same size on every screen, and the line says how this one holds them.'));
    if (getVisitBoard()) {
      const keep = nodeOf('button', 'pie-setup-board-keep', 'Keep this line');
      keep.type = 'button';
      keep.addEventListener('click', () => { setVisitBoard(null); writeRecord(record); paintSetup(); say('The line from the link is kept.'); });
      box.append(nodeOf('p', 'pie-setup-board-says', 'A link brought this line. It holds for this visit; what you had comes back next time unless you keep it.'), keep);
    }
    const acts = nodeOf('div', 'pie-setup-board-acts');
    const copy = nodeOf('button', 'pie-setup-board-copy', 'Copy as a link');
    copy.type = 'button';
    const field = nodeOf('input', 'pie-setup-board-field');
    field.type = 'text';
    field.spellcheck = false;
    field.autocapitalize = 'off';
    field.setAttribute('aria-label', 'A board line to read');
    field.placeholder = '^board{ @hold[two_thumbs] }';
    copy.addEventListener('click', () => {
      const url = `${window.location.origin}${window.location.pathname}?board=${encodeURIComponent(lineNow())}`;
      const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy as a link'; }, 1600); };
      try { navigator.clipboard.writeText(url).then(done, () => { field.value = url; field.select(); }); } catch { field.value = url; field.select(); }
    });
    const read = nodeOf('button', 'pie-setup-board-read', 'Read a line');
    read.type = 'button';
    const heard = nodeOf('p', 'pie-setup-board-heard');
    heard.setAttribute('role', 'status');
    read.addEventListener('click', async () => {
      let text = field.value.trim();
      const fromLink = /[?&]board=([^&#]*)/.exec(text);
      if (fromLink) { try { text = decodeURIComponent(fromLink[1]); } catch { text = fromLink[1]; } }
      const parser = await loadParser();
      const { view, unknown, reader } = readBoardLine(text, { parse: parser?.parse || null });
      const keys = Object.keys(view);
      if (keys.length) {
        applyBoardView(view);
        const vb = getVisitBoard();
        if (vb) keys.forEach((key) => delete vb.before[key]);
        lastTerm = keys[keys.length - 1];
        writeRecord(record);
        applyView();
        applySetup();
        paintSetup();
        requestAnimationFrame(placeSetup);
      }
      const out = setupOut.querySelector('.pie-setup-board-heard') || heard;
      out.textContent = `${keys.length ? `Read ${keys.length} term${keys.length === 1 ? '' : 's'}${reader === 'spw-seed' ? ' with the Spw parser' : ''}.` : 'Nothing in it was a choice the board has.'}${unknown.length ? ` Not taken: ${unknown.join('; ')}.` : ''}`;
    });
    acts.append(copy, field, read);
    box.append(acts, heard);
    return box;
  };

  const holdsList = () => {
    const wrap = nodeOf('div', 'pie-setup-holds');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'How you hold it');
    wrap.append(nodeOf('p', 'pie-setup-subhead', 'How you hold it'));
    const suggested = suggestHold({ coarse: coarseQuery.matches, vw: window.innerWidth, vh: window.innerHeight });
    const chosen = setting('hold');
    const list = nodeOf('div', 'pie-setup-layouts pie-setup-holdlist');
    [...Object.entries(HOLDS), ['auto', { name: 'As this screen suggests', says: `Nothing chosen: this screen suggests ${HOLDS[suggested].name.toLowerCase()}, and the board follows whatever you set below.` }]].forEach(([id, hold]) => {
      const b = nodeOf('button', 'pie-setup-layout pie-setup-hold');
      b.type = 'button';
      b.dataset.key = 'hold';
      b.dataset.value = id;
      b.title = hold.says;
      b.setAttribute('aria-pressed', chosen === id ? 'true' : 'false');
      const art = nodeOf('span', 'pie-setup-layout-art');
      art.innerHTML = id === 'auto' ? holdMini(suggested) : holdMini(id);
      b.append(art, nodeOf('b', '', `${hold.name}${id === suggested && chosen === 'auto' ? ' · suggested' : ''}`), nodeOf('small', '', hold.says));
      b.addEventListener('click', () => applyHold(id));
      list.append(b);
    });
    wrap.append(list);
    if (HOLDS[holdNow()]?.view.fill === 'fill' && !getFullOn() && document.fullscreenEnabled !== undefined) {
      const go = nodeOf('button', 'pie-setup-board-full', '⛶ Fill the screen with it');
      go.type = 'button';
      go.addEventListener('click', () => { closeSetup(); setFull(true); });
      wrap.append(go);
    }
    return wrap;
  };

  function paintSetup() {
    if (!setupOut) return;
    const run = getRun();
    const savedSetupScroll = setupOut.scrollTop;
    const savedPanelScroll = setupOut.querySelector('.pie-setup-panel')?.scrollTop ?? 0;
    const focused = document.activeElement && setupOut.contains(document.activeElement) ? document.activeElement : null;
    const refocus = focused?.dataset?.key ? `[data-key="${focused.dataset.key}"][data-value="${focused.dataset.value}"]` : focused?.dataset?.tab ? `[data-tab="${focused.dataset.tab}"]` : '';
    const currentOf = (key) => (key === 'storyAt' && record.view.story === false ? 'off' : key === 'storyIn' ? storyInMode() : key === 'controlsPlace' ? placeNow() : setting(key));
    const rows = SETUP.map(([key, label, options]) => {
      const row = nodeOf('div', 'pie-setup-row');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', label);
      row.append(nodeOf('span', 'pie-setup-label', label));
      const current = currentOf(key);
      const defVal = SETUP.find(([k]) => k === key)?.[3];
      if (defVal !== undefined && String(current) !== String(defVal)) row.classList.add('is-customized');
      if (getPanelPlan() && key === 'storyAt') {
        row.classList.add('is-overridden');
        row.title = 'The panels are arranged for this screen: choosing here sets them by hand instead.';
      }
      const opts = nodeOf('div', 'pie-setup-opts');
      options.forEach(([value, words]) => {
        const b = nodeOf('button', 'pie-setup-opt', words);
        b.type = 'button';
        b.dataset.key = key;
        b.dataset.value = String(value);
        const about = teachLine(key, value);
        if (about) {
          b.title = about;
          b.setAttribute('aria-description', about);
        }
        b.setAttribute('aria-pressed', String(current) === String(value) ? 'true' : 'false');
        b.addEventListener('click', () => {
          if (['panelsAt', 'storyAt'].includes(key) && value !== 'off' && setting('panels') === 'auto') record.view.panels = 'manual';
          if (key === 'storyAt') {
            record.view.story = value !== 'off';
            if (value !== 'off') record.view.storyAt = value;
            applyView();
          } else record.view[key] = value;
          const vb = getVisitBoard();
          if (vb) { delete vb.before[key]; if (key === 'storyAt') delete vb.before.story; }
          lastTerm = key;
          writeRecord(record);
          applySetup();
          if (record.sound && ['wap', 'steps', 'cues', 'feel', 'swing', 'voicing', 'motifCues', 'songSpace', 'mix'].includes(key)) {
            try {
              primeAudio();
              if (key === 'wap') wapSound(1, 0, 0);
              if (key === 'feel') feelSample(value);
              if (key === 'steps') { playTone('step', -1); setTimeout(() => playTone('step', 1), 180); }
              if (key === 'cues' && value !== 'off') { laneWarning(0, 0.8, value === 'one' ? 'one' : 'low'); if (value === 'shaped') setTimeout(() => laneWarning(0, 0.8, 'tall'), 420); }
              if (key === 'swing') { playTone('pocket', 1); setTimeout(() => playTone('poise', 0), value === 'deep' ? 230 : value === 'lilt' ? 200 : 175); }
              if (key === 'voicing' || key === 'songSpace' || key === 'mix') { playBoardMotifCue({ action: 'pantry', pan: 0, depth: value === 'hall' ? 0.55 : value === 'close' ? 0.05 : 0.25, kind: 'berry' }); }
              if (key === 'motifCues' && value !== 'off') { playBoardMotifCue({ action: 'tension', tension: '#11', pan: 0.25, depth: 0.2 }); setTimeout(() => playBoardMotifCue({ action: 'resolve', pan: 0 }), 260); }
            } catch { /* chosen, if not heard */ }
          }
          paintSetup();
          requestAnimationFrame(placeSetup);
          if (teachOn()) {
            const joke = jokeOf(key, value);
            if (joke) say(joke.teach);
          }
        });
        opts.append(b);
      });
      row.append(opts);
      if (teachOn()) {
        const lesson = teachLine(key, current);
        if (lesson) row.append(nodeOf('p', 'pie-setup-teach', lesson));
      }
      return row;
    });
    const rowOf = new Map(SETUP.map(([key], i) => [key, rows[i]]));
    const placed = new Set([...SETUP_GROUPS.flatMap(([, , , keys]) => keys), 'hold']);
    const groups = [...SETUP_GROUPS, ...(SETUP.some(([key]) => !placed.has(key)) ? [['more', 'More', 'setup', SETUP.map(([key]) => key).filter((key) => !placed.has(key))]] : [])];
    const layoutsBody = () => {
      const list = nodeOf('div', 'pie-setup-layouts');
      list.setAttribute('role', 'group');
      list.setAttribute('aria-label', 'Layouts');
      LAYOUTS.forEach(([id, label, says]) => {
        const b = nodeOf('button', 'pie-setup-layout');
        b.type = 'button';
        b.dataset.key = 'layout';
        b.dataset.value = id;
        b.title = says;
        const art = nodeOf('span', 'pie-setup-layout-art');
        art.innerHTML = miniBlocks(LAYOUT_MINIS[id] || []);
        b.append(art, nodeOf('b', '', label), nodeOf('small', '', says));
        b.addEventListener('click', () => applyLayout(id));
        list.append(b);
      });
      const plan = getPanelPlan();
      return [boardBlock(), holdsList(), nodeOf('p', 'pie-setup-subhead', 'What you see'), list, ...(plan ? [nodeOf('p', 'pie-setup-plan', `${plan.arrangement === 'fill' ? '' : 'Arranged for this screen. '}${plan.why}`)] : [])];
    };
    const applyCluster = (values, label) => {
      applyBoardView(values);
      const vb = getVisitBoard();
      if (vb) Object.keys(values).forEach((k) => delete vb.before[k]);
      lastTerm = 'feel';
      writeRecord(record);
      applyView();
      applySetup();
      if (record.sound) {
        try { primeAudio(); playBoardMotifCue({ action: 'pantry', pan: 0, depth: 0.25, kind: 'berry' }); } catch { /* silent cluster switch */ }
      }
      paintSetup();
      requestAnimationFrame(placeSetup);
      say(`${label}: sound cluster set.`);
    };
    const isCustomized = (key) => {
      const def = SETUP.find(([k]) => k === key)?.[3];
      return def !== undefined && String(currentOf(key)) !== String(def);
    };
    const tuningGrid = (kind) => {
      const dials = kind === 'game'
        ? [['characters', 'obstacle_contrast'], ['characters', 'bounce_scale'], ['arcs', 'recovery_grace'], ['minis', 'mini_tempo']]
        : [['characters', 'voice_presence'], ['characters', 'jazz_lean'], ['scenes', 'room_air'], ['storylines', 'chord_bloom'], ['arcs', 'tension_depth'], ['minis', 'banner_flourish'], ['unlocks', 'groove_level'], ['unlocks', 'pocket_sparkle'], ['unlocks', 'sympathetic_gain']];
      const grid = nodeOf('div', 'pie-setup-domains-grid');
      dials.forEach(([domId, dialKey]) => {
        const spec = TUNING_DOMAINS[domId]?.dials?.[dialKey];
        if (!spec) return;
        const wrap = nodeOf('label', 'pie-setup-dial');
        const curVal = Number(domainTune(domId)[dialKey] ?? 1);
        const valSpan = nodeOf('b', '', `${Math.round(curVal * 100)}%`);
        const headSpan = nodeOf('span', 'pie-setup-dial-head');
        headSpan.append(nodeOf('span', '', spec.label), valSpan);
        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(spec.min);
        input.max = String(spec.max);
        input.step = String(spec.step || 0.05);
        input.value = String(curVal);
        input.dataset.domain = domId;
        input.dataset.dial = dialKey;
        input.setAttribute('aria-description', spec.says);
        input.setAttribute('aria-valuetext', `${spec.label}, ${Math.round(curVal * 100)} percent. ${spec.says}`);
        input.addEventListener('input', () => {
          const value = Number(input.value);
          valSpan.textContent = `${Math.round(value * 100)}%`;
          input.setAttribute('aria-valuetext', `${spec.label}, ${Math.round(value * 100)} percent. ${spec.says}`);
          const next = { ...effectiveDomain(domId, getSavedTuningDomains()), [dialKey]: value };
          setSavedTuningDomains({ ...getSavedTuningDomains(), [domId]: next });
          setTuningDomains({ ...getTuningDomains(), [domId]: next });
          keepTuningDomains();
          applySetup({ replan: false });
        });
        wrap.append(headSpan, input, nodeOf('small', 'pie-setup-dial-says', spec.says));
        grid.append(wrap);
      });
      return grid;
    };
    const tuningBody = () => [
      nodeOf('p', 'pie-setup-note', 'Tune how strongly the road presses back. Every dial takes effect immediately and stays on this device.'),
      tuningGrid('game')
    ];
    const groupBody = (id, keys) => {
      const live = keys.filter((key) => !notInUse(key));
      const resting = keys.filter((key) => notInUse(key));
      const parts = [];
      if (id === 'music') {
        const ch = run?.chapter || 1;
        const lv = levelData.levels[ch] || {};
        const bar = nodeOf('div', 'pie-setup-cluster-bar');
        bar.setAttribute('role', 'group');
        bar.setAttribute('aria-label', 'Sound clusters');
        SOUND_CLUSTERS.forEach(([cid, label, says, vals]) => {
          const btn = nodeOf('button', 'pie-setup-cluster-chip');
          btn.type = 'button';
          btn.dataset.cluster = cid;
          const match = Object.entries(vals).every(([k, v]) => String(currentOf(k)) === String(v));
          btn.setAttribute('aria-pressed', match ? 'true' : 'false');
          btn.append(nodeOf('b', '', label), nodeOf('small', '', says));
          btn.addEventListener('click', () => applyCluster(vals, label));
          bar.append(btn);
        });
        parts.push(bar);
        const swingNow = setting('swing') === 'chapter'
          ? `${setting('feel') === 'jazz' ? 'jazz ' : ''}${lv.swing || 50}%`
          : setting('swing');
        const motifText = Array.isArray(lv.motif) && lv.motif.length ? lv.motif.join(' ') : '0 4 7';
        const progNow = run ? progress() : 0;
        const arcMove = progNow < 0.25 ? 'I · Opening' : progNow < 0.55 ? 'II · Rising' : progNow < 0.82 ? 'III · Bridge' : 'IV · Turnaround';
        const stateTag = run?.motifState?.tension
          ? `tension ${run.motifState.tension}`
          : (run?.jazzPocketT || 0) > 0
            ? 'pocket open'
            : setting('feel') === 'jazz'
              ? (run?.wobble >= 0.58 ? 'altered b9' : run?.wobble >= 0.22 ? 'enclosure' : '6/9 poise')
              : 'at rest';
        const readout = nodeOf('div', 'pie-setup-motif-readout');
        const readoutText = nodeOf('span', 'pie-setup-motif-text', `Ch. ${ch} (${arcMove}) · ${lv.tempo || 96} bpm · swing ${swingNow} · motif [${motifText}] · ${stateTag}`);
        const auditionBtn = nodeOf('button', 'pie-setup-audition-btn', '▶ Progression');
        auditionBtn.type = 'button';
        auditionBtn.title = 'Hear this chapter’s four-movement progression in the active feel';
        auditionBtn.addEventListener('click', () => {
          try { primeAudio(); auditionChapterProgression(setting('feel')); } catch { /* silent fallback */ }
        });
        readout.append(readoutText, auditionBtn);
        parts.push(readout);
      }
      if (teachOn() && id === 'music') {
        let genre = {};
        try { genre = JSON.parse(localStorage.getItem('lore.nook.v1') || 'null')?.genre || {}; } catch { genre = {}; }
        parts.push(nodeOf('p', 'pie-setup-teach', leanSentence(record.view || {}, genre)));
      }
      if (teachOn() && id === 'touch') {
        parts.push(nodeOf('p', 'pie-setup-teach', handsLine({
          tap: currentOf('tap'),
          doubleTap: currentOf('doubleTap'),
          swipeUp: currentOf('swipeUp')
        })));
      }
      parts.push(...live.map((key) => rowOf.get(key)).filter(Boolean));
      if (id === 'music') {
        const domainFold = nodeOf('details', 'pie-setup-domains-fold');
        domainFold.append(nodeOf('summary', '', 'Fine-tune the musical shape'), tuningGrid('music'));
        parts.push(domainFold);
      }
      if (resting.length) {
        const fold = nodeOf('details', 'pie-setup-resting');
        fold.append(nodeOf('summary', '', `Not in use just now (${resting.length})`));
        resting.forEach((key) => { const row = rowOf.get(key); if (row) { row.append(nodeOf('p', 'pie-setup-why', notInUse(key))); fold.append(row); } });
        parts.push(fold);
      }
      if (id === 'music') {
        const found = Object.keys(foundRhythms()).map((rid) => levelData.rhythms[rid]?.name).filter(Boolean);
        const total = Object.keys(levelData.rhythms).length;
        parts.push(nodeOf('p', 'pie-setup-rhythms', found.length
          ? `Rhythms you have found: ${found.length}${total ? ` of ${total}` : ''} — ${found.join(', ')}. Each chapter keeps one in a room; play along with it to find it.`
          : `No rhythms found yet${total ? ` (there are ${total})` : ''}. Each chapter keeps one in a room: when the lanes say something here keeps time, step, hop or throw along with it.`));
        parts.push(nodeOf('p', 'pie-setup-rhythms', 'With the music on (either setting past the first), a room says its chord once as it opens, and a pie tilting past poise is a low tone drifting out of tune on the side it leans to. Swung jazz maneuvers open a pocket window and resolve motif tension (b9, #11, sus4).'));
        const said = ['groove', 'in_the_pocket'].map((uid) => [unlockMechanics()[uid], standing(uid)]).filter(([m]) => m);
        if (said.length) {
          const line = nodeOf('p', 'pie-setup-rhythms');
          said.forEach(([m, st], i) => {
            const a = nodeOf('a', '', m.name);
            a.href = `/pie/unlocks/${m.page}/`;
            line.append(i ? ' · ' : 'Unlocks: ', a, st.open ? ' (open)' : ` (${st.have} of ${st.need})`);
          });
          parts.push(line);
        }
      }
      return parts;
    };
    const guideBody = () => [viewsMatrix(), nodeOf('p', 'pie-setup-note', 'By hand: pinch the story to size its words; pinch the cabinet’s frame (not the lanes), or drag its corner ◢, to size the cabinet. On a trackpad, ctrl and scroll does the same.')];
    const sections = [['layouts', 'Layouts', 'screen', null], ...groups.map(([id, title, iconName, keys]) => [id, title, iconName, keys]), ['tuning', 'Game tuning', 'setup', null], ['guide', 'Guide', 'book', null]];
    if (!sections.some(([id]) => id === activeGroup)) activeGroup = 'layouts';
    const head = nodeOf('div', 'pie-setup-head');
    head.append(nodeOf('h2', 'pie-setup-title', 'Setup'));
    const headActs = nodeOf('div', 'pie-setup-head-actions');
    const resetBtn = nodeOf('button', 'pie-setup-reset', 'Reset');
    resetBtn.type = 'button';
    resetBtn.title = 'Return all Setup choices to their defaults';
    resetBtn.addEventListener('click', () => {
      SETUP.forEach(([key, , , def]) => {
        if (key === 'storyAt') { record.view.story = true; record.view.storyAt = def; }
        else record.view[key] = def;
      });
      setSavedTuningDomains({});
      setTuningDomains(parseTuningDomains(visitSpells()));
      try { localStorage.removeItem(TUNING_KEY); } catch { /* this visit only */ }
      setVisitBoard(null);
      lastTerm = '';
      writeRecord(record);
      applyView();
      applySetup();
      paintSetup();
      requestAnimationFrame(placeSetup);
      say('Setup returned to defaults.');
    });
    const close = nodeOf('button', 'pie-setup-close', 'Done');
    close.type = 'button';
    close.addEventListener('click', () => { closeSetup(); setupBtn?.focus({ preventScroll: true }); });
    headActs.append(resetBtn, close);
    head.append(headActs);
    const map = nodeOf('div', 'pie-setup-map');
    map.dataset.pieSetupMap = '';
    const tabs = nodeOf('div', 'pie-setup-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Sections');
    const jumpWrap = nodeOf('label', 'pie-setup-jump-wrap');
    jumpWrap.append(nodeOf('span', '', 'By name'));
    const jump = nodeOf('select', 'pie-setup-jump');
    sections.forEach(([id, title]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = title;
      jump.append(option);
    });
    jumpWrap.append(jump);
    const panel = nodeOf('div', 'pie-setup-panel');
    panel.setAttribute('role', 'tabpanel');
    const choose = (id, { focus = false, keepScroll = false } = {}) => {
      activeGroup = id;
      jump.value = id;
      tabs.querySelectorAll('[role="tab"]').forEach((t) => {
        const on = t.dataset.tab === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus({ preventScroll: true });
        if (on) panel.setAttribute('aria-label', t.textContent);
      });
      const [, , , keys] = sections.find(([sid]) => sid === id);
      panel.replaceChildren(...(id === 'layouts' ? layoutsBody() : id === 'tuning' ? tuningBody() : id === 'guide' ? guideBody() : groupBody(id, keys)), stepper(id));
      panel.scrollTop = keepScroll ? savedPanelScroll : 0;
      tabs.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (record.view.setupTab !== id) { record.view.setupTab = id; writeRecord(record); }
    };
    jump.addEventListener('change', () => choose(jump.value));
    const stepper = (id) => {
      const at = sections.findIndex(([sid]) => sid === id);
      const nav = nodeOf('nav', 'pie-setup-steps');
      nav.setAttribute('aria-label', 'Sections in order');
      const go = (delta, cls) => {
        const next = sections[at + delta];
        if (!next) return nodeOf('span', cls);
        const b = nodeOf('button', `pie-setup-step ${cls}`, delta < 0 ? `‹ ${next[1]}` : `${next[1]} ›`);
        b.type = 'button';
        b.addEventListener('click', () => choose(next[0], { focus: true }));
        return b;
      };
      nav.append(go(-1, 'is-back'), nodeOf('span', 'pie-setup-step-at', `${at + 1} of ${sections.length}`), go(1, 'is-on'));
      return nav;
    };
    let swipe = null;
    panel.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' || event.target.closest?.('input, select, textarea, [contenteditable], .pie-setup-board')) { swipe = null; return; }
      swipe = { x: event.clientX, y: event.clientY, t: performance.now() };
    });
    panel.addEventListener('pointerup', (event) => {
      if (!swipe) return;
      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;
      const quick = performance.now() - swipe.t < 700;
      swipe = null;
      if (!quick || Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 2) return;
      const at = sections.findIndex(([sid]) => sid === activeGroup);
      const next = sections[at + (dx < 0 ? 1 : -1)];
      if (next) choose(next[0]);
    });
    panel.addEventListener('pointercancel', () => { swipe = null; });
    sections.forEach(([id, title, iconName, keys]) => {
      const t = nodeOf('button', 'pie-setup-tab');
      t.type = 'button';
      t.setAttribute('role', 'tab');
      t.dataset.tab = id;
      if (keys?.some(isCustomized)) t.classList.add('is-custom');
      const mark = nodeOf('span', 'pie-setup-tab-icon');
      mark.innerHTML = icon(iconName, { size: 18 });
      t.title = title;
      t.append(mark, nodeOf('span', 'pie-setup-tab-words', { screen: 'Screen', controls: 'Buttons', touch: 'Touch', story: 'Story', cards: 'Cards', music: 'Sound' }[id] || title));
      t.addEventListener('click', () => choose(id));
      t.addEventListener('keydown', (event) => {
        const at = sections.findIndex(([sid]) => sid === activeGroup);
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        choose(sections[(at + step + sections.length) % sections.length][0], { focus: true });
      });
      tabs.append(t);
    });
    const handle = nodeOf('button', 'pie-setup-handle');
    handle.type = 'button';
    handle.setAttribute('aria-label', 'Sheet height: drag, or tap to see more of the lanes or more of Setup');
    let lift = null;
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      try { handle.setPointerCapture(event.pointerId); } catch { /* not live */ }
      lift = { y: event.clientY, h: setupOut.getBoundingClientRect().height, moved: false };
    });
    handle.addEventListener('pointermove', (event) => {
      if (!lift) return;
      const h = clamp(lift.h - (event.clientY - lift.y), window.innerHeight * 0.28, window.innerHeight * 0.9);
      if (Math.abs(event.clientY - lift.y) > 4) { lift.moved = true; setupOut.dataset.customHeight = 'true'; }
      setupOut.style.height = `${Math.round(h)}px`;
    });
    const letGo = () => {
      if (!lift) return;
      if (!lift.moved) {
        const tall = setupOut.getBoundingClientRect().height > window.innerHeight * 0.6;
        setupOut.style.height = `${Math.round(window.innerHeight * (tall ? 0.42 : 0.86))}px`;
      }
      lift = null;
    };
    handle.addEventListener('pointerup', letGo);
    handle.addEventListener('pointercancel', letGo);
    const nav = nodeOf('div', 'pie-setup-nav');
    nav.append(jumpWrap, tabs);
    setupOut.replaceChildren(handle, head, map, nav, panel);
    choose(activeGroup, { keepScroll: true });
    setupOut.scrollTop = savedSetupScroll;
    paintSetupMap();
    if (refocus) setupOut.querySelector(refocus)?.focus({ preventScroll: true });
  }
  requestAnimationFrame(applySetup);

  const setScaled = (key, value, persist) => {
    const [lo, hi] = PINCH_LIMITS[key];
    record.view[key] = Math.round(clamp(value, lo, hi) * 10000) / 10000;
    cabinetVoyage?.style.setProperty(key === 'size' ? '--cabinet-scale' : '--flow-scale', String(record.view[key]));
    if (persist) { writeRecord(record); requestAnimationFrame(fit); if (!setupOut?.hidden) paintSetup(); }
  };

  const mediumWidth = () => (window.matchMedia('(min-width: 62rem)').matches
    ? clamp((window.innerHeight - 320) * 0.643, 288, 400)
    : Math.min(cabinetVoyage?.clientWidth || 360, 416));
  const grip = Object.assign(document.createElement('button'), { type: 'button', className: 'pie-grip', textContent: '◢', title: 'Drag to size the cabinet (or use the arrow keys)' });
  grip.setAttribute('aria-label', 'Size the cabinet: drag, or use the arrow keys');
  root.append(grip);
  const sizeTo = (scale, persist) => {
    if (setting('size') === 'fit') cabinetVoyage?.classList.remove('is-fit');
    setScaled('size', scale, persist);
    if (persist) applySetup();
  };
  let gripDrag = null;
  grip.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    try { grip.setPointerCapture(event.pointerId); } catch { /* drag without capture */ }
    gripDrag = { x: event.clientX, y: event.clientY, w: root.offsetWidth, m: mediumWidth() };
  });
  const snapGuide = Object.assign(document.createElement('span'), { className: 'pie-snap-guide' });
  snapGuide.hidden = true;
  root.append(snapGuide);
  function snapWidth(w, m) {
    const r = cabinetRoom();
    if (!r) return { w, label: '' };
    const points = [[r.fitW, 'Fit the window', 'fit'], [Math.round(m), 'Medium', 1], [Math.round(r.room), 'As wide as there is room', null]];
    const near = points.find(([pw]) => Math.abs(w - pw) <= 14);
    if (near) return { w: near[0], label: near[1], named: near[2] };
    const lane = Math.max(36, Math.round((w - r.pad) / LANES / 4) * 4);
    return { w: Math.min(r.room, lane * LANES + r.pad), label: `Lanes ${lane} px wide`, named: null };
  }
  grip.addEventListener('pointermove', (event) => {
    if (!gripDrag) return;
    const d = Math.max(event.clientX - gripDrag.x, (event.clientY - gripDrag.y) * (W / H));
    const snap = snapWidth(gripDrag.w + d, gripDrag.m);
    gripDrag.snap = snap;
    sizeTo(snap.w / gripDrag.m, false);
    snapGuide.textContent = snap.label;
    snapGuide.hidden = false;
  });
  const gripUp = () => {
    if (!gripDrag) return;
    const snap = gripDrag.snap;
    gripDrag = null;
    snapGuide.hidden = true;
    if (snap?.named === 'fit') { record.view.size = 'fit'; writeRecord(record); applySetup(); say('Cabinet: fit the window.'); return; }
    sizeTo(Number(record.view.size) || 1, true);
    say(`Cabinet sized: ${snap?.label || `${Math.round((Number(record.view.size) || 1) * 100)}%`}.`);
  };
  grip.addEventListener('pointerup', gripUp);
  grip.addEventListener('pointercancel', gripUp);
  grip.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 0.04, ArrowUp: 0.04, ArrowLeft: -0.04, ArrowDown: -0.04 }[event.key];
    if (!step) return;
    event.preventDefault();
    event.stopPropagation();
    const m = mediumWidth();
    const snap = snapWidth(root.offsetWidth + Math.sign(step) * LANES * 4, m);
    if (snap.named === 'fit') { record.view.size = 'fit'; writeRecord(record); applySetup(); } else sizeTo(snap.w / m, true);
    say(`Cabinet: ${snap.label}.`);
  });

  const stripGrip = Object.assign(document.createElement('span'), { className: 'pie-strip-grip', tabIndex: 0, title: 'Drag to size the story strip' });
  stripGrip.setAttribute('role', 'separator');
  stripGrip.setAttribute('aria-orientation', 'horizontal');
  stripGrip.setAttribute('aria-label', 'Story strip height: drag, or use the arrow keys');
  flowProseBox?.append(stripGrip);
  const stripTo = (rem, persist) => {
    record.view.stripH = Math.round(clamp(rem, 4, 16) * 10) / 10;
    cabinetVoyage?.style.setProperty('--strip-h', `${record.view.stripH}rem`);
    if (persist) { writeRecord(record); fitCabinet(); requestAnimationFrame(fit); }
  };
  if (record.view.stripH) cabinetVoyage?.style.setProperty('--strip-h', `${record.view.stripH}rem`);
  let stripDrag = null;
  stripGrip.addEventListener('pointerdown', (event) => { event.preventDefault(); try { stripGrip.setPointerCapture(event.pointerId); } catch { /* not live */ } stripDrag = { y: event.clientY, h: record.view.stripH || 6.4 }; });
  stripGrip.addEventListener('pointermove', (event) => { if (stripDrag) stripTo(stripDrag.h + (event.clientY - stripDrag.y) / 16, false); });
  const stripUp = () => { if (!stripDrag) return; stripDrag = null; stripTo(record.view.stripH || 6.4, true); };
  stripGrip.addEventListener('pointerup', stripUp);
  stripGrip.addEventListener('pointercancel', stripUp);
  stripGrip.addEventListener('keydown', (event) => {
    const step = { ArrowDown: 0.5, ArrowUp: -0.5 }[event.key];
    if (!step) return;
    event.preventDefault();
    event.stopPropagation();
    stripTo((record.view.stripH || 6.4) + step, true);
  });

  const placeSetup = ({ initial = false } = {}) => {
    if (!setupOut || setupOut.hidden) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const cab = root.getBoundingClientRect();
    const gap = 10;
    const right = vw - cab.right - gap * 2;
    const left = cab.left - gap * 2;
    const style = setupOut.style;
    const drawer = Math.max(left, right) >= 300;
    setupOut.classList.toggle('is-drawer', drawer);
    setupOut.classList.toggle('is-sheet', !drawer);
    if (drawer) {
      const width = Math.min(Math.max(left, right), 34 * 16);
      style.width = `${width}px`;
      style.height = `${vh - gap * 2}px`;
      style.top = `${gap}px`;
      style.bottom = 'auto';
      style.left = right >= left ? 'auto' : `${gap}px`;
      style.right = right >= left ? `${gap}px` : 'auto';
    } else {
      let lanes = root.querySelector('.pie-screen')?.getBoundingClientRect();
      if (initial && lanes && lanes.height && lanes.top > 12 && !filling()) {
        window.scrollBy({ top: lanes.top - 8, behavior: 'instant' });
        lanes = root.querySelector('.pie-screen')?.getBoundingClientRect();
      }
      const keep = lanes && lanes.height ? Math.max(0, lanes.top) + lanes.height * 0.42 : vh * 0.38;
      style.width = 'auto';
      if (!setupOut.dataset.customHeight || initial) {
        style.height = `${Math.round(Math.max(vh * 0.42, Math.min(vh * 0.62, vh - keep)))}px`;
      }
      style.top = 'auto';
      style.bottom = '0px';
      style.left = '0px';
      style.right = '0px';
    }
    requestAnimationFrame(() => requestAnimationFrame(paintSetupMap));
  };
  const closeSetup = () => {
    if (!setupOut || setupOut.hidden) return;
    if (setupOut.matches(':popover-open')) setupOut.hidePopover();
    setupOut.hidden = true;
    delete setupOut.dataset.customHeight;
    setupBtn?.setAttribute('aria-expanded', 'false');
  };
  setupBtn?.addEventListener('click', () => {
    const open = setupOut.hidden;
    if (!open) { closeSetup(); return; }
    setupOut.hidden = false;
    setupOut.showPopover?.();
    setupBtn.setAttribute('aria-expanded', 'true');
    paintSetup();
    placeSetup({ initial: true });
    setupOut.querySelector('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
  });
  document.addEventListener('pointerdown', (event) => {
    if (setupOut && !setupOut.hidden && !setupOut.contains(event.target) && !setupBtn?.contains(event.target)) closeSetup();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && setupOut && !setupOut.hidden) { event.stopImmediatePropagation(); closeSetup(); setupBtn?.focus({ preventScroll: true }); }
  }, true);

  const pinchKeyFor = (target) => {
    if (!target?.closest || target.closest('canvas, .pie-thumbs, .pie-steps, button, a, input, textarea')) return null;
    if (target.closest('.pie-flow-prose')) return 'flowSize';
    if (target.closest('.pie-cabinet')) return 'size';
    return null;
  };
  const fingers = new Map();
  let handPinch = null;
  const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  cabinetVoyage?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (fingers.size === 2 && !handPinch) {
      const key = pinchKeyFor(event.target);
      if (key) handPinch = { key, d0: spread(), s0: Number(setting(key)) || 1 };
    }
  });
  cabinetVoyage?.addEventListener('pointermove', (event) => {
    if (!fingers.has(event.pointerId)) return;
    fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (handPinch && fingers.size === 2) setScaled(handPinch.key, handPinch.s0 * (spread() / handPinch.d0), false);
  });
  const fingerUp = (event) => {
    fingers.delete(event.pointerId);
    if (handPinch && fingers.size < 2) { setScaled(handPinch.key, Number(record.view[handPinch.key]) || 1, true); say(handPinch.key === 'size' ? 'Cabinet resized.' : 'Story words resized.'); handPinch = null; }
  };
  cabinetVoyage?.addEventListener('pointerup', fingerUp);
  cabinetVoyage?.addEventListener('pointercancel', fingerUp);
  cabinetVoyage?.addEventListener('touchmove', (event) => { if (handPinch && event.touches.length >= 2 && event.cancelable) event.preventDefault(); }, { passive: false });
  let safariHand = null;
  cabinetVoyage?.addEventListener('gesturestart', (event) => { const key = pinchKeyFor(event.target); if (!key) return; event.preventDefault(); safariHand = { key, s0: Number(setting(key)) || 1 }; }, { passive: false });
  cabinetVoyage?.addEventListener('gesturechange', (event) => { if (!safariHand) return; event.preventDefault(); setScaled(safariHand.key, safariHand.s0 * (Number(event.scale) || 1), false); }, { passive: false });
  cabinetVoyage?.addEventListener('gestureend', (event) => { if (!safariHand) return; event.preventDefault(); setScaled(safariHand.key, Number(record.view[safariHand.key]) || 1, true); safariHand = null; }, { passive: false });
  cabinetVoyage?.addEventListener('wheel', (event) => {
    if (!event.ctrlKey || event.deltaMode !== 0) return;
    const key = pinchKeyFor(event.target);
    if (!key) return;
    event.preventDefault();
    setScaled(key, (Number(setting(key)) || 1) * (1 - clamp(event.deltaY, -40, 40) * 0.004), true);
  }, { passive: false });

  return {
    cabinetVoyage,
    setupOut,
    screenBox,
    setting,
    filling,
    holdNow,
    syncConductorSwing,
    applySetup,
    paintSetup,
    placeSetup,
    closeSetup,
    fitCabinet
  };
}
