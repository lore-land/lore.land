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

### Operator Semantics

Each Spw operator carries a semantic role. Roles are declared in `OPERATOR_ROLES` (exported from `spw-interactions.mjs`) and annotated on every rendered token via `data-spw-role`.

| Operator | Role        | Meaning                                                      |
|----------|-------------|--------------------------------------------------------------|
| `.`      | ground      | Property definition or access along an optimized path        |
| `#`      | vibration   | Anchor across resonance or aggregate sense                   |
| `&`      | handle      | Prefix or postfix handle / reference                         |
| `@`      | perspective | Directional context: `left@` = flashlight, `@right` = instantiation |
| `^`      | bind        | Bound operator — explicit linkage                            |
| `~`      | dangle      | Dangling / loose reference                                   |
| `?`      | wonder      | Open inquiry or question                                     |
| `!`      | exclaim     | Assertion or exclamation                                     |
| `*`      | wildcard    | Combinatoric or wildcard                                     |

`.` is tokenized only when immediately before `[` (e.g. `.[property]`), preserving normal prose dots.
`@` carries a `data-spw-direction` attribute: `prefix` (`@right`, instantiation) or `postfix` (`left@`, flashlight/perspective).

### Model Ebook Navigation

- `book/scripts/modules/ebook-navigation.mjs`
  Chapter-level ebook architecture with section mapping, TOC handles, concept routes, persisted resume state, keyboard navigation, and reader/engineer register modes.
- `book/scripts/script.mjs`
  Composes chapter runtime: content mount -> chapter routes -> ebook navigation -> Spw runtime enhancement -> progression/effects.
- `book/styles/fixtures/root.css`
  Styles hierarchy and navigation surfaces for both software-heavy and book-heavy reading modes.

### Keyboard Shortcuts (Chapter Pages)

#### Chapter navigation
| Key            | Action                      |
|----------------|-----------------------------|
| `Alt+Left`     | Previous chapter            |
| `Alt+Right`    | Next chapter                |
| `Alt+H`        | Home (`/`)                  |
| `Alt+T`        | Timeline                    |

#### Section navigation
| Key / Gesture        | Action                                            |
|----------------------|---------------------------------------------------|
| `PageDown` / `]`     | Next section                                      |
| `PageUp` / `[`       | Previous section                                  |
| `Alt+ArrowDown`      | Next section (alternate)                          |
| `Alt+ArrowUp`        | Previous section (alternate)                      |
| Hold `{`             | **Breadth mode** — reveals all sections and highlights concept rail / perspective switch |
| Hold `}`             | **Depth mode** — focuses active section, mutes others, foregrounds TOC |

#### Spw expression interaction
| Gesture                   | Action                                                    |
|---------------------------|-----------------------------------------------------------|
| Click on operator token   | Cycle to next operator in sequence                        |
| Click on brace token      | Highlight matched brace pair                              |
| Click on chunk            | Commit chunk as register handle                           |
| Click-and-drag (≥2 words) | Create a `(scope)` span — chip appears, commits to register, fades after ~3 s |

### Ethos Integration

- Claim protocol ethos from `spw-workbench` is surfaced in-runtime as selectable claim layers and testable claim cards.
- Chapter surfaces include an ethos panel in `aside` and home includes an ethos atlas near the grammar observatory.
- Runtime events (`lore:spw-selection`, `lore:ebook-section-change`) update ethos probe status so claims stay tied to observable interaction.

### `.spw` Canon Surface

- Repository-local canon root: `.spw/`
- Chapter references: `.spw/chapters/01.spw` ... `.spw/chapters/13.spw`
- Indexes and claims:
  - `.spw/index.spw`
  - `.spw/workspace.spw`
  - `.spw/chapters/index.spw`
  - `.spw/claims/chapter-claims.spw`
- Regeneration command:
  - `node .spw/tools/export-chapters.mjs`

Chapter `.spw` files are generated from `book/chapter/*/index.html#chapter-data` and intended as long-form, expressive references for story extension and semantic diffing.

### Cache + Release Coupling

Spw runtime assets are released through the shared cache profile:

- release token: `2026_02_28.I`
- query key: `v`
- context key: `ctx`
- implementation: `book/scripts/modules/cache-context.mjs`

Use this when introducing new Spw routing/interactions/effects so chapters and home surfaces load coherent runtime behavior after deploy.
