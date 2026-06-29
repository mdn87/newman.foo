# Source Intake

## Capture

- date: 2026-06-28
- source: `majidmanzarpour/threejs-game-skills`
- source URL: https://github.com/majidmanzarpour/threejs-game-skills
- captured HEAD: `2215fd7c28ce55cee6a593ba1e422485db42498f`
- target: `newman.foo` / `notanastronaut`
- active scope: project-local only

## Why This Source

`threejs-game-skills` is the preferred Three.js game-production candidate for
this project. It covers the parts that matter when `newman.foo` moves from
Three.js scene work into game-like craft: playable loops, camera feel, HUD,
visual polish, profiling, QA/release evidence, and future asset workflows.

This is a better production fit than using a narrow Three.js API pack alone.
CloudAI-X remains useful for compact topic references, but this source has the
broader workflow surface needed for a game-like site.

## Evidence Captured

- GitHub metadata reported MIT license, 565 stars, 62 forks, zero open issues,
  and last push `2026-06-16T11:18:44Z`.
- Repository tree reported 9 `SKILL.md` modules and 48 markdown files.
- The module set includes director, gameplay systems, graphics builder, UI
  designer, debug/profiler, QA/release, 3D asset, image asset, and audio asset
  workflows.
- The repository also includes scripts, agent YAML files, and a Vite Three.js
  scaffold template. These are recorded as review-gated surfaces, not adopted
  local code.

## Local Fit

The current project is a Vite + TypeScript + Three.js site with deterministic
logic in `src/core/`, Three.js rendering in `src/world/`, HUD code in
`src/hud/`, unit tests in `tests/`, and build/budget checks in `scripts/`.

That structure maps well to the upstream gameplay, graphics, UI, debug, and
QA/release modules, provided we adapt concepts instead of copying scaffold code.

## Non-Goals

- No global Codex skill install.
- No upstream file copy into `.agents/skills/`.
- No script, generator, scaffold, or credential-probe execution.
- No production deployment or merge to `master`.
