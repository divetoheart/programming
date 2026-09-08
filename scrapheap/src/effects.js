import * as THREE from 'three';
import { material } from './arena.js';
import { CONFIG, PALETTE } from './config.js';

export class Effects {
  constructor(scene, camera) { this.scene = scene; this.camera = camera; this.bits = []; this.shake = 0; this.flashLight = new THREE.PointLight(PALETTE.rust, 0, 9); scene.add(this.flashLight); }
  burst(position, color = PALETTE.blood, amount = 12, speed = 6) {
    const remaining = Math.max(0, CONFIG.quality.maxParticles - this.bits.length); amount = Math.min(amount, remaining);
    for (let i = 0; i < amount; i++) {
      const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(.055 + Math.random() * .085), material(color, .85));
      mesh.position.copy(position); mesh.userData.velocity = new THREE.Vector3((Math.random() - .5) * speed, Math.random() * speed * .8, (Math.random() - .5) * speed); mesh.userData.life = .5 + Math.random() * .55; this.scene.add(mesh); this.bits.push(mesh);
    }
    this.flashLight.position.copy(position); this.flashLight.intensity = 7;
  }
  impact(position, heavy = false) { this.burst(position, heavy ? PALETTE.blood : 0xd9953c, heavy ? 22 : 10, heavy ? 9 : 5); this.shake = Math.max(this.shake, heavy ? .28 : .12); }
  dust(position) { this.burst(position, 0x75624c, 5, 2); }
  update(dt) {
    this.flashLight.intensity *= Math.pow(.02, dt);
    for (let i = this.bits.length - 1; i >= 0; i--) { const p = this.bits[i]; p.userData.life -= dt; p.userData.velocity.y -= 13 * dt; p.position.addScaledVector(p.userData.velocity, dt); p.rotation.x += dt * 7; if (p.position.y < .04) { p.position.y = .04; p.userData.velocity.y *= -.22; p.userData.velocity.x *= .65; p.userData.velocity.z *= .65; } p.scale.setScalar(Math.min(1, p.userData.life * 4)); if (p.userData.life <= 0) { this.scene.remove(p); this.bits.splice(i, 1); } }
    this.shake *= Math.pow(.025, dt); return this.shake;
  }
}
