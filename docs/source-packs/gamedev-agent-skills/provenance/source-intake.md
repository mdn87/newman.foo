# Source Intake

## Metadata

- date: 2026-06-28
- source: https://github.com/gamedev-skills/awesome-gamedev-agent-skills
- captured HEAD: `9d0fa9612225d51d9a89f0a0c6f0fe15d85e3ee0`
- target: `newman.foo` / `notanastronaut`
- confidence: medium-high
- evidence: upstream README, repository tree, router metadata, selected skill metadata
- change class: documentation-only project-local candidate
- blast radius: docs only
- recommended depth: L0 now; L1 before global/Lugos import

## User Prompt Context

- Borrow the Lugos AETA ingest style for using the gamedev agent skills with the
  new game-like `newman.foo`.
- Keep the work easy to load into the Lugos ecosystem later.
- Do not globally install or activate the upstream skills yet; use them only for
  this project right now.

## Source Package

The upstream repository is an Apache-2.0 catalog of game-development agent
skills. It includes a router skill plus engine, discipline, genre, and workflow
skills. For this project, the relevant detected engine is three.js because
`package.json` depends on `three`.

The selected subset is intentionally small: router, three.js scene setup,
camera systems, game feel, input systems, game UI/UX, and performance
optimization.

## Evidence Notes

- Direct evidence: upstream README describes a router and 66 game-dev skills,
  including web engine and discipline categories.
- Direct evidence: upstream router uses `package.json` dependency on `three` as
  the three.js detection signal.
- Direct evidence: this repo uses Vite, TypeScript, and three.js, with pure
  core flight logic and three.js world adapters.
- Inference: a project-local candidate pack is the best first step because it
  gives future agents guidance without changing global skill activation.
