# Toroidal Flight + Instrument HUD — PORT onto master

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Port the never-merged `codex/toroidal-flight-hud` feature (torus world-wrap at the ±630 grid seam, minimap, gimbal compass, fixed telemetry panel) onto current `master` (reactive stars + ion thruster + dark mode + one-way sensor collisions + velocity alignment), on branch `feat/toroidal-hud-port`.

**Source of truth:** spec `docs/superpowers/specs/2026-07-17-toroidal-flight-hud-design.md` (recorded from the codex branch) **as amended by the port deltas below** — the spec was written for a galaxy-less, pre-dark-mode world. Original implementation: `git show codex/toroidal-flight-hud:<path>` (~20 TDD commits). Retrieve, adapt, never restore that branch's world (no galaxy deletion, no obstacles.ts, no scene-theme removal).

**Port deltas (spec addendum — binding):**
- **D1 Theming:** spec's "opaque white / cyan / orange" HUD is the LIGHT theme reading. Panels use existing tokens (`var(--panel-card)` backgrounds, `var(--sky-line)` borders, `var(--sky)`/`var(--sky-text)` lines/text, `var(--accent)` for heading/wrap accents). NO hardcoded hexes in hud.css (grep gate stays). Dark mode must come free via the token overrides.
- **D2 Telemetry replaces `.flight-readout`:** one authoritative XYZ readout. The floating readout element, its CSS block, and the now-unused `--readout*` tokens are REMOVED (light+dark). Master consumers to retarget: `wire.ts` (`hud.setReadout(scene.readout())` → `hud.setNavigation(...)` from dart state), and the two e2e tests that regex X out of `.flight-readout` (coast-curve, barrel-roll) → read the telemetry panel instead.
- **D3 Physics merge order in `dart.ts`:** existing fixed-step loop keeps `world.step(events)` → `stars.afterStep` → alignVelocity → cap → guarded setLinvel; ADD canonical wrap AFTER that: read translation, `wrapPositionInto(t, GRID_EDGE, out)`, if wrapped `setTranslation(out)` and latch `wrapped` for the step. Velocity, yaw/pitch/bank, throttle untouched by wrap. REMOVE the live `boundaryForce` contribution from the force sum (seam 630 < old 720 onset; keep the `boundaryForce` export + `bound`/`boundPush` opts for legacy flight.ts/tests).
- **D4 Reactive stars × wrap:** wrap applies post-step, so `prepare()`'s segment (built from loop-top canonical translation + predicted) never spans the seam discontinuity — a wrap teleports the ship and the stale armed slots self-release via `RELEASE_RADIUS`; new stars arm around the new position next step. Stars ARE present beyond ±630 (galaxy radius 700) — that's fine (sensors, one-way). A dart-physics test must cover: seam crossing with a real galaxy present (position wraps, speed/heading unchanged, no error, hitCount sane).
- **D5 `FlightState.wrapped: boolean`:** added to `flight-types.ts`. Ripples: legacy `FlightMachine` (`src/core/flight.ts`) sets `wrapped: false`; `dart.state()` reports the last-step latch; any mock FlightStates in tests gain the field (typecheck will find them).
- **D6 Shared edge constant:** adopt codex's `gridEdge()` / `GRID_EDGE` (= 630) additions in `src/core/grid.ts` (spacing 90 / extent 700 already match master's scene grid). `dart.ts` and the HUD `edge` option consume `GRID_EDGE` — no competing literals.

**Execution:** sequential subagents, TDD, one commit per task, `npm run typecheck && npm test` green per task. Dependencies: T3 needs T1+T2; T5 needs T3+T4; T6 needs T5.

---

### T1: Pure torus core

- [ ] Copy `git show codex/toroidal-flight-hud:src/core/torus.ts` → `src/core/torus.ts` and `git show codex/toroidal-flight-hud:tests/torus.test.ts` → `tests/torus.test.ts` (verbatim; TDD = tests first, watch them fail on missing module). Both are pure; expect zero adaptation.
- [ ] Commit: `feat: pure torus core — wrap + nearest-image helpers`

### T2: Grid edge single source of truth

- [ ] Adapt the codex `grid.ts` additions onto master's `src/core/grid.ts`: `GRID_LINE_SPACING = 90`, `GRID_LINE_EXTENT = 700`, `gridEdge(opts)` (floor(extent/spacing)*spacing, throws on non-positive spacing), `GRID_EDGE = gridEdge()`. Port the matching tests from `git show codex/toroidal-flight-hud:tests/grid.test.ts` (only the edge-related additions; master's existing grid tests untouched).
- [ ] Commit: `feat: grid edge constants — one quantized seam source (630)`

### T3: Dart torus wrap + FlightState.wrapped

- [ ] Tests first, in `tests/dart-physics.test.ts` (reuse wasm bootstrap + `input()`): (a) with `count: 0` galaxy, thrust +z until z > 630 → position wraps to ≈ −630+overshoot, speed and yaw unchanged, `state().wrapped === true` on the wrapping step and `false` after; (b) with a real galaxy (`makeSpiralGalaxy(7, { count: 4096, radius: 700, thickness: 8 })`), cross the +z seam: no throw, position canonical (|z| ≤ 630), speed continuous (no drop > 0.5 — stars are sensors). Also consult `git show codex/toroidal-flight-hud:tests/dart-physics.test.ts` for the original wrap assertions and port what applies.
- [ ] Implement per D3/D5/D6 in `src/physics/dart.ts` (import `wrapPositionInto` from `../core/torus`, `GRID_EDGE` from `../core/grid`; preallocated `out` Vec3 field — no per-step allocation; remove `bnd` from the force sum and the `boundaryForce` import if now unused); `src/core/flight-types.ts` (+`wrapped`); `src/core/flight.ts` (`wrapped: false`); fix any typecheck ripples in test mocks (flag them).
- [ ] Commit: `feat: toroidal ship wrap at the ±630 grid seam (replaces live soft boundary)`

### T4: Instrument HUD (minimap + gimbal compass + telemetry), themed

- [ ] Study `git show codex/toroidal-flight-hud:src/hud/flight-hud.ts` and `:src/hud/hud.css` and `:tests/flight-hud.test.ts` COMPLETELY. Port the three instrument regions and `FlightNavigation`/`setNavigation` API onto master's `FlightHud`, MERGING with the existing `{ theme, onThemeToggle }` options (one options object: `{ theme, onThemeToggle, edge }`); keep `setTheme` label behavior + its tests. Remove `.flight-readout` (D2) — element, `setReadout`, CSS, `--readout*` tokens in both tokens.css blocks. All new CSS via theme tokens (D1); after the edit `grep -nE '#[0-9a-fA-F]{3,8}|rgba\(' src/hud/hud.css` must stay empty.
- [ ] Tests: port codex's flight-hud tests (adapting the fake-root harness style already in master's file), keep master's theme tests, add one assertion that instrument colors come from CSS classes (no inline color styles).
- [ ] Commit: `feat: geometric flight instruments — minimap, gimbal compass, telemetry (themed)`

### T5: Wire navigation state

- [ ] Study `git show codex/toroidal-flight-hud:src/world/wire.ts` (nav plumbing only — that branch's wire lacks theme/galaxyAngle/activeStars; take ONLY the setNavigation call shape). In master's `wire.ts`: construct `FlightHud` with `edge: GRID_EDGE`; per frame replace `hud.setReadout(scene.readout())` with `hud.setNavigation({ position: s.position, heading: s.heading, yaw: s.yaw, pitch: s.pitch, speed: s.speed, wrapped: s.wrapped })` (match the exact `FlightNavigation` field names from T4). `scene.readout()` may become unused by wire — leave the scene method itself alone.
- [ ] Update `tests/world-wire.test.ts` (hud mock gains `setNavigation`; assertions per codex's wire tests where applicable; theme-toggle test untouched).
- [ ] Commit: `feat: wire navigation state + wrap feedback into the instrument HUD`

### T6: e2e

- [ ] Port codex's HUD smoke tests (regions present/positioned, seam-crossing determinism — `git show codex/toroidal-flight-hud:e2e/smoke.spec.ts` for reference), adapted to master's suite. Retarget the coast-curve and barrel-roll tests' X-position reads from `.flight-readout` to the telemetry panel (keep assertions/thresholds). Verify the dark-mode pixel test still passes with opaque panels present (they're theme-colored; if the darkBg count needs a margin tweak from panel coverage, report it). Full `npm run build && npm run e2e` green, 2 consecutive runs.
- [ ] Commit: `test: e2e instrument HUD + seam crossing; retarget readout selectors`

### T7: Gate + live browser pass (MAIN SESSION)

- [ ] Full gate (typecheck/test/build/budgets/e2e). Browser: both themes (instruments legible in dark), fly across a seam (ship re-enters opposite face, GRID WRAP accent fires, motion continuous), minimap marker + heading vector track, compass yaw/pitch respond, telemetry XYZ matches wrap. Screenshots.

### T8: Final review + push + user go

- [ ] Whole-branch review subagent; push `feat/toroidal-hud-port` (preview); **merge to master only on the user's explicit go**.
