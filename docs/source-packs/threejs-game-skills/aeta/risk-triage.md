# Risk Triage

## Metadata

- date: 2026-06-28
- source: `majidmanzarpour/threejs-game-skills`
- target: `newman.foo`
- confidence: medium-high
- evidence: GitHub metadata, repository tree, selected source paths
- change class: docs-only project-local pack
- blast radius: local documentation
- recommended depth: L0 now; L1 before import or script/scaffold adoption

## Pre-Flight Assessment

- trust rating: medium-high for docs-only use
- complexity rating: medium
- flags: external source; helper scripts; asset generators; scaffold template;
  agent YAML files; future Lugos import would copy third-party content

## Risk Review

- security risk: low for local documentation, medium if scripts or credential
  helpers are executed later
- licensing risk: low for docs-only guidance; MIT metadata is clear, but actual
  file import should still preserve license and provenance
- token/cost risk: low now, medium if future agents bulk-read all references
- cascading/conflict risk: low now, medium if scaffold patterns displace this
  repo's existing `src/core` / `src/world` / `src/hud` boundaries
- overall posture: proceed with docs-only local pack; defer copied upstream
  content, scripts, scaffolds, and auto-loading

## Depth Decision

- current depth: L0
- escalate to L1 before any of these actions:
  - copying upstream `SKILL.md` or reference files
  - importing the pack into Lugos/Bran custody
  - executing helper scripts or asset generators
  - adapting scaffold files into this repo
  - enabling automatic skill loading for future agents

## Notes

This source is strong enough to be the preferred project-local game-production
pack for broad playable-loop work. It is not the first stop for low-level
physics/controls tuning; route those tasks through the gamedev pack's
`physics-tuning`, `input-systems`, `camera-systems`, and `game-feel`
disciplines first. The cautious part is not the guidance itself; it is the
surrounding automation surface. Keep the current integration as distilled docs
until a specific task justifies deeper review.
