# Target Map

## Existing Integrator Boundary

Use the existing integrator path for feel-only work.

Targets:

- `src/core/flight.ts`
- `tests/flight.test.ts`
- `docs/source-packs/gamedev-agent-skills/cleaned/target-map.md`

## Future Physics Adapter

If real dynamics are selected later, add an adapter boundary instead of letting
engine objects spread through the app.

Likely targets:

- `src/core/` or a future `src/physics/`
- `src/world/scene.ts` for visual synchronization only
- `tests/` for deterministic adapter behavior
- `scripts/check-budgets.mjs`
- `tests/budgets.test.ts`

## Rapier Candidate

Use for:

- rigid bodies and colliders
- spatial queries and raycasts
- continuous collision detection
- richer 3D simulation
- future character/controller experiments

## cannon-es Candidate

Use for:

- pure JavaScript/TypeScript physics
- simple rigid bodies and shapes
- constraints, rays, broadphase/narrowphase, and vehicles
- lower setup complexity when newer maintenance is less important
