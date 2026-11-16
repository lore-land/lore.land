# Plan — Platform Baseline, Accessibility Mirroring & Prose Releases

- **Status**: `active_iteration` (`2026-11-16`, owner `platform-and-prose`, slices `f15`–`f18`, `f35`, `f36`)
- **Primary Files**:
  - `.spw/surfaces/platform.spw`
  - `book/templates/chapter.html`
  - `book/styles/chapter/`
  - `pie/index.html`

## Current Posture

- **Baseline Architecture (`f35`, landed `2026_11_16.A`)**: `content-visibility: auto` past section 1, cross-document `@view-transition` + `link[rel=expect]`, `font-size-adjust: from-font`, `oklch` RCS + `contrast-color()`, `beforematch` room sync, and deferred non-critical module loading.
- **Origin Trial Policy**: Keep Experimental Origin Trials (`canvas-html`, `webmcp`) disabled by default. Deliver accessibility and machine readability via standard ARIA live/semantic DOM mirroring (`f36`) and `/.spw/**` + JSON-LD.
- **Book Two & Tooling Discipline**: `npm run spw:plans` tracks commit reach vs. tooling work. Recent releases (`cebb1de`, `e96b885`) focused heavily on reader-facing game/music/story integration (`26/30` recent commits reached readers); next creative attention can flow back into Book Two chapter writing (`ch16+`) and typed tooling gates (`f16`–`f18`).
