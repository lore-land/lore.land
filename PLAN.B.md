# Ethos Integration Plan (Runtime-Diagnostics First, Full Stack)

### Summary
This plan deepens ethos integration across home, chapter, and custom runtime surfaces by making the ethos panel data-driven from `.spw` claims and continuously updated from live runtime signals. It is phased, keeps current claim-card interaction behavior unchanged, and prioritizes diagnostics over explanatory UX expansion.

### .spw Syntax + Output Contract
1. All new phase artifacts and diagnostics snapshots are authored in `.spw`.
2. Use this canonical shape for phase outputs:
```spw
#>phase_<id>
#:layer #!pragmatics
^["intent"]{ ... }
^["observations"]{ ... }
^["probes"]{ ... }
^["decisions"]{ ... }
```
3. Markdown can be used for human-facing summaries only; `.spw` is canonical.

### Scope Locked From Decisions
1. Scope is full stack: home + chapter + runtime signal plumbing + custom component runtime.
2. Claim source of truth is client-side fetch of `.spw` claim files.
3. Primary outcome is runtime diagnostics.
4. Claim card interactions stay as-is (no new navigation/expand behavior).
5. Delivery is phased.

### Current Gaps To Close
1. Claims are hardcoded in `spw-ethos.mjs`, not synced to `.spw` canon.
2. Ethos status is a single string overwritten by different events.
3. Ethos currently listens to only a subset of runtime signals (`selection`, `section-change`, `load-stage`).
4. No claim status model exists (`untested/active/confirmed/refuted`) tied to evidence counts.
5. No diagnostics feed exists for custom runtime cycles from `spw-advanced-runtime.mjs`.

## Phase 1 — Canon Claim Hydration (Client-Side `.spw` Fetch)
1. Add a new module `book/scripts/modules/ethos-claims.mjs`.
2. Implement `loadEthosClaims({ url, timeoutMs })` that fetches `normalizeSpwSource('claims/chapter-claims')` (resolved to `/.spw/claims/chapter-claims.spw`).
3. Implement a lightweight parser for the `^claim_chain{ ... }` block with supported fields: `claim_id`, `layer`, `hypothesis`, `measure`, `falsification`, `spec_ref`, `impl_ref`, `probe_ref`, `status`.
4. Normalize to a runtime claim type (camelCase keys, validated layer enum, stable `id`).
5. Keep backward-compatible fallback to existing hardcoded claim constants if fetch or parse fails.
6. Add source metadata for UI/debug: `remote`, `fallback-fetch-failed`, `fallback-parse-failed`.

## Phase 2 — Ethos Diagnostics Engine
1. Add `book/scripts/modules/ethos-diagnostics.mjs`.
2. Create a normalized diagnostic event model consuming:
3. `lore:load-stage`
4. `lore:spw-selection`
5. `lore:ebook-section-change`
6. `lore:acoustics-profile`
7. `lore:preference-change`
8. `lore:spw-runtime-cycle`
9. Maintain an in-memory ring buffer (`diagnosticsLimit` default `24`) and per-claim counters.
10. Implement deterministic claim scoring and status transitions:
11. Initial `untested`.
12. Move to `active` on first relevant signal.
13. Move to `confirmed` after threshold healthy evidence.
14. Move to `refuted` after threshold contradictory/error evidence.
15. Keep status session-scoped (no persistence) for now.
16. Emit optional global events for observability:
17. `lore:ethos-diagnostic` with normalized signal packet.
18. `lore:ethos-claim-status` when a claim status changes.

## Phase 3 — Integrate Into Ethos Panel (No Interaction Behavior Changes)
1. Refactor `book/scripts/modules/spw-ethos.mjs` to:
2. Load claims asynchronously from Phase 1.
3. Attach diagnostics engine from Phase 2.
4. Render status per claim without changing click behavior of `.ethos-claim-handle`.
5. Add compact diagnostics readout area (recent signals + counts).
6. Preserve current layer filtering UX and `setLayer` behavior.
7. Add dataset/state hooks for styling:
8. Panel: `data-ethos-source`, `data-ethos-diagnostic-mode`, `data-ethos-last-signal`, `data-ethos-signal-count`.
9. Claim item: `data-claim-status`, `data-claim-evidence`, `data-claim-errors`.
10. Keep current integration callsites unchanged in:
11. `book/scripts/home/app.mjs`
12. `book/scripts/script.mjs`
13. `book/scripts/modules/ebook.mjs`

## Phase 4 — Styling + Docs + Hardening
1. Update ethos styling in:
2. `book/styles/components/cards.css`
3. `book/styles/home/sections.css`
4. Add visual states for `untested`, `active`, `confirmed`, `refuted`.
5. Ensure chapter and home panels remain readable at mobile and wide breakpoints.
6. Update docs in:
7. `/.spw/index.spw`
8. `/.spw/workspace.spw`
9. Optionally enrich `.spw` claims schema in `/.spw/claims/chapter-claims.spw` to include missing `measure`, `falsification`, and `status` fields for parity with claim protocol.

### Public APIs / Interfaces / Types (Explicit Additions)
1. `initSpwEthosIntegration(options)` in `book/scripts/modules/spw-ethos.mjs`:
2. New options:
3. `claimsUrl?: string` (default `normalizeSpwSource('claims/chapter-claims')`)
4. `diagnosticsLimit?: number` (default `24`)
5. `diagnosticMode?: 'runtime'` (default `'runtime'`)
6. Existing behavior retained: `setLayer(layer)`, `destroy()`.
7. New diagnostic events:
8. `lore:ethos-diagnostic`
9. `lore:ethos-claim-status`
10. New normalized types (module-local JSDoc typedefs):
11. `EthosClaim`
12. `EthosDiagnostic`
13. `EthosClaimStatus`

### Test Cases And Scenarios
1. Claim hydration success: `.spw` fetch parses all claim layers and renders claim list.
2. Claim hydration fallback: simulate 404/parse failure and verify fallback claims render with source marker.
3. Load-stage mapping: `boon/bone/bonk/honk/bane` updates diagnostics and pipeline-related claim status.
4. Selection mapping: `lore:spw-selection` updates evidence counters and relevant claims.
5. Ebook section mapping: `lore:ebook-section-change` updates section-linked claim evidence.
6. Custom runtime mapping: `lore:spw-runtime-cycle` `phase=error` drives refutation path for relevant claims.
7. No behavior regression: clicking `.ethos-claim-handle` still only triggers current announce flow.
8. Home + chapter parity: both contexts show consistent statuses with context-specific subtitle/title retained.
9. Cleanup correctness: `destroy()` removes listeners and observer state without leaks.
10. Visual regression: status chips/readout remain legible in `grid`, `stream`, and `book` variants.

### Rollout Strategy (Phased)
1. Milestone A: Phase 1 only, with fallback guaranteed.
2. Milestone B: Phase 2 wired, diagnostics active but minimal UI exposure.
3. Milestone C: Phase 3 panel integration in both home and chapter.
4. Milestone D: Phase 4 styling/docs hardening and acceptance pass.

### Assumptions And Defaults
1. Changes are limited to `lore.land` repo code and `.spw` canon files in this repo.
2. No changes are required in `.spw/_workbench` submodule for first release.
3. `.spw` files are assumed reachable at runtime on same origin; fallback protects environments where they are not.
4. Claim status is session-scoped and not persisted across reloads by default.
5. Claim-card interaction model remains unchanged as requested.
