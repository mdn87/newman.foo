import { describe, expect, it } from 'vitest';
import { FlightMachine, type FlightInput } from '../src/core/flight';

const NEUTRAL: FlightInput = { aimX: 0, aimY: 0, thrust: 0 };
const THRUST: FlightInput = { aimX: 0, aimY: 0, thrust: 1 };
const speed = (m: FlightMachine) => m.state.speed;

describe('FlightMachine', () => {
  it('starts at rest at the origin facing +z', () => {
    const m = new FlightMachine();
    expect(m.state.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(m.state.speed).toBe(0);
    expect(m.state.heading.z).toBeCloseTo(1, 6);
    expect(Math.hypot(m.state.heading.x, m.state.heading.y, m.state.heading.z)).toBeCloseTo(1, 6);
  });

  it('ignites slowly — first burst is far below full-throttle acceleration', () => {
    const m = new FlightMachine({ accel: 90 });
    m.tick(0.1, THRUST);
    expect(speed(m)).toBeGreaterThan(0);
    expect(speed(m)).toBeLessThan(0.5 * 90 * 0.1);
  });

  it('builds toward, and never exceeds, max speed under sustained thrust', () => {
    const m = new FlightMachine({ maxSpeed: 70 });
    let peak = 0;
    for (let i = 0; i < 200; i++) {
      m.tick(0.05, THRUST);
      expect(speed(m)).toBeLessThanOrEqual(70 + 1e-6);
      peak = Math.max(peak, speed(m));
    }
    // Reaches cruising speed quickly (well before the soft boundary slows it).
    expect(peak).toBeGreaterThan(0.9 * 70);
  });

  it('glides to a near-stop after thrust is released (long but bounded)', () => {
    const m = new FlightMachine();
    for (let i = 0; i < 60; i++) m.tick(0.05, THRUST);
    const cruising = speed(m);
    let prev = cruising;
    for (let i = 0; i < 20; i++) { m.tick(0.05, NEUTRAL); expect(speed(m)).toBeLessThanOrEqual(prev + 1e-9); prev = speed(m); }
    expect(speed(m)).toBeGreaterThan(0);
    for (let i = 0; i < 400; i++) m.tick(0.05, NEUTRAL);
    expect(speed(m)).toBeLessThan(0.02 * cruising);
  });

  it('steers: positive aimX turns heading and banks the avatar', () => {
    const m = new FlightMachine();
    for (let i = 0; i < 20; i++) m.tick(0.05, { aimX: 1, aimY: 0, thrust: 0 });
    expect(m.state.yaw).toBeGreaterThan(0);
    expect(m.state.heading.x).toBeGreaterThan(0);
    expect(m.state.bank).toBeLessThan(0);
  });

  it('clamps pitch so you cannot flip over', () => {
    const m = new FlightMachine({ pitchLimit: 1.3 });
    for (let i = 0; i < 200; i++) m.tick(0.05, { aimX: 0, aimY: 1, thrust: 0 });
    expect(Math.abs(m.state.pitch)).toBeLessThanOrEqual(1.3 + 1e-9);
  });

  it('soft bound pulls a runaway back toward center', () => {
    const m = new FlightMachine({ bound: 100 });
    m.state.position = { x: 160, y: 0, z: 0 };
    m.state.velocity = { x: 20, y: 0, z: 0 };
    for (let i = 0; i < 50; i++) m.tick(0.05, NEUTRAL);
    expect(m.state.velocity.x).toBeLessThan(20);
    expect(m.state.position.x).toBeLessThan(160 + 20 * 50 * 0.05);
  });

  it('is deterministic and keeps heading unit-length', () => {
    const a = new FlightMachine(), b = new FlightMachine();
    const seq: FlightInput[] = Array.from({ length: 50 }, (_, i) => ({ aimX: Math.sin(i), aimY: Math.cos(i) * 0.5, thrust: i % 2 }));
    for (const inp of seq) { a.tick(0.05, inp); b.tick(0.05, inp); }
    expect(a.state).toEqual(b.state);
    expect(Math.hypot(a.state.heading.x, a.state.heading.y, a.state.heading.z)).toBeCloseTo(1, 6);
  });
});
