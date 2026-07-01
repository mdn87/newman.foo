# Source Intake

## Metadata

- date: 2026-06-28
- primary source: https://github.com/CloudAI-X/threejs-skills
- primary captured HEAD: `b1c623076c661fc9b03dac19292e825a5d106823`
- target: `newman.foo` / `notanastronaut`
- confidence: medium
- evidence: GitHub repository metadata, repository tree, README, sample skill files
- change class: documentation-only project-local research pack
- blast radius: docs only
- recommended depth: L0 now; L1 before Lugos import or copying upstream files

## User Prompt Context

- Do the same project-local source-pack candidate pattern for
  `CloudAI-X/threejs-skills`.
- Conduct research for a more robust alternative.
- Use the source only for this project right now, but keep a later Lugos import
  path easy.

## Source Package

`CloudAI-X/threejs-skills` is a focused collection of 10 Three.js skills:
fundamentals, geometry, materials, lighting, textures, animation, loaders,
shaders, postprocessing, and interaction.

The strongest alternative found for this specific project is
`majidmanzarpour/threejs-game-skills`, which is a game-production-oriented
Three.js skill pack with a director skill, gameplay systems, graphics, UI,
debug/profiling, QA/release, asset-generation skills, references, helper
scripts, and scaffold material.

## Evidence Notes

- Direct evidence: CloudAI-X README says the pack covers Three.js API details,
  best practices, common patterns, and 10 topic skills.
- Direct evidence: CloudAI-X GitHub API metadata reported 2483 stars, 286
  forks, 5 open issues, and last push `2026-01-19T21:15:32Z`; SPDX license
  metadata was null.
- Direct evidence: the CloudAI-X README claims MIT License, but the GitHub API
  did not report a license file.
- Direct evidence: the CloudAI-X README install snippet points at
  `pinkforest/threejs-playground`, not `CloudAI-X/threejs-skills`, so future
  import should re-check repository provenance before copying files.
- Direct evidence: `threejs-game-skills` GitHub API metadata reported MIT
  license, 565 stars, 62 forks, zero open issues, and last push
  `2026-06-16T11:18:44Z`.
- Direct evidence: `threejs-game-skills` tree includes 9 `SKILL.md` files and
  48 Markdown files, including references, checklists, scripts, and a scaffold.
- Inference: `threejs-game-skills` is more robust for `newman.foo` because this
  repo is a game-like browser experience, not only a Three.js API demo.
