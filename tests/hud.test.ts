import { describe, expect, it, vi } from 'vitest';
import { SITE } from '../src/content/nodes';
import { Hud } from '../src/hud/hud';

class FakeElement {
  innerHTML = '';
  textContent = '';
  private readonly children = new Map<string, FakeElement>();

  replaceChildren = vi.fn(() => {
    this.innerHTML = '';
    this.textContent = '';
    this.children.clear();
  });

  querySelector(selector: string): FakeElement {
    const existing = this.children.get(selector);
    if (existing) return existing;
    const child = new FakeElement();
    this.children.set(selector, child);
    return child;
  }
}

describe('Hud', () => {
  it('setStatus updates the game HUD status', () => {
    const root = new FakeElement();
    const hud = new Hud(root as unknown as HTMLElement, SITE);

    hud.setStatus('DRIFT READY');

    expect(root.innerHTML).toContain('newman.foo');
    expect(root.innerHTML).toContain('WASD');
    expect(root.querySelector('.game-hud-status').textContent).toBe('DRIFT READY');

    hud.dispose();
    expect(root.replaceChildren).toHaveBeenCalledTimes(1);
  });
});
