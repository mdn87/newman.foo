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
