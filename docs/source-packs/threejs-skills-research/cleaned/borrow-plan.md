# Borrow Plan

## Borrow Unit 1: CloudAI-X As API Reference

- source: `CloudAI-X/threejs-skills`
- target: Three.js API-level work in `src/world/`
- change class: future guidance
- blast radius: docs only now; world adapter only if applied later
- recommendation: Borrow topic coverage and quick-reference structure, not raw
  files. Verify exact APIs against official docs before implementation.

## Borrow Unit 2: Robust Alternative For Game Production

- source: `majidmanzarpour/threejs-game-skills`
- target: playable loop, camera/game feel, UI, debugging, QA/release
- change class: future guidance
- blast radius: docs only now; potentially broad if imported later
- recommendation: Treat as the stronger future Lugos import candidate. Do not
  run scripts or copy scaffold material without a separate L1 review. Use the
  dedicated local pack at `docs/source-packs/threejs-game-skills/` for current
  broad game-production guidance, but route low-level physics/controls tasks to
  the gamedev pack first.

## Borrow Unit 3: Preserve Existing Broad Router

- source: `gamedev-skills/awesome-gamedev-agent-skills`
- target: project-local gamedev routing already staged in this branch
- change class: documentation coordination
- blast radius: docs only
- recommendation: Keep the broad pack as the general decision layer, then use
  this research pack when a task narrows to Three.js.

## Borrow Unit 4: Future Lugos Import

- source: this pack's manifest and cleaned notes
- target: Lugos AETA/Bran source-pack workflow
- change class: deferred ecosystem import
- blast radius: none now
- recommendation: Before import, bind approval to the selected upstream commit,
  settle license posture, and decide whether the robust game-specific pack
  should supersede CloudAI-X as canonical.

## Staged Recommendation

Proceed with this docs-only research pack. For current `newman.foo` work, use
CloudAI-X for compact API-topic guidance and prefer `threejs-game-skills` when
the task needs a more complete game-production workflow. If the task says
"better physics," first decide whether it means tuning the existing flight feel
or adding a real physics engine.
