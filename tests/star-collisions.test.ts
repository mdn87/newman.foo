import { beforeAll, describe, expect, it } from 'vitest';
import type { SpiralField } from '../src/core/galaxy';
import { StarCollisions } from '../src/physics/star-collisions';

let RAPIER: typeof import('@dimforge/rapier3d');

beforeAll(async () => {
  // Rapier 0.14 omits declarations for this internal binding module.
  // @ts-expect-error The runtime file is present in the exact-pinned package.
  const bindings = await import('@dimforge/rapier3d/rapier_wasm3d_bg.js') as {
    __wbg_set_wasm(wasm: WebAssembly.Exports): void;
  };
  const { readFile } = await import('node:fs/promises');
  const wasm = await readFile(new URL(
    '../node_modules/@dimforge/rapier3d/rapier_wasm3d_bg.wasm',
    import.meta.url,
  ));
  const { instance } = await WebAssembly.instantiate(wasm, {
    './rapier_wasm3d_bg.js': bindings,
  } as unknown as WebAssembly.Imports);
  RAPIER = await import('@dimforge/rapier3d/rapier.js?inline') as unknown as typeof import('@dimforge/rapier3d');
  bindings.__wbg_set_wasm(instance.exports);
});

const field = (mass: number): SpiralField => ({
  positions: new Float32Array([0, 0, 28]),
  sizes: new Float32Array([2]),
  alphas: new Float32Array([1]),
  colors: new Float32Array([0.29, 0.7, 0.83]),
  collisionRadii: new Float32Array([2]),
  masses: new Float32Array([mass]),
  count: 1,
});

function scenario(mass: number) {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  world.timestep = 1 / 120;
  const ship = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 0, 0)
    .lockRotations()
    .setAdditionalMass(1)
    .setCcdEnabled(true));
  const shipCollider = world.createCollider(
    RAPIER.ColliderDesc.ball(1.6)
      .setDensity(0)
      .setRestitution(0.7)
      .setCollisionGroups(0x00010002),
    ship,
  );
  const stars = new StarCollisions(RAPIER, world, shipCollider.handle, field(mass), { capacity: 1 });
  stars.prepare({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 32 }, 0);
  ship.setLinvel({ x: 0, y: 0, z: 40 }, true);
  for (let i = 0; i < 120; i++) {
    world.step(stars.events);
    stars.afterStep(1 / 120, ship.translation());
  }
  return { world, ship, stars };
}

describe('StarCollisions', () => {
  it('launches a light star and records the hit', () => {
    const s = scenario(0.2);
    try {
      expect(s.stars.snapshot().hitCount).toBe(1);
      expect(s.stars.snapshot().positions[2]).toBeGreaterThan(28);
    } finally {
      s.stars.dispose();
      s.world.free();
    }
  });

  it('a heavy star slows the ship more than a light star', () => {
    const light = scenario(0.2);
    const heavy = scenario(6);
    try {
      expect(heavy.ship.linvel().z).toBeLessThan(light.ship.linvel().z);
    } finally {
      light.stars.dispose();
      heavy.stars.dispose();
      light.world.free();
      heavy.world.free();
    }
  });

  it('fades and releases a scattered star', () => {
    const s = scenario(0.2);
    try {
      for (let i = 0; i < 240; i++) s.stars.afterStep(1 / 120, s.ship.translation());
      expect(s.stars.snapshot().starIndices[0]).toBe(-1);
      expect(s.stars.snapshot().alphas[0]).toBe(0);
    } finally {
      s.stars.dispose();
      s.world.free();
    }
  });
});
