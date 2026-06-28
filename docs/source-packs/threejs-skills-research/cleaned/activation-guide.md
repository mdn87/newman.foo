# Activation Guide

Use this pack only inside `newman.foo` / `notanastronaut`.

Read it when a task is specifically about Three.js source guidance or choosing
between Three.js skill packs.

## Local Routing

Use CloudAI-X-style topic guidance when the task is primarily API-level:

- scene setup, camera, renderer, transforms: `threejs-fundamentals`
- raycasting, pointer/touch, controls: `threejs-interaction`
- custom geometry or instancing: `threejs-geometry`
- material and light details: `threejs-materials`, `threejs-lighting`
- textures or GLTF: `threejs-textures`, `threejs-loaders`
- shader and effect work: `threejs-shaders`, `threejs-postprocessing`
- object animation: `threejs-animation`

Use the robust alternative framing when the task is product/game-level:

- playable loop, controls, camera feel: `threejs-gameplay-systems`
- polish, visual hierarchy, rendering quality: `threejs-aaa-graphics-builder`
- HUD and responsive UI: `threejs-game-ui-designer`
- profiling and mobile checks: `threejs-debug-profiler`
- release/playtest evidence: `threejs-qa-release`

For those product/game-level tasks, prefer the dedicated local pack at
`docs/source-packs/threejs-game-skills/cleaned/activation-guide.md`.

## Guardrails

- Do not install either upstream pack globally.
- Do not copy raw upstream `SKILL.md` files into this repo without a new task.
- Do not run upstream helper scripts or scaffolds without deeper review.
- Verify API details against official Three.js docs when the exact signature or
  current behavior matters.
- Keep project changes inside existing repo boundaries: pure logic in
  `src/core/`, renderer/adapters in `src/world/`, HUD in `src/hud/`, tests in
  `tests/`/`e2e/`.
