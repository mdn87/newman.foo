# Target Map

## CloudAI-X Topic Mapping

### threejs-fundamentals

Use for renderer/camera/scene setup and resize issues.

Targets:

- `src/world/scene.ts`
- `src/world/mount.ts`
- `tests/world-mount.test.ts`

### threejs-interaction

Use for pointer, touch, controls, raycasting, and object selection. The current
site uses custom flight controls rather than OrbitControls, so adapt concepts
instead of copying examples.

Targets:

- `src/world/wire.ts`
- `src/core/intent.ts`
- `tests/intent.test.ts`
- `tests/world-wire.test.ts`

### threejs-shaders / materials / postprocessing

Use for point shaders, galaxy rendering, fade, alpha, and visual effects.

Targets:

- `src/world/scene.ts`
- `src/core/galaxy.ts`
- `tests/galaxy.test.ts`
- `tests/render.test.ts`

### threejs-loaders / textures

Use only if future work adds GLTF, texture, or generated asset loading.

Targets:

- `src/world/scene.ts`
- `public/artwork/`
- budget tests

## Robust Alternative Mapping

### threejs-gameplay-systems

Use for playable loop, controls, camera feel, entity/system boundaries, and
first-playable quality.

Targets:

- `src/core/flight.ts`
- `src/world/wire.ts`
- `src/world/scene.ts`
- `tests/flight.test.ts`

### threejs-game-ui-designer

Use for HUD readability, mode switching, and mobile/responsive fit.

Targets:

- `src/hud/flight-hud.ts`
- `src/hud/hud.css`
- `e2e/smoke.spec.ts`

### threejs-debug-profiler / threejs-qa-release

Use for performance, visual verification, mobile input checks, and release
evidence.

Targets:

- `scripts/check-budgets.mjs`
- `tests/budgets.test.ts`
- `playwright.config.ts`
- `e2e/smoke.spec.ts`

## Existing Broad Router

The already-added `gamedev-agent-skills` project-local pack should remain the
first stop for broad game-development routing. Use this pack when the decision
is specifically Three.js-source quality or a Three.js-specific implementation
question.
