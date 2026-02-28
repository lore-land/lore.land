/**
 * Cache context helper for style assets.
 * Keeps cache keys expressive (release + story context + optional bust token)
 * while staying readable for future contributors.
 */
export const DEFAULT_CACHE_RELEASE = '2026_02_28.E';
export const DEFAULT_CACHE_CONTEXT = 'canon';

export function getCacheProfile(overrides = {}) {
  const params = new URLSearchParams(window.location.search);
  const root = document.documentElement;

  const release =
    overrides.release ||
    params.get('cache_release') ||
    root.dataset.cacheRelease ||
    DEFAULT_CACHE_RELEASE;

  const context =
    overrides.context ||
    params.get('cache_context') ||
    root.dataset.cacheContext ||
    DEFAULT_CACHE_CONTEXT;

  const bust =
    overrides.bust ||
    params.get('cache_bust') ||
    root.dataset.cacheBust ||
    '';

  return { release, context, bust };
}

export function withCacheContext(path, options = {}) {
  if (!path) {
    return '';
  }

  const { release, context, bust } = getCacheProfile(options);
  const channel = options.channel || 'core';
  const scopedContext = options.scopedContext || `${context}:${channel}`;
  const target = new URL(path, window.location.origin);

  target.searchParams.set('v', release);
  target.searchParams.set('ctx', scopedContext);

  if (bust) {
    target.searchParams.set('b', bust);
  }

  return `${target.pathname}${target.search}`;
}
