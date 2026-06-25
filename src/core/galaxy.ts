import type { Vec3 } from './types';
import { mulberry32 } from './rng';

export type GalaxyKind = 'planet' | 'bubble' | 'cloud' | 'sparkle';
export interface GalaxyPiece { kind: GalaxyKind; pos: Vec3; size: number; rot: number; spin: number; }
export interface GalaxyArc { points: Vec3[]; }
export interface GalaxyField { pieces: GalaxyPiece[]; arcs: GalaxyArc[]; }

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

export interface GalaxyOpts {
  bubbles?: number; sparkles?: number; clouds?: number; planets?: number; arcs?: number;
}

const Z_MIN = -40, Z_MAX = 190, X_MAX = 70, Y_MAX = 38;
const CLEAR_BIG = 12, CLEAR_SMALL = 5; // keep the flight corridor from being blocked
const MAX = 600;
const KINDS: GalaxyKind[] = ['bubble', 'sparkle', 'cloud', 'planet'];

const clampCount = (v: number | undefined, d: number): number =>
  v === undefined || !Number.isFinite(v) ? d : Math.min(MAX, Math.max(0, Math.floor(v)));

/**
 * Deterministic field of simple line-art doodles (bubbles, sparkles, clouds, a
 * few planet outlines) plus gentle line arcs, sparsely scattered through the 3D
 * volume around the corridor so they parallax as the camera moves. The sparse,
 * airy count recaptures the original site's charm. Pure: no Math.random, no three.
 */
export function makeGalaxy(seed: number, opts: GalaxyOpts = {}): GalaxyField {
  const rnd = mulberry32(seed);
  const pieces: GalaxyPiece[] = [];
  const arcs: GalaxyArc[] = [];

  const want: Record<GalaxyKind, number> = {
    bubble: clampCount(opts.bubbles, 14),
    sparkle: clampCount(opts.sparkles, 16),
    cloud: clampCount(opts.clouds, 6),
    planet: clampCount(opts.planets, 5),
  };

  const sizeFor = (kind: GalaxyKind): number => {
    if (kind === 'bubble') return 0.6 + rnd() * 2.2;
    if (kind === 'sparkle') return 0.5 + rnd() * 1.3;
    if (kind === 'cloud') return 2.4 + rnd() * 3.2;
    return 2.6 + rnd() * 3.4; // planet outline
  };
  const clearFor = (kind: GalaxyKind): number => (kind === 'bubble' || kind === 'sparkle' ? CLEAR_SMALL : CLEAR_BIG);

  for (const kind of KINDS) {
    let made = 0;
    let guard = 0;
    while (made < want[kind] && guard++ < want[kind] * 20 + 20) {
      const pos = {
        x: (rnd() * 2 - 1) * X_MAX,
        y: (rnd() * 2 - 1) * Y_MAX,
        z: Z_MIN + rnd() * (Z_MAX - Z_MIN),
      };
      const size = sizeFor(kind); // consume RNG regardless so layout stays stable
      const rot = (rnd() * 2 - 1) * Math.PI;
      const spin = (rnd() * 2 - 1) * 0.3;
      if (Math.hypot(pos.x, pos.y) < clearFor(kind)) continue;
      pieces.push({ kind, pos, size, rot, spin });
      made++;
    }
  }

  const arcCount = clampCount(opts.arcs, 5);
  for (let i = 0; i < arcCount; i++) {
    const cx = (rnd() * 2 - 1) * X_MAX, cy = (rnd() * 2 - 1) * Y_MAX, cz = Z_MIN + rnd() * (Z_MAX - Z_MIN);
    const len = 20 + rnd() * 40;
    const dirAngle = rnd() * Math.PI * 2;
    const dx = Math.cos(dirAngle), dz = Math.sin(dirAngle);
    const amp = 3 + rnd() * 7, phase = rnd() * Math.PI * 2, waves = 1 + rnd() * 2;
    const points: Vec3[] = [];
    const N = 16;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const along = (t - 0.5) * len;
      const off = Math.sin(phase + t * Math.PI * 2 * waves) * amp;
      points.push({
        x: cx + dx * along + (-dz) * off,
        y: cy + (rnd() * 2 - 1) * 1.5,
        z: cz + dz * along + dx * off,
      });
    }
    arcs.push({ points });
  }

  return { pieces, arcs };
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
