# Target Map

## threejs-game-director

Use for deciding the next playable slice, quality bar, and acceptance evidence.

Targets:

- `docs/superpowers/specs/`
- `src/content/nodes.ts`
- `src/core/`
- `src/world/`
- `tests/`

## threejs-gameplay-systems

Use for loop structure, system boundaries, collision-like interactions, and
feature framing around flight. For low-level input interpretation, integrator
tuning, and camera feel, start with the gamedev pack's dedicated disciplines.

Targets:

- `src/core/flight.ts`
- `src/core/intent.ts`
- `src/world/wire.ts`
- `src/world/scene.ts`
- `tests/flight.test.ts`
- `tests/intent.test.ts`
- `tests/world-wire.test.ts`

## threejs-aaa-graphics-builder

Use for rendering polish, scene readability, procedural galaxy detail, material
quality, and performance-aware visual improvements.

Targets:

- `src/world/scene.ts`
- `src/core/galaxy.ts`
- `src/brand/tokens.css`
- `tests/galaxy.test.ts`
- `tests/render.test.ts`
- `scripts/check-budgets.mjs`

## threejs-game-ui-designer

Use for HUD readability, mobile fit, mode switching, interaction labels, and
non-overlap checks.

Targets:

- `src/hud/flight-hud.ts`
- `src/hud/hud.ts`
- `src/hud/hud.css`
- `src/fallback/render.ts`
- `tests/flight-hud.test.ts`
- `tests/hud.test.ts`
- `tests/render.test.ts`

## threejs-debug-profiler

Use for canvas blank-state debugging, resize issues, pointer/mobile input,
frame pacing, and budget pressure.

Targets:

- `src/world/mount.ts`
- `src/world/scene.ts`
- `src/world/wire.ts`
- `scripts/check-budgets.mjs`
- `tests/world-mount.test.ts`
- `tests/world-wire.test.ts`
- `tests/budgets.test.ts`

## threejs-qa-release

Use for playtest criteria, visual verification evidence, release gates, and
confidence before production-impacting changes.

Targets:

- `package.json`
- `scripts/prerender.ts`
- `scripts/check-budgets.mjs`
- `tests/`
- `dist/` only as generated build output

## Asset Workflow Modules

Use `threejs-3d-generator`, `threejs-image-generator`, and
`threejs-audio-generator` only as future planning references for assets. They
are not active local tooling yet.

Targets if activated later:

- `src/assets/`
- `public/artwork/`
- budget tests and build output
- a future asset provenance folder
