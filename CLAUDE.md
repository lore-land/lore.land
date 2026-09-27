# CLAUDE.md

lore.land — a worldbuilding monument: seeded chapters, inspectable craft, a living serial. Browser-native JS modules + CSS layers, no bundler at runtime (Vite only for the production build step), deployed to GitHub Pages.

Canon lives in `.spw/` — read `.spw/index.spw` first when you need to find a surface. Authoring conventions and the `spw:*` tooling gotchas are in `.spw/CLAUDE.md` (loads when working under `.spw/`); the in-browser Spw reader is documented in `book/scripts/modules/CLAUDE.md`.

CI (`.github/workflows/ci.yml`) is verification only, no deploy step — Pages serves the `main` branch root directly; there's no `dist`-based or `gh-pages` deploy to trigger.

## Known open items (see `.spw/index.spw` `~direction`)

- Chapter share images are cards, not raw plates: `npm run assets:brand` (`book/scripts/tools/assets/brand-assets.mjs`) sets each public plate (`book/images/NN.png`) in the cover type into `book/images/og/chapter-NN.jpg` (1200×630) and rebuilds the PWA icons from the bud sigil. Authoring-time only (needs `magick`, `rsvg-convert`, macOS Georgia); outputs are committed. Re-run after a title, "in which" line, plate or sigil changes, then `npm run chapters:build`. `spw:probes` `plate_weight` holds cards to the 100KB floor — dark plates need the higher JPEG quality the tool uses.
- `theme_parity` review: `book/styles/core/tokens.css` has cosmos-only custom properties with no ember equivalent — confirm intentional before next theme pass.

## Commit style

`.[lore.land] &[modules,...] ^[category] — description` (see recent `git log` for examples). Only commit when asked.
