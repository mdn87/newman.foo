import './hud.css';
import type { ThemeName } from '../core/theme';

const sign = (n: number) => (n >= 0 ? '+' : '-') + String(Math.round(Math.abs(n))).padStart(3, '0');
const compact = (n: number) => String(Number(n.toFixed(2)));
const degrees = (radians: number) => compact((radians * 180) / Math.PI);

/** Default line-grid edge (spacing 90 / extent 700); wire.ts passes GRID_EDGE explicitly. */
const LEGACY_EDGE = 630;

export interface FlightNavigation {
  speed: number;
  position: { x: number; y: number; z: number };
  heading: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  wrapped: boolean;
}

export interface FlightHudOpts {
  theme?: ThemeName;
  onThemeToggle?: () => void;
  edge?: number;
}

/**
 * Flat, DOM-native flight instruments: a top-down minimap, a gimbal compass,
 * and a fixed telemetry panel (speed, wrapped XYZ, GRID WRAP cue). The root is
 * constructed once per flight; updates mutate existing nodes in place.
 */
export class FlightHud {
  private readonly root: HTMLElement;
  private readonly edge: number;
  private readonly speedEl: HTMLElement;
  private readonly xyzEl: HTMLElement;
  private readonly wrapEl: HTMLElement;
  private readonly markerEl: HTMLElement;
  private readonly vectorEl: HTMLElement;
  private readonly compassBandEl: HTMLElement;
  private readonly gimbalEl: HTMLElement;
  private readonly toggleEl: HTMLElement;

  constructor(root: HTMLElement, opts?: FlightHudOpts) {
    this.root = root;
    this.edge = opts?.edge ?? LEGACY_EDGE;
    root.innerHTML = `
      <div class="hud-brand"><span class="hi">HI.</span> <span class="name">I'm Matt</span></div>
      <nav class="hud-nav" aria-label="Mode"><a href="#" class="theme-toggle" role="button"></a><a href="?mode=list">[ list ]</a></nav>
      <section class="flight-minimap" aria-label="Top-down navigation map">
        <div class="flight-minimap-grid" aria-hidden="true"></div>
        <span class="flight-minimap-vector" aria-hidden="true"></span>
        <span class="flight-minimap-marker" aria-hidden="true"></span>
      </section>
      <section class="flight-compass" aria-label="Heading and attitude">
        <div class="flight-compass-band" aria-hidden="true"><span>W</span><span>N</span><span>E</span><span>S</span></div>
        <div class="flight-gimbal" aria-hidden="true"><span></span></div>
        <span class="flight-compass-cue" aria-hidden="true"></span>
      </section>
      <section class="flight-telemetry" aria-label="Flight telemetry">
        <span class="flight-speed">0 u/s</span>
        <span class="flight-xyz">X +000  Y +000  Z +000</span>
        <span class="flight-wrap">GRID OK</span>
        <span class="flight-controls">WASD / arrows move · drag to steer · right-click boost · Esc list</span>
      </section>`;

    this.speedEl = root.querySelector('.flight-speed')!;
    this.xyzEl = root.querySelector('.flight-xyz')!;
    this.wrapEl = root.querySelector('.flight-wrap')!;
    this.markerEl = root.querySelector('.flight-minimap-marker')!;
    this.vectorEl = root.querySelector('.flight-minimap-vector')!;
    this.compassBandEl = root.querySelector('.flight-compass-band')!;
    this.gimbalEl = root.querySelector('.flight-gimbal')!;
    this.toggleEl = root.querySelector('.theme-toggle')!;
    this.setTheme(opts?.theme ?? 'light');
    (this.toggleEl as HTMLElement & { onclick: ((e: { preventDefault?: () => void }) => void) | null }).onclick =
      (e) => { e.preventDefault?.(); opts?.onThemeToggle?.(); };
  }

  /** Per-frame navigation update: telemetry text, minimap marker/vector, compass band/gimbal. */
  setNavigation(navigation: FlightNavigation): void {
    const { speed, position, heading, yaw, pitch, wrapped } = navigation;
    const mapX = this.mapPercent(position.x);
    const mapY = this.mapPercent(-position.z);
    const angle = Math.atan2(heading.x, heading.z);

    this.speedEl.textContent = `${Math.round(speed)} u/s`;
    this.xyzEl.textContent = `X ${sign(position.x)}  Y ${sign(position.y)}  Z ${sign(position.z)}`;
    this.markerEl.style.left = `${compact(mapX)}%`;
    this.markerEl.style.top = `${compact(mapY)}%`;
    this.markerEl.style.transform = 'translate(-50%, -50%)';
    this.vectorEl.style.transform = `rotate(${degrees(angle)}deg)`;
    this.vectorEl.style.left = `${compact(mapX)}%`;
    this.vectorEl.style.top = `${compact(mapY)}%`;
    // Yaw accumulates unbounded across full revolutions (integrateFacing never
    // normalizes); wrap it into ±π here or the cardinal band slides out of its
    // overflow window after ~one full turn and the compass goes blank.
    const TWO_PI = Math.PI * 2;
    const bandYaw = ((yaw + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
    this.compassBandEl.style.transform = `translateX(${compact(-bandYaw * 18)}%)`;
    this.gimbalEl.style.transform = `translateX(-50%) rotate(${degrees(pitch)}deg)`;

    this.wrapEl.textContent = wrapped ? 'GRID WRAP' : 'GRID OK';
    if (wrapped) this.wrapEl.classList.add('is-wrapped');
    else this.wrapEl.classList.remove('is-wrapped');
  }

  setSpeed(speed: number): void {
    this.speedEl.textContent = `${Math.round(speed)} u/s`;
  }


  /** Label shows the theme you'd switch TO ([ dark ] while light is active). */
  setTheme(name: ThemeName): void {
    this.toggleEl.textContent = name === 'light' ? '[ dark ]' : '[ light ]';
  }

  dispose(): void {
    this.root.replaceChildren();
  }

  private mapPercent(value: number): number {
    const normalized = (value + this.edge) / (this.edge * 2);
    return Math.max(10, Math.min(90, 10 + normalized * 80));
  }
}
