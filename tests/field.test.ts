import { describe, expect, it } from 'vitest';
import { makeObstacleField, densityColor } from '../src/core/field';

const sum = (c: { r: number; g: number; b: number }) => c.r + c.g + c.b;

describe('obstacle field (pure, seeded)', () => {
  it('fills the central lattice minus the spawn origin', () => {
    const f = makeObstacleField(1981, { extent: 180, spacing: 90 });
    expect(f).toHaveLength(124); // 5^3 = 125 lattice points minus the origin
    // no obstacle sits at the spawn origin
    expect(f.some((o) => o.pos.x === 0 && o.pos.y === 0 && o.pos.z === 0)).toBe(false);
    // every position is on the 90-unit lattice within +/-180
    for (const o of f) {
      for (const c of [o.pos.x, o.pos.y, o.pos.z]) {
        expect(Math.abs(c % 90)).toBe(0);
        expect(Math.abs(c)).toBeLessThanOrEqual(180);
      }
    }
  });

  it('mass factor stays within the clamp range', () => {
    const f = makeObstacleField(7, { extent: 180, spacing: 90, massClampLo: 0.1, massClampHi: 8 });
    for (const o of f) {
      expect(o.mass).toBeGreaterThanOrEqual(0.1);
      expect(o.mass).toBeLessThanOrEqual(8);
    }
  });

  it('is deterministic for a given seed', () => {
    expect(makeObstacleField(42)).toEqual(makeObstacleField(42));
  });

  it('densityColor is monotonic: denser is darker', () => {
    expect(sum(densityColor(15))).toBeLessThan(sum(densityColor(0.2)));
    // mid density sits between the extremes
    const mid = sum(densityColor(7.5));
    expect(mid).toBeLessThan(sum(densityColor(0.2)));
    expect(mid).toBeGreaterThan(sum(densityColor(15)));
  });
});
