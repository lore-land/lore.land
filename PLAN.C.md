# Shadow DOM + Chrome 52-Update Exploration Plan (13 + 52 Phases)

## Context (Verified)
- Date baseline for this plan: March 2, 2026.
- Latest Chrome stable major at planning time: **Chrome 145**.
- Stable release date for Chrome 145: **February 10, 2026**.
- This plan intentionally splits into:
  - **13 phases** for Shadow DOM mastery and instrumentation.
  - **52 phases** for Chrome milestone update exploration, one phase per major update.

## Verified Sources
- Chrome 145 release notes: https://developer.chrome.com/release-notes/145
- Chrome 145 stable promotion post (Feb 10, 2026): https://chromereleases.googleblog.com/2026/02/stable-channel-update-for-desktop_10.html
- Additional 145 stable patch updates (Feb 2026): https://chromereleases.googleblog.com/2026/02/stable-channel-update-for-desktop_13.html

## .spw Syntax + Output Contract
- Every phase artifact in this plan is produced as `.spw`.
- Use this canonical audit payload shape:
```spw
#>phase_<id>
#:layer #!pragmatics
^["scope"]{ ... }
^["findings"]{ ... }
^["evidence"]{ ... }
^["decision"]{ ... }
```
- Any markdown recap is optional and derived from `.spw` artifacts.

## Program Outputs
1. `book/audits/shadow-dom/` for phases 1–13 artifacts.
2. `book/audits/chrome-updates/M{milestone}.spw` for phases 14–65 artifacts.
3. `book/audits/chrome-updates/summary-52.spw` for cross-version synthesis.
4. `book/audits/chrome-updates/risk-register.spw` for adoption blockers and mitigations.

---

## Part A — Shadow DOM Exploration (13 Phases)

### Phase 1 — Shadow DOM Baseline Inventory
**Task**: Inventory all custom elements and Shadow DOM usage patterns in this repo (`open`, `closed`, no shadow), and map where styling or behavior leaks across boundaries.
**Output**: `book/audits/shadow-dom/01-inventory.spw`

### Phase 2 — Encapsulation Model Audit
**Task**: Validate host/shadow responsibilities per component; identify which APIs, attributes, and slots are public contract vs internal implementation.
**Output**: `book/audits/shadow-dom/02-encapsulation.spw`

### Phase 3 — Slotting and Composition Analysis
**Task**: Audit `<slot>` usage (named/default/fallback), flattening behavior, and content distribution edge cases.
**Output**: `book/audits/shadow-dom/03-slotting.spw`

### Phase 4 — Styling Surface Audit
**Task**: Audit `:host`, `:host()`, `:host-context()`, `::slotted()`, `::part`, and `exportparts`; document missing or unstable style contracts.
**Output**: `book/audits/shadow-dom/04-styling-surface.spw`

### Phase 5 — Event Retargeting + Composed Path Audit
**Task**: Evaluate event propagation across shadow boundaries (`bubbles`, `composed`, retargeting); catalog brittle handlers.
**Output**: `book/audits/shadow-dom/05-events.spw`

### Phase 6 — Focus + Keyboard Navigation Audit
**Task**: Validate tab order, `delegatesFocus`, roving tabindex, and keyboard behavior across host/shadow boundaries.
**Output**: `book/audits/shadow-dom/06-focus-keyboard.spw`

### Phase 7 — Accessibility Tree + ARIA Mapping
**Task**: Inspect accessibility exposure from shadow content, label relationships, role semantics, and screen-reader discoverability.
**Output**: `book/audits/shadow-dom/07-a11y.spw`

### Phase 8 — Form Association + ElementInternals Review
**Task**: Evaluate whether form-associated custom elements or `ElementInternals` are needed; identify constraints, validity, and submission gaps.
**Output**: `book/audits/shadow-dom/08-form-internals.spw`

### Phase 9 — Declarative Shadow DOM Feasibility
**Task**: Assess SSR/hydration potential with Declarative Shadow DOM and migration constraints for current runtime architecture.
**Output**: `book/audits/shadow-dom/09-declarative-shadow-dom.spw`

### Phase 10 — Performance and Memory Audit
**Task**: Measure shadow root creation cost, style recalculation overhead, and mutation observer/event listener pressure.
**Output**: `book/audits/shadow-dom/10-performance.spw`

### Phase 11 — Test Strategy Design
**Task**: Define robust tests for shadow internals (unit + integration + visual), including selectors, snapshots, and stable probes.
**Output**: `book/audits/shadow-dom/11-test-strategy.spw`

### Phase 12 — Refactor Blueprint
**Task**: Produce a refactor matrix by component: keep, harden, or redesign; include explicit API contracts and migration order.
**Output**: `book/audits/shadow-dom/12-refactor-blueprint.spw`

### Phase 13 — Shadow DOM Master Report
**Task**: Consolidate findings, prioritize changes, and define acceptance criteria for production hardening.
**Output**: `book/audits/shadow-dom/13-master-report.spw`

---

## Part B — Latest 52 Chrome Updates Exploration (52 Phases)

**Method for each update phase (M{n})**
1. Read official release notes (`/release-notes/{n}`).
2. Read milestone highlight post (`new-in-chrome-{n}`) when available.
3. Read DevTools milestone update (`new-in-devtools-{n}`) when available.
4. Extract Shadow DOM impacts: encapsulation, slots, parts, events, custom elements, tooling.
5. Score relevance for this repo: `none | monitor | adopt | adopt-now`.
6. Emit one artifact: `book/audits/chrome-updates/M{n}.spw`.

### Phase 14 — Chrome M145 Update Audit
**Task**: Analyze Chrome 145 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M145.spw`

### Phase 15 — Chrome M144 Update Audit
**Task**: Analyze Chrome 144 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M144.spw`

### Phase 16 — Chrome M143 Update Audit
**Task**: Analyze Chrome 143 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M143.spw`

### Phase 17 — Chrome M142 Update Audit
**Task**: Analyze Chrome 142 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M142.spw`

### Phase 18 — Chrome M141 Update Audit
**Task**: Analyze Chrome 141 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M141.spw`

### Phase 19 — Chrome M140 Update Audit
**Task**: Analyze Chrome 140 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M140.spw`

### Phase 20 — Chrome M139 Update Audit
**Task**: Analyze Chrome 139 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M139.spw`

### Phase 21 — Chrome M138 Update Audit
**Task**: Analyze Chrome 138 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M138.spw`

### Phase 22 — Chrome M137 Update Audit
**Task**: Analyze Chrome 137 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M137.spw`

### Phase 23 — Chrome M136 Update Audit
**Task**: Analyze Chrome 136 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M136.spw`

### Phase 24 — Chrome M135 Update Audit
**Task**: Analyze Chrome 135 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M135.spw`

### Phase 25 — Chrome M134 Update Audit
**Task**: Analyze Chrome 134 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M134.spw`

### Phase 26 — Chrome M133 Update Audit
**Task**: Analyze Chrome 133 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M133.spw`

### Phase 27 — Chrome M132 Update Audit
**Task**: Analyze Chrome 132 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M132.spw`

### Phase 28 — Chrome M131 Update Audit
**Task**: Analyze Chrome 131 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M131.spw`

### Phase 29 — Chrome M130 Update Audit
**Task**: Analyze Chrome 130 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M130.spw`

### Phase 30 — Chrome M129 Update Audit
**Task**: Analyze Chrome 129 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M129.spw`

### Phase 31 — Chrome M128 Update Audit
**Task**: Analyze Chrome 128 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M128.spw`

### Phase 32 — Chrome M127 Update Audit
**Task**: Analyze Chrome 127 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M127.spw`

### Phase 33 — Chrome M126 Update Audit
**Task**: Analyze Chrome 126 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M126.spw`

### Phase 34 — Chrome M125 Update Audit
**Task**: Analyze Chrome 125 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M125.spw`

### Phase 35 — Chrome M124 Update Audit
**Task**: Analyze Chrome 124 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M124.spw`

### Phase 36 — Chrome M123 Update Audit
**Task**: Analyze Chrome 123 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M123.spw`

### Phase 37 — Chrome M122 Update Audit
**Task**: Analyze Chrome 122 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M122.spw`

### Phase 38 — Chrome M121 Update Audit
**Task**: Analyze Chrome 121 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M121.spw`

### Phase 39 — Chrome M120 Update Audit
**Task**: Analyze Chrome 120 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M120.spw`

### Phase 40 — Chrome M119 Update Audit
**Task**: Analyze Chrome 119 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M119.spw`

### Phase 41 — Chrome M118 Update Audit
**Task**: Analyze Chrome 118 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M118.spw`

### Phase 42 — Chrome M117 Update Audit
**Task**: Analyze Chrome 117 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M117.spw`

### Phase 43 — Chrome M116 Update Audit
**Task**: Analyze Chrome 116 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M116.spw`

### Phase 44 — Chrome M115 Update Audit
**Task**: Analyze Chrome 115 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M115.spw`

### Phase 45 — Chrome M114 Update Audit
**Task**: Analyze Chrome 114 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M114.spw`

### Phase 46 — Chrome M113 Update Audit
**Task**: Analyze Chrome 113 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M113.spw`

### Phase 47 — Chrome M112 Update Audit
**Task**: Analyze Chrome 112 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M112.spw`

### Phase 48 — Chrome M111 Update Audit
**Task**: Analyze Chrome 111 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M111.spw`

### Phase 49 — Chrome M110 Update Audit
**Task**: Analyze Chrome 110 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M110.spw`

### Phase 50 — Chrome M109 Update Audit
**Task**: Analyze Chrome 109 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M109.spw`

### Phase 51 — Chrome M108 Update Audit
**Task**: Analyze Chrome 108 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M108.spw`

### Phase 52 — Chrome M107 Update Audit
**Task**: Analyze Chrome 107 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M107.spw`

### Phase 53 — Chrome M106 Update Audit
**Task**: Analyze Chrome 106 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M106.spw`

### Phase 54 — Chrome M105 Update Audit
**Task**: Analyze Chrome 105 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M105.spw`

### Phase 55 — Chrome M104 Update Audit
**Task**: Analyze Chrome 104 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M104.spw`

### Phase 56 — Chrome M103 Update Audit
**Task**: Analyze Chrome 103 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M103.spw`

### Phase 57 — Chrome M102 Update Audit
**Task**: Analyze Chrome 102 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M102.spw`

### Phase 58 — Chrome M101 Update Audit
**Task**: Analyze Chrome 101 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M101.spw`

### Phase 59 — Chrome M100 Update Audit
**Task**: Analyze Chrome 100 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M100.spw`

### Phase 60 — Chrome M99 Update Audit
**Task**: Analyze Chrome 99 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M99.spw`

### Phase 61 — Chrome M98 Update Audit
**Task**: Analyze Chrome 98 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M98.spw`

### Phase 62 — Chrome M97 Update Audit
**Task**: Analyze Chrome 97 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M97.spw`

### Phase 63 — Chrome M96 Update Audit
**Task**: Analyze Chrome 96 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M96.spw`

### Phase 64 — Chrome M95 Update Audit
**Task**: Analyze Chrome 95 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M95.spw`

### Phase 65 — Chrome M94 Update Audit
**Task**: Analyze Chrome 94 web platform and DevTools changes, isolate Shadow DOM-relevant deltas, and decide repo adoption priority.
**Output**: `book/audits/chrome-updates/M94.spw`

---

## Final Synthesis + Governance

### Cross-Version Synthesis (post Phase 65)
**Task**: Build a 52-milestone matrix with columns: feature, first-appeared, stable support, Shadow DOM relevance, implementation cost, risk, adoption decision.
**Output**: `book/audits/chrome-updates/summary-52.spw`

### Risk Register
**Task**: Track blocking issues (compatibility, polyfills, test debt, rollout risk, accessibility regressions).
**Output**: `book/audits/chrome-updates/risk-register.spw`

### Adoption Buckets
1. `Adopt now`: clear value, low risk.
2. `Adopt with guardrails`: medium risk, behind feature toggle.
3. `Monitor`: useful but no immediate lift.
4. `Reject`: misaligned with architecture or insufficient maturity.

### Acceptance Criteria
1. Exactly **65 phases** documented (`13 + 52`).
2. Milestone coverage is contiguous from **M145 to M94**.
3. Every phase has explicit task + output path.
4. No code implementation included in this plan file.
5. Plan is directly executable by another engineer/agent.

### Assumptions
1. “Latest 52 updates” is interpreted as **52 latest major stable milestones** as of March 2, 2026.
2. Milestone range: `145..94` (inclusive = 52).
3. Official Chrome developer/release channels are the source of truth.
