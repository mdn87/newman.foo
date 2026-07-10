# Reactive Galaxy Stars + Particle Thruster — Design

Date: 2026-07-09  
Status: approved direction; pending written-spec review

## Goal

Make the stars the player can see into the stars the ship can hit. A collision
must exchange momentum according to star mass, visibly scatter the struck star,
fade it out, and restore it at its deterministic home position. Replace the
current SVG booster sprite with a pooled, tight cyan ion-particle plume emitted
only by forward player thrust and intensified by boost.

## Root Cause

The current free-flight work contains two unrelated dot systems:

- `makeSpiralGalaxy()` creates the 30,000 visible galaxy stars, rendered as one
  `THREE.Points` cloud with no colliders.
- `makeObstacleField()` creates a separate field of roughly 1,500 Rapier-backed
  obstacle dots. Only these dots can exchange momentum.

Consequently, most apparent ship/star contacts have no physical interaction.
The obstacle field also guarantees a heavy dot on the initial flight path, so
the first observable collision is intentionally biased toward bouncing the ship
instead of launching a light dot. The implementation must remove that duplicate
field and connect collision state to the rendered galaxy stars themselves.

## Locked Product Decisions

- Every visible galaxy star is eligible for collision, subject only to a small
  collider-free spawn bubble and the bounded active-body pool.
- Stars retain mass differences. Light stars scatter readily; dense/heavy stars
  can knock the ship off course.
- A struck star flies freely, fades out, then respawns at its deterministic home
  position. It does not leave a permanent hole.
- The SVG booster is replaced, not layered underneath the new effect.
- The selected exhaust look is a **tight ion plume**: compact cyan particles,
  mostly aligned behind the ship, with slight turbulence.
- Exhaust responds only to positive forward player thrust. Reverse thrust,
  barrel-roll impulses, boundary forces, collisions, and passive velocity do not
  emit engine particles. Right-click boost increases emission and exhaust speed.
- Portfolio nodes remain non-collidable.

## Chosen Approach

Use an **active collision bubble**. The complete galaxy remains a single,
efficient point cloud, while a fixed pool of nearby stars is temporarily
promoted into Rapier rigid bodies. This preserves real two-way momentum without
creating 30,000 continuously simulated bodies.

Rejected alternatives:

- One Rapier body per star is direct but too expensive in body count, broad-phase
  work, memory, and per-frame transform transfer.
- A custom analytic impulse system would be fast but would duplicate Rapier's
  collision model and make ship/star momentum behavior less trustworthy.

## Galaxy Collision Data

`makeSpiralGalaxy()` remains the single seeded source of star positions and
render attributes. `SpiralField` gains parallel typed arrays for:

- `collisionRadii`: world-space sphere radius, derived monotonically from visual
  size and clamped to approximately `1.2..3.2` units.
- `masses`: a size factor multiplied by a density factor and clamped to
  `0.1..8` relative to the ship's reference mass of `1`.

Visual darkness continues to encode density. The density factor has the wider
range, preserving the established rule that a small dark core can outweigh a
large light star. All arrays remain deterministic for a seed. Stars whose home
positions fall inside a `20`-unit spawn-clear radius stay visible but are not
collidable; they are never promoted.

## Spatial Index and Activation

A pure, testable spatial-hash module indexes immutable star home positions in
galaxy-local space. Cells are approximately `32` world units wide. Each fixed
physics step:

1. Predict the ship's next substep position from its current velocity and applied
   force, producing a current-to-predicted swept segment.
2. Convert that swept segment from world space into galaxy-local space by
   applying the inverse of the current slow galaxy Y rotation.
3. Query cells intersecting that segment expanded by the activation radius.
4. Sort candidates deterministically by distance along the swept path, then by
   star index.
5. Promote the nearest candidates into free pool slots, up to a pool cap of
   `96` active stars and an activation radius of roughly `35` units.

The swept query plus CCD on the ship prevents fast boost travel from skipping
small stars. The cap is a deliberate safety bound in the dense core. When the
pool is full, already-scattered stars are never stolen; farther dormant stars
remain visual-only until a slot becomes free.

The galaxy's slow visual rotation remains. `wire.ts` owns one accumulated galaxy
angle and passes that same value to both physics and rendering each frame. At
promotion time, a star's local home position is rotated by this angle to produce
the matching world-space Rapier position. `scene.ts` sets the galaxy group's
rotation from the supplied angle instead of independently accumulating it.

## Active-Star Lifecycle

Each pool slot has one of three states:

1. **Free** — no star assigned; collider disabled and render alpha zero.
2. **Armed** — a nearby star is assigned to a dynamic Rapier body. Its original
   point-cloud alpha is set to zero and a matching point in a small active-star
   render cloud is shown at the body's world position.
3. **Scattered** — a ship contact event has occurred. The body keeps Rapier's
   resulting velocity, remains fully visible for about `0.9s`, then fades over
   about `0.6s`.

An armed star that leaves the activation bubble without being struck is released
immediately and its original point alpha is restored. A scattered star is
released only after its fade completes. Release restores the original seeded
alpha at the star's home index; because the base galaxy continues rotating, the
respawn automatically appears at the correct current rotated home position.

Rapier collision events, rather than displacement heuristics, transition an
armed slot to scattered. Collider handles map directly to pool slots. Dynamic
colliders use density `0`; body mass comes exclusively from
`setAdditionalMass(starMass)`. Suggested feel defaults are restitution around
`0.7` and low linear damping around `0.25`, so light stars travel far enough to
read while heavy stars still resist the ship. The ship remains mass `1`, uses a
ball collider, and enables CCD.

## Rendering Data Flow

The base galaxy keeps its existing `THREE.Points` geometry and shader. Its alpha
attribute becomes mutable, backed by a preserved copy of the seeded base alphas.
Promotion and release update only affected alpha ranges.

A second `THREE.Points` object contains exactly `96` active-star slots. Physics
streams only those slot positions, alphas, sizes, and colors each frame. This
keeps the common update bounded and avoids rewriting all 30,000 positions.

The current separate obstacle cloud and its data flow are removed:

- remove `makeObstacleField()` from world wiring;
- remove `scene.setObstacles()` and `dart.obstaclePositions()`;
- replace the standalone obstacle-body manager with the pooled star-collision
  manager.

The existing grid and decorative depth squares remain visual-only.

## Particle Thruster

The particle effect is split into a pure fixed-pool simulator and a small Three.js
adapter so lifecycle behavior can be unit-tested without WebGL.

- Pool size: approximately `128` particles, allocated once.
- Spawn point: behind the ship's tail along negative heading, with small radial
  jitter.
- Motion: inherit the ship velocity, add exhaust velocity opposite the heading,
  and add slight seeded lateral turbulence.
- Normal thrust: compact emission around `35` particles/second.
- Boost: approximately `75` particles/second, faster exhaust, slightly larger and
  brighter initial particles.
- Lifetime: randomized deterministically within roughly `0.35..0.65s`; particles
  shrink and fade continuously.
- Color: the existing brand cyan range with occasional darker navy motes.

`FlightState` gains an `enginePower` value in `0..1`, computed as zero unless
forward intent is positive, otherwise `throttle * (boost ? 1 : 0.6)`. It is
exactly zero for reverse, roll, collision, boundary, or coasting motion.
`WorldScene.frame()` passes the ship pose, velocity, and engine power to the
thruster component. The old `galaxy-thruster.svg` texture loading, sprite, and
layout constants are removed.

Emission uses an accumulator (`rate * dt`) so behavior is frame-rate independent.
When the pool is exhausted, the oldest live particle is recycled; the renderer
never allocates particles during a frame.

## Module Boundaries

- `src/core/galaxy.ts`: seeded visual arrays plus collision radii and masses.
- `src/core/star-index.ts`: pure spatial hash and deterministic swept queries.
- `src/core/thruster-particles.ts`: pure fixed-pool emission and particle
  integration.
- `src/physics/star-collisions.ts`: Rapier body pool, activation lifecycle,
  collision-event handling, and active render snapshots.
- `src/physics/dart.ts`: shared world, ship CCD/collider, fixed-step ordering,
  and collision-manager integration.
- `src/world/thruster.ts`: Three.js point-cloud adapter for the pure particle
  pool.
- `src/world/scene.ts`: owns base/active star rendering and delegates exhaust
  rendering.
- `src/world/wire.ts`: passes the single galaxy field to scene and physics and
  owns the shared galaxy rotation angle.

Rapier imports remain confined to `src/physics/`.

## Fixed-Step Ordering

For each physics substep:

1. Update facing and player forces.
2. Query and arm nearby stars from the ship's current-to-predicted swept path.
3. Step the shared Rapier world with its collision event queue.
4. Drain ship/star contact events and mark affected slots scattered.
5. Advance star lifetimes and release completed or unneeded slots.
6. Apply the existing ship speed cap after collision resolution.

Rendering reads an immutable-style snapshot after all substeps for the frame.
No renderer mutates physics state.

## Testing

### Pure unit tests

- `galaxy.test.ts`: collision arrays are parallel, finite, deterministic, and
  within radius/mass bounds; darkness and mass density remain monotonic.
- `star-index.test.ts`: spatial queries return only intersecting candidates,
  include swept-path stars, exclude the spawn bubble, and use deterministic
  distance/index ordering.
- `thruster-particles.test.ts`: no emission for idle, reverse, or coasting;
  normal forward thrust emits; boost emits more/faster particles; lifetimes free
  slots; repeated runs are deterministic; the pool never exceeds its cap.

### Physics integration tests

- A mass-`1` ship hitting a light star sends the star away while only modestly
  perturbing the ship.
- A heavy star perturbs the ship more and receives less velocity than the light
  star under the same approach.
- Contact transitions exactly one armed slot to scattered; fade completion
  releases it and restores its base-star visibility.
- A boosted swept path activates a small star instead of tunneling through it.

### Browser tests

- World mode still boots and renders a nonblank galaxy.
- Holding forward produces live thruster particles; releasing forward drains the
  pool to zero; boost raises the live/emitted count.
- A deterministic initial flight path records at least one star contact and the
  active star enters its scatter/fade lifecycle.

Stable read-only counters on the canvas dataset (`activeStars`, `starHits`, and
`thrusterParticles`) provide browser-test observability without pixel sampling or
exposing mutable internals.

## Performance and Failure Bounds

- 30,000 base stars remain one draw call; active stars and exhaust add one draw
  call each.
- Rapier star bodies are capped at `96`; particle slots are capped at `128`.
- Spatial lookup is local-cell work, not a 30,000-star scan every physics step.
- Typed arrays and scratch vectors are reused; no per-frame particle or star
  object allocation is allowed in the steady-state loop.
- Dense regions degrade by temporarily leaving farther stars visual-only rather
  than increasing body count or stealing live scattered slots.

## Acceptance Criteria

- Visible galaxy stars, not a separate obstacle cloud, are the collision targets.
- A light-star hit visibly launches the star; a heavy-star hit can visibly deflect
  the ship; both use Rapier momentum exchange.
- Struck stars fly, fade, and restore at their deterministic home positions.
- Boost-speed travel does not tunnel through promoted stars.
- The SVG booster is gone and a tight cyan ion plume appears only under positive
  forward thrust, with a clearly stronger boost state.
- `npm run typecheck`, `npm test`, `npm run build`, `npm run budgets`, and
  `npm run e2e` pass.
- The existing world bundle budget remains satisfied and no new dependency is
  introduced.
- Portfolio nodes, gridlines, and depth squares remain non-collidable.

## Out of Scope

- Persistent destruction or saving displaced stars across sessions.
- Star/star collisions or chain reactions between scattered stars.
- Collidable portfolio nodes, gridlines, or depth squares.
- General-purpose particle authoring tools or multiple exhaust presets.
