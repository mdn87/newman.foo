# newman.foo Spiral Galaxy Game Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the copied Not An Astronaut portfolio flythrough with a minimal `newman.foo` spiral-galaxy free-float game prototype.

**Architecture:** Keep the Vite + TypeScript + Three.js shell, but remove the node/mission travel model at the integration point. Early tasks are additive or compatibility-preserving so every committed checkpoint can pass typecheck. The final runtime is a deterministic spiral galaxy rendered by Three, controlled by a pure fixed-step player helper and keyboard/drag input.

**Tech Stack:** Vite, TypeScript, Three.js, Vitest, Playwright, Node build/prerender scripts.

---

## File Structure

- Modify `src/core/types.ts`: keep existing `NodeDef` until the integration task, and add `PlayerState` / `PlayerInput`.
- Create `src/core/player.ts`: pure player motion, damping, and yaw/pitch steering.
- Modify `src/core/galaxy.ts`: add spiral game data as `makeSpiralGalaxy` while temporarily keeping the old `makeGalaxy` API for the current scene.
- Modify `src/content/nodes.ts`: eventually reduce to `SITE` metadata only; keep `NODES` until integration.
- Delete `src/content/schema.ts` during integration.
- Modify `src/fallback/render.ts`: add `renderFallbackPage`; keep old `renderListPage` until integration.
- Modify `scripts/prerender.ts`: switch to root-only fallback prerender during integration.
- Create `public/_redirects`: Cloudflare Pages SPA fallback so direct non-root URLs serve `index.html`.
- Modify `src/router.ts`: keep `chooseSurface` / `detectWebgl`; remove `routeToIndex` during integration.
- Modify `src/hud/hud.ts` and `src/hud/hud.css`: add minimal HUD while temporarily accepting the old constructor shape and no-op old methods.
- Modify `src/world/scene.ts`, `src/world/mount.ts`, and `src/world/wire.ts` together in the integration task.
- Delete old travel modules/tests during integration: `travel`, `path`, `intent`, `overview`, `parallax`, and `replay`.
- Update brand/package files: `index.html`, `README.md`, `package.json`, `package-lock.json`, `scripts/check-budgets.mjs`, and `tests/budgets.test.ts`.

---

### Task 1: Add Pure Player Motion

**Files:**
- Modify: `src/core/types.ts`
- Create: `src/core/player.ts`
- Test: `tests/player.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/player.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createPlayer, steerPlayer, stepPlayer, type PlayerInput } from '../src/core/player';

const DT = 1 / 60;

function stepMany(input: PlayerInput, frames = 60, start = createPlayer()) {
  let player = start;
  for (let i = 0; i < frames; i++) player = stepPlayer(player, input, DT);
  return player;
}

function length(v: { x: number; y: number; z: number }) {
  return Math.hypot(v.x, v.y, v.z);
}

describe('player motion', () => {
  it('moves forward by at least 4 world units after one fixed second', () => {
    const start = createPlayer();
    const player = stepMany({ forward: 1, right: 0, up: 0 }, 60, start);
    expect(start.position.z - player.position.z).toBeGreaterThanOrEqual(4);
  });

  it('damps velocity when input stops', () => {
    const moving = stepMany({ forward: 1, right: 0, up: 0 });
    const damped = stepMany({ forward: 0, right: 0, up: 0 }, 60, moving);
    expect(length(damped.velocity)).toBeLessThan(length(moving.velocity));
  });

  it('click-drag steering changes yaw and pitch while clamping pitch', () => {
    const player = steerPlayer(createPlayer(), { dx: 120, dy: -80 });
    expect(player.yaw).toBeGreaterThan(0);
    expect(player.pitch).toBeGreaterThan(0);
    expect(player.pitch).toBeLessThan(Math.PI / 2);
  });
});
```

- [ ] **Step 2: Run the test and see it fail**

Run:

```bash
npm test -- tests/player.test.ts
```

Expected: FAIL because `src/core/player.ts` does not exist.

- [ ] **Step 3: Add player types without removing old content types**

Append to `src/core/types.ts`; do not remove `NodeDef` yet:

```ts
export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  pitch: number;
}

export interface PlayerInput {
  forward: number;
  right: number;
  up: number;
}
```

- [ ] **Step 4: Implement `src/core/player.ts`**

Use fixed-step-friendly pure functions:

```ts
import type { PlayerInput, PlayerState, Vec3 } from './types';

const THRUST = 24;
const DAMPING = 2.4;
const TURN = 0.0035;
const MAX_PITCH = Math.PI * 0.42;

export type { PlayerInput, PlayerState };

export function createPlayer(): PlayerState {
  return {
    position: { x: 0, y: 0, z: 18 },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
  };
}

export function steerPlayer(player: PlayerState, delta: { dx: number; dy: number }): PlayerState {
  return {
    ...player,
    yaw: player.yaw + delta.dx * TURN,
    pitch: clamp(player.pitch - delta.dy * TURN, -MAX_PITCH, MAX_PITCH),
  };
}

export function stepPlayer(player: PlayerState, input: PlayerInput, dt: number): PlayerState {
  const f = forwardVector(player.yaw, player.pitch);
  const r = { x: Math.cos(player.yaw), y: 0, z: -Math.sin(player.yaw) };
  const accel = {
    x: (f.x * input.forward + r.x * input.right) * THRUST,
    y: (f.y * input.forward + input.up) * THRUST,
    z: (f.z * input.forward + r.z * input.right) * THRUST,
  };
  const decay = Math.exp(-DAMPING * dt);
  const velocity = {
    x: (player.velocity.x + accel.x * dt) * decay,
    y: (player.velocity.y + accel.y * dt) * decay,
    z: (player.velocity.z + accel.z * dt) * decay,
  };
  return {
    ...player,
    velocity,
    position: {
      x: player.position.x + velocity.x * dt,
      y: player.position.y + velocity.y * dt,
      z: player.position.z + velocity.z * dt,
    },
  };
}

export function forwardVector(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: -Math.cos(yaw) * cp };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
```

- [ ] **Step 5: Verify task**

Run:

```bash
npm test -- tests/player.test.ts
npm run typecheck
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/player.ts tests/player.test.ts
git commit -m "feat: add fixed-step player motion"
```

---

### Task 2: Add Spiral Galaxy Data Beside Existing Galaxy API

**Files:**
- Modify: `src/core/galaxy.ts`
- Test: `tests/galaxy.test.ts`

- [ ] **Step 1: Add tests for the new API while preserving old API tests**

Keep the existing `makeGalaxy` tests for now. Add a new `describe('makeSpiralGalaxy')` block:

```ts
import { makeGalaxy, makeSpiralGalaxy } from '../src/core/galaxy';

describe('makeSpiralGalaxy', () => {
  it('is deterministic for a given seed', () => {
    expect(makeSpiralGalaxy(7)).toEqual(makeSpiralGalaxy(7));
  });

  it('differs across seeds', () => {
    expect(makeSpiralGalaxy(1)).not.toEqual(makeSpiralGalaxy(2));
  });

  it('produces exact default spiral prototype counts', () => {
    const g = makeSpiralGalaxy(1981);
    expect(g.stars).toHaveLength(600);
    expect(g.planets).toHaveLength(12);
    expect(g.polyhedra).toHaveLength(18);
    expect(g.orbits).toHaveLength(20);
    expect(g.armGuides).toHaveLength(8);
  });

  it('covers the required play volume', () => {
    const g = makeSpiralGalaxy(1981);
    const all = [
      ...g.stars.map((s) => s.pos),
      ...g.planets.map((p) => p.pos),
      ...g.polyhedra.map((p) => p.pos),
    ];
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const zs = all.map((p) => p.z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(160);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(80);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThanOrEqual(220);
  });

  it('marks three spiral arms among stars', () => {
    expect(new Set(makeSpiralGalaxy(1981).stars.map((s) => s.armIndex))).toEqual(new Set([0, 1, 2]));
  });
});
```

- [ ] **Step 2: Run the test and see it fail**

Run:

```bash
npm test -- tests/galaxy.test.ts
```

Expected: FAIL because `makeSpiralGalaxy` does not exist.

- [ ] **Step 3: Add the spiral data types and generator**

In `src/core/galaxy.ts`, keep existing `makeGalaxy`, `GalaxyKind`, `GalaxyField` etc. Add:

```ts
export interface SpiralStar { pos: Vec3; size: number; armIndex: number; }
export interface SpiralPlanet { pos: Vec3; radius: number; orbitRadius: number; color: string; }
export interface SpiralPolyhedron { pos: Vec3; radius: number; spin: Vec3; }
export interface SpiralOrbit { center: Vec3; radius: number; tilt: number; }
export interface SpiralArmGuide { points: Vec3[]; }
export interface SpiralGalaxy {
  stars: SpiralStar[];
  planets: SpiralPlanet[];
  polyhedra: SpiralPolyhedron[];
  orbits: SpiralOrbit[];
  armGuides: SpiralArmGuide[];
}
```

Implement `makeSpiralGalaxy(seed: number): SpiralGalaxy` using `mulberry32`, exact default counts, three arms, and a play volume spanning at least the spec dimensions. Keep it pure and deterministic. Do not remove old `makeGalaxy` yet.

Generation must emit exactly N items by construction, not by rejection sampling
with `continue`/drop behavior. Use explicit half-extents with margin, such as
`x/z` radii reaching at least `125` and vertical spread reaching at least `+/-45`
across planets/polyhedra, so the volume test has headroom beyond `160 x 80 x
220`. `armIndex` is the structural 0..2 spiral arm; `armGuides` are the 8 drawn
guide curves.

- [ ] **Step 4: Verify task**

Run:

```bash
npm test -- tests/galaxy.test.ts
npm run typecheck
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/galaxy.ts tests/galaxy.test.ts
git commit -m "feat: add spiral galaxy data model"
```

---

### Task 3: Add Fallback And HUD Compatibility

**Files:**
- Modify: `src/fallback/render.ts`
- Modify: `src/hud/hud.ts`
- Modify: `src/hud/hud.css`
- Test: `tests/render.test.ts`, `tests/hud.test.ts`

- [ ] **Step 1: Add fallback tests without deleting old list-render tests**

In `tests/render.test.ts`, keep existing `renderListPage` tests for compatibility and add:

```ts
import { renderFallbackPage } from '../src/fallback/render';

describe('renderFallbackPage', () => {
  it('renders minimal newman.foo fallback copy and world opt-in', () => {
    const html = renderFallbackPage({
      title: 'newman.foo',
      origin: 'https://newman.foo',
      status: 'spiral drift prototype',
      fallback: 'Reduced-motion and no-WebGL visitors start here.',
    });
    expect(html).toContain('<h1>newman.foo</h1>');
    expect(html).toContain('href="/?mode=world"');
    expect(html).not.toContain('Mission');
    expect(html).not.toContain('NODE');
  });
});
```

- [ ] **Step 2: Add HUD minimal-mode test**

In `tests/hud.test.ts`, add a test for `new Hud(root, SITE)` while leaving the old constructor test in place until integration:

```ts
it('can render the minimal game HUD', () => {
  const root = new FakeElement();
  const hud = new Hud(root as unknown as HTMLElement, {
    title: 'newman.foo',
    origin: 'https://newman.foo',
    status: 'spiral drift prototype',
    fallback: 'Fallback copy',
  });
  hud.setStatus('DRIFT READY');
  expect(root.innerHTML).toContain('newman.foo');
  expect(root.innerHTML).toContain('WASD');
  expect(root.innerHTML).not.toContain('NODE');
  hud.dispose();
});
```

- [ ] **Step 3: Run tests and see them fail**

Run:

```bash
npm test -- tests/render.test.ts tests/hud.test.ts
```

Expected: FAIL because new APIs are missing.

- [ ] **Step 4: Add `renderFallbackPage` beside `renderListPage`**

In `src/fallback/render.ts`, keep `renderListPage` and add:

```ts
// Shared site-metadata shape for the fallback page AND the minimal game HUD.
// `origin` is included so the Task 3 test literal `{ title, origin, status, fallback }`
// and the final reduced SITE (Task 4) both satisfy it without TS2353 excess-property
// errors. Exported so the new-mode Hud constructor (Step 5) can reuse it.
export interface FallbackSite {
  title: string;
  origin: string;
  status: string;
  fallback: string;
}

export function renderFallbackPage(site: FallbackSite): string {
  return `<section class="fallback-shell" aria-label="${esc(site.title)}">
  <h1>${esc(site.title)}</h1>
  <p><em>${esc(site.status)}</em></p>
  <p>${esc(site.fallback)}</p>
  <p><a href="/?mode=world">Enter world</a></p>
</section>`;
}
```

- [ ] **Step 5: Add HUD compatibility constructor**

Update `Hud` so it accepts either old `(root, nodes, site)` or new `(root, site)`. In old mode, keep existing behavior. In new mode, render only:

```html
<div class="hud">
  <div class="hud-title">newman.foo</div>
  <div class="hud-status">DRIFT READY</div>
  <div class="hud-hints">WASD/Arrows thrust - Space/Shift vertical - drag/touch steer</div>
</div>
```

Add `setStatus(text: string)`. Keep `setAtNode`, `setTransit`, `setLabels`, and
`setOverview` as old behavior or no-ops until integration removes callers
(`wire.ts:65` still calls `setOverview` at this checkpoint).

Dispatch the two shapes with **explicit overloads** so both call styles keep full
type inference and the existing 3-arg callers (`wire.ts:15`, `tests/hud.test.ts`,
`tests/world-wire.test.ts`) keep compiling:

```ts
constructor(root: HTMLElement, nodes: NodeDef[], site: typeof SITE);   // old mode
constructor(root: HTMLElement, site: FallbackSite);                    // new game mode
constructor(root: HTMLElement, a: NodeDef[] | FallbackSite, b?: typeof SITE) {
  const oldMode = Array.isArray(a);
  // ...only run the `site.joke` read in old mode; the new FallbackSite has no `joke`.
}
```

Type the new-mode `site` param as the exported `FallbackSite` from
`fallback/render.ts` (it now includes `origin`), **not** `typeof SITE`: at the
Task 3 checkpoint `SITE` is still the old `{ title, origin, joke }` shape, so the
test literal `{ title, origin, status, fallback }` matches only `FallbackSite`.
The final reduced `SITE` (Task 4) structurally satisfies `FallbackSite`, so
`new Hud(root, SITE)` typechecks after integration too. Guard the existing
`site.joke` access (current `hud.ts:36`) so it runs only in old mode.

- [ ] **Step 6: Verify task**

Run:

```bash
npm test -- tests/render.test.ts tests/hud.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/fallback/render.ts src/hud/hud.ts src/hud/hud.css tests/render.test.ts tests/hud.test.ts
git commit -m "feat: add game fallback and hud compatibility"
```

---

### Task 4: Integrate Game Runtime And Remove Travel Model

**Files:**
- Modify: `src/content/nodes.ts`, `src/fallback/render.ts`, `src/router.ts`, `scripts/prerender.ts`, `src/main.ts`
- Create: `public/_redirects`
- Modify: `src/hud/hud.ts`, `src/hud/hud.css`
- Modify: `src/world/scene.ts`, `src/world/mount.ts`, `src/world/wire.ts`
- Modify: `src/core/galaxy.ts`, `src/core/types.ts`
- Delete: `src/content/schema.ts`
- Delete: `src/core/travel.ts`, `src/core/path.ts`, `src/core/intent.ts`, `src/core/overview.ts`, `src/core/parallax.ts`
- Delete tests: `tests/content.test.ts`, `tests/travel.test.ts`, `tests/path.test.ts`, `tests/intent.test.ts`, `tests/overview.test.ts`, `tests/parallax.test.ts`, `tests/replay.test.ts`
- Test: `tests/router.test.ts`, `tests/prerender.test.ts`, `tests/world-mount.test.ts`, `tests/world-wire.test.ts`, `tests/render.test.ts`, `tests/hud.test.ts`, `tests/galaxy.test.ts`, `tests/player.test.ts`

- [ ] **Step 1: Rewrite route/fallback/prerender tests for final behavior**

Update `tests/router.test.ts` to test `chooseSurface`, `detectWebgl` indirectly if existing, and `isRootPath('/') === true`, `isRootPath('/missions/agent-ops') === false`. Remove `routeToIndex` tests.

Update `tests/prerender.test.ts` so `prerender(TEMPLATE, SITE)` emits only `{ '/': html }`; `routeOutFile(dist, '/')` works; non-root routes throw.

Update `tests/render.test.ts` to test only `renderFallbackPage`.

- [ ] **Step 2: Rewrite world mount/wire tests for final API**

`mountWorld` final options:

```ts
export interface MountOpts { site: typeof SITE; reducedMotion: boolean; }
```

`wireWorld` final tests should use a fake scene with:

```ts
frame: vi.fn();
setInput: vi.fn();
steer: vi.fn();
renderer: { domElement: canvas };
```

Assert:

- `keydown`/`keyup` updates input on frame.
- `wheel` and `click` never call `history.pushState`.
- passive pointer move without active drag does not call `steer`.
- pointer drag calls `steer({ dx, dy })`.
- `pointerType: 'touch'` drag also calls `steer`.
- cleanup removes all listeners and disposes HUD.

Define the plan's missing input helper in production:

```ts
const axis = (positive: string[], negative: string[]) =>
  (positive.some((k) => keys.has(k)) ? 1 : 0)
  - (negative.some((k) => keys.has(k)) ? 1 : 0);
```

Embed at least this drag-state coverage in `tests/world-wire.test.ts`:

```ts
it('steers only while pointer drag is active', () => {
  const { canvas, canvasTarget } = installDom();
  const scene = makeScene(canvas);
  const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

  canvasTarget.dispatch('pointermove', { clientX: 20, clientY: 30, pointerType: 'mouse' });
  expect(scene.steer).not.toHaveBeenCalled();

  canvasTarget.dispatch('pointerdown', { clientX: 20, clientY: 30, pointerType: 'mouse' });
  canvasTarget.dispatch('pointermove', { clientX: 35, clientY: 18, pointerType: 'mouse' });
  expect(scene.steer).toHaveBeenLastCalledWith({ dx: 15, dy: -12 });

  canvasTarget.dispatch('pointerup', { clientX: 35, clientY: 18, pointerType: 'mouse' });
  canvasTarget.dispatch('pointermove', { clientX: 55, clientY: 28, pointerType: 'mouse' });
  expect(scene.steer).toHaveBeenCalledTimes(1);
  cleanup();
});

it('supports touch drag steering through pointer events', () => {
  const { canvas, canvasTarget } = installDom();
  const scene = makeScene(canvas);
  const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

  canvasTarget.dispatch('pointerdown', { clientX: 5, clientY: 5, pointerType: 'touch' });
  canvasTarget.dispatch('pointermove', { clientX: 10, clientY: 8, pointerType: 'touch' });
  expect(scene.steer).toHaveBeenCalledWith({ dx: 5, dy: 3 });
  cleanup();
});
```

Production drag state should be a simple `dragging` boolean plus the last pointer
coordinates. Set `dragging = true` on pointerdown, call `scene.steer({ dx, dy })`
only while dragging on pointermove, and clear it on pointerup/pointercancel.

- [ ] **Step 3: Run targeted tests and see them fail**

Run:

```bash
npm test -- tests/router.test.ts tests/prerender.test.ts tests/render.test.ts tests/world-mount.test.ts tests/world-wire.test.ts
```

Expected: FAIL because runtime still uses nodes/travel.

- [ ] **Step 4: Reduce content and router**

Replace `src/content/nodes.ts` with:

```ts
export const SITE = {
  title: 'newman.foo',
  origin: 'https://newman.foo',
  status: 'spiral drift prototype',
  fallback:
    'A tiny free-floating galaxy prototype. Reduced-motion and no-WebGL visitors start here.',
};
```

> **Single-commit coordination (typecheck):** dropping `joke` from `SITE` breaks
> every remaining `site.joke` reader in the same commit. Within this step also
> remove the old-mode `site.joke` read in `src/hud/hud.ts` (line ~36) and the
> `renderListPage` joke footer in `src/fallback/render.ts`, and rewrite any test
> asserting the joke string (`tests/render.test.ts`). The Step 8 `rg` guard must
> include `joke` (it does below) or this slips past the dead-reference sweep.

In `src/router.ts`, export only `Surface`, `chooseSurface`, `detectWebgl`, and:

```ts
export function isRootPath(pathname: string): boolean {
  return pathname === '/' || pathname === '';
}
```

- [ ] **Step 5: Switch prerender to root-only fallback**

Rewrite `scripts/prerender.ts` production code explicitly to:

```ts
export function prerender(template: string, site: typeof SITE): Record<string, string> {
  return {
    '/': template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(site.title)}</title>`)
      .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(`${site.origin}/`)}" />`)
      .replace('<!--SSG-->', renderFallbackPage(site)),
  };
}
```

Drop imports of `NodeDef`, `NODES`, `validateContent`, and `renderListPage`.
Use `renderFallbackPage(SITE)`, emit only `/`, and reject non-root paths in
`routeOutFile`. Keep HTML escaping for title/canonical where needed.

Create `public/_redirects` with:

```text
/* /index.html 200
```

That makes direct non-root URLs work on Cloudflare Pages. The built
`dist/index.html` is still the only prerendered HTML page; direct non-root paths
are served through `_redirects`, and runtime `isRootPath` must display
fallback/list for non-root pathnames.

- [ ] **Step 6: Replace main boot path**

In `src/main.ts`, use:

```ts
const surface: Surface = isRootPath(location.pathname)
  ? chooseSurface({ forced, reducedMotion, webgl: detectWebgl() })
  : 'list';
```

Render fallback if empty; mount world only for `surface === 'world'`; call `mountWorld({ site: SITE, reducedMotion })`.

- [ ] **Step 7: Replace scene/mount/wire together**

`src/world/scene.ts` final API:

```ts
constructor(canvas: HTMLCanvasElement, opts: { idle: boolean; seed?: number });
resize(): void;
setInput(input: PlayerInput): void;
steer(delta: { dx: number; dy: number }): void;
frame(dt: number): void;
dispose(): void;
```

Render:

- `makeSpiralGalaxy(seed)` stars with `THREE.Points`
- planets with existing galaxy SVG sprites or simple line meshes
- polyhedra with `THREE.DodecahedronGeometry` + wireframe material
- orbit rings with line geometry
- `armGuides` with translucent cyan lines
- avatar as `src/assets/astronaut-alpha.png`, billboarded in front of camera with `depthTest = false`

`src/world/mount.ts` constructs `new WorldScene(canvas, { idle: !opts.reducedMotion })`.

`src/world/wire.ts` drives `setInput`, `steer`, and `frame(dt)`; no route, wheel, click, or popstate navigation remains.

- [ ] **Step 8: Remove old modules/tests**

Run:

```bash
git rm src/content/schema.ts
git rm src/core/travel.ts src/core/path.ts src/core/intent.ts src/core/overview.ts src/core/parallax.ts
git rm tests/content.test.ts tests/travel.test.ts tests/path.test.ts tests/intent.test.ts tests/overview.test.ts tests/parallax.test.ts tests/replay.test.ts
```

Also remove old `makeGalaxy` compatibility exports and old `NodeDef` only after `rg` confirms no imports remain:

Before removing `makeGalaxy`, rewrite `tests/galaxy.test.ts` so it imports and
tests only `makeSpiralGalaxy`, or rename the final export to `makeGalaxy` and
update the tests to match the final API. Do not leave the old corridor
`pieces`/`arcs` assertions in place.

```bash
rg -n "NodeDef|TravelState|makeGalaxy|GalaxyField|GalaxyKind|GalaxyPiece|GalaxyArc|TravelMachine|OVERVIEW_INDEX|routeToIndex|FlightPath|nodeParam|overviewPose|WheelIntent|makeBodies|setAtNode|setTransit|setOverview|setLabels|renderListPage|validateContent|joke|\bNODES\b" src scripts
```

Scope to `src scripts` (plus surviving tests) — the deleted test files
(`parallax`/`overview`/`path`/`travel`/`intent`/`replay`/`content`) legitimately
reference some of these symbols, so a repo-wide grep would false-positive on
doomed files. `npm run typecheck` (Step 9) is the real gate; this grep is a
completeness aid. Note `NodeDef` does **not** match `NODES`, so both are listed.

Expected: no live references. If references remain, update them before proceeding.

- [ ] **Step 9: Verify integration**

Run:

```bash
npm run typecheck
npm test -- tests/player.test.ts tests/galaxy.test.ts tests/render.test.ts tests/router.test.ts tests/prerender.test.ts tests/hud.test.ts tests/world-mount.test.ts tests/world-wire.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src tests scripts public/_redirects
git commit -m "refactor: replace portfolio travel with galaxy game runtime"
```

---

### Task 5: Brand, Metadata, Budgets, And Package Cleanup

**Files:**
- Modify: `index.html`, `README.md`, `package.json`, `package-lock.json`
- Modify: `scripts/check-budgets.mjs`
- Modify: `tests/budgets.test.ts`

- [ ] **Step 1: Update metadata**

Change:

- package name to `newman.foo` or `newman-foo` consistently in `package.json` and `package-lock.json`
- descriptions from Not An Astronaut portfolio to `newman.foo` galaxy prototype
- canonical URL and title in `index.html` to `https://newman.foo/` and `newman.foo`
- README commands and description

- [ ] **Step 2: Update budget checker labels/base URL**

In `scripts/check-budgets.mjs`, change `BASE_URL` to a `newman.foo` local/base value and label strings if they mention the old site. Keep the existing hard limits.

- [ ] **Step 3: Run budget tests**

Run:

```bash
npm test -- tests/budgets.test.ts
```

Expected: PASS. Update only test strings/fixtures that reference old names.

- [ ] **Step 4: Search old brand references**

Run:

```bash
rg -n "Not An Astronaut|notanastronaut|notastro|Agent Ops|Fusion Forge|Maker Bay|Mission|NODE" src tests scripts index.html README.md package.json package-lock.json
```

Expected: no unintended old portfolio references. If an old reference remains only in docs/spec history, leave it; this search is intentionally scoped to runtime/test/package files.

- [ ] **Step 5: Verify task**

Run:

```bash
npm run typecheck
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html README.md package.json package-lock.json scripts/check-budgets.mjs tests/budgets.test.ts
git commit -m "chore: rename prototype metadata to newman.foo"
```

---

### Task 6: Playwright Smoke And Visual Verification

**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: Update Playwright smoke tests**

Use stable canvas checks:

- Wait for `canvas#scene`.
- Take a screenshot of the canvas bounding box.
- Count non-white-ish pixels: at least 1 percent of sampled pixels must have any channel below 245.
- Hold `w` for 800 ms, take a second screenshot, and assert at least 0.5 percent of sampled pixels changed by a per-channel sum greater than 30.
- Test `/?mode=list` shows fallback and `Enter world`.
- Test `/missions/agent-ops` shows fallback and does not show old mission text.
- Test `/` in world mode does not show the fallback opt-in link.
- Test the avatar by checking that a small forward/central canvas region contains non-white pixels after boot, or by exposing a stable `data-world-ready`/debug marker from the scene mount if pixel position proves too brittle.

Keep the pixel sampling helper inside `e2e/smoke.spec.ts` so the criteria are self-contained.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS and root-only prerender.

- [ ] **Step 3: Run e2e**

Run:

```bash
npm run e2e
```

Expected: PASS. If Playwright browsers are missing, record the exact missing-browser message and install only through project-local Playwright tooling if available.

- [ ] **Step 4: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "test: verify galaxy prototype smoke"
```

---

### Task 7: Final Verification And Local Visual Pass

**Files:**
- Any task-owned cleanup files

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run typecheck
npm test
npm run build
npm run budgets
npm run e2e
```

Expected: all PASS.

- [ ] **Step 2: Run a local preview**

Run:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/` with the in-app browser or Playwright. Verify:

- canvas is nonblank
- `src/assets/astronaut-alpha.png` avatar is visible
- `W` moves through the scene
- click-drag steers
- passive mouse movement does not steer
- no old mission panel appears

Stop the preview server after verification.

- [ ] **Step 3: Final old-reference search**

Run:

```bash
rg -n "Not An Astronaut|notanastronaut|Agent Ops|Fusion Forge|Maker Bay|TravelMachine|FlightPath|routeToIndex|NODE" src tests scripts index.html README.md package.json package-lock.json
```

Expected: no unintended old runtime references.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
git diff --stat HEAD
```

Expected: clean. If task-owned cleanup remains, commit it:

```bash
git add <specific files>
git commit -m "chore: finalize galaxy prototype cleanup"
```
