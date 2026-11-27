# `book/scripts/modules/` — Spw wiring & module map

Loaded when working under `book/scripts/modules/`. For the full repo map see root `AGENTS.md`.

## Spw wiring in JS (`book/scripts/modules/spw-*.mjs`)

These implement the Spw v0.2.0-alpha core spec (operators + containers) as an in-browser inspection/interaction layer over chapter content — not a parser/runtime, a reader.

- `spw-interactions.mjs` — canonical `OPERATOR_ROLES` (12 sigils: `? ~ @ & * ^ ! # . = % $`) and `CONTAINER_ROLES` (`[]` frame/selection, `{}` body/scope, `()` scope/grouping, `<>` capsule/channel), drag-to-scope, token/brace highlighting, selection URL hash restore. Spirit sequence: `?~<#.>@(#.)&[#.]*{#.}^`.
  - **Static-check invariant**: `book/scripts/tools/play-graph-check.mjs` reads `OPERATOR_ROLES` and the `spirit roles: <#.> capsule, (#.) scope, [#.] frame, {#.} body` comment directly from `spw-interactions.mjs` as text — keep both in the main file.
  - Submodules: `spw-interactions/story-cube.mjs` (association extraction, path/annotation collectors, 6-face story cube) and `spw-interactions/controls.mjs` (`<spw-registers>`, CodeLens inspection, geometry nav, operator swapper, register controls).
- `spw-projection-disk.mjs` — Poincaré disk UI & geodesic animation on `/scriptorium/#projection`.
  - Submodules: `spw-disk/geometry.mjs` (`// @ts-check`, complex math, Möbius re-centring, geodesic arcs, `layoutFrom`) and `spw-disk/graph.mjs` (`buildGraph`, `loopsThrough`, `loopsToOffer`, `tieWords`, sidecar parsers, `subgraphAround`, `shortestPath`, `exportWalkAsSpw`).
- `spw-portable.mjs` (`// @ts-check`) — client-side `#spw64=` base64url URL fragment codec (`encodeSpwFragment`, `decodeSpwFragment`), cross-host `word[mode]{body}(scene)<concept>` slot projector (`projectCrossHostSlot`), and `buildPortableDoorUrl`.
- `spw-ethos.mjs` — `OPERATOR_ETHOS`, claim layers, ethos panel; mirrors `.spw/claims/chapter-claims.spw` with a fallback in-JS copy. `parseClaimChain()` is a **live parser** — it fetches and reads `.spw/claims/chapter-claims.spw` in the browser via a strict `key: "value"` line regex. Field keys may carry an optional leading operator sigil (`#claim_id`, `#layer`, `&spec_ref`, `&impl_ref`, `&probe_ref`, `&alt_spec`, `&depends_on`) — the parser strips it before matching `CLAIM_FIELD_MAP`, so sigils are accepted for legibility but don't change parsed output. Prose fields (`hypothesis`, `measure`, `falsification`) stay unprefixed — forcing a sigil onto free narrative text is the "operator overloading" anti-pattern the spec warns against.

## Ebook & chapter lifecycle modules

- `ebook-navigation.mjs` — chapter section rail, popover contents, scribe/reader register toggle, keyboard/bracket navigation.
  - Submodules: `ebook/section-model.mjs` (section classification, perspectives, payload filters, handle graph resolution) and `ebook/storage.mjs` (state/register persistence and nearest-section probe).
- `../script.mjs` + `../chapter/{routes,motifs,panels}.mjs` — chapter bootstrap, navigation routes/shortcuts, optional Midjourney motif vault & chapter sigils, aside panels (trope ledger, tuning, authorship, lore collector).

## Real parser & upstream spec parity

**The real parser runs here too.** `bracework.mjs`, `spw-bias.mjs` and `scriptorium-desk.mjs` (and `home/pie-spw.mjs`) lazily import the workbench parser bundle, `book/scripts/vendor/spw-seed.mjs`, and fall back silently without it. How that bundle is built, what it exports and how to confirm the real path ran are in `.spw/CLAUDE.md`.

**Checking these against upstream spec**: the operator/container tables trace to `.spw/_workbench/lib/spw-v0.2.0-alpha/core/OPERATORS.md` and `core/CONTAINERS.md`. As of workbench v0.3.0, `core/` is carried forward unchanged from v0.2.0-alpha (see `lib/spw-v0.3.0/DELTAS.md`) — no semantic drift to port. If a future workbench bump touches `core/OPERATORS.md` or `core/CONTAINERS.md`, diff it against `OPERATOR_ROLES` and `CONTAINER_ROLES` in `spw-interactions.mjs` before assuming the JS is still correct.
