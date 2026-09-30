import * as THREE from "three";
import "./style.css";
import { PlayerController } from "./player.js";
import { SolvyrWorld } from "./world.js";
import { Ambience } from "./ambience.js";
import { loadSave, writeSave } from "./save.js";

const save = loadSave();
const root = document.querySelector("#game");
const start = document.querySelector("#start");
const prompt = document.querySelector("#prompt");
const objective = document.querySelector("#objective");
const locationEl = document.querySelector("#location");
const toast = document.querySelector("#toast");
const chapter = document.querySelector("#chapter");
const chapterKicker = document.querySelector("#chapter-kicker");
const chapterTitle = document.querySelector("#chapter-title");
const chapterSubtitle = document.querySelector("#chapter-subtitle");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9aa8a6);
scene.fog = new THREE.FogExp2(0xa1aaa6, 0.0083);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.08, 460);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
let renderScale = Math.min(devicePixelRatio, 1.35);
renderer.setPixelRatio(renderScale);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

// A one-draw-call sky dome gives Solvyr a cool mountain morning without texture memory.
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(360, 20, 10),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x6f8285) },
      horizonColor: { value: new THREE.Color(0xb4b7aa) },
      lowColor: { value: new THREE.Color(0xd0b998) }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 lowColor;
      varying vec3 vWorld;
      void main() {
        float h = normalize(vWorld).y;
        vec3 c = mix(horizonColor, topColor, smoothstep(0.02, 0.72, h));
        c = mix(lowColor, c, smoothstep(-0.28, 0.10, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `
  })
);
scene.add(sky);

const hemi = new THREE.HemisphereLight(0xc9d6d3, 0x465548, 1.82);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe2b8, 2.75);
sun.position.set(42, 68, 28);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -62;
sun.shadow.camera.right = 62;
sun.shadow.camera.top = 76;
sun.shadow.camera.bottom = -76;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 190;
sun.shadow.bias = -0.00045;
scene.add(sun);

const world = new SolvyrWorld(scene, save.world);
const player = new PlayerController(camera, world, save.player, renderer.domElement);
const ambience = new Ambience();

let currentInteraction = null;
let toastTimer = 0;
let chapterTimer = 0;
let saveTimer = 0;
let fireTimer = 0;
let currentZoneId = "";
let lastObjective = "";

function showToast(text, seconds = 3.7) {
  if (!text) return;
  toast.textContent = text;
  toast.classList.add("visible");
  toastTimer = seconds;
}

function showChapter(kicker, title, subtitle = "", seconds = 3.8) {
  chapterKicker.textContent = kicker || "";
  chapterTitle.textContent = title || "";
  chapterSubtitle.textContent = subtitle || "";
  chapter.classList.add("visible");
  chapterTimer = seconds;
}

function handleWorldEvent(event) {
  if (event.type === "moment") {
    if (event.title) showChapter(event.kicker, event.title, event.subtitle, 4.1);
    if (event.text) showToast(event.text, 4.7);
  }
  if (event.type === "gate-opened" && event.text) showToast(event.text, 3.8);

  if (event.audio === "bell") ambience.bell();
  if (event.audio === "chime") ambience.chime();
  if (event.audio === "gate") ambience.gateGrind();
}

start.addEventListener("click", () => {
  ambience.start();
  start.classList.add("hidden");
  player.requestLock();
});

document.addEventListener("pointerlockchange", () => {
  const active = document.pointerLockElement === renderer.domElement;
  start.classList.toggle("hidden", active);
});

addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && currentInteraction && !e.repeat && player.locked) {
    const result = world.useInteraction(currentInteraction);
    if (result?.text && result.type !== "gate-opened") showToast(result.text, 4.3);
    save.player = player.snapshot();
    writeSave(save);
  }
});

function resizeRenderer() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(renderScale);
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener("resize", resizeRenderer);

const clock = new THREE.Clock();
let fpsWindow = 0;
let fpsFrames = 0;

function adaptResolution(dt) {
  fpsWindow += dt;
  fpsFrames++;
  if (fpsWindow < 2.2) return;
  const fps = fpsFrames / fpsWindow;
  const maxScale = Math.min(devicePixelRatio, 1.45);
  let next = renderScale;
  if (fps < 45 && renderScale > .92) next = Math.max(.9, renderScale - .1);
  else if (fps > 58 && renderScale < maxScale) next = Math.min(maxScale, renderScale + .05);
  if (Math.abs(next - renderScale) > .01) {
    renderScale = next;
    resizeRenderer();
  }
  fpsWindow = 0;
  fpsFrames = 0;
}

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.033);

  player.update(dt);
  world.update(dt, player.position);

  for (const event of world.drainEvents()) {
    handleWorldEvent(event);
    writeSave(save);
  }

  currentInteraction = world.nearestInteraction(player.position);
  if (currentInteraction) {
    if (currentInteraction.id === "castle-guard") {
      currentInteraction.label = save.world.castleGateOpen
        ? "E · Speak to the castle guard"
        : "E · Present your sealed summons";
    }
    prompt.textContent = currentInteraction.label;
    prompt.classList.add("visible");
  } else {
    prompt.classList.remove("visible");
  }

  const zone = world.currentZone(player.position);
  const zoneId = zone?.id || "wild";
  locationEl.textContent = zone?.name || "THE KING'S ROAD · SOLVYN";
  if (zoneId !== currentZoneId) {
    currentZoneId = zoneId;
    ambience.update(zoneId);
  }

  const discovered = world.checkDiscovery(player.position);
  if (discovered) writeSave(save);

  const nextObjective = world.objective(player.position);
  if (nextObjective !== lastObjective) {
    lastObjective = nextObjective;
    objective.textContent = nextObjective;
  }

  if (player.consumeStep()) {
    ambience.step(player.sprinting, player.position.z < 65);
  }

  toastTimer -= dt;
  if (toastTimer <= 0) toast.classList.remove("visible");

  chapterTimer -= dt;
  if (chapterTimer <= 0) chapter.classList.remove("visible");

  fireTimer += dt;
  if (fireTimer > .72) {
    fireTimer = 0;
    if (zoneId === "great-hall") ambience.firePop();
  }

  saveTimer += dt;
  if (saveTimer >= 2.5) {
    saveTimer = 0;
    save.player = player.snapshot();
    writeSave(save);
  }

  adaptResolution(dt);
  renderer.render(scene, camera);
}

showToast("A sealed summons. A city you have never seen. Solvyr waits beyond the pines.", 5.1);
frame();
