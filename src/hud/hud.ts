import type { FallbackSite } from '../fallback/render';
import './hud.css';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class Hud {
  private readonly root: HTMLElement;
  private status: HTMLElement | null = null;

  constructor(root: HTMLElement, site: FallbackSite) {
    this.root = root;
    root.innerHTML = `
      <div class="game-hud">
        <div class="game-hud-title">${esc(site.title)}</div>
        <div class="game-hud-status">${esc(site.status)}</div>
        <div class="game-hud-hints">WASD/Arrows thrust - Space/Shift vertical - drag/touch steer</div>
      </div>`;
    this.status = root.querySelector('.game-hud-status');
  }

  dispose(): void {
    this.root.replaceChildren();
    this.status = null;
  }

  setStatus(text: string): void {
    if (this.status) this.status.textContent = text;
  }
}
