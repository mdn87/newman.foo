# Project-Local Gamedev Skills Pack Candidate - Design

Date: 2026-06-28
Status: approved for project-local implementation

## Goal

Create a project-local, AETA-shaped candidate pack for
`gamedev-skills/awesome-gamedev-agent-skills` so `newman.foo` can use curated
game-development agent guidance now, without installing those skills globally.
The pack should also be easy to import into the Lugos ecosystem later because it
preserves provenance, target mapping, risk triage, and borrow units in a stable
shape.

## Scope

In scope:

- A local documentation pack under `docs/source-packs/gamedev-agent-skills/`.
- Upstream provenance pinned to the current repository URL and HEAD commit.
- Curated mapping for the skills that fit this Vite + three.js free-fly galaxy:
  `router`, `threejs-scene-setup`, `camera-systems`, `game-feel`,
  `physics-tuning`, `input-systems`, `game-ui-ux`,
  `performance-optimization`, `procedural-gen`, and `shader-programming`.
- A local activation guide for future agents working in this repo.
- Later-Lugos-import metadata, but no live Bran/AETA import yet.

Out of scope:

- Installing skills into `.agents/skills/`, global Codex skill paths, Bran, or
  Lugos sessions.
- Copying raw upstream `SKILL.md` files or bulk source text.
- Changing runtime code in `src/`.
- Changing production deployment behavior.

## Architecture

The pack is a small, repo-local source-pack candidate:

```text
docs/source-packs/gamedev-agent-skills/
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

`manifest.json` is the machine-readable bridge. It records the upstream source,
commit, selected skills, target project, license posture, active scope, and
later Lugos import hints.

`cleaned/` is the usable knowledge surface. It contains original summaries and
project-specific guidance, not copied upstream content.

`provenance/` and `aeta/` keep the evidence and risk trail close to the pack so
the later Lugos import can be reviewed without reconstructing the conversation.

## Activation Rules

For now, the pack is active only by convention inside this repository. Future
agents should read `cleaned/activation-guide.md` when they are asked to improve
game-like behavior, flight physics feel, camera feel, controls, HUD, procedural
content, shaders, or performance in `newman.foo`.

After review on 2026-06-29, this pack is explicitly the first stop for
low-level physics/controls feel because its disciplines decompose that task
better than the broader Three.js game-production pack. Real rigid-body or
collision work remains a separate physics-engine research lane.

The pack does not auto-load. It does not modify Codex, Bran, or global skills.
If a future task needs direct skill loading, that should be a separate change
that either installs the upstream pack project-locally or imports this candidate
through Lugos.

## Data Flow

1. Operator asks for game-like work in `newman.foo`.
2. Agent reads this pack's activation guide.
3. Agent maps the task to repo targets via `cleaned/target-map.md`.
4. Agent uses `cleaned/borrow-plan.md` to keep changes small and reviewable.
5. If the pack later graduates to Lugos, AETA/Bran can ingest the same manifest
   and cleaned notes as the initial review artifact.

## Risk Handling

Security risk is low because the pack is documentation-only and does not add
runtime code, scripts, install hooks, or network calls.

Token/cost risk is controlled by selecting only the skills relevant to this
repo instead of copying the whole upstream catalog.

Cascading/conflict risk is low because the activation guide defers to existing
repo patterns and tests, especially pure deterministic cores in `src/core/`,
three.js adapters in `src/world/`, HUD code in `src/hud/`, and budget checks.

License risk is low for this private project-local candidate because we store
original summaries and provenance, not raw upstream skill files. The upstream
project is Apache-2.0, which should be preserved if any future import copies
actual skill files.

## Testing And Verification

This change is documentation-only. Verification is:

- `git diff --check`
- Inspect pack JSON for valid syntax.
- Confirm no raw upstream `SKILL.md` files are copied.
- Confirm no `src/` runtime files changed.

## Approval

The operator approved the project-local candidate approach in chat on
2026-06-28 with the constraint: easy to load later into Lugos, but only use for
this project right now.
