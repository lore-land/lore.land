/**
 * pie-setup-ui.mjs — secondary drawer panels: character portraits & reasons, Spw stress test, and provenance cards.
 * Extracted from pie-game.mjs so UI panel painters stay modular and easy to trace.
 */
import { crossRead, fuzz, stressReport } from './pie-spw.mjs?v=2026_11_08.K';
import { CHARACTERS, MODELS, MOODS, REASONS, WEIGHT, remembers, portraitSVG, charactersSheet, identitySpell as characterSpell } from '../modules/characters.mjs?v=2026_11_11.A';
import { renderSpell } from '../modules/spw-spell.mjs?v=2026_11_12.A';
import { SEASONS, SEASON_SAYS, standing as seasonStanding, letGo as letGoKept } from './pie-seasons.mjs?v=2026_11_12.A';

/**
 * Initialize portraits, Spw stress test, and carry provenance UI panels.
 * @param {object} deps
 */
export function initPieSetupUI({
  nodeOf, explainAtom, readStore, DEEDS_KEY, switchOn,
  getBookRules, seasonsOn, readSeasons, writeSeasons, seasonClock, say
}) {
  /* ─── Portraits, to take anywhere (characters.mjs): copy or download each as a standalone SVG ─── */
  function paintPortraits() {
    const list = document.querySelector('[data-pie-portraits]');
    if (!list) return;
    const copyInto = async (text, button) => {
      const label = button.textContent;
      try { await navigator.clipboard.writeText(text); button.textContent = 'Copied'; } catch { button.textContent = 'Could not copy'; }
      setTimeout(() => { button.textContent = label; }, 1400);
    };
    list.replaceChildren(...Object.entries(CHARACTERS).map(([id, c]) => {
      const li = nodeOf('li', 'pie-portrait');
      const art = nodeOf('span', 'lore-portrait');
      art.innerHTML = portraitSVG(id, { size: 96, standalone: true });
      const copy = nodeOf('button', 'pie-tool', 'Copy SVG');
      copy.type = 'button';
      copy.addEventListener('click', () => copyInto(portraitSVG(id, { size: 512, standalone: true }), copy));
      const save = nodeOf('a', 'pie-tool', 'Download');
      save.download = `lore-land-${id}.svg`;
      save.href = URL.createObjectURL(new Blob([portraitSVG(id, { size: 512, standalone: true })], { type: 'image/svg+xml' }));
      // The model sheet: every mood, what they are like, their knack if the hat settles on them, their colours.
      const model = MODELS[id] || {};
      const moods = nodeOf('span', 'pie-portrait-moods');
      MOODS.forEach((mood) => {
        const m = nodeOf('span', 'pie-portrait-mood');
        m.innerHTML = portraitSVG(id, { size: 40, mood });
        m.title = mood;
        m.append(nodeOf('small', '', mood));
        moods.append(m);
      });
      const traits = nodeOf('span', 'pie-portrait-traits');
      (model.traits || []).forEach((t) => traits.append(nodeOf('span', '', t)));
      /* What they want and cannot do; what they remember of you; why they are drawn this way, folded, off the lanes. */
      const whyOf = (who) => {
        const why = REASONS[who];
        if (!why) return [];
        const memory = remembers(who, readStore(DEEDS_KEY));
        const fold = document.createElement('details');
        fold.className = 'pie-portrait-why';
        fold.append(nodeOf('summary', '', 'Why they are drawn this way'), nodeOf('span', '', why.reason));
        const weight = WEIGHT[who];
        // The weight is the maker's register too: shown only with Reasons on in the switches.
        if (weight && who !== 'figure' && switchOn('reasons')) fold.append(nodeOf('span', 'pie-portrait-weight', `Carries · ${weight.carries} Hands it on · ${weight.hands_on} Eased by · ${weight.eased}`));
        return [nodeOf('span', 'pie-portrait-want', `Wants · ${why.want}`), nodeOf('span', 'pie-portrait-limit', `Cannot · ${why.limit}`),
          ...(memory ? [nodeOf('span', 'pie-portrait-memory', `Remembers · ${memory}`)] : []), fold];
      };
      const swatches = nodeOf('span', 'pie-portrait-swatches');
      Object.entries(c.palette || {}).forEach(([k, v]) => { const sw = nodeOf('i', ''); sw.style.background = v; sw.title = `${k} ${v}`; swatches.append(sw); });
      li.append(art, nodeOf('strong', '', c.name), nodeOf('span', 'pie-portrait-first', c.first ? `first in Chapter ${c.first}` : 'in the lanes'), moods, traits,
        ...(model.temperament ? [nodeOf('span', 'pie-portrait-temperament', model.temperament)] : []),
        ...(model.knack ? [nodeOf('span', 'pie-portrait-knack', `Under the hat · ${model.knack}`)] : []),
        ...whyOf(id),
        swatches, renderSpell(characterSpell(id), { cast: false, copy: `lore.land/characters#${id}` }), nodeOf('span', 'pie-portrait-actions'));
      li.querySelector('.pie-portrait-actions').append(copy, ' ', save);
      return li;
    }));
    document.querySelector('[data-pie-portraits-json]')?.addEventListener('click', (event) => copyInto(JSON.stringify(charactersSheet(), null, 2), event.target));
  }

  /* ─── The stress test: what the game has learned about Spw (pie-spw.mjs) ─── */
  const stressOut = document.querySelector('[data-pie-stress]');
  let stressCross = [];
  let stressFuzz = [];
  function paintStress() {
    const bookRules = getBookRules();
    if (!stressOut || !bookRules) return;
    const s = bookRules.stats;
    const lede = stressOut.querySelector('[data-pie-stress-lede]');
    if (lede) {
      lede.textContent = s
        ? `The rules (${s.bytes} characters of Spw) were read by ${bookRules.reader} in ${s.ms} ms: ${s.complete ? 'whole' : 'not whole'}${s.proseFallback ? ', falling back to prose' : ''}, ${s.errors} error${s.errors === 1 ? '' : 's'}, ${s.warnings} warning${s.warnings === 1 ? '' : 's'}, ${s.gaps} gaps.`
        : `The rules were read by the ${bookRules.reader} reader; the parser could not be loaded here.`;
    }
    const list = stressOut.querySelector('[data-pie-stress-list]');
    const rows = [
      ...(bookRules.quirks || []).map((q) => ['quirk', q]),
      ...stressCross.map((f) => ['cross', f]),
      ...stressFuzz.map((f) => ['fuzz', `${f.name}: ${f.complete ? 'read whole' : f.proseFallback ? 'fell back to prose' : 'not whole'}, ${f.errors} errors, ${f.warnings} warnings, ${f.ms} ms${f.quiet ? ' — reported success anyway' : ''}`])
    ];
    list?.replaceChildren(...(rows.length ? rows : [['ok', 'Nothing odd yet. Cross-read and fuzz to look harder.']]).map(([kind, text]) => {
      const li = nodeOf('li', `is-${kind}`);
      li.append(nodeOf('b', '', kind), nodeOf('span', '', ` ${text}`));
      return li;
    }));
    const report = stressOut.querySelector('[data-pie-stress-report]');
    if (report) {
      report.dataset.text = stressReport({ read: bookRules, crossFindings: stressCross, fuzzed: stressFuzz });
      report.replaceChildren(renderSpell(report.dataset.text, { cast: false }));
    }
  }
  stressOut?.querySelector('[data-pie-stress-cross]')?.addEventListener('click', async (event) => {
    const bookRules = getBookRules();
    if (!bookRules) return;
    event.target.disabled = true;
    stressCross = await crossRead(bookRules);
    if (!stressCross.length) stressCross = ['every power read the same by both readers, and every one survived a round trip'];
    event.target.disabled = false;
    paintStress();
  });
  stressOut?.querySelector('[data-pie-stress-fuzz]')?.addEventListener('click', async (event) => {
    const bookRules = getBookRules();
    if (!bookRules?.source) return;
    event.target.disabled = true;
    stressFuzz = [...stressFuzz, ...(await fuzz(bookRules.source, 8))].slice(-24);
    event.target.disabled = false;
    paintStress();
  });
  stressOut?.querySelector('[data-pie-stress-copy]')?.addEventListener('click', async (event) => {
    const text = stressOut.querySelector('[data-pie-stress-report]')?.dataset.text || '';
    try { await navigator.clipboard.writeText(text); event.target.textContent = 'Copied'; } catch { event.target.textContent = 'Select it and copy'; }
  });

  /* ─── Provenance: each carry written back as a Spw card (kept in this browser, the last five) ─── */
  const PROVENANCE_KEY = 'lore.pie.provenance.v1';
  const readProvenance = () => {
    try { const list = JSON.parse(window.localStorage.getItem(PROVENANCE_KEY) || '[]'); return Array.isArray(list) ? list : []; } catch { return []; }
  };
  function keepProvenance(card) {
    const list = [card, ...readProvenance()].slice(0, 5);
    try { window.localStorage.setItem(PROVENANCE_KEY, JSON.stringify(list)); } catch { /* this visit only */ }
    paintProvenance(list);
  }
  /* A line a season left (pie-seasons.mjs), shown above the carries: sealed, copyable, and the reader's to let go. */
  function keptBoxes() {
    if (!seasonsOn()) return [];
    const mine = readSeasons();
    const now = seasonClock();
    return SEASONS.filter((s) => mine[s.id]?.line).map((s) => {
      const stands = seasonStanding(s, mine, now);
      const words = { open: 'the season is on', kept: 'the place stays set', line: 'it answers to whoever was there' }[stands] || 'kept';
      const box = nodeOf('div', 'pie-provenance-card pie-kept-line');
      box.dataset.pieKept = s.id;
      box.dataset.pieKeptStands = stands;
      const go = nodeOf('button', 'pie-tool', 'Let it go');
      go.type = 'button';
      go.addEventListener('click', () => { writeSeasons(letGoKept(readSeasons(), s.id)); paintProvenance(); say(SEASON_SAYS[s.id]?.gone || 'Let go.'); });
      // The line as an address: whoever opens it is shown the line, and it is kept only by someone who was there.
      const link = nodeOf('button', 'pie-tool', 'Copy as a link');
      link.type = 'button';
      link.addEventListener('click', async () => {
        const url = new URL('/pie/', location.origin);
        url.searchParams.set('kept', mine[s.id].line);
        try { await navigator.clipboard.writeText(url.toString()); link.textContent = 'Link copied'; } catch { link.textContent = 'Copy the line instead'; }
      });
      box.append(nodeOf('p', 'pie-card-pasted', `From ${s.from} · sealed · ${words}`), renderSpell(mine[s.id].line, { cast: true, play: true, copy: `lore.land/pie#kept:${s.id}` }), link, go);
      return box;
    });
  }
  function paintProvenance(list = readProvenance()) {
    const body = document.querySelector('[data-pie-provenance-body]');
    const kept = keptBoxes();
    if (!body) return;
    if (!list.length && !kept.length) {
      // A kept line let go, with no carry yet: back to the empty panel's own words.
      if (body.querySelector('.pie-kept-line')) body.replaceChildren(nodeOf('p', 'pie-carries-lede', 'No carry yet. The first spill writes the first card.'));
      return;
    }
    body.replaceChildren(...kept, ...list.map((card, i) => {
      const box = nodeOf('div', `pie-provenance-card${i ? '' : ' is-latest'}`);
      const pre = renderSpell(card, { explain: explainAtom('carry'), cast: i === 0, play: true, copy: 'lore.land/pie#carry' });
      const copy = nodeOf('button', 'pie-tool', i ? 'Copy' : 'Copy the latest');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(card); copy.textContent = 'Copied'; } catch { copy.textContent = 'Select it and copy'; }
      });
      box.append(pre, copy);
      return box;
    }));
  }

  return { paintPortraits, paintStress, keepProvenance, paintProvenance };
}
