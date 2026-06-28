import { describe, expect, it } from 'vitest';
import { makeDotGrid, GRID_MAX_POINTS } from '../src/core/grid';

describe('makeDotGrid', () => {
  it('builds a cubic lattice of (2n+1)^3 points on the spacing', () => {
    const g = makeDotGrid({ spacing: 50, extent: 100 }); // n = 2 -> 5^3 = 125
    expect(g).toBeInstanceOf(Float32Array);
    expect(g.length).toBe(125 * 3);
    for (let i = 0; i < g.length; i++) {
      expect(Number.isFinite(g[i]!)).toBe(true);
      expect(Math.abs(g[i]!)).toBeLessThanOrEqual(100);
      expect(Number.isInteger(g[i]! / 50)).toBe(true); // multiple of spacing (-0-safe)
    }
  });

  it('is deterministic', () => {
    expect(Array.from(makeDotGrid({ spacing: 40, extent: 80 })))
      .toEqual(Array.from(makeDotGrid({ spacing: 40, extent: 80 })));
  });

  it('refuses a lattice denser than the cap', () => {
    expect(() => makeDotGrid({ spacing: 1, extent: 1000 })).toThrow(/too dense/);
    const defaults = makeDotGrid();
    expect(defaults.length / 3).toBeLessThanOrEqual(GRID_MAX_POINTS);
  });
});
