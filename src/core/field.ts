import type { Vec3 } from './types';
import { mulberry32 } from './rng';

export interface Rgb { r: number; g: number; b: number }

export interface ObstacleSpec { pos: Vec3; radius: number; density: number; mass: number; color: Rgb }

export interface FieldOpts {
  extent?: number; spacing?: number; spawnClear?: number;
  minRadius?: number; maxRadius?: number;
  minDensity?: number; maxDensity?: number;
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
 * Deterministic dynamic-obstacle field on the gridline lattice within a central
 * cube. Each obstacle gets a seeded radius + density; mass is (volume*density)
 * normalized so the median object ~= the ship's mass (1), clamped. The origin
 * (the dart's spawn point) is excluded so the dart is never embedded.
 */
export function makeObstacleField(seed: number, opts: FieldOpts = {}): ObstacleSpec[] {
  const extent = opts.extent ?? 180;
  const spacing = opts.spacing ?? 90;
  const spawnClear = opts.spawnClear ?? 0.5;
  const rMin = opts.minRadius ?? 2, rMax = opts.maxRadius ?? 9;
  const dMin = opts.minDensity ?? 0.2, dMax = opts.maxDensity ?? 15;
  const kLo = opts.massClampLo ?? 0.1, kHi = opts.massClampHi ?? 8;

  const n = Math.floor(extent / spacing);
  const rnd = mulberry32(seed);
  const vol = (r: number) => (4 / 3) * Math.PI * r * r * r;
  const refRaw = vol((rMin + rMax) / 2) * ((dMin + dMax) / 2); // median object -> k ~= 1

  const out: ObstacleSpec[] = [];
  for (let ix = -n; ix <= n; ix++)
    for (let iy = -n; iy <= n; iy++)
      for (let iz = -n; iz <= n; iz++) {
        const pos = { x: ix * spacing, y: iy * spacing, z: iz * spacing };
        if (Math.hypot(pos.x, pos.y, pos.z) <= spawnClear) continue; // skip spawn point
        const radius = rMin + (rMax - rMin) * rnd();
        const density = dMin + (dMax - dMin) * rnd();
        const mass = Math.max(kLo, Math.min(kHi, (vol(radius) * density) / refRaw));
        out.push({ pos, radius, density, mass, color: densityColor(density, dMin, dMax) });
      }
  return out;
}
