# Target Map

## Engine Detection

Detected engine for this repo: three.js.

Evidence:

- `package.json` depends on `three`.
- Runtime world code lives in `src/world/`.
- Deterministic simulation code lives in `src/core/`.
- The current product is a Vite + TypeScript free-fly galaxy portfolio.

## Skill-To-Repo Mapping

### router

Use to decide which local pack section applies. It should not bulk-load every
gamedev topic into every task.

Targets:

- `package.json`
- `src/core/`
- `src/world/`
- `src/hud/`
- `tests/`

### threejs-scene-setup

Use for renderer, scene, camera, animation loop, resize behavior, and blank or
misframed canvas debugging.

Targets:

- `src/world/scene.ts`
- `src/world/mount.ts`
- `src/world/wire.ts`
- `tests/world-mount.test.ts`
- `tests/world-wire.test.ts`

### camera-systems

Use for chase camera smoothing, lag, framing, avatar tracking, jitter, and
camera-follow ordering.

Targets:

- `src/world/scene.ts`
- `src/core/flight.ts` when camera behavior reveals simulation-state needs
- `tests/flight.test.ts`

### game-feel

Use for thrust ramp, inertia, feedback tiers, movement response, and transient
visual polish. Keep feedback short and reversible.

Targets:

- `src/core/flight.ts`
- `src/world/scene.ts`
- `src/hud/flight-hud.ts`
- `tests/flight.test.ts`

### input-systems

Use for keyboard, pointer, right-click boost, mobile pointer behavior, future
gamepad mapping, and input accessibility.

Targets:

- `src/world/wire.ts`
- `src/core/intent.ts`
- `tests/intent.test.ts`
- `tests/world-wire.test.ts`

### game-ui-ux

Use for HUD layout, world/list mode affordances, status text, responsive
constraints, and avoiding overlap.

Targets:

- `src/hud/flight-hud.ts`
- `src/hud/hud.css`
- `src/fallback/render.ts`
- `e2e/smoke.spec.ts`

### performance-optimization

Use for frame budget, point counts, shader/material complexity, asset size,
bundle size, and testable budgets.

Targets:

- `src/world/scene.ts`
- `src/core/galaxy.ts`
- `public/artwork/`
- `scripts/check-budgets.mjs`
- `tests/budgets.test.ts`
- `e2e/smoke.spec.ts`
