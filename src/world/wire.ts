// src/world/wire.ts
import { DartPhysics } from '../physics/dart';
import { FlightHud } from '../hud/flight-hud';
import type { WorldScene } from './scene';

const MAX_DT = 0.05;
const STEER_RATE = 0.009; // drag-steer: rad/s of turn per px of drag offset from the press point

export async function wireWorld(scene: WorldScene, _opts: { reducedMotion: boolean }): Promise<() => void> {
  const dart = await DartPhysics.create({ bound: 720, boundPush: 220 });
  const hud = new FlightHud(document.getElementById('hud-root')!);

  // Drag-to-fly: while the left button is held, the cursor's offset from where it
  // was pressed steers like a flight stick — drag left -> nose left, drag up -> up.
  let dragging = false, pressX = 0, pressY = 0, dragX = 0, dragY = 0;
  let rightHeld = false;            // right button -> forward thrust
  const keys = new Set<string>();   // movement keys currently down

  const norm = (k: string) => (k.length === 1 ? k.toLowerCase() : k);
  const has = (...k: string[]) => k.some((x) => keys.has(x));
  const forward = () => (has('w', 'ArrowUp') ? 1 : 0) - (has('s', 'ArrowDown') ? 1 : 0);
  const strafe = () => (has('d', 'ArrowRight') ? 1 : 0) - (has('a', 'ArrowLeft') ? 1 : 0);
  const boost = () => rightHeld;

  const onPointerMove = (e: { clientX: number; clientY: number }) => {
    if (dragging) { dragX = e.clientX - pressX; dragY = e.clientY - pressY; }
  };
  const onPointerDown = (e: { button?: number; clientX: number; clientY: number }) => {
    if ((e.button ?? 0) === 0) { dragging = true; pressX = e.clientX; pressY = e.clientY; dragX = 0; dragY = 0; }
    else if (e.button === 2) rightHeld = true;
  };
  const onPointerUp = (e: { button?: number }) => {
    if ((e.button ?? 0) === 0) { dragging = false; dragX = 0; dragY = 0; }
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
    // Steer only while dragging: drag left (dragX<0) -> yaw+ -> nose to screen-left.
    const yawDelta = dragging ? -dragX * STEER_RATE * dt : 0;
    const pitchDelta = dragging ? -dragY * STEER_RATE * dt : 0;
    dart.step(dt, { yawDelta, pitchDelta, forward: forward(), strafe: strafe(), boost: boost() });
    scene.frame(dt, dart.state());
    hud.setSpeed(dart.state().speed);
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
    dart.dispose();
  };
}
