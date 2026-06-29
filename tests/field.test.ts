import { describe, expect, it } from 'vitest';
import { makeObstacleField, densityColor, obstacleMass } from '../src/core/field';

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

  it('mass: a small super-dense core out-masses the ship and a large light object', () => {
    const smallDense = obstacleMass(2, 15);
    const bigLight = obstacleMass(9, 0.2);
    expect(smallDense).toBeGreaterThan(1);          // heavier than the ship (mass 1)
    expect(smallDense).toBeGreaterThan(bigLight);   // density can dominate size
  });

  it('mass: both size and density raise it; extremes are heaviest/lightest', () => {
    expect(obstacleMass(9, 15)).toBeGreaterThan(obstacleMass(2, 15));  // bigger -> heavier (same density)
    expect(obstacleMass(9, 15)).toBeGreaterThan(obstacleMass(9, 0.2)); // denser -> heavier (same size)
    const corners = [obstacleMass(2, 0.2), obstacleMass(2, 15), obstacleMass(9, 0.2), obstacleMass(9, 15)];
    expect(Math.max(...corners)).toBe(obstacleMass(9, 15));
    expect(Math.min(...corners)).toBe(obstacleMass(2, 0.2));
  });

  it('mass stays within the clamp range across the field', () => {
    for (const o of makeObstacleField(7, { extent: 180, spacing: 90 })) {
      expect(o.mass).toBeGreaterThanOrEqual(0.1);
      expect(o.mass).toBeLessThanOrEqual(8);
    }
  });
});
