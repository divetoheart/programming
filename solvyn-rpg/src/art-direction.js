import * as THREE from "three";

function rng(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function tint(hex, amount) {
  const c = hexToRgb(hex);
  return "rgb(" +
    Math.max(0, Math.min(255, Math.round(c[0] + amount))) + "," +
    Math.max(0, Math.min(255, Math.round(c[1] + amount))) + "," +
    Math.max(0, Math.min(255, Math.round(c[2] + amount))) + ")";
}

function paintedTexture({ seed, base, light, dark, direction = "mixed", size = 384, blocks = false }) {
  const random = rng(seed);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = tint(base, 0);
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = "round";
  for (let i = 0; i < 230; i++) {
    const warm = random() > .48;
    ctx.strokeStyle = warm ? tint(light, (random() - .5) * 14) : tint(dark, (random() - .5) * 12);
    ctx.globalAlpha = .018 + random() * .052;
    ctx.lineWidth = 2 + random() * 13;
    const x = random() * size;
    const y = random() * size;
    const len = 12 + random() * 58;
    ctx.beginPath();
    if (direction === "vertical") {
      ctx.moveTo(x, y - len * .5);
      ctx.bezierCurveTo(x + (random()-.5)*7, y, x + (random()-.5)*7, y, x, y + len*.5);
    } else if (direction === "horizontal") {
      ctx.moveTo(x - len*.5, y);
      ctx.bezierCurveTo(x, y+(random()-.5)*7, x, y+(random()-.5)*7, x+len*.5, y);
    } else {
      const a = random() * Math.PI;
      ctx.moveTo(x - Math.cos(a)*len*.5, y - Math.sin(a)*len*.5);
      ctx.lineTo(x + Math.cos(a)*len*.5, y + Math.sin(a)*len*.5);
    }
    ctx.stroke();
  }

  if (blocks) {
    const course = 34;
    for (let y = -course; y < size + course; y += course) {
      const row = Math.floor(y / course);
      const off = row % 2 ? -38 : 0;
      for (let x = off; x < size + 76; x += 76) {
        ctx.globalAlpha = .23;
        ctx.strokeStyle = tint(dark, -12);
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, 71, 29);
        ctx.globalAlpha = .10;
        ctx.strokeStyle = tint(light, 25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + 67, y + 5);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  for (let i = 0; i < 1500; i++) {
    const a = .018 + random() * .065;
    const bright = random() > .52;
    ctx.fillStyle = bright ? "rgba(255,247,224," + a + ")" : "rgba(31,29,27," + a + ")";
    const r = random() > .9 ? 2 : 1;
    ctx.fillRect(random() * size, random() * size, r, r);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 6;
  texture.needsUpdate = true;
  return texture;
}

function reliefTexture(seed, blocky = false, size = 256) {
  const random = rng(seed);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, size, size);

  if (blocky) {
    const h = 30;
    for (let y = -h; y < size+h; y += h) {
      const off = (Math.floor(y/h) % 2) * 32;
      for (let x = -64 + off; x < size+64; x += 64) {
        const v = 145 + Math.floor(random()*35);
        ctx.fillStyle = "rgb("+v+","+v+","+v+")";
        ctx.fillRect(x+2,y+2,60,h-5);
        ctx.strokeStyle = "#454545";
        ctx.lineWidth = 3;
        ctx.strokeRect(x+2,y+2,60,h-5);
      }
    }
  }

  for (let i=0;i<650;i++) {
    const v = 112 + Math.floor(random()*70);
    ctx.fillStyle = "rgba("+v+","+v+","+v+","+(0.05+random()*.11)+")";
    const r = 1 + random()*5;
    ctx.beginPath();
    ctx.arc(random()*size,random()*size,r,0,Math.PI*2);
    ctx.fill();
  }

  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function repeat(texture, x, y) {
  const t = texture.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(x, y);
  t.anisotropy = texture.anisotropy || 4;
  t.needsUpdate = true;
  return t;
}

function applyPaint(material, map, bump, rx, ry, bumpScale = .025, tintColor = 0xffffff) {
  material.color.setHex(tintColor);
  material.map = repeat(map, rx, ry);
  if (bump) {
    material.bumpMap = repeat(bump, rx, ry);
    material.bumpScale = bumpScale;
  }
  material.roughness = Math.max(.82, material.roughness ?? .9);
  material.needsUpdate = true;
}

function buildRollingTerrain(world, grassMap) {
  const geo = new THREE.PlaneGeometry(190, 360, 38, 72);
  geo.rotateX(-Math.PI/2);
  const p = geo.attributes.position;
  const colors = [];
  for (let i=0;i<p.count;i++) {
    const x = p.getX(i);
    const z = p.getZ(i) + 5;
    const road = THREE.MathUtils.smoothstep(Math.abs(x), 5.7, 24);
    const undulation =
      Math.sin(z*.037 + x*.081) * .55 +
      Math.sin(z*.019 - x*.043) * .72 +
      Math.cos(x*.11) * .25;
    const shoulderRise = road * (Math.pow(Math.abs(x)/46, 1.4) * 5.2 + undulation);
    const distantRise = road * THREE.MathUtils.smoothstep(Math.abs(x), 26, 80) * 2.2;
    p.setY(i, -.11 + shoulderRise + distantRise);

    const shade = .78 + .18*Math.sin(x*.13 + z*.025) + .08*Math.cos(z*.08);
    colors.push(.82*shade, .94*shade, .80*shade);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors,3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color:0xffffff,
    map:repeat(grassMap,18,36),
    vertexColors:true,
    roughness:1,
    metalness:0
  });
  const terrain = new THREE.Mesh(geo,mat);
  terrain.receiveShadow = true;
  world.scene.add(terrain);
}

function instanced(world, geometry, material, specs, cast = false) {
  if (!specs.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, specs.length);
  const d = new THREE.Object3D();
  specs.forEach((s,i)=>{
    d.position.set(s.x,s.y,s.z);
    d.rotation.set(s.rx||0,s.ry||0,s.rz||0);
    d.scale.set(s.sx||1,s.sy||1,s.sz||1);
    d.updateMatrix();
    mesh.setMatrixAt(i,d.matrix);
  });
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  world.scene.add(mesh);
  return mesh;
}

function addGroundLife(world) {
  const random = rng(32091);
  const grass = [];
  const flowers = [];
  for (let i=0;i<260;i++) {
    const side = i%2 ? 1:-1;
    const z = 70 + random()*82;
    const x = side*(6.2 + random()*24);
    const s = .4 + random()*.95;
    grass.push({x,y:.14*s,z,ry:random()*Math.PI,sx:s,sy:s,sz:s});
    if (i<70 && random()>.55) flowers.push({x:x+(random()-.5)*.7,y:.28,z:z+(random()-.5)*.7,sx:.55,sy:.55,sz:.55});
  }
  const tuft = new THREE.ConeGeometry(.10,.48,4);
  const tuftMat = new THREE.MeshStandardMaterial({color:0x496443,roughness:1});
  instanced(world,tuft,tuftMat,grass,false);

  const bloom = new THREE.OctahedronGeometry(.09,0);
  const bloomMat = new THREE.MeshStandardMaterial({color:0xd4b562,roughness:.92});
  instanced(world,bloom,bloomMat,flowers,false);

  const pebbles = [];
  for (let i=0;i<70;i++) {
    const side=i%2?1:-1;
    const z=72+random()*76;
    pebbles.push({
      x:side*(6.1+random()*15),y:.08,z,
      sx:.16+random()*.35,sy:.08+random()*.16,sz:.18+random()*.45,
      ry:random()*Math.PI,rz:(random()-.5)*.3
    });
  }
  instanced(world,world.unitBox,world.mat.stoneDark,pebbles,false);
}

function addCityDensity(world) {
  const crates = [];
  const barrels = [];
  const baskets = [];
  const props = [
    [-7.4,44],[7.5,30],[-7.4,11],[7.4,-9],[-9.4,21],[9.3,4],[-8,-19],
    [-12,52],[11.8,43],[-11.4,28],[10.8,-16],[-17.5,-66],[12.2,-65],
    [13.7,-83],[-7.4,-82],[-7,-116],[7,-129]
  ];
  props.forEach((p,i)=>{
    crates.push({x:p[0],y:.38,z:p[1],sx:.7+(i%3)*.15,sy:.66+(i%2)*.13,sz:.72+(i%4)*.08,ry:(i%5)*.17});
    if(i%2===0) barrels.push({x:p[0]+.72,y:.52,z:p[1]+.45,sx:.84,sy:1.04,sz:.84,ry:i*.2});
    if(i%3===0) baskets.push({x:p[0]-.6,y:.25,z:p[1]-.4,sx:.5,sy:.42,sz:.5,ry:i*.4});
  });
  instanced(world,world.unitBox,world.mat.timber,crates,true);
  instanced(world,world.unitCylinder8,world.mat.darkLeather,barrels,true);
  const basketGeo=new THREE.CylinderGeometry(.5,.38,.55,10,1,true);
  const basketMat=new THREE.MeshStandardMaterial({color:0x876843,roughness:1});
  instanced(world,basketGeo,basketMat,baskets,false);

  const curb=[];
  for(const side of [-1,1]){
    for(let z=54;z>=-26;z-=3.15){
      curb.push({x:side*5.55,y:.09,z,sx:.55,sy:.18,sz:2.72});
    }
  }
  instanced(world,world.unitBox,world.mat.stoneLight,curb,false);

  const ropeMat=new THREE.LineBasicMaterial({color:0x4f3b2b,transparent:true,opacity:.72});
  [
    [[-9,4.8,38],[-5.7,4.2,35]],
    [[8.9,5.1,18],[5.8,4.25,15]],
    [[-9.1,4.6,-3],[-5.8,4.15,-6]]
  ].forEach((pair,idx)=>{
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...pair[0]),new THREE.Vector3(...pair[1])]);
    world.scene.add(new THREE.Line(g,ropeMat));
    for(let j=0;j<4;j++){
      const t=.16+j*.22;
      const x=THREE.MathUtils.lerp(pair[0][0],pair[1][0],t);
      const y=THREE.MathUtils.lerp(pair[0][1],pair[1][1],t)-.22;
      const z=THREE.MathUtils.lerp(pair[0][2],pair[1][2],t);
      const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.52,.72,2,2),j%2?world.mat.cloth:world.mat.clothGold);
      cloth.position.set(x,y,z);
      cloth.rotation.y=idx%2?Math.PI/2:0;
      cloth.rotation.z=(j-1.5)*.05;
      world.scene.add(cloth);
    }
  });

  const herbGeo=new THREE.IcosahedronGeometry(.16,0);
  const herbMat=new THREE.MeshStandardMaterial({color:0x496347,roughness:1});
  const herbs=[];
  for(let i=0;i<28;i++){
    const side=i%2?1:-1;
    herbs.push({x:side*(6.1+(i%3)*.28),y:1.5+(i%4)*.18,z:45-(i*2.4)%58,sx:.65,sy:1.2,sz:.65,ry:i});
  }
  instanced(world,herbGeo,herbMat,herbs,false);
}

function addIvy(world) {
  const leafGeo=new THREE.IcosahedronGeometry(.12,0);
  const leafMat=new THREE.MeshStandardMaterial({color:0x3d6343,roughness:1});
  const specs=[];
  [
    [-20,67,1], [20,67,-1], [-20,-46,1], [21,-46,-1], [-24,-78,1], [24,-70,-1]
  ].forEach((anchor,a)=>{
    for(let i=0;i<26;i++){
      specs.push({
        x:anchor[0]+anchor[2]*(Math.sin(i*.8+a)*.45),
        y:.8+i*.18,
        z:anchor[1]+Math.cos(i*.73+a)*.16,
        sx:.75+(i%3)*.12,sy:.5+(i%4)*.08,sz:.75,
        ry:i*.47
      });
    }
  });
  instanced(world,leafGeo,leafMat,specs,false);
}

function addHallDust(world) {
  const count=95;
  const pos=new Float32Array(count*3);
  const random=rng(7188);
  for(let i=0;i<count;i++){
    pos[i*3]=-13+random()*26;
    pos[i*3+1]=.8+random()*9;
    pos[i*3+2]=-104-random()*43;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.BufferAttribute(pos,3));
  const m=new THREE.PointsMaterial({color:0xf2dca9,size:.045,transparent:true,opacity:.28,depthWrite:false,sizeAttenuation:true});
  const pts=new THREE.Points(g,m);
  world.scene.add(pts);
  return pts;
}

export function installArtDirection(world) {
  const tex={
    stone:paintedTexture({seed:11,base:0x8d897d,light:0xaaa497,dark:0x5f625d,blocks:true}),
    stoneRelief:reliefTexture(12,true),
    plaster:paintedTexture({seed:21,base:0xbeb39e,light:0xd5ccb7,dark:0x8e806f,direction:"mixed"}),
    plasterRelief:reliefTexture(22,false),
    wood:paintedTexture({seed:31,base:0x5c422f,light:0x79583e,dark:0x34251c,direction:"vertical"}),
    slate:paintedTexture({seed:41,base:0x2b3a40,light:0x42535a,dark:0x192529,direction:"horizontal"}),
    cloth:paintedTexture({seed:51,base:0x702832,light:0x93434a,dark:0x451921,direction:"vertical"}),
    goldcloth:paintedTexture({seed:52,base:0xa07d42,light:0xc2a35d,dark:0x73562f,direction:"vertical"}),
    cobble:paintedTexture({seed:61,base:0x6f6a60,light:0x8f887a,dark:0x4d4c48,blocks:true}),
    cobbleRelief:reliefTexture(62,true),
    grass:paintedTexture({seed:71,base:0x53694f,light:0x6f845f,dark:0x34473a,direction:"mixed"})
  };

  applyPaint(world.mat.stone,tex.stone,tex.stoneRelief,4.5,4.5,.045,0xf1eee4);
  applyPaint(world.mat.stoneLight,tex.stone,tex.stoneRelief,4.5,4.5,.038,0xfff8e9);
  applyPaint(world.mat.stoneDark,tex.stone,tex.stoneRelief,4.5,4.5,.032,0x89928f);
  applyPaint(world.mat.plaster,tex.plaster,tex.plasterRelief,2.6,3.4,.023,0xfff8e9);
  applyPaint(world.mat.plasterWarm,tex.plaster,tex.plasterRelief,2.6,3.4,.023,0xe8d8bf);
  applyPaint(world.mat.timber,tex.wood,null,3.2,5.5,0,0xe9cfb4);
  applyPaint(world.mat.slate,tex.slate,null,4.2,5.2,0,0xb8c3c2);
  applyPaint(world.mat.cloth,tex.cloth,null,2.5,5,0,0xe8d7d2);
  applyPaint(world.mat.clothGold,tex.goldcloth,null,2.5,5,0,0xf3e0b3);
  applyPaint(world.mat.road,tex.cobble,tex.cobbleRelief,3.5,58,.055,0xe2ded3);
  applyPaint(world.mat.grass,tex.grass,null,16,30,0,0xc8d8ba);
  applyPaint(world.mat.grassDark,tex.grass,null,14,26,0,0x91aa87);

  [
    [world.mat.guardBlue,0x405766,83],
    [world.mat.commonGreen,0x506348,84],
    [world.mat.commonBlue,0x5b6670,85],
    [world.mat.commonRust,0x765047,86],
    [world.mat.commonTan,0x8c775e,87]
  ].forEach(([m,c,s])=>{
    const rgb=hexToRgb(c);
    const hi=(Math.min(255,rgb[0]+18)<<16)|(Math.min(255,rgb[1]+18)<<8)|Math.min(255,rgb[2]+18);
    const lo=(Math.max(0,rgb[0]-20)<<16)|(Math.max(0,rgb[1]-20)<<8)|Math.max(0,rgb[2]-20);
    applyPaint(m,paintedTexture({seed:s,base:c,light:hi,dark:lo,direction:"vertical",size:192}),null,2,3,0);
  });

  buildRollingTerrain(world,tex.grass);
  addGroundLife(world);
  addCityDensity(world);
  addIvy(world);
  const dust=addHallDust(world);

  return {
    update(dt){
      dust.rotation.y+=dt*.008;
      dust.position.y=Math.sin(world.clock*.13)*.07;
    }
  };
}
