# Houdini APIs + Firefox Features Exploration Plan (52 + 13 Phases)

## Context
- Date baseline: March 2, 2026.
- Primary source set for Part A: MDN Houdini APIs documentation.
- Program shape requested: 52 Houdini phases followed by 13 Firefox feature phases.
- This is an exploration and audit plan, not an implementation plan.

## Sources
- MDN Houdini APIs: https://developer.mozilla.org/en-US/docs/Web/API/Houdini_APIs
- MDN Firefox Experimental Features: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features

## .spw Syntax + Output Contract
- All outputs are `.spw` planning/audit artifacts.
- Canonical phase artifact shape:
```spw
#>phase_<id>
#:layer #!pragmatics
^["intent"]{ ... }
^["audit"]{ ... }
^["evidence"]{ ... }
^["recommendation"]{ ... }
```
- Markdown summaries are optional; `.spw` remains the source artifact.

## Program Outputs
1. `book/audits/houdini/` for phases 1 to 52.
2. `book/audits/firefox-features/` for phases 53 to 65.
3. `book/audits/firefox-features/summary.spw` for final synthesis.

---

## Part A - Houdini APIs Exploration (52 Phases)

### Phase 1 - Houdini Scope and Constraints
**Task**: Define project goals, non-goals, and risk tolerance for Houdini usage.
**Output**: `book/audits/houdini/01-scope-constraints.spw`

### Phase 2 - Browser Support Matrix
**Task**: Build browser support matrix for Properties and Values, Typed OM, Painting API, and Worklet surfaces.
**Output**: `book/audits/houdini/02-support-matrix.spw`

### Phase 3 - Repo CSS Baseline Inventory
**Task**: Inventory CSS architecture, tokens, custom properties, and potential Houdini insertion points.
**Output**: `book/audits/houdini/03-repo-css-baseline.spw`

### Phase 4 - Custom Property Inventory
**Task**: Map all current custom properties and classify candidates for registration via `@property`.
**Output**: `book/audits/houdini/04-custom-property-inventory.spw`

### Phase 5 - Paint Use Case Shortlist
**Task**: Prioritize high-value paint() use cases and reject novelty-only experiments.
**Output**: `book/audits/houdini/05-paint-usecase-shortlist.spw`

### Phase 6 - Typed OM Use Case Shortlist
**Task**: Identify operations currently using string CSS manipulation that should move to Typed OM.
**Output**: `book/audits/houdini/06-typed-om-usecase-shortlist.spw`

### Phase 7 - Worklet Boundary Model
**Task**: Define boundaries between main thread code and worklet code.
**Output**: `book/audits/houdini/07-worklet-boundary-model.spw`

### Phase 8 - Accessibility and Safety Baseline
**Task**: Define baseline accessibility and safety criteria for Houdini outputs.
**Output**: `book/audits/houdini/08-a11y-safety-baseline.spw`

### Phase 9 - Properties Syntax Taxonomy
**Task**: Define reusable syntax taxonomy for property registration (`<color>`, `<length>`, etc.).
**Output**: `book/audits/houdini/09-properties-syntax-taxonomy.spw`

### Phase 10 - CSS.registerProperty Strategy
**Task**: Decide when to use JS registration vs static `@property` declarations.
**Output**: `book/audits/houdini/10-registerproperty-strategy.spw`

### Phase 11 - Authoring Conventions for @property
**Task**: Create naming, defaults, and inheritance conventions for all registered properties.
**Output**: `book/audits/houdini/11-property-authoring-conventions.spw`

### Phase 12 - Inheritance and Initial Value Policy
**Task**: Standardize inheritance and initial value policy by token class.
**Output**: `book/audits/houdini/12-inheritance-initial-policy.spw`

### Phase 13 - Invalid Value Fallback Tests
**Task**: Design tests for parse failures and invalid custom property values.
**Output**: `book/audits/houdini/13-invalid-value-tests.spw`

### Phase 14 - Interpolation and Animation Rules
**Task**: Define interpolation expectations for typed custom properties in animations.
**Output**: `book/audits/houdini/14-interpolation-rules.spw`

### Phase 15 - Theme Token Migration Pilot
**Task**: Run pilot migration of a theme token cluster to registered properties.
**Output**: `book/audits/houdini/15-theme-token-pilot.spw`

### Phase 16 - Properties and Values Checkpoint
**Task**: Checkpoint findings, blockers, and rollout recommendation for API adoption.
**Output**: `book/audits/houdini/16-properties-values-checkpoint.spw`

### Phase 17 - Typed OM Read Path Audit
**Task**: Audit all read access paths that should move to `computedStyleMap()`.
**Output**: `book/audits/houdini/17-typed-om-read-audit.spw`

### Phase 18 - Typed OM Write Path Audit
**Task**: Audit all write paths that should move to `attributeStyleMap` or Typed OM setters.
**Output**: `book/audits/houdini/18-typed-om-write-audit.spw`

### Phase 19 - Unit Conversion Utility Design
**Task**: Define utility layer for `CSSUnitValue` conversion and normalization.
**Output**: `book/audits/houdini/19-unit-conversion-utilities.spw`

### Phase 20 - Transform Typed Values
**Task**: Plan typed transform and matrix manipulation strategy.
**Output**: `book/audits/houdini/20-transform-typed-values.spw`

### Phase 21 - Color Typed Values Workflow
**Task**: Define typed color workflow and fallback behavior.
**Output**: `book/audits/houdini/21-color-typed-workflow.spw`

### Phase 22 - Unit Normalization Policy
**Task**: Standardize unit normalization across animation and layout math.
**Output**: `book/audits/houdini/22-unit-normalization-policy.spw`

### Phase 23 - Typed OM Benchmark Harness
**Task**: Create benchmark design for string CSSOM vs Typed OM workflows.
**Output**: `book/audits/houdini/23-typed-om-benchmark-harness.spw`

### Phase 24 - Typed OM Checkpoint
**Task**: Checkpoint Typed OM practicality, performance, and migration readiness.
**Output**: `book/audits/houdini/24-typed-om-checkpoint.spw`

### Phase 25 - Painting API Architecture
**Task**: Define architecture for paint worklets and host integration.
**Output**: `book/audits/houdini/25-painting-api-architecture.spw`

### Phase 26 - Paint Worklet Scaffold
**Task**: Design module scaffold and registration flow for paint worklets.
**Output**: `book/audits/houdini/26-paint-worklet-scaffold.spw`

### Phase 27 - Input Properties Contract
**Task**: Define `inputProperties` contract and token dependency rules.
**Output**: `book/audits/houdini/27-input-properties-contract.spw`

### Phase 28 - Deterministic Rendering Rules
**Task**: Define deterministic rendering requirements for paint outputs.
**Output**: `book/audits/houdini/28-deterministic-rendering-rules.spw`

### Phase 29 - Paint Primitive Library
**Task**: Design reusable primitive set for shapes, gradients, noise, and patterns.
**Output**: `book/audits/houdini/29-paint-primitive-library.spw`

### Phase 30 - DPR and Resolution Strategy
**Task**: Define device pixel ratio and resolution handling rules.
**Output**: `book/audits/houdini/30-dpr-resolution-strategy.spw`

### Phase 31 - No Support Fallback Path
**Task**: Define fallback rendering path when Painting API is unsupported.
**Output**: `book/audits/houdini/31-no-support-fallback.spw`

### Phase 32 - Paint Cache and Invalidation
**Task**: Design invalidation policy for paint outputs and property changes.
**Output**: `book/audits/houdini/32-paint-cache-invalidation.spw`

### Phase 33 - Paint Performance Budgets
**Task**: Define frame budget, paint cost thresholds, and profiling plan.
**Output**: `book/audits/houdini/33-paint-performance-budgets.spw`

### Phase 34 - Painting API Checkpoint
**Task**: Checkpoint performance, reliability, and use-case viability.
**Output**: `book/audits/houdini/34-painting-api-checkpoint.spw`

### Phase 35 - Worklet Lifecycle Model
**Task**: Document load, initialize, execute, and teardown lifecycle for worklets.
**Output**: `book/audits/houdini/35-worklet-lifecycle-model.spw`

### Phase 36 - Worklet Module Loading Strategy
**Task**: Define loading, preloading, and module cache strategy for worklets.
**Output**: `book/audits/houdini/36-worklet-module-loading.spw`

### Phase 37 - Worklet Error Handling
**Task**: Define runtime error classification, fallbacks, and observability hooks.
**Output**: `book/audits/houdini/37-worklet-error-handling.spw`

### Phase 38 - Security and Privacy Review
**Task**: Review security and privacy implications for all Houdini worklet usage.
**Output**: `book/audits/houdini/38-security-privacy-review.spw`

### Phase 39 - Memory Behavior Audit
**Task**: Audit memory footprint and lifecycle for worklet-heavy pages.
**Output**: `book/audits/houdini/39-memory-behavior-audit.spw`

### Phase 40 - Main Thread Coordination
**Task**: Define legal communication patterns between main thread and worklets.
**Output**: `book/audits/houdini/40-main-thread-coordination.spw`

### Phase 41 - Worklet CI Smoke Tests
**Task**: Design CI smoke tests for feature detection and runtime sanity.
**Output**: `book/audits/houdini/41-worklet-ci-smoke.spw`

### Phase 42 - Worklet Debugging Workflow
**Task**: Define Firefox and Chromium debugging workflow for worklets.
**Output**: `book/audits/houdini/42-worklet-debugging-workflow.spw`

### Phase 43 - A11y Validation for Generated Paint
**Task**: Validate contrast, semantics, and readability impacts of generated visuals.
**Output**: `book/audits/houdini/43-a11y-validation-generated-paint.spw`

### Phase 44 - Worklet Track Checkpoint
**Task**: Checkpoint worklet reliability, diagnostics, and tooling maturity.
**Output**: `book/audits/houdini/44-worklet-track-checkpoint.spw`

### Phase 45 - Integrate Properties plus Typed OM
**Task**: Plan joint usage pattern of registered properties with Typed OM.
**Output**: `book/audits/houdini/45-integrate-properties-typed-om.spw`

### Phase 46 - Integrate Typed OM plus Paint
**Task**: Plan Typed OM driven paint updates and update throttling.
**Output**: `book/audits/houdini/46-integrate-typed-om-paint.spw`

### Phase 47 - End to End Houdini Component Demos
**Task**: Design demonstration components proving real product value.
**Output**: `book/audits/houdini/47-endtoend-demos.spw`

### Phase 48 - Regression and Snapshot Plan
**Task**: Define regression suite and visual snapshot protocol for Houdini surfaces.
**Output**: `book/audits/houdini/48-regression-snapshot-plan.spw`

### Phase 49 - Author Documentation Plan
**Task**: Define author facing docs and examples for safe Houdini usage.
**Output**: `book/audits/houdini/49-author-documentation-plan.spw`

### Phase 50 - Adoption Decision Matrix
**Task**: Build matrix for adopt now, guardrail, monitor, and reject decisions.
**Output**: `book/audits/houdini/50-adoption-decision-matrix.spw`

### Phase 51 - Rollout and Feature Flags
**Task**: Define staged rollout and kill-switch strategy for Houdini surfaces.
**Output**: `book/audits/houdini/51-rollout-feature-flags.spw`

### Phase 52 - Houdini Master Report
**Task**: Produce final synthesis with implementation-ready recommendations.
**Output**: `book/audits/houdini/52-houdini-master-report.spw`

---

## Part B - Interesting Firefox Feature Exploration (13 Phases)

### Phase 53 - Firefox DevTools Grid and Flex Inspectors
**Task**: Evaluate Grid Inspector and Flexbox Inspector workflows for this codebase and define repeatable debugging playbooks.
**Output**: `book/audits/firefox-features/53-devtools-grid-flex.spw`

### Phase 54 - Firefox Profiler Workflow
**Task**: Define profiling workflow using Firefox Profiler for layout, script, and paint bottlenecks.
**Output**: `book/audits/firefox-features/54-firefox-profiler.spw`

### Phase 55 - Fission Site Isolation
**Task**: Assess Fission implications for embedding, cross-origin behavior, and debugging assumptions.
**Output**: `book/audits/firefox-features/55-fission-site-isolation.spw`

### Phase 56 - Enhanced Tracking Protection
**Task**: Audit how ETP can affect analytics, embeds, and resource loading in this project.
**Output**: `book/audits/firefox-features/56-enhanced-tracking-protection.spw`

### Phase 57 - Total Cookie Protection
**Task**: Assess storage partitioning effects on session, preferences, and cross-site integrations.
**Output**: `book/audits/firefox-features/57-total-cookie-protection.spw`

### Phase 58 - CloseWatcher API Tracking
**Task**: Track Firefox support and practical usage for CloseWatcher in component UX patterns.
**Output**: `book/audits/firefox-features/58-closewatcher-tracking.spw`

### Phase 59 - HTML Sanitizer API Tracking
**Task**: Track Firefox support and define safe adoption strategy for HTML Sanitizer API usage.
**Output**: `book/audits/firefox-features/59-html-sanitizer-tracking.spw`

### Phase 60 - WebGPU in Firefox
**Task**: Assess Firefox WebGPU readiness and platform constraints relevant to future visuals.
**Output**: `book/audits/firefox-features/60-webgpu-firefox.spw`

### Phase 61 - Atomics.waitAsync Tracking
**Task**: Track readiness and likely impact of Atomics.waitAsync for future runtime design.
**Output**: `book/audits/firefox-features/61-atomics-waitasync.spw`

### Phase 62 - WebExtensions MV3 Compatibility
**Task**: Audit Firefox MV3 capabilities and constraints for extension-side tooling plans.
**Output**: `book/audits/firefox-features/62-webextensions-mv3.spw`

### Phase 63 - Picture in Picture Workflows
**Task**: Evaluate Firefox Picture in Picture behavior for media-heavy chapter surfaces.
**Output**: `book/audits/firefox-features/63-picture-in-picture.spw`

### Phase 64 - Firefox Accessibility Inspector
**Task**: Define workflow using Firefox Accessibility Inspector for component-level audits.
**Output**: `book/audits/firefox-features/64-accessibility-inspector.spw`

### Phase 65 - Firefox Feature Synthesis Report
**Task**: Synthesize all 13 Firefox feature audits into prioritized recommendations.
**Output**: `book/audits/firefox-features/65-firefox-feature-synthesis.spw`

---

## Acceptance Criteria
1. Exactly 65 phases are present.
2. Phases 1 to 52 are Houdini-only exploration phases.
3. Phases 53 to 65 are Firefox feature exploration phases.
4. Every phase has explicit task and output artifact path.

## Assumptions
1. The 52 Houdini phases are deep-dive exploration and audit phases, not 52 distinct APIs.
2. Firefox phases are feature-focused explorations intended to inform future implementation decisions.
3. This plan is documentation-only and does not apply code changes.
