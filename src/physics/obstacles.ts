import type { Vec3 } from '../core/types';
import type { ObstacleSpec } from '../core/field';

type Rapier = typeof import('@dimforge/rapier3d');
type World = InstanceType<Rapier['World']>;
type RigidBody = ReturnType<World['createRigidBody']>;

const RESTITUTION = 0.6;
const LIN_DAMP = 0.8;
const ANG_DAMP = 0.8;

/**
 * Dynamic obstacle bodies in a shared Rapier World. Each is a ball with mass set
 * SOLELY by setAdditionalMass (collider density 0), so Rapier's momentum exchange
 * with the dart depends only on the spec masses. Damped so a knocked obstacle
 * drifts then settles.
 */
export class Obstacles {
  private readonly bodies: RigidBody[] = [];

  constructor(RAPIER: Rapier, world: World, specs: ObstacleSpec[]) {
    for (const s of specs) {
      const desc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(s.pos.x, s.pos.y, s.pos.z)
        .setLinearDamping(LIN_DAMP)
        .setAngularDamping(ANG_DAMP)
        .setAdditionalMass(s.mass);
      const body = world.createRigidBody(desc);
      const col = RAPIER.ColliderDesc.ball(s.radius).setRestitution(RESTITUTION).setDensity(0);
      world.createCollider(col, body);
      this.bodies.push(body);
    }
  }

  /** Live positions, index-aligned to the specs passed in. */
  states(): { pos: Vec3 }[] {
    return this.bodies.map((b) => {
      const t = b.translation();
      return { pos: { x: t.x, y: t.y, z: t.z } };
    });
  }
}
