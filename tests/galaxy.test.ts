import { describe, expect, it } from 'vitest';
import { makeGalaxy, makeSpiralGalaxy } from '../src/core/galaxy';

describe('makeGalaxy', () => {
  it('is deterministic for a given seed', () => {
    expect(makeGalaxy(7)).toEqual(makeGalaxy(7));
  });

  it('differs across seeds', () => {
    expect(makeGalaxy(1)).not.toEqual(makeGalaxy(2));
  });

  it('produces the requested counts of each kind', () => {
    const f = makeGalaxy(1981, { bubbles: 20, sparkles: 10, clouds: 3, planets: 5, arcs: 4 });
    const byKind = (k: string) => f.pieces.filter((p) => p.kind === k).length;
    expect(byKind('bubble')).toBe(20);
    expect(byKind('sparkle')).toBe(10);
    expect(byKind('cloud')).toBe(3);
    expect(byKind('planet')).toBe(5);
    expect(f.arcs).toHaveLength(4);
  });

  it('keeps big pieces (clouds, planets) out of the flight corridor', () => {
    const f = makeGalaxy(42, { bubbles: 0, sparkles: 0, clouds: 40, planets: 40, arcs: 0 });
    for (const p of f.pieces) {
      expect(Math.hypot(p.pos.x, p.pos.y)).toBeGreaterThanOrEqual(12);
    }
  });

  it('builds arcs as multi-point polylines', () => {
    const f = makeGalaxy(3, { arcs: 2 });
    for (const arc of f.arcs) {
      expect(arc.points.length).toBeGreaterThan(2);
      for (const pt of arc.points) {
        expect(Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z)).toBe(true);
      }
    }
  });
});

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
