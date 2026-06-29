import type { Vec3 } from './types';
import type { FlightInput } from './flight-types';

export interface ControlOpts {
  accel: number; boostAccel: number;
  maxSpeed: number; boostMaxSpeed: number;
  linearDamping: number; pitchLimit: number;
  bound: number; boundPush: number;
}

/** Tunables seeded from the legacy FlightMachine feel, plus boost. */
export const DEFAULT_CONTROL: ControlOpts = {
  accel: 110, boostAccel: 200,
  maxSpeed: 80, boostMaxSpeed: 130,
  linearDamping: 0.5, pitchLimit: 1.3,
  bound: 720, boundPush: 220,
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function headingFrom(yaw: number, pitch: number): Vec3 {
  return { x: Math.cos(pitch) * Math.sin(yaw), y: Math.sin(pitch), z: Math.cos(pitch) * Math.cos(yaw) };
}

/** Screen-right under the chase cam: cross(heading, worldUp) normalized. */
export function rightFrom(h: Vec3): Vec3 {
  const rx = -h.z, rz = h.x;
  const rl = Math.hypot(rx, rz);
  // Degenerate only if heading is exactly vertical; pitchLimit (1.3 < pi/2)
  // prevents that in practice, but fall back to a unit perpendicular for safety.
  if (rl < 1e-9) return { x: 1, y: 0, z: 0 };
  return { x: rx / rl, y: 0, z: rz / rl };
}

// `pitchDelta`/`yawDelta` arrive pre-scaled by the caller (wire layer); the
// pitch clamp is the safety bound, not a rate limiter.
export function integrateFacing(yaw: number, pitch: number, input: FlightInput, pitchLimit: number): { yaw: number; pitch: number } {
  return { yaw: yaw + input.yawDelta, pitch: clamp(pitch + input.pitchDelta, -pitchLimit, pitchLimit) };
}

/** Thrust force (mass is 1, so force == acceleration). Boost raises the magnitude. */
export function thrustForce(input: FlightInput, heading: Vec3, right: Vec3, o: ControlOpts): Vec3 {
  const a = input.boost ? o.boostAccel : o.accel;
  return {
    x: (heading.x * input.forward + right.x * input.strafe) * a,
    y: (heading.y * input.forward) * a,
    z: (heading.z * input.forward + right.z * input.strafe) * a,
  };
}

/** Soft containment: zero inside `bound`, else a centripetal pull toward origin. */
export function boundaryForce(pos: Vec3, bound: number, boundPush: number): Vec3 {
  const dist = Math.hypot(pos.x, pos.y, pos.z);
  if (dist <= bound) return { x: 0, y: 0, z: 0 };
  const k = (boundPush * ((dist - bound) / bound)) / dist;
  return { x: -pos.x * k, y: -pos.y * k, z: -pos.z * k };
}
