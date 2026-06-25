export interface Vec3 { x: number; y: number; z: number; }

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  yaw: number;
  pitch: number;
}

export interface PlayerInput {
  forward: number;
  right: number;
  up: number;
}
