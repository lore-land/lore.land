# AGENTS.md

Model-neutral guide to `lore.land`: architecture, canon routing, JavaScript module boundaries, creative extension points, and verification invariants.

## What this repository is

`lore.land` is a static multi-page worldbuilding book and playable companion site deployed directly from `main` to GitHub Pages.

- **Runtime**: browser-native ES modules (`.mjs`) and layered CSS (`book/styles/`). No runtime bundler; Vite is used only by `npm run build` / `npm run check` to verify the production graph.
- **Source of truth**: chapter prose lives in `book/content/chapters/*.json`; world canon, design decisions, and plans live in `.spw/`.
- **Public tree**: everything on `main` is publicly served at `lore.land`. Keep private notes, credentials, local paths, and held-back plot off `main` (drafts belong in gitignored `.studio/`).

## Start here (plan & canon routing)

1. `.spw/index.spw` — canon surface index and `~direction` (next stones and open work).
2. `.spw/plans/index.spw` — plan router covering `PLAN.E.spw`, `PLAN.F.spw`, and focused domain plans:
   - `.spw/plans/audio-jazz-rhythm/PLAN.md`
   - `.spw/plans/characters-canvas-rig/PLAN.md`
   - `.spw/plans/ecosystem-workbench/PLAN.md`
   - `.spw/plans/platform-and-prose/PLAN.md`
   - `.spw/plans/story-spw-wonders/PLAN.md`
3. `.spw/workspace.spw` and `.spw/state/grants.spw` — standing boundaries, canon guards, and grants.
4. Scoped guides: `CLAUDE.md` (release/build/generated files), `.spw/CLAUDE.md` (Spw authoring & tooling), `book/scripts/modules/CLAUDE.md` (Spw reader wiring), and `book/scripts/home/AGENTS.md` (*Exactly One Pie* engine & registries).

## JavaScript module map

### Chapter reader (`book/scripts/script.mjs` + `book/scripts/chapter/`)
- `book/scripts/script.mjs` — chapter lifecycle coordinator (`DOMContentLoaded`, metadata, prerender fallback, idle enhancement loading, `window.__loreCleanup`).
- `book/scripts/chapter/routes.mjs` — prev/next chapter controls, Spw hypertext route list, carry-on button, Alt-key shortcuts.
- `book/scripts/chapter/motifs.mjs` — optional Midjourney motif vault, ambient texture overlay, per-chapter sigil loader.
- `book/scripts/chapter/panels.mjs` — trope ledger, tuning profile selector, authorship panel, lore collector, custom voice element toggles.

### Shared reader & Spw runtime (`book/scripts/modules/`)
- `spw-projection-disk.mjs` — Scriptorium Poincaré disk UI & animation; delegates pure math and canon graph logic to:
  - `spw-disk/geometry.mjs` (`// @ts-check`) — complex arithmetic, Möbius maps, orthogonal geodesic arcs, radial hyperbolic layout (`layoutFrom`).
  - `spw-disk/graph.mjs` — `buildGraph`, `loopsThrough`, `loopsToOffer`, `tieWords`, sidecar/index parsers, plus reusable graph queries (`subgraphAround`, `shortestPath`) and portable walk serialization (`exportWalkAsSpw`).
- `spw-interactions.mjs` — canonical `OPERATOR_ROLES` / `CONTAINER_ROLES`, token/brace highlighter, selection URL hash restore; delegates projection & UI widgets to:
  - `spw-interactions/story-cube.mjs` — association extraction, path/annotation collectors, 6-face Rubik's Cube storytelling projection.
  - `spw-interactions/controls.mjs` — `<spw-registers>` custom element, CodeLens inspection controls, geometry navigator, operator batch swapper, register panel.
- `ebook-navigation.mjs` — chapter section rail, popover contents, scribe/reader register toggle, keyboard/bracket navigation; delegates analysis & persistence to:
  - `ebook/section-model.mjs` — section classification, perspective/payload filters, Spw handle formatting, definition/reference graph resolution.
  - `ebook/storage.mjs` — `localStorage` reading state, register persistence, nearest-section viewport probe.
- `spw-portable.mjs` (`// @ts-check`) — client-side `#spw64=` base64url URL fragment codec (`encodeSpwFragment`, `decodeSpwFragment`), cross-host `word[mode]{body}(scene)<concept>` slot projector (`projectCrossHostSlot`), and portable door URL builder (`buildPortableDoorUrl`).

### *Exactly One Pie* (`book/scripts/home/` + `book/scripts/home/pie/`)
See `book/scripts/home/AGENTS.md` for the full subsystem map:
- `pie-game.mjs` — core simulation loop, lane physics, trope crossings, chapter progression.
- `pie-sound.mjs` + `pie/audio/{harmony,jazz,story-plans,scored-plans,synth-kit}.mjs` — procedural Web Audio + CC0 sample engine with pure plan helpers.
- `pie/render/{vector-parts,things,cast,hud}.mjs` — Path2D character rig, offscreen stamp cache, declarative thing/carrier renderers, HUD & weather.
- `pie/sim/{recipes,aria-mirror,record,input}.mjs` — declarative pie recipes, standard ARIA board mirror (`R` hotkey), persistence/palette utilities, keyboard/pointer/touch input.
- `pie/ui/{setup,cards,workbench}.mjs` — Setup drawer & `^board{}` line, almanac/lore/start cards, Spw power bench & tuning desk.
- `pie/tune/`, `pie/story/`, `pie/menu/` — scene physics, carrier voices, egg marks, thresholds, teaching lines.

## Creative extension registries

Add new musical styles, sounds, hazards, carriers, recipes, or graph walks without editing engine loops:

| Domain | Registry / API | Module |
| --- | --- | --- |
| Jazz styles & leans | `registerJazzStyle`, `registerJazzLean`, `composePhraseVariation`, `harmonicBridgePlan` | `book/scripts/home/pie/audio/jazz.mjs` & `harmony.mjs` (re-exported by `pie-sound.mjs`) |
| Wonder/theme/material audio | `registerWonderSyntax`, `registerThemeFlourish`, `registerMaterialSound`, `registerAmbience` | `book/scripts/home/pie/audio/story-plans.mjs`, `scored-plans.mjs`, `synth-kit.mjs` |
| Lane obstacle & wonder art | `registerThingRenderer`, `unregisterThingRenderer` | `book/scripts/home/pie/render/things.mjs` (re-exported by `pie-game.mjs`) |
| Carrier silhouettes & rigs | `registerCarrierRenderer`, `unregisterCarrierRenderer`, `VECTOR_PARTS`, `computeCarrierPose`, `createStampCache` | `book/scripts/home/pie/render/cast.mjs` & `vector-parts.mjs` |
| Pie recipes & glaze/crust visuals | `registerRecipe`, `unregisterRecipe`, `listRecipes`, `recipeVisualFor` | `book/scripts/home/pie/sim/recipes.mjs` (re-exported by `pie-game.mjs`) |
| Hyperbolic graph & portable Spw | `subgraphAround`, `shortestPath`, `exportWalkAsSpw`, `encodeSpwFragment`, `projectCrossHostSlot` | `book/scripts/modules/spw-disk/graph.mjs` & `spw-portable.mjs` |

## Static-check invariants (do not break when refactoring)

Several verification tools scan source files statically:

1. **`book/scripts/tools/trope-wiring.mjs`**: scans `book/scripts/home/pie-game.mjs` as text for literal `function`/`const`/`let`/`var` declarations (`spill`, `passageHref`, `returnAnchor`, `closeLeg`, `tickMargins`, `keepDeeds`, `foil`, `speak`, `lean`, `fresh`, `onPassage`, `knock`, `tickThursday`, `castIfRoomAsks`, `shortArm`, `keep`). Keep those declared in `pie-game.mjs`.
2. **`book/scripts/tools/elaboration-check.mjs`**: scans `book/scripts/home/pie-game.mjs` for `metAt('<moment>')` call sites.
3. **`book/scripts/tools/browser-smoke.mjs`**: injects `window.__pieTest` directly before the exact line `  const update = (rawDt) => {` in `book/scripts/home/pie-game.mjs`, closing over `run`, `state`, `board`, `actOutChain`, `scheme`, `enterChapter`, `closeLeg`, `knock`, `seasonClock`, `pasteSpell`, `carrierById`, `jump`, `laneX`, `spawnRing`, `levelData`, `allowed`, `spawnRow`, `legTension`, `progress`.
4. **`book/scripts/tools/play-graph-check.mjs`**: scans `book/scripts/modules/spw-interactions.mjs` as text for `OPERATOR_ROLES` entries (`'(.)': { role: '...' }`) and the comment `spirit roles: <#.> capsule, (#.) scope, [#.] frame, {#.} body`. Keep both in `spw-interactions.mjs`.
5. **`book/scripts/tools/align-tokens.mjs`**: enforces one consistent `?v=` cache token per file across all versioned imports/links. New internal submodules imported from a single host surface omit `?v=`; imports of existing versioned modules must carry the matching `?v=` token (run `npm run tokens:align`).

## Standing canon & engineering boundaries

- **Never hand-edit generated files** (see `CLAUDE.md` → *Generated files*) or `book/content/chapters/*.json` unless prose changes were requested.
- **Canon guards**: the Figure in plain lines is unnamed and stays *"one circle, one rectangle, four lines, two dots. Always ink."* The Egg is never explained.
- **Platform discipline**: zero Origin Trials (`canvas-html`, `webmcp`); use standard ARIA (`pie/sim/aria-mirror.mjs`), honor `prefers-reduced-motion`, and keep zero-JS Baseline chapter prose intact.
- **Type safety**: `tsconfig.tools.json` runs `strict: true` over all tools and imported `// @ts-check` modules. Add `// @ts-check` to pure modules; never loosen `strict`.
- **Git**: never commit or push unless explicitly requested.

## Verification workflow

```sh
npm run tokens:align                       # align ?v= release tokens on changed versioned files
node --test "book/scripts/**/*.test.mjs"   # pure unit tests (audio, vector rig, recipes, ARIA, Spw disk, portable Spw, tune)
npm run types                              # strict tsc check on tools & @ts-check modules
npm run check                              # full 25-step CI suite + generated-file freshness check
npm run smoke                              # headless Chrome smoke tests (requires Chrome; not in CI)
```

Note: `npm run sound:check` verifies acoustic/harmonic plans mathematically; state explicitly if audio was not auditioned by a human ear.
