# Build Pipeline + SPW Colocation + Workbench Imports + Spec Audit

## Context
The project has Vite underutilized, SPW code fragmented across directories with duplicated definitions from `.spw/_workbench`, and no systematic HTML/CSS spec validation. This plan integrates build enhancement, code colocation, workbench imports, and a full-proficiency audit across 26 phases — each with sub-agent instructions and checkpoint deliverables.

## .spw Syntax + Output Contract
- All phase deliverables are canonical `.spw` artifacts.
- Use this structure for each phase output:
```spw
#>phase_<id>
#:layer #!pragmatics
^["intent"]{ ... }
^["evidence"]{ ... }
^["decisions"]{ ... }
^["next"]{ ... }
```
- Optional summaries can exist in markdown, but `.spw` is the source of truth.

---

## Phase A: Foundation (Phases 1–6)

### Phase 1: Baseline HTML Audit
**Agent**: Explore agent — read all HTML files (`index.html`, `book/chapter/*/index.html`)
**Task**: Catalog every HTML element, its semantic role, heading hierarchy, landmark regions, form associations. Flag `<div>`/`<span>` that should be semantic elements.
**Output**: `book/audits/01-html-baseline.spw` — element inventory, heading tree per page, semantic issues ranked by severity, baseline score.

### Phase 2: Baseline CSS Audit — Layers & Properties
**Agent**: Explore agent — read all CSS files in `book/styles/core/` and `book/styles/home/`
**Task**: Map the `@layer` stack (declared order vs actual usage), find rules that escape their layer or exist unlayered. Catalog all CSS custom properties: where defined, where used, orphans.
**Output**: `book/audits/02-css-layers-baseline.spw` — layer map, orphan properties, specificity hotspots, unlayered rule inventory.

### Phase 3: Baseline CSS Audit — Responsive & Performance
**Agent**: Explore agent — read all CSS files for media queries, container queries, `backdrop-filter`, animations
**Task**: Catalog all breakpoints and container queries. Check for consistency (conflicting breakpoints, redundant queries). Count GPU-compositing triggers (`backdrop-filter`, `will-change`, `transform`). Identify animation efficiency issues.
**Output**: `book/audits/03-css-responsive-baseline.spw` — breakpoint table, container query map, performance flags, animation inventory.

### Phase 4: Baseline ARIA & Accessibility Audit
**Agent**: Explore agent — read HTML files + JS that creates DOM elements (`ui.mjs`, `dom.mjs`, custom elements)
**Task**: Audit all interactive elements for accessible names (`aria-label`, `aria-labelledby`). Check `aria-live` regions, role usage, keyboard operability of custom widgets. Audit dynamic DOM creation in JS for accessibility.
**Output**: `book/audits/04-aria-baseline.spw` — accessibility inventory, missing labels, keyboard trap risks, live region correctness.

### Phase 5: SPW Module Dependency Map
**Agent**: Explore agent — read all `book/scripts/modules/spw-*.mjs` and `book/scripts/custom/spw-*.mjs`
**Task**: Map every SPW module's exports, imports, and cross-dependencies. Identify circular deps. Document each module's single responsibility (or lack thereof). Count lines per module.
**Output**: `book/audits/05-spw-dependency-map.spw` — dependency graph (text), module sizes, responsibility assessment, circular dependency flags.

### Phase 6: Workbench API Surface Audit
**Agent**: Explore agent — read `.spw/_workbench/src/runtime/index.ts`, `src/runtime/state/register-bank.ts`, `src/seed/parser/index.ts`, `src/seed/query/index.ts`, `src/runtime/state/type-affinities.ts`
**Task**: Document every export from each workbench entry point. Compare against lore.land's duplicated code — method-by-method for RegisterBank, property-by-property for OPERATOR_AFFINITIES vs OPERATOR_ROLES, function-by-function for parser/query.
**Output**: `book/audits/06-workbench-api-surface.spw` — export inventory, compatibility matrix, API gaps requiring adapters.

---

## Phase B: Vite Enhancement (Phases 7–9)

### Phase 7: Vite Config — Resolve Aliases
**Agent**: Edit `vite.config.js`
**Task**: Add `resolve.alias` for all `@spw/*` paths and `@book`:
```js
resolve: {
  alias: {
    '@spw/runtime':   resolve(__dirname, '.spw/_workbench/src/runtime/index.ts'),
    '@spw/parser':    resolve(__dirname, '.spw/_workbench/src/seed/parser/index.ts'),
    '@spw/substrate': resolve(__dirname, '.spw/_workbench/src/runtime/pipeline/substrate.ts'),
    '@spw/resonance': resolve(__dirname, '.spw/_workbench/src/runtime/pipeline/resonance.ts'),
    '@spw/pipeline':  resolve(__dirname, '.spw/_workbench/src/runtime/pipeline/stages.ts'),
    '@spw/query':     resolve(__dirname, '.spw/_workbench/src/seed/query/index.ts'),
    '@book':          resolve(__dirname, 'book'),
  },
}
```
**Verify**: `npm run dev` starts, all 14 pages load. Aliases exist but nothing uses them yet.

### Phase 8: TypeScript Support
**Agent**: Edit `package.json`
**Task**: Add `typescript` to devDependencies. Run `npm install`. Confirm Vite resolves `.ts` imports from workbench without errors.
**Verify**: Create a temp test file importing `@spw/runtime` — confirm it resolves. Delete temp file.

### Phase 9: Build Pipeline Checkpoint
**Agent**: Run build and audit output
**Task**: Run `npm run build`, inspect `dist/` output. Verify no regressions in built HTML/CSS/JS. Check that Vite's content hashing works.
**Output**: `book/audits/09-build-pipeline.spw` — build output inventory, asset sizes, hash verification, comparison to pre-migration build.

---

## Phase C: SPW Core Adapters (Phases 10–13)

### Phase 10: Create SPW Directory Scaffold
**Agent**: Create directory structure
**Task**: Create `book/scripts/spw/` with subdirectories: `core/`, `interactions/`, `ethos/`, `parser/`, `binding/`. Create empty `index.mjs` barrel file.
**Verify**: Directory exists, no import errors.

### Phase 11: Operator Roles Adapter
**Agent**: Write `book/scripts/spw/core/operator-roles.mjs`
**Task**: Import `OPERATOR_AFFINITIES` from `@spw/runtime`. Adapt to lore.land's `OPERATOR_ROLES` shape (add `role`, `label`, `phase`, `description`, `polarity` fields). Export `OPERATOR_ROLES` and `OPERATOR_SEQUENCE`. Ensure the adapter is thin — no business logic, just shape mapping.
**Verify**: Import in browser console, confirm all 12 operators present with correct shapes.

### Phase 12: Container Roles Adapter
**Agent**: Write `book/scripts/spw/core/container-roles.mjs`
**Task**: Import `BRACE_AFFINITIES` from `@spw/runtime`. Adapt to lore.land's `CONTAINER_ROLES` shape. Export `CONTAINER_ROLES`.
**Verify**: Import in console, confirm all 8 container entries present.

### Phase 13: Adapter Quality Checkpoint
**Agent**: Audit the adapters
**Task**: Review `operator-roles.mjs` and `container-roles.mjs` — are they pure adapters? Any logic creep? Do they handle all edge cases (e.g., the `<>` coupling operator in workbench but not in lore.land)? Confirm no runtime errors.
**Output**: `book/audits/13-adapter-quality.spw` — adapter purity assessment, edge cases documented, API coverage verification.

---

## Phase D: Parser & Selector Migration (Phases 14–15)

### Phase 14: Selector Parser Swap
**Agent**: Write `book/scripts/spw/parser/selector-parser.mjs`
**Task**: Re-export from `@spw/query`: `tryParseSelector`, `and`, `or`, `not`, `descend`, `seq`. Verify the workbench query index actually exports these names — if not, create named adapters.
**Verify**: Import selector-parser, run `tryParseSelector` against known selectors from `spw-interactions.mjs`.

### Phase 15: Expression Index Migration
**Agent**: Move `book/scripts/modules/spw-expression-index.mjs` → `book/scripts/spw/parser/expression-index.mjs`
**Task**: Move the file, update its internal import of selector-parser to use the new path. Keep implementation unchanged (workbench AST shape differs — future migration). Update any modules importing from the old path.
**Verify**: Expression parsing works on chapter page SPW blocks.

---

## Phase E: RegisterBank Migration (Phases 16–18)

### Phase 16: RegisterBank API Audit
**Agent**: Explore agent — deep comparison
**Task**: Read lore.land's `spw-register-bank.mjs` (566 lines) and workbench's `register-bank.ts`. Method-by-method comparison: which methods exist in both, which are lore.land-only, which are workbench-only. Document API surface differences.
**Output**: `book/audits/16-register-bank-comparison.spw` — method compatibility table, behavioral differences, migration risk assessment.

### Phase 17: RegisterBank Adapter
**Agent**: Write `book/scripts/spw/core/register-bank.mjs`
**Task**: Import workbench `RegisterBank`. Wrap with lore.land's singleton pattern (`globalThis.__loreSpwRegisterBank__`). If any lore.land methods are missing from workbench, extend the class to add them. Export `getSpwRegisterBank` and `RegisterBank`.
**Verify**: Import singleton, exercise `set/get/focus/extract/snapshot` — confirm behavior matches.

### Phase 18: RegisterBank Integration Checkpoint
**Agent**: Test all RegisterBank consumers
**Task**: Find every call site of `getSpwRegisterBank()` across the codebase. Verify each operation works with the new adapter: interactions (extract, resonate, observe), ethos (snapshot), binding (set, get). Document any behavioral differences.
**Output**: `book/audits/18-register-bank-integration.spw` — call site inventory, test results per operation, behavioral delta notes.

---

## Phase F: Module Moves (Phases 19–21)

### Phase 19: Move SPW Interactions
**Agent**: Move `book/scripts/modules/spw-interactions.mjs` → `book/scripts/spw/interactions/interactions.mjs`
**Task**: Move file. Update internal imports to use `../core/operator-roles.mjs`, `../core/container-roles.mjs`, `../core/register-bank.mjs`, `../parser/expression-index.mjs`, `../parser/selector-parser.mjs`. Remove duplicated `OPERATOR_ROLES`/`CONTAINER_ROLES`/`OPERATOR_SEQUENCE` definitions — use imports.
**Verify**: Operator tooltips, brace tracing, drag-to-scope all work on chapter pages.

### Phase 20: Move SPW Ethos
**Agent**: Move `book/scripts/modules/spw-ethos.mjs` → `book/scripts/spw/ethos/ethos.mjs`
**Task**: Move file. Derive `OPERATOR_ETHOS` from `@spw/runtime` `OPERATOR_AFFINITIES` instead of manual definition. Update imports.
**Verify**: Ethos panel renders on home page and chapter pages.

### Phase 21: Move SPW Binding Modules
**Agent**: Move from `book/scripts/custom/` to `book/scripts/spw/binding/`:
- `spw-advanced-runtime.mjs` → `advanced-runtime.mjs`
- `spw-component-binding.mjs` → `component-binding.mjs`
- `spw-style-library.mjs` → `style-library.mjs`
- `spw-behavior-library.mjs` → `behavior-library.mjs`

**Task**: Move files, update internal cross-imports, update `custom/register.mjs` to import from new paths.
**Verify**: Custom elements attach runtime correctly, style library applies colors, behavior library handles events.

---

## Phase G: CSS Colocation (Phases 22–23)

### Phase 22: Colocate SPW Component CSS
**Agent**: Move `book/styles/components/spw.css` → `book/scripts/spw/binding/component.css`
**Task**: Wrap all rules in `@layer interactive { }`. Add `import './component.css'` to `binding/advanced-runtime.mjs`. Remove `<link>` tag for `spw.css` from `index.html` and all `book/chapter/*/index.html`.
**Verify**: SPW components render identically on all 14 pages. No duplicate styles.

### Phase 23: CSS Colocation Checkpoint
**Agent**: Audit CSS post-colocation
**Task**: Re-run CSS layer audit from Phase 2. Verify no layer escapes introduced. Confirm colocated CSS participates correctly in layer stack. Check that Vite injects styles in correct order (dev) and extracts correctly (build).
**Output**: `book/audits/23-css-colocation.spw` — layer integrity check, injection order verification, build output comparison, improvement delta from Phase 2.

---

## Phase H: Entry Point Updates (Phase 24)

### Phase 24: Update Import Paths + Remove Cache Params
**Agent**: Edit entry points
**Task**: Update all import paths in:
- `book/scripts/script.mjs` — SPW imports point to `./spw/`
- `book/scripts/home/app.mjs` — SPW imports point to `../spw/`
- `book/scripts/custom/register.mjs` — binding imports point to `../spw/binding/`

Remove `?v=` cache-busting params from all migrated imports. Create `book/scripts/spw/index.mjs` barrel:
```js
export { initSpwLanguageRuntime } from './interactions/interactions.mjs';
export { initSpwEthosIntegration } from './ethos/ethos.mjs';
export { attachAdvancedSpwRuntime } from './binding/advanced-runtime.mjs';
export { OPERATOR_ROLES, OPERATOR_SEQUENCE } from './core/operator-roles.mjs';
export { CONTAINER_ROLES } from './core/container-roles.mjs';
export { getSpwRegisterBank } from './core/register-bank.mjs';
```
**Verify**: All 14 pages load, all SPW features work, no console errors.

---

## Phase I: Cleanup + Final Audit (Phases 25–26)

### Phase 25: Cleanup Dead Files
**Agent**: Remove emptied/orphaned files
**Task**: Remove old source files from `modules/` and `custom/` that were moved to `spw/`. Verify no remaining imports reference old paths. Remove unused `?v=` params from any remaining imports. Evaluate deprecating `cache-context.mjs`.
**Verify**: `npm run build` succeeds, no broken imports, `dist/` output clean.

### Phase 26: Mastery Report
**Agent**: Comprehensive final audit
**Task**: Produce `book/audits/26-mastery.spw` covering:

**Spec Compliance** (compare against Phase 1–4 baselines):
- HTML semantics score: element correctness, heading hierarchy, landmarks
- ARIA score: accessible names, live regions, keyboard operability
- CSS validity: layer integrity, property health, specificity hygiene
- Responsive design: breakpoint consistency, container query coverage

**Architecture Quality** (compare against Phase 5–6 baselines):
- Component isolation: dependency count, circular deps, single-responsibility
- Adapter quality: purity, edge case coverage, API completeness
- Naming consistency: class names, data-attributes, events, custom properties
- Build pipeline: alias coverage, CSS handling, cache strategy

**Improvement Delta**: Every category scored against Phase 0 baseline.

**Component Map**: Full SPW module dependency graph showing the new `book/scripts/spw/` structure and its workbench import edges.

**Remaining Debt**: Prioritized list of issues not yet addressed with recommended next steps.

**Output**: `book/audits/26-mastery.spw`

---

## Summary: All Audit Reports

| Phase | Report | Focus |
|-------|--------|-------|
| 1 | `01-html-baseline.spw` | HTML element semantics, heading hierarchy |
| 2 | `02-css-layers-baseline.spw` | Layer stack, custom properties, specificity |
| 3 | `03-css-responsive-baseline.spw` | Breakpoints, container queries, performance |
| 4 | `04-aria-baseline.spw` | Accessibility, keyboard, live regions |
| 5 | `05-spw-dependency-map.spw` | Module graph, responsibilities, sizes |
| 6 | `06-workbench-api-surface.spw` | Export inventory, compatibility matrix |
| 9 | `09-build-pipeline.spw` | Build output, asset sizes, hashing |
| 13 | `13-adapter-quality.spw` | Adapter purity, edge cases |
| 16 | `16-register-bank-comparison.spw` | Method compatibility, migration risk |
| 18 | `18-register-bank-integration.spw` | Call sites, behavioral deltas |
| 23 | `23-css-colocation.spw` | Layer integrity post-move |
| 26 | `26-mastery.spw` | Final scores, delta, remaining debt |

## Files Modified
- `vite.config.js` — resolve aliases
- `package.json` — typescript devDependency
- `book/scripts/spw/**` — new colocated directory tree (17 files)
- `book/scripts/script.mjs` — update imports
- `book/scripts/home/app.mjs` — update imports
- `book/scripts/custom/register.mjs` — update imports
- `index.html` + `book/chapter/*/index.html` — remove colocated CSS `<link>` tags
- `book/styles/components/spw.css` — moved to `spw/binding/component.css`
- `book/audits/*.spw` — 12 audit checkpoint reports

## Verification (End-to-End)
1. `npm run dev` — all 14 pages load without console errors
2. SPW interactions: operator tooltips, brace tracing, drag-to-scope
3. Ethos panel renders on home and chapter pages
4. Grammar observatory pipeline stages display
5. RegisterBank: set/get/snapshot via console
6. Custom elements: advanced runtime attaches, style/behavior libraries work
7. `npm run build` → `dist/` correct output
8. No duplicate CSS
9. All 12 audit reports produced
