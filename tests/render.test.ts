import { describe, expect, it } from 'vitest';
import { SITE } from '../src/content/nodes';
import { renderFallbackPage } from '../src/fallback/render';

describe('renderFallbackPage', () => {
  it('renders minimal newman.foo fallback copy and world opt-in', () => {
    const html = renderFallbackPage(SITE);

    expect(html).toContain('<h1 id="fallback-title">newman.foo</h1>');
    expect(html).toContain('<section class="fallback-shell"');
    expect(html).toContain('spiral drift prototype');
    expect(html).toContain('href="/?mode=world"');
    expect(html).not.toContain('<main');
    expect(html).not.toContain('Mission');
    expect(html).not.toContain(['NO', 'DE'].join(''));
  });
});
