import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE } from '../src/content/nodes';

const hudMocks = vi.hoisted(() => {
  const instances: Array<{
    root: unknown;
    site: unknown;
    setStatus: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }> = [];

  const Hud = vi.fn(function (
    this: {
      root: unknown;
      site: unknown;
      setStatus: ReturnType<typeof vi.fn>;
      dispose: ReturnType<typeof vi.fn>;
    },
    root: unknown,
    site: unknown,
  ) {
    this.root = root;
    this.site = site;
    this.setStatus = vi.fn();
    this.dispose = vi.fn();
    instances.push(this);
  });

  return { Hud, instances };
});

vi.mock('../src/hud/hud', () => ({ Hud: hudMocks.Hud }));

import { wireWorld } from '../src/world/wire';

type Listener = (event: Record<string, unknown>) => void;
type FakeScene = {
  domElement: HTMLCanvasElement;
  frame: ReturnType<typeof vi.fn>;
  setInput: ReturnType<typeof vi.fn>;
  steer: ReturnType<typeof vi.fn>;
};

function installAnimationFrame() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  });
  const cancelAnimationFrame = vi.fn((id: number) => {
    callbacks.delete(id);
  });
  vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);
  return { callbacks, requestAnimationFrame, cancelAnimationFrame };
}

function runFrame(callbacks: Map<number, FrameRequestCallback>, id: number, now: number) {
  const callback = callbacks.get(id);
  if (!callback) throw new Error(`missing frame ${id}`);
  callbacks.delete(id);
  callback(now);
}

function makeEventTarget() {
  const listeners = new Map<string, Set<Listener>>();
  const listenerFns = new Map<EventListenerOrEventListenerObject, Listener>();
  const listenerFn = (listener: EventListenerOrEventListenerObject): Listener => {
    const existing = listenerFns.get(listener);
    if (existing) return existing;
    const fn: Listener = typeof listener === 'function'
      ? (event) => listener(event as unknown as Event)
      : (event) => listener.handleEvent(event as unknown as Event);
    listenerFns.set(listener, fn);
    return fn;
  };
  const addEventListener = vi.fn((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) => {
    const signal = typeof options === 'object' ? options.signal : undefined;
    if (signal?.aborted) return;
    const fn = listenerFn(listener);
    const set = listeners.get(type) ?? new Set<Listener>();
    set.add(fn);
    listeners.set(type, set);
    signal?.addEventListener('abort', () => set.delete(fn), { once: true });
  });
  const removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const set = listeners.get(type);
    if (!set) return;
    set.delete(listenerFn(listener));
  });
  const dispatch = (type: string, event: Record<string, unknown> = {}) => {
    for (const listener of [...(listeners.get(type) ?? [])]) listener(event);
  };
  const listenerCount = (type?: string) => {
    if (type) return listeners.get(type)?.size ?? 0;
    return [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
  };
  return { addEventListener, removeEventListener, dispatch, listenerCount };
}

function installDom(pathname = '/', search = '?mode=world') {
  const windowTarget = makeEventTarget();
  const canvasTarget = makeEventTarget();
  const hudRoot = { id: 'hud-root' };
  const location = { pathname, search };
  const history = {
    pushState: vi.fn((_state: unknown, _title: string, url: string) => {
      const parsed = new URL(url, 'https://newman.foo');
      location.pathname = parsed.pathname;
      location.search = parsed.search;
    }),
  };
  const document = {
    getElementById: vi.fn((id: string) => id === 'hud-root' ? hudRoot : null),
  };

  vi.stubGlobal('document', document);
  vi.stubGlobal('location', location);
  vi.stubGlobal('history', history);
  vi.stubGlobal('addEventListener', windowTarget.addEventListener);
  vi.stubGlobal('removeEventListener', windowTarget.removeEventListener);

  const canvas = {
    addEventListener: canvasTarget.addEventListener,
    removeEventListener: canvasTarget.removeEventListener,
  } as unknown as HTMLCanvasElement;

  return { canvas, canvasTarget, history, hudRoot, location, windowTarget };
}

function makeScene(canvas: HTMLCanvasElement): FakeScene {
  return {
    frame: vi.fn(),
    setInput: vi.fn(),
    steer: vi.fn(),
    domElement: canvas,
  };
}

describe('wireWorld', () => {
  beforeEach(() => {
    hudMocks.instances.length = 0;
    hudMocks.Hud.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keydown and keyup update input on frame', () => {
    const { callbacks } = installAnimationFrame();
    const { canvas, windowTarget } = installDom();
    const scene = makeScene(canvas);

    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    windowTarget.dispatch('keydown', { key: 'w' });
    windowTarget.dispatch('keydown', { key: 'ArrowRight' });
    windowTarget.dispatch('keydown', { key: ' ' });
    runFrame(callbacks, 1, performance.now() + 16);

    expect(scene.setInput).toHaveBeenLastCalledWith({ forward: 1, right: 1, up: 1 });

    windowTarget.dispatch('keyup', { key: 'w' });
    windowTarget.dispatch('keyup', { key: 'ArrowRight' });
    windowTarget.dispatch('keyup', { key: ' ' });
    windowTarget.dispatch('keydown', { key: 'Shift' });
    runFrame(callbacks, 2, performance.now() + 32);

    expect(scene.setInput).toHaveBeenLastCalledWith({ forward: 0, right: 0, up: -1 });
    cleanup();
  });

  it('wheel and click never navigate', () => {
    const { callbacks } = installAnimationFrame();
    const { canvas, canvasTarget, history, windowTarget } = installDom();
    const scene = makeScene(canvas);

    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    windowTarget.dispatch('wheel', { deltaY: 120 });
    canvasTarget.dispatch('click', { clientX: 24, clientY: 48 });
    runFrame(callbacks, 1, performance.now() + 16);

    expect(history.pushState).not.toHaveBeenCalled();
    cleanup();
  });

  it('passive pointer move without active drag does not steer', () => {
    installAnimationFrame();
    const { canvas, canvasTarget } = installDom();
    const scene = makeScene(canvas);
    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    canvasTarget.dispatch('pointermove', { clientX: 20, clientY: 30, pointerType: 'mouse' });

    expect(scene.steer).not.toHaveBeenCalled();
    cleanup();
  });

  it('steers only while pointer drag is active', () => {
    const { canvas, canvasTarget } = installDom();
    installAnimationFrame();
    const scene = makeScene(canvas);
    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    canvasTarget.dispatch('pointermove', { clientX: 20, clientY: 30, pointerType: 'mouse' });
    expect(scene.steer).not.toHaveBeenCalled();

    canvasTarget.dispatch('pointerdown', { clientX: 20, clientY: 30, pointerType: 'mouse' });
    canvasTarget.dispatch('pointermove', { clientX: 35, clientY: 18, pointerType: 'mouse' });
    expect(scene.steer).toHaveBeenLastCalledWith({ dx: 15, dy: -12 });

    canvasTarget.dispatch('pointerup', { clientX: 35, clientY: 18, pointerType: 'mouse' });
    canvasTarget.dispatch('pointermove', { clientX: 55, clientY: 28, pointerType: 'mouse' });
    expect(scene.steer).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('stops steering when pointerup happens outside the canvas', () => {
    const { canvas, canvasTarget, windowTarget } = installDom();
    installAnimationFrame();
    const scene = makeScene(canvas);
    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    canvasTarget.dispatch('pointerdown', { clientX: 20, clientY: 30, pointerType: 'mouse' });
    canvasTarget.dispatch('pointermove', { clientX: 35, clientY: 18, pointerType: 'mouse' });
    expect(scene.steer).toHaveBeenCalledTimes(1);

    windowTarget.dispatch('pointerup', { clientX: 35, clientY: 18, pointerType: 'mouse' });
    canvasTarget.dispatch('pointermove', { clientX: 55, clientY: 28, pointerType: 'mouse' });

    expect(scene.steer).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('supports touch drag steering through pointer events', () => {
    const { canvas, canvasTarget } = installDom();
    installAnimationFrame();
    const scene = makeScene(canvas);
    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    canvasTarget.dispatch('pointerdown', { clientX: 5, clientY: 5, pointerType: 'touch' });
    canvasTarget.dispatch('pointermove', { clientX: 10, clientY: 8, pointerType: 'touch' });
    expect(scene.steer).toHaveBeenCalledWith({ dx: 5, dy: 3 });
    cleanup();
  });

  it('returns an idempotent cleanup that cancels raf, removes listeners, and disposes HUD', () => {
    const { callbacks, cancelAnimationFrame, requestAnimationFrame } = installAnimationFrame();
    const { canvas, canvasTarget, hudRoot, windowTarget } = installDom();
    const scene = makeScene(canvas);

    const cleanup = wireWorld(scene, { site: SITE, reducedMotion: false });

    expect(hudMocks.Hud).toHaveBeenCalledWith(hudRoot, SITE);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(windowTarget.listenerCount()).toBe(5);
    expect(canvasTarget.listenerCount()).toBe(5);

    runFrame(callbacks, 1, performance.now() + 16);
    expect(scene.frame).toHaveBeenCalledWith(expect.any(Number));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    cleanup();
    cleanup();

    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(2);
    expect(hudMocks.instances[0]!.dispose).toHaveBeenCalledTimes(1);
    expect(windowTarget.listenerCount()).toBe(0);
    expect(canvasTarget.listenerCount()).toBe(0);
  });
});
