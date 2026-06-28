# Research Report

## Short Verdict

Use `CloudAI-X/threejs-skills` as a project-local Three.js API/reference
candidate. Prefer `majidmanzarpour/threejs-game-skills` as the more robust
alternative for future game-production work or Lugos import.

The existing `gamedev-skills` pack remains the broad game-development router.
This pack narrows the decision for Three.js-specific work.

## Comparison

| Source | Fit | Strengths | Weaknesses | Recommendation |
| --- | --- | --- | --- | --- |
| `CloudAI-X/threejs-skills` | Good for API/topic reference | 10 focused Three.js skills; high GitHub attention; topics map cleanly to scene, materials, shaders, interaction | License metadata is null despite README saying MIT; README install snippet points at another repo; no tags/releases found; less game-production workflow | Keep as API/reference candidate |
| `majidmanzarpour/threejs-game-skills` | Strong for `newman.foo` | MIT license; recent push; director, gameplay, UI, QA/release, debug/profiling, references, scripts, scaffold | More expansive; scripts/assets need review before use | Preferred robust alternative |
| `gamedev-skills/awesome-gamedev-agent-skills` | Strong as broad router | Portable router, three.js web-engine skills, camera/game-feel/input/UI/performance disciplines | Less Three.js-game-specific than the dedicated alternative | Keep as broad orchestration layer |
| `dgreenheck/webgpu-claude-skill` | Narrow | Popular WebGPU + Three.js option | Current project is not WebGPU-first; license metadata unclear | Defer |
| `EnzeD/r3f-skills` | Low-to-medium | React Three Fiber focus | Current project does not use React/R3F; lower repo activity | Defer |
| Official Three.js docs | Authority | Canonical API source | Not an agent skill pack | Use to verify API details |

## Robustness Criteria

The more robust source for `newman.foo` should have:

- clear license posture
- recent maintenance
- project fit for Vite + TypeScript + Three.js
- gameplay, UI, performance, and QA guidance
- enough references/checklists to avoid one-shot shallow advice
- no requirement to globally install or execute scripts for project-local use

By these criteria, `threejs-game-skills` is the stronger candidate for future
Lugos import, while CloudAI-X remains useful as a compact API-topic pack.

## Practical Use In This Repo

For a narrow Three.js API question, consult CloudAI-X-style topic mapping:

- scene/camera/renderer: fundamentals
- object picking or pointer interaction: interaction
- custom particle/shader work: shaders, materials, postprocessing
- GLTF or texture loading: loaders, textures

For product/game quality work, use the robust alternative's framing:

- playable loop and controls: gameplay systems
- visuals and rendering polish: graphics builder
- HUD and responsive UI: game UI designer
- browser/mobile/performance checks: debug profiler and QA/release

Do not copy upstream code, scaffold, or scripts into this repo without a new
review.
