const STYLE_LIBRARY = Object.freeze({
  default: Object.freeze({
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceStrong: 'rgba(255, 255, 255, 0.9)',
    accent: 'rgba(38, 88, 124, 0.72)',
    outline: 'rgba(38, 88, 124, 0.36)',
    glow: 'rgba(38, 88, 124, 0.22)'
  }),
  boon: Object.freeze({
    surface: 'rgba(140, 214, 175, 0.2)',
    surfaceStrong: 'rgba(140, 214, 175, 0.32)',
    accent: 'rgba(58, 124, 88, 0.76)',
    outline: 'rgba(58, 124, 88, 0.34)',
    glow: 'rgba(140, 214, 175, 0.28)'
  }),
  paradox: Object.freeze({
    surface: 'rgba(249, 189, 147, 0.18)',
    surfaceStrong: 'rgba(249, 189, 147, 0.28)',
    accent: 'rgba(138, 86, 56, 0.8)',
    outline: 'rgba(138, 86, 56, 0.36)',
    glow: 'rgba(249, 189, 147, 0.3)'
  }),
  game: Object.freeze({
    surface: 'rgba(134, 212, 245, 0.18)',
    surfaceStrong: 'rgba(134, 212, 245, 0.3)',
    accent: 'rgba(31, 92, 121, 0.82)',
    outline: 'rgba(31, 92, 121, 0.34)',
    glow: 'rgba(134, 212, 245, 0.28)'
  }),
  puzzle: Object.freeze({
    surface: 'rgba(245, 208, 122, 0.18)',
    surfaceStrong: 'rgba(245, 208, 122, 0.3)',
    accent: 'rgba(125, 92, 30, 0.82)',
    outline: 'rgba(125, 92, 30, 0.34)',
    glow: 'rgba(245, 208, 122, 0.3)'
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

  return () => {
    delete component.dataset.spwStyleLibrary;
    component.style.removeProperty('--spw-runtime-surface');
    component.style.removeProperty('--spw-runtime-surface-strong');
    component.style.removeProperty('--spw-runtime-accent');
    component.style.removeProperty('--spw-runtime-outline');
    component.style.removeProperty('--spw-runtime-glow');
  };
}
