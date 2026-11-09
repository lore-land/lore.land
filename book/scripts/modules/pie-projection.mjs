/**
 * pie-projection.mjs — a chapter, read the way the reader's carry went through it (PLAN.E L28).
 *
 * Carry the pie through a chapter in Exactly One Pie and that chapter keeps a mark
 * (pie-carries.mjs). Here, on the chapter page, the mark is shown and used:
 *
 *   lean   the reading leans a little toward how the carry went — fairy tale, absurd
 *          reality, low magic — through the same paragraph weights as the "Read as"
 *          lens (lens-control.mjs). Never over a lens the reader set themselves, or one
 *          a link gave the visit.
 *   mimes  where Mimes Against WAP hold the chapter, it is harder to wonder about pie:
 *          its pie words go quiet (drawn hollow, as if mimed). A tap peeks at one for a
 *          moment. Carry the pie through again and out-do the mimes to win them back.
 *
 * A note at the top of the chapter says all of this, and why, with a switch to read
 * plainly (it holds for every chapter) and a door back into the carry.
 */

import { carryFor, projectionOn, setProjection, projectedGenre, describeLean, PIE_WORDS } from './pie-carries.mjs?v=2026_11_08.J';
import { applyGenre, readGenre } from './lens-control.mjs?v=2026_11_08.N';
import { readStory } from './story-directions.mjs?v=2026_11_08.N';

const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];

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

/* A lens of the reader's own (the nook), or one this visit was given by a link, comes first. */
function ownLens() {
  try {
    const nook = JSON.parse(window.localStorage.getItem('lore.nook.v1') || '{}') || {};
    if (nook.genre || nook.lens) return true;
  } catch { /* none */ }
  const story = readStory();
  return Boolean(story.genre || story.lens);
}

/* Pie words, hollowed: direct text of the chapter's paragraphs only (never links, slots or marks). */
function mimeWords(main) {
  const spans = [];
  main.querySelectorAll('[data-ebook-section] > p:not(.section-marks)').forEach((p) => {
    const texts = [];
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (parent !== p && !['EM', 'STRONG', 'I', 'B'].includes(parent?.tagName)) continue;
      if (parent?.closest('a, mark, code, .living-slot')) continue;
      if (new RegExp(PIE_WORDS.source, 'i').test(node.nodeValue)) texts.push(node);
    }
    texts.forEach((node) => {
      const parts = node.nodeValue.split(new RegExp(PIE_WORDS.source, 'gi'));
      const frag = document.createDocumentFragment();
      parts.forEach((part, i) => {
        if (i % 2 === 0) {
          if (part) frag.append(part);
          return;
        }
        const span = el('span', { className: 'pie-mimed', title: 'Mimed by Mimes Against WAP. Tap to peek.' }, part);
        span.addEventListener('click', () => {
          span.classList.add('is-peek');
          setTimeout(() => span.classList.remove('is-peek'), 2600);
        });
        spans.push(span);
        frag.append(span);
      });
      node.replaceWith(frag);
    });
  });
  return spans;
}

function unmime(spans) {
  spans.forEach((span) => {
    if (span.isConnected) span.replaceWith(document.createTextNode(span.textContent));
  });
  spans.length = 0;
}

export function initPieProjection({ chapterData } = {}) {
  const main = document.getElementById('chapter-content');
  const n = Number(chapterData?.chapterNumber || document.body.dataset.chapter || 0);
  const entry = n ? carryFor(n) : null;
  if (!main || !entry) return () => {};
  const first = main.querySelector('[data-ebook-section]');
  if (!first) return () => {};

  const held = entry.maw === 'won';
  const mine = ownLens();
  const spans = [];
  let leaned = false;
  const note = el('div', { className: 'pie-carry-note', role: 'note' });

  const apply = () => {
    const on = projectionOn();
    if (on && !mine && !leaned) {
      applyGenre(projectedGenre(entry.lean));
      leaned = true;
    } else if ((!on || mine) && leaned) {
      applyGenre(readGenre());
      leaned = false;
    }
    if (on && held && !spans.length) spans.push(...mimeWords(main));
    if ((!on || !held) && spans.length) unmime(spans);
    paint();
  };

  function paint() {
    const on = projectionOn();
    const times = entry.carried === 1 ? 'once' : `${entry.carried} times`;
    const carry = el('a', { className: 'pie-carry-door', href: `/pie/?chapter=${n}&from=${encodeURIComponent(`${location.pathname}#${first.id || ''}`)}` }, held ? 'Carry it again, and win it back →' : 'Carry it again →');
    const toggle = el('button', { type: 'button', className: 'pie-carry-toggle', 'aria-pressed': on ? 'false' : 'true' }, on ? 'Read plainly' : 'Let my carries lean it');
    toggle.addEventListener('click', () => {
      setProjection(!projectionOn());
      apply();
    });
    const lines = [];
    if (!on) {
      lines.push(`You have carried the pie through Chapter ${WORDS[n] || n} ${times}. Your carries are not leaning the reading.`);
    } else {
      lines.push(mine
        ? `You have carried the pie through Chapter ${WORDS[n] || n} ${times}. Your own lens is set, so the carry does not lean it.`
        : `You have carried the pie through Chapter ${WORDS[n] || n} ${times}, and the carry ${describeLean(entry.lean)}: the paragraphs lean that way a little.${entry.why ? ` (${entry.why}.)` : ''}`);
      if (held) lines.push(`Mimes Against WAP out-did the pie here, so it is harder to wonder about pie: ${spans.length || 'its'} pie word${spans.length === 1 ? ' has' : 's have'} gone quiet. Tap one to peek.`);
      else if (entry.maw === 'back') lines.push('You won this chapter back from the mimes.');
    }
    note.replaceChildren(
      el('span', { className: 'pie-carry-sigil', 'aria-hidden': 'true' }, '◎'),
      el('span', { className: 'pie-carry-text' }, lines.join(' ')),
      el('span', { className: 'pie-carry-actions' }, toggle, ' ', carry)
    );
  }

  first.prepend(note);
  apply();
  return () => {
    unmime(spans);
    if (leaned) applyGenre(readGenre());
    note.remove();
  };
}
