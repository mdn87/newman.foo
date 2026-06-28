import type { Vec3 } from './types';

export interface FlightInput { aimX: number; aimY: number; thrust: number; }

export interface FlightState {
  position: Vec3; velocity: Vec3; heading: Vec3;
  yaw: number; pitch: number; bank: number; throttle: number; speed: number;
}

export interface FlightOpts {
  turnRate?: number; accel?: number; maxSpeed?: number; drag?: number;
  throttleEase?: number; bankMax?: number; bankEase?: number;
  bound?: number; boundPush?: number; pitchLimit?: number;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const headingFrom = (yaw: number, pitch: number): Vec3 => ({
  x: Math.cos(pitch) * Math.sin(yaw),
  y: Math.sin(pitch),
  z: Math.cos(pitch) * Math.cos(yaw),
});

/**
 * Deterministic free-flight integrator — "jet boosters in space". Steering eases
 * heading toward the pointer aim; a single smoothed `throttle` gives the slow
 * booster ignition; light drag glides you to a near-stop on release; a soft
 * boundary keeps you from getting lost. No three.js, no wall clock.
 */
export class FlightMachine {
  state: FlightState;
  private readonly o: Required<FlightOpts>;

  constructor(opts: FlightOpts = {}) {
    this.o = {
      turnRate: opts.turnRate ?? 1.6,
      accel: opts.accel ?? 90,
      maxSpeed: opts.maxSpeed ?? 70,
      drag: opts.drag ?? 0.6,
      throttleEase: opts.throttleEase ?? 2.2,
      bankMax: opts.bankMax ?? 0.5,
      bankEase: opts.bankEase ?? 3,
      bound: opts.bound ?? 260,
      boundPush: opts.boundPush ?? 140,
      pitchLimit: opts.pitchLimit ?? 1.3,
    };
    this.state = {
      position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 },
      heading: headingFrom(0, 0), yaw: 0, pitch: 0, bank: 0, throttle: 0, speed: 0,
    };
  }

  tick(dt: number, input: FlightInput): void {
    if (!(dt > 0)) return;
    const o = this.o, s = this.state;
    const ease = (cur: number, tgt: number, rate: number) => cur + (tgt - cur) * Math.min(1, rate * dt);

    s.yaw += input.aimX * o.turnRate * dt;
    s.pitch = clamp(s.pitch - input.aimY * o.turnRate * dt, -o.pitchLimit, o.pitchLimit);
    s.heading = headingFrom(s.yaw, s.pitch);
    s.bank = ease(s.bank, -clamp(input.aimX, -1, 1) * o.bankMax, o.bankEase);

    s.throttle = ease(s.throttle, clamp(input.thrust, 0, 1), o.throttleEase);

    const a = o.accel * s.throttle * dt;
    s.velocity.x += s.heading.x * a; s.velocity.y += s.heading.y * a; s.velocity.z += s.heading.z * a;

    const keep = Math.pow(o.drag, dt);
    s.velocity.x *= keep; s.velocity.y *= keep; s.velocity.z *= keep;

    const { x: px, y: py, z: pz } = s.position;
    const dist = Math.hypot(px, py, pz);
    if (dist > o.bound) {
      const k = (o.boundPush * ((dist - o.bound) / o.bound) * dt) / dist;
      s.velocity.x -= px * k; s.velocity.y -= py * k; s.velocity.z -= pz * k;
    }

    let sp = Math.hypot(s.velocity.x, s.velocity.y, s.velocity.z);
    if (sp > o.maxSpeed) { const f = o.maxSpeed / sp; s.velocity.x *= f; s.velocity.y *= f; s.velocity.z *= f; sp = o.maxSpeed; }

    s.position.x += s.velocity.x * dt; s.position.y += s.velocity.y * dt; s.position.z += s.velocity.z * dt;
    s.speed = sp;
  }
}
