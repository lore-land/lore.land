const STYLE_LIBRARY = Object.freeze({
  default: Object.freeze({
    surface: 'color-mix(in srgb, var(--theme-paper, #ffffff) 80%, transparent 20%)',
    surfaceStrong: 'color-mix(in srgb, var(--theme-paper, #ffffff) 92%, transparent 8%)',
    accent: 'color-mix(in srgb, var(--theme-accent-main, #2a6f7f) 74%, #163848 26%)',
    outline: 'color-mix(in srgb, var(--theme-accent-main, #2a6f7f) 36%, transparent 64%)',
    glow: 'color-mix(in srgb, var(--theme-accent-main, #2a6f7f) 24%, transparent 76%)',
    ink: 'color-mix(in srgb, var(--theme-accent-alt, #1c4f63) 70%, var(--theme-text-main, #1a2233) 30%)',
    chip: 'color-mix(in srgb, var(--theme-paper, #ffffff) 72%, var(--theme-accent-main, #2a6f7f) 28%)',
    chipStrong: 'color-mix(in srgb, var(--theme-paper, #ffffff) 58%, var(--theme-accent-main, #2a6f7f) 42%)',
    depth: '0'
  }),
  boon: Object.freeze({
    surface: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 24%, var(--theme-paper, #ffffff) 76%)',
    surfaceStrong: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 36%, var(--theme-paper, #ffffff) 64%)',
    accent: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 68%, #214b33 32%)',
    outline: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 42%, transparent 58%)',
    glow: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 30%, transparent 70%)',
    ink: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 65%, var(--theme-text-main, #1a2233) 35%)',
    chip: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 34%, var(--theme-paper, #ffffff) 66%)',
    chipStrong: 'color-mix(in srgb, var(--spw-color-ground, #7cb87e) 45%, var(--theme-paper, #ffffff) 55%)',
    depth: '1'
  }),
  paradox: Object.freeze({
    surface: 'color-mix(in srgb, var(--spw-color-potential, #ffb07a) 24%, var(--theme-paper, #ffffff) 76%)',
    surfaceStrong: 'color-mix(in srgb, var(--spw-color-action, #ff8a8a) 24%, var(--theme-paper, #ffffff) 76%)',
    accent: 'color-mix(in srgb, var(--spw-color-potential, #ffb07a) 58%, #6b2f26 42%)',
    outline: 'color-mix(in srgb, var(--spw-color-action, #ff8a8a) 44%, transparent 56%)',
    glow: 'color-mix(in srgb, var(--spw-color-action, #ff8a8a) 30%, transparent 70%)',
    ink: 'color-mix(in srgb, var(--spw-color-potential, #ffb07a) 58%, var(--theme-text-main, #1a2233) 42%)',
    chip: 'color-mix(in srgb, var(--spw-color-action, #ff8a8a) 28%, var(--theme-paper, #ffffff) 72%)',
    chipStrong: 'color-mix(in srgb, var(--spw-color-potential, #ffb07a) 36%, var(--theme-paper, #ffffff) 64%)',
    depth: '1'
  }),
  game: Object.freeze({
    surface: 'color-mix(in srgb, var(--spw-color-probe, #9fd8ff) 24%, var(--theme-paper, #ffffff) 76%)',
    surfaceStrong: 'color-mix(in srgb, var(--spw-color-confluence, #86d4f5) 30%, var(--theme-paper, #ffffff) 70%)',
    accent: 'color-mix(in srgb, var(--spw-color-probe, #9fd8ff) 62%, #12415c 38%)',
    outline: 'color-mix(in srgb, var(--spw-color-confluence, #86d4f5) 44%, transparent 56%)',
    glow: 'color-mix(in srgb, var(--spw-color-probe, #9fd8ff) 30%, transparent 70%)',
    ink: 'color-mix(in srgb, var(--spw-color-probe, #9fd8ff) 58%, var(--theme-text-main, #1a2233) 42%)',
    chip: 'color-mix(in srgb, var(--spw-color-probe, #9fd8ff) 30%, var(--theme-paper, #ffffff) 70%)',
    chipStrong: 'color-mix(in srgb, var(--spw-color-confluence, #86d4f5) 40%, var(--theme-paper, #ffffff) 60%)',
    depth: '2'
  }),
  puzzle: Object.freeze({
    surface: 'color-mix(in srgb, var(--spw-color-perspective, #f5d07a) 24%, var(--theme-paper, #ffffff) 76%)',
    surfaceStrong: 'color-mix(in srgb, var(--spw-color-value, #c8e6a0) 28%, var(--theme-paper, #ffffff) 72%)',
    accent: 'color-mix(in srgb, var(--spw-color-perspective, #f5d07a) 64%, #5b4716 36%)',
    outline: 'color-mix(in srgb, var(--spw-color-value, #c8e6a0) 42%, transparent 58%)',
    glow: 'color-mix(in srgb, var(--spw-color-perspective, #f5d07a) 32%, transparent 68%)',
    ink: 'color-mix(in srgb, var(--spw-color-perspective, #f5d07a) 58%, var(--theme-text-main, #1a2233) 42%)',
    chip: 'color-mix(in srgb, var(--spw-color-perspective, #f5d07a) 30%, var(--theme-paper, #ffffff) 70%)',
    chipStrong: 'color-mix(in srgb, var(--spw-color-value, #c8e6a0) 38%, var(--theme-paper, #ffffff) 62%)',
    depth: '2'
  })
});

const TAG_TO_STYLE = Object.freeze({
  'custom-boof': 'boon',
  'custom-boonberry': 'boon',
  'custom-echo': 'boon',
  'custom-song': 'boon',
  'custom-fool': 'paradox',
  'custom-paradox': 'paradox',
  'custom-shadow': 'paradox',
  'custom-game': 'game',
  'custom-puzzle': 'puzzle'
});

function resolveStyleId(component, requestedStyle = '') {
  const normalizedRequested = String(requestedStyle || '').trim().toLowerCase();
  if (normalizedRequested && STYLE_LIBRARY[normalizedRequested]) {
    return normalizedRequested;
  }

  const explicit = String(component.dataset.spwStyle || '').trim().toLowerCase();
  if (explicit && STYLE_LIBRARY[explicit]) {
    return explicit;
  }

  const byTag = TAG_TO_STYLE[component.tagName.toLowerCase()];
  if (byTag && STYLE_LIBRARY[byTag]) {
    return byTag;
  }

  return 'default';
}

export function applySpwStyleLibrary(component, requestedStyle = '') {
  const styleId = resolveStyleId(component, requestedStyle);
  const styleToken = STYLE_LIBRARY[styleId] || STYLE_LIBRARY.default;

  component.dataset.spwStyleLibrary = styleId;
  component.style.setProperty('--spw-runtime-surface', styleToken.surface);
  component.style.setProperty('--spw-runtime-surface-strong', styleToken.surfaceStrong);
  component.style.setProperty('--spw-runtime-accent', styleToken.accent);
  component.style.setProperty('--spw-runtime-outline', styleToken.outline);
  component.style.setProperty('--spw-runtime-glow', styleToken.glow);
  component.style.setProperty('--spw-runtime-ink', styleToken.ink);
  component.style.setProperty('--spw-runtime-chip', styleToken.chip);
  component.style.setProperty('--spw-runtime-chip-strong', styleToken.chipStrong);
  component.style.setProperty('--spw-runtime-style-depth', styleToken.depth);

  return () => {
    delete component.dataset.spwStyleLibrary;
    component.style.removeProperty('--spw-runtime-surface');
    component.style.removeProperty('--spw-runtime-surface-strong');
    component.style.removeProperty('--spw-runtime-accent');
    component.style.removeProperty('--spw-runtime-outline');
    component.style.removeProperty('--spw-runtime-glow');
    component.style.removeProperty('--spw-runtime-ink');
    component.style.removeProperty('--spw-runtime-chip');
    component.style.removeProperty('--spw-runtime-chip-strong');
    component.style.removeProperty('--spw-runtime-style-depth');
  };
}
