import * as THREE from 'three';
import { CONFIG, PALETTE } from './config.js';

const matCache = new Map();
export function material(color, roughness = .82, metalness = .08) {
  const key = `${color}-${roughness}-${metalness}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true }));
  return matCache.get(key);
}

function seeded(seed = 94721) {
  return () => { seed = Math.imul(48271, seed) | 0; return (seed >>> 0) / 4294967296; };
}

function box(scene, position, scale, color, rotation = 0, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...scale), material(color));
  mesh.position.set(...position); mesh.rotation.y = rotation; mesh.castShadow = cast; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}

export function buildArena(scene) {
  const random = seeded();
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(41, 43, 1.5, 48), material(0x272b28, .96));
  floor.position.y = -.76; floor.receiveShadow = true; scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(39.4, 40, 96),
    new THREE.MeshBasicMaterial({ color: PALETTE.acid, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = .05; scene.add(ring);

  const stains = new THREE.Group(); scene.add(stains);
  for (let i = 0; i < 38; i++) {
    const a = random() * Math.PI * 2, r = 4 + random() * 34;
    const decal = new THREE.Mesh(new THREE.CircleGeometry(.4 + random() * 2.2, 7), new THREE.MeshBasicMaterial({ color: i % 5 ? 0x1d201e : 0x43191a, transparent: true, opacity: .42, depthWrite: false }));
    decal.rotation.x = -Math.PI / 2; decal.rotation.z = random() * Math.PI; decal.scale.y = .35 + random(); decal.position.set(Math.cos(a) * r, .012, Math.sin(a) * r); stains.add(decal);
  }

  const obstacles = [];
  const colors = [0x39403d, 0x493a2f, 0x5f3027, 0x303638, 0x554d3c];
  for (let i = 0; i < 46; i++) {
    const a = random() * Math.PI * 2, r = 8 + random() * 29;
    if (Math.abs(Math.cos(a) * r) < 5 && Math.abs(Math.sin(a) * r - 9) < 6) continue;
    const w = .7 + random() * 2.6, h = .55 + random() * 3.4, d = .7 + random() * 2.4;
    const obj = box(scene, [Math.cos(a) * r, h / 2, Math.sin(a) * r], [w, h, d], colors[i % colors.length], random() * Math.PI);
    obj.userData.radius = Math.max(w, d) * .62; obstacles.push(obj);
    if (random() > .68) {
      const stripe = box(scene, [obj.position.x, h * (.55 + random() * .2), obj.position.z], [w * 1.03, .12, d * 1.03], i % 2 ? PALETTE.rust : 0xd39b32, obj.rotation.y, false);
      stripe.userData.decor = true;
    }
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + .2, r = 29;
    const g = new THREE.Group(); g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); g.rotation.y = -a; scene.add(g);
    for (let s = -2; s <= 2; s++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(.5, 3 + Math.abs(s) * .2, 4), material(s % 2 ? PALETTE.rust : 0x606865, .7, .35));
      tooth.position.set(s * 1.1, 1.3, 0); tooth.rotation.z = (s * .07); tooth.castShadow = true; g.add(tooth);
    }
  }

  const tower = new THREE.Group(); tower.position.set(-9, 0, -8); scene.add(tower);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4, 1.4, 8), material(0x373d3b, .8, .45)); base.position.y = .7; base.castShadow = true; tower.add(base);
  for (const x of [-1.5, 1.5]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.65, 10, .65), material(0x4b514d, .65, .5)); leg.position.set(x, 5.4, 0); leg.rotation.z = x * .025; leg.castShadow = true; tower.add(leg); }
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 2.8), material(PALETTE.rust, .65, .35)); jaw.position.y = 8.5; jaw.castShadow = true; tower.add(jaw);
  const lamp = new THREE.PointLight(PALETTE.rust, 8, 18, 2); lamp.position.set(0, 7.8, 1.5); tower.add(lamp);

  const bench = new THREE.Group(); bench.position.set(4, 0, 6); scene.add(bench);
  const benchBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.25, 1.4), material(0x3f4743, .7, .5)); benchBase.position.y = .65; benchBase.castShadow = true; bench.add(benchBase);
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(3.3, .2, 1.7), material(PALETTE.rust, .65, .3)); benchTop.position.y = 1.38; benchTop.castShadow = true; bench.add(benchTop);
  const beacon = new THREE.PointLight(PALETTE.acid, 4, 8, 2); beacon.position.set(0, 2.4, 0); bench.add(beacon);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, .5, .12), material(PALETTE.acid, .65)); sign.position.set(0, 2.1, 0); bench.add(sign);

  return {
    ring, bench, obstacles, tower, radius: CONFIG.arenaRadius,
    updateRing(radius, t) { ring.scale.setScalar(radius / 39.7); ring.material.opacity = .42 + Math.sin(t * 5) * .2; lamp.intensity = 7 + Math.sin(t * 4) * 3; beacon.intensity = 3 + Math.sin(t * 3) * 1.5; jaw.position.y = 8.5 + Math.sin(t * .55) * .7; },
    resolve(position, actorRadius = .55) {
      const len = Math.hypot(position.x, position.z); if (len > 39) { position.x *= 39 / len; position.z *= 39 / len; }
      for (const o of obstacles) {
        const dx = position.x - o.position.x, dz = position.z - o.position.z, min = o.userData.radius + actorRadius, d2 = dx * dx + dz * dz;
        if (d2 < min * min && d2 > .001) { const d = Math.sqrt(d2), push = min - d; position.x += dx / d * push; position.z += dz / d * push; }
      }
    }
  };
}
