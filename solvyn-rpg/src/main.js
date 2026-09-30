import * as THREE from "three";
import "./style.css";
import { PlayerController } from "./player.js";
import { SolvyrWorld } from "./world.js";
import { loadSave, writeSave } from "./save.js";

const save = loadSave();
const root = document.querySelector("#game");
const start = document.querySelector("#start");
const prompt = document.querySelector("#prompt");
const objective = document.querySelector("#objective");
const locationEl = document.querySelector("#location");
const toast = document.querySelector("#toast");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9aa6a5);
scene.fog = new THREE.FogExp2(0xa1aaaa, 0.0105);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 420);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.03;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xc7d2d1, 0x52604c, 2.2);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe6c4, 3.2);
sun.position.set(38, 62, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 180;
sun.shadow.bias = -0.0005;
scene.add(sun);

const world = new SolvyrWorld(scene, save.world);
const player = new PlayerController(camera, world.colliders, save.player);
let currentInteraction = null;
let toastTimer = 0;
let saveTimer = 0;

function showToast(text, seconds = 3.2) {
  toast.textContent = text;
  toast.classList.add("visible");
  toastTimer = seconds;
}

start.addEventListener("click", () => {
  start.classList.add("hidden");
  player.requestLock();
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement !== document.body) start.classList.remove("hidden");
  else start.classList.add("hidden");
});

addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && currentInteraction && !e.repeat) {
    const result = world.useInteraction(currentInteraction);
    if (result?.text) showToast(result.text, result.type === "gate-opened" ? 4.4 : 3.2);
    if (result?.type === "gate-opened") writeSave(save);
  }
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
let lastObjective = "";

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.033);

  player.update(dt);
  world.update(dt);

  currentInteraction = world.nearestInteraction(player.position);
  if (currentInteraction) {
    currentInteraction.label = save.world.castleGateOpen
      ? "E · Speak to the castle guard"
      : "E · Present yourself to the castle guard";
    prompt.textContent = currentInteraction.label;
    prompt.classList.add("visible");
  } else {
    prompt.classList.remove("visible");
  }

  const zone = world.currentZone(player.position);
  locationEl.textContent = zone?.name || "THE KING'S ROAD · SOLVYN";

  const discovered = world.checkDiscovery(player.position);
  if (discovered) {
    showToast(discovered.name, 2.4);
    writeSave(save);
  }

  const nextObjective = world.objective(player.position);
  if (nextObjective !== lastObjective) {
    lastObjective = nextObjective;
    objective.textContent = nextObjective;
  }

  toastTimer -= dt;
  if (toastTimer <= 0) toast.classList.remove("visible");

  saveTimer += dt;
  if (saveTimer >= 2) {
    saveTimer = 0;
    save.player = player.snapshot();
    writeSave(save);
  }

  renderer.render(scene, camera);
}

showToast("The towers of Solvyr rise ahead through the mountain haze.", 4.2);
frame();
