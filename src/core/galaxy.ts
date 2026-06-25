import type { Vec3 } from './types';
import { mulberry32 } from './rng';

export interface SpiralStar { pos: Vec3; size: number; armIndex: number; }
export interface SpiralPlanet { pos: Vec3; radius: number; orbitRadius: number; color: string; }
export interface SpiralPolyhedron { pos: Vec3; radius: number; spin: Vec3; }
export interface SpiralOrbit { center: Vec3; radius: number; tilt: number; }
export interface SpiralArmGuide { points: Vec3[]; }
export interface SpiralGalaxy {
  stars: SpiralStar[];
  planets: SpiralPlanet[];
  polyhedra: SpiralPolyhedron[];
  orbits: SpiralOrbit[];
  armGuides: SpiralArmGuide[];
}

const SPIRAL_STAR_COUNT = 600;
const SPIRAL_PLANET_COUNT = 12;
const SPIRAL_POLYHEDRON_COUNT = 18;
const SPIRAL_ORBIT_COUNT = 20;
const SPIRAL_ARM_GUIDE_COUNT = 8;
const SPIRAL_STRUCTURAL_ARM_COUNT = 3;
const TAU = Math.PI * 2;
const SPIRAL_COLORS = ['#f8c471', '#7fb3d5', '#bb8fce', '#76d7c4', '#f1948a', '#f7dc6f'];
const OUTER_ANCHOR_ANGLES = [0, Math.PI, Math.PI / 2, Math.PI * 1.5];

type Rng = () => number;

const range = (rnd: Rng, min: number, max: number): number => min + rnd() * (max - min);

const spiralPos = (
  rnd: Rng,
  armIndex: number,
  t: number,
  minRadius: number,
  maxRadius: number,
  verticalSpread: number,
): Vec3 => {
  const radius = minRadius + t * (maxRadius - minRadius) + range(rnd, -3, 3);
  const angle = (armIndex / SPIRAL_STRUCTURAL_ARM_COUNT) * TAU + t * 5.1 + range(rnd, -0.2, 0.2);
  return {
    x: Math.cos(angle) * radius + range(rnd, -2.5, 2.5),
    y: range(rnd, -verticalSpread, verticalSpread),
    z: Math.sin(angle) * radius + range(rnd, -2.5, 2.5),
  };
};

const polarPos = (angle: number, radius: number, y: number): Vec3 => ({
  x: Math.cos(angle) * radius,
  y,
  z: Math.sin(angle) * radius,
});

export function makeSpiralGalaxy(seed: number): SpiralGalaxy {
  const rnd = mulberry32(seed);

  const stars: SpiralStar[] = [];
  for (let i = 0; i < SPIRAL_STAR_COUNT; i++) {
    const armIndex = i % SPIRAL_STRUCTURAL_ARM_COUNT;
    const armStep = Math.floor(i / SPIRAL_STRUCTURAL_ARM_COUNT);
    const t = armStep / (SPIRAL_STAR_COUNT / SPIRAL_STRUCTURAL_ARM_COUNT - 1);
    stars.push({
      pos: spiralPos(rnd, armIndex, t, 6, 134, 18),
      size: range(rnd, 0.25, 1.5),
      armIndex,
    });
  }

  const planets: SpiralPlanet[] = [];
  for (let i = 0; i < SPIRAL_PLANET_COUNT; i++) {
    const anchored = i < OUTER_ANCHOR_ANGLES.length;
    const armIndex = i % SPIRAL_STRUCTURAL_ARM_COUNT;
    const pos = anchored
      ? polarPos(OUTER_ANCHOR_ANGLES[i]!, 130, i === 0 ? -48 : i === 1 ? 48 : range(rnd, -50, 50))
      : spiralPos(rnd, armIndex, i / (SPIRAL_PLANET_COUNT - 1), 46, 126, 50);
    planets.push({
      pos,
      radius: range(rnd, 2.4, 6.8),
      orbitRadius: range(rnd, 8, 22),
      color: SPIRAL_COLORS[Math.floor(rnd() * SPIRAL_COLORS.length)]!,
    });
  }

  const polyhedra: SpiralPolyhedron[] = [];
  for (let i = 0; i < SPIRAL_POLYHEDRON_COUNT; i++) {
    const armIndex = (i + 1) % SPIRAL_STRUCTURAL_ARM_COUNT;
    polyhedra.push({
      pos: spiralPos(rnd, armIndex, i / (SPIRAL_POLYHEDRON_COUNT - 1), 34, 124, 46),
      radius: range(rnd, 1.8, 5.4),
      spin: {
        x: range(rnd, -0.02, 0.02),
        y: range(rnd, -0.03, 0.03),
        z: range(rnd, -0.02, 0.02),
      },
    });
  }

  const orbits: SpiralOrbit[] = [];
  for (let i = 0; i < SPIRAL_ORBIT_COUNT; i++) {
    orbits.push({
      center: spiralPos(rnd, i % SPIRAL_STRUCTURAL_ARM_COUNT, i / (SPIRAL_ORBIT_COUNT - 1), 22, 120, 28),
      radius: range(rnd, 10, 36),
      tilt: range(rnd, -0.8, 0.8),
    });
  }

  const armGuides: SpiralArmGuide[] = [];
  for (let i = 0; i < SPIRAL_ARM_GUIDE_COUNT; i++) {
    const guideArmIndex = i % SPIRAL_STRUCTURAL_ARM_COUNT;
    const phase = range(rnd, -0.08, 0.08) + Math.floor(i / SPIRAL_STRUCTURAL_ARM_COUNT) * 0.2;
    const points: Vec3[] = [];
    const guidePointCount = 40;
    for (let k = 0; k < guidePointCount; k++) {
      const t = k / (guidePointCount - 1);
      const radius = 12 + t * 138;
      const angle = (guideArmIndex / SPIRAL_STRUCTURAL_ARM_COUNT) * TAU + phase + t * 5.1;
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(t * TAU + i) * 2,
        z: Math.sin(angle) * radius,
      });
    }
    armGuides.push({ points });
  }

  return { stars, planets, polyhedra, orbits, armGuides };
}
