# `book/scripts/modules/` — Spw wiring notes

Loaded when working under `book/scripts/modules/`.

## Spw wiring in JS (`book/scripts/modules/spw-*.mjs`)

These implement the Spw v0.2.0-alpha core spec (operators + containers) as an in-browser inspection/interaction layer over chapter content — not a parser/runtime, a reader.

- `spw-interactions.mjs` — `OPERATOR_ROLES` (12 sigils: `? ~ @ & * ^ ! # . = % $`) and `CONTAINER_ROLES` (`[]` frame/selection, `{}` body/scope, `()` scope/grouping, `<>` capsule/channel); drag-to-scope, inspection controls. Spirit sequence: `?~<#.>@(#.)&[#.]*{#.}^`.
- `spw-ethos.mjs` — `OPERATOR_ETHOS`, claim layers, ethos panel; mirrors `.spw/claims/chapter-claims.spw` with a fallback in-JS copy. `parseClaimChain()` (line ~195) is a **live parser** — it fetches and reads `.spw/claims/chapter-claims.spw` in the browser via a strict `key: "value"` line regex. Field keys may carry an optional leading operator sigil (`#claim_id`, `#layer`, `&spec_ref`, `&impl_ref`, `&probe_ref`, `&alt_spec`, `&depends_on`) — the parser strips it before matching `CLAIM_FIELD_MAP`, so sigils are accepted for legibility but don't change parsed output. Prose fields (`hypothesis`, `measure`, `falsification`) stay unprefixed — forcing a sigil onto free narrative text is the "operator overloading" anti-pattern the spec warns against.

**Checking these against upstream spec**: the operator/container tables trace to `.spw/_workbench/lib/spw-v0.2.0-alpha/core/OPERATORS.md` and `core/CONTAINERS.md`. As of workbench v0.3.0, `core/` is carried forward unchanged from v0.2.0-alpha (see `lib/spw-v0.3.0/DELTAS.md`) — no semantic drift to port. If a future workbench bump touches `core/OPERATORS.md` or `core/CONTAINERS.md`, diff it against the tables in `spw-interactions.mjs:11-38` before assuming the JS is still correct.
