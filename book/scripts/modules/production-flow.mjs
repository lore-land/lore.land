/**
 * Production flow — harvest → measure → seal → emit.
 *
 * Makes how a chamber is made imaginable, and illustrates a neighboring
 * land's values without naming it: a cell keeps its law, a key only
 * narrows, a turn is admitted or refused, a receipt binds the whole
 * walk. Internals are real (visited sections, hashed root), not staged.
 */

const RECEIPT_KEY = 'lore.chamber.receipts.v1';
const KEY_FILE_KEY = 'lore.chamber.key-file.v1';

export const PRODUCTION_STAGES = Object.freeze([
  {
    id: 'harvest',
    verb: 'Harvest',
    analog: 'cell',
    story: 'A pressure becomes a scene the land can hold.',
    precipitate: 'scene'
  },
  {
    id: 'measure',
    verb: 'Measure',
    analog: 'conservation',
    story: 'Count it so the count can be checked.',
    precipitate: 'measure'
  },
  {
    id: 'seal',
    verb: 'Seal',
    analog: 'key',
    story: 'File a key smaller. Never grow one in secret.',
    precipitate: 'key'
  },
  {
    id: 'emit',
    verb: 'Emit',
    analog: 'receipt',
    story: 'Admit a turn. Leave a slip. Refuse a false one.',
    precipitate: 'receipt'
  }
]);

const EGG_CELLS = Object.freeze({
  1: { reveals: 'heat in a frozen furrow', refuses: "the map's ink", permits: 'being carried' },
  2: { reveals: 'a second egg a beat late', refuses: 'echo as proof', permits: 'the summons' },
  3: { reveals: 'two routes claiming one step', refuses: 'a split turn', permits: 'the seam' },
  4: { reveals: 'the size of a permission', refuses: 'a key grown overnight', permits: 'being uncovered' },
  5: { reveals: 'two slips for one harvest', refuses: 'a false total', permits: 'the crack' },
  6: { reveals: 'light through glass', refuses: 'the pane as flame', permits: 'being shown' },
  7: { reveals: 'fruit in the oath-groove', refuses: 'a copied heat', permits: 'witness' },
  8: { reveals: 'a face the water keeps', refuses: 'theft of the quote', permits: 'being named' },
  9: { reveals: 'the unblown ninth', refuses: 'one keeper of the call', permits: 'the empty place' },
  10: { reveals: 'the hall that holds', refuses: 'plaster stories', permits: 'the crossing' },
  11: { reveals: 'bloom before seed', refuses: 'finishing the paradox', permits: 'arriving late' },
  12: { reveals: 'a seam you can walk', refuses: 'forgetting tributaries', permits: 'riding the current' },
  13: { reveals: 'a door shaped like shell', refuses: 'a sealed last page', permits: 'being left on the desk' }
});

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

async function digestHex(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  }
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function rootFor(chapterId, admitted) {
  return digestHex(JSON.stringify({ chapter: chapterId, admitted }));
}

function chapterRecord(store, chapterId) {
  const current = store[chapterId] || { admitted: [], slips: [], root: '' };
  return {
    admitted: Array.isArray(current.admitted) ? current.admitted : [],
    slips: Array.isArray(current.slips) ? current.slips : [],
    root: String(current.root || '')
  };
}

function stageButton(stage, index) {
  const li = document.createElement('li');
  li.className = 'production-stage';
  li.dataset.stage = stage.id;
  li.dataset.analog = stage.analog;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'production-stage-hit';
  button.dataset.stage = stage.id;
  button.innerHTML =
    `<span class="production-stage-index">${String(index + 1).padStart(2, '0')}</span>` +
    `<span class="production-stage-verb">${stage.verb}</span>` +
    `<span class="production-stage-analog">${stage.analog}</span>` +
    `<span class="production-stage-story">${stage.story}</span>`;

  li.appendChild(button);
  return { li, button };
}

function renderBoard(mount, options) {
  const surface = options.surface || 'monument';
  mount.classList.add('production-flow');
  mount.dataset.flowSurface = surface;

  if (!mount.querySelector('.production-stages')) {
    const list = document.createElement('ol');
    list.className = 'production-stages';
    PRODUCTION_STAGES.forEach((stage, index) => {
      list.appendChild(stageButton(stage, index).li);
    });
    mount.appendChild(list);
  }

  const readout = mount.querySelector('.production-readout') || document.createElement('p');
  readout.className = 'production-readout';
  readout.setAttribute('aria-live', 'polite');
  if (!readout.isConnected) {
    mount.appendChild(readout);
  }

  const setStage = (id) => {
    const stage = PRODUCTION_STAGES.find((item) => item.id === id) || PRODUCTION_STAGES[0];
    mount.dataset.activeStage = stage.id;
    mount.querySelectorAll('.production-stage-hit').forEach((hit) => {
      hit.setAttribute('aria-pressed', hit.dataset.stage === stage.id ? 'true' : 'false');
    });
    readout.textContent = `${stage.verb} falls out as a ${stage.precipitate}. ${stage.story}`;
  };

  mount.addEventListener('click', (event) => {
    const hit = event.target.closest('.production-stage-hit');
    if (!hit) {
      return;
    }
    setStage(hit.dataset.stage);
  });

  setStage(mount.dataset.activeStage || 'harvest');
  return { setStage, readout };
}

function renderKeyFile(mount) {
  const wrap = document.createElement('div');
  wrap.className = 'production-keyfile';

  const stored = Number(readJson(KEY_FILE_KEY, { width: 12 }).width);
  let width = Number.isFinite(stored) ? Math.min(12, Math.max(1, stored)) : 12;

  const label = document.createElement('label');
  label.className = 'production-keyfile-label';
  label.innerHTML = `<span>The key</span><span class="production-keyfile-meta">files smaller · never grows</span>`;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '1';
  input.max = '12';
  input.step = '1';
  input.value = String(width);
  input.setAttribute('aria-valuemin', '1');
  input.setAttribute('aria-valuemax', String(width));
  input.setAttribute('aria-label', 'File the key smaller');

  const bar = document.createElement('div');
  bar.className = 'production-keyfile-bar';
  bar.setAttribute('aria-hidden', 'true');

  const refuse = document.createElement('p');
  refuse.className = 'production-refuse';
  refuse.hidden = true;

  const sync = () => {
    bar.style.setProperty('--key-width', String(width));
    input.max = '12';
    input.setAttribute('aria-valuemax', String(width));
    input.value = String(width);
    writeJson(KEY_FILE_KEY, { width });
  };

  input.addEventListener('input', () => {
    const next = Number(input.value);
    if (next > width) {
      refuse.hidden = false;
      refuse.textContent = 'Refused. A key does not grow in secret.';
      input.value = String(width);
      return;
    }
    refuse.hidden = true;
    width = next;
    sync();
  });

  wrap.append(label, input, bar, refuse);
  mount.appendChild(wrap);
  sync();
}

function renderEggCell(mount, chapterNumber) {
  const cell = EGG_CELLS[chapterNumber];
  if (!cell) {
    return;
  }
  const article = document.createElement('article');
  article.className = 'production-cell';
  article.innerHTML =
    `<p class="production-cell-kicker">The egg · a cell</p>` +
    `<dl>` +
    `<div><dt>reveals</dt><dd>${cell.reveals}</dd></div>` +
    `<div><dt>refuses</dt><dd>${cell.refuses}</dd></div>` +
    `<div><dt>permits</dt><dd>${cell.permits}</dd></div>` +
    `</dl>`;
  mount.appendChild(article);
}

function renderReceipts(mount, chapterData, announce) {
  const chapterId = String(chapterData.chapterNumber).padStart(2, '0');
  const panel = document.createElement('section');
  panel.className = 'production-receipts';
  panel.setAttribute('aria-label', 'Chamber receipts');

  const heading = document.createElement('h3');
  heading.textContent = 'Slips of this walk';

  const list = document.createElement('ol');
  list.className = 'production-receipt-list';

  const meta = document.createElement('p');
  meta.className = 'production-receipt-root';

  const refuseBtn = document.createElement('button');
  refuseBtn.type = 'button';
  refuseBtn.className = 'production-false-slip';
  refuseBtn.textContent = 'Offer a false slip';

  const refuseNote = document.createElement('p');
  refuseNote.className = 'production-refuse';
  refuseNote.hidden = true;

  panel.append(heading, list, meta, refuseBtn, refuseNote);
  mount.appendChild(panel);

  const paint = async () => {
    const store = readJson(RECEIPT_KEY, {});
    const record = chapterRecord(store, chapterId);
    const expected = await rootFor(chapterId, record.admitted);
    list.replaceChildren(
      ...record.slips.map((slip) => {
        const item = document.createElement('li');
        item.textContent = slip.label;
        item.dataset.section = slip.id;
        return item;
      })
    );
    const intact = expected === record.root || record.admitted.length === 0;
    meta.textContent = record.admitted.length
      ? `${record.admitted.length} slip${record.admitted.length === 1 ? '' : 's'} · root ${record.root || '—'} · ${intact ? 'whole' : 'tampered'}`
      : 'No turn admitted yet. Walk a section.';
    panel.dataset.integrity = intact ? 'whole' : 'tampered';
    if (!intact) {
      refuseNote.hidden = false;
      refuseNote.textContent = 'The root no longer recovers every field. Not audited. Refused.';
    }
  };

  const admit = async (detail) => {
    if (!detail?.id) {
      return;
    }
    const store = readJson(RECEIPT_KEY, {});
    const record = chapterRecord(store, chapterId);
    if (record.admitted.includes(detail.id)) {
      await paint();
      return;
    }
    record.admitted.push(detail.id);
    record.slips.push({
      id: detail.id,
      label: detail.label || detail.id,
      at: new Date().toISOString()
    });
    record.root = await rootFor(chapterId, record.admitted);
    store[chapterId] = record;
    writeJson(RECEIPT_KEY, store);
    refuseNote.hidden = true;
    await paint();
  };

  refuseBtn.addEventListener('click', async () => {
    const store = readJson(RECEIPT_KEY, {});
    const record = chapterRecord(store, chapterId);
    const fakeId = `chapter-${chapterId}-section-99`;
    const forged = { ...record, admitted: [...record.admitted, fakeId] };
    const wouldBe = await rootFor(chapterId, forged.admitted);
    refuseNote.hidden = false;
    refuseNote.textContent =
      `Refused. A slip for a room you have not walked cannot bind the walk (would-be root ${wouldBe}).`;
    panel.dataset.integrity = 'refused';
    announce?.('False slip refused. The walk is unchanged.');
    await paint();
  });

  const onAdmit = (event) => {
    const id = event.detail?.sectionId;
    if (!id) {
      return;
    }
    const node = document.getElementById(id);
    admit({
      id,
      label: node?.querySelector('h2, h3')?.textContent?.trim() || id
    });
  };
  window.addEventListener('lore:ebook-section-change', onAdmit);

  paint();

  const current = document.querySelector('main.chapter [data-ebook-section].is-ebook-active');
  if (current) {
    admit({
      id: current.id,
      label: current.querySelector('h2, h3')?.textContent?.trim() || current.id
    });
  }

  return () => window.removeEventListener('lore:ebook-section-change', onAdmit);
}

/**
 * @param {{
 *   surface?: 'home' | 'scriptorium' | 'chapter',
 *   mount?: Element | null,
 *   chapterData?: object,
 *   announce?: (msg: string) => void
 * }} [options]
 * @returns {() => void | null}
 */
export function initProductionFlow(options = {}) {
  const surface = options.surface || document.body?.dataset?.surface || 'monument';
  const chapterData = options.chapterData;
  const announce = options.announce;

  let mount = options.mount || document.getElementById('production-flow');

  if (surface === 'chapter' || chapterData) {
    const aside = document.querySelector('aside');
    if (!aside) {
      return null;
    }
    mount = aside.querySelector('.production-flow') || document.createElement('div');
    mount.id = 'production-flow';
    mount.className = 'production-flow production-flow--rail';
    if (!mount.isConnected) {
      const links = aside.querySelector('.additional-links');
      aside.insertBefore(mount, links || null);
    }
    const title = document.createElement('p');
    title.className = 'production-flow-kicker';
    title.textContent = 'How this chamber is made';
    if (!mount.querySelector('.production-flow-kicker')) {
      mount.appendChild(title);
    }
    renderBoard(mount, { surface: 'chapter' });
    renderEggCell(mount, chapterData.chapterNumber);
    const destroyReceipts = renderReceipts(mount, chapterData, announce);
    renderKeyFile(mount);
    return () => {
      if (destroyReceipts) {
        destroyReceipts();
      }
    };
  }

  if (!mount) {
    return null;
  }

  renderBoard(mount, { surface });
  if (surface === 'scriptorium') {
    renderKeyFile(mount);
  }
  return () => {};
}
