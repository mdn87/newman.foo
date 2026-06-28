# Activation Guide

Use this pack only inside `newman.foo` / `notanastronaut`.

Read this guide when a task touches game-like behavior in the site:

- free-flight controls or input mapping
- chase camera, steering, framing, or screen motion
- thrust, inertia, responsiveness, feedback, or polish
- flight HUD, list/world mode switching, mobile layout, or accessibility
- three.js scene/render loop/material/resize issues
- frame, asset, or bundle budgets

Do not treat this pack as a global skill install. Do not copy upstream skill
files into `.agents/skills/` unless a later task explicitly chooses that route.

## Local Routing

Start with the router idea, then pick the minimal local guidance:

- Scene/rendering issue: consult the `threejs-scene-setup` mapping.
- Camera issue: consult `camera-systems`.
- Controls issue: consult `input-systems`.
- Feel/polish issue: consult `game-feel`.
- HUD or mode UX issue: consult `game-ui-ux`.
- Slow, heavy, or budget-sensitive issue: consult `performance-optimization`.

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
