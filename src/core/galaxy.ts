import type { Vec3 } from './types';
import { mulberry32 } from './rng';

export type GalaxyKind =
  | 'bubble' | 'sparkle' | 'cloud' | 'star' | 'diamond'
  | 'triangle' | 'plus' | 'hexagon' | 'swirl' | 'constellation';

export interface GalaxyPiece { kind: GalaxyKind; pos: Vec3; size: number; rot: number; spin: number; }
export interface GalaxyArc { points: Vec3[]; }
export interface GalaxyField { pieces: GalaxyPiece[]; arcs: GalaxyArc[]; }

export interface GalaxyOpts {
  counts?: Partial<Record<GalaxyKind, number>>;
  arcs?: number;
}

export const GALAXY_KINDS: GalaxyKind[] = [
  'bubble', 'sparkle', 'cloud', 'star', 'diamond',
  'triangle', 'plus', 'hexagon', 'swirl', 'constellation',
];

// The field is a loose spiral wrapped around the flight axis (the +z corridor):
// ARMS logarithmic-ish arms that wind with radius (WIND) and twist along depth
// (Z_TWIST) into a slow helix. The renderer spins the whole field a hair each
// frame so pieces drift past when you stop. Pure: no Math.random, no three.
const Z_MIN = -40, Z_MAX = 190;
const R_MAX = 52, R_REF = 5;          // winding is measured from R_REF outward
const ARMS = 3;
const WIND = 0.085;                   // radians of arm wrap per unit radius
const Z_TWIST = 0.027;                // radians of helix per unit depth
const ARM_SPREAD = 0.3;               // angular half-thickness of an arm
const R_BIAS = 1.7;                   // >1 packs more pieces toward the core
const MAX = 600;

const DEFAULT_COUNTS: Record<GalaxyKind, number> = {
  bubble: 9, sparkle: 10, cloud: 4, star: 6, diamond: 5,
  triangle: 4, plus: 8, hexagon: 4, swirl: 3, constellation: 3,
};

// Big motifs sit further out so the flight corridor stays open at any rotation.
export const KIND_CLEARANCE: Record<GalaxyKind, number> = {
  bubble: 5, sparkle: 5, plus: 5, swirl: 5, constellation: 5,
  star: 6, diamond: 7, triangle: 8, hexagon: 9, cloud: 12,
};

const clampCount = (v: number | undefined, d: number): number =>
  v === undefined || !Number.isFinite(v) ? d : Math.min(MAX, Math.max(0, Math.floor(v)));

export function makeGalaxy(seed: number, opts: GalaxyOpts = {}): GalaxyField {
  const rnd = mulberry32(seed);
  const pieces: GalaxyPiece[] = [];
  const arcs: GalaxyArc[] = [];

  const sizeFor = (kind: GalaxyKind): number => {
    switch (kind) {
      case 'bubble': return 0.6 + rnd() * 2.2;
      case 'sparkle': return 0.5 + rnd() * 1.3;
      case 'plus': return 0.7 + rnd() * 1.4;
      case 'star': return 0.8 + rnd() * 1.6;
      case 'diamond': return 0.8 + rnd() * 1.6;
      case 'swirl': return 1.2 + rnd() * 2.2;
      case 'constellation': return 1.6 + rnd() * 2.6;
      case 'triangle': return 1.0 + rnd() * 2.0;
      case 'hexagon': return 1.4 + rnd() * 2.4;
      case 'cloud': return 2.4 + rnd() * 3.2;
    }
  };

  for (const kind of GALAXY_KINDS) {
    const want = clampCount(opts.counts?.[kind], DEFAULT_COUNTS[kind]);
    const clear = KIND_CLEARANCE[kind];
    for (let i = 0; i < want; i++) {
      const arm = Math.floor(rnd() * ARMS);
      const phi = arm * ((2 * Math.PI) / ARMS);
      const r = clear + (R_MAX - clear) * Math.pow(rnd(), R_BIAS);
      const z = Z_MIN + rnd() * (Z_MAX - Z_MIN);
      const jitter = (rnd() * 2 - 1) * ARM_SPREAD;
      const angle = phi + WIND * (r - R_REF) + Z_TWIST * (z - Z_MIN) + jitter;
      const size = sizeFor(kind);             // consume RNG for every piece
      const rot = (rnd() * 2 - 1) * Math.PI;
      const spin = (rnd() * 2 - 1) * 0.25;
      pieces.push({ kind, pos: { x: r * Math.cos(angle), y: r * Math.sin(angle), z }, size, rot, spin });
    }
  }

  // Faint guide spines tracing the arms, so the spiral reads even where pieces
  // are sparse. Each winds outward in radius while sweeping the full depth.
  const arcCount = clampCount(opts.arcs, ARMS);
  const N = 24;
  for (let i = 0; i < arcCount; i++) {
    const phi = (i % ARMS) * ((2 * Math.PI) / ARMS) + (rnd() * 2 - 1) * 0.15;
    const rStart = 10 + rnd() * 4;
    const points: Vec3[] = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const r = rStart + t * (R_MAX - rStart);
      const z = Z_MIN + t * (Z_MAX - Z_MIN);
      const angle = phi + WIND * (r - R_REF) + Z_TWIST * (z - Z_MIN);
      const wobble = (rnd() * 2 - 1) * 1.2;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) + wobble, z });
    }
    arcs.push({ points });
  }

  return { pieces, arcs };
}
