# Session Handoff — notanastronaut / newman.foo — 2026-07-19

This session shipped three game features, corrected a repo/domain mixup, and
re-homed the two sites. Read this before touching either repo or Cloudflare.

## TL;DR — what is where now

| Thing | Repo | Cloudflare Pages project | Domain(s) | State |
|---|---|---|---|---|
| **UX portfolio / résumé** (static, no build) | `mdn87/notanastronaut` `master` | `notanastronaut` | notanastronaut.com, www, **notanastronaut.net** (+www) | .com LIVE; .net propagating |
| **3D free-fly galaxy game** (Vite/three/Rapier) | `mdn87/newman.foo` `master` | `newman.foo` | newman.foo, www | LIVE |

The **repos swapped roles** this session. Historically the game had been built
in `mdn87/notanastronaut` and deployed to notanastronaut.com, while
`mdn87/newman.foo` held a stale older game and the résumé was displaced. Intended
state (now realized): **notanastronaut = résumé, newman.foo = game.**

## Repos, branches, recovery tags

### `mdn87/notanastronaut` (origin) — now the RÉSUMÉ
- `master` = `1f0d2ad` "revert: restore the UX portfolio" — the static résumé
  (site lives in the `notanastronaut.net/` subfolder; `.psd`/`.ai` design
  sources are git-ignored, not deployed).
- **`archive/game-live-2026-07-19`** = `b86c586` — the full game as it was live
  before the swap (dark mode + flight feel + one-way collisions). Recovery point.
- Game feature branches still hosted here (pushed to origin):
  - `feat/dark-mode-flight-feel-v2` — the reactive-stars port that became the live game
  - `feat/dark-mode-flight-feel` — the *dense-field* variant (superseded line)
  - `fix/one-way-star-collisions`, `feat/star-collision-particle-thruster-impl`

### `mdn87/newman.foo` (newmanfoo) — now the GAME
- `master` = `b86c586` — the live game (force-pushed here during the swap).
- **`archive/newman-foo-preswap-2026-07-19`** = `a91576c` — the stale dense-field
  prototype that newman.foo held before the swap. Recovery point.
- `archive/newman-codex-prototype` = `aab1897` — an even older prototype.

- **`feat/toroidal-hud-port`** = `c13edbe` — the toroidal HUD (consolidated
  onto this repo 2026-07-19), reviewed/READY-TO-PUSH, NOT merged. Full gate
  green (186 unit / 17 e2e / budgets).

## Feature workstreams & status

1. **Dark mode toggle** (dark-gray + orange), light default, persisted
   (`localStorage naa-theme`), pre-paint `<head>` bootstrap, live WebGL repaint.
   **LIVE** in the game (b86c586).
2. **Nose-pointing flight** — `alignVelocity` (speed-preserving rotation toward
   the nose, sense from commanded input) + damping 0.5→0.8. **LIVE.**
3. **Tight chase camera** — CAM_TURN 7 / CAM_LAG 12 / CAM_LOOK_LAG 20. **LIVE.**
4. **One-way star collisions** — star colliders are sensors; ship keeps full
   momentum (killed the stutter); stars scatter via a synthesized mass-independent
   kick. **LIVE** (b86c586).
5. **Toroidal HUD** — torus world-wrap at ±630 grid seam, minimap + gimbal compass
   + telemetry panel (replaces the floating readout), all themed. **DONE on
   `feat/toroidal-hud-port` (c13edbe), reviewed (READY TO PUSH), NOT merged.**
   Full gate green (186 unit / 17 e2e / budgets). It lives on the `newman.foo`
   remote now; merge = `git push newmanfoo feat/toroidal-hud-port:master`.

## Cloudflare configuration (account 1e15609de3ff9d11139a11ff603a03cc)

- **`notanastronaut` Pages project** → mdn87/notanastronaut. Build config is now
  **Framework preset None, build command EMPTY, output directory
  `notanastronaut.net`** (the résumé is static, no build). Custom domains:
  notanastronaut.com (Active), www.notanastronaut.com (Active),
  **notanastronaut.net (Verifying)**, **www.notanastronaut.net (Initializing)**.
- **`newman.foo` Pages project** → mdn87/newman.foo. Build `npm run build` → `dist`,
  NODE_VERSION 22 (the game). Auto-deploys on push to master.
- Both projects auto-deploy on push to their repo's `master`.

## Deploy procedures (IMPORTANT — the rules changed)

- **Ship the game:** push to `newman.foo` `master` → deploys to **newman.foo**
  (NOT notanastronaut.com anymore). Verify first:
  `npm run typecheck && npm test && npm run build && npm run budgets && npm run e2e`.
- **Ship the résumé:** push to `notanastronaut` `master` → deploys the static
  site to **notanastronaut.com** (+ .net once propagated). No build step.
- Both are production. Branch + preview-deploy first; merge to master only on
  explicit go.

## Open / pending items

1. **notanastronaut.net propagation** — nameservers were switched at Namecheap
   (Web Hosting DNS → Cloudflare `tate`/`tricia.ns.cloudflare.com`) and the .net
   Pages custom domains added. Waiting on NS propagation (minutes–hours; Namecheap
   quoted up to 48h). Will flip to Active + SSL automatically. The old
   Namecheap-hosted .net site and `@notanastronaut.net` email will stop resolving
   (confirmed not needed). Verify: `dig +short NS notanastronaut.net` should show
   the cloudflare pair, then `curl -s https://notanastronaut.net/ | grep -i title`
   should show "Matt's UX Portfolio".
2. **Toroidal HUD merge decision** — see above; user to try the preview
   (origin/feat/toroidal-hud-port → its pages.dev) and decide.
3. **Barrel-roll feel** — velocity alignment gently bends the side-dodge back
   toward the nose (~0.3s). e2e passes; if it feels muted, lower `align` in
   `src/core/control.ts` (DEFAULT_CONTROL). Noted, not changed.
4. **Scratch files** (game repo working tree): none tracked; `notanastronaut.net.zip`
   and `notanastronaut.net/` remain untracked in the local checkout (the résumé
   source export). Harmless; git-ignored on the game side.

## Gotchas & lessons (don't relearn these)

- **Parallel implementation lines.** Multiple sessions/machines push to these
  repos; a cloud session merged a PR the local clone didn't know about. ALWAYS
  `git fetch <remote> && git log master..<remote>/master` before basing work.
- **sRGB color space.** `THREE.Color.setRGB` defaults to *linear* working space;
  palette hexes must be set with `THREE.SRGBColorSpace` for three-managed targets
  (background clear, MeshBasicMaterial) or they render double-brightened. Custom
  shaders (grid uniform, aColor point attributes) take raw values. See
  `src/world/scene.ts` `targets()`.
- **Rapier under vitest.** The reactive-stars line CAN load Rapier WASM under
  vitest (`tests/dart-physics.test.ts` has the manual bootstrap); the dense-field
  line could not (`@dimforge/rapier3d` has a module-only entry) and used an e2e
  fallback. Prefer the real integration test.
- **Torus camera seam.** On a wrap, shift the smoothed camera (`camPos`/`lookAt`)
  by the quantized teleport delta or the avatar leaves frame for ~0.5s. See
  `scene.ts` `frame()` wrap block.

## Verification snapshot (end of session)
- Résumé: `https://notanastronaut.com/` → "Matt's UX Portfolio" ✅
- Game: `https://newman.foo/` → "Not An Astronaut" ✅
- notanastronaut.net: wired, propagating ⏳
