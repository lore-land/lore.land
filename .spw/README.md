# Lore.Land `.spw/` Canon & Surfaces

Grounded workspace entrypoint for readers, authors, tools, and `spw-workbench` integration.

## Key Navigation Entrypoints
- **Master Mount**: `index.spw` — top-level directory of all surfaces, plans, runtime files, and generated chapter mirrors.
- **System Joinery**: `surfaces/joinery.spw` — nodes, labeled edges (`=kept@find{ @deed }`), crossroads, and open seams.
- **26 Chapter Ecologies**: `ecologies/index.spw` — per-chapter physiology (`01/ecology.spw`..`26/ecology.spw`) separated cleanly from generated build mirrors in `chapters/`.
- **Book Two & Three Trajectory**: `surfaces/wonder-about-pie.spw`, `surfaces/book-three.spw`, and root `PLAN.F.spw`.
- **Musical Design & Acoustics**: `surfaces/sound-and-voice.spw` (`^tonal_ring`), `runtime/pie-levels.spw`, `runtime/audio-tropes.spw`, `surfaces/cadences.spw`, `surfaces/scored.spw`.
- **Literature & Poetics**: `surfaces/poetics.spw`, `surfaces/tellings-and-bindings.spw`, `story-boonhonk.spw`.
- **Workbench Plugin Architecture**: `surfaces/plugin-protocol.spw`, `mount.spw`, `workspace.spw`.

## Read-Only Inspection Commands
Run from repo root (`npm run spw` enforces read-only access to the submodule CLI):

```sh
npm run spw -- doctor --spw
npm run spw -- resolve --from .spw/ecologies/index.spw --warn
npm run spw -- resolve --from .spw/surfaces/joinery.spw --warn
npm run spw -- form --from .spw --match
npm run spw -- outline --from .spw/surfaces/poetics.spw
npm run spw:lint -- --strict
npm run spw:plans -- --strict
npm run check
```
