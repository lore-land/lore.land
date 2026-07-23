import { describeLoadStage } from './story-lexicon.mjs?v=2026_02_28.I';
import { el } from './dom.mjs';
import { normalizeSpwSource, resolvePathRefHref } from './spw-routing.mjs?v=2026_03_02.A';

/* Full v0.2.0-alpha operator table.
   spirit_sequence phases: ! (0), ? (1), ~ (2), @ (3), & (4), * (5), ^ (6)
   accessor polarity:  # = extrinsic/projection,  . = intrinsic/reduction */
const OPERATOR_ETHOS = Object.freeze([
  { sigil: '?', role: 'probe', phase: '1', polarity: null },
  { sigil: '~', role: 'potential', phase: '2', polarity: null },
  { sigil: '@', role: 'perspective', phase: '3', polarity: null },
  { sigil: '&', role: 'confluence', phase: '4', polarity: null },
  { sigil: '*', role: 'value', phase: '5', polarity: null },
  { sigil: '^', role: 'integration', phase: '6', polarity: null },
  { sigil: '!', role: 'action', phase: '0', polarity: null },
  { sigil: '#', role: 'annotation', phase: 'meta', polarity: 'extrinsic' },
  { sigil: '.', role: 'ground', phase: 'meta', polarity: 'intrinsic' },
  { sigil: '=', role: 'config', phase: 'bind', polarity: null },
  { sigil: '%', role: 'measure', phase: 'obs', polarity: null },
  { sigil: '$', role: 'substrate', phase: 'meta', polarity: null }
]);

const CLAIM_LAYERS = Object.freeze([
  { id: 'all', label: 'all', sigil: '&' },
  { id: 'grammar', label: 'grammar', sigil: '.' },
  { id: 'semantics', label: 'semantics', sigil: '^' },
  { id: 'pragmatics', label: 'pragmatics', sigil: '!' }
]);

/* Canon source of truth: .spw/claims/chapter-claims.spw (id policy lore-cNNN-slug).
   These constants are the fallback mirror — hydration prefers the live canon file
   and only lands here on fetch or parse failure. */
const FALLBACK_CLAIMS = Object.freeze([
  {
    id: 'lore-c001-brace-symmetry',
    layer: 'grammar',
    hypothesis: 'L/R brace anchors and section handles remain symmetrically explorable and legible in plain text.',
    measure: 'Handle traversal and selection parity in chapter controls; prefix/postfix readability.',
    falsification: 'Asymmetry drift over 15% between left and right traversals, or handles require hidden UI context.',
    specRef: '.spw/surfaces/publish.spw#projection_rules',
    implRef: 'book/scripts/modules/spw-interactions.mjs',
    probeRef: 'lore:spw-selection + ebook handle inspector'
  },
  {
    id: 'lore-c002-accessor-polarity',
    layer: 'semantics',
    hypothesis: '# and . keep readable projection/ground polarity; route and register sigils preserve perspective across chapter/home.',
    measure: 'Interpretability of route and register handles by layer.',
    falsification: 'Less than 70% role clarity in mixed route contexts.',
    specRef: '.spw/runtime/precipitates.spw#stages',
    implRef: 'book/scripts/modules/ebook-navigation.mjs',
    probeRef: 'lore:spw-selection + concept routes + payload readout'
  },
  {
    id: 'lore-c003-plain-text-legibility',
    layer: 'pragmatics',
    hypothesis: 'Raw Spw expressions and chapter .spw mirrors stay legible enough to extend story without custom renderers — only if mirrors match prose SoT.',
    measure: 'Reader can infer intent from visible route/claim expressions; .spw/chapters title matches JSON.',
    falsification: 'More than 20% of chapter expressions require hidden UI context, or chapter .spw lag live JSON (workspace c001 fail).',
    specRef: '.spw/state/observable.spw',
    implRef: 'book/content/chapters/*.json + .spw/chapters/*.spw + export-chapters.mjs',
    probeRef: 'title diff JSON vs .spw/chapters + section navigation'
  },
  {
    id: 'lore-c004-pipeline-alignment',
    layer: 'semantics',
    hypothesis: 'Load lifecycle labels map clearly to select-transform-validate-emit semantics.',
    measure: 'Status text keeps a stable mapping between load and runtime stages.',
    falsification: 'Readers cannot infer stage intent from on-screen stage labels.',
    specRef: '.spw/surfaces/index.spw#pipeline_stages',
    implRef: 'book/scripts/modules/load-lifecycle.mjs + book/scripts/home/app.mjs',
    probeRef: 'data-load-stage and runtime status chips'
  },
  {
    id: 'lore-c005-offline-honesty',
    layer: 'pragmatics',
    hypothesis: 'PWA offline surface never promises chapters or assets that were not precached or previously visited.',
    measure: 'Offline copy + SW precache list match; install does not 404 fixture paths.',
    falsification: 'Install precache fails, or offline.html claims cached chambers without seed.',
    specRef: '.spw/surfaces/platform.spw#domain.pwa',
    implRef: 'sw.js + book/pwa/offline.html',
    probeRef: 'airplane mode after install + after visit ch01'
  },
  {
    id: 'lore-c006-share-intrigue',
    layer: 'pragmatics',
    hypothesis: 'Every public monument URL packages a non-blank share card with logline-quality description.',
    measure: 'OG + Twitter summary_large_image present; og:image is real art not empty plate.',
    falsification: 'Shared chapter or door shows blank/grey card or missing description.',
    specRef: '.spw/surfaces/publish.spw#social_projection',
    implRef: 'book/templates/chapter.html + monument HTML heads',
    probeRef: 'manual share debugger on /, /book/chapter/01/, /zine/, /topics/'
  },
  {
    id: 'lore-c007-earned-wonder',
    layer: 'pragmatics',
    hypothesis: 'Signature moments impress a seen-the-web audience while degrading to calm reading under reduced-motion, no-JS, and print.',
    measure: 'Each wonder_budget signature has an @supports + reduced-motion gate and a verified calm cut.',
    falsification: 'Any signature moment breaks reading when its gate closes, or ships while carrying an open defect-class ledger entry.',
    specRef: '.spw/surfaces/atelier.spw#wonder_budget',
    implRef: 'book/styles/home/atmosphere.css + book/styles/chapter/motion.css + ebook-navigation.mjs',
    probeRef: 'reduced-motion parity + print parity ledger probes'
  },
  {
    id: 'lore-c008-accounted-alignment',
    layer: 'pragmatics',
    hypothesis: 'Every noticed misalignment — geometric, temporal, material, linguistic, canonical — resolves to a fix or a declared intention.',
    measure: 'Ledger entries carry class + why; complaints route to counters instead of silence.',
    falsification: 'A reader-reported gap has no ledger entry, or an intentional entry lacks its recorded why.',
    specRef: '.spw/state/alignment-ledger.spw',
    implRef: '.spw/surfaces/atelier.spw#alignment_ledger + PLAN.B diagnostics engine',
    probeRef: 'complaint_route flow + five ledger probes on changed surfaces'
  },
  {
    id: 'lore-c009-literacy-ladder',
    layer: 'semantics',
    hypothesis: 'A reader can climb read → notice → explore → operate → inspect → author, each rung learnable from the one below, none forced.',
    measure: 'Every rung has a visible, dismissible on-ramp on the rung below; adventure register unchanged when all invitations are dismissed.',
    falsification: 'A rung requires outside documentation to enter, or an on-ramp blocks or lectures the story.',
    specRef: '.spw/surfaces/atelier.spw#literacy_ladder',
    implRef: 'language-exploration.mjs + spw-interactions.mjs + spw-ethos.mjs + editorial desk (planned)',
    probeRef: 'rung walk-through with all invitations dismissed vs accepted'
  },
  {
    id: 'lore-c010-honest-internals',
    layer: 'pragmatics',
    hypothesis: 'Internals shown to the craftsperson — stages, probes, sigil grammar — are the real runtime machinery, walkable back to canon.',
    measure: 'Status chips map to live pipeline stages; ethos rows resolve to .spw sources; view-source reads as authored.',
    falsification: 'Any displayed internal is simulated, or a probe chain row dead-ends without a resolvable ref.',
    specRef: '.spw/surfaces/atelier.spw#internals_awareness',
    implRef: '.spw/runtime/precipitates.spw bindings + spw-ethos.mjs',
    probeRef: 'skeptical devtools session: stage chips vs load-lifecycle events; ethos href walk'
  }
]);

const CLAIMS_CANON_SOURCE = 'claims/chapter-claims';
const HYDRATION_TIMEOUT_MS = 4000;

/* Milestone-A slice of the PLAN.B diagnostics engine: runtime signals move a
   claim untested -> active on first evidence. confirmed/refuted transitions
   wait on the full engine (thresholds + error polarity), so no chip ever
   asserts more than the runtime has actually witnessed. */
const SIGNAL_CLAIM_MAP = Object.freeze({
  'lore:spw-selection': ['lore-c001-brace-symmetry', 'lore-c002-accessor-polarity'],
  'lore:ebook-section-change': ['lore-c002-accessor-polarity', 'lore-c003-plain-text-legibility'],
  'lore:load-stage': ['lore-c004-pipeline-alignment']
});

const CLAIM_FIELD_MAP = Object.freeze({
  claim_id: 'id',
  layer: 'layer',
  hypothesis: 'hypothesis',
  measure: 'measure',
  falsification: 'falsification',
  spec_ref: 'specRef',
  impl_ref: 'implRef',
  probe_ref: 'probeRef'
});

/* Extract the body of ^claim_chain{...} with brace depth so nested
   grammar/semantics blocks do not truncate the parse. Falls back to the
   full source when the marker is missing (tests / partial fixtures). */
function extractClaimChainBody(source) {
  const text = String(source || '');
  const marker = text.search(/\^claim_chain\s*\{/);
  if (marker < 0) {
    return text;
  }

  const open = text.indexOf('{', marker);
  if (open < 0) {
    return text;
  }

  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(open + 1, i);
      }
    }
  }

  return text.slice(open + 1);
}

/* Parses the ^claim_chain block of chapter-claims.spw: flat named blocks of
   single-line `key: "value"` pairs, one claim per claim_id encountered.
   A leading operator sigil on the key (e.g. `&spec_ref: "..."`) is accepted
   and ignored for parsing — it's a legibility annotation on the canon source
   (per OPERATOR_ROLES), not a distinct field name. */
export function parseClaimChain(text) {
  const body = extractClaimChainBody(text);
  const claims = [];
  let current = null;

  for (const line of body.split('\n')) {
    const pair = line.match(/^\s*[!#.%&^~@*=$]?([a-z_]+):\s*"([^"]*)"\s*$/i);
    if (!pair) {
      continue;
    }
    const key = pair[1].toLowerCase();
    const value = pair[2].trim();
    if (key === 'claim_id') {
      current = { id: value };
      claims.push(current);
      continue;
    }
    if (!current) {
      continue;
    }
    const field = CLAIM_FIELD_MAP[key];
    if (field && field !== 'id') {
      current[field] = value;
    }
  }

  return claims.filter((claim) => claim.id && claim.layer && claim.hypothesis);
}

export async function hydrateEthosClaims(claimsUrl, timeoutMs = HYDRATION_TIMEOUT_MS) {
  const fallback = (reason) => ({
    claims: FALLBACK_CLAIMS.map((claim) => ({ ...claim })),
    source: 'fallback',
    reason,
    url: claimsUrl
  });

  if (!claimsUrl || typeof fetch !== 'function') {
    return fallback('no_source');
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let text = '';
  try {
    const response = await fetch(claimsUrl, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) {
      return fallback(`fetch_${response.status}`);
    }
    text = await response.text();
  } catch (error) {
    return fallback(error && error.name === 'AbortError' ? 'fetch_timeout' : 'fetch_failed');
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  const claims = parseClaimChain(text);
  if (!claims.length) {
    return fallback('parse_empty');
  }

  return {
    claims,
    source: 'canon',
    url: claimsUrl,
    fetchedAt: new Date().toISOString()
  };
}

function formatExpression(sigil, handle, payload) {
  if (!payload) {
    return `${sigil}[${handle}]`;
  }
  return `${sigil}[${handle}]{${payload}}`;
}

function classNameForContext(context) {
  return context === 'home' ? 'spw-ethos-atlas' : 'spw-ethos-panel';
}

function titleForContext(context) {
  return context === 'home' ? 'Spw Ethos Atlas' : 'Spw Ethos';
}

function subtitleForContext(context) {
  if (context === 'home') {
    return 'Architectural claims become visible probes: claim -> spec -> impl -> probe.';
  }
  return 'Live chapter contract: every language claim should map to a testable probe chain.';
}

function layerMatches(claim, layer) {
  return layer === 'all' || claim.layer === layer;
}

const CLAIM_REF_KINDS = Object.freeze([
  { key: 'specRef', label: 'spec' },
  { key: 'implRef', label: 'impl' },
  { key: 'probeRef', label: 'probe' }
]);

/* A ref segment is walkable when it names one concrete repo path — has a
   directory separator, no spaces or globs — or is already an absolute URL.
   Prose probes ("airplane mode after install") stay plain text. */
function refSegmentHref(segment) {
  const token = String(segment || '').trim();
  if (!token) {
    return null;
  }
  if (/^https?:\/\//i.test(token)) {
    return token;
  }
  if (/[\s*]/.test(token) || !token.includes('/')) {
    return null;
  }
  if (!/^\.?[\w@-][\w./@#-]*$/.test(token)) {
    return null;
  }
  return resolvePathRefHref(token);
}

function createClaimRefEntry(kind, ref) {
  const value = String(ref || '').trim();
  const segments = value ? value.split(' + ') : [];
  const parts = [];

  segments.forEach((segment, index) => {
    if (index > 0) {
      parts.push(el('span', { className: 'ethos-claim-ref-joint', textContent: ' + ' }));
    }
    const href = refSegmentHref(segment);
    if (href) {
      const external = /^https?:\/\//i.test(href);
      parts.push(el('a', {
        className: 'ethos-claim-ref-link',
        href,
        // Same-origin canon stays in-tab so reading position is not lost;
        // external GitHub / absolute URLs open beside the monument.
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        textContent: segment
      }));
    } else {
      parts.push(el('span', { className: 'ethos-claim-ref-part', textContent: segment }));
    }
  });

  return el('span', {
    className: 'ethos-claim-ref-entry',
    dataset: { refKind: kind.label },
    title: `${kind.label}: ${value}`
  },
    el('span', { className: 'ethos-claim-ref-kind', textContent: kind.label }),
    el('span', { className: 'ethos-claim-ref-path' }, ...parts)
  );
}

function createClaimItem(claim, announce) {
  return el('li', {
    className: 'ethos-claim-item',
    dataset: { layer: claim.layer, claimId: claim.id, claimStatus: 'untested', claimEvidence: '0' }
  },
    el('div', { className: 'ethos-claim-head' },
      el('button', {
        type: 'button',
        className: 'ethos-claim-handle',
        dataset: { spwExpression: 'true' },
        textContent: formatExpression('^', `claim/${claim.layer}`, claim.id),
        'aria-label': `Inspect claim ${claim.id}`,
        onClick: () => {
          if (announce) announce(`Claim focus: ${claim.id}.`);
        }
      }),
      el('span', {
        className: 'ethos-claim-status',
        dataset: { claimStatus: 'untested' },
        title: 'Claim status: untested — no runtime evidence yet this session',
        textContent: 'untested'
      })
    ),
    el('p', { className: 'ethos-claim-line', textContent: `Hypothesis: ${claim.hypothesis}` }),
    el('p', { className: 'ethos-claim-line', textContent: `Measure: ${claim.measure}` }),
    el('p', { className: 'ethos-claim-line', textContent: `Falsification: ${claim.falsification}` }),
    el('div', {
      className: 'ethos-claim-ref',
      role: 'group',
      'aria-label': 'Probe chain: specification, implementation, and live probe'
    },
      ...CLAIM_REF_KINDS.map((kind) => createClaimRefEntry(kind, claim[kind.key]))
    )
  );
}

function createOperatorItem(entry) {
  const polarityNote = entry.polarity ? ` · ${entry.polarity}` : '';
  return el('li', { className: 'ethos-operator-item', dataset: { sigil: entry.sigil, polarity: entry.polarity } },
    el('span', {
      className: 'ethos-operator-token',
      dataset: { spwRole: entry.role, spwPolarity: entry.polarity },
      textContent: entry.sigil,
      title: `${entry.role} · phase ${entry.phase}${polarityNote}`
    }),
    el('span', { className: 'ethos-operator-meta', textContent: `${entry.role} · ${entry.phase}${polarityNote}` })
  );
}

export function initSpwEthosIntegration(options = {}) {
  const context = options.context === 'home' ? 'home' : 'chapter';
  const root = options.root || document;
  const announce = options.announce;
  const container =
    options.container ||
    (context === 'home' ? document.getElementById('home-app') : document.querySelector('aside'));

  if (!container) {
    return null;
  }

  const className = classNameForContext(context);
  const existing = container.querySelector(`.${className}`);
  if (existing) {
    existing.remove();
  }

  const layerButtons = CLAIM_LAYERS.map((layer) => {
    return el('button', {
      type: 'button',
      className: 'ethos-layer-button',
      dataset: { claimLayer: layer.id, spwExpression: 'true' },
      textContent: formatExpression(layer.sigil, 'layer', layer.label),
      'aria-pressed': layer.id === 'all' ? 'true' : 'false'
    });
  });

  let claimItems = [];
  const claimStates = new Map();
  const claimList = el('ul', { className: 'ethos-claim-list' });
  const status = el('p', { className: 'ethos-status', role: 'status', 'aria-live': 'polite', textContent: 'Ethos ready: waiting for runtime selection.' });
  const sourceChip = el('p', {
    className: 'ethos-source',
    dataset: { ethosSource: 'pending' },
    title: 'Claim source: hydrating from /.spw/claims/chapter-claims.spw',
    textContent: formatExpression('$', 'claims', 'pending')
  });

  const panel = el('section', {
    className,
    dataset: { component: 'spw-ethos', spwComponent: 'spw-ethos', claimLayer: 'all', ethosSource: 'pending' },
    'aria-label': titleForContext(context)
  },
    el('h2', { textContent: titleForContext(context) }),
    el('p', { className: 'ethos-subtitle', textContent: subtitleForContext(context) }),
    el('pre', { className: 'motif-spw ethos-chain', dataset: { spwExpression: 'true' }, textContent: '^[claim-chain]{ claim -> spec -> impl -> probe }' }),
    sourceChip,
    el('div', { className: 'ethos-layer-switch', role: 'group', 'aria-label': 'Claim layer filter' }, ...layerButtons),
    claimList,
    el('h3', { className: 'ethos-operators-heading', textContent: 'Operator ethos' }),
    el('ul', { className: 'ethos-operator-list' }, ...OPERATOR_ETHOS.map(createOperatorItem)),
    status
  );

  const applyClaimStatusDom = (claimId) => {
    const state = claimStates.get(claimId);
    const item = claimItems.find((entry) => entry.dataset.claimId === claimId);
    if (!state || !item) {
      return;
    }
    item.dataset.claimStatus = state.status;
    item.dataset.claimEvidence = String(state.evidence);
    const chip = item.querySelector('.ethos-claim-status');
    if (chip) {
      chip.dataset.claimStatus = state.status;
      chip.textContent = state.status;
      chip.title = state.status === 'untested'
        ? 'Claim status: untested — no runtime evidence yet this session'
        : `Claim status: ${state.status} — evidence signals this session: ${state.evidence}`;
    }
  };

  const renderClaims = (claims) => {
    const previousStates = new Map(claimStates);
    claimStates.clear();
    claimItems = claims.map((claim) => createClaimItem(claim, announce));
    claimList.replaceChildren(...claimItems);
    claims.forEach((claim) => {
      const carried = previousStates.get(claim.id);
      claimStates.set(claim.id, carried ? { ...carried } : { status: 'untested', evidence: 0 });
      applyClaimStatusDom(claim.id);
    });
  };

  const recordEvidence = (claimIds) => {
    (claimIds || []).forEach((claimId) => {
      const state = claimStates.get(claimId);
      if (!state) {
        return;
      }
      state.evidence += 1;
      const previous = state.status;
      if (previous === 'untested') {
        state.status = 'active';
        window.dispatchEvent(new CustomEvent('lore:ethos-claim-status', {
          detail: {
            claimId,
            oldStatus: previous,
            newStatus: state.status,
            evidenceCount: state.evidence,
            errorCount: 0
          }
        }));
      }
      applyClaimStatusDom(claimId);
    });
  };

  renderClaims(FALLBACK_CLAIMS);

  if (context === 'home') {
    const anchor = container.querySelector('#grammar-observatory');
    if (anchor) {
      anchor.insertAdjacentElement('afterend', panel);
    } else {
      container.append(panel);
    }
  } else {
    container.append(panel);
  }

  const applyLayer = (layer, spoken = false) => {
    const nextLayer = CLAIM_LAYERS.some((entry) => entry.id === layer) ? layer : 'all';
    panel.dataset.claimLayer = nextLayer;
    layerButtons.forEach((button) => {
      const active = button.dataset.claimLayer === nextLayer;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    claimItems.forEach((item) => {
      item.hidden = !layerMatches({ layer: item.dataset.layer || '' }, nextLayer);
    });
    status.textContent = `Claim layer: ${nextLayer}.`;
    if (spoken && announce) {
      announce(`Ethos layer set to ${nextLayer}.`);
    }
  };

  layerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyLayer(button.dataset.claimLayer || 'all', true);
    });
  });

  const applySource = (result) => {
    panel.dataset.ethosSource = result.source;
    sourceChip.dataset.ethosSource = result.source;
    if (result.source === 'canon') {
      sourceChip.textContent = formatExpression('$', 'claims', 'canon');
      sourceChip.title = `Claim source: ${result.url} (fetched ${result.fetchedAt})`;
    } else {
      sourceChip.textContent = formatExpression('$', 'claims', `fallback:${result.reason || 'unknown'}`);
      sourceChip.title = `Claim source: bundled fallback mirror — canon fetch fell back (${result.reason || 'unknown'})`;
    }
  };

  let disposed = false;
  const claimsUrl = options.claimsUrl || normalizeSpwSource(CLAIMS_CANON_SOURCE);
  hydrateEthosClaims(claimsUrl)
    .then((result) => {
      if (disposed) {
        return;
      }
      if (result.source === 'canon') {
        renderClaims(result.claims);
        applyLayer(panel.dataset.claimLayer || 'all', false);
      }
      applySource(result);
    })
    .catch(() => {
      if (disposed) {
        return;
      }
      applySource({ source: 'fallback', reason: 'hydrate_error', url: claimsUrl });
    });

  const applyLoadStage = (stage, detail = '') => {
    const token = String(stage || '').trim();
    if (!token) {
      return;
    }

    const descriptor = describeLoadStage(token);
    const pipelineStage = descriptor.pipelineStage || 'fallback';
    const precipitateStages = descriptor.precipitates || descriptor.precipitants || [];
    const substrateEvents = descriptor.substrateEvents || [];
    const resonanceTypes = descriptor.resonances || [];
    const precipitateText = precipitateStages.length
      ? precipitateStages.join(' + ')
      : 'none';
    const substrateText = substrateEvents.length ? substrateEvents.join(' + ') : 'none';
    const resonanceText = resonanceTypes.length ? resonanceTypes.join(' + ') : 'none';

    panel.dataset.loadStage = token;
    panel.dataset.pipelineStage = pipelineStage;
    panel.dataset.precipitateStages = precipitateStages.join(',');
    panel.dataset.precipitantStages = precipitateStages.join(',');
    panel.dataset.substrateEvents = substrateEvents.join(',');
    panel.dataset.resonanceTypes = resonanceTypes.join(',');

    const detailSuffix = detail ? ` (${detail})` : '';
    status.textContent =
      `Lifecycle probe: ${formatExpression('%', 'stage', `${token}->${pipelineStage}`)} • ` +
      `${precipitateText} • ${formatExpression('$', 'substrate', substrateText)} • ` +
      `${formatExpression('#', 'resonance', resonanceText)}${detailSuffix}`;
  };

  const onSelection = (event) => {
    const detail = event.detail || {};
    const handle = String(detail.handle || '').trim();
    if (!handle) {
      return;
    }
    panel.dataset.lastHandle = handle;
    status.textContent = `Probe update: ${formatExpression('?', 'selection', handle)}`;
    recordEvidence(SIGNAL_CLAIM_MAP['lore:spw-selection']);
  };

  const onSectionChange = (event) => {
    const detail = event.detail || {};
    const index = Number(detail.sectionIndex || 0);
    if (!index) {
      return;
    }
    status.textContent = `Chapter probe: ${formatExpression('&', 'section', `s${String(index).padStart(2, '0')}`)}`;
    recordEvidence(SIGNAL_CLAIM_MAP['lore:ebook-section-change']);
  };

  const onLoadStage = (event) => {
    const detail = event.detail || {};
    applyLoadStage(detail.stage || '', detail.detail || '');
    recordEvidence(SIGNAL_CLAIM_MAP['lore:load-stage']);
  };

  window.addEventListener('lore:spw-selection', onSelection);
  window.addEventListener('lore:ebook-section-change', onSectionChange);
  window.addEventListener('lore:load-stage', onLoadStage);

  const stageSource = root?.body || document.body;
  const observer = stageSource
    ? new MutationObserver(() => {
      const stage = stageSource.dataset.loadStage || '';
      applyLoadStage(stage);
    })
    : null;

  if (observer && stageSource) {
    observer.observe(stageSource, {
      attributes: true,
      attributeFilter: ['data-load-stage']
    });
    applyLoadStage(stageSource.dataset.loadStage || '');
  }

  applyLayer('all', false);

  return {
    setLayer: (layer) => applyLayer(layer, false),
    destroy: () => {
      disposed = true;
      window.removeEventListener('lore:spw-selection', onSelection);
      window.removeEventListener('lore:ebook-section-change', onSectionChange);
      window.removeEventListener('lore:load-stage', onLoadStage);
      if (observer) {
        observer.disconnect();
      }
      claimStates.clear();
      panel.remove();
    }
  };
}
