# Risk Triage

## Metadata

- date: 2026-06-29
- source: `gamedev-skills/awesome-gamedev-agent-skills`
- target: `newman.foo`
- confidence: medium-high
- evidence: repository metadata and selected source paths
- change class: docs-only candidate pack
- blast radius: local documentation
- recommended depth: L0

## Pre-Flight Assessment

- trust rating: medium-high
- complexity rating: medium
- flags: upstream is external; future import may copy Apache-2.0 material; avoid
  bulk-loading the full catalog into every task

## Risk Review

- security risk: low
- token/cost risk: low-to-medium; higher if agents bulk-load all 67 skills
- cascading/conflict risk: low now, medium if physics-tuning is mistaken for a
  real engine-integration lane
- overall posture: proceed with project-local candidate only

## Depth Decision

- recommended depth: L0 for local use
- escalation trigger: move to L1 before installing skills, copying upstream
  files, importing into Bran, or making the pack auto-load

## Notes

No runtime code, install hooks, shell commands, MCP tools, tokens, or remote
services are added by this pack. The pack should not be treated as a global
agent capability until a future Lugos import binds approval to the source commit
and decides whether to preserve actual upstream skill files or only local
distillation.

Physics wording needs care: `physics-tuning` is appropriate for the existing
hand-rolled flight integrator in `src/core/flight.ts`. It is not a substitute
for choosing Rapier, cannon-es, or another engine when the task needs rigid
bodies, colliders, constraints, spatial queries, or continuous collision
detection.
