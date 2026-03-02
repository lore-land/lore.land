const TOP_LEVEL_CONTENT_ROOTS = new Set([
  'book',
  'characters',
  'charm',
  'js',
  'magic',
  'seeds',
  '.spw',
  'vendor',
  'index.html',
  'manifest.webmanifest',
  'sw.js'
]);

const SPW_PREFIX = 'spw/';
const WORKBENCH_ROOT = '/magic/spw/workbench';

let cachedBasePath = null;

function splitPathTokens(path) {
  const hashIndex = path.indexOf('#');
  const queryIndex = path.indexOf('?');
  const splitIndex =
    hashIndex >= 0 && queryIndex >= 0
      ? Math.min(hashIndex, queryIndex)
      : Math.max(hashIndex, queryIndex);

  if (splitIndex < 0) {
    return { pathname: path, suffix: '' };
  }

  return {
    pathname: path.slice(0, splitIndex),
    suffix: path.slice(splitIndex)
  };
}

function normalizeBasePath(raw) {
  const value = String(raw || '').trim();
  if (!value || value === '/') {
    return '';
  }

  let pathname = value;

  if (/^[a-z]+:\/\//i.test(value)) {
    try {
      pathname = new URL(value).pathname || '/';
    } catch {
      pathname = value;
    }
  }

  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }

  pathname = pathname.replace(/\/index\.html?$/i, '/');
  pathname = pathname.replace(/\/+$/, '');
  return pathname === '/' ? '' : pathname;
}

function readExplicitBasePath() {
  if (typeof document === 'undefined') {
    return '';
  }

  const root = document.documentElement;
  const hinted =
    root?.dataset?.spwBasePath ||
    root?.dataset?.spwBase ||
    root?.dataset?.siteBase ||
    root?.dataset?.basePath ||
    '';

  if (hinted) {
    return normalizeBasePath(hinted);
  }

  const meta = document.querySelector(
    'meta[name="spw-base-path"], meta[name="site-base"], meta[name="base-path"]'
  );
  if (meta?.content) {
    return normalizeBasePath(meta.content);
  }

  const baseTag = document.querySelector('base[href]');
  if (baseTag?.getAttribute('href')) {
    return normalizeBasePath(baseTag.getAttribute('href'));
  }

  return '';
}

function inferGithubPagesBasePath() {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname || '';
  if (!/github\.io$/i.test(hostname)) {
    return '';
  }

  const pathname = window.location.pathname || '/';
  const firstSegment = pathname.split('/').filter(Boolean)[0] || '';

  if (!firstSegment || TOP_LEVEL_CONTENT_ROOTS.has(firstSegment) || firstSegment.includes('.')) {
    return '';
  }

  return normalizeBasePath(`/${firstSegment}`);
}

function collapseSlashes(path) {
  return String(path || '').replace(/\/{2,}/g, '/');
}

export function getSiteBasePath(options = {}) {
  if (options.refresh) {
    cachedBasePath = null;
  }

  if (cachedBasePath != null) {
    return cachedBasePath;
  }

  const explicit = readExplicitBasePath();
  cachedBasePath = explicit || inferGithubPagesBasePath() || '';
  return cachedBasePath;
}

export function withSiteBase(href) {
  const value = String(href || '').trim();
  if (!value) {
    return '';
  }

  if (
    /^[a-z]+:/i.test(value) ||
    value.startsWith('//') ||
    value.startsWith('#') ||
    value.startsWith('?') ||
    !value.startsWith('/')
  ) {
    return value;
  }

  const basePath = getSiteBasePath();
  if (!basePath || value === basePath || value.startsWith(`${basePath}/`)) {
    return value;
  }

  return collapseSlashes(`${basePath}${value}`);
}

export function stripSiteBase(pathname) {
  const value = String(pathname || '').trim();
  if (!value) {
    return '/';
  }

  const normalized = value.startsWith('/') ? value : `/${value}`;
  const basePath = getSiteBasePath();
  if (!basePath) {
    return normalized;
  }

  if (normalized === basePath) {
    return '/';
  }

  if (normalized.startsWith(`${basePath}/`)) {
    const stripped = normalized.slice(basePath.length);
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }

  return normalized;
}

function ensureSpwSuffix(path) {
  const { pathname, suffix } = splitPathTokens(path);
  if (/\.spw$/i.test(pathname) || /\.[a-z0-9]+$/i.test(pathname)) {
    return path;
  }

  const normalizedPath = pathname.endsWith('/')
    ? `${pathname}index.spw`
    : `${pathname}.spw`;
  return `${normalizedPath}${suffix}`;
}

function normalizeSpwAlias(source) {
  const normalized = String(source || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    return '/.spw/index';
  }

  if (/^\d{1,2}$/.test(normalized)) {
    return `/.spw/chapters/${normalized.padStart(2, '0')}`;
  }

  const chapterIndexMatch = normalized.match(/^chapters?\/(\d{1,2})$/i);
  if (chapterIndexMatch) {
    return `/.spw/chapters/${chapterIndexMatch[1].padStart(2, '0')}`;
  }

  if (normalized.startsWith('chapter/')) {
    return `/.spw/chapters/${normalized.slice('chapter/'.length)}`;
  }

  if (normalized.startsWith('chapters/')) {
    return `/.spw/${normalized}`;
  }

  return `/.spw/${normalized}`;
}

function normalizeWorkbenchAlias(source) {
  const normalized = String(source || '').replace(/^\/+|\/+$/g, '');
  const relative = normalized
    .replace(/^_workbench\/?/i, '')
    .replace(/^workbench\/?/i, '')
    .replace(/^workbench:/i, '');
  return collapseSlashes(`${WORKBENCH_ROOT}/${relative || '.spw/index'}`);
}

export function normalizeSpwSource(rawSource) {
  const source = String(rawSource || '').trim();
  if (!source) {
    return '';
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  if (source.startsWith('/') || source.startsWith('./') || source.startsWith('../')) {
    return source.startsWith('/')
      ? withSiteBase(ensureSpwSuffix(source))
      : ensureSpwSuffix(source);
  }

  if (source === 'spw' || source === '.spw' || source === '/.spw') {
    return withSiteBase('/.spw/index.spw');
  }

  if (source.startsWith('_workbench/') || source.startsWith('workbench/') || source.startsWith('workbench:')) {
    return withSiteBase(ensureSpwSuffix(normalizeWorkbenchAlias(source)));
  }

  if (source.startsWith(SPW_PREFIX)) {
    return withSiteBase(ensureSpwSuffix(`/.spw/${source.slice(SPW_PREFIX.length)}`));
  }

  if (source.startsWith('.spw/')) {
    return withSiteBase(ensureSpwSuffix(`/${source.replace(/^\/+/, '')}`));
  }

  return withSiteBase(ensureSpwSuffix(normalizeSpwAlias(source)));
}

export function summarizeSpwPath(path) {
  const value = String(path || '').trim();
  if (!value) {
    return '';
  }

  const tokens = value
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean);

  if (!tokens.length) {
    return value;
  }

  if (tokens.length <= 3) {
    return tokens.join('/');
  }

  return `${tokens.slice(-3).join('/')}`;
}

export function resolvePathRefHref(pathRef) {
  const normalized = String(pathRef || '').replace(/^@/, '').trim();
  if (!normalized) {
    return withSiteBase('/');
  }

  if (
    normalized.startsWith('spw/') ||
    normalized.startsWith('.spw/') ||
    normalized === 'spw' ||
    normalized === '.spw' ||
    normalized.startsWith('_workbench/') ||
    normalized.startsWith('workbench/') ||
    normalized.startsWith('workbench:')
  ) {
    return normalizeSpwSource(normalized);
  }

  if (normalized.startsWith('book/')) {
    return withSiteBase(`/${normalized}`);
  }

  if (normalized.startsWith('chapter/')) {
    return withSiteBase(`/book/${normalized.replace(/\/$/, '')}/`);
  }

  return withSiteBase(`/${normalized}`);
}

export function currentCanonFileHref(pathname = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
  const localPathname = stripSiteBase(pathname || '/');
  const chapterMatch = localPathname.match(/\/book\/chapter\/(\d{2})\//);
  if (chapterMatch) {
    return normalizeSpwSource(`chapters/${chapterMatch[1]}`);
  }

  if (localPathname === '/' || localPathname.endsWith('/index.html')) {
    return normalizeSpwSource('chapters/index');
  }

  return normalizeSpwSource('index');
}
