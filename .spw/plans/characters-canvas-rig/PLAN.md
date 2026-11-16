# Plan — Character Design, Path2D Sharing & Canvas 2D Rig

- **Status**: `proposed` (`2026-11-16`, owner `characters-canvas-rig`, slice `PLAN.F.spw#f38`)
- **Primary Files**:
  - `book/scripts/home/pie-game.mjs` (`drawFigure`, `drawBoof`, `drawBoonWAP`, `drawBaneWAP`)
  - `book/scripts/home/pie-draw.mjs` (carrier face overlays, mechanics rings, ground)
  - `book/scripts/modules/characters.mjs` (`DRAW`, `STAND`, `portraitSVG`)

## Observation & Diagnosis

HTML Canvas 2D (`getContext('2d')`) does not technically limit character design—it supports cubic/quadratic Beziers, native `new Path2D(svgPathString)`, radial/linear gradients, composite modes, and offscreen bitmap caching.

The real constraints in the current codebase are architectural:
1. **Dual source of truth**: In-lane characters are written as imperative `ctx.beginPath()` / `ctx.arc()` / `ctx.fillRect()` sequences in `pie-game.mjs`, separate from the declarative SVG paths in `characters.mjs`.
2. **Per-frame geometry rebuilds**: Every accessory and gradient re-tessellates every frame, discouraging intricate silhouettes, textured ink lines, or layered cloth on low-end mobile GPUs.
3. **Unarticulated animation rigs**: `drawFigure` relies mostly on squash/stretch scale and one `stride` sine wave rather than hierarchical joint angles (torso tilt into lane turns, trailing coat hems/ruffs, pie-plate counterbalance, beat pulse).
4. **Canon constraint to preserve**: The default Figure intentionally obeys *"one circle, one rectangle, four lines, two dots. Always ink."* Richer surface detail belongs to silhouette/pose kinematics on the Figure and full costume/silhouette craft on named carriers (`porter`, `clerk`, `genie`, `clown`), `Boof`, `BoonWAP`, `BaneWAP`, and `BoneWAP`.

## Proposed Phases

1. **Phase 1 — Shared Vector Part Grammar (`Path2D`)**
   - Extract reusable vector path `d` definitions (`hat`, `porter_strap`, `genie_lapel`, `clown_ruff`, `boof_muzzle`, `bane_switch`) into a shared data module imported by both `characters.mjs` and `pie-draw.mjs`.
   - Render Canvas silhouettes via cached `Path2D` instances instead of duplicated imperative polyline sequences.
2. **Phase 2 — Palette-Aware Offscreen Layer Caching**
   - Bake static high-detail torso/costume/ink-grain stamps into offscreen canvases keyed by `(carrierId, bindingPaletteKey, dpr)` and invalidate only on theme/binding change.
   - Keep articulated elements (`legs`, `coat_hem`, `arms_and_plate`, `hat_hover`, `mien_marks`) dynamic so pose and expression stay responsive.
3. **Phase 3 — Beat-Coupled Articulated 2D Rig**
   - Drive secondary motion (ruff/coat drag, stride asymmetry, pie tilt counterbalance, subtle hop anticipation) from `run.vx`, `run.wobble`, `jumpLift()`, and `conductor.beatState()` while respecting `prefers-reduced-motion`.

## Verification

- `npm run check` (`types`, `book:check`, `board:check`, `tokens:align`)
- `npm run smoke` (portrait unique IDs, carrier selection, and lane rendering)
