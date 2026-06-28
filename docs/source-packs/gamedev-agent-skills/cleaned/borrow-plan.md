# Borrow Plan

## Borrow Unit 1: Project-Local Routing

- source skills: `router`
- target: this pack's activation guide
- change class: documentation
- blast radius: docs only
- recommendation: Use the upstream router concept locally. Detect three.js from
  `package.json`, then choose the smallest relevant local section.

## Borrow Unit 2: Three.js Scene Discipline

- source skills: `threejs-scene-setup`
- target: `src/world/scene.ts`, `src/world/mount.ts`
- change class: future implementation guidance
- blast radius: world rendering only
- recommendation: Keep scene/camera/renderer/loop/resize fixes in the world
  adapter. Verify with render/world tests and browser screenshots when visual.

## Borrow Unit 3: Camera And Feel

- source skills: `camera-systems`, `game-feel`
- target: `src/core/flight.ts`, `src/world/scene.ts`
- change class: future implementation guidance
- blast radius: flight and visual response
- recommendation: Preserve frame-rate-independent simulation. Add feel through
  tuned feedback and camera offsets rather than mutating core state for visuals.

## Borrow Unit 4: Input And HUD

- source skills: `input-systems`, `game-ui-ux`
- target: `src/world/wire.ts`, `src/hud/flight-hud.ts`, `src/hud/hud.css`
- change class: future implementation guidance
- blast radius: controls and visible UI
- recommendation: Keep controls explicit, accessible, and testable. Treat HUD
  text and controls as compact operational UI, not a marketing layer.

## Borrow Unit 5: Performance Discipline

- source skills: `performance-optimization`
- target: `scripts/check-budgets.mjs`, `tests/budgets.test.ts`, `src/world/`
- change class: future implementation guidance
- blast radius: build and runtime budgets
- recommendation: Profile or budget-check before increasing particle counts,
  shader complexity, media assets, or world imports.

## Staged Recommendation

Proceed with this project-local pack as the active guidance surface for
`newman.foo`. Defer global skill installation and Lugos/Bran import until the
pack proves useful in one or two project tasks.
