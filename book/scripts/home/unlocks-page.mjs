/**
 * unlocks-page.mjs — the unlock pages (pie/unlocks/, written by build-unlocks.mjs) say where this reader stands.
 *
 * Every [data-unlock="id"] gets its standing in words, the counts of each measure it weighs, and a meter. Visiting a
 * page also keeps any mechanic whose weight is already reached (earn), so an unlock never waits for a carry.
 * Everything here is read from this browser; nothing is sent anywhere.
 */
import { loadMechanics, standing, standingWords, measuresNow, earn } from '../modules/unlocks.mjs?v=2026_11_13.B';
import { syncDerivedSparks, curiosityStanding, bindSiteResonance } from '../modules/intrinsic-rewards.mjs';

async function start() {
  await loadMechanics();
  syncDerivedSparks();
  earn();
  bindSiteResonance({ root: document, context: 'unlocks' });
  const counts = measuresNow();
  document.querySelectorAll('[data-unlock]').forEach((box) => {
    const id = box.dataset.unlock;
    const s = standing(id);
    box.dataset.open = String(s.open);
    box.dataset.why = s.why;
    const words = box.querySelector('[data-unlock-words]');
    if (words) words.textContent = standingWords(id);
    box.querySelectorAll('[data-measure]').forEach((row) => {
      const part = s.parts.find((p) => p.measure === row.dataset.measure);
      const out = row.querySelector('[data-count]');
      if (out) out.textContent = String(counts[row.dataset.measure] ?? 0) + (part?.cap && part.count > part.cap ? ` (counted to ${part.cap})` : '');
    });
    const meter = box.querySelector('[data-unlock-meter]');
    if (meter) meter.style.setProperty('--unlock-fill', String(s.need ? Math.min(1, s.have / s.need) : 1));
  });
  const noteTarget = document.querySelector('[data-unlock-curiosities]') || document.querySelector('main');
  if (noteTarget) {
    const info = curiosityStanding();
    const p = document.createElement('p');
    p.className = 'unlock-curiosity-note';
    p.textContent = `${info.count}/${info.total} curiosity sparks awakened across your reading and play.`;
    noteTarget.append(p);
  }
}

start().catch(() => { /* the pages say everything else without script */ });
