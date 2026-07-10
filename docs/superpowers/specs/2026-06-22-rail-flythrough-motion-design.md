# Rail Flythrough Motion Design

## Context

The current site is a Vite/TypeScript portfolio with a deterministic core, Three.js world renderer, DOM HUD, prerendered fallback, and tests around travel, replay, render, parallax, and world wiring. The latest direction moves away from the generated galaxy art and toward the older `notanastronaut.net/img` visual language: the standing astronaut, cyan line-art planets, stars, clouds, comets, lunar strips, rivet borders, project medallions, and portfolio imagery.

The motion reference is a third-person guided walk through an illustrated space. The character stays visually anchored while the environment slides, scales, tilts, and passes close to the camera. The target is not free-roaming 3D; it is an authored rail flythrough with enough continuous movement to feel exploratory.

## Chosen Direction

Build a rail flythrough movement prototype inside the existing Three.js world rather than creating a separate app or replacing the renderer with DOM parallax.

Visitor movement should be hybrid:

- Wheel, arrow keys, and navigation input move a continuous progress value along the path.
- Content nodes remain intentional stops with snap/ease zones.
- The visitor can feel motion between stops, but the site still settles cleanly when content needs to be read.

## Motion Experience

The astronaut remains the visual anchor near the lower center/side of the viewport. The world moves around the astronaut instead of making the astronaut feel like a tiny object drifting in an empty map.

The camera follows an authored spline through sparse old-site space scenery. It should:

- Move continuously along the path.
- Look slightly ahead of the current path position.
- Bank subtly into turns.
- Add small idle bob only when reduced motion is not requested.
- Let near-field objects sweep past the viewport edges.
- Ease into content nodes so arrivals feel deliberate.

The site should feel like moving through a designed space made from old-site elements: planets as landmarks, comets/clouds/stars as environmental pieces, project medallions as destinations, and lunar/rivet strips as close-passing foreground scenery.

## Architecture

Keep the existing boundaries:

- Core movement math stays framework-independent under `src/core`.
- Three.js rendering stays in `src/world`.
- DOM labels and controls stay in `src/hud`.
- Fallback rendering remains available for prerendered/static routes.

Add a continuous `MotionController` that replaces the runtime use of `TravelMachine` and `WheelIntent` in `src/world/wire.ts`. `progress` is the source of truth. Node index, transit status, HUD focus, route updates, and overview status are derived from that progress.

Use a node-unit progress domain:

- `progress = -1` is the overview pull-back state.
- `progress = 0` is the first content node.
- `progress = nodeCount - 1` is the last content node.
- Non-integer values are in-between rail motion.

The controller owns:

- `progress`: current continuous path position.
- `targetProgress`: where input wants to move.
- `velocity` or easing state.
- Node snap zones.
- Conversion between node indexes and path progress.
- Reduced-motion behavior.

`TravelMachine` should no longer drive the live world. It can stay in the codebase if tests or fallback behavior still need it, but the rail prototype should expose a thin derived state for existing consumers: current node, target node during travel, overview, and arrival callbacks. This preserves HUD and route semantics while allowing continuous wheel/trackpad input.

Core movement must remain deterministic. The controller receives `dt` and input deltas from callers; it must not call `performance.now()`, `Date.now()`, or read browser state inside `src/core`.

`WorldScene` should evolve from galaxy star-map rendering to rail flythrough rendering:

- Replace generated galaxy sprites with old-site asset sprites.
- Group scenery into far, mid, and near layers.
- Give near objects larger scale, closer camera depth, and stronger lateral movement.
- Keep project destinations clickable/pickable.
- Keep labels tied to projected destination positions.

The path should stop being only `new FlightPath(this.nodePositions)`. Add authored path control points between content nodes so there is space for sweep-past scenery and camera turns. Content nodes remain anchors on that path, but scenery can live between them.

Keep the existing overview behavior, but repurpose it. Backing up from node 0 should still reach `progress = -1`; visually, this is now a pulled-back route/mission view built from the old-site asset language, not the generated galaxy overview. Entering from overview eases back into node 0. The HUD may still call this "overview" internally, but user-facing copy should move away from "STAR MAP" if the scene no longer reads as a galaxy map.

## Asset Direction

Use `notanastronaut.net/img` as the source vocabulary for the prototype. Curated assets should be copied into tracked build paths before use, preferably `src/assets/rail/` for Vite-imported sprites. Do not load runtime assets directly from the untracked `notanastronaut.net/` mirror.

Candidate assets:

- `astronaut.png` for the anchored character.
- `planet1-375x250.png`, `planet1-375x250-alt.png`, and `planet2-200x175.png` for landmarks.
- `comet2-325x150.png`, `comet-125x100.png`, `cloud-200x85.png`, `star-75x75.png`, and `star2-25x25.png` for scenery.
- `lunar-surface.png` and rivet border art for near-field sweep pieces.
- `proj1.png`, `proj2.png`, `proj3.png`, `logo.png`, and `motion.png` for destination markers or content-adjacent objects.

Use the current `src/assets/astronaut-alpha.png` if it avoids matte/halo artifacts better than `notanastronaut.net/img/astronaut.png`; otherwise copy the old-site astronaut into `src/assets/rail/` and verify transparency visually.

The existing `public/artwork/galaxy/galaxy-depth-{far,mid,near}.svg`, comet, star, and related SVGs may be used as reference for layering vocabulary, but they should not remain the primary visual environment unless they clearly match the old-site style.

Do not polish or expand the full art system in the first pass. The first pass should prove motion quality using existing assets, with only small transformations such as scaling, rotation, opacity, tint consistency, and placement.

## Input And Navigation

Supported input:

- Wheel or trackpad scroll moves along the rail with damped velocity.
- Arrow keys advance/back along the rail.
- Existing HUD/nav actions move toward specific nodes.
- Pointer picking on destinations still works.

Snap behavior:

- Each content node has a progress value and snap radius.
- Slow movement near a node eases into that node.
- Strong wheel intent can move through a node rather than trapping the visitor.
- Arriving at a node updates title/content focus as the current implementation does.

The existing wheel threshold/cooldown behavior is too discrete for the prototype. Wheel and trackpad input should feed signed deltas into the controller so small gestures create small progress changes and sustained gestures produce continuous movement.

Near-field sweep pieces must respect a central readability safe zone while a node is settling or at rest. Either keep near pieces out of the label/panel area at rest or render labels/panels with enough backing/contrast to stay readable. The first pass should prefer safe placement over adding new UI chrome.

## Reduced Motion

When reduced motion is requested:

- Avoid idle bob, rotation drift, and camera banking.
- Prefer node-to-node eased transitions or immediate settling over scroll-scrub velocity.
- Keep content reachable and labels readable.
- Preserve the prerendered fallback behavior.

## Testing And Verification

The first implementation should keep existing validation useful:

- Unit tests for path/progress math and snap behavior.
- Replay-style tests for deterministic input outcomes.
- Render tests updated for old-site asset references if needed.
- World wiring tests for input events and destination picking.
- Build, typecheck, and relevant e2e smoke validation after changes.

Visual verification should include desktop and mobile screenshots or browser inspection to confirm:

- The scene is nonblank.
- The astronaut remains anchored.
- Near-field objects sweep past without obscuring key labels.
- Nodes remain readable at rest.
- Reduced-motion mode avoids unnecessary motion.

Motion quality needs a human review gate. Passing automated tests means the implementation is technically stable; it does not by itself mean the movement feels like the reference. The prototype is done only after a manual motion review confirms the rail feel, sweep-past depth, and arrival beats are working.

## First Prototype Scope

The first prototype is successful when:

- Generated galaxy art is no longer the primary visual environment.
- The old-site asset language drives the scene.
- Movement feels like a rail flythrough rather than a static star map.
- Hybrid continuous/snap navigation works.
- Content nodes still function as readable portfolio stops.
- Existing non-destructive validation passes or failures are understood and addressed.

Out of scope for the first prototype:

- Final illustration polish.
- New generated art.
- A full neighborhood/diorama rebuild.
- Major content rewriting.
- Replacing Three.js.
