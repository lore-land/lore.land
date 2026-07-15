# lore.land

A **worldbuilding monument**: seeded chapters, inspectable craft, and a serial that can be returned to.

The public face demonstrates capability—developing and seeding a durable world—rather than announcing a product category. Interactive fiction stays elsewhere later ([dregg.net](https://dregg.net)).

**Threshold:** [Enter Chapter One](/book/chapter/01/).

The homepage is a static, minimalist entrance. Progressive enhancement may offer a continue path from the last-read chamber; the full canon remains usable without JavaScript.

### Dual register (story first)

The monument is entertainment. Under the fantasy names sit **civic offices**—weighhouse, kitchens, council, archive—that encode real values and process pressure (audit, delivery, governance, memory). A folded “second reading” on [Civic magic](/world/civic-magic.html) makes the craft analogy available without making the site about business owners.

The [Scriptorium](/scriptorium/) shows the writing team as an in-world order, including **patron seals** (honest sponsorship / paid thresholds) and a quiet atelier door for anyone who wants a neighboring monument raised elsewhere.

### Discovery & identity sediment

[Topics](/topics/) are portable handles—promise, voice, audience, memory, polarity, motif, cadence, provenance, **reward**, **guide**—that resemble stages of public-identity development while staying in fantasy dress. Chambers can declare `topics` and `relatedRoutes` in JSON; the chapter runtime renders chips and a continue rail for internal linking.

### Boof · dog guide

[Boof](/characters/boof.html) is a **dog** (based on Spwashi’s dog; blueberries → boonberries). Her motives stay animal-clear: scent, fruit, pack, chase with consequence. Through her the world models **where motivation and reward flow**—immediate fruit, delayed light, status treats, pack warmth—and how **pack ages** (old nose / working middle / new chase) disagree without collapsing into a single management slogan.

## Monument architecture

Lore.Land separates authored chapter content from the shared reading shell:

| Path | Role |
|------|------|
| `book/content/chapters/*.json` | Portable narrative source of truth |
| `book/templates/chapter.html` | Shared shell: metadata, nav, a11y, assets |
| `book/scripts/home/data.mjs` | Chamber index (titles + loglines) |
| `index.html` + `book/styles/home/hub.css` | Monument entrance |
| `npm run chapters:build` | Validates 13 chapter contracts and regenerates HTML |
| `npm run build` | Chapters first, then Vite multi-page package |

Edit chapter JSON rather than hand-editing generated `book/chapter/*/index.html` files.

### Chapter JSON contract

| Field | Role |
|-------|------|
| `title`, `logline`, `epigraph` | Reading frame before prose |
| `description` | SEO / share text |
| `pillars` | Seed materials: `worldbuilding` · `code-craft` · `marketing` · `intrigue` |
| `mood`, `period` | Optional stylesheet hooks |
| `topics`, `relatedRoutes` | Discovery chips + continue rail |
| `lexicon` | Optional thematic terms for language exploration (`id`, `label`, `href?`, `terms[]`) |
| `sections` | Structured prose (paragraphs, figures, custom elements) |
| `sections[].scene` | Optional sketch: `vantage` · `light` · `scent` · `edges[]` · `hint` |
| `sections[].climate` | Optional copy hook: `tempo` · `tint` · `hook` · `strength` (drives scroll lighting) |
| `lore.loreItems` | Field notes for the aside collector |

Render order in `book/scripts/script.mjs`: **logline → title → epigraph → byline → pillars → topics → sections → related routes**.

Optional progressive enhancement (JS on): **scene sketches** (collapsed), **language exploration** (thematic marks + resonance), **copy climate** (tempo/tint lighting from section hooks as you scroll), motif vault, Spw runtime. The full canon remains readable without JavaScript.

**Climate hooks** (chapter JSON → builder attributes → live CSS):

```json
"climate": { "tempo": "dawn", "tint": "gold", "hook": "missing-measure", "strength": 1 }
```

Tempos: `night` · `dawn` · `morning` · `day` · `dusk` · `sunset` · `lamplight`.
Tints: `gold` · `teal` · `ember` · `archive` · `hearth` · `berry` · `night` · `brass` · `paper`.
If omitted, the builder infers tempo from `scene.light` text.

Editorial surface plan (scriptorium desk, seal checklist, phases): `.spw/surfaces/editorial.spw`.

### Release cadence

Aligned with Spwashi practice: public ship windows on the **13th** and **26th**.
Current cache release token: `2026_07_14.G` (`book/scripts/modules/cache-context.mjs`, `build-chapters.mjs`).

## Spw-Workbench Integration

This project integrates Spw kernel ideas from:

- Repository: `https://github.com/spwashi/spw-workbench`
- Local submodule in this workspace: `./.spw/_workbench`
- Current submodule pin: `5552cec`

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
  Lifecycle bridge now emits `valence -> pipeline -> precipitate` mappings (for example `boon -> select -> desugar`) from `.spw/surfaces/index.spw` and `.spw/runtime/precipitates.spw`.
- `book/scripts/custom/spw-component-binding.mjs`
  Custom elements can fetch/apply `.spw` sources with declarative attributes:
  `data-spw-fetch`, `data-spw-select`, `data-spw-apply`, `data-spw-target`, and optional `data-spw-inline` fallback.
- `book/scripts/modules/spw-routing.mjs`
  Centralized Spw route resolver shared by bindings and interactive inspectors. Normalizes `spw/*`, chapter aliases, and workbench aliases (`workbench/*`, `_workbench/*`), while generating GitHub Pages-safe URLs via base-path detection.
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
  - `.spw/runtime/precipitates.spw`
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

- release token: `2026_07_13.A`
- query key: `v`
- context key: `ctx`
- implementation: `book/scripts/modules/cache-context.mjs`

Use this when introducing new Spw routing/interactions/effects so chapters and home surfaces load coherent runtime behavior after deploy.

### Seed Folder Convention

- Date-based seed folders under `seeds/` use canonical ISO ordering: `yyyy-mm-dd`.
- Example: `seeds/2026-03-01/`

### Asset Optimization Pipeline

- Pipeline entrypoint: `book/scripts/tools/assets/optimize-assets.mjs`
- NPM scripts:
  - `npm run assets:optimize`
  - `npm run assets:optimize:dry`
- Default source roots:
  - `book/images`
  - `book/media`
  - `book/pwa/icons`
  - `seeds`
- Output root: `dist/assets/microbundles/` (ignored by git)
- Generated microbundle artifacts:
  - `bundles/*.json` per-asset bundle records
  - `images/**` responsive WebP variants (+ preview)
  - `svg/**` minified SVG outputs
  - `index.json` bundle index + size report
  - `palette-fallbacks.css` fallback background colors per asset key
