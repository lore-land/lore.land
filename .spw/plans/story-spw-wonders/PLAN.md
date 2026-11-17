# Plan — Story Integration, Trope Development & Collectible Syntax Wonders

- **Status**: `active_iteration` (`2026-11-16`, owner `story-spw-wonders`, slices `f31`, `f34`, `f40`)
- **Recent Landed Receipt**: `e96b885`
- **Primary Files**:
  - `book/scripts/modules/trope-strip.mjs`
  - `book/scripts/modules/trope-reveal.mjs`
  - `book/scripts/modules/almanac.mjs`
  - `book/scripts/modules/chapter-inventory.mjs`
  - `book/scripts/home/pie-story-lane.mjs`
  - `.spw/surfaces/elaboration.spw`

## What Is Landed

1. **Trope 5-Stage Syntax Ladder**:
   - `trope-strip.mjs` renders `.chapter-trope-ladder` (`~ seed -> ? hint -> # named -> & turned -> ^ paid`) when opening a trope chip and exposes a playable/copyable `renderSpell` for the trope's current expression.
2. **Collectible Wonder & Inventory Spells**:
   - `almanac.mjs` and `chapter-inventory.mjs` render playable (`▶`) and copyable (`⧉`) Spw expressions on wonder cards and found items.
   - `wonderSyntaxPlan` in `pie-sound.mjs` translates unfound `?kind{ … }` probes vs. answered `@ / . / * / $ / & / #` sigils and `{}` / `[]` / `()` / `<>` containers into distinct audio realizations.
3. **Story-Road Atom Gathering**:
   - `pie-story-lane.mjs` logs `.read`, `#marked`, and `*fed` syntax atoms as road words pass, minting a playable `#saying[cN]{ ... }` spell every 5th road word on the post-carry card.

## Next Work (`f34`, `f40`, `f42`)

- Complete `f34`: project emergent motifs (such as *the Thursday nobody kept*) from `.spw/surfaces/projection.spw` + chapter JSON into HTML builds without modifying canonical variant zero.
- Slice `f40`: unify road-word `#saying[cN]{ ... }` receipts, chapter inventory keepsakes, and carry provenance into one inspectable Spw expression card without adding clutter during active play.
- Slice `f42` (Cross-Host Semantics & `factshift.center` Doors):
  - Align `lore.land`'s `( )` gathering and `[ ]` vs `< >` slot semantics with `spwashi.com`'s `word[mode]{body}(scene)<concept>` model so tropes, wonders, and sayings serialize cleanly into `#spw64=` links for tactile mutation on `factshift.center` and structural comparison on `spw.quest`.
  - Pair mathematical undercurrents (`frill_lichen`, `remainder_moths`, `sliver_tin` in `.spw/surfaces/fold-and-materials.spw`) with `wap.mom` return doors carrying a single visible `^pie[...]{...}` key across `visit` and `browser` memory planes.
- Monitor Book Two progression (`ch14`, `ch15` already released; prepare stone tooling whenever `serial.next` is scheduled).
