# Free-Fly Galaxy Explorer — Design

Date: 2026-06-27
Status: approved (design); pending spec review

## Goal

Replace the node-snap "rail flythrough" world with a **free-flight galaxy
explorer**: the user pilots the astronaut avatar freely through 3D space with a
jet-booster + inertia feel, around a spiral galaxy that reads like a real
top-down spiral. Restore strong depth via a 3D dot grid and scattered
variable-size depth squares.

The mission/portfolio "node" concept is **hidden from the 3D world but kept in
the codebase, dormant**. Content, routing, and the `[list]` / ground-control
view stay fully intact and working (portfolio + reduced-motion fallback). No
deletion of `content/nodes.ts`, `router.ts`, `hud`, or `travel.ts`.

## Non-negotiable visual constraints

- **Background stays white** (`#ffffff`), matching the site's line-art brand.
  NOT black. The reference galaxy image is the *shape/density* spec, tonally
  inverted: dark stardust on white rather than bright stars on black.
- Spiral galaxy reads correctly **from a top-down view** (like the reference):
  dense core, sweeping arms, fade to the edges.
- Cyan-family palette (`#4ab3d4` and deeper navy toward the core); keep the
  existing warm accent only for the thruster flame.

## Components

### 1. Flight model — `src/core/flight.ts` (pure, testable)

The deterministic core (the role `travel.ts` played for node-snap). No three.js,
no wall clock — time enters only through `tick(dt)`. Holds:

- `position: Vec3`, `velocity: Vec3`, `heading: Vec3` (unit forward), and a
  scalar `bank` for visual roll.

Per `tick(dt, input)` where `input = { aimX, aimY, thrust }` (aim in [-1,1] from
pointer offset to screen-center; thrust in [0,1]):

- **Steering**: `aimX`/`aimY` set a desired yaw/pitch *rate*; `heading` eases
  toward the aimed direction (rate-limited turn), and `bank` eases toward a roll
  proportional to yaw rate so the avatar leans into turns.
- **Thrust**: acceleration along `heading`, ramped by the existing booster curve
  so it ignites slowly and builds (`jetSpeed`-style). `velocity += accel*dt`.
- **Inertia / glide**: when `thrust` is released, velocity persists with a very
  light damping coefficient so you **coast to a near-stop** ("glide into place
  because you're in space"). Damping is small enough that drift is long but
  bounded.
- **Speed cap**: clamp `|velocity|` to a max so flight stays controllable.
- **Soft bounds**: beyond radius `R_BOUND` from origin, apply a gentle restoring
  acceleration toward the center (no hard wall) so the player can't get lost in
  empty space.

Deterministic and framerate-independent; unit-tested (ignition is slow, release
glides to rest, bounds pull back, speed clamps, heading normalizes).

Reuses: `src/core/ease.ts` (`jetEase`/`jetSpeed`) for the thrust ramp,
`src/core/rng.ts` for any seeded scatter.

### 2. Input wiring — `src/world/wire.ts` (rewritten for free-fly)

Replaces wheel→advance/back node controls:

- `pointermove` → `aimX/aimY` from offset to viewport center.
- Hold **W** or **Space** (or hold primary mouse button) → `thrust` ramps to 1;
  release → ramps to 0.
- Optional: Shift = brake (extra damping). Esc/`L` still reaches the list view.
- Each animation frame: read input → `flight.tick(dt, input)` → `scene.frame(dt,
  flightState)`.
- Node-snap handlers (wheel advance/back, swipe, click-to-jump, popstate→jump)
  are removed from the world path. `travel.ts`/`TravelMachine` left in the tree,
  unused.

### 3. Camera & avatar — `src/world/scene.ts`

- **Third-person follow-cam**: target = `avatar.position`; camera trails behind
  and slightly above along `-heading`, position + look lerped each frame so it
  banks and eases through turns (no rigid snapping).
- The astronaut billboard **is** the avatar, positioned at `flight.position`,
  rolled by `bank`, oriented to face roughly camera-ward (billboard) while
  reading as "piloting forward."
- **Thruster flame** (existing `galaxy-thruster.svg`) fires while `thrust > 0`,
  scaled/faded by thrust — same component already built, now driven by live
  thrust instead of transit `t`.

### 4. Spiral galaxy — `THREE.Points` particle field

White background; the galaxy is **dark stardust**.

- Generation (pure, seeded) produces ~15–30k point positions on a **flattened
  logarithmic-spiral disk**: assign each point to one of N arms (2–4), radius `r`
  with a core-weighted distribution, angle `= armBase + b*ln(r) + jitter`, and a
  thin gaussian `z` (disk thickness). A central **bulge** cluster gives the dense
  core. Per-point size and opacity scale by radius (bigger/denser core, fading
  arms).
- Rendering: `THREE.Points` with a small soft round sprite texture,
  **NormalBlending** (additive would vanish on white), color from brand cyan
  `#4ab3d4` deepening to navy near the core. Density of overlapping faint dark
  points creates the tonal gradient — core reads deep, arms read as cyan dust,
  gaps stay white.
- The disk **rotates ever so slowly** about its axis for life.
- You fly through/above/below it; no collision (it's stars).

Alternative considered: keep sprite-doodle field — rejected, cannot reach the
density/look of the reference.

`src/core/galaxy.ts` is repurposed to `makeSpiralGalaxy(seed, opts)` returning
typed arrays (positions, sizes, alphas, colors) for a BufferGeometry. The old
doodle `makeGalaxy` and its abstract-sprite art are retired from the world (art
files left on disk).

### 5. Depth — two layers

- **3D dot grid** — pure generator builds a regular x/y/z lattice of points at
  spacing `S` over the flyable volume (kept to a sane count, e.g. ~20³). Rendered
  as faint cyan `THREE.Points`, **dimming with distance** from the avatar so near
  dots are crisp and far ones fade — a holodeck-style spatial reference that
  makes motion read as real 3D travel.
- **Depth squares** — restore the scattered, randomly-sized square sprites at
  varied depths for strong parallax (the depth that was lost). Distinct from the
  regular grid: organic, irregular, faint cyan/gray outlined squares. This
  repurposes the existing unused `src/core/parallax.ts` (`makeBodies` already
  scatters variable-size bodies through the volume).

### 6. Surface selection / fallback — unchanged

`main.ts`/`router.ts` still choose the `world` surface for pointer + WebGL and
fall back to `list` for reduced-motion. Free-fly is pointer-first; touch and
reduced-motion users keep the existing `[list]` view. (Touch steering can be
added later; out of scope now.)

## File-level plan

| File | Change |
|---|---|
| `src/core/flight.ts` | **new** — pure free-fly physics integrator + tests |
| `src/core/galaxy.ts` | repurpose → `makeSpiralGalaxy` (particle field arrays) |
| `src/core/grid.ts` | **new** — pure 3D dot-lattice generator + tests |
| `src/core/parallax.ts` | reuse `makeBodies` for the depth-squares layer |
| `src/world/scene.ts` | rewrite world: white bg, particle galaxy, grid, squares, avatar follow-cam, thruster |
| `src/world/wire.ts` | rewrite: pointer/keyboard free-fly input → `flight.tick` |
| `src/core/ease.ts` | reuse `jetSpeed` for thrust ramp |
| `travel.ts`, `path.ts`, `overview.ts`, `intent.ts` | left dormant (no world use) |
| `content/nodes.ts`, `router.ts`, `hud`, fallback `render.ts` | untouched (portfolio + list) |

## Determinism & testing

- `flight.ts`: deterministic given `(dt, input)` sequence — tests for slow
  ignition, inertial glide to rest, speed clamp, soft-bound restoring force,
  heading stays unit-length.
- `galaxy.ts` / `grid.ts`: deterministic for a seed; tests for counts, finite
  outputs, spiral structure (arc/arm winding), grid spacing/extent.
- Existing suites for `travel`, `router`, `content`, `hud`, budgets, e2e stay
  green (those subsystems are untouched). `world-wire.test.ts` is rewritten for
  the new input wiring.
- Budgets: the particle field adds one small point texture + buffer data;
  geometry is GPU-side. Keep within the existing world-chunk budget.

## Defaults the user can tune later

- Grid density/spacing and fade distance (default: faint, evenly spaced, fades
  with distance).
- Galaxy point count, arm count, core deepness, rotation speed.
- Damping/turn-rate/speed-cap feel constants in `flight.ts`.

## Out of scope (for now)

- Touch/mobile free-fly controls (mobile keeps the list view).
- Re-introducing missions as fly-to destinations in the galaxy (possible later;
  the dormant node code makes it easy).
