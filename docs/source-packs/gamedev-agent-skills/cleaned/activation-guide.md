# Activation Guide

Use this pack only inside `newman.foo` / `notanastronaut`.

Read this guide when a task touches game-like behavior in the site:

- free-flight controls or input mapping
- chase camera, steering, framing, or screen motion
- thrust, inertia, damping, velocity caps, soft bounds, responsiveness,
  feedback, or polish
- flight HUD, list/world mode switching, mobile layout, or accessibility
- procedural galaxy/layout generation or shader/material behavior
- three.js scene/render loop/material/resize issues
- frame, asset, or bundle budgets

Do not treat this pack as a global skill install. Do not copy upstream skill
files into `.agents/skills/` unless a later task explicitly chooses that route.

## Local Routing

Start with the router idea, then pick the minimal local guidance. This pack is
kept because its disciplines are precise, not because it is the most popular
upstream repository.

- Scene/rendering issue: consult the `threejs-scene-setup` mapping.
- Camera issue: consult `camera-systems`.
- Controls issue: consult `input-systems`.
- Existing flight physics issue: consult `physics-tuning`, then `game-feel`.
- Feel/polish issue: consult `game-feel`, then `camera-systems` if framing is
  part of the feel.
- HUD or mode UX issue: consult `game-ui-ux`.
- Slow, heavy, or budget-sensitive issue: consult `performance-optimization`.
- Procedural galaxy/content issue: consult `procedural-gen`.
- Shader or GPU material issue: consult `shader-programming`, then official
  Three.js docs for exact API behavior.

For physics/controls tasks, route in this order:

1. `physics-tuning` for timestep, damping, caps, boundaries, and stability in
   `src/core/flight.ts`.
2. `input-systems` for keyboard, pointer, touch, and future gamepad mapping in
   `src/world/wire.ts` and `src/core/intent.ts`.
3. `camera-systems` for chase camera framing in `src/world/scene.ts`.
4. `game-feel` for feedback, thrust response, screen motion, and reversible
   polish.
5. `threejs-game-skills` only when the work needs higher-level playable-loop or
   system-framing guidance.

If "better physics" means real rigid bodies, colliders, constraints, spatial
queries, or continuous collision detection, do not stretch this pack to cover
it. Use `docs/source-packs/physics-engine-research/cleaned/activation-guide.md`
as the deliberate fourth lane.

When several apply, order the work this way:

1. Preserve deterministic core behavior in `src/core/`.
2. Adapt the three.js world layer in `src/world/`.
3. Update the HUD in `src/hud/`.
4. Verify with focused unit tests, build, and budgets.

## Local Guardrails

- Prefer pure, deterministic logic in `src/core/` before touching three.js.
- Keep three.js code in `src/world/`; do not leak renderer objects into core
  tests.
- Keep the first screen as the actual free-fly experience, not a landing page.
- Preserve bundle and world chunk budgets.
- Do not push `master`; use a feature branch because `master` deploys live.
- If future work needs full upstream skills, use this pack's manifest as the
  import bridge instead of installing globally by habit.
