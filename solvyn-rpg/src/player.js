import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

export class PlayerController {
  constructor(camera, colliders, savedPlayer) {
    this.camera = camera;
    this.colliders = colliders;
    this.position = new THREE.Vector3(savedPlayer.x, savedPlayer.y, savedPlayer.z);
    this.yaw = savedPlayer.yaw || 0;
    this.pitch = savedPlayer.pitch || 0;
    this.velocityY = 0;
    this.grounded = true;
    this.radius = 0.38;
    this.eyeHeight = 1.68;
    this.keys = new Set();
    this.locked = false;
    this.bob = 0;
    this.walking = false;

    camera.rotation.order = "YXZ";
    this.syncCamera();

    addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "Space" && this.grounded) {
        this.velocityY = 5.4;
        this.grounded = false;
      }
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0021;
      this.pitch -= e.movementY * 0.0018;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.28, 1.28);
    });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === document.body;
    });
  }

  requestLock() {
    document.body.requestPointerLock?.();
  }

  collides(x, z) {
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      const nx = Math.max(c.minX, Math.min(x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - nx;
      const dz = z - nz;
      if (dx * dx + dz * dz < this.radius * this.radius) return true;
    }
    return false;
  }

  update(dt) {
    const forward = (this.keys.has("KeyW") ? 1 : 0) - (this.keys.has("KeyS") ? 1 : 0);
    const strafe = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
    const moving = forward !== 0 || strafe !== 0;
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const speed = sprint ? 7.0 : 4.25;

    if (moving) {
      const length = Math.hypot(forward, strafe) || 1;
      const f = forward / length;
      const s = strafe / length;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const dx = (s * cos - f * sin) * speed * dt;
      const dz = (-f * cos - s * sin) * speed * dt;

      const tx = this.position.x + dx;
      if (!this.collides(tx, this.position.z)) this.position.x = tx;
      const tz = this.position.z + dz;
      if (!this.collides(this.position.x, tz)) this.position.z = tz;

      this.bob += dt * (sprint ? 12 : 9);
    }

    this.velocityY -= 13.5 * dt;
    this.position.y += this.velocityY * dt;
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocityY = 0;
      this.grounded = true;
    }

    this.walking = moving && this.grounded;
    this.syncCamera();
  }

  syncCamera() {
    const bobY = this.walking ? Math.sin(this.bob) * 0.025 : 0;
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight + bobY, this.position.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  snapshot() {
    return {
      x: Number(this.position.x.toFixed(3)),
      y: Number(this.position.y.toFixed(3)),
      z: Number(this.position.z.toFixed(3)),
      yaw: Number(this.yaw.toFixed(4)),
      pitch: Number(this.pitch.toFixed(4))
    };
  }
}
