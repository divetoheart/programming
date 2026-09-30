import * as THREE from "three";
import capital from "../data/solvyr-capital.json";

const C = {
  limestone: 0x817d72,
  limestoneLight: 0xa29b8b,
  stoneDark: 0x4b5050,
  slate: 0x26343a,
  timber: 0x493629,
  plaster: 0xb8ae98,
  plasterWarm: 0xa79a84,
  gold: 0xb48a3f,
  road: 0x716a60,
  grass: 0x4e624d,
  grassDark: 0x384a3d,
  leaf: 0x334a3a,
  leaf2: 0x405b42,
  trunk: 0x49382a,
  oxblood: 0x5c2029,
  clothGold: 0xa68242,
  iron: 0x272d2f,
  skin: 0xb58f6f,
  water: 0x6e9699,
  flame: 0xffa24f
};

function mat(color, roughness = .88, metalness = .03, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

const clamp = THREE.MathUtils.clamp;

export class SolvyrWorld {
  constructor(scene, persistentWorld) {
    this.scene = scene;
    this.state = persistentWorld;
    this.colliders = [];
    this.interactions = [];
    this.discovered = new Set(persistentWorld.discovered || []);
    this.momentsSeen = new Set(persistentWorld.momentsSeen || []);
    this.interactionsUsed = new Set(persistentWorld.interactionsUsed || []);
    this.events = [];
    this.clock = 0;

    this.unitBox = new THREE.BoxGeometry(1, 1, 1);
    this.unitCylinder8 = new THREE.CylinderGeometry(.5, .5, 1, 8);
    this.unitSphere = new THREE.SphereGeometry(.5, 10, 8);
    this.unitCone8 = new THREE.ConeGeometry(.5, 1, 8);
    this.unitWheel = new THREE.CylinderGeometry(.5, .5, .2, 10);

    this.mat = {
      stone: mat(C.limestone),
      stoneLight: mat(C.limestoneLight),
      stoneDark: mat(C.stoneDark),
      slate: mat(C.slate, .76),
      timber: mat(C.timber),
      plaster: mat(C.plaster),
      plasterWarm: mat(C.plasterWarm),
      gold: mat(C.gold, .5, .5),
      road: mat(C.road),
      grass: mat(C.grass),
      grassDark: mat(C.grassDark),
      leaf: mat(C.leaf),
      leaf2: mat(C.leaf2),
      trunk: mat(C.trunk),
      cloth: mat(C.oxblood, .82, .03, { side: THREE.DoubleSide }),
      clothGold: mat(C.clothGold, .8, .03, { side: THREE.DoubleSide }),
      iron: mat(C.iron, .48, .58),
      skin: mat(C.skin),
      water: mat(C.water, .28, .05, { transparent: true, opacity: .68 }),
      darkLeather: mat(0x352b27),
      guardBlue: mat(0x3e5260),
      commonGreen: mat(0x51604a),
      commonBlue: mat(0x56636d),
      commonRust: mat(0x765047),
      commonTan: mat(0x8b745b)
    };

    this.animatedBanners = [];
    this.npcs = [];
    this.torches = [];
    this.smoke = [];
    this.birds = [];
    this.cart = null;
    this.cat = null;

    this.buildGround();
    this.buildHillsAndVegetation();
    this.buildRoadApproach();
    this.buildSouthGate();
    this.buildCrownStreet();
    this.buildCastleAscent();
    this.buildCastle();
    this.buildLife();
  }

  groundHeight() {
    return 0;
  }

  addBox(x, y, z, sx, sy, sz, material, solid = true, cast = true, parent = this.scene) {
    const mesh = new THREE.Mesh(this.unitBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (solid && parent === this.scene) {
      this.colliders.push({
        minX: x - sx / 2,
        maxX: x + sx / 2,
        minZ: z - sz / 2,
        maxZ: z + sz / 2,
        enabled: true
      });
    }
    return mesh;
  }

  addCylinder(x, y, z, radius, height, material, parent = this.scene, cast = true) {
    const mesh = new THREE.Mesh(this.unitCylinder8, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(radius * 2, height, radius * 2);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  addRoof(x, y, z, radius, height, material = this.mat.slate, parent = this.scene) {
    const roof = new THREE.Mesh(this.unitCone8, material);
    roof.position.set(x, y, z);
    roof.scale.set(radius * 2, height, radius * 2);
    roof.rotation.y = Math.PI / 8;
    roof.castShadow = true;
    parent.add(roof);
    return roof;
  }

  addTower(x, z, radius = 3.6, height = 12, roofHeight = 4) {
    const base = this.addCylinder(x, height / 2, z, radius, height, this.mat.stoneDark);
    this.colliders.push({
      minX: x - radius * .86, maxX: x + radius * .86,
      minZ: z - radius * .86, maxZ: z + radius * .86,
      enabled: true
    });
    this.addRoof(x, height + roofHeight / 2, z, radius + .85, roofHeight);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      this.addBox(
        x + Math.sin(a) * radius * .94,
        height * .68,
        z + Math.cos(a) * radius * .94,
        .25, 1.4, .2,
        this.mat.iron, false, false
      ).rotation.y = a;
    }
    return base;
  }

  addWindow(x, y, z, sx = .65, sy = 1.05, emissive = 0xffc879, rotationY = 0) {
    const m = new THREE.Mesh(
      this.unitBox,
      new THREE.MeshStandardMaterial({
        color: 0x6e5740,
        emissive,
        emissiveIntensity: .55,
        roughness: .45
      })
    );
    m.position.set(x, y, z);
    m.scale.set(sx, sy, .08);
    m.rotation.y = rotationY;
    this.scene.add(m);
    return m;
  }

  addBanner(x, y, z, rotationY = 0, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.7 * scale, 3 * scale, 1, 5), this.mat.cloth);
    cloth.position.y = -1.5 * scale;
    group.add(cloth);

    const crown = new THREE.Group();
    const center = this.addBox(0, -.8 * scale, .018, .18 * scale, .7 * scale, .05, this.mat.gold, false, false, crown);
    center.rotation.z = 0;
    const left = this.addBox(-.31 * scale, -.92 * scale, .018, .15 * scale, .48 * scale, .05, this.mat.gold, false, false, crown);
    left.rotation.z = -.25;
    const right = this.addBox(.31 * scale, -.92 * scale, .018, .15 * scale, .48 * scale, .05, this.mat.gold, false, false, crown);
    right.rotation.z = .25;
    group.add(crown);

    const bar = this.addBox(0, .04, 0, 2.05 * scale, .07, .07, this.mat.iron, false, false, group);
    bar.position.y = .05;

    this.scene.add(group);
    this.animatedBanners.push({ group, cloth, phase: (x + z) * .17 });
    return group;
  }

  addLantern(x, z, y = 2.4) {
    const post = this.addBox(x, y / 2, z, .16, y, .16, this.mat.iron, false, false);
    post.rotation.z = 0;
    const hook = this.addBox(x + (x < 0 ? .28 : -.28), y, z, .55, .08, .08, this.mat.iron, false, false);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffca78,
      emissive: 0xff8a32,
      emissiveIntensity: 2.7,
      roughness: .5
    });
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(.19), lampMat);
    lamp.position.set(x + (x < 0 ? .48 : -.48), y - .14, z);
    this.scene.add(lamp);
  }

  addTorch(x, y, z, rotationY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotationY;
    this.addBox(0, -.42, 0, .09, .75, .09, this.mat.iron, false, false, g);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffc36b,
      emissive: 0xff7927,
      emissiveIntensity: 3.1,
      roughness: .25
    });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.11, .34, 7), flameMat);
    flame.position.y = .03;
    g.add(flame);
    this.scene.add(g);
    this.torches.push({ flame, light: null, phase: (x * 3.1 + z) % 7 });
  }

  buildGround() {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(190, 360), this.mat.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -.06, 5);
    grass.receiveShadow = true;
    this.scene.add(grass);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 290), this.mat.road);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, .006, 2);
    road.receiveShadow = true;
    this.scene.add(road);

    for (let z = 137; z > -145; z -= 4.8) {
      const seam = this.addBox(((z * 7) % 3) * .08, .018, z, 8.9, .016, .055, this.mat.stoneDark, false, false);
      seam.rotation.y = ((Math.abs(z) % 5) - 2) * .005;
    }

    // Road shoulders make the route feel intentionally laid into the landscape.
    for (const side of [-1, 1]) {
      for (let z = 132; z > 66; z -= 6) {
        this.addBox(side * (5.8 + (Math.abs(z) % 4) * .14), .12, z, .5, .24, 1.4, this.mat.stone, false, false);
      }
    }
  }

  buildHillsAndVegetation() {
    const hillMat = this.mat.grassDark;
    const hills = [
      [-43, 3.4, 126, 45, 7, 40],
      [44, 4.1, 119, 48, 8, 46],
      [-50, 3.1, 82, 52, 6, 34],
      [49, 3.5, 76, 50, 7, 34]
    ];
    hills.forEach(h => this.addBox(...h, hillMat, false, false));

    // Distant mountain wall: exaggerated silhouette, almost free at runtime.
    const mountainMat = mat(0x65706e, 1);
    const mountainGeo = new THREE.ConeGeometry(1, 1, 5);
    [
      [-78, -220, 58, 54], [-36, -214, 46, 66], [8, -232, 62, 78],
      [58, -218, 52, 61], [100, -235, 66, 48]
    ].forEach(([x,z,w,h], i) => {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(x, h * .42 - 4, z);
      m.scale.set(w, h, w * .68);
      m.rotation.y = i * .31;
      m.receiveShadow = false;
      m.castShadow = false;
      this.scene.add(m);
    });

    const count = 100;
    const trunkGeo = new THREE.CylinderGeometry(.18, .24, 2.1, 6);
    const crownGeo = new THREE.ConeGeometry(1.2, 3.2, 7);
    const trunks = new THREE.InstancedMesh(trunkGeo, this.mat.trunk, count);
    const crowns = new THREE.InstancedMesh(crownGeo, this.mat.leaf, count);
    const dummy = new THREE.Object3D();
    let i = 0;
    for (const side of [-1, 1]) {
      for (let z = 145; z > 62 && i < count; z -= 3.4) {
        const variance = ((i * 37) % 13) * .72;
        const x = side * (13 + variance);
        const scale = .75 + ((i * 11) % 7) * .055;
        dummy.position.set(x, 1.05 * scale, z + ((i % 4) - 1.5) * .9);
        dummy.rotation.y = (i * .61) % Math.PI;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        dummy.position.y = 3.05 * scale;
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

  buildRoadApproach() {
    // Distant city silhouette — cheap geometry that makes the reveal read from spawn.
    this.addBox(-30, 5, 64, 44, 10, 4, this.mat.stoneDark, false);
    this.addBox(30, 5, 64, 44, 10, 4, this.mat.stoneDark, false);

    // Framing stones at spawn create a deliberate first view.
    this.addBox(-10.8, 2.1, 136, 1.8, 4.2, 5, this.mat.stoneDark, true);
    this.addBox(10.8, 2.1, 136, 1.8, 4.2, 5, this.mat.stoneDark, true);
    this.addBox(0, 4.7, 136, 23, 1.2, 4.4, this.mat.timber, false);

    for (const x of [-8.4, 8.4]) {
      for (let z = 124; z >= 82; z -= 10.5) this.addLantern(x, z, 2.15);
    }

    // Small roadside shrine gives the kingdom a lived-in identity without lore-dumping.
    const shrine = new THREE.Group();
    shrine.position.set(-9.3, 0, 104);
    this.addBox(0, .55, 0, 2.2, 1.1, 1.5, this.mat.stone, false, true, shrine);
    this.addBox(0, 1.38, 0, 1.45, .55, 1.05, this.mat.stoneLight, false, true, shrine);
    const crown = new THREE.Mesh(new THREE.RingGeometry(.26, .39, 3), this.mat.gold);
    crown.position.set(0, 1.55, -.55);
    crown.rotation.z = Math.PI;
    shrine.add(crown);
    this.scene.add(shrine);
    this.interactions.push({
      id: "roadside-shrine",
      position: new THREE.Vector3(-9.3, 0, 104),
      range: 2.5,
      label: "E · Read the weathered inscription",
      use: () => ({
        type: "lore",
        text: "“May the Crown see farther than the traveler.” Someone has left three fresh mountain flowers."
      })
    });
  }

  buildSouthGate() {
    // Gatehouse becomes layered instead of a single wall.
    this.addBox(-21, 4.2, 65, 27, 8.4, 4.2, this.mat.stoneDark, true);
    this.addBox(21, 4.2, 65, 27, 8.4, 4.2, this.mat.stoneDark, true);
    this.addBox(0, 10.3, 65, 10.5, 3.1, 5, this.mat.stone, false);
    this.addBox(0, 12.4, 65, 7.6, 1.3, 4.2, this.mat.stoneLight, false);
    this.addTower(-8.6, 65, 4.4, 13.5, 4.4);
    this.addTower(8.6, 65, 4.4, 13.5, 4.4);
    this.addBanner(-3.1, 10.4, 62.82, Math.PI, .92);
    this.addBanner(3.1, 10.4, 62.82, Math.PI, .92);

    // Wall depth and crenellations.
    for (let x = -42; x <= 42; x += 4) {
      if (Math.abs(x) < 6) continue;
      this.addBox(x, 8.8, 63.7, 2.0, 1.4, 1.2, this.mat.stone, false);
    }

    // Interior sconces pull the player through the gate.
    this.addTorch(-4.5, 3.3, 65, Math.PI / 2);
    this.addTorch(4.5, 3.3, 65, -Math.PI / 2);

    // Notice board just inside the gate.
    this.addBox(-6.9, 1.35, 56, 2.7, 2.1, .18, this.mat.timber, false);
    const papers = mat(0xd2c6a8, 1);
    this.addBox(-7.4, 1.55, 55.87, .72, .82, .03, papers, false, false);
    this.addBox(-6.45, 1.22, 55.87, .83, .67, .03, papers, false, false);
    this.interactions.push({
      id: "notice-board",
      position: new THREE.Vector3(-6.9, 0, 56),
      range: 2.6,
      label: "E · Read the gate notices",
      use: () => ({
        type: "lore",
        text: "Bridge toll suspended. Missing gray mule. Bakers fined for false weights. Someone has drawn a crown on the tax notice."
      })
    });
  }

  house(x, z, sx, sz, height, tone = 0, face = "road") {
    const bodyMat = tone % 3 === 0 ? this.mat.plaster : tone % 3 === 1 ? this.mat.plasterWarm : this.mat.stoneLight;
    this.addBox(x, height / 2, z, sx, height, sz, bodyMat, true);
    this.addRoof(x, height + 1.25, z, Math.max(sx, sz) * .64, 2.5);

    const roadSide = x < 0 ? 1 : -1;
    const frontX = x + roadSide * (sx / 2 + .05);
    for (let yy = 2.2; yy < height - .5; yy += 2.1) {
      this.addWindow(frontX, yy, z - sz * .2, .09, .64, 0xffbd65, roadSide > 0 ? Math.PI / 2 : -Math.PI / 2);
      if (height > 6) this.addWindow(frontX, yy, z + sz * .2, .09, .64, 0xffbd65, roadSide > 0 ? Math.PI / 2 : -Math.PI / 2);
    }

    // Timber rhythm makes each façade legible at walking speed.
    for (const dz of [-sz * .32, 0, sz * .32]) {
      const b = this.addBox(frontX, height * .53, z + dz, .11, height * .78, .11, this.mat.timber, false, false);
      b.rotation.z = (dz === 0 ? 0 : roadSide * dz > 0 ? .11 : -.11);
    }
  }

  addStall(x, z, colorMat = this.mat.cloth) {
    this.addBox(x, .52, z, 2.5, 1.04, 1.45, this.mat.timber, false);
    this.addBox(x, 1.8, z, 2.8, .13, 1.72, colorMat, false, false);
    this.addBox(x - 1.2, 1.05, z, .12, 2.05, .12, this.mat.timber, false, false);
    this.addBox(x + 1.2, 1.05, z, .12, 2.05, .12, this.mat.timber, false, false);
    const goods = [this.mat.commonRust, this.mat.commonGreen, this.mat.commonTan];
    for (let i = 0; i < 5; i++) {
      this.addBox(x - .8 + i * .4, 1.1 + (i % 2) * .07, z - .18, .28, .23, .35, goods[i % goods.length], false, false);
    }
  }

  buildCrownStreet() {
    const rows = [
      [-14.3, 49, 8.5, 10, 6.4], [14.1, 48, 8.8, 11, 7.4],
      [-14.8, 35, 9, 10.2, 7.0], [13.8, 33, 8.2, 9.2, 5.9],
      [-14.1, 19, 8.5, 10.2, 7.5], [14.4, 17, 9, 10, 6.4],
      [-14.8, 2, 9.2, 10.5, 6.7], [13.8, 0, 8.4, 10.2, 7.3],
      [-14.2, -17, 8.6, 10.6, 7.1], [14.6, -18, 9, 10.4, 6.6]
    ];
    rows.forEach((h, i) => this.house(...h, i));

    this.addStall(-6.7, 42, this.mat.cloth);
    this.addStall(6.7, 29, this.mat.clothGold);
    this.addStall(-6.7, 8, this.mat.clothGold);
    this.addStall(6.7, -10, this.mat.cloth);

    for (const x of [-7.3, 7.3]) {
      for (let z = 51; z > -24; z -= 15.5) this.addLantern(x, z, 2.55);
    }

    // Fountain / meeting place.
    this.addCylinder(7.5, .38, 7, 2.2, .76, this.mat.stone);
    this.addCylinder(7.5, .78, 7, 1.65, .12, this.mat.water, this.scene, false);
    this.addCylinder(7.5, 1.05, 7, .22, 1.3, this.mat.stoneLight);
    this.addCylinder(7.5, 1.72, 7, .78, .14, this.mat.water, this.scene, false);

    // Hanging street signs.
    const signs = [
      [-8.6, 31, "crown"], [8.7, 20, "tankard"], [-8.7, -5, "boot"]
    ];
    signs.forEach(([x, z], i) => {
      this.addBox(x, 3.4, z, .8, .85, .09, i === 1 ? this.mat.commonRust : this.mat.timber, false, false);
      this.addBox(x + (x < 0 ? .45 : -.45), 3.75, z, .8, .07, .07, this.mat.iron, false, false);
    });

    // Chimneys and smoke sprites.
    [[-14.5, 43], [14, 27], [-14, 0], [14.5, -15]].forEach(([x,z], i) => {
      this.addBox(x, 7.8 + (i % 2), z, .8, 2.6, .8, this.mat.stoneDark, false, false);
      this.addSmoke(x, 9.2 + (i % 2), z);
    });
  }

  buildCastleAscent() {
    // Visual compression: walls close in and the keep grows over the player.
    this.addBox(-19.5, 3.1, -36, 28, 6.2, 3, this.mat.stone, true);
    this.addBox(19.5, 3.1, -36, 28, 6.2, 3, this.mat.stone, true);
    for (let x = -31; x <= 31; x += 4.3) {
      if (Math.abs(x) < 6) continue;
      this.addBox(x, 6.75, -36, 2.0, 1.35, 1.3, this.mat.stoneLight, false);
    }

    this.addBox(-20, 1.2, -31, 8, 2.4, 13, this.mat.stoneDark, false);
    this.addBox(20, 1.2, -31, 8, 2.4, 13, this.mat.stoneDark, false);

    this.addBanner(-8.2, 5.9, -34.42, Math.PI, .7);
    this.addBanner(8.2, 5.9, -34.42, Math.PI, .7);
  }

  buildCastle() {
    // Castle gatehouse: deliberately taller and colder than the city gate.
    this.addBox(-19, 5.4, -48, 28, 10.8, 4.4, this.mat.stoneDark, true);
    this.addBox(19, 5.4, -48, 28, 10.8, 4.4, this.mat.stoneDark, true);
    this.addBox(0, 11.6, -48, 11.5, 3.1, 5.0, this.mat.stone, false);
    this.addTower(-8.1, -48, 4.5, 15, 4.9);
    this.addTower(8.1, -48, 4.5, 15, 4.9);
    this.addBanner(-3.2, 11.2, -45.72, 0, .95);
    this.addBanner(3.2, 11.2, -45.72, 0, .95);

    this.addBox(-27, 4.6, -76, 3.4, 9.2, 58, this.mat.stoneDark, true);
    this.addBox(27, 4.6, -76, 3.4, 9.2, 58, this.mat.stoneDark, true);

    // Portcullis has teeth and a counterweight feel.
    this.portcullis = new THREE.Group();
    for (let x = -3.7; x <= 3.7; x += .82) {
      const bar = this.addBox(x, 2.8, 0, .11, 5.6, .14, this.mat.iron, false, false, this.portcullis);
      const tooth = new THREE.Mesh(this.unitCone8, this.mat.iron);
      tooth.position.set(x, -.23, 0);
      tooth.scale.set(.22, .55, .22);
      tooth.rotation.z = Math.PI;
      this.portcullis.add(tooth);
    }
    this.addBox(0, 2.5, 0, 7.7, .14, .16, this.mat.iron, false, false, this.portcullis);
    this.addBox(0, 4.25, 0, 7.7, .14, .16, this.mat.iron, false, false, this.portcullis);
    this.portcullis.position.set(0, this.state.castleGateOpen ? 6.2 : 0, -48);
    this.scene.add(this.portcullis);
    this.gateCollider = { minX: -4.2, maxX: 4.2, minZ: -48.55, maxZ: -47.45, enabled: !this.state.castleGateOpen };
    this.colliders.push(this.gateCollider);

    // Inner court.
    const court = new THREE.Mesh(new THREE.PlaneGeometry(49, 50), mat(0x79736a));
    court.rotation.x = -Math.PI / 2;
    court.position.set(0, .012, -75);
    court.receiveShadow = true;
    this.scene.add(court);

    // Court arcades and banners.
    for (const side of [-1, 1]) {
      for (const z of [-60, -72, -84]) {
        this.addCylinder(side * 18.5, 2.4, z, .52, 4.8, this.mat.stoneLight);
        this.addBox(side * 18.5, 4.85, z, 3.7, .36, .55, this.mat.stone, false);
      }
      this.addBanner(side * 22.9, 6.3, -72, side < 0 ? Math.PI / 2 : -Math.PI / 2, .75);
    }

    // Central well and training corner.
    this.addCylinder(-9.8, .58, -76, 2.15, 1.16, this.mat.stone);
    this.addCylinder(-9.8, 1.1, -76, 1.35, .08, this.mat.water, this.scene, false);
    this.addBox(11.5, .8, -65, 2.4, 1.6, 1.25, this.mat.timber, false);
    this.addBox(13.4, .45, -66.2, 1.25, .9, 1.25, this.mat.timber, false);

    // Keep façade.
    this.addBox(-13.5, 7.2, -101, 19, 14.4, 5.2, this.mat.stoneDark, true);
    this.addBox(13.5, 7.2, -101, 19, 14.4, 5.2, this.mat.stoneDark, true);
    this.addBox(0, 13.5, -101, 10, 3.4, 5.2, this.mat.stone, false);
    this.addTower(-22.5, -102, 5.2, 18, 5.4);
    this.addTower(22.5, -102, 5.2, 18, 5.4);
    this.addBanner(-3.2, 12.6, -98.32, Math.PI, 1.05);
    this.addBanner(3.2, 12.6, -98.32, Math.PI, 1.05);

    // Crown window above the hall doors.
    for (const x of [-1.1, 0, 1.1]) {
      const h = x === 0 ? 2.1 : 1.5;
      this.addWindow(x, 12.8 + h * .18, -98.34, .58, h, 0xffc66f, Math.PI);
    }

    this.addTorch(-4.6, 3.8, -98.2, Math.PI);
    this.addTorch(4.6, 3.8, -98.2, Math.PI);

    this.buildGreatHall();
  }

  buildGreatHall() {
    const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 50), mat(0x555553));
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, .016, -126);
    hallFloor.receiveShadow = true;
    this.scene.add(hallFloor);
    this.addBox(0, 11.35, -126, 31.8, .5, 50, this.mat.slate, false, false);

    // Oxblood runner.
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 45), this.mat.cloth);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, .027, -126);
    this.scene.add(runner);

    this.addBox(-15.3, 5.5, -126, 1.2, 11, 50, this.mat.stoneDark, true);
    this.addBox(15.3, 5.5, -126, 1.2, 11, 50, this.mat.stoneDark, true);
    this.addBox(0, 5.5, -151, 31.8, 11, 1.2, this.mat.stoneDark, true);

    // Timber roof beams visually lift the ceiling without expensive geometry.
    for (let z = -106; z >= -146; z -= 8) {
      const beam = this.addBox(0, 10.2, z, 31, .48, .58, this.mat.timber, false);
      beam.rotation.z = 0;
      this.addBox(-8.7, 8.4, z, .38, 3.7, .38, this.mat.timber, false);
      this.addBox(8.7, 8.4, z, .38, 3.7, .38, this.mat.timber, false);
    }

    // Pillars, windows, benches and hearths.
    for (const side of [-1, 1]) {
      for (const z of [-111, -123, -135]) {
        this.addCylinder(side * 11.6, 3.7, z, .45, 7.4, this.mat.stoneLight);
        this.addWindow(side * 14.62, 6.5, z, .08, 1.9, 0xffb858, side < 0 ? Math.PI / 2 : -Math.PI / 2);
      }
      for (let z = -112; z >= -137; z -= 8.5) {
        this.addBox(side * 6.7, .47, z, 3.6, .44, .72, this.mat.timber, false);
      }
    }

    // Chandeliers: warm points, few lights, strong silhouette.
    for (const z of [-116, -132]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, .07, 6, 14), this.mat.iron);
      ring.position.set(0, 7.45, z);
      ring.rotation.x = Math.PI / 2;
      this.scene.add(ring);
      this.addBox(0, 8.7, z, .08, 2.5, .08, this.mat.iron, false, false);
      const l = new THREE.PointLight(C.flame, 14, 13, 2.1);
      l.position.set(0, 7.45, z);
      this.scene.add(l);
    }

    // Dais and throne.
    this.addBox(0, .32, -145, 9.2, .64, 5.1, this.mat.stoneLight, true);
    this.addBox(0, .72, -146.2, 6.6, .34, 3.1, this.mat.stone, true);
    this.addBox(0, 1.1, -147.2, 2.4, 1.35, 1.05, this.mat.timber, true);
    this.addBox(0, 2.25, -147.65, 2.55, 2.25, .3, this.mat.timber, false);
    this.addBox(-1.02, 1.65, -147.2, .28, 1.2, 1.1, this.mat.gold, false);
    this.addBox(1.02, 1.65, -147.2, .28, 1.2, 1.1, this.mat.gold, false);

    // Three-point crown crest above the throne.
    this.addBox(0, 6.2, -150.3, .36, 1.6, .12, this.mat.gold, false, false);
    const c1 = this.addBox(-.7, 5.95, -150.3, .3, 1.1, .12, this.mat.gold, false, false);
    c1.rotation.z = -.18;
    const c2 = this.addBox(.7, 5.95, -150.3, .3, 1.1, .12, this.mat.gold, false, false);
    c2.rotation.z = .18;

    this.addTorch(-12.7, 3.6, -113, Math.PI / 2);
    this.addTorch(12.7, 3.6, -113, -Math.PI / 2);
    this.addTorch(-12.7, 3.6, -136, Math.PI / 2);
    this.addTorch(12.7, 3.6, -136, -Math.PI / 2);
  }

  addSmoke(x, y, z) {
    const sprites = [];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
    grad.addColorStop(0, "rgba(220,220,210,.28)");
    grad.addColorStop(1, "rgba(180,185,180,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const sm = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .32 });
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Sprite(sm.clone());
      s.position.set(x, y + i * .72, z);
      s.scale.setScalar(.75 + i * .28);
      this.scene.add(s);
      sprites.push(s);
    }
    this.smoke.push({ sprites, x, y, z, phase: (x * 11 + z) % 5 });
  }

  createHumanoid({ id, name, x, z, color = this.mat.commonBlue, role = "citizen", range = 2.6, line = null, path = null, speed = .55, face = 0 }) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = face;

    const torso = new THREE.Mesh(this.unitCylinder8, color);
    torso.position.y = 1.15;
    torso.scale.set(.72, 1.15, .72);
    group.add(torso);

    const belt = this.addBox(0, .9, 0, .82, .13, .82, this.mat.darkLeather, false, false, group);
    const head = new THREE.Mesh(this.unitSphere, this.mat.skin);
    head.position.y = 1.95;
    head.scale.set(.55, .62, .55);
    group.add(head);

    const hair = new THREE.Mesh(this.unitSphere, role === "guard" ? this.mat.iron : this.mat.timber);
    hair.position.set(0, 2.15, -.02);
    hair.scale.set(.58, .32, .58);
    group.add(hair);

    const armL = this.addBox(-.43, 1.18, 0, .18, .92, .18, role === "guard" ? this.mat.guardBlue : color, false, false, group);
    const armR = this.addBox(.43, 1.18, 0, .18, .92, .18, role === "guard" ? this.mat.guardBlue : color, false, false, group);
    const legL = this.addBox(-.18, .43, 0, .22, .82, .24, this.mat.darkLeather, false, false, group);
    const legR = this.addBox(.18, .43, 0, .22, .82, .24, this.mat.darkLeather, false, false, group);

    if (role === "guard") {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 3.2, 6), this.mat.timber);
      spear.position.set(.7, 1.45, 0);
      group.add(spear);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.09, .35, 5), this.mat.iron);
      tip.position.set(.7, 3.18, 0);
      group.add(tip);
    }

    this.scene.add(group);
    const npc = {
      id, name, group, torso, head, armL, armR, legL, legR,
      origin: new THREE.Vector3(x, 0, z),
      path,
      pathT: Math.random(),
      speed,
      phase: Math.random() * Math.PI * 2,
      role
    };
    this.npcs.push(npc);

    if (line) {
      const interaction = {
        id,
        position: group.position,
        range,
        label: `E · ${name}`,
        use: () => {
          this.interactionsUsed.add(id);
          this.state.interactionsUsed = [...this.interactionsUsed];
          return { type: "dialogue", text: line };
        }
      };
      this.interactions.push(interaction);
    }
    return npc;
  }

  buildLife() {
    // City citizens: enough motion to make the street feel inhabited, few enough to stay cheap.
    this.createHumanoid({
      id: "gate-porter", name: "Gate porter", x: -4.8, z: 59,
      color: this.mat.commonTan,
      line: "“First time in Solvyr? Keep uphill and you’ll find the castle. Keep downhill and you’ll find trouble cheaper.”"
    });
    this.createHumanoid({
      id: "town-crier", name: "Town crier", x: 4.6, z: 45,
      color: this.mat.commonRust,
      line: "“Third bell! North bridge tolls waived until sundown! Yes, that includes mules. No, that does not include your brother.”"
    });
    this.createHumanoid({
      id: "market-woman", name: "Market seller", x: -5.4, z: 8.5,
      color: this.mat.commonGreen,
      line: "“Castle kitchens buy every good onion before noon. What’s left is for people like us.”"
    });
    this.createHumanoid({
      id: "apprentice", name: "Brewer's apprentice", x: 6.2, z: -9,
      color: this.mat.commonBlue,
      line: "“If they keep you at court past supper, come back down. The Black Crown pours after curfew.”"
    });

    const walkers = [
      [-2.6, 50, -2.5, 20, this.mat.commonBlue],
      [2.8, 38, 2.5, 5, this.mat.commonGreen],
      [-2.2, 18, -2.8, -17, this.mat.commonRust],
      [2.4, 2, 2.2, -24, this.mat.commonTan]
    ];
    walkers.forEach((w, i) => {
      this.createHumanoid({
        id: `walker-${i}`, name: "Citizen", x: w[0], z: w[1], color: w[4],
        path: { z0: w[1], z1: w[3] }, speed: .38 + i * .07
      });
    });

    // Castle guards and court life.
    this.guard = this.createHumanoid({
      id: "castle-guard",
      name: "Castle guard",
      x: 5.15,
      z: -41.5,
      color: this.mat.guardBlue,
      role: "guard",
      face: Math.PI,
      line: null
    });
    this.interactions.push({
      id: "castle-guard",
      position: this.guard.group.position,
      range: 3.35,
      label: this.state.castleGateOpen ? "E · Speak to the castle guard" : "E · Present yourself to the castle guard",
      use: () => {
        if (!this.state.castleGateOpen) {
          this.state.castleGateOpen = true;
          this.gateCollider.enabled = false;
          this.queueEvent("gate-opened", {
            text: "The guard checks the seal twice, then looks at you differently. “You’re expected.”",
            audio: "gate"
          });
          return { type: "gate-opened", text: "“You’re expected.” The guard signals the winch." };
        }
        return { type: "dialogue", text: "“Straight through the court. Don’t wander into the west stair unless you enjoy paperwork.”" };
      }
    });

    this.createHumanoid({
      id: "court-guard-1", name: "Court guard", x: -18, z: -63, color: this.mat.guardBlue, role: "guard", face: Math.PI / 2
    });
    this.createHumanoid({
      id: "court-guard-2", name: "Court guard", x: 18, z: -86, color: this.mat.guardBlue, role: "guard", face: -Math.PI / 2
    });

    this.createHumanoid({
      id: "stable-boy", name: "Stable hand", x: 11.2, z: -65.5, color: this.mat.commonTan,
      line: "“Court messenger took the fast gray. If you’re important, apparently you walk.”"
    });

    const courtPeople = [
      [-6.7,-118,this.mat.commonGreen], [6.7,-121,this.mat.commonRust],
      [-6.5,-130,this.mat.commonBlue], [6.6,-134,this.mat.commonTan]
    ];
    courtPeople.forEach((p,i)=>this.createHumanoid({
      id:`courtier-${i}`, name:"Court petitioner", x:p[0], z:p[1], color:p[2], face:p[0] < 0 ? Math.PI/2 : -Math.PI/2
    }));

    this.createHumanoid({
      id: "chamberlain",
      name: "Royal chamberlain",
      x: 3.6,
      z: -142.5,
      color: this.mat.commonRust,
      face: Math.PI,
      line: "The chamberlain lifts one finger. “A moment. The court is finishing the grain petitions. You made good time.”"
    });

    this.buildCart();
    this.buildCat();
    this.buildBirds();
  }

  buildCart() {
    const g = new THREE.Group();
    this.addBox(0, .75, 0, 2.1, .7, 1.25, this.mat.timber, false, true, g);
    this.addBox(0, 1.15, -.25, 1.8, .22, 1.0, this.mat.commonTan, false, false, g);
    for (const x of [-.86,.86]) {
      for (const z of [-.55,.55]) {
        const wheel = new THREE.Mesh(this.unitWheel, this.mat.darkLeather);
        wheel.position.set(x, .46, z);
        wheel.rotation.z = Math.PI / 2;
        wheel.scale.set(.48, .48, .48);
        g.add(wheel);
      }
    }
    g.position.set(-3.45, 0, 26);
    this.scene.add(g);
    this.cart = { group: g, z0: 45, z1: -18, t: .12, speed: .035 };
  }

  buildCat() {
    const g = new THREE.Group();
    const catMat = mat(0xb57943);
    const body = new THREE.Mesh(this.unitBox, catMat);
    body.scale.set(.58, .32, 1.05);
    body.position.y = .32;
    g.add(body);
    const head = new THREE.Mesh(this.unitSphere, catMat);
    head.scale.set(.38, .36, .38);
    head.position.set(0, .54, -.55);
    g.add(head);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(.06, .045, .9, 6), catMat);
    tail.position.set(0, .55, .67);
    tail.rotation.x = -.72;
    g.add(tail);
    g.position.set(-5.7, 0, 14);
    this.scene.add(g);
    this.cat = { group:g, baseX:-5.7, baseZ:14, phase:0 };
    this.interactions.push({
      id:"market-cat",
      position:g.position,
      range:2.0,
      label:"E · Attempt diplomacy",
      use:()=>({type:"dialogue", text:"The cat considers your diplomatic offer, blinks once, and resumes guarding the fish crate."})
    });
  }

  buildBirds() {
    const birdMat = new THREE.MeshBasicMaterial({ color:0x2b3132, side:THREE.DoubleSide });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute([
      -0.42,0,0, 0,0.12,0, 0.42,0,0,
      0,0.12,0, 0,-.04,.18, 0.42,0,0
    ],3));
    for (let i=0;i<6;i++) {
      const b = new THREE.Mesh(geom,birdMat);
      this.scene.add(b);
      this.birds.push({mesh:b, phase:i/6*Math.PI*2, radius:18+i*2.4, y:15+(i%3)*2.2});
    }
  }

  queueEvent(type, data = {}) {
    this.events.push({ type, ...data });
  }

  drainEvents() {
    if (!this.events.length) return [];
    const events = this.events;
    this.events = [];
    return events;
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
    if (position.z < -140) return "Wait for the chamberlain at the royal dais";
    if (position.z < -101) return "Cross the Great Hall";
    if (position.z < -50) return "Enter the keep";
    if (this.state.castleGateOpen) return "Pass beneath the raised portcullis";
    if (position.z < -28) return "Present your sealed summons at the castle gate";
    if (position.z < 57) return "Follow Crown Street uphill to Solvyr Castle";
    if (position.z < 95) return "Enter Solvyr through the South Gate";
    return "Follow the King's Road to the capital";
  }

  moment(id, condition, payload) {
    if (!condition || this.momentsSeen.has(id)) return;
    this.momentsSeen.add(id);
    this.state.momentsSeen = [...this.momentsSeen];
    this.queueEvent("moment", { id, ...payload });
  }

  update(dt, playerPosition) {
    this.clock += dt;

    const gateTarget = this.state.castleGateOpen ? 6.2 : 0;
    this.portcullis.position.y = THREE.MathUtils.damp(this.portcullis.position.y, gateTarget, 2.25, dt);

    for (const b of this.animatedBanners) {
      b.group.rotation.z = Math.sin(this.clock * 1.15 + b.phase) * .018;
      b.cloth.rotation.y = Math.sin(this.clock * 1.7 + b.phase) * .06;
    }

    for (const t of this.torches) {
      const flicker = .88 + Math.sin(this.clock * 12 + t.phase) * .11 + Math.sin(this.clock * 21.3 + t.phase) * .04;
      t.flame.scale.y = flicker;
      if (t.light) t.light.intensity = 8.8 + flicker * 2.1;
    }

    for (const s of this.smoke) {
      s.sprites.forEach((sprite, i) => {
        const cycle = (this.clock * .18 + i / s.sprites.length + s.phase) % 1;
        sprite.position.set(
          s.x + Math.sin(this.clock * .55 + i) * .22 + cycle * .35,
          s.y + cycle * 4.4,
          s.z + Math.cos(this.clock * .42 + i) * .17
        );
        const sc = .65 + cycle * 1.65;
        sprite.scale.setScalar(sc);
        sprite.material.opacity = .24 * (1 - cycle);
      });
    }

    for (const n of this.npcs) {
      if (n.path) {
        n.pathT += dt * n.speed * .06;
        const ping = (Math.sin(n.pathT * Math.PI * 2) + 1) * .5;
        const z = THREE.MathUtils.lerp(n.path.z0, n.path.z1, ping);
        const dz = Math.cos(n.pathT * Math.PI * 2);
        n.group.position.z = z;
        n.group.rotation.y = dz > 0 ? 0 : Math.PI;
        const swing = Math.sin(this.clock * 7 + n.phase) * .42;
        n.armL.rotation.x = swing;
        n.armR.rotation.x = -swing;
        n.legL.rotation.x = -swing * .65;
        n.legR.rotation.x = swing * .65;
        n.group.position.y = Math.abs(Math.sin(this.clock * 7 + n.phase)) * .018;
      } else {
        const d = n.group.position.distanceTo(playerPosition);
        if (d < 4.8 && n.role !== "guard") {
          const target = Math.atan2(playerPosition.x - n.group.position.x, playerPosition.z - n.group.position.z);
          n.group.rotation.y = THREE.MathUtils.damp(n.group.rotation.y, target, 3.2, dt);
        }
        n.group.position.y = Math.sin(this.clock * 1.4 + n.phase) * .006;
      }
    }

    if (this.cart) {
      this.cart.t = (this.cart.t + dt * this.cart.speed) % 1;
      this.cart.group.position.z = THREE.MathUtils.lerp(this.cart.z0, this.cart.z1, this.cart.t);
      this.cart.group.position.x = -3.55 + Math.sin(this.cart.t * Math.PI * 2) * .22;
    }

    if (this.cat) {
      this.cat.phase += dt;
      this.cat.group.position.x = this.cat.baseX + Math.sin(this.cat.phase * .35) * .4;
      this.cat.group.rotation.y = Math.sin(this.cat.phase * .22) * .18;
    }

    this.birds.forEach((b,i)=>{
      const a = this.clock * (.10 + i*.008) + b.phase;
      b.mesh.position.set(Math.sin(a)*b.radius, b.y + Math.sin(a*2.3)*.7, 40 + Math.cos(a)*b.radius*.65);
      b.mesh.rotation.y = -a;
      b.mesh.rotation.z = Math.sin(this.clock*5 + i)*.08;
    });

    this.moment("first-reveal", playerPosition.z < 134, {
      kicker: "THE CROWN CITY",
      title: "Solvyr",
      subtitle: "Capital of Solvyn",
      audio: "bell"
    });
    this.moment("gate-life", playerPosition.z < 60, {
      text: "Beyond the gate, Solvyr smells of woodsmoke, wet stone, bread—and too many people with somewhere to be."
    });
    this.moment("castle-reveal", playerPosition.z < -25, {
      kicker: "THE HIGH CITY",
      title: "Solvyr Castle",
      subtitle: "Seat of the Crown"
    });
    this.moment("court-entry", playerPosition.z < -53 && this.state.castleGateOpen, {
      text: "Inside the walls, the city noise falls away. Steel, boots, fountain water. The castle keeps a different rhythm."
    });
    this.moment("hall-entry", playerPosition.z < -103, {
      kicker: "SOLVYR CASTLE",
      title: "The Great Hall",
      subtitle: "Petitioners lower their voices as you enter",
      audio: "chime"
    });
    this.moment("dais-arrival", playerPosition.z < -140, {
      text: "The chamberlain notices the seal in your hand. Conversation near the dais thins to a hush."
    });
  }
}
