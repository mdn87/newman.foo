// src/world/wire.ts
import { FlightMachine } from '../core/flight';
import { FlightHud } from '../hud/flight-hud';
import type { WorldScene } from './scene';

const MAX_DT = 0.05;

export function wireWorld(scene: WorldScene, _opts: { reducedMotion: boolean }): () => void {
  const flight = new FlightMachine();
  const hud = new FlightHud(document.getElementById('hud-root')!);
  let aimX = 0, aimY = 0;
  // Track each thrust source independently so releasing one (e.g. W) doesn't
  // cut thrust while another (mouse) is still held.
  let keyThrust = false, pointerThrust = false;
  const thrust = () => (keyThrust || pointerThrust ? 1 : 0);

  const onPointerMove = (e: { clientX: number; clientY: number }) => {
    const w = innerWidth, h = innerHeight;
    aimX = Math.max(-1, Math.min(1, (e.clientX - w / 2) / (w / 2)));
    aimY = Math.max(-1, Math.min(1, (e.clientY - h / 2) / (h / 2)));
  };
  const isThrustKey = (k: string) => k === 'w' || k === 'W' || k === ' ' || k === 'ArrowUp';
  const onKeyDown = (e: { key: string; preventDefault?: () => void }) => {
    if (isThrustKey(e.key)) { keyThrust = true; e.preventDefault?.(); }
    else if (e.key === 'Escape' || e.key === 'l' || e.key === 'L') {
      location.href = `?mode=list`; // escape hatch back to the portfolio list
    }
  };
  const onKeyUp = (e: { key: string }) => { if (isThrustKey(e.key)) keyThrust = false; };
  const onPointerDown = (e: { button?: number }) => { if ((e.button ?? 0) === 0) pointerThrust = true; };
  const onPointerUp = () => { pointerThrust = false; };

  addEventListener('pointermove', onPointerMove as unknown as EventListener);
  addEventListener('keydown', onKeyDown as unknown as EventListener);
  addEventListener('keyup', onKeyUp as unknown as EventListener);
  addEventListener('pointerdown', onPointerDown as unknown as EventListener);
  addEventListener('pointerup', onPointerUp as unknown as EventListener);

  let last = performance.now(), frameId = 0, stopped = false;
  const loop = (now: number) => {
    if (stopped) return;
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    flight.tick(dt, { aimX, aimY, thrust: thrust() });
    scene.frame(dt, flight.state);
    hud.setSpeed(flight.state.speed);
    hud.setReadout(scene.readout());      // floating position readout follows the avatar
    frameId = requestAnimationFrame(loop);
  };
  frameId = requestAnimationFrame(loop);

  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frameId);
    removeEventListener('pointermove', onPointerMove as unknown as EventListener);
    removeEventListener('keydown', onKeyDown as unknown as EventListener);
    removeEventListener('keyup', onKeyUp as unknown as EventListener);
    removeEventListener('pointerdown', onPointerDown as unknown as EventListener);
    removeEventListener('pointerup', onPointerUp as unknown as EventListener);
    hud.dispose();
  };
}
