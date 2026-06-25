import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { prerender, routeOutFile } from '../scripts/prerender';
import { SITE } from '../src/content/nodes';

const TEMPLATE = `<!doctype html><html><head><title>X</title>
<link rel="canonical" href="https://example.test/" />
</head><body><main id="content"><!--SSG--></main></body></html>`;

describe('prerender', () => {
  it('emits only the root page', () => {
    expect(Object.keys(prerender(TEMPLATE, SITE))).toEqual(['/']);
  });

  it('injects the fallback HTML into #content', () => {
    const pages = prerender(TEMPLATE, SITE);

    expect(pages['/']).toContain('<title>newman.foo</title>');
    expect(pages['/']).toContain('<h1 id="fallback-title">newman.foo</h1>');
    expect(pages['/']).toContain('<main id="content"><section class="fallback-shell"');
    expect(pages['/']).not.toContain('<main id="content"><main');
    expect(pages['/']).toContain('href="https://newman.foo/"');
    expect(pages['/']).not.toContain('<!--SSG-->');
  });
});

describe('routeOutFile', () => {
  const dist = resolve('dist');

  it('maps the root route to index.html', () => {
    expect(routeOutFile('/', dist)).toBe(resolve(dist, 'index.html'));
  });

  it('rejects non-root route paths', () => {
    for (const route of ['/missions/agent-ops', '/contact', 'missions/agent-ops']) {
      expect(() => routeOutFile(route, dist)).toThrow();
    }
  });
});
