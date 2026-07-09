// tests/galaxy.test.ts
import { describe, expect, it } from 'vitest';
import { makeSpiralGalaxy, GALAXY_MAX_POINTS, starMass } from '../src/core/galaxy';

describe('makeSpiralGalaxy', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    const a = makeSpiralGalaxy(7), b = makeSpiralGalaxy(7), c = makeSpiralGalaxy(8);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    expect(Array.from(a.positions)).not.toEqual(Array.from(c.positions));
  });

  it('returns parallel typed arrays of the requested count', () => {
    const f = makeSpiralGalaxy(1, { count: 5000 });
    expect(f.count).toBe(5000);
    expect(f.positions.length).toBe(5000 * 3);
    expect(f.sizes.length).toBe(5000);
    expect(f.alphas.length).toBe(5000);
    expect(f.colors.length).toBe(5000 * 3);
  });

  it('returns deterministic collision radius and mass arrays parallel to the stars', () => {
    const a = makeSpiralGalaxy(1981, { count: 1000 });
    const b = makeSpiralGalaxy(1981, { count: 1000 });
    expect(a.collisionRadii).toHaveLength(a.count);
    expect(a.masses).toHaveLength(a.count);
    expect(Array.from(a.collisionRadii)).toEqual(Array.from(b.collisionRadii));
    expect(Array.from(a.masses)).toEqual(Array.from(b.masses));
    for (let i = 0; i < a.count; i++) {
      expect(a.collisionRadii[i]).toBeGreaterThanOrEqual(1.2);
      expect(a.collisionRadii[i]).toBeLessThanOrEqual(3.2);
      expect(a.masses[i]).toBeGreaterThanOrEqual(0.1);
      expect(a.masses[i]).toBeLessThanOrEqual(8);
    }
  });

  it('makes darker stars denser at equal visual size', () => {
    expect(starMass(2, 1)).toBeGreaterThan(starMass(2, 0));
    expect(starMass(3, 0.5)).toBeGreaterThan(starMass(1, 0.5));
    expect(starMass(1, 1)).toBeGreaterThan(1);
  });

  it('produces a flat disk (thin in y) spanning a wide radius — a galaxy, not a ball', () => {
    const f = makeSpiralGalaxy(2026, { count: 8000, radius: 200, thickness: 10 });
    let maxR = 0, minR = Infinity, maxY = 0;
    for (let i = 0; i < f.count; i++) {
      const x = f.positions[i * 3]!, y = f.positions[i * 3 + 1]!, z = f.positions[i * 3 + 2]!;
      const r = Math.hypot(x, z);
      maxR = Math.max(maxR, r); minR = Math.min(minR, r); maxY = Math.max(maxY, Math.abs(y));
    }
    expect(maxR).toBeGreaterThan(120);   // arms reach out
    expect(minR).toBeLessThan(20);       // dense core near center
    expect(maxY).toBeLessThan(maxR * 0.4); // clearly flattened in y
  });

  it('keeps all outputs finite and clamps to the point cap', () => {
    const f = makeSpiralGalaxy(3, { count: 999999 });
    expect(f.count).toBe(GALAXY_MAX_POINTS);
    for (const v of f.positions) expect(Number.isFinite(v)).toBe(true);
    for (const a of f.alphas) { expect(a).toBeGreaterThan(0); expect(a).toBeLessThanOrEqual(1); }
  });
});
