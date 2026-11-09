/**
 * unlocks-page.mjs — the unlock pages (pie/unlocks/, written by build-unlocks.mjs) say where this reader stands.
 *
 * Every [data-unlock="id"] gets its standing in words, the counts of each measure it weighs, and a meter. Visiting a
 * page also keeps any mechanic whose weight is already reached (earn), so an unlock never waits for a carry.
 * Everything here is read from this browser; nothing is sent anywhere.
 */
import { loadMechanics, standing, standingWords, measuresNow, earn } from '../modules/unlocks.mjs?v=2026_11_09.L';

async function start() {
  await loadMechanics();
  earn();
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
}

start().catch(() => { /* the pages say everything else without script */ });
