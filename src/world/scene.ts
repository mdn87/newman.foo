// src/world/scene.ts
import * as THREE from 'three';
import type { FlightState } from '../core/flight';
import type { Vec3 } from '../core/types';
import { makeSpiralGalaxy } from '../core/galaxy';
import { makeDotGrid } from '../core/grid';
import { makeVolumeBodies } from '../core/parallax';
import astronautUrl from '../assets/astronaut-alpha.png';

// galaxy-thruster.svg lives in public/ — reference it by URL, never `import` it.
const THRUSTER_URL = '/artwork/galaxy/galaxy-thruster.svg';
const BG = 0xffffff;
const ASTRONAUT_ASPECT = 517 / 773, ASTRONAUT_HEIGHT = 2.6;
const THRUSTER_ASPECT = 80 / 120;
const CAM_BACK = 10, CAM_UP = 3.2, CAM_LAG = 4, LOOK_AHEAD = 8;
const GALAXY_SPIN = 0.015; // rad/s, top-down (about y)
const EXTENT = 260;        // matches flight bound

const v = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);

/** Custom point shader: per-vertex size + alpha, soft round mask, dark-on-white. */
function pointsMaterial(square: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uPixelRatio: { value: Math.min(devicePixelRatio, 2) }, uAvatar: { value: new THREE.Vector3() }, uFade: { value: 320 } },
    vertexShader: `
      attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
      varying float vAlpha; varying vec3 vColor;
      uniform float uPixelRatio; uniform vec3 uAvatar; uniform float uFade;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float fade = clamp(1.0 - distance(position, uAvatar) / uFade, 0.0, 1.0);
        vAlpha = aAlpha * (uFade > 0.0 ? fade : 1.0);
        gl_PointSize = min(aSize * uPixelRatio * (120.0 / max(-mv.z, 1.0)), 26.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vAlpha; varying vec3 vColor;
      void main() {
        ${square
          ? 'float mask = 1.0;'
          : 'float r = length(gl_PointCoord - vec2(0.5)); float mask = 1.0 - smoothstep(0.18, 0.5, r); if (mask <= 0.0) discard;'}
        gl_FragColor = vec4(vColor, vAlpha * mask);
      }`,
  });
}

function setAttrs(geom: THREE.BufferGeometry, pos: Float32Array, size: Float32Array, alpha: Float32Array, color: Float32Array) {
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geom.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geom.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
}

export class WorldScene {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly galaxy: THREE.Points;
  private readonly grid: THREE.Points;
  private readonly squares: THREE.Points;
  private readonly avatar: THREE.Sprite;
  private readonly thruster: THREE.Sprite;
  private readonly gridMat: THREE.ShaderMaterial;
  private readonly squareMat: THREE.ShaderMaterial;
  private readonly camPos = new THREE.Vector3(0, CAM_UP, -CAM_BACK);
  private readonly lookAt = new THREE.Vector3(0, 0, 0);

  constructor(canvas: HTMLCanvasElement, opts: { seed?: number } = {}) {
    const seed = opts.seed ?? 1981;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene.background = new THREE.Color(BG);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.3, 4000);

    // Galaxy (round points, no distance fade).
    const gf = makeSpiralGalaxy(seed, {});
    const gg = new THREE.BufferGeometry();
    setAttrs(gg, gf.positions, gf.sizes, gf.alphas, gf.colors);
    const galaxyMat = pointsMaterial(false);
    galaxyMat.uniforms.uFade!.value = 0; // galaxy never fades by distance
    this.galaxy = new THREE.Points(gg, galaxyMat);
    this.scene.add(this.galaxy);

    // Dot grid (round, faint cyan, fades with distance).
    const gpos = makeDotGrid({});
    const gn = gpos.length / 3;
    const gsize = new Float32Array(gn).fill(1.1);
    const galpha = new Float32Array(gn).fill(0.5);
    const gcol = new Float32Array(gn * 3);
    for (let i = 0; i < gn; i++) { gcol[i * 3] = 0x4a / 255; gcol[i * 3 + 1] = 0xb3 / 255; gcol[i * 3 + 2] = 0xd4 / 255; }
    const gridGeom = new THREE.BufferGeometry();
    setAttrs(gridGeom, gpos, gsize, galpha, gcol);
    this.gridMat = pointsMaterial(false);
    this.grid = new THREE.Points(gridGeom, this.gridMat);
    this.scene.add(this.grid);

    // Depth squares (square points, varied size, faint, distance fade).
    const bodies = makeVolumeBodies(seed ^ 0x9e37, { extent: EXTENT });
    const sn = bodies.length;
    const spos = new Float32Array(sn * 3), ssize = new Float32Array(sn), salpha = new Float32Array(sn), scol = new Float32Array(sn * 3);
    bodies.forEach((b, i) => {
      spos[i * 3] = b.pos.x; spos[i * 3 + 1] = b.pos.y; spos[i * 3 + 2] = b.pos.z;
      ssize[i] = b.size; salpha[i] = 0.22;
      scol[i * 3] = 0x4a / 255; scol[i * 3 + 1] = 0xb3 / 255; scol[i * 3 + 2] = 0xd4 / 255;
    });
    const sqGeom = new THREE.BufferGeometry();
    setAttrs(sqGeom, spos, ssize, salpha, scol);
    this.squareMat = pointsMaterial(true);
    this.squares = new THREE.Points(sqGeom, this.squareMat);
    this.scene.add(this.squares);

    // Avatar + thruster.
    const aTex = new THREE.TextureLoader().load(astronautUrl); aTex.colorSpace = THREE.SRGBColorSpace;
    this.avatar = new THREE.Sprite(new THREE.SpriteMaterial({ map: aTex, transparent: true, depthWrite: false, depthTest: false }));
    this.avatar.scale.set(ASTRONAUT_HEIGHT * ASTRONAUT_ASPECT, ASTRONAUT_HEIGHT, 1);
    this.avatar.renderOrder = 10;
    this.scene.add(this.avatar);

    const tTex = new THREE.TextureLoader().load(THRUSTER_URL); tTex.colorSpace = THREE.SRGBColorSpace;
    this.thruster = new THREE.Sprite(new THREE.SpriteMaterial({ map: tTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
    this.thruster.renderOrder = 9; this.thruster.visible = false;
    this.scene.add(this.thruster);

    this.resize();
  }

  resize(): void {
    const w = this.renderer.domElement.clientWidth || innerWidth;
    const h = this.renderer.domElement.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  frame(dt: number, flight: FlightState): void {
    const pos = v(flight.position);
    const head = v(flight.heading).normalize();

    // Follow-cam: trail behind + above, lerped so it banks through turns.
    const want = pos.clone().addScaledVector(head, -CAM_BACK).add(new THREE.Vector3(0, CAM_UP, 0));
    const a = 1 - Math.exp(-CAM_LAG * dt);
    this.camPos.lerp(want, a);
    this.lookAt.lerp(pos.clone().addScaledVector(head, LOOK_AHEAD), a);
    this.camera.position.copy(this.camPos);
    this.camera.up.set(Math.sin(flight.bank), Math.cos(flight.bank), 0); // roll into turns
    this.camera.lookAt(this.lookAt);

    // Avatar pinned at flight position, rolled by bank.
    this.avatar.position.copy(pos);
    this.avatar.material.rotation = flight.bank;

    // Thruster behind/under the avatar, scaled by throttle.
    const thrust = flight.throttle;
    if (thrust > 0.02) {
      const camUp = this.camera.up.clone().normalize();
      const flameH = ASTRONAUT_HEIGHT * (0.5 + 1.25 * thrust);
      this.thruster.scale.set(flameH * THRUSTER_ASPECT, flameH, 1);
      this.thruster.position.copy(pos)
        .addScaledVector(camUp, -(ASTRONAUT_HEIGHT * 0.42 + flameH * 0.5))
        .addScaledVector(head, -0.4 * thrust);
      this.thruster.material.opacity = 0.4 + 0.55 * thrust;
      this.thruster.visible = true;
    } else {
      this.thruster.visible = false;
    }

    // Galaxy turns slowly; grid/squares fade around the avatar.
    this.galaxy.rotation.y += dt * GALAXY_SPIN;
    this.gridMat.uniforms.uAvatar!.value.copy(pos);
    this.squareMat.uniforms.uAvatar!.value.copy(pos);

    this.renderer.render(this.scene, this.camera);
  }

  /** Avatar's screen position + world coords, for the floating position readout. */
  readout(): { x: number; y: number; pos: Vec3; visible: boolean } {
    const el = this.renderer.domElement;
    const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
    const ndc = this.avatar.position.clone().project(this.camera);
    return {
      x: (ndc.x * 0.5 + 0.5) * w,
      y: (-ndc.y * 0.5 + 0.5) * h,
      pos: { x: this.avatar.position.x, y: this.avatar.position.y, z: this.avatar.position.z },
      visible: ndc.z < 1,
    };
  }

  dispose(): void {
    const geoms = new Set<THREE.BufferGeometry>(), mats = new Set<THREE.Material>(), texs = new Set<THREE.Texture>();
    this.scene.traverse((o) => {
      const g = (o as { geometry?: THREE.BufferGeometry }).geometry; if (g) geoms.add(g);
      const m = (o as { material?: THREE.Material | THREE.Material[] }).material;
      for (const mm of Array.isArray(m) ? m : m ? [m] : []) {
        mats.add(mm);
        const map = (mm as THREE.Material & { map?: THREE.Texture }).map; if (map) texs.add(map);
      }
    });
    for (const g of geoms) g.dispose();
    for (const t of texs) t.dispose();
    for (const m of mats) m.dispose();
    this.renderer.dispose();
  }
}
