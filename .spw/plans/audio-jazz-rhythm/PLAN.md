# Plan — Jazz Theory, Musical Development & Rhythm Pocket

- **Status**: `active_iteration` (`2026-11-16`, owner `audio-jazz-rhythm`, slices `f29`, `f32`, `f39`)
- **Recent Landed Receipt**: `e96b885` (`9c3fb07`, `aeaf5ca`, `0202d4d` precede it)
- **Primary Files**:
  - `book/scripts/home/pie-sound.mjs`
  - `book/scripts/home/pie-rhythm.mjs`
  - `book/scripts/modules/spw-sound.mjs`
  - `book/scripts/modules/intrinsic-rewards.mjs`
  - `book/scripts/tools/sound-check.mjs`

## What Is Landed & Verified in Plans (`npm run sound:check`)

1. **Chapter Tonic Ring & Reading Development**:
   - `chapterKey(chapter)` anchors Ch01–26 across tonal centers matching `.spw/runtime/pie-levels.spw`.
   - `chapterDevelopmentPlan` and `JAZZ_COLOURS` modulate `transitionPlan`, `playNavigationTransition`, and `playSpell` across `opening -> rising -> bridge -> turnaround` as a reader walks sections.
2. **Deeper Jazz Vocabulary & Harmonic Arcs**:
   - `chapterArcPlan` adds `guideToneOffset` (3rd-to-7th/6th voice leading), `motifForm` (`prime | answer | inversion | resolve`), and `harmonyRole`.
   - `JAZZ_STYLES` expands to 8 styles including `backdoor_cadence` and `upper_structure`; `JAZZ_LEANS` maps trope stages (`seed..paid`), collectible wonder kinds (`creature..saying`), and story-road actions (`story_word..room_cast`).
   - `jazzPhrasePlan` incorporates `tritoneSub`, `backdoor`, `tropeStage`, and `wonderKind`.
3. **16-Step Beat Pocket & Polyrhythmic Interlock**:
   - `beatPocketPlan` and `landPulse` shape `opening` heartbeats into 4-beat walking bass (`rising`/`bridge`/`turnaround` or `jazz`), ground-aware backbeats (`wood` on field, `brush` on city), swung ride subdivisions (`0, 4, 7, 8, 12, 15`), and bar-4 phrase pickup fills (`steps 14–15`).
   - `rhythmVoice`, `placeInBar`, and `conductor.groove()` contour pitches across the bar and weave found primary + visiting rhythms via `primary`, `complement` (+third, softer), and `answer` (call-and-response in rests).
   - `conductor.act()` and `conductor.pocket()` grade hit timing (`perfect` vs `good`), and `conductor.beatState()` drives a gentle visual beat-breathing cue on the lanes.

## Next Work (`f39`)

- Human ear calibration on `tools/audio_synthesis/pie-sound-audition.html` and live `/pie/` runs (phone speakers + headphones): verify density ducking under high-combo runs and calibrate swing pocket feel across Ch02, Ch06, Ch07, Ch09, Ch12, Ch15.
