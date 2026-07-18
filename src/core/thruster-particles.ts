import { mulberry32 } from './rng';
import type { Rgb, Vec3 } from './types';
import { THEMES } from './theme';

export interface ThrusterInput {
  tail: Vec3;
  heading: Vec3;
  velocity: Vec3;
  enginePower: number;
}

export class ThrusterParticles {
  public readonly positions: Float32Array;
  public readonly sizes: Float32Array;
  public readonly alphas: Float32Array;
  public readonly colors: Float32Array;

  private readonly velocities: Float32Array;
  private readonly ages: Float32Array;
  private readonly lifetimes: Float32Array;
  private readonly initialSizes: Float32Array;
  private readonly initialAlphas: Float32Array;
  private readonly alive: Uint8Array;
  private readonly rnd: () => number;
  private emissionAccumulator = 0;
  private serial = 0;
  private main: Rgb = THEMES.light.thrusterMain;
  private deep: Rgb = THEMES.light.thrusterDeep;

  public constructor(readonly capacity = 128, seed = 1981) {
    this.positions = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.alphas = new Float32Array(capacity);
    this.colors = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 3);
    this.ages = new Float32Array(capacity);
    this.lifetimes = new Float32Array(capacity);
    this.initialSizes = new Float32Array(capacity);
    this.initialAlphas = new Float32Array(capacity);
    this.alive = new Uint8Array(capacity);
    this.rnd = mulberry32(seed);
  }

  public get aliveCount(): number {
    let count = 0;
    for (let i = 0; i < this.alive.length; i += 1) count += this.alive[i]!;
    return count;
  }

  /** Swap spawn colors (live re-theming). Alive particles keep their color and fade out. Consumes no RNG. */
  public setPalette(main: Rgb, deep: Rgb): void {
    this.main = main; this.deep = deep;
  }

  public step(dt: number, input: ThrusterInput): void {
    if (!(dt > 0) || !Number.isFinite(dt)) return;

    for (let i = 0; i < this.alive.length; i += 1) {
      if (this.alive[i] === 0) continue;

      const age = this.ages[i]! + dt;
      this.ages[i] = age;
      if (age >= this.lifetimes[i]!) {
        this.alive[i] = 0;
        this.alphas[i] = 0;
        this.sizes[i] = 0;
        continue;
      }

      const offset = i * 3;
      this.positions[offset] = this.positions[offset]! + this.velocities[offset]! * dt;
      this.positions[offset + 1] = this.positions[offset + 1]! + this.velocities[offset + 1]! * dt;
      this.positions[offset + 2] = this.positions[offset + 2]! + this.velocities[offset + 2]! * dt;
      const life = 1 - age / this.lifetimes[i]!;
      this.alphas[i] = this.initialAlphas[i]! * life * life;
      this.sizes[i] = this.initialSizes[i]! * (0.35 + 0.65 * life);
    }

    const power = Math.max(0, Math.min(1, input.enginePower));
    if (power === 0) return;

    const boostT = Math.max(0, (power - 0.6) / 0.4);
    const rate = power <= 0.6 ? 35 * (power / 0.6) : 35 + 40 * boostT;
    this.emissionAccumulator += rate * dt;
    const emitCount = Math.floor(this.emissionAccumulator);
    this.emissionAccumulator -= emitCount;
    for (let i = 0; i < emitCount; i += 1) this.spawn(input, boostT);
  }

  private spawn(input: ThrusterInput, boostT: number): void {
    const capacity = this.alive.length;
    if (capacity === 0) return;

    let slot = -1;
    for (let offset = 0; offset < capacity; offset += 1) {
      const candidate = (this.serial + offset) % capacity;
      if (this.alive[candidate] === 0) {
        slot = candidate;
        break;
      }
    }

    if (slot < 0) {
      slot = this.serial;
      let greatestAge = this.ages[slot]!;
      for (let offset = 1; offset < capacity; offset += 1) {
        const candidate = (this.serial + offset) % capacity;
        if (this.ages[candidate]! > greatestAge) {
          slot = candidate;
          greatestAge = this.ages[candidate]!;
        }
      }
    }
    this.serial = (slot + 1) % capacity;

    const jitterX = this.rnd() * 0.44 - 0.22;
    const jitterY = this.rnd() * 0.44 - 0.22;
    const jitterZ = this.rnd() * 0.16 - 0.08;
    const exhaust = 18 + 20 * boostT + this.rnd() * 5;
    const vectorOffset = slot * 3;
    this.positions[vectorOffset] = input.tail.x + jitterX;
    this.positions[vectorOffset + 1] = input.tail.y + jitterY;
    this.positions[vectorOffset + 2] = input.tail.z + jitterZ;
    this.velocities[vectorOffset] = input.velocity.x - input.heading.x * exhaust + jitterX * 5;
    this.velocities[vectorOffset + 1] = input.velocity.y - input.heading.y * exhaust + jitterY * 5;
    this.velocities[vectorOffset + 2] = input.velocity.z - input.heading.z * exhaust + jitterZ * 5;
    this.ages[slot] = 0;
    this.lifetimes[slot] = 0.35 + this.rnd() * 0.3;
    const initialSize = 2.2 + this.rnd() * 0.9 + boostT * 0.5;
    const initialAlpha = 0.85 + this.rnd() * 0.15;
    this.initialSizes[slot] = initialSize;
    this.initialAlphas[slot] = initialAlpha;
    this.sizes[slot] = initialSize;
    this.alphas[slot] = initialAlpha;

    const dark = this.rnd() < 0.18;
    const c = dark ? this.deep : this.main;
    this.colors[vectorOffset] = c.r;
    this.colors[vectorOffset + 1] = c.g;
    this.colors[vectorOffset + 2] = c.b;
    this.alive[slot] = 1;
  }
}
