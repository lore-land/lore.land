/**
 * References — the tale pointing at other rooms of itself.
 * A paragraph refers. These notes are what it points at.
 * Story still reads without this.
 */

const REFERENCES_URL = '/book/content/world/references.json';

let referencesPromise = null;

function loadReferences() {
  if (!referencesPromise) {
    referencesPromise = fetch(REFERENCES_URL)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return referencesPromise;
}

export function inWhichFor(chapterNumber, refs, data) {
  if (data?.inWhich) {
    return data.inWhich;
  }
  return refs?.inWhich?.[String(chapterNumber)] || '';
}

function normalize(text) {
  return ` ${String(text || '').toLowerCase()} `;
}

function scoreEntry(entry, haystack, chapterNumber) {
  let score = 0;
  for (const term of entry.terms || []) {
    const needle = term.toLowerCase();
    if (!needle) {
      continue;
    }
    if (haystack.includes(` ${needle} `) || haystack.includes(` ${needle}s `)) {
      score += needle.length > 4 ? 2 : 1;
    }
  }
  if (Array.isArray(entry.chambers) && entry.chambers.includes(chapterNumber)) {
    score += 0.35;
  }
  return score;
}

function pickEntries(refs, text, chapterNumber, limit = 3) {
  const haystack = normalize(text);
  const ranked = (refs.entries || [])
    .map((entry) => ({ entry, score: scoreEntry(entry, haystack, chapterNumber) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  const seen = new Set();
  const picked = [];
  for (const row of ranked) {
    if (seen.has(row.entry.id)) {
      continue;
    }
    seen.add(row.entry.id);
    picked.push(row.entry);
    if (picked.length >= limit) {
      break;
    }
  }
  return picked;
}

function paintList(list, entries) {
  list.replaceChildren(
    ...entries.map((entry) => {
      const item = document.createElement('li');
      item.className = 'reading-ref-item';
      item.dataset.kind = entry.kind || 'rumour';
      const kicker = document.createElement('p');
      kicker.className = 'reading-ref-kind';
      kicker.textContent = entry.kind || 'ref';
      const title = document.createElement('a');
      title.className = 'reading-ref-title';
      title.href = entry.href || '#';
      title.textContent = entry.title;
      const note = document.createElement('p');
      note.className = 'reading-ref-note';
      note.textContent = entry.note;
      item.append(kicker, title, note);
      return item;
    })
  );
}

function paintWhisper(entry) {
  const whisper = document.createElement('aside');
  whisper.className = 'reading-ref-whisper';
  whisper.setAttribute('aria-hidden', 'true');
  const kind = document.createElement('p');
  kind.className = 'reading-ref-kind';
  kind.textContent = entry.kind || 'ref';
  const title = document.createElement('p');
  title.className = 'reading-ref-whisper-title';
  title.textContent = entry.title;
  const note = document.createElement('p');
  note.textContent = entry.note;
  whisper.append(kind, title, note);
  return whisper;
}

/**
 * @param {{ chapterData: object }} options
 * @returns {Promise<() => void>}
 */
export async function initReferences(options = {}) {
  const data = options.chapterData;
  const chapterNumber = Number(data?.chapterNumber || 0);
  const main = document.getElementById('chapter-content');
  const aside = document.querySelector('aside');
  if (!chapterNumber || !main || !aside) {
    return () => {};
  }

  const refs = await loadReferences();
  if (!refs) {
    return () => {};
  }

  const inWhich = inWhichFor(chapterNumber, refs, data);
  const heading = main.querySelector('h1');
  if (inWhich && heading && !main.querySelector('.chapter-in-which')) {
    const line = document.createElement('p');
    line.className = 'chapter-in-which';
    line.textContent = `In which ${inWhich}.`;
    heading.insertAdjacentElement('afterend', line);
  }

  let panel = aside.querySelector('.reading-ref');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'reading-ref';
    panel.setAttribute('aria-label', 'References');
    const title = document.createElement('h3');
    title.textContent = 'References';
    const list = document.createElement('ul');
    list.className = 'reading-ref-list';
    const empty = document.createElement('p');
    empty.className = 'reading-ref-empty';
    empty.textContent = 'A paragraph refers when it names something the land already keeps.';
    panel.append(title, list, empty);
    const flow = aside.querySelector('.production-flow');
    aside.insertBefore(panel, flow || aside.querySelector('.additional-links') || null);
  }

  const list = panel.querySelector('.reading-ref-list');
  const empty = panel.querySelector('.reading-ref-empty');
  let whisper = null;
  let lastKey = '';

  const show = (text, anchor) => {
    const entries = pickEntries(refs, text, chapterNumber, 3);
    const key = entries.map((entry) => entry.id).join('|');
    if (key === lastKey) {
      return;
    }
    lastKey = key;
    paintList(list, entries);
    empty.hidden = entries.length > 0;
    panel.dataset.loaded = entries.length ? 'true' : 'false';

    if (whisper) {
      whisper.remove();
      whisper = null;
    }
    if (!entries.length || !anchor || window.matchMedia('(max-width: 70rem)').matches) {
      return;
    }
    whisper = paintWhisper(entries[0]);
    const host = anchor.closest('[data-ebook-section]') || anchor;
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }
    host.appendChild(whisper);
  };

  const paragraphs = [...main.querySelectorAll('p')].filter(
    (node) => !node.closest('noscript, .chapter-logline, .chapter-epigraph, .chapter-byline, .chapter-in-which, .scene-sketch')
  );

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) {
          return;
        }
        show(visible.target.textContent, visible.target);
      },
      { rootMargin: '-28% 0px -42% 0px', threshold: [0.25, 0.5, 0.8] }
    )
    : null;

  paragraphs.forEach((node) => observer?.observe(node));

  const onSection = (event) => {
    const node = event.detail?.sectionId
      ? document.getElementById(event.detail.sectionId)
      : main.querySelector('.is-ebook-active');
    if (node) {
      show(node.textContent, node.querySelector('p') || node);
    }
  };
  window.addEventListener('lore:ebook-section-change', onSection);

  const opener = main.querySelector('[data-ebook-section]') || main;
  show(opener.textContent, opener.querySelector('p') || opener);

  return () => {
    observer?.disconnect();
    window.removeEventListener('lore:ebook-section-change', onSection);
    whisper?.remove();
  };
}
