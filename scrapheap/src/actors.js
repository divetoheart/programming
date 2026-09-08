import * as THREE from 'three';
import { material } from './arena.js';
import { PALETTE, WEAPONS } from './config.js';

const geo = {
  torso: new THREE.BoxGeometry(.76, 1.02, .45), pelvis: new THREE.BoxGeometry(.64, .33, .4),
  head: new THREE.IcosahedronGeometry(.34, 1), arm: new THREE.BoxGeometry(.21, .86, .22),
  leg: new THREE.BoxGeometry(.26, .88, .3), hand: new THREE.BoxGeometry(.24, .22, .26),
};

function segment(geometry, color) { const m = new THREE.Mesh(geometry, material(color)); m.castShadow = true; m.receiveShadow = true; return m; }

export class Actor {
  constructor(scene, { name, color = PALETTE.rust, skin = 0xc98961, player = false, position }) {
    this.scene = scene; this.name = name; this.player = player; this.maxHp = player ? 100 : 78 + Math.random() * 24; this.hp = this.maxHp; this.alive = true; this.state = 'idle'; this.velocity = new THREE.Vector3(); this.knockback = new THREE.Vector3(); this.stagger = 0; this.attackCooldown = Math.random() * .4; this.attackPhase = 0; this.moveBlend = 0; this.facing = Math.PI; this.weapon = WEAPONS[0]; this.partsLost = new Set(); this.ai = { think: 0, strafe: Math.random() > .5 ? 1 : -1, confidence: .65 + Math.random() * .7 };
    this.root = new THREE.Group(); this.root.position.copy(position); scene.add(this.root);
    this.visual = new THREE.Group(); this.root.add(this.visual); this.parts = {};
    this.parts.torso = segment(geo.torso, color); this.parts.torso.position.y = 1.42; this.visual.add(this.parts.torso);
    this.parts.pelvis = segment(geo.pelvis, 0x30393b); this.parts.pelvis.position.y = .82; this.visual.add(this.parts.pelvis);
    this.parts.head = segment(geo.head, skin); this.parts.head.position.y = 2.16; this.visual.add(this.parts.head);
    const jaw = segment(new THREE.BoxGeometry(.32, .12, .28), skin - 0x111111); jaw.position.set(0, -.22, .08); this.parts.head.add(jaw);
    const hair = segment(new THREE.BoxGeometry(.42, .18, .4), player ? 0x171d1b : 0x3a241d); hair.position.y = .27; hair.rotation.z = .12; this.parts.head.add(hair);
    for (const [side, key] of [[-1, 'armL'], [1, 'armR']]) { const pivot = new THREE.Group(); pivot.position.set(side * .51, 1.77, 0); this.visual.add(pivot); const arm = segment(geo.arm, skin); arm.position.y = -.38; pivot.add(arm); const hand = segment(geo.hand, skin); hand.position.y = -.86; pivot.add(hand); pivot.userData.side = side; pivot.userData.meshes = [arm, hand]; this.parts[key] = pivot; }
    for (const [side, key] of [[-1, 'legL'], [1, 'legR']]) { const pivot = new THREE.Group(); pivot.position.set(side * .2, .7, 0); this.visual.add(pivot); const leg = segment(geo.leg, player ? 0x3c4747 : 0x41464a); leg.position.y = -.34; pivot.add(leg); const boot = segment(new THREE.BoxGeometry(.29, .22, .48), 0x1a1e1e); boot.position.set(0, -.79, .1); pivot.add(boot); pivot.userData.side = side; pivot.userData.meshes = [leg, boot]; this.parts[key] = pivot; }
    const shoulder = segment(new THREE.BoxGeometry(1.05, .19, .55), 0x222929); shoulder.position.y = 1.78; this.visual.add(shoulder);
    this.weaponMount = new THREE.Group(); this.parts.armR.add(this.weaponMount); this.weaponMount.position.set(0, -.85, -.16); this.visual.userData.baseColor = color;
    this.setWeapon(WEAPONS[0]);
  }
  setWeapon(weapon) {
    this.weapon = weapon; this.weaponMount.clear();
    if (weapon.id === 'knuckles') return;
    const colors = weapon.id === 'marrowmaul' ? [PALETTE.bone, 0x544436] : [0x3e4645, PALETTE.rust];
    const shaft = segment(new THREE.BoxGeometry(.13, 1.25, .13), colors[0]); shaft.position.y = -.45; this.weaponMount.add(shaft);
    const head = weapon.id === 'rivetstorm' ? segment(new THREE.BoxGeometry(.34, .38, 1.45), colors[1]) : weapon.id === 'buzzard' ? segment(new THREE.BoxGeometry(.35, .9, .25), colors[1]) : segment(new THREE.BoxGeometry(.7, .3, .34), colors[1]);
    head.position.y = -1.02; if (weapon.id === 'rivetstorm') { head.position.set(.05, -.22, -.55); head.rotation.x = Math.PI / 2; } this.weaponMount.add(head);
  }
  animate(dt, time) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt); this.stagger = Math.max(0, this.stagger - dt); this.attackPhase = Math.max(0, this.attackPhase - dt * 4.8);
    if (!this.alive) return;
    const walk = Math.sin(time * (7 + this.moveBlend * 3)) * .65 * this.moveBlend;
    if (!this.partsLost.has('legL')) this.parts.legL.rotation.x += ((walk) - this.parts.legL.rotation.x) * Math.min(1, dt * 12);
    if (!this.partsLost.has('legR')) this.parts.legR.rotation.x += ((-walk) - this.parts.legR.rotation.x) * Math.min(1, dt * 12);
    if (!this.partsLost.has('armL')) this.parts.armL.rotation.x += ((-walk * .7) - this.parts.armL.rotation.x) * Math.min(1, dt * 11);
    if (!this.partsLost.has('armR')) { const attack = this.attackPhase > 0 ? -1.9 * Math.sin((1 - this.attackPhase) * Math.PI) : walk * .6; this.parts.armR.rotation.x += (attack - this.parts.armR.rotation.x) * Math.min(1, dt * 18); }
    this.visual.position.y = Math.abs(Math.sin(time * 7)) * .035 * this.moveBlend;
    this.visual.rotation.z += ((this.stagger ? .14 : 0) - this.visual.rotation.z) * Math.min(1, dt * 16);
    this.root.rotation.y += angleDelta(this.root.rotation.y, this.facing) * Math.min(1, dt * 13);
  }
  beginAttack() { this.attackCooldown = this.weapon.cooldown; this.attackPhase = 1; }
  flash() { const original = []; this.visual.traverse(o => { if (o.isMesh) { original.push([o, o.material]); o.material = material(0xffd0b0, .4); } }); setTimeout(() => original.forEach(([o, m]) => { if (o.parent) o.material = m; }), 70); }
  detach(key, impulse = new THREE.Vector3()) {
    if (this.partsLost.has(key) || !this.parts[key]?.parent) return null;
    this.partsLost.add(key); const part = this.parts[key], worldPos = new THREE.Vector3(); part.getWorldPosition(worldPos); part.removeFromParent(); part.position.copy(worldPos); part.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2); part.userData.partType = key.includes('head') ? 'SKULL' : key.includes('leg') ? 'LEG' : 'ARM'; part.userData.velocity = impulse.clone().add(new THREE.Vector3((Math.random() - .5) * 4, 3 + Math.random() * 3, (Math.random() - .5) * 4)); part.userData.spin = new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5); this.scene.add(part); return part;
  }
  ragdoll(force) {
    this.alive = false; this.root.visible = false; const bodies = [];
    for (const [key, part] of Object.entries(this.parts)) { if (this.partsLost.has(key) || !part.parent) continue; const worldPos = new THREE.Vector3(); part.getWorldPosition(worldPos); const clone = part.clone(true); clone.position.copy(worldPos); clone.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2); clone.userData.velocity = force.clone().multiplyScalar(.45 + Math.random() * .5).add(new THREE.Vector3((Math.random() - .5) * 3, 2 + Math.random() * 4, (Math.random() - .5) * 3)); clone.userData.spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6); clone.userData.partType = key === 'head' ? 'SKULL' : key.includes('leg') ? 'LEG' : key.includes('arm') ? 'ARM' : 'BONE'; this.scene.add(clone); bodies.push(clone); }
    return bodies;
  }
}

export function updateLooseParts(parts, dt) {
  for (const p of parts) { if (p.userData.held) continue; p.userData.velocity.y -= 12 * dt; p.position.addScaledVector(p.userData.velocity, dt); p.rotation.x += p.userData.spin.x * dt; p.rotation.y += p.userData.spin.y * dt; p.rotation.z += p.userData.spin.z * dt; if (p.position.y < .18) { p.position.y = .18; if (Math.abs(p.userData.velocity.y) > 1.2) p.userData.velocity.y *= -.28; else p.userData.velocity.y = 0; p.userData.velocity.x *= Math.pow(.08, dt); p.userData.velocity.z *= Math.pow(.08, dt); p.userData.spin.multiplyScalar(Math.pow(.15, dt)); } }
}

export function angleDelta(a, b) { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
