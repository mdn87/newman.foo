import { describe, expect, it } from 'vitest';
import { NODES } from '../src/content/nodes';
import { chooseSurface, routeToIndex } from '../src/router';

describe('routeToIndex', () => {
  it('maps every route to its node', () => {
    NODES.forEach((n, i) => expect(routeToIndex(n.route, NODES)).toBe(i));
  });

  it('unknown routes map to null', () => {
    expect(routeToIndex('/nope', NODES)).toBe(null);
  });
});

describe('chooseSurface (authoritative reduced-motion rule)', () => {
  it('forced mode always wins', () => {
    expect(chooseSurface({ forced: 'world', reducedMotion: true, webgl: false })).toBe('world');
    expect(chooseSurface({ forced: 'list', reducedMotion: false, webgl: true })).toBe('list');
  });

  it('reduced motion defaults to list', () => {
    expect(chooseSurface({ forced: null, reducedMotion: true, webgl: true })).toBe('list');
  });

  it('no webgl falls back to list', () => {
    expect(chooseSurface({ forced: null, reducedMotion: false, webgl: false })).toBe('list');
  });

  it('otherwise world', () => {
    expect(chooseSurface({ forced: null, reducedMotion: false, webgl: true })).toBe('world');
  });
});
