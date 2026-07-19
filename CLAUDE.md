# newman.foo — project rules (the 3D galaxy game)

A portfolio-as-game: pilot an arrow-dart through a spiral galaxy (Vite +
three.js + Rapier). WASD/arrows move, drag to steer, right-click boost, A/D
barrel-roll. Light/dark theme toggle (dark = gray + orange). Deterministic,
seeded, unit-tested cores in `src/core/` (flight/control, galaxy, grid, theme);
three.js adapters in `src/world/`; Rapier physics in `src/physics/`.

## 🚨 Deploy safety — `master` is LIVE

This repo is **`mdn87/newman.foo`**, wired to **Cloudflare Pages** (project
`newman.foo`). **Any push to `master` deploys to production `newman.foo`
immediately** (build `npm run build` → `dist`, NODE_VERSION 22).

> History note (2026-07-19): the game used to live in `mdn87/notanastronaut`
> and deploy to notanastronaut.com. That repo/domain is now Matt's **UX
> résumé** (static site). The game moved here. Do NOT push game code to
> `mdn87/notanastronaut` — that publishes to the résumé site. See
> `docs/SESSION-HANDOFF-2026-07-19.md`.

Therefore, by default:
- **Do NOT commit substantive work directly to `master`, and do NOT push
  `master`.** Work on a feature branch; push it → Cloudflare builds a *preview*
  (production untouched).
- **Ask before merging to `master`** — merging is what goes live at newman.foo.
  State plainly that merging deploys to production, and wait for an explicit go.
- **Never force-push `master`.** Roll-backs are archived as tags
  (`archive/*`).
- Before basing work, `git fetch && git log master..origin/master` — parallel
  sessions/machines push here; a cloud session has merged PRs this clone didn't
  know about.

## Workflow
- Verify before pushing: `npm run typecheck && npm test && npm run build && npm run budgets` (e2e: `npm run e2e`).
- Budgets are enforced; keep the world chunk within limit.
- Session context / full topology: `docs/SESSION-HANDOFF-2026-07-19.md`. Spec/plan: `docs/superpowers/`.
- Unmerged feature: `feat/toroidal-hud-port` (toroidal world-wrap + minimap/gimbal/telemetry HUD) — reviewed, ready, currently on the `mdn87/notanastronaut` remote; see handoff.
