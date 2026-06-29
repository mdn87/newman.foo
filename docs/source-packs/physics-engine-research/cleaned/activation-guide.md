# Activation Guide

Use this pack only inside `newman.foo` / `notanastronaut`.

Read it when "better physics" means real simulation instead of better-feeling
flight.

## Route First

- Better thrust, inertia, damping, speed caps, soft bounds, or camera response:
  use `docs/source-packs/gamedev-agent-skills/cleaned/activation-guide.md`.
- Real rigid bodies, colliders, constraints, spatial queries, raycasts,
  continuous collision detection, or engine-backed contacts: use this pack.
- Higher-level loop and game-production framing: use
  `docs/source-packs/threejs-game-skills/cleaned/activation-guide.md`.

## Candidate Bias

Start research with Rapier when the task needs a modern 3D physics engine,
colliders, queries, CCD, or a path toward richer simulation. Consider cannon-es
when pure JavaScript, simpler installation, and lower conceptual overhead matter
more than newer maintenance signals.

No engine is active locally yet.

## Guardrails

- Do not install a physics package without a task-specific architecture note.
- Keep physics-engine objects behind an adapter; do not leak them directly into
  existing deterministic core tests.
- Preserve `src/core/flight.ts` as the feel-tuning surface unless the task
  explicitly requires engine-backed simulation.
- Check bundle and world chunk budgets before and after any future dependency
  install.
- Verify exact engine APIs against primary docs before implementation.
