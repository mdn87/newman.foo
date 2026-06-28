# Three.js Skills Research Pack - Design

Date: 2026-06-28
Status: approved for project-local implementation

## Goal

Create a project-local, AETA-shaped research pack for
`CloudAI-X/threejs-skills` and compare it against more robust alternatives for
future `newman.foo` game-like Three.js work. The pack should be usable now as
local documentation and easy to promote into Lugos later, but it must not
install or globally activate any upstream skill.

## Source Set

Primary candidate:

- `CloudAI-X/threejs-skills`

Alternatives reviewed:

- `majidmanzarpour/threejs-game-skills`
- `gamedev-skills/awesome-gamedev-agent-skills`
- `dgreenheck/webgpu-claude-skill`
- `EnzeD/r3f-skills`
- Official Three.js docs as the authority fallback for API details

## Recommendation

Use `CloudAI-X/threejs-skills` as a project-local Three.js API/reference
candidate only. It is focused and popular, but its repo metadata does not expose
an SPDX license, it has no tags/releases, and it is more API-topic oriented than
game-production oriented.

Use `majidmanzarpour/threejs-game-skills` as the stronger alternative to track
for future Lugos import. It is MIT-licensed, recently updated, and contains
references, checklists, helper scripts, scaffold material, gameplay systems,
UI, QA/release, and profiling guidance. Those traits fit `newman.foo` better
than a pure Three.js API pack.

Keep the already-added `gamedev-skills` pack as the broad router/composition
layer. This new pack answers the narrower question: which Three.js-specific
source should be preferred when the task is about browser game production or
low-level Three.js API details?

## Pack Shape

```text
docs/source-packs/threejs-skills-research/
  manifest.json
  provenance/
    source-intake.md
  aeta/
    risk-triage.md
  cleaned/
    research-report.md
    activation-guide.md
    target-map.md
    borrow-plan.md
```

No upstream `SKILL.md` files are copied. The pack stores original summaries,
metrics, and project-specific guidance.

## Activation Rules

Use this pack only inside `newman.foo` when a task needs Three.js-specific
judgment:

- renderer, scene, camera, controls, raycasting, loaders, materials, shaders,
  textures, lighting, animation, postprocessing
- playable loop, camera/game feel, debugging/profiling, UI, QA/release
- deciding whether CloudAI-X is enough or whether the stronger game-specific
  alternative should be consulted before implementation

## Later Lugos Import

The manifest records both the CloudAI-X candidate and the recommended robust
alternative with source commits. Before importing into Lugos/Bran, run an L1
review that decides whether actual upstream skill files should be copied,
whether license posture is acceptable, and which source becomes canonical.

## Verification

This change is documentation-only. Verification is:

- JSON manifest parses.
- No raw upstream skill files are copied.
- `git diff --check` passes.
- Standard repo verification remains green.
