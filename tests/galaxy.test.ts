import { describe, expect, it } from 'vitest';
import { makeGalaxy, GALAXY_KINDS, KIND_CLEARANCE } from '../src/core/galaxy';

describe('makeGalaxy', () => {
  it('is deterministic for a given seed', () => {
    expect(makeGalaxy(7)).toEqual(makeGalaxy(7));
  });

  it('differs across seeds', () => {
    expect(makeGalaxy(1)).not.toEqual(makeGalaxy(2));
  });

  it('only emits abstract kinds — no ringed planets', () => {
    const kinds = new Set(makeGalaxy(1981).pieces.map((p) => p.kind));
    for (const k of kinds) expect(GALAXY_KINDS).toContain(k);
    expect(kinds.has('planet' as never)).toBe(false);
  });

  it('produces the requested counts of each kind', () => {
    const f = makeGalaxy(1981, { counts: { bubble: 20, sparkle: 10, cloud: 3, hexagon: 5 }, arcs: 4 });
    const byKind = (k: string) => f.pieces.filter((p) => p.kind === k).length;
    expect(byKind('bubble')).toBe(20);
    expect(byKind('sparkle')).toBe(10);
    expect(byKind('cloud')).toBe(3);
    expect(byKind('hexagon')).toBe(5);
    expect(f.arcs).toHaveLength(4);
  });

  it('keeps every piece clear of the corridor by its own kind clearance', () => {
    const counts = Object.fromEntries(GALAXY_KINDS.map((k) => [k, 40]));
    const f = makeGalaxy(42, { counts });
    for (const p of f.pieces) {
      expect(Math.hypot(p.pos.x, p.pos.y)).toBeGreaterThanOrEqual(KIND_CLEARANCE[p.kind]);
    }
  });

  it('spreads pieces across a wide range of radii (not a blob)', () => {
    const radii = makeGalaxy(2026).pieces.map((p) => Math.hypot(p.pos.x, p.pos.y));
    expect(Math.max(...radii)).toBeGreaterThan(25);
    expect(Math.min(...radii)).toBeLessThan(15);
  });

  it('winds the arms into a real spiral — arcs sweep in angle, not a flat radial fan', () => {
    // Each arc spine should rotate substantially from inner to outer end. A
    // flattened field (no radial winding + no helical twist) would barely sweep,
    // so this guards against the spiral silently collapsing into spokes.
    const f = makeGalaxy(2026, { arcs: 3 });
    const sweeps = f.arcs.map((arc) => {
      const a0 = Math.atan2(arc.points[0]!.y, arc.points[0]!.x);
      const aN = Math.atan2(arc.points.at(-1)!.y, arc.points.at(-1)!.x);
      let d = Math.abs(aN - a0);
      if (d > Math.PI) d = 2 * Math.PI - d; // shortest angular distance
      return d;
    });
    expect(Math.max(...sweeps)).toBeGreaterThan(0.5); // radians of winding
  });

  it('builds arcs as multi-point polylines', () => {
    const f = makeGalaxy(3, { arcs: 2 });
    expect(f.arcs).toHaveLength(2);
    for (const arc of f.arcs) {
      expect(arc.points.length).toBeGreaterThan(2);
      for (const pt of arc.points) {
        expect(Number.isFinite(pt.x) && Number.isFinite(pt.y) && Number.isFinite(pt.z)).toBe(true);
      }
    }
  });
});
