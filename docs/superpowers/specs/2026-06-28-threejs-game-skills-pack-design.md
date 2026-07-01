# Three.js Game Skills Pack - Design

Date: 2026-06-28
Status: approved for project-local implementation

## Goal

Promote `majidmanzarpour/threejs-game-skills` from a recommended alternative
inside the Three.js research pack into its own project-local source-pack
candidate for `newman.foo`.

The pack should make the stronger game-production workflow easy to use for this
project now, while keeping the path clean for a later Lugos/AETA import. It must
not install upstream skills globally, copy raw upstream skill files, run helper
scripts, or import scaffold code.

## Source

- repository: `majidmanzarpour/threejs-game-skills`
- role: preferred broad Three.js game-production source for `newman.foo`
- current project role: docs-only, project-local guidance
- future role: canonical Lugos source-pack candidate after L1 import review

The source has clear MIT license metadata and includes gameplay, graphics, UI,
debug/profiling, QA/release, and asset-generation skill modules. It also
contains scripts and scaffold assets, which are useful signals but should not be
executed or copied without a separate review.

## Pack Shape

```text
docs/source-packs/threejs-game-skills/
  manifest.json
  provenance/
    source-intake.md
  aeta/
    risk-triage.md
  cleaned/
    activation-guide.md
    target-map.md
    borrow-plan.md
```

No upstream `SKILL.md` files are copied. The local files are original
distillations, routing notes, and project-specific adoption guidance.

## Relationship To Existing Packs

- `gamedev-agent-skills`: remains the broad game-development router.
- `threejs-skills-research`: remains the comparison record and keeps
  CloudAI-X as a narrow API/reference candidate.
- `threejs-game-skills`: becomes the preferred broad game-production pack when the task is
  about playable-loop quality, system framing, HUD, performance evidence,
  mobile checks, release confidence, or production-grade Three.js game workflow.
  It is not the first stop for low-level flight physics, controls, or camera
  feel; those route to the gamedev pack's `physics-tuning`, `input-systems`,
  `camera-systems`, and `game-feel` lanes.
- `physics-engine-research`: covers the separate case where "better physics"
  means real rigid bodies, colliders, constraints, spatial queries, or CCD.
- Official Three.js docs remain the authority for exact API behavior.

## Guardrails

- Do not auto-load or globally install the upstream pack.
- Do not copy upstream skill files into `.agents/skills/`.
- Do not run upstream scripts, asset generators, scaffold installers, or
  credential probes without a new review.
- Keep implementation boundaries aligned with this repo: deterministic logic in
  `src/core/`, Three.js adapters in `src/world/`, HUD in `src/hud/`, tests in
  `tests/`, and build/budget gates in `scripts/`.
- Keep `master` untouched; this branch remains the review surface.

## Verification

This change is documentation-only. Verification is:

- JSON manifests parse.
- No raw upstream skill snippets are copied.
- `git diff --check` passes.
- Standard repo checks pass: typecheck, tests, build, and budgets.
