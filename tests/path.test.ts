import { describe, expect, it } from 'vitest';
import { NODES } from '../src/content/nodes';
import { FlightPath, nodeParam } from '../src/core/path';

const path = new FlightPath(NODES.map((n) => n.pos));

describe('FlightPath', () => {
  it('passes through every node at its knot parameter', () => {
    NODES.forEach((n, i) => {
      const p = path.sample(nodeParam(i, NODES.length));
      expect(p.x).toBeCloseTo(n.pos.x, 6);
      expect(p.y).toBeCloseTo(n.pos.y, 6);
      expect(p.z).toBeCloseTo(n.pos.z, 6);
    });
  });

  it('is continuous (no jumps between fine samples)', () => {
    let prev = path.sample(0);
    for (let s = 1; s <= 1000; s++) {
      const p = path.sample(s / 1000);
      const d = Math.hypot(p.x - prev.x, p.y - prev.y, p.z - prev.z);
      expect(d).toBeLessThan(1.0); // total length ~150 units / 1000 samples
      prev = p;
    }
  });

  it('clamps out-of-range params', () => {
    expect(path.sample(-0.5)).toEqual(path.sample(0));
    expect(path.sample(1.5)).toEqual(path.sample(1));
  });
});
