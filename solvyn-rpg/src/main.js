import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import "./style.css";
import { PlayerController } from "./player.js";
import { SolvyrWorld } from "./world.js";
import { Ambience } from "./ambience.js";
import { loadSave, writeSave } from "./save.js";

const save=loadSave();
const root=document.querySelector("#game");
const start=document.querySelector("#start");
const prompt=document.querySelector("#prompt");
const objective=document.querySelector("#objective");
const locationEl=document.querySelector("#location");
const toast=document.querySelector("#toast");
const chapter=document.querySelector("#chapter");
const chapterKicker=document.querySelector("#chapter-kicker");
const chapterTitle=document.querySelector("#chapter-title");
const chapterSubtitle=document.querySelector("#chapter-subtitle");

const isTouch=("ontouchstart" in window)||matchMedia("(pointer: coarse)").matches;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fa3a0);
scene.fog=new THREE.FogExp2(0x9ba8a1,.0076);

const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.08,460);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance",alpha:false});
let renderScale=Math.min(devicePixelRatio,isTouch?1.72:1.55);
renderer.setPixelRatio(renderScale);
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute("aria-label","Solvyr game view");
root.appendChild(renderer.domElement);

const skyVertex="varying vec3 vWorld;void main(){vec4 wp=modelMatrix*vec4(position,1.0);vWorld=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}";
const skyFragment="uniform vec3 topColor;uniform vec3 highColor;uniform vec3 horizonColor;uniform vec3 sunWash;varying vec3 vWorld;"+
"void main(){float h=normalize(vWorld).y;vec3 c=mix(horizonColor,highColor,smoothstep(.01,.42,h));"+
"c=mix(c,topColor,smoothstep(.35,.88,h));float warmth=smoothstep(.16,-.08,h);"+
"c=mix(c,sunWash,warmth*.20);gl_FragColor=vec4(c,1.);}";

const sky=new THREE.Mesh(
  new THREE.SphereGeometry(360,24,12),
  new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{
      topColor:{value:new THREE.Color(0x607b83)},
      highColor:{value:new THREE.Color(0x8ea29d)},
      horizonColor:{value:new THREE.Color(0xc1b89e)},
      sunWash:{value:new THREE.Color(0xe3bc82)}
    },
    vertexShader:skyVertex,
    fragmentShader:skyFragment
  })
);
scene.add(sky);

const hemi=new THREE.HemisphereLight(0xd7dfd4,0x405246,1.75);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffdfb0,2.8);
sun.position.set(42,68,28);
sun.castShadow=true;
sun.shadow.mapSize.set(isTouch?1536:2048,isTouch?1536:2048);
sun.shadow.camera.left=-62;sun.shadow.camera.right=62;sun.shadow.camera.top=76;sun.shadow.camera.bottom=-76;
sun.shadow.camera.near=1;sun.shadow.camera.far=190;sun.shadow.bias=-.00042;sun.shadow.normalBias=.018;
scene.add(sun);

const world=new SolvyrWorld(scene,save.world);
const player=new PlayerController(camera,world,save.player,renderer.domElement);
const ambience=new Ambience();

const artVertex="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const artFragment="uniform sampler2D tDiffuse;uniform vec2 resolution;uniform float strength;varying vec2 vUv;"+
"float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}"+
"float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}"+
"void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;"+
"vec3 n=texture2D(tDiffuse,vUv+vec2(0.,resolution.y)).rgb;"+
"vec3 s=texture2D(tDiffuse,vUv-vec2(0.,resolution.y)).rgb;"+
"vec3 e=texture2D(tDiffuse,vUv+vec2(resolution.x,0.)).rgb;"+
"vec3 w=texture2D(tDiffuse,vUv-vec2(resolution.x,0.)).rgb;"+
"float edge=abs(lum(n)-lum(s))+abs(lum(e)-lum(w));"+
"vec3 avg=(n+s+e+w+c*4.)/8.;c=mix(c,avg,smoothstep(.035,.22,edge)*.34);"+
"float l=lum(c);float q=floor(l*10.+.5)/10.;c*=mix(1.,q/max(l,.04),.10*strength);"+
"c*=1.-smoothstep(.13,.48,edge)*.20*strength;"+
"float grain=(hash(floor(gl_FragCoord.xy*.72))-.5)*.022;c+=grain;"+
"c=mix(c,c*vec3(1.028,1.0,.955),.22);float vig=smoothstep(.84,.27,length(vUv-.5));"+
"c*=mix(.93,1.025,vig);gl_FragColor=vec4(c,1.);}";

const artShader={
  uniforms:{
    tDiffuse:{value:null},
    resolution:{value:new THREE.Vector2(1/innerWidth,1/innerHeight)},
    strength:{value:isTouch?.82:.74}
  },
  vertexShader:artVertex,
  fragmentShader:artFragment
};

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const artPass=new ShaderPass(artShader);
composer.addPass(artPass);
composer.setPixelRatio(renderScale);
composer.setSize(innerWidth,innerHeight);

let currentInteraction=null,toastTimer=0,chapterTimer=0,saveTimer=0,fireTimer=0,currentZoneId="",lastObjective="";

function showToast(text,seconds=3.7){
  if(!text)return;
  toast.textContent=text;toast.classList.add("visible");toastTimer=seconds;
}
function showChapter(kicker,title,subtitle="",seconds=3.8){
  chapterKicker.textContent=kicker||"";chapterTitle.textContent=title||"";chapterSubtitle.textContent=subtitle||"";
  chapter.classList.add("visible");chapterTimer=seconds;
}
function handleWorldEvent(event){
  if(event.type==="moment"){if(event.title)showChapter(event.kicker,event.title,event.subtitle,4.1);if(event.text)showToast(event.text,4.7);}
  if(event.type==="gate-opened"&&event.text)showToast(event.text,3.8);
  if(event.audio==="bell")ambience.bell();if(event.audio==="chime")ambience.chime();if(event.audio==="gate")ambience.gateGrind();
}

let entered=false;
function enterGame(){
  if(entered)return;
  entered=true;
  ambience.start();
  start.classList.add("hidden");
  player.activate();
}
start.addEventListener("click",enterGame);
start.addEventListener("touchend",(e)=>{e.preventDefault();enterGame();},{passive:false});

document.addEventListener("pointerlockchange",()=>{
  if(isTouch)return;
  start.classList.toggle("hidden",document.pointerLockElement===renderer.domElement);
  if(document.pointerLockElement!==renderer.domElement)entered=false;
});

function useCurrentInteraction(){
  if(!currentInteraction)return;
  const result=world.useInteraction(currentInteraction);
  if(result?.text&&result.type!=="gate-opened")showToast(result.text,4.3);
  save.player=player.snapshot();writeSave(save);
}
addEventListener("keydown",(e)=>{
  if(e.code==="KeyE"&&currentInteraction&&!e.repeat&&player.active)useCurrentInteraction();
});

function updateCameraForScreen(){
  const aspect=innerWidth/innerHeight;
  camera.aspect=aspect;
  const portrait=aspect<.72;
  const fov=portrait?94:66;
  player.setBaseFov(fov);
  camera.fov=fov;
  camera.updateProjectionMatrix();
}
function resizeRenderer(){
  updateCameraForScreen();
  renderer.setPixelRatio(renderScale);
  renderer.setSize(innerWidth,innerHeight);
  composer.setPixelRatio(renderScale);
  composer.setSize(innerWidth,innerHeight);
  artPass.uniforms.resolution.value.set(1/(innerWidth*renderScale),1/(innerHeight*renderScale));
}
addEventListener("resize",resizeRenderer);
addEventListener("orientationchange",()=>setTimeout(resizeRenderer,80));
resizeRenderer();

const clock=new THREE.Clock();
let fpsWindow=0,fpsFrames=0;
function adaptResolution(dt){
  fpsWindow+=dt;fpsFrames++;
  if(fpsWindow<2.4)return;
  const fps=fpsFrames/fpsWindow;
  const maxScale=Math.min(devicePixelRatio,isTouch?1.9:1.75);
  let next=renderScale;
  if(fps<42&&renderScale>1.02)next=Math.max(1.0,renderScale-.10);
  else if(fps>57&&renderScale<maxScale)next=Math.min(maxScale,renderScale+.05);
  if(Math.abs(next-renderScale)>.01){renderScale=next;resizeRenderer();}
  fpsWindow=0;fpsFrames=0;
}

function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.033);
  player.update(dt);
  world.update(dt,player.position);

  if(player.consumeInteract())useCurrentInteraction();

  for(const event of world.drainEvents()){handleWorldEvent(event);writeSave(save);}

  currentInteraction=world.nearestInteraction(player.position);
  if(currentInteraction){
    if(currentInteraction.id==="castle-guard"){
      currentInteraction.label=save.world.castleGateOpen?"Speak to the castle guard":"Present your sealed summons";
    }
    const bare=currentInteraction.label.replace(/^E · /,"");
    prompt.textContent=isTouch?"Tap · "+bare:"E · "+bare;
    prompt.classList.add("visible");
  }else prompt.classList.remove("visible");

  const zone=world.currentZone(player.position),zoneId=zone?.id||"wild";
  locationEl.textContent=zone?.name||"THE KING'S ROAD · SOLVYN";
  if(zoneId!==currentZoneId){currentZoneId=zoneId;ambience.update(zoneId);}
  if(world.checkDiscovery(player.position))writeSave(save);

  const nextObjective=world.objective(player.position);
  if(nextObjective!==lastObjective){lastObjective=nextObjective;objective.textContent=nextObjective;}
  if(player.consumeStep())ambience.step(player.sprinting,player.position.z<65);

  toastTimer-=dt;if(toastTimer<=0)toast.classList.remove("visible");
  chapterTimer-=dt;if(chapterTimer<=0)chapter.classList.remove("visible");
  fireTimer+=dt;if(fireTimer>.72){fireTimer=0;if(zoneId==="great-hall")ambience.firePop();}
  saveTimer+=dt;if(saveTimer>=2.5){saveTimer=0;save.player=player.snapshot();writeSave(save);}

  adaptResolution(dt);
  composer.render();
}

showToast(isTouch
  ?"Drag left to move. Drag right to look. Tap to interact. Flick up to jump. Push farther to sprint."
  :"A sealed summons. A city you have never seen. Solvyr waits beyond the pines.",5.4);
frame();
