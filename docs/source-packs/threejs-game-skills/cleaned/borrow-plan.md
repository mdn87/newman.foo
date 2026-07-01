# Borrow Plan

## Borrow Unit 1: Game Production Routing

- source skills: `threejs-game-director`, `threejs-gameplay-systems`
- target: feature planning, playable loop, controls, camera feel
- change class: project-local guidance
- blast radius: docs now; core/world behavior if applied later
- recommendation: Use this for higher-level playability and system framing. For
  low-level flight physics, controls, and camera feel, start with the gamedev
  pack's finer-grained disciplines.

## Borrow Unit 2: Visual And UI Quality

- source skills: `threejs-aaa-graphics-builder`, `threejs-game-ui-designer`
- target: scene clarity, visual hierarchy, HUD readability, responsive fit
- change class: project-local guidance
- blast radius: docs now; world/HUD code if applied later
- recommendation: Borrow checklists and quality-bar concepts. Verify final API
  details against official Three.js docs and this repo's existing UI tests.

## Borrow Unit 3: Debug, Profiling, And Release Evidence

- source skills: `threejs-debug-profiler`, `threejs-qa-release`
- target: canvas reliability, mobile input checks, budgets, playtest evidence
- change class: project-local guidance
- blast radius: docs now; tests/build gates if applied later
- recommendation: Convert concepts into local verification commands rather than
  importing upstream scripts by default.

## Borrow Unit 4: Future Asset Workflows

- source skills: `threejs-3d-generator`, `threejs-image-generator`,
  `threejs-audio-generator`
- target: future model/image/audio asset pipelines
- change class: deferred
- blast radius: none now; asset provenance and budget impact later
- recommendation: Keep these as planning references only. Do not run generators
  or add produced assets without a separate review.

## Borrow Unit 5: Later Lugos Import

- source: this pack's manifest, provenance, risk triage, and cleaned notes
- target: Lugos AETA/Bran source-pack workflow
- change class: deferred ecosystem import
- blast radius: none now
- recommendation: Promote this source as the canonical Three.js
  game-production candidate only after an L1 import review that decides what
  upstream content, if any, should be copied.

## Staged Recommendation

Use this docs-only pack now for `newman.foo` Three.js game-production work.
Keep CloudAI-X as the compact API-topic reference and the gamedev pack as the
broad router.
