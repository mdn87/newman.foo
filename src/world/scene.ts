import * as THREE from 'three';
import { makeSpiralGalaxy } from '../core/galaxy';
import {
  createPlayer,
  forwardVector,
  steerPlayer,
  stepPlayer,
  type PlayerInput,
  type PlayerState,
} from '../core/player';
import type { Vec3 } from '../core/types';
import astronautUrl from '../assets/astronaut-alpha.png';

const BG = 0xffffff;
const CYAN = 0x4ab3d4;
const CYAN_FAINT = 0x9ed8ea;
const STAR = 0x3f94b7;
const ASTRONAUT_ASPECT = 517 / 773;
const ASTRONAUT_HEIGHT = 2.8;
const CAMERA_BACK = 10;
const CAMERA_UP = 3.2;
const CAMERA_LOOK_AHEAD = 18;

const v3 = (v: Vec3) => new THREE.Vector3(v.x, v.y, v.z);

function makeRing(radius: number, segments = 96): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export class WorldScene {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.2, 2000);
  private readonly idle: boolean;
  private readonly astronaut: THREE.Sprite;
  private readonly animated: THREE.Object3D[] = [];
  private player: PlayerState = createPlayer();
  private input: PlayerInput = { forward: 0, right: 0, up: 0 };
  private time = 0;

  constructor(canvas: HTMLCanvasElement, opts: { idle: boolean; seed?: number }) {
    this.idle = opts.idle;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene.background = new THREE.Color(BG);

    const galaxy = makeSpiralGalaxy(opts.seed ?? 1981);

    const starPositions = new Float32Array(galaxy.stars.length * 3);
    galaxy.stars.forEach((star, i) => {
      starPositions[i * 3] = star.pos.x;
      starPositions[i * 3 + 1] = star.pos.y;
      starPositions[i * 3 + 2] = star.pos.z;
    });
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.scene.add(new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: STAR, size: 0.8, sizeAttenuation: true, transparent: true, opacity: 0.75 }),
    ));

    const planetTexture = new THREE.TextureLoader().load('/artwork/galaxy/galaxy-planet.svg');
    planetTexture.colorSpace = THREE.SRGBColorSpace;
    galaxy.planets.forEach((planet, i) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: planetTexture,
        color: new THREE.Color(planet.color),
        transparent: true,
        depthWrite: false,
        fog: false,
      }));
      const h = planet.radius * 2;
      sprite.scale.set(h * (280 / 220), h, 1);
      sprite.position.copy(v3(planet.pos));
      sprite.userData.spin = 0.02 + (i % 5) * 0.005;
      this.animated.push(sprite);
      this.scene.add(sprite);
    });

    galaxy.polyhedra.forEach((poly) => {
      const mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(poly.radius),
        new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.42 }),
      );
      mesh.position.copy(v3(poly.pos));
      mesh.userData.spin = poly.spin;
      this.animated.push(mesh);
      this.scene.add(mesh);
    });

    galaxy.orbits.forEach((orbit) => {
      const line = new THREE.Line(
        makeRing(orbit.radius),
        new THREE.LineBasicMaterial({ color: CYAN_FAINT, transparent: true, opacity: 0.28 }),
      );
      line.position.copy(v3(orbit.center));
      line.rotation.x = orbit.tilt;
      line.rotation.z = orbit.tilt * 0.5;
      this.scene.add(line);
    });

    galaxy.armGuides.forEach((guide) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(guide.points.map(v3)),
        new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.22 }),
      );
      this.scene.add(line);
    });

    const astronautTex = new THREE.TextureLoader().load(astronautUrl);
    astronautTex.colorSpace = THREE.SRGBColorSpace;
    this.astronaut = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: astronautTex, transparent: true, depthWrite: false, depthTest: false, fog: false }),
    );
    this.astronaut.scale.set(ASTRONAUT_HEIGHT * ASTRONAUT_ASPECT, ASTRONAUT_HEIGHT, 1);
    this.astronaut.renderOrder = 10;
    this.scene.add(this.astronaut);

    this.resize();
  }

  resize(): void {
    const w = this.renderer.domElement.clientWidth || innerWidth;
    const h = this.renderer.domElement.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setInput(input: PlayerInput): void {
    this.input = input;
  }

  steer(delta: { dx: number; dy: number }): void {
    this.player = steerPlayer(this.player, delta);
  }

  frame(dt: number): void {
    this.time += dt;
    this.player = stepPlayer(this.player, this.input, dt);

    const forward = v3(forwardVector(this.player.yaw, this.player.pitch)).normalize();
    const position = v3(this.player.position);
    const right = new THREE.Vector3(Math.cos(this.player.yaw), 0, Math.sin(this.player.yaw)).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    const bob = this.idle ? Math.sin(this.time * 1.3) * 0.18 : 0;

    this.camera.position.copy(position)
      .addScaledVector(forward, -CAMERA_BACK)
      .addScaledVector(up, CAMERA_UP + bob);
    this.camera.lookAt(position.clone().addScaledVector(forward, CAMERA_LOOK_AHEAD));

    this.astronaut.position.copy(this.camera.position)
      .addScaledVector(forward, 4.4)
      .addScaledVector(right, -1.1)
      .addScaledVector(up, -0.9);
    this.astronaut.material.rotation = this.idle ? Math.sin(this.time * 0.6) * 0.12 : 0;

    if (this.idle) {
      for (const object of this.animated) {
        if (object instanceof THREE.Sprite) {
          object.material.rotation += dt * (object.userData.spin as number);
        } else {
          const spin = object.userData.spin as Vec3 | undefined;
          object.rotation.x += spin?.x ?? dt * 0.1;
          object.rotation.y += spin?.y ?? dt * 0.12;
          object.rotation.z += spin?.z ?? dt * 0.08;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.scene.traverse((o) => {
      const geometry = (o as { geometry?: THREE.BufferGeometry }).geometry;
      if (geometry) geometry.dispose();

      const material = (o as { material?: THREE.Material | THREE.Material[] }).material;
      const materials = Array.isArray(material) ? material : material ? [material] : [];
      for (const mm of materials) {
        const map = (mm as THREE.Material & { map?: THREE.Texture }).map;
        if (map) map.dispose();
        mm.dispose();
      }
    });
    this.renderer.dispose();
  }
}
