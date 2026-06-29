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

## Borrow Unit 3: Physics, Camera, And Feel

- source skills: `physics-tuning`, `camera-systems`, `game-feel`
- target: `src/core/flight.ts`, `src/world/scene.ts`
- change class: future implementation guidance
- blast radius: flight and visual response
- recommendation: Use this pack first for better-feeling flight. Preserve
  frame-rate-independent simulation, tune integrator constants deliberately,
  keep camera feel in `src/world/scene.ts`, and add visual feedback without
  mutating core state for presentation only.

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

## Borrow Unit 6: Procedural And Shader Discipline

- source skills: `procedural-gen`, `shader-programming`
- target: `src/core/galaxy.ts`, `src/world/scene.ts`, render/budget tests
- change class: future implementation guidance
- blast radius: world visuals, GPU cost, and deterministic generated content
- recommendation: Keep generated content deterministic and testable. Verify
  shader/material changes with render tests, build, and budgets.

## Staged Recommendation

Proceed with this project-local pack as the active guidance surface for
physics/controls feel in `newman.foo`. Use `threejs-game-skills` for
higher-level playable-loop framing, not as the first stop for low-level
integrator/input/camera tuning. Defer global skill installation and Lugos/Bran
import until the pack proves useful in one or two project tasks.
