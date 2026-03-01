# lore.land

The official canon for lore.land.

## Spw-Workbench Integration

This project integrates Spw kernel ideas from:

- Repository: `https://github.com/spwashi/spw-workbench`
- Local submodule in this workspace: `./spw-workbench`
- Current submodule pin: `61d2b70`

### Runtime Bridge In lore.land

- `book/scripts/modules/spw-selector-parser.mjs`
  Port of the `spw-workbench` selector-expression parser for browser runtime use.
- `book/scripts/modules/spw-register-bank.mjs`
  Register and handle bank for structured Spw selection payloads.
- `book/scripts/modules/spw-interactions.mjs`
  Interactive Spw runtime (clickable braces/operators/chunks, geometry controls, Rubik's Cube semantic faces, register controls, plus LSP-inspired inspection controls: line/file code lens and inlay-style hints).
- `lore:spw-selection` event
  Shared runtime signal used by page-level UX to react to Spw handle/payload selections.
- `book/scripts/modules/spw-ethos.mjs`
  Shared ethos bridge for chapter + home surfaces. Encodes operator-phase roles, claim layers (`grammar`, `semantics`, `pragmatics`), and claim-chain UI (`claim -> spec -> impl -> probe`) inspired by `spw-workbench/.spw/harness/claim-protocol.spw`.
- `book/scripts/modules/load-lifecycle.mjs` + `book/scripts/modules/story-lexicon.mjs`
  Lifecycle bridge now emits `valence -> pipeline -> precipitant` mappings (for example `boon -> select -> desugar`) from `.spw/surfaces/index.spw` and `.spw/runtime/precipitants.spw`.
- `book/scripts/custom/spw-component-binding.mjs`
  Custom elements can fetch/apply `.spw` sources with declarative attributes:
  `data-spw-fetch`, `data-spw-select`, `data-spw-apply`, `data-spw-target`, and optional `data-spw-inline` fallback.
- `book/scripts/custom/spw-style-library.mjs` + `book/scripts/custom/spw-behavior-library.mjs`
  Reusable style/behavior libraries for semantic component tuning (load-reactive, selection-reactive, interactive key handling).
- `book/scripts/custom/spw-advanced-runtime.mjs`
  Advanced custom-component runtime with explicit `priming -> resolution` cycles, event emission (`lore:spw-runtime-cycle`), and re-priming on runtime attribute changes.

### Operator Semantics (v0.2.0-alpha)

12 sigils — each with one semantic role. Declared in `OPERATOR_ROLES` (exported from `spw-interactions.mjs`); every rendered token carries `data-spw-role`.

**Spirit sequence:** `?~<#.>@(#.)&[#.]*{#.}^`

| Sigil | Role        | Phase | Polarity   | Meaning                                               |
|:-----:|-------------|------:|------------|-------------------------------------------------------|
| `!`   | action      | 0     |            | fire effect, inject                                   |
| `?`   | probe       | 1     |            | inspect, select, evaluate                             |
| `~`   | potential   | 2     |            | defer, name, superpose                                |
| `@`   | perspective | 3     |            | root scope / observer point — `@path` resolves from anchor |
| `&`   | confluence  | 4     |            | merge, combine frames                                 |
| `*`   | value       | 5     |            | collapse to concrete                                  |
| `^`   | integration | 6     |            | bind upward, emit                                     |
| `#`   | annotation  | meta  | extrinsic  | self-reference, resonance — projection / outward      |
| `.`   | ground      | meta  | intrinsic  | access, intrinsic state — reduction / inward          |
| `=`   | config      | bind  |            | constrain, bias state                                 |
| `%`   | measure     | obs   |            | quantify, observe depth                               |
| `$`   | substrate   | meta  |            | introspection, meta-access                            |

Accessor polarity: `#` → extrinsic/projection (outward-facing), `.` → intrinsic/reduction (inward-facing).
`.` is tokenized only when immediately before `[` (e.g. `.[property]`), preserving normal prose dots.
`@` carries `data-spw-direction`: `prefix` (path target right) or `postfix` (observer anchored left).

### Container Semantics (Brace-First)

Braces are primordial semantic constructs, not punctuation. Left brace = accumulate charge; right brace = discharge.

| Brace  | Name    | Role       | Spirit  | Left charge      | Right charge  |
|:------:|---------|------------|---------|------------------|---------------|
| `[ ]`  | frame   | selection  | `[#.]`  | +selection       | −release      |
| `{ }`  | body    | scope      | `{#.}`  | +tension         | −discharge    |
| `( )`  | scope   | grouping   | `(#.)`  | +containment     | −emission     |
| `< >`  | capsule | channel    | `<#.>`  | +channel         | −delivery     |

Container roles are exported from `spw-interactions.mjs` as `CONTAINER_ROLES`; every brace token carries `data-spw-container-role` and `data-spw-charge`.

### 3-Layer Kernel

Dependency flows inward: `pragmatics → semantics → grammar` (never reversed).

| Layer        | Owns                                | Surfaces                  |
|--------------|-------------------------------------|---------------------------|
| **Grammar**  | operators, containers, seeds, tokens | `src/seed/`, `core/*.md`  |
| **Semantics**| planes, axes, polarity, spirit seq  | `registries/`, `applications/` |
| **Pragmatics**| shelves, editing, biome, process   | `conventions/`, `patterns/`|

Claim layers in the ethos panel map to this kernel: `grammar` → `.`, `semantics` → `^`, `pragmatics` → `!`.

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
- Runtime, surfaces, and observability:
  - `.spw/runtime/precipitants.spw`
  - `.spw/state/observable.spw`
  - `.spw/surfaces/index.spw`
  - `.spw/surfaces/publish.spw`
  - `.spw/surfaces/plugin-protocol.spw`
  - `.spw/surfaces/domains.spw`
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
