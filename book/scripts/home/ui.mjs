import { chapterHref, spwPrelude } from './data.mjs';
import { createFrameSvg } from './svg.mjs';
import { el } from '../modules/dom.mjs';
import {
  GRAMMAR_PROFILES,
  grammarProfileForChapter,
  buildChapterLogline,
  buildChapterVerse
} from './grammar-profiles.mjs';
import { normalizeSpwSource, withSiteBase } from '../modules/spw-routing.mjs?v=2026_03_02.A';

function humanizeSetLabel(setId) {
  return `Set ${setId}`;
}

function padChapter(number) {
  return String(number).padStart(2, '0');
}

function chapterImagePath(number) {
  return withSiteBase(`/book/images/${padChapter(number)}.png`);
}

export function renderHero(root, chapterCount) {
  root.append(
    el('section', { className: 'hero-panel', dataset: { reveal: 'enter', component: 'hero-panel' }, role: 'region', 'aria-labelledby': 'home-hero-title' },
      el('p', { className: 'hero-eyebrow', textContent: 'Spw Story Architecture' }),
      el('h1', { id: 'home-hero-title', textContent: 'Lore.Land — 13 Chapters in Spw' }),
      el('p', { className: 'hero-subtitle', textContent: 'An abstract reading frame where each chapter opens as a compact Spw scene.' }),
      el('p', { className: 'hero-stats', textContent: `${chapterCount} chapters • semantic flow • canonical timeline` }),
      el('div', { className: 'hero-actions' },
        el('a', { href: chapterHref(1), className: 'hero-action', 'aria-label': 'Begin story at chapter 01', textContent: '^[route/01]{begin-story}' }),
        el('a', { href: withSiteBase('/seeds/2026-02-28/'), className: 'hero-action', 'aria-label': 'Open Midjourney seed atlas', textContent: '~[seed-atlas]{discover-motifs}' }),
        el('a', { href: normalizeSpwSource('spw/index'), className: 'hero-action', 'aria-label': 'Open Spw canon index for lore.land', textContent: '@[path]{@spw/index.spw}' })
      ),
      el('pre', { className: 'spw-block', textContent: spwPrelude }),
      createFrameSvg()
    )
  );
}

export function renderTimeline(root, chapters, chapterSeeds) {
  const grid = el('div', { className: 'chapter-grid', role: 'list', 'aria-label': 'Chapter timeline sequence' });

  chapters.forEach((chapter, index) => {
    const profile = grammarProfileForChapter(chapter.number);
    const chapterId = padChapter(chapter.number);

    const card = el('article', {
      className: 'chapter-card',
      role: 'listitem',
      dataset: {
        component: 'chapter-card',
        reveal: 'enter',
        chapterId: String(chapter.number),
        motifState: 'hidden'
      },
      tabIndex: 0,
      style: { '--reveal-delay': `${index * 60 + 100}ms` }
    });

    const seed = chapterSeeds.get(chapter.number);
    let motifToggle = null;
    let motifFigure = null;

    if (seed) {
      motifToggle = el('button', {
        type: 'button',
        className: 'chapter-motif-toggle',
        textContent: 'Reveal optional motif',
        'aria-expanded': 'false',
        onClick: () => {
          const revealed = motifFigure.hidden;
          motifFigure.hidden = !revealed;
          motifToggle.setAttribute('aria-expanded', revealed ? 'true' : 'false');
          motifToggle.textContent = revealed ? 'Hide optional motif' : 'Reveal optional motif';
          card.dataset.motifState = revealed ? 'revealed' : 'hidden';
        }
      });

      motifFigure = el('figure', { className: 'chapter-seed-preview', hidden: true },
        el('img', {
          src: seed.src,
          alt: `${seed.label} optional Midjourney motif for chapter ${chapter.number}`,
          loading: 'lazy',
          decoding: 'async',
          width: 640,
          height: 360
        }),
        el('figcaption', { textContent: `${seed.label} • ${humanizeSetLabel(seed.setId)} • optional` })
      );
    }

    card.append(
      el('p', { className: 'chapter-marker', textContent: `^[route/${chapterId}]` }),
      el('h3', { textContent: chapter.title }),
      el('p', { className: 'chapter-logline', textContent: buildChapterLogline(chapter, profile) }),
      el('p', { className: 'chapter-register-label', textContent: `Register: ${profile.register} (${profile.cadence})` }),
      el('p', { className: 'chapter-verse-text', dataset: { grammarProfile: profile.id }, innerHTML: buildChapterVerse(chapter, profile).replace(/\n/g, '<br>') }),
      el('figure', { className: 'chapter-default-preview', dataset: { visualDefault: 'colloquial' } },
        el('img', { src: chapterImagePath(chapter.number), alt: `Colloquial default scene for chapter ${chapter.number}`, loading: 'lazy', decoding: 'async', width: 640, height: 360 }),
        el('figcaption', { textContent: 'Colloquial default scene' })
      ),
      ...(motifToggle && motifFigure ? [motifToggle, motifFigure] : []),
      el('pre', { className: 'spw-snippet', tabIndex: 0, textContent: chapter.spw }),
      el('a', { href: chapterHref(chapter.number), textContent: `^[chapter/${chapterId}]{open}`, 'aria-label': `Open chapter ${chapter.number}: ${chapter.title}` })
    );

    grid.append(card);
  });

  root.append(
    el('section', { id: 'chapter-timeline', className: 'chapter-timeline', dataset: { component: 'chapter-timeline', componentVariant: 'grid' }, role: 'region', 'aria-labelledby': 'chapter-timeline-title' },
      el('h2', { id: 'chapter-timeline-title', textContent: 'Canon Reading Route' }),
      el('p', { className: 'chapter-timeline-subtitle', textContent: 'Core storyline with built-in default scenes. Optional Midjourney motifs remain hidden by default to prioritize textual interpretation.' }),
      grid
    )
  );
}

export function renderGrammarObservatory(root, chapters) {
  root.append(
    el('section', { id: 'grammar-observatory', className: 'grammar-observatory', dataset: { component: 'grammar-observatory', reveal: 'enter' }, role: 'region', 'aria-labelledby': 'grammar-observatory-title' },
      el('h2', { id: 'grammar-observatory-title', textContent: 'Grammar Observatory' }),
      el('p', { className: 'grammar-observatory-subtitle', textContent: 'Each chapter carries a grammar register that shapes how a reader experiences time, agency, and resolution. Your display preference is stored locally only.' }),
      el('div', { className: 'grammar-switch', role: 'group', 'aria-label': 'Narrative grammar mode' },
        ...[
          { mode: 'lyric', label: 'Lyric', hint: 'logline, verse, and register visible' },
          { mode: 'plain', label: 'Plain', hint: 'logline only' },
          { mode: 'orbital', label: 'Orbital', hint: 'verse only, enlarged' }
        ].map(({ mode, label, hint }) => el('button', {
          type: 'button',
          className: 'grammar-mode-button',
          title: hint,
          textContent: label,
          'aria-pressed': mode === 'lyric' ? 'true' : 'false',
          dataset: { grammarMode: mode }
        }))
      ),
      el('ul', { className: 'grammar-ledger', role: 'list' },
        ...GRAMMAR_PROFILES.map(profile => el('li', { dataset: { grammarProfile: profile.id }, textContent: `${profile.register} — ${profile.description}` }))
      ),
      el('pre', { className: 'motif-spw grammar-sample', textContent: `^[grammar]{\n  &[register]{ declarative | interrogative | imperative | exclamatory | conditional }\n  ?[mode]{ plain | lyric | orbital }\n  ~[cadence]{ measured, searching, percussive, radiant, spiral }\n}` }),
      el('div', { className: 'grammar-matrix', role: 'list', 'aria-label': 'Chapter grammar facets' },
        ...chapters.slice(0, 9).map((chapter, index) => {
          const profile = grammarProfileForChapter(chapter.number);
          return el('button', {
            type: 'button',
            className: 'grammar-chip',
            role: 'listitem',
            textContent: `${padChapter(chapter.number)} • ${profile.register}`,
            dataset: { grammarProfile: profile.id, cadence: profile.cadence, chapter: String(chapter.number), spwHandle: chapter.spw, reveal: 'enter' },
            style: { '--reveal-delay': `${index * 55}ms` }
          });
        })
      ),
      el('p', { id: 'grammar-runtime-status', className: 'grammar-runtime-status', role: 'status', 'aria-live': 'polite', textContent: 'Runtime bridge: select any Spw token or chapter grammar chip to sync focus. Lifecycle mapping appears here.' })
    )
  );
}

export function renderSeedAtlas(root, seedSets, seedManifest, seedDimensions) {
  root.append(
    el('section', { id: 'seed-atlas', className: 'seed-atlas', dataset: { component: 'seed-atlas', componentVariant: 'grid', reveal: 'enter' }, role: 'region', 'aria-labelledby': 'seed-atlas-title' },
      el('h2', { id: 'seed-atlas-title', textContent: 'Seed Atlas' }),
      el('p', { className: 'seed-atlas-subtitle', textContent: 'Midjourney studies become modular narrative ingredients for chapter-specific scene development.' }),
      el('form', { className: 'seed-controls', 'aria-label': 'Seed atlas controls', action: '#' },
        el('label', { htmlFor: 'seed-set-select', innerHTML: '<span>Set</span>' },
          el('select', { id: 'seed-set-select', name: 'seed-set' },
            el('option', { value: 'all', textContent: 'all sets' }),
            ...seedSets.map(set => el('option', { value: set.id, textContent: humanizeSetLabel(set.id) }))
          )
        ),
        el('label', { htmlFor: 'seed-dimension-select', innerHTML: '<span>Dimension</span>' },
          el('select', { id: 'seed-dimension-select', name: 'seed-dimension' },
            el('option', { value: 'all', textContent: 'all dimensions' }),
            ...seedDimensions.map(dimension => el('option', { value: dimension, textContent: dimension }))
          )
        ),
        el('button', { type: 'button', id: 'seed-randomize', className: 'seed-randomize', textContent: 'Suggest Seed' })
      ),
      el('p', { id: 'seed-reward-output', className: 'seed-reward-output', role: 'status', 'aria-live': 'polite', textContent: 'Curate a few motifs. Rewards are deterministic and non-addictive.' }),
      el('div', { id: 'seed-grid', className: 'seed-grid', role: 'list', 'aria-label': 'Visual seed collection' },
        ...seedManifest.map(seed => el('article', {
          className: 'seed-card', role: 'listitem', tabIndex: 0,
          dataset: { seedId: seed.id, seedSet: seed.setId, seedDimension: seed.dimension, component: 'seed-card', reveal: 'enter' }
        },
          el('figure', { className: 'seed-figure' },
            el('img', { src: seed.src, alt: seed.alt, loading: 'lazy', decoding: 'async', width: 480, height: 360 }),
            el('figcaption', { textContent: `${seed.label} • ${humanizeSetLabel(seed.setId)}` })
          ),
          el('button', { type: 'button', className: 'seed-adopt-button', textContent: 'Adopt motif', 'aria-pressed': 'false', dataset: { seedId: seed.id } })
        ))
      ),
      el('a', { href: '/seeds/2026-02-28/', className: 'seed-atlas-link', textContent: 'Open full Midjourney archive' })
    )
  );
}

export function renderProducerConstellation(root, producerNetwork) {
  if (!root || !producerNetwork) return;

  const totalCapacity = Number(producerNetwork.totalDomainCapacity || 0);
  const literalReferences = Array.isArray(producerNetwork.literalReferences) ? producerNetwork.literalReferences : [];

  root.append(
    el('section', { id: 'producer-constellation', className: 'producer-constellation', dataset: { component: 'producer-constellation', reveal: 'enter', totalCapacity: String(totalCapacity) }, role: 'region', 'aria-labelledby': 'producer-constellation-title' },
      el('h2', { id: 'producer-constellation-title', textContent: 'Producer Constellation' }),
      el('p', { className: 'producer-constellation-subtitle', textContent: 'Structure first. Literal domains by context.' }),
      el('p', { className: 'producer-intent', textContent: producerNetwork.intent || '' }),
      el('p', { className: 'producer-guidance', textContent: producerNetwork.guidance || '' }),
      el('pre', { className: 'motif-spw producer-skeleton', dataset: { spwExpression: 'true' }, textContent: `^[producer/network]{\n  &[capacity]{domains:${totalCapacity}}\n  ^[literal]{${literalReferences.length ? literalReferences.join(',') : 'mapped-literals'}}\n  ~[policy]{structure first, selective literals}\n}` }),
      el('h3', { className: 'producer-heading', textContent: 'Principles' }),
      el('ul', { className: 'producer-principles' },
        ...(producerNetwork.principles || []).map(principle => el('li', { textContent: principle }))
      ),
      el('h3', { className: 'producer-heading', textContent: 'Clusters' }),
      el('div', { className: 'producer-cluster-grid', role: 'group', 'aria-label': 'Producer clusters' },
        ...(producerNetwork.clusters || []).map(cluster => el('article', {
          className: 'producer-cluster-card', role: 'button', tabIndex: 0, 'aria-pressed': 'false', 'aria-label': `${cluster.label}. Capacity ${cluster.capacity}.`, dataset: { cluster: cluster.id }
        },
          el('p', { className: 'producer-cluster-chip', dataset: { spwExpression: 'true' }, textContent: `^[cluster/${cluster.id}]{${cluster.capacity}}` }),
          el('h4', { textContent: cluster.label }),
          el('p', { className: 'producer-cluster-medium', textContent: cluster.medium }),
          el('pre', { className: 'spw-snippet producer-cluster-snippet', textContent: cluster.spw }),
          ...(Array.isArray(cluster.literalDomains) && cluster.literalDomains.length ? [
            el('div', { className: 'producer-literal-domains', 'aria-label': 'Literal domain references' },
              ...cluster.literalDomains.map(domain => el('span', { className: 'producer-literal-domain', dataset: { spwExpression: 'true' }, textContent: `@[domain]{${domain}}` }))
            )
          ] : [])
        ))
      ),
      el('h3', { className: 'producer-heading', textContent: 'Domain Slots' }),
      el('form', { className: 'producer-slot-controls', 'aria-label': 'Producer domain slot controls', action: '#' },
        el('label', { htmlFor: 'producer-cluster-select', innerHTML: '<span>Cluster</span>' },
          el('select', { id: 'producer-cluster-select', name: 'producer-cluster' },
            el('option', { value: 'all', textContent: 'all clusters' }),
            ...(producerNetwork.clusters || []).map(cluster => el('option', { value: cluster.id, textContent: cluster.label }))
          )
        ),
        el('button', { type: 'button', id: 'producer-slot-suggest', className: 'producer-slot-suggest', textContent: 'Suggest Slot' })
      ),
      el('p', { id: 'producer-slot-status', className: 'producer-slot-status', role: 'status', 'aria-live': 'polite', textContent: `${totalCapacity} slots ready. Map names by context.` }),
      el('div', { className: 'producer-slot-grid', role: 'list', 'aria-label': 'Producer domain slots' },
        ...(producerNetwork.slots || []).map(slot => el('button', {
          type: 'button', className: 'producer-slot-button', role: 'listitem', textContent: slot.spw, 'aria-pressed': 'false', 'aria-label': `${slot.id} in ${slot.clusterLabel}`, dataset: { slotId: slot.id, cluster: slot.clusterId, spwExpression: 'true' }
        }))
      )
    )
  );
}
