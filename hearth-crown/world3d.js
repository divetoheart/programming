import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

/* Hearth & Crown — Borderlands 3D renderer.
   The existing simulation, economy, quests, dynasty, construction and saves are retained.
   Assets: Kenney CC0 (via Hidencod/tge-assets), Quaternius planned for modular expansion.
*/
const HC=window.HC_ENGINE;
const app=document.getElementById('app');
const canvas=document.createElement('canvas');
canvas.id='world3d';
canvas.setAttribute('aria-label','Three dimensional fantasy landscape');
app.insertBefore(canvas,document.getElementById('grain'));
const css=document.createElement('style');
css.textContent='#world3d{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;display:block}#world{position:absolute;inset:0}#hud{z-index:3}#grain,#vignette{pointer-events:none;z-index:2}#world3d{touch-action:none}';
document.head.appendChild(css);

let renderer,scene,camera,ground,raycaster,playerRoot,dragon,dragonWingL,dragonWingR;
let cameraYaw=0,clock=0,viewW=1,viewH=1,assetsLoaded=0;
let lastBld='',lastRemoved=-1,lastDragon='',lastEnemy='',cameraTarget=new THREE.Vector3(43,0,50);
let terrainGeo,riverGroup,worldGroup,treeGroup,buildGroup,enemyGroup,mainLight,worldReady=false;
const hit=new THREE.Vector2(),rayY=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const T=(v,min,max)=>Math.max(min,Math.min(max,v));
const norm=(x,z)=>{let y=.15*Math.sin(x*.36)*Math.cos(z*.27)+.22*Math.sin(x*.14+z*.2);if(HC.isMountain(x,z))y+=2.2+3.2*HC.noise(x*.09,z*.09,70);if(HC.isWater(x,z))y-=1.0;return y;};
const colors={
 grass:0x63754d,meadow:0x7f8058,forest:0x445b43,mountain:0x79766b,path:0x98856b,water:0x506969,
 wood:0x5e4332,woodlight:0x8d6546,stone:0x999887,roof:0x473b3b,roof2:0x694b40,iron:0x3d4545,fire:0xf3a554
};
const mat=(hex,rough=1,extra={})=>new THREE.MeshStandardMaterial({color:hex,roughness:rough,...extra});
const M={earth:mat(0x7b755e),stone:mat(colors.stone),stoneDark:mat(0x676c64),stoneLight:mat(0xb7b6a0),timber:mat(colors.wood),beams:mat(0x493b31),plaster:mat(0xb8a88a),roof:mat(colors.roof),roof2:mat(colors.roof2),grass:mat(0x455f41),pine:mat(0x365245),pine2:mat(0x445f48),oak:mat(0x4b6948),oak2:mat(0x577455),metal:mat(colors.iron,.55,{metalness:.28}),cloth:mat(0x7f6a56),clothRed:mat(0x743f3a),gold:mat(0xc6a66d,.5,{metalness:.22}),water:mat(0x608e92,.23,{transparent:true,opacity:.8,metalness:.16,side:THREE.DoubleSide}),fire:new THREE.MeshBasicMaterial({color:0xffbc62}),night:new THREE.MeshBasicMaterial({color:0xc9dbc4})};
const boxGeo=new THREE.BoxGeometry(1,1,1);
const cylGeo=new THREE.CylinderGeometry(1,1,1,7);
const sphereGeo=new THREE.IcosahedronGeometry(1,1);
const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g};
function box(parent,m,x,y,z,w,h,d,angle=0){const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.z=angle;o.receiveShadow=true;o.castShadow=true;parent.add(o);return o}
function cylinder(parent,m,x,y,z,r1,r2,h,segments=9){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function blob(parent,m,x,y,z,sx,sy,sz){const o=new THREE.Mesh(sphereGeo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o}
function objectAt(parent,x,z){return group(parent,x,norm(x,z),z)}
function roof(g,x,y,z,width,depth,high=false){
 const pitch=high?.95:.7;
 box(g,M.roof,x-width*.25,y+pitch*.17,z,width*.57,.15,depth+.28,-pitch);
 box(g,M.roof,x+width*.25,y+pitch*.17,z,width*.57,.15,depth+.28,pitch);
 for(let side of [-1,1])box(g,M.beams,x+side*width*.51,y-.06,z,width*.06,.18,depth+.22);
}
function house(parent,x,z,scale=1,type='hut',rot=0){
 const g=objectAt(parent,x,z);g.rotation.y=rot;g.scale.setScalar(scale);
 let w=type==='hall'?3.9:type==='workshop'?2.8:2.45,depth=type==='hall'?3.3:2.6,height=type==='hall'?3:2.05;
 box(g,M.stoneDark,0,.23,0,w+.36,.46,depth+.35);
 box(g,M.plaster,0,.54+height/2,0,w,height,depth);
 for(const xx of [-w*.48,w*.48])for(const zz of [-depth*.48,depth*.48])box(g,M.beams,xx,.57+height/2,zz,.16,height+.12,.17);
 for(const yy of [0.75,height+.48]){box(g,M.beams,0,yy,depth*.515,w,.12,.12);box(g,M.beams,0,yy,-depth*.515,w,.12,.12)}
 roof(g,0,height+.72,0,w+.4,depth+.36,type==='hall');
 box(g,M.timber,0,1.12,depth*.51+.03,.74,1.34,.13);
 box(g,M.metal,-.23,1.03,depth*.59,.085,.09,.07);
 for(const xx of [-w*.3,w*.3]){box(g,M.beams,xx,1.7,depth*.51+.05,.52,.62,.12);box(g,M.gold,xx,1.7,depth*.59,.37,.44,.03);box(g,M.beams,xx,1.7,depth*.62,.075,.56,.055);}
 cylinder(g,M.stone, w*.29,height+.95,-depth*.15,.28,.28,1.6,8);
 if(type==='workshop') {box(g,M.timber,w*.48,.55,depth*.48,1.1,.65,.8);box(g,M.metal,w*.49,.95,depth*.48,.62,.18,.45);}
 if(type==='farm'){for(let i=0;i<5;i++){box(g,M.earth,-2.2+i*.75,.04,3, .53,.11,4.5);for(let j=0;j<8;j++)blob(g,M.grass,-2.2+i*.75,.24,1+j*.49,.19,.28,.19)}}
 return g
}
function fortress(parent,x,z,scale=1){
 const g=objectAt(parent,x,z);g.scale.setScalar(scale);
 const wallLength=10;
 for(const side of [-1,1]){
  box(g,M.stone,side*5,1.8,0,1.05,3.6,wallLength);
  box(g,M.stone,0,1.8,side*5,wallLength,3.6,1.05);
  for(let i=-4;i<=4;i+=1.4){
   box(g,M.stoneLight,i,3.87,side*5,.68,.66,1.13);
   box(g,M.stoneLight,side*5,3.87,i,1.13,.66,.68);
  }
 }
 for(const xx of [-5,5])for(const zz of [-5,5]){
  const t=group(g,xx,0,zz);
  cylinder(t,M.stone,0,2.8,0,1.62,1.73,5.6,10);
  cylinder(t,M.stoneDark,0,5.9,0,1.94,1.94,.65,10);
  for(let k=0;k<10;k++){let a=k*Math.PI/5;box(t,M.stoneLight,Math.sin(a)*1.72,6.4,Math.cos(a)*1.72,.6,.92,.6);}
 }
 house(g,0,-.6,.9,'hall');box(g,M.timber,0,1.2,5.55,2.3,2.45,.22);
 return g
}
function ruins(parent,x,z){const g=objectAt(parent,x,z);box(g,M.stoneDark,0,.3,0,5,.6,4);
 for(const xx of [-2,2])for(const zz of [-1.5,1.5])cylinder(g,M.stone,xx,1.6,zz,.34,.39,2.8);
 box(g,M.stoneLight,0,3.3,0,5.2,.5,.6);
 for(let i=0;i<12;i++){let a=i*1.4;blob(g,M.stoneDark,Math.sin(a)*4,.1,Math.cos(a)*3,.4,.3,.6)}
 return g}
function camps(parent,x,z){const g=objectAt(parent,x,z);
 const tent=(xx,zz)=>{const t=group(g,xx,0,zz);const mesh=new THREE.Mesh(new THREE.ConeGeometry(1.65,2.8,4),M.cloth);mesh.position.y=1.4;mesh.rotation.y=Math.PI/4;t.add(mesh);box(t,M.beams,0,1.1,1.16,.15,2,.14);};
 tent(-2,0);tent(2,1);
 cylinder(g,M.stone,0,.12,-2.1,1.2,1.2,.24);blob(g,M.fire,0,.72,-2.1,.41,.77,.41);
 return g
}
function monoliths(parent,x,z){const g=objectAt(parent,x,z);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;cylinder(g,M.stone,Math.cos(a)*3,1.1,Math.sin(a)*3,.45,.62,2.2,5);}
 cylinder(g,M.stoneDark,0,.2,0,2.5,2.5,.4,8);blob(g,M.night,0,.72,0,.28,.55,.28);return g
}
function landmark(l){
 if(l.type==='village'){const g=group(worldGroup);house(g,l.x-2.2,l.y-2,1.12,'hut',.2);house(g,l.x+2.4,l.y-1,1,'workshop',-.5);house(g,l.x+.5,l.y+2.4,1.05,'hut',.2);return}
 if(l.type==='keep'){fortress(worldGroup,l.x,l.y,1.15);return}
 if(l.type==='ruin'){ruins(worldGroup,l.x,l.y);return}
 if(l.type==='bandit'){camps(worldGroup,l.x,l.y);return}
 if(l.type==='grove'||l.type==='sanctum'){monoliths(worldGroup,l.x,l.y);return}
 if(l.type==='quarry'){const g=objectAt(worldGroup,l.x,l.y);for(let i=0;i<12;i++)blob(g,M.stoneDark,(i%4-1.5)*1.1,.4,Math.floor(i/4)*1.3-1.3,.65,.65,.6);return}
 if(l.type==='bridge'){const g=objectAt(worldGroup,l.x,l.y);box(g,M.stone,0,.34,0,7,.75,3.4);for(let zz of [-1.8,1.8])for(let i=-3;i<=3;i++)box(g,M.stoneLight,i,.95,zz,.6,.7,.48);}
}
function makeCharacter(material=M.clothRed,shield=true){
 const root=new THREE.Group();
 blob(root,material,0,1.42,0,.34,.61,.26);
 box(root,M.metal,0,1.92,0,.84,.29,.47);
 cylinder(root,M.stoneLight,0,2.25,0,.24,.22,.43,9);
 cylinder(root,M.metal,0,2.49,0,.3,.3,.3,9);
 box(root,M.metal,-.22,.56,.02,.27,.96,.33);
 box(root,M.metal,.22,.56,.02,.27,.96,.33);
 box(root,M.stoneDark,-.44,1.43,.04,.23,.83,.26,-.16);
 box(root,M.stoneDark,.44,1.43,.04,.23,.83,.26,.16);
 if(shield){const s=cylinder(root,M.metal,-.6,1.35,.19,.44,.42,.15,6);s.rotation.z=Math.PI/2;box(root,M.gold,-.68,1.36,.25,.13,.73,.1);}
 const sword=box(root,M.stoneLight,.66,.89,.07,.09,1.25,.16,-.12);box(root,M.timber,.65,.37,.06,.4,.1,.11);
 root.castShadow=true;return root
}
function drawHealthBar(){return}
function makeDragon(){
 const g=new THREE.Group();
 blob(g,mat(0x354f4e,.8),0,1.1,0,1.8,.75,3.15);
 blob(g,mat(0x395c5e,.7),0,2.4,-2.25,.72,.82,1.65);
 blob(g,M.stoneDark,0,2.15,-3.55,.85,.39,1.15);
 for(let sign of [-1,1]){const wing=new THREE.Group();wing.position.set(sign*1.3,2.15,.45);
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(sign*4.5,1.55);shape.lineTo(sign*6.3,-.4);shape.lineTo(sign*3.4,-.15);shape.lineTo(sign*2,-1.5);shape.closePath();
  const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:0x566b6c,side:THREE.DoubleSide,roughness:.9}));mesh.rotation.x=-Math.PI/2.5;wing.add(mesh);g.add(wing);if(sign<0)dragonWingL=wing;else dragonWingR=wing;
  blob(g,M.stoneDark,sign*.9,.4,1.65,.52,.68,.45);
 }
 for(let i=0;i<6;i++){const o=blob(g,M.stoneLight,0,1.4,1.65+i*.47,.4-i*.055,.28-i*.027,.58);o.rotation.x=i*.13;}
 g.scale.setScalar(1.55);return g
}
function paintGround(){
 const N=112,step=1;const verts=[],colorsA=[],inds=[],c=new THREE.Color();
 for(let z=0;z<=N;z++)for(let x=0;x<=N;x++){
  const wx=x-8,wz=z-8,ht=norm(wx,wz);
  verts.push(wx,ht,wz);
  const typ=HC.terrain(wx,wz);
  c.setHex(colors[typ]||colors.grass);
  let r=.82+HC.hash(x,z,7)*.26;
  c.multiplyScalar(r);
  colorsA.push(c.r,c.g,c.b);
 }
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){let a=z*(N+1)+x,b=a+1,d=a+N+1,e=d+1;inds.push(a,d,b,b,d,e)}
 terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colorsA,3));terrainGeo.setIndex(inds);terrainGeo.computeVertexNormals();
 ground=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:false,side:THREE.DoubleSide}));
 ground.receiveShadow=true;scene.add(ground);
 const edge=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),mat(0x4b5d4e));edge.rotation.x=-Math.PI/2;edge.position.y=-2.8;edge.receiveShadow=true;scene.add(edge);
}
function pathLine(x1,z1,x2,z2,width,m= M.earth,step=0.5){
 const positions=[],ind=[],n=Math.ceil(Math.hypot(x2-x1,z2-z1)/step);const nx=(z2-z1)/Math.hypot(x2-x1,z2-z1),nz=-(x2-x1)/Math.hypot(x2-x1,z2-z1);
 for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;
  for(const side of [-1,1])positions.push(x+nx*width*.5*side,norm(x,z)+.085,z+nz*width*.5*side);
  if(i<n){const j=i*2;ind.push(j,j+2,j+1,j+1,j+2,j+3)}
 }
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geom.setIndex(ind);geom.computeVertexNormals();
 const mesh=new THREE.Mesh(geom,m);mesh.receiveShadow=true;worldGroup.add(mesh)
}
function terrainFeatures(){
 for(const r of [[43,50,49,44],[49,44,54,29],[49,44,34,38],[49,44,65,51],[49,44,55,60]])pathLine(...r,.94);
 const pts=[],idx=[],n=172;
 for(let i=0;i<=n;i++){const z=i*96/n,x=HC.riverX(z),y=norm(x,z)+.27;pts.push(x-1.26,y,z,x+1.26,y,z);if(i<n){const j=i*2;idx.push(j,j+2,j+1,j+1,j+2,j+3)}}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geom.setIndex(idx);geom.computeVertexNormals();
 const river=new THREE.Mesh(geom,M.water);river.renderOrder=1;worldGroup.add(river);
}
function createFoliage(){
 if(treeGroup)scene.remove(treeGroup);
 treeGroup=new THREE.Group();scene.add(treeGroup);
 const data={oak:[],pine:[]},scatter=[];
 for(let z=11;z<90;z++)for(let x=11;x<90;x++){
  let v=HC.vegetation(x,z);if(!v)continue;
  const removed=HC.state().removed;
  if(removed.includes(x+','+z))continue;
  if(v.type==='oak'||v.type==='pine'){
   if(x>39&&x<47&&z>46&&z<54&&HC.hash(x,z,83)>.5)continue;
   data[v.type].push([v.x,v.y,.8+HC.hash(x,z,17)*.7,HC.hash(x,z,22)*6.28]);
  }else if(v.type==='stone'&&scatter.length<110){scatter.push([v.x,v.y,.5+HC.hash(x,z,27)*.5])}
 }
 for(let kind of ['oak','pine']){
  const list=data[kind],trunkGeom=new THREE.CylinderGeometry(.12,.23,2.15,6),foliageGeom=kind==='pine'?new THREE.ConeGeometry(1.15,3.35,7):new THREE.IcosahedronGeometry(1.28,1);
  const body=new THREE.InstancedMesh(trunkGeom,M.timber,list.length);
  const top=new THREE.InstancedMesh(foliageGeom,kind==='pine'?M.pine:M.oak,list.length);
  const top2=new THREE.InstancedMesh(foliageGeom,kind==='pine'?M.pine2:M.oak2,list.length);
  const dummy=new THREE.Object3D();
  for(let i=0;i<list.length;i++){
   const [x,z,size,ang]=list[i],y=norm(x,z);
   dummy.position.set(x,y+1.03*size,z);dummy.rotation.y=ang;dummy.scale.set(size,size,size);dummy.updateMatrix();body.setMatrixAt(i,dummy.matrix);
   dummy.position.set(x,y+(kind==='pine'?3.04:2.75)*size,z);dummy.scale.set(size,size,size);dummy.updateMatrix();top.setMatrixAt(i,dummy.matrix);
   dummy.position.set(x+(kind==='pine'?.0:.4)*size,y+(kind==='pine'?4.24:3.28)*size,z+.21);dummy.scale.set(kind==='pine'?.74*size:.73*size,kind==='pine'?.78*size:.8*size,kind==='pine'?.74*size:.75*size);dummy.updateMatrix();top2.setMatrixAt(i,dummy.matrix);
  }
  body.castShadow=true;body.receiveShadow=true;top.castShadow=true;top2.castShadow=true;
  treeGroup.add(body,top,top2);
 }
 const stones=new THREE.InstancedMesh(sphereGeo,M.stoneDark,scatter.length);const dummy=new THREE.Object3D();
 scatter.forEach(([x,z,s],i)=>{dummy.position.set(x,norm(x,z)+.12*s,z);dummy.scale.set(.6*s,.35*s,.5*s);dummy.rotation.y=HC.hash(x,z,18)*6.28;dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix)});
 stones.castShadow=true;treeGroup.add(stones);
 for(const n of HC.fixedNodes){
  if(HC.state().removed.includes('fixed'+n.x+','+n.y))continue;
  if(n.type==='stone')blob(treeGroup,M.stone,n.x,norm(n.x,n.y)+.38,n.y,.58,.42,.45);
  else if(n.type==='herb'||n.type==='berry'){for(let i=0;i<6;i++)blob(treeGroup,n.type==='berry'?M.clothRed:M.oak,n.x+Math.sin(i*2.3)*.25,norm(n.x,n.y)+.27,n.y+Math.cos(i*2.3)*.25,.14,.24,.14);}
  else if(n.type==='oak'||n.type==='pine'){const g=objectAt(treeGroup,n.x,n.y);cylinder(g,M.timber,0,1,0,.15,.2,2);blob(g,n.type==='pine'?M.pine:M.oak,0,2.55,0,1.1,1.5,1.1);}
 }
}
function customBuildings(){
 if(buildGroup)scene.remove(buildGroup);
 buildGroup=new THREE.Group();scene.add(buildGroup);
 for(const b of HC.state().buildings){
  if(b.type==='camp'){const g=objectAt(buildGroup,b.x,b.y);cylinder(g,M.stone,.0,.09,.0,.85,.85,.2);blob(g,M.fire,0,.63,0,.28,.65,.28);for(let i=0;i<4;i++)box(g,M.timber,Math.sin(i*1.57)*.41,.23,Math.cos(i*1.57)*.41,.16,.15,.9,i*Math.PI/2)}
  else if(b.type==='hall')house(buildGroup,b.x,b.y,1.35,'hall');
  else if(b.type==='farm')house(buildGroup,b.x,b.y,1,'farm');
  else if(b.type==='tower')fortress(buildGroup,b.x,b.y,.42);
  else house(buildGroup,b.x,b.y,1.0,b.type==='workshop'?'workshop':'hut');
 }
}
function gameEnemies(){
 if(!enemyGroup){enemyGroup=new THREE.Group();scene.add(enemyGroup)}
 for(const obj of [...enemyGroup.children])enemyGroup.remove(obj);
 for(const e of HC.livingEnemies()){const actor=makeCharacter(M.clothRed,false);actor.position.set(e.x,norm(e.x,e.y),e.y);actor.scale.setScalar(.91);enemyGroup.add(actor)}
}
function placePlayer(){
 playerRoot=makeCharacter(M.cloth,true);playerRoot.position.set(43,norm(43,50),50);scene.add(playerRoot);
}
const assetLoader=new GLTFLoader();
const URL='https://cdn.jsdelivr.net/gh/Hidencod/tge-assets@main/packs/';
const FREE_MODELS=[
 ['nature-kit/tree-oak-dark.glb',44.2,50.2,3.6],
 ['nature-kit/tree-pinedefaulta.glb',40.9,49,4.0],
 ['nature-kit/tree-pinedefaultb.glb',45.9,51.8,3.9],
 ['castle-kit/tower-square-mid-door.glb',53.8,29.2,5.0],
 ['castle-kit/tower-square-top-roof.glb',53.8,29.2,5.8],
 ['nature-kit/rock-largee.glb',40.1,51.4,1.2],
 ['graveyard-kit/gravestone-round.glb',34.7,38.8,1.3]
];
function fetchModels(){
 for(const [name,x,z,height] of FREE_MODELS){
  assetLoader.load(URL+name,(gltf)=>{
   const root=gltf.scene;
   const bb=new THREE.Box3().setFromObject(root),size=bb.getSize(new THREE.Vector3());
   if(!isFinite(size.y)||size.y===0)return;
   root.scale.setScalar(height/size.y);
   const b=new THREE.Box3().setFromObject(root);root.position.set(x-(b.min.x+b.max.x)/2,norm(x,z)-b.min.y,z-(b.min.z+b.max.z)/2);
   root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
   worldGroup.add(root);assetsLoaded++;
  },undefined,()=>{});
 }
}
function loadSurfaceMaterials(){
 const tl=new THREE.TextureLoader();
 tl.setCrossOrigin('anonymous');
 const packs=[
  ['forrest_ground_01',[ground.material],14],
  ['rock_01',[M.stone,M.stoneDark,M.stoneLight],1.9],
  ['medieval_wood',[M.timber,M.beams],2],
  ['cobblestone_floor_001',[M.earth],2],
  ['forest_leaves_02',[M.oak,M.oak2,M.grass],1.6]
 ];
 for(const [slug,mats,repeats] of packs){
  const url='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/'+slug+'/'+slug+'_diff_1k.jpg';
  tl.load(url,t=>{
   t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeats,repeats);
   t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
   for(const m of mats){m.map=t;m.needsUpdate=true}
  },undefined,()=>{});
 }
}
function createSky(){const sky=new THREE.Mesh(new THREE.SphereGeometry(520,24,12),new THREE.MeshBasicMaterial({color:0x8ba5a1,side:THREE.BackSide,fog:false}));sky.position.y=-12;scene.add(sky)}
function resize(){viewW=app.clientWidth;viewH=app.clientHeight;if(!renderer)return;renderer.setSize(viewW,viewH,false);camera.aspect=viewW/viewH;camera.updateProjectionMatrix()}
function init(){
 try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,innerWidth<700?1.45:1.75));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 scene=new THREE.Scene();scene.background=new THREE.Color(0x839b91);scene.fog=new THREE.FogExp2(0x81978c,.011);
 camera=new THREE.PerspectiveCamera(58,1,.08,310);
 scene.add(new THREE.HemisphereLight(0xcde4d7,0x3e453e,2.5));
 mainLight=new THREE.DirectionalLight(0xffe2b4,3.2);mainLight.position.set(-35,65,-25);mainLight.castShadow=true;
 mainLight.shadow.mapSize.set(1024,1024);mainLight.shadow.camera.near=1;mainLight.shadow.camera.far=170;
 for(const k of ['left','right','top','bottom'])mainLight.shadow.camera[k]=k==='left'||k==='bottom'?-36:36;
 mainLight.shadow.normalBias=.025;scene.add(mainLight);
 worldGroup=new THREE.Group();scene.add(worldGroup);
 paintGround();terrainFeatures();createFoliage();customBuildings();loadSurfaceMaterials();
 HC.locations.forEach(landmark);placePlayer();gameEnemies();createSky();fetchModels();
 raycaster=new THREE.Raycaster();
 resize();addEventListener('resize',resize);
 HC.state().player.x&&cameraTarget.set(HC.state().player.x,0,HC.state().player.y);
 HC.draw=draw;HC.pick=pick;HC.turn=turn;HC.ready=true;worldReady=true;
 }catch(err){console.error('3D initialization failed',err);const el=document.getElementById('toastArea');if(el){let t=document.createElement('div');t.className='toast';t.textContent='3D graphics unavailable on this browser';el.append(t)}}
}
function pick(px,py){
 if(!worldReady)return{x:HC.state().player.x,y:HC.state().player.y};
 hit.set(px/viewW*2-1,-(py/viewH)*2+1);
 raycaster.setFromCamera(hit,camera);
 const hitGround=raycaster.intersectObject(ground,false)[0];
 if(hitGround)return{x:T(hitGround.point.x,10,91),y:T(hitGround.point.z,10,91)};
 let pos=new THREE.Vector3();raycaster.ray.intersectPlane(rayY,pos);
 return{x:T(pos.x,10,91),y:T(pos.z,10,91)}
}
function turn(dx,dy){cameraYaw=T(cameraYaw+dx*.0055,-1.0,1.0)}
function draw(){
 if(!worldReady)return;
 clock+=.016;
 const S=HC.state(),p=S.player,target=new THREE.Vector3(p.x,norm(p.x,p.y),p.y);
 cameraTarget.lerp(target,.10);
 const distance=innerWidth<650?20:25;
 camera.position.lerp(new THREE.Vector3(cameraTarget.x+Math.sin(cameraYaw)*distance*.9,cameraTarget.y+distance*.93,cameraTarget.z+Math.cos(cameraYaw)*distance),.11);
 camera.lookAt(cameraTarget.x,cameraTarget.y+.4,cameraTarget.z-4);
 if(playerRoot){
  playerRoot.position.set(p.x,norm(p.x,p.y)+Math.sin(clock*9)*.014,p.y);
  if(HC.stick().active)playerRoot.rotation.y=Math.atan2(HC.stick().x,-HC.stick().y);
 }
 const marker=S.buildings.map(b=>b.id+':'+b.type).join('|');
 if(marker!==lastBld){customBuildings();lastBld=marker}
 if(S.removed.length!==lastRemoved){createFoliage();lastRemoved=S.removed.length}
 if(clock%1.2<.018){gameEnemies()}
 if(S.player.dragonName||S.dragonMet){
  if(!dragon){dragon=makeDragon();scene.add(dragon)}
  dragon.position.set(p.x+12,norm(p.x,p.y)+19+Math.sin(clock*.22)*2,p.y-26);
  dragon.rotation.y=clock*.03;
  dragonWingL.rotation.z=.25*Math.sin(clock*1.9);
  dragonWingR.rotation.z=-.25*Math.sin(clock*1.9);
 }else if(dragon){scene.remove(dragon);dragon=null}
 mainLight.position.set(p.x-35,65,p.y-25);mainLight.target.position.set(p.x,0,p.y);mainLight.target.updateMatrixWorld();
 renderer.render(scene,camera);
}
let lastPointer=null;
const touchCanvas=document.getElementById('world');
touchCanvas.addEventListener('pointerdown',e=>{if(e.clientX>viewW*.45){lastPointer=[e.clientX,e.clientY]}});
touchCanvas.addEventListener('pointermove',e=>{if(lastPointer&&e.buttons){turn(e.clientX-lastPointer[0],e.clientY-lastPointer[1]);lastPointer=[e.clientX,e.clientY]}});
for(const event of ['pointerup','pointercancel'])touchCanvas.addEventListener(event,()=>{lastPointer=null});
init();
