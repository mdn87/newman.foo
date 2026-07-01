# Physics And Controls Routing Adjustment - Design

Date: 2026-06-29
Status: approved via review feedback

## Goal

Correct the source-pack hierarchy so `newman.foo` routes physics and controls
work to the sharpest guidance first.

The previous structure correctly identified `threejs-game-skills` as the
stronger broad game-production source, but it over-applied that ranking to
low-level physics/control work. For this repo, `gamedev-agent-skills` has the
more precise decomposition: `physics-tuning`, `input-systems`,
`camera-systems`, and `game-feel`.

## Changes

- Add `physics-tuning`, `procedural-gen`, and `shader-programming` to the
  gamedev pack selection.
- Record complete gamedev metadata and excluded disciplines so future Lugos
  import reviews are symmetric with the other packs.
- Route physics/controls tasks through the gamedev pack first.
- Keep `threejs-game-skills` as the higher-level playable-loop and
  game-production framing pack.
- Add a fourth docs-only source-pack candidate for physics engines so rigid
  bodies, collision, spatial queries, constraints, and CCD do not get smuggled
  into a feel-tuning lane.
- Rewrite PR #2 body so reviewers see all packs, not just the first commit.

## Better Physics Split

`better physics` now means one of two things:

- Better-feeling flight: tune the current deterministic integrator in
  `src/core/flight.ts` with gamedev `physics-tuning`, `input-systems`,
  `camera-systems`, and `game-feel`.
- Real dynamics/collision: use the physics-engine research lane and decide
  between Rapier, cannon-es, or another engine before implementation.

## Verification

This is documentation-only. Verification is manifest JSON parsing, raw-snippet
guard, markdown diff hygiene, and the standard project checks: typecheck, tests,
build, and budgets.
