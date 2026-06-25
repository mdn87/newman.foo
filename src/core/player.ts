import type { PlayerInput, PlayerState, Vec3 } from './types';

const THRUST = 24;
const DAMPING = 2.4;
const TURN = 0.0035;
const MAX_PITCH = Math.PI * 0.42;

export type { PlayerInput, PlayerState };

export function createPlayer(): PlayerState {
  return {
    position: { x: 0, y: 0, z: 18 },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
  };
}

export function steerPlayer(player: PlayerState, delta: { dx: number; dy: number }): PlayerState {
  return {
    ...player,
    yaw: player.yaw + delta.dx * TURN,
    pitch: clamp(player.pitch - delta.dy * TURN, -MAX_PITCH, MAX_PITCH),
  };
}

export function stepPlayer(player: PlayerState, input: PlayerInput, dt: number): PlayerState {
  const f = forwardVector(player.yaw, player.pitch);
  const r = { x: Math.cos(player.yaw), y: 0, z: Math.sin(player.yaw) };
  const accel = {
    x: (f.x * input.forward + r.x * input.right) * THRUST,
    y: (f.y * input.forward + input.up) * THRUST,
    z: (f.z * input.forward + r.z * input.right) * THRUST,
  };
  const decay = Math.exp(-DAMPING * dt);
  const velocity = {
    x: (player.velocity.x + accel.x * dt) * decay,
    y: (player.velocity.y + accel.y * dt) * decay,
    z: (player.velocity.z + accel.z * dt) * decay,
  };
  return {
    ...player,
    velocity,
    position: {
      x: player.position.x + velocity.x * dt,
      y: player.position.y + velocity.y * dt,
      z: player.position.z + velocity.z * dt,
    },
  };
}

export function forwardVector(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: -Math.cos(yaw) * cp };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
