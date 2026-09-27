/**
 * chapter-render.mjs — chapter JSON → prose DOM, one renderer for two hosts.
 *
 * The build (book/scripts/tools/build-chapters.mjs) runs this against a
 * small DOM shim and writes the result into each chapter's HTML, so the
 * story is in the page before any script runs: readable without JS,
 * indexable, reader-mode friendly, and on screen at first paint. The
 * browser runs the same code only as a fallback, when a page arrives
 * without prerendered prose (main.chapter lacks data-prerendered).
 *
 * Keep it host-neutral: create nodes through `doc`, write attributes with
 * setAttribute/dataset/className/textContent, and never read layout,
 * window, or location here.
 */

import {
  applyStoryVoiceAttributes,
  isCustomElementType,
  storyVoiceFor,
  voiceKickerWithMask
} from './story-lexicon.mjs?v=2026_09_26.A';
import { applySectionClimateAttributes } from './copy-climate.mjs?v=2026_08_27.A';
import { LENSES, leanFor } from './valence-lens.mjs?v=2026_09_27.A';

const NUMBER_WORDS = Object.freeze([
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen'
]);

/** Style tail for plate prompts — the series look from the 2026-09-26 studies. */
export const PLATE_PROMPT_STYLE = 'lore.land, teal and amber lit from within, leaf-dark ground, vignette and grain';
export const PLATE_PROMPT_FLAGS = '--raw --stylize 1000 --v 8.2';
const WORDS_PER_MINUTE = 230;

/** Mark kinds rendered as kicker chips, in display order. */
const SECTION_MARK_KINDS = Object.freeze([
  { attribute: 'data-motif', kind: 'motif', description: 'recurring motif' },
  { attribute: 'data-trope', kind: 'trope', description: 'sampled trope' },
  { attribute: 'data-foreshadow', kind: 'foreshadow', description: 'foreshadowing' }
]);

export function padChapterNumber(number) {
  return String(number).padStart(2, '0');
}

/** "Chapter One" for 1–13, "Chapter 14" past the words we carry. */
export function chapterOrdinal(number) {
  const n = Number(number);
  return `Chapter ${NUMBER_WORDS[n] || padChapterNumber(n)}`;
}

/** Stable, human-readable anchor for a titled section: #the-warm-furrow. */
export function sectionSlug(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function blockText(block) {
  if (!block) {
    return '';
  }
  const own = [block.text, block.content && typeof block.content === 'string' ? block.content : '']
    .filter(Boolean).join(' ');
  const children = [...(Array.isArray(block.content) ? block.content : []), ...(block.children || [])]
    .map(blockText).join(' ');
  return `${own} ${children}`;
}

function readMinutes(blocks) {
  const words = (Array.isArray(blocks) ? blocks : [blocks]).map(blockText).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readTimeChip(h, block) {
  return h('span', { className: 'read-time', hidden: '' }, `${readMinutes(block)} min`);
}

function humanizeMarkValue(value) {
  return String(value).split('-').join(' ');
}

/**
 * Renders the chapter's body into `container` (appends; the caller clears):
 * head, prose, end mark, and the turn toward the next chapter.
 * @param {Element} container
 * @param {Object} data - chapter JSON
 * @param {Object} [options]
 * @param {Document} [options.doc] - node factory (a shim under Node)
 * @param {(href: string) => string} [options.withBase] - site-base resolver
 * @param {string} [options.inWhich] - "a dog finds an egg…" (no "In which", no period)
 * @param {{ number: number, title: string, inWhich?: string, href: string, wraps?: boolean }} [options.next]
 * @param {{ entries: Array, search: string }} [options.stacks] - this chapter's shelf list
 */
export function renderChapterBody(container, data, options = {}) {
  const doc = options.doc || container.ownerDocument;
  const withBase = options.withBase || ((href) => href);
  const h = createFactory(doc);
  const usedIds = new Set(['chapter-title', 'chapter-content']);

  container.append(renderHead(h, data, options.inWhich));

  const stamp = `Chamber ${padChapterNumber(data.chapterNumber)} · ${data.title}`;
  (Array.isArray(data.sections) ? data.sections : []).forEach((section) => {
    const node = renderBlock(h, section, { stamp, usedIds });
    if (node) {
      container.append(node);
    }
  });

  container.append(h('p', { className: 'chapter-end-mark', 'aria-hidden': 'true' }, '❦'));

  if (options.next?.href) {
    container.append(renderTurn(h, options.next, withBase));
  }
  if (options.stacks?.entries?.length) {
    container.append(renderStacks(h, options.stacks));
  }
  return container;
}

/**
 * Wander the stacks: the chapter's shelf-mates in any library, by call
 * number, from book/content/world/shelf-list.json. The story's last
 * gesture is outward — into a building full of other stories.
 */
function renderStacks(h, stacks) {
  return h('nav', { className: 'chapter-stacks', id: 'stacks', 'aria-label': 'Wander the stacks', dataset: { component: 'chapter-stacks' } },
    h('p', { className: 'chapter-stacks-kicker' }, 'Wander the stacks'),
    h('p', { className: 'chapter-stacks-lede' }, 'This chapter has shelf-mates in any library. Take a call number into the aisles and see what is standing next to it.'),
    h('ul', { className: 'chapter-stacks-list' }, ...stacks.entries.map((entry) => h('li', { className: 'chapter-stacks-item' },
      h('p', { className: 'chapter-stacks-subject' }, entry.subject),
      h('p', { className: 'chapter-stacks-call' },
        h('abbr', { title: 'Library of Congress classification' }, 'LC'), ` ${entry.lc}`,
        h('span', { className: 'chapter-stacks-sep', 'aria-hidden': 'true' }, ' · '),
        'Dewey ', entry.dewey,
        entry.tale ? h('span', { className: 'chapter-stacks-tale' }, ` · tale type ${entry.tale}`) : null
      ),
      h('p', { className: 'chapter-stacks-wander' }, entry.wander),
      h('a', {
        className: 'chapter-stacks-find',
        href: `${stacks.search}${encodeURIComponent(entry.search || entry.subject)}`,
        rel: 'noopener',
        target: '_blank'
      }, 'Find it in a library near you', h('span', { 'aria-hidden': 'true' }, ' ↗'))
    )))
  );
}

/**
 * Renders what follows the story (and the scribes' slip): threads, byline,
 * and the doors out into the wider land.
 */
export function renderChapterCoda(container, data, options = {}) {
  const doc = options.doc || container.ownerDocument;
  const withBase = options.withBase || ((href) => href);
  const h = createFactory(doc);

  const colophon = renderColophon(h, data, withBase);
  if (colophon) {
    container.append(colophon);
  }
  const prompts = renderPlatePrompts(h, data);
  if (prompts) {
    container.append(prompts);
  }
  const routes = renderRouteRail(h, data, withBase);
  if (routes) {
    container.append(routes);
  }
  return container;
}

/**
 * Suggested image prompts, one per scene plus a room for the nook — an
 * editorial component for scribes and illustrators. Ships hidden; the
 * "prompts" trial switch shows it. Composed from the chapter's own scene
 * hints, so improving a hint improves its prompt.
 */
function renderPlatePrompts(h, data) {
  const scenes = [];
  (data.sections || []).forEach((section, index) => {
    if (section.scene?.hint) {
      scenes.push({ label: section.title || storyVoiceFor(section.type)?.kicker || `Block ${index + 1}`, hint: section.scene.hint });
    }
  });
  if (!scenes.length) {
    return null;
  }
  const first = (data.sections || []).find((section) => section.climate) || {};
  const tempo = first.climate?.tempo || 'dusk';
  const tint = first.climate?.tint || 'amber';
  const rows = [
    ...scenes.map((scene) => ({
      label: `${scene.label} · plate, 40:21`,
      text: `${scene.hint}; ${PLATE_PROMPT_STYLE} --ar 40:21 ${PLATE_PROMPT_FLAGS}`
    })),
    {
      label: `The nook for ${data.title} · room, 9:16`,
      text: `a quiet reading nook for a chapter called "${data.title}", ${tempo} light with a ${tint} cast, shelves of old books, one candle, a small boonberry lantern glowing amber, soft focus, dreamy; ${PLATE_PROMPT_STYLE} --ar 9:16 ${PLATE_PROMPT_FLAGS}`
    }
  ];
  return h('div', { className: 'plate-prompts', role: 'region', 'aria-label': 'Suggested image prompts', hidden: '', dataset: { component: 'plate-prompts' } },
    h('p', { className: 'plate-prompts-kicker' }, 'Plate prompts · for scribes and illustrators'),
    h('p', { className: 'plate-prompts-note' }, 'Composed from this chapter\u2019s scene hints. Improve a hint in the chapter\u2019s canon and its prompt improves with it.'),
    h('ol', { className: 'plate-prompts-list' }, ...rows.map((row) => h('li', {},
      h('p', { className: 'plate-prompt-for' }, row.label),
      h('code', { className: 'plate-prompt-text' }, row.text),
      h('button', { type: 'button', className: 'plate-prompt-copy', dataset: { copyPrompt: 'true' } }, 'Copy')
    )))
  );
}

/* ─── Head: kicker + title, in-which, epigraph. Story first. ─────────── */

function renderHead(h, data, inWhich) {
  const head = h('header', { className: 'chapter-head', dataset: { component: 'chapter-head' } });
  // Returning readers knew the logline above the title; the "logline"
  // switch (reading-switches.mjs) keeps it for them. Hidden otherwise.
  if (data.logline) {
    head.append(h('p', { className: 'chapter-logline', hidden: '' }, data.logline));
  }
  const title = h('h1', { id: 'chapter-title' },
    h('span', { className: 'chapter-kicker' },
      chapterOrdinal(data.chapterNumber),
      h('span', { className: 'sr-only' }, ': ')
    ),
    h('span', { className: 'chapter-title-text' }, data.title)
  );
  head.append(title);

  const line = inWhich || data.inWhich;
  if (line) {
    head.append(h('p', { className: 'chapter-in-which' }, `In which ${line}.`));
  }

  if (data.epigraph) {
    head.append(h('p', { className: 'chapter-epigraph', dataset: { component: 'chapter-epigraph' } }, data.epigraph));
  }
  // Read as boon, bane or bone (lens-control.mjs wakes this; hidden without script).
  head.append(h('div', { className: 'chapter-lens', role: 'group', 'aria-label': 'Read this chapter as', hidden: '' },
    h('span', { className: 'chapter-lens-label' }, 'Read as'),
    h('button', { type: 'button', className: 'chapter-lens-option', dataset: { lens: '' }, 'aria-pressed': 'true' }, 'Balanced'),
    ...LENSES.map((lens) => h('button', {
      type: 'button', className: 'chapter-lens-option', dataset: { lens: lens.id }, 'aria-pressed': 'false', title: lens.question
    }, lens.label)),
    h('p', { className: 'chapter-lens-gloss', 'aria-live': 'polite' }, '')
  ));
  const minutes = readMinutes(data.sections);
  head.append(h('p', { className: 'read-time read-time--chapter', hidden: '' }, `${minutes} min read`));
  return head;
}

/* ─── Flow blocks ─────────────────────────────────────────────────────── */

function renderBlock(h, section, context = {}) {
  if (!section || !section.type) {
    return null;
  }
  switch (section.type) {
    case 'paragraph':
      return renderParagraph(h, section);
    case 'pull':
      return h('blockquote', { className: 'voice-pull', dataset: { component: 'voice-pull' } }, String(section.text || '').trim());
    case 'figure':
      return renderFigure(h, section);
    case 'section':
      return renderSection(h, section, context);
    default:
      if (isCustomElementType(section.type)) {
        return renderVoice(h, section, context);
      }
      return null;
  }
}

function renderParagraph(h, section) {
  const p = h('p');
  // The paragraph's lean (boon / bane / bone) for the reading lens.
  const plain = `${section.text || ''}${(section.children || []).map((child) => child.text || child.content || '').join('')}`;
  const lean = leanFor(plain, section.lean);
  if (lean) {
    p.dataset.lean = lean;
  }
  if (section.text) {
    p.append(section.text);
  }
  if (Array.isArray(section.children)) {
    section.children.forEach((child) => {
      if (isCustomElementType(child.type)) {
        const phrase = h(child.type, {}, child.content);
        applyStoryVoiceAttributes(phrase, child.type, 'phrase');
        p.append(phrase);
      } else if (child.type === 'text') {
        p.append(child.text);
      }
    });
  }
  return p;
}

function renderFigure(h, section) {
  const figure = h('figure', { className: 'chapter-figure' });
  if (section.img) {
    const src = section.img.src;
    if (/\/book\/images\//.test(src)) {
      figure.dataset.visualDefault = 'colloquial';
    }
    const attrs = {
      src,
      alt: section.img.alt || '',
      loading: section.img.loading || 'lazy',
      decoding: 'async'
    };
    if (section.img.width && section.img.height) {
      attrs.width = String(section.img.width);
      attrs.height = String(section.img.height);
    }
    figure.append(h('img', attrs));
  }
  if (section.figcaption) {
    figure.append(h('figcaption', {}, section.figcaption));
  }
  return figure;
}

/**
 * A section's `scene` block as a folded sketch — an invitation to imagine.
 * The structured fields stay machine-readable in #chapter-data for image
 * models; the reader gets vantage / light / scent / edges.
 */
function renderSceneSketch(h, scene) {
  const details = h('details', { className: 'scene-sketch', dataset: { component: 'scene-sketch' } });
  if (scene.hint) {
    details.dataset.sceneHint = scene.hint;
  }
  details.append(h('summary', {}, 'Step into the scene'));
  const body = h('div', { className: 'scene-sketch-body' });
  [['vantage', scene.vantage], ['light', scene.light], ['scent', scene.scent]].forEach(([label, text]) => {
    if (text) {
      body.append(h('p', { className: 'scene-sense' }, h('span', { className: 'scene-sense-label' }, label), ' ', text));
    }
  });
  if (Array.isArray(scene.edges) && scene.edges.length) {
    body.append(h('ul', { className: 'scene-edges' }, ...scene.edges.map((edge) => h('li', {}, edge))));
  }
  details.append(body);
  return details;
}

/** Motif / trope / foreshadow marks as a quiet chip row. */
function renderMarks(h, elem) {
  const marks = SECTION_MARK_KINDS
    .map((meta) => ({ ...meta, value: elem.getAttribute(meta.attribute) }))
    .filter((meta) => meta.value);
  if (!marks.length) {
    return null;
  }
  return h('p', { className: 'section-marks' }, ...marks.map((meta) => {
    const label = `${meta.description}: ${humanizeMarkValue(meta.value)}`;
    return h('span', {
      className: `mark mark--${meta.kind}`,
      dataset: { mark: meta.value },
      title: label,
      'aria-label': label
    }, humanizeMarkValue(meta.value));
  }));
}

function passDataAttributes(elem, section) {
  Object.entries(section).forEach(([key, value]) => {
    if (key.startsWith('data-') && typeof value === 'string' && !elem.hasAttribute(key)) {
      elem.setAttribute(key, value);
    }
  });
}

/** Marks and the scene toggle share one line under the heading. */
function renderSectionMeta(h, elem, scene, section) {
  const marks = renderMarks(h, elem);
  const meta = h('div', { className: 'section-meta' });
  if (marks) {
    meta.append(marks);
  }
  meta.append(readTimeChip(h, section));
  if (scene) {
    elem.dataset.scene = 'true';
    meta.append(renderSceneSketch(h, scene));
  }
  return meta;
}

function renderSection(h, section, context) {
  const sec = h('section');
  if (section.title) {
    const slug = sectionSlug(section.title);
    if (slug && context.usedIds && !context.usedIds.has(slug)) {
      context.usedIds.add(slug);
      sec.setAttribute('id', slug);
    }
    sec.append(h('h2', {}, section.title));
  }

  applySectionClimateAttributes(sec, section);
  passDataAttributes(sec, section);

  sec.append(renderSectionMeta(h, sec, section.scene, section));

  (section.content || []).forEach((item) => {
    const node = renderBlock(h, item, context);
    if (node) {
      sec.append(node);
    }
  });
  return sec;
}

function renderVoice(h, section, context) {
  const elem = h(section.type);
  applyStoryVoiceAttributes(elem, section.type, 'block');

  if (section.valence) {
    elem.dataset.spwValence = section.valence;
  }
  applySectionClimateAttributes(elem, section);
  passDataAttributes(elem, section);

  if (section.mask && !elem.dataset.mask) {
    elem.dataset.mask = String(section.mask);
  }
  if (section.type === 'custom-fool') {
    if (!elem.getAttribute('data-trope')) {
      elem.setAttribute('data-trope', 'trickster');
    }
    if (!elem.getAttribute('data-frame')) {
      elem.setAttribute('data-frame', 'shot');
    }
  }

  const meta = storyVoiceFor(section.type);
  const kicker = elem.dataset.mask
    ? voiceKickerWithMask(elem.dataset.voiceKicker || meta?.kicker, elem.dataset.mask)
    : (elem.dataset.voiceKicker || meta?.kicker || '');
  if (kicker) {
    elem.dataset.voiceKicker = kicker;
    // StoryVoiceElement mounts this on upgrade; shipping it keeps the
    // no-JS page and the first paint identical to the hydrated one.
    elem.append(h('div', { className: 'voice-kicker', 'aria-hidden': 'true' }, kicker));
  }

  const marks = renderMarks(h, elem);
  if (marks) {
    elem.append(marks);
  }
  elem.append(readTimeChip(h, section));

  (section.content || []).forEach((item) => {
    const node = renderBlock(h, item, context);
    if (node) {
      elem.append(node);
    }
  });

  const wantsStamp = elem.getAttribute('data-frame') === 'shot'
    || section.type === 'custom-fool'
    || (Array.isArray(section.content) && section.content.some((item) => item.type === 'pull'));
  if (wantsStamp && context.stamp) {
    elem.append(h('div', { className: 'voice-stamp' }, context.stamp));
  }

  if (section.scene) {
    elem.dataset.scene = 'true';
    elem.append(renderSceneSketch(h, section.scene));
  }
  return elem;
}

/* ─── Chapter end: the turn, the colophon, the doors ─────────────────── */

function renderTurn(h, next, withBase) {
  const kicker = next.wraps ? 'The serial continues · begin again' : 'Turn the page';
  const link = h('a', {
    className: 'chapter-turn-link',
    href: withBase(next.href),
    rel: next.wraps ? 'first' : 'next'
  },
    h('span', { className: 'chapter-turn-kicker' }, kicker),
    h('span', { className: 'chapter-turn-title' },
      h('span', { className: 'chapter-turn-number' }, chapterOrdinal(next.number)),
      ' ',
      next.title
    )
  );
  if (next.inWhich) {
    link.append(h('span', { className: 'chapter-turn-in-which' }, `In which ${next.inWhich}.`));
  }
  return h('nav', { className: 'chapter-turn', 'aria-label': 'Next chapter', dataset: { component: 'chapter-turn' } }, link);
}

function renderColophon(h, data, withBase) {
  const hasTopics = Array.isArray(data.topics) && data.topics.length;
  const colophon = h('footer', { className: 'chapter-colophon', dataset: { component: 'chapter-colophon' } });

  if (hasTopics || (Array.isArray(data.pillars) && data.pillars.length)) {
    const threads = h('nav', { className: 'chapter-topic-row', 'aria-label': 'Threads in this chapter', dataset: { component: 'chapter-topics' } });
    threads.append(h('span', { className: 'chapter-threads-label' }, 'Threads'));
    (data.topics || []).forEach((topic) => {
      threads.append(h('a', {
        className: 'chapter-topic-chip',
        href: withBase(topic.href || `/topics/#${topic.id || ''}`)
      }, topic.label || topic.id || 'topic'));
    });
    threads.append(h('a', { className: 'chapter-topic-chip chapter-topic-chip--quiet', href: withBase('/topics/') }, 'All threads'));
    colophon.append(threads);
  }

  const byline = h('p', { className: 'chapter-byline', dataset: { component: 'chapter-byline' } },
    `${chapterOrdinal(data.chapterNumber)} of `,
    h('a', { href: withBase('/') }, 'Lore.Land'),
    ', a living serial by ',
    h('a', {
      href: 'https://spwashi.com/?from=lore.land',
      target: '_blank',
      rel: 'noopener noreferrer author'
    }, 'Spwashi'),
    '.'
  );
  if (Array.isArray(data.pillars) && data.pillars.length) {
    byline.append(' ', h('span', { className: 'chapter-pillars', dataset: { component: 'chapter-pillars' } }, `Seeded with ${data.pillars.join(', ')}.`));
  }
  colophon.append(byline);
  return colophon;
}

function renderRouteRail(h, data, withBase) {
  const routes = (data.relatedRoutes || []).filter((route) => route.kicker !== 'Next');
  if (!routes.length) {
    return null;
  }
  return h('nav', { className: 'chapter-route-rail', 'aria-label': 'Continue exploring', dataset: { component: 'chapter-related-routes' } },
    h('p', { className: 'chapter-route-rail-label' }, 'Wander off the page'),
    ...routes.map((route) => h('a', { className: 'chapter-route-card', href: withBase(route.href || '#') },
      route.kicker ? h('span', { className: 'chapter-route-kicker' }, route.kicker) : null,
      h('span', { className: 'chapter-route-title' }, route.label || 'Route')
    ))
  );
}

/* ─── Tiny hyperscript over whichever document we were handed ────────── */

function createFactory(doc) {
  return function h(tag, attrs = {}, ...children) {
    const node = doc.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) {
        return;
      }
      if (key === 'className') {
        node.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          node.dataset[dataKey] = String(dataValue);
        });
      } else {
        node.setAttribute(key, String(value));
      }
    });
    children.forEach((child) => {
      if (child == null || child === false) {
        return;
      }
      node.append(typeof child === 'string' ? child : child);
    });
    return node;
  };
}
