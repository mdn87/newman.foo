# Source Intake

## Capture

- date: 2026-06-29
- primary source: `dimforge/rapier.js`
- secondary source: `pmndrs/cannon-es`
- target: `newman.foo` / `notanastronaut`
- active scope: project-local only

## Why This Source Pack Exists

The three existing packs cover feel and game-production workflow, but they do
not select a real physics engine. This pack exists to prevent "better physics"
from being treated as one problem.

For the current hand-rolled free-flight integrator, use the gamedev pack's
`physics-tuning`, `input-systems`, `camera-systems`, and `game-feel` lanes.
For real dynamics, use this pack before changing code.

## Evidence Captured

- `dimforge/rapier.js` is the official JavaScript binding repository for
  Rapier. GitHub metadata reported Apache-2.0 license, 691 stars, 90 forks, 120
  open issues, and last push `2026-06-20T08:54:34Z`.
- The Rapier tree includes TypeScript source for rigid bodies, colliders,
  geometry queries, control helpers, CCD-related code, and 2D/3D testbeds.
- `pmndrs/cannon-es` is a lightweight JavaScript 3D physics engine. GitHub
  metadata reported MIT license, 2033 stars, 152 forks, 57 open issues, and
  last push `2024-01-06T04:10:33Z`.
- The cannon-es tree includes TypeScript source for bodies, shapes,
  broadphase/narrowphase, constraints, raycasting, vehicles, and generated API
  docs.

## Local Fit

The current project has no physics-engine dependency. `src/core/flight.ts` is a
deterministic custom integrator with acceleration, drag, velocity cap, and soft
bounds. It is appropriate to tune that first unless the product needs colliders,
rigid bodies, constraints, or spatial queries.

## Non-Goals

- No package install.
- No engine choice for implementation yet.
- No changes to `src/core/flight.ts`.
- No generated assets or demos copied from upstream.
