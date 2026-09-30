import * as THREE from "three";
import capital from "../data/solvyr-capital.json";

const C = {
  stone: 0x74746b,
  stoneDark: 0x4f5356,
  mortar: 0x87857e,
  slate: 0x283238,
  timber: 0x49372b,
  plaster: 0xb5aa93,
  gold: 0xb78b42,
  road: 0x70695d,
  grass: 0x55664f,
  grassDark: 0x3f5141,
  leaf: 0x39503b,
  trunk: 0x4b3829,
  cloth: 0x5c1f2b,
  iron: 0x292d2f,
  torch: 0xffa64d
};

function material(color, roughness = 0.9, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export class SolvyrWorld {
  constructor(scene, persistentWorld) {
    this.scene = scene;
    this.state = persistentWorld;
    this.colliders = [];
    this.interactions = [];
    this.zone = null;
    this.discovered = new Set(persistentWorld.discovered || []);
    this.clock = 0;

    this.mat = {
      stone: material(C.stone),
      stoneDark: material(C.stoneDark),
      slate: material(C.slate, 0.82),
      timber: material(C.timber),
      plaster: material(C.plaster),
      gold: material(C.gold, 0.55, 0.45),
      road: material(C.road),
      grass: material(C.grass),
      grassDark: material(C.grassDark),
      leaf: material(C.leaf),
      trunk: material(C.trunk),
      cloth: material(C.cloth),
      iron: material(C.iron, 0.52, 0.55)
    };

    this.buildGround();
    this.buildApproach();
    this.buildCapitalGate();
    this.buildCrownStreet();
    this.buildCastle();
    this.buildVegetation();
    this.buildGuard();
  }

  addBox(x, y, z, sx, sy, sz, mat, solid = true, cast = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    if (solid) this.colliders.push({
      minX: x - sx / 2, maxX: x + sx / 2,
      minZ: z - sz / 2, maxZ: z + sz / 2,
      enabled: true
    });
    return mesh;
  }

  addTower(x, z, radius = 3.5, height = 10) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + .35, height, 10), this.mat.stoneDark);
    base.position.set(x, height / 2, z);
    base.castShadow = true;
    base.receiveShadow = true;
    this.scene.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(radius + .9, 3.4, 10), this.mat.slate);
    roof.position.set(x, height + 1.7, z);
    roof.castShadow = true;
    this.scene.add(roof);
    this.colliders.push({ minX: x - radius, maxX: x + radius, minZ: z - radius, maxZ: z + radius, enabled: true });
  }

  buildGround() {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(180, 330), this.mat.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.035, -10);
    grass.receiveShadow = true;
    this.scene.add(grass);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(11, 280), this.mat.road);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.005, 2);
    road.receiveShadow = true;
    this.scene.add(road);

    for (let z = 122; z > -140; z -= 5.5) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(9.5, .018, .06), this.mat.stoneDark);
      seam.position.set((z % 11) * .015, .018, z);
      this.scene.add(seam);
    }
  }

  buildApproach() {
    for (const x of [-9.5, 9.5]) {
      for (let z = 118; z >= 76; z -= 8) {
        const post = this.addBox(x, .55, z, .18, 1.1, .18, this.mat.stoneDark, false, false);
        const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(.22), new THREE.MeshStandardMaterial({
          color: 0xffc06a, emissive: 0xff8a2a, emissiveIntensity: 2.3
        }));
        lamp.position.set(x, 1.24, z);
        this.scene.add(lamp);
      }
    }
    const distant = this.addBox(0, .45, 137, 16, .9, 2.2, this.mat.stoneDark, true);
    distant.rotation.y = 0;
  }

  buildCapitalGate() {
    this.addBox(-19, 3.5, 65, 24, 7, 3.2, this.mat.stoneDark, true);
    this.addBox(19, 3.5, 65, 24, 7, 3.2, this.mat.stoneDark, true);
    this.addTower(-7.5, 65, 3.8, 10);
    this.addTower(7.5, 65, 3.8, 10);
    this.addBox(0, 9.1, 65, 9, 2.1, 3.1, this.mat.stone, false);
    this.banner(-3.1, 8.6, 63.3);
    this.banner(3.1, 8.6, 63.3);
  }

  house(x, z, sx, sz, height, tone = 0) {
    const mats = [this.mat.plaster, material(0x9f9786), material(0xaaa08a)];
    this.addBox(x, height / 2, z, sx, height, sz, mats[tone % mats.length], true);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(sx, sz) * .72, 2.4, 4), this.mat.slate);
    roof.position.set(x, height + 1.15, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    this.scene.add(roof);
    const beam = this.addBox(x, height * .55, z - sz / 2 - .03, .16, height * .8, .12, this.mat.timber, false, false);
    beam.receiveShadow = false;
  }

  buildCrownStreet() {
    const rows = [
      [-13, 48, 8, 10, 6], [14, 46, 9, 11, 7],
      [-14, 33, 9, 10, 6.5], [13, 30, 8, 9, 5.5],
      [-13, 15, 8, 11, 7], [14, 13, 9, 10, 6],
      [-14, -3, 9, 10, 6], [13, -5, 8, 11, 7],
      [-13, -21, 9, 10, 6.5], [14, -22, 9, 10, 6]
    ];
    rows.forEach((h, i) => this.house(...h, i));

    for (const x of [-6.2, 6.2]) {
      for (let z = 48; z > -30; z -= 13) {
        this.addBox(x, .42, z, .8, .84, 1.5, this.mat.timber, false, false);
        const awning = this.addBox(x, 1.35, z, 2.2, .12, 1.7, iMaterial(z), false, false);
        awning.rotation.z = x < 0 ? -.08 : .08;
      }
    }

    function iMaterial(seed) {
      return material(Math.abs(seed) % 2 ? 0x6b2630 : 0xa58a4b);
    }
  }

  banner(x, y, z) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.2), this.mat.cloth);
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.PI;
    this.scene.add(mesh);
    const crown = new THREE.Mesh(new THREE.RingGeometry(.32, .49, 6), this.mat.gold);
    crown.position.set(x, y + .2, z - .015);
    crown.rotation.y = Math.PI;
    this.scene.add(crown);
  }

  buildCastle() {
    // Outer castle wall and towers.
    this.addBox(-17.5, 4.7, -45, 25, 9.4, 3, this.mat.stoneDark, true);
    this.addBox(17.5, 4.7, -45, 25, 9.4, 3, this.mat.stoneDark, true);
    this.addTower(-7, -45, 3.7, 12);
    this.addTower(7, -45, 3.7, 12);
    this.addBox(-25, 4, -72, 3, 8, 54, this.mat.stoneDark, true);
    this.addBox(25, 4, -72, 3, 8, 54, this.mat.stoneDark, true);

    // Portcullis bars; interaction raises the group.
    this.portcullis = new THREE.Group();
    for (let x = -3.4; x <= 3.4; x += .85) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.12, 5.2, .16), this.mat.iron);
      bar.position.set(x, 2.6, -45);
      this.portcullis.add(bar);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(7.2, .16, .18), this.mat.iron);
    cross.position.set(0, 2.8, -45);
    this.portcullis.add(cross);
    this.scene.add(this.portcullis);
    this.portcullis.position.y = this.state.castleGateOpen ? 5.5 : 0;
    this.gateCollider = { minX: -4.1, maxX: 4.1, minZ: -45.55, maxZ: -44.45, enabled: !this.state.castleGateOpen };
    this.colliders.push(this.gateCollider);

    // Inner court.
    const court = new THREE.Mesh(new THREE.PlaneGeometry(46, 49), material(0x777168));
    court.rotation.x = -Math.PI / 2;
    court.position.set(0, .012, -72);
    court.receiveShadow = true;
    this.scene.add(court);
    for (const x of [-16, 16]) {
      for (const z of [-58, -73, -88]) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(.45, .58, 4.2, 8), this.mat.stone);
        column.position.set(x, 2.1, z);
        column.castShadow = true;
        this.scene.add(column);
      }
    }

    // Keep facade with open central doorway.
    this.addBox(-12, 5.5, -99, 16, 11, 4, this.mat.stoneDark, true);
    this.addBox(12, 5.5, -99, 16, 11, 4, this.mat.stoneDark, true);
    this.addBox(0, 10, -99, 9, 2, 4, this.mat.stone, false);
    this.addTower(-20, -101, 4.8, 15);
    this.addTower(20, -101, 4.8, 15);
    this.banner(-3, 8.6, -96.92);
    this.banner(3, 8.6, -96.92);

    // Great Hall: enclosed, readable, low draw count.
    const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(28, 46), material(0x5f5c58));
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, .015, -122);
    hallFloor.receiveShadow = true;
    this.scene.add(hallFloor);
    this.addBox(-14.5, 4.5, -122, 1, 9, 46, this.mat.stoneDark, true);
    this.addBox(14.5, 4.5, -122, 1, 9, 46, this.mat.stoneDark, true);
    this.addBox(0, 8.7, -122, 29, .6, 46, this.mat.timber, false, false);
    this.addBox(0, 4.5, -145, 29, 9, 1, this.mat.stoneDark, true);

    for (const x of [-10.7, 10.7]) {
      for (const z of [-108, -120, -132]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(.36, .5, 6.5, 8), this.mat.stone);
        p.position.set(x, 3.25, z);
        p.castShadow = true;
        this.scene.add(p);
      }
    }

    this.addBox(0, .35, -138, 8.6, .7, 4.5, this.mat.stone, true);
    this.addBox(0, 1.1, -140, 3.2, 1.5, 1.1, this.mat.timber, true);
    const crest = new THREE.Mesh(new THREE.RingGeometry(.7, 1.02, 6), this.mat.gold);
    crest.position.set(0, 5.4, -144.45);
    this.scene.add(crest);

    this.addTorch(-11.8, 3.4, -112);
    this.addTorch(11.8, 3.4, -112);
    this.addTorch(-11.8, 3.4, -132);
    this.addTorch(11.8, 3.4, -132);
  }

  addTorch(x, y, z) {
    const holder = this.addBox(x, y - .45, z, .12, .9, .12, this.mat.iron, false, false);
    holder.rotation.z = .16;
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(.12, .34, 7),
      new THREE.MeshStandardMaterial({ color: 0xffb05c, emissive: 0xff7b25, emissiveIntensity: 3 })
    );
    flame.position.set(x, y, z);
    this.scene.add(flame);
    const light = new THREE.PointLight(C.torch, 14, 12, 2.1);
    light.position.set(x, y, z);
    this.scene.add(light);
  }

  buildVegetation() {
    const count = 74;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .24, 2.1, 6), this.mat.trunk, count);
    const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1.25, 3.4, 7), this.mat.leaf, count);
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let side of [-1, 1]) {
      for (let z = 132; z > 67; z -= 3.6) {
        if (i >= count) break;
        const x = side * (14 + ((i * 13) % 17));
        dummy.position.set(x, 1.05, z + ((i % 3) - 1) * .8);
        dummy.rotation.y = (i * .71) % Math.PI;
        const scale = .8 + (i % 5) * .08;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        dummy.position.y = 3.25;
        dummy.updateMatrix();
        crowns.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    trunks.count = i;
    crowns.count = i;
    trunks.castShadow = false;
    crowns.castShadow = false;
    this.scene.add(trunks, crowns);
  }

  buildGuard() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.38, .48, 1.25, 8), material(0x4b5660));
    body.position.y = 1.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), material(0xb79b7a));
    head.position.y = 1.9;
    const helmet = new THREE.Mesh(new THREE.ConeGeometry(.38, .45, 8), this.mat.iron);
    helmet.position.y = 2.22;
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 3.2, 6), this.mat.timber);
    spear.position.set(.65, 1.35, 0);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.09, .35, 5), this.mat.iron);
    tip.position.set(.65, 3.08, 0);
    g.add(body, head, helmet, spear, tip);
    g.position.set(4.8, 0, -38.5);
    g.rotation.y = -.18;
    this.scene.add(g);
    this.guard = g;

    this.interactions.push({
      id: "castle-guard",
      position: new THREE.Vector3(4.8, 0, -38.5),
      range: 3.1,
      label: this.state.castleGateOpen ? "E · Speak to the castle guard" : "E · Present yourself to the castle guard",
      use: () => {
        if (!this.state.castleGateOpen) {
          this.state.castleGateOpen = true;
          this.gateCollider.enabled = false;
          return { type: "gate-opened", text: "The guard studies you, then signals above. Iron grinds against stone." };
        }
        return { type: "dialogue", text: "“You have leave to enter. Don’t keep the court waiting.”" };
      }
    });
  }

  nearestInteraction(position) {
    let best = null;
    let dist = Infinity;
    for (const item of this.interactions) {
      const d = position.distanceTo(item.position);
      if (d <= item.range && d < dist) {
        best = item;
        dist = d;
      }
    }
    return best;
  }

  useInteraction(item) {
    return item?.use?.() || null;
  }

  update(dt) {
    this.clock += dt;
    const target = this.state.castleGateOpen ? 5.5 : 0;
    this.portcullis.position.y = THREE.MathUtils.damp(this.portcullis.position.y, target, 3.2, dt);
  }

  currentZone(position) {
    const z = position.z;
    return capital.zones.find(zone => z >= zone.minZ && z <= zone.maxZ) || null;
  }

  checkDiscovery(position) {
    const zone = this.currentZone(position);
    if (!zone || this.discovered.has(zone.id)) return null;
    this.discovered.add(zone.id);
    this.state.discovered = [...this.discovered];
    return zone;
  }

  objective(position) {
    if (position.z < -134) return "Experience complete · Stand before the royal dais";
    if (position.z < -100) return "Walk the Great Hall to the royal dais";
    if (this.state.castleGateOpen) return "Enter Solvyr Castle";
    if (position.z < 57) return "Reach Solvyr Castle and speak with the gate guard";
    return "Enter the Solvyn capital through the South Gate";
  }
}
