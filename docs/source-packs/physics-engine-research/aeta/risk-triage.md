# Risk Triage

## Metadata

- date: 2026-06-29
- sources: `dimforge/rapier.js`, `pmndrs/cannon-es`
- target: `newman.foo`
- confidence: medium
- evidence: GitHub metadata, official docs, repository trees
- change class: docs-only research lane
- blast radius: local documentation
- recommended depth: L0 now; L1 before dependency install or implementation

## Pre-Flight Assessment

- trust rating: medium-high for research
- complexity rating: high for implementation
- flags: new runtime dependency, bundle budget risk, WASM/init complexity for
  Rapier, API/maintenance tradeoffs, simulation architecture decisions

## Risk Review

- security risk: low now; medium if new packages are installed later
- bundle/runtime risk: none now; potentially high if a physics engine enters
  the world chunk without budget work
- architectural risk: high if engine objects leak into deterministic core tests
- product risk: medium if real dynamics replace a flight feel problem that could
  be solved by tuning the existing integrator
- overall posture: keep docs-only and require a deliberate decision before code

## Depth Decision

- current depth: L0
- escalate to L1 before:
  - installing `@dimforge/rapier3d`, `@dimforge/rapier3d-compat`,
    `cannon-es`, or related packages
  - changing `src/core/flight.ts` to depend on engine objects
  - adding colliders, rigid bodies, constraints, or worker/WASM init
  - accepting bundle growth or changing budget thresholds

## Notes

Start with `physics-tuning` when the task is about feel. Use this pack only when
the requirement truly needs simulation features that the current integrator
does not provide.
