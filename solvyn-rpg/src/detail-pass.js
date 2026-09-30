import * as THREE from "three";

const SRGB = THREE.SRGBColorSpace;

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function canvasTexture(draw, seed, color = true, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size, mulberry32(seed));
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  if (color) texture.colorSpace = SRGB;
  texture.needsUpdate = true;
  return texture;
}

function stoneColor(ctx, s, rand) {
  ctx.fillStyle = "#9b9688";
  ctx.fillRect(0, 0, s, s);
  const course = 28;
  for (let y = -course; y < s + course; y += course) {
    const row = Math.floor(y / course);
    const offset = row % 2 ? -34 : 0;
    for (let x = offset; x < s + 68; x += 68) {
      const shade = 128 + Math.floor(rand() * 30);
      ctx.fillStyle = "rgb(" + (shade + 10) + "," + (shade + 7) + "," + shade + ")";
      ctx.fillRect(x + 2, y + 2, 64, 24);
      ctx.strokeStyle = "rgba(60,58,53,.42)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, 64, 24);
      if (rand() > .55) {
        ctx.strokeStyle = "rgba(63,62,57,.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const cx = x + 10 + rand() * 45;
        const cy = y + 5 + rand() * 14;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 4 + rand() * 12, cy + 3 + rand() * 5);
        ctx.lineTo(cx + 2 + rand() * 6, cy + 8 + rand() * 5);
        ctx.stroke();
      }
    }
  }
  for (let i = 0; i < 900; i++) {
    const a = .025 + rand() * .055;
    ctx.fillStyle = rand() > .5 ? "rgba(255,245,220," + a + ")" : "rgba(40,42,38," + a + ")";
    ctx.fillRect(rand() * s, rand() * s, 1 + rand() * 2, 1 + rand() * 2);
  }
}

function stoneBump(ctx, s, rand) {
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, s, s);
  const course = 28;
  for (let y = -course; y < s + course; y += course) {
    const row = Math.floor(y / course);
    const offset = row % 2 ? -34 : 0;
    for (let x = offset; x < s + 68; x += 68) {
      const g = 150 + Math.floor(rand() * 45);
      ctx.fillStyle = "rgb(" + g + "," + g + "," + g + ")";
      ctx.fillRect(x + 2, y + 2, 64, 24);
      ctx.strokeStyle = "#343434";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, 64, 24);
    }
  }
}

function plasterColor(ctx, s, rand) {
  ctx.fillStyle = "#c9c0ab";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 360; i++) {
    const r = 2 + rand() * 18;
    ctx.fillStyle = rand() > .45 ? "rgba(86,77,62," + (.015 + rand() * .055) + ")" : "rgba(255,249,228," + (.02 + rand() * .06) + ")";
    ctx.beginPath();
    ctx.arc(rand() * s, rand() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(71,66,58,.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    let x = rand() * s;
    let y = rand() * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (rand() - .5) * 14;
      y += 5 + rand() * 10;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function plasterBump(ctx, s, rand) {
  ctx.fillStyle = "#999";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 500; i++) {
    const g = 125 + Math.floor(rand() * 60);
    ctx.fillStyle = "rgb(" + g + "," + g + "," + g + ")";
    const r = 1 + rand() * 5;
    ctx.beginPath();
    ctx.arc(rand() * s, rand() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function woodColor(ctx, s, rand) {
  ctx.fillStyle = "#5a412f";
  ctx.fillRect(0, 0, s, s);
  for (let x = 0; x < s; x += 18) {
    const w = 14 + rand() * 5;
    ctx.fillStyle = rand() > .5 ? "#624832" : "#503726";
    ctx.fillRect(x, 0, w, s);
    ctx.fillStyle = "rgba(25,18,13,.34)";
    ctx.fillRect(x + w - 2, 0, 2, s);
    for (let j = 0; j < 14; j++) {
      const y = rand() * s;
      ctx.strokeStyle = "rgba(28,19,13," + (.12 + rand() * .16) + ")";
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.bezierCurveTo(x + w * .3, y - 3, x + w * .7, y + 4, x + w - 2, y + rand() * 2);
      ctx.stroke();
    }
  }
}

function slateColor(ctx, s, rand) {
  ctx.fillStyle = "#2a373b";
  ctx.fillRect(0, 0, s, s);
  const h = 24;
  for (let y = 0; y < s + h; y += h) {
    const off = (Math.floor(y / h) % 2) * 16;
    for (let x = -32 + off; x < s + 32; x += 32) {
      const c = 40 + Math.floor(rand() * 18);
      ctx.fillStyle = "rgb(" + c + "," + (c + 9) + "," + (c + 12) + ")";
      ctx.fillRect(x + 1, y + 1, 29, 20);
      ctx.strokeStyle = "rgba(8,13,15,.45)";
      ctx.strokeRect(x + 1, y + 1, 29, 20);
    }
  }
}

function clothColor(ctx, s, rand) {
  ctx.fillStyle = "#742b34";
  ctx.fillRect(0, 0, s, s);
  ctx.lineWidth = 1;
  for (let i = 0; i < s; i += 4) {
    ctx.strokeStyle = "rgba(255,235,220,.035)";
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, s);
    ctx.stroke();
    ctx.strokeStyle = "rgba(20,7,9,.055)";
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(s, i);
    ctx.stroke();
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = "rgba(255,220,180," + (.01 + rand() * .03) + ")";
    ctx.fillRect(rand() * s, rand() * s, 1, 1);
  }
}

function cobbleColor(ctx, s, rand) {
  ctx.fillStyle = "#4d4a45";
  ctx.fillRect(0, 0, s, s);
  const cell = 32;
  for (let y = -cell; y < s + cell; y += cell) {
    const row = Math.floor(y / cell);
    const off = row % 2 ? -16 : 0;
    for (let x = off; x < s + cell; x += cell) {
      const cx = x + cell * .5 + (rand() - .5) * 5;
      const cy = y + cell * .5 + (rand() - .5) * 5;
      const rx = 12 + rand() * 4;
      const ry = 9 + rand() * 4;
      const c = 105 + Math.floor(rand() * 30);
      ctx.fillStyle = "rgb(" + (c + 5) + "," + c + "," + (c - 7) + ")";
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (rand() - .5) * .35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(28,29,27,.72)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(235,225,200,.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx - rx * .2, cy - ry * .25, Math.max(2, rx * .45), Math.PI * 1.05, Math.PI * 1.75);
      ctx.stroke();
    }
  }
}

function cobbleBump(ctx, s, rand) {
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, s, s);
  const cell = 32;
  for (let y = -cell; y < s + cell; y += cell) {
    const row = Math.floor(y / cell);
    const off = row % 2 ? -16 : 0;
    for (let x = off; x < s + cell; x += cell) {
      const cx = x + cell * .5 + (rand() - .5) * 4;
      const cy = y + cell * .5 + (rand() - .5) * 4;
      ctx.fillStyle = "#c6c6c6";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12 + rand() * 4, 9 + rand() * 4, (rand() - .5) * .3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function grassColor(ctx, s, rand) {
  ctx.fillStyle = "#52674f";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 1600; i++) {
    const g = 65 + Math.floor(rand() * 45);
    ctx.fillStyle = "rgba(" + (g - 16) + "," + g + "," + (g - 20) + "," + (.08 + rand() * .18) + ")";
    const x = rand() * s;
    const y = rand() * s;
    ctx.fillRect(x, y, 1, 2 + rand() * 4);
  }
}

function ivyTexture(ctx, s, rand) {
  ctx.clearRect(0, 0, s, s);
  for (let i = 0; i < 120; i++) {
    const x = rand() * s;
    const y = rand() * s;
    const r = 2 + rand() * 5;
    ctx.fillStyle = "rgba(" + (35 + Math.floor(rand() * 20)) + "," + (72 + Math.floor(rand() * 35)) + "," + (38 + Math.floor(rand() * 15)) + "," + (.55 + rand() * .4) + ")";
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.3, r, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function cloneTexture(texture, rx, ry) {
  const t = texture.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function applyMap(material, map, bump, rx, ry, bumpScale) {
  material.map = cloneTexture(map, rx, ry);
  if (bump) {
    material.bumpMap = cloneTexture(bump, rx, ry);
    material.bumpScale = bumpScale;
  }
  material.needsUpdate = true;
}

function makeOverlayMaterial(map, bump, rx, ry, roughness, bumpScale, tint) {
  const m = new THREE.MeshStandardMaterial({
    color: tint || 0xffffff,
    map: cloneTexture(map, rx, ry),
    roughness: roughness,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  if (bump) {
    m.bumpMap = cloneTexture(bump, rx, ry);
    m.bumpScale = bumpScale;
  }
  return m;
}

function addHorizontal(world, x, y, z, w, d, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  return mesh;
}

function addWallZ(world, x, y, z, w, h, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  return mesh;
}

function addWallX(world, x, y, z, w, h, material, facing) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.rotation.y = facing || Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  return mesh;
}

function instancedBoxes(world, specs, material, cast) {
  if (!specs.length) return null;
  const mesh = new THREE.InstancedMesh(world.unitBox, material, specs.length);
  const d = new THREE.Object3D();
  specs.forEach(function (s, i) {
    d.position.set(s[0], s[1], s[2]);
    d.rotation.set(s[6] || 0, s[7] || 0, s[8] || 0);
    d.scale.set(s[3], s[4], s[5]);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  });
  mesh.castShadow = Boolean(cast);
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  return mesh;
}

function instancedCylinders(world, specs, material, cast) {
  if (!specs.length) return null;
  const mesh = new THREE.InstancedMesh(world.unitCylinder8, material, specs.length);
  const d = new THREE.Object3D();
  specs.forEach(function (s, i) {
    d.position.set(s[0], s[1], s[2]);
    d.rotation.set(s[6] || 0, s[7] || 0, s[8] || 0);
    d.scale.set(s[3] * 2, s[4], s[3] * 2);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  });
  mesh.castShadow = Boolean(cast);
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  return mesh;
}

function addArch(world, z, centerY, radiusX, radiusY, depth, material) {
  const specs = [];
  const count = 15;
  for (let i = 0; i < count; i++) {
    const a = Math.PI * i / (count - 1);
    const x = Math.cos(a) * radiusX;
    const y = centerY + Math.sin(a) * radiusY;
    specs.push([x, y, z, .82, .42, depth, 0, a - Math.PI / 2, 0]);
  }
  instancedBoxes(world, specs, material, true);
}

function addFacadeDetail(world) {
  const doors = [];
  const sills = [];
  const shutters = [];
  const eaves = [];
  const houses = [
    [-14.3,49,8.5,10,6.4],[14.1,48,8.8,11,7.4],[-14.8,35,9,10.2,7.0],[13.8,33,8.2,9.2,5.9],
    [-14.1,19,8.5,10.2,7.5],[14.4,17,9,10,6.4],[-14.8,2,9.2,10.5,6.7],[13.8,0,8.4,10.2,7.3],
    [-14.2,-17,8.6,10.6,7.1],[14.6,-18,9,10.4,6.6]
  ];
  houses.forEach(function (h, i) {
    const x = h[0], z = h[1], sx = h[2], sz = h[3], height = h[4];
    const side = x < 0 ? 1 : -1;
    const fx = x + side * (sx / 2 + .08);
    doors.push([fx, 1.15, z + sz * .23, .18, 2.25, 1.35, 0, 0, side > 0 ? -Math.PI / 2 : Math.PI / 2]);
    eaves.push([fx, height - .15, z, .18, .22, sz * .88, 0, 0, 0]);
    for (const dz of [-sz * .2, sz * .2]) {
      sills.push([fx, 2.0, z + dz, .18, .13, 1.05, 0, 0, 0]);
      if (height > 6.2) sills.push([fx, 4.1, z + dz, .18, .13, 1.05, 0, 0, 0]);
      shutters.push([fx + side * .02, 2.28, z + dz - .52, .12, 1.05, .32, 0, 0, 0]);
      shutters.push([fx + side * .02, 2.28, z + dz + .52, .12, 1.05, .32, 0, 0, 0]);
    }
    if (i % 2 === 0) {
      shutters.push([fx + side * .03, 1.08, z - sz * .22, .13, .8, .55, 0, 0, 0]);
    }
  });
  instancedBoxes(world, doors, world.mat.timber, true);
  instancedBoxes(world, sills, world.mat.stoneLight, false);
  instancedBoxes(world, shutters, world.mat.timber, false);
  instancedBoxes(world, eaves, world.mat.timber, true);

  addArch(world, 67.28, 5.1, 5.2, 3.7, .48, world.mat.stoneLight);
  addArch(world, -45.68, 5.8, 4.9, 4.1, .5, world.mat.stoneLight);
  addArch(world, -98.28, 6.1, 5.0, 4.2, .52, world.mat.stoneLight);
}

function addStreetClutter(world) {
  const crates = [
    [-7.5,.45,42,1.1,.9,.9],[7.7,.38,30,1,.76,1],[-7.5,.35,9,.9,.7,.9],[7.3,.5,-10,1.2,1,.85],
    [-9.2,.36,18,.9,.72,.9],[9.4,.33,4,.8,.66,.8],[-7.9,.28,-19,.7,.56,.7],
    [-12.2,.4,52,1,.8,1], [12.1,.45,41,1.15,.9,.9],[-11.8,.32,27,.8,.64,.9],
    [10.9,.34,-16,.9,.68,.8],[-18.3,.42,-68,1.2,.84,1.1],[12.1,.45,-64,1.2,.9,1.1],
    [13.5,.32,-83,.85,.64,.85],[-7.4,.36,-82,.95,.72,.95]
  ];
  instancedBoxes(world, crates, world.mat.timber, true);

  const barrels = [
    [-8.7,.58,38,.46,1.16,.46,0,0,0],[8.4,.58,22,.46,1.16,.46,0,0,0],[-8.5,.58,-7,.46,1.16,.46,0,0,0],
    [9.1,.58,-20,.46,1.16,.46,0,0,0],[-14.5,.58,-62,.46,1.16,.46,0,0,0],[13.8,.58,-78,.46,1.16,.46,0,0,0],
    [-6.8,.58,-112,.46,1.16,.46,0,0,0],[7.2,.58,-136,.46,1.16,.46,0,0,0]
  ];
  instancedCylinders(world, barrels, world.mat.darkLeather, true);

  const sacks = [];
  const sackMat = new THREE.MeshStandardMaterial({ color:0x98846c, roughness:1 });
  const sackGeo = new THREE.SphereGeometry(.5, 8, 6);
  const sackMesh = new THREE.InstancedMesh(sackGeo, sackMat, 18);
  const d = new THREE.Object3D();
  let n = 0;
  [
    [-6.9,40],[-6.2,39.5],[6.4,28.3],[7.2,27.8],[-6.4,7.2],[-7.2,6.8],[6.4,-11],[7.3,-11.5],
    [-16.5,-71],[-15.8,-72],[12,-67],[12.8,-67.2],[-7,-120],[7,-123],[-8,-132],[7.6,-134],[-10,52],[10,44]
  ].forEach(function (p) {
    d.position.set(p[0], .38, p[1]);
    d.scale.set(.55 + (n % 3) * .06, .7, .48);
    d.rotation.y = n * .73;
    d.updateMatrix();
    sackMesh.setMatrixAt(n++, d.matrix);
  });
  sackMesh.castShadow = true;
  sackMesh.receiveShadow = true;
  world.scene.add(sackMesh);

  const benches = [];
  [[-8.4,24],[8.2,10],[-8.2,-13],[-13,-74],[12,-88]].forEach(function (p, i) {
    benches.push([p[0],.58,p[1],2.5,.18,.65,0,(i % 2) * Math.PI / 2,0]);
    benches.push([p[0]-.9,.29,p[1],.14,.58,.14,0,0,0]);
    benches.push([p[0]+.9,.29,p[1],.14,.58,.14,0,0,0]);
  });
  instancedBoxes(world, benches, world.mat.timber, true);

  const curb = [];
  for (const side of [-1,1]) {
    for (let z = 54; z >= -26; z -= 3.2) {
      curb.push([side * 5.55,.10,z,.62,.20,2.75,0,0,0]);
    }
  }
  instancedBoxes(world, curb, world.mat.stoneLight, false);
}

function addApproachGroundDetail(world) {
  const tuftGeo = new THREE.ConeGeometry(.09, .42, 3);
  const tuftMat = new THREE.MeshStandardMaterial({ color:0x435b3f, roughness:1 });
  const count = 170;
  const mesh = new THREE.InstancedMesh(tuftGeo, tuftMat, count);
  const d = new THREE.Object3D();
  const rand = mulberry32(91473);
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const z = 70 + rand() * 82;
    const x = side * (6.3 + rand() * 18);
    const scale = .55 + rand() * .8;
    d.position.set(x, .18 * scale, z);
    d.rotation.y = rand() * Math.PI;
    d.scale.set(scale, scale, scale);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  }
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  world.scene.add(mesh);

  const rocks = [];
  for (let i = 0; i < 44; i++) {
    const side = i % 2 ? 1 : -1;
    const z = 74 + rand() * 74;
    const x = side * (6.8 + rand() * 16);
    rocks.push([x,.12,z,.22 + rand()*.38,.16 + rand()*.28,.25 + rand()*.5,0,rand()*Math.PI,rand()*.25]);
  }
  instancedBoxes(world, rocks, world.mat.stoneDark, false);
}

function addLaundryAndIvy(world, ivyMap) {
  const lineMat = new THREE.LineBasicMaterial({ color:0x5a4a39, transparent:true, opacity:.7 });
  [
    [[-8.8,5.6,36],[-5.9,4.4,34]],
    [[8.8,5.2,2],[5.9,4.2,-1]],
    [[-8.9,5.0,-12],[-5.8,4.1,-14]]
  ].forEach(function (pair, idx) {
    const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...pair[0]), new THREE.Vector3(...pair[1])]);
    world.scene.add(new THREE.Line(geom, lineMat));
    for (let j = 0; j < 3; j++) {
      const t = .22 + j * .27;
      const x = THREE.MathUtils.lerp(pair[0][0], pair[1][0], t);
      const y = THREE.MathUtils.lerp(pair[0][1], pair[1][1], t) - .25;
      const z = THREE.MathUtils.lerp(pair[0][2], pair[1][2], t);
      const mat = j % 2 ? world.mat.clothGold : world.mat.cloth;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.7,.72), mat);
      cloth.position.set(x,y,z);
      cloth.rotation.y = idx % 2 ? Math.PI/2 : 0;
      world.scene.add(cloth);
    }
  });

  const ivyMat = new THREE.MeshStandardMaterial({
    map: ivyMap,
    transparent:true,
    alphaTest:.16,
    depthWrite:false,
    side:THREE.DoubleSide,
    roughness:1,
    polygonOffset:true,
    polygonOffsetFactor:-2
  });
  [
    [-18,4.1,67.33,4,5,0], [18.5,3.5,67.33,3.5,4.5,0],
    [-18,4.5,-45.58,4,5,0], [20,5.1,-45.58,4,6,0],
    [-23.25,4.2,-79,7,4.5,Math.PI/2], [23.25,5,-68,6,5,Math.PI/2]
  ].forEach(function (s) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s[3],s[4]), ivyMat);
    m.position.set(s[0],s[1],s[2]);
    m.rotation.y = s[5];
    world.scene.add(m);
  });
}

function addDust(world) {
  const count = 80;
  const pos = new Float32Array(count * 3);
  const rand = mulberry32(8312);
  for (let i = 0; i < count; i++) {
    pos[i*3] = -13 + rand() * 26;
    pos[i*3+1] = .8 + rand() * 9;
    pos[i*3+2] = -104 - rand() * 43;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color:0xe9d7ad,
    size:.055,
    transparent:true,
    opacity:.22,
    depthWrite:false,
    sizeAttenuation:true
  });
  const points = new THREE.Points(g,m);
  world.scene.add(points);
  return points;
}

export function installDetailPass(world) {
  const tex = {
    stone: canvasTexture(stoneColor, 11, true),
    stoneBump: canvasTexture(stoneBump, 12, false),
    plaster: canvasTexture(plasterColor, 21, true),
    plasterBump: canvasTexture(plasterBump, 22, false),
    wood: canvasTexture(woodColor, 31, true),
    slate: canvasTexture(slateColor, 41, true),
    cloth: canvasTexture(clothColor, 51, true),
    cobble: canvasTexture(cobbleColor, 61, true),
    cobbleBump: canvasTexture(cobbleBump, 62, false),
    grass: canvasTexture(grassColor, 71, true),
    ivy: canvasTexture(ivyTexture, 81, true, 128)
  };

  applyMap(world.mat.stone, tex.stone, tex.stoneBump, 5, 5, .055);
  applyMap(world.mat.stoneLight, tex.stone, tex.stoneBump, 5, 5, .045);
  applyMap(world.mat.stoneDark, tex.stone, tex.stoneBump, 5, 5, .04);
  applyMap(world.mat.plaster, tex.plaster, tex.plasterBump, 3, 4, .03);
  applyMap(world.mat.plasterWarm, tex.plaster, tex.plasterBump, 3, 4, .03);
  applyMap(world.mat.timber, tex.wood, null, 3, 6, 0);
  applyMap(world.mat.slate, tex.slate, null, 5, 6, 0);
  applyMap(world.mat.cloth, tex.cloth, null, 4, 8, 0);
  applyMap(world.mat.clothGold, tex.cloth, null, 4, 8, 0);
  applyMap(world.mat.grass, tex.grass, null, 14, 28, 0);
  applyMap(world.mat.grassDark, tex.grass, null, 12, 20, 0);
  applyMap(world.mat.road, tex.cobble, tex.cobbleBump, 4, 55, .07);

  const roadMat = makeOverlayMaterial(tex.cobble, tex.cobbleBump, 4, 62, .96, .075, 0xa39a8a);
  addHorizontal(world, 0, .019, 2, 10.35, 290, roadMat);

  const courtMat = makeOverlayMaterial(tex.cobble, tex.cobbleBump, 12, 12, .96, .06, 0xaaa095);
  addHorizontal(world, 0, .024, -75, 48.2, 49.2, courtMat);

  const hallStone = makeOverlayMaterial(tex.stone, tex.stoneBump, 8, 14, .96, .035, 0x77736b);
  addHorizontal(world, 0, .022, -126, 29.9, 49.4, hallStone);

  const gateStone = makeOverlayMaterial(tex.stone, tex.stoneBump, 10, 4, .94, .05, 0x8b877d);
  addWallZ(world, -21, 4.2, 67.13, 27, 8.2, gateStone);
  addWallZ(world, 21, 4.2, 67.13, 27, 8.2, gateStone);
  addWallZ(world, -19, 5.4, -45.76, 28, 10.6, gateStone);
  addWallZ(world, 19, 5.4, -45.76, 28, 10.6, gateStone);
  addWallZ(world, -13.5, 7.2, -98.36, 19, 14.1, gateStone);
  addWallZ(world, 13.5, 7.2, -98.36, 19, 14.1, gateStone);

  const hallWall = makeOverlayMaterial(tex.stone, tex.stoneBump, 12, 4, .95, .045, 0x6e706b);
  addWallX(world, -14.68, 5.5, -126, 49, 10.7, hallWall, Math.PI / 2);
  addWallX(world, 14.68, 5.5, -126, 49, 10.7, hallWall, -Math.PI / 2);

  const houses = [
    [-14.3,49,8.5,10,6.4,0],[14.1,48,8.8,11,7.4,1],[-14.8,35,9,10.2,7.0,2],[13.8,33,8.2,9.2,5.9,0],
    [-14.1,19,8.5,10.2,7.5,1],[14.4,17,9,10,6.4,2],[-14.8,2,9.2,10.5,6.7,0],[13.8,0,8.4,10.2,7.3,1],
    [-14.2,-17,8.6,10.6,7.1,2],[14.6,-18,9,10.4,6.6,0]
  ];
  houses.forEach(function (h) {
    const x=h[0], z=h[1], sx=h[2], sz=h[3], height=h[4], tone=h[5];
    const side = x < 0 ? 1 : -1;
    const fx = x + side * (sx / 2 + .065);
    const tint = tone === 0 ? 0xd8cdb7 : tone === 1 ? 0xbcae96 : 0xc5bba6;
    const m = makeOverlayMaterial(tex.plaster, tex.plasterBump, 2.5, 3.5, .98, .03, tint);
    addWallX(world, fx, height/2, z, sz * .98, height * .96, m, side > 0 ? Math.PI/2 : -Math.PI/2);
  });

  addFacadeDetail(world);
  addStreetClutter(world);
  addApproachGroundDetail(world);
  addLaundryAndIvy(world, tex.ivy);

  const dust = addDust(world);

  return {
    update: function (dt) {
      dust.rotation.y += dt * .006;
      dust.position.y = Math.sin(world.clock * .12) * .08;
    }
  };
}
