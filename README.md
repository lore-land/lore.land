# lore.land

The official canon for lore.land.

## Spw-Workbench Integration

This project integrates Spw kernel ideas from:

- Repository: `https://github.com/spwashi/spw-workbench`
- Local submodule in this workspace: `./spw-workbench`

### Runtime Bridge In lore.land

- `book/scripts/modules/spw-selector-parser.mjs`
  Port of the `spw-workbench` selector-expression parser for browser runtime use.
- `book/scripts/modules/spw-register-bank.mjs`
  Register and handle bank for structured Spw selection payloads.
- `book/scripts/modules/spw-interactions.mjs`
  Interactive Spw runtime (clickable braces/operators/chunks, geometry controls, Rubik's Cube semantic faces, register controls).
- `lore:spw-selection` event
  Shared runtime signal used by page-level UX to react to Spw handle/payload selections.
- `book/scripts/modules/spw-ethos.mjs`
  Shared ethos bridge for chapter + home surfaces. Encodes operator-phase roles, claim layers (`grammar`, `semantics`, `pragmatics`), and claim-chain UI (`claim -> spec -> impl -> probe`) inspired by `spw-workbench/.spw/harness/claim-protocol.spw`.

### Model Ebook Navigation

- `book/scripts/modules/ebook-navigation.mjs`
  Chapter-level ebook architecture with section mapping, TOC handles, concept routes, persisted resume state, keyboard navigation (`PageUp/PageDown`), and reader/engineer register modes.
- `book/scripts/script.mjs`
  Composes chapter runtime: content mount -> chapter routes -> ebook navigation -> Spw runtime enhancement -> progression/effects.
- `book/styles/fixtures/root.css`
  Styles hierarchy and navigation surfaces for both software-heavy and book-heavy reading modes.

### Ethos Integration

- Claim protocol ethos from `spw-workbench` is surfaced in-runtime as selectable claim layers and testable claim cards.
- Chapter surfaces include an ethos panel in `aside` and home includes an ethos atlas near the grammar observatory.
- Runtime events (`lore:spw-selection`, `lore:ebook-section-change`) update ethos probe status so claims stay tied to observable interaction.

### Cache + Release Coupling

Spw runtime assets are released through the shared cache profile:

- release token: `2026_02_28.I`
- query key: `v`
- context key: `ctx`
- implementation: `book/scripts/modules/cache-context.mjs`

Use this when introducing new Spw routing/interactions/effects so chapters and home surfaces load coherent runtime behavior after deploy.
