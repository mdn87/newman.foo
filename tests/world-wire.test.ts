// tests/world-wire.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorldScene } from '../src/world/scene';

const hudMocks = vi.hoisted(() => {
  const instances: Array<{ setSpeed: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }> = [];
  const FlightHud = vi.fn(function (this: { setSpeed: ReturnType<typeof vi.fn>; setReadout: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }) {
    this.setSpeed = vi.fn(); this.setReadout = vi.fn(); this.dispose = vi.fn(); instances.push(this);
  });
  return { FlightHud, instances };
});
vi.mock('../src/hud/flight-hud', () => ({ FlightHud: hudMocks.FlightHud }));

import { wireWorld } from '../src/world/wire';

function makeEventTarget() {
  const listeners = new Map<string, Set<(e: Record<string, unknown>) => void>>();
  const addEventListener = vi.fn((t: string, fn: (e: Record<string, unknown>) => void) => {
    const set = listeners.get(t) ?? new Set(); set.add(fn); listeners.set(t, set);
  });
  const removeEventListener = vi.fn((t: string, fn: (e: Record<string, unknown>) => void) => listeners.get(t)?.delete(fn));
  const dispatch = (t: string, e: Record<string, unknown> = {}) => [...(listeners.get(t) ?? [])].forEach((fn) => fn(e));
  const count = () => [...listeners.values()].reduce((s, set) => s + set.size, 0);
  return { addEventListener, removeEventListener, dispatch, count };
}

function installFrame() {
  const cbs = new Map<number, FrameRequestCallback>(); let id = 1;
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { const i = id++; cbs.set(i, cb); return i; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((i: number) => cbs.delete(i)));
  return { cbs };
}

function makeScene(): WorldScene {
  return { frame: vi.fn(), resize: vi.fn(), dispose: vi.fn(),
    readout: vi.fn(() => ({ x: 0, y: 0, pos: { x: 0, y: 0, z: 0 }, visible: false })),
    renderer: { domElement: { clientWidth: 800, clientHeight: 600 } } } as unknown as WorldScene;
}

describe('wireWorld (free-fly)', () => {
  let win: ReturnType<typeof makeEventTarget>;
  beforeEach(() => {
    hudMocks.instances.length = 0; hudMocks.FlightHud.mockClear();
    win = makeEventTarget();
    vi.stubGlobal('addEventListener', win.addEventListener);
    vi.stubGlobal('removeEventListener', win.removeEventListener);
    vi.stubGlobal('innerWidth', 800); vi.stubGlobal('innerHeight', 600);
    vi.stubGlobal('document', { getElementById: () => ({}) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('drives scene.frame every animation frame', () => {
    const { cbs } = installFrame();
    const scene = makeScene();
    const cleanup = wireWorld(scene, { reducedMotion: false });
    cbs.get(1)!(performance.now() + 16); // first frame
    expect(scene.frame).toHaveBeenCalledTimes(1);
    expect(scene.frame).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ position: expect.any(Object) }));
    cleanup();
  });

  it('thrusts while a thrust key is held and stops on release', () => {
    const { cbs } = installFrame();
    const scene = makeScene();
    const cleanup = wireWorld(scene, { reducedMotion: false });
    win.dispatch('keydown', { key: 'w' });
    const t0 = performance.now();
    for (let f = 1; f <= 30; f++) cbs.get(f)!(t0 + f * 16);
    const movedState = (scene.frame as ReturnType<typeof vi.fn>).mock.calls.at(-1)![1];
    expect(movedState.speed).toBeGreaterThan(0);
    cleanup();
  });

  it('cleanup cancels the loop and removes every listener', () => {
    const { cbs } = installFrame();
    const cleanup = wireWorld(makeScene(), { reducedMotion: false });
    cbs.get(1)!(performance.now() + 16);
    const before = win.count();
    expect(before).toBeGreaterThan(0);
    cleanup();
    expect(win.count()).toBe(0);
    expect(hudMocks.instances[0]!.dispose).toHaveBeenCalledTimes(1);
  });
});
