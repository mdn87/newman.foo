# newman.foo Spiral Galaxy Game Prototype Design

**Date:** 2026-06-25
**Status:** Draft for review
**Repo:** `mdn87/newman.foo`

## Purpose

Turn `newman.foo` from a copied Not An Astronaut portfolio shell into a tiny
free-floating game prototype. The site should open directly into a spiral
galaxy-inspired play space with an avatar, stars, planets, orbital lines, and
wireframe/dodecahedron-like bodies. There is no portfolio or mission content,
scoring, collecting, mission UI, or clickable navigation in this version.

## Experience

For normal motion users, `/` boots directly into the live world after the
prerendered shell hydrates. The player pilots a visible avatar through an airy
white-space galaxy with cyan line art, orange accents, and sparse pastel fills.
The feel is closer to an early playable prototype than a landing page: movement
has inertia, drift, and gentle damping, while the environment stays
non-interactive scenery.

The world should retain the charm of the first Not An Astronaut version: simple
wireframe planets, dodecahedron-ish orbiting forms, drawn orbital paths, and
clean line-art space objects. The galaxy layout should be spiral-arm inspired,
not a straight mission corridor.

## Controls

- Keyboard: `WASD` or arrow keys apply thrust in the camera/player plane.
- Vertical movement: `Space` rises, `Shift` descends.
- Pointer/mouse: click-drag steers yaw and pitch. Passive mouse movement does
  not steer the camera.
- Touch: one-finger drag steers, with a minimal on-screen hint. Full mobile game
  controls are not required for this slice.
- Reduced motion: serve the static fallback page by default, with a visible link
  to opt into the world using `/?mode=world`. That opt-in link should be present
  only on the fallback surface. In explicit world mode, background idle spin is
  disabled and movement damping remains high enough to avoid long gliding
  motion.

## Scene Content

The scene is generated from a deterministic seed so tests can assert counts,
bounds, and stable layout. With the default seed, the new generator should
produce exactly:

- 600 star points distributed along 3 spiral arms.
- 12 line-art planets or small orbiting bodies.
- 18 dodecahedron or low-poly wireframe bodies inspired by the old prototype.
- 20 orbital rings.
- 8 curved spiral-arm guide lines.
- A play volume at least 160 units wide, 80 units tall, and 220 units deep.

Objects are scenery only. No collision, click handling, collection, damage,
inventory, score, mission panels, or route transitions.

Acceptance criteria:

- The avatar is `src/assets/astronaut-alpha.png`, rendered as a billboard sprite
  pinned in front of the camera during normal play.
- Holding forward thrust for one second changes player position by at least 4
  world units in a deterministic unit test that advances 60 fixed `1/60` second
  steps.
- Releasing input reduces velocity over time by damping; velocity should be
  lower after another 60 fixed `1/60` second steps with no input.
- Click-drag changes yaw and pitch; passive mouse movement without an active
  drag does not change yaw or pitch.
- Clicks and wheel events do not trigger route changes, panels, or object
  interactions.
- Non-root pathnames fall back to the same minimal page instead of loading
  mission panels. Query-string variants of `/` still count as the root route
  and preserve surface selection such as `/?mode=world`.

## Architecture

Keep the existing Vite + TypeScript + Three.js structure. Replace the
portfolio-specific travel layer rather than rewriting the whole app. Module
disposition for this slice:

- `src/core/galaxy.ts`: reshape deterministic generation from corridor scatter
  into spiral galaxy data.
- `src/core/player.ts`: add a pure player-motion helper for velocity, thrust,
  damping, and pose updates.
- `src/core/rng.ts` and `src/core/types.ts`: keep and reuse where useful.
- `src/core/travel.ts`, `src/core/path.ts`, `src/core/intent.ts`,
  `src/core/overview.ts`, and `src/core/parallax.ts`: delete unless a helper is
  deliberately repurposed for the game prototype.
- `src/world/scene.ts`: render the free-float world and expose a camera/player
  update API instead of route/node travel frames.
- `src/world/wire.ts`: replace wheel/click/route navigation with input state and
  animation-loop control.
- `src/world/mount.ts`: keep as the world bootstrapper, but update its options
  and cleanup path for the non-node scene.
- `src/hud/hud.ts` and `src/hud/hud.css`: simplify HUD to a small title/control
  overlay. Remove node panels and mission labels. Allowed UI copy is limited to
  the site title, a one-line status, and concise movement hints.
- `src/main.ts`: keep surface selection, reduced-motion behavior, and world
  mount; remove route/node assumptions.
- `src/router.ts`: simplify to world/list surface selection and unknown-route
  fallback handling, or delete if `src/main.ts` can own that small decision.
- `src/content/nodes.ts`, `src/content/schema.ts`, fallback renderer, and route
  tests: reduce content to minimal `newman.foo` fallback copy, or delete schema
  if no structured nodes remain.

Existing assets under `public/artwork/galaxy/` and
`src/assets/astronaut-alpha.png` should be reused where they help. Avoid adding
new heavyweight dependencies.

Test disposition:

- Replace or rewrite `tests/galaxy.test.ts`, `tests/hud.test.ts`,
  `tests/prerender.test.ts`, `tests/render.test.ts`, `tests/router.test.ts`,
  `tests/world-mount.test.ts`, and `tests/world-wire.test.ts` around the new
  game surface.
- Add `tests/player.test.ts` for fixed-step motion, damping, and steering.
- Delete tests for deleted modules: `tests/travel.test.ts`,
  `tests/path.test.ts`, `tests/intent.test.ts`, `tests/overview.test.ts`,
  `tests/parallax.test.ts`, and `tests/replay.test.ts`, unless their subject
  modules are intentionally repurposed.
- Keep `tests/budgets.test.ts` and update expectations only if the existing
  hard budgets are still met.

## Non-Goals

- No Cloudflare deployment work in this slice.
- No gameplay interactions beyond movement.
- No mission content, portfolio sections, or contact panel.
- No multiplayer, persistence, audio, procedural chunk streaming, or physics
  engine.

## Verification

- Unit tests for deterministic spiral generation and player-motion behavior.
- Existing router/fallback tests updated for the reduced content surface.
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run budgets`
- A local visual smoke check of the Vite preview or dev server, confirming the
  canvas is nonblank and the avatar/world respond to movement controls.
- Browser or Playwright smoke coverage that verifies no mission panel appears
  and wheel/click input does not navigate between old content routes.
