# CLAUDE.md

lore.land — a worldbuilding monument: seeded chapters, inspectable craft, a living serial. Browser-native JS modules + CSS layers, no bundler at runtime (Vite only for the production build step), deployed to GitHub Pages.

Canon lives in `.spw/` — read `.spw/index.spw` first when you need to find a surface. Authoring conventions and the `spw:*` tooling gotchas are in `.spw/CLAUDE.md` (loads when working under `.spw/`); the in-browser Spw reader is documented in `book/scripts/modules/CLAUDE.md`.

CI (`.github/workflows/ci.yml`) is verification only, no deploy step — Pages serves the `main` branch root directly; there's no `dist`-based or `gh-pages` deploy to trigger.

## Open work

Open work is in `.spw/index.spw` `~direction` and in `npm run spw:plans`, whose first line is the next stone.

## Share cards and icons

Chapter share images are cards, not raw plates.

- `npm run assets:brand` (`book/scripts/tools/assets/brand-assets.mjs`) sets each public plate (`book/images/NN.png`) in the cover type into `book/images/og/chapter-NN.jpg` (1200×630) and rebuilds the PWA icons from the bud sigil. `-- --og` makes only the cards, `-- --og --chapters=14,15` only those cards, `-- --icons` only the icons.
- Each card and each rebuilt icon keeps a `.spw` sidecar beside the file (description and mutations). `npm run assets:brand -- --sidecars` rewrites the sidecars from chapter JSON without ImageMagick.
- The picture pass is authoring-time only (needs `magick`, `rsvg-convert`, macOS Georgia); outputs are committed.
- Re-run after a title, "in which" line, plate or sigil changes, then `npm run chapters:build`.
- `spw:probes` `plate_weight` holds cards to the 100KB floor. Dark plates need the higher JPEG quality the tool uses.

## Before calling work done

Run `npm run check`. It runs what CI runs and stops at the first failure. It writes no dated audit. If a generated file was stale it regenerates it and fails, so look at the diff.

Passing checks do not show that something plays or reads right.

- `book:check` counts a trope as winding if its `wired` string exists, so exercise the crossing itself.
- `npm run smoke` drives the real pages in headless Chrome (`vite dev` proves nothing about deployment). It needs Chrome, so it is not in CI. `SMOKE_ONLY=<pattern> npm run smoke` runs only the scenarios whose names match.
- Add a scenario when something passes every check while being wrong.
- A new player's story cards stop the game clock, so confirm time advances before trusting a run.
- Sound can be measured but not judged; say so if nobody has listened.

## Releasing

1. Set the token (`YYYY_MM_DD.X`) in `DEFAULT_CACHE_RELEASE` (`book/scripts/modules/cache-context.mjs`), `RELEASE` (`book/scripts/tools/build-chapters.mjs`), `CACHE_VERSION` (`sw.js`) and `README.md`.
2. Add a plain-words entry to `book/content/changes.json`.
3. Run `npm run tokens:align` until `-- --check` passes. A first pass can widen what counts as changed.
4. Run `npm run chapters:build`.

Setting a new chapter (a stone) has its own list in `.spw/index.spw` `~direction`.

## Types

Node-side tools are plain `.mjs` with JSDoc. A file is checked once it carries `// @ts-check`, and then under `strict` (`npm run types`, `tsconfig.tools.json`). Grow the set by adding the pragma and fixing what it finds. Don't loosen `strict` to make one fit.

## Generated files

Change the source and re-run; don't hand-edit these.

- `chapters:build`: `book/chapter/*`, `book/timeline.html`, `book/content/catalog.json`, `search.json` and `semantic.json`, `book/scripts/modules/book-extent.mjs`, `pie/unlocks/*`, the blocks between the `unlocks` markers in `sitemap.xml` and `pie/index.html`, and `.well-known/autonomous-feedback.json`.
- `spw:export`: `.spw/chapters/*`.
- `spw:characters` (from `characters.mjs`): `.spw/surfaces/characters.spw` and `book/content/world/characters.json`.
- `spw:way` (from `book/content/world/way.json`): `.spw/surfaces/reasons.spw`.
- `spw:likeness`: `book/content/world/likeness.json`.
- `spw:sigil-audit` and `spw:progression`: `.spw/audits/sigil-chapter-audit.spw` and `.spw/audits/progression.spw`.
- `spw:seed-bundle`: `book/scripts/vendor/spw-seed.mjs`.
- `rhymes:build`: `book/content/world/rhymes.json`.
- `texture:finds:build`: `book/content/packs/texture.website/@spwashi/folios.json`. It reads the spwashi.com archive (`SPWASHI_COM`, or where `texture:mine` finds it); without it the committed file stands.

`npm run canon:build` runs the canon generators (`spw:characters`, `spw:way`, `spw:likeness`, `spw:sigil-audit`, `spw:progression`), and `build` includes it.

## Reader-facing changes

- New behaviour goes behind a switch in `reading-switches.mjs` (`stage: 'trial'`, or per-cohort defaults so regulars keep what they had).
- New `lore.*` keys that hold marks go in `READING_MARKS` (`begin-again.mjs`).
- Canon guards are in `.spw/surfaces/tropes.spw` (`contract`) and `book:check`.
- Before claiming who is in a room or what a chapter does, read the paragraph: matching names in chapter JSON picks up block types, place names and mentions.
- Open `?decide` and `?open` blocks are the author's questions; file an answer as proposed.

## What goes where

Everything on `main` is public and served at lore.land, this file included, along with `.spw/tools/` and `book/scripts/tools/`. `robots.txt` hides nothing, and the `.spw` allowlist applies only to `dist`, which is not deployed. Keep credentials, personal details, machine paths, other repos' private notes and held-back plot off `main`, and remember a commit stays in history after the file is gone.

`.studio/` is gitignored: drafts and local tooling. An idea can sit there unfinished for as long as it needs. Don't settle something just to get it committed; a gap or an open question is often the most useful thing in the tree.

## Git

Pushing `main` publishes. Merge and push only when asked. Commit a workbench bump's pointer and `spw-seed.mjs` together.

## Commit style

`.[lore.land] &[modules,...] ^[category] — description` (see recent `git log` for examples). Only commit when asked.
