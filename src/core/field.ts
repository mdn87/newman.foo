import type { Vec3 } from './types';
import { mulberry32 } from './rng';

export interface Rgb { r: number; g: number; b: number }

export interface ObstacleSpec { pos: Vec3; radius: number; density: number; mass: number; color: Rgb }

export interface FieldOpts {
  extent?: number; spacing?: number; spawnClear?: number;
  minRadius?: number; maxRadius?: number;
  minDensity?: number; maxDensity?: number;
  sizeMassLo?: number; sizeMassHi?: number;
  densMassLo?: number; densMassHi?: number;
  massClampLo?: number; massClampHi?: number;
}

// Low density -> light cyan; high density -> near-black. Denser = darker.
const LIGHT: Rgb = { r: 0x7f / 255, g: 0xc9 / 255, b: 0xe0 / 255 };
const DARK: Rgb = { r: 0x0a / 255, g: 0x14 / 255, b: 0x1e / 255 };

/** Denser -> darker. Monotonic lerp from LIGHT (minD) to DARK (maxD). */
export function densityColor(density: number, minD = 0.2, maxD = 15): Rgb {
  const t = Math.max(0, Math.min(1, (density - minD) / (maxD - minD)));
  return {
    r: LIGHT.r + (DARK.r - LIGHT.r) * t,
    g: LIGHT.g + (DARK.g - LIGHT.g) * t,
    b: LIGHT.b + (DARK.b - LIGHT.b) * t,
  };
}

/**
 * Mass of an obstacle as a product of two normalized factors (size and density),
 * clamped to [massClampLo, massClampHi]. Density gets a wider multiplicative
 * range so a small super-dense "core" can out-mass a large light object.
 *
 * Defaults: small+dense (0.7·4.0=2.8) > ship (1) > big+light (1.6·0.4=0.64).
 */
export function obstacleMass(radius: number, density: number, opts: FieldOpts = {}): number {
  const rMin = opts.minRadius ?? 2, rMax = opts.maxRadius ?? 9;
  const dMin = opts.minDensity ?? 0.2, dMax = opts.maxDensity ?? 15;
  const sLo = opts.sizeMassLo ?? 0.7, sHi = opts.sizeMassHi ?? 1.6;   // size's pull on mass
  const dfLo = opts.densMassLo ?? 0.4, dfHi = opts.densMassHi ?? 4.0;  // density's pull (wider -> can dominate)
  const kLo = opts.massClampLo ?? 0.1, kHi = opts.massClampHi ?? 8;
  const sizeT = (radius - rMin) / (rMax - rMin);    // 0..1 across the size range
  const densT = (density - dMin) / (dMax - dMin);   // 0..1 across the density range
  const sizeFactor = sLo + (sHi - sLo) * sizeT;
  const densFactor = dfLo + (dfHi - dfLo) * densT;
  return Math.max(kLo, Math.min(kHi, sizeFactor * densFactor));
}

/**
 * Deterministic dynamic-obstacle field on the gridline lattice within a central
 * cube. Each obstacle gets a seeded radius + density; mass is computed by
 * obstacleMass (size AND density both drive it, clamped). The origin
 * (the dart's spawn point) is excluded so the dart is never embedded.
 */
export function makeObstacleField(seed: number, opts: FieldOpts = {}): ObstacleSpec[] {
  const extent = opts.extent ?? 180;
  const spacing = opts.spacing ?? 90;
  const spawnClear = opts.spawnClear ?? 0.5;
  const rMin = opts.minRadius ?? 2, rMax = opts.maxRadius ?? 9;
  const dMin = opts.minDensity ?? 0.2, dMax = opts.maxDensity ?? 15;

  const n = Math.floor(extent / spacing);
  const rnd = mulberry32(seed);

  const out: ObstacleSpec[] = [];
  for (let ix = -n; ix <= n; ix++)
    for (let iy = -n; iy <= n; iy++)
      for (let iz = -n; iz <= n; iz++) {
        const pos = { x: ix * spacing, y: iy * spacing, z: iz * spacing };
        if (Math.hypot(pos.x, pos.y, pos.z) <= spawnClear) continue; // skip spawn point
        const radius = rMin + (rMax - rMin) * rnd();
        const density = dMin + (dMax - dMin) * rnd();
        const mass = obstacleMass(radius, density, opts);
        out.push({ pos, radius, density, mass, color: densityColor(density, dMin, dMax) });
      }
  return out;
}
