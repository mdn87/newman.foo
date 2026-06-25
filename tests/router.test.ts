import { describe, expect, it } from 'vitest';
import { chooseSurface, isRootPath } from '../src/router';

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

describe('isRootPath', () => {
  it('recognizes the root route only', () => {
    expect(isRootPath('/')).toBe(true);
    expect(isRootPath('')).toBe(true);
    expect(isRootPath('/missions/agent-ops')).toBe(false);
  });
});
