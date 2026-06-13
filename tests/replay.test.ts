import { describe, expect, it } from 'vitest';
import { TravelMachine } from '../src/core/travel';
import { WheelIntent } from '../src/core/intent';

type Event =
  | { kind: 'wheel'; deltaY: number; atMs: number }
  | { kind: 'key'; dir: 1 | -1; atMs: number }
  | { kind: 'jump'; to: number; atMs: number }
  | { kind: 'tick'; dt: number };

function replay(events: Event[]): { state: unknown; arrivals: number[] } {
  const m = new TravelMachine(6, { transitDuration: 1.5 });
  const w = new WheelIntent();
  const arrivals: number[] = [];
  m.onArrive((i) => arrivals.push(i));
  for (const e of events) {
    if (e.kind === 'wheel') {
      const dir = w.feed(e.deltaY, e.atMs);
      if (dir === 1) m.advance();
      if (dir === -1) m.back();
    } else if (e.kind === 'key') {
      if (e.dir === 1) m.advance(); else m.back();
    } else if (e.kind === 'jump') {
      m.jumpTo(e.to);
    } else {
      m.tick(e.dt);
    }
  }
  return { state: m.state, arrivals };
}

describe('replay', () => {
  it('a recorded session always lands in the same place', () => {
    const session: Event[] = [
      { kind: 'wheel', deltaY: 60, atMs: 100 },   // -> transit 0->1
      { kind: 'wheel', deltaY: 60, atMs: 160 },   // ignored (in transit)
      { kind: 'tick', dt: 1.5 },                  // arrive 1
      { kind: 'key', dir: 1, atMs: 2000 },        // -> transit 1->2
      { kind: 'tick', dt: 0.75 },
      { kind: 'tick', dt: 0.75 },                 // arrive 2
      { kind: 'jump', to: 5, atMs: 4000 },        // -> transit 2->5
      { kind: 'tick', dt: 1.5 },                  // arrive 5
      { kind: 'key', dir: -1, atMs: 6000 },       // -> transit 5->4
      { kind: 'tick', dt: 1.5 },                  // arrive 4
    ];
    const a = replay(session);
    const b = replay(session);
    expect(a).toEqual(b);
    expect(a.state).toEqual({ kind: 'atNode', index: 4 });
    expect(a.arrivals).toEqual([1, 2, 5, 4]);
  });
});
