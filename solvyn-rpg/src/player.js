import * as THREE from "three";

export class PlayerController {
  constructor(camera, world, savedPlayer, lockElement) {
    this.camera = camera;
    this.world = world;
    this.colliders = world.colliders;
    this.lockElement = lockElement;
    this.position = new THREE.Vector3(savedPlayer.x, savedPlayer.y, savedPlayer.z);
    this.yaw = savedPlayer.yaw || 0;
    this.pitch = savedPlayer.pitch || 0;
    this.velocity = new THREE.Vector2();
    this.velocityY = 0;
    this.grounded = true;
    this.radius = 0.38;
    this.eyeHeight = 1.7;
    this.keys = new Set();
    this.locked = false;
    this.bob = 0;
    this.stepPhase = 0;
    this.stepPending = false;
    this.speed01 = 0;
    this.sprinting = false;
    this.baseFov = camera.fov;

    camera.rotation.order = "YXZ";
    this.syncCamera();

    addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "Space" && this.grounded && this.locked) {
        this.velocityY = 5.25;
        this.grounded = false;
      }
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.00195;
      this.pitch -= e.movementY * 0.00172;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.22, 1.18);
    });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.lockElement;
      if (!this.locked) this.keys.clear();
    });
  }

  requestLock() {
    this.lockElement.requestPointerLock?.();
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
    this.sprinting = moving && (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight"));

    let targetX = 0;
    let targetZ = 0;
    if (moving) {
      const length = Math.hypot(forward, strafe) || 1;
      const f = forward / length;
      const s = strafe / length;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const speed = this.sprinting ? 6.65 : 4.15;
      targetX = (s * cos - f * sin) * speed;
      targetZ = (-f * cos - s * sin) * speed;
    }

    const responsiveness = moving ? 11.5 : 8.5;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetX, responsiveness, dt);
    this.velocity.y = THREE.MathUtils.damp(this.velocity.y, targetZ, responsiveness, dt);

    const tx = this.position.x + this.velocity.x * dt;
    if (!this.collides(tx, this.position.z)) this.position.x = tx;
    else this.velocity.x = 0;

    const tz = this.position.z + this.velocity.y * dt;
    if (!this.collides(this.position.x, tz)) this.position.z = tz;
    else this.velocity.y = 0;

    this.velocityY -= 13.2 * dt;
    this.position.y += this.velocityY * dt;
    const ground = this.world.groundHeight?.(this.position.x, this.position.z) ?? 0;
    if (this.position.y <= ground) {
      this.position.y = ground;
      this.velocityY = 0;
      this.grounded = true;
    }

    const planarSpeed = this.velocity.length();
    this.speed01 = THREE.MathUtils.clamp(planarSpeed / 6.65, 0, 1);
    if (this.grounded && planarSpeed > .55) {
      const bobRate = this.sprinting ? 12.5 : 9.2;
      const previous = Math.floor(this.stepPhase / Math.PI);
      this.stepPhase += dt * bobRate;
      const next = Math.floor(this.stepPhase / Math.PI);
      if (next !== previous) this.stepPending = true;
      this.bob += dt * bobRate;
    }

    const targetFov = this.sprinting ? this.baseFov + 3.3 : this.baseFov;
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5.5, dt);
    if (Math.abs(nextFov - this.camera.fov) > .01) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
    this.syncCamera();
  }

  consumeStep() {
    if (!this.stepPending) return false;
    this.stepPending = false;
    return true;
  }

  syncCamera() {
    const moving = this.grounded && this.speed01 > .08;
    const bobY = moving ? Math.sin(this.bob) * (0.018 + this.speed01 * .012) : 0;
    const bobX = moving ? Math.cos(this.bob * .5) * .008 * this.speed01 : 0;
    this.camera.position.set(this.position.x + bobX, this.position.y + this.eyeHeight + bobY, this.position.z);
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
