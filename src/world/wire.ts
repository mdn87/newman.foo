import type { PlayerInput } from '../core/player';
import { Hud } from '../hud/hud';
import type { MountOpts, WorldCleanup } from './mount';

const MAX_DT_SECONDS = 0.05;

interface WiredScene {
  domElement: HTMLCanvasElement;
  frame(dt: number): void;
  setInput(input: PlayerInput): void;
  steer(delta: { dx: number; dy: number }): void;
}

export function wireWorld(scene: WiredScene, opts: MountOpts): WorldCleanup {
  const hud = new Hud(document.getElementById('hud-root')!, opts.site);
  const canvas = scene.domElement;
  const keys = new Set<string>();
  const axis = (positive: string[], negative: string[]) =>
    (positive.some((k) => keys.has(k)) ? 1 : 0)
    - (negative.some((k) => keys.has(k)) ? 1 : 0);
  const input = (): PlayerInput => ({
    forward: axis(['w', 'W', 'ArrowUp'], ['s', 'S', 'ArrowDown']),
    right: axis(['d', 'D', 'ArrowRight'], ['a', 'A', 'ArrowLeft']),
    up: axis([' ', 'Spacebar'], ['Shift', 'ShiftLeft', 'ShiftRight']),
  });

  const onKeydown = (event: KeyboardEvent) => {
    keys.add(event.key);
  };
  const onKeyup = (event: KeyboardEvent) => {
    keys.delete(event.key);
  };
  addEventListener('keydown', onKeydown);
  addEventListener('keyup', onKeyup);

  const onWheel = () => {};
  addEventListener('wheel', onWheel, { passive: true });

  const onClick = () => {};
  canvas.addEventListener('click', onClick);

  let dragging = false;
  let lastPointer: { x: number; y: number } | null = null;
  const onPointerdown = (event: PointerEvent) => {
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
  };
  const onPointermove = (event: PointerEvent) => {
    if (!dragging || !lastPointer) return;
    const next = { x: event.clientX, y: event.clientY };
    scene.steer({ dx: next.x - lastPointer.x, dy: next.y - lastPointer.y });
    lastPointer = next;
  };
  const stopDrag = () => {
    dragging = false;
    lastPointer = null;
  };
  canvas.addEventListener('pointerdown', onPointerdown);
  canvas.addEventListener('pointermove', onPointermove);
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  let last = performance.now();
  let frameId = 0;
  let stopped = false;
  const loop = (now: number) => {
    if (stopped) return;
    const dt = Math.min(MAX_DT_SECONDS, Math.max(0, (now - last) / 1000));
    last = now;
    const currentInput = input();
    scene.setInput(currentInput);
    scene.frame(dt);
    hud.setStatus(statusFor(currentInput));
    frameId = requestAnimationFrame(loop);
  };
  frameId = requestAnimationFrame(loop);

  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frameId);
    removeEventListener('keydown', onKeydown);
    removeEventListener('keyup', onKeyup);
    removeEventListener('wheel', onWheel);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('pointerdown', onPointerdown);
    canvas.removeEventListener('pointermove', onPointermove);
    canvas.removeEventListener('pointerup', stopDrag);
    canvas.removeEventListener('pointercancel', stopDrag);
    hud.dispose();
  };
}

function statusFor(input: PlayerInput): string {
  if (input.forward || input.right || input.up) return 'drifting';
  return 'spiral drift prototype';
}
