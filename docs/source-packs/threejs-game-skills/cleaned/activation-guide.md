# Activation Guide

Use this pack only inside `newman.foo` / `notanastronaut`.

Read it when a task is about making the Three.js site feel more like a polished
browser game, not just when it needs an API lookup.

## Use When

- planning a playable slice or game-like feature
- changing flight controls, camera behavior, or player feedback
- improving rendering polish, visual hierarchy, scene clarity, or motion feel
- changing HUD layout, responsive fit, mode switching, or mobile input
- debugging frame pacing, blank canvas, resize behavior, or interaction issues
- preparing playtest, visual verification, release, or budget evidence
- considering future 3D, image, or audio asset workflows

## Local Routing

Start with the smallest relevant module:

- feature scope, phase planning, quality bar: `threejs-game-director`
- loop, controls, collision, camera rig, playable systems: `threejs-gameplay-systems`
- visual polish, procedural detail, lighting/material quality: `threejs-aaa-graphics-builder`
- HUD, overlays, responsive controls, mobile readability: `threejs-game-ui-designer`
- performance, mobile input, scene debugging, canvas checks: `threejs-debug-profiler`
- playtest evidence, release readiness, visual verification: `threejs-qa-release`
- future asset workflows only: `threejs-3d-generator`, `threejs-image-generator`,
  `threejs-audio-generator`

For exact Three.js API behavior, verify against https://threejs.org/docs/.
For broad game-development routing, start with
`docs/source-packs/gamedev-agent-skills/cleaned/activation-guide.md`.
For narrow API-topic comparison, use
`docs/source-packs/threejs-skills-research/cleaned/activation-guide.md`.

## Local Guardrails

- Preserve deterministic behavior in `src/core/` before touching Three.js.
- Keep renderer objects and browser APIs in `src/world/` or UI modules, not in
  core logic.
- Keep HUD work in `src/hud/` and verify text fit/responsiveness when layout
  changes.
- Prefer adapting concepts to this repo over copying upstream scaffold files.
- Do not run upstream scripts, generators, or credential helpers from this pack.
- Do not install upstream skills globally unless a later task explicitly
  changes the scope.
- Keep `master` untouched; this guidance belongs on feature branches first.

## Verification Bias

For code changes inspired by this pack, prefer:

1. focused unit tests for deterministic behavior in `tests/`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. `npm run budgets`
6. browser visual checks when canvas behavior, responsive UI, or playability is
   part of the change
