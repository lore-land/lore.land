# Fixtures Style Guide

These styles are written as readable scaffolding for story authors.

## Layering Order

1. `fonts.css` - typeface loading only
2. `baseline.css` - shared tokens + page defaults
3. Scene stylesheet (`home.css`, `root.css`, etc.) - page/chapter specific composition

Keep this order in HTML so story-specific rules override defaults without hacks.

## Design Intent

The baseline is "software as literature":
- serif-forward body text for long-form reading
- monospace headings and controls for technical clarity
- shared spacing, color, and panel primitives for predictable composition
- dimensional theming via `data-theme` + `data-dimension` for component swapping

## Load Lifecycle (Boon/Bane/Bone/Bonk/Honk)

The runtime now exposes a five-stage loading grammar through `data-load-stage`:
- `boon` - preloaders are active
- `bane` - spinner + fallback path for slow/failed transitions
- `bone` - skeletons are guaranteed visible
- `bonk` - acoustics/spacing checks run on rendered content
- `honk` - resolution and harmony (final settled view)

Implementation lives in `book/scripts/modules/load-lifecycle.mjs`.

## Progressive Experience Hooks

- `book/scripts/modules/experience-core.mjs`: ARIA live status, preference persistence, progressive reveal, lazy-image enhancement, and service worker registration.
- `book/scripts/modules/chapter-progression.mjs`: deterministic chapter rewards and unique chapter mode states (no streak loops / no addictive mechanics).
- `book/scripts/home/seeds.mjs`: Midjourney seed manifest and chapter visual mapping.

## Cache Context Model

Use `book/scripts/modules/cache-context.mjs` to build stylesheet URLs with expressive invalidation keys.

It emits query params:
- `v` release (for example `2026_02_28.H`)
- `ctx` context channel (for example `chapter:mood-tldr`)
- optional `b` ad-hoc bust key

Runtime overrides:
- `data-cache-release` / `data-cache-context` on `<html>`
- URL params: `cache_release`, `cache_context`, `cache_bust`

## Extending Story Experiences

When adding a new experience:
1. Create a new page stylesheet in `book/styles/fixtures/` or a dedicated folder.
2. Reuse baseline tokens instead of new hard-coded values.
3. Assign a clear cache context channel (for example `archive:layout`, `kernel:mood-dream`).
4. Keep interactions/effects in scripts; keep CSS declarative and readable.

This keeps the code teachable for readers while leaving room for Spw-kernel routing/effects.
