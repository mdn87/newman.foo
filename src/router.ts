import type { NodeDef } from './core/types';

export type Surface = 'world' | 'list';

export function routeToIndex(pathname: string, nodes: NodeDef[]): number | null {
  const clean = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const i = nodes.findIndex((n) => n.route === clean);
  return i === -1 ? null : i;
}

export interface SurfaceInputs {
  forced: Surface | null;
  reducedMotion: boolean;
  webgl: boolean;
}

/** Spec rule: forced wins; reduced motion -> list; no WebGL -> list; else world. */
export function chooseSurface(s: SurfaceInputs): Surface {
  if (s.forced) return s.forced;
  if (s.reducedMotion) return 'list';
  if (!s.webgl) return 'list';
  return 'world';
}

export function detectWebgl(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}
