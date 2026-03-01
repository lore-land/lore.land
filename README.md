# lore.land

The official canon for lore.land.

## Spw-Workbench Integration

This project integrates Spw kernel ideas from:

- Repository: `https://github.com/spwashi/spw-workbench`
- Local mirror in this workspace: `src/extern/spw-workbench`

### Runtime Bridge In lore.land

- `book/scripts/modules/spw-selector-parser.mjs`
  Port of the `spw-workbench` selector-expression parser for browser runtime use.
- `book/scripts/modules/spw-register-bank.mjs`
  Register and handle bank for structured Spw selection payloads.
- `book/scripts/modules/spw-interactions.mjs`
  Interactive Spw runtime (clickable braces/operators/chunks, geometry controls, Rubik's Cube semantic faces, register controls).
- `lore:spw-selection` event
  Shared runtime signal used by page-level UX to react to Spw handle/payload selections.

### Cache + Release Coupling

Spw runtime assets are released through the shared cache profile:

- release token: `2026_02_28.I`
- query key: `v`
- context key: `ctx`
- implementation: `book/scripts/modules/cache-context.mjs`

Use this when introducing new Spw routing/interactions/effects so chapters and home surfaces load coherent runtime behavior after deploy.
