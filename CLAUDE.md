# CLAUDE.md

lore.land — a worldbuilding monument: seeded chapters, inspectable craft, a living serial. Browser-native JS modules + CSS layers, no bundler at runtime (Vite only for the production build step), deployed to GitHub Pages.

## `.spw/` — canon root

`.spw/index.spw` is the routing table; read it first when you need to find a surface. Everything else in `.spw/` hangs off it:

- `.spw/chapters/*.spw` + `chapters/index.spw` — chapter mirrors, regenerated from `book/content/chapters/*.json` (prose source of truth)
- `.spw/claims/chapter-claims.spw` — ethos claim ids; must match `book/scripts/modules/spw-ethos.mjs`
- `.spw/surfaces/*.spw` — publish, editorial, platform, atelier, plugin-protocol, plates, domains
- `.spw/state/` — `observable.spw`, `alignment-ledger.spw` (every noticed misalignment resolves to a ledger entry), `plates-manifest.spw` (per-chamber plate production gate: `!state` draft|grounded|study|public, `%version`, `.file`, `&ledger` ref — read by `spw:plates` and `spw:probes`)
- `.spw/audits/` — dated audit + alignment-probe snapshots; newest is pointed to by `index.spw`'s `audit_active`
- `.spw/workspace.spw` — numbered contracts (`c001`…) + `contract_status` — the closest thing to a project status doc
- `.spw/tools/*.mjs` — the scripts behind the `npm run spw:*` commands below
- `.spw/_workbench` — git submodule, `git@github.com:spwashi/spw-workbench.git`. This is the canonical Spw language spec/tooling monorepo (parser, runtime, LSP, CLI). lore.land's `.spw` files are a *consumer* of that spec, not a fork of it. Update with `cd .spw/_workbench && git fetch origin && git checkout origin/main`, then commit the bumped pointer in the superproject.

## npm scripts for `.spw`

```
npm run spw:export   # .spw/tools/export-chapters.mjs — regenerate .spw/chapters/*.spw from chapter JSON
npm run spw:project  # .spw/tools/project-public-spw.mjs — project public .spw sources into dist/.spw
npm run spw:verify   # same tool, --verify — check dist/.spw matches source without writing
npm run spw:probes   # .spw/tools/alignment-probes.mjs — regenerate .spw/audits/alignment-probes-<date>.spw
npm run spw:plates   # .spw/tools/plates-manifest.mjs — print plate gate-status table; -- --check verifies vs disk
```

CI (`.github/workflows/ci.yml`) runs `build`, `dist:verify`, and `spw:probes` on every push/PR — verification only, no deploy step (Pages serves `main` branch root directly; there's no `dist`-based or `gh-pages` deploy to trigger).

`npm run build` runs `chapters:build` → `spw:export` → `vite build` → `spw:project` → `dist:static` in that order — the chapter JSON is upstream of both the Vite build and the `.spw` projection.

## Spw wiring in JS (`book/scripts/modules/spw-*.mjs`)

These implement the Spw v0.2.0-alpha core spec (operators + containers) as an in-browser inspection/interaction layer over chapter content — not a parser/runtime, a reader.

- `spw-interactions.mjs` — `OPERATOR_ROLES` (12 sigils: `? ~ @ & * ^ ! # . = % $`) and `CONTAINER_ROLES` (`[]` frame/selection, `{}` body/scope, `()` scope/grouping, `<>` capsule/channel); drag-to-scope, inspection controls. Spirit sequence: `?~<#.>@(#.)&[#.]*{#.}^`.
- `spw-ethos.mjs` — `OPERATOR_ETHOS`, claim layers, ethos panel; mirrors `.spw/claims/chapter-claims.spw` with a fallback in-JS copy. `parseClaimChain()` (line ~195) is a **live parser** — it fetches and reads `.spw/claims/chapter-claims.spw` in the browser via a strict `key: "value"` line regex. Field keys may carry an optional leading operator sigil (`#claim_id`, `#layer`, `&spec_ref`, `&impl_ref`, `&probe_ref`, `&alt_spec`, `&depends_on`) — the parser strips it before matching `CLAIM_FIELD_MAP`, so sigils are accepted for legibility but don't change parsed output. Prose fields (`hypothesis`, `measure`, `falsification`) stay unprefixed — forcing a sigil onto free narrative text is the "operator overloading" anti-pattern the spec warns against.
- `spw-routing.mjs` — path normalization, chapter aliases
- `spw-selector-parser.mjs`, `spw-expression-index.mjs`, `spw-register-bank.mjs` — selector/expression parsing and register state backing the above

**Checking these against upstream spec**: the operator/container tables trace to `.spw/_workbench/lib/spw-v0.2.0-alpha/core/OPERATORS.md` and `core/CONTAINERS.md`. As of workbench v0.3.0, `core/` is carried forward unchanged from v0.2.0-alpha (see `lib/spw-v0.3.0/DELTAS.md`) — no semantic drift to port. If a future workbench bump touches `core/OPERATORS.md` or `core/CONTAINERS.md`, diff it against the tables in `spw-interactions.mjs:11-38` before assuming the JS is still correct.

## Sigil-prefixed record fields

Some `.spw` records use a leading operator sigil on structural/reference fields instead of a bare `key: value` — the sigil states the field's semantic role using `OPERATOR_ROLES` (e.g. `&` confluence for a cross-reference that merges evidence, `#` annotation for an extrinsic tag, `!` action for a fired/current state, `.` ground for an intrinsic structural fact, `%` measure for a count). Prose fields (hypothesis, evidence, rationale, why) never get a sigil — only short, fixed-vocabulary or reference-shaped fields do; forcing a sigil onto narrative text would be exactly the operator-overloading the spec forbids (`core/OPERATORS.md` Counter-Examples).

- `.spw/state/plates-manifest.spw` — `^chamber[NN]{ #slug !state %version .file &ledger }`
- `.spw/claims/chapter-claims.spw` — `#claim_id`, `#layer`, `&spec_ref`/`&impl_ref`/`&probe_ref`/`&alt_spec`/`&depends_on`. **Live-parsed** by `spw-ethos.mjs` (see above) — if you add a new field here, update `CLAIM_FIELD_MAP` and the parser regex too.
- `.spw/state/alignment-ledger.spw` — `#axis`, `!class`, `&source` (per `^entry[AL-NNN]`). Not fetched by any JS — safe to restructure freely, but keep `entry_schema` in sync since it's the field reference.

Before adding a sigil to a field in a file with a live consumer (grep the field name in `book/scripts/modules/*.mjs` first), confirm the parser tolerates it — `.spw` files under `.spw/claims/` and `.spw/state/` are fetched by declarative `data-spw-fetch` bindings (`spw-component-binding.mjs`) or dedicated parsers, unlike files under `.spw/surfaces/` or `.spw/audits/`, which are prose-only today.

**Container choice matters too, not just braces-as-JSON-objects**: `[]` (frame/selection — ordered, indexable) for an order-critical pipeline or a homogeneous repeated list of same-shaped records; `{}` (body/scope) for a registry looked up by name, where order doesn't matter; `<>` (capsule/channel) for a block that's explicitly a directed coupling between two things (e.g. `alignment-ledger.spw`'s `^<complaint_route>{}` — complaints flow into a claim counter). A block's outer *operator* should match its role too — `?"probes"[...]` for a list of checks, `!"canon_gates"[...]` for a fireable gate sequence — not just `^` or no sigil by default. When in doubt, match an existing precedent in the same file family (`.spw/runtime/precipitates.spw`'s `^"stages"[...]` is the canonical ordered-pipeline example) rather than inventing a new shape.

**`={ ~"path" }` is a real idiom, not a misuse of `=`** — don't "fix" it into an invented named field. `=` biases/resolves toward a target; `~"path"` is the deferred-file-reference form (see `reference-conventions.spw`); nested together they mean "on collapse, resolve toward that surface" — used when a block *is* (or points back to) its own canonical file, e.g. a phase entry whose canon lives at the surface it's describing. This is different from `&field: "path"` (confluence — a citation/cross-reference that merges evidence, like `spec_ref`/`impl_ref`/`source`); don't collapse the two into one pattern.

## Known open items (see `.spw/index.spw` `~direction`)

- 13 chapter plates (`book/images/*.png`, used as `og:image`) are 6-27KB, under the 100KB atelier-phase-02 floor (`AL-001`, `plate_weight`) — regenerate at higher fidelity when doing art passes. All 13 are `draft`/`grounded` state in `plates-manifest.spw`, so `spw:probes` reports these as `review`, not `defect` — the floor only gates chambers once their manifest `!state` reaches `public`.
- `theme_parity` review: `book/styles/core/tokens.css` has cosmos-only custom properties with no ember equivalent — confirm intentional before next theme pass.

## Commit style

`.[lore.land] &[modules,...] ^[category] — description` (see recent `git log` for examples). Only commit when asked.
