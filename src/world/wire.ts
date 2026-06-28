// src/world/wire.ts
import { FlightMachine } from '../core/flight';
import { FlightHud } from '../hud/flight-hud';
import type { WorldScene } from './scene';

const MAX_DT = 0.05;
const LOOK_RATE = 5.0;   // passive mouse-look: rad/s at full screen offset (tracks the pointer closely)
const DRAG_SENS = 0.009; // left-drag swing: rad per px of drag

export function wireWorld(scene: WorldScene, _opts: { reducedMotion: boolean }): () => void {
  const flight = new FlightMachine({ bound: 720, boundPush: 220 });
  const hud = new FlightHud(document.getElementById('hud-root')!);

  let aimX = 0, aimY = 0;            // passive pointer offset from center (-1..1)
  let dragDX = 0, dragDY = 0;        // accumulated left-drag deltas (consumed each frame)
  let dragging = false;             // left button held
  let rightHeld = false;            // right button -> forward thrust
  const keys = new Set<string>();   // movement keys currently down

  const norm = (k: string) => (k.length === 1 ? k.toLowerCase() : k);
  const has = (...k: string[]) => k.some((x) => keys.has(x));
  const forward = () => (has('w', 'ArrowUp') || rightHeld ? 1 : 0) - (has('s', 'ArrowDown') ? 1 : 0);
  const strafe = () => (has('d', 'ArrowRight') ? 1 : 0) - (has('a', 'ArrowLeft') ? 1 : 0);

  const onPointerMove = (e: { clientX: number; clientY: number; movementX?: number; movementY?: number }) => {
    const w = innerWidth, h = innerHeight;
    aimX = Math.max(-1, Math.min(1, (e.clientX - w / 2) / (w / 2)));
    aimY = Math.max(-1, Math.min(1, (e.clientY - h / 2) / (h / 2)));
    if (dragging) { dragDX += e.movementX ?? 0; dragDY += e.movementY ?? 0; } // swing the view
  };
  const onPointerDown = (e: { button?: number }) => {
    if ((e.button ?? 0) === 0) dragging = true;
    else if (e.button === 2) rightHeld = true;
  };
  const onPointerUp = (e: { button?: number }) => {
    if ((e.button ?? 0) === 0) dragging = false;
    else if (e.button === 2) rightHeld = false;
  };
  const onContextMenu = (e: { preventDefault?: () => void }) => e.preventDefault?.(); // right-click = thrust, no menu

  const isMoveKey = (k: string) => ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k);
  const onKeyDown = (e: { key: string; preventDefault?: () => void }) => {
    const k = norm(e.key);
    if (isMoveKey(k)) { keys.add(k); e.preventDefault?.(); }
    else if (k === 'Escape' || k === 'l') location.href = `?mode=list`; // escape hatch to the list
  };
  const onKeyUp = (e: { key: string }) => { keys.delete(norm(e.key)); };

  addEventListener('pointermove', onPointerMove as unknown as EventListener);
  addEventListener('pointerdown', onPointerDown as unknown as EventListener);
  addEventListener('pointerup', onPointerUp as unknown as EventListener);
  addEventListener('contextmenu', onContextMenu as unknown as EventListener);
  addEventListener('keydown', onKeyDown as unknown as EventListener);
  addEventListener('keyup', onKeyUp as unknown as EventListener);

  let last = performance.now(), frameId = 0, stopped = false;
  const loop = (now: number) => {
    if (stopped) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    // Look = gentle passive offset (rate*dt) + deliberate drag swing (delta).
    const yawDelta = aimX * LOOK_RATE * dt + dragDX * DRAG_SENS;
    const pitchDelta = -aimY * LOOK_RATE * dt - dragDY * DRAG_SENS;
    dragDX = 0; dragDY = 0;
    flight.tick(dt, { yawDelta, pitchDelta, forward: forward(), strafe: strafe() });
    scene.frame(dt, flight.state);
    hud.setSpeed(flight.state.speed);
    hud.setReadout(scene.readout());
    frameId = requestAnimationFrame(loop);
  };
  frameId = requestAnimationFrame(loop);

  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frameId);
    removeEventListener('pointermove', onPointerMove as unknown as EventListener);
    removeEventListener('pointerdown', onPointerDown as unknown as EventListener);
    removeEventListener('pointerup', onPointerUp as unknown as EventListener);
    removeEventListener('contextmenu', onContextMenu as unknown as EventListener);
    removeEventListener('keydown', onKeyDown as unknown as EventListener);
    removeEventListener('keyup', onKeyUp as unknown as EventListener);
    hud.dispose();
  };
}
