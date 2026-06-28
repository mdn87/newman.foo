# Risk Triage

## Metadata

- date: 2026-06-28
- primary source: `CloudAI-X/threejs-skills`
- alternative source: `majidmanzarpour/threejs-game-skills`
- target: `newman.foo`
- confidence: medium
- evidence: GitHub metadata and selected upstream files
- change class: docs-only research pack
- blast radius: local documentation
- recommended depth: L0

## Pre-Flight Assessment

- trust rating: medium
- complexity rating: medium
- flags: external sources; license ambiguity for CloudAI-X if copying actual
  files; CloudAI-X README install snippet points at a different repository;
  some alternatives include scripts/assets that would require deeper review
  before import or execution

## Risk Review

- security risk: low for docs-only use
- token/cost risk: low now, medium if future agents bulk-read full upstream
  packs
- cascading/conflict risk: low now, medium if scaffold/scripts from an
  alternative are adopted into this repo
- overall posture: proceed with docs-only research pack; defer install/import

## Depth Decision

- recommended depth: L0 for local comparison
- escalation trigger: move to L1 before copying upstream files, running bundled
  scripts, importing into Bran, or letting the pack auto-load

## Notes

CloudAI-X is popular and focused, but license metadata is not machine-clear and
the README's install snippet references a different repository. The README says
MIT, which is useful but weaker than a checked-in license file for future
redistribution/import decisions. `threejs-game-skills` has clearer licensing
and more production workflow material, but its helper scripts and
asset-generation surfaces should not be used without a separate review.
