import { describeLoadStage } from './story-lexicon.mjs?v=2026_02_28.I';

/* Full v0.2.0-alpha operator table.
   spirit_sequence phases: ! (0), ? (1), ~ (2), @ (3), & (4), * (5), ^ (6)
   accessor polarity:  # = extrinsic/projection,  . = intrinsic/reduction */
const OPERATOR_ETHOS = Object.freeze([
  { sigil: '?', role: 'probe',       phase: '1',    polarity: null },
  { sigil: '~', role: 'potential',   phase: '2',    polarity: null },
  { sigil: '@', role: 'perspective', phase: '3',    polarity: null },
  { sigil: '&', role: 'confluence',  phase: '4',    polarity: null },
  { sigil: '*', role: 'value',       phase: '5',    polarity: null },
  { sigil: '^', role: 'integration', phase: '6',    polarity: null },
  { sigil: '!', role: 'action',      phase: '0',    polarity: null },
  { sigil: '#', role: 'annotation',  phase: 'meta', polarity: 'extrinsic' },
  { sigil: '.', role: 'ground',      phase: 'meta', polarity: 'intrinsic' },
  { sigil: '=', role: 'config',      phase: 'bind', polarity: null },
  { sigil: '%', role: 'measure',     phase: 'obs',  polarity: null },
  { sigil: '$', role: 'substrate',   phase: 'meta', polarity: null }
]);

const CLAIM_LAYERS = Object.freeze([
  { id: 'all', label: 'all', sigil: '&' },
  { id: 'grammar', label: 'grammar', sigil: '.' },
  { id: 'semantics', label: 'semantics', sigil: '^' },
  { id: 'pragmatics', label: 'pragmatics', sigil: '!' }
]);

const CLAIMS = Object.freeze([
  {
    id: 'c001-brace-symmetry',
    layer: 'grammar',
    hypothesis: 'L/R brace anchors should remain symmetrically explorable.',
    measure: 'Handle traversal and selection parity in chapter controls.',
    falsification: 'Asymmetry drift over 15% between left and right traversals.',
    specRef: 'spw-workbench: .spw/surfaces/publish.spw#projection_rules',
    implRef: 'lore.land: book/scripts/modules/spw-interactions.mjs',
    probeRef: 'lore.land: lore:spw-selection + ebook handle inspector'
  },
  {
    id: 'c002-accessor-polarity',
    layer: 'semantics',
    hypothesis: '# and . should keep readable projection/ground polarity.',
    measure: 'Interpretability of route and register handles by layer.',
    falsification: 'Less than 70% role clarity in mixed route contexts.',
    specRef: 'spw-workbench: .spw/runtime/precipitates.spw#stages',
    implRef: 'lore.land: book/scripts/modules/ebook-navigation.mjs',
    probeRef: 'lore.land: concept routes + payload readout'
  },
  {
    id: 'c003-plain-text-legibility',
    layer: 'pragmatics',
    hypothesis: 'Raw Spw expressions should stay legible without custom renderers.',
    measure: 'Reader can infer intent from visible route/claim expressions.',
    falsification: 'More than 20% of chapter expressions require hidden UI context.',
    specRef: 'spw-workbench: .spw/state/observable.spw',
    implRef: 'lore.land: README + chapter/home runtime panels',
    probeRef: 'lore.land: section navigation + grammar observatory'
  },
  {
    id: 'c004-pipeline-alignment',
    layer: 'semantics',
    hypothesis: 'Load lifecycle labels should map clearly to pipeline stage semantics.',
    measure: 'Status text keeps a stable mapping between load and runtime stages.',
    falsification: 'Readers cannot infer stage intent from on-screen stage labels.',
    specRef: 'spw-workbench: .spw/surfaces/index.spw#pipeline_stages',
    implRef: 'lore.land: book/scripts/home/app.mjs',
    probeRef: 'lore.land: data-load-stage and runtime status chips'
  }
]);

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

function createClaimItem(claim, announce) {
  const item = document.createElement('li');
  item.className = 'ethos-claim-item';
  item.dataset.layer = claim.layer;
  item.dataset.claimId = claim.id;

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'ethos-claim-handle';
  handle.dataset.spwExpression = 'true';
  handle.textContent = formatExpression('^', `claim/${claim.layer}`, claim.id);
  handle.setAttribute('aria-label', `Inspect claim ${claim.id}`);
  handle.addEventListener('click', () => {
    if (announce) {
      announce(`Claim focus: ${claim.id}.`);
    }
  });

  const hypothesis = document.createElement('p');
  hypothesis.className = 'ethos-claim-line';
  hypothesis.textContent = `Hypothesis: ${claim.hypothesis}`;

  const measure = document.createElement('p');
  measure.className = 'ethos-claim-line';
  measure.textContent = `Measure: ${claim.measure}`;

  const falsification = document.createElement('p');
  falsification.className = 'ethos-claim-line';
  falsification.textContent = `Falsification: ${claim.falsification}`;

  const refs = document.createElement('p');
  refs.className = 'ethos-claim-ref';
  refs.textContent = `${claim.specRef} • ${claim.implRef} • ${claim.probeRef}`;

  item.append(handle, hypothesis, measure, falsification, refs);
  return item;
}

function createOperatorItem(entry) {
  const row = document.createElement('li');
  row.className = 'ethos-operator-item';
  row.dataset.sigil = entry.sigil;
  if (entry.polarity) {
    row.dataset.polarity = entry.polarity;
  }

  const token = document.createElement('span');
  token.className = 'ethos-operator-token';
  token.dataset.spwRole = entry.role;
  if (entry.polarity) {
    token.dataset.spwPolarity = entry.polarity;
  }
  token.textContent = entry.sigil;

  const meta = document.createElement('span');
  meta.className = 'ethos-operator-meta';
  const polarityNote = entry.polarity ? ` • ${entry.polarity}` : '';
  meta.textContent = `${entry.role} • ${entry.phase}${polarityNote}`;

  row.append(token, meta);
  return row;
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

  const panel = document.createElement('section');
  panel.className = className;
  panel.dataset.component = 'spw-ethos';
  panel.dataset.spwComponent = 'spw-ethos';
  panel.dataset.claimLayer = 'all';
  panel.setAttribute('aria-label', titleForContext(context));

  const heading = document.createElement('h2');
  heading.textContent = titleForContext(context);

  const subtitle = document.createElement('p');
  subtitle.className = 'ethos-subtitle';
  subtitle.textContent = subtitleForContext(context);

  const chain = document.createElement('pre');
  chain.className = 'motif-spw ethos-chain';
  chain.dataset.spwExpression = 'true';
  chain.textContent = '^[claim-chain]{ claim -> spec -> impl -> probe }';

  const layerControls = document.createElement('div');
  layerControls.className = 'ethos-layer-switch';
  layerControls.setAttribute('role', 'group');
  layerControls.setAttribute('aria-label', 'Claim layer filter');

  const layerButtons = CLAIM_LAYERS.map((layer) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ethos-layer-button';
    button.dataset.claimLayer = layer.id;
    button.dataset.spwExpression = 'true';
    button.textContent = formatExpression(layer.sigil, 'layer', layer.label);
    button.setAttribute('aria-pressed', layer.id === 'all' ? 'true' : 'false');
    layerControls.append(button);
    return button;
  });

  const claimList = document.createElement('ul');
  claimList.className = 'ethos-claim-list';
  const claimItems = CLAIMS.map((claim) => createClaimItem(claim, announce));
  claimItems.forEach((item) => claimList.append(item));

  const operatorsHeading = document.createElement('h3');
  operatorsHeading.className = 'ethos-operators-heading';
  operatorsHeading.textContent = 'Operator ethos';

  const operatorList = document.createElement('ul');
  operatorList.className = 'ethos-operator-list';
  OPERATOR_ETHOS.forEach((entry) => operatorList.append(createOperatorItem(entry)));

  const status = document.createElement('p');
  status.className = 'ethos-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Ethos ready: waiting for runtime selection.';

  panel.append(heading, subtitle, chain, layerControls, claimList, operatorsHeading, operatorList, status);

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

  const applyLoadStage = (stage, detail = '') => {
    const token = String(stage || '').trim();
    if (!token) {
      return;
    }

    const descriptor = describeLoadStage(token);
    const pipelineStage = descriptor.pipelineStage || 'fallback';
    const precipitateStages = descriptor.precipitates || descriptor.precipitants || [];
    const precipitateText = precipitateStages.length
      ? precipitateStages.join(' + ')
      : 'none';

    panel.dataset.loadStage = token;
    panel.dataset.pipelineStage = pipelineStage;
    panel.dataset.precipitateStages = precipitateStages.join(',');
    panel.dataset.precipitantStages = precipitateStages.join(',');

    const detailSuffix = detail ? ` (${detail})` : '';
    status.textContent =
      `Lifecycle probe: ${formatExpression('%', 'stage', `${token}->${pipelineStage}`)} • ` +
      `${precipitateText}${detailSuffix}`;
  };

  const onSelection = (event) => {
    const detail = event.detail || {};
    const handle = String(detail.handle || '').trim();
    if (!handle) {
      return;
    }
    panel.dataset.lastHandle = handle;
    status.textContent = `Probe update: ${formatExpression('?', 'selection', handle)}`;
  };

  const onSectionChange = (event) => {
    const detail = event.detail || {};
    const index = Number(detail.sectionIndex || 0);
    if (!index) {
      return;
    }
    status.textContent = `Chapter probe: ${formatExpression('&', 'section', `s${String(index).padStart(2, '0')}`)}`;
  };

  const onLoadStage = (event) => {
    const detail = event.detail || {};
    applyLoadStage(detail.stage || '', detail.detail || '');
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
      window.removeEventListener('lore:spw-selection', onSelection);
      window.removeEventListener('lore:ebook-section-change', onSectionChange);
      window.removeEventListener('lore:load-stage', onLoadStage);
      if (observer) {
        observer.disconnect();
      }
      panel.remove();
    }
  };
}
