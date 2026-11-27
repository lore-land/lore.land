# `book/scripts/home/AGENTS.md` — *Exactly One Pie* Architecture

Loaded when working on the home page or *Exactly One Pie* (`pie-game.mjs`, `pie-sound.mjs`, and `pie/`).

## Module layout

### Top-level coordinators & canon data
- `pie-game.mjs` — simulation loop, collision & trajectory physics, trope crossings, chapter voyages, and `initPieGame` composition root. Re-exports declarative registries (`registerRecipe`, `registerThingRenderer`, `registerCarrierRenderer`).
- `pie-sound.mjs` — Web Audio graph, CC0 sample loader, ambience/chord bed, beat scheduler, and public audio API. Re-exports declarative audio planners & registries from `pie/audio/`.
- `pie-world.mjs` — world catalogue (scenes, hazards, carriers, whimsy, horn games, schemes).
- `pie-rhythm.mjs` — beat conductor, tempo/swing steps, chapter level loader.
- `pie-frame.mjs` — board geometry, hold layouts, `^board{}` line serialization.
- `pie-powers.mjs` / `pie-spw.mjs` — Spw power spells, provenance cards, `.spw/runtime/pie-rules.spw` live reader.
- `pie-live.mjs`, `pie-story-lane.mjs`, `pie-draw.mjs`, `pie-setup-ui.mjs`, `pie-show.mjs`, `pie-heights.mjs`, `pie-panels.mjs`, `pie-pacing.mjs`, `pie-mimes.mjs`, `pie-ants.mjs`, `pie-jokes.mjs`, `pie-seasons.mjs`, `pie-finds.mjs`, `pie-reactions.mjs`, `pie-reasons.mjs`, `pie-cards.mjs`, `pie-tropes.mjs` — focused game mechanics and overlays.

### `pie/audio/` — Modular Web Audio planner & synth kit
- `harmony.mjs` (`// @ts-check`) — pentatonic scales, chapter keys, harmonic arc/debt/foreshadow plans, `harmonicBridgePlan`, `motifArcPlan`, `shelfColorParams`, `roomPlan`, `rhythmFoundPlan`.
- `jazz.mjs` (`// @ts-check`) — `JAZZ_STYLES`, `JAZZ_LEANS`, `registerJazzStyle`, `registerJazzLean`, `jazzPhrasePlan`, `composePhraseVariation`, `chapterIncipitPlan`, `chapterCadencePlan`, `mimeRestPlan`, `curtainCallPlan`.
- `story-plans.mjs` (`// @ts-check`) — `WONDER_SYNTAXES`, `registerWonderSyntax`, `wonderSyntaxPlan`, `tropeMotifPlan`, `chainStingPlan`, `characterMotifPlan`, `characterThemePlan`, `registerThemeFlourish`, `cadenceVoicePlan`, `dimensionFanfarePlan`, `powerEndingPlan`.
- `scored-plans.mjs` (`// @ts-check`) — room acoustics (`ROOMS`, `COLOUR_FALL`), `approachCuePlan`, `laneWarningPlan`, `landPulsePlan`, `landQualityPlan`, `feelSamplePlan`.
- `synth-kit.mjs` — browser Web Audio voice primitives, panner/reverb bus, `registerMaterialSound` (knocks/slips), `registerAmbience` (scene soundscapes).

### `pie/render/` — Canvas 2D vector rig & scene rendering
- `vector-parts.mjs` (`// @ts-check`) — shared `Path2D` vector part grammar (`VECTOR_PARTS`), `computeCarrierPose` (beat-coupled articulated rig; Figure stays plain ink lines; reduced motion zeroes bob/sway), and `createStampCache` (palette-aware LRU `OffscreenCanvas`/canvas stamp cache).
- `things.mjs` — `BUILTIN_THING_RENDERERS` table + `registerThingRenderer` / `unregisterThingRenderer`, plus `drawThing`, `drawMime`, `drawClown`, `drawWedge`, seal loading.
- `cast.mjs` — `registerCarrierRenderer` / `unregisterCarrierRenderer`, `drawFigure` (canon plain-line ink), `drawBody` (articulated carrier rig), `drawPie` (recipe crust/glaze rendering), `drawHat`, `drawSpill`, `drawBoof`, `drawBoonWAP`, `drawBaneWAP`, `drawEscorts`, `drawFlight`, `drawBursts`.
- `hud.mjs` — corvid flock, lane bands, place lights, scene backdrop, aim needle, dust, section rules, rain, shelves, HUD chrome, foretold banners, depth guides, dimension flash, land quality, carrier tune, hop gauge, whimsy.

### `pie/sim/` — Simulation data, accessibility & input
- `recipes.mjs` (`// @ts-check`) — `BUILTIN_RECIPES`, `RECIPES`, `registerRecipe`, `unregisterRecipe`, `listRecipes`, `recipeVisualFor`, `INGREDIENT_ROOMS`, `resolveRecipeBake`.
- `aria-mirror.mjs` (`// @ts-check`) — standard polite `role="status"` DOM readout mirror (`formatBoardReadout`, `createAriaMirror`, triggered on `R` or significant board shifts; zero Origin Trials).
- `record.mjs` — board geometry constants (`W`, `H`, `LANES`, `LANE_W`, `PLAYER_Y`, `ROWS`, `rowY`), `localStorage` record helpers, discovery counts, palette/channel mixing.
- `input.mjs` — keyboard (including `R` ARIA readout), pointer drag/flick/tap, touch buttons, `ResizeObserver`, theme `MutationObserver`, sound toggle.

### `pie/ui/` — Interactive chrome & workbench
- `setup.mjs` — Setup drawer/sheet, layout presets, hold selection, `^board{}` line UI, sound clusters, domain tuning dials, cabinet/story-strip resize grips, pinch/wheel zoom.
- `cards.mjs` — `SPRITES` legend & recipe previews, lore shelf, almanac/QA cards, Ask mode inspection, card reveal queue, start card modes.
- `workbench.mjs` — Spw power-up bench, scrubbable tuning desk, universal `pasteSpell` router, thumbs pad, view/show/bias/points panels, fullscreen manager, asset manifest sheet.

### `pie/tune/`, `pie/story/`, `pie/menu/`
- `pie/tune/scene.mjs` & `personality.mjs` — scene physics vectors and carrier voice plans (with `.test.mjs` suites).
- `pie/story/eggs.mjs` & `thresholds.mjs` — Egg warmth/hush marks and shelf threshold branches.
- `pie/menu/teach.mjs` — teaching lines, jokes, and nudge copy.

## How to extend creatively

- **New pie recipe**: call `registerRecipe({ id, name, need, gives, note, crust, fill, glaze, crustColor, fillColor, glazeColor })` from `pie-game.mjs` or `pie/sim/recipes.mjs`. `drawPie` automatically renders its crust, filling, and glaze.
- **New lane obstacle / wonder renderer**: call `registerThingRenderer(kind, (t, ctx, helpers) => { ... })` from `pie-game.mjs` or `pie/render/things.mjs`.
- **New carrier visual**: call `registerCarrierRenderer(carrierId, ({ ctx, x, y, tilt, pose, ... }) => { ... })`. Never alter the Figure's plain-line ink canon (`drawFigure`).
- **New jazz style or material sound**: call `registerJazzStyle(name, spec)`, `registerWonderSyntax(kind, spec)`, `registerMaterialSound(kind, fn)`, or `registerAmbience(scene, fn)` from `pie-sound.mjs` / `pie/audio/`.

## Invariants checked by tools

Do not move these declarations out of `pie-game.mjs`:
- `trope-wiring.mjs`: `spill`, `passageHref`, `returnAnchor`, `closeLeg`, `tickMargins`, `keepDeeds`, `foil`, `speak`, `lean`, `fresh`, `onPassage`, `knock`, `tickThursday`, `castIfRoomAsks`, `shortArm`, `keep`.
- `elaboration-check.mjs`: `metAt('<moment>')` call sites.
- `browser-smoke.mjs`: the exact line `  const update = (rawDt) => {` (test hook injection point).
