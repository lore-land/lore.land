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
npm run spw:lint     # .spw/tools/spw-lint.mjs — parse every hand-authored .spw file with the REAL spw-workbench grammar
npm run spw:seed-bundle          # book/scripts/tools/bundle-spw-seed.mjs — regenerate book/scripts/vendor/spw-seed.mjs
npm run spw:seed-bundle:verify   # same tool, --verify — fail if the vendored bundle is stale vs the submodule pin
npm run spw:trope-prompt -- NN   # .spw/tools/trope-prompt.mjs — author ideation card for chamber NN (e.g. -- 02)
```

**`spw:trope-prompt` is an author-facing ideation tool, not a content generator.** It cross-references material that's already written but scattered and un-indexed by chamber in `.spw/surfaces/plates.spw` — `domain_constellations` (which cross-discipline crossings a chamber belongs to, with a provocation question), `idiomarium` (Spw-phrase idioms tagged by chamber via `use: [...]`), the `peripheral_field` word banks (a deterministic single pick per list, not prescriptive), and the chamber's own `plate_shelf` trope triple — into one prompt card. It also proposes a concrete authoring syntax for `data-trope`/`data-motif`/`data-foreshadow`: real CSS exists for these (`book/styles/components/motifs.css`) but **no chapter has ever used them** — confirmed by grepping `book/` for any actual usage, not just assumed. `AL-010` in the ledger already flags them for retirement if that stays true, so the tool assumes adoption and proposes the shape (`"data-motif": "..."` on a section, same pattern as the already-live `data-mood`) rather than inventing a new one. The tool never writes to chapter content — applying a mark is an editorial decision made by whoever's authoring.

**The real spw-workbench parser is available in the browser, not just Node.** `book/scripts/vendor/spw-seed.mjs` is an esbuild bundle of `.spw/_workbench/packages/spw-seed/src/index.ts` (`--bundle --format=esm --platform=browser`, no externals — the package is explicitly portable, no DOM/Node deps) — a checked-in, GENERATED file (banner says so; don't hand-edit). Import it like any plain module: `import { parse, readBias, resolveFragment } from './vendor/spw-seed.mjs'`. Re-run `npm run spw:seed-bundle` after every workbench update; `spw:seed-bundle:verify` (wired into CI, right after `spw:lint`) catches drift if you forget. It is **not** wired into `predev`/`build` — nothing in the page runtime consumes it yet, so a missing/stale bundle doesn't break `npm run dev`. If you do wire it into a runtime module, reconsider that decision (add the regen step to `predev`/`build` then, since staleness would start to matter for real).

**`spw:lint` is a real parser, not a heuristic.** It runs via `tsx` (a devDependency) so it can import `.spw/_workbench/packages/spw-seed/src/index.ts` directly — no build step, no vendored copy, straight from the submodule's TypeScript source. Requires the submodule checked out. Pass `parse(text, { lexProfile: 'prose' })` — the `prose` lex profile (`unknownAsText: true`) is required for lore.land's content-heavy canon; the `default` profile rejects almost everything (em dashes, semicolons, smart quotes outside strings) because it's tuned for pure-grammar files, not prose-mixed ones. **Known real constraint found this way, not by static reading**: the lexer treats a raw newline inside a `"..."` literal as an unterminated-string error — multi-line quoted strings (wrapping long prose across indented lines) are not valid Spw syntax, full stop. Keep long string values on one physical line, however long. `npm run spw:lint -- --strict` exits 1 on any parse failure; CI runs it that way. If you add prose fields with unusual punctuation and lint start failing, check whether it's a genuine syntax issue (multi-line string) before assuming a lexer bug.

CI (`.github/workflows/ci.yml`) runs `spw:lint --strict`, `build`, `dist:verify`, and `spw:probes` on every push/PR — verification only, no deploy step (Pages serves `main` branch root directly; there's no `dist`-based or `gh-pages` deploy to trigger).

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

**`={ ~"path" }` is a real idiom, not a misuse of `=`** — don't "fix" it into an invented named field. As of workbench `bb1ffe6`, this is formal canon, not just convention: `.spw/_workbench/.spw/registries/bias-product.spw` defines `=` + body as a verb-neutral **bias edge** `{ anchor, axis, targets, sign }` — a directed lean whose meaning depends on which consumer reads it (`mount`: verify the target exists; `mutate`: treat it as an ordered patch; `expand`: treat it as template provenance). lore.land only uses the plain **reflexive** form — `={ ~"path" }`, anchor elided so it means "this node itself leans toward `path`" — read in the `mount` sense (a phase entry's own canon lives there). The registry also defines `labeled` (`=ref{ ~"path" }`), `anchored` (`=@old{ @new }`), `axial` (`=[depth]{ deep shallow }`), and `signed` (`=bane@old{ @new }`, using the boon/bane valence pentad) forms — none adopted here yet, but available if a future need matches one. This is different from `&field: "path"` (confluence — a citation/cross-reference that merges evidence, like `spec_ref`/`impl_ref`/`source`); bias (lean toward) and confluence (cite/merge) stay separate operators for separate relationships — don't collapse them into one pattern.

**`~"path#fragment"` — the fragment isn't a comment.** As of workbench `2573f76` (`^seed[fragment]`), `#fragment` on a `~"path"` reference is formal grammar — it resolves to a specific anchored node inside the target surface, not a dangling suffix. lore.land had ~30 bare `"path.spw#anchor"` strings (no `~`) scattered across `spec_ref`/`impl_ref`/`alt_spec` in `chapter-claims.spw` and reference fields throughout `.spw/surfaces/*.spw`, `workspace.spw` — all now wrapped as `~"path#anchor"`. Only wrap values that are a single, genuinely resolvable path (no ` + ` joins, no prose, no bare event/route names like `"lore:spw-selection + ebook handle inspector"` — those stay bare). `spw-ethos.mjs`'s `parseClaimChain` regex accepts an optional `~` before the value's opening quote (stripped, doesn't change the parsed value) precisely so `chapter-claims.spw`'s live-parsed `spec_ref`/`impl_ref`/`alt_spec` fields could adopt this without a parser/output mismatch — verify with the same `parseClaimChain` import-and-diff check described above if you touch that file's reference fields again.

## Known open items (see `.spw/index.spw` `~direction`)

- 13 chapter plates (`book/images/*.png`, used as `og:image`) are 6-27KB, under the 100KB atelier-phase-02 floor (`AL-001`, `plate_weight`) — regenerate at higher fidelity when doing art passes. All 13 are `draft`/`grounded` state in `plates-manifest.spw`, so `spw:probes` reports these as `review`, not `defect` — the floor only gates chambers once their manifest `!state` reaches `public`.
- `theme_parity` review: `book/styles/core/tokens.css` has cosmos-only custom properties with no ember equivalent — confirm intentional before next theme pass.

## Commit style

`.[lore.land] &[modules,...] ^[category] — description` (see recent `git log` for examples). Only commit when asked.
