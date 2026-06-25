import { describe, expect, it } from 'vitest';
import { createPlayer, forwardVector, steerPlayer, stepPlayer, type PlayerInput } from '../src/core/player';

const DT = 1 / 60;

function stepMany(input: PlayerInput, frames = 60, start = createPlayer()) {
  let player = start;
  for (let i = 0; i < frames; i++) player = stepPlayer(player, input, DT);
  return player;
}

function length(v: { x: number; y: number; z: number }) {
  return Math.hypot(v.x, v.y, v.z);
}

function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

describe('player motion', () => {
  it('moves forward by at least 4 world units after one fixed second', () => {
    const start = createPlayer();
    const player = stepMany({ forward: 1, right: 0, up: 0 }, 60, start);
    expect(start.position.z - player.position.z).toBeGreaterThanOrEqual(4);
  });

  it('damps velocity when input stops', () => {
    const moving = stepMany({ forward: 1, right: 0, up: 0 });
    const damped = stepMany({ forward: 0, right: 0, up: 0 }, 60, moving);
    expect(length(damped.velocity)).toBeLessThan(length(moving.velocity));
  });

  it('click-drag steering changes yaw and pitch while clamping pitch', () => {
    const player = steerPlayer(createPlayer(), { dx: 120, dy: -80 });
    expect(player.yaw).toBeGreaterThan(0);
    expect(player.pitch).toBeGreaterThan(0);
    expect(player.pitch).toBeLessThan(Math.PI / 2);

    const clamped = steerPlayer(createPlayer(), { dx: 0, dy: -10_000 });
    expect(clamped.pitch).toBeLessThan(Math.PI / 2);
    expect(clamped.pitch).toBeCloseTo(Math.PI * 0.42);
  });

  it('strafes perpendicular to forward after yaw', () => {
    const start = { ...createPlayer(), yaw: Math.PI / 4 };
    const player = stepMany({ forward: 0, right: 1, up: 0 }, 60, start);
    const displacement = {
      x: player.position.x - start.position.x,
      y: player.position.y - start.position.y,
      z: player.position.z - start.position.z,
    };
    expect(dot(displacement, forwardVector(start.yaw, start.pitch))).toBeCloseTo(0);
  });
});
