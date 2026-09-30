import * as THREE from "three";
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

function makePaintedSky(){
  const c=document.createElement("canvas");
  c.width=512;c.height=768;
  const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,c.height);
  g.addColorStop(0,"#607d87");
  g.addColorStop(.42,"#8fa39f");
  g.addColorStop(.72,"#bdbaa3");
  g.addColorStop(1,"#d4b98f");
  x.fillStyle=g;x.fillRect(0,0,c.width,c.height);

  const sun=x.createRadialGradient(365,390,3,365,390,145);
  sun.addColorStop(0,"rgba(255,223,164,.42)");
  sun.addColorStop(.28,"rgba(242,203,143,.16)");
  sun.addColorStop(1,"rgba(242,203,143,0)");
  x.fillStyle=sun;x.fillRect(0,0,c.width,c.height);

  x.lineCap="round";
  const clouds=[
    [72,190,105,.075],[196,228,82,.055],[350,175,122,.07],
    [432,285,92,.045],[130,330,76,.035]
  ];
  for(const [cx,cy,w,a] of clouds){
    x.strokeStyle="rgba(226,226,206,"+a+")";
    x.lineWidth=24;
    x.beginPath();x.moveTo(cx-w*.5,cy);x.bezierCurveTo(cx-w*.15,cy-16,cx+w*.15,cy+10,cx+w*.5,cy);x.stroke();
    x.strokeStyle="rgba(91,112,108,"+(a*.34)+")";
    x.lineWidth=9;x.beginPath();x.moveTo(cx-w*.42,cy+11);x.lineTo(cx+w*.38,cy+7);x.stroke();
  }
  for(let i=0;i<900;i++){
    const a=.008+Math.random()*.018;
    x.fillStyle=Math.random()>.5?"rgba(255,248,225,"+a+")":"rgba(35,48,49,"+a+")";
    x.fillRect(Math.random()*c.width,Math.random()*c.height,1,1);
  }
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;
  return t;
}

const scene=new THREE.Scene();
scene.background=makePaintedSky();
scene.fog=new THREE.FogExp2(0xa9b3a9,.0073);

const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.08,650);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance",alpha:false});
let renderScale=Math.min(devicePixelRatio,isTouch?1.72:1.55);
renderer.setPixelRatio(renderScale);
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute("aria-label","Solvyr game view");
root.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xe3e9df,0x536650,2.12);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffdfad,3.18);
sun.position.set(42,68,28);
sun.castShadow=true;
sun.shadow.mapSize.set(isTouch?1536:2048,isTouch?1536:2048);
sun.shadow.camera.left=-62;sun.shadow.camera.right=62;sun.shadow.camera.top=76;sun.shadow.camera.bottom=-76;
sun.shadow.camera.near=1;sun.shadow.camera.far=190;sun.shadow.bias=-.00042;sun.shadow.normalBias=.018;
scene.add(sun);

const world=new SolvyrWorld(scene,save.world);
const player=new PlayerController(camera,world,save.player,renderer.domElement);
const ambience=new Ambience();

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
  renderer.render(scene,camera);
}

showToast(isTouch
  ?"Drag left to move. Drag right to look. Tap to interact. Flick up to jump. Push farther to sprint."
  :"A sealed summons. A city you have never seen. Solvyr waits beyond the pines.",5.4);
frame();
