import { beforeAll, describe, expect, it } from 'vitest';
import type { FlightInput } from '../src/core/flight-types';
import { makeSpiralGalaxy } from '../src/core/galaxy';

let DartPhysics: typeof import('../src/physics/dart').DartPhysics;

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
  await import('@dimforge/rapier3d/rapier.js?inline');
  bindings.__wbg_set_wasm(instance.exports);
  DartPhysics = (await import('../src/physics/dart')).DartPhysics;
});

const input = (overrides: Partial<FlightInput> = {}): FlightInput => ({
  yawDelta: 0,
  pitchDelta: 0,
  forward: 0,
  strafe: 0,
  ...overrides,
});

describe('DartPhysics', () => {
  it('reports engine power only for forward thrust and scales boost', async () => {
    const dart = await DartPhysics.create({}, makeSpiralGalaxy(7, { count: 256 }));
    try {
      dart.step(0.05, input({ forward: -1 }), 0);
      expect(dart.state().enginePower).toBe(0);

      dart.step(0.05, input({ forward: 1 }), 0);
      expect(dart.state().enginePower).toBeGreaterThan(0);

      for (let i = 0; i < 10; i++) dart.step(0.05, input({ forward: 1, boost: true }), 0);
      expect(dart.state().enginePower).toBeGreaterThan(0.6);
    } finally {
      dart.dispose();
    }
  });

  it('returns stable default active-star snapshot arrays', async () => {
    const dart = await DartPhysics.create({}, makeSpiralGalaxy(8, { count: 256 }));
    try {
      const first = dart.activeStars();
      const second = dart.activeStars();
      expect(second).toBe(first);
      expect(second.starIndices).toBe(first.starIndices);
      expect(second.positions).toBe(first.positions);
      expect(second.alphas).toBe(first.alphas);
      expect(first.starIndices).toHaveLength(96);
      expect(first.positions).toHaveLength(288);
      expect(first.alphas).toHaveLength(96);
    } finally {
      dart.dispose();
    }
  });
});
