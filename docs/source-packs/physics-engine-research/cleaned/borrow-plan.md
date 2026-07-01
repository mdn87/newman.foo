# Borrow Plan

## Borrow Unit 1: Decision Split

- source: this pack
- target: future `better physics` tasks
- change class: routing guidance
- blast radius: docs only
- recommendation: Decide whether the task is feel tuning or real simulation
  before choosing a source pack.

## Borrow Unit 2: Rapier Research

- source: `dimforge/rapier.js`
- target: future real dynamics, collision, spatial query, or CCD work
- change class: deferred implementation research
- blast radius: none now; potentially large if installed later
- recommendation: Treat Rapier as the first candidate for modern 3D simulation,
  but require a prototype and budget check before adoption.

## Borrow Unit 3: cannon-es Research

- source: `pmndrs/cannon-es`
- target: future pure-JS physics experiments
- change class: deferred implementation research
- blast radius: none now; potentially moderate if installed later
- recommendation: Keep cannon-es as the lighter secondary candidate, especially
  if avoiding WASM/init complexity matters.

## Borrow Unit 4: Later Lugos Import

- source: this pack's manifest and cleaned notes
- target: Lugos AETA/Bran source-pack workflow
- change class: deferred ecosystem import
- blast radius: none now
- recommendation: Import only after a concrete task proves `newman.foo` needs
  engine-backed physics rather than integrator tuning.

## Staged Recommendation

Do not install a physics engine now. Use this pack as the fourth lane when a
future task explicitly needs real dynamics or collision.
