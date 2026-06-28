# Deploy notes — notanastronaut.com

## How it goes live
- The site is hosted on **Cloudflare** (Pages/Workers — a "worker/page thing")
  connected to the GitHub repo **`mdn87/newman.foo`**.
- Pushing to that repo's **`master`** branch triggers the Cloudflare build/deploy.
- Build: `npm run build` → `vite build && tsx scripts/prerender.ts`, output dir **`dist/`**.
- CI (`.github/workflows/ci.yml`) runs typecheck + unit + build + budgets + e2e on
  push to `master` / PRs (it verifies; it does not itself deploy — Cloudflare does).

To confirm on Cloudflare's side (not visible from the repo): the exact project
type (Pages vs Workers), the production branch, build command/output dir, and the
custom-domain mapping to `notanastronaut.com`.

## ⚠️ This working copy is NOT the deploy repo (as of 2026-06-28)
This local folder (`…/MyDocs/notanastronaut`) and the deploy repo `newman.foo`
have **unrelated git histories — no common ancestor**. They cannot be
fast-forwarded or cleanly merged.

- **Local `master`** (this folder): the free-fly galaxy game built here — root
  commit `042858a` "v2 shell", ~21 commits through the controls work
  (`37a2c30`). Fully green (98 unit + 9 e2e + build + budgets).
- **`newman.foo/master`** (live source): a separate lineage — the old node-snap
  "galaxy star-map flythrough" + CI/budgets/e2e setup + an "Add newman.foo galaxy
  prototype" commit. ~40 commits the local copy doesn't have.
- **`newman.foo` branch `codex/spiral-galaxy-game-prototype`**: a *parallel*
  galaxy-game effort by another agent ("replace portfolio travel with galaxy game
  runtime", hud/runtime work). Overlaps conceptually with the local work.

### Consequences / rules
- **Never force-push the local branch onto `newman.foo/master`** — it would
  delete the 40 live-source commits and the codex branch. Permanent loss.
- To ship the local free-fly work, reconcile deliberately. Options:
  1. **Push local `master` as a NEW branch on `newman.foo`** (e.g.
     `git push origin master:refs/heads/free-fly-galaxy`) and open a PR. Safe,
     non-destructive; Cloudflare can build a preview deploy for it. Lets you
     compare against the codex prototype before touching production. *(Recommended.)*
  2. **Port the local changes onto `newman.foo/master`** (rebase/cherry-pick the
     21 commits, resolve conflicts with the existing prototype). Preserves live
     history; manual.
  3. **Adopt one effort as canonical** and retire the other — your call, since two
     galaxy games exist.

## Remote
- `origin` → `https://github.com/mdn87/newman.foo.git` (added 2026-06-28; only a
  read-only `fetch` has been done — nothing pushed).
- `mdn87/notanastronaut` is a *different*, unrelated GitHub repo (old site); not
  the deploy target.
