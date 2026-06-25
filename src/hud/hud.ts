import type { NodeDef } from '../core/types';
import type { SITE } from '../content/nodes';
import type { FallbackSite } from '../fallback/render';
import logoUrl from '../assets/logo.png';
import './hud.css';

const pad = (n: number) => String(n).padStart(2, '0');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Floating node title: how it animates out from the planet as focus 0 -> 1.
const LABEL_MARGIN = 18; // px gap from the planet at rest
const LABEL_EMERGE = 48; // px it slides outward while appearing
const LABEL_RISE = 26;   // px it lifts while appearing

/** DOM overlay adapter: console strip + node panel. Real HTML, never canvas text. */
export class Hud {
  private readonly root: HTMLElement;
  private strip: HTMLElement | null = null;
  private status: HTMLElement | null = null;
  private hint: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private readonly nodes: NodeDef[] = [];
  private readonly oldMode: boolean;
  private currentKey: string | null = null;
  private labelEls: HTMLElement[] | null = null;

  constructor(root: HTMLElement, nodes: NodeDef[], site: typeof SITE);
  constructor(root: HTMLElement, site: FallbackSite);
  constructor(root: HTMLElement, a: NodeDef[] | FallbackSite, b?: typeof SITE) {
    this.root = root;
    const oldMode = Array.isArray(a);
    this.oldMode = oldMode;
    if (!oldMode) {
      root.innerHTML = `
      <div class="hud">
        <div class="hud-title">${esc(a.title)}</div>
        <div class="hud-status">${esc(a.status)}</div>
        <div class="hud-hints">WASD/Arrows thrust - Space/Shift vertical - drag/touch steer</div>
      </div>`;
      this.status = root.querySelector('.hud-status');
      return;
    }
    const nodes = a;
    const site = b!;
    this.nodes = nodes;
    root.innerHTML = `
      <div class="hud-labels" aria-hidden="true">${nodes.map((n) => `<span class="node-label">${esc(n.title)}</span>`).join('')}</div>
      <div class="hud-brand"><img class="hud-logo" src="${logoUrl}" alt="" /><span class="hi">HI.</span> <span class="name">I’m Matt</span> <span class="joke"></span></div>
      <nav class="hud-nav" aria-label="Mode">
        <a href="?mode=list">[ list ]</a>
      </nav>
      <div class="hud-panel" aria-live="polite"><h2></h2><p class="tagline"></p><div class="body"></div></div>
      <div class="hud-strip"><span class="status" aria-live="polite"></span><span class="hint"></span></div>`;
    root.querySelector('.joke')!.textContent = site.joke;
    this.strip = root.querySelector('.hud-strip');
    this.status = root.querySelector('.status');
    this.hint = root.querySelector('.hint');
    this.panel = root.querySelector('.hud-panel');
  }

  dispose(): void {
    this.root.replaceChildren();
    this.currentKey = null;
    this.labelEls = null;
  }

  /**
   * Position the per-node floating titles. Each animates out from its planet
   * (slides outward + lifts + fades) as its focus rises toward 1 on approach.
   */
  setLabels(layout: { x: number; y: number; focus: number; visible: boolean }[]): void {
    if (!this.oldMode) return;
    if (!this.labelEls) {
      this.labelEls = Array.from(this.root.querySelectorAll('.node-label')) as HTMLElement[];
    }
    for (let i = 0; i < this.labelEls.length; i++) {
      const el = this.labelEls[i]!;
      const l = layout[i];
      if (!l || !l.visible) { el.style.opacity = '0'; continue; }
      const tx = l.x - (LABEL_MARGIN + LABEL_EMERGE * l.focus);
      const ty = l.y - LABEL_RISE * l.focus;
      el.style.transform = `translate(-100%, -50%) translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${(0.85 + 0.15 * l.focus).toFixed(3)})`;
      el.style.opacity = l.focus.toFixed(3);
    }
  }

  setStatus(text: string): void {
    if (!this.oldMode && this.status) this.status.textContent = text;
  }

  setAtNode(index: number): void {
    if (!this.oldMode || !this.status || !this.hint || !this.panel) return;
    const key = `node:${index}`;
    if (this.currentKey === key) return;
    this.currentKey = key;
    const n = this.nodes[index]!;
    this.status.textContent = `NODE ${pad(index + 1)}/${pad(this.nodes.length)} · ${n.title.toUpperCase()}`;
    this.hint.textContent = 'scroll ↓ advance · ↑ back · click a planet';
    this.panel.removeAttribute('hidden');
    this.panel.querySelector('h2')!.textContent = n.title;
    (this.panel.querySelector('.tagline') as HTMLElement).textContent = n.tagline;
    (this.panel.querySelector('.body') as HTMLElement).innerHTML = n.body;
  }

  setTransit(to: number): void {
    if (!this.oldMode || !this.status || !this.hint || !this.panel) return;
    const key = `transit:${to}`;
    if (this.currentKey === key) return;
    this.currentKey = key;
    this.status.textContent = to < 0
      ? '▸ STAR MAP'
      : `▸ EN ROUTE: ${this.nodes[to]!.title.toUpperCase()}`;
    this.hint.textContent = '';
    this.panel.setAttribute('hidden', '');
  }

  /** The zoomed-back galaxy overview: no node panel, just the map prompt. */
  setOverview(): void {
    if (!this.oldMode || !this.status || !this.hint || !this.panel) return;
    const key = 'overview';
    if (this.currentKey === key) return;
    this.currentKey = key;
    this.status.textContent = `★ STAR MAP · ${pad(this.nodes.length)} MISSIONS`;
    this.hint.textContent = 'scroll ↓ to enter · click a planet';
    this.panel.setAttribute('hidden', '');
  }
}
