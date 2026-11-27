/**
 * pie/ui/workbench.mjs — Spw power-up bench, scrubbable tuning desk, universal
 * paste router, two-thumb touch pad, view/show/bias/points panels, fullscreen
 * manager, and design-review asset sheet for Exactly One Pie.
 */

const WAYS_OF = Object.freeze({ boon: 'fairy_tale', bane: 'absurd_reality', bone: 'low_magic' });
const SHOW_SAYS = Object.freeze({
  off: 'The show is off.',
  inset: 'The show: a window under the screen keeps the last thing that happened, with what it was worth; between times, the board in small.',
  board: 'The board: every thing in the lanes as a token by what it does, a mark where a hop clears it; the lanes as drawn are in the window under the screen.'
});
const QUIET_FEED = new Set(['ahead', 'furrow', 'boonberry', 'boof', 'boneberry']);
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

/**
 * Initialize workbench panels, paste router, thumbs pad, show/bias/points UI,
 * fullscreen, and asset manifest sheet.
 * @param {object} deps
 */
export function initPieWorkbench({
  root, voyage, record, reduced,
  W, H, LANES, LANE_W, ROWS, AIM_MAX,
  CARDS, KNOCKS, LOW, SLIPS, WIDE, INTRO, SCENES, CHAPTER_SCENE, SCENE_WHIMSY_DEFAULTS,
  POWER_SPELLS, TUNE, TUNE_DEFAULTS, TUNE_RANGE, LEAN_DEFAULTS, LEAN_WORDS, LEAN_ONE, LEAN_GLYPH, LEAN_NAMES, CONTEST,
  TUNING_DOMAINS, DOMAIN_ORDER, VALUE_DEFS, VALUE_IDS, SEASON_SAYS, LEGEND, RECIPES, SPRITES,
  clamp, mix, nodeOf, pct, fmtPts, pad2, chapterWords, laneAt,
  readRules, loadParser, powersInPlay, describePower, readSpells, visitSpells, setVisitSpells, powersLink,
  renderSpell, explainAtom, bookLink, parseTuningDomains, writeTuningDomains,
  allCreatorStyles, parseCreatorStyle, formatCreatorStyle, saveCreatorStyle, setActiveCreatorStyle,
  noteSpark, receiveKept, keptProblems, readSeasons, writeSeasons,
  BIAS_EVENT, setBias, activeBias, biasLayerNote, biasLink, unlockOpen, standing,
  show, skyFor, drawGroundFor, drawSprite, drawRecipeSprite, buildId,
  withCanvasTarget, fresh, makeThing, sceneWhimsy, captionOf,
  getRun, getState, getColors, getBookRules, getVisitRead, getPlay,
  getLeanRules, setLeanRules, getTuningDomains, setTuningDomains,
  getCreatorStyle, setCreatorStyle, getChosenIntention, setChosenIntention,
  getFullOn, setFullOn, getBiasRegisters,
  setting, holdNow, domainTune, writeRecord, readVisit,
  applySetup, paintSetup, placeSetup, getSetupOut,
  paintProvenance, paintNow, start, jump, throwSlice, fit, draw, sfx, say
}) {
  /* ─── Power-up bench ─── */
  const bench = document.querySelector('[data-pie-bench]');
  const benchArea = bench?.querySelector('[data-pie-bench-spells]');
  const benchRead = bench?.querySelector('[data-pie-bench-read]');
  const benchStatus = bench?.querySelector('[data-pie-bench-status]');
  let benchTimer = null;

  async function paintBenchRead() {
    if (!benchRead) return;
    const text = benchArea.value;
    const read = text.trim() ? await readRules(text) : { powers: {}, errors: [], tune: {}, knocks: {}, quirks: [], reader: 'none' };
    if (text !== benchArea.value) return;
    const known = getBookRules()?.powers || powersInPlay().powers;
    const items = Object.values(read.powers).map((power) => {
      const li = nodeOf('li', power.id in known ? '' : 'is-new');
      li.append(nodeOf('code', '', `*${power.id}`), nodeOf('span', '', ` — ${describePower(power)}${power.id in known ? '' : ' (a new name: nothing in the lanes gives it yet)'}`));
      return li;
    });
    Object.entries(read.tune || {}).forEach(([key, value]) => items.push(nodeOf('li', key in TUNE ? '' : 'is-new', `=${key}[${value}]${key in TUNE ? ` — tunes ${key.replace(/_/g, ' ')} (now ${TUNE[key]})` : ' — nothing is tuned by that name'}`)));
    Object.keys(read.knocks || {}).forEach((kind) => items.push(nodeOf('li', KNOCKS[kind] ? '' : 'is-new', `!knocks *${kind} — ${Object.entries(read.knocks[kind]).map(([k, v]) => `${k} ${v}`).join(', ')}`)));
    Object.entries(read.lean || {}).forEach(([event, [cat, w]]) => items.push(nodeOf('li', LEAN_DEFAULTS[event] ? '' : 'is-new', `=lean ${LEAN_NAMES[cat]} %${event}[${w}]${LEAN_DEFAULTS[event] ? ` — ${LEAN_WORDS[event]} lean ${LEAN_NAMES[cat]} by ${w}` : ' — nothing in the lanes is called that'}`)));
    [...read.errors, ...(read.quirks || []).map((q) => `the parser: ${q}`)].forEach((err) => items.push(nodeOf('li', 'is-error', err)));
    if (read.stats) items.push(nodeOf('li', 'is-meta', `read by ${read.reader} in ${read.stats.ms} ms${read.stats.complete ? '' : ' · not whole'}`));
    benchRead.replaceChildren(...items);
  }

  function paintBench() {
    if (!bench) return;
    const list = bench.querySelector('[data-pie-bench-list]');
    const bookRules = getBookRules();
    const play = getPlay();
    const spells = bookRules?.spells && Object.keys(bookRules.spells).length ? bookRules.spells : POWER_SPELLS;
    const own = bookRules?.powers && Object.keys(bookRules.powers).length ? bookRules.powers : readSpells(Object.values(POWER_SPELLS).join('\n')).powers;
    list?.replaceChildren(...Object.entries(spells).map(([id, spell]) => {
      const li = nodeOf('li', play.replaced.includes(id) ? 'is-replaced' : '');
      const code = renderSpell(spell, { explain: explainAtom('power'), link: bookLink, cast: false, play: true, copy: `lore.land/pie#power:${id}` });
      code.classList.add('pie-bench-spell', 'is-compact');
      const what = nodeOf('p', 'pie-bench-what', describePower(own[id]) + (play.replaced.includes(id) ? ' · replaced this visit' : ''));
      const take = nodeOf('button', 'pie-tool', 'Change this');
      take.type = 'button';
      take.addEventListener('click', () => {
        const others = benchArea.value.replace(new RegExp(`\\*${id}\\s*\\{[^{}]*\\}`, 'g'), '').trim();
        benchArea.value = [others, spell].filter(Boolean).join('\n');
        paintBenchRead();
        benchArea.focus();
      });
      li.append(code, what, take);
      return li;
    }) || []);
    if (benchArea && !benchArea.value) benchArea.value = visitSpells();
    paintBenchRead();
  }
  benchArea?.addEventListener('input', () => { clearTimeout(benchTimer); benchTimer = setTimeout(paintBenchRead, 350); });
  bench?.querySelector('[data-pie-bench-apply]')?.addEventListener('click', async () => {
    const read = benchArea.value.trim() ? await readRules(benchArea.value) : null;
    const any = read && (Object.keys(read.powers).length || Object.keys(read.tune).length || Object.keys(read.knocks).length || Object.keys(read.lean || {}).length);
    setVisitSpells(any ? benchArea.value : '');
    await readVisit();
    paintBench();
    const play = getPlay();
    const visitRead = getVisitRead();
    const parts = [
      play.replaced.length && `your spell${play.replaced.length === 1 ? '' : 's'} for ${play.replaced.join(', ')}`,
      Object.keys(visitRead?.tune || {}).length && `your tuning of ${Object.keys(visitRead.tune).join(', ').replace(/_/g, ' ')}`,
      Object.keys(visitRead?.knocks || {}).length && `your knocks for ${Object.keys(visitRead.knocks).join(', ')}`,
      Object.keys(visitRead?.lean || {}).length && `your weighing of ${Object.keys(visitRead.lean).map((e) => e.replace(/_/g, ' ')).join(', ')}`
    ].filter(Boolean);
    benchStatus.textContent = parts.length
      ? `This visit carries with ${parts.join('; ')}.${read?.errors?.length ? ' Some words were not read; see above.' : ''} Your own game is unchanged.`
      : 'Nothing here changes the lanes yet: use a name from the list, =tune{ … }, or !knocks{ … }.';
  });
  bench?.querySelector('[data-pie-bench-link]')?.addEventListener('click', async () => {
    if (!benchArea.value.trim()) { benchStatus.textContent = 'Write or change a spell first.'; return; }
    const link = powersLink(benchArea.value);
    try {
      await navigator.clipboard.writeText(link);
      benchStatus.textContent = 'Copied. Whoever opens it carries with these rules for their visit; their own game stays theirs.';
    } catch { benchStatus.textContent = link; }
  });
  bench?.querySelector('[data-pie-bench-reset]')?.addEventListener('click', async () => {
    setVisitSpells('');
    benchArea.value = '';
    await readVisit();
    paintBench();
    benchStatus.textContent = 'Back to the book’s own rules.';
  });

  /* ─── Tuning desk ─── */
  const desk = document.querySelector('[data-pie-desk]');
  const deskTuneText = () => `=tune{ ${Object.keys(TUNE_DEFAULTS).map((k) => `=${k}[${fmt(TUNE[k])}]`).join(' ')} }`;
  const deskLeanText = () => {
    const table = { ...Object.fromEntries(Object.entries(LEAN_DEFAULTS)), ...getLeanRules() };
    const ways = { boon: [], bane: [], bone: [] };
    Object.entries(table).forEach(([event, [cat, w]]) => ways[cat]?.push(`%${event}[${fmt(w)}]`));
    return `=lean{ ${Object.entries(ways).map(([cat, atoms]) => `&${WAYS_OF[cat]}{ ${atoms.join(' ')} }`).join(' ')} }`;
  };
  const deskScenesText = () => `!scenes{ ${Object.keys(SCENE_WHIMSY_DEFAULTS).map((id) => { const w = sceneWhimsy(id); return `*${id}{ $${w.material || 'ink'} %drama[${fmt(w.drama ?? 1)}] }`; }).join(' ')} }`;
  let activeDomainTab = 'characters';
  const deskDomainText = (domainId = activeDomainTab) => writeTuningDomains({ [domainId]: domainTune(domainId) }, [domainId]);
  let deskTimer = null;
  const keepDesk = (block, text) => {
    clearTimeout(deskTimer);
    deskTimer = setTimeout(async () => {
      const pattern = { tune: /=tune\{[^{}]*\}/g, lean: /=lean\{(?:[^{}]|\{[^{}]*\})*\}/g, scenes: /!scenes\{(?:[^{}]|\{[^{}]*\})*\}/g, tune_domains: /!tune_domains\{(?:[^{}]|\{[^{}]*\})*\}/g }[block];
      const rest = visitSpells().replace(pattern, '').trim();
      setVisitSpells([rest, text].filter(Boolean).join('\n'));
      await readVisit();
      if (benchArea) { benchArea.value = visitSpells(); paintBenchRead(); }
      paintBench();
    }, 400);
  };

  function paintDesk() {
    if (!desk) return;
    const run = getRun();
    const creatorStyle = getCreatorStyle();
    const chosenIntention = getChosenIntention();
    const tune = desk.querySelector('[data-pie-desk-tune]');
    const leanOut = desk.querySelector('[data-pie-desk-lean]');
    const scenes = desk.querySelector('[data-pie-desk-scenes]');
    const domainsOut = desk.querySelector('[data-pie-desk-domains]');
    const focusOut = desk.querySelector('[data-pie-values-focus]');
    const loomOut = desk.querySelector('[data-pie-creator-loom]');
    tune?.replaceChildren(renderSpell(deskTuneText(), {
      cast: false, play: true, copy: 'lore.land/pie#tune', explain: explainAtom('tune'),
      scrub: {
        range: (label) => TUNE_RANGE[label] || [0, 10],
        change: (text, { label, value }) => { if (TUNE_RANGE[label]) TUNE[label] = clamp(value, TUNE_RANGE[label][0], TUNE_RANGE[label][1]); keepDesk('tune', text); }
      }
    }));
    leanOut?.replaceChildren(renderSpell(deskLeanText(), {
      cast: false, play: true, copy: 'lore.land/pie#lean', explain: explainAtom('lean'),
      scrub: {
        range: () => [0, 3],
        change: (text, { label, value }) => {
          const cur = getLeanRules();
          const cat = (cur[label] || LEAN_DEFAULTS[label] || [])[0];
          if (cat) setLeanRules({ ...cur, [label]: [cat, value] });
          keepDesk('lean', text);
          paintPointsRules();
        }
      }
    }));
    scenes?.replaceChildren(renderSpell(deskScenesText(), {
      cast: false, play: true, copy: 'lore.land/pie#scenes', explain: explainAtom('scenes'),
      scrub: { range: () => [0, 3], change: (text) => keepDesk('scenes', text) }
    }));
    if (domainsOut) {
      const tabs = nodeOf('div', 'pie-domain-tabs');
      DOMAIN_ORDER.forEach((id) => {
        const meta = TUNING_DOMAINS[id];
        const btn = nodeOf('button', `pie-domain-tab${activeDomainTab === id ? ' is-active' : ''}`, meta.title);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', activeDomainTab === id ? 'true' : 'false');
        btn.addEventListener('click', () => { activeDomainTab = id; paintDesk(); });
        tabs.append(btn);
      });
      const spell = renderSpell(deskDomainText(activeDomainTab), {
        cast: false, play: true, copy: `lore.land/pie#domain:${activeDomainTab}`,
        scrub: {
          range: (label) => {
            const spec = TUNING_DOMAINS[activeDomainTab]?.dials?.[label];
            return spec ? [spec.min, spec.max] : [0.3, 1.8];
          },
          change: (text) => {
            const parsed = parseTuningDomains(text);
            if (parsed[activeDomainTab]) setTuningDomains({ ...getTuningDomains(), [activeDomainTab]: parsed[activeDomainTab] });
            applySetup({ replan: false });
            keepDesk('tune_domains', writeTuningDomains(getTuningDomains(), Object.keys(getTuningDomains())));
          }
        }
      });
      domainsOut.replaceChildren(nodeOf('p', 'pie-desk-sub', 'Music & aesthetics by domain (characters, scenes, storylines, challenges, minigames, unlocks):'), tabs, spell);
    }
    if (focusOut) {
      const row = nodeOf('div', 'pie-focus-pills');
      [['', 'No preset intention'], ...VALUE_IDS.map((id) => [id, VALUE_DEFS[id].name])].forEach(([id, label]) => {
        const btn = nodeOf('button', `pie-focus-pill${chosenIntention === id ? ' is-active' : ''}`, label);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', chosenIntention === id ? 'true' : 'false');
        btn.title = id ? VALUE_DEFS[id].says : 'Let the carry’s values emerge without focusing one.';
        btn.addEventListener('click', () => {
          setChosenIntention(id);
          const liveRun = getRun();
          if (liveRun?.values) { liveRun.values.intention = id || 'auto'; liveRun.intention = id; }
          paintDesk();
          paintNow();
          say(id ? `Intention set beside the lanes: ${VALUE_DEFS[id].name}.` : 'Carry intention cleared.');
        });
        row.append(btn);
      });
      focusOut.replaceChildren(nodeOf('p', 'pie-desk-sub', 'Play values & intention (guides nuance alongside boon · bane · bone, never locks a lean):'), row);
    }
    if (loomOut) {
      const styles = allCreatorStyles();
      const row = nodeOf('div', 'pie-style-pills');
      styles.forEach((st) => {
        const active = st.handle === creatorStyle.handle;
        const btn = nodeOf('button', `pie-style-pill${active ? ' is-active' : ''}`, `@${st.handle} · ${st.name}`);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.style.setProperty('--style-accent', st.accent);
        btn.addEventListener('click', () => {
          const next = setActiveCreatorStyle(st.handle, { persist: true });
          setCreatorStyle(next);
          if (getRun()) getRun().style = next;
          applySetup({ replan: false });
          sfx('aim', { dir: 1, locked: true });
          paintDesk();
          paintNow();
          say(`Creator style active: ${next.name} (@${next.handle}).`);
        });
        row.append(btn);
      });
      const activeSpell = renderSpell(formatCreatorStyle(creatorStyle), { cast: false, play: true, copy: `lore.land/pie#style:${creatorStyle.handle}` });
      const form = nodeOf('form', 'pie-style-editor');
      const area = document.createElement('textarea');
      area.rows = 3;
      area.className = 'pie-style-input';
      area.value = formatCreatorStyle(creatorStyle);
      area.setAttribute('aria-label', 'Edit or paste a creator @style spell');
      const saveBtn = nodeOf('button', 'pie-tool', 'Apply & keep @style');
      saveBtn.type = 'submit';
      form.append(area, saveBtn);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const parsed = parseCreatorStyle(area.value);
        if (!parsed) { say('That did not read as @style[handle]{ ... }.'); return; }
        saveCreatorStyle(parsed);
        const next = setActiveCreatorStyle(parsed.handle, { persist: true });
        setCreatorStyle(next);
        if (getRun()) getRun().style = next;
        noteSpark('creator_hand', { handle: next.handle });
        applySetup({ replan: false });
        paintDesk();
        paintNow();
        say(`Saved @style[${next.handle}] for your carries.`);
      });
      loomOut.replaceChildren(nodeOf('p', 'pie-desk-sub', 'Resident & peer creator style packs (visual ink, harmonic voicing, & provenance attribution):'), row, activeSpell, form);
    }
  }
  desk?.querySelector('[data-pie-desk-reset]')?.addEventListener('click', async () => {
    setVisitSpells(visitSpells().replace(/=tune\{[^{}]*\}/g, '').replace(/=lean\{(?:[^{}]|\{[^{}]*\})*\}/g, '').replace(/!scenes\{(?:[^{}]|\{[^{}]*\})*\}/g, '').replace(/!tune_domains\{(?:[^{}]|\{[^{}]*\})*\}/g, '').trim());
    setTuningDomains({});
    const house = setActiveCreatorStyle('house', { persist: true });
    setCreatorStyle(house);
    if (getRun()) getRun().style = house;
    await readVisit();
    applySetup({ replan: false });
    paintDesk();
    paintBench();
  });

  /* ─── Paste router ─── */
  const pasteNote = document.querySelector('[data-pie-paste-note]');
  async function pasteSpell(raw, { carriedIn = false } = {}) {
    const from = (/#from\["([^"]*)"\]/.exec(raw) || [])[1] || '';
    const text = raw.replace(/#from\["[^"]*"\]/g, '').trim();
    const say2 = (msg) => { if (pasteNote) pasteNote.textContent = msg; say(msg); };
    const cardKind = (/card:([a-z-]+)/.exec(from) || [])[1] || (Object.keys(CARDS).find((k) => new RegExp(`^@${k.replace(/-/g, '_')}\\{`).test(text)));
    if (/^!tune_domains\{/.test(text)) {
      const parsed = parseTuningDomains(text);
      const next = { ...getTuningDomains(), ...parsed };
      setTuningDomains(next);
      keepDesk('tune_domains', writeTuningDomains(next, Object.keys(next)));
      applySetup({ replan: false });
      paintDesk();
      say2('Tuning domains pasted: characters, scenes, storylines, challenges, minigames, and unlocks retuned for this visit.');
      return;
    }
    if (/^@style\[/.test(text)) {
      const parsed = parseCreatorStyle(text);
      if (parsed) {
        saveCreatorStyle(parsed);
        const next = setActiveCreatorStyle(parsed.handle, { persist: true });
        setCreatorStyle(next);
        if (getRun()) getRun().style = next;
        noteSpark('creator_hand', { handle: next.handle });
        applySetup({ replan: false });
        paintDesk();
        paintNow();
        say2(`Creator style pasted and kept: @${parsed.handle} (${parsed.name}).`);
        return;
      }
    }
    if (/^=meme\b/.test(text) || /^=bane\s+meme\b/.test(text)) {
      const result = setBias(text, { from: 'paste' });
      paintBias();
      say2(result.ok ? `A register, pasted: the lanes answer in it for this visit. ${biasLayerNote(result)}` : `That register spell did not read: ${(result.notes || []).join(' ')}`);
      return;
    }
    if (/^\^kept\[/.test(text)) {
      const got = receiveKept(readSeasons(), text);
      const says = SEASON_SAYS[got.season?.id] || {};
      const parser = await loadParser();
      const problems = parser?.parse && got.state !== 'unread' ? keptProblems(text, parser.parse) : [];
      if (got.state === 'held' && !problems.length && !carriedIn) {
        writeSeasons(got.record);
        paintProvenance();
        document.getElementById('pie-provenance')?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
        say2(says.held || 'A kept line, and you were there. It is kept.');
      } else if ((got.state === 'tease' || got.state === 'held') && !problems.length) {
        const body = document.querySelector('[data-pie-provenance-body]');
        const box = nodeOf('div', 'pie-provenance-card pie-kept-line is-latest');
        box.dataset.pieKeptStands = 'tease';
        box.append(nodeOf('p', 'pie-card-pasted', carriedIn ? 'Carried here in an address, not kept' : 'Pasted here, not kept'), renderSpell(text, { cast: true, play: true, copy: got.state === 'held' ? `lore.land/pie#kept:${got.season.id}` : false }));
        body?.prepend(box);
        box.scrollIntoView({ block: 'center', behavior: reduced?.matches ? 'auto' : 'smooth' });
        say2(got.state === 'held' ? (says.carried || 'A sealed line, carried in an address. Paste it here to keep it.') : (says.tease || 'A line a season left. It answers to whoever was there.'));
      } else if (got.state === 'unread') {
        say2('That reads like a kept line, but the lanes know no season by that name.');
      } else {
        say2(`${says.cracked || 'That kept line does not close.'}${problems.length ? ` (${problems.join('; ')})` : ''}`);
      }
      return;
    }
    if (/^@carry\[/.test(text)) {
      const body = document.querySelector('[data-pie-provenance-body]');
      const box = nodeOf('div', 'pie-provenance-card is-latest');
      box.append(nodeOf('p', 'pie-card-pasted', 'Pasted here, not kept'), renderSpell(text, { cast: true, play: true }));
      body?.prepend(box);
      box.scrollIntoView({ block: 'center', behavior: reduced?.matches ? 'auto' : 'smooth' });
      say2('A carry, pasted: it is shown with the provenance cards (and not kept).');
      return;
    }
    if (/^@reader\{/.test(text)) {
      const n = Number((/\.chapter\[(\d+)\]/.exec(text) || [])[1]) || 1;
      const url = new URL(`/book/chapter/${pad2(n)}/`, location.origin);
      url.searchParams.set('spell', text);
      say2(`A reading of Chapter ${n}, pasted: open ${url.pathname} to read it this way.`);
      if (pasteNote) { const a = nodeOf('a', '', ' Read it this way →'); a.href = url.toString(); pasteNote.append(a); }
      return;
    }
    if (cardKind && CARDS[cardKind] && !/=tune|=lean|!knocks|!whimsy|!scenes/.test(text)) {
      const deck = document.getElementById('pie-deck');
      deck?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
      const face = [...document.querySelectorAll('.pie-cardface')].find((f) => f.querySelector('.pie-cardface-name')?.textContent === CARDS[cardKind].name);
      face?.classList.add('is-flashed');
      setTimeout(() => face?.classList.remove('is-flashed'), 1800);
      say2(`A card, pasted: ${CARDS[cardKind].name}.${face ? '' : ' Not turned in your deck yet.'}`);
      return;
    }
    const read = await readRules(text);
    const any = Object.keys(read.powers).length + Object.keys(read.tune).length + Object.keys(read.knocks).length + Object.keys(read.lean || {}).length + Object.keys(read.whimsy || {}).length + Object.keys(read.scenes || {}).length;
    if (any) {
      if (benchArea) benchArea.value = [benchArea.value.trim(), text].filter(Boolean).join('\n');
      bench?.querySelector('[data-pie-bench-apply]')?.click();
      bench?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
      say2(`Rules, pasted (read by ${read.reader}): they are on the bench and in play for this visit.`);
      return;
    }
    say2('That did not read as a spell the lanes know. Rules, cards, carries and readings can be pasted here.');
  }
  document.addEventListener('paste', (event) => {
    if (event.target.closest?.('input, textarea, [contenteditable]')) return;
    const text = event.clipboardData?.getData('text') || '';
    if (!/[=!*@^%~#$?.&][a-z_]+[[{]/.test(text)) return;
    event.preventDefault();
    pasteSpell(text);
  });

  /* ─── Thumbs pad ─── */
  const thumbs = root.querySelector('[data-pie-thumbs]');
  const padGrid = root.querySelector('[data-pie-pad-grid]');
  const padCells = [];
  if (padGrid) {
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      for (let lane = 0; lane < LANES; lane += 1) {
        const cell = document.createElement('span');
        cell.className = 'pie-pad-cell';
        padGrid.append(cell);
        padCells.push({ cell, lane, row: r });
      }
    }
  }
  const buzz = (ms) => { try { if (!reduced?.matches) navigator.vibrate?.(ms); } catch { /* no buzz here */ } };
  const padAt = (event) => {
    const box = padGrid.getBoundingClientRect();
    const lane = clamp(Math.floor(((event.clientX - box.left) / box.width) * LANES), 0, LANES - 1);
    const row = clamp(ROWS - 1 - Math.floor(((event.clientY - box.top) / box.height) * ROWS), 0, ROWS - 1);
    return { lane, row };
  };
  let padPointer = null;
  const padAim = (event, held) => {
    const state = getState();
    const run = getRun();
    if (state === 'title' || state === 'over') { start(); return; }
    if (state !== 'running' || !run) return;
    const at = padAt(event);
    if (!run.target || run.target.lane !== at.lane || run.target.row !== at.row) buzz(4);
    run.target = { ...at, held };
  };
  padGrid?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    padPointer = event.pointerId;
    try { padGrid.setPointerCapture(event.pointerId); } catch { /* not held */ }
    root.classList.add('is-thumbs');
    padAim(event, true);
  });
  padGrid?.addEventListener('pointermove', (event) => { if (event.pointerId === padPointer) padAim(event, true); });
  const padRelease = (event) => {
    if (event.pointerId !== padPointer) return;
    padPointer = null;
    if (getRun()?.target) getRun().target.held = false;
  };
  padGrid?.addEventListener('pointerup', padRelease);
  padGrid?.addEventListener('pointercancel', padRelease);

  const throwThumb = root.querySelector('[data-pie-thumb-throw]');
  let aimThumb = null;
  throwThumb?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const state = getState();
    const run = getRun();
    if (state === 'title' || state === 'over') { start(); return; }
    if (state !== 'running' || !run) return;
    try { throwThumb.setPointerCapture(event.pointerId); } catch { /* not held */ }
    aimThumb = { id: event.pointerId, x: event.clientX, a: run.aim.a };
    throwThumb.classList.add('is-aiming');
  });
  throwThumb?.addEventListener('pointermove', (event) => {
    const run = getRun();
    if (!aimThumb || event.pointerId !== aimThumb.id || !run) return;
    run.aim.a = clamp(aimThumb.a + ((event.clientX - aimThumb.x) / 110) * AIM_MAX, -AIM_MAX, AIM_MAX);
  });
  const throwRelease = (event) => {
    if (!aimThumb || event.pointerId !== aimThumb.id) return;
    aimThumb = null;
    throwThumb.classList.remove('is-aiming');
    if (event.type === 'pointerup' && getState() === 'running') throwSlice(getRun().aim.a);
  };
  throwThumb?.addEventListener('pointerup', throwRelease);
  throwThumb?.addEventListener('pointercancel', throwRelease);
  root.querySelector('[data-pie-thumb-hop]')?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const state = getState();
    if (state === 'title' || state === 'over') { start(); return; }
    jump();
    buzz(8);
  });
  root.addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch') root.classList.add('is-thumbs'); }, { passive: true });

  let padSeen = '';
  function paintPad() {
    if (!padCells.length || !thumbs || thumbs.offsetParent === null) return;
    const run = getRun();
    const state = getState();
    const danger = new Array(LANES).fill(0);
    if (run && state === 'running') {
      run.things.forEach((t) => {
        if (t.wapped || !t.fatal || t.y > run.y || run.y - t.y > 300) return;
        const near = 1 - (run.y - t.y) / 300;
        if (WIDE.has(t.kind)) { for (let lane = 0; lane < LANES; lane += 1) if (lane !== t.gap) danger[lane] = Math.max(danger[lane], near); }
        else danger[laneAt(t.x)] = Math.max(danger[laneAt(t.x)], near);
      });
    }
    const key = run ? `${run.lane}.${run.row}.${run.target?.lane}.${run.target?.row}.${danger.map((d) => Math.round(d * 4)).join('')}` : '';
    if (key === padSeen) return;
    padSeen = key;
    padCells.forEach(({ cell, lane, row }) => {
      cell.classList.toggle('is-here', Boolean(run) && run.lane === lane && run.row === row);
      cell.classList.toggle('is-target', Boolean(run?.target) && run.target.lane === lane && run.target.row === row);
      cell.style.setProperty('--coming', danger[lane].toFixed(2));
    });
  }
  const handBtn = root.querySelector('[data-pie-hand]');
  const applyHand = () => {
    root.classList.toggle('is-left-handed', record.view.hand === 'left');
    handBtn?.setAttribute('aria-pressed', record.view.hand === 'left' ? 'true' : 'false');
  };
  handBtn?.addEventListener('click', () => {
    record.view.hand = record.view.hand === 'left' ? 'right' : 'left';
    writeRecord(record);
    applyHand();
    say(record.view.hand === 'left' ? 'The pad is under your right thumb now, hop and throw under your left.' : 'The pad is under your left thumb, hop and throw under your right.');
  });
  applyHand();

  /* ─── Story/Zen toggles, Show mode, Bias registers, Points panel ─── */
  const fullBtn = root.querySelector('[data-pie-fullscreen]');
  const isFull = () => Boolean(voyage) && (document.fullscreenElement === voyage || voyage.classList.contains('is-immersive'));
  const paintFull = () => {
    if (!fullBtn) return;
    fullBtn.textContent = isFull() ? '⛶ Leave' : '⛶ Full';
    fullBtn.title = isFull() ? 'Leave fullscreen' : 'Fullscreen';
    fullBtn.setAttribute('aria-pressed', isFull() ? 'true' : 'false');
  };
  const fullChanged = () => {
    setFullOn(isFull());
    paintFull();
    applySetup();
    const setupOut = getSetupOut();
    if (setupOut && !setupOut.hidden) { paintSetup(); requestAnimationFrame(placeSetup); }
  };
  const immersive = (on) => {
    voyage?.classList.toggle('is-immersive', on);
    document.documentElement.classList.toggle('pie-immersive', on);
    fullChanged();
  };
  const turnForHold = () => {
    const want = { one_thumb: 'portrait', two_thumbs: 'landscape' }[holdNow()];
    if (want && setting('fill') === 'fill') { try { window.screen.orientation?.lock?.(want).catch(() => {}); } catch { /* not here */ } }
  };
  function setFull(on) {
    if (!voyage) return;
    if (on) {
      if (document.fullscreenEnabled && voyage.requestFullscreen) voyage.requestFullscreen().then(turnForHold, () => immersive(true));
      else immersive(true);
    } else {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      immersive(false);
    }
  }
  fullBtn?.addEventListener('click', () => setFull(!isFull()));
  document.addEventListener('fullscreenchange', () => {
    voyage?.classList.toggle('is-full', document.fullscreenElement === voyage);
    if (document.fullscreenElement !== voyage) { try { window.screen.orientation?.unlock?.(); } catch { /* not here */ } }
    fullChanged();
  });

  const applyView = () => {
    voyage?.classList.toggle('is-story-off', !record.view.story);
    voyage?.classList.toggle('is-zen', record.view.zen);
    root.querySelectorAll('[data-pie-toggle]').forEach((btn) => {
      const key = btn.dataset.pieToggle;
      const on = Boolean(record.view[key]);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = key === 'story' ? '◫ Story' : '◌ Zen';
      btn.title = key === 'story'
        ? (on ? 'The story flows beside the screen' : 'The story beside the screen is folded away')
        : (on ? 'Zen: nothing pops up, and the screen takes the room' : 'Zen is off');
    });
    requestAnimationFrame(fit);
  };
  root.querySelectorAll('[data-pie-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.pieToggle;
    record.view[key] = !record.view[key];
    writeRecord(record);
    applyView();
    applySetup();
    const setupOut = getSetupOut();
    if (setupOut && !setupOut.hidden) { paintSetup(); requestAnimationFrame(placeSetup); }
    say(key === 'story'
      ? (record.view.story ? 'The story flows beside the screen again, and new cards pause the carry.' : 'The story beside the screen is folded away.')
      : (record.view.zen ? 'Zen: the words fold away and the screen takes their room; nothing pops up or pauses.' : 'Zen is off.'));
    if (key === 'zen' && record.view.zen && !isFull()) root.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
  }));

  const showBtn = root.querySelector('[data-pie-show]');
  const showPanel = document.querySelector('[data-pie-show-panel]');
  function paintShowLegend() {
    const out = document.querySelector('[data-pie-show-legend]');
    if (!out || out.childElementCount) return;
    out.append(...LEGEND.map(([glyph, ink, words]) => {
      const li = nodeOf('li', '');
      const g = nodeOf('b', '', glyph);
      g.style.color = ink;
      li.append(g, ` ${words}`);
      return li;
    }));
  }
  function applyShow() {
    const mode = show.setMode(record.view.show || 'off');
    voyage?.setAttribute('data-show', mode);
    if (showBtn) {
      showBtn.setAttribute('aria-pressed', mode === 'off' ? 'false' : 'true');
      showBtn.textContent = mode === 'board' ? '▣ Board' : mode === 'inset' ? '▣ Show' : '▢ Show';
      showBtn.title = mode === 'off' ? 'The show: what just happened, in a window (V)' : mode === 'inset' ? 'Next: the lanes as a plain board (V)' : 'Next: the show off (V)';
    }
    if (showPanel) showPanel.hidden = mode === 'off';
    paintShowLegend();
    if (getState() !== 'running') draw();
  }
  function cycleShow() {
    const order = ['off', 'inset', 'board'];
    record.view.show = order[(order.indexOf(record.view.show || 'off') + 1) % order.length];
    writeRecord(record);
    applyShow();
    applySetup();
    say(SHOW_SAYS[record.view.show]);
  }
  showBtn?.addEventListener('click', cycleShow);
  function showFeed(entry) {
    if (show.mode === 'off') return;
    if (!entry.placed && (!entry.events.length || entry.events.every((e) => QUIET_FEED.has(e)))) return;
    show.take(entry, captionOf);
  }

  const biasOut = document.querySelector('[data-pie-bias]');
  function castRegisters(ids) {
    let held = '';
    if (ids.length > 1 && !unlockOpen('two_registers')) {
      const s = standing('two_registers');
      held = ` Two registers at once unlocks by weight: ${s.have} of ${s.need} so far (lore.land/pie/unlocks/two-registers/). For now the later one answers alone.`;
      ids = ids.slice(-1);
    }
    const result = setBias(ids.length ? ids.map((id) => `=meme[${id}]{ }`).join(' ') : null, { from: 'desk' });
    paintBias();
    const biasRegisters = getBiasRegisters();
    say(ids.length ? `${biasLayerNote(result)} The lanes answer in ${ids.map((id) => biasRegisters[id]?.title || id).join(', then ')}, now and then.${held}` : 'Every answer is plain again.');
  }
  function paintBias() {
    if (!biasOut) return;
    const current = activeBias();
    const on = (current?.layers || []).map((l) => l.register);
    const chips = biasOut.querySelector('[data-pie-bias-registers]');
    const biasRegisters = getBiasRegisters();
    chips?.replaceChildren(...Object.entries(biasRegisters).map(([id, reg]) => {
      const b = nodeOf('button', 'pie-bias-chip');
      b.type = 'button';
      b.setAttribute('aria-pressed', on.includes(id) ? 'true' : 'false');
      if (reg.material) b.dataset.material = reg.material;
      b.append(nodeOf('b', '', reg.sigil || '='), ` ${reg.title || id}`);
      b.title = reg.line || '';
      b.addEventListener('click', () => castRegisters(on.includes(id) ? on.filter((x) => x !== id) : [...on, id]));
      return b;
    }));
    const spellBox = biasOut.querySelector('[data-pie-bias-spell]');
    if (spellBox) spellBox.replaceChildren(...(current?.expr ? [renderSpell(current.expr, { cast: false, play: true, copy: 'lore.land/pie#bias', label: 'The register this visit answers in' })] : []));
    const note = biasOut.querySelector('[data-pie-bias-note]');
    if (note) note.textContent = current ? `${biasLayerNote(current)} Pops, captions, the card at the spill and the stills in the show answer this way now and then; the story keeps every word of its own.` : biasLayerNote(null);
    biasOut.classList.toggle('is-combination', Boolean(current?.combination));
  }
  biasOut?.querySelector('[data-pie-bias-off]')?.addEventListener('click', () => castRegisters([]));
  biasOut?.querySelector('[data-pie-bias-link]')?.addEventListener('click', async (event) => {
    const current = activeBias();
    const status = biasOut.querySelector('[data-pie-bias-note]');
    if (!current) { status.textContent = 'Choose a register first.'; return; }
    try {
      await navigator.clipboard.writeText(biasLink(current.expr));
      status.textContent = 'Copied: whoever opens it hears the lanes answer in this register, for their visit.';
    } catch { status.textContent = biasLink(current.expr); }
    event.target.blur();
  });
  window.addEventListener(BIAS_EVENT, () => paintBias());

  const pointsOut = document.querySelector('[data-pie-points]');
  let pointsTimer = 0;
  function paintPointsSoon() {
    if (!pointsOut || pointsTimer) return;
    pointsTimer = setTimeout(() => { pointsTimer = 0; paintPoints(); }, 250);
  }
  function paintPoints() {
    if (!pointsOut) return;
    const run = getRun();
    const sum = pointsOut.querySelector('[data-pie-points-sum]');
    const list = pointsOut.querySelector('[data-pie-points-feed]');
    const t = run?.tally;
    if (sum) {
      sum.replaceChildren();
      if (!t) sum.textContent = 'Nothing yet. Play, and every point is said here as it comes, with why.';
      else {
        sum.append(`${chapterWords(run.chapter)} so far: `);
        ['boon', 'bane', 'bone'].forEach((cat, i) => {
          const b = nodeOf('b', `pie-points-cat is-${cat}`, `${LEAN_GLYPH[cat]} ${fmtPts(t[cat])} ${LEAN_NAMES[cat]}`);
          sum.append(i ? ' · ' : '', b);
        });
        if (t.mawSeen) sum.append(` · pie ${fmtPts(t.wap)}, mimes ${fmtPts(t.maw)}${t.held ? ' (the mimes hold this chapter: out-do them to win it back)' : ''}`);
        sum.append('.');
      }
    }
    if (list) {
      const recent = [];
      (run?.feed || []).filter((e) => Object.keys(e.parts).length || Object.keys(e.contest).length).slice(-24).reverse().forEach((e) => {
        const prev = recent[recent.length - 1];
        const key = e.words.join('+');
        if (prev && prev.key === key) {
          prev.times += 1;
          Object.entries(e.parts).forEach(([k, v]) => { prev.entry.parts[k] = (prev.entry.parts[k] || 0) + v; });
          Object.entries(e.contest).forEach(([k, v]) => { prev.entry.contest[k] = (prev.entry.contest[k] || 0) + v; });
        } else if (recent.length < 8) recent.push({ key, times: 1, entry: { ...e, parts: { ...e.parts }, contest: { ...e.contest } } });
      });
      list.replaceChildren(...recent.map(({ entry, times }) => {
        const cap = captionOf(entry);
        const li = nodeOf('li', '');
        li.append(nodeOf('span', 'pie-points-words', `${cap.words}${times > 1 ? ` ×${times}` : ''}`));
        cap.chips.forEach((chip) => li.append(' ', nodeOf('b', `pie-points-chip is-${chip.cat}`, chip.text)));
        return li;
      }));
    }
  }
  function paintPointsRules() {
    const body = document.querySelector('[data-pie-points-rules-body]');
    if (!body) return;
    const leanRules = getLeanRules();
    const events = [...new Set([...Object.keys(LEAN_DEFAULTS), ...Object.keys(leanRules)])];
    const cols = ['boon', 'bane', 'bone'].map((cat) => {
      const col = nodeOf('div', `pie-points-col is-${cat}`);
      col.append(nodeOf('p', 'pie-points-col-head', `${LEAN_GLYPH[cat]} ${LEAN_NAMES[cat]}`));
      const ul = nodeOf('ul', '');
      events
        .map((event) => [event, leanRules[event] || LEAN_DEFAULTS[event]])
        .filter(([, rule]) => rule && rule[0] === cat)
        .sort((a, b) => b[1][1] - a[1][1])
        .forEach(([event, [, w]]) => {
          const tuned = leanRules[event] && LEAN_DEFAULTS[event] && leanRules[event][1] !== LEAN_DEFAULTS[event][1];
          const li = nodeOf('li', tuned ? 'is-tuned' : '');
          li.append(nodeOf('span', '', LEAN_ONE[event] || LEAN_WORDS[event] || event), nodeOf('b', '', `+${fmtPts(w)}`));
          ul.append(li);
        });
      col.append(ul);
      return col;
    });
    const contest = nodeOf('div', 'pie-points-contest');
    contest.append(nodeOf('p', 'pie-points-col-head', 'Pie against Mimes Against WAP'));
    [['wap', 'For the pie'], ['maw', 'For the mimes']].forEach(([side, head]) => {
      const p = nodeOf('p', `pie-points-side is-${side}`);
      p.append(nodeOf('b', '', `${head}: `), CONTEST[side].map(([, w, words]) => `${words} +${fmtPts(w)}`).join(' · '), '.');
      contest.append(p);
    });
    contest.append(nodeOf('p', 'pie-points-side', 'A chapter the mimes hold starts them two ahead. Finish a chapter with the mimes ahead and they hold it; ahead of them, and it comes back.'));
    const more = nodeOf('ul', 'pie-points-more');
    [
      'Each of the three ways leans this chapter’s reading on its page: the sums are not a score, they are how the chapter will be kept.',
      'A Perfect slice fills a clown’s appetite twice over; a whole slice a pip, short of crust or filling half.',
      `Further up the lanes, the cobbles count for more: ×(1 + rows ahead × ${TUNE.ahead_bonus}), and a while ahead leans low magic.`,
      'Two WAPs close together steady the pie; from three in a row, the next slice is ready at once.',
      'The land answers in kind: the more a chapter has leaned one way, the more of that way’s own things come up the lanes.'
    ].forEach((line) => more.append(nodeOf('li', '', line)));
    const tune = nodeOf('p', 'pie-points-tune');
    const a = nodeOf('a', '', 'the tuning desk');
    a.href = '#pie-powers';
    tune.append('Every weight above is a dial: =lean on ', a, ' changes it for your visit, and what you tune is marked here.');
    body.replaceChildren(nodeOf('div', 'pie-points-cols'), contest, more, tune);
    body.firstChild.append(...cols);
  }
  requestAnimationFrame(() => { applyShow(); paintPointsRules(); paintPoints(); });

  /* ─── Design-review asset sheet ─── */
  const assetsOut = document.querySelector('[data-pie-assets]');
  function drawBackdrop(target, sceneId, width = 168) {
    const height = Math.round((width * H) / W);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    target.width = width * ratio;
    target.height = height * ratio;
    const c = target.getContext('2d');
    const colors = getColors();
    withCanvasTarget(c, null, 'title', () => {
      c.setTransform((ratio * width) / W, 0, 0, (ratio * height) / H, 0, 0);
      const s = SCENES.find((entry) => entry.id === sceneId) || SCENES[2];
      const [top, bottom] = skyFor(s);
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, top);
      sky.addColorStop(1, bottom);
      c.fillStyle = sky;
      c.fillRect(0, 0, W, H);
      drawGroundFor(sceneId, 0, 1);
      c.strokeStyle = mix(colors.muted, colors.paper, 0.6);
      c.setLineDash([6, 10]);
      for (let lane = 1; lane < LANES; lane += 1) { c.beginPath(); c.moveTo(lane * LANE_W, 0); c.lineTo(lane * LANE_W, H); c.stroke(); }
      c.setLineDash([]);
    });
  }
  function assetManifest() {
    let manifest = null;
    const tempRun = fresh();
    withCanvasTarget(null, tempRun, null, () => {
      const sprites = Object.keys(SPRITES).map((kind) => {
        const t = makeThing(kind, 2);
        return {
          id: kind,
          hitbox: { w: WIDE.has(kind) ? W : t.w, h: t.h },
          knocks: Boolean(KNOCKS[kind]),
          tilt: KNOCKS[kind]?.tilt ?? null,
          low: LOW.has(kind),
          slip: SLIPS.has(kind),
          wide: WIDE.has(kind),
          from_chapter: INTRO[kind] || 1,
          scenes: SCENES.filter((s) => s.kinds.includes(kind) || (s.low || []).includes(kind)).map((s) => s.id),
          card: CARDS[kind] ? CARDS[kind].name : null
        };
      });
      manifest = {
        manifest: 'exactly-one-pie/assets',
        build: buildId,
        canvas: { width: W, height: H, lanes: LANES, rows: ROWS, lane_width: LANE_W },
        palette_tokens: ['--hub-paper', '--hub-paper-deep', '--hub-ink', '--hub-muted', '--hub-accent', '--hub-gold', '--hub-hearth', '--hub-berry', '--hub-night'],
        scenes: SCENES.map((s) => ({ id: s.id, card: s.card, tint: s.tint, rain: Boolean(s.rain), kinds: s.kinds, low: s.low || ['puddle'], presence: s.presence || null, chapters: Object.entries(CHAPTER_SCENE).filter(([, id]) => id === s.id).map(([n]) => Number(n)) })),
        sprites,
        recipes: Object.values(RECIPES),
        figures: ['carrier-figure', 'carrier-porter', 'carrier-clerk', 'carrier-genie', 'carrier-clown', 'boon', 'bane', 'boof'],
        to_add_a_level: [
          'a scene: id, card line, tint (a --hub-* mix), rain or not',
          'a ground: drawGroundFor(scene) — the ground pattern under the lanes, drawn at any scroll',
          'kinds: which sprites come up the lanes there (and low things for the ground)',
          'a presence lean (boon or bane) if the place belongs to one of the pies',
          'chapters: CHAPTER_SCENE, or a door (pie-segues.mjs) and a passage cue',
          'a card for anything new (pie-cards.mjs): story, lanes in exact numbers, first chapter'
        ]
      };
    });
    return manifest;
  }
  function paintAssets() {
    if (!assetsOut || assetsOut.dataset.painted) return;
    assetsOut.dataset.painted = 'yes';
    const body = assetsOut.querySelector('[data-pie-assets-body]');
    if (!body) return;
    const manifest = assetManifest();
    const grounds = nodeOf('ul', 'pie-assets-grounds');
    manifest.scenes.forEach((scene) => {
      const li = nodeOf('li', 'pie-asset');
      const cv = document.createElement('canvas');
      cv.className = 'pie-asset-ground';
      cv.setAttribute('aria-hidden', 'true');
      drawBackdrop(cv, scene.id);
      li.append(cv, nodeOf('strong', '', scene.id), nodeOf('span', 'pie-asset-line', scene.card),
        nodeOf('span', 'pie-asset-meta', `tint ${scene.tint}${scene.rain ? ' · rain' : ''}${scene.presence ? ` · leans ${scene.presence}` : ''} · chapters ${scene.chapters.join(', ') || '—'}`),
        nodeOf('span', 'pie-asset-meta', `up the lanes: ${scene.kinds.join(', ')} · underfoot: ${scene.low.join(', ')}`));
      grounds.append(li);
    });
    const sprites = nodeOf('ul', 'pie-assets-sprites');
    [...manifest.figures.map((id) => ({ id, figure: true })), ...manifest.sprites].forEach((sp) => {
      const li = nodeOf('li', 'pie-asset');
      const cv = document.createElement('canvas');
      cv.className = 'pie-asset-sprite';
      cv.setAttribute('aria-hidden', 'true');
      drawSprite(cv, sp.id, 64);
      const meta = sp.figure
        ? 'figure (drawn by drawFigure / drawBoonWAP / drawBaneWAP / drawBoof)'
        : [`hitbox ${sp.hitbox.w}×${sp.hitbox.h}`, sp.knocks ? `knocks +${pct(sp.tilt)}` : null, sp.low ? 'low' : null, sp.slip ? 'slip' : null, sp.wide ? 'wide row' : null, `from ch ${sp.from_chapter}`, sp.scenes.length ? `in ${sp.scenes.join(', ')}` : 'spawned by rule'].filter(Boolean).join(' · ');
      li.append(cv, nodeOf('strong', '', sp.id), nodeOf('span', 'pie-asset-meta', meta));
      sprites.append(li);
    });
    const recipes = nodeOf('ul', 'pie-assets-recipes');
    manifest.recipes.forEach((rec) => {
      const li = nodeOf('li', 'pie-asset');
      const cv = document.createElement('canvas');
      cv.className = 'pie-asset-sprite';
      cv.setAttribute('aria-hidden', 'true');
      drawRecipeSprite(cv, rec.id, 64);
      li.append(cv, nodeOf('strong', '', rec.name), nodeOf('span', 'pie-asset-line', rec.formula), nodeOf('span', 'pie-asset-meta', rec.summary));
      recipes.append(li);
    });
    const copy = nodeOf('button', 'pie-deck-copy', 'Copy the level manifest (JSON)');
    copy.type = 'button';
    const status = nodeOf('p', 'pie-deck-status');
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(manifest, null, 2)); status.textContent = 'Copied: scenes, sprites, recipes, hitboxes, flags, palette tokens, and what a new level needs.'; } catch { status.textContent = JSON.stringify(manifest); }
    });
    const steps = nodeOf('ol', 'pie-assets-steps');
    manifest.to_add_a_level.forEach((line) => steps.append(nodeOf('li', '', line)));
    body.replaceChildren(
      nodeOf('h3', '', 'Backgrounds: one ground and light for each place'), grounds,
      nodeOf('h3', '', 'Recipes: crust, berries & tilt'), recipes,
      nodeOf('h3', '', 'Sprites: everyone and everything in the lanes'), sprites,
      nodeOf('h3', '', 'To add a level, or reskin one'), steps,
      nodeOf('p', 'pie-deck-actions'), status
    );
    body.querySelector('.pie-deck-actions').append(copy);
  }
  assetsOut?.addEventListener('toggle', () => { if (assetsOut.open) paintAssets(); });

  return {
    paintBenchRead,
    paintBench,
    paintDesk,
    pasteSpell,
    paintPad,
    applyView,
    applyShow,
    cycleShow,
    showFeed,
    paintBias,
    paintPointsSoon,
    paintPoints,
    paintPointsRules,
    isFull,
    paintFull,
    setFull,
    drawBackdrop,
    assetManifest,
    paintAssets
  };
}
