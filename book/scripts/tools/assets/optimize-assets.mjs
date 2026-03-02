#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '../../../../');

const DEFAULT_SOURCES = ['book/images', 'book/media', 'book/pwa/icons', 'seeds'];
const DEFAULT_OUT_DIR = 'dist/assets/microbundles';
const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1600, 2048];
const DEFAULT_QUALITY = 82;
const DEFAULT_PREVIEW_WIDTH = 32;

const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const SVG_EXTENSION = '.svg';

const DEFAULT_FALLBACK_PALETTE = [
  '#f3ede1',
  '#d9ccb7',
  '#bfa27f',
  '#8f6f56',
  '#5c4f47',
  '#35445c',
  '#4e6683',
  '#9aa9bf'
];

const argv = process.argv.slice(2);
const options = parseArgs(argv);
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lore-assets-'));

try {
  ensureCommand('sips');
  ensureCommand('cwebp');

  if (options.clean && !options.dryRun) {
    await fs.rm(options.outDirAbs, { recursive: true, force: true });
  }

  const files = await collectAssetFiles(options.sourcesAbs);
  const assets = files.filter((file) => !isIgnoredPath(file));
  const rasterFiles = assets.filter((file) => RASTER_EXTENSIONS.has(path.extname(file).toLowerCase()));
  const svgFiles = assets.filter((file) => path.extname(file).toLowerCase() === SVG_EXTENSION);

  const bundleEntries = [];
  const paletteEntries = [];

  let totalInputBytes = 0;
  let totalOutputBytes = 0;
  let rasterCount = 0;
  let svgCount = 0;

  for (const file of rasterFiles) {
    const outcome = await processRasterAsset(file, options, tempDir);
    if (!outcome) {
      continue;
    }

    rasterCount += 1;
    totalInputBytes += outcome.inputBytes;
    totalOutputBytes += outcome.outputBytes;
    bundleEntries.push(outcome.bundleEntry);
    paletteEntries.push({ key: outcome.bundleEntry.key, color: outcome.bundleEntry.fallbackColor });
  }

  for (const file of svgFiles) {
    const outcome = await processSvgAsset(file, options);
    if (!outcome) {
      continue;
    }

    svgCount += 1;
    totalInputBytes += outcome.inputBytes;
    totalOutputBytes += outcome.outputBytes;
    bundleEntries.push(outcome.bundleEntry);
    paletteEntries.push({ key: outcome.bundleEntry.key, color: outcome.bundleEntry.fallbackColor });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    dryRun: options.dryRun,
    sources: options.sources,
    outDir: options.outDir,
    widths: options.widths,
    quality: options.quality,
    previewWidth: options.previewWidth,
    assets: bundleEntries.length,
    rasterAssets: rasterCount,
    svgAssets: svgCount,
    inputBytes: totalInputBytes,
    outputBytes: options.dryRun ? null : totalOutputBytes,
    savingsBytes: options.dryRun ? null : Math.max(totalInputBytes - totalOutputBytes, 0),
    savingsPercent: options.dryRun
      ? null
      : (totalInputBytes > 0
        ? Number((((totalInputBytes - totalOutputBytes) / totalInputBytes) * 100).toFixed(2))
        : 0)
  };

  const indexRecord = {
    ...summary,
    bundles: bundleEntries.map((entry) => ({
      key: entry.key,
      type: entry.type,
      source: entry.source,
      bundlePath: entry.bundlePath,
      fallbackColor: entry.fallbackColor
    }))
  };

  if (!options.dryRun) {
    await fs.mkdir(options.bundleDirAbs, { recursive: true });
    await fs.writeFile(
      path.join(options.outDirAbs, 'index.json'),
      `${JSON.stringify(indexRecord, null, 2)}\n`,
      'utf8'
    );

    await fs.writeFile(
      path.join(options.outDirAbs, 'palette-fallbacks.css'),
      `${buildPaletteCss(paletteEntries)}\n`,
      'utf8'
    );
  }

  printSummary(summary);
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

function parseArgs(args) {
  let usingDefaultSources = true;
  const options = {
    dryRun: false,
    clean: false,
    outDir: DEFAULT_OUT_DIR,
    quality: DEFAULT_QUALITY,
    previewWidth: DEFAULT_PREVIEW_WIDTH,
    widths: [...DEFAULT_WIDTHS],
    sources: [...DEFAULT_SOURCES]
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (token === '--clean') {
      options.clean = true;
      continue;
    }
    if (token === '--out-dir') {
      const value = args[i + 1];
      if (!value) {
        fail('Missing value for --out-dir');
      }
      options.outDir = value;
      i += 1;
      continue;
    }
    if (token === '--source') {
      const value = args[i + 1];
      if (!value) {
        fail('Missing value for --source');
      }
      if (usingDefaultSources) {
        options.sources = [];
        usingDefaultSources = false;
      }
      options.sources.push(value);
      i += 1;
      continue;
    }
    if (token === '--quality') {
      const value = Number(args[i + 1]);
      if (!Number.isFinite(value) || value <= 0 || value > 100) {
        fail('Invalid value for --quality. Expected 1-100.');
      }
      options.quality = Math.round(value);
      i += 1;
      continue;
    }
    if (token === '--preview-width') {
      const value = Number(args[i + 1]);
      if (!Number.isFinite(value) || value < 8) {
        fail('Invalid value for --preview-width. Expected >= 8.');
      }
      options.previewWidth = Math.round(value);
      i += 1;
      continue;
    }
    if (token === '--widths') {
      const value = args[i + 1];
      if (!value) {
        fail('Missing value for --widths');
      }
      const widths = value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((part) => Number.isFinite(part) && part > 0)
        .map((part) => Math.round(part));
      if (!widths.length) {
        fail('Invalid value for --widths. Expected comma-separated positive integers.');
      }
      options.widths = [...new Set(widths)].sort((a, b) => a - b);
      i += 1;
      continue;
    }
    if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    }

    fail(`Unknown argument: ${token}`);
  }

  options.outDirAbs = path.resolve(REPO_ROOT, options.outDir);
  options.bundleDirAbs = path.join(options.outDirAbs, 'bundles');
  options.imageDirAbs = path.join(options.outDirAbs, 'images');
  options.svgDirAbs = path.join(options.outDirAbs, 'svg');
  options.sourcesAbs = options.sources.map((value) => path.resolve(REPO_ROOT, value));

  return options;
}

function printHelp() {
  console.log(`Usage: node book/scripts/tools/assets/optimize-assets.mjs [options]

Options:
  --dry-run                Scan and report without writing files
  --clean                  Remove output directory before writing
  --out-dir <path>         Output directory (default: ${DEFAULT_OUT_DIR})
  --source <path>          Source directory (repeatable; overrides defaults when used)
  --widths <csv>           Responsive widths, e.g. 320,640,960,1280
  --quality <1-100>        WebP quality (default: ${DEFAULT_QUALITY})
  --preview-width <px>     LQIP width (default: ${DEFAULT_PREVIEW_WIDTH})
  --help                   Show this help message
`);
}

function fail(message) {
  console.error(`[assets] ${message}`);
  process.exit(1);
}

function ensureCommand(command) {
  const result = spawnSync('which', [command], { encoding: 'utf8' });
  if (result.status !== 0) {
    fail(`Required command not found: ${command}`);
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    input: options.input ?? undefined
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    throw new Error(
      `Command failed: ${command} ${args.join(' ')}\n${stderr || stdout || 'No output.'}`
    );
  }
  return result.stdout || '';
}

function isIgnoredPath(filePath) {
  const rel = normalizePath(path.relative(REPO_ROOT, filePath));
  if (!rel || rel.startsWith('..')) {
    return true;
  }
  return (
    rel.startsWith('.git/') ||
    rel.startsWith('node_modules/') ||
    rel.startsWith('dist/') ||
    rel.startsWith('.spw/')
  );
}

async function collectAssetFiles(sourceDirectories) {
  const files = [];
  for (const dir of sourceDirectories) {
    if (!existsSync(dir)) {
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const discovered = await walkFiles(dir);
    files.push(...discovered);
  }
  return files;
}

async function walkFiles(rootDir) {
  const stack = [rootDir];
  const files = [];

  while (stack.length) {
    const current = stack.pop();
    // eslint-disable-next-line no-await-in-loop
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (RASTER_EXTENSIONS.has(ext) || ext === SVG_EXTENSION) {
        files.push(absolute);
      }
    }
  }

  return files.sort();
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function toAssetKey(relativePath) {
  return relativePath
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-+|-+$)/g, '')
    .toLowerCase();
}

function fallbackColorFromPath(relativePath) {
  const hash = createHash('sha1').update(relativePath).digest();
  const index = hash[0] % DEFAULT_FALLBACK_PALETTE.length;
  return DEFAULT_FALLBACK_PALETTE[index];
}

function readDimensions(filePath) {
  const output = runCommand('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath]);
  const widthMatch = output.match(/pixelWidth:\s+(\d+)/);
  const heightMatch = output.match(/pixelHeight:\s+(\d+)/);
  if (!widthMatch || !heightMatch) {
    throw new Error(`Unable to read dimensions from ${filePath}`);
  }
  return {
    width: Number(widthMatch[1]),
    height: Number(heightMatch[1])
  };
}

function chooseWidths(originalWidth, widths) {
  const picked = widths.filter((value) => value < originalWidth);
  picked.push(originalWidth);
  return [...new Set(picked)].sort((a, b) => a - b);
}

async function processRasterAsset(filePath, options, tempRoot) {
  const rel = normalizePath(path.relative(REPO_ROOT, filePath));
  const key = toAssetKey(rel);
  const sourceStat = await fs.stat(filePath);
  const dimensions = readDimensions(filePath);
  const variantWidths = chooseWidths(dimensions.width, options.widths);
  const previewWidth = Math.min(options.previewWidth, dimensions.width);
  const imageBase = path.basename(filePath, path.extname(filePath));
  const relDir = normalizePath(path.dirname(rel));
  const fallbackColor = fallbackColorFromPath(rel);

  let outputBytes = 0;
  const variants = [];

  for (const width of variantWidths) {
    const outPathAbs = path.join(options.imageDirAbs, relDir, `${imageBase}.${width}.webp`);
    const outPathRel = normalizePath(path.relative(REPO_ROOT, outPathAbs));

    if (!options.dryRun) {
      await fs.mkdir(path.dirname(outPathAbs), { recursive: true });
      const tempPng = path.join(tempRoot, `${createHash('sha1').update(`${rel}:${width}`).digest('hex')}.png`);

      runCommand('sips', ['-s', 'format', 'png', '-Z', String(width), filePath, '--out', tempPng]);
      runCommand('cwebp', ['-quiet', '-mt', '-q', String(options.quality), tempPng, '-o', outPathAbs]);
      await fs.rm(tempPng, { force: true });
    }

    const bytes = options.dryRun
      ? 0
      : (await fs.stat(outPathAbs)).size;

    outputBytes += bytes;
    variants.push({
      width,
      format: 'webp',
      path: `/${outPathRel}`,
      bytes
    });
  }

  let preview = null;
  if (previewWidth > 0) {
    const previewPathAbs = path.join(options.imageDirAbs, relDir, `${imageBase}.preview.webp`);
    const previewPathRel = normalizePath(path.relative(REPO_ROOT, previewPathAbs));

    if (!options.dryRun) {
      await fs.mkdir(path.dirname(previewPathAbs), { recursive: true });
      const tempPng = path.join(tempRoot, `${createHash('sha1').update(`${rel}:preview`).digest('hex')}.png`);
      runCommand('sips', ['-s', 'format', 'png', '-Z', String(previewWidth), filePath, '--out', tempPng]);
      runCommand('cwebp', ['-quiet', '-mt', '-q', String(Math.max(options.quality - 16, 25)), tempPng, '-o', previewPathAbs]);
      await fs.rm(tempPng, { force: true });
    }

    const previewBytes = options.dryRun
      ? 0
      : (await fs.stat(previewPathAbs)).size;

    outputBytes += previewBytes;
    preview = {
      width: previewWidth,
      format: 'webp',
      path: `/${previewPathRel}`,
      bytes: previewBytes
    };
  }

  const bundle = {
    key,
    type: 'raster',
    source: `/${rel}`,
    sourceBytes: sourceStat.size,
    dimensions,
    fallbackColor,
    preview,
    variants
  };

  const bundlePathAbs = path.join(options.bundleDirAbs, `${key}.json`);
  const bundlePathRel = normalizePath(path.relative(REPO_ROOT, bundlePathAbs));

  if (!options.dryRun) {
    await fs.mkdir(options.bundleDirAbs, { recursive: true });
    await fs.writeFile(bundlePathAbs, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  }

  return {
    inputBytes: sourceStat.size,
    outputBytes,
    bundleEntry: {
      ...bundle,
      bundlePath: `/${bundlePathRel}`
    }
  };
}

function minifySvg(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractSvgColors(svg) {
  const seen = new Set();
  const colors = [];
  const regex = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  let match = regex.exec(svg);
  while (match) {
    const value = match[0].toLowerCase();
    if (!seen.has(value)) {
      seen.add(value);
      colors.push(value);
    }
    match = regex.exec(svg);
  }
  return colors;
}

async function processSvgAsset(filePath, options) {
  const rel = normalizePath(path.relative(REPO_ROOT, filePath));
  const key = toAssetKey(rel);
  const sourceText = await fs.readFile(filePath, 'utf8');
  const sourceStat = await fs.stat(filePath);

  const optimized = minifySvg(sourceText);
  const colors = extractSvgColors(optimized);
  const fallbackColor = colors[0] || fallbackColorFromPath(rel);
  const relDir = normalizePath(path.dirname(rel));
  const base = path.basename(filePath, SVG_EXTENSION);
  const outPathAbs = path.join(options.svgDirAbs, relDir, `${base}.min.svg`);
  const outPathRel = normalizePath(path.relative(REPO_ROOT, outPathAbs));

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(outPathAbs), { recursive: true });
    await fs.writeFile(outPathAbs, `${optimized}\n`, 'utf8');
  }

  const outputBytes = options.dryRun
    ? 0
    : (await fs.stat(outPathAbs)).size;

  const bundle = {
    key,
    type: 'svg',
    source: `/${rel}`,
    sourceBytes: sourceStat.size,
    fallbackColor,
    colors,
    optimized: {
      path: `/${outPathRel}`,
      bytes: outputBytes
    }
  };

  const bundlePathAbs = path.join(options.bundleDirAbs, `${key}.json`);
  const bundlePathRel = normalizePath(path.relative(REPO_ROOT, bundlePathAbs));

  if (!options.dryRun) {
    await fs.mkdir(options.bundleDirAbs, { recursive: true });
    await fs.writeFile(bundlePathAbs, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  }

  return {
    inputBytes: sourceStat.size,
    outputBytes,
    bundleEntry: {
      ...bundle,
      bundlePath: `/${bundlePathRel}`
    }
  };
}

function buildPaletteCss(entries) {
  const unique = [];
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || !entry.key || !entry.color) {
      continue;
    }
    if (seen.has(entry.key)) {
      continue;
    }
    seen.add(entry.key);
    unique.push(entry);
  }

  const lines = [
    ':root {',
    '  --asset-fallback-default: #f3ede1;',
    '}',
    '',
    '[data-asset-fallback] {',
    '  background-color: var(--asset-fallback, var(--asset-fallback-default));',
    '}',
    ''
  ];

  for (const entry of unique.sort((a, b) => a.key.localeCompare(b.key))) {
    lines.push(`.asset-${entry.key} { --asset-fallback: ${entry.color}; }`);
  }

  return lines.join('\n');
}

function printSummary(summary) {
  const savingsMiB = summary.savingsBytes == null ? null : summary.savingsBytes / (1024 * 1024);
  const inMiB = summary.inputBytes / (1024 * 1024);
  const outMiB = summary.outputBytes == null ? null : summary.outputBytes / (1024 * 1024);

  console.log(`[assets] mode: ${summary.dryRun ? 'dry-run' : 'write'}`);
  console.log(`[assets] sources: ${summary.sources.join(', ')}`);
  console.log(`[assets] output: ${summary.outDir}`);
  console.log(
    `[assets] assets: ${summary.assets} (raster ${summary.rasterAssets}, svg ${summary.svgAssets})`
  );
  if (summary.dryRun) {
    console.log(
      `[assets] bytes: input ${summary.inputBytes} (${inMiB.toFixed(2)} MiB), ` +
      'output [skipped in dry-run], savings [skipped in dry-run]'
    );
    return;
  }

  console.log(
    `[assets] bytes: input ${summary.inputBytes} (${inMiB.toFixed(2)} MiB), ` +
    `output ${summary.outputBytes} (${outMiB.toFixed(2)} MiB), ` +
    `savings ${summary.savingsBytes} (${savingsMiB.toFixed(2)} MiB, ${summary.savingsPercent}%)`
  );
}
