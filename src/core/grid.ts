export const GRID_MAX_POINTS = 20000;

/** Regular x/y/z dot lattice filling the flyable volume. Flat xyz Float32Array. */
export function makeDotGrid(opts: { spacing?: number; extent?: number } = {}): Float32Array {
  const spacing = opts.spacing ?? 26;
  const extent = opts.extent ?? 260;
  const n = Math.floor(extent / spacing);
  const side = 2 * n + 1;
  const total = side * side * side;
  if (total > GRID_MAX_POINTS) throw new Error(`grid too dense: ${total} > ${GRID_MAX_POINTS}`);
  const out = new Float32Array(total * 3);
  let k = 0;
  for (let ix = -n; ix <= n; ix++)
    for (let iy = -n; iy <= n; iy++)
      for (let iz = -n; iz <= n; iz++) {
        out[k++] = ix * spacing; out[k++] = iy * spacing; out[k++] = iz * spacing;
      }
  return out;
}
