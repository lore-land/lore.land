/**
 * line-share.mjs — select a line of the story, get a link to exactly it.
 *
 * Uses URL text fragments (#section:~:text=start,end): the browser that
 * opens the link scrolls to the words and highlights them (styled by
 * ::target-text in chapter/reading.css). Nothing is stored and no server
 * is involved; the link itself is the citation. Where fragments aren't
 * supported, the section anchor still lands the reader in the right room.
 */

const PROSE_SELECTOR = 'main.chapter [data-ebook-section] p, main.chapter .voice-pull';
const WORDS_EXACT = 8;
const WORDS_EDGE = 4;

/** Text-fragment encoding: encodeURIComponent plus the directive's own delimiters. */
function encodeFragmentText(text) {
  return encodeURIComponent(text).replace(/-/g, '%2D').replace(/,/g, '%2C').replace(/&/g, '%26');
}

function normalizeWords(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}

export function textFragmentFor(text) {
  const words = normalizeWords(text);
  if (!words.length) {
    return '';
  }
  if (words.length <= WORDS_EXACT) {
    return `text=${encodeFragmentText(words.join(' '))}`;
  }
  const start = words.slice(0, WORDS_EDGE).join(' ');
  const end = words.slice(-WORDS_EDGE).join(' ');
  return `text=${encodeFragmentText(start)},${encodeFragmentText(end)}`;
}

function proseHost(node) {
  const element = node?.nodeType === 1 ? node : node?.parentElement;
  return element?.closest(PROSE_SELECTOR) || null;
}

export function initLineShare({ announce } = {}) {
  const main = document.getElementById('chapter-content');
  if (!main || typeof window.getSelection !== 'function') {
    return () => {};
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'line-share';
  button.hidden = true;
  button.textContent = 'Link this line';
  button.setAttribute('aria-label', 'Copy a link to the selected line');
  document.body.append(button);

  let pendingUrl = '';
  let pendingText = '';

  const hide = () => {
    button.hidden = true;
    pendingUrl = '';
  };

  const place = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      hide();
      return;
    }
    const range = selection.getRangeAt(0);
    const startHost = proseHost(range.startContainer);
    const endHost = proseHost(range.endContainer);
    const text = selection.toString();
    if (!startHost || !endHost || normalizeWords(text).length < 2) {
      hide();
      return;
    }
    // Anchor to the section so the link still lands near the words where
    // text fragments are unsupported.
    const section = startHost.closest('[data-ebook-section]');
    const anchor = section?.id ? `#${section.id}` : '#';
    const fragment = textFragmentFor(text);
    pendingUrl = `${window.location.origin}${window.location.pathname}${anchor}:~:${fragment}`;
    pendingText = normalizeWords(text).join(' ');

    const rect = range.getBoundingClientRect();
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    button.hidden = false;
    const width = button.offsetWidth || 120;
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
    // On touch, the OS selection menu sits above the words; go below them.
    const top = coarse ? rect.bottom + 12 : rect.top - (button.offsetHeight || 32) - 8;
    button.style.left = `${Math.round(left)}px`;
    button.style.top = `${Math.round(Math.max(8, top))}px`;
  };

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(place);
  };

  const share = async () => {
    const url = pendingUrl;
    if (!url) {
      return;
    }
    const quote = pendingText.length > 140 ? `${pendingText.slice(0, 137)}…` : pendingText;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: document.title, text: `“${quote}”`, url });
      } else {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Link copied';
        announce?.('Link to the selected line copied.');
        setTimeout(() => {
          button.textContent = 'Link this line';
          hide();
        }, 1400);
        return;
      }
    } catch {
      // Share sheet dismissed or clipboard refused: nothing to undo.
    }
    hide();
  };

  // mousedown would collapse the selection before click fires.
  const keepSelection = (event) => event.preventDefault();
  const onScroll = () => {
    if (!button.hidden) {
      schedule();
    }
  };

  document.addEventListener('selectionchange', schedule);
  window.addEventListener('scroll', onScroll, { passive: true });
  button.addEventListener('pointerdown', keepSelection);
  button.addEventListener('click', share);

  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('selectionchange', schedule);
    window.removeEventListener('scroll', onScroll);
    button.remove();
  };
}
