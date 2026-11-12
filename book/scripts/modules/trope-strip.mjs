/**
 * trope-strip.mjs — the tropes a chapter tells, each as far as this reader has come with it (the trope-reveal trial).
 *
 * At the chapter's end, beside the wonders, a quiet row: one chip per trope the chapter tells (tropes.json
 * faces.story.chambers), labelled by the stage reached (trope-reveal.mjs: seed, hint, named, turned, paid). A chip
 * opens to the stage's words, a line on what would deepen it, and its Spw, which shows in Structure mode. Reaching
 * the chapter's end counts as reading its tropes (noteCrossing read), once a chapter a day. Off, nothing is added.
 */
import { readSwitches } from './reading-switches.mjs?v=2026_11_11.A';
import { revealStage, tropeSignals, noteCrossing, loadRhymes, chambersOf } from './trope-reveal.mjs?v=2026_11_11.A';
import { tropeEmblemSVG } from './panel-art.mjs?v=2026_11_11.A';
import { leanScores } from './valence-lens.mjs?v=2026_09_27.A';

const TROPES_URL = '/book/content/world/tropes.json';
/* How a chip is labelled at each stage: the seed is only the prop, the hint asks, the name names, the turn crosses. */
const LABEL = Object.freeze({
  seed: (t) => t.prop || t.name,
  hint: (t) => `${t.prop || t.name}?`,
  named: (t) => t.name,
  turned: (t) => `${t.name} ⇄`,
  paid: (t) => `${t.name} ✓`
});

const el = (tag, attrs = {}, ...kids) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => { if (k === 'className') node.className = v; else if (k === 'text') node.textContent = v; else node.setAttribute(k, String(v)); });
  kids.flat().forEach((kid) => kid != null && node.append(kid));
  return node;
};

const on = () => { try { return readSwitches().values?.['trope-reveal'] === 'on'; } catch { return false; } };

export function initTropeStrip({ chapterData, root = document } = {}) {
  if (!on()) return () => {};
  const n = Number(chapterData?.chapterNumber);
  if (!Number.isFinite(n)) return () => {};
  const colophon = root.querySelector?.('.chapter-colophon') || document.querySelector('.chapter-colophon');
  if (!colophon) return () => {};
  let tropes = [];
  let row = null;
  let open = '';
  let observer = null;

  const paint = () => {
    if (!tropes.length) { row?.remove(); row = null; return; }
    row = row || el('nav', { className: 'chapter-trope-row', 'aria-label': 'Tropes told in this chapter', 'data-component': 'chapter-tropes' });
    const chips = tropes.map((t) => {
      const shown = revealStage(t, tropeSignals(t.id, { trope: t, lean: leanScores(`${t.statement} ${t.faces?.story?.says || ''}`) }));
      const chip = el('button', { type: 'button', className: 'chapter-trope-chip', 'data-stage': shown.stage, 'aria-expanded': String(open === t.id), title: shown.deepen });
      const art = el('span', { className: 'chapter-trope-emblem', 'aria-hidden': 'true' });
      art.innerHTML = tropeEmblemSVG(t.id, { size: 18, sigil: t.sigil, label: '' });
      chip.append(art, el('span', { text: LABEL[shown.stage](t) }));
      chip.addEventListener('click', () => { open = open === t.id ? '' : t.id; paint(); });
      return { chip, shown, t };
    });
    const detail = chips.find((c) => c.t.id === open);
    row.replaceChildren(el('span', { className: 'chapter-threads-label', text: 'Tropes here' }), ...chips.map((c) => c.chip),
      ...(detail ? [el('div', { className: 'chapter-trope-detail', 'data-stage': detail.shown.stage },
        el('p', { className: 'chapter-trope-words', text: detail.shown.words }),
        el('p', { className: 'chapter-trope-deepen', text: detail.shown.deepen }),
        el('code', { className: 'chapter-trope-spw', text: detail.shown.spw }))] : []));
    if (!row.isConnected) {
      const after = colophon.querySelector('.chapter-wonder-row');
      if (after) after.after(row); else colophon.prepend(row);
    }
  };

  // Reaching the chapter's end reads its tropes, once a chapter a day (a reload is not a second reading).
  const reached = () => {
    const key = `lore.tropes.read.${n}.${new Date().toISOString().slice(0, 10)}`;
    try { if (window.sessionStorage.getItem(key)) return; window.sessionStorage.setItem(key, '1'); } catch { /* counted for this view */ }
    tropes.forEach((t) => noteCrossing(t.id, 'read'));
    paint();
  };

  const onTrope = () => paint();
  window.addEventListener('lore:trope', onTrope);
  Promise.all([fetch(TROPES_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null), loadRhymes()]).then(([data]) => {
    tropes = (data?.tropes || []).filter((t) => chambersOf(t).released.includes(n));
    paint();
    const end = document.querySelector('.chapter-end-mark') || colophon;
    if ('IntersectionObserver' in window && end) {
      observer = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { observer?.disconnect(); reached(); } });
      observer.observe(end);
    }
  });
  return () => { observer?.disconnect(); window.removeEventListener('lore:trope', onTrope); row?.remove(); };
}
