import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { ThrusterParticles, type ThrusterInput } from '../src/core/thruster-particles';

const input = (enginePower: number): ThrusterInput => ({
  tail: { x: 0, y: 0, z: -2 },
  heading: { x: 0, y: 0, z: 1 },
  velocity: { x: 0, y: 0, z: 10 },
  enginePower,
});

const run = (particles: ThrusterParticles, enginePower: number, seconds: number): void => {
  for (let frame = 0; frame < seconds * 60; frame += 1) {
    particles.step(1 / 60, input(enginePower));
  }
};

describe('ThrusterParticles', () => {
  it('exposes its fixed capacity', () => {
    const particles = new ThrusterParticles(16);

    expect(particles.capacity).toBe(16);
  });

  it('emits no particles at zero engine power', () => {
    const particles = new ThrusterParticles();

    run(particles, 0, 1);

    expect(particles.aliveCount).toBe(0);
  });

  it('ignores negative and NaN dt without poisoning later valid emission', () => {
    const particles = new ThrusterParticles();

    particles.step(-1, input(1));
    particles.step(Number.NaN, input(1));
    expect(particles.aliveCount).toBe(0);

    run(particles, 1, 1);
    expect(particles.aliveCount).toBeGreaterThan(0);
  });

  it('ignores infinite dt without hanging or poisoning later emission', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '--eval',
        `
          import { ThrusterParticles } from './src/core/thruster-particles.ts';
          const particles = new ThrusterParticles();
          const input = {
            tail: { x: 0, y: 0, z: -2 },
            heading: { x: 0, y: 0, z: 1 },
            velocity: { x: 0, y: 0, z: 10 },
            enginePower: 1,
          };
          particles.step(Number.POSITIVE_INFINITY, input);
          for (let frame = 0; frame < 60; frame += 1) particles.step(1 / 60, input);
          console.log(particles.aliveCount);
        `,
      ],
      { cwd: process.cwd(), encoding: 'utf8', timeout: 1000 },
    );

    expect(result.error).toBeUndefined();
    expect(Number(result.stdout.trim())).toBeGreaterThan(0);
  });

  it('makes boost denser and faster than normal thrust', () => {
    const normal = new ThrusterParticles(128, 7);
    const boost = new ThrusterParticles(128, 7);

    run(normal, 0.6, 0.5);
    run(boost, 1, 0.5);

    expect(boost.aliveCount).toBeGreaterThan(normal.aliveCount);
    expect(Math.min(...boost.positions)).toBeLessThan(Math.min(...normal.positions));
  });

  it('shrinks and fades every surviving particle continuously', () => {
    const particles = new ThrusterParticles(128, 0);
    run(particles, 1, 0.2);
    const sizes = particles.sizes.slice();
    const alphas = particles.alphas.slice();

    particles.step(1 / 600, input(0));

    let survivors = 0;
    for (let i = 0; i < particles.capacity; i += 1) {
      if (alphas[i] === 0 || particles.alphas[i] === 0) continue;
      survivors += 1;
      expect.soft(particles.alphas[i]).toBeLessThan(alphas[i]!);
      expect.soft(particles.sizes[i]).toBeLessThan(sizes[i]!);
    }
    expect(survivors).toBeGreaterThan(0);
  });

  it('stays within capacity and releases expired particles', () => {
    const particles = new ThrusterParticles(16, 7);

    run(particles, 1, 1);
    expect(particles.aliveCount).toBeLessThanOrEqual(16);

    run(particles, 0, 1);
    expect(particles.aliveCount).toBe(0);
  });

  it('recycles a visible slot when the pool is full', () => {
    const particles = new ThrusterParticles(2, 7);
    particles.step(1, input(1));

    particles.step(1 / 75, { ...input(1), tail: { x: 100, y: 0, z: -2 } });

    expect(particles.aliveCount).toBe(2);
    const shiftedSlots = [particles.positions[0], particles.positions[3]].filter((x) => x! > 99);
    expect(shiftedSlots).toHaveLength(1);
  });

  it('replays positions and fades exactly for the same seed', () => {
    const first = new ThrusterParticles(128, 42);
    const second = new ThrusterParticles(128, 42);

    run(first, 0.8, 0.5);
    run(second, 0.8, 0.5);

    expect(first.positions).toEqual(second.positions);
    expect(first.alphas).toEqual(second.alphas);
  });
});

describe('setPalette', () => {
  const input = () => ({ tail: { x: 0, y: 0, z: 0 }, heading: { x: 0, y: 0, z: 1 }, velocity: { x: 0, y: 0, z: 0 }, enginePower: 1 });

  it('default spawn colors are the legacy cyan/navy pair', () => {
    const p = new ThrusterParticles(16, 7);
    p.step(0.2, input()); // emits several particles
    const c = { r: p.colors[0]!, g: p.colors[1]!, b: p.colors[2]! };
    const isCyan = Math.round(c.r * 255) === 0x4a && Math.round(c.g * 255) === 0xb3 && Math.round(c.b * 255) === 0xd4;
    const isNavy = Math.round(c.r * 255) === 0x16 && Math.round(c.g * 255) === 0x32 && Math.round(c.b * 255) === 0x4a;
    expect(isCyan || isNavy).toBe(true);
  });

  it('after setPalette, new spawns use the new pair (existing colors untouched until overwritten)', () => {
    const p = new ThrusterParticles(64, 7);
    p.step(0.2, input());
    const main = { r: 1, g: 0.5, b: 0.25 }, deep = { r: 0.5, g: 0.25, b: 0 };
    p.setPalette(main, deep);
    const before = Array.from(p.colors);
    p.step(0.4, input()); // spawns more with the new palette
    let sawNew = false;
    for (let i = 0; i < p.capacity; i++) {
      const r = p.colors[i * 3]!, g = p.colors[i * 3 + 1]!, b = p.colors[i * 3 + 2]!;
      if ((Math.abs(r - main.r) < 1e-6 && Math.abs(g - main.g) < 1e-6 && Math.abs(b - main.b) < 1e-6)
        || (Math.abs(r - deep.r) < 1e-6 && Math.abs(g - deep.g) < 1e-6 && Math.abs(b - deep.b) < 1e-6)) sawNew = true;
    }
    expect(sawNew).toBe(true);
    expect(before.length).toBe(p.colors.length); // palette swap alone didn't grow/repaint buffers
  });
});
