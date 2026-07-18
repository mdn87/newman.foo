# Dark Mode + Nose-Pointing Flight + Tight Cam — PORT to the reactive-stars line

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the validated v1 features (dark-mode toggle, speed-preserving velocity alignment, tight chase cam) onto the PRODUCTION line (`origin/master` = reactive stars + ion-particle thruster), on branch `feat/dark-mode-flight-feel-v2`.

**Architecture:** Same as v1 (spec `docs/superpowers/specs/2026-07-18-dark-mode-flight-feel-design.md`), with the port deltas below. The fully-reviewed v1 implementation lives on branch `feat/dark-mode-flight-feel` (pushed); identical files are cherry-picked from it, adapted files carry full code here. **The v1 sRGB fix (`18fa165`) is folded in from the start** — managed-pipeline color targets (background, avatar materials) convert on set; shader-raw targets (grid uniform, aColor attributes, particle colors) stay raw.

**Port deltas vs the v1 spec (treat this section as a spec addendum):**
1. No obstacle field on this line → `Theme` drops `obstacleLo`/`obstacleHi` and `field.ts`/`densityColor` work is N/A. `WorldScene.setObstacles` doesn't exist → no late-obstacle ordering hazard.
2. Ion thruster particles (`src/core/thruster-particles.ts`) spawn hardcoded CYAN/NAVY → `Theme` gains `thrusterMain`/`thrusterDeep` (light = current cyan `#4ab3d4` / navy `#16324a` byte-for-byte; dark = orange `#ff8c4d` / burnt `#b4562a`). Already-alive particles keep their spawn color and fade out within ≤0.65 s of a toggle — accepted.
3. Galaxy geometry's `aColor` attribute wraps `galaxyField.colors` (scene.ts constructor passes the field array into `setAttrs`), and `syncActiveStarBuffers` re-copies active-star colors from `field.colors` **every frame** → repainting that ONE array (in place) themes both the galaxy and the reactive-star overlay automatically. `applyTheme`'s `t.galaxyColor.array.set(...)` therefore must target the attribute whose `.array` IS `galaxyField.colors`.
4. This line boots Rapier under vitest (`tests/dart-physics.test.ts` manually instantiates the WASM) → the REAL dart coast-curve integration test replaces v1's e2e-only fallback. Use a `count: 0` galaxy so star collisions can't perturb the trajectory.
5. Steering here is aim-based (`aimDelta`), not rate-based — no interaction with `alignVelocity` (which acts on velocity, not facing). `DEFAULT_STEER` is untouched.

**Reference SHAs on `feat/dark-mode-flight-feel` (v1):** theme core `c5f00dc`, galaxy `5408331`, painter `19a3a3d`, scene wiring `a2a93ec`, CSS `5543b15`, bootstrap `34f00e9`, HUD toggle `19ee6d2`, wire `c8b3457`, alignVelocity `40acbe6`, dart `cd43836`, camera `8632e51`, e2e `95a156f`, sRGB fix `18fa165`. Retrieve any v1 file content with `git show <sha>:<path>`.

**Execution notes:** sequential subagents, one commit per task (P6 has three). Dependencies: P2..P5 depend on P1; P5 depends on P2+P3+P4; P8 depends on P5+P7; P10 depends on P9. P6, P7, P9, P11 independent after P1. Every task ends with `npm run typecheck && npm test` green.

---

### Task P1: Theme core (v2 slot set)

**Files:** Modify `src/core/types.ts` (add `Rgb`); Create `src/core/theme.ts`; Create `tests/theme.test.ts`.

- [ ] **P1.1** Write `tests/theme.test.ts`: start from `git show c5f00dc:tests/theme.test.ts`, then (a) in the light-legacy test REPLACE the two obstacle assertions with `expect(hex(THEMES.light.thrusterMain)).toBe(0x4ab3d4); expect(hex(THEMES.light.thrusterDeep)).toBe(0x16324a);` (these must equal the hardcoded CYAN/NAVY in `src/core/thruster-particles.ts:11-16`); keep all other assertions. Run → FAIL (module missing).
- [ ] **P1.2** Add `export interface Rgb { r: number; g: number; b: number }` to `src/core/types.ts`. Create `src/core/theme.ts` from `git show c5f00dc:src/core/theme.ts` with the slot changes: remove `obstacleLo`/`obstacleHi` from `Theme` and both palettes; add `thrusterMain: Rgb; thrusterDeep: Rgb;` — light: `thrusterMain: rgb(0x4ab3d4), thrusterDeep: rgb(0x16324a)`; dark: `thrusterMain: rgb(0xff8c4d), thrusterDeep: rgb(0xb4562a)`. Everything else (THEME_KEY, readStoredTheme, guarded helpers, doc comments) identical; update the header comment's "field.ts" mention to "thruster-particles.ts".
- [ ] **P1.3** `npx vitest run tests/theme.test.ts && npm run typecheck` → PASS. `npm test` → full suite green.
- [ ] **P1.4** Commit: `git add src/core/types.ts src/core/theme.ts tests/theme.test.ts && git commit -m "feat: pure theme core (v2 slots: thruster palette, no obstacles)"`

### Task P2: Galaxy `mixes` + `paintStarColors`

**Files:** Modify `src/core/galaxy.ts`; append to `tests/galaxy.test.ts`.

- [ ] **P2.1** Append the two v1 tests from `git show 5408331:tests/galaxy.test.ts` (the `paintStarColors / mixes` describe, plus its imports). Run → FAIL.
- [ ] **P2.2** Implement exactly as v1 Task 2 (`git show 5408331:src/core/galaxy.ts` is the model) adapted to this file: `SpiralField` gains `mixes: Float32Array`; new exported `paintStarColors(mixes, arm, core)` (identical code); delete CYAN/NAVY consts; imports `type Rgb` from './types' + `THEMES` from './theme'. In the loop, the line `const m = coreness * coreness;` ALREADY EXISTS (used by `masses[i] = starMass(sizes[i]!, m)`) — keep it, add `mixes[i] = m;`, delete the three inline `colors[...]` writes. After the loop: `const colors = paintStarColors(mixes, THEMES.light.starArm, THEMES.light.starCore); return { positions, sizes, alphas, colors, collisionRadii, masses, mixes, count };`. NO RNG calls added/removed/reordered; `collisionRadii`/`masses` math untouched.
- [ ] **P2.3** `npx vitest run tests/galaxy.test.ts && npm run typecheck && npm test` → PASS (incl. determinism + star-index/star-collisions suites which consume SpiralField).
- [ ] **P2.4** Commit: `feat: galaxy exposes per-point mixes + paintStarColors for re-theming`

### Task P3: Thruster particle palette

**Files:** Modify `src/core/thruster-particles.ts`, `src/world/thruster.ts`; append to `tests/thruster-particles.test.ts`.

- [ ] **P3.1** Append to `tests/thruster-particles.test.ts` (match its existing helper style — read it first; it constructs `ThrusterParticles` and steps with an input object):

```ts
describe('setPalette', () => {
  const input = () => ({ tail: { x: 0, y: 0, z: 0 }, heading: { x: 0, y: 0, z: 1 }, velocity: { x: 0, y: 0, z: 0 }, enginePower: 1 });

  it('default spawn colors are the legacy cyan/navy pair', () => {
    const p = new ThrusterParticles(16, 7);
    p.step(0.2, input()); // emits several particles
    const c = { r: p.colors[0]!, g: p.colors[1]!, b: p.colors[2]! };
    const isCyan = Math.round(c.r * 255) === 0x4a && Math.round(c.g * 255) === 0xb3 && Math.round(c.b * 255) === 0xd4;
    const isNavy = Math.round(c.r * 255) === 0x16 && Math.round(c.g * 255) === 0x32 && Math.round(c.b * 255) === 0x4a;
    expect(isCyan || isNavy).toBe(true);
  });

  it('after setPalette, new spawns use the new pair (existing colors untouched until overwritten)', () => {
    const p = new ThrusterParticles(64, 7);
    p.step(0.2, input());
    const main = { r: 1, g: 0.5, b: 0.25 }, deep = { r: 0.5, g: 0.25, b: 0 };
    p.setPalette(main, deep);
    const before = Array.from(p.colors);
    p.step(0.4, input()); // spawns more with the new palette
    let sawNew = false;
    for (let i = 0; i < p.capacity; i++) {
      const r = p.colors[i * 3]!, g = p.colors[i * 3 + 1]!, b = p.colors[i * 3 + 2]!;
      if ((Math.abs(r - main.r) < 1e-6 && Math.abs(g - main.g) < 1e-6 && Math.abs(b - main.b) < 1e-6)
        || (Math.abs(r - deep.r) < 1e-6 && Math.abs(g - deep.g) < 1e-6 && Math.abs(b - deep.b) < 1e-6)) sawNew = true;
    }
    expect(sawNew).toBe(true);
    expect(before.length).toBe(p.colors.length); // palette swap alone didn't grow/repaint buffers
  });
});
```

(Adjust `describe`/import placement to the file's conventions; determinism of existing tests must be untouched — `setPalette` consumes NO RNG.) Run → FAIL.
- [ ] **P3.2** Implement in `src/core/thruster-particles.ts`: replace the six `CYAN_*`/`NAVY_*` consts with palette state seeded from the theme (single source of truth):

```ts
import type { Rgb } from './types';
import { THEMES } from './theme';
```

```ts
  private main: Rgb = THEMES.light.thrusterMain;
  private deep: Rgb = THEMES.light.thrusterDeep;

  /** Swap spawn colors (live re-theming). Alive particles keep their color and fade out. Consumes no RNG. */
  public setPalette(main: Rgb, deep: Rgb): void {
    this.main = main; this.deep = deep;
  }
```

In `spawn()`, the color block becomes:

```ts
    const dark = this.rnd() < 0.18;
    const c = dark ? this.deep : this.main;
    this.colors[vectorOffset] = c.r;
    this.colors[vectorOffset + 1] = c.g;
    this.colors[vectorOffset + 2] = c.b;
```

In `src/world/thruster.ts`, add a passthrough on `ThrusterView`:

```ts
  setPalette(main: Rgb, deep: Rgb): void { this.sim.setPalette(main, deep); }
```

(with `import type { Rgb } from '../core/types';`).
- [ ] **P3.3** `npx vitest run tests/thruster-particles.test.ts && npm run typecheck && npm test` → PASS (existing thruster tests must not break — the default palette is byte-identical).
- [ ] **P3.4** Commit: `feat: thruster particles take a spawn palette (live re-theming)`

### Task P4: Pure scene painter (v2 targets)

**Files:** Create `src/world/scene-theme.ts`; create `tests/world-scene-theme.test.ts`.

- [ ] **P4.1** Start both files from v1 (`git show 19a3a3d:src/world/scene-theme.ts`, `git show 19a3a3d:tests/world-scene-theme.test.ts`) and adapt: remove the obstacle slot/branch/imports entirely; add a thruster slot. Final `scene-theme.ts` shape:

```ts
// Pure "paint" half of scene theming — unit-testable with object fakes.
import { paintStarColors } from '../core/galaxy';
import type { Rgb, } from '../core/types';
import type { Theme } from '../core/theme';

export interface ColorTarget { r: number; g: number; b: number; setRGB(r: number, g: number, b: number): unknown }
export interface AttrTarget { array: Float32Array; needsUpdate: boolean }
export interface PaletteTarget { setPalette(main: Rgb, deep: Rgb): void }

/** Every mutable color slot in the scene. A new themed slot MUST be added here (the unit test covers each). */
export interface ThemeTargets {
  background: ColorTarget;   // managed pipeline (sRGB-converting adapter in scene.ts)
  gridColor: ColorTarget;    // custom shader — raw
  avatarBody: ColorTarget;   // managed — sRGB adapter
  avatarFins: ColorTarget;   // managed — sRGB adapter
  galaxyColor: AttrTarget;   // aColor attr wrapping galaxyField.colors — painting it also feeds the active-star overlay
  squareColor: AttrTarget;
  thruster: PaletteTarget;   // ion exhaust spawn colors
}

export function applyTheme(t: ThemeTargets, theme: Theme, ctx: { mixes: Float32Array }): void {
  t.background.setRGB(theme.bg.r, theme.bg.g, theme.bg.b);
  t.gridColor.setRGB(theme.grid.r, theme.grid.g, theme.grid.b);
  t.avatarBody.setRGB(theme.avatarBody.r, theme.avatarBody.g, theme.avatarBody.b);
  t.avatarFins.setRGB(theme.avatarFins.r, theme.avatarFins.g, theme.avatarFins.b);

  t.galaxyColor.array.set(paintStarColors(ctx.mixes, theme.starArm, theme.starCore));
  t.galaxyColor.needsUpdate = true;

  const sq = t.squareColor.array;
  for (let i = 0; i < sq.length; i += 3) { sq[i] = theme.square.r; sq[i + 1] = theme.square.g; sq[i + 2] = theme.square.b; }
  t.squareColor.needsUpdate = true;

  t.thruster.setPalette(theme.thrusterMain, theme.thrusterDeep);
}
```

(Fix the stray comma in the Rgb import when transcribing.) Test file: keep the v1 structure — fakes for colors/attrs; replace the obstacle fake with `const fakeThruster = () => { const calls: Rgb[][] = []; return { calls, setPalette(m: Rgb, d: Rgb) { calls.push([m, d]); } }; }`; the "all slots" test asserts `thruster.calls` ends with `[THEMES.dark.thrusterMain, THEMES.dark.thrusterDeep]`; the light-vs-dark test asserts the palette calls differ; drop the null-obstacle test (no nullable slot remains). TDD order: test first (FAIL: module missing), then implement.
- [ ] **P4.2** `npx vitest run tests/world-scene-theme.test.ts && npm run typecheck && npm test` → PASS.
- [ ] **P4.3** Commit: `feat: pure applyTheme painter (v2: thruster palette, galaxy feeds active stars)`

### Task P5: Wire theming into `WorldScene` + `mountWorld`

**Files:** Modify `src/world/scene.ts`, `src/world/mount.ts`.

- [ ] **P5.1** In `scene.ts` (read it first; anchors from the current file):
  - imports: `import { THEMES, type Theme } from '../core/theme';` and `import { applyTheme, type ThemeTargets, type AttrTarget, type ColorTarget } from './scene-theme';`
  - delete `const BG = 0xffffff;` (line ~11); comment `dark-on-white` → `theme-painted` in `pointsMaterial`'s doc.
  - fields: `private readonly bgColor = new THREE.Color(0xffffff); private readonly bodyMat: THREE.MeshBasicMaterial; private readonly finMat: THREE.MeshBasicMaterial; private currentTheme: Theme;`
  - constructor signature `opts: { seed?: number; theme?: Theme } = {}`; `this.scene.background = this.bgColor;`
  - avatar materials become the fields (same pattern as v1 `a2a93ec`): `this.bodyMat = new THREE.MeshBasicMaterial({ color: 0x2b7e9e }); arrow.add(new THREE.Mesh(bodyGeo, this.bodyMat)); … this.finMat = new THREE.MeshBasicMaterial({ color: 0x184f68 }); const finV = new THREE.Mesh(finGeo, this.finMat); …`
  - end of constructor, before `this.resize()`: `this.currentTheme = opts.theme ?? THEMES.light; this.setTheme(this.currentTheme);`
  - new methods (the sRGB adapter is v1's `18fa165` fix, folded in):

```ts
  /** Repaint every themed slot live — no scene rebuild, flight state untouched. */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    applyTheme(this.targets(), theme, { mixes: this.galaxyField.mixes });
  }

  private targets(): ThemeTargets {
    const attr = (g: THREE.BufferGeometry) => g.getAttribute('aColor') as unknown as AttrTarget;
    // Managed-pipeline targets (background clear, MeshBasicMaterial) store working-space
    // (linear) colors and re-encode to sRGB on output, so they must convert on set —
    // else they render double-brightened. The grid uniform and aColor attributes feed
    // CUSTOM shaders that write values verbatim, so those stay raw. The galaxy aColor
    // attribute wraps galaxyField.colors, so painting it also re-themes the reactive
    // active-star overlay (syncActiveStarBuffers re-copies from field.colors each frame).
    const srgb = (c: THREE.Color): ColorTarget => ({
      get r() { return c.r; }, get g() { return c.g; }, get b() { return c.b; },
      setRGB: (r: number, g: number, b: number) => c.setRGB(r, g, b, THREE.SRGBColorSpace),
    });
    return {
      background: srgb(this.bgColor),
      gridColor: this.gridMat.uniforms.uColor!.value as THREE.Color,
      avatarBody: srgb(this.bodyMat.color),
      avatarFins: srgb(this.finMat.color),
      galaxyColor: attr(this.galaxy.geometry),
      squareColor: attr(this.squares.geometry),
      thruster: this.thruster,
    };
  }
```

  (`this.thruster` is the `ThrusterView`, which after P3 structurally satisfies `PaletteTarget`. VERIFY the galaxy `aColor` attribute's `.array` is the same object as `this.galaxyField.colors` — constructor line `setAttrs(gg, …, this.galaxyField.colors)` — and state this in the commit message.)
  - `mount.ts`: `import { THEMES, getStoredTheme } from '../core/theme';` and pass `{ theme: THEMES[getStoredTheme()] }` where `WorldScene` is constructed.
- [ ] **P5.2** `npm run typecheck && npm test && npm run build` → all green (world-mount tests mock WorldScene).
- [ ] **P5.3** Commit: `feat: WorldScene.setTheme with sRGB-correct targets; mount passes stored theme`

### Task P6: CSS tokens + bootstrap + HUD toggle (cherry-picks)

**Files:** `src/brand/tokens.css`, `src/hud/hud.css`, `index.html`, `src/hud/flight-hud.ts`, `tests/flight-hud.test.ts`.

- [ ] **P6.1** `git cherry-pick -x 5543b15` (CSS tokens + hud.css) — both files are identical on the two lines; expect clean apply. Verify `grep -nE '#[0-9a-fA-F]{3,8}|rgba\(' src/hud/hud.css` → empty.
- [ ] **P6.2** `git cherry-pick -x 34f00e9` (index.html bootstrap) — expect clean. Verify after `npm run build`: `grep -c 'naa-theme' dist/index.html` ≥ 1.
- [ ] **P6.3** `git cherry-pick -x 19ee6d2` (flight-hud toggle + tests). `src/hud/flight-hud.ts` is identical on both lines so the source hunk applies; `tests/flight-hud.test.ts` was rewritten on this line — if it conflicts, resolve by keeping THIS line's file and appending v1's two new tests (`git show 19ee6d2:tests/flight-hud.test.ts`, the `theme toggle…` and `renders without theme opts…` cases), adjusting only the local `makeRoot` helper name if it differs. Run `npx vitest run tests/flight-hud.test.ts`.
- [ ] **P6.4** `npm run typecheck && npm test` → green. (Cherry-picks already committed; if 19ee6d2 needed conflict resolution, `git cherry-pick --continue` finishes it.)

### Task P7: `wire.ts` theme wiring

**Files:** Modify `src/world/wire.ts`; modify `tests/world-wire.test.ts`.

- [ ] **P7.1** Read `tests/world-wire.test.ts` first (this line rewrote it — different helpers than v1). Add `setTheme: vi.fn()` to its FlightHud mock instances AND to its WorldScene mock object (wherever the mock scene is built). Append a toggle test with EXACTLY these assertions (adapt only the surrounding helper calls to this file's conventions — frame installer, mock accessors):

```ts
  it('theme toggle rethemes scene + DOM + storage, and back', async () => {
    // …this file's standard setup (frame stub, scene mock)…
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    const documentElement = { dataset: {} as Record<string, string> };
    // extend this file's document stub with { documentElement }
    const cleanup = await wireWorld(scene, { reducedMotion: false });
    const opts = /* FlightHud mock */ .mock.calls[0]![1] as { theme: string; onThemeToggle: () => void };
    expect(opts.theme).toBe('light');
    opts.onThemeToggle();
    expect(documentElement.dataset.theme).toBe('dark');
    expect(store.get('naa-theme')).toBe('dark');
    expect(scene.setTheme).toHaveBeenCalledWith(THEMES.dark);
    opts.onThemeToggle();
    expect(documentElement.dataset.theme).toBeUndefined();
    expect(store.get('naa-theme')).toBe('light');
    expect(scene.setTheme).toHaveBeenLastCalledWith(THEMES.light);
    cleanup();
  });
```

Run → FAIL (FlightHud constructed without opts).
- [ ] **P7.2** Implement in `src/world/wire.ts` — identical to v1 `c8b3457`: import `{ THEMES, getStoredTheme, storeTheme, type ThemeName }` from '../core/theme'; replace `const hud = new FlightHud(document.getElementById('hud-root')!);` with the `themeName`/`applyThemeName`/`FlightHud(…, { theme, onThemeToggle })` block (`git show c8b3457:src/world/wire.ts` lines around the hud construction are the model — dark sets `document.documentElement.dataset.theme='dark'`, light DELETES it, `storeTheme`, `scene.setTheme(THEMES[name])`, `hud.setTheme(name)`; NO boot-time application).
- [ ] **P7.3** `npx vitest run tests/world-wire.test.ts && npm run typecheck && npm test` → PASS (legacy wire tests untouched and green — boot path reads only the guarded `getStoredTheme`).
- [ ] **P7.4** Commit: `feat: wire theme toggle — DOM attr, guarded storage, scene + HUD repaint`

### Task P8: `alignVelocity` (pure core)

**Files:** Modify `src/core/control.ts`; append to `tests/control.test.ts`.

- [ ] **P8.1** Append v1's four-test `alignVelocity` describe verbatim (`git show 40acbe6:tests/control.test.ts`, the final describe block + the `alignVelocity` import + `import type { Vec3 } from '../src/core/types';`). This file's existing tests cover `aimDelta` — leave them untouched. Run → FAIL.
- [ ] **P8.2** Implement: `ControlOpts` gains `align: number;`; `DEFAULT_CONTROL` → `linearDamping: 0.8` (was 0.5) and `align: 3.5`; add the `alignVelocity` function verbatim from `git show cd43836:src/core/control.ts` (that revision includes the unit-heading JSDoc note). Grep tests/ for any `linearDamping` pin (update to 0.8 if one exists, report it).
- [ ] **P8.3** `npx vitest run tests/control.test.ts && npm run typecheck && npm test` → PASS.
- [ ] **P8.4** Commit: `feat: alignVelocity — speed-preserving nose alignment; damping 0.5->0.8`

### Task P9: Dart applies alignment + REAL integration test

**Files:** Modify `src/physics/dart.ts`; append to `tests/dart-physics.test.ts`.

- [ ] **P9.1** Append to `tests/dart-physics.test.ts` (inside the existing `describe('DartPhysics')`, reusing its `input()` helper and Rapier `beforeAll` bootstrap — do NOT duplicate the bootstrap):

```ts
  it('a coasting dart curves toward the nose after a yaw turn (velocity alignment)', async () => {
    // count: 0 galaxy — no stars, so nothing can collide with the dart mid-test.
    const dart = await DartPhysics.create({}, makeSpiralGalaxy(9, { count: 0 }));
    try {
      for (let i = 0; i < 60; i++) dart.step(1 / 60, input({ forward: 1 }), 0);            // thrust +z, 1s
      for (let i = 0; i < 30; i++) dart.step(1 / 60, input({ yawDelta: Math.PI / 60 }), 0); // release, yaw 90°
      for (let i = 0; i < 90; i++) dart.step(1 / 60, input(), 0);                           // coast 1.5s
      const s = dart.state();
      expect(s.speed).toBeGreaterThan(1);
      const h = { x: Math.cos(s.pitch) * Math.sin(s.yaw), y: Math.sin(s.pitch), z: Math.cos(s.pitch) * Math.cos(s.yaw) };
      const dot = (s.velocity.x * h.x + s.velocity.y * h.y + s.velocity.z * h.z) / s.speed;
      expect(dot).toBeGreaterThan(0.98); // velocity swung to the nose WHILE COASTING
    } finally {
      dart.dispose();
    }
  });
```

Run `npx vitest run tests/dart-physics.test.ts` → the new test FAILS with `dot` near 0 (alignment not yet applied); the two existing tests still pass. If `makeSpiralGalaxy(9, { count: 0 })` breaks `StarCollisions` construction, report NEEDS_CONTEXT (do not stub).
- [ ] **P9.2** Implement in `src/physics/dart.ts`: add `alignVelocity` to the control import. In `step()`, next to `const cap = …`: `const sense: 1 | -1 = input.forward < 0 ? -1 : 1; // commanded travel sense; coasting = forward`. Inside the loop, replace the post-`world.step(...)`/`afterStep` cap block:

```ts
      this.world.step(this.stars.events);
      this.stars.afterStep(FIXED, this.body.translation());
      const nextVelocity = this.body.linvel();
      // Alignment (speed-preserving rotation toward the nose), then the hard cap.
      const av = alignVelocity({ x: nextVelocity.x, y: nextVelocity.y, z: nextVelocity.z }, heading, sense, this.o.align, FIXED);
      let sp = Math.hypot(av.x, av.y, av.z);
      if (sp > cap) { const k = cap / sp; av.x *= k; av.y *= k; av.z *= k; sp = cap; }
      if (av.x !== nextVelocity.x || av.y !== nextVelocity.y || av.z !== nextVelocity.z) this.body.setLinvel(av, true);
      this.acc -= FIXED;
```

- [ ] **P9.3** `npx vitest run tests/dart-physics.test.ts && npm run typecheck && npm test` → PASS.
- [ ] **P9.4** Commit: `feat: dart applies nose-alignment each fixed step (sense from commanded input)`

### Task P10: Tight chase cam

**Files:** `src/world/scene.ts` line ~15.

- [ ] **P10.1** Replace the CAM constants line + its comment exactly as v1 `8632e51`: `const CAM_BACK = 11, CAM_UP = 3.4, CAM_LAG = 12, CAM_LOOK_LAG = 20, CAM_TURN = 7;` with the two-line "Chase cam: CAM_TURN swings the trail…" comment. `npm run typecheck && npm test` → green.
- [ ] **P10.2** Commit: `feat: tight chase cam (CAM_TURN 7, CAM_LAG 12, CAM_LOOK_LAG 20)`

### Task P11: e2e — dark toggle + coast curve

**Files:** `e2e/smoke.spec.ts`.

- [ ] **P11.1** Append v1's dark-mode test verbatim from `git show 1066b8a:e2e/smoke.spec.ts` (the `dark mode: toggle rethemes…` test, WITH the corrected readback comment). Append the coast-curve test from the same revision (`nose-pointing: a coasting dart curves…`) but RE-DERIVE the timings for this line: there is no greeter obstacle, but reactive STARS populate the galaxy — a thrusting dart WILL hit stars. Keep the 800ms hold / 400ms + 700ms sampling as the starting point; if star hits perturb it, shorten the hold further and/or raise `align`-independent margins, keeping the `|x2 − x1| > 4` assertion intact (the REAL alignment regression lives in `tests/dart-physics.test.ts` now — this e2e is user-facing behavior coverage, so honest threshold tuning is acceptable but must be reported).
- [ ] **P11.2** `npm run build && npm run e2e` → ALL pass (13 existing + 2 new = 15). Existing reactive-star/particle/barrel-roll/glide tests are the regression canaries for damping 0.8 + alignment — if `rapier physics: … glides back to rest` or the barrel-roll side-step fails, investigate (alignment interplay) and report BLOCKED with evidence rather than editing legacy assertions.
- [ ] **P11.3** Commit: `test: e2e dark-toggle persistence + coast-curve nose-pointing`

### Task P12: Full gate + live browser pass (MAIN SESSION)

- [ ] `npm run typecheck && npm test && npm run build && npm run budgets && npm run e2e` all green.
- [ ] Browser preview: light boot (legacy-identical incl. avatar teal), toggle dark (bg `#1e2125`, orange stars/dart/grid, ORANGE ION EXHAUST while thrusting, reactive stars scatter in orange), reload persistence, list-mode dark, flight feel + camera. Screenshots for the user. Constants retuned only if something is off; re-gate + commit if changed.

### Task P13: Final review + push + USER GO for master

- [ ] Whole-branch review subagent (master..HEAD), READY-TO-PUSH gate.
- [ ] `git push -u origin feat/dark-mode-flight-feel-v2` (preview deploy).
- [ ] Report to user; **merging to master (production deploy) only on their explicit go** — content differs from what they last approved, so re-confirm.
