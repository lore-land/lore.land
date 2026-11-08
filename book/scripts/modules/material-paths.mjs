/**
 * material-paths.mjs — follow what a chapter is made of (materials.mjs).
 *
 * At the end of a chapter, after "Wander off the page", the chapter offers the
 * materials it is most made of — Bonk glass, flour, berries, frost, ink, brass,
 * warmth, oak — each as a door to the next chapter where that material comes
 * back strongest (to the very chamber), and a way back to where it was last.
 * A reader can cross the book by what things are made of instead of by number.
 *
 * Reads semantic.json `materials` (build-chapters.mjs). Each door wears its
 * material through components/materials.css tokens (data-material).
 */

import { semanticIndex } from './constellation.mjs?v=2026_11_08.J';

const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];
const pad = (n) => String(n).padStart(2, '0');
const STRONG = 3;   // hits for a chapter to count as made of it

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  });
  children.flat().forEach((child) => { if (child != null && child !== false) node.append(child); });
  return node;
}

/** The materials this chapter is most made of, with where each goes next and came from. */
export function materialPaths(index, n, limit = 3) {
  const materials = index?.materials || {};
  return Object.entries(materials)
    .map(([id, m]) => {
      const here = m.chapters[String(n)];
      if (!here || here.n < STRONG) return null;
      // Weight by how much more of it is here than this material usually has.
      const all = Object.values(m.chapters).map((c) => c.n);
      const mean = all.reduce((a, b) => a + b, 0) / Math.max(1, all.length);
      const strong = Object.entries(m.chapters).filter(([, c]) => c.n >= STRONG).map(([k, c]) => ({ ...c, hits: c.n, n: Number(k) })).sort((a, b) => a.n - b.n);
      return {
        id,
        ...m,
        here,
        weight: here.n / Math.max(1, mean),
        next: strong.find((c) => c.n > n) || null,
        prev: [...strong].reverse().find((c) => c.n < n) || null
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

export async function initMaterialPaths({ chapterData } = {}) {
  const main = document.getElementById('chapter-content') || document.querySelector('main.chapter');
  const n = Number(chapterData?.chapterNumber || document.body.dataset.chapter || 0);
  if (!main || !n) return () => {};
  const index = await semanticIndex().catch(() => null);
  const paths = materialPaths(index, n);
  if (!paths.length) return () => {};
  const nav = el('nav', { className: 'material-paths', 'aria-label': 'Follow what this chapter is made of' },
    el('p', { className: 'material-paths-label' }, 'Follow what this chapter is made of'),
    el('ul', { className: 'material-paths-list' },
      ...paths.map((path) => el('li', { className: 'material-path mat-card', 'data-material': path.id },
        el('span', { className: 'material-path-sigil', 'aria-hidden': 'true' }, path.sigil),
        el('span', { className: 'material-path-name' }, path.label),
        el('span', { className: 'material-path-gloss' }, path.gloss),
        el('span', { className: 'material-path-doors' },
          path.prev ? el('a', { className: 'material-path-door is-back', href: `/book/chapter/${pad(path.prev.n)}/#${path.prev.id}`, title: path.prev.label }, `← back to Chapter ${WORDS[path.prev.n] || path.prev.n}`) : null,
          path.next
            ? el('a', { className: 'material-path-door', href: `/book/chapter/${pad(path.next.n)}/#${path.next.id}`, title: path.next.label }, `${path.verb} → Chapter ${WORDS[path.next.n] || path.next.n}`)
            : el('span', { className: 'material-path-door is-last' }, 'It does not come back, yet.')))))
  );
  const rail = main.querySelector(':scope > .chapter-route-rail');
  if (rail) rail.after(nav);
  else main.append(nav);
  return () => nav.remove();
}
