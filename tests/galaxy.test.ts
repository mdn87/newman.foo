import { describe, expect, it } from 'vitest';
import { makeSpiralGalaxy } from '../src/core/galaxy';

describe('makeSpiralGalaxy', () => {
  it('is deterministic for a given seed', () => {
    expect(makeSpiralGalaxy(7)).toEqual(makeSpiralGalaxy(7));
  });

  it('differs across seeds', () => {
    expect(makeSpiralGalaxy(1)).not.toEqual(makeSpiralGalaxy(2));
  });

  it('produces exact default spiral prototype counts', () => {
    const g = makeSpiralGalaxy(1981);
    expect(g.stars).toHaveLength(600);
    expect(g.planets).toHaveLength(12);
    expect(g.polyhedra).toHaveLength(18);
    expect(g.orbits).toHaveLength(20);
    expect(g.armGuides).toHaveLength(8);
  });

  it('covers the required play volume', () => {
    const g = makeSpiralGalaxy(1981);
    const all = [
      ...g.stars.map((s) => s.pos),
      ...g.planets.map((p) => p.pos),
      ...g.polyhedra.map((p) => p.pos),
    ];
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const zs = all.map((p) => p.z);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(160);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(80);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThanOrEqual(220);
  });

  it('marks three spiral arms among stars', () => {
    expect(new Set(makeSpiralGalaxy(1981).stars.map((s) => s.armIndex))).toEqual(new Set([0, 1, 2]));
  });
});
